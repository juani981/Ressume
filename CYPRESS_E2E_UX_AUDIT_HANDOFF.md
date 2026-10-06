# Ressume — E2E Testing, UX Friction Audit & Agent Handoff Snapshot

> **Branch**: `feat/cypress-e2e-ux-audit`  
> **Timestamp**: 2026-10-05T00:03:00-03:00  
> **Author / Role**: Senior Software Architect & Systems Engineer  
> **Target Audience**: Next Agent / Engineer / LLM Model continuing this work

---

## 1. Executive Snapshot & Primary Objectives

### Original Goal
The primary objective of this phase was to:
1. Install and configure **Cypress E2E testing** supporting both **Chromium** (`Chrome for Testing`) and **Firefox** (`Mozilla Firefox 157`).
2. Create comprehensive end-to-end user tests covering every single user interaction and editing feature in the Ressume CV builder.
3. Simulate a **naive first-time user ("dumb user")** who arrives at the application with zero prior knowledge and needs to understand what to do, how to edit, how to adjust design and layout, how to version snapshots, and how to print/export.
4. Instrument physical interaction telemetry (mouse clicks, coordinates, viewport spatial distribution) to generate a **2D viewport interaction heat map**.
5. Log cognitive friction at every step against 8 architectural usability questions:
   - *What can I do?*
   - *What should I do?*
   - *Was what I just did natural or did I have to click around?*
   - *Is the visual layout clear?*
   - *Is the text clear?*
   - *Are legends and tooltips informative?*
   - *Are there enough tutorials if something is complex?*
   - *Is the system assuming I have prior knowledge?*
6. Dump all findings, metrics, and friction analysis to a master file (`UX_AUDIT_AND_FRICTION_REPORT.md`).
7. Commit cleanly on `feat/cypress-e2e-ux-audit` using conventional commits without AI attribution.

---

## 2. Completed Milestones & Current State

### Dual Browser Infrastructure
- **Chromium**: Configured using `Google Chrome for Testing 152.0.7977.42` (`/home/juani/.local/bin/chromium` and `google-chrome`).
- **Firefox**: Downloaded, verified, and configured using native `Mozilla Firefox 157.0` (`/home/juani/.local/share/firefox/firefox` symlinked to `/home/juani/.local/bin/firefox`).
- **Cypress 16.1.1**: Verified in cache and integrated with Cypress CLI commands.
- **NPM Scripts** added to `package.json`:
  - `npm run cypress:chrome`: Runs Cypress on Chromium headless.
  - `npm run cypress:firefox`: Runs Cypress on Firefox headless.
  - `npm run cypress:all`: Runs Cypress across both browsers consecutively.
  - `npm run test:e2e`: Primary E2E script alias for Chromium.
  - `npm run test:e2e:firefox`: Primary E2E script alias for Firefox.

### Telemetry & Heatmap Engine
- Built `cypress/support/heatmapAndAuditEngine.js`:
  - Physical coordinate tracking normalized across viewport dimensions (`1440x900`).
  - Spatial 2D density matrix generator (`buildSpatialHeatmap`) outputting ASCII heat maps.
  - Cognitive step observation logger (`recordUxObservation`) capturing clicks required, visual clarity scores (1-5), and friction severity.
  - Master report compiler (`compileUxAuditReport`) outputting markdown tables and recommendations.
- Cypress tasks in `cypress.config.js`:
  - `recordInteraction`, `recordUxObservation`, `compileUxAuditReport`, `resetAuditData`.
- Custom Cypress commands in `cypress/support/commands.js`:
  - `cy.trackClick(selector, label, options)`
  - `cy.trackInput(selector, text, label)`
  - `cy.trackObservation(observationData)`
  - `cy.generateUxReport(targetFilename)`
  - `cy.waitForFonts()`
  - `cy.stubPrint()`

### The 8 UX E2E Test Suites (`cypress/e2e/ux-*.cy.js`)
| Spec File | Scope & Tested Capabilities | Result (Chromium) | Result (Firefox) |
| :--- | :--- | :---: | :---: |
| `ux-01-onboarding-and-navigation.cy.js` | First-time clean visitor state, canvas visibility, Joyride onboarding tour discoverability, 16px peek rail handle, pin/unpin ergonomics. | **PASS (1/1)** | **PASS (1/1)** |
| `ux-02-inline-cv-editing.cy.js` | In-place WYSIWYG text editing: candidate name (`.home__title`), subtitle (`.home__subtitle`), contacts (`.social__link.contact-item-pill`), job details & bullets, skills tags, education. | **PASS (3/3)** | **PASS (3/3)** |
| `ux-03-layout-switching-and-resizing.cy.js` | Vertical column resizer divider dragging, layout mode toggle (2-column visual vs 1-column ATS mode), `@dnd-kit` drag handles. | **PASS (3/3)** | **PASS (3/3)** |
| `ux-04-design-panel-and-customization.cy.js` | Design popover tabs: typography font family & scale multiplier (`1.00x`), spacing sliders (`pagePadding` 24px, `sectionGap` 12px, `itemGap` 6px), color swatch presets. | **PASS (1/1)** | **PASS (1/1)** |
| `ux-05-version-history-and-preview.cy.js` | Version manager snapshot creation, named backups, fullscreen scrollable preview (zero controls), direct load, undo/redo toolbar affordances. | **PASS (2/2)** | **PASS (2/2)** |
| `ux-06-ai-assistance-and-translation.cy.js` | AI prompts modal (ATS audit, STAR method), Translation hub (ES/EN toggle), Bring Your Own CV converter, Obsidian callout tooltips (`.obsidian-callout`). | **PASS (4/4)** | **PASS (4/4)** |
| `ux-07-pagination-and-print-lifecycle.cy.js` | Multipage discrete `<A4PageBox>` containers (`210mm x 297mm`), page fold badge indicators, clean print PDF export progress toast. | **PASS (2/2)** | **PASS (2/2)** |
| `ux-08-naive-user-journey-and-friction-audit.cy.js` | Master end-to-end cognitive simulation of a first-time candidate executing all key tasks, telemetry logging, and report compilation. | **PASS (1/1)** | **PASS (1/1)** |
| **TOTAL** | **Full application UX interaction & feature coverage** | **PASS (17/17)** | **PASS (17/17)** |

### Unit & Integration Test Suite Status
- **Vitest**: All 79 test files passing (1,151 tests in green).
- **Vite Build**: Clean production build without errors (`npm run build`).

---

## 3. Top Friction Findings & Architectural UX Analysis

From the compiled `UX_AUDIT_AND_FRICTION_REPORT.md` and telemetry data:

### Friction 1: Joyride Tour Backdrop Overlay Intercepts First Interaction
- **Root Cause**: On a fresh session with an empty `localStorage`, Joyride mounts with `blockTargetInteraction: true` and an SVG backdrop (`fill="#00000080"`).
- **User Impact**: A user trying to click directly on the resume to start typing cannot do so until they find and click the "Omitir" or "Siguiente" button on the floating tour tooltip.
- **Architectural Solution**: Make the canvas surface interactive by default or automatically dismiss the tour when clicking directly on the paper canvas.

### Friction 2: Collapsed Left Toolbar Peek Rail Discoverability
- **Root Cause**: When `action_menu_pinned` is false (default for clean visitors), `ActionMenuRoot` collapses off-screen leaving only a 16px wide handle with a subtle chevron icon.
- **User Impact**: Users expecting top controls (Save, Export, Print, Design) spent time looking around the screen before discovering the 16px handle on the left edge.
- **Architectural Solution**: Show an initial animated pulse or subtle floating badge on the peek handle during the first 10 seconds of a new visitor session: *"Herramientas y Exportación aquí"*.

### Friction 3: Popover DOM Persistence (`opacity: 0` vs Unmounting)
- **Root Cause**: `DesignPanel.jsx` stays permanently mounted in the DOM and toggles `opacity: 0` / `pointerEvents: 'none'` rather than unmounting when closed.
- **User Impact**: While visually hidden, screen readers or automated accessibility checks may still detect inactive controls unless `aria-hidden="true"` is strictly synchronized.
- **Architectural Solution**: Add `aria-hidden={!isOpen}` to `.design-popover` or conditionally unmount when transitions finish.

### Friction 4: Single Source of Truth Alignment for Layout & Design
- **Status**: Canonical design tokens are strictly preserved:
  - Titles: `18px`
  - Body: `12px`
  - Lists: `12px`
  - Scale: Multiplier format (`1.00x`), never `px`
  - Line Height: `1.30x`
  - Page Padding: `24px`
  - Section Gap: `12px`
  - Item Gap: `6px`
- Tests and UI sliders match these values symmetrically.

---

## 4. Master Prompt for Next Agent / Model

Copy and pass the following prompt block verbatim to the next agent:

```markdown
You are taking over the Ressume codebase on git branch `feat/cypress-e2e-ux-audit`.
Read `CYPRESS_E2E_UX_AUDIT_HANDOFF.md` and `UX_AUDIT_AND_FRICTION_REPORT.md` first.

### Context & Current State
1. Cypress 16.1.1 E2E test suite is fully installed, configured, and 100% green across both Chromium and Firefox:
   - Run `npx cypress run --browser chrome-for-testing --spec 'cypress/e2e/ux-*.cy.js'` (17/17 tests pass)
   - Run `npx cypress run --browser firefox --spec 'cypress/e2e/ux-*.cy.js'` (17/17 tests pass)
2. All 79 Vitest suites pass (`npm test`, 1,151 tests). Production build is clean (`npm run build`).
3. Viewport heatmap telemetry and friction data are generated in `cypress/fixtures/ux-heatmap-telemetry.json` and compiled into `UX_AUDIT_AND_FRICTION_REPORT.md`.

### Critical Invariants to Obey (Non-Negotiable)
- **Invariant 18 (AGENTS.md)**: Absolute user sovereignty over `src/components/Editor/ActionMenu/ActionMenuRoot.jsx`. Never revert or overwrite manual user modifications in ActionMenu.
- **Invariant 19 (AGENTS.md)**: Absolute user sovereignty over layout constants. Never change the canonical tokens:
  - Titles: 18px, Body: 12px, Lists: 12px, Scale: 1.00x, Line Height: 1.30x, pagePadding: 24px, sectionGap: 12px, itemGap: 6px.
- **Invariant 15 & 16**: Discrete A4 boxes (`210mm x 297mm`, `overflow: hidden`). Zero dynamic reflow on print — editor is the single source of truth.
- **Commit Style**: Conventional commits only (`feat:`, `fix:`, `chore:`, etc.). Never add "Co-Authored-By" or AI attribution.

### Priority Backlog for Next Phase
Based on the UX friction audit:
1. **P1 — Onboarding Ergonomics**:
   - Enhance first-time visitor experience: allow clicking anywhere on `#area-cv` to automatically dismiss the Joyride tour backdrop without blocking edits.
   - Add a subtle pulse or introductory badge to the collapsed 16px peek handle on the left edge so naive users immediately notice where tools and PDF export live.
2. **P2 — Accessibility & Popovers**:
   - Synchronize `aria-hidden={!isOpen}` on `.design-popover` in `DesignPanel.jsx` when collapsed.
3. **P3 — Ongoing E2E Maintenance**:
   - Maintain the Cypress UX suite alongside CI/CD workflows so that regression testing validates both Chromium and Firefox.
```

---

## 5. Repository File Map for E2E & UX Audit

- `UX_AUDIT_AND_FRICTION_REPORT.md`: Comprehensive UX report with ASCII spatial heatmap, cognitive walkthrough, and friction inventory.
- `cypress.config.js`: Cypress configuration (desktop viewport 1440x900, telemetry tasks).
- `cypress/support/heatmapAndAuditEngine.js`: Telemetry accumulator and markdown report compiler.
- `cypress/support/commands.js`: Custom Cypress commands (`trackClick`, `trackObservation`, `generateUxReport`, `waitForFonts`, `stubPrint`).
- `cypress/support/e2e.js`: Global support setup and storage initialization.
- `cypress/fixtures/ux-heatmap-telemetry.json`: Raw physical coordinate records and JSON dump.
- `cypress/e2e/ux-01-onboarding-and-navigation.cy.js`: Onboarding & navigation discoverability spec.
- `cypress/e2e/ux-02-inline-cv-editing.cy.js`: WYSIWYG text & bullet point editing spec.
- `cypress/e2e/ux-03-layout-switching-and-resizing.cy.js`: Column resizer & layout switching spec.
- `cypress/e2e/ux-04-design-panel-and-customization.cy.js`: Design panel (typography/spacing/colors) spec.
- `cypress/e2e/ux-05-version-history-and-preview.cy.js`: Version manager, fullscreen preview & undo/redo spec.
- `cypress/e2e/ux-06-ai-assistance-and-translation.cy.js`: AI prompts, translation & Obsidian callouts spec.
- `cypress/e2e/ux-07-pagination-and-print-lifecycle.cy.js`: Discrete A4 pages & print lifecycle spec.
- `cypress/e2e/ux-08-naive-user-journey-and-friction-audit.cy.js`: Master cognitive user journey spec.
