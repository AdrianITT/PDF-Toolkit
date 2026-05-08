import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PdfACompliancePage } from '../PdfACompliancePage';

vi.mock('../../../utils/pdfjs', () => ({
  isPdfValid: vi.fn().mockReturnValue(true),
}));

describe('PdfACompliancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<PdfACompliancePage />);
    expect(container).toBeTruthy();
  });

  it('shows upload button', () => {
    render(<PdfACompliancePage />);
    expect(screen.getByText('Subir PDF')).toBeTruthy();
  });

  it('shows compliance tag as Sin verificar', () => {
    render(<PdfACompliancePage />);
    expect(screen.getByText('Sin verificar')).toBeTruthy();
  });

  it('shows informational alert', () => {
    render(<PdfACompliancePage />);
    expect(screen.getByText(/¿Qué es PDF\/A?/)).toBeTruthy();
  });

  it('shows warning when no PDF', () => {
    render(<PdfACompliancePage />);
    expect(screen.getByText('Paso 1: Sube un PDF')).toBeTruthy();
  });
});
