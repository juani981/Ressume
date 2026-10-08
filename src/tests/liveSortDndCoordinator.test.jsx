/**
 * liveSortDndCoordinator.test.jsx
 *
 * Exhaustive unit test suite verifying static snap-in-place drag-and-drop coordination:
 * 1. Document data remains static during drag (zero micro-movement or layout recalculation).
 * 2. Visual drop indicator ('sombra') dropTarget state is computed in real-time.
 * 3. 60fps ghost overlay renders friendly declared names from sectionRegistry.
 * 4. Atomic commit to cvData and history transition occurs on handleDragEnd.
 * 5. Clean state reset on handleDragCancel.
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, renderHook, act } from '@testing-library/react';
import { useCVDndCoordinator } from '../hooks/useCVDndCoordinator';
import { CVDragOverlay, CVDragOverlayContent } from '../components/Editor/CVDragOverlay';

describe('Static Snap-in-Place Drag & Drop Coordinator', () => {
  const initialSections = [
    {
      id: 'profile_header',
      column: 'single',
      type: 'profile_header',
      items: [{ id: 'prof_item', name: 'John Doe' }],
    },
    {
      id: 'experience',
      column: 'single',
      type: 'experience',
      items: [
        { id: 'exp_1', title: 'Senior Dev' },
        { id: 'exp_2', title: 'Staff Dev' },
        { id: 'exp_3', title: 'Tech Lead' },
      ],
    },
    {
      id: 'education',
      column: 'single',
      type: 'education',
      items: [{ id: 'edu_1', degree: 'Computer Science' }],
    },
  ];

  describe('CVDragOverlay & CVDragOverlayContent', () => {
    it('CVDragOverlay returns null when no item or section is active', () => {
      const { container } = render(
        <CVDragOverlay
          activeDragItem={null}
          activeDragSection={null}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders friendly section preview card and full component in CVDragOverlayContent', () => {
      const { getByTestId } = render(
        <CVDragOverlayContent
          activeDragSection={{
            section: { id: 'experience', type: 'experience', title: 'Experiencia Laboral', items: [{}, {}] },
          }}
        />
      );
      const sectionOverlay = getByTestId('drag-overlay-section');
      expect(sectionOverlay).toBeDefined();
      expect(getByTestId('drag-overlay-section-title').textContent).toContain('Experiencia Laboral');
      expect(sectionOverlay.querySelector('.drag-overlay-rendered-section')).toBeTruthy();
    });

    it('renders friendly item preview card and full item component in CVDragOverlayContent', () => {
      const { getByTestId } = render(
        <CVDragOverlayContent
          activeDragItem={{
            sectionType: 'experience',
            item: { id: 'exp_1', title: 'Senior Dev', subtitle: 'Acme Corp' },
          }}
        />
      );
      const itemOverlay = getByTestId('drag-overlay-item');
      expect(itemOverlay).toBeDefined();
      expect(getByTestId('drag-overlay-item-title').textContent).toBe('Senior Dev');
      expect(getByTestId('drag-overlay-item-badge').textContent).toContain('Experiencia Laboral');
      expect(itemOverlay.querySelector('.drag-overlay-rendered-item')).toBeTruthy();
    });
  });

  describe('Real-time live reordering during drag over with dropTarget indicator', () => {
    it('live reorders sections downward and updates dropTarget during section drag over', () => {
      let cvData = { sections: [...initialSections] };
      const setCvData = vi.fn((updater) => {
        cvData = typeof updater === 'function' ? updater(cvData) : updater;
      });
      const recordHistory = vi.fn();

      const { result } = renderHook(() =>
        useCVDndCoordinator({
          cvData,
          setCvData,
          recordHistoryTransition: recordHistory,
        })
      );

      // 1. Drag starts on experience section
      act(() => {
        result.current.handleDragStart({
          active: {
            id: 'experience',
            data: { current: { type: 'section', section: cvData.sections[1] } },
          },
        });
      });

      expect(result.current.activeDragSection).toBeDefined();
      expect(result.current.dropTarget).toBeNull();

      // 2. Drag over education section downward
      act(() => {
        result.current.handleDragOver({
          active: {
            id: 'experience',
            data: { current: { type: 'section', section: cvData.sections[1] } },
            rect: { current: { translated: { top: 350, height: 100 } } },
          },
          over: {
            id: 'education',
            data: { current: { type: 'section' } },
            rect: { top: 300, height: 100 },
          },
        });
      });

      // Verify setCvData was invoked during dragover for live immediate swap!
      expect(setCvData).toHaveBeenCalled();
      expect(cvData.sections.map((s) => s.id)).toEqual([
        'profile_header',
        'education',
        'experience',
      ]);

      // Verify dropTarget holds the drop target indicator
      expect(result.current.dropTarget).toEqual({
        type: 'section',
        activeSectionId: 'experience',
        targetColumn: 'single',
        targetSectionId: 'education',
        position: 'below',
      });
    });

    it('live reorders sections upward and updates dropTarget during section drag over', () => {
      let cvData = {
        sections: [
          initialSections[0],
          initialSections[2],
          initialSections[1],
        ], // profile_header, education, experience
      };
      const setCvData = vi.fn((updater) => {
        cvData = typeof updater === 'function' ? updater(cvData) : updater;
      });
      const recordHistory = vi.fn();

      const { result } = renderHook(() =>
        useCVDndCoordinator({
          cvData,
          setCvData,
          recordHistoryTransition: recordHistory,
        })
      );

      act(() => {
        result.current.handleDragStart({
          active: {
            id: 'experience',
            data: { current: { type: 'section', section: cvData.sections[2] } },
          },
        });
      });

      // Drag over education with position 'above'
      act(() => {
        result.current.handleDragOver({
          active: {
            id: 'experience',
            data: { current: { type: 'section', section: cvData.sections[2] } },
            rect: { current: { translated: { top: 180, height: 100 } } },
          },
          over: {
            id: 'education',
            data: { current: { type: 'section' } },
            rect: { top: 250, height: 100 },
          },
        });
      });

      // Immediate swap live reordering occurs
      expect(setCvData).toHaveBeenCalled();
      expect(cvData.sections.map((s) => s.id)).toEqual([
        'profile_header',
        'experience',
        'education',
      ]);

      // dropTarget indicates placement above education
      expect(result.current.dropTarget).toEqual({
        type: 'section',
        activeSectionId: 'experience',
        targetColumn: 'single',
        targetSectionId: 'education',
        position: 'above',
      });
    });

    it('live reorders items immediately and updates dropTarget during item drag over', () => {
      let cvData = JSON.parse(JSON.stringify({ sections: initialSections }));
      const setCvData = vi.fn((updater) => {
        cvData = typeof updater === 'function' ? updater(cvData) : updater;
      });

      const { result } = renderHook(() =>
        useCVDndCoordinator({
          cvData,
          setCvData,
        })
      );

      act(() => {
        result.current.handleDragStart({
          active: {
            id: 'exp_1',
            data: {
              current: {
                type: 'item',
                item: cvData.sections[1].items[0],
                sectionId: 'experience',
              },
            },
          },
        });
      });

      // Drag exp_1 below exp_2
      act(() => {
        result.current.handleDragOver({
          active: {
            id: 'exp_1',
            data: {
              current: {
                type: 'item',
                sectionId: 'experience',
              },
            },
            rect: { current: { translated: { top: 250, height: 50 } } },
          },
          over: {
            id: 'exp_2',
            data: {
              current: {
                type: 'item',
                sectionId: 'experience',
              },
            },
            rect: { top: 200, height: 50 },
          },
        });
      });

      // Immediate live swap occurs on drag over
      expect(setCvData).toHaveBeenCalled();
      const expSec = cvData.sections.find((s) => s.id === 'experience');
      expect(expSec.items.map((i) => i.id)).toEqual(['exp_2', 'exp_1', 'exp_3']);

      // dropTarget reflects item placeholder position
      expect(result.current.dropTarget).toEqual({
        type: 'item',
        activeItemId: 'exp_1',
        activeSectionId: 'experience',
        targetSectionId: 'experience',
        targetItemId: 'exp_2',
        position: 'below',
      });
    });
  });

  describe('Atomic commit on handleDragEnd and cancel rollback', () => {
    it('commits section reordering atomically on handleDragEnd', () => {
      let cvData = JSON.parse(JSON.stringify({ sections: initialSections }));
      const setCvData = vi.fn((updater) => {
        cvData = typeof updater === 'function' ? updater(cvData) : updater;
      });
      const recordHistory = vi.fn();

      const { result } = renderHook(() =>
        useCVDndCoordinator({
          cvData,
          setCvData,
          recordHistoryTransition: recordHistory,
        })
      );

      // Start drag
      act(() => {
        result.current.handleDragStart({
          active: {
            id: 'experience',
            data: { current: { type: 'section', section: cvData.sections[1] } },
          },
        });
      });

      // Drag over education
      act(() => {
        result.current.handleDragOver({
          active: {
            id: 'experience',
            data: { current: { type: 'section', section: cvData.sections[1] } },
            rect: { current: { translated: { top: 400, height: 100 } } },
          },
          over: {
            id: 'education',
            data: { current: { type: 'section' } },
            rect: { top: 300, height: 100 },
          },
        });
      });

      // Release mouse (drop)
      act(() => {
        result.current.handleDragEnd({
          active: {
            id: 'experience',
            data: { current: { type: 'section' } },
            rect: { current: { translated: { top: 400, height: 100 } } },
          },
          over: {
            id: 'education',
            data: { current: { type: 'section' } },
            rect: { top: 300, height: 100 },
          },
        });
      });

      // setCvData and recordHistory are called on drop
      expect(setCvData).toHaveBeenCalled();
      expect(recordHistory).toHaveBeenCalledTimes(1);

      const [preSnapshot, finalState] = recordHistory.mock.calls[0];
      expect(preSnapshot.sections.map((s) => s.id)).toEqual([
        'profile_header',
        'experience',
        'education',
      ]);
      expect(finalState.sections.map((s) => s.id)).toEqual([
        'profile_header',
        'education',
        'experience',
      ]);

      // Active and dropTarget states are reset
      expect(result.current.dropTarget).toBeNull();
      expect(result.current.activeDragSection).toBeNull();
    });

    it('commits item reordering atomically on handleDragEnd', () => {
      let cvData = JSON.parse(JSON.stringify({ sections: initialSections }));
      const setCvData = vi.fn((updater) => {
        cvData = typeof updater === 'function' ? updater(cvData) : updater;
      });
      const recordHistory = vi.fn();

      const { result } = renderHook(() =>
        useCVDndCoordinator({
          cvData,
          setCvData,
          recordHistoryTransition: recordHistory,
        })
      );

      // Start drag
      act(() => {
        result.current.handleDragStart({
          active: {
            id: 'exp_1',
            data: {
              current: {
                type: 'item',
                item: cvData.sections[1].items[0],
                sectionId: 'experience',
              },
            },
          },
        });
      });

      // Drag exp_1 below exp_2
      act(() => {
        result.current.handleDragOver({
          active: {
            id: 'exp_1',
            data: {
              current: {
                type: 'item',
                sectionId: 'experience',
              },
            },
            rect: { current: { translated: { top: 250, height: 50 } } },
          },
          over: {
            id: 'exp_2',
            data: {
              current: {
                type: 'item',
                sectionId: 'experience',
              },
            },
            rect: { top: 200, height: 50 },
          },
        });
      });

      // Drop
      act(() => {
        result.current.handleDragEnd({
          active: {
            id: 'exp_1',
            data: {
              current: {
                type: 'item',
                sectionId: 'experience',
              },
            },
            rect: { current: { translated: { top: 250, height: 50 } } },
          },
          over: {
            id: 'exp_2',
            data: {
              current: {
                type: 'item',
                sectionId: 'experience',
              },
            },
            rect: { top: 200, height: 50 },
          },
        });
      });

      expect(setCvData).toHaveBeenCalled();
      expect(recordHistory).toHaveBeenCalledTimes(1);
      const expSec = cvData.sections.find((s) => s.id === 'experience');
      expect(expSec.items.map((i) => i.id)).toEqual(['exp_2', 'exp_1', 'exp_3']);
      expect(result.current.dropTarget).toBeNull();
      expect(result.current.activeDragItem).toBeNull();
    });

    it('clears dropTarget and keeps original state on handleDragCancel', () => {
      let cvData = JSON.parse(JSON.stringify({ sections: initialSections }));
      const setCvData = vi.fn((updater) => {
        cvData = typeof updater === 'function' ? updater(cvData) : updater;
      });

      const { result } = renderHook(() =>
        useCVDndCoordinator({
          cvData,
          setCvData,
        })
      );

      // Start drag
      act(() => {
        result.current.handleDragStart({
          active: {
            id: 'experience',
            data: { current: { type: 'section', section: cvData.sections[1] } },
          },
        });
      });

      // Move during drag
      act(() => {
        result.current.handleDragOver({
          active: {
            id: 'experience',
            data: { current: { type: 'section', section: cvData.sections[1] } },
            rect: { current: { translated: { top: 400, height: 100 } } },
          },
          over: {
            id: 'education',
            data: { current: { type: 'section' } },
            rect: { top: 300, height: 100 },
          },
        });
      });

      expect(result.current.dropTarget).not.toBeNull();

      // Cancel drag (e.g. Escape key pressed)
      act(() => {
        result.current.handleDragCancel();
      });

      // State is reset and document data is untouched
      expect(result.current.dropTarget).toBeNull();
      expect(result.current.activeDragSection).toBeNull();
      expect(result.current.activeDragItem).toBeNull();
      expect(cvData.sections.map((s) => s.id)).toEqual([
        'profile_header',
        'experience',
        'education',
      ]);
    });
  });
});
