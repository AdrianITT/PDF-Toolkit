import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
import { useAppStore } from '../stores/appStore';
import { PdfThumbnail } from './PdfThumbnail';

export function PdfGrid() {
  const { orderedPages, reorderPages } = useAppStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = orderedPages.findIndex((p) => p.id === active.id);
      const newIndex = orderedPages.findIndex((p) => p.id === over.id);
      reorderPages(oldIndex, newIndex);
    }
  };

  if (orderedPages.length === 0) {
    return null;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={orderedPages.map((p) => p.id)}
        strategy={rectSortingStrategy}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            padding: 16,
            maxHeight: 'calc(100vh - 280px)',
            overflowY: 'auto',
            background: '#fff',
          }}
        >
          {orderedPages.map((page, index) => (
            <PdfThumbnail key={page.id} page={page} index={index} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}