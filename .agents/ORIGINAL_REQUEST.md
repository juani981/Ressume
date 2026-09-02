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
