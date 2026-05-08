import { describe, it, expect, vi } from 'vitest';
import { isPdfValid, getPageDimensions, loadPdf, renderPage } from '../pdfjs';

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => {
  const mockDoc = {
    numPages: 2,
    getPage: vi.fn(),
    destroy: vi.fn(),
  };
  return {
    default: {
      GlobalWorkerOptions: { workerSrc: '' },
      getDocument: () => ({ promise: Promise.resolve(mockDoc) }),
    },
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: () => ({ promise: Promise.resolve(mockDoc) }),
  };
});

describe('isPdfValid', () => {
  it('returns true for valid PDF header', () => {
    const data = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]);
    expect(isPdfValid(data)).toBe(true);
  });

  it('returns false for empty data', () => {
    expect(isPdfValid(new Uint8Array([]))).toBe(false);
  });

  it('returns false for data shorter than 5 bytes', () => {
    expect(isPdfValid(new Uint8Array([0x25, 0x50, 0x44]))).toBe(false);
  });

  it('returns false for non-PDF header', () => {
    const data = new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F]);
    expect(isPdfValid(data)).toBe(false);
  });

  it('returns false for null data', () => {
    expect(isPdfValid(null as unknown as Uint8Array)).toBe(false);
  });

  it('returns false for undefined data', () => {
    expect(isPdfValid(undefined as unknown as Uint8Array)).toBe(false);
  });
});

describe('getPageDimensions', () => {
  it('returns dimensions using getWidth/getHeight', () => {
    const page = { getWidth: () => 612, getHeight: () => 792 };
    const dims = getPageDimensions(page as any);
    expect(dims.width).toBe(612);
    expect(dims.height).toBe(792);
  });

  it('returns dimensions from width/height properties', () => {
    const page = { width: 800, height: 600 };
    const dims = getPageDimensions(page as any);
    expect(dims.width).toBe(800);
    expect(dims.height).toBe(600);
  });

  it('returns dimensions from _pageInfo.view', () => {
    const page = { _pageInfo: { view: [0, 0, 595, 841] } };
    const dims = getPageDimensions(page as any);
    expect(dims.width).toBe(595);
    expect(dims.height).toBe(841);
  });

  it('returns default dimensions when no info available', () => {
    const page = {};
    const dims = getPageDimensions(page as any);
    expect(dims.width).toBe(595);
    expect(dims.height).toBe(841);
  });

  it('handles page with null _pageInfo', () => {
    const page = { _pageInfo: null };
    const dims = getPageDimensions(page as any);
    expect(dims.width).toBe(595);
    expect(dims.height).toBe(841);
  });
});

describe('loadPdf', () => {
  it('loads a valid PDF', async () => {
    const data = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]);
    const result = await loadPdf(data);
    expect(result).toHaveProperty('doc');
    expect(result).toHaveProperty('numPages');
    expect(result.numPages).toBe(2);
  });

  it('throws on empty data', async () => {
    await expect(loadPdf(new Uint8Array([]))).rejects.toThrow('No se proporcionaron datos PDF válidos');
  });

  it('throws on null data', async () => {
    await expect(loadPdf(null as unknown as Uint8Array)).rejects.toThrow('No se proporcionaron datos PDF válidos');
  });

  it('throws on invalid PDF header', async () => {
    const data = new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F]);
    await expect(loadPdf(data)).rejects.toThrow('El archivo no es un PDF válido');
  });
});

describe('renderPage', () => {
  it('throws when document is null', async () => {
    const canvas = document.createElement('canvas');
    await expect(renderPage(null as any, 1, canvas)).rejects.toThrow('Documento PDF no disponible');
  });

  it('throws when canvas is null', async () => {
    const mockDoc = { numPages: 1 } as any;
    await expect(renderPage(mockDoc, 1, null as any)).rejects.toThrow('Canvas no disponible');
  });

  it('renders a page to canvas', async () => {
    const mockPage = {
      getViewport: () => ({ width: 595, height: 841 }),
      render: ({ canvasContext }: any) => {
        canvasContext.fillStyle = '#fff';
        canvasContext.fillRect(0, 0, 595, 841);
        return { promise: Promise.resolve() };
      },
    };
    const mockDoc = {
      numPages: 2,
      getPage: vi.fn().mockResolvedValue(mockPage),
    };
    const canvas = document.createElement('canvas');
    canvas.style.width = '800px';

    await renderPage(mockDoc as any, 1, canvas);
    expect(mockDoc.getPage).toHaveBeenCalledWith(1);
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
  });
});
