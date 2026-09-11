## Task Assignment: Milestone M1 & M2 — Print Engine & CSS Architecture Hardening

### Identity
- Role: Core Engine & CSS Implementer
- Working directory: C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_worker_m1_engine_css

### Inputs & Authoritative References
- User Request: C:\Users\usuariodgc\Documents\Ressume\.agents\ORIGINAL_REQUEST.md (see ## 2026-09-11T16:11:48Z)
- Architectural Audit Report: C:\Users\usuariodgc\Documents\Ressume\docs\audit-report.md
- Guidelines: C:\Users\usuariodgc\Documents\Ressume\AGENTS.md
- Explorer Reports:
  - C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_explorer_survey_print\handoff.md
  - C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_explorer_survey_css\handoff.md

### MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

### File Ownership
You exclusively own and may modify:
1. `src/utils/staticHtmlPdfEngine.js`
2. `src/App.jsx`
3. `src/styles/print.css`
Do NOT modify test files or other source files in this milestone.

### Implementation Tasks
1. **`src/utils/staticHtmlPdfEngine.js`**:
   - **Dead code removal**: Delete unused function `renderItemHTML` (lines ~227–237) and unused imports (`normalizeItemContacts`, `getContactConfig`, `getBulletClasses`, `PrintBaseItem` at lines ~16–20).
   - **JSDOM-only annotation**: Annotate `enforceTwoColumnComponentPagination` (line ~564) and lines ~907–927 with `// JSDOM-ONLY FALLBACK: unreachable in browser where #area-cv snapshot is available`.
   - **CSS variable propagation**: In `executeCleanPrint`, implement transfer of all CSS custom properties (`--*`) set on `#area-cv` in the live editor to `doc.documentElement.style` on the print iframe root element:
     ```javascript
     if (typeof document !== 'undefined') {
       const editorAreaCv = document.getElementById('area-cv');
       if (editorAreaCv && editorAreaCv.style && doc.documentElement) {
         for (let i = 0; i < editorAreaCv.style.length; i++) {
           const prop = editorAreaCv.style[i];
           if (prop.startsWith('--')) {
             const val = editorAreaCv.style.getPropertyValue(prop);
             const priority = editorAreaCv.style.getPropertyPriority(prop);
             doc.documentElement.style.setProperty(prop, val, priority);
           }
         }
       }
     }
     ```
   - **Page break margin in JSDOM fallback**: Update line ~669 in `enforceTwoColumnComponentPagination` from `${pushDistance + 10}px` to `var(--page-padding, 24px) !important`.
   - **Redundant inline styles removal**: In `executeCleanPrint` (lines ~847–856), remove redundant static assignments on `leftCol` and `rightCol` (`height: 100%`, `align-self: stretch`, `box-sizing: border-box`), preserving `min-height` and `--print-target-height-mm`. (Retain inline styles in `enforceTwoColumnComponentPagination` with `// JSDOM-ONLY FALLBACK` for unit test compatibility).

2. **`src/App.jsx`**:
   - Above line ~108 (`const gapPx = 20;`), add a prominent architectural block comment:
     ```javascript
     // ARCHITECTURAL INVARIANT: gapPx = 20 represents the visual fold separator (.a4-page-fold-guide)
     // rendered between simulated A4 sheets in the live editor's continuous canvas.
     // This gap exists EXCLUSIVELY in the editor view and MUST NEVER be introduced into the print
     // path (print.css or staticHtmlPdfEngine.js), where physical paper is segmented by @page rules.
     ```

3. **`src/styles/print.css`**:
   - Remove bare `@page` at lines 7–10 (which duplicates lines 13–16), so that all rules are inside the single `@media print { ... }` block.
   - At lines ~53–54, change `box-decoration-break: clone !important;` to `box-decoration-break: slice !important;` (and `-webkit-box-decoration-break: slice !important;`) on `.resume__left, .resume__right` to prevent double-padding (48px) on page 2.
   - At line ~181, harden `color: var(--circle-color, var(--text-color)) !important;` to `color: var(--circle-color, var(--text-color, #334155)) !important;`.

### Verification Steps (Worker must run and document)
1. Run `npm run build` — must succeed with 0 errors and 0 warnings.
2. Run `npm test -- --run` — must pass with 0 failures, >=634 passing tests.
3. Verify `src/index.css` has 0 `@media print` blocks.
4. Verify `src/styles/print.css` has 0 bare selector blocks.

### Output
Write a comprehensive handoff report to:
`C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_worker_m1_engine_css\handoff.md`
including Observation, Logic Chain, Caveats, Conclusion, and exact Build/Test Verification outputs.

## 2026-09-11T16:24:04Z
You are the Core Engine & CSS Implementer for Milestone M1 & M2.
Your working directory: C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_worker_m1_engine_css
Authoritative user request: C:\Users\usuariodgc\Documents\Ressume\.agents\ORIGINAL_REQUEST.md (see header ## 2026-09-11T16:11:48Z)
Read your detailed task description in C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_worker_m1_engine_css\DISPATCH.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You exclusively own:
1. src/utils/staticHtmlPdfEngine.js
2. src/App.jsx
3. src/styles/print.css

Apply the refactorings detailed in DISPATCH.md:
- Remove dead code (renderItemHTML, unused imports) in staticHtmlPdfEngine.js.
- Add JSDOM-only annotations to fallbacks.
- Implement CSS variable propagation from editor #area-cv to iframe root doc.documentElement.style.
- Update line ~669 to var(--page-padding, 24px) !important.
- Remove redundant static inline styles on leftCol/rightCol in executeCleanPrint.
- Add architectural comment on gapPx = 20 in App.jsx.
- Remove bare @page rule in print.css, update box-decoration-break to slice, add fallback to circle-color at line ~181.

Run verification:
- npm run build (0 errors, 0 warnings)
- npm test -- --run (0 failures, >=634 passed)

Write your full handoff report to C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_worker_m1_engine_css\handoff.md and message back when complete.
