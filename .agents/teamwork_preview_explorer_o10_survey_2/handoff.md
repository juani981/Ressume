# Handoff Report: Live Editor Layout, Styling, CSS Custom Properties, and 0px Print Parity

**Agent**: Explorer 2 (Live Editor Styling, Layouts & Variables)  
**Parent Agent**: Project Orchestrator 10 (`330b6d43-f411-474e-9505-d78ef90b8c30`)  
**Handoff Type**: Hard (Investigation Complete)  
**Date**: 2026-09-10  
**Working Directory**: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o10_survey_2`  
**Associated Detailed Findings**: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o10_survey_2/findings.md`

---

## 1. Observation

Direct observations from the codebase inspection, exact paths, line numbers, and tool execution outputs:

1. **Trapped Document Styles in Responsive Breakpoint**:
   - `src/index.css` lines 583–655 contains:
     ```css
     @media screen and (min-width: 968px) {
       .bd-container { margin-left: auto; margin-right: auto; }
       .l-header, .scrolltop { display: none; }
       .resume { display: grid; grid-template-columns: 1fr 2fr; background-color: var(--container-color); ... }
       .resume.resume__single-column, .resume:not(.bd-grid) { display: block; grid-template-columns: none; }
       .resume__left { background-color: var(--container-color-alt); }
       .resume__left, .resume__right { padding: var(--page-padding, 2rem) var(--page-padding, 1.5rem); }
       .section-title, .profile__description { text-align: initial; }
       .home__container { gap: 1.5rem; }
       .home__data { text-align: initial; }
       .home__img { justify-self: initial; }
       .social__container { grid-template-columns: repeat(3, max-content); }
       .skills__content { grid-template-columns: repeat(2, 1fr); }
       .languages__content { grid-template-columns: repeat(2, max-content); column-gap: 3.5rem; }
       .interests__container { grid-template-columns: repeat(4, max-content); column-gap: 3.5rem; }
     }
     ```
   - Outside `@media screen and (min-width: 968px)`:
     - Line 209: `.section-title { text-align: center; }`
     - Line 321: `.home__container { gap: 3rem; }`
     - Line 326: `.home__data { gap: .5rem; text-align: left; }`
     - Line 333: `.home__img { justify-self: center; }`
     - Line 385: `.social__container { grid-template-columns: max-content; gap: 1rem; }`
     - Line 492: `.languages__content { grid-template-columns: repeat(2, 1fr); gap: 0; }`
   - In `src/utils/staticHtmlPdfEngine.js` lines 716–719:
     ```javascript
     const iframeWidth = snapshot?.width ? `${snapshot.width}px` : '794px';
     iframe.style.width = iframeWidth;
     iframe.style.minWidth = iframeWidth;
     ```
     Because `794px < 968px`, `@media screen and (min-width: 968px)` evaluates to `false` inside the print iframe.

2. **Container Width Non-Strictness**:
   - `src/App.jsx` line 651: `#area-cv` style has `width: "100%", maxWidth: "794px", margin: "0 auto"`.
   - `src/index.css` line 78: `#area-cv { width: 210mm; max-width: 100%; margin: 0 auto; }`.
   - `src/utils/staticHtmlPdfEngine.js` lines 260–262 (`captureEditorSnapshot`):
     ```javascript
     const rect = typeof areaCv.getBoundingClientRect === 'function' ? areaCv.getBoundingClientRect() : null;
     const width = Math.round((rect && rect.width) || areaCv.offsetWidth || 0);
     ```
   - When the browser window width is narrower than 794px, `width: 100%` compresses `#area-cv`, causing `snapshot.width < 794px`.

3. **DOM Hierarchy Asymmetry in 1-Column Mode**:
   - `src/App.jsx` lines 644 and 862–868:
     - Outer container (line 644): `<div className="resume resume__single-column resume--ats-mode" id="area-cv" ...>`
     - Nested inner wrapper (line 863): `<div className="resume__single-column" style={{ width: "100%", maxWidth: "794px", margin: "0 auto" }}>`
   - `src/utils/staticHtmlPdfEngine.js` line 434:
     - Outer container: `<div class="${areaCvClasses}" id="area-cv" ...>`
     - Direct children: `${sections.map(renderSectionHTML).join('')}` (no inner `div.resume__single-column`).
   - `src/index.css` line 1818 and `src/styles/print.css` line 59:
     `.resume__single-column { padding: var(--page-padding, 24px) !important; }` targets both outer and inner elements in the editor.

4. **In-Flow Interactive Control Height Addition**:
   - `src/components/CV/items/ExperienceItem.jsx` lines 286–296:
     ```jsx
     <div className="bullet-add-row no-print" style={{ paddingLeft: '1.25rem' }}>
       <button type="button" className="add-bullet-btn no-print" onClick={handleAddBullet} title="Agregar viñeta / logro a este puesto">
         <i className='bx bx-plus' style={{ fontSize: '13px', fontWeight: 'bold' }}></i>
         <span>Agregar viñeta</span>
       </button>
     </div>
     ```
   - `src/index.css` lines 1117–1126:
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
   - `ExperienceItemPrintView` (`ExperienceItem.jsx` line 86) completely omits `.bullet-add-row`. In the editor, this element takes in-flow vertical space (~22px) in every experience block.

5. **Bullet & List Styling Model Asymmetry**:
   - In editor: `SortableBulletItem` (`ExperienceItem.jsx:46-54`):
     `display: flex; paddingRight: '1.5rem'; paddingLeft: '1.25rem';` with manual 5px circle span.
   - In print: `ExperienceItemPrintView` (`ExperienceItem.jsx:135-157`):
     `display: list-item; listStyleType: 'disc'; padding: '0 0.25rem';` with native `::marker`.
   - `paddingRight: '1.5rem'` (24px) in the editor reduces available line width by 24px compared to print.

6. **Variable Fallbacks and Concealment Discrepancies**:
   - Item gap fallback: `index.css:25` (`8px`) vs `print.css:189` (`6px !important`).
   - Column padding fallback: `App.jsx:704` (`2rem 1.5rem`) vs `staticHtmlPdfEngine.js:424` (`1.5rem 1.25rem` and `1.5rem 1.5rem`).
   - Concealment: `index.css:1749` (`.no-print, button { visibility: hidden !important; }`) vs `print.css:156` (`.no-print { display: none !important; }`).
   - `--container-color-alt`: computed dynamically in `App.jsx:470`, omitted in `staticHtmlPdfEngine.js:424`.

7. **Test & Build Verification Baseline**:
   - `npm test`: 32 test files passed (546 tests passed in 10.81s).
   - `npm run build`: Vite build completed cleanly in 1.73s (0 errors).

---

## 2. Logic Chain

1. **Step 1 (Responsive Query Invalidation)**: Observation 1 shows that document layout styles (e.g. `gap: 1.5rem` on `.home__container`, `repeat(3, max-content)` on `.social__container`, `column-gap: 3.5rem` on `.languages__content`) are locked behind `@media screen and (min-width: 968px)`. Observation 1 also shows that the print iframe is created with width 794px. Because 794 < 968, the iframe media query evaluates to false, causing the iframe to use the fallback rules (`gap: 3rem`, narrow stacked links, altered column widths). Therefore, the print snapshot undergoes an automatic layout shift compared to a desktop editor preview.
2. **Step 2 (Width Non-Strictness)**: Observation 2 shows that `#area-cv` has `width: "100%", maxWidth: "794px"`, and `captureEditorSnapshot` records `areaCv.getBoundingClientRect().width`. If the viewport is smaller than 794px, the editor compresses. When printed, A4 physical paper is 794px wide, but the generated HTML is sized to the compressed width, creating visual margins on physical output and mismatched coordinate bounds.
3. **Step 3 (DOM Asymmetry in 1-Col Mode)**: Observation 3 shows that in ATS mode, `App.jsx` renders `#area-cv.resume__single-column` containing a child `div.resume__single-column`, while `staticHtmlPdfEngine.js` renders direct children under `#area-cv`. Because `.resume__single-column` has padding rules in CSS, this structural difference creates divergent selector matching and potential double-padding.
4. **Step 4 (In-Flow Interactive Elements)**: Observation 4 demonstrates that `.bullet-add-row` uses `visibility: hidden` rather than `display: none` or `position: absolute`. In CSS, `visibility: hidden` elements still participate in normal document layout and occupy vertical height. Because print views omit `.bullet-add-row`, the editor DOM has ~22px more height per experience item than the print DOM. This prevents 0px height parity.
5. **Step 5 (Bullet Model Discrepancy)**: Observation 5 shows that editor bullet items have `paddingRight: 1.5rem` (24px space reserved for delete button) and `display: flex`, whereas print bullet items have `padding: 0 0.25rem` and `display: list-item`. A 24px width difference causes text to wrap onto additional lines in the editor that do not wrap in print, causing vertical reflow.
6. **Step 6 (CSS Custom Property Unification)**: Observation 6 shows multiple fallback and variable definition mismatches across `App.jsx`, `staticHtmlPdfEngine.js`, `index.css`, and `print.css`. Aligning all fallbacks and defining a single root/inline variable evaluation block guarantees identical computed styles.

---

## 3. Caveats

- **Network Fonts**: Google Fonts (Poppins, Inter, Roboto, Merriweather, JetBrains Mono) require network resolution in native browsers. In unit tests and headless environments without network access, standard system fallback fonts (sans-serif, serif, monospace) are used.
- **Physical Printer Margins**: Physical printer hardware drivers may enforce unprintable margins (typically 3mm–5mm) unless the user selects "Margen: Ninguno" (Margins: None) in the browser print dialog. CSS specifies `@page { size: A4; margin: 0; }`.
- **No other caveats**: All code paths in `src/index.css`, `src/App.jsx`, `src/context/CVContext.jsx`, `src/styles/print.css`, and `src/utils/staticHtmlPdfEngine.js` were directly inspected.

---

## 4. Conclusion

Achieving absolute 1:1 pixel parity (0px discrepancy) between the interactive `#area-cv` live editor and the clean print snapshot requires four coordinated changes:
1. **Scope Document CSS to `#area-cv`**: Extract `.home__container`, `.social__container`, `.languages__content`, `.skills__content`, `.section-title`, and `.home__img` rules from `@media screen and (min-width: 968px)` so they apply unconditionally inside `#area-cv` in both editor and 794px print iframe.
2. **Lock `#area-cv` to Strict 794px**: Set `width: 794px; min-width: 794px; max-width: 794px;` on `#area-cv` in the live editor, and let `.l-main` provide horizontal overflow scrolling on narrow viewports rather than compressing the document.
3. **Conceal Interactive Elements Without Flow Distortion**: Make `.bullet-add-row` zero-height or out-of-flow when inactive, remove `paddingRight: 1.5rem` from `SortableBulletItem` (positioning the delete button absolute/hover-only), and remove the redundant inner `div.resume__single-column` in `App.jsx`.
4. **Single Source of Truth for Variables & Fallbacks**: Pass the complete set of CSS variables (including `--container-color-alt`) to `#area-cv` in both editor and print, and synchronize all fallback values (`--item-gap: 8px`, `--page-padding: 24px`, `.no-print: display: none !important`).

---

## 5. Verification Method

To independently verify these findings:

1. **Verify Responsive Media Query Invalidation**:
   - Inspect `src/index.css` lines 583–655.
   - Run tests checking iframe layout behavior under 794px width:
     ```bash
     npx vitest run src/tests/cleanPrintEngineVerification.test.jsx
     ```
2. **Verify Container Width & Parity**:
   - Inspect `src/tests/pixelParityEditorPrint.test.jsx`:
     ```bash
     npx vitest run src/tests/pixelParityEditorPrint.test.jsx
     ```
3. **Verify ATS Mode Cascading**:
   - Inspect `src/tests/atsPrintModeFidelity.test.js`:
     ```bash
     npx vitest run src/tests/atsPrintModeFidelity.test.js
     ```
4. **Run Full Test Suite**:
   ```bash
   npm test
   ```
   All 32 test files must pass with 100% success.
5. **Run Production Build**:
   ```bash
   npm run build
   ```
   Build must complete cleanly with exit code 0.

---

### Invalidation Conditions
This report's conclusions would be invalidated if:
- `#area-cv` is intentionally redesigned as a fluid/responsive web layout rather than an A4 document canvas.
- An iframe viewport polyfill is introduced that artificially injects a `min-width: 968px` media query context into 794px print iframes.
