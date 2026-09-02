# E2E Test Infra: Ressume CV Editor Upgrade

## Test Philosophy
- **Opaque-box, requirement-driven**: Test cases are derived strictly from `ORIGINAL_REQUEST.md` and user requirements, exercising the system as an end user would.
- **Methodology**: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial Testing + Real-World Workload Testing.

## Feature Inventory & Test Matrix
| # | Feature | Requirement Source | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) | Tier 4 (Scenario) |
|---|---------|---------------------|:-----------------:|:-----------------:|:----------------------:|:-----------------:|
| 1 | Spacing & Margins Controls | ORIGINAL_REQUEST §R1 | 5 tests | 5 tests | ✓ | ✓ |
| 2 | Polymorphic Cross-Column DND | ORIGINAL_REQUEST §R2 | 5 tests | 5 tests | ✓ | ✓ |
| 3 | Extensible Section Registry | ORIGINAL_REQUEST §R3 | 5 tests | 5 tests | ✓ | ✓ |
| 4 | Lucide-react Icon Migration | ORIGINAL_REQUEST §R4 | 5 tests | 5 tests | ✓ | ✓ |
| 5 | Static HTML PDF & 2-Page Scaling | ORIGINAL_REQUEST §R5 | 5 tests | 5 tests | ✓ | ✓ |

## Test Architecture
- **Framework**: Vitest (`^1.3.0`) + `@testing-library/react` (`^14.2.0`) + `@testing-library/jest-dom` (`^6.4.0`) + `jsdom` (`^24.0.0`)
- **Configuration**: Configured in `vite.config.js` with setup file `src/tests/setup.js`
- **Execution Command**: `npm test` (or `npx vitest run`)
- **Directory Layout**:
  - `src/tests/setup.js` — JSDOM matchers & mock setups
  - `src/tests/spacing.test.jsx` — Tier 1 & 2 tests for Spacing (R1)
  - `src/tests/polymorphic-dnd.test.jsx` — Tier 1 & 2 tests for Cross-Column DND (R2)
  - `src/tests/registry.test.jsx` — Tier 1 & 2 tests for Registry & Factory (R3)
  - `src/tests/iconography.test.jsx` — Tier 1 & 2 tests for Lucide Icons & Callouts (R4)
  - `src/tests/staticHtmlPdfEngine.test.js` — Tier 1 & 2 tests for Static HTML PDF & Auto-scaling (R5)
  - `src/tests/pairwise-interactions.test.jsx` — Tier 3 Cross-Feature combination tests
  - `src/tests/e2e-scenarios.test.jsx` — Tier 4 Real-World Application Workloads

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Full Tech Resume Lifecycle | R1, R2, R3, R4, R5 | High |
| 2 | Heavy Multi-Section Dense CV Export | R1, R3, R5 | High |
| 3 | Cross-Column Reorganization & Spacing Calibration | R1, R2, R4 | Medium |
| 4 | Custom Section Extension & Theme Customization | R1, R3, R4 | Medium |
| 5 | AI Tooltip Hover Interaction & Clean PDF Generation | R3, R4, R5 | High |

## Coverage Thresholds
- **Tier 1 (Feature Coverage)**: ≥25 test cases (≥5 per feature)
- **Tier 2 (Boundary & Corner Cases)**: ≥25 test cases (≥5 per feature)
- **Tier 3 (Cross-Feature Combinations)**: ≥5 pairwise interaction test suites
- **Tier 4 (Real-World Application Scenarios)**: ≥5 end-to-end user workload test suites
- **Total Minimum Target**: ≥60 test cases
