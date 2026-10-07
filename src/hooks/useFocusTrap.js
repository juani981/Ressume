/**
 * src/hooks/useFocusTrap.js
 *
 * Reusable WCAG AA focus trap and modal keyboard lifecycle hook.
 * Traps Tab and Shift+Tab within the container element, manages initial focus,
 * triggers onClose on Escape key, and restores focus upon modal closing.
 */

import { useEffect, useRef, useCallback } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
  '[role="button"]:not([disabled])',
].join(', ');

/**
 * Filter for elements that are currently visible and focusable in the DOM.
 */
function isElementVisible(el) {
  if (!el) return false;
  return Boolean(
    el.offsetWidth ||
    el.offsetHeight ||
    el.getClientRects().length ||
    (typeof window !== 'undefined' && window.getComputedStyle(el).visibility !== 'hidden')
  );
}

/**
 * useFocusTrap hook
 *
 * @param {React.RefObject<HTMLElement>} containerRef - Ref to the modal dialog/container
 * @param {Object} options
 * @param {boolean} [options.isOpen=true] - Whether the modal/dialog is currently active
 * @param {Function} [options.onClose] - Callback when Escape key is pressed
 * @param {React.RefObject<HTMLElement>} [options.initialFocusRef] - Optional element to receive initial focus
 * @param {React.RefObject<HTMLElement>} [options.returnFocusRef] - Optional element to receive focus on close
 */
export function useFocusTrap(containerRef, {
  isOpen = true,
  onClose,
  initialFocusRef,
  returnFocusRef,
} = {}) {
  const previouslyFocusedElementRef = useRef(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef?.current) return [];
    const elements = Array.from(
      containerRef.current.querySelectorAll(FOCUSABLE_SELECTOR)
    );
    return elements.filter((el) => !el.hasAttribute('disabled') && isElementVisible(el));
  }, [containerRef]);

  useEffect(() => {
    if (!isOpen) return;

    // 1. Capture previously focused element before moving focus into dialog
    if (typeof document !== 'undefined' && document.activeElement) {
      previouslyFocusedElementRef.current = document.activeElement;
    }

    // 2. Set initial focus after current tick/render
    const focusTimer = setTimeout(() => {
      if (!containerRef?.current) return;

      if (initialFocusRef?.current && isElementVisible(initialFocusRef.current)) {
        initialFocusRef.current.focus();
        return;
      }

      const focusables = getFocusableElements();
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        if (!containerRef.current.hasAttribute('tabindex')) {
          containerRef.current.setAttribute('tabindex', '-1');
        }
        containerRef.current.focus();
      }
    }, 16);

    // 3. Keydown listener for Tab cycling and Escape dismissal (bubble phase so child inputs can stop propagation)
    const handleKeyDown = (e) => {
      if (e.defaultPrevented) return;

      if (e.key === 'Escape') {
        if (typeof onClose === 'function') {
          e.preventDefault();
          e.stopPropagation();
          onClose(e);
        }
        return;
      }

      if (e.key === 'Tab') {
        const focusables = getFocusableElements();
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];
        const activeEl = document.activeElement;

        if (e.shiftKey) {
          // Shift + Tab: if on first element or outside container, loop to last
          if (activeEl === firstElement || !containerRef.current.contains(activeEl)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: if on last element or outside container, loop to first
          if (activeEl === lastElement || !containerRef.current.contains(activeEl)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, false);

    // 4. Cleanup and focus restoration upon close/unmount
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown, false);

      const targetToRestore =
        returnFocusRef?.current || previouslyFocusedElementRef.current;

      if (targetToRestore && typeof targetToRestore.focus === 'function') {
        // Small delay to allow react unmount to settle cleanly
        setTimeout(() => {
          if (typeof document !== 'undefined' && document.contains(targetToRestore)) {
            targetToRestore.focus();
          }
        }, 16);
      }
    };
  }, [isOpen, onClose, initialFocusRef, returnFocusRef, containerRef, getFocusableElements]);
}

export default useFocusTrap;
