## 2026-09-03T01:51:01Z

You are the Project Orchestrator for the Ressume CV editor project.
Your assigned working directory is: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_orchestrator_6`.
The project workspace root is: `/home/juani/Documentos/Ressume`.

Read the authoritative user request in `/home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md` under the latest section (`## 2026-09-03T01:50:08Z`).

Your mission:
Implement a bulletproof, zero-artifact, 1:1 vector/text PDF print and export engine for the Ressume CV editor. The print output must strictly capture only the contents of the main editing paper (`#area-cv`), rendering 100% selectable text (never rasterized canvas images) with exact typography, active layout rules, custom spacings, colors, and inner icons, completely stripped of all interactive editor artifacts.

Requirements:
- R1. True 1:1 Vector & Selectable Text PDF Generation (high-fidelity PDF with 100% selectable text and crisp vector icons; exact layout, grid/column widths, custom font families, font scale, line height, section gap, item gap, page padding, background colors).
- R2. Complete Interactive Artifact Stripping (strip `.section-drag-handle`, `.item-drag-handle`, `.round-btn-del`, `.section-del-btn`, `.item-del-btn`, `.bullet-del-btn`, `.round-btn-add`, `.add-bullet-btn`, `.section-add-container`, `.column-add-section`, `.section-tips-toggle-btn`, `.suggestion-tooltip`, `.column-resizer`, `.l-navbar`, input placeholders and raw textarea outlines).
- R3. Strict Zero-Split Super-Container Pagination (`break-inside: avoid !important; page-break-inside: avoid !important;` on `.cv-section` and `.cv-block` containers; no orphaned headers).
- R4. Reliable Native & Client-Side Execution Pipeline (connect to ActionMenu export triggers `executeCleanPrint` and PDF download via isolated clean iframe printing or direct downloadable PDF stream without layout shifts or font glitches).

Acceptance Criteria:
- Exported PDF matches `#area-cv` layout 1:1.
- 100% selectable, copyable text (0% canvas rasterization).
- Inner icons render cleanly and in spatial positions.
- 0 editor controls in print output or iframe.
- Super-containers adhere to `break-inside: avoid`.
- Automated tests verify `executeCleanPrint` / `generateCleanPrintHTML` produce clean HTML adhering to CSS variable bindings and containing 0 interactive class selectors.
- Full build (`npm run build`) and test suite pass with 0 errors.
