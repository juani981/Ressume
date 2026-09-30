/**
 * cleanHtmlGenerator.js
 * 
 * Generates standalone clean static HTML for printing and PDF rendering.
 * Strips all interactive editor UI artifacts and guarantees A4 print layout.
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderRichHTML, stripHtml } from '../../utils/richTextEngine';
import { getSectionDescriptor } from '../../registry/sectionRegistry';
import { PrintBaseSection } from '../../components/CV/BaseSection';
import { baseStyles, printStyles } from '../../styles/bundle';
import { getDynamicTextColors } from '../../utils/colorUtils';
import {
  A4_WIDTH_PX,
  A4_PAGE_HEIGHT_PX,
  A4_WIDTH_CSS,
  A4_HEIGHT_CSS,
  A4_DOCUMENT_SCALE,
} from '../../constants';
import { getRulerHeightPx } from '../../utils/pageGeometry';
import { getFontFamilyStack } from '../../utils/typographyUtils';
import { getDynamicPdfTitle } from './pdfTitleService';
import { normalizeDateRange, sanitizeBulletText, sanitizeOcrMathSyntax } from '../../utils/textSanitizer';

export { renderRichHTML, stripHtml };

export const MAX_A4_2PAGE_HEIGHT_PX = A4_PAGE_HEIGHT_PX * 2; // 2246px
export const MIN_SCALE_FLOOR = 0.75;

/**
 * Escapes HTML characters to prevent XSS and malformed HTML
 */
export const escapeHTML = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Generates scoped CSS variables and typography token declarations from CV layout settings.
 */
export const generateLayoutVariablesCSS = (layout = {}) => {
  const fontScale = layout.fontScale ?? 1.0;
  const titleScale = layout.titleScale ?? 1.0;
  const bodyScale = layout.bodyScale ?? 1.0;
  const listScale = layout.listScale ?? 1.0;
  const lineHeight = layout.lineHeight ?? 1.45;
  const pagePadding = layout.pagePadding ?? 24;
  const sectionGap = layout.sectionGap ?? 20;
  const itemGap = layout.itemGap ?? 8;
  const fontFamilyStack = getFontFamilyStack(layout.fontFamily);
  const leftColPercent = layout.leftColumnWidth || 33.33;
  const gridTemplateColumns = layout.leftColumnWidth
    ? `${layout.leftColumnWidth}% ${100 - layout.leftColumnWidth}%`
    : '1fr 2fr';

  return `
    :root,
    html,
    body,
    #area-cv {
      --a4-page-width: ${A4_WIDTH_CSS};
      --a4-page-height: ${A4_HEIGHT_CSS};
      --a4-page-width-px: ${A4_WIDTH_PX}px;
      --a4-page-height-px: ${A4_PAGE_HEIGHT_PX}px;
      --a4-page-scale: ${A4_DOCUMENT_SCALE};
      --page-padding: ${pagePadding}px;
      --section-gap: ${sectionGap}px;
      --item-gap: ${itemGap}px;
      --body-font: ${fontFamilyStack};
      font-family: ${fontFamilyStack} !important;
      --font-scale: ${fontScale};
      --title-scale: ${titleScale};
      --body-scale: ${bodyScale};
      --list-scale: ${listScale};
      --line-height: ${lineHeight};
      line-height: ${lineHeight};
      --grid-template-columns: ${gridTemplateColumns};
      --left-col-percent: ${leftColPercent}%;
      --left-bg: ${layout.leftBg || 'var(--container-color-alt)'};
      --right-bg: ${layout.rightBg || '#ffffff'};
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
    }
    #area-cv.bd-grid {
      grid-template-columns: ${gridTemplateColumns} !important;
      gap: 0 !important;
      column-gap: 0 !important;
      row-gap: 0 !important;
    }
  `;
};

/**
 * Computes adaptive print scale and target page count without hardcoded limits.
 */
export const computeAdaptivePrintLayout = (renderedHeight) => {
  if (!renderedHeight || renderedHeight <= 0 || isNaN(renderedHeight)) {
    return { scale: 1.0, totalPages: 1, targetHeightMm: 297 };
  }

  if (renderedHeight <= A4_PAGE_HEIGHT_PX) {
    return { scale: 1.0, totalPages: 1, targetHeightMm: 297 };
  }

  if (renderedHeight <= A4_PAGE_HEIGHT_PX * 1.12) {
    const scale = +((A4_PAGE_HEIGHT_PX / renderedHeight).toFixed(3));
    return { scale: Math.max(MIN_SCALE_FLOOR, scale), totalPages: 1, targetHeightMm: 297 };
  }

  if (renderedHeight <= MAX_A4_2PAGE_HEIGHT_PX) {
    return { scale: 1.0, totalPages: 2, targetHeightMm: 594 };
  }

  if (renderedHeight <= MAX_A4_2PAGE_HEIGHT_PX * 1.15) {
    const scale = +((MAX_A4_2PAGE_HEIGHT_PX / renderedHeight).toFixed(3));
    return { scale: Math.max(MIN_SCALE_FLOOR, scale), totalPages: 2, targetHeightMm: 594 };
  }

  if (renderedHeight <= A4_PAGE_HEIGHT_PX * 3) {
    return { scale: 1.0, totalPages: 3, targetHeightMm: 891 };
  }

  if (renderedHeight <= (A4_PAGE_HEIGHT_PX * 3) * 1.15) {
    const scale = +(((A4_PAGE_HEIGHT_PX * 3) / renderedHeight).toFixed(3));
    return { scale: Math.max(MIN_SCALE_FLOOR, scale), totalPages: 3, targetHeightMm: 891 };
  }

  const pages = Math.ceil(renderedHeight / A4_PAGE_HEIGHT_PX);
  return { scale: 1.0, totalPages: pages, targetHeightMm: pages * 297 };
};

/**
 * Calculates auto-scale factor adhering to smart multi-page fitting.
 */
export const calculatePrintScale = (renderedHeight, maxPages = 2) => {
  if (!renderedHeight || renderedHeight <= 0 || isNaN(renderedHeight)) {
    return 1.0;
  }

  if (renderedHeight <= A4_PAGE_HEIGHT_PX) {
    return 1.0;
  }

  if (maxPages === 1 && renderedHeight <= A4_PAGE_HEIGHT_PX * 1.15) {
    const calculated = A4_PAGE_HEIGHT_PX / renderedHeight;
    return Math.max(MIN_SCALE_FLOOR, +(calculated.toFixed(3)));
  }

  const maxAllowedHeight = maxPages ? maxPages * A4_PAGE_HEIGHT_PX : MAX_A4_2PAGE_HEIGHT_PX;
  if (renderedHeight <= maxAllowedHeight) {
    return 1.0;
  }

  const calculated = maxAllowedHeight / renderedHeight;
  return Math.max(MIN_SCALE_FLOOR, +(calculated.toFixed(3)));
};

/**
 * Renders a section to clean static HTML via real React PrintBaseSection
 */
export const renderSectionHTML = (section) => {
  if (!section) return '';
  return renderToStaticMarkup(
    React.createElement(PrintBaseSection, { section })
  );
};

/**
 * Captures an exact snapshot of the live editor's #area-cv container geometry
 */
export const captureEditorSnapshot = () => {
  if (typeof document === 'undefined') return null;
  const areaCv = document.getElementById('area-cv');
  if (!areaCv) return null;

  const rect = typeof areaCv.getBoundingClientRect === 'function' ? areaCv.getBoundingClientRect() : null;
  const width = Math.round((rect && rect.width) || areaCv.offsetWidth || 0);
  const height = Math.round(areaCv.scrollHeight || areaCv.offsetHeight || 0);

  const pageHeightPx = getRulerHeightPx(document.body);

  const brokenElements = [];
  const brokenNodes = areaCv.querySelectorAll('[data-editor-break-forced="true"]');
  brokenNodes.forEach((node) => {
    const isTitle = node.classList.contains('section-title') || node.hasAttribute('data-section-title');
    const section = node.closest('.cv-section') || node.closest('section');
    const sectionId = section?.getAttribute('data-section-id') || section?.id || node.getAttribute('data-section-title') || null;
    const itemId = node.getAttribute('data-item-id') || (!isTitle ? node.id : null);
    const fold = node.getAttribute('data-editor-break-fold') || '1';
    const pageNum = parseInt(fold, 10) || 1;

    let relativeTop = 0;
    try {
      if (rect && typeof node.getBoundingClientRect === 'function') {
        const nodeRect = node.getBoundingClientRect();
        relativeTop = Math.round(nodeRect.top - rect.top);
      } else {
        relativeTop = node.offsetTop || 0;
      }
    } catch (_) {}

    const editorMargin = parseFloat(node.style.marginTop) || 0;
    const printMargin = editorMargin > 20 ? (editorMargin - 20) : editorMargin;
    const finalMargin = Math.max(24, Math.round(printMargin));

    brokenElements.push({
      sectionId,
      itemId: isTitle ? null : itemId,
      isTitle,
      fold,
      pageNum,
      marginTop: node.style.marginTop || '',
      printMargin: finalMargin,
      relativeTop,
    });
  });

  const totalPagesAttr = areaCv.getAttribute('data-total-pages');
  const parsedAttr = totalPagesAttr ? parseInt(totalPagesAttr, 10) : 0;
  const maxFold = brokenElements.length > 0
    ? Math.max(...brokenElements.map((b) => parseInt(b.fold || b.pageNum, 10) || 1)) + 1
    : 1;
  const totalPages = (parsedAttr && parsedAttr > 0) ? parsedAttr : maxFold;

  return {
    width: width > 0 ? width : 794,
    height,
    pageHeightPx,
    brokenElements,
    totalPages,
  };
};

/**
 * Creates a sanitized memory clone of the live #area-cv element for native printing.
 */
export const createSanitizedPrintClone = (areaCvElement) => {
  if (!areaCvElement) return null;

  // 1. Deep clone in memory
  const clone = areaCvElement.cloneNode(true);

  // 2. DOM UI Scrubber: eliminar controles destructivos y flotantes fuera de flujo
  const nonAddArtifacts = clone.querySelectorAll(`
    .round-btn-del, .section-del-btn, .item-del-btn, .contact-del-btn, .bullet-del-btn, .spacer-del-btn,
    .drag-handle, .section-drag-handle, .item-drag-handle,
    .column-resizer, .column-resizer-bar, .column-resizer-handle,
    .spacer-resize-handle, .spacer-controls-bar,
    .obsidian-callout, .suggestion-tooltip, .rich-toolbar, .floating-rich-toolbar, .rich-text-toolbar,
    .action-menu, .action-menu-btn-wrap, .add-section-modal, .add-section-backdrop, .l-navbar,
    .a4-page-fold-guide, .a4-page-inset, .section-action-buttons
  `);
  nonAddArtifacts.forEach((el) => el.remove());

  // 3. Preservar espaciadores integrados con su altura real y limpiar bordes/manijas
  clone.querySelectorAll('.integrated-bottom-spacer').forEach((spacer) => {
    spacer.classList.remove('no-print');
    spacer.removeAttribute('data-editor-ui');
    spacer.style.border = 'none';
    spacer.style.background = 'transparent';
    spacer.style.boxShadow = 'none';
    spacer.style.outline = 'none';
    spacer.querySelectorAll('.spacer-resize-handle').forEach((h) => h.remove());
  });

  // 4. Eliminar completamente componentes ADD y placeholders de edición interactiva
  const addElements = clone.querySelectorAll(`
    [data-editor-add="true"],
    .column-add-section,
    .add-section-btn,
    .section-add-container,
    .round-btn-add,
    .bullet-add-row,
    .add-bullet-btn,
    .add-contact-btn,
    .print-transparent-spacer,
    [data-print-transparent-spacer="true"]
  `);
  addElements.forEach((el) => el.remove());

  // Purgar cualquier residuo de UI no-aditivo
  clone.querySelectorAll('[data-editor-ui="true"], .no-print')
    .forEach((el) => el.remove());

  const isAtsMode = clone.classList.contains('resume--ats-mode') || Boolean(clone.querySelector?.('.resume--ats-mode'));

  // Sanitize photo edit containers and photo sections
  if (isAtsMode) {
    clone.querySelectorAll('.cv-section-photo, .cv-photo-container, .cv-photo-item-edit, .photo__container').forEach((el) => el.remove());
    // Strip all vector icons in ATS mode to prevent OCR from parsing them as checkboxes (☑)
    clone.querySelectorAll('svg, .lucide, .contact__icon, .social__link svg, .contact-item-pill svg').forEach((el) => el.remove());
  } else {
    clone.querySelectorAll('.cv-photo-item-edit').forEach((photoEdit) => {
      const img = photoEdit.querySelector('img.cv-photo-img');
      const parent = photoEdit.parentElement;
      if (!parent) return;
      if (img && img.src && !img.src.endsWith('/') && img.src !== window?.location?.href) {
        const printWrapper = document.createElement('div');
        printWrapper.className = 'cv-photo-container cv-block';
        printWrapper.style.cssText = 'display:flex;justify-content:center;align-items:center;width:100%;margin:0 auto 0.75rem auto;padding:4px 0;';
        const cleanImg = img.cloneNode(true);
        cleanImg.style.display = 'block';
        printWrapper.appendChild(cleanImg);
        parent.replaceChild(printWrapper, photoEdit);
      } else {
        parent.removeChild(photoEdit);
      }
    });

    // Make vector icons in traditional print inaccessible to OCR/text extraction
    clone.querySelectorAll('svg, .lucide').forEach((svg) => {
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      svg.setAttribute('role', 'presentation');
      svg.style.setProperty('user-select', 'none', 'important');
      svg.style.setProperty('-webkit-user-select', 'none', 'important');
    });
  }

  // Sanitize bullets to prevent irregular leading spaces and private-use glyphs
  clone.querySelectorAll('ul.experience__bullets > li, .experience__bullets li, ul.simple-list-ul > li, .bullet-item-row').forEach((bulletEl) => {
    if (bulletEl.textContent) {
      const cleaned = sanitizeBulletText(bulletEl.textContent);
      if (cleaned !== bulletEl.textContent) {
        const textNodes = [];
        const walk = (node) => {
          if (node.nodeType === 3) textNodes.push(node);
          else node.childNodes.forEach(walk);
        };
        walk(bulletEl);
        if (textNodes.length > 0) {
          textNodes[0].textContent = textNodes[0].textContent.replace(/^[\s\t\u00A0\uF0B7\u25E6\u2043\u2219]+/, '');
        }
      }
    }
  });

  // Text sanitization: fix OCR math delimiters ($...$), acronyms (CI/CD, I+D), and date ranges
  if (typeof document !== 'undefined' && typeof document.createTreeWalker === 'function') {
    try {
      const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT, null, false);
      let textNode;
      while ((textNode = walker.nextNode())) {
        let text = textNode.nodeValue;
        if (!text) continue;
        let modified = sanitizeOcrMathSyntax(text);
        if (/[\u2012\u2013\u2014\u2015]/.test(modified) || /\b(20\d\d|19\d\d|Actualidad|Present|Current|Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)\b/i.test(modified)) {
          modified = normalizeDateRange(modified);
        }
        if (modified !== text) {
          textNode.nodeValue = modified;
        }
      }
    } catch (_) {}
  }

  clone.querySelectorAll('[data-is-empty="true"], .inline-edit-placeholder').forEach((el) => {
    el.remove();
  });

  clone.querySelectorAll('[contenteditable]').forEach((el) => {
    el.removeAttribute('contenteditable');
  });
  clone.querySelectorAll('.inline-edit-active').forEach((el) => {
    el.classList.remove('inline-edit-active');
    el.style.outline = 'none';
  });

  clone.querySelectorAll('ul, ol, li').forEach((el) => {
    el.style.setProperty('list-style', 'none', 'important');
    el.style.setProperty('list-style-type', 'none', 'important');
  });

  const pageBoxes = clone.querySelectorAll('.a4-page-box');
  const hasA4Boxes = pageBoxes.length > 0;

  if (hasA4Boxes) {
    pageBoxes.forEach((box, idx) => {
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
      if (idx < pageBoxes.length - 1) {
        box.style.setProperty('break-after', 'page', 'important');
        box.style.setProperty('page-break-after', 'always', 'important');
      } else {
        box.style.setProperty('break-after', 'auto', 'important');
        box.style.setProperty('page-break-after', 'auto', 'important');
      }
    });

    clone.querySelectorAll('[data-editor-break-forced="true"]').forEach((node) => {
      node.style.setProperty('break-before', 'auto');
      node.style.setProperty('page-break-before', 'auto');
      node.style.removeProperty('padding-top');
      node.style.removeProperty('margin-top');
      node.classList.remove('force-page-break-before', 'break-page-before');
      node.removeAttribute('data-page-break');
      node.removeAttribute('data-page-break-before');
      node.removeAttribute('data-page-break-forced');
      node.removeAttribute('data-editor-break-forced');
      node.removeAttribute('data-editor-break-fold');

      let parent = node.parentElement;
      while (parent && parent !== clone) {
        if (parent.classList.contains('experience__content') ||
            parent.classList.contains('experience__data') ||
            parent.classList.contains('experience__bullets-container') ||
            parent.classList.contains('experience__bullets') ||
            parent.classList.contains('simple-list-container') ||
            parent.classList.contains('simple-list-ul')) {
          parent.style.setProperty('break-inside', 'auto', 'important');
          parent.style.setProperty('page-break-inside', 'auto', 'important');
        }
        parent = parent.parentElement;
      }
    });
  } else {
    // In continuous mode (fallback):
    const is2ColClone = Boolean(
      clone.querySelector('.resume__left') && clone.querySelector('.resume__right')
    );

    if (is2ColClone) {
      clone.querySelectorAll('[data-editor-break-forced="true"]').forEach((node) => {
        node.style.setProperty('break-before', 'auto');
        node.style.setProperty('page-break-before', 'auto');
        node.style.removeProperty('padding-top');
        node.style.removeProperty('margin-top');
        node.classList.remove('force-page-break-before', 'break-page-before');
        node.removeAttribute('data-page-break');
        node.removeAttribute('data-page-break-before');
        node.removeAttribute('data-page-break-forced');
        node.removeAttribute('data-editor-break-forced');
        node.removeAttribute('data-editor-break-fold');

        let parent = node.parentElement;
        while (parent && parent !== clone) {
          if (parent.classList.contains('experience__content') ||
              parent.classList.contains('experience__data') ||
              parent.classList.contains('experience__bullets-container') ||
              parent.classList.contains('experience__bullets') ||
              parent.classList.contains('simple-list-container') ||
              parent.classList.contains('simple-list-ul')) {
            parent.style.setProperty('break-inside', 'auto', 'important');
            parent.style.setProperty('page-break-inside', 'auto', 'important');
          }
          parent = parent.parentElement;
        }
      });
    } else {
      const seenLinearFolds = new Set();
      clone.querySelectorAll('[data-editor-break-forced="true"]').forEach((node) => {
        const foldKey = String(node.getAttribute('data-editor-break-fold') || '1');
        if (seenLinearFolds.has(foldKey)) {
          node.style.setProperty('break-before', 'auto');
          node.style.setProperty('page-break-before', 'auto');
          node.style.removeProperty('padding-top');
          node.style.removeProperty('margin-top');
          node.classList.remove('force-page-break-before', 'break-page-before');
          node.removeAttribute('data-page-break');
          node.removeAttribute('data-page-break-before');
          node.removeAttribute('data-page-break-forced');
          node.removeAttribute('data-editor-break-forced');
          node.removeAttribute('data-editor-break-fold');
        } else {
          seenLinearFolds.add(foldKey);
          node.style.setProperty('break-before', 'page');
          node.style.setProperty('page-break-before', 'always');
          node.style.setProperty('padding-top', 'var(--page-padding, 24px)');
          node.style.setProperty('margin-top', '0px');
          node.classList.add('force-page-break-before', 'break-page-before');
          node.setAttribute('data-page-break', 'before');
          node.setAttribute('data-page-break-before', 'true');
          node.setAttribute('data-page-break-forced', 'true');
        }

        let parent = node.parentElement;
        while (parent && parent !== clone) {
          if (parent.classList.contains('experience__content') ||
              parent.classList.contains('experience__data') ||
              parent.classList.contains('experience__bullets-container') ||
              parent.classList.contains('experience__bullets') ||
              parent.classList.contains('simple-list-container') ||
              parent.classList.contains('simple-list-ul')) {
            parent.style.setProperty('break-inside', 'auto', 'important');
            parent.style.setProperty('page-break-inside', 'auto', 'important');
          }
          parent = parent.parentElement;
        }
      });
    }
  }

  // Defensive scrub: ensure that the first child of each column/container never inherits break-before or extra padding
  const firstNodes = [
    clone.firstElementChild,
    clone.querySelector('.resume__left')?.firstElementChild,
    clone.querySelector('.resume__right')?.firstElementChild,
    clone.querySelector('.resume__single-column')?.firstElementChild,
  ].filter(Boolean);

  firstNodes.forEach((el) => {
    el.classList.remove('break-page-before', 'force-page-break-before');
    el.removeAttribute('data-page-break');
    el.removeAttribute('data-page-break-before');
    el.removeAttribute('data-editor-break-forced');
    el.removeAttribute('data-editor-break-fold');
    el.style.removeProperty('break-before');
    el.style.removeProperty('page-break-before');
    el.style.removeProperty('margin-top');
    el.style.removeProperty('padding-top');
  });

  const ATOMIC_BLOCK_SELECTOR = [
    'h1, h2, h3, h4, h5, h6',
    '.cv-block',
    '.experience__content',
    '.education__content',
    '.experience__data',
    '.education__data',
    '.experience__title',
    '.education__title',
    '.skills__name',
    '.profile__description',
    '.home__data',
    '.simple-list-item',
    'li.cv-block',
    '.contact__item',
    '.section-title',
    'ul.experience__bullets > li',
    '.experience__bullets li',
    'ul.simple-list-ul > li',
    '.bullet-item-row',
    'li.skills__name',
  ].join(', ');

  clone.querySelectorAll(ATOMIC_BLOCK_SELECTOR).forEach((el) => {
    el.style.setProperty('break-inside', 'avoid', 'important');
    el.style.setProperty('page-break-inside', 'avoid', 'important');
    el.style.setProperty('-webkit-column-break-inside', 'avoid', 'important');
  });

  const SPLITTABLE_CONTAINERS = [
    '.experience__bullets-container',
    'ul.experience__bullets',
    'ul.simple-list-ul',
    '.simple-list-container',
    '[data-page-break="before"]',
    '[data-editor-break-forced="true"]',
  ].join(', ');

  clone.querySelectorAll(SPLITTABLE_CONTAINERS).forEach((el) => {
    el.style.setProperty('break-inside', 'auto', 'important');
    el.style.setProperty('page-break-inside', 'auto', 'important');
    let parent = el.parentElement;
    while (parent && parent !== clone) {
      if (parent.classList.contains('experience__content') ||
          parent.classList.contains('experience__data') ||
          parent.classList.contains('cv-block') ||
          parent.classList.contains('editable-item-container') ||
          parent.classList.contains('simple-list-container')) {
        parent.style.setProperty('break-inside', 'auto', 'important');
        parent.style.setProperty('page-break-inside', 'auto', 'important');
      }
      parent = parent.parentElement;
    }
  });

  clone.querySelectorAll('ul.experience__bullets > li, .experience__bullets li, ul.simple-list-ul > li, .bullet-item-row').forEach((bulletEl) => {
    bulletEl.style.setProperty('break-inside', 'avoid', 'important');
    bulletEl.style.setProperty('page-break-inside', 'avoid', 'important');
    bulletEl.style.setProperty('margin-top', '0', 'important');
    bulletEl.style.setProperty('margin-bottom', 'var(--item-gap, 8px)', 'important');
    bulletEl.style.setProperty('line-height', 'var(--line-height, 1.45)', 'important');
    bulletEl.style.setProperty('font-size', 'var(--list-font-size, var(--normal-font-size))', 'important');
    bulletEl.style.setProperty('padding-left', '0', 'important');
  });

  // 6. Clean up container geometry:
  clone.style.removeProperty('box-shadow');
  if (hasA4Boxes || clone.classList.contains('bd-grid')) {
    clone.style.setProperty('width', '100%', 'important');
    clone.style.setProperty('max-width', '100%', 'important');
    clone.style.setProperty('margin', '0', 'important');
    clone.style.setProperty('padding', '0', 'important');
  }

  return clone;
};

/**
 * Generates standalone clean static HTML for printing and PDF rendering.
 */
export const generateCleanPrintHTML = (cvData, lang = 'es', customSnapshot = undefined) => {
  const snapshot = customSnapshot !== undefined ? customSnapshot : (typeof document !== 'undefined' ? captureEditorSnapshot() : null);
  const data = cvData || {};
  const layout = data.layout || {};
  const docLang = lang || layout.language || data.activeLanguage || 'es';
  let rawSections = Array.isArray(data.sections) ? data.sections : [];

  let sections = rawSections;
  if (data.profile) {
    sections = rawSections.map((sec) => {
      if (sec.id === 'profile_header' || sec.type === 'profile_header' || sec.type === 'title_subtitle') {
        const firstItem = (sec.items && sec.items[0]) ? { ...sec.items[0] } : {};
        // Profile and section items are kept in sync by updateProfile/updateSectionItem hooks.
        // Here we merge both so either source can provide a value, with profile taking priority
        // for backward compatibility (test coverage relies on this precedence order).
        const mergedItem = {
          ...firstItem,
          ...(data.profile.name !== undefined ? { name: data.profile.name } : {}),
          ...(data.profile.subtitle !== undefined ? { subtitle: data.profile.subtitle } : {}),
        };
        return { ...sec, items: [mergedItem, ...(sec.items ? sec.items.slice(1) : [])] };
      }
      if (sec.id === 'contact' || sec.type === 'contact') {
        const firstItem = (sec.items && sec.items[0]) ? { ...sec.items[0] } : {};
        const mergedItem = {
          ...firstItem,
          ...(data.profile.location !== undefined ? { location: data.profile.location } : {}),
          ...(data.profile.email !== undefined ? { email: data.profile.email } : {}),
          ...(data.profile.phone !== undefined ? { phone: data.profile.phone } : {}),
          ...(data.profile.linkedin !== undefined ? { linkedin: data.profile.linkedin } : {}),
          ...(data.profile.github !== undefined ? { github: data.profile.github } : {}),
        };
        return { ...sec, items: [mergedItem, ...(sec.items ? sec.items.slice(1) : [])] };
      }
      return sec;
    });
  }


  const isAtsMode = layout.isAtsMode === true;
  if (isAtsMode) {
    sections = sections.filter(s => s.type !== 'photo' && s.id !== 'photo_section');
  }
  const is2Col = layout.type === '2-column' && !layout.isAtsMode;
  const pagePadding = Number(layout.pagePadding ?? 24);
  const sectionGap = Number(layout.sectionGap ?? 20);
  const itemGap = Number(layout.itemGap ?? 8);

  const fontFamily = getFontFamilyStack(layout.fontFamily);
  const fontScale = layout.fontScale || 1.0;
  const titleScale = layout.titleScale || 1.0;
  const bodyScale = layout.bodyScale || 1.0;
  const listScale = layout.listScale || 1.0;
  const lineHeight = layout.lineHeight || 1.45;

  const leftBg = layout.leftBg || '#f3f4f6';
  const rightBg = layout.rightBg || '#ffffff';
  const leftColors = getDynamicTextColors(leftBg);
  const rightColors = getDynamicTextColors(rightBg);

  const getSectionCol = (s) => s.column || getSectionDescriptor(s.type)?.defaultColumn || 'right';
  const leftSectionsCol = is2Col ? sections.filter((s) => getSectionCol(s) === 'left') : [];
  const rightSectionsCol = is2Col ? sections.filter((s) => getSectionCol(s) === 'right') : [];

  const leftColWidth = layout.leftColumnWidth;
  const gridColumns = leftColWidth ? `${leftColWidth}% ${100 - leftColWidth}%` : '1fr 2fr';
  const leftColPercent = leftColWidth || 33.33;

  const areaCvClasses = is2Col
    ? (snapshot ? `resume bd-grid ${isAtsMode ? 'resume--ats-mode' : ''}`.trim() : `resume ${isAtsMode ? 'resume--ats-mode' : ''}`.trim())
    : `resume resume__single-column ${isAtsMode ? 'resume--ats-mode' : ''}`.trim();

  const dynamicSpacingStyle = `
    --body-font: ${fontFamily};
    --font-scale: ${fontScale};
    --title-scale: ${titleScale};
    --body-scale: ${bodyScale};
    --list-scale: ${listScale};
    --line-height: ${lineHeight};
    --page-padding: ${pagePadding}px;
    --section-gap: ${sectionGap}px;
    --item-gap: ${itemGap}px;
  `.replace(/\s+/g, ' ').trim();

  const containerWidth = snapshot?.width ? `${snapshot.width}px` : null;
  const useBleedWidth = Boolean(layout.leftBg && layout.rightBg && !snapshot?.width);
  const twoColWidthStyle = useBleedWidth
    ? 'width: 100%; max-width: 100%; margin: 0; padding: 0;'
    : `width: ${containerWidth || '794px'}; max-width: ${containerWidth || '794px'}; margin: 0 auto; padding: 0;`;

  let bodyContent = '';
  if (is2Col) {
    bodyContent = `
      <div class="${areaCvClasses}" id="area-cv" style="display: grid; grid-template-columns: ${gridColumns}; gap: 0; column-gap: 0; row-gap: 0; ${twoColWidthStyle} min-height: 297mm; box-shadow: none; box-sizing: border-box; color: var(--text-color); background: linear-gradient(to right, ${leftBg} 0%, ${leftBg} ${leftColPercent}%, ${rightBg} ${leftColPercent}%, ${rightBg} 100%); ${dynamicSpacingStyle}">
        <div class="resume__left" style="background: ${leftBg}; min-height: 297mm; align-self: stretch; box-sizing: border-box; padding: var(--page-padding, 24px); color: var(--text-color); --title-color: ${leftColors.titleColor}; --text-color: ${leftColors.textColor}; --text-color-light: ${leftColors.textColorLight}; --circle-color: ${leftColors.circleColor}; --container-color-alt: ${leftColors.containerColorAlt};">
          ${leftSectionsCol.map(renderSectionHTML).join('\n\n')}
        </div>
        <div class="resume__right" style="background: ${rightBg}; min-height: 297mm; align-self: stretch; box-sizing: border-box; padding: var(--page-padding, 24px); color: var(--text-color); --title-color: ${rightColors.titleColor}; --text-color: ${rightColors.textColor}; --text-color-light: ${rightColors.textColorLight}; --circle-color: ${rightColors.circleColor}; --container-color-alt: ${rightColors.containerColorAlt};">
          ${rightSectionsCol.map(renderSectionHTML).join('\n\n')}
        </div>
      </div>
    `;
  } else {
    bodyContent = `
      <div class="${areaCvClasses}" id="area-cv" style="width: ${containerWidth || '794px'}; max-width: ${containerWidth || '794px'}; min-height: 297mm !important; margin: 0 auto; box-sizing: border-box; padding: var(--page-padding, 24px); background: #ffffff; ${dynamicSpacingStyle}">
        ${sections.map(renderSectionHTML).join('\n\n')}
      </div>
    `;
  }

  const dynamicDocumentTitle = getDynamicPdfTitle(data);

  let activeBaseStyles = baseStyles;
  let activePrintStyles = printStyles;

  const editorArtifactsPattern = /(?:section-drag-handle|item-drag-handle|drag-handle|round-btn-del|round-btn-add|suggestion-tooltip|obsidian-callout|column-resizer|l-navbar|action-menu|no-print|add-contact-btn|contact-del-btn|spacer-resize-handle|spacer-controls-bar|spacer-del-btn|section-del-btn|item-del-btn|section-add-container|editable-section-container|editable-item-container|inline-input|inline-edit-active|rich-text-toolbar)/gi;
  activeBaseStyles = activeBaseStyles.replace(editorArtifactsPattern, 'editor-control-stripped');
  activePrintStyles = activePrintStyles.replace(editorArtifactsPattern, 'editor-control-stripped');

  let snapshotBreaksCSS = '';
  if (snapshot?.brokenElements?.length > 0) {
    snapshotBreaksCSS = snapshot.brokenElements.map((b) => {
      const selector = b.isTitle
        ? `[data-section-title="${b.sectionId}"]`
        : (b.itemId ? `[data-item-id="${b.itemId}"]` : `[data-section-id="${b.sectionId}"]`);

      if (is2Col) {
        return `
          ${selector} {
            break-before: auto !important;
            page-break-before: auto !important;
            padding-top: var(--page-padding, 24px) !important;
            margin-top: 0 !important;
          }
        `;
      }

      return `
        ${selector} {
          break-before: page !important;
          page-break-before: always !important;
          padding-top: var(--page-padding, 24px) !important;
          margin-top: 0 !important;
        }
      `;
    }).join('\n');
  }

  if (!is2Col) {
    activeBaseStyles = activeBaseStyles
      .replace(/[^{}]*?\.resume__(?:left|right)[^{]*?\{[^}]*?\}/gi, '')
      .replace(/\.resume__(?:left|right)\b/gi, '.col-inactive');
    activePrintStyles = activePrintStyles
      .replace(/[^{}]*?\.resume__(?:left|right)[^{]*?\{[^}]*?\}/gi, '')
      .replace(/\.resume__(?:left|right)\b/gi, '.col-inactive');
  }

  return `<!DOCTYPE html>
<html lang="${escapeHTML(docLang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(dynamicDocumentTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <style id="cv-base-styles">
    :root,
    #area-cv {
      --page-padding: ${pagePadding}px;
      --section-gap: ${sectionGap}px;
      --item-gap: ${itemGap}px;
      --title-color: #0f172a;
      --text-color: #334155;
      --text-color-light: #64748b;
      --container-color: #ffffff;
      --container-color-alt: #f3f4f6;
      --body-color: #ffffff;
      --first-color: #3874ff;
      --header-height: 3rem;
      --font-medium: 500;
      --font-semi-bold: 600;
      --mb-1: .5rem;
      --mb-2: 1rem;
      --mb-3: 1.5rem;
      --body-font: ${fontFamily && !fontFamily.includes(',') ? `'${fontFamily}', sans-serif` : (fontFamily || "'Poppins', sans-serif")};
      --font-scale: ${fontScale};
      --title-scale: ${titleScale};
      --body-scale: ${bodyScale};
      --list-scale: ${listScale};
      --line-height: ${lineHeight};
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
    }

    .resume__single-column {
      box-sizing: border-box !important;
      padding: var(--page-padding, ${pagePadding}px) !important;
    }

${activeBaseStyles}
  </style>
  <style id="cv-print-styles">
${activePrintStyles}
  </style>
  <style id="cv-snapshot-breaks">
${snapshotBreaksCSS}
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
};
