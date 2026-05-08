import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnnotationsPage } from '../AnnotationsPage';

vi.mock('../../../utils/pdfjs', () => ({
  loadPdf: vi.fn().mockResolvedValue({ doc: { numPages: 3, getPage: vi.fn(), destroy: vi.fn() }, numPages: 3 }),
  isPdfValid: vi.fn().mockReturnValue(true),
  renderPage: vi.fn().mockResolvedValue(undefined),
}));

describe('AnnotationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<AnnotationsPage />);
    expect(container).toBeTruthy();
  });

  it('shows PDF upload button', () => {
    render(<AnnotationsPage />);
    expect(screen.getByText('Subir PDF')).toBeTruthy();
  });

  it('shows annotation type selector', () => {
    render(<AnnotationsPage />);
    expect(screen.getByText('Resaltar')).toBeTruthy();
    expect(screen.getByText('Subrayar')).toBeTruthy();
    expect(screen.getByText('Nota')).toBeTruthy();
  });

  it('shows color selector', () => {
    render(<AnnotationsPage />);
    expect(screen.getByText('Amarillo')).toBeTruthy();
    expect(screen.getByText('Verde')).toBeTruthy();
    expect(screen.getByText('Azul')).toBeTruthy();
    expect(screen.getByText('Rosa')).toBeTruthy();
  });

  it('shows placeholder when no PDF loaded', () => {
    render(<AnnotationsPage />);
    expect(screen.getByText('Sube un PDF para comenzar a anotar')).toBeTruthy();
  });

  it('shows 0 annotations initially', () => {
    render(<AnnotationsPage />);
    expect(screen.getByText(/0 anotaci/)).toBeTruthy();
  });
});
