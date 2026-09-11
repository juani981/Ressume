# Orchestration Plan — Ressume Code Review & Architectural Refactoring

## Objectives
1. Perform comprehensive code audit report (`docs/code-review.md`) covering all files in `src/components/CV/` and `src/context/` with exact lines, impact ratings, safe vs side-effect imports, and at least 5 known anti-patterns.
2. Refactor SortableBulletItem into a single shared component (`src/components/CV/SortableBulletItem.jsx`) used by ExperienceItem, ProjectsItem, VolunteeringItem.
3. Refactor BaseItem and BaseSection to eliminate all `if (sectionType === ...)` and `if (section.type === ...)` chains, utilizing a unified registry descriptor contract (`sectionRegistry.js`) with JSDoc `@typedef`. BaseItem and BaseSection must contain ZERO guards in their render path.
4. Decompose `CVContext.jsx` into 4 focused hooks (`useCVData`, `useCVHistory`, `useCVLayout`, `useCVExport`) exported from a barrel file, maintaining `CVContext.jsx` as a backward-compatible facade (<=200 lines, hook files <=250 lines, `useCV()` unchanged).
5. Document all new abstractions with JSDoc, file-level comments, and ensure no new file exceeds 300 lines.
6. Verify extensibility via a minimal section smoke-test (editing only registry + 1 new item component file) with tests.
7. Verify all 628 Vitest tests pass cleanly and production build (`npm run build`) succeeds with 0 errors.

## Phase 0: Survey & Scope Mapping
- Dispatch 3 parallel Explorers:
  - Explorer 1: Focus on `src/components/CV/`, BaseItem, BaseSection, items/ (Experience, Projects, Volunteering, Skills, etc.), SortableBulletItem duplication, and registry interaction.
  - Explorer 2: Focus on `src/context/CVContext.jsx`, state slice boundaries, hooks decomposition design (`useCVData`, `useCVHistory`, `useCVLayout`, `useCVExport`), barrel export, and `useCV()` facade compatibility.
  - Explorer 3: Focus on baseline test execution (`npx vitest run`), existing 628 tests across 37 test files, test runner behavior, build process, and smoke-test strategy for new section extensibility.
- Synthesize survey findings into `PROJECT.md` with Feature Inventory and interface contracts.

## Phase 1: Milestone M1 — Audit Report (`docs/code-review.md`)
- Dispatch Worker to write `docs/code-review.md` based on exhaustive findings across `src/components/CV/` and `src/context/`.
- Review and Audit verification.

## Phase 2: Milestone M2 — SortableBulletItem Deduplication
- Extract shared component `src/components/CV/SortableBulletItem.jsx`.
- Update ExperienceItem, ProjectsItem, VolunteeringItem.
- Run tests and verify zero regressions.

## Phase 3: Milestone M3 — Registry Descriptor & BaseItem / BaseSection Factory/Strategy Dispatch
- Define `sectionRegistry.js` descriptor contract with JSDoc `@typedef`.
- Ensure BaseItem and BaseSection have ZERO `if (sectionType === ...)` guards.
- Verify tests pass.

## Phase 4: Milestone M4 — CVContext Decomposition
- Split into `useCVData`, `useCVHistory`, `useCVLayout`, `useCVExport` and index barrel.
- Refactor `CVContext.jsx` into facade <=200 lines, hooks <=250 lines.
- Verify all callers and tests pass.

## Phase 5: Milestone M5 — Extensibility Smoke-Test Section & Full Verification
- Add minimal smoke-test section type modifying only `sectionRegistry.js` and 1 item component.
- Add test.
- Full Vitest run (628+ tests passing) and production build.
- Gate reviews, challengers, and forensic auditor.
