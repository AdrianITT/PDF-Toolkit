import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PdfFormsPage } from '../PdfFormsPage';

vi.mock('../../../utils/pdfjs', () => ({
  isPdfValid: vi.fn().mockReturnValue(true),
}));

describe('PdfFormsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<PdfFormsPage />);
    expect(container).toBeTruthy();
  });

  it('shows upload button', () => {
    render(<PdfFormsPage />);
    expect(screen.getByText(/Subir PDF con formulario/i)).toBeTruthy();
  });

  it('shows informative alerts', () => {
    render(<PdfFormsPage />);
    expect(screen.getByText('Formularios PDF')).toBeTruthy();
  });

  it('shows placeholder when no PDF', () => {
    render(<PdfFormsPage />);
    expect(screen.getByText('Sube un PDF para comenzar')).toBeTruthy();
  });
});
