import { useCallback, useState } from 'react';
import type { PdfFile, PdfPage } from '../types';
import { usePdfThumbnails } from './usePdfThumbnails';

export function useFileUpload(onFilesAdded: (files: PdfFile[]) => void) {
  const { getPageCount, generateAllThumbnails } = usePdfThumbnails();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      console.log('[useFileUpload] No files accepted');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const pdfFiles: PdfFile[] = [];

      for (const file of acceptedFiles) {
        console.log('[useFileUpload] Processing:', file.name, file.size, 'bytes');
        
        const pageCount = await getPageCount(file);
        console.log('[useFileUpload] Pages:', pageCount);
        
        const thumbnails = await generateAllThumbnails(file);
        console.log('[useFileUpload] Thumbnails:', thumbnails.length);

        const fileTimestamp = Date.now();
        const pages: PdfPage[] = thumbnails.map((thumbnail, index) => ({
          id: `${file.name}-${index + 1}-${fileTimestamp}-${index}`,
          fileId: file.name,
          pageNumber: index + 1,
          thumbnail,
          fileName: file.name,
        }));

        const arrayBuffer = await file.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);

        pdfFiles.push({
          id: `${file.name}-${fileTimestamp}`,
          name: file.name,
          data,
          pageCount,
          pages,
        });
      }

      console.log('[useFileUpload] Adding', pdfFiles.length, 'files to store');
      onFilesAdded(pdfFiles);
    } catch (err) {
      console.error('[useFileUpload] Error:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar archivos');
    } finally {
      setIsProcessing(false);
    }
  }, [getPageCount, generateAllThumbnails, onFilesAdded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
    noClick: false,
    noKeyboard: false,
  });

  return {
    getRootProps,
    getInputProps,
    isDragActive,
    isProcessing,
    error,
  };
}

// Import useDropzone
import { useDropzone } from 'react-dropzone';