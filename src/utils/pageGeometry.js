/**
 * pageGeometry.js
 *
 * Pure mathematical and DOM geometry utilities for A4 document simulation,
 * 297mm ruler measurement, relative bounding boxes, and forbidden boundary zone auditing.
 */

export const A4_PAGE_HEIGHT_PX = 1123;
export const A4_WIDTH_PX = 794;
export const A4_GAP_PX = 20;
export const DEFAULT_PAGE_PADDING = 24;

/**
 * Measures the physical height of 297mm in pixels in the current browser rendering context.
 * In a standard 96 DPI environment, this evaluates to 1122.519px -> 1123px.
 * Falls back to 1123 if running in JSDOM, SSR, or when the measurement returns <= 0.
 *
 * @param {HTMLElement} [containerEl=document.body] - Optional DOM container to attach ruler to
 * @returns {number} Measured height in pixels
 */
export function getRulerHeightPx(containerEl) {
  let pageHeightPx = A4_PAGE_HEIGHT_PX;
  if (typeof document !== 'undefined') {
    try {
      const ruler = document.createElement('div');
      ruler.style.height = '297mm';
      ruler.style.position = 'absolute';
      ruler.style.visibility = 'hidden';
      ruler.style.top = '-9999px';
      const target = containerEl || document.body;
      if (target && typeof target.appendChild === 'function') {
        target.appendChild(ruler);
        if (ruler.offsetHeight > 0) {
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
