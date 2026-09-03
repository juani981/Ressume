import React from 'react';
import InlineEdit from '../../Editor/InlineEdit';
import SimpleListItem from './SimpleListItem';
import DragHandle from '../../Editor/DragHandle';
import { 
  DndContext, 
  closestCorners, 
  PointerSensor, 
  KeyboardSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy, 
  arrayMove, 
  sortableKeyboardCoordinates, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableBulletItem = ({ 
  bulletId, 
  bulletText, 
  bulletIndex, 
  sectionId, 
  itemId, 
  bullets, 
  onUpdateItem, 
  onDeleteBullet 
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
    marginBottom: 'var(--item-gap, 6px)',
    paddingRight: '1.5rem',
    paddingLeft: '1.15rem'
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="bullet-item-row editable-item-container cv-block"
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
        title="Eliminar esta viñeta"
        onClick={(e) => {
          e.stopPropagation();
          onDeleteBullet(bulletIndex);
        }}
      >
        <i className='bx bx-minus' style={{ fontSize: '12px', fontWeight: 'bold' }}></i>
      </button>
    </li>
  );
};

const VolunteeringItem = ({ item, sectionId, onUpdateItem }) => {
  const bullets = item.bullets || [];

  const bulletItems = bullets.map((b, idx) => ({
    id: `${item.id}_vol_bullet_${idx}`,
    text: typeof b === 'string' ? b : (b?.text || ''),
    index: idx
  }));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleAddBullet = () => {
    const newBullets = [...bullets, 'Actividad o contribución voluntaria realizada'];
    onUpdateItem(sectionId, item.id, 'bullets', newBullets);
  };

  const handleDeleteBullet = (bulletIndex) => {
    const newBullets = bullets.filter((_, idx) => idx !== bulletIndex);
    onUpdateItem(sectionId, item.id, 'bullets', newBullets);
  };

  const handleBulletDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = bulletItems.findIndex(b => b.id === active.id);
    const newIndex = bulletItems.findIndex(b => b.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const newBullets = arrayMove(bullets, oldIndex, newIndex);
      onUpdateItem(sectionId, item.id, 'bullets', newBullets);
    }
  };

  return (
    <>
      <div className="experience__time">
        <span className="experience__rounder"></span>
        <span className="experience__line"></span>
      </div>

      <div className="experience__data bd-grid" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
          <h3 className="experience__title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <InlineEdit 
              value={item.title || ''} 
              onSave={(val) => onUpdateItem(sectionId, item.id, 'title', val)} 
              placeholder="Rol / Voluntariado..."
            />
          </h3>
          {item.date && (
            <span className="experience__company" style={{ fontSize: 'var(--smaller-font-size)', color: 'var(--text-color-light)' }}>
              <InlineEdit 
                value={item.date || ''} 
                onSave={(val) => onUpdateItem(sectionId, item.id, 'date', val)} 
                placeholder="2024 – Presente"
              />
            </span>
          )}
        </div>

        {item.subtitle && (
          <span className="experience__company" style={{ fontWeight: 500, color: 'var(--title-color)' }}>
            <InlineEdit 
              value={item.subtitle || ''} 
              onSave={(val) => onUpdateItem(sectionId, item.id, 'subtitle', val)} 
              placeholder="Organización / ONG / Comunidad..."
            />
          </span>
        )}

        {item.description && (
          <p className="experience__description">
            <InlineEdit 
              value={item.description} 
              onSave={(val) => onUpdateItem(sectionId, item.id, 'description', val)} 
              placeholder="Descripción del propósito o impacto social..."
              multiline 
            />
          </p>
        )}

        {/* Draggable Bullets List */}
        <div className="experience__bullets-container">
          {bullets.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragEnd={handleBulletDragEnd}
            >
              <SortableContext
                items={bulletItems.map(b => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                  {bulletItems.map((bulletObj) => (
                    <SortableBulletItem
                      key={bulletObj.id}
                      bulletId={bulletObj.id}
                      bulletText={bulletObj.text}
                      bulletIndex={bulletObj.index}
                      sectionId={sectionId}
                      itemId={item.id}
                      bullets={bullets}
                      onUpdateItem={onUpdateItem}
                      onDeleteBullet={handleDeleteBullet}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}

          {/* Add Bullet Button */}
          <div className="bullet-add-row no-print" style={{ paddingLeft: '1.15rem' }}>
            <button
              type="button"
              className="add-bullet-btn no-print"
              onClick={handleAddBullet}
              title="Agregar viñeta de impacto voluntario"
            >
              <i className='bx bx-plus' style={{ fontSize: '13px', fontWeight: 'bold' }}></i>
              <span>Agregar viñeta</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default VolunteeringItem;
