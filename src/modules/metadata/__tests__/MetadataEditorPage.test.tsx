import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetadataEditorPage } from '../MetadataEditorPage';

vi.mock('../../../utils/pdfjs', () => ({
  isPdfValid: vi.fn().mockReturnValue(true),
}));

describe('MetadataEditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<MetadataEditorPage />);
    expect(container).toBeTruthy();
  });

  it('shows upload button', () => {
    render(<MetadataEditorPage />);
    expect(screen.getByText('Subir PDF')).toBeTruthy();
  });

  it('shows informational alert', () => {
    render(<MetadataEditorPage />);
    expect(screen.getByText(/¿Qué son los Metadatos?/)).toBeTruthy();
  });

  it('shows warning when no PDF', () => {
    render(<MetadataEditorPage />);
    expect(screen.getByText('Paso 1: Sube un PDF')).toBeTruthy();
  });
});
