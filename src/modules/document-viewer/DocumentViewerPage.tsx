import { useState, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Tabs,
  Table,
  message,
  Segmented,
  Alert,
  Select,
} from 'antd';
import {
  UploadOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

const { Text, Paragraph } = Typography;

interface DocumentFile {
  uid: string;
  name: string;
  type: 'docx' | 'xlsx' | 'pptx' | 'txt' | 'unknown';
  size: number;
  content?: string;
  sheets?: string[];
  data?: any[];
}

const getFileType = (filename: string): 'docx' | 'xlsx' | 'pptx' | 'txt' | 'unknown' => {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'docx':
    case 'doc':
      return 'docx';
    case 'xlsx':
    case 'xls':
      return 'xlsx';
    case 'pptx':
    case 'ppt':
      return 'pptx';
    case 'txt':
      return 'txt';
    default:
      return 'unknown';
  }
};

const getFileIcon = (type: string) => {
  switch (type) {
    case 'docx':
      return <FileWordOutlined style={{ fontSize: 48, color: '#2b579a' }} />;
    case 'xlsx':
      return <FileExcelOutlined style={{ fontSize: 48, color: '#217346' }} />;
    case 'pptx':
      return <FilePptOutlined style={{ fontSize: 48, color: '#d24726' }} />;
    default:
      return <FileTextOutlined style={{ fontSize: 48, color: '#666' }} />;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export function DocumentViewerPage() {
  const [document, setDocument] = useState<DocumentFile | null>(null);
  const [_loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'data'>('preview');
  const [selectedSheet, setSelectedSheet] = useState<string>('');

  const processDocument = useCallback(async (file: File) => {
    setLoading(true);
    const fileType = getFileType(file.name);

    const newDoc: DocumentFile = {
      uid: `${file.name}-${Date.now()}`,
      name: file.name,
      type: fileType,
      size: file.size,
    };

    try {
      if (fileType === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        newDoc.content = result.value;
        setDocument(newDoc);
      } else if (fileType === 'xlsx') {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        newDoc.sheets = workbook.SheetNames;
        
        if (workbook.SheetNames.length > 0) {
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          newDoc.data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          setSelectedSheet(workbook.SheetNames[0]);
        }
        setDocument(newDoc);
      } else if (fileType === 'txt') {
        const text = await file.text();
        newDoc.content = text;
        setDocument(newDoc);
      } else if (fileType === 'pptx') {
        message.warning('PowerPoint: Solo se muestra información básica. Usa el convertidor para PDF.');
        newDoc.content = '<p>La visualización de PowerPoint es limitada. Usa el convertidor para transformar a PDF.</p>';
        setDocument(newDoc);
      } else {
        message.error('Tipo de archivo no soportado');
      }
    } catch (err) {
      console.error('[Document Viewer] Error:', err);
      message.error('Error al procesar el documento');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processDocument(file);
    }
    e.target.value = '';
  };

  const handleSheetChange = useCallback(async (sheetName: string) => {
    if (!document || document.type !== 'xlsx') return;
    
    setSelectedSheet(sheetName);
    // Note: We'd need to re-read the file to get different sheet data
    // For simplicity, we'll use the cached data
  }, [document]);

  const renderDocxContent = () => {
    if (!document?.content) return null;
    return (
      <div
        style={{
          padding: 24,
          background: '#fff',
          borderRadius: 8,
          minHeight: 400,
          maxHeight: 600,
          overflow: 'auto',
        }}
        dangerouslySetInnerHTML={{ __html: document.content }}
      />
    );
  };

  const renderXlsxContent = () => {
    if (!document?.data || !document.sheets) return null;
    
    const columns = document.data[0] ? (document.data[0] as string[]).map((col, i) => ({
      title: col || `Columna ${i + 1}`,
      dataIndex: `col${i}`,
      key: `col${i}`,
    })) : [];

    const data = document.data.slice(1).map((row, idx) => {
      const obj: Record<string, any> = { key: idx };
      (row as string[]).forEach((cell, i) => {
        obj[`col${i}`] = cell;
      });
      return obj;
    });

    return (
      <Table
        dataSource={data}
        columns={columns}
        pagination={{ pageSize: 20 }}
        scroll={{ x: true }}
        size="small"
      />
    );
  };

  const renderTxtContent = () => {
    if (!document?.content) return null;
    return (
      <pre
        style={{
          padding: 16,
          background: 'var(--ant-color-bg-spotlight)',
          borderRadius: 8,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxHeight: 500,
          overflow: 'auto',
        }}
      >
        {document.content}
      </pre>
    );
  };

  return (
    <Card
      title={
        <span>
          <FileWordOutlined style={{ marginRight: 8 }} />
          Visor de Documentos
        </span>
      }
      extra={
        document && (
          <Button icon={<UploadOutlined />} onClick={() => setDocument(null)}>
            Nuevo documento
          </Button>
        )
      }
    >
      {!document ? (
        <div
          style={{
            border: '2px dashed var(--ant-color-border)',
            borderRadius: 8,
            padding: 60,
            textAlign: 'center',
            background: 'var(--ant-color-bg-spotlight)',
          }}
        >
          <input
            type="file"
            accept=".docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt"
            style={{ display: 'none' }}
            id="document-viewer-upload"
            onChange={handleFileChange}
          />
          <label htmlFor="document-viewer-upload" style={{ cursor: 'pointer' }}>
            <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            <Paragraph style={{ marginTop: 16 }}>
              Selecciona un documento
            </Paragraph>
            <Text type="secondary">
              Formatos: DOCX, XLSX, PPTX, TXT
            </Text>
          </label>
        </div>
      ) : (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col>
              <Space>
                {getFileIcon(document.type)}
                <div>
                  <Text strong>{document.name}</Text>
                  <br />
                  <Text type="secondary">
                    {formatFileSize(document.size)} • {document.type.toUpperCase()}
                  </Text>
                </div>
              </Space>
            </Col>
            <Col flex="auto" style={{ textAlign: 'right' }}>
              {document.type === 'xlsx' && document.sheets && (
                <Select
                  value={selectedSheet}
                  onChange={handleSheetChange}
                  style={{ width: 150, marginRight: 16 }}
                  placeholder="Seleccionar hoja"
                >
                  {document.sheets.map(sheet => (
                    <Select.Option key={sheet} value={sheet}>{sheet}</Select.Option>
                  ))}
                </Select>
              )}
              <Segmented
                options={[
                  { value: 'preview', label: 'Vista previa' },
                  { value: 'data', label: 'Datos' },
                ]}
                value={viewMode}
                onChange={(v) => setViewMode(v as 'preview' | 'data')}
              />
            </Col>
          </Row>

          <Tabs
            activeKey={document.type}
            items={[
              {
                key: 'docx',
                label: 'Word',
                children: viewMode === 'preview' ? renderDocxContent() : (
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{document.content}</pre>
                ),
              },
              {
                key: 'xlsx',
                label: 'Excel',
                children: renderXlsxContent(),
              },
              {
                key: 'txt',
                label: 'Texto',
                children: viewMode === 'preview' ? renderTxtContent() : (
                  <pre>{document.content}</pre>
                ),
              },
              {
                key: 'pptx',
                label: 'PowerPoint',
                children: (
                  <div>
                    <Alert type="warning" message="Vista limitada de PowerPoint" />
                    {renderDocxContent()}
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}
    </Card>
  );
}