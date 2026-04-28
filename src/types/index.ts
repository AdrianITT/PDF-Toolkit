export interface PdfPage {
  id: string;
  fileId: string;
  pageNumber: number;
  thumbnail: string;
  fileName: string;
}

export interface PdfFile {
  id: string;
  name: string;
  data: Uint8Array;
  pageCount: number;
  pages: PdfPage[];
}

export interface PageRef {
  file_index: number;
  page_number: number;
}

export interface PdfMergeRequest {
  files: Uint8Array[];
  page_order: PageRef[];
}

export interface PdfInfo {
  page_count: number;
  file_index: number;
}

export type AppModule = 'pdf-editor' | 'converter' | 'watermark' | 'signatures' | 'stamps' | 'html-to-image' | 'pdf-tools';