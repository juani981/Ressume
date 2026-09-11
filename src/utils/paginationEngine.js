/**
 * paginationEngine.js
 *
 * Core pure pagination algorithms, breakable component selection,
 * multi-pass page-break calculation, and forbidden boundary zone auditing.
 */

import {
  A4_PAGE_HEIGHT_PX,
  A4_GAP_PX,
  DEFAULT_PAGE_PADDING,
  getRulerHeightPx,
  getRelativeBounds,
  getForbiddenZone,
  isInForbiddenBoundaryZone,
} from './pageGeometry';

export { isInForbiddenBoundaryZone };

export const BREAKABLE_SELECTOR =
  '.section-title, .cv-block, .experience__content, .education__content, .skills__name, .profile__description, .home__data, .simple-list-item, li.cv-block, .contact__item, .editable-item-container';

/**
 * Traverses a container DOM element and selects top-level breakable components.
 * Filters out nested children whose parent is already an eligible breakable container
 * (with the exception of .section-title, which remains breakable independently).
 *
 * @param {HTMLElement} containerEl
 * @returns {HTMLElement[]} Array of breakable DOM elements
 */
export function getBreakableComponents(containerEl) {
  if (!containerEl) return [];
  const rawList = Array.from(containerEl.querySelectorAll(BREAKABLE_SELECTOR));
  return rawList.filter((item, idx, arr) => {
    if (item.classList.contains('section-title')) return true;
    const hasParentInList = arr.some(
      (other) =>
        other !== item &&
        other.contains(item) &&
        !other.classList.contains('section-title'),
    );
    return !hasParentInList;
  });
}

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
}

/**
 * Audits the CV DOM tree to guarantee zero elements violate the forbidden boundary zones
 * across simulated pages. In test environments, throws FatalForbiddenZoneIncursionError
 * to prevent regressions.
 *
 * @param {HTMLElement} areaCv
 * @param {number} totalPages
 * @param {number} [pageHeightPx]
 * @param {number} [pagePadding]
 * @param {number} [gapPx=20]
 */
export function auditForbiddenBoundaryZones(
  areaCv,
  totalPages,
  pageHeightPx = A4_PAGE_HEIGHT_PX,
  pagePadding = DEFAULT_PAGE_PADDING,
  gapPx = A4_GAP_PX,
) {
  if (!areaCv || totalPages <= 1) return;

  for (let p = 1; p < totalPages; p++) {
    const { forbiddenStart, forbiddenEnd } = getForbiddenZone(
      p,
      pageHeightPx,
      pagePadding,
      gapPx,
    );

    const candidates = areaCv.querySelectorAll(BREAKABLE_SELECTOR);

    for (const cand of candidates) {
      const b = getRelativeBounds(cand, areaCv);
      if (b.height <= 0) continue;

      const isBreaching =
        (b.top < forbiddenEnd && b.bottom > forbiddenStart) ||
        isInForbiddenBoundaryZone(b.top, b.bottom, pageHeightPx, pagePadding, gapPx, p + 1);

      if (isBreaching && b.top < forbiddenEnd && b.bottom > forbiddenStart) {
        const errorMsg =
          `FATAL_FORBIDDEN_ZONE_INCURSION: Element [${cand.tagName.toLowerCase()} id="${cand.id || cand.getAttribute('data-item-id') || cand.getAttribute('data-section-title') || ''}"] ` +
          `bounds [top=${b.top.toFixed(1)}, bottom=${b.bottom.toFixed(1)}] invaded forbidden zone [${forbiddenStart} .. ${forbiddenEnd}] at Page ${p}.`;

        console.error(errorMsg);

        if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
          const err = new Error(errorMsg);
          err.name = 'FatalForbiddenZoneIncursionError';
          throw err;
        }
      }
    }
  }
}

/**
 * Executes multi-pass calculation to push overflowing elements past page fold boundaries.
 * Enforces orphan title avoidance and strict boundary zones.
 *
 * @param {Object} options
 * @param {HTMLElement} options.areaCv - The #area-cv DOM element
 * @param {Object} options.cvData - Current CV data model containing layout settings
 * @param {number} [options.pageHeightPx] - Measured A4 297mm height in pixels
 * @param {number} [options.gapPx=20] - Visual fold gap in editor
 * @returns {{ totalPages: number, pageBreaks: number[] }}
 */
export function executePaginationAlgorithm({
  areaCv,
  cvData,
  pageHeightPx: customPageHeight,
  gapPx = A4_GAP_PX,
}) {
  if (!areaCv) {
    return { totalPages: 1, pageBreaks: [] };
  }

  // 1. Reset previous breaks
  resetForcedPageBreaks(areaCv);

  // 2. Measure ruler height if not explicitly provided
  const pageHeightPx = customPageHeight || getRulerHeightPx(areaCv);

  const is2ColumnMode =
    cvData?.layout?.type === '2-column' && !cvData?.layout?.isAtsMode;
  const leftCol = areaCv.querySelector('.resume__left');
  const rightCol = areaCv.querySelector('.resume__right');
  const singleCol = areaCv.querySelector('.resume__single-column');

  const colDefs =
    is2ColumnMode && leftCol && rightCol
      ? [
          {
            name: 'left',
            el: leftCol,
            items: getBreakableComponents(leftCol),
          },
          {
            name: 'right',
            el: rightCol,
            items: getBreakableComponents(rightCol),
          },
        ]
      : [
          {
            name: 'single',
            el: singleCol || areaCv,
            items: getBreakableComponents(singleCol || areaCv),
          },
        ];

  let passes = 0;
  let hasChanges = true;

  while (hasChanges && passes < 6) {
    passes++;
    hasChanges = false;

    const currentMaxHeight = Math.max(
      ...colDefs.map((c) => c.el.scrollHeight || c.el.offsetHeight || 0),
      areaCv.scrollHeight || 0,
      pageHeightPx,
    );
    const estimatedPages = Math.max(
      1,
      Math.ceil((currentMaxHeight + gapPx) / (pageHeightPx + gapPx)),
    );

    const pagePadding = Number(cvData?.layout?.pagePadding ?? DEFAULT_PAGE_PADDING);

    for (let pageNum = 1; pageNum <= estimatedPages; pageNum++) {
      const { contentAreaBottom, nextContentAreaTop } = getForbiddenZone(
        pageNum,
        pageHeightPx,
        pagePadding,
        gapPx,
      );

      for (const col of colDefs) {
        for (const item of col.items) {
          const { top, bottom, height } = getRelativeBounds(item, areaCv);

          if (height <= 0) continue;

          // If element already landed safely on or beyond the next page content area
          if (top >= nextContentAreaTop) {
            continue;
          }

          // If element was already pushed for this exact fold and is at legal top
          if (
            item.getAttribute('data-editor-break-forced') === 'true' &&
            item.getAttribute('data-editor-break-fold') === String(pageNum) &&
            top >= nextContentAreaTop
          ) {
            continue;
          }

          let isOrphanTitle = false;
          if (
            item.classList.contains('section-title') ||
            item.hasAttribute('data-section-title')
          ) {
            const itemIdx = col.items.indexOf(item);
            const nextItem =
              itemIdx !== -1 && itemIdx + 1 < col.items.length
                ? col.items[itemIdx + 1]
                : null;
            if (nextItem && !nextItem.classList.contains('section-title')) {
              const nextBounds = getRelativeBounds(nextItem, areaCv);
              if (nextBounds && nextBounds.bottom > contentAreaBottom - 4) {
                isOrphanTitle = true;
              }
            }
            if (
              !isOrphanTitle &&
              top < contentAreaBottom &&
              bottom > contentAreaBottom - 60
            ) {
              isOrphanTitle = true;
            }
          }

          if (!isOrphanTitle && bottom <= contentAreaBottom - 4) {
            continue;
          }

          item.setAttribute('data-editor-break-forced', 'true');
          item.setAttribute('data-editor-break-fold', String(pageNum));

          const computedStyle =
            typeof window !== 'undefined' && window.getComputedStyle
              ? window.getComputedStyle(item)
              : null;
          const currentMarginTop = computedStyle
            ? parseFloat(computedStyle.marginTop) || 0
            : 0;
          const neededPush = Math.ceil(Math.max(0, nextContentAreaTop - top));
          const effectiveMarginTop = currentMarginTop + neededPush;

          item.style.setProperty(
            'margin-top',
            `${effectiveMarginTop}px`,
            'important',
          );

          // Keep drag handle and section action buttons aligned with broken title
          if (item.classList.contains('section-title')) {
            const section = item.closest('.cv-section');
            if (section) {
              const actionBtns = section.querySelector('.section-action-buttons');
              if (actionBtns) {
                actionBtns.style.setProperty(
                  'top',
                  `calc(0.35rem + ${effectiveMarginTop}px)`,
                );
              }
              const dragHandle = section.querySelector('.drag-handle');
              if (dragHandle) {
                dragHandle.style.setProperty('top', `${effectiveMarginTop}px`);
              }
            }
          }

          hasChanges = true;
          break;
        }
      }
    }
  }

  const finalMaxHeight = Math.max(
    ...colDefs.map((c) => c.el.scrollHeight || c.el.offsetHeight || 0),
    areaCv.scrollHeight || 0,
    pageHeightPx,
  );
  const finalPages = Math.max(
    1,
    Math.ceil((finalMaxHeight + gapPx) / (pageHeightPx + gapPx)),
  );

  const pageBreaks = [];
  for (let p = 1; p < finalPages; p++) {
    pageBreaks.push(p * pageHeightPx + (p - 1) * gapPx);
  }

  // 3. Post-condition forbidden boundary zone verification
  const auditPadding = Number(cvData?.layout?.pagePadding ?? DEFAULT_PAGE_PADDING);
  auditForbiddenBoundaryZones(areaCv, finalPages, pageHeightPx, auditPadding, gapPx);

  return {
    totalPages: finalPages,
    pageBreaks,
  };
}

/**
 * Calculates page breaks for a container given page height and padding in pixels.
 *
 * @param {HTMLElement} areaCvEl
 * @param {number} [pageHeightPx=1123]
 * @param {number} [pagePaddingPx=24]
 * @param {number} [gapPx=20]
 * @returns {number[]} Array of pixel Y offsets where page breaks occur
 */
export function calculatePageBreaks(
  areaCvEl,
  pageHeightPx = A4_PAGE_HEIGHT_PX,
  pagePaddingPx = DEFAULT_PAGE_PADDING,
  gapPx = A4_GAP_PX,
) {
  if (!areaCvEl) return [];
  const height = areaCvEl.scrollHeight || areaCvEl.offsetHeight || 0;
  const pages = Math.max(1, Math.ceil((height + gapPx) / (pageHeightPx + gapPx)));
  const breaks = [];
  for (let i = 1; i < pages; i++) {
    breaks.push(i * pageHeightPx + (i - 1) * gapPx);
  }
  return breaks;
}
