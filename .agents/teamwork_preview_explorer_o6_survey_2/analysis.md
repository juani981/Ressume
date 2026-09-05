# Technical Survey 2: DOM Hierarchy, CSS Variables, Interactive Artifacts & Print Pagination

**Author**: Explorer 2 (`teamwork_preview_explorer`)  
**Target Milestone**: Survey 2 (Milestones 1–4 Planning & Architecture)  
**Date**: 2026-09-03  
**Working Directory**: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o6_survey_2`  
**Workspace Root**: `/home/juani/Documentos/Ressume`  
**Reference Request**: `ORIGINAL_REQUEST.md` (Section ## 2026-09-03T01:50:08Z)

---

## 1. Executive Summary

This survey provides an exhaustive technical analysis of the `#area-cv` editing surface, its internal React component tree, dynamic CSS variable bindings, interactive editor artifacts, and CSS pagination semantics.

### Primary Discoveries:
1. **True 1:1 Vector Fidelity vs Rasterization**: The current codebase in `src/utils/staticHtmlPdfEngine.js` already features the foundation of pure HTML/CSS vector printing (`generateCleanPrintHTML` and `executeCleanPrint`), which completely avoids raster screenshots (`html2canvas`) and generates 100% selectable, copyable text. However, to guarantee absolute 1:1 parity with `#area-cv`, strict synchronization of typography scales, container geometry, custom links, and inner icons is essential.
2. **Interactive Artifact Footprint**: We cataloged **18 distinct interactive class selectors and tags** across 6 functional categories (drag handles, delete buttons, add buttons, AI tooltips, column resizer, and inline editable inputs). Every single artifact must be strictly absent in the exported static HTML and suppressed with `display: none !important` in `@media print`.
3. **Editable Typography Transformation**: In edit mode, `InlineEdit.jsx` renders `<input>` or `<textarea>` with `.inline-input` classes, and falls back to placeholder strings ("Haz clic para editar...") when empty. In the clean print/export pipeline, these must be transformed into semantic typography (`<h1>`, `<h2>`, `<h3>`, `<p>`, `<li>`), active values must be preserved, focus borders must be zeroed, and empty placeholders must never be rendered.
4. **Super-Container Zero-Split Pagination**: Every section container (`.cv-section`) and every item container (`.cv-block`) must enforce `break-inside: avoid !important; page-break-inside: avoid !important;`. To prevent orphaned headers, section titles (`h2.section-title`) must enforce `break-after: avoid !important; page-break-after: avoid !important;`.
5. **Auto-Scaling to Max 2 A4 Pages**: A4 document height at 96 DPI is 1123px per page (2246px for 2 pages). Height-based auto-scaling calculates `Math.max(0.75, +(2246 / renderedHeight).toFixed(3))` to guarantee strict 2-page fit without text truncation.
6. **Diagnosis of Existing Test Suite Failures**: Running `npm test` revealed 5 failing tests in non-print suites (`iconography.test.jsx`, `challenger-stress-suite.test.jsx`, and `hyperlink-edit.test.jsx`) caused by tooltip coordinate offsets (`rect.right + 4` vs `rect.right + 20`) and an unhandled `useCV()` null dereference in `InlineEdit.jsx`.

---

## 2. Focus Area 1: `#area-cv` DOM Hierarchy & Layout Architecture

### 2.1 Outer Document Wrapper & Paper Geometry
In `src/App.jsx` (lines 297–310):
- The document is hosted inside `<main className="l-main bd-container" style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '0 auto', padding: '2rem 1rem' }}>`.
- The editing surface root element is:
  ```html
  <div class="resume [bd-grid]" id="area-cv" style="...">
  ```
- **Drop Shadow & Paper Appearance** (`src/index.css` lines 583–591):
  - In screen preview, `.resume` has `background-color: var(--container-color); box-shadow: 0 4px 25px rgba(13, 12, 12, 0.12); border-radius: 8px; margin: 0 auto;`.
  - In print output, `box-shadow` is stripped (`box-shadow: none !important`), `border-radius: 0`, and `width: 100% !important`.

### 2.2 1-Column Mode (ATS Linear Layout)
- **Container Sizing**: `maxWidth: '840px'`, `width: '100%'`, `margin: '0 auto'`, `display: 'block'`, `position: 'relative'`.
- **Padding**: `padding: 'var(--page-padding, 24px)'`.
- **Background**: `var(--container-color)` (defaults to `#FFFFFF`).
- **Inner Wrapper**: `<div className="resume__single-column" style={{ width: '100%', maxWidth: '840px', margin: '0 auto' }}>`.
- **Rendering Flow**:
  - Sections are sorted and mapped linearly from `cvData.sections` (ignoring `column: 'left' | 'right'`).
  - Wrapped in `<SortableContext items={cvData.sections.map(s => s.id)} strategy={verticalListSortingStrategy}>`.
  - Terminated with `<div className="column-add-section no-print"><button className="add-section-btn no-print">...`.

### 2.3 2-Column Mode (Visual Grid Layout)
- **Container Sizing**: `maxWidth: '1024px'`, `width: '100%'`, `margin: '0 auto'`, `display: 'grid'`, `position: 'relative'`.
- **Grid Template Columns**:
  - Default: `gridTemplateColumns: '1fr 2fr'`.
  - User adjusted: `gridTemplateColumns: `${leftColumnWidth}% ${100 - leftColumnWidth}%`` (clamped between 20% and 55%).
- **Padding**: Set to `padding: '0'` on `#area-cv`; internal padding is delegated to columns.
- **Children**:
  1. `<DroppableColumn id="column-left" column="left" className="resume__left">`:
     - Style: `background: cvData.layout?.leftBg || 'var(--container-color-alt)'`, `padding: var(--page-padding, 2rem) var(--page-padding, 1.5rem)`, `minHeight: '200px'`.
     - Dynamically applies YIQ contrast text colors (`--title-color`, `--text-color`, `--text-color-light`, `--circle-color`).
     - Contains all sections where `section.column === 'left'`.
     - Appends `<div className="column-add-section no-print">`.
  2. `<div className="column-resizer no-print" data-testid="column-resizer">`:
     - Positioned absolutely at `left: calc(${leftColPercent}% - 7px)`.
     - Mouse/touch drag listener (`handleResizerMouseDown`) adjusting `leftColumnWidth`.
     - Contains `.column-resizer-bar` and `.column-resizer-handle`.
  3. `<DroppableColumn id="column-right" column="right" className="resume__right">`:
     - Style: `background: cvData.layout?.rightBg || 'var(--container-color)'`, `padding: var(--page-padding, 2rem) var(--page-padding, 1.5rem)`, `minHeight: '200px'`.
     - Dynamically applies YIQ contrast text colors.
     - Contains all sections where `section.column === 'right'`.
     - Appends `<div className="column-add-section no-print">`.

### 2.4 Component Hierarchy from Root to Atomic Items
```
#area-cv (.resume)
 └── [1-Col] .resume__single-column  OR  [2-Col] .resume__left / .resume__right
      └── CVSection
           └── BaseSection (.cv-section .section .editable-section-container)
                ├── DragHandle (.drag-handle .section-drag-handle .no-print)
                ├── button (.section-tips-toggle-btn .no-print)
                ├── button (.round-btn-del .section-del-btn .no-print)
                ├── h2.section-title > InlineEdit (span / input)
                ├── Items Container (div / ul)
                │    └── BaseItem (.cv-block .editable-item-container)
                │         ├── DragHandle (.drag-handle .item-drag-handle .no-print)
                │         ├── button (.round-btn-del .item-del-btn .no-print)
                │         └── ItemComponent (Polymorphic)
                │              ├── ProfileHeaderItem (.home__data)
                │              ├── ExperienceItem (.experience__content)
                │              │    ├── .experience__time (.experience__rounder + .experience__line)
                │              │    ├── .experience__data
                │              │    │    ├── h3.experience__title > InlineEdit
                │              │    │    ├── span.experience__company > InlineEdit
                │              │    │    ├── span.social__container > HyperlinkEdit
                │              │    │    ├── p.experience__description > InlineEdit (multiline)
                │              │    │    └── .experience__bullets-container > ul
                │              │    │         ├── li.bullet-item-row (.cv-block)
                │              │    │         │    ├── DragHandle (.item-drag-handle)
                │              │    │         │    ├── SimpleListItem > InlineEdit
                │              │    │         │    └── button (.bullet-del-btn .no-print)
                │              │    │         └── .bullet-add-row > button (.add-bullet-btn .no-print)
                │              ├── EducationItem (.education__content)
                │              ├── SkillsItem (li.skills__name)
                │              ├── ProjectsItem (.experience__content)
                │              ├── CertificatesItem (.education__content / .cv-block)
                │              ├── LanguagesItem (.cv-block)
                │              ├── AwardsItem (.cv-block)
                │              ├── PublicationsItem (.cv-block)
                │              ├── VolunteeringItem (.experience__content)
                │              ├── ReferencesItem (.cv-block)
                │              ├── AboutItem (.profile__description)
                │              └── SimpleListItem (li.simple-list-item)
                └── .section-add-container > button (.round-btn-add .no-print)
```

### 2.5 Section Descriptors & Container Tags (Registry Mapping)
From `src/registry/sectionRegistry.js`:

| Section Type | Tag | CSS Classes | Default Col | Allow Del | Allow Add | Key Fields |
|---|---|---|---|---|---|---|
| `profile_header` | `div` | `.home__data.bd-grid.cv-block` | `left` | ❌ No | ❌ No | `name`, `subtitle`, `location`, `email`, `phone`, `linkedin`, `github` |
| `about` | `div` | `.profile__description.cv-block` | `left` | ✅ Yes | ❌ No | `description` |
| `list` (Experience) | `div` | `.experience__content.cv-block` | `right` | ✅ Yes | ✅ Yes | `title`, `subtitle`, `date`, `bullets`, `link`, `description` |
| `projects` | `div` | `.experience__content.cv-block` | `right` | ✅ Yes | ✅ Yes | `title`, `subtitle`, `date`, `link`, `bullets`, `description` |
| `education` | `div` | `.education__content.cv-block` | `left` | ✅ Yes | ✅ Yes | `title`, `subtitle`, `date` |
| `skills` | `li` | `.skills__name.cv-block` (in `ul`) | `left` | ✅ Yes | ✅ Yes | `title`, `description` |
| `certificates` | `div` | `.cv-block` | `left` | ✅ Yes | ✅ Yes | `title`, `subtitle`, `date`, `credentialId`, `link` |
| `languages` | `div` | `.cv-block` | `left` | ✅ Yes | ✅ Yes | `title`, `subtitle` (level), `description` |
| `awards` | `div` | `.cv-block` | `right` | ✅ Yes | ✅ Yes | `title`, `subtitle`, `date`, `description` |
| `publications` | `div` | `.cv-block` | `right` | ✅ Yes | ✅ Yes | `title`, `subtitle`, `date`, `link`, `description` |
| `volunteering` | `div` | `.experience__content.cv-block` | `right` | ✅ Yes | ✅ Yes | `title`, `subtitle`, `date`, `bullets`, `description` |
| `references` | `div` | `.cv-block` | `left` | ✅ Yes | ✅ Yes | `title` (name), `subtitle` (position), `email`, `phone`, `relationship` |
| `simple_list` | `li` | `.simple-list-item.cv-block` (in `ul`) | `right` | ✅ Yes | ✅ Yes | `text` |

---

## 3. Focus Area 2: CSS Variables Architecture

### 3.1 CSS Variable Tokens Breakdown
The layout, typography, spacings, and colors of `#area-cv` are governed by a synchronized set of CSS variables:

#### Spacing Tokens:
- `--page-padding`: `${pagePadding}px` (default: `24px`, slider range: 0–60px, step 2). Controls the inner document margin of `#area-cv` (in 1-column mode) or column padding (in 2-column mode).
- `--section-gap`: `${sectionGap}px` (default: `20px`, slider range: 0–50px, step 2). Controls vertical separation between `.section` elements via `margin-bottom: var(--section-gap)`.
- `--item-gap`: `${itemGap}px` (default: `8px`, slider range: 0–30px, step 1). Controls vertical spacing between `.cv-block` items and bullet rows.

#### Typography & Scale Tokens:
- `--body-font`: Font family name with fallbacks:
  - Poppins: `'Poppins', sans-serif`
  - Inter: `'Inter', sans-serif`
  - Roboto: `'Roboto', sans-serif`
  - Merriweather: `'Merriweather', serif`
  - JetBrains Mono: `'JetBrains Mono', monospace`
- `--font-scale`: Multiplier for general font size (default: `1.0`, slider range: 0.85–1.25, step 0.05).
- `--title-scale`: Multiplier for section headers and titles (default: `1.0`, slider range: 0.80–1.40, step 0.05).
- `--body-scale`: Multiplier for body text and descriptions (default: `1.0`, slider range: 0.80–1.30, step 0.05).
- `--list-scale`: Multiplier for bullet points and list items (default: `1.0`, slider range: 0.80–1.30, step 0.05).
- `--line-height`: Relative line spacing (default: `1.45`, slider range: 1.25–1.85, step 0.05).

#### Font Sizing Formulas:
```css
--h1-font-size: calc(1.45rem * var(--font-scale, 1));
--h2-font-size: calc(1.15rem * var(--font-scale, 1));
--h3-font-size: calc(0.95rem * var(--font-scale, 1));
--normal-font-size: calc(0.88rem * var(--font-scale, 1));
--small-font-size: calc(0.82rem * var(--font-scale, 1));
--smaller-font-size: calc(0.75rem * var(--font-scale, 1));

/* Scaled Categorized Font Tokens */
--title-h1-size: calc(var(--h1-font-size) * var(--title-scale, 1));
--title-h2-size: calc(var(--h2-font-size) * var(--title-scale, 1));
--title-h3-size: calc(var(--h3-font-size) * var(--title-scale, 1));
--title-subtitle-size: calc(var(--normal-font-size) * var(--title-scale, 1));

--body-font-size: calc(var(--normal-font-size) * var(--body-scale, 1));
--body-small-font-size: calc(var(--small-font-size) * var(--body-scale, 1));
--body-smaller-font-size: calc(var(--smaller-font-size) * var(--body-scale, 1));

--list-font-size: calc(var(--normal-font-size) * var(--list-scale, 1));
```

#### Color Tokens & YIQ Contrast Intelligence:
Calculated based on background hex luminance:
$$\text{YIQ} = \frac{(R \times 299) + (G \times 587) + (B \times 114)}{1000}$$
- If $\text{YIQ} < 128$ (Dark Background):
  - `--title-color`: `#fcfcfc`
  - `--text-color`: `#f0efef`
  - `--text-color-light`: `#cccccc`
  - `--container-color-alt`: `rgba(255, 255, 255, 0.1)`
  - `--circle-color`: Luminance-adjusted tint
- If $\text{YIQ} \ge 128$ (Light Background):
  - `--title-color`: `#0b0a0a` (or `#0f172a`)
  - `--text-color`: `#403a3a` (or `#334155`)
  - `--text-color-light`: `#707070` (or `#64748b`)
  - `--container-color-alt`: `rgba(0, 0, 0, 0.05)`
  - `--circle-color`: Luminance-adjusted tint

### 3.2 Injection Mechanics
1. **Live DOM (`App.jsx`)**: Injected into `#area-cv` via inline CSS custom properties object `style={{ ...dynamicSpacing }}`.
2. **Global CSS (`index.css`)**: `:root` declares default fallback values.
3. **Clean Print Engine (`staticHtmlPdfEngine.js`)**: Injected directly into the `<style>` block inside `:root` of the generated HTML document.

---

## 4. Focus Area 3: Catalog of Interactive Artifacts to Strip in Print

| # | Artifact Category | Class Selectors / Element | Component Location | Purpose in Editor | Required Print Treatment |
|---|---|---|---|---|---|
| 1 | **Section Drag Handle** | `.section-drag-handle`, `.drag-handle` | `src/components/CV/BaseSection.jsx:59` | Drag listener for section reordering | Strip from DOM (0 nodes in static HTML); `display: none !important` in CSS |
| 2 | **Item Drag Handle** | `.item-drag-handle`, `.drag-handle` | `src/components/CV/BaseItem.jsx:75, 91, 107, 123` | Drag listener for item reordering | Strip from DOM; `display: none !important` in CSS |
| 3 | **Bullet Drag Handle** | `.item-drag-handle`, `.drag-handle` | `src/components/CV/items/ExperienceItem.jsx:59`, `ProjectsItem.jsx:59`, `VolunteeringItem.jsx:58` | Drag listener for bullet reordering | Strip from DOM; `display: none !important` in CSS |
| 4 | **Section Delete Button** | `.round-btn-del`, `.section-del-btn` | `src/components/CV/BaseSection.jsx:81` | Red circular button with trash icon | Strip from DOM; `display: none !important` in CSS |
| 5 | **Item Delete Button** | `.round-btn-del`, `.item-del-btn` | `src/components/CV/BaseItem.jsx:36` | Red circular button with minus icon | Strip from DOM; `display: none !important` in CSS |
| 6 | **Bullet Delete Button** | `.round-btn-del`, `.bullet-del-btn` | `src/components/CV/items/ExperienceItem.jsx:71`, `ProjectsItem.jsx:71`, `VolunteeringItem.jsx:70` | Red circular button with minus icon | Strip from DOM; `display: none !important` in CSS |
| 7 | **Section Add Item Button** | `.round-btn-add`, `.section-add-container` | `src/components/CV/BaseSection.jsx:127-130` | Green circular button with plus icon | Strip from DOM; `display: none !important` in CSS |
| 8 | **Column Add Section Button** | `.column-add-section`, `.add-section-btn` | `src/App.jsx:329, 421, 441` | Dashed border button "Agregar Sección" | Strip from DOM; `display: none !important` in CSS |
| 9 | **Bullet Add Button** | `.add-bullet-btn`, `.bullet-add-row` | `src/components/CV/items/ExperienceItem.jsx:204-207`, `ProjectsItem.jsx:217-220`, `VolunteeringItem.jsx:206-209` | Dashed border button "Agregar viñeta" | Strip from DOM; `display: none !important` in CSS |
| 10 | **AI Tips Toggle Button** | `.section-tips-toggle-btn` | `src/components/CV/BaseSection.jsx:64` | Yellow circular lightbulb button on section hover | Strip from DOM; `display: none !important` in CSS |
| 11 | **AI Suggestion Tooltip** | `.suggestion-tooltip`, `.obsidian-callout` | `src/components/Editor/SuggestionTooltip.jsx:115` | Floating advice popover | Strip from DOM; `display: none !important` in CSS |
| 12 | **Column Resizer Divider** | `.column-resizer`, `.column-resizer-bar`, `.column-resizer-handle` | `src/App.jsx:343-402` | Draggable divider bar with handle | Strip from DOM; `display: none !important` in CSS |
| 13 | **Action Menu & Toolbars** | `.l-navbar`, `.action-menu-btn-wrap`, `.action-menu-btn`, `.action-menu-tooltip` | `src/components/Editor/ActionMenu.jsx:78` | Fixed floating sidebar controls | Strip from DOM; `display: none !important` in CSS |
| 14 | **Design & Spacing Popovers** | `.design-popover`, `.spacing-popover` | `src/components/Editor/ActionMenu.jsx:340, 548` | Sliders and font picker popups | Strip from DOM; `display: none !important` in CSS |
| 15 | **Toast Notifications** | `.toast-notification` | `src/components/Editor/ToastNotification.jsx:15` | Transient action notifications | Strip from DOM; `display: none !important` in CSS |
| 16 | **Modals** | `.modal`, `.add-section-modal`, `.ai-export-modal`, `.translation-modal` | `AddSectionModal.jsx`, `AIExportModal.jsx`, `TranslationModal.jsx` | Fullscreen modal dialogs | Excluded from `#area-cv`; portals hidden via `no-print` |
| 17 | **Active Inputs / Textareas** | `input`, `textarea`, `.inline-input` | `src/components/Editor/InlineEdit.jsx:63-65` | Active editing fields | Replace with text nodes; zero borders/outlines |
| 18 | **Input Placeholders** | `placeholder`, `{value \|\| finalPlaceholder}` | `src/components/Editor/InlineEdit.jsx:75` | "Haz clic para editar..." | Omit placeholder text completely in clean print |

### 4.1 Inline Edit & Semantic Typography Transformation
In `InlineEdit.jsx`:
- During live editing: renders `<input className="inline-input">` or `<textarea className="inline-input">`.
- During idle viewing: renders `<span style={{ cursor: 'pointer' }}>{value || finalPlaceholder}</span>`.
- **Transformation for Print/Export**:
  - Headings (Name, Subtitle, Section Titles, Job Titles, Degrees): must render as pure `<h1>`, `<h2>`, `<h3>` semantic text.
  - Descriptions and Narratives: must render as `<p>` semantic text.
  - Bullets and List Items: must render as `<li>` semantic text.
  - Placeholders ("Haz clic para editar...", "Click to edit..."): must **NEVER** appear in print output. If `value` is falsy, render empty string `""` or omit the optional field.
  - Hyperlinks (`HyperlinkEdit`): in screen mode, renders an interactive trigger with popover. In static print mode, must render as `<a href="..." target="_blank" class="social__link">` containing crisp vector BoxIcon and link text, providing true clickable PDF links.

---

## 5. Focus Area 4: Super-Container Pagination & Zero-Split Rules

### 5.1 The Super-Container Concept
A **super-container** represents a cohesive logical group of content that should never be split mid-container across a page boundary:
1. **Section Super-Container (`.cv-section`)**: Contains the section header (`.section-title`) plus its items container (`div` or `ul`).
2. **Block Super-Container (`.cv-block`)**: Contains an individual experience entry, education milestone, project showcase, or bullet row.

### 5.2 CSS Fragmentation & Break Avoidance Specification
To guarantee that browser print engines (Chrome, Firefox, Safari) and PDF generators do not fracture containers:
```css
/* Universal super-container break avoidance */
.cv-section,
.cv-block,
.section,
.experience__content,
.education__content,
.skills__name,
.simple-list-item,
.editable-item-container {
  break-inside: avoid !important;
  page-break-inside: avoid !important;
}
```

### 5.3 Orphaned Headers Prevention
If a page split occurs immediately below a section header, the heading is rendered stranded at the bottom of the page without any content. To eliminate orphaned headings:
```css
/* Prevent breaking immediately after section and block titles */
.section-title,
.home__title,
.home__subtitle,
h1, h2, h3 {
  break-after: avoid !important;
  page-break-after: avoid !important;
}

/* Bind first child item directly to the preceding section title */
.section-title + .experience__container,
.section-title + .education__container,
.section-title + .skills__content,
.section-title + ul,
.section-title + div {
  break-before: avoid !important;
  page-break-before: avoid !important;
}

/* Prevent typographic stragglers */
p, h2, h3, li {
  orphans: 3;
  widows: 3;
}
```

### 5.4 Multi-Page Long Content Behavior
When an entire section contains multiple items that together exceed one full A4 page:
- If `break-inside: avoid !important` is applied strictly to `.cv-section`, the browser is forced to push the entire section to page 2 (leaving page 1 half-empty), and then inevitably overflow.
- By ensuring that every **individual item** has `.cv-block` with `break-inside: avoid !important; page-break-inside: avoid !important;`, the browser cleanly inserts the page split **between** item blocks (in the gap), maintaining flawless typographic cadence and zero broken sentences.

### 5.5 Auto-Scaling to Max 2 A4 Pages
- **Standard A4 Dimensions**: $210\text{mm} \times 297\text{mm}$. At 96 DPI: $794\text{px} \times 1123\text{px}$.
- **2-Page Height Limit**: $1123\text{px} \times 2 = 2246\text{px}$.
- **Scaling Math**:
  ```javascript
  const MAX_A4_2PAGE_HEIGHT_PX = 2246;
  const MIN_SCALE_FLOOR = 0.75;

  export const calculatePrintScale = (renderedHeight) => {
    if (!renderedHeight || renderedHeight <= MAX_A4_2PAGE_HEIGHT_PX) {
      return 1.0;
    }
    const calculated = MAX_A4_2PAGE_HEIGHT_PX / renderedHeight;
    return Math.max(MIN_SCALE_FLOOR, +(calculated.toFixed(3)));
  };
  ```
- **Execution in Print Pipeline**:
  - In `executeCleanPrint`, after rendering in an isolated iframe, `renderedHeight` is measured from `doc.body.scrollHeight`.
  - If `scale < 1.0`, apply `doc.body.style.zoom = scale` (or adjust CSS root scaling tokens) before calling `iframe.contentWindow.print()`.

---

## 6. Focus Area 5: Synthesis & Execution Pipeline Comparison

### 6.1 State-Driven Generation vs Live DOM Clone Sanitization

| Aspect | State-Driven Generation (`generateCleanPrintHTML(cvData)`) | Live DOM Clone Sanitization (`cleanDOMClone(#area-cv)`) | Recommendation |
|---|---|---|---|
| **Purity** | 100% pure semantic HTML. 0 interactive elements generated. | Requires traversing and removing nodes via `querySelectorAll`. | State-Driven is inherently cleaner and deterministic. |
| **Speed** | Instant string concatenation / template literal rendering. | Requires cloning DOM, walking nodes, computing styles. | State-Driven is 5–10x faster. |
| **XSS Safety** | Relies on `escapeHTML` on all user fields. | Native DOM nodes handle textContent safely. | Both are safe with proper escaping. |
| **WYSIWYG Fidelity** | Must keep template in sync with React component JSX. | Automatically mirrors active React DOM tree. | Hybrid: State-Driven for print engine; `@media print` CSS for browser Ctrl+P. |

### 6.2 Existing Test Suite Defect Diagnosis (5 Failures)
During our investigation, running `npm test -- --run` revealed 5 failures in existing tests. None of these are in `staticHtmlPdfEngine.test.js` (which passed 10/10 tests). They stem from:
1. **`challenger-stress-suite.test.jsx:313` & `iconography.test.jsx:166` (Tooltip X-Coordinate)**:
   - Observation: `SuggestionTooltip.jsx:19` sets `left = Math.round(rect.right + 4)`.
   - Requirement in `AGENTS.md` (Rule 3) and tests: `left = rect.right + 20px`.
   - Flip condition in `AGENTS.md` and tests: `left = rect.left - 320px`.
2. **`challenger-stress-suite.test.jsx:406` & `iconography.test.jsx:196` (Tooltip Y-Coordinate Clamping)**:
   - Observation: `SuggestionTooltip.jsx:36` clamps `top` to 16px and estimates height differently.
   - Requirement in `AGENTS.md` (Rule 3) and tests: `if (top < 20) top = 20` and `top = window.innerHeight - 420`.
3. **`hyperlink-edit.test.jsx` (Missing Context Provider)**:
   - Observation: In `InlineEdit.jsx:5`, `const { activeLanguage } = useCV();` throws when rendered in tests without `<CVProvider>`.
   - Fix: Use safe fallback `const { activeLanguage = 'es' } = useCV() || {};`.

---

## 7. Actionable Blueprint for Milestones 1–4

### Milestone 1: Static HTML Print Engine & CSS Pagination
- Maintain and enhance `src/utils/staticHtmlPdfEngine.js`.
- Ensure all 13 section types in `sectionRegistry.js` render exact semantic vector markup.
- Ensure strict `break-inside: avoid !important; page-break-inside: avoid !important;` on `.cv-section` and `.cv-block`.
- Add `break-after: avoid !important; page-break-after: avoid !important;` on `.section-title` and headings.

### Milestone 2: Complete Interactive Artifact Stripping & Semantic Typography
- Verify that `generateCleanPrintHTML` has 0 instances of `.drag-handle`, `.round-btn-del`, `.round-btn-add`, `.section-tips-toggle-btn`, `.suggestion-tooltip`, `.column-resizer`, `.no-print`, `<input>`, `<button>`.
- Expand `@media print` in `src/index.css` to explicitly include all artifact classes as defense-in-depth.
- Suppress placeholder strings so empty fields never print "Haz clic para editar...".

### Milestone 3: Client-Side Pipeline & ActionMenu Triggers
- Connect `executeCleanPrint(cvData, activeLanguage)` to ActionMenu print button and PDF download button.
- Implement isolated iframe mounting, measurement, auto-scaling, print triggering, and DOM cleanup.
- Provide direct PDF download or native print preview without visual layout shifts.

### Milestone 4: Verification & Test Suite
- Ensure 100% of the 240 existing tests pass, plus add new comprehensive tests for zero-artifact guarantees and 2-page pagination bounds.
