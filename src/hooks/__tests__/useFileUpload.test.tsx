import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileUpload } from '../useFileUpload';

let capturedOnDrop: ((files: File[]) => Promise<void>) | null = null;

vi.mock('react-dropzone', () => ({
  useDropzone: ({ onDrop, accept, multiple, noClick, noKeyboard }: any) => {
    capturedOnDrop = onDrop;
    return {
      getRootProps: () => ({ role: 'button' }),
      getInputProps: () => ({ accept: '.pdf' }),
      isDragActive: false,
    };
  },
}));

const mockGetPageCount = vi.fn();
const mockGenerateAllThumbnails = vi.fn();

vi.mock('../usePdfThumbnails', () => ({
  usePdfThumbnails: vi.fn(() => ({
    getPageCount: mockGetPageCount,
    generateAllThumbnails: mockGenerateAllThumbnails,
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  capturedOnDrop = null;
});

function createMockPdfFile(name = 'test.pdf'): File {
  const file = new File(['%PDF-1.4 content'], name, { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', {
    value: () => Promise.resolve(new Uint8Array([0x25, 0x50, 0x44, 0x46]).buffer),
  });
  return file;
}

describe('useFileUpload', () => {
  it('returns initial state with correct shape', () => {
    const onFilesAdded = vi.fn();
    const { result } = renderHook(() => useFileUpload(onFilesAdded));

    expect(result.current).toHaveProperty('getRootProps');
    expect(result.current).toHaveProperty('getInputProps');
    expect(typeof result.current.getRootProps).toBe('function');
    expect(typeof result.current.getInputProps).toBe('function');
    expect(result.current.isDragActive).toBe(false);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('processes accepted files and calls onFilesAdded', async () => {
    const onFilesAdded = vi.fn();
    mockGetPageCount.mockResolvedValue(2);
    mockGenerateAllThumbnails.mockResolvedValue([
      'data:image/png;base64,thumb1',
      'data:image/png;base64,thumb2',
    ]);

    renderHook(() => useFileUpload(onFilesAdded));

    expect(capturedOnDrop).not.toBeNull();
    const file = createMockPdfFile();

    await act(async () => {
      await capturedOnDrop!([file]);
    });

    expect(mockGetPageCount).toHaveBeenCalledWith(file);
    expect(mockGenerateAllThumbnails).toHaveBeenCalledWith(file);
    expect(onFilesAdded).toHaveBeenCalledTimes(1);
    expect(onFilesAdded).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'test.pdf',
          pageCount: 2,
        }),
      ])
    );
  });

  it('handles empty accepted files list', async () => {
    const onFilesAdded = vi.fn();

    renderHook(() => useFileUpload(onFilesAdded));

    expect(capturedOnDrop).not.toBeNull();

    await act(async () => {
      await capturedOnDrop!([]);
    });

    expect(mockGetPageCount).not.toHaveBeenCalled();
    expect(onFilesAdded).not.toHaveBeenCalled();
  });

  it('sets error when processing fails', async () => {
    const onFilesAdded = vi.fn();
    mockGetPageCount.mockRejectedValue(new Error('Failed to load'));

    const { result } = renderHook(() => useFileUpload(onFilesAdded));

    expect(capturedOnDrop).not.toBeNull();
    const file = createMockPdfFile('bad.pdf');

    await act(async () => {
      await capturedOnDrop!([file]);
    });

    expect(onFilesAdded).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Failed to load');
    expect(result.current.isProcessing).toBe(false);
  });
});
