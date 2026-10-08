# E2E Test Infra: Ressume Robustness & Accessibility

## Test Philosophy
- Opaque-box, requirement-driven, derived from `ORIGINAL_REQUEST.md` and `AGENTS.md`.
- No dependency on internal implementation details; interacts with DOM elements, keys, local storage, and Cypress custom commands.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World User Workloads.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Corrupt Data & Storage Recovery (F11) | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 2 | Modal Focus Trapping & Keyboard (F12) | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 3 | Modal Contextual Help Tours (F13) | AGENTS.md Invariant 20 | 5 | 5 | ✓ |
| 4 | Section Creation, Editing, Print & Export | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |

## Test Architecture
- **Runner**: Cypress 13 (`npx cypress run --spec ...`).
- **Dev Server**: Vite (`http://localhost:5173`).
- **Support**: `cypress/support/commands.js`, custom commands (`waitForFonts`, `stubPrint`, `setSliderValue`, `generatePdfWithCDP`).
- **Spec Directory**: `cypress/e2e/` (28 existing specs + 3 new specs).

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Corrupted session storage recovery without White Screen of Death | F8, F9, F11 | High |
| 2 | Full keyboard-only CV navigation, modal opening, editing, and closing | F2, F3, F12 | High |
| 3 | Contextual help tour inspection across all modales without state loss | F13, Invariant 20 | Medium |
| 4 | Complete CV authoring, section additions, reordering, and clean export | F6, F7, Print Engine | High |

## Coverage Thresholds
- Tier 1: >= 5 test cases per feature (happy-path isolation)
- Tier 2: >= 5 boundary and corner cases (empty states, max limits, malformed strings)
- Tier 3: Pairwise coverage across feature interactions (modal + keyboard + storage)
- Tier 4: Realistic user journeys
