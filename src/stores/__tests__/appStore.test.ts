import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../appStore';

beforeEach(() => {
  useAppStore.getState().reset();
});

describe('appStore', () => {
  it('starts with default state', () => {
    const state = useAppStore.getState();
    expect(state.activeModule).toBe('pdf-editor');
    expect(state.pdfFiles).toEqual([]);
    expect(state.orderedPages).toEqual([]);
    expect(state.isProcessing).toBe(false);
    expect(state.error).toBeNull();
    expect(state.overlays).toEqual([]);
    expect(state.currentPdfPath).toBeNull();
  });

  it('setActiveModule changes active module', () => {
    useAppStore.getState().setActiveModule('ocr');
    expect(useAppStore.getState().activeModule).toBe('ocr');
  });

  it('setActiveModule switches to compare', () => {
    useAppStore.getState().setActiveModule('compare');
    expect(useAppStore.getState().activeModule).toBe('compare');
  });

  it('setActiveModule switches to batch', () => {
    useAppStore.getState().setActiveModule('batch');
    expect(useAppStore.getState().activeModule).toBe('batch');
  });

  it('addPdfFile adds a file', () => {
    useAppStore.getState().addPdfFile({
      id: '1', name: 'test.pdf', data: new Uint8Array([1, 2, 3]),
      pageCount: 5, pages: [],
    });
    expect(useAppStore.getState().pdfFiles).toHaveLength(1);
    expect(useAppStore.getState().pdfFiles[0].name).toBe('test.pdf');
  });

  it('removePdfFile removes a file by id', () => {
    useAppStore.getState().addPdfFile({
      id: '1', name: 'test.pdf', data: new Uint8Array([1, 2, 3]),
      pageCount: 5, pages: [],
    });
    useAppStore.getState().removePdfFile('1');
    expect(useAppStore.getState().pdfFiles).toHaveLength(0);
  });

  it('addOverlay stores overlay state', () => {
    useAppStore.getState().addOverlay({
      x: 100, y: 200, width: 50, height: 30,
      page: 1, imageData: 'data:image/png;base64,abc', type: 'firma',
    });
    expect(useAppStore.getState().overlays).toHaveLength(1);
    expect(useAppStore.getState().overlays[0].type).toBe('firma');
  });

  it('removeOverlay removes at index', () => {
    useAppStore.getState().addOverlay({
      x: 100, y: 200, width: 50, height: 30,
      page: 1, imageData: 'data:image/png;base64,abc', type: 'firma',
    });
    useAppStore.getState().addOverlay({
      x: 200, y: 300, width: 50, height: 30,
      page: 2, imageData: 'data:image/png;base64,def', type: 'sello',
    });
    useAppStore.getState().removeOverlay(0);
    expect(useAppStore.getState().overlays).toHaveLength(1);
    expect(useAppStore.getState().overlays[0].type).toBe('sello');
  });

  it('clearOverlays removes all overlays', () => {
    useAppStore.getState().addOverlay({
      x: 100, y: 200, width: 50, height: 30,
      page: 1, imageData: 'data:image/png;base64,abc', type: 'firma',
    });
    useAppStore.getState().clearOverlays();
    expect(useAppStore.getState().overlays).toHaveLength(0);
  });

  it('updateOverlay updates specific overlay', () => {
    useAppStore.getState().addOverlay({
      x: 100, y: 200, width: 50, height: 30,
      page: 1, imageData: 'data:image/png;base64,abc', type: 'firma',
    });
    useAppStore.getState().updateOverlay(0, { x: 999, y: 888 });
    expect(useAppStore.getState().overlays[0].x).toBe(999);
    expect(useAppStore.getState().overlays[0].y).toBe(888);
  });

  it('setIsProcessing updates processing state', () => {
    useAppStore.getState().setIsProcessing(true);
    expect(useAppStore.getState().isProcessing).toBe(true);
    useAppStore.getState().setIsProcessing(false);
    expect(useAppStore.getState().isProcessing).toBe(false);
  });

  it('setError stores and clears error', () => {
    useAppStore.getState().setError('Algo salió mal');
    expect(useAppStore.getState().error).toBe('Algo salió mal');
    useAppStore.getState().setError(null);
    expect(useAppStore.getState().error).toBeNull();
  });

  it('setOrderedPages stores page order', () => {
    const pages = [
      { id: '1', fileId: 'f1', pageNumber: 1, thumbnail: '', fileName: 'a.pdf' },
      { id: '2', fileId: 'f1', pageNumber: 2, thumbnail: '', fileName: 'a.pdf' },
    ];
    useAppStore.getState().setOrderedPages(pages);
    expect(useAppStore.getState().orderedPages).toHaveLength(2);
  });

  it('reorderPages swaps pages', () => {
    const pages = [
      { id: '1', fileId: 'f1', pageNumber: 1, thumbnail: '', fileName: 'a.pdf' },
      { id: '2', fileId: 'f1', pageNumber: 2, thumbnail: '', fileName: 'a.pdf' },
    ];
    useAppStore.getState().setOrderedPages(pages);
    useAppStore.getState().reorderPages(0, 1);
    expect(useAppStore.getState().orderedPages[0].id).toBe('2');
    expect(useAppStore.getState().orderedPages[1].id).toBe('1');
  });

  it('togglePageSelection selects and deselects', () => {
    useAppStore.getState().togglePageSelection('page-1');
    expect(useAppStore.getState().selectedPages.has('page-1')).toBe(true);
    useAppStore.getState().togglePageSelection('page-1');
    expect(useAppStore.getState().selectedPages.has('page-1')).toBe(false);
  });

  it('selectAllPages and deselectAllPages work', () => {
    const pages = [
      { id: 'a', fileId: 'f1', pageNumber: 1, thumbnail: '', fileName: 'a.pdf' },
      { id: 'b', fileId: 'f1', pageNumber: 2, thumbnail: '', fileName: 'a.pdf' },
    ];
    useAppStore.getState().setOrderedPages(pages);
    useAppStore.getState().selectAllPages();
    expect(useAppStore.getState().selectedPages.size).toBe(2);
    useAppStore.getState().deselectAllPages();
    expect(useAppStore.getState().selectedPages.size).toBe(0);
  });

  it('removeSelectedPages removes selected', () => {
    const pages = [
      { id: 'a', fileId: 'f1', pageNumber: 1, thumbnail: '', fileName: 'a.pdf' },
      { id: 'b', fileId: 'f1', pageNumber: 2, thumbnail: '', fileName: 'a.pdf' },
    ];
    useAppStore.getState().setOrderedPages(pages);
    useAppStore.getState().togglePageSelection('a');
    useAppStore.getState().removeSelectedPages();
    expect(useAppStore.getState().orderedPages).toHaveLength(1);
    expect(useAppStore.getState().orderedPages[0].id).toBe('b');
  });

  it('setCurrentPdfPath stores path', () => {
    useAppStore.getState().setCurrentPdfPath('/path/to/file.pdf');
    expect(useAppStore.getState().currentPdfPath).toBe('/path/to/file.pdf');
  });

  it('reset restores default state', () => {
    useAppStore.getState().setActiveModule('ocr');
    useAppStore.getState().addPdfFile({
      id: '1', name: 'test.pdf', data: new Uint8Array([1]),
      pageCount: 1, pages: [],
    });
    useAppStore.getState().reset();
    expect(useAppStore.getState().pdfFiles).toHaveLength(0);
    expect(useAppStore.getState().isProcessing).toBe(false);
    expect(useAppStore.getState().error).toBeNull();
  });
});
