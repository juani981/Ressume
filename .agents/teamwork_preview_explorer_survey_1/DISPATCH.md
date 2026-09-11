# Explorer 1 Task Assignment
Investigate `src/components/CV/`, BaseItem, BaseSection, items, and registry.
Report findings in `handoff.md`.

## 2026-09-11T03:16:31Z
You are Explorer 1 for the Ressume Architectural Review & Refactoring project.
Working directory: /home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_survey_1
Authoritative request: /home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md (see section ## 2026-09-11T03:13:35Z).
Read DISPATCH at: /home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_survey_1/DISPATCH.md.

YOUR MISSION:
Perform a deep investigation of `src/components/CV/` and `src/registry/sectionRegistry.js` to prepare for both the audit report (docs/code-review.md) and refactoring (M2 SortableBulletItem, M3 BaseItem/BaseSection zero-guard factory/strategy).

INVESTIGATE & DOCUMENT:
1. Examine `src/components/CV/BaseSection.jsx` and `src/components/CV/BaseItem.jsx`:
   - Locate every single `if (sectionType === ...)` and `if (section.type === ...)` guard or conditional branch. Document exact line numbers and logic.
   - What properties/logic currently depend on section type? (e.g. wrapper tags, classes, bullet support, list container vs plain container, item rendering).
2. Examine `src/registry/sectionRegistry.js`:
   - Enumerate every registered section type and its current descriptor properties.
   - Design the exact registry descriptor contract needed to eliminate ALL conditionals in BaseItem and BaseSection.
   - Define the JSDoc `@typedef` for this descriptor.
3. Examine `ExperienceItem.jsx`, `ProjectsItem.jsx`, and `VolunteeringItem.jsx`:
   - Locate the internal `SortableBulletItem` component in each file. Check lines, props, differences (if any).
   - Design the unified `src/components/CV/SortableBulletItem.jsx` extraction so all 3 can import it cleanly without breaking anything.
4. Survey every other file in `src/components/CV/` (items, headers, wrappers, tooltips, etc.):
   - Identify coupling violations, prop drilling (e.g. `isPrint`), duplication, and anti-patterns with exact file paths and line ranges.
   - Classify each component as: (a) safe to import as-is by open-source contributors, vs (b) requires understanding global side-effects first.
5. Write your comprehensive findings to `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_survey_1/handoff.md`.
6. Send a message to caller agent when done with a summary of findings.
