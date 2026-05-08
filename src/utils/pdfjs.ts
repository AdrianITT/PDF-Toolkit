import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import type { RenderTask } from 'pdfjs-dist/types/src/display/api';
export type { PDFDocumentProxy };

type PDFJSModule = typeof import('pdfjs-dist/legacy/build/pdf.mjs');

export let pdfjsLib: PDFJSModule | null = null;
let workerConfigured = false;

interface PDFPage {
  getViewport: (params: { scale: number }) => PDFViewport;
  render: (params: { canvasContext: CanvasRenderingContext2D; viewport: PDFViewport }) => RenderTask;
  getWidth?: () => number;
  getHeight?: () => number;
  width?: number;
  height?: number;
  _pageInfo?: { view: number[] };
  _transport?: { commonObjs: Record<string, unknown> };
}

interface PageDimensions {
  width: number;
  height: number;
}

interface PDFViewport {
  width: number;
  height: number;
}

async function loadPdfJs(): Promise<PDFJSModule> {
  if (pdfjsLib) return pdfjsLib;
  
  const lib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  
  if (!workerConfigured) {
    lib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
    workerConfigured = true;
    console.log('[PDF.js] Worker configurado correctamente');
  }
  
  pdfjsLib = lib;
  return lib;
}

export interface LoadPdfResult {
  doc: PDFDocumentProxy;
  numPages: number;
}

export async function loadPdf(data: Uint8Array): Promise<LoadPdfResult> {
  const lib = await loadPdfJs();
  
  if (!data || data.length === 0) {
    throw new Error('No se proporcionaron datos PDF válidos');
  }
  
  const headerCheck = new Uint8Array(data.slice(0, 5));
  const headerStr = String.fromCharCode(...headerCheck);
  if (!headerStr.startsWith('%PDF')) {
    throw new Error(`El archivo no es un PDF válido. Encabezado encontrado: ${headerStr}`);
  }
  
  try {
    const pdfDataCopy = new Uint8Array(data);
    const doc = await lib.getDocument({ data: pdfDataCopy }).promise;
    
    console.log('[PDF.js] PDF cargado correctamente. Páginas:', doc.numPages);
    
    return {
      doc,
      numPages: doc.numPages,
    };
  } catch (error) {
    console.error('[PDF.js] Error al cargar PDF:', error);
    if (error instanceof Error) {
      throw new Error(`Error al procesar el PDF: ${error.message}`);
    }
    throw new Error('Error desconocido al procesar el PDF');
  }
}

export async function renderPage(
  doc: PDFDocumentProxy,
  pageNum: number,
  canvas: HTMLCanvasElement,
  options?: { scale?: number }
): Promise<void> {
  if (!doc) throw new Error('Documento PDF no disponible');
  if (!canvas) throw new Error('Canvas no disponible');
  
  const page = await doc.getPage(pageNum);
  const container = canvas.parentElement;
  const containerWidth = container?.clientWidth ?? 800;
  
  const pageWidth = (page as unknown as PDFPage).getWidth?.() ?? 595;
  const baseScale = options?.scale ?? (containerWidth / (pageWidth > 0 ? pageWidth : 595));
  const scale = Math.min(Math.max(baseScale, 0.5), 2);
  
  // Increase internal rendering resolution (sharpness when zoomed)
  const pixelRatio = window.devicePixelRatio || 1;
  const renderScale = scale * pixelRatio * 2; // 2x extra resolution for crisp zooming
  
  const renderViewport = page.getViewport({ scale: renderScale });
  const displayViewport = page.getViewport({ scale });
  
  canvas.width = renderViewport.width;
  canvas.height = renderViewport.height;
  canvas.style.width = `${displayViewport.width}px`;
  canvas.style.height = `${displayViewport.height}px`;
  canvas.style.maxWidth = '100%';
  canvas.style.height = 'auto';
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo obtener contexto 2D');
  
  // Guardar la tarea de renderizado en el canvas para poder cancelarla luego
  if ((canvas as any)._renderTask) {
    try {
      (canvas as any)._renderTask.cancel();
    } catch (e) {
      // Ignorar errores al cancelar
    }
  }

  const renderTask = page.render({ canvasContext: ctx, viewport: renderViewport });
  (canvas as any)._renderTask = renderTask;

  try {
    await renderTask.promise;
    (canvas as any)._renderTask = null;
  } catch (err: any) {
    if (err.name === 'RenderingCancelledException' || err.message === 'cancelled') {
      // Ignorar error de cancelación
      return;
    }
    throw err;
  }
}

export function isPdfValid(data: Uint8Array): boolean {
  if (!data || data.length < 5) return false;
  const header = String.fromCharCode(data[0], data[1], data[2], data[3], data[4]);
  return header.startsWith('%PDF');
}

export function getPageDimensions(page: PDFPage): PageDimensions {
  let width = 0;
  let height = 0;
  
  if (typeof page.getWidth === 'function') {
    width = page.getWidth();
    height = page.getHeight!();
  } else if (page.width && page.height) {
    width = page.width;
    height = page.height;
  } else {
    const info = page._pageInfo;
    if (info?.view && info.view.length >= 4) {
      width = info.view[2];
      height = info.view[3];
    } else {
      width = 595;
      height = 841;
    }
  }
  
  return { width, height };
}
