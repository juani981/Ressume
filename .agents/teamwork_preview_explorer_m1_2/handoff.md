# Architectural Blueprint & Styling Logic for `src/components/PDF/CVDocument.jsx`

**Explorer**: Explorer M1-2  
**Target File**: `src/components/PDF/CVDocument.jsx` (and companion PDF modules in `src/components/PDF/`)  
**Workspace Root**: `/home/juani/Documentos/Ressume`  
**Date**: 2026-09-03  

---

## 1. Observation

### 1.1 DOM Hierarchy and Layout Geometry of `#area-cv`
Inspecting `/home/juani/Documentos/Ressume/src/App.jsx` (lines 301–454):
- **2-Column Mode (`cvData.layout?.type === '2-column'`)**:
  - Container `#area-cv`:
    ```jsx
    <div className="resume bd-grid" id="area-cv" ref={areaCvRef} style={{
      display: 'grid',
      gridTemplateColumns: leftColumnWidth ? `${leftColumnWidth}% ${100 - leftColumnWidth}%` : '1fr 2fr',
      position: 'relative',
      padding: '0',
      maxWidth: '1024px',
      width: '100%',
      margin: '0 auto',
      ...dynamicSpacing
    }}>
    ```
  - Left column (`.resume__left`):
    - `background`: `cvData.layout?.leftBg || 'var(--container-color-alt)'` (defaults to `#F8FAFC` / `#fafafa`)
    - `padding`: `var(--page-padding, 2rem) var(--page-padding, 1.5rem)`
    - Renders `leftSections = cvData.sections.filter(s => s.column === 'left')`
  - Right column (`.resume__right`):
    - `background`: `cvData.layout?.rightBg || 'var(--container-color)'` (defaults to `#ffffff`)
    - `padding`: `var(--page-padding, 2rem) var(--page-padding, 1.5rem)`
    - Renders `rightSections = cvData.sections.filter(s => s.column === 'right')`
- **1-Column / ATS Mode (`cvData.layout?.type === '1-column'`)**:
  - Container `#area-cv`:
    ```jsx
    <div className="resume" id="area-cv" ref={areaCvRef} style={{
      display: 'block',
      position: 'relative',
      padding: `var(--page-padding, 24px)`,
      background: 'var(--container-color)',
      maxWidth: '840px',
      width: '100%',
      margin: '0 auto',
      ...dynamicSpacing
    }}>
      <div className="resume__single-column" style={{ width: '100%', maxWidth: '840px', margin: '0 auto' }}>
        {cvData.sections.map(section => <CVSection key={section.id} section={section} />)}
      </div>
    </div>
    ```

### 1.2 Spacing, Scaling, and Typography Tokens
Inspecting `src/App.jsx` (lines 182–209) and `src/index.css` (lines 5–33, 167–190):
- **Curated Font Families**:
  - `'Poppins': "'Poppins', sans-serif"` (Default)
  - `'Inter': "'Inter', sans-serif"`
  - `'Roboto': "'Roboto', sans-serif"`
  - `'Merriweather': "'Merriweather', serif"`
  - `'JetBrains Mono': "'JetBrains Mono', monospace"`
- **Scale Factors**:
  - `fontScale`: master scale factor (default `1.0`, range `0.85` to `1.25`)
  - `titleScale`: titles scale factor (default `1.0`, range `0.80` to `1.40`)
  - `bodyScale`: body copy scale factor (default `1.0`, range `0.80` to `1.30`)
  - `listScale`: lists & bullets scale factor (default `1.0`, range `0.80` to `1.30`)
  - `lineHeight`: line height multiplier (default `1.45`, range `1.25` to `1.85`)
- **Spacing Parameters**:
  - `pagePadding`: default `24` px
  - `sectionGap`: default `20` px (minimum 10px enforced in CSS)
  - `itemGap`: default `8` px (minimum 4px enforced in CSS)
- **Base CSS Font Sizes**:
  - `--h1-font-size`: `calc(1.5rem * var(--font-scale, 1))` (Name)
  - `--h2-font-size`: `calc(1.25rem * var(--font-scale, 1))` (Section Titles)
  - `--h3-font-size`: `calc(1rem * var(--font-scale, 1))` (Item Titles)
  - `--normal-font-size`: `calc(0.938rem * var(--font-scale, 1))`
  - `--small-font-size`: `calc(0.875rem * var(--font-scale, 1))` (Subtitles, Studies, Company)
  - `--smaller-font-size`: `calc(0.813rem * var(--font-scale, 1))` (Dates, Meta)

### 1.3 Dynamic YIQ Contrast Calculation
In `src/App.jsx` (lines 212–245) and `src/utils/staticHtmlPdfEngine.js` (lines 41–74):
```javascript
const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
// if yiq < 128 (dark background):
//   titleColor = '#fcfcfc', textColor = '#f0efef', textColorLight = '#cccccc', containerColorAlt = 'rgba(255,255,255,0.1)'
// if yiq >= 128 (light background):
//   titleColor = '#0b0a0a' (or #0f172a), textColor = '#403a3a' (or #334155), textColorLight = '#707070' (or #64748b), containerColorAlt = 'rgba(0,0,0,0.05)'
```
And `circleColor` is adjusted by $\pm 40$ luminance levels.

### 1.4 Comprehensive Section and Item Types Inventory
Examining `src/registry/sectionRegistry.js` and `src/components/CV/items/`:
1. `profile_header`: item contains `name`, `subtitle`, `location`, `email`, `phone`, `linkedin`, `github`.
2. `about`: item contains `description`.
3. `list` (Work Experience): item contains `title`, `subtitle`, `date`, `bullets` (array), optional `link`, `linkText`, `description`.
4. `projects`: item contains `title`, `subtitle`, `date`, `link`, `linkText`, `description`, `bullets`.
5. `education`: item contains `title`, `subtitle`, `date`.
6. `skills`: item contains `title`, `description`.
7. `certificates`: item contains `title`, `subtitle`, `date`, `credentialId`, `link`, `linkText`.
8. `languages`: item contains `title` (or `language`), `subtitle` (or `level`), `description`.
9. `awards`: item contains `title`, `subtitle`, `date`, `description`.
10. `publications`: item contains `title`, `subtitle`, `date`, `link`, `linkText`, `description`.
11. `volunteering`: item contains `title`, `subtitle`, `date`, `description`, `bullets`.
12. `references`: item contains `title`, `subtitle`, `email`, `phone`, `relationship`.
13. `simple_list`: item contains `text`.
14. `custom`: fallback item schema mimicking `list` (`title`, `subtitle`, `date`, `bullets`).

### 1.5 Pagination & Page-Break Rules in DOM
In `src/index.css` (lines 1214–1238):
```css
.cv-section, .cv-block, .section, .experience__content, .education__content, .skills__name, .editable-item-container {
  page-break-inside: avoid !important;
  break-inside: avoid !important;
}
.section-title, h1, h2, h3 {
  break-after: avoid !important;
  page-break-after: avoid !important;
}
```

### 1.6 Profile Header Data Normalization
In `src/utils/staticHtmlPdfEngine.js` (lines 319–336):
When `cvData.profile` exists, top-level values (`profile.name`, `profile.subtitle`, etc.) are merged into the first item of `profile_header` to prevent missing name/contact details if the user modified profile state independently.

---

## 2. Logic Chain

### 2.1 Translating DOM & CSS Grid into `@react-pdf/renderer` Yoga Flexbox
1. `@react-pdf/renderer` does not support CSS Grid (`display: grid`, `gridTemplateColumns`), CSS custom properties (`var(--...)`), or relative CSS units (`rem`, `calc()`).
2. Its layout engine is Facebook Yoga (Flexbox).
3. Therefore:
   - For 2-column mode, `#area-cv` translates to a root `<View style={{ flexDirection: 'row', width: '100%', minHeight: '100%' }}>`.
   - Left column translates to `<View style={{ width: `${leftColPercent}%`, backgroundColor: leftBg, ... }}>`.
   - Right column translates to `<View style={{ width: `${100 - leftColPercent}%`, backgroundColor: rightBg, ... }}>`.
   - For 1-column mode, `#area-cv` translates to `<View style={{ width: '100%', backgroundColor: '#ffffff', ... }}>`.

### 2.2 Standard Type 1 Font Mapping (Offline & Zero Network Calls)
1. User requirement states:
   - "Be entirely client-side — no server calls"
   - "No network requests are made during PDF generation"
   - "Text in the PDF is selectable (not rasterized)"
2. Attempting to register remote Google Fonts in React-PDF via `Font.register({ family: 'Poppins', src: 'https://...' })` makes asynchronous HTTP requests during document rendering. If network is unavailable or restricted, generation fails or hangs.
3. The PDF specification and `@react-pdf/renderer` provide 14 standard Type 1 fonts built into all PDF viewports without downloading any bytes:
   - `Helvetica`, `Helvetica-Bold`, `Helvetica-Oblique` (Standard Sans-Serif)
   - `Times-Roman`, `Times-Bold`, `Times-Italic` (Standard Serif)
   - `Courier`, `Courier-Bold`, `Courier-Oblique` (Standard Monospace)
4. We establish a deterministic font mapping function:
   - `Poppins`, `Inter`, `Roboto` $\rightarrow$ `Helvetica`
   - `Merriweather` $\rightarrow$ `Times-Roman`
   - `JetBrains Mono` $\rightarrow$ `Courier`
5. When `fontWeight: 'bold'` is applied, `@react-pdf` automatically maps `Helvetica` to `Helvetica-Bold`, `Times-Roman` to `Times-Bold`, and `Courier` to `Courier-Bold`.
6. This delivers 100% vector selectable text, instant rendering (0ms network time), and guaranteed offline execution.

### 2.3 Unit & Coordinate System Conversion (px to pt)
1. CSS uses 96 DPI ($1\text{ in} = 96\text{ px}$).
2. PDF uses 72 DPI points ($1\text{ in} = 72\text{ pt}$).
3. Scale factor: $1\text{ px} = 72 / 96\text{ pt} = 0.75\text{ pt}$.
4. A4 dimensions: $595.28\text{ pt} \times 841.89\text{ pt}$.
5. Spacing conversions:
   - `pagePadding`: `(layout.pagePadding ?? 24) * 0.75` (default $18\text{ pt}$)
   - `sectionGap`: `Math.max(7.5, (layout.sectionGap ?? 20) * 0.75)` (default $15\text{ pt}$)
   - `itemGap`: `Math.max(3, (layout.itemGap ?? 8) * 0.75)` (default $6\text{ pt}$)
   - `lineHeight`: directly supported as a float multiplier (default `1.45`).
6. Font size points calibration (accounting for `fontScale`, `titleScale`, `bodyScale`, `listScale`):
   - `h1` (Name): `Math.round(18 * fontScale * titleScale * 10) / 10`
   - `h2` (Section Title): `Math.round(13.5 * fontScale * titleScale * 10) / 10`
   - `h3` (Item Title): `Math.round(11 * fontScale * titleScale * 10) / 10`
   - `subtitle`: `Math.round(10.5 * fontScale * titleScale * 10) / 10`
   - `body`: `Math.round(9.5 * fontScale * bodyScale * 10) / 10`
   - `small`: `Math.round(8.8 * fontScale * bodyScale * 10) / 10`
   - `smaller`: `Math.round(7.8 * fontScale * bodyScale * 10) / 10`
   - `list`: `Math.round(9 * fontScale * listScale * 10) / 10`

### 2.4 Multi-Page Pagination Architecture & Strict Zero-Split Super-Containers
1. In `@react-pdf/renderer`, `<Page size="A4" wrap={true}>` manages multi-page pagination.
2. Applying `wrap={false}` to a `<View>` guarantees that if the view does not fit in the remaining vertical space of the current page, the **entire block is pushed intact to the next page**.
3. Therefore:
   - Every individual item (`CVItemPdf`) is wrapped in `<View wrap={false} style={styles.itemBlock}>`. This guarantees that job experiences, bullet point groups, education blocks, and projects are **never fractured mid-sentence or mid-block**.
   - Single-item atomic sections (`about`, `profile_header`) have `wrap={false}` on their outer section container.

### 2.5 Elimination of Orphan Section Headers
1. An orphan header occurs when a section title renders at the bottom of Page 1, but its child items are pushed to Page 2.
2. To prevent this, we construct a super-container uniting the section title and the first item:
   ```jsx
   {items.length > 0 && (
     <View wrap={false} style={styles.sectionHeaderAndFirstItem}>
       {section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}
       <CVItemPdf item={items[0]} ... isLast={items.length === 1} />
     </View>
   )}
   {items.slice(1).map((item, idx) => (
     <View key={item.id || idx} wrap={false} style={styles.itemContainer}>
       <CVItemPdf item={item} ... isLast={idx === items.length - 2} />
     </View>
   ))}
   ```
3. If the section title and the first item do not fit on the current page together, the entire header+item block shifts to the next page. Orphan headers are mathematically impossible under this structure.

### 2.6 Crisp Vector SVG Icons
1. In `@react-pdf/renderer`, HTML `<i>` tags and webfont icons do not render.
2. Using `<Svg viewBox="0 0 24 24">` and `<Path d="..." />` primitives reproduces BoxIcons (MapPin, Envelope, Phone, LinkedIn, GitHub, ExternalLink, BadgeCheck, Trophy, BookOpen, Heart, UserCheck) cleanly in vector format.
3. No network calls or raster canvas operations are required.

### 2.7 Rich Text Formatting (Epic 2 Interface)
1. Epic 2 introduces inline `<b>`, `<strong>`, `<i>`, `<em>`, and text alignment.
2. `@react-pdf/renderer` supports nested `<Text>` elements where child `<Text>` elements inherit or override formatting:
   `<Text style={{ textAlign }}><Text style={{ fontWeight: 'bold' }}>Bold</Text> normal</Text>`.
3. A rich text tokenizer decomposes strings with inline HTML tags into nested `<Text>` nodes while applying proper font weights and styles.

---

## 3. Caveats

1. **`vite-plugin-node-polyfills` Bundler Requirement**:
   `@react-pdf/renderer` v4 depends on `pdfkit`, which requires Node built-in shims (`buffer`, `stream`, `util`, `zlib`, `process`). Before importing `@react-pdf/renderer` in the build tree, `vite-plugin-node-polyfills` must be configured in `vite.config.js`.
2. **Column Height Synchronization on Multi-Page Documents**:
   In 2-column mode across multiple pages, `flexDirection: 'row'` with `minHeight: '100%'` fills the height of each page. When one column has more content than the other on page 2, the shorter column remains filled with its specified background color because `alignItems: 'stretch'` keeps both column views equal in height.
3. **Line Height Multipliers in Yoga**:
   `lineHeight` in `@react-pdf/renderer` behaves as a proportional multiplier (e.g. `1.45`). However, unlike browser CSS, fractional font size times line-height in `@react-pdf` does not add half-leading to margins; explicit margins (`itemGap`, `sectionGap`) control layout separation cleanly.

---

## 4. Conclusion & Component Blueprint

The architecture for `src/components/PDF/CVDocument.jsx` and its companion modules is structured into 6 focused files:

```
src/components/PDF/
├── CVDocument.jsx         // Root Document & Page layout (2-col & 1-col switching)
├── CVSectionPdf.jsx       // Section container with orphan-prevention & super-container wrap={false}
├── CVItemPdf.jsx          // Universal item renderer for all 13 item types + custom
├── PdfIcons.jsx           // Pure vector SVG icons for contact, badges, timeline
├── pdfStyleFactory.js     // Dynamic color YIQ calculation, font mapping, point conversions
└── richTextPdf.jsx        // Tokenizer for rich inline bold, italic, and alignment
```

Here are the complete, production-grade component blueprints for each file.

---

### 4.1 `src/components/PDF/pdfStyleFactory.js`

```javascript
import { StyleSheet } from '@react-pdf/renderer';

/**
 * Computes YIQ contrast colors for background hex
 */
export const getDynamicTextColors = (hexcolor) => {
  let calcHex = hexcolor || '#ffffff';
  let hex = calcHex.replace("#", "");
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  const r = parseInt(hex.substr(0, 2), 16) || 0;
  const g = parseInt(hex.substr(2, 2), 16) || 0;
  const b = parseInt(hex.substr(4, 2), 16) || 0;
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  const adjustColor = (color, amount) => {
    return '#' + color.replace(/^#/, '').replace(/../g, c => ('0'+Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).substr(-2));
  };
  const circleColor = adjustColor(calcHex, yiq >= 128 ? -40 : 40);

  if (yiq < 128) {
    return {
      titleColor: '#fcfcfc',
      textColor: '#f0efef',
      textColorLight: '#cccccc',
      containerColorAlt: 'rgba(255, 255, 255, 0.1)',
      circleColor
    };
  } else {
    return {
      titleColor: '#0f172a',
      textColor: '#334155',
      textColorLight: '#64748b',
      containerColorAlt: 'rgba(0, 0, 0, 0.05)',
      circleColor
    };
  }
};

/**
 * Maps app font families to standard built-in PDF Type 1 fonts
 * (Zero network requests, completely offline, 100% selectable vector text)
 */
export const mapFontFamilyToPdf = (fontFamily) => {
  switch (fontFamily) {
    case 'Merriweather':
      return 'Times-Roman';
    case 'JetBrains Mono':
      return 'Courier';
    case 'Poppins':
    case 'Inter':
    case 'Roboto':
    default:
      return 'Helvetica';
  }
};

/**
 * Computes typography sizes in PDF points (pt)
 */
export const computePdfFontSizes = (layout = {}) => {
  const fontScale = layout.fontScale ?? 1.0;
  const titleScale = layout.titleScale ?? 1.0;
  const bodyScale = layout.bodyScale ?? 1.0;
  const listScale = layout.listScale ?? 1.0;

  return {
    h1: Math.round(18 * fontScale * titleScale * 10) / 10,
    h2: Math.round(13.5 * fontScale * titleScale * 10) / 10,
    h3: Math.round(11 * fontScale * titleScale * 10) / 10,
    subtitle: Math.round(10.5 * fontScale * titleScale * 10) / 10,
    body: Math.round(9.5 * fontScale * bodyScale * 10) / 10,
    small: Math.round(8.8 * fontScale * bodyScale * 10) / 10,
    smaller: Math.round(7.8 * fontScale * bodyScale * 10) / 10,
    list: Math.round(9 * fontScale * listScale * 10) / 10,
  };
};

/**
 * Computes spacing tokens in PDF points (1 px = 0.75 pt)
 */
export const computePdfSpacing = (layout = {}) => {
  const pagePaddingPx = layout.pagePadding ?? 24;
  const sectionGapPx = layout.sectionGap ?? 20;
  const itemGapPx = layout.itemGap ?? 8;
  const lineHeight = layout.lineHeight ?? 1.45;

  return {
    pagePadding: Math.round(pagePaddingPx * 0.75 * 10) / 10,
    sectionGap: Math.max(7.5, Math.round(sectionGapPx * 0.75 * 10) / 10),
    itemGap: Math.max(3, Math.round(itemGapPx * 0.75 * 10) / 10),
    lineHeight
  };
};

/**
 * Factory creating dynamic StyleSheet based on active layout state
 */
export const createCvStyles = (layout = {}) => {
  const spacing = computePdfSpacing(layout);
  const fontSizes = computePdfFontSizes(layout);
  const fontFamily = mapFontFamilyToPdf(layout.fontFamily);

  return StyleSheet.create({
    page: {
      backgroundColor: '#ffffff',
      fontFamily,
      fontSize: fontSizes.body,
      lineHeight: spacing.lineHeight,
      color: '#334155',
    },
    twoColumnRow: {
      flexDirection: 'row',
      width: '100%',
      minHeight: '100%',
      alignItems: 'stretch',
    },
    leftColumn: {
      paddingTop: spacing.pagePadding,
      paddingBottom: spacing.pagePadding,
      paddingLeft: spacing.pagePadding,
      paddingRight: spacing.pagePadding,
      minHeight: '100%',
    },
    rightColumn: {
      paddingTop: spacing.pagePadding,
      paddingBottom: spacing.pagePadding,
      paddingLeft: spacing.pagePadding,
      paddingRight: spacing.pagePadding,
      minHeight: '100%',
    },
    singleColumnContainer: {
      paddingTop: spacing.pagePadding,
      paddingBottom: spacing.pagePadding,
      paddingLeft: spacing.pagePadding,
      paddingRight: spacing.pagePadding,
      width: '100%',
    },
    section: {
      marginBottom: spacing.sectionGap,
    },
    sectionTitle: {
      fontSize: fontSizes.h2,
      fontFamily,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 2,
      marginBottom: Math.max(4, spacing.itemGap * 0.8),
    },
    itemBlock: {
      marginBottom: spacing.itemGap,
    }
  });
};
```

---

### 4.2 `src/components/PDF/PdfIcons.jsx`

```jsx
import React from 'react';
import { Svg, Path } from '@react-pdf/renderer';

const ICON_PATHS = {
  map: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z",
  envelope: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
  phone: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
  linkedin: "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.68 1.68 0 0 0-1.68 1.68 1.68 1.68 0 0 0 1.68 1.68 1.68 1.68 0 0 0 1.68-1.68 1.68 1.68 0 0 0-1.68-1.68z",
  github: "M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z",
  badgeCheck: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
  trophy: "M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V18H9v2h6v-2h-2v-2.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z",
  externalLink: "M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z",
  bookOpen: "M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z",
  userCheck: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z",
  heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
};

export const PdfIcon = ({ name, color = '#64748b', size = 8 }) => {
  const path = ICON_PATHS[name] || ICON_PATHS.map;
  return (
    <Svg viewBox="0 0 24 24" style={{ width: size, height: size }}>
      <Path d={path} fill={color} />
    </Svg>
  );
};
```

---

### 4.3 `src/components/PDF/richTextPdf.jsx`

```jsx
import React from 'react';
import { Text } from '@react-pdf/renderer';

/**
 * Tokenizes rich text strings containing <b>, <strong>, <i>, <em>
 * and produces properly styled nested <Text> components.
 */
export const RichTextPdf = ({ text, style = {}, align }) => {
  if (text === null || text === undefined) return null;
  const str = String(text);

  if (!/<[a-z][\s\S]*>/i.test(str)) {
    return (
      <Text style={[style, align ? { textAlign: align } : {}]}>
        {str}
      </Text>
    );
  }

  const tokens = str.split(/(<\/?(?:b|strong|i|em)>)/gi);
  let isBold = false;
  let isItalic = false;

  const children = tokens.map((token, index) => {
    const lower = token.toLowerCase();
    if (lower === '<b>' || lower === '<strong>') {
      isBold = true;
      return null;
    }
    if (lower === '</b>' || lower === '</strong>') {
      isBold = false;
      return null;
    }
    if (lower === '<i>' || lower === '<em>') {
      isItalic = true;
      return null;
    }
    if (lower === '</i>' || lower === '</em>') {
      isItalic = false;
      return null;
    }
    if (!token) return null;

    const spanStyle = {};
    if (isBold) spanStyle.fontWeight = 'bold';
    if (isItalic) spanStyle.fontStyle = 'italic';

    return (
      <Text key={index} style={spanStyle}>
        {token}
      </Text>
    );
  }).filter(Boolean);

  return (
    <Text style={[style, align ? { textAlign: align } : {}]}>
      {children}
    </Text>
  );
};
```

---

### 4.4 `src/components/PDF/CVItemPdf.jsx`

```jsx
import React from 'react';
import { View, Text, Link } from '@react-pdf/renderer';
import { PdfIcon } from './PdfIcons';
import { RichTextPdf } from './richTextPdf';

export const CVItemPdf = ({ item, sectionType, colors, fontSizes, spacing, isLast = false }) => {
  if (!item) return null;

  // 1. Profile Header
  if (sectionType === 'profile_header') {
    return (
      <View style={{ marginBottom: spacing.sectionGap }}>
        <Text style={{ fontSize: fontSizes.h1, fontWeight: 'bold', color: colors.titleColor, marginBottom: 2 }}>
          {item.name || ''}
        </Text>
        {item.subtitle ? (
          <Text style={{ fontSize: fontSizes.subtitle, color: colors.textColorLight, marginBottom: 6 }}>
            {item.subtitle}
          </Text>
        ) : null}
        
        {/* Contact Links */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
          {item.location ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, marginBottom: 4 }}>
              <PdfIcon name="map" color={colors.textColorLight} size={fontSizes.smaller} />
              <Text style={{ fontSize: fontSizes.smaller, color: colors.textColor, marginLeft: 3 }}>
                {item.location}
              </Text>
            </View>
          ) : null}
          {item.email ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, marginBottom: 4 }}>
              <PdfIcon name="envelope" color={colors.textColorLight} size={fontSizes.smaller} />
              <Text style={{ fontSize: fontSizes.smaller, color: colors.textColor, marginLeft: 3 }}>
                {item.email}
              </Text>
            </View>
          ) : null}
          {item.phone ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, marginBottom: 4 }}>
              <PdfIcon name="phone" color={colors.textColorLight} size={fontSizes.smaller} />
              <Text style={{ fontSize: fontSizes.smaller, color: colors.textColor, marginLeft: 3 }}>
                {item.phone}
              </Text>
            </View>
          ) : null}
          {item.linkedin ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, marginBottom: 4 }}>
              <PdfIcon name="linkedin" color={colors.textColorLight} size={fontSizes.smaller} />
              <Text style={{ fontSize: fontSizes.smaller, color: colors.textColor, marginLeft: 3 }}>
                {item.linkedin}
              </Text>
            </View>
          ) : null}
          {item.github ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, marginBottom: 4 }}>
              <PdfIcon name="github" color={colors.textColorLight} size={fontSizes.smaller} />
              <Text style={{ fontSize: fontSizes.smaller, color: colors.textColor, marginLeft: 3 }}>
                {item.github}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  // 2. About / Profile Summary
  if (sectionType === 'about') {
    return (
      <View style={{ marginBottom: spacing.itemGap }}>
        <RichTextPdf
          text={item.description}
          style={{ fontSize: fontSizes.body, color: colors.textColor, lineHeight: spacing.lineHeight }}
        />
      </View>
    );
  }

  // 3. Technical Skills
  if (sectionType === 'skills') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.itemGap * 0.7 }}>
        <View style={{
          width: 4.5,
          height: 4.5,
          borderRadius: 2.25,
          backgroundColor: colors.circleColor,
          marginTop: 4,
          marginRight: 6,
          flexShrink: 0
        }} />
        <Text style={{ flex: 1, fontSize: fontSizes.list, color: colors.textColor, lineHeight: spacing.lineHeight }}>
          <Text style={{ fontWeight: 'bold', color: colors.titleColor }}>{item.title}: </Text>
          <Text>{item.description}</Text>
        </Text>
      </View>
    );
  }

  // 4. Education
  if (sectionType === 'education') {
    return (
      <View style={{ flexDirection: 'row', marginBottom: spacing.itemGap }}>
        {/* Timeline Indicator */}
        <View style={{ width: 14, alignItems: 'center', marginRight: 6, position: 'relative' }}>
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.circleColor,
            marginTop: 2
          }} />
          {!isLast && (
            <View style={{
              width: 1.5,
              flex: 1,
              backgroundColor: colors.textColorLight,
              opacity: 0.35,
              marginTop: 2
            }} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ fontSize: fontSizes.h3, fontWeight: 'bold', color: colors.titleColor, flex: 1 }}>
              {item.title || ''}
            </Text>
            {item.date && (
              <Text style={{ fontSize: fontSizes.smaller, color: colors.textColorLight, marginLeft: 6 }}>
                {item.date}
              </Text>
            )}
          </View>
          {item.subtitle && (
            <Text style={{ fontSize: fontSizes.small, color: colors.textColor, marginTop: 1 }}>
              {item.subtitle}
            </Text>
          )}
        </View>
      </View>
    );
  }

  // 5. Simple List / Certifications / Languages basic
  if (sectionType === 'simple_list') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.itemGap * 0.7 }}>
        <View style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.circleColor,
          marginTop: 4,
          marginRight: 6,
          flexShrink: 0
        }} />
        <RichTextPdf
          text={item.text}
          style={{ flex: 1, fontSize: fontSizes.list, color: colors.textColor, lineHeight: spacing.lineHeight }}
        />
      </View>
    );
  }

  // 6. Languages with badge pill
  if (sectionType === 'languages') {
    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.itemGap * 0.8
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={{
            width: 4.5,
            height: 4.5,
            borderRadius: 2.25,
            backgroundColor: colors.circleColor,
            marginRight: 6
          }} />
          <View>
            <Text style={{ fontSize: fontSizes.body, fontWeight: 'bold', color: colors.titleColor }}>
              {item.title || item.language || ''}
            </Text>
            {item.description && (
              <Text style={{ fontSize: fontSizes.smaller, color: colors.textColorLight, marginTop: 1 }}>
                {item.description}
              </Text>
            )}
          </View>
        </View>
        <View style={{
          paddingVertical: 2,
          paddingHorizontal: 6,
          borderRadius: 8,
          backgroundColor: colors.containerColorAlt,
          borderWidth: 0.5,
          borderColor: 'rgba(0,0,0,0.08)'
        }}>
          <Text style={{ fontSize: fontSizes.smaller, fontWeight: 'bold', color: colors.titleColor }}>
            {item.subtitle || item.level || 'Intermedio'}
          </Text>
        </View>
      </View>
    );
  }

  // 7. Certificates with Badge Icon
  if (sectionType === 'certificates') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.itemGap }}>
        <View style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: colors.containerColorAlt,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 6,
          marginTop: 1
        }}>
          <PdfIcon name="badgeCheck" color={colors.titleColor} size={10} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ fontSize: fontSizes.h3, fontWeight: 'bold', color: colors.titleColor, flex: 1 }}>
              {item.title || ''}
            </Text>
            {item.date && (
              <Text style={{ fontSize: fontSizes.smaller, color: colors.textColorLight, marginLeft: 6 }}>
                {item.date}
              </Text>
            )}
          </View>
          <Text style={{ fontSize: fontSizes.small, color: colors.textColor, marginTop: 1 }}>
            {item.subtitle || ''}
            {item.credentialId ? ` · ID: ${item.credentialId}` : ''}
          </Text>
          {item.link && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <PdfIcon name="externalLink" color={colors.textColorLight} size={fontSizes.smaller} />
              <Link src={item.link.startsWith('http') ? item.link : `https://${item.link}`} style={{ marginLeft: 3 }}>
                <Text style={{ fontSize: fontSizes.smaller, color: '#2563eb' }}>
                  {item.linkText || item.link}
                </Text>
              </Link>
            </View>
          )}
        </View>
      </View>
    );
  }

  // 8. Awards with Trophy Icon
  if (sectionType === 'awards') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.itemGap }}>
        <View style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: colors.containerColorAlt,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 6,
          marginTop: 1
        }}>
          <PdfIcon name="trophy" color={colors.titleColor} size={10} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ fontSize: fontSizes.h3, fontWeight: 'bold', color: colors.titleColor, flex: 1 }}>
              {item.title || ''}
            </Text>
            {item.date && (
              <Text style={{ fontSize: fontSizes.smaller, color: colors.textColorLight, marginLeft: 6 }}>
                {item.date}
              </Text>
            )}
          </View>
          {item.subtitle && (
            <Text style={{ fontSize: fontSizes.small, color: colors.textColor, marginTop: 1 }}>
              {item.subtitle}
            </Text>
          )}
          {item.description && (
            <RichTextPdf
              text={item.description}
              style={{ fontSize: fontSizes.body, color: colors.textColor, marginTop: 2, lineHeight: spacing.lineHeight }}
            />
          )}
        </View>
      </View>
    );
  }

  // 9. Publications with BookOpen Icon
  if (sectionType === 'publications') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.itemGap }}>
        <View style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: colors.containerColorAlt,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 6,
          marginTop: 1
        }}>
          <PdfIcon name="bookOpen" color={colors.titleColor} size={10} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ fontSize: fontSizes.h3, fontWeight: 'bold', color: colors.titleColor, flex: 1 }}>
              {item.title || ''}
            </Text>
            {item.date && (
              <Text style={{ fontSize: fontSizes.smaller, color: colors.textColorLight, marginLeft: 6 }}>
                {item.date}
              </Text>
            )}
          </View>
          {item.subtitle && (
            <Text style={{ fontSize: fontSizes.small, color: colors.textColor, marginTop: 1 }}>
              {item.subtitle}
            </Text>
          )}
          {item.link && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <PdfIcon name="externalLink" color={colors.textColorLight} size={fontSizes.smaller} />
              <Link src={item.link.startsWith('http') ? item.link : `https://${item.link}`} style={{ marginLeft: 3 }}>
                <Text style={{ fontSize: fontSizes.smaller, color: '#2563eb' }}>
                  {item.linkText || item.link}
                </Text>
              </Link>
            </View>
          )}
          {item.description && (
            <RichTextPdf
              text={item.description}
              style={{ fontSize: fontSizes.body, color: colors.textColor, marginTop: 2, lineHeight: spacing.lineHeight }}
            />
          )}
        </View>
      </View>
    );
  }

  // 10. References with UserCheck Icon
  if (sectionType === 'references') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.itemGap }}>
        <View style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: colors.containerColorAlt,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 6,
          marginTop: 1
        }}>
          <PdfIcon name="userCheck" color={colors.titleColor} size={10} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: fontSizes.h3, fontWeight: 'bold', color: colors.titleColor }}>
            {item.title || item.name || ''}
          </Text>
          {item.subtitle && (
            <Text style={{ fontSize: fontSizes.small, color: colors.textColor, marginTop: 1 }}>
              {item.subtitle}
            </Text>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 3 }}>
            {item.email && (
              <Text style={{ fontSize: fontSizes.smaller, color: colors.textColorLight }}>
                {item.email}
              </Text>
            )}
            {item.phone && (
              <Text style={{ fontSize: fontSizes.smaller, color: colors.textColorLight }}>
                {item.phone}
              </Text>
            )}
            {item.relationship && (
              <Text style={{ fontSize: fontSizes.smaller, fontStyle: 'italic', color: colors.textColorLight }}>
                ({item.relationship})
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  // 11. Default Timeline: 'list' (Experience), 'projects', 'volunteering', or custom
  const bullets = item.bullets || [];

  return (
    <View style={{ flexDirection: 'row', marginBottom: spacing.itemGap }}>
      {/* Timeline Indicator */}
      <View style={{ width: 14, alignItems: 'center', marginRight: 6, position: 'relative' }}>
        <View style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.circleColor,
          marginTop: 2
        }} />
        {!isLast && (
          <View style={{
            width: 1.5,
            flex: 1,
            backgroundColor: colors.textColorLight,
            opacity: 0.35,
            marginTop: 2
          }} />
        )}
      </View>

      {/* Content Body */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontSize: fontSizes.h3, fontWeight: 'bold', color: colors.titleColor, flex: 1 }}>
            {item.title || ''}
          </Text>
          {item.date && (
            <Text style={{ fontSize: fontSizes.smaller, color: colors.textColorLight, marginLeft: 6 }}>
              {item.date}
            </Text>
          )}
        </View>

        {item.subtitle && (
          <Text style={{ fontSize: fontSizes.small, fontWeight: 'bold', color: colors.textColor, marginTop: 1 }}>
            {item.subtitle}
          </Text>
        )}

        {item.link && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 2 }}>
            <PdfIcon name="externalLink" color={colors.textColorLight} size={fontSizes.smaller} />
            <Link src={item.link.startsWith('http') ? item.link : `https://${item.link}`} style={{ marginLeft: 3 }}>
              <Text style={{ fontSize: fontSizes.smaller, color: '#2563eb' }}>
                {item.linkText || item.link}
              </Text>
            </Link>
          </View>
        )}

        {item.description && (
          <RichTextPdf
            text={item.description}
            style={{ fontSize: fontSizes.body, color: colors.textColor, marginTop: 2, lineHeight: spacing.lineHeight }}
          />
        )}

        {bullets.length > 0 && (
          <View style={{ marginTop: 3 }}>
            {bullets.map((bullet, idx) => {
              const textStr = typeof bullet === 'string' ? bullet : (bullet?.text || '');
              return (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                  <View style={{
                    width: 3.5,
                    height: 3.5,
                    borderRadius: 1.75,
                    backgroundColor: colors.circleColor,
                    marginTop: 4,
                    marginRight: 5,
                    flexShrink: 0
                  }} />
                  <RichTextPdf
                    text={textStr}
                    style={{ flex: 1, fontSize: fontSizes.list, color: colors.textColor, lineHeight: spacing.lineHeight }}
                  />
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};
```

---

### 4.5 `src/components/PDF/CVSectionPdf.jsx`

```jsx
import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { CVItemPdf } from './CVItemPdf';

export const CVSectionPdf = ({ section, colors, fontSizes, spacing, styles }) => {
  if (!section) return null;

  const isProfile = section.type === 'profile_header';
  const isAbout = section.type === 'about';
  const items = section.items || [];

  // If section is a single-block type like about or profile_header, keep entire section atomic
  if (isProfile || isAbout) {
    return (
      <View wrap={false} style={styles.section}>
        {!isProfile && section.title && (
          <Text style={[styles.sectionTitle, { color: colors.titleColor }]}>
            {section.title}
          </Text>
        )}
        {items.map((item, idx) => (
          <CVItemPdf
            key={item.id || idx}
            item={item}
            sectionType={section.type}
            colors={colors}
            fontSizes={fontSizes}
            spacing={spacing}
            isLast={true}
          />
        ))}
      </View>
    );
  }

  // Super-container: Section Title + First Item are bound in wrap={false}
  // This guarantees that section headers are never orphaned at the bottom of a page
  const firstItem = items[0];
  const remainingItems = items.slice(1);

  return (
    <View style={styles.section}>
      {firstItem && (
        <View wrap={false}>
          {section.title && (
            <Text style={[styles.sectionTitle, { color: colors.titleColor }]}>
              {section.title}
            </Text>
          )}
          <CVItemPdf
            item={firstItem}
            sectionType={section.type}
            colors={colors}
            fontSizes={fontSizes}
            spacing={spacing}
            isLast={items.length === 1}
          />
        </View>
      )}

      {/* Subsequent items paginate cleanly item-by-item */}
      {remainingItems.map((item, idx) => (
        <View key={item.id || idx} wrap={false}>
          <CVItemPdf
            item={item}
            sectionType={section.type}
            colors={colors}
            fontSizes={fontSizes}
            spacing={spacing}
            isLast={idx === remainingItems.length - 1}
          />
        </View>
      ))}
    </View>
  );
};
```

---

### 4.6 `src/components/PDF/CVDocument.jsx`

```jsx
import React from 'react';
import { Document, Page, View } from '@react-pdf/renderer';
import { createCvStyles, getDynamicTextColors, computePdfFontSizes, computePdfSpacing } from './pdfStyleFactory';
import { CVSectionPdf } from './CVSectionPdf';

/**
 * CVDocument — Complete React-PDF Document Mirror of #area-cv
 *
 * Capabilities:
 * 1. 2-column & 1-column ATS layout support matching on-screen state
 * 2. 100% vector selectable text via built-in Type 1 fonts (0 network latency)
 * 3. Dynamic YIQ contrast intelligence for user-selected column colors
 * 4. Super-container pagination preventing broken items and orphan titles
 * 5. Full support for all 13 CV section/item types
 */
const CVDocument = ({ cvData, lang = 'es' }) => {
  const data = cvData || {};
  const layout = data.layout || {};
  const is2Col = layout.type !== '1-column';

  // 1. Data Normalization: merge cvData.profile into profile_header
  const rawSections = Array.isArray(data.sections) ? data.sections : [];
  const sections = data.profile
    ? rawSections.map(sec => {
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
          return { ...sec, items: [mergedItem, ...(sec.items ? sec.items.slice(1) : [])] };
        }
        return sec;
      })
    : rawSections;

  // 2. Layout Geometry & Colors
  const leftColWidthPercent = Number(layout.leftColumnWidth) || 33.33;
  const leftBg = layout.leftBg || '#fafafa';
  const rightBg = layout.rightBg || '#ffffff';

  const leftColors = getDynamicTextColors(leftBg);
  const rightColors = getDynamicTextColors(rightBg);

  const fontSizes = computePdfFontSizes(layout);
  const spacing = computePdfSpacing(layout);
  const styles = createCvStyles(layout);

  // 3. Section Column Filtering
  const leftSections = sections.filter(s => s.column === 'left');
  const rightSections = sections.filter(s => s.column === 'right');

  return (
    <Document
      title={data.profile?.name ? `CV - ${data.profile.name}` : 'Curriculum Vitae'}
      author={data.profile?.name || 'Ressume'}
      subject="Curriculum Vitae"
      creator="Ressume CV Editor"
    >
      <Page size="A4" style={styles.page}>
        {is2Col ? (
          /* ======================================================
             2-COLUMN LAYOUT (Visual Recruiter)
             ====================================================== */
          <View style={styles.twoColumnRow}>
            {/* Left Column */}
            <View
              style={[
                styles.leftColumn,
                {
                  width: `${leftColWidthPercent}%`,
                  backgroundColor: leftBg,
                }
              ]}
            >
              {leftSections.map(section => (
                <CVSectionPdf
                  key={section.id}
                  section={section}
                  colors={leftColors}
                  fontSizes={fontSizes}
                  spacing={spacing}
                  styles={styles}
                />
              ))}
            </View>

            {/* Right Column */}
            <View
              style={[
                styles.rightColumn,
                {
                  width: `${100 - leftColWidthPercent}%`,
                  backgroundColor: rightBg,
                }
              ]}
            >
              {rightSections.map(section => (
                <CVSectionPdf
                  key={section.id}
                  section={section}
                  colors={rightColors}
                  fontSizes={fontSizes}
                  spacing={spacing}
                  styles={styles}
                />
              ))}
            </View>
          </View>
        ) : (
          /* ======================================================
             1-COLUMN ATS OPTIMIZED LAYOUT
             ====================================================== */
          <View style={styles.singleColumnContainer}>
            {sections.map(section => (
              <CVSectionPdf
                key={section.id}
                section={section}
                colors={rightColors}
                fontSizes={fontSizes}
                spacing={spacing}
                styles={styles}
              />
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default CVDocument;
```

---

## 5. Verification Method

### 5.1 Static Code & Unit Verification
1. **Font Mapping**: Verify that calling `mapFontFamilyToPdf('Poppins')` returns `'Helvetica'`, `'Merriweather'` returns `'Times-Roman'`, and `'JetBrains Mono'` returns `'Courier'`.
2. **YIQ Formula Check**:
   - Passing `'#1e293b'` (slate-800, dark) returns `titleColor: '#fcfcfc'`, `textColor: '#f0efef'`.
   - Passing `'#ffffff'` (white, light) returns `titleColor: '#0f172a'`, `textColor: '#334155'`.
3. **Item Types Coverage Test**:
   - Construct a test `cvData` featuring all 13 section types (`profile_header`, `about`, `list`, `projects`, `education`, `skills`, `certificates`, `languages`, `awards`, `publications`, `volunteering`, `references`, `simple_list`).
   - Render to React-PDF blob:
     ```javascript
     const blob = await pdf(<CVDocument cvData={mockAllSectionsData} />).toBlob();
     expect(blob.size).toBeGreaterThan(1000);
     ```

### 5.2 Zero-Network Verification
1. Disconnect network or mock `fetch` / `XMLHttpRequest`.
2. Execute `renderPdfBlob(cvData)`: it must resolve in $< 350\text{ ms}$ without throwing network errors.

### 5.3 Multi-Page Super-Container & Pagination Verification
1. Generate a CV with 6 extensive `experience` entries containing 4 bullet points each.
2. Verify:
   - Total pages $> 1$.
   - No `CVItemPdf` has text split across page boundaries.
   - Every section header stays joined to at least its first item.
3. Switch `layout.type` between `'2-column'` and `'1-column'`. Both modes must render valid PDF blobs matching on-screen structure.
