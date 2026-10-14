# Contributing to Ressume

## Workflow

1. Branch from `main`: `git checkout -b feat/<short-name>`
2. Install: `npm install`
3. Develop: `npm run dev` (Vite at `http://localhost:5173`, host `0.0.0.0`, polling)
4. Test units: `npm test` (Vitest run) or `npm run test:watch`
5. Test E2E: `npm run test:e2e` (Cypress + Chrome) or `npm run cypress:open`
   - Firefox: `npm run test:e2e:firefox` / `npm run cypress:all` (Chrome + Firefox)
   - Docker: `npm run test:e2e:docker`
6. Build: `npm run build` (`vite build`, chunk warning limit 1600). Preview: `npm run preview`
7. Open a small, focused PR against `main` with tests.

## Test stacks

- **Vitest + jsdom** (`vite.config.js: test.environment jsdom`, setup `src/tests/setup.js`):
  globals on, `css: true`, include `src/**/*.{test,spec}.{js,jsx,tsx}`.
  Setup mocks `localStorage`, `matchMedia`, `ResizeObserver`, `IntersectionObserver`,
  `window.print/focus/scrollTo`, iframe `contentWindow.print`, `URL.createObjectURL`.
  Under jsdom, CV seed returns `defaultSchema` (not random demo data).
- **Cypress 16** (`cypress.config.js`, `baseUrl: http://localhost:5173`, 1440x900,
  `supportFile: cypress/support/e2e.js`): PDF inspection (`inspectPdf`, `pdffonts`
  fallback), headless-Chrome `printWithChrome --print-to-pdf`, UX heatmap/audit tasks.

## Conventions

- **No `type` switches in core:** `BaseSection` / `BaseItem` resolve behavior from
  `src/registry/sectionRegistry.js`. Add new section types as descriptors in
  `src/registry/descriptors/*.js` (flags, factories, formatters) — never branch core on `type`.
- **Descriptor registry (Open/Closed):** extend via `registerSectionType`; keep
  `itemComponent` / `sectionComponent` escape hatches local to the descriptor.
- **Errors:** reuse `RootErrorBoundary` / `SectionErrorBoundary`; user-facing messages
  use Obsidian callout CSS classes (`.obsidian-callout`, danger/caution/info tokens
  in `src/constants/colors.js`).
- **DnD:** use `@dnd-kit/core@6` + `@dnd-kit/sortable@8` (`useCVDndCoordinator`,
  pointer distance 5 + keyboard sensor). Do not introduce swapy or other DnD libs.
- **Print CSS only, declarative:** pagination/print lives in `src/services/print/` +
  `print.css` (`@page { size: A4; margin: 0 }`, `.a4-page-box`, `.cv-block` avoid rules).
  No inline print style hacks, no imperative DOM print tweaks outside the driver.
- **Geometry SSOT:** import from `src/constants/geometry.js` / `spacing.js` /
  `typography.js` (A4 210x297mm, 794x1123px @96dpi). No magic numbers.
- **Storage:** `localStorage['cvData']` + sanitizers in `src/utils/cvSchemaValidator.js`;
  versions in IndexedDB `RessumeDB.versions`. Quarantine corrupt snapshots, never crash load.
