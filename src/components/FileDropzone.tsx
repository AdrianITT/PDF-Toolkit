import { InboxOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import { useFileUpload } from '../hooks/useFileUpload';
import { useAppStore } from '../stores/appStore';

export function FileDropzone() {
  const { getRootProps, getInputProps, isDragActive, isProcessing, error } = useFileUpload((files) => {
    console.log('[FileDropzone] Files received:', files.length);
    
    if (files.length === 0) return;
    
    const { orderedPages, pdfFiles } = useAppStore.getState();
    const newOrderedPages = [...orderedPages, ...files.flatMap((f) => f.pages)];
    const newPdfFiles = [...pdfFiles, ...files];
    
    console.log('[FileDropzone] Updating store: total files:', newPdfFiles.length, 'total pages:', newOrderedPages.length);
    
    useAppStore.setState({
      pdfFiles: newPdfFiles,
      orderedPages: newOrderedPages,
    });
  });

  return (
    <div {...getRootProps()} style={{ position: 'relative' }}>
      {/* Input de archivo oculto */}
      <input {...getInputProps()} style={{ display: 'none' }} />
      
      <div
        style={{
          padding: isDragActive ? 20 : 40,
          background: isDragActive ? '#f0f5ff' : '#fafafa',
          border: '2px dashed #d9d9d9',
          borderRadius: 8,
          textAlign: 'center',
          cursor: 'pointer',
          opacity: isProcessing ? 0.6 : 1,
        }}
      >
        {isProcessing ? (
          <Spin size="large" />
        ) : (
          <>
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text" style={{ fontSize: 16 }}>
              Arrastra archivos PDF aquí o haz clic para seleccionar
            </p>
            <p className="ant-upload-hint" style={{ color: '#999' }}>
              Soporta múltiples archivos PDF
            </p>
          </>
        )}
        
        {error && (
          <p style={{ color: 'red', marginTop: 8 }}>{error}</p>
        )}
      </div>
    </div>
  );
}