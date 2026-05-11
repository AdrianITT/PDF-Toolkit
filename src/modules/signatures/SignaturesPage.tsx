import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, Button, Row, Col, Input, Upload, List, message, Space, Empty, Typography, Alert } from 'antd';
import { DeleteOutlined, SaveOutlined, ClearOutlined, UploadOutlined } from '@ant-design/icons';
import { useAppStore } from '../../stores/appStore';

const { Title, Paragraph } = Typography;

interface Signature {
  id: string;
  name: string;
  dataUrl: string;
}

export function SignatureCanvas({ onSave }: { onSave: (dataUrl: string, name: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getPos(e);
    setIsDrawing(true);
    setLastPos(pos);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setLastPos(pos);
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureName('');
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    const name = signatureName.trim() || `Firma ${Date.now()}`;
    onSave(dataUrl, name);
    message.success('Firma guardada');
    clearCanvas();
  };

  return (
    <Card title="Dibujar Firma" size="small">
      <Input
        placeholder="Nombre de la firma"
        value={signatureName}
        onChange={(e) => setSignatureName(e.target.value)}
        style={{ marginBottom: 8 }}
      />
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        style={{
          border: '1px solid #d9d9d9',
          borderRadius: 4,
          cursor: 'crosshair',
          background: '#fff',
          touchAction: 'none',
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <Space style={{ marginTop: 8 }}>
        <Button icon={<SaveOutlined />} onClick={saveSignature}>
          Guardar
        </Button>
        <Button icon={<ClearOutlined />} onClick={clearCanvas}>
          Limpiar
        </Button>
      </Space>
    </Card>
  );
}

export function SignatureUpload({ onUpload }: { onUpload: (dataUrl: string, name: string) => void }) {
  const [name, setName] = useState('');

  const handleFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const sigName = name.trim() || file.name.replace(/\.[^.]+$/, '');
      onUpload(dataUrl, sigName);
      setName('');
      message.success('Firma subida');
    };
    reader.readAsDataURL(file);
    return false;
  };

  return (
    <Card title="Subir Firma" size="small">
      <Input
        placeholder="Nombre (opcional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ marginBottom: 8 }}
      />
      <Upload
        accept="image/png,image/jpeg,image/jpg"
        showUploadList={false}
        beforeUpload={handleFile}
      >
        <Button icon={<UploadOutlined />}>Subir imagen (PNG/JPG)</Button>
      </Upload>
      <Paragraph style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
        Formatos recomendados: PNG con transparencia para mejor calidad
      </Paragraph>
    </Card>
  );
}

export function SignaturesPage() {
  const [signatures, setSignatures] = useState<Signature[]>([]);

  const loadSavedSignatures = useCallback(() => {
    const saved = localStorage.getItem('savedSignatures');
    if (saved) {
      try {
        setSignatures(JSON.parse(saved));
      } catch (parseErr) {
        console.error('Error parsing saved signatures:', parseErr);
      }
    }
  }, []);

  useEffect(() => {
    loadSavedSignatures();
  }, [loadSavedSignatures]);

  const saveSignature = (dataUrl: string, name: string) => {
    const newSig: Signature = {
      id: Date.now().toString(),
      name,
      dataUrl,
    };
    const updated = [...signatures, newSig];
    setSignatures(updated);
    localStorage.setItem('savedSignatures', JSON.stringify(updated));
  };

  const deleteSignature = (id: string) => {
    const updated = signatures.filter((s) => s.id !== id);
    setSignatures(updated);
    localStorage.setItem('savedSignatures', JSON.stringify(updated));
    message.success('Firma eliminada');
  };

  const selectSignature = (sig: Signature) => {
    console.log('[Firmas] Seleccionando firma:', sig.name);
    
    // Guardar la firma seleccionada y navegar al posicionador
    useAppStore.setState({
      pdfFiles: [],
      orderedPages: [],
      overlays: [],
      currentPdfPath: null,
      selectedAsset: { type: 'firma', dataUrl: sig.dataUrl, name: sig.name },
    });
    
    useAppStore.getState().setActiveModule('asset-positioner');
    message.info(`Firma "${sig.name}" seleccionada. Sube un PDF para posicionar la firma.`);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <Title level={2} style={{ marginBottom: 8 }}>✍️ Firmas Digitales</Title>
      <Paragraph style={{ marginBottom: 24 }}>
        Crea, guarda y gestiona tus firmas digitales. Luego úsalas para firmar tus documentos PDF.
      </Paragraph>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="🖌️ Crear Nueva Firma" style={{ marginBottom: 24 }}>
            <SignatureCanvas onSave={saveSignature} />
          </Card>
          
          <Card title="📁 Importar Firma" extra={<span style={{ color: '#999' }}>PNG con transparencia</span>}>
            <SignatureUpload onUpload={saveSignature} />
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card 
            title="📋 Firmas Guardadas" 
            extra={<span style={{ color: '#999' }}>{signatures.length} firma(s)</span>}
          >
            {signatures.length === 0 ? (
              <Empty description="No hay firmas guardadas. Crea una firma arriba." />
            ) : (
              <List
                dataSource={signatures}
                renderItem={(sig) => (
                  <List.Item
                    actions={[
                      <Button key="select" type="primary" onClick={() => selectSignature(sig)}>
                        Usar en PDF
                      </Button>,
                      <Button
                        key="delete"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => deleteSignature(sig.id)}
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
                            src={sig.dataUrl}
                            alt={sig.name}
                            style={{ width: 100, height: 50, objectFit: 'contain', background: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAABNJREFUGFdjZEACjEBlIGLUAAC8GgL4wL/XYQAAAABJRU5ErkJggg==)' }}
                          />
                        </div>
                      }
                      title={sig.name}
                      description={`ID: ${sig.id}`}
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
                <p>1. Crea o importa una firma (recomendado PNG con transparencia)</p>
                <p>2. Click en <strong>"Usar en PDF"</strong></p>
                <p>3. Se abrirá el Editor donde puedes subir tu PDF</p>
                <p>4. Navega a la página deseada y posiciona la firma</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginTop: 24 }}
          />
        </Col>
      </Row>
    </div>
  );
}