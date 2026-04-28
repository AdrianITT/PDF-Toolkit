import { PDFDocument } from 'pdf-lib';
import type { PdfMergeRequest } from '../types';

interface MockPdfService {
  getPdfInfo: (fileData: Uint8Array, fileIndex: number) => Promise<unknown>;
  mergePdfs: (request: PdfMergeRequest) => Promise<Uint8Array>;
  extractPages: (fileData: Uint8Array, pagesToKeep: number[]) => Promise<Uint8Array>;
  downloadPdf: (data: Uint8Array, filename: string) => void;
}

function downloadBlob(data: Uint8Array, filename: string) {
  const buffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(buffer).set(data);
  const blob = new Blob([buffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function createMockPdfService(): MockPdfService {
  console.log('[pdf.service] Using MOCK service (dev mode)');
  
  return {
    async getPdfInfo() {
      return { page_count: 1, file_index: 0 };
    },

    async mergePdfs(request: PdfMergeRequest): Promise<Uint8Array> {
      console.log('[pdf.service] Mock mergePdfs called with', request.page_order.length, 'pages from', request.files.length, 'files');
      if (request.files.length === 0) {
        throw new Error('No PDF data provided');
      }

      const mergedPdf = await PDFDocument.create();
      
      for (const pageRef of request.page_order) {
        const fileIndex = pageRef.file_index;
        const pageNum = pageRef.page_number;
        
        console.log('[pdf.service] Processing: fileIndex=', fileIndex, 'pageNum=', pageNum);
        
        if (fileIndex >= request.files.length) {
          throw new Error(`Archivo no encontrado: índice ${fileIndex}`);
        }
        
        const sourcePdf = await PDFDocument.load(request.files[fileIndex]);
        const pageCount = sourcePdf.getPageCount();
        
        console.log('[pdf.service] Source PDF pages:', pageCount);
        
        if (pageNum < 1 || pageNum > pageCount) {
          throw new Error(`Página ${pageNum} no existe en archivo ${fileIndex}. El archivo tiene ${pageCount} páginas.`);
        }
        
        const [copiedPage] = await mergedPdf.copyPages(sourcePdf, [pageNum - 1]);
        mergedPdf.addPage(copiedPage);
      }

      const pdfBytes = await mergedPdf.save();
      console.log('[pdf.service] Merge complete: ', mergedPdf.getPageCount(), 'pages');
      return new Uint8Array(pdfBytes);
    },

    async extractPages(fileData: Uint8Array): Promise<Uint8Array> {
      return fileData;
    },

    downloadPdf,
  };
}

let service: MockPdfService | null = null;

async function getPdfService(): Promise<MockPdfService> {
  if (service) return service;
  
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('get_pdf_info', { fileData: [], fileIndex: 0 });
    
    service = {
      async getPdfInfo(fileData: Uint8Array, fileIndex: number) {
        return invoke('get_pdf_info', { fileData: Array.from(fileData), fileIndex });
      },
      async mergePdfs(request: PdfMergeRequest): Promise<Uint8Array> {
        const { invoke } = await import('@tauri-apps/api/core');
        const result = await invoke<number[]>('merge_pdfs', {
          request: {
            files: request.files.map(f => Array.from(f)),
            page_order: request.page_order,
          }
        });
        return new Uint8Array(result);
      },
      async extractPages(fileData: Uint8Array, pagesToKeep: number[]): Promise<Uint8Array> {
        const { invoke } = await import('@tauri-apps/api/core');
        const result = await invoke<number[]>('extract_pages', {
          fileData: Array.from(fileData),
          pagesToKeep,
        });
        return new Uint8Array(result);
      },
      downloadPdf,
    };
    console.log('[pdf.service] Using REAL Tauri service');
  } catch {
    service = createMockPdfService();
  }
  
  return service;
}

export const getPdfInfo = async (fileData: Uint8Array, fileIndex: number) => {
  const s = await getPdfService();
  return s.getPdfInfo(fileData, fileIndex);
};

export const mergePdfs = async (request: PdfMergeRequest): Promise<Uint8Array> => {
  const s = await getPdfService();
  return s.mergePdfs(request);
};

export const extractPages = async (fileData: Uint8Array, pagesToKeep: number[]) => {
  const s = await getPdfService();
  return s.extractPages(fileData, pagesToKeep);
};

export function downloadPdf(data: Uint8Array, filename: string) {
  if (data.length === 0) {
    console.error('[downloadPdf] No data');
    return;
  }
  downloadBlob(data, filename);
  console.log('[downloadPdf] Downloaded:', filename);
}