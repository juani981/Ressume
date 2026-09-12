import React from 'react';
import { GripVertical } from 'lucide-react';

const DragHandle = ({ isInner = false, listeners, attributes }) => {
  return (
     <div
        className={`drag-handle ${isInner ? "item-drag-handle" : "section-drag-handle"} no-print`}
        {...listeners}
        {...attributes}
        title={
           isInner
              ? "Arrastrar elemento para reordenar"
              : "Arrastrar sección para reordenar"
        }
        >
        <GripVertical size={16} />
     </div>
  );
};

export default DragHandle;
