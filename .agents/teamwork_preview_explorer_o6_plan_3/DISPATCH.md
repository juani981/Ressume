# DISPATCH for Explorer Plan 3: Automated Verification Suite Design

You are teamwork_preview_explorer.
Working directory: /home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o6_plan_3
Workspace root: /home/juani/Documentos/Ressume

You MUST read the authoritative request at:
/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md
Specifically review the latest section (2026-09-03T01:50:08Z).
Also read PROJECT.md at /home/juani/Documentos/Ressume/PROJECT.md.

Task:
Formulate the exact test specification and implementation plan for a new test suite: `src/tests/cleanPrintEngineVerification.test.jsx`.
Requirements to cover:
1. 100% Vector & Selectable Text (0% Canvas Rasterization):
   - Assert `doc.querySelectorAll('canvas').length === 0`.
   - Assert 0 Base64 screenshot images.
   - Assert semantic text nodes (`h1`, `h2`, `h3`, `p`, `li`, `span`) exist for all CV data.
   - Assert vector font icons (`<i class="bx ..."></i>`) render with correct classes and without raster artifacts.
2. Complete Interactive Artifact Stripping:
   - Query parsed document with a 18-selector blacklist across all 13 section types, asserting each returns 0 nodes:
     `.section-drag-handle`, `.item-drag-handle`, `.drag-handle`, `.round-btn-del`, `.section-del-btn`, `.item-del-btn`, `.bullet-del-btn`, `.round-btn-add`, `.add-bullet-btn`, `.section-add-container`, `.column-add-section`, `.add-section-btn`, `.bullet-add-row`, `.section-tips-toggle-btn`, `.suggestion-tooltip`, `.obsidian-callout`, `.column-resizer`, `.l-navbar`, `input`, `textarea`, `button`.
   - Verify that editable fields render as plain semantic text nodes without borders or focus rings.
3. Strict Zero-Split Super-Container Pagination:
   - Verify style block contains `break-inside: avoid !important` and `page-break-inside: avoid !important` for `.cv-section`, `.cv-block`, `.experience__content`, `.education__content`, `.skills__name`.
   - Verify orphan header protection: `break-after: avoid !important; page-break-after: avoid !important;` on headings (`.section-title`, `h1`, `h2`, `h3`).
4. Dynamic Typography & CSS Variables Binding:
   - Test that custom spacing and typography values passed in `cvData.layout` (`pagePadding`, `sectionGap`, `itemGap`, `fontScale`, `lineHeight`, `fontFamily`) are accurately evaluated and declared in `:root` CSS rules.
   - Test both 1-column (840px block) and 2-column (1024px grid) container geometries.
5. `executeCleanPrint` Lifecycle & Iframe Validation:
   - Mock/spy on `document.body.appendChild` and `window.print`.
   - Verify iframe is created with desktop A4 dimensions (`width: 794px`, `height: 1123px`).
   - Verify `calculatePrintScale` evaluation.
   - Verify iframe cleanup after print.

Produce your test specification in `analysis.md` and complete `handoff.md` with complete test code for the Worker.
Do NOT implement code changes directly (you are read-only).
When done, notify parent via send_message.

## 2026-09-03T01:59:00Z
Task:
Formulate the exact test specification and implementation plan for a new test suite: `src/tests/cleanPrintEngineVerification.test.jsx`.
Requirements to cover:
1. 100% Vector & Selectable Text (0% Canvas Rasterization):
   - Assert `doc.querySelectorAll('canvas').length === 0`.
   - Assert 0 Base64 screenshot images.
   - Assert semantic text nodes (`h1`, `h2`, `h3`, `p`, `li`, `span`) exist for all CV data.
   - Assert vector font icons (`<i class="bx ..."></i>`) render with correct classes and without raster artifacts.
2. Complete Interactive Artifact Stripping:
   - Query parsed document with a 18-selector blacklist across all 13 section types, asserting each returns 0 nodes:
     `.section-drag-handle`, `.item-drag-handle`, `.drag-handle`, `.round-btn-del`, `.section-del-btn`, `.item-del-btn`, `.bullet-del-btn`, `.round-btn-add`, `.add-bullet-btn`, `.section-add-container`, `.column-add-section`, `.add-section-btn`, `.bullet-add-row`, `.section-tips-toggle-btn`, `.suggestion-tooltip`, `.obsidian-callout`, `.column-resizer`, `.l-navbar`, `input`, `textarea`, `button`.
   - Verify that editable fields render as plain semantic text nodes without borders or focus rings.
3. Strict Zero-Split Super-Container Pagination:
   - Verify style block contains `break-inside: avoid !important` and `page-break-inside: avoid !important` for `.cv-section`, `.cv-block`, `.experience__content`, `.education__content`, `.skills__name`.
   - Verify orphan header protection: `break-after: avoid !important; page-break-after: avoid !important;` on headings (`.section-title`, `h1`, `h2`, `h3`).
4. Dynamic Typography & CSS Variables Binding:
   - Test that custom spacing and typography values passed in `cvData.layout` (`pagePadding`, `sectionGap`, `itemGap`, `fontScale`, `lineHeight`, `fontFamily`) are accurately evaluated and declared in `:root` CSS rules.
   - Test both 1-column (840px block) and 2-column (1024px grid) container geometries.
5. `executeCleanPrint` Lifecycle & Iframe Validation:
   - Mock/spy on `document.body.appendChild` and `window.print`.
   - Verify iframe is created with desktop A4 dimensions (`width: 794px`, `height: 1123px`).
   - Verify `calculatePrintScale` evaluation.
   - Verify iframe cleanup after print.

