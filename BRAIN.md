# BRAIN.md — Ressume Project Knowledge Dump

> **What is this file?**  
> This is the complete project brain: every architectural decision, every
> milestone, every known issue, every unresolved debt, and every future path.
> If a new developer — or an AI agent — must understand this system in one
> document, this is it.  
> Last updated: September 2026.

---

## Table of Contents

1. [What Is Ressume?](#1-what-is-ressume)
2. [The One-Line Summary](#2-the-one-line-summary)
3. [Technology Stack Decision Log](#3-technology-stack-decision-log)
4. [Architecture — Current State (Post-Refactor)](#4-architecture--current-state-post-refactor)
5. [The Data Model](#5-the-data-model)
6. [Section Registry — The Core Pattern](#6-section-registry--the-core-pattern)
7. [The Pagination Engine](#7-the-pagination-engine)
8. [The PDF Print Engine — Pixel Parity](#8-the-pdf-print-engine--pixel-parity)
9. [The AI Layer](#9-the-ai-layer)
10. [Localization & i18n](#10-localization--i18n)
11. [The Version Manager](#11-the-version-manager)
12. [The Drag & Drop System](#13-the-drag--drop-system)
13. [Test Infrastructure](#13-test-infrastructure)
14. [Complete Feature Timeline](#14-complete-feature-timeline)
15. [Known Technical Debt](#15-known-technical-debt)
16. [Hard Invariants (Never Break These)](#16-hard-invariants-never-break-these)
17. [Coupling Map & Refactoring Routes](#17-coupling-map--refactoring-routes)
18. [Future Features — Not Yet Planned](#18-future-features--not-yet-planned)
19. [Dependency Decision Log](#19-dependency-decision-log)
20. [Git Commit History Summary](#20-git-commit-history-summary)

---

## 1. What Is Ressume?

Ressume is a **single-page, client-only, offline-capable CV editor** built
with React 18 and Vite. It produces a professional A4-format curriculum vitae
that can be:

- Edited interactively in real-time (WYSIWYG)
- Exported as a pixel-perfect PDF via the browser's native print pipeline
- Exported as a semantically rich Markdown document for use with AI models
- Translated into multiple languages with an AI-assisted workflow
- Managed as named versioned snapshots with visual thumbnails

**No backend. No account required. No data leaves the browser.**

The system stores all data in `localStorage`. A future migration path to a
cloud backend is architecturally planned but not yet implemented.

---

## 2. The One-Line Summary

> *A React-based CV editor with a page-break engine that guarantees pixel-perfect
> 1:1 parity between the live editor and the exported PDF, backed by a
> Factory+Strategy+Template architecture that allows adding new section types,
> languages, and AI prompts without touching any core component.*

---

## 3. Technology Stack Decision Log

| Decision | Choice | Reason | Alternatives Rejected |
|----------|--------|--------|-----------------------|
| **UI Framework** | React 18 | Industry standard, hooks ecosystem, excellent DnD library support | Vue (smaller DnD ecosystem), Solid.js (smaller community) |
| **Build Tool** | Vite 5 | Instant HMR, native ESM, fast production builds | Create React App (deprecated), Webpack (slower DX) |
| **DnD Library** | `@dnd-kit` | 2-level nested DnD, keyboard accessibility, no collision with Virtual DOM | `swapy` (slot ID collisions in React nested trees — **banned by AGENTS.md**), `react-beautiful-dnd` (maintenance mode), HTML5 DnD API (no keyboard support) |
| **Icons** | `lucide-react` | Tree-shakeable SVG components, no CDN, no render-blocking, offline-safe | BoxIcons (required CDN link — removed in M1 refactor), Heroicons (limited set), FontAwesome (CSS font, ATS-unfriendly) |
| **Testing** | Vitest + @testing-library/react | Vite-native, same transforms, fast, jsdom included | Jest (slower cold start, Babel config overhead), Playwright (overkill for unit/integration) |
| **Storage** | localStorage | Zero-dependency, offline, no auth required | IndexedDB (complex API), Supabase (requires backend), Firebase (vendor lock-in) |
| **State Management** | React Context + custom hooks | Sufficient for this scale, no extra dependency | Zustand (unnecessary for current complexity), Redux (over-engineered), Jotai |
| **CSS Approach** | CSS Custom Properties + BEM | Theming via variables, no runtime CSS-in-JS overhead, ATS-safe in print | Tailwind (requires PostCSS, print utilities weak), CSS Modules (no global theming), styled-components (runtime overhead) |
| **PDF Generation** | Browser native print (`window.print()`) | 100% vectorial, text selectable, hyperlinks live, no canvas rasterization | `html2canvas` (rasterized PNG — **banned**), `pdfkit` (no CSS support), Puppeteer (requires server) |
| **Joyride/Onboarding** | `react-joyride` | Step-by-step tour without custom overlay infrastructure | Custom implementation (too much code), Shepherd.js (heavier) |

---

## 4. Architecture — Current State (Post-Refactor)

The system follows a layered architecture with strict unidirectional data flow:

```
┌─────────────────────────────────────────────────────┐
│                     App.jsx                         │
│  (DnD Coordinator + Column Layout + Hook Composer)  │
└──────────────────┬──────────────────────────────────┘
                   │ useCV() — 48-member API
┌──────────────────▼──────────────────────────────────┐
│                  CVContext.jsx (Facade)              │
│  Composes: useCVData, useCVHistory, useCVLayout,    │
│            useCVExport                              │
└──────────────────┬──────────────────────────────────┘
                   │ cvData, mutations
┌──────────────────▼──────────────────────────────────┐
│            BaseSection.jsx (Template)               │
│  Reads section descriptor from registry             │
│  Renders: title, items, drag handle, action buttons │
└──────────────────┬──────────────────────────────────┘
                   │ descriptor.itemComponent (Strategy)
┌──────────────────▼──────────────────────────────────┐
│             BaseItem.jsx (Template)                 │
│  Wraps: DnD sortable, add/delete buttons, spacer    │
└──────────────────┬──────────────────────────────────┘
                   │ itemComponent prop
┌──────────────────▼──────────────────────────────────┐
│    ExperienceItem / EducationItem / SkillsItem / …  │
│               (Concrete Strategies)                 │
│  PrintView:  static, no controls                   │
│  EditView:   InlineEdit, bullet DnD, add/delete     │
└─────────────────────────────────────────────────────┘
```

### Patterns in use

| Pattern | Where | Purpose |
|---------|-------|---------|
| **Factory** | `sectionRegistry.js / registerSectionType()` | Creates section descriptors; provides `createDefaultItem()` factories |
| **Strategy** | `descriptor.itemComponent` | Each section type has its own rendering strategy; BaseItem is the context |
| **Template Method** | `BaseSection.jsx`, `BaseItem.jsx` | Fixed structure; variable steps delegated to descriptors |
| **Facade** | `CVContext.jsx` | Hides 4 internal hooks behind a single `useCV()` hook |
| **Pure Distribution** | `useDocumentPages.js` / `pageDistributor.js` | Deterministically maps CV data to discrete A4 page models |
| **Command** | `useCVHistory` undo/redo stack | Applies state mutations via `applyStateWithHistory` |

---

## 5. The Data Model

The canonical shape is defined in `src/utils/schema.js` as `defaultSchema`:

```
cvData {
  layout: {
    type: '2-column' | '1-column'
    isAtsMode: boolean
    leftBg: string (CSS color)
    rightBg: string (CSS color)
    leftColumnWidth: number | null (percentage, null = 33%)
    fontFamily: 'Poppins' | 'Inter' | 'Roboto' | 'Merriweather' | 'JetBrains Mono'
    fontScale: 0.85–1.25
    titleScale: 0.80–1.40
    bodyScale: 0.80–1.30
    listScale: 0.80–1.30
    lineHeight: 1.25–1.85
    pagePadding: number (px, default 24)
    sectionGap: number (px, default 20)
    itemGap: number (px, default 8)
  }
  profile: {
    name: string  (legacy — mirrored in profile_header section item)
  }
  sections: [
    {
      id: string (unique, e.g. "experience_1")
      type: 'profile_header' | 'about' | 'experience' | 'education' | 'skills'
            | 'projects' | 'certificates' | 'languages' | 'volunteering'
            | 'spacer' | 'list' | 'simple_list' | 'mentoring' | (custom)
      column: 'left' | 'right'
      title: string
      bottomSpacing: number (px, default 0)
      bulletStyle?: { size, variant, showLine }
      height?: number  (spacer sections only)
      backgroundColor?: string  (spacer sections only)
      items: [
        {
          id: string (unique)
          // Type-specific fields — vary by section type
          // Common: title, subtitle, date, description, link, bullets[]
          // Profile header: name, subtitle, location, email, phone, linkedin, github, contacts[]
          // Skills: name (string), level (number 0-100)
          // Spacer: no items (height is on the section)
        }
      ]
    }
  ]
}
```

**Validation:** `src/utils/versionValidator.js` `sanitizeAndValidateCVSnapshot()`
is the canonical validator. It merges with `defaultSchema` for forward compatibility.

**Storage keys (localStorage):**
- `cvData` — Active CV document (JSON string)
- `cvLanguagePacks` — Per-language content dictionaries (JSON string)
- `cvActiveLanguage` — Current language code (`'es'` | `'en'` | ...)
- `cv_versions` — Named snapshot array (JSON string) — managed by `versionStorage.js`

---

## 6. Section Registry — The Core Pattern

`src/registry/sectionRegistry.js` is the single source of truth for all
section types. It is a `Map<string, SectionDescriptor>`.

### SectionDescriptor interface

```typescript
interface SectionDescriptor {
  type: string                        // Unique identifier
  defaultTitle: string                // Default section heading
  sectionClass: string                // CSS class for the <section> element
  containerTag: 'div' | 'ul'         // Wrapper tag for items list
  containerClass: string             
  itemTag: 'div' | 'li'
  itemClass: string
  hasTitle: boolean                   // Shows section title bar
  hasItemDrag: boolean                // Items are reorderable
  allowDelete: boolean                // Section can be deleted
  allowAddItem: boolean               // Items can be added
  allowDeleteItem: boolean            // Items can be individually deleted
  supportsBulletCustomization: boolean
  itemComponent: React.ComponentType  // Strategy — renders each item
  createDefaultItem: () => Object    // Factory — creates empty item
  adaptItem: (item: Object) => Object // Adapter — converts from another type
  renderMarkdown: (item: Object) => string
  renderXML: (item: Object) => string
  renderPlainText: (item: Object) => string
  itemStyle?: React.CSSProperties
  printItemStyle?: React.CSSProperties
  sectionComponent?: React.ComponentType  // Override entire section rendering
}
```

### Registering a type

```js
registerSectionType(descriptor);      // Add to registry
getSectionDescriptor(type);           // Retrieve (falls back to 'experience' if unknown)
getAllSectionDescriptors();            // Array of all registered descriptors
```

### The alias: `'list'` → `'experience'`

For historical reasons, `type: 'list'` is aliased to `type: 'experience'` inside
`getSectionDescriptor()`. Any custom list-style section created through the UI
receives `type: 'list'`, which then resolves to the `experience` descriptor.
This is intentional and must not be removed.

### Built-in section types

| Type | Descriptor | Notable |
|------|-----------|---------|
| `profile_header` | ProfileHeaderItem | Protected; cannot be deleted; always first |
| `about` | (inline in registry) | Single-item description only |
| `experience` | ExperienceItem | Has nested bullet DnD |
| `education` | EducationItem | Date + institution fields |
| `skills` | SkillsItem | Name + level (0-100) |
| `projects` | ProjectsItem | Has link field + nested bullets |
| `certificates` | CertificatesItem | Issuer + date |
| `languages` | LanguagesItem | Language + proficiency |
| `volunteering` | VolunteeringItem | Has nested bullets |
| `spacer` | SpacerBlock | Height-only, no items |
| `list` | (aliased → experience) | Generic list sections |
| `simple_list` | SimpleListItem | Ultra-minimal: name only |
| `mentoring` | MentoringItem | Added as extensibility smoke-test |

---

## 7. The Discrete Page Distribution & A4 Layout Architecture (Invariants 15 & 16)

The pagination architecture solves the core product problem: **guaranteeing 1:1 pixel parity between editor and PDF print output without heuristic in-flight DOM mutations**.

Following **Rule 15** and **Rule 16** of `AGENTS.md`:
- **Editor-Native Discrete A4 Boxes**: The editor (`#area-cv`) is composed of a list of discrete, closed `<A4PageBox pageNumber={N}>` containers (`210mm x 297mm`, `overflow: hidden`). Continuous canvas layouts and simulated dotted fold lines are strictly forbidden.
- **Fixed Structure Carved in Stone**: Page assignment is calculated deterministically at the React state level by `pageDistributor.js`. If a block does not fit in Page 1, it belongs to the Page 2 container. The print engine never performs dynamic reflow or heuristic cuts. WYSIWYG absolute.

### Key files

- `src/constants/geometry.js` / `src/utils/pageGeometry.js` — Dimensions (`A4_WIDTH_PX = 794`, `A4_PAGE_HEIGHT_PX = 1123`, `EDITOR_HEIGHT_REDUCTION_MM = 25`, `EDITOR_PAGE_HEIGHT_MM = 272`).
- `src/utils/pageDistributor.js` — Pure deterministic algorithm partitioning sections and items into discrete pages based on content height budgets.
- `src/hooks/useDocumentPages.js` — React hook wrapping `pageDistributor.js` with reactive updates based on `cvData`.
- `src/components/CV/A4PageBox.jsx` — Visual and physical A4 container component rendering individual pages with independent column layouts and background extensions.
- `src/services/print/` — Modular print suite: `pdfTitleService.js`, `cleanHtmlGenerator.js`, `printExecutionDriver.js`.

### How it works

1. **Standard ISO 216 Geometry**: Dimensions are centralized in `src/constants/geometry.js`. In print: 210mm x 297mm (794px x 1123px at 96 DPI). In the editor: 272mm content budget (`EDITOR_HEIGHT_REDUCTION_MM = 25`) to prevent false-fit overflow.
2. **Deterministic Partitioning (`pageDistributor.js`)**: Calculates the height of sections and items based on typography and line-height tokens, placing items sequentially across discrete page models.
3. **Discrete Page Rendering (`<A4PageBox>`)**: Rendered directly in `App.jsx` (`pages.map(pageModel => <A4PageBox ...>)`). In 2-column mode, left and right columns run independently inside each box.
4. **Zero Reflow on Print**: The print engine projects the exact discrete DOM tree produced by the editor.


---

## 8. The PDF Print Engine — Pixel Parity (cloneNode Architecture)

**Invariant**: The exported PDF must be pixel-for-pixel identical to the editor
at the moment of export. Zero CSS drift allowed.

### 8.1 The Evolution: From Synthetic Dual-Tree to DOM Mirroring (`cloneNode`)

Historically, the engine used a **synthetic dual-tree pipeline**: `generateCleanPrintHTML()`
re-rendered the CV from state using `renderToStaticMarkup(React.createElement(PrintBaseSection, ...))`
and string concatenation. This caused inevitable discrepancies (different bullet DOM structures,
regex mutations of layout classes like `.editable-section-container`, and arbitrary `body.style.zoom`).

### 8.1 Modular Decomposition (`src/services/print/`)

The print pipeline is cleanly decomposed into specialized single-responsibility services:

```
src/services/print/
├── index.js                    # Public API façade (executeCleanPrint, generateCleanPrintHTML, etc.)
├── pdfTitleService.js          # Dynamic file naming from CV profile (e.g. CV_Juan_Perez_Senior_Engineer.pdf)
├── cleanHtmlGenerator.js       # Sanitized DOM clone builder, CSS variable generator, and static HTML fallback
└── printExecutionDriver.js     # Hidden <iframe> orchestration, font readiness, and native window.print()
```

### 8.2 The DOM Mirroring (`cloneNode`) Pipeline

```
User clicks "Export PDF" / ActionMenu
  → executeCleanPrint(cvData, lang)
  → Checks for live #area-cv element in DOM
  → createSanitizedPrintClone(liveAreaCv)
      1. cloneNode(true): Deep memory clone of live rendered DOM
      2. UI Scrubber: Removes [data-editor-ui="true"] and .no-print elements
      3. Placeholder Scrubber: Removes [data-is-empty="true"] and .inline-edit-placeholder
      4. Focus/Editable Scrubber: Cleans contenteditable and .inline-edit-active outlines
      5. Geometry Scrubber: Preserves exact discrete .a4-page-box boxes with overflow: hidden
  → Writes clean HTML to offscreen <iframe> with:
      - cv-base-styles (index.css)
      - cv-print-styles (print.css with @media print rules)
      - Transfer of CSS custom properties (--*) from live #area-cv to doc.documentElement
  → Waits for doc.fonts.ready
  → iframe.contentWindow.print()
```

### 8.3 The `data-editor-ui="true"` Standard

All editor-only controls (handles, resize bars, action buttons, popovers, guides) now carry
`data-editor-ui="true"`. The `createSanitizedPrintClone` utility automatically purges any element
with `[data-editor-ui="true"]` or `.no-print`.

### 8.4 Print Stylesheet Philosophy (`src/styles/print.css`)

- Uses native CSS Paged Media:
  - `@page { size: A4; margin: 0; }`
  - `print-color-adjust: exact !important;`
  - `.a4-page-box` maintains strict `210mm x 297mm`, `page-break-after: always;` / `break-after: page;`
  - Base rule: `break-before: auto` by default across sections and blocks.
  - Avoid rule: First children of columns/containers have `break-before: avoid !important;` to prevent leading blank pages.
  - Section-level: `.cv-section` has `break-inside: auto` to allow multi-item sections to paginate naturally.
  - Block-level: `.cv-block, .experience__content, .education__content, ...` have `break-inside: avoid !important;` to prevent awkward splitting of atomic items.
  - Terminal margin suppression: `.cv-section:last-child { margin-bottom: 0 !important; }` prevents trailing whitespace from spawning empty trailing pages.

### 8.5 Fallback Path (Headless / JSDOM)

When `document.getElementById('area-cv')` is not available (e.g. headless tests or SSR),
`executeCleanPrint` falls back to `generateCleanPrintHTML(cvData, lang)` to construct
the markup synthetically.

---

## 9. The AI Layer

The AI layer has two distinct subsystems:

### 9.1 Pre-computed Suggestion Engine (`src/ai-knowledge/`)

Zero-latency, zero-LLM suggestions shown as Obsidian Callout tooltips.

```
getAISuggestions(target_section, target_layout, trigger_context, target_industry)
  → Filters ALL_RULES array (ats.json + human.json + tech.json + business.json + creative.json)
  → Returns matching Rule[]
```

Each rule has: `id, target_section, target_layout, target_industry, trigger_context,
suggestion_title, suggestion_body, severity`.

**Domain restriction (AGENTS.md §4):** Only `tech` and `all` domains are active.
`business` and `creative` rules exist in the files but are reserved for future phases.

### 9.2 AI Prompt Export System (`src/utils/aiExporter.js` + `src/components/Editor/AIExportModal.jsx`)

Generates a ready-to-paste prompt payload for ChatGPT/Claude/Gemini.

```
buildAIPromptPayload(cvData, promptId, options)
  → Finds prompt definition in locales/*.prompts.json
  → exportToAIMarkdown(cvData)  → Rich Semantic Markdown with YAML Frontmatter
  → Assembles: role + task + output_format + [user_commentary] + [job_description] + CV Markdown
```

**Prompt catalog (11 prompts as of Sep 2026):**

| ID | Name | Category |
|----|------|---------|
| `recruiter_audit` | Auditoría ATS (17 Puntos) | recruiter_audit |
| `job_matcher` | Job Description Matcher | customization |
| `star_enhancer` | Potenciador STAR / Google XYZ | content_enhancement |
| `technical_interview` | Simulador Entrevista Técnica | interview_prep |
| `translate_english` | Traducción & Localización US Tech | localization |
| `layout_advisor` | Asesor Jerarquía Visual | layout_advice |
| `system_design_simulator` | Entrevista Diseño de Sistemas | interview_prep |
| `live_coding_coach` | Entrenamiento Live Coding | interview_prep |
| `behavioral_leadership_prep` | Entrevista Conductual FAANG | interview_prep |
| `career_upskilling_roadmap` | Hoja de Ruta Upskilling | career_strategy |
| `cold_outreach_generator` | Playbook Networking LinkedIn | networking |
| `salary_negotiation_advisor` | Estrategia Salarial Tech | career_strategy |

**The `user_commentary` field (added Sep 2026):**
Optional free-text textarea in the modal that appends personalized instructions
to any prompt. Appears as `user_commentary: ...` in the payload.

**The `job_description` field:**
Only shown when the selected prompt's `required_inputs` includes `"job_description"`.
Currently only `job_matcher` requires it.

**Translation prompt special behavior:**
When `translate_english` is selected, the payload also injects a compact JSON
of the `cvData` schema so the AI can return a translated JSON directly importable
into the Version Manager.

### 9.3 The Semantic Markdown Abstraction

`exportToAIMarkdown(cvData)` generates a Markdown document with a rich YAML
frontmatter that encodes:
- Layout type, column order, reading direction
- Typography: fontFamily, fontScale, titleScale, bodyScale, lineHeight
- Spacing: pagePadding, sectionGap, itemGap
- Colors: leftBg, rightBg
- Complete contact info and section order

This Markdown is the canonical "source of truth" sent to AI models instead of
the binary PDF. ATS parsers that receive the Markdown get a perfectly structured,
column-ambiguity-free representation of the CV.

---

## 10. Localization & i18n

### What is localized

| File | Contents |
|------|----------|
| `locales/*/content.json` | Default CV content (placeholder text) |
| `locales/*/prompts.json` | AI prompt catalog (system_instruction, task, output_format) |
| `locales/*/rules.json` | Grammar and writing rules for ATS suggestions |
| `locales/*/ui.json` | UI labels (button text, modal titles, error messages) |

### How it works

1. `useCVData.js` manages `activeLanguage` (stored in `localStorage`)
2. `switchLanguage(lang)` applies a locale's `content.json` dictionary to the
   active CV data via `applyDictionaryToCVState(cvData, dict)`
3. `extractDictionaryFromCV(cvData)` extracts the reverse: current CV text → dictionary
4. `translationEngine.js` handles prompt generation and AI response parsing for
   manual translations

### Adding a new language

See `CONTRIBUTING.md §5`. Requires 4 JSON files + 2 lines in `locales/index.js`.

### Known limitation

The CV sections' `title` fields are editable freetext and are NOT automatically
retranslated when `switchLanguage()` is called unless the `content.json` dictionary
includes an entry for that exact title. This is a known UX gap.

---

## 11. The Version Manager

`src/components/Editor/VersionManagerModal.jsx` + `src/utils/versionStorage.js`

Named snapshots are stored as JSON blobs in localStorage under the `cv_versions` key.
Each version object:
```json
{
  "id": "v_1725000000000",
  "name": "Backend Developer v2",
  "createdAt": "2026-09-12T01:00:00.000Z",
  "thumbnail": "data:image/svg+xml;base64,...",
  "data": { /* full cvData snapshot */ }
}
```

**Thumbnail generation:** `thumbnailGenerator.js` generates a pure SVG (no canvas, no html2canvas)
that visually represents the CV layout: 2-column or 1-column, header area, and
section geometry. The SVG is stored as a Base64 data URL with the snapshot.

**Version import:** Any JSON string that passes `sanitizeAndValidateCVSnapshot()`
can be loaded as a version. This is the integration point for the AI translation
output: the AI returns a translated `cvData` JSON → user pastes it → it becomes
a new version.

---

## 12. The Drag & Drop System

2-level nested DnD via `@dnd-kit`:

**Level 1 — Section DnD** (App.jsx `DndContext`):
- Moves sections between `left` and `right` columns
- Reorders sections within each column
- Coordinator: `useCVDndCoordinator.js`
- Detects target column via droppable `DroppableColumn` components

**Level 2 — Item DnD** (BaseSection.jsx `SortableContext`):
- Reorders items within a section
- `verticalListSortingStrategy` for natural list reordering

**Level 3 — Bullet DnD** (SortableBulletItem.jsx nested `SortableContext`):
- Reorders bullet strings within an item
- Used by Experience, Projects, Volunteering

**Body-area dragging** (added in commit `022bb8a`):
Any non-text, non-button part of a component can initiate drag if held down.
`isNonDraggableTarget(element)` filters out text/input/button targets.
`createContainerDragListeners(listeners)` wraps @dnd-kit listener attributes
to support this behavior.

**Drag handles:**
Shifted left by: section `−1.25rem`, item `−1.15rem`, bullet `−0.75rem`.
This positions them outside the text area without obscuring content.

---

## 13. Test Infrastructure

**46 test files, 797 tests** as of September 2026.

### Test philosophy

Tests are structured in tiers of adversariality:

| Tier | File prefix | What it tests |
|------|------------|-------------|
| Smoke | `registry.test.jsx` | Registry invariants, descriptor completeness |
| Unit | `spacing.test.jsx`, `dom-geometry-typography.test.jsx` | Pure function accuracy |
| Component | `addButtonsAndResizerParity.test.jsx` | UI control rendering |
| Integration | `e2e-scenarios.test.jsx`, `version-manager-hub.test.jsx` | Cross-component flows |
| Adversarial | `challenger-*.test.jsx`, `adversarial-*.test.jsx` | Edge cases, extremes |
| Stress | `empirical-challenger-deep-audit.test.jsx` | Full scenario stress tests |
| Parity | `pixelParityEditorPrint.test.jsx`, `atsPrintModeFidelity.test.js` | PDF engine validation |

### Key mocks (src/tests/setup.js)

```js
window.print = vi.fn();
window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
window.focus = vi.fn();
URL.createObjectURL = vi.fn(() => 'blob:mock');
URL.revokeObjectURL = vi.fn();
```

### Running tests

```bash
npm test                              # All 797 tests
npx vitest run src/tests/specific     # One file
```

---

## 14. Complete Feature Timeline

Reconstructed from git history and session conversations:

| Commit / Session | Features |
|-----------------|---------|
| **Early commits** | Initial React + Vite setup, BEM CSS structure, BoxIcons CDN |
| `321efdc` | CSS and print fixes |
| `ea3a7c5` | Tutorial with persistent state and skip functionality |
| `68fc895` | Improved PDF parity and page break |
| `75baffb` | Major cleanup and rewrites |
| `520cc63` | Favicon added |
| `721edb2` | **Vertically resizable blank spacer component** (pixel-perfect PDF print) |
| `bae30e0` | Integrated 0px bottom spacer with edge resize handle |
| `02a9aab` / `0f2f144` | PDF parity WIP fixes |
| `6a93c36` | PDF parity improvements |
| `022bb8a` | **Drag & drop from any non-text body area** of elements |
| `3fec98b` | **Template+Factory pattern refactor** (M1–M5): SortableBulletItem deduplication, BaseItem/BaseSection zero if-guards, CVContext 728→125 lines facade, 4 hook decomposition, MentoringItem smoke-test — 634/634 tests |
| `119bc9f` | **Comprehensive architectural audit** (M1–M5): dead code cleanup, Lucide unification, modularization, production documentation in `docs/` |
| `216ae63` | Removed residual CTRL+P CSS rules |
| `0e32626` | **`useBlankPageCleaner`** — reactive blank page elimination |
| `2e05198` | Refactor: Add bullet points component |
| `bff8451` | Simplified action menu |
| `2f978ee` | **AI Prompts Epic** (Teamwork): AIExportModal opinionated UX, exhaustive Markdown frontmatter, 6 new Tech job-search prompts, `user_commentary` field, JSON-output translation prompt, 797/797 tests |
| `Refactoring` | **Massive Technical Debt Audit & Modularization**: purged obsolete dumps/scripts, eliminated dead engines (`useBlankPageCleaner.js`, `usePaginationEngine.js`, `whitespaceNudgeReflow.js`), split `sectionRegistry.js` (1.127→196 lines, 18 descriptors), extracted `AppModals.jsx` and `DroppableColumn.jsx` from `App.jsx` (509→217 lines), introduced `PrintModeContext` ambient resolution (eliminating `isPrint` prop-drilling), modularized `VersionManagerModal.jsx` (1.314→442 lines), created declarative `cvSchemaValidator.js`, hardened and unit-tested `thumbnailGenerator.js` (5 tests) & `translationEngine.js` (24 tests), 1.108/1.108 tests passing (100% green) |

---

## 15. Known Technical Debt & Active Print Bugs (Branch: Re-do-total-de-impresion-PDF)

These are documented issues from recent commits and audits:

### Active Bugs in the `cloneNode` Print Engine (Commit `2fc0b8d`):

1. **Iframe Visibility Attribute Discrepancy**:
   - `executeCleanPrint` changed `iframe.style.visibility = 'hidden'` to `iframe.style.opacity = '0'; iframe.style.pointerEvents = 'none';`.
   - Unit tests expecting `expect(iframe.style.visibility).toBe('hidden')` fail in `challengerCleanPrintLifecycle.test.jsx`. Both properties should be retained.

2. **Leaking `.drag-handle` in Inlined CSS (`cv-base-styles`)**:
   - `fullDocumentHtml` now inlines raw `baseStyles` (`index.css`) directly without scrubbing selector names.
   - Tests asserting that the full document string does not contain `'drag-handle'` fail because the CSS rule `.drag-handle { ... }` is present in `<style id="cv-base-styles">`.

3. **1-Column Mode CSS Selector Retention**:
   - In 1-column mode, `generateCleanPrintHTML` previously replaced `.resume__left` and `.resume__right` in CSS with `.col-inactive`.
   - The new version inlines `baseStyles` unmodified, causing tests expecting `html.not.toContain('resume__left')` to fail.

4. **Stubbed `enforceTwoColumnComponentPagination`**:
   - Replaced by a no-op returning `{ totalPages: 1, targetHeightMm: 297, breaksApplied: [] }`.
   - 9 unit tests in `two-column-pdf-pagination-and-extension.test.jsx` that test this utility directly fail.

5. **Auto-Scale Zoom Removal (`body.style.zoom`)**:
   - The dynamic scale fallback (`calculatePrintScale`) was removed from `executeCleanPrint`.
   - Tests expecting `assignedZoom` on body when content exceeds 2246px fail.

6. **Page Break Carry-Over from Live Editor**:
   - `createSanitizedPrintClone` strips `[data-editor-break-forced="true"]` `margin-top` and `break-before` properties to remove editor visual gap offsets.
   - However, elements that legitimately needed to break across page folds now rely entirely on browser native breaking (`.cv-block { break-inside: avoid }`), which in CSS Grid (2-column mode) can be unreliable in Chromium if not assisted.

---

### HIGH IMPACT ARCHITECTURAL DEBT (RESOLVED)

**1. `App.jsx` God Component (~471 lines) — [RESOLVED]**
- Refactored: Extracted `src/components/Editor/AppModals.jsx` (Joyride, modals, tooltips) and `src/components/Editor/DroppableColumn.jsx`.
- Result: `App.jsx` reduced from 509 lines to 217 lines of clean DnD and composition logic.

**2. `isPrint` Prop-Drilling (threaded 4+ levels deep) — [RESOLVED]**
- Refactored: Formalized `src/context/PrintModeContext.jsx` with `usePrintMode()`. Wrapped `PrintBaseSection` with `<PrintModeContext.Provider value={true}>` and integrated fallback into `BaseSection`, `BaseItem`, `InlineEdit`, and `HyperlinkEdit`.
- Result: Ambient print resolution with 100% backward-compatibility and zero prop-drilling.

**3. `sectionRegistry.js` Monolith (~1.127 lines) — [RESOLVED]**
- Refactored: Decomposed into 18 independent descriptor files in `src/registry/descriptors/` (`profileHeader.js`, `experience.js`, `skills.js`, etc.) and a central index.
- Result: `sectionRegistry.js` reduced from 1.127 lines to 196 lines.

**4. `VersionManagerModal.jsx` Monolith (~1.314 lines) — [RESOLVED]**
- Refactored: Decomposed into modular components under `src/components/Editor/versionManager/`:
  - `VersionActionBar.jsx` (Form and backup actions)
  - `VersionConfirmationDialogs.jsx` (Obsidian Callout confirmation panels)
  - `VersionCard.jsx` (Thumbnail preview, layout badges, inline rename, and action toolbar)
- Result: `VersionManagerModal.jsx` reduced from 1.314 lines to 442 lines.

### MEDIUM & LOW IMPACT DEBT

**4. Declarative Schema Validation for `cvData` — [COMPLETED]**
- Implemented `src/utils/cvSchemaValidator.js` with declarative constants (`ALLOWED_LAYOUT_TYPES`, `ALLOWED_COLUMNS`, `NUMERIC_BOUNDS`), a diagnostic validator (`validateCVSnapshot`) returning detailed path-based errors/warnings, and a sanitizing normalizer (`sanitizeAndValidateCVSnapshot`).
- Re-exported via `src/utils/versionValidator.js` with 100% backward compatibility.
- Fully tested in `src/tests/cvSchemaValidator.test.js` (10/10 tests passing).

**5. `itemFormatters.js` Granular Section Formatters — [COMPLETED]**
- Implemented dedicated formatters (`contactMarkdown`, `contactXML`, `contactPlainText`, `mentoringMarkdown`, `profileHeaderMarkdown`) in `src/registry/itemFormatters.js`.
- Wired `renderMarkdown` directly into all section descriptors in `src/registry/descriptors/` (`contact.js`, `mentoring.js`, `profileHeader.js`, `titleSubtitle.js`, etc.).
- Covered by unit test suite in `src/tests/itemFormatters.test.js` (20/20 tests passing).

**6. Test coverage gaps — [RESOLVED]**
- `thumbnailGenerator.js` is fully covered by dedicated unit test suite in `src/tests/thumbnailGenerator.test.js` (5/5 tests passing: testing 1-col/2-col SVG generation, XML escaping, and corrupt payload recovery).
- `translationEngine.js` is fully covered by isolated unit test suite in `src/tests/translationEngine.test.js` (24/24 tests passing: dictionary extraction across section types, prompt generation with strict localization directives, raw/markdown/preamble/malformed JSON cleaning, key coverage diagnostics, and non-destructive state merging with deep cloning).
- `useBlankPageCleaner.js` was deleted as obsolete dead engine in P1B.
- Full project test suite: **76 test files, 1.108 passing tests, 0 failures (100% green)**.

---

## 16. Hard Invariants (Never Break These)

These are non-negotiable. Breaking any of them causes test failures or product regressions.

1. **Zero PDF drift** — Editor and PDF must be visually identical. No CSS rule may
   target `@media print` in `index.css`. All print-only rules go in `print.css`.

2. **`@dnd-kit` exclusively** — No alternative DnD library. Not even for a "simple" case.

3. **`lucide-react` exclusively** — No BoxIcons, no FontAwesome, no external icon CDN.

4. **No `if (type === ...)` in `BaseSection`, `BaseItem`, or `App`** — The registry
   pattern must drive all type-specific behavior.

5. **`InlineEdit` for all editable text** — Direct `contentEditable` on non-InlineEdit
   elements is not allowed.

6. **Obsidian Callout design** — All suggestion cards, alerts, and feedback must use
   the exact color values from `AGENTS.md §1`.

7. **Dynamic tooltip positioning** — Tooltips must use `getBoundingClientRect()` +
   flip + clamp. Fixed pixel offsets are never acceptable.

8. **AI domain restriction** — Only `tech` and `all` suggestions are active.

9. **No html2canvas** — The PDF pipeline is vectorial and must remain so.

10. **No auto-commits** — Repository owner commits manually after reviewing all changes.

---

## 17. Coupling Map & Refactoring Routes

### High coupling points (risk if modified)

| File | Coupled To | Why |
|------|-----------|-----|
| `sectionRegistry.js` | All item components, `aiExporter.js`, `BaseSection.jsx`, `BaseItem.jsx` | Central factory; all rendering routes through it |
| `schema.js` (defaultSchema) | `versionValidator.js`, `useCVData.js`, `locales/index.js`, tests | Data contract — changes cascade everywhere |
| `index.css` | `staticHtmlPdfEngine.js` | PDF engine inlines this file; any change affects PDF output |
| `CVContext.jsx` (useCV API) | Every component that calls `useCV()` | 48-member API — removing a member breaks callers |
| `pageDistributor.js` | `useDocumentPages.js`, `A4PageBox.jsx`, `geometry.js` | Content partition core — deterministic page distribution |

### Safe refactoring routes (low risk)

| Refactor | How | Status / Risk |
|---------|-----|------|
| Split `sectionRegistry.js` into descriptor files | One descriptor per file in `src/registry/descriptors/`; registry imports and registers them all | **[COMPLETED]** — 18 descriptors extracted |
| `isPrint` → `PrintModeContext` | Add React context; ambient resolution in components | **[COMPLETED]** — `PrintModeContext` active |
| `App.jsx` decomposition | Extract `AppModals.jsx`, `DroppableColumn.jsx` | **[COMPLETED]** — 509 → 217 lines |
| `VersionManagerModal.jsx` decomposition | Extract `VersionActionBar.jsx`, `VersionConfirmationDialogs.jsx`, `VersionCard.jsx` | **[COMPLETED]** — 1.314 → 442 lines |
| Declarative Schema Validation | Define declarative `cvSchemaValidator.js`; pure validator + safe recovery | **[COMPLETED]** — `cvSchemaValidator.js` active |
| Isolated Utility Unit Testing | Harden & cover `thumbnailGenerator.js` (5 tests) & `translationEngine.js` (24 tests) | **[COMPLETED]** — 100% green |
| localStorage → backend | Implement `storageAdapter.js` interface; replace 6 call sites | Medium — requires auth design |

---

## 18. Future Features — Not Yet Planned

These are inferred from the codebase structure and user conversation history.
None are committed, but the architecture supports them.

### Ready to implement (low friction)

| Feature | Route |
|---------|-------|
| **Portuguese locale** | 4 JSON files + 2 lines in `locales/index.js` |
| **German locale** | Same as Portuguese |
| **New section type: Freelance Projects** | `registerSectionType()` + 1 item component |
| **New AI prompt: Cover Letter Generator** | Add to 3 prompts.json files |
| **New AI prompt: LinkedIn Summary Optimizer** | Add to 3 prompts.json files |
| **New AI knowledge rules for Business domain** | Add rules to `business.json` |
| **Dark mode** | CSS Custom Properties already abstract colors; add `[data-theme="dark"]` overrides |

### Medium complexity

| Feature | Route |
|---------|-------|
| **Cloud storage** | `storageAdapter.js` + auth provider + backend API |
| **Template themes** | Swap CSS file (or CSS layer) for different visual styles on same BEM classes |
| **Real-time collaboration** | Would require CRDT or OT; major architecture addition |
| **CV import from LinkedIn JSON** | Parse LinkedIn export format → map to `cvData` schema |
| **QR code on PDF** | Add to profile header printout (SVG QR library, vectorial, no canvas) |
| **Multiple CV documents** | Add document selector + per-document localStorage key namespacing |

### Requires architecture decision

| Feature | Blocker |
|---------|---------|
| **Supabase/Firebase auth** | Auth context design, session management |
| **Mobile editing** | DnD behavior on touch requires re-evaluation; @dnd-kit has touch support but current handle UX is mouse-optimized |
| **PDF to CV import** | Requires server-side PDF parsing (browser cannot parse PDF text structure) |
| **AI real-time suggestions (streaming)** | Would need an API key management system; current system is intentionally client-only |

---

## 19. Dependency Decision Log

### Production dependencies

**`@dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities` (MIT)**
- Chosen for: nested 2-level DnD support, keyboard accessibility, React 18 compatibility
- `swapy` was tested and rejected: it produces slot ID collisions in nested React trees

**`lucide-react` (ISC — MIT equivalent)**
- Chosen for: tree-shakeable SVG, no CDN, offline-safe, consistent visual style
- BoxIcons was the original choice (CDN import); removed in M1 refactor because
  CDN links break ATS text extraction and require network access

**`react-joyride` (MIT)**
- Chosen for: step-by-step onboarding tour without custom overlay infrastructure
- Only active for first-time users; state is persisted in localStorage

### Dev dependencies — all MIT

All dev deps are MIT: Vite, @vitejs/plugin-react, Vitest, @testing-library/react,
@testing-library/jest-dom, jsdom. No GPL contamination.

### License conclusion

The software is MIT-licensable. See `LICENSE` in the project root.

---

## 20. Git Commit History Summary

**Active Branches**: `Re-do-total-de-impresion-PDF` (Current), `Reimplementacion-con-React` (Stable Base)  
**Origin**: `https://github.com/juani981/Ressume`

| Hash | Summary | Tests |
|------|---------|-------|
| `2fc0b8d` | **cloneNode Print Engine Rewrite**: transition from synthetic dual-tree to direct memory cloning of `#area-cv`, data-editor-ui scrubbing, native CSS paged media rules in print.css | WIP (47 failed in legacy tests) |
| `2f978ee` | AI Prompts Epic: 11 prompts, exhaustive Markdown frontmatter, user_commentary, JSON translation output | 797/797 |
| `bff8451` | Simplified action menu | — |
| `0e32626` | `useBlankPageCleaner` — reactive blank page elimination | 727/727 |
| `2e05198` | Refactor: Add bullet points component | — |
| `119bc9f` | Comprehensive architectural audit, Lucide unification, modularization, docs | 634+ |
| `3fec98b` | Template+Factory pattern, context decomposition (728→125 lines), audit | 634/634 |
| `022bb8a` | DnD from any non-text body area, handle repositioning | 628/628 |
| `6a93c36` | PDF parity improvements | — |
| `bae30e0` | Integrated bottom spacer with edge resize handle | — |
| `721edb2` | Vertically resizable blank spacer with PDF print fidelity | — |
| `520cc63` | Favicon | — |
| `75baffb` | Major cleanup | — |
| `ea3a7c5` | Tutorial with persistent state | — |
| `321efdc` | CSS and print fixes | — |
| *earlier* | Initial React + Vite + BEM + BoxIcons setup | — |

---

*End of BRAIN.md. This document should be updated after every major feature
or architectural change.*
