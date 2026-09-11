/**
 * ColumnResizer.jsx
 *
 * Draggable divider between left and right columns in 2-column mode.
 * Contains handle bar and visual cue with full touch/mouse responsiveness.
 */

import React from 'react';

/**
 * Interactive draggable column resizer divider.
 *
 * @param {Object} props
 * @param {number} props.leftColPercent - Current left column percentage
 * @param {boolean} props.isResizing - Active resizing drag status
 * @param {Function} props.onStartResize - Event listener for mousedown/touchstart
 * @returns {React.ReactElement}
 */
export const ColumnResizer = ({
  leftColPercent = 33.33,
  isResizing = false,
  onStartResize,
}) => {
  return (
    <div
      className="column-resizer no-print"
      onMouseDown={onStartResize}
      onTouchStart={onStartResize}
      title="Arrastra para ajustar el ancho de las columnas"
      aria-label="Divisor de columnas arrastrable"
      data-testid="column-resizer"
      style={{
        position: 'absolute',
        left: `calc(${leftColPercent}% - 20px)`,
        top: 0,
        bottom: 0,
        width: '40px',
        cursor: 'col-resize',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        touchAction: 'none',
      }}>
      <div
        className={`column-resizer-bar ${isResizing ? 'active' : ''}`}
        style={{
          width: isResizing ? '2px' : '1px',
          height: '100%',
          background: isResizing ? '#3874ff' : 'rgba(56, 116, 255, 0.2)',
          boxShadow: isResizing ? '0 0 6px rgba(56, 116, 255, 0.4)' : 'none',
          transition: 'background 0.15s ease, width 0.15s ease',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <div
          className="column-resizer-handle"
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '8px',
            height: '36px',
            borderRadius: '999px',
            background: isResizing
              ? '#3874ff'
              : 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.14)',
            border: isResizing
              ? '1px solid #3874ff'
              : '1px solid rgba(148, 163, 184, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'col-resize',
            transition: 'all 0.15s ease',
          }}>
          <div
            style={{
              width: '2px',
              height: '14px',
              borderRadius: '1px',
              background: isResizing ? '#ffffff' : '#94a3b8',
              transition: 'background 0.15s ease',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ColumnResizer;
