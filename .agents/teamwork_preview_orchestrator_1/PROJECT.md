# Project: Ressume CV Editor Upgrade

## Architecture
- **Framework**: React 18 + Vite
- **State Management**: React Context (`CVContext.jsx`) with `localStorage` persistence
- **Layout Engine**: 2-Column and 1-Column responsive CSS Grid with dynamic CSS custom properties (`--page-padding`, `--section-gap`, `--item-gap`)
- **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (nested sortables + column droppables)
- **Component Registry**: Declarative `sectionRegistry` defining section schema descriptors, polymorphic adapters, and rendering components via `BaseSection` and `BaseItem`
- **Iconography**: Standardized `lucide-react` icons for UI/callouts with Obsidian Callout theme compliance; BoxIcons preserved for contact/external links
- **PDF & Print Engine**: Dedicated state-to-HTML generator `generateCleanPrintHTML(cvData)` with strict CSS page-break prevention (`break-inside: avoid`), max 2 A4 page auto-scaling, and isolated iframe / Puppeteer rendering

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| 1 | Spacing Controls & Persistence | Real-time controls in ActionMenu for `--section-gap`, `--item-gap`, `--page-padding`, persisted in localStorage and fixed main.jsx initialization | M1 | ORIGINAL_REQUEST §R1 | DONE |
| 2 | Polymorphic Cross-Column DND | @dnd-kit column droppables, cross-column interchangeability for sections and items, empty container drop handling, profile_header guards | M2 | ORIGINAL_REQUEST §R2 | DONE |
| 3 | Extensible Section & Item Registry | BaseSection / BaseItem registry and factory architecture for zero-boilerplate section and item definitions | M3 | ORIGINAL_REQUEST §R3 | DONE |
| 4 | Lucide-react Icon Migration | Obsidian Callout standard icons & colors, emoji cleanup in SuggestionTooltip & modals, BoxIcons check | M4 | ORIGINAL_REQUEST §R4 | DONE |
| 5 | Static HTML PDF & 2-Page Auto-Scaler | generateCleanPrintHTML, super-container break-inside rules, dynamic scale-down to max 2 A4 pages, iframe print & backend PDF update | M5 | ORIGINAL_REQUEST §R5 | DONE |
| 6 | E2E Acceptance & Adversarial Hardening | Pass 100% of E2E test suite (Tiers 1-4) + white-box adversarial coverage hardening (Tier 5) | M-FINAL | Project Pattern | DONE |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Dynamic Margins & Spacing Controls | Schema defaults, CSS variables, ActionMenu sliders, localStorage fix | none | DONE |
| M2 | Polymorphic Cross-Column DND | Column droppables, cross-column section & item drops, item adapter integration | M1 | DONE |
| M3 | Extensible Component & Section Registry | BaseSection, BaseItem, sectionRegistry.js, item components refactoring | M2 | DONE |
| M4 | Lucide-react Iconography Migration | SuggestionTooltip, Obsidian callout rules, modals emoji migration, BoxIcons check | M3 | DONE |
| M5 | Dedicated Static HTML PDF Rendering Core | generateCleanPrintHTML, 2-page auto-scaling, print execution, Puppeteer update | M3 | DONE |
| M-FINAL | E2E Test Suite Pass & Adversarial Hardening | 100% pass on Tiers 1-4 (104 tests across 9 suites), adversarial stress verification | M1, M2, M3, M4, M5 | DONE |

## Interface Contracts

### M1: Spacing State & CSS Variables
- `cvData.layout`: `{ type: '1-column' | '2-column', leftBg: string, rightBg: string, pagePadding: number, sectionGap: number, itemGap: number }`
- Defaults: `pagePadding: 24`, `sectionGap: 20`, `itemGap: 8` (units: px)
- CSS variables injected on `#area-cv`:
  - `--page-padding: ${pagePadding}px`
  - `--section-gap: ${sectionGap}px`
  - `--item-gap: ${itemGap}px`

### M2 & M3: Section Registry & Polymorphic Adapter
- Registry Entry Schema (`sectionRegistry.js`):
  ```javascript
  {
    type: string,
    label: string,
    defaultTitle: string,
    defaultColumn: 'left' | 'right',
    allowDelete: boolean,
    allowAddItem: boolean,
    containerTag: 'div' | 'ul',
    containerClass: string,
    itemComponent: React.ComponentType,
    createDefaultItem: (index?: number) => object,
    adaptItem: (sourceItem: object) => object,
    schema: object
  }
  ```
- `adaptItemToSectionType(sourceItem, targetSectionType)`: Deterministic mapping of fields (`title`, `subtitle`, `description`, `date`, `link`, `bullets`, `name`, `level`).

### M4: Obsidian Callouts & Iconography
- Callout Variants (strict `AGENTS.md` standard):
  - **Danger / Critical**: `OctagonAlert`, bg: `rgba(233, 49, 71, 0.1)`, border: `4px solid rgba(233, 49, 71, 1)`, title: `rgba(233, 49, 71, 1)`
  - **Caution / Warning**: `TriangleAlert`, bg: `rgba(219, 139, 0, 0.1)`, border: `4px solid rgba(219, 139, 0, 1)`, title: `rgba(219, 139, 0, 1)`
  - **Info**: `Info`, bg: `rgba(8, 109, 221, 0.1)`, border: `4px solid rgba(8, 109, 221, 1)`, title: `rgba(8, 109, 221, 1)`
  - **AI Header**: `Sparkles` icon with "AI Suggestions" title
- BoxIcons: `bx bx-*` and `bx bxl-*` preserved for contact / external links.

### M5: Static HTML PDF Engine
- `generateCleanPrintHTML(cvData)`: Clean HTML5 document with embedded styles, fonts, and semantic markup.
- `calculatePrintScale(contentHeight)`: Auto-scales down to fit 2 A4 pages (`2246px`) with a strict `0.75` floor limit.
- `executeCleanPrint(cvData)`: Creates hidden iframe, applies auto-scale, triggers print, cleans up iframe.

## Code Layout
```
src/
├── components/
│   ├── CV/
│   │   ├── BaseSection.jsx          # Registry-backed section container
│   │   ├── BaseItem.jsx             # Registry-backed item wrapper (drag, del, hover)
│   │   ├── CVSection.jsx            # Composite section entry
│   │   ├── CVBlock.jsx              # Composite item entry
│   │   └── items/                   # Concrete item renderers
│   │       ├── ExperienceItem.jsx
│   │       ├── EducationItem.jsx
│   │       ├── SkillsItem.jsx
│   │       ├── SimpleListItem.jsx
│   │       ├── AboutItem.jsx
│   │       └── ProfileHeaderItem.jsx
│   └── Editor/
│       ├── ActionMenu.jsx           # Spacing sliders & layout controls
│       ├── SuggestionTooltip.jsx    # Obsidian-standard callouts with Lucide icons
│       ├── AIExportModal.jsx        # Lucide icon modal
│       └── TranslationModal.jsx     # Lucide icon modal
├── context/
│   └── CVContext.jsx                # Global state with spacing & column handlers
├── registry/
│   └── sectionRegistry.js           # Declarative section & item registry
├── utils/
│   ├── schema.js                    # Default schema with layout spacing
│   ├── itemAdapter.js               # Polymorphic cross-column data adapter
│   └── staticHtmlPdfEngine.js       # Standalone static HTML print generator & scaler
└── tests/                           # Vitest E2E & unit test suites (9 suites, 104 tests)
    ├── setup.js
    ├── spacing.test.jsx
    ├── polymorphic-dnd.test.jsx
    ├── registry.test.jsx
    ├── iconography.test.jsx
    ├── staticHtmlPdfEngine.test.js
    ├── pairwise-interactions.test.jsx
    ├── e2e-scenarios.test.jsx
    ├── challenger-stress-suite.test.jsx
    └── adversarial-challenger.test.jsx
```
