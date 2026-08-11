import { useState } from 'react';
import {
  Card,
  Button,
  Row,
  Col,
  message,
  Typography,
  Upload,
  Space,
  Tag,
  Progress,
  Radio,
  Empty,
  Alert,
} from 'antd';
import {
  CompressOutlined,
  UploadOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';

const { Text } = Typography;

interface CompressedFile {
  file: File;
  compressedSize: number;
  elapsedMs: number;
  engine: 'rust' | 'browser';
}

type QualityLevel = 'max' | 'balanced' | 'fast';

const QUALITY_LEVELS: Record<QualityLevel, { label: string; hint: string; quality: number }> = {
  max: { label: 'Máxima', hint: 'Menor tamaño (re-codifica imágenes)', quality: 0.15 },
  balanced: { label: 'Balanceada', hint: 'Compresión y velocidad', quality: 0.5 },
  fast: { label: 'Rápida', hint: 'Máxima velocidad', quality: 0.85 },
};

async function isTauriRuntime(): Promise<boolean> {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function hasPdfHeader(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 && // '%'
    bytes[1] === 0x50 && // 'P'
    bytes[2] === 0x44 && // 'D'
    bytes[3] === 0x46 && // 'F'
    bytes[4] === 0x2d // '-'
  );
}

function detectFileType(bytes: Uint8Array): string {
  if (hasPdfHeader(bytes)) return 'PDF';
  const firstFour = Array.from(bytes.slice(0, 4));
  if (firstFour[0] === 0x50 && firstFour[1] === 0x4b) {
    const zipKind = bytes[2] === 0x03 ? 'ZIP' : bytes[2] === 0x05 ? 'ZIP (vacío)' : 'ZIP (auto-extraíble)';
    return `${zipKind} (firma PK\\x03\\x04 — posible .docx/.xlsx/.zip renombrado a .pdf)`;
  }
  if (
    firstFour[0] === 0xff &&
    firstFour[1] === 0xd8 &&
    firstFour[2] === 0xff
  ) {
    return 'JPEG';
  }
  if (
    firstFour[0] === 0x89 &&
    firstFour[1] === 0x50 &&
    firstFour[2] === 0x4e &&
    firstFour[3] === 0x47
  ) {
    return 'PNG';
  }
  return `desconocido (primeros bytes: ${Array.from(bytes.slice(0, 4)).join(',')})`;
}

function formatElapsed(ms: number): string {
  if (ms < 1000) return ms + ' ms';
  return (ms / 1000).toFixed(2) + ' s';
}

export function PdfCompressorPage() {
  const [pdfFile, setPdfFile] = useState<CompressedFile | null>(null);
  const [quality, setQuality] = useState<QualityLevel>('max');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (info: { fileList: { originFileObj?: File }[] }) => {
    if (info.fileList.length === 0) return;

    const file = info.fileList[0]?.originFileObj;
    if (!file) return;

    try {
      const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
      if (!hasPdfHeader(header)) {
        const detected = detectFileType(header);
        message.error(
          `«${file.name}» no es un PDF válido. Tipo detectado: ${detected}.`,
        );
        console.error(
          `[PDF Compress] Archivo rechazado: "${file.name}" (${formatFileSize(file.size)}).`,
          'Primeros bytes:', Array.from(header),
        );
        return;
      }
    } catch (err) {
      message.error('No se pudo leer el archivo seleccionado.');
      console.error('[PDF Compress] Error al validar cabecera:', err);
      return;
    }

    setPdfFile({ file, compressedSize: 0, elapsedMs: 0, engine: 'browser' });
    setProgress(0);
  };

  const compressWithRust = async (fileData: Uint8Array): Promise<Uint8Array> => {
    const { invoke } = await import('@tauri-apps/api/core');
    const result = await invoke<number[]>('compress_pdf', {
      fileData: Array.from(fileData),
      quality: QUALITY_LEVELS[quality].quality,
    });
    return new Uint8Array(result);
  };

  const compressWithBrowser = async (arrayBuffer: ArrayBuffer): Promise<Uint8Array> => {
    const sourcePdf = await PDFDocument.load(arrayBuffer, { updateMetadata: false });
    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    copiedPages.forEach((page) => newPdf.addPage(page));
    const pdfBytes = await newPdf.save({ useObjectStreams: true });
    return new Uint8Array(pdfBytes);
  };

  const handleCompress = async () => {
    if (!pdfFile) return;

    setIsProcessing(true);
    setProgress(10);

    const start = Date.now();

    try {
      const arrayBuffer = await pdfFile.file.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);
      setProgress(30);

      const inTauri = await isTauriRuntime();

      let resultBytes: Uint8Array | null = null;
      let engine: 'rust' | 'browser' = 'browser';

      if (inTauri) {
        try {
          resultBytes = await compressWithRust(fileData);
          engine = 'rust';
        } catch (err) {
          console.error('[PDF Compress] Error en motor Rust, usando fallback web:', err);
        }
      }

      if (!resultBytes) {
        resultBytes = await compressWithBrowser(arrayBuffer);
      }

      setProgress(70);

      const elapsedMs = Date.now() - start;
      const filename = pdfFile.file.name.replace(/\.pdf$/i, '-comprimido.pdf');
      const buffer = new ArrayBuffer(resultBytes.byteLength);
      new Uint8Array(buffer).set(resultBytes);
      const blob = new Blob([buffer], { type: 'application/pdf' });

      setProgress(90);

      if (inTauri) {
        try {
          const { save } = await import('@tauri-apps/plugin-dialog');
          const { writeFile } = await import('@tauri-apps/plugin-fs');
          const filePath = await save({
            defaultPath: filename,
            filters: [{ name: 'PDF', extensions: ['pdf'] }],
          });
          if (filePath) {
            await writeFile(filePath, resultBytes);
            message.success('PDF comprimido y guardado');
            setPdfFile({ file: pdfFile.file, compressedSize: resultBytes.byteLength, elapsedMs, engine });
            setProgress(100);
            return;
          }
        } catch (err) {
          console.error('[PDF Compress] Error al guardar:', err);
        }
      }

      saveAs(blob, filename);
      setPdfFile({ file: pdfFile.file, compressedSize: resultBytes.byteLength, elapsedMs, engine });
      message.success('PDF comprimido correctamente');
      setProgress(100);
    } catch (err) {
      console.error('[PDF Compress] Error:', err);
      const msg =
        err instanceof Error && err.message.includes('No PDF header found')
          ? 'El archivo no es un PDF válido (falta la cabecera %PDF-).'
          : 'Error al comprimir el PDF. Verifica que el archivo sea un PDF válido y sin daños.';
      message.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setPdfFile(null);
    setProgress(0);
  };

  const originalSize = pdfFile?.file.size ?? 0;
  const reductionPercent = pdfFile && pdfFile.compressedSize > 0
    ? Math.round((1 - pdfFile.compressedSize / originalSize) * 100)
    : 0;

  return (
    <Card
      title={
        <Space>
          <CompressOutlined />
          <span>Compresor de PDFs</span>
        </Space>
      }
      extra={
        pdfFile && (
          <Button onClick={handleClear} icon={<DeleteOutlined />} disabled={isProcessing}>
            Limpiar
          </Button>
        )
      }
    >
      <Alert
        message="Máxima compresión"
        description="Reduce el tamaño del PDF re-comprimiendo sus streams y eliminando objetos huérfanos. En modo «Máxima» además re-codifica las imágenes incrustadas a menor calidad y resolución (irreversible, pueden perder nitidez). En la app de escritorio usa el motor nativo Rust; en el navegador usa el motor de respaldo."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={24}>
        <Col xs={24} lg={14}>
          <Card size="small" title="1. Seleccionar archivo" style={{ marginBottom: 16 }}>
            {!pdfFile ? (
              <Upload
                accept=".pdf"
                showUploadList={false}
                beforeUpload={() => false}
                onChange={handleFileChange}
                disabled={isProcessing}
              >
                <Button icon={<UploadOutlined />} block>
                  Seleccionar archivo PDF
                </Button>
              </Upload>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Tag color="red" icon={<FilePdfOutlined />} style={{ padding: 8 }}>
                  <Text strong>{pdfFile.file.name}</Text>
                  <br />
                  <Text type="secondary">
                    Tamaño original: {formatFileSize(originalSize)}
                  </Text>
                </Tag>
              </Space>
            )}
          </Card>

          {pdfFile && (
            <Card size="small" title="2. Nivel de compresión">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio.Group
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  disabled={isProcessing}
                >
                  {Object.entries(QUALITY_LEVELS).map(([key, cfg]) => (
                    <Radio.Button key={key} value={key}>
                      <Space>
                        <span>{cfg.label}</span>
                        <Text type="secondary">({cfg.hint})</Text>
                      </Space>
                    </Radio.Button>
                  ))}
                </Radio.Group>
                <Text type="secondary">
                  Modo «Máxima» comprime al máximo nivel pero tarda un poco más; «Rápida» prioriza la velocidad.
                </Text>
              </Space>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={10}>
          <Card size="small" title="3. Resultado">
            {pdfFile ? (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div style={{ textAlign: 'center', padding: 16 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">Tamaño original</Text>
                    <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                      {formatFileSize(originalSize)}
                    </div>
                  </div>

                  {pdfFile.compressedSize > 0 && (
                    <>
                      <CompressOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">Tamaño comprimido</Text>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                          {formatFileSize(pdfFile.compressedSize)}
                        </div>
                        <Space size={4} wrap>
                          <Tag color={reductionPercent > 0 ? 'green' : 'orange'}>
                            {reductionPercent > 0 ? `-${reductionPercent}%` : '0%'}
                          </Tag>
                          <Tag icon={<ThunderboltOutlined />} color="blue">
                            {formatElapsed(pdfFile.elapsedMs)}
                          </Tag>
                          <Tag color="geekblue">
                            Motor: {pdfFile.engine === 'rust' ? 'Rust (nativo)' : 'Web (respaldo)'}
                          </Tag>
                        </Space>
                      </div>
                    </>
                  )}
                </div>

                <Button
                  type="primary"
                  icon={<CompressOutlined />}
                  onClick={handleCompress}
                  loading={isProcessing}
                  block
                  size="large"
                >
                  {isProcessing
                    ? `Comprimiendo... ${progress}%`
                    : pdfFile.compressedSize > 0
                      ? 'Comprimir de nuevo'
                      : 'Comprimir PDF'}
                </Button>

                {isProcessing && <Progress percent={progress} status="active" />}
              </Space>
            ) : (
              <Empty description="Selecciona un archivo PDF para comprimir" />
            )}
          </Card>
        </Col>
      </Row>
    </Card>
  );
}
