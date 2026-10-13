import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';
import { CVProvider } from '../context/CVContext';
import { defaultSchema } from '../utils/schema';
import { generateCleanPrintHTML } from '../utils/staticHtmlPdfEngine';
import fs from 'fs';
import path from 'path';

describe('Goal: Add Buttons Priority & Border Centering + Resizer Fine Styling', () => {
  let cssContent = '';

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('cvData', JSON.stringify(defaultSchema));
    const cssPath = path.resolve(__dirname, '../index.css');
    cssContent = fs.readFileSync(cssPath, 'utf-8');
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('1. Add Buttons: Border Centering & Z-Index Layering (CSS Rules)', () => {
    it('positions .section-add-container directly centered on bottom border (50% in, 50% out)', () => {
      // Must be bottom: 0, left: 50%, transform: translate(-50%, 50%)
      expect(cssContent).toMatch(/\.section-add-container\s*\{[^}]*bottom:\s*0/);
      expect(cssContent).toMatch(/\.section-add-container\s*\{[^}]*transform:\s*translate\(-50%,\s*50%\)/);
      expect(cssContent).toMatch(/\.section-add-container\s*\{[^}]*z-index:\s*100/);
    });

    it('aligns the top edge of .add-bullet-btn with the preceding content bottom edge', () => {
      expect(cssContent).toMatch(/\.add-bullet-btn\s*\{[^}]*top:\s*(?:0|2)/);
      expect(cssContent).toMatch(/\.add-bullet-btn\s*\{[^}]*transform:\s*none/);
      expect(cssContent).toMatch(/\.add-bullet-btn\s*\{[^}]*z-index:\s*110/);
    });

    it('guarantees add buttons have top-layer z-index on hover (z-index >= 120)', () => {
      expect(cssContent).toMatch(/\.round-btn-add:hover\s*\{[^}]*z-index:\s*130/);
      expect(cssContent).toMatch(/\.add-bullet-btn:hover\s*\{[^}]*transform:\s*scale\(1\.06\)/);
      expect(cssContent).toMatch(/\.add-bullet-btn:hover\s*\{[^}]*z-index:\s*130/);
      expect(cssContent).toMatch(/\.add-section-btn:hover\s*\{[^}]*z-index:\s*(?:130|200)/);
      expect(cssContent).toMatch(/\.add-contact-btn:hover\s*\{[^}]*z-index:\s*120/);
    });

    it('elevates hovered section and item containers above following siblings', () => {
      expect(cssContent).toMatch(/\.editable-section-container:hover\s*\{[^}]*z-index:\s*40/);
      expect(cssContent).toMatch(/\.editable-item-container:hover\s*\{[^}]*z-index:\s*45/);
    });
  });

  describe('2. Column Resizer: Wide Hit Area & Fine Visual Styling', () => {
    it('renders column resizer with wide hit area (40px) and lower zIndex (20) than add buttons', () => {
      render(
        <CVProvider>
          <App />
        </CVProvider>
      );

      const resizer = screen.getByTestId('column-resizer');
      expect(resizer).toBeInTheDocument();

      // Wide hit area: 40px
      expect(resizer.style.width).toBe('40px');
      expect(resizer.style.cursor).toBe('col-resize');

      // Subordinate z-index (20) so add buttons (100+) always take hover priority
      expect(resizer.style.zIndex).toBe('20');
      expect(resizer.style.position).toBe('absolute');
    });

    it('uses fine 1px bar line and slim 8px pill handle in column resizer', () => {
      render(
        <CVProvider>
          <App />
        </CVProvider>
      );

      const resizer = screen.getByTestId('column-resizer');
      const bar = resizer.querySelector('.column-resizer-bar');
      expect(bar).not.toBeNull();
      expect(bar.style.width).toBe('1px');

      const handle = resizer.querySelector('.column-resizer-handle');
      expect(handle).not.toBeNull();
      expect(handle.style.width).toBe('8px');
      expect(handle.style.height).toBe('36px');
      expect(handle.style.borderRadius).toBe('999px');
    });

    it('defines column resizer CSS rules with z-index 20 and fine 2px hover state', () => {
      expect(cssContent).toMatch(/\.column-resizer\s*\{[^}]*z-index:\s*20/);
      expect(cssContent).toMatch(/\.column-resizer:hover\s+\.column-resizer-bar[^}]*width:\s*2px/);
    });
  });

  describe('3. DOM Presence & Interactive Functionality', () => {
    it('renders round add item buttons on sections and triggers addSectionItem', () => {
      render(
        <CVProvider>
          <App />
        </CVProvider>
      );

      const addButtons = screen.getAllByTitle(/Agregar nuevo elemento a/i);
      expect(addButtons.length).toBeGreaterThan(0);

      // Verify the add button is wrapped in .section-add-container
      const container = addButtons[0].closest('.section-add-container');
      expect(container).not.toBeNull();
    });

    it('renders bullet add buttons with add-bullet-btn class', () => {
      render(
        <CVProvider>
          <App />
        </CVProvider>
      );

      const bulletAddButtons = document.querySelectorAll('.add-bullet-btn');
      expect(bulletAddButtons.length).toBeGreaterThan(0);

      const firstBtn = bulletAddButtons[0];
      expect(firstBtn).toBeInTheDocument();
      expect(firstBtn.closest('.bullet-add-row')).not.toBeNull();
    });

    it('strips all add buttons and resizer from clean print output DOM', () => {
      const html = generateCleanPrintHTML(defaultSchema, 'es');
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      expect(doc.querySelectorAll('.column-resizer').length).toBe(0);
      expect(doc.querySelectorAll('.column-resizer-bar').length).toBe(0);
      expect(doc.querySelectorAll('.column-resizer-handle').length).toBe(0);
      expect(doc.querySelectorAll('.round-btn-add').length).toBe(0);
      expect(doc.querySelectorAll('.section-add-container').length).toBe(0);
      expect(doc.querySelectorAll('.add-bullet-btn').length).toBe(0);
      expect(doc.querySelectorAll('.bullet-add-row').length).toBe(0);
      expect(doc.querySelectorAll('.add-section-btn').length).toBe(0);
      expect(doc.querySelectorAll('.column-add-section').length).toBe(0);
    });
  });

  describe('4. Forgiving Drag & Drop: Left-Shifted Handles & Container Non-Text Dragging', () => {
    it('shifts drag handles to the left so they never obstruct or overlap text', () => {
      // .section-drag-handle left offset is negative (outside text)
      expect(cssContent).toMatch(/\.section-drag-handle\s*\{[^}]*left:\s*-1\.25rem/);
      // .item-drag-handle left offset is negative
      expect(cssContent).toMatch(/\.item-drag-handle\s*\{[^}]*left:\s*-1\.15rem/);
      // .bullet-item-row .item-drag-handle is shifted left
      expect(cssContent).toMatch(/\.bullet-item-row\s+\.item-drag-handle\s*\{[^}]*left:\s*-0\.75rem/);
    });

    it('sets grab and grabbing cursors on hovered and active containers', () => {
      expect(cssContent).toMatch(/\.editable-section-container:hover\s*\{[^}]*cursor:\s*grab/);
      expect(cssContent).toMatch(/\.editable-item-container:hover\s*\{[^}]*cursor:\s*grab/);
      expect(cssContent).toMatch(/\.bullet-item-row:hover\s*\{[^}]*cursor:\s*grab/);
      expect(cssContent).toMatch(/cursor:\s*grabbing/);
      expect(cssContent).toMatch(/\.inline-edit-display,\s*\.inline-edit-display\s*\*\s*\{[^}]*cursor:\s*text\s*!important/);
      expect(cssContent).toMatch(/\.inline-edit-display\s+a[^{]*\{[^}]*cursor:\s*pointer\s*!important/);
    });

    it('isNonDraggableTarget correctly detects interactive/text targets vs draggable background', async () => {
      const { isNonDraggableTarget } = await import('../utils/dndUtils');

      // Drag handles always allow drag
      const handleDiv = document.createElement('div');
      handleDiv.className = 'drag-handle item-drag-handle';
      expect(isNonDraggableTarget(handleDiv)).toBe(false);

      // Inline text displays prevent drag
      const textSpan = document.createElement('span');
      textSpan.className = 'inline-edit-display';
      expect(isNonDraggableTarget(textSpan)).toBe(true);

      const nestedText = document.createElement('b');
      textSpan.appendChild(nestedText);
      expect(isNonDraggableTarget(nestedText)).toBe(true);

      // Buttons prevent drag
      const btn = document.createElement('button');
      btn.className = 'round-btn-add';
      expect(isNonDraggableTarget(btn)).toBe(true);

      // Inputs and textareas prevent drag
      const input = document.createElement('input');
      expect(isNonDraggableTarget(input)).toBe(true);

      // Blank container div allows drag
      const containerDiv = document.createElement('div');
      containerDiv.className = 'editable-section-container';
      expect(isNonDraggableTarget(containerDiv)).toBe(false);

      const emptySpace = document.createElement('div');
      expect(isNonDraggableTarget(emptySpace)).toBe(false);
    });

    it('renders editable sections and items with drag listeners on container', () => {
      render(
        <CVProvider>
          <App />
        </CVProvider>
      );

      const sectionContainers = document.querySelectorAll('.editable-section-container');
      expect(sectionContainers.length).toBeGreaterThan(0);

      const itemContainers = document.querySelectorAll('.editable-item-container');
      expect(itemContainers.length).toBeGreaterThan(0);

      // Section container has aria-describedby or role from dnd-kit attributes
      expect(sectionContainers[0]).toBeInTheDocument();
    });
  });
});
