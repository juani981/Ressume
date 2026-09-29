/**
 * pageGeometry.js
 *
 * Pure mathematical and DOM geometry utilities for A4 document simulation,
 * 297mm ruler measurement, relative bounding boxes, and forbidden boundary zone auditing.
 *
 * Canonical dimensions and specifications are re-exported from src/constants/ SSOT.
 */

// ---------------------------------------------------------------------------
// 1. RE-EXPORTS FROM CANONICAL SSOT (src/constants/) FOR BACKWARD COMPATIBILITY
// ---------------------------------------------------------------------------
export {
  A4_PRINT_WIDTH_MM,
  A4_PRINT_HEIGHT_MM,
  A4_PRINT_WIDTH_CSS,
  A4_PRINT_HEIGHT_CSS,
  A4_PRINT_EXACT_WIDTH_PX,
  A4_PRINT_EXACT_HEIGHT_PX,
  A4_PRINT_WIDTH_PX,
  A4_PRINT_PAGE_HEIGHT_PX,
  A4_WIDTH_MM,
  A4_HEIGHT_MM,
  A4_WIDTH_CSS,
  A4_HEIGHT_CSS,
  A4_EXACT_WIDTH_PX,
  A4_EXACT_HEIGHT_PX,
  A4_WIDTH_PX,
  A4_PAGE_HEIGHT_PX,
  A4_GAP_PX,
  A4_DOCUMENT_SCALE,
  EDITOR_HEIGHT_REDUCTION_MM,
  EDITOR_PAGE_WIDTH_MM,
  EDITOR_PAGE_HEIGHT_MM,
  EDITOR_PAGE_WIDTH_CSS,
  EDITOR_PAGE_HEIGHT_CSS,
  EDITOR_PAGE_WIDTH_PX,
  EDITOR_PAGE_HEIGHT_PX,
  EDITOR_EXACT_HEIGHT_PX,
  PRINT_PAGE_SIZE,
  EDITOR_PAGE_SIZE,
  A4_PAGE_SIZE,
  A4_GEOMETRY,
} from '../constants/geometry.js';

export {
  DEFAULT_PAGE_PADDING,
  DEFAULT_PAGE_PADDING_PX,
  DEFAULT_SECTION_GAP,
  DEFAULT_SECTION_GAP_PX,
  DEFAULT_ITEM_GAP,
  DEFAULT_ITEM_GAP_PX,
  DEFAULT_LINE_HEIGHT,
  SPACING_TOKENS,
} from '../constants/spacing.js';

import {
  A4_PRINT_HEIGHT_CSS,
  A4_PRINT_PAGE_HEIGHT_PX,
  A4_PAGE_HEIGHT_PX,
  A4_GAP_PX,
  EDITOR_PAGE_HEIGHT_CSS,
  EDITOR_PAGE_HEIGHT_PX,
  PRINT_PAGE_SIZE,
  EDITOR_PAGE_SIZE,
} from '../constants/geometry.js';

import { DEFAULT_PAGE_PADDING } from '../constants/spacing.js';

// ---------------------------------------------------------------------------
// 2. RUNTIME GEOMETRY GETTERS
// ---------------------------------------------------------------------------

/**
 * Returns the unified canonical dimensions of the editor page.
 * @returns {typeof EDITOR_PAGE_SIZE}
 */
export function getEditorPageDimensions() {
  return EDITOR_PAGE_SIZE;
}

/**
 * Returns the unified canonical dimensions of the print page.
 * @returns {typeof PRINT_PAGE_SIZE}
 */
export function getPrintPageDimensions() {
  return PRINT_PAGE_SIZE;
}

/**
 * Measures the physical height in pixels in the current browser rendering context.
 *
 * @param {HTMLElement} [containerEl=document.body] - Optional DOM container to attach ruler to
 * @param {boolean} [forEditor=true] - If true, measures the editor page height; if false, standard A4 print height
 * @returns {number} Measured height in pixels
 */
export function getRulerHeightPx(containerEl, forEditor = true) {
  const targetCss = forEditor ? EDITOR_PAGE_HEIGHT_CSS : A4_PRINT_HEIGHT_CSS;
  let pageHeightPx = forEditor ? EDITOR_PAGE_HEIGHT_PX : A4_PRINT_PAGE_HEIGHT_PX;
  if (typeof document !== 'undefined') {
    try {
      const ruler = document.createElement('div');
      ruler.style.height = targetCss;
      ruler.style.position = 'absolute';
      ruler.style.visibility = 'hidden';
      ruler.style.top = '-9999px';
      const target = containerEl || document.body;
      if (target && typeof target.appendChild === 'function') {
        target.appendChild(ruler);
        const rect = ruler.getBoundingClientRect ? ruler.getBoundingClientRect() : null;
        if (rect && rect.height > 0) {
          pageHeightPx = rect.height;
        } else if (ruler.offsetHeight > 0) {
          pageHeightPx = ruler.offsetHeight;
        }
        ruler.remove();
      }
    } catch (_) {
      // Safe fallback to constant
    }
  }
  return pageHeightPx;
}

/**
 * Computes element bounding coordinates relative to a parent container (typically #area-cv).
 * Uses getBoundingClientRect() when available, with a resilient fallback to offsetTop/offsetHeight.
 *
 * @param {HTMLElement} el - Element to measure
 * @param {HTMLElement} [parentEl] - Parent container context (default: el.offsetParent or document.body)
 * @returns {{ top: number, bottom: number, left: number, width: number, height: number }}
 */
export function getRelativeBounds(el, parentEl) {
  if (!el) {
    return { top: 0, bottom: 0, left: 0, width: 0, height: 0 };
  }

  if (
    typeof el.getBoundingClientRect === 'function' &&
    parentEl &&
    typeof parentEl.getBoundingClientRect === 'function'
  ) {
    const elRect = el.getBoundingClientRect();
    const parentRect = parentEl.getBoundingClientRect();
    const top = elRect.top - parentRect.top;
    const left = elRect.left - parentRect.left;
    const width = elRect.width || el.offsetWidth || 0;
    const height = elRect.height || el.offsetHeight || 0;
    return {
      top,
      bottom: top + height,
      left,
      width,
      height,
    };
  }

  const top = el.offsetTop || 0;
  const left = el.offsetLeft || 0;
  const width = el.offsetWidth || 0;
  const height = el.offsetHeight || 0;
  return {
    top,
    bottom: top + height,
    left,
    width,
    height,
  };
}

/**
 * Calculates the geometry of a page fold and its associated forbidden boundary zone for page pageNum.
 *
 * @param {number} pageNum - 1-based page split index (fold after page 1, 2, etc.)
 * @param {number} [pageHeightPx=1123]
 * @param {number} [pagePaddingPx=24]
 * @param {number} [gapPx=20]
 * @returns {{ foldTop: number, foldBottom: number, forbiddenStart: number, forbiddenEnd: number, contentAreaBottom: number, nextContentAreaTop: number }}
 */
export function getForbiddenZone(
  pageNum,
  pageHeightPx = A4_PAGE_HEIGHT_PX,
  pagePaddingPx = DEFAULT_PAGE_PADDING,
  gapPx = A4_GAP_PX
) {
  const foldTop = pageNum * pageHeightPx + (pageNum - 1) * gapPx;
  const foldBottom = foldTop + gapPx;
  const forbiddenStart = foldTop - pagePaddingPx;
  const forbiddenEnd = foldBottom + pagePaddingPx;
  const contentAreaBottom = forbiddenStart;
  const nextContentAreaTop = forbiddenEnd;

  return {
    foldTop,
    foldBottom,
    forbiddenStart,
    forbiddenEnd,
    contentAreaBottom,
    nextContentAreaTop,
  };
}

/**
 * Checks whether an element with vertical bounds [top, bottom] intersects any forbidden boundary zone
 * across simulated pages up to maxPages.
 *
 * An element invades the forbidden zone if it intersects:
 * [foldTop - pagePadding .. foldBottom + pagePadding]
 *
 * @param {number} top - Top coordinate relative to container
 * @param {number} bottom - Bottom coordinate relative to container
 * @param {number} [pageHeight=1123]
 * @param {number} [pagePadding=24]
 * @param {number} [gapPx=20]
 * @param {number} [maxPages=10] - Number of pages to check
 * @returns {boolean} True if the element overlaps any forbidden zone
 */
export function isInForbiddenBoundaryZone(
  top,
  bottom,
  pageHeight = A4_PAGE_HEIGHT_PX,
  pagePadding = DEFAULT_PAGE_PADDING,
  gapPx = A4_GAP_PX,
  maxPages = 10
) {
  if (bottom <= top) return false;

  for (let p = 1; p < maxPages; p++) {
    const { forbiddenStart, forbiddenEnd } = getForbiddenZone(p, pageHeight, pagePadding, gapPx);
    if (top < forbiddenEnd && bottom > forbiddenStart) {
      return true;
    }
  }
  return false;
}
