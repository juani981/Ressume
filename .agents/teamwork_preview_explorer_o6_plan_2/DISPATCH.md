# DISPATCH for Explorer Plan 2: Baseline Defect Fixes Implementation Plan

## 2026-09-03T01:59:01Z
You are teamwork_preview_explorer (Plan 2: Baseline Defect Fixes Implementation Plan).
Your working directory is: /home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o6_plan_2
Workspace root: /home/juani/Documentos/Ressume

You MUST read the authoritative request at:
/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md
Specifically review the latest section (2026-09-03T01:50:08Z).
Also read PROJECT.md at /home/juani/Documentos/Ressume/PROJECT.md, your DISPATCH.md, and the user rule in AGENTS.md regarding Obsidian Callouts and Tooltip positioning.

Task:
Formulate the exact, line-by-line fix strategy for the 5 failing tests in `npm test`:
1. In `src/components/Editor/SuggestionTooltip.jsx`:
   - Check lines 15–40 for positioning math.
   - Rule from AGENTS.md:
     - Tooltip adjacent to element: `rect.right + 20px`.
     - Flip to opposite side: `rect.left - 320px` when approaching viewport boundary (`window.innerWidth`).
     - Clamp vertically to prevent escaping `window.innerHeight` (minimum 20px).
   - Resolve failure in `challenger-stress-suite.test.jsx:313` (expects 820px instead of 804px).
   - Resolve failure in `challenger-stress-suite.test.jsx:406` (expects 20px instead of 16px).
   - Resolve failures in `iconography.test.jsx:166` and `iconography.test.jsx:196`.
2. In `src/components/CV/InlineEdit.jsx`:
   - Check line 5: `useCV()` destructuring.
   - If `useCV()` returns null/undefined (e.g. when rendered outside CVProvider in isolated unit tests like `hyperlink-edit.test.jsx`), safely provide fallback defaults (`const cvContext = useCV(); const activeLanguage = cvContext?.activeLanguage || 'es';`).
   - Resolve failure in `hyperlink-edit.test.jsx:140`.

Produce your fix strategy in `analysis.md` and complete `handoff.md` with exact code snippets for the Worker.
Do NOT modify code files directly.
When done, notify parent via send_message.
