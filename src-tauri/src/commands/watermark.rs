use lopdf::Object;
use lopdf::Document;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatermarkConfig {
    pub text: String,
    pub font_size: f32,
    pub color_r: f32,
    pub color_g: f32,
    pub color_b: f32,
    pub opacity: f32,
    pub position: String,
    pub rotation: i32,
    pub first_page_only: bool,
}

impl Default for WatermarkConfig {
    fn default() -> Self {
        Self {
            text: "WATERMARK".to_string(),
            font_size: 48.0,
            color_r: 0.7,
            color_g: 0.7,
            color_b: 0.7,
            opacity: 0.3,
            position: "center".to_string(),
            rotation: -45,
            first_page_only: false,
        }
    }
}

#[tauri::command]
pub fn add_watermark(
    pdf_data: Vec<u8>,
    config: WatermarkConfig,
) -> Result<Vec<u8>, String> {
    let mut doc = Document::load_mem(&pdf_data).map_err(|e| e.to_string())?;
    
    if config.text.is_empty() {
        return Err("No watermark text provided".to_string());
    }

    let pages = doc.get_pages();
    let page_count = pages.len();
    
    if page_count == 0 {
        return Err("PDF has no pages".to_string());
    }

    println!("[watermark] Adding '{}' to {} pages", config.text, page_count);

    let radians = (config.rotation as f32) * std::f32::consts::PI / 180.0;
    let cos_r = radians.cos();
    let sin_r = radians.sin();

    let text_escaped = config.text.replace("(", "\\(").replace(")", "\\)");

    let pages_to_process = if config.first_page_only { 1 } else { page_count };
    let page_obj_ids: Vec<(u32, u16)> = pages.values().cloned().take(pages_to_process).collect();
    
    for page_obj_id in page_obj_ids {
        let (x, y): (f32, f32);
        
        match config.position.as_str() {
            "topLeft" => { x = 50.0; y = 750.0; }
            "topRight" => { x = 450.0; y = 750.0; }
            "bottomLeft" => { x = 50.0; y = 50.0; }
            "bottomRight" => { x = 450.0; y = 50.0; }
            _ => { x = 200.0; y = 400.0; }
        };

        let stream_content = format!(
            "q\n{} {} {} rg\nBT\n/F1 {} Tf\n{} {} {} {} {} {} 0 cm\n{} {} Td\n({}) Tj\nET\nQ",
            config.color_r, config.color_g, config.color_b,
            config.font_size,
            cos_r, sin_r, -sin_r, cos_r, 0.0, 0.0,
            x, y,
            text_escaped
        );

        let watermark_id = doc.max_id + 1;
        doc.max_id = watermark_id;
        let obj_id = (watermark_id, 0);

        let stream_dict = lopdf::Dictionary::from_iter([
            ("Length", Object::Integer(stream_content.len() as i64)),
        ]);

        let watermark_stream = Object::Stream(lopdf::Stream {
            content: stream_content.into_bytes(),
            dict: stream_dict,
            allows_compression: true,
            start_position: Some(0),
        });

        doc.objects.insert(obj_id, watermark_stream);

        if let Ok(page_dict) = doc.get_object_mut(page_obj_id) {
            if let Object::Dictionary(ref mut dict) = page_dict {
                let existing_contents = dict.get(b"Contents").ok();
                
                let new_contents = match existing_contents {
                    Some(Object::Reference(ref_id)) => {
                        Object::Array(vec![Object::Reference(*ref_id), Object::Reference(obj_id)])
                    }
                    Some(Object::Array(arr)) => {
                        let mut new_arr = arr.clone();
                        new_arr.push(Object::Reference(obj_id));
                        Object::Array(new_arr)
                    }
                    _ => {
                        Object::Array(vec![Object::Reference(obj_id)])
                    }
                };
                
                dict.set("Contents", new_contents);
            }
        }
    }
    
    let mut buf = Vec::new();
    doc.save_to(&mut buf).map_err(|e| e.to_string())?;
    
    println!("[watermark] Done, output size: {} bytes", buf.len());
    Ok(buf)
}