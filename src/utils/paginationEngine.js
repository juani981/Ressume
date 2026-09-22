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

  const previouslyTagged = areaCv.querySelectorAll('[data-target-page]');
  previouslyTagged.forEach((el) => el.removeAttribute('data-target-page'));
  areaCv.removeAttribute('data-total-pages');

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
      if (cand.querySelector('[data-editor-break-forced="true"]')) continue;
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
 * Applies visual split decorations to sections and items that straddle page folds,
 * splitting their visual hover box into separate Page 1 and Page 2 segments.
 *
 * @param {HTMLElement} areaCv
 * @param {number} pageHeightPx
 * @param {number} pagePadding
 * @param {number} gapPx
 */
export function applySplitComponentVisualDecorations(
  areaCv,
  pageHeightPx = A4_PAGE_HEIGHT_PX,
  pagePadding = DEFAULT_PAGE_PADDING,
  gapPx = A4_GAP_PX,
) {
  if (!areaCv) return;

  const brokenNodes = areaCv.querySelectorAll('[data-editor-break-forced="true"]');
  brokenNodes.forEach((brokenEl) => {
    const foldStr = brokenEl.getAttribute('data-editor-break-fold') || '1';
    const foldNum = parseInt(foldStr, 10) || 1;
    const { contentAreaBottom } = getForbiddenZone(
      foldNum,
      pageHeightPx,
      pagePadding,
      gapPx,
    );

    // 1. SECTION DECORATION
    const section =
      brokenEl.closest('.editable-section-container') ||
      brokenEl.closest('.cv-section');
    if (section) {
      const isTitleBreak =
        brokenEl.classList.contains('section-title') ||
        brokenEl.hasAttribute('data-section-title');

      const secBounds = getRelativeBounds(section, areaCv);
      const brokenBoundsInSec = getRelativeBounds(brokenEl, section);

      if (isTitleBreak) {
        // Entire section title moved to next page: display hover outline only on Page 2
        section.classList.add('has-split-break', 'has-split-break--page2-only');
        section.setAttribute('data-section-split', 'page2-only');
        section.style.setProperty('--split-part1-height', '0px');
        section.style.setProperty(
          '--split-part2-top',
          `${Math.max(0, brokenBoundsInSec.top)}px`,
        );
      } else {
        // Section has content on Page 1 and Page 2
        const allBreakables = Array.from(
          section.querySelectorAll(
            '.section-title, .editable-item-container, .cv-block, .bullet-item-row, li',
          ),
        );
        let part1Bottom = 0;
        for (const child of allBreakables) {
          if (child === brokenEl || brokenEl.contains(child)) break;
          const b = getRelativeBounds(child, section);
          if (b.bottom > part1Bottom) {
            part1Bottom = b.bottom;
          }
        }

        const maxPart1 = Math.max(0, contentAreaBottom - secBounds.top);
        const finalPart1Height =
          part1Bottom > 0 ? Math.min(part1Bottom + 4, maxPart1) : maxPart1;
        const finalPart2Top = Math.max(0, brokenBoundsInSec.top);

        section.classList.add('has-split-break');
        section.setAttribute('data-section-split', 'true');
        section.style.setProperty('--split-part1-height', `${finalPart1Height}px`);
        section.style.setProperty('--split-part2-top', `${finalPart2Top}px`);
      }
    }

    // 2. ITEM DECORATION (if bullet inside item was broken)
    const itemContainer = brokenEl.closest('.editable-item-container');
    if (itemContainer && itemContainer !== brokenEl) {
      const itemBullets = Array.from(
        itemContainer.querySelectorAll(
          'ul.experience__bullets > li, ul.simple-list-ul > li, .bullet-item-row, li.cv-block',
        ),
      );
      let itemPart1Bottom = 0;
      for (const bullet of itemBullets) {
        if (bullet === brokenEl || brokenEl.contains(bullet)) break;
        const b = getRelativeBounds(bullet, itemContainer);
        if (b.bottom > itemPart1Bottom) {
          itemPart1Bottom = b.bottom;
        }
      }
      const brokenBoundsInItem = getRelativeBounds(brokenEl, itemContainer);
      const finalItemPart1 = itemPart1Bottom > 0 ? itemPart1Bottom + 2 : 24;
      const finalItemPart2 = Math.max(0, brokenBoundsInItem.top);

      itemContainer.classList.add('has-split-break');
      itemContainer.setAttribute('data-item-split', 'true');
      itemContainer.style.setProperty('--split-part1-height', `${finalItemPart1}px`);
      itemContainer.style.setProperty('--split-part2-top', `${finalItemPart2}px`);
    }
  });
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

  const isAtsMode = Boolean(
    cvData?.layout?.isAtsMode ||
    cvData?.layout?.type === '1-column' ||
    areaCv?.classList?.contains('resume--ats-mode') ||
    areaCv?.classList?.contains('resume__single-column')
  );

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
    let estimatedPages = Math.max(
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

          // If item already has a child bullet broken for this fold, fold pageNum is already handled
          if (item.querySelector?.(`[data-editor-break-forced="true"][data-editor-break-fold="${pageNum}"]`)) {
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
              const nextBullets = Array.from(
                nextItem.querySelectorAll(
                  'ul.experience__bullets > li, ul.simple-list-ul > li, .bullet-item-row, li.cv-block'
                )
              );
              if (nextBullets.length > 0) {
                const firstBulletBounds = getRelativeBounds(nextBullets[0], areaCv);
                if (firstBulletBounds && firstBulletBounds.bottom > contentAreaBottom - 4) {
                  isOrphanTitle = true;
                }
              } else {
                const nextBounds = getRelativeBounds(nextItem, areaCv);
                if (nextBounds && nextBounds.bottom > contentAreaBottom - 4) {
                  isOrphanTitle = true;
                }
              }
            } else if (
              (!nextItem || nextItem.classList.contains('section-title')) &&
              top < contentAreaBottom &&
              bottom > contentAreaBottom - 80
            ) {
              isOrphanTitle = true;
            }
          }

          if (!isOrphanTitle && bottom <= contentAreaBottom - 4) {
            continue;
          }

          let targetBreakElement = item;
          let skipItemBreak = false;

          // Natural bullet flow: if item has multiple bullets and its first bullet fits on the current page,
          // break at the overflowing bullet instead of displacing the whole item container.
          if (!isOrphanTitle && !item.classList.contains('section-title')) {
            const bullets = Array.from(
              item.querySelectorAll(
                'ul.experience__bullets > li, ul.simple-list-ul > li, .bullet-item-row, li.cv-block'
              )
            );
            if (bullets.length > 1) {
              const firstBulletBounds = getRelativeBounds(bullets[0], areaCv);
              if (firstBulletBounds && firstBulletBounds.bottom <= contentAreaBottom - 4) {
                const bBoundsList = bullets.map((b) => getRelativeBounds(b, areaCv));
                const overflowingBullet = bullets.find((b) => {
                  const bBounds = getRelativeBounds(b, areaCv);
                  return bBounds && bBounds.top < nextContentAreaTop && bBounds.bottom > contentAreaBottom - 4;
                });
                if (overflowingBullet) {
                  targetBreakElement = overflowingBullet;
                  if (!targetBreakElement.getAttribute('data-item-id')) {
                    const parentId = item.getAttribute('data-item-id') || item.id || 'item';
                    const bIdx = bullets.indexOf(targetBreakElement);
                    targetBreakElement.setAttribute('data-item-id', `${parentId}_bullet_${bIdx}`);
                  }
                } else {
                  // The earlier bullets fit on the current page and all subsequent bullets
                  // are already safely at or beyond nextContentAreaTop.
                  // The item is already cleanly split across this fold; do not displace the parent container.
                  skipItemBreak = true;
                }
              }
            }
          }

          if (skipItemBreak) {
            continue;
          }

          const targetBounds = getRelativeBounds(targetBreakElement, areaCv);
          const computedStyle =
            typeof window !== 'undefined' && window.getComputedStyle
              ? window.getComputedStyle(targetBreakElement)
              : null;
          const currentMarginTop = computedStyle
            ? parseFloat(computedStyle.marginTop) || 0
            : 0;
          const neededPush = Math.ceil(Math.max(0, nextContentAreaTop - targetBounds.top));

          if (neededPush <= 0) {
            continue;
          }

          targetBreakElement.setAttribute('data-editor-break-forced', 'true');
          targetBreakElement.setAttribute('data-editor-break-fold', String(pageNum));

          const effectiveMarginTop = currentMarginTop + neededPush;

          targetBreakElement.style.setProperty(
            'margin-top',
            `${effectiveMarginTop}px`,
            'important',
          );
          hasChanges = true;

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
  let finalPages = Math.max(
    1,
    Math.ceil((finalMaxHeight + gapPx) / (pageHeightPx + gapPx)),
  );

  const pageBreaks = [];
  for (let p = 1; p < finalPages; p++) {
    pageBreaks.push(p * pageHeightPx + (p - 1) * gapPx);
  }

  // Tag rich editor telemetry on DOM (Rule 14: Cero Adivinanzas Heurísticas)
  areaCv.setAttribute('data-total-pages', String(finalPages));
  colDefs.forEach((col) => {
    col.items.forEach((item) => {
      const { top } = getRelativeBounds(item, areaCv);
      let targetPage = 1;
      for (let p = 0; p < pageBreaks.length; p++) {
        if (top >= pageBreaks[p] - 4) {
          targetPage = p + 2;
        }
      }
      if (item.getAttribute('data-editor-break-forced') === 'true') {
        const fold = parseInt(item.getAttribute('data-editor-break-fold') || '1', 10);
        targetPage = Math.max(targetPage, fold + 1);
      }
      item.setAttribute('data-target-page', String(targetPage));
    });
  });

  const auditPadding = Number(cvData?.layout?.pagePadding ?? DEFAULT_PAGE_PADDING);

  // 3. Apply visual split decorations to broken components
  applySplitComponentVisualDecorations(areaCv, pageHeightPx, auditPadding, gapPx);

  // 4. Post-condition forbidden boundary zone verification
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
