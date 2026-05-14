import { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Space,
  Row,
  Col,
  message,
  Typography,
  InputNumber,
  Checkbox,
  Progress,
  List,
  Tag,
  Divider,
  Slider,
  Segmented,
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  FileImageOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import JSZip from 'jszip';

const { Text, Title } = Typography;

interface ImageFile {
  id: string;
  file: File;
  name: string;
  size: number;
  preview: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  processedBlob?: Blob;
}

interface ProcessingSettings {
  width: number;
  height: number;
  maintainAspectRatio: boolean;
  inputFormat: 'jpg' | 'png' | 'both';
  outputFormat: 'png' | 'jpg';
  jpgQuality: number;
}

export function BatchImageProcessorPage() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  
  const [settings, setSettings] = useState<ProcessingSettings>({
    width: 800,
    height: 600,
    maintainAspectRatio: true,
    inputFormat: 'both',
    outputFormat: 'png',
    jpgQuality: 90,
  });

  const handleFilesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validTypes = settings.inputFormat === 'both' 
      ? ['image/jpeg', 'image/jpg', 'image/png']
      : settings.inputFormat === 'jpg'
        ? ['image/jpeg', 'image/jpg']
        : ['image/png'];
    
    const validFiles = Array.from(files).filter(f => validTypes.includes(f.type));
    
    if (validFiles.length === 0) {
      message.warning(`No hay imágenes ${settings.inputFormat === 'both' ? 'JPG o PNG' : settings.inputFormat.toUpperCase()}`);
      return;
    }

    const newImages: ImageFile[] = [];
    let loadedCount = 0;
    const totalToLoad = validFiles.length;

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        newImages.push({
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: file.name,
          size: file.size,
          preview: reader.result as string,
          status: 'pending',
        });
        
        loadedCount++;
        console.log('[BatchImage] Imagen cargada:', file.name, `(${loadedCount}/${totalToLoad})`);
        
        if (loadedCount === totalToLoad) {
          console.log('[BatchImage] Todas las imágenes cargadas:', newImages.length);
          setImages(prev => [...prev, ...newImages]);
          message.success(`${newImages.length} imagen(es) cargada(s)`);
        }
      };
      reader.onerror = () => {
        loadedCount++;
        console.error('[BatchImage] Error al cargar:', file.name);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  }, [settings]);

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const clearAll = () => {
    setImages([]);
    setProcessedCount(0);
  };

  const processImage = async (imgData: ImageFile): Promise<Blob> => {
    console.log('[BatchImage] Procesando:', imgData.name, '->', settings.outputFormat.toUpperCase(), settings.width, 'x', settings.height);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        let targetWidth = settings.width;
        let targetHeight = settings.height;
        
        if (settings.maintainAspectRatio) {
          const aspectRatio = img.width / img.height;
          if (img.width > img.height) {
            targetHeight = Math.round(targetWidth / aspectRatio);
          } else {
            targetWidth = Math.round(targetHeight * aspectRatio);
          }
        }
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener contexto del canvas'));
          return;
        }
        
        // alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        const mimeType = settings.outputFormat === 'png' ? 'image/png' : 'image/jpeg';
        const quality = settings.outputFormat === 'png' ? 1 : settings.jpgQuality / 100;
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Error al procesar imagen'));
            }
          },
          mimeType,
          quality
        );
      };
      img.onerror = () => reject(new Error('Error al cargar imagen'));
      img.src = imgData.preview;
    });
  };

  const handleProcess = async () => {
    if (images.length === 0) {
      message.warning('No hay imágenes para procesar');
      return;
    }

    setIsProcessing(true);
    setProcessedCount(0);
    
    const pendingImages = images.filter(img => img.status !== 'completed');
    console.log('[BatchImage] Iniciando procesamiento:', pendingImages.length, 'imágenes');
    
    for (let i = 0; i < pendingImages.length; i++) {
      const img = pendingImages[i];
      console.log('[BatchImage] Procesando imagen', i + 1, 'de', pendingImages.length + ':', img.name);
      
      setImages(prev => prev.map(im => 
        im.id === img.id ? { ...im, status: 'processing' } : im
      ));

      try {
        const blob = await processImage(img);
        
        setImages(prev => prev.map(im => 
          im.id === img.id ? { ...im, status: 'completed', processedBlob: blob } : im
        ));
        console.log('[BatchImage] Completada:', img.name);
      } catch (err) {
        setImages(prev => prev.map(im => 
          im.id === img.id ? { ...im, status: 'error', error: 'Error al procesar' } : im
        ));
      }
      
      setProcessedCount(i + 1);
      
      // Pequeño delay para no saturar
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    setIsProcessing(false);
    message.success('Procesamiento completado');
  };

  const handleDownloadZip = async () => {
    const completedImages = images.filter(img => img.status === 'completed' && img.processedBlob);
    
    if (completedImages.length === 0) {
      message.warning('No hay imágenes procesadas para descargar');
      return;
    }

    console.log('[BatchImage] Descargando ZIP con', completedImages.length, 'imágenes');
    
    const zip = new JSZip();
    const ext = settings.outputFormat;
    
    completedImages.forEach(img => {
      const newName = img.name.replace(/\.[^/.]+$/, '') + '.' + ext;
      console.log('[BatchImage] Agregando al ZIP:', newName, 'size:', img.processedBlob?.size);
      zip.file(newName, img.processedBlob!);
    });

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      console.log('[BatchImage] ZIP generado, tamaño:', content.size, 'type:', content.type);
      
      // Verificar que el blob es válido
      if (content.size === 0) {
        message.error('El ZIP está vacío');
        return;
      }

      // Método alternativo: crear URL y descargar
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `imagenes-procesadas-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      message.success('ZIP descargado');
      console.log('[BatchImage] Descarga iniciada');
    } catch (err) {
      console.error('[BatchImage] Error al generar ZIP:', err);
      message.error('Error al descargar ZIP');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusTag = (status: ImageFile['status']) => {
    switch (status) {
      case 'pending':
        return <Tag color="default">Pendiente</Tag>;
      case 'processing':
        return <Tag color="processing">Procesando</Tag>;
      case 'completed':
        return <Tag color="success">Completado</Tag>;
      case 'error':
        return <Tag color="error">Error</Tag>;
    }
  };

  const completedCount = images.filter(img => img.status === 'completed').length;

  return (
    <Card
      title={
        <span>
          <FileImageOutlined style={{ marginRight: 8 }} />
          Procesador de Imágenes Batch
        </span>
      }
      extra={
        images.length > 0 && (
          <Button danger icon={<DeleteOutlined />} onClick={clearAll}>
            Limpiar Todo
          </Button>
        )
      }
    >
      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card size="small" title="1. Subir Imágenes" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Formato de entrada:
              </Text>
              <Segmented
                value={settings.inputFormat}
                onChange={(val) => setSettings(s => ({ ...s, inputFormat: val as 'jpg' | 'png' | 'both' }))}
                options={[
                  { value: 'both', label: 'JPG + PNG' },
                  { value: 'jpg', label: 'Solo JPG' },
                  { value: 'png', label: 'Solo PNG' },
                ]}
              />
            </div>
            
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              multiple
              style={{ display: 'none' }}
              id="batch-image-upload"
              onChange={handleFilesChange}
            />
            <label htmlFor="batch-image-upload" style={{ display: 'block' }}>
              <div style={{
                padding: 40,
                border: '2px dashed var(--ant-color-border)',
                borderRadius: 8,
                textAlign: 'center',
                background: 'var(--ant-color-bg-spotlight)',
                cursor: 'pointer'
              }}>
                <UploadOutlined style={{ fontSize: 40, color: '#999' }} />
                <Title level={5} style={{ marginTop: 12, marginBottom: 4 }}>
                  Seleccionar imágenes
                </Title>
                <Text type="secondary">
                  {settings.inputFormat === 'both' ? 'JPG y PNG' : settings.inputFormat === 'jpg' ? 'Solo JPG' : 'Solo PNG'} - Múltiples archivos
                </Text>
              </div>
            </label>
          </Card>

          <Card size="small" title="2. Configuración">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Ancho (px)</Text>
                  <InputNumber
                    value={settings.width}
                    onChange={(val) => setSettings(s => ({ ...s, width: val || 800 }))}
                    style={{ width: '100%', marginTop: 4 }}
                    min={1}
                    max={10000}
                  />
                </Col>
                <Col span={12}>
                  <Text strong>Alto (px)</Text>
                  <InputNumber
                    value={settings.height}
                    onChange={(val) => setSettings(s => ({ ...s, height: val || 600 }))}
                    style={{ width: '100%', marginTop: 4 }}
                    min={1}
                    max={10000}
                  />
                </Col>
              </Row>
              
              <Checkbox
                checked={settings.maintainAspectRatio}
                onChange={(e) => setSettings(s => ({ ...s, maintainAspectRatio: e.target.checked }))}
              >
                Mantener proporción aspecta
              </Checkbox>
              
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Formato de salida:
                </Text>
                <Segmented
                  value={settings.outputFormat}
                  onChange={(val) => setSettings(s => ({ ...s, outputFormat: val as 'png' | 'jpg' }))}
                  options={[
                    { value: 'png', label: 'PNG' },
                    { value: 'jpg', label: 'JPG' },
                  ]}
                />
              </div>
              
              {settings.outputFormat === 'jpg' && (
                <div>
                  <Text strong>Calidad JPG: {settings.jpgQuality}%</Text>
                  <Slider
                    value={settings.jpgQuality}
                    onChange={(val: number) => setSettings(s => ({ ...s, jpgQuality: val }))}
                    min={10}
                    max={100}
                  />
                </div>
              )}
              
              {settings.outputFormat === 'png' && (
                <Text type="secondary">PNG: Alta calidad (sin compresión)</Text>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            size="small" 
            title={`3. Imágenes (${images.length})`}
            extra={
              <Text type="secondary">
                {completedCount}/{images.length} procesadas
              </Text>
            }
          >
            {images.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <FileImageOutlined style={{ fontSize: 48, color: '#ccc' }} />
                <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
                  No hay imágenes cargadas
                </Text>
              </div>
            ) : (
              <List
                size="small"
                dataSource={images}
                renderItem={(img) => (
                  <List.Item
                    actions={[
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeImage(img.id)}
                        key="delete"
                      />
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <img
                          src={img.preview}
                          alt={img.name}
                          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                        />
                      }
                      title={img.name}
                      description={
                        <Space>
                          {formatFileSize(img.size)}
                          {getStatusTag(img.status)}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Divider />

          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleProcess}
              loading={isProcessing}
              block
              size="large"
              disabled={images.length === 0 || isProcessing}
            >
              {isProcessing ? `Procesando ${processedCount} de ${images.length}...` : 'Procesar Imágenes'}
            </Button>
            
            {isProcessing && (
              <Progress 
                percent={Math.round((processedCount / images.length) * 100)} 
                status="active"
              />
            )}
            
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownloadZip}
              block
              size="large"
              disabled={completedCount === 0}
            >
              Descargar ZIP ({completedCount} imágenes {settings.outputFormat.toUpperCase()})
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );
}