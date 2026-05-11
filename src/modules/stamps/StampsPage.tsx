import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Button, Upload, Input, List, Modal, message, Space, Empty, Typography, Alert } from 'antd';
import { PlusOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppStore } from '../../stores/appStore';

const { Title, Paragraph } = Typography;

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

  const loadSavedStamps = useCallback(() => {
    const saved = localStorage.getItem('savedStamps');
    if (saved) {
      try {
        setStamps(JSON.parse(saved));
      } catch (parseErr) {
        console.error('Error parsing saved stamps:', parseErr);
        setStamps([]);
      }
    }
  }, []);

  useEffect(() => {
    loadSavedStamps();
  }, [loadSavedStamps]);

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

const applyStamp = (stamp: Stamp) => {
    console.log('[Sellos] Seleccionando sello:', stamp.name);
    
    // Guardar el sello seleccionado y navegar al posicionador
    useAppStore.setState({
      pdfFiles: [],
      orderedPages: [],
      overlays: [],
      currentPdfPath: null,
      selectedAsset: { type: 'sello', dataUrl: stamp.dataUrl, name: stamp.name },
    });
    
    useAppStore.getState().setActiveModule('asset-positioner');
    message.info(`Sello "${stamp.name}" seleccionado. Sube un PDF para posicionar el sello.`);
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

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>🔴 Sellos</Title>
          <Paragraph style={{ margin: 0 }}>
            Crea y gestiona sellos personalizados para agregar a tus documentos PDF.
          </Paragraph>
        </div>
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
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="🖨️ Crear Sello" style={{ marginBottom: 24 }}>
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
                <Button onClick={() => createStamp('urgent')}>
                  Urgente
                </Button>
              </Space>
            </div>

            <div>
              <Button
                icon={<PlusOutlined />}
                onClick={() => setIsModalOpen(true)}
                disabled={!newStampName.trim()}
              >
                Subir sello personalizado (PNG)
              </Button>
            </div>
          </Card>
          
          <Card title="👁️ Vista Previa">
            {previewStamp ? (
              <div style={{ textAlign: 'center', padding: 20, background: '#f5f5f5', borderRadius: 8 }}>
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
        
        <Col xs={24} lg={12}>
          <Card 
            title="📋 Sellos Guardados" 
            extra={<span style={{ color: '#999' }}>{stamps.length} sello(s)</span>}
          >
            {stamps.length === 0 ? (
              <Empty description="No hay sellos guardados. Crea uno arriba." />
            ) : (
              <List
                dataSource={stamps}
                renderItem={(stamp) => (
                  <List.Item
                    actions={[
                      <Button
                        key="apply"
                        type="primary"
                        onClick={() => applyStamp(stamp)}
                      >
                        Usar en PDF
                      </Button>,
                      <Button
                        key="preview"
                        type="link"
                        onClick={() => setPreviewStamp(stamp.dataUrl)}
                      >
                        Ver
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
                        <div style={{ 
                          border: '1px solid #d9d9d9', 
                          borderRadius: 8, 
                          padding: 4,
                          background: '#fff'
                        }}>
                          <img
                            src={stamp.dataUrl}
                            alt={stamp.name}
                            style={{ width: 60, height: 60, objectFit: 'contain' }}
                          />
                        </div>
                      }
                      title={stamp.name}
                      description={
                        categories.find((c) => c.id === stamp.category)?.name || stamp.category
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
          
          <Alert
            message="💡 Cómo usar"
            description={
              <div>
                <p>1. Crea un sello o selecciona uno de los predefinidos</p>
                <p>2. Click en <strong>"Usar en PDF"</strong></p>
                <p>3. Se abrirá el Editor donde puedes subir tu PDF</p>
                <p>4. Navega a la página deseada y posiciona el sello</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginTop: 24 }}
          />
        </Col>
      </Row>

      <Modal
        title="Subir Sello Personalizado"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Upload
          accept="image/png,image/jpeg,image/jpg"
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
              message.success('Sello subido correctamente');
            };
            reader.readAsDataURL(file);
            setIsModalOpen(false);
          }}
        >
          <div style={{ 
            border: '2px dashed #d9d9d9', 
            borderRadius: 8, 
            padding: 40, 
            textAlign: 'center',
            cursor: 'pointer'
          }}>
            <p><UploadOutlined style={{ fontSize: 32, color: '#1890ff' }} /></p>
            <p>Click para subir imagen</p>
            <p style={{ color: '#999', fontSize: 12 }}>Recomendado: PNG con transparencia</p>
          </div>
        </Upload>
      </Modal>
    </div>
  );
}