# Ressume

Client-side WYSIWYG resume editor. React 18 + Vite 5. Discrete A4 page boxes in the
editor, deterministic pagination in state, passive print projection to PDF. No backend
required for editing, pagination, or PDF export.

## Quickstart

```bash
npm install
npm run dev      # Vite on http://localhost:5173
npm test         # Vitest (jsdom)
```

Optional env (see `.env.example`):

| Var | Default | Effect |
|---|---|---|
| `VITE_ENABLE_TWO_COLUMN_MODE` | `false` | Shows the 1/2-column layout toggle (`LayoutModeToggle.jsx`) |
| `VITE_ENABLE_BITACORA` | `false` | Shows the Bitácora career-playbook UI (`ActionMenuRoot.jsx`) |
| `VITE_ENABLE_BITACORA_TOUR` | unset | Enables the Bitácora onboarding nudge (`TourContext.jsx`) |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | unset | Enables Supabase-backed Bitácora posts/votes; without them Bitácora falls back to local data (`supabaseClient.js`) |

## How it works

```
CVProvider (src/context/CVContext.jsx)
  └─ cvData: { profile, layout, sections[] }  — single source of truth, persisted to localStorage['cvData']
       ├─ useDocumentPages → PageModel[] → <A4PageBox> per page (src/App.jsx)
       ├─ useCVDndCoordinator → @dnd-kit sensors/handlers (src/hooks/)
       └─ services/print/* → sanitized clone of #area-cv → hidden iframe → window.print()
```

- **State:** `src/context/CVContext.jsx` facades four domain hooks in
  `src/context/hooks/`: `useCVData` (CRUD + persistence + i18n), `useCVHistory`
  (undo/redo, cap 30), `useCVLayout` (geometry, overlays, column moves),
  `useCVExport` (toast + PDF/JSON export).
- **Pagination:** `src/utils/pageDistributor.js:distributeSectionsToPages` partitions
  sections/items into frozen `PageModel`s (`src/utils/pageModelTypes.js`). Live DOM
  heights (`useLiveDomHeights`) feed estimates; explicit `page`/`breakBefore` props win,
  otherwise capacity packing with bullet-level splitting and a 14px hysteresis deadband.
- **Print:** `src/services/print/` — `cleanHtmlGenerator.js` (sanitize + layout CSS),
  `printExecutionDriver.js` (`executeCleanPrint`), `pdfTitleService.js`,
  `printFonts.js` (static TTF to preserve the PDF text layer). Editor-only chrome is
  stripped by `.no-print` / `[data-editor-ui]` selectors, never by restructuring pages.
- **Sections:** Open/Closed registry. `src/registry/sectionRegistry.js` +
  `src/registry/descriptors/*.js` (18 types). `BaseSection`/`BaseItem` resolve the
  descriptor at render time — no `if (type ===)` in core. See
  `docs/EXTENDING_SECTIONS.md`.
- **AI:** offline rule engine (`src/ai-knowledge/`, `src/locales/*/rules.json`) plus
  copy-paste LLM prompt pack (`src/locales/*/prompts.json`, 10 prompts) with a
  paste-back bidirectional contract (`src/services/ai/bidirectionalPromptContract.js`).
  No LLM calls at runtime.

## Docs

- `docs/ARCHITECTURE.md` — system architecture, data flow, pagination, print pipeline
- `docs/FILEMAP.md` — file-by-file mental map with paths
- `docs/EXTENDING_SECTIONS.md` — add a section type without touching core
- `CONTRIBUTING.md` — workflow, tests, conventions
- `AGENTS.md` — AI-agent working notes (read this before editing pagination/print)

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `preview` | Vite dev / prod build / preview |
| `npm test` / `test:watch` | Vitest run / watch (`src/tests/setup.js`, jsdom) |
| `npm run test:e2e` | Cypress (Chrome); `:firefox`, `:docker` variants |
| `npm run cypress:open` | Cypress interactive |

## License

MIT — see `LICENSE`.
