import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { executePaginationAlgorithm } from '../utils/paginationEngine';
import {
  generateCleanPrintHTML,
  captureEditorSnapshot,
  createSanitizedPrintClone,
  enforceTwoColumnComponentPagination,
  generateLayoutVariablesCSS,
  executeCleanPrint
} from '../utils/staticHtmlPdfEngine';
import { defaultSchema } from '../utils/schema';
import SortableBulletItem from '../components/CV/SortableBulletItem';
import { render } from '@testing-library/react';

describe('R1, R2, R3: Multi-Bullet Organic Pagination & Anti-Fragmentation Flow', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-suite-root';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.restoreAllMocks();
  });

  it('splits multi-bullet items organically at the overflowing bullet instead of pushing the entire item container', () => {
    const areaCv = document.createElement('div');
    areaCv.id = 'area-cv';
    areaCv.className = 'resume resume__single-column';
    container.appendChild(areaCv);

    const section = document.createElement('section');
    section.className = 'cv-section';
    section.setAttribute('data-section-id', 'experience');

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = 'EXPERIENCE';
    section.appendChild(title);

    const item = document.createElement('div');
    item.className = 'cv-block experience__content';
    item.setAttribute('data-item-id', 'exp-1');

    const ul = document.createElement('ul');
    ul.className = 'experience__bullets';

    // 4 bullets
    const b1 = document.createElement('li');
    b1.className = 'cv-block';
    b1.setAttribute('data-item-id', 'exp-1_bullet_0');
    b1.textContent = 'Bullet 1';

    const b2 = document.createElement('li');
    b2.className = 'cv-block';
    b2.setAttribute('data-item-id', 'exp-1_bullet_1');
    b2.textContent = 'Bullet 2';

    const b3 = document.createElement('li');
    b3.className = 'cv-block';
    b3.setAttribute('data-item-id', 'exp-1_bullet_2');
    b3.textContent = 'Bullet 3';

    const b4 = document.createElement('li');
    b4.className = 'cv-block';
    b4.setAttribute('data-item-id', 'exp-1_bullet_3');
    b4.textContent = 'Bullet 4';

    ul.appendChild(b1);
    ul.appendChild(b2);
    ul.appendChild(b3);
    ul.appendChild(b4);
    item.appendChild(ul);
    section.appendChild(item);
    areaCv.appendChild(section);

    // Mock positions:
    // Page 1 content area ends at 1123 - 24 = 1099px. Next page top is 1123 + 20 + 24 = 1167px.
    // Title: 50 to 80
    // Item: 90 to 1250 (straddles fold)
    // b1: 100 to 200 (fits)
    // b2: 210 to 310 (fits)
    // b3: 1050 to 1150 (straddles fold 1099px!)
    // b4: 1160 to 1250
    areaCv.getBoundingClientRect = () => ({ top: 0, bottom: 2000, height: 2000 });
    Object.defineProperty(areaCv, 'scrollHeight', { value: 2000, configurable: true });
    title.getBoundingClientRect = () => ({ top: 50, bottom: 80, height: 30 });
    item.getBoundingClientRect = () => {
      const mt = parseFloat(item.style.marginTop) || 0;
      return { top: 90 + mt, bottom: 1250 + mt, height: 1160 };
    };
    b1.getBoundingClientRect = () => ({ top: 100, bottom: 200, height: 100 });
    b2.getBoundingClientRect = () => ({ top: 210, bottom: 310, height: 100 });
    b3.getBoundingClientRect = () => {
      const mt = parseFloat(b3.style.marginTop) || 0;
      return { top: 1050 + mt, bottom: 1150 + mt, height: 100 };
    };
    b4.getBoundingClientRect = () => {
      const mt = parseFloat(b3.style.marginTop) || 0;
      return { top: 1160 + mt, bottom: 1250 + mt, height: 90 };
    };

    const cvData = {
      layout: {
        type: '1-column',
        isAtsMode: true,
        pagePadding: 24
      }
    };

    const result = executePaginationAlgorithm({
      areaCv,
      cvData,
      pageHeightPx: 1123,
      gapPx: 20
    });

    // Verify item itself is NOT broken to next page (does not have forced break)
    expect(item.getAttribute('data-editor-break-forced')).toBeNull();

    // Verify overflowing bullet b3 IS marked as broken
    expect(b3.getAttribute('data-editor-break-forced')).toBe('true');
    expect(b3.getAttribute('data-editor-break-fold')).toBe('1');
    expect(b3.style.marginTop).not.toBe('');
  });

  it('SortableBulletItem renders with semantic data-item-id matching bulletId', () => {
    const { container: rendered } = render(
      <SortableBulletItem
        bulletId="exp_item_1_bullet_2"
        bulletText="Spearheaded cloud migration to Kubernetes"
        bulletIndex={2}
        sectionId="experience"
        itemId="exp_item_1"
        bullets={['b0', 'b1', 'Spearheaded cloud migration to Kubernetes']}
        onUpdateItem={() => {}}
        onDeleteBullet={() => {}}
      />
    );

    const li = rendered.querySelector('li.bullet-item-row');
    expect(li).not.toBeNull();
    expect(li.getAttribute('data-item-id')).toBe('exp_item_1_bullet_2');
  });

  it('preserves clean dual-layout parity between editor snapshot and clean print HTML', () => {
    // 2-column mode
    const twoColHTML = generateCleanPrintHTML(defaultSchema, 'es');
    expect(twoColHTML).toContain('id="area-cv"');
    expect(twoColHTML).toContain('width: 794px');
    expect(twoColHTML).toContain('min-height: 297mm');
    expect(twoColHTML).toContain('resume__left');
    expect(twoColHTML).toContain('resume__right');

    // ATS 1-column mode
    const atsSchema = {
      ...defaultSchema,
      layout: {
        ...defaultSchema.layout,
        type: '1-column',
        isAtsMode: true
      }
    };
    const atsHTML = generateCleanPrintHTML(atsSchema, 'es');
    expect(atsHTML).toContain('resume__single-column');
    expect(atsHTML).toContain('min-height: 297mm !important');
    expect(atsHTML).not.toContain('resume__left');
  });

  it('eliminates cascading break inflation when multiple bullet items span across pages', () => {
    const snapshot = {
      width: 794,
      height: 2246,
      totalPages: 2,
      brokenElements: [
        { sectionId: 'experience', itemId: 'exp_1_bullet_2', isTitle: false, fold: '1', pageNum: 1 }
      ]
    };

    const html = generateCleanPrintHTML(defaultSchema, 'es', snapshot);
    expect(html).toContain('[data-item-id="exp_1_bullet_2"]');
    expect(html).toContain('break-before: page !important');
    expect(html).toContain('padding-top: var(--page-padding, 24px) !important');
  });

  it('correctly paginates subsequent items across fold 2 when fold 1 has split bullets', () => {
    const areaCv = document.createElement('div');
    areaCv.id = 'area-cv';
    areaCv.className = 'resume resume__single-column';
    container.appendChild(areaCv);

    // Section 1 on page 1 straddling fold 1
    const sec1 = document.createElement('section');
    sec1.className = 'cv-section';
    sec1.setAttribute('data-section-id', 'exp1');
    const item1 = document.createElement('div');
    item1.className = 'cv-block experience__content';
    item1.setAttribute('data-item-id', 'item1');
    const ul1 = document.createElement('ul');
    ul1.className = 'experience__bullets';
    const b1_0 = document.createElement('li');
    b1_0.className = 'cv-block';
    b1_0.setAttribute('data-item-id', 'item1_bullet_0');
    const b1_1 = document.createElement('li');
    b1_1.className = 'cv-block';
    b1_1.setAttribute('data-item-id', 'item1_bullet_1');
    ul1.appendChild(b1_0);
    ul1.appendChild(b1_1);
    item1.appendChild(ul1);
    sec1.appendChild(item1);
    areaCv.appendChild(sec1);

    // Section 2 on page 2 straddling fold 2
    const sec2 = document.createElement('section');
    sec2.className = 'cv-section';
    sec2.setAttribute('data-section-id', 'exp2');
    const item2 = document.createElement('div');
    item2.className = 'cv-block experience__content';
    item2.setAttribute('data-item-id', 'item2');
    sec2.appendChild(item2);
    areaCv.appendChild(sec2);

    // Page 1: 0 to 1123, content area ends 1099, next page starts 1167
    // Page 2: 1143 to 2266, content area ends 2242, next page starts 2310
    areaCv.getBoundingClientRect = () => ({ top: 0, bottom: 3000, height: 3000 });
    Object.defineProperty(areaCv, 'scrollHeight', { value: 3000, configurable: true });

    item1.getBoundingClientRect = () => {
      const mt = parseFloat(item1.style.marginTop) || 0;
      return { top: 100 + mt, bottom: 1200 + mt, height: 1100 };
    };
    b1_0.getBoundingClientRect = () => ({ top: 100, bottom: 200, height: 100 });
    b1_1.getBoundingClientRect = () => {
      const mt = parseFloat(b1_1.style.marginTop) || 0;
      return { top: 1050 + mt, bottom: 1150 + mt, height: 100 };
    };

    item2.getBoundingClientRect = () => {
      const mt = parseFloat(item2.style.marginTop) || 0;
      return { top: 2200 + mt, bottom: 2350 + mt, height: 150 };
    };

    const cvData = {
      layout: {
        type: '1-column',
        isAtsMode: true,
        pagePadding: 24
      }
    };

    executePaginationAlgorithm({
      areaCv,
      cvData,
      pageHeightPx: 1123,
      gapPx: 20
    });

    // Both b1_1 on fold 1 AND item2 on fold 2 should have forced breaks
    expect(b1_1.getAttribute('data-editor-break-forced')).toBe('true');
    expect(item2.getAttribute('data-editor-break-forced')).toBe('true');
    expect(item2.getAttribute('data-editor-break-fold')).toBe('2');
  });

  it('guarantees 1:1 bullet ID parity for Projects and Volunteering between edit and clean print views', () => {
    // Projects edit view rendering
    const { container: projRendered } = render(
      <SortableBulletItem
        bulletId="proj_item_1_proj_bullet_2"
        bulletText="Architected distributed event pipeline"
        bulletIndex={2}
        sectionId="projects"
        itemId="proj_item_1"
        bullets={['b0', 'b1', 'Architected distributed event pipeline']}
        onUpdateItem={() => {}}
        onDeleteBullet={() => {}}
      />
    );
    const projLi = projRendered.querySelector('li.bullet-item-row');
    expect(projLi.getAttribute('data-item-id')).toBe('proj_item_1_bullet_2');

    // Volunteering edit view rendering
    const { container: volRendered } = render(
      <SortableBulletItem
        bulletId="vol_item_1_vol_bullet_3"
        bulletText="Organized local code camp"
        bulletIndex={3}
        sectionId="volunteering"
        itemId="vol_item_1"
        bullets={['b0', 'b1', 'b2', 'Organized local code camp']}
        onUpdateItem={() => {}}
        onDeleteBullet={() => {}}
      />
    );
    const volLi = volRendered.querySelector('li.bullet-item-row');
    expect(volLi.getAttribute('data-item-id')).toBe('vol_item_1_bullet_3');

    // Clean print HTML snapshot CSS selector matching
    const snapshot = {
      width: 794,
      height: 2246,
      totalPages: 2,
      brokenElements: [
        { sectionId: 'projects', itemId: 'proj_item_1_bullet_2', isTitle: false, fold: '1', pageNum: 1 },
        { sectionId: 'volunteering', itemId: 'vol_item_1_bullet_3', isTitle: false, fold: '1', pageNum: 1 }
      ]
    };

    const cleanHTML = generateCleanPrintHTML(defaultSchema, 'es', snapshot);
    expect(cleanHTML).toContain('[data-item-id="proj_item_1_bullet_2"]');
    expect(cleanHTML).toContain('[data-item-id="vol_item_1_bullet_3"]');
  });

  it('organically splits a massive 15-bullet item across 3 pages without title detachment or container displacement', () => {
    const areaCv = document.createElement('div');
    areaCv.id = 'area-cv';
    areaCv.className = 'resume resume__single-column';
    container.appendChild(areaCv);

    const sec = document.createElement('section');
    sec.className = 'cv-section';
    sec.setAttribute('data-section-id', 'experience');

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = 'EXPERIENCE';
    sec.appendChild(title);

    const item = document.createElement('div');
    item.className = 'cv-block experience__content';
    item.setAttribute('data-item-id', 'exp-massive');

    const ul = document.createElement('ul');
    ul.className = 'experience__bullets';

    // 15 bullets: 0..4 on Page 1, 5..9 on Page 2, 10..14 on Page 3
    // Fold 1: contentAreaBottom = 1099, nextContentAreaTop = 1167
    // Fold 2: contentAreaBottom = 2242, nextContentAreaTop = 2310
    const bullets = [];
    for (let i = 0; i < 15; i++) {
      const li = document.createElement('li');
      li.className = 'cv-block';
      li.setAttribute('data-item-id', `exp-massive_bullet_${i}`);
      li.textContent = `Bullet ${i}`;
      ul.appendChild(li);
      bullets.push(li);
    }
    item.appendChild(ul);
    sec.appendChild(item);
    areaCv.appendChild(sec);

    areaCv.getBoundingClientRect = () => ({ top: 0, bottom: 3500, height: 3500 });
    Object.defineProperty(areaCv, 'scrollHeight', { value: 3500, configurable: true });

    title.getBoundingClientRect = () => ({ top: 50, bottom: 80, height: 30 });

    item.getBoundingClientRect = () => {
      const mt = parseFloat(item.style.marginTop) || 0;
      return { top: 90 + mt, bottom: 3400 + mt, height: 3310 };
    };

    // Bullets 0..4: 100 to 1050 (fits on page 1, before 1099)
    // Bullet 5: 1060 to 1160 (straddles fold 1!)
    // Bullets 6..9: 1170 to 2200 (on page 2, before 2242)
    // Bullet 10: 2210 to 2300 (straddles fold 2!)
    // Bullets 11..14: 2310 to 3300 (on page 3)
    bullets.forEach((b, idx) => {
      b.getBoundingClientRect = () => {
        const mt = parseFloat(b.style.marginTop) || 0;
        let baseTop = 100 + idx * 200;
        return { top: baseTop + mt, bottom: baseTop + 100 + mt, height: 100 };
      };
    });

    const cvData = {
      layout: {
        type: '1-column',
        isAtsMode: true,
        pagePadding: 24
      }
    };

    executePaginationAlgorithm({
      areaCv,
      cvData,
      pageHeightPx: 1123,
      gapPx: 20
    });

    // Parent item should NOT have forced break (its bullets were split)
    expect(item.getAttribute('data-editor-break-forced')).toBeNull();

    // Bullet 5 should be broken on fold 1
    expect(bullets[5].getAttribute('data-editor-break-forced')).toBe('true');
    expect(bullets[5].getAttribute('data-editor-break-fold')).toBe('1');

    // Bullet 11 (or whichever straddled fold 2) should be broken on fold 2
    const fold2Bullet = bullets.find(b => b.getAttribute('data-editor-break-fold') === '2');
    expect(fold2Bullet).not.toBeUndefined();
    expect(fold2Bullet.getAttribute('data-editor-break-forced')).toBe('true');
  });

  it('enforceTwoColumnComponentPagination organically splits multi-bullet items in 2-column mode', () => {
    const areaCv = document.createElement('div');
    areaCv.id = 'area-cv';
    areaCv.className = 'resume bd-grid';
    container.appendChild(areaCv);

    const leftCol = document.createElement('div');
    leftCol.className = 'resume__left';
    const rightCol = document.createElement('div');
    rightCol.className = 'resume__right';
    areaCv.appendChild(leftCol);
    areaCv.appendChild(rightCol);

    // Left column has safe item
    const secLeft = document.createElement('section');
    secLeft.className = 'cv-section';
    const leftItem = document.createElement('div');
    leftItem.className = 'cv-block skills__name';
    leftItem.getBoundingClientRect = () => ({ top: 50, bottom: 300, height: 250 });
    secLeft.appendChild(leftItem);
    leftCol.appendChild(secLeft);

    // Right column has experience item with 4 bullets straddling fold 1123
    const secRight = document.createElement('section');
    secRight.className = 'cv-section';
    const expItem = document.createElement('div');
    expItem.className = 'cv-block experience__content';
    expItem.setAttribute('data-item-id', 'exp-2col');

    const ul = document.createElement('ul');
    ul.className = 'experience__bullets';
    const b0 = document.createElement('li');
    b0.className = 'cv-block';
    b0.setAttribute('data-item-id', 'exp-2col_bullet_0');
    const b1 = document.createElement('li');
    b1.className = 'cv-block';
    b1.setAttribute('data-item-id', 'exp-2col_bullet_1');
    const b2 = document.createElement('li');
    b2.className = 'cv-block';
    b2.setAttribute('data-item-id', 'exp-2col_bullet_2');

    ul.appendChild(b0);
    ul.appendChild(b1);
    ul.appendChild(b2);
    expItem.appendChild(ul);
    secRight.appendChild(expItem);
    rightCol.appendChild(secRight);

    areaCv.getBoundingClientRect = () => ({ top: 0, bottom: 2000, height: 2000, left: 0, right: 794, width: 794 });
    Object.defineProperty(areaCv, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(leftCol, 'scrollHeight', { value: 300, configurable: true });
    Object.defineProperty(rightCol, 'scrollHeight', { value: 2000, configurable: true });

    expItem.getBoundingClientRect = () => ({ top: 900, bottom: 1300, height: 400 });
    b0.getBoundingClientRect = () => ({ top: 920, bottom: 1000, height: 80 }); // fits before 1123 - 4 = 1119
    b1.getBoundingClientRect = () => ({ top: 1010, bottom: 1080, height: 70 }); // fits before 1119
    b2.getBoundingClientRect = () => ({ top: 1090, bottom: 1180, height: 90 }); // straddles 1123!

    const result = enforceTwoColumnComponentPagination(document, areaCv, 1123);

    // Parent item should NOT be broken
    expect(expItem.getAttribute('data-page-break-forced')).toBeNull();

    // Bullet b2 should be broken
    expect(b2.getAttribute('data-page-break-forced')).toBe('true');
    expect(b2.getAttribute('data-page-break-column')).toBe('right');
    expect(b2.style.breakBefore).toBe('page');

    // Parent container should allow breaking inside
    expect(expItem.style.breakInside).toBe('auto');
  });

  it('does NOT treat a section title safely at the top or middle of the page as an orphan', () => {
    const areaCv = document.createElement('div');
    areaCv.id = 'area-cv';
    areaCv.className = 'resume resume__single-column';
    container.appendChild(areaCv);

    const section = document.createElement('section');
    section.className = 'cv-section';
    section.setAttribute('data-section-id', 'empty-sec');

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = 'CERTIFICATES';
    section.appendChild(title);
    areaCv.appendChild(section);

    areaCv.getBoundingClientRect = () => ({ top: 0, bottom: 500, height: 500 });
    Object.defineProperty(areaCv, 'scrollHeight', { value: 500, configurable: true });
    title.getBoundingClientRect = () => ({ top: 50, bottom: 80, height: 30 });

    const cvData = { layout: { type: '1-column', isAtsMode: true, pagePadding: 24 } };
    executePaginationAlgorithm({ areaCv, cvData, pageHeightPx: 1123, gapPx: 20 });

    expect(title.getAttribute('data-editor-break-forced')).toBeNull();
  });

  it('enforceTwoColumnComponentPagination does NOT treat a section title safely at the top of a column as an orphan', () => {
    const areaCv = document.createElement('div');
    areaCv.id = 'area-cv';
    areaCv.className = 'resume bd-grid';
    container.appendChild(areaCv);

    const leftCol = document.createElement('div');
    leftCol.className = 'resume__left';
    const rightCol = document.createElement('div');
    rightCol.className = 'resume__right';
    areaCv.appendChild(leftCol);
    areaCv.appendChild(rightCol);

    const section = document.createElement('section');
    section.className = 'cv-section';
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = 'AWARDS';
    section.appendChild(title);
    leftCol.appendChild(section);

    areaCv.getBoundingClientRect = () => ({ top: 0, bottom: 500, height: 500, left: 0, right: 794, width: 794 });
    Object.defineProperty(areaCv, 'scrollHeight', { value: 500, configurable: true });
    Object.defineProperty(leftCol, 'scrollHeight', { value: 100, configurable: true });
    Object.defineProperty(rightCol, 'scrollHeight', { value: 100, configurable: true });
    title.getBoundingClientRect = () => ({ top: 50, bottom: 80, height: 30 });

    enforceTwoColumnComponentPagination(document, areaCv, 1123);

    expect(title.getAttribute('data-page-break-forced')).toBeNull();
  });

  it('enforceTwoColumnComponentPagination correctly breaks multi-bullet items across multiple folds (Page 1 and Page 2)', () => {
    const areaCv = document.createElement('div');
    areaCv.id = 'area-cv';
    areaCv.className = 'resume bd-grid';
    container.appendChild(areaCv);

    const leftCol = document.createElement('div');
    leftCol.className = 'resume__left';
    const rightCol = document.createElement('div');
    rightCol.className = 'resume__right';
    areaCv.appendChild(leftCol);
    areaCv.appendChild(rightCol);

    const secRight = document.createElement('section');
    secRight.className = 'cv-section';
    const expItem = document.createElement('div');
    expItem.className = 'cv-block experience__content';
    expItem.setAttribute('data-item-id', 'exp-multifold');

    const ul = document.createElement('ul');
    ul.className = 'experience__bullets';
    const bullets = [];
    for (let i = 0; i < 10; i++) {
      const b = document.createElement('li');
      b.className = 'cv-block';
      b.setAttribute('data-item-id', `exp-multifold_bullet_${i}`);
      ul.appendChild(b);
      bullets.push(b);
    }
    expItem.appendChild(ul);
    secRight.appendChild(expItem);
    rightCol.appendChild(secRight);

    areaCv.getBoundingClientRect = () => ({ top: 0, bottom: 3000, height: 3000, left: 0, right: 794, width: 794 });
    Object.defineProperty(areaCv, 'scrollHeight', { value: 3000, configurable: true });
    Object.defineProperty(leftCol, 'scrollHeight', { value: 500, configurable: true });
    Object.defineProperty(rightCol, 'scrollHeight', { value: 3000, configurable: true });

    expItem.getBoundingClientRect = () => ({ top: 800, bottom: 2800, height: 2000 });
    // Bullets 0..2 on page 1 (800..1090)
    bullets[0].getBoundingClientRect = () => ({ top: 820, bottom: 900, height: 80 });
    bullets[1].getBoundingClientRect = () => ({ top: 910, bottom: 990, height: 80 });
    bullets[2].getBoundingClientRect = () => ({ top: 1000, bottom: 1080, height: 80 });
    // Bullet 3 straddles fold 1 (1123)
    bullets[3].getBoundingClientRect = () => ({ top: 1090, bottom: 1180, height: 90 });
    // Bullets 4..6 on page 2 (1190..2200)
    bullets[4].getBoundingClientRect = () => ({ top: 1200, bottom: 1300, height: 100 });
    bullets[5].getBoundingClientRect = () => ({ top: 1310, bottom: 1410, height: 100 });
    bullets[6].getBoundingClientRect = () => ({ top: 1420, bottom: 1520, height: 100 });
    // Bullet 7 straddles fold 2 (2246)
    bullets[7].getBoundingClientRect = () => ({ top: 2210, bottom: 2300, height: 90 });
    bullets[8].getBoundingClientRect = () => ({ top: 2310, bottom: 2410, height: 100 });
    bullets[9].getBoundingClientRect = () => ({ top: 2420, bottom: 2520, height: 100 });

    enforceTwoColumnComponentPagination(document, areaCv, 1123);

    expect(bullets[3].getAttribute('data-page-break-forced')).toBe('true');
    expect(bullets[3].getAttribute('data-page-break-fold')).toBe('1');

    // Bullet 7 straddling fold 2 MUST also be broken for fold 2
    expect(bullets[7].getAttribute('data-page-break-forced')).toBe('true');
    expect(bullets[7].getAttribute('data-page-break-fold')).toBe('2');
  });

  it('strictly transfers all 10 layout sliders from cvData.layout to :root and style tokens without divergence', () => {
    const customLayout = {
      fontFamily: 'Inter',
      fontScale: 0.9,
      titleScale: 1.1,
      bodyScale: 0.95,
      listScale: 0.85,
      lineHeight: 1.35,
      pagePadding: 32,
      sectionGap: 16,
      itemGap: 6,
    };
    const css = generateLayoutVariablesCSS(customLayout);
    expect(css).toContain('--font-scale: 0.9');
    expect(css).toContain('--title-scale: 1.1');
    expect(css).toContain('--body-scale: 0.95');
    expect(css).toContain('--list-scale: 0.85');
    expect(css).toContain('--line-height: 1.35');
    expect(css).toContain('--page-padding: 32px');
    expect(css).toContain('--section-gap: 16px');
    expect(css).toContain('--item-gap: 6px');
    expect(css).toContain('Inter');
  });

  it('unblocks multi-bullet parent containers in createSanitizedPrintClone so items break organically between bullets', () => {
    const areaCv = document.createElement('div');
    areaCv.id = 'area-cv';
    areaCv.className = 'resume bd-grid';

    const sec = document.createElement('section');
    sec.className = 'cv-section';
    const item = document.createElement('div');
    item.className = 'experience__content editable-item-container cv-block';
    const data = document.createElement('div');
    data.className = 'experience__data bd-grid';
    const bulletContainer = document.createElement('div');
    bulletContainer.className = 'experience__bullets-container';
    const ul = document.createElement('ul');
    ul.className = 'experience__bullets';

    const b1 = document.createElement('li');
    b1.className = 'bullet-item-row editable-item-container cv-block';
    const b2 = document.createElement('li');
    b2.className = 'bullet-item-row editable-item-container cv-block';
    b2.setAttribute('data-editor-break-forced', 'true');
    b2.setAttribute('data-editor-break-fold', '1');

    ul.appendChild(b1);
    ul.appendChild(b2);
    bulletContainer.appendChild(ul);
    data.appendChild(bulletContainer);
    item.appendChild(data);
    sec.appendChild(item);
    areaCv.appendChild(sec);

    const clone = createSanitizedPrintClone(areaCv);
    expect(clone).not.toBeNull();

    const clonedItem = clone.querySelector('.experience__content');
    const clonedData = clone.querySelector('.experience__data');
    const clonedBullets = clone.querySelectorAll('.bullet-item-row');

    // Parents MUST have break-inside: auto so the 4 bullets can split across pages
    expect(clonedItem.style.breakInside).toBe('auto');
    expect(clonedData.style.breakInside).toBe('auto');

    // Individual bullet items MUST avoid break-inside
    expect(clonedBullets[0].style.breakInside).toBe('avoid');
    expect(clonedBullets[1].style.breakInside).toBe('avoid');

    // Broken bullet MUST receive break-before: page and top padding
    expect(clonedBullets[1].style.breakBefore).toBe('page');
    expect(clonedBullets[1].style.paddingTop).toContain('var(--page-padding');
  });

  it('renders SortableBulletItem with dynamic var(--line-height) and var(--list-font-size)', () => {
    const { container: renderedContainer } = render(
      <SortableBulletItem
        bulletId="test_bullet_1"
        bulletText="Achievement description"
        bulletIndex={0}
        sectionId="exp"
        itemId="exp_1"
        bullets={['Achievement description']}
        onUpdateItem={vi.fn()}
        onDeleteBullet={vi.fn()}
      />
    );
    const li = renderedContainer.querySelector('li.bullet-item-row');
    expect(li).not.toBeNull();
    expect(li.style.lineHeight).toBe('var(--line-height, 1.45)');
    expect(li.style.fontSize).toBe('var(--list-font-size, var(--normal-font-size))');
  });

  it('guarantees generateLayoutVariablesCSS exports all column geometry and background tokens', () => {
    const customLayout = {
      fontFamily: 'Roboto',
      fontScale: 1.1,
      leftColumnWidth: 28,
      leftBg: '#1e293b',
      rightBg: '#f8fafc',
      pagePadding: 32,
      sectionGap: 24,
      itemGap: 10,
      lineHeight: 1.6
    };
    const css = generateLayoutVariablesCSS(customLayout);
    expect(css).toContain('--grid-template-columns: 28% 72%');
    expect(css).toContain('--left-col-percent: 28%');
    expect(css).toContain('--left-bg: #1e293b');
    expect(css).toContain('--right-bg: #f8fafc');
    expect(css).toContain('--page-padding: 32px');
    expect(css).toContain('--section-gap: 24px');
    expect(css).toContain('--item-gap: 10px');
    expect(css).toContain('--line-height: 1.6');
    expect(css).toContain('grid-template-columns: 28% 72% !important');
  });
});
