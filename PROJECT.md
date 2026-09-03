# Project: Ressume 1:1 Vector/Text PDF Print & Export Engine

## Architecture
Ressume implements a high-fidelity, zero-artifact, 1:1 vector and selectable-text PDF print and export pipeline. The engine captures the active `#area-cv` paper document state and transforms it into standalone, semantic HTML5 with embedded CSS custom properties, exact layout rules, dynamic typography, zero interactive editor artifacts, and strict zero-split pagination rules.

```
                      +------------------------------------------+
                      |         ActionMenu Export Trigger        |
                      |          (handleGeneratePDF)             |
                      +--------------------+---------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |            executeCleanPrint             |
                      |  (isolated A4 iframe: 794px x 1123px)    |
                      +--------------------+---------------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v                                             v
+---------------------------------------+     +---------------------------------------+
|       generateCleanPrintHTML          |     |           doc.fonts.ready             |
| - 1:1 Layout & Geometry Replication   |     | - Pre-render font glyph synchronization|
| - 100% Semantic Text (0% Canvas)      |     | - Crisp BoxIcons vector rendering     |
| - Dynamic CSS Variables (:root)       |     | - Auto-scale (floor 0.75 if > 2246px)  |
| - Zero-Artifact Stripping (18 tokens) |     +-------------------+-------------------+
| - Zero-Split Super-Containers         |                         |
|   (break-inside: avoid !important)    |                         v
| - Orphan Header Protection            |     +---------------------------------------+
+---------------------------------------+     |        iframe.contentWindow.print()   |
                                              |        (Native Vector PDF Stream)     |
                                              +---------------------------------------+
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | 1:1 Vector & Selectable Text Core | Output pure semantic HTML5 vector text without canvas rasterization; embed BoxIcons & Google Fonts | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Dynamic Typography & CSS Variable Injection | Inject active CSS variables (`--page-padding`, `--section-gap`, `--item-gap`, `--font-scale`, `--line-height`, `--body-font`, colors) into `:root` and inline styles | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Complete Interactive Artifact Stripping | Strip all 18 interactive editor selectors (drag handles, delete buttons, add buttons, tips toggle, tooltips, column resizer, navbar, inputs/textareas) | M1 | ORIGINAL_REQUEST §R2 |
| 4 | Strict Zero-Split Super-Container Pagination | Enforce `break-inside: avoid !important; page-break-inside: avoid !important;` on `.cv-section` and `.cv-block`, plus `break-after: avoid !important;` on headings | M1 | ORIGINAL_REQUEST §R3 |
| 5 | Bulletproof Client-Side Iframe Pipeline | Dimension offscreen iframe to standard A4 (794px x 1123px), await `doc.fonts.ready`, trigger native print, and clean up DOM | M2 | ORIGINAL_REQUEST §R4 |
| 6 | ActionMenu Export Integration | Connect ActionMenu triggers to `executeCleanPrint` with robust error boundary and fallback | M2 | ORIGINAL_REQUEST §R4 |
| 7 | Full Test Suite Baseline Fixes | Resolve 5 pre-existing test discrepancies in `SuggestionTooltip.jsx` and `InlineEdit.jsx` to achieve 100% green tests | M2 | Acceptance Criteria |
| 8 | Automated Verification Test Suite | Author comprehensive DOM tests verifying 0 artifacts, CSS variable bindings, vector text integrity, super-container pagination, and iframe execution | M3 | Acceptance Criteria |
| 9 | Multi-Tier Verification & Adversarial Audit | Independent Reviewer approval, Challenger empirical verification, and Forensic Auditor clean verdict | FINAL | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Static HTML Print Engine & Pagination | Features 1, 2, 3, 4: `generateCleanPrintHTML`, CSS variable binding, 0-artifact markup, zero-split rules | none | DONE |
| M2 | Client-Side Execution Pipeline & Baseline Fixes | Features 5, 6, 7: `executeCleanPrint` iframe sizing (794px), `doc.fonts.ready`, ActionMenu wiring, baseline test fixes | M1 | DONE |
| M3 | Comprehensive Automated Test Suite | Feature 8: `src/tests/cleanPrintEngineVerification.test.jsx` covering 0-artifacts, CSS bindings, vector text, iframe lifecycle | M1, M2 | DONE |
| FINAL | Independent Review, Challenge & Forensic Audit | Feature 9: 2 Reviewers, 2 Challengers, 1 Forensic Auditor, full test and build pass | M1, M2, M3 | DONE |

## Interface Contracts
### `generateCleanPrintHTML`
```typescript
function generateCleanPrintHTML(cvData: CVData, lang?: string): string;
// Produces a standalone, valid HTML5 document string with <!DOCTYPE html>,
// embedded <style> declaring active CSS variables and print rules,
// 0 interactive classes, 0 <input>/<textarea>, and super-containers adhering to break-inside: avoid.
```

### `executeCleanPrint`
```typescript
function executeCleanPrint(cvData: CVData, lang?: string): Promise<void>;
// Injects an offscreen iframe styled at 794px x 1123px (A4 desktop width),
// populates it with generateCleanPrintHTML, calculates zoom scale,
// awaits font readiness, triggers print dialog, and cleans up iframe.
```

## Code Layout
- `src/utils/staticHtmlPdfEngine.js`: Core print engine (`generateCleanPrintHTML`, `executeCleanPrint`, `calculatePrintScale`).
- `src/components/Editor/ActionMenu.jsx`: Export trigger and ActionMenu UI.
- `src/components/Editor/SuggestionTooltip.jsx`: Obsidian Callout tooltip positioning and clamping.
- `src/components/CV/InlineEdit.jsx`: Inline text/input editor with null context protection.
- `src/index.css`: Global print stylesheet (`@media print` rules, orphan control, interactive artifact suppression).
- `src/tests/cleanPrintEngineVerification.test.jsx`: Dedicated automated test suite for print engine requirements.
