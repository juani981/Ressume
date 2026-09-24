# Project: Ressume - 1:1 Editor vs. Print PDF Parity, Slider Synchronization & Real-Browser Verification

## Architecture
Ressume is an interactive Vite + React CV editor rendering a live document inside `#area-cv`.
- **Canvas Model**: A4 standard canvas (210mm x 297mm / 794px at 96 DPI).
- **Layout Modes**: 2-Column Visual Recruiter (`.resume.bd-grid`) and 1-Column ATS Optimized (`.resume__single-column`).
- **Data Flow**: `CVContext.jsx` holds `cvData.layout` containing all design variables (typography scales, line-height, page-padding, section-gap, item-gap, column-width, background colors, font-family).
- **Print Pipeline**: `src/utils/staticHtmlPdfEngine.js` clones `#area-cv`, sanitizes interactive controls, injects `index.css` and `print.css`, and triggers browser-native print / PDF export via an iframe.
- **Architectural Invariants (AGENTS.md)**:
  - **Rule 5 (Prohibición de Doble Motor en Conflicto)**: Zero heuristic screen-based calculations (`getBoundingClientRect()`) before printing. Paged media must be purely declarative via CSS Paged Media (`@page`, `break-inside: avoid`, `box-decoration-break: clone`).
  - **Rule 6 (Verificación Real vs. Sesgo de JSDOM)**: JSDOM does not render fonts or execute A4 media boxes. Parity must be verified in a real browser via Cypress (`npx cypress run`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Purge Screen Heuristic Injections | Delete `getBoundingClientRect()` padding and break injections in `staticHtmlPdfEngine.js` (lines 1615–1638, 1590–1613, 1394–1402, and `enforceTwoColumnComponentPagination`) | M1 | Survey 1 §O2 |
| 2 | Purge Print Scaling & Zoom Overrides | Remove `calculatePrintScale`, `doc.body.style.zoom`, and runtime CSS variable overrides in `staticHtmlPdfEngine.js` (lines 1453–1471, 1509–1525, 1640–1661) | M1 | Survey 1 §O1, Survey 2 §1.4.A |
| 3 | Remove Asymmetric Column Inlining | Prevent `createSanitizedPrintClone` from inlining `break-before: page !important` on single column children in 2-col mode | M1 | Survey 1 §O3 |
| 4 | Enforce Declarative Multi-Page Margins | Implement CSS Paged Media declarative margins (`box-decoration-break: clone !important;` with `--page-padding`) in `print.css` | M1 | Survey 1 §4.3, Survey 3 §1.3 |
| 5 | Harmonize Item Components Typography | Update 8 item components to use `var(--body-smaller-font-size)` and `var(--body-small-font-size)` so `bodyScale` slider takes effect | M2 | Survey 2 §1.4.E |
| 6 | Standardize `itemGap` & Spacing Fallbacks | Unify `itemGap` fallbacks across `index.css`, `print.css`, and item components to `var(--item-gap, 8px)` | M2 | Survey 2 §1.4.D |
| 7 | Connect Section Title Spacing to Sliders | Replace hardcoded `margin-bottom: 1.5rem !important` on `.section-title` with dynamic `--item-gap` / slider-responsive token | M2 | Survey 2 §1.4.F |
| 8 | Strict Slider & Layout Variable Sync | Verify 100% of `cvData.layout` tokens are transferred unscaled and unmutated to the print document | M2 | Survey 2 §1.1 |
| 9 | Organic Bullet Flow & Non-Fracturing | Ensure bullet items break cleanly between `<li>` elements without word-slicing and without triggering double page breaks | M3 | Survey 3 §1.1, §1.2 |
| 10 | Bounded Page Flow (Zero Solitary Bullets) | Prevent solitary items on Page 2 and trailing blank pages; maintain 2-page ceiling for sample high-density CVs in 1-col and 2-col | M3 | Survey 1 §O4, Survey 3 §1.4 |
| 11 | Fix Cypress Spec 05 Media Emulation | Update `cypress/e2e/05-pixel-fidelity-and-css-parity.cy.js` to emulate print media during DOM measurement | M4 | Survey 3 §1.5 |
| 12 | Author Real-Browser Parity Spec | Create/update Cypress spec verifying 1:1 bullet distribution, Page 2 top padding, slider changes, and PDF page count | M4 | Survey 3 §4.4 |
| 13 | Full Cypress & Vitest Suite Execution | Run `npx cypress run --browser chrome-for-testing` and `npm test` verifying 100% green | M4 | Survey 3 §5.1, §5.2 |
| 14 | Multi-Agent Review & Adversarial Testing | 2 Reviewers, 2 Challengers testing empirical print outputs in Chromium/Gecko | M5 | Acceptance Criteria |
| 15 | Forensic Integrity Audit | Anti-cheating and code integrity audit by `teamwork_preview_auditor` | M5 | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Eliminación de Doble Motor y Restauración de CSS Paged Media | Features 1, 2, 3, 4: Purge JS screen heuristics, remove print zoom & auto-scale, remove asymmetric column break inlining, configure declarative box-decoration-break | none | DONE |
| M2 | Sincronización Estricta de Sliders y Variables de Diseño | Features 5, 6, 7, 8: Harmonize item component typography tokens, standardize itemGap, connect section title spacing, strict slider sync | M1 | DONE |
| M3 | Flujo Orgánico de Viñetas y Estabilidad de Paginación | Features 9, 10: Organic bullet flow, eliminate solitary items and phantom pages in 1-col ATS and 2-col modes | M1, M2 | DONE |
| M4 | Verificación E2E en Navegador Real con Cypress | Features 11, 12, 13: Fix media emulation in tests, author parity & slider spec, pass 100% Cypress and Vitest | M1, M2, M3 | DONE |
| M5 | Verificación Integral, Stress Testing y Forensic Audit | Features 14, 15: 2 Reviewers, 2 Challengers, 1 Forensic Auditor | M1, M2, M3, M4 | IN_PROGRESS |

## Interface Contracts
### `src/utils/staticHtmlPdfEngine.js`
```javascript
export function generateLayoutVariablesCSS(layout: LayoutConfig): string;
export function createSanitizedPrintClone(liveAreaCv: HTMLElement): HTMLElement;
export function executeCleanPrint(cvData: CVData, lang?: string): Promise<{ success: boolean, totalPages: number }>;
```

### `src/utils/typographyUtils.js`
```javascript
export function computeTypographyTokens(layout: LayoutConfig): Record<string, string>;
```

## Code Layout
- `src/utils/staticHtmlPdfEngine.js`: Print cloning, CSS variable injection, and print iframe orchestration.
- `src/styles/print.css`: Declarative CSS Paged Media rules (`@page`, `break-inside`, `box-decoration-break`, `@media print`).
- `src/styles/index.css`: Editor base styles and typography token definitions.
- `src/components/CV/items/`: Item components rendering dates, bullet points, and section entries.
- `src/components/Editor/ActionMenu.jsx`: Slider controls and layout inputs.
- `cypress/e2e/`: Real-browser Cypress E2E specs (`01-print-lifecycle.cy.js`, `02-print-geometry-and-pagination.cy.js`, `05-pixel-fidelity-and-css-parity.cy.js`, `08-two-column-print-synchronization.cy.js`, `09-bullet-flow-and-slider-parity.cy.js`).
