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
}

export interface SignatureTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  config: Pick<EmailSignature, 'bgColor' | 'textColor' | 'linkColor' | 'accentColor' | 'borderRadius'>;
  render: (sig: EmailSignature, previewMode: 'desktop' | 'mobile', width: number) => React.ReactNode;
  formSections: ('basic' | 'contact' | 'social' | 'style')[];
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
const IconLinkedIn = ({ color }: { color: string }) => (
  <span style={{ color, marginRight: 4 }}>💼</span>
);
const IconTwitter = ({ color }: { color: string }) => (
  <span style={{ color, marginRight: 4 }}>𝕏</span>
);
const IconSkype = ({ color }: { color: string }) => (
  <span style={{ color, marginRight: 4 }}>💬</span>
);


export const signatureTemplates: SignatureTemplate[] = [
  {
    id: 'minimal-clean',
    name: 'Minimalista Limpio',
    description: 'Diseño limpio con espacio amplio y tipografía elegante',
    preview: '⬜═══',
    config: { bgColor: '#ffffff', textColor: '#2d2d2d', linkColor: '#2563eb', accentColor: '#2563eb', borderRadius: 0 },
    formSections: ['basic', 'contact', 'social', 'style'],
    render: (sig, _, w) => (
      <div style={{
        width: w, maxWidth: '100%', padding: 32, background: sig.bgColor, fontFamily: 'Georgia, serif',
      }}>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: sig.textColor, letterSpacing: '-0.5px' }}>
          {sig.name || 'Tu Nombre'}
        </div>
        <div style={{ fontSize: 14, color: sig.textColor, opacity: 0.7, marginTop: 4 }}>
          {sig.title || 'Tu Cargo'}
        </div>
        <div style={{ marginTop: 24, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {sig.email && <span style={{ fontSize: 13 }}><IconEmail color={sig.linkColor} /><a href={`mailto:${sig.email}`} style={linkStyle(sig.linkColor)}>{sig.email}</a></span>}
          {sig.phone && <span style={{ fontSize: 13 }}><IconPhone color={sig.linkColor} /><a href={`tel:${sig.phone}`} style={linkStyle(sig.linkColor)}>{sig.phone}</a></span>}
          {sig.website && <span style={{ fontSize: 13 }}><IconWeb color={sig.linkColor} /><a href={`https://${sig.website}`} style={linkStyle(sig.linkColor)} target="_blank">{sig.website}</a></span>}
        </div>
        {sig.company && <div style={{ marginTop: 16, fontSize: 13, color: sig.textColor, fontStyle: 'italic' }}>{sig.company}</div>}
        {(sig.linkedin || sig.twitter) && (
          <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
            {sig.linkedin && <a href={sig.linkedin} style={linkStyle(sig.linkColor)}><IconLinkedIn color={sig.linkColor} />LinkedIn</a>}
            {sig.twitter && <a href={sig.twitter} style={linkStyle(sig.linkColor)}><IconTwitter color={sig.linkColor} />Twitter</a>}
          </div>
        )}
      </div>
    ),
  },
  {
    id: 'minimal-dark',
    name: 'Minimalista Oscuro',
    description: 'Fondo oscuro elegante con texto claro',
    preview: '⬛═══',
    config: { bgColor: '#1a1a1a', textColor: '#e5e5e5', linkColor: '#60a5fa', accentColor: '#60a5fa', borderRadius: 0 },
    formSections: ['basic', 'contact', 'social', 'style'],
    render: (sig, _, w) => (
      <div style={{
        width: w, maxWidth: '100%', padding: 32, background: sig.bgColor, fontFamily: "'Courier New', monospace",
      }}>
        <div style={{ borderBottom: `2px solid ${sig.accentColor}`, paddingBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: sig.textColor }}>
            {sig.name || 'Tu Nombre'}
          </div>
          <div style={{ fontSize: 13, color: sig.textColor, opacity: 0.6, marginTop: 4 }}>
            {sig.title || 'Tu Cargo'} {sig.company && `· ${sig.company}`}
          </div>
        </div>
        <div style={{ marginTop: 20, fontSize: 12 }}>
          {sig.email && <div>✉ {sig.email}</div>}
          {sig.phone && <div>📞 {sig.phone}</div>}
          {sig.website && <div>🌐 {sig.website}</div>}
          {sig.address && <div>📍 {sig.address}</div>}
        </div>
        {(sig.linkedin || sig.twitter) && (
          <div style={{ marginTop: 16, fontSize: 12, opacity: 0.8 }}>
            {sig.linkedin && <span>· <a href={sig.linkedin} style={linkStyle(sig.linkColor)}>LinkedIn</a></span>}
            {sig.twitter && <span> · <a href={sig.twitter} style={linkStyle(sig.linkColor)}>Twitter</a></span>}
          </div>
        )}
      </div>
    ),
  },
  {
    id: 'hierarchical-top',
    name: 'Jerárquico Superior',
    description: 'Logo centrado arriba con jerarquía visual clara',
    preview: '◻👔◻',
    config: { bgColor: '#f8fafc', textColor: '#1e293b', linkColor: '#0f766e', accentColor: '#0f766e', borderRadius: 8 },
    formSections: ['basic', 'contact', 'social', 'style'],
    render: (sig, _, w) => (
      <div style={{
        width: w, maxWidth: '100%', padding: 24, background: sig.bgColor, borderRadius: sig.borderRadius,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' as const,
      }}>
        {sig.logoUrl && (
          <img src={sig.logoUrl} alt="Logo" style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: sig.borderRadius }} />
        )}
        <div style={{ marginTop: 16, borderBottom: `3px solid ${sig.accentColor}`, display: 'inline-block', paddingBottom: 8 }}>
          <div style={{ fontSize: 22, fontWeight: 'bold', color: sig.textColor }}>{sig.name || 'Tu Nombre'}</div>
          <div style={{ fontSize: 14, color: sig.accentColor, marginTop: 4 }}>{sig.title || 'Tu Cargo'}</div>
        </div>
        {sig.company && <div style={{ marginTop: 12, fontSize: 13, color: sig.textColor, fontWeight: 600 }}>{sig.company}</div>}
        <div style={{ marginTop: 16, fontSize: 13, color: sig.textColor }}>
          {sig.email && <div><a href={`mailto:${sig.email}`} style={linkStyle(sig.linkColor)}>{sig.email}</a></div>}
          {sig.phone && <div style={{ marginTop: 4 }}><a href={`tel:${sig.phone}`} style={linkStyle(sig.linkColor)}>{sig.phone}</a></div>}
          {sig.website && <div style={{ marginTop: 4 }}><a href={`https://${sig.website}`} style={linkStyle(sig.linkColor)} target="_blank">{sig.website}</a></div>}
        </div>
        {(sig.linkedin || sig.twitter) && (
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 16 }}>
            {sig.linkedin && <a href={sig.linkedin} style={linkStyle(sig.linkColor)}>LinkedIn</a>}
            {sig.twitter && <a href={sig.twitter} style={linkStyle(sig.linkColor)}>Twitter</a>}
          </div>
        )}
      </div>
    ),
  },
  {
    id: 'hierarchical-sidebar',
    name: 'Jerárquico Lateral',
    description: 'Barra lateral accent con información organizada',
    preview: '▌│││',
    config: { bgColor: '#ffffff', textColor: '#334155', linkColor: '#7c3aed', accentColor: '#7c3aed', borderRadius: 0 },
    formSections: ['basic', 'contact', 'social', 'style'],
    render: (sig, _, w) => (
      <div style={{ width: w, maxWidth: '100%', padding: 0, background: sig.bgColor, display: 'flex', overflow: 'hidden', borderRadius: sig.borderRadius }}>
        <div style={{ width: 4, background: sig.accentColor, flexShrink: 0 }} />
        <div style={{ padding: 24 }}>
          {sig.logoUrl && <img src={sig.logoUrl} alt="Logo" style={{ width: 60, height: 60, objectFit: 'contain' }} />}
          <div style={{ fontSize: 20, fontWeight: 'bold', color: sig.textColor, marginTop: 16 }}>{sig.name || 'Tu Nombre'}</div>
          <div style={{ fontSize: 14, color: sig.accentColor, marginTop: 4 }}>{sig.title || 'Tu Cargo'}</div>
          {sig.company && <div style={{ fontSize: 13, color: sig.textColor, fontWeight: 600, marginTop: 8 }}>{sig.company}</div>}
          <div style={{ marginTop: 16, fontSize: 13, borderTop: `1px solid ${sig.accentColor}30`, paddingTop: 12 }}>
            {sig.email && <div><IconEmail color={sig.linkColor} /><a href={`mailto:${sig.email}`} style={linkStyle(sig.linkColor)}>{sig.email}</a></div>}
            {sig.phone && <div style={{ marginTop: 6 }}><IconPhone color={sig.linkColor} /><a href={`tel:${sig.phone}`} style={linkStyle(sig.linkColor)}>{sig.phone}</a></div>}
            {sig.website && <div style={{ marginTop: 6 }}><IconWeb color={sig.linkColor} /><a href={`https://${sig.website}`} style={linkStyle(sig.linkColor)} target="_blank">{sig.website}</a></div>}
            {sig.address && <div style={{ marginTop: 6 }}><IconLocation color={sig.linkColor} />{sig.address}</div>}
          </div>
          {(sig.linkedin || sig.twitter) && (
            <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
              {sig.linkedin && <a href={sig.linkedin} style={linkStyle(sig.linkColor)}>LinkedIn</a>}
              {sig.twitter && <a href={sig.twitter} style={linkStyle(sig.linkColor)}>Twitter</a>}
            </div>
          )}
        </div>
      </div>
    ),
  },
  {
    id: 'visual-centered',
    name: 'Visual Centrado',
    description: 'Logo grande centrado con diseño simétrico',
    preview: '◻👔◻',
    config: { bgColor: '#fef3c7', textColor: '#92400e', linkColor: '#d97706', accentColor: '#d97706', borderRadius: 16 },
    formSections: ['basic', 'contact', 'social', 'style'],
    render: (sig, _, w) => (
      <div style={{
        width: w, maxWidth: '100%', padding: 32, background: sig.bgColor, borderRadius: sig.borderRadius, textAlign: 'center' as const,
      }}>
        {sig.logoUrl && (
          <img src={sig.logoUrl} alt="Logo" style={{ width: 100, height: 100, objectFit: 'contain', borderRadius: sig.borderRadius }} />
        )}
        <div style={{ fontSize: 24, fontWeight: 'bold', color: sig.textColor, marginTop: 16 }}>{sig.name || 'Tu Nombre'}</div>
        <div style={{ fontSize: 15, color: sig.accentColor, marginTop: 6 }}>{sig.title || 'Tu Cargo'}</div>
        {sig.company && <div style={{ fontSize: 13, color: sig.textColor, marginTop: 8 }}>{sig.company}</div>}
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          {sig.email && <span><IconEmail color={sig.linkColor} /></span>}
          {sig.phone && <span><IconPhone color={sig.linkColor} /></span>}
          {sig.website && <span><IconWeb color={sig.linkColor} /></span>}
        </div>
        {(sig.linkedin || sig.twitter) && (
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 12 }}>
            {sig.linkedin && <a href={sig.linkedin} style={linkStyle(sig.linkColor)}>LinkedIn</a>}
            {sig.twitter && <a href={sig.twitter} style={linkStyle(sig.linkColor)}>Twitter</a>}
          </div>
        )}
      </div>
    ),
  },
  {
    id: 'visual-beside',
    name: 'Visual Lateral',
    description: 'Logo lateral con tarjetas internas',
    preview: '▌│││',
    config: { bgColor: '#f0f9ff', textColor: '#0c4a6e', linkColor: '#0284c7', accentColor: '#0284c7', borderRadius: 12 },
    formSections: ['basic', 'contact', 'social', 'style'],
    render: (sig, _, w) => (
      <div style={{ width: w, maxWidth: '100%', padding: 24, background: sig.bgColor, borderRadius: sig.borderRadius, display: 'flex', gap: 24 }}>
        {sig.logoUrl && (
          <div style={{ background: 'white', padding: 12, borderRadius: sig.borderRadius, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <img src={sig.logoUrl} alt="Logo" style={{ width: 80, height: 80, objectFit: 'contain' }} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: sig.textColor }}>{sig.name || 'Tu Nombre'}</div>
          <div style={{ fontSize: 14, color: sig.accentColor, marginTop: 4 }}>{sig.title || 'Tu Cargo'}</div>
          {sig.company && <div style={{ marginTop: 8, fontSize: 13, color: sig.textColor, fontWeight: 600 }}>{sig.company}</div>}
          <div style={{ marginTop: 12, padding: 12, background: 'white', borderRadius: 8, fontSize: 13 }}>
            {sig.email && <div><IconEmail color={sig.linkColor} /><a href={`mailto:${sig.email}`} style={linkStyle(sig.linkColor)}>{sig.email}</a></div>}
            {sig.phone && <div style={{ marginTop: 4 }}><IconPhone color={sig.linkColor} /><a href={`tel:${sig.phone}`} style={linkStyle(sig.linkColor)}>{sig.phone}</a></div>}
            {sig.website && <div style={{ marginTop: 4 }}><IconWeb color={sig.linkColor} /><a href={`https://${sig.website}`} style={linkStyle(sig.linkColor)} target="_blank">{sig.website}</a></div>}
            {sig.address && <div style={{ marginTop: 4 }}><IconLocation color={sig.linkColor} />{sig.address}</div>}
          </div>
          {(sig.linkedin || sig.twitter) && (
            <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
              {sig.linkedin && <a href={sig.linkedin} style={linkStyle(sig.linkColor)}>LinkedIn</a>}
              {sig.twitter && <a href={sig.twitter} style={linkStyle(sig.linkColor)}>Twitter</a>}
            </div>
          )}
        </div>
      </div>
    ),
  },
  {
    id: 'sectoral-blocks',
    name: 'Sectorial Bloques',
    description: 'Secciones diferenciadas con colores alternados',
    preview: '▬▬▬',
    config: { bgColor: '#ffffff', textColor: '#1f2937', linkColor: '#059669', accentColor: '#059669', borderRadius: 8 },
    formSections: ['basic', 'contact', 'social', 'style'],
    render: (sig, _, w) => (
      <div style={{ width: w, maxWidth: '100%', borderRadius: sig.borderRadius, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ background: sig.bgColor, padding: 20, borderBottom: `4px solid ${sig.accentColor}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {sig.logoUrl && <img src={sig.logoUrl} alt="Logo" style={{ width: 60, height: 60, objectFit: 'contain' }} />}
            <div>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: sig.textColor }}>{sig.name || 'Tu Nombre'}</div>
              <div style={{ fontSize: 14, color: sig.accentColor }}>{sig.title || 'Tu Cargo'}</div>
              {sig.company && <div style={{ fontSize: 12, color: sig.textColor, opacity: 0.8, marginTop: 2 }}>{sig.company}</div>}
            </div>
          </div>
        </div>
        <div style={{ background: sig.accentColor + '10', padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 'bold', color: sig.accentColor, marginBottom: 8, textTransform: 'uppercase' as const }}>Contacto</div>
          <div style={{ fontSize: 13, color: sig.textColor }}>
            {sig.email && <div><IconEmail color={sig.linkColor} /><a href={`mailto:${sig.email}`} style={linkStyle(sig.linkColor)}>{sig.email}</a></div>}
            {sig.phone && <div style={{ marginTop: 4 }}><IconPhone color={sig.linkColor} /><a href={`tel:${sig.phone}`} style={linkStyle(sig.linkColor)}>{sig.phone}</a></div>}
            {sig.website && <div style={{ marginTop: 4 }}><IconWeb color={sig.linkColor} /><a href={`https://${sig.website}`} style={linkStyle(sig.linkColor)} target="_blank">{sig.website}</a></div>}
            {sig.address && <div style={{ marginTop: 4 }}><IconLocation color={sig.linkColor} />{sig.address}</div>}
          </div>
        </div>
        {(sig.linkedin || sig.twitter) && (
          <div style={{ padding: 16, background: sig.bgColor }}>
            <div style={{ fontSize: 12, fontWeight: 'bold', color: sig.accentColor, marginBottom: 8, textTransform: 'uppercase' as const }}>Redes</div>
            <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
              {sig.linkedin && <a href={sig.linkedin} style={linkStyle(sig.linkColor)}>LinkedIn</a>}
              {sig.twitter && <a href={sig.twitter} style={linkStyle(sig.linkColor)}>Twitter</a>}
            </div>
          </div>
        )}
      </div>
    ),
  },
  {
    id: 'sectoral-grid',
    name: 'Sectorial Grid',
    description: 'Grid de 2x2 para campos de información',
    preview: '▣▣',
    config: { bgColor: '#fafafa', textColor: '#374151', linkColor: '#7c3aed', accentColor: '#7c3aed', borderRadius: 12 },
    formSections: ['basic', 'contact', 'social', 'style'],
    render: (sig, _, w) => (
      <div style={{ width: w, maxWidth: '100%', padding: 24, background: sig.bgColor, borderRadius: sig.borderRadius, border: `2px solid ${sig.accentColor}20` }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          {sig.logoUrl && <img src={sig.logoUrl} alt="Logo" style={{ width: 50, height: 50, objectFit: 'contain' }} />}
          <div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: sig.textColor }}>{sig.name || 'Tu Nombre'}</div>
            <div style={{ fontSize: 13, color: sig.accentColor }}>{sig.title || 'Tu Cargo'}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {sig.email && (
            <div style={{ background: 'white', padding: 12, borderRadius: 8, borderLeft: `3px solid ${sig.accentColor}` }}>
              <div style={{ fontSize: 10, color: sig.textColor, opacity: 0.6 }}>EMAIL</div>
              <div style={{ fontSize: 12, marginTop: 2 }}><a href={`mailto:${sig.email}`} style={linkStyle(sig.linkColor)}>{sig.email}</a></div>
            </div>
          )}
          {sig.phone && (
            <div style={{ background: 'white', padding: 12, borderRadius: 8, borderLeft: `3px solid ${sig.accentColor}` }}>
              <div style={{ fontSize: 10, color: sig.textColor, opacity: 0.6 }}>TELÉFONO</div>
              <div style={{ fontSize: 12, marginTop: 2 }}><a href={`tel:${sig.phone}`} style={linkStyle(sig.linkColor)}>{sig.phone}</a></div>
            </div>
          )}
          {sig.website && (
            <div style={{ background: 'white', padding: 12, borderRadius: 8, borderLeft: `3px solid ${sig.accentColor}` }}>
              <div style={{ fontSize: 10, color: sig.textColor, opacity: 0.6 }}>WEB</div>
              <div style={{ fontSize: 12, marginTop: 2 }}><a href={`https://${sig.website}`} style={linkStyle(sig.linkColor)} target="_blank">{sig.website}</a></div>
            </div>
          )}
          {sig.company && (
            <div style={{ background: 'white', padding: 12, borderRadius: 8, borderLeft: `3px solid ${sig.accentColor}` }}>
              <div style={{ fontSize: 10, color: sig.textColor, opacity: 0.6 }}>EMPRESA</div>
              <div style={{ fontSize: 12, marginTop: 2, color: sig.textColor }}>{sig.company}</div>
            </div>
          )}
        </div>
        {(sig.linkedin || sig.twitter) && (
          <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
            {sig.linkedin && <a href={sig.linkedin} style={linkStyle(sig.linkColor)}>LinkedIn</a>}
            {sig.twitter && <a href={sig.twitter} style={linkStyle(sig.linkColor)}>Twitter</a>}
          </div>
        )}
      </div>
    ),
  },
  {
    id: 'corporate-strict',
    name: 'Corporativo Estricto',
    description: 'Diseño formal compatible con Outlook',
    preview: '═╪═',
    config: { bgColor: '#1e3a5f', textColor: '#ffffff', linkColor: '#93c5fd', accentColor: '#93c5fd', borderRadius: 0 },
    formSections: ['basic', 'contact', 'social', 'style'],
    render: (sig, _, w) => (
      <table cellPadding={0} cellSpacing={0} style={{ width: w, maxWidth: '100%', background: sig.bgColor, borderRadius: sig.borderRadius }}>
        <tr>
          <td style={{ padding: 20, verticalAlign: 'middle', borderRight: `3px solid ${sig.accentColor}` }}>
            {sig.logoUrl && <img src={sig.logoUrl} alt="Logo" style={{ width: 70, height: 70, objectFit: 'contain' }} />}
          </td>
          <td style={{ padding: 20, verticalAlign: 'middle' }}>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: sig.textColor }}>{sig.name || 'Tu Nombre'}</div>
            <div style={{ fontSize: 14, color: sig.accentColor, marginTop: 4 }}>{sig.title || 'Tu Cargo'}</div>
            {sig.company && <div style={{ fontSize: 13, color: sig.textColor, opacity: 0.8, marginTop: 4 }}>{sig.company}</div>}
          </td>
        </tr>
        <tr>
          <td colSpan={2} style={{ padding: '12px 20px', background: sig.accentColor + '20', borderTop: `1px solid ${sig.accentColor}40` }}>
            <table cellPadding={0} cellSpacing={0}>
              <tr>
                <td style={{ paddingRight: 20, fontSize: 12, color: sig.textColor }}>
                  {sig.email && <><a href={`mailto:${sig.email}`} style={linkStyle(sig.linkColor)}>{sig.email}</a><br /></>}
                  {sig.phone && <><a href={`tel:${sig.phone}`} style={linkStyle(sig.linkColor)}>{sig.phone}</a><br /></>}
                  {sig.website && <a href={`https://${sig.website}`} style={linkStyle(sig.linkColor)} target="_blank">{sig.website}</a>}
                </td>
                {sig.linkedin && (
                  <td style={{ fontSize: 12 }}>
                    <a href={sig.linkedin} style={linkStyle(sig.linkColor)}>LinkedIn</a>
                  </td>
                )}
                {sig.twitter && (
                  <td style={{ fontSize: 12 }}>
                    <a href={sig.twitter} style={linkStyle(sig.linkColor)}>Twitter</a>
                  </td>
                )}
              </tr>
            </table>
          </td>
        </tr>
      </table>
    ),
  },
  {
    id: 'corporate-modern',
    name: 'Corporativo Moderno',
    description: 'Estilo corporativo con gradiente y badges',
    preview: '▬═══',
    config: { bgColor: '#ffffff', textColor: '#1f2937', linkColor: '#2563eb', accentColor: '#2563eb', borderRadius: 16 },
    formSections: ['basic', 'contact', 'social', 'style'],
    render: (sig, _, w) => (
      <div style={{ width: w, maxWidth: '100%', borderRadius: sig.borderRadius, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ background: `linear-gradient(135deg, ${sig.accentColor}, ${sig.accentColor}dd)`, padding: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
          {sig.logoUrl && <div style={{ background: 'white', padding: 8, borderRadius: 12 }}><img src={sig.logoUrl} alt="Logo" style={{ width: 60, height: 60, objectFit: 'contain' }} /></div>}
          <div>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>{sig.name || 'Tu Nombre'}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4 }}>{sig.title || 'Tu Cargo'}</div>
            {sig.company && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{sig.company}</div>}
          </div>
        </div>
        <div style={{ padding: 20, background: sig.bgColor }}>
          <div style={{ fontSize: 13, color: sig.textColor }}>
            {sig.email && <div><IconEmail color={sig.linkColor} /><a href={`mailto:${sig.email}`} style={linkStyle(sig.linkColor)}>{sig.email}</a></div>}
            {sig.phone && <div style={{ marginTop: 8 }}><IconPhone color={sig.linkColor} /><a href={`tel:${sig.phone}`} style={linkStyle(sig.linkColor)}>{sig.phone}</a></div>}
            {sig.website && <div style={{ marginTop: 8 }}><IconWeb color={sig.linkColor} /><a href={`https://${sig.website}`} style={linkStyle(sig.linkColor)} target="_blank">{sig.website}</a></div>}
            {sig.address && <div style={{ marginTop: 8 }}><IconLocation color={sig.linkColor} />{sig.address}</div>}
          </div>
          {(sig.linkedin || sig.twitter) && (
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              {sig.linkedin && <span style={{ background: '#0077b5', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12 }}><a href={sig.linkedin} style={{ color: 'white' }}>LinkedIn</a></span>}
              {sig.twitter && <span style={{ background: '#1da1f2', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12 }}><a href={sig.twitter} style={{ color: 'white' }}>Twitter</a></span>}
            </div>
          )}
        </div>
      </div>
    ),
  },
  {
    id: 'elegant-serif',
    name: 'Elegante Serif',
    description: 'Tipografía serif con ornamento decorativo',
    preview: '▬═══',
    config: { bgColor: '#faf8f5', textColor: '#2d2d2d', linkColor: '#8b4513', accentColor: '#8b4513', borderRadius: 4 },
    formSections: ['basic', 'contact', 'social', 'style'],
    render: (sig, _, w) => (
      <div style={{ width: w, maxWidth: '100%', padding: 32, background: sig.bgColor, fontFamily: "'Playfair Display', Georgia, serif" }}>
        <div style={{ textAlign: 'center' as const }}>
          {sig.logoUrl && <img src={sig.logoUrl} alt="Logo" style={{ width: 70, height: 70, objectFit: 'contain' }} />}
          <div style={{ fontSize: 24, fontWeight: 'bold', color: sig.textColor, marginTop: 16 }}>{sig.name || 'Tu Nombre'}</div>
          <div style={{ fontSize: 14, fontStyle: 'italic', color: sig.accentColor, marginTop: 4 }}>{sig.title || 'Tu Cargo'}</div>
          <div style={{ width: 60, height: 2, background: sig.accentColor, margin: '16px auto' }} />
          {sig.company && <div style={{ fontSize: 13, color: sig.textColor, letterSpacing: 2 }}>{sig.company}</div>}
          <div style={{ marginTop: 16, fontSize: 13, fontFamily: 'Arial, sans-serif' }}>
            {sig.email && <div><a href={`mailto:${sig.email}`} style={linkStyle(sig.linkColor)}>{sig.email}</a></div>}
            {sig.phone && <div style={{ marginTop: 4 }}><a href={`tel:${sig.phone}`} style={linkStyle(sig.linkColor)}>{sig.phone}</a></div>}
            {sig.website && <div style={{ marginTop: 4 }}><a href={`https://${sig.website}`} style={linkStyle(sig.linkColor)} target="_blank">{sig.website}</a></div>}
          </div>
          {(sig.linkedin || sig.twitter) && (
            <div style={{ marginTop: 16, fontFamily: 'Arial, sans-serif', display: 'flex', justifyContent: 'center', gap: 16 }}>
              {sig.linkedin && <a href={sig.linkedin} style={linkStyle(sig.linkColor)}>LinkedIn</a>}
              {sig.twitter && <a href={sig.twitter} style={linkStyle(sig.linkColor)}>Twitter</a>}
            </div>
          )}
        </div>
      </div>
    ),
  },
  {
    id: 'tech-startup',
    name: 'Tech Startup',
    description: 'Colores vibrantes con formas geométricas',
    preview: '◻◻◻',
    config: { bgColor: '#f0fdf4', textColor: '#166534', linkColor: '#16a34a', accentColor: '#16a34a', borderRadius: 16 },
    formSections: ['basic', 'contact', 'social', 'style'],
    render: (sig, _, w) => (
      <div style={{ width: w, maxWidth: '100%', background: sig.bgColor, borderRadius: sig.borderRadius, padding: 24, border: `2px solid ${sig.accentColor}` }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {sig.logoUrl && (
            <div style={{ background: sig.accentColor, padding: 12, borderRadius: 12 }}>
              <img src={sig.logoUrl} alt="Logo" style={{ width: 60, height: 60, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            </div>
          )}
          <div>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: sig.textColor }}>{sig.name || 'Tu Nombre'}</div>
            <div style={{ display: 'inline-block', background: sig.accentColor, color: 'white', padding: '2px 10px', borderRadius: 12, fontSize: 12, marginTop: 4 }}>
              {sig.title || 'Tu Cargo'}
            </div>
            {sig.company && <div style={{ fontSize: 13, color: sig.textColor, marginTop: 4 }}>{sig.company}</div>}
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {sig.email && (
            <div style={{ background: 'white', padding: 10, borderRadius: 8 }}>
              <a href={`mailto:${sig.email}`} style={{ ...linkStyle(sig.linkColor), fontSize: 12 }}>{sig.email}</a>
            </div>
          )}
          {sig.phone && (
            <div style={{ background: 'white', padding: 10, borderRadius: 8 }}>
              <a href={`tel:${sig.phone}`} style={{ ...linkStyle(sig.linkColor), fontSize: 12 }}>{sig.phone}</a>
            </div>
          )}
        </div>
        {sig.website && (
          <div style={{ marginTop: 8, background: 'white', padding: 10, borderRadius: 8 }}>
            <a href={`https://${sig.website}`} style={{ ...linkStyle(sig.linkColor), fontSize: 12 }} target="_blank">{sig.website}</a>
          </div>
        )}
        {(sig.linkedin || sig.twitter) && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            {sig.linkedin && <span style={{ background: sig.accentColor, color: 'white', padding: '4px 12px', borderRadius: 8, fontSize: 11 }}><a href={sig.linkedin} style={{ color: 'white' }}>LinkedIn</a></span>}
            {sig.twitter && <span style={{ background: '#1da1f2', color: 'white', padding: '4px 12px', borderRadius: 8, fontSize: 11 }}><a href={sig.twitter} style={{ color: 'white' }}>Twitter</a></span>}
          </div>
        )}
      </div>
    ),
  },
  {
    id: 'card-shadow',
    name: 'Tarjeta Sombra',
    description: 'Contenido elevado con sombra suave',
    preview: '▣═══',
    config: { bgColor: '#f5f5f5', textColor: '#333333', linkColor: '#6366f1', accentColor: '#6366f1', borderRadius: 12 },
    formSections: ['basic', 'contact', 'social', 'style'],
    render: (sig, _, w) => (
      <div style={{ width: w, maxWidth: '100%', padding: 24, background: sig.bgColor }}>
        <div style={{
          background: 'white', padding: 24, borderRadius: sig.borderRadius, boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          borderTop: `4px solid ${sig.accentColor}`,
        }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            {sig.logoUrl && <img src={sig.logoUrl} alt="Logo" style={{ width: 60, height: 60, objectFit: 'contain' }} />}
            <div>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: sig.textColor }}>{sig.name || 'Tu Nombre'}</div>
              <div style={{ fontSize: 14, color: sig.accentColor, marginTop: 2 }}>{sig.title || 'Tu Cargo'}</div>
              {sig.company && <div style={{ fontSize: 12, color: sig.textColor, opacity: 0.7, marginTop: 4 }}>{sig.company}</div>}
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${sig.accentColor}20`, paddingTop: 16, fontSize: 13 }}>
            {sig.email && <div><IconEmail color={sig.linkColor} /><a href={`mailto:${sig.email}`} style={linkStyle(sig.linkColor)}>{sig.email}</a></div>}
            {sig.phone && <div style={{ marginTop: 6 }}><IconPhone color={sig.linkColor} /><a href={`tel:${sig.phone}`} style={linkStyle(sig.linkColor)}>{sig.phone}</a></div>}
            {sig.website && <div style={{ marginTop: 6 }}><IconWeb color={sig.linkColor} /><a href={`https://${sig.website}`} style={linkStyle(sig.linkColor)} target="_blank">{sig.website}</a></div>}
            {sig.address && <div style={{ marginTop: 6 }}><IconLocation color={sig.linkColor} />{sig.address}</div>}
            {sig.skype && <div style={{ marginTop: 6 }}><IconSkype color={sig.linkColor} />{sig.skype}</div>}
          </div>
          {(sig.linkedin || sig.twitter) && (
            <div style={{ marginTop: 12, display: 'flex', gap: 12, paddingTop: 12, borderTop: `1px solid ${sig.accentColor}20` }}>
              {sig.linkedin && <a href={sig.linkedin} style={linkStyle(sig.linkColor)}>LinkedIn</a>}
              {sig.twitter && <a href={sig.twitter} style={linkStyle(sig.linkColor)}>Twitter</a>}
              {sig.instagram && <a href={sig.instagram} style={linkStyle(sig.linkColor)}>Instagram</a>}
              {sig.facebook && <a href={sig.facebook} style={linkStyle(sig.linkColor)}>Facebook</a>}
            </div>
          )}
        </div>
      </div>
    ),
  },
  {
    id: 'legal-formal',
    name: 'Legal Formal',
    description: 'Minimalista extremo sin decoraciones',
    preview: '════',
    config: { bgColor: '#ffffff', textColor: '#000000', linkColor: '#000000', accentColor: '#000000', borderRadius: 0 },
    formSections: ['basic', 'contact', 'social', 'style'],
    render: (sig, _, w) => (
      <table cellPadding={0} cellSpacing={0} style={{ width: w, maxWidth: '100%', background: sig.bgColor, fontFamily: 'Arial, sans-serif', fontSize: 12 }}>
        <tr>
          <td style={{ padding: 0, verticalAlign: 'top' }}>
            <table cellPadding={0} cellSpacing={0}>
              <tr>
                <td style={{ paddingRight: 20, verticalAlign: 'top' }}>
                  {sig.logoUrl && <img src={sig.logoUrl} alt="Logo" style={{ width: 50, height: 50, objectFit: 'contain' }} />}
                </td>
                <td style={{ paddingRight: 20, verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', color: sig.textColor }}>{sig.name || 'Tu Nombre'}</div>
                  <div style={{ color: sig.textColor }}>{sig.title || 'Tu Cargo'}</div>
                  {sig.company && <div style={{ color: sig.textColor }}>{sig.company}</div>}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style={{ paddingTop: 10, borderTop: '1px solid #e5e5e5' }}>
            <table cellPadding={0} cellSpacing={0}>
              <tr>
                <td style={{ paddingRight: 20 }}>
                  {sig.email && <div style={{ color: sig.textColor }}>{sig.email}</div>}
                  {sig.phone && <div style={{ color: sig.textColor }}>{sig.phone}</div>}
                  {sig.website && <div style={{ color: sig.textColor }}>{sig.website}</div>}
                  {sig.address && <div style={{ color: sig.textColor }}>{sig.address}</div>}
                </td>
                {sig.linkedin && <td><a href={sig.linkedin} style={linkStyle(sig.linkColor)}>LinkedIn</a></td>}
                {sig.twitter && <td><a href={sig.twitter} style={linkStyle(sig.linkColor)}>Twitter</a></td>}
              </tr>
            </table>
          </td>
        </tr>
      </table>
    ),
  },
  {
    id: 'dark-gradient',
    name: 'Dark Gradient',
    description: 'Fondo oscuro con efecto degradado premium',
    preview: '▒▒▒',
    config: { bgColor: '#0f172a', textColor: '#f1f5f9', linkColor: '#38bdf8', accentColor: '#38bdf8', borderRadius: 16 },
    formSections: ['basic', 'contact', 'social', 'style'],
    render: (sig, _, w) => (
      <div style={{
        width: w, maxWidth: '100%', padding: 32, background: `linear-gradient(135deg, ${sig.bgColor} 0%, ${sig.bgColor}cc 50%, #1e293b 100%)`,
        borderRadius: sig.borderRadius, border: `1px solid ${sig.accentColor}40`,
        boxShadow: `0 0 40px ${sig.accentColor}20`,
      }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {sig.logoUrl && (
            <div style={{
              background: `${sig.accentColor}20`, padding: 12, borderRadius: 12, border: `1px solid ${sig.accentColor}40`,
              boxShadow: `0 0 20px ${sig.accentColor}30`,
            }}>
              <img src={sig.logoUrl} alt="Logo" style={{ width: 70, height: 70, objectFit: 'contain' }} />
            </div>
          )}
          <div>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: sig.textColor, letterSpacing: '-0.5px' }}>{sig.name || 'Tu Nombre'}</div>
            <div style={{ fontSize: 14, color: sig.accentColor, marginTop: 4 }}>{sig.title || 'Tu Cargo'}</div>
            {sig.company && <div style={{ fontSize: 13, color: sig.textColor, opacity: 0.7, marginTop: 4 }}>{sig.company}</div>}
          </div>
        </div>
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {sig.email && (
            <div style={{ background: `${sig.accentColor}15`, padding: 12, borderRadius: 8, border: `1px solid ${sig.accentColor}30` }}>
              <div style={{ fontSize: 10, color: sig.accentColor, marginBottom: 4 }}>EMAIL</div>
              <a href={`mailto:${sig.email}`} style={{ ...linkStyle(sig.linkColor), fontSize: 12 }}>{sig.email}</a>
            </div>
          )}
          {sig.phone && (
            <div style={{ background: `${sig.accentColor}15`, padding: 12, borderRadius: 8, border: `1px solid ${sig.accentColor}30` }}>
              <div style={{ fontSize: 10, color: sig.accentColor, marginBottom: 4 }}>TELÉFONO</div>
              <a href={`tel:${sig.phone}`} style={{ ...linkStyle(sig.linkColor), fontSize: 12 }}>{sig.phone}</a>
            </div>
          )}
        </div>
        {sig.website && (
          <div style={{ marginTop: 12, background: `${sig.accentColor}15`, padding: 12, borderRadius: 8, border: `1px solid ${sig.accentColor}30` }}>
            <div style={{ fontSize: 10, color: sig.accentColor, marginBottom: 4 }}>WEB</div>
            <a href={`https://${sig.website}`} style={{ ...linkStyle(sig.linkColor), fontSize: 12 }} target="_blank">{sig.website}</a>
          </div>
        )}
        {sig.address && (
          <div style={{ marginTop: 12, background: `${sig.accentColor}15`, padding: 12, borderRadius: 8, border: `1px solid ${sig.accentColor}30` }}>
            <div style={{ fontSize: 10, color: sig.accentColor, marginBottom: 4 }}>DIRECCIÓN</div>
            <div style={{ fontSize: 12, color: sig.textColor }}>{sig.address}</div>
          </div>
        )}
        {(sig.linkedin || sig.twitter) && (
          <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
            {sig.linkedin && (
              <span style={{ background: sig.accentColor, color: sig.bgColor, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 'bold' }}>
                <a href={sig.linkedin} style={{ color: sig.bgColor }}>LinkedIn</a>
              </span>
            )}
            {sig.twitter && (
              <span style={{ background: sig.accentColor, color: sig.bgColor, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 'bold' }}>
                <a href={sig.twitter} style={{ color: sig.bgColor }}>Twitter</a>
              </span>
            )}
          </div>
        )}
      </div>
    ),
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
};