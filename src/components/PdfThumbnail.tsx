import { Checkbox } from 'antd';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PdfPage } from '../types';
import { useAppStore } from '../stores/appStore';

interface PdfThumbnailProps {
  page: PdfPage;
  index: number;
}

export function PdfThumbnail({ page, index }: PdfThumbnailProps) {
  const { selectedPages, togglePageSelection } = useAppStore();
  const isSelected = selectedPages.has(page.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        width: 140,
        margin: 8,
        position: 'relative',
        cursor: 'grab',
        borderRadius: 4,
        overflow: 'hidden',
        border: isSelected ? '2px solid #1890ff' : '2px solid transparent',
        boxShadow: isSelected ? '0 0 0 2px rgba(24, 144, 255, 0.2)' : 'none',
      }}
      {...attributes}
      {...listeners}
    >
      <div
        style={{
          position: 'absolute',
          top: 4,
          left: 4,
          zIndex: 10,
        }}
      >
        <Checkbox
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            togglePageSelection(page.id);
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          zIndex: 10,
          background: 'rgba(255,255,255,0.9)',
          borderRadius: 4,
          padding: '2px 6px',
          fontSize: 12,
          color: '#666',
        }}
      >
        {index + 1}
      </div>

      <img
        src={page.thumbnail}
        alt={`Página ${page.pageNumber}`}
        style={{
          width: '100%',
          display: 'block',
          background: '#ccc',
        }}
      />

      <div
        style={{
          padding: '4px 8px',
          background: '#f5f5f5',
          fontSize: 11,
          color: '#666',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {page.fileName} - Pág. {page.pageNumber}
      </div>
    </div>
  );
}