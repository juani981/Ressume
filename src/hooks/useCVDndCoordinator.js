/**
 * useCVDndCoordinator.js
 *
 * Custom React hook encapsulating @dnd-kit sensor configuration, collision detection,
 * and drag-and-drop state coordination for polymorphic cross-column sections and items.
 */

import { useState } from 'react';
import {
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

/**
 * Coordinates DnD sensors and event handlers for sections and items.
 *
 * @param {Object} options
 * @param {Object} options.cvData - Current CV data model
 * @param {Function} options.moveItemBetweenSections - Context handler for moving items
 * @param {Function} options.moveSectionToColumnAndIndex - Context handler for moving sections
 * @returns {{
 *   sensors: ReturnType<typeof useSensors>,
 *   collisionDetection: typeof closestCorners,
 *   handleDragStart: (event: any) => void,
 *   handleDragOver: (event: any) => void,
 *   handleDragEnd: (event: any) => void,
 *   activeDragItem: any,
 *   activeDragSection: any
 * }}
 */
export function useCVDndCoordinator({
  cvData,
  moveItemBetweenSections,
  moveSectionToColumnAndIndex,
}) {
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [activeDragSection, setActiveDragSection] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Avoids triggering drag on simple clicks or text selection
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const data = active?.data?.current;

    if (data?.type === 'item') {
      setActiveDragItem(data);
      setActiveDragSection(null);
    } else if (data?.type === 'section') {
      setActiveDragSection(data);
      setActiveDragItem(null);
    }
  };

  const handleDragOver = (_event) => {
    // Keep drag over lightweight to avoid re-rendering layout during active drag gesture
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveDragItem(null);
    setActiveDragSection(null);

    if (!over) return;
    if (active.id === over.id) return;

    const activeData = active?.data?.current;
    const overData = over?.data?.current;

    // Determine directional drop position ('below' vs 'above')
    let position = null;
    if (active?.rect?.current?.translated && over?.rect) {
      const activeCenterY =
        active.rect.current.translated.top +
        active.rect.current.translated.height / 2;
      const overCenterY = over.rect.top + over.rect.height / 2;
      position = activeCenterY > overCenterY ? 'below' : 'above';
    } else if (event?.delta?.y !== undefined && event.delta.y !== 0) {
      position = event.delta.y > 0 ? 'below' : 'above';
    }

    // 1. Moving an Item (within same section, cross-section, or cross-column)
    if (activeData?.type === 'item') {
      const activeItemId = active.id;
      const activeSectionId = activeData.sectionId;

      let targetSectionId = null;
      let overItemId = null;

      if (overData?.type === 'item') {
        targetSectionId = overData.sectionId;
        overItemId = over.id;
      } else if (overData?.type === 'section') {
        targetSectionId = over.id;
        overItemId = null;
      } else if (overData?.type === 'column') {
        const colSections = (cvData?.sections || []).filter(
          (s) => s.column === overData.column,
        );
        if (colSections.length > 0) {
          targetSectionId = colSections[colSections.length - 1].id;
        }
      } else {
        // Find which section contains over.id
        const foundSec = (cvData?.sections || []).find(
          (s) =>
            s.id === over.id ||
            (s.items || []).some((i) => i.id === over.id),
        );
        if (foundSec) {
          targetSectionId = foundSec.id;
          if (foundSec.id !== over.id) {
            overItemId = over.id;
          }
        }
      }

      if (activeSectionId && targetSectionId && typeof moveItemBetweenSections === 'function') {
        moveItemBetweenSections(
          activeItemId,
          overItemId,
          activeSectionId,
          targetSectionId,
          position,
        );
      }
      return;
    }

    // 2. Moving a Section (cross-column or intra-column reordering)
    if (activeData?.type === 'section') {
      const activeSectionId = active.id;
      const activeSection = (cvData?.sections || []).find(
        (s) => s.id === activeSectionId,
      );
      if (!activeSection) return;

      let targetColumn = activeSection.column;
      let overSectionId = null;

      if (overData?.type === 'column') {
        targetColumn = overData.column;
        overSectionId = null;
      } else if (overData?.type === 'section') {
        const overSection = (cvData?.sections || []).find((s) => s.id === over.id);
        if (overSection) {
          targetColumn = overSection.column;
          overSectionId = overSection.id;
        }
      } else if (overData?.type === 'item') {
        const overSection = (cvData?.sections || []).find(
          (s) => s.id === overData.sectionId,
        );
        if (overSection) {
          targetColumn = overSection.column;
          overSectionId = overSection.id;
        }
      } else {
        const foundSec = (cvData?.sections || []).find(
          (s) =>
            s.id === over.id ||
            (s.items || []).some((i) => i.id === over.id),
        );
        if (foundSec) {
          targetColumn = foundSec.column;
          overSectionId = foundSec.id;
        }
      }

      if (typeof moveSectionToColumnAndIndex === 'function') {
        moveSectionToColumnAndIndex(
          activeSectionId,
          targetColumn,
          overSectionId,
          position,
        );
      }
    }
  };

  return {
    sensors,
    collisionDetection: closestCorners,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    activeDragItem,
    activeDragSection,
  };
}

export default useCVDndCoordinator;
