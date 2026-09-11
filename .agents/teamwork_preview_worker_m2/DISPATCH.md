# Worker M2 Task: SortableBulletItem Extraction & Deduplication

## Working Directory
`/home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m2`

## Inputs
- Authoritative Request: `/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md` (section `## 2026-09-11T03:13:35Z`)
- Project Scope: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_orchestrator_11/PROJECT.md`
- Audit Blueprints: `/home/juani/Documentos/Ressume/docs/code-review.md` (Section 5.1 Blueprint 1)
- Explorer 1 Findings: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_survey_1/handoff.md` (Section 4)

## Write Ownership
- `src/components/CV/SortableBulletItem.jsx` (New file: create this)
- `src/components/CV/items/ExperienceItem.jsx` (Edit: remove internal SortableBulletItem, import from ../SortableBulletItem)
- `src/components/CV/items/ProjectsItem.jsx` (Edit: remove internal SortableBulletItem, import from ../SortableBulletItem)
- `src/components/CV/items/VolunteeringItem.jsx` (Edit: remove internal SortableBulletItem, import from ../SortableBulletItem)

## Task Description
1. Create `src/components/CV/SortableBulletItem.jsx`:
   - File-level comment explaining responsibility and contract.
   - Comprehensive JSDoc block for component and props.
   - Must support all props: `bulletId`, `bulletText`, `bulletIndex`, `sectionId`, `itemId`, `bullets`, `onUpdateItem`, `onDeleteBullet`, and optional `marginBottom = 'var(--item-gap, 6px)'`.
   - Ensure classes `bullet-item-row editable-item-container cv-block` and drag listeners / handle are preserved exactly.
   - Total lines must be <= 300 lines (actual will be ~80 lines).
2. Refactor `ExperienceItem.jsx`:
   - Delete lines 24–90 (the local `SortableBulletItem`).
   - Import `SortableBulletItem` from `../SortableBulletItem`.
   - Keeps default `marginBottom` or passes `'var(--item-gap, 6px)'`.
3. Refactor `ProjectsItem.jsx`:
   - Delete lines 24–90 (the local `SortableBulletItem`).
   - Import `SortableBulletItem` from `../SortableBulletItem`.
   - Passes `marginBottom="calc(var(--item-gap, 6px) / 2)"`.
4. Refactor `VolunteeringItem.jsx`:
   - Delete lines 23–89 (the local `SortableBulletItem`).
   - Import `SortableBulletItem` from `../SortableBulletItem`.
   - Passes `marginBottom="calc(var(--item-gap, 6px) / 2)"`.
5. Run test verification:
   - Run `npx vitest run` and confirm all 628 tests pass across 37 test files.
6. Write completion details and test results to `handoff.md` and message the orchestrator.

## 2026-09-11T03:30:01Z
You are Worker M2 for the Ressume Architectural Review & Refactoring project.
Working directory: /home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m2
Project root: /home/juani/Documentos/Ressume
Authoritative request: /home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md (see section ## 2026-09-11T03:13:35Z).
Read DISPATCH at: /home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m2/DISPATCH.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

YOUR ASSIGNMENT:
Extract `SortableBulletItem` into a single shared component (`src/components/CV/SortableBulletItem.jsx`) and update `ExperienceItem.jsx`, `ProjectsItem.jsx`, and `VolunteeringItem.jsx` to import from it.

Exact Steps:
1. Create `src/components/CV/SortableBulletItem.jsx`:
   - File-level comment explaining responsibility and contract.
   - JSDoc block for `SortableBulletItem` and all props.
   - Accept: `bulletId`, `bulletText`, `bulletIndex`, `sectionId`, `itemId`, `bullets`, `onUpdateItem`, `onDeleteBullet`, and optional `marginBottom = 'var(--item-gap, 6px)'`.
   - Preserve exact DOM structure: `<li ref={setNodeRef} style={style} className="bullet-item-row editable-item-container cv-block" {...attributes} {...containerDragListeners}>` with DragHandle, SimpleListItem, and delete button.
   - Ensure file has < 300 lines.
2. In `src/components/CV/items/ExperienceItem.jsx`:
   - Remove internal duplicate `SortableBulletItem`.
   - Import `SortableBulletItem` from `../SortableBulletItem`.
   - Clean up unused imports if any (e.g. if `useSortable` was only used by internal `SortableBulletItem`).
3. In `src/components/CV/items/ProjectsItem.jsx`:
   - Remove internal duplicate `SortableBulletItem`.
   - Import `SortableBulletItem` from `../SortableBulletItem`.
   - Pass `marginBottom="calc(var(--item-gap, 6px) / 2)"`.
   - Clean up unused imports.
4. In `src/components/CV/items/VolunteeringItem.jsx`:
   - Remove internal duplicate `SortableBulletItem`.
   - Import `SortableBulletItem` from `../SortableBulletItem`.
   - Pass `marginBottom="calc(var(--item-gap, 6px) / 2)"`.
   - Clean up unused imports.
5. Verification:
   - Run `npx vitest run` in project root. All 628 tests must pass.
   - Run `npm run build` in project root. 0 errors.
   - Check `grep -rn "const SortableBulletItem" src/` — verify it appears in exactly ONE file!
6. Document your work, commands, and test outputs in `/home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m2/handoff.md`.
7. Send a message to caller agent when complete.
