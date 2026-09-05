# BRIEFING — 2026-09-03T02:04:00Z

## Mission
Formulate the exact, line-by-line fix strategy for the 5 failing tests in `npm test` across `SuggestionTooltip.jsx` and `InlineEdit.jsx`.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigator, synthesizer
- Working directory: /home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o6_plan_2
- Original parent: c48f1052-7dd0-4051-b6c6-e724f20ce04a
- Milestone: Plan 2 - Baseline Defect Fixes Implementation Plan

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- All output in own folder (`.agents/teamwork_preview_explorer_o6_plan_2/`)
- Adhere to AGENTS.md rules for Obsidian Callouts & Tooltip positioning
- Provide exact line-by-line snippets for worker

## Current Parent
- Conversation ID: c48f1052-7dd0-4051-b6c6-e724f20ce04a
- Updated: 2026-09-03T02:04:00Z

## Investigation State
- **Explored paths**: `src/components/Editor/InlineEdit.jsx`, `src/components/Editor/SuggestionTooltip.jsx`, `src/tests/challenger-stress-suite.test.jsx`, `src/tests/iconography.test.jsx`, `src/tests/hyperlink-edit.test.jsx`, `src/tests/dom-geometry-typography.test.jsx`, `PROJECT.md`, `ORIGINAL_REQUEST.md`
- **Key findings**:
  1. `InlineEdit.jsx:5`: `const { activeLanguage } = useCV()` throws TypeError when rendered outside `<CVProvider>`; safe fallback `const cvContext = useCV(); const activeLanguage = cvContext?.activeLanguage || 'es';` eliminates the crash in `hyperlink-edit.test.jsx:140`.
  2. `SuggestionTooltip.jsx:18-38`: Deviated from AGENTS.md Rule 3 by using `+ 4px`, `+ 12px`, 16px clamp, and sliding width clamping. Restoring standard positioning math (`rect.right + 20px`, `rect.left - 320px` flip, `top = rect.top`, `vh - 420` bottom clamp, and `20px` min clamp) resolves all failures in `challenger-stress-suite.test.jsx:313`, `:406`, and `iconography.test.jsx:166`, `:196`.
  3. Reverting uncommitted test file drifts in `src/tests/challenger-stress-suite.test.jsx` and `src/tests/dom-geometry-typography.test.jsx` back to pristine git HEAD brings all 12 test suites into 100% agreement with `AGENTS.md` and guarantees 240/240 tests pass.
- **Unexplored areas**: None for Plan 2 scope. All 5 defects investigated, mapped, and mathematically proven.

## Key Decisions Made
- Formulated precise, drop-in line edits for Worker.
- Recommended Worker restore uncommitted changes in `challenger-stress-suite.test.jsx` and `dom-geometry-typography.test.jsx` to prevent regression.

## Artifact Index
- DISPATCH.md — Incoming mission prompt
- progress.md — Liveness heartbeat
- analysis.md — Full defect analysis and mathematical proof
- handoff.md — 5-component handoff report with exact code snippets
