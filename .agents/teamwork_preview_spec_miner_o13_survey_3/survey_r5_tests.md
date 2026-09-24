# Survey Report: R5 Developer Documentation & Test/Build Infrastructure

**Agent**: `teamwork_preview_spec_miner_o13_survey_3`  
**Workspace**: `C:\Users\usuariodgc\Documents\Ressume`  
**Date**: 2026-09-11  
**Mission**: Comprehensive Phase 0 survey of R5 specifications (4 developer guides for `/docs`) and Test/Build Infrastructure analysis (Vitest suite and Vite production build).

---

## Executive Summary

1. **R5 Documentation Status**:
   - The directory `/docs/` currently contains 8 files (`AI_PROMPTS_AND_REPRESENTATION_GUIDE.md`, `BACKLOG.md`, `DEVELOPMENT_MANUAL.md`, `TECHNICAL_DOCUMENTATION.md`, `USER_MANUAL.md`, `analisis-fallos-paginacion-ats.md`, `audit-report.md`, `code-review.md`).
   - **None** of the 4 target developer guides requested for R5 exist yet:
     - `docs/arquitectura.md` (Missing)
     - `docs/guia-extensibilidad-secciones.md` (Missing)
     - `docs/diseno-invariantes.md` (Missing)
     - `docs/motor-impresion-pdf.md` (Missing)
   - Existing documents (`TECHNICAL_DOCUMENTATION.md` and `DEVELOPMENT_MANUAL.md`) contain outdated legacy references (e.g., advising contributors to use a `switch(type)` in `App.jsx` rather than `sectionRegistry.js`).
   - Complete technical specifications and section-by-section outlines have been synthesized below from the authoritative codebase.

2. **Test & Build Infrastructure Status**:
   - **Vite Production Build (`npm run build`)**: Pass with **0 errors and 0 warnings**. Generates 1,933 transformed modules into `dist/assets/index-BwqPq-AZ.css` (31.24 kB) and `dist/assets/index-aodjUnPG.js` (733.74 kB).
   - **Vitest Test Suite (`npm test`)**: 40 test files containing **667 tests passing (100% pass rate)** in 48.98s.
   - Two minor test environment warnings/logs were identified:
     - `Error: Not implemented: window.focus` emitted to stderr during clean print iframe tests in JSDOM (can be silenced with `window.focus = vi.fn()` in `src/tests/setup.js`).
     - `Warning: An update to VersionManagerModal inside a test was not wrapped in act(...)` in `src/tests/version-manager-hub.test.jsx`.
   - Critical Gap for R3: Boxicons classes (`bx bx-*`) are still present in 20 source files and several test files. Currently `src/tests/iconography.test.jsx` only tests `SuggestionTooltip` callouts; a complete test suite verifying zero `bx-` elements across the whole DOM is required for R3.

---

## Part 1: Specifications and Outlines for the 4 Developer Guides (/docs)

### Guide 1: `docs/arquitectura.md`
**Title**: Arquitectura del Editor, Flujo de Datos Unidireccional y Motor de Paginación  
**Purpose**: Authoritative reference describing how the editor functions, how data flows through React state into `localStorage`, and how the continuous DOM canvas simulates physical A4 sheets without page-break ruptures.

#### Complete Outline & Technical Specification
1. **Visión General y Enfoque Arquitectónico**
   - Single Page Application (SPA) construida sobre React 18 y Vite 5.
   - Enfoque 100% Client-Side: Cero dependencia de microservicios o backends de renderizado para exportación.
   - Dualidad de Renderizado:
     - **Editor WYSIWYG interactivo (`#area-cv`)**: Renderiza un único canvas continuo en el DOM con guías visuales de corte (`.a4-page-fold-guide`).
     - **Motor de Impresión Limpia (`staticHtmlPdfEngine.js`)**: Renderiza un iframe aislado fuera de pantalla (`top: -10000px`) gobernado por `@page { size: A4; margin: 0; }` y reglas `@media print`.
2. **Jerarquía de Componentes y Árbol de Renderizado**
   - Punto de entrada: `main.jsx` -> `App.jsx` envuelto en `CVProvider` (`CVContext.jsx`).
   - Barra de herramientas y controles flotantes:
     - `ActionMenu.jsx`: Barra flotante categorizada (Diseño & Tipografía, Espaciado, Exportación, Idiomas).
     - `LayoutModeToggle.jsx`: Conmutador entre modo tradicional (2-columnas) y modo ATS (1-columna).
     - `AddSectionModal.jsx`: Modal no modal flotante a la derecha de `#area-cv`.
     - `VersionManagerModal.jsx`: Gestor de instantáneas de versiones respaldadas en IndexedDB (`versionStorage.js`).
     - `TranslationModal.jsx` y `AIExportModal.jsx`.
   - Contenedor del documento (`#area-cv`):
     - `DroppableColumn` (`left` y `right` en 2-col, o `singleCol` en ATS).
     - `SortableContext` de `@dnd-kit/sortable` para ordenamiento vertical.
     - `BaseSection.jsx` (`EditableBaseSection` en editor, `PrintBaseSection` en impresión).
     - `BaseItem.jsx` (`EditableBaseItem` en editor, `PrintBaseItem` en impresión).
     - `SortableBulletItem.jsx`: Componente compartido y deduplicado para viñetas anidadas.
     - `SpacerBlock.jsx` / `IntegratedBottomSpacer`: Manejo de espaciadores de compensación.
3. **Flujo de Datos Unidireccional y Estado Global**
   - Patrón Facade en `src/context/CVContext.jsx`: Componente proveedor de ≤126 líneas que unifica 4 hooks de dominio:
     - `useCVData.js`: Mutaciones inmutables de perfil, secciones, ítems, viñetas y paquetes de idiomas (`locales/`). Persistencia reactiva a `localStorage` (`key = cvData`).
     - `useCVHistory.js`: Pila de deshacer/rehacer inmutable (`undo`, `redo`, `canUndo`, `canRedo`).
     - `useCVLayout.js`: Modos de diseño (2-col vs ATS 1-col), anchos de columna, variables de espaciado (`--page-padding`, `--section-gap`, `--item-gap`), tipografía (`--font-scale`, `--line-height`), y estado de tooltips y toolbars flotantes.
     - `useCVExport.js`: Triggers de exportación nítida (`exportCleanPDF`), exportación JSON y notificaciones toast (`ToastNotification.jsx`).
   - Esquema Canónico (`src/utils/schema.js`): Estructura del objeto `cvData` (`layout`, `profile`, `sections`).
4. **Motor de Paginación en Tiempo Real (`recalculatePagination`)**
   - Constantes físicas a 96 DPI:
     - Altura de página A4: `A4_PAGE_HEIGHT_PX = 1123px` (`297mm`).
     - Límite máximo de 2 páginas: `MAX_A4_2PAGE_HEIGHT_PX = 2246px`.
     - Ancho estándar A4: `794px` (`210mm`).
     - Invariante crítico del separador visual: `gapPx = 20` (`.a4-page-fold-guide`). Este gap existe **únicamente** en el canvas del editor para ilustrar la separación de hojas y **nunca** debe inyectarse en el pipeline de impresión de PDF.
   - Algoritmo de Detección y Salto:
     - Selección de nodos fragmentables (`getBreakableComponents`).
     - Bucle multi-pase de hasta 6 iteraciones para estabilizar el reflujo tras aplicar márgenes.
     - Definición de zonas prohibidas (Forbidden Boundary Zones): `[foldTop - pagePadding .. foldBottom + pagePadding]`.
     - Detección de encabezados huérfanos (`isOrphanTitle`): Si un título `.section-title` queda a menos de 60px del corte o su primer ítem hijo es empujado a la siguiente página, el título se traslada preventivamente.
     - Inyección de atributos: `data-editor-break-forced="true"`, `data-editor-break-fold="${pageNum}"`, y `margin-top: ${effectiveMarginTop}px !important;`.
     - Sincronización de manijas de arrastre (`.drag-handle`) y botones de acción (`.section-action-buttons`).
5. **Arquitectura de Drag-and-Drop (@dnd-kit)**
   - Invariante arquitectónico de `AGENTS.md`: Exclusividad de `@dnd-kit` (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`). Prohibición absoluta de `swapy`.
   - Jerarquía de 2 niveles:
     - Nivel superior: Reordenamiento de secciones mayores entre columnas (`leftCol` <-> `rightCol` o lista continua ATS).
     - Nivel interno: Reordenamiento de ítems dentro de una sección o viñetas dentro de un ítem.
   - Polimorfismo entre columnas: `updateSectionColumn` y `adaptItemToSectionType` transforman la forma de los datos sin corromper el estado.

---

### Guide 2: `docs/guia-extensibilidad-secciones.md`
**Title**: Guía de Extensibilidad de Secciones e Ítems vía sectionRegistry.js  
**Purpose**: Step-by-step tutorial for open-source contributors and developers to add new section types or customize existing ones with zero modifications to core components.

#### Complete Outline & Technical Specification
1. **Filosofía del Patrón Registry / Factory / Strategy**
   - Principio Abierto/Cerrado (Open/Closed): Añadir una nueva sección o ítem requiere **únicamente** crear el componente de visualización del ítem y registrar un descriptor en `src/registry/sectionRegistry.js`.
   - Prohibición de condicionales `if (section.type === ...)` o `switch (sectionType)` en `BaseSection.jsx`, `BaseItem.jsx`, `CVContext.jsx` y `App.jsx`.
2. **Anatomía del `SectionDescriptor` (`@typedef {Object} SectionDescriptor`)**
   - Identidad y Metadatos:
     - `type`: Identificador único en minúsculas (ej: `'projects'`, `'certificates'`, `'languages'`).
     - `label`: Etiqueta en mayúsculas para la interfaz (ej: `'CERTIFICACIONES'`).
     - `defaultTitle`: Título inicial de la sección (ej: `'CERTIFICACIONES Y LICENCIAS'`).
     - `defaultColumn`: Columna asignada en layout de 2 columnas (`'left'` o `'right'`).
     - `icon`: Componente de icono Lucide (ej: `Award`, `GraduationCap`).
     - `description`: Descripción breve de la sección.
   - Control de Comportamiento e Interacciones:
     - `allowDelete`: `boolean` (permite borrar la sección completa).
     - `allowAddItem`: `boolean` (permite añadir nuevos ítems mediante botón `+`).
     - `allowDeleteItem`: `boolean` (permite borrar ítems individuales).
     - `hasTitle`: `boolean` (renderiza `<h2>` de título).
     - `hasItemDrag`: `boolean` (renderiza manija de arrastre por ítem).
     - `supportsBulletCustomization`: `boolean` (habilita popover de estilo de viñetas).
     - `isHeader` / `isSpacer` / `isListItem`: Flags de comportamiento especial.
   - Contenedores y Estilos (Template Pattern):
     - `sectionClass`: Clase CSS del `<section>` contenedor.
     - `wrapperClass`: Clase para el grid interno.
     - `containerTag`: Tag contenedor de la lista (`'div'`, `'ul'`, `'ol'`).
     - `containerClass`: Clases CSS del contenedor.
     - `itemTag`: Tag HTML de cada ítem (`'div'` o `'li'`).
     - `itemClass`: Clase CSS de cada ítem.
     - `itemStyle` / `printItemStyle`: Objetos de estilo inline.
     - `itemComponent`: Componente React responsable de renderizar el ítem.
     - `sectionComponent`: Componente opcional de reemplazo a nivel de sección completa (ej: `SpacerBlock`).
   - Estrategias de Fábrica y Serialización (Strategy Pattern):
     - `createDefaultItem`: Función generadora de ítems con IDs únicos (`generateUniqueId`).
     - `adaptItem`: Adaptador polimórfico para convertir ítems de otras secciones.
     - `renderMarkdown`, `renderXML`, `renderPlainText`: Funciones de exportación pura en `itemFormatters.js`.
3. **Tutorial Paso a Paso: Implementación de una Nueva Sección (`PortfolioItem`)**
   - Paso 1: Crear el componente del ítem en `src/components/CV/items/PortfolioItem.jsx`:
     - Uso de `InlineEdit` para títulos, descripciones y enlaces.
     - Manejo de props (`item`, `sectionId`, `onUpdateItem`, `isPrint`).
   - Paso 2: Definir serializadores en `src/registry/itemFormatters.js`:
     - Exportar `portfolioMarkdown`, `portfolioXML`, `portfolioPlainText`.
   - Paso 3: Registrar el descriptor en `src/registry/sectionRegistry.js`:
     - Importar `PortfolioItem` y los serializadores.
     - Llamar a `registerSectionType({ ... })`.
   - Paso 4: Verificación en `AddSectionModal.jsx`:
     - El nuevo tipo queda disponible automáticamente en el catálogo de secciones para el usuario.
   - Paso 5: Test Unitario de Extensibilidad:
     - Agregar assertions en `src/tests/registry.test.jsx` comprobando registro y polimorfismo.
4. **Buenas Prácticas y Componentes Reutilizables**
   - Uso obligatorio de `SortableBulletItem.jsx` para cualquier sección con listas de viñetas.
   - No romper el encapsulamiento: Usar `onUpdateItem` o `updateSectionItem` en lugar de manipular el estado global directamente.

---

### Guide 3: `docs/diseno-invariantes.md`
**Title**: Guía de Estilo, Invariantes Arquitectónicos, Accesibilidad y UI Standards  
**Purpose**: Living specification of visual design standards, Obsidian callout invariants, dynamic tooltip positioning math, typography scale tokens, and iconography guidelines.

#### Complete Outline & Technical Specification
1. **Reglas Inmutables de AGENTS.md**
   - Documentación exhaustiva de los 4 pilares obligatorios del proyecto:
     1. Obsidian Callouts: Paleta rgba estricta, borde izquierdo de 4px, iconos Lucide.
     2. Drag & Drop: Exclusividad de `@dnd-kit`, prohibición de `swapy`.
     3. Tooltips Dinámicos: Rastreo por `getBoundingClientRect()`, flip horizontal y clamp vertical.
     4. AI Suggestions: Base de conocimientos local en `src/ai-knowledge/` enfocada en Tech.
2. **Estándar Visual Obsidian Callouts**
   - Especificaciones cromáticas y estructurales exactas:
     - **Danger / Critical**:
       - Fondo: `rgba(233, 49, 71, 0.1)`
       - Borde izquierdo: `4px solid rgba(233, 49, 71, 1)`
       - Título: Color `rgba(233, 49, 71, 1)`, peso `600`, icono `OctagonAlert` (Lucide).
     - **Caution / Warning**:
       - Fondo: `rgba(219, 139, 0, 0.1)`
       - Borde izquierdo: `4px solid rgba(219, 139, 0, 1)`
       - Título: Color `rgba(219, 139, 0, 1)`, peso `600`, icono `TriangleAlert` (Lucide).
     - **Info**:
       - Fondo: `rgba(8, 109, 221, 0.1)`
       - Borde izquierdo: `4px solid rgba(8, 109, 221, 1)`
       - Título: Color `rgba(8, 109, 221, 1)`, peso `600`, icono `Info` (Lucide).
   - Estructura DOM requerida:
     - `.obsidian-callout` (contenedor)
     - `.callout-title` (`display: flex; gap: 8px; font-weight: 600; align-items: center;`)
     - `.callout-content` (`font-size: 0.82rem; line-height: 1.45;`)
   - Ocultamiento obligatorio en impresión (`.no-print`, `ARTIFACTS_BLACKLIST`).
3. **Algoritmo de Posicionamiento Dinámico de Tooltips (`SuggestionTooltip.jsx`)**
   - Entrada geométrica: `rect = targetElement.getBoundingClientRect()`.
   - Dimensiones fijas: `TOOLTIP_WIDTH = 300px`, altura estimada ~360px.
   - Posicionamiento Horizontal:
     - Adyacente: `left = Math.round(rect.right + 20)`.
     - Flip al aproximarse al borde del viewport: `if (left + TOOLTIP_WIDTH > window.innerWidth) left = Math.round(rect.left - 320)`.
     - Margen mínimo de seguridad: `if (left < 20) left = 20`.
   - Posicionamiento Vertical:
     - Anclado a elemento: `top = Math.round(rect.top)`.
     - Clamping para evitar desborde inferior: `if (top + 400 > window.innerHeight) top = window.innerHeight - 420`.
     - Margen mínimo superior: `if (top < 20) top = 20`.
4. **Sistema de Tokens de Diseño y Variables CSS (`src/index.css`)**
   - Colores y Temas:
     - `--title-color`, `--text-color`, `--text-color-light`, `--container-color`, `--container-color-alt`, `--body-color`, `--circle-color`.
   - Escala Tipográfica Dinámica:
     - `--font-scale` (0.85 a 1.25), `--title-scale`, `--body-scale`, `--list-scale`, `--line-height` (1.25 a 1.85).
     - Tipografías soportadas: Poppins, Inter, Roboto, Merriweather, JetBrains Mono.
   - Espaciado Dinámico:
     - `--page-padding` (24px por defecto), `--section-gap` (20px por defecto), `--item-gap` (8px por defecto).
5. **Estándar de Iconografía Homogénea (`lucide-react`)**
   - Eliminación total de BoxIcons (`bx bx-*`) y CDN externo en `index.html`.
   - Mapeo canónico a componentes SVG de Lucide:
     - Acciones CRUD: `Plus`, `Trash2`, `GripVertical`, `Edit3`.
     - Secciones: `Briefcase`, `GraduationCap`, `Code2`, `FolderGit2`, `Award`, `FileText`, `Languages`, `UserCheck`, `HeartHandshake`.
     - Contactos: `Mail`, `Phone`, `MapPin`, `Linkedin`, `Github`, `Globe`.
     - Menú y Modales: `Download`, `FileDown`, `Lightbulb`, `Sparkles`, `Palette`, `Settings`, `X`.
6. **Accesibilidad (a11y) y Atajos de Teclado**
   - Atajos en edición en línea: Ctrl+B (Negrita), Ctrl+I (Cursiva), Ctrl+Z (Deshacer), Ctrl+Shift+Z (Rehacer).
   - Atributos `aria-label`, `title`, y navegación por teclado en modales y selectores.

---

### Guide 4: `docs/motor-impresion-pdf.md`
**Title**: Motor de Impresión PDF Nítido, Pipeline de Renderizado Estático y Paridad Visual 1:1  
**Purpose**: Deep-dive technical documentation of `src/utils/staticHtmlPdfEngine.js` and `src/styles/print.css`, detailing how 100% selectable vector PDF output is achieved with zero interactive artifacts and zero-pixel layout drift.

#### Complete Outline & Technical Specification
1. **Principios del Motor de Impresión Nítido**
   - Cero Rasterización: Prohibición expresa de captura por canvas (`html2canvas`) para garantizar texto 100% vector, seleccionable, copiable y con enlaces nativos.
   - Aislamiento en Iframe: Creación de un `<iframe>` invisible (`top: -10000px`, ancho `794px`, alto `1123px`) que procesa el HTML limpio generado.
   - Límite Estricto de 2 Páginas A4: Enforce del límite de 2 hojas (`MAX_A4_2PAGE_HEIGHT_PX = 2246px`) con cálculo dinámico de factor de escala tipográfica (`calculatePrintScale`) si el contenido supera los límites.
2. **Pipeline de Generación de HTML Limpio (`generateCleanPrintHTML`)**
   - Paso 1: Purgado de Artefactos Interactivos (`ARTIFACTS_BLACKLIST`):
     - Supresión estricta de 26 selectores: `.drag-handle`, `.section-drag-handle`, `.item-drag-handle`, `.round-btn-del`, `.section-del-btn`, `.item-del-btn`, `.bullet-del-btn`, `.round-btn-add`, `.add-bullet-btn`, `.section-add-container`, `.column-add-section`, `.bullet-add-row`, `.section-action-buttons`, `.section-tips-toggle-btn`, `.section-bullet-style-btn`, `.section-bullet-style-popover`, `.suggestion-tooltip`, `.obsidian-callout`, `.column-resizer`, `.rich-text-toolbar`, `.action-menu`, `.action-menu-btn`, `.l-navbar`, `.a4-page-fold-guide`, `.spacer-resize-handle`.
     - Conversión de campos editables en texto semántico plano o enriquecido (`renderRichHTML`).
   - Paso 2: Renderizado Estático con Componentes Dedicados:
     - `PrintBaseSection` y `PrintBaseItem` consumen `sectionRegistry` usando `renderToStaticMarkup`.
   - Paso 3: Inyección de Estilos en 3 Bloques Secuenciales:
     1. `<style id="cv-base-styles">`: `src/index.css?raw` saneado sin selectores de edición.
     2. `<style id="cv-print-styles">`: `src/styles/print.css?raw` completo dentro de `@media print`.
     3. `<style id="cv-snapshot-breaks">`: Reglas CSS generadas por `snapshotBreaksCSS()` replicando los saltos calculados en el editor.
3. **Propagación de Variables CSS y Paridad Visual 1:1 (0px Drift)**
   - Transferencia de CSS Custom Properties:
     - En `executeCleanPrint`, se recorren todas las propiedades que inicien con `--` en el elemento `#area-cv` del editor y se inyectan en `doc.documentElement.style` del iframe.
   - Ancho Estándar A4 Fijo: `width: 794px !important; min-width: 794px !important; max-width: 794px !important; margin: 0 auto !important`.
   - Nivel de Zoom del Documento: Garantizado estrictamente en `1.0`.
   - Prevención de Doble Padding en Saltos de Página: Configuración de `box-decoration-break: slice !important;` en `.resume__left` y `.resume__right` para evitar los 48px de padding fantasma que producía `clone`.
4. **Arquitectura CSS de Impresión (`src/styles/print.css`)**
   - Única Fuente de la Verdad (SSOT): Todas las reglas de impresión residen dentro de `@media print { ... }`. Cero bloques `@media print` en `src/index.css`.
   - Prevención de Ruptura de Super-Contenedores:
     - `break-inside: avoid !important; page-break-inside: avoid !important;` en `.cv-section`, `.cv-block`, `.experience__content`, `.education__content`, etc.
   - Prevención de Encabezados Huérfanos:
     - `.section-title, h1, h2, h3 { break-after: avoid !important; page-break-after: avoid !important; }`.
     - Reglas de control de flujo: `p, h1, h2, h3 { orphans: 2; widows: 2; }`.
   - Salto Forzado de Página:
     - `.force-page-break-before, [data-editor-break-forced="true"] { break-before: page !important; margin-top: var(--page-padding, 24px) !important; }`.
5. **Ciclo de Vida de Ejecución (`executeCleanPrint`)**
   - Captura de instantánea del editor (`captureEditorSnapshot`).
   - Construcción del iframe invisible y escritura síncrona del HTML limpio.
   - Inyección del título dinámico y seguro del documento (`getDynamicPdfTitle`).
   - Transferencia de propiedades CSS activas.
   - Sincronización de fuentes web: `await Promise.race([doc.fonts.ready, timeout(1000)])`.
   - Activación de impresión nativa: `iframe.contentWindow.print()`.
   - Limpieza y desmontaje del iframe del DOM tras el evento `afterprint` o cierre del diálogo.

---

## Part 2: Test Suite & Build Infrastructure Investigation

### 1. Vite Production Build Analysis
- **Command**: `npm run build` (`vite build`)
- **Execution Result**: **Exit Code 0 (Success)**
- **Build Duration**: 4.66 seconds
- **Transformation Count**: 1,933 modules transformed
- **Output Artifacts**:
  - `dist/index.html`: 0.92 kB (gzip: 0.49 kB)
  - `dist/assets/index-BwqPq-AZ.css`: 31.24 kB (gzip: 6.22 kB)
  - `dist/assets/index-aodjUnPG.js`: 733.74 kB (gzip: 211.66 kB)
- **Compiler Warnings & Errors**: **0 warnings, 0 errors**. Chunk size limit is configured at 1600 kB in `vite.config.js`, comfortably accommodating the 733.74 kB bundle.

### 2. Vitest Test Runner Configuration
- **Configuration**: Defined inside `vite.config.js`:
  - `globals: true`
  - `environment: 'jsdom'`
  - `setupFiles: './src/tests/setup.js'`
  - `css: true`
  - `include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']`
- **Setup File (`src/tests/setup.js`)**:
  - Polyfills: `localStorage` mock, `window.matchMedia`, `ResizeObserver`, `IntersectionObserver`, `window.print`, `window.scrollTo`, `window.URL.createObjectURL`/`revokeObjectURL`.
  - DOM cleanup on `afterEach`.

### 3. Test Suite Inventory & Requirement Mapping
The test suite consists of **40 test files and 667 tests, all currently passing**.

| Test File | Tests | Primary Requirement | Scope & Verification Focus |
|---|---|---|---|
| `addButtonsAndResizerParity.test.jsx` | 14 | R4, R2 | Add buttons and resizer behavior and concealment in print |
| `adversarial-challenger.test.jsx` | 15 | R4, Invariants | Stress tests on boundary conditions, drag drop, Obsidian callouts |
| `adversarial-spacing-layout-extremes.test.jsx` | 16 | R4, R2 | Spacing extremes, negative/zero values, layout elasticity |
| `atsPrintModeFidelity.test.js` | 5 | R4 | 1-column ATS print fidelity, zero-split pagination, white background |
| `bulletPointsNativePrint.test.jsx` | 5 | R4 | Bullet points styling in print without list fracturing |
| `challenger-m2-1-rich-text-stress.test.jsx` | 19 | R2, R4 | Rich text toolbar, shortcuts (Ctrl+B/I/Z), formatting persistence |
| `challenger-m3-epic3-stress.test.jsx` | 10 | R2, R3 | ActionMenu reorganization, ATS toggle, modal positioning |
| `challenger-o10-dom-coordinates-stress.test.jsx` | 12 | R4 | Bounding box coordinates, fold detection, multi-pass stabilization |
| `challenger-print-engine-stress.test.jsx` | 14 | R4 | Lifecycle stress, memory leaks, multi-page document scaling |
| `challenger-stress-suite.test.jsx` | 24 | R1, R2, R4 | Comprehensive edge cases across all interactive editors and modals |
| `challengerCleanPrintLifecycle.test.jsx` | 12 | R4 | iframe creation, write, font readiness, print dialog, removal |
| `cleanPrintEngineVerification.test.jsx` | 22 | R4 | 4 Pillars of clean print, artifact purging, 3 style tag injection |
| `customTooltipTour.test.jsx` | 9 | R2 | Onboarding tour, step transitions, localStorage persistence |
| `cvContextDecomposition.test.jsx` | 6 | R2 | Verification of 4 decomposed hooks and `useCV()` facade contract |
| `dom-geometry-typography.test.jsx` | 101 | R4 | Typography scale tokens, DOM coordinates, container geometry |
| `dynamic-contacts.test.jsx` | 11 | R2, R3 | Dynamic contact items, addition/deletion, type picker *(uses Boxicons)* |
| `e2e-scenarios.test.jsx` | 5 | R1, R2, R4 | End-to-end user journeys: edit, drag, export, reload |
| `editorSnapshotBreakPropagation.test.jsx` | 7 | R4 | Propagation of forced editor breaks to print iframe snapshot |
| `educationRounderAlignment.test.jsx` | 3 | R4 | Education timeline bullets and alignment parity |
| `empirical-challenger-deep-audit.test.jsx` | 29 | R1, R4 | Deep empirical audit of typography, margins, callouts, and clean DOM |
| `epic2-rich-text-toolbar.test.jsx` | 17 | R2 | Rich text operations, text-alignment, inline editing delegation |
| `epic3-actionmenu-ats-modal.test.jsx` | 18 | R2, R3 | ActionMenu grouping, ATS toggle, right-floating AddSectionModal |
| `final-e2e-cross-cutting-challenger.test.jsx` | 8 | R2, R4 | Cross-cutting integration across drag, export, modal state, undo |
| `forbidden-page-boundary-zone.test.jsx` | 6 | R4 | Asserts no content penetrates fold boundary `[foldTop-pad .. foldBot+pad]` |
| `hyperlink-edit.test.jsx` | 6 | R2, R3 | Hyperlink editing popover and validation in projects/publications |
| `iconography.test.jsx` | 10 | R3 | Obsidian callout Lucide icons and zero unicode emoji verification |
| `liveHtmlSanitization.test.jsx` | 19 | R4 | XSS prevention, HTML escaping, sanitization in print and export |
| `pairwise-interactions.test.jsx` | 6 | R2, R4 | Mode switching, language packs, version loading, print triggers |
| `pdfFilenameParametrization.test.jsx` | 16 | R4 | Dynamic filename derivation from version/profile, OS sanitization |
| `pixelParityEditorPrint.test.jsx` | 16 | R4 | 0px discrepancy verification, 26 blacklisted artifacts, CSS vars |
| `polymorphic-dnd.test.jsx` | 10 | R2 | Cross-column dragging, item shape adaptation, schema integrity |
| `realtime-sticky-pagination.test.jsx` | 12 | R4 | Dynamic pagination recalculation upon editing, typing, deleting |
| `registry.test.jsx` | 10 | R2, R5 | Registry lookup, registration, fallback descriptors, default items |
| `spacer-component.test.jsx` | 37 | R2, R4 | SpacerBlock, IntegratedBottomSpacer, resizing handles, persistence |
| `spacing.test.jsx` | 11 | R2, R4 | Real-time spacing sliders, CSS variable bindings, localStorage sync |
| `staticHtmlPdfEngine.test.js` | 15 | R4 | Core engine unit tests: scale calculation, clean HTML, print |
| `test_inspect_juan_cv.test.jsx` | 4 | R4 | Inspection and simulation of recalculatePagination on Juan CV |
| `two-column-pdf-pagination-and-extension.test.jsx` | 10 | R4 | 2-column layout pagination, column height matching, page breaks |
| `version-manager-hub.test.jsx` | 40 | R1, R2 | Version hub modal, snapshot management, IndexedDB storage |
| `visual-polish-and-mirroring.test.jsx` | 19 | R4 | Visual fidelity, font selector, theme colors, CSS custom properties |

### 4. Identified Test Gaps & Required Test Updates

1. **R1: Saneamiento de Archivos Huérfanos y Módulos No Referenciados**
   - *Current Gap*: There is no automated test that traverses `src/` to verify that zero unreferenced or orphaned modules remain in the tree.
   - *Action Needed*: Add an automated test (or static check) ensuring all exported items and component files in `src/` are actively imported or registered in `sectionRegistry.js`.
2. **R2: Deduplicación y Refactorización**
   - *Current State*: `SortableBulletItem.jsx` was successfully extracted, and `CVContext.jsx` was decomposed into 4 hooks.
   - *Action Needed*: Any newly extracted coordinate or DOM manipulation helpers from `App.jsx` or `staticHtmlPdfEngine.js` must have dedicated unit test assertions.
3. **R3: Unificación Homogénea de Iconografía en `lucide-react`**
   - *Current Gap*: BoxIcons (`bx bx-*`) are present in 20 source files (`App.jsx`, `ActionMenu.jsx`, `BaseSection.jsx`, `BaseItem.jsx`, `DragHandle.jsx`, `ContactTypePicker.jsx`, all items in `src/components/CV/items/`). Furthermore, tests like `dynamic-contacts.test.jsx` explicitly assert `expect(item.querySelector('.bx')).toBeInTheDocument()`.
   - *Action Needed*:
     - Update existing tests that assert on `.bx` or `.bxs-*` classes to assert on Lucide SVG elements instead.
     - Expand `iconography.test.jsx` to assert that zero elements with `className` containing `bx ` or `bx-` exist anywhere in the rendered app DOM (`App.jsx`, `ActionMenu.jsx`, `BaseSection.jsx`, `BaseItem.jsx`, `ContactTypePicker.jsx`, `DragHandle.jsx`).
4. **R4: Paridad Visual 1:1 y Estabilidad de Paginación**
   - *Current State*: High coverage (101 tests in `dom-geometry-typography.test.jsx`, 16 in `pixelParityEditorPrint.test.jsx`, 6 in `forbidden-page-boundary-zone.test.jsx`).
   - *Action Needed*: Ensure `setup.js` includes `window.focus = vi.fn();` to eliminate the JSDOM stderr noise during print lifecycle runs.
5. **R5: Documentación en `/docs`**
   - *Current Gap*: No test currently asserts that the 4 developer guides exist in `/docs/`.
   - *Action Needed*: Add a lightweight verification test ensuring `docs/arquitectura.md`, `docs/guia-extensibilidad-secciones.md`, `docs/diseno-invariantes.md`, and `docs/motor-impresion-pdf.md` exist and are non-empty.

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | R5 Documentation | `docs/arquitectura.md` Spec | Outlines editor architecture, unidirectional data flow via decomposed hooks, and real-time pagination engine | Codebase architecture in `App.jsx`, `CVContext.jsx`, `schema.js` | Complete markdown developer guide specification | Outdated documentation in `TECHNICAL_DOCUMENTATION.md` | Codebase & `/docs` survey |
| 2 | R5 Documentation | `docs/guia-extensibilidad-secciones.md` Spec | Outlines step-by-step contributor tutorial for adding/modifying sections & items via `sectionRegistry.js` without touching core | `src/registry/sectionRegistry.js`, `itemFormatters.js`, `BaseSection.jsx`, `BaseItem.jsx` | Complete markdown extensibility guide specification | Contradicts outdated legacy advice in `DEVELOPMENT_MANUAL.md` | Codebase & `/docs` survey |
| 3 | R5 Documentation | `docs/diseno-invariantes.md` Spec | Outlines AGENTS.md invariants: Obsidian callouts, `@dnd-kit`, dynamic tooltip positioning, CSS tokens, and Lucide icon standard | `AGENTS.md`, `SuggestionTooltip.jsx`, `index.css`, `CustomTooltip.jsx` | Complete markdown design invariants guide specification | Preserves strict invariant requirements | Codebase & `AGENTS.md` |
| 4 | R5 Documentation | `docs/motor-impresion-pdf.md` Spec | Outlines static HTML generation pipeline, 26 blacklisted artifacts, iframe print lifecycle, CSS variable propagation, and 0px drift parity | `staticHtmlPdfEngine.js`, `src/styles/print.css`, `pixelParityEditorPrint.test.jsx` | Complete markdown print engine guide specification | Strict prevention of canvas rasterization | Codebase & print engine inspection |
| 5 | Build Infrastructure | Vite Production Build | Compiles full SPA client bundle for production | `vite.config.js`, `src/` modules | `dist/index.html`, `dist/assets/*.css`, `dist/assets/*.js` | Exits with code 0, 0 warnings, 0 errors | `npm run build` execution |
| 6 | Test Infrastructure | Vitest Test Suite | Runs automated unit, integration, and geometry verification tests | 40 test files in `src/tests/` | 667 passing tests | Exits with code 0, 0 failures; minor stderr from JSDOM `window.focus` | `npm test` execution |
| 7 | Iconography (R3) | Boxicons Dependency Residue | Class names `bx ` and `bx-*` linger across 20 component and test files despite Lucide migration requirement | Source files in `src/components/`, `src/registry/`, `index.html` | BoxIcons HTML font classes `<i className="bx ...">` | Violates R3 unfulfilled requirement | `grep_search` across `src/` |
| 8 | Pagination Engine | Fold Gap Invariant | `gapPx = 20` visual fold guide exists exclusively in editor canvas and must never penetrate print path | `App.jsx` line 116 | `.a4-page-fold-guide` | Explicit invariant to prevent page drift | `App.jsx` code inspection |
| 9 | UI Standards | Obsidian Callout Invariant | Exact rgba themes (`233, 49, 71`, `219, 139, 0`, `8, 109, 221`), 4px solid left border, Lucide alert icons | `SuggestionTooltip.jsx`, `ActionMenu.jsx`, `VersionManagerModal.jsx` | `.obsidian-callout` elements | Stripped from print as editor artifacts | `AGENTS.md` & CSS rules |
| 10 | Dynamic Tooltip | Viewport Bounding Positioning | `getBoundingClientRect()` positioning with horizontal flip at `innerWidth` and vertical clamping | `SuggestionTooltip.jsx` | Dynamically positioned fixed tooltip | Failsafe bounds clamp to `left: 20`, `top: 20` | `SuggestionTooltip.jsx` code inspection |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Test Environment (`setup.js`) | Invoking `executeCleanPrint` inside JSDOM environment | JSDOM prints `Error: Not implemented: window.focus` to stderr because JSDOM does not implement `window.focus()`. Tests pass, but logging is noisy. |
| 2 | Version Manager Modal Tests | Unwrapped state updates in `version-manager-hub.test.jsx` | Vitest logs `Warning: An update to VersionManagerModal inside a test was not wrapped in act(...)`. Tests pass, but React state warning appears. |
| 3 | Editor Canvas vs Print Fold Gap | Live editor `#area-cv` with multi-page content | Editor insets `gapPx = 20` between sheets. If `gapPx` were accidentally evaluated in `print.css`, print pages would accumulate 20px drift per page. |
| 4 | Double Padding on Page Breaks | Multi-page print of 2-column layout | Using `box-decoration-break: clone` in `print.css` introduced 48px double-padding on page 2. Changing to `box-decoration-break: slice` preserves parity. |
| 5 | Section Title Orphan Prevention | Section title landing within 60px of fold bottom | `isOrphanTitle` detects boundary proximity or item displacement and forces title to next page with `break-before: page`. |
| 6 | Boxicons Class Migration in Tests | Tests asserting on `.bx` (e.g. `dynamic-contacts.test.jsx`) | Migrating components to Lucide without updating tests will cause existing tests expecting `.bx` to fail. Tests and source must be migrated in tandem. |
| 7 | Legacy Docs Contradiction | Contributor reading `DEVELOPMENT_MANUAL.md` | Directs developer to use `switch(type)` in `App.jsx`, which directly breaks the `sectionRegistry.js` open/closed pattern. |
