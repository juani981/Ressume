import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useDndDropTarget } from '../../context/DndDropTargetContext';
import DropIndicatorPlaceholder from './DropIndicatorPlaceholder';

export function DroppableColumn({ id, column, className, style, children }) {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: 'column',
      column,
    },
  });

  const dropTarget = useDndDropTarget();
  const showEmptyColumnPlaceholder = Boolean(
    dropTarget?.type === 'section' &&
    dropTarget.targetColumn === column &&
    !dropTarget.targetSectionId
  );

  return (
    <div ref={setNodeRef} id={id} className={className} style={style}>
      {children}
      {showEmptyColumnPlaceholder && <DropIndicatorPlaceholder type="section" />}
    </div>
  );
}

export default DroppableColumn;
