/**
 * fontPreloader.js
 * 
 * Preloads Google Fonts used in PDF generation asynchronously on app startup.
 * This ensures fonts are cached before the user clicks download/preview,
 * eliminating the font loading delay during PDF generation.
 * 
 * Fonts used in print:
 * - Inter (400, 500, 600, 700)
 * - JetBrains Mono (400, 500, 600, 700)
 * - Merriweather (300, 400, 700; italic 300, 400)
 * - Poppins (400, 500, 600, 700)
 * - Roboto (400, 500, 700)
 */

// Font families and weights used in print (matching printFonts.js and index.html)
const PRINT_FONTS = [
  { family: 'Inter', weights: [400, 500, 600, 700], display: 'swap' },
  { family: 'JetBrains Mono', weights: [400, 500, 600, 700], display: 'swap' },
  { family: 'Merriweather', weights: [300, 400, 700], italic: [300, 400], display: 'swap' },
  { family: 'Poppins', weights: [400, 500, 600, 700], display: 'swap' },
  { family: 'Roboto', weights: [400, 500, 700], display: 'swap' },
];

/**
 * Builds Google Fonts CSS URL for preloading
 */
function buildGoogleFontsUrl() {
  const families = PRINT_FONTS.map(font => {
    const weightStr = font.weights.join(';');
    let str = `${font.family.replace(/\s+/g, '+')}:wght@${weightStr}`;
    if (font.italic && font.italic.length > 0) {
      const italicStr = font.italic.join(';');
      str += `;ital,wght@${italicStr}`;
    }
    return str;
  }).join('&family=');
  
  return `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
}

/**
 * Preloads fonts by creating a link rel="preload" for the Google Fonts CSS
 * This is the most efficient way to ensure fonts are cached before use
 */
export function preloadFonts() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  
  // Check if already preloaded
  if (document.querySelector('link[href*="fonts.googleapis.com/css2"][rel="preload"]')) {
    return;
  }
  
  const url = buildGoogleFontsUrl();
  
  // Create preload link
  const preloadLink = document.createElement('link');
  preloadLink.rel = 'preload';
  preloadLink.as = 'style';
  preloadLink.href = url;
  preloadLink.crossOrigin = 'anonymous';
  
  // Also add preconnect if not present
  if (!document.querySelector('link[href="https://fonts.gstatic.com"][rel="preconnect"]')) {
    const preconnectGstatic = document.createElement('link');
    preconnectGstatic.rel = 'preconnect';
    preconnectGstatic.href = 'https://fonts.gstatic.com';
    preconnectGstatic.crossOrigin = 'anonymous';
    document.head.appendChild(preconnectGstatic);
  }
  
  document.head.appendChild(preloadLink);
}

/**
 * Alternative: Preload using Font Loading API for individual font faces
 * This gives more control but is more complex
 */
export async function preloadFontsViaFontFace() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  
  const fonts = PRINT_FONTS.flatMap(font => {
    const faces = [];
    for (const weight of font.weights) {
      faces.push({
        family: font.family,
        weight: weight.toString(),
        style: 'normal'
      });
    }
    if (font.italic) {
      for (const weight of font.italic) {
        faces.push({
          family: font.family,
          weight: weight.toString(),
          style: 'italic'
        });
      }
    }
    return faces;
  });
  
  const loadPromises = fonts.map(font => {
    try {
      return document.fonts.load(`1em ${font.family}`, {
        weight: font.weight,
        style: font.style
      });
    } catch (_) {
      return Promise.resolve();
    }
  });
  
  try {
    await Promise.allSettled(loadPromises);
  } catch (_) {
    // Silently ignore - font loading is best effort
  }
}

/**
 * Main entry point - call this on app startup
 * Uses both preload link and Font Loading API for maximum compatibility
 */
export function initializeFontPreloading() {
  if (typeof window === 'undefined') return;
  
  // Use requestIdleCallback for non-blocking preload
  const schedulePreload = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(preloadFonts, { timeout: 2000 });
    } else {
      // Fallback: schedule after a short delay
      setTimeout(preloadFonts, 100);
    }
  };
  
  // Start preloading after initial render
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedulePreload, { once: true });
  } else {
    schedulePreload();
  }
}

export default { preloadFonts, preloadFontsViaFontFace, initializeFontPreloading };
