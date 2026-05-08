import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { Layout, Typography, Space, Card, Alert, Button, message } from 'antd';
import { FileDropzone } from '../../components/FileDropzone';
import { useAppStore } from '../../stores/appStore';
import { FileImageOutlined, PlusOutlined } from '@ant-design/icons';
import { loadPdf, renderPage, isPdfValid, type PDFDocumentProxy } from '../../utils/pdfjs';
import { SignatureModal } from '../pdf-editor/SignatureModal';

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
const { Title, Paragraph } = Typography;

let cachedPdfData: Uint8Array | null = null;

function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function AssetPositioner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [canvasDim, setCanvasDim] = useState({ width: 0, height: 0 });

  const pdfFiles = useAppStore(state => state.pdfFiles);
  const overlays = useAppStore(state => state.overlays);
  const clearOverlays = useAppStore(state => state.clearOverlays);
  const isProcessing = useAppStore(state => state.isProcessing);
  const selectedAsset = useAppStore(state => state.selectedAsset);
  
  const currentPageOverlays = overlays.filter(o => o.page === currentPage);
  
  const updateCanvasDim = useCallback(() => {
    if (canvasRef.current) {
      setCanvasDim({
        width: canvasRef.current.clientWidth,
        height: canvasRef.current.clientHeight
      });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(updateCanvasDim);
    observer.observe(canvas);
    updateCanvasDim();
    return () => observer.disconnect();
  }, [updateCanvasDim, currentPage]);

  useEffect(() => {
    if (isProcessing && overlays.length > 0) {
      handleApplyToPdf();
      useAppStore.setState({ isProcessing: false });
    }
  }, [isProcessing, overlays.length]);

  useLayoutEffect(() => {
    if (canvasRef.current && pdfDoc && currentPage > 0) {
      renderPage(pdfDoc, currentPage, canvasRef.current).catch(err => {
        if (err.name === 'RenderingCancelledException') return;
        message.error('Error al renderizar la página');
      });
    }
  }, [canvasRef.current, currentPage, pdfDoc]);

  const handleSelectSignature = (dataUrl: string) => {
    useAppStore.getState().addOverlay({
      x: 50, y: 50, width: 150, height: 75, page: currentPage,
      imageData: dataUrl, type: 'firma' as const,
    });
    setShowSignatureModal(false);
    message.success('Firma agregada a página ' + currentPage);
  };
  
  const handleSelectStamp = (dataUrl: string) => {
    useAppStore.getState().addOverlay({
      x: 50, y: 50, width: 150, height: 150, page: currentPage,
      imageData: dataUrl, type: 'sello' as const,
    });
    setShowSignatureModal(false);
    message.success('Sello agregado a página ' + currentPage);
  };
  
  const [loading, setLoading] = useState(false);
  const [componentError, setComponentError] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startX: number;
    startY: number;
    startOverlayX: number;
    startOverlayY: number;
    overlayIdx: number;
  } | null>(null);
  const [resizeState, setResizeState] = useState<{
    isResizing: boolean;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    overlayIdx: number;
  } | null>(null);

  const loadPdfCallback = useCallback(async () => {
    const storeData = pdfFiles[0]?.data as Uint8Array | undefined;
    let data = storeData || cachedPdfData;
    
    if (!data || data.byteLength === 0) {
      message.error('No hay datos PDF disponibles. Sube un archivo primero.');
      setComponentError('No hay datos PDF disponibles');
      return;
    }

    if (!isPdfValid(data)) {
      message.error('El archivo no es un PDF válido');
      setComponentError('El archivo no es un PDF válido');
      return;
    }
    
    setLoading(true);
    setComponentError(null);
    
    try {
      let canvas = canvasRef.current;
      let attempts = 0;
      while (!canvas && attempts < 20) {
        await new Promise(r => setTimeout(r, 100));
        canvas = canvasRef.current;
        attempts++;
      }
      
      if (!canvas) throw new Error('Canvas no disponible');
      
      const { doc, numPages } = await loadPdf(data);
      cachedPdfData = data;
      setPdfDoc(doc);
      setTotalPages(numPages);
      updateCanvasDim();
    } catch (err: any) {
       console.error('[AssetPositioner] Error loading PDF:', err);
       setComponentError(err.message || 'Error al cargar el PDF');
    } finally {
      setLoading(false);
    }
  }, [pdfFiles, updateCanvasDim]);

  useEffect(() => {
    const storeData = pdfFiles[0]?.data as Uint8Array | undefined;
    if (storeData && storeData.byteLength > 0) {
      loadPdfCallback();
    }
  }, [pdfFiles, loadPdfCallback]);

  const handlePrevPage = () => {
    if (!pdfDoc) {
      message.warning('El PDF no está cargado');
      return;
    }
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (!pdfDoc) {
      message.warning('El PDF no está cargado');
      return;
    }
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, idx: number) => {
    if (!currentPageOverlays[idx]) return;
    const overlay = currentPageOverlays[idx];
    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startOverlayX: overlay.x,
      startOverlayY: overlay.y,
      overlayIdx: idx,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;
    const allOverlays = [...useAppStore.getState().overlays];
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    const globalIdx = allOverlays.findIndex(o => o.page === currentPage && currentPageOverlays.some((co, i) => co === o && i === dragState.overlayIdx));
    if (globalIdx >= 0) {
      allOverlays[globalIdx] = {
        ...allOverlays[globalIdx],
        x: Math.max(0, dragState.startOverlayX + dx),
        y: Math.max(0, dragState.startOverlayY + dy),
      };
      useAppStore.setState({ overlays: allOverlays });
    }
  };

  const handlePointerUp = () => setDragState(null);

  const handleResizeStart = (e: React.PointerEvent, idx: number) => {
    e.stopPropagation();
    if (!currentPageOverlays[idx]) return;
    const overlay = currentPageOverlays[idx];
    setResizeState({
      isResizing: true,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: overlay.width,
      startHeight: overlay.height,
      overlayIdx: idx,
    });
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (!resizeState) return;
    const dx = e.clientX - resizeState.startX;
    const dy = e.clientY - resizeState.startY;
    const allOverlays = [...useAppStore.getState().overlays];
    const globalIdx = allOverlays.findIndex(o => o.page === currentPage && currentPageOverlays.some((co, i) => co === o && i === resizeState.overlayIdx));
    if (globalIdx >= 0) {
      allOverlays[globalIdx] = {
        ...allOverlays[globalIdx],
        width: Math.max(50, resizeState.startWidth + dx),
        height: Math.max(30, resizeState.startHeight + dy),
      };
      useAppStore.setState({ overlays: allOverlays });
    }
  };

  const handleResizeEnd = () => setResizeState(null);

  const handleApplyToPdf = async () => {
    const currentOverlays = useAppStore.getState().overlays;
    if (currentOverlays.length === 0) {
      message.warning('No hay firma para aplicar');
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) {
      message.error('El canvas no está listo');
      return;
    }

    setLoading(true);
    try {
      let pdfData = pdfFiles[0]?.data as Uint8Array | undefined;
      if (!pdfData || pdfData.byteLength === 0) {
        pdfData = cachedPdfData as Uint8Array;
      }
      
      if (!pdfData || pdfData.byteLength === 0) {
        throw new Error('Los datos del PDF están vacíos. Sube el PDF nuevamente.');
      }
      
      if (!isPdfValid(pdfData)) {
        throw new Error('El archivo no es un PDF válido.');
      }
      
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(new Uint8Array(pdfData));
      const pages = pdfDoc.getPages();

      const overlaysByPage = new Map<number, typeof currentOverlays>();
      for (const overlay of currentOverlays) {
        const pageNum = overlay.page || currentPage;
        if (!overlaysByPage.has(pageNum)) overlaysByPage.set(pageNum, []);
        overlaysByPage.get(pageNum)!.push(overlay);
      }

      for (const [pageNum, pageOverlays] of overlaysByPage) {
        const pageIndex = pageNum - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) continue;
        
        const page = pages[pageIndex];
        const cropBox = page.getCropBox();
        const cropX = cropBox.x;
        const cropY = cropBox.y;
        const pageWidth = cropBox.width;
        const pageHeight = cropBox.height;

        for (const overlay of pageOverlays) {
          try {
            const isPng = overlay.imageData.startsWith('data:image/png');
            const imageArrayBuffer = dataUrlToArrayBuffer(overlay.imageData);
            const embeddedImage = isPng
              ? await pdfDoc.embedPng(imageArrayBuffer)
              : await pdfDoc.embedJpg(imageArrayBuffer);

            const overlayX = Number(overlay.x) || 0;
            const overlayY = Number(overlay.y) || 0;
            const overlayW = Number(overlay.width) || 100;
            const overlayH = Number(overlay.height) || 50;

            const pdfWidth = (overlayW / canvasDim.width) * pageWidth;
            const pdfHeight = (overlayH / canvasDim.height) * pageHeight;
            const pdfX = (overlayX / canvasDim.width) * pageWidth + cropX;
            const pdfY = pageHeight - ((overlayY / canvasDim.height) * pageHeight) - pdfHeight + cropY;

            page.drawImage(embeddedImage, { 
              x: pdfX, y: pdfY, width: pdfWidth, height: pdfHeight 
            });
          } catch (imgErr) {
            message.warning(`Error al procesar un elemento en página ${pageNum}`);
          }
        }
      }
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `documento-firmado-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      message.success('PDF descargado correctamente');
      
      clearOverlays();
      useAppStore.setState({ pdfFiles: [], currentPdfPath: null });
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      message.error(`Error al aplicar firma: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Card
      title={
        <Space>
          <span>Vista previa del PDF</span>
          {totalPages > 1 && (
            <>
              <Button size="small" onClick={handlePrevPage} disabled={currentPage <= 1}>
                Anterior
              </Button>
              <span>{currentPage} / {totalPages}</span>
              <Button size="small" onClick={handleNextPage} disabled={currentPage >= totalPages}>
                Siguiente
              </Button>
            </>
          )}
          {totalPages <= 1 && <span style={{ fontSize: 12, color: '#999' }}>(Solo 1 página)</span>}
        </Space>
      }
    extra={
        <Space>
          <Button onClick={() => setShowSignatureModal(true)} icon={<FileImageOutlined />}>
            Cambiar Firma/Sello
          </Button>
          {overlays.length > 0 && (
            <Button onClick={() => setShowSignatureModal(true)} icon={<PlusOutlined />}>
              Agregar otra
            </Button>
          )}
          <Button type="primary" onClick={() => useAppStore.setState({ isProcessing: true })} loading={loading}>
            Descargar PDF
          </Button>
        </Space>
      }
    >
      {componentError ? (
        <Alert type="error" message={componentError} showIcon />
      ) : (
        <div 
          ref={containerRef}
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'auto',
            background: 'var(--ant-color-bg-layout)',
            padding: 16,
            borderRadius: 4,
            minHeight: 400,
          }}
          onPointerMove={(e) => {
            if (dragState) handlePointerMove(e);
            if (resizeState) handleResizeMove(e);
          }}
          onPointerUp={() => {
            if (dragState) handlePointerUp();
            if (resizeState) handleResizeEnd();
          }}
        >
          {pdfFiles.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999' }}>
              <p>Sube un PDF para posicionar la {selectedAsset?.type === 'firma' ? 'firma' : 'sello'}</p>
            </div>
          ) : (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <canvas 
                ref={canvasRef} 
                style={{ display: 'block', maxWidth: '100%', height: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
              />
              
              {currentPageOverlays.map((overlay, idx) => (
                <div
                  key={`overlay-${currentPage}-${idx}`}
                  onPointerDown={(e) => handlePointerDown(e, idx)}
                  style={{
                    position: 'absolute',
                    zIndex: 10,
                    left: overlay.x,
                    top: overlay.y,
                    width: overlay.width,
                    height: overlay.height,
                    border: (dragState?.overlayIdx === idx) ? '2px solid #1890ff' : '2px dashed #94a3b8',
                    cursor: (dragState?.overlayIdx === idx) ? 'grabbing' : 'grab',
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
                      borderRadius: 2,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const allOverlays = useAppStore.getState().overlays;
                      const globalIdx = allOverlays.findIndex(o => o.page === currentPage && currentPageOverlays.some((co, i) => co === o && i === idx));
                      if (globalIdx >= 0) {
                        const otherOverlays = allOverlays.filter((_, i) => i !== globalIdx);
                        useAppStore.setState({ overlays: otherOverlays });
                      }
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
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 10
                    }}
                    onPointerDown={(e) => handleResizeStart(e, idx)}
                  >
                    ↘
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>

    <SignatureModal
      open={showSignatureModal}
      onClose={() => setShowSignatureModal(false)}
      onSelectSignature={handleSelectSignature}
      onSelectStamp={handleSelectStamp}
    />
    </>
  );
}

export function AssetPositionerPage() {
  const selectedAsset = useAppStore(state => state.selectedAsset);
  const pdfFiles = useAppStore(state => state.pdfFiles);
  
  const handleBack = () => {
    const previousModule = selectedAsset?.type === 'firma' ? 'signatures' : 'stamps';
    useAppStore.setState({
      pdfFiles: [],
      overlays: [],
      selectedAsset: null,
    });
    useAppStore.getState().setActiveModule(previousModule);
  };
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--ant-color-bg-container)',
          borderBottom: '1px solid var(--ant-color-border)',
          padding: '0 24px',
        }}
      >
        <Space>
          <Button onClick={handleBack}>← Volver</Button>
          <Title level={4} style={{ margin: 0 }}>
            {selectedAsset ? 
              `Posicionar ${selectedAsset.type === 'firma' ? 'Firma' : 'Sello'}: ${selectedAsset.name}` : 
              'Posicionar Firma/Sello'}
          </Title>
        </Space>
        {pdfFiles.length > 0 && (
          <span style={{ color: 'var(--ant-color-text-secondary)', fontSize: 14 }}>
            {pdfFiles[0]?.name}
          </span>
        )}
      </Header>

      <Content style={{ padding: 24, background: 'var(--ant-color-bg-layout)' }}>
        {selectedAsset && (
          <Alert
            message="📋 Instrucciones"
            description={
              <div>
                <Paragraph>
                  <strong>Firma seleccionada:</strong> {selectedAsset.name} ({selectedAsset.type})
                </Paragraph>
                <Paragraph>
                  <strong>1.</strong> Sube un PDF arrastrándolo o haciendo clic para seleccionarlo<br/>
                  <strong>2.</strong> Usa <strong>"Anterior"</strong> y <strong>"Siguiente"</strong> para navegar a la página donde deseas posicionar<br/>
                  <strong>3.</strong> Arrastra la firma para posicionarla donde desees<br/>
                  <strong>4.</strong> Usa las esquinas para redimensionar<br/>
                  <strong>5.</strong> Click en <strong>"Descargar PDF"</strong> para guardar
                </Paragraph>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {pdfFiles.length === 0 ? (
          <Card title="📄 Subir PDF">
            <FileDropzone />
          </Card>
        ) : (
          <AssetPositioner />
        )}
      </Content>
    </Layout>
  );
}