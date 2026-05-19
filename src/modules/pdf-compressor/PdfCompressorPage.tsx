import { useState } from 'react';
import {
  Card,
  Button,
  Row,
  Col,
  message,
  Typography,
  Slider,
  Upload,
  Space,
  Tag,
  Progress,
  Radio,
  Empty,
} from 'antd';
import {
  CompressOutlined,
  UploadOutlined,
  DeleteOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';

const { Text } = Typography;

interface PDFFile {
  name: string;
  size: number;
  originalSize: number;
  file: File;
}

type QualityLevel = 'high' | 'medium' | 'low';

export function PdfCompressorPage() {
  const [pdfFile, setPdfFile] = useState<PDFFile | null>(null);
  const [quality, setQuality] = useState<QualityLevel>('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const estimatedReduction = () => {
    switch (quality) {
      case 'high': return 20;
      case 'medium': return 40;
      case 'low': return 60;
    }
  };

  const handleFileChange = async (info: any) => {
    if (info.fileList.length === 0) return;
    
    const file = info.file.originFileObj;
    if (!file) return;
    
    setPdfFile({
      name: file.name,
      size: file.size,
      originalSize: file.size,
      file,
    });
    setProgress(0);
  };

  const handleCompress = async () => {
    if (!pdfFile) return;

    setIsProcessing(true);
    setProgress(10);

    try {
      // Load the PDF
      const arrayBuffer = await pdfFile.file.arrayBuffer();
      setProgress(30);
      
      // Create a new PDF and copy pages (this removes unused objects)
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();
      
      const copiedPages = await newPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
      
      setProgress(60);
      
      copiedPages.forEach(page => newPdf.addPage(page));
      
      const pdfBytes = await newPdf.save();
      setProgress(90);
      
      const uint8Array = new Uint8Array(pdfBytes);
      const newBlob = new Blob([uint8Array], { type: 'application/pdf' });
      const newSize = newBlob.size;
      
      // Check for Tauri
      let isTauri = false;
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('get_pdf_info', { path: '' });
        isTauri = true;
      } catch { isTauri = false; }
      
      const filename = pdfFile.name.replace('.pdf', '-comprimido.pdf');
      
      if (isTauri) {
        try {
          const { save } = await import('@tauri-apps/plugin-dialog');
          const { writeFile } = await import('@tauri-apps/plugin-fs');
          const filePath = await save({
            defaultPath: filename,
            filters: [{ name: 'PDF', extensions: ['pdf'] }]
          });
          if (filePath) {
            await writeFile(filePath, new Uint8Array(pdfBytes));
            message.success('PDF comprimido guardado');
            setPdfFile({
              ...pdfFile,
              size: newSize,
            });
            setProgress(100);
            setIsProcessing(false);
            return;
          }
        } catch { /* fallback */ }
      }
      
      saveAs(newBlob, filename);
      
      setPdfFile({
        ...pdfFile,
        size: newSize,
      });
      
      message.success('PDF comprimido correctamente');
      setProgress(100);
    } catch (err) {
      console.error('[PDF Compress] Error:', err);
      message.error('Error al comprimir PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setPdfFile(null);
    setProgress(0);
  };

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
          <Button onClick={handleClear} icon={<DeleteOutlined />}>
            Limpiar
          </Button>
        )
      }
    >
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
                  <Text strong>{pdfFile.name}</Text>
                  <br />
                  <Text type="secondary">
                    Tamaño original: {formatFileSize(pdfFile.originalSize)}
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
                >
                  <Radio.Button value="high">
                    <Space>
                      <span>Alta</span>
                      <Text type="secondary">(Mejor calidad)</Text>
                    </Space>
                  </Radio.Button>
                  <Radio.Button value="medium">
                    <Space>
                      <span>Media</span>
                      <Text type="secondary">(Balanceado)</Text>
                    </Space>
                  </Radio.Button>
                  <Radio.Button value="low">
                    <Space>
                      <span>Baja</span>
                      <Text type="secondary">(Menor tamaño)</Text>
                    </Space>
                  </Radio.Button>
                </Radio.Group>

                <div>
                  <Text>Reducción estimada: ~{estimatedReduction()}%</Text>
                  <Slider 
                    value={estimatedReduction()} 
                    disabled 
                    tooltip={{ formatter: () => `${estimatedReduction()}% menor` }}
                  />
                </div>
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
                      {formatFileSize(pdfFile.originalSize)}
                    </div>
                  </div>
                  
                  {pdfFile.size !== pdfFile.originalSize && (
                    <>
                      <CompressOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">Tamaño comprimido</Text>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                          {formatFileSize(pdfFile.size)}
                        </div>
                        <Tag color="green">
                          -{Math.round((1 - pdfFile.size / pdfFile.originalSize) * 100)}%
                        </Tag>
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
                  disabled={!pdfFile}
                >
                  {isProcessing 
                    ? `Comprimiendo... ${progress}%` 
                    : pdfFile.size !== pdfFile.originalSize 
                      ? 'Comprimir de nuevo' 
                      : 'Comprimir PDF'
                  }
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