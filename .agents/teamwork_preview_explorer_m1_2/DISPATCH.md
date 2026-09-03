## 2026-09-03T04:51:00Z

<USER_REQUEST>
You are Explorer M1-2 for Ressume CV editor project.
Your working directory is: /home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_m1_2
Workspace directory: /home/juani/Documentos/Ressume
Authoritative user request: /home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md (under header ## 2026-09-03T03:17:21Z)
Project Plan: /home/juani/Documentos/Ressume/.agents/teamwork_preview_orchestrator_8/PROJECT.md
Predecessor Survey: /home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o7_survey_1/handoff.md

You MUST read /home/juani/Documentos/Ressume/.agents/ORIGINAL_REQUEST.md first.

Task:
Design the complete architecture for src/components/PDF/CVDocument.jsx.
Ensure 1:1 mirroring of #area-cv:
1. Both 2-column and 1-column layouts.
2. Dynamic colors, font families mapped to standard PDF Type 1 fonts (no network requests), font sizes, paddings, section gaps, item gaps.
3. Super-container pagination using wrap={false} so sections break cleanly between pages and items are never split mid-block.
4. Support for all section types and item types.
Write your component blueprint and styling logic to handoff.md in your working directory, and use send_message to report back to parent when done.
</USER_REQUEST>
