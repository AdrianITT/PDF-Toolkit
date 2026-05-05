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

export interface RecentFile {
  id: string;
  name: string;
  timestamp: number;
  size: number;
}

export type ThemeMode = 'light' | 'dark';

interface AppState {
  activeModule: AppModule;
  pdfFiles: PdfFile[];
  orderedPages: PdfPage[];
  selectedPages: Set<string>;
  isProcessing: boolean;
  error: string | null;
  overlays: OverlayState[];
  currentPdfPath: string | null;
  recentFiles: RecentFile[];
  theme: ThemeMode;
  
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
  addOverlay: (overlay: OverlayState) => void;
  removeOverlay: (index: number) => void;
  updateOverlay: (index: number, updates: Partial<OverlayState>) => void;
  clearOverlays: () => void;
  setCurrentPdfPath: (path: string | null) => void;
  addRecentFile: (file: RecentFile) => void;
  clearRecentFiles: () => void;
  setTheme: (theme: ThemeMode) => void;
  reset: () => void;
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const storedTheme = loadFromStorage<ThemeMode>('pdf-toolkit-theme', 'light');
const storedRecent = loadFromStorage<RecentFile[]>('pdf-toolkit-recent', []);

const store = create<AppState>((set) => ({
  activeModule: 'pdf-editor',
  pdfFiles: [],
  orderedPages: [],
  selectedPages: new Set(),
  isProcessing: false,
  error: null,
  overlays: [],
  currentPdfPath: null,
  recentFiles: storedRecent,
  theme: storedTheme,

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

  addOverlay: (overlay) => set((state) => ({
    overlays: [...state.overlays, overlay],
  })),

  removeOverlay: (index) => set((state) => ({
    overlays: state.overlays.filter((_, i) => i !== index),
  })),

  updateOverlay: (index, updates) => set((state) => ({
    overlays: state.overlays.map((o, i) => i === index ? { ...o, ...updates } : o),
  })),

  clearOverlays: () => set({ overlays: [] }),

  setCurrentPdfPath: (path) => set({ currentPdfPath: path }),

  addRecentFile: (file) => set((state) => {
    const existing = state.recentFiles.filter((f) => f.id !== file.id);
    const updated = [file, ...existing].slice(0, 20);
    saveToStorage('pdf-toolkit-recent', updated);
    return { recentFiles: updated };
  }),

  clearRecentFiles: () => {
    saveToStorage('pdf-toolkit-recent', []);
    set({ recentFiles: [] });
  },

  setTheme: (newTheme) => {
    console.log('[Store] setTheme CALLED with:', newTheme);
    saveToStorage('pdf-toolkit-theme', newTheme);
    set({ theme: newTheme });
  },

  reset: () => set({
    pdfFiles: [],
    orderedPages: [],
    selectedPages: new Set(),
    isProcessing: false,
    error: null,
    overlays: [],
    currentPdfPath: null,
  }),
}));

export const useAppStore = store;