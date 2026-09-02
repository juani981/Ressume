import React from 'react';
import InlineEdit from '../../Editor/InlineEdit';

const AboutItem = ({ item, sectionId, onUpdateItem }) => {
  return (
    <InlineEdit 
      value={item.description || ''} 
      onSave={(val) => onUpdateItem(sectionId, item.id, 'description', val)} 
      multiline 
    />
  );
};

export default AboutItem;
