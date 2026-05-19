import { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Space,
  Row,
  Col,
  message,
  Typography,
  List,
  Upload,
  Input,
  Radio,
  Progress,
  Divider,
  Tag,
  Empty,
} from 'antd';
import {
  MergeCellsOutlined,
  ScissorOutlined,
  UploadOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';

const { Text } = Typography;

interface PDFFile {
  uid: string;
  name: string;
  file: File;
  pages?: number;
}

export function PdfSplitMergePage() {
  const [mode, setMode] = useState<'merge' | 'split'>('merge');
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [splitFile, setSplitFile] = useState<PDFFile | null>(null);
  const [pageRange, setPageRange] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFilesChange = useCallback((info: any) => {
    const newFiles = info.fileList
      .filter((f: any) => f.status !== 'removed')
      .map((f: any) => ({
        uid: f.uid,
        name: f.name,
        file: f.originFileObj,
      }));
    
    // Load page count for each file
    Promise.all(newFiles.map(async (f: PDFFile) => {
      try {
        const arrayBuffer = await f.file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        return { ...f, pages: pdfDoc.getPageCount() };
      } catch {
        return { ...f, pages: 0 };
      }
    })).then(filesWithPages => {
      if (mode === 'merge') {
        setFiles(prev => [...prev, ...filesWithPages]);
      } else {
        if (filesWithPages.length > 0) {
          setSplitFile(filesWithPages[0]);
        }
      }
    });
  }, [mode]);

  const removeFile = (uid: string) => {
    setFiles(prev => prev.filter(f => f.uid !== uid));
  };

  const moveFile = (uid: string, direction: 'up' | 'down') => {
    const index = files.findIndex(f => f.uid === uid);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= files.length) return;
    
    const newFiles = [...files];
    [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
    setFiles(newFiles);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      message.warning('Necesitas al menos 2 archivos PDF para unir');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const mergedPdf = await PDFDocument.create();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(Math.round((i / files.length) * 50));
        
        const arrayBuffer = await file.file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        
        copiedPages.forEach(page => {
          mergedPdf.addPage(page);
        });
      }
      
      setProgress(75);
      
      const pdfBytes = await mergedPdf.save();
      const uint8Array = new Uint8Array(pdfBytes);
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      
      // Check for Tauri
      let isTauri = false;
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('get_pdf_info', { path: '' });
        isTauri = true;
      } catch { isTauri = false; }
      
      if (isTauri) {
        try {
          const { save } = await import('@tauri-apps/plugin-dialog');
          const { writeFile } = await import('@tauri-apps/plugin-fs');
          const filePath = await save({
            defaultPath: `merged-${Date.now()}.pdf`,
            filters: [{ name: 'PDF', extensions: ['pdf'] }]
          });
          if (filePath) {
            await writeFile(filePath, new Uint8Array(pdfBytes));
            message.success('PDF unido guardado');
            setProgress(100);
            setIsProcessing(false);
            return;
          }
        } catch { /* fallback */ }
      }
      
      saveAs(blob, `merged-${Date.now()}.pdf`);
      message.success('PDFs unidos correctamente');
      setProgress(100);
    } catch (err) {
      console.error('[PDF Merge] Error:', err);
      message.error('Error al unir PDFs');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplit = async () => {
    if (!splitFile) {
      message.warning('Selecciona un archivo PDF para dividir');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const arrayBuffer = await splitFile.file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      const totalPages = sourcePdf.getPageCount();
      
      let pagesToExtract: number[] = [];
      
      if (pageRange === 'all') {
        pagesToExtract = Array.from({ length: totalPages }, (_, i) => i);
      } else {
        // Parse range like "1-5, 8, 10-15"
        const parts = pageRange.split(',').map(p => p.trim());
        for (const part of parts) {
          if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            for (let i = start; i <= end; i++) {
              if (i >= 1 && i <= totalPages) {
                pagesToExtract.push(i - 1);
              }
            }
          } else {
            const pageNum = Number(part);
            if (pageNum >= 1 && pageNum <= totalPages) {
              pagesToExtract.push(pageNum - 1);
            }
          }
        }
      }
      
      if (pagesToExtract.length === 0) {
        message.warning('Rango de páginas inválido');
        setIsProcessing(false);
        return;
      }
      
      // Create new PDF with selected pages
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(sourcePdf, pagesToExtract);
      copiedPages.forEach(page => newPdf.addPage(page));
      
const pdfBytes = await newPdf.save();
      const uint8Array2 = new Uint8Array(pdfBytes);
      const blob = new Blob([uint8Array2], { type: 'application/pdf' });
      
      // Check for Tauri
      let isTauri = false;
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('get_pdf_info', { path: '' });
        isTauri = true;
      } catch { isTauri = false; }

      if (isTauri) {
        try {
          const { save } = await import('@tauri-apps/plugin-dialog');
          const { writeFile } = await import('@tauri-apps/plugin-fs');
          const suffix = pageRange === 'all' ? 'all' : pageRange.replace(/,/g, '-').replace(/\s/g, '');
          const filePath = await save({
            defaultPath: `split-${suffix}-${Date.now()}.pdf`,
            filters: [{ name: 'PDF', extensions: ['pdf'] }]
          });
          if (filePath) {
            await writeFile(filePath, new Uint8Array(pdfBytes));
            message.success('PDF dividido guardado');
            setProgress(100);
            setIsProcessing(false);
            return;
          }
        } catch { /* fallback */ }
      }
      
      const suffix = pageRange === 'all' ? 'all' : pageRange.replace(/,/g, '-').replace(/\s/g, '');
      saveAs(blob, `split-${suffix}-${Date.now()}.pdf`);
      message.success('PDF dividido correctamente');
      setProgress(100);
    } catch (err) {
      console.error('[PDF Split] Error:', err);
      message.error('Error al dividir PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setFiles([]);
    setSplitFile(null);
    setPageRange('all');
    setProgress(0);
  };

  return (
    <Card
      title={
        <Space>
          <MergeCellsOutlined />
          <span>PDF Splitter / Merger</span>
        </Space>
      }
      extra={
        <Button onClick={handleClear} icon={<DeleteOutlined />}>
          Limpiar
        </Button>
      }
    >
      <Row gutter={24}>
        <Col xs={24} lg={14}>
          <Card size="small" title="Modo de operación" style={{ marginBottom: 16 }}>
            <Radio.Group
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                setFiles([]);
                setSplitFile(null);
                setPageRange('all');
              }}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio value="merge">
                  <Space>
                    <MergeCellsOutlined />
                    <span>Unir PDFs (Merge)</span>
                  </Space>
                </Radio>
                <Radio value="split">
                  <Space>
                    <ScissorOutlined />
                    <span>Dividir PDF (Split)</span>
                  </Space>
                </Radio>
              </Space>
            </Radio.Group>
          </Card>

          <Card size="small" title={mode === 'merge' ? 'Archivos a unir' : 'Archivo a dividir'}>
            <Upload
              accept=".pdf"
              multiple={mode === 'merge'}
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleFilesChange}
              disabled={isProcessing}
            >
              <Button icon={<UploadOutlined />} block>
                {mode === 'merge' ? 'Seleccionar PDFs' : 'Seleccionar PDF'}
              </Button>
            </Upload>

            {mode === 'merge' && files.length > 0 && (
              <List
                size="small"
                style={{ marginTop: 16 }}
                dataSource={files}
                renderItem={(file, index) => (
                  <List.Item
                    actions={[
                      <Button
                        key="up"
                        type="text"
                        size="small"
                        icon={<ArrowUpOutlined />}
                        onClick={() => moveFile(file.uid, 'up')}
                        disabled={index === 0}
                      />,
                      <Button
                        key="down"
                        type="text"
                        size="small"
                        icon={<ArrowDownOutlined />}
                        onClick={() => moveFile(file.uid, 'down')}
                        disabled={index === files.length - 1}
                      />,
                      <Button
                        key="delete"
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeFile(file.uid)}
                      />,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />}
                      title={file.name}
                      description={file.pages ? `${file.pages} páginas` : 'Cargando...'}
                    />
                  </List.Item>
                )}
              />
            )}

            {mode === 'split' && splitFile && (
              <div style={{ marginTop: 16 }}>
                <Tag color="red" icon={<FilePdfOutlined />}>
                  {splitFile.name} ({splitFile.pages} páginas)
                </Tag>
              </div>
            )}

            {((mode === 'merge' && files.length === 0) || (mode === 'split' && !splitFile)) && (
              <Empty description="No hay archivos seleccionados" style={{ marginTop: 16 }} />
            )}
          </Card>

          {mode === 'split' && splitFile && (
            <Card size="small" title="Opciones de división" style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio.Group
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                >
                  <Radio value="all">Todas las páginas</Radio>
                  <Radio value="custom">Rango específico</Radio>
                </Radio.Group>
                
                {pageRange === 'custom' && (
                  <Input
                    placeholder="Ej: 1-5, 8, 10-15"
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                  />
                )}
                
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Los números de página empiezan en 1
                </Text>
              </Space>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={10}>
          <Card size="small" title="Acción">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {mode === 'merge' ? (
                <Button
                  type="primary"
                  icon={<MergeCellsOutlined />}
                  onClick={handleMerge}
                  loading={isProcessing}
                  disabled={files.length < 2}
                  block
                  size="large"
                >
                  {isProcessing ? `Uniendo... ${progress}%` : `Unir ${files.length} PDFs`}
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<ScissorOutlined />}
                  onClick={handleSplit}
                  loading={isProcessing}
                  disabled={!splitFile}
                  block
                  size="large"
                >
                  {isProcessing ? `Dividiendo... ${progress}%` : 'Dividir PDF'}
                </Button>
              )}

              {isProcessing && (
                <Progress percent={progress} status="active" />
              )}

              <Divider />

              <Text type="secondary">
                {mode === 'merge'
                  ? 'Selecciona varios PDFs y ordénalos para unir en un solo archivo.'
                  : 'Selecciona un PDF y elige qué páginas extraer.'}
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </Card>
  );
}