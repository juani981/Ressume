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
  pages,
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

    // Helper to extract canonical section ID ignoring __cont_ suffix
    const toCanonicalSectionId = (id) => (typeof id === 'string' ? id.split('__cont_')[0] : id);

    // 1. Moving an Item (within same section, cross-section, or cross-column)
    if (activeData?.type === 'item') {
      const activeItemId = active.id;
      const activeSectionId = toCanonicalSectionId(activeData.sectionId);

      let targetSectionId = null;
      let overItemId = null;

      if (overData?.type === 'item') {
        targetSectionId = toCanonicalSectionId(overData.sectionId);
        overItemId = over.id;
      } else if (overData?.type === 'section') {
        targetSectionId = toCanonicalSectionId(over.id);
        overItemId = null;
      } else if (overData?.type === 'column') {
        let candidateSecId = null;
        if (overData.pageNumber != null && Array.isArray(pages)) {
          const targetPageModel = pages.find((p) => p.pageNumber === overData.pageNumber);
          if (targetPageModel) {
            const colSections =
              overData.column === 'left'
                ? targetPageModel.leftSections
                : overData.column === 'right'
                  ? targetPageModel.rightSections
                  : targetPageModel.singleSections;
            if (colSections && colSections.length > 0) {
              const lastSecOnPage = colSections[colSections.length - 1];
              candidateSecId = toCanonicalSectionId(lastSecOnPage.originalSectionId || lastSecOnPage.id);
            }
          }
        }
        if (candidateSecId) {
          targetSectionId = candidateSecId;
          overItemId = null;
        } else {
          const colSections = (cvData?.sections || []).filter(
            (s) => s.column === overData.column,
          );
          if (colSections.length > 0) {
            // Drop onto last section in the column
            targetSectionId = colSections[colSections.length - 1].id;
          }
        }
      } else {
        // Find which section contains over.id
        const cleanOver = toCanonicalSectionId(over.id);
        const foundSec = (cvData?.sections || []).find(
          (s) =>
            s.id === cleanOver ||
            (s.items || []).some((i) => i.id === over.id),
        );
        if (foundSec) {
          targetSectionId = foundSec.id;
          if (foundSec.id !== cleanOver) {
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
      const activeSectionId = toCanonicalSectionId(active.id);
      const activeSection = (cvData?.sections || []).find(
        (s) => s.id === activeSectionId,
      );
      if (!activeSection) return;

      let targetColumn = activeSection.column;
      let overSectionId = null;

      if (overData?.type === 'column') {
        targetColumn = overData.column;
        overSectionId = null;

        // Page-aware drop in column whitespace:
        if (overData.pageNumber != null && Array.isArray(pages)) {
          const targetPageModel = pages.find((p) => p.pageNumber === overData.pageNumber);
          if (targetPageModel) {
            const colSections =
              targetColumn === 'left'
                ? targetPageModel.leftSections
                : targetColumn === 'right'
                  ? targetPageModel.rightSections
                  : targetPageModel.singleSections;

            if (colSections && colSections.length > 0) {
              const lastSecOnPage = colSections[colSections.length - 1];
              overSectionId = toCanonicalSectionId(lastSecOnPage.originalSectionId || lastSecOnPage.id);
              position = 'below';
            } else {
              // If column is empty on this page, look backward to previous pages
              for (let pNum = overData.pageNumber - 1; pNum >= 1; pNum--) {
                const prevModel = pages.find((p) => p.pageNumber === pNum);
                if (prevModel) {
                  const prevColSections =
                    targetColumn === 'left'
                      ? prevModel.leftSections
                      : targetColumn === 'right'
                        ? prevModel.rightSections
                        : prevModel.singleSections;
                  if (prevColSections && prevColSections.length > 0) {
                    const prevLastSec = prevColSections[prevColSections.length - 1];
                    overSectionId = toCanonicalSectionId(prevLastSec.originalSectionId || prevLastSec.id);
                    position = 'below';
                    break;
                  }
                }
              }
            }
          }
        }
      } else if (overData?.type === 'section') {
        const cleanOver = toCanonicalSectionId(over.id);
        const overSection = (cvData?.sections || []).find((s) => s.id === cleanOver);
        if (overSection) {
          targetColumn = overSection.column;
          overSectionId = overSection.id;
        }
      } else if (overData?.type === 'item') {
        const cleanOverSec = toCanonicalSectionId(overData.sectionId);
        const overSection = (cvData?.sections || []).find(
          (s) => s.id === cleanOverSec,
        );
        if (overSection) {
          targetColumn = overSection.column;
          overSectionId = overSection.id;
        }
      } else {
        const cleanOver = toCanonicalSectionId(over.id);
        const foundSec = (cvData?.sections || []).find(
          (s) =>
            s.id === cleanOver ||
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

  /**
   * Clears active drag state on cancel (Escape key, drop outside valid area, etc.).
   * Without this, @dnd-kit does NOT call onDragEnd — it calls onDragCancel instead.
   * Omitting this handler leaves activeDragItem/activeDragSection stale, rendering
   * the CVDragOverlay ghost frozen on screen and items with permanent reduced opacity.
   */
  const handleDragCancel = () => {
    setActiveDragItem(null);
    setActiveDragSection(null);
  };

  return {
    sensors,
    collisionDetection: closestCorners,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    activeDragItem,
    activeDragSection,
  };
}

export default useCVDndCoordinator;
