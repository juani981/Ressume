import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragHandle from '../Editor/DragHandle';
import { useCV } from '../../context/CVContext';
import { getSectionDescriptor } from '../../registry/sectionRegistry';

const BaseItem = ({ item, sectionId, sectionType }) => {
  const { updateSectionItem, deleteSectionItem } = useCV();
  const descriptor = getSectionDescriptor(sectionType);
  const ItemComponent = descriptor.itemComponent;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: {
      type: 'item',
      item,
      sectionId,
      sectionType
    }
  });

  const baseStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    opacity: isDragging ? 0.35 : 1
  };

  const renderDeleteButton = () => {
    if (sectionType === 'profile_header' || descriptor.allowDelete === false) return null;

    return (
      <button
        type="button"
        className="round-btn-del item-del-btn no-print"
        title="Eliminar este elemento"
        onClick={(e) => {
          e.stopPropagation();
          deleteSectionItem(sectionId, item.id);
        }}
      >
        <i className='bx bx-minus' style={{ fontSize: '14px', fontWeight: 'bold' }}></i>
      </button>
    );
  };

  const onUpdateItem = (secId, itemId, key, val) => {
    updateSectionItem(secId, itemId, key, val);
  };

  if (sectionType === 'skills') {
    return (
      <li
        ref={setNodeRef}
        style={{ alignItems: 'flex-start', ...baseStyle }}
        className="skills__name editable-item-container cv-block"
      >
        <DragHandle isInner={true} listeners={listeners} attributes={attributes} />
        {renderDeleteButton()}
        {ItemComponent && (
          <ItemComponent item={item} sectionId={sectionId} onUpdateItem={onUpdateItem} />
        )}
      </li>
    );
  }

  if (sectionType === 'simple_list') {
    return (
      <li
        ref={setNodeRef}
        style={{ display: 'flex', alignItems: 'flex-start', listStyle: 'none', ...baseStyle }}
        className="editable-item-container cv-block simple-list-item"
      >
        <DragHandle isInner={true} listeners={listeners} attributes={attributes} />
        {renderDeleteButton()}
        {ItemComponent && (
          <ItemComponent item={item} sectionId={sectionId} onUpdateItem={onUpdateItem} />
        )}
      </li>
    );
  }

  if (sectionType === 'profile_header') {
    return (
      <div
        ref={setNodeRef}
        className="home__data bd-grid editable-item-container cv-block"
        style={baseStyle}
      >
        {ItemComponent && (
          <ItemComponent item={item} sectionId={sectionId} onUpdateItem={onUpdateItem} />
        )}
      </div>
    );
  }

  if (sectionType === 'about') {
    return (
      <div
        ref={setNodeRef}
        className="profile__description editable-item-container cv-block"
        style={baseStyle}
      >
        <DragHandle isInner={true} listeners={listeners} attributes={attributes} />
        {renderDeleteButton()}
        {ItemComponent && (
          <ItemComponent item={item} sectionId={sectionId} onUpdateItem={onUpdateItem} />
        )}
      </div>
    );
  }

  if (sectionType === 'education') {
    return (
      <div
        ref={setNodeRef}
        className="education__content editable-item-container cv-block"
        style={baseStyle}
      >
        <DragHandle isInner={true} listeners={listeners} attributes={attributes} />
        {renderDeleteButton()}
        {ItemComponent && (
          <ItemComponent item={item} sectionId={sectionId} onUpdateItem={onUpdateItem} />
        )}
      </div>
    );
  }

  // Default to list / experience or custom registered item
  return (
    <div
      ref={setNodeRef}
      className="experience__content editable-item-container cv-block"
      style={baseStyle}
    >
      <DragHandle isInner={true} listeners={listeners} attributes={attributes} />
      {renderDeleteButton()}
      {ItemComponent && (
        <ItemComponent item={item} sectionId={sectionId} onUpdateItem={onUpdateItem} />
      )}
    </div>
  );
};

export default BaseItem;
