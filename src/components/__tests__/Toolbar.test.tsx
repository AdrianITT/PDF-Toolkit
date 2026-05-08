import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toolbar } from '../Toolbar';

const mockUseAppStore = vi.fn();

vi.mock('../../stores/appStore', () => ({
  useAppStore: (...args: any[]) => mockUseAppStore(...args),
}));

vi.mock('../../services/pdf.service', () => ({
  mergePdfs: vi.fn(),
  downloadPdf: vi.fn(),
}));

const baseMock = {
  pdfFiles: [],
  orderedPages: [],
  selectedPages: new Set<string>(),
  selectAllPages: vi.fn(),
  deselectAllPages: vi.fn(),
  removeSelectedPages: vi.fn(),
  setIsProcessing: vi.fn(),
  setError: vi.fn(),
  recentFiles: [],
  theme: 'light',
  setTheme: vi.fn(),
  clearRecentFiles: vi.fn(),
};

describe('Toolbar', () => {
  it('renders all toolbar buttons', () => {
    mockUseAppStore.mockReturnValue(baseMock);
    render(<Toolbar />);
    expect(screen.getByText('Seleccionar todo')).toBeTruthy();
    expect(screen.getByText('Eliminar (0)')).toBeTruthy();
    expect(screen.getByText('Unir y descargar (0 p\u00e1g)')).toBeTruthy();
    expect(screen.getByLabelText('select')).toBeTruthy();
  });

  it('buttons are disabled when no pages', () => {
    mockUseAppStore.mockReturnValue(baseMock);
    render(<Toolbar />);
    const selectBtn = screen.getByText('Seleccionar todo').closest('button');
    const mergeBtn = screen.getByText('Unir y descargar (0 p\u00e1g)').closest('button');
    expect(selectBtn?.disabled).toBe(true);
    expect(mergeBtn?.disabled).toBe(true);
  });

  it('shows correct merge count when pages present', () => {
    mockUseAppStore.mockReturnValue({
      ...baseMock,
      orderedPages: [{ id: 'p1', fileId: 'f1', pageNumber: 1, thumbnail: '', fileName: 't.pdf' }],
      selectedPages: new Set(['p1']),
    });
    render(<Toolbar />);
    expect(screen.getByText('Unir y descargar (1 p\u00e1g)')).toBeTruthy();
  });

  it('toggle theme button shows correct icon for light theme', () => {
    mockUseAppStore.mockReturnValue(baseMock);
    render(<Toolbar />);
    const themeBtn = document.querySelector('[data-icon="moon"]');
    expect(themeBtn).toBeTruthy();
  });

  it('shows dark mode theme icon', () => {
    mockUseAppStore.mockReturnValue({
      ...baseMock,
      theme: 'dark',
    });
    render(<Toolbar />);
    const themeBtn = document.querySelector('[data-icon="sun"]');
    expect(themeBtn).toBeTruthy();
  });

  it('recent files dropdown renders empty state', () => {
    mockUseAppStore.mockReturnValue(baseMock);
    render(<Toolbar />);
    const historyBtn = document.querySelector('[data-icon="history"]');
    expect(historyBtn).toBeTruthy();
  });
});
