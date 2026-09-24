# Handoff Report: Explorer Survey 2 — CV Abstraction & Markdown Generation

**Agent**: Explorer Survey 2  
**Handoff Type**: Hard (Investigation & Design Survey Complete)  
**Date**: 2026-09-12T02:52:00Z  
**Target Path**: `/home/juani/Documentos/Ressume/.agents/explorer_survey_2/survey_report.md`  

---

## 1. Observation

1. **`src/utils/aiExporter.js` (lines 32–177)**:
   - Evaluates layout strictly using `const is1Col = layout.type === '1-column';` without checking `layout.isAtsMode`.
   - YAML Frontmatter outputs only:
     ```yaml
     layout_type: "1-column" # or "2-column"
     target_audience: ...
     reading_flow: ... # or visual_theme with left_sidebar_color / right_main_color
     candidate_profile: name, headline, location, contact: email, phone, linkedin, github
     ```
   - Entirely omits: typography (`font_family`, `font_scale`, `title_scale`, `body_scale`, `list_scale`, `line_height`), spacing metrics (`page_padding`, `section_gap`, `item_gap`), bullet styles (`bulletStyle`), dynamic contrast tokens (`titleColor`, `textColor`, `circleColor`), and dynamic contact catalog entries from `profileItem.contacts` (e.g. portfolio, leetcode, whatsapp, telegram, figma).
   - In 1-column layout, Frontmatter `section_order` only filters `CANONICAL_ATS_ORDER`, omitting any user-added custom, award, publication, or mentoring sections.
   - In 2-column layout, sections are serialized as raw strings (`- "${sec.id}" (${sec.title || sec.id})`) rather than structured YAML mappings.

2. **`src/utils/aiExporter.js` (lines 371–411)**:
   - `buildAIPromptPayload` takes `(cvData, promptId = 'recruiter_audit', options = {})` where `options` only extracts `{ format, jobDescription, lang }`.
   - Parameter `user_commentary` is completely missing.
   - For `translate_english`, no compact JSON schema is injected.
   - There is no `exportToAIJson` function (falls back to `JSON.stringify(cvData, null, 2)`).
   - `exportToAIText` is not exported (only `exportToATSPlainText`).

3. **`src/registry/itemFormatters.js` & `sectionRegistry.js`**:
   - `certificatesMarkdown` ignores `item.linkText` (hardcodes `[Credencial]`) and ignores `item.description`.
   - `publicationsMarkdown` ignores `item.linkText` (hardcodes `[Enlace]`).
   - `educationMarkdown` only formats `title`, `subtitle`, and `date`; ignores `item.description` and `item.bullets`.
   - `baseItemMarkdown` checks `item.subtitle || item.company || item.institution`, but fails to check `item.mentee` for the `mentoring` section.
   - In 2-column mode, `aiExporter.js` iterates `cvData.sections` directly in raw array order rather than grouping Left Column (Sidebar) and Right Column (Main) sections.

4. **Prompt Files (`src/locales/es/prompts.json`, `src/locales/en/prompts.json`, `src/ai-knowledge/prompts.json`)**:
   - In `es/prompts.json` and `ai-knowledge/prompts.json`, only `recruiter_audit` has an `output_format` property; `job_matcher`, `star_enhancer`, `technical_interview`, `translate_english`, and `layout_advisor` have `output_format: ""` or `undefined`.
   - In `en/prompts.json`, `output_format` is missing from all prompts.
   - When `buildAIPromptPayload` executes: `payload.push('output_format: ' + promptDef.output_format);`, it emits `output_format: undefined`.

5. **`src/utils/versionValidator.js` & `VersionManagerModal.jsx`**:
   - `VersionManagerModal.jsx` (lines 363–365) imports JSON via `const rawData = parsed.cvData || parsed; const validated = sanitizeAndValidateCVSnapshot(rawData);`.
   - `sanitizeAndValidateCVSnapshot` validates `profile`, `layout`, and `sections` array, filling in defaults if missing.
   - Any JSON produced with `{ profile, layout, sections }` passes validation cleanly and can be immediately saved as a version and loaded into state.

6. **Test Suite Execution (`npx vitest run`)**:
   - Result: 719 passed, 8 failed out of 727 tests.
   - All 8 failures reside in `ActionMenu` (`btn-open-actions` missing from floating bar).
   - Zero tests existed for `aiExporter.js` or `exportToAIMarkdown`.

---

## 2. Logic Chain

1. **Frontmatter Incompleteness**:
   - *Observation 1* shows that Frontmatter only serializes layout type and basic profile info, omitting all visual typography, spacing, contrast colors, bullet styles, and dynamic contacts.
   - *Logic*: To satisfy Requirement R2 and establish Markdown as a 1:1 digital twin of the rendered document, Frontmatter must incorporate the complete parameters from `cvData.layout`, dynamic colors via `getDynamicTextColors()`, and normalized contacts from `normalizeItemContacts()`.

2. **Body Formatting Gaps**:
   - *Observation 3* reveals dropped fields in education, mentoring, certificates, and publications formatters.
   - *Logic*: To satisfy R2 ("Garantizar que el cuerpo Markdown capture exhaustivamente el 100% de las secciones, items, fechas, subtítulos, viñetas, enlaces y descripciones"), `itemFormatters.js` and `aiExporter.js` must be updated so no valid field is lost during markdown conversion.

3. **Translation & Localization Schema Injection**:
   - *Observation 2 and 5* demonstrate that `buildAIPromptPayload` lacks schema injection, but `sanitizeAndValidateCVSnapshot` accepts native `{ profile, layout, sections }`.
   - *Logic*: When `promptId === 'translate_english'` or `promptDef.category === 'localization'`, injecting a compact `cvData` JSON skeleton directly into the prompt's input block provides LLMs with the exact target schema required for zero-friction import in the Version Manager.

4. **Payload & Prompt Standardization**:
   - *Observation 2 and 4* show that `user_commentary` is unhandled and `output_format` is empty across most prompts.
   - *Logic*: Adding `user_commentary` assembly in `buildAIPromptPayload` and defining explicit, granular `output_format` fields across all prompts (in `es`, `en`, and `ai-knowledge`) directly solves R1, R3, and R5.

---

## 3. Caveats

1. **Pre-existing ActionMenu Test Failures**: 8 tests failed in the baseline test run due to previous ActionMenu button refactoring (`btn-open-actions`). The implementer agent must fix these pre-existing failures to achieve the 100% clean test suite requirement.
2. **Backwards Compatibility**: Any additions to `exportToAIMarkdown` and `buildAIPromptPayload` must preserve existing function signatures and remain compatible with `AIExportModal.jsx`.
3. **No Git Commits**: Strict rule adherence requires all changes to remain unstaged/uncommitted in the working tree.

---

## 4. Conclusion

The subsystem investigation is complete. The architectural blueprint and specifications for:
1. Exhaustive YAML Frontmatter serialization
2. 100% Markdown body item & section fidelity
3. Native `cvData` compact JSON schema injection for Translation & Localization
4. `user_commentary` assembly in `buildAIPromptPayload`
5. Comprehensive Vitest test suite (`src/tests/aiExporter.test.js`)
have been fully documented in `/home/juani/Documentos/Ressume/.agents/explorer_survey_2/survey_report.md`.

---

## 5. Verification Method

To independently verify findings and implementation:
1. **Inspect Report**:
   `cat /home/juani/Documentos/Ressume/.agents/explorer_survey_2/survey_report.md`
2. **Inspect Source Files**:
   - `src/utils/aiExporter.js`
   - `src/registry/itemFormatters.js`
   - `src/utils/schema.js`
   - `src/utils/versionValidator.js`
   - `src/locales/es/prompts.json`, `src/locales/en/prompts.json`
3. **Run Test Suite**:
   `npx vitest run`
   (Expect 719 passing baseline tests, to be brought to 727+ passing with new `aiExporter.test.js` tests).
