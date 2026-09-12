# Dispatch: Worker M1 — Prompts Catalog Upgrades & 6 New Tech Prompts

## Mandatory Reading
- `/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md` (lines 589-658)
- `/home/juani/Documentos/Ressume/.agents/teamwork_preview_orchestrator_14/PROJECT.md`
- `/home/juani/Documentos/Ressume/.agents/explorer_survey_3/survey_report.md` (Contains exact, complete JSON specifications for all 12 prompts in ES and EN)
- `AGENTS.md`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

STRICT RULE: DO NOT execute automated git commits. Changes must stay in the working tree for user review.

## File Ownership
You exclusively own and may modify:
- `src/locales/es/prompts.json`
- `src/locales/en/prompts.json`
- `src/ai-knowledge/prompts.json`

DO NOT modify any other files.

## Objective & Requirements
Upgrade the prompt catalogs to contain 12 fully synchronized, rigorous prompts:
1. **Existing Prompts Upgrade**:
   - `recruiter_audit`: refine output_format and rubrics (17-point gold standard).
   - `job_matcher`: add explicit `output_format`, 15-key-requirements matching matrix, 0-100 quantitative scorecard, Google XYZ re-writes.
   - `star_enhancer`: add explicit `output_format`, 0-100 STAR strength score, Google XYZ 3-variation decomposition (Technical, Leadership, Business).
   - `technical_interview`: add explicit `output_format`, adapt to candidate stack, 0-100 scoring by seniority, curveball questions, reverse interview questions.
   - `translate_english`: add explicit `output_format` strictly mandating a native `cvData` JSON code block conforming 1:1 to Ressume schema (`versionValidator.js`), preceded by localization summary.
   - `layout_advisor`: add explicit `output_format`, 1-col vs 2-col decision matrix, WCAG AA color contrast audit table, editor calibration numbers.
2. **6 New Tech Career Prompts**:
   - `system_design_simulator`: scalability, microservices, SQL/NoSQL, concurrency, Mermaid flowchart TD, 0-100 rubric.
   - `live_coding_coach`: algorithmic patterns, Big-O proofs, boundary edge cases, 45-min verbal script, 0-100 rubric.
   - `behavioral_leadership_prep`: FAANG/Tier-1 situational questions, Amazon LPs, STAR matrices, common traps.
   - `career_upskilling_roadmap`: Senior/Staff gap audit, 30/60/90-day plan, DDIA, key OSS repos, papers.
   - `cold_outreach_generator`: LinkedIn/email vectors for EMs, Tech Leads, Recruiters, based on CV achievements.
   - `salary_negotiation_advisor`: P25-P90 compensation bands, CV value leverage, scripts, counter-offers.
3. **Synchronize All 3 Files**:
   - Every prompt must exist in `src/locales/es/prompts.json` (Spanish) and `src/locales/en/prompts.json` (English) and `src/ai-knowledge/prompts.json`.
   - Every prompt must have non-empty `output_format`, `system_instruction`, `task`, `required_inputs`, `target_output`, `category`.
   - Consult `/home/juani/Documentos/Ressume/.agents/explorer_survey_3/survey_report.md` for the exact prompt content and templates.

## Verification
Run tests or JSON linting to ensure all 3 JSON files are valid JSON without syntax errors.
Write your completion report to `/home/juani/Documentos/Ressume/.agents/worker_m1/handoff.md` and send a message.

## 2026-09-12T02:52:37Z
You are Worker M1. Your working directory is: /home/juani/Documentos/Ressume/.agents/worker_m1
Read your dispatch instructions in:
/home/juani/Documentos/Ressume/.agents/worker_m1/DISPATCH.md
and the authoritative user request in:
/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md (lines 589-658).
Reference specifications:
/home/juani/Documentos/Ressume/.agents/explorer_survey_3/survey_report.md
/home/juani/Documentos/Ressume/.agents/teamwork_preview_orchestrator_14/PROJECT.md

