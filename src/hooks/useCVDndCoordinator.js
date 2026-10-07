/**
 * useCVDndCoordinator.js
 *
 * Custom React hook encapsulating @dnd-kit sensor configuration, collision detection,
 * and static snap-in-place drag-and-drop coordination for sections and items.
 *
 * UX Principles:
 * 1. Document layout remains completely static while dragging (zero micro-movement layout thrashing).
 * 2. Visual snap-in-place drop indicator ('sombra') displays exact insertion location.
 * 3. Atomic commit on drop via moveSectionToColumnAndIndex / moveItemBetweenSections.
 */

import { useState, useRef } from 'react';
import {
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { adaptItemToSectionType } from '../utils/itemAdapter';
import { isFixedSection } from '../utils/dndUtils';

/**
 * Extracts canonical section ID ignoring any __cont_ split-continuation suffix.
 */
export const toCanonicalSectionId = (id) => (typeof id === 'string' ? id.split('__cont_')[0] : id);

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
 * Calculates new sections array when reordering sections.
 * Returns null if no change is needed.
 */
export function calculateReorderedSections(currentSections, activeId, over, position) {
  const activeSectionId = toCanonicalSectionId(activeId);
  const activeSec = currentSections.find((s) => s.id === activeSectionId);
  if (!activeSec) return null;

  const overData = over?.data?.current;
  let targetColumn = activeSec.column;
  let overSectionId = null;

  if (overData?.type === 'column') {
    targetColumn = overData.column;
    overSectionId = null;
  } else if (overData?.type === 'section') {
    const cleanOver = toCanonicalSectionId(over.id);
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
    const cleanOver = toCanonicalSectionId(over.id);
    const foundSec = currentSections.find(
      (s) => s.id === cleanOver || (s.items || []).some((i) => i.id === over.id),
    );
    if (foundSec) {
      targetColumn = foundSec.column;
      overSectionId = foundSec.id;
    }
  }

  if (overSectionId === activeSectionId && targetColumn === activeSec.column) {
    return null;
  }

  const updatedSec = { ...activeSec, column: targetColumn };
  const remainingSections = currentSections.filter((s) => s.id !== activeSectionId);

  let insertIndex = -1;
  if (overSectionId && overSectionId !== activeSectionId) {
    const overIndexInRemaining = remainingSections.findIndex((s) => s.id === overSectionId);
    if (overIndexInRemaining !== -1) {
      let shouldPlaceBelow = false;
      if (position === 'below' || position === 'after') {
        shouldPlaceBelow = true;
      } else if (position === 'above' || position === 'before') {
        shouldPlaceBelow = false;
      } else {
        const colSections = currentSections.filter((s) => s.column === targetColumn);
        const oldColIdx = colSections.findIndex((s) => s.id === activeSectionId);
        const overColIdx = colSections.findIndex((s) => s.id === overSectionId);
        if (oldColIdx !== -1 && overColIdx !== -1) {
          shouldPlaceBelow = oldColIdx < overColIdx;
        } else if (activeSec.column === targetColumn) {
          const oldIdx = currentSections.findIndex((s) => s.id === activeSectionId);
          const overIdx = currentSections.findIndex((s) => s.id === overSectionId);
          shouldPlaceBelow = oldIdx !== -1 && overIdx !== -1 && oldIdx < overIdx;
        } else {
          shouldPlaceBelow = false;
        }
      }

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
    const cleanOver = toCanonicalSectionId(over.id);
    const foundSec = currentSections.find(
      (s) => s.id === cleanOver || (s.items || []).some((i) => i.id === over.id),
    );
    if (foundSec) {
      targetSectionId = foundSec.id;
      if (foundSec.id !== cleanOver) {
        overItemId = over.id;
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

  const shouldPlaceBelow = position === 'below' || position === 'after';

  // Intra-section reordering
  if (sourceSec.id === targetSec.id) {
    if (!overItemId || activeItemId === overItemId) return null;

    const remainingItems = sourceSec.items.filter((i) => i.id !== activeItemId);
    const overIndexInRemaining = remainingItems.findIndex((i) => i.id === overItemId);
    if (overIndexInRemaining === -1) return null;

    const insertIndex = shouldPlaceBelow ? overIndexInRemaining + 1 : overIndexInRemaining;
    const newItems = [...remainingItems];
    newItems.splice(insertIndex, 0, sourceItem);

    const isSame =
      newItems.length === sourceSec.items.length &&
      newItems.every((item, idx) => item.id === sourceSec.items[idx].id);
    if (isSame) return null;

    return currentSections.map((s) =>
      s.id === sourceSec.id ? { ...s, items: newItems } : s,
    );
  }

  // Cross-section move
  const adaptedItem =
    typeof adaptItemToSectionType === 'function'
      ? adaptItemToSectionType(sourceItem, targetSec.type)
      : sourceItem;

  const newSourceItems = sourceSec.items.filter((i) => i.id !== activeItemId);
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
 * Coordinates DnD sensors and event handlers for sections and items with static snap-in-place UX.
 *
 * @param {Object} options
 * @param {Object} options.cvData - Current CV data model
 * @param {Function} [options.setCvData] - Context state setter for direct state mutations
 * @param {Function} [options.recordHistoryTransition] - Commits atomic history step on drag end
 * @param {Function} [options.moveItemBetweenSections] - Context handler for moving items
 * @param {Function} [options.moveSectionToColumnAndIndex] - Context handler for moving sections
 * @returns {{
 *   sensors: ReturnType<typeof useSensors>,
 *   collisionDetection: typeof closestCorners,
 *   handleDragStart: (event: any) => void,
 *   handleDragOver: (event: any) => void,
 *   handleDragEnd: (event: any) => void,
 *   handleDragCancel: () => void,
 *   activeDragItem: any,
 *   activeDragSection: any,
 *   dropTarget: any
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

  const cvDataRef = useRef(cvData);
  cvDataRef.current = cvData;

  const dragStartSnapshotRef = useRef(null);

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
   * Tracks drop target position ('sombra') in real-time WITHOUT mutating the live document structure.
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

    if (activeData?.type === 'section') {
      const activeSectionId = toCanonicalSectionId(active.id);
      const activeSec = currentData.sections.find((s) => s.id === activeSectionId);
      let targetColumn = activeSec ? activeSec.column : 'right';
      let targetSectionId = null;

      if (overData?.type === 'column') {
        targetColumn = overData.column;
        targetSectionId = null;
      } else if (overData?.type === 'section') {
        const cleanOver = toCanonicalSectionId(over.id);
        const overSection = currentData.sections.find((s) => s.id === cleanOver);
        if (overSection) {
          targetColumn = overSection.column;
          targetSectionId = overSection.id;
        }
      } else if (overData?.type === 'item') {
        const cleanOverSec = toCanonicalSectionId(overData.sectionId);
        const overSection = currentData.sections.find((s) => s.id === cleanOverSec);
        if (overSection) {
          targetColumn = overSection.column;
          targetSectionId = overSection.id;
        }
      } else {
        const cleanOver = toCanonicalSectionId(over.id);
        const foundSec = currentData.sections.find(
          (s) => s.id === cleanOver || (s.items || []).some((i) => i.id === over.id),
        );
        if (foundSec) {
          targetColumn = foundSec.column;
          targetSectionId = foundSec.id;
        }
      }

      setDropTarget({
        type: 'section',
        activeSectionId,
        targetColumn,
        targetSectionId,
        position: position || 'below',
      });
    } else if (activeData?.type === 'item') {
      const activeSectionId = toCanonicalSectionId(activeData.sectionId);
      let targetSectionId = activeSectionId;
      let targetItemId = null;

      if (overData?.type === 'item') {
        targetSectionId = toCanonicalSectionId(overData.sectionId);
        targetItemId = over.id;
      } else if (overData?.type === 'section') {
        targetSectionId = toCanonicalSectionId(over.id);
        targetItemId = null;
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
            targetItemId = over.id;
          }
        }
      }

      setDropTarget({
        type: 'item',
        activeItemId: active.id,
        activeSectionId,
        targetSectionId,
        targetItemId,
        position: position || 'below',
      });
    }
  };

  /**
   * Commits the reordering once the element is dropped into place.
   */
  const handleDragEnd = (event) => {
    const { active, over } = event;
    const currentDropTarget = dropTarget;
    const preSnapshot = dragStartSnapshotRef.current;
    const currentActiveDragItem = activeDragItem;
    const currentActiveDragSection = activeDragSection;

    setActiveDragItem(null);
    setActiveDragSection(null);
    setDropTarget(null);
    dragStartSnapshotRef.current = null;

    if (!over || !active) return;
    if (active.id === over.id) return;

    const activeData = active?.data?.current;
    const overData = over?.data?.current;
    const position =
      getDirectionalPosition(active, over, event?.delta) ||
      currentDropTarget?.position ||
      'below';

    const activeCanonical = toCanonicalSectionId(active.id);
    const isSection =
      activeData?.type === 'section' ||
      Boolean(currentActiveDragSection) ||
      (cvDataRef.current?.sections || []).some((s) => s.id === activeCanonical);

    const isItem =
      !isSection &&
      (activeData?.type === 'item' ||
        Boolean(currentActiveDragItem) ||
        (cvDataRef.current?.sections || []).some((s) =>
          (s.items || []).some((i) => i.id === active.id),
        ));

    // 1. Moving an Item
    if (isItem) {
      const activeItemId = active.id;
      let activeSectionId = activeData?.sectionId
        ? toCanonicalSectionId(activeData.sectionId)
        : currentActiveDragItem?.sectionId
          ? toCanonicalSectionId(currentActiveDragItem.sectionId)
          : null;

      if (!activeSectionId) {
        const found = (cvDataRef.current?.sections || []).find((s) =>
          (s.items || []).some((i) => i.id === activeItemId),
        );
        if (found) activeSectionId = found.id;
      }

      let targetSectionId = null;
      let overItemId = null;

      if (overData?.type === 'item') {
        targetSectionId = toCanonicalSectionId(overData.sectionId);
        overItemId = over.id;
      } else if (overData?.type === 'section') {
        targetSectionId = toCanonicalSectionId(over.id);
        overItemId = null;
      } else if (overData?.type === 'column') {
        const colSections = (cvDataRef.current?.sections || []).filter(
          (s) => s.column === overData.column,
        );
        if (colSections.length > 0) {
          targetSectionId = colSections[colSections.length - 1].id;
        }
      } else {
        const cleanOver = toCanonicalSectionId(over.id);
        const foundSec = (cvDataRef.current?.sections || []).find(
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

      if (activeSectionId && targetSectionId) {
        if (typeof moveItemBetweenSections === 'function') {
          moveItemBetweenSections(
            activeItemId,
            overItemId,
            activeSectionId,
            targetSectionId,
            position,
          );
        } else if (typeof setCvData === 'function') {
          const newSections = calculateReorderedItems(
            cvDataRef.current?.sections || [],
            activeItemId,
            activeSectionId,
            over,
            position,
          );
          if (newSections) {
            const nextData = { ...cvDataRef.current, sections: newSections };
            cvDataRef.current = nextData;
            setCvData(nextData);
            if (preSnapshot && typeof recordHistoryTransition === 'function') {
              recordHistoryTransition(preSnapshot, nextData);
            }
          }
        }
      }
      return;
    }

    // 2. Moving a Section
    if (isSection) {
      const activeSectionId = activeCanonical;
      const activeSection = (cvDataRef.current?.sections || []).find(
        (s) => s.id === activeSectionId,
      );
      if (!activeSection || isFixedSection(activeSection)) return;

      let targetColumn = activeSection.column;
      let overSectionId = null;

      if (overData?.type === 'column') {
        targetColumn = overData.column;
        overSectionId = null;
      } else if (overData?.type === 'section') {
        const cleanOver = toCanonicalSectionId(over.id);
        const overSection = (cvDataRef.current?.sections || []).find((s) => s.id === cleanOver);
        if (overSection) {
          targetColumn = overSection.column;
          overSectionId = overSection.id;
        }
      } else if (overData?.type === 'item') {
        const cleanOverSec = toCanonicalSectionId(overData.sectionId);
        const overSection = (cvDataRef.current?.sections || []).find(
          (s) => s.id === cleanOverSec,
        );
        if (overSection) {
          targetColumn = overSection.column;
          overSectionId = overSection.id;
        }
      } else {
        const cleanOver = toCanonicalSectionId(over.id);
        if (cleanOver === 'column-left' || cleanOver.startsWith('column-left')) {
          targetColumn = 'left';
        } else if (cleanOver === 'column-right' || cleanOver.startsWith('column-right')) {
          targetColumn = 'right';
        } else {
          const foundSec = (cvDataRef.current?.sections || []).find(
            (s) =>
              s.id === cleanOver ||
              (s.items || []).some((i) => i.id === over.id),
          );
          if (foundSec) {
            targetColumn = foundSec.column;
            overSectionId = foundSec.id;
          }
        }
      }

      if (typeof moveSectionToColumnAndIndex === 'function') {
        moveSectionToColumnAndIndex(
          activeSectionId,
          targetColumn,
          overSectionId,
          position,
        );
      } else if (typeof setCvData === 'function') {
        const newSections = calculateReorderedSections(
          cvDataRef.current?.sections || [],
          activeSectionId,
          over,
          position,
        );
        if (newSections) {
          const nextData = { ...cvDataRef.current, sections: newSections };
          cvDataRef.current = nextData;
          setCvData(nextData);
          if (preSnapshot && typeof recordHistoryTransition === 'function') {
            recordHistoryTransition(preSnapshot, nextData);
          }
        }
      }
    }
  };

  /**
   * Resets active drag and drop target states on cancellation, restoring initial snapshot if modified.
   */
  const handleDragCancel = () => {
    if (dragStartSnapshotRef.current && typeof setCvData === 'function') {
      setCvData(dragStartSnapshotRef.current);
    }
    setActiveDragItem(null);
    setActiveDragSection(null);
    setDropTarget(null);
    dragStartSnapshotRef.current = null;
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
    dropTarget,
  };
}

export default useCVDndCoordinator;
