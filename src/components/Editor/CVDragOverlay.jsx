/**
 * CVDragOverlay.jsx
 *
 * Smooth 60fps ghost overlay for active drag items and sections.
 * Prevents DOM clipping and provides visual affordance during drag operations.
 */

import React from 'react';
import { DragOverlay } from '@dnd-kit/core';
import { getSectionDescriptor } from '../../registry/sectionRegistry';

/**
 * Content renderer for the active drag preview overlay.
 * Renders user-friendly declared component names matching the section menu 1:1 (ZERO raw IDs).
 */
export const CVDragOverlayContent = ({ activeDragItem, activeDragSection }) => {
  // Resolve friendly declared names from registry
  const section = activeDragSection?.section;
  const sectionType = section?.type || section?.id;
  const sectionDescriptor = sectionType ? (getSectionDescriptor(section?.type) || getSectionDescriptor(sectionType)) : null;
  const declaredSectionName = sectionDescriptor?.label || (sectionType === 'spacer' ? 'Espacio en blanco' : 'Sección');

  const itemSectionType = activeDragItem?.sectionType;
  const itemDescriptor = itemSectionType ? getSectionDescriptor(itemSectionType) : null;
  const declaredItemParentName = itemDescriptor?.label || 'Elemento';

  if (activeDragItem) {
    return (
      <div
        data-testid="drag-overlay-item"
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
          data-testid="drag-overlay-item-badge"
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--first-color, #3874ff)',
            marginBottom: '3px'
          }}>
          {declaredItemParentName}
        </div>
        <div
          data-testid="drag-overlay-item-title"
          style={{
            fontWeight: 600,
            color: 'var(--title-color, #111)',
          }}>
          {activeDragItem.item?.title ||
            activeDragItem.item?.name ||
            activeDragItem.item?.text ||
            activeDragItem.item?.institution ||
            activeDragItem.item?.language ||
            (activeDragItem.item?.contacts?.length ? `${activeDragItem.item.contacts.length} contactos` : null) ||
            declaredItemParentName}
        </div>
        {activeDragItem.item?.subtitle && (
          <div
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-color-light, #666)',
              marginTop: '2px',
            }}>
            {activeDragItem.item.subtitle}
          </div>
        )}
      </div>
    );
  }

  if (activeDragSection) {
    return (
      <div
        data-testid="drag-overlay-section"
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
          data-testid="drag-overlay-section-title"
          style={{
            fontWeight: 700,
            fontSize: '1.05rem',
            color: 'var(--title-color, #111)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}>
          <span>{declaredSectionName}</span>
          {section?.title && section.title.trim() !== '' && section.title.trim() !== declaredSectionName && (
            <span 
              data-testid="drag-overlay-section-custom-title"
              style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-color-light, #666)' }}>
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
          }}>
          {section?.type === 'spacer'
            ? `${section?.height || 40}px de separación vertical`
            : `${section?.items?.length || 0} ${section?.items?.length === 1 ? 'elemento' : 'elementos'}`}
        </div>
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
 * @returns {React.ReactElement}
 */
export const CVDragOverlay = () => {
  // Suppress floating ghost clone tracking the mouse cursor.
  // Real-time live sort dynamically reorders the document in-place as the user drags.
  return null;
};

export default CVDragOverlay;
