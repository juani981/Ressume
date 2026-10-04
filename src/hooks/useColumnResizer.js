/**
 * useColumnResizer.js
 *
 * Custom React hook managing the interactive two-column divider resizer state,
 * mouse/touch movement tracking, boundary clamping (20% to 55%), and DOM styling.
 */

import { useState, useCallback } from 'react';
import { COLUMN_RESIZER_LIMITS } from '../constants/geometry';

/**
 * Manages dragging interaction for resizing two-column layout proportions.
 *
 * @param {Object} options
 * @param {React.RefObject<HTMLElement>} options.areaCvRef - Ref to the root CV paper element
 * @param {Function} options.onResize - Callback receiving the clamped width percentage (e.g. 33)
 * @param {number} [options.minPercent=COLUMN_RESIZER_LIMITS.minPercent] - Lower boundary limit for left column percentage
 * @param {number} [options.maxPercent=COLUMN_RESIZER_LIMITS.maxPercent] - Upper boundary limit for left column percentage
 * @param {number} [options.initialLeftWidth=COLUMN_RESIZER_LIMITS.defaultPercent] - Initial or current left column width
 * @returns {{
 *   isResizing: boolean,
 *   startResizing: (e: any) => void,
 *   handleResizerMouseDown: (e: any) => void,
 *   leftWidth: number
 * }}
 */
export function useColumnResizer({
  areaCvRef,
  onResize,
  minPercent = COLUMN_RESIZER_LIMITS.minPercent,
  maxPercent = COLUMN_RESIZER_LIMITS.maxPercent,
  initialLeftWidth = COLUMN_RESIZER_LIMITS.defaultPercent,
}) {
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback(
    (e) => {
      if (e?.preventDefault) e.preventDefault();
      if (!areaCvRef?.current) return;

      setIsResizing(true);

      const handleMove = (moveEvent) => {
        if (!areaCvRef?.current) return;
        const rect = areaCvRef.current.getBoundingClientRect();
        const clientX =
          moveEvent.clientX ??
          (moveEvent.touches && moveEvent.touches[0]
            ? moveEvent.touches[0].clientX
            : 0);
        const offsetX = clientX - rect.left;
        const rawPercent = (offsetX / rect.width) * 100;
        const clamped = Math.round(
          Math.min(maxPercent, Math.max(minPercent, rawPercent)),
        );
        if (typeof onResize === 'function') {
          onResize(clamped);
        }
      };

      const handleUp = () => {
        setIsResizing(false);
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleUp);
        if (typeof document !== 'undefined') {
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        }
      };

      if (typeof document !== 'undefined') {
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      }
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleUp);
    },
    [areaCvRef, onResize, minPercent, maxPercent],
  );

  return {
    isResizing,
    startResizing,
    handleResizerMouseDown: startResizing,
    leftWidth: initialLeftWidth,
  };
}

export default useColumnResizer;
