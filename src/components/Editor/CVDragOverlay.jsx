/**
 * CVDragOverlay.jsx
 *
 * Smooth 60fps ghost overlay for active drag items and sections.
 * Renders full-fidelity container previews matching the section/item layout 1:1,
 * eliminating the double-movement artifact while keeping drop placeholders stationary.
 */

import React from 'react';
import { DragOverlay } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { getSectionDescriptor } from '../../registry/sectionRegistry';
import { SectionItemsRenderer } from '../CV/BaseSection';
import { PrintBaseItem } from '../CV/BaseItem';
import { PrintModeContext } from '../../context/PrintModeContext';

/**
 * High-fidelity preview for a dragged section container.
 */
export const SectionDragPreview = ({ activeDragSection }) => {
  const section = activeDragSection?.section;
  if (!section) return null;

  const sectionType = section?.type || section?.id;
  const sectionDescriptor = sectionType
    ? getSectionDescriptor(section?.type) || getSectionDescriptor(sectionType)
    : null;
  const declaredSectionName =
    sectionDescriptor?.label || (sectionType === 'spacer' ? 'Espacio en blanco' : 'Sección');

  const items = section?.items || [];
  const isSpacer = sectionType === 'spacer' || section?.type === 'spacer';

  return (
    <div
      data-testid="drag-overlay-section"
      className="cv-drag-overlay-section"
      style={{
        background: 'var(--container-color, #ffffff)',
        padding: '1rem 1.25rem',
        borderRadius: '10px',
        boxShadow: '0 20px 45px -8px rgba(0,0,0,0.28), 0 0 0 2px var(--first-color, #3874ff)',
        opacity: 0.96,
        width: '480px',
        maxWidth: 'calc(100vw - 32px)',
        minWidth: '280px',
        pointerEvents: 'none',
        boxSizing: 'border-box',
        cursor: 'grabbing',
        transform: 'scale(1.01)',
      }}
    >
      <div
        data-testid="drag-overlay-section-title"
        style={{
          fontWeight: 700,
          fontSize: '1.05rem',
          color: 'var(--title-color, #111)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <GripVertical size={16} style={{ color: 'var(--first-color, #3874ff)', flexShrink: 0 }} />
        <span>{declaredSectionName}</span>
        {section?.title && section.title.trim() !== '' && section.title.trim() !== declaredSectionName && (
          <span
            data-testid="drag-overlay-section-custom-title"
            style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-color-light, #666)' }}
          >
            — {section.title.trim()}
          </span>
        )}
      </div>

      <div
        data-testid="drag-overlay-section-subtitle"
        style={{
          fontSize: '0.8rem',
          color: 'var(--text-color-light, #666)',
          marginTop: '4px',
          marginBottom: isSpacer || items.length > 0 ? '8px' : '0',
        }}
      >
        {isSpacer
          ? `${section?.height || 40}px de separación vertical`
          : `${items.length} ${items.length === 1 ? 'elemento' : 'elementos'}`}
      </div>

      {isSpacer && (
        <div
          style={{
            marginTop: '8px',
            height: `${Math.min(section?.height || 40, 100)}px`,
            backgroundColor:
              section?.backgroundColor === '#000000' || section?.backgroundColor === 'black'
                ? '#000000'
                : 'rgba(56, 116, 255, 0.05)',
            border: '2px dashed var(--first-color, #3874ff)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem',
            color:
              section?.backgroundColor === '#000000' || section?.backgroundColor === 'black'
                ? '#ffffff'
                : 'var(--first-color, #3874ff)',
            fontWeight: 600,
          }}
        >
          {section?.height || 40}px
        </div>
      )}

      {!isSpacer && items.length > 0 && (
        <div
          style={{
            marginTop: '8px',
            maxHeight: '320px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <PrintModeContext.Provider value={true}>
            <div className={`${sectionDescriptor?.sectionClass || ''} section cv-section`}>
              <SectionItemsRenderer
                items={items}
                sectionId={section?.originalSectionId || section?.id}
                sectionType={section?.type}
                descriptor={sectionDescriptor}
                isPrint={true}
              />
            </div>
          </PrintModeContext.Provider>
          {items.length > 3 && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '32px',
                background: 'linear-gradient(to bottom, transparent, var(--container-color, #ffffff))',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

/**
 * High-fidelity preview for a dragged section item.
 */
export const ItemDragPreview = ({ activeDragItem }) => {
  if (!activeDragItem) return null;

  const itemSectionType = activeDragItem?.sectionType;
  const itemDescriptor = itemSectionType ? getSectionDescriptor(itemSectionType) : null;
  const declaredItemParentName = itemDescriptor?.label || 'Elemento';

  const item = activeDragItem.item;
  const itemTitle =
    item?.title ||
    item?.name ||
    item?.text ||
    item?.institution ||
    item?.degree ||
    item?.language ||
    (item?.contacts?.length ? `${item.contacts.length} contactos` : null) ||
    declaredItemParentName;

  return (
    <div
      data-testid="drag-overlay-item"
      className="cv-drag-overlay-item"
      style={{
        background: 'var(--container-color, #ffffff)',
        padding: '0.85rem 1.15rem',
        borderRadius: '8px',
        boxShadow: '0 16px 36px -6px rgba(0,0,0,0.24), 0 0 0 2px var(--first-color, #3874ff)',
        opacity: 0.96,
        width: '420px',
        maxWidth: 'calc(100vw - 32px)',
        minWidth: '280px',
        pointerEvents: 'none',
        boxSizing: 'border-box',
        cursor: 'grabbing',
        transform: 'scale(1.02)',
      }}
    >
      <div
        data-testid="drag-overlay-item-badge"
        style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: 'var(--first-color, #3874ff)',
          marginBottom: '3px',
        }}
      >
        {declaredItemParentName}
      </div>

      <div
        data-testid="drag-overlay-item-title"
        style={{
          fontWeight: 600,
          color: 'var(--title-color, #111)',
          marginBottom: itemDescriptor?.itemComponent ? '6px' : '0',
        }}
      >
        {itemTitle}
      </div>

      {item?.subtitle && (
        <div
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-color-light, #666)',
            marginBottom: '6px',
          }}
        >
          {item.subtitle}
        </div>
      )}

      {itemDescriptor?.itemComponent && (
        <div style={{ marginTop: '6px', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '6px' }}>
          <PrintModeContext.Provider value={true}>
            <PrintBaseItem
              item={item}
              sectionId={activeDragItem.sectionId}
              sectionType={itemSectionType}
              isLast={false}
            />
          </PrintModeContext.Provider>
        </div>
      )}
    </div>
  );
};

/**
 * Content renderer for the active drag preview overlay.
 */
export const CVDragOverlayContent = ({ activeDragItem, activeDragSection }) => {
  if (activeDragItem) {
    return <ItemDragPreview activeDragItem={activeDragItem} />;
  }

  if (activeDragSection) {
    return <SectionDragPreview activeDragSection={activeDragSection} />;
  }

  return null;
};

/**
 * Visual drag preview overlay for sections and items.
 *
 * @param {Object} props
 * @param {Object|null} props.activeDragItem - Active dragged item data
 * @param {Object|null} props.activeDragSection - Active dragged section data
 * @returns {React.ReactElement}
 */
export const CVDragOverlay = ({ activeDragItem, activeDragSection }) => {
  return (
    <DragOverlay
      dropAnimation={{
        duration: 180,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}
    >
      <CVDragOverlayContent
        activeDragItem={activeDragItem}
        activeDragSection={activeDragSection}
      />
    </DragOverlay>
  );
};

export default CVDragOverlay;
