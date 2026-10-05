/**
 * pageDistributor.js
 *
 * Canonical Pure Deterministic Document Page Distributor (Single Source of Truth).
 * Partitions and distributes CV sections and items into discrete PageModels
 * respecting physical A4 capacity, typography metrics, layout scale tokens,
 * anti-orphan header invariants, and granular bullet continuations.
 *
 * Adheres strictly to:
 * - Invariant 15: Editor-Native Discrete A4 Boxes
 * - Invariant 16: Zero Dynamic Reflow on Print
 * - Invariant 17: Radical Minimalism (Elimination of Accidental Complexity)
 */

import {
  A4_PAGE_HEIGHT_PX,
  A4_WIDTH_PX,
  DEFAULT_LEFT_COLUMN_WIDTH_PERCENT,
} from '../constants/geometry.js';
import {
  DEFAULT_PAGE_PADDING_PX,
  DEFAULT_SECTION_GAP_PX,
  DEFAULT_ITEM_GAP_PX,
  DEFAULT_LINE_HEIGHT,
  PAGE_BOTTOM_CLEARANCE_PX,
  DEFAULT_HEADER_MARGIN_BOTTOM_RATIO,
  DEFAULT_DATA_GAP_PX,
  MIN_PAGE_CAPACITY_PX,
  ATS_HEADER_BORDER_PADDING_PX,
  FALLBACK_ITEM_HEIGHT_PX,
  DEFAULT_PHOTO_SIZE_PX,
  DEFAULT_PHOTO_HEADER_SIZE_PX,
  DEFAULT_SPACER_HEIGHT_PX,
} from '../constants/spacing.js';
import {
  DEFAULT_COLUMN_CHARS_CAPACITY,
  MIN_CHARS_PER_LINE,
  LEFT_COLUMN_TITLE_WRAP_CHARS,
  TYPOGRAPHY_SCALE_LIMITS,
} from '../constants/typography.js';
import {
  calcLineHeightPx,
} from './typographyUtils.js';
import { createPageModel, deepFreeze } from './pageModelTypes.js';
import { getSectionDescriptor } from '../registry/sectionRegistry.js';

/**
 * Determines whether the given options, cvData, or layout object corresponds to 1-column / ATS mode.
 * Single Source of Truth for ATS mode resolution across distributor and components.
 *
 * @param {Object} [target={}] - Layout configuration, cvData, or distributor options
 * @returns {boolean} True if ATS / 1-column mode is active
 */
export function isAtsLayout(target = {}) {
  if (!target || typeof target !== 'object') return false;
  if (target.isAts === true) return true;
  if (target.isAts === false) return false;
  if (target.mode === '1-column' || target.mode === 'ats' || target.column === 'single') return true;
  if (target.mode === '2-column') return false;
  if (target.isAtsMode === true) return true;
  if (target.type === '1-column') return true;

  if (target.layout && typeof target.layout === 'object') {
    return isAtsLayout(target.layout);
  }

  return false;
}

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
      return options.continuationHeaderHeightPx ?? 0;
    }
    return 0;
  }

  if (!section || !section.title || section.title.trim() === '') {
    return 0;
  }

  const headerKey = `header_${section.originalSectionId || section.id}`;
  if (options.measuredHeights && typeof options.measuredHeights[headerKey] === 'number' && options.measuredHeights[headerKey] > 0) {
    return options.measuredHeights[headerKey];
  }

  if (typeof options.headerHeightPx === 'number') {
    return options.headerHeightPx;
  }

  const itemGap = options.itemGapPx ?? DEFAULT_ITEM_GAP_PX;
  const h2LineHeight = calcLineHeightPx('h2', options);
  const isAts = isAtsLayout(options);
  const isLeftCol = !isAts && options.column === 'left';
  const isMultiLine = isLeftCol && section.title.trim().length > (options.leftColumnTitleWrapChars ?? LEFT_COLUMN_TITLE_WRAP_CHARS);
  const lines = isMultiLine ? 2 : 1;
  const headerMarginRatio = options.headerMarginBottomRatio ?? DEFAULT_HEADER_MARGIN_BOTTOM_RATIO;
  const headerMargin = Math.round(itemGap * headerMarginRatio);
  const atsHeaderBorder = isAts ? (options.atsHeaderBorderPaddingPx ?? ATS_HEADER_BORDER_PADDING_PX) : 0;

  return Math.round(lines * h2LineHeight) + atsHeaderBorder + headerMargin;
}

/**
 * Computes realistic characters per line for fallback layout estimation when DOM is not yet measured.
 * Uses exact physical column width and standard Latin glyph advance (~0.52 of font size).
 *
 * @param {Object} [options={}]
 * @param {boolean} [isBullet=false]
 * @returns {number}
 */
export function getCharsPerLine(options = {}, isBullet = false) {
  const isAts = isAtsLayout(options);
  const isLeftCol = !isAts && options.column === 'left';
  const fontScale = options.fontScale ?? (isBullet ? (options.listScale ?? 1.0) : (options.bodyScale ?? 1.0));

  const colKey = isLeftCol ? 'left' : (isAts ? 'single' : 'right');
  const typeKey = isBullet ? 'bullet' : 'text';
  const baseChars = DEFAULT_COLUMN_CHARS_CAPACITY[colKey][typeKey];

  return Math.max(MIN_CHARS_PER_LINE, Math.floor(baseChars / Math.max(TYPOGRAPHY_SCALE_LIMITS.fontScale.min, fontScale)));
}

/**
 * Estimates the base height of an item (title, meta, description) without its bullets.
 *
 * @param {Object} item - Item object
 * @param {string} [sectionType=''] - Type of section containing the item
 * @param {Object} [options={}] - Distribution options
 * @returns {number} Estimated base item height in px
 */
export function estimateItemBaseHeight(item, sectionType = '', options = {}) {
  if (!item || typeof item !== 'object') return options.fallbackItemHeightPx ?? FALLBACK_ITEM_HEIGHT_PX;
  const id = item.originalItemId || item.id;
  const baseKey = `base_${id}`;
  if (options.measuredHeights && typeof options.measuredHeights[baseKey] === 'number' && options.measuredHeights[baseKey] > 0) {
    return options.measuredHeights[baseKey];
  }
  if (typeof item.height === 'number' && item.height > 0) return item.height;

  const itemGap = options.itemGapPx ?? DEFAULT_ITEM_GAP_PX;
  const dataGap = options.dataGapPx ?? DEFAULT_DATA_GAP_PX;
  const h3LineH = calcLineHeightPx('h3', options);
  const smallLineH = calcLineHeightPx('small', options);
  const normalLineH = calcLineHeightPx('normal', options);
  const charsPerLine = getCharsPerLine(options, false);

  let h = h3LineH;
  const hasMeta = Boolean(item.company || item.institution || item.subtitle || item.date || item.period);
  if (hasMeta) {
    h += dataGap + smallLineH;
  }
  if (item.link) {
    h += dataGap + smallLineH;
  }
  if (item.description) {
    const paragraphs = String(item.description).split('\n');
    const descLines = paragraphs.reduce((acc, p) => acc + Math.max(1, Math.ceil(p.length / charsPerLine)), 0);
    h += dataGap + descLines * normalLineH;
  }

  return Math.round(h) + itemGap;
}

/**
 * Estimates the height of a single bullet point row in pixels.
 *
 * @param {string|Object} bullet - Bullet string or object
 * @param {string} [sectionType=''] - Type of section containing the bullet
 * @param {Object} [options={}] - Distribution options
 * @param {string} [bulletKey=''] - Optional DOM key for exact measurement lookup
 * @returns {number} Estimated bullet height in px
 */
export function estimateSingleBulletHeight(bullet, sectionType = '', options = {}, bulletKey = '') {
  if (bulletKey && options.measuredHeights && typeof options.measuredHeights[bulletKey] === 'number' && options.measuredHeights[bulletKey] > 0) {
    return options.measuredHeights[bulletKey];
  }
  const itemGap = options.itemGapPx ?? DEFAULT_ITEM_GAP_PX;
  const normalLineH = calcLineHeightPx('normal', options);
  const charsPerLine = getCharsPerLine(options, true);
  const bStr = typeof bullet === 'string' ? bullet : (bullet?.text || '');
  const bLines = Math.max(1, Math.ceil(bStr.length / charsPerLine));
  return Math.round(bLines * normalLineH) + Math.round(itemGap / 2);
}

/**
 * Estimates the total height of an array of bullets.
 *
 * @param {Array<string|Object>} bullets - Array of bullets
 * @param {string} [sectionType=''] - Type of section containing bullets
 * @param {Object} [options={}] - Distribution options
 * @param {string} [itemId=''] - Optional item ID to qualify bullet measurement keys
 * @returns {number}
 */
export function estimateItemBulletsHeight(bullets, sectionType = '', options = {}, itemId = '', startOffset = 0) {
  if (!Array.isArray(bullets) || bullets.length === 0) return 0;
  return bullets.reduce((sum, b, idx) => {
    const key = itemId ? `${itemId}_bullet_${startOffset + idx}` : '';
    return sum + estimateSingleBulletHeight(b, sectionType, options, key);
  }, 0);
}

/**
 * Attempts to split an item with multiple bullets across pages.
 * Returns partialCandidate (for current page), partialCandidateRemaining (continuation for next page),
 * and consumedHeight, or null if the candidate cannot be split into the available height.
 *
 * @param {Object} params
 * @param {Object} params.candidate - The candidate item object
 * @param {string} params.sectionType - Section type
 * @param {Object} params.options - Distribution options
 * @param {number} params.currentAccumulated - Height currently accumulated on page
 * @param {number} params.maxAvailable - Maximum capacity available on page
 * @param {number} params.nextPageNumber - Target page number for continuation item ID
 * @returns {{ partialCandidate: Object, partialCandidateRemaining: Object, consumedHeight: number } | null}
 */
export function splitCandidateItemByBullets({
  candidate,
  sectionType = '',
  options = {},
  currentAccumulated = 0,
  maxAvailable = 0,
  nextPageNumber = 2,
}) {
  if (!candidate) return null;
  const hasBullets = Array.isArray(candidate.bullets) && candidate.bullets.length > 1;
  if (!hasBullets) return null;

  const candId = candidate.originalItemId || candidate.id;
  const baseH = estimateItemBaseHeight(candidate, sectionType, options);
  const firstBulletH = estimateSingleBulletHeight(candidate.bullets[0], sectionType, options, `${candId}_bullet_0`);

  if (currentAccumulated + baseH + firstBulletH > maxAvailable) {
    return null;
  }

  let bAcc = baseH;
  let bIdx = 0;
  while (
    bIdx < candidate.bullets.length &&
    (currentAccumulated + bAcc + estimateSingleBulletHeight(candidate.bullets[bIdx], sectionType, options, `${candId}_bullet_${bIdx}`) <= maxAvailable)
  ) {
    bAcc += estimateSingleBulletHeight(candidate.bullets[bIdx], sectionType, options, `${candId}_bullet_${bIdx}`);
    bIdx++;
  }

  if (bIdx > 0 && bIdx < candidate.bullets.length) {
    const partialCandidate = {
      ...candidate,
      bullets: candidate.bullets.slice(0, bIdx),
      originalBullets: candidate.bullets,
      bulletStartIndex: 0,
      isPartialItem: true,
    };
    // Continuación Asimétrica en P2: baseH = 0 (arranca directo con viñetas)
    const partialCandidateRemaining = {
      ...candidate,
      id: `${candidate.id}__cont_${nextPageNumber}`,
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
    return {
      partialCandidate,
      partialCandidateRemaining,
      consumedHeight: bAcc,
    };
  }

  return null;
}

/**

 * Estimates the height of an individual section item in pixels.
 *
 * @param {Object} item - Item object
 * @param {string} [sectionType=''] - Type of section containing the item
 * @param {Object} [options={}] - Distribution options
 * @returns {number} Estimated item height in px
 */
/**
 * Default fallback estimator for unrecognized or generic section types.
 */
export function defaultItemHeightEstimator(item, options = {}) {
  const itemGap = options.itemGapPx ?? DEFAULT_ITEM_GAP_PX;
  const normalLineH = calcLineHeightPx('normal', options);
  const charsPerLine = getCharsPerLine(options, false);
  const id = item?.originalItemId || item?.id;
  const baseH = item?.title ? calcLineHeightPx('h3', options) : 0;
  let bodyH = 0;
  if (item?.description || item?.text) {
    const lines = Math.max(1, Math.ceil(String(item.description || item.text).length / charsPerLine));
    bodyH = lines * normalLineH;
  }
  const bulletsH = Array.isArray(item?.bullets)
    ? estimateItemBulletsHeight(item.bullets, '', options, id)
    : 0;
  return Math.round(baseH + bodyH + bulletsH) + itemGap;
}

/**
 * Strategy map of pure height estimators for built-in section types (Open/Closed Principle).
 * Custom section types may register their own `estimateItemHeight` in their descriptor.
 */
export const SECTION_HEIGHT_ESTIMATORS = Object.freeze({
  photo: (item, options) => {
    if (isAtsLayout(options)) return 0;
    const itemGap = options.itemGapPx ?? DEFAULT_ITEM_GAP_PX;
    const size = Number(item.size) || (options.defaultPhotoSizePx ?? DEFAULT_PHOTO_SIZE_PX);
    return size + itemGap;
  },
  title_subtitle: (item, options) => {
    const itemGap = options.itemGapPx ?? DEFAULT_ITEM_GAP_PX;
    const h1LineH = calcLineHeightPx('h1', options);
    const subLineH = calcLineHeightPx('subtitle', options);
    return Math.round(h1LineH + (item.subtitle ? subLineH : 0)) + itemGap;
  },
  profile_header: (item, options) => {
    const isAts = isAtsLayout(options);
    const itemGap = options.itemGapPx ?? DEFAULT_ITEM_GAP_PX;
    const h1LineH = calcLineHeightPx('h1', options);
    const subLineH = calcLineHeightPx('subtitle', options);
    let h = h1LineH + (item.subtitle ? subLineH : 0);
    if (item.photo && !isAts) {
      h += Number(item.photoSize) || (options.defaultPhotoHeaderSizePx ?? DEFAULT_PHOTO_HEADER_SIZE_PX);
    }
    return Math.round(h) + itemGap;
  },
  contact: (item, options) => {
    const isAts = isAtsLayout(options);
    const itemGap = options.itemGapPx ?? DEFAULT_ITEM_GAP_PX;
    const smallLineH = calcLineHeightPx('small', options);
    const contacts = Array.isArray(item.contacts) ? item.contacts : [];
    if (contacts.length > 0) {
      const rows = isAts ? Math.ceil(contacts.length / 4) : Math.ceil(contacts.length / 2);
      return Math.round(rows * smallLineH) + itemGap;
    }
    return Math.round(smallLineH * 2) + itemGap;
  },
  about: (item, options) => {
    const itemGap = options.itemGapPx ?? DEFAULT_ITEM_GAP_PX;
    const normalLineH = calcLineHeightPx('normal', options);
    const charsPerLine = getCharsPerLine(options, false);
    const text = item.description || item.text || '';
    const paragraphs = String(text).split('\n');
    const lines = paragraphs.reduce((acc, p) => acc + Math.max(1, Math.ceil(p.length / charsPerLine)), 0);
    return Math.round(lines * normalLineH) + itemGap;
  },
  skills: (item, options) => {
    const itemGap = options.itemGapPx ?? DEFAULT_ITEM_GAP_PX;
    const normalLineH = calcLineHeightPx('normal', options);
    const charsPerLine = getCharsPerLine(options, false);
    const fullText = (item.title ? item.title + ': ' : '') + (item.description || '');
    const lines = Math.max(1, Math.ceil(fullText.length / charsPerLine));
    return Math.round(lines * normalLineH) + itemGap;
  },
  education: (item, options) => {
    const itemGap = options.itemGapPx ?? DEFAULT_ITEM_GAP_PX;
    const normalLineH = calcLineHeightPx('normal', options);
    const smallLineH = calcLineHeightPx('small', options);
    const charsPerLine = getCharsPerLine(options, false);
    const h3LineH = calcLineHeightPx('h3', options);
    let h = h3LineH + smallLineH;
    if (item.description) {
      const paragraphs = String(item.description).split('\n');
      const descLines = paragraphs.reduce((acc, p) => acc + Math.max(1, Math.ceil(p.length / charsPerLine)), 0);
      h += descLines * normalLineH;
    }
    return Math.round(h) + itemGap;
  },
  list: (item, options) => {
    const id = item.originalItemId || item.id;
    const baseH = estimateItemBaseHeight(item, 'list', options);
    const bulletsH = estimateItemBulletsHeight(item.bullets, 'list', options, id);
    return baseH + bulletsH;
  },
  experience: (item, options) => {
    const id = item.originalItemId || item.id;
    const baseH = estimateItemBaseHeight(item, 'experience', options);
    const bulletsH = estimateItemBulletsHeight(item.bullets, 'experience', options, id);
    return baseH + bulletsH;
  },
  projects: (item, options) => {
    const id = item.originalItemId || item.id;
    const baseH = estimateItemBaseHeight(item, 'projects', options);
    const bulletsH = estimateItemBulletsHeight(item.bullets, 'projects', options, id);
    return baseH + bulletsH;
  },
  volunteering: (item, options) => {
    const id = item.originalItemId || item.id;
    const baseH = estimateItemBaseHeight(item, 'volunteering', options);
    const bulletsH = estimateItemBulletsHeight(item.bullets, 'volunteering', options, id);
    return baseH + bulletsH;
  },
  simple_list: (item, options) => {
    const itemGap = options.itemGapPx ?? DEFAULT_ITEM_GAP_PX;
    const normalLineH = calcLineHeightPx('normal', options);
    const charsPerLine = getCharsPerLine(options, false);
    const text = item.text || item.description || item.name || '';
    const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
    return Math.round(lines * normalLineH) + itemGap;
  },
  certificates: (item, options) => {
    const itemGap = options.itemGapPx ?? DEFAULT_ITEM_GAP_PX;
    const normalLineH = calcLineHeightPx('normal', options);
    const charsPerLine = getCharsPerLine(options, false);
    const text = item.text || item.description || item.name || '';
    const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
    return Math.round(lines * normalLineH) + itemGap;
  },
  languages: (item, options) => {
    const itemGap = options.itemGapPx ?? DEFAULT_ITEM_GAP_PX;
    const normalLineH = calcLineHeightPx('normal', options);
    const charsPerLine = getCharsPerLine(options, false);
    const text = item.text || item.description || item.name || '';
    const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
    return Math.round(lines * normalLineH) + itemGap;
  },
  spacer: (item, options) => {
    return item.height || (options.defaultSpacerHeightPx ?? DEFAULT_SPACER_HEIGHT_PX);
  },
});

export function estimateItemHeight(item, sectionType = '', options = {}) {
  if (!item || typeof item !== 'object') return options.fallbackItemHeightPx ?? FALLBACK_ITEM_HEIGHT_PX;
  const id = item.originalItemId || item.id;
  const isSplittable = ['list', 'experience', 'projects', 'volunteering'].includes(sectionType) || (Array.isArray(item.bullets) && item.bullets.length > 0);

  if (!isSplittable && options.measuredHeights && typeof options.measuredHeights[id] === 'number' && options.measuredHeights[id] > 0) {
    return options.measuredHeights[id];
  }
  if (typeof options.itemHeightEstimator === 'function') {
    const custom = options.itemHeightEstimator(item, sectionType, options);
    if (typeof custom === 'number' && !isNaN(custom)) return custom;
  }
  if (typeof item.height === 'number' && item.height > 0) return item.height;

  // 1. Delegate directly to descriptor if defined (Open-Closed Principle)
  const descriptor = getSectionDescriptor(sectionType);
  if (typeof descriptor?.estimateItemHeight === 'function') {
    return descriptor.estimateItemHeight(item, options);
  }

  // 2. Delegate to strategy map for built-in types
  const estimator = SECTION_HEIGHT_ESTIMATORS[sectionType];
  if (typeof estimator === 'function') {
    return estimator(item, options);
  }

  // 3. Fallback estimator
  return defaultItemHeightEstimator(item, options);
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
  const isAts = isAtsLayout(options);
  if (isAts && section.type === 'photo') return 0;

  const headerH = estimateHeaderHeight(section, false, options);
  const items = Array.isArray(section.items) ? section.items : [];
  if (items.length === 0) {
    return headerH + (section.height || 0);
  }
  const itemsH = items.reduce((sum, it) => sum + estimateItemHeight(it, section.type, options), 0);
  return headerH + itemsH;
}

/**
 * Core partition algorithm: distributes a sequence of sections into page buckets.
 */
function distributeSectionListToPageBuckets(sectionList, capacity, options = {}) {
  const buckets = {};
  let currentPage = 1;
  let currentUsedHeight = 0;
  const minCapacity = options.minPageCapacityPx ?? MIN_PAGE_CAPACITY_PX;
  const pageCapacity = Math.max(minCapacity, capacity);
  const isAts = isAtsLayout(options);

  function addToBucket(pageNum, sec) {
    if (!buckets[pageNum]) buckets[pageNum] = [];
    buckets[pageNum].push(sec);
  }

  for (const rawSec of sectionList) {
    if (isAts && rawSec.type === 'photo') {
      continue;
    }

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

    // Case 1: Explicit item breaks
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

    // Case 3: Automatic capacity-based distribution with SSOT tokens
    const sectionGap = options.sectionGapPx ?? DEFAULT_SECTION_GAP_PX;
    const gapBefore = currentUsedHeight > 0 ? sectionGap : 0;
    const headerHeight = estimateHeaderHeight(section, false, options);
    const itemHeights = items.map(it => estimateItemHeight(it, section.type, options));
    const totalItemsHeight = itemHeights.reduce((acc, h) => acc + h, 0);
    const totalSectionHeight = gapBefore + headerHeight + (items.length > 0 ? totalItemsHeight : (section.height || 0));

    // CRITERION 1: Fits entirely on current page
    if (currentUsedHeight + totalSectionHeight <= pageCapacity) {
      addToBucket(currentPage, section);
      currentUsedHeight += totalSectionHeight;
      continue;
    }

    // Section without items (e.g. spacer)
    if (items.length === 0) {
      if (currentUsedHeight > 0) {
        currentPage++;
        currentUsedHeight = 0;
      }
      addToBucket(currentPage, section);
      currentUsedHeight += headerHeight + (section.height || 0);
      continue;
    }

    if (section.isIndivisible && currentUsedHeight > 0) {
      currentPage++;
      currentUsedHeight = 0;
      addToBucket(currentPage, section);
      currentUsedHeight = headerHeight + totalItemsHeight;
      continue;
    }

    // INVARIANTE ANTI-HUÉRFANOS: El encabezado nunca queda solo
    const remainingOnCurrent = pageCapacity - currentUsedHeight;
    const firstItemHasBullets = Array.isArray(items[0]?.bullets) && items[0].bullets.length > 0;
    const baseH0 = firstItemHasBullets ? estimateItemBaseHeight(items[0], section.type, options) : itemHeights[0];
    const firstBulletH0 = firstItemHasBullets ? estimateSingleBulletHeight(items[0].bullets[0], section.type, options) : 0;
    const minNeededForFirstAtom = gapBefore + headerHeight + baseH0 + firstBulletH0;

    if (currentUsedHeight > 0 && minNeededForFirstAtom > remainingOnCurrent) {
      currentPage++;
      currentUsedHeight = 0;

      const freshTotalHeight = headerHeight + totalItemsHeight;
      if (freshTotalHeight <= pageCapacity) {
        addToBucket(currentPage, section);
        currentUsedHeight = freshTotalHeight;
        continue;
      }
    }

    // CRITERION 3: Partición granular (ítem por ítem y viñeta por viñeta)
    const currentGap = currentUsedHeight > 0 ? sectionGap : 0;
    const availableOnPage = pageCapacity - currentUsedHeight;
    let accumulated = currentGap + estimateHeaderHeight(section, false, options);
    let splitIdx = 0;

    while (splitIdx < items.length && (accumulated + itemHeights[splitIdx] <= availableOnPage)) {
      accumulated += itemHeights[splitIdx];
      splitIdx++;
    }

    let partialCandidate = null;
    let partialCandidateRemaining = null;

    const allowGranularBullets = Boolean(
      options.splitGranularBullets ||
      options.isEditor ||
      items.length === 1
    );

    if (allowGranularBullets && splitIdx < items.length) {
      const splitResult = splitCandidateItemByBullets({
        candidate: items[splitIdx],
        sectionType: section.type,
        options,
        currentAccumulated: accumulated,
        maxAvailable: availableOnPage,
        nextPageNumber: currentPage + 1,
      });
      if (splitResult) {
        partialCandidate = splitResult.partialCandidate;
        partialCandidateRemaining = splitResult.partialCandidateRemaining;
        accumulated += splitResult.consumedHeight;
      }
    }

    // Si nada cupo en la página actual con contenido previo, avanzar a página fresca
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
          const splitResult = splitCandidateItemByBullets({
            candidate: items[freshSplitIdx],
            sectionType: section.type,
            options,
            currentAccumulated: freshAccumulated,
            maxAvailable: freshAvailable,
            nextPageNumber: currentPage + 1,
          });
          if (splitResult) {
            freshPartial = splitResult.partialCandidate;
            freshPartialRemaining = splitResult.partialCandidateRemaining;
            freshAccumulated += splitResult.consumedHeight;
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

    // Remaining items for continuation pages
    let remItems = [];
    if (partialCandidateRemaining) {
      remItems.push(partialCandidateRemaining);
    }
    const unplacedFullItems = items.slice(splitIdx + (partialCandidate ? 1 : 0));
    remItems.push(...unplacedFullItems);

    let contPageNum = currentPage + 1;

    while (remItems.length > 0) {
      currentPage = contPageNum;
      currentUsedHeight = 0;
      const contHeader = estimateHeaderHeight(section, true, options);
      let contAcc = contHeader;
      let nextIdx = 0;

      const remHeights = remItems.map(it => {
        if (it.isContinuationItem) {
          const candId = it.originalItemId || it.id;
          const startOffset = it.bulletStartIndex || 0;
          return estimateItemBulletsHeight(it.bullets, section.type, options, candId, startOffset);
        }
        return estimateItemHeight(it, section.type, options);
      });

      while (nextIdx < remItems.length && (contAcc + remHeights[nextIdx] <= pageCapacity)) {
        contAcc += remHeights[nextIdx];
        nextIdx++;
      }

      let contPartial = null;
      let contPartialRemaining = null;

      if (allowGranularBullets && nextIdx < remItems.length) {
        const candidate = remItems[nextIdx];
        const hasBullets = Array.isArray(candidate?.bullets) && candidate.bullets.length > 1;

        if (hasBullets) {
          const candId = candidate.originalItemId || candidate.id;
          const isAlreadyCont = Boolean(candidate.isContinuationItem);
          const startOffset = candidate.bulletStartIndex || 0;
          const baseH = isAlreadyCont ? 0 : estimateItemBaseHeight(candidate, section.type, options);
          const firstBulletH = estimateSingleBulletHeight(candidate.bullets[0], section.type, options, `${candId}_bullet_${startOffset}`);

          if (contAcc + baseH + firstBulletH <= pageCapacity) {
            let bAcc = baseH;
            let bIdx = 0;
            while (
              bIdx < candidate.bullets.length &&
              (contAcc + bAcc + estimateSingleBulletHeight(candidate.bullets[bIdx], section.type, options, `${candId}_bullet_${startOffset + bIdx}`) <= pageCapacity)
            ) {
              bAcc += estimateSingleBulletHeight(candidate.bullets[bIdx], section.type, options, `${candId}_bullet_${startOffset + bIdx}`);
              bIdx++;
            }

            if (bIdx > 0 && bIdx < candidate.bullets.length) {
              contPartial = {
                ...candidate,
                bullets: candidate.bullets.slice(0, bIdx),
                originalBullets: candidate.originalBullets || candidate.bullets,
                bulletStartIndex: (candidate.bulletStartIndex || 0),
                isPartialItem: true,
              };
              contPartialRemaining = {
                ...candidate,
                id: `${candidate.originalItemId || candidate.id}__cont_${currentPage + 1}`,
                originalItemId: candidate.originalItemId || candidate.id,
                title: '',
                subtitle: '',
                date: '',
                link: '',
                description: '',
                bullets: candidate.bullets.slice(bIdx),
                originalBullets: candidate.originalBullets || candidate.bullets,
                bulletStartIndex: (candidate.bulletStartIndex || 0) + bIdx,
                isContinuationItem: true,
              };
              contAcc += bAcc;
            }
          }
        }
      }

      if (nextIdx === 0 && !contPartial) {
        nextIdx = 1;
        contAcc += remHeights[0];
      }

      const placedItems = remItems.slice(0, nextIdx);
      if (contPartial) {
        placedItems.push(contPartial);
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
          : (options.reduceContinuationHeader ? `${section.title} (Cont.)` : section.title),
        items: placedItems,
      };
      addToBucket(currentPage, contPart);
      currentUsedHeight = contAcc;

      const nextRem = [];
      if (contPartialRemaining) {
        nextRem.push(contPartialRemaining);
      }
      nextRem.push(...remItems.slice(nextIdx + (contPartial ? 1 : 0)));
      remItems = nextRem;
      contPageNum++;
    }
  }

  return buckets;
}

/**
 * Distributes CV sections and items into discrete A4 PageModel instances.
 * Pure deterministic distribution driven 100% by layout tokens and SSOT geometry.
 *
 * @param {Object} cvData - Current CV document data with sections and layout
 * @param {Object} [options={}] - Distribution options
 * @returns {Array<import('./pageModelTypes').PageModel>} Array of frozen PageModels
 */
export function distributeSectionsToPages(cvData, options = {}) {
  const cv = cvData || {};
  const layout = cv.layout || {};
  const sections = Array.isArray(cv.sections) ? cv.sections : [];

  const isAts = isAtsLayout(options.mode ? options : { ...layout, ...options });

  const pageHeight = options.pageHeightPx ?? layout.pageHeight ?? A4_PAGE_HEIGHT_PX;
  const padding = options.pagePaddingPx ?? layout.pagePadding ?? DEFAULT_PAGE_PADDING_PX;
  const clearance = options.pageBottomClearancePx ?? PAGE_BOTTOM_CLEARANCE_PX;
  // SSOT: Height minus 2 * padding minus the micro-gasket clearance (14px)
  const usefulCapacity = options.pageCapacity ?? (pageHeight - 2 * padding - clearance);

  const mergedOptions = {
    omitContinuationHeader: options.omitContinuationHeader ?? false,
    omitContinuationTitle: options.omitContinuationTitle ?? false,
    uniqueContinuationIds: options.uniqueContinuationIds ?? false,
    reduceContinuationHeader: options.reduceContinuationHeader ?? false,
    fontFamily: layout.fontFamily,
    fontScale: layout.fontScale ?? 1.0,
    titleScale: layout.titleScale ?? 1.0,
    bodyScale: layout.bodyScale ?? 1.0,
    listScale: layout.listScale ?? 1.0,
    lineHeight: layout.lineHeight ?? DEFAULT_LINE_HEIGHT,
    sectionGapPx: layout.sectionGap ?? DEFAULT_SECTION_GAP_PX,
    itemGapPx: layout.itemGap ?? DEFAULT_ITEM_GAP_PX,
    leftColumnWidth: layout.leftColumnWidth || DEFAULT_LEFT_COLUMN_WIDTH_PERCENT,
    ...options,
    isAts,
  };

  let singleBuckets = {};
  let leftBuckets = {};
  let rightBuckets = {};

  if (isAts) {
    singleBuckets = distributeSectionListToPageBuckets(sections, usefulCapacity, {
      ...mergedOptions,
      column: 'single',
      columnWidthPx: A4_WIDTH_PX - 2 * padding,
    });
  } else {
    const leftPct = Number(mergedOptions.leftColumnWidth) || DEFAULT_LEFT_COLUMN_WIDTH_PERCENT;
    const contentWidth = A4_WIDTH_PX - 2 * padding;
    const leftColWidthPx = Math.round(contentWidth * (leftPct / 100));
    const rightColWidthPx = contentWidth - leftColWidthPx;

    const leftList = sections.filter(s => s && s.column === 'left');
    const rightList = sections.filter(s => s && s.column !== 'left');

    leftBuckets = distributeSectionListToPageBuckets(leftList, usefulCapacity, {
      ...mergedOptions,
      column: 'left',
      columnWidthPx: leftColWidthPx,
    });
    rightBuckets = distributeSectionListToPageBuckets(rightList, usefulCapacity, {
      ...mergedOptions,
      column: 'right',
      columnWidthPx: rightColWidthPx,
    });
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

    pages.push(createPageModel({
      pageNumber: p,
      totalPages,
      isLastPage,
      leftSections,
      rightSections,
      singleSections,
    }));
  }

  return deepFreeze(pages);
}

export default distributeSectionsToPages;
