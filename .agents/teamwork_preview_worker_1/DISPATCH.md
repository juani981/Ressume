## 2026-09-02T02:17:37Z
You are Worker 1 implementing the Ressume Transformation.
Your working directory is /home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_1.
Create your working directory if needed.
Read the authoritative user request at /home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md (latest timestamp ## 2026-09-02T02:11:43Z).
Read /home/juani/Documentos/Ressume/PROJECT.md.
Read the survey reports at:
- /home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_survey_1/analysis.md
- /home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_survey_2/analysis.md
- /home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_survey_3/analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Tasks:
1. Universal Typography & Independent Spacing Engine (M1):
   - `index.html`: Google Fonts preload for Inter, JetBrains Mono, Merriweather, Poppins, Roboto.
   - `src/index.css`: `@import` for all 5 fonts, dynamic `:root` typography scale formulas (`--font-scale`, `--line-height`, `--body-font`), `#area-cv` style propagation, `.resume` 1-col `display: block` fix to prevent desktop 1fr squish, print `break-inside: avoid !important`.
   - `src/utils/schema.js`: Add `fontFamily: 'Poppins'`, `fontScale: 1.0`, `lineHeight: 1.45` to `defaultSchema.layout`.
   - `src/context/CVContext.jsx`: Ensure schema backward compatibility when reading localStorage and ensure `profile_header` deletion guard.
   - `src/App.jsx`: Propagate `--font-scale`, `--line-height`, `--body-font`, `--page-padding`, `--section-gap`, `--item-gap` to `#area-cv`. Set 1-column container to `display: block; width: 100%; max-width: 840px; margin: 0 auto;`.
2. ATS 1-Column Layout Overhaul & 2-Column Integration (M2):
   - Fix `.resume` grid conflict on desktop (`min-width: 968px`) by setting `display: block` on 1-column container so it occupies the full, centered 840px width.
   - Ensure linear ATS flow for sections and clean line lengths.
3. Natural & Forgiving Drag-and-Drop Ergonomics & Component Registry (M3):
   - `src/components/Editor/DragHandle.jsx`: Generous grab handles, smooth hover affordance, clear grab cursor.
   - `src/components/CV/BaseSection.jsx` and `src/components/CV/BaseItem.jsx`: Attach `.cv-section` and `.cv-block` classes for print pagination. Ensure smooth drag targets.
   - `src/components/Editor/SuggestionTooltip.jsx`: Maintain strict Obsidian Callout standard with `lucide-react` icons and dynamic `getBoundingClientRect()` clamping/flipping.
4. Strict Zero-Split PDF Printing Core & Auto-Scaling (M4):
   - `src/utils/staticHtmlPdfEngine.js`:
     - Set `MIN_SCALE_FLOOR = 0.75`.
     - Inject `--page-padding: ${pagePadding}px;`, `--font-scale`, `--line-height`, `--body-font` in `:root`.
     - Ensure 2-col resume root has `class="resume bd-grid" id="area-cv"`.
     - Ensure 1-col resume has `class="resume resume__single-column" id="area-cv"` with `padding: var(--page-padding, 24px)`.
     - In `executeCleanPrint`, ensure hidden iframe dimensions are set properly (`0px` or as needed) and print zoom scaling is applied cleanly.
     - Enforce `break-inside: avoid !important; page-break-inside: avoid !important;` on `.cv-section, .cv-block, .section, .experience__content, .education__content, .skills__name`.
5. ActionMenu UX Homogenization & Data Integrity (M5):
   - `src/components/Editor/ActionMenu.jsx`: Consolidate into a categorized floating toolbar with 4 intuitive tabs/popovers:
     1. Diseño & Tipografía (Font Selector for Poppins, Inter, Roboto, Merriweather, JetBrains Mono; Font Scale slider 0.85-1.25; Line Height slider 1.25-1.85; Layout switch 1-col / 2-col; Colors).
     2. Espaciado & Márgenes (Page Padding 0-60px; Section Gap 0-50px; Item Gap 0-30px).
     3. Exportación & Documentos (Native PDF Print, Prompt Hub, Export JSON).
     4. Idiomas & Traducción (Language switch ES/EN, AI translation manager).
     5. History Controls (Undo Ctrl+Z, Redo Ctrl+Y, Reset).
   - Preserve 100% CV data schema, contact headers, and bilingual content.

Verification:
- Run `npm test` and `npm run build`. Verify all tests pass with 0 errors.
- Write your handoff report to `/home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_1/handoff.md`.
- Send completion message to parent with build/test results.
