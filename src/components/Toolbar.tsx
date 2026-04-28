import { Button, Space, message, Modal, Slider, Radio, Tooltip, Input, Dropdown, Empty } from 'antd';
import { DeleteOutlined, DownloadOutlined, SelectOutlined, CompressOutlined, RotateRightOutlined, PicCenterOutlined, SunOutlined, MoonOutlined, HistoryOutlined } from '@ant-design/icons';
import { useAppStore, type RecentFile } from '../stores/appStore';
import { mergePdfs, downloadPdf } from '../services/pdf.service';
import type { PageRef, PdfFile } from '../types';
import { useState } from 'react';

export function Toolbar() {
  const {
    pdfFiles,
    orderedPages,
    selectedPages,
    selectAllPages,
    deselectAllPages,
    removeSelectedPages,
    setIsProcessing,
    setError,
    recentFiles,
    theme,
    setTheme,
    clearRecentFiles,
  } = useAppStore();

  const [compressModalOpen, setCompressModalOpen] = useState(false);
  const [rotateModalOpen, setRotateModalOpen] = useState(false);
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [compressQuality, setCompressQuality] = useState(50);
  const [rotationAngle, setRotationAngle] = useState(90);
  const [splitRanges, setSplitRanges] = useState('');

  const hasPages = orderedPages.length > 0;
  const hasSelected = selectedPages.size > 0;

  const getMergedPdfData = async (): Promise<Uint8Array | null> => {
    if (orderedPages.length === 0) return null;

    const files = pdfFiles.map((f: PdfFile) => f.data);
    const pageOrder: PageRef[] = orderedPages.map((page) => {
      const fileIndex = pdfFiles.findIndex((f: PdfFile) => f.name === page.fileId);
      if (fileIndex === -1) return null;
      return {
        file_index: fileIndex,
        page_number: page.pageNumber,
      };
    }).filter(Boolean) as PageRef[];

    if (pageOrder.length === 0) return null;
    return await mergePdfs({ files, page_order: pageOrder });
  };

  const handleCompress = async () => {
    const pdfData = await getMergedPdfData();
    if (!pdfData) {
      message.warning('No hay PDF para comprimir');
      return;
    }

    setIsProcessing(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke<number[]>('compress_pdf', {
        fileData: Array.from(pdfData),
        quality: compressQuality / 100
      });
      const pdfBytes = new Uint8Array(result);
      downloadPdf(pdfBytes, 'compressed.pdf');
      message.success('PDF comprimido');
    } catch (err) {
      console.error('Compress error:', err);
      message.error('Error al comprimir');
    } finally {
      setIsProcessing(false);
      setCompressModalOpen(false);
    }
  };

  const handleRotate = async () => {
    const pdfData = await getMergedPdfData();
    if (!pdfData) {
      message.warning('No hay PDF para rotar');
      return;
    }

    const pagesToRotate = Array.from(selectedPages).map(pageId => {
      const page = orderedPages.find(p => p.id === pageId);
      return page?.pageNumber || 0;
    });

    if (pagesToRotate.length === 0) {
      message.warning('Selecciona páginas para rotar');
      return;
    }

    setIsProcessing(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke<number[]>('rotate_pages', {
        request: {
          file_data: Array.from(pdfData),
          pages: pagesToRotate,
          rotation: rotationAngle
        }
      });
      const pdfBytes = new Uint8Array(result);
      downloadPdf(pdfBytes, 'rotated.pdf');
      message.success('PDF rotado');
    } catch (err) {
      console.error('Rotate error:', err);
      message.error('Error al rotar');
    } finally {
      setIsProcessing(false);
      setRotateModalOpen(false);
    }
  };

  const handleSplit = async () => {
    const pdfData = await getMergedPdfData();
    if (!pdfData) {
      message.warning('No hay PDF para dividir');
      return;
    }

    if (!splitRanges.trim()) {
      message.warning('Ingresa los rangos de páginas');
      return;
    }

    setIsProcessing(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const ranges = splitRanges.split(',').map(r => r.trim());
      const results = await invoke<number[][]>('split_pdf', {
        request: {
          file_data: Array.from(pdfData),
          page_ranges: ranges
        }
      });
      results.forEach((pdfDataArr: number[], index: number) => {
        const pdfBytes = new Uint8Array(pdfDataArr);
        downloadPdf(pdfBytes, `split_part${index + 1}.pdf`);
      });
      message.success(`PDF dividido en ${results.length} partes`);
    } catch (err) {
      console.error('Split error:', err);
      message.error('Error al dividir');
    } finally {
      setIsProcessing(false);
      setSplitModalOpen(false);
    }
  };

  const handleMerge = async () => {
    if (orderedPages.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      console.log('[Toolbar] PDF files:', pdfFiles.length);
      console.log('[Toolbar] Ordered pages:', orderedPages.length);
      
      const files = pdfFiles.map((f: PdfFile) => f.data);
      console.log('[Toolbar] File data lengths:', files.map(f => f.byteLength));
      
      const pageOrder: PageRef[] = orderedPages.map((page) => {
        const fileIndex = pdfFiles.findIndex((f: PdfFile) => f.name === page.fileId);
        if (fileIndex === -1) {
          throw new Error(`Archivo no encontrado: ${page.fileId}`);
        }
        console.log('[Toolbar] Page:', page.fileId, 'pageNum:', page.pageNumber, 'fileIndex:', fileIndex);
        return {
          file_index: fileIndex,
          page_number: page.pageNumber,
        };
      });

      console.log('[Toolbar] Calling mergePdfs with', pageOrder.length, 'pages');
      const merged = await mergePdfs({ files, page_order: pageOrder });
      console.log('[Toolbar] Merge result size:', merged.byteLength);
      downloadPdf(merged, 'merged.pdf');
      message.success('PDF combinado exitosamente');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al combinar PDFs';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedPages.size === orderedPages.length) {
      deselectAllPages();
    } else {
      selectAllPages();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatTimestamp = (ts: number): string => {
    const date = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    return date.toLocaleDateString();
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const recentFilesMenu = {
    items: [
      {
        key: 'header',
        label: (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
            <span style={{ fontWeight: 600 }}>Archivos Recientes</span>
            {recentFiles.length > 0 && (
              <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); clearRecentFiles(); }}>
                Limpiar
              </Button>
            )}
          </div>
        ),
        disabled: true,
      },
      ...(recentFiles.length === 0 ? [{
        key: 'empty',
        label: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Sin archivos recientes" />,
      }] : recentFiles.map((file: RecentFile) => ({
        key: file.id,
        label: (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: 250 }}>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <div>{file.name}</div>
              <div style={{ fontSize: 11, color: '#888' }}>
                {formatFileSize(file.size)} • {formatTimestamp(file.timestamp)}
              </div>
            </div>
          </div>
        ),
        onClick: () => {
          message.info('Abre el archivo desde el módulo correspondiente');
        },
      }))),
    ],
  };

  const themeIcon = theme === 'dark' ? <SunOutlined /> : <MoonOutlined />;
  const themeLabel = theme === 'dark' ? 'Modo claro' : 'Modo oscuro';

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: theme === 'dark' ? '#1f1f1f' : '#fafafa',
          borderBottom: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`,
        }}
      >
        <Space>
          <Button
            icon={<SelectOutlined />}
            onClick={handleSelectAll}
            disabled={!hasPages}
          >
            {selectedPages.size === orderedPages.length && orderedPages.length > 0
              ? 'Deseleccionar'
              : 'Seleccionar todo'}
          </Button>

          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={removeSelectedPages}
            disabled={!hasSelected}
          >
            Eliminar ({selectedPages.size})
          </Button>

          <Tooltip title="Comprimir PDF">
            <Button
              icon={<CompressOutlined />}
              onClick={() => setCompressModalOpen(true)}
              disabled={!hasPages}
            />
          </Tooltip>

          <Tooltip title="Rotar páginas seleccionadas">
            <Button
              icon={<RotateRightOutlined />}
              onClick={() => setRotateModalOpen(true)}
              disabled={!hasSelected}
            />
          </Tooltip>

          <Tooltip title="Dividir PDF">
            <Button
              icon={<PicCenterOutlined />}
              onClick={() => setSplitModalOpen(true)}
              disabled={!hasPages}
            />
          </Tooltip>

          <Dropdown menu={recentFilesMenu} trigger={['click']}>
            <Tooltip title="Archivos recientes">
              <Button icon={<HistoryOutlined />} />
            </Tooltip>
          </Dropdown>
        </Space>

        <Space>
          <Tooltip title={themeLabel}>
            <Button
              icon={themeIcon}
              onClick={handleThemeToggle}
            />
          </Tooltip>

          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleMerge}
            disabled={!hasPages}
          >
            Unir y descargar ({orderedPages.length} pág)
          </Button>
        </Space>
      </div>

      <Modal title="Comprimir PDF" open={compressModalOpen} onOk={handleCompress} onCancel={() => setCompressModalOpen(false)}>
        <p>Calidad: {compressQuality}%</p>
        <Slider min={10} max={100} value={compressQuality} onChange={setCompressQuality} />
      </Modal>

      <Modal title="Rotar Páginas" open={rotateModalOpen} onOk={handleRotate} onCancel={() => setRotateModalOpen(false)}>
        <p>Ángulo de rotación:</p>
        <Radio.Group value={rotationAngle} onChange={(e) => setRotationAngle(e.target.value)}>
          <Radio.Button value={90}>90°</Radio.Button>
          <Radio.Button value={180}>180°</Radio.Button>
          <Radio.Button value={270}>270°</Radio.Button>
        </Radio.Group>
        <p style={{ marginTop: 16 }}>{selectedPages.size} página(s) seleccionada(s)</p>
      </Modal>

      <Modal title="Dividir PDF" open={splitModalOpen} onOk={handleSplit} onCancel={() => setSplitModalOpen(false)}>
        <p>Ingresa los rangos de páginas (ej: 1-3, 4-6, 7-10):</p>
        <Input
          style={{ width: '100%' }}
          placeholder="Ej: 1-3, 4-6"
          value={splitRanges}
          onChange={(e) => setSplitRanges(e.target.value)}
        />
      </Modal>
    </>
  );
}