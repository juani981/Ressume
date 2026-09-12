# Original User Request

## 2026-09-02T00:45:28Z

Implement a comprehensive feature upgrade for the Ressume CV editor, comprising dynamic margin/spacing controls, polymorphic cross-column drag-and-drop, an extensible component/section registry architecture, migration of callout/tooltip icons to `lucide-react`, and a dedicated clean static HTML generation core for PDF printing that isolates visual content and prevents super-container page-break splits.

Working directory: /home/juani/Documentos/Ressume
Integrity mode: development

## Requirements

### R1. Dynamic Margins and Element Spacing Controls
Add interactive controls in the ActionMenu/sidebar allowing real-time adjustment of global CV spacing (page padding, vertical gap between sections, and spacing between individual items) backed by dynamic CSS variables and persisted in the CV state.

### R2. Polymorphic Cross-Column Interchangeability
Enable full drag-and-drop interchangeability between the left and right columns for both entire sections and individual items. When an item or section is dropped into an opposing column, it must automatically adapt its visual presentation and layout to match the destination column semantics.

### R3. Extensible Component & Section Registry (Inheritance Pattern)
Establish an extensible component factory / registry pattern based on a shared base structure (`BaseSection` / `BaseItem` handling drag listeners, inline editing, delete actions, and validation) allowing developers to register and render new section and item types with minimal boilerplate.

### R4. Callout & Tooltip Iconography Migration to `lucide-react`
Replace all unicode emojis in the AI suggestion engine, Obsidian callouts, and floating tooltips with standardized `lucide-react` icons (e.g. `AlertOctagon` for danger/critical, `AlertTriangle` for caution/warning, `Info` for information, `Sparkles` for AI headers) while preserving existing BoxIcons for contact and external links.

### R5. Dedicated Static HTML PDF Rendering Core (Max 2 A4 Pages with Auto-Scaling)
Build an isolated static HTML generator (`generateCleanPrintHTML(cvData)`) that takes a clean snapshot of the current CV state and renders pure semantic HTML + typography + CSS, stripping all interactive editor artifacts (drag handles, delete buttons, inputs, tooltips) with strict `break-inside: avoid` / `page-break-inside: avoid` rules on every super-container (section title + body) to prevent layout splits during printing. The rendered PDF output must strictly fit within a maximum of 2 A4 pages; automatically shrink/scale the overall document typography, margins, and spacing in the export process to guarantee adherence to the 2-page limit without content clipping. Connect this engine to both client-side print execution (isolated iframe) and the backend PDF generation pipeline.

## Acceptance Criteria

### Spacing & Margin Controls
- [ ] Sliders or number controls in ActionMenu dynamically update `--section-gap`, `--item-gap`, and `--page-padding` in real time.
- [ ] Spacing values persist in `localStorage` and reload seamlessly across browser sessions.

### Cross-Column Polymorphism
- [ ] Dragging a section from the left column to the right column immediately updates its column assignment and renders correctly in the right column layout.
- [ ] Dragging an item across columns into a different section type adapts its data shape polymorphically without throwing runtime errors or corrupting state.

### Extensibility & Registry
- [ ] Adding a new custom block type requires only defining a schema descriptor and registering its renderer with the BaseItem factory.
- [ ] Base functionality (drag handle, delete button, inline editing, hover feedback) is inherited automatically without reimplementation.

### Iconography Migration
- [ ] Zero unicode emojis remain in `SuggestionTooltip.jsx` or Obsidian callouts; all are rendered via `lucide-react`.
- [ ] `lucide-react` package is declared in `package.json` and imports resolve cleanly.

### PDF & Print Engine
- [ ] The generated static HTML document contains zero editor UI elements (`.drag-handle`, `.round-btn-del`, `.round-btn-add`, `.suggestion-tooltip`, `.inline-input`).
- [ ] Super-containers (`.cv-section` and `.cv-block`) have CSS `break-inside: avoid` and `page-break-inside: avoid` preventing mid-container page ruptures.
- [ ] The final exported document length is strictly capped at a maximum of 2 A4 pages, applying dynamic scale shrinking if content exceeds standard bounds.
- [ ] Invoking print renders the clean snapshot without visual layout shifts or CSS degradation.

## 2026-09-02T02:11:43Z

Transform the Ressume CV editor from a technical prototype into a polished, consumer-grade document creation experience. Implement universal typography and independent scale/spacing controls, redesign the 1-column ATS layout for optimal screen utilization, establish generous and natural drag-and-drop ergonomics, and guarantee strict zero-split PDF printing across all super-containers while preserving 100% of the underlying CV data structure. Test and address any flaws after review with a separate auditor agent providing feedback on human-interaction subtleties, and execute heavy DOM testing to verify that all elements are placed and rendered exactly where they belong.

Working directory: /home/juani/Documentos/Ressume
Integrity mode: development

## Requirements

### R1. Universal Typography & Independent Spacing Engine
- Implement a global font family selector with curated ATS & executive fonts (Poppins, Inter, Roboto, Merriweather, JetBrains Mono) applied universally across the entire CV.
- Provide independent, real-time controls in the ActionMenu for:
  - Base font size scale (`--font-scale` / base rem/px)
  - Line height (`--line-height`)
  - Page padding (`--page-padding`)
  - Section gap / vertical margin (`--section-gap`)
  - Item gap / spacing between elements (`--item-gap`)
- Persist all typography and spacing settings in state and `localStorage`.

### R2. ATS 1-Column Layout Overhaul
- Redesign the single-column ATS layout so it uses a well-proportioned, standard document container (max-width 840px, centered, full visual balance) rather than feeling cramped or squished on wide screens.
- Ensure typography, section headers, and bullet lists flow linearly and legibly with optimal line length for ATS readability.

### R3. Natural & Forgiving Drag-and-Drop Ergonomics
- Elevate the drag-and-drop experience so users do not need to hunt for a tiny pixel icon:
  - Provide generous, easily targetable grab handles with clear hover affordance.
  - Support natural drag interactions on section headers and item hover zones.
  - Render smooth, high-framerate ghost overlays and clear visual drop target lines.

### R4. Strict Zero-Split PDF Printing Core
- Eliminate all page-break splits across super-containers (section title + content, experience/education blocks).
- Ensure the static print engine and CSS pagination enforce `break-inside: avoid !important; page-break-inside: avoid !important;` on every `.cv-section` and `.cv-block`.
- Automatically calculate document height and scale typography/paddings proportionally to guarantee the entire CV fits within a maximum of 2 A4 pages without awkward breaks or clipped text.

### R5. Dedicated Human-Interaction QA Review & Comprehensive DOM Testing
- Deploy a separate adversarial QA agent to audit human-interaction workflows (hover states, drag accessibility, tooltip responsiveness, typography switching, and spacing elasticity).
- Execute comprehensive automated DOM verification (via Vitest / testing-library) checking element positioning, container geometry, CSS variable propagation, and print snapshot validity.
- Iterate and fix any edge cases or UX regressions discovered during QA testing.

### R6. UX Homogenization & Data Integrity
- Consolidate the ActionMenu into an intuitive, categorized floating toolbar (Diseño & Tipografía, Espaciado, Exportación, Idiomas).
- Preserve 100% of the CV data schema, contact headers, and bilingual content without data corruption.

## Acceptance Criteria

### Typography & Spacing
- [ ] Selecting a font family instantly updates all text across the entire CV in real time.
- [ ] Sliders for font size scale, line height, page padding, section gap, and item gap work independently and smoothly.
- [ ] All custom typography and spacing preferences persist across page reloads.

### ATS 1-Column Layout
- [ ] 1-column mode renders as an expansive, beautifully centered A4-proportioned paper without awkward horizontal gaps.
- [ ] Switching between 1-column and 2-column mode preserves all content and applies appropriate spacing.

### Drag and Drop Ergonomics
- [ ] Drag handles and drag zones are easily targetable with instant visual feedback on hover.
- [ ] Moving items or sections across columns and within columns feels smooth, reliable, and predictable.

### Print & PDF Integrity
- [ ] No super-container or block splits across page boundaries during printing.
- [ ] PDF export strictly fits within 2 A4 pages with zero extra whitespace margins.

### DOM Testing & QA Audit
- [ ] Automated DOM tests verify that all layout components, typography tokens, and spacing variables mount in their correct locations without clipping or collision.
- [ ] A separate reviewer audit passes with 0 critical interaction defects.

### System Polish & Stability
- [ ] Full build (`npm run build`) and test suite pass with 0 errors.
- [ ] All CV data (contact, experience, education, skills, projects, certifications, languages) remains fully intact and editable.

## 2026-09-03T01:50:08Z

Implement a bulletproof, zero-artifact, 1:1 vector/text PDF print and export engine for the Ressume CV editor. The print output must strictly capture only the contents of the main editing paper (`#area-cv`), rendering 100% selectable text (never rasterized canvas images) with exact typography, active layout rules, custom spacings, colors, and inner icons, completely stripped of all interactive editor artifacts.

Working directory: /home/juani/Documentos/Ressume
Integrity mode: development

## Requirements

### R1. True 1:1 Vector & Selectable Text PDF Generation
Implement a dedicated print/export engine that produces a high-fidelity PDF with 100% selectable text and crisp vector icons (never a raster canvas screenshot like `html2canvas`). The exported document must exactly replicate the visual presentation, grid/column widths, custom font families, font scale, line height, section gap, item gap, page padding, and background colors active in the `#area-cv` paper.

### R2. Complete Interactive Artifact Stripping
Ensure that every interactive editor UI artifact is strictly removed from the print and export output, including:
- Section and item drag handles (`.section-drag-handle`, `.item-drag-handle`)
- Circular delete buttons (`.round-btn-del`, `.section-del-btn`, `.item-del-btn`, `.bullet-del-btn`)
- Circular and row add buttons (`.round-btn-add`, `.add-bullet-btn`, `.section-add-container`, `.column-add-section`)
- AI suggestion toggle lightbulbs (`.section-tips-toggle-btn`) and floating tooltips (`.suggestion-tooltip`)
- Column resizer divider (`.column-resizer`) and action menu UI (`.l-navbar`)
- Input placeholders and raw textarea outlines (content must render as pure semantic typography)

### R3. Strict Zero-Split Super-Container Pagination
Enforce strict page-break avoidance rules (`break-inside: avoid !important; page-break-inside: avoid !important;`) on all `.cv-section` and `.cv-block` containers. Section headers must never be orphaned at the bottom of a page without their corresponding content, and individual job/education/project blocks must never be fractured mid-sentence across page splits.

### R4. Reliable Native & Client-Side Execution Pipeline
Connect the PDF generator to both the top/side ActionMenu export triggers (`executeCleanPrint` and PDF download). Provide a zero-failure execution path (isolated clean iframe printing or direct downloadable PDF stream) that works across modern browsers without layout shifts, missing font glitches, or CSS variable evaluation failures.

## Acceptance Criteria

### Visual Fidelity & Typography
- [ ] Exported PDF matches `#area-cv` layout 1:1 (column proportions, custom colors, fonts, margins, and gaps).
- [ ] PDF contains 100% selectable, copyable text across all sections, titles, and bullets (0% canvas rasterization).
- [ ] Inner icons (contact BoxIcons, badges, timeline dots) render cleanly and in their exact spatial positions.

### Zero Editor Artifacts
- [ ] 0 editor controls (`.drag-handle`, `.round-btn-del`, `.round-btn-add`, `.section-tips-toggle-btn`, `.suggestion-tooltip`, `.column-resizer`) appear in the print output or iframe.
- [ ] Inline editable fields render as plain semantic text nodes without borders or focus rings.

### Page Breaks & Pagination
- [ ] Super-containers (`.cv-section` and `.cv-block`) adhere to `break-inside: avoid` preventing awkward mid-block page cuts.
- [ ] Section titles stay bound to their respective child items.

### System Verification & Tests
- [ ] Automated tests verify that `executeCleanPrint` / `generateCleanPrintHTML` produces a clean HTML document adhering to all CSS variable bindings and containing 0 interactive class selectors.
- [ ] Full build (`npm run build`) and test suite pass with 0 errors.

## 2026-09-03T03:17:21Z

Implement 3 feature epics in an existing Vite + React CV editor app ("Ressume"). The app renders a live-editable CV inside `#area-cv` with dynamic layout, fonts, colors, and spacing controlled by CSS custom properties and React state (managed via `CVContext.jsx`). All work is client-side only — no server-side changes. The existing codebase uses React 18, Vite 5, `@dnd-kit` for drag-and-drop, `lucide-react` for icons, and BoxIcons via CDN. The state schema is defined in `src/utils/schema.js`.

Working directory: /home/juani/Documentos/Ressume
Integrity mode: benchmark

## Codebase Context

The project structure:
```
src/
  App.jsx                          — Main app shell, renders #area-cv
  main.jsx                         — Vite entry
  index.css                        — Global styles, CSS variables for theming
  context/CVContext.jsx             — Central state: cvData, layout, undo/redo, save to localStorage
  utils/schema.js                  — Default CV data schema with layout options
  utils/staticHtmlPdfEngine.js     — Current print engine (iframe-based, to be supplemented, NOT replaced)
  utils/itemAdapter.js             — Item creation helpers
  utils/translationEngine.js       — i18n helpers
  components/CV/BaseSection.jsx    — Renders each draggable section
  components/CV/BaseItem.jsx       — Renders each draggable item
  components/CV/items/             — Item renderers: ExperienceItem, EducationItem, SkillsItem, etc.
  components/Editor/ActionMenu.jsx — Floating toolbar (24KB, the most complex UI component)
  components/Editor/InlineEdit.jsx — Current inline text editing (plain text, no formatting)
  components/Editor/AddSectionModal.jsx — Modal for adding new sections
  components/Editor/ToastNotification.jsx — Toast system
  locales/                         — i18n language packs
```

Key layout variables tracked in `cvData.layout`:
- `type`: '2-column' | '1-column'
- `fontFamily`, `fontScale`, `titleScale`, `bodyScale`, `listScale`, `lineHeight`
- `pagePadding`, `sectionGap`, `itemGap`
- `leftBg`, `rightBg`, `leftColumnWidth`

CSS custom properties applied on `#area-cv`:
- `--title-color`, `--text-color`, `--text-color-light`, `--container-color`, `--container-color-alt`, `--body-color`
- `--circle-color`, `--section-gap`, `--item-gap`
- `--h1-font-size` through `--smaller-font-size`
- `--title-h1-size`, `--title-h2-size`, `--title-h3-size`, `--title-subtitle-size`
- `--body-font-size`, `--body-small-font-size`

## AGENTS.md Rules (MUST be followed)

1. All suggestion cards/alerts use Obsidian Callout visual design (danger/caution/info with specific rgba colors and left borders).
2. Drag-and-drop MUST use `@dnd-kit` — never `swapy`.
3. Tooltips must dynamically track `getBoundingClientRect()` of the active element, flip when approaching viewport boundary, clamp vertically.
4. AI suggestion knowledge bases are in `src/ai-knowledge/` — current domain focus is Tech only.

## Requirements

### R1. Client-Side PDF Generation via @react-pdf/renderer (Epic 1)

The user specified `@react-pdf/renderer` as the library. Build a JIT template mirror that captures every layout variable affecting `#area-cv` — text content, font families, font sizes, colors, padding, margins, section order, column assignment, section gaps, item gaps, and all CSS custom properties — and maps them into `@react-pdf/renderer` components to produce a downloadable PDF. The PDF must:
- Contain selectable vector text (no canvas rasterization)
- Automatically paginate into multiple A4 pages, breaking between sections (never mid-item)
- Match the on-screen rendering 1:1 in layout, fonts, colors, and spacing
- Show a loading spinner during generation
- Show a success toast notification when the download completes
- Be entirely client-side — no server calls
- NOT replace the existing `staticHtmlPdfEngine.js` — supplement it as a new export option

### R2. Rich Inline Text Editing Toolbar with Persistent State (Epic 2)

When the user is editing any text field inside the CV, display a floating formatting toolbar. The toolbar must:
- Appear near the active text element without obscuring it
- Include buttons for text-align: left, center, right, justify
- Bold and italic formatting must be toggleable via toolbar buttons AND keyboard shortcuts (Ctrl+B / Ctrl+I)
- Support native keyboard shortcuts: cut (Ctrl+X), copy (Ctrl+C), paste (Ctrl+V), undo (Ctrl+Z), redo (Ctrl+Shift+Z / Ctrl+Y)
- All formatting (bold, italic, alignment) must persist in the CV state JSON (saved to localStorage) — when the user reloads, formatting is preserved
- The current `InlineEdit.jsx` component must be extended or replaced to support rich text
- The PDF engine (both the existing staticHtmlPdfEngine and the new @react-pdf one) must render bold/italic/alignment correctly

### R3. Floating Panel Reorganization & ATS Mode (Epic 3)

Reorganize the existing `ActionMenu.jsx` floating toolbar:
- Reduce the number of top-level visible buttons by grouping related functions
- Color picking, layout settings (padding, spacing sliders), and text/font settings must be accessible from a single grouped entry point (e.g., a "Diseño" button that opens a submenu)
- Add a layout toggle at the top of the panel, visually similar to a dark-mode toggle switch — two-column is the default, "ATS" mode switches to single-column layout with a clean white background and soberer visual accents (removing decorative elements, simplifying borders)
- Group all export-related actions (JSON export, PDF download) under a single "Acciones" button
- The "add new section" modal (`AddSectionModal.jsx`) must render floating to the right of the `#area-cv` container, using available viewport space, instead of overlaying the document center

## Acceptance Criteria

### Epic 1 — PDF Generation
- [ ] `@react-pdf/renderer` is installed and used client-side
- [ ] Clicking the new PDF button produces a downloaded `.pdf` file
- [ ] Text in the PDF is selectable (not rasterized)
- [ ] The PDF correctly renders 2-column and 1-column layouts matching the on-screen `#area-cv`
- [ ] Section order, spacing, and colors in the PDF match the editor
- [ ] Content exceeding one A4 page paginates across multiple pages, breaking between sections
- [ ] A loading spinner is visible during PDF generation
- [ ] A success toast appears when the download completes
- [ ] No network requests are made during PDF generation
- [ ] The existing `staticHtmlPdfEngine.js` still functions unchanged
- [ ] `npm run build` completes without errors

### Epic 2 — Text Editing Toolbar
- [ ] A floating toolbar appears when any inline text field inside the CV is focused
- [ ] The toolbar includes alignment buttons (left, center, right, justify) that apply to the current field
- [ ] Ctrl+B toggles bold on selected text; the bold state is visible in the editor
- [ ] Ctrl+I toggles italic on selected text; the italic state is visible in the editor
- [ ] Ctrl+Z undoes the last text edit; Ctrl+Shift+Z or Ctrl+Y redoes
- [ ] The toolbar does not overlap/obscure the text being edited
- [ ] Bold, italic, and alignment values persist in `cvData` (can be verified by inspecting localStorage after reload)
- [ ] The PDF output (both engines) correctly renders bold and italic text
- [ ] `npm run build` completes without errors

### Epic 3 — Panel Reorganization
- [ ] The floating panel has fewer top-level buttons than the current version
- [ ] Color, layout spacing, and text/font settings are accessible from a single grouped menu
- [ ] A toggle switch at the top of the panel switches between two-column (default) and ATS single-column mode
- [ ] ATS mode renders a clean white background with soberer accents (no dark/decorative elements)
- [ ] Export actions (JSON, PDF) are grouped under an "Acciones" button
- [ ] The "add section" modal renders floating to the right of `#area-cv` without overlaying the document
- [ ] The modal uses the available space between `#area-cv` right edge and viewport right edge
- [ ] `npm run build` completes without errors

### Cross-cutting
- [ ] The app starts with `npm run dev` and all 3 features function together
- [ ] No regressions in drag-and-drop (sections and items remain draggable and reorderable)
- [ ] No regressions in the existing undo/redo system
- [ ] No regressions in the existing toast notification system

## 2026-09-10T03:58:34Z

Garantizar una paridad visual 1:1 absoluta (cero desfase de píxeles, 0px de diferencia) entre la vista previa interactiva en vivo del editor de CV (`#area-cv`) y el documento PDF / impresión final generado por el motor de impresión limpia (`executeCleanPrint` / `generateCleanPrintHTML`), eliminando cualquier regla CSS divergente, sobreescritura de márgenes, padding o tipografía, y preservando la geometría exacta de todos los elementos.

Working directory: /home/juani/Documentos/Ressume
Integrity mode: development

## Requirements

### R1. Absolute Zero-Drift Visual Parity (Editor vs PDF / Impresión Limpia)
The static HTML generation and clean print engine (`generateCleanPrintHTML` / `executeCleanPrint`) must reproduce the live editor's `#area-cv` presentation with absolute 1:1 pixel parity. Every text element, section header, container, column split, margin, padding, line height, font family, and font size in the final print/PDF snapshot must match the active live editor geometry to the exact pixel (0px discrepancy).

### R2. Complete Purge of Divergent Print CSS and Dimension Overrides
Eliminate any CSS rule, media query, stylesheet, or dynamic style injection that overrides layout dimensions, typography sizes, spacings, paddings, or margins between the live editor and the print output. The live CSS rules and active CSS custom properties (`--page-padding`, `--section-gap`, `--item-gap`, `--font-scale`, `--line-height`, etc.) evaluated in the editor must serve as the single source of truth for both display and print.

### R3. Non-Disruptive Interactive Artifact Concealment
Interactive editor controls (drag handles, delete buttons, add buttons, resizer dividers, floating tooltips, and rich text formatting bars) must be concealed during PDF rendering and printing without modifying container dimensions, margins, or element flow coordinates. Concealment must preserve the exact bounding layout box so that neighboring and descendant content experiences zero reflow or spatial shift.

### R4. Automated Pixel-Parity Verification and Regression Prevention
Establish comprehensive programmatic verification (Vitest tests) that compares the computed bounding rectangles, typography metrics, and layout positions of every section and item between the live editor DOM and the rendered print DOM snapshot, failing if any element drifts by even 1 pixel. All existing test suites across the repository must continue to pass cleanly with zero regressions.

## Acceptance Criteria

### Visual & Geometric Parity (0px Drift)
- [ ] Programmatic tests assert that `top`, `left`, `width`, `height`, and computed font sizes between editor elements and print snapshot elements have 0px delta across both 1-column and 2-column layouts.
- [ ] Container width is identical between editor and print output (strict 794px A4 standard).
- [ ] Document zoom is strictly guaranteed to be 1.0 during print and snapshot generation.

### CSS Architecture & Single Source of Truth
- [ ] No overriding CSS rules exist in `print.css`, `index.css`, or inline generators that alter font size, padding, margin, or gap between editor `#area-cv` and print output.
- [ ] All custom properties (`--page-padding`, `--section-gap`, `--item-gap`, `--line-height`, `--font-scale`) propagate identically to the print document without modification or re-scaling.

### Interactive Artifact Stripping without Flow Distortion
- [ ] All interactive editor artifacts (`.drag-handle`, `.round-btn-del`, `.round-btn-add`, `.column-resizer`, `.rich-text-toolbar`, `.action-menu-btn`, etc.) are completely invisible in the final print/PDF output.
- [ ] Concealing interactive controls does not alter the physical dimensions or spatial layout of any surrounding or child CV content.

### System Verification & Tests
- [ ] Primary TDD pixel-parity test suite (`src/tests/pixelParityEditorPrint.test.jsx`) passes with 0px drift tolerance.
- [ ] Full Vitest test suite (`npx vitest run`) passes with 100% success across all test files in the repository.
- [ ] Production build (`npm run build`) succeeds with zero errors or warnings.

## 2026-09-11T03:13:35Z

Conduct a production-grade code review and refactoring of the **Ressume** React CV editor (`/home/juani/Documentos/Ressume/src`). The goal is a codebase that is **loosely coupled, follows Template + Factory + Strategy patterns consistently, and is easy for open-source contributors to extend.** Deliver both a written audit and the actual refactored code.

Working directory: /home/juani/Documentos/Ressume
Integrity mode: benchmark — no restrictions on approach or tools

---

## Context

This is a production React + Vite CV editor with ~55 source files and 628 automated tests (Vitest). The registry-based section system (`src/registry/sectionRegistry.js`) was meant to be the factory, but most components still bypass it with long `sectionType` conditionals. The codebase has the bones of a good architecture but is significantly under-abstracted for external contribution.

Key known issues (confirmed by code scan):
- `ExperienceItem`, `ProjectsItem`, and `VolunteeringItem` each contain an **identical** internal `SortableBulletItem` component (~65 lines, 3× duplicated)
- `BaseItem.jsx` routes rendering via `if (sectionType === 'X')` chains — the registry is ignored at the render layer
- `BaseSection.jsx` contains parallel `if (section.type === ...)` chains for the same reason
- `CVContext.jsx` (~727 lines) mixes: CV CRUD, undo/redo, layout mode, PDF export triggers, AI suggestion context, and column state — a god context
- `App.jsx` (~1080 lines) owns DnD coordination, two-column layout, modal state, and full section rendering — a god component
- The `isPrint` prop is threaded through every component as a runtime branch rather than resolved at a clean architectural boundary

## Requirements

### R1. Audit Report
Produce a structured markdown report (`docs/code-review.md`) that:
- Lists every coupling violation, duplication, and anti-pattern found in `src/`
- Cites exact file path + line range for each finding
- Rates each finding: High / Medium / Low impact
- Identifies which files, hooks, and utilities are safe to import as-is by a contributor and which require understanding global side-effects first

### R2. Refactoring — Deduplication and Pattern Enforcement
Implement refactors that bring the codebase in line with Template + Factory + Strategy patterns:

- **SortableBulletItem**: extract into a single shared component (`src/components/CV/SortableBulletItem.jsx`) imported by all three item types
- **BaseItem & BaseSection**: eliminate all `if (sectionType === ...)` and `if (section.type === ...)` chains; all type-specific dispatch must go through the registry descriptor (factory/strategy pattern)
- **Registry descriptor contract**: the `sectionRegistry` entry for each type should declare everything needed for rendering — container tag, container class, whether it supports bullets, whether it's a list item — so BaseItem and BaseSection become pure template components
- **CVContext decomposition**: split into focused hooks (`useCVData`, `useCVHistory`, `useCVLayout`, `useCVExport`) exported from a barrel file; the existing `useCV()` hook must remain as a backward-compatible facade so no callers break

### R3. Documentation
Add JSDoc blocks to every new abstraction (hooks, factory functions, shared components, registry descriptor typedef). Each new file must have a file-level comment explaining its responsibility and contract. No new file may exceed 300 lines.

## Acceptance Criteria

### Audit Report
- [ ] `docs/code-review.md` exists and covers every file in `src/components/CV/` and `src/context/`
- [ ] Every finding cites file + line range + impact rating
- [ ] Identifies at least the 5 known issues listed in the Context section

### Architecture Quality
- [ ] `SortableBulletItem` exists in exactly **one** file; ExperienceItem, ProjectsItem, and VolunteeringItem import from it
- [ ] `BaseItem.jsx` contains **zero** `if (sectionType === ...)` guards in its render path
- [ ] `BaseSection.jsx` contains **zero** `if (section.type === ...)` guards in its render path
- [ ] `CVContext.jsx` is ≤200 lines after decomposition (acts as a facade only)
- [ ] Each decomposed hook file is ≤250 lines and has a single clearly-stated responsibility
- [ ] The `useCV()` hook remains callable and returns the same interface as before

### Code Quality
- [ ] Every new or modified component and hook has a JSDoc block
- [ ] No new file exceeds 300 lines
- [ ] The registry descriptor shape is documented with a JSDoc `@typedef`
- [ ] `npx vitest run` exits 0 — or if tests break, the refactoring is considered incomplete and must be iterated

### Extensibility Test (self-verifiable)
- [ ] Adding a hypothetical new section type requires editing only `sectionRegistry.js` + one new item component file — no changes to `BaseItem`, `BaseSection`, `CVContext`, or `App`
- [ ] This is verified by actually implementing one new minimal section type as a smoke-test

---

## Verification

Run `npx vitest run` in `/home/juani/Documentos/Ressume` to verify no regressions. The baseline is **628 tests, 37 test files, all passing.** If the refactor breaks tests, fix them before declaring done — architectural purity does not excuse regressions.

## 2026-09-11T16:11:48Z

# Teamwork Project Prompt — Architectural Audit & Refactoring

> Goal: Audit and refactor the Ressume CV editor for pixel-perfect A4 print fidelity and clean CSS architecture. Produce a written audit report, then apply all changes, pass tests, and verify a clean build.

Working directory: C:\Users\usuariodgc\Documents\Ressume
Integrity mode: development

## Project Context

Ressume is a **Vite + React 18** (no TypeScript) CV editor that lets users build resumes visually and print them as PDF. The editor renders a live WYSIWYG view of the CV on simulated A4 pages. When the user clicks Print, a clean HTML snapshot is generated and fed to `window.print()` via an iframe lifecycle managed in `src/utils/staticHtmlPdfEngine.js`.

**MANDATORY READING before any file edits:**
- `AGENTS.md` at the repo root — project-level architectural rules that must be followed for ALL changes.
- `src/utils/staticHtmlPdfEngine.js` — the core print engine (981 lines).
- `src/styles/print.css` — the ONLY print stylesheet (Single Source of Truth).
- `src/index.css` — editor-only styles; must contain NO `@media print` rules.
- `src/registry/sectionRegistry.js` — descriptor-based section registry.
- `src/components/CV/BaseSection.jsx` and `BaseItem.jsx` — shared base components.
- `src/context/CVContext.jsx` — global state, pageHeightPx, history.
- `src/App.jsx` — editor layout, `recalculatePagination`, page break logic.

**Git history** (`git log --oneline -40`): Read the git log to identify which files and bugs have been touched repeatedly. Files that appear in many commits are hotspots — treat them with special care and thorough testing.

## Key Architecture Facts (already established)

### Print CSS Pipeline (do NOT regress these)
The iframe for print is built with three injected style tags, in order:
1. `<style id="cv-base-styles">` — `src/index.css?raw` with editor artifacts regex-stripped
2. `<style id="cv-print-styles">` — `src/styles/print.css?raw` (entire file, inside `@media print`)
3. `<style id="cv-snapshot-breaks">` — dynamic CSS generated from `snapshotBreaksCSS()`

### Known Constants (`staticHtmlPdfEngine.js` lines 9–11)
```js
A4_PAGE_HEIGHT_PX = 1123    // 96 DPI
MAX_A4_2PAGE_HEIGHT_PX = 2246
MIN_SCALE_FLOOR = 0.75
```

### Editor Gap NOT in Print
`gapPx = 20` is a visual gap between page guides in the editor (`App.jsx`). This gap does NOT exist in the print iframe. It is a known source of drift between editor and print. Any refactoring must document this clearly and must not accidentally remove it from the editor or add it to the print path.

### Section Registry Pattern
`src/registry/sectionRegistry.js` uses a descriptor pattern: each section type has a descriptor object with `containerTag`, `containerClass`, `wrapperClass`, `printContainerStyle`, `printItemStyle`, `hasTitle`, `defaultColumn`. `getSectionDescriptor(type)` is the lookup. `PrintBaseSection` and `PrintBaseItem` consume this registry via `renderToStaticMarkup`. This pattern must be preserved and strengthened, not abandoned.

## Requirements

### R1. Print Engine Audit + Pixel-Parity Hardening

Audit `staticHtmlPdfEngine.js` for:

1. **Dead code**: Identify any code paths that are unreachable in the browser (snapshot) path. Document them. If safe to remove, remove them; if they serve JSDOM fallback only, annotate with a clear `// JSDOM-ONLY FALLBACK` comment.

2. **CSS variable propagation**: Verify that CSS custom properties set on `#area-cv` in the editor (e.g., `--page-padding`, `--font-scale`, `--color-primary`, etc.) are being correctly transferred to the print iframe's root element. If they are not, implement the transfer.

3. **`gapPx` offset documentation**: Add a clear block comment in `App.jsx` explaining the `gapPx = 20` editor gap, why it exists, and that it MUST NOT be introduced into the print path.

4. **`margin-top` on page breaks**: Verify that `snapshotBreaksCSS` and the DOM injection at line 825 both use `var(--page-padding, 24px)` (not `0px` or a hardcoded value). These should already be correct — confirm and add a test if missing.

5. **`min-height: 594mm` columns**: Audit whether `min-height: 594mm !important` on two-column layouts causes `box-decoration-break: clone` to add extra padding on page fragments. Document the finding. If it causes real drift, propose and apply a fix.

### R2. CSS Single Source of Truth — Audit & Hardening

1. **`src/index.css`**: Confirm there are ZERO `@media print` blocks remaining. If any are found, remove them.

2. **`src/styles/print.css`**: Confirm ALL rules are inside a single top-level `@media print { }` block with no bare (non-media-wrapped) selectors. The only exceptions allowed are CSS custom property declarations on `:root` that are genuinely needed at the top level.

3. **Inline styles in `staticHtmlPdfEngine.js`**: Audit all `element.style.X = Y` assignments in `executeCleanPrint`. For any property that is also declared in `print.css`, evaluate whether the inline assignment is:
   - Necessary (dynamic value computed at runtime) → keep and add a comment explaining why it can't be in CSS
   - Redundant (same value as the CSS rule) → remove the inline assignment, rely on the stylesheet
   
4. **CSS variable scoping**: Ensure that variables used in `print.css` (e.g., `--page-padding`) are defined either:
   - On the `#area-cv` element (transferred to iframe root per R1.2), or
   - With a fallback value in `var(--name, fallback)` syntax

### R3. Test Suite — Remove Tautological Tests, Add Real Assertions

Current test environment limitation: JSDOM returns 0 for all `getBoundingClientRect()` values. All geometry-dependent tests use `Object.defineProperty` mocks. This is acceptable for unit tests but must be clearly documented.

1. **Identify tautological tests**: A test is tautological if it calls a function and then asserts the output equals what that same function would compute from the same inputs — i.e., it tests nothing about behavior. Document each tautological test found.

2. **Fix or remove tautological tests**: For each tautological test:
   - If the test can be rewritten to assert a specific known-correct value (hardcoded expected output), rewrite it.
   - If the test cannot be meaningfully rewritten without a real browser, mark it with `// TODO: requires Playwright/Puppeteer for real geometry` and replace the body with a documented no-op that always passes.
   - Do NOT delete the test file — preserve the structure and comments.

3. **Add missing assertions**:
   - `cleanPrintEngineVerification.test.jsx` Pillar 3: verify that ALL three style tags (`cv-base-styles`, `cv-print-styles`, `cv-snapshot-breaks`) are present in the generated iframe document, not just any style tag.
   - Add a test that verifies CSS variables from the editor (e.g., `--page-padding`) are transferred to the iframe root.

4. **Ensure all tests pass**: After all changes, `npm test -- --run` must show 0 failures. The current baseline is 634 passing tests. Do not reduce this count.

## Acceptance Criteria

### Build & Tests
- [ ] `npm run build` completes with 0 errors and 0 warnings
- [ ] `npm test -- --run` shows 0 failures, ≥634 tests passing
- [ ] No new ESLint errors introduced (run `npm run lint` if a lint script exists)

### Print Engine
- [ ] `snapshotBreaksCSS` uses `var(--page-padding, 24px)` for `margin-top` (not `0px`)
- [ ] DOM injection at `executeCleanPrint` line ~825 uses `var(--page-padding, 24px)` (not `'0px'`)
- [ ] CSS custom properties from the editor are transferred to the print iframe root
- [ ] All dead/unreachable code paths are documented with clear comments
- [ ] `gapPx = 20` in `App.jsx` is annotated explaining it's editor-only, not print

### CSS Architecture
- [ ] `src/index.css` contains zero `@media print` blocks
- [ ] `src/styles/print.css` has all rules inside a single `@media print { }` — no bare selectors
- [ ] Redundant inline style assignments removed from `executeCleanPrint`
- [ ] All `var()` usages in `print.css` have fallback values

### Tests
- [ ] Tautological tests identified and either rewritten or annotated
- [ ] All three style tag IDs verified in Pillar 3 tests
- [ ] CSS variable transfer test added

## Deliverables

1. **Audit Report** (markdown artifact): Document every finding before making changes, organized by category (Print Engine, CSS, Tests). Include file paths, line numbers, and severity (critical/warning/info).

2. **Modified source files**: Apply all changes described above with clear commit-ready code.

3. **Test run output**: Show final `npm test -- --run` output confirming 0 failures.

4. **Build output**: Show final `npm run build` output confirming clean build.

## 2026-09-11T19:20:26Z

# Teamwork Project — Auditoría, Refactorización Integral y Pase a Producción

Equipo solicitado: Equipo completo multi-agente (Auditor forense, Refactorizador, Especialista en UI/Iconos y Redactor técnico de documentación).

Auditoría integral, refactorización profunda y preparación para pase a producción del proyecto Ressume, enfocada en la calidad, mantenibilidad y escalabilidad del código como editor editable, saneando archivos huérfanos y legacy, deduplicando lógica redundante, migrando toda la iconografía al estándar homogéneo de `lucide-react`, redactando documentación técnica exhaustiva en `/docs` y asegurando paridad visual 1:1 entre el editor WYSIWYG y la exportación PDF.

Working directory: C:\Users\usuariodgc\Documents\Ressume
Integrity mode: development

MANDATORY RULES:
- Seguir estrictamente las reglas de AGENTS.md (no usar swapy, solo @dnd-kit; tooltips dinámicos con getBoundingClientRect(); callouts estilo Obsidian).
- El criterio de aceptación primordial es la CALIDAD Y MANTENIBILIDAD DEL CÓDIGO para ser editable y escalable, no conformarse únicamente con que los tests pasen.

## Requirements

### R1. Saneamiento de Archivos Huérfanos, Código Muerto y Legacy
Identificar, aislar o eliminar todos los módulos, componentes, utilidades y suites de pruebas experimentales u obsoletas que no estén enlazadas activamente en la aplicación o que hayan quedado desactualizadas tras las sucesivas migraciones. Mantener intacta la compilación de producción y la funcionalidad del sistema.

### R2. Refactorización y Deduplicación de Lógica Repetida
Examinar el código en busca de patrones repetidos en el cálculo de dimensiones, manipulación del árbol DOM, gestión de estados y selectores. Extraer funciones puras, hooks y utilidades compartidas que simplifiquen los componentes principales (`App.jsx`, `BaseSection.jsx`, `staticHtmlPdfEngine.js`) para maximizar la legibilidad y la facilidad de mantenimiento a largo plazo.

### R3. Unificación Homogénea de Iconografía en `lucide-react`
Consolidar el 100% de la iconografía de la aplicación en la librería `lucide-react`. Reemplazar todas las clases heredadas de `boxicons` (`bx bx-*`) en botones de acción, menús laterales (`ActionMenu`), modales, drag handles y cabeceras de sección por sus equivalentes nativos de `lucide-react`, eliminando la dependencia de estilos de fuentes de íconos externas.

### R4. Paridad Visual 1:1 y Estabilidad de Paginación
Garantizar que la visualización del documento en el editor visual (`#area-cv`) y la salida producida en la impresión PDF nativa (`window.print()` / iframe) mantengan paridad pixel-perfect en márgenes, tipografías, cortes de página y respeto incondicional de las zonas prohibidas, garantizando que el código permanezca completamente editable y extensible.

### R5. Documentación Exhaustiva y Guías de Desarrollo en `/docs`
Elaborar una suite documental completa y estructurada en la carpeta `/docs`, que sirva como referencia indispensable para futuros desarrolladores:
- `arquitectura.md`: Explicación de la arquitectura del editor, el flujo de datos unidireccional y el motor de paginación.
- `guia-extensibilidad-secciones.md`: Paso a paso detallado para añadir nuevos tipos de sección o ítems mediante `sectionRegistry.js`.
- `diseno-invariantes.md`: Guía de estilos, accesibilidad, estándares de callouts (Obsidian style) y posicionamiento de tooltips dinámicos.
- `motor-impresion-pdf.md`: Documentación del pipeline de renderizado estático y paridad de impresión.

## Acceptance Criteria

### Calidad de Código y Limpieza
- [ ] No existen archivos huérfanos ni módulos no referenciados en el árbol de `src/`
- [ ] La librería `boxicons` ha sido reemplazada en su totalidad por componentes de `lucide-react` en toda la interfaz
- [ ] Las funciones utilitarias y algoritmos de coordenadas están modularizados sin bloques de código duplicados
- [ ] `npm run build` genera el bundle de producción en Vite sin advertencias ni errores

### Paridad y Robustez Funcional
- [ ] El editor WYSIWYG y la vista previa de impresión PDF presentan paridad visual 1:1 en saltos de página y márgenes
- [ ] Ningún elemento de contenido invade las zonas de margen prohibidas en modo ATS (1-columna) ni en modo tradicional (2-columnas)
- [ ] Todas las interacciones del usuario (drag & drop, edición inline, toggles de diseño, adición de secciones) responden con fluidez y sin errores en consola

### Documentación y Mantenibilidad
- [ ] Carpeta `/docs` completa con las 4 guías técnicas estructuradas y enlazadas
- [ ] La suite de pruebas automatizadas ejecuta y pasa limpiamente reflejando las nuevas mejoras de refactorización

### Commit & Finalización
Al concluir exitosamente la auditoría, refactorización, documentación y verificación del build, el equipo debe consolidar los cambios en git.

## 2026-09-12T02:45:08Z

Refactorizar y potenciar el subsistema de Abstracción de CV y Generación de Prompts de Inteligencia Artificial en Ressume, sustituyendo opciones y selectores dispersos por una solución de diseño opinionada donde el Markdown enriquecido (con Frontmatter exhaustivo que refleja 1:1 el estado del documento impreso) sea la fuente canónica de verdad. Se incorpora personalización mediante comentarios libres del usuario (`user_commentary`), detección automática del layout activo sin selectores manuales, estandarización rigurosa de todos los `output_format` al nivel exhaustivo de la Auditoría ATS (17 puntos), creación de al menos 5 nuevos prompts altamente especializados en preparación técnica de empleo IT, y generación de un payload de traducción y localización que produce un JSON nativo de `cvData` directamente importable en el Gestor de Versiones.

Working directory: /home/juani/Documentos/Ressume
Integrity mode: benchmark

## Requirements

### R1. Experiencia Opinionada y Limpia en Modal de IA (`AIExportModal.jsx`)
- Detectar automáticamente el modo de layout activo (`cvData.layout?.type` / `isAtsMode`) al abrir el modal, sin ofrecer controles ni selectores interactivos de layout o de formato (mantener ocultos/comentados los selectores prescindibles).
- Ofrecer como única fuente de exportación y abstracción el formato Semantic Markdown de máxima fidelidad.
- Proveer un campo de entrada opcional de texto libre (`user_commentary`) para que el usuario agregue instrucciones o notas contextuales a cualquier prompt seleccionado.
- Mantener el campo `"job_description"` exclusivamente cuando el prompt seleccionado lo requiera (`job_matcher`), coexistiendo armoniosamente con `user_commentary`.
- La vista previa del payload debe reflejar instantáneamente el contenido estructurado de ambos campos.

### R2. Abstracción Markdown Exhaustiva como Fuente de Verdad 1:1 (`aiExporter.js`)
- Enriquecer `exportToAIMarkdown` para que el Frontmatter YAML contenga la totalidad de los metadatos estructurales y visuales del CV (tipo de layout, orden canónico o visual de secciones, tipografía, escalas de fuente, padding de página, gaps entre secciones e items, estilos de viñetas, colores de contenedores y datos completos de perfil/contacto).
- Garantizar que el cuerpo Markdown capture exhaustivamente el 100% de las secciones, items, fechas, subtítulos, viñetas, enlaces y descripciones del CV sin omisiones ni ambigüedades.
- En el caso específico del prompt de Traducción y Localización, inyectar adicionalmente dentro del bloque de entrada una copia compacta del schema JSON nativo de `cvData` para orientar y anclar la estructura del resultado.

### R3. Catálogo de Prompts Existente: Rúbricas Rigurosas y Salidas Estructuradas (`output_format`)
- Analizar e investigar las necesidades actuales del mercado de contratación IT (tanto reclutadores técnicos como candidatos) para perfeccionar los prompts existentes en `src/locales/es/prompts.json`, `src/locales/en/prompts.json` y `src/ai-knowledge/prompts.json`.
- Dotar a todos los prompts que carezcan de formato de salida (`job_matcher`, `star_enhancer`, `technical_interview`, `translate_english`, `layout_advisor`) de un `output_format` explícito, granular y acotado, tomando como estándar de referencia la minuciosidad del prompt de **Auditoría ATS (17 puntos)**.
- Para el prompt de **Traducción & Localización**:
  - Exigir con precisión quirúrgica que la salida sea estrictamente un bloque de código JSON con el schema exacto de `cvData` de Ressume, de forma que el usuario pueda copiarlo e importarlo directamente en el Gestor de Versiones como una nueva versión funcional del CV.
- Para los demás prompts (`job_matcher`, `star_enhancer`, `technical_interview`, `layout_advisor`), detallar matrices de evaluación, rúbricas cuantitativas (0-100), transformaciones con la fórmula Google XYZ / STAR y análisis de contraste WCAG AA.

### R4. Nuevos Prompts Especializados para la Búsqueda de Empleo Tech (Mínimo 5 Prompts)
Diseñar e incorporar en `src/locales/es/prompts.json`, `src/locales/en/prompts.json` y `src/ai-knowledge/prompts.json` una suite de nuevos prompts de alto impacto laboral, todos con el mismo estándar de especificidad, rúbrica estricta y `output_format` estructurado:
1. **Simulador de Entrevista de Diseño de Sistemas y Arquitectura (`system_design_simulator`)**: Desafío de escalabilidad, microservicios, bases de datos SQL/NoSQL, concurrencia y tradeoffs arquitectónicos adaptados al stack específico del candidato, con rúbrica de evaluación y diagrama arquitectural en texto/Mermaid.
2. **Entrenamiento de Algoritmos y Live Coding (`live_coding_coach`)**: Detección de patrones algorítmicos esperables para el stack y seniority (sliding window, two pointers, grafos, dynamic programming), con guía de resolución, complejidades Big-O esperadas y casos de prueba frontera.
3. **Entrevista Conductual y Liderazgo Tech (`behavioral_leadership_prep`)**: Preguntas situacionales bajo estándares FAANG/Tier-1 Tech (ej. Principios de Liderazgo de Amazon, resolución de conflictos técnicos, gestión de deuda técnica y post-mortems), con rúbricas de respuesta STAR y trampas comunes.
4. **Hoja de Ruta de Upskilling y Recursos Externos Recomendados (`career_upskilling_roadmap`)**: Diagnóstico de brechas técnicas frente a roles Senior/Staff y recomendaciones concretas de recursos de élite (libros estándar de la industria como *Designing Data-Intensive Applications*, repositorios open source clave para contribuir, papers y laboratorios prácticos) organizados en un plan de 30/60/90 días.
5. **Playbook de Contacto Directo y Networking para Tech (`cold_outreach_generator`)**: Generación de mensajes de alto impacto y personalización para contactar a Engineering Managers, Tech Leads y Recruiters en LinkedIn o email en base a los logros más destacados del CV, evitando plantillas genéricas.
6. **Estrategia y Negociación de Ofertas Salariales Tech (`salary_negotiation_advisor`)**: Análisis de bandas de compensación según stack y seniority, argumentos de valor basados en el CV, guiones de conversación para llamadas salariales y manejo de contraofertas.

### R5. Integración del Payload y Verificación con Vitest
- Modificar `buildAIPromptPayload` para ensamblar ordenadamente las secciones del payload (`role`, `task`, `output_format`, `user_commentary` si está presente, `job_description` si aplica, y los datos de entrada del CV).
- Crear y ejecutar tests automatizados en Vitest que certifiquen:
  - Presencia del bloque `user_commentary` cuando es provisto y omisión limpia cuando está vacío.
  - Generación de Frontmatter exhaustivo en `exportToAIMarkdown`.
  - Conformidad de los esquemas de prompts en español e inglés (verificando que ningún prompt carezca de `output_format` no vacío y que los nuevos prompts estén presentes en ambos idiomas).
- Todos los 727+ tests preexistentes del repositorio deben pasar limpiamente (0 fallos).
- **Regla estricta:** NO realizar commits automáticos a git. Los cambios deben quedar listos en el working tree para que el usuario los revise y confirme.

## Acceptance Criteria

### Modal de Prompts de IA
- [ ] Al abrir `AIExportModal`, el layout utilizado coincide con el tipo de layout actual del CV sin mostrar dropdowns de selección de layout ni de formato.
- [ ] El modal presenta un textarea para `user_commentary` accesible para todos los prompts.
- [ ] Si se escribe un comentario de usuario, aparece reflejado bajo la sección `user_commentary:` en la vista previa del payload.
- [ ] Si se selecciona `job_matcher`, se muestra tanto el campo de `job_description` como el de `user_commentary`.
- [ ] El selector de prompts incluye todos los prompts preexistentes y la nueva suite de prompts tech.

### Abstracción Markdown (Fuente de Verdad)
- [ ] El Frontmatter YAML generado por `exportToAIMarkdown` incluye metadatos de configuración visual (`layout_type`, `page_padding`, `section_gap`, `item_gap`, `font_family`, `font_scale`) además de los datos de contacto y orden de secciones.
- [ ] La abstracción cubre todos los tipos de secciones estándar y personalizadas sin descartar campos de texto, enlaces o fechas.
- [ ] Para el prompt de traducción, el payload inyecta tanto el Markdown enriquecido como la estructura JSON nativa compacta de `cvData`.

### Catálogo de Prompts y Output Formats
- [ ] En `src/locales/es/prompts.json`, `src/locales/en/prompts.json` y `src/ai-knowledge/prompts.json`, el 100% de los prompts tienen una propiedad `output_format` no vacía y detallada.
- [ ] El prompt de traducción (`translate_english` / equivalente) estipula como formato de salida un bloque de código JSON estricto con el schema completo de `cvData` de Ressume, compatible con el validador del Gestor de Versiones (`src/utils/versionValidator.js`).
- [ ] Existen al menos 5 nuevos prompts enfocados en búsqueda laboral técnica (System Design, Live Coding, Behavioral Leadership, Upskilling Roadmap, Cold Outreach, Salary Negotiation) con textos bilingües (`es` y `en`).
- [ ] Todos los prompts poseen un nivel de detalle, rúbricas y pasos análogo al estándar de la Auditoría ATS.

### Calidad y Reglas de Integración
- [ ] La suite de tests pasa con 100% de éxito (`npx vitest run` exit code 0).
- [ ] Ningún commit automático es ejecutado en git.
