# Dispatch: E2E Test Writer — Automated Test Suites & 100% Pass Hardening

## Mandatory Reading
- `/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md` (lines 589-658)
- `/home/juani/Documentos/Ressume/.agents/teamwork_preview_orchestrator_14/PROJECT.md`
- `/home/juani/Documentos/Ressume/.agents/explorer_survey_1/survey_report.md` (Section 6: Modal tests)
- `/home/juani/Documentos/Ressume/.agents/explorer_survey_2/survey_report.md` (Section 5: Exporter tests)
- `/home/juani/Documentos/Ressume/.agents/explorer_survey_3/survey_report.md` (Section 8: Prompts & payload tests)
- `AGENTS.md`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

STRICT RULE: DO NOT execute automated git commits. Changes must stay in the working tree for user review.

## File Ownership
You exclusively own and may create/modify:
- `src/tests/ai-prompts-and-exporter.test.js`
- `src/tests/aiExportModal.test.jsx`
- Repair pre-existing test discrepancies in `src/tests/epic3-actionmenu-ats-modal.test.jsx` and `src/tests/final-e2e-cross-cutting-challenger.test.jsx` (where `btn-open-actions` was queried from previous refactorings) so that 100% of the repository test suite passes.

## Objectives & Deliverables
1. **Create `src/tests/ai-prompts-and-exporter.test.js`**:
   - Verify prompt catalog schema conformity across `es/prompts.json`, `en/prompts.json`, and `ai-knowledge/prompts.json`.
   - Verify all 12 prompt IDs exist in all 3 files.
   - Verify 100% of prompts have non-empty, detailed `output_format`.
   - Verify `translate_english` requires native `cvData` JSON code block importable by `versionValidator.js`.
   - Verify `buildAIPromptPayload`:
     - Injects `user_commentary: ...` when provided, cleanly omits when empty or whitespace.
     - Injects `job_description: ...` when provided for `job_matcher`.
     - Injects compact native `cvData` JSON reference schema when `translate_english` is requested.
     - Validates payload structure ordering (`role`, `task`, `output_format`, `user_commentary`, `job_description`, `---`, cv data).
   - Verify `exportToAIMarkdown`:
     - YAML frontmatter contains exhaustive metadata (`layout_type`, `is_ats_mode`, section orders, `typography`, `spacing`, `styling`, `container_colors`, `candidate_profile` with contacts).
     - Markdown body covers 100% of sections and item fields without omissions.
2. **Create `src/tests/aiExportModal.test.jsx`**:
   - Mount `AIExportModal` in JSDOM:
     - Verify layout auto-detection matches `cvData.layout?.isAtsMode` or `cvData.layout?.type` ('1-column' vs '2-column') without offering dropdowns.
     - Verify format dropdowns/selectors are hidden/commented; format is locked to Markdown.
     - Verify `user_commentary` textarea is present for all prompts.
     - Verify `job_description` textarea renders only when `job_matcher` is selected, and disappears for other prompts.
     - Verify live preview updates synchronously when typing into `user_commentary` or `job_description`.
3. **Resolve 8 Pre-Existing ActionMenu Test Failures**:
   - Inspect `src/tests/epic3-actionmenu-ats-modal.test.jsx` and `src/tests/final-e2e-cross-cutting-challenger.test.jsx`.
   - Align test selectors with current ActionMenu structure so all tests execute cleanly.
4. **Execute Full Test Suite Verification**:
   - Run `npx vitest run`.
   - Verify 100% tests pass (all 727+ tests pass, 0 failures).

Write your completion report to `/home/juani/Documentos/Ressume/.agents/test_writer_e2e/handoff.md` and send a message.

## 2026-09-12T02:52:37Z
User request:
You are the E2E Test Writer. Your working directory is: /home/juani/Documentos/Ressume/.agents/test_writer_e2e
Read your dispatch instructions in:
/home/juani/Documentos/Ressume/.agents/test_writer_e2e/DISPATCH.md
and the authoritative user request in:
/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md (lines 589-658).
Reference specifications:
/home/juani/Documentos/Ressume/.agents/teamwork_preview_orchestrator_14/PROJECT.md
/home/juani/Documentos/Ressume/.agents/explorer_survey_1/survey_report.md
/home/juani/Documentos/Ressume/.agents/explorer_survey_2/survey_report.md
/home/juani/Documentos/Ressume/.agents/explorer_survey_3/survey_report.md

