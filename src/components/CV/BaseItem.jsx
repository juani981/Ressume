import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragHandle from '../Editor/DragHandle';
import { useCV } from '../../context/CVContext';
import { getSectionDescriptor } from '../../registry/sectionRegistry';

export const PrintBaseItem = ({ item, sectionId, sectionType, isLast = false }) => {
  const descriptor = getSectionDescriptor(sectionType);
  const ItemComponent = descriptor.itemComponent;

  if (sectionType === 'profile_header') {
    return (
      <div 
        className="home__data bd-grid cv-block" 
        data-item-id={item.id || 'profile_header'} 
        data-section-id={sectionId}
        style={{ position: 'relative', color: 'var(--text-color)' }}
      >
        {ItemComponent && (
          <ItemComponent item={item} sectionId={sectionId} isPrint={true} isLast={isLast} />
        )}
      </div>
    );
  }

  if (sectionType === 'simple_list') {
    return (
      <li
        className="cv-block simple-list-item"
        data-item-id={item.id}
        data-section-id={sectionId}
        style={{
          display: 'list-item',
          listStyleType: 'disc',
          marginBottom: 'calc(var(--item-gap, 6px) / 2)',
          lineHeight: 1.45,
          color: 'var(--text-color)',
          padding: 0
        }}
      >
        {ItemComponent && (
          <ItemComponent item={item} sectionId={sectionId} isPrint={true} isLast={isLast} />
        )}
      </li>
    );
  }

  const isListItem = descriptor.containerTag === 'ul' || sectionType === 'skills';
  if (isListItem) {
    return (
      <li
        style={{ display: 'flex', alignItems: 'flex-start', listStyle: 'none', position: 'relative', color: 'var(--text-color)' }}
        className={`cv-block ${sectionType === 'skills' ? 'skills__name' : 'simple-list-item'}`}
        data-item-id={item.id}
        data-section-id={sectionId}
      >
        {ItemComponent && (
          <ItemComponent item={item} sectionId={sectionId} isPrint={true} isLast={isLast} />
        )}
      </li>
    );
  }

  if (sectionType === 'about') {
    return (
      <div 
        className="profile__description cv-block" 
        data-item-id={item.id || 'about'}
        data-section-id={sectionId}
        style={{ position: 'relative', color: 'var(--text-color)' }}
      >
        {ItemComponent && (
          <ItemComponent item={item} sectionId={sectionId} isPrint={true} isLast={isLast} />
        )}
      </div>
    );
  }

  if (sectionType === 'education') {
    return (
      <div 
        className="education__content cv-block" 
        data-item-id={item.id}
        data-section-id={sectionId}
        style={{ display: 'flex', position: 'relative', color: 'var(--text-color)' }}
      >
        {ItemComponent && (
          <ItemComponent item={item} sectionId={sectionId} isPrint={true} isLast={isLast} />
        )}
      </div>
    );
  }

  return (
    <div 
      className="experience__content cv-block" 
      data-item-id={item.id}
      data-section-id={sectionId}
      style={{ display: 'flex', position: 'relative', color: 'var(--text-color)' }}
    >
      {ItemComponent && (
        <ItemComponent item={item} sectionId={sectionId} isPrint={true} isLast={isLast} />
      )}
    </div>
  );
};

const EditableBaseItem = ({ item, sectionId, sectionType }) => {
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
    opacity: isDragging ? 0.35 : 1,
    color: 'var(--text-color)'
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

  if (sectionType === 'profile_header') {
    return (
      <div
        ref={setNodeRef}
        className="home__data bd-grid editable-item-container cv-block"
        data-item-id={item.id || 'profile_header'}
        data-section-id={sectionId}
        style={baseStyle}
      >
        {ItemComponent && (
          <ItemComponent item={item} sectionId={sectionId} onUpdateItem={onUpdateItem} />
        )}
      </div>
    );
  }

  const isListItem = descriptor.containerTag === 'ul' || sectionType === 'skills' || sectionType === 'simple_list';

  if (isListItem) {
    return (
      <li
        ref={setNodeRef}
        style={{ display: 'flex', alignItems: 'flex-start', listStyle: 'none', ...baseStyle }}
        className={`editable-item-container cv-block ${sectionType === 'skills' ? 'skills__name' : 'simple-list-item'}`}
        data-item-id={item.id}
        data-section-id={sectionId}
      >
        <DragHandle isInner={true} listeners={listeners} attributes={attributes} />
        {renderDeleteButton()}
        {ItemComponent && (
          <ItemComponent item={item} sectionId={sectionId} onUpdateItem={onUpdateItem} />
        )}
      </li>
    );
  }

  if (sectionType === 'about') {
    return (
      <div
        ref={setNodeRef}
        className="profile__description editable-item-container cv-block"
        data-item-id={item.id || 'about'}
        data-section-id={sectionId}
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
        data-item-id={item.id}
        data-section-id={sectionId}
        style={{ ...baseStyle, display: 'flex' }}
      >
        <DragHandle isInner={true} listeners={listeners} attributes={attributes} />
        {renderDeleteButton()}
        {ItemComponent && (
          <ItemComponent item={item} sectionId={sectionId} onUpdateItem={onUpdateItem} />
        )}
      </div>
    );
  }

  // Default container for list, projects, certificates, languages, awards, publications, volunteering, references, custom
  return (
    <div
      ref={setNodeRef}
      className="experience__content editable-item-container cv-block"
      data-item-id={item.id}
      data-section-id={sectionId}
      style={{ ...baseStyle, display: 'flex' }}
    >
      <DragHandle isInner={true} listeners={listeners} attributes={attributes} />
      {renderDeleteButton()}
      {ItemComponent && (
        <ItemComponent item={item} sectionId={sectionId} onUpdateItem={onUpdateItem} />
      )}
    </div>
  );
};

const BaseItem = (props) => {
  if (props.isPrint) {
    return <PrintBaseItem {...props} />;
  }
  return <EditableBaseItem {...props} />;
};

export default BaseItem;
