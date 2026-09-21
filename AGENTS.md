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


