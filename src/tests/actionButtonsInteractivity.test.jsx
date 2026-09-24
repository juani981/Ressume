/**
 * @file actionButtonsInteractivity.test.jsx
 * @description Comprehensive automated tests ensuring action buttons (delete, AI tips, bullet style,
 * item delete, spacer controls) across ALL CV components can be hovered and clicked cleanly without
 * being intercepted or hijacked by @dnd-kit drag listeners.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import { isNonDraggableTarget, createContainerDragListeners } from '../utils/dndUtils';
import { getAllSectionDescriptors, getSectionDescriptor } from '../registry/sectionRegistry';
import BaseSection from '../components/CV/BaseSection';
import BaseItem from '../components/CV/BaseItem';
import { CVContext } from '../context/CVContext';

// Helper to provide CVContext mock
const createMockCVContext = (overrides = {}) => {
  return {
    cvData: {
      sections: [],
      layout: { type: '2-column' }
    },
    updateSectionTitle: vi.fn(),
    updateSectionBulletStyle: vi.fn(),
    addSectionItem: vi.fn(),
    deleteSection: vi.fn(),
    deleteSectionItem: vi.fn(),
    updateSectionItem: vi.fn(),
    updateSectionProperty: vi.fn(),
    activeTooltip: null,
    toggleTooltipForSection: vi.fn(),
    ...overrides
  };
};

const renderWithContext = (ui, contextValue) => {
  return render(
    <CVContext.Provider value={contextValue}>
      {ui}
    </CVContext.Provider>
  );
};

describe('Action Buttons Interactivity & Non-Draggable Target Verification', () => {

  describe('1. Unit Verification of isNonDraggableTarget across DOM elements', () => {
    it('returns true (prevents drag) for all action buttons and controls', () => {
      const selectors = [
        'section-action-buttons',
        'section-tips-toggle-btn',
        'section-bullet-style-btn',
        'round-btn-del',
        'round-btn-add',
        'add-bullet-btn',
        'add-section-btn',
        'add-contact-btn',
        'bullet-del-btn',
        'section-del-btn',
        'item-del-btn',
        'contact-del-btn',
        'page-delete-btn',
        'spacer-del-btn',
        'spacer-controls-bar',
        'cv-photo-controls-floating'
      ];

      selectors.forEach((cls) => {
        const btn = document.createElement('button');
        btn.className = cls;
        document.body.appendChild(btn);
        expect(isNonDraggableTarget(btn)).toBe(true);
        document.body.removeChild(btn);
      });
    });

    it('returns true when clicking an SVG or path inside an action button', () => {
      const btn = document.createElement('button');
      btn.className = 'round-btn-del section-del-btn';
      
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      svg.appendChild(pathEl);
      btn.appendChild(svg);
      document.body.appendChild(btn);

      // Target is the SVG element
      expect(isNonDraggableTarget(svg)).toBe(true);
      // Target is the inner path element
      expect(isNonDraggableTarget(pathEl)).toBe(true);

      document.body.removeChild(btn);
    });

    it('returns true when target is a text node inside a button or pill', () => {
      const btn = document.createElement('button');
      btn.className = 'add-contact-btn';
      const textNode = document.createTextNode('+ Contacto');
      btn.appendChild(textNode);
      document.body.appendChild(btn);

      expect(isNonDraggableTarget(textNode)).toBe(true);

      document.body.removeChild(btn);
    });

    it('returns false (allows drag) only when clicking explicit drag handles', () => {
      const handle = document.createElement('div');
      handle.className = 'drag-handle section-drag-handle';
      document.body.appendChild(handle);

      expect(isNonDraggableTarget(handle)).toBe(false);

      document.body.removeChild(handle);
    });

    it('returns false (allows drag) on empty container background', () => {
      const container = document.createElement('div');
      container.className = 'editable-section-container cv-section';
      document.body.appendChild(container);

      expect(isNonDraggableTarget(container)).toBe(false);

      document.body.removeChild(container);
    });
  });

  describe('2. createContainerDragListeners integration', () => {
    it('prevents onPointerDown execution when target is an action button', () => {
      const mockPointerDown = vi.fn();
      const listeners = { onPointerDown: mockPointerDown };
      const wrapped = createContainerDragListeners(listeners, true);

      const btn = document.createElement('button');
      btn.className = 'round-btn-del section-del-btn';
      document.body.appendChild(btn);

      const event = {
        target: btn,
        stopPropagation: vi.fn()
      };

      wrapped.onPointerDown(event);

      expect(mockPointerDown).not.toHaveBeenCalled();
      document.body.removeChild(btn);
    });

    it('executes onPointerDown when clicking a non-interactive area of the container', () => {
      const mockPointerDown = vi.fn();
      const listeners = { onPointerDown: mockPointerDown };
      const wrapped = createContainerDragListeners(listeners, true);

      const container = document.createElement('div');
      container.className = 'editable-section-container cv-section';
      document.body.appendChild(container);

      const event = {
        target: container,
        stopPropagation: vi.fn()
      };

      wrapped.onPointerDown(event);

      expect(mockPointerDown).toHaveBeenCalledTimes(1);
      expect(event.stopPropagation).toHaveBeenCalledTimes(1);
      document.body.removeChild(container);
    });
  });

  describe('3. Specific Verification for title_subtitle component', () => {
    it('renders title_subtitle action buttons without being hijacked by drag', () => {
      const mockDelete = vi.fn();
      const mockToggleTips = vi.fn();
      const mockContext = createMockCVContext({
        deleteSection: mockDelete,
        toggleTooltipForSection: mockToggleTips
      });

      const section = {
        id: 'title_subtitle',
        type: 'title_subtitle',
        title: '',
        items: [
          { id: 'prof_1', name: 'JUAN PEREZ', subtitle: 'Ingeniero de Software' }
        ]
      };

      const { container } = renderWithContext(<BaseSection section={section} isPrint={false} />, mockContext);

      // Section actions container must be present
      const actionsContainer = container.querySelector('.section-action-buttons');
      expect(actionsContainer).toBeTruthy();

      // AI Tips button
      const tipsBtn = container.querySelector('.section-tips-toggle-btn');
      expect(tipsBtn).toBeTruthy();
      expect(isNonDraggableTarget(tipsBtn)).toBe(true);

      fireEvent.pointerDown(tipsBtn);
      fireEvent.click(tipsBtn);
      expect(mockToggleTips).toHaveBeenCalledTimes(1);

      // Delete Section button
      const delBtn = container.querySelector('.section-del-btn');
      expect(delBtn).toBeTruthy();
      expect(isNonDraggableTarget(delBtn)).toBe(true);

      fireEvent.pointerDown(delBtn);
      fireEvent.click(delBtn);
      expect(mockDelete).toHaveBeenCalledWith('title_subtitle');
    });
  });

  describe('4. Interactivity Test Across ALL Registered Section Types', () => {
    const descriptors = getAllSectionDescriptors();

    descriptors.forEach((descriptor) => {
      it(`section [${descriptor.type}] allows clicking its action buttons cleanly`, () => {
        const mockDelete = vi.fn();
        const mockToggleTips = vi.fn();
        const mockContext = createMockCVContext({
          deleteSection: mockDelete,
          toggleTooltipForSection: mockToggleTips
        });

        const defaultItem = descriptor.createDefaultItem ? descriptor.createDefaultItem() : { id: 'item_1', name: 'Test Item' };
        const section = {
          id: `sec_${descriptor.type}`,
          type: descriptor.type,
          title: descriptor.defaultTitle || descriptor.label || 'Test Section',
          items: [defaultItem]
        };

        const { container } = renderWithContext(<BaseSection section={section} isPrint={false} />, mockContext);

        if (descriptor.type === 'spacer') {
          // Spacer component has its own dedicated floating controls
          const spacerDelBtn = screen.getByTestId(`spacer-del-btn-sec_${descriptor.type}`);
          expect(spacerDelBtn).toBeTruthy();
          expect(isNonDraggableTarget(spacerDelBtn)).toBe(true);

          fireEvent.pointerDown(spacerDelBtn);
          fireEvent.click(spacerDelBtn);
          expect(mockDelete).toHaveBeenCalledWith(`sec_${descriptor.type}`);
          return;
        }

        // Check for section action buttons container
        const actionButtons = container.querySelector('.section-action-buttons');
        expect(actionButtons).toBeTruthy();

        // Check tips button
        const tipsBtn = container.querySelector('.section-tips-toggle-btn');
        if (tipsBtn) {
          expect(isNonDraggableTarget(tipsBtn)).toBe(true);
          fireEvent.pointerDown(tipsBtn);
          fireEvent.click(tipsBtn);
          expect(mockToggleTips).toHaveBeenCalled();
        }

        // Check section delete button
        if (descriptor.allowDelete !== false) {
          const delBtn = container.querySelector('.section-del-btn');
          expect(delBtn).toBeTruthy();
          expect(isNonDraggableTarget(delBtn)).toBe(true);
          fireEvent.pointerDown(delBtn);
          fireEvent.click(delBtn);
          expect(mockDelete).toHaveBeenCalledWith(`sec_${descriptor.type}`);
        }
      });
    });
  });

  describe('5. CSS Stacking Context & z-index Invariant Verification', () => {
    it('enforces z-index: 150 on section-action-buttons and round-btn-del exceeding hover containers', () => {
      const cssPath = path.resolve(__dirname, '../index.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');

      // Check section-action-buttons z-index >= 100
      const actionBtnBlock = cssContent.match(/\.section-action-buttons\s*\{[^}]+\}/s);
      expect(actionBtnBlock).toBeTruthy();
      expect(actionBtnBlock[0]).toMatch(/z-index:\s*(150|120|100)/);

      // Check round-btn-del z-index >= 100
      const roundDelBlock = cssContent.match(/\.round-btn-del\s*\{[^}]+\}/s);
      expect(roundDelBlock).toBeTruthy();
      expect(roundDelBlock[0]).toMatch(/z-index:\s*(150|120|100)/);

      // Check pointer-events: none on inner SVGs
      expect(cssContent).toMatch(/\.section-action-buttons button svg/);
      expect(cssContent).toMatch(/pointer-events:\s*none/);
    });
  });

});
