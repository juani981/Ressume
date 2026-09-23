import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createSanitizedPrintClone,
  generateCleanPrintHTML,
  captureEditorSnapshot,
} from '../utils/staticHtmlPdfEngine';
import printStyles from '../styles/print.css?raw';

describe('Page 2 Margin & Padding Parity (Top Spacing Consistency Across Pages)', () => {
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

  it('1. CSS print.css enforces identical user-set padding-top and margin-top: 0 on page break elements while preventing cascading breaks on editor annotations', () => {
    expect(printStyles).toContain('.force-page-break-before');
    expect(printStyles).toContain('break-before: page !important');
    expect(printStyles).toContain('padding-top: var(--page-padding, 24px) !important');
    expect(printStyles).toContain('margin-top: 0 !important');

    // Verify selector coverage for all break indicators
    expect(printStyles).toMatch(
      /\.break-page-before:not\(:first-child\)[\s\S]*?padding-top:\s*var\(--page-padding/
    );
    // Verify anti-cascade protection on editor-forced annotations
    expect(printStyles).toMatch(
      /\[data-editor-break-forced="true"\][\s\S]*?break-before:\s*auto\s*!important/
    );
  });

  it('2. createSanitizedPrintClone neutralizes [data-editor-break-forced="true"] to break-before: auto and removes injected margins to prevent cascading orphan pages', () => {
    const areaCv = document.createElement('div');
    areaCv.id = 'area-cv';
    areaCv.className = 'resume bd-grid';
    areaCv.style.setProperty('--page-padding', '32px');

    const leftCol = document.createElement('div');
    leftCol.className = 'resume__left';

    const rightCol = document.createElement('div');
    rightCol.className = 'resume__right';

    // Page 1 first item (should NEVER have break-before or extra padding)
    const page1Item = document.createElement('div');
    page1Item.className = 'cv-block';
    page1Item.id = 'item-page1';
    rightCol.appendChild(page1Item);

    // Page 2 broken element (forced by pagination engine)
    const page2Item = document.createElement('div');
    page2Item.className = 'cv-block';
    page2Item.id = 'item-page2';
    page2Item.setAttribute('data-editor-break-forced', 'true');
    page2Item.setAttribute('data-editor-break-fold', '1');
    page2Item.style.marginTop = '44px';
    rightCol.appendChild(page2Item);

    areaCv.appendChild(leftCol);
    areaCv.appendChild(rightCol);
    container.appendChild(areaCv);

    const clone = createSanitizedPrintClone(areaCv);
    expect(clone).not.toBeNull();

    const clonedPage1Item = clone.querySelector('#item-page1');
    const clonedPage2Item = clone.querySelector('#item-page2');

    // Page 1 first item has NO page break or extra padding
    expect(clonedPage1Item.style.breakBefore).toBe('');
    expect(clonedPage1Item.style.paddingTop).toBe('');
    expect(clonedPage1Item.classList.contains('force-page-break-before')).toBe(false);

    // Page 2 item: break-before is set to auto and editor margin-top is scrubbed (NO cascading page break)
    expect(clonedPage2Item.style.breakBefore).toBe('auto');
    expect(clonedPage2Item.style.pageBreakBefore).toBe('auto');
    expect(clonedPage2Item.style.marginTop).toBe('');
    expect(clonedPage2Item.classList.contains('force-page-break-before')).toBe(false);
    expect(clonedPage2Item.hasAttribute('data-editor-break-forced')).toBe(false);
  });

  it('3. Defensive scrub in createSanitizedPrintClone guarantees Page 1 first element never receives duplicate top padding', () => {
    const areaCv = document.createElement('div');
    areaCv.id = 'area-cv';
    areaCv.className = 'resume resume__single-column';

    const firstSection = document.createElement('section');
    firstSection.className = 'cv-section';
    // Erroneous attribute on first section must be defensively scrubbed
    firstSection.setAttribute('data-editor-break-forced', 'true');
    firstSection.style.paddingTop = '24px';
    firstSection.style.breakBefore = 'page';

    areaCv.appendChild(firstSection);
    container.appendChild(areaCv);

    const clone = createSanitizedPrintClone(areaCv);
    const clonedSection = clone.querySelector('.cv-section');

    expect(clonedSection.style.breakBefore).toBe('');
    expect(clonedSection.style.paddingTop).toBe('');
    expect(clonedSection.style.marginTop).toBe('');
    expect(clonedSection.hasAttribute('data-editor-break-forced')).toBe(false);
  });

  it('4. generateCleanPrintHTML injects snapshot breaks CSS with identical user-set padding-top for broken elements', () => {
    const cvData = {
      layout: {
        type: '1-column',
        isAtsMode: true,
        pagePadding: 30,
      },
      sections: [
        {
          id: 'experience',
          type: 'experience',
          title: 'EXPERIENCIA',
          items: [{ id: 'exp_item_1' }, { id: 'exp_item_2' }],
        },
      ],
    };

    const snapshot = {
      width: 794,
      height: 2000,
      totalPages: 2,
      brokenElements: [
        {
          sectionId: 'experience',
          itemId: 'exp_item_2',
          isTitle: false,
          fold: '1',
          pageNum: 1,
        },
      ],
    };

    const html = generateCleanPrintHTML(cvData, 'es', snapshot);

    expect(html).toContain('id="cv-snapshot-breaks"');
    expect(html).toContain('[data-item-id="exp_item_2"]');
    expect(html).toMatch(
      /\[data-item-id="exp_item_2"\]\s*\{[\s\S]*?break-before:\s*page\s*!important/
    );
    expect(html).toMatch(
      /\[data-item-id="exp_item_2"\]\s*\{[\s\S]*?padding-top:\s*var\(--page-padding,\s*24px\)\s*!important/
    );
  });

  it('5. Parity between Page 1 and Page 2 top margins when section title breaks across pages', () => {
    const cvData = {
      layout: {
        type: '2-column',
        pagePadding: 28,
        leftBg: '#f8fafc',
        rightBg: '#ffffff',
      },
      sections: [
        {
          id: 'education',
          type: 'education',
          column: 'right',
          title: 'EDUCACIÓN',
          items: [{ id: 'edu_1' }],
        },
      ],
    };

    const snapshot = {
      width: 794,
      height: 1900,
      totalPages: 2,
      brokenElements: [
        {
          sectionId: 'education',
          itemId: null,
          isTitle: true,
          fold: '1',
          pageNum: 1,
        },
      ],
    };

    const html = generateCleanPrintHTML(cvData, 'es', snapshot);

    expect(html).toContain('[data-section-title="education"]');
    expect(html).toMatch(
      /\[data-section-title="education"\]\s*\{[\s\S]*?padding-top:\s*var\(--page-padding,\s*24px\)\s*!important/
    );
    // Verify that the custom page padding variable (--page-padding: 28px) is in base styles
    expect(html).toContain('--page-padding: 28px');
  });
});
