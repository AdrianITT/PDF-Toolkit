import { useState } from 'react';
import { Card, Button, Upload, Alert, message, Space, Progress, Tag, Radio } from 'antd';
import { FilePdfOutlined, SwapOutlined } from '@ant-design/icons';
import { loadPdf } from '../../utils/pdfjs';

interface ComparisonResult {
  page: number;
  differences: number;
  similarity: number;
}

export function PdfComparerPage() {
  const [pdf1, setPdf1] = useState<{ name: string; data: Uint8Array } | null>(null);
  const [pdf2, setPdf2] = useState<{ name: string; data: Uint8Array } | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [viewMode, setViewMode] = useState<'side' | 'overlay'>('side');

  const handlePdf1Upload = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      setPdf1({ name: file.name, data });
      message.success('PDF 1 cargado');
    } catch {
      message.error('Error al cargar PDF 1');
    }
    return false;
  };

  const handlePdf2Upload = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      setPdf2({ name: file.name, data });
      message.success('PDF 2 cargado');
    } catch {
      message.error('Error al cargar PDF 2');
    }
    return false;
  };

  const comparePdfs = async () => {
    if (!pdf1 || !pdf2) {
      message.warning('Sube ambos PDFs');
      return;
    }

    setIsComparing(true);
    setProgress(10);
    setResults([]);

    try {
      message.info('Comparando PDFs... Esto puede tardar');
      
      const { doc: doc1, numPages: pages1 } = await loadPdf(pdf1.data);
      setProgress(30);
      const { doc: doc2, numPages: pages2 } = await loadPdf(pdf2.data);
      setProgress(50);

      const maxPages = Math.max(pages1, pages2);
      const comparisonResults: ComparisonResult[] = [];

      for (let i = 1; i <= maxPages; i++) {
        try {
          const page1 = i <= pages1 ? await doc1.getPage(i) : null;
          const page2 = i <= pages2 ? await doc2.getPage(i) : null;

          if (!page1 && !page2) continue;

          // Simplified comparison: compare text content
          const text1 = page1 ? await (await page1.getTextContent()).items.map((item: any) => item.str).join(' ') : '';
          const text2 = page2 ? await (await page2.getTextContent()).items.map((item: any) => item.str).join(' ') : '';

          const similarity = calculateSimilarity(text1, text2);
          const differences = Math.abs(text1.length - text2.length);

          comparisonResults.push({
            page: i,
            differences,
            similarity,
          });

          setProgress(50 + (i / maxPages) * 40);
        } catch (pageErr) {
          console.error(`Error comparing page ${i}:`, pageErr);
        }
      }

      setResults(comparisonResults);
      setProgress(100);
      message.success(`Comparación completada: ${comparisonResults.length} página(s)`);
    } catch (err) {
      console.error('[Compare] Error:', err);
      message.error('Error al comparar PDFs');
    } finally {
      setIsComparing(false);
    }
  };

  const calculateSimilarity = (text1: string, text2: string): number => {
    if (!text1 && !text2) return 100;
    if (!text1 || !text2) return 0;

    const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 0);

    const set1 = new Set(words1);
    const set2 = new Set(words2);

    let common = 0;
    for (const word of set1) {
      if (set2.has(word)) common++;
    }

    const total = Math.max(set1.size, set2.size);
    return total > 0 ? Math.round((common / total) * 100) : 0;
  };

  return (
    <Card
      title={
        <Space>
          <SwapOutlined />
          Comparador de PDFs
        </Space>
      }
      extra={
        <Tag color="blue">Comparación de documentos</Tag>
      }
    >
      <Alert
        type="info"
        message="¿Qué hace el comparador?"
        description="Compara dos PDFs página por página, detectando diferencias en el texto y mostrando un porcentaje de similitud."
        showIcon
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Upload
            accept=".pdf"
            showUploadList={false}
            beforeUpload={handlePdf1Upload}
          >
            <Button icon={<FilePdfOutlined />} loading={isComparing}>
              {pdf1 ? pdf1.name : 'PDF Original'}
            </Button>
          </Upload>

          <Upload
            accept=".pdf"
            showUploadList={false}
            beforeUpload={handlePdf2Upload}
          >
            <Button icon={<FilePdfOutlined />} loading={isComparing}>
              {pdf2 ? pdf2.name : 'PDF Modificado'}
            </Button>
          </Upload>
        </Space>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<SwapOutlined />}
          onClick={comparePdfs}
          loading={isComparing}
          disabled={!pdf1 || !pdf2}
          block
        >
          {isComparing ? 'Comparando...' : 'Iniciar Comparación'}
        </Button>
      </div>

      {isComparing && (
        <div style={{ marginBottom: 16 }}>
          <Progress percent={Math.round(progress)} status="active" />
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            Comparando documentos...
          </div>
        </div>
      )}

      {results.length > 0 && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <span>Vista:</span>
              <Radio.Group value={viewMode} onChange={e => setViewMode(e.target.value)}>
                <Radio.Button value="side">Lado a lado</Radio.Button>
                <Radio.Button value="overlay">Superpuesta</Radio.Button>
              </Radio.Group>
            </Space>
          </div>

          <div>
            {results.map(result => (
              <div
                key={result.page}
                style={{
                  marginBottom: 16,
                  padding: 16,
                  background: result.similarity > 80 ? '#f6ffed' : result.similarity > 50 ? '#fff7e6' : '#fff1f0',
                  borderRadius: 8,
                  border: '1px solid #d9d9d9',
                }}
              >
                <h4 style={{ marginTop: 0 }}>
                  Página {result.page}
                  <Tag color={result.similarity > 80 ? 'green' : result.similarity > 50 ? 'orange' : 'red'} style={{ marginLeft: 8 }}>
                    Similitud: {result.similarity}%
                  </Tag>
                  <Tag>Diferencias: {result.differences}</Tag>
                </h4>
                {viewMode === 'side' && (
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1, padding: 8, background: '#fafafa', borderRadius: 4 }}>
                      <strong>Original:</strong> {pdf1?.name}
                    </div>
                    <div style={{ flex: 1, padding: 8, background: '#fafafa', borderRadius: 4 }}>
                      <strong>Modificado:</strong> {pdf2?.name}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {!pdf1 && !pdf2 && (
        <Alert
          type="warning"
          message="Paso 1: Sube dos PDFs"
          description="Selecciona el PDF original y el PDF modificado para comparar."
          showIcon
        />
      )}
    </Card>
  );
}
