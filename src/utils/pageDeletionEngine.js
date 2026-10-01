/**
 * pageDeletionEngine.js
 *
 * Provides functionality to delete a page from the DOM and CV state,
 * destroying all DOM elements belonging to that page and reordering the rest.
 */

import { A4_PAGE_HEIGHT_PX, A4_GAP_PX, DEFAULT_PAGE_PADDING } from '../constants';
import { getRulerHeightPx } from './pageGeometry';

/**
 * Resets all forced page-break artifacts previously injected into #area-cv.
 *
 * @param {HTMLElement} areaCv - Root CV document element
 */
export function resetForcedPageBreaks(areaCv) {
  if (!areaCv) return;

  const previouslyBroken = areaCv.querySelectorAll(
    '[data-editor-break-forced="true"]',
  );
  previouslyBroken.forEach((el) => {
    el.style.removeProperty('margin-top');
    el.removeAttribute('data-editor-break-forced');
    el.removeAttribute('data-editor-break-fold');
  });

  const offsetButtons = areaCv.querySelectorAll(
    '.section-action-buttons[style*="top"]',
  );
  offsetButtons.forEach((b) => b.style.removeProperty('top'));

  const offsetHandles = areaCv.querySelectorAll('.drag-handle[style*="top"]');
  offsetHandles.forEach((h) => h.style.removeProperty('top'));

  const splitElements = areaCv.querySelectorAll(
    '.has-split-break, [data-section-split], [data-item-split]',
  );
  splitElements.forEach((el) => {
    el.classList.remove('has-split-break', 'has-split-break--page2-only');
    el.removeAttribute('data-section-split');
    el.removeAttribute('data-item-split');
    el.style.removeProperty('--split-part1-height');
    el.style.removeProperty('--split-part2-top');
  });
}

/**
 * Destroys all elements on the specified page from both the DOM and React CV state,
 * and reorders the remaining elements to fill the space.
 *
 * @param {Object} options
 * @param {HTMLElement} [options.areaCv] - Root #area-cv DOM element
 * @param {Object} options.cvData - Current CV document data
 * @param {Function} options.applyStateWithHistory - State updater preserving undo/redo
 * @param {number} [options.pageNumber] - 1-based page number to delete (defaults to last page)
 * @param {Function} [options.showToast] - Toast notification function
 * @param {Function} [options.triggerPaginationRecalc] - Recalculate pagination callback
 * @returns {{ success: boolean, deletedPage: number, deletedSectionsCount: number, deletedItemsCount: number, message?: string }}
 */
export function deletePageFromDOMAndState({
  areaCv = (typeof document !== 'undefined' ? document.getElementById('area-cv') : null),
  cvData,
  applyStateWithHistory,
  pageNumber,
  showToast,
  triggerPaginationRecalc
}) {
  if (!areaCv || !cvData) {
    showToast?.('No se encontró el contenedor del CV para eliminar la página', 'error', 3000);
    return { success: false, deletedPage: 0, deletedSectionsCount: 0, deletedItemsCount: 0 };
  }

  // 1. Determine current total pages
  const totalPagesAttr = areaCv.getAttribute('data-total-pages');
  const pageBoxes = areaCv.querySelectorAll('.a4-page-box');
  const currentTotalPages = pageBoxes.length > 0
    ? pageBoxes.length
    : (totalPagesAttr ? parseInt(totalPagesAttr, 10) : 1);

  if (currentTotalPages <= 1) {
    showToast?.('El CV tiene solo 1 página. No se puede eliminar la única página.', 'warning', 3500);
    return { success: false, deletedPage: 1, deletedSectionsCount: 0, deletedItemsCount: 0, message: 'single_page' };
  }

  const targetPage = Math.max(1, Math.min(currentTotalPages, pageNumber || currentTotalPages));

  // 2. Measure page geometry
  let pageHeightPx = getRulerHeightPx(areaCv);
  if (!pageHeightPx || pageHeightPx <= 0) pageHeightPx = A4_PAGE_HEIGHT_PX;
  const gapPx = A4_GAP_PX;

  const pageStart = (targetPage - 1) * (pageHeightPx + gapPx);
  const pageEnd = pageStart + pageHeightPx + gapPx;

  const areaRect = areaCv.getBoundingClientRect();

  const sectionsToDelete = new Set();
  const itemsToDelete = new Map(); // sectionId -> Set of itemIds

  let deletedSectionsCount = 0;
  let deletedItemsCount = 0;

  const sections = Array.isArray(cvData.sections) ? cvData.sections : [];

  // Check if target page is in a discrete .a4-page-box
  const targetBox = areaCv.querySelector(`.a4-page-box[data-page-number="${targetPage}"]`);
  if (targetBox) {
    const secElements = targetBox.querySelectorAll('[data-section-id]');
    secElements.forEach((el) => {
      const secId = el.getAttribute('data-section-id');
      if (secId && secId !== 'profile_header') {
        const rawId = secId.replace(/__page\d+$/, '');
        sectionsToDelete.add(rawId);
        deletedSectionsCount++;
      }
    });
    try { targetBox.remove(); } catch (_) {}
  }

  // 3. Inspect sections and items by measuring their DOM positions (fallback / hybrid)
  sections.forEach((sec) => {
    const secEl = areaCv.querySelector(`[data-section-id="${sec.id}"], #${sec.id}`);
    if (!secEl) return;

    const secRect = secEl.getBoundingClientRect();
    const secTop = Math.round(secRect.top - areaRect.top);
    const secBottom = Math.round(secRect.bottom - areaRect.top);
    const secMid = Math.round(secTop + secRect.height / 2);

    const items = Array.isArray(sec.items) ? sec.items : [];

    // Check if section is entirely inside the target page bounds
    const isEntirelyOnPage = (secTop >= pageStart - 5 && secBottom <= pageEnd + 5);
    const isMidOnPageWithFewItems = (secMid >= pageStart && secMid < pageEnd && items.length <= 1);
    const isSpacer = sec.type === 'spacer';

    if ((isEntirelyOnPage || (isMidOnPageWithFewItems && sec.type !== 'profile_header') || (isSpacer && secMid >= pageStart)) && sec.id !== 'profile_header') {
      sectionsToDelete.add(sec.id);
      deletedSectionsCount++;
      // Destroy from DOM immediately
      try { secEl.remove(); } catch (_) {}
      return;
    }

    // Otherwise, check individual items inside the section
    const itemsOnPage = new Set();
    items.forEach((item) => {
      const itemEl = secEl.querySelector(`[data-item-id="${item.id}"]`);
      if (itemEl) {
        const itemRect = itemEl.getBoundingClientRect();
        const itemTop = Math.round(itemRect.top - areaRect.top);
        const itemMid = Math.round(itemTop + itemRect.height / 2);

        if (itemMid >= pageStart && itemMid < pageEnd) {
          itemsOnPage.add(item.id);
          deletedItemsCount++;
          // Destroy item from DOM immediately
          try { itemEl.remove(); } catch (_) {}
        }
      }
    });

    if (itemsOnPage.size > 0) {
      if (itemsOnPage.size === items.length && sec.id !== 'profile_header' && sec.type !== 'profile_header') {
        // All items of this section were on this page -> destroy section entirely
        sectionsToDelete.add(sec.id);
        deletedSectionsCount++;
        try { secEl.remove(); } catch (_) {}
      } else {
        itemsToDelete.set(sec.id, itemsOnPage);
      }
    }
  });

  // 4. Also sweep and destroy any remaining breakable elements situated on targetPage
  const lingeringBreakables = areaCv.querySelectorAll('.cv-block, .cv-section, .spacer-section, .integrated-bottom-spacer');
  lingeringBreakables.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const top = Math.round(rect.top - areaRect.top);
    const mid = Math.round(top + rect.height / 2);
    if (mid >= pageStart && mid < pageEnd) {
      try { el.remove(); } catch (_) {}
    }
  });

  // 5. Reset forced breaks on remaining DOM elements so they reorder and flow upward
  resetForcedPageBreaks(areaCv);

  // 6. Build new CV state with removed sections and items
  const newSections = sections
    .filter((sec) => !sectionsToDelete.has(sec.id))
    .map((sec) => {
      const itemsToRemove = itemsToDelete.get(sec.id);
      let updatedItems = sec.items || [];
      if (itemsToRemove && itemsToRemove.size > 0) {
        updatedItems = updatedItems.filter((i) => !itemsToRemove.has(i.id));
      }
      return {
        ...sec,
        pageBreak: undefined,
        breakBefore: false,
        isForcedBreak: false,
        items: updatedItems.map((it) => ({
          ...it,
          pageBreak: undefined,
          breakBefore: false,
          isForcedBreak: false,
        })),
      };
    });

  // 7. Apply to state preserving undo/redo history
  if (typeof applyStateWithHistory === 'function') {
    applyStateWithHistory((prev) => ({
      ...prev,
      sections: newSections,
    }));
  }

  // 8. Trigger real-time live resize event and pagination recalculation
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cv-spacer-live-resize'));
  }
  if (typeof triggerPaginationRecalc === 'function') {
    triggerPaginationRecalc();
  }

  showToast?.(
    `Página ${targetPage} eliminada del DOM y contenido reordenado.`,
    'success',
    3500
  );

  return {
    success: true,
    deletedPage: targetPage,
    deletedSectionsCount,
    deletedItemsCount,
  };
}

export default deletePageFromDOMAndState;
