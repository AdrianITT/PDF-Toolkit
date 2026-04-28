use lopdf::{Object, ObjectId};
use serde::{Deserialize, Serialize};

#[tauri::command]
pub fn compress_pdf(file_data: Vec<u8>, _quality: f32) -> Result<Vec<u8>, String> {
    let mut doc = lopdf::Document::load_mem(&file_data).map_err(|e| e.to_string())?;
    let mut buf = Vec::new();
    doc.save_to(&mut buf).map_err(|e| e.to_string())?;
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
pub fn protect_pdf(_file_data: Vec<u8>, _user_password: Option<String>, _owner_password: Option<String>) -> Result<Vec<u8>, String> {
    Err("La protección con contraseña requiere dependencias adicionales. Usa un PDF existente.".to_string())
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
    let file_data = request.file_data.clone();
    let max_pages = {
        let doc = lopdf::Document::load_mem(&file_data).map_err(|e| e.to_string())?;
        doc.get_pages().len() as u32
    };

    let mut results: Vec<Vec<u8>> = Vec::new();

    for range in &request.page_ranges {
        let pages_to_keep: Vec<u32> = parse_page_range(range, max_pages);

        let mut new_doc = lopdf::Document::load_mem(&file_data).map_err(|e| e.to_string())?;
        let pages = new_doc.get_pages();
        let all_page_keys: Vec<u32> = pages.keys().cloned().collect();

        let mut to_delete: Vec<ObjectId> = Vec::new();
        for (i, page_key) in all_page_keys.iter().enumerate() {
            if !pages_to_keep.contains(&(i as u32 + 1)) {
                if let Some(obj_id) = pages.get(page_key) {
                    to_delete.push(*obj_id);
                }
            }
        }

        for obj_id in to_delete {
            let _ = new_doc.delete_object(obj_id);
        }

        let mut buf = Vec::new();
        new_doc.save_to(&mut buf).map_err(|e| e.to_string())?;

        if buf.len() > 0 {
            results.push(buf);
        }
    }

    Ok(results)
}

fn parse_page_range(range: &str, max_pages: u32) -> Vec<u32> {
    let mut pages = Vec::new();
    for part in range.split(',') {
        let part = part.trim();
        if part.contains('-') {
            let parts: Vec<&str> = part.split('-').collect();
            if parts.len() == 2 {
                let start = parts[0].parse::<u32>().unwrap_or(1).saturating_sub(1);
                let end = parts[1].parse::<u32>().unwrap_or(max_pages).saturating_sub(1);
                for i in start..=end.min(max_pages.saturating_sub(1)) {
                    pages.push(i + 1);
                }
            }
        } else if let Ok(num) = part.parse::<u32>() {
            if num > 0 && num <= max_pages {
                pages.push(num);
            }
        }
    }
    pages
}