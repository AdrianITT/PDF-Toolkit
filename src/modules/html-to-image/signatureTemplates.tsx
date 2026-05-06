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
  photoSize: number;
  logoSize: number;
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

const IconPhone = ({ color, iconStyle }: { color: string; iconStyle?: 'emoji' | 'text' | 'none' }) => {
  if (iconStyle === 'none') return <span style={{ marginRight: 4, color }}> </span>;
  if (iconStyle === 'text') return <span style={{ color, marginRight: 4, fontWeight: 600, fontSize: 11 }}>TEL</span>;
  return <span style={{ color, marginRight: 4 }}>📞</span>;
};
const IconEmail = ({ color, iconStyle }: { color: string; iconStyle?: 'emoji' | 'text' | 'none' }) => {
  if (iconStyle === 'none') return <span style={{ marginRight: 4, color }}> </span>;
  if (iconStyle === 'text') return <span style={{ color, marginRight: 4, fontWeight: 600, fontSize: 11 }}>EMAIL</span>;
  return <span style={{ color, marginRight: 4 }}>✉️</span>;
};
const IconWeb = ({ color, iconStyle }: { color: string; iconStyle?: 'emoji' | 'text' | 'none' }) => {
  if (iconStyle === 'none') return <span style={{ marginRight: 4, color }}> </span>;
  if (iconStyle === 'text') return <span style={{ color, marginRight: 4, fontWeight: 600, fontSize: 11 }}>WEB</span>;
  return <span style={{ color, marginRight: 4 }}>🌐</span>;
};
const IconLocation = ({ color, iconStyle }: { color: string; iconStyle?: 'emoji' | 'text' | 'none' }) => {
  if (iconStyle === 'none') return <span style={{ marginRight: 4, color }}> </span>;
  if (iconStyle === 'text') return <span style={{ color, marginRight: 4, fontWeight: 600, fontSize: 11 }}>DIR</span>;
  return <span style={{ color, marginRight: 4 }}>📍</span>;
};
const IconSkype = ({ color, iconStyle }: { color: string; iconStyle?: 'emoji' | 'text' | 'none' }) => {
  if (iconStyle === 'none') return <span style={{ marginRight: 4, color }}> </span>;
  if (iconStyle === 'text') return <span style={{ color, marginRight: 4, fontWeight: 600, fontSize: 11 }}>SKYPE</span>;
  return <span style={{ color, marginRight: 4 }}>💬</span>;
};

const LogoImageComp = ({ logoUrl, size = 80 }: { logoUrl: string; size?: number }) => (
  logoUrl && <img src={logoUrl} alt="Logo" style={{ width: size, height: size, objectFit: 'contain', borderRadius: 8 }} />
);

const PhotoImage = ({ photoUrl, size = 80, borderColor = '#2563eb' }: { photoUrl: string; size?: number; borderColor?: string }) => (
  photoUrl && <img src={photoUrl} alt="Foto" style={{ width: size, height: size, objectFit: 'cover', borderRadius: '50%', border: `3px solid ${borderColor}` }} />
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

const ContactBlock = ({ sig }: { sig: EmailSignature }) => {
  const vf = sig.visibleFields;
  const currentIconStyle = sig.iconStyle || 'emoji';
  return (
    <div style={{ fontSize: sig.fontSize }}>
      {vf?.email !== false && sig.email && (
        <div><IconEmail color={sig.linkColor} iconStyle={currentIconStyle} /><a href={`mailto:${sig.email}`} style={linkStyle(sig.linkColor)}>{sig.email}</a></div>
      )}
      {vf?.phone !== false && sig.phone && (
        <div style={{ marginTop: 4 }}><IconPhone color={sig.linkColor} iconStyle={currentIconStyle} /><a href={`tel:${sig.phone}`} style={linkStyle(sig.linkColor)}>{sig.phone}</a></div>
      )}
      {vf?.website !== false && sig.website && (
        <div style={{ marginTop: 4 }}><IconWeb color={sig.linkColor} iconStyle={currentIconStyle} /><a href={`https://${sig.website}`} style={linkStyle(sig.linkColor)} target="_blank">{sig.website}</a></div>
      )}
      {vf?.address !== false && sig.address && (
        <div style={{ marginTop: 4 }}><IconLocation color={sig.linkColor} iconStyle={currentIconStyle} />{sig.address}</div>
      )}
      {vf?.skype !== false && sig.skype && (
        <div style={{ marginTop: 4 }}><IconSkype color={sig.linkColor} iconStyle={currentIconStyle} />{sig.skype}</div>
      )}
    </div>
  );
};

const SocialBlock = ({ sig }: { sig: EmailSignature }) => {
  const vf = sig.visibleFields;
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

export function renderFlexibleSignature(sig: EmailSignature, width: number, selectedTemplate?: string): React.ReactNode {
  const containerStyle: React.CSSProperties = {
    width,
    maxWidth: '100%',
    padding: 24,
    background: sig.bgColor,
    fontFamily: sig.fontFamily,
    fontSize: sig.fontSize,
    borderRadius: sig.borderRadius,
  };

  const templateId = selectedTemplate || '';
  const photoSize = sig.photoSize || 80;
  const logoSize = sig.logoSize || 80;

  if (templateId === 'minimal-clean') {
    return (
      <div style={{ ...containerStyle, display: 'flex', gap: 24, alignItems: 'center' }}>
        {sig.photoUrl ? (
          <PhotoImage photoUrl={sig.photoUrl} size={photoSize} borderColor={sig.accentColor} />
        ) : (
          <div style={{ width: photoSize, height: photoSize, borderRadius: '50%', background: sig.accentColor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: photoSize / 2.5, color: sig.accentColor }}>
            {(sig.name || 'J').charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1, borderLeft: `3px solid ${sig.accentColor}`, paddingLeft: 20 }}>
          <NameBlock sig={sig} />
          <ContactBlock sig={sig} />
          <SocialBlock sig={sig} />
        </div>
        {sig.logoUrl && (
          <LogoImageComp logoUrl={sig.logoUrl} size={logoSize} />
        )}
      </div>
    );
  }

  if (templateId === 'minimal-dark') {
    return (
      <div style={{ ...containerStyle, display: 'flex', gap: 24, alignItems: 'center', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        <div style={{ flex: 1 }}>
          <NameBlock sig={sig} />
          <ContactBlock sig={sig} />
          <SocialBlock sig={sig} />
        </div>
        {sig.photoUrl ? (
          <PhotoImage photoUrl={sig.photoUrl} size={photoSize} borderColor={sig.accentColor} />
        ) : (
          <div style={{ width: photoSize, height: photoSize, borderRadius: '50%', background: sig.accentColor + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: photoSize / 2.5, color: sig.textColor, border: `3px solid ${sig.accentColor}` }}>
            {(sig.name || 'J').charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    );
  }

  if (templateId === 'hierarchical-top') {
    return (
      <div style={{ ...containerStyle, textAlign: 'center', background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' }}>
        {sig.logoUrl && (
          <div style={{ marginBottom: 12 }}>
            <LogoImageComp logoUrl={sig.logoUrl} size={logoSize} />
          </div>
        )}
        {sig.photoUrl ? (
          <div style={{ marginBottom: 16 }}>
            <PhotoImage photoUrl={sig.photoUrl} size={100} borderColor={sig.accentColor} />
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: sig.accentColor + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: sig.accentColor, margin: '0 auto', border: `4px solid ${sig.accentColor}` }}>
              {(sig.name || 'J').charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        <div style={{ padding: '0 20px' }}>
          <div style={{ fontSize: sig.fontSize + 12, fontWeight: 'bold', color: sig.textColor, lineHeight: 1.3 }}>
            {sig.name || 'Tu Nombre'}
          </div>
          {sig.title && (
            <div style={{ fontSize: sig.fontSize + 4, color: sig.accentColor, marginTop: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              {sig.title}
            </div>
          )}
          {sig.company && (
            <div style={{ fontSize: sig.fontSize, color: sig.textColor, fontWeight: 500, marginTop: 8, opacity: 0.8 }}>
              {sig.company}
            </div>
          )}
        </div>
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `2px solid ${sig.accentColor}`, display: 'inline-block', padding: '16px 32px' }}>
          <div style={{ fontSize: sig.fontSize, color: sig.textColor }}>
            {sig.email && <span style={{ color: sig.linkColor }}>{sig.email}</span>}
            {sig.email && sig.phone && <span style={{ color: sig.textColor, margin: '0 8px' }}>|</span>}
            {sig.phone && <span style={{ color: sig.linkColor }}>{sig.phone}</span>}
          </div>
          {sig.website && (
            <div style={{ fontSize: sig.fontSize, color: sig.linkColor, marginTop: 4 }}>{sig.website}</div>
          )}
        </div>
        {(sig.linkedin || sig.twitter) && (
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 16, fontSize: sig.fontSize - 1 }}>
            {sig.linkedin && <span style={{ color: sig.linkColor }}>LinkedIn</span>}
            {sig.twitter && <span style={{ color: sig.linkColor }}>Twitter</span>}
          </div>
        )}
      </div>
    );
  }

  // Plantilla 4 - Lateral (barra lateral con color acento)
  if (templateId === 'hierarchical-sidebar') {
    return (
      <div style={{ ...containerStyle, display: 'flex', gap: 0 }}>
        <div style={{ width: 6, background: sig.accentColor, borderRadius: `${sig.borderRadius}px 0 0 ${sig.borderRadius}px` }} />
        <div style={{ flex: 1, padding: '16px 20px' }}>
          {sig.photoUrl ? (
            <PhotoImage photoUrl={sig.photoUrl} size={photoSize} borderColor={sig.accentColor} />
          ) : (
            <div style={{ width: photoSize, height: photoSize, borderRadius: '50%', background: sig.accentColor + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: photoSize / 2.5, color: sig.accentColor, marginBottom: 8 }}>
              {(sig.name || 'J').charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ fontSize: sig.fontSize + 8, fontWeight: 'bold', color: sig.textColor, marginTop: 8 }}>
            {sig.name || 'Tu Nombre'}
          </div>
          {sig.title && (
            <div style={{ fontSize: sig.fontSize + 1, color: sig.accentColor, fontWeight: 500 }}>{sig.title}</div>
          )}
          {sig.company && (
            <div style={{ fontSize: sig.fontSize - 1, color: sig.textColor, opacity: 0.8, marginTop: 2 }}>{sig.company}</div>
          )}
        </div>
        <div style={{ flex: 1, padding: '16px 0', borderLeft: `1px solid ${sig.textColor}15` }}>
          <ContactBlock sig={sig} />
          <SocialBlock sig={sig} />
        </div>
        {sig.logoUrl && (
          <div style={{ padding: '16px 20px 16px 0', display: 'flex', alignItems: 'center' }}>
            <LogoImageComp logoUrl={sig.logoUrl} size={logoSize} />
          </div>
        )}
      </div>
    );
  }

  // Plantilla 5 - Centrado (diseño centrado con logo grande)
  if (templateId === 'visual-centered') {
    return (
      <div style={{ ...containerStyle, textAlign: 'center', background: `linear-gradient(135deg, ${sig.bgColor} 0%, ${sig.bgColor}dd 100%)` }}>
        {sig.logoUrl && (
          <div style={{ marginBottom: 12 }}>
            <LogoImageComp logoUrl={sig.logoUrl} size={logoSize} />
          </div>
        )}
        <div style={{ padding: '16px 24px', border: `2px solid ${sig.accentColor}`, borderRadius: sig.borderRadius, display: 'inline-block' }}>
          {sig.photoUrl ? (
            <PhotoImage photoUrl={sig.photoUrl} size={photoSize} borderColor={sig.accentColor} />
          ) : (
            <div style={{ width: photoSize, height: photoSize, borderRadius: '50%', background: sig.accentColor + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: photoSize / 2.5, color: sig.accentColor, margin: '0 auto', border: `3px solid ${sig.accentColor}` }}>
              {(sig.name || 'J').charAt(0).toUpperCase()}
            </div>
          )}
          <NameBlock sig={sig} />
          <ContactBlock sig={sig} />
        </div>
        <SocialBlock sig={sig} />
      </div>
    );
  }

  // Plantilla 6 - Visual Lateral (tarjetas internas)
  if (templateId === 'visual-beside') {
    return (
      <div style={{ ...containerStyle, display: 'flex', gap: 16, background: `linear-gradient(90deg, ${sig.bgColor} 0%, ${sig.bgColor}dd 100%)` }}>
        <div style={{ flexShrink: 0 }}>
          {sig.photoUrl ? (
            <PhotoImage photoUrl={sig.photoUrl} size={photoSize} borderColor={sig.accentColor} />
          ) : (
            <div style={{ width: photoSize, height: photoSize, borderRadius: '50%', background: sig.accentColor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: photoSize / 2.5, color: sig.accentColor, border: `3px solid ${sig.accentColor}` }}>
              {(sig.name || 'J').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ background: sig.textColor + '08', padding: '8px 12px', borderRadius: 6, borderLeft: `3px solid ${sig.accentColor}` }}>
            <NameBlock sig={sig} />
          </div>
          <div style={{ background: sig.textColor + '05', padding: '8px 12px', borderRadius: 6 }}>
            <ContactBlock sig={sig} />
          </div>
        </div>
        {sig.logoUrl && (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <LogoImageComp logoUrl={sig.logoUrl} size={logoSize} />
          </div>
        )}
      </div>
    );
  }

  // Plantilla 7 - Sectorial Bloques (secciones diferenciadas)
  if (templateId === 'sectoral-blocks') {
    return (
      <div style={{ ...containerStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1, padding: '16px 16px 8px', background: sig.textColor + '06' }}>
            {sig.photoUrl ? (
              <PhotoImage photoUrl={sig.photoUrl} size={50} borderColor={sig.accentColor} />
            ) : (
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: sig.accentColor + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: sig.accentColor }}>
                {(sig.name || 'J').charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ fontSize: sig.fontSize + 2, fontWeight: 'bold', color: sig.textColor, marginTop: 6 }}>{sig.name || 'Tu Nombre'}</div>
            {sig.title && <div style={{ fontSize: sig.fontSize, color: sig.accentColor }}>{sig.title}</div>}
          </div>
          <div style={{ width: 4, background: sig.accentColor }} />
          <div style={{ flex: 1, padding: '16px 16px 8px', background: sig.textColor + '03' }}>
            <ContactBlock sig={sig} />
          </div>
          <div style={{ width: 4, background: sig.accentColor }} />
          <div style={{ flex: 1, padding: '16px 16px 8px', background: sig.textColor + '06' }}>
            {sig.logoUrl ? (
              <LogoImageComp logoUrl={sig.logoUrl} size={logoSize} />
            ) : (
              sig.company && <div style={{ fontSize: sig.fontSize - 1, color: sig.textColor, fontWeight: 500 }}>{sig.company}</div>
            )}
          </div>
        </div>
        {(sig.linkedin || sig.twitter) && (
          <div style={{ padding: '8px 16px', background: sig.textColor + '03', display: 'flex', gap: 12, fontSize: sig.fontSize - 2 }}>
            {sig.linkedin && <span style={{ color: sig.linkColor }}>LinkedIn</span>}
            {sig.twitter && <span style={{ color: sig.linkColor }}>Twitter</span>}
          </div>
        )}
      </div>
    );
  }

  // Plantilla 8 - Sectorial Grid (2x2 grid layout)
  if (templateId === 'sectoral-grid') {
    return (
      <div style={{ ...containerStyle, background: `linear-gradient(135deg, ${sig.bgColor} 0%, ${sig.bgColor}ee 100%)` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ padding: 16, background: sig.accentColor + '15', borderRadius: sig.borderRadius, textAlign: 'center' }}>
            {sig.photoUrl ? (
              <PhotoImage photoUrl={sig.photoUrl} size={70} borderColor={sig.accentColor} />
            ) : (
              <div style={{ width: 70, height: 70, borderRadius: '50%', background: sig.accentColor + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: sig.accentColor, margin: '0 auto' }}>
                {(sig.name || 'J').charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ fontSize: sig.fontSize + 4, fontWeight: 'bold', color: sig.textColor, marginTop: 8 }}>{sig.name || 'Tu Nombre'}</div>
            {sig.title && <div style={{ fontSize: sig.fontSize, color: sig.accentColor }}>{sig.title}</div>}
          </div>
          <div style={{ padding: 16, background: sig.accentColor + '10', borderRadius: sig.borderRadius }}>
            <div style={{ fontSize: sig.fontSize - 1, color: sig.textColor }}>
              {sig.email && <div style={{ marginBottom: 4 }}>✉️ <span style={{ color: sig.linkColor }}>{sig.email}</span></div>}
              {sig.phone && <div style={{ marginBottom: 4 }}>📞 <span style={{ color: sig.linkColor }}>{sig.phone}</span></div>}
              {sig.website && <div>🌐 <span style={{ color: sig.linkColor }}>{sig.website}</span></div>}
            </div>
          </div>
          <div style={{ padding: 16, background: sig.accentColor + '10', borderRadius: sig.borderRadius, gridColumn: 'span 2', textAlign: 'center' }}>
            {sig.company && <div style={{ fontSize: sig.fontSize, color: sig.textColor, fontWeight: 600 }}>{sig.company}</div>}
            {sig.logoUrl && <div style={{ marginTop: 8 }}><LogoImageComp logoUrl={sig.logoUrl} size={logoSize} /></div>}
          </div>
        </div>
        <SocialBlock sig={sig} />
      </div>
    );
  }

  // Plantilla 9 - Corporate Strict (Outlook-compatible, table-based look)
  if (templateId === 'corporate-strict') {
    return (
      <div style={{ ...containerStyle, background: sig.bgColor, borderLeft: `6px solid ${sig.accentColor}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Arial, sans-serif' }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'top', padding: '8px', width: photoSize + 16 }}>
                {sig.photoUrl ? (
                  <PhotoImage photoUrl={sig.photoUrl} size={photoSize} borderColor={sig.accentColor} />
                ) : (
                  <div style={{ width: photoSize, height: photoSize, background: sig.accentColor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: photoSize / 2.5, color: sig.accentColor, fontWeight: 'bold' }}>
                    {(sig.name || 'J').charAt(0).toUpperCase()}
                  </div>
                )}
              </td>
              <td style={{ verticalAlign: 'top', padding: '8px', borderLeft: `2px solid ${sig.accentColor}30` }}>
                <NameBlock sig={sig} />
                <ContactBlock sig={sig} />
                <SocialBlock sig={sig} />
              </td>
              {sig.logoUrl && (
                <td style={{ verticalAlign: 'top', padding: '8px', width: logoSize + 16, textAlign: 'right' }}>
                  <LogoImageComp logoUrl={sig.logoUrl} size={logoSize} />
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  // Plantilla 10 - Corporate Modern (gradient with badges)
  if (templateId === 'corporate-modern') {
    return (
      <div style={{ ...containerStyle, background: `linear-gradient(90deg, ${sig.accentColor}15 0%, ${sig.bgColor} 100%)`, border: `1px solid ${sig.accentColor}30` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {sig.photoUrl ? (
            <PhotoImage photoUrl={sig.photoUrl} size={photoSize} borderColor={sig.accentColor} />
          ) : (
            <div style={{ width: photoSize, height: photoSize, borderRadius: '50%', background: sig.accentColor + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: photoSize / 2.5, color: sig.accentColor, border: `3px solid ${sig.accentColor}` }}>
              {(sig.name || 'J').charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <NameBlock sig={sig} />
            <ContactBlock sig={sig} />
          </div>
          {sig.logoUrl && <LogoImageComp logoUrl={sig.logoUrl} size={logoSize} />}
        </div>
        <SocialBlock sig={sig} />
      </div>
    );
  }

  // Plantilla 11 - Elegant Serif (serif typography with decorative ornament)
  if (templateId === 'elegant-serif') {
    return (
      <div style={{ ...containerStyle, background: sig.bgColor, fontFamily: "'Georgia', 'Times New Roman', serif", textAlign: 'center' }}>
        <div style={{ borderTop: `3px double ${sig.accentColor}`, paddingTop: 16, marginBottom: 16 }}>
          {sig.photoUrl ? (
            <PhotoImage photoUrl={sig.photoUrl} size={photoSize} borderColor={sig.accentColor} />
          ) : (
            <div style={{ width: photoSize, height: photoSize, borderRadius: '50%', background: sig.accentColor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: photoSize / 2.5, color: sig.accentColor, margin: '0 auto', border: `2px double ${sig.accentColor}` }}>
              {(sig.name || 'J').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <NameBlock sig={sig} />
        <ContactBlock sig={sig} />
        <SocialBlock sig={sig} />
      </div>
    );
  }

  // Plantilla 12 - Tech Startup (vibrant colors with geometric shapes)
  if (templateId === 'tech-startup') {
    return (
      <div style={{ ...containerStyle, background: sig.bgColor, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: sig.accentColor + '20', borderRadius: '50%', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 80, height: 80, background: sig.accentColor + '15', borderRadius: 16, transform: 'rotate(45deg)', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 20, alignItems: 'center' }}>
          {sig.photoUrl ? (
            <PhotoImage photoUrl={sig.photoUrl} size={photoSize} borderColor={sig.accentColor} />
          ) : (
            <div style={{ width: photoSize, height: photoSize, background: sig.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: photoSize / 2.5, color: '#fff', borderRadius: 12 }}>
              {(sig.name || 'J').charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <NameBlock sig={sig} />
          </div>
          {sig.logoUrl && <LogoImageComp logoUrl={sig.logoUrl} size={logoSize} />}
        </div>
        <ContactBlock sig={sig} />
        <SocialBlock sig={sig} />
      </div>
    );
  }

  // Plantilla 13 - Card Shadow (elevated content with soft shadow)
  if (templateId === 'card-shadow') {
    return (
      <div style={{ ...containerStyle, background: 'transparent', padding: 0 }}>
        <div style={{ background: sig.bgColor, borderRadius: sig.borderRadius, boxShadow: '0 4px 20px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.06)', padding: 24 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            {sig.photoUrl ? (
              <PhotoImage photoUrl={sig.photoUrl} size={photoSize} borderColor={sig.accentColor} />
            ) : (
              <div style={{ width: photoSize, height: photoSize, borderRadius: 12, background: sig.accentColor + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: photoSize / 2.5, color: sig.accentColor, fontWeight: 'bold' }}>
                {(sig.name || 'J').charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <NameBlock sig={sig} />
            </div>
            {sig.logoUrl && <LogoImageComp logoUrl={sig.logoUrl} size={logoSize} />}
          </div>
          <ContactBlock sig={sig} />
          <SocialBlock sig={sig} />
        </div>
      </div>
    );
  }

  // Plantilla 14 - Legal Formal (extreme minimalist, no decorations)
  if (templateId === 'legal-formal') {
    return (
      <div style={{ ...containerStyle, background: sig.bgColor, borderBottom: `2px solid ${sig.textColor}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <NameBlock sig={sig} />
          </div>
          {sig.logoUrl && <LogoImageComp logoUrl={sig.logoUrl} size={logoSize} />}
        </div>
        <ContactBlock sig={sig} />
        <SocialBlock sig={sig} />
      </div>
    );
  }

  // Plantilla 15 - Dark Gradient (premium dark with gradient effect)
  if (templateId === 'dark-gradient') {
    return (
      <div style={{ ...containerStyle, background: `linear-gradient(135deg, ${sig.bgColor} 0%, #1e293b 100%)`, color: sig.textColor }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {sig.photoUrl ? (
            <PhotoImage photoUrl={sig.photoUrl} size={photoSize} borderColor={sig.accentColor} />
          ) : (
            <div style={{ width: photoSize, height: photoSize, borderRadius: '50%', border: `3px solid ${sig.accentColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: photoSize / 2.5, color: sig.accentColor }}>
              {(sig.name || 'J').charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <NameBlock sig={sig} />
          </div>
          {sig.logoUrl && <LogoImageComp logoUrl={sig.logoUrl} size={logoSize} />}
        </div>
        <ContactBlock sig={sig} />
        <SocialBlock sig={sig} />
      </div>
    );
  }

  // Plantilla 16 - Neon Glow (neon effect for creative professionals)
  if (templateId === 'neon-glow') {
    return (
      <div style={{ ...containerStyle, background: '#0a0a0a', border: `2px solid ${sig.accentColor}`, boxShadow: `0 0 20px ${sig.accentColor}40, inset 0 0 20px ${sig.accentColor}10` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {sig.photoUrl ? (
            <div style={{ padding: 3, border: `2px solid ${sig.accentColor}`, borderRadius: '50%', boxShadow: `0 0 10px ${sig.accentColor}` }}>
              <PhotoImage photoUrl={sig.photoUrl} size={photoSize} borderColor={sig.accentColor} />
            </div>
          ) : (
            <div style={{ width: photoSize, height: photoSize, borderRadius: '50%', border: `2px solid ${sig.accentColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: photoSize / 2.5, color: sig.accentColor, boxShadow: `0 0 15px ${sig.accentColor}60` }}>
              {(sig.name || 'J').charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <NameBlock sig={sig} />
          </div>
        </div>
        <ContactBlock sig={sig} />
        <SocialBlock sig={sig} />
      </div>
    );
  }

  // Plantilla 16 - Neon Glow (neon effect for creative professionals)
  if (templateId === 'neon-glow') {
    return (
      <div style={{ ...containerStyle, background: '#0a0a0a', border: `2px solid ${sig.accentColor}`, boxShadow: `0 0 20px ${sig.accentColor}40, inset 0 0 20px ${sig.accentColor}10` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {sig.photoUrl ? (
            <div style={{ padding: 3, border: `2px solid ${sig.accentColor}`, borderRadius: '50%', boxShadow: `0 0 10px ${sig.accentColor}` }}>
              <PhotoImage photoUrl={sig.photoUrl} size={65} borderColor={sig.accentColor} />
            </div>
          ) : (
            <div style={{ width: 70, height: 70, borderRadius: '50%', border: `2px solid ${sig.accentColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: sig.accentColor, boxShadow: `0 0 15px ${sig.accentColor}60` }}>
              {(sig.name || 'J').charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: sig.fontSize + 10, fontWeight: 'bold', color: sig.accentColor, textShadow: `0 0 10px ${sig.accentColor}` }}>{sig.name || 'Tu Nombre'}</div>
            {sig.title && <div style={{ fontSize: sig.fontSize + 2, color: sig.textColor, fontWeight: 300, letterSpacing: 2 }}>{sig.title}</div>}
            {sig.company && <div style={{ fontSize: sig.fontSize, color: sig.textColor, opacity: 0.8 }}>{sig.company}</div>}
          </div>
        </div>
        <div style={{ marginTop: 16, fontSize: sig.fontSize, color: sig.textColor, display: 'flex', gap: 20 }}>
          {sig.email && <span style={{ color: sig.accentColor }}>✉ {sig.email}</span>}
          {sig.phone && <span>{sig.phone}</span>}
        </div>
        {(sig.linkedin || sig.twitter || sig.instagram) && (
          <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: sig.fontSize - 1 }}>
            {sig.linkedin && <span style={{ color: sig.accentColor }}>LinkedIn</span>}
            {sig.twitter && <span style={{ color: sig.accentColor }}>Twitter</span>}
            {sig.instagram && <span style={{ color: sig.accentColor }}>Instagram</span>}
          </div>
        )}
      </div>
    );
  }

  // Plantilla 17 - Minimalist Lines (clean with geometric lines)
  if (templateId === 'minimalist-lines') {
    return (
      <div style={{ ...containerStyle, background: sig.bgColor }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ width: 40, height: 3, background: sig.accentColor, marginBottom: 12 }} />
            <NameBlock sig={sig} />
            <div style={{ width: 40, height: 1, background: sig.textColor + '30', margin: '12px 0' }} />
            <ContactBlock sig={sig} />
          </div>
          {sig.photoUrl ? (
            <PhotoImage photoUrl={sig.photoUrl} size={photoSize} borderColor={sig.accentColor} />
          ) : (
            sig.logoUrl && <LogoImageComp logoUrl={sig.logoUrl} size={logoSize} />
          )}
        </div>
        <SocialBlock sig={sig} />
      </div>
    );
  }

  // Plantilla 18 - Professional Badge (compact with badge-style elements)
  if (templateId === 'professional-badge') {
    return (
      <div style={{ ...containerStyle, background: `linear-gradient(135deg, ${sig.accentColor}08 0%, ${sig.bgColor} 100%)`, border: `1px solid ${sig.accentColor}20`, borderRadius: sig.borderRadius }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {sig.photoUrl ? (
            <PhotoImage photoUrl={sig.photoUrl} size={photoSize} borderColor={sig.accentColor} />
          ) : (
            sig.logoUrl && <LogoImageComp logoUrl={sig.logoUrl} size={logoSize} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: sig.fontSize + 6, fontWeight: 'bold', color: sig.textColor }}>{sig.name || 'Tu Nombre'}</span>
              {sig.title && <span style={{ background: sig.accentColor, color: '#fff', fontSize: sig.fontSize - 2, padding: '2px 8px', borderRadius: 4 }}>{sig.title}</span>}
            </div>
            {sig.company && <div style={{ fontSize: sig.fontSize, color: sig.textColor, opacity: 0.8 }}>{sig.company}</div>}
            <ContactBlock sig={sig} />
          </div>
        </div>
      </div>
    );
  }

  // Plantilla 19 - Color Block (bold color sections)
  if (templateId === 'color-block') {
    return (
      <div style={{ ...containerStyle, background: sig.bgColor, padding: 0, overflow: 'hidden', borderRadius: sig.borderRadius }}>
        <div style={{ background: sig.accentColor, padding: '16px 24px', color: '#fff' }}>
          <NameBlock sig={sig} />
        </div>
        <div style={{ padding: 24 }}>
          {sig.company && <div style={{ fontSize: sig.fontSize, color: sig.textColor, fontWeight: 600, marginBottom: 12 }}>{sig.company}</div>}
          <ContactBlock sig={sig} />
          <SocialBlock sig={sig} />
        </div>
      </div>
    );
  }

  // Plantilla 20 - Floating Island (detached card with large shadow)
  if (templateId === 'floating-island') {
    return (
      <div style={{ ...containerStyle, background: 'transparent', padding: 0 }}>
        <div style={{ background: sig.bgColor, borderRadius: sig.borderRadius, boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.1)', padding: 32 }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 20 }}>
            {sig.photoUrl ? (
              <PhotoImage photoUrl={sig.photoUrl} size={photoSize} borderColor={sig.accentColor} />
            ) : (
              <div style={{ width: photoSize, height: photoSize, borderRadius: '50%', background: `linear-gradient(135deg, ${sig.accentColor}40, ${sig.accentColor}20)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: photoSize / 2.5, color: sig.accentColor, border: `4px solid ${sig.accentColor}` }}>
                {(sig.name || 'J').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <NameBlock sig={sig} />
            </div>
          </div>
          <ContactBlock sig={sig} />
          <SocialBlock sig={sig} />
        </div>
      </div>
    );
  }

  const order = sig.elementOrder.length > 0 ? sig.elementOrder : ['name', 'contact', 'social'];
  
  const flexDirection = sig.layout === 'horizontal' ? 'row' : 'column';
  const justifyContent = sig.layout === 'centered' ? 'center' : (sig.logoPosition === 'right' ? 'flex-end' : 'flex-start');
  const textAlign = sig.layout === 'centered' || sig.logoPosition === 'center' ? 'center' as const : 'left' as const;

  if (sig.logoPosition === 'top' || sig.logoPosition === 'center') {
    return (
      <div style={{ ...containerStyle, textAlign }}>
        {sig.logoUrl && (
          <div style={{ marginBottom: 16, textAlign: 'center' }}>
            <LogoImageComp logoUrl={sig.logoUrl} size={logoSize} />
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
          <LogoImageComp logoUrl={sig.logoUrl} size={logoSize} />
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
          <LogoImageComp logoUrl={sig.logoUrl} size={logoSize} />
        </div>
      )}
    </div>
  );
}

export const signatureTemplates: SignatureTemplate[] = [
  {
    id: 'minimal-clean',
    name: 'Minimalista',
    description: 'Diseño limpio con foto de perfil y tipografía elegante',
    preview: '🟢👤🔵',
    config: { bgColor: '#ffffff', textColor: '#2d2d2d', linkColor: '#2563eb', accentColor: '#2563eb', borderRadius: 12 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'minimal',
  },
  {
    id: 'minimal-dark',
    name: 'Oscuro',
    description: 'Fondo oscuro elegante con foto de perfil y texto claro',
    preview: '⚫👤⬛',
    config: { bgColor: '#1a1a2e', textColor: '#e5e5e5', linkColor: '#60a5fa', accentColor: '#60a5fa', borderRadius: 16 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'right',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'premium',
  },
  {
    id: 'hierarchical-top',
    name: 'Corporativo',
    description: 'Logo centrado arriba con foto de perfil y jerarquía visual clara',
    preview: '⬜👤⬜',
    config: { bgColor: '#f8fafc', textColor: '#1e293b', linkColor: '#0f766e', accentColor: '#0f766e', borderRadius: 16 },
    defaultLayout: 'centered',
    defaultLogoPosition: 'top',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'corporate',
  },
  {
    id: 'hierarchical-sidebar',
    name: 'Lateral',
    description: 'Barra lateral accent con información organizada',
    preview: '│👤│☎',
    config: { bgColor: '#ffffff', textColor: '#334155', linkColor: '#7c3aed', accentColor: '#7c3aed', borderRadius: 8 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
    category: 'corporate',
  },
  {
    id: 'visual-centered',
    name: 'Centrado',
    description: 'Logo grande centrado con diseño simétrico',
    preview: '⬡👤⬡',
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
    preview: '👤▢▢',
    config: { bgColor: '#f0f9ff', textColor: '#0c4a6e', linkColor: '#0284c7', accentColor: '#0284c7', borderRadius: 12 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
  },
  {
    id: 'sectoral-blocks',
    name: 'Sectorial Bloques',
    description: 'Secciones diferenciadas con colores alternados',
    preview: '▢│▢│▢',
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
  {
    id: 'neon-glow',
    name: 'Neon Glow',
    description: 'Efecto neón para creativos y tech',
    preview: '✦✦✦',
    config: { bgColor: '#0a0a0a', textColor: '#f1f5f9', linkColor: '#00ffaa', accentColor: '#00ffaa', borderRadius: 12 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
  },
  {
    id: 'minimalist-lines',
    name: 'Líneas Minimalistas',
    description: 'Diseño ultra limpio con líneas geométricas',
    preview: '─ ─ ─',
    config: { bgColor: '#ffffff', textColor: '#1f2937', linkColor: '#6b7280', accentColor: '#3b82f6', borderRadius: 0 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'right',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
  },
  {
    id: 'professional-badge',
    name: 'Badge Profesional',
    description: 'Badges de identificación y foto compacta',
    preview: '🏷👤',
    config: { bgColor: '#f8fafc', textColor: '#1e293b', linkColor: '#3b82f6', accentColor: '#3b82f6', borderRadius: 10 },
    defaultLayout: 'horizontal',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
  },
  {
    id: 'color-block',
    name: 'Color Block',
    description: 'Bloques de color bold para marcas fuertes',
    preview: '█░█',
    config: { bgColor: '#ffffff', textColor: '#1f2937', linkColor: '#dc2626', accentColor: '#dc2626', borderRadius: 8 },
    defaultLayout: 'vertical',
    defaultLogoPosition: 'left',
    formSections: ['basic', 'contact', 'social', 'style', 'structure'],
  },
  {
    id: 'floating-island',
    name: 'Isla Flotante',
    description: 'Tarjeta elevada con sombra profunda',
    preview: '▣━▣',
    config: { bgColor: '#ffffff', textColor: '#1f2937', linkColor: '#8b5cf6', accentColor: '#8b5cf6', borderRadius: 20 },
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
  photoSize: 80,
  logoSize: 60,
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