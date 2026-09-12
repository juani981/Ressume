## 2026-09-12T02:46:00Z

Refactor and enhance the CV Abstraction and AI Prompt Generation subsystem in Ressume:
- R1. Opinionated and clean experience in AIExportModal.jsx:
  - Automatically detect active layout mode (cvData.layout?.type / isAtsMode) on opening, without offering layout or format interactive selectors (keep unneeded selectors hidden/commented).
  - Offer Semantic Markdown as the single abstraction & export format.
  - Optional freeform input field (user_commentary) for user context/instructions on any selected prompt.
  - Keep job_description exclusively when required (job_matcher), coexisting with user_commentary.
  - Preview reflects both fields immediately.
- R2. Exhaustive Markdown abstraction as 1:1 source of truth (aiExporter.js):
  - Enrich exportToAIMarkdown YAML frontmatter with visual and structural metadata (layout_type, canonical/visual section order, typography, font scales, page padding, section gap, item gap, bullet styles, container colors, complete profile/contact data).
  - Markdown body captures 100% of sections, items, dates, subtitles, bullets, links, descriptions without omissions.
  - For Translation & Localization prompt: inject compact cvData native JSON schema inside the input block to anchor results.
- R3. Existing prompt catalog: rigorous rubrics and structured output formats (output_format):
  - In src/locales/es/prompts.json, src/locales/en/prompts.json, and src/ai-knowledge/prompts.json:
  - Every prompt must have an explicit, granular, detailed output_format (reference ATS Audit 17-points quality level).
  - Translation & Localization prompt: strictly specify output as JSON code block with exact Ressume cvData schema directly importable by Version Manager (src/utils/versionValidator.js).
  - Other prompts (job_matcher, star_enhancer, technical_interview, layout_advisor): evaluation matrices, 0-100 quantitative rubrics, Google XYZ / STAR formula, WCAG AA contrast analysis.
- R4. Minimum 5 new specialized IT tech career prompts:
  1. system_design_simulator
  2. live_coding_coach
  3. behavioral_leadership_prep
  4. career_upskilling_roadmap
  5. cold_outreach_generator
  6. salary_negotiation_advisor
  Include in es and en prompts.json and ai-knowledge.
- R5. Payload integration and Vitest verification:
  - Modify buildAIPromptPayload to assemble: role, task, output_format, user_commentary (if present), job_description (if applies), CV input data.
  - Automated tests with Vitest verifying: user_commentary presence/omission, YAML frontmatter exhaustiveness, prompt schema conformity (no prompt missing output_format, all new prompts present in both languages).
  - 100% test pass (all 727+ tests pass, 0 failures).
  - STRICT RULE: DO NOT execute automated git commits. Changes must stay in the working tree for user review.
