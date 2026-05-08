import { useState } from 'react';
import { Card, Button, Upload, Alert, Input, Space, Tag, message, Form, Checkbox } from 'antd';
import { FileTextOutlined, FilePdfOutlined, SaveOutlined } from '@ant-design/icons';
import { isPdfValid } from '../../utils/pdfjs';

interface PdfMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate: string | Date;
  modificationDate: string | Date;
}

export function MetadataEditorPage() {
  const [pdfFile, setPdfFile] = useState<{ name: string; data: Uint8Array } | null>(null);
  const [metadata, setMetadata] = useState<PdfMetadata>({
    title: '',
    author: '',
    subject: '',
    keywords: '',
    creator: '',
    producer: '',
    creationDate: '',
    modificationDate: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [stampMetadata, setStampMetadata] = useState(false);

  const handleFileUpload = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      
      if (!isPdfValid(data)) {
        message.error('El archivo no es un PDF válido');
        return false;
      }
      
      setPdfFile({ name: file.name, data });
      setIsDirty(false);
      
      // Leer metadatos
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(data);
      
      const title = pdfDoc.getTitle() || '';
      const author = pdfDoc.getAuthor() || '';
      const subject = pdfDoc.getSubject() || '';
      const keywords = pdfDoc.getKeywords() || '';
      const creator = pdfDoc.getCreator() || '';
      const producer = pdfDoc.getProducer() || '';
      const creationDate = pdfDoc.getCreationDate() || '';
      const modificationDate = pdfDoc.getModificationDate() || '';
      
      setMetadata({
        title,
        author,
        subject,
        keywords,
        creator,
        producer,
        creationDate,
        modificationDate,
      });
      
      message.success('PDF cargado. Metadatos leídos.');
    } catch (err) {
      console.error('[Metadata] Error:', err);
      message.error('Error al cargar el PDF');
    }
    return false;
  };

  const handleFieldChange = (field: keyof PdfMetadata, value: string) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const saveMetadata = async () => {
    if (!pdfFile) {
      message.warning('Sube un PDF primero');
      return;
    }

    setIsProcessing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(pdfFile.data);
      
      // Actualizar metadatos
      if (metadata.title) pdfDoc.setTitle(metadata.title);
      if (metadata.author) pdfDoc.setAuthor(metadata.author);
      if (metadata.subject) pdfDoc.setSubject(metadata.subject);
      if (metadata.keywords) pdfDoc.setKeywords((metadata.keywords as string).split(',').map(k => k.trim()));

      if (stampMetadata) {
        const pages = pdfDoc.getPages();
        if (pages.length > 0) {
          const firstPage = pages[0];
          const { height } = firstPage.getSize();
          const { StandardFonts, rgb } = await import('pdf-lib');
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          
          firstPage.drawRectangle({
            x: 20, y: height - 120, width: 300, height: 100,
            color: rgb(0.95, 0.95, 0.95),
            borderColor: rgb(0.5, 0.5, 0.5),
            borderWidth: 1,
          });

          firstPage.drawText('Metadatos del Documento:', { x: 30, y: height - 40, size: 12, font, color: rgb(0, 0, 0) });
          firstPage.drawText(`Título: ${metadata.title}`, { x: 30, y: height - 60, size: 10, font });
          firstPage.drawText(`Autor: ${metadata.author}`, { x: 30, y: height - 75, size: 10, font });
          firstPage.drawText(`Asunto: ${metadata.subject}`, { x: 30, y: height - 90, size: 10, font });
          firstPage.drawText(`Palabras Clave: ${metadata.keywords}`, { x: 30, y: height - 105, size: 10, font });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfFile.name.replace('.pdf', '_metadata.pdf');
      link.click();
      URL.revokeObjectURL(url);
      
      setIsDirty(false);
      message.success('Metadatos actualizados y PDF descargado');
    } catch (err) {
      console.error('[Metadata] Error:', err);
      message.error('Error al guardar metadatos');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearMetadata = () => {
    setMetadata({
      title: '',
      author: '',
      subject: '',
      keywords: '',
      creator: '',
      producer: '',
      creationDate: '',
      modificationDate: '',
    });
    setIsDirty(true);
    message.info('Campos limpiados');
  };

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined />
          Editor de Metadatos PDF
        </Space>
      }
      extra={
        <Space>
          <Tag color="blue">PDF Info</Tag>
          {isDirty && <Tag color="orange">Sin guardar</Tag>}
        </Space>
      }
    >
      <Alert
        type="info"
        message="¿Qué son los Metadatos y dónde se ven?"
        description="Los metadatos son propiedades invisibles del archivo (leídas por el Sistema Operativo, Google, etc.). Si deseas que los datos sean visibles para el lector, selecciona la opción 'Estampar metadatos' antes de guardar."
        showIcon
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Upload
          accept=".pdf"
          showUploadList={false}
          beforeUpload={handleFileUpload}
        >
          <Button icon={<FilePdfOutlined />} loading={isProcessing}>
            {pdfFile ? pdfFile.name : 'Subir PDF'}
          </Button>
        </Upload>
      </div>

      {pdfFile && (
        <Form layout="vertical" style={{ maxWidth: 600 }}>
          <Form.Item label="Título">
            <Input
              value={metadata.title}
              onChange={e => handleFieldChange('title', e.target.value)}
              placeholder="Título del documento"
            />
          </Form.Item>

          <Form.Item label="Autor">
            <Input
              value={metadata.author}
              onChange={e => handleFieldChange('author', e.target.value)}
              placeholder="Nombre del autor"
            />
          </Form.Item>

          <Form.Item label="Asunto">
            <Input
              value={metadata.subject}
              onChange={e => handleFieldChange('subject', e.target.value)}
              placeholder="Asunto del documento"
            />
          </Form.Item>

          <Form.Item label="Palabras Clave">
            <Input
              value={metadata.keywords}
              onChange={e => handleFieldChange('keywords', e.target.value)}
              placeholder="Separadas por comas"
            />
          </Form.Item>

          <Form.Item label="Creador">
            <Input value={metadata.creator} disabled />
          </Form.Item>

          <Form.Item label="Productor">
            <Input value={metadata.producer} disabled />
          </Form.Item>

          <Form.Item label="Fecha de Creación">
            <Input value={String(metadata.creationDate)} disabled />
          </Form.Item>

          <Form.Item label="Fecha de Modificación">
            <Input value={String(metadata.modificationDate)} disabled />
          </Form.Item>

          <Form.Item>
            <Checkbox checked={stampMetadata} onChange={e => {
                setStampMetadata(e.target.checked);
                setIsDirty(true);
            }}>
              Estampar metadatos visibles en la primera página
            </Checkbox>
          </Form.Item>

          <div style={{ marginTop: 16 }}>
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={saveMetadata}
                loading={isProcessing}
                disabled={!isDirty}
              >
                Guardar y Descargar
              </Button>
              <Button onClick={clearMetadata} disabled={!pdfFile}>
                Limpiar Campos
              </Button>
            </Space>
          </div>
        </Form>
      )}

      {!pdfFile && (
        <Alert
          type="warning"
          message="Paso 1: Sube un PDF"
          description="Selecciona un PDF para ver y editar sus metadatos."
          showIcon
        />
      )}
    </Card>
  );
}
