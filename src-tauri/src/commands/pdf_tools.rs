use lopdf::{Object, ObjectId};
use serde::{Deserialize, Serialize};
use log::{info, error};
use flate2::write::ZlibEncoder;
use flate2::Compression;
use std::io::Write;

#[tauri::command]
pub fn compress_pdf(file_data: Vec<u8>, quality: f32) -> Result<Vec<u8>, String> {
    let original_size = file_data.len();
    info!("Iniciando compresión - Tamaño original: {} bytes, Calidad: {}%", original_size, (quality * 100.0) as i32);
    
    let mut doc = lopdf::Document::load_mem(&file_data)
        .map_err(|e| {
            error!("Error cargando PDF: {}", e);
            e.to_string()
        })?;
    
    let mut compressed_streams = 0;
    let mut total_saved = 0;
    
    let objects = doc.objects.clone();
    let obj_ids: Vec<ObjectId> = objects.keys().copied().collect();
    
    for obj_id in obj_ids {
        if let Ok(obj) = doc.get_object_mut(obj_id) {
            if let Object::Stream(ref mut stream) = obj {
                let stream_size = stream.content.len();
                
                if stream_size > 100 {
                    let has_filter = stream.dict.get(b"Filter").is_ok();
                    
                    if !has_filter || stream_size > 4096 {
                        let compression_level = match (quality * 10.0) as u32 {
                            0..=3 => Compression::none(),
                            4..=6 => Compression::fast(),
                            7..=8 => Compression::default(),
                            _ => Compression::best(),
                        };
                        
                        let mut encoder = ZlibEncoder::new(Vec::new(), compression_level);
                        if encoder.write_all(&stream.content).is_ok() {
                            if let Ok(compressed) = encoder.finish() {
                                if compressed.len() < stream.content.len() {
                                    stream.content = compressed;
                                    stream.dict.set("Filter", Object::Name(b"FlateDecode".to_vec()));
                                    compressed_streams += 1;
                                    total_saved += stream_size - stream.content.len();
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    let mut buf = Vec::new();
    doc.save_to(&mut buf).map_err(|e| {
        error!("Error guardando PDF comprimido: {}", e);
        e.to_string()
    })?;
    
    let final_size = buf.len();
    let savings = if original_size > 0 {
        ((original_size - final_size) as f64 / original_size as f64 * 100.0) as i32
    } else {
        0
    };
    
    info!("Compresión completada - Streams comprimidos: {}, Ahorro: {} bytes ({}%), Tamaño final: {} bytes", 
          compressed_streams, total_saved, savings, final_size);
    
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