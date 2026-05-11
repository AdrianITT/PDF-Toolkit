import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, Input, Row, Col, Button, ColorPicker, message, Space, Slider, List, Modal, Empty, Tabs, Radio, Upload, Checkbox, InputNumber, Tooltip, Tag, Alert, Collapse, Switch } from 'antd';
import { 
  DownloadOutlined, 
  ReloadOutlined,
  EditOutlined,
  CodeOutlined,
  EyeOutlined,
  UserOutlined,
  UploadOutlined,
  LockOutlined,
  UnlockOutlined,
  DeleteOutlined,
  FullscreenOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { toPng } from 'html-to-image';
import DOMPurify from 'dompurify';
import { signatureTemplates, defaultSignature, renderFlexibleSignature } from './signatureTemplates';
import type { EmailSignature, LogoConfig } from './signatureTemplates';
import { validateLogo, compressLogo, updateLogoConfigWithValidation, LOGO_PRESETS, type LogoPresetKey } from './logoUtils';

// Configuración de DOMPurify para permitir HTML complejo (estilos, clases, tablas)
const PURIFY_CONFIG = {
  ADD_TAGS: ['style', 'font', 'center'],
  ADD_ATTR: ['class', 'cellpadding', 'cellspacing', 'border', 'bgcolor', 'align', 'valign', 'width', 'height', 'alt', 'src', 'href'],
  ALLOW_UNKNOWN_PROTOCOLS: true,
  FORBID_ATTR: [], // Permitir todos los atributos necesarios
};

// Procesar HTML completo (con DOCTYPE, html, head, body)
const processFullHtml = (html: string): { styles: string; bodyContent: string } => {
  if (!html.includes('<!DOCTYPE') && !html.includes('<html') && !html.includes('<head')) {
    return { styles: '', bodyContent: html };
  }
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extraer todas las etiquetas <style> del head y body
    const styleElements = doc.querySelectorAll('style');
    const styles = Array.from(styleElements)
      .map(style => style.outerHTML)
      .join('\n');
    
    // Extraer contenido del body
    const bodyContent = doc.body ? doc.body.innerHTML : html;
    
    return { styles, bodyContent };
  } catch (err) {
    console.error('[HTML Parse] Error:', err);
    return { styles: '', bodyContent: html };
  }
};

// Sanitizar HTML con soporte para estilos complejos
const sanitizeHtml = (html: string): string => {
  const { styles, bodyContent } = processFullHtml(html);
  const sanitizedBody = DOMPurify.sanitize(bodyContent, PURIFY_CONFIG);
  // Si hay estilos, agregarlos antes del contenido
  return styles ? `${styles}\n${sanitizedBody}` : sanitizedBody;
};

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
  // Estado separado para el editor HTML (no se comparte con Plantillas)
  const [editorHtmlContent, setEditorHtmlContent] = useState('');
  
  // Estados para el sistema avanzado de logo
  const [logoValidation, setLogoValidation] = useState<{
    isValid: boolean;
    error?: string;
    warnings: string[];
    naturalWidth?: number;
    naturalHeight?: number;
    fileSize?: number;
  }>({ isValid: false, warnings: [] });
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  
  // Estados para Fase 2: UX Professional
  const [emailSafeMode, setEmailSafeMode] = useState(false);
  const [exportQuality, setExportQuality] = useState(0.9);
  const [selectedClient, setSelectedClient] = useState<'outlook' | 'gmail' | 'apple-mail' | 'none'>('none');
  const [savedPresets, setSavedPresets] = useState<Array<{name: string; config: LogoConfig}>>(() => {
    const saved = localStorage.getItem('logoPresets');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Función para guardar preset personalizado (Fase 3: Deluxe)
  const saveCurrentAsPreset = useCallback((presetData?: LogoConfig) => {
    const configToSave = presetData || sig.logoConfig;
    if (!configToSave?.url) {
      message.warning('No hay logo cargado para guardar como preset');
      return;
    }
    const name = prompt('Nombre del preset:') || `Preset ${savedPresets.length + 1}`;
    if (!name) return;
    const newPreset = { name, config: { ...configToSave } };
    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    localStorage.setItem('logoPresets', JSON.stringify(updated));
    message.success(`Preset "${name}" guardado`);
  }, [sig.logoConfig, savedPresets]);

  // Función para renombrar preset
  const renamePreset = useCallback((index: number, newName: string) => {
    if (!newName.trim()) {
      message.error('El nombre no puede estar vacío');
      return;
    }
    const updated = savedPresets.map((preset, i) => 
      i === index ? { ...preset, name: newName } : preset
    );
    setSavedPresets(updated);
    localStorage.setItem('logoPresets', JSON.stringify(updated));
    message.success(`Preset renombrado a "${newName}"`);
  }, [savedPresets]);

  // Función para duplicar preset
  const duplicatePreset = useCallback((preset: {name: string; config: LogoConfig}) => {
    const newName = `${preset.name} (Copia)`;
    const newPreset = { name: newName, config: { ...preset.config } };
    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    localStorage.setItem('logoPresets', JSON.stringify(updated));
    message.success(`Preset duplicado como "${newName}"`);
  }, [savedPresets]);

  // Función para editar configuración de preset
  const updatePresetConfig = useCallback((index: number, field: string, value: unknown) => {
    const updated = savedPresets.map((preset, i) => 
      i === index ? { 
        ...preset, 
        config: { ...preset.config, [field]: value }
      } : preset
    );
    setSavedPresets(updated);
    localStorage.setItem('logoPresets', JSON.stringify(updated));
    message.success('Preset actualizado');
  }, [savedPresets]);

  // Función para aplicar variante de logo (B&W, inverted, etc.)
  const applyLogoVariant = useCallback((variant: 'color' | 'bw' | 'inverted') => {
    if (!sig.logoConfig?.url) {
      message.warning('No hay logo cargado');
      return;
    }

    const canvas = document.createElement('canvas');
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = sig.logoConfig.url;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      if (variant === 'bw') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i+1] + data[i+2]) / 3;
          data[i] = avg;     // R
          data[i+1] = avg; // G
          data[i+2] = avg; // B
        }
        ctx.putImageData(imageData, 0, 0);
      } else if (variant === 'inverted') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i];     // R
          data[i+1] = 255 - data[i+1]; // G
          data[i+2] = 255 - data[i+2]; // B
        }
        ctx.putImageData(imageData, 0, 0);
      }

      const newUrl = canvas.toDataURL('image/png');
      setSig(prev => ({
        ...prev,
        logoConfig: { ...prev.logoConfig, url: newUrl }
      }));
      message.success(`Variante ${variant} aplicada`);
    };
  }, [sig.logoConfig]);

  // Función para cargar preset
  const loadPreset = useCallback((preset: {name: string; config: LogoConfig}) => {
    setSig(prev => ({
      ...prev,
      logoConfig: { ...preset.config, url: prev.logoConfig.url || preset.config.url }
    }));
    message.success(`Preset "${preset.name}" cargado`);
  }, []);

  // Función para eliminar preset
  const deletePreset = useCallback((index: number) => {
    const updated = savedPresets.filter((_, i) => i !== index);
    setSavedPresets(updated);
    localStorage.setItem('logoPresets', JSON.stringify(updated));
    message.info('Preset eliminado');
  }, [savedPresets]);

  useEffect(() => {
    const saved = localStorage.getItem('savedEmailSignatures');
    if (saved) {
      try {
        setSavedSignatures(JSON.parse(saved));
      } catch (parseErr) {
        console.error('Error parsing saved signatures:', parseErr);
      }
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
      logoConfig: { ...defaultSignature.logoConfig },
    });
    setLogoValidation({ isValid: false, warnings: [] });
    message.info('Firma reiniciada');
  }, [selectedTemplate]);

  const updateLogoConfig = useCallback((field: string, value: unknown) => {
    setSig(prev => ({
      ...prev,
      logoConfig: { ...prev.logoConfig, [field]: value }
    }));
  }, []);

  const handleLogoUpload = useCallback(async (file: File) => {
    setIsProcessingLogo(true);
    
    try {
      // Validación
      const validation = await validateLogo(file);
      setLogoValidation({
        isValid: validation.isValid,
        error: validation.error,
        warnings: validation.warnings,
        naturalWidth: validation.naturalWidth,
        naturalHeight: validation.naturalHeight,
        fileSize: validation.fileSize,
      });

      if (!validation.isValid) {
        message.error(validation.error);
        setIsProcessingLogo(false);
        return;
      }

      // Compresión
      const compressed = await compressLogo(file, {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.9,
        outputFormat: file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png'
      });

      // Actualizar configuración
      const newLogoConfig = updateLogoConfigWithValidation(
        sig.logoConfig,
        compressed.dataUrl,
        validation.naturalWidth!,
        validation.naturalHeight!
      );

      setSig(prev => ({
        ...prev,
        logoUrl: compressed.dataUrl,
        logoConfig: newLogoConfig
      }));

      message.success('Logo cargado y optimizado');
    } catch (err) {
      console.error('[Logo Upload] Error:', err);
      message.error('Error al procesar el logo');
      setLogoValidation({ isValid: false, warnings: [], error: 'Error al procesar' });
    } finally {
      setIsProcessingLogo(false);
    }
  }, [sig.logoConfig]);

  const applyLogoPreset = useCallback((presetKey: LogoPresetKey) => {
    const preset = LOGO_PRESETS[presetKey];
    if (!preset) return;
    
    setSig(prev => ({
      ...prev,
      logoConfig: {
        ...prev.logoConfig,
        ...preset,
        // Mantener URL y otros campos
        url: prev.logoConfig.url,
        naturalWidth: prev.logoConfig.naturalWidth,
        naturalHeight: prev.logoConfig.naturalHeight,
        show: prev.logoConfig.show,
        altText: prev.logoConfig.altText,
        linkUrl: prev.logoConfig.linkUrl,
        maxWidthForExport: prev.logoConfig.maxWidthForExport,
        quality: prev.logoConfig.quality,
      }
    }));
    message.success(`Preset "${presetKey}" aplicado`);
  }, []);

  const exportAsImage = async () => {
    const previewEl = previewRef.current;
    if (!previewEl) {
      message.error('No hay vista previa para exportar');
      return;
    }

    setIsConverting(true);
    try {
      const bgColor = sig.bgColor || '#ffffff';
      let dataUrl: string;
      let filename = `firma-${Date.now()}`;
      
      // Email Safe Mode: redimensionar a max 600px de ancho
      const targetWidth = emailSafeMode ? Math.min(600, sig.width) : sig.width;
      const pixelRatio = emailSafeMode ? 2 : 4; // Menor resolución para email
      
      if (exportFormat === 'jpg') {
        dataUrl = await toPng(previewEl, {
          quality: exportQuality,
          pixelRatio: pixelRatio,
          cacheBust: true,
          backgroundColor: bgColor,
        });
        filename += '.jpg';
      } else {
        dataUrl = await toPng(previewEl, {
          quality: exportQuality,
          pixelRatio: pixelRatio,
          cacheBust: true,
          backgroundColor: bgColor,
        });
        filename += '.png';
      }

      // Si es Email Safe Mode, comprimir más
      if (emailSafeMode) {
        const img = new window.Image();
        img.src = dataUrl;
        await new Promise(resolve => { img.onload = resolve; });
        
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = (img.height / img.width) * targetWidth;
        
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        dataUrl = canvas.toDataURL(exportFormat === 'jpg' ? 'image/jpeg' : 'image/png', exportQuality * 0.8);
      }

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      link.click();
      message.success(`Exportado: ${filename}${emailSafeMode ? ' (Email Safe)' : ''}`);
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
         style={{ background: '#fafafa', borderColor: '#e0e0e0' }}
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

                <Card size="small" style={{ marginBottom: 16, background: '#fafafa', borderColor: '#e0e0e0' }}>
                  <div style={{ fontWeight: 600, color: '#333', fontSize: 13 }}>① Información Personal</div>
                  <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
                    <Col span={24}><Input placeholder="Nombre *" value={sig.name} onChange={(e) => updateField('name', e.target.value)} /></Col>
                    <Col span={24}><Input placeholder="Cargo" value={sig.title} onChange={(e) => updateField('title', e.target.value)} /></Col>
                    <Col span={24}><Input placeholder="Empresa" value={sig.company} onChange={(e) => updateField('company', e.target.value)} /></Col>
                  </Row>
                </Card>

                <Card size="small" style={{ marginBottom: 16, background: '#fafafa', borderColor: '#e0e0e0' }}>
                  <div style={{ fontWeight: 600, color: '#333', fontSize: 13 }}>② Contacto</div>
                  <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
                    <Col span={24}><Input placeholder="Email" value={sig.email} onChange={(e) => updateField('email', e.target.value)} /></Col>
                    <Col span={24}><Input placeholder="Teléfono" value={sig.phone} onChange={(e) => updateField('phone', e.target.value)} /></Col>
                    <Col span={24}><Input placeholder="Web" value={sig.website} onChange={(e) => updateField('website', e.target.value)} /></Col>
                  </Row>
                </Card>

                <Card size="small" style={{ marginBottom: 16, background: '#fafafa', borderColor: '#e0e0e0' }}>
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
                    <Col span={24}>
                      <div style={{ fontWeight: 600, color: '#333', fontSize: 13, marginBottom: 8 }}>④ Logo Empresarial</div>
                      
                      {/* Upload area con drag & drop */}
                      <Upload
                        accept=".png,.jpg,.jpeg,.svg,.webp,.gif"
                        showUploadList={false}
                        maxCount={1}
                        beforeUpload={(file) => {
                          handleLogoUpload(file as File);
                          return false;
                        }}
                        style={{ marginBottom: 12 }}
                        disabled={isProcessingLogo}
                      >
                        <div style={{
                          border: `2px dashed ${logoValidation.isValid ? '#52c41a' : '#d9d9d9'}`,
                          borderRadius: 8,
                          padding: '16px',
                          textAlign: 'center',
                          background: logoValidation.isValid ? '#f6ffed' : '#fafafa',
                          cursor: 'pointer',
                          transition: 'all 0.3s'
                        }}>
                          {isProcessingLogo ? (
                            <div>
                              <div style={{ fontSize: 24, color: '#1890ff' }}>⟳</div>
                              <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                                Procesando logo...
                              </div>
                            </div>
                          ) : sig.logoConfig?.url ? (
                            <div>
                              <img 
                                src={sig.logoConfig.url} 
                                alt="Logo preview" 
                                style={{ 
                                  maxWidth: 200, 
                                  maxHeight: 80, 
                                  objectFit: 'contain',
                                  borderRadius: sig.logoConfig.borderRadius 
                                }} 
                              />
                              <div style={{ marginTop: 8 }}>
                                {logoValidation.naturalWidth && (
                                  <Tag color="blue">{logoValidation.naturalWidth}x{logoValidation.naturalHeight}</Tag>
                                )}
                                {logoValidation.fileSize && (
                                  <Tag color={logoValidation.fileSize > 2*1024*1024 ? 'orange' : 'green'}>
                                    {(logoValidation.fileSize / (1024*1024)).toFixed(1)}MB
                                  </Tag>
                                )}
                              </div>
                              <Button size="small" type="link">Cambiar logo</Button>
                            </div>
                          ) : (
                            <div>
                              <UploadOutlined style={{ fontSize: 24, color: '#999' }} />
                              <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                                Arrastra o haz clic para subir
                              </div>
                              <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>
                                PNG, JPG, SVG hasta 5MB
                              </div>
                            </div>
                          )}
                        </div>
                      </Upload>

                      {/* Validación y advertencias */}
                      {logoValidation.error && (
                        <Alert type="error" message={logoValidation.error} showIcon style={{ marginBottom: 8 }} />
                      )}
                      {logoValidation.warnings.map((warning, idx) => (
                        <Alert key={idx} type="warning" message={warning} showIcon style={{ marginBottom: 4 }} />
                      ))}

                      {/* Controles de dimensiones avanzados */}
                      {sig.logoConfig?.url && (
                        <Collapse size="small" style={{ marginBottom: 12 }}>
                          <Collapse.Panel header="Dimensiones y Estilo" key="dimensions">
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Tooltip title="Ancho">
                                  <InputNumber 
                                    size="small"
                                    value={sig.logoConfig.width}
                                    onChange={(v) => updateLogoConfig('width', v)}
                                    addonAfter="px"
                                    min={30} max={600}
                                    style={{ width: 120 }}
                                  />
                                </Tooltip>
                                <Tooltip title={sig.logoConfig.lockAspectRatio ? 'Aspecto bloqueado' : 'Aspecto libre'}>
                                  <Button 
                                    size="small"
                                    icon={sig.logoConfig.lockAspectRatio ? <LockOutlined /> : <UnlockOutlined />}
                                    onClick={() => updateLogoConfig('lockAspectRatio', !sig.logoConfig.lockAspectRatio)}
                                    type={sig.logoConfig.lockAspectRatio ? 'primary' : 'default'}
                                  />
                                </Tooltip>
                                <Tooltip title="Alto">
                                  <InputNumber 
                                    size="small"
                                    value={sig.logoConfig.height}
                                    onChange={(v) => updateLogoConfig('height', v)}
                                    addonAfter="px"
                                    min={30} max={600}
                                    style={{ width: 120 }}
                                    disabled={sig.logoConfig.lockAspectRatio}
                                  />
                                </Tooltip>
                              </div>

                              <Slider 
                                min={100} max={600}
                                value={sig.logoConfig.width}
                                onChange={(v: number) => {
                                  const newHeight = sig.logoConfig.lockAspectRatio && sig.logoConfig.naturalWidth
                                    ? v / (sig.logoConfig.naturalWidth / sig.logoConfig.naturalHeight!)
                                    : sig.logoConfig.height;
                                  updateLogoConfig('width', v);
                                  updateLogoConfig('height', Math.round(newHeight));
                                }}
                                marks={{ 100: 'Mínimo', 200: 'Standard', 400: 'Grande', 600: 'Máximo' }}
                              />

                              <Button 
                                size="small" 
                                icon={<ReloadOutlined />}
                                onClick={() => {
                                  if (sig.logoConfig.naturalWidth && sig.logoConfig.naturalHeight) {
                                    updateLogoConfig('width', sig.logoConfig.naturalWidth);
                                    updateLogoConfig('height', sig.logoConfig.naturalHeight);
                                    message.info('Tamaño original restaurado');
                                  }
                                }}
                              >
                                Tamaño original
                              </Button>

                              <div>
                                <span style={{ fontSize: 12, marginRight: 8 }}>Border Radius:</span>
                              <Slider 
                                min={0} max={50}
                                value={sig.logoConfig.borderRadius}
                                onChange={(v: number) => updateLogoConfig('borderRadius', v)}
                                style={{ width: 200, display: 'inline-block' }}
                              />
                              </div>

                              <div>
                                <span style={{ fontSize: 12, marginRight: 8 }}>Padding:</span>
                                <InputNumber 
                                  size="small"
                                  value={sig.logoConfig.padding}
                                  onChange={(v) => updateLogoConfig('padding', v)}
                                  addonAfter="px"
                                  min={0} max={50}
                                  style={{ width: 120 }}
                                />
                              </div>

                              <div>
                                <span style={{ fontSize: 12, marginRight: 8 }}>Object Fit:</span>
                                <Radio.Group 
                                  size="small"
                                  value={sig.logoConfig.objectFit}
                                  onChange={(e) => updateLogoConfig('objectFit', e.target.value)}
                                >
                                  <Radio.Button value="contain">Contener</Radio.Button>
                                  <Radio.Button value="cover">Cubrir</Radio.Button>
                                  <Radio.Button value="fill">Rellenar</Radio.Button>
                                </Radio.Group>
                              </div>

                               <div>
                                 <span style={{ fontSize: 12, marginRight: 8 }}>Enlace:</span>
                                 <Input 
                                   size="small"
                                   placeholder="https://empresa.com"
                                   value={sig.logoConfig.linkUrl || ''}
                                   onChange={(e) => updateLogoConfig('linkUrl', e.target.value)}
                                   prefix={<LinkOutlined />}
                                   style={{ width: 250 }}
                                 />
                               </div>

                               {/* Fase 3: Logo Variants */}
                               <div style={{ marginTop: 8 }}>
                                 <span style={{ fontSize: 12, marginRight: 8 }}>Variantes:</span>
                                 <Space size="small">
                                   <Button 
                                     size="small" 
                                     onClick={() => applyLogoVariant('bw')}
                                     disabled={!sig.logoConfig?.url}
                                     title="Convertir a blanco y negro"
                                   >
                                     B&W
                                   </Button>
                                   <Button 
                                     size="small" 
                                     onClick={() => applyLogoVariant('inverted')}
                                     disabled={!sig.logoConfig?.url}
                                     title="Invertir colores"
                                   >
                                     🔄 Invertir
                                   </Button>
                                   <Button 
                                     size="small" 
                                     onClick={() => {
                                       if (sig.logoConfig?.url) {
                                         updateLogoConfig('url', sig.logoConfig.url);
                                         message.info('Color original restaurado');
                                       }
                                     }}
                                     disabled={!sig.logoConfig?.url}
                                     title="Restaurar color original"
                                   >
                                     🎨 Color
                                   </Button>
                                 </Space>
                               </div>

                               <div>
                                <Checkbox 
                                  checked={sig.logoConfig.show}
                                  onChange={(e) => updateLogoConfig('show', e.target.checked)}
                                >
                                  Mostrar logo
                                </Checkbox>
                              </div>
                            </Space>
                          </Collapse.Panel>
                        </Collapse>
                      )}

                      {/* Presets empresariales */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: '#666', marginBottom: 4 }}>
                          Presets Empresariales
                        </div>
                        <Space wrap>
                          {Object.entries(LOGO_PRESETS).map(([key, preset]) => (
                            <Tooltip 
                              key={key}
                              title={`${preset.width}x${preset.height}, ${preset.objectFit}`}
                            >
                              <Button 
                                size="small"
                                onClick={() => applyLogoPreset(key as LogoPresetKey)}
                                icon={<FullscreenOutlined />}
                              >
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                              </Button>
                            </Tooltip>
                          ))}
                        </Space>
                      </div>

                      {/* Eliminar logo */}
                      {sig.logoConfig?.url && (
                        <Button 
                          size="small" 
                          danger 
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            setSig(prev => ({
                              ...prev,
                              logoUrl: '',
                              logoConfig: { ...prev.logoConfig, url: '', naturalWidth: undefined, naturalHeight: undefined }
                            }));
                            setLogoValidation({ isValid: false, warnings: [] });
                            message.info('Logo eliminado');
                          }}
                        >
                          Eliminar logo
                        </Button>
                      )}
                    </Col>
                  </Row>
                  {/* Controles de Fase 2: Email Safe Mode y Calidad */}
                  <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
                    <Col span={12}><div style={{ fontSize: 12, color: '#666' }}>Fondo</div><ColorPicker value={sig.bgColor} onChange={(c) => updateField('bgColor', c.toHexString())} /></Col>
                    <Col span={12}><div style={{ fontSize: 12, color: '#666' }}>Texto</div><ColorPicker value={sig.textColor} onChange={(c) => updateField('textColor', c.toHexString())} /></Col>
                  </Row>
                  <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                    <Col span={24}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 12, color: '#666' }}>Modo Oscuro</div>
                        <Switch
                          checked={sig.darkMode}
                          onChange={(checked) => updateField('darkMode', checked)}
                          checkedChildren="🌙"
                          unCheckedChildren="☀️"
                        />
                      </div>
                    </Col>
                  </Row>
                 </Card>

                 {/* Fase 2: Gestión de Presets Personalizados */}
                 <Card size="small" style={{ background: '#fafafa', borderColor: '#e0e0e0' }}>
                   <div style={{ fontWeight: 600, color: '#333', fontSize: 13, marginBottom: 8 }}>⑥ Gestión de Presets</div>
                   
                    <Button 
                      size="small" 
                      type="primary"
                      icon={<FullscreenOutlined />}
                      onClick={() => saveCurrentAsPreset()}
                      style={{ marginBottom: 8 }}
                    >
                      Guardar Config Actual como Preset
                    </Button>

                    {savedPresets.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Presets Guardados:</div>
                        {savedPresets.map((preset, index) => (
                          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #333' }}>
                            <Space size="small">
                              <span style={{ fontSize: 12, color: '#333', fontWeight: 500 }}>{preset.name}</span>
                              <Tag style={{ fontSize: 10 }}>{preset.config.width}x{preset.config.height}</Tag>
                            </Space>
                            <Space size="small">
                              <Tooltip title="Renombrar">
                                <Button size="small" type="text" onClick={() => {
                                  const newName = prompt('Nuevo nombre:', preset.name);
                                  if (newName) renamePreset(index, newName);
                                }}>✏️</Button>
                              </Tooltip>
                              <Tooltip title="Duplicar">
                                <Button size="small" type="text" onClick={() => duplicatePreset(preset)}>📋</Button>
                              </Tooltip>
                              <Tooltip title="Editar configuración">
                                <Button size="small" type="text" onClick={() => {
                                  const field = prompt('Campo a editar (width/height/borderRadius):');
                                  const value = prompt('Nuevo valor:');
                                  if (field && value) updatePresetConfig(index, field, Number(value));
                                }}>⚙️</Button>
                              </Tooltip>
                              <Button size="small" type="link" onClick={() => loadPreset(preset)}>Cargar</Button>
                              <Button size="small" type="text" danger onClick={() => deletePreset(index)}>Eliminar</Button>
                            </Space>
                          </div>
                        ))}
                      </div>
                    )}
                 </Card>

                 <Card size="small" style={{ background: '#fafafa', borderColor: '#e0e0e0' }}>
                   <div style={{ fontWeight: 600, color: '#333', fontSize: 13 }}>⑦ Estilos</div>
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
                       {selectedClient !== 'none' && (
                         <Tag color="blue">
                           {selectedClient === 'outlook' ? 'Outlook (600px)' : 
                            selectedClient === 'gmail' ? 'Gmail (800px)' : 
                            'Apple Mail (100%)'}
                         </Tag>
                       )}
                     </Space>
                   }
                   extra={
                          <Space direction="vertical" size="small">
                            <Space>
                              <Radio.Group value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                                <Radio.Button value="png">PNG</Radio.Button>
                                <Radio.Button value="jpg">JPG</Radio.Button>
                              </Radio.Group>
                              <Button 
                                type={emailSafeMode ? 'primary' : 'default'}
                                onClick={() => setEmailSafeMode(!emailSafeMode)}
                                title="Modo Email Safe: 600px max, optimizado para clientes"
                              >
                                📧 Email Safe
                              </Button>
                            </Space>
                            {emailSafeMode && (
                              <Alert
                                message="Modo Email Safe activado"
                                description="La imagen se redimensionará a 600px de ancho máximo y se optimizará para clientes de correo."
                                type="info"
                                showIcon
                                style={{ marginTop: 8 }}
                              />
                            )}
                            <div>
                              <span style={{ fontSize: 12, marginRight: 8 }}>Calidad:</span>
                               <Slider 
                                 min={0.1} max={1} step={0.1}
                                 value={exportQuality}
                                 onChange={(v: number) => setExportQuality(v)}
                                 style={{ width: 150, display: 'inline-block' }}
                               />
                            </div>
                            <div>
                              <span style={{ fontSize: 12, marginRight: 8 }}>Cliente:</span>
                              <Radio.Group 
                                value={selectedClient} 
                                onChange={(e) => setSelectedClient(e.target.value)}
                                size="small"
                              >
                                <Radio.Button value="none">Ninguno</Radio.Button>
                                <Radio.Button value="outlook">Outlook</Radio.Button>
                                <Radio.Button value="gmail">Gmail</Radio.Button>
                                <Radio.Button value="apple-mail">Apple Mail</Radio.Button>
                              </Radio.Group>
                            </div>
                            <Button type="primary" icon={<DownloadOutlined />} onClick={exportAsImage} loading={isConverting}>Exportar</Button>
                          </Space>
                        }
                >
                    <div 
                      ref={previewRef} 
                      style={{ 
                        padding: 24, 
                        background: selectedClient === 'outlook' ? 'var(--bg-tertiary)' : 
                                 selectedClient === 'gmail' ? 'var(--bg-primary)' : 
                                 'var(--bg-tertiary)',
                        borderRadius: selectedClient === 'apple-mail' ? 16 : 8,
                        minHeight: 200,
                        maxWidth: selectedClient === 'outlook' ? 600 : 
                                 selectedClient === 'gmail' ? 800 : 
                                 '100%',
                        margin: '0 auto',
                        border: selectedClient !== 'none' ? 
                                 selectedClient === 'outlook' ? '2px solid #0078d4' : 
                                 selectedClient === 'gmail' ? '2px solid #ea4335' : 
                                 '2px solid #000' 
                                 : 'none',
                        boxShadow: selectedClient === 'gmail' ? '0 2px 4px rgba(0,0,0,0.1)' : 
                                  selectedClient === 'apple-mail' ? '0 4px 12px rgba(0,0,0,0.15)' : 
                                  'none'
                      }}
                    >
                      {/* Plantillas tab: siempre mostrar la plantilla seleccionada */}
                      {renderFlexibleSignature(
                        sig, 
                        selectedClient === 'outlook' ? 600 : 
                        selectedClient === 'gmail' ? 800 : 
                        400, 
                        selectedTemplate
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
            <Card size="small" title={<Space><CodeOutlined /> Editor HTML</Space>} extra={<Button size="small" onClick={() => setEditorHtmlContent(generateHtmlFromSignature())}>Reset</Button>}>
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 12 }}>HTML (puedes pegar HTML completo con &lt;style&gt;)</div>
                  <Input.TextArea value={editorHtmlContent} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditorHtmlContent(e.target.value)} autoSize={{ minRows: 12, maxRows: 20 }} style={{ fontFamily: 'monospace', fontSize: 12, background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} placeholder="<!-- Pega tu HTML aquí (puede incluir <!DOCTYPE>, <html>, <head> con <style>) -->" />
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
                  <div ref={previewRef} style={{ border: '1px solid #d1d5db', borderRadius: 4, padding: 16, background: '#fff', overflow: 'auto', maxHeight: 350, minHeight: 250 }} dangerouslySetInnerHTML={{ __html: editorHtmlContent ? sanitizeHtml(editorHtmlContent) : '<div style="color:#999;font-size:12px;">Pega tu HTML en el editor para ver la vista previa</div>' }} />
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