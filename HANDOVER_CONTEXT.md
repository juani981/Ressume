# Ressume - Contexto de Sesión y Handover de Arquitectura

**Fecha:** 16 de Septiembre de 2026  
**Rama activa:** `Re-do-total-de-impresion-PDF`  
**Objetivo principal completado:** Eliminación definitiva de la hoja blanca generada en los quiebres de página en PDF + Implementación de espaciadores transparentes (Zero CLS) para componentes "ADD" / "AÑADIR" + Suite E2E de validación de PDF físico en Chromium.

---

## 1. Problemas Abordados y Solución Técnica

### A. Eliminación de Hoja Blanca por Quiebre de Página
- **Síntoma reportado:** *"El renderizado es correcto, pero, al imprimir en PDF, se está añadiendo una hoja blanca por cada quiebre de pagina"*.
- **Causa Raíz Identificada:**
  1. **Doble salto por margen superior:** En `print.css` y `staticHtmlPdfEngine.js`, los elementos con quiebre de página forzado tenían:
     ```css
     break-before: page !important;
     padding-top: var(--page-padding, 24px) !important;
     margin-top: var(--page-padding, 24px) !important;
     ```
     Chromium evaluaba `margin-top: 24px` en el flujo de la página previa, empujando la caja a la siguiente página. Acto seguido, la directiva `break-before: page` forzaba un segundo salto de página. Además, acumulaba 48px de separación superior en vez de los 24px configurados.
  2. **Inflación de altura por `min-height: 594mm` con `zoom < 1.0`:** En `triggerPrint`, `#area-cv` y las columnas recibían `min-height: 594mm !important` antes de medir la altura del contenido. Debido a diferencias de subpíxeles, el motor calculaba un micro-escalado (ej. `zoom: 0.98`). En Chromium, `594mm` bajo `zoom: 0.98` escala físicamente a `594 / 0.98 = 606.12mm`, desbordando 2 hojas A4 por 12mm. Chromium emitía una tercera página con **0 comandos de texto**, ocupada únicamente por 217px de fondo.
- **Solución implementada:**
  1. Normalización de `margin-top: 0 !important;` en todas las reglas de quiebre de página (`print.css`, `createSanitizedPrintClone`, `snapshotBreaksCSS`, `enforceTwoColumnComponentPagination` y `triggerPrint`). El espaciado en la nueva página queda gobernado al 100% por `padding-top: var(--page-padding, 24px) !important;` (paridad exacta 1:1 con la Página 1).
  2. En `triggerPrint`: fijar la altura del iframe antes de medir para evitar scrollbars, medir `rawHeight` a partir del contenido real antes de imponer alturas mínimas, y modular la altura física en coordenadas de zoom: `effectiveTargetMm = scale < 1.0 ? +(targetHeightMm * scale).toFixed(2) : targetHeightMm`.
- **Resultado comprobado:** En un CV de 2 páginas con quiebre forzado, Chromium genera **exactamente 2 páginas** (Página 1: 1613 comandos de texto, Página 2: 921 comandos de texto, 0 hojas blancas).

---

### B. Componentes "ADD" Transparentes (Zero CLS / Anti-Cumulative Layout Shift)
- **Requerimiento:** *"Todos los componentes 'ADD'/'AÑADIR' componente, sección, o viñeta, debería tener una regla excepcional CSS para no ser display:none, si no que ocupe el mismo espacio en el pdf final, pero ser totalmente transparentes. Es decir. OCUPAR EL MISMO ESPACIO, aunque no sea visible. Para evitar desplazamientos acumulativos."*
- **Implementación:**
  - Se identificaron todas las familias de controles de adición: `.bullet-add-row`, `.add-bullet-btn`, `.section-add-container`, `.round-btn-add`, `.column-add-section`, `.add-section-btn`, `.add-contact-btn`.
  - En `createSanitizedPrintClone` (`src/utils/staticHtmlPdfEngine.js`) y `print.css`:
    En lugar de removerse del DOM o colapsar con `display: none`, reciben la clase `.print-transparent-spacer` y estilos en línea:
    ```css
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
    border-color: transparent !important;
    background: transparent !important;
    color: transparent !important;
    box-shadow: none !important;
    display: block !important; /* o inline-flex según el tipo de elemento */
    ```
  - Esto preserva la altura exacta de cada bloque del editor en el PDF, impidiendo saltos de línea acumulativos imprevistos.

---

## 2. Archivos Modificados y Rol en el Sistema

1. **`src/styles/print.css`**:
   - Reglas para `.print-transparent-spacer`.
   - `margin-top: 0 !important;` en `.force-page-break-before`, `.break-page-before`, `[data-editor-break-forced="true"]`.
2. **`src/utils/staticHtmlPdfEngine.js`**:
   - `createSanitizedPrintClone`: transforma botones ADD en espaciadores invisibles en lugar de borrarlos.
   - `snapshotBreaksCSS`: inyecta `margin-top: 0 !important;` junto a `break-before: page !important;`.
   - `triggerPrint`: corrige medición de scrollHeight y cálculo de `effectiveTargetMm`.
3. **Componentes del Editor**:
   - `src/App.jsx`: botón `Agregar Sección Lateral`.
   - `src/components/CV/BaseSection.jsx`: botón `round-btn-add`.
   - `src/components/CV/items/ProfileHeaderItem.jsx`: botón `add-contact-btn`.
   - `src/components/Editor/AddBulletPoint.jsx`: contenedor y botón `bullet-add-row` / `add-bullet-btn`.
4. **Pruebas y Automatización**:
   - `cypress.config.js`: tarea `printWithChrome` para renderizar PDF binario nativo con Chromium headless `--headless=new`.
   - `cypress/e2e/01-print-lifecycle.cy.js` a `06-multipage-pagebreak.cy.js`: 6 suites completas E2E.
   - `src/tests/page2MarginPaddingParity.test.jsx`, `src/tests/challenger-print-engine-stress.test.jsx`, `src/tests/m3-parity-and-forbidden-zones.test.jsx`: sincronizados con `margin-top: 0`.
   - `.gitignore`: exclusión de `cypress/downloads/`.

---

## 3. Estado de Verificación Automatizada

- **Cypress E2E (`npx cypress run --browser chrome`):**
  - **24/24 pruebas pasando (100%)**
  - `01-print-lifecycle.cy.js`: 4/4 pasadas.
  - `02-print-geometry-and-pagination.cy.js`: 4/4 pasadas.
  - `03-editor-modifications-to-print.cy.js`: 4/4 pasadas.
  - `04-cdp-pdf-generation.cy.js`: 4/4 pasadas.
  - `05-pixel-fidelity-and-css-parity.cy.js`: 7/7 pasadas.
  - `06-multipage-pagebreak.cy.js`: 1/1 pasada (valida conteo exacto de 2 páginas en PDF físico de Chromium).

---

## 4. Reglas e Invariantes Críticas (`AGENTS.md`)
- **Diseño Callout estilo Obsidian**: cards de sugerencia con bordes de 4px, background translúcido, iconos emoji y títulos en negrita.
- **Drag and Drop**: `@dnd-kit` exclusivamente. PROHIBIDO usar `swapy` por colisión de slots.
- **Tooltips y Popovers dinámicos**: cálculo estricto con `getBoundingClientRect()` y auto-flip en bordes de viewport.
- **Motor de sugerencias**: JSON estático modular (`src/ai-knowledge/`), dominio enfocado en Tech.
