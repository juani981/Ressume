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
      ? `${Math.min(Math.max(activeDragSection.initialWidth, 280), 560)}px`
      : '360px';

    return (
      <div
        data-testid="drag-overlay-section"
        className="drag-overlay-ghost drag-overlay-ghost--section"
        style={{
          background: 'var(--container-color, #ffffff)',
          padding: '16px 20px',
          borderRadius: '10px',
          boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.28), 0 0 20px rgba(56, 116, 255, 0.18)',
          border: '1.5px solid var(--first-color, #3874ff)',
          opacity: 0.9,
          minWidth: '280px',
          maxWidth: '560px',
          width: sectionWidth,
          maxHeight: '460px',
          overflow: 'hidden',
          position: 'relative',
          boxSizing: 'border-box',
          pointerEvents: 'none',
          cursor: 'grabbing',
          transform: 'scale(1.015) rotate(-0.5deg)',
          backdropFilter: 'blur(3px)',
        }}
      >
        {/* Sleek declared section indicator pill */}
        <div
          data-testid="drag-overlay-section-title"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            color: 'var(--first-color, #3874ff)',
            background: 'rgba(56, 116, 255, 0.08)',
            padding: '3px 10px',
            borderRadius: '12px',
            marginBottom: '10px',
            border: '1px solid rgba(56, 116, 255, 0.2)',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--first-color, #3874ff)',
            }}
          />
          <span>{declaredSectionName}</span>
          {section?.title &&
            section.title.trim() !== '' &&
            section.title.trim() !== declaredSectionName && (
              <span
                data-testid="drag-overlay-section-custom-title"
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  color: 'var(--text-color-light, #666)',
                  textTransform: 'none',
                }}
              >
                — {section.title.trim()}
              </span>
            )}
        </div>

        {/* Fully rendered section component */}
        {section && (
          <div
            className="drag-overlay-rendered-section"
            style={{ pointerEvents: 'none', width: '100%' }}
          >
            <PrintBaseSection section={section} />
          </div>
        )}

        {/* Bottom subtle fade overlay for tall sections */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '24px',
            background:
              'linear-gradient(to bottom, transparent, var(--container-color, #ffffff))',
            pointerEvents: 'none',
          }}
        />
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
      ? `${Math.min(Math.max(activeDragItem.initialWidth, 240), 480)}px`
      : '320px';

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
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 18px 38px -8px rgba(0, 0, 0, 0.28), 0 0 16px rgba(56, 116, 255, 0.16)',
          border: '1.5px solid var(--first-color, #3874ff)',
          opacity: 0.9,
          minWidth: '240px',
          maxWidth: '480px',
          width: itemWidth,
          boxSizing: 'border-box',
          pointerEvents: 'none',
          cursor: 'grabbing',
          transform: 'scale(1.02) rotate(-0.5deg)',
          backdropFilter: 'blur(3px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
            borderBottom: '1px dashed rgba(56, 116, 255, 0.2)',
            paddingBottom: '4px',
            gap: '8px',
          }}
        >
          <div
            data-testid="drag-overlay-item-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: 'var(--first-color, #3874ff)',
              background: 'rgba(56, 116, 255, 0.08)',
              padding: '2px 8px',
              borderRadius: '10px',
              border: '1px solid rgba(56, 116, 255, 0.2)',
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: 'var(--first-color, #3874ff)',
              }}
            />
            <span>{declaredItemParentName}</span>
          </div>

          <div
            data-testid="drag-overlay-item-title"
            style={{
              fontSize: '0.74rem',
              fontWeight: 600,
              color: 'var(--text-color-light, #666)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '65%',
            }}
          >
            {itemTitle}
          </div>
        </div>

        {/* Fully rendered item component */}
        {activeDragItem.item && (
          <div
            className="drag-overlay-rendered-item"
            style={{ minWidth: 0, width: '100%', pointerEvents: 'none' }}
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
