import { useState, useRef } from 'react';
import { Card, Button, Upload, Alert, message, Space, Tag, Input } from 'antd';
import { EyeInvisibleOutlined, FilePdfOutlined, DeleteOutlined } from '@ant-design/icons';
import { loadPdf, isPdfValid, renderPage, type PDFDocumentProxy } from '../../utils/pdfjs';

interface RedactItem {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  reason: string;
}

export function RedactPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfFile, setPdfFile] = useState<{ name: string; data: Uint8Array } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [redactions, setRedactions] = useState<RedactItem[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [currentReason, setCurrentReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [canvasDim, setCanvasDim] = useState({ w: 595, h: 841 });
  
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);

  const updateCanvasDim = () => {
    if (canvasRef.current) {
      setCanvasDim({
        w: canvasRef.current.clientWidth,
        h: canvasRef.current.clientHeight
      });
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      
      if (!isPdfValid(data)) {
        message.error('El archivo no es un PDF válido');
        return false;
      }
      
      setPdfFile({ name: file.name, data });
      setRedactions([]);
      
      const { doc, numPages } = await loadPdf(data);
      pdfDocRef.current = doc;
      setTotalPages(numPages);
      setCurrentPage(1);
      
      if (canvasRef.current) {
        await renderPage(doc, 1, canvasRef.current);
        updateCanvasDim();
      }
      
      message.success(`PDF cargado: ${numPages} página(s)`);
    } catch (err) {
      console.error('[Redact] Error:', err);
      message.error('Error al cargar el PDF');
    }
    return false;
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      if (pdfDocRef.current && canvasRef.current) {
        renderPage(pdfDocRef.current, newPage, canvasRef.current).then(() => {
          updateCanvasDim();
        }).catch(console.error);
      }
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      if (pdfDocRef.current && canvasRef.current) {
        renderPage(pdfDocRef.current, newPage, canvasRef.current).then(() => {
          updateCanvasDim();
        }).catch(console.error);
      }
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentPos({ x, y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    setCurrentPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const width = Math.abs(currentPos.x - startPos.x) || 100;
    const height = Math.abs(currentPos.y - startPos.y) || 30;
    const startX = Math.min(startPos.x, currentPos.x);
    const startY = Math.min(startPos.y, currentPos.y);

    const newRedaction: RedactItem = {
      id: `redact-${Date.now()}`,
      page: currentPage,
      x: startX / canvasDim.w,
      y: startY / canvasDim.h,
      width: width / canvasDim.w,
      height: height / canvasDim.h,
      reason: currentReason || 'Información sensible',
    };
    
    setRedactions(prev => [...prev, newRedaction]);
    message.success('Área marcada para redactar');
  };

  const removeRedaction = (id: string) => {
    setRedactions(prev => prev.filter(r => r.id !== id));
    message.info('Redacción eliminada');
  };

  const applyRedactions = async () => {
    if (!pdfFile || redactions.length === 0) {
      message.warning('No hay redacciones para aplicar');
      return;
    }

    setIsProcessing(true);
    try {
      const { PDFDocument, rgb } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(pdfFile.data);
      const pages = pdfDoc.getPages();
      
      message.info('Aplicando redacción... Esto eliminará el contenido');

      // Agrupar redacciones por página
      const redactsByPage = new Map<number, RedactItem[]>();
      for (const redact of redactions) {
        if (!redactsByPage.has(redact.page)) {
          redactsByPage.set(redact.page, []);
        }
        redactsByPage.get(redact.page)!.push(redact);
      }

      for (const [pageNum, pageRedactions] of redactsByPage) {
        const pageIndex = pageNum - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) continue;
        
        const page = pages[pageIndex];
        const cropBox = page.getCropBox();
        const { width: pageWidth, height: pageHeight, x: cropX, y: cropY } = cropBox;
        
        for (const redact of pageRedactions) {
          const x = cropX + (redact.x * pageWidth);
          const yTopDown = redact.y * pageHeight;
          const width = redact.width * pageWidth;
          const height = redact.height * pageHeight;
          const y = (cropY + pageHeight) - yTopDown - height;
          
          page.drawRectangle({
            x,
            y,
            width,
            height,
            color: rgb(0, 0, 0),
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfFile.name.replace('.pdf', '_redacted.pdf');
      link.click();
      URL.revokeObjectURL(url);
      
      message.success('Redacción aplicada. PDF descargado');
    } catch (err) {
      console.error('[Redact] Error:', err);
      message.error('Error al aplicar redacción');
    } finally {
      setIsProcessing(false);
    }
  };

  const pageRedactions = redactions.filter(r => r.page === currentPage);

  return (
    <Card
      title={
        <Space>
          <EyeInvisibleOutlined />
          Redacción (Redact)
        </Space>
      }
      extra={
        <Space>
          <Tag color="blue">{pdfFile ? pdfFile.name : 'No hay PDF'}</Tag>
          {totalPages > 0 && (
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
        </Space>
      }
    >
      <Alert
        type="warning"
        message="¿Qué es la Redacción?"
        description="La redacción oculta permanentemente información sensible en un PDF, reemplazándola con un rectángulo negro. ¡No se puede deshacer!"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Space>
          <Upload
            accept=".pdf"
            showUploadList={false}
            beforeUpload={handleFileUpload}
          >
            <Button icon={<FilePdfOutlined />} loading={isProcessing}>
              {pdfFile ? 'Cambiar PDF' : 'Subir PDF'}
            </Button>
          </Upload>

          <Button
            type="primary"
            icon={<EyeInvisibleOutlined />}
            onClick={applyRedactions}
            loading={isProcessing}
            disabled={!pdfFile || redactions.length === 0}
          >
            Aplicar Redacción y Descargar PDF
          </Button>

          <span style={{ marginLeft: 8, color: '#666' }}>
            {redactions.length} redacción(es) en total
          </span>
        </Space>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Space>
          <span>Motivo:</span>
          <Input
            value={currentReason}
            onChange={e => setCurrentReason(e.target.value)}
            placeholder="Razón de la redacción"
            style={{ width: 200 }}
          />
        </Space>
      </div>

      <div
        ref={containerRef as any}
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          background: '#f5f5f5',
          padding: 16,
          borderRadius: 4,
          minHeight: 400,
        }}
      >
        {!pdfFile ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <EyeInvisibleOutlined style={{ fontSize: 48, color: '#ccc' }} />
            <p>Sube un PDF para comenzar a redactar</p>
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              style={{ maxWidth: '100%', height: 'auto', cursor: 'crosshair', border: '1px solid #ddd' }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
            />
            {/* Draw saved redactions for current page */}
            {pageRedactions.map(r => (
              <div
                key={r.id}
                style={{
                  position: 'absolute',
                  left: (r.x * canvasDim.w) + 16, // add 16px padding of container
                  top: (r.y * canvasDim.h) + 16,
                  width: r.width * canvasDim.w,
                  height: r.height * canvasDim.h,
                  background: 'black',
                  opacity: 0.8,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 10,
                  overflow: 'hidden'
                }}
              >
                CENSURADO
              </div>
            ))}
            {/* Draw current drawing box */}
            {isDrawing && (
              <div
                style={{
                  position: 'absolute',
                  left: Math.min(startPos.x, currentPos.x) + 16,
                  top: Math.min(startPos.y, currentPos.y) + 16,
                  width: Math.abs(currentPos.x - startPos.x),
                  height: Math.abs(currentPos.y - startPos.y),
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid black',
                  pointerEvents: 'none'
                }}
              />
            )}
          </>
        )}
      </div>

      {pageRedactions.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h4>Redacciones en esta página ({pageRedactions.length})</h4>
          <ul style={{ paddingLeft: 20 }}>
            {pageRedactions.map(r => (
              <li key={r.id} style={{ marginBottom: 8 }}>
                <Tag color="red">Redactado</Tag>
                {r.reason}
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeRedaction(r.id)}
                >
                  Eliminar
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!pdfFile && (
        <Alert
          type="warning"
          message="Paso 1: Sube un PDF"
          description="Selecciona un PDF que contenga información sensible para redactar."
          showIcon
        />
      )}

      <Alert
        type="error"
        message="Advertencia: Acción irreversible"
        description="La redacción elimina permanentemente la información. El texto redactado no puede recuperarse. Haz una copia de seguridad antes."
        showIcon
        style={{ marginTop: 16 }}
      />
    </Card>
  );
}
