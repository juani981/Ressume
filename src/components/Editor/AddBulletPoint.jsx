
import React from 'react';
import { ListPlus } from 'lucide-react';

const AddBulletPoint = ({ helperText, handleAddBullet, onClick }) => {
  const handleClick = handleAddBullet || onClick;

  return (
    <div
      className="bullet-add-row no-print"
      data-editor-ui="true"
      data-editor-add="true"
      style={{
        paddingLeft: 0,
        height: 0,
        lineHeight: 0,
        overflow: 'visible',
        position: 'relative'
      }}
    >
      <button
        type="button"
        className="add-bullet-btn no-print"
        data-editor-ui="true"
        data-editor-add="true"
        onClick={handleClick}
        title={typeof helperText === 'string' ? helperText : 'Agregar nueva viñeta'}
      >
        <ListPlus size={14} />
        <span>Agregar nueva viñeta</span>
      </button>
    </div>
  );
};

export default AddBulletPoint;