import React from 'react';
import SpacerBlock from '../SpacerBlock';

/**
 * SpacerItem
 * Item-level adapter for the SpacerBlock component.
 */
const SpacerItem = ({ item, sectionId, isPrint, onUpdateItem }) => {
  const sectionAdapter = {
    id: item?.id || sectionId,
    height: item?.height || 40,
    backgroundColor: item?.backgroundColor || 'transparent',
    items: [item]
  };

  return <SpacerBlock section={sectionAdapter} isPrint={isPrint} />;
};

export default SpacerItem;
