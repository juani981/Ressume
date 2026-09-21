# Handoff Report: Bullet Flow, Paged Media Margins, and Cypress E2E Investigation

**Agent**: `teamwork_preview_explorer_o17_survey_3`  
**Milestone**: Milestone 17 Survey 3  
**Target Focus**: Bullet Flow, Paged Media Margins, and Cypress E2E Verification (R1, R2, R3, R4)  
**Date**: 2026-09-20  

---

## 1. Observation

### 1.1 Bullet Lists and Rendering Architecture
- **In Editor Mode (`src/components/CV/items/ExperienceItem.jsx`, `ProjectsItem.jsx`, `VolunteeringItem.jsx`, `SortableBulletItem.jsx`)**:
  - Bullets are structured within an item as:
    ```jsx
    <div className="experience__bullets-container">
      <ul className="experience__bullets" style={{ padding: 0, marginTop: '0.25rem', marginBottom: 0, listStyle: 'none' }}>
        <li className="bullet-item-row editable-item-container cv-block" data-item-id={`${itemId}_bullet_${idx}`}>
    ```
  - In `src/registry/sectionRegistry.js:800`, simple lists declare `containerClass: 'experience__bullets simple-list-ul'` and `itemClass: 'simple-list-item'`.
  - In `src/components/CV/SortableBulletItem.jsx:76`, every draggable bullet has:
    `className="bullet-item-row editable-item-container cv-block"`.
  - In `src/index.css:970-985`, native list bullets are suppressed (`list-style: none !important`), and bullets render a custom circle (`.simple-list-circle`).
- **In Static / Print View (`src/components/CV/items/ExperienceItem.jsx:73-98`)**:
  - Renders `<ul className="experience__bullets">` with `<li className="cv-block" data-item-id={`${item.id}_bullet_${idx}`} ...>`.
- **In Clean Print Sanitization (`src/utils/staticHtmlPdfEngine.js:624-705`)**:
  - `createSanitizedPrintClone` clones the live editor DOM and purges UI controls (`.round-btn-del`, `.bullet-del-btn`, `.drag-handle`, `.bullet-add-row`, `.add-bullet-btn`).
  - Purges all native bullets: `clone.querySelectorAll('ul, ol, li').forEach(el => el.style.setProperty('list-style', 'none', 'important'))`.

### 1.2 Application of `break-inside: avoid` and `break-inside: auto`
- **Declarative CSS (`src/styles/print.css`)**:
  - **Avoid**:
    - Lines 164-167: `.cv-block, .experience__content, .education__content, .skills__name, .profile__description, .home__data, .simple-list-item, li.cv-block, .contact__item, .spacer-section { break-inside: avoid !important; page-break-inside: avoid !important; }`
    - Lines 374-384: Re-enforces `break-inside: avoid !important` on atomic blocks, titles, and headers.
    - Lines 417-424: `.experience__bullets li, ul.experience__bullets li, ul.simple-list-ul li, li.cv-block, .bullet-item-row { break-inside: avoid !important; page-break-inside: avoid !important; }`
  - **Auto**:
    - Lines 149-151: `.cv-section, .section, .editable-section-container { break-inside: auto; page-break-inside: auto; }`
    - Lines 386-414: `.experience__bullets-container, ul.experience__bullets, ul.simple-list-ul, .simple-list-container, .experience__data` and parent containers matching `:has(.experience__bullets-container)`, `:has(ul.experience__bullets)`, `:has(.bullet-item-row)`, `:has([data-editor-break-forced="true"])` are set to `break-inside: auto !important; page-break-inside: auto !important;`.
- **Imperative Inline Style Injection (`src/utils/staticHtmlPdfEngine.js:805-870`)**:
  - Lines 828-832: Direct inline `el.style.setProperty('break-inside', 'avoid', 'important')` on all `ATOMIC_BLOCK_SELECTOR` items.
  - Lines 844-859: Direct inline `el.style.setProperty('break-inside', 'auto', 'important')` on `SPLITTABLE_CONTAINERS` (`.experience__bullets-container`, `ul.experience__bullets`, `ul.simple-list-ul`, etc.) and traverses upward setting `break-inside: auto !important` on `.experience__content`, `.cv-block`, `.editable-item-container`.
  - Lines 862-869: Direct inline `bulletEl.style.setProperty('break-inside', 'avoid', 'important')` on each individual `li`.
- **2-Column Mode Conflict (`src/styles/print.css:72-98`)**:
  - `#area-cv.resume.bd-grid .resume__left *` and `#area-cv.resume.bd-grid .resume__right *` have `break-before: auto !important; page-break-before: auto !important; break-after: auto !important; page-break-after: auto !important;`.

### 1.3 Page Margin and Padding Handling Across Multi-Page Documents
- **`@page` Directive (`src/styles/print.css:8-11`)**:
  ```css
  @page {
    size: A4;
    margin: 0;
  }
  ```
  - Required by `src/tests/dom-geometry-typography.test.jsx:693` (`@page { size: A4; margin: 0; }`).
  - `@page { margin: 0 }` prevents native browser margins from clipping full-bleed headers or the colored left column background (`--left-bg`).
- **Page 1 Spacing**:
  - Handled by `#area-cv .resume__left, #area-cv .resume__right { padding: var(--page-padding, 2rem) var(--page-padding, 1.5rem); }` (`src/index.css:636`) and `#area-cv.resume__single-column { padding: var(--page-padding, 24px) !important; }` (`src/styles/print.css:104`).
- **Page 2+ Top Margin Spacing**:
  - `#area-cv` has `box-decoration-break: slice !important;` (`src/styles/print.css:44-45`). Its padding does NOT repeat on Page 2.
  - Because `@page` margin is 0, any element landing naturally at the top of Page 2 sits at `y = 0`, touching the physical paper edge unless an explicit offset is applied.
  - In `src/styles/print.css:208-212`:
    ```css
    [data-editor-break-forced="true"]:not(:first-child) {
      break-before: page !important;
      page-break-before: always !important;
      padding-top: var(--page-padding, 24px) !important;
      margin-top: 0 !important;
    }
    ```
  - In `src/utils/staticHtmlPdfEngine.js:737-758` (`createSanitizedPrintClone`) and `1243-1250` (`snapshotBreaksCSS`):
    Elements marked with `[data-editor-break-forced="true"]` have `margin-top: 0 !important; padding-top: var(--page-padding, 24px) !important; break-before: page !important;`.
  - `padding-top` is used because CSS Paged Media specifications stipulate that `margin-top` immediately following a page break is collapsed/truncated to 0.

### 1.4 Empirical Evidence from Reference PDFs
- Running `pdfinfo` and `pdftotext` on the reference PDFs produced from Zen Browser:
  - `CV_TU NOMBRE Y APELLIDO_Título Profesional _ Especialidad.pdf`:
    - **Pages**: 4 (Expected: 2).
    - **Page 1**: Profiles, contact, experience (1 item), projects (1 item with bullets), education (1 item).
    - **Page 2**: Contained ONLY ONE solitary item:
      `Nueva Titulación / Grado\nUniversidad / Instituto\n2024 – Actualidad`
    - **Page 3**: Remaining items (Education, Certifications, Languages, Experience, Education).
    - **Page 4**: Trailing empty page (`\f\f`).
  - `2columnCV_TU NOMBRE Y APELLIDO_Título Profesional _ Especialidad.pdf`:
    - **Pages**: 5 (Expected: 2).
    - **Page 2**: Completely empty page (`\f\f`).
    - **Page 4**: Sliced and overlapping text fragments (`Nueva Titulación Nuevo logro o / Grado responsabilidad`).

### 1.5 Cypress Test Environment & Execution Results
- **Configuration (`cypress.config.js`)**:
  - `baseUrl: "http://localhost:5173"`.
  - Node tasks: `inspectPdf` (counts pages via `pdfinfo` or `/Type /Page` stream tokens), `inspectPdfFonts`, `printWithChrome`, `deleteFile`.
- **Existing Cypress Specs**:
  - `01-print-lifecycle.cy.js` (4 tests)
  - `02-print-geometry-and-pagination.cy.js` (4 tests)
  - `03-editor-modifications-to-print.cy.js` (4 tests)
  - `04-cdp-pdf-generation.cy.js` (4 tests)
  - `05-pixel-fidelity-and-css-parity.cy.js` (7 tests)
  - `06-multipage-pagebreak.cy.js` (1 test)
  - `07-component-dnd-interactivity.cy.js` (6 tests)
  - `08-two-column-print-synchronization.cy.js` (4 tests)
- **Vitest Suite Execution**:
  - Command: `npm test`
  - Result: **58 test files passed, 900 tests passed (100% GREEN)**.
- **Cypress E2E Real Browser Execution (`chrome-for-testing`)**:
  - Command: `npx cypress run --browser chrome-for-testing`
  - **Spec 08 Failure (`08-two-column-print-synchronization.cy.js`)**:
    - Test 4 (`Garantía de Cero Regresión en Modo ATS (1 Columna)`):
      `AssertionError: El PDF ATS debe mantenerse acotado a máximo 2 páginas: expected 4 to be at most 2`.
      Actual PDF generated in headless Chrome was **4 pages**, failing the test!
  - **Spec 05 Failures (`05-pixel-fidelity-and-css-parity.cy.js`)**:
    - Test 1 & 3: `#area-cv` width evaluated to `818px` instead of `794px` because the Cypress test asserted `getComputedStyle(printCv).width` inside the iframe under `screen` media instead of emulating `print` media (`@media print` rules were not active during measurement).
    - Test 5 & 7: Failed because `.column-add-section` was completely stripped by `createSanitizedPrintClone` instead of preserved as a transparent spacer.

---

## 2. Logic Chain

```
[Observation 1.4: Reference PDFs show 4-5 pages with solitary bullets/items]
           +
[Observation 1.3: @page has margin: 0; #area-cv has box-decoration-break: slice]
           +
[Observation 1.2: Atomic blocks and bullets have break-inside: avoid]
           ↓
(Step 1): Because @page has margin: 0 and #area-cv is sliced, Page 2 has 0px top padding by default.
           ↓
(Step 2): To avoid elements touching the top paper edge of Page 2, the pagination engine injects
          [data-editor-break-forced="true"] with padding-top: var(--page-padding) and break-before: page
          on the first item it calculates will land on Page 2 based on SCREEN DOM coordinates.
           ↓
(Step 3): In a real browser print engine (Gecko Cairo in Zen Browser or Blink in Chromium), font rasterization,
          subpixel glyph metrics, and line wrapping differ slightly from screen JSDOM/DOM calculations.
          [AGENTS.md Rule 5 & Rule 6 invariant]
           ↓
(Step 4): As a result, an earlier element (e.g. Bullet 2 or an item just before the forced break)
          exceeds the 1123px physical page height during real print rasterization.
           ↓
(Step 5): The browser's native print engine sees break-inside: avoid on that earlier element, and automatically
          breaks it to Page 2 naturally.
           ↓
(Step 6): That earlier element lands at y = 0 of Page 2 with 0 top margin (since it was not the editor's forced break).
           ↓
(Step 7): Immediately following that element is the editor's intended break element (Bullet 3 or next item),
          which carries explicit `break-before: page !important`.
           ↓
(Step 8): The browser's print engine respects `break-before: page !important` and IMMEDIATELY triggers
          A SECOND FULL PAGE BREAK to Page 3!
           ↓
(Step 9): Page 2 is left containing only the solitary earlier element surrounded by massive blank space,
          Page 3 starts with the forced item, and trailing padding/min-height causes an empty Page 4.
           ↓
(Step 10): Vitest passes 100% (900/900 tests) because JSDOM does not render fonts or execute A4 media box model,
           masking this fatal discrepancy completely. Cypress running in a real browser immediately reproduces
           the exact 4-page inflation (Spec 08 Test 4).
```

---

## 3. Caveats

1. **Browser Engine Variance**: Zen Browser uses Gecko/Cairo, whereas Cypress currently runs headless Chromium (`chrome-for-testing`). While both engines exhibit the double-break cascade when forced breaks collide with natural breaks, font metrics between Cairo and Skia vary by 1-3px.
2. **`@page` CSS Variable Limitation**: CSS Custom Properties (`var(--page-padding)`) are not supported inside `@page` blocks by either Chromium or Gecko. Any dynamic margins on `@page` would require string-interpolated millimeter/pixel values during HTML generation, but setting `@page { margin: N }` would create white borders around the left column background (`--left-bg`).
3. **Existing Spec 05 Assumptions**: Spec 05 has 4 failing assertions because:
   - It measures iframe computed styles under `screen` media instead of triggering CDP `Emulation.setEmulatedMedia: print`.
   - It expects add buttons (`.column-add-section`) to remain in the print DOM as transparent spacers, but `createSanitizedPrintClone` explicitly purges them to prevent print layout shift.
4. **No Code Modification Undertaken**: In strict compliance with the Explorer archetype and read-only protocol, zero application code files were modified.

---

## 4. Conclusion

1. **Root Cause of Solitary Bullets and Page Proliferation**:
   - The bug is caused by a **collision between the editor's screen-calculated forced page break (`break-before: page`) and the browser's natural print pagination (`break-inside: avoid`)**.
   - When real print text rasterization pushes any element across 1123px ahead of the editor's predicted break point, the browser breaks naturally to Page 2, and then encounters the editor's explicit `break-before: page` on the next node, creating an immediate second break that strands a single item on Page 2.
2. **Page Margin Vulnerability**:
   - Because `@page` has `margin: 0` (necessary for full-bleed column backgrounds), natural breaks to Page 2 possess 0 top margin. The current system compensates solely by attaching `padding-top: var(--page-padding)` to the specific node marked with `[data-editor-break-forced="true"]`. If any element breaks naturally ahead of that node, it touches the top physical edge of Page 2 with 0 margin.
3. **Cypress Environment Readiness**:
   - The Cypress testing pipeline is fully functional and capable of real browser execution via `chrome-for-testing` and Chrome DevTools Protocol (`generatePdfWithCDP`).
   - Spec `08-two-column-print-synchronization.cy.js` already reliably reproduces the ATS multi-page overflow bug in headless Chrome (`expected <= 2 pages, actual = 4 pages`).
4. **Required New Cypress Test Suite (for R1, R2, R3, R4)**:
   - A dedicated spec (e.g. `09-bullet-flow-and-slider-parity.cy.js`) is needed to:
     - Verify 1:1 bullet distribution across page folds (e.g. 2 bullets on Page 1, 2 on Page 2).
     - Verify that the first element on Page 2 respects `padding-top: var(--page-padding)` under print media emulation.
     - Verify that all 10 `cvData.layout` sliders propagate to the print document.
     - Verify physical PDF page count parity matching `data-total-pages`.

---

## 5. Verification Method

To independently verify all findings and test execution:

1. **Verify Existing Vitest Pass Rate (900/900 passing)**:
   ```bash
   npm test
   ```
   *Expected output*: `58 passed (58)`, `900 passed (900)`.

2. **Verify Cypress Bug Reproduction in Real Browser (`chrome-for-testing`)**:
   ```bash
   npx cypress run --browser chrome-for-testing --spec "cypress/e2e/08-two-column-print-synchronization.cy.js"
   ```
   *Expected result*: Test 4 fails with `expected 4 to be at most 2`, confirming that the ATS 1-column layout inflates to 4 pages during real PDF generation.

3. **Verify Reference PDF Page Counts and Solitary Items via Poppler Utilities**:
   ```bash
   pdfinfo "CV_TU NOMBRE Y APELLIDO_Título Profesional _ Especialidad.pdf" | grep "Pages:"
   pdftotext "CV_TU NOMBRE Y APELLIDO_Título Profesional _ Especialidad.pdf" - | grep -n ""
   ```
   *Expected result*: Pages: 4, with form feeds (`\f`) isolating a single education entry on Page 2.

4. **Verify Media Emulation Difference in Spec 05**:
   ```bash
   npx cypress run --browser chrome-for-testing --spec "cypress/e2e/05-pixel-fidelity-and-css-parity.cy.js"
   ```
   *Expected result*: Confirms width calculation failure (818px vs 794px) due to missing print media emulation during DOM measurement.
