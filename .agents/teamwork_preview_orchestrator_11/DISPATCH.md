## 2026-09-11T03:14:00Z

You are the Project Orchestrator for Ressume.

Working directory: /home/juani/Documentos/Ressume/.agents/teamwork_preview_orchestrator_11
Project root: /home/juani/Documentos/Ressume
Authoritative request: /home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md (see section ## 2026-09-11T03:13:35Z)

Your mission:
Conduct a production-grade code review and refactoring of the **Ressume** React CV editor (`/home/juani/Documentos/Ressume/src`). The goal is a codebase that is **loosely coupled, follows Template + Factory + Strategy patterns consistently, and is easy for open-source contributors to extend.** Deliver both a written audit and the actual refactored code.

Requirements:
### R1. Audit Report (`docs/code-review.md`)
- Structured markdown report covering every file in `src/components/CV/` and `src/context/`
- Every finding must cite exact file path + line range + impact rating (High / Medium / Low)
- Must explicitly identify at least the 5 known issues:
  1. `ExperienceItem`, `ProjectsItem`, and `VolunteeringItem` each contain an identical internal `SortableBulletItem` component (~65 lines, 3× duplicated)
  2. `BaseItem.jsx` routes rendering via `if (sectionType === 'X')` chains — registry ignored at render layer
  3. `BaseSection.jsx` contains parallel `if (section.type === ...)` chains
  4. `CVContext.jsx` (~727 lines) god context
  5. `App.jsx` (~1080 lines) god component
  6. `isPrint` prop threaded through every component as runtime branch
- Identifies which files, hooks, and utilities are safe to import as-is by a contributor and which require understanding global side-effects first

### R2. Refactoring — Deduplication and Pattern Enforcement
- **SortableBulletItem**: extract into a single shared component (`src/components/CV/SortableBulletItem.jsx`) imported by all three item types. Must exist in exactly ONE file.
- **BaseItem & BaseSection**: eliminate all `if (sectionType === ...)` and `if (section.type === ...)` chains; all type-specific dispatch must go through the registry descriptor (factory/strategy pattern). BaseItem and BaseSection must contain ZERO guards in their render path.
- **Registry descriptor contract**: `sectionRegistry` entry for each type must declare everything needed for rendering — container tag, container class, whether it supports bullets, whether it's a list item — so BaseItem and BaseSection become pure template components. Document shape with JSDoc `@typedef`.
- **CVContext decomposition**: split into focused hooks (`useCVData`, `useCVHistory`, `useCVLayout`, `useCVExport`) exported from a barrel file; the existing `useCV()` hook must remain as a backward-compatible facade so no callers break. `CVContext.jsx` must be ≤200 lines after decomposition. Each decomposed hook file must be ≤250 lines and have a single clearly-stated responsibility. The `useCV()` hook remains callable and returns the same interface as before.

### R3. Documentation & Limits
- JSDoc blocks on every new abstraction (hooks, factory functions, shared components, registry descriptor typedef).
- Each new file must have a file-level comment explaining its responsibility and contract.
- No new file may exceed 300 lines.

### Extensibility Test (self-verifiable)
- Adding a hypothetical new section type requires editing only `sectionRegistry.js` + one new item component file — no changes to `BaseItem`, `BaseSection`, `CVContext`, or `App`.
- Verified by actually implementing one new minimal section type as a smoke-test (with accompanying test).

### Verification
- Baseline is 628 automated tests (Vitest) across 37 test files, all passing.
- Run `npx vitest run` to verify zero test regressions.
- Production build (`npm run build`) must succeed with 0 errors.

Please create and maintain your plan.md and progress.md in your working directory (.agents/teamwork_preview_orchestrator_11), coordinate specialists/workers, and report back to Sentinel when victory is achieved.
