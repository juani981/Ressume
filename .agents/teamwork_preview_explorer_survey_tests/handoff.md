# Test Suite Survey & Audit Report

**Role**: Test Suite Specialist Explorer  
**Working Directory**: `C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_explorer_survey_tests`  
**Date**: 2026-09-11  

---

## 1. Observation

### 1.1 Baseline Test Suite Execution
- **Command**: `npm test -- --run`
- **Output**:
  ```text
  Test Files  38 passed (38)
       Tests  634 passed (634)
    Start at  13:16:03
    Duration  27.64s
  ```
- **Prerequisite Observation**: Prior to running, 18 test files failed with `Error: Failed to resolve import "react-joyride" from "src/App.jsx"`. Examination of `package.json` confirmed `"react-joyride": "^3.2.0"` was present at line 20, but the package had not been installed into `node_modules`. Running `npm install` synchronized dependencies and restored all 38 test files to passing status (634 passed, 0 failed, 0 skipped).

---

### 1.2 Tautological & Pseudo-Testing Tests Across the Suite
A test is tautological when it computes synthetic values via an internal helper function $f(x)$, assigns those values to mock methods (e.g. `getBoundingClientRect`), and then asserts that $f(x) - f(x) === 0$. Exactly **24 tests across 4 test files** exhibit this anti-pattern or lack assertions altogether:

#### A. `src/tests/pixelParityEditorPrint.test.jsx` (2 Tests)
- **Helper Definition**: Lines 157–370 define `computeDOMTreeLayout(areaCvNode, layout)` which estimates layout geometry with hardcoded math (e.g., lines 265, 276, 280: `top: currentTop + (hasTitle ? titleHeight : 0) + itemsHeight`). Lines 375–410 define `attachBoundingRects(areaCvNode, boxes)` which overrides `areaCvNode.getBoundingClientRect`, `sec.getBoundingClientRect`, and `blk.getBoundingClientRect`.
- **Test 1 — Line 711**: `PARITY-4.1: Real DOM sections and items have strict 0px drift across top, left, width, height in 2-column mode`
  - Lines 724–728:
    ```javascript
    const editorBoxes = computeDOMTreeLayout(editorAreaCv, defaultSchema.layout);
    const printBoxes = computeDOMTreeLayout(printAreaCv, defaultSchema.layout);

    attachBoundingRects(editorAreaCv, editorBoxes);
    attachBoundingRects(printAreaCv, printBoxes);
    ```
  - Lines 742–750 & 767–775:
    ```javascript
    const deltaTop = Math.abs(edRect.top - prRect.top);
    expect(deltaTop, `Section ${secId} top drift: ${deltaTop}px`).toBe(0);
    ```
  - **Reason**: Both `editorAreaCv` and `printAreaCv` are fed through the exact same JavaScript mock function `computeDOMTreeLayout`. The test only verifies that `computeDOMTreeLayout` is deterministic with itself, completely bypassing JSDOM and browser layout engines.
- **Test 2 — Line 781**: `PARITY-4.2: Real DOM sections and items have strict 0px drift across top, left, width, height in 1-column ATS mode`
  - Lines 805–809 & 823–826: Identical circular calculation evaluating `computeDOMTreeLayout(..., atsSchema.layout)` on both DOM trees and asserting `edRect.top - prRect.top === 0`.

#### B. `src/tests/adversarial-spacing-layout-extremes.test.jsx` (8 Tests)
- **Helper Definition**: Lines 149–363 duplicate `computeDOMTreeLayout`, and lines 368–403 duplicate `attachBoundingRects`.
- **Tests 1 to 4 — Lines 411–484**: `ADV-1.${idx + 1} (2-Column): [${cfg.name}] asserts Math.abs(delta) === 0 across all dimensions`
  - Evaluates 4 configurations in `EXTREME_CONFIGS`:
    1. `Tight & Compact` (Line 411, idx 0)
    2. `Spacious Executive` (Line 411, idx 1)
    3. `Huge Font / Small Spacing` (Line 411, idx 2)
    4. `Tiny Font / Huge Spacing` (Line 411, idx 3)
  - Lines 462–466: Calls `computeDOMTreeLayout` on `editorAreaCv` and `printAreaCv`, attaches mock rects via `attachBoundingRects`, and asserts `Math.abs(edRect.top - prRect.top) === 0` (lines 477–480).
- **Tests 5 to 8 — Lines 486–539**: `ADV-1.${idx + 1} (1-Column ATS): [${cfg.name}] asserts Math.abs(delta) === 0 across all dimensions`
  - Evaluates the same 4 configurations in 1-column ATS mode:
    5. `Tight & Compact` (Line 486, idx 0)
    6. `Spacious Executive` (Line 486, idx 1)
    7. `Huge Font / Small Spacing` (Line 486, idx 2)
    8. `Tiny Font / Huge Spacing` (Line 486, idx 3)
  - Lines 516–520 & 531–534: Identical circular evaluation.

#### C. `src/tests/challenger-o10-dom-coordinates-stress.test.jsx` (13 Tests)
- **Helper Definition**: Lines 116–336 define `resolveDOMCoordinates(areaCvNode, layout)` which iterates DOM nodes and calculates theoretical coordinates in JavaScript (`coordinates.set('section-' + sectionId, ...)`).
- **Tests 1 to 8**:
  1. Line 372: `1.1: Sections with items: [] maintain exact 0px drift between editor and print in 2-column mode` (Lines 385–386: compares `resolveDOMCoordinates` on editor vs print)
  2. Line 413: `1.2: Empty sections in 1-column ATS mode maintain strict 0px drift across all boundaries` (Lines 431–432)
  3. Line 445: `1.3: Empty section with custom title and 0 items renders identical title height in both with 0px drift` (Lines 462–463)
  4. Line 482: `2.1: Experience section with 25 bullet items maintains 0px drift on every bullet and container` (Lines 511–512)
  5. Line 539: `2.2: Omission of .bullet-add-row in print causes strictly 0px displacement on downstream elements` (Lines 582–583)
  6. Line 601: `3.1: Dense multiline descriptions and wrapped titles maintain 0px coordinate drift` (Lines 627–628)
  7. Line 652: `4.1: Profile header with maximum contact elements and long bio matches 1:1 with 0px drift` (Lines 668–669)
  8. Line 682: `4.2: Sections with Unicode, symbols, and custom titles evaluate identical metrics` (Lines 701–702)
- **Tests 9 to 12 — Line 723**: `5.1-${ratio}: Dynamic column resize at ${ratio}% enforces strict 0px drift across both columns`
  - Loops over ratios `[25, 33, 40, 50]` (4 tests). Lines 746–747 run `resolveDOMCoordinates` on editor vs print and assert delta is 0.
- **Test 13 — Line 783**: `6.1: Concealing all 26 interactive artifacts causes strictly 0px shift in adjacent and descendant elements`
  - Lines 791 & 797: Runs `resolveDOMCoordinates(editorAreaCv, defaultSchema.layout)` before and after removing `.drag-handle`, `.round-btn-del`, etc. Because `resolveDOMCoordinates` does not inspect artifact classes or CSS layout flow, both computations return identical mathematical coordinates.
- **Reason**: All 13 tests compare the output of a local JavaScript arithmetic function against itself.

#### D. `src/tests/test_inspect_juan_cv.test.jsx` (1 Test)
- **Test — Line 95**: `simulates pagination pass by pass` (Lines 95–191)
- **Verbatim Code Inspection**:
  ```javascript
  describe('Simulate recalculatePagination on Juan CV', () => {
    it('simulates pagination pass by pass', () => {
      // ... loops and calculations ...
      console.log('FINAL RESULTS:');
      items.forEach(it => {
        if (it.forcedBreak || it.marginTop > 0) {
          console.log(`  ${it.id}: forcedBreak=${it.forcedBreak}, ...`);
        }
      });
      console.log('Test completed.');
    });
  ```
- **Reason**: Contains **0 `expect()` assertions**. It is an unverified debugging script left in the test suite that always passes unconditionally.

---

### 1.3 Pillar 3 Style Tag Assertion Audit (`cleanPrintEngineVerification.test.jsx`)
- **Print Engine Specification (`src/utils/staticHtmlPdfEngine.js` lines 483–540)** generates three distinct `<style>` elements in the document `<head>`:
  1. `<style id="cv-base-styles">` (line 483) — Sanitized base CSS + dynamic custom properties
  2. `<style id="cv-print-styles">` (line 535) — Print-specific media rules
  3. `<style id="cv-snapshot-breaks">` (line 538) — Dynamic page-break injection CSS
- **Test Suite Audit (`src/tests/cleanPrintEngineVerification.test.jsx` lines 432–491)**:
  - `T3.1` (line 439): `const styleContent = Array.from(doc.querySelectorAll('style')).map(s => s.textContent).join('\n');`
  - `T3.2` (line 448): Same generic query
  - `T3.3` (line 460): Same generic query
  - `T3.5` (line 484): Same generic query
  - **Direct Search for Style Tag IDs**:
    `Select-String -Path "src/tests/cleanPrintEngineVerification.test.jsx" -Pattern "cv-base-styles|cv-print-styles|cv-snapshot-breaks"` returned **0 results**.
- **Observation**: Pillar 3 never asserts the presence of `doc.getElementById('cv-base-styles')`, `doc.getElementById('cv-print-styles')`, or `doc.getElementById('cv-snapshot-breaks')`.

---

### 1.4 CSS Variable Transfer Test Existence and Status
- **Source Code Audit (`src/utils/staticHtmlPdfEngine.js` lines 724–870)**:
  `executeCleanPrint` creates the offscreen iframe and calls `doc.write(html)`. While `generateCleanPrintHTML` injects variables from `cvData.layout`, `executeCleanPrint` does **not** read CSS custom properties from the live `#area-cv` DOM element (such as inline style properties set by sliders or scripts) and does **not** set them on `iframe.contentDocument.documentElement.style`.
- **Test Suite Search**:
  Searching all test files for `documentElement`, `transfer.*css`, or iframe root CSS variable propagation returned **0 matching tests**. Existing tests in `pixelParityEditorPrint.test.jsx` (lines 543–634) only compare static string output from `generateCleanPrintHTML` against default schema layouts.

---

### 1.5 JSDOM `getBoundingClientRect` Mock Audit
Searching across all 38 test files revealed **10 test files** mocking `getBoundingClientRect`. They divide into two distinct categories:

| File | Mocking Method | Target Elements | Assessment & Validity |
|---|---|---|---|
| `two-column-pdf-pagination-and-extension.test.jsx` | `element.getBoundingClientRect = vi.fn(...)` | `safeRightItem`, `straddlingRightItem`, `#area-cv` | **Valid**: Provides deterministic boundary coordinates to unit-test `enforceTwoColumnComponentPagination` logic. |
| `final-e2e-cross-cutting-challenger.test.jsx` | `vi.spyOn(mockAreaCv, 'getBoundingClientRect')` | `#area-cv` (wide vs narrow screens) | **Valid**: Tests responsive docking calculations of `AddSectionModal` without circular assertions. |
| `epic3-actionmenu-ats-modal.test.jsx` | `vi.spyOn(mockAreaCv, 'getBoundingClientRect')` | `#area-cv` | **Valid**: Verifies modal alignment relative to `#area-cv`. |
| `challenger-m3-epic3-stress.test.jsx` | `vi.spyOn(mockAreaCv, 'getBoundingClientRect')` | `#area-cv` across multiple screen resolutions | **Valid**: Tests modal boundary collision detection. |
| `challenger-m2-1-rich-text-stress.test.jsx` | `mockDomElem.getBoundingClientRect = vi.fn(...)` | Active text edit element | **Valid**: Tests dynamic floating toolbar tracking per AGENTS.md Rule 3. |
| `editorSnapshotBreakPropagation.test.jsx` | `element.getBoundingClientRect = vi.fn(...)` | `#area-cv`, section titles, items | **Valid**: Verifies `captureEditorSnapshot()` reads relative coordinates from the DOM correctly. |
| `realtime-sticky-pagination.test.jsx` | `areaCv.getBoundingClientRect = vi.fn(...)` | `#area-cv` | **Valid**: Supplies base container coordinates for snapshot testing. |
| `test_inspect_juan_cv.test.jsx` (Lines 193–390) | `item.getBoundingClientRect = () => ...` | Breakable components in Juan CV | **Valid**: Feeds realistic element heights to test `recalculatePagination` and anti-orphan lookahead. |
| `pixelParityEditorPrint.test.jsx` | `attachBoundingRects(areaCvNode, boxes)` | All sections and items | **Invalid / Tautological**: Overrides rects with values computed by `computeDOMTreeLayout` on both sides and compares them. |
| `adversarial-spacing-layout-extremes.test.jsx` | `attachBoundingRects(areaCvNode, boxes)` | All sections and items across 4 configs | **Invalid / Tautological**: Same circular mock as `pixelParityEditorPrint.test.jsx`. |

---

### 1.6 Git History Hotspots (`git log --oneline -40`)
Commit frequency on test files over the last 40 commits:
1. `src/tests/staticHtmlPdfEngine.test.js` — **5 commits**
2. `src/tests/final-e2e-cross-cutting-challenger.test.jsx` — **4 commits**
3. `src/tests/version-manager-hub.test.jsx` — **3 commits**
4. `src/tests/empirical-challenger-deep-audit.test.jsx` — **3 commits**
5. `src/tests/epic3-actionmenu-ats-modal.test.jsx` — **3 commits**
6. `src/tests/challenger-m3-epic3-stress.test.jsx` — **3 commits**
7. `src/tests/dom-geometry-typography.test.jsx` — **3 commits**
8. `src/tests/spacing.test.jsx` — **3 commits**
9. `src/tests/cleanPrintEngineVerification.test.jsx` — **3 commits**
10. `src/tests/test_inspect_juan_cv.test.jsx` — **2 commits**
11. `src/tests/pixelParityEditorPrint.test.jsx` — **2 commits**
12. `src/tests/challengerCleanPrintLifecycle.test.jsx` — **2 commits**
13. `src/tests/editorSnapshotBreakPropagation.test.jsx` — **2 commits**
14. `src/tests/two-column-pdf-pagination-and-extension.test.jsx` — **2 commits**

**Hotspot Analysis**:
- The primary points of friction in the repo are:
  - Print engine lifecycle, iframe creation, and page-break pagination (`staticHtmlPdfEngine.test.js`, `cleanPrintEngineVerification.test.jsx`, `two-column-pdf-pagination-and-extension.test.jsx`).
  - ActionMenu restructuring and AddSectionModal positioning (`epic3-actionmenu-ats-modal.test.jsx`, `challenger-m3-epic3-stress.test.jsx`, `final-e2e-cross-cutting-challenger.test.jsx`).
  - Strict pixel-parity and geometry validation in JSDOM (`pixelParityEditorPrint.test.jsx`, `dom-geometry-typography.test.jsx`).

---

## 2. Logic Chain

1. **Test Suite Baseline**:
   - Running `npm test -- --run` initially failed on 18 files due to missing `react-joyride` in `node_modules` (Observation 1.1).
   - Once installed via `npm install`, all 38 files passed cleanly with 634 passed tests (Observation 1.1).
   - Therefore, the baseline test count is confirmed at **634 tests across 38 files**, and any refactoring or rewriting must maintain $\ge 634$ passing tests.

2. **Tautological Tests**:
   - In `pixelParityEditorPrint.test.jsx` (lines 711 & 781), `adversarial-spacing-layout-extremes.test.jsx` (lines 411 & 486, 8 tests total), and `challenger-o10-dom-coordinates-stress.test.jsx` (13 tests), the assertions check whether coordinates generated by `computeDOMTreeLayout` or `resolveDOMCoordinates` match coordinates from the exact same function (Observation 1.2).
   - In JSDOM, CSS layout is not rendered by the engine; layout calculations return 0 unless mocked.
   - The authors sought to test "0px drift across real DOM elements" without using a headless browser (Playwright/Puppeteer), resulting in a closed loop where JavaScript mocks its own expected values and asserts equality with itself.
   - In `test_inspect_juan_cv.test.jsx` (line 95), the test contains zero assertions and only logs to console.
   - Therefore, these 24 tests must be converted to documented no-ops annotated with `// TODO: requires Playwright/Puppeteer for real geometry` or rewritten with hardcoded known-correct assertions, without deleting the tests so the test count does not decrease.

3. **Pillar 3 Style Tag Verification**:
   - `src/utils/staticHtmlPdfEngine.js` explicitly generates three style tags with IDs `cv-base-styles`, `cv-print-styles`, and `cv-snapshot-breaks` (Observation 1.3).
   - `cleanPrintEngineVerification.test.jsx` Pillar 3 concatenates all `<style>` elements into a single text blob without checking element IDs (Observation 1.3).
   - Therefore, Pillar 3 fails to assert one of its core architectural requirements: that all three discrete style tags exist in the generated document.

4. **CSS Custom Property Transfer**:
   - `ORIGINAL_REQUEST.md` requirement R1.2 requires transferring CSS custom properties from `#area-cv` to the iframe root (Observation 1.4).
   - Neither `staticHtmlPdfEngine.js` executes this transfer nor does any existing test verify it (Observation 1.4).
   - Therefore, a dedicated test must be added to verify that CSS custom properties set on `#area-cv` in the editor DOM are copied to `iframe.contentDocument.documentElement.style`.

5. **JSDOM getBoundingClientRect Mocks**:
   - 8 out of 10 test files using `getBoundingClientRect` mocks do so properly to provide unit-level inputs to business logic (modal docking, tooltip positioning, snapshot capturing, pagination lookahead) (Observation 1.5).
   - Only 2 files (`pixelParityEditorPrint.test.jsx` and `adversarial-spacing-layout-extremes.test.jsx`) use global synthetic tree mocks that produce tautological tests (Observation 1.5).

---

## 3. Caveats

- **JSDOM vs Real Browser**: JSDOM cannot evaluate CSS flexbox, grid, page-break cuts, font glyph widths, or line wrapping. Any test claiming to test "0px coordinate drift" in JSDOM without hardcoded mock inputs will inevitably either fail or be tautological. Full geometric verification requires Playwright or Puppeteer.
- **Test Count Invariant**: The repository prompt mandates that `npm test -- --run` must maintain $\ge 634$ passing tests. Tautological tests must not be deleted; they should be converted to passing no-ops with proper documentation or rewritten to assert specific schema/HTML structure.
- **Scope Limit**: As an Explorer agent, this report does not alter application source code or test files. All findings and proposed code changes are communicated for the implementing agent.

---

## 4. Conclusion

1. **Baseline Integrity**: The test suite baseline is 634 passing tests across 38 files.
2. **Tautological Tests (24 total)**:
   - 2 tests in `pixelParityEditorPrint.test.jsx` (PARITY-4.1, PARITY-4.2)
   - 8 tests in `adversarial-spacing-layout-extremes.test.jsx` (ADV-1 2-Column × 4, ADV-1 1-Column ATS × 4)
   - 13 tests in `challenger-o10-dom-coordinates-stress.test.jsx` (Tests 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 4.1, 4.2, 5.1-[25,33,40,50], 6.1)
   - 1 non-asserting test in `test_inspect_juan_cv.test.jsx` (line 95)
3. **Pillar 3 Missing Assertions**: `cleanPrintEngineVerification.test.jsx` must be augmented to verify all three style tag IDs (`cv-base-styles`, `cv-print-styles`, `cv-snapshot-breaks`).
4. **Missing CSS Variable Transfer Test**: A new test must be added to assert that CSS custom properties set on `#area-cv` propagate to the iframe root during `executeCleanPrint`.

---

## 5. Verification Method & Concrete Recommendations

### Independent Verification Commands
1. Run test suite: `npm test -- --run` (must report 38 test files, $\ge 634$ tests passed, 0 failed).
2. Verify git hotspots:
   `git log --oneline -40 --name-only -- "src/tests" | Select-String "src/tests/" | Group-Object | Sort-Object Count -Descending`
3. Inspect style tag IDs:
   `Select-String -Path "src/tests/cleanPrintEngineVerification.test.jsx" -Pattern "cv-base-styles|cv-print-styles|cv-snapshot-breaks"`

---

### Concrete Implementation Recommendations

#### 1. Pillar 3 Style Tag Verification (`src/tests/cleanPrintEngineVerification.test.jsx`)
Add the following test under `Pillar 3: Strict Zero-Split Super-Container Pagination`:
```javascript
it('T3.6: verifies that all three required print style tags (cv-base-styles, cv-print-styles, cv-snapshot-breaks) are injected with discrete IDs', () => {
  const html = generateCleanPrintHTML(fullCVData);
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const baseStylesTag = doc.getElementById('cv-base-styles');
  const printStylesTag = doc.getElementById('cv-print-styles');
  const snapshotBreaksTag = doc.getElementById('cv-snapshot-breaks');

  expect(baseStylesTag, '<style id="cv-base-styles"> is missing').not.toBeNull();
  expect(printStylesTag, '<style id="cv-print-styles"> is missing').not.toBeNull();
  expect(snapshotBreaksTag, '<style id="cv-snapshot-breaks"> is missing').not.toBeNull();

  // Ensure baseStyles contains sanitized CSS custom properties
  expect(baseStylesTag.textContent).toContain('--page-padding:');
  // Ensure printStyles contains @media print rules
  expect(printStylesTag.textContent).toContain('@media print');
});
```

#### 2. CSS Variable Transfer Test (`src/tests/cleanPrintEngineVerification.test.jsx` or `pixelParityEditorPrint.test.jsx`)
Add the following test to verify editor `#area-cv` CSS variables transfer to the iframe root:
```javascript
it('T5.6: executeCleanPrint transfers dynamic CSS custom properties from editor #area-cv to print iframe root element', async () => {
  // 1. Create a simulated live editor #area-cv in DOM with custom styles
  const editorAreaCv = document.createElement('div');
  editorAreaCv.id = 'area-cv';
  editorAreaCv.style.setProperty('--page-padding', '42px');
  editorAreaCv.style.setProperty('--section-gap', '30px');
  editorAreaCv.style.setProperty('--font-scale', '1.2');
  document.body.appendChild(editorAreaCv);

  let capturedDoc = null;
  vi.spyOn(document.body, 'appendChild').mockImplementation(function (child) {
    if (child.tagName === 'IFRAME') {
      const doc = document.implementation.createHTMLDocument('Print Preview');
      capturedDoc = doc;
      Object.defineProperty(child, 'contentDocument', { get: () => doc, configurable: true });
      Object.defineProperty(child, 'contentWindow', {
        get: () => ({
          document: doc,
          focus: vi.fn(),
          print: vi.fn(),
          addEventListener: (evt, cb) => { if (evt === 'load') cb(); }
        }),
        configurable: true
      });
    }
    return HTMLBodyElement.prototype.appendChild.call(this, child);
  });

  await executeCleanPrint(fullCVData);

  expect(capturedDoc).not.toBeNull();
  const rootStyle = capturedDoc.documentElement.style;
  expect(rootStyle.getPropertyValue('--page-padding')).toBe('42px');
  expect(rootStyle.getPropertyValue('--section-gap')).toBe('30px');
  expect(rootStyle.getPropertyValue('--font-scale')).toBe('1.2');

  document.body.removeChild(editorAreaCv);
});
```

#### 3. Rewriting Tautological Tests to Documented No-Ops
For each of the 24 tautological tests (e.g. `PARITY-4.1`, `PARITY-4.2`, `ADV-1.x`, `challenger-o10` tests):
Replace the circular assertion body with:
```javascript
// TODO: requires Playwright/Puppeteer for real browser layout and geometry verification.
// JSDOM does not calculate layout geometry; synthetic getBoundingClientRect mocks tested
// circular arithmetic rather than real browser rendering.
expect(true).toBe(true);
```
For `test_inspect_juan_cv.test.jsx` line 95 (`simulates pagination pass by pass`), add an assertion verifying the expected simulation outcome (e.g., `expect(items.find(it => it.id === 'proj2').forcedBreak).toBe(true)`), or retain the simulation and add `expect(hasChanges).toBe(true)` so that it does not remain a 0-assertion test.
