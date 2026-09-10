# Task Assignment — Worker M3 (Primary TDD Pixel-Parity Suite & System Verification)

**Working Directory**: /home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m3
**Authoritative Request**: /home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md (see section ## 2026-09-10T03:58:34Z)
**Role**: teamwork_preview_worker

## Exclusive File Ownership
You exclusively own and may edit:
- `src/tests/pixelParityEditorPrint.test.jsx`

Do NOT edit files outside this set unless a minor bug is discovered that prevents the test suite from passing, in which case document it explicitly.

## Reference Inputs
Read the following before starting:
- `/home/juani/Documentos/Ressume/PROJECT.md`
- `/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md`
- Explorer 3 Report: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o10_survey_3/handoff.md` and `findings.md`
- Worker M1 Report: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m1/handoff.md`
- Worker M2 Report: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m2/handoff.md`

## Mission & Tasks
1. **Upgrade `src/tests/pixelParityEditorPrint.test.jsx`**:
   Replace the old test (which used synthetic mock maps and <= 2px tolerance) with a real, comprehensive, programmatic TDD test suite that mounts the real `#area-cv` editor DOM and compares it against the rendered clean print snapshot (`generateCleanPrintHTML` / `executeCleanPrint`), enforcing **strict 0px drift tolerance**:
   - **Pillar 1: Strict 794px Container Width & 1.0 Zoom**:
     Assert that container width is exactly 794px in both editor and print snapshot across both 1-column ATS mode and 2-column mode, and document zoom is strictly 1.0.
   - **Pillar 2: CSS Custom Property Evaluation (0 Delta)**:
     Assert that all CSS custom properties (`--page-padding`, `--section-gap`, `--item-gap`, `--line-height`, `--font-scale`, `--container-color`, `--container-color-alt`, `--body-color`, `--title-color`, `--text-color`, etc.) match between editor `#area-cv` and print `#area-cv` without alteration or re-scaling.
   - **Pillar 3: Coordinate & Bounding Box Geometric Parity (0px Drift)**:
     Assert that `top`, `left`, `width`, and `height` of every section container (`.cv-section`), item container (`.cv-block`), and typography element between editor and print snapshot have exactly 0px delta (`delta === 0` or `Math.abs(editor - print) === 0`).
   - **Pillar 4: Computed Typography Metrics Parity**:
     Assert that computed font sizes, line heights, and font families have 0px delta between live editor and print snapshot.
   - **Pillar 5: Complete Interactive Artifact Concealment**:
     Query the rendered print DOM for all 26 blacklisted interactive artifact selectors (`.drag-handle`, `.section-drag-handle`, `.item-drag-handle`, `.round-btn-del`, `.round-btn-add`, `.section-del-btn`, `.item-del-btn`, `.bullet-del-btn`, `.add-bullet-btn`, `.section-add-container`, `.column-add-section`, `.section-tips-toggle-btn`, `.suggestion-tooltip`, `.column-resizer`, `.rich-text-toolbar`, `.action-menu-btn`, `.l-navbar`, `.a4-page-fold-guide`, `.spacer-resize-handle`, `.spacer-controls-bar`, `.contact-del-btn`, `.add-contact-btn`, etc.) and assert that ZERO (0) occurrences exist in the print output.
   - **Pillar 6: Dual Layout Coverage (1-Col ATS & 2-Col)**:
     All checks must run and pass for both standard 2-column layout and 1-column ATS layout.

2. **Run Full Verification**:
   - Run the upgraded suite: `npx vitest run src/tests/pixelParityEditorPrint.test.jsx` (must pass 100%).
   - Run the entire test repository: `npx vitest run` (all 32+ test files must pass with 100% success).
   - Run production build: `npm run build` (must complete with exit code 0 and 0 errors/warnings).

3. **Document in `handoff.md`** and notify parent via `send_message`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-10T04:38:58Z
You are Worker M3 for Project Orchestrator 10 on Ressume.
Your working directory is: /home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m3
Read /home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md (specifically section ## 2026-09-10T03:58:34Z) and your DISPATCH.md at /home/juani/Documentos/Ressume/.agents/teamwork_preview_worker_m3/DISPATCH.md.
Also read PROJECT.md at /home/juani/Documentos/Ressume/PROJECT.md, Explorer 3 handoff at /home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o10_survey_3/handoff.md, Worker M1 handoff, and Worker M2 handoff.

Exclusive File Ownership:
- src/tests/pixelParityEditorPrint.test.jsx
Do NOT edit files outside this set unless a minor bug fix in an existing file is strictly necessary, in which case document it explicitly.

Your tasks:
1. Upgrade src/tests/pixelParityEditorPrint.test.jsx into a comprehensive, real-DOM programmatic verification suite with strict 0px drift tolerance:
   - Mount real #area-cv in editor and generate clean print snapshot via generateCleanPrintHTML / executeCleanPrint.
   - Assert strict 794px container width in both editor and print snapshot across 1-col ATS and 2-col modes, and zoom 1.0.
   - Assert 0 delta across all 14 CSS custom properties (--page-padding, --section-gap, --item-gap, --line-height, --font-scale, --container-color, --container-color-alt, --body-color, etc.).
   - Assert 0px drift (Math.abs(delta) === 0) across top, left, width, height for all sections and items.
   - Assert 0px delta in computed typography metrics (font-size, line-height, font-family).
   - Assert 0 occurrences of all 26 blacklisted interactive artifacts in the print DOM output.
   - Execute all checks across both 1-column ATS mode and 2-column mode.
2. Verification:
   - Run the upgraded suite: npx vitest run src/tests/pixelParityEditorPrint.test.jsx
   - Run the entire repository test suite: npx vitest run (100% pass across all 32+ files, 546+ tests).
   - Run production build: npm run build (0 errors/warnings).
3. Document all test results and findings in handoff.md and notify the parent orchestrator via send_message.
