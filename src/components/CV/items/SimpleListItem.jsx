import React from 'react';
import InlineEdit from '../../Editor/InlineEdit';

const SimpleListItem = ({ item, sectionId, onUpdateItem, isPrint = false }) => {
  const containerRef = React.useRef(null);

  const handleCircleClick = (e) => {
    e.stopPropagation();
    const editable = containerRef.current?.querySelector('[contenteditable="true"], .inline-edit-display');
    if (editable) {
      editable.focus();
      editable.click();
    }
  };

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
        onClick={handleCircleClick}
        style={{ 
          display: 'inline-block', 
          width: '5px', 
          height: '5px', 
          backgroundColor: 'var(--circle-color, var(--text-color))', 
          borderRadius: '50%', 
          margin: '7px 0.45rem 0 0', 
          flexShrink: 0,
          position: 'relative',
          zIndex: 55,
          cursor: 'pointer'
        }} 
      />
      <span ref={containerRef} className="simple-list-text" style={{ flex: 1, minWidth: 0, maxWidth: '100%', color: 'inherit' }}>
        <InlineEdit 
          value={item?.text || ''} 
          onSave={(val) => onUpdateItem?.(sectionId, item.id, 'text', val)} 
        />
      </span>
    </>
  );
};

export default SimpleListItem;
