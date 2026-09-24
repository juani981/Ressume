# Project: Architectural Audit & Refactoring — Ressume CV Editor

## Architecture
- **Framework**: Vite + React 18 (plain JavaScript/JSX).
- **Styling Architecture**: Single Source of Truth for print styles in `src/styles/print.css`. Editor-only styles in `src/index.css`.
- **Print Pipeline**: Iframe-based snapshot generation in `src/utils/staticHtmlPdfEngine.js`. Three style tags injected:
  1. `<style id="cv-base-styles">` (sanitized `index.css` + dynamic custom properties)
  2. `<style id="cv-print-styles">` (single `@media print` block in `print.css`)
  3. `<style id="cv-snapshot-breaks">` (dynamically calculated breaks via `snapshotBreaksCSS`)
- **State & Layout**: `CVContext.jsx` and `App.jsx`. Editor gap `gapPx = 20` simulated for pagination guides, strictly isolated from print document.
- **Section Registry**: Extensible descriptor pattern in `src/registry/sectionRegistry.js`.

## Feature Inventory
| # | Feature | Description | Milestone | Status | Source |
|---|---------|-------------|-----------|--------|--------|
| 1 | Comprehensive Audit Report | Document all findings across Print Engine, CSS, and Tests before edits | Phase 0 | DONE | ORIGINAL_REQUEST |
| 2 | Dead Code Cleanup & Annotation | Identify and annotate/remove unreachable paths in `staticHtmlPdfEngine.js` | M1 | DONE | ORIGINAL_REQUEST §R1 |
| 3 | CSS Variable Transfer to Iframe | Transfer custom properties on `#area-cv` to print iframe root | M1 | DONE | ORIGINAL_REQUEST §R1 |
| 4 | Editor `gapPx` Documentation | Annotate `gapPx = 20` in `App.jsx` clarifying editor-only existence | M1 | DONE | ORIGINAL_REQUEST §R1 |
| 5 | Page Break `margin-top` Hardening | Enforce `var(--page-padding, 24px)` on `snapshotBreaksCSS` and DOM injection | M1 | DONE | ORIGINAL_REQUEST §R1 |
| 6 | 2-Column Min-Height & Slice | Change `box-decoration-break: slice` to prevent 48px double-padding on page 2 | M1 | DONE | ORIGINAL_REQUEST §R1 |
| 7 | Purge `@media print` from `index.css` | Ensure 0 print rules in `src/index.css` | M2 | DONE | ORIGINAL_REQUEST §R2 |
| 8 | Consolidate `print.css` | Single top-level `@media print {}`, no bare selectors, fallback variables | M2 | DONE | ORIGINAL_REQUEST §R2 |
| 9 | Inline Styles Cleanup in Print Engine | Remove redundant inline styles from `executeCleanPrint`, keep dynamic | M2 | DONE | ORIGINAL_REQUEST §R2 |
| 10 | Tautological Test Remediation | Convert 24 circular JSDOM tests to documented no-ops, harden Juan CV test | M3 | DONE | ORIGINAL_REQUEST §R3 |
| 11 | Pillar 3 3-Style-Tag Assertions | Verify `cv-base-styles`, `cv-print-styles`, `cv-snapshot-breaks` in iframe (T3.6) | M3 | DONE | ORIGINAL_REQUEST §R3 |
| 12 | CSS Variable Propagation Test | Programmatic test verifying custom properties reach iframe root (T5.6) | M3 | DONE | ORIGINAL_REQUEST §R3 |
| 13 | Final Full Suite Verification | Clean build (0 errors/warnings) & 661 passing tests with 0 failures | M4 | DONE | ORIGINAL_REQUEST AC |

## Milestones
| # | Name | Scope | Dependencies | Status | Key Outputs |
|---|------|-------|-------------|--------|-------------|
| 0 | Phase 0: Survey & Audit Report | Explorers audit, compile `docs/audit-report.md` | none | DONE | `docs/audit-report.md` & brain artifact |
| 1 | M1: Print Engine Hardening | Dead code, CSS var transfer, `gapPx` doc, `margin-top`, column height | Phase 0 | DONE | `staticHtmlPdfEngine.js`, `App.jsx`, `print.css` |
| 2 | M2: CSS Single Source of Truth | Purge `index.css`, enforce `print.css` structure, trim inline styles | M1 | DONE | `print.css`, `staticHtmlPdfEngine.js` |
| 3 | M3: Test Suite Modernization | Fix tautologies, add style tag tests, add CSS var transfer test | M2 | DONE | `cleanPrintEngineVerification.test.jsx`, etc. |
| 4 | M4: Final Verification & Audit | Clean build, 661 tests passing, 2 Reviews (APPROVE), 2 Challenges (CONFIRMED_CORRECT), Forensic Audit (CLEAN) | M3 | DONE | `GATE_STATUS.md` PASS |

## Code Layout
- `src/utils/staticHtmlPdfEngine.js` — Core print engine, iframe creation, break computation, cleanup.
- `src/styles/print.css` — Single Source of Truth for print styles.
- `src/index.css` — Editor-only styling.
- `src/App.jsx` — Editor layout, pagination guides, `gapPx`.
- `src/tests/` — Vitest unit and integration test suites.
- `docs/audit-report.md` — Comprehensive pre-refactoring audit report.
