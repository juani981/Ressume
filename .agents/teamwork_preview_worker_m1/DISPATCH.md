# Task Assignment — Worker M1 (CSS Architecture & Single Source of Truth Alignment)

## 2026-09-10T04:12:20Z

**Working Directory**: /home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m1
**Authoritative Request**: /home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md (see section ## 2026-09-10T03:58:34Z)
**Role**: teamwork_preview_worker

## Exclusive File Ownership
You exclusively own and may edit the following files:
- `src/utils/staticHtmlPdfEngine.js`
- `src/index.css`
- `src/styles/print.css`
- `src/App.jsx`

Do NOT edit files outside this set.

## Reference Inputs
Read the following files before starting:
- `/home/juani/Documentos/Ressume/PROJECT.md`
- `/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md`
- Explorer 1 Report: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o10_survey_1/handoff.md` and `findings.md`
- Explorer 2 Report: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o10_survey_2/handoff.md` and `findings.md`

## Mission & Tasks
1. **`src/utils/staticHtmlPdfEngine.js`**:
   - Remove destructive regex stripping lines 448–464 so core layout CSS rules (section margins, last-of-type margins, dynamic text contrast) are preserved in `activeBaseStyles`.
   - Ensure the 2-column print container includes `bd-grid` in its class string (`class="resume bd-grid ..."`).
   - Align default background fallback for left column to `#f3f4f6` (matching `App.jsx`).
   - Remove artificial `margin-top: ${pushDistance + 10}px !important` injection on elements with forced page breaks in `executeCleanPrint` line 823.
   - Enforce strictly 1.0 zoom (remove downscaling branch in lines 878–881).
   - Propagate all CSS custom properties (`--container-color-alt`, etc.) identically.
2. **`src/index.css`**:
   - Extract core document styling rules from `@media screen and (min-width: 968px)` (lines 583–655) and apply them to `#area-cv` and its descendant containers (`.home__container`, `.social__container`, `.languages__content`, `.interests__container`, `.skills__content`, `.section-title`, `.home__img`, `.home__data`) so they render identically in both the 794px print iframe and desktop editor.
   - Clean up any divergent print overrides.
3. **`src/styles/print.css`**:
   - Remove `width: 100% !important; max-width: 100% !important; margin: 0 !important;` overrides on `#area-cv, .resume` and enforce strict 794px width (`width: 794px !important; min-width: 794px !important; max-width: 794px !important; margin: 0 auto !important;`).
   - Remove padding overrides that conflict with `--page-padding`.
   - Scope `.resume__single-column` padding to `#area-cv.resume__single-column`.
4. **`src/App.jsx`**:
   - Ensure `#area-cv` has strict 794px container styling (`width: "794px", minWidth: "794px", maxWidth: "794px", margin: "0 auto"`).
   - In 1-column ATS mode, remove the redundant inner `div.resume__single-column` wrapper (or ensure it does not duplicate padding/width).
5. **Verification**:
   - Run `npm test -- --run` and `npm run build`. Verify all tests pass cleanly and build succeeds with 0 errors.
   - Write comprehensive report to `handoff.md` and notify parent via `send_message`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
