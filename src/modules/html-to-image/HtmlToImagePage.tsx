import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, Input, Row, Col, Button, ColorPicker, Upload, message, Space, Select, Divider, Slider, List, Modal, Tabs } from 'antd';
import { 
  DownloadOutlined, 
  UploadOutlined, 
  ReloadOutlined,
  EditOutlined,
  EyeOutlined,
  DesktopOutlined,
  MobileOutlined
} from '@ant-design/icons';
import { toPng } from 'html-to-image';

interface EmailSignature {
  name: string;
  title: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  linkedin: string;
  twitter: string;
  logoUrl: string;
  bgColor: string;
  textColor: string;
  linkColor: string;
  accentColor: string;
  layout: 'horizontal' | 'vertical' | 'stacked';
  width: number;
  fontFamily: string;
  fontSize: number;
  borderRadius: number;
}

interface SignatureTemplate {
  id: string;
  name: string;
  base: Partial<EmailSignature>;
}

const defaultSignature: EmailSignature = {
  name: 'Juan Pérez',
  title: 'Desarrollador Senior',
  email: 'juan@empresa.com',
  phone: '+1 234 567 890',
  company: 'Mi Empresa S.A.',
  website: 'www.empresa.com',
  linkedin: '',
  twitter: '',
  logoUrl: '',
  bgColor: '#ffffff',
  textColor: '#333333',
  linkColor: '#1890ff',
  accentColor: '#1890ff',
  layout: 'horizontal',
  width: 600,
  fontFamily: 'Arial, sans-serif',
  fontSize: 14,
  borderRadius: 8,
};

const signatureTemplates: SignatureTemplate[] = [
  {
    id: 'minimal',
    name: 'Minimalista',
    base: { bgColor: '#ffffff', textColor: '#333333', linkColor: '#666666', accentColor: '#1890ff', borderRadius: 0 }
  },
  {
    id: 'modern',
    name: 'Moderno',
    base: { bgColor: '#f0f5ff', textColor: '#1a1a2e', linkColor: '#1890ff', accentColor: '#ff6b35', borderRadius: 12 }
  },
  {
    id: 'bold',
    name: 'Audaz',
    base: { bgColor: '#1a1a2e', textColor: '#ffffff', linkColor: '#00d4ff', accentColor: '#00d4ff', borderRadius: 0 }
  },
  {
    id: 'elegant',
    name: 'Elegante',
    base: { bgColor: '#fffbf0', textColor: '#2d2d2d', linkColor: '#8b4513', accentColor: '#8b4513', borderRadius: 4 }
  },
];

export function HtmlToImagePage() {
  const previewRef = useRef<HTMLDivElement>(null);
  const htmlPreviewRef = useRef<HTMLDivElement>(null);
  const [sig, setSig] = useState<EmailSignature>(defaultSignature);
  const [isConverting, setIsConverting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('minimal');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg' | 'html'>('png');
  const [savedSignatures, setSavedSignatures] = useState<{id: string; name: string; data: EmailSignature}[]>([]);
  const [loadSignatureId, setLoadSignatureId] = useState<string>('');
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'html'>('visual');
  const [htmlCode, setHtmlCode] = useState(`<table cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; font-size: 14px;">
  <tr>
    <td style="padding: 10px; border-left: 3px solid #1890ff;">
      <strong style="font-size: 16px; color: #333;">Tu Nombre</strong><br/>
      <span style="color: #666;">Tu Cargo</span>
    </td>
  </tr>
  <tr>
    <td style="padding: 10px; color: #666;">
      <a href="mailto:email@empresa.com" style="color: #1890ff; text-decoration: none;">email@empresa.com</a><br/>
      <span style="color: #999;">+1 234 567 890</span>
    </td>
  </tr>
</table>`);

  const defaultHtmlSignature = htmlCode;

  useEffect(() => {
    const saved = localStorage.getItem('savedEmailSignatures');
    if (saved) {
      try {
        setSavedSignatures(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const saveSignature = (name: string) => {
    setIsSaving(true);
    setTimeout(() => {
      const newSig = { id: Date.now().toString(), name, data: sig };
      const updated = [...savedSignatures, newSig];
      setSavedSignatures(updated);
      localStorage.setItem('savedEmailSignatures', JSON.stringify(updated));
      message.success(`Firma "${name}" guardada`);
      setIsSaving(false);
    }, 300);
  };

  const loadSignatureFromSaved = () => {
    if (loadSignatureId) {
      setIsLoading(true);
      setTimeout(() => {
        const found = savedSignatures.find(s => s.id === loadSignatureId);
        if (found) {
          setSig(found.data);
          message.success(`Firma "${found.name}" cargada`);
          setShowSavedModal(false);
        }
        setIsLoading(false);
      }, 300);
    }
  };

  const deleteSignatureFromSaved = (id: string) => {
    const updated = savedSignatures.filter(s => s.id !== id);
    setSavedSignatures(updated);
    localStorage.setItem('savedEmailSignatures', JSON.stringify(updated));
    message.success('Firma eliminada');
  };

  const updateField = useCallback((field: keyof EmailSignature, value: unknown) => {
    setSig(prev => ({ ...prev, [field]: value }));
  }, []);

  const applyTemplate = useCallback((templateId: string) => {
    const template = signatureTemplates.find(t => t.id === templateId);
    if (template) {
      setSig(prev => ({ ...prev, ...template.base }));
      setSelectedTemplate(templateId);
      message.success(`Plantilla "${template.name}" aplicada`);
    }
  }, []);

  const resetSignature = useCallback(() => {
    setSig(defaultSignature);
    setSelectedTemplate('minimal');
    message.info('Firma reiniciada');
  }, []);

  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      updateField('logoUrl', reader.result as string);
      message.success('Logo cargado');
    };
    reader.readAsDataURL(file);
    return false;
  };

  const removeLogo = () => {
    updateField('logoUrl', '');
    message.info('Logo eliminado');
  };

  const loadGoogleFonts = async (htmlCode: string): Promise<string[]> => {
    const supportedWarnings: string[] = [];

    if (htmlCode.includes('linear-gradient')) {
      supportedWarnings.push('linear-gradient (no soportado, será reemplazado por color sólido)');
    }
    if (htmlCode.includes('@import') && !htmlCode.includes('fonts.googleapis.com')) {
      supportedWarnings.push('CSS externo @import (puede no renderizarse)');
    }

    const fontPatterns = [
      /fonts\.googleapis\.com\/css2\?family=([^&"']+)/g,
      /@import\s+url\(['"]https?:\/\/fonts\.googleapis\.com\/css2\?family=([^&"']+)/g,
    ];

    const fontUrls = new Set<string>();

    for (const pattern of fontPatterns) {
      let match;
      while ((match = pattern.exec(htmlCode)) !== null) {
        const encodedFamily = match[1];
        const fontUrl = `https://fonts.googleapis.com/css2?family=${encodedFamily}&display=swap`;
        fontUrls.add(fontUrl);
      }
    }

    if (fontUrls.size === 0) return [];

    const loadFont = (url: string): Promise<void> => {
      return new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        link.onload = () => {
          console.log('[HtmlToImage] Fuente CSS cargada:', url);
          resolve();
        };
        link.onerror = () => {
          console.warn('[HtmlToImage] Error cargando CSS:', url);
          resolve();
        };
        document.head.appendChild(link);
      });
    };

    await Promise.all(Array.from(fontUrls).map(loadFont));
    await new Promise(r => setTimeout(r, 500));

    return supportedWarnings;
  };

  const createColorPlaceholder = (bgColor: string, width: number, height: number): string => {
    const canvas = document.createElement('canvas');
    canvas.width = width || 80;
    canvas.height = height || 80;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = bgColor || '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#999999';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('IMG', canvas.width / 2, canvas.height / 2 + 3);
    }
    return canvas.toDataURL('image/png');
  };

  const sanitizeForExport = (element: HTMLElement, bgColor: string): string[] => {
    const replacedUrls: string[] = [];
    const imgElements = element.querySelectorAll('img');

    imgElements.forEach((img) => {
      const src = img.src;
      if (src && /^https?:\/\//i.test(src)) {
        try {
          const url = new URL(src);
          if (!url.hostname.includes(window.location.hostname) && !url.hostname.includes('localhost')) {
            const placeholder = createColorPlaceholder(bgColor, img.width || 80, img.height || 80);
            img.src = placeholder;
            replacedUrls.push(src);
            console.log('[HtmlToImage] Imagen externa reemplazada:', url.hostname);
          }
        } catch (e) {
          console.warn('[HtmlToImage] URL inválida:', src);
        }
      }
    });

    return replacedUrls;
  };

  const exportAsImage = async () => {
    const previewEl = activeTab === 'html' ? htmlPreviewRef.current : previewRef.current;
    if (!previewEl) {
      message.error('No hay vista previa para exportar');
      return;
    }

    setIsConverting(true);
    console.log('[HtmlToImage] Exportando firma como', exportFormat);

    try {
      if (activeTab === 'html') {
        await loadGoogleFonts(htmlCode);

        let htmlToUse = htmlCode;

        if (htmlCode.includes('linear-gradient')) {
          console.log('[HtmlToImage] Reemplazando linear-gradient...');
          htmlToUse = htmlCode
            .replace(/linear-gradient\([^)]+\)/g, '#cccccc')
            .replace(/background:\s*linear-gradient[^;]+;/g, 'background: #cccccc;');
        }

        previewEl.innerHTML = htmlToUse;
        await new Promise(r => setTimeout(r, 150));
      }

      const bgColor = activeTab === 'html' ? '#ffffff' : (sig.bgColor || '#ffffff');
      const replacedUrls = sanitizeForExport(previewEl, bgColor);
      if (replacedUrls.length > 0) {
        message.warning(`Se reemplazaron ${replacedUrls.length} imagen(es) externa(s) por placeholders`);
      }

      const dataUrl = await toPng(previewEl, {
        quality: 1,
        pixelRatio: 4,
        cacheBust: true,
        backgroundColor: bgColor,
      });

      if (!dataUrl || dataUrl === 'data:image/png;base64,') {
        message.error('Error al generar imagen. Data URL vacío.');
        setIsConverting(false);
        return;
      }

      const filename = exportFormat === 'html' 
        ? `firma-correo-${Date.now()}.html`
        : `firma-correo-${Date.now()}.${exportFormat}`;

      if (exportFormat === 'html') {
        const link = document.createElement('a');
        link.href = `data:text/html;charset=utf-8,${encodeURIComponent(previewEl?.outerHTML || '')}`;
        link.download = filename;
        link.click();
      } else {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        link.click();
      }

      console.log('[HtmlToImage] Exportado:', filename);
      message.success(`Exportado: ${filename}`);
      
    } catch (err) {
      console.error('[HtmlToImage] Error:', err);
      message.error('Error al exportar. Fallback a HTML');

      const link = document.createElement('a');
      link.href = `data:text/html;charset=utf-8,${encodeURIComponent(previewEl.outerHTML)}`;
      link.download = `firma-correo-${Date.now()}.html`;
      link.click();
    } finally {
      setIsConverting(false);
    }
  };

  const renderPreview = () => {
    const isHorizontal = sig.layout === 'horizontal';
    const isStacked = sig.layout === 'stacked';
    
    const containerStyle: React.CSSProperties = {
      width: previewMode === 'mobile' ? 375 : sig.width,
      maxWidth: '100%',
      padding: 20,
      background: sig.bgColor,
      fontFamily: sig.fontFamily,
      fontSize: sig.fontSize,
      borderRadius: sig.borderRadius,
      border: '1px solid #e0e0e0',
    };

    const textStyle: React.CSSProperties = {
      color: sig.textColor,
    };

    const linkStyle: React.CSSProperties = {
      color: sig.linkColor,
      textDecoration: 'none',
    };

    const accentStyle: React.CSSProperties = {
      color: sig.accentColor,
    };

    const renderContent = () => (
      <>
        {sig.logoUrl && (
          <div style={{ 
            marginRight: isHorizontal ? 20 : 0, 
            marginBottom: isStacked ? 16 : 0,
            textAlign: 'center' 
          }}>
            <img
              src={sig.logoUrl}
              alt="Logo"
              style={{
                width: 80,
                height: 80,
                objectFit: 'contain',
                borderRadius: Math.min(sig.borderRadius, 8),
              }}
            />
          </div>
        )}
        
        <div style={{
          display: isHorizontal ? 'inline-block' : 'block',
          verticalAlign: 'middle',
          textAlign: isStacked ? 'center' : 'left',
        }}>
          <div style={{ ...textStyle, fontSize: sig.fontSize + 4, fontWeight: 'bold' }}>
            {sig.name || 'Tu Nombre'}
          </div>
          
          <div style={{ ...accentStyle, fontSize: sig.fontSize, fontWeight: 500, marginTop: 2 }}>
            {sig.title || 'Tu Cargo'}
          </div>
          
          <Divider style={{ margin: '8px 0', borderColor: sig.accentColor + '30' }} />
          
          <div style={{ ...textStyle, fontSize: sig.fontSize - 1, opacity: 0.9 }}>
            {sig.company && (
              <div style={{ fontWeight: 600 }}>{sig.company}</div>
            )}
            
            <div style={{ marginTop: 4 }}>
              <a href={`mailto:${sig.email}`} style={linkStyle}>
                {sig.email || 'email@ejemplo.com'}
              </a>
            </div>
            
            {sig.phone && (
              <div>
                <a href={`tel:${sig.phone}`} style={linkStyle}>
                  {sig.phone}
                </a>
              </div>
            )}
            
            {sig.website && (
              <div>
                <a href={`https://${sig.website}`} style={linkStyle} target="_blank">
                  {sig.website}
                </a>
              </div>
            )}
          </div>
          
          {(sig.linkedin || sig.twitter) && (
            <Space style={{ marginTop: 8 }} size={8}>
              {sig.linkedin && (
                <a href={sig.linkedin} style={accentStyle} target="_blank">
                  LinkedIn
                </a>
              )}
              {sig.twitter && (
                <a href={sig.twitter} style={accentStyle} target="_blank">
                  Twitter
                </a>
              )}
            </Space>
          )}
        </div>
      </>
    );

    if (isHorizontal) {
      return (
        <div style={{ ...containerStyle, display: 'flex', alignItems: 'center' }}>
          {renderContent()}
        </div>
      );
    }
    
    if (isStacked) {
      return (
        <div style={{ ...containerStyle, textAlign: 'center' }}>
          {renderContent()}
        </div>
      );
    }
    
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center' }}>
        {renderContent()}
      </div>
    );
  };

  return (
    <Card
      title={
        <Space>
          <EditOutlined />
          Creador de Firmas de Correo
        </Space>
      }
      extra={
        <Space>
          <Select
            value={exportFormat}
            onChange={setExportFormat}
            style={{ width: 90 }}
            size="small"
          >
            <Select.Option value="png">PNG</Select.Option>
            <Select.Option value="jpg">JPG</Select.Option>
            <Select.Option value="html">HTML</Select.Option>
          </Select>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={exportAsImage}
            loading={isConverting}
            size="small"
          >
            Exportar
          </Button>
        </Space>
      }
    >
      <Tabs activeKey={activeTab} onChange={(k) => setActiveTab(k as 'visual' | 'html')} style={{ marginBottom: 16 }}>
        <Tabs.TabPane key="visual" tab="Editor Visual">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={10}>
              <Card 
                title="Configuración" 
                size="small"
            extra={
              <Space>
                <Button type="text" icon={<ReloadOutlined />} onClick={resetSignature} size="small">
                  Reiniciar
                </Button>
                <Button type="text" onClick={() => saveSignature(prompt('Nombre:') || 'Sin nombre')} size="small" loading={isSaving}>
                  Guardar
                </Button>
                <Button type="text" onClick={() => setShowSavedModal(true)} size="small" loading={isLoading} disabled={savedSignatures.length === 0}>
                  Cargar ({savedSignatures.length})
                </Button>
              </Space>
            }
          >
            <Row gutter={[8, 8]}>
              <Col span={24}>
                <Space.Compact style={{ width: '100%' }}>
                  <Select
                    value={selectedTemplate}
                    onChange={applyTemplate}
                    style={{ width: '60%' }}
                    placeholder="Plantilla"
                  >
                    {signatureTemplates.map(t => (
                      <Select.Option key={t.id} value={t.id}>
                        {t.name}
                      </Select.Option>
                    ))}
                  </Select>
                  <Select
                    value={sig.layout}
                    onChange={(v) => updateField('layout', v)}
                    style={{ width: '40%' }}
                  >
                    <Select.Option value="horizontal">Horizontal</Select.Option>
                    <Select.Option value="vertical">Vertical</Select.Option>
                    <Select.Option value="stacked">Apilado</Select.Option>
                  </Select>
                </Space.Compact>
              </Col>

              <Col span={12}>
                <Input
                  placeholder="Nombre"
                  prefix={<span style={{ color: '#aaa' }}>👤</span>}
                  value={sig.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </Col>
              <Col span={12}>
                <Input
                  placeholder="Cargo"
                  value={sig.title}
                  onChange={(e) => updateField('title', e.target.value)}
                />
              </Col>

              <Col span={12}>
                <Input
                  placeholder="Email"
                  prefix={<span style={{ color: '#aaa' }}>✉</span>}
                  value={sig.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </Col>
              <Col span={12}>
                <Input
                  placeholder="Teléfono"
                  prefix={<span style={{ color: '#aaa' }}>☎</span>}
                  value={sig.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
              </Col>

              <Col span={12}>
                <Input
                  placeholder="Empresa"
                  value={sig.company}
                  onChange={(e) => updateField('company', e.target.value)}
                />
              </Col>
              <Col span={12}>
                <Input
                  placeholder="Web"
                  value={sig.website}
                  onChange={(e) => updateField('website', e.target.value)}
                />
              </Col>

              <Col span={24}>
                <Divider style={{ margin: '12px 0', borderColor: sig.accentColor + '30' }}>Redes Sociales</Divider>
              </Col>

              <Col span={12}>
                <Input
                  placeholder="LinkedIn URL"
                  prefix={<span style={{ color: '#0077b5' }}>in</span>}
                  value={sig.linkedin}
                  onChange={(e) => updateField('linkedin', e.target.value)}
                />
              </Col>
              <Col span={12}>
                <Input
                  placeholder="Twitter URL"
                  prefix={<span style={{ color: '#1da1f2' }}>𝕏</span>}
                  value={sig.twitter}
                  onChange={(e) => updateField('twitter', e.target.value)}
                />
              </Col>

              <Col span={24}>
                <Divider style={{ margin: '12px 0', borderColor: sig.accentColor + '30' }}>Estilo</Divider>
              </Col>

              <Col span={8}>
                <div style={{ fontSize: 12, marginBottom: 4 }}>Fondo</div>
                <ColorPicker
                  value={sig.bgColor}
                  onChange={(c) => updateField('bgColor', c.toHexString())}
                />
              </Col>
              <Col span={8}>
                <div style={{ fontSize: 12, marginBottom: 4 }}>Texto</div>
                <ColorPicker
                  value={sig.textColor}
                  onChange={(c) => updateField('textColor', c.toHexString())}
                />
              </Col>
              <Col span={8}>
                <div style={{ fontSize: 12, marginBottom: 4 }}>Links</div>
                <ColorPicker
                  value={sig.linkColor}
                  onChange={(c) => updateField('linkColor', c.toHexString())}
                />
              </Col>

              <Col span={12}>
                <div style={{ fontSize: 12, marginBottom: 4 }}>
                  Ancho: {sig.width}px
                </div>
                <Slider
                  min={300}
                  max={800}
                  value={sig.width}
                  onChange={(v) => updateField('width', v)}
                />
              </Col>
              <Col span={12}>
                <div style={{ fontSize: 12, marginBottom: 4 }}>
                  Borde: {sig.borderRadius}px
                </div>
                <Slider
                  min={0}
                  max={20}
                  value={sig.borderRadius}
                  onChange={(v) => updateField('borderRadius', v)}
                />
              </Col>

              <Col span={24}>
                <div style={{ fontSize: 12, marginBottom: 4 }}>Logo</div>
                <Space>
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={handleLogoUpload}
                  >
                    <Button icon={<UploadOutlined />} size="small">
                      Subir
                    </Button>
                  </Upload>
                  {sig.logoUrl && (
                    <Button danger size="small" onClick={removeLogo}>
                      Eliminar
                    </Button>
                  )}
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card 
            title={
              <Space>
                <EyeOutlined />
                Vista Previa
                <Button 
                  type="text" 
                  size="small"
                  icon={previewMode === 'desktop' ? <DesktopOutlined /> : <MobileOutlined />}
                  onClick={() => setPreviewMode(previewMode === 'desktop' ? 'mobile' : 'desktop')}
                >
                  {previewMode === 'desktop' ? 'Escritorio' : 'Móvil'}
                </Button>
              </Space>
            } 
            size="small"
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              padding: 16,
              background: '#f5f5f5',
              borderRadius: 8,
              minHeight: 200,
              overflow: 'auto',
            }}>
              <div ref={previewRef}>
                {renderPreview()}
              </div>
</div>
            </Card>
          </Col>
        </Row>
        </Tabs.TabPane>

        <Tabs.TabPane key="html" tab="Editor HTML">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={10}>
              <Card title="Código HTML" size="small">
                <Input.TextArea
                  value={htmlCode}
                  onChange={(e) => setHtmlCode(e.target.value)}
                  style={{ 
                    width: '100%', 
                    minHeight: 300, 
                    fontFamily: 'monospace',
                    fontSize: 12,
                  }}
                  placeholder="Escribe tu código HTML aquí..."
                />
                <div style={{ marginTop: 8 }}>
                  <Button onClick={() => setHtmlCode(defaultHtmlSignature)} size="small">
                    Restablecer Plantilla
                  </Button>
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={14}>
              <Card title={<Space><EyeOutlined />Vista Previa HTML</Space>} size="small">
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  padding: 16,
                  background: '#f5f5f5',
                  borderRadius: 8,
                  minHeight: 200,
                  overflow: 'auto',
                }}>
                  <div ref={htmlPreviewRef} dangerouslySetInnerHTML={{ __html: htmlCode }} />
                </div>
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>
      </Tabs>

      <Modal
        title="Firmas Guardadas"
        open={showSavedModal}
        onCancel={() => setShowSavedModal(false)}
        footer={null}
      >
        {savedSignatures.length === 0 ? (
          <p>No hay firmas guardadas.</p>
        ) : (
          <List
            size="small"
            dataSource={savedSignatures}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button key="load" type="link" onClick={() => {
                    setLoadSignatureId(item.id);
                    loadSignatureFromSaved();
                  }}>Cargar</Button>,
                  <Button key="delete" type="text" danger onClick={() => deleteSignatureFromSaved(item.id)}>Eliminar</Button>
                ]}
              >
                {item.name}
              </List.Item>
            )}
          />
        )}
      </Modal>
    </Card>
  );
}