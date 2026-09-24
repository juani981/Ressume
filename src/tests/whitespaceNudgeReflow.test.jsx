/**
 * whitespaceNudgeReflow.test.jsx
 *
 * Tests the reflow hack for drag-and-drop:
 * Momentarily resizing whitespace (spacer section height and CSS variable --section-gap)
 * by +1px and returning it -1px back on the subsequent frame to force the browser layout
 * to settle with accurate dimensions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { triggerWhitespaceNudge } from '../utils/whitespaceNudgeReflow';

describe('triggerWhitespaceNudge', () => {
  let areaCv;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    areaCv = document.createElement('div');
    areaCv.id = 'area-cv';
    areaCv.style.setProperty('--section-gap', '20px');
    document.body.appendChild(areaCv);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1. Nudges --section-gap on #area-cv by +1px immediately and dispatches cv-spacer-live-resize', () => {
    const liveResizeListener = vi.fn();
    window.addEventListener('cv-spacer-live-resize', liveResizeListener);

    triggerWhitespaceNudge();

    // Immediate state: +1px
    expect(areaCv.style.getPropertyValue('--section-gap')).toBe('21px');
    expect(liveResizeListener).toHaveBeenCalled();

    window.removeEventListener('cv-spacer-live-resize', liveResizeListener);
  });

  it('2. Nudges spacer elements with .spacer-section by +1px immediately', () => {
    const spacer = document.createElement('div');
    spacer.className = 'cv-section cv-block spacer-section';
    spacer.setAttribute('data-spacer-height', '40');
    spacer.style.height = '40px';
    areaCv.appendChild(spacer);

    triggerWhitespaceNudge();

    expect(spacer.style.height).toBe('41px');
  });

  it('3. Restores --section-gap and spacer height 1px back on subsequent frame', () => {
    const spacer = document.createElement('div');
    spacer.className = 'cv-section cv-block spacer-section';
    spacer.setAttribute('data-spacer-height', '40');
    spacer.style.height = '40px';
    areaCv.appendChild(spacer);

    const resizeListener = vi.fn();
    window.addEventListener('resize', resizeListener);

    triggerWhitespaceNudge();

    // Advance timers for RAF and timeout
    vi.runAllTimers();

    // Restored: inline --section-gap removed, spacer back to 40px
    expect(areaCv.style.getPropertyValue('--section-gap')).toBe('');
    expect(spacer.style.height).toBe('40px');
    expect(resizeListener).toHaveBeenCalled();

    window.removeEventListener('resize', resizeListener);
  });
});
