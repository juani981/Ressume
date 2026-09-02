# Phase 0 Survey & Architectural Analysis: Ressume CV Editor

**Author**: Explorer Survey Agent 1  
**Date**: 2026-09-02  
**Target Milestone**: Phase 0 — Comprehensive Architecture & UX Survey  
**Scope**: Typography Engine, Independent Spacing Controls, State Management & Persistence, ActionMenu Categorization, CSS Variables Architecture, and Font Family Loading.

---

## Executive Summary
This report presents a thorough investigation of the Ressume codebase to support the technical upgrade outlined in the authoritative request (## 2026-09-02T02:11:43Z). The editor currently provides a solid foundational architecture with React 18, `@dnd-kit`, custom undo/redo history, multi-language translation support, and an isolated static HTML PDF print engine. However, typography is hardcoded to a single font (`Poppins`), font scaling and line height are not yet parameterized, spacing variables are partially omitted from the print engine `:root` styles, and the ActionMenu lacks a structured categorization hierarchy.

This survey establishes the complete blueprint for implementing universal typography, independent scale/spacing controls, categorized toolbar UX, robust state schema extensions, and 100% data fidelity across reloads.

---

## 1. Universal Typography & Independent Spacing Engine

### 1.1 Current Implementation & Findings
- **Font Definition**:
  - `src/index.css` (lines 1–2, 17): Imports only Poppins via `@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap");` and binds `--body-font: 'Poppins', sans-serif;`.
  - `index.html`: Contains BoxIcons CDN link, but lacks Google Fonts `<link>` tags.
  - `src/utils/staticHtmlPdfEngine.js` (lines 255, 264): Hardcodes Google Fonts Poppins stylesheet and `--body-font: 'Poppins', sans-serif;`.
- **Spacing State**:
  - `src/utils/schema.js` (lines 6–8) defines:
    ```javascript
    layout: {
      type: '2-column', // '1-column' | '2-column'
      leftBg: '',
      rightBg: '',
      pagePadding: 24,
      sectionGap: 20,
      itemGap: 8
    }
    ```
  - Spacing is currently applied via inline CSS variables on `#area-cv` in `src/App.jsx` (lines 169–173):
    ```javascript
    const dynamicSpacing = {
      '--page-padding': `${pagePadding}px`,
      '--section-gap': `${sectionGap}px`,
      '--item-gap': `${itemGap}px`
    };
    ```
- **Identified Gaps**:
  1. `fontFamily` is not present in `cvData.layout` schema (defaults to Poppins).
  2. `fontScale` (base font scale multiplier) is not parameterized in state or CSS variables.
  3. `lineHeight` is hardcoded to fixed values (e.g. `1.45` in print and default browser line-height).
  4. Sliders in `ActionMenu.jsx` only adjust `pagePadding`, `sectionGap`, and `itemGap` inside a floating popover, omitting typography controls.

### 1.2 Required Curated Font Families
To satisfy ATS optimization and executive presentation requirements, 5 curated font families must be supported:

| Font Identifier | Display Name | CSS `font-family` Rule | Primary Use Case & Characteristics |
| :--- | :--- | :--- | :--- |
| `poppins` | **Poppins** | `'Poppins', sans-serif` | Default modern geometric sans-serif; clean headers, friendly aesthetic |
| `inter` | **Inter** | `'Inter', sans-serif` | Industry standard for ATS readability, high x-height, maximum legibility |
| `roboto` | **Roboto** | `'Roboto', sans-serif` | Clean neo-grotesque sans-serif; balanced rhythm, universal rendering |
| `merriweather` | **Merriweather** | `'Merriweather', serif` | Executive / editorial serif; distinguished academic & leadership profiles |
| `jetbrains-mono` | **JetBrains Mono** | `'JetBrains Mono', monospace` | Developer / technical monospace; ideal for software engineering CVs |

### 1.3 Font Loading Strategy
1. **Google Fonts Combined Preload (`index.html`)**:
   Add preconnect and combined stylesheet link in `index.html`:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
   ```
2. **CSS Fallback Import (`src/index.css`)**:
   Include `@import` at top of `src/index.css` to guarantee font resolution in headless test environments (Vitest/JSDOM).
3. **Static Print Engine Embedding (`src/utils/staticHtmlPdfEngine.js`)**:
   Inject the Google Fonts `<link>` stylesheet into the generated static HTML `<head>` and resolve `--body-font` according to `cvData.layout.fontFamily`.

---

## 2. State Management, Schema & Persistence Architecture

### 2.1 State Management Overview (`src/context/CVContext.jsx`)
- **State Store**: Built on React Context (`CVContext`) and custom hook `useCV()`.
- **State Slices**:
  - `cvData`: Core document object containing `layout`, `profile`, and `sections`.
  - `past`, `future`: History stacks enabling up to 30 levels of Undo/Redo (`Ctrl+Z`, `Ctrl+Y`).
  - `languagePacks`: Map of language codes to translation dictionaries `{ es: {...}, en: {...}, ... }`.
  - `activeLanguage`: Currently displayed language code (`'es'`, `'en'`).
- **Persistence Mechanisms**:
  - `localStorage.setItem('cvData', JSON.stringify(cvData))`
  - `localStorage.setItem('cvLanguagePacks', JSON.stringify(languagePacks))`
  - `localStorage.setItem('cvActiveLanguage', activeLanguage)`
- **Schema Initialization & Upward Compatibility**:
  In `CVContext.jsx` (lines 33–47), when reading from `localStorage`:
  ```javascript
  const merged = {
    ...defaultSchema,
    ...parsed,
    layout: {
      ...defaultSchema.layout,
      ...(parsed.layout || {})
    }
  };
  return ensureProfileHeader(merged);
  ```
  *Benefit*: When adding new layout keys (`fontFamily`, `fontScale`, `lineHeight`), existing persisted states automatically receive the default schema fallbacks without data loss or corruption.

### 2.2 Schema Definition & Invariants (`src/utils/schema.js`)
- **Extended Layout Schema Proposal**:
  ```javascript
  layout: {
    type: '2-column',       // '1-column' (ATS Optimized) | '2-column' (Visual)
    leftBg: '',             // Hex color or empty for default
    rightBg: '',            // Hex color or empty for default
    fontFamily: 'Poppins',  // 'Poppins' | 'Inter' | 'Roboto' | 'Merriweather' | 'JetBrains Mono'
    fontScale: 1.0,         // Multiplier: 0.85 to 1.25 (step 0.05)
    lineHeight: 1.45,       // Multiplier: 1.25 to 1.85 (step 0.05)
    pagePadding: 24,        // Px: 0 to 60 (step 2)
    sectionGap: 20,         // Px: 0 to 50 (step 2)
    itemGap: 8              // Px: 0 to 30 (step 1)
  }
  ```
- **Section & Item Integrity Invariants**:
  - `profile_header` is strictly immutable in quantity (cannot be duplicated or deleted; `ensureProfileHeader` protects root state).
  - All sections maintain unique `id` and `type` matching descriptors in `sectionRegistry.js`.
  - Items retain polymorphic properties (`title`, `subtitle`, `date`, `link`, `description`, `bullets`, `text`, `name`, `location`, `email`, `phone`, `linkedin`, `github`).

### 2.3 Bilingual Content & Translation Engine (`src/utils/translationEngine.js`)
- `extractDictionaryFromCV(cvData)` extracts translatable keys from current state.
- `applyDictionaryToCVState(cvData, translatedDict)` immutably updates text content across all section types (`profile_header`, `about`, `skills`, `list`, `education`, `simple_list`) while preserving:
  - Column assignments (`left` / `right`)
  - Item ordering and drag-and-drop hierarchy
  - Unique item IDs
  - Custom background colors and spacing parameters

---

## 3. ActionMenu Component Structure & Categorization

### 3.1 Current Structure (`src/components/Editor/ActionMenu.jsx`)
The current ActionMenu is rendered as a floating vertical icon column anchored at `left: 1.25rem; top: 50%; transform: translateY(-50%)`. It contains 10 unstructured buttons and a separate popover for spacing.

### 3.2 Target Categorized Floating Toolbar Architecture
Per Requirement R6, ActionMenu should be reorganized into an intuitive, categorized floating toolbar with 4 primary feature panels plus history utilities:

```
┌─────────────────────────────────────────────────────────────┐
│ ACTION MENU (Categorized Toolbar)                           │
├─────────────────────────────────────────────────────────────┤
│ 1. [🎨 Diseño & Tipografía]                                │
│    ├── Selector de Fuente (Poppins, Inter, Roboto, etc.)    │
│    ├── Escala de Fuente (--font-scale: 0.85x - 1.25x)       │
│    ├── Altura de Línea (--line-height: 1.25x - 1.85x)       │
│    ├── Disposición (1 Columna ATS vs 2 Columnas Visual)     │
│    └── Paleta de Colores (Fondo Lateral / Principal)        │
│                                                             │
│ 2. [📐 Espaciado & Márgenes]                                │
│    ├── Margen de Página (--page-padding: 0px - 60px)        │
│    ├── Separación de Secciones (--section-gap: 0px - 50px)  │
│    └── Separación de Elementos (--item-gap: 0px - 30px)     │
│                                                             │
│ 3. [📤 Exportación & Documentos]                            │
│    ├── Generar PDF Nativo (A4 Clean Print Engine)           │
│    ├── Hub de Prompts IA & Scorecard ATS                    │
│    └── Exportar Estado (.JSON)                              │
│                                                             │
│ 4. [🌐 Idiomas & Traducción]                                │
│    ├── Selector Rápido de Slot Activo (ES / EN / etc.)      │
│    └── Gestor de Traducción IA & Prompts Rígidos            │
│                                                             │
│ ── [Deshacer (Ctrl+Z) | Rehacer (Ctrl+Y) | Restablecer]     │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Submenu & Popover Interaction Standard
- Clean flyout popovers aligned adjacent to the toolbar button (`left: 4.75rem`).
- Real-time live updates on slider scrub (`onChange={(e) => updateLayout(key, Number(e.target.value))}`).
- Accessible labels, tooltips, and keyboard trap avoidance.

---

## 4. CSS Variables Architecture & Cascading Rules

### 4.1 Master CSS Variables Map
The table below specifies all CSS variables, their default values, propagation scope, and affected CSS selectors:

| CSS Variable | State Path | Default | Value Range | Propagation Scope / Selectors |
| :--- | :--- | :--- | :--- | :--- |
| `--body-font` | `layout.fontFamily` | `'Poppins', sans-serif` | 5 Curated Families | Applied to `#area-cv`, body, headings, lists, inputs, paragraphs |
| `--font-scale` | `layout.fontScale` | `1.0` | `0.85` – `1.25` | Multiplied in font-size rules for h1, h2, h3, normal, small, smaller |
| `--line-height` | `layout.lineHeight` | `1.45` | `1.25` – `1.85` | Inherited by `#area-cv`, `.resume`, `.experience__description`, `.experience__bullets li` |
| `--page-padding` | `layout.pagePadding` | `24px` | `0px` – `60px` | `.resume__left`, `.resume__right`, `.resume__single-column` padding |
| `--section-gap` | `layout.sectionGap` | `20px` | `0px` – `50px` | `.section` margin-bottom and top/bottom padding |
| `--item-gap` | `layout.itemGap` | `8px` | `0px` – `30px` | `.editable-item-container`, `.experience__content`, `.education__content`, `.skills__name` margin-bottom |
| `--title-color` | Computed (YIQ) | `#0f172a` | Dynamic Hex | Headings, section titles, job titles |
| `--text-color` | Computed (YIQ) | `#334155` | Dynamic Hex | Body text, bullet descriptions, dates |
| `--text-color-light` | Computed (YIQ) | `#64748b` | Dynamic Hex | Subtitles, timeline borders, metadata icons |

### 4.2 Mathematical Typography Scaling Formula
In `src/index.css`:
```css
:root {
  --font-scale: 1;
  --line-height: 1.45;
  --body-font: 'Poppins', sans-serif;
  
  --h1-font-size: calc(1.5rem * var(--font-scale, 1));
  --h2-font-size: calc(1.25rem * var(--font-scale, 1));
  --h3-font-size: calc(1.0rem * var(--font-scale, 1));
  --normal-font-size: calc(0.938rem * var(--font-scale, 1));
  --small-font-size: calc(0.875rem * var(--font-scale, 1));
  --smaller-font-size: calc(0.813rem * var(--font-scale, 1));
}

#area-cv {
  font-family: var(--body-font);
  line-height: var(--line-height);
}
```

### 4.3 Container Geometry & ATS 1-Column Layout
- In 1-column mode:
  - Root container `#area-cv`: `max-width: 840px; margin: 0 auto; background: var(--container-color); padding: var(--page-padding);`
  - `.resume__single-column`: `width: 100%; max-width: 800px; margin: 0 auto;`
  - Section headers: Left-aligned, bold, clean uppercase tracking.
  - Linear flow: Strict canonical order (`profile_header` → `about` → `skills` → `experience` → `projects` → `education` → `certificates` → `languages`).

---

## 5. Print & PDF Generator Consistency (`src/utils/staticHtmlPdfEngine.js`)

### 5.1 Analysis of Print Engine Deficiencies
1. **Missing Spacing Variable Injection**:
   In `generateCleanPrintHTML`, `:root` currently declares `--section-gap` and `--item-gap`, but completely omits `--page-padding`, `--font-scale`, and `--line-height`.
2. **Hardcoded Margins**:
   The left and right columns in the print output currently use hardcoded `padding: 1.5rem 1.25rem;` rather than `var(--page-padding)`.
3. **Scale Factor Floor Discrepancy**:
   `calculatePrintScale` in `staticHtmlPdfEngine.js` uses `MIN_SCALE_FLOOR = 0.82`, whereas unit test `T2.2` expects clamp floor `0.75`.
4. **Resolution Required**:
   Inject all dynamic variables into the static document's `<style>` block:
   ```html
   :root {
     --body-font: ${fontFamilyCSS};
     --font-scale: ${fontScale};
     --line-height: ${lineHeight};
     --page-padding: ${pagePadding}px;
     --section-gap: ${sectionGap}px;
     --item-gap: ${itemGap}px;
     ...
   }
   ```

---

## 6. Implementation Checklist for Subsequent Phases

- [ ] **M1 — Font Family & Typography Engine**:
  - Update `index.html` with Google Fonts preloads for Inter, JetBrains Mono, Merriweather, Poppins, Roboto.
  - Extend `defaultSchema.layout` with `fontFamily: 'Poppins'`, `fontScale: 1.0`, `lineHeight: 1.45`.
  - Update `src/index.css` with font scale calculations and font-family cascade.
- [ ] **M2 — ActionMenu Categorization**:
  - Refactor `ActionMenu.jsx` into categorized tabs/submenus (Diseño & Tipografía, Espaciado, Exportación, Idiomas).
  - Add Font Selector, Font Scale slider, Line Height slider, and Spacing sliders.
- [ ] **M3 — ATS 1-Column Layout Optimization**:
  - Refine single-column container max-width (840px), centered visual balance, and linear flow.
- [ ] **M4 — Print Engine Variable Synchronization**:
  - Update `staticHtmlPdfEngine.js` to inject `--body-font`, `--font-scale`, `--line-height`, `--page-padding`, `--section-gap`, `--item-gap`.
  - Align `calculatePrintScale` floor to `0.75`.
- [ ] **M5 — Automated Test Suite & DOM Verification**:
  - Verify all unit and adversarial test suites pass with 0 errors.
