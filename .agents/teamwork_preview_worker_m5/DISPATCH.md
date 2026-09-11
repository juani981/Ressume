# Worker M5 Task: Implement Extensibility Smoke-Test Section & Accompanying Tests

## Working Directory
`/home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m5`

## Inputs
- Authoritative Request: `/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md` (section `## 2026-09-11T03:13:35Z`)
- Project Scope: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_orchestrator_11/PROJECT.md`
- Blueprint: `/home/juani/Documentos/Ressume/docs/code-review.md` (Section 5.5 Blueprint 5)
- Explorer 3 Design: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_survey_3/handoff.md` (Section 1.4 & 2.5)

## Write Ownership
- `src/components/CV/items/CustomNotesItem.jsx` (New file)
- `src/registry/sectionRegistry.js` (Edit: register custom_notes descriptor ONLY)
- `src/tests/extensibilitySmoke.test.jsx` (New test file)
- STRICT RULE: Do NOT modify `src/components/CV/BaseItem.jsx`, `src/components/CV/BaseSection.jsx`, `src/context/CVContext.jsx`, or `src/App.jsx`.

## Task Description
1. Create `src/components/CV/items/CustomNotesItem.jsx`:
   - File-level comment and JSDoc block.
   - Total lines <= 300 lines (target ~45 lines).
   - Clean presentational component rendering `item.note` or `item.text` via `InlineEdit` or semantic text, and optional date/tag.
2. Register `custom_notes` in `src/registry/sectionRegistry.js`:
   - Add descriptor for `type: 'custom_notes'`:
     `label: 'Notas Adicionales'`, `defaultTitle: 'NOTAS ADICIONALES'`, `defaultColumn: 'left'`, `icon: 'bx-note'`,
     `sectionClass: 'experience'`, `containerTag: 'div'`, `containerClass: 'experience__container bd-grid'`,
     `itemTag: 'div'`, `itemClass: 'experience__content'`, `itemComponent: CustomNotesItem`,
     `createDefaultItem: () => ({ id: generateUniqueId('item'), note: 'Nueva nota o comentario...' })`,
     `adaptItem: ...`
3. Create `src/tests/extensibilitySmoke.test.jsx`:
   - Tests that adding `custom_notes` to `cvData.sections` renders correctly via `BaseSection` and `BaseItem` without modifying any core engine code.
   - Tests that `getSectionDescriptor('custom_notes')` returns the registered descriptor with `CustomNotesItem`.
   - Tests rendering in both editable mode and print mode (`isPrint: true`).
   - Tests that inline editing and item delete work.
4. Verification:
   - Run `git status` or check diff to ensure ZERO changes to `BaseItem.jsx`, `BaseSection.jsx`, `CVContext.jsx`, or `App.jsx`.
   - Run `npx vitest run` in project root -> verify 100% tests pass (all 635+ tests).
   - Run `npm run build` -> 0 errors.
5. Document everything in `handoff.md` and message orchestrator.

## 2026-09-11T03:57:26Z
You are Worker M5 for the Ressume Architectural Review & Refactoring project.
Working directory: /home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m5
Project root: /home/juani/Documentos/Ressume
Authoritative request: /home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md (see section ## 2026-09-11T03:13:35Z).
Read DISPATCH at: /home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m5/DISPATCH.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

YOUR ASSIGNMENT:
Implement the Extensibility Smoke-Test Section (`custom_notes`), demonstrating that a new section type can be added by modifying ONLY `src/registry/sectionRegistry.js` + adding one new item component file (`src/components/CV/items/CustomNotesItem.jsx`), with ZERO changes to `BaseItem`, `BaseSection`, `CVContext`, or `App`.
