# DISPATCH for Worker: 1:1 Vector/Text Clean Print Engine Implementation & Verification

You are teamwork_preview_worker.
Working directory: /home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_o6_1
Workspace root: /home/juani/Documentos/Ressume

You MUST read the authoritative request at:
/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md
Specifically review the latest section (2026-09-03T01:50:08Z).
Also read PROJECT.md at /home/juani/Documentos/Ressume/PROJECT.md.

Read the detailed handoff reports from the planning Explorers:
- Plan 1: /home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o6_plan_1/handoff.md
- Plan 2: /home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o6_plan_2/handoff.md
- Plan 3: /home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o6_plan_3/handoff.md

## File Write Ownership
You have exclusive write ownership of:
- `src/utils/staticHtmlPdfEngine.js`
- `src/index.css`
- `src/components/Editor/InlineEdit.jsx`
- `src/components/Editor/SuggestionTooltip.jsx`
- `src/tests/cleanPrintEngineVerification.test.jsx`
- `src/tests/challenger-stress-suite.test.jsx`
- `src/tests/dom-geometry-typography.test.jsx`

## Task Instructions:
1. Apply Plan 1 changes to `src/utils/staticHtmlPdfEngine.js`:
   - In `executeCleanPrint`:
     - Style iframe with desktop A4 width: `width: 794px; min-width: 794px; height: 1123px; visibility: hidden; border: 0; position: fixed; top: -10000px; left: -10000px;`.
     - Ensure font & icon synchronization: `await Promise.race([doc.fonts.ready, new Promise(res => setTimeout(res, 1000))])` before printing.
     - Call `iframe.contentWindow.focus()` and `iframe.contentWindow.print()`.
   - In `generateCleanPrintHTML`:
     - Add `break-after: avoid !important; page-break-after: avoid !important;` to `.section-title`, `h1`, `h2`, `h3`.
     - Ensure zero-split pagination for `.cv-section`, `.cv-block`, `.experience__content`, `.education__content`, `.skills__name`.
2. Apply Plan 1 changes to `src/index.css`:
   - Expand `@media print` selector blacklist to cover all 18 interactive selectors + `button` + neutral `.inline-input` + orphan avoidance on headings.
3. Apply Plan 2 changes:
   - In `src/components/Editor/InlineEdit.jsx`: safe `useCV()` destructuring with `'es'` fallback.
   - In `src/components/Editor/SuggestionTooltip.jsx`: safe `useCV()` destructuring and AGENTS.md positioning math (`rect.right + 20px`, flip `rect.left - 320px`, clamp `vh - 420`, min `20px`).
   - Restore pristine test files if needed: `git checkout src/tests/challenger-stress-suite.test.jsx src/tests/dom-geometry-typography.test.jsx`.
4. Apply Plan 3 changes:
   - Create `src/tests/cleanPrintEngineVerification.test.jsx` with the complete 25-test suite from Plan 3 handoff.
5. Run builds and test verification:
   - Run `npx vitest run src/tests/cleanPrintEngineVerification.test.jsx`
   - Run `npm test` (all test suites must pass 100%)
   - Run `npm run build` (production build must succeed with code 0)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Deliver your results in `progress.md` and a complete `handoff.md` in your working directory.
When done, notify parent via send_message with build/test command results.
