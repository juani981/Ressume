# ATS Mode UX Backlog & Architectural Action Plan

> [!IMPORTANT]
> **DISCLAIMER & AGENT DIRECTIVE**:
> **This document is NOT the source of truth**, but rather an empirical UX audit backlog, recommendation blueprint, and architectural guardrail document based on automated Cypress testing (Chrome & Firefox), 2D interaction heatmaps, and codebase analysis.
> 
> **Instructions for Any Agent Resuming or Addressing Work Here**:
> 1. **Do not accept any finding blindly**: For every task/item, you must independently inspect and assess the live code, confirm the root cause, and verify the current behavior.
> 2. **Respect Architectural Invariants (AGENTS.md)**:
>    - **Invariant 1**: Obsidian Callout Standard for alerts and confirmations.
>    - **Invariant 2**: `@dnd-kit` for all drag-and-drop structures.
>    - **Invariant 3**: Dynamic tooltips and popovers tracking bounding rects (`getBoundingClientRect()`).
>    - **Invariant 4**: AI Suggestion Engine focus is strictly Tech.
>    - **Invariants 5, 6, 7**: Zero heuristic print reflow. Never apply `break-before: page` to list items. Real browser validation required.
>    - **Invariant 15**: Discrete A4 boxes (`210mm x 297mm`, `overflow: hidden`, `margin: 0 auto 32px auto`).
>    - **Invariant 16**: Editor is the sole source of truth; zero dynamic reflow on print.
>    - **Invariant 18**: User sovereignty over `ActionMenuRoot.jsx`. Tests adapt to code, never revert user changes.
>    - **Invariant 19**: User sovereignty over geometry, typography, and spacing constants.
> 3. **Validation Standard**: For every fix implemented, write or update an **E2E Cypress test** (in `cypress/e2e/`) that executes in the real headless browser and confirms the friction is eliminated in both Chrome and Firefox.
> 4. **Living Backlog**: Check off items (`[x]`) and record commit hashes / spec names in this document as progress is made.

---

## Executive Summary & Target Profile

* **Release Objective**: Deliver a best-in-class, frictionless **Optimized ATS Mode (Single-Column Linear Flow)** for software engineers and tech professionals.
* **Scope Exclusion**: All 2-column features (column resizer, dual-column color theming, left/right column width sliders, photo cropping/shapes, and two-column toggles) are **STRICTLY EXCLUDED** from this release.
* **Physical Target**: Discrete A4 paper boxes (`210mm x 297mm`) rendered with 1:1 fidelity to headless PDF print outputs.

---

## Master Status Tracker

| Task ID | Domain / Issue | Priority | Status | Assigned Agent / Test Spec |
| :---: | :--- | :---: | :---: | :---: |
| `ATS-01` | Master Toolbar (ActionMenu) Discoverability | P1 | ✅ RESOLVED & VERIFIED | `cypress/e2e/ux-01-onboarding-and-navigation.cy.js` & `ux-07` |
| `ATS-02` | Catastrophic Section Erasure Without Confirmation | P0 | ✅ RESOLVED & VERIFIED | `cypress/e2e/ux-09-section-lifecycle-and-empty-states.cy.js` |
| `ATS-03` | Drag Handle Sensor Collision with Bullet Text | P0 | ✅ RESOLVED & VERIFIED | `cypress/e2e/ux-12-bullet-styling-and-inline-toolbar.cy.js` |
| `ATS-04` | Multi-Page Section Insertion on Page 1 | P1 | ✅ RESOLVED & VERIFIED | `cypress/e2e/ux-14-multipage-overflow-and-spacers.cy.js` |
| `ATS-05` | Disconnected ATS Suggestion Engine & Knowledge Base | P1 | ✅ RESOLVED & VERIFIED | `cypress/e2e/ux-06-ai-assistance-and-translation.cy.js` |
| `ATS-06` | Hazardous Contact Pill Deletion Hit-Target | P2 | ✅ RESOLVED & VERIFIED | `cypress/e2e/ux-10-contact-picker-and-social-links.cy.js` |
| `ATS-07` | Misleading Three-Dots Icon for Bullet Styling | P2 | ✅ RESOLVED & VERIFIED | `cypress/e2e/ux-12-bullet-styling-and-inline-toolbar.cy.js` |
| `ATS-08` | Pure ATS Default Template & Clean Initialization | P1 | ✅ RESOLVED & VERIFIED | `cypress/e2e/ux-01` & `pureAtsInit.test.jsx` |

---

## Detailed Issue Specifications, Reasoning Audits & Action Plans

---

### [ATS-01] Master Toolbar & PDF Export Discoverability

* **Severity**: `P1 - High Friction / Blocked Goal`
* **Status**: `[ ] Pending Investigation & Fix`
* **Target Spec**: `cypress/e2e/ux-01-onboarding-and-navigation.cy.js` & `cypress/e2e/ux-07-pagination-and-print-lifecycle.cy.js`

#### 1. Perceived User Experience & Mental Model
* A first-time user fills in their contact details, work experience, and skills in ATS mode.
* When ready to download the resume, they scan the top of the browser and the margins of the A4 canvas.
* Because the toolbar collapses into a 16px wide neutral strip on the far left edge of a 1440px or 1920px screen, the user fails to realize the export, versioning, and styling tools are hiding there.
* The user experiences disorientation: *"How do I download my CV?"*

#### 2. Code Findings & Root Cause Analysis
* **File**: [`src/components/Editor/ActionMenu/ActionMenuRoot.jsx`](file:///home/juanicarrizo97/Ressume/src/components/Editor/ActionMenu/ActionMenuRoot.jsx)
* **Lines 54–63**:
  ```javascript
  const [isPinned, setIsPinned] = useState(() => {
    const stored = localStorage.getItem('action_menu_pinned');
    return stored !== null ? stored === 'true' : isTestEnv;
  });
  ```
  In standard user sessions, `action_menu_pinned` is null, defaulting to `false`.
* **Lines 253–274**: The unpinned peek rail is rendered as a 16px wide strip (`action-menu-edge-handle`) on the left screen border with low-contrast chevrons.
* **Line 25**: `const HOVER_INTENT_MS = 280;` requires hovering for 280ms before expanding.

#### 3. ⚠️ Audit of the Audit: Reasoning Holes & Architectural Guardrails
* **Loophole / Conflict with Invariant 18**:
  * Forcing `isPinned: true` unconditionally on wide screens violates **Invariant 18 (Absolute User Sovereignty over ActionMenuRoot)**. The user intentionally engineered the 280ms hover-intent and collapse mechanism to provide a distraction-free, focused writing canvas.
  * Overriding the user's manual design choice by permanently pinning the toolbar would contradict Rule 18.
* **Refined Architectural Solution**:
  * **Non-Intrusive Discoverability Pulse**: Keep `isPinned: false` as designed by the user, but introduce a subtle, temporary glowing ring or an introductory tooltip on the collapsed peek tab (`action-menu-edge-handle`) during first session until first opened.
  * **Header Download Shortcut**: Alternatively, provide an explicit "Descargar PDF" button in the canvas header (or top pill bar next to "Consejos IA") that directly invokes `handleGeneratePDF()`, keeping the ActionMenu clean and respecting user sovereignty.

#### 4. Cypress Verification Criteria
* Assert that the PDF download affordance is visually salient on initial load without requiring accidental discovery.
* Assert that clicking or hovering the ActionMenu rail opens the menu smoothly within expected timing.

---

### [ATS-02] Catastrophic Section Erasure Without Confirmation

* **Severity**: `P0 - Critical Data Loss Hazard`
* **Status**: `[ ] Pending Investigation & Fix`
* **Target Spec**: `cypress/e2e/ux-09-section-lifecycle-and-empty-states.cy.js`

#### 1. Perceived User Experience & Mental Model
* A user is editing their "EXPERIENCIA LABORAL" section containing multiple companies and a dozen detailed bullet points.
* While moving the mouse across the section header, they accidentally click the small trash can icon (`Trash2`).
* The entire section, including all nested job titles, companies, dates, and achievements, immediately vanishes from the screen.
* The user panics: there was no confirmation dialog, no warning, and no visible undo prompt.

#### 2. Code Findings & Root Cause Analysis
* **File**: [`src/components/CV/BaseSection.jsx`](file:///home/juanicarrizo97/Ressume/src/components/CV/BaseSection.jsx)
* **Lines 242–256**:
  ```jsx
  {allowDelete && (
    <button 
      type="button"
      className="round-btn-del section-del-btn"
      title={`Eliminar sección ${section.title || section.id}`}
      data-testid={`btn-delete-section-${section.id}`}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        deleteSection(section.originalSectionId || section.id);
      }}
    >
      <Trash2 size={13} />
    </button>
  )}
  ```

#### 3. ⚠️ Audit of the Audit: Reasoning Holes & Architectural Guardrails
* **Loophole / Conflict with Invariant 15 (Discrete A4 Box Height Shift)**:
  * If the confirmation dialog is inserted **inline directly into the section header inside `.a4-page-box`**, it will temporarily inject ~60-80px of DOM height into the section.
  * If Page 1 is near vertical capacity (e.g. 980px / 1050px), this sudden height spike will cause `useDocumentPages` to recalculate layout and push the bottom section to Page 2 *while the user is deciding whether to delete!* When cancelled, the section would jump back to Page 1, creating a jarring visual reflow.
* **Multi-Page Deletion Hazard**:
  * Line 251: `deleteSection(section.originalSectionId || section.id)`. If a section continues onto Page 2 (`id: "experience__cont_1"`), clicking delete on Page 2 deletes the entire section from Page 1 as well! The user must be informed that the *entire* cross-page section is being deleted.
* **Refined Architectural Solution**:
  * **Floating Popover or Modal Confirmation (Invariant 3 & 1)**: Render the confirmation dialog in a floating popover anchored to the delete button (`getBoundingClientRect()`) or in an overlay modal. Because it renders in a portal outside `#area-cv`, it introduces **ZERO DOM height mutation** inside `.a4-page-box` and causes zero pagination recalculation.
  * **Obsidian Callout Danger Styling**: Must use background `rgba(233, 49, 71, 0.1)`, 4px left border `rgba(233, 49, 71, 1)`, icon `🛑`, with explicit `[Cancelar]` and `[Eliminar]`.
  * **Undo Toast Notification**: When confirmed, trigger a toast with an active `[Deshacer]` action wired to `applyStateWithHistory`.

#### 4. Cypress Verification Criteria
* Assert clicking `btn-delete-section` does not delete the section immediately.
* Assert floating confirmation appears with Obsidian Callout styling without altering `#area-cv` vertical geometry.
* Assert clicking "Cancelar" retains the section.
* Assert confirming removes the section and displays an undo toast.

---

### [ATS-03] Drag Handle Sensor Overlapping Bullet Point Text

* **Severity**: `P0 - Direct Text Editing Blocker`
* **Status**: `[ ] Pending Investigation & Fix`
* **Target Spec**: `cypress/e2e/ux-12-bullet-styling-and-inline-toolbar.cy.js`

#### 1. Perceived User Experience & Mental Model
* A user clicks on the first letter of an achievement bullet point to edit it: *"Diseñé e implementé microservicios..."*.
* Instead of the cursor appearing in the text, the row enters drag mode or cursor changes to `grab`.
* Cypress empirical failure log:  
  `"<span class="simple-list-circle"> is being covered by another element: <svg class="lucide lucide-grip-vertical">"`

#### 2. Code Findings & Root Cause Analysis
* **Files**:
  * [`src/components/CV/SortableBulletItem.jsx:80-94`](file:///home/juanicarrizo97/Ressume/src/components/CV/SortableBulletItem.jsx#L80-L94)
  * [`src/components/Editor/DragHandle.jsx:30`](file:///home/juanicarrizo97/Ressume/src/components/Editor/DragHandle.jsx#L30)
  * [`src/components/CV/items/SimpleListItem.jsx:16-27`](file:///home/juanicarrizo97/Ressume/src/components/CV/items/SimpleListItem.jsx#L16-L27)
  * [`src/index.css:1400-1413`](file:///home/juanicarrizo97/Ressume/src/index.css#L1400-L1413)
* **Code Trace**:
  `.bullet-item-row .item-drag-handle { top: 0.1rem; left: -0.75rem; z-index: 50; }`

#### 3. ⚠️ Audit of the Audit: Reasoning Holes & Architectural Guardrails
* **Loophole / Conflict with Existing Print Tests**:
  * The initial naive proposal suggested: *"Add `padding-left: 18px` to `.bullet-item-row` or shift handle to `left: -1.4rem`"*.
  * **FATAL FLAW**: Existing test suite [`src/tests/bulletPointsNativePrint.test.jsx:123`](file:///home/juanicarrizo97/Ressume/src/tests/bulletPointsNativePrint.test.jsx#L123) explicitly asserts:
    ```javascript
    expect(cssContent).toMatch(/\.bullet-item-row\s*\{[^}]*padding-left:\s*0/);
    ```
    And [`src/tests/addButtonsAndResizerParity.test.jsx:152`](file:///home/juanicarrizo97/Ressume/src/tests/addButtonsAndResizerParity.test.jsx#L152) asserts:
    ```javascript
    expect(cssContent).toMatch(/\.bullet-item-row\s+\.item-drag-handle\s*\{[^}]*left:\s*-0\.75rem/);
    ```
    Altering those CSS rules directly will break existing test suites and shift printed text alignment!
* **True Deep Root Cause in `dndUtils.js`**:
  * Look at [`src/utils/dndUtils.js:20-47`](file:///home/juanicarrizo97/Ressume/src/utils/dndUtils.js#L20-L47):
    `NON_DRAGGABLE_SELECTORS` lists all non-draggable elements.
    `.simple-list-circle` and `.bullet-item-row .inline-edit-display` are **NOT in `NON_DRAGGABLE_SELECTORS`**!
  * And in [`src/index.css:1030`](file:///home/juanicarrizo97/Ressume/src/index.css#L1030):
    `.bullet-item-row:hover { cursor: grab; }` applies `cursor: grab` to the entire row!
  * And in `DragHandle.jsx`, the handle has `width: 16px` with no negative margin or pointer-events constraint.
* **Refined Architectural Solution**:
  1. Add `.simple-list-circle`, `.simple-list-text`, and `.bullet-item-row .inline-edit-display` to `NON_DRAGGABLE_SELECTORS` in [`src/utils/dndUtils.js`](file:///home/juanicarrizo97/Ressume/src/utils/dndUtils.js).
  2. In `DragHandle.jsx`, restrict `pointer-events: auto` strictly to the SVG icon itself, leaving the surrounding hit-box transparent to mouse events.
  3. Ensure clicking `.simple-list-circle` focuses the text input rather than triggering row dragging.

#### 4. Cypress Verification Criteria
* Assert direct click on `.simple-list-circle` and first character of bullet text enables inline editing without Cypress element interception errors.
* Assert drag handle still successfully reorders bullets when clicked directly on the `<GripVertical />` icon.

---

### [ATS-04] Multi-Page Section Insertion on Page 1

* **Severity**: `P1 - Workflow Interruption`
* **Status**: `[ ] Pending Investigation & Fix`
* **Target Spec**: `cypress/e2e/ux-09-section-lifecycle-and-empty-states.cy.js` & `cypress/e2e/ux-14-multipage-overflow-and-spacers.cy.js`

#### 1. Perceived User Experience & Mental Model
* In a 2-page ATS resume, the candidate on Page 1 decides to add an "IDIOMAS" or "PROYECTOS" section.
* They scan the bottom of Page 1 for "+ Agregar Sección", but nothing is there.
* They are forced to scroll down to the bottom of Page 2, add the section at the very end of the document, and drag it all the way up across pages.

#### 2. Code Findings & Root Cause Analysis
* **File**: [`src/App.jsx:331-337`](file:///home/juanicarrizo97/Ressume/src/App.jsx#L331-L337)
  ```jsx
  {pageModel.pageNumber === pages.length && (
    <div className="column-add-section no-print" ...>
      <button onClick={() => handleOpenAddSection("single")}>
        <PlusCircle size={16} /> Agregar Sección
      </button>
    </div>
  )}
  ```

#### 3. ⚠️ Audit of the Audit: Reasoning Holes & Architectural Guardrails
* **Loophole / Conflict with Invariant 15 (Page Overflow Violations)**:
  * The initial naive proposal suggested: *"Render '+ Agregar Sección' at the bottom of each discrete page"*.
  * **FATAL FLAW**: Each `.a4-page-box` has strictly:
    `height: 297mm; min-height: 297mm; max-height: 297mm; overflow: hidden;`
  * Content inside Page 1 was calculated by `distributeSectionsToPages` to fit exactly into Page 1.
  * If Page 1 is already full (e.g. 1000px of content), adding an in-flow `<div className="column-add-section">` inside Page 1 will:
    1. Be clipped off and invisible due to `overflow: hidden`, OR
    2. Push the last section downward, clipping content off the bottom of Page 1.
* **Refined Architectural Solution**:
  * **Inter-Page Separation Gap Button (Zero Paper Intrusion)**:
    Between Page 1 and Page 2 sits an unprinted 32px separation gap (`margin: 0 auto 32px auto`, Invariant 15).
    Placing an "+ Agregar Sección aquí" pill in the **inter-page gap** (outside `.a4-page-box`) adds zero pixels to the A4 page container, completely eliminating the risk of page box overflow.
  * **Global Add Section Action in ActionMenu / Top Bar**:
    Provide a persistent "Agregar Sección" button in the ActionMenu toolbar or top header that opens `AddSectionModal` and allows choosing insertion position ("Al final de la página actual" or "Al final del CV").

#### 4. Cypress Verification Criteria
* Assert a section can be added to the document from Page 1 without scrolling to Page 2.
* Assert adding a section does not cause Page 1 content to clip or exceed `297mm`.

---

### [ATS-05] Disconnected ATS Suggestion Engine & Knowledge Base

* **Severity**: `P1 - Core Value Proposition Gap`
* **Status**: `[ ] Pending Investigation & Fix`
* **Target Spec**: `cypress/e2e/ux-06-ai-assistance-and-translation.cy.js`

#### 1. Perceived User Experience & Mental Model
* The user chooses "ATS Mode" specifically to pass automated applicant tracking screening.
* While writing their summary and achievements, they receive zero proactive suggestions, metrics reminders, or ATS warnings.
* The pre-computed tech knowledge base (`src/ai-knowledge/`) remains completely dormant.

#### 2. Code Findings & Root Cause Analysis
* **Files**:
  * [`src/components/Editor/AppModals.jsx:116-123`](file:///home/juanicarrizo97/Ressume/src/components/Editor/AppModals.jsx#L116-L123)
  * [`src/components/Editor/SuggestionTooltip.jsx:145-165`](file:///home/juanicarrizo97/Ressume/src/components/Editor/SuggestionTooltip.jsx#L145-L165)
  * [`src/components/Editor/AITipsSidebar.jsx:408`](file:///home/juanicarrizo97/Ressume/src/components/Editor/AITipsSidebar.jsx#L408)
  * [`src/context/hooks/useCVLayout.js:110-120`](file:///home/juanicarrizo97/Ressume/src/context/hooks/useCVLayout.js#L110-L120)
* **Code Trace**:
  `SuggestionTooltip` is mounted in `AppModals.jsx`, but `toggleTooltipForSection` / `setActiveTooltip` are never invoked in `BaseSection.jsx`. The sidebar defaults to `showAITips: false`.

#### 3. ⚠️ Audit of the Audit: Reasoning Holes & Architectural Guardrails
* **Loophole / Popover Fatigue & Typing Distraction**:
  * If suggestions automatically pop up on *every single hover* over a section, the user will be bombarded by 300px floating Obsidian Callouts every time their mouse traverses the canvas. This is severe UX friction.
* **Refined Architectural Solution**:
  * **Intentional Section Advice Trigger**:
    In `BaseSection.jsx`, add an explicit lightbulb icon button in the section header:
    `<button data-testid={"btn-section-tips-" + section.id} title="Ver consejos ATS de esta sección">`
    Clicking it invokes `toggleTooltipForSection(section, rect)`, anchoring the Obsidian Callout to that section header.
  * **Section Content Scoring**:
    Ensure the tooltip displays actionable ATS rules (Invariant 1 & 4):
    - *Critical (`🛑`)*: If Experience has zero numbers/percentages.
    - *Warning (`⚠️`)*: If Summary is under 40 words.
    - *Info (`ℹ️`)*: Recommended tech keywords.
  * **Master Sidebar Toggle State**:
    The master toggle in `LayoutModeToggle.jsx` (`data-testid="master-tips-toggle"`) provides persistent non-overlapping side cards for users who want continuous guidance.

#### 4. Cypress Verification Criteria
* Assert clicking the advice trigger on an ATS section displays an Obsidian Callout tooltip adhering to Invariant 1.
* Assert the tooltip dynamically computes position via `getBoundingClientRect()` (Invariant 3).

---

### [ATS-06] Hazardous Contact Pill Deletion Hit-Target

* **Severity**: `P2 - Ergonomic Misclick Hazard`
* **Status**: `[ ] Pending Investigation & Fix`
* **Target Spec**: `cypress/e2e/ux-10-contact-picker-and-social-links.cy.js`

#### 1. Perceived User Experience & Mental Model
* In the ATS header, contact items (Email, Phone, LinkedIn, GitHub, Location) are listed horizontally.
* A user clicks their email address to edit it.
* Because the minus icon (`-`) is only 11px wide and packed with a 3px gap, a minor click inaccuracy hits the delete button, erasing the channel immediately.

#### 2. Code Findings & Root Cause Analysis
* **File**: [`src/components/CV/items/ContactItem.jsx:150-164`](file:///home/juanicarrizo97/Ressume/src/components/CV/items/ContactItem.jsx#L150-L164)
  ```jsx
  <span className="social__link contact-item-pill" style={{ gap: '3px', padding: '1px 2px' }}>
    <ContactIcon name={config.icon} size={13} />
    <InlineEdit value={contact.value || ''} onSave={...} />
    <button className="contact-del-btn bullet-del-btn no-print" onClick={() => handleDeleteContact(contact.id)}>
      <Minus size={11} strokeWidth={2.5} />
    </button>
  </span>
  ```

#### 3. ⚠️ Audit of the Audit: Reasoning Holes & Architectural Guardrails
* **Loophole / Conflict with Invariant 16 (Editor vs. Print Height Mismatch)**:
  * The initial proposal suggested: *"Increase delete button size to 24x24px with larger padding"*.
  * **FATAL FLAW**: In ATS mode, 4 to 5 contact channels are packed horizontally in a single line. Usable page width is 746px (`794px - 48px padding`).
  * If we add 24px wide buttons with padding to every contact pill in the editor, the horizontal row will exceed 746px and wrap into 2 or 3 lines in the editor (`height: ~50px`).
  * But in print, `.no-print` strips all delete buttons, causing the printed text to fit on **1 single line** (`height: ~22px`)!
  * **This creates a 28px height discrepancy between the editor and the print engine**, causing `pageDistributor` to calculate page breaks on false editor dimensions and violating **Invariant 16 (Zero Print Reflow / WYSIWYG Absolute)**!
* **Refined Architectural Solution**:
  * **Zero-Flow Impact Deletion Button**:
    Position the delete button absolutely (`position: absolute; right: -6px; top: -6px; width: 16px; height: 16px; border-radius: 999px;`) and only show it on `:hover` or `:focus-within` of that specific contact pill.
    Because `position: absolute` takes the button completely out of document flow, it adds **0px of horizontal width** to the contact row, guaranteeing 100% WYSIWYG layout parity with the printed output!

#### 4. Cypress Verification Criteria
* Assert contact row horizontal width in editor matches printed width within 5px tolerance.
* Assert clicking contact text focuses input without triggering deletion.

---

### [ATS-07] Misleading Three-Dots Icon for Section Bullet Styling

* **Severity**: `P2 - Cognitive Ambiguity & Anti-ATS Risk`
* **Status**: `[ ] Pending Investigation & Fix`
* **Target Spec**: `cypress/e2e/ux-12-bullet-styling-and-inline-toolbar.cy.js`

#### 1. Perceived User Experience & Mental Model
* Users see `...` in section headers and click it expecting section actions (Duplicate, Move, Settings).
* It opens a popover configuring bullet point shapes (circle, square, diamond, dash).
* In ATS mode, non-standard bullet shapes (diamonds, squares, arrows) are frequently penalized or corrupted by ATS parsers into question marks (`?`).

#### 2. Code Findings & Root Cause Analysis
* **File**: [`src/components/CV/BaseSection.jsx:225-240`](file:///home/juanicarrizo97/Ressume/src/components/CV/BaseSection.jsx#L225-L240)
  ```jsx
  <button 
    className="section-bullet-style-btn"
    title="Personalizar círculo del título"
    data-testid={`btn-bullet-style-${section.id}`}
  >
    <MoreHorizontal size={14} />
  </button>
  ```

#### 3. ⚠️ Audit of the Audit: Reasoning Holes & Architectural Guardrails
* **Anti-ATS Bullet Hazards**:
  * In pure ATS mode, allowing users to pick exotic bullet icons harms ATS parsing compliance.
* **Refined Architectural Solution**:
  * In ATS Mode (`isAtsMode: true`), replace `<MoreHorizontal size={14} />` with `<ListFilter size={14} />` or `<List size={14} />` and title: *"Estilo de lista (Recomendado ATS: Círculo)"*.
  * In `SectionBulletStylePopover.jsx`, add an Obsidian Callout Info badge: *"ℹ️ ATS Parser Best Practice: El círculo estándar (•) garantiza compatibilidad universal en Workday y Greenhouse."*

#### 4. Cypress Verification Criteria
* Assert icon is an explicit list icon (`ListFilter` / `List`) instead of generic `MoreHorizontal`.
* Assert ATS best practice recommendation is presented.

---

### [ATS-08] Pure ATS Default Template & Clean Initialization

* **Severity**: `P1 - Initial Experience Alignment`
* **Status**: `[ ] Pending Investigation & Fix`
* **Target Spec**: `cypress/e2e/ux-01-onboarding-and-navigation.cy.js` & `cypress/e2e/ux-13-version-manager-deep-dive.cy.js`

#### 1. Perceived User Experience & Mental Model
* A candidate visiting the application for the first time should immediately see the clean, single-column ATS resume layout ready for typing.
* They should not be greeted with a 2-column layout or asked to toggle modes.

#### 2. Code Findings & Root Cause Analysis
* **Files**:
  * [`src/utils/schema.js:4-20`](file:///home/juanicarrizo97/Ressume/src/utils/schema.js#L4-L20)
  * [`src/context/hooks/useCVData.js:101-112`](file:///home/juanicarrizo97/Ressume/src/context/hooks/useCVData.js#L101-L112)
  * [`src/utils/atsSchemaTemplate.js:9-48`](file:///home/juanicarrizo97/Ressume/src/utils/atsSchemaTemplate.js#L9-L48)

#### 3. ⚠️ Audit of the Audit: Reasoning Holes & Architectural Guardrails
* **Loophole / Conflict with Invariant 19 (User Sovereignty over Constants)**:
  * Over 188 lines of existing test suites import `defaultSchema` directly from `src/utils/schema.js` and assert `defaultSchema.layout.type === '2-column'`.
  * Invariant 19 strictly forbids altering layout constants in `src/utils/schema.js` if it causes existing tests to break.
* **Refined Architectural Solution**:
  * **Runtime Session Initialization**: Keep `defaultSchema` in `src/utils/schema.js` intact for fixture compatibility.
  * In `src/context/hooks/useCVData.js:101-112` (`loadInitialCVData`), when `localStorage` is empty (first load), initialize the active session using `getAtsGoldenSchemaTemplate()` (which has `isAtsMode: true` and `type: '1-column'`).
  * This delivers a 100% pure ATS experience on page load while keeping `schema.js` constants and existing tests 100% intact.

#### 4. Cypress Verification Criteria
* Assert clearing `localStorage` and opening `/` immediately mounts a single-column ATS document (`.resume--ats-mode`).
* Assert no 2-column layout elements (column resizers, split background gradients) exist in the initial DOM.

---

## Agent Execution Protocol

When an agent takes on any of the tasks above, follow this strict four-step workflow:

```
┌────────────────────────────────────────────────────────┐
│ 1. ASSESS & INVESTIGATE                                │
│    - Read the referenced code lines and guardrails.    │
│    - Replicate the friction in Chrome & Firefox.       │
├────────────────────────────────────────────────────────┤
│ 2. IMPLEMENT MINIMAL, CLEAN FIX                        │
│    - Adhere strictly to AGENTS.md Invariants.          │
│    - Never break existing typography/spacing tokens.   │
│    - Ensure ZERO print reflow (Invariant 16).          │
├────────────────────────────────────────────────────────┤
│ 3. VALIDATE WITH CYPRESS E2E IN DUAL BROWSERS          │
│    - Run: npx cypress run --browser chrome --spec ...  │
│    - Run: npx cypress run --browser firefox --spec ... │
├────────────────────────────────────────────────────────┤
│ 4. UPDATE THIS BACKLOG                                 │
│    - Check off the item ([x]).                         │
│    - Record commit hash and verification summary.      │
└────────────────────────────────────────────────────────┘
```
