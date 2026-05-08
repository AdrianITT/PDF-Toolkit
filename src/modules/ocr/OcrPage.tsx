import { useState, useCallback } from 'react';
import { Card, Button, Upload, Alert, Progress, message, Space, Tag, List } from 'antd';
import { FileImageOutlined, ScanOutlined } from '@ant-design/icons';
import { loadPdf } from '../../utils/pdfjs';

interface OcrResult {
  page: number;
  text: string;
  confidence: number;
}

export function OcrPage() {
  const [pdfFile, setPdfFile] = useState<{ name: string; data: Uint8Array } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<OcrResult[]>([]);
  const [totalPages, setTotalPages] = useState(0);

  const handleFileUpload = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      
      if (data.length < 5 || data[0] !== 0x25 || data[1] !== 0x50 || data[2] !== 0x44 || data[3] !== 0x46) {
        message.error('El archivo no es un PDF válido');
        return false;
      }
      
      setPdfFile({ name: file.name, data });
      setResults([]);
      
      // Obtener número de páginas
      const { numPages } = await loadPdf(data);
      setTotalPages(numPages);
      
      message.success(`PDF cargado: ${numPages} página(s)`);
    } catch (err) {
      console.error('[OCR] Error uploading:', err);
      message.error('Error al cargar el PDF');
    }
    return false;
  };

  const performOcr = useCallback(async () => {
    if (!pdfFile) {
      message.warning('Sube un PDF primero');
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setResults([]);

    try {
      const { doc } = await loadPdf(pdfFile.data);
      const numPages = doc.numPages;
      const ocrResults: OcrResult[] = [];

      message.info('Iniciando OCR... Esto puede tardar unos momentos');

      // Importar Tesseract.js dinámicamente
      const Tesseract = await import('tesseract.js');
       
      setProgress(20);

      const worker = await Tesseract.createWorker('eng', 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            console.log(`[OCR] ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          setProgress(20 + ((pageNum - 1) / numPages) * 60);
          
          // Render a baja resolución primero para forzar carga de objetos
          const page = await doc.getPage(pageNum);
          const smallViewport = page.getViewport({ scale: 0.5 });
          const smallCanvas = document.createElement('canvas');
          smallCanvas.width = smallViewport.width;
          smallCanvas.height = smallViewport.height;
          const smallCtx = smallCanvas.getContext('2d');
          if (smallCtx) {
            await page.render({ canvasContext: smallCtx, viewport: smallViewport }).promise.catch(() => {});
          }
          
          // Render a resolución completa para OCR
          const viewport = page.getViewport({ scale: 2 });
          
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          
          // Renderizar con reintento si falla
          let renderSuccess = false;
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              await page.render({ canvasContext: ctx, viewport }).promise;
              renderSuccess = true;
              break;
            } catch (renderErr) {
              if (attempt === 0) {
                // Esperar y reintentar una vez
                await new Promise(r => setTimeout(r, 500));
              }
            }
          }
          
          if (!renderSuccess) {
            // Fallback: scale 1
            const lowViewport = page.getViewport({ scale: 1 });
            canvas.width = lowViewport.width;
            canvas.height = lowViewport.height;
            await page.render({ canvasContext: ctx, viewport: lowViewport }).promise;
          }
          
          setProgress(20 + (pageNum / numPages) * 60);
          
          const result = await worker.recognize(canvas);
          
          ocrResults.push({
            page: pageNum,
            text: result.data.text,
            confidence: result.data.confidence,
          });
          
          setProgress(20 + ((pageNum + 1) / numPages) * 60);
        } catch (pageErr) {
          console.error(`[OCR] Error en página ${pageNum}:`, pageErr);
          ocrResults.push({
            page: pageNum,
            text: '[Error al procesar esta página]',
            confidence: 0,
          });
        }
      }

      await worker.terminate();

      setResults(ocrResults);
      setProgress(100);
      message.success(`OCR completado: ${ocrResults.length} página(s) procesada(s)`);
    } catch (err) {
      console.error('[OCR] Error:', err);
      message.error('Error al realizar OCR: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setIsProcessing(false);
    }
  }, [pdfFile]);

  const downloadText = () => {
    if (results.length === 0) {
      message.warning('No hay resultados para descargar');
      return;
    }

    const fullText = results.map(r => `=== PÁGINA ${r.page} (Confianza: ${r.confidence}%) ===\n${r.text}\n\n`).join('');
    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ocr-${pdfFile?.name.replace('.pdf', '.txt') || 'documento.txt'}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card
      title={
        <Space>
          <ScanOutlined />
          OCR - Reconomiento de Caracteres
        </Space>
      }
      extra={
        <Tag color="blue">
          Tesseract.js
        </Tag>
      }
    >
      <Alert
        type="info"
        message="¿Qué es OCR?"
        description="El Reconomiento Óptico de Caracteres (OCR) extrae texto de imágenes. Convierte PDFs escaneados en texto editable."
        showIcon
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Upload
          accept=".pdf"
          showUploadList={false}
          beforeUpload={handleFileUpload}
        >
          <Button icon={<FileImageOutlined />} loading={isProcessing}>
            {pdfFile ? pdfFile.name : 'Subir PDF'}
          </Button>
        </Upload>
        
        {pdfFile && (
          <span style={{ marginLeft: 8, color: '#666' }}>
            {totalPages} página(s)
          </span>
        )}
      </div>

      {pdfFile && (
        <Button
          type="primary"
          icon={<ScanOutlined />}
          onClick={performOcr}
          loading={isProcessing}
          disabled={isProcessing}
          style={{ marginBottom: 16 }}
        >
          {isProcessing ? 'Procesando...' : 'Iniciar OCR'}
        </Button>
      )}

      {isProcessing && (
        <div style={{ marginBottom: 16 }}>
          <Progress percent={Math.round(progress)} status="active" />
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            Procesando páginas... Esto puede tardar varios minutos.
          </div>
        </div>
      )}

      {results.length > 0 && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" onClick={downloadText}>
              Descargar Texto
            </Button>
            <span style={{ marginLeft: 8, color: '#666' }}>
              {results.length} página(s) procesada(s)
            </span>
          </div>

          <List
            bordered
            dataSource={results}
            renderItem={(item: OcrResult) => (
              <List.Item>
                <div style={{ width: '100%' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                    Página {item.page}
                    <Tag color={item.confidence > 80 ? 'green' : item.confidence > 60 ? 'orange' : 'red'} style={{ marginLeft: 8 }}>
                      Confianza: {item.confidence.toFixed(1)}%
                    </Tag>
                  </div>
                  <div style={{
                    background: '#f5f5f5',
                    padding: 12,
                    borderRadius: 4,
                    maxHeight: 200,
                    overflow: 'auto',
                    fontSize: 13,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {item.text || '(No se encontró texto en esta página)'}
                  </div>
                </div>
              </List.Item>
            )}
          />
        </>
      )}

      {!pdfFile && (
        <Alert
          type="warning"
          message="Paso 1: Sube un PDF"
          description="Sube un PDF escaneado para extraer su texto usando OCR."
          showIcon
        />
      )}
    </Card>
  );
}
