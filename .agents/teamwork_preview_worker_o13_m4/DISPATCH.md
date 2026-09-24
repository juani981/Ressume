## 2026-09-11T20:03:17Z
You are teamwork_preview_worker.
Your working directory is: C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_worker_o13_m4
The workspace root is: C:\Users\usuariodgc\Documents\Ressume
The original request log is at: C:\Users\usuariodgc\Documents\Ressume\.agents\ORIGINAL_REQUEST.md (read this file first).
Also review:
- C:\Users\usuariodgc\Documents\Ressume\PROJECT.md
- C:\Users\usuariodgc\Documents\Ressume\AGENTS.md
- C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_spec_miner_o13_survey_3\survey_r5_tests.md
- C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_spec_miner_o13_survey_3\handoff.md
- C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_worker_o13_m2\handoff.md

Your mission is Milestone M4: Documentación Exhaustiva y Guías de Desarrollo en /docs:
Your exclusive write ownership is the docs/ directory.
Create/update the following 4 comprehensive technical guides in docs/:
1. docs/arquitectura.md:
   - Architecture of the editor, unidirectional data flow (CVContext.jsx).
   - Component hierarchy: App.jsx orchestrator, custom hooks (usePaginationEngine, useCVDndCoordinator, useColumnResizer), presentation subcomponents (A4PageGuides, ColumnResizer, CVDragOverlay).
   - Pure utilities: colorUtils.js, pageGeometry.js, typographyUtils.js, paginationEngine.js.
   - Print engine lifecycle in staticHtmlPdfEngine.js.
2. docs/guia-extensibilidad-secciones.md:
   - Step-by-step developer guide for adding new custom sections or items via src/registry/sectionRegistry.js.
   - Detailed SectionDescriptor schema and contract.
   - Template + Strategy pattern in BaseSection.jsx and BaseItem.jsx (no switch statements).
   - Concrete working code example of creating and registering a new section.
3. docs/diseno-invariantes.md:
   - Style tokens, typography hierarchy, responsive canvas invariants.
   - Strict AGENTS.md invariants:
     - Drag & drop exclusively with @dnd-kit (never swapy).
     - Dynamic tooltips tracking getBoundingClientRect() with adjacent positioning, viewport boundary flipping, and vertical clamping.
     - Obsidian Callout standard: Danger/Critical (rgba(233,49,71,...), 4px border, 🛑/🚨), Caution/Warning (rgba(219,139,0,...), ⚠️), Info (rgba(8,109,221,...), ℹ️).
     - AI Suggestion engine with modular JSON knowledge bases and Tech domain focus.
4. docs/motor-impresion-pdf.md:
   - Static HTML rendering pipeline (executeCleanPrint, generateCleanPrintHTML in staticHtmlPdfEngine.js).
   - Strict 794px A4 canvas, zero-zoom, single source of truth CSS in print.css.
   - CSS custom property propagation from #area-cv to print root.
   - Forbidden boundary zone detection and pagination break insertion.
   - box-decoration-break: slice against multi-page container double padding.
5. Cross-link the guides and update docs/DEVELOPMENT_MANUAL.md to eliminate contradictory legacy instructions.
6. Verify your work:
   - Ensure all 4 markdown files are rich, detailed, cleanly formatted with code blocks.
   - Run `npm test -- --run` and `npm run build` using run_command to confirm build and tests remain 100% green.
7. Write your report to C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_worker_o13_m4\handoff.md.
