# Phase 0 Survey: R2 (Modularization & Deduplication) and R4 (1:1 Visual Parity & Pagination Stability)

**Author:** teamwork_preview_explorer  
**Date:** 2026-09-11  
**Scope:** Investigation of App.jsx, BaseSection.jsx, staticHtmlPdfEngine.js, shared hooks/utilities, CSS architecture, print parity, and AGENTS.md invariant compliance.

---

## Executive Summary

This survey conducts an exhaustive forensic audit across the Ressume CV editor architecture to establish the blueprint for:
1. **R2: Codebase Refactoring & Deduplication**: Modularization of App.jsx (~1248 lines), BaseSection.jsx (~286 lines), and staticHtmlPdfEngine.js (~975 lines). Identification of repeated coordinate calculations, DOM queries, duplicate algorithms (YIQ contrast, A4 297mm ruler measurement, relative bounding boxes, breakable element traversal), and proposed extraction into pure utilities and focused custom hooks.
2. **R4: Absolute 1:1 Visual Parity (WYSIWYG Editor vs PDF Clean Print)**: Verification of geometry, container width (794px), padding, CSS variable propagation, editor-only 20px fold gap vs physical print breaks, and strict enforcement of the **Forbidden Boundary Zone** in both 1-column (ATS) and 2-column (traditional) layouts.
3. **Architectural Invariants (AGENTS.md)**: Zero use of swapy (100% @dnd-kit), dynamic tooltip bounding rect tracking & flipping, and strict Obsidian Callout visual design.

---

## Part 1: R2 — Deep Investigation of App.jsx, BaseSection.jsx & staticHtmlPdfEngine.js

### 1.1 Duplicated Logic and Calculation Invariants

Our scan identified 6 major instances of duplicated logic across components and utilities:

| Logic / Calculation | Location 1 | Location 2 | Other Locations | Description & Impact |
|---|---|---|---|---|
| **YIQ Contrast Intelligence (getDynamicTextColors)** | App.jsx:616-665 | staticHtmlPdfEngine.js:186-220 | — | Identical 3-to-6 hex expansion, YIQ formula (r*299 + g*587 + b*114)/1000, circle color adjustment djustColor(calcHex, yiq >= 128 ? -40 : 40). In App.jsx it returns CSS variables (--title-color), in staticHtmlPdfEngine.js it returns camelCase. |
| **A4 297mm Ruler Height Measurement** | App.jsx:97-110 | staticHtmlPdfEngine.js:248-260 | staticHtmlPdfEngine.js:794-807, useCVLayout.js:26-37 | Creates hidden div with style.height = '297mm', appends to document.body, reads offsetHeight, removes div. Implemented **4 times** across the codebase. |
| **Element Relative Bounds (getRelativeBounds)** | App.jsx:118-134 | staticHtmlPdfEngine.js:567-580 | staticHtmlPdfEngine.js:273-278, staticHtmlPdfEngine.js:861-867, useCVLayout.js:70-79 | Computes { top, bottom, height } relative to #area-cv using getBoundingClientRect() with fallback to offsetTop / offsetHeight. Implemented **5 times**. |
| **Breakable Components Selector & Filtering (getBreakableComponents)** | App.jsx:136-151 | staticHtmlPdfEngine.js:582-591 | App.jsx:325-327 (forbidden zone query), print.css:65-75 | Selector: ".section-title, .cv-block, .experience__content, .education__content, .skills__name, .profile__description, .home__data, .simple-list-item, li.cv-block, .contact__item". Ancestor filtering logic: removes elements with a breakable parent that is not a section title. |
| **Font Families Dictionary & Typography Tokens** | App.jsx:583-613 | staticHtmlPdfEngine.js:350-392 | ActionMenu.jsx:536 | Dictionary mapping Poppins, Inter, Roboto, Merriweather, JetBrains Mono to CSS font stacks, and building dynamic CSS custom properties (--body-font, --font-scale, etc.). |
| **Drag Resize Interaction Pattern** | App.jsx:675-710 (handleResizerMouseDown) | SpacerBlock.jsx:75-120 (handleResizeStart) | — | Mouse/touch start, setting cursor on document.body (col-resize vs 
s-resize), setting userSelect = 'none', window listeners for mousemove/mouseup/	ouchmove/	ouchend, clamping to min/max, cleanup. |

### 1.2 Structure & Anti-Patterns in Main Files

#### A. App.jsx (1,248 lines — God Component)
- **Responsibilities mixed in one file**:
  1. Pagination calculation engine (lines 75–376): DOM measurements, breakable traversal, multi-pass margin pushing, forbidden zone audit.
  2. RAF scheduling and debounce cooling (lines 350–375).
  3. Window event listeners and ResizeObserver (lines 378–421).
  4. Full @dnd-kit coordination (sensors, handleDragStart, handleDragOver, handleDragEnd with cross-column section & item polymorphic logic, lines 432–563).
  5. Layout mode body classes (lines 570–579).
  6. Typography & dynamic spacing compilation (lines 583–613).
  7. YIQ color calculation (lines 616–665).
  8. Column resizer drag handler (lines 675–710).
  9. Onboarding tour / Joyride state & config (lines 712–787).
  10. Full document DOM hierarchy (#area-cv, fold guides, margin insets, columns, overlay, modal, tooltips).
- **Refactoring Blueprint**:
  - Extract pagination engine into src/utils/paginationEngine.js and custom hook usePaginationEngine.js.
  - Extract DnD coordination into useCVDndCoordinator.js.
  - Extract column resizer into useColumnResizer.js.
  - Extract fold guides & margin insets into A4PageGuides.jsx.
  - Target size for App.jsx: **< 280 lines**.

#### B. BaseSection.jsx (286 lines)
- **Duplications between PrintBaseSection and EditableBaseSection**:
  - Lines 48–50 & 135–137: wrapperClass calculation:
    `js
    const wrapperClass = descriptor.wrapperClass !== undefined 
      ? descriptor.wrapperClass 
      : ${descriptor.sectionClass}__container bd-grid;
    `
  - Lines 46 & 134: isListContainer = ContainerTag === 'ul' || ContainerTag === 'ol'.
  - Lines 65–76 & 208–222: duplicated item mapping logic (items.map(item => <BaseItem ... />)).
  - Line 197 & 235: BoxIcons <i className='bx bx-trash'> and <i className='bx bx-plus'>.
- **Refactoring Blueprint**:
  - Extract helper esolveSectionWrapperClass(descriptor) and isListContainerTag(tag) into pure utility.
  - Consolidate item list rendering into a shared template helper SectionItemsRenderer.
  - Migrate BoxIcons to lucide-react (Trash2, Plus).

#### C. staticHtmlPdfEngine.js (975 lines)
- **Dead / Unreachable Code & JSDOM Fallbacks**:
  - Line 547: enforceTwoColumnComponentPagination(doc, areaCv, pageHeightPx) is marked // JSDOM-ONLY FALLBACK. In live browsers, captureEditorSnapshot() captures exact break locations directly from the editor DOM.
  - Lines 809–899 vs 901–921: Two separate branches for applying page breaks — live editor snapshot path vs JSDOM-only fallback.
  - Line 768–780: CSS custom properties transfer from #area-cv to iframe root document. This was verified working and is essential for print parity.
- **Refactoring Blueprint**:
  - Retain clear // JSDOM-ONLY FALLBACK comments on test-only paths so unit tests continue passing without regression.
  - Delegate YIQ color calculations, 297mm ruler measurement, and typography generation to shared utility functions.

---

## Part 2: R4 — Deep Investigation of Visual Parity (1:1) between WYSIWYG Editor and PDF Clean Print

### 2.1 Geometry & Container Dimensions (0px Discrepancy)

- **Standard Width**:
  - Editor #area-cv: min-width: 794px; max-width: 794px; width: 100%; (App.jsx:835-837).
  - Print #area-cv: width: 794px !important; min-width: 794px !important; max-width: 794px !important; (print.css:32-34).
  - Static HTML generator: width: ; max-width: ; (staticHtmlPdfEngine.js:415, 426).
  - **Verdict**: Exact 794px match (standard A4 at 96 DPI: 210mm = 793.7px -> 794px).
- **Two-Column Split Geometry**:
  - Editor: gridTemplateColumns: % % (or 1fr 2fr default).
  - Print HTML: Identical grid-template-columns:  with matching leftColPercent.
  - Resizer: Clamped between 20% and 55% in editor; perfectly replicated in print inline style.

### 2.2 Page Margins & Padding Parity

- **2-Column Layout**:
  - Editor #area-cv: padding: 0.
  - Editor columns: padding: var(--page-padding, 2rem) var(--page-padding, 1.5rem).
  - Print HTML columns: padding: var(--page-padding, 2rem) var(--page-padding, 1.5rem).
  - Multi-page column break fix: print.css:49-50 applies -webkit-box-decoration-break: slice !important; box-decoration-break: slice !important; ensuring that when .resume__left and .resume__right fragment across pages, they do NOT duplicate the 48px top padding on page 2.
- **1-Column ATS Layout**:
  - Editor #area-cv: padding: var(--page-padding, 24px). .resume__single-column: padding: 0.
  - Print #area-cv: padding: var(--page-padding, 24px) !important. .resume__single-column: padding: 0 !important (print.css:56, 61).
  - ATS visual styling: In print, #area-cv.resume--ats-mode strips container borders and shadows (print.css:131-136).

### 2.3 Editor Gap vs Physical Print Pagination (gapPx = 20)

The single most critical architectural distinction between the WYSIWYG editor and print is the **20px visual fold gap**:
1. **In the Editor**:
   - The editor renders a continuous, scrollable canvas simulating multiple A4 sheets.
   - To make page boundaries visible, App.jsx inserts a 20px gap (.a4-page-fold-guide) between sheets:
     oldTop = pageNum * pageHeightPx + (pageNum - 1) * gapPx
     oldBottom = foldTop + gapPx
   - Total canvas height: 	otalPages * 297mm + (totalPages - 1) * 20px.
2. **In Clean Print / PDF**:
   - Physical paper is segmented by the printer / PDF renderer using @page { size: A4; margin: 0; }.
   - There is **0px gap** between sheets in print.
   - Canvas height in print: 	otalPages * 297mm.
3. **How 1:1 Parity is Maintained**:
   - In editor: Elements crossing the fold are pushed forward to 
extContentAreaTop = foldBottom + pagePadding.
   - In print: The same element receives reak-before: page !important; page-break-before: always !important; margin-top: var(--page-padding, 24px) !important;.
   - When the print engine paginates, the element is placed at the very top edge of page N+1 (0px), and margin-top: var(--page-padding, 24px) pushes it down by exactly the page margin.
   - Therefore, the distance from page top to content in the editor (pagePadding) matches the distance from physical page top to content in print (pagePadding) with 0px drift.

### 2.4 The Forbidden Boundary Zone Invariant

- **Definition**: The vertical interval surrounding any page fold:
  [foldTop - pagePadding .. foldBottom + pagePadding] (in editor coordinates)
  or [pageBottom - pagePadding .. pageTop + pagePadding] (in print coordinates).
- **Rule**:
  - No visible element (section title, block, bullet, experience item, contact item) may intersect this zone.
  - If an element intersects this boundary, it must be pushed completely across to oldBottom + pagePadding.
- **Runtime Guard**:
  - App.jsx:316-347 executes an exhaustive post-condition audit across all .cv-section, .cv-block, etc.
  - If any element's bounds intersect [forbiddenStart .. forbiddenEnd], in test mode it immediately throws FatalForbiddenZoneIncursionError.
  - All 6 unit tests in src/tests/forbidden-page-boundary-zone.test.jsx pass, confirming zero forbidden zone incursions in both 1-column and 2-column layouts.

### 2.5 CSS Architecture Single Source of Truth

- **src/index.css**: Contains **0** @media print blocks (verified via grep search).
- **src/styles/print.css**: Contains **all** print rules inside a single @media print { ... } block. Zero bare selectors exist outside @media print.
- **CSS Variable Transfer**: staticHtmlPdfEngine.js:768-780 iterates all custom properties starting with -- on editor #area-cv and assigns them to the print iframe's doc.documentElement with matching priorities.
- **Interactive Artifact Concealment**: 26 blacklisted interactive selectors (.drag-handle, .round-btn-del, .round-btn-add, .column-resizer, .section-action-buttons, etc.) are eliminated from the static HTML markup and suppressed via CSS without affecting container dimensions.

---

## Part 3: Review of Compliance with AGENTS.md

### 3.1 Drag & Drop Architecture (@dnd-kit vs swapy)
- **Invariant**: Must strictly use @dnd-kit (@dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities). Never use swapy.
- **Audit Finding**:
  - Grep search for swapy across src/ yielded **0 results**.
  - package.json contains @dnd-kit/core: ^6.1.0, @dnd-kit/sortable: ^8.0.0, @dnd-kit/utilities: ^3.2.2.
  - All drag-and-drop contexts in App.jsx, BaseSection.jsx, BaseItem.jsx, SortableBulletItem.jsx, and SpacerBlock.jsx use @dnd-kit.
  - **Compliance Status**: **100% COMPLIANT**.

### 3.2 Dynamic Tooltip & Popover Positioning
- **Invariant**: Tooltips/popovers must dynamically track getBoundingClientRect(), position adjacent (ect.right + 20px), flip to opposite side (ect.left - 320px) when approaching viewport boundary (window.innerWidth), and clamp vertically (window.innerHeight).
- **Audit Finding**:
  - SuggestionTooltip.jsx:20-48:
    `javascript
    let left = Math.round(rect.right + 20);
    if (left + TOOLTIP_WIDTH > vw) {
      left = Math.round(rect.left - 320);
    }
    if (left < 20) left = 20;
    let top = Math.round(rect.top);
    if (top + 400 > vh) top = vh - 420;
    if (top < 20) top = 20;
    `
  - SectionBulletStylePopover.jsx:46-76: Dynamic coordinates anchored to 	riggerRect, flips vertically if escaping bottom, clamps horizontally.
  - **Compliance Status**: **100% COMPLIANT**.

### 3.3 Obsidian Callout Visual Standard
- **Invariant**:
  - Danger / Critical: Background gba(233, 49, 71, 0.1), 4px solid left border gba(233, 49, 71, 1), red bold title, OctagonAlert icon.
  - Caution / Warning: Background gba(219, 139, 0, 0.1), 4px solid left border gba(219, 139, 0, 1), orange bold title, TriangleAlert icon.
  - Info: Background gba(8, 109, 221, 0.1), 4px solid left border gba(8, 109, 221, 1), blue bold title, Info icon.
  - Structure: .obsidian-callout, .callout-title (display: flex, gap: 8px, font-weight: 600), .callout-content.
- **Audit Finding**:
  - SuggestionTooltip.jsx:179-225: Strictly implements these exact rgba colors, 4px left borders, and lucide-react icons (OctagonAlert, TriangleAlert, Info).
  - **Compliance Status**: **100% COMPLIANT**.

### 3.4 Iconography Migration Note (BoxIcons vs lucide-react)
- **Finding**: While all callout/tooltip icons and new UI features use lucide-react, legacy BoxIcons (<i className='bx bx-*'>) remain in:
  - App.jsx:984, 1109, 1142 (x bx-plus-circle)
  - BaseSection.jsx:197, 235 (x bx-trash, x bx-plus)
  - BaseItem.jsx:118 (x bx-minus)
  - DragHandle.jsx:15 (x bx-grid-vertical)
  - ActionMenu.jsx:904 (x bx-export)
  - SortableBulletItem.jsx:97 (x bx-minus)
  - Item headers and action buttons in AwardsItem, CertificatesItem, PublicationsItem, ReferencesItem, ExperienceItem, ProjectsItem, VolunteeringItem.
- **Special Attention for R3 Implementation**:
  - Existing tests in src/tests/iconography.test.jsx, src/tests/adversarial-challenger.test.jsx, and src/tests/dynamic-contacts.test.jsx specifically verify that contact links and CV header social links preserve BoxIcons (x bx-envelope, x bx-phone, etc.).
  - When migrating action buttons and drag handles to lucide-react, contact type icons should either be handled in tandem with test updates or carefully scoped per requirement specifications.

---

## Part 4: Proposed Refactoring Architecture & Implementation Plan

### 4.1 New Modular Utilities & Hooks to Create

1. **src/utils/colorUtils.js**
   - getYiqContrast(hexColor): Computes YIQ luminance score (0..255).
   - djustColor(hexColor, amount): Pure color lightness shifter.
   - getDynamicThemeColors(hexColor): Returns both CSS custom properties (--title-color, --text-color, etc.) and camelCase properties (	itleColor, 	extColor, etc.).
   - *Impact*: Eliminates duplication between App.jsx:616-665 and staticHtmlPdfEngine.js:186-220.

2. **src/utils/pageGeometry.js**
   - measureA4PageHeightPx(doc = document): Measures 297mm height via temporary ruler div with caching and SSR/JSDOM fallback (1123px).
   - getRelativeBounds(element, containerElement): Pure relative bounds calculation with fallback.
   - calculatePageFolds(pageCount, pageHeightPx, pageGapPx, pagePadding): Unified mathematical model for fold boundaries and forbidden zones.
   - *Impact*: Eliminates 4 duplicate ruler div measurements and 5 duplicate relative bounding implementations.

3. **src/utils/typographyUtils.js**
   - FONT_FAMILIES: Central registry of supported fonts (Poppins, Inter, Roboto, Merriweather, JetBrains Mono).
   - uildDynamicSpacingVars(layout): Pure function transforming layout state into CSS variable dictionary and inline style string.
   - *Impact*: Eliminates duplicate font dictionaries and spacing objects between App.jsx and staticHtmlPdfEngine.js.

4. **src/utils/paginationEngine.js**
   - BREAKABLE_SELECTORS: Constant array of breakable selectors.
   - getBreakableElements(container): Pure traversal and ancestor-filtering function.
   - uditForbiddenZoneIncursions(areaCv, finalPages, pageHeightPx, pageGapPx, pagePadding): Standalone invariant auditor.
   - computePaginationBreaks(...): Pure multi-pass break resolution algorithm.
   - *Impact*: Decouples pagination math from React component rendering; enables isolated unit testing.

5. **src/hooks/usePaginationEngine.js**
   - Encapsulates ecalculatePagination, RAF scheduling, debouncing cooldown (30ms), ResizeObserver, and cv-spacer-live-resize event listener.
   - *Impact*: Removes ~350 lines from App.jsx.

6. **src/hooks/useCVDndCoordinator.js**
   - Encapsulates @dnd-kit sensors, handleDragStart, handleDragOver, handleDragEnd, and polymorphic column/item reordering.
   - *Impact*: Removes ~140 lines from App.jsx.

7. **src/components/CV/A4PageGuides.jsx**
   - Dedicated component for rendering .a4-page-fold-guide and .a4-page-inset.
   - *Impact*: Removes ~80 lines of inline JSX from App.jsx.

---

## Part 5: Verification & Safety Matrix

- **Vitest Baseline**: 40 test files passed (40/40), 667 unit and integration tests passed (100% success rate).
- **Critical Test Suites to Guard Against Regression**:
  1. src/tests/forbidden-page-boundary-zone.test.jsx (Invariant audit: 0 incursions in forbidden boundary zones).
  2. src/tests/pixelParityEditorPrint.test.jsx (0px drift between editor DOM and print snapshot).
  3. src/tests/cleanPrintEngineVerification.test.jsx (Verification of the 3 style tags and 0 interactive artifacts).
  4. src/tests/two-column-pdf-pagination-and-extension.test.jsx (Multi-page 2-column pagination and column extension).
  5. src/tests/dom-geometry-typography.test.jsx (Typography scale, fonts, and geometry tokens).
  6. src/tests/staticHtmlPdfEngine.test.js (Iframe lifecycle, document title sanitization, adaptive scale).
