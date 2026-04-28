use std::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ConversionResult {
    pub success: bool,
    pub output_path: Option<String>,
    pub error: Option<String>,
}

fn find_libreoffice_path() -> Option<String> {
    let candidates = vec![
        "/Applications/LibreOffice.app/Contents/MacOS/soffice",
        "/usr/bin/libreoffice",
        "/usr/bin/soffice",
        "/opt/homebrew/bin/libreoffice",
    ];

    for path in candidates {
        if std::path::Path::new(path).exists() {
            return Some(path.to_string());
        }
    }
    None
}

#[tauri::command]
pub fn check_libreoffice() -> bool {
    find_libreoffice_path().is_some()
}

#[tauri::command]
pub fn convert_to_pdf(input_path: String, output_filename: String) -> Result<String, String> {
    let soffice_path = find_libreoffice_path().ok_or_else(|| {
        "LibreOffice not found. Please install LibreOffice from https://www.libreoffice.org".to_string()
    })?;

    let temp_dir = std::env::temp_dir();
    let output_path = temp_dir.join(&output_filename);

    let output_dir = output_path.parent().unwrap();

    let mut cmd = Command::new(&soffice_path);
    cmd.arg("--headless")
        .arg("--convert-to")
        .arg("pdf")
        .arg("--outdir")
        .arg(output_dir);

    if let Ok(home) = std::env::var("HOME") {
        cmd.env("HOME", format!("{}/.libreoffice-temp-{}", home, std::process::id()));
    }

    cmd.arg(&input_path);

    let output = cmd.output().map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(output_path.to_string_lossy().to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Conversion failed: {}", stderr))
    }
}