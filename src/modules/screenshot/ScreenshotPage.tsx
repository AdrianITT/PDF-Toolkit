import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Row,
  Col,
  message,
  Alert,
  Typography,
  Divider,
} from 'antd';
import {
  CameraOutlined,
  DesktopOutlined,
  DownloadOutlined,
  CopyOutlined,
  ReloadOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import html2canvas from 'html2canvas';

const { Text, Paragraph } = Typography;

interface CapturedImage {
  id: string;
  dataUrl: string;
  timestamp: Date;
  type: 'screen' | 'element' | 'tauri';
}

export function ScreenshotPage() {
  const [captures, setCaptures] = useState<CapturedImage[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isTauri, setIsTauri] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkTauri = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('get_pdf_info', { path: '' });
        setIsTauri(true);
      } catch {
        setIsTauri(false);
      }
    };
    checkTauri();
  }, []);

  const handleScreenCapture = useCallback(async () => {
    setIsCapturing(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        message.error('Tu navegador no soporta captura de pantalla. Usa Chrome o Edge en escritorio.');
        setIsCapturing(false);
        return;
      }
      
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
      }

      stream.getTracks().forEach((track) => track.stop());

      const dataUrl = canvas.toDataURL('image/png');
      const newCapture: CapturedImage = {
        id: `capture-${Date.now()}`,
        dataUrl,
        timestamp: new Date(),
        type: 'screen',
      };
      setCaptures((prev) => [newCapture, ...prev]);
      message.success('Captura de pantalla realizada');
    } catch (err) {
      console.error('[Screenshot] Error:', err);
      message.error('Error al capturar pantalla. Asegúrate de dar permisos.');
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const handleElementCapture = useCallback(async () => {
    if (!elementRef.current) {
      message.warning('No hay elemento para capturar');
      return;
    }

    setIsCapturing(true);
    try {
      const canvas = await html2canvas(elementRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const dataUrl = canvas.toDataURL('image/png');
      const newCapture: CapturedImage = {
        id: `capture-${Date.now()}`,
        dataUrl,
        timestamp: new Date(),
        type: 'element',
      };
      setCaptures((prev) => [newCapture, ...prev]);
      message.success('Elemento capturado');
    } catch (err) {
      console.error('[Screenshot] Error:', err);
      message.error('Error al capturar elemento');
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const handleTauriCapture = useCallback(async () => {
    if (!isTauri) {
      message.warning('Esta función solo está disponible en la aplicación de escritorio');
      return;
    }

    setIsCapturing(true);
    try {
      message.info('Para captura de pantalla completa en desktop, usa el método nativo del navegador');
      message.info('El plugin de screenshots de Tauri puede ser instalado para funcionalidad avanzada');
    } catch (err) {
      console.error('[Screenshot] Tauri error:', err);
    } finally {
      setIsCapturing(false);
    }
  }, [isTauri]);

  const handleDownload = (capture: CapturedImage) => {
    const link = document.createElement('a');
    link.download = `screenshot-${capture.timestamp.getTime()}.png`;
    link.href = capture.dataUrl;
    link.click();
    message.success('Imagen descargada');
  };

  const handleCopyToClipboard = async (capture: CapturedImage) => {
    try {
      const response = await fetch(capture.dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      message.success('Copiado al portapapeles');
    } catch (err) {
      console.error('[Screenshot] Copy error:', err);
      message.error('Error al copiar');
    }
  };

  const clearCaptures = () => {
    setCaptures([]);
    message.success('Capturas eliminadas');
  };

  return (
    <Card
      title={
        <span>
          <CameraOutlined style={{ marginRight: 8 }} />
          Captura de Pantalla
        </span>
      }
      extra={
        captures.length > 0 && (
          <Button danger icon={<ReloadOutlined />} onClick={clearCaptures}>
            Limpiar
          </Button>
        )
      }
    >
      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card size="small" title="Captura de Pantalla" style={{ marginBottom: 16 }}>
            <Alert
              message="Nota: La captura de pantalla solo funciona en Chrome/Edge de escritorio."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  1. Capturar Área de Ejemplo
                </Text>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                  Captura el recuadro de abajo que ya tiene contenido de ejemplo. Ideal para capturar partes de la interfaz.
                </Text>
                <Button
                  type="primary"
                  icon={<PictureOutlined />}
                  onClick={handleElementCapture}
                  loading={isCapturing}
                  block
                >
                  Capturar Recuadro de Abajo
                </Button>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  2. Captura de Pantalla del Navegador
                </Text>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                  Solo funciona en Chrome o Edge de escritorio. Te permite seleccionar qué ventana o pestaña capturar.
                </Text>
                <Button
                  icon={<DesktopOutlined />}
                  onClick={handleScreenCapture}
                  loading={isCapturing}
                  block
                  disabled={typeof navigator !== 'undefined' && !navigator.mediaDevices?.getDisplayMedia}
                >
                  Seleccionar qué capturar
                </Button>
              </div>

              {isTauri && (
                <>
                  <Divider style={{ margin: '12px 0' }} />
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                      3. Captura Desktop
                    </Text>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                      Usa la app de escritorio para capturar cualquier parte de la pantalla del sistema.
                    </Text>
                    <Button
                      icon={<CameraOutlined />}
                      onClick={handleTauriCapture}
                      block
                      type="dashed"
                    >
                      Captura desde Desktop
                    </Button>
                  </div>
                </>
              )}
            </Space>
          </Card>

          <Card size="small" title="Recuadro a Capturar" style={{ marginBottom: 16 }}>
            <div
              ref={elementRef}
              style={{
                border: '2px dashed var(--ant-color-border)',
                borderRadius: 8,
                padding: 40,
                textAlign: 'center',
                background: 'var(--ant-color-bg-spotlight)',
                minHeight: 200,
              }}
            >
              <Space direction="vertical" size="middle">
                <Text strong style={{ fontSize: 18 }}>
                  Contenido de Ejemplo
                </Text>
                <Text type="secondary">
                  Este es el contenido que se capturará
                </Text>
                <Button type="link">Un botón de ejemplo</Button>
              </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card size="small" title={`Capturas (${captures.length})`}>
            {captures.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <CameraOutlined style={{ fontSize: 48, color: '#ccc' }} />
                <Paragraph type="secondary" style={{ marginTop: 16 }}>
                  No hay capturas todavía
                </Paragraph>
              </div>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                {captures.map((capture) => (
                  <div
                    key={capture.id}
                    style={{
                      border: '1px solid var(--ant-color-border)',
                      borderRadius: 8,
                      padding: 8,
                    }}
                  >
                    <img
                      src={capture.dataUrl}
                      alt="Capture"
                      style={{
                        width: '100%',
                        maxHeight: 150,
                        objectFit: 'contain',
                        borderRadius: 4,
                      }}
                    />
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {capture.timestamp.toLocaleString()} • {capture.type}
                      </Text>
                    </div>
                    <Space style={{ marginTop: 8 }}>
                      <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => handleDownload(capture)}
                      >
                        Descargar
                      </Button>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopyToClipboard(capture)}
                      >
                        Copiar
                      </Button>
                    </Space>
                  </div>
                ))}
              </Space>
            )}
          </Card>
        </Col>
      </Row>
    </Card>
  );
}