## 2026-09-11T20:03:03Z
You are teamwork_preview_worker.
Your working directory is: C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_worker_o13_m3
The workspace root is: C:\Users\usuariodgc\Documents\Ressume
The original request log is at: C:\Users\usuariodgc\Documents\Ressume\.agents\ORIGINAL_REQUEST.md (read this file first).
Also review:
- C:\Users\usuariodgc\Documents\Ressume\PROJECT.md
- C:\Users\usuariodgc\Documents\Ressume\AGENTS.md
- C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_explorer_o13_survey_2\survey_r2_r4.md
- C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_explorer_o13_survey_2\handoff.md
- C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_worker_o13_m2\handoff.md

Your mission is Milestone M3: Paridad Visual 1:1, Paginación y Zonas Prohibidas (R4):
1. 1:1 Visual Parity & 794px Canvas Strictness:
   - Verify #area-cv maintains strict 794px width in both editor and clean print iframe without reflow or drift.
   - Verify dynamic CSS custom property transfer loop in staticHtmlPdfEngine.js transmits all custom properties from #area-cv to doc.documentElement.style.
   - Verify editor-only gapPx = 20 fold gap is strictly confined to editor A4 guides and 0px in print.
2. Forbidden Boundary Zone Enforcement (1-col ATS & 2-col traditional):
   - Verify that isInForbiddenBoundaryZone and auditForbiddenBoundaryZones from src/utils/pageGeometry.js and src/utils/paginationEngine.js are rigorously applied.
   - Ensure that breakable components that would straddle the forbidden margin zone [pageHeight - pagePadding .. pageHeight + pagePadding] receive forced break styling pushing them to the next page with proper margin-top.
   - Verify box-decoration-break: slice is enforced to eliminate double-padding on multi-page column containers.
3. Automated Parity & Boundary Test Suite:
   - Create or enhance test suite in src/tests/m3-parity-and-forbidden-zones.test.jsx verifying:
     - 0px drift between editor and print snapshot container width and CSS custom properties.
     - 0 elements residing in the forbidden boundary zone across both 1-column ATS mode and 2-column traditional mode.
     - Margin stability across page 1 and page 2.
4. Verification:
   - Run `npm test -- --run` using run_command to confirm ALL tests pass cleanly with 0 failures.
   - Run `npm run build` using run_command to confirm Vite build completes with 0 errors and 0 warnings.
5. Write your report to C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_worker_o13_m3\handoff.md detailing all verifications, test results, and parity metrics.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

When finished, send a message back to parent orchestrator with your summary and handoff path.
