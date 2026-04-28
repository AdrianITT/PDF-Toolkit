import { useState } from 'react';
import { Card, Row, Col, Button, Upload, Input, message, Slider, Radio, Space, Tag, Alert } from 'antd';
import { 
  CompressOutlined, 
  ScissorOutlined, 
  LockOutlined,
  RotateRightOutlined,
  DeleteOutlined,
  UploadOutlined,
  DownloadOutlined,
  PicCenterOutlined
} from '@ant-design/icons';

interface PdfToolFile {
  uid: string;
  name: string;
  data: Uint8Array;
  pageCount?: number;
}

type ToolMode = 'compress' | 'split' | 'rotate' | 'protect' | 'delete';

export function PdfToolsPage() {
  const [toolMode, setToolMode] = useState<ToolMode>('compress');
  const [pdfFile, setPdfFile] = useState<PdfToolFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [compressQuality, setCompressQuality] = useState(50);
  const [rotation, setRotation] = useState(90);
  const [userPassword, setUserPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [pagesToProcess, setPagesToProcess] = useState<number[]>([]);

  const handleFileUpload = async (file: File) => {
    const buffer = await file.arrayBuffer();
    setPdfFile({
      uid: file.name,
      name: file.name,
      data: new Uint8Array(buffer),
    });
    return false;
  };

  const compressPdf = async () => {
    if (!pdfFile) {
      message.warning('Sube un PDF primero');
      return;
    }

    setLoading(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke<number[]>('compress_pdf', {
        file_data: Array.from(pdfFile.data),
        quality: compressQuality / 100
      });

      const pdfBytes = new Uint8Array(result);
      downloadPdf(pdfBytes, pdfFile.name.replace('.pdf', '_compressed.pdf'));
      message.success('PDF comprimido exitosamente');
    } catch (err) {
      console.error('Compress error:', err);
      message.error('Error al comprimir PDF');
    } finally {
      setLoading(false);
    }
  };

  const rotatePdf = async () => {
    if (!pdfFile) {
      message.warning('Sube un PDF primero');
      return;
    }

    if (pagesToProcess.length === 0) {
      message.warning('Selecciona las páginas a rotar');
      return;
    }

    setLoading(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke<number[]>('rotate_pages', {
        request: {
          file_data: Array.from(pdfFile.data),
          pages: pagesToProcess,
          rotation: rotation
        }
      });

      const pdfBytes = new Uint8Array(result);
      downloadPdf(pdfBytes, pdfFile.name.replace('.pdf', '_rotated.pdf'));
      message.success('PDF rotado exitosamente');
    } catch (err) {
      console.error('Rotate error:', err);
      message.error('Error al rotar PDF');
    } finally {
      setLoading(false);
    }
  };

  const protectPdf = async () => {
    if (!pdfFile) {
      message.warning('Sube un PDF primero');
      return;
    }

    if (!userPassword && !ownerPassword) {
      message.warning('Ingresa al menos una contraseña');
      return;
    }

    setLoading(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke<number[]>('protect_pdf', {
        request: {
          file_data: Array.from(pdfFile.data),
          userPassword: userPassword || null,
          ownerPassword: ownerPassword || null
        }
      });

      const pdfBytes = new Uint8Array(result);
      downloadPdf(pdfBytes, pdfFile.name.replace('.pdf', '_protected.pdf'));
      message.success('PDF protegido exitosamente');
    } catch (err) {
      console.error('Protect error:', err);
      message.error('Error al proteger PDF');
    } finally {
      setLoading(false);
    }
  };

  const deletePagesPdf = async () => {
    if (!pdfFile) {
      message.warning('Sube un PDF primero');
      return;
    }

    if (pagesToProcess.length === 0) {
      message.warning('Selecciona las páginas a eliminar');
      return;
    }

    setLoading(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke<number[]>('delete_pages', {
        request: {
          file_data: Array.from(pdfFile.data),
          pages_to_delete: pagesToProcess
        }
      });

      const pdfBytes = new Uint8Array(result);
      downloadPdf(pdfBytes, pdfFile.name.replace('.pdf', '_modified.pdf'));
      message.success('Páginas eliminadas exitosamente');
    } catch (err) {
      console.error('Delete error:', err);
      message.error('Error al eliminar páginas');
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = (data: Uint8Array, filename: string) => {
    const copy = new Uint8Array(data.length);
    copy.set(data);
    const blob = new Blob([copy], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toolOptions = [
    { value: 'compress', label: 'Comprimir', icon: <CompressOutlined /> },
    { value: 'rotate', label: 'Rotar páginas', icon: <RotateRightOutlined /> },
    { value: 'delete', label: 'Eliminar páginas', icon: <DeleteOutlined /> },
    { value: 'split', label: 'Dividir PDF', icon: <PicCenterOutlined /> },
    { value: 'protect', label: 'Proteger PDF', icon: <LockOutlined /> },
  ];

  return (
    <Card
      title={
        <Space>
          <ScissorOutlined />
          Herramientas PDF
        </Space>
      }
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Radio.Group 
            value={toolMode} 
            onChange={(e) => setToolMode(e.target.value)}
            buttonStyle="solid"
          >
            {toolOptions.map(opt => (
              <Radio.Button key={opt.value} value={opt.value}>
                {opt.icon} {opt.label}
              </Radio.Button>
            ))}
          </Radio.Group>
        </Col>

        <Col span={24}>
          <Upload
            accept=".pdf"
            showUploadList={false}
            beforeUpload={handleFileUpload}
          >
            <Button icon={<UploadOutlined />}>
              {pdfFile ? pdfFile.name : 'Subir PDF'}
            </Button>
          </Upload>
        </Col>

        {toolMode === 'compress' && (
          <>
            <Col span={24}>
              <Alert 
                message="Compresión de PDF" 
                description="Reduce el tamaño del archivo PDF. Una calidad más baja significa un archivo más pequeño."
                type="info"
                showIcon
              />
            </Col>
            <Col span={24}>
              <span>Calidad: {compressQuality}%</span>
              <Slider 
                min={10} 
                max={100} 
                value={compressQuality} 
                onChange={setCompressQuality}
              />
            </Col>
            <Col span={24}>
              <Button 
                type="primary" 
                icon={<DownloadOutlined />} 
                onClick={compressPdf}
                loading={loading}
                disabled={!pdfFile}
              >
                Comprimir y Descargar
              </Button>
            </Col>
          </>
        )}

        {toolMode === 'rotate' && (
          <>
            <Col span={24}>
              <Alert 
                message="Rotar Páginas" 
                description="Selecciona las páginas y el ángulo de rotación."
                type="info"
                showIcon
              />
            </Col>
            <Col span={24}>
              <span>Rotación: {rotation}°</span>
              <Radio.Group value={rotation} onChange={(e) => setRotation(e.target.value)}>
                <Radio.Button value={90}>90°</Radio.Button>
                <Radio.Button value={180}>180°</Radio.Button>
                <Radio.Button value={270}>270°</Radio.Button>
              </Radio.Group>
            </Col>
            <Col span={24}>
              <Input 
                placeholder="Páginas a rotar (ej: 1,3,5 o 1-5)" 
                onChange={(e) => {
                  const pages: number[] = [];
                  const parts = e.target.value.split(',');
                  for (const part of parts) {
                    if (part.includes('-')) {
                      const [start, end] = part.split('-').map(Number);
                      for (let i = start; i <= end; i++) pages.push(i);
                    } else {
                      pages.push(Number(part));
                    }
                  }
                  setPagesToProcess(pages);
                }}
              />
              <Tag color="blue">Páginas: {pagesToProcess.join(', ') || 'Ninguna'}</Tag>
            </Col>
            <Col span={24}>
              <Button 
                type="primary" 
                icon={<DownloadOutlined />} 
                onClick={rotatePdf}
                loading={loading}
                disabled={!pdfFile}
              >
                Rotar y Descargar
              </Button>
            </Col>
          </>
        )}

        {toolMode === 'delete' && (
          <>
            <Col span={24}>
              <Alert 
                message="Eliminar Páginas" 
                description="Ingresa los números de páginas a eliminar."
                type="warning"
                showIcon
              />
            </Col>
            <Col span={24}>
              <Input 
                placeholder="Páginas a eliminar (ej: 1,3,5 o 1-5)" 
                onChange={(e) => {
                  const pages: number[] = [];
                  const parts = e.target.value.split(',');
                  for (const part of parts) {
                    if (part.includes('-')) {
                      const [start, end] = part.split('-').map(Number);
                      for (let i = start; i <= end; i++) pages.push(i);
                    } else {
                      pages.push(Number(part));
                    }
                  }
                  setPagesToProcess(pages);
                }}
              />
              <Tag color="red">Se eliminarán: {pagesToProcess.join(', ') || 'Ninguna'}</Tag>
            </Col>
            <Col span={24}>
              <Button 
                danger 
                icon={<DeleteOutlined />} 
                onClick={deletePagesPdf}
                loading={loading}
                disabled={!pdfFile}
              >
                Eliminar Páginas y Descargar
              </Button>
            </Col>
          </>
        )}

        {toolMode === 'protect' && (
          <>
            <Col span={24}>
              <Alert 
                message="Proteger PDF" 
                description="Agrega contraseña al PDF para proteger su contenido."
                type="warning"
                showIcon
              />
            </Col>
            <Col span={12}>
              <Input.Password 
                placeholder="Contraseña de usuario (para abrir)"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
              />
            </Col>
            <Col span={12}>
              <Input.Password 
                placeholder="Contraseña de owner (para editar)"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
              />
            </Col>
            <Col span={24}>
              <Button 
                type="primary" 
                icon={<LockOutlined />} 
                onClick={protectPdf}
                loading={loading}
                disabled={!pdfFile}
              >
                Proteger y Descargar
              </Button>
            </Col>
          </>
        )}

        {toolMode === 'split' && (
          <>
            <Col span={24}>
              <Alert 
                message="Dividir PDF" 
                description="Divide el PDF en múltiples archivos. Ejemplo: 1-3, 4-6, 7-10"
                type="info"
                showIcon
              />
            </Col>
            <Col span={24}>
              <Input.TextArea 
                placeholder="Rangos de páginas (ej: 1-3, 4-6, 7-10)"
                rows={3}
                id="splitRanges"
              />
            </Col>
            <Col span={24}>
              <Button 
                type="primary" 
                icon={<PicCenterOutlined />} 
                onClick={async () => {
                  if (!pdfFile) {
                    message.warning('Sube un PDF primero');
                    return;
                  }
                  const rangesInput = (document.getElementById('splitRanges') as HTMLTextAreaElement)?.value;
                  if (!rangesInput) {
                    message.warning('Ingresa los rangos de páginas');
                    return;
                  }
                  setLoading(true);
                  try {
                    const { invoke } = await import('@tauri-apps/api/core');
                    const ranges = rangesInput.split(',').map(r => r.trim());
                    const results = await invoke<number[][]>('split_pdf', {
                      request: {
                        file_data: Array.from(pdfFile.data),
                        page_ranges: ranges
                      }
                    });
                    results.forEach((pdfData: number[], index: number) => {
                      const pdfBytes = new Uint8Array(pdfData);
                      downloadPdf(pdfBytes, pdfFile.name.replace('.pdf', `_part${index + 1}.pdf`));
                    });
                    message.success(`PDF dividido en ${results.length} partes`);
                  } catch (err) {
                    console.error('Split error:', err);
                    message.error('Error al dividir PDF');
                  } finally {
                    setLoading(false);
                  }
                }}
                loading={loading}
                disabled={!pdfFile}
              >
                Dividir y Descargar
              </Button>
            </Col>
          </>
        )}
      </Row>
    </Card>
  );
}
