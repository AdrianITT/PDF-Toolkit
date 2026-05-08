import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPdfInfo, mergePdfs, extractPages, downloadPdf } from '../pdf.service';
import type { PdfMergeRequest } from '../../types';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('pdf.service exports', () => {
  it('exports getPdfInfo function', () => {
    expect(getPdfInfo).toBeDefined();
    expect(typeof getPdfInfo).toBe('function');
  });

  it('exports mergePdfs function', () => {
    expect(mergePdfs).toBeDefined();
    expect(typeof mergePdfs).toBe('function');
  });

  it('exports extractPages function', () => {
    expect(extractPages).toBeDefined();
    expect(typeof extractPages).toBe('function');
  });

  it('exports downloadPdf function', () => {
    expect(downloadPdf).toBeDefined();
    expect(typeof downloadPdf).toBe('function');
  });
});

describe('downloadPdf', () => {
  it('does nothing when data is empty', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    downloadPdf(new Uint8Array([]), 'test.pdf');
    expect(createElementSpy).not.toHaveBeenCalled();
  });

  it('creates download link when data is present', () => {
    const appendChild = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
    const removeChild = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
    const clickSpy = vi.fn();
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickSpy,
    } as any);

    downloadPdf(new Uint8Array([1, 2, 3]), 'output.pdf');
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(clickSpy).toHaveBeenCalled();
    appendChild.mockRestore();
    removeChild.mockRestore();
    createElementSpy.mockRestore();
  });
});

describe('getPdfInfo', () => {
  it('returns mock pdf info', async () => {
    const result = await getPdfInfo(new Uint8Array([1, 2, 3]), 0);
    expect(result).toEqual({ page_count: 1, file_index: 0 });
  });
});

describe('mergePdfs', () => {
  it('throws error when files array is empty', async () => {
    const request: PdfMergeRequest = { files: [], page_order: [] };
    await expect(mergePdfs(request)).rejects.toThrow('No PDF data provided');
  });
});

describe('extractPages', () => {
  it('returns the same data in mock mode', async () => {
    const data = new Uint8Array([1, 2, 3, 4]);
    const result = await extractPages(data, [1]);
    expect(result).toEqual(data);
  });
});
