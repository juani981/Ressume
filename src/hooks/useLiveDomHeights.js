/**
 * useLiveDomHeights.js
 *
 * Measures real rendered DOM geometry (bounding rect + margins) for section headers,
 * items, and bullets directly from the mounted #area-cv container.
 * Feeds exact subpixel dimensions into the deterministic page distributor
 * to eliminate artificial whitespace gaps without heuristic guessing.
 *
 * Implements strict stabilization to prevent re-render cascades and ping-pong loops.
 */

import { useState, useRef, useLayoutEffect, useCallback } from 'react';

/**
 * Extracts outer height (bounding client rect height + computed vertical margins) in CSS pixels.
 *
 * @param {Element} element
 * @returns {number} Outer height in px rounded to nearest integer
 */
function getOuterHeight(element) {
  if (!element || typeof element.getBoundingClientRect !== 'function') return 0;
  const rect = element.getBoundingClientRect();
  if (rect.height <= 0) return 0;

  if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
    const style = window.getComputedStyle(element);
    const marginTop = parseFloat(style.marginTop) || 0;
    const marginBottom = parseFloat(style.marginBottom) || 0;
    return Math.round(rect.height + marginTop + marginBottom);
  }

  return Math.round(rect.height);
}

/**
 * Hook to extract and maintain live DOM element heights for exact A4 page partitioning.
 *
 * @param {React.RefObject<HTMLElement>} containerRef - Ref pointing to #area-cv
 * @param {Array<any>} [deps=[]] - State dependencies triggering re-measurement
 * @returns {Record<string, number>} Map of measured element heights keyed by ID
 */
export function useLiveDomHeights(containerRef, deps = []) {
  const [measuredHeights, setMeasuredHeights] = useState({});
  const heightsRef = useRef({});
  const rafIdRef = useRef(null);

  const measure = useCallback(() => {
    const container = containerRef?.current;
    if (!container || typeof container.querySelectorAll !== 'function') return;

    const nextHeights = {};
    let hasChanged = false;

    // 1. Measure section headers: [data-section-title]
    const headerNodes = container.querySelectorAll('[data-section-title]');
    headerNodes.forEach((node) => {
      const secId = node.getAttribute('data-section-title');
      if (secId) {
        const h = getOuterHeight(node);
        if (h > 0) {
          const key = `header_${secId}`;
          nextHeights[key] = h;
          if (Math.abs((heightsRef.current[key] || 0) - h) >= 1) {
            hasChanged = true;
          }
        }
      }
    });

    // 2. Measure section items and bullets: [data-item-id]
    const itemNodes = container.querySelectorAll('[data-item-id]');
    itemNodes.forEach((node) => {
      const itemId = node.getAttribute('data-item-id');
      if (itemId) {
        const h = getOuterHeight(node);
        if (h > 0) {
          nextHeights[itemId] = h;
          if (Math.abs((heightsRef.current[itemId] || 0) - h) >= 1) {
            hasChanged = true;
          }
        }
      }
    });

    // 3. Measure item base blocks (title/company/desc without bullets): [data-item-base-id]
    const baseNodes = container.querySelectorAll('[data-item-base-id]');
    baseNodes.forEach((node) => {
      const baseId = node.getAttribute('data-item-base-id');
      if (baseId) {
        const h = getOuterHeight(node);
        if (h > 0) {
          const key = `base_${baseId}`;
          nextHeights[key] = h;
          if (Math.abs((heightsRef.current[key] || 0) - h) >= 1) {
            hasChanged = true;
          }
        }
      }
    });

    if (hasChanged) {
      heightsRef.current = nextHeights;
      setMeasuredHeights(nextHeights);
    }
  }, [containerRef]);

  // Measure synchronously after layout changes
  useLayoutEffect(() => {
    measure();
  }, [measure, ...deps]);

  // ResizeObserver to detect font downloads, line wrapping, and viewport changes
  useLayoutEffect(() => {
    const container = containerRef?.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(() => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        measure();
      });
    });

    ro.observe(container);

    return () => {
      ro.disconnect();
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [containerRef, measure]);

  return measuredHeights;
}

export default useLiveDomHeights;
