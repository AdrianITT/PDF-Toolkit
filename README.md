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

---

## ✨ Características Principales

### 🔄 Conversor de Documentos
Convierte documentos entre múltiples formatos con motor **LibreOffice**:
- **PDF → DOCX**: Convierte PDF a documento Word editable
- **PDF → XLSX**: Extrae tablas de PDF a Excel manteniendo estructura
- **PDF → HTML**: Convierte contenido PDF a páginas web
- **PDF → TXT**: Extrae texto plano preservando saltos de línea
- **DOCX → PDF**: Genera PDF desde documentos Word
- Interfaz drag & drop para carga rápida

### 📝 Editor de PDF Avanzado
Herramientas completas de edición con **pdf-lib** y **PDF.js**:
- **Firmas digitales**: Dibuja, sube o selecciona firmas guardadas
- **Sellos personalizados**: Aprobado, Revisado, Urgente, Borrador, Confirmado
- **Posicionamiento libre**: Arrastra y redimensiona elementos en el canvas
- **Múltiples páginas**: Navega, agrega firmas en cualquier página
- **Exportación**: Guarda el documento editado preservando calidad
- **Vista previa en tiempo real**: Renderizado fiel con PDF.js

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

### 🔧 Herramientas PDF
Conjunto de utilidades esenciales con backend en **Rust**:
- **Fusionar PDFs**: Combina múltiples archivos en uno solo
- **Dividir PDF**: Extrae páginas específicas o rangos personalizados
- **Rotar páginas**: Rota una o varias páginas (90°, 180°, 270°)
- **Reordenar páginas**: Drag & drop para reorganizar visualmente
- **Eliminar páginas**: Quita páginas no deseadas del documento
- **Comprimir PDF**: Reduce el tamaño optimizando imágenes

### 💧 Marca de Agua
Aplica marcas de agua profesionales:
- **Texto personalizado**: Añade texto con estilo configurable
- **Imagen/Logo**: Usa una imagen como marca de agua
- **Posición**: 9 posiciones predefinidas + posición libre
- **Opacidad**: Control deslizable de transparencia
- **Tamaño**: Ajuste fino del tamaño de la marca
- **Ángulo**: Rotación libre (diagonal, horizontal, etc.)
- **Aplicar a**: Todas las páginas o selección específica

### 🔍 Búsqueda en PDF (En desarrollo)
- Búsqueda de texto en documentos cargados
- Navegación entre coincidencias
- Resaltado visual de resultados
- Contador de coincidencias

---

## 🖼️ Capturas de Pantalla

*(Próximamente — Se agregarán capturas de los módulos: Editor, Conversor, Firmas, Herramientas y Marca de Agua)*

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

### Construir solo el ejecutable (sin instalador)
```bash
npm run tauri:build:app
```

### Para macOS específicamente:
```bash
cd /Users/adrian/Desktop/5-5-2026/PDF-Toolkit
npm run tauri build
# El ejecutable estará en:
# src-tauri/target/release/bundle/macos/PDF-Toolkit.app
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
│   │   ├── converter/        # Conversor de documentos
│   │   │   └── ConverterPage.tsx
│   │   ├── html-to-image/    # Creador de firmas
│   │   │   ├── HtmlToImagePage.tsx
│   │   │   └── signatureTemplates.tsx (20 plantillas)
│   │   ├── pdf-editor/       # Editor de PDF
│   │   │   └── PdfEditorPage.tsx
│   │   ├── pdf-tools/        # Herramientas PDF
│   │   │   └── PdfToolsPage.tsx
│   │   ├── signatures/       # Gestión de firmas
│   │   │   └── SignaturesPage.tsx
│   │   ├── stamps/           # Gestión de sellos
│   │   │   └── StampsPage.tsx
│   │   └── watermark/        # Marca de agua
│   │       └── WatermarkPage.tsx
│   ├── stores/
│   │   └── appStore.ts       # Estado global (Zustand)
│   ├── types/
│   │   └── index.ts          # Tipos compartidos TypeScript
│   ├── App.tsx               # Componente principal
│   └── main.tsx              # Punto de entrada
├── src-tauri/                # Código Rust (Tauri)
│   ├── src/
│   │   ├── lib.rs            # Comandos Tauri
│   │   ├── commands/         # Comandos organizados
│   │   │   ├── pdf_tools.rs  # Operaciones PDF en Rust
│   │   │   └── ...
│   │   └── ...
│   ├── Cargo.toml           # Dependencias Rust
│   ├── tauri.conf.json      # Configuración Tauri
│   └── icons/               # Iconos de la aplicación
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
4. Agregar el tipo en `src/types/index.ts`

---

## 🛠️ Tecnologías

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 19 | Biblioteca de UI con hooks y componentes funcionales |
| **TypeScript** | 6 | Tipado estático para mayor seguridad y autocompletado |
| **Vite** | 5 | Bundler ultrarrápido con HMR (Hot Module Replacement) |
| **Ant Design** | 6 | Biblioteca de componentes UI profesional (Space, Card, Button, etc.) |
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

- [x] Conversor de documentos
- [x] Editor de PDF con firmas y sellos
- [x] Creador de firmas de correo (20 plantillas)
- [x] Herramientas PDF (fusionar, dividir, rotar)
- [x] Marca de agua personalizable
- [x] Gestión de firmas y sellos
- [ ] Búsqueda en PDF (en progreso)
- [ ] Anotaciones PDF (notas, resaltado)
- [ ] Comparación de PDFs
- [ ] Formularios PDF interactivos
- [ ] OCR (Reconocimiento de caracteres)
- [ ] Firma digital con certificados

---

**Desarrollado con ❤️ usando Rust y React**
