# Handoff Report: Print & Export Pipeline Investigation (1:1 Geometric Parity Survey)

## 1. Observation

### O1. Spurious Scaling and Slider Mutation in Print Engine
- **File**: `src/utils/staticHtmlPdfEngine.js`
- **Lines 1453–1468**:
  ```javascript
  const rawHeight = Math.max(
    doc.body?.scrollHeight || 0,
    doc.documentElement?.scrollHeight || 0,
    areaCv?.scrollHeight || 0
  );
  const maxAllowedHeight = totalPages * pageHeightPx;
  let scale = 1.0;
  if (rawHeight > maxAllowedHeight) {
    scale = calculatePrintScale(rawHeight, totalPages);
    if (doc.body?.style) {
      doc.body.style.zoom = scale;
    }
    if (doc.documentElement) {
      const curFontScale = parseFloat(liveAreaCv?.style?.getPropertyValue('--font-scale') || '1.0');
      const curSectionGap = parseFloat(liveAreaCv?.style?.getPropertyValue('--section-gap') || '20');
      const curItemGap = parseFloat(liveAreaCv?.style?.getPropertyValue('--item-gap') || '8');
      const curPadding = parseFloat(liveAreaCv?.style?.getPropertyValue('--page-padding') || '24');
      doc.documentElement.style.setProperty('--font-scale', `${(curFontScale * scale).toFixed(3)}`, 'important');
      doc.documentElement.style.setProperty('--section-gap', `${Math.max(8, Math.round(curSectionGap * scale))}px`, 'important');
      doc.documentElement.style.setProperty('--item-gap', `${Math.max(4, Math.round(curItemGap * scale))}px`, 'important');
      doc.documentElement.style.setProperty('--page-padding', `${Math.max(12, Math.round(curPadding * scale))}px`, 'important');
    }
  }
  ```
- **Lines 1473–1480**:
  ```javascript
  // In zoomed coordinates, min-height must be scaled so that on unzoomed physical paper it does not exceed targetHeightMm
  const effectiveTargetMm = scale < 1.0 ? +(targetHeightMm * scale).toFixed(2) : targetHeightMm;

  if (areaCv && areaCv.style) {
    areaCv.style.setProperty('min-height', `${effectiveTargetMm}mm`, 'important');
    areaCv.style.setProperty('--print-target-height-mm', `${effectiveTargetMm}mm`);
    areaCv.style.setProperty('--print-total-pages', String(totalPages));
  }
  ```
- **Lines 1508–1528**: Identical scale clamping and property overrides repeated in the 2-column fallback branch.
- **Lines 1648–1661**: Identical fallback scale override repeated a third time.
- **Direct Impact**: The print engine measures `scrollHeight` of the unpaginated screen iframe and actively alters user-configured CSS custom properties (`--font-scale`, `--section-gap`, `--item-gap`, `--page-padding`) by multiplying them by `scale`. It also attempts to apply `doc.body.style.zoom = scale;`. In Gecko (Zen Browser, Firefox), `body.style.zoom` is ignored in `@media print`, while the CSS custom properties on `doc.documentElement` are applied, causing font sizes to shrink while physical geometry stays unzoomed. Furthermore, `effectiveTargetMm` results in fractional heights (e.g. `564.3mm` instead of standard `594mm`), truncating backgrounds mid-page.

### O2. Active Violations of AGENTS.md Rule 5 (Prohibición de Doble Motor en Conflicto)
- **Rule**: `AGENTS.md` Section 5 explicitly dictates:
  > "No intentar resolver la paginación impresa inyectando estilos en línea (`margin-top`, `padding-top` dinámicos basados en `getBoundingClientRect()` de pantalla) sobre el DOM antes de imprimir... La paginación debe regirse por CSS Paged Media declarativo (`@page`, `break-inside: avoid`, `break-before: page`), manteniendo la estructura del DOM limpia y uniforme sin mutaciones en cascada."
- **Violation A — "Cross-page margin synchronization" via screen `getBoundingClientRect()`**:
  `src/utils/staticHtmlPdfEngine.js` lines 1615–1638:
  ```javascript
  const candidates = areaCv?.querySelectorAll ? areaCv.querySelectorAll('.cv-section, .cv-block, .section-title, .experience__content, .education__content, ul.experience__bullets > li, .experience__bullets li, ul.simple-list-ul > li, .bullet-item-row') : [];
  for (let p = 1; p < (snapshot?.totalPages || 2); p++) {
    const pageBoundary = p * pageHeightPx;
    let firstOnPage = null;
    let minDistance = Infinity;
    candidates.forEach((el) => {
      if (typeof el.getBoundingClientRect === 'function') {
        const r = el.getBoundingClientRect();
        if (r.top >= pageBoundary - 5 && r.top < pageBoundary + pageHeightPx * 0.4) {
          const dist = r.top - pageBoundary;
          if (dist < minDistance) {
            minDistance = dist;
            firstOnPage = el;
          }
        }
      }
    });
    if (firstOnPage) {
      firstOnPage.style.setProperty('padding-top', 'var(--page-padding, 24px)', 'important');
      firstOnPage.style.setProperty('margin-top', '0', 'important');
    }
  }
  ```
- **Violation B — Anti-orphan safeguard based on screen `getBoundingClientRect()`**:
  `src/utils/staticHtmlPdfEngine.js` lines 1590–1613:
  ```javascript
  if (firstChild && typeof titleEl.getBoundingClientRect === 'function' && typeof firstChild.getBoundingClientRect === 'function') {
    const titleRect = titleEl.getBoundingClientRect();
    const childRect = firstChild.getBoundingClientRect();
    const titlePage = Math.floor(titleRect.top / pageHeightPx);
    const childPage = Math.floor(childRect.top / pageHeightPx);
    if (childPage > titlePage) {
      if (is2Col) {
        titleEl.style.setProperty('break-before', 'auto', 'important');
        titleEl.style.setProperty('page-break-before', 'auto', 'important');
        titleEl.classList.remove('force-page-break-before', 'break-page-before');
      } else {
        titleEl.style.setProperty('break-before', 'page', 'important');
        titleEl.style.setProperty('page-break-before', 'always', 'important');
        titleEl.classList.add('force-page-break-before', 'break-page-before');
      }
      titleEl.setAttribute('data-page-break', 'before');
    }
  }
  ```
- **Violation C — Pre-break screening using unpaginated screen coordinates**:
  `src/utils/staticHtmlPdfEngine.js` lines 1394–1402:
  ```javascript
  if (!alreadyBrokenForFold && typeof targetEl.getBoundingClientRect === 'function') {
    const rect = targetEl.getBoundingClientRect();
    if (rect.top >= foldTop - 10) {
      alreadyBrokenForFold = true;
    }
  }
  ```
- **Violation D — Multi-pass heuristic algorithm in `enforceTwoColumnComponentPagination`**:
  `src/utils/staticHtmlPdfEngine.js` lines 888–1125: A 237-line loop mutating inline `break-before: page !important` and `padding-top: var(--page-padding, 24px) !important` based on screen `getBoundingClientRect()`.

### O3. DOM Cloning and Inline Style Injections in `createSanitizedPrintClone`
- **File**: `src/utils/staticHtmlPdfEngine.js`
- **Lines 707–773**:
  ```javascript
  const hasParallelColumnBreaks = Boolean(
    clone.querySelector('.resume__left [data-editor-break-forced="true"]') &&
    clone.querySelector('.resume__right [data-editor-break-forced="true"]')
  );
  if (hasParallelColumnBreaks) {
    clone.querySelectorAll('[data-editor-break-forced="true"]').forEach((node) => {
      node.style.setProperty('break-before', 'auto', 'important');
      node.style.setProperty('page-break-before', 'auto', 'important');
      node.style.setProperty('padding-top', 'var(--page-padding, 24px)', 'important');
      node.style.setProperty('margin-top', '0', 'important');
      ...
    });
  } else {
    const seenCloneFolds = new Set();
    clone.querySelectorAll('[data-editor-break-forced="true"]').forEach((node) => {
      const foldKey = String(node.getAttribute('data-editor-break-fold') || '1');
      if (hasParallelColumnBreaks || seenCloneFolds.has(foldKey)) {
        node.style.setProperty('break-before', 'auto', 'important');
        ...
      } else {
        seenCloneFolds.add(foldKey);
        node.style.setProperty('break-before', 'page', 'important');
        node.style.setProperty('page-break-before', 'always', 'important');
        node.style.setProperty('padding-top', 'var(--page-padding, 24px)', 'important');
        node.style.setProperty('margin-top', '0', 'important');
        node.classList.add('force-page-break-before', 'break-page-before');
        ...
      }
    });
  }
  ```
- **Direct Impact**:
  1. In 2-column mode, if only ONE column had an editor break, it applies `break-before: page !important` on that column element alone.
  2. Because this is set as an INLINE style with `!important` (`node.style.setProperty('break-before', 'page', 'important')`), it takes higher cascade precedence than the neutralizing rule in `src/styles/print.css` lines 72–98 (`#area-cv.resume.bd-grid .resume__left * { break-before: auto !important; }`).
  3. Consequently, in Gecko, the column containing `break-before: page` fractures away to the next page while the opposite column does not, producing alternating blank pages.

### O4. Empirical Verification of Real Sample PDFs
- **Command**:
  `pdfinfo "2columnCV_TU NOMBRE Y APELLIDO_Título Profesional _ Especialidad.pdf"`
  `pdfinfo "CV_TU NOMBRE Y APELLIDO_Título Profesional _ Especialidad.pdf"`
- **Result**:
  - `Creator`: Zen Browser 154.0 (Gecko Engine, Cairo 1.18.4)
  - `2columnCV...pdf`: **5 pages** (Page 1: both columns, Page 2: completely blank, Page 3: only "EDUCACIÓN", Page 4: mixed items, Page 5: 2 solitary bullets).
  - `CV...pdf`: **4 pages** (Page 1: full up to first education item, Page 2: contains exactly ONE solitary item "Nueva Titulación / Grado", Page 3: certifications & rest of content, Page 4: completely blank).

### O5. Visual Gap in Editor vs. Zero Margin in Print
- **Live Editor Canvas**:
  - `src/App.jsx` lines 277–280:
    `minHeight: totalPages > 1 ? calc(${totalPages * 297}mm + ${(totalPages - 1) * 20}px) : ${totalPages * 297}mm`
  - `src/components/Editor/A4PageGuides.jsx` line 34:
    Renders visual A4 page fold divider with `height: 20px` at `top: calc(${(i + 1) * 297}mm + ${i * 20}px)`.
  - `src/utils/paginationEngine.js` lines 429–444:
    Calculates `neededPush = nextContentAreaTop - targetBounds.top` where `nextContentAreaTop` includes the 20px visual gap, and pushes elements down by setting inline `margin-top: ${effectiveMarginTop}px`.
- **Print Stylesheet**:
  - `src/styles/print.css` lines 8–11:
    ```css
    @page {
      size: A4;
      margin: 0;
    }
    ```
  - `#area-cv` has `padding: var(--page-padding, 24px);` on Page 1.
  - Because `@page { margin: 0; }`, Page 2 has ZERO physical margin. When an element breaks across pages naturally, it lands at `top: 0px` (flush against the physical paper edge).
  - Because `box-decoration-break: slice` is enforced in `src/styles/print.css` lines 44–45 and 61–62 (`box-decoration-break: slice !important`), the padding of `#area-cv` or `.resume__left/.resume__right` is NOT cloned onto subsequent page fragments.

---

## 2. Logic Chain

1. **Premise 1 (Screen Iframe vs Print Media Context)**:
   When `executeCleanPrint` executes in `staticHtmlPdfEngine.js`, the iframe is rendered in `@media screen`. In `@media screen`, CSS Paged Media properties (`break-before: page`, `@page`, `page-break-before: always`) do NOT create physical page breaks; the iframe remains a single, continuous, scrollable box of arbitrary height.

2. **Premise 2 (Flawed Heuristic Measurements, O2)**:
   Lines 1394–1402, lines 1590–1613, and lines 1615–1638 query `getBoundingClientRect()` on DOM nodes inside this unpaginated screen iframe.
   - For example, line 1625 checks `r.top >= pageBoundary - 5 && r.top < pageBoundary + pageHeightPx * 0.4` where `pageBoundary = 1123px`.
   - Because `break-before: page` has not caused pagination in screen media, `r.top` does not reflect the position an element will have when printed.
   - The engine falsely identifies an element as "first on page" and injects inline `padding-top: var(--page-padding, 24px) !important; margin-top: 0 !important;`.
   - When the native browser print dialog opens (`@media print`), the browser performs true vector page breaks. An element that received inline `padding-top: 24px` now has an extra 24px of height, pushing downstream content across subsequent page boundaries and creating cascade breaks.

3. **Premise 3 (Slider Degradation and Fractional Dimensions, O1)**:
   - When `scrollHeight` exceeds `maxAllowedHeight` (often caused by the extra injected inline paddings), lines 1455–1468 calculate `scale = calculatePrintScale(...)` and rewrite the root CSS variables `--font-scale`, `--section-gap`, `--item-gap`, and `--page-padding`.
   - This violates Requirement R2 directly: user sliders are ignored and shrunk.
   - Lines 1474–1477 set `min-height: ${effectiveTargetMm}mm` (e.g. `564.3mm`). In physical printing, an A4 page is exactly 297mm. Two pages are exactly 594mm. Setting `min-height: 564.3mm` cuts off the background colors at 95% of Page 2, causing ragged white margins at the bottom of Page 2 and throwing subsequent elements onto Page 3.

4. **Premise 4 (2-Column Grid Fragmentation, O3 & O4)**:
   - In 2-column mode (`#area-cv.bd-grid`), `createSanitizedPrintClone` (lines 749–757) and `triggerPrint` (lines 1409–1412) inject `break-before: page !important` onto a child of one column track when `hasParallelColumnBreaks` is false.
   - Inline `!important` declarations override the stylesheet `!important` rules in `print.css`.
   - In Gecko (Zen Browser), a forced page break on a single column of a multi-column layout forces that column to break independently to Page 2. The other column remains on Page 1.
   - On Page 2, the second column is empty. Then on Page 3, the first column has ended and the second column breaks, producing alternating blank pages (as proven by O4).

5. **Premise 5 (ATS 1-Column Single-Item Straning, O2 & O4)**:
   - In 1-column ATS mode, the anti-orphan safeguard (lines 1590–1613) detects that the section title for "EDUCACIÓN" is at screen top 1000px while its child item is at screen top 1130px. It injects `break-before: page !important` on "EDUCACIÓN".
   - The child item ("Nueva Titulación / Grado") already had `break-before: page !important` from the editor snapshot.
   - Consequently, "EDUCACIÓN" breaks to Page 2. Then its child breaks to Page 3. The child is stranded alone on Page 2 (as proven by O4: Page 2 contains only one solitary item).

---

## 3. Caveats

- **No Caveats**: The investigation covered the entire print pipeline (`staticHtmlPdfEngine.js`, `print.css`, `index.html`, `index.css`, `App.jsx`, `paginationEngine.js`, `pageGeometry.js`, `usePaginationEngine.js`, and Cypress specs) and verified empirical PDF artifacts with binary inspection tools (`pdfinfo`, `pdftotext`).

---

## 4. Conclusion

The discrepancies, excessive page counts (4–5 pages instead of 2), and stranded bullet items are directly caused by:
1. **The Double-Engine Conflict**: Dynamically evaluating and mutating DOM styles (`padding-top`, `break-before`) via screen `getBoundingClientRect()` inside an unpaginated iframe before invoking print.
2. **Spurious Scaling (`calculatePrintScale`)**: Mutating CSS custom properties (`--font-scale`, `--section-gap`, `--item-gap`, `--page-padding`) and applying fractional `min-height` (`effectiveTargetMm`) instead of strict integer A4 multiples (`N * 297mm`).
3. **Asymmetric Column Page Breaks**: Inlining `break-before: page !important` onto individual column children in 2-column layouts, overriding `print.css` and triggering column fragmentation in Gecko.
4. **Lack of Declarative Page Margins**: Using `@page { margin: 0; }` with `box-decoration-break: slice` without a declarative top-margin mechanism for Page 2+, which prompted the flawed JS padding-injection hacks.

### Actionable Remediation Recommendations

1. **Completely Purge Heuristic Injections from `staticHtmlPdfEngine.js`**:
   - Delete lines 1615–1638 ("Cross-page margin synchronization").
   - Delete lines 1590–1613 (JS anti-orphan safeguard); rely strictly on declarative CSS: `.section-title, h1, h2, h3 { break-after: avoid !important; }`.
   - Delete lines 1394–1402 (screen coordinate break cancellation).
   - Delete lines 1453–1471, lines 1508–1524, and lines 1648–1661 (`calculatePrintScale`, `doc.body.style.zoom`, and slider overwriting). Always keep scale at 1.0 and preserve 100% of user sliders.
   - Enforce `min-height: calc(${totalPages} * 297mm) !important` (strict integer A4 multiples: 297mm, 594mm, 891mm).

2. **Normalize 2-Column Mode in `print.css` & `createSanitizedPrintClone`**:
   - In 2-column mode, never inject inline `break-before: page` into individual column children.
   - Rely on synchronized container height (`min-height: 594mm`) and `break-inside: avoid` on atomic components (`.cv-block`, `h1-h6`, bullet items).

3. **Declarative Page Margins in CSS Paged Media**:
   - In `print.css`, configure `box-decoration-break: clone !important; -webkit-box-decoration-break: clone !important;` on `.resume__left, .resume__right, .resume__single-column`, ensuring that when a column track fragments across pages, the browser natively applies top and bottom padding (`var(--page-padding)`) on every physical page fragment.
   - For ATS 1-column mode, ensure `.resume__single-column` declares padding declaratively on all page fragments.

4. **Verify Exclusively with Cypress in a Real Browser**:
   - Validate using `npx cypress run --spec "cypress/e2e/02-print-geometry-and-pagination.cy.js,cypress/e2e/08-two-column-print-synchronization.cy.js"`.

---

## 5. Verification Method

### Test Commands
1. **Production Build**:
   ```bash
   npm run build
   ```
2. **Vitest Unit & Integration Suite**:
   ```bash
   npm test
   ```
3. **Cypress E2E Real-Browser Test Suite**:
   ```bash
   npx cypress run --spec "cypress/e2e/01-print-lifecycle.cy.js,cypress/e2e/02-print-geometry-and-pagination.cy.js,cypress/e2e/08-two-column-print-synchronization.cy.js"
   ```

### Files to Inspect
- `src/utils/staticHtmlPdfEngine.js` (lines 1374–1665)
- `src/styles/print.css` (lines 8–98, 386–443)
- `src/App.jsx` (lines 261–295)

### Invalidation Conditions
- Any test or runtime behavior that injects dynamic `padding-top` or `margin-top` onto DOM nodes inside the print iframe using `getBoundingClientRect()`.
- Any modification of `doc.body.style.zoom` or recalculation of `--font-scale`, `--section-gap`, `--item-gap`, or `--page-padding` during print execution.
- Any printed document in 2-column or ATS mode where page count exceeds the live editor's page count or where solitary items appear on isolated pages.
