# Original User Request

## 2026-09-18T23:08:26Z

This is a single self-contained fix; keep it small and focused.

Working directory: /home/juani/Documentos/Ressume
Integrity mode: development

Fix the PDF print pagination engine so that content elements and bullet points do not spawn excessive blank pages or fragment across multiple sparse pages (e.g. producing 4 pages with solitary bullets and massive empty space instead of 2 naturally filled pages).

## Requirements

### R1. Natural Content Flow and Elimination of Phantom Breaks
Ensure that items and bullet points within sections fill the available vertical height of the current page before triggering a page break. Eliminate premature or accumulated breaks that push solitary items (like a single bullet point or section heading) to the top of an otherwise empty new page.

### R2. Parity Between Break Calculation and Print Output
Ensure that page-break decisions and spacing calculations in print mode (for both 2-column layout and ATS 1-column layout) do not cascade or compound offsets across subsequent pages. Content must paginate organically without forced break accumulation.

### R3. Dual Layout Integrity
Guarantee that both 2-column mode (`resume.bd-grid`) and ATS 1-column mode (`resume__single-column`) paginate cleanly without component fracturing or white space inflation.

## Acceptance Criteria

### Pagination & Flow
- [ ] Printing multi-item sections and lists does not generate pages with isolated single bullet points surrounded by blank space when previous pages have room.
- [ ] Total printed page count reflects actual content density without phantom intermediate or trailing blank pages.
- [ ] Vitest test suite passes with programmatic verification of element placement and break behavior across both 1-column ATS and 2-column layouts.
- [ ] Production build (`npm run build`) completes with zero errors.

## 2026-09-19T19:03:10Z

Eliminate fragmentation and phantom blank pages during PDF printing in 2-column layout mode (`resume.bd-grid`), ensuring synchronized multi-page flow matching the live editor with Cypress E2E automated print testing, with strict zero-regression guarantee for ATS 1-column mode and live editor functionality.

Working directory: /home/juani/Documentos/Ressume
Integrity mode: development

## Requirements

### R1. Two-Column Synchronized Pagination and Flow without Column Asynchrony
In 2-column mode (`.resume.bd-grid`), prevent independent column breaks from triggering cascading full-document page breaks. When content overflows onto Page 2 (or subsequent pages), both left and right columns must paginate synchronously without stranding solitary columns on alternating blank pages (e.g. Page 2 containing only right column, Page 3 containing only left column).

### R2. Elimination of Phantom Blank Pages and Overlapping Breaks
Eliminate accumulated or duplicated page breaks that inflate a 2-page document into 3 to 7 pages. Clean print HTML and CSS pagination must faithfully reflect the live editor's page count and content distribution.

### R3. Comprehensive Cypress E2E Print Verification Suite
Implement and run automated Cypress end-to-end tests verifying the PDF print pipeline in 2-column mode:
- Validating that multi-page 2-column documents produce exactly the expected page count (e.g. 2 pages, matching the editor).
- Asserting that both columns render content harmoniously on each page without blank counterpart columns.
- Testing the clean print snapshot generation (`generateCleanPrintHTML` / `executeCleanPrint`) under high-density CV data like `JUAN IGNACIO CARRIZO BackEnd.pdf`.

### R4. Zero Regression Guarantee for ATS 1-Column Mode and Interactive Editor
The ATS 1-column layout mode and the interactive live editor must remain 100% operational with zero regressions in layout calculation, split decorations, page break positions, drag-and-drop, or typography.

## Acceptance Criteria

### Two-Column Pagination Integrity
- [ ] Printing a multi-page 2-column CV generates exactly the page count reflected in the live editor (e.g. 2 pages, 0 phantom blank pages).
- [ ] On every printed page, left and right columns flow contiguously without alternating empty columns.
- [ ] Super-containers and bullet items do not fracture awkwardly or spawn trailing blank pages.

### Regression Prevention & ATS Mode
- [ ] The ATS 1-column mode printing and live editing experience experience 0 regressions.
- [ ] All existing Vitest test files (58 files, 896 tests) continue to pass 100%.

### Cypress E2E Testing
- [ ] Cypress test suite includes comprehensive specs targeting 2-column print snapshotting and pagination.
- [ ] Tests verify that high-density 2-column CV data renders within strict 2-page boundaries.
- [ ] Full Cypress suite and Vitest test suite pass with 100% success.

## 2026-09-20T03:28:46Z

Resolver la discrepancia dimensional y de paginación entre el editor en vivo (`#area-cv`) y la salida de impresión PDF en Ressume, garantizando una paridad 1:1 estricta donde absolutamente todos los sliders (escalas tipográficas, line-height, espaciados entre ítems y secciones, padding de página y proporción de columnas) se respeten en la impresión, eliminando desbordes asimétricos (como la partición incorrecta de viñetas entre páginas) y validando todo el comportamiento con Cypress en un navegador real.

Working directory: /home/juani/Documentos/Ressume
Integrity mode: development

## Reference Materials
- `2columnCV_TU NOMBRE Y APELLIDO_Título Profesional _ Especialidad.pdf`: Muestra empírica del desfasaje en 2 columnas.
- `CV_TU NOMBRE Y APELLIDO_Título Profesional _ Especialidad.pdf`: Muestra empírica de partición asimétrica y sangrado de viñetas.
- `AGENTS.md`: Invariantes de arquitectura (prohibición de parches heurísticos basados en coordenadas de pantalla y prohibición de certificar paridad únicamente con JSDOM).

## Requirements

### R1. Paridad Geométrica y Dimensional 1:1 (Editor vs Impresión PDF)
- Garantizar que el lienzo del editor (`#area-cv`) y el documento de impresión compartan la misma base dimensional A4 exacta (210mm x 297mm / 794px a 96 DPI).
- Eliminar cualquier sobredimensionamiento, zoom espurio o desajuste de modelo de caja (`box-sizing`, márgenes colapsados) al ingresar a modo de impresión.
- La distribución física de elementos debe ser idéntica entre la vista del editor y la salida impresa vectorial: si en el editor un elemento de 4 viñetas ubica 2 en la página 1 y 2 en la página 2, la impresión debe replicar exactamente 2 viñetas en la página 1 y 2 en la página 2.

### R2. Sincronización Estricta de Sliders y Variables de Diseño
- Propagar incondicionalmente el 100% de los controles de configuración de `cvData.layout` al entorno de impresión:
  - Escalas de fuentes: `--font-scale`, `--title-scale`, `--body-scale`, `--list-scale`.
  - Altura de línea: `--line-height`.
  - Márgenes y espaciados: `--page-padding`, `--section-gap`, `--item-gap`.
  - Estructura de columnas: `--left-col-percent`, `--grid-template-columns`, `--left-bg`, `--right-bg`.
  - Tipografía global: `--body-font` y pila de fuentes seleccionada.
- Ningún slider o ajuste manual del usuario puede revertirse a valores por defecto o ser ignorado al generar el PDF o abrir el diálogo de impresión nativo.

### R3. Flujo Orgánico de Viñetas y Márgenes de Página Paginados
- Las listas de viñetas (`.experience__bullets`, `.simple-list-ul`, etc.) deben permitir división entre ítems individuales sin romper palabras o líneas por la mitad.
- Toda página subsiguiente generada tras un salto de página debe respetar estrictamente el margen superior (`--page-padding`), impidiendo que el primer elemento de la nueva página quede pegado al borde físico del papel.
- La última viñeta de una página previa debe respetar el margen inferior de la hoja A4 sin sangrar hacia el pie de página ni generar páginas intermedias accidentales.

### R4. Verificación End-to-End Exclusiva con Cypress (Navegador Real)
- La verificación de paridad visual, saltos de página y propagación de sliders debe ejecutarse obligatoriamente mediante **Cypress** en un navegador real (`npx cypress run`).
- Ninguna solución o avance puede darse por válido basándose únicamente en JSDOM o pruebas unitarias aisladas de Vitest (en cumplimiento estricto de la regla 6 de `AGENTS.md`).

## Acceptance Criteria

### Paridad y Distribución de Viñetas
- [ ] En un ítem de 4 viñetas al límite del pliegue de página donde el editor muestra 2 viñetas en la Página 1 y 2 en la Página 2, la salida de impresión PDF reproduce exactamente 2 viñetas en la Página 1 y 2 en la Página 2.
- [ ] La primera viñeta en la Página 2 respeta el margen superior (`pagePadding`) sin quedar adherida al borde superior de la hoja.
- [ ] Ningún carácter o línea de texto queda cortado verticalmente por la mitad entre dos páginas.

### Propagación de Sliders
- [ ] Modificar los controles de diseño (escala de texto, espaciado de ítems, padding y ancho de columnas) altera proporcional e idénticamente tanto la vista previa interactiva como el DOM renderizado para impresión.
- [ ] No existen reglas CSS en `@media print` que sobreescriban las variables de espaciado o tipografía con valores fijos en px/rem incompatibles.

### Verificación con Cypress
- [ ] La suite de pruebas de Cypress (`npx cypress run`) ejecuta y aprueba los tests de geometría de impresión, ciclo de vida de impresión y sincronización de columnas.
- [ ] Los tests de Cypress inspeccionan el documento del iframe de impresión en un navegador real y comprueban que las coordenadas relativas y saltos de página coinciden con la vista previa del editor.

