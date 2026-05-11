# Plan de Deuda Técnica - PDF-Toolkit

## Resumen Ejecutivo

| Categoría | Cantidad | Prioridad | Impacto |
|-----------|----------|-----------|---------|
| React hooks | ~25 | Alta | Rendimiento |
| `any` types | ~30 | Media | Mantenibilidad |
| Unused vars | ~15 | Baja | Limpieza |
| Patrones | ~10 | Media | Estabilidad |

---

## 1. Errores de React Hooks (25 errores)

### Problema: `setState` dentro de useEffect
**Impacto:** Rendering en cascada, posible degradación de rendimiento

**Archivos afectados:**
- `src/modules/pdf-editor/PdfEditorPage.tsx`
- `src/modules/asset-positioner/AssetPositionerPage.tsx`
- `src/modules/signatures/SignaturesPage.tsx`
- `src/modules/stamps/StampsPage.tsx`
- `src/modules/html-to-image/HtmlToImagePage.tsx`

**Solución:** Mover la lógica a callbacks o usar `useMemo`/`useCallback`

```typescript
// ❌ Antes
useEffect(() => {
  loadPdfCallback(); // Llama setState dentro
}, [pdfFiles]);

// ✅ Después
useEffect(() => {
  if (pdfFiles[0]?.data) {
    // Usar ref para evitar re-renders
  }
}, [pdfFiles]);
```

### Problema: Acceder refs durante render
**Impacto:** Comportamiento inesperado en re-renders

```typescript
// ❌ Antes
}, [canvasRef.current, currentPage, pdfDoc]);

// ✅ Después
}, [currentPage, pdfDoc]); // No incluir refs
```

---

## 2. Tipos `any` (30 errores)

### Problema: Falta de tipado específico
**Impacto:** Menos autocompletado, posibles errores en tiempo de ejecución

**Archivos principales:**
- `src/modules/converter/ConverterPage.tsx`
- `src/modules/forms/PdfFormsPage.tsx`
- `src/modules/watermark/WatermarkPage.tsx`
- `src/utils/pdfjs.ts`
- `src/services/pdf.service.ts`

**Solución:** Definir interfaces específicas

```typescript
// ❌ Antes
const drawText = (page: any, text: string, options: any) => {};

// ✅ Después
interface PDFPage {
  drawText: (text: string, options: DrawOptions) => void;
}

interface DrawOptions {
  x: number;
  y: number;
  size: number;
  font: PDFFont;
  color: RGB;
}

const drawText = (page: PDFPage, text: string, options: DrawOptions) => {};
```

---

## 3. Variables No Utilizadas (15 errores)

### Solución rápida
```typescript
// ❌ Antes
} catch (err) {
  console.error(err);
}

// ✅ Después
} catch {
  console.error('Error occurred');
}
```

### Archivos con mayor cantidad:
- `src/modules/converter/ConverterPage.tsx` - 3 errores
- `src/modules/forms/PdfFormsPage.tsx` - 2 errores
- `src/modules/compliance/PdfACompliancePage.tsx` - 2 errores

---

## 4. Patrones de Código (10 errores)

### Hoisting de funciones
```typescript
// ❌ Antes
useEffect(() => {
  handleApplyToPdf(); // Declarada después
}, []);

const handleApplyToPdf = async () => {};

// ✅ Después - Mover la función antes del useEffect
const handleApplyToPdf = async () => {};

useEffect(() => {
  handleApplyToPdf();
}, []);
```

### Empty catch blocks
```typescript
// ❌ Antes
} catch {}
// o
} catch (err) {}

// ✅ Después
} catch {
  // Log del error o acción específica
}
```

---

## Plan de Ejecución

### Fase 1: Críticos (1-2 horas)
- [ ] Corregir `setState` en efectos (5 archivos)
- [ ] Corregir acceso a refs durante render (3 archivos)
- [ ] Eliminar variables no utilizadas (5 archivos)

### Fase 2: Mejoras (2-3 horas)
- [ ] Reemplazar `any` con tipos específicos (10 archivos)
- [ ] Agregar `cause` a errores lanzados
- [ ] Corregir regex de control characters

### Fase 3: Limpieza (1 hora)
- [ ] Agregar JSDoc a funciones complejas
- [ ] Verificar que no se rompan tests
- [ ] Build final y deploy

---

## Scripts de Verificación

```bash
# Verificar tests
npm test

# Verificar lint
npm run lint

# Verificar build
npm run build

# Verificar tipos
npx tsc --noEmit
```

---

## Métricas Objetivo

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| ESLint errors | ~80 | < 20 |
| Test coverage | 90% | Mantener |
| Build time | ~30s | < 45s |

---

## Notas

- Los errores de ESLint NO bloquean el build ni la funcionalidad
- La aplicación funciona correctamente en producción
- La deuda técnica afecta principalmente el mantenimiento futuro
- Se recomienda abordar en sprints de 2 semanas si hay tiempo

---

*Creado: Mayo 2026*
*Última actualización: Mayo 2026*