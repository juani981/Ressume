import React from 'react';
import InlineEdit from '../../Editor/InlineEdit';
import HyperlinkEdit from '../../Editor/HyperlinkEdit';
import SortableBulletItem from '../SortableBulletItem';
import { ListPlus, Link2, Unlink, Plus } from 'lucide-react';
import { 
  DndContext, 
  closestCorners, 
  rectIntersection, 
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
import { normalizeDateRange, sanitizeBulletText } from '../../../utils/textSanitizer';


const ProjectsItemPrintView = ({ item, sectionId, isLast = false }) => {
  const bullets = item.bullets || [];
  const showLine = !isLast || Boolean(item?.isPartialItem) || Boolean(item?.isContinuationItem);

  return (
    <>
      <div className="experience__time">
        {!item.isContinuationItem && <span className="experience__rounder"></span>}
        {showLine && <span className="experience__line"></span>}
      </div>

      <div className="experience__data bd-grid" style={{ width: '100%' }}>
        {!item.isContinuationItem && (
          <div data-item-base-id={item.originalItemId || item.id} className="item-base-block">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4px' }}>
              <h3 className="experience__title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <InlineEdit 
                  value={item.title || ''} 
                  isPrint={true}
                />
              </h3>
              {item.date && (
                <span className="experience__company" style={{ fontSize: 'var(--body-smaller-font-size, var(--smaller-font-size))', color: 'var(--text-color-light)' }}>
                  <InlineEdit 
                    value={normalizeDateRange(item.date) || ''} 
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

            {Boolean(item.link && String(item.link).trim() !== '') && (
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
          </div>
        )}

        {bullets.length > 0 && (
          <div className="experience__bullets-container">
            <ul className="experience__bullets" style={{ paddingLeft: 0, marginTop: item.isContinuationItem ? 0 : '0.25rem', marginBottom: 0, listStyle: 'none', listStyleType: 'none' }}>
              {bullets.map((b, idx) => {
                const bulletText = sanitizeBulletText(typeof b === 'string' ? b : (b?.text || ''));
                return (
                  <li
                    key={idx}
                    className="cv-block"
                    data-item-id={`${item.id}_bullet_${idx}`}
                    style={{
                      display: 'block',
                      listStyle: 'none',
                      listStyleType: 'none',
                      marginBottom: 'calc(var(--item-gap, 8px) / 2)',
                      lineHeight: 'var(--line-height, 1.3)',
                      fontSize: 'var(--list-font-size, var(--normal-font-size))',
                      color: 'inherit',
                      padding: 0
                    }}
                  >
                    <InlineEdit 
                      value={bulletText} 
                      isPrint={true}
                      multiline={true}
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
  const targetItemId = item.originalItemId || item.id;
  const canonicalBullets = item.originalBullets || bullets;
  const startOffset = item.bulletStartIndex || 0;
  const hasLink = Boolean(item.link && typeof item.link === 'string' && item.link.trim() !== '');

  const bulletItems = bullets.map((b, idx) => ({
    id: `${item.id}_proj_bullet_${idx}`,
    text: typeof b === 'string' ? b : (b?.text || ''),
    index: startOffset + idx
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
    const newBullets = [...canonicalBullets, 'Logro o funcionalidad clave implementada'];
    onUpdateItem(sectionId, targetItemId, 'bullets', newBullets);
  };

  const handleDeleteBullet = (bulletIndex) => {
    const newBullets = canonicalBullets.filter((_, idx) => idx !== bulletIndex);
    onUpdateItem(sectionId, targetItemId, 'bullets', newBullets);
  };

  const handleBulletDragOver = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = bulletItems.findIndex((b) => b.id === active.id);
    const newIndex = bulletItems.findIndex((b) => b.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const realOld = startOffset + oldIndex;
      const realNew = startOffset + newIndex;
      const newBullets = arrayMove(canonicalBullets, realOld, realNew);
      onUpdateItem(sectionId, targetItemId, 'bullets', newBullets);
    }
  };

  const handleBulletDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = bulletItems.findIndex((b) => b.id === active.id);
    const newIndex = bulletItems.findIndex((b) => b.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const realOld = startOffset + oldIndex;
      const realNew = startOffset + newIndex;
      const newBullets = arrayMove(canonicalBullets, realOld, realNew);
      onUpdateItem(sectionId, targetItemId, 'bullets', newBullets);
    }
  };

  return (
    <>
      <div className="experience__time">
        {!item.isContinuationItem && <span className="experience__rounder"></span>}
        <span className="experience__line"></span>
      </div>

      <div className="experience__data bd-grid" style={{ width: '100%' }}>
        {!item.isContinuationItem && (
          <div data-item-base-id={targetItemId || item.id} className="item-base-block">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4px' }}>
              <h3 className="experience__title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <InlineEdit 
                  value={item.title || ''} 
                  onSave={(val) => onUpdateItem(sectionId, targetItemId, 'title', val)} 
                  placeholder="Nombre del Proyecto..."
                />
              </h3>
              {item.date && (
                <span className="experience__company" style={{ fontSize: 'var(--body-smaller-font-size, var(--smaller-font-size))', color: 'var(--text-color-light)' }}>
                  <InlineEdit 
                    value={item.date || ''} 
                    onSave={(val) => onUpdateItem(sectionId, targetItemId, 'date', val)} 
                    placeholder="2025"
                  />
                </span>
              )}
            </div>

            {item.subtitle && (
              <span className="experience__company" style={{ fontWeight: 500, color: 'var(--title-color)' }}>
                <InlineEdit 
                  value={item.subtitle || ''} 
                  onSave={(val) => onUpdateItem(sectionId, targetItemId, 'subtitle', val)} 
                  placeholder="Rol o Tecnologías (ej: React, Node.js, PostgreSQL)..."
                />
              </span>
            )}

            {/* Optional Hyperlink */}
            {hasLink ? (
              <div 
                className="social__container bd-grid" 
                style={{ 
                  marginTop: '0.2rem', 
                  marginBottom: '0.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <HyperlinkEdit 
                  url={item.link} 
                  text={item.linkText || item.link} 
                  onSave={({ url, text }) => onUpdateItem(sectionId, targetItemId, { link: url, linkText: text })} 
                  onRemove={() => onUpdateItem(sectionId, targetItemId, { link: '', linkText: '' })} 
                />
                <button
                  type="button"
                  className="no-print"
                  data-testid="btn-remove-project-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateItem(sectionId, targetItemId, { link: '', linkText: '' });
                  }}
                  title="Eliminar link del proyecto"
                  aria-label="Eliminar link del proyecto"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    color: '#94a3b8',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    lineHeight: 1,
                    transition: 'color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                  <Unlink size={13} />
                </button>
              </div>
            ) : (
              <div className="no-print" style={{ marginTop: '0.35rem', marginBottom: '0.35rem' }}>
                <button
                  type="button"
                  className="add-project-link-btn no-print"
                  data-testid="btn-add-project-link"
                  data-editor-ui="true"
                  data-editor-add="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateItem(sectionId, targetItemId, { 
                      link: 'https://github.com', 
                      linkText: 'Ver Proyecto' 
                    });
                  }}
                  title="Agregar enlace al proyecto"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 10px',
                    borderRadius: '999px',
                    border: '1.5px dashed var(--first-color, #3874ff)',
                    background: 'rgba(56, 116, 255, 0.08)',
                    color: 'var(--first-color, #3874ff)',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(56, 116, 255, 0.18)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(56, 116, 255, 0.08)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>Agregar enlace</span>
                </button>
              </div>
            )}

            {item.description && (
              <p className="experience__description">
                <InlineEdit 
                  value={item.description} 
                  onSave={(val) => onUpdateItem(sectionId, targetItemId, 'description', val)} 
                  placeholder="Descripción del impacto, arquitectura o problema resuelto..."
                  multiline 
                />
              </p>
            )}
          </div>
        )}

        {/* Draggable Bullets List */}
        <div className="experience__bullets-container">
          {bullets.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={rectIntersection}
              onDragOver={handleBulletDragOver}
              onDragEnd={handleBulletDragEnd}
            >
              <SortableContext
                items={bulletItems.map(b => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="experience__bullets" style={{ padding: 0, marginTop: item.isContinuationItem ? 0 : '0.25rem', marginBottom: 0, listStyle: 'none' }}>
                  {bulletItems.map((bulletObj) => (
                    <SortableBulletItem
                      key={bulletObj.id}
                      bulletId={bulletObj.id}
                      bulletText={bulletObj.text}
                      bulletIndex={bulletObj.index}
                      sectionId={sectionId}
                      itemId={targetItemId}
                      bullets={canonicalBullets}
                      onUpdateItem={onUpdateItem}
                      onDeleteBullet={handleDeleteBullet}
                      marginBottom="calc(var(--item-gap, 8px) / 2)"
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}

          {/* Add Bullet Button */}
          {!item.isContinuationItem && (
            <AddBulletPoint helperText={"Agregar logro / funcionalidad al proyecto"} handleAddBullet={handleAddBullet} />
          )}
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
