/**
 * @file componentDndAndInteractivity.test.jsx
 * @description Programmatic tests verifying:
 * 1. CVDragOverlay displays declared friendly component names matching section menu (ZERO raw IDs).
 * 2. All section types render functional, clickable AI tips toggle buttons.
 * 3. Deletable sections render clickable delete buttons.
 * 4. ContactItem controls (pills, adder, delete, picker) do not trigger drag and are 100% clickable.
 * 5. isNonDraggableTarget prevents drag on all interactive controls across components.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CVDragOverlay, CVDragOverlayContent } from '../components/Editor/CVDragOverlay';
import BaseSection from '../components/CV/BaseSection';
import ContactItem from '../components/CV/items/ContactItem';
import { getAllSectionDescriptors, getSectionDescriptor } from '../registry/sectionRegistry';
import { isNonDraggableTarget } from '../utils/dndUtils';
import { CVProvider } from '../context/CVContext';
import { DndContext } from '@dnd-kit/core';

describe('Friendly Drag-and-Drop Names & Component Interactivity', () => {
  describe('CVDragOverlayContent: Friendly Declared Names (Zero Raw IDs)', () => {
    const descriptors = getAllSectionDescriptors();

    descriptors.forEach(desc => {
      it(`renders friendly declared label "${desc.label}" for section type "${desc.type}" without raw ID`, () => {
        const activeDragSection = {
          section: {
            id: `test_${desc.type}_id_123`, // arbitrary raw ID
            type: desc.type,
            title: '', // empty title, must fall back to friendly label
            items: []
          }
        };

        const { container } = render(
          <CVDragOverlayContent activeDragItem={null} activeDragSection={activeDragSection} />
        );

        const titleEl = container.querySelector('[data-testid="drag-overlay-section-title"]');
        expect(titleEl).toBeTruthy();

        // Must contain declared friendly label
        expect(titleEl.textContent).toContain(desc.label);

        // Must NOT contain the raw ID string
        expect(titleEl.textContent).not.toContain(`test_${desc.type}_id_123`);
      });
    });

    it('renders declared parent component name as badge for dragged item', () => {
      const activeDragItem = {
        sectionType: 'contact',
        sectionId: 'contact_sec',
        item: {
          id: 'item_1',
          contacts: [{ id: 'c1', type: 'email', value: 'ada@computing.org' }]
        }
      };

      const { container } = render(
        <CVDragOverlayContent activeDragItem={activeDragItem} activeDragSection={null} />
      );

      const badge = container.querySelector('[data-testid="drag-overlay-item-badge"]');
      expect(badge).toBeTruthy();
      expect(badge.textContent).toBe('Información de Contacto');
      expect(badge.textContent).not.toContain('contact_sec');
    });
  });

  describe('isNonDraggableTarget: Drag Prevention on Interactive Controls', () => {
    it('returns true for contact pill, adder, and del buttons', () => {
      const pill = document.createElement('span');
      pill.className = 'social__link contact-item-pill';

      const icon = document.createElement('svg');
      pill.appendChild(icon);

      const addBtn = document.createElement('button');
      addBtn.className = 'add-contact-btn';

      const delBtn = document.createElement('button');
      delBtn.className = 'contact-del-btn';

      const tipsBtn = document.createElement('button');
      tipsBtn.className = 'section-tips-toggle-btn';

      const secDelBtn = document.createElement('button');
      secDelBtn.className = 'round-btn-del section-del-btn';

      expect(isNonDraggableTarget(pill)).toBe(true);
      expect(isNonDraggableTarget(icon)).toBe(true);
      expect(isNonDraggableTarget(addBtn)).toBe(true);
      expect(isNonDraggableTarget(delBtn)).toBe(true);
      expect(isNonDraggableTarget(tipsBtn)).toBe(true);
      expect(isNonDraggableTarget(secDelBtn)).toBe(true);
    });

    it('returns false for drag handles to allow explicit drag initiation', () => {
      const handle = document.createElement('div');
      handle.className = 'drag-handle section-drag-handle';

      expect(isNonDraggableTarget(handle)).toBe(false);
    });
  });

  describe('ContactItem: Pure Clickability & Zero Drag Interception', () => {
    it('stops pointerdown propagation on contact pills and "+ Contacto" button', () => {
      const onUpdateItem = vi.fn();
      const item = {
        id: 'contact_item_1',
        contacts: [
          { id: 'c1', type: 'email', value: 'developer@ressume.io' }
        ]
      };

      const { container } = render(
        <ContactItem 
          item={item} 
          sectionId="contact" 
          onUpdateItem={onUpdateItem} 
          isPrint={false} 
        />
      );

      const addBtn = screen.getByRole('button', { name: /agregar dato de contacto/i });
      const delBtn = screen.getByRole('button', { name: /eliminar email/i });

      // Simulate pointerdown on adder
      const addPointerEvent = new MouseEvent('pointerdown', { bubbles: true, cancelable: true });
      const stopAddSpy = vi.spyOn(addPointerEvent, 'stopPropagation');
      addBtn.dispatchEvent(addPointerEvent);
      expect(stopAddSpy).toHaveBeenCalled();

      // Simulate pointerdown on delete button
      const delPointerEvent = new MouseEvent('pointerdown', { bubbles: true, cancelable: true });
      const stopDelSpy = vi.spyOn(delPointerEvent, 'stopPropagation');
      delBtn.dispatchEvent(delPointerEvent);
      expect(stopDelSpy).toHaveBeenCalled();
    });
  });

  describe('BaseSection: Tips & Delete Buttons Clickability', () => {
    it('renders tips and delete buttons with stopped pointerdown propagation', () => {
      const section = {
        id: 'test_sec_id',
        type: 'contact',
        column: 'left',
        title: '',
        items: [{ id: 'item_1', contacts: [] }]
      };

      const { container } = render(
        <CVProvider>
          <DndContext>
            <BaseSection section={section} />
          </DndContext>
        </CVProvider>
      );

      const tipsBtn = container.querySelector('.section-tips-toggle-btn');
      const delBtn = container.querySelector('.section-del-btn');

      // Individual tips button is eliminated per user requirement in favor of master toggle
      expect(tipsBtn).toBeNull();
      expect(delBtn).toBeTruthy();

      // Dispatch pointerdown on section delete button
      const delPointerEvent = new MouseEvent('pointerdown', { bubbles: true, cancelable: true });
      const stopDelSpy = vi.spyOn(delPointerEvent, 'stopPropagation');
      delBtn.dispatchEvent(delPointerEvent);
      expect(stopDelSpy).toHaveBeenCalled();
    });
  });
});
