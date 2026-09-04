# Architectural Survey & Implementation Blueprint: Epic 2 — Rich Inline Text Editing Toolbar with Persistent State

## Executive Summary
This report presents the architectural analysis and implementation blueprint for **Epic 2: Rich Inline Text Editing Toolbar with Persistent State** for the Ressume CV editor. It details:
1. The limitations of the current `InlineEdit.jsx` implementation and its touchpoints across all 13 CV section/item renderers.
2. The optimal state representation (sanitized HTML string with inline formatting and block alignment) that guarantees 100% backward and forward schema compatibility, zero data corruption in `localStorage`, and flawless integration with `translationEngine.js` and `itemAdapter.js`.
3. A singleton floating formatting toolbar architecture with dynamic bounding rectangle tracking strictly conforming to **AGENTS.md Rule 3**, viewport flipping, vertical clamping, focus-preserving `mousedown` handlers, and full keyboard shortcut parity (Ctrl+B, Ctrl+I, Ctrl+Z, Ctrl+Shift+Z / Ctrl+Y, Ctrl+X, Ctrl+C, Ctrl+V).
4. A unified cross-engine rendering strategy ensuring bold, italic, and text alignment render identically in:
   - The live DOM editor (`#area-cv`)
   - The existing iframe print engine (`staticHtmlPdfEngine.js`)
   - The new client-side `@react-pdf/renderer` engine (Epic 1)
5. Comprehensive mitigation for all edge cases: empty strings, external rich-text pasting contamination, selection loss, and CVContext history integration.

---

## 1. Observation

### 1.1 Current Inline Editing Implementation (`src/components/Editor/InlineEdit.jsx`)
Direct inspection of `src/components/Editor/InlineEdit.jsx` (lines 1–82) reveals:
- **Element switching**: The component toggles between a plain `<span>` (when `!isEditing`) and a native `<input type="text">` or `<textarea>` (when `isEditing`):
  ```jsx
  // src/components/Editor/InlineEdit.jsx:62-78
  if (isEditing) {
    return multiline ? (
      <textarea {...commonProps} style={{ resize: 'none', overflow: 'hidden', width: '100%', minHeight: '1.5em' }} />
    ) : (
      <input type="text" {...commonProps} />
    );
  }

  return (
    <span 
      onClick={() => setIsEditing(true)} 
      className={className} 
      style={{ cursor: 'pointer', display: 'inline-block', minWidth: '20px', minHeight: '1em' }}
    >
      {value || finalPlaceholder}
    </span>
  );
  ```
- **Plain text constraint**: Native `<input>` and `<textarea>` elements accept only plain text characters. They cannot render bold (`<b>`) or italic (`<i>`) text within their input view. If an HTML string like `"<b>Developer</b>"` is supplied, `<input>` displays the raw literal tags `"<b>Developer</b>"`.
- **React string escaping in display mode**: In the display mode `<span>`, React evaluates `{value || finalPlaceholder}` as text, automatically HTML-escaping any tags. Thus, formatting tags cannot be visually displayed in the unedited state.
- **Local state synchronization**: `InlineEdit` tracks `currentValue` in local component state (`useState(value)`). The parent `onSave(currentValue)` callback is only invoked upon `handleBlur` (blur event) or Enter key (`!multiline`).
- **No formatting toolbar or alignment support**: There is no floating toolbar, no text-alignment selector, and no support for Ctrl+B or Ctrl+I toggles.

### 1.2 Touchpoint Inventory Across All CV Renderers
`InlineEdit` is used in exactly **15 component files** across the codebase:
1. `src/components/CV/CVHeader.jsx`: `profile.name`, `profile.subtitle`, `profile.location`, `profile.email`, `profile.phone`, `profile.linkedin`, `profile.github`, `profile.description` (multiline).
2. `src/components/CV/BaseSection.jsx`: `section.title` (line 96).
3. `src/components/CV/items/ProfileHeaderItem.jsx`: Contact fields (`name`, `subtitle`, `location`, `email`, `phone`, `linkedin`, `github`).
4. `src/components/CV/items/AboutItem.jsx`: `item.description` (multiline).
5. `src/components/CV/items/ExperienceItem.jsx`: `item.title`, `item.date`, `item.subtitle`, `item.description` (multiline), and bullet items.
6. `src/components/CV/items/ProjectsItem.jsx`: `item.title`, `item.date`, `item.subtitle`, `item.description` (multiline), bullet items.
7. `src/components/CV/items/EducationItem.jsx`: `item.title`, `item.subtitle`, `item.date`.
8. `src/components/CV/items/SkillsItem.jsx`: `item.title`, `item.description`.
9. `src/components/CV/items/SimpleListItem.jsx`: `item.text`.
10. `src/components/CV/items/CertificatesItem.jsx`: `item.title`, `item.date`, `item.subtitle`, `item.credentialId`.
11. `src/components/CV/items/LanguagesItem.jsx`: `item.title`, `item.subtitle`, `item.description`.
12. `src/components/CV/items/AwardsItem.jsx`: `item.title`, `item.date`, `item.subtitle`, `item.description`.
13. `src/components/CV/items/PublicationsItem.jsx`: `item.title`, `item.date`, `item.subtitle`, `item.description`.
14. `src/components/CV/items/ReferencesItem.jsx`: `item.title`, `item.subtitle`, `item.email`, `item.phone`, `item.relationship`.
15. `src/components/CV/items/VolunteeringItem.jsx`: `item.title`, `item.date`, `item.subtitle`, `item.description`, bullet items.

**Observation on Calling Convention**: Every single item renderer calls `InlineEdit` with the exact same signature:
`<InlineEdit value={item.fieldName || ''} onSave={(val) => onUpdateItem(sectionId, item.id, 'fieldName', val)} multiline={...} />`
This invariant enables backward-compatible drop-in enhancement of `InlineEdit.jsx` without altering any of the 13 item components.

### 1.3 State Management & History (`src/context/CVContext.jsx`)
- **State persistence**: `cvData` is stored in React state and synchronized to `localStorage.setItem('cvData', JSON.stringify(cvData))` via `useEffect` (lines 132–134).
- **History stacks**: Undo and redo are managed via `past` and `future` state arrays capped at 30 entries (lines 161–171).
- **Window keydown listener**: Lines 206–227 register a global `window` keydown listener for Ctrl+Z and Ctrl+Y / Ctrl+Shift+Z:
  ```javascript
  // src/context/CVContext.jsx:206-224
  const handleKeyDown = (e) => {
    const isMac = typeof navigator !== 'undefined' && navigator.platform?.toUpperCase().indexOf('MAC') >= 0;
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
    if (!cmdOrCtrl) return;

    const isUndo = e.key.toLowerCase() === 'z' && !e.shiftKey;
    const isRedo = e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z');

    if (isUndo && past.length > 0) {
      e.preventDefault();
      undo();
    } else if (isRedo && future.length > 0) {
      e.preventDefault();
      redo();
    }
  };
  ```
  *Critical Observation*: The listener does not check whether `e.target` is an editable element (`contentEditable`, `INPUT`, or `TEXTAREA`). If a user presses Ctrl+Z while typing in a field, the window listener intercepts it, cancels default browser behavior, and rolls back the entire `cvData` state.

### 1.4 Translation & Polymorphic Adapters
- `src/utils/translationEngine.js`: Already includes explicit guidance for LLM translation (lines 140–141):
  ```
  3. HTML & FORMATTING INTEGRITY:
     - If a string contains HTML tags like <br>, <b>, or <strong>, PRESERVE them exactly in the translated string.
  ```
  The translation engine already anticipates HTML tags embedded in text strings.
- `src/utils/itemAdapter.js`: Contains functions (`adaptItemToSectionType`) that access string fields directly (`src.title || src.name || src.text`). If text were converted into complex objects (e.g. `{ text: '...', format: [] }`), all polymorphic item conversions would break.

### 1.5 Static HTML PDF Engine (`src/utils/staticHtmlPdfEngine.js`)
- `escapeHTML` (lines 15–23):
  ```javascript
  export const escapeHTML = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
  ```
- Every text field in `renderItemHTML` and `renderSectionHTML` is passed through `escapeHTML(item.fieldName)`.
- If an HTML formatted string (e.g. `<b>Software Engineer</b>`) is passed to `escapeHTML`, it becomes `&lt;b&gt;Software Engineer&lt;/b&gt;`, causing the printed PDF to render literal tag strings instead of bold text.

---

## 2. Logic Chain

### 2.1 State Representation Selection (HTML String vs Structured JSON vs Markdown)
- **Step 1 (Rejecting Structured Objects)**:
  - If field values were altered from `string` to an object (e.g. `{ text: "...", boldRanges: [...], align: "center" }`), this would mutate the schema defined in `src/utils/schema.js`.
  - Every existing user session with `cvData` in `localStorage` would throw runtime TypeError crashes when executing `.toLowerCase()`, `.split()`, or `.trim()`.
  - `src/utils/itemAdapter.js` and `src/utils/translationEngine.js` would fail when extracting dictionary keys.
  - Therefore, structured objects must NOT be used for field values.
- **Step 2 (Rejecting Markdown)**:
  - Markdown lacks standard syntax for text alignment (`text-align: left | center | right | justify`).
  - Representing alignment in Markdown requires injecting raw HTML (`<div align="...">`) or custom non-standard delimiters.
  - Converting back and forth between DOM mutations and Markdown strings introduces edge-case serialization anomalies.
  - Therefore, pure Markdown is unsuitable.
- **Step 3 (Selecting Sanitized HTML String with Inline Formatting and Block Alignment)**:
  - An HTML string (e.g., `"<div style=\"text-align: center\"><b>Senior</b> Software Engineer</div>"` or `<b>Senior</b> Software Engineer`) is natively a JavaScript string.
  - It maintains 100% backward compatibility: existing plain strings without tags (e.g., `"San Miguel de Tucumán"`) are valid HTML plain text.
  - It serializes cleanly to JSON and `localStorage` without any schema migrations.
  - Both inline formatting (`<b>`, `<strong>`, `<i>`, `<em>`, `<u>`) and block alignment (`style="text-align: left|center|right|justify"`) are captured within the string itself.
  - `translationEngine.js` already explicitly supports strings containing `<b>` and `<strong>`.

### 2.2 In-Place Rich Text Editing Engine (`contentEditable`)
- **Step 1 (Why `contentEditable` is required)**:
  - Native `<input>` and `<textarea>` cannot render rich text styling inside their viewport.
  - In a CV builder, WYSIWYG fidelity is essential: the user must see the bold weights, italic angles, font scales, line-heights, and exact alignment while typing.
  - `contentEditable="true"` elements inherit the surrounding CSS variables (`--body-font`, `--font-scale`, `--title-h1-size`, `--text-color`) and allow native browser inline styling.
- **Step 2 (Preventing React `contentEditable` Cursor Jumping)**:
  - In React, binding `contentEditable` to state via `dangerouslySetInnerHTML` triggers a DOM rebuild on every keystroke, causing the caret to reset to position 0.
  - Solution: Use an uncontrolled `contentEditable` with an `innerRef`.
  - The DOM node is initialized with the initial HTML.
  - As the user types, an `onInput` handler updates an internal mutable ref (`contentRef.current = el.innerHTML`). React does NOT re-render the innerHTML during typing.
  - On `blur`, the component compares `contentRef.current` with `value` and calls `onSave(cleanedHTML)` only if changed.
  - When external changes occur (e.g. global Undo/Redo or prop updates while not focused), the DOM node's `innerHTML` is synchronized via `useEffect`.

### 2.3 Floating Formatting Toolbar Positioning (AGENTS.md Rule 3 Compliance)
- **Step 1 (Rule 3 Requirements)**:
  - Popovers and tooltips must dynamically track `getBoundingClientRect()` of the active element.
  - They must flip to the opposite side when approaching viewport boundaries.
  - They must be clamped vertically to prevent escaping `window.innerHeight`.
- **Step 2 (Preventing Text Obscuration)**:
  - If the toolbar is placed directly on top of the text, the user cannot see what they are typing.
  - The toolbar must float directly above the active text element (`top = rect.top - TOOLBAR_HEIGHT - 8px`).
  - If `rect.top - TOOLBAR_HEIGHT - 8px < 10px` (element is near the top of the viewport), the toolbar dynamically flips below the element: `top = rect.bottom + 8px`.
  - Horizontally, the toolbar aligns with `rect.left`. If `rect.left + TOOLBAR_WIDTH > window.innerWidth - 16px`, it shifts left to `window.innerWidth - TOOLBAR_WIDTH - 16px`. If `rect.left < 16px`, it clamps to `16px`.
  - Alternatively, in wide viewports on centered/two-column paper, the toolbar can also dock adjacent to the active container (`left = rect.right + 20px`, flipping to `rect.left - TOOLBAR_WIDTH - 20px` when approaching `window.innerWidth`), mirroring `SuggestionTooltip.jsx`.
- **Step 3 (Focus Retention via `mousedown` Prevention)**:
  - When clicking toolbar buttons (Bold, Italic, Alignment), the default browser behavior transfers focus from the `contentEditable` element to the button, destroying `window.getSelection()`.
  - Solution: Apply `onMouseDown={(e) => e.preventDefault()}` on all toolbar buttons and containers. This prevents focus blur, preserves the text selection range, and allows `document.execCommand` or range formatting to execute on the active selection.

### 2.4 Cross-Engine Rendering Pipeline
- **Live DOM Editor**:
  - `InlineEdit` displays formatted HTML safely using `dangerouslySetInnerHTML={{ __html: sanitize(value) }}` with CSS `textAlign` applied.
- **Static HTML PDF Engine (`src/utils/staticHtmlPdfEngine.js`)**:
  - Create a sanitized rich-text formatter: `renderRichHTML(str)`.
  - It strips dangerous tags (`<script>`, `<iframe>`, `on*` attributes) to preserve XSS security and maintain compatibility with existing tests (`F11.4` and `T2.4`).
  - It preserves safe tags: `<b>`, `<strong>`, `<i>`, `<em>`, `<u>`, `<span>`, `<div>`, `<p>`, `<br>`, and safe `style="text-align: (left|center|right|justify)"`.
  - In `renderItemHTML`, replace `escapeHTML(item.title)` with `renderRichHTML(item.title)`.
  - Browsers rendering the print iframe natively output 100% vector typography with accurate bold, italic, and alignment.
- **Client-Side `@react-pdf/renderer` Engine (Epic 1)**:
  - `@react-pdf/renderer` does NOT accept raw HTML strings in its `<Text>` elements.
  - Implement a lightweight parser `parseHtmlToTokens(htmlString)` using the browser's native `DOMParser`.
  - The parser extracts:
    1. Overall block alignment: `align = 'left' | 'center' | 'right' | 'justify'` from `style="text-align: ..."`.
    2. An array of text tokens: `[{ text: "...", bold: boolean, italic: boolean }]`.
  - Render as nested `@react-pdf/renderer` components:
    ```jsx
    <Text style={{ ...baseStyle, textAlign: align }}>
      {tokens.map((token, i) => (
        <Text
          key={i}
          style={{
            fontWeight: token.bold ? 'bold' : (baseStyle.fontWeight || 'normal'),
            fontStyle: token.italic ? 'italic' : (baseStyle.fontStyle || 'normal')
          }}
        >
          {token.text}
        </Text>
      ))}
    </Text>
    ```

---

## 3. Caveats

1. **`document.execCommand` Deprecation vs Universality**:
   - `document.execCommand('bold')` and `document.execCommand('italic')` are technically marked deprecated in W3C specs, but they remain universally supported across all modern evergreen browsers (Chrome, Firefox, Safari, Edge) and provide the cleanest inline formatting without heavy dependencies. A fallback range-wrapping helper should be included for defensive resilience.
2. **Clipboard Pasting Complexity**:
   - Pasting from Google Docs, Microsoft Word, or rich web pages brings deeply nested XML/CSS schemas (`<span style="font-family: Calibri; font-size: 11pt; color: #333333">`).
   - If not aggressively sanitized on `paste`, foreign typography tokens will corrupt the CV's curated CSS variables. Pasting must be intercepted and stripped down to pure text or minimal `<b>`/`<i>` tags.
3. **Global Undo vs In-Field Undo**:
   - While actively editing an `InlineEdit` field, pressing Ctrl+Z should undo local keystrokes inside the field (via browser native undo).
   - Only after an edit is saved (`handleBlur` / `onSave`) should global Ctrl+Z revert previous state snapshots in `CVContext`.
   - The keydown listener in `CVContext.jsx` must be adjusted so it does not hijack Ctrl+Z while an editable field is focused.
4. **Zero Font Size Glitches in `@react-pdf/renderer`**:
   - In `@react-pdf/renderer`, font families must be registered with their explicit weights (e.g. Poppins-Regular, Poppins-Bold, Poppins-Italic). If a font family does not have a bold font registered, `@react-pdf/renderer` will throw an error or fail to simulate faux-bold. Epic 1 font registration must include bold and italic font faces for all curated fonts (Poppins, Inter, Roboto, Merriweather, JetBrains Mono).

---

## 4. Conclusion & Complete Architectural Blueprint

### 4.1 Component Architecture Map

```
┌────────────────────────────────────────────────────────────────────────┐
│ App.jsx                                                                │
│  ├── ActionMenu.jsx                                                    │
│  ├── FormattingToolbar.jsx (Global Singleton Floating Toolbar)         │
│  │     └── Dynamically positioned near active InlineEdit (Rule 3)       │
│  ├── SuggestionTooltip.jsx (Rule 3 Singleton AI Callouts)             │
│  └── #area-cv                                                          │
│        ├── DroppableColumn (left)                                      │
│        │     └── BaseSection -> BaseItem -> [ItemComponent]            │
│        │           └── InlineEdit.jsx (contentEditable)                │
│        └── DroppableColumn (right)                                     │
│              └── BaseSection -> BaseItem -> [ItemComponent]            │
│                    └── InlineEdit.jsx (contentEditable)                │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Module Specifications

#### Module A: `src/components/Editor/FormattingToolbar.jsx`
- **Role**: Global singleton toolbar mounted in `App.jsx`.
- **Visibility**: Rendered when `activeEditingField !== null`.
- **Positioning**:
  Tracks `activeEditingField.rect` with `position: fixed`.
  - `top`: `rect.top - 44px`. If `< 10px`, flips to `rect.bottom + 8px`. Clamped to `window.innerHeight - 50px`.
  - `left`: `rect.left`. Clamped between `16px` and `window.innerWidth - TOOLBAR_WIDTH - 16px`.
  - Re-anchors on `window.scroll` and `window.resize`.
- **Buttons**:
  - **Bold** (`Bold` icon): toggles bold on selection (`activeField.toggleBold()`).
  - **Italic** (`Italic` icon): toggles italic on selection (`activeField.toggleItalic()`).
  - **Separator**
  - **Align Left** (`AlignLeft` icon): sets field alignment to `'left'`.
  - **Align Center** (`AlignCenter` icon): sets field alignment to `'center'`.
  - **Align Right** (`AlignRight` icon): sets field alignment to `'right'`.
  - **Align Justify** (`AlignJustify` icon): sets field alignment to `'justify'`.
  - **Separator**
  - **Undo** (`Undo2` / `RotateCcw` icon): triggers field undo.
  - **Redo** (`Redo2` / `RotateCw` icon): triggers field redo.
- **Invariant**: All buttons have `onMouseDown={(e) => e.preventDefault()}` to preserve focus on the active `InlineEdit`.

#### Module B: Enhanced `src/components/Editor/InlineEdit.jsx`
- **Role**: In-place rich-text editable component.
- **Props**: `{ value, onSave, multiline = false, className = '', placeholder }`.
- **Internal States & Refs**:
  - `isEditing`: boolean.
  - `elementRef`: DOM ref to `contentEditable` container.
  - `currentAlignment`: extracted from `value` (`'left' | 'center' | 'right' | 'justify'`).
- **Focus & Toolbar Registration**:
  - On `focus` / `click`: computes bounding rect, registers with global toolbar context/state:
    `openToolbar({ rect, toggleBold, toggleItalic, setAlignment, isBold, isItalic, currentAlignment, undo, redo })`.
  - Listens to document `selectionchange` to dynamically update bold/italic toggle states in the toolbar.
- **Input & Save Flow**:
  - On `input`: records innerHTML to local ref.
  - On `blur`: removes toolbar, cleans up empty artifacts (`<br>`, `<div></div>`), and calls `onSave(cleanedHTML)` if value changed.
  - Single-line fields (`!multiline`): intercepts Enter key, calls `e.preventDefault()`, and triggers blur.
  - Multiline fields (`multiline=true`): allows Enter (inserts `<br>`).
  - Escape key: cancels edits, restores initial `value`, and blurs.
- **Clipboard Sanitization**:
  - Intercepts `paste` event.
  - Strips all attributes, fonts, and script tags, retaining only plain text and simple `<b>`/`<i>` tags.

#### Module C: Shared Rich-Text Utilities (`src/utils/richTextEngine.js`)
Create a dedicated utility module containing:
1. `sanitizeRichHTML(htmlString)`:
   - Sanitizes arbitrary HTML using a strict tag whitelist: `<b>`, `<strong>`, `<i>`, `<em>`, `<u>`, `<span>`, `<div>`, `<p>`, `<br>`.
   - Allows only `style="text-align: (left|center|right|justify)"`.
   - Strips `<script>`, `<iframe>`, `javascript:`, and all `on*` event handlers.
2. `extractAlignment(htmlString)`:
   - Regex/DOM extraction: matches `text-align:\s*(left|center|right|justify)`. Defaults to `'left'`.
3. `applyAlignmentToHTML(htmlString, align)`:
   - Sets or wraps the content with `style="text-align: ${align}"`.
4. `parseHtmlToTokens(htmlString)`:
   - Client-side DOMParser tokenizer returning `{ align, segments: [{ text, bold, italic }] }` for consumption by `@react-pdf/renderer`.

#### Module D: Cross-Engine Updates
1. **`src/utils/staticHtmlPdfEngine.js`**:
   - Update `renderItemHTML` and `renderSectionHTML`:
   - Replace raw `escapeHTML(item.title)` with `renderRichHTML(item.title)`.
   - Plain text without tags continues to be escaped normally; tags like `<b>`, `<i>`, and `style="text-align: ..."` are preserved.
   - Preserves 100% vector printing in the iframe without editor controls.
2. **`@react-pdf/renderer` Engine (Epic 1 Integration)**:
   - Export `<RichTextPdf content={item.title} style={pdfStyles.title} />`.
   - Consumes `parseHtmlToTokens` to render nested `<Text>` elements with `fontWeight: 'bold'`, `fontStyle: 'italic'`, and `textAlign`.

#### Module E: History Coordination in `src/context/CVContext.jsx`
- In `CVContext.jsx`, update the window `keydown` listener (lines 206–227):
  ```javascript
  const handleKeyDown = (e) => {
    const isMac = typeof navigator !== 'undefined' && navigator.platform?.toUpperCase().indexOf('MAC') >= 0;
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
    if (!cmdOrCtrl) return;

    // Check if user is currently typing in an editable field
    const activeEl = document.activeElement;
    const isEditable = activeEl && (
      activeEl.isContentEditable || 
      activeEl.tagName === 'INPUT' || 
      activeEl.tagName === 'TEXTAREA'
    );

    const isUndo = e.key.toLowerCase() === 'z' && !e.shiftKey;
    const isRedo = e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z');

    // If focused on an editable element, let browser native undo handle in-field typing
    if (isEditable && (isUndo || isRedo)) {
      return;
    }

    if (isUndo && past.length > 0) {
      e.preventDefault();
      undo();
    } else if (isRedo && future.length > 0) {
      e.preventDefault();
      redo();
    }
  };
  ```
  This guarantees seamless local undo while typing, while preserving global state undo when outside fields or triggered from the toolbar!

---

## 5. Verification Method

To independently verify the implementation when built:

### 5.1 Automated Test Plan (Vitest)
Create `src/tests/rich-inline-edit.test.jsx` covering:
1. **Toolbar Mounting & Positioning (AGENTS.md Rule 3)**:
   - Focusing an `InlineEdit` mounts `FormattingToolbar`.
   - Tooltip style tracks `getBoundingClientRect()`.
   - Verify top/bottom flip when `rect.top < 50px`.
   - Verify left clamp when `rect.right > window.innerWidth`.
2. **Formatting Actions & Selection Retention**:
   - Clicking the Bold button executes `toggleBold` without causing `InlineEdit` to blur.
   - Text selection is preserved.
   - Selecting 'center' alignment applies `text-align: center` and updates state.
3. **State Persistence in `cvData` & `localStorage`**:
   - Editing a field with bold text and saving updates `cvData` and writes valid JSON to `localStorage`.
   - Reloading state preserves `<div style="text-align: center"><b>...</b></div>`.
   - Existing plain string fields in `defaultSchema` load without errors.
4. **Cross-Engine Verification**:
   - `generateCleanPrintHTML(cvDataWithRichText)` preserves `<b>`, `<i>`, and `style="text-align: center"` while containing zero interactive artifacts.
   - `parseHtmlToTokens` returns correct tokens for `@react-pdf/renderer` rendering.
   - XSS test: `<script>alert(1)</script>` in rich text is neutralized and does not execute.
5. **Shortcuts & History**:
   - Ctrl+B and Ctrl+I toggle formatting.
   - Global Ctrl+Z reverts state only when not editing, or after blur.

### 5.2 Manual Verification Steps
1. Start development server: `npm run dev`.
2. Click any experience title (e.g. "Desarrollador Web Full-Stack"). Observe floating toolbar appear directly above the title without obscuring it.
3. Select the word "Full-Stack" with mouse or keyboard. Click the **B** button on the toolbar or press **Ctrl+B**. Verify "Full-Stack" turns bold immediately.
4. Click the **AlignCenter** button. Verify title aligns to the center of the block.
5. Click outside the field. Inspect `localStorage.getItem('cvData')` in DevTools Application tab. Confirm the formatted HTML string is saved.
6. Refresh the browser page. Confirm the bold styling and center alignment persist.
7. Click "Imprimir / Guardar PDF". Inspect print preview: confirm "Full-Stack" is bold, centered, and 100% selectable vector text.
8. Switch language to English via ActionMenu. Confirm `translationEngine.js` retains formatting tags.
9. Test undo: press Ctrl+Z. Verify the edit is cleanly reverted.
