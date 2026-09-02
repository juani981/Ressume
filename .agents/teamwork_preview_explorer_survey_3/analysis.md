# Phase 0 Survey: Explorer 3 Technical Analysis Report

**Date**: 2026-09-02  
**Explorer**: Explorer 3 (Survey Investigator & Synthesizer)  
**Target Project**: Ressume CV Editor (`/home/juani/Documentos/Ressume`)  
**Scope**: Strict Zero-Split PDF Printing Core, Static HTML Generation (`generateCleanPrintHTML`), 2 A4 Page Auto-Scaling & Height Calculation, Test Infrastructure (Vitest / RTL / jsdom), and Build/Execution Pipeline.

---

## Executive Summary

Ressume contains a modular React architecture backed by `@dnd-kit`, `lucide-react`, and a dedicated static HTML PDF rendering core in `src/utils/staticHtmlPdfEngine.js`. The production build (`npm run build`) executes cleanly with zero errors in ~1.18 seconds.

The automated test suite comprises **9 test files and 104 test cases** running under Vitest and jsdom. Currently, **93 tests pass (89.4%) and 11 tests fail (10.6%)**. All 11 failures are isolated to `src/utils/staticHtmlPdfEngine.js` and trace back to three specific implementation discrepancies:
1. `MIN_SCALE_FLOOR` set to `0.82` instead of the expected `0.75` scale floor limit.
2. Missing `--page-padding: ${pagePadding}px;` CSS variable declaration in `:root` within `generateCleanPrintHTML`.
3. Iframe styling (`210mm` vs `0px`) and container class naming (`resume` vs `resume bd-grid`).

Resolving these discrepancies in the next phase will achieve 100% test pass rate across the existing test suite and provide a solid foundation for the Phase 1 features (universal typography, independent spacing controls, ATS 1-column overhaul, enhanced drag ergonomics, and categorized toolbar).

---

## 1. Strict Zero-Split PDF Printing Core

### 1.1 Super-Container & Pagination Architecture
The PDF/print engine prevents mid-container page-break splits across document sections and experience/education blocks using W3C CSS Fragmentation Level 3/4 standards.

```
+-------------------------------------------------------------------------+
| .resume (#area-cv)                                                      |
|   +-----------------------------+   +---------------------------------+ |
|   | .resume__left (col 1)       |   | .resume__right (col 2)          | |
|   |   +-----------------------+ |   |   +---------------------------+ | |
|   |   | .cv-section           | |   |   | .cv-section               | | |
|   |   | (break-inside: avoid) | |   |   | (break-inside: avoid)     | | |
|   |   |  .section-title       | |   |   |  .section-title           | | |
|   |   |  .cv-block            | |   |   |  .cv-block                | | |
|   |   |  .cv-block            | |   |   |  .cv-block                | | |
|   |   +-----------------------+ |   |   +---------------------------+ | |
|   +-----------------------------+   +---------------------------------+ |
+-------------------------------------------------------------------------+
```

### 1.2 Inspection of Rule Enforcement

#### A. Static HTML Core (`src/utils/staticHtmlPdfEngine.js` lines 414–423)
```css
/* Super-container CSS Page Break & Splitting Prevention */
.cv-section,
.cv-block,
.section,
.experience__content,
.education__content,
.skills__name {
  break-inside: avoid !important;
  page-break-inside: avoid !important;
}
```
* **Status**: Strict `break-inside: avoid !important;` and `page-break-inside: avoid !important;` are enforced on super-containers and sub-blocks.

#### B. Main Application Print Stylesheet (`src/index.css` lines 906–923)
```css
/* Control de Saltos de Página (Page Breaks) */
.experience__content, 
.education__content,
.skills__name,
.editable-item-container {
  page-break-inside: avoid;
  break-inside: avoid;
}

.cv-section {
  page-break-inside: avoid;
  break-inside: avoid;
}

p, h2, h3, li {
  orphans: 3;
  widows: 3;
}
```
* **Observation**: In `src/index.css`, `!important` is currently omitted from `break-inside: avoid` and `page-break-inside: avoid`, and `.cv-block` is not explicitly declared in this selector list.
* **Impact**: If a browser print is triggered directly via `window.print()` without the isolated iframe engine, browser default layout engines may override non-`!important` page-break rules in flex/grid contexts.

#### C. Live DOM vs Static HTML Class Invariants
* In `src/components/CV/BaseSection.jsx` (line 55):
  `className="${sectionClass} section editable-section-container cv-section"` (includes `.cv-section`).
* In `src/components/CV/BaseItem.jsx` (lines 57, 73, 88, 102, 118, 134):
  `className="... editable-item-container"` (does **not** directly include `.cv-block`, although `CVBlock.jsx` wraps `BaseItem`).
* In `src/utils/staticHtmlPdfEngine.js` (lines 84, 100, 108, 119, 135, 144, 195):
  `.cv-section` and `.cv-block` are systematically attached to all section containers and atomic item blocks.

---

## 2. Static HTML Generation (`generateCleanPrintHTML`) & Print Stylesheets

### 2.1 File Location & Core Structure
* **File**: `src/utils/staticHtmlPdfEngine.js` (511 lines)
* **Main Export**: `generateCleanPrintHTML(cvData)`

### 2.2 Key Capabilities
1. **Zero Editor UI Artifacts**:
   The static generator cleanly omits all interactive editor controls without relying on CSS `display: none`:
   * No drag handles (`.drag-handle`, `.section-drag-handle`, `.item-drag-handle`)
   * No deletion / addition buttons (`.round-btn-del`, `.round-btn-add`, `.section-del-btn`, `.add-section-btn`)
   * No AI suggestion tooltips (`.suggestion-tooltip`, `.obsidian-callout`)
   * No form inputs or editable wrappers (`<input>`, `<button>`, `contenteditable`, `.inline-input`)
   * No navigation bars (`.l-navbar`, `.spacing-popover`, `.no-print`)

2. **XSS Sanitization & Entity Escaping**:
   Lines 15–23 implement `escapeHTML(str)`:
   ```javascript
   export const escapeHTML = (str) => {
     if (str === null || str === undefined) return '';
     return String(str)
       .replace(/&/g, '&amp;')
       .replace(/</g, '&lt;')
       .replace(/>/g, '&gt;')
       .replace(/"/g, '&quot;')
       .replace(/'/g, '&#039;');
   };
   ```
   All text fields (`profile.name`, `item.title`, `item.subtitle`, `item.bullets`, `item.description`) pass through `escapeHTML()`.

3. **Dynamic Contrast Calculation (YIQ Color Intelligence)**:
   Lines 41–74 compute contrast ratios from hex colors (`leftBg`, `rightBg`) to dynamically assign `--title-color`, `--text-color`, `--text-color-light`, `--container-color-alt`, and `--circle-color`. Supports both 6-character (`#0f172a`) and 3-character (`#000`) hex codes.

4. **Multi-Layout Support**:
   * **2-Column Mode**: `<div class="resume" id="area-cv" style="display: grid; grid-template-columns: 1fr 2fr; ...">`
   * **1-Column ATS Mode**: `<div class="resume resume__single-column" id="area-cv" style="width: 100%; max-width: 100%; ...">`

### 2.3 Gaps & Deficiencies in `generateCleanPrintHTML`

| # | Issue | Current Code Location | Expected Behavior / Test Requirement | Impact |
|---|-------|----------------------|--------------------------------------|--------|
| 1 | Missing `--page-padding` in `:root` | `src/utils/staticHtmlPdfEngine.js:258-271` | `:root { --page-padding: ${pagePadding}px; ... }` | Fails `staticHtmlPdfEngine.test.js:188`, `challenger-stress-suite.test.jsx:504`, `pairwise-interactions.test.jsx:36` |
| 2 | Missing `bd-grid` in 2-col resume root | `src/utils/staticHtmlPdfEngine.js:230` | `<div class="resume bd-grid" id="area-cv" ...>` | Fails `challenger-stress-suite.test.jsx:108` |
| 3 | Hardcoded font family and typography tokens | `src/utils/staticHtmlPdfEngine.js:264-271` | Dynamic `--body-font`, `--font-scale`, `--line-height` | Required for R1 (2026-09-02T02:11:43Z) universal typography engine |
| 4 | Hardcoded padding in 1-column layout | `src/utils/staticHtmlPdfEngine.js:241` (`padding: 2rem 2.5rem;`) | `padding: var(--page-padding, 24px);` | Breaks spacing customization in 1-col ATS mode |

---

## 3. 2 A4 Page Auto-Scaling & Height Calculation

### 3.1 Mathematical Foundation of A4 Auto-Scaling
* **Standard A4 Physical Dimensions**: $210\text{ mm} \times 297\text{ mm}$ ($8.27\text{ in} \times 11.69\text{ in}$)
* **CSS Pixel Conversion at 96 DPI**:
  * $1\text{ mm} = \frac{96\text{ px}}{25.4\text{ mm}} \approx 3.779527559\text{ px}$
  * $1\text{ A4 Width} = 210 \times 3.779527559 = 793.7\text{ px}$ (rendered container width $\approx 794\text{ px} - 840\text{ px}$)
  * $1\text{ A4 Height} = 297 \times 3.779527559 = 1122.52\text{ px} \approx 1123\text{ px}$
  * $2\text{ A4 Pages Maximum Height} = 1122.52 \times 2 = 2245.04\text{ px} \approx 2246\text{ px}$ (`MAX_A4_2PAGE_HEIGHT_PX = 2246`)

### 3.2 Auto-Scale Algorithm & Floor Limit
```
                       +-------------------------------+
                       | Input: renderedHeight (px)    |
                       +---------------+---------------+
                                       |
                                       v
                        [ renderedHeight <= 2246px? ]
                               /               \
                             YES                NO
                             /                    \
                     +-------------+       +------------------------------------+
                     | Return 1.0  |       | calculated = 2246 / renderedHeight |
                     +-------------+       +-----------------+------------------+
                                                             |
                                                             v
                                            [ calculated < MIN_SCALE_FLOOR (0.75)? ]
                                                    /                  \
                                                  YES                   NO
                                                  /                       \
                                         +------------------+     +------------------+
                                         | Return 0.75      |     | Return calculated|
                                         | (Strict Floor)   |     | (e.g. 0.898)     |
                                         +------------------+     +------------------+
```

### 3.3 Discrepancy Analysis in `calculatePrintScale`
In `src/utils/staticHtmlPdfEngine.js`:
```javascript
const MAX_A4_2PAGE_HEIGHT_PX = 2246; // 2 A4 pages at 96 DPI
const MIN_SCALE_FLOOR = 0.82; // <-- BUG: Set to 0.82 instead of 0.75

export const calculatePrintScale = (renderedHeight) => {
  if (!renderedHeight || renderedHeight <= MAX_A4_2PAGE_HEIGHT_PX) {
    return 1.0;
  }
  const calculated = MAX_A4_2PAGE_HEIGHT_PX / renderedHeight;
  return Math.max(MIN_SCALE_FLOOR, +(calculated.toFixed(3)));
};
```
* **Test Expectation (`staticHtmlPdfEngine.test.js:125-135` & `challenger-stress-suite.test.jsx:255-264`)**:
  * Height = 3000px $\rightarrow$ $\frac{2246}{3000} = 0.7486 \rightarrow$ clamped to floor **0.75**.
  * Height = 10000px $\rightarrow$ clamped to floor **0.75**.
* **Current Result**: Returns `0.82`, causing 4 test failures.
* **Fix**: Change `MIN_SCALE_FLOOR` from `0.82` to `0.75`.

### 3.4 Client-Side Isolated Iframe Execution (`executeCleanPrint`)
`src/utils/staticHtmlPdfEngine.js` lines 457–510:
1. Generates clean static HTML.
2. Injects hidden `<iframe>` into `document.body`.
3. Writes static HTML and waits for `readyState === 'complete'` / `onload`.
4. Measures `doc.body.scrollHeight` and computes `scale = calculatePrintScale(renderedHeight)`.
5. Applies `doc.body.style.zoom = scale` when `scale < 1.0`.
6. Invokes `iframe.contentWindow.print()` and cleans up iframe.

* **Iframe Dimension Discrepancy**:
  * `executeCleanPrint` currently sets: `iframe.style.width = '210mm'; iframe.style.height = '297mm';`
  * `challenger-stress-suite.test.jsx:204-205` asserts: `expect(iframe.style.width).toBe('0px'); expect(iframe.style.height).toBe('0px');`

### 3.5 Backend PDF Pipeline Alignment (`netlify/functions/generate-pdf.js` & `scripts/generate-pdf.js`)
* **Current Backend Setup**:
  `netlify/functions/generate-pdf.js` boots Chromium via Puppeteer, navigates to frontend URL, injects `localStorage`, reloads, measures height, and renders custom single-page PDF with `width: '968px', height: '${finalHeight}px'`.
* **Alignment Need**:
  Backend should leverage `generateCleanPrintHTML(cvData)` directly with `page.setContent(html)` and `page.pdf({ format: 'A4', printBackground: true })`, ensuring identical formatting, faster execution (no URL load/reload), and adherence to 2 A4 pages.

---

## 4. Existing Testing Infrastructure

### 4.1 Test Stack & Configuration
* **Test Runner**: Vitest v1.3.1 (`"test": "vitest run"`, `"test:watch": "vitest"`)
* **Environment**: `jsdom` v24.0.0
* **Testing Libraries**: `@testing-library/react` v14.2.1, `@testing-library/jest-dom` v6.4.2
* **Config File**: `vite.config.js`:
  ```javascript
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    css: false,
  }
  ```
* **Test Setup (`src/tests/setup.js`)**:
  * Mocks and manages `localStorage` in-memory store.
  * Polyfills `window.matchMedia`, `ResizeObserver`, `IntersectionObserver`, `window.print`, `window.scrollTo`.
  * Invokes `@testing-library/react` `cleanup()` and `vi.clearAllMocks()` after each test.

### 4.2 Complete Test Suite Inventory & Health Matrix

| Test Suite File | Focus Area | Total Tests | Passed | Failed | Status |
|-----------------|------------|:-----------:|:------:|:------:|:------:|
| `src/tests/spacing.test.jsx` | R1: Spacing variables, localStorage, slider controls | 10 | 10 | 0 | ✅ PASS |
| `src/tests/polymorphic-dnd.test.jsx` | R2: Cross-column DND, item adapter polymorphism | 10 | 10 | 0 | ✅ PASS |
| `src/tests/registry.test.jsx` | R3: Component/section extensible registry | 10 | 10 | 0 | ✅ PASS |
| `src/tests/iconography.test.jsx` | R4: Lucide icons, Obsidian callouts, tooltip bounds | 10 | 10 | 0 | ✅ PASS |
| `src/tests/e2e-scenarios.test.jsx` | R1–R5: End-to-end full CV user lifecycle | 5 | 5 | 0 | ✅ PASS |
| `src/tests/adversarial-challenger.test.jsx` | Robustness, corrupted storage, XSS, Boxicons | 15 | 15 | 0 | ✅ PASS |
| `src/tests/staticHtmlPdfEngine.test.js` | R5: Static HTML print engine & auto-scaler | 10 | 7 | 3 | ⚠️ FAIL |
| `src/tests/challenger-stress-suite.test.jsx` | Deep stress testing: PDF, math, tooltips | 28 | 21 | 7 | ⚠️ FAIL |
| `src/tests/pairwise-interactions.test.jsx` | Multi-feature interactions & combinations | 6 | 5 | 1 | ⚠️ FAIL |
| **TOTAL** | | **104** | **93** | **11** | **89.4% Pass** |

### 4.3 Root Cause Breakdown of 11 Test Failures

```
Total Failures: 11
 ├── Issue A: MIN_SCALE_FLOOR = 0.82 instead of 0.75 (5 failures)
 │    ├── staticHtmlPdfEngine.test.js: T2.1 (calculatePrintScale at 3000px)
 │    ├── staticHtmlPdfEngine.test.js: T2.2 (calculatePrintScale at 10000px)
 │    ├── challenger-stress-suite.test.jsx: 2.3 (scale ratio at 2800px)
 │    ├── challenger-stress-suite.test.jsx: 2.4 (floor limit at 2995px+)
 │    └── challenger-stress-suite.test.jsx: 2.5 (Monte Carlo random heights)
 │
 ├── Issue B: Missing --page-padding in :root within static HTML (4 failures)
 │    ├── staticHtmlPdfEngine.test.js: T2.5 (Preserves custom CSS spacing)
 │    ├── challenger-stress-suite.test.jsx: 1.3 (1-col ATS --page-padding)
 │    ├── challenger-stress-suite.test.jsx: 4.1 (YIQ contrast & dynamic spacing)
 │    └── pairwise-interactions.test.jsx: 1.1 (Static print HTML preserves spacing)
 │
 └── Issue C: Container Classes & Iframe Dimensions (2 failures)
      ├── challenger-stress-suite.test.jsx: 1.2 (asserts class="resume bd-grid" id="area-cv")
      └── challenger-stress-suite.test.jsx: 1.5 (asserts iframe.style.width == '0px')
```

---

## 5. Build and Execution Pipeline

### 5.1 `package.json` Scripts & Dependencies
* **Build Script**: `npm run build` $\rightarrow$ `vite build`
* **Test Script**: `npm test` $\rightarrow$ `vitest run`
* **Dev Server**: `npm run dev` $\rightarrow$ `vite` (port 5173, `0.0.0.0`)

```json
{
  "dependencies": {
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "lucide-react": "^1.39.0",
    "netlify-cli": "^27.4.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/react": "^14.2.1",
    "@vitejs/plugin-react": "^4.2.1",
    "jsdom": "^24.0.0",
    "vite": "^5.0.8",
    "vitest": "^1.3.1"
  }
}
```

### 5.2 Build Execution Verification
* **Command**: `npm run build`
* **Result**:
  * Transformed 1869 modules.
  * Generated `dist/index.html` (0.49 kB), `dist/assets/index-*.css` (12.75 kB), `dist/assets/index-*.js` (332.57 kB).
  * Build time: **1.18s**, Exit Code: **0**.
  * No bundle size warnings or missing module errors.

---

## 6. Architecture & Implementation Proposal for Subsequent Phases

Based on the 2026-09-02T02:11:43Z requirements, the following precise code updates are proposed for implementation in Phase 1:

### 6.1 `src/utils/staticHtmlPdfEngine.js` Refactor Snippet
```javascript
// Change floor limit from 0.82 to 0.75
const MIN_SCALE_FLOOR = 0.75;

// In generateCleanPrintHTML:
export const generateCleanPrintHTML = (cvData) => {
  const data = cvData || {};
  const layout = data.layout || {};
  const sections = Array.isArray(data.sections) ? data.sections : [];

  const is2Col = layout.type !== '1-column';
  const pagePadding = Number(layout.pagePadding ?? 24);
  const sectionGap = Number(layout.sectionGap ?? 20);
  const itemGap = Number(layout.itemGap ?? 8);
  const fontFamily = layout.fontFamily || "'Poppins', sans-serif";
  const fontScale = layout.fontScale || 1.0;
  const lineHeight = layout.lineHeight || 1.45;

  const leftBg = layout.leftBg || '#fafafa';
  const rightBg = layout.rightBg || '#ffffff';
  const leftColors = getDynamicTextColors(leftBg);
  const rightColors = getDynamicTextColors(rightBg);

  const leftSections = sections.filter(s => s.column === 'left');
  const rightSections = sections.filter(s => s.column === 'right');

  let bodyContent = '';
  if (is2Col) {
    bodyContent = `
      <div class="resume bd-grid" id="area-cv" style="display: grid; grid-template-columns: 1fr 2fr; width: 100%; max-width: 100%; margin: 0; padding: 0; box-shadow: none;">
        <div class="resume__left" style="background: ${leftBg}; padding: var(--page-padding, 1.5rem 1.25rem); --title-color: ${leftColors.titleColor}; --text-color: ${leftColors.textColor}; --text-color-light: ${leftColors.textColorLight}; --circle-color: ${leftColors.circleColor};">
          ${leftSections.map(renderSectionHTML).join('')}
        </div>
        <div class="resume__right" style="background: ${rightBg}; padding: var(--page-padding, 1.5rem 1.5rem); --title-color: ${rightColors.titleColor}; --text-color: ${rightColors.textColor}; --text-color-light: ${rightColors.textColorLight}; --circle-color: ${rightColors.circleColor};">
          ${rightSections.map(renderSectionHTML).join('')}
        </div>
      </div>
    `;
  } else {
    bodyContent = `
      <div class="resume resume__single-column" id="area-cv" style="width: 100%; max-width: 840px; margin: 0 auto; padding: var(--page-padding, 2rem 2.5rem); background: #ffffff;">
        ${sections.map(renderSectionHTML).join('')}
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(data.profile?.name || 'Curriculum Vitae')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Merriweather:wght@300;400;700&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">
  <style>
    :root {
      --page-padding: ${pagePadding}px;
      --section-gap: ${sectionGap}px;
      --item-gap: ${itemGap}px;
      --title-color: #0f172a;
      --text-color: #334155;
      --text-color-light: #64748b;
      --body-font: ${fontFamily};
      --font-scale: ${fontScale};
      --line-height: ${lineHeight};
      --h1-font-size: calc(1.45rem * var(--font-scale, 1));
      --h2-font-size: calc(1.15rem * var(--font-scale, 1));
      --h3-font-size: calc(0.95rem * var(--font-scale, 1));
      --normal-font-size: calc(0.88rem * var(--font-scale, 1));
      --small-font-size: calc(0.82rem * var(--font-scale, 1));
      --smaller-font-size: calc(0.75rem * var(--font-scale, 1));
    }
    ...
  `;
};
```

### 6.2 `src/index.css` Print Rule Strengthening
```css
@media print {
  .cv-section,
  .cv-block,
  .experience__content, 
  .education__content,
  .skills__name,
  .editable-item-container {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
}
```

---

## 7. Verification Matrix for Implementation Phase

| Check | Command / Assertion | Expected Value |
|---|---|---|
| Vitest Suite | `npx vitest run` | 9 test files passed, 104 tests passed, 0 failed |
| Production Build | `npm run build` | `✓ built in ~1.2s`, dist files generated |
| Auto-Scale Floor | `calculatePrintScale(10000)` | Strict `0.75` |
| CSS Injections | `generateCleanPrintHTML(cvData)` | Contains `--page-padding: ...`, `--section-gap: ...`, `--item-gap: ...` |
| Zero Artifacts | `generateCleanPrintHTML(cvData)` | 0 instances of `.drag-handle`, `.round-btn-*`, `<input>`, etc. |
