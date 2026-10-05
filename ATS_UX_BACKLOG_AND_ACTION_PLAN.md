# ATS Mode UX Backlog & Architectural Action Plan

> [!IMPORTANT]
> **DISCLAIMER & AGENT DIRECTIVE**:
> **This document is NOT the source of truth**, but rather an empirical UX audit backlog and recommendation blueprint based on automated Cypress testing (Chrome & Firefox), 2D interaction heatmaps, and code analysis.
> 
> **Instructions for Any Agent Resuming or Addressing Work Here**:
> 1. **Do not accept any finding blindly**: For every task/item, you must independently inspect and assess the live code, confirm the root cause, and verify the current behavior.
> 2. **Respect Architectural Invariants**:
>    - **Invariant 1**: Obsidian Callout Standard for alerts and confirmations.
>    - **Invariant 2**: `@dnd-kit` for all drag-and-drop structures.
>    - **Invariant 3**: Dynamic tooltips and popovers tracking bounding rects (`getBoundingClientRect()`).
>    - **Invariant 4**: AI Suggestion Engine focus is strictly Tech.
>    - **Invariants 5, 6, 7**: Zero heuristic print reflow. Never apply `break-before: page` to list items. Real browser validation required.
>    - **Invariant 15**: Discrete A4 boxes (`210mm x 297mm`, `overflow: hidden`, `margin: 0 auto 32px auto`).
>    - **Invariant 16**: Editor is the sole source of truth; zero dynamic reflow on print.
>    - **Invariant 18**: User sovereignty over `ActionMenuRoot.jsx`. Tests adapt to code, never revert user changes.
>    - **Invariant 19**: User sovereignty over geometry, typography, and spacing constants.
> 3. **Validation Standard**: For every fix implemented, write or update an **E2E Cypress test** (in `cypress/e2e/`) that executes in the real headless browser and confirms the friction is eliminated.
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
| `ATS-01` | Master Toolbar (ActionMenu) Discoverability | P1 | ⏳ PENDING | TBD |
| `ATS-02` | Catastrophic Section Erasure Without Confirmation | P0 | ⏳ PENDING | TBD |
| `ATS-03` | Drag Handle Sensor Collision with Bullet Text | P0 | ⏳ PENDING | TBD |
| `ATS-04` | Multi-Page Section Insertion on Page 1 | P1 | ⏳ PENDING | TBD |
| `ATS-05` | Disconnected ATS Suggestion Engine & Knowledge Base | P1 | ⏳ PENDING | TBD |
| `ATS-06` | Hazardous Contact Pill Deletion Hit-Target | P2 | ⏳ PENDING | TBD |
| `ATS-07` | Misleading Three-Dots Icon for Bullet Styling | P2 | ⏳ PENDING | TBD |
| `ATS-08` | Pure ATS Default Template & Clean Initialization | P1 | ⏳ PENDING | TBD |

---

## Detailed Issue Specifications & Action Plans

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
* **Invariant Note (Rule 18)**: `ActionMenuRoot.jsx` is under strict user sovereignty. Any visual enhancement must respect the user's design structure and never revert custom layouts.

#### 3. Recommended Resolution
* Add a subtle, non-intrusive visual affordance on the peek rail when it is collapsed and the user has not yet interacted with it:
  * E.g., a gentle pulsing glow, or an introductory floating badge / tooltip during the first session: *"Herramientas y Descarga PDF (Haz clic para fijar)"*.
  * Or automatically default `isPinned: true` on screens wider than 1280px while allowing manual collapse.
* Ensure clicking anywhere on the 16px rail pins the menu open (`handlePeekClick`).

#### 4. Cypress Verification Criteria
* Write an automated test asserting:
  1. On initial load, the peek rail or toolbar is immediately discoverable with high contrast.
  2. Clicking or hovering over the rail opens the full toolbar within acceptable latency.
  3. The PDF download button (`[data-testid="btn-action-native-print"]`) is visible and accessible in under 2 clicks from the main canvas.

---

### [ATS-02] Catastrophic Section Erasure Without Confirmation

* **Severity**: `P0 - Critical Data Loss Hazard`
* **Status**: `[ ] Pending Investigation & Fix`
* **Target Spec**: `cypress/e2e/ux-09-section-lifecycle-and-empty-states.cy.js`

#### 1. Perceived User Experience & Mental Model
* A user is editing their "EXPERIENCIA LABORAL" section containing multiple companies and a dozen detailed bullet points.
* While attempting to move their mouse across the section header, they accidentally click the small trash can icon (`Trash2`).
* The entire section, including all nested job titles, companies, dates, and achievements, immediately vanishes from the screen.
* The user panics: there was no confirmation dialog, no warning, and no visible undo toast.

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
* **Contrast with High-Safety Standard**: In [`src/components/Editor/versionManager/VersionConfirmationDialogs.jsx`](file:///home/juanicarrizo97/Ressume/src/components/Editor/versionManager/VersionConfirmationDialogs.jsx#L24-L65), clearing the CV displays a prominent Obsidian Callout confirmation. In `BaseSection.jsx`, deletion is instantaneous and irreversible without hitting Ctrl+Z (which naive users do not know exists).

#### 3. Recommended Resolution
* Introduce an inline confirmation barrier adhering to **Invariant 1 (Obsidian Callout Danger Standard)**:
  * Clicking the trash button sets local component state `isConfirmingDelete: true`.
  * Renders a compact Obsidian Callout popover or inline badge:
    * Background `rgba(233, 49, 71, 0.1)`, 4px left border `rgba(233, 49, 71, 1)`, icon `🛑`.
    * Message: *"¿Eliminar la sección completa y todo su contenido?"*
    * Actions: `[Cancelar]` and `[Eliminar]`.
  * Alternatively, trigger a non-blocking toast with an `[Deshacer]` action that restores the removed section from memory.

#### 4. Cypress Verification Criteria
* Write an automated test asserting:
  1. Clicking `[data-testid="btn-delete-section-${id}"]` does NOT immediately unmount the section from the DOM.
  2. The confirmation barrier or undo toast is displayed.
  3. Clicking "Cancelar" aborts deletion, keeping the section and all items intact.
  4. Confirming deletion removes the section and records telemetry cleanly.

---

### [ATS-03] Drag Handle Sensor Overlapping Bullet Point Text

* **Severity**: `P0 - Direct Text Editing Blocker`
* **Status**: `[ ] Pending Investigation & Fix`
* **Target Spec**: `cypress/e2e/ux-12-bullet-styling-and-inline-toolbar.cy.js`

#### 1. Perceived User Experience & Mental Model
* A user wants to edit a bullet point: *"Diseñé e implementé microservicios..."*.
* They naturally click on the first word or the bullet point dot to place the text cursor.
* Instead of the cursor appearing in the text, the entire line enters drag-and-drop mode or fails to focus because the drag sensor intercepts the click.
* Empirical failure from Cypress:  
  `"<span class="simple-list-circle"> is being covered by another element: <svg class="lucide lucide-grip-vertical">"`

#### 2. Code Findings & Root Cause Analysis
* **Files**:
  * [`src/components/CV/SortableBulletItem.jsx:80-94`](file:///home/juanicarrizo97/Ressume/src/components/CV/SortableBulletItem.jsx#L80-L94)
  * [`src/components/Editor/DragHandle.jsx:30`](file:///home/juanicarrizo97/Ressume/src/components/Editor/DragHandle.jsx#L30)
  * [`src/components/CV/items/SimpleListItem.jsx:16-27`](file:///home/juanicarrizo97/Ressume/src/components/CV/items/SimpleListItem.jsx#L16-L27)
  * [`src/index.css:1400-1413`](file:///home/juanicarrizo97/Ressume/src/index.css#L1400-L1413)
* **Code Trace**:
  ```css
  .bullet-item-row {
    position: relative;
    padding-left: 0 !important;
  }
  .bullet-item-row .item-drag-handle {
    top: 0.1rem;
    left: -0.75rem; /* -12px */
    z-index: 50;
  }
  ```
  The 16px wide handle placed at `left: -0.75rem` has `z-index: 50` and physically intrudes 4px into the row boundary, directly covering `.simple-list-circle` and the first character of `<InlineEdit>`.

#### 3. Recommended Resolution
* Reposition `.item-drag-handle` in `.bullet-item-row` so it resides strictly outside the text interaction hit-box:
  * Provide `padding-left: 18px` or shift the handle further left (`left: -1.4rem`) so it never physically overlaps `.simple-list-circle` or the first letter of text.
  * Alternatively, ensure `pointer-events: none` on the drag handle wrapper until the user specifically hovers over the handle itself, or only activate dragging via dedicated drag listeners on the handle rather than bubbling.

#### 4. Cypress Verification Criteria
* Write an automated test asserting:
  1. Direct click on `.simple-list-circle` and the first character of `<InlineEdit>` successfully places cursor and enables editing without force-clicking.
  2. Drag handle remains functional when clicking directly on the `<GripVertical />` icon.
  3. No DOM element coverage warning from Cypress.

---

### [ATS-04] Multi-Page Section Insertion Barrier on Page 1

* **Severity**: `P1 - Workflow Interruption`
* **Status**: `[ ] Pending Investigation & Fix`
* **Target Spec**: `cypress/e2e/ux-09-section-lifecycle-and-empty-states.cy.js` & `cypress/e2e/ux-14-multipage-overflow-and-spacers.cy.js`

#### 1. Perceived User Experience & Mental Model
* A user is crafting a 2-page ATS resume.
* While looking at Page 1, they realize they forgot to add a "PROYECTOS" section.
* They look at the bottom of Page 1 for an "Agregar Sección" button, but there is none.
* They are forced to scroll past the 32px page separator to the bottom of Page 2, add the section there, and drag it upwards across page boundaries.

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
* **Root Cause**: The adder container is conditionally mounted only on the final page (`pageModel.pageNumber === pages.length`).

#### 3. Recommended Resolution
* Provide a direct section insertion affordance that is always accessible regardless of which page the user is viewing:
  * Option A: An "Agregar Sección" action item directly in the master left toolbar (`ActionMenuRoot.jsx`).
  * Option B: Allow the Add Section modal to specify target position (Top of Page, Bottom of Page, or Below Section X).
  * Option C: A subtle "+ Sección" pill floating at the inter-page margin or bottom of each discrete page.

#### 4. Cypress Verification Criteria
* Write an automated test asserting:
  1. With a 2-page document rendered, the user can open the `AddSectionModal` while viewing Page 1.
  2. Adding a section places it into the document without requiring scrolling to the bottom of Page 2.

---

### [ATS-05] Disconnected ATS Suggestion Engine & Knowledge Base

* **Severity**: `P1 - Core Value Proposition Gap`
* **Status**: `[ ] Pending Investigation & Fix`
* **Target Spec**: `cypress/e2e/ux-06-ai-assistance-and-translation.cy.js`

#### 1. Perceived User Experience & Mental Model
* A candidate chooses "ATS Mode" to ensure their CV beats applicant tracking filters.
* As they write their work accomplishments, they expect proactive advice:
  * *"Usa verbos de acción fuertes"*
  * *"Agrega métricas cuantificables (%, $, latencia, usuarios)"*
  * *"Incluye palabras clave de tecnologías"*
* In the current UI, sections show zero visual hints or suggestions while typing. The entire `src/ai-knowledge/` engine is dormant.

#### 2. Code Findings & Root Cause Analysis
* **Files**:
  * [`src/components/Editor/AppModals.jsx:116-123`](file:///home/juanicarrizo97/Ressume/src/components/Editor/AppModals.jsx#L116-L123)
  * [`src/components/Editor/SuggestionTooltip.jsx:145-165`](file:///home/juanicarrizo97/Ressume/src/components/Editor/SuggestionTooltip.jsx#L145-L165)
  * [`src/components/Editor/AITipsSidebar.jsx:408`](file:///home/juanicarrizo97/Ressume/src/components/Editor/AITipsSidebar.jsx#L408)
  * [`src/components/CV/BaseSection.jsx:218-240`](file:///home/juanicarrizo97/Ressume/src/components/CV/BaseSection.jsx#L218-L240)
* **Code Trace**:
  1. In `AppModals.jsx`, `<SuggestionTooltip />` only mounts when `activeTooltip` exists in context.
  2. In `useCVLayout.js:110-120`, `setActiveTooltip` and `toggleTooltipForSection` exist, but **no component in `src/components/` calls them**.
  3. `AITipsSidebar.jsx` early-returns `null` because `showAITips` defaults to `false`. It is only toggled by a button in `LayoutModeToggle.jsx`, which users rarely notice.

#### 3. Recommended Resolution
* Reconnect the ATS Suggestion engine to user focus/hover:
  * When a section or bullet item is focused in ATS mode, activate contextual suggestions from `src/ai-knowledge/` (Invariant 4).
  * Display suggestions formatted strictly as **Obsidian Callouts** (Invariant 1):
    * Warning (`⚠️`) for missing metrics in bullets.
    * Info (`ℹ️`) for recommended technical keywords.
    * Danger (`🛑`) for missing email or LinkedIn in header.
  * Provide a clear, persistent toggle or icon on each section header: *"Ver consejos ATS de esta sección"*.

#### 4. Cypress Verification Criteria
* Write an automated test asserting:
  1. Focusing or clicking the ATS advice button on "EXPERIENCIA LABORAL" triggers an Obsidian Callout tooltip.
  2. The tooltip contains actionable ATS advice from `src/ai-knowledge/` (e.g., quantifiable metrics recommendation).
  3. The tooltip adheres to Invariant 3 (tracks bounding rect and does not escape viewport).

---

### [ATS-06] Hazardous Touch Target on Contact Pill Deletion

* **Severity**: `P2 - Ergonomic Misclick Hazard`
* **Status**: `[ ] Pending Investigation & Fix`
* **Target Spec**: `cypress/e2e/ux-10-contact-picker-and-social-links.cy.js`

#### 1. Perceived User Experience & Mental Model
* In the ATS header, contact items (Email, Phone, LinkedIn, GitHub, Location) appear in a clean inline row.
* A user clicks on their email to fix a typo.
* Because the minus icon (`-`) is only 11px wide and separated by just 3px from the text, a slightly misaligned click or tap permanently deletes the contact channel instead of placing the text cursor.

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
* **Root Cause**: The hit area of the delete button is under 14px, and there is no physical buffer separating the edit boundary from the delete boundary.

#### 3. Recommended Resolution
* Enforce a clean interactive separation:
  * Only reveal the delete button when the contact pill is explicitly hovered or focused.
  * Increase the button's interactive hit-box to a minimum of 20×20px (with proper padding) while keeping the visual icon subtle.
  * Place a clear 6px margin between the end of `<InlineEdit>` and the delete button.

#### 4. Cypress Verification Criteria
* Write an automated test asserting:
  1. Clicking within 5px of the end of contact text does NOT trigger deletion.
  2. Deleting a contact item requires a distinct click on the delete target.

---

### [ATS-07] Misleading Three-Dots Icon for Section Bullet Styling

* **Severity**: `P2 - Cognitive Ambiguity`
* **Status**: `[ ] Pending Investigation & Fix`
* **Target Spec**: `cypress/e2e/ux-12-bullet-styling-and-inline-toolbar.cy.js`

#### 1. Perceived User Experience & Mental Model
* In the header of each section, users see a horizontal three-dots icon (`...`).
* In modern web software, `...` universally indicates "More Options" (Duplicate, Move up, Section Settings, Delete).
* When clicked, it unexpectedly opens a popover configuring bullet point shapes (circle, square, dash) and connector lines.
* In ATS mode, bullet dots are virtually always standard round dots (`•`), making the `...` menu feel both deceptive and unnecessary.

#### 2. Code Findings & Root Cause Analysis
* **File**: [`src/components/CV/BaseSection.jsx:225-240`](file:///home/juanicarrizo97/Ressume/src/components/CV/BaseSection.jsx#L225-L240)
  ```jsx
  <button 
    className="section-bullet-style-btn"
    title="Personalizar círculo del título"
    data-testid={`btn-bullet-style-${section.id}`}
    onClick={...}
  >
    <MoreHorizontal size={14} />
  </button>
  ```
* **Root Cause**: Using `MoreHorizontal` creates false expectations of a generic context menu.

#### 3. Recommended Resolution
* Replace `<MoreHorizontal size={14} />` with an explicit iconography symbol:
  * E.g., `<List size={14} />` or `<Disc size={14} />`.
  * Update the title / tooltip to: *"Estilo de viñetas"*.
  * Or, in ATS mode, hide bullet styling entirely if ATS compliance strictly favors standard bullets.

#### 4. Cypress Verification Criteria
* Write an automated test asserting:
  1. Button has an explicit, non-misleading icon and descriptive tooltip.
  2. Opening the popover correctly modifies bullet styling without breaking section layout.

---

### [ATS-08] Pure ATS Default Template & Clean Initialization

* **Severity**: `P1 - Initial Experience Alignment`
* **Status**: `[ ] Pending Investigation & Fix`
* **Target Spec**: `cypress/e2e/ux-01-onboarding-and-navigation.cy.js` & `cypress/e2e/ux-13-version-manager-deep-dive.cy.js`

#### 1. Perceived User Experience & Mental Model
* When a user visits the app for the first time, they should immediately see the clean, professional, single-column ATS layout.
* They should not be greeted with a 2-column layout or asked to toggle modes.

#### 2. Code Findings & Root Cause Analysis
* **Files**:
  * [`src/utils/schema.js:4-20`](file:///home/juanicarrizo97/Ressume/src/utils/schema.js#L4-L20)
  * [`src/utils/atsSchemaTemplate.js:9-48`](file:///home/juanicarrizo97/Ressume/src/utils/atsSchemaTemplate.js#L9-L48)
* **Code Trace**:
  `defaultSchema` in `schema.js` still has `type: '2-column'`, `isAtsMode: false`. While `App.jsx` or version templates might switch it, the canonical default should be pure ATS.

#### 3. Recommended Resolution
* Initialize the root schema with `isAtsMode: true` and `type: '1-column'`.
* Ensure `getAtsGoldenSchemaTemplate()` serves as the default document when no saved session exists in `localStorage`.
* Remove or hide 2-column options from the Version Manager templates list for this release.

#### 4. Cypress Verification Criteria
* Write an automated test asserting:
  1. Clearing `localStorage` and opening `/` immediately mounts a single-column ATS document (`.resume--ats-mode`).
  2. No 2-column layout elements (column resizer, dual columns) exist in the DOM.

---

## Agent Execution Protocol

When an agent takes on any of the tasks above, follow this strict four-step workflow:

```
┌────────────────────────────────────────────────────────┐
│ 1. ASSESS & INVESTIGATE                                │
│    - Read the referenced code lines.                   │
│    - Replicate the friction manually or in Cypress.    │
├────────────────────────────────────────────────────────┤
│ 2. IMPLEMENT MINIMAL, CLEAN FIX                        │
│    - Adhere strictly to AGENTS.md Invariants.          │
│    - Never break existing typography/spacing tokens.   │
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
