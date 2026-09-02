import React from 'react';

const DragHandle = ({ isInner = false, listeners, attributes }) => {
  return (
    <div 
      className={`drag-handle ${isInner ? "item-drag-handle" : "section-drag-handle"} no-print`}
      {...listeners}
      {...attributes}
      title={isInner ? "Arrastrar elemento para reordenar" : "Arrastrar sección para reordenar"}
    >
      <i className='bx bx-grid-vertical'></i>
    </div>
  );
};

export default DragHandle;
