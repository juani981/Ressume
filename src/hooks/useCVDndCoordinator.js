/**
 * useCVDndCoordinator.js
 *
 * Custom React hook encapsulating @dnd-kit sensor configuration, collision detection,
 * and live drag-and-drop coordination with pointer-first collision detection, immediate swap,
 * shaded placeholder preview, and smooth drop entrance tracking.
 *
 * UX Principles:
 * 1. Immediate Swap / Live Reorder: entering target by even 1px triggers reorder in real-time.
 * 2. Visual snap-in-place drop indicator ('sombra') displays exact insertion location.
 * 3. Atomic commit on drop via recordHistoryTransition and rollback on cancel.
 */

import { useState, useRef, useEffect } from 'react';
import {
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  closestCenter,
  rectIntersection,
  pointerWithin,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { adaptItemToSectionType } from '../utils/itemAdapter';
import { isFixedSection } from '../utils/dndUtils';

/**
 * Extracts canonical section ID ignoring any __cont_ split-continuation suffix.
 */
export const toCanonicalSectionId = (id) => (typeof id === 'string' ? id.split('__cont_')[0] : id);

/**
 * Edge-touch collision detection algorithm.
 * Triggers the exact instant the dragged element touches or intersects the edge of another element.
 * Prioritizes same-type droppable containers (items over items, sections over sections),
 * then falls back to parent containers (sections, columns), then closestCenter.
 */
export const edgeTouchCollisionDetection = (args) => {
  const { active, droppableContainers } = args;
  if (!active) return [];

  let activeType = active?.data?.current?.type;
  if (!activeType) {
    const container = droppableContainers.find((c) => c.id === active.id);
    activeType = container?.data?.current?.type || 'section';
  }
  const activeCanonicalId = toCanonicalSectionId(active.id);

  // Filter droppable containers of the same type (excluding active element itself)
  const sameTypeContainers = droppableContainers.filter((c) => {
    if (c.id === active.id) return false;
    if (toCanonicalSectionId(c.id) === activeCanonicalId) return false;
    const type = c.data?.current?.type;
    return type === activeType;
  });

  // 1. Primary: Edge-touch intersection with other elements of the exact same type
  if (sameTypeContainers.length > 0) {
    const collisions = rectIntersection({
      ...args,
      droppableContainers: sameTypeContainers,
    });
    if (collisions.length > 0) {
      return collisions;
    }
  }

  // 2. Secondary: If dragging an item, check intersection with section containers
  if (activeType === 'item') {
    const sectionContainers = droppableContainers.filter(
      (c) => c.data?.current?.type === 'section'
    );
    if (sectionContainers.length > 0) {
      const collisions = rectIntersection({
        ...args,
        droppableContainers: sectionContainers,
      });
      if (collisions.length > 0) {
        return collisions;
      }
    }
  }

  // 3. Tertiary: Check intersection with column containers (for cross-column moves or empty columns)
  const columnContainers = droppableContainers.filter(
    (c) => c.data?.current?.type === 'column'
  );
  if (columnContainers.length > 0) {
    const collisions = rectIntersection({
      ...args,
      droppableContainers: columnContainers,
    });
    if (collisions.length > 0) {
      return collisions;
    }
  }

  // 4. Fallback: closestCenter on same-type containers (if cursor moves fast across a gap)
  if (sameTypeContainers.length > 0) {
    const collisions = closestCenter({
      ...args,
      droppableContainers: sameTypeContainers,
    });
    if (collisions.length > 0) {
      return collisions;
    }
  }

  // 5. Ultimate fallback: closestCorners across all droppables
  return closestCorners(args);
};

/**
 * Determines directional position ('above' vs 'below') from cursor/translated rect centers.
 */
export const getDirectionalPosition = (active, over, delta) => {
  if (active?.rect?.current?.translated && over?.rect) {
    const activeCenterY =
      active.rect.current.translated.top +
      active.rect.current.translated.height / 2;
    const overCenterY = over.rect.top + over.rect.height / 2;
    return activeCenterY > overCenterY ? 'below' : 'above';
  }
  if (delta?.y !== undefined && delta.y !== 0) {
    return delta.y > 0 ? 'below' : 'above';
  }
  return null;
};

/**
 * Pointer-first collision detection:
 * 1. pointerWithin (entering by even 1px triggers collision immediately)
 * 2. rectIntersection (bounding box overlap)
 * 3. closestCenter (fallback for edge-cases or keyboard nav)
 */
export const pointerFirstCollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  const rectCollisions = rectIntersection(args);
  if (rectCollisions.length > 0) {
    return rectCollisions;
  }
  return closestCenter(args);
};

/**
 * Calculates new sections array when reordering sections.
 * Returns null if no change is needed.
 */
export function calculateReorderedSections(currentSections, activeId, over, position) {
  const activeSectionId = toCanonicalSectionId(activeId);
  const activeSec = currentSections.find((s) => s.id === activeSectionId);
  if (!activeSec) return null;
  if (isFixedSection(activeSec)) return null;

  const overData = over?.data?.current;
  let targetColumn = activeSec.column;
  let overSectionId = null;

  const cleanOver = toCanonicalSectionId(over?.id);

  if (overData?.type === 'column') {
    targetColumn = overData.column;
    overSectionId = null;
  } else if (cleanOver === 'column-left' || cleanOver?.startsWith('column-left')) {
    targetColumn = 'left';
    overSectionId = null;
  } else if (cleanOver === 'column-right' || cleanOver?.startsWith('column-right')) {
    targetColumn = 'right';
    overSectionId = null;
  } else if (cleanOver === 'column-single' || cleanOver?.startsWith('column-single')) {
    targetColumn = 'single';
    overSectionId = null;
  } else if (overData?.type === 'section') {
    const overSection = currentSections.find((s) => s.id === cleanOver);
    if (overSection) {
      targetColumn = overSection.column;
      overSectionId = overSection.id;
    }
  } else if (overData?.type === 'item') {
    const cleanOverSec = toCanonicalSectionId(overData.sectionId);
    const overSection = currentSections.find((s) => s.id === cleanOverSec);
    if (overSection) {
      targetColumn = overSection.column;
      overSectionId = overSection.id;
    }
  } else {
    const foundSec = currentSections.find(
      (s) => s.id === cleanOver || (s.items || []).some((i) => i.id === over?.id),
    );
    if (foundSec) {
      targetColumn = foundSec.column;
      overSectionId = foundSec.id;
    }
  }

  if (overSectionId === activeSectionId && targetColumn === activeSec.column) {
    return null;
  }

  // Intra-column reordering: use arrayMove between oldIdx and newIdx
  if (targetColumn === activeSec.column && overSectionId) {
    if (isFixedSection(overSectionId)) {
      return null;
    }
    const oldIdx = currentSections.findIndex((s) => s.id === activeSectionId);
    const newIdx = currentSections.findIndex((s) => s.id === overSectionId);
    if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) {
      return null;
    }
    if ((position === 'below' || position === 'after') && oldIdx > newIdx) {
      return null;
    }
    if ((position === 'above' || position === 'before') && oldIdx < newIdx) {
      return null;
    }
    const newSections = arrayMove(currentSections, oldIdx, newIdx);
    const isSame =
      newSections.length === currentSections.length &&
      newSections.every((s, i) => s.id === currentSections[i].id && s.column === currentSections[i].column);
    return isSame ? null : newSections;
  }

  // Cross-column movement
  const updatedSec = { ...activeSec, column: targetColumn };
  const remainingSections = currentSections.filter((s) => s.id !== activeSectionId);

  let insertIndex = -1;
  if (overSectionId && overSectionId !== activeSectionId) {
    const overIndexInRemaining = remainingSections.findIndex((s) => s.id === overSectionId);
    if (overIndexInRemaining !== -1) {
      const shouldPlaceBelow = position === 'below' || position === 'after';
      insertIndex = shouldPlaceBelow ? overIndexInRemaining + 1 : overIndexInRemaining;
    }
  }

  if (insertIndex === -1) {
    const lastColIndex = remainingSections.reduce(
      (lastIdx, s, idx) => (s.column === targetColumn ? idx : lastIdx),
      -1,
    );
    insertIndex = lastColIndex !== -1 ? lastColIndex + 1 : remainingSections.length;
  }

  // Ensure dynamic sections cannot precede fixed header sections in the target column
  const lastFixedIndexInCol = remainingSections.reduce((lastIdx, s, idx) => {
    return s.column === targetColumn && isFixedSection(s) ? idx : lastIdx;
  }, -1);

  if (lastFixedIndexInCol !== -1 && insertIndex <= lastFixedIndexInCol) {
    insertIndex = lastFixedIndexInCol + 1;
  }

  const newSections = [...remainingSections];
  newSections.splice(insertIndex, 0, updatedSec);

  const isSame =
    newSections.length === currentSections.length &&
    newSections.every(
      (s, i) => s.id === currentSections[i].id && s.column === currentSections[i].column,
    );

  return isSame ? null : newSections;
}

/**
 * Calculates new sections array when reordering items.
 * Returns null if no change is needed.
 */
export function calculateReorderedItems(currentSections, activeItemId, activeSectionId, over, position) {
  const overData = over?.data?.current;
  let targetSectionId = null;
  let overItemId = null;

  if (overData?.type === 'item') {
    targetSectionId = toCanonicalSectionId(overData.sectionId);
    overItemId = over.id;
  } else if (overData?.type === 'section') {
    targetSectionId = toCanonicalSectionId(over.id);
    overItemId = null;
  } else if (overData?.type === 'column') {
    const colSections = currentSections.filter((s) => s.column === overData.column);
    if (colSections.length > 0) {
      targetSectionId = colSections[colSections.length - 1].id;
    }
  } else {
    const cleanOver = toCanonicalSectionId(over?.id);
    const foundSec = currentSections.find(
      (s) => s.id === cleanOver || (s.items || []).some((i) => i.id === over?.id),
    );
    if (foundSec) {
      targetSectionId = foundSec.id;
      if (foundSec.id !== cleanOver) {
        overItemId = over?.id;
      }
    }
  }

  if (!targetSectionId) return null;

  const sourceSec = currentSections.find((s) =>
    (s.items || []).some((i) => i.id === activeItemId),
  );
  const targetSec = currentSections.find((s) => s.id === targetSectionId);
  if (!sourceSec || !targetSec) return null;

  const sourceItem = (sourceSec.items || []).find((i) => i.id === activeItemId);
  if (!sourceItem) return null;

  // Intra-section reordering: use arrayMove between oldIdx and newIdx
  if (sourceSec.id === targetSec.id) {
    if (!overItemId || activeItemId === overItemId) return null;

    const oldIdx = (sourceSec.items || []).findIndex((i) => i.id === activeItemId);
    const newIdx = (sourceSec.items || []).findIndex((i) => i.id === overItemId);
    if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return null;

    if ((position === 'below' || position === 'after') && oldIdx > newIdx) {
      return null;
    }
    if ((position === 'above' || position === 'before') && oldIdx < newIdx) {
      return null;
    }

    const newItems = arrayMove(sourceSec.items, oldIdx, newIdx);

    const isSame =
      newItems.length === sourceSec.items.length &&
      newItems.every((item, idx) => item.id === sourceSec.items[idx].id);
    if (isSame) return null;

    return currentSections.map((s) =>
      s.id === sourceSec.id ? { ...s, items: newItems } : s,
    );
  }

  // Cross-section move: insert at target section before/after overItemId
  const shouldPlaceBelow = position === 'below' || position === 'after';
  const adaptedItem =
    typeof adaptItemToSectionType === 'function'
      ? adaptItemToSectionType(sourceItem, targetSec.type)
      : sourceItem;

  const newSourceItems = (sourceSec.items || []).filter((i) => i.id !== activeItemId);
  const remainingTargetItems = (targetSec.items || []).filter((i) => i.id !== activeItemId);

  let insertIndex = -1;
  if (overItemId) {
    const overIndexInRemaining = remainingTargetItems.findIndex((i) => i.id === overItemId);
    if (overIndexInRemaining !== -1) {
      insertIndex = shouldPlaceBelow ? overIndexInRemaining + 1 : overIndexInRemaining;
    }
  }

  if (insertIndex === -1) {
    insertIndex = remainingTargetItems.length;
  }

  const newTargetItems = [...remainingTargetItems];
  newTargetItems.splice(insertIndex, 0, adaptedItem);

  return currentSections.map((s) => {
    if (s.id === sourceSec.id) return { ...s, items: newSourceItems };
    if (s.id === targetSec.id) return { ...s, items: newTargetItems };
    return s;
  });
}

/**
 * Coordinates DnD sensors and event handlers for sections and items with live reordering UX.
 *
 * @param {Object} options
 * @param {Object} options.cvData - Current CV data model
 * @param {Function} [options.setCvData] - Context state setter for direct state mutations
 * @param {Function} [options.recordHistoryTransition] - Commits atomic history step on drag end
 * @param {Function} [options.moveItemBetweenSections] - Context handler for moving items
 * @param {Function} [options.moveSectionToColumnAndIndex] - Context handler for moving sections
 * @returns {{
 *   sensors: ReturnType<typeof useSensors>,
 *   collisionDetection: typeof pointerFirstCollisionDetection,
 *   handleDragStart: (event: any) => void,
 *   handleDragOver: (event: any) => void,
 *   handleDragEnd: (event: any) => void,
 *   handleDragCancel: () => void,
 *   activeDragItem: any,
 *   activeDragSection: any,
 *   dropTarget: any,
 *   justDroppedId: string|null
 * }}
 */
export function useCVDndCoordinator({
  cvData,
  setCvData,
  recordHistoryTransition,
  moveItemBetweenSections,
  moveSectionToColumnAndIndex,
}) {
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [activeDragSection, setActiveDragSection] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [justDroppedId, setJustDroppedId] = useState(null);
  const dropTimerRef = useRef(null);

  const cvDataRef = useRef(cvData);
  cvDataRef.current = cvData;

  const dragStartSnapshotRef = useRef(null);

  useEffect(() => {
    return () => {
      if (dropTimerRef.current) {
        clearTimeout(dropTimerRef.current);
      }
    };
  }, []);

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
    const initialWidth = active?.rect?.current?.initial?.width;

    dragStartSnapshotRef.current = cvDataRef.current
      ? JSON.parse(JSON.stringify(cvDataRef.current))
      : null;

    const activeCanonical = toCanonicalSectionId(active?.id);
    const foundSection = (cvDataRef.current?.sections || []).find(
      (s) => s.id === activeCanonical,
    );

    if (data?.type === 'section' || (!data?.type && foundSection)) {
      const section = data?.section || foundSection;
      if (isFixedSection(section)) {
        return;
      }
      setActiveDragSection({ ...data, section, initialWidth });
      setActiveDragItem(null);
    } else if (data?.type === 'item' || !foundSection) {
      let item = data?.item;
      let sectionId = data?.sectionId;
      let sectionType = data?.sectionType;

      if (!item && cvDataRef.current?.sections) {
        for (const sec of cvDataRef.current.sections) {
          const found = (sec.items || []).find((i) => i.id === active?.id);
          if (found) {
            item = found;
            sectionId = sec.id;
            sectionType = sec.type;
            break;
          }
        }
      }

      setActiveDragItem({
        ...data,
        item,
        sectionId: sectionId ? toCanonicalSectionId(sectionId) : undefined,
        sectionType,
        initialWidth,
      });
      setActiveDragSection(null);
    }
    setDropTarget(null);
  };

  /**
   * Dynamically reorders sections and items in real time as the dragged element
   * touches or intersects the edge/border of another element (matching Framer Motion Reorder UX).
   */
  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over || !active || active.id === over.id) {
      setDropTarget(null);
      return;
    }

    const currentData = cvDataRef.current;
    if (!currentData?.sections) return;

    const position = getDirectionalPosition(active, over, event?.delta);
    const activeData = active?.data?.current;
    const overData = over?.data?.current;

    const activeCanonical = toCanonicalSectionId(active.id);
    const cleanOver = toCanonicalSectionId(over.id);
    const isSection =
      activeData?.type === 'section' ||
      Boolean(activeDragSection) ||
      currentData.sections.some((s) => s.id === activeCanonical);

    const isItem =
      !isSection &&
      (activeData?.type === 'item' ||
        Boolean(activeDragItem) ||
        currentData.sections.some((s) =>
          (s.items || []).some((i) => i.id === active.id),
        ));

    // A. LIVE REORDERING FOR SECTIONS
    if (isSection) {
      const activeSectionId = activeCanonical;
      const activeSec = currentData.sections.find((s) => s.id === activeSectionId);
      if (!activeSec || isFixedSection(activeSec)) return;

      let targetColumn = activeSec.column;
      let overSectionId = null;

      if (overData?.type === 'column') {
        targetColumn = overData.column;
        overSectionId = null;
      } else if (overData?.type === 'section') {
        const overSection = currentData.sections.find((s) => s.id === cleanOver);
        if (overSection) {
          targetColumn = overSection.column;
          overSectionId = overSection.id;
        }
      } else if (overData?.type === 'item') {
        const cleanOverSec = toCanonicalSectionId(overData.sectionId);
        const overSection = currentData.sections.find((s) => s.id === cleanOverSec);
        if (overSection) {
          targetColumn = overSection.column;
          overSectionId = overSection.id;
        }
      } else {
        if (cleanOver === 'column-left' || cleanOver.startsWith('column-left')) {
          targetColumn = 'left';
        } else if (cleanOver === 'column-right' || cleanOver.startsWith('column-right')) {
          targetColumn = 'right';
        } else {
          const foundSec = currentData.sections.find(
            (s) => s.id === cleanOver || (s.items || []).some((i) => i.id === over.id),
          );
          if (foundSec) {
            targetColumn = foundSec.column;
            overSectionId = foundSec.id;
          }
        }
      }

      setDropTarget({
        type: 'section',
        activeSectionId,
        targetColumn,
        targetSectionId: overSectionId,
        position: position || 'below',
      });

      // Prevent placing dynamic sections before fixed header sections
      if (overSectionId) {
        const overSection = currentData.sections.find((s) => s.id === overSectionId);
        if (overSection && isFixedSection(overSection)) {
          return;
        }
      }

      // Live state mutation:
      if (typeof setCvData === 'function') {
        // Intra-column reordering
        if (overSectionId && targetColumn === activeSec.column) {
          const oldIndex = currentData.sections.findIndex((s) => s.id === activeSectionId);
          const newIndex = currentData.sections.findIndex((s) => s.id === overSectionId);
          if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            const nextSections = arrayMove(currentData.sections, oldIndex, newIndex);
            const nextData = { ...currentData, sections: nextSections };
            cvDataRef.current = nextData;
            setCvData(nextData);
          }
        } else if (targetColumn !== activeSec.column) {
          // Cross-column reordering
          const updatedSec = { ...activeSec, column: targetColumn };
          const remainingSections = currentData.sections.filter((s) => s.id !== activeSectionId);
          let insertIndex = -1;
          if (overSectionId) {
            insertIndex = remainingSections.findIndex((s) => s.id === overSectionId);
          }
          if (insertIndex === -1) {
            const lastColIndex = remainingSections.reduce(
              (lastIdx, s, idx) => (s.column === targetColumn ? idx : lastIdx),
              -1,
            );
            insertIndex = lastColIndex !== -1 ? lastColIndex + 1 : remainingSections.length;
          }
          const nextSections = [...remainingSections];
          nextSections.splice(insertIndex, 0, updatedSec);
          const nextData = { ...currentData, sections: nextSections };
          cvDataRef.current = nextData;
          setCvData(nextData);
        }
      }
      return;
    }

    // B. LIVE REORDERING FOR ITEMS
    if (isItem) {
      const activeItemId = active.id;
      const sourceSec = currentData.sections.find((s) =>
        (s.items || []).some((i) => i.id === activeItemId),
      );
      if (!sourceSec) return;
      const sourceItem = (sourceSec.items || []).find((i) => i.id === activeItemId);
      if (!sourceItem) return;

      let targetSectionId = null;
      let overItemId = null;
      const overData = over?.data?.current;

      if (overData?.type === 'item') {
        targetSectionId = toCanonicalSectionId(overData.sectionId);
        overItemId = over.id;
      } else if (overData?.type === 'section') {
        targetSectionId = toCanonicalSectionId(over.id);
        overItemId = null;
      } else if (overData?.type === 'column') {
        const colSections = currentData.sections.filter((s) => s.column === overData.column);
        if (colSections.length > 0) {
          targetSectionId = colSections[colSections.length - 1].id;
        }
      } else {
        const cleanOver = toCanonicalSectionId(over.id);
        const foundSec = currentData.sections.find(
          (s) => s.id === cleanOver || (s.items || []).some((i) => i.id === over.id),
        );
        if (foundSec) {
          targetSectionId = foundSec.id;
          if (foundSec.id !== cleanOver) {
            overItemId = over.id;
          }
        }
      }

      setDropTarget({
        type: 'item',
        activeItemId,
        activeSectionId: sourceSec.id,
        targetSectionId,
        targetItemId: overItemId,
        position: position || 'below',
      });

      if (!targetSectionId) return;
      const targetSec = currentData.sections.find((s) => s.id === targetSectionId);
      if (!targetSec) return;

      if (typeof setCvData === 'function') {
        // Intra-section reordering
        if (sourceSec.id === targetSec.id) {
          if (overItemId && activeItemId !== overItemId) {
            const oldIndex = sourceSec.items.findIndex((i) => i.id === activeItemId);
            const newIndex = sourceSec.items.findIndex((i) => i.id === overItemId);
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
              const nextItems = arrayMove(sourceSec.items, oldIndex, newIndex);
              const nextSections = currentData.sections.map((s) =>
                s.id === sourceSec.id ? { ...s, items: nextItems } : s,
              );
              const nextData = { ...currentData, sections: nextSections };
              cvDataRef.current = nextData;
              setCvData(nextData);
            }
          }
        } else {
          // Cross-section reordering
          const adaptedItem =
            typeof adaptItemToSectionType === 'function'
              ? adaptItemToSectionType(sourceItem, targetSec.type)
              : sourceItem;

          const remainingSourceItems = sourceSec.items.filter((i) => i.id !== activeItemId);
          const remainingTargetItems = (targetSec.items || []).filter((i) => i.id !== activeItemId);

          let insertIndex = -1;
          if (overItemId) {
            insertIndex = remainingTargetItems.findIndex((i) => i.id === overItemId);
          }
          if (insertIndex === -1) {
            insertIndex = remainingTargetItems.length;
          }

          const nextTargetItems = [...remainingTargetItems];
          nextTargetItems.splice(insertIndex, 0, adaptedItem);

          const nextSections = currentData.sections.map((s) => {
            if (s.id === sourceSec.id) return { ...s, items: remainingSourceItems };
            if (s.id === targetSec.id) return { ...s, items: nextTargetItems };
            return s;
          });
          const nextData = { ...currentData, sections: nextSections };
          cvDataRef.current = nextData;
          setCvData(nextData);
        }
      }
    }
  };

  /**
   * Finalizes the drag operation and commits an atomic history step if state changed.
   */
  const handleDragEnd = (event) => {
    const { active, over } = event || {};
    const preSnapshot = dragStartSnapshotRef.current;
    let currentData = cvDataRef.current;

    // Safety fallback: if handleDragOver wasn't fired prior to release, execute commit calculation
    if (active && over && active.id !== over.id && currentData?.sections) {
      const activeCanonical = toCanonicalSectionId(active.id);
      const isSec = currentData.sections.some((s) => s.id === activeCanonical);
      if (isSec) {
        const activeSectionId = activeCanonical;
        const activeSec = currentData.sections.find((s) => s.id === activeSectionId);
        let targetColumn = activeSec ? activeSec.column : 'right';
        let overSectionId = null;

        const overData = over?.data?.current;
        if (overData?.type === 'column') {
          targetColumn = overData.column;
        } else if (overData?.type === 'section') {
          const cleanOver = toCanonicalSectionId(over.id);
          const overSection = currentData.sections.find((s) => s.id === cleanOver);
          if (overSection) {
            targetColumn = overSection.column;
            overSectionId = overSection.id;
          }
        } else {
          const cleanOver = toCanonicalSectionId(over.id);
          const foundSec = currentData.sections.find((s) => s.id === cleanOver);
          if (foundSec) {
            targetColumn = foundSec.column;
            overSectionId = foundSec.id;
          }
        }

        const position = getDirectionalPosition(active, over, event?.delta) || 'below';

        if (typeof moveSectionToColumnAndIndex === 'function') {
          moveSectionToColumnAndIndex(activeSectionId, targetColumn, overSectionId, position);
        } else if (typeof setCvData === 'function') {
          const reordered = calculateReorderedSections(
            currentData.sections,
            active.id,
            over,
            position,
          );
          if (reordered) {
            currentData = { ...currentData, sections: reordered };
            cvDataRef.current = currentData;
            setCvData(currentData);
          }
        }
      } else {
        const activeItemId = active.id;
        const srcSec = currentData.sections.find((s) =>
          (s.items || []).some((i) => i.id === activeItemId),
        );
        if (srcSec) {
          const overData = over?.data?.current;
          let targetSectionId = srcSec.id;
          let overItemId = null;
          if (overData?.type === 'item') {
            targetSectionId = toCanonicalSectionId(overData.sectionId);
            overItemId = over.id;
          } else if (overData?.type === 'section') {
            targetSectionId = toCanonicalSectionId(over.id);
          } else {
            const cleanOver = toCanonicalSectionId(over.id);
            const foundSec = currentData.sections.find(
              (s) => s.id === cleanOver || (s.items || []).some((i) => i.id === over.id),
            );
            if (foundSec) {
              targetSectionId = foundSec.id;
              if (foundSec.id !== cleanOver) overItemId = over.id;
            }
          }

          const position = getDirectionalPosition(active, over, event?.delta) || 'below';

          if (typeof moveItemBetweenSections === 'function') {
            moveItemBetweenSections(
              activeItemId,
              overItemId,
              srcSec.id,
              targetSectionId,
              position,
            );
          } else if (typeof setCvData === 'function') {
            const reordered = calculateReorderedItems(
              currentData.sections,
              activeItemId,
              srcSec.id,
              over,
              position,
            );
            if (reordered) {
              currentData = { ...currentData, sections: reordered };
              cvDataRef.current = currentData;
              setCvData(currentData);
            }
          }
        }
      }
    }

    setActiveDragItem(null);
    setActiveDragSection(null);
    setDropTarget(null);
    dragStartSnapshotRef.current = null;

    if (preSnapshot && currentData && typeof recordHistoryTransition === 'function') {
      if (JSON.stringify(preSnapshot.sections) !== JSON.stringify(currentData.sections)) {
        recordHistoryTransition(preSnapshot, currentData);
      }
    }
  };

  /**
   * Resets active drag and drop target states on cancellation, restoring initial snapshot if modified.
   */
  const handleDragCancel = () => {
    if (dragStartSnapshotRef.current && typeof setCvData === 'function') {
      setCvData(dragStartSnapshotRef.current);
      cvDataRef.current = dragStartSnapshotRef.current;
    }
    setJustDroppedId(null);
    setActiveDragItem(null);
    setActiveDragSection(null);
    setDropTarget(null);
    dragStartSnapshotRef.current = null;
  };

  return {
    sensors,
    collisionDetection: edgeTouchCollisionDetection,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    activeDragItem,
    activeDragSection,
    dropTarget,
    justDroppedId,
  };
}

export default useCVDndCoordinator;
