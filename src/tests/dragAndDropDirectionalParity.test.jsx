import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act, renderHook } from '@testing-library/react';
import { CVProvider, useCV } from '../context/CVContext';
import { useCVDndCoordinator } from '../hooks/useCVDndCoordinator';
import { isFixedSection } from '../utils/dndUtils';

describe('Drag and Drop Directional Parity (Moving Below and Above)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ==========================================
  // Section Movement Directional Tests
  // ==========================================
  describe('Section Reordering: Downward and Upward Placement', () => {
    it('moves a section DOWN below another section in the same column', () => {
      let cvContext;
      const TestConsumer = () => {
        cvContext = useCV();
        return null;
      };

      render(
        <CVProvider>
          <TestConsumer />
        </CVProvider>
      );

      // In default schema, let's look at sections in column 'right'
      const initialRight = cvContext.cvData.sections.filter(s => s.column === 'right');
      expect(initialRight.length).toBeGreaterThanOrEqual(2);

      const firstSecId = initialRight[0].id;
      const secondSecId = initialRight[1].id;

      // Move first section DOWN below the second section
      act(() => {
        cvContext.moveSectionToColumnAndIndex(firstSecId, 'right', secondSecId);
      });

      const updatedRight = cvContext.cvData.sections.filter(s => s.column === 'right');
      const newFirstIdx = updatedRight.findIndex(s => s.id === firstSecId);
      const newSecondIdx = updatedRight.findIndex(s => s.id === secondSecId);

      // firstSecId MUST now be situated AFTER (below) secondSecId!
      expect(newFirstIdx).toBeGreaterThan(newSecondIdx);
    });

    it('moves a section UP above another section in the same column', () => {
      let cvContext;
      const TestConsumer = () => {
        cvContext = useCV();
        return null;
      };

      render(
        <CVProvider>
          <TestConsumer />
        </CVProvider>
      );

      const initialRight = cvContext.cvData.sections.filter(s => s.column === 'right');
      expect(initialRight.length).toBeGreaterThanOrEqual(2);

      const firstSecId = initialRight[0].id;
      const secondSecId = initialRight[1].id;

      // Move second section UP above the first section
      act(() => {
        cvContext.moveSectionToColumnAndIndex(secondSecId, 'right', firstSecId);
      });

      const updatedRight = cvContext.cvData.sections.filter(s => s.column === 'right');
      const newFirstIdx = updatedRight.findIndex(s => s.id === firstSecId);
      const newSecondIdx = updatedRight.findIndex(s => s.id === secondSecId);

      // secondSecId MUST now be situated BEFORE (above) firstSecId!
      expect(newSecondIdx).toBeLessThan(newFirstIdx);
    });

    it('respects explicit position="below" when placing section across columns', () => {
      let cvContext;
      const TestConsumer = () => {
        cvContext = useCV();
        return null;
      };

      render(
        <CVProvider>
          <TestConsumer />
        </CVProvider>
      );

      const initialLeft = cvContext.cvData.sections.filter(s => s.column === 'left');
      const initialRight = cvContext.cvData.sections.filter(s => s.column === 'right');
      const movableLeftSec = initialLeft.find(s => !isFixedSection(s));
      const leftSecId = movableLeftSec.id;
      const targetRightSecId = initialRight[0].id;

      // Move left section to right column, explicitly BELOW the target section
      act(() => {
        cvContext.moveSectionToColumnAndIndex(leftSecId, 'right', targetRightSecId, 'below');
      });

      const updatedRight = cvContext.cvData.sections.filter(s => s.column === 'right');
      const movedIdx = updatedRight.findIndex(s => s.id === leftSecId);
      const targetIdx = updatedRight.findIndex(s => s.id === targetRightSecId);

      expect(movedIdx).toBe(targetIdx + 1);
    });

    it('respects explicit position="above" when placing section across columns', () => {
      let cvContext;
      const TestConsumer = () => {
        cvContext = useCV();
        return null;
      };

      render(
        <CVProvider>
          <TestConsumer />
        </CVProvider>
      );

      const initialLeft = cvContext.cvData.sections.filter(s => s.column === 'left');
      const initialRight = cvContext.cvData.sections.filter(s => s.column === 'right');
      const movableLeftSec = initialLeft.find(s => !isFixedSection(s));
      const leftSecId = movableLeftSec.id;
      const targetRightSecId = initialRight[1].id;

      // Move left section to right column, explicitly ABOVE the target section
      act(() => {
        cvContext.moveSectionToColumnAndIndex(leftSecId, 'right', targetRightSecId, 'above');
      });

      const updatedRight = cvContext.cvData.sections.filter(s => s.column === 'right');
      const movedIdx = updatedRight.findIndex(s => s.id === leftSecId);
      const targetIdx = updatedRight.findIndex(s => s.id === targetRightSecId);

      // Since it was placed above targetRightSecId, it should precede it
      expect(movedIdx).toBe(targetIdx - 1);
    });

    it('blocks moving fixed header sections (contact, about, profile_header)', () => {
      let cvContext;
      const TestConsumer = () => {
        cvContext = useCV();
        return null;
      };

      render(
        <CVProvider>
          <TestConsumer />
        </CVProvider>
      );

      const initialSections = [...cvContext.cvData.sections];
      const fixedContact = cvContext.cvData.sections.find(s => s.type === 'contact' || s.id === 'contact');
      expect(fixedContact).toBeDefined();

      // Attempt to move contact section to right column
      act(() => {
        cvContext.moveSectionToColumnAndIndex(fixedContact.id, 'right', 'experience', 'above');
      });

      // The section order and columns must remain unchanged
      expect(cvContext.cvData.sections.map(s => s.id)).toEqual(initialSections.map(s => s.id));
      const unchangedContact = cvContext.cvData.sections.find(s => s.id === fixedContact.id);
      expect(unchangedContact.column).toBe('left');
    });

    it('dropping a section onto itself in the same column is a safe no-op', () => {
      let cvContext;
      const TestConsumer = () => {
        cvContext = useCV();
        return null;
      };

      render(
        <CVProvider>
          <TestConsumer />
        </CVProvider>
      );

      const initialSectionsOrder = cvContext.cvData.sections.map(s => s.id);
      const secId = initialSectionsOrder[1];

      act(() => {
        cvContext.moveSectionToColumnAndIndex(secId, cvContext.cvData.sections[1].column, secId);
      });

      const finalSectionsOrder = cvContext.cvData.sections.map(s => s.id);
      expect(finalSectionsOrder).toEqual(initialSectionsOrder);
    });
  });

  // ==========================================
  // Item Movement Directional Tests
  // ==========================================
  describe('Item Reordering: Downward and Upward Placement', () => {
    it('moves an item DOWN below another item within the same section', () => {
      let cvContext;
      const TestConsumer = () => {
        cvContext = useCV();
        return null;
      };

      render(
        <CVProvider>
          <TestConsumer />
        </CVProvider>
      );

      const sectionWithItems = cvContext.cvData.sections.find(s => s.items && s.items.length >= 2);
      expect(sectionWithItems).toBeDefined();

      const secId = sectionWithItems.id;
      const item0Id = sectionWithItems.items[0].id;
      const item1Id = sectionWithItems.items[1].id;

      // Move item 0 down to item 1
      act(() => {
        cvContext.moveItemBetweenSections(item0Id, item1Id, secId, secId, 'below');
      });

      const updatedSec = cvContext.cvData.sections.find(s => s.id === secId);
      const new0Idx = updatedSec.items.findIndex(i => i.id === item0Id);
      const new1Idx = updatedSec.items.findIndex(i => i.id === item1Id);

      expect(new0Idx).toBeGreaterThan(new1Idx);
    });

    it('moves an item UP above another item within the same section', () => {
      let cvContext;
      const TestConsumer = () => {
        cvContext = useCV();
        return null;
      };

      render(
        <CVProvider>
          <TestConsumer />
        </CVProvider>
      );

      const sectionWithItems = cvContext.cvData.sections.find(s => s.items && s.items.length >= 2);
      const secId = sectionWithItems.id;
      const item0Id = sectionWithItems.items[0].id;
      const item1Id = sectionWithItems.items[1].id;

      // Move item 1 up above item 0
      act(() => {
        cvContext.moveItemBetweenSections(item1Id, item0Id, secId, secId, 'above');
      });

      const updatedSec = cvContext.cvData.sections.find(s => s.id === secId);
      const new0Idx = updatedSec.items.findIndex(i => i.id === item0Id);
      const new1Idx = updatedSec.items.findIndex(i => i.id === item1Id);

      expect(new1Idx).toBeLessThan(new0Idx);
    });

    it('dropping an item onto itself is a safe no-op', () => {
      let cvContext;
      const TestConsumer = () => {
        cvContext = useCV();
        return null;
      };

      render(
        <CVProvider>
          <TestConsumer />
        </CVProvider>
      );

      const sectionWithItems = cvContext.cvData.sections.find(s => s.items && s.items.length >= 2);
      const secId = sectionWithItems.id;
      const initialItemIds = sectionWithItems.items.map(i => i.id);

      act(() => {
        cvContext.moveItemBetweenSections(initialItemIds[0], initialItemIds[0], secId, secId);
      });

      const finalSec = cvContext.cvData.sections.find(s => s.id === secId);
      expect(finalSec.items.map(i => i.id)).toEqual(initialItemIds);
    });
  });

  // ==========================================
  // Coordinator Event Interpretation Tests
  // ==========================================
  describe('useCVDndCoordinator: Drag Event Geometry & Direction Detection', () => {
    it('detects downward position when active center is below over center', () => {
      const cvData = {
        sections: [
          { id: 'sec-a', column: 'right', items: [] },
          { id: 'sec-b', column: 'right', items: [] },
        ],
      };
      const moveSection = vi.fn();
      const moveItem = vi.fn();

      const { result } = renderHook(() =>
        useCVDndCoordinator({
          cvData,
          moveItemBetweenSections: moveItem,
          moveSectionToColumnAndIndex: moveSection,
        })
      );

      // Simulate dragging sec-a downward over sec-b
      act(() => {
        result.current.handleDragEnd({
          active: {
            id: 'sec-a',
            data: { current: { type: 'section', section: cvData.sections[0] } },
            rect: {
              current: {
                initial: { top: 100, height: 100 },
                translated: { top: 250, height: 100 }, // Center: 300
              },
            },
          },
          over: {
            id: 'sec-b',
            data: { current: { type: 'section' } },
            rect: { top: 200, height: 100 }, // Center: 250
          },
          delta: { x: 0, y: 150 },
        });
      });

      expect(moveSection).toHaveBeenCalledWith('sec-a', 'right', 'sec-b', 'below');
    });

    it('detects upward position when active center is above over center', () => {
      const cvData = {
        sections: [
          { id: 'sec-a', column: 'right', items: [] },
          { id: 'sec-b', column: 'right', items: [] },
        ],
      };
      const moveSection = vi.fn();
      const moveItem = vi.fn();

      const { result } = renderHook(() =>
        useCVDndCoordinator({
          cvData,
          moveItemBetweenSections: moveItem,
          moveSectionToColumnAndIndex: moveSection,
        })
      );

      // Simulate dragging sec-b upward over sec-a
      act(() => {
        result.current.handleDragEnd({
          active: {
            id: 'sec-b',
            data: { current: { type: 'section', section: cvData.sections[1] } },
            rect: {
              current: {
                initial: { top: 250, height: 100 },
                translated: { top: 80, height: 100 }, // Center: 130
              },
            },
          },
          over: {
            id: 'sec-a',
            data: { current: { type: 'section' } },
            rect: { top: 100, height: 100 }, // Center: 150
          },
          delta: { x: 0, y: -170 },
        });
      });

      expect(moveSection).toHaveBeenCalledWith('sec-b', 'right', 'sec-a', 'above');
    });
  });
});
