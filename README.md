# PDF Toolkit 📄

> Una suite completa de herramientas PDF de escritorio, construida con tecnologías modernas para ofrecer una experiencia de usuario fluida y profesional.

[![Tauri](https://img.shields.io/badge/Tauri-2.0-%2324C8D8?logo=tauri&logoColor=white)](https://tauri.app)
[![React](https://img.shields.io/badge/React-19-%2361DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-%233178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Rust](https://img.shields.io/badge/Rust-1.70+-%23CE422B?logo=rust&logoColor=white)](https://www.rust-lang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-%23000000?logo=opensourceinitiative&logoColor=white)](LICENSE)

---

## 📋 Descripción

**PDF Toolkit** es una aplicación de escritorio multiplataforma diseñada para simplificar el trabajo diario con documentos PDF. Combina la potencia de **Rust** para el backend y **React** para una interfaz moderna e intuitiva, todo empaquetado en una aplicación ligera gracias a **Tauri**.

Ideal para profesionales, estudiantes y empresas que necesitan:
- Convertir documentos entre múltiples formatos
- Editar PDFs agregando firmas, sellos y anotaciones
- Crear firmas de correo electrónico profesionales
- Manipular páginas PDF (fusionar, dividir, rotar, reordenar)
- Aplicar marcas de agua personalizadas
- Proteger documentos con encriptación y firmas digitales

---

## ✨ Características Principales

### 📊 Dashboard
Centro de control con acceso rápido a todas las herramientas:
- Acciones rápidas: Anotaciones, Redactar, Formularios, Editor PDF, Extraer Imágenes, Convertidor
- Firmas y Sellos: Acceso directo a gestión de firmas digitales y sellos

### 📝 Editor de PDF
Herramientas completas de edición con **pdf-lib** y **PDF.js**:
- **Fusión de PDFs**: Combina múltiples archivos en uno solo
- **Reordenamiento visual**: Arrastra y suelta páginas para reorganizar
- **Eliminar páginas**: Quita páginas no deseadas
- **Rotar páginas**: Rota páginas individuales o todas (90°, 180°, 270°)
- **Vista previa**: Renderizado fiel con PDF.js en tiempo real
- **Exportación**: Guarda el documento editado preservando calidad

### ✍️ Firmas Digitales
Gestión completa de firmas manuscritas y digitales:
- **Firmas manuscritas**: Dibuja tu firma con el mouse o panel táctil
- **Subir firma**: Importa imágenes PNG/JPG de firmas predefinidas
- **Biblioteca de firmas**: Guarda múltiples firmas para uso rápido
- **Posicionar en PDF**: Arrastra, redimensiona y coloca la firma en cualquier página

### 🔏 Sellos Personalizados
Biblioteca de sellos prediseñados y personalizados:
- **Sellos predefinidos**: Aprobado, Revisado, Urgente, Borrador, Confirmado, Personalizado
- **Subir sello**: Importa imágenes de sellos propios
- **Posicionar en PDF**: Arrastra, redimensiona y coloca el sello en cualquier página
- **Gestión de sellos**: Guarda y organiza tu biblioteca de sellos

### 🎯 Posicionador de Firmas/Sellos (Asset Positioner)
Workflow dedicado para posicionar firmas y sellos:
- **Cargar PDF**: Arrastra o selecciona el documento a firmar
- **Navegación de páginas**: Ve todas las páginas del documento
- **Arrastrar y soltar**: Posiciona la firma/sello con drag & drop
- **Redimensionar**: Ajusta el tamaño con controles visuales
- **Colores de tinta**: Cambia el color de la firma (negro, azul, rojo)
- **Descargar PDF**: Exporta el documento con la firma aplicada

### 🎨 Creador de Firmas de Correo (20 Plantillas)
Diseña firmas de email profesionales con personalización total:

**Plantillas disponibles:**
| # | Plantilla | Estilo |
|---|-----------|--------|
| 1 | Minimalista Limpio | Tipografía elegante con espaciado generoso |
| 2 | Minimalista Oscuro | Fondo oscuro con texto claro y acentos |
| 3 | Jerárquico Superior | Logo centrado con jerarquía visual clara |
| 4 | Jerárquico Lateral | Barra lateral con bloques de información |
| 5 | Visual Centrado | Logo grande con diseño simétrico |
| 6 | Visual Lateral | Logo con tarjetas de información internas |
| 7 | Sectorial Bloques | Secciones diferenciadas por color |
| 8 | Sectorial Grid | Grid de 2x2 para campos organizados |
| 9 | Corporativo Estricto | Diseño formal compatible con Outlook |
| 10 | Corporativo Moderno | Gradientes y badges coloridos |
| 11 | Elegante Serif | Tipografía serif con ornamento decorativo |
| 12 | Tech Startup | Colores vibrantes para empresas tecnológicas |
| 13 | Tarjeta Sombra | Contenido elevado con sombras suaves |
| 14 | Legal Formal | Minimalista extremo para sector legal |
| 15 | Dark Gradient | Fondo oscuro con degradado moderno |
| 16-20 | Personalizadas | Espacios para diseños custom |

**Campos configurables:**
- **Información personal**: Nombre, Cargo, Empresa/Organización
- **Contacto**: Email, Teléfono, Web, Dirección, Skype
- **Redes sociales**: LinkedIn, Twitter, Instagram, Facebook

**Personalización avanzada:**
- **Estilo de iconos**: Emoji, Texto o Ninguno
- **Campos visibles**: Control granular (8 campos) con selección múltiple
- **Tamaños**: Foto y logo ajustables con sliders
- **Colores**: Fondo, texto, links, color de acento
- **Bordes**: Estilo y esquinas redondeadas ajustables
- **Vista previa**: Desktop y Móvil en tiempo real
- **Exportación**: PNG, JPG o HTML listo para usar
- **Gestión**: Guardar/Cargar múltiples firmas

### 💧 Marca de Agua
Aplica marcas de agua profesionales:
- **Texto personalizado**: Añade texto con estilo configurable
- **Imagen/Logo**: Usa una imagen como marca de agua
- **Posición**: 9 posiciones predefinidas + posición libre
- **Opacidad**: Control deslizable de transparencia
- **Tamaño**: Ajuste fino del tamaño de la marca
- **Ángulo**: Rotación libre (diagonal, horizontal, etc.)
- **Aplicar a**: Todas las páginas o selección específica

### 🔍 Anotaciones PDF
Añade comentarios y marcas a tus documentos:
- **Resaltado**: Resalta texto con colores (amarillo, verde, azul, rosa)
- **Subrayado**: Subraya palabras o frases importantes
- **Notas**: Agrega notas adhesivas con comentarios
- **Navegación**: Salta entre anotaciones fácilmente
- **Exportar**: Guarda el PDF con anotaciones integradas

### 🖤 Redactar
Oculta permanentemente información sensible:
- **Selección de área**: Dibuja rectángulos sobre el contenido a ocultar
- **Razón de redacción**: Añade descripción del área removida
- **Aplicación permanente**: El texto subyacente se elimina completamente
- **Vista previa**: Previsualiza antes de aplicar

### 📋 Formularios PDF
Gestiona formularios interactivos:
- **Rellenar formularios**: Completa campos de formulario existentes
- **Crear campos**: Añade nuevos campos de entrada
- **Tipos de campo**: Texto, checkboxes, radio buttons, listas desplegables
- **Validación**: Verifica datos antes de guardar

### 🔐 Firma Digital
Protege documentos con certificados digitales:
- **Cargar certificado**: Importa archivos P12/PFX con clave
- **Información del certificado**: Muestra detalles del certificado
- **Firmar PDF**: Aplica firma digital con marca de tiempo
- **Niveles de firma**: Básico, Avanzado, Calificado

### 🔎 Comparar PDFs
Compara dos documentos visualmente:
- **Vista lateral**: Compara páginas una al lado de otra
- **Vista superpuesta**: Overlay de diferencias
- **Informe de diferencias**: Resumen por página
- **Similitud**: Porcentaje de coincidencia entre documentos

### 📰 OCR (Reconocimiento de Texto)
Extrae texto de imágenes escaneadas:
- **Procesamiento**: Convierte imágenes en texto editable
- **Confianza**: Muestra nivel de precisión por página
- **Exportar**: Guarda texto extraído en archivo

### 🖼️ Extraer Imágenes
Recupera todas las imágenes de un PDF:
- **Exportar imágenes**: Guarda cada imagen como archivo separado
- **Calidad original**: Mantiene la resolución de las imágenes
- **Explorador de imágenes**: Vista previa de todas las imágenes

### 🔄 Conversor de Documentos
Convierte documentos entre múltiples formatos:
- **PDF → DOCX**: Convierte PDF a documento Word editable
- **PDF → XLSX**: Extrae tablas de PDF a Excel manteniendo estructura
- **PDF → HTML**: Convierte contenido PDF a páginas web
- **PDF → TXT**: Extrae texto plano preservando saltos de línea
- **DOCX → PDF**: Genera PDF desde documentos Word
- **Interfaz drag & drop**: Carga rápida de archivos
- **Procesamiento por lotes**: Convierte múltiples archivos

### 📦 Procesamiento por Lotes
Opera sobre múltiples PDFs a la vez:
- **Comprimir**: Reduce el tamaño de múltiples archivos
- **Aplicar marca de agua**: Marca de agua en varios PDFs
- **Encryption**: Encripta múltiples documentos
- **Renombrar**: Nombra archivos según patrones

### 📑 Metadatos
Edita información del documento:
- **Título, Autor, Asunto**: Metadatos básicos
- **Palabras clave**: Para búsqueda
- **Productor/Creador**: Información de software
- **Fechas**: Fecha de creación y modificación

### 📐 Cumplimiento PDF/A
Prepara documentos para archivado:
- **Validar**: Verifica cumplimiento de estándar PDF/A
- **Convertir**: Transforma a formato PDF/A-1b o PDF/A-2b
- **Informe**: Muestra estado de cumplimiento

### 🖥️ Herramientas PDF
Conjunto de utilidades esenciales:
- **Fusionar PDFs**: Combina múltiples archivos
- **Dividir PDF**: Extrae páginas específicas
- **Rotar páginas**: Rotación visual
- **Comprimir**: Optimiza tamaño de archivo
- **Extraer páginas**: Guarda páginas seleccionadas

---

## 🖼️ Capturas de Pantalla

*(Próximamente)*

---

## 🚀 Requisitos Previos

### Para desarrollo web (Vite)
- **Node.js** 18.x o superior
- **npm** 9.x o superior (o pnpm/yarn)

### Para aplicación de escritorio (Tauri)
- **Node.js** 18.x o superior
- **Rust** 1.70 o superior con **Rustup**
- **macOS:** Xcode Command Line Tools (`xcode-select --install`)
- **Windows:** Visual Studio Build Tools 2022+ con C++ desktop development
- **Linux:** `libwebkit2gtk-4.1-dev`, `libssl-dev`, `build-essential`

### Verificar instalación
```bash
node --version
npm --version
rustc --version
cargo --version
```

---

## 📦 Instalación

### 1. Clonar el repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd PDF-Toolkit
```

### 2. Instalar dependencias de Node.js
```bash
npm install
```

### 3. Configurar Tauri (solo para app de escritorio)
Editar `src-tauri/tauri.conf.json`:
```json
{
  "productName": "PDF Toolkit",
  "identifier": "com.tu-dominio.pdf-toolkit",
  "bundle": {
    "active": true,
    "targets": "all",
    "macOS": {
      "frameworks": [],
      "identifier": "com.tu-dominio.pdf-toolkit"
    }
  }
}
```

> **Nota:** El `identifier` debe ser un dominio inverso único.

---

## 💻 Desarrollo

### Ejecutar en modo desarrollo (Web)
```bash
npm run dev
```
Inicia el servidor de Vite en `http://localhost:5173` con recarga en caliente.

### Ejecutar en modo desarrollo (Tauri)
```bash
npm run tauri dev
```
Abre la aplicación de escritorio Tauri con recarga en caliente y herramientas de desarrollo.

---

## 🏗️ Construcción

### Construir para web (archivos estáticos)
```bash
npm run build
```
Output en `dist/`. Desplegable en Vercel, Netlify, GitHub Pages, etc.

### Construir aplicación de escritorio
```bash
npm run tauri build
```
Genera ejecutables en `src-tauri/target/release/bundle/`:
- **macOS:** `.app` y `.dmg`
- **Windows:** `.exe` (NSIS installer)
- **Linux:** `.deb`, `.AppImage`

### Para macOS específicamente:
```bash
cd /Users/adrian/Desktop/5-5-2026/PDF-Toolkit
npx tauri build --bundles dmg
# El ejecutable estará en:
# src-tauri/target/release/bundle/dmg/PDF Toolkit_0.1.0_aarch64.dmg
```

---

## 📁 Estructura del Proyecto

```
PDF-Toolkit/
├── src/
│   ├── components/           # Componentes reutilizables
│   │   ├── FileDropzone.tsx  # Zona de arrastrar y soltar
│   │   ├── PdfGrid.tsx       # Grid de páginas PDF
│   │   ├── Toolbar.tsx       # Barra de herramientas
│   │   └── ErrorBoundary.tsx # Manejo de errores
│   ├── modules/              # Módulos de la aplicación
│   │   ├── dashboard/        # Dashboard principal
│   │   │   └── DashboardPage.tsx
│   │   ├── converter/        # Conversor de documentos
│   │   │   └── ConverterPage.tsx
│   │   ├── html-to-image/    # Creador de firmas de correo
│   │   │   ├── HtmlToImagePage.tsx
│   │   │   └── signatureTemplates.tsx (20 plantillas)
│   │   ├── pdf-editor/       # Editor de PDF (fusión/reordenamiento)
│   │   │   ├── PdfEditorPage.tsx
│   │   │   ├── SignatureModal.tsx
│   │   │   └── SearchBar.tsx
│   │   ├── asset-positioner/  # Posicionador de firmas/sellos
│   │   │   └── AssetPositionerPage.tsx
│   │   ├── pdf-tools/        # Herramientas PDF
│   │   │   └── PdfToolsPage.tsx
│   │   ├── signatures/       # Gestión de firmas
│   │   │   └── SignaturesPage.tsx
│   │   ├── stamps/          # Gestión de sellos
│   │   │   └── StampsPage.tsx
│   │   ├── watermark/       # Marca de agua
│   │   │   └── WatermarkPage.tsx
│   │   ├── annotations/     # Anotaciones PDF
│   │   │   └── AnnotationsPage.tsx
│   │   ├── redact/          # Redactar información sensible
│   │   │   └── RedactPage.tsx
│   │   ├── forms/           # Formularios PDF
│   │   │   └── PdfFormsPage.tsx
│   │   ├── digital-signature/ # Firma digital con certificados
│   │   │   └── DigitalSignaturePage.tsx
│   │   ├── compare/          # Comparar PDFs
│   │   │   └── PdfComparePage.tsx
│   │   ├── ocr/             # OCR - Reconocimiento de texto
│   │   │   └── OcrPage.tsx
│   │   ├── image-extractor/ # Extraer imágenes
│   │   │   └── ImageExtractorPage.tsx
│   │   ├── batch/           # Procesamiento por lotes
│   │   │   └── BatchProcessingPage.tsx
│   │   ├── metadata/        # Editor de metadatos
│   │   │   └── MetadataEditorPage.tsx
│   │   ├── compliance/      # Cumplimiento PDF/A
│   │   │   └── PdfACompliancePage.tsx
│   │   └── templates/        # Generador de documentos
│   │       └── TemplatesPage.tsx
│   ├── stores/
│   │   └── appStore.ts       # Estado global (Zustand)
│   ├── types/
│   │   └── index.ts          # Tipos compartidos TypeScript
│   ├── utils/
│   │   └── pdfjs.ts          # Utilidades PDF.js
│   ├── App.tsx              # Componente principal
│   └── main.tsx             # Punto de entrada
├── src-tauri/               # Código Rust (Tauri)
│   ├── src/
│   │   ├── lib.rs           # Comandos Tauri
│   │   ├── main.rs          # Entry point
│   │   └── commands/        # Comandos organizados
│   │       ├── pdf_tools.rs  # Operaciones PDF en Rust
│   │       └── converter.rs  # Conversor
│   ├── Cargo.toml           # Dependencias Rust
│   ├── tauri.conf.json      # Configuración Tauri
│   └── icons/               # Iconos de la aplicación
├── public/                  # Archivos estáticos
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
4. Agregar el tipo en `src/types/index.ts`

---

## 🛠️ Tecnologías

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 19 | Biblioteca de UI con hooks y componentes funcionales |
| **TypeScript** | 6 | Tipado estático para mayor seguridad y autocompletado |
| **Vite** | 5 | Bundler ultrarrápido con HMR (Hot Module Replacement) |
| **Ant Design** | 6 | Biblioteca de componentes UI profesional |
| **Zustand** | 5 | Gestión de estado global minimalista y performante |
| **React Dropzone** | 15 | Zona de arrastrar y soltar archivos |
| **html-to-image** | Latest | Exportar componentes React como imágenes (PNG/JPG) |
| **pdf-lib** | Latest | Manipulación avanzada de PDFs (firmas, sellos, edición) |
| **pdfjs-dist** | 4 (Legacy) | Renderizado de PDFs en canvas (vista previa) |
| **mammoth** | Latest | Conversión DOCX a HTML manteniendo formato |
| **xlsx** | Latest | Lectura y escritura de archivos Excel |
| **jspdf** | Latest | Generación de PDFs desde cero |
| **DOMPurify** | Latest | Sanitización de HTML para prevenir XSS |
| **@dnd-kit** | Latest | Drag and drop accesible y personalizable |

### Backend / Escritorio
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Tauri** | 2 | Framework de escritorio ligero (Rust + WebView) |
| **Rust** | 1.70+ | Lenguaje seguro y de alto rendimiento para backend |
| **lopdf** | Latest | Biblioteca Rust para manipulación de PDFs |
| **LibreOffice** | 7+ | Motor de conversión de documentos (vía Tauri) |

### Herramientas de desarrollo
- **ESLint**: Linting de código JavaScript/TypeScript
- **Prettier**: Formateo de código (opcional)
- **TypeScript Compiler**: Verificación de tipos (`tsc --noEmit`)

---

## 🔒 Seguridad

- **Sanitización XSS**: Uso de `DOMPurify` en renderizado de HTML
- **Error Boundaries**: Manejo graceful de errores en React
- **Context Isolation**: Tauri aísla el backend Rust del frontend
- **Validación de entrada**: Verificación de tipos con TypeScript

---

## 🌍 Plataformas Soportadas

| Plataforma | Versión mínima | Arquitectura |
|------------|----------------|--------------|
| **macOS** | 10.14+ (Mojave) | x64, ARM64 (Apple Silicon) |
| **Windows** | 7+ | x64 |
| **Linux** | Ubuntu 18.04+, Debian 10+ | x64 |

---

## 📝 Licencia

Distribuido bajo la **MIT License**. Ver archivo `LICENSE` para más detalles.

---

## 🤝 Contribuir

1. Haz un fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcion`)
3. Haz commit de tus cambios (`git commit -m 'Añadir nueva función'`)
4. Push a la rama (`git push origin feature/nueva-funcion`)
5. Abre un Pull Request

### Estándares de código
- Seguir las reglas de ESLint y TypeScript
- Usar componentes funcionales de React con hooks
- Mantener español para UI y comentarios
- Documentar funciones complejas

---

## 🐛 Soporte

Si encuentras algún problema o tienes sugerencias:
- Abre un issue en el repositorio
- Describe el paso a paso para reproducir el error
- Adjunta capturas de pantalla si es posible

---

## 🎯 Roadmap

### Completados ✅
- [x] Dashboard con acceso rápido
- [x] Conversor de documentos
- [x] Editor de PDF con firmas y sellos
- [x] Posicionador de firmas/sellos (asset-positioner)
- [x] Creador de firmas de correo (20 plantillas)
- [x] Herramientas PDF (fusionar, dividir, rotar)
- [x] Marca de agua personalizable
- [x] Gestión de firmas y sellos
- [x] Anotaciones PDF (resaltado, subrayado, notas)
- [x] Redactar información sensible
- [x] Formularios PDF interactivos
- [x] Firma digital con certificados
- [x] Comparación de PDFs
- [x] OCR (Reconocimiento de caracteres)
- [x] Extraer imágenes de PDF
- [x] Procesamiento por lotes
- [x] Editor de metadatos
- [x] Cumplimiento PDF/A

### Pendientes 🔄
- [ ] Mejoras adicionales de UI/UX

---

**Desarrollado con ❤️ usando Rust y React**