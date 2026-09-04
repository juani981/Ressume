/**
 * disableNativeTooltips.js
 * 
 * ONE SINGLE global rule to disable native browser tooltips across the entire application.
 * 
 * How it works:
 * Browsers show their unstyled native OS tooltip exclusively when an element has a non-empty
 * `title` attribute on hover.
 * 
 * By attaching a single global capture listener on `document`:
 * 1. On `mouseover`, if the target (or any ancestor) has a `title` attribute, we move it
 *    to `data-native-title` and ensure `aria-label` is set (for accessibility). We remove `title`
 *    so the browser's native tooltip timer never triggers.
 * 2. On `mouseout`, when the pointer leaves the element, we restore `title` from `data-native-title`.
 */

export function setupDisableNativeTooltips() {
  if (typeof document === 'undefined') return;

  // Prevent duplicate registration
  if (window.__ressume_native_tooltips_disabled) return;
  window.__ressume_native_tooltips_disabled = true;

  document.addEventListener(
    'mouseover',
    (e) => {
      const el = e.target?.closest?.('[title]');
      if (el) {
        const titleVal = el.getAttribute('title');
        if (titleVal) {
          el.setAttribute('data-native-title', titleVal);
          if (!el.getAttribute('aria-label')) {
            el.setAttribute('aria-label', titleVal);
          }
          el.removeAttribute('title');
        }
      }
    },
    true
  );

  document.addEventListener(
    'mouseout',
    (e) => {
      const el = e.target?.closest?.('[data-native-title]');
      if (el && el.hasAttribute('data-native-title')) {
        const related = e.relatedTarget;
        // Only restore when mouse truly leaves the element
        if (!related || !el.contains(related)) {
          const originalTitle = el.getAttribute('data-native-title');
          if (originalTitle) {
            el.setAttribute('title', originalTitle);
          }
          el.removeAttribute('data-native-title');
        }
      }
    },
    true
  );
}
