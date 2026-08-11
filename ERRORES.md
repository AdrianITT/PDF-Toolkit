# Registro de Errores — PDF Toolkit

> Registro de errores encontrados que afectan el funcionamiento de la aplicación.
> Formato: cada error tiene severidad, archivos afectados, impacto y estado.

---

## Resumen

| ID | Severidad | Descripción corta | Estado |
|----|-----------|-------------------|--------|
| E-01 | Crítico | Detección de entorno Tauri rota (descargas nativas nunca se usan) | Abierto (parcialmente corregido) |
| E-02 | Crítico | `pdf.service.ts` siempre cae al servicio MOCK en Tauri | Abierto |
| E-03 | Crítico | `compress_pdf` (Rust) doble-comprimía streams → PDF corrupto | ✅ Corregido |
| E-03b | Crítico | `compress_pdf` reemplazaba streams si eran menores que el *descomprimido* (no que el original) → stream crecía y `total_saved` desbordaba | ✅ Corregido |
| E-04 | Alto | `writeFile` recibe `number[]` en vez de `Uint8Array` (conversor DOCX→PDF) | Abierto |
| E-05 | Alto | Texto corrupto "rotaci��n" en `Toolbar.tsx` (mojibake) | Abierto |
| E-06 | Alto | Comando Rust `protect_pdf` sin uso + "encriptación" falsa | Abierto |
| E-07 | Medio | Fallback de worker pdf.js con versión desactualizada | Abierto |
| E-08 | Medio | Descargas vía `<a download>` no fiables en Tauri/WKWebView | Abierto |
| E-09 | Bajo | Submenús del menú lateral no se abren automáticamente | Abierto |
| E-10 | Bajo | Parseo de páginas permite NaN (rotar/eliminar en PdfTools) | Abierto |
| E-11 | Medio | Capabilities sin permisos para plugins `dialog`/`fs` → guardado nativo bloqueado por ACL | ✅ Corregido |

---

## Detalle

### E-01 — Detección de entorno Tauri rota en el frontend — Crítico

**Descripción:** Se detecta Tauri con `await invoke('get_pdf_info', { path: '' })`. El comando Rust espera `file_data` y `file_index`, por lo que **siempre lanza error** (argumentos inválidos) y `isTauri` queda en `false`, incluso dentro de la app de escritorio.

**Impacto:** En la app empaquetada, el diálogo de guardado nativo (`plugin-dialog` + `plugin-fs`) **nunca se usa**; las descargas caen a `saveAs()`/`<a download>`, que WKWebView (Tauri) puede bloquear silenciosamente → el usuario no puede guardar archivos.

**Apariciones (11):**
- `src/modules/image-compressor/ImageCompressorPage.tsx:195, 253`
- `src/modules/pdf-split-merge/PdfSplitMergePage.tsx:128, 218`
- `src/modules/image-editor/ImageEditorPage.tsx:201`
- `src/modules/screenshot/ScreenshotPage.tsx:42`
- `src/modules/qr-scanner/QrScannerPage.tsx:306, 634, 673, 839, 886`

**Solución correcta:** usar `window.__TAURI_INTERNALS__` (o intentar `invoke` de un comando que no falle, ej. `check_libreoffice`).
**✅ Parcialmente corregido:** `PdfCompressorPage.tsx` ahora usa `__TAURI_INTERNALS__`.

---

### E-02 — `pdf.service.ts` siempre usa el servicio MOCK en Tauri — Crítico

**Descripción:** En `src/services/pdf.service.ts:84` el probe de entorno es
`await invoke('get_pdf_info', { fileData: [], fileIndex: 0 })`.
Con datos **vacíos**, el comando Rust (`Document::load_mem(&[])`) devuelve error → el `catch` activa el **mock service** (pdf-lib) de forma permanente.

**Impacto:** El merge/extract real de Rust (`merge_pdfs`, `extract_pages`) **nunca se usa** en la app empaquetada. El merge sigue funcionando (pdf-lib), pero:
- `extractPages` del mock **devuelve el PDF sin modificar**.
- Se duplica trabajo (pdf-lib en JS es más lento que lopdf en Rust).

**Solución propuesta:** el probe debe usar datos válidos, p. ej. un mini-PDF generado, o detectar el entorno con `__TAURI_INTERNALS__` y construir el servicio real directamente.

---

### E-03 — `compress_pdf` (Rust) doble-compresión → PDF corrupto — Crítico — ✅ Corregido

**Descripción:** La implementación anterior (en `pdf_tools.rs`) comprimía streams que ya tenían filtro `FlateDecode` **sin descomprimir antes**:
```rust
if !has_filter || stream_size > 4096 {
    // comprime stream.content tal cual y re-etiqueta como FlateDecode
}
```
Esto produce **doble compresión** (flate sobre flate): cualquier lector decodifica una sola vez y queda contenido corrupto en el stream.

**Corrección aplicada (esta sesión):**
- Streams sin filtro → se comprimen con zlib.
- Streams `FlateDecode` → se descomprimen y re-comprimen (solo en modo "máxima compresión", nivel ≥8), reemplazando solo si queda más pequeño.
- Streams de fuentes con `Length1` se omiten (evita corromper fuentes).
- Otros filtros (JPEG/JPX) se dejan intactos.
- Se eliminan streams vacíos y objetos huérfanos (`delete_zero_length_streams` + `prune_objects` + `renumber_objects`).
- Tests añadidos en `src-tauri/src/commands/pdf_tools.rs` (3 tests, verifican tamaño menor y PDF válido).

---

### E-03b — `compress_pdf` comparaba contra el tamaño descomprimido — Crítico — ✅ Corregido

**Descripción:** En `try_compress_stream` (`pdf_tools.rs`), al re-comprimir un stream ya `FlateDecode` se comparaba `compressed.len() + 19 < data.len()`, donde `data` es el contenido **descomprimido** (mucho mayor). Si el re-comprimido quedaba mayor que el stream original (pero menor que el descomprimido), se reemplazaba con contenido **mayor** → `total_saved += stream_size - stream.content.len()` desbordaba (panic) con PDFs reales con imágenes.

**Corrección aplicada:** la comparación es ahora contra `stream.content.len()` (tamaño real original del stream). Detectado al probar con PDF real (9.58 MB) tras añadir la re-codificación de imágenes.

---

### E-04 — `writeFile` recibe `number[]` en vez de `Uint8Array` — Alto

**Archivo:** `src/modules/converter/ConverterPage.tsx:138`
```ts
await writeFile(inputPath, Array.from(fileData) as unknown as Uint8Array);
```
`Array.from(fileData)` produce `number[]`, no `Uint8Array`. `plugin-fs.writeFile` espera `Uint8Array`/`ArrayBuffer`. El cast `as unknown as` oculta el error de tipos, pero en runtime puede fallar o escribir basura.

**Impacto:** Conversión **DOCX→PDF vía LibreOffice** rota en la app de escritorio (falla al escribir el archivo temporal).

**Solución propuesta:** pasar `new Uint8Array(fileData)` (o `fileData.buffer` correctamente tipado).

---

### E-05 — Texto corrupto en `Toolbar.tsx` (mojibake) — Alto

**Archivo:** `src/components/Toolbar.tsx:369`
```
<p>Ángulo de rotaci��n:</p>
```
La cadena `�` son bytes corruptos (U+FFFD). Se muestra "Ángulo de rotaci�n:" en el modal de Rotar páginas.

**Solución propuesta:** reemplazar por `Ángulo de rotación:`.

---

### E-06 — Comando `protect_pdf` sin uso y "encriptación" falsa — Alto

**Descripción:**
- El comando Rust `protect_pdf` está registrado en `lib.rs` pero **ningún módulo lo invoca** (la protección real usa `pdf-lib-plus-encrypt` en `PdfToolsPage.tsx`).
- Además, como documenta `AGENTS.md`, su "encriptación" es **ficticia** (`simple_hash` djb2 + diccionario `Encrypt` de mentira): no protege nada.

**Impacto:** Código muerto que puede inducir a creer que un PDF está cifrado cuando no lo está. Riesgo de seguridad si alguien confía en él.

**Solución propuesta:** eliminar el comando o reemplazarlo por cifrado real (lopdf no lo soporta nativamente; usar pdf-lib-plus-encrypt del lado frontend ya existente).

---

### E-07 — Fallback de worker pdf.js con versión desactualizada — Medio

**Archivo:** `src/hooks/usePdfThumbnails.ts:53-54`
```ts
(pdfjsLib as any).GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.mjs';
```
La versión instalada de `pdfjs-dist` es **4.10.38** (build legacy), el fallback CDN usa **3.11.174**. Si se activa el fallback (worker local no disponible), el worker antiguo puede ser incompatible con la API actual → miniaturas fallan.

**Solución propuesta:** alinear el fallback con la versión de `pdfjs-dist` del proyecto o usar `import.meta.url` (ya se hace en el path principal).

---

### E-08 — Descargas vía `<a download>` no fiables en Tauri/WKWebView — Medio

**Descripción:** El patrón de descarga de `downloadPdf` (`src/services/pdf.service.ts`) y `saveAs` de `file-saver` usa blob URL + `<a download>`. En Tauri v2 / WKWebView el atributo `download` no se gestiona por defecto → las descargas pueden no ocurrir en la app empaquetada.

**Impacto:** Combinado con E-01, varios módulos no pueden guardar archivos en la app de escritorio.

**Solución propuesta:** en Tauri usar siempre `plugin-dialog.save()` + `plugin-fs.writeFile()`; reservar `<a download>` para el navegador.

---

### E-09 — Submenús del menú lateral no se abren automáticamente — Bajo

**Archivo:** `src/App.tsx:364`
```ts
<Menu ... selectedKeys={[activeModule]} ... />
```
Todos los módulos viven dentro de submenús ("Edición & Creación", "Seguridad", etc.). Al navegar (p. ej. vía dashboard), el submenú padre no se expande automáticamente y puede parecer que el módulo "no está seleccionado".

**Solución propuesta:** usar `defaultOpenKeys`/`openKeys` derivados del grupo del módulo activo.

---

### E-10 — Parseo de páginas admite NaN — Bajo

**Archivo:** `src/modules/pdf-tools/PdfToolsPage.tsx:311-320, 354-363`
```ts
} else {
  pages.push(Number(part)); // entrada no numérica → NaN
}
```
Entrada como "abc" o "1,,3" produce `NaN` en `pagesToProcess`, que luego se envía al comando Rust (que fallará).

**Solución propuesta:** validar con `Number.isNaN` y filtrar entradas inválidas.

---

### E-11 — Capabilities sin permisos para plugins dialog/fs — Medio — ✅ Corregido

**Descripción:** `src-tauri/capabilities/default.json` solo tenía `core:default`. Los plugins `tauri-plugin-dialog` y `tauri-plugin-fs` (registrados en `lib.rs`) no tenían permisos ACL, por lo que `save()` del diálogo nativo fallaba con `Command plugin:dialog|save not allowed by ACL` y el PDF comprimido no se guardaba.

**Corrección aplicada:** añadidos `dialog:default` y `fs:allow-write-file` a las capabilities. El comando `save()` extiende automáticamente el scope de fs con la ruta elegida por el usuario (`allow_file`), por lo que `writeFile` funciona sin scope manual.

**Nota:** las capabilities se compilan en el binario → hay que recompilar la app de escritorio (`npm run tauri dev`/`build`).

---

## Notas

- **E-03 corregido** en esta sesión junto con la mejora del módulo "Comprimir PDF".
- **E-01 corregido** únicamente en `PdfCompressorPage.tsx`; el resto de apariciones siguen abiertas.
- Los errores de ESLint (~90 pre-existentes: `any`, vars sin usar, catch vacíos) no bloquean el build; se documentan por separado en `TECH_DEBT_PLAN.md`.

*Creado: Agosto 2026.*