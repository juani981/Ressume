/**
 * printFonts.js
 *
 * Dedicated static TrueType font-face definitions for print and PDF generation.
 *
 * Problem:
 * Google Fonts serves 'Inter' and 'JetBrains Mono' as variable font WOFF2 files to modern
 * browser user agents. When printing to PDF 1.7 via Cairo (used by Zen Browser and Gecko on Linux),
 * Cairo cannot instance variable font axes (weights 600, 700). Consequently, Cairo synthesizes
 * bold text by drawing geometric Bézier curves (c operators), which completely strips the text
 * from the PDF text layer (rendering headers and titles invisible to ATS parsers and text extractors).
 *
 * Solution:
 * In the print document iframe and static clean print HTML, inject explicit @font-face declarations
 * pointing to individual static TrueType (.ttf) files per weight (400, 500, 600, 700).
 * This forces Cairo to embed independent TrueType subsets and emit standard Tj/TJ text operators.
 */

export const STATIC_PRINT_FONTS_CSS = `
/* Static Inter TrueType fonts for Cairo/Gecko PDF print parity */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf') format('truetype');
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fMZg.ttf') format('truetype');
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf') format('truetype');
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf') format('truetype');
}

/* Static JetBrains Mono TrueType fonts for Cairo/Gecko PDF print parity */
@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPQ.ttf') format('truetype');
}
@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8-qxjPQ.ttf') format('truetype');
}
@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8FqtjPQ.ttf') format('truetype');
}
@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8L6tjPQ.ttf') format('truetype');
}
`;
