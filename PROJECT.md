# Project: Ressume CV Editor Transformation

## Architecture
Ressume is a high-performance, client-side React CV editor engineered for modern ATS readability and executive document design. It integrates `@dnd-kit` for drag-and-drop hierarchy, dynamic CSS custom properties for real-time typography and spacing manipulation, an extensible component/section registry, and an isolated static HTML print core for 2-page A4 PDF export.

```
                  +----------------------------------------------+
                  |                 App Root                     |
                  |     (CVContext, State, Undo/Redo, I18n)      |
                  +----------------------+-----------------------+
                                         |
             +---------------------------+---------------------------+
             |                                                       |
             v                                                       v
+-----------------------------+                         +-----------------------------+
|    Categorized ActionMenu   |                         |      CV Document Paper      |
|  - Diseño & Tipografía      |                         |  - 1-Col ATS (max 840px)    |
|  - Espaciado & Márgenes     |                         |  - 2-Col Visual (max 1024px)|
|  - Exportación & PDF        |                         |  - Dynamic CSS Variables    |
|  - Idiomas & Traducción     |                         |  - @dnd-kit Sortable Lists  |
+-----------------------------+                         +--------------+--------------+
                                                                       |
                                                                       v
                                                        +-----------------------------+
                                                        | Section & Item Registry     |
                                                        |  - BaseSection / BaseItem   |
                                                        |  - Polymorphic Item Adapters|
                                                        |  - Obsidian Callout Tooltips|
                                                        +--------------+--------------+
                                                                       |
                                                                       v
                                                        +-----------------------------+
                                                        | Isolated Static HTML Engine |
                                                        |  - Zero Editor Artifacts    |
                                                        |  - break-inside: avoid !imp |
                                                        |  - Dynamic 2 A4 Auto-Scale  |
                                                        +-----------------------------+
```

## Feature Inventory
Every feature from the survey and requirements is assigned to a milestone:

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Global Font Selector | Support 5 curated fonts (Poppins, Inter, Roboto, Merriweather, JetBrains Mono) with instant real-time cascade | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Typography Scale & Line-Height | Real-time independent `--font-scale` (0.85-1.25) and `--line-height` (1.25-1.85) dynamic variables | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Independent Spacing Controls | Real-time independent `--page-padding`, `--section-gap`, and `--item-gap` dynamic CSS variables | M1 | ORIGINAL_REQUEST §R1 |
| 4 | State & Persistence Schema | Backward-compatible state schema extension with localStorage persistence across browser reloads | M1 | ORIGINAL_REQUEST §R1 |
| 5 | ATS 1-Column Layout Overhaul | Expansive standard document container (max-width 840px, centered, optimal visual balance and linear ATS flow) | M2 | ORIGINAL_REQUEST §R2 |
| 6 | 1-Col / 2-Col Toggle Integrity | Seamless switching between 1-column and 2-column mode preserving section columns and item order | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Forgiving DnD Ergonomics | Generous grab handles, clear hover affordances, section/item hover zones, smooth ghost overlays, drop indicators | M3 | ORIGINAL_REQUEST §R3 |
| 8 | Extensible Registry & Base Components | BaseSection & BaseItem architecture with polymorphic item adaptation and protected profile header | M3 | ORIGINAL_REQUEST §R3 |
| 9 | Obsidian Callouts & Tooltip Bounds | Strict Obsidian Callout styling with `lucide-react` icons, 0 unicode emojis, and dynamic bounding-rect clamping | M3 | ORIGINAL_REQUEST §R4 |
| 10 | Strict Zero-Split PDF Printing | Enforce `break-inside: avoid !important; page-break-inside: avoid !important;` on all `.cv-section` and `.cv-block` | M4 | ORIGINAL_REQUEST §R4 |
| 11 | Static HTML Print Generator | `generateCleanPrintHTML` stripping 100% editor UI elements with complete dynamic CSS variable injection | M4 | ORIGINAL_REQUEST §R4 |
| 12 | Dynamic 2 A4 Auto-Scaling | Auto-calculate height and shrink scale factor (clamped at floor 0.75) to fit strictly within 2 A4 pages | M4 | ORIGINAL_REQUEST §R4 |
| 13 | Categorized ActionMenu Toolbar | Consolidate ActionMenu into floating categorized toolbar (Diseño & Tipografía, Espaciado, Exportación, Idiomas) | M5 | ORIGINAL_REQUEST §R6 |
| 14 | CV Data Schema & I18n Fidelity | Preserve 100% of underlying CV data schema, contact fields, and bilingual dictionary translation integrity | M5 | ORIGINAL_REQUEST §R6 |
| 15 | Automated DOM E2E Test Suite | 4-Tier requirement-driven test suite (Tiers 1-4: Feature, Boundary, Pairwise, Real-World) with Vitest/RTL | E2E_TEST_TRACK | ORIGINAL_REQUEST §R5 |
| 16 | Adversarial QA & Coverage Hardening | White-box stress testing, DOM geometry audit, and coverage hardening (Tier 5) | FINAL_MILESTONE | ORIGINAL_REQUEST §R5 |

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Automated DOM Test Suite (Tiers 1-4), Test Infra, TEST_READY.md | none | DONE |
| M1 | Typography & Spacing Engine | Features 1, 2, 3, 4: Font selector, font-scale, line-height, spacing variables, schema & persistence | none | DONE |
| M2 | ATS 1-Column Layout Overhaul | Features 5, 6: 840px centered container, desktop grid fix, 1-col/2-col toggle fidelity | M1 | DONE |
| M3 | DnD Ergonomics & Registry | Features 7, 8, 9: Drag handles, ghost overlays, drop indicators, polymorphic registry, Obsidian callouts | M1, M2 | DONE |
| M4 | Zero-Split PDF & Auto-Scaling | Features 10, 11, 12: `break-inside: avoid !important`, `generateCleanPrintHTML` token fix, 0.75 floor scale | M1, M2 | DONE |
| M5 | Categorized ActionMenu & Data Integrity | Features 13, 14: Categorized toolbar tabs/popovers, bilingual translation, data schema preservation | M1, M2, M3, M4 | DONE |
| FINAL | E2E Pass & Adversarial QA Hardening | Phase 1: 100% Pass on Tiers 1-4. Phase 2: Tier 5 Adversarial QA Review & DOM Verification | E2E, M1-M5 | DONE |

## Interface Contracts

### `CVContext` State ↔ Components & Storage
- `cvData.layout`:
  ```typescript
  interface CVLayout {
    type: '1-column' | '2-column';
    leftBg: string;
    rightBg: string;
    fontFamily: 'Poppins' | 'Inter' | 'Roboto' | 'Merriweather' | 'JetBrains Mono';
    fontScale: number; // 0.85 to 1.25
    lineHeight: number; // 1.25 to 1.85
    pagePadding: number; // 0 to 60 px
    sectionGap: number; // 0 to 50 px
    itemGap: number; // 0 to 30 px
  }
  ```
- `updateLayout(key: keyof CVLayout, value: any): void`
- `updateProfile(key: string, value: string): void`
- `updateSection(sectionId: string, updatedSection: object): void`
- `deleteSection(sectionId: string): void` (guarded against `profile_header`)

### Static HTML Print Engine Contract
```typescript
function generateCleanPrintHTML(cvData: CVData): string;
function calculatePrintScale(renderedHeightPx: number): number; // Returns 1.0 if <= 2246px; otherwise clamped to [0.75, 1.0]
function executeCleanPrint(cvData: CVData): Promise<void>;
```

## Code Layout
- `src/context/CVContext.jsx`: Core document state, layout tokens, history, and persistence.
- `src/utils/schema.js`: Default schema definitions, section validators, and layout defaults.
- `src/utils/staticHtmlPdfEngine.js`: Isolated static HTML generator, print styles, and auto-scaler.
- `src/registry/sectionRegistry.js`: Extensible section/item descriptors and polymorphic adapters.
- `src/components/Editor/ActionMenu.jsx`: Categorized floating toolbar with slider popovers and action buttons.
- `src/components/Editor/SuggestionTooltip.jsx`: Obsidian Callout standard tooltip with `lucide-react`.
- `src/components/Editor/DragHandle.jsx`: Section and item grab handles with hover affordances.
- `src/components/CV/BaseSection.jsx`: Base section wrapper with drag listeners and inline title edit.
- `src/components/CV/BaseItem.jsx`: Base item wrapper with polymorphic component delegation.
- `src/index.css`: Global styles, CSS variables cascade, layout grid/flex rules, and print styles.
- `src/tests/`: Automated DOM test suites covering all tiers and interaction scenarios.
