# Handoff Report — Explorer 1 (Print Engine & CSS Divergence Survey)

**Agent ID**: teamwork_preview_explorer_o10_survey_1  
**Working Directory**: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o10_survey_1`  
**Parent Agent**: Project Orchestrator 10 (`330b6d43-f411-474e-9505-d78ef90b8c30`)  
**Mission**: Investigate `src/utils/staticHtmlPdfEngine.js`, `generateCleanPrintHTML`, `executeCleanPrint`, and all print CSS styling in Ressume to identify all sources of divergence between `#area-cv` and print output, providing concrete recommendations for 100% 0px visual parity.

---

## 1. Observation

Direct observations from codebase inspection, DOM analysis, and test executions:

1. **Destructive CSS Regex in `src/utils/staticHtmlPdfEngine.js` (lines 448–464)**:
   ```javascript
   const editorArtifactsPattern = /(?:drag-handle|round-btn-del|round-btn-add|suggestion-tooltip|obsidian-callout|column-resizer|l-navbar|inline-input|editable-section-container|editable-item-container|section-del-btn|item-del-btn|section-add-container|action-menu|no-print|add-contact-btn|contact-del-btn|spacer-resize-handle|spacer-controls-bar)/gi;
   activeBaseStyles = activeBaseStyles
     .replace(/[^{}]*?(?:drag-handle|round-btn-del|round-btn-add|suggestion-tooltip|obsidian-callout|column-resizer|l-navbar|inline-input|editable-section-container|editable-item-container|section-del-btn|item-del-btn|section-add-container|action-menu|no-print|add-contact-btn|contact-del-btn|spacer-resize-handle|spacer-controls-bar)[^{]*?\{[^}]*?\}/gi, '')
     .replace(editorArtifactsPattern, 'editor-control-stripped');
   ```
   Direct execution test in node confirmed:
   - `src/index.css:169-174` (`.section, .cv-section, .editable-section-container { margin-bottom: var(--section-gap, 20px) !important; position: relative; }`) is completely wiped from `activeBaseStyles`.
   - `src/index.css:176-180` (`.cv-section:last-of-type, .editable-section-container:last-of-type, .section:last-of-type { margin-bottom: 0 !important; }`) is completely wiped.
   - `src/index.css:1479-1524` (Dynamic text contrast and child inheritance rules) is completely wiped.
   - `src/index.css:1703-1762` (`@media print` suppression rules) is completely wiped.

2. **Artificial Component Padding in Print Components**:
   - `src/components/CV/BaseSection.jsx:42`: `style={{ marginBottom: 'var(--section-gap, 20px)', color: 'var(--text-color)', padding: '0 0.25rem' }}`.
   - `src/components/CV/BaseItem.jsx:19, 39, 53, 71, 86, 100`: `padding: '0 0.25rem'` on all container types.
   - `src/components/CV/items/ExperienceItem.jsx:148`: `padding: '0 0.25rem'` on bullet items.
   - Contrast with editor: `EditableBaseSection.jsx:144` and `EditableBaseItem.jsx:124` specify NO padding (`padding: undefined`).

3. **Container Hierarchy & Class Mismatches**:
   - In 2-Column Mode:
     - `src/App.jsx:644`: `className="resume bd-grid ..."`
     - `src/utils/staticHtmlPdfEngine.js:387`: `class="resume ..."` (`bd-grid` omitted).
   - In 1-Column Mode:
     - `src/App.jsx:862-868`: `#area-cv.resume__single-column` contains an inner nested `<div className="resume__single-column" style={{ width: "100%", maxWidth: "794px", margin: "0 auto" }}>`.
     - `src/styles/print.css:58-67` and `src/index.css:1818-1823`: `.resume__single-column { padding: var(--page-padding, 24px) !important; }`. In the editor, both outer `#area-cv` and inner `div` match this class, applying `24px` padding twice (`48px` total), while `generateCleanPrintHTML` has no inner div (applying `24px` once).
   - Width Overrides:
     - `src/styles/print.css:37 & 221`: `#area-cv, .resume { width: 100% !important; max-width: 100% !important; margin: 0 !important; }`.
     - `src/index.css:1798`: `#area-cv { width: 100% !important; max-width: 100% !important; margin: 0 !important; }`.

4. **Desktop Media Query Leakage in `src/index.css` (lines 583–655)**:
   - `@media screen and (min-width: 968px)` wraps core document styling:
     - `.home__container { gap: 1.5rem; }` (base is `gap: 3rem;`).
     - `.social__container { grid-template-columns: repeat(3, max-content); }` (base is `grid-template-columns: max-content; gap: 1rem;`).
     - `.languages__content { grid-template-columns: repeat(2, max-content); column-gap: 3.5rem; }` (base is `grid-template-columns: repeat(2, 1fr); gap: 0;`).
     - `.interests__container { grid-template-columns: repeat(4, max-content); column-gap: 3.5rem; }` (base is `grid-template-columns: repeat(3, 1fr);`).
     - `.resume__left, .resume__right { padding: var(--page-padding, 2rem) var(--page-padding, 1.5rem); }`.
   - Because print media does not match `@media screen` and the print iframe width is 794px (< 968px), these rules do not apply in print, causing severe layout regressions.

5. **Print Execution Lifecycle Flaws in `src/utils/staticHtmlPdfEngine.js`**:
   - Line 823: `targetEl.style.setProperty('margin-top', `${pushDistance + 10}px`, 'important');`
     `executeCleanPrint` applies CSS `break-before: page !important` AND simultaneously adds `margin-top: ${pushDistance + 10}px !important`, pushing page 2 content down from the top margin by hundreds of pixels.
   - Lines 878–881: `const scale = calculatePrintScale(rawHeight, Math.max(2, totalPages)); if (scale < 1.0 && doc.body?.style) { doc.body.style.zoom = scale; }`
     Fallback branch downscales zoom below 1.0 (down to 0.75), violating R2.

6. **In-Flow Interactive Artifact Concealment in `src/index.css` (lines 1730–1754)**:
   - Sets `visibility: hidden !important; opacity: 0 !important;` on `.column-add-section`, `.bullet-add-row`, `.contact-del-btn`, `.add-contact-btn`.
   - Because these elements are in-flow, `visibility: hidden` preserves their bounding box geometry, adding blank gaps (e.g. `margin-top: 1.5rem` on column add buttons, `19px` extra pill width on contacts) in native print.

7. **Component Template Mismatches**:
   - Bullets (`ExperienceItem.jsx:86-164` vs `255-298`): Editor uses `display: flex`, custom circle span, `padding-left: 1.25rem`, `padding-right: 1.5rem`. Print uses `display: list-item`, native `::marker`, `padding-left: 1.15rem`, `padding: 0 0.25rem`.
   - `InlineEdit.jsx:89` vs `550`: Editor uses `display: inline-block; min-width: 20px; min-height: 1em;`. Print uses `display: inline;` without min dimensions.
   - `HyperlinkEdit.jsx:15-32` vs `383-402`: Editor uses `gap: 5px; color: #3874ff; padding: 2px 4px; text-decoration: underline;`. Print uses `<a>` with `gap: 4px; color: inherit; padding: 0; text-decoration: none;`.
   - `SpacerBlock.jsx:445` vs `PrintSpacerBlock:38`: Editor has `marginBottom: 'var(--section-gap, 20px)'`. Print has `margin: 0` and `print.css:91` forces `margin: 0 !important`.

8. **Theme Defaults Mismatch**:
   - `App.jsx:655`: `cvData.layout?.leftBg || "#f3f4f6"`
   - `staticHtmlPdfEngine.js:373`: `layout.leftBg || '#fafafa'`
   - `index.css:13`: `--container-color-alt: #F8FAFC;`

---

## 2. Logic Chain

1. *From Observation 1*: The regex in `staticHtmlPdfEngine.js` strips rules based on the presence of artifact classes in the selector list. Because valid layout classes (`.section`, `.cv-section`, `.cv-block`, text inheritance) share rule blocks with artifact classes (`.editable-section-container`, `.editable-item-container`), the regex inadvertently deletes core layout rules.
2. *From Observation 2 & Inference from 1*: To work around the missing margin-bottom caused by the deleted CSS rule, developers injected inline `marginBottom` and `padding: 0 0.25rem` into `PrintBaseSection` and `PrintBaseItem`. Because the editor components do not have this 0.25rem padding, every printed component has an extra 8px of horizontal padding, which narrows content and causes premature text wrapping.
3. *From Observation 3*: Omitting `bd-grid` in `staticHtmlPdfEngine.js` causes 2-column grid properties defined in CSS (`gap: 0 !important; align-items: stretch; min-width: 0 !important;`) to be skipped in print. In 1-column mode, nesting `.resume__single-column` inside `#area-cv.resume__single-column` causes double padding under print stylesheets. Furthermore, `width: 100% !important` in print stylesheets overrides the fixed 794px A4 contract.
4. *From Observation 4*: Document styling rules placed inside `@media screen and (min-width: 968px)` are never evaluated during printing or within the 794px iframe. This causes `.home__container` to have 3rem gap instead of 1.5rem, `.social__container` to collapse into 1 column instead of 3, and `.languages__content` to lose its column gap.
5. *From Observation 5*: `executeCleanPrint` erroneously injects `margin-top: ${pushDistance + 10}px !important` onto elements with forced page breaks. While this offset was required in the editor to visually push content past the on-screen fold guide, on physical paper it shifts page 2 content down from the top margin by hundreds of pixels.
6. *From Observation 6*: Concealing in-flow interactive elements (`.column-add-section`, `.bullet-add-row`, `.contact-del-btn`) via `visibility: hidden` rather than `display: none` preserves their layout footprint, creating blank gaps in native print.
7. *From Observations 7 & 8*: Differences in markup templates (bullets, InlineEdit, Hyperlink, Spacers) and background color fallbacks (`#f3f4f6` vs `#fafafa`) directly violate 1:1 pixel parity.
8. *Synthesis*: Eliminating the regex, removing artificial `0.25rem` padding, unifying container classes and 794px width, extracting document styles from the desktop media query, removing page-break `margin-top`, switching in-flow artifact suppression to `display: none`, and harmonizing component templates will achieve 100% 0px visual parity.

---

## 3. Caveats

- **Headless Environment Bounds**: In headless Linux/CI without physical display hardware, `window.print()` cannot produce a physical printout. Programmatic parity verification is conducted by evaluating computed geometry, bounding boxes, and styles in DOM snapshots.
- **Font Rendering Engine**: Sub-pixel anti-aliasing can vary slightly between OS font rasterizers (e.g. DirectWrite vs FreeType). Parity testing evaluates integer pixel layout metrics (`top`, `left`, `width`, `height`, computed font sizes) under identical browser font rendering.
- No other caveats.

---

## 4. Conclusion

The divergence between `#area-cv` and print output is fully mapped and reproducible across 8 distinct architectural vectors.
The comprehensive remediation plan is documented in:
`/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o10_survey_1/findings.md`

Key recommendations:
1. **`staticHtmlPdfEngine.js`**: Remove CSS regex stripping, add `bd-grid` to 2-column print class, synchronize default left background to `#f3f4f6`, eliminate `margin-top` on forced page breaks, and enforce strictly 1.0 zoom.
2. **`print.css` & `index.css`**: Enforce strict `794px` width/max-width/min-width, scope single-column padding to `#area-cv.resume__single-column`, extract document layout rules from `@media screen and (min-width: 968px)` into base CSS, and suppress in-flow editor artifacts via `display: none !important`.
3. **Components**: Remove artificial `padding: '0 0.25rem'` from `PrintBaseSection`, `PrintBaseItem`, and `ExperienceItemPrintView`. Unify bullet list, InlineEdit, Hyperlink, and Spacer structures between edit and print views.

---

## 5. Verification Method

1. **Pixel-Parity Test Verification**:
   ```bash
   npx vitest run src/tests/pixelParityEditorPrint.test.jsx
   ```
2. **Full Repository Regression Suite**:
   ```bash
   npx vitest run
   ```
   (Must pass 100% across all 32 test files and 546 tests).
3. **Production Build Verification**:
   ```bash
   npm run build
   ```
   (Must complete with exit code 0 and 0 errors).
4. **Files to Inspect**:
   - `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o10_survey_1/findings.md`
   - `/home/juani/Documentos/Ressume/src/utils/staticHtmlPdfEngine.js`
   - `/home/juani/Documentos/Ressume/src/index.css`
   - `/home/juani/Documentos/Ressume/src/styles/print.css`
   - `/home/juani/Documentos/Ressume/src/components/CV/BaseSection.jsx`
   - `/home/juani/Documentos/Ressume/src/components/CV/BaseItem.jsx`
