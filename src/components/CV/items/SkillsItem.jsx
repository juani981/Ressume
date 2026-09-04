import React from 'react';
import InlineEdit from '../../Editor/InlineEdit';

const SkillsItem = ({ item, sectionId, onUpdateItem }) => {
  return (
    <>
      <span 
        className="skills__circle" 
        style={{ 
          display: 'inline-block', 
          width: '5px', 
          height: '5px', 
          borderRadius: '50%', 
          margin: '7px 0.45rem 0 0', 
          flexShrink: 0, 
          backgroundColor: 'var(--circle-color, var(--text-color))' 
        }}
      />
      <span style={{ flex: 1 }}>
        <b>
          <InlineEdit 
            value={item.title || ''} 
            onSave={(val) => onUpdateItem(sectionId, item.id, 'title', val)} 
          /> 
        </b>{' '}
        <InlineEdit 
          value={item.description || ''} 
          onSave={(val) => onUpdateItem(sectionId, item.id, 'description', val)} 
        />
      </span>
    </>
  );
};

export default SkillsItem;
