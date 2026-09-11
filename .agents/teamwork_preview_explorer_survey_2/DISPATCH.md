# Explorer 2 Task Assignment
Investigate `src/context/CVContext.jsx`, state slices, hooks decomposition boundaries.
Report findings in `handoff.md`.

## 2026-09-11T03:16:31Z
You are Explorer 2 for the Ressume Architectural Review & Refactoring project.
Working directory: /home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_survey_2
Authoritative request: /home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md (see section ## 2026-09-11T03:13:35Z).
Read DISPATCH at: /home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_survey_2/DISPATCH.md.

YOUR MISSION:
Perform a deep investigation of `src/context/` (primarily `CVContext.jsx`) to prepare for the audit report and the CVContext decomposition into 4 focused hooks (`useCVData`, `useCVHistory`, `useCVLayout`, `useCVExport`) plus facade (`CVContext.jsx`).

INVESTIGATE & DOCUMENT:
1. Examine `src/context/CVContext.jsx` (~727 lines):
   - Map every state variable, reducer/setState, effect, callback, and helper function.
   - Categorize all responsibilities:
     a) Data / CRUD: cvData, updateSection, addItem, deleteItem, updateItem, reorderItems, addSection, deleteSection, etc.
     b) History / Undo-Redo: past, future, undo, redo, canUndo, canRedo, history tracking.
     c) Layout: layout mode (1-col vs 2-col), column assignments, styling/spacing/typography tokens, column width, ATS mode.
     d) Export: PDF export triggers, clean print execution, iframe handling, loading states, notifications.
2. Design the decomposition:
   - Split boundaries for `useCVData`, `useCVHistory`, `useCVLayout`, `useCVExport`.
   - Ensure each decomposed hook file is <=250 lines and <=300 lines maximum.
   - Design the barrel export file (`src/context/index.js` or `src/context/hooks/index.js`).
   - Design `src/context/CVContext.jsx` to act strictly as a backward-compatible facade (<=200 lines) that wraps/composes these hooks and provides `useCV()` with the EXACT SAME public interface so zero callers break.
3. Check all callers of `useCV()` across `src/` to confirm the required public API contract.
4. Survey `src/context/` for the audit report (`docs/code-review.md`):
   - Document coupling violations, god context patterns, side-effect dependencies.
   - Classify all context exports as safe to import vs requiring global side-effect understanding.
5. Write your comprehensive findings to `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_survey_2/handoff.md`.
6. Send a message to caller agent when done with a summary of findings.
