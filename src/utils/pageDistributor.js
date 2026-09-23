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

import { A4_PAGE_HEIGHT_PX, DEFAULT_PAGE_PADDING } from './pageGeometry.js';
import { createPageModel, deepFreeze } from './pageModelTypes.js';

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
    if (section.title && section.title.trim() !== '') {
      return CONTINUATION_HEADER_HEIGHT_PX + (options.itemGapPx ?? DEFAULT_ITEM_GAP_PX);
    }
    return 0;
  }

  if (section.title && section.title.trim() !== '') {
    return (options.headerHeightPx ?? DEFAULT_HEADER_HEIGHT_PX) + (options.sectionGapPx ?? DEFAULT_SECTION_GAP_PX);
  }

  return options.sectionGapPx ?? DEFAULT_SECTION_GAP_PX;
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

  const itemGap = options.itemGapPx ?? DEFAULT_ITEM_GAP_PX;

  switch (sectionType) {
    case 'profile_header': {
      let h = 60;
      if (item.subtitle) h += 20;
      if (item.photo) h += 50;
      return h + itemGap;
    }
    case 'contact': {
      if (Array.isArray(item.contacts) && item.contacts.length > 0) {
        const rows = Math.ceil(item.contacts.length / 2);
        return 16 + rows * 22 + itemGap;
      }
      return 60 + itemGap;
    }
    case 'about': {
      const text = item.description || item.text || '';
      const lines = Math.max(1, Math.ceil(text.length / 60));
      return 20 + lines * 18 + itemGap;
    }
    case 'skills': {
      const desc = item.description || '';
      const lines = Math.max(1, Math.ceil(desc.length / 60));
      return 22 + lines * 18 + itemGap;
    }
    case 'list':
    case 'experience':
    case 'projects':
    case 'volunteering': {
      let h = 48;
      if (item.link) h += 16;
      if (item.description) {
        const descLines = Math.max(1, Math.ceil(item.description.length / 60));
        h += descLines * 20;
      }
      if (Array.isArray(item.bullets) && item.bullets.length > 0) {
        h += item.bullets.length * 28;
      }
      return h + itemGap;
    }
    case 'education': {
      return 46 + itemGap;
    }
    case 'simple_list':
    case 'certificates':
    case 'languages': {
      return 24 + itemGap;
    }
    case 'spacer': {
      return item.height || 24;
    }
    default: {
      let h = 30;
      if (item.description || item.text) {
        const str = String(item.description || item.text);
        h += Math.max(1, Math.ceil(str.length / 60)) * 18;
      }
      if (Array.isArray(item.bullets)) {
        h += item.bullets.length * 20;
      }
      return h + itemGap;
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
  if (typeof section.height === 'number' && section.height > 0) {
    return section.height;
  }
  const header = estimateHeaderHeight(section, Boolean(section.isContinuation), options);
  const items = Array.isArray(section.items) ? section.items : [];
  const itemsHeight = items.reduce((sum, it) => sum + estimateItemHeight(it, section.type, options), 0);
  return header + itemsHeight;
}

/**
 * Distributes a flat list of sections across pages based on capacity and explicit breaks.
 *
 * @param {Array<Object>} sectionList - Array of sections belonging to a column or ATS sequence
 * @param {number} capacity - Maximum useful height capacity per page in pixels
 * @param {Object} options - Distribution options
 * @returns {Object.<number, Array<Object>>} Map from 1-based page number to array of section objects
 */
function distributeSectionListToPageBuckets(sectionList, capacity, options) {
  const buckets = {};
  let currentPage = 1;
  let currentUsedHeight = 0;

  function addToBucket(pageNum, sec) {
    if (!buckets[pageNum]) buckets[pageNum] = [];
    buckets[pageNum].push(sec);
  }

  for (const rawSec of sectionList) {
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

    // Case 3: Automatic capacity-based distribution
    const headerHeight = estimateHeaderHeight(section, false, options);
    const itemHeights = items.map(it => estimateItemHeight(it, section.type, options));
    const totalItemsHeight = itemHeights.reduce((acc, h) => acc + h, 0);
    const totalSectionHeight = headerHeight + totalItemsHeight;

    if (items.length === 0) {
      const secH = headerHeight + (section.height || 0);
      if (currentUsedHeight + secH > capacity && currentUsedHeight > 0) {
        currentPage++;
        currentUsedHeight = 0;
      }
      addToBucket(currentPage, section);
      currentUsedHeight += secH;
      continue;
    }

    if (currentUsedHeight + totalSectionHeight <= capacity) {
      addToBucket(currentPage, section);
      currentUsedHeight += totalSectionHeight;
    } else {
      // Section does not fit on current page entirely
      const remainingOnCurrent = capacity - currentUsedHeight;
      if (currentUsedHeight > 0 && (headerHeight + itemHeights[0] > remainingOnCurrent)) {
        // Can't fit even header + first item on current page, advance to fresh page
        currentPage++;
        currentUsedHeight = 0;
      }

      // Check how many items fit on currentPage
      let accumulated = estimateHeaderHeight(section, false, options);
      let splitIdx = 0;
      while (splitIdx < items.length && (accumulated + itemHeights[splitIdx] <= capacity || splitIdx === 0)) {
        accumulated += itemHeights[splitIdx];
        splitIdx++;
      }

      const part1 = {
        ...section,
        items: items.slice(0, splitIdx),
      };
      addToBucket(currentPage, part1);
      currentUsedHeight = accumulated;

      let remItems = items.slice(splitIdx);
      let remHeights = itemHeights.slice(splitIdx);

      while (remItems.length > 0) {
        currentPage++;
        currentUsedHeight = 0;
        const contHeader = estimateHeaderHeight(section, true, options);
        let contAcc = contHeader;
        let nextIdx = 0;
        while (nextIdx < remItems.length && (contAcc + remHeights[nextIdx] <= capacity || nextIdx === 0)) {
          contAcc += remHeights[nextIdx];
          nextIdx++;
        }

        const contPart = {
          ...section,
          id: options.uniqueContinuationIds ? `${section.id}__cont_${currentPage}` : section.id,
          originalSectionId: section.id,
          continuationId: `${section.id}__cont_${currentPage}`,
          isContinuation: true,
          continuationPage: currentPage,
          title: options.omitContinuationHeader || options.omitContinuationTitle
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

  const pageHeight = options.pageHeightPx ?? A4_PAGE_HEIGHT_PX;
  const padding = options.pagePaddingPx ?? DEFAULT_PAGE_PADDING;
  const usefulCapacity = options.pageCapacity ?? (pageHeight - 2 * padding);

  let singleBuckets = {};
  let leftBuckets = {};
  let rightBuckets = {};

  if (isAts) {
    singleBuckets = distributeSectionListToPageBuckets(sections, usefulCapacity, options);
  } else {
    const leftList = sections.filter(s => s && s.column === 'left');
    const rightList = sections.filter(s => s && s.column !== 'left');

    leftBuckets = distributeSectionListToPageBuckets(leftList, usefulCapacity, options);
    rightBuckets = distributeSectionListToPageBuckets(rightList, usefulCapacity, options);
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
