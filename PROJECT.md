# Project: Ressume CV Editor - Comprehensive Architectural Audit, Refactoring & Production Readiness

## Architecture
Ressume is an interactive Vite + React CV editor rendering a live document inside `#area-cv`.
The architecture follows a unidirectional data flow centered on `CVContext.jsx`:
- **State Management**: CV content (`cvData`), layout settings (columns, typography, spacing), version history, and localStorage persistence.
- **Component Decomposition**:
  - `App.jsx`: Root editor shell orchestrating toolbar, action menu, document canvas (`#area-cv`), and layout panels.
  - Modular hooks: `usePaginationEngine.js` (page breaks, height calculation), `useCVDndCoordinator.js` (@dnd-kit sensor and drag coordinator), `useColumnResizer.js` (column resizing).
  - Modular utilities: `src/utils/pageGeometry.js` (297mm ruler, forbidden zone bounds), `src/utils/colorUtils.js` (YIQ contrast), `src/utils/typographyUtils.js` (typography tokens), `src/utils/paginationEngine.js` (break points).
  - Section Registry (`src/registry/sectionRegistry.js`): Open/Closed registry of section descriptors, item types, and semantic metadata.
  - Modular Sections & Items (`src/components/CV/`): `BaseSection.jsx`, `BaseItem.jsx`, and item components rendering dynamic fields.
- **Iconography**: 100% unified on `lucide-react` SVG components, eliminating legacy BoxIcons CSS and external CDN stylesheets.
- **Print & Parity Engine**: `src/utils/staticHtmlPdfEngine.js` and `src/styles/print.css` creating a 1:1 pixel-perfect A4 snapshot of `#area-cv`, preserving 794px width, CSS variables, margins, and strictly avoiding forbidden boundary zones.
- **Invariants (AGENTS.md)**:
  - Drag-and-drop exclusively via `@dnd-kit` (never `swapy`).
  - Dynamic tooltips and popovers dynamically track `getBoundingClientRect()`.
  - Suggestions and callouts strictly follow Obsidian Callout standard (Danger, Caution, Info).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Delete Orphan Components | Delete `CVBlock.jsx`, `CVHeader.jsx`, simplify `CVSection.jsx` into `BaseSection.jsx` | M1 | Survey 1 §R1 |
| 2 | Clean Experimental/Noisy Tests | Remove `test_inspect_juan_cv.test.jsx` and timeout-prone `forbidden-page-boundary-zone.test.jsx` | M1 | Survey 1 §R1 |
| 3 | Remove BoxIcons CDN Links | Remove external CDN `<link>` tags in `index.html` and `staticHtmlPdfEngine.js` | M1 | Survey 1 §R3 |
| 4 | Complete BoxIcons -> Lucide Migration | Replace all 42 BoxIcons instances across `src/` with native `lucide-react` components | M1 | Survey 1 §R3 |
| 5 | Update Icon Test Assertions | Update tests asserting `.bx` classes to check for Lucide SVGs | M1 | Survey 1 & 3 §R3 |
| 6 | JSDOM Test Environment Hardening | Add `window.focus = vi.fn()` in `src/tests/setup.js` | M1 | Survey 3 §Build |
| 7 | Utility Extraction: Color & Typography | Extract `src/utils/colorUtils.js` and `src/utils/typographyUtils.js` | M2 | Survey 2 §R2 |
| 8 | Utility Extraction: Page Geometry | Extract `src/utils/pageGeometry.js` (ruler, bounds, forbidden zones) | M2 | Survey 2 §R2 |
| 9 | Utility Extraction: Pagination Engine | Extract pure algorithms into `src/utils/paginationEngine.js` | M2 | Survey 2 §R2 |
| 10 | Custom Hooks: Pagination & Resizer | Extract `usePaginationEngine.js` and `useColumnResizer.js` from `App.jsx` | M2 | Survey 2 §R2 |
| 11 | Custom Hook: DND Coordinator | Extract `useCVDndCoordinator.js` managing `@dnd-kit` interactions | M2 | Survey 2 §R2 |
| 12 | App.jsx & BaseSection.jsx Simplification | Refactor `App.jsx` and `BaseSection.jsx` to consume extracted hooks and utilities | M2 | Survey 2 §R2 |
| 13 | 1:1 Visual Parity & 794px Canvas Strictness | Verify 0px drift between `#area-cv` and PDF clean print snapshot | M3 | Survey 2 §R4 |
| 14 | Forbidden Boundary Zone Enforcement | Guarantee no content invades forbidden page boundary zones in 1-col ATS and 2-col modes | M3 | Survey 2 §R4 |
| 15 | Page Break & Margin Stability Verification | Verify `box-decoration-break: slice`, CSS variable propagation, and print margin stability | M3 | Survey 2 §R4 |
| 16 | Technical Guide: arquitectura.md | Complete guide covering unidirectional flow, editor architecture, and pagination engine | M4 | Survey 3 §R5 |
| 17 | Technical Guide: guia-extensibilidad-secciones.md | Step-by-step guide for adding sections/items via `sectionRegistry.js` | M4 | Survey 3 §R5 |
| 18 | Technical Guide: diseno-invariantes.md | Style guide, accessibility, Obsidian callout standards, dynamic tooltip bounding rect | M4 | Survey 3 §R5 |
| 19 | Technical Guide: motor-impresion-pdf.md | Documentation of static HTML print pipeline, 794px canvas, and print parity | M4 | Survey 3 §R5 |
| 20 | Update Legacy Docs & Cross-linking | Cross-link guides and update outdated references in `/docs` | M4 | Survey 3 §R5 |
| 21 | Full Regression Battery & Build Zero-Warnings | Run all Vitest suites and verify `npm run build` exits 0 with zero warnings | M5 | Acceptance Criteria |
| 22 | Multi-Agent Independent Review (2 Reviewers) | Rigorous code review of architecture, quality, and maintainability | M5 | Orchestration Pattern |
| 23 | Empirical Adversarial Stress Testing (2 Challengers) | Empirical verification of pagination, tooltips, and iconography | M5 | Orchestration Pattern |
| 24 | Forensic Integrity Audit (1 Auditor) | Anti-cheating and code integrity audit (binary veto) | M5 | Orchestration Pattern |
| 25 | Git Final Consolidation Commit | Final git commit consolidating all changes | M5 | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Saneamiento de Código Muerto & Unificación Lucide-React | Features 1, 2, 3, 4, 5, 6: Delete orphans, migrate 100% BoxIcons to lucide-react, remove CDN links, update icon tests, harden setup.js | none | DONE |
| M2 | Refactorización y Modularización de Lógica Repetida | Features 7, 8, 9, 10, 11, 12: Extract colorUtils, typographyUtils, pageGeometry, paginationEngine, usePaginationEngine, useCVDndCoordinator, useColumnResizer; simplify App.jsx | M1 | DONE |
| M3 | Paridad Visual 1:1, Paginación y Zonas Prohibidas | Features 13, 14, 15: Enforce 794px canvas, forbidden boundary zones in 1-col and 2-col, margin stability, automated parity verification | M2 | DONE |
| M4 | Documentación Exhaustiva y Guías de Desarrollo en /docs | Features 16, 17, 18, 19, 20: Author arquitectura.md, guia-extensibilidad-secciones.md, diseno-invariantes.md, motor-impresion-pdf.md | M2 | DONE |
| M5 | Verificación Integral, Stress Testing, Forensic Audit & Git Commit | Features 21, 22, 23, 24, 25: Full Vitest pass, clean build, 2 Reviewers, 2 Challengers, 1 Auditor, final git commit | M1, M2, M3, M4 | IN_PROGRESS |

## Interface Contracts
### `src/utils/pageGeometry.js`
```javascript
export function getRulerHeightPx(containerEl): number;
export function getRelativeBounds(el, parentEl): { top: number, left: number, width: number, height: number, bottom: number };
export function isInForbiddenBoundaryZone(top: number, bottom: number, pageHeight: number, pagePadding: number): boolean;
```

### `src/utils/colorUtils.js`
```javascript
export function getContrastYIQ(hexColor: string): 'dark' | 'light';
```

### `src/utils/typographyUtils.js`
```javascript
export function getFontFamilyStack(fontName: string): string;
export function applyTypographyTokens(targetEl: HTMLElement, fontScale: string, lineHeight: string): void;
```

### `src/utils/paginationEngine.js`
```javascript
export function calculatePageBreaks(areaCvEl: HTMLElement, pageHeightPx: number, pagePaddingPx: number): number[];
```

### `src/hooks/usePaginationEngine.js`
```javascript
export function usePaginationEngine({ areaCvRef, cvData, layoutSettings }): {
  pageBreaks: number[];
  pageCount: number;
  recalculatePages: () => void;
  isRecalculating: boolean;
};
```

### `src/hooks/useCVDndCoordinator.js`
```javascript
export function useCVDndCoordinator({ cvData, updateCVData }): {
  sensors: SensorDescriptor<any>[];
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  activeDragItem: any;
};
```

### `src/hooks/useColumnResizer.js`
```javascript
export function useColumnResizer({ initialLeftWidth, onResize }): {
  leftWidth: number;
  isResizing: boolean;
  startResizing: (e: React.MouseEvent) => void;
};
```

## Code Layout
- `src/utils/`: Pure utility functions (`pageGeometry.js`, `colorUtils.js`, `typographyUtils.js`, `paginationEngine.js`, `staticHtmlPdfEngine.js`, `contactTypes.js`).
- `src/hooks/`: Custom React hooks (`usePaginationEngine.js`, `useCVDndCoordinator.js`, `useColumnResizer.js`).
- `src/components/CV/`: Section and item components (`BaseSection.jsx`, `BaseItem.jsx`, `items/`).
- `src/components/Editor/`: ActionMenu, DragHandle, ContactTypePicker, HyperlinkEdit, SuggestionTooltip.
- `src/registry/`: `sectionRegistry.js`.
- `src/styles/`: `print.css`, `index.css`.
- `docs/`: `arquitectura.md`, `guia-extensibilidad-secciones.md`, `diseno-invariantes.md`, `motor-impresion-pdf.md`.
- `src/tests/`: Vitest test suites.
