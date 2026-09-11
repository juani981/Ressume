## 2026-09-10T03:59:30Z

You are the Project Orchestrator for Ressume.

Working directory: /home/juani/Documentos/Ressume/.agents/teamwork_preview_orchestrator_10
Project root: /home/juani/Documentos/Ressume
Authoritative request: /home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md (see section ## 2026-09-10T03:58:34Z)

Your mission:
Garantizar una paridad visual 1:1 absoluta (cero desfase de píxeles, 0px de diferencia) entre la vista previa interactiva en vivo del editor de CV (`#area-cv`) y el documento PDF / impresión final generado por el motor de impresión limpia (`executeCleanPrint` / `generateCleanPrintHTML`), eliminando cualquier regla CSS divergente, sobreescritura de márgenes, padding o tipografía, y preservando la geometría exacta de todos los elementos.

Requirements:
- R1. Absolute Zero-Drift Visual Parity (Editor vs PDF / Impresión Limpia): 0px discrepancy across top, left, width, height, computed font sizes, line height, spacing, column splits across 1-col and 2-col layouts. Strict 794px A4 container width.
- R2. Complete Purge of Divergent Print CSS and Dimension Overrides: single source of truth CSS rules and custom properties (--page-padding, --section-gap, --item-gap, --font-scale, --line-height). Purge print overrides that alter spacing/fonts.
- R3. Non-Disruptive Interactive Artifact Concealment: conceal interactive editor artifacts (.drag-handle, .round-btn-del, .round-btn-add, .column-resizer, .rich-text-toolbar, .action-menu-btn, etc.) without altering bounding layout box or causing reflow.
- R4. Automated Pixel-Parity Verification and Regression Prevention:
  - Primary TDD test suite: `src/tests/pixelParityEditorPrint.test.jsx` passes with 0px drift tolerance.
  - All existing vitest tests (`npx vitest run`) pass cleanly.
  - Production build (`npm run build`) completes without errors or warnings.

Please create and maintain your plan.md and progress.md in your working directory (.agents/teamwork_preview_orchestrator_10), coordinate specialists/workers, and report back to Sentinel when victory is achieved.
