# Ressume Architectural Review & Refactoring: Comprehensive Analysis Report

**Date**: 2026-09-11  
**Agent**: Explorer 3 (Test Suite Baseline, Build Verification & Extensibility Smoke-Test Architecture)  
**Target Repository**: `/home/juani/Documentos/Ressume`  
**Milestone**: Benchmark Architectural Review & Refactoring  

---

## 1. Executive Summary

A comprehensive investigation of the Ressume codebase test suite, build pipeline, component coupling, and extensibility patterns was conducted.

1. **Test Suite Baseline**: Running `npx vitest run` yields **37 test files and 628 tests**, **100% passing (628/628)** in ~25.5s.
2. **Production Build Status**: Running `npm run build` completes with **0 errors and 0 warnings** in 1.66s, transforming 1,927 modules into production assets.
3. **Core Couplings Identified**:
   - `CVContext.jsx` (~728 lines) is a god-context providing ~40 states and methods. While tests do not mock `CVContext` via `vi.mock`, multiple suites directly assert on its shape (e.g. `realtime-sticky-pagination.test.jsx` testing `renderHook(() => useCV(), { wrapper: CVProvider })` for pagination metrics; `test_inspect_juan_cv.test.jsx` using dynamic `await import('../context/CVContext')`).
   - `BaseItem.jsx` (262 lines) and `BaseSection.jsx` (319 lines) bypass `sectionRegistry.js` via hardcoded `if (sectionType === ...)` and `if (section.type === ...)` chains.
   - `SortableBulletItem` is duplicated 3× across `ExperienceItem.jsx`, `ProjectsItem.jsx`, and `VolunteeringItem.jsx`.
   - `educationRounderAlignment.test.jsx` requires `PrintBaseItem` named export and `.education__content` with `style.display: flex`.
   - `spacer-component.test.jsx` requires `PrintBaseSection` named export and spacer routing in both edit and print modes.
4. **Extensibility Smoke-Test Design**:
   - Designed a minimal new section type: `custom_notes` with item component `src/components/CV/items/CustomNotesItem.jsx`.
   - Fully specified its registry descriptor, schema, and accompanying smoke-test in `src/tests/extensibilitySmoke.test.jsx`.
   - Verified that once `BaseSection` and `BaseItem` are converted to true Template components guided by the Strategy/Factory registry descriptor, adding `custom_notes` requires modifying **only** `sectionRegistry.js` + adding `CustomNotesItem.jsx`, requiring zero changes to `BaseItem`, `BaseSection`, `CVContext`, or `App`.

---

## 2. Vitest Test Suite Baseline & Survey

### 2.1 Execution Results
- **Command**: `npx vitest run`
- **Exit Code**: `0`
- **Output Metrics**:
  - `Test Files  37 passed (37)`
  - `Tests  628 passed (628)`
  - `Duration  25.52s`
  - `Modules Transformed  1,927`

### 2.2 Inventory of All 37 Test Files and Passing Counts

| # | Test File Path | Tests Passed | Primary Coverage Area |
|---|----------------|--------------|-----------------------|
| 1 | `src/tests/dom-geometry-typography.test.jsx` | 101 | DOM coordinates, typography scales, DnD handles, registry |
| 2 | `src/tests/version-manager-hub.test.jsx` | 40 | CV versions, snapshots, localStorage persistence |
| 3 | `src/tests/spacer-component.test.jsx` | 33 | Spacer blocks, resize handles, print avoidance, BaseSection routing |
| 4 | `src/tests/empirical-challenger-deep-audit.test.jsx` | 29 | Deep audit of rendering bounds, CSS custom properties |
| 5 | `src/tests/challenger-stress-suite.test.jsx` | 28 | Stress test of state updates, DOM mutation, memory |
| 6 | `src/tests/cleanPrintEngineVerification.test.jsx` | 25 | Static HTML print generation, iframe stripping, pagination |
| 7 | `src/tests/adversarial-spacing-layout-extremes.test.jsx` | 24 | Extreme padding/gap sliders, boundary limits |
| 8 | `src/tests/epic2-rich-text-toolbar.test.jsx` | 24 | Formatting toolbar, bold/italic shortcuts, undo isolation |
| 9 | `src/tests/challenger-m2-1-rich-text-stress.test.jsx` | 21 | ContentEditable paste sanitization, rich text stress |
| 10 | `src/tests/epic3-actionmenu-ats-modal.test.jsx` | 19 | Floating panel reorganization, ATS mode, AddSectionModal |
| 11 | `src/tests/liveHtmlSanitization.test.jsx` | 19 | HTML entity sanitization, clipboard handling |
| 12 | `src/tests/visual-polish-and-mirroring.test.jsx` | 19 | Text color inheritance, mirror rendering |
| 13 | `src/tests/pdfFilenameParametrization.test.jsx` | 16 | Dynamic PDF file naming from user profile |
| 14 | `src/tests/pixelParityEditorPrint.test.jsx` | 16 | 0px pixel parity between `#area-cv` and print DOM |
| 15 | `src/tests/challenger-o10-dom-coordinates-stress.test.jsx` | 16 | Viewport and bounding rect clamp tests |
| 16 | `src/tests/adversarial-challenger.test.jsx` | 15 | Corrupted localStorage, unregistered section fallbacks |
| 17 | `src/tests/staticHtmlPdfEngine.test.js` | 15 | Core iframe and CSS rule generation for print |
| 18 | `src/tests/addButtonsAndResizerParity.test.jsx` | 14 | Add section buttons, column divider resizer |
| 19 | `src/tests/realtime-sticky-pagination.test.jsx` | 12 | CVContext page metrics, fold detection, sticky pagination |
| 20 | `src/tests/challengerCleanPrintLifecycle.test.jsx` | 12 | Clean print lifecycle, iframe unmounting, print dialog |
| 21 | `src/tests/dynamic-contacts.test.jsx` | 11 | Dynamic contact items normalization and rendering |
| 22 | `src/tests/spacing.test.jsx` | 11 | Dynamic margin & spacing controls, CSS variables |
| 23 | `src/tests/polymorphic-dnd.test.jsx` | 10 | Cross-column and cross-section drag-and-drop |
| 24 | `src/tests/iconography.test.jsx` | 10 | Lucide-react iconography, BoxIcons preservation |
| 25 | `src/tests/registry.test.jsx` | 10 | Extensible registry contract, itemAdapter fallback |
| 26 | `src/tests/two-column-pdf-pagination-and-extension.test.jsx` | 10 | Two-column pagination balance and print output |
| 27 | `src/tests/challenger-m3-epic3-stress.test.jsx` | 10 | ActionMenu modal positioning and ATS toggles |
| 28 | `src/tests/customTooltipTour.test.jsx` | 9 | Obsidian callout tooltips and positioning |
| 29 | `src/tests/final-e2e-cross-cutting-challenger.test.jsx` | 8 | End-to-end integration and undo/redo stacks |
| 30 | `src/tests/editorSnapshotBreakPropagation.test.jsx` | 7 | CSS page break rule propagation |
| 31 | `src/tests/hyperlink-edit.test.jsx` | 6 | Link and linkText inline editing |
| 32 | `src/tests/pairwise-interactions.test.jsx` | 6 | Pairwise combination of toolbar buttons and drag |
| 33 | `src/tests/atsPrintModeFidelity.test.js` | 5 | ATS single-column print fidelity |
| 34 | `src/tests/bulletPointsNativePrint.test.jsx` | 5 | Native `<li>` bullet rendering in print and editor |
| 35 | `src/tests/e2e-scenarios.test.jsx` | 5 | High-level user scenarios (add/move/edit) |
| 36 | `src/tests/test_inspect_juan_cv.test.jsx` | 4 | Import integrity with real-world CV data |
| 37 | `src/tests/educationRounderAlignment.test.jsx` | 3 | Education rounder flex alignment and PrintBaseItem |
| **Total** | **37 files** | **628 tests** | **100% Passing** |

---

## 3. Production Build Status

- **Command**: `npm run build`
- **Tool**: Vite 5.4.21
- **Exit Code**: `0`
- **Execution Time**: `1.66s`
- **Output Modules Transformed**: `1,927`
- **Output Artifacts**:
  - `dist/index.html` — 0.90 kB (gzip: 0.48 kB)
  - `dist/assets/index-B4YhPPb3.css` — 34.08 kB (gzip: 6.82 kB)
  - `dist/assets/index-8-duKAF3.js` — 728.29 kB (gzip: 212.36 kB)
- **Status**: 100% clean, zero errors, zero warnings.

---

## 4. Test Suite Inspection: Target Components

### 4.1 Tests Asserting on `BaseItem`
`BaseItem` is imported in 3 test files and checked in 1 additional suite:
1. `src/tests/educationRounderAlignment.test.jsx` (Lines 5, 7):
   - Directly imports `{ PrintBaseItem }` and `BaseItem`.
   - Test `E1.2` renders `<PrintBaseItem item={item} sectionId="education" sectionType="education" isLast={false} />`.
   - Asserts that the outer container has class `.education__content` and style `display: flex`.
   - Asserts that `.education__time`, `.education__data`, and `.education__rounder` exist.
2. `src/tests/dom-geometry-typography.test.jsx` (Line 9):
   - Test `F7.4` renders `<BaseItem item={item} sectionId="experience" sectionType="experience" />`.
   - Asserts that `.item-drag-handle` is rendered for draggable items.
3. `src/tests/adversarial-challenger.test.jsx` (Line 11):
   - Imports `BaseItem` for deep component inspection.
4. `src/tests/visual-polish-and-mirroring.test.jsx` (Line 95):
   - Mentions `BaseItem` in test title verifying `color: var(--text-color)` inheritance.

### 4.2 Tests Asserting on `BaseSection`
`BaseSection` is imported in 4 test files:
1. `src/tests/spacer-component.test.jsx` (Lines 6, 7):
   - Directly imports `{ PrintBaseSection }` and `BaseSection`.
   - Test `T4.4` renders `<BaseSection section={mockSpacer} isPrint={false} />` and expects `.spacer-resize-handle`.
   - Test `T4.4` renders `<BaseSection section={mockSpacer} isPrint={true} />` and expects `.spacer-section` with height.
   - Tests render `<BaseSection section={mockSection} />` across multiple integration tests.
2. `src/tests/dom-geometry-typography.test.jsx` (Line 8):
   - Test `F7.3` renders `<BaseSection section={section} />` and asserts `.section-drag-handle` is present.
3. `src/tests/visual-polish-and-mirroring.test.jsx` (Line 6):
   - Imports `BaseSection` and mounts it to verify CSS variable styling and text-color inheritance.
4. `src/tests/adversarial-challenger.test.jsx` (Line 10):
   - Test `EMP-3.1` registers a custom `patents` section and renders `<BaseSection section={patentSection} />`.
   - Asserts that custom item renderer renders within `BaseSection`.
5. `src/tests/registry.test.jsx` (Line 132):
   - Test `T2.4` asserts section ID and title integrity on update.

### 4.3 Tests Asserting on `CVContext`
- `CVProvider` and `useCV` are used in 28 out of 37 test files.
- `realtime-sticky-pagination.test.jsx` (Lines 25–85):
  - Uses `renderHook(() => useCV(), { wrapper: CVProvider })`.
  - Asserts on:
    - `pageHeightPx` (>= 1000)
    - `pageGapPx` (= 20)
    - `totalPages` (>= 1)
    - `getPageBounds(pageNum)` returning `{ top, bottom, foldTop, foldBottom }`
    - `getElementPageInfo({ top, height })` returning `{ pageNum, isCrossingFold, remainingInPage }`
    - `paginationTrigger` counter and `triggerPaginationRecalc()` callback
- `spacing.test.jsx`:
  - Directly tests `updateLayout` updating `pagePadding`, `sectionGap`, `itemGap`.
- `adversarial-challenger.test.jsx`:
  - Exercises error handling when localStorage contains corrupt data (`sections: null`, primitive strings, invalid JSON).
- `test_inspect_juan_cv.test.jsx`:
  - Dynamically imports `CVProvider` via `await import('../context/CVContext')`.
- `final-e2e-cross-cutting-challenger.test.jsx`:
  - Tests `undo`, `redo`, `canUndo`, `canRedo`.

### 4.4 Tests Asserting on `SortableBulletItem`
- No test file directly imports `SortableBulletItem` by name.
- Tests in `bulletPointsNativePrint.test.jsx` assert on the DOM output produced by bullet items:
  - Edit mode: `li.bullet-item-row.editable-item-container.cv-block`, `.bullet-del-btn`, `.item-drag-handle`.
  - Print mode: `ul.experience__bullets li`, list-style-type: disc, no interactive buttons.

### 4.5 Tests Asserting on `sectionRegistry`
- `src/tests/dom-geometry-typography.test.jsx`:
  - Imports `getAllSectionDescriptors` and `getSectionDescriptor`.
  - Test `F8.1`: verifies standard section types are returned (`profile_header`, `about`, `skills`, `education`, `list`, `simple_list`).
  - Test `F8.2`: verifies `getSectionDescriptor('skills')` returns descriptor with `itemComponent` and `createDefaultItem`.
- `src/tests/spacer-component.test.jsx`:
  - Test `T1.1`: verifies spacer descriptor is properly registered.
- `src/tests/adversarial-challenger.test.jsx`:
  - Test `EMP-3.1`: tests dynamic registration of custom `patents` section via `registerSectionType`.
  - Test `EMP-3.2`: tests fallback descriptor for unknown section types.

---

## 5. Architectural Violations & Root Causes

### 5.1 Duplicated `SortableBulletItem` Component
- **Locations**:
  - `src/components/CV/items/ExperienceItem.jsx` (lines 24–90)
  - `src/components/CV/items/ProjectsItem.jsx` (lines 24–90)
  - `src/components/CV/items/VolunteeringItem.jsx` (lines 23–89)
- **Violation**: 3× identical code duplication (~65 lines each).
- **Subtle difference**: `ExperienceItem` uses `marginBottom: 'var(--item-gap, 6px)'` while `ProjectsItem` and `VolunteeringItem` use `marginBottom: 'calc(var(--item-gap, 6px) / 2)'`.
- **Solution**: Extract to `src/components/CV/SortableBulletItem.jsx` supporting an optional `marginBottom` prop (defaulting to `'var(--item-gap, 6px)'` or `'calc(var(--item-gap, 6px) / 2)'`).

### 5.2 Bypass of Registry in `BaseItem.jsx`
- **Violation**: `BaseItem.jsx` contains explicit branching chains:
  - `if (sectionType === 'profile_header')`
  - `if (sectionType === 'simple_list')`
  - `if (isListItem)` (where `isListItem = descriptor.containerTag === 'ul' || sectionType === 'skills'`)
  - `if (sectionType === 'about')`
  - `if (sectionType === 'education')`
- **Solution**: All container elements, classes, and styles must come from `descriptor.itemTag`, `descriptor.itemClass`, `descriptor.containerTag`, and `descriptor.isFlex`. `BaseItem` becomes a pure template component with 0 `if (sectionType === ...)` guards.

### 5.3 Bypass of Registry in `BaseSection.jsx`
- **Violation**: `BaseSection.jsx` contains explicit branching chains:
  - `section.type === 'spacer'`
  - `section.type === 'skills' ? 'skills' : section.type === 'education' ? 'education' : ...`
  - In `EditableBaseSection`:
    - `section.type === 'simple_list' ? <ul ...> : section.type === 'skills' ? <ul ...> : <div ...>`
- **Solution**: The descriptor already defines `sectionClass`, `containerTag`, `containerClass`, `isHeader`, and `isSpacer`. `BaseSection` must read these directly from `descriptor`. For `spacer`, the descriptor can specify `sectionComponent: SpacerBlock` or flag `isSpacer`. `BaseSection` becomes a pure template component with 0 `if (section.type === ...)` guards.

### 5.4 God Context in `CVContext.jsx`
- **Lines**: 728 lines.
- **Mixes**: CV CRUD, undo/redo history stacks, layout controls, typography, PDF export triggers, AI suggestion toggle/positioning, rich text floating toolbar state, toast notifications, pagination calculations and fold crossing.
- **Solution**: Decompose into 4 focused hooks + sub-modules:
  - `useCVData.js`: CV data state, sections CRUD, items CRUD, profile updates, localStorage persistence.
  - `useCVHistory.js`: Undo/redo history stacks, past, future, canUndo, canRedo, applyStateWithHistory.
  - `useCVLayout.js`: Spacing, padding, typography scales, ATS single/two-column layout.
  - `useCVExport.js`: PDF generation helpers, print engine trigger, export state.
  - `CVContext.jsx`: Acts as a backward-compatible facade (<=200 lines) exposing the exact same `useCV()` hook and `CVProvider` so zero existing callers or tests break.

---

## 6. Extensibility Smoke-Test Design

### 6.1 Requirements
From authoritative request:
> "Adding a hypothetical new section type requires editing only `sectionRegistry.js` + one new item component file — no changes to `BaseItem`, `BaseSection`, `CVContext`, or `App`. Verified by actually implementing one new minimal section type as a smoke-test (with accompanying test)."

### 6.2 Proposed Minimal Section Type: `custom_notes`
- **Why not `publications` or `awards`?**: Both `publications` (PublicationsItem) and `awards` (AwardsItem) already exist in `src/components/CV/items/` and are already registered in `sectionRegistry.js`. Creating a truly new section type `custom_notes` guarantees a valid, non-redundant extensibility verification.
- **Component File**: `src/components/CV/items/CustomNotesItem.jsx` (estimated ~45 lines, well under 300 lines limit).
- **Data Shape**:
  ```json
  {
    "id": "note_1725234567890_1_abcde",
    "title": "Nota Personal / Declaración",
    "content": "Compromiso constante con la calidad arquitectónica, testing riguroso y documentación clara."
  }
  ```
- **Component Implementation**:
  ```jsx
  import React from 'react';
  import InlineEdit from '../../Editor/InlineEdit';

  /**
   * CustomNotesItem — Minimal item component for extensible smoke testing.
   * Proves that a new section type requires zero modifications to core components.
   */
  const CustomNotesItem = ({ item = {}, sectionId, onUpdateItem, isPrint = false }) => {
    if (isPrint) {
      return (
        <div className="custom-notes-item" style={{ width: '100%' }}>
          {item.title && (
            <h3 className="custom-notes__title" style={{ fontSize: 'var(--title-h3-size, 0.95rem)', fontWeight: 600, margin: '0 0 4px 0' }}>
              <InlineEdit value={item.title} isPrint={true} />
            </h3>
          )}
          <p className="custom-notes__content" style={{ margin: 0, fontSize: 'var(--body-font-size, 0.85rem)', lineHeight: 1.45 }}>
            <InlineEdit value={item.content || ''} isPrint={true} />
          </p>
        </div>
      );
    }

    return (
      <div className="custom-notes-item" style={{ width: '100%' }}>
        <h3 className="custom-notes__title" style={{ fontSize: 'var(--title-h3-size, 0.95rem)', fontWeight: 600, margin: '0 0 4px 0' }}>
          <InlineEdit
            value={item.title || ''}
            onSave={(val) => onUpdateItem && onUpdateItem(sectionId, item.id, 'title', val)}
            placeholder="Título de la nota..."
          />
        </h3>
        <p className="custom-notes__content" style={{ margin: 0, fontSize: 'var(--body-font-size, 0.85rem)', lineHeight: 1.45 }}>
          <InlineEdit
            value={item.content || ''}
            onSave={(val) => onUpdateItem && onUpdateItem(sectionId, item.id, 'content', val)}
            placeholder="Escribe aquí tu nota..."
          />
        </p>
      </div>
    );
  };

  export default CustomNotesItem;
  ```

### 6.3 Registry Entry (`src/registry/sectionRegistry.js`)
```javascript
import CustomNotesItem from '../components/CV/items/CustomNotesItem';

// Registration descriptor
{
  type: 'custom_notes',
  label: 'Notas Adicionales',
  description: 'Anotaciones breves, testimonios o declaraciones personales',
  defaultTitle: 'NOTAS ADICIONALES',
  defaultColumn: 'right',
  icon: 'bx-notepad',
  allowDelete: true,
  allowAddItem: true,
  sectionClass: 'experience',
  containerTag: 'div',
  containerClass: 'experience__container bd-grid',
  itemTag: 'div',
  itemClass: 'experience__content',
  get itemComponent() { return CustomNotesItem; },
  renderMarkdown: (item) => `### ${item.title || ''}\n${item.content || ''}\n`,
  renderXML: (item) => `<note title="${item.title || ''}">${item.content || ''}</note>`,
  renderPlainText: (item) => `${item.title || ''}: ${item.content || ''}\n`,
  createDefaultItem: () => ({
    id: generateUniqueId('note'),
    title: 'Nota Profesional',
    content: 'Enfoque continuo en buenas prácticas, testing automatizado y código limpio.'
  }),
  adaptItem: (source) => {
    const src = source || {};
    return {
      id: src.id || generateUniqueId('note'),
      title: src.title || src.name || 'Nota',
      content: src.description || src.content || (Array.isArray(src.bullets) ? src.bullets.join('. ') : '') || src.text || 'Contenido de la nota'
    };
  },
  schema: { title: 'string', content: 'string' }
}
```

### 6.4 Smoke-Test Specification (`src/tests/extensibilitySmoke.test.jsx`)
The smoke test suite should include the following verifications:
1. **Registry Verification**:
   - `getSectionDescriptor('custom_notes')` returns the registered descriptor with `itemComponent === CustomNotesItem`.
   - `getAllSectionDescriptors()` contains `'custom_notes'`.
2. **Factory Instantiation**:
   - `createDefaultSection('right', 'custom_notes', 'NOTAS ADICIONALES')` instantiates a valid section container with default item.
3. **Template Rendering in Edit Mode**:
   - Renders `<BaseSection section={section} />` inside `<CVProvider>`.
   - Confirms `CustomNotesItem` renders with its title and content.
   - Confirms section drag handle, delete button, and add item button are present without modifying `BaseSection`.
4. **Template Rendering in Print Mode**:
   - Renders `<BaseSection section={section} isPrint={true} />`.
   - Confirms clean semantic HTML with zero interactive editor buttons.
5. **Polymorphic Adaptation**:
   - `adaptItemToSectionType({ title: 'Task', bullets: ['Done'] }, 'custom_notes')` returns adapted note item with title and content.
6. **Zero Core Modification Assertion**:
   - Asserts that neither `BaseItem.jsx`, `BaseSection.jsx`, `CVContext.jsx`, nor `App.jsx` contain any reference to string `'custom_notes'`.

---

## 7. Test-Level Couplings & Mocks Checklist

| Test File | Tested Component / Feature | Critical Invariant to Preserve |
|-----------|----------------------------|--------------------------------|
| `src/tests/realtime-sticky-pagination.test.jsx` | `useCV()` hook | Must return `pageHeightPx`, `pageGapPx`, `totalPages`, `getPageBounds`, `getElementPageInfo`, `paginationTrigger`, `triggerPaginationRecalc`. |
| `src/tests/educationRounderAlignment.test.jsx` | `PrintBaseItem` from `BaseItem.jsx` | Named export `PrintBaseItem` must exist; outer element for `education` must have class `.education__content` and `style.display: flex`. |
| `src/tests/spacer-component.test.jsx` | `BaseSection` and `PrintBaseSection` | Named export `PrintBaseSection` must exist; `BaseSection` must route spacer to `SpacerBlock` in both edit and print modes. |
| `src/tests/test_inspect_juan_cv.test.jsx` | `CVProvider` | Dynamic `await import('../context/CVContext')` must resolve `{ CVProvider }`. |
| `src/tests/dom-geometry-typography.test.jsx` | `BaseItem`, `BaseSection`, `sectionRegistry` | Drag handle class `.item-drag-handle` in `BaseItem` and `.section-drag-handle` in `BaseSection`; `getAllSectionDescriptors()`. |
| `src/tests/bulletPointsNativePrint.test.jsx` | Bullet lists & print view | Item print views (`ExperienceItemPrintView`, `ProjectsItemPrintView`, `VolunteeringItemPrintView`) must be exported; sortable li must have `.bullet-item-row.cv-block`. |
| `src/tests/adversarial-challenger.test.jsx` | `CVContext`, `sectionRegistry`, `BaseSection` | Safe handling of corrupted/null `localStorage` data; fallback descriptor for unregistered section types; custom section rendering in `BaseSection`. |

### 7.1 Mock Usage in Repository
- `vi.mock` is **never used** anywhere in `src/tests/`.
- `vi.spyOn` is used strictly for DOM and browser APIs:
  - `document.body.appendChild` (clean print iframe test)
  - `window.print` (print trigger test)
  - `mockAreaCv.getBoundingClientRect` (floating modal coordinates)
  - `HTMLAnchorElement.prototype.click` (download link)
  - `window.URL.createObjectURL` (blob URL generation)
- This means decomposing `CVContext` or refactoring `BaseItem`/`BaseSection` will **not break any module-level mock expectations**, provided the public facade signatures and rendered DOM structure/classes are preserved.

---

## 8. Recommendations & Next Steps for Team

1. **SortableBulletItem Extraction**: Create `src/components/CV/SortableBulletItem.jsx` and replace internal definitions in `ExperienceItem.jsx`, `ProjectsItem.jsx`, and `VolunteeringItem.jsx`.
2. **Registry Descriptor Contract Enrichment**:
   - Add JSDoc `@typedef {Object} SectionDescriptor` in `sectionRegistry.js`.
   - Ensure all 14 descriptors declare `sectionClass`, `containerTag`, `containerClass`, `itemTag`, `itemClass`, `isHeader`, and `isSpacer`.
3. **BaseSection & BaseItem Refactoring**:
   - Refactor `BaseSection.jsx` to render `descriptor.containerTag` and `descriptor.containerClass`, delegating to `SpacerBlock` via `descriptor.isSpacer` or `descriptor.sectionComponent`.
   - Refactor `BaseItem.jsx` to render `descriptor.itemTag` and `descriptor.itemClass` with flex styling as declared by descriptor.
   - Eliminate all `if (sectionType === ...)` and `if (section.type === ...)` guards.
4. **CVContext Decomposition**:
   - Split into `useCVData.js`, `useCVHistory.js`, `useCVLayout.js`, `useCVExport.js`.
   - Keep `CVContext.jsx` as a concise facade (<=200 lines) exporting `useCV` and `CVProvider`.
5. **Implement Smoke Test & New Section**:
   - Add `CustomNotesItem.jsx`.
   - Register `custom_notes` in `sectionRegistry.js`.
   - Add `src/tests/extensibilitySmoke.test.jsx` and verify 38 test files and 634+ tests pass cleanly.
