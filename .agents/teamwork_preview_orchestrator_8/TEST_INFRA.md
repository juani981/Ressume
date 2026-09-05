# E2E Test Infra: Ressume 3 Feature Epics

## Test Philosophy
- Requirement-driven, opaque-box and grey-box verification.
- Validates the 3 epics strictly against `ORIGINAL_REQUEST.md` and `AGENTS.md`.
- Methodology: Category-Partition + Boundary Value Analysis + Cross-Feature Pairwise + Real-World Workload Testing.

## Feature Inventory & Coverage Matrix
| # | Feature | Requirement | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---------|-------------|:------:|:------:|:------:|:------:|
| 1 | Client-Side @react-pdf Mirror | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 2 | Selectable Vector Text & Offline | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 3 | Multi-Page A4 Pagination & Zero-Split | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 4 | Spinner & Toast Notification | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 5 | Dual Engine (staticHtml preserved + bugfix) | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 6 | Floating Formatting Toolbar Position | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 7 | Text Alignment (L/C/R/J) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 8 | Bold/Italic Shortcuts & Buttons | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 9 | History / Editing Shortcuts | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 10 | State Persistence in cvData | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 11 | Cross-Engine Rich Text Rendering | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 12 | ActionMenu Button Reduction | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 13 | Grouped 'Diseño' Menu | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 14 | ATS Mode Toggle Switch | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 15 | Grouped 'Acciones' Menu | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 16 | Right-Floating AddSectionModal | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- Test Runner: Vitest (`npm test` / `npx vitest run`) with JSDOM environment.
- Test Files:
  - `src/tests/epic1-react-pdf-generation.test.jsx`: Complete validation of Epic 1.
  - `src/tests/epic2-rich-text-toolbar.test.jsx`: Complete validation of Epic 2.
  - `src/tests/epic3-actionmenu-ats-modal.test.jsx`: Complete validation of Epic 3.
  - `src/tests/cross-epic-e2e-integration.test.jsx`: Cross-cutting integration tests.
  - Pre-existing suites must remain 100% green (e.g. `cleanPrintEngineVerification.test.jsx`, `itemAdapter.test.js`, etc.).

## Pass/Fail Semantics
- Zero console errors or unhandled rejections during test runs.
- 100% pass across all test files with exit code 0.
- Production build `npm run build` succeeds with exit code 0.
