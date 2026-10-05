/**
 * useCVDndCoordinator.js
 *
 * Custom React hook encapsulating @dnd-kit sensor configuration, collision detection,
 * and real-time live sort drag-and-drop coordination for sections and items.
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

/**
 * Extracts canonical section ID ignoring any __cont_ split-continuation suffix.
 */
const toCanonicalSectionId = (id) => (typeof id === 'string' ? id.split('__cont_')[0] : id);

/**
 * Determines directional position ('above' vs 'below') from cursor/translated rect centers.
 */
const getDirectionalPosition = (active, over, delta) => {
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
 * Calculates new sections array during live drag over.
 * Returns null if no change is needed.
 */
function calculateReorderedSections(currentSections, activeId, over, position) {
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
 * Calculates new sections array with reordered items during live drag over.
 * Returns null if no change is needed.
 */
function calculateReorderedItems(currentSections, activeItemId, activeSectionId, over, position) {
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
 * Coordinates DnD sensors and event handlers for sections and items with real-time live sorting.
 *
 * @param {Object} options
 * @param {Object} options.cvData - Current CV data model
 * @param {Function} [options.setCvData] - Context state setter for real-time live sort
 * @param {Function} [options.recordHistoryTransition] - Commits atomic history step on drag end
 * @param {Function} options.moveItemBetweenSections - Context handler for moving items
 * @param {Function} options.moveSectionToColumnAndIndex - Context handler for moving sections
 * @returns {{
 *   sensors: ReturnType<typeof useSensors>,
 *   collisionDetection: typeof closestCorners,
 *   handleDragStart: (event: any) => void,
 *   handleDragOver: (event: any) => void,
 *   handleDragEnd: (event: any) => void,
 *   handleDragCancel: () => void,
 *   activeDragItem: any,
 *   activeDragSection: any
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

  const cvDataRef = useRef(cvData);
  cvDataRef.current = cvData;

  const dragStartSnapshotRef = useRef(null);
  const hasMovedDuringDragRef = useRef(false);

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

    dragStartSnapshotRef.current = cvDataRef.current
      ? JSON.parse(JSON.stringify(cvDataRef.current))
      : null;
    hasMovedDuringDragRef.current = false;

    if (data?.type === 'item') {
      setActiveDragItem(data);
      setActiveDragSection(null);
    } else if (data?.type === 'section') {
      setActiveDragSection(data);
      setActiveDragItem(null);
    }
  };

  const handleDragOver = (event) => {
    if (typeof setCvData !== 'function') return;
    const { active, over } = event;
    if (!over || !active || active.id === over.id) return;

    const currentData = cvDataRef.current;
    if (!currentData?.sections) return;

    const position = getDirectionalPosition(active, over, event?.delta);
    const activeData = active?.data?.current;

    if (activeData?.type === 'section') {
      const newSections = calculateReorderedSections(
        currentData.sections,
        active.id,
        over,
        position,
      );
      if (newSections) {
        hasMovedDuringDragRef.current = true;
        cvDataRef.current = { ...cvDataRef.current, sections: newSections };
        setCvData((prev) => ({ ...prev, sections: newSections }));
      }
    } else if (activeData?.type === 'item') {
      const activeSectionId = toCanonicalSectionId(activeData.sectionId);
      const newSections = calculateReorderedItems(
        currentData.sections,
        active.id,
        activeSectionId,
        over,
        position,
      );
      if (newSections) {
        hasMovedDuringDragRef.current = true;
        cvDataRef.current = { ...cvDataRef.current, sections: newSections };
        setCvData((prev) => ({ ...prev, sections: newSections }));
      }
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    const hadMoved = hasMovedDuringDragRef.current;
    const preSnapshot = dragStartSnapshotRef.current;

    setActiveDragItem(null);
    setActiveDragSection(null);
    dragStartSnapshotRef.current = null;
    hasMovedDuringDragRef.current = false;

    // 1. If live sorting already executed during drag over, commit the transition to history
    if (hadMoved && preSnapshot) {
      if (typeof recordHistoryTransition === 'function') {
        recordHistoryTransition(preSnapshot, cvDataRef.current);
      }
      return;
    }

    // 2. Fallback for environments without live setCvData (e.g. unit tests or instantaneous drop)
    if (!over) return;
    if (active.id === over.id) return;

    const activeData = active?.data?.current;
    const overData = over?.data?.current;
    const position = getDirectionalPosition(active, over, event?.delta);

    // Fallback: Moving an Item (within same section, cross-section, or cross-column)
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
        const colSections = (cvData?.sections || []).filter(
          (s) => s.column === overData.column,
        );
        if (colSections.length > 0) {
          targetSectionId = colSections[colSections.length - 1].id;
        }
      } else {
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

    // Fallback: Moving a Section (cross-column or intra-column reordering)
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
   * Clears active drag state on cancel and restores pre-drag snapshot if altered.
   */
  const handleDragCancel = () => {
    if (
      hasMovedDuringDragRef.current &&
      dragStartSnapshotRef.current &&
      typeof setCvData === 'function'
    ) {
      cvDataRef.current = dragStartSnapshotRef.current;
      setCvData(dragStartSnapshotRef.current);
    }
    setActiveDragItem(null);
    setActiveDragSection(null);
    dragStartSnapshotRef.current = null;
    hasMovedDuringDragRef.current = false;
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
