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
import { usePrintMode } from '../../context/PrintModeContext';

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
    minWidth: 0,
    maxWidth: '100%',
    width: '100%',
    boxSizing: 'border-box',
    ...(descriptor.itemStyle || {})
  };

  const hasPageBreak = Boolean(item?.pageBreak === 'before' || item?.breakBefore || item?.isForcedBreak);
  const isPartial = Boolean(item?.isPartialItem);
  const isContinuation = Boolean(item?.isContinuationItem);

  return (
    <ItemTag 
      className={`${descriptor.itemClass || 'experience__content'} cv-block${hasPageBreak ? ' break-page-before' : ''}${isPartial ? ' item-is-partial' : ''}${isContinuation ? ' item-is-continuation' : ''}`}
      data-item-id={isPartial ? `${item?.id}__partial` : (item?.id || sectionType)}
      data-section-id={sectionId}
      data-is-partial={isPartial ? 'true' : undefined}
      data-is-continuation={isContinuation ? 'true' : undefined}
      style={{ minWidth: 0, maxWidth: '100%', boxSizing: 'border-box', ...style }}
    >
      {ItemComponent && (
        <ItemComponent item={item} sectionId={sectionId} isPrint={true} isLast={isLast && !isPartial} />
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
  const { updateSectionItem, deleteSectionItem, deleteSection } = useCV();
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
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    opacity: isDragging ? 0.35 : 1,
    outline: isDragging ? '2px dashed var(--first-color, #3874ff)' : 'none',
    outlineOffset: '2px',
    borderRadius: isDragging ? '4px' : undefined,
    color: 'var(--text-color)',
    minWidth: 0,
    maxWidth: '100%',
    width: '100%',
    boxSizing: 'border-box',
    ...(descriptor.itemStyle || {})
  };

  const hasItemDrag = descriptor.hasItemDrag !== false;
  const allowDelete = descriptor.allowDeleteItem !== false && descriptor.allowDelete !== false;
  const containerDragListeners = hasItemDrag ? createContainerDragListeners(listeners, true) : {};

  // Para secciones de ítem único (p.ej. foto), eliminar el ítem elimina la sección entera.
  const isSingleItemSection = descriptor.allowAddItem === false;
  const handleDelete = (e) => {
    e.stopPropagation();
    if (isSingleItemSection && typeof deleteSection === 'function') {
      deleteSection(sectionId);
    } else {
      deleteSectionItem(sectionId, item?.id);
    }
  };

  const isPartial = Boolean(item?.isPartialItem);
  const isContinuation = Boolean(item?.isContinuationItem);

  return (
    <ItemTag
      ref={setNodeRef}
      className={`${descriptor.itemClass || 'experience__content'} editable-item-container cv-block${isPartial ? ' item-is-partial' : ''}${isContinuation ? ' item-is-continuation' : ''}`}
      data-item-id={isPartial ? `${item?.id}__partial` : (item?.id || sectionType)}
      data-section-id={sectionId}
      data-is-partial={isPartial ? 'true' : undefined}
      data-is-continuation={isContinuation ? 'true' : undefined}
      style={baseStyle}
      {...attributes}
      {...containerDragListeners}
    >
      {hasItemDrag && !item?.isContinuationItem && <DragHandle isInner={true} listeners={listeners} attributes={attributes} />}
      {allowDelete && !item?.isContinuationItem && (
        <button
          type="button"
          className="round-btn-del item-del-btn no-print"
          data-editor-ui="true"
          data-testid={`btn-delete-item-${item?.id || sectionType}`}
          title="Eliminar este elemento"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleDelete}
        >
          <Minus size={14} strokeWidth={2.5} />
        </button>
      )}
      {ItemComponent && (
        <ItemComponent 
          item={item} 
          sectionId={sectionId} 
          onUpdateItem={(secId, itemId, key, val) => updateSectionItem(secId, item?.originalItemId || itemId, key, val)} 
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
  const contextIsPrint = usePrintMode();
  const effectiveIsPrint = props.isPrint ?? contextIsPrint;
  if (effectiveIsPrint) {
    return <PrintBaseItem {...props} isPrint={true} />;
  }
  return <EditableBaseItem {...props} />;
};

export default BaseItem;

