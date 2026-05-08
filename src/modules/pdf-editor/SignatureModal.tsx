import { Modal, List, Empty } from 'antd';
import { useEffect, useState } from 'react';

interface SignatureModalProps {
  open: boolean;
  onClose: () => void;
  onSelectSignature: (dataUrl: string) => void;
  onSelectStamp: (dataUrl: string) => void;
}

interface SavedItem {
  id: string;
  name: string;
  dataUrl: string;
}

export function SignatureModal({
  open,
  onClose,
  onSelectSignature,
  onSelectStamp,
}: SignatureModalProps) {
  const [savedSignatures, setSavedSignatures] = useState<SavedItem[]>([]);
  const [savedStamps, setSavedStamps] = useState<SavedItem[]>([]);

  useEffect(() => {
    if (open) {
      loadSavedItems();
    }
  }, [open]);

  const loadSavedItems = () => {
    const savedSigs = localStorage.getItem('savedSignatures');
    const savedStmps = localStorage.getItem('savedStamps');
    if (savedSigs) {
      try { setSavedSignatures(JSON.parse(savedSigs)); } catch {}
    }
    if (savedStmps) {
      try { setSavedStamps(JSON.parse(savedStmps)); } catch {}
    }
  };

  return (
    <Modal
      title="Seleccionar Firma o Sello"
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <List
        grid={{ gutter: 16, column: 3 }}
        dataSource={savedSignatures}
        renderItem={(sig: any) => (
          <List.Item>
            <div
              onClick={() => onSelectSignature(sig.dataUrl)}
              style={{
                border: '1px solid #d9d9d9',
                borderRadius: 8,
                padding: 8,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <img src={sig.dataUrl} alt={sig.name} style={{ maxWidth: '100%', maxHeight: 80 }} />
              <div style={{ marginTop: 4, fontSize: 12 }}>{sig.name}</div>
            </div>
          </List.Item>
        )}
      />
      {savedSignatures.length === 0 && <Empty description="No hay firmas guardadas" />}

      <div style={{ marginTop: 16, fontWeight: 'bold' }}>Sellos</div>
      <List
        grid={{ gutter: 16, column: 3 }}
        dataSource={savedStamps}
        renderItem={(stamp: any) => (
          <List.Item>
            <div
              onClick={() => onSelectStamp(stamp.dataUrl)}
              style={{
                border: '1px solid #d9d9d9',
                borderRadius: 8,
                padding: 8,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <img src={stamp.dataUrl} alt={stamp.name} style={{ maxWidth: '100%', maxHeight: 80 }} />
              <div style={{ marginTop: 4, fontSize: 12 }}>{stamp.name}</div>
            </div>
          </List.Item>
        )}
      />
      {savedStamps.length === 0 && <Empty description="No hay sellos guardados" />}
    </Modal>
  );
}
