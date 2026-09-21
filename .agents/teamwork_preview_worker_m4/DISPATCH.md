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

## 2026-09-20T05:49:04Z
You are a Worker subagent (teamwork_preview_worker_m4).
Your working directory is: /home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m4
The workspace root is: /home/juani/Documentos/Ressume
The authoritative original user request is at: /home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md
The project plan is at: /home/juani/Documentos/Ressume/PROJECT.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope and Exclusive File Ownership for Milestone 4:
Files you own:
- `cypress/e2e/05-pixel-fidelity-and-css-parity.cy.js`
- `cypress/e2e/09-bullet-flow-and-slider-parity.cy.js`
- `cypress/support/commands.js`

Tasks for Milestone 4 (Verificación E2E en Navegador Real con Cypress):
1. **Fix Media Emulation in Spec 05 (Feature 11)**:
   In `cypress/e2e/05-pixel-fidelity-and-css-parity.cy.js`:
   - In tests inspecting print computed styles (such as `#area-cv` 794px width), trigger print media emulation:
     ```javascript
     cy.wrap(Cypress.automation('remote:debugger:protocol', { command: 'Emulation.setEmulatedMedia', params: { media: 'print' } }));
     ```
     and restore screen media after assertions:
     ```javascript
     cy.wrap(Cypress.automation('remote:debugger:protocol', { command: 'Emulation.setEmulatedMedia', params: { media: '' } }));
     ```
   - In tests 5 and 7, acknowledge that `.column-add-section` is intentionally purged from the clean print snapshot for production print fidelity.
   - Verify `npx cypress run --browser chrome-for-testing --spec "cypress/e2e/05-pixel-fidelity-and-css-parity.cy.js"` passes 7/7 tests (100%).
2. **Author Real-Browser Parity Spec (Feature 12)**:
   Author `cypress/e2e/09-bullet-flow-and-slider-parity.cy.js` covering the exact user acceptance criteria:
   - **Paridad y Distribución de Viñetas**: Verify that a multi-bullet item spanning page boundaries splits cleanly between individual bullets across pages without character/word slicing.
   - **Margen Superior en Página 2+**: Verify that content on Page 2 respects `padding-top: var(--page-padding)` under print emulation and does not sit at y=0 against the paper edge.
   - **Sincronización de Sliders**: Test that altering layout sliders (`fontScale`, `itemGap`, `pagePadding`, `leftColumnWidth`) updates the print snapshot variables and rendered geometry proportionally, with zero `@media print` hardcoded overrides reverting them.
   - **Physical PDF Generation**: Verify `cy.generatePdfWithCDP` produces a valid PDF matching `data-total-pages`.
3. **Full Battery Execution (Feature 13)**:
   - Run `npx cypress run --browser chrome-for-testing` (run all print and E2E specs).
   - Run `npm test` (all 58 test files and 903 tests pass).
   - Run `npm run build` (0 errors).

Report your implementation, exact test outputs, and verification details in `/home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m4/handoff.md`.
Send a message when complete.
