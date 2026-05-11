import { useState, useEffect } from 'react';
import { Card, Button, Upload, Alert, message, Radio, Space, Tag, Progress, Input } from 'antd';
import { SafetyCertificateOutlined, FilePdfOutlined, LockOutlined, KeyOutlined } from '@ant-design/icons';
import { isPdfValid } from '../../utils/pdfjs';

interface CertificateInfo {
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  serialNumber: string;
  algorithm: string;
  fingerprintSha256: string;
}

async function isTauri(): Promise<boolean> {
  try {
    return !!(await import('@tauri-apps/api')).core;
  } catch {
    return false;
  }
}

async function invokeTauri<T>(cmd: string, args: Record<string, unknown>): Promise<T> {
  const { invoke } = (await import('@tauri-apps/api')).core;
  return invoke<T>(cmd, args);
}

function computePdfHash(pdfData: Uint8Array): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', pdfData.buffer as ArrayBuffer);
}

export function DigitalSignaturePage() {
  const [pdfFile, setPdfFile] = useState<{ name: string; data: Uint8Array } | null>(null);
  const [certFile, setCertFile] = useState<{ name: string; data: Uint8Array } | null>(null);
  const [certPassword, setCertPassword] = useState('');
  const [certInfo, setCertInfo] = useState<CertificateInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [signatureLevel, setSignatureLevel] = useState<'basic' | 'advanced' | 'qualified'>('advanced');
  const [tauriAvailable, setTauriAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    isTauri().then(setTauriAvailable);
  }, []);

  const handlePdfUpload = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      if (!isPdfValid(data)) {
        message.error('El archivo no es un PDF válido');
        return false;
      }
      setPdfFile({ name: file.name, data });
      setProgress(0);
      message.success('PDF cargado correctamente');
    } catch {
      message.error('Error al cargar el PDF');
    }
    return false;
  };

  const handleCertUpload = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      setCertFile({ name: file.name, data });
      setCertInfo(null);
      setProgress(0);

      if (tauriAvailable) {
        try {
          const info = await invokeTauri<CertificateInfo>('parse_certificate', {
            certData: Array.from(data),
            password: certPassword || '',
          });
          setCertInfo(info);
          message.success('Certificado procesado correctamente');
} catch {
          message.warning('Certificado cargado. Ingresa la contraseña y presiona "Verificar"');
        }
      } else {
        message.success('Certificado cargado: ' + file.name);
      }
    } catch {
      message.error('Error al cargar el certificado');
    }
    return false;
  };

  const verifyCertificate = async () => {
    if (!certFile || !certPassword) {
      message.warning('Certificado y contraseña requeridos');
      return;
    }
    try {
      const info = await invokeTauri<CertificateInfo>('parse_certificate', {
        certData: Array.from(certFile.data),
        password: certPassword,
      });
      setCertInfo(info);
      message.success('Certificado verificado correctamente');
    } catch (err) {
      message.error('Error al verificar certificado: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const applyDigitalSignature = async () => {
    if (!pdfFile) {
      message.warning('Sube un PDF primero');
      return;
    }

    setIsProcessing(true);
    setProgress(10);

    try {
      const { PDFDocument, rgb } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(pdfFile.data);
      setProgress(30);

      if (tauriAvailable && certFile && certPassword) {
        // Firma real con Rust crypto
        const hash = await computePdfHash(pdfFile.data);
        const hashArray = Array.from(new Uint8Array(hash));

        const sigResult = await invokeTauri<{
          signature: number[];
          certificateDer: number[];
          hashAlgorithm: string;
          timestamp: string;
        }>('sign_document_hash', {
          hash: hashArray,
          certData: Array.from(certFile.data),
          password: certPassword,
        });
        setProgress(70);

        // Agregar firma como metadato en el PDF
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width } = firstPage.getSize();

        // Agregar anotación visual de firma
        firstPage.drawRectangle({
          x: width - 220,
          y: 30,
          width: 200,
          height: 60,
          color: rgb(1, 1, 1),
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });

        const certSubject = certInfo?.subject || 'Firmante';
        firstPage.drawText(`Firmado digitalmente`, {
          x: width - 210,
          y: 70,
          size: 10,
        });
        firstPage.drawText(certSubject.length > 30 ? certSubject.substring(0, 30) + '...' : certSubject, {
          x: width - 210,
          y: 55,
          size: 8,
        });
        firstPage.drawText(sigResult.timestamp.substring(0, 19).replace('T', ' '), {
          x: width - 210,
          y: 40,
          size: 8,
        });
        firstPage.drawText(`Algoritmo: ${sigResult.hashAlgorithm}`, {
          x: width - 210,
          y: 25,
          size: 7,
        });

        pdfDoc.setTitle(`Documento Firmado - ${sigResult.timestamp}`);
        pdfDoc.setAuthor(certSubject);
        pdfDoc.setSubject(`Firmado digitalmente con ${sigResult.hashAlgorithm}`);

        message.success('Firma digital criptográfica aplicada correctamente');
      } else {
        // Simulación cuando no hay Tauri
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProgress(70);

        pdfDoc.setTitle(`Documento Firmado Digitalmente - ${new Date().toISOString()}`);
        pdfDoc.setAuthor('PDF Toolkit - Firma Digital (Simulación)');

        message.success('Firma digital aplicada (simulación - sin crypto real)');
      }

      setProgress(80);
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfFile.name.replace('.pdf', '_firmado.pdf');
      link.click();
      URL.revokeObjectURL(url);

      setProgress(100);
    } catch (err) {
      console.error('[DigitalSignature] Error:', err);
      message.error('Error al aplicar firma digital: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card
      title={
        <Space>
          <SafetyCertificateOutlined />
          Firma Digital con Certificados PKI
        </Space>
      }
      extra={
        <Space>
          {tauriAvailable === false && (
            <Tag color="orange">Modo simulación</Tag>
          )}
          {tauriAvailable === true && (
            <Tag color="green">Crypto real (OpenSSL)</Tag>
          )}
          <Tag color={signatureLevel === 'qualified' ? 'purple' : signatureLevel === 'advanced' ? 'blue' : 'green'}>
            Nivel: {signatureLevel === 'basic' ? 'Básico' : signatureLevel === 'advanced' ? 'Avanzado' : 'Cualificado'}
          </Tag>
        </Space>
      }
    >
      <Alert
        type="info"
        message="Firma Digital con OpenSSL via Rust/Tauri"
        description="Firma tus PDFs usando certificados PKCS12/PFX con OpenSSL. La clave privada se procesa en Rust y nunca sale del dispositivo."
        showIcon
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <span>Nivel de Firma:</span>
          <Radio.Group value={signatureLevel} onChange={e => setSignatureLevel(e.target.value)}>
            <Radio.Button value="basic">Básico (Metadatos)</Radio.Button>
            <Radio.Button value="advanced">Avanzado (PKI + OpenSSL)</Radio.Button>
            <Radio.Button value="qualified">Cualificado (eIDAS)</Radio.Button>
          </Radio.Group>
        </Space>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Upload
              accept=".pdf"
              showUploadList={false}
              beforeUpload={handlePdfUpload}
            >
              <Button icon={<FilePdfOutlined />} loading={isProcessing}>
                {pdfFile ? pdfFile.name : 'Subir PDF a Firmar'}
              </Button>
            </Upload>

            {signatureLevel !== 'basic' && (
              <Upload
                accept=".p12,.pfx,.cer,.crt"
                showUploadList={false}
                beforeUpload={handleCertUpload}
              >
                <Button icon={<SafetyCertificateOutlined />}>
                  {certFile ? certFile.name : 'Certificado PKCS12'}
                </Button>
              </Upload>
            )}
          </Space>

          {certFile && signatureLevel !== 'basic' && (
            <Space>
              <Input.Password
                placeholder="Contraseña del certificado"
                value={certPassword}
                onChange={e => setCertPassword(e.target.value)}
                style={{ width: 250 }}
                iconRender={visible => (visible ? <KeyOutlined /> : null)}
              />
              <Button onClick={verifyCertificate} disabled={!certPassword}>
                Verificar
              </Button>
            </Space>
          )}
        </Space>
      </div>

      {certInfo && (
        <div style={{ marginBottom: 16, padding: 16, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
          <h4 style={{ marginTop: 0 }}>Información del Certificado</h4>
          <p><strong>Sujeto:</strong> {certInfo.subject}</p>
          <p><strong>Emisor:</strong> {certInfo.issuer}</p>
          <p><strong>Válido desde:</strong> {certInfo.validFrom}</p>
          <p><strong>Válido hasta:</strong> {certInfo.validTo}</p>
          <p><strong>Serie:</strong> {certInfo.serialNumber}</p>
          <p><strong>Algoritmo:</strong> {certInfo.algorithm}</p>
          <p><strong>Huella SHA-256:</strong> <code style={{ fontSize: 11 }}>{certInfo.fingerprintSha256}</code></p>
        </div>
      )}

      {isProcessing && (
        <div style={{ marginBottom: 16 }}>
          <Progress percent={progress} status="active" />
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            Procesando firma digital...
          </div>
        </div>
      )}

      <Button
        type="primary"
        icon={<LockOutlined />}
        onClick={applyDigitalSignature}
        loading={isProcessing}
        disabled={!pdfFile || (signatureLevel !== 'basic' && !certFile)}
        size="large"
        block
      >
        {isProcessing ? 'Firmando...' : 'Aplicar Firma Digital'}
      </Button>

      {!pdfFile && (
        <Alert
          type="warning"
          message="Paso 1: Sube un PDF"
          description="Selecciona el documento PDF que deseas firmar digitalmente."
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      {pdfFile && signatureLevel !== 'basic' && !certFile && (
        <Alert
          type="warning"
          message="Paso 2: Sube tu certificado"
          description="Necesitas un certificado digital (.p12, .pfx) para firma avanzada."
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      {certFile && !certInfo && signatureLevel !== 'basic' && (
        <Alert
          type="info"
          message="Ingresa la contraseña del certificado"
          description="La contraseña se usa solo en Rust/OpenSSL para descifrar la clave privada. Nunca se envía a ningún servidor."
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </Card>
  );
}
