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


