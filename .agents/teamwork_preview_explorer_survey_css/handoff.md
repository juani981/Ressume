# CSS Architecture Single Source of Truth Survey & Audit Report

## 1. Observation

### 1.1 `src/index.css` `@media print` Check
- **Target File**: `C:\Users\usuariodgc\Documents\Ressume\src\index.css` (1805 lines, 43194 bytes)
- **Command & Output**:
  - `grep_search` for `@media print`: 0 results.
  - `Select-String -Path "src/index.css" -Pattern "@media"`: 0 results.
  - `Select-String -Path "src/index.css" -Pattern "print"`: 0 results.
- **Git Diff Confirmation**:
  - In commit `216ae63` ("Eliminadas reglas residuales para CTRL+P"), lines 1771–2010 (234 lines) were deleted from `src/index.css`:
    ```diff
    -/* ==========================================================
    -   PRINT STYLES (For Native Browser Printing & Clean PDFs)
    -   ========================================================== */
    -@media print {
    -  .a4-page-fold-guide { display: none !important; }
    ... (234 lines removed)
    ```
- **Finding**: `src/index.css` is completely clean of all `@media print` blocks and print-specific selectors.

---

### 1.2 `src/styles/print.css` Structure, Top-Level Rules, and `var()` Audit
- **Target File**: `C:\Users\usuariodgc\Documents\Ressume\src\styles\print.css` (198 lines, 5026 bytes)
- **Selector Wrapping Observation**:
  - Lines 7–10:
    ```css
    @page {
      size: A4;
      margin: 0;
    }
    ```
    This rule is declared bare at the root level, outside any `@media print` query.
  - Line 12: `@media print {` begins.
  - Lines 13–16:
    ```css
      @page {
        size: A4;
        margin: 0;
      }
    ```
    This duplicates the bare rule inside `@media print`.
  - Lines 18–196: All other rules are nested inside the single `@media print { ... }` block ending at line 197.
- **Top-Level `:root` Observation**:
  - Number of `:root` blocks in `src/styles/print.css`: 0. Neither top-level nor inside `@media print`.
- **`var()` Fallback Usage Audit**:
  Across all 198 lines, exactly 6 `var(...)` invocations exist:
  1. Line 47: `min-height: var(--print-target-height-mm, 297mm) !important;`
     - Target: `.resume__left, .resume__right`
     - Fallback: `297mm` (Present and valid).
  2. Line 60: `padding: var(--page-padding, 24px) !important;`
     - Target: `#area-cv.resume__single-column`
     - Fallback: `24px` (Present and valid).
  3. Line 103: `margin-top: var(--page-padding, 24px) !important;`
     - Target: `.force-page-break-before`
     - Fallback: `24px` (Present and valid).
  4. Line 109: `margin-top: var(--page-padding, 24px) !important;`
     - Target: `[data-editor-break-forced="true"]`
     - Fallback: `24px` (Present and valid).
  5. Line 132: `margin-bottom: var(--mb-3, 1.5rem) !important;`
     - Target: `.resume--ats-mode .section-title, .resume__single-column .section-title`
     - Fallback: `1.5rem` (Present and valid).
  6. Line 181: `color: var(--circle-color, var(--text-color)) !important;`
     - Target: `ul.experience__bullets li::marker, .experience__bullets li::marker, ul.simple-list-ul li::marker`
     - Analysis: `--circle-color` falls back to `var(--text-color)`. However, `var(--text-color)` lacks a fallback! If neither `--circle-color` nor `--text-color` is set in the cascade, the CSS declaration becomes invalid at computed-value time.

---

### 1.3 Inline Styles in `src/utils/staticHtmlPdfEngine.js` vs `src/styles/print.css`
- **Target File**: `C:\Users\usuariodgc\Documents\Ressume\src\utils\staticHtmlPdfEngine.js` (981 lines)

#### A. In `executeCleanPrint`
1. **Lines 732–740** (`iframe.style`):
   ```javascript
   iframe.style.position = 'fixed';
   iframe.style.top = '-10000px';
   iframe.style.left = '-10000px';
   iframe.style.width = iframeWidth;
   iframe.style.minWidth = iframeWidth;
   iframe.style.height = '1123px';
   iframe.style.visibility = 'hidden';
   iframe.style.border = '0';
   ```
   - **Evaluation**: Necessary Dynamic / Infrastructure. Styles the host DOM iframe offscreen.
2. **Lines 798–801** (`ruler.style`):
   ```javascript
   ruler.style.height = '297mm';
   ruler.style.position = 'absolute';
   ruler.style.visibility = 'hidden';
   ruler.style.top = '-9999px';
   ```
   - **Evaluation**: Necessary Dynamic / Measurement. Temporary probe measuring exact browser DPI height for 297mm.
3. **Lines 823–825** (`targetEl.style`):
   ```javascript
   targetEl.style.setProperty('break-before', 'page', 'important');
   targetEl.style.setProperty('page-break-before', 'always', 'important');
   targetEl.style.setProperty('margin-top', 'var(--page-padding, 24px)', 'important');
   ```
   - **Evaluation**: Redundant with `print.css` lines 100–104 (`.force-page-break-before`) and dynamic `<style id="cv-snapshot-breaks">`, but acts as a defensive DOM-level fallback. Line 825 is confirmed to use `var(--page-padding, 24px)` (updated from `0px` in `216ae63`).
4. **Lines 839–841** (`areaCv.style`):
   ```javascript
   areaCv.style.setProperty('min-height', `${targetHeightMm}mm`, 'important');
   areaCv.style.setProperty('--print-target-height-mm', `${targetHeightMm}mm`);
   areaCv.style.setProperty('--print-total-pages', String(totalPages));
   ```
   - **Evaluation**: Necessary Dynamic. `targetHeightMm` (`totalPages * 297mm`) is computed at runtime based on snapshot folds.
5. **Lines 847–850 and 853–856** (`leftCol.style` & `rightCol.style`):
   ```javascript
   leftCol.style.setProperty('min-height', `${targetHeightMm}mm`, 'important');
   leftCol.style.setProperty('height', '100%', 'important');
   leftCol.style.setProperty('align-self', 'stretch', 'important');
   leftCol.style.setProperty('box-sizing', 'border-box', 'important');

   rightCol.style.setProperty('min-height', `${targetHeightMm}mm`, 'important');
   rightCol.style.setProperty('height', '100%', 'important');
   rightCol.style.setProperty('align-self', 'stretch', 'important');
   rightCol.style.setProperty('box-sizing', 'border-box', 'important');
   ```
   - **Evaluation**: Redundant Static with `print.css` lines 45–55:
     ```css
     .resume__left,
     .resume__right {
       min-height: var(--print-target-height-mm, 297mm) !important;
       height: 100% !important;
       align-self: stretch !important;
       box-sizing: border-box !important;
       ...
     }
     ```
     Because line 840 sets `--print-target-height-mm: ${targetHeightMm}mm` on `areaCv`, both columns inherit the variable and already receive `min-height`, `height: 100%`, `align-self: stretch`, and `box-sizing: border-box` from the stylesheet.
6. **Lines 705–714** in `enforceTwoColumnComponentPagination`:
   - Sets identical properties on `leftCol` and `rightCol`.
   - **Crucial Note**: `two-column-pdf-pagination-and-extension.test.jsx` lines 246–253 explicitly assert `expect(leftCol.style.minHeight).toBe('594mm')`, `expect(leftCol.style.height).toBe('100%')`, and `expect(leftCol.style.alignSelf).toBe('stretch')`. Because JSDOM does not evaluate CSS stylesheets, `enforceTwoColumnComponentPagination` serves as a JSDOM fallback that must retain these assignments to satisfy unit tests.
7. **Lines 897–902 / 918–922** (`doc.body.style.zoom = scale`):
   - **Evaluation**: Necessary Dynamic. Guard preventing accidental page spawning from minor sub-pixel font rendering differences.

#### B. In `generateCleanPrintHTML`
1. **Line 432** (`#area-cv` style string in 2-column layout):
   ```html
   <div class="${areaCvClasses}" id="area-cv" style="display: grid; grid-template-columns: ${gridColumns}; width: ${containerWidth || '794px'}; max-width: ${containerWidth || '794px'}; min-height: 297mm; height: 100%; margin: 0 auto; padding: 0; box-shadow: none; box-sizing: border-box; color: var(--text-color); background: linear-gradient(to right, ${leftBg} 0%, ${leftBg} ${leftColPercent}%, ${rightBg} ${leftColPercent}%, ${rightBg} 100%); ${dynamicSpacingStyle}">
   ```
   - **Necessary Dynamic**: `grid-template-columns: ${gridColumns}`, `background: linear-gradient(...)`, `width/max-width: ${containerWidth}`, and `${dynamicSpacingStyle}`.
   - **Redundant Static**: `margin: 0 auto; box-shadow: none; box-sizing: border-box;` already declared in `print.css` lines 37–42 with `!important`.
2. **Lines 433 & 436** (`.resume__left` and `.resume__right` style strings):
   ```html
   <div class="resume__left" style="background: ${leftBg}; min-height: 297mm; height: 100%; align-self: stretch; box-sizing: border-box; padding: var(--page-padding, 2rem) var(--page-padding, 1.5rem); color: var(--text-color); --title-color: ${leftColors.titleColor}; --text-color: ${leftColors.textColor}; --text-color-light: ${leftColors.textColorLight}; --circle-color: ${leftColors.circleColor}; --container-color-alt: ${leftColors.containerColorAlt};">
   ```
   - **Necessary Dynamic**: `background: ${leftBg}`, and column-specific CSS variables (`--title-color`, `--text-color`, `--text-color-light`, `--circle-color`, `--container-color-alt`).
   - **Redundant Static**: `min-height: 297mm; height: 100%; align-self: stretch; box-sizing: border-box; color: var(--text-color);` already declared in `print.css` lines 45–55.
3. **Lines 527–531** (`.resume__single-column` inside `<style id="cv-base-styles">`):
   ```css
   .resume__single-column {
     min-height: 297mm !important;
     box-sizing: border-box !important;
     padding: var(--page-padding, ${pagePadding}px) !important;
   }
   ```
   - **Evaluation**: Redundant with `print.css` lines 57–62:
     ```css
     #area-cv.resume__single-column {
       min-height: 297mm !important;
       box-sizing: border-box !important;
       padding: var(--page-padding, 24px) !important;
       background: #ffffff !important;
     }
     ```

---

### 1.4 CSS Variable Scoping Across Editor and Print
- **In the Editor (`App.jsx` lines 527–537 and 780)**:
  `#area-cv` receives inline custom properties via `style={{ ...dynamicSpacing, ... }}`:
  `--body-font`, `--font-scale`, `--title-scale`, `--body-scale`, `--list-scale`, `--line-height`, `--page-padding`, `--section-gap`, `--item-gap`, `--grid-template-columns`, `--left-col-percent`, `--left-bg`, `--right-bg`.
- **In `generateCleanPrintHTML` (lines 483–525)**:
  Variables are re-declared in `<style id="cv-base-styles">` under `:root, #area-cv { ... }`, and inline on `#area-cv` via `${dynamicSpacingStyle}`.
- **In `executeCleanPrint` (lines 780–845)**:
  - Observation: `executeCleanPrint` currently does **not** copy CSS custom properties set on the live editor `#area-cv` DOM element into the print iframe's root element (`doc.documentElement.style`).
  - If a user script, test harness, or theme modifies custom properties directly on the live DOM `#area-cv` element, they are not transferred to the print iframe.
  - Requirement R1.2 and R3.3 explicitly mandate transferring CSS variables from the editor's `#area-cv` to the print iframe's root element.

---

### 1.5 Git History Hotspots Touching CSS Files
- **Command**: `git log --oneline -40 -- src/styles/print.css src/index.css`
- **Key Hotspot Commits**:
  - `216ae63` (Most recent): Purged 234 lines of residual `@media print` from `src/index.css`. Consolidated rules into `src/styles/print.css`. Fixed `margin-top: var(--page-padding, 24px)` on forced page breaks in `staticHtmlPdfEngine.js`.
  - `022bb8a`: Fixed dnd interaction zones.
  - `6a93c36`: "Mejora en el trabajo de paridad para impresion PDF"
  - `0f2f144`: "WIP: Fixes de paridad con pdf"
  - `721edb2`: Blank spacer component with print fidelity.
  - `75baffb`: "Major cleanup of rewrites"
  - `68fc895`: "Mejora la paridad de impresion PDF, y corte de pagina"
  - `321efdc`: "Fixes varios de CSS e impresión PDF"
  - `5ca6bfb`: "Refactor de impresion PDF"
- **Hotspot Analysis**: Over 25% of recent commits directly touched `src/styles/print.css` or print-related sections of `src/index.css`. The primary cause of repeated regressions has been:
  1. Duplicate CSS rules across both files that desynchronized over time.
  2. Bare rules outside `@media print` that leaked into screen rendering or caused conflicting specificity.

---

## 2. Logic Chain

1. **Premise 1 (Single Source of Truth Invariant)**: `src/index.css` must contain only editor/screen styles. `src/styles/print.css` must contain all print-specific rules, strictly enclosed within a single `@media print { ... }` block so it never affects screen media.
   - *Observation 1.1*: `src/index.css` was confirmed to have 0 `@media print` blocks.
   - *Observation 1.2*: `src/styles/print.css` lines 7–10 declare `@page { size: A4; margin: 0; }` bare outside `@media print`, while lines 13–16 duplicate this exact rule inside `@media print`.
   - *Deduction*: Deleting lines 7–10 eliminates the bare rule, removes redundancy, and brings `src/styles/print.css` into 100% compliance with the single `@media print` enclosure requirement.

2. **Premise 2 (CSS Variable Fallback Safety)**: In CSS custom properties, if a variable lacks a fallback and is not defined in the scope, computed-value time fallback fails.
   - *Observation 1.2 (Line 181)*: `color: var(--circle-color, var(--text-color)) !important;` provides `var(--text-color)` as the fallback for `--circle-color`, but `var(--text-color)` itself has no fallback.
   - *Deduction*: If neither variable is bound in a container, the marker color reverts to `initial`. Providing a default fallback value matching `:root` (`var(--circle-color, var(--text-color, #334155))`) guarantees bullet marker rendering integrity in all environments.

3. **Premise 3 (Inline Style Minimization vs JSDOM Requirements)**: Styles declared in `print.css` should not be statically duplicated inline on elements in JavaScript, except where required for runtime dynamic calculation or JSDOM unit test compatibility.
   - *Observation 1.3*: In `executeCleanPrint` lines 847–856, `height: 100%`, `align-self: stretch`, and `box-sizing: border-box` are assigned inline to `leftCol` and `rightCol`. These exact properties are already declared with `!important` in `print.css` lines 48–50.
   - *Observation 1.3 (JSDOM caveat)*: In `enforceTwoColumnComponentPagination` lines 705–714, unit test `two-column-pdf-pagination-and-extension.test.jsx` lines 246–253 asserts `expect(leftCol.style.minHeight).toBe('594mm')`, `expect(leftCol.style.height).toBe('100%')`, and `expect(leftCol.style.alignSelf).toBe('stretch')`.
   - *Deduction*:
     - In `executeCleanPrint`, removing redundant static assignments (`height`, `align-self`, `box-sizing`) leaves `min-height` and dynamic CSS variables (`--print-target-height-mm`), delegating static box sizing to `print.css`.
     - In `enforceTwoColumnComponentPagination`, assignments should be retained and annotated with `// JSDOM-ONLY FALLBACK: Required for unit test assertions without real CSS engine` to prevent breaking tests.

4. **Premise 4 (CSS Variable Propagation to Print Root)**: CSS custom properties set dynamically on the live editor's `#area-cv` should propagate to the print document root.
   - *Observation 1.4*: `executeCleanPrint` currently builds the iframe document via `doc.write(html)`, but never inspects `document.getElementById('area-cv')` in the parent window to copy inline custom properties to `doc.documentElement.style`.
   - *Deduction*: Adding a routine in `executeCleanPrint` that loops over `editorAreaCv.style` and copies all `--*` properties to `doc.documentElement.style` guarantees 1:1 CSS variable propagation from editor DOM to print iframe DOM.

---

## 3. Caveats

1. **JSDOM vs Real Browser Geometry**: JSDOM does not render CSS stylesheets or calculate layout boxes (`getBoundingClientRect()` returns zeros, and stylesheet rules do not populate `element.style`). Unit tests in `src/tests/` rely on explicit `Object.defineProperty` mocks or inspect `element.style` directly. Any refactoring must preserve inline styles that JSDOM tests explicitly assert upon.
2. **`box-decoration-break: clone` on Columns**: `print.css` lines 53–54 specify `box-decoration-break: clone !important` on `.resume__left, .resume__right`. In browser print engines (Blink/WebKit), this clones padding on each printed page fragment. Because page breaks in `staticHtmlPdfEngine.js` inject `margin-top: var(--page-padding, 24px) !important` on the broken element, column padding should be carefully matched so that fragments do not accumulate double padding at the top of subsequent pages.
3. **Editor 20px Gap (`gapPx`)**: The 20px visual gap (`a4-page-fold-guide`) in `App.jsx` exists solely for on-screen editor UX and is excluded from print.

---

## 4. Conclusion

1. **`src/index.css`**: Verified 100% clean. No `@media print` blocks or print selectors remain.
2. **`src/styles/print.css`**:
   - Lines 7–10 contain a redundant bare `@page` rule outside `@media print`. Removing lines 7–10 achieves 100% media enclosure.
   - Line 181 (`var(--circle-color, var(--text-color))`) should be hardened to `var(--circle-color, var(--text-color, #334155))`.
   - All other rules correctly reside in a single `@media print { }` block with valid `var()` fallbacks.
3. **Inline Styles in `staticHtmlPdfEngine.js`**:
   - Redundant static styles on `leftCol` and `rightCol` in `executeCleanPrint` (lines 848–850, 854–856) can be safely removed, relying on `print.css`.
   - Dynamic styles (`--print-target-height-mm`, `min-height`, `zoom`, ruler, and iframe sizing) are strictly necessary and must be retained.
   - `enforceTwoColumnComponentPagination` must retain its assignments with `// JSDOM-ONLY FALLBACK` comments to preserve test compatibility.
4. **CSS Variable Propagation**:
   - Implement the transfer of CSS custom properties (`--*`) from the live editor `#area-cv` element to the print iframe's `doc.documentElement.style`.

---

## 5. Verification Method

### 5.1 Automated Command Verification
1. **Full Test Suite Run**:
   ```bash
   npm test -- --run
   ```
   *Expected result*: 38 test files pass, 634+ tests pass, 0 failures.
2. **Production Build Verification**:
   ```bash
   npm run build
   ```
   *Expected result*: Clean Vite production build with 0 errors and 0 warnings.
3. **CSS Print Block Verification Command**:
   ```powershell
   Select-String -Path "src/index.css" -Pattern "@media"
   ```
   *Expected result*: 0 matches.
4. **Print CSS Media Query Enclosure Command**:
   ```powershell
   Get-Content "src/styles/print.css" | Select-String -Pattern "^(?!\s*(\/\*|\*|\/|@media|@page|\s*$))"
   ```
   *Expected result*: Confirms all CSS selector rules are enclosed within `@media print { }`.

### 5.2 Proposed Concrete Patches for Implementer

#### Patch 1: `src/styles/print.css` — Remove bare `@page` and add fallback to line 181
```diff
--- a/src/styles/print.css
+++ b/src/styles/print.css
@@ -6,11 +6,6 @@
-@page {
-  size: A4;
-  margin: 0;
-}
-
 @media print {
   @page {
     size: A4;
     margin: 0;
   }
@@ -178,4 +173,4 @@
   ul.experience__bullets li::marker,
   .experience__bullets li::marker,
   ul.simple-list-ul li::marker {
-    color: var(--circle-color, var(--text-color)) !important;
+    color: var(--circle-color, var(--text-color, #334155)) !important;
     font-size: 0.85em;
   }
```

#### Patch 2: `src/utils/staticHtmlPdfEngine.js` — Transfer CSS variables from editor to iframe root
```javascript
// In executeCleanPrint, inside triggerPrint before measuring / printing:
if (typeof document !== 'undefined') {
  const editorAreaCv = document.getElementById('area-cv');
  if (editorAreaCv && editorAreaCv.style && doc.documentElement) {
    for (let i = 0; i < editorAreaCv.style.length; i++) {
      const prop = editorAreaCv.style[i];
      if (prop.startsWith('--')) {
        const val = editorAreaCv.style.getPropertyValue(prop);
        const priority = editorAreaCv.style.getPropertyPriority(prop);
        doc.documentElement.style.setProperty(prop, val, priority);
      }
    }
  }
}
```
