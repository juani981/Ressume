# Dispatch: Explorer Survey 3 — Prompts Catalog, Output Formats & Payload Assembly

## Objective
Investigate the AI prompts catalog, output formats, payload assembly, and test suite:
- Inspect `src/locales/es/prompts.json`, `src/locales/en/prompts.json`, and `src/ai-knowledge/prompts.json`.
- Analyze the ATS Audit prompt (17 points) as the gold standard of granularity, rubric, and structure.
- Review existing prompts (`job_matcher`, `star_enhancer`, `technical_interview`, `translate_english`, `layout_advisor`):
  - Identify what `output_format` exists (or lacks).
  - Define explicit, granular, quantitative rubrics (0-100), evaluation matrices, Google XYZ / STAR formula, and WCAG AA contrast analysis.
  - For Translation & Localization (`translate_english`): formulate strict output_format requiring JSON code block matching `cvData` schema directly importable by `versionValidator.js`.
- Define the 6 new specialized IT tech prompts in both Spanish and English with identical high standards:
  1. `system_design_simulator` (scalability, microservices, databases, concurrency, tradeoffs, text/Mermaid diagram)
  2. `live_coding_coach` (algorithmic patterns for stack/seniority, Big-O, edge cases)
  3. `behavioral_leadership_prep` (FAANG/Tier-1 Tech situational questions, STAR rubric, common traps)
  4. `career_upskilling_roadmap` (30/60/90 days plan, DDIA, OSS repos, papers/labs)
  5. `cold_outreach_generator` (LinkedIn/email for EMs/Tech Leads/Recruiters based on CV achievements)
  6. `salary_negotiation_advisor` (compensation bands, CV value arguments, script, counter-offers)
- Inspect `buildAIPromptPayload` in `src/utils/aiExporter.js`:
  - Assembly order: `role`, `task`, `output_format`, `user_commentary` (if present), `job_description` (if applies), CV input data.
- Review the Vitest test suites and runner configuration:
  - Check how many tests currently exist (baseline 727+).
  - Check existing prompt tests, and propose new test cases for schema conformity, commentary handling, and all new prompts.

## Files to Inspect
- `/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md` (lines 589-658)
- `src/locales/es/prompts.json`
- `src/locales/en/prompts.json`
- `src/ai-knowledge/prompts.json`
- `src/utils/aiExporter.js` (`buildAIPromptPayload`)
- `src/utils/versionValidator.js`
- Test files under `src/tests/` (e.g. prompt tests, payload tests)
- `package.json`

## Output Requirements
Write your detailed findings and architectural recommendations to:
`/home/juani/Documentos/Ressume/.agents/explorer_survey_3/survey_report.md`
Include:
1. Current prompt catalog structure in all 3 files
2. Detailed analysis of ATS Audit 17-points standard
3. Proposed `output_format` and prompt upgrades for all existing prompts
4. Detailed specifications and full bilingual templates for the 6 new tech prompts
5. `buildAIPromptPayload` assembly logic design
6. Test coverage plan and verification strategy

When complete, write your report and send a handoff message.

## 2026-09-12T02:46:44Z
You are Explorer Survey 3. Your working directory is: /home/juani/Documentos/Ressume/.agents/explorer_survey_3
Read your dispatch instructions in:
/home/juani/Documentos/Ressume/.agents/explorer_survey_3/DISPATCH.md
and the authoritative user request in:
/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md (specifically lines 589-658).

Focus on Prompts Catalog, Output Formats, and Payload Assembly:
- Inspect src/locales/es/prompts.json, src/locales/en/prompts.json, and src/ai-knowledge/prompts.json.
- Analyze the ATS Audit (17 points) prompt as gold standard.
- Upgrade existing prompts (job_matcher, star_enhancer, technical_interview, translate_english, layout_advisor) with detailed output_format, quantitative rubrics (0-100), Google XYZ / STAR formula, WCAG AA contrast analysis.
- For Translation & Localization, strictly specify JSON code block output conforming to Ressume cvData schema importable by versionValidator.js.
- Design the 6 new tech career prompts in ES and EN with full rubrics and structured output formats: system_design_simulator, live_coding_coach, behavioral_leadership_prep, career_upskilling_roadmap, cold_outreach_generator, salary_negotiation_advisor.
- Analyze buildAIPromptPayload in src/utils/aiExporter.js to assemble: role, task, output_format, user_commentary, job_description, CV input data.
- Review Vitest test suite structure (baseline 727+ tests) and design prompt validation tests.

Write your comprehensive report to:
/home/juani/Documentos/Ressume/.agents/explorer_survey_3/survey_report.md
When finished, send a handoff message to parent.

