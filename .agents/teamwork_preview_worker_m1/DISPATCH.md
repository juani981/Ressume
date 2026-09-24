## 2026-09-20T03:40:05Z
You are a Worker subagent (teamwork_preview_worker_m1).
Your working directory is: /home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m1
The workspace root is: /home/juani/Documentos/Ressume
The authoritative original user request is at: /home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md
The project plan is at: /home/juani/Documentos/Ressume/PROJECT.md
Explorer survey reports:
- /home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o17_survey_1/handoff.md
- /home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o17_survey_2/handoff.md
- /home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o17_survey_3/handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope and Exclusive File Ownership for Milestone 1:
Files you own:
- `src/utils/staticHtmlPdfEngine.js`
- `src/styles/print.css`

Tasks for Milestone 1 (Eliminación de Doble Motor y Restauración de CSS Paged Media):
1. In `src/utils/staticHtmlPdfEngine.js`:
   - Purge screen-based `getBoundingClientRect()` heuristics in unpaginated screen iframes (AGENTS.md Rule 5 violation):
     - Delete lines 1615–1638 ("Cross-page margin synchronization" via screen getBoundingClientRect).
     - Delete lines 1590–1613 (JS anti-orphan check using screen coordinates); rely on declarative CSS `break-after: avoid` / `break-inside: avoid`.
     - Delete lines 1394–1402 (screen coordinate break screening).
     - Refactor or purge `enforceTwoColumnComponentPagination` so it does not inject conflicting inline `break-before: page !important` and `padding-top` based on screen getBoundingClientRect.
   - Purge print scaling and zoom overrides:
     - Delete lines 1453–1471, lines 1509–1525, and lines 1640–1661 (`calculatePrintScale`, `doc.body.style.zoom`, and runtime CSS variable overrides `--font-scale`, `--section-gap`, `--item-gap`, `--page-padding`).
     - Remove fractional `effectiveTargetMm` scaling. Ensure min-height is set to strict integer A4 multiples: `calc(${totalPages} * 297mm) !important` (297mm, 594mm, 891mm).
   - In `createSanitizedPrintClone`:
     - Eliminate asymmetric inline `break-before: page !important` injection on single column tracks in 2-column mode (which overrides print.css and fractures Gecko columns).
2. In `src/styles/print.css`:
   - Implement declarative multi-page margins:
     - Add `box-decoration-break: clone !important; -webkit-box-decoration-break: clone !important;` to `.resume__left, .resume__right, .resume__single-column` so that when columns fragment across pages, the browser natively applies top and bottom padding (`var(--page-padding)`) on every physical page fragment.
     - Ensure `.section-title, h1, h2, h3` have `break-after: avoid !important; page-break-after: avoid !important;` to prevent orphaned headings declaratively.
     - Ensure atomic items (`.cv-block`, `.bullet-item-row`, `li`) have `break-inside: avoid !important`.
     - Remove or refine the blanket `break-before: auto !important` on `.resume__left *` and `.resume__right *` in 2-column mode (lines 72–98) if it interferes with valid section-level or editor breaks.

3. Verification:
   - Run `npm test` to ensure Vitest suite passes without regressions.
   - Run `npm run build` to ensure the production build succeeds with 0 errors.
   - Run Cypress print test: `npx cypress run --browser chrome-for-testing --spec "cypress/e2e/01-print-lifecycle.cy.js,cypress/e2e/02-print-geometry-and-pagination.cy.js"` to verify basic print lifecycle and geometry pass.

Report your implementation, exact line changes, build and test results in `/home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m1/handoff.md`.
Send a message when complete.
