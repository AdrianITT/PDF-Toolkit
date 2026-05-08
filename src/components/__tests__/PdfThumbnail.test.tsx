import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PdfThumbnail } from '../PdfThumbnail';
import type { PdfPage } from '../../types';

vi.mock('../../stores/appStore', () => ({
  useAppStore: vi.fn(() => ({
    selectedPages: new Set(),
    togglePageSelection: vi.fn(),
  })),
}));

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: vi.fn(() => '') } },
}));

const mockPage: PdfPage = {
  id: 'page-1',
  fileId: 'file-1',
  pageNumber: 1,
  thumbnail: 'data:image/png;base64,test',
  fileName: 'documento.pdf',
};

describe('PdfThumbnail', () => {
  it('renders page thumbnail with image', () => {
    render(<PdfThumbnail page={mockPage} index={0} />);
    const img = screen.getByAltText('P\u00e1gina 1');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(mockPage.thumbnail);
  });

  it('shows page number', () => {
    render(<PdfThumbnail page={mockPage} index={0} />);
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('shows filename and page info', () => {
    render(<PdfThumbnail page={mockPage} index={0} />);
    expect(screen.getByText(/documento.pdf - P.g. 1/)).toBeTruthy();
  });

  it('shows correct page number for index 5', () => {
    render(<PdfThumbnail page={{ ...mockPage, id: 'page-6', pageNumber: 6 }} index={5} />);
    expect(screen.getByText('6')).toBeTruthy();
  });

  it('renders checkbox for selection', () => {
    render(<PdfThumbnail page={mockPage} index={0} />);
    const checkbox = document.querySelector('.ant-checkbox');
    expect(checkbox).toBeTruthy();
  });
});
