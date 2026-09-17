import React from 'react';
import InlineEdit from '../../Editor/InlineEdit';
import HyperlinkEdit from '../../Editor/HyperlinkEdit';
import SortableBulletItem from '../SortableBulletItem';
import { ListPlus } from 'lucide-react';
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
  sortableKeyboardCoordinates 
} from '@dnd-kit/sortable';
import AddBulletPoint from '../../Editor/AddBulletPoint';


const ProjectsItemPrintView = ({ item, sectionId, isLast = false }) => {
  const bullets = item.bullets || [];

  return (
    <>
      <div className="experience__time">
        <span className="experience__rounder"></span>
        {!isLast && <span className="experience__line"></span>}
      </div>

      <div className="experience__data bd-grid" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4px' }}>
          <h3 className="experience__title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <InlineEdit 
              value={item.title || ''} 
              isPrint={true}
            />
          </h3>
          {item.date && (
            <span className="experience__company" style={{ fontSize: 'var(--smaller-font-size)', color: 'var(--text-color-light)' }}>
              <InlineEdit 
                value={item.date || ''} 
                isPrint={true}
              />
            </span>
          )}
        </div>

        {item.subtitle && (
          <span className="experience__company" style={{ fontWeight: 500, color: 'var(--title-color)' }}>
            <InlineEdit 
              value={item.subtitle || ''} 
              isPrint={true}
            />
          </span>
        )}

        {item.link && (
          <div className="social__container bd-grid" style={{ marginTop: '0.2rem', marginBottom: '0.2rem' }}>
            <HyperlinkEdit 
              url={item.link || ''} 
              text={item.linkText || item.link} 
              isPrint={true}
            />
          </div>
        )}

        {item.description && (
          <p className="experience__description">
            <InlineEdit 
              value={item.description} 
              multiline 
              isPrint={true}
            />
          </p>
        )}

        {bullets.length > 0 && (
          <div className="experience__bullets-container">
            <ul className="experience__bullets" style={{ paddingLeft: 0, marginTop: '0.25rem', marginBottom: 0, listStyle: 'none', listStyleType: 'none' }}>
              {bullets.map((b, idx) => {
                const bulletText = typeof b === 'string' ? b : (b?.text || '');
                return (
                  <li
                    key={idx}
                    className="cv-block"
                    style={{
                      display: 'block',
                      listStyle: 'none',
                      listStyleType: 'none',
                      marginBottom: 'calc(var(--item-gap, 6px) / 2)',
                      lineHeight: 1.45,
                      color: 'inherit',
                      padding: 0
                    }}
                  >
                    <InlineEdit 
                      value={bulletText} 
                      isPrint={true}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </>
  );
};

const ProjectsItemEditView = ({ item, sectionId, onUpdateItem }) => {
  const bullets = item.bullets || [];

  const bulletItems = bullets.map((b, idx) => ({
    id: `${item.id}_proj_bullet_${idx}`,
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
    const newBullets = [...bullets, 'Logro o funcionalidad clave implementada'];
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4px' }}>
          <h3 className="experience__title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <InlineEdit 
              value={item.title || ''} 
              onSave={(val) => onUpdateItem(sectionId, item.id, 'title', val)} 
              placeholder="Nombre del Proyecto..."
            />
          </h3>
          {item.date && (
            <span className="experience__company" style={{ fontSize: 'var(--smaller-font-size)', color: 'var(--text-color-light)' }}>
              <InlineEdit 
                value={item.date || ''} 
                onSave={(val) => onUpdateItem(sectionId, item.id, 'date', val)} 
                placeholder="2025"
              />
            </span>
          )}
        </div>

        {item.subtitle && (
          <span className="experience__company" style={{ fontWeight: 500, color: 'var(--title-color)' }}>
            <InlineEdit 
              value={item.subtitle || ''} 
              onSave={(val) => onUpdateItem(sectionId, item.id, 'subtitle', val)} 
              placeholder="Rol o Tecnologías (ej: React, Node.js, PostgreSQL)..."
            />
          </span>
        )}

        {/* Hyperlink */}
        <div className="social__container bd-grid" style={{ marginTop: '0.2rem', marginBottom: '0.2rem' }}>
          <HyperlinkEdit 
            url={item.link || ''} 
            text={item.linkText || item.link || 'github.com/usuario/proyecto'} 
            onSave={({ url, text }) => onUpdateItem(sectionId, item.id, { link: url, linkText: text })} 
            onRemove={() => onUpdateItem(sectionId, item.id, { link: '', linkText: '' })} 
          />
        </div>

        {item.description && (
          <p className="experience__description">
            <InlineEdit 
              value={item.description} 
              onSave={(val) => onUpdateItem(sectionId, item.id, 'description', val)} 
              placeholder="Descripción del impacto, arquitectura o problema resuelto..."
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
                <ul style={{ padding: 0, marginTop: '0.25rem', marginBottom: 0, listStyle: 'none' }}>
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
                      marginBottom="calc(var(--item-gap, 6px) / 2)"
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}

          {/* Add Bullet Button */}
          <AddBulletPoint helperText = {"Agregar logro / funcionalidad al proyecto"} handleAddBullet={handleAddBullet} />
        </div>
      </div>
    </>
  );
};

const ProjectsItem = (props) => {
  if (props.isPrint) {
    return <ProjectsItemPrintView {...props} />;
  }
  return <ProjectsItemEditView {...props} />;
};

export { ProjectsItemPrintView, ProjectsItemEditView };
export default ProjectsItem;
