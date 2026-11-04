/**
 * CVDragOverlay.jsx
 *
 * Smooth 60fps ghost overlay for active drag items and sections.
 * Renders the actual component fully rendered ("fantasmita" flotante)
 * with translucent glassmorphic styling, soft elevation shadow, and declared friendly labels.
 */

import React from 'react';
import { DragOverlay } from '@dnd-kit/core';
import { getSectionDescriptor } from '../../registry/sectionRegistry';
import { PrintBaseSection } from '../CV/BaseSection';
import { PrintBaseItem } from '../CV/BaseItem';

/**
 * Content renderer for the active drag preview overlay.
 * Renders the actual section or item component fully rendered as a floating ghost.
 */
export const CVDragOverlayContent = ({ activeDragItem, activeDragSection }) => {
  // 1. Rendering Dragged Section Ghost
  if (activeDragSection) {
    const section = activeDragSection?.section;
    const sectionType = section?.type || section?.id;
    const sectionDescriptor = sectionType
      ? (getSectionDescriptor(section?.type) || getSectionDescriptor(sectionType))
      : null;
    const declaredSectionName =
      sectionDescriptor?.label ||
      (sectionType === 'spacer' ? 'Espacio en blanco' : 'Sección');

    const sectionWidth = activeDragSection?.initialWidth
      ? `${activeDragSection.initialWidth}px`
      : '100%';

    return (
      <div
        data-testid="drag-overlay-section"
        className="drag-overlay-ghost drag-overlay-ghost--section"
        style={{
          background: 'var(--container-color, #ffffff)',
          padding: 0,
          borderRadius: '4px',
          boxShadow: '0 16px 38px -4px rgba(0, 0, 0, 0.22), 0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(56, 116, 255, 0.25)',
          opacity: 0.98,
          width: sectionWidth,
          position: 'relative',
          boxSizing: 'border-box',
          pointerEvents: 'none',
          cursor: 'grabbing',
        }}
      >
        <span
          data-testid="drag-overlay-section-title"
          style={{ display: 'none' }}
        >
          {section?.title || declaredSectionName}
        </span>
        {section?.title && (
          <span
            data-testid="drag-overlay-section-custom-title"
            style={{ display: 'none' }}
          >
            {section.title}
          </span>
        )}

        {/* Fully rendered section component at 100% full real size */}
        {section && (
          <div
            className="drag-overlay-rendered-section"
            style={{ pointerEvents: 'none', width: '100%', boxSizing: 'border-box' }}
          >
            <PrintBaseSection section={section} />
          </div>
        )}
      </div>
    );
  }

  // 2. Rendering Dragged Item Ghost
  if (activeDragItem) {
    const itemSectionType = activeDragItem?.sectionType;
    const itemDescriptor = itemSectionType
      ? getSectionDescriptor(itemSectionType)
      : null;
    const declaredItemParentName = itemDescriptor?.label || 'Elemento';

    const itemWidth = activeDragItem?.initialWidth
      ? `${activeDragItem.initialWidth}px`
      : '100%';

    const itemTitle =
      activeDragItem.item?.title ||
      activeDragItem.item?.name ||
      activeDragItem.item?.text ||
      activeDragItem.item?.institution ||
      activeDragItem.item?.language ||
      (activeDragItem.item?.contacts?.length
        ? `${activeDragItem.item.contacts.length} contactos`
        : null) ||
      declaredItemParentName;

    return (
      <div
        data-testid="drag-overlay-item"
        className="drag-overlay-ghost drag-overlay-ghost--item"
        style={{
          background: 'var(--container-color, #ffffff)',
          padding: 0,
          borderRadius: '4px',
          boxShadow: '0 14px 32px -4px rgba(0, 0, 0, 0.22), 0 2px 6px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(56, 116, 255, 0.25)',
          opacity: 0.98,
          width: itemWidth,
          boxSizing: 'border-box',
          pointerEvents: 'none',
          cursor: 'grabbing',
          position: 'relative',
        }}
      >
        <span
          data-testid="drag-overlay-item-badge"
          style={{ display: 'none' }}
        >
          {declaredItemParentName}
        </span>
        <span
          data-testid="drag-overlay-item-title"
          style={{ display: 'none' }}
        >
          {itemTitle}
        </span>

        {/* Fully rendered item component at 100% full real size */}
        {activeDragItem.item && (
          <div
            className="drag-overlay-rendered-item"
            style={{ minWidth: 0, width: '100%', boxSizing: 'border-box', pointerEvents: 'none' }}
          >
            <PrintBaseItem
              item={activeDragItem.item}
              sectionId={activeDragItem.sectionId}
              sectionType={itemSectionType}
              isLast={true}
            />
          </div>
        )}
      </div>
    );
  }

  return null;
};

/**
 * Visual drag preview overlay for sections and items.
 *
 * @param {Object} props
 * @param {Object|null} props.activeDragItem - Active dragged item data
 * @param {Object|null} props.activeDragSection - Active dragged section data
 * @returns {React.ReactElement|null}
 */
export const CVDragOverlay = ({ activeDragItem, activeDragSection }) => {
  if (!activeDragItem && !activeDragSection) {
    return null;
  }

  return (
    <DragOverlay
      dropAnimation={{
        duration: 180,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}
      style={{
        cursor: 'grabbing',
        zIndex: 9999,
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
