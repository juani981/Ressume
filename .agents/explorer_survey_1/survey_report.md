# Survey Report: UI & AIExportModal Architecture

**Explorer**: Explorer Survey 1  
**Date**: 2026-09-12T02:50:00Z  
**Target Component**: `src/components/Editor/AIExportModal.jsx`  
**Related Components**: `ActionMenu.jsx`, `LayoutModeToggle.jsx`, `App.jsx`, `CVContext.jsx`, `aiExporter.js`  
**Scope**: Requirement R1 (Opinionated & Clean AI Modal Experience), Live Reactivity, and UI Tests.

---

## Executive Summary

This survey provides an exhaustive technical analysis of the UI, state, and reactivity mechanisms of `AIExportModal.jsx` in Ressume. Currently, `AIExportModal.jsx` contains remnants of previous manual layout and format selectors (which are commented out in JSX, but state is hardcoded to `'1-column'`), lacks the `user_commentary` textarea, and does not have dedicated unit tests. 

We provide precise architectural solutions to:
1. Automatically detect the active layout mode (`1-column` ATS vs `2-column` Traditional) directly from `cvData.layout` without showing dropdowns.
2. Lock the export format to Semantic Markdown.
3. Introduce a universal `user_commentary` freeform textarea for all prompts.
4. Render `job_description` exclusively for `job_matcher`, coexisting cleanly with `user_commentary`.
5. Ensure zero-latency, 60fps live preview reactivity.
6. Provide a comprehensive 15-case Vitest suite specification.

---

## 1. Current Component Structure and State in `AIExportModal.jsx`

### 1.1 File Location & Imports
- **File**: `src/components/Editor/AIExportModal.jsx` (356 lines)
- **Imports**:
  - `React, { useState, useMemo } from 'react';`
  - `useCV` from `../../context/CVContext`
  - `getPrompts, getUI` from `../../locales/index`
  - `buildAIPromptPayload` from `../../utils/aiExporter`
  - Lucide icons: `BrainCircuit, Target, Layout, FileText, Briefcase, Eye, Download, Copy, Check, X`

### 1.2 Calling Topology & Context Hierarchy
```
App.jsx (renders ActionMenu)
└── ActionMenu.jsx
    ├── Button (#ia-prompts-item / BotMessageSquare) -> triggers setIsAIModalOpen(true)
    └── <AIExportModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
        └── consumes useCV() -> { cvData, activeLanguage }
```
- `ActionMenu.jsx` (lines 345-360, 913) controls modal visibility via standard boolean state `isAIModalOpen`.
- `AIExportModal` does not receive `cvData` as props; it consumes the centralized reactive document state directly via `useCV()`.

### 1.3 Internal State Breakdown (Current vs Proposed)

| State Variable | Current Implementation | Proposed Refactor | Purpose |
|---|---|---|---|
| `selectedPromptId` | `useState('recruiter_audit')` | `useState('recruiter_audit')` | Tracks active prompt objective |
| `selectedFormat` | `useState('markdown')` | *Locked constant* `'markdown'` | Locks export format to Semantic Markdown |
| `layoutMode` | `useState('1-column')` *(Hardcoded)* | **Removed** (Derived from `cvData.layout`) | Eliminates manual state; auto-detects active mode |
| `jobDescription` | `useState('')` | `useState('')` | Optional job description for `job_matcher` |
| `userCommentary` | **Not implemented** | `useState('')` | Universal contextual instructions for the AI |
| `copied` | `useState(false)` | `useState(false)` | Clipboard copy confirmation flag |

### 1.4 The Root Issue in Current Layout State
In `AIExportModal.jsx` line 11:
```javascript
const [layoutMode, setLayoutMode] = useState('1-column'); // Default to 1-column ATS mode for >95 score
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
**Observation**: Even if the user is editing their CV in `2-column` Traditional Mode, opening `AIExportModal` forcibly stamps `type: '1-column'` onto `targetCvData`. As a result, `exportToAIMarkdown` always exports the CV as a 1-column ATS document, discarding 2-column sidebar/main column spatial distribution.

---

## 2. Automatic Layout Mode Detection Without UI Dropdowns

### 2.1 Canonical Layout Detection Formula
Across the application (`App.jsx` lines 118-119, `LayoutModeToggle.jsx` line 18, `paginationEngine.js`), ATS mode is defined as:
```javascript
const isAtsMode = cvData.layout?.isAtsMode === true || cvData.layout?.type === '1-column';
```
When `isAtsMode` is `true`:
- Layout type is `'1-column'`.
- Section ordering follows `CANONICAL_ATS_ORDER` strictly.
- Reading flow is linear top-to-bottom.

When `isAtsMode` is `false`:
- Layout type is `'2-column'`.
- Sections are divided into `left` (sidebar) and `right` (main content).
- Visual metadata (`left_sidebar_color`, `right_main_color`) are captured.

### 2.2 Refactored `targetCvData` Logic
In `AIExportModal.jsx`, eliminate `layoutMode` state entirely and derive `targetCvData` synchronously from `cvData`:
```javascript
const isAtsMode = useMemo(() => {
  return cvData.layout?.isAtsMode === true || cvData.layout?.type === '1-column';
}, [cvData.layout?.isAtsMode, cvData.layout?.type]);

const targetCvData = useMemo(() => {
  return {
    ...cvData,
    layout: {
      ...(cvData.layout || {}),
      type: isAtsMode ? '1-column' : (cvData.layout?.type || '2-column'),
      isAtsMode: isAtsMode
    }
  };
}, [cvData, isAtsMode]);
```

### 2.3 Preserving Hidden / Commented Dropdown Selectors
In `AIExportModal.jsx` lines 182-204:
The layout dropdown selector (`Disposición de Abstracción`) is currently commented out in JSX.
To strictly satisfy R1 ("sin ofrecer controles ni selectores interactivos de layout o de formato; mantener ocultos/comentados los selectores prescindibles"):
- Keep the JSX block cleanly commented out with clear explanatory docstrings:
```jsx
{/* Layout Mode Selector (Preserved commented out - Layout is auto-detected from active CV context) */}
```
- No interactive layout controls are rendered in the DOM.
- The user cannot inadvertently misconfigure layout disparity between what is visible in `#area-cv` and what is exported.

---

## 3. Locking Format to Semantic Markdown

### 3.1 Motivation & Rationale
Ressume's AI architecture mandates that Semantic Markdown (with exhaustive YAML Frontmatter) is the single canonical source of truth for all downstream LLMs (GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, DeepSeek V3).
Other formats (XML, Plain text ATS) are secondary utilities. Locking the AI export modal exclusively to Semantic Markdown:
1. Guarantees 1:1 parity with the visual printed document.
2. Avoids confusing options that dilute LLM accuracy.
3. Simplifies user workflow to a single "Copy" or "Download" action.

### 3.2 Code Plan for Format Lock
1. **Lock format parameter**:
   In `AIExportModal.jsx`, replace `selectedFormat` state with a fixed constant or default:
   ```javascript
   const selectedFormat = 'markdown';
   ```
2. **Format Selector JSX**:
   Keep lines 206-230 commented out:
   ```jsx
   {/* Abstraction Format Selector (Preserved commented out - Format locked to Semantic Markdown) */}
   ```
3. **Download File Handler**:
   Streamline `handleDownload` (lines 58-82) to default cleanly to `.md`:
   ```javascript
   const handleDownload = () => {
     const candidateName = cvData?.profile?.name ? cvData.profile.name.replace(/\s+/g, '_') : 'CV';
     const blob = new Blob([compiledPayload], { type: 'text/markdown;charset=utf-8' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `${candidateName}_AI_Prompt_${selectedPromptId}.md`;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     URL.revokeObjectURL(url);
   };
   ```

---

## 4. Textarea Design & State Binding for `user_commentary` and `job_description`

### 4.1 `user_commentary` (Universal Optional Freeform Textarea)
- **Scope**: Must appear for **ALL** prompts.
- **State**: `const [userCommentary, setUserCommentary] = useState('');`
- **Icon**: `<MessageSquare size={15} color="#8b5cf6" />` (Lucide React, no emojis).
- **Styling**:
  - Border: `1px solid rgba(150, 150, 150, 0.3)`
  - Background: `var(--body-color, #f9f9f9)`
  - Font: `inherit`, `0.85rem`
  - Resize: `vertical`
  - Rows: `3`
- **JSX Structure**:
```jsx
<div>
  <label 
    htmlFor="ai-user-commentary"
    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}
  >
    <MessageSquare size={15} color="#8b5cf6" /> Instrucciones Adicionales o Comentarios Libres (Opcional):
  </label>
  <textarea
    id="ai-user-commentary"
    data-testid="ai-user-commentary"
    rows={3}
    value={userCommentary}
    onChange={(e) => setUserCommentary(e.target.value)}
    placeholder="Ej: Enfatizar experiencia en arquitectura cloud y microservicios, orientar el perfil a empresas de EE.UU., descartar proyectos académicos antiguos..."
    style={{
      width: '100%',
      padding: '0.75rem',
      borderRadius: '8px',
      border: '1px solid rgba(150, 150, 150, 0.3)',
      background: 'var(--body-color, #f9f9f9)',
      color: 'inherit',
      fontFamily: 'inherit',
      fontSize: '0.85rem',
      resize: 'vertical',
      boxSizing: 'border-box'
    }}
  />
</div>
```

### 4.2 `job_description` (Exclusive Conditional Textarea for `job_matcher`)
- **Scope**: Rendered **exclusively** when `selectedPromptId === 'job_matcher'` (or when `selectedPrompt.required_inputs?.includes('job_description')`).
- **State**: `const [jobDescription, setJobDescription] = useState('');`
- **Icon**: `<Briefcase size={15} color="#e11d48" />`
- **Coexistence**: When `job_matcher` is selected, `user_commentary` appears first (for general candidate instructions), followed immediately by `job_description` (for vacancy requirements). Both fields coexist cleanly in the vertical modal body layout (`display: flex; flexDirection: column; gap: 1.25rem`).
- **JSX Structure**:
```jsx
{(selectedPrompt.id === 'job_matcher' || selectedPrompt.required_inputs?.includes('job_description')) && (
  <div>
    <label 
      htmlFor="ai-job-description"
      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}
    >
      <Briefcase size={15} color="#e11d48" /> Pegar Descripción de la Oferta Laboral (Job Description):
    </label>
    <textarea
      id="ai-job-description"
      data-testid="ai-job-description"
      rows={4}
      value={jobDescription}
      onChange={(e) => setJobDescription(e.target.value)}
      placeholder="Pega aquí los requisitos y responsabilidades de la oferta de trabajo para calcular compatibilidad..."
      style={{
        width: '100%',
        padding: '0.75rem',
        borderRadius: '8px',
        border: '1px solid rgba(150, 150, 150, 0.3)',
        background: 'var(--body-color, #f9f9f9)',
        color: 'inherit',
        fontFamily: 'inherit',
        fontSize: '0.85rem',
        resize: 'vertical',
        boxSizing: 'border-box'
      }}
    />
  </div>
)}
```

---

## 5. Live Preview Reactivity Mechanism

### 5.1 Data Flow Pipeline
```
[User Input in UI]
  ├── Select Prompt -> setSelectedPromptId(id)
  ├── Type Comment  -> setUserCommentary(text)
  └── Type Job Desc -> setJobDescription(text)
       │
       ▼ (React State Trigger)
useMemo(() => buildAIPromptPayload(...), [targetCvData, selectedPromptId, userCommentary, jobDescription, activeLanguage])
       │
       ▼ (Instant Pure String Assembly < 1ms)
compiledPayload updated
       │
       ▼ (Virtual DOM Re-render)
<pre>{compiledPayload}</pre>
<span>{compiledPayload.length} caracteres (~{Math.round(compiledPayload.length / 4)} tokens)</span>
```

### 5.2 Payload Header Assembly Specification (`buildAIPromptPayload`)
In `src/utils/aiExporter.js`:
```javascript
export const buildAIPromptPayload = (cvData, promptId = 'recruiter_audit', options = {}) => {
  const { 
    format = 'markdown', 
    userCommentary = '', 
    user_commentary = '',
    jobDescription = '', 
    job_description = '',
    lang = 'es' 
  } = options;

  const finalUserCommentary = (userCommentary || user_commentary || '').trim();
  const finalJobDescription = (jobDescription || job_description || '').trim();

  const localizedPrompts = getPrompts(lang);
  const promptDef = localizedPrompts.find(p => p.id === promptId) || localizedPrompts[0];

  const payload = [];
  /* Instrucciones del sistema */
  payload.push("---");
  payload.push('role: ' + (promptDef.system_instruction || ''));
  payload.push('');
  /* Tarea a realizar */
  payload.push('task: ' + (promptDef.task || ''));
  payload.push('');
  /* Formato de salida */
  payload.push('output_format: ' + (promptDef.output_format || ''));
  payload.push('');

  /* Comentarios opcionales del usuario (Universal) */
  if (finalUserCommentary) {
    payload.push('user_commentary: ' + finalUserCommentary);
    payload.push('');
  }

  /* Descripción de oferta laboral (job_matcher exclusivo) */
  if (finalJobDescription && (promptDef.id === 'job_matcher' || promptDef.required_inputs?.includes('job_description'))) {
    payload.push('job_description: ' + finalJobDescription);
    payload.push('');
  }

  payload.push('---');
  payload.push(`# DATOS DE ENTRADA DEL CURRÍCULUM VITAE (${format.toUpperCase()})`);
  payload.push('A continuación se presenta el currículum del candidato estructurado en formato Markdown con su propio Frontmatter de metadatos. Analiza únicamente la información contenida dentro del siguiente bloque:');
  payload.push(exportToAIMarkdown(cvData));

  // Inyección complementaria para prompt de traducción
  if (promptDef.id === 'translate_english' || promptDef.category === 'localization') {
    payload.push('');
    payload.push('# SCHEMA JSON NATIVO DE REFERENCIA (ESTRUCTURA cvData)');
    payload.push('A continuación se incluye una copia compacta del schema JSON nativo de cvData para asegurar la correspondencia exacta de claves y tipos al generar la traducción:');
    payload.push('```json');
    payload.push(JSON.stringify(cvData, null, 2));
    payload.push('```');
  }

  return payload.join('\n');
};
```

### 5.3 Live Preview Reactivity Invariants
1. **Omission Rule**: When `userCommentary` is empty string or only whitespace, `user_commentary:` is completely omitted from the payload header. No dangling empty keys.
2. **Instant Reflection**: Typing in `ai-user-commentary` immediately causes `user_commentary: <text>` to appear inside the `<pre>` element.
3. **Token & Character Counter**: Recomputes synchronously without lagging the main JS thread.

---

## 6. Obsidian Callouts, UI Invariants & Emoji Compliance

### 6.1 Callout Styling
The prompt description callout in `AIExportModal.jsx` (lines 234-242) conforms to the **Info** Callout standard:
- Background: `rgba(56, 116, 255, 0.08)`
- Left border: `4px solid #3874ff`
- Title: `<strong>Descripción:</strong>`

### 6.2 Strict Emoji Ban in UI Elements
As established in `src/tests/adversarial-challenger.test.jsx` (lines 394-404):
The test specifically checks that rendered modals and components do **not** contain raw emoji characters (`🛑`, `🚨`, `⚠️`, `ℹ️`, `💡`, `✨`, `🌐`, `🤖`, `📄`).
All icons in `AIExportModal.jsx` must be Lucide SVG components:
- Header: `<BrainCircuit size={28} color="#3874ff" />`
- Objective: `<Target size={15} color="#3874ff" />`
- Commentary: `<MessageSquare size={15} color="#8b5cf6" />`
- Job Description: `<Briefcase size={15} color="#e11d48" />`
- Preview: `<Eye size={15} color="#3874ff" />`
- Download: `<Download size={16} />`
- Copy: `<Copy size={16} />`
- Success: `<Check size={16} color="#2ecc71" />`

---

## 7. Existing Tests & Proposed New Test Suite

### 7.1 Current Test Landscape
- `src/tests/adversarial-challenger.test.jsx`: Mounts `AIExportModal isOpen={true}` inside `CVProvider` and asserts absence of emojis.
- There are currently **no functional unit tests** verifying `AIExportModal`'s dropdowns, user commentary, layout detection, or copy/download actions.

### 7.2 Specification for New Test Suite: `src/tests/aiExportModal.test.jsx`
We propose a dedicated test file with 15 granular test cases covering 100% of R1 requirements:

```javascript
describe('AIExportModal Component & Abstraction Engine', () => {
  // 1. Mount and Visibility
  it('T1: does not render into DOM when isOpen is false');
  it('T2: renders modal dialog when isOpen is true');
  it('T3: triggers onClose when close button (X) is clicked');

  // 2. Automatic Layout Mode Detection (No UI Selectors)
  it('T4: automatically detects 1-column ATS layout mode without showing layout dropdown');
  it('T5: automatically detects 2-column Traditional layout mode without showing layout dropdown');
  it('T6: ensures no format dropdown is rendered and format defaults to Semantic Markdown');

  // 3. User Commentary (Universal Input)
  it('T7: renders user_commentary textarea for the default prompt (recruiter_audit)');
  it('T8: live preview updates immediately when typing in user_commentary');
  it('T9: cleanly omits user_commentary block when textarea is empty');

  // 4. Job Description (Exclusive to job_matcher)
  it('T10: hides job_description textarea when recruiter_audit or star_enhancer is selected');
  it('T11: displays BOTH user_commentary and job_description when job_matcher is selected');
  it('T12: live preview includes both user_commentary and job_description when both are filled');

  // 5. Prompt Catalog & Localization
  it('T13: populates select dropdown with all active prompts (existing + tech suite)');
  it('T14: switches prompt instructions and description when selecting a different prompt');

  // 6. Clipboard & Emoji Compliance
  it('T15: copies payload to clipboard on button click and renders zero forbidden emojis');
});
```

---

## 8. Potential Risks, Edge Cases & Mitigation Strategies

| Risk / Edge Case | Impact | Mitigation Strategy |
|---|---|---|
| **Multiline user commentary breaking Frontmatter** | YAML parsers could fail if raw multiline text contains unescaped `:` or `---`. | In `buildAIPromptPayload`, store commentary as indented block or clean multiline block (e.g. `user_commentary: |\n  Line 1\n  Line 2`). |
| **Clipboard API failure in test / headless browsers** | `navigator.clipboard` throws TypeError in insecure contexts or JSDOM. | `AIExportModal` already wraps `handleCopy` in `try / catch`. In tests, mock `navigator.clipboard = { writeText: vi.fn().mockResolvedValue() }`. |
| **Empty or Whitespace-only Input** | Emits `user_commentary: ""` in payload. | Enforce `.trim()` check before adding `user_commentary:` to payload. |
| **Layout Disparity between Editor and Modal** | If `cvData.layout` is undefined in edge snapshots, code could throw `TypeError`. | Use optional chaining and default fallback: `cvData?.layout?.isAtsMode === true || cvData?.layout?.type === '1-column'`. |
| **Language Switch While Modal is Open** | Stale prompt IDs or prompt descriptions. | `localizedPrompts` and `selectedPrompt` are memoized on `[activeLanguage, selectedPromptId]`. If `selectedPromptId` is not found, it cleanly defaults to `localizedPrompts[0]`. |

---

## 9. Conclusion & Implementation Recommendations

1. **`AIExportModal.jsx` Refactor**:
   - Replace `const [layoutMode, setLayoutMode] = useState('1-column')` with dynamic `isAtsMode` detection.
   - Lock `selectedFormat` to `'markdown'`.
   - Add `userCommentary` state and textarea above preview.
   - Keep `jobDescription` textarea conditionally gated for `job_matcher`.
   - Connect both inputs into `buildAIPromptPayload`.
2. **`buildAIPromptPayload` in `aiExporter.js`**:
   - Support `options.userCommentary` / `options.user_commentary`.
   - Assemble payload in strict sequence: `role`, `task`, `output_format`, `user_commentary` (if present), `job_description` (if applicable), followed by the formatted Markdown.
3. **Testing**:
   - Create `src/tests/aiExportModal.test.jsx` covering the 15 test cases detailed in Section 7.
