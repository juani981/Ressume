# BRIEFING — 2026-09-19T19:15:00Z

## Mission
Investigate 2-column live editor pagination and column synchronization architecture in Ressume.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: /home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o15_1
- Original parent: e37e5ed1-e0df-4191-b24a-a69a40581929
- Milestone: live-editor-pagination-investigation

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do not modify source code or tests
- Write only to /home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o15_1/

## Current Parent
- Conversation ID: e37e5ed1-e0df-4191-b24a-a69a40581929
- Updated: 2026-09-19T19:15:00Z

## Investigation State
- **Explored paths**:
  - `src/hooks/usePaginationEngine.js`
  - `src/utils/paginationEngine.js`
  - `src/utils/pageGeometry.js`
  - `src/App.jsx`
  - `src/index.css`
  - `src/styles/print.css`
  - `src/utils/staticHtmlPdfEngine.js`
  - `src/hooks/useBlankPageCleaner.js`
  - `src/utils/pageDeletionEngine.js`
  - `src/tests/two-column-pdf-pagination-and-extension.test.jsx`
  - `src/tests/m5-pagination-forbidden-zones-adversarial.test.jsx`
  - `src/tests/page2MarginPaddingParity.test.jsx`
  - `cypress/e2e/02-print-geometry-and-pagination.cy.js`
  - `cypress/e2e/06-multipage-pagebreak.cy.js`
  - `HANDOVER_CONTEXT.md`
- **Key findings**:
  1. Live editor uses single continuous CSS Grid `#area-cv.bd-grid` with `margin-top: pushDistance` applied to broken elements across the 20px visual fold gap and padding. Columns are synchronized because they are in the same grid container.
  2. Live editor computes `pageBreaks` and `totalPages` based on `Math.max(colDefs heights, areaCv height)`. Overflows are pushed down iteratively in up to 6 passes.
  3. Visual split decorations use pseudo-elements `::before` (Part 1) and `::after` (Part 2) styled via CSS variables `--split-part1-height` and `--split-part2-top`. Page guides are rendered as absolutely positioned `.a4-page-fold-guide` (suppressed with `.no-print`).
  4. ATS 1-column mode uses a single vertical flex container (`resume__single-column`), immune to cross-column race conditions or parallel break conflicts.
  5. The root cause of column asynchrony, alternating blank pages (e.g. Page 2 left column only, Page 3 right column only), and cascading page counts (3-7 pages) in PDF print is the application of CSS `break-before: page !important` to elements inside PARALLEL grid columns (`.resume__left` and `.resume__right`). In CSS Paged Media, each `break-before: page` inside an independent grid track triggers a document-wide page break, causing sequential rather than synchronized column progression.
  6. Attempted workarounds in `staticHtmlPdfEngine.js` (such as `hasParallelColumnBreaks` stripping breaks to `break-before: auto` with `margin-top: 0`, and `snapshotBreaksCSS` deduplicating parallel folds to `break-before: auto`) either leave items unpaginated across the fold or conflict with `enforceTwoColumnComponentPagination` which re-applies `break-before: page !important` to both columns.
- **Unexplored areas**: None within the scope of this investigation.

## Key Decisions Made
- Formulated the exact mechanics and architectural blueprint for synchronized 2-column printing using print-specific coordinate push (`gapPx = 0` margin push) without CSS `break-before: page` on parallel grid tracks, ensuring 1:1 editor parity, zero alternating blank pages, and zero regression for ATS 1-column mode.

## Artifact Index
- DISPATCH.md — Task dispatch log
- BRIEFING.md — Situational awareness
- progress.md — Liveness tracker
- handoff.md — Comprehensive 5-component handoff report
