# Technical Findings: Interactive Editor Artifacts, Concealment Mechanisms & Pixel Parity TDD Test Suite Design

**Explorer**: Explorer 3 (Survey 3 — Artifacts & TDD Test Infrastructure)  
**Project**: Orchestrator 10 — Absolute 1:1 Pixel Parity (0px Drift) between Live Editor & Clean Print  
**Date**: 2026-09-10  
**Status**: Investigation Complete  

---

## 1. Catalog of Interactive Editor Artifacts Across Components

An exhaustive investigation across all JSX components and stylesheets (`src/index.css`, `src/styles/print.css`) identified **26 interactive editor artifacts**. Below is the complete catalog:

| # | Artifact Selector / Class | Component Location | Positioning / Box Behavior in Editor | Concealment / Stripping Mechanism | Reflow / Layout Shift Risk |
|---|---|---|---|---|---|
| 1 | `.drag-handle` / `.section-drag-handle` | `src/components/Editor/DragHandle.jsx`, `BaseSection.jsx` | `position: absolute; top: 0.25rem; left: 0.15rem; z-index: 20;` | Class `.no-print`, regex stripped in `staticHtmlPdfEngine.js`, omitted in `PrintBaseSection` | **Zero (0px)**: Out of flow |
| 2 | `.item-drag-handle` | `src/components/Editor/DragHandle.jsx`, `BaseItem.jsx`, `items/*.jsx` | `position: absolute; top: 0.15rem; left: 0.1rem; z-index: 20;` | Class `.no-print`, regex stripped, omitted in `PrintBaseItem` | **Zero (0px)**: Out of flow |
| 3 | `.round-btn-del` / `.section-del-btn` | `src/components/CV/BaseSection.jsx` | `position: absolute; top: 0.35rem; right: 0.35rem; z-index: 25;` | Class `.no-print`, omitted in `PrintBaseSection` | **Zero (0px)**: Out of flow |
| 4 | `.item-del-btn` | `src/components/CV/BaseItem.jsx` | `position: absolute; top: 0.2rem; right: 0.2rem; z-index: 25;` | Class `.no-print`, omitted in `PrintBaseItem` | **Zero (0px)**: Out of flow |
| 5 | `.bullet-del-btn` | `src/components/CV/items/ExperienceItem.jsx`, `ProjectsItem.jsx`, `VolunteeringItem.jsx` | `position: absolute; top: 2px; right: 0.1rem; width: 18px;` | Class `.no-print`, omitted in `PrintView` | **Zero (0px)**: Out of flow |
| 6 | `.round-btn-add` | `src/components/CV/BaseSection.jsx` | Child of `.section-add-container`, `width: 28px; height: 28px;` | Class `.no-print`, omitted in `PrintBaseSection` | **Zero (0px)**: Contained in absolute parent |
| 7 | `.section-add-container` | `src/components/CV/BaseSection.jsx` | `position: absolute; bottom: -13px; left: 50%; transform: translateX(-50%); z-index: 25;` | Class `.no-print`, omitted in `PrintBaseSection` | **Zero (0px)**: Out of flow |
| 8 | `.column-add-section` / `.add-section-btn` | `src/App.jsx` (lines 728, 845, 878) | In-flow at bottom of `.resume__left`, `.resume__right`, `.resume__single-column` (`margin-top: 1.5rem`) | Class `.no-print`, not rendered in `generateCleanPrintHTML` | **Low**: Bottom of column, no sibling elements below |
| 9 | `.bullet-add-row` / `.add-bullet-btn` | `src/components/CV/items/ExperienceItem.jsx`, `ProjectsItem.jsx`, `VolunteeringItem.jsx` | In-flow at bottom of bullet list: `opacity: 0; visibility: hidden;` when idle, `paddingLeft: 1.25rem` | Class `.no-print`, omitted in `PrintView` | **HIGH RISK**: `visibility: hidden` occupies physical height (~24px) in live editor but is 0px in print |
| 10 | `.section-action-buttons` | `src/components/CV/BaseSection.jsx` (line 175) | `position: absolute; top: 0.35rem; right: 0.35rem; z-index: 25;` | Class `.no-print`, omitted in `PrintBaseSection` | **Zero (0px)**: Out of flow |
| 11 | `.section-tips-toggle-btn` | `src/components/CV/BaseSection.jsx` (line 181) | Child of `.section-action-buttons`, `width: 22px; height: 22px;` | Inherits parent `.no-print`, omitted in `PrintBaseSection` | **Zero (0px)**: Out of flow |
| 12 | `.section-bullet-style-btn` | `src/components/CV/BaseSection.jsx` (line 198) | Child of `.section-action-buttons` | Inherits parent `.no-print`, omitted in `PrintBaseSection` | **Zero (0px)**: Out of flow |
| 13 | `.section-bullet-style-popover` | `src/components/Editor/SectionBulletStylePopover.jsx` | `position: fixed; z-index: 9999;` tracking button rect | Class `.no-print`, modal not rendered in print | **Zero (0px)**: Out of flow |
| 14 | `.suggestion-tooltip` / `.obsidian-callout` | `src/components/Editor/SuggestionTooltip.jsx` | `position: fixed` or `position: absolute; z-index: 9999;` | Class `.no-print`, not in `generateCleanPrintHTML` | **Zero (0px)**: Out of flow |
| 15 | `.column-resizer` (`.column-resizer-bar`, `.column-resizer-handle`) | `src/App.jsx` (lines 746-811) | `position: absolute; left: calc(leftColPercent% - 7px); top: 0; bottom: 0; width: 14px; z-index: 40;` | Class `.no-print`, not in `generateCleanPrintHTML` | **Zero (0px)**: Out of flow |
| 16 | `.rich-text-toolbar` / `.floating-rich-toolbar` / `.rich-toolbar` | `src/components/Editor/RichTextToolbar.jsx` | `position: fixed; top: ...; left: ...; z-index: 99999;` | Class `.no-print`, `display: none !important` in print.css | **Zero (0px)**: Out of flow |
| 17 | `.action-menu` / `.l-navbar` | `src/components/Editor/ActionMenu.jsx` | `position: fixed; top: 0; z-index: 100;` | Class `.no-print`, outside `#area-cv` | **Zero (0px)**: Outside document paper |
| 18 | `.layout-mode-toggle-container` | `src/components/Editor/LayoutModeToggle.jsx` | In-flow in `App.jsx` above `#area-cv` | Class `.no-print`, outside `#area-cv` | **Zero (0px)**: Outside document paper |
| 19 | `.a4-page-fold-guide` (`.a4-page-fold-line`, `.a4-page-fold-badge`) | `src/App.jsx` (lines 676-692) | `position: absolute; left: 0; right: 0; height: 20px; z-index: 35; pointer-events: none;` | Class `.no-print`, not in `generateCleanPrintHTML` | **Zero (0px)**: Out of flow |
| 20 | `.inline-input` / `.inline-edit-active` (contentEditable outline/focus) | `src/components/Editor/InlineEdit.jsx` (lines 502-516) | `outline: 2px solid rgba(56, 116, 255, 0.4); outline-offset: 2px;` | Rendered as plain text in `InlineEditPrintView` | **Zero (0px)**: CSS `outline` does not alter layout box |
| 21 | `InlineEditEditor` vs `InlineEditPrintView` display | `src/components/Editor/InlineEdit.jsx` | Editor idle: `display: multiline ? 'block' : 'inline-block'`, `minWidth: '20px'`, `minHeight: '1em'` | Print: `display: multiline ? 'block' : 'inline'` | **MEDIUM RISK**: `inline-block` vs `inline` baseline & min-width/height differences |
| 22 | `.spacer-resize-handle` | `src/components/CV/SpacerBlock.jsx` (line 162) | `position: absolute; bottom: -8px; left: 0; right: 0; height: 16px;` | Class `.no-print`, omitted in `PrintSpacerBlock` | **Zero (0px)**: Out of flow |
| 23 | `.spacer-controls-bar` | `src/components/CV/SpacerBlock.jsx` (line 482) | `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 30;` | Class `.no-print`, omitted in `PrintSpacerBlock` | **Zero (0px)**: Out of flow |
| 24 | `.contact-del-btn` | `src/components/CV/items/ProfileHeaderItem.jsx` (line 126) | `round-btn-del bullet-del-btn`, `position: absolute;` | Class `.no-print`, omitted in `ProfileHeaderItemPrintView` | **Zero (0px)**: Out of flow |
| 25 | `.add-contact-btn` | `src/components/CV/items/ProfileHeaderItem.jsx` (line 143) | In-flow in flex container (`.social__container`) | Class `.no-print`, omitted in `ProfileHeaderItemPrintView` | **LOW/MEDIUM RISK**: Could cause extra flex line wrap if many contacts |
| 26 | `SimpleListItem` custom circle span | `src/components/CV/items/SimpleListItem.jsx` | In-flow: `<span className="simple-list-circle" style={{ display: 'inline-block', width: '5px', height: '5px', margin: '7px 0.45rem 0 0' }} />` | In print: omitted in favor of native browser `<li>` disc marker (`list-style-type: disc`) | **LOW RISK**: Marker spacing vs custom circle margin |

---

## 2. Analysis of Stripping/Concealment Mechanisms & Reflow Vulnerabilities

### A. Dual Stripping Architecture
The codebase employs two concurrent layers of artifact concealment:
1. **Structural React Component Branching (Primary)**:
   - `staticHtmlPdfEngine.js` renders dedicated print-only components: `PrintBaseSection`, `PrintBaseItem`, `ExperienceItemPrintView`, `ProjectsItemPrintView`, `ProfileHeaderItemPrintView`, `PrintSpacerBlock`, `InlineEditPrintView`.
   - These components do not instantiate drag-and-drop sortable hooks (`useSortable`), drag handles, delete buttons, add buttons, or modal triggers.
2. **CSS Post-Processing Sanitization (Secondary)**:
   - `staticHtmlPdfEngine.js` applies a regex pass over `baseStyles` and `printStyles`:
     ```javascript
     const editorArtifactsPattern = /(?:drag-handle|round-btn-del|round-btn-add|suggestion-tooltip|obsidian-callout|column-resizer|l-navbar|inline-input|editable-section-container|editable-item-container|section-del-btn|item-del-btn|section-add-container|action-menu|no-print|add-contact-btn|contact-del-btn|spacer-resize-handle|spacer-controls-bar)/gi;
     ```
   - In `src/styles/print.css`:
     ```css
     .no-print, .action-menu, .floating-rich-toolbar, .rich-toolbar { display: none !important; }
     ```

### B. Identified Reflow & Layout Drift Risks (Why Drift Occurs)

1. **The Phantom Height of `.bullet-add-row` (CRITICAL)**:
   - In `ExperienceItemEditView` (`src/components/CV/items/ExperienceItem.jsx`: lines 286-296), `.bullet-add-row` is placed directly in the normal document flow.
   - In `src/index.css` (line 1118):
     ```css
     .bullet-add-row {
       opacity: 0;
       visibility: hidden;
       transition: opacity 0.2s ease, visibility 0.2s ease;
     }
     ```
   - In CSS, `visibility: hidden` preserves the element's physical box dimensions in the layout flow. The button inside it has padding, height, and margins totaling ~24px to 28px.
   - In print mode (`ExperienceItemPrintView`), `.bullet-add-row` is completely omitted (0px).
   - **Result**: In the live editor, each experience item with bullets has an extra ~24px at the bottom. If a section contains 3 items, the live editor section is ~72px taller than in the print snapshot!
   - **Remediation**: In `src/index.css`, style `.bullet-add-row` with `position: absolute` or `height: 0; overflow: visible;` when idle, or ensure print and editor account for the identical flow.

2. **`InlineEditEditor` vs `InlineEditPrintView` Display Discrepancy (MEDIUM)**:
   - In `InlineEditEditor` (`src/components/Editor/InlineEdit.jsx`: line 550):
     `display: multiline ? 'block' : 'inline-block'`, `minWidth: '20px'`, `minHeight: '1em'`
   - In `InlineEditPrintView` (line 89):
     `display: multiline ? 'block' : 'inline'`
   - `inline-block` creates a new block formatting context with baseline alignment governed by vertical-align, and enforces minimum dimensions. `inline` flows as pure inline text without respecting `minWidth`.
   - **Remediation**: Harmonize display types so that single-line text in both editor and print uses `display: inline-block` with identical vertical-align and margin/padding.

3. **Column Padding Fallback Divergence (MEDIUM)**:
   - In `src/App.jsx` (lines 704, 821):
     `padding: var(--page-padding, 2rem) var(--page-padding, 1.5rem)`
   - In `src/utils/staticHtmlPdfEngine.js` (lines 424, 427):
     Left: `padding: var(--page-padding, 1.5rem 1.25rem)`
     Right: `padding: var(--page-padding, 1.5rem 1.5rem)`
   - While `--page-padding` is usually defined as e.g. `24px`, the fallback syntax in `App.jsx` specifies 2 values while `staticHtmlPdfEngine.js` specifies 1 value (`var(--page-padding, ...)`).
   - **Remediation**: Use single-source-of-truth padding declaration: `padding: var(--page-padding, 24px)` across both files.

4. **Container Max-Width in `src/styles/print.css` (HIGH)**:
   - In `src/styles/print.css` (lines 35-39):
     ```css
     #area-cv, .resume {
       width: 100% !important;
       max-width: 100% !important;
       margin: 0 !important;
     }
     ```
   - In `src/App.jsx` (line 651):
     `width: "100%", maxWidth: "794px", margin: "0 auto"`
   - Setting `max-width: 100% !important` in `print.css` overrides the strict 794px container boundary whenever the rendering viewport or iframe exceeds 794px!
   - **Remediation**: Purge `max-width: 100% !important` and set `max-width: 794px !important; width: 794px !important; margin: 0 auto !important;` in `print.css`.

---

## 3. Inspection of `src/tests/` & Vitest Configuration

### A. Configuration & Capabilities
- **Vite & Vitest**: Vite 5.0.8, Vitest 1.3.1.
- **Environment**: `jsdom` (JSDOM 24.0.0).
- **CSS Support**: `css: true` is enabled in `vite.config.js`. JSDOM parses CSS stylesheets and `<style>` blocks.
- **`src/tests/setup.js`**: Provides polyfills for `localStorage`, `matchMedia`, `ResizeObserver`, `IntersectionObserver`, `window.print`, and `URL.createObjectURL`.
- **Test Suite Health**: Currently **32 test files passing, 546 tests passing** (verified via `npx vitest run`).

### B. JSDOM Layout Reality & Mocking Patterns
- JSDOM does not contain a full layout/reflow rendering engine (like Blink or WebKit).
- `element.getBoundingClientRect()` defaults to returning `{ top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0 }` unless explicitly mocked.
- However, JSDOM **fully supports**:
  - `window.getComputedStyle(element)`: Computes CSS properties, inheritance, and CSS custom variables (`--page-padding`, `--section-gap`, etc.).
  - Inline style inspection (`element.style.padding`, `element.style.maxWidth`, etc.).
  - DOM tree comparison (tag names, class lists, attributes, hierarchy).
  - Programmatic layout simulation / box-model calculation based on container width (794px), column splits, padding, gaps, and font metrics.

### C. Critical Finding in Current `src/tests/pixelParityEditorPrint.test.jsx`
- The existing `pixelParityEditorPrint.test.jsx` file contains 5 tests.
- **Flaw in Current Implementation**: Test `TDD-PARITY-4` is currently titled:
  `'TDD-PARITY-4: Content elements between editor and print do not drift by more than 2px in coordinates or dimensions'`
  and contains:
  ```javascript
  const TOLERANCE_PX = 2.0;
  mockElements.set('section-experience', createMockRect(100, 24, 480, 300));
  printElements.set('section-experience', createMockRect(101, 24, 480, 300));
  ```
  It tests hardcoded synthetic maps with a loose `<= 2px` delta rather than asserting 0px parity on real rendered DOM trees!
- The authoritative requirement `## 2026-09-10T03:58:34Z` demands:
  - Absolute 1:1 pixel parity with **0px tolerance** (0px discrepancy).
  - Programmatic verification of `top`, `left`, `width`, `height`, computed font sizes, and CSS variables across both 1-column and 2-column modes.

---

## 4. Specification and Implementation Plan for `src/tests/pixelParityEditorPrint.test.jsx`

The redesigned test suite must replace the synthetic 2px test with a comprehensive, rigorous **6-Pillar Parity Verification Suite** with **0px tolerance**.

### Test Suite Structure

```javascript
describe('Primary TDD: Editor vs Clean Print Pixel Parity & Zero-Drift Verification (0px Tolerance)', () => {
  // Pillar 1: A4 Physical Container Geometry (0px Drift, 794px Standard)
  // Pillar 2: Dynamic CSS Custom Properties & Typography Token Parity (0px Delta)
  // Pillar 3: Section & Item Box-Model Structural Parity (1-Col & 2-Col)
  // Pillar 4: Real Rendered DOM Coordinate Geometry (top, left, width, height with 0px Tolerance)
  // Pillar 5: Complete Interactive Artifact Exclusion (18+ Blacklist) & Non-Disruptive Concealment
  // Pillar 6: Print Lifecycle & Body Zoom 1.0 Guarantee
});
```

### Pillar-by-Pillar Test Design

#### Pillar 1: A4 Physical Container Geometry (0px Drift, 794px Standard)
- **TDD-PARITY-1.1 (2-Column Mode)**:
  - Render Editor: `<CVProvider><App /></CVProvider>` (default 2-column).
  - Generate Print: `generateCleanPrintHTML(defaultSchema, 'es')`.
  - Parse print DOM via `DOMParser`.
  - Assert both `#area-cv` elements have:
    - `maxWidth === '794px'` (delta = 0px).
    - `width === '100%'` or `'794px'`.
    - `margin === '0 auto'` or `'0px auto'`.
    - `boxSizing === 'border-box'`.
    - Identical `gridTemplateColumns` (e.g. `33.33% 66.67%` or `1fr 2fr`).

- **TDD-PARITY-1.2 (1-Column ATS Mode)**:
  - Set `layout.type = '1-column'`, `isAtsMode = true`.
  - Render Editor and generate Print.
  - Assert both `#area-cv` and `.resume__single-column` have:
    - `maxWidth === '794px'` (delta = 0px).
    - `padding` matching `var(--page-padding, 24px)`.
    - `margin === '0 auto'`.

#### Pillar 2: Dynamic CSS Custom Properties & Typography Tokens Parity (0px Delta)
- **TDD-PARITY-2.1 (Full Variable Propagation - 2-Col)**:
  - Extract CSS variables from Editor `#area-cv` and Print `#area-cv`:
    `--page-padding`, `--section-gap`, `--item-gap`, `--font-scale`, `--title-scale`, `--body-scale`, `--list-scale`, `--line-height`, `--body-font`, `--h1-font-size`, `--h2-font-size`, `--h3-font-size`, `--normal-font-size`, `--small-font-size`, `--smaller-font-size`, `--title-h1-size`, `--title-h2-size`, `--title-h3-size`, `--title-subtitle-size`, `--body-font-size`, `--body-small-font-size`, `--body-smaller-font-size`, `--list-font-size`.
  - For each variable: `expect(editorVal).toBe(printVal)` (0px delta).

- **TDD-PARITY-2.2 (Full Variable Propagation - 1-Col ATS with Custom Spacings)**:
  - Provide custom spacing overrides: `pagePadding: 32`, `sectionGap: 28`, `itemGap: 14`, `fontScale: 1.15`, `fontFamily: 'Inter'`.
  - Assert exact string and numeric equivalence on both `#area-cv` containers.

- **TDD-PARITY-2.3 (Typography Scale Mathematical Equivalence)**:
  - Test computed font size values in px:
    - Base: 16px.
    - `--h2-font-size`: `1.25rem * fontScale` -> exact match.
    - `--title-h2-size`: `h2 * titleScale` -> exact match.
    - Assert `delta = 0px` across all typography tokens.

#### Pillar 3: Section & Item Box-Model Structural Parity (1-Col & 2-Col)
- **TDD-PARITY-3.1 (Section Box Model)**:
  - Pair each section in Editor with corresponding section in Print via `data-section-id`:
    - `padding`: both must have `0 0.25rem`.
    - `marginBottom`: both must bind `var(--section-gap, 20px)`.
    - `className`: both contain `.cv-section`.
    - Title (`.section-title`): font size token, letter spacing, left text alignment.

- **TDD-PARITY-3.2 (Item Box Model)**:
  - Pair each item in Editor with corresponding item in Print via `data-item-id`:
    - `padding`: both must have `0 0.25rem`.
    - `marginBottom`: both must bind `var(--item-gap, 8px)`.
    - `className`: both contain `.cv-block`.

#### Pillar 4: Computed Coordinate Geometry (`top`, `left`, `width`, `height` with 0px Tolerance)
- **TDD-PARITY-4.1 (Real DOM Layout Coordinate Comparator)**:
  - Build a deterministic DOM Box-Model Calculator helper:
    Given container width 794px:
    - Calculates column geometry:
      - In 1-Col: Content width = `794px - (2 * pagePadding)`.
      - In 2-Col: Left column width = `794px * (leftColPercent / 100)`, Right column width = `794px * ((100 - leftColPercent) / 100)`.
    - Traverses all paired sections and items:
      - Computes cumulative `top`: sums container padding + previous sections' heights + previous section gaps.
      - Computes `left`: column offset + column padding + element padding.
      - Computes `width`: available column content width - (2 * element padding).
      - Computes `height`: inner content block heights + item gaps.
    - Compares Editor vs Print for every single element:
      ```javascript
      expect(Math.abs(editorRect.top - printRect.top), `Element ${id} top drift`).toBe(0);
      expect(Math.abs(editorRect.left - printRect.left), `Element ${id} left drift`).toBe(0);
      expect(Math.abs(editorRect.width - printRect.width), `Element ${id} width drift`).toBe(0);
      expect(Math.abs(editorRect.height - printRect.height), `Element ${id} height drift`).toBe(0);
      ```
    - Asserts **0px drift** across both 1-column and 2-column modes.

#### Pillar 5: Complete Interactive Artifact Exclusion & Non-Disruptive Concealment
- **TDD-PARITY-5.1 (Exhaustive 26-Artifact Blacklist Query)**:
  - Query parsed print document for all interactive editor selectors:
    ```javascript
    const BLACKLIST = [
      '.drag-handle', '.section-drag-handle', '.item-drag-handle',
      '.round-btn-del', '.section-del-btn', '.item-del-btn', '.bullet-del-btn',
      '.round-btn-add', '.add-bullet-btn', '.section-add-container',
      '.column-add-section', '.add-section-btn', '.bullet-add-row',
      '.section-action-buttons', '.section-tips-toggle-btn', '.section-bullet-style-btn',
      '.section-bullet-style-popover', '.suggestion-tooltip', '.obsidian-callout',
      '.column-resizer', '.column-resizer-bar', '.column-resizer-handle',
      '.rich-text-toolbar', '.floating-rich-toolbar', '.rich-toolbar',
      '.action-menu', '.action-menu-btn', '.l-navbar',
      '.a4-page-fold-guide', '.spacer-resize-handle', '.spacer-controls-bar',
      '.add-contact-btn', '.contact-del-btn'
    ];
    ```
  - Assert `doc.querySelectorAll(selector).length === 0` for every single selector.

- **TDD-PARITY-5.2 (Out-of-Flow Positioning Verification)**:
  - Inspect stylesheet rules for interactive controls in `src/index.css`.
  - Assert that controls overlaid on sections (`.drag-handle`, `.round-btn-del`, `.section-action-buttons`, `.section-add-container`, `.column-resizer`) have `position: absolute` or `position: fixed`.
  - Confirms that concealing them has 0px reflow impact on the document flow.

#### Pillar 6: Print Lifecycle & Body Zoom 1.0 Guarantee
- **TDD-PARITY-6.1 (Body Zoom Strictly 1.0)**:
  - Spy on `document.body.appendChild` for `executeCleanPrint`.
  - Execute `executeCleanPrint(defaultSchema, 'es')`.
  - Inspect `capturedDoc.body.style.zoom`.
  - Assert `Number(bodyZoom || 1) === 1.0` (zero scaling).
