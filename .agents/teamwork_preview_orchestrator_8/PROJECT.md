# Project: Ressume CV Editor - 3 Feature Epics

## Architecture
Ressume is an interactive Vite + React CV editor rendering a live document inside `#area-cv`.
State is managed centrally via `CVContext.jsx` (`cvData`, layout parameters, history stack, localStorage sync).
The three epics augment the architecture:
1. **Epic 1 (Client-Side Vector PDF Engine)**: Introduces `@react-pdf/renderer` in `src/utils/reactPdfEngine.js` and `src/components/PDF/CVDocument.jsx`, generating selectable vector PDFs completely offline (zero network requests) while preserving `staticHtmlPdfEngine.js` as an alternative native print option. [VERIFIED PASS]
2. **Epic 2 (Rich Inline Text Editing Toolbar)**: Enhances `src/components/Editor/InlineEdit.jsx` and introduces a floating formatting toolbar component `src/components/Editor/RichTextToolbar.jsx` with dynamic bounding rectangle tracking (AGENTS.md Rule 3), inline formatting (bold/italic), text alignment, keyboard shortcuts, history integration, and multi-engine rendering support. [VERIFIED PASS]
3. **Epic 3 (Floating Panel Reorganization & ATS Mode & Right-Docked Modal)**: Restructures `src/components/Editor/ActionMenu.jsx` into streamlined groups ('Diseño', 'Acciones', ATS mode toggle switch) and repositions `src/components/Editor/AddSectionModal.jsx` to dynamically float to the right of `#area-cv` using viewport geometry. [VERIFIED PASS]

```
+-----------------------------------------------------------------------------------+
|                                   App Shell                                       |
|                                                                                   |
|  +---------------------------+  +-------------------+  +-----------------------+  |
|  |  Reorganized ActionMenu   |  |     #area-cv      |  | Floating Modal Right  |  |
|  |  - ATS Mode Toggle Switch |  | (Interactive CV)  |  |  (AddSectionModal)    |  |
|  |  - 'Diseño' Submenu       |  |                   |  +-----------------------+  |
|  |  - 'Acciones' Submenu     |  | - Rich InlineEdit |                             |
|  +-------------+-------------+  |   (b/i/align/etc) |                             |
|                |                +---------+---------+                             |
|                v                          |                                       |
|   +--------------------------+            v                                       |
|   | Export Handlers          |   +--------------------+                           |
|   | - React-PDF Download     |   | Floating Rich      |                           |
|   | - Native Clean Print     |   | Text Toolbar       |                           |
|   | - JSON Export            |   +--------------------+                           |
|   +------------+-------------+                                                    |
|                |                                                                  |
|                +--------> @react-pdf/renderer (Vector PDF) [VERIFIED PASS]        |
|                +--------> staticHtmlPdfEngine.js (Iframe Print) [VERIFIED PASS]   |
+-----------------------------------------------------------------------------------+
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Client-Side @react-pdf JIT Mirror | Capture layout variables, fonts, colors, padding, gaps, and CSS custom properties into React-PDF primitives | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Selectable Vector Text & Offline Execution | 100% vector text using standard PDF Type 1 fonts without network requests or canvas rasterization | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Multi-Page A4 Pagination & Zero-Split | Paginate content across A4 pages, breaking strictly between sections / never mid-item | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Generation Spinner & Toast Feedback | Show loading spinner during PDF generation and success toast upon download | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Dual-Engine Preservation & Bugfix | Retain `staticHtmlPdfEngine.js` intact and fix parameter `isLast = false` in `renderItemHTML` | M1 | ORIGINAL_REQUEST §R1 |
| 6 | Floating Formatting Toolbar | Singleton floating toolbar positioned dynamically near active field tracking bounding rect (AGENTS.md Rule 3) | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Text Alignment Controls | Support left, center, right, justify alignments per text block/field | M2 | ORIGINAL_REQUEST §R2 |
| 8 | Bold & Italic Shortcuts & Toggles | Toolbar buttons and keyboard shortcuts (Ctrl+B, Ctrl+I) toggle formatting on selections | M2 | ORIGINAL_REQUEST §R2 |
| 9 | History & Native Editing Shortcuts | Support Ctrl+Z, Ctrl+Shift+Z / Ctrl+Y, cut, copy, paste within inline fields | M2 | ORIGINAL_REQUEST §R2 |
| 10 | State Persistence in cvData | Persist rich formatted strings in `cvData` and `localStorage` without breaking schema or adapters | M2 | ORIGINAL_REQUEST §R2 |
| 11 | Cross-Engine Rich Text Rendering | Render bold, italic, and alignment accurately in editor DOM, staticHtmlPdfEngine, and React-PDF | M2 | ORIGINAL_REQUEST §R2 |
| 12 | ActionMenu Button Streamlining | Group top-level buttons into cohesive categories to reduce visual clutter | M3 | ORIGINAL_REQUEST §R3 |
| 13 | Grouped 'Diseño' Submenu | Single entry point for colors, spacing sliders (padding, gaps), and typography settings | M3 | ORIGINAL_REQUEST §R3 |
| 14 | ATS Layout Mode Toggle Switch | Top-of-panel switch for ATS single-column layout with clean white background and sober accents | M3 | ORIGINAL_REQUEST §R3 |
| 15 | Grouped 'Acciones' Submenu | Single dropdown/popover for export options (JSON export, PDF download) | M3 | ORIGINAL_REQUEST §R3 |
| 16 | Right-Docked Floating AddSectionModal | Render modal floating in the space to the right of `#area-cv` instead of center overlay | M3 | ORIGINAL_REQUEST §R3 |
| 17 | Comprehensive E2E Verification & Audit | 100% green test suite across Tiers 1-4, zero dnd-kit regressions, and clean forensic audit | FINAL | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Epic 1: Client-Side PDF Generation via @react-pdf/renderer | Features 1, 2, 3, 4, 5: React-PDF setup/polyfills, `CVDocument.jsx`, `reactPdfEngine.js`, staticHtml bugfix, toast/spinner | none | DONE |
| M2 | Epic 2: Rich Inline Text Editing Toolbar with Persistent State | Features 6, 7, 8, 9, 10, 11: `RichTextToolbar.jsx`, `InlineEdit.jsx` rich text upgrade, shortcuts, cross-engine render | M1 | DONE |
| M3 | Epic 3: Floating Panel Reorganization & ATS Mode & Floating Modal | Features 12, 13, 14, 15, 16: ActionMenu restructuring ('Diseño', 'Acciones', ATS toggle), right-docked AddSectionModal | M1, M2 | DONE |
| FINAL | Final Milestone: Full E2E Verification & Adversarial Hardening | Feature 17: Pass all E2E test tiers, challenger cross-epic integration, and forensic integrity audit | M1, M2, M3 | IN_PROGRESS |

## Interface Contracts
### `generateAndDownloadPdf`
```typescript
function generateAndDownloadPdf(cvData: CVData, lang: string): Promise<Blob>;
```

### `RichTextToolbar`
```typescript
interface RichTextToolbarProps {
  activeElement: HTMLElement | null;
  onFormat: (command: 'bold' | 'italic' | 'justifyLeft' | 'justifyCenter' | 'justifyRight' | 'justifyFull') => void;
  activeFormats: { bold: boolean; italic: boolean; align: 'left' | 'center' | 'right' | 'justify' };
  visible: boolean;
}
```

### `ActionMenu` Mode & Grouping Contracts
```typescript
// ATS Mode: cvData.layout.type === '1-column' && cvData.layout.isAtsMode === true
// 'Diseño' popover controls: Colors, Spacings (pagePadding, sectionGap, itemGap), Fonts
// 'Acciones' popover controls: Export JSON, Export PDF (React-PDF & Native Print)
```

## Code Layout
- `src/utils/reactPdfEngine.js`: Core client-side React-PDF generation pipeline.
- `src/components/PDF/CVDocument.jsx`: Declarative React-PDF layout mirror component.
- `src/utils/staticHtmlPdfEngine.js`: Supplemented native iframe print engine + bugfix.
- `src/components/Editor/InlineEdit.jsx`: Enhanced rich-text inline editable component.
- `src/components/Editor/RichTextToolbar.jsx`: Floating formatting toolbar with bounding rect tracking.
- `src/components/Editor/ActionMenu.jsx`: Reorganized floating panel with ATS switch and submenus.
- `src/components/Editor/AddSectionModal.jsx`: Repositioned modal floating right of `#area-cv`.
- `src/tests/`: Automated unit, integration, and E2E verification test suites.
