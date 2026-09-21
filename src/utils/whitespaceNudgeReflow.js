/**
 * whitespaceNudgeReflow.js
 *
 * Reflow hack:
 * Upon releasing/dropping a dragged element in drag-and-drop,
 * dynamically resizes whitespace (both spacer sections and the global sectionGap)
 * by +1px, and immediately restores it -1px back on the subsequent frame.
 * This triggers a browser layout pass and forces all elements and page break
 * calculations to settle with precise dimensions.
 */

let nudgeTimeoutId = null;

/**
 * Triggers a momentary +1px / -1px whitespace adjustment to force layout reflow.
 */
export function triggerWhitespaceNudge() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const areaCv = document.getElementById('area-cv');
  if (!areaCv) return;

  if (nudgeTimeoutId) {
    clearTimeout(nudgeTimeoutId);
    nudgeTimeoutId = null;
  }

  // 1. Locate any spacer sections in the document
  const spacerElements = Array.from(
    areaCv.querySelectorAll('.spacer-section, [data-spacer-height]')
  );

  // Store original heights
  const originalHeights = spacerElements.map((el) => {
    const orig =
      parseFloat(el.getAttribute('data-spacer-height')) ||
      parseFloat(el.style.height) ||
      el.offsetHeight ||
      40;
    return { el, orig };
  });

  // Step 1: Expand whitespace by +1px
  originalHeights.forEach(({ el, orig }) => {
    el.style.setProperty('height', `${orig + 1}px`, 'important');
    el.style.setProperty('min-height', `${orig + 1}px`, 'important');
  });

  // Also nudge CSS custom property --section-gap on #area-cv by +1px
  const computedGap =
    parseFloat(getComputedStyle(areaCv).getPropertyValue('--section-gap')) || 20;
  areaCv.style.setProperty('--section-gap', `${computedGap + 1}px`);

  // Dispatch live resize event
  window.dispatchEvent(new CustomEvent('cv-spacer-live-resize'));

  // Step 2: In the next tick (~25ms), return whitespace 1px back
  nudgeTimeoutId = setTimeout(() => {
    originalHeights.forEach(({ el, orig }) => {
      el.style.setProperty('height', `${orig}px`, 'important');
      el.style.setProperty('min-height', `${orig}px`, 'important');
    });

    areaCv.style.removeProperty('--section-gap');

    // Dispatch final events so observers and pagination recalculate accurately
    window.dispatchEvent(new CustomEvent('cv-spacer-live-resize'));
    window.dispatchEvent(new Event('resize'));
    nudgeTimeoutId = null;
  }, 25);
}

export default triggerWhitespaceNudge;
