# Dispatch: Explorer Survey 1 — UI & AIExportModal

## Objective
Investigate the current UI and modal implementation for AI CV Export in Ressume:
- Locate and examine `src/components/Editor/AIExportModal.jsx` and any parent components (e.g. `ActionMenu.jsx`, `App.jsx`).
- Analyze how layout mode (`cvData.layout?.type` or `isAtsMode`) is currently detected or selected.
- Identify current layout and format dropdowns/selectors and determine how to keep unneeded selectors hidden/commented while defaulting to active layout and Semantic Markdown.
- Plan the addition of the `user_commentary` optional freeform textarea for user instructions across all prompts.
- Analyze how `job_description` is currently handled and ensure it appears exclusively for `job_matcher`, coexisting cleanly with `user_commentary`.
- Verify live preview reactivity when updating `user_commentary` or `job_description`.
- Check all associated styling (Obsidian callout rules, modal layout) and existing UI/modal tests.

## Files to Inspect
- `/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md` (lines 589-658)
- `src/components/Editor/AIExportModal.jsx`
- `src/components/Editor/ActionMenu.jsx`
- `src/context/CVContext.jsx` (and layout hooks)
- Relevant tests under `src/tests/` or `tests/`
- `AGENTS.md`

## Output Requirements
Write your detailed findings and architectural recommendations to:
`/home/juani/Documentos/Ressume/.agents/explorer_survey_1/survey_report.md`
Include:
1. Current component structure and state in `AIExportModal.jsx`
2. How to auto-detect layout without UI dropdowns
3. How to lock format to Semantic Markdown
4. Textarea design and state binding for `user_commentary` and `job_description`
5. Preview reactivity mechanism
6. Existing tests and proposed new UI tests
7. Potential risks or edge cases

When complete, write your report and send a handoff message.

## 2026-09-12T02:46:44Z
You are Explorer Survey 1. Your working directory is: /home/juani/Documentos/Ressume/.agents/explorer_survey_1
Read your dispatch instructions in:
/home/juani/Documentos/Ressume/.agents/explorer_survey_1/DISPATCH.md
and the authoritative user request in:
/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md (specifically lines 589-658).

Focus on UI & AIExportModal:
- Inspect src/components/Editor/AIExportModal.jsx and its interaction with ActionMenu.jsx, App.jsx, CVContext.jsx.
- Analyze how to automatically detect active layout mode (cvData.layout?.type / isAtsMode) without showing layout or format dropdowns (comment/hide unneeded selectors).
- Plan locking format to Semantic Markdown.
- Plan addition of user_commentary optional freeform textarea for all prompts.
- Plan keeping job_description exclusively for job_matcher, coexisting with user_commentary.
- Check live preview reactivity.
- Examine existing modal tests and outline required tests.

Write your comprehensive report to:
/home/juani/Documentos/Ressume/.agents/explorer_survey_1/survey_report.md
When finished, send a handoff message to parent.
