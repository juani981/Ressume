# Handoff Report: Design Sliders and CSS Variable Synchronization Survey

## 1. Observation

This investigation examined the full lifecycle of design variables in Ressume: from state management in `cvData.layout`, through user interaction via sliders in `ActionMenu.jsx`, live DOM application in `App.jsx`, propagation into print markup in `staticHtmlPdfEngine.js`, and styling in `src/styles/print.css` and `src/index.css`.

### 1.1 Complete Inventory of Design Variables & Sliders in `cvData.layout`

The canonical schema in `src/utils/schema.js` (lines 2–17) defines the default layout state:

```javascript
// src/utils/schema.js:2-17
layout: {
  type: '2-column',        // '1-column' (ATS Optimized) or '2-column' (Visual Recruiter)
  isAtsMode: false,        // boolean
  leftBg: '',              // string hex or empty (uses CSS defaults)
  rightBg: '',             // string hex or empty
  leftColumnWidth: null,   // number (20 to 55) or null (defaults to 33.33%)
  fontFamily: 'Poppins',   // 'Poppins' | 'Inter' | 'Roboto' | 'Merriweather' | 'JetBrains Mono'
  fontScale: 1.0,          // 0.50 to 1.25 (Master overall font scale)
  titleScale: 1.0,         // 0.50 to 1.40 (Global Titles scale)
  bodyScale: 1.0,          // 0.50 to 1.30 (Global Body text scale)
  listScale: 1.0,          // 0.50 to 1.30 (Global Lists and bullets scale)
  lineHeight: 1.45,        // 1.25 to 1.85 (Global text line height)
  pagePadding: 24,         // 0 to 60 (Document padding in px)
  sectionGap: 20,          // 0 to 50 (Vertical spacing between sections in px)
  itemGap: 8               // 0 to 30 (Vertical spacing between items and bullets in px)
}
```

The interactive UI controls in `src/components/Editor/ActionMenu.jsx` bind directly to these variables via `updateLayout(key, value)`:

| Design Variable | UI Control Type | Slider / Input Range | Step | Default | Test ID / Selector | File & Line |
|---|---|---|---|---|---|---|
| `fontFamily` | `<select>` dropdown | 5 Google Font options | N/A | `'Poppins'` | `select[aria-label="Selector de Tipo de Letra"]` | `ActionMenu.jsx:568–589` |
| `titleScale` | `<input type="range">` | 0.50 – 1.40 | 0.05 | 1.00 | `data-testid="slider-title-scale"` | `ActionMenu.jsx:605–616` |
| `bodyScale` | `<input type="range">` | 0.50 – 1.30 | 0.05 | 1.00 | `data-testid="slider-body-scale"` | `ActionMenu.jsx:626–637` |
| `listScale` | `<input type="range">` | 0.50 – 1.30 | 0.05 | 1.00 | `data-testid="slider-list-scale"` | `ActionMenu.jsx:647–658` |
| `fontScale` | `<input type="range">` | 0.50 – 1.25 | 0.05 | 1.00 | `data-testid="slider-font-scale"` | `ActionMenu.jsx:674–685` |
| `lineHeight` | `<input type="range">` | 1.25 – 1.85 | 0.05 | 1.45 | `data-testid="slider-line-height"` | `ActionMenu.jsx:692–703` |
| `pagePadding` | `<input type="range">` | 0 – 60 | 2 | 24 | `input[aria-label="Control de Margen de Página"]` | `ActionMenu.jsx:754–764` |
| `sectionGap` | `<input type="range">` | 0 – 50 | 2 | 20 | `input[aria-label="Control de Espacio entre Secciones"]` | `ActionMenu.jsx:772–782` |
| `itemGap` | `<input type="range">` | 0 – 30 | 1 | 8 | `input[aria-label="Control de Espacio entre Elementos"]` | `ActionMenu.jsx:790–800` |
| `leftColumnWidth` | `<input type="range">` | 20 – 55 | 1 | 33 | `data-testid="slider-column-width"` | `ActionMenu.jsx:809–820` |
| `leftColumnWidth` (DND) | Draggable Divider | 20 – 55 | continuous | 33 | `src/components/Editor/ColumnResizer.jsx` | `App.jsx:102–106` |
| `leftBg` | `ColorPickerSwatch` | 6 presets + custom hex | N/A | `'#fafafa'` | `ColorPickerSwatch label="Fondo Columna Lateral"` | `ActionMenu.jsx:832–838` |
| `rightBg` | `ColorPickerSwatch` | 6 presets + custom hex | N/A | `'#ffffff'` | `ColorPickerSwatch label="Fondo Columna Principal"` | `ActionMenu.jsx:840–846` |
| `isAtsMode` / `type` | Toggle button | '2-column' / '1-column' | N/A | '2-column' | `LayoutModeToggle.jsx` & `ActionMenu.jsx:55–61` | `LayoutModeToggle.jsx:20–25` |

### 1.2 Application of CSS Variables to `#area-cv` in the Live Editor

In `src/App.jsx` (lines 139–148, 260–294):
1. `dynamicSpacing` is computed via `computeTypographyTokens(cvData.layout)` from `src/utils/typographyUtils.js` (lines 36–66):
   ```javascript
   // src/utils/typographyUtils.js:51-66
   return {
     '--body-font': currentFontFamily,
     '--font-scale': `${fontScale}`,
     '--title-scale': `${titleScale}`,
     '--body-scale': `${bodyScale}`,
     '--list-scale': `${listScale}`,
     '--line-height': `${lineHeight}`,
     '--page-padding': `${pagePadding}px`,
     '--section-gap': `${sectionGap}px`,
     '--item-gap': `${itemGap}px`,
     '--grid-template-columns': gridTemplateColumns,
     '--left-col-percent': `${leftColPercent}%`,
     '--left-bg': layout.leftBg || 'var(--container-color-alt)',
     '--right-bg': layout.rightBg || '#ffffff',
   };
   ```
2. Applied inline to `<div id="area-cv">` in `App.jsx` (lines 265–294):
   - Grid structure: `display: is2Col ? 'grid' : 'block'`, `width: '100%', minWidth: '794px', maxWidth: '794px'`.
   - Dynamic background: `background: is2Col ? linear-gradient(...) : '#ffffff'`.
   - In 2-col mode: `gridTemplateColumns`, `--grid-template-columns`, `--left-col-percent`, `--left-bg`, `--right-bg`.
   - Dynamic spacing spread: `...dynamicSpacing`.
3. In `src/index.css` (lines 89–108), `#area-cv` re-declares the dependent typography tokens using standard `calc()`:
   ```css
   --h1-font-size: calc(1.5rem * var(--font-scale, 1));
   --h2-font-size: calc(1.25rem * var(--font-scale, 1));
   --h3-font-size: calc(1rem * var(--font-scale, 1));
   --normal-font-size: calc(0.938rem * var(--font-scale, 1));
   --small-font-size: calc(0.875rem * var(--font-scale, 1));
   --smaller-font-size: calc(0.813rem * var(--font-scale, 1));

   --title-h1-size: calc(var(--h1-font-size) * var(--title-scale, 1));
   --title-h2-size: calc(var(--h2-font-size) * var(--title-scale, 1));
   --title-h3-size: calc(var(--h3-font-size) * var(--title-scale, 1));
   --title-subtitle-size: calc(1.05rem * var(--font-scale, 1) * var(--title-scale, 1));

   --body-font-size: calc(var(--normal-font-size) * var(--body-scale, 1));
   --body-small-font-size: calc(var(--small-font-size) * var(--body-scale, 1));
   --body-smaller-font-size: calc(var(--smaller-font-size) * var(--body-scale, 1));

   --list-font-size: calc(var(--normal-font-size) * var(--list-scale, 1));
   ```

### 1.3 Propagation to the Print Document / Iframe during Export

When `executeCleanPrint(cvData, lang)` runs in `src/utils/staticHtmlPdfEngine.js`:
1. **DOM Snapshot & Cloning**:
   - `captureEditorSnapshot()` reads `#area-cv` dimensions and identifies broken nodes (`[data-editor-break-forced="true"]`) (lines 274–335).
   - `createSanitizedPrintClone(liveAreaCv)` clones `#area-cv`, strips non-print controls, and removes interactive outlines (lines 617–755).
2. **CSS Variable Generation**:
   - `generateLayoutVariablesCSS(cvData?.layout)` builds `:root, html, body, #area-cv` CSS block declaring all tokens, including font sizes and grid columns (lines 33–90).
   - Injected into `<style id="cv-base-styles">` alongside `index.css` (lines 1264–1288).
   - Followed by `<style id="cv-print-styles">` containing `print.css` and `<style id="cv-snapshot-breaks">` containing break rules (lines 1280–1285).
3. **Iframe DOM Variable Synchronization**:
   - In `triggerPrint()` (lines 1306–1347), all typography tokens are explicitly set on `doc.documentElement.style`, `doc.body.style`, and `areaCv.style`.
   - All custom properties from `liveAreaCv.style` (e.g. `--grid-template-columns`, `--left-col-percent`) are copied verbatim to `doc.documentElement.style` and `areaCv.style`.

### 1.4 Critical Breakdowns, Overrides, and Hardcoded Discrepancies

#### A. The Destructive Auto-Scale & `zoom` Heuristic in `staticHtmlPdfEngine.js`
In three distinct code locations in `src/utils/staticHtmlPdfEngine.js`, an automatic height-scaling heuristic forcibly shrinks the user's sliders when `rawHeight > maxAllowedHeight`:
1. Lines 1453–1471 (inside `if (snapshot)`):
   ```javascript
   // src/utils/staticHtmlPdfEngine.js:1453-1468
   if (rawHeight > maxAllowedHeight) {
     scale = calculatePrintScale(rawHeight, totalPages);
     if (doc.body?.style) {
       doc.body.style.zoom = scale;
     }
     if (doc.documentElement) {
       const curFontScale = parseFloat(liveAreaCv?.style?.getPropertyValue('--font-scale') || '1.0');
       const curSectionGap = parseFloat(liveAreaCv?.style?.getPropertyValue('--section-gap') || '20');
       const curItemGap = parseFloat(liveAreaCv?.style?.getPropertyValue('--item-gap') || '8');
       const curPadding = parseFloat(liveAreaCv?.style?.getPropertyValue('--page-padding') || '24');
       doc.documentElement.style.setProperty('--font-scale', `${(curFontScale * scale).toFixed(3)}`, 'important');
       doc.documentElement.style.setProperty('--section-gap', `${Math.max(8, Math.round(curSectionGap * scale))}px`, 'important');
       doc.documentElement.style.setProperty('--item-gap', `${Math.max(4, Math.round(curItemGap * scale))}px`, 'important');
       doc.documentElement.style.setProperty('--page-padding', `${Math.max(12, Math.round(curPadding * scale))}px`, 'important');
     }
   }
   ```
2. Lines 1509–1525 (inside `else if (is2Col && areaCv)`): exact duplicate of the block above.
3. Lines 1640–1661 (fallback ceiling check before printing):
   ```javascript
   // src/utils/staticHtmlPdfEngine.js:1648-1661
   if (finalRawHeight > allowedCeiling && doc.body?.style && (!doc.body.style.zoom || doc.body.style.zoom === '1' || doc.body.style.zoom === '')) {
     const fallbackScale = calculatePrintScale(finalRawHeight, activeTotalPages);
     doc.body.style.zoom = fallbackScale;
     if (doc.documentElement) {
       ...
       doc.documentElement.style.setProperty('--font-scale', `${(curFontScale * fallbackScale).toFixed(3)}`, 'important');
       doc.documentElement.style.setProperty('--section-gap', `${Math.max(8, Math.round(curSectionGap * fallbackScale))}px`, 'important');
       doc.documentElement.style.setProperty('--item-gap', `${Math.max(4, Math.round(curItemGap * fallbackScale))}px`, 'important');
       doc.documentElement.style.setProperty('--page-padding', `${Math.max(12, Math.round(curPadding * fallbackScale))}px`, 'important');
     }
   }
   ```
*Impact*: This directly overrides the user's manual adjustments to `--font-scale`, `--section-gap`, `--item-gap`, and `--page-padding` with `!important` and injects `doc.body.style.zoom = scale`, distorting coordinates and violating `AGENTS.md` Rule 5 and User Request Requirements R1 & R2.

#### B. Blanket `break-before: auto !important` in 2-Column Mode (`print.css:72–98`)
In `src/styles/print.css` (lines 72–98):
```css
#area-cv.resume.bd-grid .resume__left *,
#area-cv.resume.bd-grid .resume__right *,
#area-cv.resume.bd-grid .resume__left .break-page-before,
#area-cv.resume.bd-grid .resume__right .break-page-before,
#area-cv.resume.bd-grid .resume__left .force-page-break-before,
#area-cv.resume.bd-grid .resume__right .force-page-break-before,
#area-cv.resume.bd-grid .resume__left [data-editor-break-forced="true"],
#area-cv.resume.bd-grid .resume__right [data-editor-break-forced="true"],
... {
  break-before: auto !important;
  page-break-before: auto !important;
  break-after: auto !important;
  page-break-after: auto !important;
}
```
*Impact*: In 2-column mode, this high-specificity rule neutralizes all declarative `break-before: page` breaks generated by `snapshotBreaksCSS`. As a result, elements only split when overflowing the column height.

#### C. Zero Top Margin on Page 2 Due to `@page { margin: 0; }`
In `src/styles/print.css` (lines 8–11):
```css
@page {
  size: A4;
  margin: 0;
}
```
Because the physical page has zero margins (required for edge-to-edge column bleed), any item or bullet point that naturally splits onto Page 2 lands at physical `y = 0` (touching the top edge of the paper).
In `staticHtmlPdfEngine.js` (lines 1618–1638), a heuristic tried to patch this:
```javascript
// src/utils/staticHtmlPdfEngine.js:1618-1638
for (let p = 1; p < (snapshot?.totalPages || 2); p++) {
  const pageBoundary = p * pageHeightPx;
  let firstOnPage = null;
  candidates.forEach((el) => {
    ...
    if (dist < minDistance) {
      firstOnPage = el;
    }
  });
  if (firstOnPage) {
    firstOnPage.style.setProperty('padding-top', 'var(--page-padding, 24px)', 'important');
    firstOnPage.style.setProperty('margin-top', '0', 'important');
  }
}
```
*Flaw*: In 2-column mode, there are **two** parallel columns on Page 2. This algorithm picks only a single global `firstOnPage` across the whole document. If `firstOnPage` is in the left column, the right column gets 0px top padding. If `firstOnPage` is in the right column, the left column gets 0px top padding. Furthermore, relying on `getBoundingClientRect()` on an offscreen iframe violates `AGENTS.md` Rule 5.

#### D. Inconsistent `item-gap` Fallbacks
- Canonical default in `src/utils/schema.js`: `itemGap: 8`.
- `src/index.css` line 202 & line 512: `margin-bottom: var(--item-gap, 8px);`.
- `src/index.css` line 979: `margin-bottom: var(--item-gap, 6px);`.
- `src/styles/print.css` line 431: `margin-bottom: var(--item-gap, 6px) !important;`.
- `src/components/CV/SortableBulletItem.jsx` lines 44 & 62: `marginBottom = 'var(--item-gap, 6px)'`.
- `src/components/CV/items/ExperienceItem.jsx` line 85: `marginBottom: 'var(--item-gap, 6px)'`.

#### E. Item Sub-Components Bypassing Categorical Scales (`bodyScale`, `listScale`)
Eight item components hardcode non-categorical font sizes:
1. `var(--smaller-font-size)` instead of `var(--body-smaller-font-size, var(--smaller-font-size))`:
   - `src/components/CV/items/ProjectsItem.jsx:43, 178` (`item.date`)
   - `src/components/CV/items/VolunteeringItem.jsx:42, 167` (`item.date`)
   - `src/components/CV/items/ReferencesItem.jsx:44` (reference contact/details)
   - `src/components/CV/items/PublicationsItem.jsx:37` (`item.date`)
   - `src/components/CV/items/LanguagesItem.jsx:28` (language level / description)
   - `src/components/CV/items/CertificatesItem.jsx:37, 58` (`item.date` and details)
   - `src/components/CV/items/AwardsItem.jsx:36` (`item.date`)
   - `src/components/CV/items/MentoringItem.jsx:37` (`item.date`)
2. `var(--small-font-size)` instead of `var(--body-small-font-size, var(--small-font-size))`:
   - `src/components/CV/items/ReferencesItem.jsx:35` (`item.company`)
   - `src/components/CV/items/PublicationsItem.jsx:49` (`item.publisher`)
   - `src/components/CV/items/CertificatesItem.jsx:48` (`item.institution`)
   - `src/components/CV/items/LanguagesItem.jsx:42`
   - `src/components/CV/items/AwardsItem.jsx:48` (`item.issuer`)
3. `var(--normal-font-size)` instead of `var(--list-font-size, var(--normal-font-size))`:
   - `src/components/CV/items/LanguagesItem.jsx:19` (language title)

*Impact*: Modifying the `bodyScale` or `listScale` sliders in the editor has zero effect on these dates, subtitles, or language items.

#### F. Section Title Spacing Disconnected from Sliders
In `src/index.css` line 220 and `src/styles/print.css` line 257:
```css
.section-title {
  margin-bottom: var(--mb-3, 1.5rem) !important; /* Fixed at 24px */
}
```
The vertical gap between a section title and its first item is hardcoded to `1.5rem` (`24px`) and does not react to `--item-gap` or `--section-gap`.

---

## 2. Logic Chain

1. **Premise 1**: The user request explicitly demands strict 1:1 dimensional parity between the live editor and PDF print output, unconditional propagation of 100% of `cvData.layout` sliders, elimination of spurious zooming or font shrinkage, and proper top padding on Page 2 for overflowing items.
2. **Premise 2**: In `staticHtmlPdfEngine.js` (lines 1453–1471, 1509–1525, 1640–1661), whenever the measured height of the iframe DOM exceeds `totalPages * pageHeightPx`, the engine invokes `calculatePrintScale` and sets `doc.body.style.zoom = scale`, while simultaneously rewriting `--font-scale`, `--section-gap`, `--item-gap`, and `--page-padding` on `doc.documentElement` using `!important`.
3. **Inference 1**: Any adjustment made by the user to increase font size or spacing that causes content to expand across pages triggers this auto-scaler, effectively canceling out the user's slider changes in the print output.
4. **Premise 3**: In `src/styles/print.css` (lines 72–98), a high-specificity selector forces `break-before: auto !important` on all children of `.resume__left` and `.resume__right` in 2-column mode.
5. **Inference 2**: Even when `snapshotBreaksCSS` or `triggerPrint` specifies that an element or bullet point should `break-before: page`, the rule in `print.css` defeats it. The browser thus splits content strictly on height overflow.
6. **Premise 4**: `@page` specifies `margin: 0;` (to ensure 2-column background bleed). When the browser splits content on height overflow, the first element on Page 2 receives no page margin. The existing heuristic in `staticHtmlPdfEngine.js` (lines 1618–1638) attempts to add `padding-top: var(--page-padding)` using `getBoundingClientRect()`, but it only selects a single `firstOnPage` across the entire document, leaving the other column with 0px top padding.
7. **Inference 3**: In 2-column documents overflowing onto Page 2, one of the two columns inevitably starts at physical `y = 0` on Page 2 without top padding.
8. **Premise 5**: Secondary metadata (dates, institutions, issuers) in eight item components (`ProjectsItem`, `VolunteeringItem`, `ReferencesItem`, `PublicationsItem`, `LanguagesItem`, `CertificatesItem`, `AwardsItem`, `MentoringItem`) use `var(--smaller-font-size)` or `var(--small-font-size)` instead of `var(--body-smaller-font-size)` or `var(--body-small-font-size)`.
9. **Inference 4**: Changing the `bodyScale` slider in `ActionMenu.jsx` only scales main paragraphs, leaving all dates and metadata completely unchanged.

---

## 3. Caveats

1. **Physical Browser Variations**: Sub-pixel font rasterization in Gecko (Zen/Firefox) differs from Blink (Chromium). While CSS variables are mathematically synchronized, exact line wraps for bullet points at the boundary of a fold must be validated in the real browser.
2. **`break-inside: avoid` on Multiline Bullets**: If a single bullet point has 5 lines of text and starts near the bottom of Page 1, `break-inside: avoid` will push the entire 5-line bullet to Page 2. The editor's `paginationEngine.js` must mirror this exact break point so that `data-editor-break-forced` matches what the print engine renders.
3. No other areas were omitted. All CSS files, slider components, typography hooks, and print engines have been fully surveyed.

---

## 4. Conclusion

The discrepancy between the live editor and PDF print output is driven by five distinct architectural defects:
1. **Destructive Auto-Scaler & Zoom**: `calculatePrintScale` and `doc.body.style.zoom` in `staticHtmlPdfEngine.js` forcibly mutate CSS variables with `!important` when print height slightly exceeds page boundaries, overriding user sliders.
2. **Over-Aggressive Break Neutralization in 2-Column Mode**: `print.css` lines 72–98 disables `break-before: page` on all 2-column children, preventing synchronized page splitting.
3. **Single-Element Page 2 Margin Heuristic**: `staticHtmlPdfEngine.js` lines 1618–1638 only applies top padding to one element across the entire document on Page 2, leaving the counterpart column touching the paper edge under `@page { margin: 0 }`.
4. **Hardcoded Base Font Variables**: Eight section item components use `var(--smaller-font-size)` / `var(--small-font-size)` directly, rendering `bodyScale` ineffective for dates and subtitles.
5. **Fallback Inconsistencies**: `itemGap` alternates between 6px and 8px fallbacks across files.

### Specific Recommendations for Strict Synchronization:
1. **Remove Print Auto-Scaling and Zoom**: Completely remove the three `calculatePrintScale` / `doc.body.style.zoom` overrides in `staticHtmlPdfEngine.js` (lines 1453–1471, 1509–1525, 1640–1661). The print engine must respect the exact page count (`snapshot.totalPages`) and user-chosen font scales without distortion.
2. **Column-Aware Page 2 Margin Synchronization**: In 2-column mode, ensure that the first overflowing element of **both** `.resume__left` and `.resume__right` on Page 2 receives `padding-top: var(--page-padding, 24px) !important; margin-top: 0 !important;`.
3. **Harmonize Item Components to Categorical Scales**: Update `ProjectsItem.jsx`, `VolunteeringItem.jsx`, `ReferencesItem.jsx`, `PublicationsItem.jsx`, `LanguagesItem.jsx`, `CertificatesItem.jsx`, `AwardsItem.jsx`, and `MentoringItem.jsx` to use `var(--body-smaller-font-size, var(--smaller-font-size))` and `var(--body-small-font-size, var(--small-font-size))`.
4. **Standardize `itemGap`**: Align all fallbacks across `index.css`, `print.css`, and item components to `var(--item-gap, 8px)`.
5. **Connect Section Title Bottom Margin**: Update `.section-title` in `index.css` and `print.css` to use `margin-bottom: var(--item-gap, 12px)` or a dedicated token so title spacing scales harmoniously.

---

## 5. Verification Method

To independently verify these findings and confirm slider synchronization:

1. **Verify Existing Tests**:
   ```bash
   npm test
   ```
   Ensures that unit and integration tests pass.
2. **Inspect Cypress Print Parity Specs**:
   - `cypress/e2e/03-editor-modifications-to-print.cy.js`
   - `cypress/e2e/05-pixel-fidelity-and-css-parity.cy.js`
   - `cypress/e2e/08-two-column-print-synchronization.cy.js`
3. **Execute Cypress E2E in a Real Browser**:
   ```bash
   npx cypress run --spec "cypress/e2e/03-editor-modifications-to-print.cy.js,cypress/e2e/05-pixel-fidelity-and-css-parity.cy.js,cypress/e2e/08-two-column-print-synchronization.cy.js"
   ```
4. **Invalidation Conditions**:
   - If `doc.body.style.zoom !== 1.0` during print export, zoom distortion is present.
   - If computed `--font-scale`, `--page-padding`, `--section-gap`, or `--item-gap` in `cy.getLastPrintDoc()` differs from `cvData.layout`, auto-scaling or CSS overrides are corrupting the values.
   - If the first element of either column on Page 2 has `getBoundingClientRect().top === 0` relative to the page fold, the top padding bug is active.
