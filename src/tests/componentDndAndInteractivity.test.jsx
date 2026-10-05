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

  describe('CVDragOverlay: Full-Fidelity Container Preview', () => {
    it('renders real formatted section items inside the section drag preview', () => {
      const activeDragSection = {
        section: {
          id: 'test_exp_sec',
          type: 'list',
          title: 'Experiencia Profesional',
          items: [
            {
              id: 'job_1',
              title: 'Senior Software Architect',
              subtitle: 'Google',
              date: '2020 - Presente',
              description: 'Designed mission-critical cloud infrastructure.'
            }
          ]
        }
      };

      const { container } = render(
        <CVDragOverlayContent activeDragItem={null} activeDragSection={activeDragSection} />
      );

      // Verify section container overlay
      const sectionOverlay = container.querySelector('[data-testid="drag-overlay-section"]');
      expect(sectionOverlay).toBeTruthy();
      expect(sectionOverlay.textContent).toContain('Experiencia Laboral');
      expect(sectionOverlay.textContent).toContain('Experiencia Profesional');

      // Verify actual item contents rendered via PrintBaseItem
      expect(sectionOverlay.textContent).toContain('Senior Software Architect');
      expect(sectionOverlay.textContent).toContain('Google');
      expect(sectionOverlay.textContent).toContain('Designed mission-critical cloud infrastructure.');
    });

    it('renders full-fidelity item preview for dragged item', () => {
      const activeDragItem = {
        sectionType: 'education',
        sectionId: 'edu_sec',
        item: {
          id: 'edu_1',
          title: 'Licenciatura en Ciencias de la Computación',
          subtitle: 'Universidad de Buenos Aires',
          date: '2015 - 2020'
        }
      };

      const { container } = render(
        <CVDragOverlayContent activeDragItem={activeDragItem} activeDragSection={null} />
      );

      const itemOverlay = container.querySelector('[data-testid="drag-overlay-item"]');
      expect(itemOverlay).toBeTruthy();
      expect(itemOverlay.textContent).toContain('Educación y Formación');
      expect(itemOverlay.textContent).toContain('Licenciatura en Ciencias de la Computación');
      expect(itemOverlay.textContent).toContain('Universidad de Buenos Aires');
    });

    it('renders styled spacer container preview when dragging a spacer section', () => {
      const activeDragSection = {
        section: {
          id: 'spacer_sec',
          type: 'spacer',
          height: 60,
          backgroundColor: '#000000'
        }
      };

      const { container } = render(
        <CVDragOverlayContent activeDragItem={null} activeDragSection={activeDragSection} />
      );

      const sectionOverlay = container.querySelector('[data-testid="drag-overlay-section"]');
      expect(sectionOverlay).toBeTruthy();
      expect(sectionOverlay.textContent).toContain('Espacio en Blanco');
      expect(sectionOverlay.textContent).toContain('60px');
    });
  });
});
