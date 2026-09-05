# Analysis: Baseline Defect Fixes Implementation Plan (Plan 2)

**Explorer**: `teamwork_preview_explorer` (Plan 2)  
**Target Files**: 
- `src/components/Editor/InlineEdit.jsx` (referenced as `src/components/CV/InlineEdit.jsx` in task description)
- `src/components/Editor/SuggestionTooltip.jsx`
- `src/tests/challenger-stress-suite.test.jsx`
- `src/tests/dom-geometry-typography.test.jsx`  
**Working Directory**: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o6_plan_2`  
**Date**: 2026-09-03  

---

## 1. Executive Summary

This investigation delivers the comprehensive, line-by-line defect resolution strategy for the 5 failing tests currently reported by `npm test`.

Currently, running `npm test` yields:
- **Test Files**: 3 failed | 9 passed (12 total)
- **Tests**: 5 failed | 235 passed (240 total) (97.9% pass rate)

All 5 failures stem from two distinct root causes:
1. **Unprotected `useCV()` Context Destructuring in `InlineEdit.jsx`**:
   - `InlineEdit.jsx:5` executes `const { activeLanguage } = useCV();` unconditionally. When rendered outside of `<CVProvider>` (as in isolated unit test `src/tests/hyperlink-edit.test.jsx:140`), `useCV()` returns `undefined`, triggering `TypeError: Cannot destructure property 'activeLanguage' of 'useCV(...)' as it is undefined.`.
2. **Tooling Deviation from `AGENTS.md` Dynamic Tooltip Positioning Rules in `SuggestionTooltip.jsx`**:
   - In `SuggestionTooltip.jsx:18-38`, positioning math was altered to use arbitrary offsets (`rect.right + 4`, `rect.top + 12`, right viewport clamping instead of flipping, and 16px min clamp).
   - This directly violates Section 3 of `AGENTS.md` ("Dynamic Tooltip & Popover Positioning") and causes 4 test failures across `challenger-stress-suite.test.jsx` and `iconography.test.jsx`.
   - Furthermore, git investigation reveals that an uncommitted edit modified `src/tests/challenger-stress-suite.test.jsx` and `src/tests/dom-geometry-typography.test.jsx` to loosen assertions for the non-compliant offsets, creating an internal contradiction with `iconography.test.jsx` and remaining challenger assertions. Reverting those test files to pristine git HEAD restores 100% mathematical consistency across all test suites.

By applying the exact code fixes below, the entire test suite will reach **240/240 passed (100% green)** and `npm run build` will continue to pass in ~1.2s with 0 errors.

---

## 2. Root-Cause Analysis of the 5 Test Failures

### 2.1 Failure 1: `hyperlink-edit.test.jsx:140`
- **Suite**: `src/tests/hyperlink-edit.test.jsx`
- **Test**: `T6: Integration with ExperienceItem renders HyperlinkEdit and handles updates cleanly`
- **Error**:
  ```
  TypeError: Cannot destructure property 'activeLanguage' of 'useCV(...)' as it is undefined.
   ❯ InlineEdit src/components/Editor/InlineEdit.jsx:5:11
        3| 
        4| const InlineEdit = ({ value, onSave, multiline = false, className = '', placeholder }) => {
        5|   const { activeLanguage } = useCV();
         |           ^
  ```
- **File Location**: The project has only one `InlineEdit` component, located at `src/components/Editor/InlineEdit.jsx` (imported by all item components including `ExperienceItem.jsx`).
- **Mechanism**: In `hyperlink-edit.test.jsx:139-145`, RTL's `render(<ExperienceItem item={item} sectionId="projects" onUpdateItem={onUpdateMock} />)` mounts `ExperienceItem` in isolation without wrapping it inside `<CVProvider>`. Because `useCV()` returns `useContext(CVContext)` (which evaluates to `undefined` when no Provider is present in the React tree), attempting to destructure `{ activeLanguage }` throws a fatal TypeError on mount.
- **Remedy**: Safely retrieve `useCV()` with a fallback object:
  ```javascript
  const cvContext = useCV();
  const activeLanguage = cvContext?.activeLanguage || 'es';
  ```

---

### 2.2 Failures 2 & 3: `challenger-stress-suite.test.jsx:313` and `challenger-stress-suite.test.jsx:406`

#### Test 3.1 (`challenger-stress-suite.test.jsx:313`)
- **Assertion**:
  ```javascript
  // rect.right (800) + 20 = 820px
  expect(tooltip.style.left).toBe('820px');
  ```
- **Failure**:
  ```
  AssertionError: expected '804px' to be '820px'
  - Expected: 820px
  + Received: 804px
  ```
- **Mechanism**: `SuggestionTooltip.jsx:19` has `let left = Math.round(rect.right + 4);`. With `rect.right = 800`, `left` evaluates to `804px` instead of `800 + 20 = 820px`.
- **Remedy**: Use `let left = Math.round(rect.right + 20);`.

#### Test 3.4 (`challenger-stress-suite.test.jsx:406`)
- **Assertion**:
  ```javascript
  // Minimum top clamp
  expect(tooltip.style.top).toBe('20px');
  ```
- **Failure**:
  ```
  AssertionError: expected '16px' to be '20px'
  - Expected: 20px
  + Received: 16px
  ```
- **Mechanism**: `SuggestionTooltip.jsx:36-38` has `if (top < 16) { top = 16; }`. With `topRect.top = -30`, `top` was clamped to `16px` instead of `20px`.
- **Remedy**: Use `if (top < 20) { top = 20; }`.

---

### 2.3 Failures 4 & 5: `iconography.test.jsx:166` and `iconography.test.jsx:196`

#### Test T2.1 (`iconography.test.jsx:166`)
- **Assertion**:
  ```javascript
  // left should be positioned at rect.left - 320 = 280px
  const style = tooltip.getAttribute('style') || '';
  expect(style).toContain('left: 280px');
  ```
- **Failure**:
  ```
  AssertionError: expected '... left: 712px; ...' to contain 'left: 280px'
  ```
- **Mechanism**: In `iconography.test.jsx:142-149`, `nearEdgeRect` has `left: 600, right: 900`, with `window.innerWidth = 1024`.
  Instead of flipping to the opposite side (`rect.left - 320px = 600 - 320 = 280px`), `SuggestionTooltip.jsx:22-24` attempted to slide/clamp the tooltip within the right edge:
  `left = Math.max(12, vw - TOOLTIP_WIDTH - 12) = 1024 - 300 - 12 = 712px`.
  This directly contradicts `AGENTS.md` Rule 3:
  *"Flip to the opposite side (`rect.left - 320px`) when approaching the viewport boundary (`window.innerWidth`)."*
- **Remedy**: Replace the sliding clamp with the standard flip condition:
  ```javascript
  if (left + TOOLTIP_WIDTH > vw) {
    left = Math.round(rect.left - 320);
  }
  ```

#### Test T2.2 (`iconography.test.jsx:196`)
- **Assertion**:
  ```javascript
  // clamped top: 800 - 420 = 380px
  expect(style).toContain('top: 380px');
  ```
- **Failure**:
  ```
  AssertionError: expected '... top: 424px; ...' to contain 'top: 380px'
  ```
- **Mechanism**: In `iconography.test.jsx:172-179`, `bottomEdgeRect` has `top: 700`, with `window.innerHeight = 800`.
  `SuggestionTooltip.jsx:33-35` calculated:
  `top = Math.max(16, vh - TOOLTIP_ESTIMATED_HEIGHT - 16) = 800 - 360 - 16 = 424px`.
  The authoritative invariant in `AGENTS.md` and `iconography.test.jsx` dictates:
  `if (top + 400 > vh) { top = vh - 420; }` -> `800 - 420 = 380px`.
- **Remedy**:
  ```javascript
  if (top + 400 > vh) {
    top = vh - 420;
  }
  ```

---

## 3. Git Working Tree Conflict Discovery & Harmonization

During the repository investigation (`git diff src/tests/`), we discovered that an uncommitted change modified lines in `src/tests/challenger-stress-suite.test.jsx` and `src/tests/dom-geometry-typography.test.jsx`:

```diff
diff --git a/src/tests/challenger-stress-suite.test.jsx b/src/tests/challenger-stress-suite.test.jsx
@@ -345,3 +345,3 @@
-      expect(tooltip.style.left).toBe('180px');
-      expect(tooltip.style.top).toBe('150px');
+      const leftVal = parseInt(tooltip.style.left, 10);
+      expect(leftVal + 300).toBeLessThanOrEqual(1024);
+      expect(parseInt(tooltip.style.top, 10)).toBe(162);
```
```diff
diff --git a/src/tests/dom-geometry-typography.test.jsx b/src/tests/dom-geometry-typography.test.jsx
@@ -633,1 +633,1 @@
-      it('F9.4: Positions tooltip to the right (rect.right + 20px) under wide viewport', () => {
+      it('F9.4: Positions tooltip 4px to the right of the target container', () => {
@@ -648,2 +648,2 @@
-        expect(tooltip.style.left).toBe('620px');
-        expect(tooltip.style.top).toBe('150px');
+        expect(tooltip.style.left).toBe('604px');
+        expect(tooltip.style.top).toBe('162px');
@@ -655,1 +655,1 @@
-      it('F9.5: Flips tooltip to the left (rect.left - 320px) when right side would overflow window.innerWidth', () => {
+      it('F9.5: Clamps tooltip within right viewport bounds without escaping or obstructing paper', () => {
@@ -667,1 +667,3 @@
-        expect(tooltip.style.left).toBe('180px');
+        const leftVal = parseInt(tooltip.style.left, 10);
+        expect(leftVal + 300).toBeLessThanOrEqual(1024);
+        expect(parseInt(tooltip.style.top, 10)).toBe(162);
```

### Why Reverting These Test Files is Essential:
1. In git HEAD, `dom-geometry-typography.test.jsx` test F9.4 explicitly tests: `F9.4: Positions tooltip to the right (rect.right + 20px) under wide viewport` expecting `620px` (600 + 20) and `150px` (`rect.top`).
2. In git HEAD, `challenger-stress-suite.test.jsx` test 3.2 expects `180px` (500 - 320) and `150px` (`rect.top`).
3. If `SuggestionTooltip.jsx` is corrected to adhere to `AGENTS.md` (which yields `620px` and `150px`), keeping the uncommitted changes expecting `604px` and `162px` would introduce new test failures.
4. Restoring `src/tests/challenger-stress-suite.test.jsx` and `src/tests/dom-geometry-typography.test.jsx` to git HEAD restores 100% unified alignment across all tests:
   - `dom-geometry-typography.test.jsx`: 620px, 150px, 180px
   - `challenger-stress-suite.test.jsx`: 820px, 200px, 180px, 180px, 20px
   - `iconography.test.jsx`: 280px, 380px

---

## 4. Exact Mathematical Proof Across All Test Cases

| Test Case | Inputs | Target Math | Expected Left | Expected Top | Result |
|---|---|---|---|---|---|
| **Challenger 3.1** | `right=800, top=200, vw=1920, vh=1080` | `right + 20`, `top` | `820px` | `200px` | Matches line 313 & 315 |
| **Challenger 3.2** | `left=500, right=800, top=150, vw=1024, vh=768` | Flip (`left - 320`), `top` | `180px` | `150px` | Matches line 345 & 346 (HEAD) |
| **Challenger 3.3** | `top=450, vh=600` | Clamped bottom (`vh - 420`) | — | `180px` | Matches line 376 (`<= 600` & `180px`) |
| **Challenger 3.4** | `top=-30, vh=900` | Minimum clamp (`20px`) | — | `20px` | Matches line 406 |
| **Iconography T2.1** | `left=600, right=900, vw=1024` | Flip (`left - 320`) | `280px` | — | Matches line 166 |
| **Iconography T2.2** | `top=700, vh=800` | Clamped bottom (`vh - 420`) | — | `380px` | Matches line 196 |
| **DOM Geo F9.4** | `right=600, top=150, vw=1920, vh=1080` | `right + 20`, `top` | `620px` | `150px` | Matches line 648 & 649 (HEAD) |
| **DOM Geo F9.5** | `left=500, right=850, vw=1024, vh=768` | Flip (`left - 320`) | `180px` | — | Matches line 667 (HEAD) |

---

## 5. Line-by-Line Code Fix Plan for Worker

### Fix 1: `src/components/Editor/InlineEdit.jsx`
**Target lines**: 5–6  
**Change**:
```diff
- const { activeLanguage } = useCV();
+ const cvContext = useCV();
+ const activeLanguage = cvContext?.activeLanguage || 'es';
```

### Fix 2: `src/components/Editor/SuggestionTooltip.jsx`
**Target lines**: 6–39  
**Change**:
```diff
- const SuggestionTooltip = ({ section, isHovered, layoutType, rect }) => {
-   const { activeLanguage, closeTooltip } = useCV();
+ const SuggestionTooltip = ({ section, isHovered, layoutType, rect }) => {
+   const cvContext = useCV();
+   const activeLanguage = cvContext?.activeLanguage || 'es';
+   const closeTooltip = cvContext?.closeTooltip;
```
and positioning math (lines 18–38):
```diff
-     // 1. Horizontal position: exactly 4px to the right of the specific container's right border
-     let left = Math.round(rect.right + 4);
-
-     // Clamp horizontally so it stays within the right viewport bounds
-     if (left + TOOLTIP_WIDTH > vw - 12) {
-       left = Math.max(12, vw - TOOLTIP_WIDTH - 12);
-     }
-     if (left < 12) {
-       left = 12;
-     }
-
-     // 2. Vertical position: anchored directly to the hovered element + 12px offset
-     let top = Math.round(rect.top + 12);
-
-     // Clamp vertically so it stays within viewport bounds
-     if (top + TOOLTIP_ESTIMATED_HEIGHT > vh - 16) {
-       top = Math.max(16, vh - TOOLTIP_ESTIMATED_HEIGHT - 16);
-     }
-     if (top < 16) {
-       top = 16;
-     }
+     // 1. Horizontal position: adjacent to element (rect.right + 20px)
+     let left = Math.round(rect.right + 20);
+
+     // Flip to opposite side (rect.left - 320px) when approaching viewport boundary (window.innerWidth)
+     if (left + TOOLTIP_WIDTH > vw) {
+       left = Math.round(rect.left - 320);
+     }
+     if (left < 20) {
+       left = 20;
+     }
+
+     // 2. Vertical position: anchored directly to the hovered element (rect.top)
+     let top = Math.round(rect.top);
+
+     // Clamp vertically to prevent escaping window.innerHeight
+     if (top + 400 > vh) {
+       top = vh - 420;
+     }
+     if (top < 20) {
+       top = 20;
+     }
```

### Fix 3: Restore Pristine Test Files to Git HEAD
**Target files**:
- `src/tests/challenger-stress-suite.test.jsx`
- `src/tests/dom-geometry-typography.test.jsx`  
**Command**:
```bash
git checkout src/tests/challenger-stress-suite.test.jsx src/tests/dom-geometry-typography.test.jsx
```
This discards the temporary uncommitted test modifications and brings all 12 test suites into 100% agreement with `AGENTS.md`.
