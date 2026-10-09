import React from 'react';
import InlineEdit from '../../Editor/InlineEdit';
import HyperlinkEdit from '../../Editor/HyperlinkEdit';
import SortableBulletItem from '../SortableBulletItem';
import AddBulletPoint from '../../Editor/AddBulletPoint';
import { Plus } from 'lucide-react';
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
import { normalizeDateRange, sanitizeBulletText } from '../../../utils/textSanitizer';


const ExperienceItemPrintView = ({ item, sectionId, isLast = false }) => {
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
            <h3 className="experience__title">
              <InlineEdit 
                value={item.title || ''} 
                isPrint={true}
              />
            </h3>
            <span className="experience__company">
              <InlineEdit 
                value={normalizeDateRange(item.date) || ''} 
                isPrint={true}
              />
              {(item.subtitle || item.date) && ' | '}
              <InlineEdit 
                value={item.subtitle || ''} 
                isPrint={true}
              />
            </span>
            {item.link && (
              <span className="social__container bd-grid" style={{ marginTop: '0.25rem', marginBottom: '0.25rem' }}>
                <HyperlinkEdit 
                  url={item.link} 
                  text={item.linkText || item.link} 
                  isPrint={true}
                />
              </span>
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
                      marginBottom: 'var(--item-gap, 8px)',
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

const ExperienceItemEditView = ({ item, sectionId, onUpdateItem }) => {
  const bullets = item.bullets || [];
  const targetItemId = item.originalItemId || item.id;
  const canonicalBullets = item.originalBullets || bullets;
  const startOffset = item.bulletStartIndex || 0;

  const bulletItems = bullets.map((b, idx) => ({
    id: `${item.id}_bullet_${idx}`,
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
    const newBullets = [...canonicalBullets, 'Nuevo logro o responsabilidad'];
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
            <h3 className="experience__title">
              <InlineEdit 
                value={item.title || ''} 
                onSave={(val) => onUpdateItem(sectionId, targetItemId, 'title', val)} 
              />
            </h3>
            <span className="experience__company">
              <InlineEdit 
                value={item.date || ''} 
                onSave={(val) => onUpdateItem(sectionId, targetItemId, 'date', val)} 
              />
              {(item.subtitle || item.date) && ' | '}
              <InlineEdit 
                value={item.subtitle || ''} 
                onSave={(val) => onUpdateItem(sectionId, targetItemId, 'subtitle', val)} 
              />
            </span>
            {item.link && (
              <span className="social__container bd-grid" style={{ marginTop: '0.25rem', marginBottom: '0.25rem' }}>
                <HyperlinkEdit 
                  url={item.link} 
                  text={item.linkText || item.link} 
                  onSave={({ url, text }) => onUpdateItem(sectionId, targetItemId, { link: url, linkText: text })} 
                  onRemove={() => onUpdateItem(sectionId, targetItemId, { link: '', linkText: '' })} 
                />
              </span>
            )}
            {item.description && (
              <p className="experience__description">
                <InlineEdit 
                  value={item.description} 
                  onSave={(val) => onUpdateItem(sectionId, targetItemId, 'description', val)} 
                  multiline 
                />
              </p>
            )}
          </div>
        )}

        {/* Draggable Bullets List with Add/Delete capabilities */}
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
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}

          {/* Add Bullet Button */}
          {!item.isContinuationItem && (
            <AddBulletPoint helperText={"Agregar hito/logro en éste puesto"} handleAddBullet={handleAddBullet}  />
          )}
        </div>
      </div>
    </>
  );
};

const ExperienceItem = (props) => {
  if (props.isPrint) {
    return <ExperienceItemPrintView {...props} />;
  }
  return <ExperienceItemEditView {...props} />;
};

export { ExperienceItemPrintView, ExperienceItemEditView };
export default ExperienceItem;
