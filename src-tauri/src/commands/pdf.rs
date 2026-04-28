use lopdf::{Document, Object, ObjectId};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct PdfMergeRequest {
    pub files: Vec<Vec<u8>>,
    pub page_order: Vec<PageRef>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageRef {
    pub file_index: usize,
    pub page_number: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PdfInfo {
    pub page_count: u32,
    pub file_index: usize,
}

#[tauri::command]
pub fn get_pdf_info(file_data: Vec<u8>, file_index: usize) -> Result<PdfInfo, String> {
    let doc = Document::load_mem(&file_data).map_err(|e| e.to_string())?;
    let page_count = doc.get_pages().len() as u32;
    Ok(PdfInfo {
        page_count,
        file_index,
    })
}

#[tauri::command]
pub fn merge_pdfs(request: PdfMergeRequest) -> Result<Vec<u8>, String> {
    let files = request.files;
    let page_order = request.page_order;

    if files.is_empty() {
        return Err("No files provided".to_string());
    }

    let mut max_id: u32 = 1;
    let mut all_pages: BTreeMap<ObjectId, Object> = BTreeMap::new();
    let mut all_objects: BTreeMap<ObjectId, Object> = BTreeMap::new();
    let mut catalog_id: Option<ObjectId> = None;
    let mut pages_id: Option<ObjectId> = None;
    let mut page_count: u32 = 0;

    for pr in &page_order {
        if pr.file_index >= files.len() {
            return Err(format!("Invalid file index: {}", pr.file_index));
        }

        let mut doc = Document::load_mem(&files[pr.file_index])
            .map_err(|e| format!("Failed to load PDF {}: {}", pr.file_index, e))?;

        doc.renumber_objects_with(max_id);
        max_id = doc.max_id + 1;

        let pages = doc.get_pages();
        let target_page = pr.page_number as usize;

        if target_page == 0 || target_page > pages.len() {
            return Err(format!(
                "Invalid page {} for file {}. File has {} pages",
                pr.page_number, pr.file_index, pages.len()
            ));
        }

        let page_obj_id: ObjectId = *pages.values().nth(target_page - 1).ok_or_else(|| {
            format!("Page {} not found in file {}", pr.page_number, pr.file_index)
        })?;

        let page_obj = doc.get_object(page_obj_id)
            .map_err(|e| e.to_string())?
            .clone();
        all_pages.insert(page_obj_id, page_obj);
        page_count += 1;

        for (obj_id, obj) in doc.objects.iter() {
            let type_bytes = match obj {
                Object::Dictionary(d) => d.get(b"Type").ok().map(|t| t.as_name().ok()).flatten(),
                _ => None,
            };
            
            match type_bytes {
                Some(b"Catalog") => {
                    if catalog_id.is_none() {
                        catalog_id = Some(*obj_id);
                    }
                }
                Some(b"Pages") => {
                    if pages_id.is_none() {
                        pages_id = Some(*obj_id);
                    }
                }
                Some(b"Page") => {}
                _ => {
                    if !all_objects.contains_key(obj_id) {
                        all_objects.insert(*obj_id, obj.clone());
                    }
                }
            }
        }
    }

    let cat_id = catalog_id.ok_or("No Catalog found")?;
    let pgs_id = pages_id.ok_or("No Pages found")?;

    let catalog = all_objects.remove(&cat_id).ok_or("Catalog missing")?;
    let pages_obj = all_objects.remove(&pgs_id).ok_or("Pages missing")?;

    let mut new_catalog = catalog.as_dict().map_err(|e| e.to_string())?.clone();
    new_catalog.set("Pages", pgs_id);
    new_catalog.remove(b"Outlines");

    let mut new_pages = pages_obj.as_dict().map_err(|e| e.to_string())?.clone();
    new_pages.set("Count", page_count);

    let kids: Vec<Object> = all_pages.keys().map(|k| Object::Reference(*k)).collect();
    new_pages.set("Kids", kids);

    let mut new_doc = Document::with_version("1.7");

    for (obj_id, obj) in all_objects.iter() {
        new_doc.objects.insert(*obj_id, obj.clone());
    }

    new_doc.objects.insert(pgs_id, Object::Dictionary(new_pages));
    new_doc.objects.insert(cat_id, Object::Dictionary(new_catalog));

    for (obj_id, page) in all_pages.iter() {
        new_doc.objects.insert(*obj_id, page.clone());
    }

    new_doc.trailer.set("Root", cat_id);
    new_doc.max_id = new_doc.objects.len() as u32;
    new_doc.renumber_objects();
    new_doc.compress();

    let mut buf = Vec::new();
    new_doc.save_to(&mut buf).map_err(|e| e.to_string())?;
    Ok(buf)
}

#[tauri::command]
pub fn extract_pages(file_data: Vec<u8>, pages_to_keep: Vec<u32>) -> Result<Vec<u8>, String> {
    let doc = Document::load_mem(&file_data).map_err(|e| e.to_string())?;
    let all_pages = doc.get_pages();
    let total_pages = all_pages.len() as u32;

    let valid_refs: Vec<PageRef> = pages_to_keep
        .iter()
        .filter(|&&p| p > 0 && p <= total_pages)
        .map(|&p| PageRef {
            file_index: 0,
            page_number: p,
        })
        .collect();

    if valid_refs.is_empty() {
        return Err("No valid pages to extract".to_string());
    }

    merge_pdfs(PdfMergeRequest {
        files: vec![file_data],
        page_order: valid_refs,
    })
}