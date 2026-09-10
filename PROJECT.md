# Project: Ressume CV Editor - Absolute Visual Parity (0px Drift)

## Architecture
Ressume is an interactive Vite + React CV editor rendering a live document inside `#area-cv`.
State is managed centrally via `CVContext.jsx` (`cvData`, layout parameters, history stack, localStorage sync).
The print engine (`executeCleanPrint` / `generateCleanPrintHTML` in `src/utils/staticHtmlPdfEngine.js`) captures a clean snapshot of `#area-cv`, renders it in an isolated iframe, and triggers print.
To achieve absolute 1:1 pixel parity (0px discrepancy) between editor `#area-cv` and print output:
1. **Single Source of Truth CSS**: Purge divergent print CSS overrides (`width: 100% !important`, padding overrides, font size changes). Extract document layout rules from desktop media query `@media screen and (min-width: 968px)` so `#area-cv` maintains identical styling in both the editor and the 794px print iframe.
2. **Fixed 794px A4 Canvas**: Lock `#area-cv` to strict 794px width in both editor and print (`width: 794px; min-width: 794px; max-width: 794px`). Maintain strict 1.0 zoom.
3. **Artifact Concealment Without Reflow**: Conceal all 26 interactive editor artifacts without altering container dimensions or causing flow distortion. Out-of-flow artifacts are removed/hidden without reflow; in-flow artifacts (`.bullet-add-row`, inline-edit display) are harmonized so zero phantom height or padding is added in either view.
4. **Primary TDD Pixel-Parity Verification**: Comprehensive automated test suite `src/tests/pixelParityEditorPrint.test.jsx` that compares computed bounding boxes, typography metrics, and CSS custom properties with strict 0px drift tolerance across 1-col and 2-col modes.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Single Source of Truth CSS & Purge Overrides | Eliminate destructive regex stripping in `staticHtmlPdfEngine.js`, purge divergent print overrides (`width: 100% !important`, padding overrides) | M1 | ORIGINAL_REQUEST §R2 |
| 2 | Media Query Extraction for #area-cv | Extract document layout styles from `@media screen and (min-width: 968px)` in `index.css` so they apply unconditionally inside `#area-cv` | M1 | Survey Findings |
| 3 | Strict 794px Container Width & 1.0 Zoom | Enforce strict 794px width on `#area-cv` across editor and print snapshot; eliminate zoom downscaling and forced page break margin shifts | M1 | ORIGINAL_REQUEST §R1 |
| 4 | CSS Custom Property Synchronization | Guarantee identical propagation and fallbacks for all CSS variables (--page-padding, --section-gap, --item-gap, --font-scale, --line-height, --container-color-alt) | M1 | ORIGINAL_REQUEST §R2 |
| 5 | Non-Disruptive Artifact Concealment | Conceal all 26 interactive editor controls without altering physical dimensions or causing reflow | M2 | ORIGINAL_REQUEST §R3 |
| 6 | Eliminate Phantom In-Flow Heights | Fix `.bullet-add-row` and in-flow controls so they occupy 0px in-flow height when not hovered/in print | M2 | Survey Findings |
| 7 | Component Template Harmonization | Remove artificial `0.25rem` padding in print components, unify bullet structures and `InlineEdit` display (`inline-block`) | M2 | Survey Findings |
| 8 | 1-Column ATS Hierarchy Harmonization | Scope `.resume__single-column` padding cleanly to `#area-cv.resume__single-column`, eliminating inner wrapper double padding | M2 | Survey Findings |
| 9 | Primary TDD Pixel-Parity Test Suite | Build comprehensive test suite in `src/tests/pixelParityEditorPrint.test.jsx` verifying 0px drift across all elements in 1-col and 2-col | M3 | ORIGINAL_REQUEST §R4 |
| 10 | Full Regression Battery Verification | Ensure all 32+ vitest test suites (546+ tests) pass with 100% success | M3 | ORIGINAL_REQUEST §R4 |
| 11 | Production Build Verification | Ensure `npm run build` completes with 0 errors/warnings | M3 | ORIGINAL_REQUEST §R4 |
| 12 | Multi-Agent Independent Verification & Audit | 2 Reviewers, 2 Challengers, 1 Forensic Integrity Auditor for final certification | M4 | System Protocol |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | CSS Architecture & Single Source of Truth Alignment | Features 1, 2, 3, 4: Regex purge, media query extraction, strict 794px canvas, variable sync, print lifecycle fixes | none | DONE |
| M2 | Artifact Concealment & Component Template Harmonization | Features 5, 6, 7, 8: Zero-reflow artifact concealment, eliminate phantom height in `.bullet-add-row`, component padding & bullet harmonization, 1-col ATS DOM hierarchy | M1 | DONE |
| M3 | Primary TDD Pixel-Parity Suite & System Verification | Features 9, 10, 11: Upgrade `pixelParityEditorPrint.test.jsx` with strict 0px drift tolerance, verify full test battery and clean build | M1, M2 | DONE |
| M4 | Independent Review, Challenger Stress & Forensic Audit | Feature 12: 2 Reviewers, 2 Challengers, 1 Forensic Auditor for final certification | M1, M2, M3 | DONE |

## Interface Contracts
### `generateCleanPrintHTML`
```typescript
function generateCleanPrintHTML(
  cvData: CVData,
  lang?: string,
  snapshot?: {
    width: number;
    height: number;
    zoom: number;
    styles: Record<string, string>;
  }
): string;
// Produces clean, self-contained HTML document with exact 794px width, zoom: 1.0,
// 0 interactive artifacts, and identical computed styles to #area-cv.
```

### `pixelParityEditorPrint.test.jsx` Contract
```typescript
// Asserts 0px delta between live editor DOM elements and clean print snapshot:
// - container width: strict 794px
// - bounding box delta: Math.abs(editorBox - printBox) === 0 across top, left, width, height
// - computed typography: fontSize, lineHeight, fontFamily delta === 0
// - CSS variables: all 14 variables match exactly
// - 0 blacklisted interactive artifacts present in print DOM
// - Tested across both 1-column ATS and 2-column layouts.
```

## Code Layout
- `src/utils/staticHtmlPdfEngine.js`: Snapshot capture, clean print HTML generator, iframe print lifecycle.
- `src/index.css`: Global styles, layout rules, `#area-cv` styling, CSS variable definitions.
- `src/styles/print.css`: Clean print styles, page break avoidance rules, `@page` setup.
- `src/App.jsx`: Main editor layout, `#area-cv` container, layout toggle, resizer.
- `src/components/CV/BaseSection.jsx`: Section container and print section view.
- `src/components/CV/BaseItem.jsx`: Item container and print item view.
- `src/components/CV/items/`: Item components (`ExperienceItem.jsx`, etc.) and print views.
- `src/components/Editor/InlineEdit.jsx`: Inline text editing component and print view.
- `src/tests/pixelParityEditorPrint.test.jsx`: Primary TDD pixel-parity test suite (0px drift tolerance).
