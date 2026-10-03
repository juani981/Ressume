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

import { useMemo } from 'react';
import { distributeSectionsToPages } from '../utils/pageDistributor';
import { A4_PAGE_HEIGHT_PX, DEFAULT_PAGE_PADDING, DEFAULT_LINE_HEIGHT } from '../constants';

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

  const pages = useMemo(() => {
    const distributionOptions = {
      // User decision: Items continue directly without repeating continuation header
      omitContinuationHeader: true,
      omitContinuationTitle: true,
      uniqueContinuationIds: true,

      // Dynamic geometry and slider tokens
      pageHeightPx: options.pageHeightPx ?? A4_PAGE_HEIGHT_PX,
      pagePaddingPx: options.pagePaddingPx ?? layout.pagePadding ?? DEFAULT_PAGE_PADDING,
      fontScale: options.fontScale ?? layout.fontScale ?? 1.0,
      titleScale: options.titleScale ?? layout.titleScale ?? 1.0,
      bodyScale: options.bodyScale ?? layout.bodyScale ?? 1.0,
      listScale: options.listScale ?? layout.listScale ?? 1.0,
      lineHeight: options.lineHeight ?? layout.lineHeight ?? DEFAULT_LINE_HEIGHT,
      sectionGapPx: options.sectionGapPx ?? layout.sectionGap ?? 20,
      itemGapPx: options.itemGapPx ?? layout.itemGap ?? 8,

      // Mode resolution
      isAtsMode: options.isAtsMode ?? Boolean(layout.isAtsMode === true || layout.type === '1-column'),
      mode: options.mode ?? (layout.isAtsMode === true || layout.type === '1-column' ? 'ats' : '2-column'),
      leftColumnWidth: options.leftColumnWidth ?? layout.leftColumnWidth,
      isEditor: true,

      // User overrides
      ...options,
    };

    return distributeSectionsToPages(cvData, distributionOptions);
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
