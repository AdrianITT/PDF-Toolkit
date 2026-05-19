import { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Space,
  Slider,
  Select,
  Row,
  Col,
  Divider,
  message,
  Tooltip,
  Alert,
  Typography,
  InputNumber,
  Input,
  Modal,
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  FontSizeOutlined,
  UndoOutlined,
  RedoOutlined,
  ScissorOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import Cropper from 'react-easy-crop';
import { saveAs } from 'file-saver';
import type { Point, Area } from 'react-easy-crop';

const { Text, Paragraph } = Typography;

interface FilterSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
}

interface TextAnnotation {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
}

type AspectRatio = 'free' | '1/1' | '4/3' | '16/9' | '3/2';

const ASPECT_RATIOS: { value: AspectRatio; label: string; ratio: number | null }[] = [
  { value: 'free', label: 'Libre', ratio: null },
  { value: '1/1', label: '1:1 (Cuadrado)', ratio: 1 },
  { value: '4/3', label: '4:3', ratio: 4 / 3 },
  { value: '16/9', label: '16:9', ratio: 16 / 9 },
  { value: '3/2', label: '3:2', ratio: 3 / 2 },
];

export function ImageEditorPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('free');
  const [showCropArea, setShowCropArea] = useState(true);
  const [filters, setFilters] = useState<FilterSettings>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
  });
  const [annotations, setAnnotations] = useState<TextAnnotation[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [textModalVisible, setTextModalVisible] = useState(false);
  const [newTextPosition, setNewTextPosition] = useState({ x: 50, y: 50 });
  const [newTextValue, setNewTextValue] = useState('');
  const [newTextSize, setNewTextSize] = useState(24);

  const getAspectRatioNumber = (): number | null => {
    const found = ASPECT_RATIOS.find(r => r.value === aspectRatio);
    return found?.ratio || null;
  };

  const handleImageLoad = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setOriginalImage(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setFilters({ brightness: 100, contrast: 100, saturation: 100, blur: 0 });
      setAnnotations([]);
      setHistory([reader.result as string]);
      setHistoryIndex(0);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        message.error('Por favor selecciona un archivo de imagen');
        return;
      }
      handleImageLoad(file);
    }
    e.target.value = '';
  };

  const handleCropComplete = useCallback((_croppedArea: Area, _croppedAreaPixels: Area) => {
    // This will be used when generating the final image
  }, []);

  const generateImage = useCallback(async (): Promise<CanvasRenderingContext2D | null> => {
    if (!imageSrc || !originalImage) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const img = new Image();
    img.src = imageSrc;

    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
    });

    const aspect = getAspectRatioNumber();
    let width = img.width;
    let height = img.height;

    if (aspect) {
      if (width / height > aspect) {
        height = width / aspect;
      } else {
        width = height * aspect;
      }
    }

    canvas.width = width;
    canvas.height = height;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height / 2);

    const cropX = (canvas.width / 2 - width / 2) / zoom;
    const cropY = (canvas.height / 2 - height / 2) / zoom;

    ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) blur(${filters.blur}px)`;
    ctx.drawImage(img, cropX, cropY, width / zoom, height / zoom);
    ctx.restore();

    // Apply annotations
    ctx.font = `${newTextSize}px Arial`;
    ctx.fillStyle = '#ff0000';
    annotations.forEach(ann => {
      ctx.fillText(ann.text, (ann.x / 100) * width, (ann.y / 100) * height);
    });

    return ctx;
  }, [imageSrc, originalImage, zoom, rotation, filters, annotations, aspectRatio, rotation]);

  const handleDownload = async (format: 'png' | 'jpeg' | 'webp') => {
    if (!imageSrc) {
      message.warning('No hay imagen para exportar');
      return;
    }

    const ctx = await generateImage();
    if (!ctx) return;

    const canvas = document.createElement('canvas');
    canvas.width = ctx.canvas.width;
    canvas.height = ctx.canvas.height;
    const exportCtx = canvas.getContext('2d');
    if (!exportCtx) return;

    exportCtx.drawImage(ctx.canvas, 0, 0);

    const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    const quality = format === 'jpeg' ? 0.92 : format === 'webp' ? 0.9 : undefined;

    canvas.toBlob(async (blob) => {
      if (blob) {
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

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
              defaultPath: `edited-image-${Date.now()}.${format}`,
              filters: [{ name: 'Imagen', extensions: [format] }]
            });
            if (filePath) {
              await writeFile(filePath, uint8Array);
              message.success('Imagen exportada correctamente');
            }
          } catch (err) {
            console.error('Error en Tauri download:', err);
            message.error('Error al guardar la imagen');
          }
        } else {
          saveAs(blob, `edited-image-${Date.now()}.${format}`);
          message.success('Imagen exportada correctamente');
        }
      }
    }, mimeType, quality);
  };

  const handleRotate = (degrees: number) => {
    setRotation(prev => (prev + degrees) % 360);
  };

  const handleReset = () => {
    if (originalImage) {
      setImageSrc(originalImage);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setFilters({ brightness: 100, contrast: 100, saturation: 100, blur: 0 });
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setImageSrc(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setImageSrc(history[historyIndex + 1]);
    }
  };

  const handleAddText = () => {
    if (!newTextValue.trim()) return;
    const newAnnotation: TextAnnotation = {
      id: `ann-${Date.now()}`,
      text: newTextValue,
      x: newTextPosition.x,
      y: newTextPosition.y,
      fontSize: newTextSize,
      color: '#ff0000',
    };
    setAnnotations(prev => [...prev, newAnnotation]);
    setTextModalVisible(false);
    setNewTextValue('');
    message.success('Texto agregado');
  };

  const handleRemoveAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  };

  const getFilterStyle = (): React.CSSProperties => ({
    filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) blur(${filters.blur}px)`,
  });

  return (
    <Card
      title={
        <span>
          <ScissorOutlined style={{ marginRight: 8 }} />
          Editor de Imágenes
        </span>
      }
      extra={
        <Space>
          <Button
            icon={<UndoOutlined />}
            onClick={handleUndo}
            disabled={historyIndex <= 0}
          >
            Deshacer
          </Button>
          <Button
            icon={<RedoOutlined />}
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
          >
            Rehacer
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={handleReset}
            disabled={!imageSrc}
          >
            Resetear
          </Button>
        </Space>
      }
    >
      {!imageSrc ? (
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
            accept="image/*"
            style={{ display: 'none' }}
            id="image-editor-upload"
            onChange={handleFileChange}
          />
          <label htmlFor="image-editor-upload" style={{ cursor: 'pointer' }}>
            <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            <Paragraph style={{ marginTop: 16 }}>
              Haz clic para seleccionar una imagen
            </Paragraph>
            <Text type="secondary">
              Formatos: JPG, PNG, GIF, WebP, BMP
            </Text>
          </label>
        </div>
      ) : (
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <div
              style={{
                position: 'relative',
                height: 500,
                background: '#1a1a1a',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              {showCropArea ? (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={getAspectRatioNumber() || undefined}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={handleCropComplete}
                  style={{
                    containerStyle: { background: '#1a1a1a' },
                    mediaStyle: getFilterStyle(),
                  }}
                />
              ) : (
                <div style={{ ...getFilterStyle(), width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={imageSrc}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                </div>
              )}
              {annotations.map(ann => (
                <div
                  key={ann.id}
                  style={{
                    position: 'absolute',
                    left: `${ann.x}%`,
                    top: `${ann.y}%`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: ann.fontSize,
                    color: ann.color,
                    cursor: 'move',
                    userSelect: 'none',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  }}
                >
                  {ann.text}
                  <Button
                    type="text"
                    size="small"
                    danger
                    onClick={(e) => { e.stopPropagation(); handleRemoveAnnotation(ann.id); }}
                    style={{ marginLeft: 4 }}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>

            <Space style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
              <Tooltip title="Rotar -90°">
                <Button icon={<RotateLeftOutlined />} onClick={() => handleRotate(-90)} />
              </Tooltip>
              <Tooltip title="Rotar +90°">
                <Button icon={<RotateRightOutlined />} onClick={() => handleRotate(90)} />
              </Tooltip>
              <Divider type="vertical" />
              <Tooltip title="Recortar">
                <Button
                  type={showCropArea ? 'primary' : 'default'}
                  icon={<ScissorOutlined />}
                  onClick={() => setShowCropArea(!showCropArea)}
                />
              </Tooltip>
              <Tooltip title="Agregar texto">
                <Button icon={<FontSizeOutlined />} onClick={() => setTextModalVisible(true)} />
              </Tooltip>
            </Space>
          </Col>

          <Col xs={24} lg={8}>
            <Card size="small" title="Ajustes" style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text>Zoom: {Math.round(zoom * 100)}%</Text>
                  <Slider
                    min={0.5}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={setZoom}
                  />
                </div>
                <div>
                  <Text>Rotación: {rotation}°</Text>
                  <Slider
                    min={-180}
                    max={180}
                    value={rotation}
                    onChange={setRotation}
                  />
                </div>
              </Space>
            </Card>

            <Card size="small" title="Filtros" style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text>Brillo: {filters.brightness}%</Text>
                  <Slider
                    min={0}
                    max={200}
                    value={filters.brightness}
                    onChange={(v) => setFilters(prev => ({ ...prev, brightness: v }))}
                  />
                </div>
                <div>
                  <Text>Contraste: {filters.contrast}%</Text>
                  <Slider
                    min={0}
                    max={200}
                    value={filters.contrast}
                    onChange={(v) => setFilters(prev => ({ ...prev, contrast: v }))}
                  />
                </div>
                <div>
                  <Text>Saturación: {filters.saturation}%</Text>
                  <Slider
                    min={0}
                    max={200}
                    value={filters.saturation}
                    onChange={(v) => setFilters(prev => ({ ...prev, saturation: v }))}
                  />
                </div>
                <div>
                  <Text>Blur: {filters.blur}px</Text>
                  <Slider
                    min={0}
                    max={20}
                    value={filters.blur}
                    onChange={(v) => setFilters(prev => ({ ...prev, blur: v }))}
                  />
                </div>
                <Button
                  block
                  onClick={() => setFilters({ brightness: 100, contrast: 100, saturation: 100, blur: 0 })}
                >
                  Resetear Filtros
                </Button>
              </Space>
            </Card>

            <Card size="small" title="Recorte" style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Select
                  value={aspectRatio}
                  onChange={setAspectRatio}
                  style={{ width: '100%' }}
                  options={ASPECT_RATIOS.map(r => ({
                    value: r.value,
                    label: r.label,
                  }))}
                />
              </Space>
            </Card>

            <Alert
              message="Exportar imagen"
              description="Guarda tu imagen editada en el formato deseado"
              type="info"
              style={{ marginBottom: 16 }}
            />

            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                block
                onClick={() => handleDownload('png')}
              >
                Descargar PNG
              </Button>
              <Button
                icon={<DownloadOutlined />}
                block
                onClick={() => handleDownload('jpeg')}
              >
                Descargar JPEG
              </Button>
              <Button
                icon={<DownloadOutlined />}
                block
                onClick={() => handleDownload('webp')}
              >
                Descargar WebP
              </Button>
            </Space>
          </Col>
        </Row>
      )}

      <Modal
        title="Agregar Texto"
        open={textModalVisible}
        onOk={handleAddText}
        onCancel={() => setTextModalVisible(false)}
        okText="Agregar"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="Escribe el texto..."
            value={newTextValue}
            onChange={(e) => setNewTextValue(e.target.value)}
            onPressEnter={handleAddText}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <div>
              <Text>X (%): </Text>
              <InputNumber
                min={0}
                max={100}
                value={newTextPosition.x}
                onChange={(v) => setNewTextPosition(prev => ({ ...prev, x: v || 50 }))}
                style={{ width: 80 }}
              />
            </div>
            <div>
              <Text>Y (%): </Text>
              <InputNumber
                min={0}
                max={100}
                value={newTextPosition.y}
                onChange={(v) => setNewTextPosition(prev => ({ ...prev, y: v || 50 }))}
                style={{ width: 80 }}
              />
            </div>
          </div>
          <div>
            <Text>Tamaño: </Text>
            <InputNumber
              min={12}
              max={72}
              value={newTextSize}
              onChange={(v) => setNewTextSize(v || 24)}
              style={{ width: 80 }}
            />
          </div>
        </Space>
      </Modal>
    </Card>
  );
}