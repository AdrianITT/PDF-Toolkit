import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

const GoodChild = () => <div>Funciona correctamente</div>;
const BadChild = () => {
  throw new Error('Error de prueba');
};

beforeEach(() => {
  vi.spyOn(window, 'addEventListener');
});

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(<ErrorBoundary><GoodChild /></ErrorBoundary>);
    expect(screen.getByText('Funciona correctamente')).toBeTruthy();
  });

  it('renders error UI when child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary><BadChild /></ErrorBoundary>);
    expect(screen.getByText('Algo sali\u00f3 mal')).toBeTruthy();
  });

  it('shows error message in UI when error event fires', () => {
    render(<ErrorBoundary><GoodChild /></ErrorBoundary>);
    const errorEvent = new ErrorEvent('error', { message: 'Fallo crítico' });
    act(() => { window.dispatchEvent(errorEvent); });
    expect(screen.getByText('Fallo crítico')).toBeTruthy();
  });

  it('handleReset clears error state', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let throwError = true;
    const ConditionalBadChild = () => {
      if (throwError) {
        throw new Error('Error de prueba');
      }
      return <div>Recuperado</div>;
    };
    render(<ErrorBoundary><ConditionalBadChild /></ErrorBoundary>);
    expect(screen.getByText('Algo sali\u00f3 mal')).toBeTruthy();
    throwError = false;
    fireEvent.click(screen.getByText('Intentar de Nuevo'));
    expect(screen.getByText('Recuperado')).toBeTruthy();
  });

  it('does not break on null children', () => {
    const { container } = render(<ErrorBoundary>{null}</ErrorBoundary>);
    expect(container).toBeTruthy();
  });
});
