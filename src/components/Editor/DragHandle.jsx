import React from 'react';
import { GripVertical } from 'lucide-react';

const DragHandle = ({ isInner = false, listeners, attributes, style = {} }) => {
  return (
     <div
        className={`drag-handle ${isInner ? "item-drag-handle" : "section-drag-handle"} no-print`}
        data-editor-ui="true"
        {...listeners}
        {...attributes}
        title={
           isInner
              ? "Arrastrar elemento para reordenar"
              : "Arrastrar sección para reordenar"
        }
        style={{
           zIndex: 50,
           ...style,
        }}
        >
        <GripVertical size={16} />
     </div>
  );
};

export default DragHandle;
