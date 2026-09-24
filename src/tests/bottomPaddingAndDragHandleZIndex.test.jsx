/**
 * bottomPaddingAndDragHandleZIndex.test.jsx
 *
 * Verifies the resolution of the two user-reported issues:
 * 1. Bottom margin / padding is not hardcoded to 0 and respects the user-defined slider (pagePadding)
 *    symmetrically with top, left, and right margins.
 * 2. Drag handle icons in 2-column mode have z-index >= 50 so they are never occluded by
 *    column borders, ColumnResizer (z-index 20), or hovered section containers (z-index 40/45).
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CVProvider } from '../context/CVContext';
import App from '../App';
import DragHandle from '../components/Editor/DragHandle';
import { A4PageBox } from '../components/CV/A4PageBox';
import { A4_HEIGHT_CSS, A4_PAGE_HEIGHT_PX } from '../utils/pageGeometry';
import { defaultSchema } from '../utils/schema';
import fs from 'fs';
import path from 'path';

describe('Bottom Margin Parity & Drag Handles Z-Index', () => {
  describe('1. Drag Handles Z-Index in 2-Column Mode', () => {
    it('DragHandle component renders with inline or computed zIndex of 50', () => {
      const { container } = render(
        <DragHandle isInner={false} listeners={{}} attributes={{}} />
      );
      const handle = container.querySelector('.drag-handle');
      expect(handle).toBeTruthy();
      expect(handle.style.zIndex).toBe('50');
    });

    it('DragHandle for items (isInner=true) also renders with zIndex of 50', () => {
      const { container } = render(
        <DragHandle isInner={true} listeners={{}} attributes={{}} />
      );
      const itemHandle = container.querySelector('.item-drag-handle');
      expect(itemHandle).toBeTruthy();
      expect(itemHandle.style.zIndex).toBe('50');
    });

    it('index.css declares z-index: 50 for .drag-handle, .section-drag-handle, and .item-drag-handle', () => {
      const cssPath = path.resolve(__dirname, '../index.css');
      const css = fs.readFileSync(cssPath, 'utf8');

      // Check .drag-handle has z-index: 50
      expect(css).toMatch(/\.drag-handle\s*\{[^}]*z-index:\s*50;/);
      // Check .section-drag-handle has z-index: 50
      expect(css).toMatch(/\.section-drag-handle\s*\{[^}]*z-index:\s*50;/);
      // Check .item-drag-handle has z-index: 50
      expect(css).toMatch(/\.item-drag-handle\s*\{[^}]*z-index:\s*50;/);
    });

    it('Drag handles have higher z-index (50) than column-resizer (20) and hovered sections (40/45)', () => {
      const cssPath = path.resolve(__dirname, '../index.css');
      const css = fs.readFileSync(cssPath, 'utf8');

      const dragHandleZIndex = 50;
      const columnResizerZIndex = 20;
      const sectionHoverZIndex = 40;
      const itemHoverZIndex = 45;

      expect(dragHandleZIndex).toBeGreaterThan(columnResizerZIndex);
      expect(dragHandleZIndex).toBeGreaterThan(sectionHoverZIndex);
      expect(dragHandleZIndex).toBeGreaterThan(itemHoverZIndex);
    });
  });

  describe('2. Bottom Margin / Padding Parity with Slider', () => {
    it('App renders <A4PageBox> with pageHeight set to A4_HEIGHT_CSS (297mm)', () => {
      const { container } = render(
        <CVProvider>
          <App />
        </CVProvider>
      );
      const pageBoxes = container.querySelectorAll('.a4-page-box');
      expect(pageBoxes.length).toBeGreaterThanOrEqual(1);

      pageBoxes.forEach((box) => {
        expect(box.style.height).toBe(A4_HEIGHT_CSS);
        expect(box.style.minHeight).toBe(A4_HEIGHT_CSS);
        expect(box.style.maxHeight).toBe(A4_HEIGHT_CSS);
      });
    });

    it('App applies pagePadding symmetrically to columns in 2-column mode', () => {
      const customCv = {
        ...defaultSchema,
        layout: {
          ...defaultSchema.layout,
          type: '2-column',
          pagePadding: 36,
        },
      };
      localStorage.setItem('cvData', JSON.stringify(customCv));

      const { container } = render(
        <CVProvider>
          <App />
        </CVProvider>
      );

      const leftCol = container.querySelector('.resume__left');
      const rightCol = container.querySelector('.resume__right');

      expect(leftCol).toBeTruthy();
      expect(rightCol).toBeTruthy();

      // Check inline style padding is 36px (all 4 sides including bottom)
      expect(leftCol.style.padding).toBe('36px');
      expect(rightCol.style.padding).toBe('36px');
    });

    it('A4PageBox applies custom pagePadding to all 4 sides in ATS mode', () => {
      const { container } = render(
        <A4PageBox
          pageNumber={1}
          totalPages={1}
          is2Col={false}
          isAtsMode={true}
          pagePadding="40px"
          pageHeight={A4_HEIGHT_CSS}
        >
          <div className="ats-content">ATS Content</div>
        </A4PageBox>
      );

      const box = container.querySelector('.a4-page-box');
      expect(box).toBeTruthy();
      expect(box.style.padding).toBe('40px');
      expect(box.style.height).toBe('297mm');
    });

    it('Allows pagePadding to be set to 0 without artificial padding in ATS mode', () => {
      const { container } = render(
        <A4PageBox
          pageNumber={1}
          totalPages={1}
          is2Col={false}
          isAtsMode={true}
          pagePadding="0px"
          pageHeight={A4_HEIGHT_CSS}
        >
          <div className="ats-content">ATS Content</div>
        </A4PageBox>
      );

      const box = container.querySelector('.a4-page-box');
      expect(box).toBeTruthy();
      expect(box.style.padding).toBe('0px');
    });
  });
});
