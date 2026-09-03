# Analysis: Testing & Build Infrastructure for Clean Print & Export Engine

**Date:** 2026-09-03  
**Explorer:** Survey 3 (Testing & Build Infrastructure)  
**Target:** Ressume CV Editor (`juani981/Ressume`)  
**Working Directory:** `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o6_survey_3`

---

## 1. Executive Summary

This investigation analyzed the test runner, existing test suite, build system, and validation harness of Ressume to support the implementation of a bulletproof, zero-artifact, 1:1 vector/text PDF print and export engine as required by the latest request (`ORIGINAL_REQUEST.md`, section `2026-09-03T01:50:08Z`).

### Key Discoveries:
1. **Build Health**: The production build (`npm run build` using Vite 5.4.21) completes with **0 errors in 1.28 seconds**, generating optimized bundles (`dist/index.html`, `dist/assets/index-*.css`, `dist/assets/index-*.js`).
2. **Test Runner Health**: The test suite runs via Vitest v1.3.1 with JSDOM 24.0.0. Current test execution yields **235 passed, 5 failed out of 240 tests (97.9% pass rate)** across 12 test files.
3. **Source of the 5 Existing Test Failures**:
   - All 5 test failures are located in tooltip bounding-rect math (`src/tests/challenger-stress-suite.test.jsx` and `src/tests/iconography.test.jsx`) and missing context fallback in `InlineEdit.jsx` (`src/tests/hyperlink-edit.test.jsx`).
   - The core print engine tests (`src/tests/staticHtmlPdfEngine.test.js`, `dom-geometry-typography.test.jsx` F10–F12, and `empirical-challenger-deep-audit.test.jsx` Mission 4) are **all passing**.
4. **Test Gaps in Print/Export Verification**:
   - While existing tests check basic strings (`<!DOCTYPE html>`, `drag-handle`), there is a lack of deep automated DOM validation verifying that:
     - Output contains strictly 0 interactive selectors across all 11 section types.
     - Dynamic CSS variable bindings are evaluated and consumed across custom inputs.
     - Super-containers enforce both modern (`break-inside: avoid !important`) and legacy Chromium (`page-break-inside: avoid !important`) rules without orphaning headers.
     - Vector text characteristics are 100% verified (explicit checks for 0 `<canvas>` elements, 0 raster base64 images, selectable semantic text nodes, vector Boxicons).
     - The `executeCleanPrint` iframe lifecycle (DOM injection, scaling zoom calculation, print trigger, and timed cleanup) is verified end-to-end.

---

## 2. Infrastructure Analysis

### 2.1 Package Configuration & Dependencies (`package.json`)
- **Package Name**: `ressume-react` (version 0.0.0, private, ESM `"type": "module"`)
- **Runtime Dependencies**:
  - `react` / `react-dom`: `^18.2.0`
  - `@dnd-kit/core`: `^6.1.0`, `@dnd-kit/sortable`: `^8.0.0`, `@dnd-kit/utilities`: `^3.2.2` (for polymorphic drag and drop)
  - `lucide-react`: `^1.39.0` (for Obsidian callouts, tooltip alerts, and ActionMenu icons)
  - `netlify-cli`: `^27.4.2`
- **Development & Test Dependencies**:
  - `vitest`: `^1.3.1` (fast Vite-native unit and integration test runner)
  - `jsdom`: `^24.0.0` (DOM environment emulation for Node.js)
  - `@testing-library/react`: `^14.2.1`
  - `@testing-library/jest-dom`: `^6.4.2`
  - `vite`: `^5.0.8` / `@vitejs/plugin-react`: `^4.2.1`
- **NPM Scripts**:
  - `npm run dev`: `vite`
  - `npm run build`: `vite build`
  - `npm test`: `vitest run` (single-pass execution for CI/CD and verification)
  - `npm run test:watch`: `vitest` (interactive file-watcher mode)

### 2.2 Vitest & JSDOM Setup (`vite.config.js` & `src/tests/setup.js`)
- In `vite.config.js`:
  ```javascript
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    css: false,
  }
  ```
  - `globals: true`: Exposes `describe`, `it`, `test`, `expect`, `vi`, `beforeEach`, `afterEach` globally without explicit imports.
  - `environment: 'jsdom'`: Simulates standard DOM APIs (`document`, `window`, `DOMParser`, `HTMLIFrameElement`, `Element.prototype`).
  - `css: false`: Fast execution without compiling external CSS files in unit tests. **Important implication**: Testing CSS variable propagation in JSDOM must be done by parsing `<style>` text content or checking inline `element.style`, rather than relying on `window.getComputedStyle()` for stylesheet cascade.
- In `src/tests/setup.js`:
  - Polyfills/mocks `localStorage` with a robust in-memory dictionary.
  - Registers `afterEach` hook to invoke `cleanup()`, `localStorage.clear()`, and `vi.clearAllMocks()`.
  - Polyfills `window.matchMedia`, `ResizeObserver`, and `IntersectionObserver`.
  - Mocks `window.print = vi.fn()` and `window.scrollTo = vi.fn()`.
  - **Identified Setup Gap**: In JSDOM, when an `iframe` is dynamically created via `document.createElement('iframe')`, `iframe.contentWindow` is a fresh JSDOM Window instance that does not inherit top-level `window.print` or `window.focus`. During tests, JSDOM outputs `Error: Not implemented: window.focus` and `Error: Not implemented: window.print` to stderr. Adding `HTMLIFrameElement.prototype` mocks or window event polyfills in `setup.js` will eliminate these warnings.

### 2.3 Production Build System Verification (`npm run build`)
Executing `npm run build` with sandbox bypass produces:
```
vite v5.4.21 building for production...
✓ 1879 modules transformed.
dist/index.html                   0.92 kB │ gzip:   0.47 kB
dist/assets/index-C46ENxmJ.css   18.22 kB │ gzip:   4.19 kB
dist/assets/index-DDeZtp3e.js   396.86 kB │ gzip: 116.95 kB
✓ built in 1.28s
```
The production bundle builds with 0 warnings or syntax errors.

---

## 3. Evaluation of Current Test Suite

### 3.1 Existing Test Suite Inventory (12 Files, 240 Tests)

| Test File | Test Count | Status | Domain / Focus |
|---|---|---|---|
| `src/tests/staticHtmlPdfEngine.test.js` | 10 | **10 Passed, 0 Failed** | Unit tests for `generateCleanPrintHTML`, `calculatePrintScale`, `executeCleanPrint` |
| `src/tests/dom-geometry-typography.test.jsx` | 101 | **101 Passed, 0 Failed** | Geometry, typography sliders, CSS variables, F10–F12 print features |
| `src/tests/empirical-challenger-deep-audit.test.jsx` | 29 | **29 Passed, 0 Failed** | Cross-column DnD, registry pattern, Mission 4 print engine |
| `src/tests/spacing.test.jsx` | 10 | **10 Passed, 0 Failed** | Spacing sliders, `--section-gap`, `--item-gap`, `--page-padding` |
| `src/tests/polymorphic-dnd.test.jsx` | 10 | **10 Passed, 0 Failed** | DnD operations across columns and section types |
| `src/tests/registry.test.jsx` | 10 | **10 Passed, 0 Failed** | Extensible section & item registry inheritance pattern |
| `src/tests/adversarial-challenger.test.jsx` | 15 | **15 Passed, 0 Failed** | Adversarial inputs, rapid toggles, extreme state boundaries |
| `src/tests/e2e-scenarios.test.jsx` | 5 | **5 Passed, 0 Failed** | Full user editing, translation, and export flows |
| `src/tests/pairwise-interactions.test.jsx` | 6 | **6 Passed, 0 Failed** | Multi-feature combinations (spacing + DnD + print) |
| `src/tests/challenger-stress-suite.test.jsx` | 31 | **29 Passed, 2 Failed** | Bounding rect math & tooltip positioning |
| `src/tests/iconography.test.jsx` | 10 | **8 Passed, 2 Failed** | Lucide iconography in callouts & tooltips |
| `src/tests/hyperlink-edit.test.jsx` | 6 | **5 Passed, 1 Failed** | Inline hyperlink editing component & popover |

### 3.2 Root-Cause Triage of the 5 Test Failures

1. **`src/tests/challenger-stress-suite.test.jsx` (2 failures)**:
   - **Test 3.1 (`Positions tooltip to the right (rect.right + 20px)`)**:
     - *Observation*: Failed with `expected '804px' to be '820px'`.
     - *Cause*: In `src/components/Editor/SuggestionTooltip.jsx` line 19, `let left = Math.round(rect.right + 4);` was hardcoded instead of the AGENTS.md invariant `rect.right + 20px`.
   - **Test 3.4 (`Clamps top position to minimum 20px when top < 20`)**:
     - *Observation*: Failed with `expected '16px' to be '20px'`.
     - *Cause*: In `SuggestionTooltip.jsx` line 36, minimum top clamp was set to `16` instead of `20`.

2. **`src/tests/iconography.test.jsx` (2 failures)**:
   - **Test T2.1 (`Tooltip flips to the left (rect.left - 320) when approaching viewport right boundary`)**:
     - *Observation*: Failed with `expected style to contain 'left: 280px'`, received `left: 712px`.
     - *Cause*: In `SuggestionTooltip.jsx` line 22, the code clamped `left = Math.max(12, vw - TOOLTIP_WIDTH - 12)` instead of flipping to the opposite side `rect.left - 320px` as required by AGENTS.md rule 3.
   - **Test T2.2 (`Tooltip clamps vertically when approaching window.innerHeight`)**:
     - *Observation*: Failed with `expected style to contain 'top: 380px'`, received `top: 424px`.
     - *Cause*: Discrepancy in `TOOLTIP_ESTIMATED_HEIGHT` (360px vs 400px clamp math).

3. **`src/tests/hyperlink-edit.test.jsx` (1 failure)**:
   - **Test T6 (`Integration with ExperienceItem renders HyperlinkEdit and handles updates cleanly`)**:
     - *Observation*: Threw `TypeError: Cannot destructure property 'activeLanguage' of 'useCV(...)' as it is undefined.`
     - *Cause*: `ExperienceItem` uses `InlineEdit.jsx`, which calls `const { activeLanguage } = useCV();` without fallback (`useCV() || {}`). In T6, `ExperienceItem` was rendered directly without wrapping in `<CVProvider>`.

*(Note: These 5 failures do not originate in `staticHtmlPdfEngine.js`, but addressing them in the implementation phase will bring the entire project suite to 100% green).*

---

## 4. Comprehensive Verification Methodology for Clean Print & Export

To satisfy requirements R1–R4 of the authoritative request (`2026-09-03T01:50:08Z`), automated DOM tests must verify five critical invariants in `executeCleanPrint` and `generateCleanPrintHTML`:

### 4.1 Verifying 0 Interactive Class Selectors and UI Artifacts
The print engine must completely isolate visual document content from editor controls. Automated tests should verify this by parsing the HTML string via `DOMParser` and executing query assertions against a comprehensive blacklist of forbidden selectors:

```javascript
const forbiddenInteractiveSelectors = [
  // Drag handles
  '.drag-handle',
  '.section-drag-handle',
  '.item-drag-handle',
  '[data-dnd-handle]',
  '[aria-roledescription="sortable"]',
  // Deletion buttons
  '.round-btn-del',
  '.section-del-btn',
  '.item-del-btn',
  '.bullet-del-btn',
  // Addition buttons
  '.round-btn-add',
  '.add-bullet-btn',
  '.section-add-container',
  '.column-add-section',
  '.add-section-btn',
  // AI Suggestions and Obsidian Callouts
  '.section-tips-toggle-btn',
  '.suggestion-tooltip',
  '.obsidian-callout',
  // Column resizer and navigation
  '.column-resizer',
  '.l-navbar',
  '.action-menu-btn',
  '.action-menu-btn-wrap',
  '.action-menu-tooltip',
  '.design-popover',
  '.spacing-popover',
  // Form input elements
  'input',
  'textarea',
  'select',
  'button',
  '[contenteditable="true"]',
  '.inline-input',
  '.no-print'
];

forbiddenInteractiveSelectors.forEach(selector => {
  const elements = doc.querySelectorAll(selector);
  expect(elements.length, `Forbidden selector "${selector}" found in clean print HTML`).toBe(0);
});
```

Additionally, the test must verify that user input text containing these class names or tags as plain text (e.g. description stating `"Built a drag-handle library"`) is properly HTML-escaped and does NOT render as active DOM elements.

### 4.2 Verifying Dynamic CSS Variable Bindings
The static HTML output embeds a `<style>` block containing `:root` CSS variables. Tests must verify that custom layout parameters are faithfully reflected in both `:root` declarations and the DOM element styles:

1. **Root Variable Bindings**:
   Extract `<style>` tag content and verify:
   ```javascript
   const styleContent = doc.querySelector('style').textContent;
   expect(styleContent).toMatch(new RegExp(`--page-padding:\\s*${expectedPadding}px;`));
   expect(styleContent).toMatch(new RegExp(`--section-gap:\\s*${expectedSectionGap}px;`));
   expect(styleContent).toMatch(new RegExp(`--item-gap:\\s*${expectedItemGap}px;`));
   expect(styleContent).toMatch(new RegExp(`--font-scale:\\s*${expectedFontScale};`));
   expect(styleContent).toMatch(new RegExp(`--line-height:\\s*${expectedLineHeight};`));
   expect(styleContent).toMatch(new RegExp(`--body-font:\\s*${expectedFontFamily};`));
   ```
2. **DOM Element Usage**:
   Verify that generated markup actually consumes these variables:
   - Sections have `margin-bottom: var(--section-gap, ...);`
   - Blocks have `margin-bottom: var(--item-gap, ...);`
   - Resume columns have `padding: var(--page-padding, ...);`
   - Single-column ATS mode has `max-width: 840px; margin: 0 auto; padding: var(--page-padding, 24px);`

### 4.3 Verifying Super-Container Pagination Rules
To prevent page splits across section titles, experience items, and education blocks, the generator must enforce strict CSS pagination rules:

1. **CSS Rule Invariant**:
   The embedded `<style>` must declare:
   ```css
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
   Tests must assert that:
   - Modern `break-inside: avoid !important;` is present.
   - Legacy Chromium/WebKit `page-break-inside: avoid !important;` is present.
2. **Structural Class Attachment**:
   Tests must verify that EVERY section in the output carries `.cv-section` and EVERY block carries `.cv-block`.
3. **Orphan Header Protection**:
   Tests must verify that section headers (`.section-title`) have `break-after: avoid !important;` or are fully encapsulated within the `.cv-section` super-container.

### 4.4 Verifying 1:1 Vector & Selectable Text (0% Canvas Rasterization)
The user request explicitly forbids raster canvas screenshots (such as `html2canvas`):
> *"rendering 100% selectable text (never rasterized canvas images) with exact typography... 0% canvas rasterization."*

Automated tests can verify this via four independent checks:
1. **Zero Canvas Elements**:
   ```javascript
   expect(doc.querySelectorAll('canvas').length).toBe(0);
   ```
2. **Zero Base64 Raster Images**:
   ```javascript
   const images = doc.querySelectorAll('img');
   images.forEach(img => {
     const src = img.getAttribute('src') || '';
     expect(src).not.toMatch(/^data:image\/(?:png|jpeg|webp);base64/i);
   });
   ```
3. **Selectable Text Nodes**:
   Verify that all text content is rendered as native DOM text nodes (`Node.TEXT_NODE`) inside standard semantic tags (`h1`, `h2`, `h3`, `p`, `span`, `li`), and that `user-select: none` is NEVER present in the stylesheet.
4. **Vector Iconography**:
   Verify that icons (e.g. Boxicons for phone, email, map, GitHub, LinkedIn) render as vector font glyphs (`<i class="bx bx-..."></i>`) or SVG paths, ensuring infinite DPI scaling in print without bitmap blurring.

### 4.5 Verifying `executeCleanPrint` Isolated Iframe Lifecycle
`executeCleanPrint` creates a hidden `iframe`, populates it with `generateCleanPrintHTML`, applies auto-scale zoom, calls print, and cleans up:
1. **DOM Attachment**: Spying on `document.body.appendChild` verifies an `HTMLIFrameElement` is created and hidden (`position: fixed; top: -10000px; border: 0;`).
2. **HTML Content Injection**: Accessing `iframe.contentDocument` verifies it contains the generated clean HTML document.
3. **Auto-Scaling Zoom Application**: Mocking `doc.body.scrollHeight = 3000` (exceeding 2246px) verifies `doc.body.style.zoom` is set to `calculatePrintScale(3000)`.
4. **Print Execution & Cleanup**: Using `vi.useFakeTimers()`, advancing time by 1000ms verifies the iframe is removed from `document.body` via `removeChild`.

---

## 5. Detailed Test Gap Matrix & Recommended Test Architecture

### 5.1 Test Gap Matrix

| Requirement | Current Coverage | Test Gap | Priority |
|---|---|---|---|
| **Artifact Stripping** | Basic check for 5 classes in `defaultSchema` | Does not test all 11 section types; does not test `.section-drag-handle`, `.item-drag-handle`, `.round-btn-del`, `.add-bullet-btn`, `.section-tips-toggle-btn`, `.column-resizer`, `.l-navbar` | **HIGH** |
| **CSS Variables** | Static strings in `:root` verified | Dynamic custom spacing inputs (`padding: 45`, `sectionGap: 35`, etc.), categorized typography scales (`titleScale`, `bodyScale`), and element consumption not tested | **HIGH** |
| **Super-Container Pagination** | Regex check for `break-inside: avoid` | Structural presence of `.cv-section` and `.cv-block` on all child nodes, legacy `page-break-inside: avoid !important`, and orphan header prevention not fully asserted | **HIGH** |
| **Vector / Selectable Text** | Implicit string contains text | No explicit assertions for `doc.querySelectorAll('canvas').length === 0`, absence of raster data-URIs, vector icon tags, and selectable text nodes | **HIGH** |
| **`executeCleanPrint` Lifecycle** | Checked `appendChild` called | Iframe document content, auto-scale zoom styling, print call trigger, error fallback to `window.print()`, and DOM removal cleanup not verified | **MEDIUM** |
| **ActionMenu PDF Trigger** | Button rendered in DOM | Clicking the PDF button in `ActionMenu` to verify `executeCleanPrint` invocation with state and language not verified | **MEDIUM** |
| **Backend PDF Pipeline** | None | `netlify/functions/generate-pdf.js` and `scripts/generate-pdf.js` have 0 test coverage | **LOW** |

### 5.2 Recommended Test Architecture & New Test Suite

We recommend creating a dedicated, production-grade test suite:  
**`src/tests/cleanPrintEngineVerification.test.jsx`**

This suite will implement 15 rigorous test cases organized into 5 tiers:
1. **Tier 1: Zero-Artifact Blacklist Testing** (verifying all 11 section types across 1-col and 2-col modes contain 0 interactive elements).
2. **Tier 2: Dynamic CSS Variable Propagation** (verifying custom numeric values for `--page-padding`, `--section-gap`, `--item-gap`, `--font-scale`, `--line-height`, and categorized scales).
3. **Tier 3: Super-Container Pagination & Split Prevention** (verifying `break-inside: avoid !important` and `page-break-inside: avoid !important` on `.cv-section`, `.cv-block`, and child elements).
4. **Tier 4: Vector & Selectable Text Integrity** (verifying 0 `<canvas>`, 0 raster images, 100% vector font icons, selectable DOM text).
5. **Tier 5: `executeCleanPrint` & ActionMenu Integration** (verifying isolated iframe creation, auto-scale zoom, print triggering, DOM cleanup, and ActionMenu button integration).

---

## 6. Verification and Readiness Checklist

- [x] Test runner configured and working (`vitest run`).
- [x] JSDOM environment supports `DOMParser`, `document.createElement('iframe')`, and CSS text inspection.
- [x] Production build passes cleanly with 0 errors (`npm run build`).
- [x] Root cause identified for the 5 failing tests in the existing suite.
- [x] Verification criteria and test specifications defined for clean print engine implementation.
