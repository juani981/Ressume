/**
 * usePaginationEngine.js
 *
 * Custom React hook encapsulating A4 pagination calculation, multi-pass breaking,
 * ResizeObserver attachment, live resize event listening, RAF scheduling, and cooldown debouncing.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { executePaginationAlgorithm } from '../utils/paginationEngine';
import { A4_GAP_PX } from '../utils/pageGeometry';

/**
 * Hook to manage live editor pagination and page break coordination.
 *
 * @param {Object} options
 * @param {React.RefObject<HTMLElement>} options.areaCvRef - Ref to the #area-cv DOM element
 * @param {Object} options.cvData - Current CV data model
 * @param {Function} [options.setContextTotalPages] - Context updater for global page count
 * @param {Object|null} [options.activeDragItem] - Currently dragged item (suspends recalc if non-null)
 * @param {Object|null} [options.activeDragSection] - Currently dragged section (suspends recalc if non-null)
 * @param {any} [options.paginationTrigger] - Context trigger token for forced recalculation
 * @returns {{
 *   totalPages: number,
 *   pageCount: number,
 *   pageBreaks: number[],
 *   recalculatePages: () => void,
 *   recalculatePagination: () => void,
 *   isRecalculating: boolean
 * }}
 */
export function usePaginationEngine({
  areaCvRef,
  cvData,
  setContextTotalPages,
  activeDragItem = null,
  activeDragSection = null,
  paginationTrigger,
}) {
  const [totalPages, setTotalPages] = useState(1);
  const [pageBreaks, setPageBreaks] = useState([]);
  const [isRecalculatingState, setIsRecalculatingState] = useState(false);

  const isRecalculatingRef = useRef(false);
  const pendingRecalcRef = useRef(false);
  const rafIdRef = useRef(null);

  const recalculatePagination = useCallback(() => {
    if (!areaCvRef?.current) return;
    if (activeDragItem || activeDragSection) return;

    const areaCv = areaCvRef.current;
    const { totalPages: newPages, pageBreaks: newBreaks } =
      executePaginationAlgorithm({
        areaCv,
        cvData,
        gapPx: A4_GAP_PX,
      });

    setTotalPages((prev) => (prev !== newPages ? newPages : prev));
    setPageBreaks(newBreaks);

    if (typeof setContextTotalPages === 'function') {
      setContextTotalPages(newPages);
    }
  }, [areaCvRef, cvData, activeDragItem, activeDragSection, setContextTotalPages]);

  const schedulePaginationRecalc = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      // 1. If calculation already in progress, flag pending recalculation and return
      if (isRecalculatingRef.current) {
        pendingRecalcRef.current = true;
        return;
      }

      try {
        isRecalculatingRef.current = true;
        setIsRecalculatingState(true);
        recalculatePagination();
      } finally {
        // 2. 30ms cooldown to avoid layout thrashing
        setTimeout(() => {
          isRecalculatingRef.current = false;
          setIsRecalculatingState(false);
          // 3. Trailing call: if events were queued during calculation, re-run
          if (pendingRecalcRef.current) {
            pendingRecalcRef.current = false;
            schedulePaginationRecalc();
          }
        }, 30);
      }
    });
  }, [recalculatePagination]);

  // 1. Trigger when cvData, drag status, or context paginationTrigger changes
  useEffect(() => {
    schedulePaginationRecalc();
  }, [cvData, activeDragItem, activeDragSection, paginationTrigger, schedulePaginationRecalc]);

  // 2. Real-time Live Resize Event listener (fired on spacer drag or keydown)
  useEffect(() => {
    const handleLiveResize = () => {
      schedulePaginationRecalc();
    };
    window.addEventListener('cv-spacer-live-resize', handleLiveResize);
    return () => window.removeEventListener('cv-spacer-live-resize', handleLiveResize);
  }, [schedulePaginationRecalc]);

  // 3. ResizeObserver on #area-cv and columns for dimensional mutations
  useEffect(() => {
    const areaCv = areaCvRef?.current;
    if (!areaCv || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      if (!isRecalculatingRef.current) {
        schedulePaginationRecalc();
      }
    });

    observer.observe(areaCv);
    const leftCol = areaCv.querySelector('.resume__left');
    const rightCol = areaCv.querySelector('.resume__right');
    if (leftCol) observer.observe(leftCol);
    if (rightCol) observer.observe(rightCol);

    return () => {
      observer.disconnect();
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [areaCvRef, schedulePaginationRecalc]);

  return {
    totalPages,
    pageCount: totalPages,
    pageBreaks,
    recalculatePages: schedulePaginationRecalc,
    recalculatePagination,
    isRecalculating: isRecalculatingState,
  };
}

export default usePaginationEngine;
