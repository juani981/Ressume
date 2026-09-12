# BRIEFING — 2026-09-12T02:50:00Z

## Mission
Survey and analyze the UI and AIExportModal subsystem in Ressume for the AI prompt and CV abstraction enhancements (R1 requirements). Produce comprehensive survey report and handoff.

## 🔒 My Identity
- Archetype: Teamwork explorer
- Roles: UI & Modal Investigation, Systems Survey, Analysis and Synthesis
- Working directory: /home/juani/Documentos/Ressume/.agents/explorer_survey_1
- Original parent: 02c4cf40-e939-46e8-b992-fac7558fc6f8
- Milestone: AI CV Abstraction & Prompt System Overhaul - Survey 1 (UI & AIExportModal)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Inspect AIExportModal.jsx, ActionMenu.jsx, App.jsx, CVContext.jsx
- No automatic git commits
- Adhere to Obsidian callout rules and dynamic tooltips if applicable
- Maintain production stability and 100% test pass rate

## Current Parent
- Conversation ID: 02c4cf40-e939-46e8-b992-fac7558fc6f8
- Updated: 2026-09-12T02:50:00Z

## Investigation State
- **Explored paths**:
  - `src/components/Editor/AIExportModal.jsx` (all 356 lines inspected)
  - `src/components/Editor/ActionMenu.jsx` (modal trigger, button styling, layout)
  - `src/components/Editor/LayoutModeToggle.jsx` (canonical `isAtsMode` derivation)
  - `src/context/CVContext.jsx` and `src/context/hooks/useCVLayout.js` (layout state, updateLayout)
  - `src/utils/aiExporter.js` (`buildAIPromptPayload`, `exportToAIMarkdown`)
  - `src/utils/schema.js` (`defaultSchema.layout`)
  - `src/locales/es/prompts.json` & `src/locales/en/prompts.json` (prompt definitions, missing output_format)
  - `src/tests/` (adversarial challenger, epic3, vitest run)
- **Key findings**:
  - `AIExportModal.jsx` currently hardcodes `const [layoutMode, setLayoutMode] = useState('1-column')`, overriding user's actual 2-column layout. Must be derived dynamically: `const isAtsMode = cvData.layout?.isAtsMode === true || cvData.layout?.type === '1-column'`.
  - Format selector is already commented out in JSX; format is locked to `'markdown'`.
  - `user_commentary` textarea is missing and needs to be added for all prompts with instant live preview reactivity.
  - `job_description` textarea is currently conditional on `selectedPrompt.required_inputs?.includes('job_description')`, which matches `job_matcher`. It will coexist cleanly with `user_commentary`.
  - No dedicated tests exist for `AIExportModal.jsx`. 15 test cases mapped out.
- **Unexplored areas**: Backend LLM integration (out of scope, client-only app).

## Key Decisions Made
- Layout detection must follow the exact canonical formula used in `App.jsx` and `LayoutModeToggle.jsx`: `cvData.layout?.isAtsMode === true || cvData.layout?.type === '1-column'`.
- Format locked to Semantic Markdown without UI selector.
- Live preview reactivity is achieved purely through React's `useMemo` dependency array `[targetCvData, selectedPromptId, userCommentary, jobDescription, activeLanguage]`.

## Artifact Index
- /home/juani/Documentos/Ressume/.agents/explorer_survey_1/DISPATCH.md — Dispatch instructions
- /home/juani/Documentos/Ressume/.agents/explorer_survey_1/BRIEFING.md — Working memory
- /home/juani/Documentos/Ressume/.agents/explorer_survey_1/progress.md — Liveness & heartbeat
- /home/juani/Documentos/Ressume/.agents/explorer_survey_1/survey_report.md — Comprehensive survey report
- /home/juani/Documentos/Ressume/.agents/explorer_survey_1/handoff.md — 5-component handoff report
