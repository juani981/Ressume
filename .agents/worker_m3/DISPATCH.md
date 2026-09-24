# Dispatch: Worker M3 — AIExportModal UI Refactoring

## Mandatory Reading
- `/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md` (lines 589-658)
- `/home/juani/Documentos/Ressume/.agents/teamwork_preview_orchestrator_14/PROJECT.md`
- `/home/juani/Documentos/Ressume/.agents/explorer_survey_1/survey_report.md` (Contains exact before-and-after JSX snippets and state design)
- `AGENTS.md` (Obsidian callout rules, dynamic positioning, etc.)

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

STRICT RULE: DO NOT execute automated git commits. Changes must stay in the working tree for user review.

## File Ownership
You exclusively own and may modify:
- `src/components/Editor/AIExportModal.jsx`

DO NOT modify any other files.

## Objective & Requirements
Refactor `src/components/Editor/AIExportModal.jsx` according to R1 and Survey 1 specifications:
1. **Automatic Layout Mode Detection**:
   - Do NOT maintain manual `layoutMode` state.
   - Detect layout dynamically: `const isAtsMode = cvData.layout?.isAtsMode === true || cvData.layout?.type === '1-column';`
   - Set `targetCvData.layout.type = isAtsMode ? '1-column' : '2-column'`.
   - Keep interactive layout and format selectors hidden/commented out in the JSX.
2. **Semantic Markdown Single Format**:
   - Fixed to Semantic Markdown (`selectedFormat = 'markdown'`).
   - Download filename extension fixed to `.md`.
3. **Universal User Commentary Textarea**:
   - Add state: `const [userCommentary, setUserCommentary] = useState('');`
   - Render an optional freeform textarea (`data-testid="ai-user-commentary"`) available across all selected prompts.
   - Label: e.g. "Instrucciones o Contexto Adicional (Opcional)" / "Additional Instructions or Context (Optional)".
   - Pass `userCommentary` into `buildAIPromptPayload(targetCvData, selectedPromptId, { format: selectedFormat, jobDescription, userCommentary, lang: activeLanguage })`.
4. **Gated Job Description Field**:
   - Render `job_description` textarea (`data-testid="ai-job-description"`) ONLY when `selectedPrompt.required_inputs?.includes('job_description')` (which is true exclusively for `job_matcher`).
   - It must coexist cleanly below `user_commentary` when active.
5. **Synchronous Live Preview Reactivity**:
   - The `<pre>` preview container displays `compiledPayload`.
   - Ensure `useMemo` dependency array contains `[targetCvData, selectedPromptId, userCommentary, jobDescription, activeLanguage]`.
   - Any typing in `userCommentary` or `jobDescription` must immediately reflect in the preview `<pre>` text.
6. **Preserve Clean Styles**:
   - Ensure clean layout, Obsidian callout styling where alerts appear, no unicode emojis (only Lucide icons per AGENTS.md), and proper copy/download action buttons.

## Verification
Run tests or verify rendering via Vitest or build.
Write your completion report to `/home/juani/Documentos/Ressume/.agents/worker_m3/handoff.md` and send a message.

## 2026-09-12T02:52:37Z
You are Worker M3. Your working directory is: /home/juani/Documentos/Ressume/.agents/worker_m3
Read your dispatch instructions in:
/home/juani/Documentos/Ressume/.agents/worker_m3/DISPATCH.md
and the authoritative user request in:
/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md (lines 589-658).
Reference specifications:
/home/juani/Documentos/Ressume/.agents/explorer_survey_1/survey_report.md
/home/juani/Documentos/Ressume/.agents/teamwork_preview_orchestrator_14/PROJECT.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

STRICT RULE: DO NOT execute automated git commits. Changes must stay in the working tree for user review.

File ownership:
- src/components/Editor/AIExportModal.jsx

Auto-detect active layout without dropdowns, lock format to Semantic Markdown, add universal user_commentary textarea, gate job_description exclusively for job_matcher, ensure synchronous live preview reactivity in compiled payload, and respect Obsidian callout and Lucide icon rules.

Write your report to:
/home/juani/Documentos/Ressume/.agents/worker_m3/handoff.md
When done, send a message to parent.
