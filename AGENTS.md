# AGENTS.md — Referencia del Proyecto PDF Toolkit

> Documento de referencia para consulta rápida. **Leer este archivo antes de modificar código.** Actualizar aquí cualquier cambio relevante de arquitectura, dependencias o comandos.

---

## 1. Resumen

Aplicación de escritorio multiplataforma (macOS/Windows/Linux) de **herramientas PDF**. Stack: **Tauri 2** (Rust) como shell de escritorio + **React 19 + TypeScript + Vite** como frontend. No usa router; la navegación es por estado global (menú lateral conmuta módulos).

UI en **español**.

---

## 2. Comandos (desde la raíz)

| Comando | Descripción |
|---|---|
| `npm run dev` | Frontend web en `http://localhost:5173` (Vite HMR) |
| `npm run tauri dev` | App de escritorio en desarrollo (compila Rust + abre ventana) |
| `npm run build` | Compila frontend → `dist/` |
| `npm run tauri build` | Compila la app de escritorio completa |
| `npm run tauri:build:app` | `tauri build --bundles app` (solo `.app` para macOS) |
| `npx tauri build --bundles dmg` | Genera instalador DMG |
| `npm run lint` | ESLint (config `eslint.config.js`) |
| `npm test` / `npm run test:watch` | Vitest (tests en `*.test.tsx`) |
| `npm run preview` | Sirve el build de producción |

**Salidas de build Tauri:** `src-tauri/target/release/bundle/macos/PDF Toolkit.app` (ejecutable) y `.../bundle/dmg/PDF Toolkit_0.1.0_aarch64.dmg` (instalador).

**Requisitos del entorno:** Node ≥18, Rust ≥1.77.2 (requerido por `Cargo.toml`), Xcode CLT (macOS). LibreOffice (opcional, solo para conversión DOCX→PDF).

---

## 3. Arquitectura

### 3.1 Frontend (`src/`)

```
src/
├── App.tsx              # Layout + menú + registro de módulos (clave: icono, etiqueta)
├── main.tsx             # Punto de entrada React
├── components/          # Toolbar, PdfGrid, PdfThumbnail, FileDropzone, ErrorBoundary
├── hooks/               # useFileUpload, usePdfThumbnails (carga PDFs + miniaturas)
├── modules/             # 32 módulos, cada uno en su carpeta (ver sección 5)
├── services/            # pdf.service.ts — capa de invocación Rust/Mock
├── stores/              # appStore.ts — estado global (Zustand)
├── types/               # index.ts — tipos compartidos (PdfFile, PdfPage, AppModule...)
├── utils/               # pdfjs.ts — carga/render de PDFs con pdf.js
└── assets/              # hero.png, etc.
```

**Patrones a respetar:**
- Cada módulo = 1 archivo `XxxPage.tsx` dentro de `src/modules/<nombre>/`.
- Nuevo módulo: crear carpeta + `XxxPage.tsx`, registrar en `modules` map de `App.tsx`, agregar la clave al union type `AppModule` en `src/types/index.ts`, agregar item al menú en `App.tsx`.
- Componentes reutilizables en `src/components/`; hooks en `src/hooks/`.
- **NO usar `react-router`**: la navegación es por `activeModule` del store Zustand.
- UI con **Ant Design** (`antd` v6); íconos de `@ant-design/icons`.

### 3.2 Backend Tauri (`src-tauri/`)

```
src-tauri/
├── src/main.rs          # Entry point → llama app_lib::run()
├── src/lib.rs           # Builder Tauri + registro de comandos + plugins
├── src/commands/        # Comandos Rust (cada archivo = dominio)
│   ├── pdf.rs           # get_pdf_info, merge_pdfs, extract_pages
│   ├── pdf_tools.rs     # compress_pdf, rotate_pages, protect_pdf, delete_pages, split_pdf
│   ├── watermark.rs     # add_watermark
│   ├── zip.rs           # create_zip (comprime archivos/carpetas en ZIP, recursivo, deflate 1-9)
│   ├── converter.rs     # check_libreoffice, convert_to_pdf
│   └── signature.rs     # parse_certificate, sign_document_hash, get_certificate_public_key
├── Cargo.toml           # Dependencias Rust
├── tauri.conf.json      # Config: productName "PDF Toolkit", identifier, CSP, bundles
├── capabilities/        # Permisos (core:default)
└── icons/
```

**Comandos registrados en `lib.rs` (16 total):** `get_pdf_info`, `merge_pdfs`, `extract_pages`, `check_libreoffice`, `convert_to_pdf`, `add_watermark`, `compress_pdf`, `rotate_pages`, `protect_pdf`, `delete_pages`, `split_pdf`, `parse_certificate`, `sign_document_hash`, `get_certificate_public_key`, `create_zip`.

**IPC frontend→Rust:** se usa `invoke()` de `@tauri-apps/api` (`core.invoke`). Los `Uint8Array` se pasan como `Array.from(data)` (arrays de números) porque Tauri serializa a JSON.

### 3.3 Capa de servicio `src/services/pdf.service.ts` (importante)

Auto-detecta el entorno:
- Intenta `invoke('get_pdf_info', ...)` → si funciona usa **servicio real Tauri**.
- Si lanza error (ej. ejecutándose en navegador) → cae al **mock service** (implementado con `pdf-lib`, solo merge/download). Log: `[pdf.service] Using MOCK service (dev mode)`.

---

## 4. Estado global (Zustand) — `src/stores/appStore.ts`

Keys persistentes en `localStorage`: `pdf-toolkit-theme`, `pdf-toolkit-recent`.

Estado principal: `activeModule`, `pdfFiles`, `orderedPages`, `selectedPages` (Set), `isProcessing`, `error`, `overlays` (firmas/sellos), `currentPdfPath`, `recentFiles`, `theme`, `selectedAsset`, `lastModule`.

**Importante:** `selectedPages` y demás Sets se guardan en estado (no persistidos). Al agregar un módulo que necesite estado compartido, extender esta store.

---

## 5. Módulos (`src/modules/`) — 32

| Módulo | Archivo | Función |
|---|---|---|
| dashboard | `dashboard/DashboardPage.tsx` | Inicio, accesos rápidos |
| pdf-editor | `pdf-editor/PdfEditorPage.tsx` (+`SearchBar`, `SignatureModal`) | Edición/fusión/reorden de PDFs |
| image-editor | `image-editor/ImageEditorPage.tsx` | Editor de imágenes |
| annotations | `annotations/AnnotationsPage.tsx` | Resaltado/subrayado/notas |
| forms | `forms/PdfFormsPage.tsx` | Formularios PDF |
| templates | `templates/TemplatesPage.tsx` (+`pdfGenerator.ts`) | Generador de documentos |
| redact | `redact/RedactPage.tsx` | Redactar información sensible |
| signatures | `signatures/SignaturesPage.tsx` | Gestión de firmas |
| digital-signature | `digital-signature/DigitalSignaturePage.tsx` | Firma con certificados P12/PFX |
| stamps | `stamps/StampsPage.tsx` | Gestión de sellos |
| watermark | `watermark/WatermarkPage.tsx` | Marca de agua |
| image-extractor | `image-extractor/ImageExtractorPage.tsx` | Extraer imágenes de PDF |
| converter | `converter/ConverterPage.tsx` | Conversor documentos (LibreOffice) |
| ocr | `ocr/OcrPage.tsx` | OCR (tesseract.js) |
| batch | `batch/BatchProcessingPage.tsx` | Procesamiento por lotes |
| metadata | `metadata/MetadataEditorPage.tsx` | Metadatos PDF |
| compare | `compare/PdfComparePage.tsx` | Comparar 2 PDFs |
| compliance | `compliance/PdfACompliancePage.tsx` | Cumplimiento PDF/A |
| html-to-image | `html-to-image/HtmlToImagePage.tsx` (+`layoutEngine.ts`, `logoUtils.ts`, `signatureTemplates.tsx` 20 plantillas) | Creador de firmas de email |
| asset-positioner | `asset-positioner/AssetPositionerPage.tsx` | Posicionar firma/sello en PDF |
| qr-scanner | `qr-scanner/QrScannerPage.tsx` | Escáner QR (html5-qrcode) |
| image-viewer | `image-viewer/ImageViewerPage.tsx` | Visor de imágenes |
| document-viewer | `document-viewer/DocumentViewerPage.tsx` | Visor de documentos (react-doc-viewer) |
| batch-image | `batch-image/BatchImageProcessorPage.tsx` | Procesador de imágenes por lote |
| unit-converter | `unit-converter/UnitConverterPage.tsx` | Conversor de unidades |
| pdf-split-merge | `pdf-split-merge/PdfSplitMergePage.tsx` | Split/Merge dedicado |
| pdf-compressor | `pdf-compressor/PdfCompressorPage.tsx` | Compresor PDF |
| image-compressor | `image-compressor/ImageCompressorPage.tsx` | Compresor de imágenes |
| zip-compressor | `zip-compressor/ZipCompressorPage.tsx` | Compresor ZIP (Rust nativo + fallback JSZip) |
| screenshot | `screenshot/ScreenshotPage.tsx` | Capturas (⚠️ no registrado en App.tsx) |

> ⚠️ `screenshot/` existe pero **NO** está registrado en el map `modules` de `App.tsx` ni en `AppModule`. No es navegable.

---

## 6. Tipos clave (`src/types/index.ts`)

- `PdfPage` `{ id, fileId, pageNumber, thumbnail, fileName }`
- `PdfFile` `{ id, name, data: Uint8Array, pageCount, pages }`
- `PageRef` `{ file_index, page_number }` (contrato IPC)
- `PdfMergeRequest` `{ files: Uint8Array[], page_order: PageRef[] }`
- `AppModule` — union type de 30 claves de módulo

---

## 7. Dependencias principales

**Frontend (runtime):** react, react-dom, antd, zustand, pdf-lib (+`pdf-lib-plus-encrypt`), pdfjs-dist (legacy build), jspdf, mammoth (DOCX), xlsx, tesseract.js (OCR), html2canvas, html-to-image, html5-qrcode, qrcode, jszip (ZIP web), file-saver, dompurify, react-dropzone, react-easy-crop, react-zoom-pan-pinch, @dnd-kit/*, @cyntler/react-doc-viewer, @tauri-apps/api + plugins dialog/fs.

**Backend (Rust):** tauri 2.11, tauri-plugin-log/dialog/fs, lopdf 0.34 (manipulación PDF), flate2 (compresión), zip 2 (compresión ZIP, deflate), image 0.25 (re-codificación JPEG), openssl (vendored; firmas), base64, chrono, serde/serde_json.

**Dev:** vite 5, typescript 6, vitest 4 + jsdom, @testing-library/react + jest-dom, eslint 10, @tauri-apps/cli.

---

## 8. Notas críticas / gotchas

1. **pdf.js**: siempre importar build **legacy**: `pdfjs-dist/legacy/build/pdf.mjs`. Worker configurado en `src/utils/pdfjs.ts` (url de `import.meta.url`) y en `usePdfThumbnails.ts` con fallback CDN.
2. **`protect_pdf`** en `pdf_tools.rs` NO es cifrado PDF real: usa `simple_hash` (hash djb2 repetido) y un diccionario Encrypt ficticio. Solo "marca" el PDF como protegido. No confiar en él para seguridad. El comando no se usa desde el frontend (la protección real usa `pdf-lib-plus-encrypt`).
3. **`convert_to_pdf`** requiere **LibreOffice** instalado (busca `/Applications/LibreOffice.app/.../soffice`, `/usr/bin/libreoffice`, etc.). No existe conversión inversa (PDF→DOCX) vía Rust.
4. **Descargas**: en frontend se usa Blob + `downloadPdf` (`pdf.service.ts`). En Tauri los datos vuelven como `number[]` → `new Uint8Array(result)`. ⚠️ En Tauri las descargas vía `<a download>`/`saveAs` no son fiables (ver `ERRORES.md` E-01/E-08).
5. **CSP estricto** definido en `tauri.conf.json` (permite CDNs jsdelivr/cdnjs/api-ninjas). Al añadir recursos externos, verificar CSP.
6. `merge_pdfs` (Rust, `pdf.rs`) renumera objetos y usa BTreeMap para fusión de páginas; el merge frontend-vía-pdf-lib solo se usa en el **mock**. ⚠️ El probe de `pdf.service.ts` falla en Tauri → siempre usa mock (ver `ERRORES.md` E-02).
7. En `Toolbar.tsx` y `appStore.ts` hay `console.log` de debug (toggle tema). No eliminar sin confirmar.
8. `vite.config.ts` hace code-splitting manual (`pdf-lib`, `pdf-view`) y CSP para dev.
9. Tests excluyen `src/**/__tests__/**` del typecheck (tsconfig.app.json); se ejecutan con jsdom.
10. Imagen `Sin título.png` en la raíz no se usa por la app (puede ignorarse).
11. **`compress_pdf`** (`pdf_tools.rs`) re-comprime streams de forma segura (sin doble compresión), omite fuentes con `Length1`, no toca imágenes JPEG/JPX salvo en modo «Máxima» (quality ≤ 0.3) donde **re-codifica imágenes a JPEG** (crate `image`): reduce resolución (máx 1400px) y calidad (JPEG ~42), solo si queda más pequeño. Limpia objetos huérfanos. Tests Rust en el mismo archivo. El módulo `pdf-compressor` usa motor Rust en Tauri y pdf-lib como respaldo web.
12. **`create_zip`** (`zip.rs`) es `async` y recibe `ZipRequest { paths, level, output_name }` + `on_progress: Channel<ZipProgress>` (reporta `processed_bytes`/`total_bytes`/`current_file` por trozos de 1 MB) y devuelve el ZIP como `Vec<u8>`. El núcleo síncrono `compress_to_bytes` es el que testeamos (la crate `zip` 2.x exige `compression_level(Some(level as i64))`; `start_file` consume `name` → usar `.clone()`). Niveles 1-9 = flate2 (deflate clásico); niveles **> 9 activan Zopfli** (iteraciones = nivel−9; rango válido 10-264). ⚠️ El `zip` crate trocea Zopfli con un `BufWriter` de 32 KB por defecto → empeora el ratio en archivos grandes; usar `.with_zopfli_buffer(Some(1_000_000))`. El nivel «Máxima (Ultra)» usa nivel 39 (30 iteraciones, punto óptimo: 255 iteraciones apenas reducen tamaño y multiplican el tiempo). Recorre carpetas de forma recursiva y conserva la estructura. `paths` vacío → error. Tests Rust en el mismo archivo (9 tests en total con pdf_tools). El módulo `zip-compressor` usa motor Rust en Tauri (con barra de progreso + tiempo restante estimado) y JSZip como respaldo web (JSZip solo soporta niveles 1-9 y reporta % vía `generateAsync(type, onUpdate)`).
13. **Registro de errores conocidos**: ver `ERRORES.md` (detalla E-01 a E-10 con severidad y estado).
