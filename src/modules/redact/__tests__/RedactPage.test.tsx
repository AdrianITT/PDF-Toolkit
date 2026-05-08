import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RedactPage } from '../RedactPage';

vi.mock('../../../utils/pdfjs', () => ({
  loadPdf: vi.fn().mockResolvedValue({ doc: { numPages: 2, getPage: vi.fn(), destroy: vi.fn() }, numPages: 2 }),
  isPdfValid: vi.fn().mockReturnValue(true),
  renderPage: vi.fn().mockResolvedValue(undefined),
}));

describe('RedactPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<RedactPage />);
    expect(container).toBeTruthy();
  });

  it('shows upload button', () => {
    render(<RedactPage />);
    expect(screen.getByText('Subir PDF')).toBeTruthy();
  });

  it('shows redact button with 0 count', () => {
    render(<RedactPage />);
    expect(screen.getByText('Aplicar Redacción (0)')).toBeTruthy();
  });

  it('shows informational alert', () => {
    render(<RedactPage />);
    expect(screen.getByText(/¿Qué es la Redacción?/)).toBeTruthy();
  });

  it('shows warning when no PDF', () => {
    render(<RedactPage />);
    expect(screen.getByText('Paso 1: Sube un PDF')).toBeTruthy();
  });

  it('shows irreversible action warning', () => {
    render(<RedactPage />);
    expect(screen.getByText(/Advertencia: Acción irreversible/)).toBeTruthy();
  });
});
