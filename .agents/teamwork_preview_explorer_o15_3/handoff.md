# Handoff Report: Cypress E2E Testing Harness, High-Density Fixtures & Clean Print Verification

## 1. Observation

### 1.1 Cypress Configuration, Directory Structure, and Scripts
- **Configuration File** (`cypress.config.js`):
  - `baseUrl: "http://localhost:5173"`, `supportFile: "cypress/support/e2e.js"`, `video: false`, `screenshotOnRunFailure: true`.
  - Custom Node tasks registered:
    - `inspectPdf(filePath)` (lines 14–38): checks `%PDF-1.[0-7]` magic header, counts pages via regex match `/\/Type\s*\/Page(?=[\s\/><\[\{])/g`.
    - `inspectPdfFonts(filePath)` (lines 39–52): extracts fonts matching `/\/BaseFont\s*\/([^\s\/>]+)/g`.
    - `deleteFile(filePath)` (lines 53–59): unlinks target file synchronously.
    - `printWithChrome({ url, outputPath })` (lines 60–70):
      ```javascript
      const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
      ...
      execSync(
        `powershell -Command "Start-Process -FilePath '${chromePath}' -ArgumentList '--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--print-to-pdf=${resolvedOut}', '${url}' -Wait"`
      );
      ```
      **Critical finding**: This task hardcodes a Windows executable path and Windows PowerShell command. When run on Linux (host OS: `linux-x64 (cachyos - rolling)`), it fails immediately with command execution errors.
- **Directory Structure (`cypress/`)**:
  - `cypress/support/`:
    - `e2e.js`: Suppresses `ResizeObserver` and `print` uncaught exceptions; sets `localStorage.setItem('skip_onboarding_tour', 'true')` in `window:before:load` to prevent tour modals from blocking clicks.
    - `commands.js`: Declares custom commands:
      - `cy.waitForFonts()`: awaits `document.fonts.ready`.
      - `cy.stubPrint()`: sets `win.__CYPRESS_PRINT_TEST__ = true`, stubs `window.print` and intercepts `iframe.contentWindow.print` via `Object.defineProperty(win.HTMLIFrameElement.prototype, 'contentWindow', ...)`. Captures `win.__lastPrintDoc = contentWin.document` and dispatches `afterprint` and `print-dialog-closed`.
      - `cy.getLastPrintDoc()`: retrieves `win.__lastPrintDoc` with retry/timeout.
      - `cy.setSliderValue`: sets input range values with synthetic events.
      - `cy.generatePdfWithCDP(outputPath)`: runs Chrome DevTools Protocol commands `Emulation.setEmulatedMedia` (`media: 'print'`) and `Page.printToPDF` (`paperWidth: 8.27`, `paperHeight: 11.69`, `printBackground: true`, `preferCSSPageSize: true`), restoring `media: ''` and writing base64 PDF to disk.
  - `cypress/e2e/`:
    - `01-print-lifecycle.cy.js` (95 lines): Tests editor loading, native print button click, confirmation toast, iframe generation with 2 master stylesheets (`cv-base-styles` and `cv-print-styles`), and zero interactive UI artifacts (12 forbidden selectors: `.drag-handle`, `.section-drag-handle`, `.item-drag-handle`, `.round-btn-del`, `.item-del-btn`, `.action-menu`, `.l-navbar`, `.a4-page-fold-guide`, `.obsidian-callout`, `.suggestion-tooltip`, `[data-editor-ui="true"]`, `.no-print`).
    - `02-print-geometry-and-pagination.cy.js` (137 lines): Asserts `#area-cv` 794px max-width, CSS custom properties transfer (`--page-padding`, `--section-gap`, `--line-height`), ATS 1-column layout mode switch, and zero-split CSS rules (`break-inside: avoid !important`, `break-after: avoid !important` on headers).
    - `03-editor-modifications-to-print.cy.js` (123 lines): Verifies inline text editing reactivity and design menu typography switching (`--body-font`) in printed iframe.
    - `04-cdp-pdf-generation.cy.js` (84 lines): Uses `generatePdfWithCDP` to render physical PDF files (`curriculum-default.pdf`, `curriculum-ats.pdf`, `curriculum-edited.pdf`), validating file existence, PDF headers, size > 15KB, and page limit (`pagesCount <= 2`).
    - `05-pixel-fidelity-and-css-parity.cy.js` (288 lines): Validates sub-pixel dimensions (794px), 0px body margin/padding, computed styles parity between screen and PDF document.
    - `06-multipage-pagebreak.cy.js` (55 lines): Clicks add experience 8 times, verifies `data-editor-break-forced` nodes have `margin-top: 0` and `padding-top: var(--page-padding)`, writes `test-print.html`, and attempts `printWithChrome` (which fails on Linux).
    - `07-component-dnd-interactivity.cy.js` (165 lines): Tests DND overlay friendly component names, AI lightbulb tips modal, section deletion, and contact item clicks.
  - `cypress/fixtures/`: Currently **does not exist** (no JSON fixtures present).
- **Scripts in `package.json`**:
  - `"test": "vitest run"`
  - `"cypress:open": "cypress open"`
  - `"cypress:run": "cypress run"`
  - `"test:e2e:docker": "docker compose run --rm cypress"`
- **Docker Compose Setup (`docker-compose.yml`)**:
  - `vite-app`: runs Vite dev server on `5173`.
  - `cypress`: uses `cypress/included:latest`, depends on `vite-app`, sets `CYPRESS_BASE_URL=http://vite-app:5173`.
- **Local Tooling State**:
  - `npx cypress run` directly on Linux host fails with:
    `No version of Cypress is installed in: /home/juani/.cache/Cypress/16.1.0/Cypress. Please reinstall Cypress by running: cypress install`.

---

### 1.2 Existing Vitest Test Suite (`src/tests/`)
- Command executed: `npm test` (`vitest run`).
- Output:
  ```
  Test Files  58 passed (58)
       Tests  896 passed (896)
    Duration  17.69s
  ```
- All 58 test files and 896 tests pass 100%.
- Relevant print and pagination test files:
  - `src/tests/cleanPrintEngineVerification.test.jsx` (27 tests, 810 lines): Contains `buildCompleteCVData` fixture (Juan Ignacio Carrizo), verifies static HTML generation, CSS injection, scale calculation, and sanitization.
  - `src/tests/two-column-pdf-pagination-and-extension.test.jsx` (10 tests, 362 lines): Tests `enforceTwoColumnComponentPagination`, simultaneous boundary crossing, orphan title prevention, and 594mm column extension.
  - `src/tests/twoColumnEdgeBleedAndNoFragmentation.test.jsx` (4 tests, 116 lines): Tests 100% width edge bleed, ATS 1-column centering, neutralization of parallel child breaks.
  - `src/tests/bulletPaginationFlowParity.test.jsx` (11 tests, 595 lines): Verifies splitting multi-bullet items at the overflowing bullet instead of pushing the entire item container.
  - `src/tests/bulletPointsNativePrint.test.jsx` (5 tests): Verifies bullet appearance in native print.
  - `src/tests/realtime-sticky-pagination.test.jsx` (12 tests): Verifies live editor multi-page pagination algorithm, ruler height, and `data-total-pages`.
  - `src/tests/editorSnapshotBreakPropagation.test.jsx` (7 tests): Verifies snapshot capture of broken elements and CSS propagation.
  - `src/tests/atsPrintModeFidelity.test.js` (5 tests): Verifies ATS 1-column print mode structure.

---

### 1.3 High-Density CV Data & "JUAN IGNACIO CARRIZO BackEnd.pdf"
- **Physical File in Workspace Root**:
  - File path: `/home/juani/Documentos/Ressume/JUAN IGNACIO CARRIZO BackEnd.pdf`.
  - File size: 33,396 bytes, created `Sat Sep 19 15:56:42 2026 -03` by `Zen Browser 154.0` (cairo 1.18.4).
  - Page count inspection (`pdfinfo`):
    ```
    Creator:         Zen Browser 154.0
    Producer:        cairo 1.18.4
    Pages:           3
    Page size:       596 x 842 pts (A4)
    ```
  - Text extraction per page (`pdftotext "JUAN IGNACIO CARRIZO BackEnd.pdf" -`):
    - **Page 1**: Left column has Perfil profesional, Habilidades Técnicas, Educación, Certificaciones (part 1). Right column has Header (Juan Ignacio Carrizo), Perfil summary, Experiencia laboral (Desarrollador Web Full-Stack, Pasante de Soporte Técnico), Contactos, Proyectos Destacados (Plataforma online...).
    - **Page 2**: Right column has Proyectos (Orquestador Moodle, Sitio Dinámico de Encuestas). Left column has 1 certification (Introducción al Análisis de Datos con Python).
    - **Page 3**: Left column has 2 certifications (Introducción a la Ciberseguridad, English Certificate Level C2). **Right column is completely blank!**
- **CV Data Sources in Codebase**:
  - `docs/AI_PROMPTS_AND_REPRESENTATION_GUIDE.md` (lines 36–118): Contains the exact source text, roles, companies, projects, degrees, and certifications present in `JUAN IGNACIO CARRIZO BackEnd.pdf`.
  - `src/tests/cleanPrintEngineVerification.test.jsx` (lines 12–180): Contains `buildCompleteCVData()` with the full data structure representing Juan Ignacio Carrizo.
  - `src/components/Editor/ActionMenu.jsx` (line 280): Mentions `"Restablecer CV original (Juan Ignacio Carrizo)"`.
- **Application Data Loading Mechanism**:
  - `src/context/hooks/useCVData.js` (`loadInitialCVData()`, lines 104–113):
    Reads `localStorage.getItem('cvData')`. If present, parses JSON, passes through `ensureProfileHeader()`, and uses it as the initial CV state. If missing or invalid, falls back to `defaultSchema`.
  - Persistence: Every change updates `localStorage.setItem('cvData', JSON.stringify(cvData))`.
  - Preloading in Cypress: In `cy.visit('/', { onBeforeLoad(win) { win.localStorage.setItem('cvData', JSON.stringify(highDensityFixture)); win.localStorage.setItem('skip_onboarding_tour', 'true'); } })`, the app directly initializes with high-density CV data.

---

### 1.4 Mechanisms for Clean Print Triggering & Programmatic Assertions
- **Triggering Print**:
  - UI Button click: `cy.stubPrint(); cy.get('[data-testid="btn-action-native-print"]').click();`
  - Calling function: `executeCleanPrint(cvData, lang)` from `src/utils/staticHtmlPdfEngine.js`.
  - Direct HTML generation: `generateCleanPrintHTML(cvData, lang, snapshot)`.
- **Programmatic Assertions Needed**:
  1. **Strict 2-Page Count Matching Live Editor**:
     - Live editor: `cy.get('#area-cv').should('have.attr', 'data-total-pages', '2');` and `cy.get('.a4-page-fold-guide').should('have.length', 1);`.
     - Print DOM (`cy.getLastPrintDoc()`):
       - `#area-cv` style `--print-total-pages` must equal `'2'`.
       - `#area-cv` style `min-height` must equal `'594mm'`.
       - `.resume__left` and `.resume__right` style `min-height` must equal `'594mm'`.
     - Physical PDF: `cy.generatePdfWithCDP('cypress/downloads/high-density.pdf')` followed by PDF page inspection returning `pagesCount === 2`.
  2. **Content in Both Columns on Page 1 and Page 2 (No Alternating Blank Columns)**:
     - In `cy.getLastPrintDoc()`: Measure relative vertical bounds `top - cvTop` for `.resume__left .cv-block` and `.resume__right .cv-block`:
       - `leftPage1`: items where `relTop < 1123px` -> `expect(leftPage1.length).to.be.greaterThan(0)`.
       - `rightPage1`: items where `relTop < 1123px` -> `expect(rightPage1.length).to.be.greaterThan(0)`.
       - `leftPage2`: items where `1123px <= relTop < 2246px` -> `expect(leftPage2.length).to.be.greaterThan(0)`.
       - `rightPage2`: items where `1123px <= relTop < 2246px` -> `expect(rightPage2.length).to.be.greaterThan(0)`.
       - `page3Items`: items where `relTop >= 2246px` -> `expect(page3Items.length).to.equal(0)`.
  3. **Zero Phantom Blank Pages or Trailing Pages**:
     - Physical PDF page count strictly 2.
     - Extracted page 2 text contains non-empty text from both columns.
     - Page 3 does not exist.
  4. **Zero Regressions in ATS 1-Column Mode**:
     - Toggle: `cy.get('[data-testid="ats-mode-toggle"]').click();`.
     - `#area-cv` has `resume--ats-mode` and `resume__single-column`.
     - In print document: `#area-cv` has `margin: 0 auto`, `.resume__left` and `.resume__right` are absent, content is rendered in a linear flow, and Vitest suite passes 100%.

---

### 1.5 Tooling & Headless Browser Quirks
1. **Windows-Only Task in `cypress.config.js` (`printWithChrome`)**:
   - `cypress.config.js` lines 61-68 execute `powershell` with `C:\Program Files\Google\Chrome\Application\chrome.exe`. On Linux and macOS, this task crashes.
   - Contrast: `cy.generatePdfWithCDP()` in `cypress/support/commands.js` uses standard Chrome DevTools Protocol (`Cypress.automation('remote:debugger:protocol', ...)`), which is cross-platform and requires no external PowerShell or hardcoded file paths.
2. **Missing Local Cypress Binary**:
   - Cypress binary is not installed in `/home/juani/.cache/Cypress/16.1.0/Cypress`. Running Cypress locally requires `npx cypress install` or Docker.
3. **Flate-Compressed PDF Regex Inaccuracy in `inspectPdf`**:
   - In `cypress.config.js`, `inspectPdf` counts pages using regex `/\/Type\s*\/Page(?=[\s\/><\[\{])/g`. On PDFs where the cross-reference or object tables are Flate-compressed (such as PDFs emitted by Cairo/Firefox or certain Chrome print pipelines with `/ObjStm`), the regex finds 0 matches and defaults to 1.
   - Linux host has `/usr/bin/pdfinfo` and `/usr/bin/pdftotext` which accurately inspect page counts and text for all PDF versions.
4. **CSS Grid Page-Break Collision in `@media print`**:
   - In Chromium and Gecko, applying `break-before: page` to child elements inside CSS Grid columns (`.resume__left` and `.resume__right`) causes the browser to trigger multiple sequential full-document breaks. If left column breaks at 1080px and right column breaks at 1100px, Chromium breaks the document once for the left item and again for the right item, creating alternating empty columns across 3+ pages.
   - Code in `staticHtmlPdfEngine.js` currently attempts multiple conflicting mitigations:
     - `createSanitizedPrintClone` (lines 634–646): Strips breaks if both columns have breaks.
     - `snapshotBreaksCSS` (lines 1049–1061): Sets `break-before: auto` on duplicate folds.
     - `executeCleanPrint` snapshot loop (lines 1164–1175): Sets `break-before: auto` on duplicate folds.
     - `enforceTwoColumnComponentPagination` (lines 878–885): Re-injects `break-before: page !important` for straddling items in BOTH columns.
     This conflict causes asynchronous column paging.

---

## 2. Logic Chain

1. **Observation**: `JUAN IGNACIO CARRIZO BackEnd.pdf` generated from this app produced 3 pages, where Page 3 contained only 2 left-column certifications and a completely blank right column.
   - **Reasoning**: The CV content is high-density and intended to fit on exactly 2 pages. Because items in the left column straddled the A4 page boundary, independent page break rules (`break-before: page`) were triggered, but without synchronized 2-column boundary handling.
   - **Inference**: The 2-column CSS Grid layout requires synchronized vertical flow where parallel column overflows are aligned into unified page containers rather than independent column breaks.

2. **Observation**: `staticHtmlPdfEngine.js` has four different locations handling 2-column breaks (`createSanitizedPrintClone`, `snapshotBreaksCSS`, `executeCleanPrint` snapshot loop, and `enforceTwoColumnComponentPagination`), each applying different and sometimes conflicting `break-before` styles.
   - **Reasoning**: When `enforceTwoColumnComponentPagination` runs inside the iframe (line 1245), it unconditionally assigns `break-before: page` to straddling elements in both columns, overriding the deduplication attempted in lines 1049–1061.
   - **Inference**: In Chromium's print engine, two parallel children in a grid having `break-before: page` results in two page breaks instead of one, pushing column contents out of sync onto alternating pages.

3. **Observation**: `cypress.config.js` has `printWithChrome` which calls PowerShell and Windows Chrome, but `04-cdp-pdf-generation.cy.js` and `commands.js` implement `cy.generatePdfWithCDP()`.
   - **Reasoning**: `cy.generatePdfWithCDP()` uses Chromium's native CDP protocol (`Page.printToPDF` and `Emulation.setEmulatedMedia`), which runs in headless Chromium on all operating systems without external process spawning.
   - **Inference**: All E2E PDF generation and verification specs should use `cy.generatePdfWithCDP()` and `cy.stubPrint()` / `cy.getLastPrintDoc()`.

4. **Observation**: `useCVData.js` initializes state from `localStorage.getItem('cvData')` with zero external network dependencies.
   - **Reasoning**: Cypress tests can supply high-density CV fixtures (such as the Juan Ignacio Carrizo dataset from `docs/AI_PROMPTS_AND_REPRESENTATION_GUIDE.md` or `cleanPrintEngineVerification.test.jsx`) directly in `window:before:load`.
   - **Inference**: This enables instant, deterministic loading of the exact high-density CV without fragile UI typing sequences.

---

## 3. Caveats

- **Cypress Binary Installation**: The local cache `/home/juani/.cache/Cypress/16.1.0/Cypress` does not currently contain the Cypress binary. To execute `npm run cypress:run` directly on the host, `npx cypress install` must be run, or tests must run via Docker (`docker compose run --rm cypress`) once the image is pulled.
- **`inspectPdf` Regex**: If external PDFs or compressed PDFs are inspected using `cy.task('inspectPdf')`, the regex may return 0 matches. For Linux environments, enhancing the task with a fallback to `pdfinfo` or `pdf-parse` will prevent false assertion failures.
- **No changes made**: As this is a read-only exploration task, no source code, configuration, or test files were altered.

---

## 4. Conclusion

1. **Test Environment State**:
   - Vitest suite is healthy: **58 test files, 896 tests passing 100%**.
   - Cypress suite contains 7 well-structured specs, but `06-multipage-pagebreak.cy.js` contains a Windows-specific PowerShell call (`printWithChrome`) that should be updated to use cross-platform CDP (`generatePdfWithCDP`).
   - Cypress requires `npx cypress install` before host-level execution.
2. **High-Density Fixture & Repro Artifact**:
   - `JUAN IGNACIO CARRIZO BackEnd.pdf` is present at the workspace root, demonstrating the 3-page bug with an empty right column on Page 3.
   - The full JSON fixture can be derived directly from `docs/AI_PROMPTS_AND_REPRESENTATION_GUIDE.md` / `buildCompleteCVData()` in `src/tests/cleanPrintEngineVerification.test.jsx`, saved as `cypress/fixtures/highDensityCV.json`, and injected via `localStorage.setItem('cvData', ...)` in E2E tests.
3. **Print Assertion Protocol**:
   - Assert editor page count (`#area-cv[data-total-pages="2"]`).
   - Trigger print with `cy.stubPrint()`.
   - In `getLastPrintDoc()`: Assert `#area-cv` style `--print-total-pages="2"`, `min-height="594mm"`, and verify that both `.resume__left` and `.resume__right` have elements positioned in both Page 1 (`y < 1123px`) and Page 2 (`1123px <= y < 2246px`), with zero elements at `y >= 2246px`.
   - In physical PDF: Generate via `cy.generatePdfWithCDP()` and assert exact 2-page count.
   - In ATS mode: Assert single-column flow, centered alignment, and zero column fracturing.

---

## 5. Verification Method

### 5.1 Commands to Verify Test Harness
1. **Verify Vitest Suite**:
   ```bash
   npm test
   ```
   *Expected result*: All 58 test files pass, 896 tests pass.
2. **Inspect Existing High-Density PDF**:
   ```bash
   pdfinfo "JUAN IGNACIO CARRIZO BackEnd.pdf"
   pdftotext "JUAN IGNACIO CARRIZO BackEnd.pdf" -
   ```
   *Expected result*: Reports 3 pages, Page 3 contains certifications only on left, blank right.
3. **Verify Host PDF Tools**:
   ```bash
   which pdfinfo pdftotext
   ```
   *Expected result*: `/usr/bin/pdfinfo` and `/usr/bin/pdftotext` exist.

### 5.2 Invalidation Conditions
- If `npm test` fails any of the 896 existing tests.
- If `JUAN IGNACIO CARRIZO BackEnd.pdf` is moved or deleted.
- If Cypress is executed without running `npx cypress install` or pulling `cypress/included:latest`.
