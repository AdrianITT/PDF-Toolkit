import { useState } from 'react';
import { Card, Input, Row, Col, Button, Upload, message, Slider, Radio, Space, Tooltip, InputNumber } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { PDFDocument, rgb, degrees } from 'pdf-lib';

interface WatermarkConfig {
  type: 'text' | 'image';
  text: string;
  fontSize: number;
  color: string;
  opacity: number;
  position: 'center' | 'topLeft' | 'topCenter' | 'topRight' | 'bottomLeft' | 'bottomCenter' | 'bottomRight' | 'middleLeft' | 'middleRight';
  rotation: number;
  imageScale: number;
  firstPageOnly: boolean;
  targetPageStart: number;
  targetPageEnd: number;
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

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 180, g: 180, b: 180 };
}

export function WatermarkPage() {
  const [config, setConfig] = useState<WatermarkConfig>({
    type: 'text',
    text: 'WATERMARK',
    fontSize: 48,
    color: '#b4b4b4',
    opacity: 30,
    position: 'center',
    rotation: -45,
    imageScale: 50,
    firstPageOnly: false,
    targetPageStart: 2,
    targetPageEnd: 2,
  });
  
  const [pdfFile, setPdfFile] = useState<{ name: string; data: Uint8Array } | null>(null);
  const [pdfThumbnail, setPdfThumbnail] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<{ data: Uint8Array; width: number; height: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const positions = [
    { value: 'topLeft', label: '↖', title: 'Arriba Izquierda' },
    { value: 'topCenter', label: '↑', title: 'Arriba Centro' },
    { value: 'topRight', label: '↗', title: 'Arriba Derecha' },
    { value: 'middleLeft', label: '←', title: 'Centro Izquierda' },
    { value: 'center', label: '●', title: 'Centro' },
    { value: 'middleRight', label: '→', title: 'Centro Derecha' },
    { value: 'bottomLeft', label: '↙', title: 'Abajo Izquierda' },
    { value: 'bottomCenter', label: '↓', title: 'Abajo Centro' },
    { value: 'bottomRight', label: '↘', title: 'Abajo Derecha' },
  ];

  const handleFileUpload = async (file: File) => {
    setIsUploadingPdf(true);
    try {
      const buffer = await file.arrayBuffer();
      const pdfData = new Uint8Array(buffer);
      
      if (pdfData.length < 5 || pdfData[0] !== 0x25 || pdfData[1] !== 0x50 || pdfData[2] !== 0x44 || pdfData[3] !== 0x46) {
        message.error('El archivo no es un PDF válido');
        return false;
      }
      
      const pdfDataCopy = new Uint8Array(pdfData.length);
      pdfDataCopy.set(pdfData);
      
      setPdfFile({ name: file.name, data: pdfDataCopy });
      
      const thumbnailDataUrl = await generatePdfThumbnail(pdfData);
      setPdfThumbnail(thumbnailDataUrl);
    } catch (err) {
      console.error('[Watermark] Upload error:', err);
      message.error('Error al cargar el PDF');
      return false;
    } finally {
      setIsUploadingPdf(false);
    }
    return false;
  };

  const generatePdfThumbnail = async (pdfData: Uint8Array): Promise<string> => {
    try {
      const pdfDataCopy = new Uint8Array(pdfData.length);
      pdfDataCopy.set(pdfData);
      
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
      
      const pdfDoc = await pdfjsLib.getDocument({ data: pdfDataCopy }).promise;
      const page = await pdfDoc.getPage(1);
      
      const viewport = page.getViewport({ scale: 0.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) return '';
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
      
      return canvas.toDataURL('image/png');
    } catch (e) {
      console.error('Error generating PDF thumbnail:', e);
      return '';
    }
  };

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const buffer = await file.arrayBuffer();
      const isPng = file.name.toLowerCase().endsWith('.png');
      const imageBytes = new Uint8Array(buffer);

      let width = 100, height = 100;
      try {
        if (isPng) {
          const image = await (PDFDocument as any).embedPng(imageBytes);
          width = image.width;
          height = image.height;
        } else {
          const image = await (PDFDocument as any).embedJpg(imageBytes);
          width = image.width;
          height = image.height;
        }
      } catch (e) {
        console.error('Error loading image:', e);
      }

      setImageFile({ data: imageBytes, width, height });
    } catch (err) {
      message.error('Error al cargar imagen');
    } finally {
      setIsUploadingImage(false);
    }
    return false;
  };

  const applyTextWatermark = async (pdfDoc: PDFDocument) => {
    const pages = pdfDoc.getPages();
    let pagesToProcess: any[];
    
    if (config.firstPageOnly) {
      pagesToProcess = [pages[0]];
    } else if (config.targetPageEnd >= pages.length || config.targetPageEnd >= 999) {
      pagesToProcess = pages;
    } else {
      const startIdx = Math.max(0, config.targetPageStart - 1);
      const endIdx = Math.min(pages.length, config.targetPageEnd);
      pagesToProcess = pages.slice(startIdx, endIdx);
    }
    
    const rgbColor = hexToRgb(config.color);
    const color = rgb(rgbColor.r / 255, rgbColor.g / 255, rgbColor.b / 255);
    
    for (const page of pagesToProcess) {
      const { width, height } = page.getSize();
      const pos = getPositionCoords(config.position, width, height, config.fontSize, config.text.length);
      
      page.drawText(config.text, {
        x: pos.x,
        y: pos.y,
        size: config.fontSize,
        color,
        opacity: config.opacity / 100,
        rotate: degrees(config.rotation),
      });
    }
  };

  const applyImageWatermark = async (pdfDoc: PDFDocument) => {
    if (!imageFile) return;
    
    const pages = pdfDoc.getPages();
    let pagesToProcess: any[];
    
    if (config.firstPageOnly) {
      pagesToProcess = [pages[0]];
    } else if (config.targetPageEnd >= pages.length || config.targetPageEnd >= 999) {
      pagesToProcess = pages;
    } else {
      const startIdx = Math.max(0, config.targetPageStart - 1);
      const endIdx = Math.min(pages.length, config.targetPageEnd);
      pagesToProcess = pages.slice(startIdx, endIdx);
    }
    
    const isPng = imageFile.data[0] === 0x89 && imageFile.data[1] === 0x50;
    let image;
    if (isPng) {
      image = await (pdfDoc as any).embedPng(imageFile.data);
    } else {
      image = await (pdfDoc as any).embedJpg(imageFile.data);
    }
    
    const scale = config.imageScale / 100;
    const imgDims = image.scale(scale);
    
    for (const page of pagesToProcess) {
      const { width, height } = page.getSize();
      const pos = getImagePositionCoords(config.position, width, height, imgDims.width, imgDims.height);
      
      page.drawImage(image, {
        x: pos.x,
        y: pos.y,
        width: imgDims.width,
        height: imgDims.height,
        opacity: config.opacity / 100,
        rotate: degrees(config.rotation),
      });
    }
  };

  const getPositionCoords = (pos: string, pageWidth: number, pageHeight: number, fontSize: number, textLength: number) => {
    const marginX = pageWidth * 0.05;
    const marginY = pageHeight * 0.08;
    const textWidth = textLength * fontSize * 0.6;
    const textHeight = fontSize;
    
    const positions: any = {
      topLeft: { x: marginX, y: pageHeight - textHeight - marginY },
      topCenter: { x: (pageWidth - textWidth) / 2, y: pageHeight - textHeight - marginY },
      topRight: { x: pageWidth - textWidth - marginX, y: pageHeight - textHeight - marginY },
      middleLeft: { x: marginX, y: (pageHeight - textHeight) / 2 },
      center: { x: (pageWidth - textWidth) / 2, y: (pageHeight - textHeight) / 2 },
      middleRight: { x: pageWidth - textWidth - marginX, y: (pageHeight - textHeight) / 2 },
      bottomLeft: { x: marginX, y: marginY },
      bottomCenter: { x: (pageWidth - textWidth) / 2, y: marginY },
      bottomRight: { x: pageWidth - textWidth - marginX, y: marginY },
    };
    
    return positions[pos] || positions.center;
  };

  const getPreviewPosition = (pos: string): { x: string; y: string; transform: string } => {
    const positions: Record<string, { x: string; y: string; transform: string }> = {
      topLeft: { x: '5%', y: '8%', transform: '' },
      topCenter: { x: '50%', y: '8%', transform: 'translateX(-50%)' },
      topRight: { x: '95%', y: '8%', transform: 'translateX(-100%)' },
      middleLeft: { x: '5%', y: '50%', transform: 'translateY(-50%)' },
      center: { x: '50%', y: '50%', transform: 'translate(-50%, -50%)' },
      middleRight: { x: '95%', y: '50%', transform: 'translate(-100%, -50%)' },
      bottomLeft: { x: '5%', y: '85%', transform: 'translateY(-100%)' },
      bottomCenter: { x: '50%', y: '85%', transform: 'translate(-50%, -100%)' },
      bottomRight: { x: '95%', y: '85%', transform: 'translate(-100%, -100%)' },
    };
    return positions[pos] || positions.center;
  };

  const getImagePositionCoords = (pos: string, pageWidth: number, pageHeight: number, imgWidth: number, imgHeight: number) => {
    const marginX = pageWidth * 0.05;
    const marginY = pageHeight * 0.08;
    
    const positions: any = {
      topLeft: { x: marginX, y: pageHeight - imgHeight - marginY },
      topCenter: { x: (pageWidth - imgWidth) / 2, y: pageHeight - imgHeight - marginY },
      topRight: { x: pageWidth - imgWidth - marginX, y: pageHeight - imgHeight - marginY },
      middleLeft: { x: marginX, y: (pageHeight - imgHeight) / 2 },
      center: { x: (pageWidth - imgWidth) / 2, y: (pageHeight - imgHeight) / 2 },
      middleRight: { x: pageWidth - imgWidth - marginX, y: (pageHeight - imgHeight) / 2 },
      bottomLeft: { x: marginX, y: marginY },
      bottomCenter: { x: (pageWidth - imgWidth) / 2, y: marginY },
      bottomRight: { x: pageWidth - imgWidth - marginX, y: marginY },
    };
    
    return positions[pos] || positions.center;
  };

  const handleApply = async () => {
    if (!pdfFile) {
      message.warning('Sube un PDF primero');
      return;
    }
    
    setLoading(true);
    try {
      const pdfDataCopy = new Uint8Array(pdfFile.data.length);
      pdfDataCopy.set(pdfFile.data);
      
      if (pdfDataCopy.length < 5 || pdfDataCopy[0] !== 0x25 || pdfDataCopy[1] !== 0x50 || pdfDataCopy[2] !== 0x44 || pdfDataCopy[3] !== 0x46) {
        console.error('[Watermark] Invalid PDF header');
        message.error('El archivo no es un PDF válido');
        return;
      }
      
      const pdfDoc = await PDFDocument.load(pdfDataCopy);
      
      if (config.type === 'text') {
        await applyTextWatermark(pdfDoc);
      } else if (config.type === 'image' && imageFile) {
        await applyImageWatermark(pdfDoc);
      } else if (config.type === 'image' && !imageFile) {
        message.warning('Sube una imagen primero');
        setLoading(false);
        return;
      }
      
      const pdfBytes = await pdfDoc.save();
      const uint8Array = new Uint8Array(pdfBytes);
      downloadBlob(uint8Array, pdfFile.name.replace('.pdf', '_watermarked.pdf'));
      
      message.success('Marca de agua aplicada');
    } catch (err) {
      console.error('Watermark error:', err);
      message.error('Error al aplicar marca de agua');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card title="Agregar Marca de Agua" style={{ maxWidth: 800, background: 'var(--ant-color-bg-container)' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Radio.Group 
            value={config.type} 
            onChange={(e) => setConfig({ ...config, type: e.target.value })}
          >
            <Radio.Button value="text">Texto</Radio.Button>
            <Radio.Button value="image">Imagen</Radio.Button>
          </Radio.Group>
        </Col>
      </Row>

      {config.type === 'text' ? (
        <Input
          addonBefore="Texto"
          value={config.text}
          onChange={(e) => setConfig({ ...config, text: e.target.value })}
          style={{ marginTop: 16 }}
        />
      ) : (
        <Col span={24} style={{ marginTop: 16 }}>
          <Upload
            accept=".png,.jpg,.jpeg"
            showUploadList={false}
            beforeUpload={handleImageUpload}
          >
            <Button icon={<UploadOutlined />} loading={isUploadingImage}>
              {isUploadingImage ? 'Cargando...' : (imageFile ? 'Imagen cargada' : 'Subir Imagen')}
            </Button>
          </Upload>
        </Col>
      )}

      <div style={{ marginTop: 16 }}>
        <span>Tamaño: {config.fontSize}pt</span>
        <Slider
          min={12}
          max={200}
          value={config.fontSize}
          onChange={(v) => setConfig({ ...config, fontSize: v })}
        />
      </div>

      {config.type === 'image' && (
        <div style={{ marginTop: 16 }}>
          <span>Escala: {config.imageScale}%</span>
          <Slider
            min={10}
            max={100}
            value={config.imageScale}
            onChange={(v) => setConfig({ ...config, imageScale: v })}
          />
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <span>Opacidad: {config.opacity}%</span>
        <Slider
          min={10}
          max={100}
          value={config.opacity}
          onChange={(v) => setConfig({ ...config, opacity: v })}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <span>Color:</span>
        <div style={{ display: 'flex', gap: 8, marginLeft: 16, alignItems: 'center' }}>
          <input
            type="color"
            value={config.color}
            onChange={(e) => setConfig({ ...config, color: e.target.value })}
            style={{ width: 40, height: 32, padding: 0, border: '1px solid #d9d9d9', cursor: 'pointer' }}
          />
          <Input
            value={config.color}
            onChange={(e) => setConfig({ ...config, color: e.target.value })}
            style={{ width: 100 }}
            placeholder="#hex"
          />
          <span style={{ fontSize: 12, color: '#888' }}>o...</span>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <span>Colores rápidos:</span>
        <Space style={{ marginLeft: 8 }}>
          {['#cccccc', '#999999', '#e0e0e0', '#d4d4d4', '#bfbfbf', '#a6a6a6'].map((c) => (
            <Tooltip key={c} title={c}>
              <Button
                onClick={() => setConfig({ ...config, color: c })}
                style={{ 
                  background: c, 
                  border: config.color === c ? '#1890ff' : '#d9d9d9',
                  width: 24, 
                  height: 24, 
                  padding: 0 
                }}
              />
            </Tooltip>
          ))}
        </Space>
      </div>

<div style={{ marginTop: 16 }}>
        <span>Posición:</span>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: 4, 
          width: 120, 
          marginTop: 8 
        }}>
          {positions.map((pos) => (
            <Tooltip key={pos.value} title={pos.title}>
              <Button
                type={config.position === pos.value ? 'primary' : 'default'}
                onClick={() => setConfig({ ...config, position: pos.value as any})}
                style={{ padding: '4px 8px', fontSize: 12 }}
              >
                {pos.label}
              </Button>
            </Tooltip>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <span>Vista previa:</span>
        <div 
          style={{
            width: '100%',
            height: 350,
            border: '2px solid var(--ant-color-border)',
            borderRadius: 4,
            background: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
            marginTop: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* PDF Thumbnail or placeholder */}
          {pdfThumbnail ? (
            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img 
                src={pdfThumbnail} 
                alt="PDF Preview"
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%', 
                  objectFit: 'contain',
                }} 
              />
              {/* Watermark overlay - positioned absolutely over the PDF */}
              <div
                style={{
                  position: 'absolute',
                  fontSize: Math.max(16, config.fontSize * 1.5),
                  color: config.color,
                  opacity: config.opacity / 100,
                  transform: `rotate(${config.rotation}deg) ${getPreviewPosition(config.position).transform || ''}`,
                  whiteSpace: 'nowrap',
                  fontWeight: 'bold',
                  left: getPreviewPosition(config.position).x,
                  top: getPreviewPosition(config.position).y,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
              >
                {config.text}
              </div>
            </div>
          ) : (
            <>
              {/* Placeholder when no PDF */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%)',
                opacity: 0.5,
              }} />
              <div style={{
                position: 'absolute',
                top: 30,
                left: 20,
                right: 20,
                height: 8,
                background: '#e0e0e0',
                borderRadius: 2,
                opacity: 0.4,
              }} />
              <div style={{
                position: 'absolute',
                top: 50,
                left: 20,
                right: 40,
                height: 8,
                background: '#e0e0e0',
                borderRadius: 2,
                opacity: 0.4,
              }} />
              <div style={{
                position: 'absolute',
                top: 70,
                left: 20,
                right: 60,
                height: 8,
                background: '#e0e0e0',
                borderRadius: 2,
                opacity: 0.4,
              }} />
              <div style={{
                position: 'absolute',
                top: 90,
                left: 20,
                right: 30,
                height: 8,
                background: '#e0e0e0',
                borderRadius: 2,
                opacity: 0.4,
              }} />
              {/* Watermark - same as PDF preview */}
              <div
                style={{
                  position: 'absolute',
                  fontSize: Math.max(16, config.fontSize * 1.5),
                  color: config.color,
                  opacity: config.opacity / 100,
                  transform: `rotate(${config.rotation}deg) ${getPreviewPosition(config.position).transform || ''}`,
                  whiteSpace: 'nowrap',
                  fontWeight: 'bold',
                  left: getPreviewPosition(config.position).x,
                  top: getPreviewPosition(config.position).y,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
              >
                {config.text}
              </div>
            </>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ant-color-text-secondary)', marginTop: 4 }}>
          {pdfFile ? `Vista: ${pdfFile.name} (1ra página)` : 'Sube un PDF para ver previsualización real'} • Tamaño: {config.fontSize}pt • Opacidad: {config.opacity}%
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <span>Rotación: {config.rotation}°</span>
        <Slider
          min={-90}
          max={90}
          value={config.rotation}
          onChange={(v) => setConfig({ ...config, rotation: v })}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <span>Aplicar en:</span>
        <Radio.Group 
          value={config.firstPageOnly ? 'first' : (config.targetPageStart === config.targetPageEnd && config.targetPageStart > 1 ? 'custom' : 'all')}
          onChange={(e) => {
            if (e.target.value === 'first') {
              setConfig({ ...config, firstPageOnly: true });
            } else if (e.target.value === 'all') {
              setConfig({ ...config, firstPageOnly: false, targetPageStart: 1, targetPageEnd: 999 });
            } else {
              setConfig({ ...config, firstPageOnly: false, targetPageStart: 2, targetPageEnd: 2 });
            }
          }}
          style={{ marginLeft: 16 }}
        >
          <Radio.Button value="first">Primera página</Radio.Button>
          <Radio.Button value="custom">Página específica</Radio.Button>
          <Radio.Button value="all">Todas las páginas</Radio.Button>
        </Radio.Group>

        {!config.firstPageOnly && config.targetPageStart === config.targetPageEnd && config.targetPageStart > 1 && (
          <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>Página:</span>
            <InputNumber 
              min={1} 
              max={999} 
              value={config.targetPageStart} 
              onChange={(v) => setConfig({ ...config, targetPageStart: v || 1, targetPageEnd: v || 1 })}
              style={{ width: 70 }}
              size="small"
            />
          </div>
        )}
      </div>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Upload
            accept=".pdf"
            showUploadList={false}
            beforeUpload={handleFileUpload}
          >
            <Button icon={<UploadOutlined />} loading={isUploadingPdf} block>
              {isUploadingPdf ? 'Cargando...' : (pdfFile ? pdfFile.name : 'Subir PDF')}
            </Button>
          </Upload>
        </Col>
        <Col span={12}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleApply}
            disabled={!pdfFile}
            loading={loading}
            block
            size="large"
          >
            Aplicar y Descargar
          </Button>
        </Col>
      </Row>

      <div style={{ marginTop: 16, padding: 16, background: 'var(--ant-color-bg-layout)', borderRadius: 8, border: '1px solid var(--ant-color-border)' }}>
        <Row gutter={16}>
          <Col span={12}>
            <span style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)' }}>Tip:</span>
            <ul style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)', paddingLeft: 16, margin: 0 }}>
              <li>Usa color claro para marcas discretas</li>
              <li>30% opacidad es ideal para la mayoria</li>
              <li>Rotation diagonal crea efecto profesional</li>
            </ul>
          </Col>
          <Col span={12}>
            <span style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)' }}>Colores populares:</span>
            <Space style={{ marginTop: 4 }}>
              <Button size="small" style={{ background: '#cccccc' }} onClick={() => setConfig({ ...config, color: '#cccccc' })}>Gris claro</Button>
              <Button size="small" style={{ background: '#999999', color: '#fff' }} onClick={() => setConfig({ ...config, color: '#999999' })}>Gris oscuro</Button>
              <Button size="small" style={{ background: '#e0e0e0' }} onClick={() => setConfig({ ...config, color: '#e0e0e0' })}>Gris muy claro</Button>
            </Space>
          </Col>
        </Row>
      </div>
    </Card>
    </>
  );
}