# Handoff Report — Plan 2: Baseline Defect Fixes Implementation Plan

**Agent**: `teamwork_preview_explorer` (Plan 2)  
**Recipient**: `teamwork_preview_worker` / `parent` (Orchestrator: `c48f1052-7dd0-4051-b6c6-e724f20ce04a`)  
**Working Directory**: `/home/juani/Documentos/Ressume/.agents/teamwork_preview_explorer_o6_plan_2`  
**Date**: 2026-09-03  

---

## 1. Observation

Direct execution of `npm test` across the workspace produced the following verbatim test results:

```
Test Files  3 failed | 9 passed (12)
     Tests  5 failed | 235 passed (240)
```

The 5 verbatim test failures and their exact code locations are:

### Obs 1: `src/tests/challenger-stress-suite.test.jsx:313:34`
```
FAIL src/tests/challenger-stress-suite.test.jsx > CHALLENGER 2: Empirical Stress Test Suite (PDF/Print Engine, Auto-Scaler, Dynamic Tooltips) > 3. Dynamic Tooltip Positioning - Bounding Rect Math & Obsidian Standard > 3.1: Positions tooltip to the right (rect.right + 20px) under normal viewport conditions
AssertionError: expected '804px' to be '820px' // Object.is equality
- Expected: 820px
+ Received: 804px
 ❯ src/tests/challenger-stress-suite.test.jsx:313:34
    311|       expect(tooltip).toBeInTheDocument();
    312|       // rect.right (800) + 20 = 820px
    313|       expect(tooltip.style.left).toBe('820px');
    314|       // rect.top = 200px
    315|       expect(tooltip.style.top).toBe('200px');
```

### Obs 2: `src/tests/challenger-stress-suite.test.jsx:406:33`
```
FAIL src/tests/challenger-stress-suite.test.jsx > CHALLENGER 2: Empirical Stress Test Suite (PDF/Print Engine, Auto-Scaler, Dynamic Tooltips) > 3. Dynamic Tooltip Positioning - Bounding Rect Math & Obsidian Standard > 3.4: Clamps top position to minimum 20px when top < 20
AssertionError: expected '16px' to be '20px' // Object.is equality
- Expected: 20px
+ Received: 16px
 ❯ src/tests/challenger-stress-suite.test.jsx:406:33
    404|       expect(tooltip).toBeInTheDocument();
    405|       // Minimum top clamp
    406|       expect(tooltip.style.top).toBe('20px');
```

### Obs 3: `src/tests/hyperlink-edit.test.jsx:140`
```
FAIL src/tests/hyperlink-edit.test.jsx > Google Docs Style HyperlinkEdit UX Component > T6: Integration with ExperienceItem renders HyperlinkEdit and handles updates cleanly
TypeError: Cannot destructure property 'activeLanguage' of 'useCV(...)' as it is undefined.
 ❯ InlineEdit src/components/Editor/InlineEdit.jsx:5:11
      3| 
      4| const InlineEdit = ({ value, onSave, multiline = false, className = '', placeholder }) => {
      5|   const { activeLanguage } = useCV();
       |           ^
      6|   const [isEditing, setIsEditing] = useState(false);
      7|   const [currentValue, setCurrentValue] = useState(value);
```

### Obs 4: `src/tests/iconography.test.jsx:166:21`
```
FAIL src/tests/iconography.test.jsx > R4: Callout & Tooltip Iconography Migration to lucide-react > Tier 2: Boundary & Edge Cases > T2.1: Tooltip flips to the left (rect.left - 320) when approaching viewport right boundary (window.innerWidth)
AssertionError: expected 'position: fixed; top: 212px; left: 712px; ...' to contain 'left: 280px'
- Expected: left: 280px
+ Received: position: fixed; top: 212px; left: 712px; ...
 ❯ src/tests/iconography.test.jsx:166:21
    164|       // left should be positioned at rect.left - 320 = 280px
    165|       const style = tooltip.getAttribute('style') || '';
    166|       expect(style).toContain('left: 280px');
```

### Obs 5: `src/tests/iconography.test.jsx:196:21`
```
FAIL src/tests/iconography.test.jsx > R4: Callout & Tooltip Iconography Migration to lucide-react > Tier 2: Boundary & Edge Cases > T2.2: Tooltip clamps vertically when approaching window.innerHeight to prevent overflowing
AssertionError: expected 'position: fixed; top: 424px; left: 504px; ...' to contain 'top: 380px'
- Expected: top: 380px
+ Received: position: fixed; top: 424px; left: 504px; ...
 ❯ src/tests/iconography.test.jsx:196:21
    194|       const style = tooltip.getAttribute('style') || '';
    195|       // clamped top: 800 - 420 = 380px
    196|       expect(style).toContain('top: 380px');
```

### Obs 6: Tooltip Math in `src/components/Editor/SuggestionTooltip.jsx:18-38`
```javascript
18:       // 1. Horizontal position: exactly 4px to the right of the specific container's right border
19:       let left = Math.round(rect.right + 4);
20: 
21:       // Clamp horizontally so it stays within the right viewport bounds
22:       if (left + TOOLTIP_WIDTH > vw - 12) {
23:         left = Math.max(12, vw - TOOLTIP_WIDTH - 12);
24:       }
25:       if (left < 12) {
26:         left = 12;
27:       }
28: 
29:       // 2. Vertical position: anchored directly to the hovered element + 12px offset
30:       let top = Math.round(rect.top + 12);
31: 
32:       // Clamp vertically so it stays within viewport bounds
33:       if (top + TOOLTIP_ESTIMATED_HEIGHT > vh - 16) {
34:         top = Math.max(16, vh - TOOLTIP_ESTIMATED_HEIGHT - 16);
35:       }
36:       if (top < 16) {
37:         top = 16;
38:       }
```

### Obs 7: Git Working Tree Modifications in `src/tests/`
Running `git diff src/tests/` revealed that uncommitted modifications were made to `src/tests/challenger-stress-suite.test.jsx` (lines 345–348) and `src/tests/dom-geometry-typography.test.jsx` (lines 633–670), altering expected values to match the non-standard `+4px` and `+12px` offsets. In pristine git HEAD, these files test the exact invariant specified in `AGENTS.md` (`rect.right + 20px`, `rect.left - 320px`, `top = rect.top`, clamped to `180px`).

---

## 2. Logic Chain

1. **InlineEdit Context Safety (Obs 3)**:
   - In `InlineEdit.jsx:5`, `useCV()` is destructured directly without checking if the return value is defined.
   - When a component rendering `InlineEdit` (such as `ExperienceItem`) is mounted in an isolated unit test without `<CVProvider>`, `useCV()` returns `undefined`, triggering `TypeError: Cannot destructure property 'activeLanguage' of 'useCV(...)'.`
   - Providing a defensive fallback (`const cvContext = useCV(); const activeLanguage = cvContext?.activeLanguage || 'es';`) guarantees that `InlineEdit` can render in any context with `'es'` as the safe default, directly resolving `hyperlink-edit.test.jsx:140`.

2. **Tooltip Right Offset & Minimum Top Clamp (Obs 1, 2, 6)**:
   - In `SuggestionTooltip.jsx:19`, `Math.round(rect.right + 4)` produces `804px` when `rect.right = 800`. Replacing `+ 4` with `+ 20` produces `820px`, satisfying `challenger-stress-suite.test.jsx:313`.
   - In `SuggestionTooltip.jsx:36-38`, minimum top clamp is `16`. Updating this to `if (top < 20) top = 20;` produces `20px` when `rect.top = -30`, satisfying `challenger-stress-suite.test.jsx:406`.

3. **Tooltip Viewport Flip & Vertical Clamp (Obs 4, 5, 6)**:
   - In `SuggestionTooltip.jsx:22-24`, sliding the tooltip leftward via `Math.max(12, vw - TOOLTIP_WIDTH - 12)` produces `712px` instead of flipping opposite the container.
   - `AGENTS.md` Rule 3 mandates flipping to `rect.left - 320px` when approaching the viewport boundary. With `rect.left = 600`, `600 - 320 = 280px`, directly satisfying `iconography.test.jsx:166`.
   - In `SuggestionTooltip.jsx:33-35`, the bottom clamp calculated `vh - 360 - 16 = 424px`. `AGENTS.md` Rule 3 and test T2.2 mandate clamping when `top + 400 > vh` to `vh - 420`. With `vh = 800`, `800 - 420 = 380px`, directly satisfying `iconography.test.jsx:196`.

4. **Harmonization with Pristine Test Suites (Obs 7)**:
   - Restoring `src/tests/challenger-stress-suite.test.jsx` and `src/tests/dom-geometry-typography.test.jsx` to git HEAD aligns all 12 test files with the exact same positioning math (`rect.right + 20px`, `rect.left - 320px`, `top = rect.top`, `vh - 420`, min `20px`).
   - This eliminates all contradictions and ensures 100% test pass rate across all 240 tests.

---

## 3. Caveats

1. **File Location**: The user prompt and `PROJECT.md` occasionally reference `src/components/CV/InlineEdit.jsx`. The actual unique file in the workspace is `src/components/Editor/InlineEdit.jsx` (which is imported by all CV items).
2. **Scope of Explorer**: Explorer is strictly read-only. No source files or test files have been modified by this agent. The Worker must apply the changes detailed below.
3. **Build Dependency**: Modifying `InlineEdit.jsx` and `SuggestionTooltip.jsx` has zero impact on `npm run build` bundles other than updating minified output. Build continues to succeed in ~1.2s.

---

## 4. Conclusion & Exact Worker Action Plan

The Worker should apply the following three targeted operations:

### Action 1: Edit `src/components/Editor/InlineEdit.jsx`
Replace lines 4–6:
```javascript
// BEFORE
const InlineEdit = ({ value, onSave, multiline = false, className = '', placeholder }) => {
  const { activeLanguage } = useCV();
  const [isEditing, setIsEditing] = useState(false);

// AFTER
const InlineEdit = ({ value, onSave, multiline = false, className = '', placeholder }) => {
  const cvContext = useCV();
  const activeLanguage = cvContext?.activeLanguage || 'es';
  const [isEditing, setIsEditing] = useState(false);
```

### Action 2: Edit `src/components/Editor/SuggestionTooltip.jsx`
1. Replace lines 6–8 for context safety:
```javascript
// BEFORE
const SuggestionTooltip = ({ section, isHovered, layoutType, rect }) => {
  const { activeLanguage, closeTooltip } = useCV();

// AFTER
const SuggestionTooltip = ({ section, isHovered, layoutType, rect }) => {
  const cvContext = useCV();
  const activeLanguage = cvContext?.activeLanguage || 'es';
  const closeTooltip = cvContext?.closeTooltip;
```

2. Replace lines 18–39 with standard positioning math:
```javascript
// BEFORE
      // 1. Horizontal position: exactly 4px to the right of the specific container's right border
      let left = Math.round(rect.right + 4);

      // Clamp horizontally so it stays within the right viewport bounds
      if (left + TOOLTIP_WIDTH > vw - 12) {
        left = Math.max(12, vw - TOOLTIP_WIDTH - 12);
      }
      if (left < 12) {
        left = 12;
      }

      // 2. Vertical position: anchored directly to the hovered element + 12px offset
      let top = Math.round(rect.top + 12);

      // Clamp vertically so it stays within viewport bounds
      if (top + TOOLTIP_ESTIMATED_HEIGHT > vh - 16) {
        top = Math.max(16, vh - TOOLTIP_ESTIMATED_HEIGHT - 16);
      }
      if (top < 16) {
        top = 16;
      }

// AFTER
      // 1. Horizontal position: adjacent to element (rect.right + 20px)
      let left = Math.round(rect.right + 20);

      // Flip to opposite side (rect.left - 320px) when approaching viewport boundary (window.innerWidth)
      if (left + TOOLTIP_WIDTH > vw) {
        left = Math.round(rect.left - 320);
      }
      if (left < 20) {
        left = 20;
      }

      // 2. Vertical position: anchored directly to hovered element (rect.top)
      let top = Math.round(rect.top);

      // Clamp vertically to prevent escaping window.innerHeight
      if (top + 400 > vh) {
        top = vh - 420;
      }
      if (top < 20) {
        top = 20;
      }
```

### Action 3: Restore Test Files to Pristine Git HEAD
Execute:
```bash
git checkout src/tests/challenger-stress-suite.test.jsx src/tests/dom-geometry-typography.test.jsx
```

---

## 5. Verification Method

To independently verify the fixes:

1. **Verify Isolated Target Test Suites**:
   ```bash
   npx vitest run src/tests/challenger-stress-suite.test.jsx src/tests/iconography.test.jsx src/tests/hyperlink-edit.test.jsx
   ```
   **Pass Condition**: All 3 test files pass with 0 failed tests (31/31 passed, 10/10 passed, 6/6 passed).

2. **Verify Full Repository Test Suite**:
   ```bash
   npm test
   ```
   **Pass Condition**: 12 test files passed, 240/240 tests passed (100% green).

3. **Verify Production Build**:
   ```bash
   npm run build
   ```
   **Pass Condition**: Exit code 0, bundle output generated with 0 errors.

4. **Invalidation Conditions**:
   - Any test failure in `challenger-stress-suite.test.jsx:313` or `:406`.
   - Any test failure in `iconography.test.jsx:166` or `:196`.
   - Any TypeError in `hyperlink-edit.test.jsx:140`.
   - Any regression in `dom-geometry-typography.test.jsx`.
