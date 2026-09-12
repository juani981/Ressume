# Handoff Report: Explorer Survey 1 — UI & AIExportModal

## 1. Observation
1. In `src/components/Editor/AIExportModal.jsx` (lines 9-12):
   ```javascript
   const [selectedPromptId, setSelectedPromptId] = useState('recruiter_audit');
   const [selectedFormat, setSelectedFormat] = useState('markdown');
   const [layoutMode, setLayoutMode] = useState('1-column'); // Default to 1-column ATS mode for >95 score
   const [jobDescription, setJobDescription] = useState('');
   ```
   And lines 27-35:
   ```javascript
   const targetCvData = useMemo(() => {
     return {
       ...cvData,
       layout: {
         ...(cvData.layout || {}),
         type: layoutMode
       }
     };
   }, [cvData, layoutMode]);
   ```
   Layout mode is hardcoded to `'1-column'` in local state, overriding `cvData.layout.type` even when the user is in 2-column Traditional mode.
2. In `src/components/Editor/LayoutModeToggle.jsx` (line 18) and `src/App.jsx` (lines 118-119):
   ```javascript
   const isAtsMode = cvData.layout?.isAtsMode === true || cvData.layout?.type === '1-column';
   ```
   The application defines active ATS mode canonically through this condition.
3. In `src/components/Editor/AIExportModal.jsx` (lines 182-230):
   Both the Layout Mode selector (`Disposición de Abstracción`) and Format selector (`Formato de Abstracción`) are already commented out in JSX. Format defaults to `'markdown'`.
4. In `src/components/Editor/AIExportModal.jsx`:
   There is currently no state or textarea for `user_commentary`.
   `jobDescription` is conditionally rendered only when:
   ```javascript
   selectedPrompt.required_inputs?.includes('job_description')
   ```
   which matches prompt ID `job_matcher` (lines 245-268).
5. In `src/utils/aiExporter.js` (lines 371-411):
   `buildAIPromptPayload` accepts `options` with `{ format, jobDescription, lang }`, but does not support `userCommentary` / `user_commentary`.
6. In `src/tests/adversarial-challenger.test.jsx` (lines 387, 395-404):
   `AIExportModal` is rendered with `isOpen={true}` and tested for the strict absence of emoji characters (`🛑`, `🚨`, `⚠️`, `ℹ️`, `💡`, `✨`, `🌐`, `🤖`, `📄`). No other tests exist for `AIExportModal`.

## 2. Logic Chain
1. *From Observation 1 & 2*: Since `layoutMode` is hardcoded to `'1-column'` inside `AIExportModal.jsx`, opening the modal on a 2-column document mistakenly converts `targetCvData.layout.type` to `'1-column'`. By replacing `layoutMode` state with a derived `const isAtsMode = cvData.layout?.isAtsMode === true || cvData.layout?.type === '1-column';` and setting `targetCvData.layout.type = isAtsMode ? '1-column' : '2-column'`, the modal will faithfully preserve the active CV layout without requiring interactive selectors.
2. *From Observation 3*: Because the format selector is commented out and requirement R1 mandates locking format to Semantic Markdown, `selectedFormat` can be fixed to `'markdown'` and the file download extension fixed to `.md`.
3. *From Observation 4 & 5*: To support universal user customization, introducing `const [userCommentary, setUserCommentary] = useState('')` and rendering a freeform `<textarea data-testid="ai-user-commentary">` for all prompts allows the user to append custom instructions. Updating `buildAIPromptPayload` to inject `user_commentary: <text>` into the prompt header when provided guarantees full payload inclusion.
4. *From Observation 4*: Since `selectedPrompt.required_inputs?.includes('job_description')` evaluates to true exclusively for `job_matcher`, keeping this check ensures `job_description` renders only for `job_matcher`, coexisting cleanly below `user_commentary`.
5. *From Observation 1 & 5*: React's `useMemo` in `compiledPayload` depends directly on `[targetCvData, selectedPromptId, userCommentary, jobDescription, activeLanguage]`. Because `buildAIPromptPayload` is a synchronous pure function, any keystroke in either textarea instantly recomputes `compiledPayload` and updates the `<pre>` preview without latency.
6. *From Observation 6*: Since `AIExportModal` lacks functional unit tests, creating `src/tests/aiExportModal.test.jsx` with 15 targeted test cases will ensure 100% test coverage of R1 requirements and guard against regressions.

## 3. Caveats
- No caveats. All files in scope were thoroughly inspected and analyzed in the actual codebase.

## 4. Conclusion
The UI architecture of `AIExportModal.jsx` is clear and ready for the R1 refactoring:
1. Eliminate manual `layoutMode` state; derive layout from `cvData.layout?.isAtsMode === true || cvData.layout?.type === '1-column'`.
2. Lock export format to Semantic Markdown (`selectedFormat = 'markdown'`).
3. Add `userCommentary` state and textarea (`data-testid="ai-user-commentary"`) for all prompts.
4. Retain conditional rendering of `jobDescription` exclusively for `job_matcher`.
5. Integrate both fields into `buildAIPromptPayload` and ensure the live preview `<pre>` re-renders synchronously.
6. Add comprehensive unit tests in `src/tests/aiExportModal.test.jsx`.

Full details, before-and-after JSX snippets, and test specifications are documented in:
`/home/juani/Documentos/Ressume/.agents/explorer_survey_1/survey_report.md`

## 5. Verification Method
1. Inspect survey report:
   `view_file` on `/home/juani/Documentos/Ressume/.agents/explorer_survey_1/survey_report.md`
2. Verify code references in `src/components/Editor/AIExportModal.jsx` and `src/utils/aiExporter.js`.
3. Confirm test baseline execution via `npx vitest run`.
