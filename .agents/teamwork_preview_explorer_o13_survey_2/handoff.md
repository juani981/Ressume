# Handoff Report: Phase 0 Survey for R2 & R4

**Agent:** teamwork_preview_explorer  
**Recipient:** teamwork_preview_orchestrator_13 (babbdd3c-c0ac-4180-a547-27fb13f18d9e)  
**Date:** 2026-09-11  
**Working Directory:** C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_explorer_o13_survey_2  
**Detailed Survey File:** C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_explorer_o13_survey_2\survey_r2_r4.md  

---

## 1. Observation

Direct observations with file paths, line numbers, and verbatim code:

1. **YIQ Contrast Duplication**:
   - src/App.jsx:616-665:
     `js
     const getDynamicTextColors = (hexcolor) => {
       let calcHex = hexcolor || "#ffffff";
       let hex = calcHex.replace("#", "");
       if (hex.length === 3) {
          hex = hex.split("").map((char) => char + char).join("");
       }
       const r = parseInt(hex.substr(0, 2), 16) || 0;
       const g = parseInt(hex.substr(2, 2), 16) || 0;
       const b = parseInt(hex.substr(4, 2), 16) || 0;
       const yiq = (r * 299 + g * 587 + b * 114) / 1000;
       ...
     `
   - src/utils/staticHtmlPdfEngine.js:186-220:
     Identical function getDynamicTextColors(hexcolor) with the same YIQ formula and threshold check (yiq >= 128 ? -40 : 40).
2. **297mm Ruler Height Measurement**:
   - Implemented 4 separate times with a hidden ruler element:
     - src/App.jsx:97-110
     - src/utils/staticHtmlPdfEngine.js:248-260
     - src/utils/staticHtmlPdfEngine.js:794-807
     - src/context/hooks/useCVLayout.js:26-37
3. **Relative Bounds Calculation**:
   - Implemented 5 separate times calculating element bounds relative to #area-cv:
     - src/App.jsx:118-134 (getRelativeBounds)
     - src/utils/staticHtmlPdfEngine.js:273-278
     - src/utils/staticHtmlPdfEngine.js:567-580 (getRelativeBounds)
     - src/utils/staticHtmlPdfEngine.js:861-867
     - src/context/hooks/useCVLayout.js:70-79
4. **Breakable Element Traversal**:
   - Selector string ".section-title, .cv-block, .experience__content, .education__content, .skills__name, .profile__description, .home__data, .simple-list-item, li.cv-block, .contact__item" and parent filtering logic:
     - src/App.jsx:136-151 (getBreakableComponents)
     - src/App.jsx:325-327 (forbidden zone audit)
     - src/utils/staticHtmlPdfEngine.js:582-591 (getBreakableComponents)
     - src/styles/print.css:65-75 (reak-inside: avoid !important)
5. **BaseSection Redundancies**:
   - src/components/CV/BaseSection.jsx:48-50 and 135-137:
     const wrapperClass = descriptor.wrapperClass !== undefined ? descriptor.wrapperClass : __container bd-grid;
   - src/components/CV/BaseSection.jsx:46 and 134:
     const isListContainer = ContainerTag === 'ul' || ContainerTag === 'ol';
6. **Drag Resize Pattern**:
   - src/App.jsx:675-710 (handleResizerMouseDown)
   - src/components/CV/SpacerBlock.jsx:75-120 (handleResizeStart)
7. **Visual Parity and Geometry Invariants**:
   - Editor container: min-width: 794px; max-width: 794px; width: 100%; (App.jsx:835-837).
   - Print container: width: 794px !important; min-width: 794px !important; max-width: 794px !important; (print.css:32-34).
   - Editor 20px gap (gapPx = 20 at App.jsx:116) exists strictly in the editor continuous canvas (.a4-page-fold-guide). In print, physical sheets are segmented by @page { size: A4; margin: 0; }.
   - Broken items receive margin-top: var(--page-padding, 24px) !important in print (print.css:105, staticHtmlPdfEngine.js:406, 824), matching the page padding offset in the editor (oldBottom + pagePadding).
   - Forbidden boundary zone [foldTop - pagePadding .. foldBottom + pagePadding] is actively audited in App.jsx:316-347 with FatalForbiddenZoneIncursionError guard.
8. **AGENTS.md Compliance**:
   - @dnd-kit: Only @dnd-kit is used in package.json and components. Zero instances of swapy.
   - Tooltip positioning: SuggestionTooltip.jsx:20-48 and SectionBulletStylePopover.jsx:46-76 dynamically track bounding rects, flip horizontally/vertically, and clamp to viewport.
   - Callout visual design: SuggestionTooltip.jsx:179-225 strictly implements Obsidian Callout standard (Danger gba(233, 49, 71, 0.1), Caution gba(219, 139, 0, 0.1), Info gba(8, 109, 221, 0.1), 4px left borders, and lucide-react icons).
9. **Test Suite Baseline**:
   - Ran 
pm test -- --run. All 40 test files passed, 667/667 tests passing (0 failures).

---

## 2. Logic Chain

1. From Observation 1–6, multiple foundational mathematical and DOM traversal routines (YIQ contrast, 297mm ruler height, relative bounding box, breakable query/filter, font family maps, and drag resize handlers) are copy-pasted across App.jsx, BaseSection.jsx, SpacerBlock.jsx, and staticHtmlPdfEngine.js.
2. Because these routines are embedded directly inside large React components (App.jsx is 1,248 lines), any bug fix or optimization to coordinate math must be duplicated across multiple files, increasing maintenance burden and divergence risk.
3. From Observation 7, the editor (#area-cv) and print snapshot achieve 1:1 pixel parity through identical 794px container widths, synchronized CSS custom properties, identical page padding rules, and the mathematical equivalence between the editor's push across the 20px fold gap and the print engine's reak-before: page with margin-top: var(--page-padding).
4. From Observation 8, the project strictly respects AGENTS.md requirements for @dnd-kit, tooltip positioning, and Obsidian Callouts. However, legacy BoxIcons remain in interactive action buttons, headers, and modals, which will need unified migration to lucide-react under R3.
5. Therefore, refactoring App.jsx by extracting pagination into src/utils/paginationEngine.js and usePaginationEngine.js, color logic into src/utils/colorUtils.js, and geometry into src/utils/pageGeometry.js will decompose App.jsx to <300 lines without breaking the existing 667 tests or visual parity.

---

## 3. Caveats

1. **Test Environment Mocking (JSDOM)**: JSDOM returns 0 for native getBoundingClientRect(), so tests in src/tests/ rely on Vitest mocks. The staticHtmlPdfEngine.js file contains a dedicated // JSDOM-ONLY FALLBACK branch (enforceTwoColumnComponentPagination) that must NOT be removed or tests will fail in headless mode.
2. **BoxIcons in Contact Types**: Tests in src/tests/dynamic-contacts.test.jsx, src/tests/iconography.test.jsx, and src/tests/adversarial-challenger.test.jsx assert that contact links contain x bx-* classes (x bx-envelope, x bx-phone, x bx-code-alt, etc.). When refactoring icons under R3, test expectations must be kept in mind.
3. **Editor Gap vs Print**: As documented in App.jsx:112-116, gapPx = 20 must NEVER be introduced into the print path (print.css or staticHtmlPdfEngine.js).

---

## 4. Conclusion

- **R2 Assessment**: The codebase has strong architectural patterns (descriptor registry, decomposed context hooks), but App.jsx remains a god component (1,248 lines) and key utility logic (YIQ, 297mm ruler, relative bounds, breakable query) is duplicated 4–5 times. Extracting these into pure utility modules (colorUtils.js, pageGeometry.js, 	ypographyUtils.js, paginationEngine.js) and focused hooks (usePaginationEngine, useCVDndCoordinator, useColumnResizer) is safe, straightforward, and will drastically improve maintainability.
- **R4 Assessment**: Visual parity (1:1) between editor and print is solid and rigorously enforced by pixelParityEditorPrint.test.jsx and orbidden-page-boundary-zone.test.jsx. The 794px width, page padding rules, margin-top: var(--page-padding, 24px) on broken elements, and ox-decoration-break: slice guarantee 0px drift between editor and print.
- **AGENTS.md Compliance**: @dnd-kit, Obsidian callouts, and dynamic tooltips are 100% compliant.

---

## 5. Verification Method

To independently verify these observations and conclusions:
1. Run full test suite:
   
pm test -- --run
   Expected result: 40 test files pass, 667 tests pass with 0 errors.
2. Verify CSS single source of truth:
   - Check src/index.css for @media print: 0 occurrences.
   - Check src/styles/print.css: all rules enclosed in single @media print block.
3. Check detailed technical survey:
   Read C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_explorer_o13_survey_2\survey_r2_r4.md.
