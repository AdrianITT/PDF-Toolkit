import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, Input, Row, Col, Button, ColorPicker, Upload, message, Space, Select, Slider, List, Modal, Collapse, Empty } from 'antd';
import { 
  DownloadOutlined, 
  UploadOutlined, 
  ReloadOutlined,
  EditOutlined,
  EyeOutlined,
  DesktopOutlined,
  MobileOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { toPng } from 'html-to-image';
import { signatureTemplates, defaultSignature, type EmailSignature } from './signatureTemplates';

export function HtmlToImagePage() {
  const previewRef = useRef<HTMLDivElement>(null);
  const [sig, setSig] = useState<EmailSignature>({ ...defaultSignature });
  const [isConverting, setIsConverting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('minimal-clean');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg' | 'html'>('png');
  const [savedSignatures, setSavedSignatures] = useState<{id: string; name: string; data: EmailSignature; templateId: string}[]>([]);
  const [loadSignatureId, setLoadSignatureId] = useState<string>('');
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showExtraFields, setShowExtraFields] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('savedEmailSignatures');
    if (saved) {
      try {
        setSavedSignatures(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const currentTemplate = signatureTemplates.find(t => t.id === selectedTemplate) || signatureTemplates[0];

  const saveSignature = (name: string) => {
    setIsSaving(true);
    setTimeout(() => {
      const newSig = { id: Date.now().toString(), name, data: sig, templateId: selectedTemplate };
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
          setSelectedTemplate(found.templateId || 'minimal-clean');
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
      setSig(prev => ({
        ...prev,
        bgColor: template.config.bgColor,
        textColor: template.config.textColor,
        linkColor: template.config.linkColor,
        accentColor: template.config.accentColor,
        borderRadius: template.config.borderRadius,
      }));
      setSelectedTemplate(templateId);
      message.success(`Plantilla "${template.name}" aplicada`);
    }
  }, []);

  const resetSignature = useCallback(() => {
    const template = signatureTemplates.find(t => t.id === selectedTemplate);
    setSig({
      ...defaultSignature,
      bgColor: template?.config.bgColor || defaultSignature.bgColor,
      textColor: template?.config.textColor || defaultSignature.textColor,
      linkColor: template?.config.linkColor || defaultSignature.linkColor,
      accentColor: template?.config.accentColor || defaultSignature.accentColor,
      borderRadius: template?.config.borderRadius || defaultSignature.borderRadius,
    });
    message.info('Firma reiniciada');
  }, [selectedTemplate]);

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

  const sanitizeForExport = (element: HTMLElement, bgColor: string): string[] => {
    const replacedUrls: string[] = [];
    const imgElements = element.querySelectorAll('img');
    imgElements.forEach((img) => {
      const src = img.src;
      if (src && /^https?:\/\//i.test(src)) {
        try {
          const url = new URL(src);
          if (!url.hostname.includes(window.location.hostname) && !url.hostname.includes('localhost')) {
            const canvas = document.createElement('canvas');
            canvas.width = img.width || 80;
            canvas.height = img.height || 80;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = bgColor || '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.strokeStyle = '#cccccc';
              ctx.lineWidth = 1;
              ctx.strokeRect(0, 0, canvas.width, canvas.height);
            }
            img.src = canvas.toDataURL('image/png');
            replacedUrls.push(src);
          }
        } catch (e) {}
      }
    });
    return replacedUrls;
  };

  const exportAsImage = async () => {
    const previewEl = previewRef.current;
    if (!previewEl) {
      message.error('No hay vista previa para exportar');
      return;
    }

    setIsConverting(true);
    try {
      const bgColor = sig.bgColor || '#ffffff';
      const replacedUrls = sanitizeForExport(previewEl, bgColor);
      if (replacedUrls.length > 0) {
        message.warning(`Se reemplazaron ${replacedUrls.length} imagen(es) externa(s)`);
      }

      const dataUrl = await toPng(previewEl, {
        quality: 1,
        pixelRatio: 4,
        cacheBust: true,
        backgroundColor: bgColor,
      });

      if (!dataUrl || dataUrl === 'data:image/png;base64,') {
        message.error('Error al generar imagen');
        setIsConverting(false);
        return;
      }

      const filename = `firma-correo-${Date.now()}.${exportFormat}`;
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      link.click();
      message.success(`Exportado: ${filename}`);
    } catch (err) {
      console.error('[HtmlToImage] Error:', err);
      message.error('Error al exportar');
    } finally {
      setIsConverting(false);
    }
  };

  const previewWidth = previewMode === 'mobile' ? 375 : currentTemplate.id === 'corporate-strict' || currentTemplate.id === 'legal-formal' ? 600 : 500;

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
                <Button type="text" onClick={() => setShowSavedModal(true)} size="small" disabled={savedSignatures.length === 0}>
                  Cargar ({savedSignatures.length})
                </Button>
              </Space>
            }
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, marginBottom: 8, color: '#666' }}>Selecciona una plantilla</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {signatureTemplates.map(t => (
                  <div
                    key={t.id}
                    onClick={() => applyTemplate(t.id)}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      border: selectedTemplate === t.id ? `2px solid ${sig.accentColor}` : '1px solid #e0e0e0',
                      background: selectedTemplate === t.id ? sig.accentColor + '10' : '#fafafa',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{t.preview}</div>
                    <div style={{ fontSize: 11, fontWeight: selectedTemplate === t.id ? 600 : 400, color: selectedTemplate === t.id ? sig.accentColor : '#333' }}>
                      {t.name}
                    </div>
                    {selectedTemplate === t.id && <CheckCircleOutlined style={{ color: sig.accentColor, fontSize: 12, marginTop: 4 }} />}
                  </div>
                ))}
              </div>
            </div>

            <Collapse 
              ghost 
              defaultActiveKey={['basic', 'contact', 'social']}
              items={[
                {
                  key: 'basic',
                  label: <span style={{ fontWeight: 600 }}>Datos Personales</span>,
                  children: (
                    <Row gutter={[8, 8]}>
                      <Col span={12}>
                        <Input placeholder="Nombre *" value={sig.name} onChange={(e) => updateField('name', e.target.value)} />
                      </Col>
                      <Col span={12}>
                        <Input placeholder="Cargo" value={sig.title} onChange={(e) => updateField('title', e.target.value)} />
                      </Col>
                      <Col span={24}>
                        <Input placeholder="Empresa / Organización" value={sig.company} onChange={(e) => updateField('company', e.target.value)} />
                      </Col>
                    </Row>
                  ),
                },
                {
                  key: 'contact',
                  label: <span style={{ fontWeight: 600 }}>Contacto</span>,
                  children: (
                    <Row gutter={[8, 8]}>
                      <Col span={12}>
                        <Input placeholder="Email" prefix="✉" value={sig.email} onChange={(e) => updateField('email', e.target.value)} />
                      </Col>
                      <Col span={12}>
                        <Input placeholder="Teléfono" prefix="☎" value={sig.phone} onChange={(e) => updateField('phone', e.target.value)} />
                      </Col>
                      <Col span={12}>
                        <Input placeholder="Web" value={sig.website} onChange={(e) => updateField('website', e.target.value)} />
                      </Col>
                      <Col span={12}>
                        <Input placeholder="Dirección" value={sig.address} onChange={(e) => updateField('address', e.target.value)} />
                      </Col>
                      {showExtraFields && (
                        <>
                          <Col span={12}>
                            <Input placeholder="Skype" value={sig.skype} onChange={(e) => updateField('skype', e.target.value)} />
                          </Col>
                          <Col span={12}>
                            <Input placeholder="Instagram" value={sig.instagram} onChange={(e) => updateField('instagram', e.target.value)} />
                          </Col>
                          <Col span={12}>
                            <Input placeholder="Facebook" value={sig.facebook} onChange={(e) => updateField('facebook', e.target.value)} />
                          </Col>
                        </>
                      )}
                      <Col span={24}>
                        <Button type="link" size="small" onClick={() => setShowExtraFields(!showExtraFields)}>
                          {showExtraFields ? '− Menos campos' : '+ Más campos'}
                        </Button>
                      </Col>
                    </Row>
                  ),
                },
                {
                  key: 'social',
                  label: <span style={{ fontWeight: 600 }}>Redes Sociales</span>,
                  children: (
                    <Row gutter={[8, 8]}>
                      <Col span={12}>
                        <Input placeholder="LinkedIn URL" prefix={<span style={{ color: '#0077b5' }}>in</span>} value={sig.linkedin} onChange={(e) => updateField('linkedin', e.target.value)} />
                      </Col>
                      <Col span={12}>
                        <Input placeholder="Twitter URL" prefix={<span style={{ color: '#1da1f2' }}>𝕏</span>} value={sig.twitter} onChange={(e) => updateField('twitter', e.target.value)} />
                      </Col>
                    </Row>
                  ),
                },
                {
                  key: 'style',
                  label: <span style={{ fontWeight: 600 }}>Estilo</span>,
                  children: (
                    <Row gutter={[8, 8]}>
                      <Col span={8}>
                        <div style={{ fontSize: 12, marginBottom: 4 }}>Fondo</div>
                        <ColorPicker value={sig.bgColor} onChange={(c) => updateField('bgColor', c.toHexString())} />
                      </Col>
                      <Col span={8}>
                        <div style={{ fontSize: 12, marginBottom: 4 }}>Texto</div>
                        <ColorPicker value={sig.textColor} onChange={(c) => updateField('textColor', c.toHexString())} />
                      </Col>
                      <Col span={8}>
                        <div style={{ fontSize: 12, marginBottom: 4 }}>Links</div>
                        <ColorPicker value={sig.linkColor} onChange={(c) => updateField('linkColor', c.toHexString())} />
                      </Col>
                      <Col span={12}>
                        <div style={{ fontSize: 12, marginBottom: 4 }}>Acento</div>
                        <ColorPicker value={sig.accentColor} onChange={(c) => updateField('accentColor', c.toHexString())} />
                      </Col>
                      <Col span={12}>
                        <div style={{ fontSize: 12, marginBottom: 4 }}>Borde: {sig.borderRadius}px</div>
                        <Slider min={0} max={24} value={sig.borderRadius} onChange={(v) => updateField('borderRadius', v)} />
                      </Col>
                      <Col span={24}>
                        <div style={{ fontSize: 12, marginBottom: 4 }}>Logo</div>
                        <Space>
                          <Upload accept="image/*" showUploadList={false} beforeUpload={handleLogoUpload}>
                            <Button icon={<UploadOutlined />} size="small">Subir Logo</Button>
                          </Upload>
                          {sig.logoUrl && (
                            <Button danger size="small" onClick={removeLogo}>Eliminar</Button>
                          )}
                        </Space>
                      </Col>
                    </Row>
                  ),
                },
              ]}
            />
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
              padding: 24,
              background: '#f5f5f5',
              borderRadius: 8,
              minHeight: 300,
              overflow: 'auto',
            }}>
              <div ref={previewRef}>
                {currentTemplate.render(sig, previewMode, previewWidth)}
              </div>
            </div>
            <div style={{ marginTop: 12, textAlign: 'center', color: '#666', fontSize: 12 }}>
              {currentTemplate.name} — {currentTemplate.description}
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title="Firmas Guardadas"
        open={showSavedModal}
        onCancel={() => setShowSavedModal(false)}
        footer={null}
      >
        {savedSignatures.length === 0 ? (
          <Empty description="No hay firmas guardadas" />
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
                <List.Item.Meta title={item.name} description={`Plantilla: ${signatureTemplates.find(t => t.id === item.templateId)?.name || item.templateId}`} />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </Card>
  );
}