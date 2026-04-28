mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::pdf::get_pdf_info,
            commands::pdf::merge_pdfs,
            commands::pdf::extract_pages,
            commands::converter::check_libreoffice,
            commands::converter::convert_to_pdf,
            commands::watermark::add_watermark,
            commands::pdf_tools::compress_pdf,
            commands::pdf_tools::rotate_pages,
            commands::pdf_tools::protect_pdf,
            commands::pdf_tools::delete_pages,
            commands::pdf_tools::split_pdf,
        ])
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}