import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Card,
  Tabs,
  Button,
  List,
  message,
  Space,
  Tag,
  Modal,
  Select,
  Switch,
  Alert,
  Typography,
  Divider,
  Empty,
  Input,
  Row,
  Col,
  Radio,
  ColorPicker,
} from 'antd';
import {
  CameraOutlined,
  FileImageOutlined,
  HistoryOutlined,
  CopyOutlined,
  ExportOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  StopOutlined,
  QrcodeOutlined,
  LinkOutlined,
  WifiOutlined,
  MailOutlined,
  PhoneOutlined,
  MessageOutlined,
  FileAddOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import QRCode from 'qrcode';
import { saveAs } from 'file-saver';

const { Text, Paragraph } = Typography;

interface ScanResult {
  id: string;
  text: string;
  format: string;
  timestamp: Date;
  formatLabel: string;
}

type QrContentType = 'text' | 'url' | 'wifi' | 'email' | 'phone' | 'sms';

interface GeneratedQR {
  id: string;
  type: QrContentType;
  content: string;
  displayText: string;
  timestamp: Date;
  imageDataUrl?: string;
  svgContent?: string;
  format: 'png' | 'svg';
  settings: {
    width: number;
    colorDark: string;
    colorLight: string;
  };
}

const QR_CONTENT_TYPES = [
  { value: 'text', label: 'Texto', icon: <FileAddOutlined /> },
  { value: 'url', label: 'URL', icon: <LinkOutlined /> },
  { value: 'wifi', label: 'WiFi', icon: <WifiOutlined /> },
  { value: 'email', label: 'Email', icon: <MailOutlined /> },
  { value: 'phone', label: 'Teléfono', icon: <PhoneOutlined /> },
  { value: 'sms', label: 'SMS', icon: <MessageOutlined /> },
];

const QR_SIZE_OPTIONS = [
  { value: 128, label: '128 px' },
  { value: 256, label: '256 px' },
  { value: 512, label: '512 px' },
  { value: 1024, label: '1024 px' },
];

const BARCODE_FORMATS = [
  { value: 'ALL', label: 'Todos los formatos', formats: [] },
  { value: 'QR_CODE', label: 'QR Code', formats: ['QR_CODE'] },
  { value: 'CODE_128', label: 'Code 128', formats: ['CODE_128'] },
  { value: 'CODE_39', label: 'Code 39', formats: ['CODE_39'] },
  { value: 'CODE_93', label: 'Code 93', formats: ['CODE_93'] },
  { value: 'EAN_13', label: 'EAN-13', formats: ['EAN_13'] },
  { value: 'EAN_8', label: 'EAN-8', formats: ['EAN_8'] },
  { value: 'UPC_A', label: 'UPC-A', formats: ['UPC_A'] },
  { value: 'UPC_E', label: 'UPC-E', formats: ['UPC_E'] },
  { value: 'ITF', label: 'ITF', formats: ['ITF'] },
  { value: 'CODABAR', label: 'Codabar', formats: ['CODABAR'] },
  { value: 'DATA_MATRIX', label: 'Data Matrix', formats: ['DATA_MATRIX'] },
  { value: 'PDF_417', label: 'PDF417', formats: ['PDF_417'] },
  { value: 'AZTEC', label: 'Aztec', formats: ['AZTEC'] },
];

const formatLabel = (format: string): string => {
  const found = BARCODE_FORMATS.find(f => f.value === format);
  return found ? found.label : format;
};

function getQrContent(type: QrContentType, data: {
  text: string;
  url: string;
  wifiSSID: string;
  wifiPassword: string;
  wifiEncryption: string;
  emailTo: string;
  emailSubject: string;
  emailBody: string;
  phoneNumber: string;
  smsNumber: string;
  smsMessage: string;
}): string {
  switch (type) {
    case 'text':
      return data.text;
    case 'url':
      return data.url;
    case 'wifi':
      return `WIFI:T:${data.wifiEncryption};S:${data.wifiSSID};P:${data.wifiPassword};;`;
    case 'email':
      return `mailto:${data.emailTo}?subject=${encodeURIComponent(data.emailSubject)}&body=${encodeURIComponent(data.emailBody)}`;
    case 'phone':
      return `tel:${data.phoneNumber}`;
    case 'sms':
      return `smsto:${data.smsNumber}:${data.smsMessage}`;
    default:
      return data.text;
  }
}

import type { Dispatch, SetStateAction } from 'react';

interface QrGeneratorPanelProps {
  contentType: QrContentType;
  setContentType: (v: QrContentType) => void;
  textContent: string;
  setTextContent: (v: string) => void;
  urlContent: string;
  setUrlContent: (v: string) => void;
  wifiSSID: string;
  setWifiSSID: (v: string) => void;
  wifiPassword: string;
  setWifiPassword: (v: string) => void;
  wifiEncryption: string;
  setWifiEncryption: (v: string) => void;
  emailTo: string;
  setEmailTo: (v: string) => void;
  emailSubject: string;
  setEmailSubject: (v: string) => void;
  emailBody: string;
  setEmailBody: (v: string) => void;
  phoneNumber: string;
  setPhoneNumber: (v: string) => void;
  smsNumber: string;
  setSmsNumber: (v: string) => void;
  smsMessage: string;
  setSmsMessage: (v: string) => void;
  qrSize: number;
  setQrSize: (v: number) => void;
  qrColorDark: string;
  setQrColorDark: (v: string) => void;
  qrColorLight: string;
  setQrColorLight: (v: string) => void;
  qrFormat: 'png' | 'svg';
  setQrFormat: (v: 'png' | 'svg') => void;
  generatedQR: string | null;
  setGeneratedQR: (v: string | null) => void;
  generatedHistory: GeneratedQR[];
  setGeneratedHistory: Dispatch<SetStateAction<GeneratedQR[]>>;
}

function QrGeneratorPanel({
  contentType, setContentType,
  textContent, setTextContent,
  urlContent, setUrlContent,
  wifiSSID, setWifiSSID,
  wifiPassword, setWifiPassword,
  wifiEncryption, setWifiEncryption,
  emailTo, setEmailTo,
  emailSubject, setEmailSubject,
  emailBody, setEmailBody,
  phoneNumber, setPhoneNumber,
  smsNumber, setSmsNumber,
  smsMessage, setSmsMessage,
  qrSize, setQrSize,
  qrColorDark, setQrColorDark,
  qrColorLight, setQrColorLight,
  qrFormat, setQrFormat,
  generatedQR, setGeneratedQR,
  generatedHistory, setGeneratedHistory,
}: QrGeneratorPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePanelTab, setActivePanelTab] = useState<'create' | 'history'>('create');

  const generateQR = useCallback(async () => {
    const content = getQrContent(contentType, {
      text: textContent,
      url: urlContent,
      wifiSSID,
      wifiPassword,
      wifiEncryption,
      emailTo,
      emailSubject,
      emailBody,
      phoneNumber,
      smsNumber,
      smsMessage,
    });

    if (!content) {
      message.warning('Por favor completa los campos requeridos');
      return;
    }

    setIsGenerating(true);
    try {
      let dataUrl: string;
      const options = {
        width: qrSize,
        margin: 1,
        color: {
          dark: qrColorDark,
          light: qrColorLight,
        },
      };

      if (qrFormat === 'svg') {
        dataUrl = await QRCode.toString(content, { ...options, type: 'svg' });
        setGeneratedQR(dataUrl);
      } else {
        dataUrl = await QRCode.toDataURL(content, options);
        setGeneratedQR(dataUrl);
      }

      const newGenerated: GeneratedQR = {
        id: `generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: contentType,
        content,
        displayText: contentType === 'text' ? textContent : 
                     contentType === 'url' ? urlContent :
                     contentType === 'wifi' ? `WiFi: ${wifiSSID}` :
                     contentType === 'email' ? `Email: ${emailTo}` :
                     contentType === 'phone' ? `Tel: ${phoneNumber}` :
                     `SMS: ${smsNumber}`,
        timestamp: new Date(),
        imageDataUrl: qrFormat === 'png' ? dataUrl : undefined,
        svgContent: qrFormat === 'svg' ? dataUrl : undefined,
        format: qrFormat,
        settings: {
          width: qrSize,
          colorDark: qrColorDark,
          colorLight: qrColorLight,
        },
      };
      setGeneratedHistory(prev => [newGenerated, ...prev].slice(0, 50));
      message.success('QR generado correctamente');
    } catch (err) {
      console.error('[QR Generator] Error:', err);
      message.error('Error al generar el QR');
    } finally {
      setIsGenerating(false);
    }
  }, [contentType, textContent, urlContent, wifiSSID, wifiPassword, wifiEncryption, emailTo, emailSubject, emailBody, phoneNumber, smsNumber, smsMessage, qrSize, qrColorDark, qrColorLight, qrFormat, setGeneratedQR, setGeneratedHistory]);

  const handleDownload = () => {
    if (!generatedQR) return;
    
    console.log('[QR Download] qrFormat:', qrFormat);
    console.log('[QR Download] generatedQR starts with data:', generatedQR.startsWith('data:'));
    
    const ext = qrFormat === 'svg' ? 'svg' : 'png';
    const mimeType = qrFormat === 'svg' ? 'image/svg+xml' : 'image/png';
    
    try {
      let blob: Blob;
      if (qrFormat === 'svg') {
        // SVG is already a string
        blob = new Blob([generatedQR], { type: mimeType });
      } else if (generatedQR.startsWith('data:')) {
        // For PNG data URL, extract the base64 part and convert to blob
        const base64Data = generatedQR.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: mimeType });
      } else {
        // Raw binary
        blob = new Blob([generatedQR], { type: mimeType });
      }
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qrcode-${Date.now()}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      message.success('QR descargado');
    } catch (err) {
      console.error('[QR Download] Error:', err);
      message.error('Error al descargar QR');
    }
  };

  const handleCopyToClipboard = async () => {
    if (!generatedQR) return;
    
    if (qrFormat === 'png') {
      try {
        const response = await fetch(generatedQR);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        message.success('Copiado al portapapeles');
      } catch {
        message.error('Error al copiar');
      }
    } else {
      message.warning('SVG no se puede copiar como imagen');
    }
  };

  const deleteGeneratedItem = (id: string) => {
    setGeneratedHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearGeneratedHistory = () => {
    setGeneratedHistory([]);
    message.success('Historial limpiado');
  };

  const renderContentFields = () => {
    switch (contentType) {
      case 'text':
        return (
          <Input.TextArea
            placeholder="Ingresa el texto..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            rows={4}
          />
        );
      case 'url':
        return (
          <Input
            placeholder="https://ejemplo.com"
            value={urlContent}
            onChange={(e) => setUrlContent(e.target.value)}
            prefix={<LinkOutlined />}
          />
        );
      case 'wifi':
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input
              placeholder="Nombre de la red (SSID)"
              value={wifiSSID}
              onChange={(e) => setWifiSSID(e.target.value)}
              prefix={<WifiOutlined />}
            />
            <Input.Password
              placeholder="Contraseña"
              value={wifiPassword}
              onChange={(e) => setWifiPassword(e.target.value)}
            />
            <Select
              value={wifiEncryption}
              onChange={setWifiEncryption}
              style={{ width: '100%' }}
              options={[
                { value: 'WPA', label: 'WPA/WPA2' },
                { value: 'WEP', label: 'WEP' },
                { value: 'nopass', label: 'Sin contraseña' },
              ]}
            />
          </Space>
        );
      case 'email':
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input
              placeholder="Destinatario (email)"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              prefix={<MailOutlined />}
            />
            <Input
              placeholder="Asunto"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
            <Input.TextArea
              placeholder="Mensaje"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={2}
            />
          </Space>
        );
      case 'phone':
        return (
          <Input
            placeholder="Número de teléfono"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            prefix={<PhoneOutlined />}
          />
        );
      case 'sms':
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input
              placeholder="Número"
              value={smsNumber}
              onChange={(e) => setSmsNumber(e.target.value)}
              prefix={<MessageOutlined />}
            />
            <Input.TextArea
              placeholder="Mensaje"
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              rows={2}
            />
          </Space>
        );
    }
  };

  const getTypeIcon = () => {
    const type = QR_CONTENT_TYPES.find(t => t.value === contentType);
    return type?.icon || <QrcodeOutlined />;
  };

  return (
    <div>
      <Tabs
        activeKey={activePanelTab}
        onChange={(v) => setActivePanelTab(v as 'create' | 'history')}
        items={[
          {
            key: 'create',
            label: 'Crear QR',
            children: (
              <Row gutter={24}>
                <Col xs={24} lg={14}>
                  <Card size="small" title="Contenido" style={{ marginBottom: 16 }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Select
                        value={contentType}
                        onChange={setContentType}
                        style={{ width: '100%' }}
                        options={QR_CONTENT_TYPES.map(t => ({
                          value: t.value,
                          label: <Space>{t.icon} {t.label}</Space>,
                        }))}
                      />
                      {renderContentFields()}
                    </Space>
                  </Card>

                  <Card size="small" title="Personalización">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text>Color del QR:</Text>
                        <ColorPicker value={qrColorDark} onChange={(_, hex) => setQrColorDark(hex || '#000000')} />
                      </div>
                      <div>
                        <Text>Color de fondo:</Text>
                        <ColorPicker value={qrColorLight} onChange={(_, hex) => setQrColorLight(hex || '#ffffff')} />
                      </div>
                      <div>
                        <Text>Tamaño:</Text>
                        <Select
                          value={qrSize}
                          onChange={setQrSize}
                          style={{ width: 120 }}
                          options={QR_SIZE_OPTIONS}
                        />
                      </div>
                      <Radio.Group value={qrFormat} onChange={(e) => setQrFormat(e.target.value)}>
                        <Radio.Button value="png">PNG</Radio.Button>
                        <Radio.Button value="svg">SVG</Radio.Button>
                      </Radio.Group>
                    </Space>
                  </Card>
                </Col>

                <Col xs={24} lg={10}>
                  <Card size="small" title="Vista previa" style={{ marginBottom: 16 }}>
                    <div style={{ 
                      textAlign: 'center', 
                      padding: 20, 
                      background: qrColorLight,
                      borderRadius: 8,
                      minHeight: 200,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {generatedQR ? (
                        qrFormat === 'svg' ? (
                          <div dangerouslySetInnerHTML={{ __html: generatedQR }} />
                        ) : (
                          <img src={generatedQR} alt="QR Preview" style={{ maxWidth: '100%' }} />
                        )
                      ) : (
                        <Text type="secondary">El QR se mostrará aquí</Text>
                      )}
                    </div>
                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                      <Button
                        type="primary"
                        icon={getTypeIcon()}
                        onClick={generateQR}
                        loading={isGenerating}
                        block
                      >
                        Generar QR
                      </Button>
                    </div>
                  </Card>

                  {generatedQR && (
                    <Card size="small" title="Acciones">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Button
                          icon={<DownloadOutlined />}
                          onClick={handleDownload}
                          block
                        >
                          Descargar {qrFormat.toUpperCase()}
                        </Button>
                        <Button
                          icon={<CopyOutlined />}
                          onClick={handleCopyToClipboard}
                          disabled={qrFormat === 'svg'}
                          block
                        >
                          Copiar al portapapeles
                        </Button>
                      </Space>
                    </Card>
                  )}
                </Col>
              </Row>
            ),
          },
          {
            key: 'history',
            label: `Historial (${generatedHistory.length})`,
            children: (
              <div>
                {generatedHistory.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No hay QR generados"
                  />
                ) : (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <Button
                        icon={<DeleteOutlined />}
                        onClick={clearGeneratedHistory}
                        danger
                        disabled={generatedHistory.length === 0}
                      >
                        Limpiar todo
                      </Button>
                    </div>
                    <List
                      size="small"
                      dataSource={generatedHistory}
                      renderItem={(item) => (
                        <List.Item
                          actions={[
                            <Button
                              key="download"
                              size="small"
                              icon={<DownloadOutlined />}
                              onClick={() => {
                                if (item.format === 'svg' && item.svgContent) {
                                  const blob = new Blob([item.svgContent], { type: 'image/svg+xml' });
                                  saveAs(blob, `qr-${item.timestamp.getTime()}.svg`);
                                  message.success('Descargado SVG');
                                } else if (item.imageDataUrl) {
                                  saveAs(item.imageDataUrl, `qr-${item.timestamp.getTime()}.png`);
                                  message.success('Descargado PNG');
                                } else {
                                  message.warning('No hay imagen para descargar');
                                }
                              }}
                              disabled={!item.imageDataUrl && !item.svgContent}
                            >
                              Descargar
                            </Button>,
                            <Button
                              key="delete"
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => deleteGeneratedItem(item.id)}
                            />,
                          ]}
                        >
                          <List.Item.Meta
                            avatar={
                              item.imageDataUrl ? (
                                <img src={item.imageDataUrl} alt="QR" style={{ width: 40, height: 40 }} />
                              ) : (
                                <QrcodeOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                              )
                            }
                            title={
                              <Space>
                                <Tag color="blue">{QR_CONTENT_TYPES.find(t => t.value === item.type)?.label}</Tag>
                                <Text>{item.displayText.substring(0, 30)}...</Text>
                              </Space>
                            }
                            description={item.timestamp.toLocaleString()}
                          />
                        </List.Item>
                      )}
                    />
                  </>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

export function QrScannerPage() {
  const [activeTab, setActiveTab] = useState<string>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [fileInputRef] = useState(() => ({ current: null as HTMLInputElement | null }));
  const scannerRef = useRef<any>(null);

  // Estados del generador de QR
  const [contentType, setContentType] = useState<QrContentType>('url');
  const [textContent, setTextContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [wifiSSID, setWifiSSID] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState('WPA');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsNumber, setSmsNumber] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [qrSize, setQrSize] = useState(256);
  const [qrColorDark, setQrColorDark] = useState('#000000');
  const [qrColorLight, setQrColorLight] = useState('#ffffff');
  const [qrFormat, setQrFormat] = useState<'png' | 'svg'>('png');
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [generatedHistory, setGeneratedHistory] = useState<GeneratedQR[]>([]);

  const playSound = useCallback(() => {
    if (soundEnabled) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      oscillator.start();
      setTimeout(() => oscillator.stop(), 150);
    }
  }, [soundEnabled]);

  const handleScanSuccess = useCallback((decodedText: string, decodedResult: any) => {
    playSound();
    const format = decodedResult?.result?.format?.formatName || 'UNKNOWN';
    const newResult: ScanResult = {
      id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: decodedText,
      format: format,
      timestamp: new Date(),
      formatLabel: formatLabel(format),
    };
    setCurrentResult(newResult);
    setShowResultModal(true);
    setIsScanning(false);
    setHistory(prev => [newResult, ...prev].slice(0, 50));
  }, [playSound]);

  const handleScanError = useCallback((errorMessage: string) => {
    // Only log meaningful errors, not "QR code not found" spam
    if (!errorMessage.includes('NotFoundException') && !errorMessage.includes('No MultiFormat Readers')) {
      console.log('[QR Scanner] Error:', errorMessage);
    }
  }, []);

  useEffect(() => {
    let html5QrcodeScanner: any = null;

    if (activeTab === 'camera' && isScanning) {
      const loadScanner = async () => {
        try {
          setCameraError(null);
          
          // Pre-flight check: verify browser supports camera
          console.log('[QR Scanner] Checking browser capabilities...');
          console.log('[QR Scanner] navigator.mediaDevices exists:', !!navigator.mediaDevices);
          console.log('[QR Scanner] navigator.mediaDevices.getUserMedia exists:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
          console.log('[QR Scanner] isSecureContext:', window.isSecureContext);
          console.log('[QR Scanner] location protocol:', window.location.protocol);
          
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraError('Tu navegador no soporta acceso a cámara. Prueba con Chrome o Firefox.');
            setIsScanning(false);
            return;
          }
          
          if (!window.isSecureContext && window.location.protocol !== 'file:') {
            setCameraError('La cámara requiere HTTPS o localhost. Estás usando: ' + window.location.protocol + '//' + window.location.host);
            setIsScanning(false);
            return;
          }
          
          const Html5Qrcode = (await import('html5-qrcode')).Html5Qrcode;
          html5QrcodeScanner = new Html5Qrcode('qr-reader');

          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          };

          await html5QrcodeScanner.start(
            { facingMode: 'environment' },
            config,
            handleScanSuccess,
            handleScanError
          );

          scannerRef.current = html5QrcodeScanner;
        } catch (err: any) {
          console.error('[QR Scanner] Error al iniciar:', err);
          const errorMsg = (err.message || err.toString() || '');
          console.log('[QR Scanner] Error message parsed:', errorMsg);
          console.log('[QR Scanner] Error name:', err.name);
          console.log('[QR Scanner] Full error object:', JSON.stringify(err));
          
          // Check for specific error patterns
          const isPermissionDenied = errorMsg.includes('Permission') || errorMsg.includes('NotAllowed') || errorMsg.includes('denied');
          const isNotFound = err.name === 'NotFoundError' || errorMsg.includes('not found') || errorMsg.includes('no device');
          const isNotSupported = errorMsg.includes('not supported') || errorMsg.includes('NotSupported');
          const isSecureContext = errorMsg.includes('secure context') || errorMsg.includes('HTTPS');
          
          if (isPermissionDenied) {
            setCameraError('Permiso de cámara denegado. Haz clic en el icono de cámara en la barra del navegador y permite el acceso.');
          } else if (isNotFound) {
            setCameraError('No se detectó ninguna cámara. Conecta una cámara al dispositivo.');
          } else if (isNotSupported || isSecureContext) {
            setCameraError('La cámara requiere contexto seguro (HTTPS) o tu navegador no soporta acceso a cámara. Usa Chrome/Firefox en HTTPS o localhost.');
          } else if (errorMsg.includes('Camera streaming')) {
            setCameraError('Tu navegador no soporta acceso a cámara en esta aplicación. Prueba con Chrome o Firefox en HTTPS.');
          } else {
            setCameraError('Error al acceder a la cámara: ' + errorMsg);
          }
          setIsScanning(false);
        }
      };

      loadScanner();
    }

    return () => {
      if (html5QrcodeScanner && html5QrcodeScanner.isScanning) {
        html5QrcodeScanner.stop().catch(console.error);
      }
    };
  }, [activeTab, isScanning, selectedFormat, handleScanSuccess, handleScanError]);

  const toggleScanning = () => {
    if (isScanning) {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
      setIsScanning(false);
    } else {
      setIsScanning(true);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const Html5Qrcode = (await import('html5-qrcode')).Html5Qrcode;
      const html5QrCode = new Html5Qrcode('qr-reader-file');

      const result = await html5QrCode.scanFile(file, true);
      handleScanSuccess(result, { result: { format: { formatName: 'UNKNOWN' } } });
    } catch (err: any) {
      console.error('[QR Scanner] Error escaneando archivo:', err);
      message.error('No se pudo detectar ningún código en la imagen');
    }

    event.target.value = '';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('Copiado al portapapeles');
    });
  };

  const openUrl = (text: string) => {
    if (text.startsWith('http://') || text.startsWith('https://')) {
      window.open(text, '_blank');
    } else {
      message.warning('El texto no es una URL válida');
    }
  };

  const clearHistory = () => {
    setHistory([]);
    message.success('Historial limpiado');
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const exportHistory = () => {
    const content = history.map(item =>
      `[${item.timestamp.toLocaleString()}] ${item.formatLabel}: ${item.text}`
    ).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr-history-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    message.success('Historial exportado');
  };

  const tabItems = [
    {
      key: 'camera',
      label: (
        <span>
          <CameraOutlined /> Cámara
        </span>
      ),
      children: (
        <div>
          {cameraError && (
            <Alert
              type="error"
              message="Error de cámara"
              description={cameraError}
              showIcon
              style={{ marginBottom: 16 }}
              action={
                <Button size="small" onClick={() => setActiveTab('file')}>
                  Cargar imagen
                </Button>
              }
            />
          )}

          <div
            id="qr-reader"
            style={{
              width: '100%',
              maxWidth: 500,
              margin: '0 auto',
              minHeight: 300,
              display: isScanning ? 'block' : 'none',
              background: '#000',
              borderRadius: 8,
            }}
          />

          {!isScanning && (
            <div
              style={{
                width: '100%',
                maxWidth: 500,
                margin: '0 auto',
                minHeight: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--ant-color-bg-spotlight)',
                borderRadius: 8,
                border: '2px dashed var(--ant-color-border)',
              }}
            >
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Haz clic en 'Iniciar' para comenzar a escanear"
              />
            </div>
          )}

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Select
                value={selectedFormat}
                onChange={setSelectedFormat}
                style={{ width: 200 }}
                disabled={isScanning}
                options={BARCODE_FORMATS.map(f => ({
                  value: f.value,
                  label: f.label,
                }))}
              />

              <Space>
                <Button
                  type="primary"
                  size="large"
                  icon={isScanning ? <StopOutlined /> : <PlayCircleOutlined />}
                  onClick={toggleScanning}
                  danger={isScanning}
                >
                  {isScanning ? 'Detener' : 'Iniciar Escaneo'}
                </Button>
              </Space>

              <Switch
                checked={soundEnabled}
                onChange={setSoundEnabled}
                checkedChildren="Sonido ON"
                unCheckedChildren="Sonido OFF"
              />
            </Space>
          </div>
        </div>
      ),
    },
    {
      key: 'file',
      label: (
        <span>
          <FileImageOutlined /> Cargar Imagen
        </span>
      ),
      children: (
        <div>
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileUpload}
          />

          <div
            style={{
              width: '100%',
              maxWidth: 500,
              margin: '0 auto',
              minHeight: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--ant-color-bg-spotlight)',
              borderRadius: 8,
              border: '2px dashed var(--ant-color-border)',
              cursor: 'pointer',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={{ textAlign: 'center' }}>
              <FileImageOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              <Paragraph style={{ marginTop: 16 }}>
                Haz clic para seleccionar una imagen
              </Paragraph>
              <Text type="secondary">
                Formatos soportados: JPG, PNG, GIF, WebP
              </Text>
            </div>
          </div>

          <div
            id="qr-reader-file"
            style={{
              width: '100%',
              maxWidth: 500,
              margin: '16px auto',
              display: 'none',
            }}
          />
        </div>
      ),
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined /> Historial ({history.length})
        </span>
      ),
      children: (
        <div>
          {history.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No hay escaneos recientes"
            />
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <Space>
                  <Button
                    icon={<ExportOutlined />}
                    onClick={exportHistory}
                    disabled={history.length === 0}
                  >
                    Exportar
                  </Button>
                  <Button
                    icon={<DeleteOutlined />}
                    onClick={clearHistory}
                    danger
                    disabled={history.length === 0}
                  >
                    Limpiar todo
                  </Button>
                </Space>
              </div>

              <List
                size="small"
                dataSource={history}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => copyToClipboard(item.text)}
                      >
                        Copiar
                      </Button>,
                      (item.text.startsWith('http://') || item.text.startsWith('https://')) && (
                        <Button
                          type="text"
                          size="small"
                          icon={<LinkOutlined />}
                          onClick={() => openUrl(item.text)}
                        >
                          Abrir
                        </Button>
                      ),
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => deleteHistoryItem(item.id)}
                      />,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<QrcodeOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                      title={
                        <Space>
                          <Text code style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.text.length > 30 ? item.text.substring(0, 30) + '...' : item.text}
                          </Text>
                          <Tag color="blue">{item.formatLabel}</Tag>
                        </Space>
                      }
                      description={item.timestamp.toLocaleString()}
                    />
                  </List.Item>
                )}
              />
            </>
          )}
        </div>
      ),
    },
    {
      key: 'generate',
      label: (
        <span>
          <FileAddOutlined /> Generar
        </span>
      ),
      children: (
        <QrGeneratorPanel
          contentType={contentType}
          setContentType={setContentType}
          textContent={textContent}
          setTextContent={setTextContent}
          urlContent={urlContent}
          setUrlContent={setUrlContent}
          wifiSSID={wifiSSID}
          setWifiSSID={setWifiSSID}
          wifiPassword={wifiPassword}
          setWifiPassword={setWifiPassword}
          wifiEncryption={wifiEncryption}
          setWifiEncryption={setWifiEncryption}
          emailTo={emailTo}
          setEmailTo={setEmailTo}
          emailSubject={emailSubject}
          setEmailSubject={setEmailSubject}
          emailBody={emailBody}
          setEmailBody={setEmailBody}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          smsNumber={smsNumber}
          setSmsNumber={setSmsNumber}
          smsMessage={smsMessage}
          setSmsMessage={setSmsMessage}
          qrSize={qrSize}
          setQrSize={setQrSize}
          qrColorDark={qrColorDark}
          setQrColorDark={setQrColorDark}
          qrColorLight={qrColorLight}
          setQrColorLight={setQrColorLight}
          qrFormat={qrFormat}
          setQrFormat={setQrFormat}
          generatedQR={generatedQR}
          setGeneratedQR={setGeneratedQR}
          generatedHistory={generatedHistory}
          setGeneratedHistory={setGeneratedHistory}
        />
      ),
    },
  ];

  return (
    <Card
      title={
        <span>
          <QrcodeOutlined style={{ marginRight: 8 }} />
          Escáner QR / Código de Barras
        </span>
      }
      extra={
        <Tag color="green">
          ✓ Local
        </Tag>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      <Modal
        title="Código Detectado"
        open={showResultModal}
        onOk={() => setShowResultModal(false)}
        onCancel={() => setShowResultModal(false)}
        width={500}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={() => currentResult && copyToClipboard(currentResult.text)}>
            Copiar
          </Button>,
          (currentResult?.text.startsWith('http://') || currentResult?.text.startsWith('https://')) && (
            <Button key="open" type="primary" icon={<LinkOutlined />} onClick={() => currentResult && openUrl(currentResult.text)}>
              Abrir URL
            </Button>
          ),
          <Button key="close" onClick={() => setShowResultModal(false)}>
            Cerrar
          </Button>,
        ]}
      >
        {currentResult && (
          <div>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">Tipo de código:</Text>
                <br />
                <Tag color="blue" style={{ marginTop: 4 }}>{currentResult.formatLabel}</Tag>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div>
                <Text type="secondary">Contenido:</Text>
                <br />
                <Paragraph
                  copyable
                  style={{
                    marginTop: 4,
                    padding: 12,
                    background: 'var(--ant-color-bg-spotlight)',
                    borderRadius: 4,
                    wordBreak: 'break-all',
                  }}
                >
                  {currentResult.text}
                </Paragraph>
              </div>
              <div>
                <Text type="secondary">Detectado:</Text>
                <br />
                <Text>{currentResult.timestamp.toLocaleString()}</Text>
              </div>
            </Space>
          </div>
        )}
      </Modal>
    </Card>
  );
}