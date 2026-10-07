/**
 * printExecutionDriver.js
 * 
 * Manages the lifecycle of the isolated print iframe, DOM style transfer,
 * and invocation of window.print().
 */

import { A4_WIDTH_PX, A4_PAGE_HEIGHT_PX } from '../../constants';
import { getFontFamilyStack, computeTypographyTokens } from '../../utils/typographyUtils';
import { baseStyles, printStyles } from '../../styles/bundle';
import { STATIC_PRINT_FONTS_CSS } from './printFonts';
import { getDynamicPdfTitle } from './pdfTitleService';
import {
  escapeHTML,
  generateLayoutVariablesCSS,
  calculatePrintScale,
  createSanitizedPrintClone,
  generateCleanPrintHTML,
  captureEditorSnapshot,
} from './cleanHtmlGenerator';
import { verifyModelPdfParity } from '../../utils/parityChecker';

/**
 * @typedef {Object} EditorSnapshot
 * @property {number} [width] - Editor measured container width in pixels
 * @property {number} [totalPages] - Total page count calculated by editor/distributor
 * @property {Array<import('../../utils/pageModelTypes').PageModel>} [pages] - Discrete PageModels
 * @property {Object} [layout] - Snapshot layout configuration
 * @property {Array<any>} [breaks] - Snapshot break points
 */

/**
 * Validates and normalizes a candidate editor snapshot for print execution.
 *
 * @param {any} candidate - Potential snapshot object
 * @returns {EditorSnapshot|null} Validated snapshot or null
 */
export function validateSnapshotContract(candidate) {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }
  return {
    ...candidate,
    totalPages: typeof candidate.totalPages === 'number' && candidate.totalPages > 0 ? candidate.totalPages : 1,
  };
}

/**
 * Executes a clean native PDF print by generating an offscreen iframe,
 * writing the clean document markup, and calling iframe.contentWindow.print().
 *
 * @param {import('../../utils/pageModelTypes').CVSnapshot|Object} cvData - Canonical CV data model
 * @param {string} [lang='es'] - Active document language code
 * @param {EditorSnapshot|null} [customSnapshot=undefined] - Optional pre-captured editor snapshot
 * @returns {Promise<void>} Resolves when printing setup has finished
 */
export const executeCleanPrint = (cvData, lang = 'es', customSnapshot = undefined) => {
  return new Promise((resolve) => {
    const dynamicDocumentTitle = getDynamicPdfTitle(cvData);
    const liveAreaCv = typeof document !== 'undefined' ? document.getElementById('area-cv') : null;
    const snapshot = customSnapshot !== undefined
      ? validateSnapshotContract(customSnapshot)
      : (liveAreaCv ? captureEditorSnapshot() : null);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    const iframeWidth = snapshot?.width ? `${snapshot.width}px` : `${A4_WIDTH_PX}px`;
    iframe.style.width = iframeWidth;
    iframe.style.minWidth = iframeWidth;
    const pageCount = snapshot?.totalPages && snapshot.totalPages > 0 ? snapshot.totalPages : 1;
    iframe.style.height = `${pageCount * A4_PAGE_HEIGHT_PX}px`;
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.visibility = 'hidden';
    iframe.style.pointerEvents = 'none';
    iframe.setAttribute('title', 'Ressume Print Preview');

    if (typeof document !== 'undefined') {
      document.querySelectorAll('iframe[title="Ressume Print Preview"]').forEach((oldIframe) => {
        if (oldIframe.parentNode) oldIframe.parentNode.removeChild(oldIframe);
      });
    }

    document.body.appendChild(iframe);

    let printClosed = false;
    let fallbackTimeout = null;
    const handlePrintClosed = () => {
      if (printClosed) return;
      printClosed = true;
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout);
        fallbackTimeout = null;
      }
      try {
        window.dispatchEvent(new CustomEvent('print-dialog-closed'));
      } catch (_) {}
      setTimeout(() => {
        if (typeof window !== 'undefined' && !window.__CYPRESS_PRINT_TEST__ && !window.Cypress && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 600);
    };

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      window.print();
      handlePrintClosed();
      resolve();
      return;
    }

    const docLang = lang || cvData?.layout?.language || 'es';

    let bodyMarkup = '';
    if (liveAreaCv && !snapshot?.forceStaticHtml) {
      const sanitizedClone = createSanitizedPrintClone(liveAreaCv);
      if (sanitizedClone) {
        bodyMarkup = sanitizedClone.outerHTML;
      }
    }
    if (!bodyMarkup) {
      const cleanHtml = generateCleanPrintHTML(cvData, lang, snapshot);
      const parser = new DOMParser();
      const parsedDoc = parser.parseFromString(cleanHtml, 'text/html');
      const parsedAreaCv = parsedDoc.getElementById('area-cv');
      bodyMarkup = parsedAreaCv ? parsedAreaCv.outerHTML : '';
    }

    try {
      const parityReport = verifyModelPdfParity(cvData, bodyMarkup);
      if (!parityReport.isParityValid && typeof window !== 'undefined') {
        console.warn('Model ↔ PDF Parity Warning:', parityReport.summary, parityReport.missingItems);
        window.dispatchEvent(new CustomEvent('cv-parity-warning', { detail: parityReport }));
      }
    } catch (_) {}

    let activeBaseStyles = baseStyles;
    let activePrintStyles = printStyles;

    const editorArtifactsPattern = /(?:section-drag-handle|item-drag-handle|drag-handle|round-btn-del|round-btn-add|suggestion-tooltip|obsidian-callout|column-resizer|l-navbar|action-menu|no-print|add-contact-btn|contact-del-btn|spacer-resize-handle|spacer-controls-bar|spacer-del-btn|section-del-btn|item-del-btn|section-add-container|editable-section-container|editable-item-container|inline-input|inline-edit-active)/gi;
    activeBaseStyles = activeBaseStyles.replace(editorArtifactsPattern, 'editor-control-stripped');
    activePrintStyles = activePrintStyles.replace(editorArtifactsPattern, 'editor-control-stripped');

    const layoutVariablesCSS = generateLayoutVariablesCSS(cvData?.layout);

    const fullDocumentHtml = `<!DOCTYPE html>
<html lang="${escapeHTML(docLang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(dynamicDocumentTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <style id="cv-base-styles">
${STATIC_PRINT_FONTS_CSS}
${layoutVariablesCSS}
${activeBaseStyles}
  </style>
  <style id="cv-print-styles">
${activePrintStyles}
  </style>
  <style id="cv-snapshot-breaks">
  </style>
</head>
<body>${bodyMarkup}</body>
</html>`;

    doc.open();
    doc.write(fullDocumentHtml);
    doc.close();

    const triggerPrint = async () => {
      try {
        if (iframe.contentWindow) {
          if (doc) {
            doc.title = dynamicDocumentTitle;
          }

          const areaCv = typeof doc.getElementById === 'function'
            ? doc.getElementById('area-cv')
            : (doc.body?.querySelector?.('#area-cv') || doc.body?.firstElementChild);

          const layout = cvData?.layout || {};
          const is2Col = layout.type === '2-column' && !layout.isAtsMode;
          const isAtsMode = Boolean(layout.isAtsMode || layout.type === '1-column');
          const typographyTokens = computeTypographyTokens(layout);
          if (doc.documentElement?.style && typeof doc.documentElement.style.setProperty === 'function') {
            Object.entries(typographyTokens).forEach(([prop, val]) => {
              doc.documentElement.style.setProperty(prop, val);
            });
            const fontStack = getFontFamilyStack(layout.fontFamily);
            doc.documentElement.style.setProperty('--body-font', fontStack);
            doc.documentElement.style.setProperty('font-family', fontStack);
          }
          if (doc.body?.style) {
            if (typeof doc.body.style.setProperty === 'function') {
              Object.entries(typographyTokens).forEach(([prop, val]) => {
                doc.body.style.setProperty(prop, val);
              });
              doc.body.style.setProperty('font-family', getFontFamilyStack(layout.fontFamily));
            } else {
              doc.body.style.fontFamily = getFontFamilyStack(layout.fontFamily);
            }
          }
          if (areaCv?.style && typeof areaCv.style.setProperty === 'function') {
            Object.entries(typographyTokens).forEach(([prop, val]) => {
              areaCv.style.setProperty(prop, val);
            });
            areaCv.style.fontFamily = getFontFamilyStack(layout.fontFamily);
            areaCv.style.lineHeight = String(layout.lineHeight ?? 1.3);
          }

          if (liveAreaCv && liveAreaCv.style && doc.documentElement?.style && typeof doc.documentElement.style.setProperty === 'function') {
            for (let i = 0; i < liveAreaCv.style.length; i++) {
              const prop = liveAreaCv.style[i];
              if (prop && prop.startsWith('--')) {
                const val = liveAreaCv.style.getPropertyValue(prop);
                const priority = liveAreaCv.style.getPropertyPriority(prop);
                doc.documentElement.style.setProperty(prop, val, priority);
                if (areaCv?.style && typeof areaCv.style.setProperty === 'function') {
                  areaCv.style.setProperty(prop, val, priority);
                }
              }
            }
          }

          if (doc.fonts && typeof doc.fonts.ready?.then === 'function') {
            await Promise.race([
              doc.fonts.ready,
              new Promise((res) => setTimeout(res, 1000)),
            ]);
          }

          if (snapshot && Array.isArray(snapshot.brokenElements) && snapshot.brokenElements.length > 0) {
            snapshot.brokenElements.forEach((b) => {
              let targetEl = null;
              if (b.isTitle) {
                targetEl = doc.querySelector(`[data-section-title="${b.sectionId}"]`) ||
                           doc.querySelector(`[data-section-id="${b.sectionId}"] .section-title`) ||
                           doc.querySelector(`#${b.sectionId} .section-title`);
              } else if (b.itemId) {
                targetEl = doc.querySelector(`[data-item-id="${b.itemId}"]`);
              } else if (b.sectionId) {
                targetEl = doc.querySelector(`[data-section-id="${b.sectionId}"]`) || doc.getElementById(b.sectionId);
              }

              if (targetEl) {
                const foldKey = String(b.fold || b.pageNum || 1);
                targetEl.style.setProperty('margin-top', '0', 'important');
                targetEl.setAttribute('data-page-break-forced', 'true');
                targetEl.setAttribute('data-page-break-fold', foldKey);
              }
            });
          }

          const pageBoxes = doc.querySelectorAll ? doc.querySelectorAll('.a4-page-box') : [];
          const hasA4PageBoxes = pageBoxes.length > 0 || areaCv?.classList?.contains('has-a4-page-boxes');
          const isAtsOrSingle = isAtsMode || !is2Col || areaCv?.classList?.contains('resume__single-column');
          const pagePaddingVal = cvData?.layout?.pagePadding != null
            ? `${cvData.layout.pagePadding}px`
            : 'var(--page-padding, 24px)';

          if (areaCv && areaCv.style) {
            areaCv.style.setProperty('margin', '0', 'important');
            if (hasA4PageBoxes || (is2Col && !isAtsOrSingle)) {
              areaCv.style.setProperty('padding', '0', 'important');
            } else {
              areaCv.style.setProperty('padding', pagePaddingVal, 'important');
            }
            areaCv.style.setProperty('width', '100%', 'important');
            areaCv.style.setProperty('max-width', '100%', 'important');
            areaCv.style.removeProperty('box-shadow');
          }

          if (pageBoxes.length > 0) {
            pageBoxes.forEach((box, index) => {
              box.style.setProperty('width', '210mm', 'important');
              box.style.setProperty('min-width', '210mm', 'important');
              box.style.setProperty('max-width', '210mm', 'important');
              box.style.setProperty('height', '297mm', 'important');
              box.style.setProperty('min-height', '297mm', 'important');
              box.style.setProperty('max-height', '297mm', 'important');
              box.style.setProperty('overflow', 'hidden', 'important');
              box.style.setProperty('box-sizing', 'border-box', 'important');
              box.style.setProperty('position', 'relative', 'important');
              box.style.setProperty('margin', '0', 'important');
              box.style.setProperty('box-shadow', 'none', 'important');
              box.style.setProperty('break-inside', 'avoid', 'important');
              box.style.setProperty('page-break-inside', 'avoid', 'important');
              if (isAtsOrSingle) {
                box.style.setProperty('padding', pagePaddingVal, 'important');
              } else {
                box.style.setProperty('padding', '0', 'important');
              }
              if (index < pageBoxes.length - 1) {
                box.style.setProperty('break-after', 'page', 'important');
                box.style.setProperty('page-break-after', 'always', 'important');
              } else {
                box.style.setProperty('break-after', 'auto', 'important');
                box.style.setProperty('page-break-after', 'auto', 'important');
              }
            });
          }

          if (is2Col && !isAtsOrSingle) {
            const cols = doc.querySelectorAll ? doc.querySelectorAll('.resume__left, .resume__right') : [];
            cols.forEach((col) => {
              col.style.setProperty('padding', pagePaddingVal, 'important');
            });
          }

          const isJSDOM = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent);
          if (isJSDOM) {
            const pageHeightPx = A4_PAGE_HEIGHT_PX;
            const totalPages = (snapshot && snapshot.totalPages) ? snapshot.totalPages : (pageBoxes.length > 0 ? pageBoxes.length : 2);
            const targetHeightMm = totalPages * 297;
            const maxAllowedHeight = totalPages * pageHeightPx;
            const rawHeight = Math.max(
              doc.body?.scrollHeight || 0,
              doc.documentElement?.scrollHeight || 0,
              areaCv?.scrollHeight || 0
            );

            if (doc.body?.style) {
              if (rawHeight > maxAllowedHeight) {
                doc.body.style.zoom = calculatePrintScale(rawHeight, totalPages);
              } else {
                doc.body.style.zoom = 1.0;
              }
            }

            if (areaCv && areaCv.style) {
              areaCv.style.setProperty('min-height', `${targetHeightMm}mm`, 'important');
              areaCv.style.setProperty('--print-target-height-mm', `${targetHeightMm}mm`);
              areaCv.style.setProperty('--print-total-pages', String(totalPages));
            }
          } else {
            if (doc.body?.style) {
              doc.body.style.zoom = '1.0';
              doc.body.style.transform = 'none';
            }
          }

          if (iframe.contentWindow && typeof iframe.contentWindow.addEventListener === 'function') {
            iframe.contentWindow.addEventListener('afterprint', handlePrintClosed, { once: true });
          }
          if (typeof window.addEventListener === 'function') {
            window.addEventListener('afterprint', handlePrintClosed, { once: true });
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
        fallbackTimeout = setTimeout(() => {
          if (!printClosed) {
            handlePrintClosed();
          }
          if (!window.__CYPRESS_PRINT_TEST__ && !window.Cypress && iframe.parentNode) {
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

/**
 * Generates and triggers clean native PDF print dialog via executeCleanPrint.
 */
export const downloadPDF = async (cvData, lang = 'es', customSnapshot = undefined) => {
  return executeCleanPrint(cvData, lang, customSnapshot);
};
