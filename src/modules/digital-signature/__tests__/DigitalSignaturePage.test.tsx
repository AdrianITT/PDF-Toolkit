import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DigitalSignaturePage } from '../DigitalSignaturePage';

vi.mock('../../../utils/pdfjs', () => ({
  isPdfValid: vi.fn().mockReturnValue(true),
}));

describe('DigitalSignaturePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<DigitalSignaturePage />);
    expect(container).toBeTruthy();
  });

  it('shows signature levels', () => {
    render(<DigitalSignaturePage />);
    expect(screen.getByText('Básico (Metadatos)')).toBeTruthy();
    expect(screen.getByText('Avanzado (PKI + OpenSSL)')).toBeTruthy();
    expect(screen.getByText('Cualificado (eIDAS)')).toBeTruthy();
  });

  it('shows PDF upload button', () => {
    render(<DigitalSignaturePage />);
    expect(screen.getByText(/Subir PDF a Firmar/i)).toBeTruthy();
  });

  it('shows apply signature button', () => {
    render(<DigitalSignaturePage />);
    expect(screen.getByText('Aplicar Firma Digital')).toBeTruthy();
  });

  it('shows informational alert', () => {
    render(<DigitalSignaturePage />);
    expect(screen.getByText(/Firma Digital con OpenSSL/i)).toBeTruthy();
  });
});
