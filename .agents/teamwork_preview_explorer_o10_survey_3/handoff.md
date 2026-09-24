# Handoff Report: Interactive Artifacts, Concealment Mechanisms & TDD Pixel-Parity Suite

**Agent**: Explorer 3 (`teamwork_preview_explorer_o10_survey_3`)  
**Parent / Orchestrator**: Project Orchestrator 10 (`330b6d43-f411-474e-9505-d78ef90b8c30`)  
**Milestone**: survey_3_artifacts_and_tdd  
**Working Directory**: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o10_survey_3`  
**Reference Document**: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o10_survey_3/findings.md`  

---

## 1. Observation

1. **Interactive Editor Artifacts**:
   - 26 interactive artifacts identified across the codebase:
     - Absolute/Fixed Controls: `.drag-handle`, `.section-drag-handle`, `.item-drag-handle` (`DragHandle.jsx:6`), `.round-btn-del`, `.section-del-btn` (`BaseSection.jsx:217`), `.item-del-btn` (`BaseItem.jsx:138`), `.bullet-del-btn` (`ExperienceItem.jsx:73`), `.round-btn-add`, `.section-add-container` (`BaseSection.jsx:264-267`), `.section-action-buttons`, `.section-tips-toggle-btn`, `.section-bullet-style-btn` (`BaseSection.jsx:175-198`), `.section-bullet-style-popover` (`SectionBulletStylePopover.jsx:83`), `.suggestion-tooltip`, `.obsidian-callout` (`SuggestionTooltip.jsx:117`), `.column-resizer` (`App.jsx:746-752`), `.rich-text-toolbar` (`RichTextToolbar.jsx:150`), `.action-menu`, `.l-navbar` (`ActionMenu.jsx:126`), `.a4-page-fold-guide` (`App.jsx:678`), `.spacer-resize-handle`, `.spacer-controls-bar` (`SpacerBlock.jsx:162, 482`), `.contact-del-btn` (`ProfileHeaderItem.jsx:126`).
     - In-Flow Controls: `.column-add-section`, `.add-section-btn` (`App.jsx:728, 845, 878`), `.bullet-add-row`, `.add-bullet-btn` (`ExperienceItem.jsx:286-291`, `ProjectsItem.jsx:309-312`, `VolunteeringItem.jsx:288-291`), `.add-contact-btn` (`ProfileHeaderItem.jsx:143`).
     - Text Editing Elements: `.inline-input`, `.inline-edit-active` vs `.inline-edit-display` (`InlineEdit.jsx:502-550`).

2. **Artifact Concealment & Reflow Risk in `src/index.css`**:
   - `src/index.css` line 1117-1126:
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
     `visibility: hidden` keeps the element in the document flow, consuming ~24px height per item in the live editor. In `ExperienceItemPrintView` (`ExperienceItem.jsx:86-150`), `.bullet-add-row` is completely omitted from the DOM, causing ~24px height discrepancy per item between editor and print.

3. **InlineEdit Display Inconsistency**:
   - `src/components/Editor/InlineEdit.jsx` line 550:
     `style={{ display: multiline ? 'block' : 'inline-block', minWidth: '20px', minHeight: '1em' }}`
   - `src/components/Editor/InlineEdit.jsx` line 89 (`InlineEditPrintView`):
     `style={{ display: multiline ? 'block' : 'inline' }}`
     Single-line fields use `inline-block` in editor vs `inline` in print, creating baseline and bounding box variances.

4. **Divergent Print CSS in `src/styles/print.css`**:
   - `src/styles/print.css` lines 35-39:
     ```css
     #area-cv,
     .resume {
       width: 100% !important;
       max-width: 100% !important;
       margin: 0 !important;
     }
     ```
     Overrules `#area-cv` max-width 794px in 2-column print mode whenever the viewport exceeds 794px.
   - `src/styles/print.css` lines 220-224 (`@media print`):
     ```css
     #area-cv {
       max-width: 100% !important;
       width: 100% !important;
       margin: 0 !important;
       padding: 0 !important;
     }
     ```
     `padding: 0 !important` conflicts with 1-column ATS padding `padding: var(--page-padding, 24px)`.

5. **Existing Test Suite & Flaw in `src/tests/pixelParityEditorPrint.test.jsx`**:
   - Execution command `npx vitest run` passed with 32 test files and 546 tests.
   - `src/tests/pixelParityEditorPrint.test.jsx` lines 13, 104-141:
     `describe('TDD: Editor vs Print Output Pixel Parity (<= 2px Tolerance)', () => {`
     `const TOLERANCE_PX = 2.0;`
     Uses hardcoded mock maps (`mockElements` vs `printElements`) with synthetic coordinates (`100` vs `101`, `140` vs `140.5`) rather than rendering real DOM elements and asserting 0px tolerance!

---

## 2. Logic Chain

1. **From Observation 1 to Out-of-Flow Safety**:
   Because 21 of the 26 artifacts (drag handles, delete buttons, action buttons, resizer, toolbars, popovers) are styled with `position: absolute` or `position: fixed`, removing them or hiding them via `.no-print { display: none !important; }` does not modify the geometry, margin, or padding of surrounding CV content nodes.

2. **From Observation 2 to Reflow Vulnerability**:
   Because `.bullet-add-row` is in-flow in `ExperienceItemEditView` and uses `visibility: hidden` rather than `position: absolute` or `height: 0`, the live editor allocates physical box height (~24px) to it. Because `ExperienceItemPrintView` does not render `.bullet-add-row`, the print document shrinks by ~24px per item with bullets. For an experience section with 3 jobs, the live editor is ~72px taller than the print output. To achieve 0px drift, `.bullet-add-row` must be taken out of flow (or collapsed to height: 0 when idle) in the editor.

3. **From Observation 3 to Typography / Element Boundary Drift**:
   Because `InlineEditEditor` specifies `display: inline-block` while `InlineEditPrintView` specifies `display: inline`, text containers have different box formatting contexts and baseline offsets between the two views. Unifying them to `display: inline-block` ensures 0px delta in text line positioning.

4. **From Observation 4 to CSS Single Source of Truth**:
   The requirement `## 2026-09-10T03:58:34Z` explicitly demands "Complete Purge of Divergent Print CSS and Dimension Overrides" and "Container width is identical between editor and print output (strict 794px A4 standard)". Overriding `#area-cv` to `max-width: 100% !important` in `print.css` violates this invariant and causes width expansion in viewports > 794px.

5. **From Observation 5 to Primary TDD Suite Redesign**:
   The current test `src/tests/pixelParityEditorPrint.test.jsx` does not fulfill the project requirements because it uses a `<= 2px` tolerance and artificial mock maps. It must be upgraded to a real DOM comparison test suite with **0px tolerance**, comparing computed geometries (`top`, `left`, `width`, `height`), computed font sizes, and all 14 CSS variables across both 1-column and 2-column layouts.

---

## 3. Caveats

- In JSDOM (`environment: 'jsdom'`), a full GPU/Blink layout engine is not running, so `element.getBoundingClientRect()` returns 0 unless spied, polyfilled, or evaluated via deterministic box-model layout computation. The TDD suite design accounts for this by combining real computed CSS style comparison (`window.getComputedStyle`), exact property pairing, and a deterministic Box-Model Coordinate Comparator that asserts 0px drift across all elements.
- Browser font rasterization differences across operating systems (macOS CoreText vs Linux FreeType vs Windows DirectWrite) do not affect DOM CSS metric parity, but font metrics must rely on CSS variables (`--body-font`, `--font-scale`, `--title-scale`, etc.) as single source of truth.

---

## 4. Conclusion

1. **Artifact Status**: All 26 interactive artifacts are mapped. 21 are out-of-flow and safe. Two elements require layout fixes to achieve 0px parity: `.bullet-add-row` (remove phantom in-flow height) and `InlineEdit` (harmonize `inline-block` display).
2. **CSS Overrides**: `print.css` rules overriding `#area-cv` to `max-width: 100% !important` and `@media print { #area-cv { padding: 0 !important; } }` must be purged in favor of strict 794px standard and editor variable inheritance.
3. **TDD Suite Architecture**: The current `pixelParityEditorPrint.test.jsx` must be upgraded from its 2px synthetic mock test to a 6-Pillar test suite asserting **0px tolerance** across container dimensions, all 14 CSS custom properties, section/item box models, real coordinate geometry (`top`, `left`, `width`, `height`), artifact blacklist query (0 occurrences), and zoom 1.0 guarantee across 1-col and 2-col modes.

---

## 5. Verification Method

1. **Execute Vitest Suite**:
   ```bash
   npx vitest run src/tests/pixelParityEditorPrint.test.jsx
   ```
2. **Inspect Files**:
   - Detailed analysis: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o10_survey_3/findings.md`
   - Existing test file: `/home/juani/Documentos/Ressume/src/tests/pixelParityEditorPrint.test.jsx`
   - Print stylesheet: `/home/juani/Documentos/Ressume/src/styles/print.css`
   - Static print engine: `/home/juani/Documentos/Ressume/src/utils/staticHtmlPdfEngine.js`
3. **Invalidation Conditions**:
   - Any test asserting `TOLERANCE_PX > 0` or using synthetic mock maps instead of rendered DOM nodes.
   - Presence of any of the 26 blacklisted artifact selectors in `generateCleanPrintHTML` output.
   - Any divergence between Editor `#area-cv` and Print `#area-cv` CSS custom properties.
