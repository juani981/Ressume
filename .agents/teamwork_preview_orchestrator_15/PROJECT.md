# Project: Two-Column Synchronized Pagination, Phantom Blank Page Elimination & E2E Print Verification

## Architecture
Ressume is an interactive Vite + React CV editor rendering a live document inside `#area-cv`.
- **Live Editor Coordinate System**: Continuous CSS Grid container (`.resume.bd-grid`) where vertical offsets are resolved via pixel-accurate `margin-top` pushes past forbidden fold zones (`getForbiddenZone`), ensuring both `.resume__left` and `.resume__right` stay synchronously aligned.
- **PDF Print Pipeline**: In `src/utils/staticHtmlPdfEngine.js` and `src/styles/print.css`, A4 print snapshots are generated inside an isolated iframe.
- **2-Column Print Engine Parity**: In 2-column mode (`.resume.bd-grid`), explicit CSS page breaks (`break-before: page !important`) on children within parallel CSS Grid tracks desynchronize the browser's paged media engine, causing alternating blank pages and inflating page counts (3–7 pages). To achieve 1:1 parity with the live editor, 2-column mode neutralizes explicit page breaks (`break-before: auto !important`) across CSS and DOM, letting the continuous grid slice organically at 1123px boundaries, while preserving scaled container heights (`effectiveTargetMm`) and avoiding zoom mismatch.
- **ATS 1-Column Mode Parity**: Single-column ATS mode (`.resume__single-column`) retains linear `break-before: page !important`, guaranteeing 0 regressions.
- **Cypress E2E Print Suite**: Full end-to-end verification under high-density CV data (`JUAN IGNACIO CARRIZO BackEnd.pdf`) validating strict 2-page boundaries, dual-column content presence on both pages, 0 phantom blank pages, and zero regressions.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Print CSS 2-Column Neutralization | Neutralize `break-before`, `page-break-before`, `break-after` for all 2-column grid children in `src/styles/print.css` | M1 | Survey 2 §5.1 |
| 2 | ATS 1-Column Break Preservation | Preserve explicit `break-before: page !important` for `.resume__single-column` in `print.css` | M1 | Survey 2 §5.1 |
| 3 | Snapshot Breaks CSS Neutralization | Update `snapshotBreaksCSS` in `staticHtmlPdfEngine.js` to emit `break-before: auto` for 2-column layout | M1 | Survey 2 §5.2 |
| 4 | DOM Break Neutralization in Clean Print | Set `break-before: auto` inline on broken elements in 2-column mode during iframe DOM population | M1 | Survey 2 §5.2 |
| 5 | Two-Column Pagination Guard & Zoom Height Scaling | Preserve `effectiveTargetMm` in `enforceTwoColumnComponentPagination` and guard against re-injecting `break-before: page` in 2-col browser print | M1 | Survey 1 & 2 |
| 6 | Cross-Platform Cypress Print Tasks | Update `cypress.config.js` to ensure PDF inspection and print tasks are cross-platform (Linux/Windows) | M2 | Survey 3 §1.1 |
| 7 | High-Density CV Fixture Creation | Create `cypress/fixtures/highDensityCV.json` based on Juan Ignacio Carrizo CV data | M2 | Survey 3 §1.3 |
| 8 | Cypress 2-Column E2E Print Suite | Implement `cypress/e2e/08-two-column-print-synchronization.cy.js` asserting exact 2-page count, dual column presence on P1/P2, and 0 blank pages | M2 | Survey 3 §1.4 |
| 9 | ATS 1-Column Mode E2E Parity Check | Validate ATS 1-column mode print and editing in Cypress E2E with 0 regressions | M2 | User Request R4 |
| 10 | Full Vitest & Cypress Zero-Regression Battery | Run all 58 Vitest test files (896+ tests) and full Cypress suite | M3 | Acceptance Criteria |
| 11 | Independent Review (2 Reviewers) | Architectural review and code quality validation | M3 | Orchestration Pattern |
| 12 | Empirical Adversarial Testing (2 Challengers) | Stress testing pagination boundary cases and multi-column flow | M3 | Orchestration Pattern |
| 13 | Forensic Integrity Audit (1 Auditor) | Verification of authentic implementation without dummy or hardcoded shortcuts | M3 | Orchestration Pattern |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | 2-Column Synchronized Print Engine & CSS Neutralization | Features 1, 2, 3, 4, 5: `src/styles/print.css` and `src/utils/staticHtmlPdfEngine.js` changes | none | DONE |
| M2 | Cypress E2E Print Verification Suite & Test Fixtures | Features 6, 7, 8, 9: `cypress.config.js`, `cypress/fixtures/highDensityCV.json`, `cypress/e2e/08-two-column-print-synchronization.cy.js` | M1 | IN_PROGRESS |
| M3 | Final Regression Battery, Reviewers, Challengers & Forensic Audit | Features 10, 11, 12, 13: Full Vitest + Cypress pass, 2 Reviewers, 2 Challengers, 1 Auditor | M1, M2 | PLANNED |

## Interface Contracts
### `src/utils/staticHtmlPdfEngine.js`
```javascript
export function captureEditorSnapshot(): EditorSnapshot;
export function generateCleanPrintHTML(cvData: Object, lang: string, snapshot: EditorSnapshot): string;
export function executeCleanPrint(cvData: Object, lang: string): Promise<void>;
export function calculatePrintScale(rawHeightPx: number, totalPages: number): number;
export function enforceTwoColumnComponentPagination(doc: Document, areaCv: HTMLElement, pageHeightPx: number): void;
```

### `cypress.config.js`
```javascript
tasks: {
  inspectPdf(filePath: string): { exists: boolean, pagesCount: number, error: string | null };
  inspectPdfFonts(filePath: string): { fonts: string[] };
  deleteFile(filePath: string): null;
}
```

## Code Layout
- `src/styles/print.css`: Print media styles, `@page` rules, break neutralization.
- `src/utils/staticHtmlPdfEngine.js`: Snapshot capture, memory DOM cloning, iframe print generation.
- `src/utils/paginationEngine.js`: Pure mathematical pagination algorithm.
- `src/hooks/usePaginationEngine.js`: React hook coordinating pagination in editor.
- `cypress/fixtures/`: E2E test fixtures (`highDensityCV.json`).
- `cypress/e2e/`: Cypress E2E test specs (`08-two-column-print-synchronization.cy.js`).
- `src/tests/`: Vitest test suites.
