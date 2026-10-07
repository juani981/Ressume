/**
 * DropIndicatorPlaceholder.jsx
 *
 * Visual snap-in-place drop target indicator ('sombra') showing where the dragged
 * section or item will land if dropped at the current position.
 */

import React from 'react';

export const DropIndicatorPlaceholder = ({ type = 'section', as: Tag = 'div' }) => {
  const isSection = type === 'section';

  return (
    <Tag
      className={`dnd-drop-placeholder dnd-drop-placeholder--${type}`}
      data-testid={`dnd-drop-placeholder-${type}`}
      data-placeholder-type={type}
      aria-hidden="true"
      style={{
        boxSizing: 'border-box',
        width: '100%',
        minHeight: isSection ? '44px' : '32px',
        margin: isSection ? '8px 0' : '4px 0',
        borderRadius: isSection ? '8px' : '6px',
        border: '2px dashed var(--first-color, #3874ff)',
        background: 'rgba(56, 116, 255, 0.08)',
        boxShadow: 'inset 0 0 10px rgba(56, 116, 255, 0.12)',
        transition: 'all 0.15s cubic-bezier(0.2, 0, 0, 1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        overflow: 'hidden',
        listStyle: 'none',
      }}
    >
      <div
        style={{
          height: '2px',
          width: '35%',
          background: 'var(--first-color, #3874ff)',
          borderRadius: '2px',
          opacity: 0.5,
        }}
      />
    </Tag>
  );
};

export default DropIndicatorPlaceholder;
