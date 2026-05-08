import type { LogoConfig } from './signatureTemplates';

export interface LogoValidationResult {
  isValid: boolean;
  error?: string;
  warnings: string[];
  naturalWidth?: number;
  naturalHeight?: number;
  fileSize?: number;
  format?: string;
}

export interface LogoCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxFileSizeMB?: number;
  outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
}

const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_MB = 5;
const MAX_BASE64_LENGTH = 2 * 1024 * 1024; // 2MB para evitar problemas de memoria

/**
 * Valida un archivo de logo
 */
export async function validateLogo(file: File): Promise<LogoValidationResult> {
  const warnings: string[] = [];
  
  // Validar tipo
  if (!SUPPORTED_FORMATS.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|svg|webp|gif)$/i)) {
    return {
      isValid: false,
      error: `Formato no soportado. Use: JPG, PNG, SVG, WebP o GIF`,
      warnings: []
    };
  }

  // Validar tamaño
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > MAX_FILE_SIZE_MB) {
    return {
      isValid: false,
      error: `El archivo es demasiado grande (${(fileSizeMB).toFixed(1)}MB). Máximo: ${MAX_FILE_SIZE_MB}MB`,
      warnings: []
    };
  }

  if (fileSizeMB > 2) {
    warnings.push(`Imagen grande (${(fileSizeMB).toFixed(1)}MB). Se recomienda comprimir.`);
  }

  // Validar dimensiones si es posible
  try {
    const dimensions = await getImageDimensions(file);
    
    if (dimensions.width < 50 || dimensions.height < 50) {
      warnings.push(`Resolución baja (${dimensions.width}x${dimensions.height}). Se recomienda mínimo 200x200px para calidad empresarial.`);
    }

    if (dimensions.width > 5000 || dimensions.height > 5000) {
      warnings.push(`Resolución muy alta. Se redimensionará automáticamente.`);
    }

    return {
      isValid: true,
      warnings,
      naturalWidth: dimensions.width,
      naturalHeight: dimensions.height,
      fileSize: file.size,
      format: file.type || 'unknown'
    };
  } catch (err) {
    return {
      isValid: false,
      error: 'No se pudo leer la imagen. Verifique que el archivo no esté corrupto.',
      warnings: []
    };
  }
}

/**
 * Obtiene las dimensiones naturales de una imagen
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Comprime una imagen manteniendo la relación de aspecto
 */
export async function compressLogo(
  file: File, 
  options: LogoCompressionOptions = {}
): Promise<{ dataUrl: string; width: number; height: number }> {
  const {
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.9,
    outputFormat = 'image/png'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      let { width, height } = img;
      
      // Calcular nuevas dimensiones manteniendo aspect ratio
      const ratio = width / height;
      
      if (width > maxWidth) {
        width = maxWidth;
        height = width / ratio;
      }
      
      if (height > maxHeight) {
        height = maxHeight;
        width = height * ratio;
      }
      
      // Crear canvas para compresión
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo crear canvas'));
        return;
      }
      
      // Fondo transparente para PNG, blanco para JPEG
      if (outputFormat === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      const dataUrl = canvas.toDataURL(outputFormat, quality);
      
      // Verificar tamaño del data URL
      if (dataUrl.length > MAX_BASE64_LENGTH) {
        // Intentar con menor calidad
        const newQuality = quality * 0.7;
        const newDataUrl = canvas.toDataURL(outputFormat, newQuality);
        resolve({ dataUrl: newDataUrl, width, height });
      } else {
        resolve({ dataUrl, width, height });
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression'));
    };
    
    img.src = url;
  });
}

/**
 * Actualiza el LogoConfig con nuevas dimensiones y validación
 */
export function updateLogoConfigWithValidation(
  currentConfig: LogoConfig,
  compressedDataUrl: string,
  naturalWidth: number,
  naturalHeight: number
): LogoConfig {
  const lockAspectRatio = currentConfig.lockAspectRatio;
  let newWidth = currentConfig.width;
  let newHeight = currentConfig.height;
  
  // Si el logo es más ancho que alto (horizontal), dar prioridad al ancho
  if (naturalWidth > naturalHeight) {
    newWidth = Math.min(300, naturalWidth);
    if (lockAspectRatio) {
      newHeight = newWidth / (naturalWidth / naturalHeight);
    }
  } else {
    // Si es más alto que ancho (vertical), dar prioridad a la altura
    newHeight = Math.min(100, naturalHeight);
    if (lockAspectRatio) {
      newWidth = newHeight * (naturalWidth / naturalHeight);
    }
  }
  
  return {
    ...currentConfig,
    url: compressedDataUrl,
    width: Math.round(newWidth),
    height: Math.round(newHeight),
    naturalWidth,
    naturalHeight,
    lockAspectRatio: true,
  };
}

/**
 * Obtiene el tamaño aproximado de un data URL en MB
 */
export function getDataUrlSizeMB(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] || '';
  const bytes = Math.ceil(base64.length * 3 / 4);
  return bytes / (1024 * 1024);
}

/**
 * Presets empresariales para logos
 */
export const LOGO_PRESETS = {
  legal: { width: 180, height: 60, objectFit: 'contain' as const, borderRadius: 0 },
  tech: { width: 200, height: 200, objectFit: 'contain' as const, borderRadius: 8 },
  retail: { width: 250, height: 80, objectFit: 'contain' as const, borderRadius: 4 },
  corporate: { width: 200, height: 70, objectFit: 'contain' as const, borderRadius: 0 },
  startup: { width: 180, height: 180, objectFit: 'contain' as const, borderRadius: 12 },
};

export type LogoPresetKey = keyof typeof LOGO_PRESETS;
