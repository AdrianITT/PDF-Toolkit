import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Upload, Input, List, Modal, message, Space, Empty, Spin } from 'antd';
import { PlusOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppStore } from '../../stores/appStore';

interface Stamp {
  id: string;
  name: string;
  dataUrl: string;
  category: string;
  createdAt: number;
}

interface StampCategory {
  id: string;
  name: string;
}

const defaultCategories: StampCategory[] = [
  { id: 'approved', name: 'Aprobado' },
  { id: 'rejected', name: 'Rechazado' },
  { id: 'draft', name: 'Borrador' },
  { id: 'confidential', name: 'Confidencial' },
  { id: 'custom', name: 'Personalizado' },
];

function createStampCanvas(
  type: string,
  name: string,
  width: number = 150,
  height: number = 150
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;

  switch (type) {
    case 'approved':
      ctx.strokeRect(5, 5, width - 10, height - 10);
      ctx.fillStyle = '#2e7d32';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('APROBADO', width / 2, 45);
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.fillText(name, width / 2, 75);
      break;

    case 'rejected':
      ctx.beginPath();
      ctx.moveTo(10, 10);
      ctx.lineTo(width - 10, height - 10);
      ctx.moveTo(width - 10, 10);
      ctx.lineTo(10, height - 10);
      ctx.stroke();
      ctx.strokeRect(5, 5, width - 10, height - 10);
      ctx.fillStyle = '#c62828';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('RECHAZADO', width / 2, 45);
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.fillText(name, width / 2, 75);
      break;

    case 'draft':
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(5, 5, width - 10, height - 10);
      ctx.setLineDash([]);
      ctx.fillStyle = '#666';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('BORRADOR', width / 2, 45);
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.fillText(name, width / 2, 75);
      break;

    case 'confidential':
      ctx.strokeRect(5, 5, width - 10, height - 10);
      ctx.fillStyle = '#c62828';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CONFIDENCIAL', width / 2, 50);
      ctx.fillStyle = '#333';
      ctx.font = '11px Arial';
      ctx.fillText(name, width / 2, 80);
      break;

    default:
      ctx.strokeRect(5, 5, width - 10, height - 10);
      ctx.fillStyle = '#333';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SELLO', width / 2, 50);
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.fillText(name, width / 2, 80);
  }

  return canvas.toDataURL('image/png');
}

export function StampsPage() {
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [categories] = useState<StampCategory[]>(defaultCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStampName, setNewStampName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('custom');
  const [previewStamp, setPreviewStamp] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('savedStamps');
    if (saved) {
      try {
        setStamps(JSON.parse(saved));
      } catch {
        setStamps([]);
      }
    }
  }, []);

  const saveStamps = (newStamps: Stamp[]) => {
    setStamps(newStamps);
    localStorage.setItem('savedStamps', JSON.stringify(newStamps));
  };

  const createStamp = (type: string) => {
    if (!newStampName.trim()) {
      message.warning('Ingresa un nombre para el sello');
      return;
    }

    const dataUrl = createStampCanvas(type, newStampName.trim());
    const newStamp: Stamp = {
      id: Date.now().toString(),
      name: newStampName.trim(),
      dataUrl,
      category: selectedCategory,
      createdAt: Date.now(),
    };

    saveStamps([...stamps, newStamp]);
    setNewStampName('');
    message.success('Sello creado');
  };

  const deleteStamp = (id: string) => {
    Modal.confirm({
      title: 'Eliminar sello',
      content: '¿Estás seguro de eliminar este sello?',
      okText: 'Eliminar',
      okType: 'danger',
      onOk: () => {
        saveStamps(stamps.filter((s) => s.id !== id));
        message.success('Sello eliminado');
      },
    });
  };

const applyStamp = async (stamp: Stamp) => {
    console.log('[Sellos] Seleccionando sello:', stamp.name);

    // Crear un input file manualmente para seleccionar PDF
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf';

    fileInput.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) {
        message.warning('No se seleccionó archivo');
        return;
      }

      setIsLoadingPdf(true);
      try {
        console.log('[Sellos] Archivo seleccionado:', file.name);
        const buffer = await file.arrayBuffer();
        const pdfData = new Uint8Array(buffer);

        const pdfFile = {
          id: `imported-${Date.now()}`,
          name: file.name,
          data: pdfData,
          pageCount: 1,
          pages: [],
        };

        const newOverlay = {
          x: 100,
          y: 100,
          width: 150,
          height: 150,
          page: 1,
          imageData: stamp.dataUrl,
          type: 'sello' as const,
        };

        const currentOverlays = useAppStore.getState().overlays;
        
        useAppStore.setState({
          pdfFiles: [pdfFile],
          orderedPages: [],
          overlays: [...currentOverlays, newOverlay],
          currentPdfPath: '',
        });

        console.log('[Sellos] Navegando a Editor PDF');
        useAppStore.getState().setActiveModule('pdf-editor');
        message.success(`Sello "${stamp.name}" listo. Arrastra para posicionar en el PDF.`);
      } catch (err) {
        console.error('[Sellos] Error al cargar PDF:', err);
        message.error('Error al cargar el PDF');
      } finally {
        setIsLoadingPdf(false);
      }
    };

    fileInput.click();
  };

  const exportStamps = () => {
    const data = JSON.stringify(stamps, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sellos.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('Sellos exportados');
  };

  const importStamps = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result as string);
        if (Array.isArray(imported)) {
          const merged = [...stamps, ...imported];
          saveStamps(merged);
          message.success(`${imported.length} sellos importados`);
        }
      } catch {
        message.error('Archivo no válido');
      }
    };
    reader.readAsText(file);
  };

  const copyToClipboard = async (dataUrl: string) => {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      message.success('Imagen copiada');
    } catch {
      message.info('Copia no soportada en este navegador');
    }
  };

  return (
    <Card
      title="Módulo de Sellos"
      extra={
        <Space>
          <Upload
            accept=".json"
            showUploadList={false}
            beforeUpload={(file) => {
              importStamps(file);
              return false;
            }}
          >
            <Button>Importar</Button>
          </Upload>
          <Button onClick={exportStamps}>Exportar</Button>
        </Space>
      }
    >
      {isLoadingPdf && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin size="large" />
          <p style={{ marginTop: 8, color: '#1890ff' }}>Cargando PDF...</p>
        </div>
      )}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Crear Sello" size="small">
            <Input
              placeholder="Nombre del sello"
              value={newStampName}
              onChange={(e) => setNewStampName(e.target.value)}
              style={{ marginBottom: 16 }}
            />

            <div style={{ marginBottom: 16 }}>
              <span>Categoría:</span>
              <Space wrap style={{ marginTop: 8 }}>
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    type={selectedCategory === cat.id ? 'primary' : 'default'}
                    onClick={() => setSelectedCategory(cat.id)}
                    size="small"
                  >
                    {cat.name}
                  </Button>
                ))}
              </Space>
            </div>

            <div style={{ marginBottom: 16 }}>
              <span>Tipo de sello:</span>
              <Space wrap style={{ marginTop: 8 }}>
                <Button onClick={() => createStamp('approved')}>
                  Aprobado
                </Button>
                <Button danger onClick={() => createStamp('rejected')}>
                  Rechazado
                </Button>
                <Button onClick={() => createStamp('draft')}>
                  Borrador
                </Button>
                <Button onClick={() => createStamp('confidential')}>
                  Confidencial
                </Button>
              </Space>
            </div>

            <div>
              <Button
                icon={<PlusOutlined />}
                onClick={() => setIsModalOpen(true)}
                disabled={!newStampName.trim()}
              >
                Crear sello personalizado
              </Button>
            </div>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Vista Previa" size="small">
            {previewStamp ? (
              <div style={{ textAlign: 'center' }}>
                <img
                  src={previewStamp}
                  alt="Preview"
                  style={{ maxWidth: 150, maxHeight: 150 }}
                />
              </div>
            ) : (
              <Empty description="Selecciona un sello para previsualizar" />
            )}
          </Card>
        </Col>
      </Row>

      <Card title="Sellos Guardados" style={{ marginTop: 16 }}>
        {stamps.length === 0 ? (
          <Empty description="No hay sellos guardados" />
        ) : (
          stamps.map((stamp) => (
            <List.Item
              key={stamp.id}
              actions={[
                <Button
                  key="apply"
                  type="primary"
                  onClick={() => applyStamp(stamp)}
                >
                  Aplicar
                </Button>,
                <Button
                  key="preview"
                  type="link"
                  onClick={() => setPreviewStamp(stamp.dataUrl)}
                >
                  Ver
                </Button>,
                <Button
                  key="copy"
                  type="link"
                  onClick={() => copyToClipboard(stamp.dataUrl)}
                >
                  Copiar
                </Button>,
                <Button
                  key="delete"
                  danger
                  type="link"
                  icon={<DeleteOutlined />}
                  onClick={() => deleteStamp(stamp.id)}
                />,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <img
                    src={stamp.dataUrl}
                    alt={stamp.name}
                    style={{ width: 60, height: 60, objectFit: 'contain' }}
                  />
                }
                title={stamp.name}
                description={
                  categories.find((c) => c.id === stamp.category)?.name || stamp.category
                }
              />
            </List.Item>
          ))
        )}
      </Card>

      <Modal
        title="Subir Sello Personalizado"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={(file) => {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              const newStamp: Stamp = {
                id: Date.now().toString(),
                name: file.name.replace(/\.[^.]+$/, ''),
                dataUrl,
                category: 'custom',
                createdAt: Date.now(),
              };
              saveStamps([...stamps, newStamp]);
              message.success('Sello subido');
            };
            reader.readAsDataURL(file);
            setIsModalOpen(false);
          }}
        >
          <Button icon={<UploadOutlined />}>Subir imagen de sello</Button>
        </Upload>
      </Modal>
    </Card>
  );
}