# Handoff Report — Explorer Survey 3: Prompts Catalog, Output Formats & Payload Assembly

## 1. Observation

1. **Prompt Catalogs Inconsistencies**:
   - `src/locales/es/prompts.json` (76 lines): Contains 6 prompts. `recruiter_audit` has `"output_format": "Structured evaluation (17-point checklist)"` at line 12. The remaining 5 prompts (`job_matcher`, `star_enhancer`, `technical_interview`, `translate_english`, `layout_advisor`) lack the `"output_format"` key entirely.
   - `src/locales/en/prompts.json` (63 lines): Contains 6 prompts. Not a single prompt (not even `recruiter_audit`) defines the `"output_format"` key.
   - `src/ai-knowledge/prompts.json` (81 lines): Contains 6 prompts identical in text to `src/locales/es/prompts.json`. Lines 26, 39, 52, 65, and 78 explicitly define `"output_format": ""`.
   - All 3 files currently contain only 6 prompts. None contain the 6 new tech career prompts.

2. **Payload Assembly Defect in `src/utils/aiExporter.js`**:
   - Lines 397-399 in `buildAIPromptPayload`:
     ```javascript
     /*Formato de salida*/
     payload.push('output_format: ' + promptDef.output_format);
     payload.push('');
     ```
     Because `promptDef.output_format` is missing or empty for 5 prompts, it emits `output_format: undefined` or `output_format: `, producing unconstrained LLM responses.
   - `options.userCommentary` is completely unhandled. The payload generator does not support `user_commentary` insertion.
   - `translate_english` does not inject a compact reference schema for native `cvData` JSON.
   - Frontmatter in `exportToAIMarkdown` (lines 48-87) emits only layout type and contact data, omitting visual configuration properties (`is_ats_mode`, `page_padding`, `section_gap`, `item_gap`, `font_family`, `font_scale`, `title_scale`, `body_scale`, `list_scale`, `line_height`).

3. **Version Manager CV Snapshot Invariants**:
   - `src/utils/versionValidator.js`: `sanitizeAndValidateCVSnapshot` expects an object with `{ profile, layout, sections }`. Each section requires `{ id, column, type, title, items: [{ id, ... }] }`.
   - `VersionManagerModal.jsx` line 365 calls `sanitizeAndValidateCVSnapshot(rawData)` during JSON import. If an LLM returns raw markdown text instead of a JSON code block, the user cannot import the translated CV into the Version Manager.

4. **Vitest Baseline Test Suite**:
   - Running `npm test -- --run` runs 42 test files with 727 baseline tests.
   - Ripgrep confirmed: Zero tests exist for `aiExporter.js`, `buildAIPromptPayload`, `exportToAIMarkdown`, or prompt catalog schemas (`src/locales/es/prompts.json`, `src/locales/en/prompts.json`, `src/ai-knowledge/prompts.json`).

---

## 2. Logic Chain

1. **Premise 1**: When `output_format` is missing or empty, `buildAIPromptPayload` produces `output_format: undefined` or empty string in the LLM prompt payload (Observation 2).
2. **Premise 2**: Language models without an explicit, constrained output format provide conversational, non-standard outputs that cannot be reliably copied, parsed, or evaluated (Observation 1, 2).
3. **Premise 3**: In `recruiter_audit`, a structured 17-point checklist with 0-100 scoring yields actionable, deterministic critique. Applying analogous 0-100 quantitative rubrics, Google XYZ/STAR transformations, and WCAG AA contrast matrices to the other prompts will ensure consistent high-quality outputs across all 12 prompts (Observation 1, 2).
4. **Premise 4**: For `translate_english`, the user requires a version importable into the Version Manager. The Version Manager specifically validates JSON snapshots using `sanitizeAndValidateCVSnapshot` (Observation 3). Therefore, `translate_english` must mandate a JSON code block output conforming to `cvData`, and `buildAIPromptPayload` must inject the reference schema when `translate_english` is active.
5. **Premise 5**: Because zero tests currently cover prompt catalog schemas or `buildAIPromptPayload`, builder agents risk introducing regressions or schema mismatches across languages without automated detection. Adding `src/tests/ai-prompts-and-exporter.test.js` will protect the baseline 727+ tests and guarantee 100% test integrity (Observation 4).

---

## 3. Caveats

1. **8 Pre-existing Test Failures in Worktree**: Running `npm test -- --run` revealed 8 failing tests in `src/tests/epic3-actionmenu-ats-modal.test.jsx` and `src/tests/final-e2e-cross-cutting-challenger.test.jsx` relating to commented-out ActionMenu buttons from prior workspace edits. These failures are unrelated to the AI Prompts / Exporter subsystem and predate this task.
2. **Read-Only Investigation**: As Explorer Survey 3, no modifications were made to production source code in `src/`. All proposals, JSON definitions, and test blueprints are provided in `survey_report.md` for consumption by builder agents.

---

## 4. Conclusion

1. All three prompt files (`src/locales/es/prompts.json`, `src/locales/en/prompts.json`, `src/ai-knowledge/prompts.json`) must be expanded from 6 to 12 prompts, synchronizing all 12 IDs, ensuring non-empty `output_format` strings, and embedding 0-100 rubrics across the board.
2. `translate_english` must strictly require a native `cvData` JSON code block conforming to `versionValidator.js`, preceded by a brief localization summary.
3. The 6 new tech career prompts (`system_design_simulator`, `live_coding_coach`, `behavioral_leadership_prep`, `career_upskilling_roadmap`, `cold_outreach_generator`, `salary_negotiation_advisor`) are fully specified with bilingual tasks, system instructions, and structured markdown outputs in `survey_report.md`.
4. `buildAIPromptPayload` must be refactored to enforce strict section ordering, conditionally inject `user_commentary` and `job_description`, and inject the reference schema for `translate_english`.
5. `exportToAIMarkdown` Frontmatter must be enriched to capture all visual and layout configuration parameters.
6. A new test suite `src/tests/ai-prompts-and-exporter.test.js` must be implemented to validate schema conformity, bilingual parity, payload ordering, and validator compatibility.

---

## 5. Verification Method

1. **Inspect Report Artifact**:
   - File: `/home/juani/Documentos/Ressume/.agents/explorer_survey_3/survey_report.md`
   - Verify that Sections 1 through 8 contain complete bilingual prompt specifications, rubrics, and payload assembly logic.
2. **Verify JSON Compatibility**:
   - Run simulated JSON translation test in Node.js or Vitest against `sanitizeAndValidateCVSnapshot` in `src/utils/versionValidator.js`:
     ```bash
     npx vitest run src/tests/version-manager-hub.test.jsx
     ```
3. **Verify Baseline Test Count**:
   - Run `npx vitest run` to ensure test runner executes all 42 test files and maintains the 727 test baseline.
