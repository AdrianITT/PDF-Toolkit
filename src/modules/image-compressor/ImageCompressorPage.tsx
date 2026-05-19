import { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Row,
  Col,
  message,
  Typography,
  Slider,
  Space,
  Tag,
  Progress,
  List,
  InputNumber,
  Checkbox,
  Divider,
} from 'antd';
import {
  CompressOutlined,
  UploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileImageOutlined,
} from '@ant-design/icons';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const { Text } = Typography;

interface ImageFile {
  id: string;
  name: string;
  originalSize: number;
  compressedSize?: number;
  originalUrl: string;
  compressedUrl?: string;
  processed: boolean;
}

export function ImageCompressorPage() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [quality, setQuality] = useState(80);
  const [maxWidth, setMaxWidth] = useState<number | null>(null);
  const [maxHeight, setMaxHeight] = useState<number | null>(null);
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleFilesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: ImageFile[] = [];
    let processed = 0;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = () => {
        newImages.push({
          id: `img-${Date.now()}-${processed}`,
          name: file.name,
          originalSize: file.size,
          originalUrl: reader.result as string,
          processed: false,
        });
        processed++;
        
        if (processed === Array.from(files).filter(f => f.type.startsWith('image/')).length) {
          setImages(prev => [...prev, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  }, []);

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const clearAll = () => {
    setImages([]);
    setProgress(0);
  };

  const compressImage = async (img: ImageFile): Promise<{ blob: Blob; url: string }> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        
        let width = image.width;
        let height = image.height;
        
        // Apply resize if specified
        if (maxWidth || maxHeight) {
          if (maintainAspect) {
            const ratio = Math.min(
              maxWidth ? maxWidth / width : 1,
              maxHeight ? maxHeight / height : 1
            );
            if (ratio < 1) {
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
            }
          } else {
            width = maxWidth || width;
            height = maxHeight || height;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener contexto del canvas'));
          return;
        }
        
        // High quality settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(image, 0, 0, width, height);
        
        // Determine output format
        const isPng = img.name.toLowerCase().endsWith('.png');
        const mimeType = isPng ? 'image/png' : 'image/jpeg';
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              resolve({ blob, url });
            } else {
              reject(new Error('Error al comprimir imagen'));
            }
          },
          mimeType,
          quality / 100
        );
      };
      image.onerror = () => reject(new Error('Error al cargar imagen'));
      image.src = img.originalUrl;
    });
  };

  const handleCompress = async () => {
    if (images.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    const pendingImages = images.filter(img => !img.processed);
    
    for (let i = 0; i < pendingImages.length; i++) {
      const img = pendingImages[i];
      
      try {
        const { blob, url } = await compressImage(img);
        
        setImages(prev => prev.map(im => 
          im.id === img.id 
            ? { ...im, compressedSize: blob.size, compressedUrl: url, processed: true }
            : im
        ));
      } catch (err) {
        console.error('[ImageCompress] Error:', err);
      }
      
      setProgress(Math.round(((i + 1) / pendingImages.length) * 100));
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    message.success('Imágenes comprimidas');
    setIsProcessing(false);
  };

  const handleDownloadSingle = async (img: ImageFile) => {
    if (!img.compressedUrl) return;

    // Check for Tauri
    let isTauri = false;
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('get_pdf_info', { path: '' });
      isTauri = true;
    } catch { isTauri = false; }

    const ext = img.name.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
    const filename = img.name.replace(/\.[^/.]+$/, '-comprimido.' + ext);
    
    if (isTauri) {
      try {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeFile } = await import('@tauri-apps/plugin-fs');
        const filePath = await save({
          defaultPath: filename,
          filters: [{ name: 'Images', extensions: [ext] }]
        });
        if (filePath) {
          const response = await fetch(img.compressedUrl);
          const blob = await response.blob();
          await writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
          message.success('Imagen guardada');
          return;
        }
      } catch { /* fallback */ }
    }
    
    // Web fallback
    const link = document.createElement('a');
    link.href = img.compressedUrl;
    link.download = filename;
    link.click();
    message.success('Imagen descargada');
  };

  const handleDownloadZip = async () => {
    const processedImages = images.filter(img => img.processed && img.compressedUrl);
    
    if (processedImages.length === 0) {
      message.warning('No hay imágenes procesadas para descargar');
      return;
    }

    const zip = new JSZip();
    
    for (const img of processedImages) {
      const ext = img.name.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
      const filename = img.name.replace(/\.[^/.]+$/, '-comprimido.' + ext);
      
      const response = await fetch(img.compressedUrl!);
      const blob = await response.blob();
      zip.file(filename, blob);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    
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
          defaultPath: `imagenes-comprimidas-${Date.now()}.zip`,
          filters: [{ name: 'ZIP', extensions: ['zip'] }]
        });
        if (filePath) {
          await writeFile(filePath, new Uint8Array(await content.arrayBuffer()));
          message.success('ZIP guardado');
          setIsProcessing(false);
          return;
        }
      } catch { /* fallback */ }
    }
    
    saveAs(content, `imagenes-comprimidas-${Date.now()}.zip`);
    message.success('ZIP descargado');
  };

  const processedCount = images.filter(img => img.processed).length;
  const totalOriginal = images.reduce((sum, img) => sum + img.originalSize, 0);
  const totalCompressed = images.reduce((sum, img) => sum + (img.compressedSize || img.originalSize), 0);

  return (
    <Card
      title={
        <Space>
          <CompressOutlined />
          <span>Compresor de Imágenes</span>
        </Space>
      }
      extra={
        images.length > 0 && (
          <Button onClick={clearAll} icon={<DeleteOutlined />}>
            Limpiar todo
          </Button>
        )
      }
    >
      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card size="small" title="1. Imágenes" style={{ marginBottom: 16 }}>
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              id="image-compressor-upload"
              onChange={handleFilesChange}
            />
            <label htmlFor="image-compressor-upload" style={{ display: 'block' }}>
              <Button icon={<UploadOutlined />} block>
                Seleccionar imágenes
              </Button>
            </label>

            {images.length > 0 && (
              <List
                size="small"
                style={{ marginTop: 16, maxHeight: 200, overflow: 'auto' }}
                dataSource={images}
                renderItem={(img) => (
                  <List.Item
                    actions={[
                      img.processed && (
                        <Button
                          key="download"
                          size="small"
                          icon={<DownloadOutlined />}
                          onClick={() => handleDownloadSingle(img)}
                        >
                          Descargar
                        </Button>
                      ),
                      <Button
                        key="delete"
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeImage(img.id)}
                      />,
                    ].filter(Boolean)}
                  >
                    <List.Item.Meta
                      avatar={<FileImageOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                      title={img.name}
                      description={
                        img.processed && img.compressedSize ? (
                          <Space>
                            <Text delete>{formatFileSize(img.originalSize)}</Text>
                            <Text strong style={{ color: '#52c41a' }}>
                              → {formatFileSize(img.compressedSize)}
                            </Text>
                            <Tag color="green">
                              -{Math.round((1 - img.compressedSize / img.originalSize) * 100)}%
                            </Tag>
                          </Space>
                        ) : (
                          formatFileSize(img.originalSize)
                        )
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card size="small" title="2. Configuración">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text strong>Calidad: {quality}%</Text>
                <Slider
                  value={quality}
                  onChange={setQuality}
                  min={10}
                  max={100}
                  marks={{ 10: 'Baja', 50: 'Media', 100: 'Alta' }}
                />
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <Checkbox
                checked={!!maxWidth || !!maxHeight}
                onChange={(e) => {
                  if (!e.target.checked) {
                    setMaxWidth(null);
                    setMaxHeight(null);
                  }
                }}
              >
                Redimensionar imágenes
              </Checkbox>

              {(maxWidth !== null || maxHeight !== null) && (
                <Row gutter={8}>
                  <Col span={12}>
                    <InputNumber
                      placeholder="Ancho"
                      value={maxWidth}
                      onChange={(val) => setMaxWidth(val)}
                      style={{ width: '100%' }}
                      min={1}
                      max={10000}
                      addonAfter="px"
                    />
                  </Col>
                  <Col span={12}>
                    <InputNumber
                      placeholder="Alto"
                      value={maxHeight}
                      onChange={(val) => setMaxHeight(val)}
                      style={{ width: '100%' }}
                      min={1}
                      max={10000}
                      addonAfter="px"
                    />
                  </Col>
                </Row>
              )}

              {(maxWidth !== null || maxHeight !== null) && (
                <Checkbox
                  checked={maintainAspect}
                  onChange={(e) => setMaintainAspect(e.target.checked)}
                >
                  Mantener proporción
                </Checkbox>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card size="small" title="3. Comprimir">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {images.length > 0 && (
                <div style={{ textAlign: 'center', padding: 16 }}>
                  <Text type="secondary">
                    {processedCount} de {images.length} procesadas
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">Tamaño total:</Text>
                    <div>
                      {totalCompressed > 0 ? (
                        <>
                          <Text delete>{formatFileSize(totalOriginal)}</Text>
                          <Text strong style={{ color: '#52c41a', marginLeft: 8 }}>
                            → {formatFileSize(totalCompressed)}
                          </Text>
                        </>
                      ) : (
                        <Text strong>{formatFileSize(totalOriginal)}</Text>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="primary"
                icon={<CompressOutlined />}
                onClick={handleCompress}
                loading={isProcessing}
                disabled={images.length === 0}
                block
                size="large"
              >
                {isProcessing 
                  ? `Comprimiendo... ${progress}%` 
                  : `Comprimir ${images.length} imagen(es)`
                }
              </Button>

              {isProcessing && <Progress percent={progress} status="active" />}

              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownloadZip}
                disabled={processedCount === 0}
                block
              >
                Descargar ZIP ({processedCount} imágenes)
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </Card>
  );
}