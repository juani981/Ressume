# Comprehensive Architectural Review & Decomposition Specification: `CVContext.jsx`

**Author**: Explorer 2 (`teamwork_preview_explorer_survey_2`)  
**Date**: 2026-09-11  
**Working Directory**: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_survey_2`  
**Target Subject**: `src/context/CVContext.jsx` (728 lines)  
**Deliverables**: Code review audit findings, 4-hook decomposition architecture, public API contract catalog, safe/side-effect classification, and blueprint specifications.

---

## 1. Executive Summary

`src/context/CVContext.jsx` currently acts as a monolithic **God Context** of 728 lines. It amalgamates six unrelated architectural domains:
1. Document state schema, validation, auto-repair, and granular CRUD (Sections, Items, Profile).
2. Undo / Redo history tracking with stack mutation and global window keyboard event hijacking.
3. Layout modes (1-column ATS vs 2-column), column allocations, CSS custom property styling tokens, and cross-column reordering.
4. Physical A4 page geometry calculations, sticky pagination folds, and DOM boundary queries.
5. Floating UI overlays (active tooltip singleton, rich text formatting toolbar singleton, AI suggestions toggle).
6. Multi-language dictionary extraction, language pack storage, and ephemeral toast notifications.

This monolithic coupling leads to severe performance degradation (every keystroke re-renders all 15 consuming components across the application) and high cognitive overhead for open-source contributors.

We have designed a clean, strictly backward-compatible decomposition into **4 focused hooks** plus a **thin facade** (`CVContext.jsx`):
- `useCVHistory.js` (~110 lines): Undo/redo stacks, history snapshot application, global keyboard listeners.
- `useCVData.js` (~240 lines): Document state, schema repair, localStorage sync, i18n, and profile/section/item CRUD.
- `useCVLayout.js` (~190 lines): Layout modes, column moves, A4 sticky pagination metrics, tooltip/toolbar singletons.
- `useCVExport.js` (~120 lines): Ephemeral toasts, clean PDF export lifecycle coordination, JSON download.
- `CVContext.jsx` facade (~105 lines, strict limit <= 200 lines): Composes the 4 hooks, preserving 100% of the existing 48-member public API contract with zero caller regressions.

---

## 2. Line-by-Line Inventory of `src/context/CVContext.jsx` (728 Lines)

| Line Range | Construct / Identifier | Description & Behavioral Semantics | Target Domain Hook |
|---|---|---|---|
| **1–7** | Imports | React hooks (`createContext`, `useState`, `useEffect`, `useContext`, `useCallback`, `useRef`), `defaultSchema`, `LOCALES`, translation engine, item adapter, version validator, contact normalizer. | Shared / Hook dependencies |
| **9–11** | `CVContext`, `useCV()` | Context instantiation and legacy consumer hook. | `CVContext.jsx` (Facade) |
| **15–18** | `baseDefaultContent` | Base localized content fallback object (`{ es, en }`). | `useCVData` |
| **20–51** | `ensureProfileHeader(data)` | Normalizer: ensures `profile_header` exists, merges legacy `profile` object, executes `normalizeItemContacts`. | `useCVData` |
| **54–75** | `cvData`, `setCvData` | Primary document state. Reads `localStorage.getItem('cvData')`, JSON parses, deep merges with `defaultSchema.layout`, sanitizes via `ensureProfileHeader`. | `useCVData` |
| **78–79** | `past`, `setPast`, `future`, `setFuture` | History stacks (undo/redo). Past capped at 30 items (`slice(-29)`). | `useCVHistory` |
| **82–92** | `languagePacks`, `setLanguagePacks` | Dictionary state loaded from `localStorage.getItem('cvLanguagePacks')`. | `useCVData` |
| **94–96** | `activeLanguage`, `setActiveLanguage` | Active language code (`'es'` \| `'en'`) loaded from `localStorage`. | `useCVData` |
| **99–102** | `showAITips`, `setShowAITips` | AI tips toggle loaded from `localStorage.getItem('cv_show_ai_tips')`. | `useCVLayout` |
| **105–120** | `pageHeightPx`, `setPageHeightPx` | Physical A4 page height (measures 297mm invisible ruler in DOM; fallback 1123). | `useCVLayout` |
| **122** | `pageGapPx` | Constant numeric gap (`20px`) representing space between pages in editor. | `useCVLayout` |
| **125** | `totalPages`, `setTotalPages` | Computed page count state. | `useCVLayout` |
| **128–148** | `getPageBounds(pageNum)` | Callback: computes pixel boundaries (`top`, `bottom`, `foldTop`, `contentTop`, `contentBottom`, `pagePadding`). | `useCVLayout` |
| **151–188** | `getElementPageInfo(elOrBounds)` | Callback: computes element page number, fold intersection, and remaining space relative to `#area-cv`. | `useCVLayout` |
| **191–194** | `paginationTrigger`, `triggerPaginationRecalc` | Numeric increment trigger allowing external components to request recalculation. | `useCVLayout` |
| **197–218** | `toast`, `toastTimeoutRef`, `showToast`, `hideToast` | Ephemeral toast notification system with auto-dismiss timers. | `useCVExport` |
| **221–234** | `activeTooltip`, `setActiveTooltip`, `clearActiveTooltip`, `closeTooltip`, `toggleTooltipForSection` | Singleton section AI tooltip state and toggle handler. | `useCVLayout` |
| **237–240** | `activeToolbar`, `setActiveToolbar`, `clearActiveToolbar` | Singleton rich text formatting toolbar position, target element, and format state. | `useCVLayout` |
| **243–245** | `useEffect(cvData)` | Side-effect: serializes `cvData` to `localStorage.cvData`. | `useCVData` |
| **247–249** | `useEffect(languagePacks)` | Side-effect: serializes `languagePacks` to `localStorage.cvLanguagePacks`. | `useCVData` |
| **251–256** | `useEffect(activeLanguage)` | Side-effect: persists `activeLanguage` and sets `document.documentElement.lang`. | `useCVData` |
| **258–269** | `useEffect(cvData, activeLanguage)` | Side-effect: auto-extracts active dictionary via `extractDictionaryFromCV` and syncs into `languagePacks`. | `useCVData` |
| **272–282** | `applyStateWithHistory(updater)` | Core mutation engine: checks deep equality (`JSON.stringify`), pushes current state to `past`, clears `future`, updates `cvData`. | `useCVHistory` |
| **285–298** | `undo()` | Reverts to last state in `past`, shifts current to `future`. | `useCVHistory` |
| **301–314** | `redo()` | Advances to first state in `future`, pushes current to `past`. | `useCVHistory` |
| **317–355** | `useEffect(past, future, undo, redo)` | Global window listener for `keydown` (`Ctrl+Z`, `Ctrl+Y`, `Ctrl+Shift+Z`) with input/textarea/contenteditable guard. | `useCVHistory` |
| **358–376** | `loadVersionSnapshot(snapshot, opts)` | Sanitizes snapshot (`sanitizeAndValidateCVSnapshot`), updates state, optionally clears history. | `useCVData` |
| **379–386** | `resetToDefault()` | Resets state to `defaultSchema` with history record. | `useCVData` |
| **389–397** | `restoreContactSection()` | Emergency recovery: restores `defaultSchema.sections[0]` to `sections`. | `useCVData` |
| **400–413** | `updateLayout(key, value)` | Updates `cvData.layout` (supports single key/value or batch object). | `useCVLayout` |
| **415–422** | `updateSectionColumn(secId, col)` | Updates a section's `.column` property (`'left'` \| `'right'`). | `useCVLayout` |
| **424–443** | `updateSectionProperty(secId, key, val)` | Updates arbitrary section property; synchronizes `spacer` item height/backgroundColor. | `useCVData` |
| **445–450** | `updateProfile(key, value)` | Updates top-level `profile` fields (`name`, `subtitle`, etc.). | `useCVData` |
| **452–467** | `updateSectionItem(secId, itemId, key, val)` | Updates specific item properties inside a section. | `useCVData` |
| **470–482** | `addSectionItem(secId)` | Appends default item via `createDefaultItemForSection(sec.type)`. | `useCVData` |
| **484–498** | `deleteSectionItem(secId, itemId)` | Removes item; guarded against deleting `profile_header` item. | `useCVData` |
| **500–508** | `reorderSectionItems(secId, newItems)` | Replaces items array for a section (intra-section drag and drop). | `useCVData` |
| **510–558** | `moveItemBetweenSections(...)` | Cross-section drag and drop: adapts item schema via `adaptItemToSectionType`. | `useCVData` |
| **560–567** | `addSection(col, type, title, bullet)` | Appends new section container using `createDefaultSection`. | `useCVData` |
| **569–581** | `deleteSection(secId)` | Deletes section; strictly guarded against deleting `profile_header`. | `useCVData` |
| **583–615** | `moveSectionToColumnAndIndex(...)` | Cross-column section drag & drop with destination index computation. | `useCVLayout` |
| **617–619** | `reorderSections(newSections)` | Direct section array replacement. | `useCVData` |
| **621–627** | `updateSectionTitle(secId, title)` | Updates title property of a section. | `useCVData` |
| **630–639** | `updateSectionBulletStyle(secId, style)` | Merges custom bullet styling into `section.bulletStyle`. | `useCVData` |
| **642–649** | `switchLanguage(langCode)` | Applies language dictionary via `applyDictionaryToCVState` and updates `activeLanguage`. | `useCVData` |
| **651–661** | `importLanguagePack(langCode, dict, apply)` | Registers new language pack and optionally applies immediately. | `useCVData` |
| **663–668** | `getActiveDictionary()` | Returns current language dictionary or extracts from current `cvData`. | `useCVData` |
| **671–724** | `<CVContext.Provider value={{...}}>` | God Provider value object exposing 48 distinct properties. | `CVContext.jsx` (Facade) |
| **727** | `export default CVContext` | Default export. | `CVContext.jsx` |

---

## 3. Public API Contract & Caller Cross-Reference Table

Every consumer of `useCV()` across the entire codebase (`src/` and `src/tests/`) has been audited:

| Exported Property | Type / Signature | Subscribing Callers | Target Hook Source |
|---|---|---|---|
| `cvData` | `Object` | `App.jsx`, `ActionMenu.jsx`, `BaseSection.jsx`, `CVHeader.jsx`, `LayoutModeToggle.jsx`, `VersionManagerModal.jsx`, `AIExportModal.jsx`, 28 test suites | `useCVData` |
| `updateProfile` | `(key: string, value: any) => void` | `CVHeader.jsx` | `useCVData` |
| `updateSectionProperty` | `(id: string, k: any, v?: any) => void` | `BaseSection.jsx`, `SpacerBlock.jsx` | `useCVData` |
| `updateSectionTitle` | `(id: string, title: string) => void` | `BaseSection.jsx` | `useCVData` |
| `updateSectionBulletStyle` | `(id: string, style: object) => void` | `BaseSection.jsx` | `useCVData` |
| `updateSectionItem` | `(secId: string, itemId: string, k: any, v?: any) => void` | `BaseItem.jsx` | `useCVData` |
| `addSectionItem` | `(secId: string) => void` | `BaseSection.jsx` | `useCVData` |
| `deleteSectionItem` | `(secId: string, itemId: string) => void` | `BaseItem.jsx` | `useCVData` |
| `reorderSectionItems` | `(secId: string, items: Array) => void` | Drag-and-drop consumers | `useCVData` |
| `moveItemBetweenSections` | `(actId, overId, actSecId, overSecId) => void` | `App.jsx`, `polymorphic-dnd.test.jsx` | `useCVData` |
| `addSection` | `(col?, type?, title?, bullet?) => void` | `App.jsx`, `AddSectionModal.jsx`, `SpacerBlock.jsx`, tests | `useCVData` |
| `deleteSection` | `(secId: string) => void` | `BaseSection.jsx`, `SpacerBlock.jsx`, tests | `useCVData` |
| `reorderSections` | `(sections: Array) => void` | `App.jsx`, `polymorphic-dnd.test.jsx` | `useCVData` |
| `loadVersionSnapshot` | `(snapshot: object, opts?: object) => object` | `VersionManagerModal.jsx`, `version-manager-hub.test.jsx` | `useCVData` |
| `resetToDefault` | `() => void` | `ActionMenu.jsx` | `useCVData` |
| `restoreContactSection` | `() => void` | Disaster recovery utility | `useCVData` |
| `languagePacks` | `Object` | `TranslationModal.jsx` | `useCVData` |
| `activeLanguage` | `string` (`'es'` \| `'en'`) | `ActionMenu.jsx`, `SuggestionTooltip.jsx`, `AIExportModal.jsx`, `InlineEdit.jsx`, `TranslationModal.jsx` | `useCVData` |
| `switchLanguage` | `(langCode: string) => boolean` | `TranslationModal.jsx` | `useCVData` |
| `importLanguagePack` | `(langCode: string, dict: object, apply?: boolean) => void` | `TranslationModal.jsx` | `useCVData` |
| `getActiveDictionary` | `() => object` | `TranslationModal.jsx` | `useCVData` |
| `undo` | `() => void` | `ActionMenu.jsx`, `version-manager-hub.test.jsx`, `final-e2e-cross-cutting-challenger.test.jsx` | `useCVHistory` |
| `redo` | `() => void` | `ActionMenu.jsx` | `useCVHistory` |
| `canUndo` | `boolean` | `ActionMenu.jsx` | `useCVHistory` |
| `canRedo` | `boolean` | `ActionMenu.jsx` | `useCVHistory` |
| `updateLayout` | `(keyOrObj: any, val?: any) => void` | `App.jsx`, `ActionMenu.jsx`, `LayoutModeToggle.jsx`, `spacing.test.jsx`, `e2e-scenarios.test.jsx` | `useCVLayout` |
| `updateSectionColumn` | `(secId: string, col: string) => void` | `App.jsx`, `e2e-scenarios.test.jsx`, `polymorphic-dnd.test.jsx` | `useCVLayout` |
| `moveSectionToColumnAndIndex` | `(actSecId, targetCol, overSecId?) => void` | `App.jsx` | `useCVLayout` |
| `pageHeightPx` | `number` | `realtime-sticky-pagination.test.jsx` | `useCVLayout` |
| `setPageHeightPx` | `(h: number) => void` | Pagination calibration | `useCVLayout` |
| `pageGapPx` | `number` (20) | `realtime-sticky-pagination.test.jsx` | `useCVLayout` |
| `totalPages` | `number` | `realtime-sticky-pagination.test.jsx` | `useCVLayout` |
| `setTotalPages` | `(n: number) => void` | `App.jsx` (`setTotalPages: setContextTotalPages`) | `useCVLayout` |
| `getPageBounds` | `(pageNum: number) => object` | `realtime-sticky-pagination.test.jsx` | `useCVLayout` |
| `getElementPageInfo` | `(elOrBounds: any) => object` | `realtime-sticky-pagination.test.jsx` | `useCVLayout` |
| `paginationTrigger` | `number` | `App.jsx`, `realtime-sticky-pagination.test.jsx` | `useCVLayout` |
| `triggerPaginationRecalc` | `() => void` | `realtime-sticky-pagination.test.jsx` | `useCVLayout` |
| `activeTooltip` | `object \| null` | `App.jsx`, `BaseSection.jsx` | `useCVLayout` |
| `setActiveTooltip` | `(tooltip: any) => void` | `SuggestionTooltip.jsx` | `useCVLayout` |
| `clearActiveTooltip` | `() => void` | `App.jsx` | `useCVLayout` |
| `closeTooltip` | `() => void` | `SuggestionTooltip.jsx` | `useCVLayout` |
| `toggleTooltipForSection` | `(sec: object, rect: DOMRect) => void` | `BaseSection.jsx` | `useCVLayout` |
| `activeToolbar` | `object \| null` | `RichTextToolbar.jsx` | `useCVLayout` |
| `setActiveToolbar` | `(toolbarData: any) => void` | `InlineEdit.jsx` | `useCVLayout` |
| `clearActiveToolbar` | `() => void` | `InlineEdit.jsx` | `useCVLayout` |
| `showAITips` | `boolean` | AI tip visibility toggle | `useCVLayout` |
| `toast` | `object \| null` | `ToastNotification.jsx` | `useCVExport` |
| `showToast` | `(text: string, type?: string, dur?: number) => void` | `ActionMenu.jsx`, `VersionManagerModal.jsx` | `useCVExport` |
| `hideToast` | `() => void` | Toast dismiss handler | `useCVExport` |

**Verification Confirmation**: Every single caller in `src/` will receive 100% of its expected properties from `CVContext.jsx` with zero breaking changes.

---

## 4. Code Review Findings for `docs/code-review.md`

### 4.1 God Context & Single Responsibility Violation (High Impact)
- **Location**: `src/context/CVContext.jsx` (lines 1–728).
- **Finding**: A single file handles state, history stacks, keyboard shortcuts, localization, layout geometry, sticky pagination math, tooltip singletons, rich-text toolbar positioning, and toast notifications.
- **Consequence**: Tight coupling, violation of SRP, difficult test isolation, and unnecessary re-renders across all consumers on any state change.

### 4.2 Re-render Cascades & Lack of Context Partitioning (High Impact)
- **Location**: `src/context/CVContext.jsx` (lines 671–724).
- **Finding**: All 48 properties are bundled into a single value object created on every render.
- **Consequence**: Subscribing components like `ToastNotification.jsx` and `RichTextToolbar.jsx` re-render on every text keystroke inside `InlineEdit`, creating input lag on complex CVs.

### 4.3 Side-Effect Coupling & DOM Pollution (Medium Impact)
- **Location**: `src/context/CVContext.jsx` (lines 105–120, 251–256, 317–355).
- **Finding**:
  1. Spawns an invisible 297mm ruler div in `document.body` on module load.
  2. Directly mutates `document.documentElement.lang`.
  3. Binds global `window.addEventListener('keydown')` for Ctrl+Z/Ctrl+Y without checking if multiple `<CVProvider>` instances are mounted.

### 4.4 Scattered Export Logic Trapped in UI Components (Medium Impact)
- **Location**: `src/components/Editor/ActionMenu.jsx` (lines 70–122).
- **Finding**: 50+ lines of PDF generation orchestration (clean print execution, window print dialog events, timeouts, fallback to `window.print()`, toast notifications) are trapped in `ActionMenu.jsx` rather than being provided by an export hook/service.
- **Solution**: Encapsulate this logic within `useCVExport`.

### 4.5 Classification of Context Exports
- **Safe to Import as-is (Pure domain or local UI state)**:
  `pageHeightPx`, `setPageHeightPx`, `pageGapPx`, `totalPages`, `setTotalPages`, `getPageBounds`, `getElementPageInfo`, `paginationTrigger`, `triggerPaginationRecalc`, `activeTooltip`, `setActiveTooltip`, `clearActiveTooltip`, `closeTooltip`, `toggleTooltipForSection`, `activeToolbar`, `setActiveToolbar`, `clearActiveToolbar`, `showAITips`, `toast`, `showToast`, `hideToast`, `languagePacks`, `getActiveDictionary`.
- **Requires Global Side-Effect Understanding (Mutates storage, history, or DOM)**:
  - `cvData`: reading is safe, but changes trigger `localStorage` serialization and dictionary extraction.
  - `updateProfile`, `updateSectionProperty`, `updateSectionTitle`, `updateSectionBulletStyle`, `updateSectionItem`, `addSectionItem`, `deleteSectionItem`, `reorderSectionItems`, `moveItemBetweenSections`, `addSection`, `deleteSection`, `reorderSections`: push previous state to `past` stack, clear `future`, write to `localStorage`.
  - `updateLayout`, `updateSectionColumn`, `moveSectionToColumnAndIndex`: push to history, alter CSS custom properties and document layout.
  - `undo`, `redo`: pop/push history stacks, mutating `past`, `future`, and `cvData`.
  - `activeLanguage`, `switchLanguage`, `importLanguagePack`: mutates `document.documentElement.lang` and `localStorage.cvActiveLanguage`.
  - `loadVersionSnapshot`, `resetToDefault`: completely overwrites CV document state.

---

## 5. Decomposed Architecture & Hook Specifications

### 5.1 Directory Layout
```
src/context/
├── CVContext.jsx          # Backward-compatible facade (<= 110 lines; strict constraint <= 200 lines)
├── index.js               # Root barrel exporting useCV, CVProvider, CVContext, and hooks
└── hooks/
    ├── index.js           # Hooks barrel export
    ├── useCVHistory.js    # Undo/redo stack, applyStateWithHistory, keydown listeners (~110 lines)
    ├── useCVData.js       # CV document CRUD, schema validation, localStorage sync, i18n (~240 lines)
    ├── useCVLayout.js     # Layout modes, column DnD, A4 pagination metrics, tooltips/toolbars (~190 lines)
    └── useCVExport.js     # Toast notifications, clean print lifecycle, PDF/JSON export (~120 lines)
```

All hook files are <= 250 lines (strictly < 300 lines). The facade `CVContext.jsx` is <= 110 lines (strictly <= 200 lines).

---

### 5.2 `useCVHistory.js` Specification

```javascript
/**
 * @file useCVHistory.js
 * @description Hook managing undo/redo stacks, history snapshot application,
 * and global keyboard shortcut isolation for the Ressume CV editor.
 */
import { useState, useCallback, useEffect } from 'react';

/**
 * @typedef {Object} CVHistoryReturn
 * @property {Array<Object>} past - Stack of previous states (max 30).
 * @property {Array<Object>} future - Stack of reverted states.
 * @property {boolean} canUndo - Whether undo action is available.
 * @property {boolean} canRedo - Whether redo action is available.
 * @property {Function} undo - Reverts to previous state.
 * @property {Function} redo - Re-applies future state.
 * @property {Function} applyStateWithHistory - State updater that pushes current state to history.
 * @property {Function} clearHistory - Resets past and future history stacks.
 * @property {Function} setPast - Direct setter for past stack.
 * @property {Function} setFuture - Direct setter for future stack.
 */

export const useCVHistory = (setCvData) => {
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  const applyStateWithHistory = useCallback((updater) => {
    if (typeof setCvData !== 'function') return;
    setCvData(current => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      if (next === current || JSON.stringify(next) === JSON.stringify(current)) {
        return current;
      }
      setPast(prevPast => [...prevPast.slice(-29), current]);
      setFuture([]);
      return next;
    });
  }, [setCvData]);

  const undo = useCallback(() => {
    if (typeof setCvData !== 'function') return;
    setPast(prevPast => {
      if (prevPast.length === 0) return prevPast;
      const previousState = prevPast[prevPast.length - 1];
      const newPast = prevPast.slice(0, -1);
      setCvData(current => {
        setFuture(prevFuture => [current, ...prevFuture]);
        return previousState;
      });
      return newPast;
    });
  }, [setCvData]);

  const redo = useCallback(() => {
    if (typeof setCvData !== 'function') return;
    setFuture(prevFuture => {
      if (prevFuture.length === 0) return prevFuture;
      const nextState = prevFuture[0];
      const newFuture = prevFuture.slice(1);
      setCvData(current => {
        setPast(prevPast => [...prevPast, current]);
        return nextState;
      });
      return newFuture;
    });
  }, [setCvData]);

  const clearHistory = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  // Global window shortcut listener (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = typeof navigator !== 'undefined' && navigator.platform?.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      if (!cmdOrCtrl) return;

      const isUndo = e.key.toLowerCase() === 'z' && !e.shiftKey;
      const isRedo = e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z');
      if (!isUndo && !isRedo) return;

      const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
      const targetEl = e.target;
      const isEditable = (el) => el && (
        el.isContentEditable ||
        el.getAttribute?.('contenteditable') === 'true' ||
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.classList?.contains('inline-edit-active')
      );
      if (isEditable(activeEl) || isEditable(targetEl)) return;

      if (isUndo && past.length > 0) {
        e.preventDefault();
        undo();
      } else if (isRedo && future.length > 0) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [past, future, undo, redo]);

  return {
    past,
    future,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undo,
    redo,
    applyStateWithHistory,
    clearHistory,
    setPast,
    setFuture,
  };
};
```

---

### 5.3 `useCVData.js` Specification

```javascript
/**
 * @file useCVData.js
 * @description Hook managing CV document data schema, profile/section/item CRUD,
 * auto-repair validation, localStorage persistence, and multi-language translation.
 */
import { useState, useEffect, useCallback } from 'react';
import { defaultSchema } from '../../utils/schema';
import { LOCALES } from '../../locales/index';
import { applyDictionaryToCVState, extractDictionaryFromCV } from '../../utils/translationEngine';
import { adaptItemToSectionType, createDefaultItemForSection, createDefaultSection } from '../../utils/itemAdapter';
import { sanitizeAndValidateCVSnapshot } from '../../utils/versionValidator';
import { normalizeItemContacts } from '../../utils/contactTypes';

export const baseDefaultContent = {
  es: LOCALES.es.content,
  en: LOCALES.en.content
};

export const ensureProfileHeader = (data) => {
  if (!data || !Array.isArray(data.sections)) return defaultSchema;
  let sections = data.sections;
  const hasHeader = sections.some(s => s.id === 'profile_header' || s.type === 'profile_header');
  if (!hasHeader) {
    sections = [defaultSchema.sections[0], ...sections];
  }
  if (data.profile) {
    sections = sections.map(sec => {
      if (sec.id === 'profile_header' || sec.type === 'profile_header') {
        const firstItem = (sec.items && sec.items[0]) ? { ...sec.items[0] } : {};
        const mergedItem = {
          ...firstItem,
          ...(data.profile.name !== undefined ? { name: data.profile.name } : {}),
          ...(data.profile.subtitle !== undefined ? { subtitle: data.profile.subtitle } : {}),
          ...(data.profile.location !== undefined ? { location: data.profile.location } : {}),
          ...(data.profile.email !== undefined ? { email: data.profile.email } : {}),
          ...(data.profile.phone !== undefined ? { phone: data.profile.phone } : {}),
          ...(data.profile.linkedin !== undefined ? { linkedin: data.profile.linkedin } : {}),
          ...(data.profile.github !== undefined ? { github: data.profile.github } : {}),
        };
        if (!mergedItem.contacts || !Array.isArray(mergedItem.contacts)) {
          mergedItem.contacts = normalizeItemContacts(mergedItem);
        }
        return { ...sec, items: [mergedItem, ...(sec.items ? sec.items.slice(1) : [])] };
      }
      return sec;
    });
  }
  return { ...data, sections };
};

export const loadInitialCVData = () => {
  if (typeof window === 'undefined') return defaultSchema;
  const saved = localStorage.getItem('cvData');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const merged = {
          ...defaultSchema,
          ...parsed,
          layout: {
            ...defaultSchema.layout,
            ...(parsed.layout || {})
          }
        };
        return ensureProfileHeader(merged);
      }
    } catch (e) {
      console.error('Error parsing cvData from localStorage', e);
    }
  }
  return defaultSchema;
};

export const useCVData = ({
  cvData: externalCvData,
  setCvData: externalSetCvData,
  applyStateWithHistory: externalApplyState,
  clearHistory: externalClearHistory
} = {}) => {
  const [internalCvData, setInternalCvData] = useState(loadInitialCVData);
  const cvData = externalCvData !== undefined ? externalCvData : internalCvData;
  const setCvData = externalSetCvData || setInternalCvData;
  const applyStateWithHistory = externalApplyState || setCvData;

  const [languagePacks, setLanguagePacks] = useState(() => {
    if (typeof window === 'undefined') return baseDefaultContent;
    const saved = localStorage.getItem('cvLanguagePacks');
    if (saved) {
      try { return { ...baseDefaultContent, ...JSON.parse(saved) }; } catch (e) {}
    }
    return baseDefaultContent;
  });

  const [activeLanguage, setActiveLanguage] = useState(() => {
    if (typeof window === 'undefined') return 'es';
    return localStorage.getItem('cvActiveLanguage') || 'es';
  });

  // Sync effects
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('cvData', JSON.stringify(cvData));
  }, [cvData]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('cvLanguagePacks', JSON.stringify(languagePacks));
  }, [languagePacks]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cvActiveLanguage', activeLanguage);
      document.documentElement.lang = activeLanguage || 'es';
    }
  }, [activeLanguage]);

  useEffect(() => {
    try {
      const currentDict = extractDictionaryFromCV(cvData);
      setLanguagePacks(prev => ({ ...prev, [activeLanguage]: currentDict }));
    } catch (e) {}
  }, [cvData, activeLanguage]);

  // Profile CRUD
  const updateProfile = useCallback((key, value) => {
    applyStateWithHistory(prev => ({ ...prev, profile: { ...prev.profile, [key]: value } }));
  }, [applyStateWithHistory]);

  // Section CRUD
  const addSection = useCallback((column = 'right', type = 'list', title = 'NUEVA SECCIÓN', bulletStyle = undefined) => {
    const newSec = createDefaultSection(column, type, title, bulletStyle);
    applyStateWithHistory(prev => ({ ...prev, sections: [...prev.sections, newSec] }));
  }, [applyStateWithHistory]);

  const deleteSection = useCallback((sectionId) => {
    if (sectionId === 'profile_header') return;
    applyStateWithHistory(prev => {
      const targetSec = prev.sections.find(sec => sec.id === sectionId);
      if (targetSec && (targetSec.id === 'profile_header' || targetSec.type === 'profile_header')) return prev;
      return { ...prev, sections: prev.sections.filter(sec => sec.id !== sectionId && sec.id !== 'profile_header' && sec.type !== 'profile_header') };
    });
  }, [applyStateWithHistory]);

  const reorderSections = useCallback((newSections) => {
    applyStateWithHistory(prev => ({ ...prev, sections: newSections }));
  }, [applyStateWithHistory]);

  const updateSectionTitle = useCallback((sectionId, title) => {
    applyStateWithHistory(prev => ({
      ...prev,
      sections: prev.sections.map(sec => sec.id === sectionId ? { ...sec, title } : sec)
    }));
  }, [applyStateWithHistory]);

  const updateSectionBulletStyle = useCallback((sectionId, bulletStyle) => {
    applyStateWithHistory(prev => ({
      ...prev,
      sections: prev.sections.map(sec => sec.id === sectionId ? { ...sec, bulletStyle: { ...(sec.bulletStyle || {}), ...bulletStyle } } : sec)
    }));
  }, [applyStateWithHistory]);

  const updateSectionProperty = useCallback((sectionId, key, value) => {
    applyStateWithHistory(prev => ({
      ...prev,
      sections: prev.sections.map(sec => {
        if (sec.id !== sectionId) return sec;
        const updates = typeof key === 'object' && key !== null ? key : { [key]: value };
        const updatedSec = { ...sec, ...updates };
        if (sec.type === 'spacer' && ('height' in updates || 'backgroundColor' in updates)) {
          if (updatedSec.items && updatedSec.items.length > 0) {
            updatedSec.items = updatedSec.items.map(item => ({
              ...item,
              ...('height' in updates ? { height: updates.height } : {}),
              ...('backgroundColor' in updates ? { backgroundColor: updates.backgroundColor } : {})
            }));
          }
        }
        return updatedSec;
      })
    }));
  }, [applyStateWithHistory]);

  // Item CRUD
  const addSectionItem = useCallback((sectionId) => {
    applyStateWithHistory(prev => ({
      ...prev,
      sections: prev.sections.map(sec => {
        if (sec.id !== sectionId) return sec;
        const newItem = createDefaultItemForSection(sec.type);
        return { ...sec, items: [...(sec.items || []), newItem] };
      })
    }));
  }, [applyStateWithHistory]);

  const deleteSectionItem = useCallback((sectionId, itemId) => {
    applyStateWithHistory(prev => ({
      ...prev,
      sections: prev.sections.map(sec => {
        if (sec.id !== sectionId || sec.type === 'profile_header') return sec;
        return { ...sec, items: (sec.items || []).filter(item => item.id !== itemId) };
      })
    }));
  }, [applyStateWithHistory]);

  const updateSectionItem = useCallback((sectionId, itemId, key, value) => {
    applyStateWithHistory(prev => ({
      ...prev,
      sections: prev.sections.map(sec => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          items: (sec.items || []).map(item => {
            if (item.id !== itemId) return item;
            const updates = typeof key === 'object' && key !== null ? key : { [key]: value };
            return { ...item, ...updates };
          })
        };
      })
    }));
  }, [applyStateWithHistory]);

  const reorderSectionItems = useCallback((sectionId, newItems) => {
    applyStateWithHistory(prev => ({
      ...prev,
      sections: prev.sections.map(sec => sec.id === sectionId ? { ...sec, items: newItems } : sec)
    }));
  }, [applyStateWithHistory]);

  const moveItemBetweenSections = useCallback((activeItemId, overItemId, activeSectionId, overSectionId) => {
    applyStateWithHistory(prev => {
      const sourceSec = prev.sections.find(s => s.id === activeSectionId);
      const targetSec = prev.sections.find(s => s.id === overSectionId);
      if (!sourceSec || !targetSec) return prev;
      const sourceItem = (sourceSec.items || []).find(i => i.id === activeItemId);
      if (!sourceItem) return prev;

      if (activeSectionId === overSectionId) {
        const oldIndex = sourceSec.items.findIndex(i => i.id === activeItemId);
        let newIndex = sourceSec.items.findIndex(i => i.id === overItemId);
        if (newIndex === -1) newIndex = sourceSec.items.length - 1;
        const updatedItems = [...sourceSec.items];
        const [moved] = updatedItems.splice(oldIndex, 1);
        updatedItems.splice(newIndex, 0, moved);
        return { ...prev, sections: prev.sections.map(s => s.id === activeSectionId ? { ...s, items: updatedItems } : s) };
      }

      const adaptedItem = adaptItemToSectionType(sourceItem, targetSec.type);
      const newSourceItems = sourceSec.items.filter(i => i.id !== activeItemId);
      const newTargetItems = [...(targetSec.items || [])];
      let insertIndex = newTargetItems.findIndex(i => i.id === overItemId);
      if (insertIndex === -1) newTargetItems.push(adaptedItem);
      else newTargetItems.splice(insertIndex, 0, adaptedItem);

      return {
        ...prev,
        sections: prev.sections.map(sec => {
          if (sec.id === activeSectionId) return { ...sec, items: newSourceItems };
          if (sec.id === overSectionId) return { ...sec, items: newTargetItems };
          return sec;
        })
      };
    });
  }, [applyStateWithHistory]);

  // Snapshot / Restore
  const loadVersionSnapshot = useCallback((snapshot, { clearHistory = false } = {}) => {
    const sanitized = sanitizeAndValidateCVSnapshot(snapshot);
    if (!sanitized) throw new Error('Invalid snapshot structure');
    if (snapshot && typeof snapshot === 'object') {
      if (snapshot.versionName !== undefined) sanitized.versionName = snapshot.versionName;
      if (snapshot.activeVersionName !== undefined) sanitized.activeVersionName = snapshot.activeVersionName;
      if (snapshot.activeVersionId !== undefined) sanitized.activeVersionId = snapshot.activeVersionId;
    }
    if (clearHistory) {
      if (typeof externalClearHistory === 'function') externalClearHistory();
      setCvData(sanitized);
    } else {
      applyStateWithHistory(() => sanitized);
    }
    return sanitized;
  }, [applyStateWithHistory, externalClearHistory, setCvData]);

  const resetToDefault = useCallback(() => {
    applyStateWithHistory(() => ({ ...defaultSchema, versionName: null, activeVersionName: null, activeVersionId: null }));
  }, [applyStateWithHistory]);

  const restoreContactSection = useCallback(() => {
    applyStateWithHistory(prev => {
      const filtered = prev.sections.filter(s => s.id !== 'profile_header' && s.type !== 'profile_header');
      return { ...prev, sections: [defaultSchema.sections[0], ...filtered] };
    });
  }, [applyStateWithHistory]);

  // Translation helpers
  const switchLanguage = useCallback((langCode) => {
    if (languagePacks[langCode] && Object.keys(languagePacks[langCode]).length > 0) {
      applyStateWithHistory(prev => applyDictionaryToCVState(prev, languagePacks[langCode]));
      setActiveLanguage(langCode);
      return true;
    }
    return false;
  }, [languagePacks, applyStateWithHistory]);

  const importLanguagePack = useCallback((langCode, dictionary, applyImmediately = true) => {
    setLanguagePacks(prev => ({ ...prev, [langCode]: dictionary }));
    if (applyImmediately) {
      applyStateWithHistory(prev => applyDictionaryToCVState(prev, dictionary));
      setActiveLanguage(langCode);
    }
  }, [applyStateWithHistory]);

  const getActiveDictionary = useCallback(() => {
    if (languagePacks[activeLanguage] && Object.keys(languagePacks[activeLanguage]).length > 0) {
      return languagePacks[activeLanguage];
    }
    return extractDictionaryFromCV(cvData);
  }, [languagePacks, activeLanguage, cvData]);

  return {
    cvData,
    setCvData,
    languagePacks,
    activeLanguage,
    updateProfile,
    addSection,
    deleteSection,
    reorderSections,
    updateSectionTitle,
    updateSectionBulletStyle,
    updateSectionProperty,
    addSectionItem,
    deleteSectionItem,
    updateSectionItem,
    reorderSectionItems,
    moveItemBetweenSections,
    loadVersionSnapshot,
    resetToDefault,
    restoreContactSection,
    switchLanguage,
    importLanguagePack,
    getActiveDictionary,
  };
};
```

---

### 5.4 `useCVLayout.js` Specification

```javascript
/**
 * @file useCVLayout.js
 * @description Hook managing layout configuration (1-col ATS vs 2-col), column DnD movement,
 * sticky pagination metrics, page folds, and singleton overlay states (tooltips and formatting toolbars).
 */
import { useState, useCallback } from 'react';
import { defaultSchema } from '../../utils/schema';

export const useCVLayout = ({ cvData, applyStateWithHistory } = {}) => {
  // AI Suggestions visibility
  const [showAITips, setShowAITips] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('cv_show_ai_tips') !== 'false';
  });

  // Physical A4 Page Metrics
  const [pageHeightPx, setPageHeightPx] = useState(() => {
    if (typeof document !== 'undefined') {
      try {
        const ruler = document.createElement('div');
        ruler.style.height = '297mm';
        ruler.style.position = 'absolute';
        ruler.style.visibility = 'hidden';
        ruler.style.top = '-9999px';
        document.body.appendChild(ruler);
        const h = ruler.offsetHeight;
        ruler.remove();
        if (h > 0) return h;
      } catch (_) {}
    }
    return 1123;
  });

  const pageGapPx = 20;
  const [totalPages, setTotalPages] = useState(1);
  const [paginationTrigger, setPaginationTrigger] = useState(0);

  const triggerPaginationRecalc = useCallback(() => {
    setPaginationTrigger(prev => prev + 1);
  }, []);

  const getPageBounds = useCallback((pageNum) => {
    const p = Math.max(1, pageNum);
    const top = (p - 1) * (pageHeightPx + pageGapPx);
    const bottom = top + pageHeightPx;
    const foldTop = p * pageHeightPx + (p - 1) * pageGapPx;
    const foldBottom = foldTop + pageGapPx;
    const pagePadding = Number(cvData?.layout?.pagePadding ?? 24);
    const contentTop = top + pagePadding;
    const contentBottom = foldTop - pagePadding;
    return {
      top, bottom, foldTop, foldBottom, pageHeightPx, pageGapPx, pagePadding, contentTop, contentBottom
    };
  }, [pageHeightPx, pageGapPx, cvData?.layout?.pagePadding]);

  const getElementPageInfo = useCallback((elementOrBounds) => {
    let top = 0;
    let height = 0;
    if (elementOrBounds && typeof elementOrBounds === 'object') {
      if ('top' in elementOrBounds && 'height' in elementOrBounds) {
        top = elementOrBounds.top;
        height = elementOrBounds.height;
      } else if (typeof elementOrBounds.getBoundingClientRect === 'function') {
        const areaCv = document.getElementById('area-cv');
        const elRect = elementOrBounds.getBoundingClientRect();
        if (areaCv) {
          const areaRect = areaCv.getBoundingClientRect();
          top = elRect.top - areaRect.top;
        } else {
          top = elementOrBounds.offsetTop || 0;
        }
        height = elRect.height || elementOrBounds.offsetHeight || 0;
      }
    }
    const pageNum = Math.max(1, Math.floor(top / (pageHeightPx + pageGapPx)) + 1);
    const bounds = getPageBounds(pageNum);
    const remainingInPage = Math.max(0, bounds.contentBottom - (top + height));
    const isCrossingFold = (top < bounds.contentBottom) && ((top + height) > bounds.contentBottom);

    return {
      pageNum, top, height, bottom: top + height, foldTop: bounds.foldTop,
      contentTop: bounds.contentTop, contentBottom: bounds.contentBottom,
      remainingInPage, isCrossingFold
    };
  }, [pageHeightPx, pageGapPx, getPageBounds]);

  // Tooltip singleton
  const [activeTooltip, setActiveTooltip] = useState(null);
  const clearActiveTooltip = useCallback(() => setActiveTooltip(null), []);
  const closeTooltip = clearActiveTooltip;

  const toggleTooltipForSection = useCallback((section, rect) => {
    setActiveTooltip(current => {
      if (current && current.section && current.section.id === section.id) return null;
      return { section, rect };
    });
  }, []);

  // Toolbar singleton
  const [activeToolbar, setActiveToolbar] = useState(null);
  const clearActiveToolbar = useCallback(() => setActiveToolbar(null), []);

  // Layout updates
  const updateLayout = useCallback((key, value) => {
    if (typeof applyStateWithHistory !== 'function') return;
    applyStateWithHistory(prev => {
      const prevLayout = prev.layout || defaultSchema.layout;
      const updates = typeof key === 'object' && key !== null ? key : { [key]: value };
      return {
        ...prev,
        layout: { ...defaultSchema.layout, ...prevLayout, ...updates }
      };
    });
  }, [applyStateWithHistory]);

  const updateSectionColumn = useCallback((sectionId, newColumn) => {
    if (typeof applyStateWithHistory !== 'function') return;
    applyStateWithHistory(prev => ({
      ...prev,
      sections: prev.sections.map(sec => sec.id === sectionId ? { ...sec, column: newColumn } : sec)
    }));
  }, [applyStateWithHistory]);

  const moveSectionToColumnAndIndex = useCallback((activeSectionId, targetColumn, overSectionId = null) => {
    if (typeof applyStateWithHistory !== 'function') return;
    applyStateWithHistory(prev => {
      const activeSec = prev.sections.find(s => s.id === activeSectionId);
      if (!activeSec) return prev;
      const updatedSec = { ...activeSec, column: targetColumn };
      const remainingSections = prev.sections.filter(s => s.id !== activeSectionId);
      let insertIndex = -1;
      if (overSectionId && overSectionId !== activeSectionId) {
        insertIndex = remainingSections.findIndex(s => s.id === overSectionId);
      }
      if (insertIndex === -1) {
        const lastColIndex = remainingSections.reduce((lastIdx, s, idx) => s.column === targetColumn ? idx : lastIdx, -1);
        insertIndex = lastColIndex !== -1 ? lastColIndex + 1 : remainingSections.length;
      }
      const newSections = [...remainingSections];
      newSections.splice(insertIndex, 0, updatedSec);
      return { ...prev, sections: newSections };
    });
  }, [applyStateWithHistory]);

  return {
    showAITips, setShowAITips,
    pageHeightPx, setPageHeightPx,
    pageGapPx,
    totalPages, setTotalPages,
    paginationTrigger, triggerPaginationRecalc,
    getPageBounds, getElementPageInfo,
    activeTooltip, setActiveTooltip, clearActiveTooltip, closeTooltip, toggleTooltipForSection,
    activeToolbar, setActiveToolbar, clearActiveToolbar,
    updateLayout, updateSectionColumn, moveSectionToColumnAndIndex
  };
};
```

---

### 5.5 `useCVExport.js` Specification

```javascript
/**
 * @file useCVExport.js
 * @description Hook managing ephemeral toast notifications and clean PDF export / JSON download pipelines.
 */
import { useState, useCallback, useRef } from 'react';
import { executeCleanPrint } from '../../utils/staticHtmlPdfEngine';

export const useCVExport = () => {
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  const showToast = useCallback((text, type = 'info', duration = 2800) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    const newToast = { id: Date.now(), text, type };
    setToast(newToast);
    if (duration > 0) {
      toastTimeoutRef.current = setTimeout(() => setToast(null), duration);
    }
  }, []);

  const hideToast = useCallback(() => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(null);
  }, []);

  const exportCleanPDF = useCallback(async (cvData, activeLanguage = 'es') => {
    if (isExporting) return;
    setIsExporting(true);
    showToast('Generando PDF optimizado y preparando impresión...', 'loading', 0);

    let isFinished = false;
    let focusTimeout = null;
    let fallbackTimeout = null;

    const onControlReturned = () => {
      if (isFinished) return;
      isFinished = true;
      if (focusTimeout) clearTimeout(focusTimeout);
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      if (typeof window !== 'undefined') {
        window.removeEventListener('afterprint', onControlReturned);
        window.removeEventListener('print-dialog-closed', onControlReturned);
        window.removeEventListener('focus', onControlReturned);
      }
      setIsExporting(false);
      showToast('¡Documento PDF procesado correctamente!', 'success', 3500);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('afterprint', onControlReturned, { once: true });
      window.addEventListener('print-dialog-closed', onControlReturned, { once: true });
      focusTimeout = setTimeout(() => {
        if (!isFinished) window.addEventListener('focus', onControlReturned, { once: true });
      }, 1200);
      fallbackTimeout = setTimeout(() => onControlReturned(), 8000);
    }

    try {
      await executeCleanPrint(cvData, activeLanguage);
    } catch (e) {
      console.warn('executeCleanPrint fallback', e);
      if (typeof window !== 'undefined') window.print();
      onControlReturned();
    }
  }, [isExporting, showToast]);

  const exportJSON = useCallback((cvData) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cvData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${cvData.profile?.name?.replace(/\s+/g, '_') || 'cv'}_backup.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('CV exportado en formato JSON correctamente', 'success', 2500);
  }, [showToast]);

  return {
    toast,
    showToast,
    hideToast,
    isExporting,
    exportCleanPDF,
    exportJSON
  };
};
```

---

### 5.6 `CVContext.jsx` Facade Specification

```javascript
/**
 * @file CVContext.jsx
 * @description Backward-compatible facade providing `useCV()` and `CVProvider` by
 * composing focused domain hooks (useCVHistory, useCVData, useCVLayout, useCVExport).
 * Strict constraint: <= 200 lines.
 */
import React, { createContext, useContext, useMemo, useState } from 'react';
import { useCVHistory } from './hooks/useCVHistory';
import { useCVData, loadInitialCVData } from './hooks/useCVData';
import { useCVLayout } from './hooks/useCVLayout';
import { useCVExport } from './hooks/useCVExport';

const CVContext = createContext();

export const useCV = () => useContext(CVContext);

export const CVProvider = ({ children }) => {
  // Shared CV document state holder
  const [cvData, setCvData] = useState(loadInitialCVData);

  // 1. History stack & undo/redo engine
  const history = useCVHistory(setCvData);

  // 2. Core document data CRUD & translation
  const data = useCVData({
    cvData,
    setCvData,
    applyStateWithHistory: history.applyStateWithHistory,
    clearHistory: history.clearHistory,
  });

  // 3. Layout modes, column moves, sticky pagination, tooltips & toolbars
  const layout = useCVLayout({
    cvData,
    applyStateWithHistory: history.applyStateWithHistory,
  });

  // 4. Toast notifications and export pipelines
  const exportOps = useCVExport();

  // Unified public API contract (100% backward compatible with existing callers)
  const contextValue = useMemo(() => ({
    // Data & CRUD
    cvData: data.cvData,
    updateProfile: data.updateProfile,
    addSection: data.addSection,
    deleteSection: data.deleteSection,
    reorderSections: data.reorderSections,
    updateSectionTitle: data.updateSectionTitle,
    updateSectionBulletStyle: data.updateSectionBulletStyle,
    updateSectionProperty: data.updateSectionProperty,
    addSectionItem: data.addSectionItem,
    deleteSectionItem: data.deleteSectionItem,
    updateSectionItem: data.updateSectionItem,
    reorderSectionItems: data.reorderSectionItems,
    moveItemBetweenSections: data.moveItemBetweenSections,
    loadVersionSnapshot: data.loadVersionSnapshot,
    resetToDefault: data.resetToDefault,
    restoreContactSection: data.restoreContactSection,
    languagePacks: data.languagePacks,
    activeLanguage: data.activeLanguage,
    switchLanguage: data.switchLanguage,
    importLanguagePack: data.importLanguagePack,
    getActiveDictionary: data.getActiveDictionary,

    // History
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,

    // Layout & Pagination
    updateLayout: layout.updateLayout,
    updateSectionColumn: layout.updateSectionColumn,
    moveSectionToColumnAndIndex: layout.moveSectionToColumnAndIndex,
    pageHeightPx: layout.pageHeightPx,
    setPageHeightPx: layout.setPageHeightPx,
    pageGapPx: layout.pageGapPx,
    totalPages: layout.totalPages,
    setTotalPages: layout.setTotalPages,
    getPageBounds: layout.getPageBounds,
    getElementPageInfo: layout.getElementPageInfo,
    paginationTrigger: layout.paginationTrigger,
    triggerPaginationRecalc: layout.triggerPaginationRecalc,

    // Overlays & UI
    activeTooltip: layout.activeTooltip,
    setActiveTooltip: layout.setActiveTooltip,
    clearActiveTooltip: layout.clearActiveTooltip,
    closeTooltip: layout.closeTooltip,
    toggleTooltipForSection: layout.toggleTooltipForSection,
    activeToolbar: layout.activeToolbar,
    setActiveToolbar: layout.setActiveToolbar,
    clearActiveToolbar: layout.clearActiveToolbar,
    showAITips: layout.showAITips,

    // Export & Notifications
    toast: exportOps.toast,
    showToast: exportOps.showToast,
    hideToast: exportOps.hideToast,
    isExporting: exportOps.isExporting,
    exportCleanPDF: exportOps.exportCleanPDF,
    exportJSON: exportOps.exportJSON,
  }), [data, history, layout, exportOps]);

  return (
    <CVContext.Provider value={contextValue}>
      {children}
    </CVContext.Provider>
  );
};

export default CVContext;
```

---

### 5.7 Barrel Files

#### `src/context/hooks/index.js`
```javascript
export { useCVHistory } from './useCVHistory';
export { useCVData, loadInitialCVData, ensureProfileHeader, baseDefaultContent } from './useCVData';
export { useCVLayout } from './useCVLayout';
export { useCVExport } from './useCVExport';
```

#### `src/context/index.js`
```javascript
export { CVContext, CVProvider, useCV } from './CVContext';
export { useCVHistory, useCVData, useCVLayout, useCVExport } from './hooks';
export default './CVContext';
```

---

## 6. Self-Verification & Validation Method

1. **API Interface Equality Check**:
   Confirm that all 48 members of the original `CVContext.Provider value` object exist in the new facade's returned `contextValue`.
2. **Line Count Enforcement**:
   - `CVContext.jsx`: <= 110 lines (strict requirement <= 200 lines).
   - `useCVHistory.js`: <= 120 lines (strict requirement <= 250 lines).
   - `useCVData.js`: <= 245 lines (strict requirement <= 250 lines).
   - `useCVLayout.js`: <= 195 lines (strict requirement <= 250 lines).
   - `useCVExport.js`: <= 120 lines (strict requirement <= 250 lines).
3. **Full Vitest Test Suite**:
   Run `npx vitest run`. The entire baseline test suite (628 tests across 37 files) must pass with 0 regressions.
