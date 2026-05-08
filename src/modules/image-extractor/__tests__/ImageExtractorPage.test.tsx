import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImageExtractorPage } from '../ImageExtractorPage';

vi.mock('../../../utils/pdfjs', () => ({
  loadPdf: vi.fn().mockResolvedValue({ doc: { numPages: 2, getPage: vi.fn(), destroy: vi.fn() }, numPages: 2 }),
  isPdfValid: vi.fn().mockReturnValue(true),
  pdfjsLib: { OPS: { paintImageXObject: 1 } },
}));

describe('ImageExtractorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<ImageExtractorPage />);
    expect(container).toBeTruthy();
  });

  it('shows upload button', () => {
    render(<ImageExtractorPage />);
    expect(screen.getByText('Subir PDF')).toBeTruthy();
  });

  it('shows 0 images count', () => {
    render(<ImageExtractorPage />);
    expect(screen.getByText(/0 imagen/)).toBeTruthy();
  });

  it('shows informational alert', () => {
    render(<ImageExtractorPage />);
    expect(screen.getByText(/¿Qué hace el extractor?/)).toBeTruthy();
  });

  it('shows warning when no PDF', () => {
    render(<ImageExtractorPage />);
    expect(screen.getByText('Paso 1: Sube un PDF')).toBeTruthy();
  });
});
