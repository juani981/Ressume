/**
 * liveSortDndCoordinator.test.jsx
 *
 * Exhaustive unit test suite verifying real-time live sort drag-and-drop reordering,
 * in-place placeholder presentation without floating clone overlay,
 * and single atomic undo/redo history commit.
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, renderHook, act } from '@testing-library/react';
import { useCVDndCoordinator } from '../hooks/useCVDndCoordinator';
import { CVDragOverlay } from '../components/Editor/CVDragOverlay';

describe('Live Sort Drag & Drop Coordinator (Real-time auto-adjustment)', () => {
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

  it('CVDragOverlay returns null (no floating clone tracking cursor)', () => {
    const { container } = render(
      <CVDragOverlay
        activeDragItem={{ id: 'exp_1' }}
        activeDragSection={{ id: 'experience' }}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  describe('Section live reordering on handleDragOver', () => {
    it('reorders sections downward in real time during drag over before mouse release', () => {
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

      // Verify setCvData was invoked and sections reordered: experience moved below education
      expect(setCvData).toHaveBeenCalled();
      expect(cvData.sections.map((s) => s.id)).toEqual([
        'profile_header',
        'education',
        'experience',
      ]);
    });

    it('reorders sections upward in real time during drag over', () => {
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

      // Start dragging experience upward
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

      expect(cvData.sections.map((s) => s.id)).toEqual([
        'profile_header',
        'experience',
        'education',
      ]);
    });
  });

  describe('Item live reordering on handleDragOver', () => {
    it('reorders items within the same section in real time', () => {
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

      expect(setCvData).toHaveBeenCalled();
      const expSec = cvData.sections.find((s) => s.id === 'experience');
      expect(expSec.items.map((i) => i.id)).toEqual(['exp_2', 'exp_1', 'exp_3']);
    });
  });

  describe('Atomic history commit and cancel rollback', () => {
    it('commits pre-drag snapshot and next state to history on handleDragEnd', () => {
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

      // Release mouse
      act(() => {
        result.current.handleDragEnd({
          active: { id: 'experience' },
          over: { id: 'education' },
        });
      });

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
    });

    it('rolls back to pre-drag snapshot on handleDragCancel', () => {
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

      expect(cvData.sections.map((s) => s.id)).toEqual([
        'profile_header',
        'education',
        'experience',
      ]);

      // Cancel drag (e.g. Escape key pressed)
      act(() => {
        result.current.handleDragCancel();
      });

      // Rollback called with pre-drag snapshot
      expect(setCvData).toHaveBeenLastCalledWith(
        expect.objectContaining({
          sections: expect.arrayContaining([
            expect.objectContaining({ id: 'experience' }),
          ]),
        })
      );
      expect(cvData.sections.map((s) => s.id)).toEqual([
        'profile_header',
        'experience',
        'education',
      ]);
    });
  });
});
