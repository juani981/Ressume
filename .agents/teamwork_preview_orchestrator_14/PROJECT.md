# Project: Ressume CV Abstraction & AI Prompt Generation Subsystem

## Architecture
- **Presentation Layer**: `src/components/Editor/AIExportModal.jsx`
  - Modal dialog invoked from `ActionMenu.jsx`.
  - Auto-detects active layout (`cvData.layout?.isAtsMode === true || cvData.layout?.type === '1-column'`).
  - Interactive layout and format dropdown selectors are hidden/commented out; format is locked strictly to Semantic Markdown.
  - Universal optional freeform textarea for `user_commentary` across all prompts.
  - Gated textarea for `job_description` rendered exclusively for `job_matcher`, coexisting harmoniously with `user_commentary`.
  - Reactive live preview `<pre>` displaying compiled payload immediately on any user keystroke.
- **Core Abstraction Engine**: `src/utils/aiExporter.js` & `src/registry/itemFormatters.js`
  - `exportToAIMarkdown`: Generates 1:1 digital twin of CV state.
    - YAML Frontmatter: Comprehensive visual and structural configuration (layout type, is_ats_mode, section column ordering, typography tokens, scale factors, padding, section and item gaps, bullet styles, dynamic container colors, complete contact metadata).
    - Markdown Body: 100% section and item fidelity (including description and linkText in certificates/publications, description and bullets in education, mentee in mentoring).
  - `buildAIPromptPayload`: Assembles deterministic prompt payload:
    `role` -> `task` -> `output_format` -> `user_commentary` (conditional) -> `job_description` (conditional) -> separator (`---`) -> CV input data (injecting compact native `cvData` JSON reference schema for `translate_english`).
- **Prompt Knowledge & Locales Catalog**:
  - `src/locales/es/prompts.json`
  - `src/locales/en/prompts.json`
  - `src/ai-knowledge/prompts.json`
  - 12 fully synchronized prompts (6 upgraded existing + 6 new specialized IT tech prompts).
  - Every prompt features explicit, granular `output_format` adhering to the ATS Audit (17 points) gold standard, 0-100 quantitative scoring rubrics, Google XYZ/STAR achievement formulas, and WCAG AA contrast audits.
  - `translate_english` strictly mandates a native `cvData` JSON code block conforming to `src/utils/versionValidator.js` (`sanitizeAndValidateCVSnapshot`).
- **Quality & Verification Layer**:
  - Vitest test runner executing 797 tests across 46 files with 0 failures (100% pass).
  - Production Vite build compiling cleanly in 1.68s with 0 errors.
  - Zero automated git commits executed (working tree clean for user review).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Auto-Detect Layout Mode | Auto-detect active layout (`isAtsMode` / `type === '1-column'`) in `AIExportModal.jsx` without selectors | M3 | R1, Survey 1 |
| 2 | Semantic Markdown Single Format | Lock export format to Semantic Markdown, keeping unneeded layout/format selectors hidden/commented | M3 | R1, Survey 1 |
| 3 | Universal User Commentary Field | Optional freeform textarea for `user_commentary` across all prompts | M3 | R1, Survey 1 |
| 4 | Gated Job Description Field | Render `job_description` exclusively for `job_matcher`, coexisting with `user_commentary` | M3 | R1, Survey 1 |
| 5 | Live Preview Synchronous Reactivity | Live `<pre>` preview recomputes immediately on prompt, commentary, or job description change | M3 | R1, Survey 1 |
| 6 | Enriched YAML Frontmatter | Frontmatter in `exportToAIMarkdown` includes layout, typography, scales, spacing, colors, contacts | M2 | R2, Survey 2 |
| 7 | 100% Markdown Body Fidelity | Format all sections and items without dropping description, bullets, links, or dates | M2 | R2, Survey 2 |
| 8 | Compact cvData JSON Schema Injection | For `translate_english`, inject compact `cvData` JSON reference schema inside prompt input block | M2 | R2, Survey 2 |
| 9 | Upgraded Existing Prompts (0-100 Rubrics) | Upgrade `job_matcher`, `star_enhancer`, `technical_interview`, `translate_english`, `layout_advisor` with detailed output_format | M1 | R3, Survey 3 |
| 10 | Native cvData Importable JSON for Translation | Specify output of `translate_english` as valid JSON block matching `versionValidator.js` schema | M1 | R3, Survey 3 |
| 11 | 6 New Specialized IT Tech Prompts | Implement `system_design_simulator`, `live_coding_coach`, `behavioral_leadership_prep`, `career_upskilling_roadmap`, `cold_outreach_generator`, `salary_negotiation_advisor` | M1 | R4, Survey 3 |
| 12 | Prompt Synchronization across Catalogs | Synchronize all 12 prompts across `es/prompts.json`, `en/prompts.json`, and `ai-knowledge/prompts.json` | M1 | R3, R4, Survey 3 |
| 13 | Deterministic Payload Assembly in aiExporter | Refactor `buildAIPromptPayload` to assemble role, task, output_format, commentary, job_description, input data | M2 | R5, Survey 2 & 3 |
| 14 | Automated Vitest Test Suite for AI Subsystem | Implement tests verifying commentary, frontmatter, prompt conformity, bilingual parity, validator import | M4 | R5, Survey 1, 2, 3 |
| 15 | 100% Test Suite Green Pass (797 tests) | Resolve 8 pre-existing ActionMenu failures, achieve 0 failures across all test suites | M4 | R5, Acceptance Criteria |
| 16 | Zero Automated Git Commits | Strictly preserve all changes in working tree for user review without running git commit | M5 | Strict Rule |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Prompts Catalog Upgrades & 6 Tech Prompts | Upgrade existing prompts with rubrics/output_format, add 6 bilingual tech prompts in all 3 files | None | DONE |
| M2 | CV Abstraction, Frontmatter & Payload Core | Enriched YAML frontmatter, 100% body fidelity, compact schema injection, `buildAIPromptPayload` assembly | M1 | DONE |
| M3 | AIExportModal UI Refactoring | Layout auto-detection, locked markdown, `user_commentary` textarea, gated `job_description`, live preview | M2 | DONE |
| M4 | Test Suite & 100% Pass Hardening | New tests for prompts, exporter, modal; fix pre-existing ActionMenu test failures (797 tests passing) | M1, M2, M3 | DONE |
| M5 | Forensic Audit & Verification | Integrity audit (CLEAN), zero git commits validation, final test verification (PASS) | M4 | DONE |

## Interface Contracts
### `buildAIPromptPayload(cvData, promptId, options)`
- **Parameters**:
  - `cvData`: Object conforming to Ressume schema (`{ layout, profile, sections }`)
  - `promptId`: String (one of the 12 supported prompt IDs)
  - `options`: Object `{ format?: string, jobDescription?: string, userCommentary?: string, lang?: string }`
- **Return**: String representing the complete assembled prompt payload:
  1. `role: <system_instruction>`
  2. `task: <task>`
  3. `output_format: <output_format>`
  4. (Optional) `user_commentary: <userCommentary>` (only if non-empty trimmed string)
  5. (Optional) `job_description: <jobDescription>` (only if `required_inputs` includes `job_description` and non-empty)
  6. `---`
  7. Formatted CV data (`exportToAIMarkdown` by default). When `promptId === 'translate_english'`, includes compact reference JSON schema at the end of the input section.

### `exportToAIMarkdown(cvData)`
- **Parameters**: `cvData` Object
- **Return**: Markdown String with:
  - Valid YAML Frontmatter enclosed in `--- ... ---` containing:
    - `layout_type`, `is_ats_mode`
    - `section_order` (1-column: linear canonical & custom sections; 2-column: `left_column_sections` and `right_column_sections`)
    - `typography`: `{ font_family, font_scale, line_height, title_scale, body_scale, list_scale }`
    - `spacing`: `{ page_padding, section_gap, item_gap }`
    - `styling`: `{ bullet_style, container_colors: { left_bg, right_bg, title_color, text_color } }`
    - `candidate_profile`: `{ name, headline, location, contact: { email, phone, linkedin, github, ...additional_contacts } }`
  - Comprehensive Markdown Body covering 100% of sections, items, dates, subtitles, bullets, links, descriptions, and tags.

### Prompts Catalog Schema (`prompts.json`)
Each entry in `es/prompts.json`, `en/prompts.json`, and `ai-knowledge/prompts.json`:
- `id`: string (unique across catalog)
- `name`: string
- `category`: string (`audit`, `optimization`, `interview_prep`, `localization`, `career_growth`, `networking`)
- `description`: string
- `system_instruction`: string
- `task`: string (detailed instructions with 0-100 rubrics and step-by-step points)
- `required_inputs`: Array of strings (`["cv_abstraction"]` or `["cv_abstraction", "job_description"]`)
- `output_format`: Non-empty string specifying structured markdown sections, tables, or native JSON code block
- `target_output`: string

## Code Layout
- `src/locales/es/prompts.json` (Spanish prompt catalog - 12 prompts)
- `src/locales/en/prompts.json` (English prompt catalog - 12 prompts)
- `src/ai-knowledge/prompts.json` (Internal AI knowledge prompt catalog - 12 prompts)
- `src/utils/aiExporter.js` (Core AI export logic, Frontmatter generator, payload builder)
- `src/registry/itemFormatters.js` (Markdown item formatters)
- `src/components/Editor/AIExportModal.jsx` (UI modal for prompt selection, commentary, preview, copy/download)
- `src/tests/ai-prompts-and-exporter.test.js` (Automated prompt & exporter tests)
- `src/tests/aiExportModal.test.jsx` (Automated modal UI tests)
- `src/tests/challenger-2-modal-stress.test.jsx` (Empirical modal stress tests)
- `src/tests/challenger-ai-abstraction-stress.test.js` (Empirical abstraction stress tests)
