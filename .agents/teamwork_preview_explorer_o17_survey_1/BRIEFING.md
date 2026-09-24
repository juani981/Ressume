# BRIEFING — 2026-09-20T03:35:00Z

## Mission
Investigate Print & Export pipeline for live editor vs print geometric parity and adherence to CSS Paged Media.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: /home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o17_survey_1
- Original parent: 1a9839e6-32c0-4426-b6d9-cf6aa0d4937f
- Milestone: Print & Export geometric parity survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Adhere strictly to AGENTS.md rules (Prohibición de Doble Motor en Conflicto, Obsidian Callout standard, no synthetic JSDOM parity declarations)
- Write only to own directory (.agents/teamwork_preview_explorer_o17_survey_1/)

## Current Parent
- Conversation ID: 1a9839e6-32c0-4426-b6d9-cf6aa0d4937f
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `src/utils/staticHtmlPdfEngine.js`
  - `src/styles/print.css`
  - `index.html`
  - `src/index.css`
  - `src/App.jsx`
  - `src/utils/paginationEngine.js`
  - `src/utils/pageGeometry.js`
  - `src/utils/typographyUtils.js`
  - `src/hooks/usePaginationEngine.js`
  - `src/components/Editor/A4PageGuides.jsx`
  - `2columnCV_TU NOMBRE Y APELLIDO_Título Profesional _ Especialidad.pdf`
  - `CV_TU NOMBRE Y APELLIDO_Título Profesional _ Especialidad.pdf`
  - Cypress test suite (`cypress/e2e/02...`, `08...`)
- **Key findings**:
  - Identified multiple active violations of AGENTS.md Rule 5 (Double Engine in conflict) in `staticHtmlPdfEngine.js` lines 1394-1402, 1590-1613, 1615-1638, and 888-1125.
  - Discovered artificial scaling & slider degradation in `staticHtmlPdfEngine.js` lines 1453-1471, 1508-1524, 1648-1661 (`calculatePrintScale` mutating `--font-scale`, `--section-gap`, `--item-gap`, `--page-padding` and setting `body.style.zoom`).
  - Identified 2-column asynchrony caused by selective inline `break-before: page !important` injected into one column track while `print.css` sets `resume__left, resume__right { display: block !important; }`, resulting in alternating blank pages and ragged backgrounds (e.g. 564.3mm fractional minHeight).
  - Empirical PDF audit confirmed Zen Browser (Gecko) produced 5 pages for 2-column CV (with blank page 2) and 4 pages for ATS CV (with page 2 containing a single solitary item).
- **Unexplored areas**: None, all critical components examined.

## Key Decisions Made
- Fully documented root causes and concrete remediation plan adhering strictly to CSS Paged Media.

## Artifact Index
- DISPATCH.md — Dispatch log
- BRIEFING.md — Working state and memory
- progress.md — Liveness heartbeat
- handoff.md — Final investigation report
