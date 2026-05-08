import React from 'react';
import { calculateLayout, buildElementList, type LayoutConfig, type ElementMetrics } from './layoutEngine';

// ==================== INTERFACES ====================

export interface LogoConfig {
  url: string;
  width: number;
  height: number;
  lockAspectRatio: boolean;
  naturalWidth?: number;
  naturalHeight?: number;
  objectFit: 'contain' | 'cover' | 'fill' | 'scale-down';
  borderRadius: number;
  padding: number;
  backgroundColor?: string;
  position: 'left' | 'right' | 'top' | 'bottom' | 'center';
  alignment: 'start' | 'center' | 'end';
  altText: string;
  linkUrl?: string;
  show: boolean;
  maxWidthForExport: number;
  quality: number;
}

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
  photoUrl: string;
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
  iconStyle: 'emoji' | 'text' | 'none';
  visibleFields: {
    email: boolean;
    phone: boolean;
    website: boolean;
    address: boolean;
    linkedin: boolean;
    twitter: boolean;
    instagram: boolean;
    facebook: boolean;
    skype: boolean;
  };
  logoConfig: LogoConfig;
  darkMode: boolean;
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

// ==================== COMPONENTES BASE ====================

const linkStyle = (color: string) => ({
  color,
  textDecoration: 'none' as const,
});

const renderIcon = (type: 'phone' | 'email' | 'web' | 'address' | 'skype', color: string, iconStyle?: 'emoji' | 'text' | 'none') => {
  if (iconStyle === 'none') return <span style={{ marginRight: 4, color }}> </span>;
  if (iconStyle === 'text') {
    const labels = { email: 'EMAIL', phone: 'TEL', web: 'WEB', address: 'DIR', skype: 'SKYPE' };
    return <span style={{ color, marginRight: 4, fontWeight: 600, fontSize: 11 }}>{labels[type]}</span>;
  }
  const emojis = { email: '✉️', phone: '📞', web: '🌐', address: '📍', skype: '💬' };
  return <span style={{ color, marginRight: 4 }}>{emojis[type]}</span>;
};

// ==================== LOGO COMPONENT ====================

export const LogoImageComp = ({ sig }: { sig: EmailSignature }) => {
  const logoConfig = sig.logoConfig;
  
  if (!logoConfig?.url || !logoConfig.show) return null;
  
  const logoStyle: React.CSSProperties = {
    width: logoConfig.width,
    height: logoConfig.height,
    objectFit: logoConfig.objectFit,
    borderRadius: logoConfig.borderRadius,
    padding: logoConfig.padding,
    backgroundColor: logoConfig.backgroundColor || 'transparent',
    maxWidth: '100%',
    display: 'block',
  };

  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: logoConfig.alignment === 'start' ? 'flex-start' : 
                   logoConfig.alignment === 'end' ? 'flex-end' : 'center',
    justifyContent: logoConfig.position === 'left' ? 'flex-start' : 
                      logoConfig.position === 'right' ? 'flex-end' : 'center',
  };

  const imgElement = (
    <img 
      src={logoConfig.url} 
      alt={logoConfig.altText || "Logo"} 
      style={logoStyle}
    />
  );

  if (logoConfig.linkUrl) {
    return (
      <div style={wrapperStyle}>
        <a href={logoConfig.linkUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block' }}>
          {imgElement}
        </a>
      </div>
    );
  }

  return <div style={wrapperStyle}>{imgElement}</div>;
};

// ==================== PHOTO COMPONENT ====================

const PhotoImage = ({ photoUrl, size = 80, borderColor = '#2563eb' }: { photoUrl: string; size?: number; borderColor?: string }) => (
  photoUrl && <img src={photoUrl} alt="Foto" style={{ width: size, height: size, objectFit: 'cover', borderRadius: '50%', border: `3px solid ${borderColor}` }} />
);

// ==================== RENDER HELPERS ====================

const renderNameBlock = (sig: EmailSignature) => (
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

const renderContactBlock = (sig: EmailSignature) => {
  const vf = sig.visibleFields || {};
  const currentIconStyle = sig.iconStyle || 'emoji';
  return (
    <div style={{ fontSize: sig.fontSize }}>
      {vf?.email !== false && sig.email && (
        <div>{renderIcon('email', sig.linkColor, currentIconStyle)}<a href={`mailto:${sig.email}`} style={linkStyle(sig.linkColor)}>{sig.email}</a></div>
      )}
      {vf?.phone !== false && sig.phone && (
        <div style={{ marginTop: 4 }}>{renderIcon('phone', sig.linkColor, currentIconStyle)}<a href={`tel:${sig.phone}`} style={linkStyle(sig.linkColor)}>{sig.phone}</a></div>
      )}
      {vf?.website !== false && sig.website && (
        <div style={{ marginTop: 4 }}>{renderIcon('web', sig.linkColor, currentIconStyle)}<a href={`https://${sig.website}`} style={linkStyle(sig.linkColor)} target="_blank">{sig.website}</a></div>
      )}
      {vf?.address !== false && sig.address && (
        <div style={{ marginTop: 4 }}>{renderIcon('address', sig.linkColor, currentIconStyle)}{sig.address}</div>
      )}
      {vf?.skype !== false && sig.skype && (
        <div style={{ marginTop: 4 }}>{renderIcon('skype', sig.linkColor, currentIconStyle)}{sig.skype}</div>
      )}
    </div>
  );
};

const renderSocialBlock = (sig: EmailSignature) => {
  const vf = sig.visibleFields || {};
  const hasSocial = (vf?.linkedin !== false && sig.linkedin) ||
    (vf?.twitter !== false && sig.twitter) ||
    (vf?.instagram !== false && sig.instagram) ||
    (vf?.facebook !== false && sig.facebook);

  if (!hasSocial) return null;

  return (
    <div style={{ display: 'flex', gap: 12, fontSize: sig.fontSize, marginTop: 8 }}>
      {vf?.linkedin !== false && sig.linkedin && <a href={sig.linkedin} style={linkStyle(sig.linkColor)}>LinkedIn</a>}
      {vf?.twitter !== false && sig.twitter && <a href={sig.twitter} style={linkStyle(sig.linkColor)}>Twitter</a>}
      {vf?.instagram !== false && sig.instagram && <a href={sig.instagram} style={linkStyle(sig.linkColor)}>Instagram</a>}
      {vf?.facebook !== false && sig.facebook && <a href={sig.facebook} style={linkStyle(sig.linkColor)}>Facebook</a>}
    </div>
  );
};

// ==================== TEMPLATE STYLES ====================

interface TemplateStyles {
  container?: React.CSSProperties;
  photoPlaceholder?: React.CSSProperties;
  contentBlock?: React.CSSProperties;
}

// Dark mode color generator - auto-generates dark theme from light theme
function getDarkModeColors(sig: EmailSignature) {
  if (!sig.darkMode) return sig;

  // Convert light colors to dark equivalents
  const hexToHSL = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100; s /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const bgHSL = hexToHSL(sig.bgColor);
  const textHSL = hexToHSL(sig.textColor);
  const accentHSL = hexToHSL(sig.accentColor);

  return {
    ...sig,
    bgColor: hslToHex(bgHSL.h, bgHSL.s * 0.3, 15), // Very dark background
    textColor: hslToHex(textHSL.h, textHSL.s * 0.2, 90), // Light text
    linkColor: hslToHex(accentHSL.h, accentHSL.s, 70), // Bright accent for links
    accentColor: hslToHex(accentHSL.h, accentHSL.s, 65), // Bright accent
  };
}

function getTemplateStyles(templateId: string, sig: EmailSignature): TemplateStyles {
  // Apply dark mode colors if enabled
  const colors = sig.darkMode ? getDarkModeColors(sig) : sig;
  const bgColor = colors.bgColor;
  const textColor = colors.textColor;
  const accentColor = colors.accentColor;

  const base: TemplateStyles = {
    container: {},
    photoPlaceholder: {
      width: 80, height: 80, borderRadius: '50%',
      background: accentColor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 32, color: accentColor
    },
    contentBlock: {}
  };

  switch (templateId) {
    case 'minimal-clean':
      return {
        ...base,
        container: {
          ...base.container,
          background: sig.darkMode ? bgColor : `linear-gradient(to right, ${bgColor}, ${accentColor}05)`,
          borderLeft: `5px solid ${accentColor}`,
          borderRight: `1px solid ${accentColor}15`,
          borderTop: `1px solid ${accentColor}15`,
          borderBottom: `1px solid ${accentColor}15`,
          borderRadius: sig.borderRadius || 8,
          boxShadow: sig.darkMode ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.04)',
          padding: '20px 24px',
          transition: 'all 0.3s ease'
        }
      };
    case 'minimal-dark':
      return {
        ...base,
        container: {
          background: sig.darkMode ? bgColor : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: sig.darkMode ? textColor : '#f8fafc',
          border: `1px solid ${accentColor}40`,
          borderRadius: sig.borderRadius || 12,
          padding: '20px 24px',
          boxShadow: sig.darkMode ? `0 4px 20px ${accentColor}15` : '0 8px 24px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease'
        },
        photoPlaceholder: { ...base.photoPlaceholder, background: accentColor + '40', border: `3px solid ${accentColor}`, color: sig.darkMode ? textColor : '#f8fafc' }
      };
    case 'hierarchical-top':
      return {
        ...base,
        container: {
          ...base.container, textAlign: 'center' as const,
          background: sig.darkMode
            ? `linear-gradient(180deg, ${bgColor} 0%, ${bgColor}d0 100%)`
            : 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
          borderTop: `6px solid ${accentColor}`,
          borderBottom: `1px solid ${accentColor}20`,
          borderRadius: `${sig.borderRadius || 12}px ${sig.borderRadius || 12}px 8px 8px`,
          padding: '28px 32px 24px',
          boxShadow: sig.darkMode ? '0 4px 15px rgba(0,0,0,0.4)' : '0 4px 15px rgba(0,0,0,0.05)',
          position: 'relative' as const,
          transition: 'all 0.3s ease'
        },
        photoPlaceholder: { ...base.photoPlaceholder, width: 110, height: 110, border: `4px solid ${accentColor}`, borderRadius: '50%', boxShadow: `0 4px 10px ${accentColor}30` }
      };
    case 'hierarchical-sidebar':
      return {
        ...base,
        container: {
          ...base.container,
          background: sig.darkMode ? bgColor : '#ffffff',
          borderLeft: `8px solid ${accentColor}`,
          paddingLeft: 24,
          position: 'relative' as const
        },
        photoPlaceholder: { ...base.photoPlaceholder, border: `3px solid ${accentColor}`, boxShadow: `0 4px 12px ${accentColor}20` }
      };
    case 'visual-centered':
      return {
        ...base,
        container: {
          ...base.container, textAlign: 'center' as const,
          background: `radial-gradient(circle at center, ${bgColor} 0%, ${bgColor}d0 70%, ${accentColor}10 100%)`,
          border: `2px solid ${accentColor}40`,
          borderRadius: sig.borderRadius || 16,
          padding: '24px 32px'
        },
        photoPlaceholder: { ...base.photoPlaceholder, width: 110, height: 110, border: `4px double ${accentColor}`, borderRadius: '50%' },
        contentBlock: { border: `2px solid ${accentColor}60`, borderRadius: sig.borderRadius, display: 'inline-block', padding: '12px 24px', background: accentColor + '08' }
      };
    case 'visual-beside':
      return {
        ...base,
        container: {
          ...base.container,
          background: `linear-gradient(90deg, ${accentColor}08 0%, ${bgColor} 30%, ${bgColor} 70%, ${accentColor}08 100%)`,
          padding: 16
        },
        photoPlaceholder: { ...base.photoPlaceholder, border: `3px solid ${accentColor}`, boxShadow: `0 4px 12px ${accentColor}20` },
        contentBlock: { background: bgColor, padding: '12px 16px', borderRadius: 8, borderLeft: `4px solid ${accentColor}`, boxShadow: `0 2px 8px rgba(0,0,0,0.05)` }
      };
    case 'sectoral-blocks':
      return {
        ...base,
        container: {
          ...base.container,
          padding: 0,
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${accentColor}05 0%, ${bgColor} 100%)`
        },
        photoPlaceholder: { ...base.photoPlaceholder, border: `3px solid ${accentColor}`, boxShadow: `0 4px 12px ${accentColor}20` }
      };
    case 'sectoral-grid':
      return {
        ...base,
        container: {
          ...base.container,
          background: `linear-gradient(135deg, ${accentColor}08 0%, ${bgColor} 100%)`,
          padding: 16
        },
        photoPlaceholder: { ...base.photoPlaceholder, width: 90, height: 90, border: `3px solid ${accentColor}`, borderRadius: '8px' }
      };
    case 'corporate-strict':
      return {
        ...base,
        container: {
          ...base.container,
          background: bgColor,
          borderLeft: `8px solid ${accentColor}`,
          borderTop: `1px solid ${accentColor}30`,
          borderBottom: `1px solid ${accentColor}30`,
          fontFamily: 'Arial, sans-serif',
          padding: '16px 24px'
        },
        photoPlaceholder: { ...base.photoPlaceholder, borderRadius: 0, border: `2px solid ${accentColor}40` }
      };
    case 'corporate-modern':
      return {
        ...base,
        container: {
          ...base.container,
          background: `linear-gradient(90deg, ${accentColor}15 0%, ${bgColor} 50%, ${accentColor}08 100%)`,
          border: `1px solid ${accentColor}30`,
          boxShadow: sig.darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.08)',
          padding: '20px 24px',
          position: 'relative' as const
        },
        photoPlaceholder: { ...base.photoPlaceholder, border: `3px solid ${accentColor}`, boxShadow: `0 4px 12px ${accentColor}20` }
      };
    case 'elegant-serif':
      return {
        ...base,
        container: {
          ...base.container,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          textAlign: 'center' as const,
          background: bgColor,
          borderTop: `3px double ${accentColor}`,
          borderBottom: `3px double ${accentColor}`,
          letterSpacing: '1px',
          padding: '24px 32px'
        },
        photoPlaceholder: { ...base.photoPlaceholder, borderRadius: '4px', border: `2px solid ${accentColor}` }
      };
    case 'tech-startup':
      return {
        ...base,
        container: {
          ...base.container,
          background: `linear-gradient(135deg, ${accentColor}10 0%, ${bgColor} 40%, ${bgColor} 60%, ${accentColor}05 100%)`,
          borderTop: `4px solid ${accentColor}`,
          borderBottom: `1px solid ${accentColor}20`,
          position: 'relative' as const,
          overflow: 'hidden',
          fontFamily: "'SF Mono', 'Fira Code', monospace",
          padding: '20px 24px'
        },
        photoPlaceholder: { ...base.photoPlaceholder, borderRadius: '8px', border: `3px solid ${accentColor}`, boxShadow: `0 0 20px ${accentColor}30` }
      };
    case 'card-shadow':
      return {
        ...base,
        container: {
          ...base.container,
          background: bgColor,
          boxShadow: sig.darkMode
            ? '0 4px 20px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)'
            : '0 4px 20px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.06)',
          borderRadius: sig.borderRadius,
          padding: 24,
          transform: 'translateY(-2px)',
          transition: 'all 0.3s ease'
        }
      };
    case 'legal-formal':
      return {
        ...base,
        container: {
          ...base.container,
          background: bgColor,
          borderTop: `2px solid ${textColor}`,
          borderBottom: `2px solid ${textColor}`,
          fontFamily: 'Times New Roman, serif',
          textAlign: 'center' as const,
          padding: '24px 32px',
          letterSpacing: '2px'
        },
        photoPlaceholder: { ...base.photoPlaceholder, borderRadius: 0, border: `2px solid ${textColor}` }
      };
    case 'dark-gradient':
      return {
        ...base,
        container: {
          ...base.container,
          background: sig.darkMode
            ? `radial-gradient(circle at 30% 20%, ${accentColor}15 0%, ${bgColor} 50%, ${accentColor}08 100%)`
            : `linear-gradient(135deg, ${bgColor} 0%, ${accentColor}20 100%)`,
          color: textColor,
          borderTop: `3px solid ${accentColor}`,
          padding: '24px 32px'
        }
      };
    case 'neon-glow':
      return {
        ...base,
        container: {
          ...base.container,
          background: sig.darkMode ? bgColor : '#0a0a0a',
          border: `2px solid ${accentColor}`,
          boxShadow: `0 0 30px ${accentColor}40, 0 0 60px ${accentColor}20, inset 0 0 30px ${accentColor}10`,
          textShadow: `0 0 10px ${accentColor}60, 0 0 20px ${accentColor}40`,
          padding: '24px 32px'
        }
      };
    case 'minimalist-lines':
      return {
        ...base,
        container: {
          ...base.container,
          background: bgColor,
          borderTop: `2px solid ${accentColor}60`,
          borderBottom: `1px solid ${accentColor}30`,
          borderLeft: `1px solid ${accentColor}20`,
          borderRight: `1px solid ${accentColor}20`,
          padding: '20px 28px'
        }
      };
    case 'professional-badge':
      return {
        ...base,
        container: {
          ...base.container,
          background: `linear-gradient(135deg, ${accentColor}08 0%, ${bgColor} 100%)`,
          border: `1px solid ${accentColor}20`,
          borderRadius: sig.borderRadius,
          padding: '20px 24px',
          position: 'relative' as const
        },
        photoPlaceholder: { ...base.photoPlaceholder, width: 70, height: 70, border: `3px solid ${accentColor}`, borderRadius: '8px', boxShadow: `0 4px 12px ${accentColor}20` }
      };
    case 'color-block':
      return {
        ...base,
        container: {
          ...base.container,
          background: bgColor,
          borderLeft: `10px solid ${accentColor}`,
          borderRight: `1px solid ${accentColor}20`,
          borderTop: `1px solid ${accentColor}20`,
          borderBottom: `1px solid ${accentColor}20`,
          padding: '24px 28px',
          fontWeight: 600
        },
        photoPlaceholder: { ...base.photoPlaceholder, border: `3px solid ${accentColor}`, boxShadow: `0 4px 12px ${accentColor}20` }
      };
    case 'floating-island':
      return {
        ...base,
        container: {
          ...base.container,
          background: bgColor,
          boxShadow: sig.darkMode
            ? '0 20px 60px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.4)'
            : '0 20px 60px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.1)',
          borderRadius: sig.borderRadius,
          padding: 32,
          transform: 'translateY(-4px)'
        }
      };
    case 'inline-compact':
      return {
        ...base,
        container: {
          ...base.container,
          background: bgColor,
          borderLeft: `4px solid ${accentColor}`,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 13,
          lineHeight: 1.4,
        },
        photoPlaceholder: { ...base.photoPlaceholder, width: 32, height: 32, borderRadius: '4px', fontSize: 14 }
      };
    case 'banner-top':
      return {
        ...base,
        container: {
          ...base.container,
          background: bgColor,
          borderTop: `8px solid ${accentColor}`,
          borderRadius: `${sig.borderRadius}px ${sig.borderRadius}px 0 0`,
          padding: '24px 24px 20px',
          position: 'relative' as const,
        }
      };
    case 'split-two-tone':
      return {
        ...base,
        container: {
          ...base.container,
          background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor} 30%, ${bgColor} 30%, ${bgColor} 100%)`,
          borderRadius: sig.borderRadius,
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          position: 'relative' as const,
        }
      };
    default:
      return base;
  }
}

// ==================== GENERIC TEMPLATE RENDERER ====================

function renderGenericTemplate(
  sig: EmailSignature,
  templateId: string,
  elements: ElementMetrics[],
  dynamicContainerStyle: React.CSSProperties,
  layout: LayoutConfig
): React.ReactNode {
  const styles = getTemplateStyles(templateId, sig);
  const photoSize = styles.photoPlaceholder?.width || 80;
  const accentColor = sig.darkMode ? getDarkModeColors(sig).accentColor : sig.accentColor;

  // Inline Compact: Single line with separators
  if (templateId === 'inline-compact') {
    const separator = <span style={{ margin: '0 8px', color: accentColor + '40', fontSize: 10 }}>|</span>;
    return (
      <div style={{ ...dynamicContainerStyle, ...styles.container }}>
        {sig.logoConfig?.show && sig.logoConfig?.url && (
          <div style={{ marginRight: 8 }}><LogoImageComp sig={sig} /></div>
        )}
        {sig.photoUrl && (
          <div style={{ marginRight: 8 }}>
            <PhotoImage photoUrl={sig.photoUrl} size={32} borderColor={sig.accentColor} />
          </div>
        )}
        <div style={{ fontWeight: 600, color: sig.textColor, marginRight: 8 }}>{sig.name || 'Tu Nombre'}</div>
        {separator}
        {sig.title && <span style={{ color: sig.accentColor, marginRight: 8 }}>{sig.title}</span>}
        {separator}
        <div style={{ display: 'flex', gap: 12, fontSize: sig.fontSize }}>
          {renderContactBlock(sig)}
        </div>
        {separator}
        <div style={{ display: 'flex', gap: 8 }}>{renderSocialBlock(sig)}</div>
      </div>
    );
  }

  // Banner Top: Colored banner with content below
  if (templateId === 'banner-top') {
    return (
      <div style={{ ...dynamicContainerStyle, ...styles.container }}>
        <div style={{ position: 'absolute' as const, top: 0, left: 0, right: 0, height: 8, background: sig.accentColor }} />
        <div style={{ display: 'flex', paddingTop: 16, width: '100%' }}>
          {elements.map(element => {
            if (element.id === 'logo') return <LogoImageComp sig={sig} key="logo" />;
            if (element.id === 'photo') {
              return sig.photoUrl ? (
                <PhotoImage photoUrl={sig.photoUrl} size={80} borderColor={sig.accentColor} key="photo" />
              ) : null;
            }
            if (element.id === 'content') {
              return (
                <div key="content" style={{ flex: 1, paddingLeft: 20 }}>
                  {renderNameBlock(sig)}
                  {renderContactBlock(sig)}
                  {renderSocialBlock(sig)}
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    );
  }

  // Split Two-Tone: Left panel (accent) + Right panel (bg)
  if (templateId === 'split-two-tone') {
    return (
      <div style={{ ...dynamicContainerStyle, ...styles.container }}>
        <div style={{ display: 'flex', width: '100%', minHeight: 120 }}>
          {/* Left Panel - Accent Color */}
          <div style={{
            flex: '0 0 30%',
            background: sig.accentColor,
            color: sig.bgColor,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {sig.logoConfig?.show && sig.logoConfig?.url && <LogoImageComp sig={sig} />}
            {sig.photoUrl && (
              <PhotoImage photoUrl={sig.photoUrl} size={60} borderColor={sig.bgColor} />
            )}
            <div style={{ fontWeight: 600, fontSize: sig.fontSize + 2, marginTop: 8 }}>{sig.name || 'Tu Nombre'}</div>
          </div>
          {/* Right Panel - Background Color */}
          <div style={{
            flex: 1,
            background: sig.bgColor,
            padding: '20px 24px',
            color: sig.textColor
          }}>
            {renderContactBlock(sig)}
            {renderSocialBlock(sig)}
          </div>
        </div>
      </div>
    );
  }

  // Special cases for complex templates
  if (templateId === 'sectoral-blocks') {
    return (
      <div style={{ ...dynamicContainerStyle, ...styles.container }}>
        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1, padding: '16px 16px 8px', background: sig.textColor + '06' }}>
            {elements.find(e => e.id === 'photo') && (
              <div key="photo">
                {sig.photoUrl ? (
                  <PhotoImage photoUrl={sig.photoUrl} size={Number(photoSize)} borderColor={sig.accentColor} />
                ) : (
                  <div style={styles.photoPlaceholder}>
                    {(sig.name || 'J').charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ fontSize: sig.fontSize + 2, fontWeight: 'bold', color: sig.textColor, marginTop: 6 }}>{sig.name || 'Tu Nombre'}</div>
                {sig.title && <div style={{ fontSize: sig.fontSize, color: sig.accentColor }}>{sig.title}</div>}
              </div>
            )}
          </div>
           <div style={{ width: 4, background: sig.accentColor }} />
          <div style={{ flex: 1, padding: '16px 16px 8px', background: sig.textColor + '03' }}>
            {renderContactBlock(sig)}
          </div>
          <div style={{ width: 4, background: sig.accentColor }} />
          <div style={{ flex: 1, padding: '16px 16px 8px', background: sig.textColor + '06' }}>
            {sig.logoConfig?.show && sig.logoConfig?.url && (
              <div style={{ marginTop: 8 }}><LogoImageComp sig={sig} /></div>
            )}
            {!sig.logoConfig?.url && sig.company && (
              <div style={{ fontSize: sig.fontSize - 1, color: sig.textColor, fontWeight: 500 }}>{sig.company}</div>
            )}
          </div>
        </div>
        {renderSocialBlock(sig)}
      </div>
    );
  }

  if (templateId === 'sectoral-grid') {
    return (
      <div style={{ ...dynamicContainerStyle, ...styles.container }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ padding: 16, background: sig.accentColor + '15', borderRadius: sig.borderRadius, textAlign: 'center' }}>
            {sig.photoUrl ? (
              <PhotoImage photoUrl={sig.photoUrl} size={Number(photoSize)} borderColor={sig.accentColor} />
            ) : (
              <div style={styles.photoPlaceholder}>
                {(sig.name || 'J').charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ fontSize: sig.fontSize + 4, fontWeight: 'bold', color: sig.textColor, marginTop: 8 }}>{sig.name || 'Tu Nombre'}</div>
            {sig.title && <div style={{ fontSize: sig.fontSize, color: sig.accentColor }}>{sig.title}</div>}
          </div>
          <div style={{ padding: 16, background: sig.accentColor + '10', borderRadius: sig.borderRadius }}>
            {renderContactBlock(sig)}
          </div>
          <div style={{ padding: 16, background: sig.accentColor + '10', borderRadius: sig.borderRadius, gridColumn: 'span 2', textAlign: 'center' }}>
            {sig.company && <div style={{ fontSize: sig.fontSize, color: sig.textColor, fontWeight: 600 }}>{sig.company}</div>}
            {sig.logoConfig?.show && sig.logoConfig?.url && <div style={{ marginTop: 8 }}><LogoImageComp sig={sig} /></div>}
          </div>
        </div>
        {renderSocialBlock(sig)}
      </div>
    );
  }

  if (templateId === 'corporate-strict') {
    return (
      <div style={{ ...dynamicContainerStyle, ...styles.container }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Arial, sans-serif' }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'top', padding: '8px', width: Number(photoSize) + 16 }}>
                {sig.photoUrl ? (
                  <PhotoImage photoUrl={sig.photoUrl} size={Number(photoSize)} borderColor={sig.accentColor} />
                ) : (
                  <div style={styles.photoPlaceholder}>
                    {(sig.name || 'J').charAt(0).toUpperCase()}
                  </div>
                )}
              </td>
              <td style={{ verticalAlign: 'top', padding: '8px', borderLeft: `2px solid ${sig.accentColor}30` }}>
                {renderNameBlock(sig)}
                {renderContactBlock(sig)}
                {renderSocialBlock(sig)}
              </td>
              {sig.logoConfig?.show && sig.logoConfig?.url && (
                <td style={{ verticalAlign: 'top', padding: '8px', width: (sig.logoConfig?.width || 60) + 16, textAlign: 'right' }}>
                  <LogoImageComp sig={sig} />
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  // Minimal Clean: Elegant horizontal layout with vertical divider
  if (templateId === 'minimal-clean') {
    return (
      <div style={{ ...dynamicContainerStyle, ...styles.container }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {sig.photoUrl ? (
            <PhotoImage photoUrl={sig.photoUrl} size={Number(photoSize)} borderColor={sig.accentColor} />
          ) : (
            <div style={styles.photoPlaceholder}>
              {(sig.name || 'J').charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ width: 1, height: 80, background: `${sig.accentColor}20` }} />
          <div style={{ flex: 1 }}>
            {renderNameBlock(sig)}
            <div style={{ marginTop: 12 }}>
              {renderContactBlock(sig)}
            </div>
            {renderSocialBlock(sig)}
          </div>
          {sig.logoConfig?.show && sig.logoConfig?.url && (
            <div style={{ marginLeft: 'auto' }}><LogoImageComp sig={sig} /></div>
          )}
        </div>
      </div>
    );
  }

  // Minimal Dark: Glassmorphism effect with glowing accent
  if (templateId === 'minimal-dark') {
    const accentGlow = sig.darkMode ? `0 0 15px ${sig.accentColor}40` : `0 4px 15px ${sig.accentColor}20`;
    return (
      <div style={{ ...dynamicContainerStyle, ...styles.container }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ position: 'relative' }}>
            {sig.photoUrl ? (
              <PhotoImage photoUrl={sig.photoUrl} size={Number(photoSize)} borderColor={sig.accentColor} />
            ) : (
              <div style={{ ...styles.photoPlaceholder, boxShadow: accentGlow }}>
                {(sig.name || 'J').charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, background: '#10b981', borderRadius: '50%', border: `2px solid ${sig.bgColor}` }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              {renderNameBlock(sig)}
              {sig.logoConfig?.show && sig.logoConfig?.url && <LogoImageComp sig={sig} />}
            </div>
            <div style={{ height: 1, background: `linear-gradient(90deg, ${sig.accentColor}60, transparent)`, margin: '12px 0' }} />
            {renderContactBlock(sig)}
            <div style={{ marginTop: 8 }}>
              {renderSocialBlock(sig)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Hierarchical Top: Centered with professional hierarchy
  if (templateId === 'hierarchical-top') {
    return (
      <div style={{ ...dynamicContainerStyle, ...styles.container }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {sig.logoConfig?.show && sig.logoConfig?.url && (
            <div style={{ marginBottom: 20 }}><LogoImageComp sig={sig} /></div>
          )}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            {sig.photoUrl ? (
              <PhotoImage photoUrl={sig.photoUrl} size={100} borderColor={sig.accentColor} />
            ) : (
              <div style={{ ...styles.photoPlaceholder, width: 100, height: 100 }}>
                {(sig.name || 'J').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: sig.fontSize + 8, fontWeight: 'bold', color: sig.textColor, letterSpacing: '-0.5px' }}>
              {sig.name || 'Tu Nombre'}
            </div>
            {sig.title && (
              <div style={{ fontSize: sig.fontSize + 2, color: sig.accentColor, fontWeight: 500, marginTop: 2, textTransform: 'uppercase', letterSpacing: '1px' }}>
                {sig.title}
              </div>
            )}
          </div>
          <div style={{ width: 40, height: 2, background: sig.accentColor, marginBottom: 16 }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 24px', fontSize: sig.fontSize }}>
            {renderContactBlock(sig)}
          </div>
          <div style={{ marginTop: 16 }}>
            {renderSocialBlock(sig)}
          </div>
        </div>
      </div>
    );
  }

  // Generic rendering for remaining templates
  return (
    <div style={{ ...dynamicContainerStyle, ...styles.container }}>
      {elements.map(element => {
        if (element.id === 'logo') return <LogoImageComp sig={sig} key="logo" />;
        if (element.id === 'photo') {
          return sig.photoUrl ? (
            <PhotoImage photoUrl={sig.photoUrl} size={Number(photoSize)} borderColor={sig.accentColor} key="photo" />
          ) : (
            <div style={styles.photoPlaceholder} key="photo-placeholder">
              {(sig.name || 'J').charAt(0).toUpperCase()}
            </div>
          );
        }
        if (element.id === 'content') {
          return (
            <div key="content" style={{ ...(layout.justify === 'space-between' ? { borderLeft: `3px solid ${sig.accentColor}`, paddingLeft: 20 } : {}), ...styles.contentBlock }}>
              {renderNameBlock(sig)}
              {renderContactBlock(sig)}
              {renderSocialBlock(sig)}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

// ==================== MAIN RENDER FUNCTION ====================

export function renderFlexibleSignature(sig: EmailSignature, width: number, selectedTemplate?: string): React.ReactNode {
  // Apply dark mode colors if enabled
  const colors = sig.darkMode ? getDarkModeColors(sig) : sig;

  const containerStyle: React.CSSProperties = {
    width,
    maxWidth: '100%',
    padding: 24,
    background: colors.bgColor,
    fontFamily: colors.fontFamily,
    fontSize: colors.fontSize,
    borderRadius: colors.borderRadius,
    color: colors.textColor,
  };

  const templateId = selectedTemplate || '';

  // Usar LayoutEngine para cálculo inteligente
  const elements = buildElementList(colors);
  const layoutRequest = {
    containerWidth: width,
    elements,
    logoConfig: colors.logoConfig,
    sig: colors,
  };
  const layout = calculateLayout(layoutRequest);

  // Aplicar layout al container principal
  const dynamicContainerStyle: React.CSSProperties = {
    ...containerStyle,
    display: 'flex',
    flexDirection: layout.direction,
    alignItems: layout.alignment,
    justifyContent: layout.justify,
    gap: layout.gap,
    flexWrap: layout.wrap ? 'wrap' : 'nowrap',
  };

  // Renderizado usando GenericTemplateRenderer
  return renderGenericTemplate(colors, templateId, elements, dynamicContainerStyle, layout);
}

// ==================== TEMPLATES CONFIG ====================

export const signatureTemplates: SignatureTemplate[] = [
  {
    id: 'minimal-clean',
    name: 'Minimalista',
    description: 'Diseño limpio con foto de perfil y tipografía elegante',
    preview: '🟢👤🔵',
    config: { bgColor: '#ffffff', textColor: '#374151', linkColor: '#3b82f6', accentColor: '#3b82f6', borderRadius: 16 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'minimal',
  },
  {
    id: 'minimal-dark',
    name: 'Oscuro Premium',
    description: 'Fondo oscuro elegante con acentos azules',
    preview: '🌙👤✨',
    config: { bgColor: '#0f172a', textColor: '#e2e8f0', linkColor: '#60a5fa', accentColor: '#60a5fa', borderRadius: 16 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'right',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'premium',
  },
  {
    id: 'hierarchical-top',
    name: 'Corporativo Clásico',
    description: 'Logo centrado con jerarquía visual clara y gradiente sutil',
    preview: '🏢👤📊',
    config: { bgColor: '#f8fafc', textColor: '#1e293b', linkColor: '#0f766e', accentColor: '#0f766e', borderRadius: 16 },
    defaultLayout: 'centered',
    defaultLogoPosition: 'top',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'corporate',
  },
  {
    id: 'hierarchical-sidebar',
    name: 'Lateral Elegante',
    description: 'Barra lateral púrpura con información organizada',
    preview: '│👤│📞',
    config: { bgColor: '#faf5ff', textColor: '#334155', linkColor: '#7c3aed', accentColor: '#7c3aed', borderRadius: 12 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'corporate',
  },
  {
    id: 'visual-centered',
    name: 'Centrado Dorado',
    description: 'Logo grande centrado con diseño cálido y elegante',
    preview: '⬡👤⬡',
    config: { bgColor: '#fffbeb', textColor: '#78350f', linkColor: '#d97706', accentColor: '#d97706', borderRadius: 20 },
    defaultLayout: 'centered',
    defaultLogoPosition: 'top',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'creative',
  },
  {
    id: 'visual-beside',
    name: 'Visual Azul',
    description: 'Diseño lateral con tarjetas y acentos azules',
    preview: '👤▢▢',
    config: { bgColor: '#eff6ff', textColor: '#1e40af', linkColor: '#2563eb', accentColor: '#2563eb', borderRadius: 12 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'creative',
  },
  {
    id: 'sectoral-blocks',
    name: 'Bloques Profesional',
    description: 'Secciones diferenciadas con esquema verde',
    preview: '🟩│🟦│🟩',
    config: { bgColor: '#f0fdf4', textColor: '#166534', linkColor: '#16a34a', accentColor: '#16a34a', borderRadius: 10 },
    defaultLayout: 'vertical',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'corporate',
  },
  {
    id: 'sectoral-grid',
    name: 'Grid Púrpura',
    description: 'Grid de 2x2 con acentos púrpura modernos',
    preview: '▣▣',
    config: { bgColor: '#faf5ff', textColor: '#374151', linkColor: '#7c3aed', accentColor: '#7c3aed', borderRadius: 12 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'corporate',
  },
  {
    id: 'corporate-strict',
    name: 'Corporativo Navy',
    description: 'Diseño formal azul marino compatible con Outlook',
    preview: '🏛️📧📞',
    config: { bgColor: '#1e3a5f', textColor: '#ffffff', linkColor: '#93c5fd', accentColor: '#93c5fd', borderRadius: 0 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'corporate',
  },
  {
    id: 'corporate-modern',
    name: 'Moderno Azul',
    description: 'Corporativo con gradiente azul y sombras elegantes',
    preview: '▬═══',
    config: { bgColor: '#eff6ff', textColor: '#1e293b', linkColor: '#2563eb', accentColor: '#2563eb', borderRadius: 16 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'corporate',
  },
  {
    id: 'elegant-serif',
    name: 'Elegante Clásico',
    description: 'Tipografía serif con bordó y ornamento',
    preview: '📜👤✒️',
    config: { bgColor: '#fefefe', textColor: '#1a1a1a', linkColor: '#991b1b', accentColor: '#991b1b', borderRadius: 4 },
    defaultLayout: 'centered',
    defaultLogoPosition: 'top',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'elegant',
  },
  {
    id: 'tech-startup',
    name: 'Tech Verde',
    description: 'Diseño tech con verde vibrante y monospace',
    preview: '💻👤🚀',
    config: { bgColor: '#f0fdf4', textColor: '#14532d', linkColor: '#16a34a', accentColor: '#16a34a', borderRadius: 16 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'tech',
  },
  {
    id: 'card-shadow',
    name: 'Tarjeta Indigo',
    description: 'Tarjeta elevada con sombra suave e índigo',
    preview: '▣═══',
    config: { bgColor: '#eef2ff', textColor: '#312e81', linkColor: '#6366f1', accentColor: '#6366f1', borderRadius: 16 },
    defaultLayout: 'vertical',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'modern',
  },
  {
    id: 'legal-formal',
    name: 'Legal Clásico',
    description: 'Minimalista con serif para entornos legales',
    preview: '⚖️📝🏛️',
    config: { bgColor: '#ffffff', textColor: '#000000', linkColor: '#000000', accentColor: '#000000', borderRadius: 0 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'formal',
  },
  {
    id: 'dark-gradient',
    name: 'Dark Slate',
    description: 'Fondo oscuro con degradado gris azulado',
    preview: '🌑▒🌑',
    config: { bgColor: '#1e293b', textColor: '#f1f5f9', linkColor: '#38bdf8', accentColor: '#38bdf8', borderRadius: 16 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'premium',
  },
  {
    id: 'neon-glow',
    name: 'Neon Cyber',
    description: 'Efecto neón verde para diseño cyberpunk',
    preview: '💚🌟💚',
    config: { bgColor: '#0a0a0a', textColor: '#f1f5f9', linkColor: '#00ffaa', accentColor: '#00ffaa', borderRadius: 12 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'creative',
  },
  {
    id: 'minimalist-lines',
    name: 'Líneas Azul',
    description: 'Diseño limpio con líneas azules geométricas',
    preview: '─ ─ ─',
    config: { bgColor: '#ffffff', textColor: '#1e293b', linkColor: '#3b82f6', accentColor: '#3b82f6', borderRadius: 0 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'right',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'minimal',
  },
  {
    id: 'professional-badge',
    name: 'Badge Azul',
    description: 'Badge profesional con foto compacta y acento azul',
    preview: '🏷👤🎫',
    config: { bgColor: '#eff6ff', textColor: '#1e293b', linkColor: '#3b82f6', accentColor: '#3b82f6', borderRadius: 12 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'professional',
  },
  {
    id: 'color-block',
    name: 'Color Rojo',
    description: 'Bloques de color rojo bold para marcas fuertes',
    preview: '🔴░🔴',
    config: { bgColor: '#ffffff', textColor: '#1f2937', linkColor: '#dc2626', accentColor: '#dc2626', borderRadius: 8 },
    defaultLayout: 'vertical',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'bold',
  },
    {
    id: 'floating-island',
    name: 'Isla Púrpura',
    description: 'Tarjeta flotante con sombra profunda y púrpura',
    preview: '▣━▣',
    config: { bgColor: '#faf5ff', textColor: '#1f2937', linkColor: '#8b5cf6', accentColor: '#8b5cf6', borderRadius: 20 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'modern',
  },
  {
    id: 'inline-compact',
    name: 'Inline Compact',
    description: 'Diseño ultra compacto en una línea para footers',
    preview: '─┤─┤─',
    config: { bgColor: '#ffffff', textColor: '#374151', linkColor: '#6b7280', accentColor: '#3b82f6', borderRadius: 8 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'minimal',
  },
  {
    id: 'banner-top',
    name: 'Banner Header',
    description: 'Encabezado con banner de color y contenido horizontal',
    preview: '▀▀▀',
    config: { bgColor: '#ffffff', textColor: '#1e293b', linkColor: '#7c3aed', accentColor: '#7c3aed', borderRadius: 16 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'corporate',
  },
  {
    id: 'split-two-tone',
    name: 'Split Two-Tone',
    description: 'Fondo dividido con dos colores contrastantes',
    preview: '◧◧◧',
    config: { bgColor: '#f8fafc', textColor: '#1e293b', linkColor: '#3b82f6', accentColor: '#3b82f6', borderRadius: 12 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'modern',
  },
];

// ==================== DEFAULTS ====================

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
  photoUrl: '',
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
  darkMode: false,
  logoConfig: {
    url: '',
    width: 200,
    height: 60,
    lockAspectRatio: true,
    objectFit: 'contain',
    borderRadius: 0,
    padding: 0,
    position: 'left',
    alignment: 'center',
    altText: 'Company Logo',
    linkUrl: '',
    show: true,
    maxWidthForExport: 600,
    quality: 1,
  },
};

// ==================== LAYOUT PRESETS ====================

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
