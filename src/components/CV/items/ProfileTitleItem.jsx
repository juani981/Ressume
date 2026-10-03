/**
 * @file ProfileTitleItem.jsx
 * @description Item component for the TITLE-Subtitle section (candidate name and professional headline).
 *
 * Implements Open/Closed pattern:
 * - Dedicated component for candidate name (H1) and subtitle/role (H2)
 * - Completely detached from contact info, allowing independent layout positioning
 * - Supports inline editing in live editor and clean semantic rendering in print mode
 */

import React from 'react';
import InlineEdit from '../../Editor/InlineEdit';

/**
 * Print View: Pure semantic typography for candidate name and subtitle.
 */
const ProfileTitlePrintView = ({ item }) => {
  return (
    <div className="home__data home__data-title-subtitle" style={{ display: 'flex', flexDirection: 'column', gap: '1px', margin: 0, padding: 0 }}>
      <h1 className="home__title" style={{ margin: 0, padding: 0, lineHeight: 1.15 }}>
        <InlineEdit 
          value={item?.name || ''} 
          isPrint={true}
        />
      </h1>
      <h2 className="home__subtitle" style={{ margin: 0, padding: 0, lineHeight: 1.2 }}>
        <InlineEdit 
          value={item?.subtitle || ''} 
          isPrint={true}
        />
      </h2>
    </div>
  );
};

/**
 * Edit View: Inline-editable title and subtitle fields.
 */
const ProfileTitleEditView = ({ item, sectionId, onUpdateItem }) => {
  return (
    <div className="home__data home__data-title-subtitle" style={{ display: 'flex', flexDirection: 'column', gap: '1px', margin: 0, padding: 0 }}>
      <h1 className="home__title" style={{ margin: 0, padding: 0, lineHeight: 1.15 }}>
        <InlineEdit 
          value={item?.name || ''} 
          onSave={(val) => onUpdateItem(sectionId, item.id, 'name', val)} 
        />
      </h1>
      <h2 className="home__subtitle" style={{ margin: 0, padding: 0, lineHeight: 1.2 }}>
        <InlineEdit 
          value={item?.subtitle || ''} 
          onSave={(val) => onUpdateItem(sectionId, item.id, 'subtitle', val)} 
        />
      </h2>
    </div>
  );
};

/**
 * Modular ProfileTitleItem component adhering to BaseItem template contract.
 */
const ProfileTitleItem = (props) => {
  if (props.isPrint) {
    return <ProfileTitlePrintView {...props} />;
  }
  return <ProfileTitleEditView {...props} />;
};

export { ProfileTitlePrintView, ProfileTitleEditView };
export default ProfileTitleItem;
