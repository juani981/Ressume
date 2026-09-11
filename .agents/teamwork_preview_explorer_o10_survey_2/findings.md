# Detailed Findings: Live Editor Layout, Styling, CSS Custom Properties, and 0px Print Parity

**Author**: Explorer 2 (Live Editor Styling, Layouts & Variables)  
**Target Milestone**: Survey (Project Orchestrator 10)  
**Date**: 2026-09-10  
**Scope**: `src/index.css`, `src/App.jsx`, `src/context/CVContext.jsx`, `src/styles/print.css`, `src/utils/staticHtmlPdfEngine.js`, and CV components.

---

## 1. Executive Summary

A comprehensive investigation into the live editor styling, container geometry, CSS variable architecture, and print snapshot rendering was conducted to diagnose and eliminate all sources of visual/pixel drift between the interactive `#area-cv` preview and the clean static PDF print snapshot.

### Core Discoveries:
1. **Critical Viewport Media Query Invalidation**: Key document layout rules (`.section-title`, `.home__container`, `.social__container`, `.languages__content`, `.home__img`, `.home__data`) in `src/index.css` are trapped inside `@media screen and (min-width: 968px)`. In the print iframe (`width: 794px`), this query fails to evaluate, triggering immediate layout shifts (e.g. `gap: 3rem` instead of `1.5rem`, wrapped/stacked contact pills, centered image, altered columns).
2. **Container Width Non-Strictness**: `#area-cv` in `src/App.jsx` is defined with `width: "100%", maxWidth: "794px"`. On viewports or parent wrappers narrower than 794px, the live editor document compresses below 794px, corrupting snapshot measurements and causing print width divergence.
3. **DOM Hierarchy Discrepancy in 1-Column (ATS) Mode**: `App.jsx` wraps ATS sections in an extra inner `<div className="resume__single-column">` inside `#area-cv.resume__single-column`, whereas `staticHtmlPdfEngine.js` renders sections as direct children of `#area-cv`. Because `.resume__single-column` has `padding: var(--page-padding, 24px) !important`, this introduces nesting asymmetries and potential double-padding risks.
4. **In-Flow Interactive Control Distortion**: `.bullet-add-row` inside `ExperienceItemEditView` (and related list items) is an in-flow `<div>` with `opacity: 0; visibility: hidden;`. It occupies ~22px of physical vertical space in the editor DOM, whereas `ExperienceItemPrintView` completely omits it, producing a ~22px height delta per experience block.
5. **Divergent List/Bullet Rendering Models**: Bullets in the editor use `display: flex` with `paddingRight: 1.5rem` (24px narrower line width to accommodate the delete button) and a manual 5px span, while print uses `display: list-item` with `paddingRight: 0` and native `::marker`.
6. **CSS Custom Properties & Fallback Inconsistencies**: Column padding fallbacks (`2rem 1.5rem` vs `1.5rem 1.25rem`), item gap fallbacks (`8px` vs `6px`), missing `--container-color-alt` in print inline styles, and conflicting `.no-print` concealment rules (`visibility: hidden !important` vs `display: none !important`).

---

## 2. #area-cv Styling, CSS Custom Properties & Controls

### 2.1 CSS Custom Properties Catalog & Flow
The document styling relies on a cascading custom property system initialized in `:root`, re-scoped in `#area-cv`, and dynamically bound via inline styles in both `App.jsx` and `staticHtmlPdfEngine.js`:

| Variable | Default Value | Controller / Range | Binding in Editor (`App.jsx`) | Binding in Print (`staticHtmlPdfEngine.js`) | Status / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `--page-padding` | `24px` | Slider: 0–60px (step 2) | Inline on `#area-cv` & columns | Inline on `#area-cv` & columns, style tag | Evaluates to px value |
| `--section-gap` | `20px` | Slider: 0–50px (step 2) | Inline on `#area-cv` | Inline on `#area-cv`, style tag | Drives `.cv-section { margin-bottom }` |
| `--item-gap` | `8px` | Slider: 0–30px (step 1) | Inline on `#area-cv` | Inline on `#area-cv`, style tag | Fallback in `print.css` is `6px` (mismatch) |
| `--font-scale` | `1.0` | Slider: 0.85–1.25 (step 0.05) | Inline on `#area-cv` | Inline on `#area-cv`, style tag | Master typography multiplier |
| `--title-scale` | `1.0` | Slider: 0.80–1.40 (step 0.05) | Inline on `#area-cv` | Inline on `#area-cv`, style tag | Sub-scale for titles |
| `--body-scale` | `1.0` | Slider: 0.80–1.30 (step 0.05) | Inline on `#area-cv` | Inline on `#area-cv`, style tag | Sub-scale for descriptions & body text |
| `--list-scale` | `1.0` | Slider: 0.80–1.30 (step 0.05) | Inline on `#area-cv` | Inline on `#area-cv`, style tag | Sub-scale for list items & badges |
| `--line-height` | `1.45` | Slider: 1.25–1.85 (step 0.05) | Inline on `#area-cv` | Inline on `#area-cv`, style tag | Multiplier applied to `#area-cv` |
| `--body-font` | `'Poppins', sans-serif` | Dropdown: Poppins, Inter, Roboto, Merriweather, JetBrains Mono | Inline on `#area-cv` | Inline on `#area-cv`, style tag | Identical font mappings |
| `--title-color` | `#0f172a` | Dynamic (YIQ calculation) | Inline on columns | Inline on columns | Derived from column background |
| `--text-color` | `#334155` | Dynamic (YIQ calculation) | Inline on columns | Inline on columns | Derived from column background |
| `--text-color-light`| `#64748b` | Dynamic (YIQ calculation) | Inline on columns | Inline on columns | Derived from column background |
| `--container-color-alt`| `#F8FAFC` | Dynamic (YIQ calculation) | Inline on columns | **Missing** from inline style in print engine | Present in App.jsx:470/478, omitted in staticHtmlPdfEngine.js:424 |
| `--circle-color` | Adjusted hex | Dynamic (YIQ calculation) | Inline on columns | Inline on columns | Used for bullets, timeline dots |
| `--left-bg` | `""` (CSS default) | Color swatch picker | Inline on `#area-cv` & left col | Inline on `#area-cv` & left col | Sets gradient stop & background |
| `--right-bg` | `""` (CSS default) | Color swatch picker | Inline on `#area-cv` & right col | Inline on `#area-cv` & right col | Sets gradient stop & background |
| `--left-col-percent`| `33.33%` | Slider: 20%–55% or drag resizer | Inline on `#area-cv` | Computed inline in gradient | Controls split ratio |

### 2.2 Container Dimensions & Strict 794px Width Evaluation
- **Standard A4 Definition**: At 96 DPI, standard A4 width is `210mm = (210 / 25.4) * 96 = 793.700787... px`, conventionally rounded to `794px`.
- **Editor Specification in `App.jsx` line 651**:
  ```jsx
  style={{
    width: "100%",
    maxWidth: "794px",
    margin: "0 auto",
    ...
  }}
  ```
- **CSS Specification in `src/index.css` line 78**:
  ```css
  #area-cv {
    width: 210mm;
    max-width: 100%;
    margin: 0 auto;
    ...
  }
  ```
- **Finding**: Because of `width: "100%"` in inline style, if the parent element (`.l-main.bd-container`, line 631) or the browser viewport shrinks below 794px, `#area-cv` shrinks below 794px.
  - When `captureEditorSnapshot()` runs (in `src/utils/staticHtmlPdfEngine.js` line 255), it measures `rect.width = areaCv.getBoundingClientRect().width`. If the window was resized to 720px, `snapshot.width` records `720px`.
  - In `generateCleanPrintHTML` (line 423/434):
    `width: ${containerWidth || '794px'}; max-width: ${containerWidth || '794px'};`
  - In `executeCleanPrint` (line 716):
    `iframe.style.width = snapshot?.width ? `${snapshot.width}px` : '794px';`
  - When printed on physical paper, the page is 794px wide. The rendered HTML at 720px leaves an unrendered gap on the right.
- **Architectural Requirement**:
  - The live editor must enforce `width: 794px !important; min-width: 794px; max-width: 794px;` directly on `#area-cv`.
  - On viewports narrower than 794px, `#area-cv` should NOT flex down; instead, `.l-main` must allow horizontal scrolling (`overflow-x: auto`), preserving 100% identical physical geometry regardless of device or screen resolution.

### 2.3 Zoom and Scale Controls
- **Editor UI Controls**: There is no browser or viewport zoom control exposed in `ActionMenu`. All visual sizing is controlled by semantic CSS variables (`--font-scale`, `--title-scale`, `--body-scale`, `--list-scale`, `--line-height`, `--page-padding`, `--section-gap`, `--item-gap`).
- **Print Zoom Enforcement**:
  - In `executeCleanPrint` (line 862):
    ```javascript
    if (doc.body?.style) {
      doc.body.style.zoom = 1.0;
    }
    ```
  - In headless fallback (line 880): `doc.body.style.zoom = scale;` where `scale = calculatePrintScale(rawHeight)`.
  - When visual parity is verified, `zoom` must strictly remain `1.0` (as verified in `src/tests/pixelParityEditorPrint.test.jsx:176`).

---

## 3. Geometry Analysis: 1-Column (ATS) vs 2-Column Mode

### 3.1 1-Column ATS Mode (`.resume--ats-mode`)
1. **Activation Trigger**:
   - Condition: `cvData.layout?.isAtsMode === true || cvData.layout?.type === '1-column'`.
   - Side effect in `App.jsx:387-396`: Adds `ats-mode-active` class to `document.body` (darker slate backdrop for editor canvas).
2. **Container Classes**:
   - `resume resume__single-column resume--ats-mode` (App.jsx:644).
3. **Container Styles**:
   - `display: block`
   - `background: #ffffff`
   - `padding: var(--page-padding, 24px)`
   - `border: 1px solid #334155` (editor canvas border, suppressed via `print.css` line 137: `border: none !important`)
   - `box-shadow: 0 10px 35px rgba(0,0,0,0.45)` (editor shadow, suppressed via `print.css` line 138: `box-shadow: none !important`)
4. **Structural Nested Wrapper Flaw**:
   - In `App.jsx` lines 862–868:
     ```jsx
     <div
       className="resume__single-column"
       style={{
         width: "100%",
         maxWidth: "794px",
         margin: "0 auto",
       }}>
     ```
   - In `generateCleanPrintHTML` (staticHtmlPdfEngine.js:433):
     The `<section>` items are direct children of `#area-cv`.
   - In `src/index.css` line 1818 and `src/styles/print.css` line 59:
     `.resume__single-column { padding: var(--page-padding, 24px) !important; }`
   - **Risk**: Since `#area-cv` has class `resume__single-column` AND contains a child `div.resume__single-column`, CSS targeting `.resume__single-column` targets both containers, risking double-padding or structural drift in DOM selectors.
5. **Section Titles in ATS Mode**:
   - `.resume--ats-mode .section-title` (index.css:1291 & print.css:123):
     - `color: #0f172a !important`
     - `border-bottom: 1.5px solid #0f172a !important`
     - `padding-bottom: 4px !important`
     - `letter-spacing: 0.12rem !important`
     - `text-align: left !important`
     - `font-weight: 700 !important`
     - `margin-bottom: var(--mb-3, 1.5rem) !important`

### 3.2 2-Column Mode
1. **Container Classes**:
   - `resume bd-grid` (App.jsx:644).
2. **Container Styles**:
   - `display: grid`
   - `gap: 0` (index.css:112, 1548)
   - `padding: 0` (Crucial: outer container padding is 0 so column background gradients touch paper edges)
   - `align-items: stretch`
   - `grid-template-columns`: `${leftColumnWidth}% ${100 - leftColumnWidth}%` (or `1fr 2fr` by default)
   - `background`: `linear-gradient(to right, ${leftBg} 0%, ${leftBg} ${leftColPercent}%, ${rightBg} ${leftColPercent}%, ${rightBg} 100%)`
3. **Columns (`.resume__left` and `.resume__right`)**:
   - `display: flex; flex-direction: column;`
   - `height: 100%; min-height: 100%; align-self: stretch;`
   - `box-sizing: border-box; min-width: 0; max-width: 100%;`
   - Padding in `App.jsx` lines 704 & 821: `padding: var(--page-padding, 2rem) var(--page-padding, 1.5rem)`
   - Padding in `staticHtmlPdfEngine.js` lines 424 & 427:
     - Left: `padding: var(--page-padding, 1.5rem 1.25rem);`
     - Right: `padding: var(--page-padding, 1.5rem 1.5rem);`
4. **Column Resizer**:
   - In editor: `.column-resizer` at `left: calc(${leftColPercent}% - 7px); width: 14px; z-index: 40; position: absolute;`
   - Out of flow: does not alter column width or height.
   - Hidden during print via `.column-resizer { display: none !important; }`.

---

## 4. Comprehensive Audit of Layout Shifts & Drift Sources

### Issue 1: Viewport Breakpoint Trapping (`@media screen and (min-width: 968px)`)
- **Location**: `src/index.css` lines 583–655.
- **Problem**:
  ```css
  @media screen and (min-width: 968px) {
    .section-title, .profile__description { text-align: initial; }
    .home__container { gap: 1.5rem; }
    .home__data { text-align: initial; }
    .home__img { justify-self: initial; }
    .social__container { grid-template-columns: repeat(3, max-content); }
    .skills__content { grid-template-columns: repeat(2, 1fr); }
    .languages__content { grid-template-columns: repeat(2, max-content); column-gap: 3.5rem; }
  }
  ```
  Outside this media query (lines 209, 321, 385, 492):
  ```css
  .section-title { text-align: center; }
  .home__container { gap: 3rem; }
  .home__data { text-align: left; }
  .home__img { justify-self: center; }
  .social__container { grid-template-columns: max-content; gap: 1rem; }
  .languages__content { grid-template-columns: repeat(2, 1fr); gap: 0; }
  ```
- **Consequence**:
  The print preview iframe is created with `iframe.style.width = '794px'`.
  Because `794px < 968px`, the iframe media query evaluates to **FALSE**.
  Every style above falls back to mobile rules inside the print iframe:
  - Header contact links collapse into a vertical stack or single column.
  - Home container expands from 1.5rem gap to 3rem gap (+24px shift).
  - Languages change grid columns from `repeat(2, max-content)` to `repeat(2, 1fr)` with 0 gap.
  - Section titles center align (unless overridden by print.css).
  On screen, whenever the browser window is resized below 968px, the live editor also unexpectedly switches to mobile styling!
- **Resolution**:
  All document layout rules must be scoped to `#area-cv` and `.resume` unconditionally, without any outer viewport media query constraint.

---

### Issue 2: In-Flow Interactive Controls Generating Vertical Space
- **Location 1**: `src/components/CV/items/ExperienceItem.jsx` lines 286–296:
  ```jsx
  <div className="bullet-add-row no-print" style={{ paddingLeft: '1.25rem' }}>
    <button type="button" className="add-bullet-btn no-print" onClick={handleAddBullet}>
      ...
    </button>
  </div>
  ```
  In `src/index.css` line 1117:
  ```css
  .bullet-add-row {
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, visibility 0.2s ease;
  }
  .editable-item-container:hover .bullet-add-row {
    opacity: 1;
    visibility: visible;
  }
  ```
- **Problem**: `visibility: hidden` hides the pixels but **retains the element in flow**. The `.bullet-add-row` container and button consume ~22px height at the bottom of the bullet list in every experience item in the live editor.
  In `ExperienceItemPrintView` (line 86) and `generateCleanPrintHTML`, `.bullet-add-row` is completely omitted from the HTML markup.
- **Consequence**: In the editor, every item with bullets is ~22px taller than in the print snapshot. This creates a cumulative multi-row height discrepancy that throws off page-break calculations.
- **Location 2**: `src/App.jsx` lines 728, 845, 878:
  `<div className="column-add-section no-print" style={{ textAlign: "center", marginTop: "1.5rem" }}>`
  In `generateCleanPrintHTML`, this element is not rendered.
- **Resolution**:
  Interactive controls must be positioned out-of-flow (`position: absolute`), or collapse to `height: 0; overflow: hidden; margin: 0; padding: 0;` when not active, ensuring that concealing them produces 0px change in surrounding document flow.

---

### Issue 3: Inconsistent List & Bullet Point Geometry
- **Editor**: `SortableBulletItem` (`ExperienceItem.jsx:46-54`):
  ```jsx
  style={{
    display: 'flex',
    alignItems: 'flex-start',
    marginTop: 0,
    marginBottom: 'var(--item-gap, 6px)',
    paddingRight: '1.5rem',
    paddingLeft: '1.25rem',
    color: 'inherit'
  }}
  ```
  Bullet is rendered via manual `<span>` (width 5px, height 5px, margin `7px 0.45rem 0 0`).
- **Print**: `ExperienceItemPrintView` (`ExperienceItem.jsx:135-157`):
  ```jsx
  <ul className="experience__bullets" style={{ paddingLeft: '1.15rem', marginTop: '0.25rem', marginBottom: 0, listStyleType: 'disc' }}>
    <li className="cv-block" style={{ display: 'list-item', listStyleType: 'disc', marginBottom: 'var(--item-gap, 6px)', lineHeight: 1.45, color: 'inherit', padding: '0 0.25rem' }}>
  ```
  Bullet is rendered via browser native `::marker`.
- **Consequence**:
  - `paddingRight: '1.5rem'` in the editor shrinks the text content width by 24px compared to print. Text wraps earlier in the editor than in print!
  - `paddingLeft` differs (`1.25rem` on `li` + span margin vs `1.15rem` on `ul` with marker).
  - `display: flex` vs `display: list-item` alters text baseline and font metrics.
- **Resolution**:
  Unify the bullet layout structure so both editor and print share identical indentation, eliminate the 1.5rem right padding by using an absolute positioned delete button, and synchronize bullet circle alignment.

---

### Issue 4: InlineEdit Span Display Discrepancy (`inline-block` vs `inline`)
- **Editor**: `InlineEditEditor` (`src/components/Editor/InlineEdit.jsx` line 550):
  ```jsx
  style={{
    display: multiline ? 'block' : 'inline-block',
    minWidth: '20px',
    minHeight: '1em',
    textAlign: currentAlignment,
    color: 'inherit'
  }}
  ```
- **Print**: `InlineEditPrintView` (`src/components/Editor/InlineEdit.jsx` line 89):
  ```jsx
  style={{
    display: multiline ? 'block' : 'inline',
    textAlign: alignment,
    color: 'inherit',
    whiteSpace: multiline ? 'pre-wrap' : 'normal'
  }}
  ```
- **Consequence**:
  `inline-block` creates a block formatting context that prevents natural line wrapping of text fragments and alters baseline alignment compared to `display: inline`. The `minWidth: 20px` and `minHeight: 1em` exist only in editor mode.
- **Resolution**:
  Align display styles between `InlineEditEditor` and `InlineEditPrintView` for inactive display spans.

---

### Issue 5: Variable Fallbacks & Style Rule Clashes
1. **Item Gap Fallback**:
   - `index.css:25`: `--item-gap: 8px;`
   - `index.css:190`: `margin-bottom: var(--item-gap, 8px);`
   - `print.css:179 & 189`: `margin-bottom: var(--item-gap, 6px) !important;`
   - `index.css:1889`: `margin-bottom: var(--item-gap, 6px) !important;`
   - Discrepancy: `6px` vs `8px`.
2. **Column Padding Fallback**:
   - `App.jsx:704`: `var(--page-padding, 2rem) var(--page-padding, 1.5rem)`
   - `staticHtmlPdfEngine.js:424`: `var(--page-padding, 1.5rem 1.25rem)`
   - `staticHtmlPdfEngine.js:427`: `var(--page-padding, 1.5rem 1.5rem)`
3. **Interactive Concealment Rules**:
   - `index.css:1749`: `.no-print, button { visibility: hidden !important; opacity: 0 !important; }`
   - `print.css:156`: `.no-print { display: none !important; }`
   - In `index.css`, `visibility: hidden` preserves element layout boxes; in `print.css`, `display: none` removes them.
4. **Missing `--container-color-alt` in Static HTML Generator**:
   - `App.jsx:470`: `--container-color-alt` is output dynamically on columns.
   - `staticHtmlPdfEngine.js:424`: `--container-color-alt` is omitted from inline column style.

---

## 5. Single Source of Truth (SSOT) Architecture Roadmap

To achieve absolute 1:1 pixel parity (0px discrepancy) between the interactive `#area-cv` live editor and the clean print snapshot, the following architectural measures must be implemented:

```
+-----------------------------------------------------------------------------------+
|                        SINGLE SOURCE OF TRUTH ARCHITECTURE                        |
+-----------------------------------------------------------------------------------+
| 1. IMMUTABLE DOCUMENT CANVAS (#area-cv)                                           |
|    - Strictly fixed at 794px width (A4 standard) in both Editor & Print           |
|    - Outer editor scroll container absorbs small screens (zero document resize)  |
|                                                                                   |
| 2. UNIFIED CSS CUSTOM PROPERTIES                                                  |
|    - Evaluated identically in App.jsx and staticHtmlPdfEngine.js                  |
|    - All fallbacks synchronized (item-gap: 8px, page-padding: 24px)               |
|    - Full variable block passed to #area-cv in both environments                 |
|                                                                                   |
| 3. MEDIA QUERY DETACHMENT                                                         |
|    - Extract all #area-cv component rules from @media screen (min-width: 968px)  |
|    - Scope rules directly to #area-cv (valid on any viewport width & iframe)     |
|                                                                                   |
| 4. UNIFIED COMPONENT DOM HIERARCHY                                                |
|    - Remove redundant inner div.resume__single-column in 1-column ATS mode        |
|    - Direct section child elements in both Editor and Print                       |
|                                                                                   |
| 5. ZERO-FLOW INTERACTIVE CONCEALMENT                                              |
|    - Position .bullet-add-row out of flow or collapse height when not hovered    |
|    - Remove .bullet-item-row 1.5rem paddingRight; position delete button absolute |
|    - Ensure editor text bounding box === print text bounding box                 |
|                                                                                   |
| 6. HARMONIZED INLINE-EDIT & TYPOGRAPHY METRICS                                    |
|    - Consistent display model (inline / block) between edit display and print     |
|    - Identical line heights, font families, and letter spacing across all tags   |
+-----------------------------------------------------------------------------------+
```

---

## 6. Verification Plan & Test Commands

1. **Pixel Parity TDD Test Suite**:
   ```bash
   npx vitest run src/tests/pixelParityEditorPrint.test.jsx
   ```
2. **DOM Geometry & Typography Test Suite**:
   ```bash
   npx vitest run src/tests/dom-geometry-typography.test.jsx
   ```
3. **ATS Print Mode Fidelity Suite**:
   ```bash
   npx vitest run src/tests/atsPrintModeFidelity.test.js
   ```
4. **Full Test Suite (All 32 test files)**:
   ```bash
   npm test
   ```
5. **Production Build**:
   ```bash
   npm run build
   ```
