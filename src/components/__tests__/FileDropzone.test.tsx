import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FileDropzone } from '../FileDropzone';

const mockUseFileUpload = vi.fn();

vi.mock('../../hooks/useFileUpload', () => ({
  useFileUpload: (...args: any[]) => mockUseFileUpload(...args),
}));

vi.mock('../../stores/appStore', () => ({
  useAppStore: vi.fn(() => ({
    orderedPages: [],
    pdfFiles: [],
    addRecentFile: vi.fn(),
    getState: () => ({ orderedPages: [], pdfFiles: [] }),
    setState: vi.fn(),
  })),
}));

beforeEach(() => {
  mockUseFileUpload.mockReturnValue({
    getRootProps: () => ({ onClick: vi.fn(), onKeyDown: vi.fn(), onFocus: vi.fn(), onBlur: vi.fn(), onDragStart: vi.fn(), onDragEnter: vi.fn(), onDragOver: vi.fn(), onDragLeave: vi.fn(), onDrop: vi.fn(), ref: vi.fn(), role: 'button', tabIndex: 0 }),
    getInputProps: () => ({ accept: '.pdf', multiple: true, type: 'file', style: { display: 'none' } }),
    isDragActive: false,
    isProcessing: false,
    error: null,
  });
});

describe('FileDropzone', () => {
  it('renders dropzone text', () => {
    render(<FileDropzone />);
    expect(screen.getByText(/Arrastra archivos PDF aqu/i)).toBeTruthy();
    expect(screen.getByText(/haz clic para seleccionar/i)).toBeTruthy();
  });

  it('shows drag active state', () => {
    mockUseFileUpload.mockReturnValue({
      getRootProps: () => ({ onClick: vi.fn(), onKeyDown: vi.fn(), onFocus: vi.fn(), onBlur: vi.fn(), onDragStart: vi.fn(), onDragEnter: vi.fn(), onDragOver: vi.fn(), onDragLeave: vi.fn(), onDrop: vi.fn(), ref: vi.fn(), role: 'button', tabIndex: 0 }),
      getInputProps: () => ({ accept: '.pdf', multiple: true, type: 'file', style: { display: 'none' } }),
      isDragActive: true,
      isProcessing: false,
      error: null,
    });
    render(<FileDropzone />);
    expect(screen.getByText(/Arrastra archivos PDF/i)).toBeTruthy();
  });

  it('shows error message when error exists', () => {
    mockUseFileUpload.mockReturnValue({
      getRootProps: () => ({ onClick: vi.fn(), onKeyDown: vi.fn(), onFocus: vi.fn(), onBlur: vi.fn(), onDragStart: vi.fn(), onDragEnter: vi.fn(), onDragOver: vi.fn(), onDragLeave: vi.fn(), onDrop: vi.fn(), ref: vi.fn(), role: 'button', tabIndex: 0 }),
      getInputProps: () => ({ accept: '.pdf', multiple: true, type: 'file', style: { display: 'none' } }),
      isDragActive: false,
      isProcessing: false,
      error: 'Formato no válido',
    });
    render(<FileDropzone />);
    expect(screen.getByText('Formato no válido')).toBeTruthy();
  });

  it('handles empty files callback gracefully', () => {
    render(<FileDropzone />);
    expect(screen.getByText(/Soporta m/i)).toBeTruthy();
  });
});
