import { create } from 'zustand';
import type { PdfFile, PdfPage, AppModule } from '../types';

export interface OverlayState {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  imageData: string;
  type: 'firma' | 'sello';
}

interface AppState {
  activeModule: AppModule;
  pdfFiles: PdfFile[];
  orderedPages: PdfPage[];
  selectedPages: Set<string>;
  isProcessing: boolean;
  error: string | null;
  overlay: OverlayState | null;
  currentPdfPath: string | null;
  
  setActiveModule: (module: AppModule) => void;
  addPdfFile: (file: PdfFile) => void;
  removePdfFile: (id: string) => void;
  setOrderedPages: (pages: PdfPage[]) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  togglePageSelection: (pageId: string) => void;
  selectAllPages: () => void;
  deselectAllPages: () => void;
  removeSelectedPages: () => void;
  setIsProcessing: (processing: boolean) => void;
  setError: (error: string | null) => void;
  setOverlay: (overlay: OverlayState | null) => void;
  setCurrentPdfPath: (path: string | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeModule: 'pdf-editor',
  pdfFiles: [],
  orderedPages: [],
  selectedPages: new Set(),
  isProcessing: false,
  error: null,
  overlay: null,
  currentPdfPath: null,

  setActiveModule: (module) => set({ activeModule: module }),

  addPdfFile: (file) => set((state) => ({
    pdfFiles: [...state.pdfFiles, file],
  })),

  removePdfFile: (id) => set((state) => {
    const file = state.pdfFiles.find((f) => f.id === id);
    if (!file) return state;
    return {
      pdfFiles: state.pdfFiles.filter((f) => f.id !== id),
      orderedPages: state.orderedPages.filter((p) => p.fileId !== id),
    };
  }),

  setOrderedPages: (pages) => set({ orderedPages: pages }),

  reorderPages: (fromIndex, toIndex) => set((state) => {
    const pages = [...state.orderedPages];
    const [removed] = pages.splice(fromIndex, 1);
    pages.splice(toIndex, 0, removed);
    return { orderedPages: pages };
  }),

  togglePageSelection: (pageId) => set((state) => {
    const selected = new Set(state.selectedPages);
    if (selected.has(pageId)) {
      selected.delete(pageId);
    } else {
      selected.add(pageId);
    }
    return { selectedPages: selected };
  }),

  selectAllPages: () => set((state) => ({
    selectedPages: new Set(state.orderedPages.map((p) => p.id)),
  })),

  deselectAllPages: () => set({ selectedPages: new Set() }),

  removeSelectedPages: () => set((state) => {
    const remainingPages = state.orderedPages.filter((p) => !state.selectedPages.has(p.id));
    return {
      orderedPages: remainingPages,
      selectedPages: new Set(),
    };
  }),

  setIsProcessing: (processing) => set({ isProcessing: processing }),

  setError: (error) => set({ error }),

  setOverlay: (overlay) => set({ overlay }),

  setCurrentPdfPath: (path) => set({ currentPdfPath: path }),

  reset: () => set({
    pdfFiles: [],
    orderedPages: [],
    selectedPages: new Set(),
    isProcessing: false,
    error: null,
    overlay: null,
    currentPdfPath: null,
  }),
}));