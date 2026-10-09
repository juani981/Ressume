import React from 'react';
import { useDroppable } from '@dnd-kit/core';


export function DroppableColumn({ id, column, className, style, children }) {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: 'column',
      column,
    },
  });

  return (
    <div ref={setNodeRef} id={id} className={className} style={style}>
      {children}
    </div>
  );
}

export default DroppableColumn;
