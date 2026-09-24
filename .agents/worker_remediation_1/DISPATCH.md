# Dispatch: Worker Remediation 1 — Character Remediation for Dingbat Symbol

## Mandatory Reading
- `/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md` (lines 589-658)
- `/home/juani/Documentos/Ressume/.agents/reviewer_1/handoff.md` (Finding 1)
- `AGENTS.md`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

STRICT RULE: DO NOT execute automated git commits. Changes must stay in the working tree for user review.

## File Ownership
You exclusively own and may modify:
- `src/locales/es/prompts.json`
- `src/ai-knowledge/prompts.json`

## Objective & Task
Reviewer 1 found that `translate_english.description` and `task` in `src/locales/es/prompts.json` and `src/ai-knowledge/prompts.json` contain the Unicode Dingbat arrow `➔` (U+2794). Because `translate_english.description` is rendered in the UI callout of `AIExportModal.jsx`, it triggers an emoji/symbol ban test failure in `src/tests/challenger-2-modal-stress.test.jsx > S6.1`.

Your task:
1. In `src/locales/es/prompts.json`: replace all occurrences of `➔` with ASCII `->`.
2. In `src/ai-knowledge/prompts.json`: replace all occurrences of `➔` with ASCII `->`.
3. Verify that both JSON files remain valid JSON.
4. Run:
   - `npx vitest run src/tests/challenger-2-modal-stress.test.jsx`
   - `npx vitest run src/tests/aiExportModal.test.jsx`
   - `npx vitest run src/tests/ai-prompts-and-exporter.test.js`
   - Full repository suite: `npx vitest run`
   - `npm run build`
5. Verify that ZERO automated git commits were made.



## 2026-09-12T03:10:42Z
You are Worker Remediation 1. Your working directory is: /home/juani/Documentos/Ressume/.agents/worker_remediation_1
Read your dispatch instructions in:
/home/juani/Documentos/Ressume/.agents/worker_remediation_1/DISPATCH.md
and Reviewer 1's finding in:
/home/juani/Documentos/Ressume/.agents/reviewer_1/handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

STRICT RULE: DO NOT execute automated git commits. Changes must stay in the working tree for user review.

File ownership:
- src/locales/es/prompts.json
- src/ai-knowledge/prompts.json

Replace all occurrences of the Unicode Dingbat symbol '➔' with ASCII '->' in both files. Verify JSON validity, run vitest suites and npm run build.
Write your handoff report to:
/home/juani/Documentos/Ressume/.agents/worker_remediation_1/handoff.md
When done, notify parent.
