import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Card,
  Button,
  Row,
  Col,
  message,
  Typography,
  Space,
  Tag,
  Progress,
  Radio,
  Empty,
  Alert,
  List,
  Input,
  Modal,
} from 'antd';
import {
  FileZipOutlined,
  FolderOpenOutlined,
  FileAddOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { saveAs } from 'file-saver';

const { Text } = Typography;

type ZipLevel = 'max' | 'balanced' | 'fast';

const ZIP_LEVELS: Record<ZipLevel, { label: string; hint: string; level: number }> = {
  max: { label: 'Máxima (Ultra)', hint: 'Zopfli 30 iter., menor tamaño (lento)', level: 39 },
  balanced: { label: 'Balanceada', hint: 'Compresión y velocidad (6)', level: 6 },
  fast: { label: 'Rápida', hint: 'Máxima velocidad (1)', level: 1 },
};

interface ZipProgressEvent {
  processedBytes: number;
  totalBytes: number;
  currentFile: string | null;
}

interface ProgressState {
  percent: number;
  currentFile: string | null;
  processedBytes: number;
  totalBytes: number;
}

async function isTauriRuntime(): Promise<boolean> {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatRemaining(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds <= 0) {
    return 'calculando…';
  }
  const s = Math.round(seconds);
  if (s < 60) return `≈ ${s} s`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `≈ ${m} min ${rest} s`;
}

interface SelectedItem {
  id: string;
  name: string;
  isDir: boolean;
}

let itemSeq = 0;

export function ZipCompressorPage() {
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [paths, setPaths] = useState<string[]>([]);
  const [webFiles, setWebFiles] = useState<File[]>([]);
  const [level, setLevel] = useState<ZipLevel>('max');
  const [outputName, setOutputName] = useState('archivos.zip');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({
    percent: 0,
    currentFile: null,
    processedBytes: 0,
    totalBytes: 0,
  });
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [result, setResult] = useState<{ zipSize: number; elapsedMs: number; count: number } | null>(null);
  const [inTauri, setInTauri] = useState<boolean>(false);
  const startTimeRef = useRef<number>(0);
  const lastProgressRef = useRef<{ elapsedMs: number; percent: number }>({ elapsedMs: 0, percent: 0 });

  useEffect(() => {
    void isTauriRuntime().then(setInTauri);
  }, []);

  const handleProgress = useCallback((e: ZipProgressEvent) => {
    const total = e.totalBytes || 1;
    const pct = Math.min(100, Math.round((e.processedBytes / total) * 100));
    setProgress({
      percent: pct,
      currentFile: e.currentFile,
      processedBytes: e.processedBytes,
      totalBytes: e.totalBytes,
    });

    const now = Date.now();
    const elapsedMs = now - startTimeRef.current;
    // Estima el tiempo restante a partir de la velocidad media real.
    const deltaMs = elapsedMs - lastProgressRef.current.elapsedMs;
    const deltaPct = pct - lastProgressRef.current.percent;
    if (pct > 0 && pct < 100 && deltaMs > 0 && deltaPct > 0) {
      const msPerPct = deltaMs / deltaPct;
      setRemainingSeconds((msPerPct * (100 - pct)) / 1000);
    } else if (pct <= 0) {
      setRemainingSeconds(null);
    }
    lastProgressRef.current = { elapsedMs, percent: pct };
  }, []);

  const addItems = (newItems: SelectedItem[], newPaths: string[], newFiles: File[]) => {
    setItems((prev) => [...prev, ...newItems]);
    setPaths((prev) => [...prev, ...newPaths]);
    setWebFiles((prev) => [...prev, ...newFiles]);
    setResult(null);
  };

  const handleSelectFiles = async () => {
    if (inTauri) {
      try {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const selected = await open({
          multiple: true,
          filters: [],
          title: 'Seleccionar archivos para comprimir',
        });
        if (!selected) return;
        const arr = Array.isArray(selected) ? selected : [selected];
        if (arr.length === 0) return;
        addItems(
          arr.map((p) => {
            itemSeq += 1;
            const name = p.split(/[\\/]/).pop() || p;
            return { id: `f${itemSeq}`, name, isDir: false };
          }),
          arr as string[],
          [],
        );
      } catch (err) {
        console.error('[Zip] Error al seleccionar archivos:', err);
        message.error('No se pudo abrir el selector de archivos');
      }
      return;
    }

    // Fallback navegador: input de archivos múltiples.
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = () => {
      const files = Array.from(input.files ?? []);
      if (files.length === 0) return;
      addItems(
        files.map((f, i) => ({ id: `wf${Date.now()}_${i}`, name: f.name, isDir: false })),
        [],
        files,
      );
    };
    input.click();
  };

  const handleSelectFolder = async () => {
    if (!inTauri) {
      message.info('Seleccionar carpeta solo está disponible en la app de escritorio');
      return;
    }
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        directory: true,
        title: 'Seleccionar carpeta para comprimir',
      });
      if (!selected) return;
      itemSeq += 1;
      const name = selected.split(/[\\/]/).pop() || selected;
      addItems([{ id: `d${itemSeq}`, name, isDir: true }], [selected], []);
    } catch (err) {
      console.error('[Zip] Error al seleccionar carpeta:', err);
      message.error('No se pudo abrir el selector de carpetas');
    }
  };

  const handleRemoveItem = (id: string, index: number) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setPaths((prev) => prev.filter((_, i) => i !== index));
    setWebFiles((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const handleClear = () => {
    setItems([]);
    setPaths([]);
    setWebFiles([]);
    setResult(null);
    setProgress({ percent: 0, currentFile: null, processedBytes: 0, totalBytes: 0 });
    setRemainingSeconds(null);
  };

  const compressWithRust = async (
    selectedPaths: string[],
    onProgress: (e: ZipProgressEvent) => void,
  ): Promise<Uint8Array> => {
    const { Channel, invoke } = await import('@tauri-apps/api/core');
    const channel = new Channel<ZipProgressEvent>();
    channel.onmessage = (e) => onProgress(e);
    const result = await invoke<number[]>('create_zip', {
      request: {
        paths: selectedPaths,
        level: ZIP_LEVELS[level].level,
        output_name: outputName.replace(/\.zip$/i, ''),
      },
      onProgress: channel,
    });
    return new Uint8Array(result);
  };

  const compressWithBrowser = async (
    files: File[],
    onProgress: (e: ZipProgressEvent) => void,
  ): Promise<Uint8Array> => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    let totalBytes = 0;
    for (const file of files) {
      const buf = await file.arrayBuffer();
      zip.file(file.name, buf, { binary: true });
      totalBytes += buf.byteLength;
    }
    // JSZip solo soporta niveles 1-9; el nivel Ultra (Zopfli) solo existe en Rust.
    const jsZipLevel = Math.min(ZIP_LEVELS[level].level, 9);
    const blob = await zip.generateAsync(
      {
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: jsZipLevel },
      },
      (meta) => {
        const processed = Math.round((meta.percent / 100) * totalBytes);
        onProgress({
          processedBytes: processed,
          totalBytes,
          currentFile: meta.currentFile ?? null,
        });
      },
    );
    return new Uint8Array(await blob.arrayBuffer());
  };

  const handleCompress = async () => {
    const total = items.length;
    if (total === 0) {
      message.warning('Añade al menos un archivo o carpeta');
      return;
    }

    startTimeRef.current = Date.now();
    lastProgressRef.current = { elapsedMs: 0, percent: 0 };
    setProgress({ percent: 0, currentFile: null, processedBytes: 0, totalBytes: 0 });
    setRemainingSeconds(null);
    setIsProcessing(true);

    const start = Date.now();
    const filename = outputName.toLowerCase().endsWith('.zip')
      ? outputName
      : `${outputName}.zip`;

    try {
      let resultBytes: Uint8Array;

      if (inTauri) {
        resultBytes = await compressWithRust(paths, handleProgress);
      } else {
        resultBytes = await compressWithBrowser(webFiles, handleProgress);
      }

      const elapsedMs = Date.now() - start;
      setResult({ zipSize: resultBytes.byteLength, elapsedMs, count: total });
      setProgress((prev) => ({
        ...prev,
        percent: 100,
        processedBytes: prev.totalBytes,
        currentFile: null,
      }));

      setIsProcessing(false);

      if (inTauri) {
        try {
          const { save } = await import('@tauri-apps/plugin-dialog');
          const { writeFile } = await import('@tauri-apps/plugin-fs');
          const filePath = await save({
            defaultPath: filename,
            filters: [{ name: 'ZIP', extensions: ['zip'] }],
          });
          if (filePath) {
            await writeFile(filePath, resultBytes);
            message.success(`ZIP creado (${formatFileSize(resultBytes.byteLength)})`);
            return;
          }
        } catch (err) {
          console.error('[Zip] Error al guardar:', err);
        }
      }

      saveAs(
        new Blob([resultBytes.slice()], { type: 'application/zip' }),
        filename,
      );
      message.success('ZIP creado correctamente');
    } catch (err) {
      console.error('[Zip] Error:', err);
      message.error('Error al crear el ZIP');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card
      title={
        <Space>
          <FileZipOutlined />
          <span>Compresor ZIP</span>
        </Space>
      }
      extra={
        items.length > 0 && (
          <Button onClick={handleClear} icon={<DeleteOutlined />} disabled={isProcessing}>
            Limpiar
          </Button>
        )
      }
    >
      <Alert
        message="Comprime archivos y carpetas en ZIP"
        description="Añade archivos o carpetas completas de cualquier tipo y genera un ZIP con compresión deflate. El nivel «Máxima (Ultra)» usa el motor Zopfli (30 iteraciones, punto óptimo: más iteraciones apenas reducen el tamaño y multiplican el tiempo) para el menor tamaño posible; Balanceada y Rápida usan deflate clásico. En la app de escritorio usa el motor nativo Rust; en el navegador usa JSZip."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={24}>
        <Col xs={24} lg={14}>
          <Card size="small" title="1. Seleccionar contenido" style={{ marginBottom: 16 }}>
            <Space wrap>
              <Button
                icon={<FileAddOutlined />}
                onClick={handleSelectFiles}
                disabled={isProcessing}
              >
                Añadir archivos
              </Button>
              <Button
                icon={<FolderOpenOutlined />}
                onClick={handleSelectFolder}
                disabled={isProcessing}
              >
                Añadir carpeta
              </Button>
              {inTauri && (
                <Tag color="geekblue" icon={<ThunderboltOutlined />}>
                  Motor nativo Rust
                </Tag>
              )}
            </Space>

            {items.length > 0 && (
              <List
                size="small"
                style={{ marginTop: 16 }}
                dataSource={items}
                renderItem={(item, index) => (
                  <List.Item
                    actions={[
                      <Button
                        key="del"
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        disabled={isProcessing}
                        onClick={() => handleRemoveItem(item.id, index)}
                      />,
                    ]}
                  >
                    <Space>
                      {item.isDir ? <FolderOpenOutlined /> : <InboxOutlined />}
                      <Text>{item.name}</Text>
                      <Tag color={item.isDir ? 'gold' : 'blue'}>
                        {item.isDir ? 'Carpeta' : 'Archivo'}
                      </Tag>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>

          {items.length > 0 && (
            <Card size="small" title="2. Configuración">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio.Group
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  disabled={isProcessing}
                >
                  {Object.entries(ZIP_LEVELS).map(([key, cfg]) => (
                    <Radio.Button key={key} value={key}>
                      <Space>
                        <span>{cfg.label}</span>
                        <Text type="secondary">({cfg.hint})</Text>
                      </Space>
                    </Radio.Button>
                  ))}
                </Radio.Group>

                <Space>
                  <Text>Nombre del ZIP:</Text>
                  <Input
                    value={outputName}
                    onChange={(e) => setOutputName(e.target.value)}
                    disabled={isProcessing}
                    style={{ width: 280 }}
                    placeholder="archivos.zip"
                  />
                </Space>
              </Space>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={10}>
          <Card size="small" title="3. Resultado">
            {items.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div style={{ textAlign: 'center', padding: 16 }}>
                  <Text type="secondary">Elementos a comprimir</Text>
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                    {items.length}
                  </div>

                  {result && (
                    <>
                      <FileZipOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">Tamaño del ZIP</Text>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                          {formatFileSize(result.zipSize)}
                        </div>
                        <Space size={4} wrap>
                          <Tag icon={<ThunderboltOutlined />} color="blue">
                            {inTauri
                              ? level === 'max'
                                ? 'Motor Zopfli (Ultra)'
                                : 'Motor Rust'
                              : 'Motor JSZip'}
                          </Tag>
                          <Tag color="geekblue">
                            {(result.elapsedMs / 1000).toFixed(2)} s
                          </Tag>
                          <Tag color="purple">{result.count} elemento(s)</Tag>
                        </Space>
                      </div>
                    </>
                  )}
                </div>

                <Button
                  type="primary"
                  icon={<FileZipOutlined />}
                  onClick={handleCompress}
                  loading={isProcessing}
                  block
                  size="large"
                >
                  {result ? 'Comprimir de nuevo' : 'Crear ZIP'}
                </Button>
              </Space>
            ) : (
              <Empty description="Añade archivos o una carpeta para crear el ZIP" />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        open={isProcessing}
        closable={false}
        maskClosable={false}
        keyboard={false}
        footer={null}
        centered
        width={460}
      >
        <div style={{ textAlign: 'center', padding: '8px 8px 16px' }}>
          <FileZipOutlined style={{ fontSize: 44, color: '#1677ff' }} />
          <Typography.Title level={5} style={{ marginTop: 12, marginBottom: 4 }}>
            Comprimiendo archivos…
          </Typography.Title>
          <Text type="secondary" style={{ display: 'block' }}>
            {progress.currentFile
              ? `Comprimiendo: ${progress.currentFile}`
              : 'Preparando compresión…'}
          </Text>

          <Progress
            percent={progress.percent}
            status={progress.percent === 100 ? 'success' : 'active'}
            size={{ width: 380, height: 14 }}
            style={{ marginTop: 20 }}
          />

          <Space size="large" style={{ marginTop: 16 }}>
            <div>
              <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                Procesado
              </Text>
              <Text strong style={{ fontSize: 16 }}>
                {formatFileSize(progress.processedBytes)}
                {' / '}
                {formatFileSize(progress.totalBytes)}
              </Text>
            </div>
            <div>
              <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                Tiempo restante
              </Text>
              <Text strong style={{ fontSize: 16 }}>
                {formatRemaining(remainingSeconds)}
              </Text>
            </div>
          </Space>
        </div>
      </Modal>
    </Card>
  );
}
