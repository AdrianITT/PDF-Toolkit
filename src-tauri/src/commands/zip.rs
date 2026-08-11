use log::{error, info};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use tauri::ipc::Channel;
use zip::write::SimpleFileOptions;
use zip::CompressionMethod;

#[derive(Debug, Serialize, Deserialize)]
pub struct ZipRequest {
    /// Rutas absolutas de archivos o carpetas a comprimir.
    pub paths: Vec<String>,
    /// Nivel de compresión deflate: 1-9 = flate2 (9 = máxima), 10-264 = Zopfli
    /// (iteraciones = nivel - 9; el frontend usa 39 = 30 iteraciones, punto óptimo).
    pub level: u16,
    /// Nombre sugerido del archivo ZIP de salida (sin ruta).
    pub output_name: String,
}

/// Evento de progreso enviado al frontend mientras se comprime.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ZipProgress {
    /// Bytes de entrada ya procesados.
    pub processed_bytes: u64,
    /// Bytes de entrada totales a comprimir.
    pub total_bytes: u64,
    /// Archivo que se está comprimiendo en este momento.
    pub current_file: Option<String>,
}

/// Recorre `path` de forma recursiva y recoge (ruta, nombre zip, tamaño) de cada archivo.
fn collect_files(
    path: &Path,
    prefix: &str,
    out: &mut Vec<(PathBuf, String, u64)>,
) -> Result<(), String> {
    let meta = fs::metadata(path).map_err(|e| {
        error!("zip: metadata {}: {}", path.display(), e);
        format!("No se pudo leer «{}»: {}", path.display(), e)
    })?;

    if meta.is_dir() {
        let entries = fs::read_dir(path).map_err(|e| {
            error!("zip: read_dir {}: {}", path.display(), e);
            format!("No se pudo leer la carpeta «{}»: {}", path.display(), e)
        })?;
        for entry in entries {
            let entry = entry.map_err(|e| e.to_string())?;
            let name = entry.file_name().to_string_lossy().to_string();
            let sub_prefix = if prefix.is_empty() {
                name
            } else {
                format!("{}/{}", prefix, name)
            };
            collect_files(&entry.path(), &sub_prefix, out)?;
        }
    } else if meta.is_file() {
        let name = if prefix.is_empty() {
            path.file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| "archivo".to_string())
        } else {
            prefix.to_string()
        };
        out.push((path.to_path_buf(), name, meta.len()));
    }
    Ok(())
}

/// Núcleo de compresión (síncrono, testeable). Devuelve los bytes del ZIP.
fn compress_to_bytes(
    request: &ZipRequest,
    level: u16,
    mut on_progress: impl FnMut(ZipProgress),
) -> Result<Vec<u8>, String> {
    // Niveles 1-9 → flate2 (deflate clásico); 10-264 → Zopfli (más pequeño, más lento).
    // La crate `zip` limita el rango a 1..=264; 264 = 255 iteraciones de Zopfli.
    let level = level.min(264).max(1);
    let engine = if level > 9 { "zopfli" } else { "flate2" };
    info!(
        "Creando ZIP - elementos: {}, nivel: {} ({}), salida: {}",
        request.paths.len(),
        level,
        engine,
        request.output_name
    );

    let mut files: Vec<(PathBuf, String, u64)> = Vec::new();
    for path_str in &request.paths {
        let path = PathBuf::from(path_str);
        if !path.exists() {
            error!("zip: ruta inexistente {}", path_str);
            return Err(format!("La ruta «{}» no existe", path_str));
        }
        collect_files(&path, "", &mut files)?;
    }
    if files.is_empty() {
        return Err("No se encontraron archivos para comprimir".to_string());
    }

    let total_bytes: u64 = files.iter().map(|f| f.2).sum();
    info!(
        "ZIP - total: {} archivos, {} bytes",
        files.len(),
        total_bytes
    );

    let mut zip = zip::ZipWriter::new(std::io::Cursor::new(Vec::new()));
    let options = SimpleFileOptions::default()
        .compression_method(CompressionMethod::Deflated)
        .compression_level(Some(level as i64))
        .large_file(true);

    // Con Zopfli, el `zip` crate trocea la entrada con un BufWriter de 32 KB por
    // defecto, lo que rompe la redundancia entre trozos y empeora el ratio (a veces
    // incluso por debajo de flate2-9). Usamos bloques maestros de 1 MB (el tamaño que
    // recomienda la crate `zopfli`).
    let options = if level > 9 {
        options.with_zopfli_buffer(Some(1_000_000))
    } else {
        options
    };

    let mut processed = 0u64;
    let mut buf = vec![0u8; 1024 * 1024];

    for (path, name, _size) in &files {
        zip.start_file(name.clone(), options)
            .map_err(|e| format!("Error creando entrada «{}»: {}", name, e))?;

        let mut file = fs::File::open(path).map_err(|e| {
            error!("zip: open {}: {}", path.display(), e);
            format!("No se pudo abrir «{}»: {}", path.display(), e)
        })?;

        loop {
            let n = file.read(&mut buf).map_err(|e| {
                error!("zip: read {}: {}", path.display(), e);
                format!("Error leyendo «{}»: {}", name, e)
            })?;
            if n == 0 {
                break;
            }
            zip.write_all(&buf[..n]).map_err(|e| {
                error!("zip: write {}: {}", path.display(), e);
                format!("Error escribiendo «{}»: {}", name, e)
            })?;
            processed += n as u64;
            on_progress(ZipProgress {
                processed_bytes: processed,
                total_bytes,
                current_file: Some(name.clone()),
            });
        }
    }

    let cursor = zip.finish().map_err(|e| {
        error!("zip: finish: {}", e);
        format!("Error finalizando el ZIP: {}", e)
    })?;
    let bytes = cursor.into_inner();

    on_progress(ZipProgress {
        processed_bytes: total_bytes,
        total_bytes,
        current_file: None,
    });

    info!(
        "ZIP creado - archivos: {}, total: {} bytes, zip: {} bytes, motor: {}, nombre: {}",
        files.len(),
        total_bytes,
        bytes.len(),
        engine,
        request.output_name
    );

    Ok(bytes)
}

/// Crea un archivo ZIP en memoria y reporta el progreso por el canal de Tauri.
/// `async` para no bloquear el main thread (el frontend recibe el progreso en vivo).
#[tauri::command]
pub async fn create_zip(
    request: ZipRequest,
    on_progress: Channel<ZipProgress>,
) -> Result<Vec<u8>, String> {
    if request.paths.is_empty() {
        return Err("No se seleccionó ningún archivo o carpeta".to_string());
    }

    let level = request.level;
    compress_to_bytes(&request, level, |progress| {
        let _ = on_progress.send(progress);
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Read;

    #[test]
    fn zip_single_file_roundtrip() {
        let dir = std::env::temp_dir().join("pdf_toolkit_zip_test");
        fs::create_dir_all(&dir).unwrap();
        let file_path = dir.join("hola.txt");
        fs::write(&file_path, b"contenido de prueba repetido repetido repetido").unwrap();

        let request = ZipRequest {
            paths: vec![file_path.to_string_lossy().to_string()],
            level: 9,
            output_name: "test.zip".to_string(),
        };

        let bytes = compress_to_bytes(&request, 9, |_| {}).expect("zip should not fail");
        assert!(bytes.len() > 0);

        // Verificar que es un ZIP válido y contiene el archivo.
        let cursor = std::io::Cursor::new(bytes);
        let mut archive = zip::ZipArchive::new(cursor).expect("valid zip");
        assert_eq!(archive.len(), 1);
        let mut file = archive.by_name("hola.txt").expect("file in zip");
        let mut content = String::new();
        file.read_to_string(&mut content).unwrap();
        assert_eq!(content, "contenido de prueba repetido repetido repetido");

        fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn zip_folder_recursive() {
        let dir = std::env::temp_dir().join("pdf_toolkit_zip_dir_test");
        fs::create_dir_all(dir.join("sub")).unwrap();
        fs::write(dir.join("a.txt"), b"aaaa bbbb cccc").unwrap();
        fs::write(dir.join("sub/b.txt"), b"bbbb cccc dddd").unwrap();

        let request = ZipRequest {
            paths: vec![dir.to_string_lossy().to_string()],
            level: 9,
            output_name: "carpeta".to_string(),
        };
        let bytes = compress_to_bytes(&request, 9, |_| {}).expect("zip should not fail");

        let cursor = std::io::Cursor::new(bytes);
        let mut archive = zip::ZipArchive::new(cursor).expect("valid zip");
        let names: Vec<String> = (0..archive.len())
            .map(|i| archive.by_index(i).unwrap().name().to_string())
            .collect();
        assert!(names.contains(&"a.txt".to_string()));
        assert!(names.contains(&"sub/b.txt".to_string()));

        fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn zip_empty_paths_errors() {
        let request = ZipRequest {
            paths: vec![],
            level: 9,
            output_name: "x.zip".to_string(),
        };
        assert!(compress_to_bytes(&request, 9, |_| {}).is_err());
    }

    #[test]
    fn zopfli_compresses_at_least_as_small_as_flate2() {
        let dir = std::env::temp_dir().join("pdf_toolkit_zopfli_test");
        fs::create_dir_all(&dir).unwrap();
        let content = "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n".repeat(320);
        for i in 0..3 {
            fs::write(dir.join(format!("doc_{i}.txt")), content.as_bytes()).unwrap();
        }

        let make_zip = |level: u16| {
            let request = ZipRequest {
                paths: vec![dir.to_string_lossy().to_string()],
                level,
                output_name: "test".to_string(),
            };
            compress_to_bytes(&request, level, |_| {}).expect("zip should not fail")
        };

        let flate2 = make_zip(9);
        let zopfli = make_zip(24);
        assert!(
            zopfli.len() <= flate2.len(),
            "zopfli ({}) debe ser <= flate2 ({})",
            zopfli.len(),
            flate2.len()
        );

        // El ZIP con Zopfli sigue siendo un deflate válido y extraíble.
        let cursor = std::io::Cursor::new(zopfli);
        let mut archive = zip::ZipArchive::new(cursor).expect("valid zip");
        assert_eq!(archive.len(), 3);
        let mut file = archive.by_name("doc_0.txt").expect("file in zip");
        let mut roundtrip = String::new();
        file.read_to_string(&mut roundtrip).unwrap();
        assert_eq!(roundtrip, content);

        fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn progress_is_reported_monotonically() {
        let dir = std::env::temp_dir().join("pdf_toolkit_zip_progress_test");
        fs::create_dir_all(dir.join("sub")).unwrap();
        fs::write(dir.join("a.txt"), vec![b'a'; 256 * 1024]).unwrap();
        fs::write(dir.join("sub/b.txt"), vec![b'b'; 128 * 1024]).unwrap();

        let request = ZipRequest {
            paths: vec![dir.to_string_lossy().to_string()],
            level: 1,
            output_name: "p.zip".to_string(),
        };

        let mut events: Vec<(u64, u64, bool)> = Vec::new();
        compress_to_bytes(&request, 1, |p| {
            events.push((p.processed_bytes, p.total_bytes, p.current_file.is_some()));
        })
        .expect("zip should not fail");

        // El total debe coincidir con la suma de los archivos.
        assert_eq!(events.last().unwrap().0, events.last().unwrap().1);
        // El progreso debe ser no decreciente y terminar en 100%.
        assert_eq!(events.last().unwrap().0, 384 * 1024);
        let mut last = 0u64;
        for (processed, total, has_file) in &events {
            assert!(*processed >= last);
            assert!(*processed <= *total);
            assert!(*total >= 384 * 1024);
            last = *processed;
            let _ = has_file;
        }
        // Debe haber más de un evento (progreso incremental).
        assert!(events.len() > 1);

        fs::remove_dir_all(&dir).ok();
    }
}
