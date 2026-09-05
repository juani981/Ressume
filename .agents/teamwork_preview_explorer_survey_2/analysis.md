# Phase 0 Survey Report: Ressume Architecture & Interaction Deep-Dive

**Author**: Explorer 2 (Phase 0 Survey)  
**Date**: 2026-09-02  
**Working Directory**: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_survey_2`  
**Reference Request**: `ORIGINAL_REQUEST.md` (## 2026-09-02T02:11:43Z & ## 2026-09-02T00:45:28Z)

---

## Executive Summary

This investigation surveys the architecture, layout geometry, `@dnd-kit` ergonomics, section registry polymorphism, and UI callout/tooltip subsystems of Ressume.

Key discoveries:
1. **1-Column ATS Layout Desktop Squish Root Cause**: In `src/index.css` (lines 534–543), `.resume` is assigned `display: grid; grid-template-columns: 1fr 2fr;` under `@media screen and (min-width: 968px)`. In `App.jsx`, 1-column mode mounts a single child (`.resume__single-column`) without overriding `gridTemplateColumns` inline or setting `display: block`, forcing the entire 1-column CV into the left 33% (the `1fr` track) on desktop screens.
2. **Geometry & Container Sizing**: A standard max-width `840px` document container with `margin: 0 auto` provides optimal reading line-length for ATS parsing while preventing awkward gaps. Redundant nested max-width constraints (`840px` on `#area-cv` vs `800px` on `.resume__single-column`) should be streamlined.
3. **Drag-and-Drop Ergonomics with `@dnd-kit`**: Sensor activation constraint (`distance: 5px`) avoids accidental drags during text editing. Drag handles have hover fade-in (`opacity: 0` to `0.9`), and smooth `DragOverlay` previews prevent DOM clipping during gesture tracking. Hit-box target sizes can be expanded for even more forgiving grab ergonomics.
4. **Extensible Component Registry & Hierarchy**: The factory architecture in `src/registry/sectionRegistry.js` provides polymorphic item adaptation across `skills`, `education`, `list` (experience/projects), `simple_list` (certs/languages), and `about`, backed by `BaseSection.jsx` and `BaseItem.jsx`. Profile header is strictly protected from deletion.
5. **Obsidian Callout Standard & Dynamic Tooltip**: `SuggestionTooltip.jsx` conforms strictly to the Obsidian Callout standard (4px left border, danger `rgba(233,49,71,1)`, warning `rgba(219,139,0,1)`, info `rgba(8,109,221,1)`) using `lucide-react` icons (`OctagonAlert`, `TriangleAlert`, `Info`, `Sparkles`), 0 unicode emojis, and dynamic `getBoundingClientRect()` positioning with viewport clamping and boundary flipping.

---

## Focus Area 1: ATS 1-Column Layout Overhaul & 2-Column Toggle

### 1.1 Architecture & Rendering Logic
In `src/App.jsx` (lines 161–311):
- Mode detection: `is2Col = cvData.layout?.type === '2-column'`.
- **2-Column Mode**:
  - Container: `<div className="resume bd-grid" id="area-cv" style={{ gridTemplateColumns: '1fr 2fr', padding: '0', maxWidth: '1024px', width: '100%', margin: '0 auto', ...dynamicSpacing }}>`.
  - Children: Two `<DroppableColumn>` wrappers (`#column-left` and `#column-right`).
  - Sections filtered by `.column === 'left'` and `.column === 'right'`.
- **1-Column Mode (ATS Optimized)**:
  - Container: `<div className="resume" id="area-cv" style={{ padding: 'var(--page-padding, 2.5rem) var(--page-padding, 2rem)', background: 'var(--container-color)', maxWidth: '840px', width: '100%', margin: '0 auto', ...dynamicSpacing }}>`.
  - Child: `<div className="resume__single-column" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>`.
  - Iterates over `cvData.sections` linearly with `<SortableContext items={cvData.sections.map(s => s.id)}>`.

### 1.2 Identified Desktop Grid Collision Bug
In `src/index.css` (lines 534–543):
```css
@media screen and (min-width: 968px) {
  .resume {
    display: grid;
    grid-template-columns: 1fr 2fr;
    background-color: var(--container-color);
    box-shadow: 0 4px 25px rgba(13, 12, 12, 0.12);
    border-radius: 8px;
    overflow: visible;
    margin: 0 auto;
  }
}
```
**Problem**: In screens wider than 968px, `.resume` receives CSS `grid-template-columns: 1fr 2fr`. In 1-column mode, `App.jsx` line 228 does not set `gridTemplateColumns: '1fr'` or `display: block` inline. Consequently, `.resume__single-column` is placed into the first column track (`1fr`, ~33% width), leaving 66% empty on the right.
**Resolution**: Set `display: 'block'` or `gridTemplateColumns: '1fr'` explicitly in 1-column mode, or toggle `.resume--1col` and `.resume--2col` CSS classes.

### 1.3 State Integrity During Layout Toggle
- In `src/context/CVContext.jsx`:
  - `updateLayout('type', '1-column' | '2-column')` updates `cvData.layout.type`.
  - Section objects retain their `.column: 'left' | 'right'` property in the schema even when rendered in 1-column mode.
  - When switching back to 2-column mode, sections immediately re-sort into their designated column slots without data loss.

---

## Focus Area 2: Layout Containers and Geometry

### 2.1 Container Geometry & Screen Centering
- **Document Width**: 
  - Standard ATS 1-column container: `max-width: 840px`, centered with `margin: 0 auto`.
  - 2-column visual container: `max-width: 1024px`, centered with `margin: 0 auto`.
- **Outer Wrapper (`main.l-main.bd-container`)**:
  - `display: flex; justify-content: center; width: 100%; margin: 0 auto; padding: 2rem 1rem;`
  - Ensures the CV paper floats elegantly with soft drop-shadow (`box-shadow: 0 4px 25px rgba(13, 12, 12, 0.12)`).

### 2.2 Dynamic CSS Variable Tokens
Dynamic spacing tokens injected directly into the `#area-cv` container style:
- `--page-padding`: `${pagePadding}px` (default: 24px, slider: 0–60px).
- `--section-gap`: `${sectionGap}px` (default: 20px, slider: 0–50px).
- `--item-gap`: `${itemGap}px` (default: 8px, slider: 0–30px).
- In `index.css`:
  - `.section`: `padding: calc(var(--section-gap, 20px) / 2) 0; margin-bottom: var(--section-gap, 1.5rem);`.
  - `.skills__name, .editable-item-container`: respects `--item-gap`.

### 2.3 Super-Container Print Pagination Rules
- In `src/index.css` (lines 906–924) & `src/utils/staticHtmlPdfEngine.js` (lines 414–424):
  - `.cv-section`, `.cv-block`, `.experience__content`, `.education__content`, `.skills__name` have strict `break-inside: avoid !important; page-break-inside: avoid !important;`.
  - Prevents mid-block and mid-header page cuts when printing to A4.

---

## Focus Area 3: Drag-and-Drop Ergonomics with @dnd-kit

### 3.1 DND Sensor & Collision Architecture
In `src/App.jsx`:
- **Sensors**:
  - `PointerSensor`: `activationConstraint: { distance: 5 }` prevents drag events from hijacking text selections and inline input clicks.
  - `KeyboardSensor`: `coordinateGetter: sortableKeyboardCoordinates` for full keyboard accessibility.
- **Collision Detection**: `closestCorners` from `@dnd-kit/core`. Provides reliable target detection when hovering over adjacent droppables and nested lists.
- **Sorting Strategy**: `verticalListSortingStrategy` from `@dnd-kit/sortable`.

### 3.2 Visual Drag Handles & Hit Targets
In `src/components/Editor/DragHandle.jsx`:
- Distinct classes: `.section-drag-handle` (sections) vs `.item-drag-handle` (items).
- Styling (`src/index.css` lines 595–642):
  - `opacity: 0` by default; transitions to `opacity: 0.9` on container hover.
  - Cursor affordance: `cursor: grab;` on handle, `cursor: grabbing;` when `:active`.
  - Icon: `<i className='bx bx-grid-vertical'></i>` (BoxIcons vertical drag indicator).
  - Background: `rgba(255, 255, 255, 0.92)` with `box-shadow: 0 1px 4px rgba(0,0,0,0.15)`.

### 3.3 High-Framerate Drag Overlay
In `src/App.jsx` (lines 314–354):
- `<DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>`
- Renders an elevated floating ghost preview:
  - Item Ghost: Shows title, subtitle, border `2px solid #3874ff`, shadow `0 12px 28px rgba(0,0,0,0.22)`, opacity 0.95.
  - Section Ghost: Shows section title, total item count, border `2px solid #3874ff`, shadow `0 16px 36px rgba(0,0,0,0.25)`.
- Eliminates DOM layout shifts and visual jitter during active dragging.

---

## Focus Area 4: Extensible Component / Section Registry & Hierarchy

### 4.1 Registry Architecture (`src/registry/sectionRegistry.js`)
The extensible registry manages section descriptors with schema validation and polymorphic adaptors:

| Section Type | Renderer Component | Default Column | Container Tag | Adaptable Schema |
|---|---|---|---|---|
| `skills` | `SkillsItem.jsx` | `left` | `ul` (`skills__content`) | `{ title, description }` |
| `education` | `EducationItem.jsx` | `left` | `div` (`education__container`) | `{ title, subtitle, date }` |
| `list` | `ExperienceItem.jsx` | `right` | `div` (`experience__container`) | `{ title, subtitle, date, bullets, link, description }` |
| `simple_list` | `SimpleListItem.jsx` | `right` | `ul` | `{ text }` |
| `about` | `AboutItem.jsx` | `left` | `div` | `{ description }` |
| `profile_header` | `ProfileHeaderItem.jsx`| `left` | `div` (`home__container`) | `{ name, subtitle, location, email, phone, linkedin, github }` |

### 4.2 Polymorphic Item Adaptation
When moving an item across section types (`adaptItemToSectionType`):
- **List -> Skills**: Extracts title; joins bullets/description into comma-separated technical string.
- **Skills -> List**: Converts skill title to role/specialty title; formats description into bullet points.
- **Education -> Simple List**: Concatenates `title`, `subtitle`, and `date` into a clean single text line (`"Degree — Institution (Year)"`).
- **Any -> About**: Merges multiline narrative without loss of textual data.

### 4.3 Base Hierarchy & Protection Invariants
- `BaseSection.jsx`: Handles sortable wiring, hover state tracking for tooltips, delete button, inline title editing, items container, and add-item button.
- `BaseItem.jsx`: Handles item-level sortable wiring, drag handle, delete button, and delegates rendering to `descriptor.itemComponent`.
- **Protected Sections**:
  - `profile_header` has `allowDelete: false` and `allowAddItem: false`.
  - `deleteSection('profile_header')` is explicitly guarded in `CVContext.jsx` (line 324).
  - Delete buttons are suppressed in both `BaseSection` and `BaseItem` for `profile_header`.

---

## Focus Area 5: Callout & Tooltip Iconography and Obsidian Styling Rules

### 5.1 Obsidian Callout Standard Compliance
In `src/components/Editor/SuggestionTooltip.jsx` (lines 127–179):
Adheres strictly to the AGENTS.md Obsidian Callout standard:
- **Danger / Critical**:
  - Background: `rgba(233, 49, 71, 0.1)`
  - Left Border: `4px solid rgba(233, 49, 71, 1)`
  - Icon: `<OctagonAlert size={16} color="rgba(233, 49, 71, 1)" />` (`lucide-react`)
  - Title: Bold red title
- **Caution / Warning**:
  - Background: `rgba(219, 139, 0, 0.1)`
  - Left Border: `4px solid rgba(219, 139, 0, 1)`
  - Icon: `<TriangleAlert size={16} color="rgba(219, 139, 0, 1)" />` (`lucide-react`)
  - Title: Bold orange title
- **Info**:
  - Background: `rgba(8, 109, 221, 0.1)`
  - Left Border: `4px solid rgba(8, 109, 221, 1)`
  - Icon: `<Info size={16} color="rgba(8, 109, 221, 1)" />` (`lucide-react`)
  - Title: Bold blue title
- **Header**: `<Sparkles size={16} color="#3874ff" /> AI Suggestions`
- **Zero Raw Emojis**: 0 unicode emojis (`🛑`, `🚨`, `⚠️`, `ℹ️`, `💡`) in callout rendering.

### 5.2 Dynamic Tooltip Positioning Math
- In `SuggestionTooltip.jsx` (lines 11–29):
  ```javascript
  let top = rect.top;
  let left = rect.right + 20;

  // Viewport right edge overflow flip
  if (left + 300 > window.innerWidth) {
    left = rect.left - 320;
  }

  // Viewport vertical bounds clamping
  if (top + 400 > window.innerHeight) {
    top = window.innerHeight - 420;
  }
  if (top < 20) top = 20;
  ```
- Tooltip container uses `position: fixed`, `pointerEvents: 'none'`, and `zIndex: 9999` to ensure it hovers smoothly without triggering cursor hover loops or layout shifts.

---

## 5-Component Handoff Section

### 1. Observation
- `src/App.jsx:223-230`: `#area-cv` inline style handles `dynamicSpacing` and `maxWidth: 840px` for 1-column and `1024px` for 2-column.
- `src/index.css:534-543`: `.resume` media query sets `grid-template-columns: 1fr 2fr` at `min-width: 968px`.
- `src/App.jsx:51-60`: `useSensors` configures `PointerSensor` with `distance: 5` and `KeyboardSensor`.
- `src/components/CV/BaseSection.jsx:52-133`: Section wrapper integrates `useSortable`, `SuggestionTooltip`, `DragHandle`, `InlineEdit`, and `BaseItem`.
- `src/components/CV/BaseItem.jsx:8-145`: Polymorphic item container dynamically routes rendering to `descriptor.itemComponent`.
- `src/registry/sectionRegistry.js:84-298`: Declares 6 standard section descriptors (`skills`, `education`, `list`, `simple_list`, `about`, `profile_header`).
- `src/components/Editor/SuggestionTooltip.jsx:131-178`: Implements Obsidian callout standard with `lucide-react` icons (`OctagonAlert`, `TriangleAlert`, `Info`, `Sparkles`).

### 2. Logic Chain
1. *Observation*: `index.css` lines 534-543 force `.resume` into a 2-column grid (`1fr 2fr`) on desktop screens >= 968px.
2. *Observation*: `App.jsx` renders 1-column mode inside `.resume` without overriding `display` or `gridTemplateColumns`.
3. *Inference*: On desktop screens, the single child `.resume__single-column` is placed in track 1 (1fr, ~33%), causing squishing.
4. *Recommendation*: Explicitly set `display: block; width: 100%;` on `.resume` in 1-column mode to let it span the full 840px centered width.
5. *Observation*: `@dnd-kit` is integrated across `App.jsx`, `BaseSection.jsx`, and `BaseItem.jsx` with `DragOverlay` and activation distance of 5px.
6. *Inference*: The DND structure is robust; ergonomics can be perfected by expanding drag handle hit zones and ensuring clear drop target indicators.
7. *Observation*: `sectionRegistry.js` provides polymorphic `adaptItemToSectionType` and factory functions.
8. *Inference*: Adding custom section types requires only calling `registerSectionType(descriptor)`.
9. *Observation*: `SuggestionTooltip.jsx` uses `getBoundingClientRect()` with horizontal flipping and vertical clamping.
10. *Inference*: Tooltips track section bounding boxes without overflowing screen boundaries.

### 3. Caveats
- Browser font rendering for curated fonts (Poppins, Inter, Roboto, Merriweather, JetBrains Mono) relies on Google Fonts `@import` or pre-loaded font links.
- When dragging between columns in 2-column mode, empty column drop targets need a minimum height (currently `minHeight: '200px'`) so users can drop into an empty column.

### 4. Conclusion
Ressume's core architecture for 1-column ATS mode, `@dnd-kit` ergonomics, section registry polymorphism, and Obsidian callout styling is structurally solid. The primary 1-column desktop squish issue is a CSS media query grid collision that is resolved by explicitly enforcing `display: block` on `.resume` in 1-column mode. The registry and tooltip engines strictly adhere to architectural guidelines.

### 5. Verification Method
- Inspect `src/App.jsx` line 228 and `src/index.css` line 534 to confirm grid-template override.
- Verify `src/registry/sectionRegistry.js` descriptors against `src/utils/schema.js`.
- Inspect `src/components/Editor/SuggestionTooltip.jsx` lines 130–178 to verify Obsidian Callout standard styles and `lucide-react` icons.
- Run `npm run build` to verify clean module resolution.
