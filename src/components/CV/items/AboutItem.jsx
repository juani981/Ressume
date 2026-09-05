import React from 'react';
import InlineEdit from '../../Editor/InlineEdit';

const AboutItem = ({ item, sectionId, onUpdateItem, isPrint = false }) => {
  return (
    <InlineEdit 
      value={item.description || ''} 
      isPrint={isPrint}
      onSave={(val) => onUpdateItem?.(sectionId, item.id, 'description', val)} 
      multiline 
    />
  );
};

export default AboutItem;
