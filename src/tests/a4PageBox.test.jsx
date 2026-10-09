import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { A4PageBox } from '../components/CV/A4PageBox';
import { EDITOR_PAGE_HEIGHT_CSS } from '../utils/pageGeometry';
import printStyles from '../styles/print.css?raw';

describe('A4PageBox Component & Print Support (Rule 15)', () => {
  describe('1. Immutable Physical Dimensions & Base Layout', () => {
    it('renders container with .a4-page-box class and editor-tuned vertical height', () => {
      const { container } = render(<A4PageBox pageNumber={1} totalPages={2} />);
      const pageBox = container.querySelector('.a4-page-box');

      expect(pageBox).toBeTruthy();
      expect(pageBox.style.width).toBe('210mm');
      expect(pageBox.style.minWidth).toBe('210mm');
      expect(pageBox.style.maxWidth).toBe('210mm');
      expect(pageBox.style.height).toBe(EDITOR_PAGE_HEIGHT_CSS);
      expect(pageBox.style.minHeight).toBe(EDITOR_PAGE_HEIGHT_CSS);
      expect(pageBox.style.maxHeight).toBe(EDITOR_PAGE_HEIGHT_CSS);
      expect(pageBox.style.overflow).toBe('hidden');
      expect(pageBox.style.boxSizing).toBe('border-box');
      expect(pageBox.style.position).toBe('relative');
      expect(pageBox.style.marginBottom).toBe('32px');
      expect(pageBox.style.marginLeft).toBe('auto');
      expect(pageBox.style.marginRight).toBe('auto');
      expect(pageBox.style.boxShadow).toBe('0 4px 12px rgba(0, 0, 0, 0.1)');
    });

    it('supports custom pageHeight prop override (e.g. 297mm)', () => {
      const { container } = render(<A4PageBox pageNumber={1} totalPages={1} pageHeight="297mm" />);
      const pageBox = container.querySelector('.a4-page-box');
      expect(pageBox.style.height).toBe('297mm');
      expect(pageBox.style.minHeight).toBe('297mm');
      expect(pageBox.style.maxHeight).toBe('297mm');
    });

    it('renders page badge with "Página N de M" and .no-print class', () => {
      const { container } = render(<A4PageBox pageNumber={2} totalPages={3} />);
      const badge = container.querySelector('.a4-page-badge.no-print');

      expect(badge).toBeTruthy();
      expect(badge.textContent).toBe('Página 2 de 3');
      expect(badge.classList.contains('no-print')).toBe(true);
    });

    it('supports top-right and bottom-right badge positioning', () => {
      const { container: cBottom } = render(
        <A4PageBox pageNumber={1} totalPages={1} badgePosition="bottom-right" />
      );
      const badgeBottom = cBottom.querySelector('.a4-page-badge');
      expect(badgeBottom.style.bottom).toBe('12px');
      expect(badgeBottom.style.right).toBe('16px');

      const { container: cTop } = render(
        <A4PageBox pageNumber={1} totalPages={1} badgePosition="top-right" />
      );
      const badgeTop = cTop.querySelector('.a4-page-badge');
      expect(badgeTop.style.top).toBe('12px');
      expect(badgeTop.style.right).toBe('16px');
    });

    it('positions badge in the inter-page gap by default (outside usable content)', () => {
      const { container } = render(<A4PageBox pageNumber={1} totalPages={2} />);
      const badge = container.querySelector('.a4-page-badge');
      const pageBox = container.querySelector('.a4-page-box');
      const wrapper = container.querySelector('.a4-page-wrapper');

      expect(wrapper).toBeTruthy();
      expect(badge).toBeTruthy();
      expect(badge.style.bottom).toBe('5px');
      expect(badge.style.right).toBe('16px');
      // Badge is outside the clipped a4-page-box so it sits in the gap
      expect(pageBox.contains(badge)).toBe(false);
      expect(wrapper.contains(badge)).toBe(true);
    });

    it('renders delete button inside gap badge for page > 1 with clickable callback', () => {
      let deletedPage = null;
      const { container } = render(
        <A4PageBox pageNumber={2} totalPages={2} onDeletePage={(n) => { deletedPage = n; }} />
      );
      const delBtn = container.querySelector('.page-delete-btn');
      expect(delBtn).toBeTruthy();
      delBtn.click();
      expect(deletedPage).toBe(2);
    });
  });

  describe('2. Two-Column Mode (is2Col)', () => {
    it('configures CSS grid and per-page static linear-gradient background', () => {
      const { container } = render(
        <A4PageBox
          is2Col={true}
          leftBg="#f0fdf4"
          rightBg="#ffffff"
          leftColPercent={35}
          gridTemplateColumns="35% 65%"
        />
      );
      const pageBox = container.querySelector('.a4-page-box');

      expect(pageBox.style.display).toBe('grid');
      expect(pageBox.style.gridTemplateColumns).toBe('35% 65%');
      expect(pageBox.style.background).toBe(
        'linear-gradient(to right, #f0fdf4 0%, #f0fdf4 35%, #ffffff 35%, #ffffff 100%)'
      );
    });

    it('renders .resume__left and .resume__right columns each with height 100% and min-height 100%', () => {
      const { container } = render(
        <A4PageBox
          is2Col={true}
          leftContent={<div data-testid="left-items">Sidebar</div>}
          rightContent={<div data-testid="right-items">Main</div>}
        />
      );

      const leftCol = container.querySelector('.resume__left');
      const rightCol = container.querySelector('.resume__right');

      expect(leftCol).toBeTruthy();
      expect(rightCol).toBeTruthy();
      expect(leftCol.style.height).toBe('100%');
      expect(leftCol.style.minHeight).toBe('100%');
      expect(rightCol.style.height).toBe('100%');
      expect(rightCol.style.minHeight).toBe('100%');
      expect(container.querySelector('[data-testid="left-items"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="right-items"]')).toBeTruthy();
    });

    it('renders empty left and right column placeholders if no content is provided in 2Col mode', () => {
      const { container } = render(<A4PageBox is2Col={true} />);
      const leftCol = container.querySelector('.resume__left');
      const rightCol = container.querySelector('.resume__right');

      expect(leftCol).toBeTruthy();
      expect(rightCol).toBeTruthy();
      expect(leftCol.style.height).toBe('100%');
      expect(rightCol.style.height).toBe('100%');
    });

    it('enforces gap: 0 and columnGap: 0 on CSS grid to prevent right column displacement and zero-margin clipping', () => {
      const { container } = render(
        <A4PageBox
          is2Col={true}
          pagePadding="24px"
          leftContent={<div>Left</div>}
          rightContent={<div>Right</div>}
        />
      );
      const pageBox = container.querySelector('.a4-page-box');
      const rightCol = container.querySelector('.resume__right');
      const leftCol = container.querySelector('.resume__left');

      expect(['0', '0px', '0 0']).toContain(pageBox.style.gap);
      expect(['0', '0px']).toContain(pageBox.style.columnGap);
      expect(['0', '0px']).toContain(pageBox.style.rowGap);
      expect(rightCol.style.padding).toBe('24px 24px 12px 24px');
      expect(leftCol.style.padding).toBe('24px 24px 12px 24px');
    });
  });

  describe('3. Single-Column / ATS Mode (isAtsMode)', () => {
    it('sets white background, page-padding and renders .resume__single-column', () => {
      const { container } = render(
        <A4PageBox isAtsMode={true} pagePadding="32px">
          <div data-testid="ats-section">Experience</div>
        </A4PageBox>
      );
      const pageBox = container.querySelector('.a4-page-box');
      const singleCol = container.querySelector('.resume__single-column');

      expect(pageBox.style.background).toBe('rgb(255, 255, 255)');
      expect(pageBox.style.padding).toBe('32px 32px 16px 32px');
      expect(singleCol).toBeTruthy();
      expect(singleCol.style.height).toBe('100%');
      expect(singleCol.style.minHeight).toBe('100%');
      expect(container.querySelector('[data-testid="ats-section"]')).toBeTruthy();
    });

    it('renders single-column mode when is2Col is false', () => {
      const { container } = render(
        <A4PageBox is2Col={false}>
          <div data-testid="content">Item</div>
        </A4PageBox>
      );
      const singleCol = container.querySelector('.resume__single-column');
      expect(singleCol).toBeTruthy();
    });
  });

  describe('4. Print CSS Rules for .a4-page-box', () => {
    it('contains @page with size: A4 portrait and margin: 0', () => {
      expect(printStyles).toMatch(/@page\s*\{[^}]*size:\s*A4 portrait/);
      expect(printStyles).toMatch(/@page\s*\{[^}]*margin:\s*0/);
    });

    it('enforces exact .a4-page-box print rules with !important', () => {
      expect(printStyles).toContain('.a4-page-box {');
      expect(printStyles).toContain('width: 210mm !important;');
      expect(printStyles).toContain('min-width: 210mm !important;');
      expect(printStyles).toContain('max-width: 210mm !important;');
      expect(printStyles).toContain('height: 297mm !important;');
      expect(printStyles).toContain('min-height: 297mm !important;');
      expect(printStyles).toContain('max-height: 297mm !important;');
      expect(printStyles).toContain('overflow: hidden !important;');
      expect(printStyles).toContain('break-after: page !important;');
      expect(printStyles).toContain('page-break-after: always !important;');
      expect(printStyles).toContain('break-inside: avoid !important;');
      expect(printStyles).toContain('page-break-inside: avoid !important;');
      expect(printStyles).toContain('box-sizing: border-box !important;');
      expect(printStyles).toContain('margin: 0 !important;');
      expect(printStyles).toContain('box-shadow: none !important;');
      expect(printStyles).toContain('gap: 0 !important;');
    });

    it('enforces break-after: auto on .a4-page-box:last-child to prevent trailing blank page', () => {
      expect(printStyles).toContain('.a4-page-box:last-child {');
      expect(printStyles).toContain('break-after: auto !important;');
      expect(printStyles).toContain('page-break-after: auto !important;');
    });
  });
});
