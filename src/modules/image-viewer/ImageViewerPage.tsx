import { useState, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Image as AntImage,
  Button,
  Space,
  Typography,
  Pagination,
  Tooltip,
  Slider,
  Segmented,
  message,
} from 'antd';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  LeftOutlined,
  RightOutlined,
  FullscreenOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { saveAs } from 'file-saver';

const { Text, Title } = Typography;

interface ImageItem {
  uid: string;
  name: string;
  url: string;
  size: number;
  width?: number;
  height?: number;
}

type ViewMode = 'gallery' | 'carousel';

export function ImageViewerPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [slideshowActive, setSlideshowActive] = useState(false);
  const [slideshowInterval, setSlideshowInterval] = useState(3000);
  const [transformKey, setTransformKey] = useState(0);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const newImages: ImageItem[] = [];
    let loadedCount = 0;

    fileArray.forEach((file, index) => {
      if (!file.type.startsWith('image/')) {
        message.warning(`${file.name} no es una imagen`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          newImages[index] = {
            uid: `${file.name}-${Date.now()}-${index}`,
            name: file.name,
            url: reader.result as string,
            size: file.size,
            width: img.width,
            height: img.height,
          };
          loadedCount++;
          if (loadedCount === newImages.filter(Boolean).length && loadedCount === fileArray.filter(f => f.type.startsWith('image/')).length) {
            setImages((prev) => [...prev, ...newImages.filter(Boolean)]);
            message.success(`${newImages.filter(Boolean).length} imagen(es) cargada(s)`);
          }
        };
        img.onerror = () => {
          loadedCount++;
          console.error('[ImageViewer] Failed to load image:', file.name);
        };
        img.src = reader.result as string;
      };
      reader.onerror = () => {
        loadedCount++;
        console.error('[ImageViewer] Failed to read file:', file.name);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  }, []);

  const removeImage = (uid: string) => {
    setImages((prev) => prev.filter((img) => img.uid !== uid));
    if (selectedIndex >= images.length - 1 && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const clearAll = () => {
    setImages([]);
    setSelectedIndex(0);
    message.success('Galería limpiada');
  };

  const handlePrev = () => {
    setSelectedIndex((prev) => Math.max(0, prev - 1));
    setTransformKey((prev) => prev + 1);
  };

  const handleNext = () => {
    setSelectedIndex((prev) => Math.min(images.length - 1, prev + 1));
    setTransformKey((prev) => prev + 1);
  };

  const handleDownload = (img: ImageItem) => {
    fetch(img.url)
      .then((res) => res.blob())
      .then((blob) => {
        saveAs(blob, img.name);
        message.success('Imagen descargada');
      });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSlideshowToggle = () => {
    if (!slideshowActive && images.length > 0) {
      setSlideshowActive(true);
      message.info('Slideshow iniciado. Usa los botones de navegación.');
    } else {
      setSlideshowActive(false);
    }
  };

  return (
    <Card
      title={
        <span>
          <AppstoreOutlined style={{ marginRight: 8 }} />
          Visor de Imágenes
        </span>
      }
      extra={
        <Space>
          <Segmented
            options={[
              { value: 'gallery', icon: <AppstoreOutlined />, label: 'Galería' },
              { value: 'carousel', icon: <UnorderedListOutlined />, label: 'Carrusel' },
            ]}
            value={viewMode}
            onChange={(v) => setViewMode(v as ViewMode)}
          />
          {images.length > 0 && (
            <Button danger icon={<DeleteOutlined />} onClick={clearAll}>
              Limpiar todo
            </Button>
          )}
        </Space>
      }
    >
      {images.length === 0 ? (
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
            multiple
            style={{ display: 'none' }}
            id="image-viewer-upload"
            onChange={handleFileChange}
          />
          <label htmlFor="image-viewer-upload" style={{ cursor: 'pointer', display: 'block' }}>
            <div style={{ padding: 20, border: '2px dashed var(--ant-color-border)', borderRadius: 8, background: 'var(--ant-color-bg-spotlight)' }}>
              <UploadOutlined style={{ fontSize: 40, color: '#999' }} />
              <Title level={5} style={{ marginTop: 12, marginBottom: 4 }}>
                Arrastra imágenes aquí
              </Title>
              <Text type="secondary">
                Haz clic para seleccionar
              </Text>
            </div>
          </label>
        </div>
      ) : viewMode === 'gallery' ? (
        <div>
          <Row gutter={[16, 16]}>
            {images.map((img, index) => (
              <Col xs={12} sm={8} md={6} lg={4} key={img.uid}>
                <Card
                  hoverable
                  cover={
                    <div style={{ height: 150, overflow: 'hidden', position: 'relative' }}>
                      <img
                        src={img.url}
                        alt={img.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      {index === selectedIndex && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                          }}
                        >
                          <Button
                            type="primary"
                            size="small"
                            icon={<FullscreenOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIndex(index);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  }
                  onClick={() => setSelectedIndex(index)}
                  style={{
                    border: index === selectedIndex ? '2px solid #1890ff' : '1px solid var(--ant-color-border)',
                  }}
                  actions={[
                    <Tooltip title="Descargar" key="download">
                      <DownloadOutlined onClick={(e) => { e.stopPropagation(); handleDownload(img); }} />
                    </Tooltip>,
                    <Tooltip title="Eliminar" key="delete">
                      <DeleteOutlined onClick={(e) => { e.stopPropagation(); removeImage(img.uid); }} />
                    </Tooltip>,
                  ]}
                >
                  <Card.Meta
                    title={img.name.length > 15 ? img.name.substring(0, 15) + '...' : img.name}
                    description={formatFileSize(img.size)}
                  />
                </Card>
              </Col>
            ))}
          </Row>
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            id="image-viewer-add-more"
            onChange={handleFileChange}
          />
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <label htmlFor="image-viewer-add-more">
              <Button icon={<AntImage />} type="dashed">
                Agregar más imágenes
              </Button>
            </label>
          </div>
        </div>
      ) : (
        <div>
          <Row gutter={24}>
            <Col xs={24} lg={18}>
              <div
                style={{
                  background: '#000',
                  borderRadius: 8,
                  minHeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {images[selectedIndex] && (
                  <TransformWrapper
                    key={transformKey}
                    initialScale={1}
                    minScale={0.5}
                    maxScale={4}
                  >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                      <>
                        <div
                          style={{
                            position: 'absolute',
                            top: 16,
                            left: 16,
                            zIndex: 10,
                          }}
                        >
                          <Space>
                            <Button icon={<ZoomOutOutlined />} onClick={() => zoomOut()} />
                            <Button icon={<ZoomInOutlined />} onClick={() => zoomIn()} />
                            <Button icon={<RotateLeftOutlined />} onClick={() => {}} />
                            <Button icon={<RotateRightOutlined />} onClick={() => {}} />
                            <Button icon={<FullscreenOutlined />} onClick={() => resetTransform()} />
                          </Space>
                        </div>
                        <TransformComponent
                          wrapperStyle={{ width: '100%', height: 500 }}
                          contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <img
                            src={images[selectedIndex].url}
                            alt={images[selectedIndex].name}
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          />
                        </TransformComponent>
                      </>
                    )}
                  </TransformWrapper>
                )}

                {images.length > 1 && (
                  <>
                    <Button
                      type="primary"
                      icon={<LeftOutlined />}
                      onClick={handlePrev}
                      disabled={selectedIndex === 0}
                      style={{
                        position: 'absolute',
                        left: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                    />
                    <Button
                      type="primary"
                      icon={<RightOutlined />}
                      onClick={handleNext}
                      disabled={selectedIndex === images.length - 1}
                      style={{
                        position: 'absolute',
                        right: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                    />
                  </>
                )}
              </div>
            </Col>
            <Col xs={24} lg={6}>
              <Card size="small" title="Información" style={{ marginBottom: 16 }}>
                {images[selectedIndex] && (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{images[selectedIndex].name}</Text>
                    <Text type="secondary">Tamaño: {formatFileSize(images[selectedIndex].size)}</Text>
                    {images[selectedIndex].width && images[selectedIndex].height && (
                      <Text type="secondary">
                        Dimensiones: {images[selectedIndex].width} × {images[selectedIndex].height} px
                      </Text>
                    )}
                    <Text type="secondary">
                      Imagen {selectedIndex + 1} de {images.length}
                    </Text>
                  </Space>
                )}
              </Card>

              <Card size="small" title="Slideshow" style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    type={slideshowActive ? 'primary' : 'default'}
                    onClick={handleSlideshowToggle}
                    block
                  >
                    {slideshowActive ? 'Detener' : 'Iniciar'}
                  </Button>
                  {slideshowActive && (
                    <>
                      <Text>Intervalo: {slideshowInterval / 1000}s</Text>
                      <Slider
                        min={1000}
                        max={10000}
                        step={500}
                        value={slideshowInterval}
                        onChange={setSlideshowInterval}
                      />
                      <Button onClick={handleNext} block>
                        Siguiente
                      </Button>
                    </>
                  )}
                </Space>
              </Card>

              <Card size="small" title="Miniaturas">
                <div style={{ maxHeight: 300, overflow: 'auto' }}>
                  {images.map((img, index) => (
                    <div
                      key={img.uid}
                      onClick={() => {
                        setSelectedIndex(index);
                        setTransformKey((prev) => prev + 1);
                      }}
                      style={{
                        padding: 4,
                        cursor: 'pointer',
                        border: index === selectedIndex ? '2px solid #1890ff' : '1px solid transparent',
                        borderRadius: 4,
                        marginBottom: 4,
                      }}
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        style={{
                          width: '100%',
                          height: 60,
                          objectFit: 'cover',
                          borderRadius: 4,
                        }}
                      />
                      <Text style={{ fontSize: 10 }}>{img.name.substring(0, 12)}...</Text>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>

          {images.length > 1 && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Pagination
                current={selectedIndex + 1}
                total={images.length}
                pageSize={1}
                onChange={(page) => {
                  setSelectedIndex(page - 1);
                  setTransformKey((prev) => prev + 1);
                }}
                showSizeChanger={false}
              />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}