## 2026-09-20T13:31:42Z
You are a replacement Worker subagent (teamwork_preview_worker_m4_cypress).
Your working directory is: /home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m4_cypress
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
   - When measuring print iframe computed styles (like `#area-cv` 794px width in tests 1 & 3), trigger print media emulation:
     ```javascript
     cy.wrap(Cypress.automation('remote:debugger:protocol', { command: 'Emulation.setEmulatedMedia', params: { media: 'print' } }));
     ```
     and restore screen media after measurement:
     ```javascript
     cy.wrap(Cypress.automation('remote:debugger:protocol', { command: 'Emulation.setEmulatedMedia', params: { media: '' } }));
     ```
   - In tests 5 and 7, note that `.column-add-section` is intentionally purged from the clean print clone for production print fidelity (not retained as a spacer). Update the assertion to verify that interactive add buttons are cleanly purged without residual whitespace.
   - Verify: `npx cypress run --browser chrome-for-testing --spec "cypress/e2e/05-pixel-fidelity-and-css-parity.cy.js"` passes 7/7 tests (100%).

2. **Author Real-Browser Parity Spec (Feature 12)**:
   Create `cypress/e2e/09-bullet-flow-and-slider-parity.cy.js` covering the exact user acceptance criteria:
   - **Paridad y Distribución de Viñetas**: Verify that a multi-bullet item spanning page boundaries splits cleanly between individual bullets across pages without character/word slicing.
   - **Margen Superior en Página 2+**: Verify that content on Page 2 respects `padding-top: var(--page-padding)` under print emulation and does not sit at y=0 against the paper edge.
   - **Sincronización de Sliders**: Test that altering layout sliders (`fontScale`, `itemGap`, `pagePadding`, `leftColumnWidth`) updates the print snapshot variables and rendered geometry proportionally, with zero `@media print` hardcoded overrides reverting them.
   - **Physical PDF Generation**: Verify `cy.generatePdfWithCDP` produces a valid PDF matching `data-total-pages`.

3. **Full Battery Execution (Feature 13)**:
   - Run `npx cypress run --browser chrome-for-testing --spec "cypress/e2e/01-print-lifecycle.cy.js,cypress/e2e/02-print-geometry-and-pagination.cy.js,cypress/e2e/05-pixel-fidelity-and-css-parity.cy.js,cypress/e2e/08-two-column-print-synchronization.cy.js,cypress/e2e/09-bullet-flow-and-slider-parity.cy.js"`
   - Run `npm test` (all 58 test files and 903 tests pass).
   - Run `npm run build` (0 errors).

Report your implementation, exact test outputs, and verification details in `/home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m4_cypress/handoff.md`.
Send a message when complete.
