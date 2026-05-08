import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TemplatesPage } from '../TemplatesPage';

describe('TemplatesPage', () => {
  it('renders without crashing', () => {
    const { container } = render(<TemplatesPage />);
    expect(container).toBeTruthy();
  });

  it('shows template count', () => {
    render(<TemplatesPage />);
    expect(screen.getByText(/3 plantilla/)).toBeTruthy();
  });

  it('shows category filter', () => {
    render(<TemplatesPage />);
    expect(screen.getByText('Todas')).toBeTruthy();
    expect(screen.getByText('Facturas')).toBeTruthy();
    expect(screen.getByText('Contratos')).toBeTruthy();
    expect(screen.getByText('Informes')).toBeTruthy();
    expect(screen.getByText('Cartas')).toBeTruthy();
  });

  it('shows template names', () => {
    render(<TemplatesPage />);
    expect(screen.getByText('Factura Básica')).toBeTruthy();
    expect(screen.getByText('Contrato de Servicios')).toBeTruthy();
    expect(screen.getByText('Informe Mensual')).toBeTruthy();
  });

  it('shows create template input', () => {
    render(<TemplatesPage />);
    expect(screen.getByPlaceholderText('Nombre de la nueva plantilla')).toBeTruthy();
  });

  it('shows create template button', () => {
    render(<TemplatesPage />);
    expect(screen.getByText('Crear Plantilla')).toBeTruthy();
  });

  it('shows informational alert', () => {
    render(<TemplatesPage />);
    expect(screen.getByText(/¿Qué son las Plantillas?/)).toBeTruthy();
  });
});
