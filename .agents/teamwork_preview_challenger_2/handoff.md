# Handoff Report: Adversarial Layout & PDF Print Stability Audit

**Agent**: `teamwork_preview_challenger_2` (Empirical Challenger)  
**Date**: 2026-09-20T11:10:30-03:00  
**Scope**: Adversarial Slider Stress Testing, Print Iframe CSS Variable Verification, Physical PDF Binary Inspection via Poppler (`pdfinfo`, `pdftotext`, `pdftoppm`).  
**Verdict**: **REJECT** ❌

---

## 1. Observation

### O1. Adversarial Test Harness Execution
The adversarial test suite was authored in `cypress/e2e/10-adversarial-sliders-and-pdf-stability.cy.js` and executed against the live application using headless Chromium (`HeadlessChrome/152.0.0.0`) via the command:
```bash
npx cypress run --spec "cypress/e2e/10-adversarial-sliders-and-pdf-stability.cy.js" --browser /home/juani/.local/bin/chromium
```
The test suite executed 6 adversarial test cases and generated physical PDF binaries into `tests/adversarial-output/`:
- `01-min-extremes.pdf` (`fontScale: 0.50`, `lineHeight: 1.25`, `pagePadding: 0px`, `leftColumnWidth: 20%`)
- `02-max-extremes.pdf` (`fontScale: 1.25`, `lineHeight: 1.85`, `pagePadding: 60px`, `leftColumnWidth: 55%`)
- `03-cross-extremes-1.pdf` (`fontScale: 1.25`, `lineHeight: 1.25`, `pagePadding: 0px`, `leftColumnWidth: 55%`)
- `04-cross-extremes-2.pdf` (`fontScale: 0.50`, `lineHeight: 1.85`, `pagePadding: 60px`, `leftColumnWidth: 20%`)
- `05-ats-extremes.pdf` (`type: '1-column'`, `isAtsMode: true`, `fontScale: 1.25`, `lineHeight: 1.85`, `pagePadding: 60px`)
- `06-bullet-boundary.pdf` (High density CV with 4-bullet item crossing page fold)

### O2. Slider and Variable Retention in Print Iframe
Inspection of the print iframe DOM confirmed:
- In all 6 cases, the print iframe `#area-cv` and `:root` element correctly retained 100% of the active layout CSS variables (`--font-scale`, `--line-height`, `--page-padding`, `--left-col-percent`).
- Variables were never reverted to defaults (`1.0`, `1.45`, `24px`, `33.33%`).
- Canvas width remained strictly bounded to 794px with zero horizontal overflow.
- Column widths dynamically adapted: 20% left column yielded `158.8px` (tested within [145, 175]px); 55% left column yielded `436.7px` (tested within [420, 455]px).

### O3. Physical PDF Poppler Inspection Results (`pdfinfo` & `pdftotext`)
Running `node inspect_adversarial_pdfs.mjs` against the physical PDF binaries produced the following measurements:

```
┌─────────┬───────────────────────────┬───────┬────────────────────────────┬───────────────┬────────────────┐
│ (index) │ File                      │ Pages │ Page Size                  │ Phantom Pages │ Text Slicing   │
├─────────┼───────────────────────────┼───────┼────────────────────────────┼───────────────┼────────────────┤
│ 0       │ '01-min-extremes.pdf'     │ 2     │ '594.96 x 841.92 pts (A4)' │ 'FAIL'        │ 'CLEAN (PASS)' │
│ 1       │ '02-max-extremes.pdf'     │ 7     │ '594.96 x 841.92 pts (A4)' │ '0 (PASS)'    │ 'CLEAN (PASS)' │
│ 2       │ '03-cross-extremes-1.pdf' │ 3     │ '594.96 x 841.92 pts (A4)' │ '0 (PASS)'    │ 'FAIL'         │
│ 3       │ '04-cross-extremes-2.pdf' │ 5     │ '594.96 x 841.92 pts (A4)' │ 'FAIL'        │ 'CLEAN (PASS)' │
│ 4       │ '05-ats-extremes.pdf'     │ 5     │ '594.96 x 841.92 pts (A4)' │ 'FAIL'        │ 'CLEAN (PASS)' │
│ 5       │ '06-bullet-boundary.pdf'  │ 1     │ '594.96 x 841.92 pts (A4)' │ '0 (PASS)'    │ 'CLEAN (PASS)' │
└─────────┴───────────────────────────┴───────┴────────────────────────────┴───────────────┴────────────────┘
```

Per-page breakdown of failing PDFs:

1. **`01-min-extremes.pdf`**:
   ```
   Page 1: 3095 chars, 552 words, 109 lines [OK]
   Page 2: 0 chars, 0 words, 0 lines [PHANTOM BLANK PAGE!]
   ```
2. **`04-cross-extremes-2.pdf`**:
   ```
   Page 1: 2189 chars, 381 words, 88 lines [OK]
   Page 2: 319 chars, 73 words, 31 lines [OK]
   Page 3: 290 chars, 79 words, 58 lines [OK]
   Page 4: 343 chars, 77 words, 60 lines [OK]
   Page 5: 0 chars, 0 words, 0 lines [PHANTOM BLANK PAGE!]
   ```
3. **`05-ats-extremes.pdf`**:
   ```
   Page 1: 1253 chars, 170 words, 30 lines [OK]
   Page 2: 818 chars, 103 words, 27 lines [OK]
   Page 3: 821 chars, 110 words, 31 lines [OK]
   Page 4: 0 chars, 0 words, 0 lines [PHANTOM BLANK PAGE!]
   Page 5: 0 chars, 0 words, 0 lines [PHANTOM BLANK PAGE!]
   ```

### O4. Text Slicing and Boundary Incursion in `03-cross-extremes-1.pdf`
Running `pdftotext -bbox-layout` revealed a paragraph from `projects` section sliced across the page boundary:
In `highDensityCV.json` line 127:
```json
"description": "Motor de exportación de CVs con 100% de texto seleccionable y cero artefactos."
```
At the bottom of Page 1:
```xml
<word xMin="407.085772" yMin="817.726466" xMax="441.782694" yMax="837.424465">texto</word>
<word xMin="445.532551" yMin="817.726466" xMax="543.496357" yMax="837.424465">seleccionable</word>
<word xMin="547.246376" yMin="817.726466" xMax="555.167786" yMax="837.424465">y</word>
<word xMin="558.918205" yMin="817.726466" xMax="590.422958" yMax="837.424465">cero</word>
```
At the top of Page 2:
```xml
<flow>
  <block xMin="348.515610" yMin="-1.273500" xMax="565.248867" yMax="55.924498">
    <line xMin="348.515610" yMin="-1.273500" xMax="424.187314" yMax="18.424499">
      <word xMin="348.515610" yMin="-1.273500" xMax="424.187314" yMax="18.424499">artefactos.</word>
    </line>
```
Notice:
- `yMin="-1.273500"`: The word `artefactos.` starts **above the physical top edge of Page 2** (negative coordinate).
- The sentence was split across the page fold, leaving a single orphan word `artefactos.` on Page 2 with zero top margin padding.

### O5. Code Invariants Violated
In `src/utils/staticHtmlPdfEngine.js` line 1449:
```javascript
if (areaCv && areaCv.style) {
  areaCv.style.setProperty('min-height', `${targetHeightMm}mm`, 'important');
  areaCv.style.setProperty('--print-target-height-mm', `${targetHeightMm}mm`);
  areaCv.style.setProperty('--print-total-pages', String(totalPages));
}
```
In `src/styles/print.css` lines 133-149:
```css
  /* 3. REGLAS DE ESPECIFICIDAD: Bloques atómicos evitan división interna */
  .cv-block,
  .bullet-item-row,
  li,
  .experience__content,
  .education__content,
  .skills__name,
  .profile__description,
  .home__data,
  .simple-list-item,
  li.cv-block,
  .contact__item,
  .spacer-section {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
    -webkit-column-break-inside: avoid !important;
  }
```
`.projects__content`, `.projects__data`, `.awards__content`, `.certificates__content`, `.publications__content`, `.volunteering__content`, and `.references__content` are missing from this selector.

---

## 2. Logic Chain

1. **Premise 1**: Acceptance criterion 2 in `ORIGINAL_REQUEST.md` states:
   *"Total printed page count reflects actual content density without phantom intermediate or trailing blank pages."*
2. **Premise 2**: Requirement R3 in `ORIGINAL_REQUEST.md` states:
   *"Toda página subsiguiente generada tras un salto de página debe respetar estrictamente el margen superior (`--page-padding`), impidiendo que el primer elemento de la nueva página quede pegado al borde físico del papel... Ningún carácter o línea de texto queda cortado verticalmente por la mitad entre dos páginas."*
3. **Step 1 (Blank Page Generation)**:
   In `staticHtmlPdfEngine.js:1449`, `areaCv` is forced to have `min-height: ${targetHeightMm}mm !important`, where `targetHeightMm = totalPages * 297mm`.
   In `01-min-extremes.pdf`, the content shrunk to 1 page due to `fontScale: 0.50`, but `snapshot.totalPages` was 2. Forcing `min-height: 594mm !important` forced Chromium to print 2 physical pages, leaving Page 2 100% empty (0 characters, 0 words).
   Similarly, in `04-cross-extremes-2.pdf`, `min-height: 1485mm` was injected for 5 pages, but content ended on Page 4, creating a 5th blank page.
   In `05-ats-extremes.pdf`, editor margin compounding inflated `totalPages` to 5, but printable content only occupied 3 pages, creating 2 trailing blank pages (Pages 4 and 5: 0 characters, 0 words).
4. **Step 2 (Text Slicing and Negative Coordinate Incursion)**:
   In `03-cross-extremes-1.pdf`, `print.css` omits `.projects__content` from `break-inside: avoid !important`. When `fontScale: 1.25` is applied, the browser treats the project description as breakable. The sentence `"Motor de exportación de CVs con 100% de texto seleccionable y cero artefactos."` was bisected: the first part ended at `y=837.42pt` on Page 1, and the orphan word `"artefactos."` appeared at `yMin = -1.273500pt` on Page 2 (cutting into the top page edge).
5. **Conclusion**:
   Because 3 out of 6 adversarial test cases produce physical PDFs with phantom blank pages, and 1 case produces cross-boundary text bisection with negative coordinates, the system fails acceptance criteria R1, R2, and R3.

---

## 3. Caveats

- **No Caveats**: All tests were executed in real headless Chromium and physical PDF binaries were inspected directly using poppler command-line binaries (`pdfinfo`, `pdftotext`, `pdftoppm`). The defects are 100% deterministic and reproducible.

---

## 4. Conclusion & Required Remediations

### Final Verdict: **REJECT** ❌

The print pagination and layout synchronization engine cannot be approved in its current state due to phantom blank pages and cross-boundary text bisection under extreme slider configurations.

### Required Actions for Remediation:
1. **Eliminate Forced `min-height: ${targetHeightMm}mm !important` on Print Root**:
   In `src/utils/staticHtmlPdfEngine.js` line 1449, remove the artificial forced `min-height: ${targetHeightMm}mm !important` on `#area-cv`. Let CSS Paged Media determine the natural page termination based on actual content height. If multi-page background filling is required, use CSS page context styling rather than hardcoding height in millimeters.
2. **Expand `break-inside: avoid !important` in `src/styles/print.css`**:
   Add `.projects__content`, `.projects__data`, `.awards__content`, `.certificates__content`, `.publications__content`, `.volunteering__content`, and `.references__content` to selector in line 133 of `src/styles/print.css` to prevent project descriptions and other non-experience items from being bisected across page seams.
3. **Prevent Editor Multi-Pass `marginTop` Compounding in ATS Mode**:
   In `src/utils/paginationEngine.js`, clamp `estimatedPages` and ensure `marginTop` injections across successive pagination passes do not artificially inflate `data-total-pages` beyond actual content requirements.

---

## 5. Verification Method

To independently verify and reproduce these findings:

1. **Run the Adversarial Cypress Test Suite**:
   ```bash
   npx cypress run --spec "cypress/e2e/10-adversarial-sliders-and-pdf-stability.cy.js" --browser /home/juani/.local/bin/chromium
   ```
2. **Execute the Poppler Inspection Audit**:
   ```bash
   node inspect_adversarial_pdfs.mjs
   ```
3. **Inspect the Physical PDF Binaries Directly**:
   - `pdfinfo tests/adversarial-output/05-ats-extremes.pdf` (Shows 5 pages)
   - `pdftotext -f 4 -l 5 tests/adversarial-output/05-ats-extremes.pdf -` (Outputs empty text: 0 chars)
   - `pdfinfo tests/adversarial-output/01-min-extremes.pdf` (Shows 2 pages)
   - `pdftotext -f 2 -l 2 tests/adversarial-output/01-min-extremes.pdf -` (Outputs empty text: 0 chars)
   - `pdftotext -bbox-layout -f 2 -l 2 tests/adversarial-output/03-cross-extremes-1.pdf - | grep "artefactos"` (Shows `yMin="-1.273500"`)
