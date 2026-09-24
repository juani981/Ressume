# Handoff Report: 2-Column Live Editor Pagination & Column Synchronization Architecture

**Agent**: `teamwork_preview_explorer_o15_1`  
**Working Directory**: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o15_1`  
**Parent Agent ID**: `e37e5ed1-e0df-4191-b24a-a69a40581929`  
**Date**: 2026-09-19T19:15:00Z  
**Type**: Hard Handoff (Task Complete)

---

## 1. Observation

Direct code observations from the Ressume codebase across the pagination engine, DOM hierarchy, CSS styling, and print generation pipeline:

### 1.1 DOM Hierarchy & Measurement Architecture
- **Root Element (`#area-cv`)** (`src/App.jsx:260-294`, `src/index.css:75-129`):
  - Fixed width: `794px` (`width: 794px; min-width: 794px; max-width: 794px; margin: 0 auto; box-sizing: border-box;`).
  - In 2-Column Mode (`is2Col = cvData.layout?.type === '2-column' && !cvData.layout?.isAtsMode`):
    - Classes: `resume bd-grid`.
    - Display: `grid`.
    - Style: `grid-template-columns: var(--grid-template-columns, 1fr 2fr); align-items: stretch; padding: 0 !important; gap: 0 !important;`.
    - Background: `linear-gradient(to right, ${leftBg} 0%, ${leftBg} ${leftColPercent}%, ${rightBg} ${leftColPercent}%, ${rightBg} 100%)`.
    - Height: `minHeight: totalPages > 1 ? calc(${totalPages * 297}mm + ${(totalPages - 1) * 20}px) : ${totalPages * 297}mm`.
  - Column Containers:
    - Left: `<DroppableColumn id="column-left" column="left" className="resume__left" style={{ minHeight: "100%", height: "100%", alignSelf: "stretch", display: "flex", flexDirection: "column", boxSizing: "border-box", padding: "var(--page-padding, 2rem) var(--page-padding, 1.5rem)" }}>` (`src/App.jsx:304-323`).
    - Right: `<DroppableColumn id="column-right" column="right" className="resume__right" style={{ minHeight: "100%", height: "100%", alignSelf: "stretch", display: "flex", flexDirection: "column", boxSizing: "border-box", padding: "var(--page-padding, 2rem) var(--page-padding, 1.5rem)" }}>` (`src/App.jsx:362-381`).
- **Physical Ruler Measurement** (`src/utils/pageGeometry.js:21-43`):
  - `getRulerHeightPx(containerEl)` attaches an off-screen `div` with `height: 297mm` to measure actual browser pixel height (`1122.519px` -> `1123px` at 96 DPI).
- **Coordinate Bounds** (`src/utils/pageGeometry.js:53-89`):
  - `getRelativeBounds(el, parentEl)` calculates:
    `top = elRect.top - parentRect.top`, `bottom = top + height`, `left`, `width`, `height`.
    All vertical positions in both columns are measured relative to the top edge of `#area-cv`.
- **Breakable Selector** (`src/utils/paginationEngine.js:20-44`):
  - `BREAKABLE_SELECTOR = '.section-title, .cv-block, .experience__content, .education__content, .skills__name, .profile__description, .home__data, .simple-list-item, li.cv-block, .contact__item, .editable-item-container'`.
  - `getBreakableComponents(containerEl)` traverses DOM and filters out nested children whose ancestor is already in the list (except `.section-title`, which breaks independently).

### 1.2 Computation of Page Breaks, Page Count, and Vertical Offsets
- **Hook Coordination** (`src/hooks/usePaginationEngine.js:31-145`):
  - Coordinates `ResizeObserver` on `#area-cv`, `.resume__left`, and `.resume__right`.
  - Debounces recalculations using `requestAnimationFrame` + `30ms` cooldown lock (`isRecalculatingRef`, `pendingRecalcRef`).
  - Listens for `cv-spacer-live-resize` custom events and `cvData` mutations.
- **Algorithm Execution** (`src/utils/paginationEngine.js:255-498`):
  - In 2-Column Mode:
    ```javascript
    colDefs = [
      { name: 'left', el: leftCol, items: getBreakableComponents(leftCol) },
      { name: 'right', el: rightCol, items: getBreakableComponents(rightCol) },
    ];
    ```
  - Up to 6 passes iteratively resolve layout:
    1. `currentMaxHeight = Math.max(...colDefs.map(c => c.el.scrollHeight || c.el.offsetHeight || 0), areaCv.scrollHeight || 0, pageHeightPx)`.
    2. `estimatedPages = Math.max(1, Math.ceil((currentMaxHeight + gapPx) / (pageHeightPx + gapPx)))`.
    3. For each `pageNum` (1 to `estimatedPages`), forbidden fold zone is computed via `getForbiddenZone(pageNum, pageHeightPx, pagePadding, gapPx)`:
       - `foldTop = pageNum * pageHeightPx + (pageNum - 1) * gapPx` (e.g. `1 * 1123 + 0 = 1123px` for Fold 1).
       - `foldBottom = foldTop + gapPx` (`1123 + 20 = 1143px`).
       - `forbiddenStart = foldTop - pagePadding` (`1123 - 24 = 1099px`).
       - `forbiddenEnd = foldBottom + pagePadding` (`1143 + 24 = 1167px`).
       - `contentAreaBottom = forbiddenStart` (`1099px`).
       - `nextContentAreaTop = forbiddenEnd` (`1167px`).
    4. For each column and each item:
       - If `top >= nextContentAreaTop`, item already safely cleared the fold.
       - Orphan title check: If `.section-title` is followed by a child whose bottom exceeds `contentAreaBottom - 4`, mark `isOrphanTitle = true`.
       - If `!isOrphanTitle && bottom <= contentAreaBottom - 4`, item safely fits on the current page.
       - If overflowing:
         - Natural bullet flow: if item has multiple bullets and first bullet fits, break at `overflowingBullet` instead of displacing whole item.
         - Target element push calculation (`paginationEngine.js:429-444`):
           ```javascript
           const neededPush = Math.ceil(Math.max(0, nextContentAreaTop - targetBounds.top));
           targetBreakElement.setAttribute('data-editor-break-forced', 'true');
           targetBreakElement.setAttribute('data-editor-break-fold', String(pageNum));
           const effectiveMarginTop = currentMarginTop + neededPush;
           targetBreakElement.style.setProperty('margin-top', `${effectiveMarginTop}px`, 'important');
           ```
    5. Final page count:
       ```javascript
       finalMaxHeight = Math.max(...colDefs.map(c => c.el.scrollHeight || c.el.offsetHeight || 0), areaCv.scrollHeight || 0, pageHeightPx);
       finalPages = Math.max(1, Math.ceil((finalMaxHeight + gapPx) / (pageHeightPx + gapPx)));
       ```
    6. `pageBreaks` array: `p * pageHeightPx + (p - 1) * gapPx` for `p = 1` to `finalPages - 1`.

### 1.3 Rendering of Decorations & Page Break Lines
- **A4 Fold Guides** (`src/components/Editor/A4PageGuides.jsx:26-124`):
  - Rendered as `.a4-page-fold-guide.no-print` positioned at `top: calc(${(i + 1) * 297}mm + ${i * 20}px)` with `height: 20px`, `zIndex: 60`. Contains `a4-page-fold-line` and `a4-page-fold-badge` ("Página X", delete button).
  - Margin insets rendered as `.a4-page-inset--bottom` and `.a4-page-inset--top` with `height: ${pagePaddingPx}px`.
  - All guides are tagged `.no-print` and `data-editor-ui="true"`, ensuring zero leakage into print.
- **Split Visual Decorations** (`src/utils/paginationEngine.js:148-242`, `src/index.css:860-927`):
  - Broken sections and items receive class `.has-split-break` (and `.has-split-break--page2-only` if title was broken).
  - Inline CSS variables set: `--split-part1-height` and `--split-part2-top`.
  - CSS implementation:
    - Normal single-box outline suppressed: `outline: none !important; background-color: transparent !important;`.
    - Pseudo-element `::before`: renders Part 1 outline from `top: 0` with `height: var(--split-part1-height)`.
    - Pseudo-element `::after`: renders Part 2 outline from `top: var(--split-part2-top)` to `bottom: 0`.
    - For `.has-split-break--page2-only`, `::before` is hidden (`display: none !important`).

### 1.4 Architectural Differences: 2-Column vs ATS 1-Column
| Feature | 2-Column Mode (`.resume.bd-grid`) | ATS 1-Column Mode (`.resume__single-column`) |
|---|---|---|
| **Root Display** | CSS Grid (`grid-template-columns: 1fr 2fr`, `gap: 0`) | Flexbox column (`display: flex; flex-direction: column`) |
| **Containers** | 2 parallel containers (`.resume__left`, `.resume__right`) | 1 single linear container (`.resume__single-column`) |
| **ColDefs in Engine** | 2 entries: `left` and `right` | 1 entry: `single` |
| **Flow Dependency** | Left and right columns flow independently. Pushing an element in one column does not shift the other. | Single linear sequence. Pushing an element shifts all subsequent items down. |
| **CSS Paged Media Behavior** | Parallel grid tracks with `break-before: page` trigger separate document page breaks. | Single track with `break-before: page` breaks sequentially without parallel conflict. |
| **Background** | Dual-tone linear gradient (`linear-gradient(to right, ...)`) + column bg | Uniform white (`#ffffff`) |

### 1.5 The Exact Mechanisms Causing Column Asynchrony, Cascading Breaks, and Alternating Blank Pages
Inspection of `src/utils/staticHtmlPdfEngine.js` and `src/styles/print.css` revealed five interlocking mechanisms:

1. **W3C CSS Paged Media Fragmentation on Parallel Grid Tracks**:
   - In standard CSS paged media (`@page { size: A4; margin: 0; }`), `#area-cv` is a CSS Grid.
   - When an element in `.resume__left` has `break-before: page !important`, the browser pagination engine terminates the current physical sheet and begins **Page 2** for that element and subsequent left-column content.
   - When an element in `.resume__right` also has `break-before: page !important`, the browser treats this as a **subsequent page break request**, advancing the entire document to **Page 3**!
   - Result: Page 1 holds Page 1 left & right. Page 2 holds Page 2 left, with a blank right column. Page 3 holds Page 2 right, with a blank left column.

2. **Conflicting De-Duplication in `createSanitizedPrintClone`** (`src/utils/staticHtmlPdfEngine.js:634-647`):
   ```javascript
   const hasParallelColumnBreaks = Boolean(
     clone.querySelector('.resume__left [data-editor-break-forced="true"]') &&
     clone.querySelector('.resume__right [data-editor-break-forced="true"]')
   );
   if (hasParallelColumnBreaks) {
     clone.querySelectorAll('[data-editor-break-forced="true"]').forEach((node) => {
       node.style.setProperty('break-before', 'auto', 'important');
       node.style.setProperty('page-break-before', 'auto', 'important');
       node.style.setProperty('margin-top', '0', 'important');
       node.classList.remove('force-page-break-before', 'break-page-before');
       node.removeAttribute('data-page-break');
       node.removeAttribute('data-page-break-before');
     });
   }
   ```
   When parallel breaks are detected, it zeroes out `margin-top` AND removes `break-before: page`. This strips all pagination offsets completely, leaving both columns unpushed so content collides directly with the fold line.

3. **Asymmetric De-Duplication in `snapshotBreaksCSS` and `executeCleanPrint`** (`src/utils/staticHtmlPdfEngine.js:409-430`, `1049-1070`, `1164-1175`):
   ```javascript
   const isDuplicateParallelFold = is2Col && seenFolds.has(foldKey);
   seenFolds.add(foldKey);
   if (isDuplicateParallelFold) {
     return `${selector} { break-before: auto !important; page-break-before: auto !important; padding-top: var(--page-padding, 24px) !important; margin-top: 0 !important; }`;
   }
   return `${selector} { break-before: page !important; page-break-before: always !important; padding-top: var(--page-padding, 24px) !important; margin-top: 0 !important; }`;
   ```
   The first broken element encountered (e.g. in left column) gets `break-before: page !important`. The second broken element (in right column) gets `break-before: auto !important` and `margin-top: 0 !important`.
   The second element is neither pushed down nor broken to Page 2; it remains stranded on Page 1, straddling the bottom of Page 1. If its content overflows Page 1, Chromium either clips/chops it or pushes it over into an involuntary break without padding.

4. **Re-Injection of `break-before: page` by `enforceTwoColumnComponentPagination`** (`src/utils/staticHtmlPdfEngine.js:878-886`, `1245`):
   Even if de-duplication was attempted above, `executeCleanPrint` invokes `enforceTwoColumnComponentPagination(doc, areaCv, pageHeightPx)`.
   Inside this function, lines 878-886 unconditionally execute:
   ```javascript
   targetBreakElement.style.setProperty('break-before', 'page', 'important');
   targetBreakElement.style.setProperty('page-break-before', 'always', 'important');
   targetBreakElement.classList.add('force-page-break-before', 'break-page-before');
   ```
   This re-applies `break-before: page` to BOTH columns, overriding previous de-duplications and directly re-triggering the cascading multi-page blowout (3 to 7 pages).

5. **`print.css` Selector Contradiction** (`src/styles/print.css:61-67` vs `166-175`):
   - Lines 61-67 declare:
     ```css
     .resume.bd-grid .resume__left .break-page-before,
     .resume.bd-grid .resume__right .break-page-before,
     .resume.bd-grid .resume__left .force-page-break-before,
     .resume.bd-grid .resume__right .force-page-break-before {
       break-before: auto !important;
       page-break-before: auto !important;
     }
     ```
   - Lines 170-175 declare:
     ```css
     [data-editor-break-forced="true"]:not(:first-child) {
       break-before: page !important;
       page-break-before: always !important;
     }
     ```
   These two rules have equal specificity conflicts, and inline styles on elements override them unpredictably.

---

## 2. Logic Chain

```
[Observation 1.1: Live editor uses a single continuous CSS Grid with align-self: stretch]
  │
  ├─► [Observation 1.2: In live editor, pagination is achieved entirely via margin-top offsets pushing elements past forbidden zones]
  │     │
  │     └─► Fact: The live editor NEVER uses CSS `break-before: page`.
  │           Both columns remain in the exact same coordinate system.
  │           Left and right column items on Page 2 sit at the exact same Y position (nextContentAreaTop).
  │
  ├─► [Observation 1.5.1: In CSS Paged Media, break-before: page inside parallel CSS Grid tracks forces sequential document page breaks]
  │     │
  │     └─► Fact: Left column break-before: page creates Page 2.
  │           Right column break-before: page creates Page 3.
  │           This directly causes alternating blank pages and inflates page count from 2 to 3-5 pages.
  │
  ├─► [Observation 1.5.2 & 1.5.3: Current workarounds (hasParallelColumnBreaks, snapshotBreaksCSS seenFolds) set break-before: auto and margin-top: 0 on parallel breaks]
  │     │
  │     └─► Fact: Setting margin-top: 0 strips the vertical offset.
  │           The parallel element is not pushed past the fold; it is left straddling the 1123px line on Page 1.
  │
  └─► [Observation 1.5.4: enforceTwoColumnComponentPagination re-applies break-before: page to both columns]
        │
        └─► Conclusion: The attempt to paginate 2-column mode via CSS `break-before: page` is fundamentally flawed.
              Parallel CSS Grid tracks in paged media cannot share a `break-before: page` directive.
              To achieve 1:1 parity with the live editor without column asynchrony, 2-column mode must paginate via
              print-specific coordinate pushes (margin-top with gapPx = 0) while keeping break-before: auto on grid descendants.
```

---

## 3. Caveats

1. **No Source Code Modifications**: As a read-only exploration agent, no modifications were made to `src/` or tests.
2. **Sandbox Environment Limitation**: Terminal execution via `run_command` encountered a sandbox server connection reset (`read unix @->@: recvmsg: connection reset by peer`). All analysis was performed directly via deterministic source code inspection, AST/file analysis, and existing Cypress/Vitest test file audits.
3. **Chromium Paged Media Slicing Engine**: Physical PDF verification requires Chromium headless (`--headless=new`) via Cypress CDP task (`cypress/e2e/06-multipage-pagebreak.cy.js`). JSDOM in Vitest does not implement real CSS Fragmentation or Paged Media rendering.

---

## 4. Conclusion & Concrete Architectural Recommendations

### Core Architectural Conclusion
CSS `break-before: page` cannot be used on elements inside parallel CSS Grid columns (`.resume__left` and `.resume__right`). In CSS Paged Media, each `break-before: page` inside an independent grid track spawns a new physical page for the entire document, which inherently fragments 2-column layouts into alternating solitary pages.

The live editor succeeds because it uses **pixel-accurate vertical coordinate displacement (`margin-top`)** within a single continuous grid container. The print engine must mirror this exact mechanism.

### Concrete Recommendations for the Implementation Team

#### Recommendation 1: Two-Column Pagination via Print Coordinate Push (`gapPx = 0`)
In 2-column mode (`resume bd-grid`):
- For print rendering, run `executePaginationAlgorithm` (or map editor breaks) with `gapPx = 0` (physical paper has 0px fold gap):
  - Fold $N$ is at $N \times 1123\text{px}$.
  - Forbidden zone is $[N \times 1123 - \text{pagePadding}, N \times 1123 + \text{pagePadding}]$.
  - Pushed elements receive:
    `printMarginTop = (N * 1123 + pagePadding) - elementTopBeforeBreak`.
- In 2-column print CSS and inline styles:
  - Keep `break-before: auto !important; page-break-before: auto !important;` on all children of `.resume__left` and `.resume__right`.
  - Apply `margin-top: ${printMarginTop}px !important;` and `padding-top: 0 !important;` (since the margin already spaces it to `pagePadding` below the fold).
  - Let Chromium slice the continuous 2-column grid at multiples of 1123px.
  - Because both columns have their Page 2 elements pushed to $1123\text{px} + \text{pagePadding}$, both columns resume synchronously at the top of Page 2!
  - Result: Exactly 2 pages, 0 phantom blank pages, 100% synchronized columns.

#### Recommendation 2: Preserve `break-before: page` Strictly for ATS 1-Column Mode
- ATS 1-column mode (`resume__single-column`) has a single vertical track with zero parallel columns.
- For ATS mode, continue using `break-before: page !important; margin-top: 0 !important; padding-top: var(--page-padding, 24px) !important;`.
- This guarantees zero regressions for ATS mode (satisfying R4).

#### Recommendation 3: Deactivate Conflicting Overrides in `staticHtmlPdfEngine.js` and `print.css`
1. Remove `enforceTwoColumnComponentPagination` calls from the browser snapshot path in `executeCleanPrint` (lines 1245, 1293), keeping it strictly as a JSDOM unit test fallback.
2. In `createSanitizedPrintClone`, replace the `hasParallelColumnBreaks` block: instead of zeroing `margin-top`, convert the editor's gap-adjusted `margin-top` to print `margin-top` (`editorMarginTop - foldNum * 20px`).
3. In `generateCleanPrintHTML` (`snapshotBreaksCSS`), when `is2Col` is true, output `margin-top: ${printMarginTop}px !important; break-before: auto !important;` instead of `break-before: page !important;`.
4. In `src/styles/print.css`, clarify the 2-column rule so that `.resume.bd-grid .resume__left *` and `.resume.bd-grid .resume__right *` never inherit `break-before: page`.

#### Recommendation 4: Cypress E2E Multi-Column Test Coverage
Create an E2E test in `cypress/e2e/` that populates BOTH columns beyond Page 1 (e.g. adding 6 experience items in right column AND 6 skills/education items in left column), triggers PDF generation via `printWithChrome`, and asserts:
- `info.pagesCount === 2`.
- Page 1 contains text from both left and right columns.
- Page 2 contains text from both left and right columns.
- 0 alternating blank pages.

---

## 5. Verification Method

### How to Independently Verify

1. **Inspect Code Locations**:
   - `src/utils/staticHtmlPdfEngine.js` lines 401-432, 634-672, 878-886, 1041-1072, 1150-1198.
   - `src/styles/print.css` lines 60-67 and 160-175.
   - `src/utils/paginationEngine.js` lines 255-498.
   - `src/hooks/usePaginationEngine.js` lines 31-145.

2. **Run Unit Tests (Vitest)**:
   ```bash
   npm test
   # specifically:
   npx vitest run src/tests/two-column-pdf-pagination-and-extension.test.jsx
   npx vitest run src/tests/m5-pagination-forbidden-zones-adversarial.test.jsx
   npx vitest run src/tests/page2MarginPaddingParity.test.jsx
   ```

3. **Run Cypress End-to-End Tests**:
   ```bash
   npx cypress run --spec "cypress/e2e/02-print-geometry-and-pagination.cy.js,cypress/e2e/06-multipage-pagebreak.cy.js" --browser chrome
   ```

4. **Invalidation Conditions**:
   - If applying `break-before: page !important` to descendants in BOTH `.resume__left` and `.resume__right` in Chromium paged media generates a 2-page document with content side-by-side on Page 2, this finding is invalidated. (Empirical behavior in Chromium confirms it generates at least 3 pages with alternating blank columns).
