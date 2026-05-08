import type { EmailSignature, LogoConfig } from './signatureTemplates';

export interface ElementMetrics {
  id: string;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
}

export interface LayoutConfig {
  direction: 'row' | 'column' | 'row-reverse';
  alignment: 'start' | 'center' | 'end' | 'stretch';
  justify: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
  gap: number;
  wrap: boolean;
  adaptive: boolean;
  // Estilos calculados
  containerStyle: React.CSSProperties;
  elementStyles: Record<string, React.CSSProperties>;
}

export interface LayoutRequest {
  containerWidth: number;
  containerHeight?: number;
  elements: ElementMetrics[];
  logoConfig: LogoConfig;
  sig: EmailSignature;
}

/**
 * Calcula el layout óptimo basado en el espacio disponible y elementos
 */
export function calculateLayout(request: LayoutRequest): LayoutConfig {
  const { containerWidth, elements, logoConfig, sig } = request;
  
  // Determinar si debemos usar layout vertical u horizontal
  const totalElementWidth = elements.reduce((sum, el) => sum + el.width, 0);
  const gap = Math.max(16, logoConfig.width / 4);
  const totalGaps = (elements.length - 1) * gap;
  const shouldUseVertical = 
    sig.layout === 'vertical' || 
    (sig.layout === 'horizontal' && (totalElementWidth + totalGaps > containerWidth * 0.9));
  
  // Configuración base
  const direction = shouldUseVertical ? 'column' as const : 'row' as const;
  const alignment = logoConfig.alignment === 'start' ? 'start' as const : 
                     logoConfig.alignment === 'end' ? 'end' as const : 'center' as const;
  
  // Justificación basada en logoPosition
  let justify: 'start' | 'center' | 'end' | 'space-between' = 'start';
  if (sig.logoPosition === 'center') {
    justify = 'center';
  } else if (sig.layout === 'centered') {
    justify = 'center';
  } else if (sig.logoPosition === 'right') {
    justify = 'space-between';
  }
  
  // Estilos del contenedor
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: direction,
    alignItems: alignment,
    justifyContent: justify,
    gap: gap,
    flexWrap: shouldUseVertical ? 'wrap' as any : 'nowrap',
    width: '100%',
    maxWidth: containerWidth,
  };
  
  // Estilos por elemento
  const elementStyles: Record<string, React.CSSProperties> = {};
  
  elements.forEach(el => {
    const style: React.CSSProperties = {
      flexShrink: 0,
    };
    
    // Ajustar ancho si excede el contenedor
    if (el.width > containerWidth * 0.9) {
      style.width = containerWidth * 0.9;
      style.height = el.height * (containerWidth * 0.9 / el.width);
    } else {
      style.width = el.width;
      style.height = el.height;
    }
    
    // Si es logo, aplicar configuración especial
    if (el.id === 'logo') {
      style.objectFit = logoConfig.objectFit;
      style.borderRadius = logoConfig.borderRadius;
      style.padding = logoConfig.padding;
      if (logoConfig.backgroundColor) {
        style.backgroundColor = logoConfig.backgroundColor;
      }
    }
    
    elementStyles[el.id] = style;
  });
  
  return {
    direction,
    alignment,
    justify,
    gap,
    wrap: shouldUseVertical,
    adaptive: true,
    containerStyle,
    elementStyles,
  };
}

/**
 * Construye la lista de elementos basada en elementOrder y visibilidad
 */
export function buildElementList(sig: EmailSignature): ElementMetrics[] {
  const order = sig.elementOrder.length > 0 ? sig.elementOrder : ['logo', 'name', 'contact', 'social'];
  const elements: ElementMetrics[] = [];
  
  const logoMetrics: ElementMetrics = {
    id: 'logo',
    width: sig.logoConfig?.width || 60,
    height: sig.logoConfig?.height || 60,
    minWidth: 30,
    minHeight: 30,
  };
  
  const photoMetrics: ElementMetrics = {
    id: 'photo',
    width: 80,
    height: 80,
    minWidth: 40,
    minHeight: 40,
  };
  
  const contentMetrics: ElementMetrics = {
    id: 'content',
    width: Math.max(200, sig.width * 0.6),
    height: 150,
    minWidth: 150,
    minHeight: 100,
  };
  
  order.forEach(item => {
    if (item === 'logo' && sig.logoConfig?.show && sig.logoConfig?.url) {
      elements.push(logoMetrics);
    } else if (item === 'photo' && sig.photoUrl) {
      elements.push(photoMetrics);
    } else if (item === 'name' || item === 'contact' || item === 'social') {
      // Agrupar contenido textual
      if (!elements.find(e => e.id === 'content')) {
        elements.push(contentMetrics);
      }
    }
  });
  
  return elements;
}

/**
 * Determina si el layout debe cambiar a vertical automáticamente
 */
export function shouldUseVerticalLayout(
  containerWidth: number,
  logoWidth: number,
  photoWidth: number,
  minContentWidth: number = 200
): boolean {
  const totalWidth = logoWidth + photoWidth + minContentWidth + 32; // 32 = gap
  return totalWidth > containerWidth;
}

/**
 * Calcula el tamaño óptimo del logo basado en el espacio disponible
 */
export function calculateOptimalLogoSize(
  containerWidth: number,
  logoConfig: LogoConfig,
  otherElementsWidth: number = 200
): { width: number; height: number } {
  const availableForLogo = containerWidth - otherElementsWidth - 32;
  
  if (availableForLogo < logoConfig.width) {
    // Reducir manteniendo aspect ratio
    const ratio = logoConfig.naturalWidth && logoConfig.naturalHeight 
      ? logoConfig.naturalWidth / logoConfig.naturalHeight 
      : 1;
    
    const newWidth = Math.max(100, availableForLogo); // Mínimo 100px
    const newHeight = Math.round(newWidth / ratio);
    
    return { width: newWidth, height: newHeight };
  }
  
  return { width: logoConfig.width, height: logoConfig.height };
}
