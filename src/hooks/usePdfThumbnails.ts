/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useCallback } from 'react';

if (typeof (Promise as any).withResolvers !== 'function') {
  (Promise as any).withResolvers = function<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

function createPlaceholderThumbnail(message: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 280;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, 200, 280);
  ctx.strokeStyle = '#ddd';
  ctx.strokeRect(0, 0, 200, 280);
  ctx.fillStyle = '#666';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Vista previa no disponible', 100, 120);
  ctx.font = '10px sans-serif';
  ctx.fillText(message, 100, 150);
  return canvas.toDataURL('image/png');
}

let pdfjsInitPromise: Promise<any> | null = null;

async function initPdfjs(): Promise<any> {
  if (pdfjsInitPromise) return pdfjsInitPromise;
  
  pdfjsInitPromise = (async () => {
    console.log('[usePdfThumbnails] Loading PDF.js legacy...');
    
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    try {
      const workerUrl = new URL(
        'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
        import.meta.url
      );
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerUrl.href;
      console.log('[usePdfThumbnails] Worker from:', workerUrl.href);
    } catch {
      console.log('[usePdfThumbnails] Using CDN worker');
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.mjs';
    }
    
    console.log('[usePdfThumbnails] PDF.js legacy ready');
    return pdfjsLib;
  })();
  
  return pdfjsInitPromise;
}

export function usePdfThumbnails() {
  const cacheRef = useRef<Map<string, string>>(new Map());

  const generateAllThumbnails = useCallback(async (file: File): Promise<string[]> => {
    const cacheKey = `all-${file.name}-${file.size}`;
    if (cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey)!;
      if (cached === '__ERROR__') {
        return [createPlaceholderThumbnail('Error en cache')];
      }
      return cached.split('|');
    }

    console.log('[usePdfThumbnails] Processing:', file.name);
    
    try {
      const pdfjsLib = await initPdfjs();
      const arrayBuffer = await file.arrayBuffer();
      
      console.log('[usePdfThumbnails] Loading PDF...');
      const loadingTask = (pdfjsLib as any).getDocument({
        data: arrayBuffer,
        useSystemFont: true,
      });
      
      const pdf = await loadingTask.promise;
      console.log('[usePdfThumbnails] Pages:', pdf.numPages);
      
      const thumbnails: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.4 });
          
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width) || 200;
          canvas.height = Math.floor(viewport.height) || 280;
          
          const context = canvas.getContext('2d');
          if (!context) {
            thumbnails.push(createPlaceholderThumbnail(`Error pág. ${i}`));
            continue;
          }
          
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          
          await page.render({ canvasContext: context, viewport }).promise;
          thumbnails.push(canvas.toDataURL('image/jpeg', 0.85));
          page.cleanup();
        } catch (pageErr) {
          console.error('[usePdfThumbnails] Page error:', pageErr);
          thumbnails.push(createPlaceholderThumbnail(`Error pág. ${i}`));
        }
      }

      pdf.destroy();
      const result = thumbnails.join('|');
      cacheRef.current.set(cacheKey, result);
      console.log('[usePdfThumbnails] Done:', thumbnails.length);
      return thumbnails;
    } catch (err) {
      console.error('[usePdfThumbnails] Error:', err);
      cacheRef.current.set(cacheKey, '__ERROR__');
      return [createPlaceholderThumbnail('PDF no válido')];
    }
  }, []);

  const getPageCount = useCallback(async (file: File): Promise<number> => {
    try {
      const pdfjsLib = await initPdfjs();
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = (pdfjsLib as any).getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const count = pdf.numPages;
      pdf.destroy();
      return count;
    } catch (err) {
      console.error('[usePdfThumbnails] Count error:', err);
      return 1;
    }
  }, []);

  return {
    generateAllThumbnails,
    getPageCount,
  };
}