# AGENTS.md — AI agents working on Ressume

Read `docs/ARCHITECTURE.md` first. It is the forensic SSOT (runtime shape,
`cvData` schema, DnD/pagination/print pipelines, registry, storage map).
Follow it; do not re-derive architecture from code walks.

## Registry: Open/Closed

- New section/item behavior = new descriptor in `src/registry/descriptors/*.js`
  (`type`, flags, `createDefaultItem`/`adaptItem`, formatters).
- Core (`BaseSection`, `BaseItem`, `pageDistributor`, context hooks) must not gain
  `switch (type)` / `if (type === ...)` branches. Use `getSectionDescriptor()`.
- Factories use `generateUniqueId(prefix)`; continuation ids `__cont_N` are canonical.

## Pagination / print invariants

- Declarative print only: `src/services/print/` + `print.css`. No inline print hacks,
  no imperative style/DOM patches outside `printExecutionDriver.js`.
- Never put `break-before` on repeated/continuation items — it breaks parity checks.
- Pagination source: `pageDistributor.js` + `pageGeometry.js` + `src/constants/geometry.js`.
  Do not hardcode A4 sizes, paddings, gaps, hysteresis (14px), or capacity floors.
- **JSDOM cannot validate print parity.** `verifyModelPdfParity` is advisory;
  real proof is Cypress (`inspectPdf`, `printWithChrome`, CDP PDF) in Chrome/Firefox.
  Do not claim print correctness from Vitest alone.

## User sovereignty

- `ActionMenu` and geometry constants (`geometry.js`, `spacing.js`, `typography.js`,
  `colors.js`) are user-owned. Do not rename/remove menu entries, reorder Design
  panel tabs, or retune scales/paddings/colors without explicit user approval.
- Fixed sections (`profile_header`, `title_subtitle`, `contact`, `about`) cannot move
  or be deleted — preserve vetoes in DnD and `deleteSection`.
- Mutations go through `applyStateWithHistory` (undo cap 30); persist via existing
  sanitizers + `localStorage`/`IndexedDB` keys. No new storage keys without need.
