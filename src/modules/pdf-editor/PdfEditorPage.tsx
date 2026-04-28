import { useState, useEffect, useRef, useCallback } from 'react';
import { Layout, Typography, Space, Card, Alert, Button, message } from 'antd';
import { FileDropzone } from '../../components/FileDropzone';
import { PdfGrid } from '../../components/PdfGrid';
import { Toolbar } from '../../components/Toolbar';
import { useAppStore } from '../../stores/appStore';

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

const { Header, Content } = Layout;
const { Title } = Typography;

let pdfjsWorkerConfigured = false;
let cachedPdfData: Uint8Array | null = null;
let cachedPdfDoc: any = null;

function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function PdfCanvasViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { pdfFiles, overlay, setOverlay } = useAppStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [componentError, setComponentError] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startX: number;
    startY: number;
    startOverlayX: number;
    startOverlayY: number;
  } | null>(null);
  const [resizeState, setResizeState] = useState<{
    isResizing: boolean;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const initPdfJs = useCallback(async () => {
    if (pdfjsWorkerConfigured) return;
    
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
    pdfjsWorkerConfigured = true;
    console.log('[Editor] PDF.js worker configurado (v4 legacy)');
  }, []);

  const renderPage = async (pdfDoc: any, pageNum: number) => {
    let canvas = canvasRef.current;
    
    if (!canvas) {
      console.log('[Editor] renderPage: Canvas no disponible, esperando...');
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 100));
        canvas = canvasRef.current;
        if (canvas) break;
      }
    }
    
    if (!canvas || !pdfDoc) {
      console.error('[Editor] renderPage: ERROR - canvas:', !!canvas, 'pdfDoc:', !!pdfDoc);
      message.error('Error: Canvas o PDF no disponible');
      return;
    }

    try {
      console.log('[Editor] renderPage: Obteniendo página', pageNum, 'de pdfDoc:', typeof pdfDoc);
      
      let page: any;
      try {
        page = await pdfDoc.getPage(pageNum);
      } catch (pageErr: any) {
        console.error('[Editor] renderPage: ERROR al obtener página:', pageErr.message);
        message.error('Error al obtener página del PDF');
        return;
      }
      
      console.log('[Editor] renderPage: Página obtenida, tipo:', Object.prototype.toString.call(page), 'keys:', Object.keys(page).slice(0, 10));
      
      let pageWidth: number = 0;
      let pageHeight: number = 0;
      
      try {
        // Intento 1: Método getWidth() con try-catch interno
        if (typeof page.getWidth === 'function') {
          try {
            pageWidth = page.getWidth();
            pageHeight = page.getHeight();
            console.log('[Editor] renderPage: Dimensiones via getWidth():', pageWidth, 'x', pageHeight);
          } catch (e) {
            console.log('[Editor] renderPage: getWidth() falló, intentando alternativas...');
          }
        }
        
        // Intento 2: page.get() devuelve Promise
        if (!pageWidth && typeof page.get === 'function') {
          try {
            const pageProxy = await page.get();
            pageWidth = pageProxy.getWidth();
            pageHeight = pageProxy.getHeight();
            console.log('[Editor] renderPage: Dimensiones via page.get():', pageWidth, 'x', pageHeight);
          } catch (e) {
            console.log('[Editor] renderPage: page.get() falló');
          }
        }
        
        // Intento 3: Propiedades directas page.width/height
        if (!pageWidth && page.width && page.height) {
          pageWidth = page.width;
          pageHeight = page.height;
          console.log('[Editor] renderPage: Dimensiones via props directas:', pageWidth, 'x', pageHeight);
        }
        
        // Intento 4: _pageInfo.view [x, y, width, height]
        if (!pageWidth && page._pageInfo?.view?.length >= 4) {
          pageWidth = page._pageInfo.view[2];
          pageHeight = page._pageInfo.view[3];
          console.log('[Editor] renderPage: Dimensiones via _pageInfo.view:', pageWidth, 'x', pageHeight);
        }
        
        // Intento 5: Buscar en transport (PDF.js 4.x)
        if (!pageWidth && page._transport?.commonObjs) {
          try {
            const objs = page._transport.commonObjs;
            const pageKey = Object.keys(objs).find(k => k.startsWith('page'));
            if (pageKey && objs[pageKey]) {
              const pageObj = typeof objs[pageKey].get === 'function' 
                ? await objs[pageKey].get() 
                : objs[pageKey];
              if (pageObj?.width && pageObj?.height) {
                pageWidth = pageObj.width;
                pageHeight = pageObj.height;
                console.log('[Editor] renderPage: Dimensiones via transport:', pageWidth, 'x', pageHeight);
              }
            }
          } catch (e) {
            console.log('[Editor] renderPage: Fallback transport falló');
          }
        }
        
        // Intento 6:默认值 como último recurso
        if (!pageWidth || !pageHeight) {
          pageWidth = 595;
          pageHeight = 841;
          console.warn('[Editor] renderPage: Usando dimensiones por defecto: 595x841 (A4)');
        }
        
        console.log('[Editor] renderPage: Dimensiones finales:', pageWidth, 'x', pageHeight);
      } catch (dimErr: any) {
        console.error('[Editor] renderPage: ERROR obteniendo dimensiones:', dimErr.message);
        message.error('Error al leer dimensiones del PDF');
        return;
      }
      
      console.log('[Editor] renderPage: Dimensiones página:', pageWidth, 'x', pageHeight);
      
      const container = containerRef.current;
      const containerWidth = container?.clientWidth || 800;
      
      const scale = containerWidth / pageWidth;
      const clampedScale = Math.min(Math.max(scale, 0.5), 2);
      
      let viewport: any;
      let renderTask: any;
      
      try {
        viewport = page.getViewport ? page.getViewport({ scale: clampedScale }) : page.getViewport({ scale: clampedScale });
      } catch (vpErr: any) {
        console.error('[Editor] renderPage: ERROR creando viewport:', vpErr.message);
        message.error('Error al crear vista de página');
        return;
      }
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = viewport.width + 'px';
      canvas.style.height = viewport.height + 'px';
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('[Editor] No se pudo obtener contexto 2D');
        return;
      }

      try {
        renderTask = page.render({ canvasContext: ctx, viewport });
        await renderTask.promise;
      } catch (rErr: any) {
        console.error('[Editor] renderPage: ERROR al renderizar:', rErr.message);
        message.error('Error al renderizar la página');
        return;
      }
      
      console.log('[Editor] renderPage: Página renderizada exitosamente', pageNum, 'dims:', canvas.width, 'x', canvas.height);
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('[Editor] Error renderizando página:', err);
      }
    }
  };

  const loadPdf = useCallback(async () => {
    console.log('[Editor] loadPdf: Iniciando validación...');
    
    const storeData = pdfFiles[0]?.data as Uint8Array | undefined;
    console.log('[Editor] loadPdf: Validando store data:', { 
      exists: !!storeData, 
      length: storeData?.byteLength ?? 0,
      cachedLength: cachedPdfData?.byteLength ?? 0 
    });
    
    let data = storeData || cachedPdfData;
    
    if (!data || data.byteLength === 0) {
      console.error('[Editor] loadPdf: ERROR - No hay datos PDF disponibles');
      message.error('No hay datos PDF disponibles. Sube un archivo primero.');
      setComponentError('No hay datos PDF disponibles');
      return;
    }

    // Validar que sea un PDF válido
    const headerCheck = new Uint8Array(data.slice(0, 5));
    const headerStr = String.fromCharCode.apply(null, Array.from(headerCheck));
    if (!headerStr.startsWith('%PDF')) {
      console.error('[Editor] loadPdf: ERROR - Archivo no es PDF válido');
      message.error('El archivo no es un PDF válido');
      setComponentError('El archivo no es un PDF válido');
      return;
    }
    
    console.log('[Editor] loadPdf: Datos validados, tamaño:', data.byteLength);
    setLoading(true);
    setComponentError(null);
    
    try {
      console.log('[Editor] loadPdf: Iniciando carga, data length:', data.byteLength);
      
      // Esperar a que el canvas esté disponible
      let canvas = canvasRef.current;
      let attempts = 0;
      while (!canvas && attempts < 20) {
        console.log('[Editor] loadPdf: Esperando canvas, intento:', attempts + 1);
        await new Promise(r => setTimeout(r, 100));
        canvas = canvasRef.current;
        attempts++;
      }
      
      if (!canvas) {
        console.error('[Editor] loadPdf: Canvas no disponible después de esperar');
        throw new Error('Canvas no disponible');
      }
      
      console.log('[Editor] loadPdf: Canvas disponible');
      
      await initPdfJs();
      
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const sourceBytes = data as Uint8Array;
      // PDF.js transfiere el ArrayBuffer al worker (GetDocRequest); si pasamos el mismo
      // Uint8Array que está en el store, el buffer queda detached y byteLength === 0.
      cachedPdfData = new Uint8Array(sourceBytes);
      const pdfJsBytes = new Uint8Array(sourceBytes);
      const pdfDoc = await pdfjsLib.getDocument({ data: pdfJsBytes }).promise;
      cachedPdfDoc = pdfDoc;
      setTotalPages(pdfDoc.numPages);
      setCurrentPage(1);
      
      console.log('[Editor] loadPdf: PDF cargado, numPages:', pdfDoc.numPages);
      
      await renderPage(pdfDoc, 1);
    } catch (err: any) {
      console.error('[Editor] Error loading PDF:', err);
      setComponentError(err.message || 'Error al cargar el PDF');
      useAppStore.getState().setError(err.message || 'Error al cargar el PDF');
    } finally {
      setLoading(false);
    }
  }, [pdfFiles, initPdfJs]);

  useEffect(() => {
    console.log('[Editor] useEffect triggered, pdfFiles:', pdfFiles.length, 'data?', !!pdfFiles[0]?.data);
    const storeData = pdfFiles[0]?.data as Uint8Array | undefined;
    if (storeData && storeData.byteLength > 0) {
      console.log('[Editor] PDF data from store:', storeData.byteLength);
      loadPdf();
    }
  }, [pdfFiles, loadPdf]);

  const handlePrevPage = () => {
    if (!cachedPdfDoc) {
      console.error('[Editor] handlePrevPage: ERROR - cachedPdfDoc no disponible');
      message.warning('El PDF no está cargado');
      return;
    }
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      console.log('[Editor] handlePrevPage: Cambiando a página', newPage);
      renderPage(cachedPdfDoc, newPage);
    }
  };

  const handleNextPage = () => {
    if (!cachedPdfDoc) {
      console.error('[Editor] handleNextPage: ERROR - cachedPdfDoc no disponible');
      message.warning('El PDF no está cargado');
      return;
    }
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      console.log('[Editor] handleNextPage: Cambiando a página', newPage);
      renderPage(cachedPdfDoc, newPage);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!overlay) return;

    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startOverlayX: overlay.x,
      startOverlayY: overlay.y,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState || !overlay) return;
    
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    
    setOverlay({
      ...overlay,
      x: Math.max(0, dragState.startOverlayX + dx),
      y: Math.max(0, dragState.startOverlayY + dy),
    });
  };

  const handlePointerUp = () => {
    setDragState(null);
  };

  const handleResizeStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!overlay) return;
    
    setResizeState({
      isResizing: true,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: overlay.width,
      startHeight: overlay.height,
    });
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (!resizeState || !overlay) return;
    
    const dx = e.clientX - resizeState.startX;
    const dy = e.clientY - resizeState.startY;
    
    setOverlay({
      ...overlay,
      width: Math.max(50, resizeState.startWidth + dx),
      height: Math.max(30, resizeState.startHeight + dy),
    });
  };

  const handleResizeEnd = () => {
    setResizeState(null);
  };

  const handleApplyToPdf = async () => {
    console.log('[Editor] handleApplyToPdf called');
    console.log('[Editor] pdfFiles:', pdfFiles.length);
    
    if (!overlay) {
      message.warning('No hay firma para aplicar');
      return;
    }
    
    const storeBytes = pdfFiles[0]?.data as Uint8Array | undefined;
    if (!storeBytes || storeBytes.byteLength === 0) {
      if (!cachedPdfData || cachedPdfData.byteLength === 0) {
        message.warning('Sube el PDF primero');
        return;
      }
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      message.error('El canvas no está listo');
      return;
    }

    setLoading(true);
    try {
      let pdfData = pdfFiles[0]?.data as Uint8Array | undefined;
      console.log('[Editor] applyToPdf - store data:', pdfData?.byteLength ?? 'N/A');
      console.log('[Editor] applyToPdf - cachedPdfData:', cachedPdfData?.byteLength ?? 'N/A');
      
      if (!pdfData || pdfData.byteLength === 0) {
        pdfData = cachedPdfData as Uint8Array;
        console.log('[Editor] applyToPdf - fallback to cached, result:', pdfData?.byteLength ?? 'N/A');
      }
      
      if (!pdfData || pdfData.byteLength === 0) {
        throw new Error('Los datos del PDF están vacíos. Sube el PDF nuevamente.');
      }
      
      const bytesForPdfLib = new Uint8Array(pdfData);
      const header = new Uint8Array(bytesForPdfLib.slice(0, 5));
      const headerStr = String.fromCharCode.apply(null, Array.from(header));
      if (!headerStr.startsWith('%PDF')) {
        throw new Error('El archivo no es un PDF válido.');
      }
      
      const { PDFDocument } = await import('pdf-lib');
      
      const pdfDoc = await PDFDocument.load(bytesForPdfLib);
      const pages = pdfDoc.getPages();
      const targetPage = pages[0];
      
      const isPng = overlay.imageData.startsWith('data:image/png');
      let embeddedImage;
      
      const imageArrayBuffer = dataUrlToArrayBuffer(overlay.imageData);
      
      if (isPng) {
        embeddedImage = await pdfDoc.embedPng(imageArrayBuffer);
      } else {
        embeddedImage = await pdfDoc.embedJpg(imageArrayBuffer);
      }
      
      const pageWidth = targetPage.getWidth();
      const pageHeight = targetPage.getHeight();

      const overlayX = Number(overlay.x) || 0;
      const overlayY = Number(overlay.y) || 0;
      const overlayW = Number(overlay.width) || 100;
      const overlayH = Number(overlay.height) || 50;
      
      const scaleX = overlayW / canvas.width;
      const scaleY = overlayH / canvas.height;
      
      const sigWidth = pageWidth * scaleX;
      const sigHeight = pageHeight * scaleY;
      
      const pdfX = (overlayX / canvas.width) * pageWidth;
      const pdfY = pageHeight - ((overlayY / canvas.height) * pageHeight) - sigHeight;
      
      targetPage.drawImage(embeddedImage, {
        x: pdfX,
        y: pdfY,
        width: sigWidth,
        height: sigHeight,
      });
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `documento-firmado-${Date.now()}.pdf`;
      link.click();
      
      URL.revokeObjectURL(url);
      message.success('PDF descargado correctamente');
      
      useAppStore.setState({ overlay: null, pdfFiles: [], currentPdfPath: null });
      
    } catch (err: any) {
      console.error('[Editor] Error applying signature:', err);
      message.error('Error al aplicar firma/sello: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title={
        <Space>
          <span>Vista previa</span>
          {totalPages > 1 && (
            <Button size="small" onClick={handlePrevPage} disabled={currentPage <= 1}>
              Anterior
            </Button>
          )}
          <span>
            {currentPage} / {totalPages}
          </span>
          {totalPages > 1 && (
            <Button size="small" onClick={handleNextPage} disabled={currentPage >= totalPages}>
              Siguiente
            </Button>
          )}
        </Space>
      }
      extra={
        <Button type="primary" onClick={handleApplyToPdf} disabled={loading || !overlay}>
          Descargar PDF
        </Button>
      }
    >
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'auto',
          background: '#f5f5f5',
          padding: 16,
          borderRadius: 4,
          minHeight: 400,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={(e) => {
          if (dragState) handlePointerMove(e);
          if (resizeState) handleResizeMove(e);
        }}
        onPointerUp={() => {
          if (dragState) handlePointerUp();
          if (resizeState) handleResizeEnd();
        }}
      >
        {componentError ? (
          <Alert type="error" message={componentError} showIcon />
        ) : (
          <canvas 
            ref={canvasRef} 
            style={{ display: 'block', maxWidth: '100%', height: 'auto' }} 
          />
        )}
        
        {overlay && (
          <div
            style={{
              position: 'absolute',
              zIndex: 10,
              left: overlay.x,
              top: overlay.y,
              width: overlay.width,
              height: overlay.height,
              border: dragState ? '2px solid #1890ff' : '2px dashed #94a3b8',
              cursor: dragState ? 'grabbing' : 'grab',
              background: 'rgba(255,255,255,0.3)',
              userSelect: 'none',
            }}
          >
            <img
              src={overlay.imageData}
              alt="Firma"
              style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
            />
            <div
              style={{
                position: 'absolute',
                top: -20,
                right: 0,
                background: '#ff4d4f',
                color: 'white',
                cursor: 'pointer',
                padding: '2px 6px',
                fontSize: 12,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setOverlay(null);
              }}
            >
              ✕
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: -20,
                right: 0,
                width: 20,
                height: 20,
                background: '#1890ff',
                cursor: 'se-resize',
              }}
              onPointerDown={handleResizeStart}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

export function PdfEditorPage() {
  const { error, orderedPages, currentPdfPath } = useAppStore();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: '0 24px',
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          {useAppStore.getState().overlay ? 'Posicionar Firma/Sello' : 'Editor PDF - Unir y reordenar páginas'}
        </Title>
        <Space>
          {currentPdfPath && (
            <span style={{ color: '#666', fontSize: 14 }}>
              {currentPdfPath.split('/').pop()}
            </span>
          )}
        </Space>
      </Header>

      <Content style={{ padding: 24, background: '#f5f5f5' }}>
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => useAppStore.getState().setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        {useAppStore.getState().overlay ? (
          <PdfCanvasViewer />
        ) : (
          <>
            <Card
              title="Subir archivos PDF"
              style={{ marginBottom: 16 }}
              extra={<span style={{ color: '#999' }}>Arrastra múltiples PDFs</span>}
            >
              <FileDropzone />
            </Card>

            {orderedPages.length > 0 && (
              <Card
                title="Páginas PDF"
                extra={
                  <span style={{ color: '#999' }}>
                    Arrastra para reordenar
                  </span>
                }
              >
                <Toolbar />
                <PdfGrid />
              </Card>
            )}
          </>
        )}
      </Content>
    </Layout>
  );
}