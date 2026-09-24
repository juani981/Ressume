# BRIEFING — 2026-09-20T05:49:04Z

## Mission
Milestone 4: Verificación E2E en Navegador Real con Cypress. Fix media emulation in Spec 05, author real-browser parity spec 09 (`09-bullet-flow-and-slider-parity.cy.js`), update Cypress support commands if needed, and execute full test battery (Cypress + Vitest 903 tests + Build).

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: /home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m4
- Original parent: ca5efa9a-2989-4d87-a34d-927b285b46f9
- Milestone: M4 - Verificación E2E en Navegador Real con Cypress

## 🔒 Key Constraints
- Files owned:
  - `cypress/e2e/05-pixel-fidelity-and-css-parity.cy.js`
  - `cypress/e2e/09-bullet-flow-and-slider-parity.cy.js`
  - `cypress/support/commands.js`
- Prohibición de Doble Motor en Conflicto (AGENTS.md rule 5): CSS Paged Media declarativo, no parches de pantalla.
- Verificación Real vs. Sesgo de JSDOM: E2E en navegador real (Chrome for Testing via Cypress).
- Zero cheats: Genuine tests, real layout assertions, real CDP media emulation and PDF verification.

## Current Parent
- Conversation ID: 1a9839e6-32c0-4426-b6d9-cf6aa0d4937f
- Updated: 2026-09-20T05:49:04Z

## Task Summary
- **What to build**:
  1. Fix media emulation in `cypress/e2e/05-pixel-fidelity-and-css-parity.cy.js` (CDP `Emulation.setEmulatedMedia`, purge `.column-add-section` acknowledgement).
  2. Author `cypress/e2e/09-bullet-flow-and-slider-parity.cy.js` (bullet flow page boundaries, page 2+ top margin, slider synchronization, physical PDF generation with CDP).
  3. Ensure `cypress/support/commands.js` has required CDP commands (`cy.generatePdfWithCDP` or similar).
  4. Full battery execution: Cypress chrome-for-testing, npm test (58 files, 903 tests), npm run build.
- **Success criteria**:
  - Spec 05 passes 7/7 tests (100%).
  - Spec 09 passes all tests.
  - Full Cypress run passes.
  - npm test passes all 58 files and 903 tests.
  - npm run build succeeds with 0 errors.
- **Interface contracts**: Cypress E2E specs, CDP Emulation protocol, CDP Page.printToPDF protocol.
- **Code layout**: `cypress/e2e/`, `cypress/support/`

## Key Decisions Made
- [TBD]

## Artifact Index
- `.agents/teamwork_preview_worker_m4/BRIEFING.md` — Working memory and status
- `.agents/teamwork_preview_worker_m4/progress.md` — Liveness heartbeat
- `.agents/teamwork_preview_worker_m4/handoff.md` — Final handoff report

## Change Tracker
- **Files modified**: TBD
- **Build status**: TBD
- **Pending issues**: TBD

## Quality Status
- **Build/test result**: TBD
- **Lint status**: TBD
- **Tests added/modified**: TBD

## Loaded Skills
(None)
