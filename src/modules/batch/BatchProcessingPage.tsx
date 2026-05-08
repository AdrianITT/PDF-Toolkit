import { useState } from 'react';
import { Card, Button, Upload, Alert, message, Space, List, Progress, Tag, Select } from 'antd';
import { InboxOutlined, FilePdfOutlined, PlayCircleOutlined } from '@ant-design/icons';

type ConversionMode = 'docx-pdf' | 'xlsx-pdf' | 'pdf-images';

interface BatchFile {
  id: string;
  name: string;
  size: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  outputName?: string;
  error?: string;
}

export function BatchProcessingPage() {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<ConversionMode>('docx-pdf');
  const [completed, setCompleted] = useState(0);

  const handleFileUpload = (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles: BatchFile[] = [];
    for (const file of Array.from(fileList)) {
      if (file.name.match(/\.(docx|doc|xlsx|xls|pdf)$/i)) {
        newFiles.push({
          id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          status: 'pending',
        });
      }
    }

    if (newFiles.length === 0) {
      message.warning('Solo archivos DOCX, XLSX o PDF');
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);
    message.success(`${newFiles.length} archivo(s) agregado(s)`);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'done' && f.status !== 'error'));
  };

  const processBatch = async () => {
    if (files.length === 0) {
      message.warning('No hay archivos en la cola');
      return;
    }

    setIsProcessing(true);
    setCompleted(0);
    setProgress(0);

    try {
      message.info(`Iniciando procesamiento por lotes: ${files.length} archivo(s)`);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.status !== 'pending') continue;

        // Actualizar estado
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'processing' as const } : f
        ));

        setProgress(((i + 1) / files.length) * 100);

        try {
          // Simulación de procesamiento
          await new Promise(resolve => setTimeout(resolve, 1500));

          // En implementación real, aquí se haría la conversión
          const outputName = file.name.replace(/\.[^.]+$/, '_converted.pdf');

          setFiles(prev => prev.map(f => 
            f.id === file.id ? { 
              ...f, 
              status: 'done' as const, 
              outputName 
            } : f
          ));

          setCompleted(prev => prev + 1);

        } catch (err) {
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { 
              ...f, 
              status: 'error' as const, 
              error: err instanceof Error ? err.message : 'Error desconocido'
            } : f
          ));
        }
      }

      message.success(`Lote completado: ${completed} de ${files.length} exitosos`);

    } catch (err) {
      console.error('[Batch] Error:', err);
      message.error('Error en el procesamiento por lotes');
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const doneCount = files.filter(f => f.status === 'done').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  return (
    <Card
      title={
        <Space>
          <PlayCircleOutlined />
          Procesamiento por Lotes
        </Space>
      }
      extra={
        <Space>
          <Tag color="blue">{files.length} total</Tag>
          <Tag color="green">{doneCount} exitosos</Tag>
          {errorCount > 0 && <Tag color="red">{errorCount} errores</Tag>}
        </Space>
      }
    >
      <Alert
        type="info"
        message="¿Qué es el Procesamiento por Lotes?"
        description="Procesa múltiples archivos automáticamente. Sube varios archivos, selecciona el tipo de conversión y déjalos procesar en cola."
        showIcon
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Space>
          <span>Modo:</span>
          <Select
            value={mode}
            onChange={setMode}
            style={{ width: 200 }}
            disabled={isProcessing}
          >
            <Select.Option value="docx-pdf">Word → PDF</Select.Option>
            <Select.Option value="xlsx-pdf">Excel → PDF</Select.Option>
            <Select.Option value="pdf-images">PDF → Imágenes</Select.Option>
          </Select>
        </Space>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Upload
          multiple
          accept=".docx,.doc,.xlsx,.xls,.pdf"
          showUploadList={false}
          beforeUpload={(file) => {
            handleFileUpload([file] as unknown as FileList);
            return false;
          }}
        >
          <Button icon={<InboxOutlined />} loading={isProcessing}>
            Subir Archivos
          </Button>
        </Upload>

        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={processBatch}
          loading={isProcessing}
          disabled={pendingCount === 0}
          style={{ marginLeft: 8 }}
        >
          {isProcessing ? 'Procesando...' : `Procesar Lote (${pendingCount})`}
        </Button>

        {files.length > 0 && (
          <Button
            onClick={clearCompleted}
            disabled={doneCount === 0 && errorCount === 0}
            style={{ marginLeft: 8 }}
          >
            Limpiar Completados
          </Button>
        )}
      </div>

      {isProcessing && (
        <div style={{ marginBottom: 16 }}>
          <Progress 
            percent={Math.round(progress)} 
            status="active"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            Procesando archivos... {completed} de {files.length} completados
          </div>
        </div>
      )}

      {files.length > 0 ? (
        <List
          size="small"
          dataSource={files}
          renderItem={(file: BatchFile) => (
            <List.Item
              actions={[
                file.status === 'done' && (
                  <Button type="link" size="small" icon={<FilePdfOutlined />}>
                    Descargar
                  </Button>
                ),
                <Button
                  type="text"
                  danger
                  size="small"
                  onClick={() => removeFile(file.id)}
                  disabled={file.status === 'processing'}
                >
                  ✕
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div style={{ position: 'relative' }}>
                    <FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
                    {file.status === 'processing' && (
                      <Progress
                        type="circle"
                        percent={100}
                        size={40}
                        strokeColor="#1890ff"
                        style={{
                          position: 'absolute',
                          top: -8,
                          left: -8,
                        }}
                      />
                    )}
                  </div>
                }
                title={
                  <span>
                    {file.name}
                    <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </span>
                }
                description={
                  <>
                    {file.status === 'pending' && <Tag color="default">Pendiente</Tag>}
                    {file.status === 'processing' && <Tag color="blue">Procesando...</Tag>}
                    {file.status === 'done' && <Tag color="success">✓ Completado</Tag>}
                    {file.status === 'error' && <Tag color="error">✕ {file.error}</Tag>}
                    {file.outputName && (
                      <span style={{ marginLeft: 8, color: '#666' }}>
                        → {file.outputName}
                      </span>
                    )}
                  </>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          <InboxOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <p>Sube archivos para comenzar el procesamiento por lotes</p>
        </div>
      )}

      <Alert
        type="warning"
        message="Función en desarrollo"
        description="La implementación actual es una simulación. El procesamiento real requiere integración con el motor de conversión."
        showIcon
        style={{ marginTop: 16 }}
      />
    </Card>
  );
}
