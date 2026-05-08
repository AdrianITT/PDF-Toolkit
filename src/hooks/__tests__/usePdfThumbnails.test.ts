import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockGetDocument = vi.fn();
const mockPdfDoc = {
  numPages: 3,
  getPage: vi.fn(),
  destroy: vi.fn(),
};

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  default: {
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: mockGetDocument,
  },
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: mockGetDocument,
}));

vi.mock('../usePdfThumbnails', async () => {
  const actual = await vi.importActual('../usePdfThumbnails');
  return actual;
});

import { usePdfThumbnails } from '../usePdfThumbnails';

beforeEach(() => {
  vi.clearAllMocks();
  mockGetDocument.mockReset();

  mockPdfDoc.getPage.mockReset();
  mockPdfDoc.destroy.mockReset();

  mockGetDocument.mockReturnValue({
    promise: Promise.resolve(mockPdfDoc),
  });
});

function createMockPage(index: number) {
  return {
    getViewport: () => ({ width: 595, height: 841, scale: 1 }),
    render: ({ canvasContext, viewport }: any) => {
      canvasContext.fillStyle = '#fff';
      canvasContext.fillRect(0, 0, viewport.width, viewport.height);
      return { promise: Promise.resolve() };
    },
    cleanup: vi.fn(),
  };
}

function createMockFile(name = 'test.pdf', size = 1024): File {
  const content = '%PDF-1.4 content';
  const file = new File([content], name, { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', {
    value: () => Promise.resolve(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]).buffer),
  });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('usePdfThumbnails', () => {
  it('returns getPageCount and generateAllThumbnails', () => {
    const { result } = renderHook(() => usePdfThumbnails());
    expect(result.current).toHaveProperty('getPageCount');
    expect(result.current).toHaveProperty('generateAllThumbnails');
    expect(typeof result.current.getPageCount).toBe('function');
    expect(typeof result.current.generateAllThumbnails).toBe('function');
  });

  it('getPageCount returns page count from PDF document', async () => {
    const { result } = renderHook(() => usePdfThumbnails());
    const file = createMockFile();

    const count = await act(async () => result.current.getPageCount(file));
    expect(count).toBe(3);
    expect(mockGetDocument).toHaveBeenCalled();
    expect(mockPdfDoc.destroy).toHaveBeenCalled();
  });

  it('getPageCount returns 1 on error', async () => {
    mockGetDocument.mockReturnValue({
      promise: Promise.reject(new Error('Invalid PDF')),
    });

    const { result } = renderHook(() => usePdfThumbnails());
    const file = createMockFile();

    const count = await act(async () => result.current.getPageCount(file));
    expect(count).toBe(1);
  });

  it('generateAllThumbnails generates thumbnails for all pages', async () => {
    mockPdfDoc.getPage
      .mockResolvedValueOnce(createMockPage(1))
      .mockResolvedValueOnce(createMockPage(2))
      .mockResolvedValueOnce(createMockPage(3));

    const { result } = renderHook(() => usePdfThumbnails());
    const file = createMockFile();

    const thumbnails = await act(async () => result.current.generateAllThumbnails(file));
    expect(thumbnails).toHaveLength(3);
    expect(thumbnails[0]).toContain('data:image/jpeg');
    expect(mockPdfDoc.getPage).toHaveBeenCalledTimes(3);
    expect(mockPdfDoc.destroy).toHaveBeenCalled();
  });

  it('generateAllThumbnails caches results', async () => {
    mockPdfDoc.getPage
      .mockResolvedValue(createMockPage(1));

    const { result } = renderHook(() => usePdfThumbnails());
    const file = createMockFile();

    await act(async () => result.current.generateAllThumbnails(file));
    const callCount = mockGetDocument.mock.calls.length;

    await act(async () => result.current.generateAllThumbnails(file));
    expect(mockGetDocument.mock.calls.length).toBe(callCount);
  });

  it('generateAllThumbnails returns placeholder on error', async () => {
    mockGetDocument.mockReturnValue({
      promise: Promise.reject(new Error('Corrupted PDF')),
    });

    const { result } = renderHook(() => usePdfThumbnails());
    const file = createMockFile();

    const thumbnails = await act(async () => result.current.generateAllThumbnails(file));
    expect(thumbnails).toHaveLength(1);
    expect(thumbnails[0]).toContain('data:image/png');
  });

  it('generateAllThumbnails handles page-level render errors', async () => {
    const twoPageDoc = {
      numPages: 2,
      getPage: vi.fn()
        .mockResolvedValueOnce(createMockPage(1))
        .mockRejectedValueOnce(new Error('Page render failed')),
      destroy: vi.fn(),
    };
    mockGetDocument.mockReturnValue({
      promise: Promise.resolve(twoPageDoc),
    });

    const { result } = renderHook(() => usePdfThumbnails());
    const file = createMockFile();

    const thumbnails = await act(async () => result.current.generateAllThumbnails(file));
    expect(thumbnails).toHaveLength(2);
    expect(thumbnails[0]).toContain('data:image/jpeg');
    expect(thumbnails[1]).toContain('data:image/png');
  });
});
