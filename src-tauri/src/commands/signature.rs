use openssl::pkcs12::Pkcs12;
use openssl::hash::MessageDigest;
use openssl::sign::Signer;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct CertificateInfo {
    pub issuer: String,
    pub subject: String,
    pub valid_from: String,
    pub valid_to: String,
    pub serial_number: String,
    pub algorithm: String,
    pub fingerprint_sha256: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SignatureResult {
    pub signature: Vec<u8>,
    pub certificate_der: Vec<u8>,
    pub hash_algorithm: String,
    pub timestamp: String,
}

#[tauri::command]
pub fn parse_certificate(cert_data: Vec<u8>, password: String) -> Result<CertificateInfo, String> {
    let pkcs12 = Pkcs12::from_der(&cert_data).map_err(|e| format!("Error al leer PKCS12: {}", e))?;
    let parsed = pkcs12.parse2(&password).map_err(|e| format!("Error al descifrar PKCS12 (contraseña incorrecta?): {}", e))?;

    let cert = parsed.cert.as_ref().ok_or("No se encontró certificado en el archivo")?;

    let subject = cert.subject_name().entries_by_nid(openssl::nid::Nid::COMMONNAME)
        .next().and_then(|e| e.data().as_utf8().ok())
        .map(|s| s.to_string())
        .unwrap_or_else(|| format!("{:?}", cert.subject_name()));

    let issuer = cert.issuer_name().entries_by_nid(openssl::nid::Nid::COMMONNAME)
        .next().and_then(|e| e.data().as_utf8().ok())
        .map(|s| s.to_string())
        .unwrap_or_else(|| format!("{:?}", cert.issuer_name()));

    let valid_from = cert.not_before().to_string();
    let valid_to = cert.not_after().to_string();
    let serial_number = cert.serial_number().to_bn().ok().and_then(|bn| bn.to_dec_str().ok()).map(|s| s.to_string()).unwrap_or_else(|| "desconocido".to_string());

    let fingerprint = cert.digest(MessageDigest::sha256())
        .map_err(|e| format!("Error al calcular fingerprint: {}", e))?
        .to_vec();
    let fingerprint_hex = fingerprint.iter()
        .map(|b| format!("{:02X}", b))
        .collect::<Vec<_>>()
        .join(":");

    let sig_alg = cert.signature_algorithm().object()
        .nid().long_name().ok().map(|s| s.to_string())
        .unwrap_or_else(|| "desconocido".to_string());

    Ok(CertificateInfo {
        issuer,
        subject,
        valid_from,
        valid_to,
        serial_number,
        algorithm: sig_alg,
        fingerprint_sha256: fingerprint_hex,
    })
}

#[tauri::command]
pub fn sign_document_hash(
    hash: Vec<u8>,
    cert_data: Vec<u8>,
    password: String,
) -> Result<SignatureResult, String> {
    let pkcs12 = Pkcs12::from_der(&cert_data)
        .map_err(|e| format!("Error al leer PKCS12: {}", e))?;
    let parsed = pkcs12.parse2(&password)
        .map_err(|e| format!("Error al descifrar PKCS12: {}", e))?;

    let pkey = parsed.pkey.as_ref().ok_or("No se encontró clave privada en el archivo")?;
    let cert = parsed.cert.as_ref().ok_or("No se encontró certificado")?;

    // Determinar algoritmo basado en el tipo de clave
    let (hash_alg, hash_name) = if pkey.id() == openssl::pkey::Id::RSA {
        (MessageDigest::sha256(), "SHA-256")
    } else if pkey.id() == openssl::pkey::Id::EC {
        (MessageDigest::sha256(), "SHA-256-ECDSA")
    } else {
        (MessageDigest::sha256(), "SHA-256")
    };

    let mut signer = Signer::new(hash_alg, pkey)
        .map_err(|e| format!("Error al crear firmante: {}", e))?;
    let signature = signer
        .sign_oneshot_to_vec(&hash)
        .map_err(|e| format!("Error al firmar: {}", e))?;

    let cert_der = cert.to_der()
        .map_err(|e| format!("Error al serializar certificado: {}", e))?;

    let now = chrono::Utc::now();
    let timestamp = now.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string();

    Ok(SignatureResult {
        signature,
        certificate_der: cert_der,
        hash_algorithm: hash_name.to_string(),
        timestamp,
    })
}

#[tauri::command]
pub fn get_certificate_public_key(cert_data: Vec<u8>, password: String) -> Result<Vec<u8>, String> {
    let pkcs12 = Pkcs12::from_der(&cert_data)
        .map_err(|e| format!("Error al leer PKCS12: {}", e))?;
    let parsed = pkcs12.parse2(&password)
        .map_err(|e| format!("Error al descifrar PKCS12: {}", e))?;

    let pkey = parsed.pkey.as_ref().ok_or("No se encontró clave privada")?;
    let pub_key = pkey.public_key_to_der()
        .map_err(|e| format!("Error al exportar clave pública: {}", e))?;

    Ok(pub_key)
}
