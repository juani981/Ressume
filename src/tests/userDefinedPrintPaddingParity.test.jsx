import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { A4PageBox } from '../components/CV/A4PageBox';
import {
  generateCleanPrintHTML,
  generateLayoutVariablesCSS,
  executeCleanPrint,
} from '../utils/staticHtmlPdfEngine';
import printStyles from '../styles/print.css?raw';
import { defaultSchema } from '../utils/schema';

describe('User-Defined Print Margin & Page Padding Parity', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it('1. print.css does NOT crush .resume__single-column padding to 0, preserving var(--page-padding)', () => {
    // Verify #area-cv.resume__single-column uses var(--page-padding, 24px)
    expect(printStyles).toMatch(
      /#area-cv\.resume__single-column[\s\S]*?padding:\s*var\(--page-padding,\s*24px\)\s*!important/
    );
    // Verify .resume__single-column outside of #area-cv inner wrapper does not crush to 0
    expect(printStyles).not.toMatch(
      /\.resume__single-column,\s*#area-cv\s*\.resume__single-column\s*\{\s*padding:\s*0\s*!important;/
    );
  });

  it('2. generateLayoutVariablesCSS accurately exports custom pagePadding to --page-padding', () => {
    const css = generateLayoutVariablesCSS({ pagePadding: 42 });
    expect(css).toContain('--page-padding: 42px;');
  });

  it('3. ATS 1-column mode in generateCleanPrintHTML applies user-defined pagePadding token', () => {
    const customData = {
      ...defaultSchema,
      layout: {
        ...defaultSchema.layout,
        type: '1-column',
        isAtsMode: true,
        pagePadding: 36,
      },
    };

    const html = generateCleanPrintHTML(customData, 'es', null);
    expect(html).toContain('--page-padding: 36px');
    expect(html).toContain('padding: var(--page-padding, 24px)');
  });

  it('4. 2-column mode in generateCleanPrintHTML applies user-defined pagePadding token to left and right columns', () => {
    const customData = {
      ...defaultSchema,
      layout: {
        ...defaultSchema.layout,
        type: '2-column',
        pagePadding: 32,
        leftBg: '#1e293b',
        rightBg: '#ffffff',
      },
    };

    const html = generateCleanPrintHTML(customData, 'es', null);
    expect(html).toContain('--page-padding: 32px');
    expect(html).toMatch(/class="resume__left"[^>]*style="[^"]*padding:\s*var\(--page-padding/);
    expect(html).toMatch(/class="resume__right"[^>]*style="[^"]*padding:\s*var\(--page-padding/);
  });

  it('5. A4PageBox applies custom pagePadding to single-column container and 2-column columns', () => {
    // ATS single column
    const { container: singleContainer } = render(
      <A4PageBox pageNumber={1} totalPages={1} is2Col={false} pagePadding={40}>
        <div className="test-content">Single Col Content</div>
      </A4PageBox>
    );
    const boxEl = singleContainer.querySelector('.a4-page-box');
    expect(boxEl).not.toBeNull();
    expect(boxEl.style.padding).toBe('40px');

    // 2-column mode
    const { container: twoColContainer } = render(
      <A4PageBox
        pageNumber={1}
        totalPages={1}
        is2Col={true}
        pagePadding={36}
        leftContent={<div id="left-test">Left</div>}
        rightContent={<div id="right-test">Right</div>}
      />
    );
    const leftCol = twoColContainer.querySelector('.resume__left');
    const rightCol = twoColContainer.querySelector('.resume__right');
    expect(leftCol).not.toBeNull();
    expect(rightCol).not.toBeNull();
    expect(leftCol.style.padding).toBe('36px');
    expect(rightCol.style.padding).toBe('36px');
  });

  it('6. executeCleanPrint respects custom user pagePadding in live iframe execution', async () => {
    const customData = {
      ...defaultSchema,
      layout: {
        ...defaultSchema.layout,
        type: '1-column',
        isAtsMode: true,
        pagePadding: 38,
      },
    };

    const printPromise = executeCleanPrint(customData, 'es');
    const iframe = document.querySelector('iframe');
    expect(iframe).not.toBeNull();

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    const areaCv = iframeDoc.getElementById('area-cv');
    expect(areaCv).not.toBeNull();
    // In ATS single container mode, areaCv should have 38px padding, NOT 0!
    expect(areaCv.style.padding).toBe('38px');

    // Trigger iframe onload to complete the print execution
    if (typeof iframe.onload === 'function') {
      iframe.onload();
    }
    await printPromise;
  });
});
