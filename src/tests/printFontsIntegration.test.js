import { describe, it, expect } from 'vitest';
import { STATIC_PRINT_FONTS_CSS } from '../services/print/printFonts';
import { generateCleanPrintHTML } from '../services/print/cleanHtmlGenerator';

describe('Print Fonts Integration & Cairo ATS Text Preservation', () => {
  it('defines explicit static TrueType @font-face rules for Inter weights 400, 500, 600, 700', () => {
    expect(STATIC_PRINT_FONTS_CSS).toContain("font-family: 'Inter'");
    expect(STATIC_PRINT_FONTS_CSS).toMatch(/font-family:\s*'Inter'[\s\S]*?font-weight:\s*400[\s\S]*?format\('truetype'\)/);
    expect(STATIC_PRINT_FONTS_CSS).toMatch(/font-family:\s*'Inter'[\s\S]*?font-weight:\s*500[\s\S]*?format\('truetype'\)/);
    expect(STATIC_PRINT_FONTS_CSS).toMatch(/font-family:\s*'Inter'[\s\S]*?font-weight:\s*600[\s\S]*?format\('truetype'\)/);
    expect(STATIC_PRINT_FONTS_CSS).toMatch(/font-family:\s*'Inter'[\s\S]*?font-weight:\s*700[\s\S]*?format\('truetype'\)/);
  });

  it('defines explicit static TrueType @font-face rules for JetBrains Mono weights 400, 500, 600, 700', () => {
    expect(STATIC_PRINT_FONTS_CSS).toContain("font-family: 'JetBrains Mono'");
    expect(STATIC_PRINT_FONTS_CSS).toMatch(/font-family:\s*'JetBrains Mono'[\s\S]*?font-weight:\s*400[\s\S]*?format\('truetype'\)/);
    expect(STATIC_PRINT_FONTS_CSS).toMatch(/font-family:\s*'JetBrains Mono'[\s\S]*?font-weight:\s*500[\s\S]*?format\('truetype'\)/);
    expect(STATIC_PRINT_FONTS_CSS).toMatch(/font-family:\s*'JetBrains Mono'[\s\S]*?font-weight:\s*600[\s\S]*?format\('truetype'\)/);
    expect(STATIC_PRINT_FONTS_CSS).toMatch(/font-family:\s*'JetBrains Mono'[\s\S]*?font-weight:\s*700[\s\S]*?format\('truetype'\)/);
  });

  it('guarantees clean HTML output contains the static print font rules in cv-base-styles', () => {
    const html = generateCleanPrintHTML({
      profile: { name: 'Juan Ignacio Carrizo' },
      layout: { fontFamily: 'Inter' }
    });

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const baseStyles = doc.getElementById('cv-base-styles');

    expect(baseStyles).not.toBeNull();
    expect(baseStyles.textContent).toContain("font-family: 'Inter'");
    expect(baseStyles.textContent).toContain("format('truetype')");
    expect(baseStyles.textContent).toContain("font-weight: 700");
  });
});
