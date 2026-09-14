/**
 * BaseItem.jsx
 *
 * Generic template component for CV section items, driven 100% by SectionDescriptor
 * from sectionRegistry. Implements Factory/Strategy & Template pattern with
 * ZERO sectionType conditional guards.
 *
 * Handles drag handles, sortable item hooks (@dnd-kit), inline editing delegation,
 * item deletion controls, and tag/class/style resolution via the registry descriptor.
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragHandle from '../Editor/DragHandle';
import { Minus } from 'lucide-react';
import { useCV } from '../../context/CVContext';
import { getSectionDescriptor } from '../../registry/sectionRegistry';
import { createContainerDragListeners } from '../../utils/dndUtils';

/**
 * PrintBaseItem
 * Static print / PDF renderer for an individual CV section item.
 *
 * @param {Object} props
 * @param {Object} props.item - The item data object
 * @param {string} props.sectionId - ID of parent section
 * @param {string} props.sectionType - Type string of parent section
 * @param {boolean} [props.isLast=false] - Whether this is the last item in the section
 * @returns {React.ReactElement}
 */
export const PrintBaseItem = ({ item, sectionId, sectionType, isLast = false }) => {
  const descriptor = getSectionDescriptor(sectionType);
  const ItemComponent = descriptor.itemComponent;
  const ItemTag = descriptor.itemTag || 'div';

  const style = descriptor.printItemStyle || {
    display: descriptor.itemStyle?.display || 'flex',
    position: 'relative',
    color: 'var(--text-color)',
    ...(descriptor.itemStyle || {})
  };

  const hasPageBreak = Boolean(item?.pageBreak === 'before' || item?.breakBefore || item?.isForcedBreak);

  return (
    <ItemTag 
      className={`${descriptor.itemClass || 'experience__content'} cv-block${hasPageBreak ? ' break-page-before' : ''}`}
      data-item-id={item?.id || sectionType}
      data-section-id={sectionId}
      style={style}
    >
      {ItemComponent && (
        <ItemComponent item={item} sectionId={sectionId} isPrint={true} isLast={isLast} />
      )}
    </ItemTag>
  );
};

/**
 * EditableBaseItem
 * Interactive CV section item with drag handle, sortable integration,
 * item deletion button, and inline editing.
 *
 * @param {Object} props
 * @param {Object} props.item - The item data object
 * @param {string} props.sectionId - ID of parent section
 * @param {string} props.sectionType - Type string of parent section
 * @returns {React.ReactElement}
 */
const EditableBaseItem = ({ item, sectionId, sectionType }) => {
  const { updateSectionItem, deleteSectionItem } = useCV();
  const descriptor = getSectionDescriptor(sectionType);
  const ItemComponent = descriptor.itemComponent;
  const ItemTag = descriptor.itemTag || 'div';

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item?.id,
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
    color: 'var(--text-color)',
    ...(descriptor.itemStyle || {})
  };

  const hasItemDrag = descriptor.hasItemDrag !== false;
  const allowDelete = descriptor.allowDeleteItem !== false && descriptor.allowDelete !== false;
  const containerDragListeners = hasItemDrag ? createContainerDragListeners(listeners, true) : {};

  return (
    <ItemTag
      ref={setNodeRef}
      className={`${descriptor.itemClass || 'experience__content'} editable-item-container cv-block`}
      data-item-id={item?.id || sectionType}
      data-section-id={sectionId}
      style={baseStyle}
      {...attributes}
      {...containerDragListeners}
    >
      {hasItemDrag && <DragHandle isInner={true} listeners={listeners} attributes={attributes} />}
      {allowDelete && (
        <button
          type="button"
          className="round-btn-del item-del-btn no-print"
          data-editor-ui="true"
          title="Eliminar este elemento"
          onClick={(e) => {
            e.stopPropagation();
            deleteSectionItem(sectionId, item?.id);
          }}
        >
          <Minus size={14} strokeWidth={2.5} />
        </button>
      )}
      {ItemComponent && (
        <ItemComponent 
          item={item} 
          sectionId={sectionId} 
          onUpdateItem={(secId, itemId, key, val) => updateSectionItem(secId, itemId, key, val)} 
        />
      )}
    </ItemTag>
  );
};

/**
 * BaseItem
 * Main entry point delegating to PrintBaseItem or EditableBaseItem.
 *
 * @param {Object} props
 * @param {Object} props.item - The item data object
 * @param {string} props.sectionId - ID of parent section
 * @param {string} props.sectionType - Type string of parent section
 * @param {boolean} [props.isPrint=false] - Whether rendering in print mode
 * @param {boolean} [props.isLast=false] - Whether this is the last item
 * @returns {React.ReactElement}
 */
const BaseItem = (props) => {
  if (props.isPrint) {
    return <PrintBaseItem {...props} />;
  }
  return <EditableBaseItem {...props} />;
};

export default BaseItem;

