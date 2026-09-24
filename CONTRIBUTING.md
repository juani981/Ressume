# Contributing to Ressume

> **Read `AGENTS.md` first.** It contains hard invariants that override
> everything else in this file. Violations will cause test failures or
> immediate rejection.

---

## Table of Contents

1. [Philosophy](#1-philosophy)
2. [Project Setup](#2-project-setup)
3. [Architecture Quick Map](#3-architecture-quick-map)
4. [Adding a New Section Type](#4-adding-a-new-section-type)
5. [Adding a New Language / Locale](#5-adding-a-new-language--locale)
6. [Adding a New AI Prompt](#6-adding-a-new-ai-prompt)
7. [Adding a New Editor Component](#7-adding-a-new-editor-component)
8. [Adding a New AI Knowledge Rule (Suggestion)](#8-adding-a-new-ai-knowledge-rule-suggestion)
9. [Database / Storage Abstraction (Future Migration)](#9-database--storage-abstraction-future-migration)
10. [PDF Engine — What You Can and Cannot Change](#10-pdf-engine--what-you-can-and-cannot-change)
11. [Drag & Drop — How to Extend It](#11-drag--drop--how-to-extend-it)
12. [Testing Guidelines](#12-testing-guidelines)
13. [Submitting a Pull Request](#13-submitting-a-pull-request)
14. [Hard Rules Summary](#14-hard-rules-summary)

---

## 1. Philosophy

Ressume is **opinionated by design**. The goal is to give the user
maximum value with minimum cognitive load. Every contribution must make
the system simpler for the user, not more complex.

| Principle | Rule |
|-----------|------|
| **Open/Closed** | Extend behavior by adding files. Never add `if (type === ...)` chains to core templates. |
| **Single Source of Truth** | `src/registry/sectionRegistry.js` is the single place that knows about section types. |
| **Zero PDF Drift** | Every visual change in the editor must be reflected 1:1 in the exported PDF. |
| **Markdown-as-Truth** | The AI abstraction layer must describe the CV exactly as the user sees it, no more, no less. |
| **No Premature Abstraction** | Don't add layers "for the future". Add them when the second use case arrives. |

---

## 2. Project Setup

```bash
# Prerequisites: Node 18+, npm 9+
git clone https://github.com/juani981/Ressume
cd Ressume
npm install

# Development server (hot reload)
npm run dev             # http://localhost:5173

# Test suite
npm test                # Run all tests once
npm run test:watch      # Watch mode

# Production build
npm run build           # Output to dist/
```

**Tech stack:**
- **React 18** + **Vite 5** — SPA, no SSR
- **Vitest** + **@testing-library/react** — Unit & integration tests (jsdom)
- **@dnd-kit** — Drag & drop (never substitute with another library)
- **lucide-react** — All icons (never import from any other icon library)
- **CSS Variables** — Theming (no CSS-in-JS library, no Tailwind)
- **localStorage** — Primary storage (no backend required)

---

## 3. Architecture Quick Map

```
src/
├── App.jsx                      ← Top-level orchestrator (DnD provider, column layout)
├── context/
│   ├── CVContext.jsx            ← Facade: exposes useCV() with 48-member public API
│   └── hooks/
│       ├── useCVData.js         ← CRUD: sections, items, profile, i18n
│       ├── useCVHistory.js      ← Undo / Redo stack
│       ├── useCVLayout.js       ← Layout modes, column sizes, typography
│       └── useCVExport.js       ← PDF export, toast notifications
├── hooks/
│   ├── usePaginationEngine.js   ← A4 page break calculation (ResizeObserver)
│   ├── useCVDndCoordinator.js   ← @dnd-kit event handling
│   ├── useColumnResizer.js      ← Column width drag-resize
│   └── useBlankPageCleaner.js   ← Reactive blank page elimination
├── registry/
│   ├── sectionRegistry.js       ← Factory + Strategy: ALL section types registered here
│   └── itemFormatters.js        ← Markdown/XML/PlainText renderers for each section type
├── components/
│   ├── CV/
│   │   ├── BaseSection.jsx      ← Template: renders any section from registry descriptor
│   │   ├── BaseItem.jsx         ← Template: renders any item from registry descriptor
│   │   ├── SortableBulletItem.jsx ← Shared bullet item (DnD-capable)
│   │   └── items/               ← Item-level presentation components
│   │       ├── ExperienceItem.jsx
│   │       ├── EducationItem.jsx
│   │       ├── ProjectsItem.jsx
│   │       ├── SkillsItem.jsx
│   │       ├── VolunteeringItem.jsx
│   │       ├── LanguagesItem.jsx
│   │       ├── CertificatesItem.jsx
│   │       ├── SimpleListItem.jsx
│   │       ├── SpacerBlock.jsx
│   │       ├── ProfileHeaderItem.jsx
│   │       └── MentoringItem.jsx    ← Extensibility smoke-test / example
│   └── Editor/                  ← UI controls (modals, toolbars, overlays)
│       ├── AIExportModal.jsx    ← AI prompt generator modal
│       ├── VersionManagerModal.jsx
│       ├── TranslationModal.jsx
│       ├── InlineEdit.jsx       ← Mandatory for all editable text
│       ├── DragHandle.jsx
│       ├── ActionMenu.jsx
│       └── ...
├── utils/
│   ├── schema.js                ← defaultSchema: canonical data shape
│   ├── pageGeometry.js          ← A4 ruler, bounding boxes, forbidden zones
│   ├── paginationEngine.js      ← Multi-pass A4 break algorithm
│   ├── staticHtmlPdfEngine.js   ← Generates clean HTML for browser print
│   ├── aiExporter.js            ← CV → Markdown / AI payload builder
│   ├── versionStorage.js        ← localStorage CRUD for named snapshots
│   ├── versionValidator.js      ← Sanitize & validate cvData snapshots
│   ├── translationEngine.js     ← Dictionary extraction + translation prompt
│   ├── richTextEngine.js        ← Sanitize & render HTML rich text
│   ├── colorUtils.js            ← YIQ contrast, dynamic CSS variables
│   ├── typographyUtils.js       ← CSS typography token computation
│   ├── dndUtils.js              ← isNonDraggableTarget, containerDragListeners
│   ├── contactTypes.js          ← Contact field normalization
│   ├── bulletStyles.js          ← Bullet style variants
│   ├── thumbnailGenerator.js    ← SVG thumbnail for Version Manager
│   ├── itemAdapter.js           ← Re-exports from sectionRegistry
│   └── disableNativeTooltips.js ← Suppresses browser native tooltips
├── locales/
│   ├── index.js                 ← LOCALES map + getContent/getPrompts/getUI/getRules
│   ├── es/
│   │   ├── content.json         ← Default CV content in Spanish
│   │   ├── prompts.json         ← AI prompt catalog (ES)
│   │   ├── rules.json           ← Validation/grammar rules (ES)
│   │   └── ui.json              ← UI string labels (ES)
│   └── en/
│       ├── content.json
│       ├── prompts.json
│       ├── rules.json
│       └── ui.json
├── ai-knowledge/
│   ├── index.js                 ← getAISuggestions() query function
│   ├── prompts.json             ← AI prompt catalog (master copy)
│   ├── tech.json                ← Suggestions for Tech industry
│   ├── ats.json                 ← Suggestions for ATS compliance
│   ├── human.json               ← Suggestions for human recruiters
│   ├── business.json            ← Suggestions for Business profiles
│   └── creative.json            ← Suggestions for Creative profiles (reserved)
├── styles/
│   └── print.css                ← Print-only CSS (NEVER import in editor)
└── tests/
    └── *.test.{js,jsx}          ← 46 test suites, 797 tests
```

---

## 4. Adding a New Section Type

**This is the most common contribution.** The architecture uses the
Open/Closed Principle: adding a type = adding files, never modifying
core templates.

### Step-by-step

**Step 1: Create the item component**

```bash
# Create: src/components/CV/items/MyNewItem.jsx
```

```jsx
// src/components/CV/items/MyNewItem.jsx
import React from 'react';
import InlineEdit from '../../Editor/InlineEdit';

// PrintView: renders in PDF/print mode (no interactive controls)
const PrintView = ({ item }) => (
  <div className="experience__content">
    <h3 className="experience__title">{item.title || ''}</h3>
    {item.description && <p>{item.description}</p>}
  </div>
);

// EditView: renders in editor mode with InlineEdit controls
const EditView = ({ item, sectionId, isPrint, onUpdate }) => {
  const handleUpdate = (field, value) =>
    onUpdate(sectionId, item.id, { [field]: value });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <InlineEdit
        value={item.title || ''}
        onSave={(v) => handleUpdate('title', v)}
        isPrint={isPrint}
        placeholder="Title..."
      />
      <InlineEdit
        value={item.description || ''}
        onSave={(v) => handleUpdate('description', v)}
        isPrint={isPrint}
        multiline
        placeholder="Description..."
      />
    </div>
  );
};

// Main component: switches between PrintView and EditView
const MyNewItem = ({ item, sectionId, isPrint = false, onUpdate }) => {
  if (isPrint) return <PrintView item={item} />;
  return (
    <EditView
      item={item}
      sectionId={sectionId}
      isPrint={isPrint}
      onUpdate={onUpdate}
    />
  );
};

export default MyNewItem;
```

**Step 2: Register the section type**

Add to `src/registry/sectionRegistry.js` (inside the `standardDescriptors` array
or as a standalone `registerSectionType()` call at the bottom):

```js
// src/registry/sectionRegistry.js — add at the bottom OR in standardDescriptors[]
import MyNewItem from '../components/CV/items/MyNewItem';

registerSectionType({
  type: 'my_new_type',
  defaultTitle: 'My New Section',
  sectionClass: 'experience',        // Reuse existing CSS class or add new
  containerTag: 'div',
  containerClass: 'experience__container bd-grid',
  itemTag: 'div',
  itemClass: 'experience__content',
  hasTitle: true,
  hasItemDrag: true,
  allowDelete: true,
  allowAddItem: true,
  allowDeleteItem: true,
  supportsBulletCustomization: false,
  itemComponent: MyNewItem,
  createDefaultItem: () => ({
    id: `mynew_${Date.now()}`,
    title: 'New Entry',
    description: '',
  }),
  adaptItem: (item) => ({
    id: item.id || `mynew_${Date.now()}`,
    title: item.title || item.name || '',
    description: item.description || '',
  }),
  renderMarkdown: (item) =>
    `### ${item.title || ''}\n${item.description || ''}`,
  renderXML: (item) =>
    `<entry><title>${item.title || ''}</title><description>${item.description || ''}</description></entry>`,
  renderPlainText: (item) =>
    `${item.title || ''}\n${item.description || ''}`,
});
```

**Step 3: Done.** No changes to `App.jsx`, `BaseSection.jsx`, `BaseItem.jsx`,
or `CVContext.jsx` are required.

**Step 4: Add tests**

```js
// src/tests/myNewSection.test.jsx
import { describe, it, expect } from 'vitest';
import { getSectionDescriptor } from '../registry/sectionRegistry';

describe('my_new_type registry descriptor', () => {
  const descriptor = getSectionDescriptor('my_new_type');

  it('is registered', () => expect(descriptor).toBeDefined());
  it('has required fields', () => {
    expect(descriptor.type).toBe('my_new_type');
    expect(descriptor.itemComponent).toBeDefined();
    expect(typeof descriptor.createDefaultItem).toBe('function');
    expect(typeof descriptor.renderMarkdown).toBe('function');
  });
  it('creates a valid default item', () => {
    const item = descriptor.createDefaultItem();
    expect(item.id).toBeDefined();
    expect(typeof item.title).toBe('string');
  });
});
```

---

## 5. Adding a New Language / Locale

**Step 1: Create the locale directory**

```bash
mkdir -p src/locales/pt   # Example: Portuguese
```

**Step 2: Create the four required JSON files**

Copy from `src/locales/en/` and translate the values (never the keys):

```bash
cp src/locales/en/content.json   src/locales/pt/content.json
cp src/locales/en/prompts.json   src/locales/pt/prompts.json
cp src/locales/en/rules.json     src/locales/pt/rules.json
cp src/locales/en/ui.json        src/locales/pt/ui.json
# Then translate all string values in each file
```

**Step 3: Register in `src/locales/index.js`**

```js
// src/locales/index.js
import ptContent from './pt/content.json' with { type: 'json' };
import ptPrompts from './pt/prompts.json' with { type: 'json' };
import ptRules   from './pt/rules.json'   with { type: 'json' };
import ptUI      from './pt/ui.json'      with { type: 'json' };

export const LOCALES = {
  es: { ... },
  en: { ... },
  pt: {               // ← Add here
    content: ptContent,
    prompts: ptPrompts,
    rules:   ptRules,
    ui:      ptUI,
  }
};

export const SUPPORTED_LOCALES = [
  { code: 'es', name: 'Español',           region: 'LatAm / España',           flag: '🇪🇸' },
  { code: 'en', name: 'English (US Tech)', region: 'United States / Global Tech', flag: '🇺🇸' },
  { code: 'pt', name: 'Português (BR)',    region: 'Brasil',                    flag: '🇧🇷' }, // ← Add here
];
```

**Step 4: Done.** The `switchLanguage()` function in `useCVData.js` and the
`TranslationModal.jsx` will pick up the new locale automatically. All
`getContent()`, `getPrompts()`, `getRules()`, and `getUI()` calls fall back
to `'es'` if the locale is missing, so partial translations are safe.

**What to translate:**
- `content.json` — Default CV section titles and placeholder text
- `prompts.json` — Full AI prompt catalog (system_instruction, task, output_format)
- `rules.json` — Grammar and writing rules for the ATS suggestion engine
- `ui.json` — Button labels, modal titles, tooltip text

**What not to translate:**
- JSON keys (always English camelCase identifiers)
- Section `type` identifiers (e.g., `"experience"`, `"skills"`)
- CSS class names

---

## 6. Adding a New AI Prompt

All prompts must be added to **all three** of these files to remain in sync:

| File | Purpose |
|------|---------|
| `src/locales/es/prompts.json` | Spanish version (canonical primary) |
| `src/locales/en/prompts.json` | English version |
| `src/ai-knowledge/prompts.json` | Master copy used by `buildAIPromptPayload` |

### Prompt schema

```json
{
  "id": "unique_snake_case_id",
  "name": "Human-readable name shown in the modal dropdown",
  "category": "content_enhancement | recruiter_audit | interview_prep | localization | layout_advice | customization",
  "description": "One-sentence description shown in the info box below the selector",
  "system_instruction": "Full system role prompt (may be multi-paragraph, use \\n for newlines)",
  "task": "Numbered step-by-step task (use \\n\\n between steps)",
  "required_inputs": ["cv_abstraction"],
  "output_format": "Explicit structured rubric: ## Section 1, ## Section 2, ...",
  "target_output": "Short label for what the AI will produce"
}
```

**`required_inputs` valid values:**
- `"cv_abstraction"` — Always included; the Semantic Markdown of the CV
- `"job_description"` — Shows the Job Description textarea in the modal

**Quality bar for `output_format`:**
The `output_format` must be as specific as the `recruiter_audit` prompt
(17 explicit sections, rubric criteria, scoring dimensions). Vague strings
like `"Text"` or `""` will be rejected.

**If the prompt requires a `job_description` field:**
Add `"job_description"` to `required_inputs`. The modal will automatically
show the textarea. No component changes needed.

**Test your prompt:**

```js
// src/tests/myNewPrompt.test.js
import { describe, it, expect } from 'vitest';
import { getPrompts } from '../locales/index';

describe('my_new_prompt', () => {
  ['es', 'en'].forEach((lang) => {
    it(`exists in ${lang} locale`, () => {
      const prompts = getPrompts(lang);
      const p = prompts.find((x) => x.id === 'my_new_prompt');
      expect(p).toBeDefined();
      expect(p.output_format).toBeTruthy();
      expect(p.output_format.length).toBeGreaterThan(30);
      expect(p.system_instruction.length).toBeGreaterThan(50);
    });
  });
});
```

---

## 7. Adding a New Editor Component

All Editor-layer UI components live in `src/components/Editor/`.

### Rules

1. **Editable text uses `InlineEdit.jsx` exclusively**
   ```jsx
   // ❌ Never do this
   <p onClick={...}>{item.description}</p>

   // ✅ Always do this
   <InlineEdit
     value={item.description}
     onSave={(v) => handleUpdate('description', v)}
     isPrint={isPrint}
     multiline
   />
   ```

2. **Icons from `lucide-react` only**
   ```jsx
   // ❌ Never
   <i className="bx bx-plus" />

   // ✅ Always
   import { Plus } from 'lucide-react';
   <Plus size={16} />
   ```

3. **Obsidian Callout for alerts/suggestions**
   ```jsx
   // ✅ Danger
   <div className="obsidian-callout" style={{
     background: 'rgba(233, 49, 71, 0.1)',
     borderLeft: '4px solid rgba(233, 49, 71, 1)'
   }}>
     <div className="callout-title" style={{ display:'flex', gap:'8px', fontWeight:600 }}>
       🛑 Critical Issue
     </div>
     <div className="callout-content">...</div>
   </div>
   ```

4. **Dynamic tooltip positioning** — never fixed pixel offsets
   ```jsx
   const rect = targetRef.current.getBoundingClientRect();
   const left = rect.right + 20 > window.innerWidth - 320
     ? rect.left - 320
     : rect.right + 20;
   const top = Math.min(rect.top, window.innerHeight - tooltipHeight);
   ```

5. **No new state in `App.jsx`** — extract hooks into `src/context/hooks/`
   or `src/hooks/`. `App.jsx` should only compose; it must not grow.

6. **CSS Variables for theming** — use `var(--text-color)`, `var(--body-color)`,
   `var(--container-color)`. Never hardcode colors.

---

## 8. Adding a New AI Knowledge Rule (Suggestion)

The suggestion engine is pre-computed JSON. No LLM inference at runtime.

```json
// src/ai-knowledge/tech.json (or ats.json, human.json, business.json)
{
  "id": "tech_NNN",
  "target_section": "experience",       // "global" | "experience" | "skills" | "projects" | "education"
  "target_layout": "both",             // "ATS_1_col" | "Human_2_col" | "both"
  "target_industry": "tech",           // "all" | "tech" | "business" | "creative"
  "trigger_context": "on_edit_description", // "on_edit_description" | "url_scan" | "format_scan" | "color_select"
  "suggestion_title": "Short action-oriented title",
  "suggestion_body": "Specific, actionable advice. One or two sentences max.",
  "severity": "critical"               // "critical" | "warning" | "info"
}
```

Query it with:
```js
import { getAISuggestions } from '../ai-knowledge/index';
const suggestions = getAISuggestions('experience', 'both', 'on_edit_description', 'tech');
```

---

## 9. Database / Storage Abstraction (Future Migration)

Currently all persistence is via `localStorage`. The system is architecturally
ready for a database backend but no migration has happened yet.

### Current storage layer

| Utility | Location | What it stores |
|---------|----------|----------------|
| `versionStorage.js` | `src/utils/` | Named CV snapshots (JSON blobs) |
| `useCVData.js` | `src/context/hooks/` | Active CV state (`cvData` key) |
| `useCVData.js` | `src/context/hooks/` | Language packs (`cvLanguagePacks` key) |
| `useCVData.js` | `src/context/hooks/` | Active language code (`cvActiveLanguage` key) |

### Migration route

To migrate from `localStorage` to a backend (Supabase, Firebase, custom API):

**Step 1: Abstract the storage interface**

Create `src/utils/storageAdapter.js`:
```js
// Swap this implementation with API calls without touching consumers
export const storageAdapter = {
  async getItem(key) {
    return localStorage.getItem(key); // → API.get(`/users/me/${key}`)
  },
  async setItem(key, value) {
    localStorage.setItem(key, value); // → API.put(`/users/me/${key}`, value)
  },
  async removeItem(key) {
    localStorage.removeItem(key);     // → API.delete(`/users/me/${key}`)
  },
};
```

**Step 2: Replace calls in `useCVData.js` and `versionStorage.js`**

Only ~6 `localStorage.getItem/setItem` calls need updating. No other
file touches localStorage directly.

**Step 3: Add auth context**

Wrap `CVProvider` with an `AuthProvider` and conditionally enable the
persistent backend. The `CVProvider` already accepts an `initialCV` prop,
which can be the document fetched from the API on login.

**Step 4: No changes to components**

`BaseSection`, `BaseItem`, all item components, and `App.jsx` are
completely insulated from the storage layer.

### Schema versioning

`src/utils/versionValidator.js` exports `sanitizeAndValidateCVSnapshot(snapshot)`.
This function:
- Merges missing properties from `defaultSchema` (forward compatibility)
- Guarantees `sections` array integrity and item ID presence
- Is the correct place to add a `schema_version` field and migration logic

---

## 10. PDF Engine — What You Can and Cannot Change

### The clean print pipeline

```
User clicks "Export PDF"
  → useCVExport.exportCleanPDF()
  → staticHtmlPdfEngine.generateCleanPrintHTML(cvData)
      → Strips 26 editor-only CSS selectors (ARTIFACTS_BLACKLIST)
      → Builds full HTML5 document with index.css + print.css inlined
  → iframe.contentWindow.print()
```

### You CAN change

- `src/styles/print.css` — print-only overrides (no `@media screen` here)
- `src/index.css` — editor styles (automatically inlined in the print pipeline)
- Item component PrintView functions — how each section renders in PDF

### You CANNOT do in print CSS

- Use different font sizes than the editor (violates 1:1 parity)
- Add `margin`, `padding`, or `gap` that doesn't match the live editor
- Use `@page { margin: ... }` unless also mirroring the pagePadding variable

### The 26 artifacts blacklist

If you add a new class for an editor-only control, you MUST add it to
`ARTIFACTS_BLACKLIST` in `src/utils/staticHtmlPdfEngine.js`:
```js
// staticHtmlPdfEngine.js
const ARTIFACTS_BLACKLIST = [
  '.drag-handle',
  '.my-new-editor-control',  // ← Add your class here
  // ...existing entries
];
```

Failure to do this will make your control appear in the exported PDF.

---

## 11. Drag & Drop — How to Extend It

**Library mandate: `@dnd-kit` only.** See `AGENTS.md §2`.

### Two-level DnD hierarchy

1. **Section-level** (`App.jsx`): `DndContext` moves entire sections between
   left/right columns and reorders them vertically.
2. **Item-level** (`BaseSection.jsx`): `SortableContext` with
   `verticalListSortingStrategy` reorders items within a section.
3. **Bullet-level** (`SortableBulletItem.jsx`): nested `SortableContext`
   reorders bullet points within an item.

### Making a new element draggable

```jsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createContainerDragListeners } from '../../utils/dndUtils';

const MyDraggableItem = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: 'my_type' } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // createContainerDragListeners allows body-area dragging (not just handle)
  const containerListeners = createContainerDragListeners(listeners);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...containerListeners}>
      {children}
    </div>
  );
};
```

### `isNonDraggableTarget(element)` utility

Call this in `mousedown` handlers to skip drag initiation when the user
clicks on text, inputs, buttons, or contenteditable elements:
```js
import { isNonDraggableTarget } from '../../utils/dndUtils';

const handleMouseDown = (e) => {
  if (isNonDraggableTarget(e.target)) return; // Don't start drag
  // ... start drag
};
```

---

## 12. Testing Guidelines

### Test types and where they live

| Type | File pattern | What to test |
|------|-------------|-------------|
| Unit | `*.test.js` | Pure functions, utilities, registry lookups |
| Component | `*.test.jsx` | Render output, user interaction, state changes |
| Integration | `*.test.jsx` with full CVProvider | Cross-component data flow |
| Stress/Adversarial | `challenger-*.test.jsx` | Edge cases, large datasets, forbidden zones |

### Mandatory for each new feature

```js
describe('MyFeature', () => {
  // 1. Happy path
  it('renders correctly with default data', () => { ... });

  // 2. Edge cases
  it('handles empty string fields gracefully', () => { ... });
  it('handles undefined/null item gracefully', () => { ... });

  // 3. PDF parity (if the feature renders in PDF)
  it('does not appear in clean print HTML', () => {
    // Use staticHtmlPdfEngine helpers from existing tests as reference
  });
});
```

### Running tests

```bash
npm test                        # All 797 tests
npx vitest run src/tests/myFile # Single file
npm run test:watch              # Watch mode
```

### Test environment caveats

- Environment is `jsdom` — no real browser rendering
- `window.print()` is mocked in `src/tests/setup.js`
- `ResizeObserver` is mocked in `src/tests/setup.js`
- `getBoundingClientRect()` returns zeros by default — override per-test if needed
- `requestAnimationFrame` runs synchronously in jsdom

---

## 13. Submitting a Pull Request

1. **Branch from** `Reimplementacion-con-React`
2. **Run the full test suite**: `npm test` — must be 0 failures
3. **Run production build**: `npm run build` — must exit 0
4. **Self-review checklist**:
   - [ ] No `if (type === ...)` chains added to `BaseSection`, `BaseItem`, or `App`
   - [ ] New editable text uses `InlineEdit`
   - [ ] New icons import from `lucide-react`
   - [ ] New alerts use Obsidian Callout design
   - [ ] New editor-only CSS classes added to `ARTIFACTS_BLACKLIST`
   - [ ] New section type registered in `sectionRegistry.js` only
   - [ ] New locale added to `LOCALES` map in `locales/index.js`
   - [ ] New AI prompt has `output_format` ≥ 30 chars and multi-section rubric
   - [ ] Tests cover happy path + null/undefined edge cases
   - [ ] No commits contain `console.log` or debug code
   - [ ] `git diff` does not include auto-generated `.agents/` directories

5. **Do not auto-commit** — the repo owner reviews and commits manually.

---

## 14. Hard Rules Summary

| Rule | Source |
|------|--------|
| Use `@dnd-kit` for all DnD. Never use `swapy`. | AGENTS.md §2 |
| All tooltips: `getBoundingClientRect()` + flip + clamp. | AGENTS.md §3 |
| Obsidian Callout design for all alerts/suggestions. | AGENTS.md §1 |
| All icons: `lucide-react` SVG only. | DEVELOPMENT_MANUAL.md §3.3 |
| All editable text: `InlineEdit` component only. | DEVELOPMENT_MANUAL.md §3.2 |
| No `if (type === ...)` in `BaseSection`, `BaseItem`, `App`. | Open/Closed Principle |
| New section types: `registerSectionType()` in registry only. | DEVELOPMENT_MANUAL.md §3.1 |
| PDF parity: 0px drift between editor and print. | AGENTS.md + motor-impresion-pdf.md |
| AI domain: `tech` and `all` only. Creative/Executive: reserved. | AGENTS.md §4 |
| No commits without explicit user approval. | User preference |
