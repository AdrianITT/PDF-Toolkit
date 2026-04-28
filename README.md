# PDF Toolkit — Mesa de Trabajo de Documentos PDF

**PDF Toolkit** es una aplicación de escritorio multiplataforma construida con Tauri + React + TypeScript que permite gestionar, editar y convertir documentos PDF con una interfaz moderna e intuitiva.

---

## Tabla de Contenidos

- [Funcionalidades](#funcionalidades)
- [Capturas de Pantalla](#capturas-de-pantalla)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Desarrollo](#desarrollo)
- [Construcción](#construcción)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Tecnologías](#tecnologías)

---

## Funcionalidades

### 1. Conversor de Documentos
Convierte documentos entre múltiples formatos populares:
- **PDF a DOCX** — Convierte PDF a documento Word editable
- **PDF a XLSX** — Extrae datos de tablas PDF a Excel
- **PDF a HTML** — Convierte contenido PDF a HTML
- **PDF a TXT** — Extrae texto plano de documentos PDF
- Soporta arrastrar y soltar archivos

### 2. Editor de PDF
Herramientas completas de edición de documentos:
- **Añadir texto** — Inserta texto personalizado en cualquier página
- **Añadir imágenes** — Inserta logos, firmas o fotografías
- **Añadir formas** — Rectángulos, círculos, líneas
- **Firmas manuscritas** — Dibuja tu firma o súbela como imagen
- **Sellos** — Crea y aplica sellos personalizados (Aprobado, Revisado, etc.)
- **Arrastrar y redimensionar** — Mueve y ajusta elementos libremente
- **Deshacer/Rehacer** — Historial de cambios ilimitado
- **Zoom** — Acercar/alejar la vista del documento
- **Exportar** — Guarda el documento editado como PNG, JPG o HTML

### 3. Marca de Agua
Aplica marcas de agua profesionales:
- **Texto personalizado** — Añade texto con estilo personalizable
- **Imagen/Logo** — Usa una imagen como marca de agua
- **Posición** — Selecciona dónde colocar la marca de agua
- **Opacidad** — Ajusta la transparencia
- **Tamaño** — Control del tamaño de la marca de agua
- **Ángulo** — Rota la marca de agua (diagonal, etc.)
- **Aplicar a** — Todas las páginas o páginas específicas

### 4. Creador de Firmas de Correo
Diseña firmas de email profesionales con 15 plantillas integradas:

| # | Plantilla | Estilo |
|---|-----------|--------|
| 1 | Minimalista Limpio | Diseño limpio con tipografía elegante |
| 2 | Minimalista Oscuro | Fondo oscuro elegante con texto claro |
| 3 | Jerárquico Superior | Logo centrado con jerarquía visual |
| 4 | Jerárquico Lateral | Barra lateral accent con bloques de info |
| 5 | Visual Centrado | Logo grande con diseño simétrico |
| 6 | Visual Lateral | Logo con tarjetas internas |
| 7 | Sectorial Bloques | Secciones diferenciadas por color |
| 8 | Sectorial Grid | Grid de 2x2 para campos |
| 9 | Corporativo Estricto | Diseño formal compatible con Outlook |
| 10 | Corporativo Moderno | Gradientes y badges coloridos |
| 11 | Elegante Serif | Tipografía serif con ornamento |
| 12 | Tech Startup | Colores vibrantes startup |
| 13 | Tarjeta Sombra | Contenido elevado con sombra |
| 14 | Legal Formal | Minimalista extremo formal |
| 15 | Dark Gradient | Fondo oscuro con degradado |

**Campos de la firma:**
- Nombre, Cargo, Empresa/Organización
- Email, Teléfono, Web, Dirección
- Redes sociales (LinkedIn, Twitter)
- Campos opcionales: Skype, Instagram, Facebook
- Logo personalizable

**Personalización:**
- Selector visual de plantillas (grid de thumbnails)
- Colores: fondo, texto, links, acento
- Bordes y esquinas ajustables
- Vista previa en tiempo real (Desktop/Móvil)
- Exportar como PNG, JPG o HTML
- Guardar/Cargar firmas múltiples

### 5. Herramientas PDF
Conjunto de utilidades PDF:
- **Fusionar PDFs** — Combina múltiples archivos PDF en uno
- **Dividir PDF** — Extrae páginas específicas o rangos
- **Rotar páginas** — Rota una o varias páginas
- **Reordenar páginas** — Arrastra y suelta para reordenar
- **Eliminar páginas** — Quita páginas no deseadas
- **Comprimir PDF** — Reduce el tamaño del archivo

### 6. Gestión de Sellos
Crea y administra sellos personalizados:
- **Sellos predeterminados** — Aprobado, Revisado, Urgente, Borrador, Confirmado
- **Sellos personalizados** — Crea sellos con texto y color personalizados
- **Subir sello como imagen** — Usa una imagen existente
- **Aplicar a documento** — Coloca el sello en el PDF

---

## Capturas de Pantalla

*(Próximamente — Agrega capturas de pantalla del módulo de Editor, Conversor, Firmas, etc.)*

---

## Requisitos Previos

### Para desarrollo web (Vite)
- **Node.js** 18.x o superior
- **npm** 9.x o superior (o pnpm/yarn)

### Para aplicación de escritorio (Tauri)
- **Node.js** 18.x o superior
- **Rust** 1.70 o superior
- **Rustup** instalado
- **macOS:** Xcode Command Line Tools
- **Windows:** Visual Studio Build Tools
- **Linux:** `libwebkit2gtk-4.1-dev`, `libssl-dev`, `build-essential`

### Verificar instalación de Rust
```bash
rustc --version
cargo --version
```

---

## Instalación

### Paso 1: Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd ConvertidoyMas/pdf-toolkit
```

### Paso 2: Instalar dependencias

```bash
npm install
```

### Paso 3: Configurar Tauri (solo si usas la app de escritorio)

Tauri requiere configurar un identificador único para la aplicación. Edita el archivo `src-tauri/tauri.conf.json`:

```json
{
  "productName": "PDF Toolkit",
  "identifier": "com.tu-dominio.pdf-toolkit",
  ...
}
```

> **Nota:** El `identifier` debe ser un dominio inverso único. Si no planeas usar Tauri, puedes ignorar este paso.

---

## Desarrollo

### Ejecutar en modo desarrollo (Web)

```bash
npm run dev
```

Esto inicia el servidor de desarrollo en `http://localhost:5173`. Los cambios se recargan automáticamente.

### Ejecutar en modo desarrollo (Tauri)

```bash
npm run tauri
```

Esto abre la aplicación de escritorio Tauri con recarga en caliente.

---

## Construcción

### Construir para web (genera archivos estáticos)

```bash
npm run build
```

Output en la carpeta `dist/`. Puedes desplegar estos archivos en cualquier hosting estático (Vercel, Netlify, GitHub Pages, etc.).

### Construir aplicación de escritorio

```bash
npm run tauri build
```

Esto genera:
- **macOS:** `.app` y `.dmg`
- **Windows:** `.exe` (NSIS installer)
- **Linux:** `.deb`, `.AppImage`

Los ejecutables se encuentran en `src-tauri/target/release/bundle/`.

### Construir solo el ejecutable (sin installer)

```bash
npm run tauri:build:app
```

---

## Estructura del Proyecto

```
pdf-toolkit/
├── src/
│   ├── modules/
│   │   ├── converter/        # Conversor de documentos
│   │   │   └── ConverterPage.tsx
│   │   ├── html-to-image/    # Creador de firmas de correo
│   │   │   ├── HtmlToImagePage.tsx
│   │   │   └── signatureTemplates.tsx
│   │   ├── pdf-editor/       # Editor de PDF
│   │   │   └── PdfEditorPage.tsx
│   │   ├── pdf-tools/        # Herramientas PDF varias
│   │   │   └── PdfToolsPage.tsx
│   │   ├── signatures/       # Gestión de firmas manuscritas
│   │   │   └── SignaturesPage.tsx
│   │   ├── stamps/           # Gestión de sellos
│   │   │   └── StampsPage.tsx
│   │   └── watermark/        # Marca de agua
│   │       └── WatermarkPage.tsx
│   ├── stores/
│   │   └── appStore.ts       # Estado global (Zustand)
│   ├── types/
│   │   └── index.ts          # Tipos compartidos
│   ├── App.tsx               # Componente principal
│   └── main.tsx              # Punto de entrada
├── src-tauri/                # Código Rust (Tauri)
│   ├── src/
│   │   └── lib.rs            # Lógica Rust
│   ├── Cargo.toml           # Dependencias Rust
│   ├── tauri.conf.json      # Configuración Tauri
│   └── icons/               # Iconos de la app
├── public/                   # Archivos estáticos
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Agregar un nuevo módulo

1. Crear carpeta en `src/modules/mi-modulo/`
2. Crear `MiModuloPage.tsx` con el componente principal
3. Agregar la ruta en `src/App.tsx`
4. Agregar el módulo en `src/types/index.ts`

---

## Tecnologías

### Frontend
- **React** 19 — Biblioteca de UI
- **TypeScript** 6 — Tipado estático
- **Vite** 5 — Bundler y servidor de desarrollo
- **Ant Design** 6 — Componentes UI
- **Zustand** 5 — Gestión de estado
- **React Dropzone** 15 — Arrastrar y soltar archivos
- **html-to-image** — Exportar como imagen
- **pdf-lib** — Manipulación de PDFs
- **pdfjs-dist** — Renderizado de PDFs
- **mammoth** — Conversión DOCX a PDF
- **xlsx** — Lectura/escritura de Excel
- **jspdf** — Generación de PDFs
- **@dnd-kit** — Drag and drop

### Backend / Escritorio
- **Tauri** 2 — Framework de escritorio (Rust + WebView)
- **Rust** — Lenguaje del backend

### Plataformas soportadas
- Windows (7+)
- macOS (10.14+)
- Linux (Ubuntu 18.04+, Debian 10+)

---

## Licencia

MIT License — Ver archivo `LICENSE` para más detalles.

---

## Contribuir

1. Haz un fork del repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcion`)
3. Haz commit de tus cambios (`git commit -m 'Añadir nueva función'`)
4. Push a la rama (`git push origin feature/nueva-funcion`)
5. Abre un Pull Request

---

## Soporte

Si encuentras algún problema o tienes sugerencias, abre un issue en el repositorio.