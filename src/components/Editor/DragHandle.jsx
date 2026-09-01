import React from 'react';

const DragHandle = ({ isInner = false, listeners, attributes }) => {
  return (
    <div 
      className={isInner ? "item-drag-handle" : "section-drag-handle"}
      {...listeners}
      {...attributes}
      style={{ 
        position: 'absolute', 
        left: isInner ? '-1.5rem' : '-3.5rem', 
        top: isInner ? '0.5rem' : '50%', 
        transform: isInner ? 'none' : 'translateY(-50%)', 
        cursor: 'grab', 
        color: isInner ? 'var(--text-color-light)' : 'var(--title-color)',
        fontSize: isInner ? '1.2rem' : '1.8rem',
        fontWeight: isInner ? 'normal' : 'bold',
        zIndex: 10
      }}
      title="Arrastrar para reordenar"
    >
      <i className='bx bx-grid-vertical'></i>
    </div>
  );
};

export default DragHandle;
