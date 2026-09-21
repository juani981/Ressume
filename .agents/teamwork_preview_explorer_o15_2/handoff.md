# Handoff Report — PDF Print Pipeline, Print CSS & Phantom Blank Page Investigation

**Agent**: teamwork_preview_explorer_o15_2  
**Working Directory**: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o15_2`  
**Parent Conversation ID**: `e37e5ed1-e0df-4191-b24a-a69a40581929`  
**Timestamp**: `2026-09-19T19:14:00Z`  
**Milestone**: Milestone 15 — PDF Print Engine & CSS Investigation  

---

## 1. Observation

### 1.1 Source Code and Test Verification Baseline
- Running `npm test -- --run` verified that **58 test files** and **896 tests** currently pass 100% with 0 failures:
  ```text
  Test Files  58 passed (58)
       Tests  896 passed (896)
    Duration  16.98s
  ```

### 1.2 Pipeline Entry Point and Live Editor Snapshot
- In `src/context/hooks/useCVExport.js` (lines 31–69), export is triggered by `exportCleanPDF(cvData, activeLanguage)` calling `executeCleanPrint(cvData, activeLanguage)`.
- In `src/utils/staticHtmlPdfEngine.js`:
  - `captureEditorSnapshot()` (lines 206–262) inspects the live `#area-cv` container.
  - Queries all nodes with `[data-editor-break-forced="true"]` (titles, section blocks, bullet list items):
    ```javascript
    218: const brokenNodes = areaCv.querySelectorAll('[data-editor-break-forced="true"]');
    ```
  - Reads `data-total-pages` on `#area-cv` (set by `usePaginationEngine.js` calling `executePaginationAlgorithm` in `src/utils/paginationEngine.js`).
  - In a 2-column document (`resume bd-grid`), `executePaginationAlgorithm` pushes elements in BOTH columns:
    - Left column element crossing fold 1 receives `data-editor-break-forced="true"` and `data-editor-break-fold="1"`.
    - Right column element crossing fold 1 receives `data-editor-break-forced="true"` and `data-editor-break-fold="1"`.

### 1.3 Memory DOM Cloning and Sanitization (`createSanitizedPrintClone`)
- In `src/utils/staticHtmlPdfEngine.js` (lines 545–710):
  - Clones `#area-cv` via `cloneNode(true)`.
  - Strips non-add editor UI artifacts: `.round-btn-del`, `.section-del-btn`, `.item-del-btn`, `.drag-handle`, `.column-resizer`, `.obsidian-callout`, `.suggestion-tooltip`, `.action-menu`, `.a4-page-fold-guide`, etc.
  - Preserves integrated spacers with real height; converts add controls (`.column-add-section`, `.bullet-add-row`, etc.) into invisible structural spacers (`.print-transparent-spacer`) with `visibility: hidden !important; opacity: 0 !important; display: inherit !important`.
  - Removes empty placeholders (`[data-is-empty="true"]`) and `contenteditable`.
  - Strips list bullets (`ul, ol, li { list-style: none !important }`).
  - Evaluates parallel breaks (lines 634–672):
    ```javascript
    634: const hasParallelColumnBreaks = Boolean(
    635:   clone.querySelector('.resume__left [data-editor-break-forced="true"]') &&
    636:   clone.querySelector('.resume__right [data-editor-break-forced="true"]')
    637: );
    638: if (hasParallelColumnBreaks) {
    639:   clone.querySelectorAll('[data-editor-break-forced="true"]').forEach((node) => {
    640:     node.style.setProperty('break-before', 'auto', 'important');
    641:     node.style.setProperty('page-break-before', 'auto', 'important');
    642:     node.style.setProperty('margin-top', '0', 'important');
    643:     node.classList.remove('force-page-break-before', 'break-page-before');
    644:     node.removeAttribute('data-page-break');
    645:     node.removeAttribute('data-page-break-before');
    646:   });
    647: } else {
    648:   clone.querySelectorAll('[data-editor-break-forced="true"]').forEach((node) => {
    649:     node.style.setProperty('break-before', 'page', 'important');
    650:     node.style.setProperty('page-break-before', 'always', 'important');
    651:     node.style.setProperty('padding-top', 'var(--page-padding, 24px)', 'important');
    652:     node.style.setProperty('margin-top', '0', 'important');
    653:     node.classList.add('force-page-break-before', 'break-page-before');
    654:     node.setAttribute('data-page-break', 'before');
    655:     node.setAttribute('data-page-break-before', 'true');
    656:     node.setAttribute('data-page-break-forced', 'true');
    ...
    ```

### 1.4 The Break Re-Injection in `executeCleanPrint` and `generateCleanPrintHTML`
- Even though `createSanitizedPrintClone` neutralizes parallel breaks, `executeCleanPrint` and `generateCleanPrintHTML` generate `snapshotBreaksCSS`:
  ```javascript
  1042: if (snapshot?.brokenElements?.length > 0) {
  1043:   const seenFolds = new Set();
  1044:   snapshotBreaksCSS = snapshot.brokenElements.map(b => {
  1045:     const selector = b.isTitle
  1046:       ? `[data-section-title="${b.sectionId}"]`
  1047:       : (b.itemId ? `[data-item-id="${b.itemId}"]` : `[data-section-id="${b.sectionId}"]`);
  1048:     const foldKey = String(b.fold || b.pageNum || 1);
  1049:     const isDuplicateParallelFold = is2Col && seenFolds.has(foldKey);
  1050:     seenFolds.add(foldKey);
  1051: 
  1052:     if (isDuplicateParallelFold) {
  1053:       return `
  1054:         ${selector} {
  1055:           break-before: auto !important;
  1056:           page-break-before: auto !important;
  1057:           padding-top: var(--page-padding, 24px) !important;
  1058:           margin-top: 0 !important;
  1059:         }
  1060:       `;
  1061:     }
  1062: 
  1063:     return `
  1064:       ${selector} {
  1065:         break-before: page !important;
  1066:         page-break-before: always !important;
  1067:         padding-top: var(--page-padding, 24px) !important;
  1068:         margin-top: 0 !important;
  1069:       }
  1070:     `;
  1071:   }).join('\n');
  1072: }
  ```
- And directly inside the iframe DOM (lines 1162–1176):
  ```javascript
  1164: const isDuplicate = is2Col && seenIframeFolds.has(foldKey);
  1165: seenIframeFolds.add(foldKey);
  1166: if (isDuplicate) {
  1167:   targetEl.style.setProperty('break-before', 'auto', 'important');
  1168:   targetEl.style.setProperty('page-break-before', 'auto', 'important');
  1169: } else {
  1170:   targetEl.style.setProperty('break-before', 'page', 'important');
  1171:   targetEl.style.setProperty('page-break-before', 'always', 'important');
  1172:   targetEl.classList.add('force-page-break-before', 'break-page-before');
  1173: }
  ```
- And immediately after, `enforceTwoColumnComponentPagination` is executed (lines 1244–1246):
  ```javascript
  1244: if (is2Col && areaCv) {
  1245:   enforceTwoColumnComponentPagination(doc, areaCv, pageHeightPx);
  1246: }
  ```
  Inside `enforceTwoColumnComponentPagination` (lines 878–885):
  ```javascript
  878: targetBreakElement.style.setProperty('break-before', 'page', 'important');
  879: targetBreakElement.style.setProperty('page-break-before', 'always', 'important');
  880: targetBreakElement.classList.add('force-page-break-before', 'break-page-before');
  881: targetBreakElement.setAttribute('data-page-break', 'before');
  882: targetBreakElement.setAttribute('data-page-break-before', 'true');
  883: targetBreakElement.setAttribute('data-page-break-forced', 'true');
  884: targetBreakElement.setAttribute('data-page-break-column', col.name);
  885: targetBreakElement.setAttribute('data-page-break-fold', String(pageNum));
  ```
  And lines 1298–1316 (anti-orphan title safeguard):
  ```javascript
  1309: titleEl.style.setProperty('break-before', 'page', 'important');
  1310: titleEl.style.setProperty('page-break-before', 'always', 'important');
  1311: titleEl.classList.add('force-page-break-before', 'break-page-before');
  ```

### 1.5 Print CSS Rules in `src/styles/print.css`
- Lines 60–67:
  ```css
  /* 2-Column Mode: Prevent parallel grid child breaks from cascading */
  .resume.bd-grid .resume__left .break-page-before,
  .resume.bd-grid .resume__right .break-page-before,
  .resume.bd-grid .resume__left .force-page-break-before,
  .resume.bd-grid .resume__right .force-page-break-before {
    break-before: auto !important;
    page-break-before: auto !important;
  }
  ```
- Lines 166–175:
  ```css
  .break-page-before:not(:first-child),
  .force-page-break-before:not(:first-child),
  [data-page-break="before"]:not(:first-child),
  [data-page-break-before="true"]:not(:first-child),
  [data-editor-break-forced="true"]:not(:first-child) {
    break-before: page !important;
    page-break-before: always !important;
    padding-top: var(--page-padding, 24px) !important;
    margin-top: 0 !important;
  }
  ```
- Notice:
  - Lines 61–67 only match `.break-page-before` and `.force-page-break-before`.
  - They do NOT match `[data-editor-break-forced="true"]`, `[data-page-break="before"]`, or IDs/section-titles generated by `snapshotBreaksCSS`.
  - Lines 166–175 match `[data-editor-break-forced="true"]:not(:first-child)` with `break-before: page !important`.
  - Furthermore, inline styles with `!important` take cascade precedence over all stylesheet rules.

### 1.6 Zoom-MinHeight Scaling Desynchronization
- In `executeCleanPrint` (lines 1217–1234):
  ```javascript
  1218: scale = calculatePrintScale(rawHeight, totalPages);
  1219: if (doc.body?.style) {
  1220:   doc.body.style.zoom = scale;
  1221: }
  ...
  1227: const effectiveTargetMm = scale < 1.0 ? +(targetHeightMm * scale).toFixed(2) : targetHeightMm;
  1230: areaCv.style.setProperty('min-height', `${effectiveTargetMm}mm`, 'important');
  ```
- However, when `enforceTwoColumnComponentPagination` runs (lines 935–948):
  ```javascript
  935: areaCv.style.setProperty('min-height', `${targetHeightMm}mm`, 'important');
  941: leftCol.style.setProperty('min-height', `${targetHeightMm}mm`, 'important');
  947: rightCol.style.setProperty('min-height', `${targetHeightMm}mm`, 'important');
  ```
  It overwrites `min-height` with unscaled `594mm`!

---

## 2. Logic Chain

### 2.1 Why 2-Column Mode Spawns Phantom Blank Pages (3 to 7 Pages)
1. **Parallel Column Page Break Desynchronization (Root Cause)**:
   - In the W3C CSS Paged Media Module and browser layout engines (Chromium Blink), an explicit page break (`break-before: page`, `page-break-before: always`) terminates the active page box and forces subsequent content into a new page box.
   - In 2-column mode (`#area-cv.bd-grid`), `.resume__left` and `.resume__right` are two independent grid cells flowing in parallel.
   - When an item in `.resume__left` receives `break-before: page`, the layout engine creates **Page 2** for that column.
   - When an item in `.resume__right` ALSO receives `break-before: page`, the browser cannot merge it into Page 2 because explicit breaks are sequential across the DOM tree. The browser terminates Page 2 and starts **Page 3** for the right column!
   - Result: Page 1 renders items before the break in both columns; Page 2 renders the left column's second page with an empty right column; Page 3 renders the right column's second page with an empty left column.
   - If an additional break exists on Page 2 (e.g. at fold 2), this process duplicates again, escalating the document to 5 or 7 pages with alternating blank columns!

2. **The Re-Injection Loophole**:
   - `createSanitizedPrintClone` correctly attempted to neutralize breaks when `hasParallelColumnBreaks` was true.
   - But `snapshotBreaksCSS` in the `<head>` re-introduced `break-before: page !important` for the first broken element of fold 1.
   - Then lines 1170–1171 of `executeCleanPrint` re-applied `break-before: page !important` inline to that element.
   - Then `enforceTwoColumnComponentPagination` ran and re-applied `break-before: page !important` inline to the second column!
   - Thus, both columns ended up with inline `break-before: page !important`.

3. **Inline Specificity Bypassing Print CSS**:
   - In CSS Cascading rules, an inline declaration with `!important` has highest precedence and cannot be overridden by stylesheet rules.
   - The rule in `print.css` (lines 61–67) was completely ignored by the browser because the elements had inline `style="break-before: page !important;"`.

4. **Zoom and `min-height` Calculation Mismatch**:
   - When `doc.body.style.zoom = 0.95` is set, `1mm` of CSS height equals `1 / 0.95 = 1.0526mm` of physical printed height.
   - When `enforceTwoColumnComponentPagination` set `areaCv.style.minHeight = '594mm'`, the physical height rendered as `594 / 0.95 = 625.26mm`.
   - The physical 2-page boundary is exactly `594mm`. An overflow of `31.26mm` (~1.2 inches) spills onto physical Page 3, spawning a phantom trailing blank page!

5. **Padding-Top Compounding**:
   - Every break injection adds `padding-top: var(--page-padding, 24px) !important`.
   - If a column contains multiple broken elements or bullets, the 24px padding compounds vertically (2 * 24px = 48px; 3 * 24px = 72px), expanding what should have been a 2200px document past 2246px and causing a page overflow.

### 2.2 Why ATS 1-Column Mode Behaves Correctly
- In ATS 1-column mode (`resume__single-column`), the document is a single sequential flow.
- A break (`break-before: page`) pushes the target element and all subsequent content down to the next page.
- There is no parallel column running alongside it, so no cross-column race condition or alternating blank column can occur.

---

## 3. Caveats

1. **JSDOM vs Browser Engine**:
   - Unit tests in Vitest run under JSDOM. JSDOM does not implement CSS paged media, layout fragmentation, or physical page rendering. Tests check DOM attributes (`style.breakBefore`, `getAttribute('data-page-break-forced')`).
   - Browser rendering engines (Chromium/WebKit) implement full CSS fragmentation. Any changes to `staticHtmlPdfEngine.js` must preserve attributes expected by existing Vitest unit tests while ensuring clean execution in the browser and Cypress E2E.
2. **Backward Compatibility**:
   - All 58 Vitest test files (896 tests) must remain 100% passing.
   - Proposed changes must not alter exported function signatures or strip assertions required by existing test suites.

---

## 4. Conclusion

The root cause of phantom blank pages, 3-to-7 page inflation, and alternating blank columns in 2-column mode is the application of explicit `break-before: page !important` on parallel column elements in CSS Grid, combined with inline `!important` style overrides, unscaled `min-height` in zoomed documents, and compounding `padding-top`.

In 2-column mode, synchronized multi-page flow matching the live editor must be achieved by:
1. **Neutralizing all `break-before: page` inside 2-column mode** (`.resume.bd-grid`), allowing the browser's native grid fragmentation engine with `break-inside: avoid !important` to paginate both columns organically in parallel.
2. **Ensuring `snapshotBreaksCSS` outputs `break-before: auto !important` for 2-column mode**, reserving `break-before: page !important` strictly for ATS 1-column mode.
3. **Preventing `executeCleanPrint` from re-injecting inline `break-before: page !important` in 2-column mode**.
4. **Preserving scaled `effectiveTargetMm`** so that `min-height` inside a zoomed document never exceeds the physical 2-page A4 height (`594mm`).
5. **Expanding `src/styles/print.css`** to guarantee complete selector neutralization for all break markers within `.resume.bd-grid`.

---

## 5. Proposed Implementation Changes

### 5.1 Proposed Changes in `src/styles/print.css`

Update lines 60–67 in `src/styles/print.css` to encompass all break attributes and data markers in 2-column mode:

```css
/* ===================================================================
   2-Column Mode: Prevent parallel grid child breaks from cascading
   Neutralize explicit breaks on all 2-column grid children to enforce
   synchronous parallel flow without alternating blank pages.
=================================================================== */
.resume.bd-grid .resume__left *,
.resume.bd-grid .resume__right *,
.resume.bd-grid .resume__left .break-page-before,
.resume.bd-grid .resume__right .break-page-before,
.resume.bd-grid .resume__left .force-page-break-before,
.resume.bd-grid .resume__right .force-page-break-before,
.resume.bd-grid [data-editor-break-forced="true"],
.resume.bd-grid [data-page-break="before"],
.resume.bd-grid [data-page-break-before="true"] {
  break-before: auto !important;
  page-break-before: auto !important;
  break-after: auto !important;
  page-break-after: auto !important;
}
```

Ensure lines 166–175 retain `break-before: page !important` for ATS mode and single-column layouts:
```css
/* Quiebre de página completa antes del elemento en 1 columna / modo ATS */
.resume__single-column .break-page-before:not(:first-child),
.resume__single-column .force-page-break-before:not(:first-child),
.resume__single-column [data-page-break="before"]:not(:first-child),
.resume__single-column [data-page-break-before="true"]:not(:first-child),
.resume__single-column [data-editor-break-forced="true"]:not(:first-child),
.break-page-before:not(:first-child),
.force-page-break-before:not(:first-child),
[data-page-break="before"]:not(:first-child),
[data-page-break-before="true"]:not(:first-child),
[data-editor-break-forced="true"]:not(:first-child) {
  break-before: page !important;
  page-break-before: always !important;
  padding-top: var(--page-padding, 24px) !important;
  margin-top: 0 !important;
}
```

### 5.2 Proposed Changes in `src/utils/staticHtmlPdfEngine.js`

1. **In `generateCleanPrintHTML` and `executeCleanPrint` for `snapshotBreaksCSS`**:
   When `is2Col` is true, broken elements must NOT be assigned `break-before: page !important`:
   ```javascript
   if (snapshot?.brokenElements?.length > 0) {
     const seenFolds = new Set();
     snapshotBreaksCSS = snapshot.brokenElements.map(b => {
       const selector = b.isTitle
         ? `[data-section-title="${b.sectionId}"]`
         : (b.itemId ? `[data-item-id="${b.itemId}"]` : `[data-section-id="${b.sectionId}"]`);
       const foldKey = String(b.fold || b.pageNum || 1);
       const isDuplicateParallelFold = is2Col && seenFolds.has(foldKey);
       seenFolds.add(foldKey);

       if (is2Col) {
         return `
           ${selector} {
             break-before: auto !important;
             page-break-before: auto !important;
             padding-top: var(--page-padding, 24px) !important;
             margin-top: 0 !important;
           }
         `;
       }

       return `
         ${selector} {
           break-before: page !important;
           page-break-before: always !important;
           padding-top: var(--page-padding, 24px) !important;
           margin-top: 0 !important;
         }
       `;
     }).join('\n');
   }
   ```

2. **In `executeCleanPrint` DOM Break Application**:
   When applying `snapshot.brokenElements` in the iframe DOM:
   ```javascript
   if (is2Col) {
     targetEl.style.setProperty('break-before', 'auto', 'important');
     targetEl.style.setProperty('page-break-before', 'auto', 'important');
     targetEl.classList.remove('force-page-break-before', 'break-page-before');
   } else {
     targetEl.style.setProperty('break-before', 'page', 'important');
     targetEl.style.setProperty('page-break-before', 'always', 'important');
     targetEl.classList.add('force-page-break-before', 'break-page-before');
   }
   targetEl.style.setProperty('padding-top', 'var(--page-padding, 24px)', 'important');
   targetEl.style.setProperty('margin-top', '0', 'important');
   targetEl.setAttribute('data-page-break', 'before');
   targetEl.setAttribute('data-page-break-before', 'true');
   targetEl.setAttribute('data-page-break-forced', 'true');
   targetEl.setAttribute('data-page-break-fold', foldKey);
   ```

3. **In `executeCleanPrint` Container Scaling and `enforceTwoColumnComponentPagination` Guard**:
   Ensure `enforceTwoColumnComponentPagination` does not clobber `effectiveTargetMm` when `snapshot` is provided or in browser execution:
   ```javascript
   if (snapshot) {
     // Snapshot from live editor is authoritative: bypass second-pass DOM recalculation in browser
     // which introduces conflicting inline breaks.
   } else if (is2Col && areaCv) {
     enforceTwoColumnComponentPagination(doc, areaCv, pageHeightPx);
   }
   ```
   And ensure `effectiveTargetMm` is preserved on `areaCv`, `leftCol`, and `rightCol`:
   ```javascript
   if (areaCv && areaCv.style) {
     areaCv.style.setProperty('min-height', `${effectiveTargetMm}mm`, 'important');
     areaCv.style.setProperty('--print-target-height-mm', `${effectiveTargetMm}mm`);
     areaCv.style.setProperty('--print-total-pages', String(totalPages));
   }
   if (leftCol && leftCol.style) {
     leftCol.style.setProperty('min-height', `${effectiveTargetMm}mm`, 'important');
   }
   if (rightCol && rightCol.style) {
     rightCol.style.setProperty('min-height', `${effectiveTargetMm}mm`, 'important');
   }
   ```

---

## 6. Verification Method

### 6.1 Independent Verification Commands
1. Run full Vitest suite to verify zero regressions across all 58 test files:
   ```bash
   npm test -- --run
   ```
2. Build production bundle to verify compilation:
   ```bash
   npm run build
   ```
3. Run Cypress E2E print test suite:
   ```bash
   npx cypress run --spec "cypress/e2e/*print*.cy.js"
   ```

### 6.2 Files to Inspect
- `src/utils/staticHtmlPdfEngine.js` (lines 401–432, 634–672, 1041–1072, 1148–1246)
- `src/styles/print.css` (lines 60–67, 166–175)
- `cypress/e2e/02-print-geometry-and-pagination.cy.js`

### 6.3 Invalidation Conditions
- Any Vitest test failure (must maintain 58/58 files passing, 896/896 tests).
- Any Cypress test failure asserting on `#area-cv` geometry or print stylesheets.
- Any regression in ATS 1-column mode layout or print pagination.
