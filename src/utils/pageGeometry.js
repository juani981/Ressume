/**
 * pageGeometry.js
 *
 * Pure mathematical and DOM geometry utilities for A4 document simulation,
 * 297mm ruler measurement, relative bounding boxes, and forbidden boundary zone auditing.
 */

/**
 * =========================================================================
 * LOW-LEVEL TUNING CONFIGURATION: EDITOR VS PRINT PAGE GEOMETRY
 * =========================================================================
 *
 * PRINT GEOMETRY (Standard ISO 216 A4 - 210mm x 297mm):
 * - The authoritative standard for browser @page and PDF rendering.
 * - Invariant: width = 210mm (794px), height = 297mm (1123px).
 *
 * EDITOR GEOMETRY (Vertical Safety Shrunk Container):
 * - To prevent screen-to-print rasterization discrepancies, line wrap differences,
 *   and accidental overflow of trailing elements into unwanted extra pages in PDF,
 *   the live editor container is slightly shrunk vertically compared to print.
 *
 * HOW TO TWEAK AT LOW LEVEL:
 * 1. To change the vertical height of the editor, simply adjust:
 *      EDITOR_HEIGHT_REDUCTION_MM: number (in millimeters, e.g. 15, 12, 0)
 *    - Setting to 0: Gives exact 1:1 mathematical height parity (297mm / 1123px).
 *    - Setting to 15 (default): Gives a safe ~5% buffer (282mm / 1066px).
 *    - Setting to 20: Gives an aggressive safety buffer (277mm / 1047px).
 *
 * All related editor constants (EDITOR_PAGE_HEIGHT_MM, EDITOR_PAGE_HEIGHT_PX,
 * EDITOR_PAGE_HEIGHT_CSS, ruler calculations, guide markers, and CSS variables)
 * are derived automatically and deterministically from this single source of truth.
 */

// ---------------------------------------------------------------------------
// 1. STANDARD ISO 216 A4 PRINT CONSTANTS (Strictly 210mm x 297mm)
// ---------------------------------------------------------------------------
export const A4_PRINT_WIDTH_MM = 210;
export const A4_PRINT_HEIGHT_MM = 297;
export const A4_PRINT_WIDTH_CSS = '210mm';
export const A4_PRINT_HEIGHT_CSS = '297mm';

export const A4_PRINT_EXACT_WIDTH_PX = (210 * 96) / 25.4; // 793.7007874015748
export const A4_PRINT_EXACT_HEIGHT_PX = (297 * 96) / 25.4; // 1122.51968503937

export const A4_PRINT_WIDTH_PX = 794;
export const A4_PRINT_PAGE_HEIGHT_PX = 1123;

// Backward-compatible standard A4 aliases (Print standard)
export const A4_WIDTH_MM = A4_PRINT_WIDTH_MM;
export const A4_HEIGHT_MM = A4_PRINT_HEIGHT_MM;
export const A4_WIDTH_CSS = A4_PRINT_WIDTH_CSS;
export const A4_HEIGHT_CSS = A4_PRINT_HEIGHT_CSS;

export const A4_EXACT_WIDTH_PX = A4_PRINT_EXACT_WIDTH_PX;
export const A4_EXACT_HEIGHT_PX = A4_PRINT_EXACT_HEIGHT_PX;

export const A4_WIDTH_PX = A4_PRINT_WIDTH_PX;
export const A4_PAGE_HEIGHT_PX = A4_PRINT_PAGE_HEIGHT_PX;
export const A4_GAP_PX = 20;
export const DEFAULT_PAGE_PADDING = 24;
export const A4_DOCUMENT_SCALE = 1.0;

// ---------------------------------------------------------------------------
// 2. LIVE EDITOR VERTICAL TUNING KNOB (Low-Level Configurable)
// ---------------------------------------------------------------------------
/**
 * Height reduction in millimeters for the Live Editor container.
 * Change this single value to tune the editor's vertical page capacity.
 */
export const EDITOR_HEIGHT_REDUCTION_MM = 25;

export const EDITOR_PAGE_WIDTH_MM = A4_PRINT_WIDTH_MM;
export const EDITOR_PAGE_HEIGHT_MM = A4_PRINT_HEIGHT_MM - EDITOR_HEIGHT_REDUCTION_MM; // 272mm
export const EDITOR_PAGE_WIDTH_CSS = `${EDITOR_PAGE_WIDTH_MM}mm`;
export const EDITOR_PAGE_HEIGHT_CSS = `${EDITOR_PAGE_HEIGHT_MM}mm`;
export const EDITOR_PAGE_WIDTH_PX = A4_PRINT_WIDTH_PX; // 794px
export const EDITOR_PAGE_HEIGHT_PX = Math.round((EDITOR_PAGE_HEIGHT_MM * 96) / 25.4); // 1028px
export const EDITOR_EXACT_HEIGHT_PX = (EDITOR_PAGE_HEIGHT_MM * 96) / 25.4; // 1028.09448px

/**
 * Print Canonical Page Specification Object.
 */
export const PRINT_PAGE_SIZE = Object.freeze({
  widthMm: A4_PRINT_WIDTH_MM,
  heightMm: A4_PRINT_HEIGHT_MM,
  widthCss: A4_PRINT_WIDTH_CSS,
  heightCss: A4_PRINT_HEIGHT_CSS,
  exactWidthPx: A4_PRINT_EXACT_WIDTH_PX,
  exactHeightPx: A4_PRINT_EXACT_HEIGHT_PX,
  widthPx: A4_PRINT_WIDTH_PX,
  heightPx: A4_PRINT_PAGE_HEIGHT_PX,
  gapPx: A4_GAP_PX,
  paddingPx: DEFAULT_PAGE_PADDING,
  scale: A4_DOCUMENT_SCALE,
  cssVariables: Object.freeze({
    '--a4-page-width': A4_PRINT_WIDTH_CSS,
    '--a4-page-height': A4_PRINT_HEIGHT_CSS,
    '--a4-page-width-px': `${A4_PRINT_WIDTH_PX}px`,
    '--a4-page-height-px': `${A4_PRINT_PAGE_HEIGHT_PX}px`,
    '--a4-page-gap': `${A4_GAP_PX}px`,
    '--a4-page-scale': `${A4_DOCUMENT_SCALE}`,
  }),
});

/**
 * Editor Tuned Page Specification Object.
 */
export const EDITOR_PAGE_SIZE = Object.freeze({
  widthMm: EDITOR_PAGE_WIDTH_MM,
  heightMm: EDITOR_PAGE_HEIGHT_MM,
  widthCss: EDITOR_PAGE_WIDTH_CSS,
  heightCss: EDITOR_PAGE_HEIGHT_CSS,
  exactWidthPx: A4_PRINT_EXACT_WIDTH_PX,
  exactHeightPx: EDITOR_EXACT_HEIGHT_PX,
  widthPx: EDITOR_PAGE_WIDTH_PX,
  heightPx: EDITOR_PAGE_HEIGHT_PX,
  gapPx: A4_GAP_PX,
  paddingPx: DEFAULT_PAGE_PADDING,
  scale: A4_DOCUMENT_SCALE,
  heightReductionMm: EDITOR_HEIGHT_REDUCTION_MM,
  cssVariables: Object.freeze({
    '--editor-page-width': EDITOR_PAGE_WIDTH_CSS,
    '--editor-page-height': EDITOR_PAGE_HEIGHT_CSS,
    '--editor-page-width-px': `${EDITOR_PAGE_WIDTH_PX}px`,
    '--editor-page-height-px': `${EDITOR_PAGE_HEIGHT_PX}px`,
    '--editor-height-reduction-mm': `${EDITOR_HEIGHT_REDUCTION_MM}mm`,
    '--a4-page-width': A4_PRINT_WIDTH_CSS,
    '--a4-page-height': A4_PRINT_HEIGHT_CSS,
    '--a4-page-width-px': `${A4_PRINT_WIDTH_PX}px`,
    '--a4-page-height-px': `${A4_PRINT_PAGE_HEIGHT_PX}px`,
    '--a4-page-gap': `${A4_GAP_PX}px`,
    '--a4-page-scale': `${A4_DOCUMENT_SCALE}`,
  }),
});

// A4_PAGE_SIZE is kept as alias of PRINT_PAGE_SIZE for backwards compatibility
export const A4_PAGE_SIZE = PRINT_PAGE_SIZE;

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
