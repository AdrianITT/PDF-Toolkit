import { useState } from 'react';
import { Card, List, Button, message, Alert, Select, Row, Col, Progress, Tag, Tooltip, Spin } from 'antd';
import {
  InboxOutlined,
  FileTextOutlined,
  SyncOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined
} from '@ant-design/icons';
import { jsPDF } from 'jspdf';

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

interface ConvertFile {
  uid: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'converting' | 'done' | 'error';
  outputName?: string;
  outputUrl?: string;
  error?: string;
  progress: number;
}

type ConversionMode = 'docx-pdf' | 'xlsx-pdf' | 'pptx-pdf' | 'pdf-images' | 'pdf-docx';

const CONVERSION_OPTIONS: { value: ConversionMode; label: string; icon: any; extensions: string[] }[] = [
  { value: 'docx-pdf', label: 'Word → PDF', icon: <FileWordOutlined />, extensions: ['.docx'] },
  { value: 'xlsx-pdf', label: 'Excel → PDF', icon: <FileExcelOutlined />, extensions: ['.xlsx'] },
  { value: 'pptx-pdf', label: 'PowerPoint → PDF', icon: <FilePptOutlined />, extensions: ['.pptx', '.pptx'] },
  { value: 'pdf-images', label: 'PDF → Imágenes', icon: <FileImageOutlined />, extensions: ['.pdf'] },
];

const getFileExtension = (filename: string): string => {
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
  return ext;
};

const getFileType = (filename: string): string => {
  const ext = getFileExtension(filename);
  const types: Record<string, string> = {
    '.docx': 'word', '.doc': 'word',
    '.xlsx': 'excel', '.xls': 'excel',
    '.pptx': 'powerpoint', '.ppt': 'powerpoint',
    '.pdf': 'pdf',
    '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.gif': 'image',
  };
  return types[ext] || 'unknown';
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const cleanTextForPdf = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\t/g, '    ')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[\u200B-\u200F\uFEFF]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
};

const safeDrawText = (pdfPage: any, text: string, options: any, fallbackFont?: any): void => {
    const safeText = cleanTextForPdf(text);
    if (!safeText) return;
    try {
      pdfPage.drawText(safeText, options);
    } catch {
      const simpleText = safeText.replace(/[^\x20-\x7E]/g, '?');
      if (simpleText) {
        pdfPage.drawText(simpleText, { ...options, font: fallbackFont || options.font });
      }
    }
  };

const convertDocxToPdf = async (fileData: Uint8Array, fileName: string): Promise<Uint8Array> => {
  try {
    if (!fileData || fileData.length === 0) {
      throw new Error('Archivo DOCX vacío o corrupto');
    }

    console.log('[Converter] DOCX: Verificando LibreOffice...');

    let hasLibreOffice = false;
    let libreOfficeError = '';
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      hasLibreOffice = await invoke<boolean>('check_libreoffice');
      console.log('[Converter] LibreOffice disponible:', hasLibreOffice);
    } catch (err) {
      libreOfficeError = err instanceof Error ? err.message : 'Error desconocido';
      console.log('[Converter] Error verificando LibreOffice:', libreOfficeError);
    }

    if (hasLibreOffice) {
      console.log('[Converter] DOCX: Convirtiendo con LibreOffice...');

      try {
        const tempDir = '/tmp';
        const inputFileName = `input_${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const outputFileName = fileName.replace(/\.(docx|doc)$/i, '.pdf');

        const inputPath = `${tempDir}/${inputFileName}`;
        const { writeFile } = await import('@tauri-apps/plugin-fs');
        await writeFile(inputPath, Array.from(fileData) as unknown as Uint8Array);

        const { invoke } = await import('@tauri-apps/api/core');
        const outputPath = await invoke<string>('convert_to_pdf', {
          inputPath,
          outputFilename: outputFileName
        });

        console.log('[Converter] DOCX: PDF generado en:', outputPath);

        const { readFile } = await import('@tauri-apps/plugin-fs');
        const pdfData = await readFile(outputPath);
        const pdfBytes = new Uint8Array(pdfData);

        console.log('[Converter] DOCX: PDF generado con LibreOffice, tamaño:', pdfBytes.length);
        return pdfBytes;
      } catch (loErr) {
        console.error('[Converter] Error con LibreOffice, usando fallback:', loErr);
        hasLibreOffice = false;
      }
    }

    console.log('[Converter] DOCX: LibreOffice no disponible o falló, usando conversión alternativa...');

    const mammothLib = await import('mammoth');
    const newBuffer = new ArrayBuffer(fileData.length);
    new Uint8Array(newBuffer).set(fileData);

    const result = await mammothLib.convertToHtml({ arrayBuffer: newBuffer });
    const html = result.value;

    console.log('[Converter] DOCX: HTML extraído, longitud:', html.length);

    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();

    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const italicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 50;
    const lineHeight = 14;
    const maxImageWidth = pageWidth - (margin * 2);
    const maxImageHeight = 300;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const wrapText = (text: string, pdfFont: any, fontSize: number, maxWidth: number): string[] => {
      if (!text || text.length === 0) return [];
      const lines: string[] = [];
      let currentLine = '';

      const words = text.split(' ');
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        let width: number;

        try {
          width = pdfFont.widthOfTextAtSize(testLine, fontSize);
        } catch {
          width = testLine.length * fontSize * 0.6;
        }

        if (width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      return lines.length > 0 ? lines : [text];
    };

    const addNewPageIfNeeded = (requiredHeight: number): void => {
      if (y - requiredHeight < margin) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
    };

    const processHtmlContent = async (htmlContent: string): Promise<void> => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;

      let currentBold = false;
      let currentItalic = false;
      let inList = false;
      let listItemText = '';

      const flushListItem = () => {
        if (listItemText) {
          addNewPageIfNeeded(lineHeight);
          const cleanText = cleanTextForPdf(listItemText);
          if (cleanText) {
            const fontToUse = currentBold ? boldFont : (currentItalic ? italicFont : font);
            const lines = wrapText(cleanText, fontToUse, 12, pageWidth - (margin * 2));
            for (const line of lines) {
              if (y - lineHeight < margin) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                y = pageHeight - margin;
              }
              try {
                page.drawText(line, {
                  x: margin,
                  y,
                  size: 12,
                  font: fontToUse,
                  color: rgb(0, 0, 0),
                });
              } catch {
                const safeLine = cleanTextForPdf(line);
                page.drawText(safeLine, {
                  x: margin,
                  y,
                  size: 12,
                  font,
                  color: rgb(0, 0, 0),
                });
              }
              y -= lineHeight;
            }
          }
          listItemText = '';
        }
      };

      const processNode = async (node: Node): Promise<void> => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || '';
          if (inList) {
            listItemText += text;
          } else if (text.trim()) {
            addNewPageIfNeeded(lineHeight);
            const cleanText = cleanTextForPdf(text);
            if (cleanText) {
              const fontToUse = currentBold ? boldFont : (currentItalic ? italicFont : font);
              const lines = wrapText(cleanText, fontToUse, 12, pageWidth - (margin * 2));
              for (const lineText of lines) {
                if (y - lineHeight < margin) {
                  page = pdfDoc.addPage([pageWidth, pageHeight]);
                  y = pageHeight - margin;
                }
                safeDrawText(page, lineText, {
                  x: margin,
                  y,
                  size: 12,
                  font: fontToUse,
                  color: rgb(0, 0, 0),
                }, font);
                y -= lineHeight;
              }
            }
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          const tagName = element.tagName.toLowerCase();

          if (tagName === 'strong' || tagName === 'b') {
            currentBold = true;
          } else if (tagName === 'em' || tagName === 'i') {
            currentItalic = true;
          } else if (tagName === 'br') {
            if (inList) {
              listItemText += ' ';
            } else {
              y -= lineHeight * 0.5;
            }
          } else if (tagName === 'p' || tagName === 'div') {
            if (inList) {
              flushListItem();
            } else {
              y -= lineHeight * 0.5;
            }
          } else if (tagName === 'h1') {
            if (!inList) y -= lineHeight;
            addNewPageIfNeeded(lineHeight * 2);
            const hText = cleanTextForPdf(element.textContent || '');
            if (hText) {
              const lines = wrapText(hText, boldFont, 18, pageWidth - (margin * 2));
              for (const line of lines) {
                safeDrawText(page, line, {
                  x: margin,
                  y,
                  size: 18,
                  font: boldFont,
                  color: rgb(0, 0, 0),
                }, boldFont);
                y -= lineHeight * 1.5;
              }
            }
            if (!inList) y -= lineHeight;
          } else if (tagName === 'h2') {
            if (!inList) y -= lineHeight;
            addNewPageIfNeeded(lineHeight * 1.5);
            const h2Text = cleanTextForPdf(element.textContent || '');
            if (h2Text) {
              const lines = wrapText(h2Text, boldFont, 16, pageWidth - (margin * 2));
              for (const line of lines) {
                safeDrawText(page, line, {
                  x: margin,
                  y,
                  size: 16,
                  font: boldFont,
                  color: rgb(0, 0, 0),
                }, boldFont);
                y -= lineHeight * 1.3;
              }
            }
            if (!inList) y -= lineHeight * 0.5;
          } else if (tagName === 'h3') {
            addNewPageIfNeeded(lineHeight * 1.2);
            const h3Text = cleanTextForPdf(element.textContent || '');
            if (h3Text) {
              const lines = wrapText(h3Text, boldFont, 14, pageWidth - (margin * 2));
              for (const line of lines) {
                safeDrawText(page, line, {
                  x: margin,
                  y,
                  size: 14,
                  font: boldFont,
                  color: rgb(0, 0, 0),
                }, boldFont);
                y -= lineHeight * 1.2;
              }
            }
            y -= lineHeight * 0.5;
          } else if (tagName === 'ul' || tagName === 'ol') {
            inList = true;
            listItemText = '';
          } else if (tagName === 'li') {
            flushListItem();
            listItemText = '• ';
          } else if (tagName === 'img') {
            const src = element.getAttribute('src') || '';
            const altText = cleanTextForPdf(element.getAttribute('alt') || 'Imagen');

            if (src.startsWith('data:image')) {
              try {
                const base64Data = src.split(',')[1];
                if (base64Data) {
                  const binaryString = atob(base64Data);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }

                  let image;
                  if (src.includes('image/png')) {
                    image = await pdfDoc.embedPng(bytes);
                  } else {
                    image = await pdfDoc.embedJpg(bytes);
                  }

                  const imgDims = image.scale(1);
                  let imgWidth = imgDims.width;
                  let imgHeight = imgDims.height;

                  if (imgWidth > maxImageWidth) {
                    const ratio = maxImageWidth / imgWidth;
                    imgWidth = maxImageWidth;
                    imgHeight = imgHeight * ratio;
                  }
                  if (imgHeight > maxImageHeight) {
                    const ratio = maxImageHeight / imgHeight;
                    imgHeight = maxImageHeight;
                    imgWidth = imgWidth * ratio;
                  }

                  addNewPageIfNeeded(imgHeight + lineHeight);

                  page.drawImage(image, {
                    x: margin,
                    y: y - imgHeight,
                    width: imgWidth,
                    height: imgHeight,
                  });

                  y -= imgHeight + lineHeight;
                  console.log('[Converter] DOCX: Imagen base64 añadida');
                }
              } catch (base64Err) {
                console.error('[Converter] Error con imagen base64:', base64Err);
                y -= lineHeight;
              }
            } else {
              addNewPageIfNeeded(lineHeight);
              page.drawText(`[Imagen: ${altText}]`, {
                x: margin,
                y,
                size: 10,
                font: italicFont,
                color: rgb(0.5, 0.5, 0.5),
              });
              y -= lineHeight;
            }
          }

          for (const child of Array.from(node.childNodes)) {
            await processNode(child);
          }

          if (tagName === 'strong' || tagName === 'b') {
            currentBold = false;
          } else if (tagName === 'em' || tagName === 'i') {
            currentItalic = false;
          } else if (tagName === 'ul' || tagName === 'ol') {
            flushListItem();
            inList = false;
          }
        }
      };

      for (const child of Array.from(tempDiv.childNodes)) {
        await processNode(child);
      }

      if (inList) {
        flushListItem();
      }
    };

    await processHtmlContent(html);

    console.log('[Converter] DOCX: Generando PDF con pdf-lib, páginas:', pdfDoc.getPageCount());

    const pdfBytes = await pdfDoc.save();
    console.log('[Converter] DOCX: PDF generado, tamaño:', pdfBytes.length);

    return new Uint8Array(pdfBytes);
  } catch (error) {
    console.error('[Converter] Error DOCX→PDF:', error);
    throw new Error('No se pudo convertir el archivo DOCX: ' + (error instanceof Error ? error.message : 'Error desconocido'));
  }
};

const convertXlsxToPdf = async (fileData: Uint8Array): Promise<Uint8Array> => {
  try {
    if (!fileData || fileData.length === 0) {
      throw new Error('Archivo XLSX vacío o corrupto');
    }
    
    console.log('[Converter] XLSX: Leyendo archivo, tamaño:', fileData.length);
    
    const XLSX = await import('xlsx');
    const newBuffer = new ArrayBuffer(fileData.length);
    new Uint8Array(newBuffer).set(fileData);
    const workbook = XLSX.read(newBuffer, { type: 'array' });
    console.log('[Converter] XLSX: Hojas encontradas:', workbook.SheetNames.length);
    
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    let y = margin;
    
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      if (y + 20 > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      
      doc.setFontSize(14);
      doc.text(sheetName, margin, y);
      y += 10;
      
      doc.setFontSize(8);
      if (data.length > 0) {
        const headers = Object.keys(data[0] as object);
        let x = margin;
        
        for (const header of headers.slice(0, 8)) {
          if (x + 25 > pageWidth - margin) break;
          doc.text(String(header).slice(0, 10), x, y);
          x += 25;
        }
        y += 5;
        
        for (const row of data.slice(0, 50)) {
          if (y + 5 > pageHeight - margin) break;
          x = margin;
          for (const header of headers.slice(0, 8)) {
            if (x + 25 > pageWidth - margin) break;
            const val = (row as Record<string, unknown>)[header];
            doc.text(String(val).slice(0, 10), x, y);
            x += 25;
          }
          y += 5;
        }
      }
      
y += 15;
    }
    
    console.log('[Converter] XLSX: Generando PDF, páginas:', doc.getNumberOfPages());
    
    const blob = doc.output('blob');
    const arrayBuffer = await blob.arrayBuffer();
    const pdfBytes = new Uint8Array(new Uint8Array(arrayBuffer));
    console.log('[Converter] XLSX: PDF generado, tamaño:', pdfBytes.length);
    
    return pdfBytes;
  } catch (error) {
    console.error('[Converter] Error XLSX→PDF:', error);
    throw new Error('No se pudo convertir el archivo Excel');
  }
};

const convertPdfToImages = async (fileData: Uint8Array): Promise<string[]> => {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdfDoc = await pdfjsLib.getDocument({ data: fileData }).promise;
    const numPages = pdfDoc.numPages;
    const imageUrls: string[] = [];
    
    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      
      await page.render({ canvasContext: ctx, viewport }).promise;
      imageUrls.push(canvas.toDataURL('image/png'));
    }
    
    return imageUrls;
  } catch (error) {
    console.error('[Converter] Error PDF→Images:', error);
    throw new Error('No se pudo convertir el PDF a imágenes');
  }
};

export function ConverterPage() {
  const [files, setFiles] = useState<ConvertFile[]>([]);
  const [conversionMode, setConversionMode] = useState<ConversionMode>('docx-pdf');
  const [isConverting, setIsConverting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversionStats, setConversionStats] = useState({ done: 0, error: 0, total: 0 });
  const [fileDataMap, setFileDataMap] = useState<Map<string, Uint8Array>>(new Map());

  const getAcceptedExtensions = (): string[] => {
    const mode = CONVERSION_OPTIONS.find(m => m.value === conversionMode);
    return mode?.extensions || [];
  };

  const handleFileAdd = async (fileList: FileList | null) => {
    if (!fileList) return;

    const acceptedExts = getAcceptedExtensions();
    const validFiles = Array.from(fileList).filter(file => {
      const ext = getFileExtension(file.name).toLowerCase();
      return acceptedExts.includes(ext);
    });

    if (validFiles.length === 0) {
      message.warning(`Solo se aceptan archivos: ${acceptedExts.join(', ')}`);
      return;
    }

    setIsLoading(true);
    console.log('[Converter] Leyendo archivos...');

    try {
      for (const file of validFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const uid = `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newFile: ConvertFile = {
          uid,
          name: file.name,
          size: file.size,
          type: getFileType(file.name),
          status: 'pending',
          progress: 0,
        };

        setFiles(prev => [...prev, newFile]);
        setFileDataMap(prev => new Map(prev).set(uid, data));
      }

      console.log('[Converter] Archivos agregados:', validFiles.length);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = (uid: string) => {
    setFiles(prev => prev.filter(f => f.uid !== uid));
    setFileDataMap(prev => {
      const newMap = new Map(prev);
      newMap.delete(uid);
      return newMap;
    });
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'done'));
  };

  const updateFileStatus = (uid: string, updates: Partial<ConvertFile>) => {
    setFiles(prev => prev.map(f => f.uid === uid ? { ...f, ...updates } : f));
  };

  const convertSingleFile = async (file: ConvertFile, fileData: Uint8Array): Promise<void> => {
    console.log('[Converter] Iniciando conversión:', file.name);
    updateFileStatus(file.uid, { status: 'converting', progress: 10 });

    try {
      updateFileStatus(file.uid, { progress: 20 });

      let outputName = '';
      let outputBlob: Blob;
      
      if (conversionMode === 'docx-pdf') {
        outputName = file.name.replace(/\.(docx|doc)$/i, '.pdf');
        console.log('[Converter] Convirtiendo DOCX → PDF...');

        const pdfBytes = await convertDocxToPdf(fileData, file.name);
        console.log('[Converter] PDF generado, tamaño:', pdfBytes.length);
        const bufferCopy = new ArrayBuffer(pdfBytes.length);
        const view = new Uint8Array(bufferCopy);
        view.set(pdfBytes);
        outputBlob = new Blob([bufferCopy], { type: 'application/pdf' });

      } else if (conversionMode === 'xlsx-pdf') {
        outputName = file.name.replace(/\.(xlsx|xls)$/i, '.pdf');
        console.log('[Converter] Convirtiendo XLSX → PDF...');
        
        const pdfBytes = await convertXlsxToPdf(fileData);
        console.log('[Converter] PDF generado, tamaño:', pdfBytes.length);
        const bufferCopy = new ArrayBuffer(pdfBytes.length);
        const view = new Uint8Array(bufferCopy);
        view.set(pdfBytes);
        outputBlob = new Blob([bufferCopy], { type: 'application/pdf' });
        
      } else if (conversionMode === 'pptx-pdf') {
        outputName = file.name.replace(/\.(pptx|ppt)$/i, '.pdf');
        console.log('[Converter] PowerPoint → PDF (limitado)');
        
        message.warning('PowerPoint requiere LibreOffice. Convirtiendo a texto...');
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Archivo: ' + file.name, 10, 20);
        doc.setFontSize(12);
        doc.text('Nota: La conversión completa de PPTX requiere LibreOffice.', 10, 30);
        doc.text('Este es un archivo PDF básico basado en metadatos.', 10, 40);
        
        outputBlob = doc.output('blob');
        
      } else if (conversionMode === 'pdf-images') {
        outputName = file.name.replace(/\.pdf$/i, '.png');
        console.log('[Converter] Convirtiendo PDF → Imágenes...');
        
        const imageUrls = await convertPdfToImages(fileData);
        
        if (imageUrls.length > 0) {
          const link = document.createElement('a');
          link.download = `page-1-${file.name.replace('.pdf', '.png')}`;
          link.href = imageUrls[0];
          link.click();
          
          message.success(`${imageUrls.length} página(s) extraída(s)`);
        }
        
        updateFileStatus(file.uid, { status: 'done', progress: 100, outputName: `${imageUrls.length} imágenes` });
        return;
        
      } else {
        throw new Error('Modo de conversión no soportado');
      }
      
      updateFileStatus(file.uid, { progress: 80 });
      
      const url = URL.createObjectURL(outputBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = outputName;
      link.click();
      URL.revokeObjectURL(url);
      
      updateFileStatus(file.uid, { status: 'done', progress: 100, outputName });
      console.log('[Converter] Conversión completada:', outputName);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('[Converter] Error:', errorMsg);
      updateFileStatus(file.uid, { status: 'error', error: errorMsg, progress: 0 });
    }
  };

  const convertAll = async () => {
    const pending = files.filter(f => f.status === 'pending');
    if (pending.length === 0) {
      message.warning('No hay archivos pendientes');
      return;
    }

    setIsConverting(true);
    setConversionStats({ done: 0, error: 0, total: pending.length });

    console.log('[Converter] Iniciando conversión masiva, archivos:', pending.length);

    for (let i = 0; i < pending.length; i++) {
      const file = pending[i];
      const fileData = fileDataMap.get(file.uid);
      
      if (fileData) {
        await convertSingleFile(file, fileData);
      } else {
        const errorMsg = 'Archivo no disponible';
        console.error('[Converter] Error:', errorMsg);
        updateFileStatus(file.uid, { status: 'error', error: errorMsg });
      }
      
      setConversionStats(prev => ({
        ...prev,
        done: prev.done + 1,
      }));
    }

    setIsConverting(false);
    
    const successCount = files.filter(f => f.status === 'done').length;
    const errorCount = files.filter(f => f.status === 'error').length;
    
    if (errorCount > 0) {
      message.warning(`Completado: ${successCount} exitosos, ${errorCount} fallidos`);
    } else {
      message.success(`${successCount} archivo(s) convertido(s)`);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'word': return <FileWordOutlined style={{ color: '#2b579a' }} />;
      case 'excel': return <FileExcelOutlined style={{ color: '#217346' }} />;
      case 'powerpoint': return <FilePptOutlined style={{ color: '#d24726' }} />;
      case 'pdf': return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
      default: return <FileTextOutlined />;
    }
  };

  return (
    <Card
      title={
        <span>
          <SyncOutlined style={{ marginRight: 8 }} />
          Conversor de Archivos
        </span>
      }
      extra={
        <Tag color="green">
          ✓ Conversor Local
        </Tag>
      }
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Alert
            type="info"
            message="Modo de conversión"
            description={
              <div style={{ marginTop: 8 }}>
                <Select
                  value={conversionMode}
                  onChange={setConversionMode}
                  style={{ width: 200 }}
                  disabled={isConverting}
                >
                  {CONVERSION_OPTIONS.map(opt => (
                    <Select.Option key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            }
          />
        </Col>
      </Row>

      <div
        style={{
          border: '2px dashed #d9d9d9',
          borderRadius: 8,
          padding: 40,
          textAlign: 'center',
          marginBottom: 16,
          cursor: 'pointer',
          background: isLoading ? '#f0f5ff' : '#fafafa',
          opacity: isLoading ? 0.8 : 1,
          minHeight: 120,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onClick={() => !isLoading && (() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.accept = getAcceptedExtensions().join(',');
          input.onchange = () => handleFileAdd(input.files);
          input.click();
        })()}
      >
        {isLoading ? (
          <>
            <Spin size="large" />
            <p style={{ fontSize: 14, marginTop: 8, color: '#1890ff' }}>
              Cargando archivos...
            </p>
          </>
        ) : (
          <>
            <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            <p style={{ fontSize: 16, marginTop: 8 }}>
              Arrastra archivos {getAcceptedExtensions().join(', ')} aquí
            </p>
            <p style={{ color: '#999', fontSize: 12 }}>
              o haz clic para seleccionar
            </p>
          </>
        )}
      </div>

      {files.length > 0 && (
        <>
          <List
            size="small"
            dataSource={files}
            renderItem={(file) => (
              <List.Item
                actions={[
                  file.status === 'done' && (
                    <Tooltip title="Descargar">
                      <Button type="link" size="small">
                        Descargar
                      </Button>
                    </Tooltip>
                  ),
                  <Button
                    type="text"
                    danger
                    size="small"
                    onClick={() => removeFile(file.uid)}
                    disabled={file.status === 'converting'}
                  >
                    ✕
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{ position: 'relative' }}>
                      {getFileIcon(file.type)}
                      {file.status === 'converting' && (
                        <Progress
                          type="circle"
                          percent={file.progress}
                          size={40}
                          style={{ position: 'absolute', left: -5, top: -5 }}
                        />
                      )}
                    </div>
                  }
                  title={
                    <span>
                      {file.name}
                      <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>
                        ({formatFileSize(file.size)})
                      </span>
                    </span>
                  }
                  description={
                    <span>
                      {file.status === 'converting' && 'Convirtiendo...'}
                      {file.status === 'done' && (
                        <Tag color="green">✓ Listo: {file.outputName}</Tag>
                      )}
                      {file.status === 'error' && (
                        <Tag color="red">✕ Error: {file.error}</Tag>
                      )}
                      {file.status === 'pending' && 'Pendiente'}
                    </span>
                  }
                />
              </List.Item>
            )}
          />

          <Row gutter={8} style={{ marginTop: 16 }}>
            <Col>
              <Button
                type="primary"
                icon={<SyncOutlined />}
                onClick={convertAll}
                loading={isConverting}
                disabled={files.filter(f => f.status === 'pending').length === 0}
              >
                Convertir {files.filter(f => f.status === 'pending').length} archivo(s)
              </Button>
            </Col>
            <Col>
              <Button
                onClick={clearCompleted}
                disabled={files.filter(f => f.status !== 'done').length === files.length}
              >
                Limpiar completados
              </Button>
            </Col>
            <Col>
              <Button
                danger
                onClick={() => setFiles([])}
                disabled={files.length === 0}
              >
                Limpiar todo
              </Button>
            </Col>
          </Row>

          {isConverting && (
            <Progress
              percent={Math.round((conversionStats.done / conversionStats.total) * 100)}
              status="active"
              style={{ marginTop: 16 }}
            />
          )}
        </>
      )}
    </Card>
  );
}