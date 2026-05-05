import { useState, useRef, useEffect } from 'react';
import { Card, Button, Row, Col, Input, Upload, List, message, Space, Empty, Spin } from 'antd';
import { DeleteOutlined, SaveOutlined, ClearOutlined, UploadOutlined } from '@ant-design/icons';
import { useAppStore } from '../../stores/appStore';

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

function SignaturesManager({ signatures, onSelect, onDelete }: {
  signatures: Signature[];
  onSelect: (sig: Signature) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card title="Firmas Guardadas" size="small">
      {signatures.length === 0 ? (
        <Empty description="No hay firmas guardadas" />
      ) : (
        <List
          dataSource={signatures}
          renderItem={(sig) => (
            <List.Item
              actions={[
                <Button key="select" onClick={() => onSelect(sig)}>
                  Usar
                </Button>,
                <Button
                  key="delete"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onDelete(sig.id)}
                />,
              ]}
            >
              <List.Item.Meta
                title={sig.name}
                avatar={
                  <img
                    src={sig.dataUrl}
                    alt={sig.name}
                    style={{ width: 80, height: 40, objectFit: 'contain' }}
                  />
                }
              />
            </List.Item>
          )}
        />
      )}
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
        accept="image/*"
        showUploadList={false}
        beforeUpload={handleFile}
      >
        <Button icon={<UploadOutlined />}>Subir imagen de firma</Button>
      </Upload>
    </Card>
  );
}

export function SignaturesPage() {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('savedSignatures');
    if (saved) {
      try {
        setSignatures(JSON.parse(saved));
      } catch {}
    }
  }, []);

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

  const selectSignature = async (sig: Signature) => {
    console.log('[Firmas] Seleccionando firma:', sig.name);

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
        console.log('[Firmas] Archivo seleccionado:', file.name);
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
          height: 75,
          page: 1,
          imageData: sig.dataUrl,
          type: 'firma' as const,
        };

        const currentOverlays = useAppStore.getState().overlays;
        
        useAppStore.setState({
          pdfFiles: [pdfFile],
          orderedPages: [],
          overlays: [...currentOverlays, newOverlay],
          currentPdfPath: '',
        });

        console.log('[Firmas] Navegando a Editor PDF');
        useAppStore.getState().setActiveModule('pdf-editor');
        message.success(`Firma "${sig.name}" lista. Arrastra para posicionar en el PDF.`);
      } catch (err) {
        console.error('[Firmas] Error al cargar PDF:', err);
        message.error('Error al cargar el PDF');
      } finally {
        setIsLoadingPdf(false);
      }
    };

    fileInput.click();
  };

  return (
    <Card title="Gestión de Firmas">
      {isLoadingPdf && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin size="large" />
          <p style={{ marginTop: 8, color: '#1890ff' }}>Cargando PDF...</p>
        </div>
      )}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <SignatureCanvas onSave={saveSignature} />
          <div style={{ marginTop: 16 }}>
            <SignatureUpload onUpload={saveSignature} />
          </div>
        </Col>
        <Col span={12}>
          <SignaturesManager
            signatures={signatures}
            onSelect={selectSignature}
            onDelete={deleteSignature}
          />
        </Col>
      </Row>
    </Card>
  );
}