import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../../utils/pdfjs', () => ({
  loadPdf: vi.fn(),
  renderPage: vi.fn(),
  isPdfValid: vi.fn(),
  getPageDimensions: vi.fn(),
  pdfjsLib: null,
  PDFDocumentProxy: {},
}));

const mockState = {
  activeModule: 'pdf-editor',
  pdfFiles: [],
  orderedPages: [],
  selectedPages: new Set(),
  isProcessing: false,
  error: null,
  overlays: [],
  currentPdfPath: null,
  recentFiles: [],
  theme: 'light',
  setActiveModule: vi.fn(),
  addPdfFile: vi.fn(),
  removePdfFile: vi.fn(),
  setOrderedPages: vi.fn(),
  reorderPages: vi.fn(),
  togglePageSelection: vi.fn(),
  selectAllPages: vi.fn(),
  deselectAllPages: vi.fn(),
  removeSelectedPages: vi.fn(),
  setIsProcessing: vi.fn(),
  setError: vi.fn(),
  addOverlay: vi.fn(),
  removeOverlay: vi.fn(),
  updateOverlay: vi.fn(),
  clearOverlays: vi.fn(),
  setCurrentPdfPath: vi.fn(),
  addRecentFile: vi.fn(),
  clearRecentFiles: vi.fn(),
  setTheme: vi.fn(),
  reset: vi.fn(),
};

vi.mock('../../../stores/appStore', () => ({
  useAppStore: Object.assign(
    (selector?: any) => selector ? selector(mockState) : mockState,
    { getState: () => mockState },
  ),
}));

import { PdfEditorPage } from '../PdfEditorPage';

describe('PdfEditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<PdfEditorPage />);
    expect(container).toBeTruthy();
  });
});
