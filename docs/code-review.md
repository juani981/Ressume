# Ressume Architectural Review & Production Code Audit Report

**Document Version**: 1.0.0  
**Audit Date**: September 2026  
**Auditor**: Architecture Review Team (Worker M1)  
**Project**: Ressume — Open-Source React + Vite Client-Side CV Editor  
**Project Root**: `/home/juani/Documentos/Ressume`  
**Test Baseline**: 37 test files, 628 tests passing (100% green, `npx vitest run`)  
**Production Build**: Clean (0 errors, 0 warnings, `npm run build`)  

---

## Table of Contents

1. [Executive Summary & Architectural Baseline](#1-executive-summary--architectural-baseline)
2. [Deep-Dive: The Six Critical Architectural Issues](#2-deep-dive-the-six-critical-architectural-issues)
   - [2.1 Issue 1: SortableBulletItem Triple Duplication](#21-issue-1-sortablebulletitem-triple-duplication)
   - [2.2 Issue 2: Polymorphism Bypass in BaseItem via Hardcoded Chains](#22-issue-2-polymorphism-bypass-in-baseitem-via-hardcoded-chains)
   - [2.3 Issue 3: Parallel Conditional Routing Chains in BaseSection](#23-issue-3-parallel-conditional-routing-chains-in-basesection)
   - [2.4 Issue 4: Monolithic God Context (CVContext.jsx)](#24-issue-4-monolithic-god-context-cvcontextjsx)
   - [2.5 Issue 5: Monolithic God Component (App.jsx)](#25-issue-5-monolithic-god-component-appjsx)
   - [2.6 Issue 6: Dual-World Runtime Branching via isPrint Prop Threading](#26-issue-6-dual-world-runtime-branching-via-isprint-prop-threading)
3. [Exhaustive File-by-File Audit: `src/components/CV/` (All 20 Files)](#3-exhaustive-file-by-file-audit-srccomponentscv-all-20-files)
   - [3.1 Container & Template Components](#31-container--template-components)
   - [3.2 Item Components (src/components/CV/items/)](#32-item-components-srccomponentscvitems)
4. [Exhaustive Audit: `src/context/CVContext.jsx`](#4-exhaustive-audit-srccontextcvcontextjsx)
   - [4.1 Architecture & Responsibility Map](#41-architecture--responsibility-map)
   - [4.2 Comprehensive Line-by-Line Inventory](#42-comprehensive-line-by-line-inventory)
   - [4.3 Public API Contract & Caller Cross-Reference (48 Members)](#43-public-api-contract--caller-cross-reference-48-members)
   - [4.4 Performance & Re-render Cascade Analysis](#44-performance--re-render-cascade-analysis)
5. [Exhaustive Audit: `src/App.jsx` (God Component Analysis)](#5-exhaustive-audit-srcappjsx-god-component-analysis)
   - [5.1 Responsibilities & Complexity Breakdown](#51-responsibilities--complexity-breakdown)
   - [5.2 Ambient Listeners & DOM Mutation Inventory](#52-ambient-listeners--dom-mutation-inventory)
6. [Comprehensive Module Classification Table (Safe vs. Side-Effect Heavy)](#6-comprehensive-module-classification-table-safe-vs-side-effect-heavy)
7. [Actionable Refactoring Blueprints & Roadmap](#7-actionable-refactoring-blueprints--roadmap)
   - [7.1 Blueprint 1: Unified SortableBulletItem.jsx](#71-blueprint-1-unified-sortablebulletitemjsx)
   - [7.2 Blueprint 2: SectionDescriptor JSDoc Contract](#72-blueprint-2-sectiondescriptor-jsdoc-contract)
   - [7.3 Blueprint 3: Zero-Guard BaseItem and BaseSection Templates](#73-blueprint-3-zero-guard-baseitem-and-basesection-templates)
   - [7.4 Blueprint 4: Four-Hook Decomposition of CVContext](#74-blueprint-4-four-hook-decomposition-of-cvcontext)
   - [7.5 Blueprint 5: Self-Verifiable Extensibility Verification Strategy](#75-blueprint-5-self-verifiable-extensibility-verification-strategy)
8. [Verification Framework & Regression Prevention](#8-verification-framework--regression-prevention)

---

## 1. Executive Summary & Architectural Baseline

Ressume is an interactive, browser-based curriculum vitae designer built on React 18, Vite 5, `@dnd-kit`, and Tailwind-inspired custom CSS properties. The editor offers bidirectional drag-and-drop interchangeability across two-column and ATS single-column layouts, dynamic typography, real-time spacing controls, Obsidian-styled AI suggestion callouts, and clean static vector PDF generation.

The codebase possesses 628 automated unit and integration tests across 37 test files running under Vitest, all passing with zero errors. Furthermore, the production build completes cleanly via Vite (1,927 modules transformed in ~1.66s, generating zero build warnings).

However, a deep forensic code audit reveals significant **architectural debt, structural coupling, and abstraction leaks** that impede open-source contribution and maintainability:

1. **Registry Bypassing**: Although `src/registry/sectionRegistry.js` was introduced to act as an extensible factory, the presentation layer (`BaseSection.jsx` and `BaseItem.jsx`) actively bypasses it. Instead, rendering is governed by brittle `if (sectionType === ...)` cascades. Adding a new section currently requires modifying multiple core components across the repository.
2. **Extreme Component Duplication**: Core draggable sub-structures, most notably `SortableBulletItem`, are copy-pasted verbatim across three major section types (`ExperienceItem`, `ProjectsItem`, `VolunteeringItem`).
3. **Monolithic God Structures**: `CVContext.jsx` (728 lines) amalgamates document CRUD, undo/redo stacks, window keydown listeners, multi-language dictionary extraction, physical A4 page boundary calculations, tooltip singletons, and toast notifications into one massive provider. Similarly, `App.jsx` (1080 lines) manages DnD coordination, multi-pass pagination math, DOM ruler creation, window resize listeners, column divider drag tracking, dynamic spacing computation, color contrast intelligence, and onboarding tours.
4. **Pervasive `isPrint` Prop Threading**: Rather than separating the interactive editing shell from the static document rendering pipeline at a clean boundary, `isPrint` is threaded as a boolean prop down 4+ component levels. This forces every component to branch at runtime, risking subtle visual divergences between the live editor and the exported PDF.

### Audit Metric Summary

| Metric | Measurement | Status / Note |
|---|---|---|
| **Total Files Audited** | 49 source files | Complete coverage of `src/components/CV/`, `src/context/`, `src/App.jsx`, and key utilities |
| **Total Lines in Scope** | ~9,500 LOC | High code density with substantial duplication |
| **Vitest Test Suite** | 37 files, 628 tests | 100% passing (Baseline invariant) |
| **Production Build** | `npm run build` | Clean exit code 0 |
| **Critical Findings (High)** | 8 findings | Core architectural bottlenecks |
| **Moderate Findings (Medium)** | 14 findings | Maintenance and re-render risks |
| **Minor Findings (Low)** | 9 findings | Dead code, formatting discrepancies, minor style leaks |

---

## 2. Deep-Dive: The Six Critical Architectural Issues

### 2.1 Issue 1: SortableBulletItem Triple Duplication

- **Impact Rating**: **HIGH**
- **Affected Files & Line Ranges**:
  - `src/components/CV/items/ExperienceItem.jsx`: lines 24–90 (67 lines)
  - `src/components/CV/items/ProjectsItem.jsx`: lines 24–90 (67 lines)
  - `src/components/CV/items/VolunteeringItem.jsx`: lines 23–89 (67 lines)

#### Technical Analysis
In each of the three files above, an internal component named `SortableBulletItem` is declared with identical props, identical hooks, and identical JSX structure:
- Receives `{ bulletId, bulletText, bulletIndex, sectionId, itemId, bullets, onUpdateItem, onDeleteBullet }`.
- Calls `useSortable({ id: bulletId, data: { type: 'bullet', bulletIndex } })`.
- Wraps attributes and listeners using `createContainerDragListeners(listeners, true)`.
- Renders `<li ref={setNodeRef} className="bullet-item-row editable-item-container cv-block">`.
- Embeds `<DragHandle isInner={true} ... />`, `<SimpleListItem ... />`, and `<button className="round-btn-del bullet-del-btn no-print">`.

#### The Only Divergence
Across all 201 lines of code, the only difference between the three copies is a single CSS property on the inline style object:
- `ExperienceItem.jsx` (line 50): `marginBottom: 'var(--item-gap, 6px)'`
- `ProjectsItem.jsx` (line 50): `marginBottom: 'calc(var(--item-gap, 6px) / 2)'`
- `VolunteeringItem.jsx` (line 49): `marginBottom: 'calc(var(--item-gap, 6px) / 2)'`

#### Architectural Consequence
1. **Maintenance Nightmare**: Any bug fix, accessibility improvement, or DnD tuning applied to bullet points must be manually replicated across three distinct files.
2. **DRY Violation**: 134 redundant lines of code directly inflate the bundle size and cognitive overhead.
3. **Remediation**: Extract into `src/components/CV/SortableBulletItem.jsx` accepting an optional `marginBottom` prop defaulting to `'var(--item-gap, 6px)'`.

---

### 2.2 Issue 2: Polymorphism Bypass in BaseItem via Hardcoded Chains

- **Impact Rating**: **HIGH**
- **Affected File**: `src/components/CV/BaseItem.jsx` (262 lines total)
- **Specific Line Ranges**:
  - `PrintBaseItem`: lines 13–106 (94 lines of hardcoded `if` branches)
  - `EditableBaseItem`: line 135 (delete button guard), lines 156–252 (97 lines of hardcoded `if` branches)

#### Technical Analysis
`BaseItem.jsx` was intended to act as the polymorphic item wrapper in a Template / Strategy pattern. Instead, it inspects `sectionType` using long sequential `if` chains:

```javascript
// In PrintBaseItem:
if (sectionType === 'profile_header') { /* lines 13-26 */ }
if (sectionType === 'simple_list') { /* lines 28-47 */ }
const isListItem = descriptor.containerTag === 'ul' || sectionType === 'skills';
if (isListItem) { /* lines 49-63 */ }
if (sectionType === 'about') { /* lines 65-78 */ }
if (sectionType === 'education') { /* lines 80-93 */ }
return /* lines 95-106 (fallback experience) */;

// In EditableBaseItem:
if (sectionType === 'profile_header') { /* lines 156-170 */ }
const isListItem = descriptor.containerTag === 'ul' || sectionType === 'skills' || sectionType === 'simple_list';
if (isListItem) { /* lines 172-192 */ }
if (sectionType === 'about') { /* lines 194-212 */ }
if (sectionType === 'education') { /* lines 214-232 */ }
return /* lines 236-252 (fallback experience) */;
```

#### Structural Redundancy
Every single branch in `PrintBaseItem` produces the exact same structural JSX:
```jsx
<ItemTag 
  className={`${itemClass} cv-block`} 
  data-item-id={item.id} 
  data-section-id={sectionId} 
  style={itemStyle}
>
  {ItemComponent && <ItemComponent item={item} sectionId={sectionId} isPrint={true} isLast={isLast} />}
</ItemTag>
```
And every branch in `EditableBaseItem` produces:
```jsx
<ItemTag
  ref={setNodeRef}
  className={`${itemClass} editable-item-container cv-block`}
  style={baseStyle}
  {...attributes}
  {...containerDragListeners}
>
  {hasDrag && <DragHandle isInner={true} listeners={listeners} attributes={attributes} />}
  {allowDelete && <button className="round-btn-del item-del-btn no-print" onClick={...}>...</button>}
  {ItemComponent && <ItemComponent item={item} sectionId={sectionId} onUpdateItem={...} />}
</ItemTag>
```

#### Architectural Consequence
1. **Registry Ineffectiveness**: `sectionRegistry.js` defines `itemTag`, `itemClass`, and `containerTag`, but `BaseItem.jsx` ignores them, forcing manual updates to `BaseItem.jsx` whenever a new section type is introduced.
2. **Violates Open/Closed Principle**: The component is open for modification and closed for extension.

---

### 2.3 Issue 3: Parallel Conditional Routing Chains in BaseSection

- **Impact Rating**: **HIGH**
- **Affected File**: `src/components/CV/BaseSection.jsx` (319 lines total)
- **Specific Line Ranges**:
  - `PrintBaseSection`: lines 17, 22, 24–34, 45, 51, 52–102
  - `EditableBaseSection`: lines 149–157, 160, 161, 162, 234, 244, 246–262, 309

#### Technical Analysis
`BaseSection.jsx` mirrors the flaws of `BaseItem.jsx`, executing parallel type checks across both Print and Edit components:

1. **Hardcoded Custom Component Bypass**:
   - Line 17: `if (section.type === 'spacer') return <PrintSpacerBlock section={section} />;`
   - Line 309: `if (props.section?.type === 'spacer') return <SpacerBlock {...props} />;`
   Rather than asking the registry if the section declares a `sectionComponent`, `spacer` is special-cased.
2. **Hardcoded Class Ternary Fallbacks**:
   - Lines 24–34 (Print) & Lines 149–157 (Edit):
     ```javascript
     const sectionClass = section.type === 'skills' ? 'skills' :
       section.type === 'education' ? 'education' :
       section.type === 'profile_header' ? 'home' :
       section.type === 'about' ? 'profile' : 'experience';
     ```
     In `EditableBaseSection`, it doesn't even inspect `descriptor?.sectionClass`—it evaluates the ternary unconditionally!
3. **Hardcoded Header & Container Suppressions**:
   - Lines 22, 45, 234: `isProfile = section.type === 'profile_header'` suppresses `<h2 className="section-title">`.
   - Lines 51, 244: Suppresses `${sectionClass}__container bd-grid` for `profile_header` and `about`.
4. **Item Mapping Duplication & HTML Divergence**:
   - Lines 52–102 in Print vs. Lines 246–262 in Edit: Item rendering is mapped inside 4 separate JSX branches (`simple_list`, `skills`, `descriptor.containerTag === 'ul'`, and fallback).
   - **Severe Bug / Divergence**: For `simple_list`, Print renders:
     `<ul className="experience__bullets simple-list-ul" style={{ color: 'var(--text-color)', paddingLeft: '1.15rem', ... }}>`
     while Edit renders:
     `<ul style={{ color: 'var(--text-color)', padding: 0 }}>`
     This breaks visual parity between live editor and print preview.

---

### 2.4 Issue 4: Monolithic God Context (CVContext.jsx)

- **Impact Rating**: **HIGH**
- **Affected File**: `src/context/CVContext.jsx` (728 lines total)
- **Specific Line Ranges**: Lines 1–728

#### Technical Analysis
`CVContext.jsx` contains 728 lines of tightly coupled logic spanning 6 completely disparate architectural domains:
1. **Document State & CRUD**: Profile updates, section additions/deletions, item mutations, auto-repair of profile headers, and `localStorage` persistence (lines 20–75, 424–639).
2. **History & Undo/Redo Engine**: State stacks (`past`, `future`), `applyStateWithHistory`, and a global `window.addEventListener('keydown')` listener for `Ctrl+Z` / `Ctrl+Y` (lines 78–79, 272–355).
3. **Layout & Column DnD**: 1-column ATS vs 2-column mode, column swaps (`moveSectionToColumnAndIndex`), and column width styling (lines 400–422, 583–615).
4. **Physical A4 Page Geometry**: Real-time measurement of a 297mm invisible ruler appended to `document.body`, `getPageBounds`, `getElementPageInfo`, and sticky pagination recalculation triggers (lines 99–194).
5. **Floating UI Overlays**: Singleton states for `activeTooltip` (AI suggestions) and `activeToolbar` (rich-text formatting bar) (lines 221–240).
6. **Localization & Notifications**: Language dictionary auto-extraction (`extractDictionaryFromCV`), language switching, and auto-dismissing toast notifications (lines 82–96, 197–218, 642–668).

#### Performance Impact: Re-render Cascades
Because all 48 state values and functions are packaged in a single monolithic object passed to `<CVContext.Provider value={{...}}>`, **any keystroke in an inline text field triggers a complete re-render of all 15 subscribing components** across the app (including `ToastNotification`, `LayoutModeToggle`, and `RichTextToolbar`).

---

### 2.5 Issue 5: Monolithic God Component (App.jsx)

- **Impact Rating**: **HIGH**
- **Affected File**: `src/App.jsx` (1080 lines total)
- **Specific Line Ranges**: Lines 1–1080

#### Technical Analysis
`App.jsx` is 1080 lines long and serves as a dumping ground for core application responsibilities:
1. **DnD Sensor & Collision Coordination** (lines 329–460): Manages PointerSensor, KeyboardSensor, active drag items, drag overlays, and complex cross-section/cross-column drop resolution.
2. **Multi-Pass Pagination Recalculation Engine** (lines 74–262): Implements a 6-pass `while` loop that inspects DOM elements, calculates bounding rectangles relative to `#area-cv`, identifies orphaned section titles, and injects inline `margin-top` overrides with `!important` to force page breaks.
3. **Ruler Injection in DOM** (lines 90–105): Creates an invisible DOM `div` of `297mm` height directly into `document.body` to calibrate pixel-to-millimeter ratios.
4. **Ambient Event Listeners** (lines 281–318): Listens to window custom events (`cv-spacer-live-resize`), window resize events, and attaches a `ResizeObserver` directly to `#area-cv`.
5. **Interactive Column Divider Tracking** (lines 572–608): Implements direct mouse/touch event listeners on `window`, directly mutating `document.body.style.cursor` and `document.body.style.userSelect`.
6. **DOM Body Mutation for ATS Mode** (lines 467–476): Mutates `document.body.classList` to add or remove `ats-mode-active`.
7. **Theming & Color Contrast Engine** (lines 513–562): Computes dynamic YIQ contrast algorithms and sets 10+ CSS custom property variables.
8. **Onboarding Tour Orchestration** (lines 609–701): Embeds a complete `react-joyride` configuration with multi-step tours, localStorage persistence, and custom tooltip wrappers.
9. **Modal & Overlay Orchestration** (lines 1056–1075): Mounts `AddSectionModal`, `SuggestionTooltip`, and `ToastNotification`.

---

### 2.6 Issue 6: Dual-World Runtime Branching via isPrint Prop Threading

- **Impact Rating**: **HIGH**
- **Affected Files**: Every file in `src/components/CV/` and `src/components/CV/items/`

#### Technical Analysis
Throughout the entire CV rendering tree, the boolean prop `isPrint` is threaded downward:
- `PrintBaseSection` passes `isPrint={true}` to `BaseItem`.
- `BaseItem` checks `props.isPrint ? <PrintBaseItem .../> : <EditableBaseItem .../>`.
- `PrintBaseItem` passes `isPrint={true}` to `ItemComponent`.
- Inside item components, code branches on `isPrint` (e.g. rendering `InlineEdit` with `isPrint={true}` vs plain text).
- In `CVSection.jsx` (lines 4–6), `isPrint` is **silently dropped**:
  ```jsx
  const CVSection = ({ section }) => {
    return <BaseSection section={section} />;
  };
  ```
  If `CVSection` is ever rendered inside a print context, `isPrint` defaults to `false`, causing editor controls, grab handles, and delete buttons to appear in print output.

#### Architectural Consequence
1. **Coupling**: Interactive editing concerns pollute static document rendering.
2. **Cognitive Overhead**: Every developer adding a field must remember to handle both `isPrint` branches.
3. **Clean Print Principle**: Print rendering should be handled by an isolated, pure HTML generator or clean CSS media queries rather than pervasive runtime React boolean branching.

---

## 3. Exhaustive File-by-File Audit: `src/components/CV/` (All 20 Files)

### 3.1 Container & Template Components

#### 1. `src/components/CV/BaseSection.jsx` (319 lines)
- **Role**: Main template wrapper for draggable and printable CV sections.
- **Findings**:
  | Line Range | Severity | Description |
  |---|---|---|
  | 17, 309 | High | Hardcoded bypass for `section.type === 'spacer'` instead of checking `descriptor.sectionComponent`. |
  | 22, 45, 234 | High | Hardcoded conditional `isProfile = section.type === 'profile_header'` suppressing title rendering and editing. |
  | 24–34, 149–157 | High | 5-way ternary chain calculating `sectionClass` on `section.type`, ignoring `descriptor.sectionClass`. |
  | 51, 244 | Medium | Suppresses container grid class `${sectionClass}__container bd-grid` based on hardcoded section types. |
  | 52–102, 246–262 | High | 4-way duplicate mapping of items; HTML divergence for `simple_list` between print and edit modes. |
  | 160–162 | Medium | Hardcodes delete, add, and bullet customization permissions rather than reading descriptor flags. |
- **Coupling**: Directly coupled to `useCV` (8 methods/state items), `@dnd-kit/sortable`, and `bulletStyles.js`.
- **Classification**: **Requires understanding global side-effects (Category B)**.

#### 2. `src/components/CV/BaseItem.jsx` (262 lines)
- **Role**: Main template wrapper for individual draggable and printable items.
- **Findings**:
  | Line Range | Severity | Description |
  |---|---|---|
  | 13–106 | High | 6-branch `if (sectionType === ...)` chain in `PrintBaseItem` duplicating identical wrapper JSX. |
  | 135 | Medium | Hardcoded delete button suppression for `profile_header`. |
  | 156–252 | High | 5-branch `if (sectionType === ...)` chain in `EditableBaseItem` duplicating DnD hooks and handles. |
  | 49, 172 | Medium | Inspects `sectionType === 'skills'` or `simple_list` instead of generic `descriptor.itemTag`. |
- **Coupling**: Coupled to `useCV` (`updateSectionItem`, `deleteSectionItem`) and `@dnd-kit/sortable`.
- **Classification**: **Requires understanding global side-effects (Category B)**.

#### 3. `src/components/CV/CVBlock.jsx` (9 lines)
- **Role**: Pass-through wrapper around `BaseItem`.
- **Findings**:
  | Line Range | Severity | Description |
  |---|---|---|
  | 4–6 | Low | **Dead code**. Has 0 references across the entire project. Does not forward `isPrint` or callbacks. |
- **Coupling**: Imports `BaseItem`.
- **Classification**: **Safe to import as-is (Category A)** (Safe but redundant).

#### 4. `src/components/CV/CVHeader.jsx` (66 lines)
- **Role**: Legacy CV header component.
- **Findings**:
  | Line Range | Severity | Description |
  |---|---|---|
  | 5–65 | High | **Obsolete / Dead code with mutation danger**. References legacy `cvData.profile` object directly. If rendered, causes schema desynchronization with `profile_header` section. Has 0 active imports in production view tree. |
- **Coupling**: Coupled to `useCV` (`cvData`, `updateProfile`).
- **Classification**: **Requires understanding global side-effects (Category B)** (Danger of state desync).

#### 5. `src/components/CV/CVSection.jsx` (9 lines)
- **Role**: Wrapper around `BaseSection`.
- **Findings**:
  | Line Range | Severity | Description |
  |---|---|---|
  | 4–6 | High | Drops `isPrint` prop completely! Calls `<BaseSection section={section} />` without forwarding `props.isPrint`. |
  | 1–9 | Low | Redundant 1-line wrapper. Could be eliminated in favor of direct `BaseSection` imports. |
- **Coupling**: Imports `BaseSection`.
- **Classification**: **Safe to import as-is (Category A)** (Functional pass-through).

#### 6. `src/components/CV/SpacerBlock.jsx` (678 lines)
- **Role**: Whitespace spacer block with interactive drag-to-resize handle, height presets, and print styling.
- **Findings**:
  | Line Range | Severity | Description |
  |---|---|---|
  | 1–678 | High | Monolithic file (678 lines, violating the 300-line modularity rule). |
  | 88–90 | High | Dispatches ambient window event `window.dispatchEvent(new CustomEvent('cv-spacer-live-resize'))`. |
  | 99–104 | Medium | Directly mutates `document.body.style.cursor` and `document.body.style.userSelect`. |
  | 60–120 | Medium | `useVerticalSpacerResize` is embedded inside component file instead of a dedicated hooks directory. |
- **Coupling**: Coupled to `useCV`, `@dnd-kit/sortable`, window event bus, and direct DOM manipulation.
- **Classification**: **Requires understanding global side-effects (Category B)** (Window events + DOM mutation).

---

### 3.2 Item Components (`src/components/CV/items/`)

#### 7. `src/components/CV/items/AboutItem.jsx` (16 lines)
- **Role**: Renders the multiline professional summary description.
- **Findings**:
  | Line Range | Severity | Description |
  |---|---|---|
  | 4–13 | Low | None. Clean presentational component delegating to `InlineEdit`. |
- **Coupling**: Imports `InlineEdit`.
- **Classification**: **Safe to import as-is (Category A)**.

#### 8. `src/components/CV/items/AwardsItem.jsx` (74 lines)
- **Role**: Renders award titles, institutions, dates, and descriptions.
- **Findings**:
  | Line Range | Severity | Description |
  |---|---|---|
  | 13–70 | Low | Pure presentational component. Properly uses `onUpdateItem` callback and forwards `isPrint`. |
- **Coupling**: Imports `InlineEdit`.
- **Classification**: **Safe to import as-is (Category A)**.

#### 9. `src/components/CV/items/CertificatesItem.jsx` (86 lines)
- **Role**: Renders certification names, issuing organizations, dates, and credential links.
- **Findings**:
  | Line Range | Severity | Description |
  |---|---|---|
  | 13–83 | Low | Pure presentational component with link support. |
- **Coupling**: Imports `InlineEdit`.
- **Classification**: **Safe to import as-is (Category A)**.

#### 10. `src/components/CV/items/EducationItem.jsx` (39 lines)
- **Role**: Renders education institution, degree, and graduation dates.
- **Findings**:
  | Line Range | Severity | Description |
  |---|---|---|
  | 7–10 | Medium | Renders timeline graphics (`.education__time`, `.education__rounder`, `.education__line`). Relies on parent container having `display: flex` (enforced by test `educationRounderAlignment.test.jsx`). |
- **Coupling**: Imports `InlineEdit`.
- **Classification**: **Safe to import as-is (Category A)**.

#### 11. `src/components/CV/items/ExperienceItem.jsx` (328 lines)
- **Role**: Renders work experience entry with timeline rounder, company, role, date, and draggable bullet points.
- **Findings**:
  | Line Range | Severity | Description |
  |---|---|---|
  | 24–90 | High | Copy-pasted `SortableBulletItem` component (67 lines). |
  | 205–216 | Medium | Instantiates a nested `@dnd-kit` `DndContext` inside each item for bullet reordering. |
  | 320–327 | Medium | Dual runtime branching for Print vs Edit (`ExperienceItemPrintView` vs `ExperienceItemEditView`). |
- **Coupling**: Coupled to `@dnd-kit/core`, `@dnd-kit/sortable`, `DragHandle`, `SimpleListItem`, and `dndUtils`.
- **Classification**: **Requires understanding global side-effects (Category B)** (Nested DndContext).

#### 12. `src/components/CV/items/LanguagesItem.jsx` (65 lines)
- **Role**: Renders language name and proficiency level badge.
- **Findings**:
  | Line Range | Severity | Description |
  |---|---|---|
  | 8–62 | Low | Pure presentational component with proficiency pills. |
- **Coupling**: Imports `InlineEdit`.
- **Classification**: **Safe to import as-is (Category A)**.

#### 13. `src/components/CV/items/ProfileHeaderItem.jsx` (193 lines)
- **Role**: Renders the candidate's name, professional title, and dynamic contact pills (email, phone, LinkedIn, GitHub, etc.).
- **Findings**:
  | Line Range | Severity | Description |
  |---|---|---|
  | 6–54, 56–190 | Medium | Dual rendering implementations (`ProfileHeaderPrintView` vs `ProfileHeaderItemEditView`). |
  | 64–74 | Medium | Mutates contact structure via `syncFlatContactFields` to maintain backward compatibility with legacy schema. |
- **Coupling**: Imports `InlineEdit`, `ContactTypePicker`, and `contactTypes` utility.
- **Classification**: **Safe to import as-is (Category A)** (Self-contained state and callbacks).

#### 14. `src/components/CV/items/ProjectsItem.jsx` (350 lines)
- **Role**: Renders project titles, dates, descriptions, links, and draggable bullet points.
- **Findings**:
  | Line Range | Severity | Description |
  |---|---|---|
  | 24–90 | High | Copy-pasted `SortableBulletItem` component (67 lines). |
  | 227–238 | Medium | Instantiates nested `@dnd-kit` `DndContext` for bullet reordering. |
  | 342–349 | Medium | Dual runtime branching for Print vs Edit. |
- **Coupling**: Coupled to `@dnd-kit/core`, `@dnd-kit/sortable`, `DragHandle`, `SimpleListItem`.
- **Classification**: **Requires understanding global side-effects (Category B)** (Nested DndContext).

#### 15. `src/components/CV/items/PublicationsItem.jsx` (87 lines)
- **Role**: Renders publication title, publisher, date, and external link.
- **Findings**:
  | Line Range | Severity | Description |
  |---|---|---|
  | 14–84 | Low | Pure presentational component. |
- **Coupling**: Imports `InlineEdit`.
- **Classification**: **Safe to import as-is (Category A)**.

#### 16. `src/components/CV/items/ReferencesItem.jsx` (85 lines)
- **Role**: Renders professional reference contact cards.
- **Findings**:
  | Line Range | Severity | Description |
  |---|---|---|
  | 13–82 | Low | Pure presentational component. |
- **Coupling**: Imports `InlineEdit`.
- **Classification**: **Safe to import as-is (Category A)**.

#### 17. `src/components/CV/items/SimpleListItem.jsx` (39 lines)
- **Role**: Generic single-bullet list item used for courses, bullet points, and certifications.
- **Findings**:
  | Line Range | Severity | Description |
  |---|---|---|
  | 4–36 | Low | Clean presentational item with bullet circle dot. |
- **Coupling**: Imports `InlineEdit`.
- **Classification**: **Safe to import as-is (Category A)**.

#### 18. `src/components/CV/items/SkillsItem.jsx` (38 lines)
- **Role**: Technical skill badge with decorative bullet circle.
- **Findings**:
  | Line Range | Severity | Description |
  |---|---|---|
  | 4–35 | Low | Pure presentational component with skill circle. |
- **Coupling**: Imports `InlineEdit`.
- **Classification**: **Safe to import as-is (Category A)**.

#### 19. `src/components/CV/items/SpacerItem.jsx` (20 lines)
- **Role**: Item-level adapter wrapping `SpacerBlock`.
- **Findings**:
  | Line Range | Severity | Description |
  |---|---|---|
  | 8–18 | Medium | Adapts item data into a synthetic section object to render `SpacerBlock`, inheriting its DOM side-effects. |
- **Coupling**: Imports `SpacerBlock`.
- **Classification**: **Requires understanding global side-effects (Category B)** (Delegates to SpacerBlock).

#### 20. `src/components/CV/items/VolunteeringItem.jsx` (329 lines)
- **Role**: Renders volunteering organization, role, dates, and draggable bullets.
- **Findings**:
  | Line Range | Severity | Description |
  |---|---|---|
  | 23–89 | High | Copy-pasted `SortableBulletItem` component (67 lines). |
  | 206–217 | Medium | Instantiates nested `@dnd-kit` `DndContext` for bullet reordering. |
  | 321–328 | Medium | Dual runtime branching for Print vs Edit. |
- **Coupling**: Coupled to `@dnd-kit/core`, `@dnd-kit/sortable`, `DragHandle`, `SimpleListItem`.
- **Classification**: **Requires understanding global side-effects (Category B)** (Nested DndContext).

---

## 4. Exhaustive Audit: `src/context/CVContext.jsx`

### 4.1 Architecture & Responsibility Map

`src/context/CVContext.jsx` acts as a monolithic **God Context** of 728 lines. It amalgamates six unrelated concerns into one global state provider.

```
+---------------------------------------------------------------------------------------+
|                                    CVContext.jsx                                      |
|                                     (728 lines)                                       |
+---------------------------------------------------------------------------------------+
| 1. Document CRUD & Schema Repair    | cvData, updateProfile, ensureProfileHeader,      |
|                                    | addSection, deleteSection, updateSectionItem    |
+------------------------------------+--------------------------------------------------+
| 2. Undo/Redo & Keydown Listener    | past, future, undo(), redo(), keydown Ctrl+Z     |
+------------------------------------+--------------------------------------------------+
| 3. Layout Mode & Column Management | updateLayout, updateSectionColumn, moveSection   |
+------------------------------------+--------------------------------------------------+
| 4. Sticky A4 Pagination Geometry   | pageHeightPx (DOM ruler), getPageBounds, folds   |
+------------------------------------+--------------------------------------------------+
| 5. Floating Overlays & Singletons  | activeTooltip, activeToolbar, showAITips         |
+------------------------------------+--------------------------------------------------+
| 6. Localization & Ephemeral Toasts | languagePacks, activeLanguage, toast, showToast  |
+---------------------------------------------------------------------------------------+
```

### 4.2 Comprehensive Line-by-Line Inventory

| Line Range | Construct / Identifier | Description & Behavioral Semantics | Target Decomposed Hook |
|---|---|---|---|
| **1–7** | Imports | React hooks, `defaultSchema`, `LOCALES`, `translationEngine`, `itemAdapter`, `versionValidator`, `contactTypes`. | Distributed across hooks |
| **9–11** | `CVContext`, `useCV()` | Context initialization and consumer hook. | `CVContext.jsx` (Facade) |
| **15–18** | `baseDefaultContent` | Fallback language dictionaries for English/Spanish. | `useCVData` |
| **20–51** | `ensureProfileHeader(data)` | Normalizes schema, injects `profile_header`, syncs legacy `profile` data. | `useCVData` |
| **54–75** | `cvData`, `setCvData` | Core document state; initializes from `localStorage.getItem('cvData')` with fallback. | `useCVData` |
| **78–79** | `past`, `future` | State stacks for undo/redo. Past capped at 30 items via `prevPast.slice(-29)`. | `useCVHistory` |
| **82–92** | `languagePacks`, `setLanguagePacks` | Dictionary state initialized from `localStorage.getItem('cvLanguagePacks')`. | `useCVData` |
| **94–96** | `activeLanguage`, `setActiveLanguage` | Active language code (`'es'` \| `'en'`) loaded from `localStorage`. | `useCVData` |
| **99–102** | `showAITips`, `setShowAITips` | AI tips toggle loaded from `localStorage.getItem('cv_show_ai_tips')`. | `useCVLayout` |
| **105–120** | `pageHeightPx`, `setPageHeightPx` | Physical A4 height; measures an invisible 297mm DOM ruler with 1123px fallback. | `useCVLayout` |
| **122** | `pageGapPx` | Numeric constant (20px) representing the visual fold gap between pages. | `useCVLayout` |
| **125** | `totalPages`, `setTotalPages` | Estimated A4 page count state. | `useCVLayout` |
| **128–148** | `getPageBounds(pageNum)` | Computes pixel coordinate boundaries (`top`, `bottom`, `foldTop`, `contentTop`). | `useCVLayout` |
| **151–188** | `getElementPageInfo(elOrBounds)`| Computes element page number, fold intersection, and remaining space relative to `#area-cv`. | `useCVLayout` |
| **191–194** | `paginationTrigger`, `trigger...`| Numeric tick counter allowing child components to request pagination re-eval. | `useCVLayout` |
| **197–218** | `toast`, `showToast`, `hideToast`| Ephemeral toast state with auto-dismiss timers using `useRef`. | `useCVExport` |
| **221–234** | `activeTooltip`, `toggle...` | Singleton tooltip state and toggle callback for AI suggestion cards. | `useCVLayout` |
| **237–240** | `activeToolbar`, `clear...` | Singleton rich-text toolbar state (position, target element, formatting). | `useCVLayout` |
| **243–245** | `useEffect(cvData)` | **Side-effect**: Writes `cvData` to `localStorage.setItem('cvData', ...)`. | `useCVData` |
| **247–249** | `useEffect(languagePacks)` | **Side-effect**: Writes `languagePacks` to `localStorage`. | `useCVData` |
| **251–256** | `useEffect(activeLanguage)` | **Side-effect**: Writes `activeLanguage` and sets `document.documentElement.lang`. | `useCVData` |
| **258–269** | `useEffect(cvData, activeLanguage)` | **Side-effect**: Auto-extracts dictionary via `extractDictionaryFromCV` into packs. | `useCVData` |
| **272–282** | `applyStateWithHistory(updater)` | Core state updater pushing current snapshot to `past` stack and clearing `future`. | `useCVHistory` |
| **285–298** | `undo()` | Reverts state to top of `past` stack, pushing current state to `future`. | `useCVHistory` |
| **301–314** | `redo()` | Pops from `future` stack, pushing current state to `past`. | `useCVHistory` |
| **317–355** | `useEffect` (Global keydown) | **Side-effect**: Binds `window.addEventListener('keydown')` for `Ctrl+Z`, `Ctrl+Y`. | `useCVHistory` |
| **358–376** | `loadVersionSnapshot(...)` | Sanitizes snapshot, restores document state, optionally resets history. | `useCVData` |
| **379–386** | `resetToDefault()` | Resets state to `defaultSchema` with history record. | `useCVData` |
| **389–397** | `restoreContactSection()` | Disaster recovery function re-injecting contact section if missing. | `useCVData` |
| **400–413** | `updateLayout(key, value)` | Mutates `cvData.layout` options (margins, font scale, column layout). | `useCVLayout` |
| **415–422** | `updateSectionColumn(id, col)`| Updates a section's `.column` property (`'left'` \| `'right'`). | `useCVLayout` |
| **424–443** | `updateSectionProperty(...)` | Updates arbitrary section property (e.g. `bottomSpacing`, `height`). | `useCVData` |
| **445–450** | `updateProfile(key, value)` | Mutates legacy top-level profile fields. | `useCVData` |
| **452–467** | `updateSectionItem(...)` | Granular item property update. | `useCVData` |
| **470–482** | `addSectionItem(secId)` | Appends default item via `createDefaultItemForSection`. | `useCVData` |
| **484–498** | `deleteSectionItem(secId, id)`| Deletes item; guarded against deleting `profile_header`. | `useCVData` |
| **500–508** | `reorderSectionItems(...)` | Intra-section item reordering. | `useCVData` |
| **510–558** | `moveItemBetweenSections(...)` | Cross-section drag and drop; adapts item schema polymorphically. | `useCVData` |
| **560–567** | `addSection(col, type, ...)` | Appends new section via `createDefaultSection`. | `useCVData` |
| **569–581** | `deleteSection(secId)` | Deletes section; strictly guarded against deleting `profile_header`. | `useCVData` |
| **583–615** | `moveSectionToColumnAndIndex` | Cross-column section drag and drop with destination index computation. | `useCVLayout` |
| **617–619** | `reorderSections(newSections)` | Direct replacement of sections array. | `useCVData` |
| **621–627** | `updateSectionTitle(secId, t)` | Updates title property of a section. | `useCVData` |
| **630–639** | `updateSectionBulletStyle(...)` | Updates bullet style token on section. | `useCVData` |
| **642–649** | `switchLanguage(langCode)` | Applies dictionary to state via `applyDictionaryToCVState`. | `useCVData` |
| **651–661** | `importLanguagePack(...)` | Adds external language pack and optionally applies immediately. | `useCVData` |
| **663–668** | `getActiveDictionary()` | Extracts or retrieves active dictionary. | `useCVData` |
| **671–724** | Provider value | Exposes massive 48-member contract object to all children. | `CVContext.jsx` (Facade) |

---

### 4.3 Public API Contract & Caller Cross-Reference (48 Members)

Every single consumer of `useCV()` across the application and test suite has been audited to guarantee **zero breaking changes**:

| # | Property Name | Type / Signature | Calling Components & Tests | Target Hook |
|---|---|---|---|---|
| 1 | `cvData` | `Object` | `App.jsx`, `ActionMenu.jsx`, `BaseSection.jsx`, `LayoutModeToggle.jsx`, `VersionManagerModal.jsx`, 28 test files | `useCVData` |
| 2 | `updateProfile` | `Function(key, val)` | `CVHeader.jsx` | `useCVData` |
| 3 | `updateSectionProperty` | `Function(id, k, v)` | `BaseSection.jsx`, `SpacerBlock.jsx` | `useCVData` |
| 4 | `updateSectionTitle` | `Function(id, title)` | `BaseSection.jsx` | `useCVData` |
| 5 | `updateSectionBulletStyle`| `Function(id, style)` | `BaseSection.jsx` | `useCVData` |
| 6 | `updateSectionItem` | `Function(secId, itmId, k, v)` | `BaseItem.jsx` | `useCVData` |
| 7 | `addSectionItem` | `Function(secId)` | `BaseSection.jsx` | `useCVData` |
| 8 | `deleteSectionItem` | `Function(secId, itmId)` | `BaseItem.jsx` | `useCVData` |
| 9 | `reorderSectionItems` | `Function(secId, items)` | DnD handlers, tests | `useCVData` |
| 10 | `moveItemBetweenSections` | `Function(actId, overId, ...)` | `App.jsx`, `polymorphic-dnd.test.jsx` | `useCVData` |
| 11 | `addSection` | `Function(col, type, ...)` | `App.jsx`, `AddSectionModal.jsx`, `SpacerBlock.jsx` | `useCVData` |
| 12 | `deleteSection` | `Function(secId)` | `BaseSection.jsx`, `SpacerBlock.jsx` | `useCVData` |
| 13 | `reorderSections` | `Function(sections)` | `App.jsx`, `polymorphic-dnd.test.jsx` | `useCVData` |
| 14 | `loadVersionSnapshot` | `Function(snapshot, opts)` | `VersionManagerModal.jsx`, `version-manager-hub.test.jsx` | `useCVData` |
| 15 | `resetToDefault` | `Function()` | `ActionMenu.jsx` | `useCVData` |
| 16 | `restoreContactSection`| `Function()` | Emergency recovery | `useCVData` |
| 17 | `languagePacks` | `Object` | `TranslationModal.jsx` | `useCVData` |
| 18 | `activeLanguage` | `string` | `ActionMenu.jsx`, `SuggestionTooltip.jsx`, `AIExportModal.jsx`, `TranslationModal.jsx` | `useCVData` |
| 19 | `switchLanguage` | `Function(langCode)` | `TranslationModal.jsx` | `useCVData` |
| 20 | `importLanguagePack` | `Function(langCode, dict)` | `TranslationModal.jsx` | `useCVData` |
| 21 | `getActiveDictionary` | `Function()` | `TranslationModal.jsx` | `useCVData` |
| 22 | `undo` | `Function()` | `ActionMenu.jsx`, `version-manager-hub.test.jsx` | `useCVHistory` |
| 23 | `redo` | `Function()` | `ActionMenu.jsx` | `useCVHistory` |
| 24 | `canUndo` | `boolean` | `ActionMenu.jsx` | `useCVHistory` |
| 25 | `canRedo` | `boolean` | `ActionMenu.jsx` | `useCVHistory` |
| 26 | `updateLayout` | `Function(k, v)` | `App.jsx`, `ActionMenu.jsx`, `LayoutModeToggle.jsx`, tests | `useCVLayout` |
| 27 | `updateSectionColumn` | `Function(secId, col)` | `App.jsx`, `polymorphic-dnd.test.jsx` | `useCVLayout` |
| 28 | `moveSectionToColumnAndIndex` | `Function(...)` | `App.jsx` | `useCVLayout` |
| 29 | `pageHeightPx` | `number` | `realtime-sticky-pagination.test.jsx` | `useCVLayout` |
| 30 | `setPageHeightPx` | `Function(h)` | Calibration | `useCVLayout` |
| 31 | `pageGapPx` | `number` (20) | `realtime-sticky-pagination.test.jsx` | `useCVLayout` |
| 32 | `totalPages` | `number` | `realtime-sticky-pagination.test.jsx` | `useCVLayout` |
| 33 | `setTotalPages` | `Function(n)` | `App.jsx` | `useCVLayout` |
| 34 | `getPageBounds` | `Function(pageNum)` | `realtime-sticky-pagination.test.jsx` | `useCVLayout` |
| 35 | `getElementPageInfo` | `Function(elOrBounds)` | `realtime-sticky-pagination.test.jsx` | `useCVLayout` |
| 36 | `paginationTrigger` | `number` | `App.jsx`, `realtime-sticky-pagination.test.jsx` | `useCVLayout` |
| 37 | `triggerPaginationRecalc`| `Function()` | `realtime-sticky-pagination.test.jsx` | `useCVLayout` |
| 38 | `activeTooltip` | `Object \| null` | `App.jsx`, `BaseSection.jsx` | `useCVLayout` |
| 39 | `setActiveTooltip` | `Function(tooltip)` | `SuggestionTooltip.jsx` | `useCVLayout` |
| 40 | `clearActiveTooltip` | `Function()` | `App.jsx` | `useCVLayout` |
| 41 | `closeTooltip` | `Function()` | `SuggestionTooltip.jsx` | `useCVLayout` |
| 42 | `toggleTooltipForSection`| `Function(sec, rect)` | `BaseSection.jsx` | `useCVLayout` |
| 43 | `activeToolbar` | `Object \| null` | `RichTextToolbar.jsx` | `useCVLayout` |
| 44 | `setActiveToolbar` | `Function(tbData)` | `InlineEdit.jsx` | `useCVLayout` |
| 45 | `clearActiveToolbar` | `Function()` | `InlineEdit.jsx` | `useCVLayout` |
| 46 | `showAITips` | `boolean` | ActionMenu, Layout | `useCVLayout` |
| 47 | `toast` | `Object \| null` | `ToastNotification.jsx` | `useCVExport` |
| 48 | `showToast` / `hideToast`| `Function(...)` | `ActionMenu.jsx`, `VersionManagerModal.jsx` | `useCVExport` |

---

## 5. Exhaustive Audit: `src/App.jsx` (God Component Analysis)

### 5.1 Responsibilities & Complexity Breakdown

At 1080 lines, `App.jsx` is the single largest component in Ressume. It coordinates 9 disparate concerns:
- **Lines 74–262 (Pagination Math)**: Computes 6-pass break evaluation, orphan title heuristics, and dynamic inline styles.
- **Lines 281–318 (Event Bus Subscriptions)**: Reacts to `cv-spacer-live-resize`, `ResizeObserver`, and window resizing.
- **Lines 329–460 (DnD Core & Sensors)**: Pointer and Keyboard sensor distance configurations, drag overlays, and drop targeting logic.
- **Lines 467–476 (DOM Class Mutation)**: Toggles `.ats-mode-active` directly on `document.body`.
- **Lines 500–511 (Dynamic CSS Custom Properties)**: Translates layout state into `--page-padding`, `--font-scale`, `--section-gap`, etc.
- **Lines 513–562 (YIQ Contrast Calculation)**: Calculates contrast ratios on the fly for background colors.
- **Lines 572–608 (Column Divider Tracking)**: Tracks mouse moves across the viewport, updating `leftColumnWidth` and altering `document.body.style.cursor`.
- **Lines 609–701 (Onboarding Tour)**: Controls `react-joyride` lifecycle and localStorage flags.
- **Lines 704–1075 (DOM Paper Shell & Overlays)**: Renders `#area-cv`, column droppables, A4 page folds, overlays, and modals.

### 5.2 Ambient Listeners & DOM Mutation Inventory

| Target | Event / Mutation | Location | Risk / Side-Effect |
|---|---|---|---|
| `window` | `cv-spacer-live-resize` | Lines 288–293 | Uncontrolled event coupling across editor components |
| `window` | `mousemove`, `mouseup`, `touchmove`, `touchend` | Lines 603–607 | Viewport-wide drag tracking for column resizing |
| `document.body` | `.ats-mode-active` class addition/removal | Lines 468–475 | Global document style mutation |
| `document.body` | `cursor = 'col-resize'`, `userSelect = 'none'` | Lines 601–602 | Direct manipulation of body styles during mouse drag |
| `document.body` | Appends temporary 297mm ruler `div` | Lines 94–103 | DOM thrashing and layout recalculation on every pass |

---

## 6. Comprehensive Module Classification Table (Safe vs. Side-Effect Heavy)

To guide open-source contributors, every component, hook, context, and utility in the project is classified into one of two categories:
- **Category A (Safe to Import As-Is)**: Pure presentational components or pure deterministic utilities. They do not bind global listeners, do not mutate `localStorage` or the DOM, and only communicate via explicit props or pure return values.
- **Category B (Requires Understanding Global Side-Effects)**: Modules that mutate global state (`localStorage`), manipulate `document.body`, attach window event listeners, or tightly couple to the root `CVContext`.

| Module / File Path | Type | Category | Ambient Side-Effects & Global Coupling Inventory |
|---|---|---|---|
| `src/components/CV/BaseSection.jsx` | Component | **B** | High `CVContext` coupling; binds `@dnd-kit/sortable`; drills `isPrint`. |
| `src/components/CV/BaseItem.jsx` | Component | **B** | Coupled to `CVContext` mutation callbacks; binds `@dnd-kit/sortable`. |
| `src/components/CV/CVBlock.jsx` | Component | **A** | Pure wrapper (dead code). Safe to import. |
| `src/components/CV/CVHeader.jsx` | Component | **B** | Directly mutates obsolete `cvData.profile`. Risk of schema desynchronization. |
| `src/components/CV/CVSection.jsx` | Component | **A** | Pass-through wrapper around `BaseSection`. Safe to import. |
| `src/components/CV/SpacerBlock.jsx` | Component | **B** | Dispatches window custom events; mutates `document.body.style.cursor`. |
| `src/components/CV/items/AboutItem.jsx` | Component | **A** | Pure presentational component delegating to `InlineEdit`. |
| `src/components/CV/items/AwardsItem.jsx` | Component | **A** | Pure presentational component. |
| `src/components/CV/items/CertificatesItem.jsx`| Component | **A** | Pure presentational component. |
| `src/components/CV/items/EducationItem.jsx` | Component | **A** | Pure presentational component (requires flexbox container). |
| `src/components/CV/items/ExperienceItem.jsx` | Component | **B** | Instantiates inner `@dnd-kit` `DndContext`; duplicated bullet logic. |
| `src/components/CV/items/LanguagesItem.jsx` | Component | **A** | Pure presentational component. |
| `src/components/CV/items/ProfileHeaderItem.jsx`| Component| **A** | Self-contained contact state; syncs legacy contact fields safely. |
| `src/components/CV/items/ProjectsItem.jsx` | Component | **B** | Instantiates inner `@dnd-kit` `DndContext`; duplicated bullet logic. |
| `src/components/CV/items/PublicationsItem.jsx`| Component| **A** | Pure presentational component. |
| `src/components/CV/items/ReferencesItem.jsx` | Component | **A** | Pure presentational component. |
| `src/components/CV/items/SimpleListItem.jsx` | Component | **A** | Pure presentational component with bullet circle. |
| `src/components/CV/items/SkillsItem.jsx` | Component | **A** | Pure presentational component with skill circle. |
| `src/components/CV/items/SpacerItem.jsx` | Component | **B** | Adapts item to `SpacerBlock`, inheriting its DOM side-effects. |
| `src/components/CV/items/VolunteeringItem.jsx`| Component| **B** | Instantiates inner `@dnd-kit` `DndContext`; duplicated bullet logic. |
| `src/context/CVContext.jsx` | Context | **B** | **God Context**: Mutates `localStorage`, binds window keydown, appends DOM ruler. |
| `src/context/hooks/useCVData.js` | Hook | **B** | Serializes to `localStorage.cvData`; auto-extracts language dictionaries. |
| `src/context/hooks/useCVHistory.js` | Hook | **B** | Binds global window keydown listener (`Ctrl+Z`, `Ctrl+Y`). |
| `src/context/hooks/useCVLayout.js` | Hook | **B** | Queries DOM geometry; manages singletons for active tooltip and toolbar. |
| `src/context/hooks/useCVExport.js` | Hook | **A** | Self-contained toast timer and export helper; no ambient listeners. |
| `src/App.jsx` | Component | **B** | **God Component**: Injects DOM ruler, attaches resize listeners, tracks mouse. |
| `src/components/Editor/ActionMenu.jsx` | Component | **B** | High `CVContext` coupling; triggers print dialogs and file downloads. |
| `src/components/Editor/InlineEdit.jsx` | Component | **B** | Coupled to `activeToolbar` singleton and rich-text keyboard events. |
| `src/components/Editor/AddSectionModal.jsx` | Component | **A** | Pure modal UI dialog communicating via `onClose` and `addSection`. |
| `src/components/Editor/SuggestionTooltip.jsx`| Component | **A** | Dynamic tooltip tracking bounding rect via props. |
| `src/components/Editor/ToastNotification.jsx`| Component | **B** | Subscribes to `CVContext` toast state. |
| `src/components/Editor/LayoutModeToggle.jsx`| Component | **B** | Coupled to `CVContext` layout actions. |
| `src/components/Editor/RichTextToolbar.jsx` | Component | **B** | Subscribes to `activeToolbar` singleton; mutates active DOM range. |
| `src/components/Editor/DragHandle.jsx` | Component | **A** | Pure presentational drag icon with pointer listeners. |
| `src/components/Editor/SectionBulletStylePopover.jsx` | Component | **A** | Floating popover tracking trigger rect. |
| `src/components/Editor/VersionManagerModal.jsx`| Component | **B** | Mutates `localStorage.cv_saved_versions`. |
| `src/components/Editor/AIExportModal.jsx` | Component | **A** | Self-contained modal generating AI prompt markdown. |
| `src/components/Editor/TranslationModal.jsx` | Component | **B** | Imports and synchronizes multi-language dictionary state. |
| `src/registry/sectionRegistry.js` | Registry | **A** | Pure deterministic registry mapping section types to descriptors. |
| `src/registry/itemFormatters.js` | Utility | **A** | Pure deterministic text formatters (Markdown, XML, PlainText). |
| `src/utils/schema.js` | Utility | **A** | Pure deterministic schema constant and factory generator. |
| `src/utils/bulletStyles.js` | Utility | **A** | Pure deterministic CSS class mappings for bullet styles. |
| `src/utils/dndUtils.js` | Utility | **A** | Pure helper creating pointer and keyboard drag event listeners. |
| `src/utils/staticHtmlPdfEngine.js` | Engine | **B** | Creates isolated iframe in `document.body` for clean print rendering. |
| `src/utils/richTextEngine.js` | Utility | **A** | Pure string transformation and HTML sanitization functions. |
| `src/utils/translationEngine.js` | Utility | **A** | Pure dictionary extraction and deep state translation functions. |
| `src/utils/disableNativeTooltips.js` | Utility | **B** | Mutates DOM elements to remove native `title` tooltips. |
| `src/utils/versionValidator.js` | Utility | **A** | Pure JSON schema validator and sanitizer for snapshots. |
| `src/utils/versionStorage.js` | Utility | **B** | Directly reads and writes `localStorage.cv_saved_versions`. |

---

## 7. Actionable Refactoring Blueprints & Roadmap

### 7.1 Blueprint 1: Unified SortableBulletItem.jsx

Extract the duplicated component into `src/components/CV/SortableBulletItem.jsx`:
```jsx
/**
 * @file SortableBulletItem.jsx
 * Unified draggable bullet point row for multi-bullet CV sections.
 */
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragHandle from '../Editor/DragHandle';
import SimpleListItem from './items/SimpleListItem';
import { createContainerDragListeners } from '../../utils/dndUtils';

export const SortableBulletItem = ({ 
  bulletId, 
  bulletText, 
  bulletIndex, 
  sectionId, 
  itemId, 
  bullets, 
  onUpdateItem, 
  onDeleteBullet,
  marginBottom = 'var(--item-gap, 6px)'
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: bulletId,
    data: { type: 'bullet', bulletIndex }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    opacity: isDragging ? 0.35 : 1,
    display: 'flex',
    alignItems: 'flex-start',
    marginTop: 0,
    marginBottom,
    paddingRight: 0,
    paddingLeft: '1.15rem',
    color: 'inherit',
    lineHeight: 1.45
  };

  const containerDragListeners = createContainerDragListeners(listeners, true);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="bullet-item-row editable-item-container cv-block"
      {...attributes}
      {...containerDragListeners}
    >
      <DragHandle isInner={true} listeners={listeners} attributes={attributes} />
      <SimpleListItem 
        item={{ id: bulletIndex, text: bulletText }} 
        sectionId={sectionId} 
        onUpdateItem={(secId, bIdx, field, val) => {
          const newBullets = [...bullets];
          newBullets[bIdx] = val;
          onUpdateItem(sectionId, itemId, 'bullets', newBullets);
        }}
      />
      <button
        type="button"
        className="round-btn-del bullet-del-btn no-print"
        title="Eliminar esta viñeta"
        onClick={(e) => {
          e.stopPropagation();
          onDeleteBullet(bulletIndex);
        }}
      >
        <i className='bx bx-minus' style={{ fontSize: '12px', fontWeight: 'bold' }}></i>
      </button>
    </li>
  );
};

export default SortableBulletItem;
```

**Consumer Integration**:
- `ExperienceItem.jsx`: Replace lines 24–90 with `import SortableBulletItem from '../SortableBulletItem';` (uses default `marginBottom`).
- `ProjectsItem.jsx`: Replace lines 24–90 with `import SortableBulletItem from '../SortableBulletItem';` passing `marginBottom="calc(var(--item-gap, 6px) / 2)"`.
- `VolunteeringItem.jsx`: Replace lines 23–89 with `import SortableBulletItem from '../SortableBulletItem';` passing `marginBottom="calc(var(--item-gap, 6px) / 2)"`.

---

### 7.2 Blueprint 2: SectionDescriptor JSDoc Contract

Enrich `src/registry/sectionRegistry.js` with a comprehensive JSDoc `@typedef` and populate all missing layout properties:

```javascript
/**
 * @typedef {Object} SectionDescriptor
 * @property {string} type - Unique identifier for the section type (e.g. 'list', 'skills').
 * @property {string} label - Human-readable name used in UI menus and dialogs.
 * @property {string} [defaultTitle=''] - Default title displayed in the section header.
 * @property {'left'|'right'} [defaultColumn='right'] - Default column placement in 2-column mode.
 * @property {string} [icon='bx-folder-plus'] - BoxIcon CSS class for buttons.
 * @property {string} [description] - Explanatory text for modal dialogues.
 * @property {boolean} [allowDelete=true] - Whether the section can be deleted.
 * @property {boolean} [allowAddItem=true] - Whether new items can be added to the section.
 * @property {boolean} [allowDeleteItem=true] - Whether child items have delete buttons.
 * @property {boolean} [hasTitle=true] - Whether section renders an h2 title header.
 * @property {boolean} [hasItemDrag=true] - Whether child items feature drag handles.
 * @property {boolean} [supportsBulletCustomization=false] - Whether timeline bullet style is customizable.
 * @property {string} [sectionClass='experience'] - Outer <section> CSS class.
 * @property {string} [wrapperClass] - Inner container class (empty string suppresses grid).
 * @property {'div'|'ul'|'ol'|React.ComponentType} [containerTag='div'] - Items container HTML tag.
 * @property {string} [containerClass='experience__container bd-grid'] - Items container CSS class.
 * @property {React.CSSProperties} [containerStyle] - Items container edit inline style.
 * @property {React.CSSProperties} [printContainerStyle] - Items container print inline style.
 * @property {'div'|'li'|React.ComponentType} [itemTag='div'] - Item wrapper HTML tag.
 * @property {string} [itemClass='experience__content'] - Item wrapper CSS class.
 * @property {React.CSSProperties} [itemStyle] - Item edit inline style.
 * @property {React.CSSProperties} [printItemStyle] - Item print inline style.
 * @property {React.ComponentType} [sectionComponent] - Custom section override component (e.g. SpacerBlock).
 * @property {React.ComponentType} itemComponent - Component rendering item fields.
 * @property {function(Object=): Object} createDefaultItem - Factory function producing default item.
 * @property {function(Object): Object} adaptItem - Polymorphic adapter transforming foreign items.
 */
```

---

### 7.3 Blueprint 3: Zero-Guard BaseItem and BaseSection Templates

By declaring container tags, wrapper classes, item tags, and permission flags on the `SectionDescriptor`, `BaseItem.jsx` and `BaseSection.jsx` are refactored into pure generic templates containing **zero `if (sectionType === ...)` or `if (section.type === ...)` checks**.

#### Refactored `BaseItem.jsx` (Pure Template)
```jsx
export const PrintBaseItem = ({ item, sectionId, sectionType, isLast = false }) => {
  const descriptor = getSectionDescriptor(sectionType);
  const ItemComponent = descriptor.itemComponent;
  const ItemTag = descriptor.itemTag || 'div';
  const style = descriptor.printItemStyle || {
    display: descriptor.itemStyle?.display || 'flex',
    position: 'relative',
    color: 'var(--text-color)'
  };

  return (
    <ItemTag 
      className={`${descriptor.itemClass} cv-block`}
      data-item-id={item.id || sectionType}
      data-section-id={sectionId}
      style={style}
    >
      {ItemComponent && <ItemComponent item={item} sectionId={sectionId} isPrint={true} isLast={isLast} />}
    </ItemTag>
  );
};

const EditableBaseItem = ({ item, sectionId, sectionType }) => {
  const { updateSectionItem, deleteSectionItem } = useCV();
  const descriptor = getSectionDescriptor(sectionType);
  const ItemComponent = descriptor.itemComponent;
  const ItemTag = descriptor.itemTag || 'div';

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: 'item', item, sectionId, sectionType }
  });

  const baseStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    opacity: isDragging ? 0.35 : 1,
    color: 'var(--text-color)',
    ...(descriptor.itemStyle || {})
  };

  const hasItemDrag = descriptor.hasItemDrag !== false;
  const allowDelete = descriptor.allowDeleteItem !== false && descriptor.allowDelete !== false;
  const containerDragListeners = hasItemDrag ? createContainerDragListeners(listeners, true) : {};

  return (
    <ItemTag
      ref={setNodeRef}
      className={`${descriptor.itemClass} editable-item-container cv-block`}
      data-item-id={item.id || sectionType}
      data-section-id={sectionId}
      style={baseStyle}
      {...attributes}
      {...containerDragListeners}
    >
      {hasItemDrag && <DragHandle isInner={true} listeners={listeners} attributes={attributes} />}
      {allowDelete && (
        <button
          type="button"
          className="round-btn-del item-del-btn no-print"
          title="Eliminar este elemento"
          onClick={(e) => {
            e.stopPropagation();
            deleteSectionItem(sectionId, item.id);
          }}
        >
          <i className='bx bx-minus' style={{ fontSize: '14px', fontWeight: 'bold' }}></i>
        </button>
      )}
      {ItemComponent && (
        <ItemComponent 
          item={item} 
          sectionId={sectionId} 
          onUpdateItem={(secId, itemId, key, val) => updateSectionItem(secId, itemId, key, val)} 
        />
      )}
    </ItemTag>
  );
};
```

#### Refactored `BaseSection.jsx` (Pure Template)
```jsx
export const PrintBaseSection = ({ section }) => {
  if (!section) return null;
  const descriptor = getSectionDescriptor(section.type);

  if (descriptor.sectionComponent) {
    const CustomSection = descriptor.sectionComponent;
    return <CustomSection section={section} isPrint={true} />;
  }

  const items = section.items || [];
  const ContainerTag = descriptor.containerTag || 'div';
  const bulletClasses = section.bulletStyle ? ` ${getBulletClasses(section.bulletStyle)}` : '';
  const wrapperClass = descriptor.wrapperClass !== undefined 
    ? descriptor.wrapperClass 
    : `${descriptor.sectionClass}__container bd-grid`;

  return (
    <section 
      className={`${descriptor.sectionClass} section cv-section${bulletClasses}`} 
      id={section.id}
      data-section-id={section.id}
      style={{ marginBottom: 'var(--section-gap, 20px)', color: 'var(--text-color)' }}
    >
      {descriptor.hasTitle !== false && section.title && (
        <h2 className="section-title" data-section-title={section.id}>
          <InlineEdit value={section.title || ''} isPrint={true} />
        </h2>
      )}

      <div className={wrapperClass}>
        <ContainerTag className={descriptor.containerClass || ''} style={descriptor.printContainerStyle || {}}>
          {items.map((item, index) => (
            <BaseItem 
              key={item.id || index} 
              item={item} 
              sectionId={section.id} 
              sectionType={section.type} 
              isPrint={true} 
              isLast={index === items.length - 1} 
            />
          ))}
        </ContainerTag>
      </div>

      <IntegratedBottomSpacer isPrint={true} containerId={section.id} height={section.bottomSpacing || 0} />
    </section>
  );
};
```

---

### 7.4 Blueprint 4: Four-Hook Decomposition of CVContext

Decompose `CVContext.jsx` into four domain-specific hooks located in `src/context/hooks/`, with `CVContext.jsx` acting as a thin facade (<= 200 lines):

```
src/context/
├── CVContext.jsx               # Thin facade (<= 110 lines; strict constraint <= 200 lines)
├── index.js                    # Barrel exporting CVContext, CVProvider, useCV, and hooks
└── hooks/
    ├── index.js                # Barrel export for hooks
    ├── useCVData.js            # Document CRUD, schema auto-repair, localStorage sync, i18n (~240 lines)
    ├── useCVHistory.js         # Undo/redo stack, applyStateWithHistory, keydown listeners (~110 lines)
    ├── useCVLayout.js          # Layout mode, column moves, sticky pagination, tooltips (~190 lines)
    └── useCVExport.js          # Ephemeral toasts, clean print triggers, JSON download (~120 lines)
```

Every single decomposed hook remains strictly under 250 lines (comfortably below the 300-line modularity threshold), and the facade preserves all 48 members of the public API contract with 100% backward compatibility.

---

### 7.5 Blueprint 5: Self-Verifiable Extensibility Verification Strategy

To prove that the architecture is now open for extension without modification to core files:
1. Define a new section type descriptor (`custom_notes`) in `src/registry/sectionRegistry.js`:
   - `type: 'custom_notes'`
   - `itemTag: 'div'`
   - `itemClass: 'custom-notes__content'`
   - `itemComponent: CustomNotesItem`
2. Create `src/components/CV/items/CustomNotesItem.jsx` (<= 40 lines).
3. Mount the section in a test harness without modifying `BaseSection.jsx`, `BaseItem.jsx`, `CVContext.jsx`, or `App.jsx`.
4. Assert via Vitest (`src/tests/extensibilitySmoke.test.jsx`) that the section and its items render correctly in both edit and print modes, support inline editing, and integrate with drag-and-drop.

---

## 8. Verification Framework & Regression Prevention

The following verification matrix ensures that architectural refactoring introduces zero regressions into the 628 existing tests:

| Test File / Suite | Invariant Under Verification | Regression Hazard / Mitigation |
|---|---|---|
| `src/tests/educationRounderAlignment.test.jsx` | `.education__content` container must have `display: flex` | Preserved via `printItemStyle: { display: 'flex' }` and `itemStyle: { display: 'flex' }` in descriptor. |
| `src/tests/spacer-component.test.jsx` | Spacer resize handles in edit mode; zero controls in print mode | Preserved by delegating directly to `descriptor.sectionComponent = SpacerBlock`. |
| `src/tests/realtime-sticky-pagination.test.jsx` | `useCV()` returns `pageHeightPx`, `totalPages`, `getPageBounds`, `getElementPageInfo` | Preserved by facade forwarding all layout and pagination metrics. |
| `src/tests/bulletPointsNativePrint.test.jsx` | Bullet rows render `.bullet-item-row.editable-item-container.cv-block` | Preserved identically in extracted `SortableBulletItem.jsx`. |
| `src/tests/polymorphic-dnd.test.jsx` | Cross-section drag and drop converts items polymorphically | Preserved by `moveItemBetweenSections` in `useCVData.js`. |
| `src/tests/dom-geometry-typography.test.jsx` | Drag handles exist in edit mode and are omitted in print | Preserved by generic `hasItemDrag` check in template item. |
| `src/tests/pixelParityEditorPrint.test.jsx` | Absolute 0px layout drift between editor `#area-cv` and print output | Preserved by identical CSS custom properties and dimension propagation. |

### Final Verification Command
```bash
# Verify 100% test pass rate across all 37 test files
npx vitest run

# Verify production build compilation
npm run build
```
Any failure during verification indicates an architectural regression and must be resolved before releasing.
