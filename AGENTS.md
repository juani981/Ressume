# Ressume Development & Architectural Guidelines

## 1. UI & Callout Design Invariants (Obsidian Style)
- **Obsidian Callout Standard**: All suggestion cards, alerts, and feedback tooltips must strictly adhere to the Obsidian Callout visual design:
  - **Danger / Critical**: Background `rgba(233, 49, 71, 0.1)`, 4px solid left border `rgba(233, 49, 71, 1)`, red bold title, `🛑` or `🚨` icon.
  - **Caution / Warning**: Background `rgba(219, 139, 0, 0.1)`, 4px solid left border `rgba(219, 139, 0, 1)`, orange bold title, `⚠️` icon.
  - **Info**: Background `rgba(8, 109, 221, 0.1)`, 4px solid left border `rgba(8, 109, 221, 1)`, blue bold title, `ℹ️` icon.
  - Structure: `.obsidian-callout` container, `.callout-title` with `display: flex; gap: 8px; font-weight: 600`, and `.callout-content`.

## 2. Drag and Drop Architecture
- **Library Selection**: Always use `@dnd-kit` (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`) for nested, 2-level, and multi-column drag-and-drop structures.
- **Do NOT use `swapy`**: Swapy produces slot ID collisions in nested React component trees and disrupts virtual DOM synchronization.

## 3. Dynamic Tooltip & Popover Positioning
- In multi-column or centered document layouts (like the CV paper), tooltips must **not** be fixed to arbitrary screen coordinates or fixed global offsets.
- Tooltips must dynamically track the bounding rectangle (`getBoundingClientRect()`) of the active hovered element:
  - Position adjacent to the element (`rect.right + 20px`).
  - Flip to the opposite side (`rect.left - 320px`) when approaching the viewport boundary (`window.innerWidth`).
  - Clamp vertically to prevent escaping `window.innerHeight`.

## 4. AI Suggestion Engine & Domain Focus
- Suggestions are pre-computed in modular JSON knowledge bases (`src/ai-knowledge/`) rather than real-time LLM inference.
- Current domain focus is strictly **Tech** (`tech` and `all` industries). Creative and Executive modules remain reserved for future phases.

## 5. Invariante de Paginación e Impresión PDF (Cero Parches Heurísticos de Pantalla)
- **Prohibición de Doble Motor en Conflicto**: No intentar resolver la paginación impresa inyectando estilos en línea (`margin-top`, `padding-top` dinámicos basados en `getBoundingClientRect()` de pantalla) sobre el DOM antes de imprimir.
- **Razón**: Las métricas de texto, rasterizado de fuentes subpíxel y quiebres de línea en pantalla discrepan inevitablemente de la salida vectorial A4 del motor de impresión del navegador (`@media print` en Gecko/Blink). Intentar predecir o forzar los saltos mediante cálculos en píxeles de pantalla provoca colisiones donde el navegador quiebra antes de lo previsto, desalineando los saltos programados y dejando páginas con viñetas huérfanas y sin márgenes.
- **Arquitectura Canónica**: La paginación debe regirse por CSS Paged Media declarativo (`@page`, `break-inside: avoid`, `break-before: page`), manteniendo la estructura del DOM limpia y uniforme sin mutaciones en cascada.

## 6. Verificación Real vs. Sesgo de JSDOM / Tests Sintéticos
- **Limitación Estricta de JSDOM/Vitest**: JSDOM no posee motor de renderizado de fuentes, no calcula el modelo de caja de medios impresos (`@media print`) ni ejecuta partición física de páginas A4.
- **Prohibición de Declarar Paridad Basándose Únicamente en Vitest**: Ningún agente debe declarar "paridad 1:1 resuelta" ni marcar objetivos como completos basándose únicamente en que una suite de pruebas unitarias o de integración en Vitest esté en verde.
- **Validación Empírica Requerida**: Cualquier ajuste que involucre geometría de página, fuentes o saltos de impresión debe ser considerado experimental hasta su validación en el navegador real del usuario (Zen Browser / Gecko / Chromium).

## 7. 🚨 LECTURA OBLIGATORIA ANTES DE TOCAR PAGINACIÓN O CSS DE IMPRESIÓN

- **Archivo Obligatorio**: Antes de modificar CUALQUIER archivo relacionado con paginación, CSS de impresión o generación de PDF — incluyendo `print.css`, `paginationEngine.js`, `staticHtmlPdfEngine.js`, `usePaginationEngine.js`, bloques `@media print` en `index.css`, o cualquier lógica con `break-before`, `break-inside`, `@page`, `min-height` de `#area-cv` — **DEBES leer completo el archivo [`FRACASO_SALTOS_DE_PAGINA.md`](./FRACASO_SALTOS_DE_PAGINA.md)** en la raíz del proyecto. No hay excepciones.
- **Prohibición de `break-before` en selectores de lista**: Nunca aplicar `break-before: page` / `break-before: always` a un selector que aplique a múltiples ítems repetidos (`.cv-block`, `.education__content`, `.experience__content`, etc.). Esto produce un salto de página por cada ítem, generando PDFs de 5+ páginas. Es el error más frecuente y más dañino documentado en este proyecto.
- **Prohibición de declarar paridad sin validación visual**: Ningún agente puede afirmar que "la paginación está resuelta" o que hay "paridad 1:1" basándose en tests verdes de Vitest o Cypress. La única validación válida es que el usuario confirme visualmente el PDF impreso en su navegador real (Zen Browser / Gecko / Chromium).
- **Historial de fracasos**: Al menos 5 iteraciones de agentes produjeron PDFs rotos mientras sus tests pasaban al 100%. La evidencia física está en `muestra_fracaso.pdf` en la raíz del proyecto.

## 8. Invariante de Espaciadores Transparentes Zero-CLS (Botones ADD / AÑADIR)
- **Prohibición de `display: none` en Controles de Inserción**: Ningún botón de adición (`.bullet-add-row`, `.add-bullet-btn`, `.section-add-container`, `.round-btn-add`, `.column-add-section`, `.add-section-btn`, `.add-contact-btn`) debe removerse del DOM ni ocultarse con `display: none` al generar el clon de impresión.
- **Mecanismo Obligatorio**: En `createSanitizedPrintClone` y `print.css`, estos elementos deben transformarse en espaciadores invisibles aplicando la clase `.print-transparent-spacer` y las propiedades:
  ```css
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
  border-color: transparent !important;
  background: transparent !important;
  color: transparent !important;
  box-shadow: none !important;
  ```
- **Razón**: Garantiza cero desplazamiento acumulativo (Zero CLS) entre la vista de diseño del editor y la salida vectorial impresa.

## 9. Normalización de Márgenes en Saltos de Página (Anti-Hoja Blanca)
- **Regla Estricta de `margin-top: 0`**: Todo elemento con quiebre de página forzado (`.force-page-break-before`, `.break-page-before`, `[data-editor-break-forced="true"]`) DEBE tener `margin-top: 0 !important;`.
- **Gobernanza Exclusiva por Padding**: La separación respecto al borde superior de la nueva página debe ser gobernada al 100% por `padding-top: var(--page-padding, 24px) !important;` (idéntico a la Página 1).
- **Razón**: Chromium evalúa cualquier `margin-top` antes del salto de página en el flujo previo, empujando la caja y provocando un doble salto que emite páginas en blanco intermedias con 0 comandos de texto.

## 10. Arquitectura de Compilación Determinista Typst (WASM)
- **Aislamiento en Web Worker**: La compilación de documentos Typst (`@myriaddreamin/typst.ts`) debe ejecutarse exclusivamente en segundo plano dentro de `src/workers/typst.worker.js`. Queda prohibido inicializar o compilar WASM en el hilo principal de React.
- **Aislamiento del Modelo de Datos**: La serialización a marcado Typst (`src/utils/cvDataToTypst.js`) debe implementarse como funciones puras sin dependencias de elementos o APIs del DOM del navegador.
- **Fuentes y Binarios Locales**: Typst debe resolver todas las fuentes tipográficas y binarios WASM desde rutas estáticas locales del proyecto (`public/fonts/`, `public/wasm/`), sin recurrir a peticiones de red externas ni CDNs.

## 11. Prohibición de Factores de Escala Mágicos y Números Empíricos
- **Prohibición Estricta de Heurísticas de Micro-Zoom**: Queda terminantemente prohibido inyectar multiplicadores empíricos de altura o factores mágicos (`* 0.84`, `* 0.92`, `zoom: 0.98`) para forzar la reducción de contenido o evitar desbordamientos.
- **Razón**: En Chromium, cualquier micro-escalado (`zoom < 1.0`) sobre contenedores con dimensiones fijas en milímetros altera el cálculo físico del viewport impreso (ej. 594mm a zoom 0.98 computa a 606.12mm), desbordando hojas A4 e inyectando folios adicionales en blanco. Las dimensiones deben ser absolutas o derivarse exclusivamente de tokens tipográficos explícitos.

## 12. Arquitectura de Cajas A4 Discretas y Prevención de Huérfanas
- **Estructura de Cajas A4 Cerradas (`.a4-page-box`)**: Cuando se diseñe o refactorice el pipeline de paginación en cliente, el documento para impresión debe renderizarse como una colección secuencial de contenedores independientes con dimensiones fijas (`width: 210mm; height: 297mm; min-height: 297mm; max-height: 297mm; overflow: hidden; break-after: page;`). No delegar la partición interna al motor CSS del navegador sobre un flujo continuo.
- **Fondo Asimétrico Sintético**: En diseños de 2 columnas, el fondo de la columna lateral debe proyectarse en la propia caja de página mediante `linear-gradient` horizontal estático, prohibiendo el uso de `box-decoration-break: clone` o columnas continuas infinitas que dupliquen rellenos en páginas sucesivas.
- **Condición de Integridad Atómica (Anti-Huérfanas)**: Ningún título de sección (`.section-title`) puede posicionarse al pie de una página si el espacio vertical disponible no permite albergar simultáneamente:
  $$\text{Capacidad remanente} \ge \text{Altura(Título)} + \text{Separación} + \text{Altura(Primer Ítem)}$$
  De no cumplirse, el título debe trasladarse íntegramente al inicio de la página siguiente.

## 13. Invariante de Particionado Previo (AST Bin-Packing en React) vs Motores Desacoplados
- **Prohibición de Generadores de Plantillas Externas**: Queda terminantemente prohibido sustituir el pipeline de impresión del editor por lenguajes o motores de marcado desacoplados (Typst, LaTeX, Markdown) que requieran mantener un segundo árbol de presentación paralelo al JSX.
- **Razón**: Los motores externos rompen la paridad WYSIWYG; el usuario pasa horas ajustando detalles visuales en el DOM interactivo que una plantilla externa ignora o simplifica.
- **Mecanismo Canónico (AST Bin-Packing)**: La fragmentación debe resolverse en React antes de renderizar la salida de impresión:
  1. Medición de bloques atómicos en sandbox DOM (`contain: paint layout style; position: fixed; top: -10000px;`) tras `await document.fonts.ready`.
  2. Distribución lineal de 1D Bin Packing en un array de páginas discretas (`pages: PageModel[]`).
  3. Renderizado de componentes JSX nativos dentro de contenedores `<A4PageBox>` independientes (`height: 297mm; max-height: 297mm; overflow: hidden; break-after: page;`).

## 14. Principio de Telemetría Rica del Editor (Cero Adivinanzas Heurísticas)
- **Preferencia por Datos Explícitos**: Es preferible agregar "ruido" en cuanto a datos, enriqueciendo el payload con campos estructurales explícitos procedentes del Editor (`_targetPage`, `_column`, `_hasManualBreak`, `_splitItemIndex`), antes que forzar al motor de impresión a especular o adivinar mediante heurísticas dónde cortar o ubicar un componente.
- **Razón**: El Editor dispone de la verdad geométrica absoluta de la pantalla (posiciones de corte, columnas, márgenes vivos y decisiones del usuario). Transferir esta telemetría elimina cualquier necesidad de cálculo especulativo en tiempo de impresión.

