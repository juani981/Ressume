/**
 * useDocumentPages.js
 *
 * Reactive hook that partitions CV sections and items into discrete A4 PageModels
 * using the pure deterministic distributor (pageDistributor.js).
 *
 * Features:
 * - Google Docs-style real-time page flow with empirical DOM measurement calibration.
 * - Omission of repeated continuation headers for seamless flow across pages.
 * - Dynamic recalculation when scale sliders change (fontScale, lineHeight, pagePadding, etc.).
 * - Support for 2-column and 1-column / ATS layout modes.
 * - Single source of truth: returns immutable PageModel[] matching Invariant Rules 15 & 16.
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import { distributeSectionsToPages } from '../utils/pageDistributor';
import { A4_PAGE_HEIGHT_PX, DEFAULT_PAGE_PADDING } from '../constants';

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
export function useDocumentPages({ cvData, options = {} }) {
  const layout = cvData?.layout || {};
  const sections = cvData?.sections || [];
  const [measuredHeights, setMeasuredHeights] = useState({});
  const [measuredItemHeights, setMeasuredItemHeights] = useState({});
  const measurementCacheRef = useRef({ sections: {}, items: {} });

  // Real-Time DOM Geometry Calibration Loop (Google Docs-Style Feedback)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    let timeoutId = null;
    const updateMeasurements = () => {
      const areaCv = document.getElementById('area-cv');
      if (!areaCv) return;

      const newSecHeights = {};
      const newItemHeights = {};
      let secChanged = false;
      let itemChanged = false;

      sections.forEach((sec) => {
        if (!sec || !sec.id) return;
        const secEl = areaCv.querySelector(`[data-section-id="${sec.id}"]`);
        if (secEl) {
          const rect = secEl.getBoundingClientRect();
          const measuredH = Math.round(rect.height);
          if (measuredH > 0 && Math.abs((measurementCacheRef.current.sections[sec.id] || 0) - measuredH) > 3) {
            newSecHeights[sec.id] = measuredH;
            measurementCacheRef.current.sections[sec.id] = measuredH;
            secChanged = true;
          }
        }

        if (Array.isArray(sec.items)) {
          sec.items.forEach((it) => {
            if (!it || !it.id) return;
            const itEl = areaCv.querySelector(`[data-item-id="${it.id}"]`);
            if (itEl) {
              const rect = itEl.getBoundingClientRect();
              const measuredH = Math.round(rect.height);
              if (measuredH > 0 && Math.abs((measurementCacheRef.current.items[it.id] || 0) - measuredH) > 3) {
                newItemHeights[it.id] = measuredH;
                measurementCacheRef.current.items[it.id] = measuredH;
                itemChanged = true;
              }
            }
          });
        }
      });

      if (secChanged) {
        setMeasuredHeights((prev) => ({ ...prev, ...newSecHeights }));
      }
      if (itemChanged) {
        setMeasuredItemHeights((prev) => ({ ...prev, ...newItemHeights }));
      }
    };

    timeoutId = setTimeout(updateMeasurements, 50);

    const observer = new ResizeObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateMeasurements, 80);
    });

    const areaCv = document.getElementById('area-cv');
    if (areaCv) {
      observer.observe(areaCv);
    }

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [sections, layout]);

  const pages = useMemo(() => {
    const distributionOptions = {
      // User decision: Items continue directly without repeating continuation header
      omitContinuationHeader: true,
      omitContinuationTitle: true,
      uniqueContinuationIds: true,

      // Dynamic geometry, typography, and slider tokens
      pageHeightPx: options.pageHeightPx ?? A4_PAGE_HEIGHT_PX,
      pagePaddingPx: options.pagePaddingPx ?? layout.pagePadding ?? DEFAULT_PAGE_PADDING,
      fontScale: options.fontScale ?? layout.fontScale ?? 1.0,
      titleScale: options.titleScale ?? layout.titleScale ?? 1.0,
      bodyScale: options.bodyScale ?? layout.bodyScale ?? 1.0,
      listScale: options.listScale ?? layout.listScale ?? 1.0,
      lineHeight: options.lineHeight ?? layout.lineHeight ?? 1.45,
      sectionGapPx: options.sectionGapPx ?? layout.sectionGap ?? 20,
      itemGapPx: options.itemGapPx ?? layout.itemGap ?? 8,
      leftColumnWidth: options.leftColumnWidth ?? layout.leftColumnWidth ?? 32,
      fontFamily: options.fontFamily ?? layout.fontFamily ?? 'Inter',
      photoSize: options.photoSize ?? layout.photoSize,

      // Dynamic measured heights from DOM feedback loop
      measuredHeights,
      measuredItemHeights,
      editorHeadroom: options.editorHeadroom ?? layout.editorHeadroom ?? 80,

      // Mode resolution
      isAtsMode: options.isAtsMode ?? Boolean(layout.isAtsMode === true || layout.type === '1-column'),
      mode: options.mode ?? (layout.isAtsMode === true || layout.type === '1-column' ? 'ats' : '2-column'),
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
    layout.fontFamily,
    layout.photoSize,
    layout.editorHeadroom,
    measuredHeights,
    measuredItemHeights,
    options,
  ]);

  const totalPages = pages.length;

  return {
    pages,
    totalPages,
  };
}

export default useDocumentPages;
