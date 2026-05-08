import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../utils/pdfjs', () => ({
  loadPdf: vi.fn(),
  isPdfValid: vi.fn(),
  pdfjsLib: null,
}));

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn().mockResolvedValue({
    recognize: vi.fn().mockResolvedValue({
      data: { text: 'texto extraído', confidence: 85 },
    }),
    terminate: vi.fn(),
    setParameters: vi.fn(),
    setLogger: vi.fn(),
  }),
}));

import { OcrPage } from '../OcrPage';
import { render } from '@testing-library/react';

describe('OcrPage', () => {
  it('renders without crashing', () => {
    const { container } = render(<OcrPage />);
    expect(container).toBeTruthy();
  });

  it('shows upload button', () => {
    const { getByText } = render(<OcrPage />);
    expect(getByText(/subir pdf/i)).toBeTruthy();
  });
});
