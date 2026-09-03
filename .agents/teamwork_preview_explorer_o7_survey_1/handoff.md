# Investigation & Architectural Blueprint: Epic 1 (Client-Side PDF Generation via @react-pdf/renderer)

**Explorer**: Explorer 1  
**Target Milestone**: Epic 1: Client-Side PDF Generation via `@react-pdf/renderer`  
**Workspace Root**: `/home/juani/Documentos/Ressume`  
**Date**: 2026-09-03  

---

## 1. Observation

### 1.1 Package Status & Bundler Environment
- **`package.json` Inspection**:
  In `/home/juani/Documentos/Ressume/package.json` (lines 13-29):
  ```json
  "dependencies": {
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "lucide-react": "^1.39.0",
    "netlify-cli": "^27.4.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/react": "^14.2.1",
    "@vitejs/plugin-react": "^4.2.1",
    "jsdom": "^24.0.0",
    "vite": "^5.0.8",
    "vitest": "^1.3.1"
  }
  ```
  `@react-pdf/renderer` is **not installed** in `package.json` or `node_modules`.
- **NPM Registry & Dependencies**:
  Executing `npm view @react-pdf/renderer version` returns version `4.9.0`.
  Executing `npm view @react-pdf/renderer dependencies` reveals that it depends on `pdfkit` (`0.20.1`), `@react-pdf/layout`, `@react-pdf/render`, `@react-pdf/primitives`, and `events`.
  `pdfkit` depends on Node.js core modules: `stream`, `buffer`, `zlib`, `process`, `util`, and `events`.
- **Vite 5 Bundler Requirements**:
  In Vite 5 (`vite.config.js`), Node built-ins are externalized/omitted in browser environments. Attempting to bundle `@react-pdf/renderer` without polyfills causes runtime/build failures (`Buffer is not defined`, `Module "stream" has been externalized for browser compatibility`).
  The standard resolution for Vite 5 is installing `vite-plugin-node-polyfills` as a dev dependency and adding `nodePolyfills({ include: ['buffer', 'stream', 'util', 'zlib', 'process'], globals: { Buffer: true, global: true, process: true } })` to `vite.config.js`.

### 1.2 Current Print Engine (`src/utils/staticHtmlPdfEngine.js`)
- **Engine Architecture**:
  - `generateCleanPrintHTML(cvData, lang)`: Serializes current `cvData` into a standalone HTML5 string. Embeds Google Fonts, BoxIcons, dynamic colors calculated via YIQ contrast formula (`getDynamicTextColors`), and CSS print media rules (`break-inside: avoid !important; page-break-inside: avoid !important;`).
  - `calculatePrintScale(renderedHeight)`: Dynamically shrinks the document scale factor (floor of 0.75) if total rendered height exceeds 2 A4 pages (`2246px` at 96 DPI).
  - `executeCleanPrint(cvData, lang)`: Injects a hidden `<iframe>` (`width: 794px`, `height: 1123px`), writes the HTML, waits for `document.fonts.ready` (with a 1000ms timeout race), applies zoom if scale < 1.0, calls `iframe.contentWindow.print()`, and cleans up the iframe from the DOM.
  - `downloadPDF(cvData, lang)`: Tries to call Netlify function `/.netlify/functions/generate-pdf`. When unavailable in offline/local client mode, seamlessly falls back to `executeCleanPrint(cvData, lang)`.
- **Existing Runtime Bug in `staticHtmlPdfEngine.js`**:
  Running `npm test` produces unhandled rejections across 7 test suites (68 failed tests) with error:
  ```
  ReferenceError: isLast is not defined
   ❯ renderItemHTML src/utils/staticHtmlPdfEngine.js:122:14
      120|         <div class="education__time" style="padding-right: 0.75rem;">
      121|           <span class="education__rounder"></span>
      122|           ${!isLast ? '<span class="education__line"></span>' : ''}
   ❯ renderItemHTML src/utils/staticHtmlPdfEngine.js:241:14
      240|         <span class="experience__rounder" style="background-color: ${rounderColor};"></span>
      241|         ${!isLast ? '<span class="experience__line"></span>' : ''}
  ```
  At line 79: `const renderItemHTML = (item, sectionType) => {`.
  At lines 289 and 293: `renderItemHTML(item, sectionType, index === items.length - 1)`.
  The parameter list in line 79 omits `isLast` (it should be `const renderItemHTML = (item, sectionType, isLast = false) => {`).

### 1.3 State & Layout Variables (`src/context/CVContext.jsx`, `src/utils/schema.js`, `src/App.jsx`)
- **`cvData.layout` structure**:
  ```javascript
  layout: {
    type: '2-column',           // '1-column' | '2-column'
    leftBg: '',                 // hex color or empty (defaults to #fafafa / #F8FAFC)
    rightBg: '',                // hex color or empty (defaults to #ffffff)
    leftColumnWidth: null,      // number percentage (e.g. 33, 40) or null (defaults to 33.33%)
    fontFamily: 'Poppins',      // 'Poppins' | 'Inter' | 'Roboto' | 'Merriweather' | 'JetBrains Mono'
    fontScale: 1.0,             // 0.85 to 1.25
    titleScale: 1.0,            // 0.80 to 1.40
    bodyScale: 1.0,             // 0.80 to 1.30
    listScale: 1.0,             // 0.80 to 1.30
    lineHeight: 1.45,           // 1.25 to 1.85
    pagePadding: 24,            // px (default 24)
    sectionGap: 20,             // px (default 20)
    itemGap: 8                  // px (default 8)
  }
  ```
- **CSS Custom Properties on `#area-cv`**:
  - Spacing & layout: `--page-padding`, `--section-gap`, `--item-gap`, `--line-height`
  - Colors: `--title-color`, `--text-color`, `--text-color-light`, `--container-color`, `--container-color-alt`, `--circle-color`
  - Dynamic font sizes:
    - `--h1-font-size: calc(1.5rem * var(--font-scale, 1))`
    - `--h2-font-size: calc(1.25rem * var(--font-scale, 1))`
    - `--h3-font-size: calc(1rem * var(--font-scale, 1))`
    - `--normal-font-size: calc(0.938rem * var(--font-scale, 1))`
    - `--small-font-size: calc(0.875rem * var(--font-scale, 1))`
    - `--smaller-font-size: calc(0.813rem * var(--font-scale, 1))`
    - Categorical: `--title-h1-size`, `--title-h2-size`, `--title-h3-size`, `--title-subtitle-size`, `--body-font-size`, `--body-small-font-size`, `--list-font-size`.
- **UI Notifications**:
  - `CVContext.jsx` provides `showToast(text, type = 'info')` and `toast` state.
  - `ToastNotification.jsx` renders a fixed bottom-right toast with green `CheckCircle2` for `'success'` and amber `Lightbulb` for `'warning'`.

---

## 2. Logic Chain

### 2.1 Bundler Compatibility & Zero Network Request Strategy
1. Because `@react-pdf/renderer` v4 relies on `pdfkit` which uses Node streams and buffers, Vite 5 requires `vite-plugin-node-polyfills` to shim these globals in the browser.
2. The user requirements state:
   - "Be entirely client-side — no server calls"
   - "No network requests are made during PDF generation"
   - "Contain selectable vector text (no canvas rasterization)"
3. In `@react-pdf/renderer`, invoking `Font.register` with external URLs (e.g. `fonts.gstatic.com`) triggers HTTP network requests at generation time. If network is unavailable or blocked, font loading fails or hangs.
4. However, `@react-pdf/renderer` has standard built-in 14 PDF Type 1 fonts (`Helvetica`, `Helvetica-Bold`, `Helvetica-Oblique`, `Times-Roman`, `Times-Bold`, `Courier`, `Courier-Bold`) that require **zero external HTTP requests** and produce 100% selectable vector text.
5. Therefore, mapping the app's curated fonts to standard PDF equivalents (or registering bundled local font binaries) guarantees that PDF generation executes instantaneously, completely offline, without making a single HTTP request:
   - `Poppins`, `Inter`, `Roboto` $\rightarrow$ `Helvetica` / `Helvetica-Bold`
   - `Merriweather` $\rightarrow$ `Times-Roman` / `Times-Bold`
   - `JetBrains Mono` $\rightarrow$ `Courier` / `Courier-Bold`

### 2.2 Supplementing `staticHtmlPdfEngine.js`
1. Requirement R1 specifies: "NOT replace the existing `staticHtmlPdfEngine.js` — supplement it as a new export option."
2. `staticHtmlPdfEngine.js` provides `executeCleanPrint` (browser print dialog via hidden iframe).
3. The new `@react-pdf/renderer` engine should live in a dedicated module:
   - `src/utils/reactPdfEngine.js`: Contains `generateAndDownloadPdf(cvData, lang)` and `renderPdfBlob(cvData, lang)` using `@react-pdf/renderer`'s `pdf(document).toBlob()`.
   - `src/components/PDF/CVDocument.jsx`: Declarative React PDF template mirror.
4. In `ActionMenu.jsx`:
   - Keep the existing native print button (`executeCleanPrint`).
   - Add/group the vector PDF download button (`generateAndDownloadPdf`).
   - Fix the missing `isLast = false` parameter at line 79 of `staticHtmlPdfEngine.js` to restore all existing tests to passing state.

### 2.3 Resolving CSS Variables to PDF Primitives
1. `@react-pdf/renderer` does not support CSS variables (`var(--...)`) or CSS units like `rem`.
2. All values must be computed as concrete numbers (points, `pt`) or hex strings:
   - 1 pt = 1/72 inch; 1 px = 1/96 inch $\rightarrow$ $1\text{ px} = 0.75\text{ pt}$.
   - A4 page dimensions in points: $595.28\text{ pt} \times 841.89\text{ pt}$.
   - Base font sizes in points:
     - `h1`: `Math.round(22 * fontScale * titleScale)`
     - `h2`: `Math.round(14 * fontScale * titleScale)`
     - `h3`: `Math.round(10.5 * fontScale * titleScale)`
     - `subtitle`: `Math.round(9.5 * fontScale * titleScale)`
     - `normal`: `Math.round(9 * fontScale * bodyScale)`
     - `small`: `Math.round(8 * fontScale * bodyScale)`
     - `smaller`: `Math.round(7.2 * fontScale * bodyScale)`
     - `list`: `Math.round(8.5 * fontScale * listScale)`
   - Spacing in points:
     - `pagePadding`: `(layout.pagePadding ?? 24) * 0.75`
     - `sectionGap`: `(layout.sectionGap ?? 20) * 0.75`
     - `itemGap`: `(layout.itemGap ?? 8) * 0.75`
   - Colors:
     - Calculate YIQ contrast for `leftBg` and `rightBg` using `getDynamicTextColors` (identical to `App.jsx` and `staticHtmlPdfEngine.js`).

### 2.4 Strict Zero-Split Super-Container Pagination & Orphan Prevention
1. Requirement R1 specifies: "Automatically paginate into multiple A4 pages, breaking between sections (never mid-item)".
2. In `@react-pdf/renderer`:
   - Every `<Page>` supports `wrap={true}`.
   - Any `<View>` with `wrap={false}` is treated as an indivisible atomic container. If it doesn't fit on the current page, the entire container is pushed intact to the next page.
   - Therefore, wrapping each item component in `<View wrap={false} style={styles.itemBlock}>` guarantees that job experiences (company, dates, bullet lists), degrees, and skill blocks are **never split mid-item**.
   - To prevent orphaned section headers, the section title and the first item are wrapped together in an atomic block:
     ```jsx
     <View wrap={false}>
       <Text style={styles.sectionTitle}>{section.title}</Text>
       <CVItemPdf item={section.items[0]} ... />
     </View>
     ```
     Subsequent items are rendered as individual `<CVItemPdf wrap={false} />` views.

### 2.5 Vector Icons via `@react-pdf/renderer` `<Svg>`
1. The DOM uses BoxIcons and Lucide React icons (`<i class="bx ..."></i>`). These cannot be rendered in `@react-pdf/renderer` as HTML strings.
2. `@react-pdf/renderer` provides `<Svg>`, `<Path>`, `<Circle>`, `<Rect>`.
3. Defining SVG path primitives for `MapPin`, `Mail`, `Phone`, `Linkedin`, `Github`, `BadgeCheck`, `Trophy`, `BookOpen`, `UserCheck`, and `ExternalLink` provides:
   - Crisp, infinite-resolution vector rendering
   - 0 external dependencies
   - 0 HTTP requests
   - Perfect spatial alignment matching `#area-cv`.

### 2.6 Epic 2 Rich Text Compatibility
1. Epic 2 introduces inline bold/italic/alignment formatting.
2. In `@react-pdf/renderer`, `<Text>` nodes can be nested:
   ```jsx
   <Text style={{ textAlign: item.textAlign || 'left' }}>
     <Text>Normal text </Text>
     <Text style={{ fontWeight: 'bold' }}>bold text </Text>
     <Text style={{ fontStyle: 'italic' }}>italic text</Text>
   </Text>
   ```
3. A helper `parseRichText(text, baseStyle)` parses inline HTML tags (`<b>`, `<strong>`, `<i>`, `<em>`) or markdown (`**bold**`, `*italic*`) and produces nested `<Text>` nodes.

---

## 3. Caveats

1. **Vite Polyfills Configuration**:
   `vite-plugin-node-polyfills` must be installed and properly configured before importing `@react-pdf/renderer` in any file that Vite compiles. If imported before the polyfill is configured, `vite build` will terminate with missing module errors.
2. **2-Column Row Layout Across Multiple Pages**:
   In `@react-pdf/renderer`, a root `<View style={{ flexDirection: 'row' }}>` on a wrapping `<Page>` duplicates the row across pages. However, if one column has significantly more content than the other, `@react-pdf/renderer` breaks the row when the page height is reached. To ensure visual harmony across pages, each column should have `flex: 1` or explicit percentage width, and items within each column must have `wrap={false}`.
3. **`staticHtmlPdfEngine.js` Bug Fix**:
   The implementer must fix line 79 of `staticHtmlPdfEngine.js` (`renderItemHTML(item, sectionType, isLast = false)`) so that all existing tests pass during regression checks.
4. **Rich Text Tag Persistence (Epic 2 Interface)**:
   Ensure that whichever syntax Epic 2 uses for formatting (HTML tags `<b>` / `<i>` or Markdown `**` / `*`), both `staticHtmlPdfEngine.js` and `@react-pdf/renderer` parse or sanitize them appropriately without double-escaping or rendering raw tags.

---

## 4. Conclusion & Implementation Blueprint

The client-side PDF generation engine via `@react-pdf/renderer` is completely feasible, performant, and can be integrated seamlessly into the existing Ressume architecture without modifying backend or serverless services.

### Proposed Architecture Blueprint:

#### 1. Package Installation & Vite Configuration
- `npm install @react-pdf/renderer`
- `npm install -D vite-plugin-node-polyfills`
- In `vite.config.js`:
  ```javascript
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';
  import { nodePolyfills } from 'vite-plugin-node-polyfills';

  export default defineConfig({
    plugins: [
      react(),
      nodePolyfills({
        include: ['buffer', 'stream', 'util', 'zlib', 'process'],
        globals: { Buffer: true, global: true, process: true }
      })
    ],
    // ... rest of config
  });
  ```

#### 2. File Structure
```
src/
├── components/
│   └── PDF/
│       ├── CVDocument.jsx          // Root React-PDF Document & Page layout
│       ├── CVSectionPdf.jsx        // Section container with orphan-prevention logic
│       ├── CVItemPdf.jsx           // Item renderer for all 13 item types
│       ├── PdfIcons.jsx            // Clean SVG vector icons (contact, badges, bullets)
│       └── richTextParser.js       // Rich text (bold, italic) tokenizer for nested <Text>
└── utils/
    ├── reactPdfEngine.js           // generateAndDownloadPdf & renderPdfBlob functions
    └── staticHtmlPdfEngine.js      // Existing engine (retained & supplemented; line 79 fixed)
```

#### 3. Component Details

##### A. `src/components/PDF/PdfIcons.jsx`
Native vector SVG paths for Contact and Section icons:
```jsx
import React from 'react';
import { Svg, Path } from '@react-pdf/renderer';

export const PdfIcon = ({ name, color = '#64748b', size = 9 }) => {
  const paths = {
    map: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z",
    envelope: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
    phone: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
    linkedin: "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.68 1.68 0 0 0-1.68 1.68 1.68 1.68 0 0 0 1.68 1.68 1.68 1.68 0 0 0 1.68-1.68 1.68 1.68 0 0 0-1.68-1.68z",
    github: "M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z",
    badge: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
    trophy: "M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V18H9v2h6v-2h-2v-2.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z",
    externalLink: "M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"
  };

  const path = paths[name] || paths.map;
  return (
    <Svg viewBox="0 0 24 24" style={{ width: size, height: size }}>
      <Path d={path} fill={color} />
    </Svg>
  );
};
```

##### B. `src/components/PDF/richTextParser.jsx`
Tokenizes formatted strings for `@react-pdf/renderer` nested `<Text>`:
```jsx
import React from 'react';
import { Text } from '@react-pdf/renderer';

export const renderRichPdfText = (text, baseStyle = {}, align = undefined) => {
  if (!text) return null;
  const str = String(text);

  // Regex splitting on <b>...</b>, <strong>...</strong>, <i>...</i>, <em>...</em>
  const tagRegex = /(<\/?(?:b|strong|i|em)>)/gi;
  const tokens = str.split(tagRegex);

  let isBold = false;
  let isItalic = false;

  const elements = tokens.map((token, index) => {
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

    const style = {
      ...(isBold ? { fontWeight: 'bold' } : {}),
      ...(isItalic ? { fontStyle: 'italic' } : {})
    };

    return (
      <Text key={index} style={style}>
        {token}
      </Text>
    );
  }).filter(Boolean);

  return (
    <Text style={[baseStyle, align ? { textAlign: align } : {}]}>
      {elements}
    </Text>
  );
};
```

##### C. `src/utils/reactPdfEngine.js`
Client-side PDF compilation and browser download:
```javascript
import React from 'react';
import { pdf } from '@react-pdf/renderer';
import CVDocument from '../components/PDF/CVDocument';

export const renderPdfBlob = async (cvData, lang = 'es') => {
  const doc = <CVDocument cvData={cvData} lang={lang} />;
  const blob = await pdf(doc).toBlob();
  return blob;
};

export const generateAndDownloadPdf = async (cvData, lang = 'es') => {
  const blob = await renderPdfBlob(cvData, lang);
  const cleanName = (cvData.profile?.name || 'Curriculum_Vitae')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '_');
  const filename = `CV_${cleanName}.pdf`;

  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 2500);
  return true;
};
```

##### D. `ActionMenu.jsx` Integration
- Add state: `const [pdfLoading, setPdfLoading] = useState(false);`
- In the export handler:
  ```javascript
  const handleDownloadVectorPDF = async () => {
    setPdfLoading(true);
    try {
      await generateAndDownloadPdf(cvData, activeLanguage);
      showToast('¡PDF vectorial descargado con éxito!', 'success');
    } catch (err) {
      console.error('Error generating vector PDF:', err);
      showToast('Error al generar PDF vectorial. Intente nuevamente.', 'warning');
    } finally {
      setPdfLoading(false);
    }
  };
  ```
- Render a dedicated button in the export group:
  ```jsx
  <button
    type="button"
    className="action-menu-btn"
    onClick={handleDownloadVectorPDF}
    disabled={pdfLoading}
    style={{ color: '#059669' }}
    aria-label="Descargar PDF Vectorial (@react-pdf)"
    title="Descargar PDF Vectorial (@react-pdf)"
  >
    {pdfLoading ? <Loader2 className="animate-spin" size={20} /> : <FileDown size={20} />}
  </button>
  ```

---

## 5. Verification Method

To independently verify this implementation:

1. **Build Verification**:
   Execute `npm run build`.
   - Ensure the build succeeds with exit code 0.
   - Verify `dist/` is produced without external stream/buffer packaging errors.
2. **Unit & Regression Testing**:
   Execute `npm test`.
   - Verify that fixing line 79 in `staticHtmlPdfEngine.js` resolves the 68 failing tests.
   - Run new tests for `reactPdfEngine`:
     ```bash
     npm test -- src/tests/reactPdfEngine.test.js
     ```
3. **Selectable Vector Text Test**:
   - Open the generated `.pdf` in a browser or PDF reader (e.g. `pdftotext output.pdf -`).
   - Extract text: ensure 100% of candidate name, job titles, and bullet texts are present as selectable UTF-8 text (not an embedded JPEG/PNG).
4. **Zero-Network Verification**:
   - In browser developer tools Network tab, trigger PDF export in offline mode (Network set to Offline).
   - Ensure PDF generation and download complete without pending or failed network calls.
5. **Pagination & Layout Verification**:
   - Test with both `type: '2-column'` and `type: '1-column'`.
   - Add extra experience items to force page 2. Verify that page 2 breaks between items and that individual items are not cut across page breaks.

---
*Report prepared for orchestrator handoff.*
