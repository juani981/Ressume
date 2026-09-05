# BRIEFING — 2026-09-03T03:23:00Z

## Mission
Investigate Epic 2: Rich Inline Text Editing Toolbar with Persistent State, analyzing inline editing, state representation, floating toolbar positioning, shortcuts, and cross-engine rendering.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: /home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o7_survey_2
- Original parent: 6da0cbcd-6600-4b46-a15f-8326361383e5
- Milestone: Epic 2 Survey & Architecture

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Adhere strictly to AGENTS.md rules (Obsidian Callouts, @dnd-kit only, dynamic bounding rect tooltips, Tech domain AI suggestions)
- Do not modify source code directly
- Focus on Epic 2: Rich Inline Text Editing Toolbar with Persistent State

## Current Parent
- Conversation ID: 6da0cbcd-6600-4b46-a15f-8326361383e5
- Updated: 2026-09-03T03:19:13Z

## Investigation State
- **Explored paths**: `src/components/Editor/InlineEdit.jsx`, all 13 item renderers in `src/components/CV/items/`, `BaseSection.jsx`, `BaseItem.jsx`, `CVHeader.jsx`, `src/utils/schema.js`, `src/context/CVContext.jsx`, `src/utils/staticHtmlPdfEngine.js`, `src/utils/translationEngine.js`, `src/utils/itemAdapter.js`, `src/App.jsx`, `src/components/Editor/SuggestionTooltip.jsx`, test suites in `src/tests/`.
- **Key findings**:
  1. `InlineEdit.jsx` currently toggles between `<span>` and `<input>`/`<textarea>`, which strictly accept only plain text and cannot render rich text or bold/italic styling in-place.
  2. Text formatting (bold, italic, alignment) is best represented as an HTML string (`<b>`, `<i>`, and `style="text-align: ..."`), which preserves 100% schema backward compatibility with `schema.js`, allows zero-migration `localStorage` persistence, and is already anticipated by `translationEngine.js`.
  3. Floating toolbar must be a global singleton mounted in `App.jsx`, tracking `getBoundingClientRect()` of the active `InlineEdit` per AGENTS.md Rule 3, positioned above the text (with viewport boundary flip to below and horizontal clamp) so it never obscures the active field.
  4. Focus loss when clicking toolbar buttons is avoided by applying `onMouseDown={(e) => e.preventDefault()}` on all toolbar buttons, preserving text selections.
  5. Cross-engine rendering: Live DOM uses `contentEditable` and `dangerouslySetInnerHTML`; `staticHtmlPdfEngine.js` uses `renderRichHTML` preserving safe tags while stripping XSS; `@react-pdf/renderer` uses a `DOMParser` tokenizer (`parseHtmlToTokens`) mapping into nested `<Text>` components.
  6. CVContext window keydown listener must not hijack Ctrl+Z while an editable field is actively focused.
- **Unexplored areas**: None for Epic 2 survey.

## Key Decisions Made
- Chose sanitized HTML strings for state representation to guarantee schema non-regression and localStorage compatibility.
- Designed singleton `FormattingToolbar.jsx` in `App.jsx` adhering to Rule 3 dynamic bounding rect tracking.
- Designed token parser (`parseHtmlToTokens`) for `@react-pdf/renderer` integration.
- Formulated test plan and detailed architecture in `handoff.md`.

## Artifact Index
- handoff.md — Comprehensive investigation report and implementation blueprint for Epic 2
- progress.md — Liveness heartbeat and milestone tracking
- DISPATCH.md — Assignment specification and timestamps
