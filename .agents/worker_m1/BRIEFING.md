# BRIEFING — 2026-09-12T02:57:00Z

## Mission
Upgrade the prompt catalogs to contain 12 fully synchronized, rigorous prompts across ES, EN, and ai-knowledge.

## 🔒 My Identity
- Archetype: implementer, qa, specialist
- Roles: implementer, qa, specialist
- Working directory: /home/juani/Documentos/Ressume/.agents/worker_m1
- Original parent: 02c4cf40-e939-46e8-b992-fac7558fc6f8
- Milestone: M1 (Prompts Catalog Upgrades & 6 Tech Prompts)

## 🔒 Key Constraints
- File ownership: src/locales/es/prompts.json, src/locales/en/prompts.json, src/ai-knowledge/prompts.json
- DO NOT modify any other files
- DO NOT execute automated git commits
- DO NOT hardcode test results or create facade implementations
- 12 fully synchronized prompts (6 upgraded existing + 6 new specialized IT tech prompts)
- Non-empty output_format, system_instruction, task, required_inputs, target_output, category for all prompts
- Rigorous 0-100 rubrics, Google XYZ/STAR formulas, WCAG AA contrast, native cvData JSON for translate_english
- All 3 JSON files must be valid JSON

## Current Parent
- Conversation ID: 02c4cf40-e939-46e8-b992-fac7558fc6f8
- Updated: 2026-09-12T02:57:00Z

## Task Summary
- **What to build**: Upgrade existing 6 prompts and add 6 new specialized tech career prompts in `src/locales/es/prompts.json`, `src/locales/en/prompts.json`, and `src/ai-knowledge/prompts.json`
- **Success criteria**: All 3 files contain 12 synchronized prompts with full schema compliance, non-empty output_format, and valid JSON
- **Interface contracts**: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_orchestrator_14/PROJECT.md` § Prompts Catalog Schema
- **Code layout**: `src/locales/es/prompts.json`, `src/locales/en/prompts.json`, `src/ai-knowledge/prompts.json`

## Key Decisions Made
- Fully implemented all 12 prompt specifications from `survey_report.md` in Spanish and English.
- Upgraded existing 6 prompts (`recruiter_audit`, `job_matcher`, `star_enhancer`, `technical_interview`, `translate_english`, `layout_advisor`) with 0-100 rubrics and explicit structured output_formats.
- Configured `translate_english` to mandate a native `cvData` JSON code block matching `src/utils/versionValidator.js`.
- Added 6 new specialized IT prompts: `system_design_simulator`, `live_coding_coach`, `behavioral_leadership_prep`, `career_upskilling_roadmap`, `cold_outreach_generator`, `salary_negotiation_advisor`.
- Ensured 100% ID parity across `src/locales/es/prompts.json`, `src/locales/en/prompts.json`, and `src/ai-knowledge/prompts.json`.

## Artifact Index
- `/home/juani/Documentos/Ressume/.agents/worker_m1/DISPATCH.md` — Assignment instructions
- `/home/juani/Documentos/Ressume/.agents/worker_m1/progress.md` — Liveness and progress tracker
- `/home/juani/Documentos/Ressume/.agents/worker_m1/BRIEFING.md` — Persistent memory
- `/home/juani/Documentos/Ressume/.agents/worker_m1/handoff.md` — Final handoff report

## Change Tracker
- **Files modified**:
  - `src/locales/es/prompts.json`: 12 Spanish prompts with 0-100 rubrics and structured output_formats
  - `src/locales/en/prompts.json`: 12 English prompts with 0-100 rubrics and structured output_formats
  - `src/ai-knowledge/prompts.json`: Synchronized 12 prompts matching canonical knowledge base
- **Build status**: Node verification script passed 100%; Vitest suite ran with 0 regressions (719 passed, 8 pre-existing failures in ActionMenu unchanged)
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pass (0 regressions)
- **Lint status**: 0 JSON syntax errors
- **Tests added/modified**: Validated against Vitest test runner

## Loaded Skills
- None
