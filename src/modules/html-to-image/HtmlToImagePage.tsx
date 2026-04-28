import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, Input, Row, Col, Button, ColorPicker, Upload, message, Space, Select, Slider, List, Modal, Empty, Popover, Tooltip, Divider } from 'antd';
import { 
  DownloadOutlined, 
  UploadOutlined, 
  ReloadOutlined,
  EditOutlined,
  EyeOutlined,
  DesktopOutlined,
  MobileOutlined,
  SwapOutlined,
  PlusOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { toPng } from 'html-to-image';
import { signatureTemplates, defaultSignature, type EmailSignature, renderFlexibleSignature, LAYOUT_PRESETS, ELEMENT_OPTIONS } from './signatureTemplates';

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
  const [selectedOrder, setSelectedOrder] = useState<string[]>(['logo', 'name', 'contact', 'social']);
  const [showAllTemplates, setShowAllTemplates] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('savedEmailSignatures');
    if (saved) {
      try {
        setSavedSignatures(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const currentTemplate = signatureTemplates.find(t => t.id === selectedTemplate) || signatureTemplates[0];
  const displayTemplates = showAllTemplates ? signatureTemplates : signatureTemplates.slice(0, 6);

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
          setSelectedOrder(found.data.elementOrder || ['logo', 'name', 'contact', 'social']);
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
        layout: template.defaultLayout,
        logoPosition: template.defaultLogoPosition,
      }));
      setSelectedTemplate(templateId);
      message.success(`Plantilla "${template.name}" aplicada`);
    }
  }, []);

  const applyPreset = (presetId: string) => {
    const preset = LAYOUT_PRESETS.find(p => p.id === presetId);
    if (preset && preset.order.length > 0) {
      setSelectedOrder([...preset.order]);
      setSig(prev => ({ ...prev, elementOrder: [...preset.order] }));
    }
  };

  const moveOrderItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newOrder = [...selectedOrder];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      setSelectedOrder(newOrder);
      setSig(prev => ({ ...prev, elementOrder: newOrder }));
    } else if (direction === 'down' && index < selectedOrder.length - 1) {
      const newOrder = [...selectedOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      setSelectedOrder(newOrder);
      setSig(prev => ({ ...prev, elementOrder: newOrder }));
    }
  };

  const removeOrderItem = (index: number) => {
    const newOrder = selectedOrder.filter((_, i) => i !== index);
    setSelectedOrder(newOrder);
    setSig(prev => ({ ...prev, elementOrder: newOrder }));
  };

  const addOrderItem = (blockId: string) => {
    if (!selectedOrder.includes(blockId)) {
      const newOrder = [...selectedOrder, blockId];
      setSelectedOrder(newOrder);
      setSig(prev => ({ ...prev, elementOrder: newOrder }));
    }
  };

  const resetSignature = useCallback(() => {
    const template = signatureTemplates.find(t => t.id === selectedTemplate);
    setSig({
      ...defaultSignature,
      bgColor: template?.config.bgColor || defaultSignature.bgColor,
      textColor: template?.config.textColor || defaultSignature.textColor,
      linkColor: template?.config.linkColor || defaultSignature.linkColor,
      accentColor: template?.config.accentColor || defaultSignature.accentColor,
      borderRadius: template?.config.borderRadius || defaultSignature.borderRadius,
      layout: template?.defaultLayout || defaultSignature.layout,
      logoPosition: template?.defaultLogoPosition || defaultSignature.logoPosition,
      elementOrder: ['logo', 'name', 'contact', 'social'],
    });
    setSelectedOrder(['logo', 'name', 'contact', 'social']);
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

  const previewWidth = previewMode === 'mobile' ? 375 : 500;

  const quickActionsContent = (
    <div style={{ width: 280 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, marginBottom: 8, fontWeight: 600, color: '#333' }}>Logo</div>
        <Upload accept="image/*" showUploadList={false} beforeUpload={handleLogoUpload}>
          <Button icon={<UploadOutlined />} size="small" block>
            {sig.logoUrl ? 'Cambiar Logo' : 'Subir Logo'}
          </Button>
        </Upload>
        {sig.logoUrl && (
          <Button danger size="small" block style={{ marginTop: 8 }} onClick={removeLogo}>
            Eliminar Logo
          </Button>
        )}
      </div>
      <Divider style={{ margin: '12px 0' }} />
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, marginBottom: 8, fontWeight: 600, color: '#333' }}>Colores Rápidos</div>
        <Space wrap>
          <Tooltip title="Fondo">
            <ColorPicker value={sig.bgColor} onChange={(c) => updateField('bgColor', c.toHexString())} />
          </Tooltip>
          <Tooltip title="Texto">
            <ColorPicker value={sig.textColor} onChange={(c) => updateField('textColor', c.toHexString())} />
          </Tooltip>
          <Tooltip title="Links">
            <ColorPicker value={sig.linkColor} onChange={(c) => updateField('linkColor', c.toHexString())} />
          </Tooltip>
          <Tooltip title="Acento">
            <ColorPicker value={sig.accentColor} onChange={(c) => updateField('accentColor', c.toHexString())} />
          </Tooltip>
        </Space>
      </div>
      <Divider style={{ margin: '12px 0' }} />
      <div>
        <div style={{ fontSize: 12, marginBottom: 8, fontWeight: 600, color: '#333' }}>Posición Logo</div>
        <Space size={4}>
          <Button
            type={sig.logoPosition === 'left' ? 'primary' : 'default'}
            size="small"
            onClick={() => updateField('logoPosition', 'left')}
          >
            Izq
          </Button>
          <Button
            type={sig.logoPosition === 'top' ? 'primary' : 'default'}
            size="small"
            onClick={() => updateField('logoPosition', 'top')}
          >
            Arriba
          </Button>
          <Button
            type={sig.logoPosition === 'right' ? 'primary' : 'default'}
            size="small"
            onClick={() => updateField('logoPosition', 'right')}
          >
            Der
          </Button>
          <Button
            type={sig.logoPosition === 'center' ? 'primary' : 'default'}
            size="small"
            onClick={() => updateField('logoPosition', 'center')}
          >
            Centro
          </Button>
        </Space>
      </div>
    </div>
  );

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
          <Button type="text" icon={<ReloadOutlined />} onClick={resetSignature} size="small">
            Reiniciar
          </Button>
          <Button type="text" onClick={() => saveSignature(prompt('Nombre de la firma:') || 'Sin nombre')} size="small" loading={isSaving}>
            Guardar
          </Button>
          {savedSignatures.length > 0 && (
            <Button type="text" onClick={() => setShowSavedModal(true)} size="small">
              Cargar ({savedSignatures.length})
            </Button>
          )}
        </Space>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, marginBottom: 8, color: '#666', fontWeight: 500 }}>
              Plantillas {showAllTemplates ? '' : '(mostrando 6 de 15)'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {displayTemplates.map(t => (
                <div
                  key={t.id}
                  onClick={() => applyTemplate(t.id)}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    border: selectedTemplate === t.id ? `2px solid ${sig.accentColor}` : '1px solid #e0e0e0',
                    background: selectedTemplate === t.id ? sig.accentColor + '10' : '#fafafa',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: 16, marginBottom: 2 }}>{t.preview}</div>
                  <div style={{ fontSize: 10, fontWeight: selectedTemplate === t.id ? 600 : 400, color: selectedTemplate === t.id ? sig.accentColor : '#333' }}>
                    {t.name}
                  </div>
                </div>
              ))}
            </div>
            {signatureTemplates.length > 6 && (
              <Button type="link" size="small" onClick={() => setShowAllTemplates(!showAllTemplates)} style={{ marginTop: 8 }}>
                {showAllTemplates ? '− Ver menos' : '+ Ver todas las plantillas'}
              </Button>
            )}
          </div>

          <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, color: '#333', fontSize: 13 }}>①</span>
              <span style={{ fontWeight: 600, color: '#333', fontSize: 13 }}>Información Personal</span>
            </div>
            <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
              <Col span={24}>
                <Input 
                  placeholder="Nombre completo *" 
                  value={sig.name} 
                  onChange={(e) => updateField('name', e.target.value)} 
                />
              </Col>
              <Col span={24}>
                <Input 
                  placeholder="Cargo / Puesto" 
                  value={sig.title} 
                  onChange={(e) => updateField('title', e.target.value)} 
                />
              </Col>
              <Col span={24}>
                <Input 
                  placeholder="Empresa / Organización" 
                  value={sig.company} 
                  onChange={(e) => updateField('company', e.target.value)} 
                />
              </Col>
            </Row>
          </Card>

          <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, color: '#333', fontSize: 13 }}>②</span>
              <span style={{ fontWeight: 600, color: '#333', fontSize: 13 }}>Información de Contacto</span>
            </div>
            <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
              <Col span={12}>
                <Input placeholder="Email" prefix="✉" value={sig.email} onChange={(e) => updateField('email', e.target.value)} />
              </Col>
              <Col span={12}>
                <Input placeholder="Teléfono" prefix="☎" value={sig.phone} onChange={(e) => updateField('phone', e.target.value)} />
              </Col>
              <Col span={12}>
                <Input placeholder="Sitio Web" value={sig.website} onChange={(e) => updateField('website', e.target.value)} />
              </Col>
              <Col span={12}>
                <Input placeholder="Dirección" value={sig.address} onChange={(e) => updateField('address', e.target.value)} />
              </Col>
            </Row>
            {showExtraFields ? (
              <div style={{ marginTop: 8 }}>
                <Row gutter={[8, 8]}>
                  <Col span={12}>
                    <Input placeholder="Skype" value={sig.skype} onChange={(e) => updateField('skype', e.target.value)} />
                  </Col>
                  <Col span={12}>
                    <Input placeholder="Instagram" value={sig.instagram} onChange={(e) => updateField('instagram', e.target.value)} />
                  </Col>
                  <Col span={12}>
                    <Input placeholder="Facebook" value={sig.facebook} onChange={(e) => updateField('facebook', e.target.value)} />
                  </Col>
                </Row>
                <Button type="link" size="small" onClick={() => setShowExtraFields(false)} style={{ padding: 0 }}>
                  − Ocultar campos adicionales
                </Button>
              </div>
            ) : (
              <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => setShowExtraFields(true)} style={{ marginTop: 4, padding: 0 }}>
                + Agregar más campos
              </Button>
            )}
          </Card>

          <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, color: '#333', fontSize: 13 }}>③</span>
              <span style={{ fontWeight: 600, color: '#333', fontSize: 13 }}>Redes Sociales</span>
            </div>
            <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
              <Col span={12}>
                <Input 
                  placeholder="LinkedIn" 
                  prefix={<span style={{ color: '#0077b5', fontWeight: 600 }}>in</span>} 
                  value={sig.linkedin} 
                  onChange={(e) => updateField('linkedin', e.target.value)} 
                />
              </Col>
              <Col span={12}>
                <Input 
                  placeholder="Twitter / X" 
                  prefix={<span style={{ color: '#1da1f2' }}>𝕏</span>} 
                  value={sig.twitter} 
                  onChange={(e) => updateField('twitter', e.target.value)} 
                />
              </Col>
            </Row>
          </Card>

          <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, color: '#333', fontSize: 13 }}>④</span>
              <span style={{ fontWeight: 600, color: '#333', fontSize: 13 }}>Estructura y Diseño</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, marginBottom: 6, color: '#666' }}>Distribución</div>
              <Space size={4}>
                <Button
                  type={sig.layout === 'horizontal' ? 'primary' : 'default'}
                  size="small"
                  onClick={() => updateField('layout', 'horizontal')}
                >
                  Horizontal
                </Button>
                <Button
                  type={sig.layout === 'vertical' ? 'primary' : 'default'}
                  size="small"
                  onClick={() => updateField('layout', 'vertical')}
                >
                  Vertical
                </Button>
                <Button
                  type={sig.layout === 'centered' ? 'primary' : 'default'}
                  size="small"
                  onClick={() => updateField('layout', 'centered')}
                >
                  Centrado
                </Button>
              </Space>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, marginBottom: 6, color: '#666' }}>Orden de elementos</div>
              <Select
                value={selectedOrder.join(' → ')}
                onChange={(value) => {
                  const preset = LAYOUT_PRESETS.find(p => value.startsWith(p.id));
                  if (preset) applyPreset(preset.id);
                }}
                style={{ width: '100%' }}
                size="small"
              >
                {LAYOUT_PRESETS.filter(p => p.id !== 'custom').map(preset => (
                  <Select.Option key={preset.id} value={preset.id}>
                    {preset.label}
                  </Select.Option>
                ))}
                <Select.Option value="custom">Personalizado</Select.Option>
              </Select>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, marginBottom: 6, color: '#666' }}>Editar orden</div>
              <div style={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 6, 
                padding: 6, 
                background: 'white',
              }}>
                {selectedOrder.map((blockId, index) => {
                  const option = ELEMENT_OPTIONS.find(o => o.id === blockId);
                  return (
                    <div 
                      key={blockId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 6px',
                        marginBottom: 2,
                        background: '#fafafa',
                        borderRadius: 4,
                      }}
                    >
                      <Space size={4}>
                        <SwapOutlined style={{ color: '#999', fontSize: 10 }} />
                        <span style={{ fontSize: 11 }}>{option?.label || blockId}</span>
                      </Space>
                      <Space size={2}>
                        <Button type="text" size="small" disabled={index === 0} onClick={() => moveOrderItem(index, 'up')} style={{ padding: 0, width: 20, height: 20 }}>↑</Button>
                        <Button type="text" size="small" disabled={index === selectedOrder.length - 1} onClick={() => moveOrderItem(index, 'down')} style={{ padding: 0, width: 20, height: 20 }}>↓</Button>
                        <Button type="text" size="small" danger onClick={() => removeOrderItem(index)} style={{ padding: 0, width: 20, height: 20 }}>×</Button>
                      </Space>
                    </div>
                  );
                })}
              </div>
              <Space wrap size={4} style={{ marginTop: 6 }}>
                {ELEMENT_OPTIONS.filter(o => !selectedOrder.includes(o.id)).map(option => (
                  <Button key={option.id} size="small" onClick={() => addOrderItem(option.id)}>+ {option.label}</Button>
                ))}
              </Space>
            </div>
          </Card>

          <Card size="small" style={{ background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, color: '#333', fontSize: 13 }}>⑤</span>
              <span style={{ fontWeight: 600, color: '#333', fontSize: 13 }}>Estilos</span>
            </div>
            <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
              <Col span={12}>
                <div style={{ fontSize: 12, marginBottom: 4, color: '#666' }}>Borde</div>
                <Slider min={0} max={24} value={sig.borderRadius} onChange={(v) => updateField('borderRadius', v)} />
              </Col>
              <Col span={12}>
                <div style={{ fontSize: 12, marginBottom: 4, color: '#666' }}>Color Acento</div>
                <ColorPicker value={sig.accentColor} onChange={(c) => updateField('accentColor', c.toHexString())} />
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
                  {previewMode === 'desktop' ? 'Escritorio' : 'M��vil'}
                </Button>
              </Space>
            }
            extra={
              <Space>
                <Popover content={quickActionsContent} trigger="click" placement="left">
                  <Button icon={<SettingOutlined />} size="small">
                    Acciones Rápidas
                  </Button>
                </Popover>
                <Select
                  value={exportFormat}
                  onChange={setExportFormat}
                  style={{ width: 80 }}
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
            size="small"
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              padding: 24,
              background: '#f5f5f5',
              borderRadius: 8,
              minHeight: 350,
              overflow: 'auto',
            }}>
              <div ref={previewRef}>
                {renderFlexibleSignature(sig, previewWidth)}
              </div>
            </div>
            <div style={{ marginTop: 12, textAlign: 'center', color: '#666', fontSize: 12 }}>
              {currentTemplate.name} — {currentTemplate.description}
            </div>
            {sig.logoUrl && (
              <div style={{ marginTop: 8, textAlign: 'center' }}>
                <img src={sig.logoUrl} alt="Logo preview" style={{ maxWidth: 60, maxHeight: 60, objectFit: 'contain' }} />
                <span style={{ fontSize: 11, color: '#999', marginLeft: 8 }}>Logo cargado</span>
              </div>
            )}
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