import React from 'react';

export interface EmailSignature {
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
  borderRadius: number;
  width: number;
  fontFamily: string;
  fontSize: number;
  address: string;
  skype: string;
  instagram: string;
  facebook: string;
  logoPosition: 'left' | 'right' | 'top' | 'center';
  layout: 'horizontal' | 'vertical' | 'centered';
  elementOrder: string[];
}

export interface SignatureTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  config: Pick<EmailSignature, 'bgColor' | 'textColor' | 'linkColor' | 'accentColor' | 'borderRadius'>;
  defaultLayout: 'horizontal' | 'vertical' | 'centered';
  defaultLogoPosition: 'left' | 'right' | 'top' | 'center';
  formSections: ('basic' | 'contact' | 'social' | 'style' | 'structure')[];
  category?: string;
}

const linkStyle = (color: string) => ({
  color,
  textDecoration: 'none' as const,
});

const IconPhone = ({ color }: { color: string }) => (
  <span style={{ color, marginRight: 4 }}>📞</span>
);
const IconEmail = ({ color }: { color: string }) => (
  <span style={{ color, marginRight: 4 }}>✉️</span>
);
const IconWeb = ({ color }: { color: string }) => (
  <span style={{ color, marginRight: 4 }}>🌐</span>
);
const IconLocation = ({ color }: { color: string }) => (
  <span style={{ color, marginRight: 4 }}>📍</span>
);
const IconSkype = ({ color }: { color: string }) => (
  <span style={{ color, marginRight: 4 }}>💬</span>
);

const LogoImage = ({ logoUrl, size = 80 }: { logoUrl: string; size?: number }) => (
  logoUrl && <img src={logoUrl} alt="Logo" style={{ width: size, height: size, objectFit: 'contain', borderRadius: 8 }} />
);

const NameBlock = ({ sig }: { sig: EmailSignature }) => (
  <div>
    <div style={{ fontSize: sig.fontSize + 6, fontWeight: 'bold', color: sig.textColor }}>
      {sig.name || 'Tu Nombre'}
    </div>
    {sig.title && (
      <div style={{ fontSize: sig.fontSize + 2, color: sig.accentColor, marginTop: 4 }}>
        {sig.title}
      </div>
    )}
    {sig.company && (
      <div style={{ fontSize: sig.fontSize, color: sig.textColor, fontWeight: 500, marginTop: 4 }}>
        {sig.company}
      </div>
    )}
  </div>
);

const ContactBlock = ({ sig }: { sig: EmailSignature }) => (
  <div style={{ fontSize: sig.fontSize }}>
    {sig.email && (
      <div><IconEmail color={sig.linkColor} /><a href={`mailto:${sig.email}`} style={linkStyle(sig.linkColor)}>{sig.email}</a></div>
    )}
    {sig.phone && (
      <div style={{ marginTop: 4 }}><IconPhone color={sig.linkColor} /><a href={`tel:${sig.phone}`} style={linkStyle(sig.linkColor)}>{sig.phone}</a></div>
    )}
    {sig.website && (
      <div style={{ marginTop: 4 }}><IconWeb color={sig.linkColor} /><a href={`https://${sig.website}`} style={linkStyle(sig.linkColor)} target="_blank">{sig.website}</a></div>
    )}
    {sig.address && (
      <div style={{ marginTop: 4 }}><IconLocation color={sig.linkColor} />{sig.address}</div>
    )}
    {sig.skype && (
      <div style={{ marginTop: 4 }}><IconSkype color={sig.linkColor} />{sig.skype}</div>
    )}
  </div>
);

const SocialBlock = ({ sig }: { sig: EmailSignature }) => (
  (sig.linkedin || sig.twitter || sig.instagram || sig.facebook) && (
    <div style={{ display: 'flex', gap: 12, fontSize: sig.fontSize, marginTop: 8 }}>
      {sig.linkedin && <a href={sig.linkedin} style={linkStyle(sig.linkColor)}>LinkedIn</a>}
      {sig.twitter && <a href={sig.twitter} style={linkStyle(sig.linkColor)}>Twitter</a>}
      {sig.instagram && <a href={sig.instagram} style={linkStyle(sig.linkColor)}>Instagram</a>}
      {sig.facebook && <a href={sig.facebook} style={linkStyle(sig.linkColor)}>Facebook</a>}
    </div>
  )
);

export function renderFlexibleSignature(sig: EmailSignature, width: number): React.ReactNode {
  const order = sig.elementOrder.length > 0 ? sig.elementOrder : ['name', 'contact', 'social'];
  
  const containerStyle: React.CSSProperties = {
    width,
    maxWidth: '100%',
    padding: 24,
    background: sig.bgColor,
    fontFamily: sig.fontFamily,
    fontSize: sig.fontSize,
    borderRadius: sig.borderRadius,
  };

  const flexDirection = sig.layout === 'horizontal' ? 'row' : 'column';
  const justifyContent = sig.layout === 'centered' ? 'center' : (sig.logoPosition === 'right' ? 'flex-end' : 'flex-start');
  const textAlign = sig.layout === 'centered' || sig.logoPosition === 'center' ? 'center' as const : 'left' as const;

  if (sig.logoPosition === 'top' || sig.logoPosition === 'center') {
    return (
      <div style={{ ...containerStyle, textAlign }}>
        {sig.logoUrl && (
          <div style={{ marginBottom: 16, textAlign: 'center' }}>
            <LogoImage logoUrl={sig.logoUrl} size={80} />
          </div>
        )}
        {order.filter(b => b !== 'logo').map((blockId) => (
          <div key={blockId}>
            {blockId === 'name' && <NameBlock sig={sig} />}
            {blockId === 'contact' && <ContactBlock sig={sig} />}
            {blockId === 'social' && <SocialBlock sig={sig} />}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ ...containerStyle, display: 'flex', flexDirection, justifyContent, gap: 20, alignItems: 'flex-start' }}>
      {sig.logoPosition === 'left' && sig.logoUrl && (
        <div style={{ flexShrink: 0 }}>
          <LogoImage logoUrl={sig.logoUrl} size={80} />
        </div>
      )}
      <div style={{ flex: 1, textAlign }}>
        {order.filter(b => b !== 'logo').map((blockId) => (
          <div key={blockId}>
            {blockId === 'name' && <NameBlock sig={sig} />}
            {blockId === 'contact' && <ContactBlock sig={sig} />}
            {blockId === 'social' && <SocialBlock sig={sig} />}
          </div>
        ))}
      </div>
      {sig.logoPosition === 'right' && sig.logoUrl && (
        <div style={{ flexShrink: 0 }}>
          <LogoImage logoUrl={sig.logoUrl} size={80} />
        </div>
      )}
    </div>
  );
}

export const signatureTemplates: SignatureTemplate[] = [
  {
    id: 'minimal-clean',
    name: 'Minimalista',
    description: 'Diseño limpio con espacio amplio y tipografía elegante',
    preview: '⬜═══',
    config: { bgColor: '#ffffff', textColor: '#2d2d2d', linkColor: '#2563eb', accentColor: '#2563eb', borderRadius: 0 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'minimal',
  },
  {
    id: 'minimal-dark',
    name: 'Oscuro',
    description: 'Fondo oscuro elegante con texto claro',
    preview: '⬛═══',
    config: { bgColor: '#1a1a1a', textColor: '#e5e5e5', linkColor: '#60a5fa', accentColor: '#60a5fa', borderRadius: 0 },
    defaultLayout: 'vertical',
    defaultLogoPosition: 'top',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'premium',
  },
  {
    id: 'hierarchical-top',
    name: 'Corporativo',
    description: 'Logo centrado arriba con jerarquía visual clara',
    preview: '◻👔◻',
    config: { bgColor: '#f8fafc', textColor: '#1e293b', linkColor: '#0f766e', accentColor: '#0f766e', borderRadius: 8 },
    defaultLayout: 'centered',
    defaultLogoPosition: 'center',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'corporate',
  },
  {
    id: 'hierarchical-sidebar',
    name: 'Lateral',
    description: 'Barra lateral accent con información organizada',
    preview: '▌│││',
    config: { bgColor: '#ffffff', textColor: '#334155', linkColor: '#7c3aed', accentColor: '#7c3aed', borderRadius: 0 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'corporate',
  },
  {
    id: 'visual-centered',
    name: 'Centrado',
    description: 'Logo grande centrado con diseño simétrico',
    preview: '◻👔◻',
    config: { bgColor: '#fef3c7', textColor: '#92400e', linkColor: '#d97706', accentColor: '#d97706', borderRadius: 16 },
    defaultLayout: 'centered',
    defaultLogoPosition: 'top',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'creative',
  },
  {
    id: 'visual-beside',
    name: 'Visual Lateral',
    description: 'Logo lateral con tarjetas internas',
    preview: '▌│││',
    config: { bgColor: '#f0f9ff', textColor: '#0c4a6e', linkColor: '#0284c7', accentColor: '#0284c7', borderRadius: 12 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
  },
  {
    id: 'sectoral-blocks',
    name: 'Sectorial Bloques',
    description: 'Secciones diferenciadas con colores alternados',
    preview: '▬▬▬',
    config: { bgColor: '#ffffff', textColor: '#1f2937', linkColor: '#059669', accentColor: '#059669', borderRadius: 8 },
    defaultLayout: 'vertical',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
  },
  {
    id: 'sectoral-grid',
    name: 'Sectorial Grid',
    description: 'Grid de 2x2 para campos de información',
    preview: '▣▣',
    config: { bgColor: '#fafafa', textColor: '#374151', linkColor: '#7c3aed', accentColor: '#7c3aed', borderRadius: 12 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
  },
  {
    id: 'corporate-strict',
    name: 'Corporativo Estricto',
    description: 'Diseño formal compatible con Outlook',
    preview: '═╪═',
    config: { bgColor: '#1e3a5f', textColor: '#ffffff', linkColor: '#93c5fd', accentColor: '#93c5fd', borderRadius: 0 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
  },
  {
    id: 'corporate-modern',
    name: 'Corporativo Moderno',
    description: 'Estilo corporativo con gradiente y badges',
    preview: '▬═══',
    config: { bgColor: '#ffffff', textColor: '#1f2937', linkColor: '#2563eb', accentColor: '#2563eb', borderRadius: 16 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
  },
  {
    id: 'elegant-serif',
    name: 'Elegante Serif',
    description: 'Tipografía serif con ornamento decorativo',
    preview: '▬═══',
    config: { bgColor: '#faf8f5', textColor: '#2d2d2d', linkColor: '#8b4513', accentColor: '#8b4513', borderRadius: 4 },
    defaultLayout: 'centered',
    defaultLogoPosition: 'top',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
  },
  {
    id: 'tech-startup',
    name: 'Tech Startup',
    description: 'Colores vibrantes con formas geométricas',
    preview: '◻◻◻',
    config: { bgColor: '#f0fdf4', textColor: '#166534', linkColor: '#16a34a', accentColor: '#16a34a', borderRadius: 16 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
  },
  {
    id: 'card-shadow',
    name: 'Tarjeta Sombra',
    description: 'Contenido elevado con sombra suave',
    preview: '▣═══',
    config: { bgColor: '#f5f5f5', textColor: '#333333', linkColor: '#6366f1', accentColor: '#6366f1', borderRadius: 12 },
    defaultLayout: 'vertical',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
  },
  {
    id: 'legal-formal',
    name: 'Legal Formal',
    description: 'Minimalista extremo sin decoraciones',
    preview: '════',
    config: { bgColor: '#ffffff', textColor: '#000000', linkColor: '#000000', accentColor: '#000000', borderRadius: 0 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
  },
  {
    id: 'dark-gradient',
    name: 'Dark Gradient',
    description: 'Fondo oscuro con efecto degradado premium',
    preview: '▒▒▒',
    config: { bgColor: '#0f172a', textColor: '#f1f5f9', linkColor: '#38bdf8', accentColor: '#38bdf8', borderRadius: 16 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
  },
];

export const defaultSignature: EmailSignature = {
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
  linkColor: '#2563eb',
  accentColor: '#2563eb',
  borderRadius: 8,
  width: 600,
  fontFamily: 'Arial, sans-serif',
  fontSize: 14,
  address: '',
  skype: '',
  instagram: '',
  facebook: '',
  logoPosition: 'left',
  layout: 'horizontal',
  elementOrder: ['logo', 'name', 'contact', 'social'],
};

export const ELEMENT_OPTIONS = [
  { id: 'logo', label: 'Logo' },
  { id: 'name', label: 'Nombre / Cargo' },
  { id: 'contact', label: 'Contacto' },
  { id: 'social', label: 'Redes Sociales' },
];

export const LAYOUT_PRESETS = [
  { id: 'name-contact-social', label: 'Nombre → Contacto → Redes', order: ['logo', 'name', 'contact', 'social'] },
  { id: 'name-social-contact', label: 'Nombre → Redes → Contacto', order: ['logo', 'name', 'social', 'contact'] },
  { id: 'contact-name-social', label: 'Contacto → Nombre → Redes', order: ['logo', 'contact', 'name', 'social'] },
  { id: 'contact-social-name', label: 'Contacto → Redes → Nombre', order: ['logo', 'contact', 'social', 'name'] },
  { id: 'name-only', label: 'Solo Nombre y Contacto', order: ['logo', 'name', 'contact'] },
  { id: 'custom', label: 'Personalizado', order: [] },
];