/**
 * CVDragOverlay.jsx
 *
 * Smooth 60fps ghost overlay for active drag items and sections.
 * Prevents DOM clipping and provides visual affordance during drag operations.
 */

import React from 'react';
import { DragOverlay } from '@dnd-kit/core';

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
      }}>
      {activeDragItem ? (
        <div
          style={{
            background: 'var(--container-color, #ffffff)',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            boxShadow: '0 12px 28px rgba(0,0,0,0.22)',
            border: '2px solid var(--first-color, #3874ff)',
            opacity: 0.95,
            maxWidth: '400px',
          }}>
          <div
            style={{
              fontWeight: 600,
              color: 'var(--title-color, #111)',
            }}>
            {activeDragItem.item?.title ||
              activeDragItem.item?.text ||
              activeDragItem.item?.name ||
              'Elemento'}
          </div>
          {activeDragItem.item?.subtitle && (
            <div
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-color-light, #666)',
              }}>
              {activeDragItem.item.subtitle}
            </div>
          )}
        </div>
      ) : activeDragSection ? (
        <div
          style={{
            background: 'var(--container-color, #ffffff)',
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            boxShadow: '0 16px 36px rgba(0,0,0,0.25)',
            border: '2px solid var(--first-color, #3874ff)',
            opacity: 0.95,
            minWidth: '280px',
          }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: '1.1rem',
              color: 'var(--title-color, #111)',
            }}>
            {activeDragSection.section?.title ||
              (activeDragSection.section?.type === 'spacer'
                ? 'Espacio en Blanco'
                : activeDragSection.section?.id)}
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-color-light, #666)',
            }}>
            {activeDragSection.section?.type === 'spacer'
              ? `${activeDragSection.section?.height || 40}px de separación vertical`
              : `${activeDragSection.section?.items?.length || 0} elementos`}
          </div>
        </div>
      ) : null}
    </DragOverlay>
  );
};

export default CVDragOverlay;
