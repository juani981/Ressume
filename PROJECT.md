# Project: Ressume — Full Audit & Robustness Refactoring

## Architecture
Ressume is a high-precision, client-side CV builder built with React and Vite. It utilizes `@dnd-kit` for drag-and-drop section organization and enforces discrete native A4 page boxes (210mm x 297mm) with zero dynamic reflow on print. Global document state is managed by `CVContext` with decomposed sub-hooks (`useCVData`, `useCVLayout`, `useCVHistory`, `useCVExport`).

### Core Subsystems:
1. **Editor & Layout Engine**: `<A4PageBox>` discrete physical pages calculated deterministically by `pageDistributor.js`.
2. **Context & State Management**: `CVContext.jsx` with schema validation (`cvSchemaValidator.js`) and golden ATS templates.
3. **Accessibility & Modals**: `AddSectionModal`, `AIExportModal`, `VersionManagerModal`, `ModalHelpDialog`, `BitacoraModal`, and `DesignPanel`.
4. **Resilience & Storage**: 3-tier ErrorBoundary architecture (Root, Section, Modal) + snapshot sanitization in `useCVData.js`.
5. **E2E & Test Suite**: 83 Vitest suites + 28 existing Cypress suites + 3 dedicated resilience & accessibility Cypress suites.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Vitest Baseline Fix | Fix 2 wording/length assertions in `src/locales/es/rules.json` to achieve 83/83 (100%) passing suites | M1 | Survey E3 |
| F2 | Modal Focus Trapping & Lifecycles | Implement `useFocusTrap`, Escape handling, dialog ARIA roles, and focus restoration across all 5 modals + hide inert `DesignPanel` | M1 | Survey E1 |
| F3 | Keyboard Navigation & ARIA Completeness | Restore real text in `InlineEdit` aria-label, wire `onClick`/`onKeyDown` to `RichTextToolbar`, keyboard access for peek tab, column separator ARIA, button `aria-label`s, toast `aria-live` | M1 | Survey E1 |
| F4 | Color Contrast & Invariant 20 Tone | High-contrast examples in `SuggestionTooltip`, dark mode `ObsidianCallout` contrast, global `:focus-visible`, formal Spanish copy (no voseo) | M1 | Survey E1 |
| F5 | Constants Centralization & Limits SSOT | Unify `SPACING_LIMITS`, `TYPOGRAPHY_SCALE_LIMITS`, slider bounds in `DesignPanel.jsx` and `cvSchemaValidator.js`; centralize `#3874ff` to `COLOR_TOKENS` | M2 | Survey E2 |
| F6 | Stale Fallbacks & Layout Invariants | Eradicate stale `20px` section gap, `8px` item gap, `12px` page padding fallbacks; update `challenger-print-engine-stress.test.jsx` to 6px; harmonize photo/spacer heights | M2 | Survey E2 |
| F7 | Item Contract & SSOT Decoupling | Polymorphic `onUpdateItem` prop in `PhotoItem`; migrate leaf consumers from monolithic `useCV` to granular domain hooks | M2 | Survey E2 |
| F8 | 3-Tier ErrorBoundary Architecture | Implement `RootErrorBoundary`, `SectionErrorBoundary`, `ModalErrorBoundary` using Obsidian Callout design with session recovery actions | M3 | Survey E3 |
| F9 | Storage Resilience & Malformed Data Quarantine | Protect `loadInitialCVData` with `sanitizeAndValidateCVSnapshot`; quarantine corrupted backups; guard `localStorage.setItem` against `QuotaExceededError`; add `FileReader.onerror` | M3 | Survey E3 |
| F10 | Flat File Audit Documentation (R5) | Generate `AUDIT_REPORT.md` and `PROGRESS_LOG.md` in repository root summarizing findings, architectural invariants, and session progress | M4 | Survey E1 |
| F11 | Cypress E2E Corrupt Data Suite | `resilience-01-corrupt-data-recovery.cy.js`: verify malformed JSON in storage, invalid file uploads, and corrupted clipboard recovery | M5 | Survey E3 |
| F12 | Cypress E2E Modal Focus Trap Suite | `a11y-01-keyboard-and-focus-traps.cy.js`: verify Tab focus trapping, Escape dismiss, and focus return across all modals | M5 | Survey E3 |
| F13 | Cypress E2E Contextual Help Tour Suite | `ux-19-modal-help-tours.cy.js`: verify `[data-testid="btn-modal-help"]` guided help tours across all modals | M5 | Survey E3 |
| F14 | Final E2E Test Suite Pass & Adversarial Audit | Execute 100% passing E2E suites + 83 Vitest suites + adversarial coverage hardening + Victory Audit | M6 | Survey E1/E2/E3 |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Accessibility & UX Friction Hardening (R1 + Baseline) | F1, F2, F3, F4 | none | COMPLETED |
| M2 | SOLID, SSOT & Constants Centralization (R2) | F5, F6, F7 | M1 | COMPLETED |
| M3 | Resilience, ErrorBoundaries & Corrupt Data Recovery (R3) | F8, F9 | M1 | COMPLETED |
| M4 | Flat File Audit & Logging (R5) | F10 | M1, M2, M3 | COMPLETED |
| M5 | E2E Testing Track (Cypress Suites Creation) (R4) | F11, F12, F13 | none (Parallel Track) | COMPLETED |
| M6 | Final Milestone: 100% E2E Pass & Adversarial Hardening | F14 | M1, M2, M3, M4, M5 | COMPLETED |

---

## Interface Contracts
### `useFocusTrap(containerRef, { isOpen, onClose, initialFocusRef, returnFocusRef })`
- `containerRef`: React ref to modal/popover container
- `isOpen`: boolean flag
- `onClose`: callback when Escape is pressed
- `initialFocusRef`: optional ref to focus initially (defaults to first focusable)
- `returnFocusRef`: optional element to restore focus when modal closes

### `RootErrorBoundary` / `SectionErrorBoundary` / `ModalErrorBoundary`
- Catches rendering exceptions via `componentDidCatch` / `getDerivedStateFromError`.
- Renders Obsidian Callout structure: `.obsidian-callout` with `background: rgba(233, 49, 71, 0.1)`, `border-left: 4px solid rgba(233, 49, 71, 1)`, red bold title, `🛑` icon.
- Provides fallback actions: "Recuperar sesión y reintentar", "Descargar copia de seguridad en memoria", "Restablecer plantilla inicial segura".

### `sanitizeAndValidateCVSnapshot(candidate)`
- In `cvSchemaValidator.js`: validates schema structure, sanitizes layout numbers against canonical bounds, guarantees non-null sections array.

---

## Code Layout
- `src/components/common/RootErrorBoundary.jsx`: Root crash fallback
- `src/components/common/ModalErrorBoundary.jsx`: Modal dialog crash boundary
- `src/components/CV/SectionErrorBoundary.jsx`: Individual section error boundary
- `src/hooks/useFocusTrap.js`: Reusable keyboard trap hook
- `src/constants/spacing.js`, `geometry.js`, `typography.js`, `colors.js`: Canonical constants SSOT
- `cypress/e2e/resilience-01-corrupt-data-recovery.cy.js`: E2E corrupt data recovery
- `cypress/e2e/a11y-01-keyboard-and-focus-traps.cy.js`: E2E modal keyboard focus trap
- `cypress/e2e/ux-19-modal-help-tours.cy.js`: E2E modal help tour validation
- `AUDIT_REPORT.md` & `PROGRESS_LOG.md`: Root audit flat files
