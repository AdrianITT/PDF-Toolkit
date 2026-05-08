import { useState, useRef } from 'react';
import { Card, Button, Space, Radio, Input, message, Alert, Tag, Upload } from 'antd';
import { HighlightOutlined, FileTextOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { loadPdf, renderPage, isPdfValid, type PDFDocumentProxy } from '../../utils/pdfjs';

type AnnotationType = 'highlight' | 'underline' | 'note';
type AnnotationColor = 'yellow' | 'green' | 'blue' | 'pink';

interface Annotation {
  id: string;
  page: number;
  type: AnnotationType;
  color: AnnotationColor;
  text?: string;
  note?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function AnnotationsPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [pdfFile, setPdfFile] = useState<{ name: string; data: Uint8Array } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedType, setSelectedType] = useState<AnnotationType>('highlight');
  const [selectedColor, setSelectedColor] = useState<AnnotationColor>('yellow');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [currentNote, setCurrentNote] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoom, setZoom] = useState(1);
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
      setAnnotations([]);
      
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
      console.error('[Annotations] Error:', err);
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
        }).catch(err => {
          console.error('[Annotations] Error:', err);
        });
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
        }).catch(err => {
          console.error('[Annotations] Error:', err);
        });
      }
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const canvasRect = canvas.getBoundingClientRect();
    const x = (e.clientX - canvasRect.left) / zoom;
    const y = (e.clientY - canvasRect.top) / zoom;
    
    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentPos({ x, y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const canvasRect = canvas.getBoundingClientRect();
    setCurrentPos({
      x: (e.clientX - canvasRect.left) / zoom,
      y: (e.clientY - canvasRect.top) / zoom
    });
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    if (selectedType === 'note') {
      setShowNoteModal(true);
    } else {
      addAnnotation();
    }
  };

  const addAnnotation = (note?: string) => {
    if (!startPos || !canvasRef.current) return;
    
    const endX = currentPos.x;
    const endY = currentPos.y;
    
    const w = Math.abs(endX - startPos.x);
    const h = Math.abs(endY - startPos.y);

    // If click without drag, use default small sizes
    const finalWidth = w > 5 ? w : (selectedType === 'note' ? 20 : 100);
    const finalHeight = selectedType === 'underline' ? 2 : (h > 5 ? h : 20);
    
    const x = Math.min(startPos.x, endX);
    const y = selectedType === 'underline' ? startPos.y : Math.min(startPos.y, endY);
    
    const newAnnotation: Annotation = {
      id: `ann-${Date.now()}`,
      page: currentPage,
      type: selectedType,
      color: selectedColor,
      text: `Texto resaltado en página ${currentPage}`,
      x: x / canvasDim.w,
      y: y / canvasDim.h,
      width: finalWidth / canvasDim.w,
      height: finalHeight / canvasDim.h,
      note: note,
    };
    
    setAnnotations(prev => [...prev, newAnnotation]);
    message.success('Anotación agregada');
  };

  const handleSaveNote = () => {
    addAnnotation(currentNote);
    setCurrentNote('');
    setShowNoteModal(false);
  };

  const deleteAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    message.info('Anotación eliminada');
  };

  const saveAnnotations = async () => {
    if (!pdfFile || annotations.length === 0) {
      message.warning('No hay anotaciones para guardar');
      return;
    }

    setIsProcessing(true);
    try {
      const { PDFDocument, rgb } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(pdfFile.data);
      const pages = pdfDoc.getPages();
      
      for (const ann of annotations) {
        const pageIndex = ann.page - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) continue;
        const page = pages[pageIndex];
        const cropBox = page.getCropBox();
        const { width: pageWidth, height: pageHeight, x: cropX, y: cropY } = cropBox;
        
        const x = cropX + (ann.x * pageWidth);
        const yTopDown = ann.y * pageHeight;
        const w = ann.width * pageWidth;
        const h = ann.height * pageHeight;
        const yBottomUp = (cropY + pageHeight) - yTopDown - h;

        let r = 1, g = 1, b = 0;
        if (ann.color === 'green') { r = 0.5; g = 1; b = 0.5; }
        else if (ann.color === 'blue') { r = 0.5; g = 0.8; b = 1; }
        else if (ann.color === 'pink') { r = 1; g = 0.7; b = 0.8; }

        if (ann.type === 'highlight') {
          page.drawRectangle({
            x, y: yBottomUp, width: w, height: h,
            color: rgb(r, g, b),
            opacity: 0.5,
          });
        } else if (ann.type === 'underline') {
          page.drawLine({
            start: { x, y: yBottomUp },
            end: { x: x + w, y: yBottomUp },
            thickness: 2,
            color: rgb(r, g, b),
          });
        } else if (ann.type === 'note') {
          // Draw small note box
          page.drawRectangle({
            x, y: yBottomUp, width: 100, height: 20,
            color: rgb(r, g, b),
          });
          const { StandardFonts } = await import('pdf-lib');
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          page.drawText(ann.note || 'Nota', {
            x: x + 2, y: yBottomUp + 5,
            size: 10,
            font,
            color: rgb(0, 0, 0),
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfFile.name.replace('.pdf', '_anotado.pdf');
      link.click();
      URL.revokeObjectURL(url);
      
      message.success('Anotaciones guardadas. PDF descargado');
    } catch (err) {
      console.error('[Annotations] Error:', err);
      message.error('Error al guardar anotaciones');
    } finally {
      setIsProcessing(false);
    }
  };

  const pageAnnotations = annotations.filter(a => a.page === currentPage);

  return (
    <Card
      title={
        <Space>
          <HighlightOutlined />
          Anotaciones PDF
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
          {pdfFile && (
            <Space>
              <Button size="small" onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}>-</Button>
              <span>{Math.round(zoom * 100)}%</span>
              <Button size="small" onClick={() => setZoom(z => Math.min(3, z + 0.2))}>+</Button>
            </Space>
          )}
          {pdfFile && annotations.length > 0 && (
            <Button type="primary" icon={<SaveOutlined />} onClick={saveAnnotations} loading={isProcessing}>
              Guardar y Descargar PDF
            </Button>
          )}
        </Space>
      }
    >
      <Alert
        type="info"
        message="Anotaciones PDF"
        description="Agrega resaltados, subrayados y notas a tu PDF. Selecciona el tipo y haz clic en el canvas."
        showIcon
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Space>
          <span>Tipo:</span>
          <Radio.Group value={selectedType} onChange={e => setSelectedType(e.target.value)}>
            <Radio.Button value="highlight">
              <HighlightOutlined /> Resaltar
            </Radio.Button>
            <Radio.Button value="underline">
              <FileTextOutlined /> Subrayar
            </Radio.Button>
            <Radio.Button value="note">
              <EditOutlined /> Nota
            </Radio.Button>
          </Radio.Group>

          <span>Color:</span>
          <Radio.Group value={selectedColor} onChange={e => setSelectedColor(e.target.value)}>
            <Radio.Button value="yellow" style={{ background: '#fff3b0' }}>Amarillo</Radio.Button>
            <Radio.Button value="green" style={{ background: '#b0f2b0' }}>Verde</Radio.Button>
            <Radio.Button value="blue" style={{ background: '#b0d4f1' }}>Azul</Radio.Button>
            <Radio.Button value="pink" style={{ background: '#ffd6e0' }}>Rosa</Radio.Button>
          </Radio.Group>
        </Space>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Upload
          accept=".pdf"
          showUploadList={false}
          beforeUpload={handleFileUpload}
        >
          <Button icon={<HighlightOutlined />}>
            {pdfFile ? 'Cambiar PDF' : 'Subir PDF'}
          </Button>
        </Upload>
        
        <span style={{ marginLeft: 8, color: '#666' }}>
          {annotations.length} anotación(es) en total
        </span>
      </div>

      <div
        ref={containerRef}
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
            <HighlightOutlined style={{ fontSize: 48, color: '#ccc' }} />
            <p>Sube un PDF para comenzar a anotar</p>
          </div>
        ) : (
          <div style={{ 
            position: 'relative', 
            display: 'inline-block',
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease',
            marginBottom: `${(zoom - 1) * 100}%` // Add margin to prevent overlap when zoomed
          }}>
            <canvas
              ref={canvasRef}
              style={{ maxWidth: '100%', height: 'auto', cursor: 'crosshair', border: '1px solid #ddd' }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
            />
            
            {pageAnnotations.map(ann => (
              <div
                key={ann.id}
                style={{
                  position: 'absolute',
                  left: ann.x * canvasDim.w,
                  top: ann.y * canvasDim.h,
                  width: ann.width * canvasDim.w,
                  height: ann.height * canvasDim.h,
                  background: ann.type === 'highlight' ? getColorHex(ann.color) : 'transparent',
                  borderBottom: ann.type === 'underline' ? `2px solid ${getColorHex(ann.color)}` : 'none',
                  opacity: 0.5,
                  pointerEvents: 'none',
                }}
                title={ann.note || ann.text}
              >
                {ann.type === 'note' && (
                  <div style={{
                    background: getColorHex(ann.color),
                    padding: '2px 6px',
                    borderRadius: 2,
                    fontSize: 11,
                    maxWidth: 150,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    border: '1px solid #333',
                  }}>
                    📝 {ann.note || 'Nota'}
                  </div>
                )}
                <div
                  style={{
                    position: 'absolute',
                    top: -20,
                    right: 0,
                    cursor: 'pointer',
                    color: '#ff4d4f',
                    fontSize: 12,
                    pointerEvents: 'auto'
                  }}
                  onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id); }}
                >
                  ✕
                </div>
              </div>
            ))}

            {isDrawing && selectedType !== 'note' && (
              <div
                style={{
                  position: 'absolute',
                  left: Math.min(startPos.x, currentPos.x),
                  top: selectedType === 'underline' ? startPos.y : Math.min(startPos.y, currentPos.y),
                  width: Math.abs(currentPos.x - startPos.x),
                  height: selectedType === 'underline' ? 2 : Math.abs(currentPos.y - startPos.y),
                  background: selectedType === 'highlight' ? getColorHex(selectedColor) : 'transparent',
                  borderBottom: selectedType === 'underline' ? `2px solid ${getColorHex(selectedColor)}` : 'none',
                  opacity: 0.5,
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <h4>Anotaciones en esta página ({pageAnnotations.length})</h4>
        {pageAnnotations.length === 0 ? (
          <p style={{ color: '#999' }}>No hay anotaciones en esta página</p>
        ) : (
          <ul style={{ paddingLeft: 20 }}>
            {pageAnnotations.map(ann => (
              <li key={ann.id} style={{ marginBottom: 8 }}>
                <Tag color={ann.color}>{ann.type}</Tag>
                {ann.note || ann.text || 'Sin texto'}
                <Button
                  type="link"
                  size="small"
                  danger
                  onClick={() => deleteAnnotation(ann.id)}
                >
                  Eliminar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showNoteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <Card style={{ width: 400 }}>
            <h4>Agregar Nota</h4>
            <Input.TextArea
              value={currentNote}
              onChange={e => setCurrentNote(e.target.value)}
              placeholder="Escribe tu nota aquí..."
              rows={4}
            />
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setShowNoteModal(false)}>Cancelar</Button>
                <Button type="primary" onClick={handleSaveNote}>Guardar</Button>
              </Space>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );

  function getColorHex(color: AnnotationColor): string {
    const colors = {
      yellow: '#fff3b0',
      green: '#b0f2b0',
      blue: '#b0d4f1',
      pink: '#ffd6e0',
    };
    return colors[color];
  }
}
