## Task Assignment: Test Suite Survey & Audit

### Identity
- Role: Test Suite Specialist Explorer
- Working directory: C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_explorer_survey_tests

### Inputs
- User Request: C:\Users\usuariodgc\Documents\Ressume\.agents\ORIGINAL_REQUEST.md (see ## 2026-09-11T16:11:48Z)
- Guidelines: C:\Users\usuariodgc\Documents\Ressume\AGENTS.md
- Test Suite: All test files under `src/tests/` and any other tests in `src/` (e.g., `cleanPrintEngineVerification.test.jsx`, `pixelParityEditorPrint.test.jsx`, etc.)
- Git history: Inspect git log (`git log --oneline -40`) for hotspot files.

### Scope & Mission
Investigate and produce a detailed audit report on the Test Suite:
1. **Baseline test execution & status**: Check existing test suite status (run vitest via `npm test -- --run` or `npx vitest run`), verify baseline test count (expected >=634 tests).
2. **Identify tautological tests**: A test is tautological if it calls a function and then asserts the output equals what that same function would compute from the same inputs, testing nothing about behavior. Search through all test files (especially `cleanPrintEngineVerification.test.jsx`, `pixelParityEditorPrint.test.jsx`, etc.) for tautological assertions or circular logic. Document file paths, test names, line numbers, and exact reasons why they are tautological.
3. **Pillar 3 style tag assertion**: Check `cleanPrintEngineVerification.test.jsx` Pillar 3: does it verify that ALL three style tags (`cv-base-styles`, `cv-print-styles`, `cv-snapshot-breaks`) are present in the generated iframe document? Document current state and lines.
4. **CSS variable transfer test**: Check if any test verifies CSS variables from the editor (e.g., `--page-padding`) are transferred to the iframe root. Document current state.
5. **JSDOM mock audit**: Note which tests use `getBoundingClientRect` mocks (`Object.defineProperty`) and verify their correctness.
6. Provide concrete recommendations for rewrites, annotations (`// TODO: requires Playwright/Puppeteer...`), and new assertions.

### Output
Write your findings and evidence to:
`C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_explorer_survey_tests\handoff.md`
and message the orchestrator when complete.

## 2026-09-11T16:14:08Z
You are the Test Suite Specialist Explorer.
Your working directory: C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_explorer_survey_tests
Authoritative user request: C:\Users\usuariodgc\Documents\Ressume\.agents\ORIGINAL_REQUEST.md (see header ## 2026-09-11T16:11:48Z)
Read your detailed task description in C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_explorer_survey_tests\DISPATCH.md.

Investigate:
1. Baseline test suite execution: run npm test -- --run (or vitest) to verify current baseline (expected >=634 passing tests).
2. Tautological tests across test files (tests where assertion checks f(x) == f(x) or circular calculation, testing nothing about behavior). Document file, test name, line numbers, and why.
3. Pillar 3 of cleanPrintEngineVerification.test.jsx: verification of all 3 style tag IDs (cv-base-styles, cv-print-styles, cv-snapshot-breaks).
4. CSS variable transfer test existence and status.
5. JSDOM getBoundingClientRect mock audit.
6. Git history hotspots (git log --oneline -40) touching test files.

Write your comprehensive findings and evidence report to C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_explorer_survey_tests\handoff.md and send a message back when complete.
