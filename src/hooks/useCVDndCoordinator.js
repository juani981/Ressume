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
  pointerWithin,
  rectIntersection,
  closestCenter,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
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
   * Tracks drop target position and live reorders document sections and items in real time.
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
    const isSection =
      activeData?.type === 'section' ||
      Boolean(activeDragSection) ||
      (currentData.sections || []).some((s) => s.id === activeCanonical);

    const isItem =
      !isSection &&
      (activeData?.type === 'item' ||
        Boolean(activeDragItem) ||
        (currentData.sections || []).some((s) =>
          (s.items || []).some((i) => i.id === active.id),
        ));

    if (isSection) {
      const activeSectionId = activeCanonical;
      const activeSec = currentData.sections.find((s) => s.id === activeSectionId);
      let targetColumn = activeSec ? activeSec.column : 'right';
      let targetSectionId = null;

      const cleanOver = toCanonicalSectionId(over.id);

      if (overData?.type === 'column') {
        targetColumn = overData.column;
        targetSectionId = null;
      } else if (cleanOver === 'column-left' || cleanOver?.startsWith('column-left')) {
        targetColumn = 'left';
        targetSectionId = null;
      } else if (cleanOver === 'column-right' || cleanOver?.startsWith('column-right')) {
        targetColumn = 'right';
        targetSectionId = null;
      } else if (cleanOver === 'column-single' || cleanOver?.startsWith('column-single')) {
        targetColumn = 'single';
        targetSectionId = null;
      } else if (overData?.type === 'section') {
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

      // Live reorder sections in real-time
      const nextSections = calculateReorderedSections(
        currentData.sections,
        active.id,
        over,
        position,
      );

      if (nextSections) {
        cvDataRef.current = { ...cvDataRef.current, sections: nextSections };
        if (typeof setCvData === 'function') {
          setCvData((prev) => ({ ...prev, sections: nextSections }));
        }
      }
    } else if (isItem) {
      const activeSectionId = activeData?.sectionId
        ? toCanonicalSectionId(activeData.sectionId)
        : activeDragItem?.sectionId
          ? toCanonicalSectionId(activeDragItem.sectionId)
          : (currentData.sections.find((s) => (s.items || []).some((i) => i.id === active.id))?.id);

      let targetSectionId = activeSectionId;
      let targetItemId = null;

      const cleanOver = toCanonicalSectionId(over.id);

      if (overData?.type === 'item') {
        targetSectionId = toCanonicalSectionId(overData.sectionId);
        targetItemId = over.id;
      } else if (overData?.type === 'section') {
        targetSectionId = cleanOver;
        targetItemId = null;
      } else if (overData?.type === 'column') {
        const colSections = currentData.sections.filter((s) => s.column === overData.column);
        if (colSections.length > 0) {
          targetSectionId = colSections[colSections.length - 1].id;
        }
      } else {
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

      // Live reorder items in real-time
      const nextSections = calculateReorderedItems(
        currentData.sections,
        active.id,
        activeSectionId,
        over,
        position,
      );

      if (nextSections) {
        cvDataRef.current = { ...cvDataRef.current, sections: nextSections };
        if (typeof setCvData === 'function') {
          setCvData((prev) => ({ ...prev, sections: nextSections }));
        }
      }
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

    if (!active) return;

    const activeCanonical = toCanonicalSectionId(active.id);
    const isSection =
      active?.data?.current?.type === 'section' ||
      Boolean(currentActiveDragSection) ||
      (cvDataRef.current?.sections || []).some((s) => s.id === activeCanonical);

    const isItem =
      !isSection &&
      (active?.data?.current?.type === 'item' ||
        Boolean(currentActiveDragItem) ||
        (cvDataRef.current?.sections || []).some((s) =>
          (s.items || []).some((i) => i.id === active.id),
        ));

    // Smooth drop entrance animation tracking
    const droppedId = isSection ? activeCanonical : active.id;
    if (dropTimerRef.current) {
      clearTimeout(dropTimerRef.current);
    }
    setJustDroppedId(droppedId);
    dropTimerRef.current = setTimeout(() => {
      setJustDroppedId(null);
    }, 380);

    if (!over || active.id === over.id) {
      // If dropped without changing position, check if live reorder modified sections
      if (preSnapshot && typeof recordHistoryTransition === 'function') {
        const hasChanged = JSON.stringify(preSnapshot.sections) !== JSON.stringify(cvDataRef.current?.sections);
        if (hasChanged) {
          recordHistoryTransition(preSnapshot, cvDataRef.current);
        }
      }
      return;
    }

    const position =
      getDirectionalPosition(active, over, event?.delta) ||
      currentDropTarget?.position ||
      'below';

    // 1. If setCvData is provided (Live Reorder & Atomic Commit mode)
    if (typeof setCvData === 'function') {
      let finalSections = null;
      if (isSection) {
        finalSections = calculateReorderedSections(
          cvDataRef.current?.sections || [],
          active.id,
          over,
          position,
        );
      } else if (isItem) {
        let activeSectionId = active?.data?.current?.sectionId
          ? toCanonicalSectionId(active.data.current.sectionId)
          : currentActiveDragItem?.sectionId
            ? toCanonicalSectionId(currentActiveDragItem.sectionId)
            : null;

        if (!activeSectionId) {
          const found = (cvDataRef.current?.sections || []).find((s) =>
            (s.items || []).some((i) => i.id === active.id),
          );
          if (found) activeSectionId = found.id;
        }

        finalSections = calculateReorderedItems(
          cvDataRef.current?.sections || [],
          active.id,
          activeSectionId,
          over,
          position,
        );
      }

      if (finalSections) {
        const nextData = { ...cvDataRef.current, sections: finalSections };
        cvDataRef.current = nextData;
        setCvData(nextData);
      }

      if (preSnapshot && typeof recordHistoryTransition === 'function') {
        const hasChanged = JSON.stringify(preSnapshot.sections) !== JSON.stringify(cvDataRef.current?.sections);
        if (hasChanged) {
          recordHistoryTransition(preSnapshot, cvDataRef.current);
        }
      }
      return;
    }

    // 2. Legacy / Fallback when setCvData is not passed
    if (isItem) {
      const activeItemId = active.id;
      let activeSectionId = active?.data?.current?.sectionId
        ? toCanonicalSectionId(active.data.current.sectionId)
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
      const overData = over?.data?.current;

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

    if (isSection) {
      const activeSectionId = activeCanonical;
      const activeSection = (cvDataRef.current?.sections || []).find(
        (s) => s.id === activeSectionId,
      );
      if (!activeSection || isFixedSection(activeSection)) return;

      let targetColumn = activeSection.column;
      let overSectionId = null;
      const overData = over?.data?.current;

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
        } else if (cleanOver === 'column-single' || cleanOver.startsWith('column-single')) {
          targetColumn = 'single';
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
    if (dropTimerRef.current) {
      clearTimeout(dropTimerRef.current);
    }
    setJustDroppedId(null);
    setActiveDragItem(null);
    setActiveDragSection(null);
    setDropTarget(null);
    dragStartSnapshotRef.current = null;
  };

  return {
    sensors,
    collisionDetection: pointerFirstCollisionDetection,
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
