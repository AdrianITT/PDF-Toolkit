import { useState } from 'react';
import { Card, Button, Upload, Alert, message, Space, List, Tag, Progress, Image } from 'antd';
import { FileImageOutlined, FilePdfOutlined, DownloadOutlined } from '@ant-design/icons';
import { loadPdf, isPdfValid, pdfjsLib } from '../../utils/pdfjs';

interface ExtractedImage {
  page: number;
  index: number;
  dataUrl: string;
  width: number;
  height: number;
}

export function ImageExtractorPage() {
  const [pdfFile, setPdfFile] = useState<{ name: string; data: Uint8Array } | null>(null);
  const [images, setImages] = useState<ExtractedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      
      if (!isPdfValid(data)) {
        message.error('El archivo no es un PDF válido');
        return false;
      }
      
      setPdfFile({ name: file.name, data });
      setImages([]);
      setProgress(0);
      
      message.success('PDF cargado correctamente');
    } catch (err) {
      message.error('Error al cargar el PDF');
    }
    return false;
  };

  const extractImages = async () => {
    if (!pdfFile) {
      message.warning('Sube un PDF primero');
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setImages([]);

    try {
      const { doc, numPages } = await loadPdf(pdfFile.data);
      const extractedImages: ExtractedImage[] = [];

      message.info('Extrayendo imágenes...');

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await doc.getPage(pageNum);
          const operatorList = await page.getOperatorList();
          
          // Buscar operadores de imagen en el contenido
          for (let i = 0; i < operatorList.fnArray.length; i++) {
            if (pdfjsLib && operatorList.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
              const imgIndex = operatorList.argsArray[i][0];
              try {
                const img: any = page.objs.get(imgIndex);
                if (img) {
                  let dataUrl = '';
                  let imgWidth = 0;
                  let imgHeight = 0;
                  
                  if (img instanceof ImageBitmap || ('bitmap' in img && img.bitmap instanceof ImageBitmap)) {
                    const bitmap = img instanceof ImageBitmap ? img : img.bitmap;
                    imgWidth = bitmap.width;
                    imgHeight = bitmap.height;
                    const canvas = document.createElement('canvas');
                    canvas.width = bitmap.width;
                    canvas.height = bitmap.height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.drawImage(bitmap, 0, 0);
                      dataUrl = canvas.toDataURL('image/png');
                    }
                  } else if (img.data && img.width && img.height) {
                    imgWidth = img.width;
                    imgHeight = img.height;
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      let pixelData = img.data;
                      if (!(pixelData instanceof Uint8ClampedArray)) {
                         pixelData = new Uint8ClampedArray(pixelData);
                      }
                      const imageData = new ImageData(pixelData, img.width, img.height);
                      ctx.putImageData(imageData, 0, 0);
                      dataUrl = canvas.toDataURL('image/png');
                    }
                  }
                  
                  if (dataUrl) {
                    extractedImages.push({
                      page: pageNum,
                      index: extractedImages.length + 1,
                      dataUrl,
                      width: imgWidth,
                      height: imgHeight,
                    });
                  }
                }
              } catch (err) {
                 console.warn(`Could not extract image ${imgIndex} on page ${pageNum}`, err);
              }
            }
          }
          
          setProgress(10 + (pageNum / numPages) * 70);
        } catch (pageErr) {
          console.error(`Error en página ${pageNum}:`, pageErr);
        }
      }

      setImages(extractedImages);
      setProgress(100);
      
      if (extractedImages.length > 0) {
        message.success(`Extraídas ${extractedImages.length} imagen(es)`);
      } else {
        message.info('No se encontraron imágenes en el PDF');
      }
    } catch (err) {
      console.error('[ImageExtractor] Error:', err);
      message.error('Error al extraer imágenes');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = (img: ExtractedImage) => {
    const link = document.createElement('a');
    link.href = img.dataUrl;
    link.download = `imagen_p${img.page}_${img.index}.png`;
    link.click();
  };

  const downloadAll = () => {
    images.forEach((img, idx) => {
      setTimeout(() => downloadImage(img), idx * 100);
    });
    message.success(`Descargando ${images.length} imagen(es)`);
  };

  return (
    <Card
      title={
        <Space>
          <FileImageOutlined />
          Extractor de Imágenes
        </Space>
      }
      extra={
        <Tag color="blue">{images.length} imagen(es)</Tag>
      }
    >
      <Alert
        type="info"
        message="¿Qué hace el extractor?"
        description="Extrae todas las imágenes embebidas en el PDF, permitiendo descargarlas individualmente o en conjunto."
        showIcon
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Upload
          accept=".pdf"
          showUploadList={false}
          beforeUpload={handleFileUpload}
        >
          <Button icon={<FilePdfOutlined />} loading={isProcessing}>
            {pdfFile ? pdfFile.name : 'Subir PDF'}
          </Button>
        </Upload>

        {pdfFile && (
          <Button
            type="primary"
            icon={<FileImageOutlined />}
            onClick={extractImages}
            loading={isProcessing}
            disabled={isProcessing}
            style={{ marginLeft: 8 }}
          >
            {isProcessing ? 'Extrayendo...' : 'Extraer Imágenes'}
          </Button>
        )}
      </div>

      {isProcessing && (
        <div style={{ marginBottom: 16 }}>
          <Progress percent={Math.round(progress)} status="active" />
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            Procesando páginas...
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={downloadAll}
            style={{ marginBottom: 16 }}
          >
            Descargar Todas
          </Button>

          <List
            grid={{ gutter: 16, column: 4 }}
            dataSource={images}
            renderItem={(img: ExtractedImage) => (
              <List.Item>
                <div
                  style={{
                    border: '1px solid #d9d9d9',
                    borderRadius: 8,
                    padding: 8,
                    textAlign: 'center',
                  }}
                >
                  <Image
                    src={img.dataUrl}
                    alt={`Página ${img.page}`}
                    style={{ maxWidth: '100%', maxHeight: 150 }}
                    preview={false}
                  />
                  <div style={{ marginTop: 8, fontSize: 12 }}>
                    <Tag>Página {img.page}</Tag>
                    <Tag>{img.width}x{img.height}</Tag>
                  </div>
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => downloadImage(img)}
                    style={{ marginTop: 8 }}
                  >
                    Descargar
                  </Button>
                </div>
              </List.Item>
            )}
          />
        </div>
      )}

      {!pdfFile && (
        <Alert
          type="warning"
          message="Paso 1: Sube un PDF"
          description="Selecciona un PDF que contenga imágenes para extraerlas."
          showIcon
        />
      )}

      <Alert
        type="warning"
        message="Función en desarrollo"
        description="La extracción actual es básica. Los PDFs con imágenes complejas pueden requerir procesamiento adicional."
        showIcon
        style={{ marginTop: 16 }}
      />
    </Card>
  );
}
