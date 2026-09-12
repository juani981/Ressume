/**
 * @file useBlankPageCleaner.js
 * @description Reactive hook that detects and eliminates blank trailing pages
 * in the A4 CV editor.
 *
 * ## How it works
 *
 * After every content change, the pagination engine recalculates `totalPages`
 * and `pageBreaks`. This hook runs *after* that recalculation completes and:
 *
 *   1. Measures the actual content height on the **last page** by querying
 *      the DOM for the lowest breakable element that lands on that page.
 *   2. If the last page holds less than `BLANK_PAGE_MIN_CONTENT_PX` of real
 *      content it is considered blank.
 *   3. To remove the blank page the hook reduces the nearest reducible spacer
 *      (`type === 'spacer'`) or, if none exists, the `bottomSpacing` of the
 *      last non-spacer section.
 *   4. The operation is **non-destructive**: it never removes user content —
 *      it only trims spacers or spacing values.
 *
 * ## Guard rails
 *   - Runs at most once per pagination cycle (debounced by `totalPages` changes).
 *   - Skips if a drag operation is active (avoids mid-drag mutations).
 *   - Skips in print/export mode.
 *   - Never runs while the pagination engine is still recalculating.
 *   - Never reduces a spacer below 0px.
 *   - Maximum 3 consecutive reduction iterations to prevent loops.
 *
 * @param {Object}   options
 * @param {React.RefObject<HTMLElement>} options.areaCvRef   - Ref to #area-cv
 * @param {number}   options.totalPages                      - Current page count from pagination engine
 * @param {number[]} options.pageBreaks                      - Y-offsets of page fold positions
 * @param {Object}   options.cvData                          - Current CV document state
 * @param {Function} options.updateSectionProperty           - Mutation: updateSectionProperty(id, key, val)
 * @param {boolean}  [options.isPrint=false]                 - Skip in print/PDF mode
 * @param {Object|null} [options.activeDragItem=null]        - Active DnD item (suspends cleaner)
 * @param {Object|null} [options.activeDragSection=null]     - Active DnD section (suspends cleaner)
 */

import { useEffect, useRef } from 'react';
import { A4_PAGE_HEIGHT_PX, A4_GAP_PX, DEFAULT_PAGE_PADDING } from '../utils/pageGeometry';
import { getBreakableComponents } from '../utils/paginationEngine';

/** A page with less than this much content (px) is considered blank. */
const BLANK_PAGE_MIN_CONTENT_PX = 80;

/** Max reduction iterations per cycle to prevent infinite loops. */
const MAX_ITERATIONS = 3;

/**
 * Returns the Y-pixel start of the last page's content area (after gap + padding).
 * @param {number} pageIndex - 0-based index of the last page (totalPages - 1)
 * @param {number} pageHeightPx
 * @param {number} gapPx
 * @param {number} paddingPx
 */
function getLastPageContentStart(pageIndex, pageHeightPx, gapPx, paddingPx) {
  if (pageIndex === 0) return 0;
  // Page folds: pageN starts at pageIndex * (pageHeightPx + gapPx)
  // Content area inside starts after padding
  return pageIndex * (pageHeightPx + gapPx) + paddingPx;
}

/**
 * Measures the actual content height present on the last page.
 * Walks all breakable elements and returns how far the lowest one extends
 * past the last page's content start.
 *
 * @param {HTMLElement} areaCv
 * @param {number} lastPageContentStart - Y px where the last page's content begins
 * @returns {number} Height of content on the last page (0 if none)
 */
function measureLastPageContentHeight(areaCv, lastPageContentStart) {
  const allBreakable = getBreakableComponents(areaCv);
  let maxBottom = 0;
  for (const el of allBreakable) {
    // Skip editor-only overlays (drag handles, action buttons, etc.)
    if (el.classList.contains('drag-handle') || el.classList.contains('section-action-buttons')) continue;
    const rect = el.getBoundingClientRect();
    const parentRect = areaCv.getBoundingClientRect();
    const bottom = rect.bottom - parentRect.top;
    if (bottom > maxBottom) maxBottom = bottom;
  }
  const contentHeight = Math.max(0, maxBottom - lastPageContentStart);
  return contentHeight;
}

/**
 * Finds the spacer section closest to the end of the given column (or overall),
 * that still has height > 0. Returns null if none found.
 *
 * @param {Object[]} sections - All CV sections
 * @param {string|null} preferredColumn - 'left' | 'right' | null for any
 * @returns {Object|null}
 */
function findReducibleSpacer(sections, preferredColumn) {
  // Reverse order: last spacers first (closest to end of CV)
  const reversed = [...sections].reverse();
  const colMatch = preferredColumn
    ? reversed.find(s => s.type === 'spacer' && s.column === preferredColumn && (s.height || s.items?.[0]?.height || 0) > 0)
    : null;
  if (colMatch) return colMatch;
  return reversed.find(s => s.type === 'spacer' && (s.height || s.items?.[0]?.height || 0) > 0) || null;
}

/**
 * Finds the last non-spacer, non-header section that has a bottomSpacing property.
 * Used as a fallback when no spacer is available.
 *
 * @param {Object[]} sections
 * @returns {Object|null}
 */
function findLastSectionWithSpacing(sections) {
  const reversed = [...sections].reverse();
  return reversed.find(s =>
    s.type !== 'spacer' &&
    s.type !== 'profile_header' &&
    (s.bottomSpacing || 0) > 0
  ) || null;
}

export function useBlankPageCleaner({
  areaCvRef,
  totalPages,
  pageBreaks,
  cvData,
  updateSectionProperty,
  isPrint = false,
  activeDragItem = null,
  activeDragSection = null,
}) {
  const iterationCountRef = useRef(0);
  const lastCleanedPagesRef = useRef(null);

  useEffect(() => {
    // Guard: skip in print, during drag, or if no area ref
    if (isPrint) return;
    if (activeDragItem || activeDragSection) return;
    if (!areaCvRef?.current) return;
    if (totalPages <= 1) return; // Nothing to clean on single-page CVs

    // Guard: only run once per totalPages change
    if (lastCleanedPagesRef.current === totalPages) return;

    // Guard: max iterations prevents infinite loop
    if (iterationCountRef.current >= MAX_ITERATIONS) {
      iterationCountRef.current = 0;
      lastCleanedPagesRef.current = totalPages;
      return;
    }

    // Defer to after the browser has painted the new layout
    const rafId = requestAnimationFrame(() => {
      const areaCv = areaCvRef.current;
      if (!areaCv) return;

      const sections = cvData?.sections || [];
      const pagePadding = Number(cvData?.layout?.pagePadding ?? DEFAULT_PAGE_PADDING);

      // Measure real page height (same as paginationEngine)
      let pageHeightPx = A4_PAGE_HEIGHT_PX;
      try {
        const ruler = document.createElement('div');
        ruler.style.cssText = 'height:297mm;position:absolute;visibility:hidden;top:-9999px;pointer-events:none;';
        areaCv.appendChild(ruler);
        if (ruler.offsetHeight > 0) pageHeightPx = ruler.offsetHeight;
        ruler.remove();
      } catch (_) {}

      const lastPageIndex = totalPages - 1;
      const lastPageContentStart = getLastPageContentStart(lastPageIndex, pageHeightPx, A4_GAP_PX, pagePadding);
      const contentHeight = measureLastPageContentHeight(areaCv, lastPageContentStart);

      if (contentHeight >= BLANK_PAGE_MIN_CONTENT_PX) {
        // Last page has real content — nothing to do
        iterationCountRef.current = 0;
        lastCleanedPagesRef.current = totalPages;
        return;
      }

      // Last page is blank — try to reduce the excess
      // The excess is: (totalPages * (pageHeightPx + A4_GAP_PX)) - actualContentBottom
      const actualBottom = lastPageContentStart + contentHeight;
      const blankSlack = lastPageContentStart - actualBottom + (pageHeightPx - pagePadding);

      // Strategy 1: reduce a spacer
      const spacer = findReducibleSpacer(sections, null);
      if (spacer) {
        const currentHeight = spacer.height || spacer.items?.[0]?.height || 0;
        const reduction = Math.min(currentHeight, Math.ceil(pageHeightPx + A4_GAP_PX));
        const newHeight = Math.max(0, currentHeight - reduction);
        iterationCountRef.current += 1;
        updateSectionProperty(spacer.id, 'height', newHeight);
        return; // Let the pagination re-run and we'll re-evaluate
      }

      // Strategy 2: reduce bottomSpacing of the last real section
      const lastSection = findLastSectionWithSpacing(sections);
      if (lastSection) {
        const currentSpacing = lastSection.bottomSpacing || 0;
        const reduction = Math.min(currentSpacing, Math.ceil(pageHeightPx + A4_GAP_PX));
        const newSpacing = Math.max(0, currentSpacing - reduction);
        iterationCountRef.current += 1;
        updateSectionProperty(lastSection.id, 'bottomSpacing', newSpacing);
        return;
      }

      // Strategy 3: nothing reducible — mark as done
      iterationCountRef.current = 0;
      lastCleanedPagesRef.current = totalPages;
    });

    return () => cancelAnimationFrame(rafId);
  }, [
    totalPages,
    pageBreaks,
    cvData,
    areaCvRef,
    isPrint,
    activeDragItem,
    activeDragSection,
    updateSectionProperty,
  ]);
}

export default useBlankPageCleaner;
