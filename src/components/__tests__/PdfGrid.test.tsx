import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PdfGrid } from '../PdfGrid';

const mockUseAppStore = vi.fn();

vi.mock('../../stores/appStore', () => ({
  useAppStore: (...args: any[]) => mockUseAppStore(...args),
}));

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  SortableContext: ({ children }: any) => <div>{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  rectSortingStrategy: {},
}));

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
}));

describe('PdfGrid', () => {
  it('returns null when no pages', () => {
    mockUseAppStore.mockReturnValue({
      orderedPages: [],
      reorderPages: vi.fn(),
      selectedPages: new Set(),
      togglePageSelection: vi.fn(),
    });
    const { container } = render(<PdfGrid />);
    expect(container.innerHTML).toBe('');
  });

  it('renders pages when orderedPages has items', () => {
    mockUseAppStore.mockReturnValue({
      orderedPages: [
        { id: 'p1', fileId: 'f1', pageNumber: 1, thumbnail: 'data:image/png;base64,x', fileName: 'test.pdf' },
        { id: 'p2', fileId: 'f1', pageNumber: 2, thumbnail: 'data:image/png;base64,y', fileName: 'test.pdf' },
      ],
      reorderPages: vi.fn(),
      selectedPages: new Set(),
      togglePageSelection: vi.fn(),
    });
    const { container } = render(<PdfGrid />);
    expect(container.querySelector('.ant-checkbox')).toBeTruthy();
  });

  it('renders DndContext container', () => {
    mockUseAppStore.mockReturnValue({
      orderedPages: [
        { id: 'p1', fileId: 'f1', pageNumber: 1, thumbnail: 'data:image/png;base64,x', fileName: 'test.pdf' },
      ],
      reorderPages: vi.fn(),
      selectedPages: new Set(),
      togglePageSelection: vi.fn(),
    });
    render(<PdfGrid />);
    expect(screen.getByText(/test.pdf/)).toBeTruthy();
  });
});
