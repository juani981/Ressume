# Execution Plan — Absolute Visual Parity (Editor vs Print PDF)

## Objective
Garantizar una paridad visual 1:1 absoluta (0px de diferencia) entre la vista previa interactiva en vivo del editor de CV (`#area-cv`) y el documento PDF / impresión limpia generado por el motor de impresión limpia (`executeCleanPrint` / `generateCleanPrintHTML`), eliminando cualquier regla CSS divergente, sobreescritura de márgenes, padding o tipografía, y preservando la geometría exacta de todos los elementos.

## Phases

### Phase 0: Discovery & Survey
- Spawn 3 parallel Explorers:
  - Explorer 1: Inspect `staticHtmlPdfEngine.js`, print stylesheet generation, inline CSS rules, and iframe rendering mechanism.
  - Explorer 2: Inspect `#area-cv` live editor styling in `index.css`, `App.jsx`, `CVContext.jsx`, CSS variables, zoom handling, and 1-column vs 2-column styles.
  - Explorer 3: Inspect interactive editor artifacts (`.drag-handle`, `.round-btn-del`, `.round-btn-add`, `.column-resizer`, `.rich-text-toolbar`, `.action-menu-btn`, etc.), how they are currently removed or hidden, and existing test suite setup (`vitest`, DOM testing).
- Synthesize survey findings into Feature Inventory and Milestones in `PROJECT.md`.

### Phase 1: Implementation & TDD Test Suite Creation
- Implement primary TDD test suite `src/tests/pixelParityEditorPrint.test.jsx` that programmatically mounts `#area-cv` and compares with print snapshot output, asserting 0px drift across:
  * container width (strict 794px A4 standard)
  * bounding boxes (`top`, `left`, `width`, `height`) of all sections and items
  * computed typography (font size, line height, font family)
  * CSS variable propagation (`--page-padding`, `--section-gap`, `--item-gap`, `--line-height`, `--font-scale`)
  * both 1-column and 2-column layouts.
- Eliminate all divergent print CSS / overrides; unify styling single source of truth.
- Non-disruptive interactive artifact concealment (preserving exact bounding layout box, zero reflow).
- Verify all existing vitest tests (23+ files, 442+ tests) continue to pass.
- Verify production build succeeds (`npm run build`).

### Phase 2: Independent Gate Verification
- Reviewers: 2 independent Reviewers verifying code quality, CSS architecture, and acceptance criteria.
- Challengers: 2 independent Challengers executing empirical stress tests on layout variations, deep DOM geometries, and 0px tolerance.
- Forensic Auditor: 1 Auditor checking for authenticity, 0 hardcoded cheats, 0 facades, and strict compliance with AGENTS.md rules.

### Phase 3: Gate Evaluation & Victory Report
- Evaluate GATE_STATUS.md (strict AND condition; auditor CLEAN veto).
- Prepare final handoff and report to Sentinel.
