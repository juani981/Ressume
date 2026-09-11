# Project: Ressume Architecture Review & Refactoring

## Architecture
Ressume is a React 18 + Vite client-side CV editor with drag-and-drop (`@dnd-kit`), dynamic CSS layout, and print/PDF generation.
The target architecture refactors the system into:
1. **Shared Components**: Unified `SortableBulletItem.jsx` replacing 3x copy-pasted implementations.
2. **Template + Factory + Strategy Section Rendering**:
   - `sectionRegistry.js` defines full visual & functional descriptors for each section type (`SectionDescriptor` JSDoc `@typedef`).
   - `BaseSection.jsx` and `BaseItem.jsx` become pure template components with ZERO `if (sectionType === ...)` or `if (section.type === ...)` guards.
3. **Decomposed State Architecture**:
   - `src/context/hooks/useCVData.js`: Data & CRUD operations, persistence, i18n dictionary (<=250 lines).
   - `src/context/hooks/useCVHistory.js`: Undo/redo stack, keyboard shortcuts (<=250 lines).
   - `src/context/hooks/useCVLayout.js`: Layout mode, column assignments, pagination geometry (<=250 lines).
   - `src/context/hooks/useCVExport.js`: Clean print lifecycle, toast notifications (<=250 lines).
   - `src/context/CVContext.jsx`: Thin facade composing the hooks, maintaining 100% backward compatibility for all 48 public API members (<=200 lines).
   - Barrel exports via `src/context/hooks/index.js` and `src/context/index.js`.
4. **Extensibility Contract**:
   - Adding a new section type requires editing ONLY `sectionRegistry.js` + 1 new item component file.
   - Verified by minimal section smoke-test (`custom_notes` / `CustomNotesItem.jsx`).
5. **Code Review Audit**:
   - Comprehensive audit report in `docs/code-review.md` covering all files in `src/components/CV/` and `src/context/`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Comprehensive Audit Report | `docs/code-review.md` covering every file in `src/components/CV/` and `src/context/`, citing exact lines, impact ratings, safe vs side-effect imports, 5+ known issues | M1 | Survey / DISPATCH |
| 2 | SortableBulletItem Extraction | Shared `SortableBulletItem.jsx` imported by ExperienceItem, ProjectsItem, VolunteeringItem (exactly 1 file) | M2 | Survey / DISPATCH |
| 3 | Section Descriptor JSDoc Contract | Unified `SectionDescriptor` `@typedef` in `sectionRegistry.js` declaring tags, classes, styles, and behaviors | M3 | Survey / DISPATCH |
| 4 | BaseItem Zero-Guard Template | Eliminate all `if (sectionType === ...)` branches; pure registry dispatch | M3 | Survey / DISPATCH |
| 5 | BaseSection Zero-Guard Template | Eliminate all `if (section.type === ...)` branches; pure registry dispatch | M3 | Survey / DISPATCH |
| 6 | CVContext Decomposition | Split into `useCVData`, `useCVHistory`, `useCVLayout`, `useCVExport` with barrel exports | M4 | Survey / DISPATCH |
| 7 | CVContext Facade & Compatibility | `CVContext.jsx` facade <=200 lines, each hook <=250 lines, all 48 properties preserved on `useCV()` | M4 | Survey / DISPATCH |
| 8 | Extensibility Smoke-Test Section | Minimal section type `custom_notes` modifying only registry + `CustomNotesItem.jsx` (zero edits to BaseItem, BaseSection, CVContext, App) | M5 | Survey / DISPATCH |
| 9 | Full Regression & Build Verification | All 628 existing Vitest tests + new smoke test passing; `npm run build` succeeds with 0 errors | M5 | Survey / DISPATCH |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Audit Report | Write `docs/code-review.md` covering all files in `src/components/CV/` and `src/context/` | Survey | DONE |
| 2 | M2: SortableBulletItem | Create `SortableBulletItem.jsx`, update Experience, Projects, Volunteering items | None | DONE |
| 3 | M3: BaseItem/BaseSection Zero-Guard | Update `sectionRegistry.js` descriptors, refactor BaseItem and BaseSection with 0 guards | M2 | DONE |
| 4 | M4: CVContext Decomposition | Split into 4 hooks (`useCVData`, `useCVHistory`, `useCVLayout`, `useCVExport`), facade <=200 lines | None | DONE |
| 5 | M5: Extensibility Smoke-Test & Gate Verification | Add `CustomNotesItem.jsx`, test `extensibilitySmoke.test.jsx`, full Vitest & build check, forensic audit | M1, M3, M4 | PLANNED |

## Interface Contracts
### `SectionDescriptor` Contract (`src/registry/sectionRegistry.js`)
- `type`: string (unique key)
- `label`: string
- `defaultTitle`: string
- `defaultColumn`: 'left' | 'right'
- `icon`: string
- `allowDelete`: boolean
- `allowAddItem`: boolean
- `allowDeleteItem`: boolean
- `hasTitle`: boolean
- `hasItemDrag`: boolean
- `supportsBulletCustomization`: boolean
- `sectionClass`: string
- `wrapperClass`: string (or undefined for default grid wrapper)
- `containerTag`: 'div' | 'ul' | React.ComponentType
- `containerClass`: string
- `containerStyle`: React.CSSProperties
- `printContainerStyle`: React.CSSProperties
- `itemTag`: 'div' | 'li' | React.ComponentType
- `itemClass`: string
- `itemStyle`: React.CSSProperties
- `printItemStyle`: React.CSSProperties
- `sectionComponent`: React.ComponentType (for custom section overrides like SpacerBlock)
- `itemComponent`: React.ComponentType
- `createDefaultItem`: function(): Object
- `adaptItem`: function(Object): Object

### `useCV()` Context Value Contract
Exposes all 48 members:
- Data: `cvData`, `updateProfile`, `updateSectionProperty`, `updateSectionTitle`, `updateSectionBulletStyle`, `updateSectionItem`, `addSectionItem`, `deleteSectionItem`, `reorderSectionItems`, `moveItemBetweenSections`, `addSection`, `deleteSection`, `reorderSections`, `loadVersionSnapshot`, `resetToDefault`, `restoreContactSection`, `languagePacks`, `activeLanguage`, `switchLanguage`, `importLanguagePack`, `getActiveDictionary`
- History: `undo`, `redo`, `canUndo`, `canRedo`
- Layout: `updateLayout`, `updateSectionColumn`, `moveSectionToColumnAndIndex`, `pageHeightPx`, `setPageHeightPx`, `pageGapPx`, `totalPages`, `setTotalPages`, `getPageBounds`, `getElementPageInfo`, `paginationTrigger`, `triggerPaginationRecalc`, `activeTooltip`, `setActiveTooltip`, `clearActiveTooltip`, `closeTooltip`, `toggleTooltipForSection`, `activeToolbar`, `setActiveToolbar`, `clearActiveToolbar`, `showAITips`
- Export & UI: `toast`, `showToast`, `hideToast`

## Code Layout
- `docs/code-review.md`: Complete audit report
- `src/components/CV/SortableBulletItem.jsx`: Shared draggable bullet row component
- `src/components/CV/BaseItem.jsx`: Generic template item component (0 guards)
- `src/components/CV/BaseSection.jsx`: Generic template section component (0 guards)
- `src/registry/sectionRegistry.js`: Factory & strategy descriptors with JSDoc `@typedef`
- `src/context/hooks/useCVData.js`: Data hook (<=250 lines)
- `src/context/hooks/useCVHistory.js`: History hook (<=250 lines)
- `src/context/hooks/useCVLayout.js`: Layout hook (<=250 lines)
- `src/context/hooks/useCVExport.js`: Export & toast hook (<=250 lines)
- `src/context/hooks/index.js`: Barrel export for hooks
- `src/context/index.js`: Barrel export for context & hooks
- `src/context/CVContext.jsx`: Backward-compatible facade (<=200 lines)
- `src/components/CV/items/CustomNotesItem.jsx`: Minimal section item for extensibility verification
- `src/tests/extensibilitySmoke.test.jsx`: Extensibility smoke-test suite
