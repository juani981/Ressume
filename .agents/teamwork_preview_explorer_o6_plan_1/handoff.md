# Handoff Report: Print Engine & Pagination Implementation Plan (Plan 1)

## 1. Observation

1. **`executeCleanPrint` Iframe Dimensions in `src/utils/staticHtmlPdfEngine.js` (lines 628-631)**:
   ```javascript
   iframe.style.position = 'fixed';
   iframe.style.top = '-10000px';
   iframe.style.left = '-10000px';
   iframe.style.width = '0px';
   iframe.style.height = '0px';
   iframe.style.border = '0';
   ```
   Directly observed: The iframe is initialized with `width: 0px; height: 0px`. This causes layout evaluation within a 0-width viewport, artificially inflating `scrollHeight` and skewing auto-scaling calculations.

2. **Synchronous Execution & Missing Font Synchronization in `src/utils/staticHtmlPdfEngine.js` (lines 668-675)**:
   ```javascript
   if (iframe.contentWindow?.document?.readyState === 'complete') {
     triggerPrint();
   } else {
     iframe.onload = triggerPrint;
   }
   ```
   Directly observed: `triggerPrint` fires immediately upon `readyState === 'complete'` or `onload` without awaiting `doc.fonts?.ready`. Web fonts (`Inter`, `Poppins`, `Roboto`, `Merriweather`, `JetBrains Mono`) and BoxIcons vector icons load asynchronously via `@font-face` / external stylesheet, triggering layout shifts and missing icon/font flashes when printed natively.

3. **Missing Orphan Header Avoidance in `generateCleanPrintHTML` (`src/utils/staticHtmlPdfEngine.js:459-462, 490-498`)**:
   ```css
   h1, h2, h3 {
     color: var(--title-color);
     font-weight: 600;
   }
   ...
   .section-title {
     font-size: var(--title-h2-size, var(--h2-font-size));
     color: var(--title-color);
     font-weight: 600;
     text-transform: uppercase;
     letter-spacing: .2rem;
     margin-bottom: 0.6rem;
     text-align: left;
   }
   ```
   Directly observed: Headings and section titles lack `break-after: avoid !important; page-break-after: avoid !important;`. During multi-page printing, headings can be severed from their subsequent content blocks.

4. **Super-Container Break Rules in `generateCleanPrintHTML` (`src/utils/staticHtmlPdfEngine.js:579-588`)**:
   ```css
   .cv-section,
   .cv-block,
   .section,
   .experience__content,
   .education__content,
   .skills__name {
     break-inside: avoid !important;
     page-break-inside: avoid !important;
   }
   ```
   Directly observed: `.cv-section` and `.cv-block` already declare `break-inside: avoid !important; page-break-inside: avoid !important;`. All 13 section types wrap sections with `.cv-section` and items with `.cv-block`.

5. **`@media print` in `src/index.css` (lines 1097-1113)**:
   ```css
   @media print {
     .l-navbar, 
     .change-theme, 
     .generate-pdf,
     .section-drag-handle,
     .item-drag-handle,
     .drag-handle,
     .round-btn-add,
     .round-btn-del,
     .add-section-btn,
     .section-add-container,
     .column-add-section,
     .no-print {
       display: none !important;
     }
   ```
   Directly observed: Several interactive editor classes are missing from `@media print` suppression: `.section-del-btn`, `.item-del-btn`, `.bullet-del-btn`, `.add-bullet-btn`, `.bullet-add-row`, `.section-tips-toggle-btn`, `.suggestion-tooltip`, `.obsidian-callout`, `.column-resizer`, `.column-resizer-bar`, `.column-resizer-handle`, `.action-menu-btn-wrap`, `.action-menu-btn`, `.action-menu-tooltip`, `.design-popover`, `.spacing-popover`, `.toast-notification`, and generic `button`. Furthermore, `break-after: avoid !important; page-break-after: avoid !important;` is missing on `.section-title`, `h1`, `h2`, `h3`.

---

## 2. Logic Chain

1. *From Observation 1*: Setting iframe dimensions to `width: 794px; min-width: 794px; height: 1123px; visibility: hidden; border: 0; position: fixed; top: -10000px; left: -10000px;` establishes a standard A4 desktop viewport (210mm x 297mm at 96 DPI). This ensures media queries, flexbox wrap calculations, and grid column proportions evaluate identically to desktop print media.
2. *From Observation 1 & 2*: With an accurate 794px viewport width, `doc.body.scrollHeight` reflects true A4 page length. `calculatePrintScale(renderedHeight)` compares this against `MAX_A4_2PAGE_HEIGHT_PX = 2246px`. If `renderedHeight > 2246px`, `doc.body.style.zoom = scale` smoothly scales typography and layout to cap total document height at 2 A4 pages.
3. *From Observation 2*: Web fonts and BoxIcons are external asynchronous resources. Invoking `await Promise.race([doc.fonts.ready, new Promise(res => setTimeout(res, 1000))])` guarantees glyph synchronization before `print()` is triggered, eliminating fallback font flashes and missing icon glyphs, while the 1000ms timeout prevents hangs in offline or restricted environments.
4. *From Observation 3 & 5*: Applying `break-after: avoid !important; page-break-after: avoid !important;` to `.section-title`, `h1`, `h2`, and `h3` prevents headers from remaining stranded at the bottom of a page without child content.
5. *From Observation 4*: Zero-split pagination is already structured across all 13 section types using `.cv-section` and `.cv-block`. Reinforcing these rules in `@media print` ensures complete coverage.
6. *From Observation 5*: Expanding the suppression blacklist in `src/index.css` `@media print` to encompass all 18 interactive selectors provides robust defense-in-depth for native print triggers (`Ctrl+P`).

---

## 3. Caveats

1. **Browser `zoom` Property Support**: `doc.body.style.zoom` is natively supported in Chromium and WebKit. In Firefox, `@media print` scaling handles layout, and `zoom` is supported in Firefox 126+. No browser breaks or throws when `style.zoom` is assigned.
2. **Synchronous Test Lifecycle**: Existing unit tests spy on `document.body.appendChild` synchronously. Therefore, `iframe` creation and DOM attachment must remain synchronous at the entry point of `executeCleanPrint`, even as the function returns a Promise.
3. **Pre-existing Test Baseline**: The current test suite has 5 pre-existing failures in `SuggestionTooltip.jsx` and `InlineEdit.jsx` (which are assigned to Plan 2). The changes specified here in Plan 1 do not cause or touch those 5 failures.

---

## 4. Conclusion

The implementation plan for `src/utils/staticHtmlPdfEngine.js` and `src/index.css` is complete, exact, and ready for immediate execution by the Worker.

### 4.1 Exact Code Replacement for `src/utils/staticHtmlPdfEngine.js`

#### Snippet 1: Orphan Header Prevention in Headings (`src/utils/staticHtmlPdfEngine.js`)
Replace lines 459-462:
```css
<<<<
    h1, h2, h3 {
      color: var(--title-color);
      font-weight: 600;
    }
====
    h1, h2, h3 {
      color: var(--title-color);
      font-weight: 600;
      break-after: avoid !important;
      page-break-after: avoid !important;
    }
>>>>
```

#### Snippet 2: Orphan Header Prevention in Section Title (`src/utils/staticHtmlPdfEngine.js`)
Replace lines 490-499:
```css
<<<<
    .section-title {
      font-size: var(--title-h2-size, var(--h2-font-size));
      color: var(--title-color);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .2rem;
      margin-bottom: 0.6rem;
      text-align: left;
    }
====
    .section-title {
      font-size: var(--title-h2-size, var(--h2-font-size));
      color: var(--title-color);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .2rem;
      margin-bottom: 0.6rem;
      text-align: left;
      break-after: avoid !important;
      page-break-after: avoid !important;
    }
>>>>
```

#### Snippet 3: Super-container and Media Print Reinforcement (`src/utils/staticHtmlPdfEngine.js`)
Replace lines 579-609:
```css
<<<<
    /* Super-container CSS Page Break & Splitting Prevention */
    .cv-section,
    .cv-block,
    .section,
    .experience__content,
    .education__content,
    .skills__name {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    @media print {
      @page {
        size: A4;
        margin: 0;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        background-color: #ffffff !important;
      }
      #area-cv {
        max-width: 100% !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
    }
====
    /* Super-container CSS Page Break & Splitting Prevention */
    .cv-section,
    .cv-block,
    .section,
    .experience__content,
    .education__content,
    .skills__name {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    /* Orphan Header Protection */
    .section-title,
    h1,
    h2,
    h3 {
      break-after: avoid !important;
      page-break-after: avoid !important;
    }

    p, h1, h2, h3, li {
      orphans: 3;
      widows: 3;
    }

    @media print {
      @page {
        size: A4;
        margin: 0;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        background-color: #ffffff !important;
      }
      #area-cv {
        max-width: 100% !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .cv-section,
      .cv-block,
      .section,
      .experience__content,
      .education__content,
      .skills__name {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      .section-title,
      h1,
      h2,
      h3 {
        break-after: avoid !important;
        page-break-after: avoid !important;
      }
    }
>>>>
```

#### Snippet 4: `executeCleanPrint` Implementation (`src/utils/staticHtmlPdfEngine.js`)
Replace lines 622-675:
```javascript
<<<<
export const executeCleanPrint = (cvData, lang = 'es') => {
  const html = generateCleanPrintHTML(cvData, lang);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = '0';
  iframe.setAttribute('title', 'Ressume Print Preview');

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const triggerPrint = () => {
    try {
      if (iframe.contentWindow) {
        const renderedHeight = doc.body?.scrollHeight || doc.documentElement?.scrollHeight || 1000;
        const scale = calculatePrintScale(renderedHeight);
        if (scale < 1.0 && doc.body) {
          doc.body.style.zoom = scale;
        }

        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }
    } catch (e) {
      console.warn('Iframe print failed, falling back to window.print()', e);
      window.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1000);
    }
  };

  if (iframe.contentWindow?.document?.readyState === 'complete') {
    triggerPrint();
  } else {
    iframe.onload = triggerPrint;
  }
};
====
export const executeCleanPrint = (cvData, lang = 'es') => {
  return new Promise((resolve) => {
    const html = generateCleanPrintHTML(cvData, lang);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '794px';
    iframe.style.minWidth = '794px';
    iframe.style.height = '1123px';
    iframe.style.visibility = 'hidden';
    iframe.style.border = '0';
    iframe.setAttribute('title', 'Ressume Print Preview');

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      window.print();
      resolve();
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    const triggerPrint = async () => {
      try {
        if (iframe.contentWindow) {
          // Await font readiness with timeout fallback (max 1000ms)
          if (doc.fonts && typeof doc.fonts.ready?.then === 'function') {
            await Promise.race([
              doc.fonts.ready,
              new Promise((res) => setTimeout(res, 1000))
            ]);
          }

          const renderedHeight = doc.body?.scrollHeight || doc.documentElement?.scrollHeight || 1000;
          const scale = calculatePrintScale(renderedHeight);
          if (scale < 1.0 && doc.body) {
            doc.body.style.zoom = scale;
          }

          if (typeof iframe.contentWindow.focus === 'function') {
            iframe.contentWindow.focus();
          }
          if (typeof iframe.contentWindow.print === 'function') {
            iframe.contentWindow.print();
          } else {
            window.print();
          }
        }
      } catch (e) {
        console.warn('Iframe print failed, falling back to window.print()', e);
        window.print();
      } finally {
        resolve();
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 1000);
      }
    };

    if (iframe.contentWindow?.document?.readyState === 'complete') {
      triggerPrint();
    } else {
      iframe.onload = () => {
        triggerPrint();
      };
    }
  });
};
>>>>
```

---

### 4.2 Exact Code Replacement for `src/index.css`

#### Target: lines 1097-1168 (`@media print`)
```css
<<<<
@media print {
  /* Ocultar toda la interfaz interactiva de edición */
  .l-navbar, 
  .change-theme, 
  .generate-pdf,
  .section-drag-handle,
  .item-drag-handle,
  .drag-handle,
  .round-btn-add,
  .round-btn-del,
  .add-section-btn,
  .section-add-container,
  .column-add-section,
  .no-print {
    display: none !important;
  }

  /* Eliminar outlines y fondos de edición */
  .editable-section-container,
  .editable-item-container {
    outline: none !important;
    background-color: transparent !important;
  }

  /* Forzar renderizado exacto de colores de fondo */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Formato A4 y márgenes de impresión estándar */
  @page {
    size: A4;
    margin: 0; 
  }

  body {
    background-color: white !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  
  #root, html, body {
    height: auto !important;
    overflow: visible !important;
  }

  #area-cv {
    max-width: 100% !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
  }

  /* Control de Saltos de Página (Page Breaks) */
  .cv-section,
  .cv-block,
  .section,
  .experience__content, 
  .education__content,
  .skills__name,
  .editable-item-container {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  
  p, h2, h3, li {
    orphans: 3;
    widows: 3;
  }
}
====
@media print {
  /* Ocultar toda la interfaz interactiva de edición (18 selectores interactivos + controles de UI) */
  .l-navbar,
  .action-menu-btn-wrap,
  .action-menu-btn,
  .action-menu-tooltip,
  .design-popover,
  .spacing-popover,
  .change-theme,
  .generate-pdf,
  .section-drag-handle,
  .item-drag-handle,
  .drag-handle,
  .round-btn-add,
  .round-btn-del,
  .section-del-btn,
  .item-del-btn,
  .bullet-del-btn,
  .add-section-btn,
  .section-add-container,
  .column-add-section,
  .add-bullet-btn,
  .bullet-add-row,
  .section-tips-toggle-btn,
  .suggestion-tooltip,
  .obsidian-callout,
  .column-resizer,
  .column-resizer-bar,
  .column-resizer-handle,
  .toast-notification,
  .no-print,
  button {
    display: none !important;
  }

  /* Eliminar outlines y fondos de edición */
  .editable-section-container,
  .editable-item-container {
    outline: none !important;
    background-color: transparent !important;
    border: none !important;
  }

  /* Neutralizar inputs editables */
  .inline-input {
    border: none !important;
    outline: none !important;
    background: transparent !important;
    box-shadow: none !important;
  }

  /* Forzar renderizado exacto de colores de fondo */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Formato A4 y márgenes de impresión estándar */
  @page {
    size: A4;
    margin: 0; 
  }

  body {
    background-color: white !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  
  #root, html, body {
    height: auto !important;
    overflow: visible !important;
  }

  #area-cv {
    max-width: 100% !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
  }

  /* Control de Saltos de Página (Page Breaks) */
  .cv-section,
  .cv-block,
  .section,
  .experience__content, 
  .education__content,
  .skills__name,
  .editable-item-container {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  /* Prevención de encabezados huérfanos */
  .section-title,
  h1,
  h2,
  h3 {
    break-after: avoid !important;
    page-break-after: avoid !important;
  }
  
  p, h1, h2, h3, li {
    orphans: 3;
    widows: 3;
  }
}
>>>>
```

---

## 5. Verification Method

1. **Independent Verification Commands**:
   ```bash
   # 1. Run test suites
   npm test -- --run

   # 2. Verify build compilation
   npm run build
   ```

2. **Files to Inspect**:
   - `src/utils/staticHtmlPdfEngine.js`: Verify iframe dimensions (`794px x 1123px`), `doc.fonts?.ready` font sync, auto-scaling check, and `break-after: avoid !important; page-break-after: avoid !important;` on headings.
   - `src/index.css`: Verify `@media print` rule contains all 18 interactive selectors and orphan header protection.

3. **Invalidation Conditions**:
   - If iframe style does not specify `794px` width.
   - If `generateCleanPrintHTML` fails to declare `break-after: avoid !important;` on `.section-title` or headings.
   - If any of the 18 interactive selectors appear in `generateCleanPrintHTML` DOM output or are omitted from `@media print` in `src/index.css`.
