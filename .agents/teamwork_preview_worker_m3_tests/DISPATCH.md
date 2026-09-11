## Task Assignment: Milestone M3 — Test Suite Modernization & Assertion Hardening

### Identity
- Role: Test Suite Implementer
- Working directory: C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_worker_m3_tests

### Inputs & Authoritative References
- User Request: C:\Users\usuariodgc\Documents\Ressume\.agents\ORIGINAL_REQUEST.md (see ## 2026-09-11T16:11:48Z)
- Architectural Audit Report: C:\Users\usuariodgc\Documents\Ressume\docs\audit-report.md
- Guidelines: C:\Users\usuariodgc\Documents\Ressume\AGENTS.md
- Explorer Report: C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_explorer_survey_tests\handoff.md

### MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

### File Ownership
You exclusively own and may modify the test files:
1. `src/tests/cleanPrintEngineVerification.test.jsx`
2. `src/tests/pixelParityEditorPrint.test.jsx`
3. `src/tests/adversarial-spacing-layout-extremes.test.jsx`
4. `src/tests/challenger-o10-dom-coordinates-stress.test.jsx`
5. `src/tests/test_inspect_juan_cv.test.jsx`
Do NOT modify production source files in `src/` (outside `src/tests/`).

### Tasks to Implement

1. **Add Missing Assertions in `src/tests/cleanPrintEngineVerification.test.jsx`**:
   - **T3.6 (Pillar 3)**: Add a new test in `describe('Pillar 3: Strict Zero-Split Super-Container Pagination')` that verifies ALL THREE required print style tags are present with their discrete IDs:
     ```javascript
     it('T3.6: verifies that all three required print style tags (cv-base-styles, cv-print-styles, cv-snapshot-breaks) are injected with discrete IDs', () => {
       const html = generateCleanPrintHTML(fullCVData);
       const doc = new DOMParser().parseFromString(html, 'text/html');

       const baseStylesTag = doc.getElementById('cv-base-styles');
       const printStylesTag = doc.getElementById('cv-print-styles');
       const snapshotBreaksTag = doc.getElementById('cv-snapshot-breaks');

       expect(baseStylesTag, '<style id="cv-base-styles"> is missing').not.toBeNull();
       expect(printStylesTag, '<style id="cv-print-styles"> is missing').not.toBeNull();
       expect(snapshotBreaksTag, '<style id="cv-snapshot-breaks"> is missing').not.toBeNull();

       expect(baseStylesTag.textContent).toContain('--page-padding:');
       expect(printStylesTag.textContent).toContain('@media print');
     });
     ```
   - **T5.6 (CSS Variable Transfer)**: Add a new test under `describe('Pillar 5: System Health & Zero-Regression Invariants')` (or at end of file) that verifies dynamic CSS custom properties from `#area-cv` in the editor DOM transfer to `doc.documentElement.style` during `executeCleanPrint`:
     ```javascript
     it('T5.6: executeCleanPrint transfers dynamic CSS custom properties from editor #area-cv to print iframe root element', async () => {
       const editorAreaCv = document.createElement('div');
       editorAreaCv.id = 'area-cv';
       editorAreaCv.style.setProperty('--page-padding', '42px');
       editorAreaCv.style.setProperty('--section-gap', '30px');
       editorAreaCv.style.setProperty('--font-scale', '1.2');
       document.body.appendChild(editorAreaCv);

       let capturedDoc = null;
       const originalAppendChild = document.body.appendChild.bind(document.body);
       const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(function (child) {
         if (child && child.tagName === 'IFRAME') {
           const doc = document.implementation.createHTMLDocument('Print Preview');
           capturedDoc = doc;
           Object.defineProperty(child, 'contentDocument', { get: () => doc, configurable: true });
           Object.defineProperty(child, 'contentWindow', {
             get: () => ({
               document: doc,
               focus: vi.fn(),
               print: vi.fn(),
               addEventListener: (evt, cb) => { if (evt === 'load') cb(); }
             }),
             configurable: true
           });
         }
         return originalAppendChild(child);
       });

       try {
         await executeCleanPrint(fullCVData);

         expect(capturedDoc).not.toBeNull();
         const rootStyle = capturedDoc.documentElement.style;
         expect(rootStyle.getPropertyValue('--page-padding')).toBe('42px');
         expect(rootStyle.getPropertyValue('--section-gap')).toBe('30px');
         expect(rootStyle.getPropertyValue('--font-scale')).toBe('1.2');
       } finally {
         appendSpy.mockRestore();
         if (editorAreaCv.parentNode) {
           editorAreaCv.parentNode.removeChild(editorAreaCv);
         }
       }
     });
     ```

2. **Rewrite / Annotate Tautological Tests (Total 24 Tests)**:
   - **`src/tests/pixelParityEditorPrint.test.jsx`**:
     - Test `PARITY-4.1` (~line 711): Replace circular rect assertions with:
       ```javascript
       // TODO: requires Playwright/Puppeteer for real browser layout and geometry verification.
       // JSDOM does not calculate layout geometry; synthetic getBoundingClientRect mocks tested
       // circular arithmetic rather than real browser rendering.
       expect(true).toBe(true);
       ```
     - Test `PARITY-4.2` (~line 781): Replace circular rect assertions with same documented no-op.
   - **`src/tests/adversarial-spacing-layout-extremes.test.jsx`**:
     - Tests `ADV-1.1` through `ADV-1.4` (2-Column, lines ~411–484, 4 tests): Replace circular `Math.abs(edRect.top - prRect.top) === 0` loop with documented no-op noting Playwright/Puppeteer requirement.
     - Tests `ADV-1.1` through `ADV-1.4` (1-Column ATS, lines ~486–539, 4 tests): Replace circular loop with same documented no-op.
   - **`src/tests/challenger-o10-dom-coordinates-stress.test.jsx`**:
     - 13 tests (Tests 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 4.1, 4.2, 5.1-[25,33,40,50], 6.1): Replace circular `resolveDOMCoordinates` self-comparison assertions with documented no-ops noting Playwright/Puppeteer requirement.
   - **`src/tests/test_inspect_juan_cv.test.jsx`**:
     - Line ~95 (`simulates pagination pass by pass`): Add concrete assertions to ensure it is not a 0-assertion test:
       ```javascript
       expect(items.length).toBeGreaterThan(0);
       expect(hasChanges).toBe(true);
       ```

3. **Verify Zero Regressions**:
   - Run `npm test -- --run`.
   - Verify that 0 tests fail and total passing test count is $\ge 634$ (with our new tests T3.6 and T5.6, it will be $\ge 636$!).
   - Run `npm run build` to confirm clean build.

### Output
Write a comprehensive handoff report to:
`C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_worker_m3_tests\handoff.md`
including Observation, Logic Chain, Caveats, Conclusion, and exact Build/Test Verification outputs.

## 2026-09-11T16:32:07Z
You are the Test Suite Implementer for Milestone M3.
Your working directory: C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_worker_m3_tests
Authoritative user request: C:\Users\usuariodgc\Documents\Ressume\.agents\ORIGINAL_REQUEST.md (see header ## 2026-09-11T16:11:48Z)
Read your detailed task description in C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_worker_m3_tests\DISPATCH.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You exclusively own:
1. src/tests/cleanPrintEngineVerification.test.jsx
2. src/tests/pixelParityEditorPrint.test.jsx
3. src/tests/adversarial-spacing-layout-extremes.test.jsx
4. src/tests/challenger-o10-dom-coordinates-stress.test.jsx
5. src/tests/test_inspect_juan_cv.test.jsx

Tasks:
1. In cleanPrintEngineVerification.test.jsx, add T3.6 (assert discrete IDs for cv-base-styles, cv-print-styles, cv-snapshot-breaks) and T5.6 (assert CSS variables transfer from editor #area-cv to doc.documentElement.style).
2. Convert the 24 tautological tests to documented no-ops with "// TODO: requires Playwright/Puppeteer for real browser layout and geometry verification. expect(true).toBe(true);" without deleting any tests:
   - pixelParityEditorPrint.test.jsx (PARITY-4.1, PARITY-4.2)
   - adversarial-spacing-layout-extremes.test.jsx (ADV-1.1 to 1.4 in 2-col and 1-col ATS)
   - challenger-o10-dom-coordinates-stress.test.jsx (13 tests)
3. In test_inspect_juan_cv.test.jsx line 95, add assertions (expect(items.length).toBeGreaterThan(0); expect(hasChanges).toBe(true);) so it is not a 0-assertion test.
4. Run verification:
   - npm test -- --run (must pass with 0 failures, >=634 tests)
   - npm run build (0 errors, 0 warnings)

Write full handoff report to C:\Users\usuariodgc\Documents\Ressume\.agents\teamwork_preview_worker_m3_tests\handoff.md and message back when complete.

