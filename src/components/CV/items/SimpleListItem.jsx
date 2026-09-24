import React from 'react';
import InlineEdit from '../../Editor/InlineEdit';

const SimpleListItem = ({ item, sectionId, onUpdateItem, isPrint = false }) => {
  if (isPrint) {
    return (
      <InlineEdit 
        value={item?.text || ''} 
        isPrint={true}
      />
    );
  }

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
      <span style={{ flex: 1, minWidth: 0, maxWidth: '100%', color: 'inherit' }}>
        <InlineEdit 
          value={item?.text || ''} 
          onSave={(val) => onUpdateItem?.(sectionId, item.id, 'text', val)} 
        />
      </span>
    </>
  );
};

export default SimpleListItem;
