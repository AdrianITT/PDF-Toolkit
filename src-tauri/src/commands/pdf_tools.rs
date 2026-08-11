use lopdf::{Object, ObjectId};
use serde::{Deserialize, Serialize};
use log::{info, error};
use flate2::write::ZlibEncoder;
use flate2::Compression;
use std::io::Write;

/// Mapea la calidad (0.0 = máxima compresión, 1.0 = máxima calidad) a un nivel de flate2.
/// Para maximizar la compresión a buena velocidad: solo los niveles bajos usan `best()`.
fn flate_level(quality: f32) -> Compression {
    match (quality * 10.0) as u32 {
        0..=3 => Compression::best(),
        4..=6 => Compression::default(),
        _ => Compression::fast(),
    }
}

/// Comprime un stream individual. Devuelve `true` si cambió.
/// - Streams sin filtro: se comprimen con zlib.
/// - Streams ya FlateDecode: se descomprimen y re-comprimen (solo en modo máxima compresión).
/// - Otros filtros (JPEG/JPX/etc.): se dejan intactos (re-comprimirlos los rompería).
/// - Streams de fuentes con clave `Length1`: se omiten (comprimirlos puede corromper la fuente).
fn try_compress_stream(stream: &mut lopdf::Stream, level: Compression) -> bool {
    if stream.dict.get(b"Length1").is_ok() {
        return false;
    }

    let is_image = stream.dict.get(b"Subtype").ok().and_then(|o| o.as_name_str().ok()) == Some("Image");

    // Nota: `stream.filters()` devuelve Err si el stream no tiene clave "Filter",
    // por eso se comprueba la existencia de la clave primero.
    let has_filter = stream.dict.get(b"Filter").is_ok();
    let filters: Vec<String> = if has_filter {
        match stream.filters() {
            Ok(f) => f,
            Err(_) => return false,
        }
    } else {
        Vec::new()
    };

    let plain: Option<Vec<u8>> = if filters.is_empty() {
        Some(stream.content.clone())
    } else if filters.len() == 1
        && filters[0] == "FlateDecode"
        && !is_image
        && level.level() >= 8
    {
        stream.decompressed_content().ok()
    } else {
        None
    };

    let Some(data) = plain else { return false; };

    if data.len() < 20 {
        return false;
    }

    // Evitar trabajo inútil en datos patológicos (descomprimidos gigantes).
    if data.len() > stream.content.len().saturating_mul(20).max(1024 * 1024) {
        return false;
    }

    let mut encoder = ZlibEncoder::new(Vec::new(), level);
    if encoder.write_all(&data).is_err() {
        return false;
    }
    let Ok(compressed) = encoder.finish() else {
        return false;
    };

    // Solo reemplazar si el nuevo comprimido es más pequeño que el contenido actual del stream.
    // (En el caso FlateDecode, `data` es el contenido descomprimido — mucho mayor — por lo que
    //  comparar contra `data.len()` permitiría crecer el stream; siempre se compara contra
    //  `stream.content.len()`, el tamaño real original.)
    if compressed.len() + 19 < stream.content.len() {
        stream.dict.remove(b"DecodeParms");
        stream.dict.set("Filter", Object::Name(b"FlateDecode".to_vec()));
        stream.set_content(compressed);
        true
    } else {
        false
    }
}

/// Re-codifica una imagen incrustada como JPEG con menor calidad y (opcionalmente) menor resolución.
/// Devuelve `true` si se reemplazó el stream.
/// - Solo actúa sobre imágenes DCTDecode (JPEG) o FlateDecode con espacio de color DeviceRGB/DeviceGray.
/// - No toca imágenes con máscara (transparencia), ni las ya muy pequeñas.
/// - Solo reemplaza si el JPEG nuevo queda más pequeño que el contenido actual.
fn try_reencode_image(
    stream: &mut lopdf::Stream,
    jpeg_quality: u8,
    max_dimension: u32,
) -> bool {
    let is_image = stream
        .dict
        .get(b"Subtype")
        .ok()
        .and_then(|o| o.as_name_str().ok())
        == Some("Image");
    if !is_image {
        return false;
    }

    // Omitir imágenes con máscara (transparencia): re-codificarlas las rompería.
    if stream.dict.get(b"SMask").is_ok() || stream.dict.get(b"Mask").is_ok() {
        return false;
    }

    let (width, height) = match (
        stream.dict.get(b"Width").ok().and_then(|o| o.as_i64().ok()),
        stream.dict.get(b"Height").ok().and_then(|o| o.as_i64().ok()),
    ) {
        (Some(w), Some(h)) if w > 0 && h > 0 => (w as u32, h as u32),
        _ => return false,
    };

    // Imágenes muy pequeñas (iconos, logos) no merecen re-codificarse.
    if width * height < 30 * 30 {
        return false;
    }

    // Solo 8 bits por componente.
    if stream
        .dict
        .get(b"BitsPerComponent")
        .ok()
        .and_then(|o| o.as_i64().ok())
        != Some(8)
    {
        return false;
    }

    // Solo DeviceRGB / DeviceGray (sin ICC, indexado, etc.).
    let color_space = match stream.dict.get(b"ColorSpace").ok().and_then(|o| o.as_name_str().ok()) {
        Some("DeviceRGB") => 3,
        Some("DeviceGray") => 1,
        _ => return false,
    };

    // Sin filtro = píxeles crudos; con filtro solo aceptamos DCTDecode o FlateDecode único.
    let has_filter = stream.dict.get(b"Filter").is_ok();
    let filter: Option<String> = if has_filter {
        match stream.filters() {
            Ok(f) if f.len() == 1 => Some(f[0].clone()),
            _ => return false,
        }
    } else {
        None
    };

    // --- Decodificar la imagen a RGB8 ---
    let rgb: image::RgbImage = match filter.as_deref() {
        None | Some("FlateDecode") => {
            let raw = match &filter {
                None => stream.content.clone(),
                Some(_) => match stream.decompressed_content() {
                    Ok(r) => r,
                    Err(_) => return false,
                },
            };
            if color_space == 1 {
                // DeviceGray: 1 byte por píxel
                let len = width * height;
                if raw.len() != len as usize {
                    return false;
                }
                match image::RgbImage::from_raw(width, height, {
                    let mut v = Vec::with_capacity(raw.len() * 3);
                    for &b in &raw {
                        v.extend_from_slice(&[b, b, b]);
                    }
                    v
                }) {
                    Some(img) => img,
                    None => return false,
                }
            } else {
                let len = width * height * 3;
                if raw.len() != len as usize {
                    return false;
                }
                match image::RgbImage::from_raw(width, height, raw) {
                    Some(img) => img,
                    None => return false,
                }
            }
        }
        Some("DCTDecode") => match image::load_from_memory(&stream.content) {
            Ok(img) => img.to_rgb8(),
            Err(_) => return false,
        },
        _ => return false,
    };

    // --- Reducir resolución si es grande ---
    let (new_width, new_height) = if rgb.width() > max_dimension || rgb.height() > max_dimension {
        let scale = max_dimension as f32 / rgb.width().max(rgb.height()) as f32;
        let nw = ((rgb.width() as f32 * scale).round() as u32).max(1);
        let nh = ((rgb.height() as f32 * scale).round() as u32).max(1);
        let resized = image::imageops::resize(
            &rgb,
            nw,
            nh,
            image::imageops::FilterType::Triangle,
        );
        (resized.width(), resized.height())
    } else {
        (rgb.width(), rgb.height())
    };

    let final_rgb = if new_width != rgb.width() || new_height != rgb.height() {
        image::imageops::resize(
            &rgb,
            new_width,
            new_height,
            image::imageops::FilterType::Triangle,
        )
    } else {
        rgb
    };

    // --- Codificar como JPEG ---
    let mut out = Vec::new();
    let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut out, jpeg_quality);
    if encoder
        .encode(
            &final_rgb,
            new_width,
            new_height,
            image::ExtendedColorType::Rgb8,
        )
        .is_err()
    {
        return false;
    }

    // Solo reemplazar si queda más pequeño (con margen de 5%).
    if out.len() + 5 > stream.content.len() * 95 / 100 {
        return false;
    }

    stream.dict.remove(b"DecodeParms");
    stream.dict.set("Filter", Object::Name(b"DCTDecode".to_vec()));
    stream.dict.set("ColorSpace", Object::Name(b"DeviceRGB".to_vec()));
    stream.dict.set("BitsPerComponent", Object::Integer(8));
    stream.dict.set("Width", Object::Integer(new_width as i64));
    stream.dict.set("Height", Object::Integer(new_height as i64));
    stream.set_content(out);
    true
}

#[tauri::command]
pub fn compress_pdf(file_data: Vec<u8>, quality: f32) -> Result<Vec<u8>, String> {
    let original_size = file_data.len();
    info!(
        "Iniciando compresión - Tamaño original: {} bytes, Calidad: {}%",
        original_size,
        (quality * 100.0) as i32
    );

    let mut doc = lopdf::Document::load_mem(&file_data).map_err(|e| {
        error!("Error cargando PDF: {}", e);
        e.to_string()
    })?;

    let level = flate_level(quality);

    let objects = doc.objects.clone();
    let obj_ids: Vec<ObjectId> = objects.keys().copied().collect();

    // Re-codificación de imágenes: SOLO en modo «Máxima» (quality ≤ 0.3).
    // Balanceada/Rápida dejan las imágenes intactas (sin pérdida de calidad).
    let mut reencoded_images = 0;
    let mut total_image_saved = 0;

    if quality <= 0.3 {
        let (jpeg_quality, max_dimension) = (42, 1400);

        for obj_id in &obj_ids {
            if let Ok(obj) = doc.get_object_mut(*obj_id) {
                if let Object::Stream(ref mut stream) = obj {
                    let before = stream.content.len();
                    if before > 100 && try_reencode_image(stream, jpeg_quality, max_dimension) {
                        reencoded_images += 1;
                        total_image_saved += before - stream.content.len();
                    }
                }
            }
        }
        if reencoded_images > 0 {
            info!(
                "Imágenes re-codificadas: {}, ahorro: {} bytes",
                reencoded_images, total_image_saved
            );
        }
    }

    let mut compressed_streams = 0;
    let mut total_saved = 0;

    for obj_id in obj_ids {
        if let Ok(obj) = doc.get_object_mut(obj_id) {
            if let Object::Stream(ref mut stream) = obj {
                let stream_size = stream.content.len();
                if stream_size > 50 && try_compress_stream(stream, level) {
                    compressed_streams += 1;
                    total_saved += stream_size - stream.content.len();
                }
            }
        }
    }

    // Limpieza: elimina streams vacíos y objetos huérfanos (solo referenciados por nadie).
    let zero_length_removed = doc.delete_zero_length_streams();
    let pruned = doc.prune_objects();
    if !pruned.is_empty() {
        doc.renumber_objects();
    }
    info!(
        "Limpieza - streams vacíos eliminados: {}, objetos huérfanos: {}",
        zero_length_removed.len(),
        pruned.len()
    );

    let mut buf = Vec::new();
    doc.save_to(&mut buf).map_err(|e| {
        error!("Error guardando PDF comprimido: {}", e);
        e.to_string()
    })?;

    let final_size = buf.len();
    let savings = if original_size > 0 {
        ((original_size.saturating_sub(final_size)) as f64 / original_size as f64 * 100.0) as i32
    } else {
        0
    };

    info!(
        "Compresión completada - Streams comprimidos: {}, Ahorro: {} bytes ({}%), Tamaño final: {} bytes",
        compressed_streams, total_saved, savings, final_size
    );

    Ok(buf)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RotateRequest {
    pub file_data: Vec<u8>,
    pub pages: Vec<u32>,
    pub rotation: i32,
}

#[tauri::command]
pub fn rotate_pages(request: RotateRequest) -> Result<Vec<u8>, String> {
    let mut doc = lopdf::Document::load_mem(&request.file_data).map_err(|e| e.to_string())?;
    let pages = doc.get_pages();

    for page_num in &request.pages {
        if let Some(obj_id) = pages.get(page_num) {
            if let Ok(page_dict) = doc.get_object_mut(*obj_id) {
                if let Object::Dictionary(ref mut dict) = page_dict {
                    let current_rotation: i64 = dict
                        .get(b"Rotate")
                        .ok()
                        .and_then(|r| r.as_i64().ok())
                        .unwrap_or(0);

                    let new_rotation = (current_rotation + request.rotation as i64) % 360;
                    dict.set("Rotate", Object::Integer(new_rotation));
                }
            }
        }
    }

    let mut buf = Vec::new();
    doc.save_to(&mut buf).map_err(|e| e.to_string())?;
    Ok(buf)
}

#[tauri::command]
pub fn protect_pdf(file_data: Vec<u8>, user_password: Option<String>, owner_password: Option<String>) -> Result<Vec<u8>, String> {
    let user_pw = user_password.unwrap_or_default();
    let owner_pw = owner_password.unwrap_or_else(|| user_pw.clone());
    
    if user_pw.is_empty() && owner_pw.is_empty() {
        return Err("Debes proporcionar al menos una contraseña".to_string());
    }
    
    info!("Proteciendo PDF - user: {}, owner: {}", !user_pw.is_empty(), !owner_pw.is_empty());
    
    let mut doc = lopdf::Document::load_mem(&file_data)
        .map_err(|e| e.to_string())?;
    
    let owner_bytes: Vec<u8> = owner_pw.as_bytes().to_vec();
    let user_bytes: Vec<u8> = user_pw.as_bytes().to_vec();
    
    let o_hash = simple_hash(&owner_bytes);
    let u_hash = simple_hash(&user_bytes);
    
    let perm: i32 = -4;
    let perm_bytes = perm.to_le_bytes();
    let perm_hash = simple_hash(&perm_bytes);
    
    let new_obj_id = (doc.objects.len() as u32 + 1, 0);
    
    let mut encrypt_dict = lopdf::Dictionary::new();
    encrypt_dict.set("Filter", lopdf::Object::Name(b"Standard".to_vec()));
    encrypt_dict.set("R", lopdf::Object::Integer(4));
    encrypt_dict.set("V", lopdf::Object::Integer(4));
    encrypt_dict.set("Length", lopdf::Object::Integer(128));
    encrypt_dict.set("O", lopdf::Object::String(o_hash, lopdf::StringFormat::Literal));
    encrypt_dict.set("U", lopdf::Object::String(u_hash, lopdf::StringFormat::Literal));
    encrypt_dict.set("P", lopdf::Object::Integer(-3900));
    encrypt_dict.set("PERMS", lopdf::Object::String(perm_hash, lopdf::StringFormat::Literal));
    
    doc.objects.insert(new_obj_id, lopdf::Object::Dictionary(encrypt_dict));
    doc.trailer.set("Encrypt", lopdf::Object::Reference(new_obj_id));
    
    let mut buf = Vec::new();
    doc.save_to(&mut buf).map_err(|e| e.to_string())?;
    
    info!("PDF marcado como encriptado - tamaño: {} bytes", buf.len());
    Ok(buf)
}

fn simple_hash(data: &[u8]) -> Vec<u8> {
    let mut hash: u64 = 5381;
    for &byte in data {
        hash = hash.wrapping_mul(33).wrapping_add(byte as u64);
    }
    let mut result = Vec::with_capacity(16);
    for i in 0..16 {
        result.push(((hash >> (i * 4)) & 0xFF) as u8);
    }
    result
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeletePagesRequest {
    pub file_data: Vec<u8>,
    pub pages_to_delete: Vec<u32>,
}

#[tauri::command]
pub fn delete_pages(request: DeletePagesRequest) -> Result<Vec<u8>, String> {
    let mut doc = lopdf::Document::load_mem(&request.file_data).map_err(|e| e.to_string())?;
    let pages = doc.get_pages();

    let mut delete_ids: Vec<ObjectId> = Vec::new();
    for page_num in &request.pages_to_delete {
        if let Some(obj_id) = pages.get(page_num) {
            delete_ids.push(*obj_id);
        }
    }

    for obj_id in delete_ids {
        let _ = doc.delete_object(obj_id);
    }

    let mut buf = Vec::new();
    doc.save_to(&mut buf).map_err(|e| e.to_string())?;
    Ok(buf)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SplitRequest {
    pub file_data: Vec<u8>,
    pub page_ranges: Vec<String>,
}

#[tauri::command]
pub fn split_pdf(request: SplitRequest) -> Result<Vec<Vec<u8>>, String> {
    let file_data = &request.file_data;
    
    let max_pages = {
        let doc = lopdf::Document::load_mem(file_data).map_err(|e| e.to_string())?;
        let count = doc.get_pages().len() as u32;
        info!("PDF cargado con {} páginas", count);
        count
    };

    if request.page_ranges.is_empty() {
        return Err("No se especificó ningún rango de páginas".to_string());
    }

    info!("Rangos solicitados: {:?}", request.page_ranges);

    let mut results: Vec<Vec<u8>> = Vec::new();

    let original_doc = lopdf::Document::load_mem(file_data).map_err(|e| e.to_string())?;
    let original_page_ids: Vec<(u32, ObjectId)> = original_doc.get_pages()
        .iter()
        .map(|(k, v)| (*k, *v))
        .collect();
    
    info!("Páginas originales: {:?}", original_page_ids.iter().map(|(k,_)| k).collect::<Vec<_>>());

    for (idx, range) in request.page_ranges.iter().enumerate() {
        let pages_to_keep: Vec<u32> = parse_page_range(range, max_pages);
        info!("Rango {} '{}' -> páginas a mantener: {:?}", idx + 1, range, pages_to_keep);

        if pages_to_keep.is_empty() {
            info!("Rango {} vacío, continuando", idx + 1);
            continue;
        }

        let mut new_doc = original_doc.clone();
        
        let pages = new_doc.get_pages();
        let page_ids: Vec<(u32, ObjectId)> = pages.iter()
            .map(|(k, v)| (*k, *v))
            .collect();
        
        let mut ids_to_delete: Vec<ObjectId> = Vec::new();
        
        for (page_num, obj_id) in page_ids.iter() {
            if !pages_to_keep.contains(page_num) {
                ids_to_delete.push(*obj_id);
            }
        }

        info!("Eliminando {} objetos en parte {}", ids_to_delete.len(), idx + 1);

        for obj_id in ids_to_delete {
            let _ = new_doc.delete_object(obj_id);
        }

        let mut buf = Vec::new();
        new_doc.save_to(&mut buf).map_err(|e| e.to_string())?;

        info!("Parte {} generada, tamaño: {} bytes", idx + 1, buf.len());

        if buf.len() > 100 {
            results.push(buf);
        } else {
            error!("Parte {} demasiado pequeña: {} bytes", idx + 1, buf.len());
        }
    }

    info!("Total de partes generadas: {}", results.len());

    if results.is_empty() {
        return Err("No se generó ningún archivo. Verifica los rangos de páginas.".to_string());
    }

    Ok(results)
}

fn parse_page_range(range: &str, max_pages: u32) -> Vec<u32> {
    let range = range.trim();
    
    if range.is_empty() {
        return Vec::new();
    }
    
    let mut pages = Vec::new();
    
    for part in range.split(',') {
        let part = part.trim();
        if part.is_empty() {
            continue;
        }
        
        if part.contains('-') {
            let parts: Vec<&str> = part.split('-').collect();
            if parts.len() >= 2 {
                let start = parts[0].trim().parse::<u32>().unwrap_or(1);
                let end = parts[1].trim().parse::<u32>().unwrap_or(max_pages);
                let start = start.max(1).min(max_pages);
                let end = end.max(start).min(max_pages);
                for i in start..=end {
                    if !pages.contains(&i) {
                        pages.push(i);
                    }
                }
            }
        } else if let Ok(num) = part.parse::<u32>() {
            let num = num.max(1).min(max_pages);
            if !pages.contains(&num) {
                pages.push(num);
            }
        }
    }
    
    pages.sort();
    pages
}
#[cfg(test)]
mod tests {
    use super::*;

    /// Genera un PDF con contenido repetitivo (altamente comprimible).
    fn build_sample_pdf(pages: u32) -> Vec<u8> {
        let mut doc = lopdf::Document::with_version("1.7");
        let mut stream = Vec::new();
        for i in 0..2000 {
            stream.extend_from_slice(
                format!("BT /F1 12 Tf 72 {} Td (Linea repetitiva de texto {}) Tj ET\n", 700 - (i % 50) as i32, i % 100).as_bytes(),
            );
        }

        let pages_id = doc.add_object(lopdf::Object::Dictionary(lopdf::Dictionary::from_iter([
            ("Type", lopdf::Object::Name(b"Pages".to_vec())),
            ("Kids", lopdf::Object::Array(vec![])),
            ("Count", lopdf::Object::Integer(0)),
        ])));

        let mut kids = Vec::new();
        for _ in 0..pages {
            let content_id = doc.add_object(lopdf::Object::Stream(lopdf::Stream::new(
                lopdf::Dictionary::new(),
                stream.clone(),
            )));
            let resources_id = doc.add_object(lopdf::Object::Dictionary(lopdf::Dictionary::new()));
            let page_id = doc.add_object(lopdf::Object::Dictionary(lopdf::Dictionary::from_iter([
                ("Type", lopdf::Object::Name(b"Page".to_vec())),
                ("Parent", lopdf::Object::Reference(pages_id)),
                (
                    "MediaBox",
                    lopdf::Object::Array(vec![
                        lopdf::Object::Integer(0),
                        lopdf::Object::Integer(0),
                        lopdf::Object::Integer(612),
                        lopdf::Object::Integer(792),
                    ]),
                ),
                ("Resources", lopdf::Object::Reference(resources_id)),
                ("Contents", lopdf::Object::Reference(content_id)),
            ])));
            kids.push(lopdf::Object::Reference(page_id));
        }

        if let Ok(dict) = doc.objects.get_mut(&pages_id).unwrap().as_dict_mut() {
            dict.set("Kids", lopdf::Object::Array(kids));
            dict.set("Count", pages as i64);
        }

        let root_id = doc.add_object(lopdf::Object::Dictionary(lopdf::Dictionary::from_iter([
            ("Type", lopdf::Object::Name(b"Catalog".to_vec())),
            ("Pages", lopdf::Object::Reference(pages_id)),
        ])));
        doc.trailer.set("Root", lopdf::Object::Reference(root_id));

        let mut buf = Vec::new();
        doc.save_to(&mut buf).unwrap();
        buf
    }

    #[test]
    fn compress_reduces_size_and_stays_valid() {
        let input = build_sample_pdf(2);
        let output = compress_pdf(input.clone(), 0.15).expect("compress should not fail");

        assert!(output.len() < input.len(), "compressed ({}) should be smaller than original ({})", output.len(), input.len());
        assert!(
            input.len() > output.len() * 2,
            "expected at least 2x reduction, got {} -> {}",
            input.len(),
            output.len()
        );

        let doc = lopdf::Document::load_mem(&output).expect("compressed PDF must be loadable");
        assert_eq!(doc.get_pages().len(), 2, "must keep all pages");
    }

    #[test]
    fn compress_high_quality_keeps_valid_pdf() {
        let input = build_sample_pdf(1);
        let output = compress_pdf(input.clone(), 0.9).expect("compress should not fail");
        assert!(output.len() < input.len());
        let doc = lopdf::Document::load_mem(&output).expect("compressed PDF must be loadable");
        assert_eq!(doc.get_pages().len(), 1);
    }

    #[test]
    fn compress_invalid_input_returns_error() {
        let result = compress_pdf(vec![1, 2, 3, 4, 5], 0.5);
        assert!(result.is_err(), "garbage input should error");
    }

    #[test]
    fn compress_reencodes_image_streams() {
        // PDF con una imagen grande DeviceRGB en FlateDecode (sin comprimir) → debe re-codificarse.
        let width = 400u32;
        let height = 300u32;
        let mut raw = Vec::new();
        for y in 0..height {
            for x in 0..width {
                raw.extend_from_slice(&[(x % 256) as u8, (y % 256) as u8, ((x + y) % 256) as u8]);
            }
        }

        let mut doc = lopdf::Document::with_version("1.7");
        let img_dict = lopdf::Dictionary::from_iter([
            ("Type", lopdf::Object::Name(b"XObject".to_vec())),
            ("Subtype", lopdf::Object::Name(b"Image".to_vec())),
            ("Width", lopdf::Object::Integer(width as i64)),
            ("Height", lopdf::Object::Integer(height as i64)),
            ("ColorSpace", lopdf::Object::Name(b"DeviceRGB".to_vec())),
            ("BitsPerComponent", lopdf::Object::Integer(8)),
        ]);
        let img_id = doc.add_object(lopdf::Object::Stream(lopdf::Stream::new(img_dict, raw.clone())));

        let pages_id = doc.add_object(lopdf::Object::Dictionary(lopdf::Dictionary::from_iter([
            ("Type", lopdf::Object::Name(b"Pages".to_vec())),
            ("Kids", lopdf::Object::Array(vec![])),
            ("Count", lopdf::Object::Integer(0)),
        ])));

        let resources_id = doc.add_object(lopdf::Object::Dictionary(lopdf::Dictionary::from_iter([
            (
                "XObject",
                lopdf::Object::Dictionary(lopdf::Dictionary::from_iter([(
                    "Im1",
                    lopdf::Object::Reference(img_id),
                )])),
            ),
        ])));

        let page_id = doc.add_object(lopdf::Object::Dictionary(lopdf::Dictionary::from_iter([
            ("Type", lopdf::Object::Name(b"Page".to_vec())),
            ("Parent", lopdf::Object::Reference(pages_id)),
            (
                "MediaBox",
                lopdf::Object::Array(vec![
                    lopdf::Object::Integer(0),
                    lopdf::Object::Integer(0),
                    lopdf::Object::Integer(612),
                    lopdf::Object::Integer(792),
                ]),
            ),
            ("Resources", lopdf::Object::Reference(resources_id)),
        ])));

        if let Ok(dict) = doc.objects.get_mut(&pages_id).unwrap().as_dict_mut() {
            dict.set("Kids", lopdf::Object::Array(vec![lopdf::Object::Reference(page_id)]));
            dict.set("Count", 1 as i64);
        }

        let root_id = doc.add_object(lopdf::Object::Dictionary(lopdf::Dictionary::from_iter([
            ("Type", lopdf::Object::Name(b"Catalog".to_vec())),
            ("Pages", lopdf::Object::Reference(pages_id)),
        ])));
        doc.trailer.set("Root", lopdf::Object::Reference(root_id));

        let mut buf = Vec::new();
        doc.save_to(&mut buf).unwrap();
        let input = buf;

        let output = compress_pdf(input.clone(), 0.15).expect("compress should not fail");
        assert!(
            output.len() < input.len(),
            "re-encoding image should shrink: {} -> {}",
            input.len(),
            output.len()
        );

        let out_doc = lopdf::Document::load_mem(&output).expect("compressed PDF must be loadable");
        assert_eq!(out_doc.get_pages().len(), 1);
        let obj = out_doc.get_object(img_id).unwrap();
        if let lopdf::Object::Stream(s) = obj {
            let filt = s.dict.get(b"Filter").unwrap();
            assert_eq!(filt.as_name_str().unwrap(), "DCTDecode");
        } else {
            panic!("image object should be a stream");
        }
    }
}
