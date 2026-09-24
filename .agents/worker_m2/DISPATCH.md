# Dispatch: Worker M2 — CV Abstraction, Frontmatter & Payload Core

## Mandatory Reading
- `/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md` (lines 589-658)
- `/home/juani/Documentos/Ressume/.agents/teamwork_preview_orchestrator_14/PROJECT.md`
- `/home/juani/Documentos/Ressume/.agents/explorer_survey_2/survey_report.md` (Contains exact Frontmatter schema and body formatting requirements)
- `AGENTS.md`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

STRICT RULE: DO NOT execute automated git commits. Changes must stay in the working tree for user review.

## File Ownership
You exclusively own and may modify:
- `src/utils/aiExporter.js`
- `src/registry/itemFormatters.js`

DO NOT modify any other files.

## Objective & Requirements
Refactor `src/utils/aiExporter.js` and `src/registry/itemFormatters.js` according to the contracts in `PROJECT.md`:
1. **Enrich YAML Frontmatter (`exportToAIMarkdown`)**:
   - Capture `layout_type` ('1-column' | '2-column') and `is_ats_mode` (`layout.isAtsMode === true || layout.type === '1-column'`).
   - Capture section ordering:
     - 1-column: Linear canonical and custom sections.
     - 2-column: Separate `left_column_sections` and `right_column_sections` arrays.
   - Capture `typography`: `font_family`, `font_scale`, `line_height`, `title_scale`, `body_scale`, `list_scale`.
   - Capture `spacing`: `page_padding`, `section_gap`, `item_gap`.
   - Capture `styling`: `bullet_style`, `container_colors` (`left_bg`, `right_bg`, `title_color`, `text_color`, `container_color`).
   - Capture `candidate_profile`: `name`, `headline`, `location`, `contact: { email, phone, linkedin, github, ...all dynamic contacts from profileItem.contacts }`.
2. **100% Markdown Body Fidelity**:
   - In `src/registry/itemFormatters.js` and `aiExporter.js`:
     - `certificatesMarkdown`: include `item.description` and use `item.linkText || 'Credencial'` for links.
     - `publicationsMarkdown`: include `item.description` and use `item.linkText || 'Enlace'` for links.
     - `educationMarkdown`: format `item.description` and `item.bullets` if present.
     - `baseItemMarkdown`: check `item.mentee` for mentoring section alongside company/institution.
     - In 2-column mode: group Left Column sections (Sidebar) and Right Column sections (Main Content) legibly.
3. **`buildAIPromptPayload(cvData, promptId, options)` Assembly**:
   - Accept `options = { format, jobDescription, userCommentary, lang }`.
   - Order payload cleanly:
     1. `role: <system_instruction>`
     2. `task: <task>`
     3. `output_format: <output_format>`
     4. `user_commentary: <userCommentary>` (only if non-empty string)
     5. `job_description: <jobDescription>` (only if prompt requires it and non-empty string)
     6. `---`
     7. CV input data (`exportToAIMarkdown` by default).
   - If `promptId === 'translate_english'` or `promptDef?.category === 'localization'`:
     - Inject a compact native `cvData` JSON reference schema (with `{ layout, profile, sections }` structure) inside the input block to anchor the model's output to the exact schema expected by `versionValidator.js`.

## Verification
Run tests or node script to verify that `exportToAIMarkdown` and `buildAIPromptPayload` produce clean, valid Markdown and Frontmatter with no runtime exceptions.
Write your completion report to `/home/juani/Documentos/Ressume/.agents/worker_m2/handoff.md` and send a message.

## 2026-09-12T02:52:37Z
You are Worker M2. Your working directory is: /home/juani/Documentos/Ressume/.agents/worker_m2
Read your dispatch instructions in:
/home/juani/Documentos/Ressume/.agents/worker_m2/DISPATCH.md
and the authoritative user request in:
/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md (lines 589-658).
Reference specifications:
/home/juani/Documentos/Ressume/.agents/explorer_survey_2/survey_report.md
/home/juani/Documentos/Ressume/.agents/teamwork_preview_orchestrator_14/PROJECT.md

