import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, Input, Row, Col, Button, ColorPicker, message, Space, Slider, List, Modal, Empty, Tabs, Radio, Upload, Checkbox } from 'antd';
import { 
  DownloadOutlined, 
  ReloadOutlined,
  EditOutlined,
  CodeOutlined,
  EyeOutlined,
  UserOutlined
} from '@ant-design/icons';
import { toPng } from 'html-to-image';
import { signatureTemplates, defaultSignature, type EmailSignature, renderFlexibleSignature } from './signatureTemplates';

export function HtmlToImagePage() {
  const previewRef = useRef<HTMLDivElement>(null);
  const [sig, setSig] = useState<EmailSignature>({ ...defaultSignature });
  const [isConverting, setIsConverting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('minimal-clean');
  const [previewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg' | 'html'>('png');
  const [savedSignatures, setSavedSignatures] = useState<{id: string; name: string; data: EmailSignature; templateId: string}[]>([]);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'editor'>('templates');
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('savedEmailSignatures');
    if (saved) {
      try {
        setSavedSignatures(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const displayTemplates = showAllTemplates ? signatureTemplates : signatureTemplates.slice(0, 6);

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
        iconStyle: 'emoji',
        visibleFields: {
          email: true,
          phone: true,
          website: true,
          address: false,
          linkedin: true,
          twitter: true,
          instagram: false,
          facebook: false,
          skype: false,
        },
        photoSize: 80,
        logoSize: 60,
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
      iconStyle: 'emoji',
      visibleFields: {
        email: true,
        phone: true,
        website: true,
        address: false,
        linkedin: true,
        twitter: true,
        instagram: false,
        facebook: false,
        skype: false,
      },
      photoSize: 80,
      logoSize: 60,
    });
    message.info('Firma reiniciada');
  }, [selectedTemplate]);

  const exportAsImage = async () => {
    const previewEl = previewRef.current;
    if (!previewEl) {
      message.error('No hay vista previa para exportar');
      return;
    }

    setIsConverting(true);
    try {
      const bgColor = sig.bgColor || '#ffffff';
      const dataUrl = await toPng(previewEl, {
        quality: 1,
        pixelRatio: 4,
        cacheBust: true,
        backgroundColor: bgColor,
      });

      const filename = `firma-${Date.now()}.${exportFormat}`;
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      link.click();
      message.success(`Exportado: ${filename}`);
    } catch (err) {
      console.error('[Export] Error:', err);
      message.error('Error al exportar');
    } finally {
      setIsConverting(false);
    }
  };

  const previewWidth = previewMode === 'mobile' ? 375 : 500;

  const generateHtmlFromSignature = (): string => {
    const vf = sig.visibleFields || defaultSignature.visibleFields;
    const iconStyle = sig.iconStyle || 'emoji';
    const getIcon = (type: 'email' | 'phone' | 'web' | 'address' | 'skype') => {
      if (iconStyle === 'none') return '';
      if (iconStyle === 'text') {
        const labels = { email: 'EMAIL', phone: 'TEL', web: 'WEB', address: 'DIR', skype: 'SKYPE' };
        return `<span style="margin-right:4px; font-weight:600; font-size:11px;">${labels[type]}</span>`;
      }
      const emojis = { email: '✉️', phone: '📞', web: '🌐', address: '📍', skype: '💬' };
      return `<span style="margin-right:4px;">${emojis[type]}</span>`;
    };
    return `<table cellpadding="0" cellspacing="0" style="font-family: Arial; width: ${previewWidth}px;">
<tr><td style="padding: 16px; background: ${sig.bgColor}; border-radius: ${sig.borderRadius}px;">
<table cellpadding="0" cellspacing="0"><tr>
${sig.logoUrl ? `<td style="padding-right: 16px;"><img src="${sig.logoUrl}" alt="Logo" style="width: 60px;"></td>` : ''}
<td>
  <div style="font-size: ${sig.fontSize + 6}px; font-weight: bold; color: ${sig.textColor};">${sig.name || 'Tu Nombre'}</div>
  ${sig.title ? `<div style="font-size: ${sig.fontSize + 2}px; color: ${sig.linkColor};">${sig.title}</div>` : ''}
  ${sig.company ? `<div style="font-size: ${sig.fontSize}px; color: ${sig.textColor};">${sig.company}</div>` : ''}
  <div style="font-size: ${sig.fontSize}px; color: ${sig.textColor}; margin-top: 8px;">
    ${vf.email !== false && sig.email ? `<div>${getIcon('email')}<a href="mailto:${sig.email}" style="color: ${sig.linkColor};">${sig.email}</a></div>` : ''}
    ${vf.phone !== false && sig.phone ? `<div>${getIcon('phone')}<span>${sig.phone}</span></div>` : ''}
    ${vf.website !== false && sig.website ? `<div>${getIcon('web')}<a href="https://${sig.website}" style="color: ${sig.linkColor};">${sig.website}</a></div>` : ''}
    ${vf.address !== false && sig.address ? `<div>${getIcon('address')}<span>${sig.address}</span></div>` : ''}
    ${vf.skype !== false && sig.skype ? `<div>${getIcon('skype')}<span>${sig.skype}</span></div>` : ''}
  </div>
  ${(vf.linkedin !== false && sig.linkedin) || (vf.twitter !== false && sig.twitter) || (vf.instagram !== false && sig.instagram) || (vf.facebook !== false && sig.facebook) ? `
  <div style="display:flex; gap:12px; font-size: ${sig.fontSize - 1}px; margin-top: 8px;">
    ${vf.linkedin !== false && sig.linkedin ? `<a href="${sig.linkedin}" style="color: ${sig.linkColor};">LinkedIn</a>` : ''}
    ${vf.twitter !== false && sig.twitter ? `<a href="${sig.twitter}" style="color: ${sig.linkColor};">Twitter</a>` : ''}
    ${vf.instagram !== false && sig.instagram ? `<a href="${sig.instagram}" style="color: ${sig.linkColor};">Instagram</a>` : ''}
    ${vf.facebook !== false && sig.facebook ? `<a href="${sig.facebook}" style="color: ${sig.linkColor};">Facebook</a>` : ''}
  </div>` : ''}
</td></tr></table></td></tr></table>`;
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
          <Button type="text" icon={<ReloadOutlined />} onClick={resetSignature} size="small">Reiniciar</Button>
          <Button type="text" onClick={() => {
            const name = prompt('Nombre de la firma:') || 'Sin nombre';
            setIsSaving(true);
            setTimeout(() => {
              const newSig = { id: Date.now().toString(), name, data: sig, templateId: selectedTemplate };
              const updated = [...savedSignatures, newSig];
              setSavedSignatures(updated);
              localStorage.setItem('savedEmailSignatures', JSON.stringify(updated));
              message.success(`Firma "${name}" guardada`);
              setIsSaving(false);
            }, 300);
          }} size="small" loading={isSaving}>Guardar</Button>
          {savedSignatures.length > 0 && (
            <Button type="text" onClick={() => setShowSavedModal(true)} size="small">
              Cargar ({savedSignatures.length})
            </Button>
          )}
        </Space>
      }
    >
      <Tabs activeKey={activeTab} onChange={(k) => setActiveTab(k as 'templates' | 'editor')} items={[
        {
          key: 'templates',
          label: '📋 Plantillas',
          children: (
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={10}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, marginBottom: 8, color: '#666', fontWeight: 500 }}>
                    Plantillas {showAllTemplates ? '' : `(mostrando ${signatureTemplates.slice(0, 6).length} de ${signatureTemplates.length})`}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {displayTemplates.map(t => (
                      <div key={t.id} onClick={() => applyTemplate(t.id)} style={{ padding: 10, borderRadius: 8, border: selectedTemplate === t.id ? `2px solid ${sig.accentColor}` : '1px solid #e0e0e0', background: selectedTemplate === t.id ? sig.accentColor + '10' : '#fafafa', cursor: 'pointer', textAlign: 'center' }}>
                        <div style={{ fontSize: 16, marginBottom: 2 }}>{t.preview}</div>
                        <div style={{ fontSize: 10, fontWeight: selectedTemplate === t.id ? 600 : 400, color: selectedTemplate === t.id ? sig.accentColor : '#333' }}>{t.name}</div>
                      </div>
                    ))}
                  </div>
                  {signatureTemplates.length > 6 && <Button type="link" size="small" onClick={() => setShowAllTemplates(!showAllTemplates)}>{showAllTemplates ? '− Ver menos' : '+ Ver todas'}</Button>}
                </div>

                <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
                  <div style={{ fontWeight: 600, color: '#333', fontSize: 13 }}>① Información Personal</div>
                  <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
                    <Col span={24}><Input placeholder="Nombre *" value={sig.name} onChange={(e) => updateField('name', e.target.value)} /></Col>
                    <Col span={24}><Input placeholder="Cargo" value={sig.title} onChange={(e) => updateField('title', e.target.value)} /></Col>
                    <Col span={24}><Input placeholder="Empresa" value={sig.company} onChange={(e) => updateField('company', e.target.value)} /></Col>
                  </Row>
                </Card>

                <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
                  <div style={{ fontWeight: 600, color: '#333', fontSize: 13 }}>② Contacto</div>
                  <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
                    <Col span={24}><Input placeholder="Email" value={sig.email} onChange={(e) => updateField('email', e.target.value)} /></Col>
                    <Col span={24}><Input placeholder="Teléfono" value={sig.phone} onChange={(e) => updateField('phone', e.target.value)} /></Col>
                    <Col span={24}><Input placeholder="Web" value={sig.website} onChange={(e) => updateField('website', e.target.value)} /></Col>
                  </Row>
                </Card>

                <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
                  <div style={{ fontWeight: 600, color: '#333', fontSize: 13 }}>③ Redes Sociales</div>
                  <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
                    <Col span={12}><Input placeholder="LinkedIn" value={sig.linkedin} onChange={(e) => updateField('linkedin', e.target.value)} /></Col>
                    <Col span={12}><Input placeholder="Twitter" value={sig.twitter} onChange={(e) => updateField('twitter', e.target.value)} /></Col>
                    <Col span={12}><Input placeholder="Instagram" value={sig.instagram} onChange={(e) => updateField('instagram', e.target.value)} /></Col>
                    <Col span={12}><Input placeholder="Facebook" value={sig.facebook} onChange={(e) => updateField('facebook', e.target.value)} /></Col>
                    <Col span={24}><Input placeholder="Skype" value={sig.skype} onChange={(e) => updateField('skype', e.target.value)} /></Col>
                  </Row>
                </Card>
                <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
                  <div style={{ fontWeight: 600, color: '#333', fontSize: 13, marginBottom: 8 }}>④ Visibilidad de Campos</div>
                  <Row gutter={[8, 8]} style={{ marginBottom: 8 }}>
                    <Col span={12}><Button size="small" onClick={() => updateField('visibleFields', {
                      email: true, phone: true, website: true, address: true,
                      linkedin: true, twitter: true, instagram: true, facebook: true, skype: true
                    })}>Seleccionar todos</Button></Col>
                    <Col span={12}><Button size="small" onClick={() => updateField('visibleFields', {
                      email: false, phone: false, website: false, address: false,
                      linkedin: false, twitter: false, instagram: false, facebook: false, skype: false
                    })}>Deseleccionar todos</Button></Col>
                    <Col span={24}><span style={{ fontSize: 12, color: '#666' }}>
                      {Object.values(sig.visibleFields || {}).filter(Boolean).length} de 8 campos visibles
                    </span></Col>
                  </Row>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#666', marginBottom: 4 }}>Contacto</div>
                  <Row gutter={[8, 4]}>
                    <Col span={12}><Checkbox checked={sig.visibleFields?.email !== false} onChange={(checked) => updateField('visibleFields', { ...sig.visibleFields, email: checked })}>Email</Checkbox></Col>
                    <Col span={12}><Checkbox checked={sig.visibleFields?.phone !== false} onChange={(checked) => updateField('visibleFields', { ...sig.visibleFields, phone: checked })}>Teléfono</Checkbox></Col>
                    <Col span={12}><Checkbox checked={sig.visibleFields?.website !== false} onChange={(checked) => updateField('visibleFields', { ...sig.visibleFields, website: checked })}>Web</Checkbox></Col>
                    <Col span={12}><Checkbox checked={sig.visibleFields?.address !== false} onChange={(checked) => updateField('visibleFields', { ...sig.visibleFields, address: checked })}>Dirección</Checkbox></Col>
                    <Col span={24}><Checkbox checked={sig.visibleFields?.skype !== false} onChange={(checked) => updateField('visibleFields', { ...sig.visibleFields, skype: checked })}>Skype</Checkbox></Col>
                  </Row>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#666', margin: '8px 0 4px' }}>Redes Sociales</div>
                  <Row gutter={[8, 4]}>
                    <Col span={12}><Checkbox checked={sig.visibleFields?.linkedin !== false} onChange={(checked) => updateField('visibleFields', { ...sig.visibleFields, linkedin: checked })}>LinkedIn</Checkbox></Col>
                    <Col span={12}><Checkbox checked={sig.visibleFields?.twitter !== false} onChange={(checked) => updateField('visibleFields', { ...sig.visibleFields, twitter: checked })}>Twitter</Checkbox></Col>
                    <Col span={12}><Checkbox checked={sig.visibleFields?.instagram !== false} onChange={(checked) => updateField('visibleFields', { ...sig.visibleFields, instagram: checked })}>Instagram</Checkbox></Col>
                    <Col span={12}><Checkbox checked={sig.visibleFields?.facebook !== false} onChange={(checked) => updateField('visibleFields', { ...sig.visibleFields, facebook: checked })}>Facebook</Checkbox></Col>
                  </Row>
                </Card>

                <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
                  <div style={{ fontWeight: 600, color: '#333', fontSize: 13 }}>⑤ Apariencia</div>
                  <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
                    <Col span={12}>
                      <div style={{ fontSize: 12, marginBottom: 4, color: '#666' }}>Foto de Perfil</div>
                      <Upload accept="image/*" showUploadList={false} beforeUpload={(file) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                          updateField('photoUrl', reader.result as string);
                          message.success('Foto cargada');
                        };
                        reader.readAsDataURL(file);
                        return false;
                      }}>
                        <Button icon={<UserOutlined />} size="small">{sig.photoUrl ? 'Cambiar' : 'Subir'}</Button>
                      </Upload>
                      {sig.photoUrl && <Button type="link" size="small" danger onClick={() => updateField('photoUrl', '')}>X</Button>}
                    </Col>
                    <Col span={12}>
                      <div style={{ fontSize: 12, marginBottom: 4, color: '#666' }}>Logo</div>
                      <Upload accept="image/*" showUploadList={false} beforeUpload={(file) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                          updateField('logoUrl', reader.result as string);
                          message.success('Logo cargado');
                        };
                        reader.readAsDataURL(file);
                        return false;
                      }}>
                        <Button size="small">{sig.logoUrl ? 'Cambiar' : 'Subir'}</Button>
                      </Upload>
                      {sig.logoUrl && <Button type="link" size="small" danger onClick={() => updateField('logoUrl', '')}>X</Button>}
                    </Col>
                  </Row>
                  <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
                    <Col span={12}><div style={{ fontSize: 12 }}>Foto tamaño</div><Slider min={40} max={120} value={sig.photoSize || 80} onChange={(v) => updateField('photoSize', v)} /></Col>
                    <Col span={12}><div style={{ fontSize: 12 }}>Logo tamaño</div><Slider min={30} max={100} value={sig.logoSize || 60} onChange={(v) => updateField('logoSize', v)} /></Col>
                  </Row>
                  <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
                    <Col span={12}><div style={{ fontSize: 12, color: '#666' }}>Fondo</div><ColorPicker value={sig.bgColor} onChange={(c) => updateField('bgColor', c.toHexString())} /></Col>
                    <Col span={12}><div style={{ fontSize: 12, color: '#666' }}>Texto</div><ColorPicker value={sig.textColor} onChange={(c) => updateField('textColor', c.toHexString())} /></Col>
                  </Row>
                </Card>

                <Card size="small" style={{ background: '#fafafa' }}>
                  <div style={{ fontWeight: 600, color: '#333', fontSize: 13 }}>⑥ Estilos</div>
                  <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
                    <Col span={12}><div style={{ fontSize: 12 }}>Borde</div><Slider min={0} max={24} value={sig.borderRadius} onChange={(v) => updateField('borderRadius', v)} /></Col>
                    <Col span={12}><div style={{ fontSize: 12 }}>Acento</div><ColorPicker value={sig.accentColor} onChange={(c) => updateField('accentColor', c.toHexString())} /></Col>
                  </Row>
                  <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
                    <Col span={24}><div style={{ fontSize: 12, marginBottom: 4, color: '#666' }}>Iconos</div>
                      <Radio.Group value={sig.iconStyle || 'emoji'} onChange={(e) => updateField('iconStyle', e.target.value)} size="small">
                        <Radio.Button value="emoji">Emojis</Radio.Button>
                        <Radio.Button value="text">Texto</Radio.Button>
                        <Radio.Button value="none">Ninguno</Radio.Button>
                      </Radio.Group>
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
                    </Space>
                  }
                  extra={
                    <Space>
                      <Radio.Group value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                        <Radio.Button value="png">PNG</Radio.Button>
                        <Radio.Button value="jpg">JPG</Radio.Button>
                      </Radio.Group>
                      <Button type="primary" icon={<DownloadOutlined />} onClick={exportAsImage} loading={isConverting}>Exportar</Button>
                    </Space>
                  }
                >
                  <div ref={previewRef} style={{ padding: 24, background: '#f5f5f5', borderRadius: 8, minHeight: 200 }}>
                    {htmlContent ? (
                      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                    ) : (
                      renderFlexibleSignature(sig, 400, selectedTemplate)
                    )}
                  </div>
                </Card>
              </Col>
            </Row>
          )
        },
        {
          key: 'editor',
          label: '✏️ Editar HTML',
          children: (
            <Card size="small" title={<Space><CodeOutlined /> Editor HTML</Space>} extra={<Button size="small" onClick={() => setHtmlContent(generateHtmlFromSignature())}>Reset</Button>}>
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 12 }}>HTML</div>
                  <Input.TextArea value={htmlContent} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setHtmlContent(e.target.value)} autoSize={{ minRows: 12, maxRows: 20 }} style={{ fontFamily: 'monospace', fontSize: 12, background: '#1e1e1e', color: '#d4d4d4', border: '1px solid #333' }} placeholder="<!-- HTML -->" />
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <Radio.Group value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                      <Radio.Button value="png">PNG</Radio.Button>
                      <Radio.Button value="jpg">JPG</Radio.Button>
                    </Radio.Group>
                    <Button type="primary" icon={<DownloadOutlined />} onClick={exportAsImage} loading={isConverting}>Exportar</Button>
                  </div>
                </Col>
                <Col xs={24} lg={12}>
                  <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 12 }}>Vista Previa</div>
                  <div ref={previewRef} style={{ border: '1px solid #d1d5db', borderRadius: 4, padding: 16, background: '#fff', overflow: 'auto', maxHeight: 350, minHeight: 250 }} dangerouslySetInnerHTML={{ __html: htmlContent }} />
                </Col>
              </Row>
            </Card>
          )
        },
      ]} />

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
                    setSig(item.data);
                    setSelectedTemplate(item.templateId || 'minimal-clean');
                    message.success(`Firma "${item.name}" cargada`);
                    setShowSavedModal(false);
                  }}>Cargar</Button>,
                  <Button key="delete" type="text" danger onClick={() => {
                    const updated = savedSignatures.filter(s => s.id !== item.id);
                    setSavedSignatures(updated);
                    localStorage.setItem('savedEmailSignatures', JSON.stringify(updated));
                    message.success('Firma eliminada');
                  }}>Eliminar</Button>
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