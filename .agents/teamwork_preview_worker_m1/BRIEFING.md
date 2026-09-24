# BRIEFING — 2026-09-20T00:40:05-03:00

## Mission
Execute Milestone 1: Eliminación de Doble Motor y Restauración de CSS Paged Media in src/utils/staticHtmlPdfEngine.js and src/styles/print.css.

## 🔒 My Identity
- Archetype: Worker
- Roles: implementer, qa, specialist
- Working directory: /home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m1
- Original parent: 1a9839e6-32c0-4426-b6d9-cf6aa0d4937f
- Milestone: Milestone 1 (Eliminación de Doble Motor y Restauración de CSS Paged Media)

## 🔒 Key Constraints
- Files owned exclusively: `src/utils/staticHtmlPdfEngine.js`, `src/styles/print.css`. Do not modify other source files.
- Strict adherence to AGENTS.md Rule 5 (Invariante de Paginación e Impresión PDF: Cero Parches Heurísticos de Pantalla) and Rule 6 (Verificación Real vs. Sesgo de JSDOM / Tests Sintéticos).
- Mandatory integrity: no hardcoded test results, no dummy implementations.
- Purge screen-based getBoundingClientRect() heuristics, print scaling, doc.body.style.zoom, and runtime CSS variable overrides.
- Multi-page margins via box-decoration-break: clone !important in print.css.
- Declarative break-after: avoid and break-inside: avoid.
- Ensure strict integer A4 multiples for min-height: calc(${totalPages} * 297mm) !important.

## Current Parent
- Conversation ID: 1a9839e6-32c0-4426-b6d9-cf6aa0d4937f
- Updated: not yet

## Task Summary
- **What to build**: Purge heuristic screen-coordinate double pagination engine and dynamic print scaling in `src/utils/staticHtmlPdfEngine.js`, restoring declarative CSS Paged Media in `src/styles/print.css`.
- **Success criteria**: Vitest suite passes (`npm test`), build passes (`npm run build`), Cypress print lifecycle and geometry tests pass (`npx cypress run --browser chrome-for-testing --spec "cypress/e2e/01-print-lifecycle.cy.js,cypress/e2e/02-print-geometry-and-pagination.cy.js"`).
- **Interface contracts**: PROJECT.md, AGENTS.md
- **Code layout**: src/utils/staticHtmlPdfEngine.js, src/styles/print.css

## Key Decisions Made
- Initializing workspace and reviewing survey reports.

## Artifact Index
- /home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m1/DISPATCH.md — Assignment instructions
- /home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m1/BRIEFING.md — Situational awareness
- /home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m1/progress.md — Liveness & heartbeat
- /home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m1/handoff.md — Final handoff report

## Change Tracker
- **Files modified**: None yet
- **Build status**: Untested
- **Pending issues**: None

## Quality Status
- **Build/test result**: Untested
- **Lint status**: Untested
- **Tests added/modified**: TBD

## Loaded Skills
- None
