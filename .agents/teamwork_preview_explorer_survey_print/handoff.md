# Print Engine Survey & Audit Report

- **Role**: Print Engine Specialist Explorer
- **Date**: 2026-09-11
- **Working Directory**: `C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_explorer_survey_print`
- **Target Files**:
  - `src/utils/staticHtmlPdfEngine.js`
  - `src/App.jsx`
  - `src/styles/print.css`
  - `src/index.css`
  - `src/tests/pixelParityEditorPrint.test.jsx`
  - `src/tests/cleanPrintEngineVerification.test.jsx`

---

## 1. Observations

### 1.1 Dead Code in `src/utils/staticHtmlPdfEngine.js`
1. **Unreachable Multi-Pass Pagination in Browser (`enforceTwoColumnComponentPagination`)**:
   - At line 727:
     ```javascript
     const snapshot = customSnapshot !== undefined ? customSnapshot : captureEditorSnapshot();
     ```
   - In browser runtime, the CV editor is mounted and `#area-cv` exists in the document. `captureEditorSnapshot()` (lines 255–323) returns an object `{ width, height, pageHeightPx, brokenElements, totalPages }`.
   - At line 810:
     ```javascript
     if (snapshot && snapshot.brokenElements) {
       // Apply live editor breaks 1:1 into iframe (lines 812-906)
     ```
     Because `snapshot` is an object and `snapshot.brokenElements` is an `Array` (truthy in JavaScript, even when empty `[]`), the `if` branch is **always** taken in the browser.
   - At lines 907–927:
     ```javascript
     } else {
       // Fallback for headless environments without snapshot
       const { totalPages, targetHeightMm } = enforceTwoColumnComponentPagination(doc, areaCv, pageHeightPx);
       ...
     }
     ```
     This `else` block and `enforceTwoColumnComponentPagination` (lines 564–717) are **never executed** during client-side browser printing. They execute solely in headless / JSDOM unit tests where `#area-cv` is not attached to `document` or where `customSnapshot = null` is passed.
2. **Unused / Dead Function `renderItemHTML`**:
   - Lines 227–237:
     ```javascript
     export const renderItemHTML = (item, sectionType, isLast = false) => {
       if (!item) return '';
       return renderToStaticMarkup(
         React.createElement(PrintBaseItem, {
           item,
           sectionId: sectionType,
           sectionType,
           isLast
         })
       );
     };
     ```
     `renderItemHTML` is not called anywhere in `staticHtmlPdfEngine.js`, nor is it called anywhere else in `src/` or in `src/tests/`. Sections are rendered exclusively via `renderSectionHTML` (lines 242–247), which delegates directly to `PrintBaseSection`, which itself renders all section items.
3. **Unused Imports**:
   - Lines 16–17 and line 20:
     ```javascript
     import { normalizeItemContacts, getContactConfig } from './contactTypes';
     import { getBulletClasses } from './bulletStyles';
     ...
     import { PrintBaseItem } from '../components/CV/BaseItem';
     ```
     None of `normalizeItemContacts`, `getContactConfig`, or `getBulletClasses` are referenced anywhere in `staticHtmlPdfEngine.js`. `PrintBaseItem` is only used inside the unused `renderItemHTML`.
4. **Standalone / Unused Function `computeAdaptivePrintLayout`**:
   - Lines 113–154: `computeAdaptivePrintLayout(renderedHeight)` calculates adaptive scale. It is never called internally inside `staticHtmlPdfEngine.js` (which uses `calculatePrintScale` at lines 896 and 917). It is exported and tested in `src/tests/staticHtmlPdfEngine.test.js` and `src/tests/adversarial-spacing-layout-extremes.test.jsx`.

---

### 1.2 CSS Variable Propagation from Editor `#area-cv` to Print Iframe Root
1. **Editor Side (`src/App.jsx`)**:
   - Lines 527–537 and lines 752–781 define dynamic custom properties and apply them inline to `<div id="area-cv">`:
     ```javascript
     const dynamicSpacing = {
       "--body-font": currentFontFamily,
       "--font-scale": `${fontScale}`,
       "--title-scale": `${titleScale}`,
       "--body-scale": `${bodyScale}`,
       "--list-scale": `${listScale}`,
       "--line-height": `${lineHeight}`,
       "--page-padding": `${pagePadding}px`,
       "--section-gap": `${sectionGap}px`,
       "--item-gap": `${itemGap}px`,
     };
     ```
     In 2-column mode, it also sets:
     `--grid-template-columns`, `--left-col-percent`, `--left-bg`, `--right-bg`.
2. **Print Generation Side (`src/utils/staticHtmlPdfEngine.js`)**:
   - `captureEditorSnapshot()` (lines 255–323) captures geometry (`width`, `height`, `pageHeightPx`, `brokenElements`, `totalPages`), but does **not** extract or return any CSS custom properties.
   - `generateCleanPrintHTML` (lines 483–525) synthesizes a static `<style id="cv-base-styles">` tag with variables evaluated from `cvData.layout`, but hardcodes several core color and layout variables:
     ```css
     :root,
     #area-cv {
       --page-padding: ${pagePadding}px;
       --section-gap: ${sectionGap}px;
       --item-gap: ${itemGap}px;
       --title-color: #0f172a;
       --text-color: #334155;
       --text-color-light: #64748b;
       --container-color: #ffffff;
       --container-color-alt: #f3f4f6;
       --body-color: #ffffff;
       --first-color: #3874ff;
       ...
     ```
   - In `executeCleanPrint` (lines 838–842), the only CSS variables dynamically assigned to `#area-cv` in the iframe are:
     ```javascript
     areaCv.style.setProperty('--print-target-height-mm', `${targetHeightMm}mm`);
     areaCv.style.setProperty('--print-total-pages', String(totalPages));
     ```
   - **Absence**: There is currently **zero** propagation of CSS variables directly from the live DOM `#area-cv` (or `window.getComputedStyle(areaCv)`) to the print iframe's root element (`doc.documentElement` or `doc.body` or `:root`).

---

### 1.3 `gapPx = 20` in `src/App.jsx`
1. **Definition & Usage in `App.jsx`**:
   - Line 108:
     ```javascript
     const gapPx = 20;
     ```
   - Line 187:
     ```javascript
     const estimatedPages = Math.max(
        1,
        Math.ceil((currentMaxHeight + gapPx) / (pageHeightPx + gapPx)),
     );
     ```
   - Lines 193–194:
     ```javascript
     const foldTop = pageNum * pageHeightPx + (pageNum - 1) * gapPx;
     const foldBottom = foldTop + gapPx;
     const contentAreaBottom = foldTop - pagePadding;
     const nextContentAreaTop = foldBottom + pagePadding;
     ```
   - Line 273:
     ```javascript
     const finalPages = Math.max(
        1,
        Math.ceil((finalMaxHeight + gapPx) / (pageHeightPx + gapPx)),
     );
     ```
   - Line 767:
     ```javascript
     minHeight: totalPages > 1 ? `calc(${totalPages * 297}mm + ${(totalPages - 1) * 20}px)` : `${totalPages * 297}mm`,
     ```
   - Lines 783–801:
     ```jsx
     {/* Visual A4 Page Fold Guides (20px gap representation in live editor) */}
     {Array.from({ length: Math.max(0, totalPages - 1) }).map((_, i) => (
        <div
           key={`page-fold-${i}`}
           className="a4-page-fold-guide no-print"
           data-testid={`a4-page-fold-${i + 1}`}
           style={{
              position: "absolute",
              top: `calc(${(i + 1) * 297}mm + ${i * 20}px)`,
              left: 0,
              right: 0,
              height: "20px",
              zIndex: 35,
              pointerEvents: "none",
           }}>
           <div className="a4-page-fold-line" />
           <span className="a4-page-fold-badge">Página {i + 2}</span>
        </div>
     ))}
     ```
2. **Mirror in Layout Context (`src/context/hooks/useCVLayout.js`)**:
   - Line 41:
     ```javascript
     const pageGapPx = 20; // 20px gap visual representation in live editor
     ```
3. **Absence in Print**:
   - In `src/utils/staticHtmlPdfEngine.js`:
     Line 836: `const targetHeightMm = totalPages * 297;` (no 20px addition).
     Line 423: `margin-top: var(--page-padding, 24px) !important;` (no `pushDistance` with 20px).
   - In `src/styles/print.css`:
     Line 47: `min-height: var(--print-target-height-mm, 297mm) !important;`.
     Zero occurrence of `20px` page gap rules.

---

### 1.4 `margin-top` on Page Breaks in `snapshotBreaksCSS` and DOM Injection (~Line 825)
1. **Dynamic CSS Generation (`snapshotBreaksCSS`)**:
   - Lines 420–425 of `src/utils/staticHtmlPdfEngine.js`:
     ```javascript
     ${selector} {
       break-before: page !important;
       page-break-before: always !important;
       margin-top: var(--page-padding, 24px) !important;
     }
     ```
2. **DOM Injection in `executeCleanPrint`**:
   - Lines 822–829 of `src/utils/staticHtmlPdfEngine.js`:
     ```javascript
     if (targetEl) {
       targetEl.style.setProperty('break-before', 'page', 'important');
       targetEl.style.setProperty('page-break-before', 'always', 'important');
       targetEl.style.setProperty('margin-top', 'var(--page-padding, 24px)', 'important');
       targetEl.classList.add('force-page-break-before');
       targetEl.setAttribute('data-page-break-forced', 'true');
       targetEl.setAttribute('data-page-break-fold', String(b.fold || b.pageNum || 1));
     }
     ```
3. **Print Stylesheet (`src/styles/print.css`)**:
   - Lines 100–111:
     ```css
     .force-page-break-before {
       break-before: page !important;
       page-break-before: always !important;
       margin-top: var(--page-padding, 24px) !important;
     }

     [data-editor-break-forced="true"] {
       break-before: page !important;
       page-break-before: always !important;
       margin-top: var(--page-padding, 24px) !important;
     }
     ```
4. **Recent Git Change**:
   - Commit `216ae63` ("Eliminadas reglas residuales para CTRL+P") specifically replaced `margin-top: 0 !important;` (and `'0px'`) with `var(--page-padding, 24px) !important` in both lines 423 and 825.
5. **Divergence in JSDOM Fallback**:
   - Line 669 in `enforceTwoColumnComponentPagination`:
     ```javascript
     item.style.setProperty('margin-top', `${pushDistance + 10}px`, 'important');
     ```
     This fallback still sets an ad-hoc pixel margin instead of `var(--page-padding, 24px)`.

---

### 1.5 `min-height: 594mm` in 2-Column Layout and `box-decoration-break: clone`
1. **Styles in `src/styles/print.css`**:
   - Lines 45–55:
     ```css
     .resume__left,
     .resume__right {
       min-height: var(--print-target-height-mm, 297mm) !important;
       height: 100% !important;
       align-self: stretch !important;
       box-sizing: border-box !important;
       -webkit-print-color-adjust: exact !important;
       print-color-adjust: exact !important;
       -webkit-box-decoration-break: clone !important;
       box-decoration-break: clone !important;
     }
     ```
2. **Inline Assignments in `staticHtmlPdfEngine.js`**:
   - Lines 836–857:
     ```javascript
     const totalPages = snapshot.totalPages || maxFold;
     const targetHeightMm = totalPages * 297;

     if (areaCv && areaCv.style) {
       areaCv.style.setProperty('min-height', `${targetHeightMm}mm`, 'important');
       areaCv.style.setProperty('--print-target-height-mm', `${targetHeightMm}mm`);
       areaCv.style.setProperty('--print-total-pages', String(totalPages));
     }

     const leftCol = areaCv?.querySelector?.('.resume__left');
     const rightCol = areaCv?.querySelector?.('.resume__right');
     if (leftCol && leftCol.style) {
       leftCol.style.setProperty('min-height', `${targetHeightMm}mm`, 'important');
       leftCol.style.setProperty('height', '100%', 'important');
       leftCol.style.setProperty('align-self', 'stretch', 'important');
       leftCol.style.setProperty('box-sizing', 'border-box', 'important');
     }
     if (rightCol && rightCol.style) {
       rightCol.style.setProperty('min-height', `${targetHeightMm}mm`, 'important');
       ...
     ```
   - For a 2-page document, `targetHeightMm = 2 * 297 = 594mm`. Both `.resume__left` and `.resume__right` are forced to `min-height: 594mm !important`.
3. **Container Padding in `staticHtmlPdfEngine.js`**:
   - Line 433: `.resume__left` has `padding: var(--page-padding, 2rem) var(--page-padding, 1.5rem);`.
   - Line 436: `.resume__right` has `padding: var(--page-padding, 2rem) var(--page-padding, 1.5rem);`.
4. **Behavioral Interaction**:
   - `box-decoration-break: clone` causes each fragmented box slice (on Page 1, Page 2, etc.) to replicate the container's padding and borders.
   - If a child item on Page 2 has `break-before: page` and `margin-top: var(--page-padding, 24px) !important`, and the column container fragment on Page 2 independently applies `padding-top: var(--page-padding, 24px)`, the child's margin does not collapse through the parent's padding in CSS block formatting. The child is displaced by `24px + 24px = 48px` from the top of Page 2.

---

### 1.6 Git History Hotspots (`git log --oneline -40`)
1. **Commit Log**:
   ```
   216ae63 Eliminadas reglas residuales para CTRL+P
   3fec98b refactor: Template+Factory pattern, context decomposition, code audit
   022bb8a feat(dnd): drag & drop desde cualquier zona no-texto del elemento hoverado
   6a93c36 Mejora en el trabajo de paridad para impresion PDF
   80db2bf Merge branch 'Reimplementacion-con-React' of https://github.com/juani981/Ressume into Reimplementacion-con-React
   0f2f144 WIP: Fixes de paridad con pdf
   02a9aab WIP: Fixes de paridad con pdf
   bae30e0 feat: Concatenate 0px integrated bottom spacer to base containers with edge resize
   721edb2 feat: Add vertically resizable blank spacer component with pixel-perfect PDF print fidelity
   520cc63 Favicon added
   75baffb Major cleanup of rewrites
   bbede02 Ckeckpoint 8AM
   68fc895 Mejora la paridad de impresion PDF, y corte de pagina
   ea3a7c5 tutorial guarda estado y permite saltear
   321efdc Fixes varios de CSS e impresión PDF
   b6d8239 Comentados estilos legacy, mejora en la UI y consistencia
   5ca6bfb Refactor de impresion PDF
   ```
2. **Frequency of Modification**:
   - `src/utils/staticHtmlPdfEngine.js`: Touched in >12 commits.
   - `src/App.jsx`: Touched in >15 commits.
   - `src/styles/print.css`: Touched in >10 commits.
3. **Core Regression Themes**:
   - **Page break margins**: Oscillations between `margin-top: 0`, `pushDistance`, and `var(--page-padding)`.
   - **Orphan headers**: Section titles separating from child items across page boundaries (addressed in `6a93c36`).
   - **2-page clamping / spurious blank pages**: Small sub-pixel font overflow triggering a 3rd blank page, leading to `calculatePrintScale` and `doc.body.style.zoom` capping.
   - **CTRL+P style leaks**: Bare CSS rules outside `@media print` leaking into editor view (addressed in `216ae63`).

---

## 2. Logic Chain

1. **Dead Code Assessment**:
   - From Observation 1.1.1, `executeCleanPrint` branches on `if (snapshot && snapshot.brokenElements)`. Because `snapshot` is created by `captureEditorSnapshot()` against the live `#area-cv` DOM, `snapshot.brokenElements` is always an initialized array `[]` (truthy).
   - Therefore, lines 907–927 and `enforceTwoColumnComponentPagination` (lines 564–717) cannot be reached in any standard browser session.
   - However, because Vitest suites (`two-column-pdf-pagination-and-extension.test.jsx`) import and test `enforceTwoColumnComponentPagination` directly, removing this function would cause test regression.
   - In contrast, from Observation 1.1.2, `renderItemHTML` is not called anywhere in production or tests. Its imported dependency `PrintBaseItem` is also solely referenced by it. Thus, `renderItemHTML` is completely dead.
   - From Observation 1.1.3, `normalizeItemContacts`, `getContactConfig`, and `getBulletClasses` are unused imports left over from previous refactorings.

2. **CSS Variable Propagation Logic**:
   - From Observation 1.2.1, the editor dynamically modifies custom properties on `#area-cv` (such as spacing sliders, font scales, colors).
   - From Observation 1.2.2, `generateCleanPrintHTML` reconstructs `<style id="cv-base-styles">` from `cvData.layout`, but with hardcoded defaults for color variables (`--title-color`, `--text-color`, etc.), and `executeCleanPrint` does not copy computed styles or inline styles from the editor's `#area-cv` to the iframe's root element.
   - Therefore, any CSS custom properties modified on `#area-cv` that are not explicitly represented in `cvData.layout` or are overridden by the hardcoded defaults in `:root, #area-cv` fail to propagate to the print output.
   - Propagating all `--*` properties from `document.getElementById('area-cv')` to `doc.documentElement.style` inside `executeCleanPrint` provides complete CSS variable fidelity without relying on hardcoded defaults.

3. **Editor `gapPx = 20` Invariant**:
   - From Observation 1.3.1, `App.jsx` uses a 20px gap (`gapPx = 20`) to calculate fold positions and render `.a4-page-fold-guide`.
   - In the editor, `#area-cv` is a continuous scrollable element. Without a visual gap and badge, the user cannot see where A4 page boundaries lie. Pushing an element past the fold requires jumping over the 20px visual badge.
   - From Observation 1.3.3, physical paper printed via `@page { size: A4; margin: 0; }` has no 20px gap between physical sheets; each page starts at 0mm.
   - Therefore, `gapPx = 20` must remain strictly editor-only. It must never be injected into print stylesheets or `staticHtmlPdfEngine.js`. A prominent documentation block comment at `App.jsx` line 108 is required to prevent future developers from introducing this offset into the print path.

4. **Page-Break `margin-top` Verification**:
   - From Observation 1.4.1, 1.4.2, and 1.4.4, commit `216ae63` updated both `snapshotBreaksCSS` and `executeCleanPrint` line 825 to use `var(--page-padding, 24px) !important`.
   - In single-column layout, `#area-cv` padding is not duplicated across sliced page breaks. If the broken element had `margin-top: 0`, it would touch the 0mm top edge of Page 2.
   - By setting `margin-top: var(--page-padding, 24px) !important`, the broken element receives the exact same vertical indentation on Page 2 as the initial content on Page 1.
   - Both locations currently conform to requirement R1.4.

5. **2-Column Layout `min-height: 594mm` and `box-decoration-break: clone`**:
   - From Observation 1.5.1 and 1.5.2, `targetHeightMm` is set to 594mm for a 2-page document, forcing `.resume__left` and `.resume__right` to 594mm.
   - This was introduced so that if one column has fewer items, its background color still stretches across the full height of Page 2.
   - From Observation 1.5.4, `box-decoration-break: clone` replicates the column's padding (`var(--page-padding)`) onto Page 2.
   - If an element on Page 2 inside a cloned column also receives `margin-top: var(--page-padding, 24px)`, the cumulative distance from the top of Page 2 is 48px rather than 24px.
   - In 1-column layout, `#area-cv` does not have `box-decoration-break: clone` (it defaults to `slice`), so this double-padding issue does not occur there.
   - For 2-column layout, background coverage across both pages is already guaranteed by `#area-cv`'s linear gradient (`background: linear-gradient(to right, ${leftBg} 0%, ...)`). Setting `box-decoration-break: slice` on the column containers or suppressing `margin-top` on Page 2 elements inside cloned columns prevents the 24px double-padding discrepancy.

6. **Git History Hotspots & Fragility**:
   - From Observation 1.6, `staticHtmlPdfEngine.js`, `App.jsx`, and `print.css` have been repeatedly refactored to resolve print parity issues.
   - The primary driver of previous bugs was subtle differences between editor continuous-canvas coordinate calculations (with `gapPx`) vs native print pagination (with `@page` and `break-before`).
   - Any refactoring must preserve the exact constants (`A4_PAGE_HEIGHT_PX = 1123`, `MAX_A4_2PAGE_HEIGHT_PX = 2246`, `MIN_SCALE_FLOOR = 0.75`) and ensure all 634 Vitest tests continue to pass.

---

## 3. Caveats

1. **JSDOM vs Real Browser Geometry**:
   - JSDOM does not calculate layout geometry (`getBoundingClientRect()` returns 0 for all coordinates unless explicitly mocked).
   - In unit tests, `captureEditorSnapshot()` behavior depends on mocks, whereas in a real browser it reads live DOM layout metrics.
2. **Browser Print Engine Discrepancies**:
   - CSS fragmentation (`box-decoration-break: clone` across grid containers) has minor implementation differences between Chromium (Blink), Safari (WebKit), and Firefox (Gecko). Chromium is the primary target for Ressume's PDF printing.
3. **No Code Edits Performed**:
   - As an Explorer agent, no source files were modified in `src/`. All findings, line numbers, and proposed code adjustments are documented for downstream implementation.

---

## 4. Conclusion & Actionable Recommendations

1. **Dead Code**:
   - Annotate `enforceTwoColumnComponentPagination` and lines 907–927 in `staticHtmlPdfEngine.js` with `// JSDOM-ONLY FALLBACK: unreachable in browser where #area-cv snapshot is available`. Do not remove, as unit tests assert its behavior.
   - Remove unused dead function `renderItemHTML` (lines 227–237) and unused imports (`normalizeItemContacts`, `getContactConfig`, `getBulletClasses`, `PrintBaseItem`).
   - Retain `computeAdaptivePrintLayout` (lines 113–154) as an exported utility to maintain test suite compatibility.
2. **CSS Variable Propagation**:
   - In `executeCleanPrint`, read all CSS custom properties (`--*`) set on `#area-cv` in the live editor:
     ```javascript
     const liveAreaCv = document.getElementById('area-cv');
     if (liveAreaCv && doc.documentElement) {
       for (let i = 0; i < liveAreaCv.style.length; i++) {
         const propName = liveAreaCv.style[i];
         if (propName.startsWith('--')) {
           const propVal = liveAreaCv.style.getPropertyValue(propName);
           doc.documentElement.style.setProperty(propName, propVal);
         }
       }
     }
     ```
   - Add an automated test verifying that custom variables set on `#area-cv` are present on `doc.documentElement` of the print iframe.
3. **`gapPx = 20` in `App.jsx`**:
   - Add a prominent block comment above line 108 in `src/App.jsx`:
     ```javascript
     // ARCHITECTURAL INVARIANT: gapPx = 20 represents the visual fold separator (.a4-page-fold-guide)
     // rendered between simulated A4 sheets in the live editor's continuous canvas.
     // This gap exists EXCLUSIVELY in the editor view and MUST NEVER be introduced into the print
     // path (print.css or staticHtmlPdfEngine.js), where physical paper is segmented by @page rules.
     ```
4. **`margin-top` on Page Breaks**:
   - Confirmed: Lines 423 and 825 in `staticHtmlPdfEngine.js` already use `var(--page-padding, 24px) !important`.
   - Update line 669 in the JSDOM fallback (`enforceTwoColumnComponentPagination`) to also use `var(--page-padding, 24px)` instead of `${pushDistance + 10}px` for consistency.
5. **2-Column Layout & `box-decoration-break: clone`**:
   - In `print.css`, evaluate changing `.resume__left, .resume__right` from `box-decoration-break: clone` to `box-decoration-break: slice`. Because `#area-cv` already paints the two-column background via its full-height linear gradient, `box-decoration-break: slice` preserves background continuity while preventing the 24px double-padding bug on Page 2.
6. **Redundant CSS in `executeCleanPrint`**:
   - Remove redundant inline style assignments (`leftCol.style.height = '100%'`, `alignSelf = 'stretch'`, `boxSizing = 'border-box'`) from lines 847–857, as these are already declared with `!important` in `src/styles/print.css`.

---

## 5. Verification Method

To independently verify all observations and conclusions:

1. **Verify Baseline Test Suite**:
   ```powershell
   npm test -- --run
   ```
   Must pass with 38 test files and 634 passing tests.
2. **Verify Clean Build**:
   ```powershell
   npm run build
   ```
   Must compile cleanly without errors.
3. **Inspect File Lines**:
   - Dead code: `src/utils/staticHtmlPdfEngine.js` lines 227–237 (`renderItemHTML`) and lines 564–717 (`enforceTwoColumnComponentPagination`).
   - CSS variables: `src/utils/staticHtmlPdfEngine.js` lines 483–525 and lines 838–842.
   - `gapPx`: `src/App.jsx` line 108, lines 193–194, and lines 783–801.
   - `margin-top`: `src/utils/staticHtmlPdfEngine.js` line 423 and line 825.
   - `box-decoration-break`: `src/styles/print.css` lines 53–54.
4. **Inspect Git Commits**:
   ```powershell
   git show 216ae63
   git show 6a93c36
   ```
