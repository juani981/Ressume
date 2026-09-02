# E2E Test Infra: Ressume CV Editor

## Test Philosophy
- Opaque-box, requirement-driven testing. Derived from `ORIGINAL_REQUEST.md` (2026-09-02T02:11:43Z).
- Verification mechanism operates against rendered DOM outputs, calculated geometry, CSS variable propagation, and print snapshots.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial Testing + Real-World Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Real-World) |
|---|---------|---------------------|:----------------:|:-----------------:|:-----------------:|:-------------------:|
| 1 | Font Family Selector (5 fonts) | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 2 | Typography Scale & Line-Height | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 3 | Independent Spacing Controls | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 4 | State & Persistence Schema | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 5 | ATS 1-Column Layout Overhaul | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 6 | 1-Col / 2-Col Toggle Fidelity | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 7 | Forgiving DnD Ergonomics | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 8 | Extensible Registry & Base Components | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 9 | Obsidian Callouts & Tooltip Bounds | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| 10 | Strict Zero-Split PDF Printing | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| 11 | Static HTML Print Generator | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| 12 | Dynamic 2 A4 Auto-Scaling | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| 13 | Categorized ActionMenu Toolbar | ORIGINAL_REQUEST §R6 | 5 | 5 | ✓ | ✓ |
| 14 | CV Data Schema & I18n Fidelity | ORIGINAL_REQUEST §R6 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- **Runner**: Vitest v1.3.1 with jsdom environment (`npm test` / `npx vitest run`)
- **Libraries**: `@testing-library/react`, `@testing-library/jest-dom`
- **Location**: `src/tests/`
- **Pass/Fail Semantics**: All test suites must pass with exit code 0, 0 unhandled rejections, 0 memory leaks.

## Test Directory Layout
- `src/tests/setup.js`: DOM polyfills, in-memory localStorage mock, matchMedia, cleanup.
- `src/tests/spacing.test.jsx`: Spacing tokens, localStorage persistence, slider interactions.
- `src/tests/polymorphic-dnd.test.jsx`: Cross-column drag-and-drop, polymorphic item conversion.
- `src/tests/registry.test.jsx`: Component & section extensible registry factory.
- `src/tests/iconography.test.jsx`: Lucide-react icons, Obsidian callout styling, tooltip positioning math.
- `src/tests/staticHtmlPdfEngine.test.js`: Clean static HTML generation, 0 editor artifacts, auto-scaling.
- `src/tests/pairwise-interactions.test.jsx`: Cross-feature combinatorial interactions.
- `src/tests/e2e-scenarios.test.jsx`: Real-world end-to-end user workflows and full document lifecycle.
- `src/tests/challenger-stress-suite.test.jsx`: Adversarial stress tests (Monte Carlo scaling, corrupted state, XSS).
- `src/tests/dom-geometry-typography.test.jsx`: New Tier 1-4 comprehensive suite for typography, geometry, 1-col ATS flow, ActionMenu categories, and zero-split printing.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Full Tech Executive CV Build | F1, F2, F3, F5, F8, F10, F11, F12, F13 | High |
| 2 | Bilingual English/Spanish Technical Resume | F4, F6, F7, F8, F14 | High |
| 3 | Heavy Multi-Section Document Print Optimization | F2, F3, F10, F11, F12 | High |
| 4 | Rapid Interactive Theme & Font Restyling | F1, F2, F3, F4, F13 | Medium |
| 5 | Cross-Column Structural Reorganization | F5, F6, F7, F8, F9, F14 | High |

## Coverage Thresholds
- Tier 1: ≥5 test cases per feature
- Tier 2: ≥5 test cases per feature for boundary/corner conditions
- Tier 3: Pairwise coverage across layout, typography, spacing, DnD, and print
- Tier 4: ≥5 realistic application scenarios
- Tier 5: Adversarial coverage hardening with 0 critical defects
