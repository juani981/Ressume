import { describe, it, expect } from 'vitest';
import { generateCleanPrintHTML, createSanitizedPrintClone } from '../utils/staticHtmlPdfEngine';
import { defaultSchema } from '../utils/schema';

describe('2-Column PDF Print Edge-to-Edge Bleed and Anti-Fragmentation', () => {
  it('ensures 2-column mode #area-cv bleeds edge-to-edge with 100% width and margin 0', () => {
    const twoColData = {
      ...defaultSchema,
      layout: {
        ...defaultSchema.layout,
        type: '2-column',
        leftBg: '#2a3b4c',
        rightBg: '#ffffff',
      }
    };

    const html = generateCleanPrintHTML(twoColData, 'es', null);
    expect(html).toContain('id="area-cv"');
    // Verify 2-column #area-cv has width: 100%, max-width: 100%, margin: 0, padding: 0
    expect(html).toMatch(/id="area-cv"[^>]*style="[^"]*width:\s*100%/);
    expect(html).toMatch(/id="area-cv"[^>]*style="[^"]*max-width:\s*100%/);
    expect(html).toMatch(/id="area-cv"[^>]*style="[^"]*margin:\s*0/);
    expect(html).toMatch(/id="area-cv"[^>]*style="[^"]*padding:\s*0/);
  });

  it('ensures ATS 1-column mode remains intact with centered margin 0 auto and container width', () => {
    const atsData = {
      ...defaultSchema,
      layout: {
        ...defaultSchema.layout,
        type: '1-column',
        isAtsMode: true,
      }
    };

    const html = generateCleanPrintHTML(atsData, 'es', null);
    expect(html).toContain('id="area-cv"');
    // Verify ATS mode retains margin: 0 auto and containerWidth
    expect(html).toMatch(/id="area-cv"[^>]*style="[^"]*margin:\s*0\s*auto/);
    expect(html).toMatch(/id="area-cv"[^>]*style="[^"]*padding:\s*var\(--page-padding,\s*24px\)/);
  });

  it('neutralizes forced child breaks in 2-column mode to prevent 5-page fragmentation', () => {
    const areaCv = document.createElement('div');
    areaCv.id = 'area-cv';
    areaCv.className = 'resume bd-grid';

    const leftCol = document.createElement('div');
    leftCol.className = 'resume__left';
    const leftItem = document.createElement('div');
    leftItem.className = 'cv-block';
    leftItem.setAttribute('data-editor-break-forced', 'true');
    leftItem.style.marginTop = '20px';
    leftCol.appendChild(leftItem);

    const rightCol = document.createElement('div');
    rightCol.className = 'resume__right';
    const rightItem = document.createElement('div');
    rightItem.className = 'cv-block';
    rightItem.setAttribute('data-editor-break-forced', 'true');
    rightItem.style.marginTop = '20px';
    rightCol.appendChild(rightItem);

    areaCv.appendChild(leftCol);
    areaCv.appendChild(rightCol);

    const clone = createSanitizedPrintClone(areaCv);
    expect(clone).not.toBeNull();

    const cloneLeftItem = clone.querySelector('.resume__left .cv-block');
    const cloneRightItem = clone.querySelector('.resume__right .cv-block');

    // In 2-column mode, child break-before must NOT be 'page' (which would cause full document splits)
    expect(cloneLeftItem.style.breakBefore).not.toBe('page');
    expect(cloneLeftItem.style.pageBreakBefore).not.toBe('always');
    expect(cloneLeftItem.classList.contains('force-page-break-before')).toBe(false);

    expect(cloneRightItem.style.breakBefore).not.toBe('page');
    expect(cloneRightItem.style.pageBreakBefore).not.toBe('always');
    expect(cloneRightItem.classList.contains('force-page-break-before')).toBe(false);

    // Also verify clone container has width 100% and margin 0
    expect(clone.style.width).toBe('100%');
    expect(clone.style.margin).toBe('0px');
  });

  it('preserves forced child breaks in ATS 1-column mode for linear page breaks', () => {
    const areaCv = document.createElement('div');
    areaCv.id = 'area-cv';
    areaCv.className = 'resume resume__single-column resume--ats-mode';

    const item1 = document.createElement('div');
    item1.className = 'cv-block';
    item1.textContent = 'First Item';

    const item2 = document.createElement('div');
    item2.className = 'cv-block';
    item2.setAttribute('data-editor-break-forced', 'true');
    item2.textContent = 'Second Item (breaking to page 2)';

    areaCv.appendChild(item1);
    areaCv.appendChild(item2);

    const clone = createSanitizedPrintClone(areaCv);
    expect(clone).not.toBeNull();

    const items = clone.querySelectorAll('.cv-block');
    // First item has no break
    expect(items[0].style.breakBefore).toBe('');
    // Second item retains break-before: page for ATS mode
    expect(items[1].style.breakBefore).toBe('page');
    expect(items[1].style.pageBreakBefore).toBe('always');
    expect(items[1].classList.contains('force-page-break-before')).toBe(true);
  });
});
