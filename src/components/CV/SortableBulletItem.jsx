/**
 * @file SortableBulletItem.jsx
 * Unified draggable bullet point row for multi-bullet CV sections (Experience, Projects, Volunteering).
 * Encapsulates @dnd-kit sortable integration, drag handle, inline editable bullet text, and delete control.
 *
 * Contract:
 * - Renders a semantic <li> element with dnd-kit sortable refs and attributes.
 * - Supports nested drag-and-drop within item containers without interfering with parent item/section DnD.
 * - Delegates text editing to SimpleListItem and provides an accessible delete button.
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragHandle from '../Editor/DragHandle';
import { Minus } from 'lucide-react';
import SimpleListItem from './items/SimpleListItem';
import { createContainerDragListeners } from '../../utils/dndUtils';

/**
 * Draggable bullet item component with inline editing and deletion support.
 *
 * @param {Object} props - Component props.
 * @param {string|number} props.bulletId - Unique identifier for the sortable bullet item.
 * @param {string} props.bulletText - Text content of the bullet point.
 * @param {number} props.bulletIndex - 0-based index of the bullet within its item.
 * @param {string} props.sectionId - Unique identifier of the containing section.
 * @param {string} props.itemId - Unique identifier of the containing item.
 * @param {Array<string>} props.bullets - Array of all bullet strings belonging to the item.
 * @param {Function} props.onUpdateItem - Callback to update item fields: (sectionId, itemId, field, value) => void.
 * @param {Function} props.onDeleteBullet - Callback to remove a bullet: (bulletIndex) => void.
 * @param {string} [props.marginBottom='var(--item-gap, 8px)'] - CSS margin-bottom override for bullet row spacing.
 * @returns {JSX.Element} Draggable <li> bullet row.
 */
export const SortableBulletItem = ({ 
  bulletId, 
  bulletText, 
  bulletIndex, 
  sectionId, 
  itemId, 
  bullets, 
  onUpdateItem, 
  onDeleteBullet,
  marginBottom = 'var(--item-gap, 8px)'
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: bulletId,
    data: {
      type: 'bullet',
      bulletIndex
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    opacity: isDragging ? 0.35 : 1,
    display: 'flex',
    alignItems: 'flex-start',
    marginTop: 0,
    marginBottom,
    paddingRight: 0,
    paddingLeft: '1.15rem',
    color: 'inherit',
    lineHeight: 'var(--line-height, 1.45)',
    fontSize: 'var(--list-font-size, var(--normal-font-size))'
  };

  const containerDragListeners = createContainerDragListeners(listeners, true);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="bullet-item-row editable-item-container cv-block"
      data-item-id={(itemId && bulletIndex !== undefined) ? `${itemId}_bullet_${bulletIndex}` : (bulletId || `${itemId}_bullet_${bulletIndex}`)}
      {...attributes}
      {...containerDragListeners}
    >
      <DragHandle isInner={true} listeners={listeners} attributes={attributes} />
      <SimpleListItem 
        item={{ id: bulletIndex, text: bulletText }} 
        sectionId={sectionId} 
        onUpdateItem={(secId, bIdx, field, val) => {
          const newBullets = [...bullets];
          newBullets[bIdx] = val;
          onUpdateItem(sectionId, itemId, 'bullets', newBullets);
        }}
      />
      <button
        type="button"
        className="round-btn-del bullet-del-btn no-print"
        data-editor-ui="true"
        title="Eliminar esta viñeta"
        onClick={(e) => {
          e.stopPropagation();
          onDeleteBullet(bulletIndex);
        }}
      >
        <Minus size={12} strokeWidth={2.5} />
      </button>
    </li>
  );
};

export default SortableBulletItem;
