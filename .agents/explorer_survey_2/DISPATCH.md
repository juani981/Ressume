# Dispatch: Explorer Survey 2 — CV Abstraction & Markdown Generation

## Objective
Investigate CV Abstraction and Markdown Generation in `src/utils/aiExporter.js`:
- Inspect `src/utils/aiExporter.js` and all functions related to `exportToAIMarkdown`, `exportToAIText`, `exportToAIJson`, and `buildAIPromptPayload`.
- Check how YAML frontmatter is currently constructed and identify all missing visual & structural metadata:
  - `layout_type`, canonical and visual section ordering (left/right column assignments if 2-column, linear order if 1-column)
  - typography settings (font_family, font_scale, line_height, title_scale, body_scale, list_scale)
  - page_padding, section_gap, item_gap
  - bullet styles, container colors (leftBg, rightBg, title-color, text-color, container-color, etc.)
  - complete profile and contact metadata (name, title, email, phone, location, links/socials)
- Check how the Markdown body is constructed:
  - Ensure 100% of sections and item types are captured without omission (experience, education, skills, projects, certifications, languages, custom sections, etc.).
  - Include dates, subtitles, bullets, links, descriptions, tags, levels.
- Check Translation & Localization prompt requirement:
  - How to inject a compact native `cvData` JSON schema alongside the enriched Markdown in the input block for `translate_english` / translation prompt.
  - Inspect `src/utils/versionValidator.js` and `src/utils/schema.js` to ensure the schema format aligns with Version Manager import standards.
- Check existing tests for `aiExporter.js` and identify missing test coverage.

## Files to Inspect
- `/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md` (lines 589-658)
- `src/utils/aiExporter.js`
- `src/utils/schema.js`
- `src/utils/versionValidator.js`
- `src/registry/sectionRegistry.js`
- Existing tests: e.g. `src/tests/aiExporter.test.js` or similar
- `AGENTS.md`

## Output Requirements
Write your detailed findings and architectural recommendations to:
`/home/juani/Documentos/Ressume/.agents/explorer_survey_2/survey_report.md`
Include:
1. Current implementation of `exportToAIMarkdown` and Frontmatter serialization
2. Gap analysis: current Frontmatter vs required exhaustive visual/structural fields
3. Gap analysis: current Markdown body vs 100% section/item coverage
4. Translation & Localization JSON schema injection design and compatibility with `versionValidator.js`
5. Existing test coverage and proposed tests
6. Recommended data structures and functions

When complete, write your report and send a handoff message.

## 2026-09-12T02:46:44Z
<USER_REQUEST>
You are Explorer Survey 2. Your working directory is: /home/juani/Documentos/Ressume/.agents/explorer_survey_2
Read your dispatch instructions in:
/home/juani/Documentos/Ressume/.agents/explorer_survey_2/DISPATCH.md
and the authoritative user request in:
/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md (specifically lines 589-658).

Focus on CV Abstraction & Markdown Generation:
- Inspect src/utils/aiExporter.js (exportToAIMarkdown, exportToAIText, exportToAIJson, buildAIPromptPayload).
- Audit current YAML frontmatter and design exhaustive frontmatter capturing layout_type, column section order, typography, font scales, page padding, section gap, item gap, bullet styles, container colors, and complete profile/contact details.
- Audit Markdown body and ensure 100% section and item coverage (experience, education, skills, projects, certifications, languages, custom sections, dates, subtitles, bullets, links, descriptions).
- Design Translation & Localization prompt support: inject compact cvData native JSON schema inside input block alongside Markdown, aligning with src/utils/versionValidator.js and src/utils/schema.js.
- Inspect existing tests for aiExporter and specify test cases needed.

Write your comprehensive report to:
/home/juani/Documentos/Ressume/.agents/explorer_survey_2/survey_report.md
When finished, send a handoff message to parent.
</USER_REQUEST>

