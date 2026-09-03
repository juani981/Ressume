## 2026-09-03T01:59:00Z
You are teamwork_preview_explorer (Plan 1: Print Engine & Pagination Implementation Plan).
Your working directory is: /home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o6_plan_1
Workspace root: /home/juani/Documentos/Ressume

You MUST read the authoritative request at:
/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md
Specifically review the latest section (2026-09-03T01:50:08Z).
Also read PROJECT.md at /home/juani/Documentos/Ressume/PROJECT.md and your DISPATCH.md.

Task:
Formulate the exact, line-by-line implementation strategy for `src/utils/staticHtmlPdfEngine.js` and `src/index.css`:
1. `executeCleanPrint`:
   - Fix iframe dimensions from `width: 0px; height: 0px` to standard A4 desktop width: `width: 794px; min-width: 794px; height: 1123px; visibility: hidden; border: 0; position: fixed; top: -10000px; left: -10000px;`.
   - Ensure font and icon readiness: await `doc.fonts?.ready` (with timeout fallback) before invoking `iframe.contentWindow.print()`.
   - Verify auto-scaling logic (`calculatePrintScale` against 2246px) behaves accurately with the 794px viewport width.
2. `generateCleanPrintHTML`:
   - Enforce orphan header prevention: add `break-after: avoid !important; page-break-after: avoid !important;` to `.section-title`, `h1`, `h2`, `h3`.
   - Enforce zero-split pagination: ensure `.cv-section`, `.cv-block`, `.experience__content`, `.education__content`, `.skills__name` maintain `break-inside: avoid !important; page-break-inside: avoid !important;`.
   - Verify that 100% of the 18 interactive editor selectors are excluded from the rendered DOM.
3. `src/index.css`:
   - Verify `@media print` rules suppress all 18 interactive selectors as defense-in-depth.

Produce your fix strategy in `analysis.md` and complete `handoff.md` with exact code snippets for the Worker.
Do NOT modify code files directly.
When done, notify parent via send_message.
