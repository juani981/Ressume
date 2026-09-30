/**
 * pageDistributor.js
 *
 * Pure deterministic document page distributor.
 * Partitions and distributes CV sections and items into discrete PageModels
 * respecting A4 physical capacity, manual page assignments, layout modes,
 * and multi-item section continuation splits.
 *
 * Invariant 15: Editor-Native Discrete A4 Boxes
 * Invariant 16: Zero Dynamic Reflow on Print
 */

import { A4_PAGE_HEIGHT_PX, EDITOR_PAGE_HEIGHT_PX, DEFAULT_PAGE_PADDING } from '../constants';
import { createPageModel, deepFreeze } from './pageModelTypes.js';
import { getSectionDescriptor } from '../registry/sectionRegistry.js';

export const DEFAULT_SECTION_GAP_PX = 16;
export const DEFAULT_ITEM_GAP_PX = 8;
export const DEFAULT_HEADER_HEIGHT_PX = 36;
export const CONTINUATION_HEADER_HEIGHT_PX = 20;

/**
 * Estimates the height of a section header in pixels.
 *
 * @param {Object} section - Section configuration
 * @param {boolean} [isContinuation=false] - Whether this section is a continuation on page N > 1
 * @param {Object} [options={}] - Distribution options
 * @returns {number} Estimated header height in px
 */
export function estimateHeaderHeight(section, isContinuation = false, options = {}) {
  if (isContinuation) {
    if (options.omitContinuationHeader || options.omitContinuationTitle) {
      return 0;
    }
    if (section && section.title && section.title.trim() !== '') {
      return (options.continuationHeaderHeightPx ?? CONTINUATION_HEADER_HEIGHT_PX);
    }
    return 0;
  }

  if (section && section.title && section.title.trim() !== '') {
    if (typeof options.headerHeightPx === 'number') {
      return options.headerHeightPx;
    }
    const isAts = Boolean(
      options.isAts ||
      options.isAtsMode ||
      options.mode === 'ats' ||
      options.mode === '1-column' ||
      options.column === 'single'
    );
    const fontScale = options.fontScale ?? (options.titleScale ?? 1.0);
    const lineHeight = options.lineHeight ?? 1.45;
    const itemGap = options.itemGapPx ?? DEFAULT_ITEM_GAP_PX;

    if (isAts) {
      return Math.round(24 * fontScale * (lineHeight / 1.45)) + Math.round(itemGap * 1.5);
    }

    const isLeftCol = options.column === 'left';
    // In narrow left column (33% width), uppercase titles with letter-spacing wrap to 2 lines if longer than 18 chars
    const isMultiLine = isLeftCol && section.title.trim().length > 18;
    const lines = isMultiLine ? 2 : 1;
    return Math.round(lines * 24 * fontScale * (lineHeight / 1.45)) + Math.round(itemGap * 1.5);
  }

  return 0;
}

/**
 * Estimates the base height of an item containing bullets, excluding the bullets themselves.
 *
 * @param {Object} item - Item object
 * @param {string} [sectionType=''] - Type of section containing the item
 * @param {Object} [options={}] - Distribution options
 * @returns {number} Estimated base item height in px
 */
export function estimateItemBaseHeight(item, sectionType = '', options = {}) {
  const itemGap = options.itemGapPx ?? DEFAULT_ITEM_GAP_PX;
  const fontScale = options.fontScale ?? (options.bodyScale ?? 1.0);
  const lineHeight = options.lineHeight ?? 1.45;
  const fontFactor = fontScale * (lineHeight / 1.45);
  const isAts = Boolean(
    options.isAts ||
    options.isAtsMode ||
    options.mode === 'ats' ||
    options.mode === '1-column' ||
    options.column === 'single'
  );
  const isLeftCol = !isAts && options.column === 'left';
  const charsPerLine = isLeftCol ? 28 : (isAts ? 72 : 44);

  let h = isAts ? 38 : 50;
  if (item.link) h += 16;
  if (item.description) {
    const paragraphs = String(item.description).split('\n');
    const descLines = paragraphs.reduce((acc, p) => acc + Math.max(1, Math.ceil(p.length / charsPerLine)), 0);
    h += descLines * 20;
  }
  return Math.round(h * fontFactor) + Math.round(itemGap * 0.5);
}

/**
 * Estimates the height of a single bullet point row in pixels.
 *
 * @param {string|Object} bullet - Bullet string or object
 * @param {string} [sectionType=''] - Type of section containing the bullet
 * @param {Object} [options={}] - Distribution options
 * @returns {number} Estimated bullet height in px
 */
export function estimateSingleBulletHeight(bullet, sectionType = '', options = {}) {
  const itemGap = options.itemGapPx ?? DEFAULT_ITEM_GAP_PX;
  const fontScale = options.fontScale ?? (options.listScale ?? 1.0);
  const lineHeight = options.lineHeight ?? 1.45;
  const fontFactor = fontScale * (lineHeight / 1.45);
  const isAts = Boolean(
    options.isAts ||
    options.isAtsMode ||
    options.mode === 'ats' ||
    options.mode === '1-column' ||
    options.column === 'single'
  );
  const isLeftCol = !isAts && options.column === 'left';
  const charsPerLine = isLeftCol ? 26 : (isAts ? 70 : 42);

  const bStr = typeof bullet === 'string' ? bullet : (bullet?.text || '');
  const bLines = Math.max(1, Math.ceil(bStr.length / Math.max(10, charsPerLine)));
  return Math.round((bLines * 20) * fontFactor) + Math.round(itemGap * 0.75);
}

/**
 * Estimates the total height of an array of bullets.
 *
 * @param {Array<string|Object>} bullets - Array of bullets
 * @param {string} [sectionType=''] - Type of section containing bullets
 * @param {Object} [options={}] - Distribution options
 * @returns {number}
 */
export function estimateItemBulletsHeight(bullets, sectionType = '', options = {}) {
  if (!Array.isArray(bullets) || bullets.length === 0) return 0;
  return bullets.reduce((sum, b) => sum + estimateSingleBulletHeight(b, sectionType, options), 0);
}

/**
 * Estimates the height of an individual section item in pixels.
 *
 * @param {Object} item - Item object
 * @param {string} [sectionType=''] - Type of section containing the item
 * @param {Object} [options={}] - Distribution options
 * @returns {number} Estimated item height in px
 */
export function estimateItemHeight(item, sectionType = '', options = {}) {
  if (!item || typeof item !== 'object') {
    return 30;
  }

  if (typeof options.itemHeightEstimator === 'function') {
    const custom = options.itemHeightEstimator(item, sectionType, options);
    if (typeof custom === 'number' && !isNaN(custom)) {
      return custom;
    }
  }

  if (typeof item.height === 'number' && item.height > 0) {
    return item.height;
  }

  const descriptor = getSectionDescriptor(sectionType);
  if (typeof descriptor?.estimateItemHeight === 'function') {
    return descriptor.estimateItemHeight(item, options);
  }

  const itemGap = options.itemGapPx ?? DEFAULT_ITEM_GAP_PX;
  const fontScale = options.fontScale ?? (options.bodyScale ?? 1.0);
  const lineHeight = options.lineHeight ?? 1.45;
  const fontFactor = fontScale * (lineHeight / 1.45);
  const isAts = Boolean(
    options.isAts ||
    options.isAtsMode ||
    options.mode === 'ats' ||
    options.mode === '1-column' ||
    options.column === 'single'
  );
  const isLeftCol = !isAts && options.column === 'left';

  switch (sectionType) {
    case 'photo': {
      if (isAts) return 0;
      const size = Number(item.size) || 130;
      return size + itemGap;
    }
    case 'title_subtitle': {
      const titleScale = options.titleScale ?? 1.0;
      let h = Math.round(26 * titleScale) + (item.subtitle ? Math.round(18 * titleScale) : 0);
      return Math.round(h * (lineHeight / 1.45)) + itemGap;
    }
    case 'profile_header': {
      if (isAts) {
        let h = 44;
        if (item.subtitle) h += 18;
        return Math.round(h * fontFactor) + itemGap;
      }
      let h = 45;
      if (item.subtitle) h += isLeftCol ? 20 : 18;
      if (item.photo) {
        const photoH = Number(item.photoSize) || (isLeftCol ? 70 : 60);
        h += photoH;
      }
      return Math.round(h * fontFactor) + itemGap;
    }
    case 'contact': {
      if (Array.isArray(item.contacts) && item.contacts.length > 0) {
        if (isAts) {
          const rows = Math.ceil(item.contacts.length / 4);
          return Math.round((10 + rows * 18) * fontFactor) + itemGap;
        }
        const rows = isLeftCol ? item.contacts.length : Math.ceil(item.contacts.length / 2);
        return Math.round((rows * 20) * fontFactor) + itemGap;
      }
      return Math.round(32 * fontFactor) + itemGap;
    }
    case 'about': {
      const text = item.description || item.text || '';
      const charsPerLine = isLeftCol ? 28 : (isAts ? 72 : 44);
      const paragraphs = String(text).split('\n');
      const lines = paragraphs.reduce((acc, p) => acc + Math.max(1, Math.ceil(p.length / charsPerLine)), 0);
      return Math.round((lines * 20) * fontFactor) + itemGap;
    }
    case 'skills': {
      const fullText = (item.title ? item.title + ': ' : '') + (item.description || '');
      const charsPerLine = isLeftCol ? 28 : (isAts ? 72 : 44);
      const lines = Math.max(1, Math.ceil(fullText.length / charsPerLine));
      return Math.round((lines * 20) * fontFactor) + itemGap;
    }
    case 'education': {
      const charsPerLine = isLeftCol ? 28 : (isAts ? 72 : 44);
      let h = isLeftCol ? 54 : (isAts ? 40 : 46);
      if (item.description) {
        const paragraphs = String(item.description).split('\n');
        const lines = paragraphs.reduce((acc, p) => acc + Math.max(1, Math.ceil(p.length / charsPerLine)), 0);
        h += lines * 20;
      }
      return Math.round(h * fontFactor) + itemGap;
    }
    case 'list':
    case 'experience':
    case 'projects':
    case 'volunteering': {
      const baseH = estimateItemBaseHeight(item, sectionType, options);
      const bulletsH = estimateItemBulletsHeight(item.bullets, sectionType, options);
      return baseH + bulletsH;
    }
    case 'simple_list':
    case 'certificates':
    case 'languages': {
      const charsPerLine = isLeftCol ? 28 : (isAts ? 72 : 44);
      const text = item.text || item.description || item.name || '';
      const paragraphs = String(text).split('\n');
      const lines = paragraphs.reduce((acc, p) => acc + Math.max(1, Math.ceil(p.length / charsPerLine)), 0);
      const h = 22 + (lines - 1) * 20;
      return Math.round(h * fontFactor) + itemGap;
    }
    case 'spacer': {
      return item.height || 24;
    }
    default: {
      let h = 36;
      if (item.description || item.text) {
        const str = String(item.description || item.text);
        const charsPerLine = isLeftCol ? 30 : (isAts ? 80 : 50);
        h += Math.max(1, Math.ceil(str.length / charsPerLine)) * 18;
      }
      if (Array.isArray(item.bullets)) {
        h += item.bullets.length * 18;
      }
      return Math.round(h * fontFactor) + itemGap;
    }
  }
}

/**
 * Estimates the total height of a section.
 *
 * @param {Object} section - Section configuration
 * @param {Object} [options={}] - Distribution options
 * @returns {number} Estimated total section height in px
 */
export function estimateSectionHeight(section, options = {}) {
  if (!section || typeof section !== 'object') return 0;
  const isAts = Boolean(
    options.isAtsMode ||
    options.mode === '1-column' ||
    options.column === 'single'
  );
  if (isAts && section.type === 'photo') return 0;
  if (typeof section.height === 'number' && section.height > 0) {
    return section.height;
  }
  const header = estimateHeaderHeight(section, Boolean(section.isContinuation), options);
  const items = Array.isArray(section.items) ? section.items : [];
  const itemsHeight = items.reduce((sum, it) => sum + estimateItemHeight(it, section.type, options), 0);
  const sectionGap = options.sectionGapPx ?? DEFAULT_SECTION_GAP_PX;
  return header + itemsHeight + sectionGap;
}

/**
 * Distributes a flat list of sections across pages based on capacity and explicit breaks.
 *
 * @param {Array<Object>} sectionList - Array of sections belonging to a column or ATS sequence
 * @param {number} capacity - Maximum useful height capacity per page in pixels
 * @param {Object} options - Distribution options
 * @returns {Object.<number, Array<Object>>} Map from 1-based page number to array of section objects
 */
function distributeSectionListToPageBuckets(sectionList, capacity, options = {}) {
  const buckets = {};
  let currentPage = 1;
  let currentUsedHeight = 0;
  const pageCapacity = Math.max(100, capacity);
  const isAts = Boolean(
    options?.isAtsMode ||
    options?.mode === '1-column' ||
    options?.column === 'single'
  );

  function addToBucket(pageNum, sec) {
    if (!buckets[pageNum]) buckets[pageNum] = [];
    buckets[pageNum].push(sec);
  }

  for (const rawSec of sectionList) {
    if (isAts && rawSec.type === 'photo') {
      continue;
    }

    // Clone raw section so we never mutate cvData
    const section = {
      ...rawSec,
      items: Array.isArray(rawSec.items) ? rawSec.items.map(it => ({ ...it })) : [],
    };

    const explicitSectionPage = section.page != null
      ? Number(section.page)
      : (section.targetPage != null ? Number(section.targetPage) : null);
    const hasSectionBreak = Boolean(section.breakBefore || section.pageBreak);

    if (hasSectionBreak && !explicitSectionPage) {
      currentPage = Math.max(currentPage + 1, 2);
      currentUsedHeight = 0;
    }

    const items = section.items;
    const hasExplicitItemBreaks = items.some(
      it => (it.page != null) || (it.targetPage != null) || it.breakBefore || it.pageBreak
    );

    // Case 1: Items contain explicit page targets or breaks
    if (hasExplicitItemBreaks) {
      let targetItemPage = explicitSectionPage || currentPage;
      const itemPageMap = new Map();

      items.forEach((item) => {
        if (item.page != null) {
          targetItemPage = Number(item.page);
        } else if (item.targetPage != null) {
          targetItemPage = Number(item.targetPage);
        } else if (item.breakBefore || item.pageBreak) {
          targetItemPage = targetItemPage + 1;
        }
        if (!itemPageMap.has(targetItemPage)) {
          itemPageMap.set(targetItemPage, []);
        }
        itemPageMap.get(targetItemPage).push(item);
      });

      const sortedPages = Array.from(itemPageMap.keys()).sort((a, b) => a - b);
      const minPage = sortedPages[0];

      sortedPages.forEach((pageNum) => {
        const pageItems = itemPageMap.get(pageNum);
        const isContinuation = pageNum > minPage;
        const part = {
          ...section,
          id: (isContinuation && options.uniqueContinuationIds) ? `${section.id}__cont_${pageNum}` : section.id,
          originalSectionId: section.id,
          ...(isContinuation ? {
            continuationId: `${section.id}__cont_${pageNum}`,
            isContinuation: true,
            continuationPage: pageNum,
            title: options.omitContinuationHeader || options.omitContinuationTitle
              ? ''
              : options.reduceContinuationHeader
                ? `${section.title} (Cont.)`
                : section.title,
          } : {}),
          items: pageItems,
        };
        addToBucket(pageNum, part);
      });

      currentPage = Math.max(currentPage, ...sortedPages);
      const lastPageItems = itemPageMap.get(currentPage) || [];
      currentUsedHeight = estimateHeaderHeight(section, currentPage > minPage, options) +
        lastPageItems.reduce((acc, it) => acc + estimateItemHeight(it, section.type, options), 0);
      continue;
    }

    // Case 2: Section has an explicit page number
    if (explicitSectionPage) {
      currentPage = explicitSectionPage;
      currentUsedHeight = 0;
      addToBucket(currentPage, section);
      currentUsedHeight += estimateSectionHeight(section, options);
      continue;
    }

    // Case 3: Automatic capacity-based distribution adhering to the 3 Acceptance Criteria:
    // 1. If the size of the section plus the margin set by the user fits still in the current page, do not jump.
    // 2. If only the header of the section fits in the current page, but not the first item of the section, then jump it to the next page.
    // 3. If the header of the section and n first items of the section fit in the current page, write that in the current page, and the remaining items to the next page.

    const sectionGap = options.sectionGapPx ?? DEFAULT_SECTION_GAP_PX;
    const gapBefore = currentUsedHeight > 0 ? sectionGap : 0;
    const headerHeight = estimateHeaderHeight(section, false, options);
    const itemHeights = items.map(it => estimateItemHeight(it, section.type, options));
    const totalItemsHeight = itemHeights.reduce((acc, h) => acc + h, 0);
    const totalSectionHeight = gapBefore + headerHeight + (items.length > 0 ? totalItemsHeight : (section.height || 0));

    // CRITERION 1: Fits still in the current page -> DO NOT JUMP
    if (currentUsedHeight + totalSectionHeight <= pageCapacity) {
      addToBucket(currentPage, section);
      currentUsedHeight += totalSectionHeight;
      continue;
    }

    // Section has NO items (e.g. spacer) and exceeds capacity on current page
    if (items.length === 0) {
      if (currentUsedHeight > 0) {
        currentPage++;
        currentUsedHeight = 0;
      }
      addToBucket(currentPage, section);
      currentUsedHeight += headerHeight + (section.height || 0);
      continue;
    }

    // Section has items and does not fit entirely on currentPage.
    const remainingOnCurrent = pageCapacity - currentUsedHeight;
    const minNeededForFirstItem = gapBefore + headerHeight + itemHeights[0];
    const firstItemHasBullets = Array.isArray(items[0]?.bullets) && items[0].bullets.length > 1;
    const minBulletNeeded = firstItemHasBullets
      ? (gapBefore + headerHeight + estimateItemBaseHeight(items[0], section.type, options) + estimateSingleBulletHeight(items[0].bullets[0], section.type, options))
      : minNeededForFirstItem;

    // CRITERION 2: If neither first item nor its initial bullets fit, jump to next page
    if (currentUsedHeight > 0 && minBulletNeeded > remainingOnCurrent) {
      currentPage++;
      currentUsedHeight = 0;

      // On the fresh page, if the whole section fits now, place it directly
      const freshTotalHeight = headerHeight + totalItemsHeight;
      if (freshTotalHeight <= pageCapacity) {
        addToBucket(currentPage, section);
        currentUsedHeight = freshTotalHeight;
        continue;
      }
    }

    // CRITERION 3: Header and n first items (or granular bullets) fit in current page -> write to current page, remaining to next page
    const currentGap = currentUsedHeight > 0 ? sectionGap : 0;
    const availableOnPage = pageCapacity - currentUsedHeight;
    let accumulated = currentGap + estimateHeaderHeight(section, false, options);
    let splitIdx = 0;

    while (splitIdx < items.length && (accumulated + itemHeights[splitIdx] <= availableOnPage)) {
      accumulated += itemHeights[splitIdx];
      splitIdx++;
    }

    // Granular bullet splitting for the boundary item (items[splitIdx])
    let partialCandidate = null;
    let partialCandidateRemaining = null;

    const allowGranularBullets = Boolean(
      options.splitGranularBullets ||
      options.isEditor ||
      items.length === 1
    );

    if (allowGranularBullets && splitIdx < items.length) {
      const candidate = items[splitIdx];
      const hasBullets = Array.isArray(candidate?.bullets) && candidate.bullets.length > 1;

      if (hasBullets) {
        const baseH = estimateItemBaseHeight(candidate, section.type, options);
        const firstBulletH = estimateSingleBulletHeight(candidate.bullets[0], section.type, options);

        if (accumulated + baseH + firstBulletH <= availableOnPage) {
          let bAcc = baseH;
          let bIdx = 0;
          while (
            bIdx < candidate.bullets.length &&
            (accumulated + bAcc + estimateSingleBulletHeight(candidate.bullets[bIdx], section.type, options) <= availableOnPage)
          ) {
            bAcc += estimateSingleBulletHeight(candidate.bullets[bIdx], section.type, options);
            bIdx++;
          }

          if (bIdx > 0 && bIdx < candidate.bullets.length) {
            partialCandidate = {
              ...candidate,
              bullets: candidate.bullets.slice(0, bIdx),
              originalBullets: candidate.bullets,
              bulletStartIndex: 0,
              isPartialItem: true,
            };
            partialCandidateRemaining = {
              ...candidate,
              id: `${candidate.id}__cont_${currentPage + 1}`,
              originalItemId: candidate.id,
              title: '',
              subtitle: '',
              date: '',
              link: '',
              description: '',
              bullets: candidate.bullets.slice(bIdx),
              originalBullets: candidate.bullets,
              bulletStartIndex: bIdx,
              isContinuationItem: true,
            };
            accumulated += bAcc;
          }
        }
      }
    }

    // If on a page with prior content nothing could fit, advance to a fresh page instead of overflowing
    if (splitIdx === 0 && !partialCandidate) {
      if (currentUsedHeight > 0) {
        currentPage++;
        currentUsedHeight = 0;

        const freshTotalHeight = headerHeight + totalItemsHeight;
        if (freshTotalHeight <= pageCapacity) {
          addToBucket(currentPage, section);
          currentUsedHeight = freshTotalHeight;
          continue;
        }

        const freshAvailable = pageCapacity;
        let freshAccumulated = headerHeight;
        let freshSplitIdx = 0;

        while (freshSplitIdx < items.length && (freshAccumulated + itemHeights[freshSplitIdx] <= freshAvailable)) {
          freshAccumulated += itemHeights[freshSplitIdx];
          freshSplitIdx++;
        }

        let freshPartial = null;
        let freshPartialRemaining = null;

        if (allowGranularBullets && freshSplitIdx < items.length) {
          const candidate = items[freshSplitIdx];
          const hasBullets = Array.isArray(candidate?.bullets) && candidate.bullets.length > 1;

          if (hasBullets) {
            const baseH = estimateItemBaseHeight(candidate, section.type, options);
            const firstBulletH = estimateSingleBulletHeight(candidate.bullets[0], section.type, options);

            if (freshAccumulated + baseH + firstBulletH <= freshAvailable) {
              let bAcc = baseH;
              let bIdx = 0;
              while (
                bIdx < candidate.bullets.length &&
                (freshAccumulated + bAcc + estimateSingleBulletHeight(candidate.bullets[bIdx], section.type, options) <= freshAvailable)
              ) {
                bAcc += estimateSingleBulletHeight(candidate.bullets[bIdx], section.type, options);
                bIdx++;
              }

              if (bIdx > 0 && bIdx < candidate.bullets.length) {
                freshPartial = {
                  ...candidate,
                  bullets: candidate.bullets.slice(0, bIdx),
                  originalBullets: candidate.bullets,
                  bulletStartIndex: 0,
                  isPartialItem: true,
                };
                freshPartialRemaining = {
                  ...candidate,
                  id: `${candidate.id}__cont_${currentPage + 1}`,
                  originalItemId: candidate.id,
                  title: '',
                  subtitle: '',
                  date: '',
                  link: '',
                  description: '',
                  bullets: candidate.bullets.slice(bIdx),
                  originalBullets: candidate.bullets,
                  bulletStartIndex: bIdx,
                  isContinuationItem: true,
                };
                freshAccumulated += bAcc;
              }
            }
          }
        }

        if (freshSplitIdx === 0 && !freshPartial) {
          freshSplitIdx = 1;
          freshAccumulated += itemHeights[0];
        }

        splitIdx = freshSplitIdx;
        accumulated = freshAccumulated;
        partialCandidate = freshPartial;
        partialCandidateRemaining = freshPartialRemaining;
      } else {
        // If on a fresh page even 1 item exceeds capacity and couldn't be split, force 1 item
        splitIdx = 1;
        accumulated += itemHeights[0];
      }
    }

    const page1Items = items.slice(0, splitIdx);
    if (partialCandidate) {
      page1Items.push(partialCandidate);
    }

    const part1 = {
      ...section,
      items: page1Items,
    };
    addToBucket(currentPage, part1);
    currentUsedHeight += accumulated;

    let remItems = items.slice(splitIdx + (partialCandidate ? 1 : 0));
    let remHeights = itemHeights.slice(splitIdx + (partialCandidate ? 1 : 0));

    if (partialCandidateRemaining) {
      const remH = estimateItemBulletsHeight(partialCandidateRemaining.bullets, section.type, options);
      remItems = [partialCandidateRemaining, ...remItems];
      remHeights = [remH, ...remHeights];
    }

    // Remaining items go to the next page(s)
    while (remItems.length > 0) {
      currentPage++;
      currentUsedHeight = 0;
      const contHeader = estimateHeaderHeight(section, true, options);
      let contAcc = contHeader;
      let nextIdx = 0;

      while (nextIdx < remItems.length && (contAcc + remHeights[nextIdx] <= pageCapacity)) {
        contAcc += remHeights[nextIdx];
        nextIdx++;
      }

      if (nextIdx === 0) {
        nextIdx = 1;
        contAcc += remHeights[0];
      }

      const contPart = {
        ...section,
        id: options.uniqueContinuationIds ? `${section.id}__cont_${currentPage}` : section.id,
        originalSectionId: section.id,
        continuationId: `${section.id}__cont_${currentPage}`,
        isContinuation: true,
        continuationPage: currentPage,
        title: (options.omitContinuationHeader || options.omitContinuationTitle)
          ? ''
          : options.reduceContinuationHeader
            ? `${section.title} (Cont.)`
            : section.title,
        items: remItems.slice(0, nextIdx),
      };
      addToBucket(currentPage, contPart);
      currentUsedHeight = contAcc;

      remItems = remItems.slice(nextIdx);
      remHeights = remHeights.slice(nextIdx);
    }
  }

  return buckets;
}

/**
 * Distributes CV sections deterministically into an immutable array of PageModels.
 *
 * @param {Object} cvData - Current CV document data with sections and layout
 * @param {Object} [options={}] - Distribution options
 * @param {number} [options.pageHeightPx=1123] - Physical page height in px
 * @param {number} [options.pagePaddingPx=24] - Page padding in px
 * @param {number} [options.pageCapacity] - Override useful capacity in px
 * @param {string} [options.mode] - '1-column' | '2-column' | 'ats'
 * @param {boolean} [options.isAtsMode] - Override ATS single column mode
 * @param {boolean} [options.omitContinuationHeader=false] - Whether to strip title on continued sections
 * @param {boolean} [options.reduceContinuationHeader=false] - Whether to add "(Cont.)" on continued sections
 * @param {boolean} [options.uniqueContinuationIds=false] - Generate unique id for continuation section
 * @param {Function} [options.itemHeightEstimator] - Custom item height estimator function
 * @param {number} [options.minPages=1] - Minimum number of pages to generate
 * @returns {Array<import('./pageModelTypes').PageModel>} Immutable array of PageModel instances
 */
export function distributeSectionsToPages(cvData, options = {}) {
  const cv = cvData || {};
  const layout = cv.layout || {};
  const sections = Array.isArray(cv.sections) ? cv.sections : [];

  let isAts = false;
  if (options.mode === '1-column' || options.mode === 'ats') {
    isAts = true;
  } else if (options.mode === '2-column') {
    isAts = false;
  } else if (options.isAtsMode != null) {
    isAts = Boolean(options.isAtsMode);
  } else {
    isAts = Boolean(layout.isAtsMode === true || layout.type === '1-column');
  }

  const mergedOptions = {
    fontScale: layout.fontScale ?? 1.0,
    titleScale: layout.titleScale ?? 1.0,
    bodyScale: layout.bodyScale ?? 1.0,
    lineHeight: layout.lineHeight ?? 1.45,
    pagePaddingPx: layout.pagePadding ?? DEFAULT_PAGE_PADDING,
    sectionGapPx: layout.sectionGap ?? DEFAULT_SECTION_GAP_PX,
    itemGapPx: layout.itemGap ?? DEFAULT_ITEM_GAP_PX,
    isAts,
    isAtsMode: isAts,
    ...options,
  };

  const pageHeight = mergedOptions.pageHeightPx ?? A4_PAGE_HEIGHT_PX;
  const padding = mergedOptions.pagePaddingPx ?? DEFAULT_PAGE_PADDING;
  const safetyHeadroom = isAts ? 0 : (mergedOptions.isEditor ? 195 : 100);
  const usefulCapacity = mergedOptions.pageCapacity ?? (pageHeight - 2 * padding - safetyHeadroom);

  let singleBuckets = {};
  let leftBuckets = {};
  let rightBuckets = {};

  if (isAts) {
    singleBuckets = distributeSectionListToPageBuckets(sections, usefulCapacity, { ...mergedOptions, column: 'single' });
  } else {
    const leftList = sections.filter(s => s && s.column === 'left');
    const rightList = sections.filter(s => s && s.column !== 'left');

    leftBuckets = distributeSectionListToPageBuckets(leftList, usefulCapacity, { ...mergedOptions, column: 'left' });
    rightBuckets = distributeSectionListToPageBuckets(rightList, usefulCapacity, { ...mergedOptions, column: 'right' });
  }

  const allBucketKeys = [
    ...Object.keys(singleBuckets).map(Number),
    ...Object.keys(leftBuckets).map(Number),
    ...Object.keys(rightBuckets).map(Number),
  ];

  const minPages = Math.max(1, Math.floor(Number(options.minPages) || 1));
  const maxPage = allBucketKeys.length > 0 ? Math.max(...allBucketKeys) : 1;
  const totalPages = Math.max(maxPage, minPages);

  const pages = [];
  for (let p = 1; p <= totalPages; p++) {
    const isLastPage = (p === totalPages);
    const leftSections = isAts ? [] : (leftBuckets[p] || []);
    const rightSections = isAts ? [] : (rightBuckets[p] || []);
    const singleSections = isAts ? (singleBuckets[p] || []) : [];

    const page = createPageModel({
      pageNumber: p,
      totalPages,
      isLastPage,
      leftSections,
      rightSections,
      singleSections,
    });

    pages.push(page);
  }

  return deepFreeze(pages);
}
