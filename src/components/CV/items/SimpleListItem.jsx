import React from 'react';
import InlineEdit from '../../Editor/InlineEdit';

const SimpleListItem = ({ item, sectionId, onUpdateItem }) => {
  return (
    <>
      <span 
        className="simple-list-circle"
        style={{ 
          display: 'inline-block', 
          width: '5px', 
          height: '5px', 
          backgroundColor: 'var(--circle-color, var(--text-color))', 
          borderRadius: '50%', 
          margin: '7px 0.45rem 0 0', 
          flexShrink: 0 
        }} 
      />
      <span style={{ flex: 1, color: 'inherit' }}>
        <InlineEdit 
          value={item.text || ''} 
          onSave={(val) => onUpdateItem(sectionId, item.id, 'text', val)} 
        />
      </span>
    </>
  );
};

export default SimpleListItem;
