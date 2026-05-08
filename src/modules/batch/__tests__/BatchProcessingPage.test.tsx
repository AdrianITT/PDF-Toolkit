import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BatchProcessingPage } from '../BatchProcessingPage';

describe('BatchProcessingPage', () => {
  it('renders without crashing', () => {
    const { container } = render(<BatchProcessingPage />);
    expect(container).toBeTruthy();
  });

  it('shows mode selector with conversion options', () => {
    render(<BatchProcessingPage />);
    expect(screen.getByText('Word → PDF')).toBeTruthy();
  });

  it('shows upload and process buttons', () => {
    render(<BatchProcessingPage />);
    expect(screen.getByText('Subir Archivos')).toBeTruthy();
    expect(screen.getByText('Procesar Lote (0)')).toBeTruthy();
  });

  it('shows counters', () => {
    render(<BatchProcessingPage />);
    expect(screen.getByText('0 total')).toBeTruthy();
    expect(screen.getByText('0 exitosos')).toBeTruthy();
  });

  it('shows informational alert', () => {
    render(<BatchProcessingPage />);
    expect(screen.getByText(/¿Qué es el Procesamiento por Lotes?/)).toBeTruthy();
  });
});
