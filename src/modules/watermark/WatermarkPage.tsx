import { useState } from 'react';
import { Card, Input, Row, Col, Button, Upload, message, Space, Slider, Radio } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { PDFDocument, rgb, degrees } from 'pdf-lib';

interface WatermarkConfig {
  type: 'text' | 'image';
  text: string;
  fontSize: number;
  colorR: number;
  colorG: number;
  colorB: number;
  opacity: number;
  position: string;
  rotation: number;
  imageScale: number;
  firstPageOnly: boolean;
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

export function WatermarkPage() {
  const [config, setConfig] = useState<WatermarkConfig>({
    type: 'text',
    text: 'WATERMARK',
    fontSize: 48,
    colorR: 180,
    colorG: 180,
    colorB: 180,
    opacity: 30,
    position: 'center',
    rotation: -45,
    imageScale: 50,
    firstPageOnly: false,
  });
  
  const [pdfFile, setPdfFile] = useState<{ name: string; data: Uint8Array } | null>(null);
  const [imageFile, setImageFile] = useState<{ data: Uint8Array; width: number; height: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const positions = [
    { value: 'center', label: 'Centro' },
    { value: 'topLeft', label: 'Arriba Izquierda' },
    { value: 'topRight', label: 'Arriba Derecha' },
    { value: 'bottomLeft', label: 'Abajo Izquierda' },
    { value: 'bottomRight', label: 'Abajo Derecha' },
  ];

  const handleFileUpload = async (file: File) => {
    setIsUploadingPdf(true);
    try {
      const buffer = await file.arrayBuffer();
      setPdfFile({ name: file.name, data: new Uint8Array(buffer) });
    } finally {
      setIsUploadingPdf(false);
    }
    return false;
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
    const pagesToProcess = config.firstPageOnly ? [pages[0]] : pages;
    
    const color = rgb(config.colorR / 255, config.colorG / 255, config.colorB / 255);
    
    for (const page of pagesToProcess) {
      const { width, height } = page.getSize();
      const pos = getPositionCoords(config.position, width, height);
      
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
    const pagesToProcess = config.firstPageOnly ? [pages[0]] : pages;
    
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

  const getPositionCoords = (pos: string, pageWidth: number, pageHeight: number) => {
    const margin = 50;
    switch (pos) {
      case 'topLeft': return { x: margin, y: pageHeight - 100 };
      case 'topRight': return { x: pageWidth - config.fontSize * 4, y: pageHeight - 100 };
      case 'bottomLeft': return { x: margin, y: margin };
      case 'bottomRight': return { x: pageWidth - config.fontSize * 4, y: margin };
      default: return { x: pageWidth / 2 - config.fontSize * 2, y: pageHeight / 2 };
    }
  };

  const getImagePositionCoords = (pos: string, pageWidth: number, pageHeight: number, imgWidth: number, imgHeight: number) => {
    const margin = 50;
    switch (pos) {
      case 'topLeft': return { x: margin, y: pageHeight - imgHeight - margin };
      case 'topRight': return { x: pageWidth - imgWidth - margin, y: pageHeight - imgHeight - margin };
      case 'bottomLeft': return { x: margin, y: margin };
      case 'bottomRight': return { x: pageWidth - imgWidth - margin, y: margin };
      default: return { x: (pageWidth - imgWidth) / 2, y: (pageHeight - imgHeight) / 2 };
    }
  };

  const handleApply = async () => {
    if (!pdfFile) {
      message.warning('Sube un PDF primero');
      return;
    }
    
    setLoading(true);
    try {
      const pdfDoc = await PDFDocument.load(pdfFile.data);
      
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
    <Card title="Agregar Marca de Agua">
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

      <Space style={{ marginTop: 16 }}>
        <span>Posición:</span>
        {positions.map((pos) => (
          <Button
            key={pos.value}
            type={config.position === pos.value ? 'primary' : 'default'}
            onClick={() => setConfig({ ...config, position: pos.value })}
            size="small"
          >
            {pos.label}
          </Button>
        ))}
      </Space>

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
        <span>Color RGB ({config.colorR}, {config.colorG}, {config.colorB})</span>
        <Row gutter={8}>
          <Col span={8}>
            <span>R: {config.colorR}</span>
            <Slider
              min={0}
              max={255}
              value={config.colorR}
              onChange={(v) => setConfig({ ...config, colorR: v })}
            />
          </Col>
          <Col span={8}>
            <span>G: {config.colorG}</span>
            <Slider
              min={0}
              max={255}
              value={config.colorG}
              onChange={(v) => setConfig({ ...config, colorG: v })}
            />
          </Col>
          <Col span={8}>
            <span>B: {config.colorB}</span>
            <Slider
              min={0}
              max={255}
              value={config.colorB}
              onChange={(v) => setConfig({ ...config, colorB: v })}
            />
          </Col>
        </Row>
      </div>

      <div style={{ marginTop: 16 }}>
        <span>Alcance:</span>
        <Radio.Group 
          value={config.firstPageOnly ? 'first' : 'all'}
          onChange={(e) => setConfig({ ...config, firstPageOnly: e.target.value === 'first' })}
          style={{ marginLeft: 16 }}
        >
          <Radio.Button value="first">Primera página</Radio.Button>
          <Radio.Button value="all">Todas las páginas</Radio.Button>
        </Radio.Group>
      </div>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Upload
            accept=".pdf"
            showUploadList={false}
            beforeUpload={handleFileUpload}
          >
            <Button icon={<UploadOutlined />} loading={isUploadingPdf}>
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
          >
            Aplicar y Descargar
          </Button>
        </Col>
      </Row>

      {config.type === 'text' && (
        <div
          style={{
            marginTop: 24,
            padding: 20,
            background: '#f5f5f5',
            textAlign: 'center',
            fontSize: config.fontSize,
            color: `rgb(${config.colorR}, ${config.colorG}, ${config.colorB})`,
            opacity: config.opacity / 100,
            transform: `rotate(${config.rotation}deg)`,
          }}
        >
          {config.text}
        </div>
      )}

      {config.type === 'image' && imageFile && (
        <div
          style={{
            marginTop: 24,
            padding: 20,
            background: '#f5f5f5',
            textAlign: 'center',
          }}
        >
          <img 
            src={URL.createObjectURL(new Blob([new Uint8Array(imageFile.data)]))} 
            style={{ 
              width: `${config.imageScale}px`,
              opacity: config.opacity / 100,
              transform: `rotate(${config.rotation}deg)`,
            }} 
            alt="Preview"
          />
        </div>
      )}
    </Card>
  );
}