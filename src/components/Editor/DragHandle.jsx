import React from 'react';
import { GripVertical } from 'lucide-react';

const DragHandle = ({ isInner = false, listeners, attributes, style = {} }) => {
  /**
   * stopPropagation prevents the pointerdown from bubbling up to a parent
   * section's useSortable sensor, which would activate two simultaneous drag
   * operations (nested sensor collision — Bug 3.2).
   */
  const handlePointerDown = (e) => {
    e.stopPropagation();
    if (listeners?.onPointerDown) {
      listeners.onPointerDown(e);
    }
  };

  return (
     <div
        className={`drag-handle ${isInner ? "item-drag-handle" : "section-drag-handle"} no-print`}
        data-editor-ui="true"
        {...listeners}
        {...attributes}
        onPointerDown={handlePointerDown}
        title={
           isInner
              ? "Arrastrar elemento para reordenar"
              : "Arrastrar sección para reordenar"
        }
        style={{
           zIndex: 50,
           ...(isInner ? { width: '12px', overflow: 'hidden', display: 'inline-flex', justifyContent: 'center' } : {}),
           ...style,
        }}
        >
        <GripVertical size={isInner ? 14 : 16} />
     </div>
  );
};

export default DragHandle;
