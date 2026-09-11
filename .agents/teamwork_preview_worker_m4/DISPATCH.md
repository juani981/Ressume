# Worker M4 Task: CVContext Decomposition into 4 Hooks + Thin Facade

## Working Directory
`/home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m4`

## Inputs
- Authoritative Request: `/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md` (section `## 2026-09-11T03:13:35Z`)
- Project Scope: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_orchestrator_11/PROJECT.md`
- Audit Blueprints: `/home/juani/Documentos/Ressume/docs/code-review.md` (Section 5.4 Blueprint 4)
- Explorer 2 Blueprints & Complete Code: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_survey_2/analysis.md` (Section 5)

## Write Ownership
- `src/context/hooks/useCVHistory.js`
- `src/context/hooks/useCVData.js`
- `src/context/hooks/useCVLayout.js`
- `src/context/hooks/useCVExport.js`
- `src/context/hooks/index.js`
- `src/context/index.js`
- `src/context/CVContext.jsx`

## Task Description
1. Create `src/context/hooks/useCVHistory.js`:
   - Single responsibility: undo/redo stacks (`past`, `future`), `applyStateWithHistory`, `undo()`, `redo()`, global keydown listener (`Ctrl+Z`, `Ctrl+Y`).
   - File-level comment and JSDoc blocks.
   - Must be <= 250 lines (target ~110 lines).
2. Create `src/context/hooks/useCVData.js`:
   - Single responsibility: document data state, schema repair (`ensureProfileHeader`), localStorage synchronization, i18n localization dictionaries, section/item CRUD.
   - Export `loadInitialCVData` helper.
   - File-level comment and JSDoc blocks.
   - Must be <= 250 lines (target ~240 lines).
3. Create `src/context/hooks/useCVLayout.js`:
   - Single responsibility: layout modes (1-col ATS vs 2-col), column assignments, sticky pagination metrics (`pageHeightPx`, `pageGapPx`, `totalPages`, `getPageBounds`, `getElementPageInfo`, `paginationTrigger`), and overlay singletons (`activeTooltip`, `activeToolbar`, `showAITips`).
   - File-level comment and JSDoc blocks.
   - Must be <= 250 lines (target ~190 lines).
4. Create `src/context/hooks/useCVExport.js`:
   - Single responsibility: toast notification state (`toast`, `showToast`, `hideToast`), clean PDF export lifecycle coordination (`exportCleanPDF`), JSON download (`exportJSON`).
   - File-level comment and JSDoc blocks.
   - Must be <= 250 lines (target ~120 lines).
5. Create barrel exports:
   - `src/context/hooks/index.js`: re-exports `useCVHistory`, `useCVData`, `useCVLayout`, `useCVExport`.
   - `src/context/index.js`: re-exports `CVContext`, `CVProvider`, `useCV`, and all 4 hooks.
6. Refactor `src/context/CVContext.jsx`:
   - Thin facade composing the 4 hooks.
   - Preserves 100% of the 48 public API properties returned by `useCV()`:
     Data: `cvData`, `updateProfile`, `updateSectionProperty`, `updateSectionTitle`, `updateSectionBulletStyle`, `updateSectionItem`, `addSectionItem`, `deleteSectionItem`, `reorderSectionItems`, `moveItemBetweenSections`, `addSection`, `deleteSection`, `reorderSections`, `loadVersionSnapshot`, `resetToDefault`, `restoreContactSection`, `languagePacks`, `activeLanguage`, `switchLanguage`, `importLanguagePack`, `getActiveDictionary`.
     History: `undo`, `redo`, `canUndo`, `canRedo`.
     Layout: `updateLayout`, `updateSectionColumn`, `moveSectionToColumnAndIndex`, `pageHeightPx`, `setPageHeightPx`, `pageGapPx`, `totalPages`, `setTotalPages`, `getPageBounds`, `getElementPageInfo`, `paginationTrigger`, `triggerPaginationRecalc`, `activeTooltip`, `setActiveTooltip`, `clearActiveTooltip`, `closeTooltip`, `toggleTooltipForSection`, `activeToolbar`, `setActiveToolbar`, `clearActiveToolbar`, `showAITips`.
     Export: `toast`, `showToast`, `hideToast`, `isExporting`, `exportCleanPDF`, `exportJSON`.
   - Must be strictly <= 200 lines (target ~105 lines).
   - Export default `CVContext`, named `CVProvider`, and named `useCV`.
7. Verify:
   - Line counts: `wc -l src/context/CVContext.jsx src/context/hooks/*.js src/context/index.js` -> `CVContext.jsx` <= 200 lines, each hook <= 250 lines, all files <= 300 lines.
   - Run `npx vitest run` in project root -> all 628 tests must pass.
   - Run `npm run build` -> 0 errors.
8. Document all results in `handoff.md` and message orchestrator.
