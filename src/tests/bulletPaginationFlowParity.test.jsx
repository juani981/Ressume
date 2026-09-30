import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateCleanPrintHTML,
  createSanitizedPrintClone,
  generateLayoutVariablesCSS,
} from '../utils/staticHtmlPdfEngine';
import { defaultSchema } from '../utils/schema';
import SortableBulletItem from '../components/CV/SortableBulletItem';
import { render } from '@testing-library/react';

describe('Multi-Bullet Organic Flow & Layout Parity', () => {
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

    // Parents MUST have break-inside: auto so bullets can split across pages
    expect(clonedItem.style.breakInside).toBe('auto');
    expect(clonedData.style.breakInside).toBe('auto');

    // Individual bullet items MUST avoid break-inside
    expect(clonedBullets[0].style.breakInside).toBe('avoid');
    expect(clonedBullets[1].style.breakInside).toBe('avoid');

    // Broken bullet MUST receive break-before: page and top padding
    expect(clonedBullets[1].style.breakBefore).toBe('page');
    expect(clonedBullets[1].style.paddingTop).toContain('var(--page-padding');
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
