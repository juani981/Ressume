import { afterEach, describe, expect, it } from 'vitest';
import { preloadFonts } from '../utils/fontPreloader';

describe('font preloader Google Fonts URL', () => {
  afterEach(() => {
    document.querySelectorAll(
      'link[href*="fonts.googleapis.com/css2"][rel="preload"], link[href="https://fonts.gstatic.com"][rel="preconnect"]'
    ).forEach(link => link.remove());
  });

  it('builds a valid combined Merriweather italics and weights axis', () => {
    preloadFonts();

    const preloadLink = document.querySelector(
      'link[href*="fonts.googleapis.com/css2"][rel="preload"]'
    );
    expect(preloadLink).not.toBeNull();

    const fontUrl = new URL(preloadLink.href);
    const families = fontUrl.searchParams.getAll('family');
    expect(families).toContain(
      'Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400'
    );
    expect(fontUrl.searchParams.get('display')).toBe('swap');
  });
});
