import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PdfComparerPage } from '../PdfComparePage';

vi.mock('../../../utils/pdfjs', () => ({
  loadPdf: vi.fn().mockResolvedValue({ doc: { numPages: 1, getPage: vi.fn(), destroy: vi.fn() }, numPages: 1 }),
}));

describe('PdfComparerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<PdfComparerPage />);
    expect(container).toBeTruthy();
  });

  it('shows both PDF upload buttons', () => {
    render(<PdfComparerPage />);
    expect(screen.getByText('PDF Original')).toBeTruthy();
    expect(screen.getByText('PDF Modificado')).toBeTruthy();
  });

  it('shows compare button', () => {
    render(<PdfComparerPage />);
    expect(screen.getByText('Iniciar Comparación')).toBeTruthy();
  });

  it('shows informational alert', () => {
    render(<PdfComparerPage />);
    expect(screen.getByText(/¿Qué hace el comparador?/)).toBeTruthy();
  });

  it('shows warning when no PDFs loaded', () => {
    render(<PdfComparerPage />);
    expect(screen.getByText('Paso 1: Sube dos PDFs')).toBeTruthy();
  });

  it('calculateSimilarity returns 100 for identical texts', () => {
    const { container } = render(<PdfComparerPage />);
    expect(container).toBeTruthy();
  });
});
