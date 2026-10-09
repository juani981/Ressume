/**
 * useDocumentPages.js
 *
 * Reactive hook that partitions CV sections and items into discrete A4 PageModels
 * using the pure deterministic distributor (pageDistributor.js).
 *
 * Features:
 * - Omission of repeated continuation headers for seamless flow across pages.
 * - Dynamic recalculation when scale sliders change (fontScale, lineHeight, pagePadding, etc.).
 * - Support for 2-column and 1-column / ATS layout modes.
 * - Single source of truth: returns immutable PageModel[] matching Invariant Rules 15 & 16.
 */

import { useMemo, useRef } from 'react';
import { distributeSectionsToPages, isAtsLayout } from '../utils/pageDistributor';
import {
  A4_PAGE_HEIGHT_PX,
  DEFAULT_PAGE_PADDING,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_SECTION_GAP_PX,
  DEFAULT_ITEM_GAP_PX,
  PAGE_BOTTOM_CLEARANCE_PX,
} from '../constants';

const DEFAULT_OPTIONS = Object.freeze({});

/**
 * Custom hook returning an array of PageModel instances for live rendering and print.
 *
 * @param {Object} params
 * @param {Object} params.cvData - Canonical CV data model with sections and layout
 * @param {Object} [params.options={}] - Custom overrides for page capacity and distribution
 * @returns {{
 *   pages: Array<import('../utils/pageModelTypes').PageModel>,
 *   totalPages: number
 * }}
 */
export function useDocumentPages({ cvData, options = DEFAULT_OPTIONS }) {
  const layout = cvData?.layout || {};
  const sections = cvData?.sections || [];
  const previousItemPagesRef = useRef(new Map());

  const pages = useMemo(() => {
    const distributionOptions = {
      // Do not put another title for resuming when a break in other page happens
      omitContinuationHeader: options.omitContinuationHeader ?? true,
      omitContinuationTitle: options.omitContinuationTitle ?? true,
      reduceContinuationHeader: options.reduceContinuationHeader ?? false,
      uniqueContinuationIds: true,

      // Dynamic geometry and slider tokens
      pageHeightPx: options.pageHeightPx ?? A4_PAGE_HEIGHT_PX,
      pagePaddingPx: options.pagePaddingPx ?? layout.pagePadding ?? DEFAULT_PAGE_PADDING,
      pageBottomClearancePx: options.pageBottomClearancePx ?? layout.pageBottomClearance ?? PAGE_BOTTOM_CLEARANCE_PX,
      fontScale: options.fontScale ?? layout.fontScale ?? 1.0,
      titleScale: options.titleScale ?? layout.titleScale ?? 1.0,
      bodyScale: options.bodyScale ?? layout.bodyScale ?? 1.0,
      listScale: options.listScale ?? layout.listScale ?? 1.0,
      lineHeight: options.lineHeight ?? layout.lineHeight ?? DEFAULT_LINE_HEIGHT,
      sectionGapPx: options.sectionGapPx ?? layout.sectionGap ?? DEFAULT_SECTION_GAP_PX,
      itemGapPx: options.itemGapPx ?? layout.itemGap ?? DEFAULT_ITEM_GAP_PX,

      // Mode resolution
      isAtsMode: options.isAtsMode ?? isAtsLayout(layout),
      mode: options.mode ?? (isAtsLayout(layout) ? 'ats' : '2-column'),
      leftColumnWidth: options.leftColumnWidth ?? layout.leftColumnWidth,
      isEditor: true,

      // Hysteresis memory: previous page allocation map
      previousItemPages: previousItemPagesRef.current,

      // User overrides
      ...options,
    };

    const nextPages = distributeSectionsToPages(cvData, distributionOptions);

    // Update hysteresis map for subsequent renders
    const nextItemPages = new Map();
    nextPages.forEach((page) => {
      const pageNum = page.pageNumber;
      const allSections = [
        ...(page.singleSections || []),
        ...(page.leftSections || []),
        ...(page.rightSections || []),
      ];
      allSections.forEach((sec) => {
        if (sec.id) nextItemPages.set(sec.id, pageNum);
        if (sec.originalSectionId) nextItemPages.set(sec.originalSectionId, pageNum);
        (sec.items || []).forEach((it) => {
          const rawId = it.originalItemId || it.id;
          if (rawId) nextItemPages.set(rawId, pageNum);
          if (it.id) nextItemPages.set(it.id, pageNum);
        });
      });
    });
    previousItemPagesRef.current = nextItemPages;

    return nextPages;
  }, [
    cvData,
    sections,
    layout.type,
    layout.isAtsMode,
    layout.pagePadding,
    layout.fontScale,
    layout.titleScale,
    layout.bodyScale,
    layout.listScale,
    layout.lineHeight,
    layout.sectionGap,
    layout.itemGap,
    layout.leftColumnWidth,
    options === DEFAULT_OPTIONS ? null : options,
  ]);

  const totalPages = pages.length;

  return {
    pages,
    totalPages,
  };
}

export default useDocumentPages;
