import React from 'react';
import InlineEdit from '../../Editor/InlineEdit';

const EducationItem = ({ item, sectionId, onUpdateItem }) => {
  return (
    <>
      <div className="education__time">
        <span className="education__rounder"></span>
        <span className="education__line"></span>
      </div>
      <div className="education__data bd-grid" style={{ width: '100%' }}>
        <h3 className="education__title">
          <InlineEdit 
            value={item.title || ''} 
            onSave={(val) => onUpdateItem(sectionId, item.id, 'title', val)} 
          />
        </h3>
        <span className="education__studies">
          <InlineEdit 
            value={item.subtitle || ''} 
            onSave={(val) => onUpdateItem(sectionId, item.id, 'subtitle', val)} 
          />
        </span>
        <span className="education__year">
          <InlineEdit 
            value={item.date || ''} 
            onSave={(val) => onUpdateItem(sectionId, item.id, 'date', val)} 
          />
        </span>
      </div>
    </>
  );
};

export default EducationItem;
