import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCV } from '../../context/CVContext';
import DragHandle from '../Editor/DragHandle';
import { MoveVertical, Trash2, Check } from 'lucide-react';
import { createContainerDragListeners } from '../../utils/dndUtils';

/**
 * SpacerBlock
 *
 * Resizable (only vertically) blank component that creates whitespace in the CV document.
 * In the live editor:
 *   - Provides a bottom vertical drag handle to adjust height (8px to 600px).
 *   - Features quick preset buttons (20px, 40px, 80px, 120px) and exact numeric entry.
 *   - Supports transparent whitespace (default) or solid black mode.
 *   - Drag & drop sortable with @dnd-kit to position whitespace anywhere in any column.
 * In print / PDF:
 *   - Renders pure, pixel-perfect vertical whitespace with zero editor controls or borders.
 */
export const PrintSpacerBlock = ({ section, height: propHeight, isBlack: propIsBlack, id: propId }) => {
  const height = propHeight ?? (Number(section?.height) || Number(section?.items?.[0]?.height) || Number(section?.bottomSpacing) || 40);
  const isBlack = propIsBlack ?? (section?.backgroundColor === '#000000' || section?.backgroundColor === 'black');
  const id = propId ?? section?.id;

  if (height <= 0) return null;

  return (
    <div
      id={id}
      className="cv-section cv-block spacer-section"
      data-section-id={id}
      data-spacer-height={height}
      style={{
        height: `${height}px`,
        minHeight: `${height}px`,
        maxHeight: `${height}px`,
        width: '100%',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
        backgroundColor: isBlack ? '#000000' : 'transparent',
        border: 'none',
        outline: 'none',
        display: 'block',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        WebkitColumnBreakInside: 'avoid',
      }}
    />
  );
};

/**
 * useVerticalSpacerResize
 *
 * Shared hook for vertical resize logic (mouse and touch drag, keyboard navigation, min/max clamping).
 * Completely reutilized across stand-alone spacer blocks and container-concatenated bottom spacers.
 */
export const useVerticalSpacerResize = ({
  initialHeight = 0,
  min = 0,
  max = 600,
  onCommit,
}) => {
  const [localHeight, setLocalHeight] = useState(initialHeight);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!isResizing) {
      setLocalHeight(initialHeight);
    }
  }, [initialHeight, isResizing]);

  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    const startY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    const startHeight = localHeight;

    const handleMove = (moveEvent) => {
      const currentY = moveEvent.clientY ?? (moveEvent.touches && moveEvent.touches[0] ? moveEvent.touches[0].clientY : 0);
      const deltaY = currentY - startY;
      const nextH = Math.round(Math.max(min, Math.min(max, startHeight + deltaY)));
      setLocalHeight(nextH);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cv-spacer-live-resize', { detail: { height: nextH } }));
      }
    };

    const handleEnd = (endEvent) => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      const endY = endEvent.clientY ?? (endEvent.changedTouches && endEvent.changedTouches[0] ? endEvent.changedTouches[0].clientY : startY);
      const finalH = Math.round(Math.max(min, Math.min(max, startHeight + (endY - startY))));
      const clampedFinal = Math.round(Math.max(min, Math.min(max, finalH)));
      setLocalHeight(clampedFinal);
      if (typeof onCommit === 'function') {
        onCommit(clampedFinal);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cv-spacer-live-resize', { detail: { height: clampedFinal } }));
      }
    };

    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
  }, [localHeight, min, max, onCommit]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 2;
      const nextH = Math.round(Math.max(min, Math.min(max, localHeight - step)));
      setLocalHeight(nextH);
      if (typeof onCommit === 'function') onCommit(nextH);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cv-spacer-live-resize', { detail: { height: nextH } }));
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 2;
      const nextH = Math.round(Math.max(min, Math.min(max, localHeight + step)));
      setLocalHeight(nextH);
      if (typeof onCommit === 'function') onCommit(nextH);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cv-spacer-live-resize', { detail: { height: nextH } }));
      }
    }
  }, [localHeight, min, max, onCommit]);

  return {
    localHeight,
    setLocalHeight,
    isResizing,
    handleResizeStart,
    handleKeyDown,
  };
};

/**
 * SpacerResizeHandle
 *
 * Shared bottom vertical resize handle bar with ns-resize cursor, handle pill with resize icon, and pixel feedback.
 */
export const SpacerResizeHandle = ({
  testId,
  height,
  min = 0,
  max = 600,
  isHovered = false,
  isResizing = false,
  onMouseDown,
  onTouchStart,
  onKeyDown,
  onMouseEnter,
  onMouseLeave,
  style = {},
  showIndicator = false,
}) => {
  return (
    <div
      className="spacer-resize-handle no-print"
      data-testid={testId}
      role="slider"
      aria-label="Ajustar altura de espacio en blanco"
      aria-valuenow={height}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onKeyDown={onKeyDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title="Arrastra verticalmente para ajustar la altura del espacio"
      style={{
        position: 'absolute',
        bottom: '-6px',
        left: 0,
        right: 0,
        height: '14px',
        cursor: 'ns-resize',
        zIndex: 35,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        touchAction: 'none',
        ...style,
      }}
    >
      <div
        style={{
          width: isHovered || isResizing ? '64px' : '36px',
          height: isHovered || isResizing ? '12px' : '4px',
          borderRadius: '6px',
          position: 'absolute',
          background: isResizing ? '#3874ff' : (isHovered ? '#60a5fa' : 'rgba(148, 163, 184, 0.6)'),
          boxShadow: isResizing ? '0 0 6px rgba(56, 116, 255, 0.6)' : 'none',
          transition: 'all 0.15s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {(isHovered || isResizing) && (
          <MoveVertical size={10} color="#ffffff" style={{ pointerEvents: 'none' }} />
        )}
      </div>

      {showIndicator && (isResizing || (isHovered && height > 0)) && (
        <span
          data-testid={`${testId}-indicator`}
          style={{
            position: 'absolute',
            bottom: '16px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '4px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            zIndex: 40,
          }}
        >
          {height}px
        </span>
      )}
    </div>
  );
};

/**
 * EditableIntegratedBottomSpacer
 *
 * Concatenated bottom whitespace spacer for any base container.
 * Initial size: 0px.
 * On touching / hovering bottom edge: reveals the exact vertical resize handle.
 * Without any additional menu, presets bar, or delete button ("sin ningún control o menú adicional").
 */
export const EditableIntegratedBottomSpacer = ({
  containerId,
  height = 0,
  onUpdateHeight,
}) => {
  const rawHeight = Number(height) || 0;
  const [isHovered, setIsHovered] = useState(false);

  const commitHeight = useCallback((newH) => {
    const clamped = Math.round(Math.max(0, Math.min(600, newH)));
    if (typeof onUpdateHeight === 'function') {
      onUpdateHeight(clamped);
    }
  }, [onUpdateHeight]);

  const {
    localHeight,
    isResizing,
    handleResizeStart,
    handleKeyDown,
  } = useVerticalSpacerResize({
    initialHeight: rawHeight,
    min: 0,
    max: 600,
    onCommit: commitHeight,
  });

  return (
    <div
      className="integrated-bottom-spacer no-print"
      data-testid={`integrated-bottom-spacer-${containerId}`}
      data-spacer-height={localHeight}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        if (!isResizing) setIsHovered(false);
      }}
      style={{
        position: 'relative',
        width: '100%',
        height: `${localHeight}px`,
        minHeight: `${localHeight}px`,
        boxSizing: 'border-box',
        backgroundColor: 'transparent',
        border: localHeight > 0
          ? (isHovered || isResizing ? '1px dashed #3874ff' : '1px dashed rgba(148, 163, 184, 0.35)')
          : 'none',
        borderRadius: '3px',
        transition: isResizing ? 'none' : 'height 0.1s ease, border-color 0.15s ease',
        userSelect: isResizing ? 'none' : 'auto',
      }}
    >
      <SpacerResizeHandle
        testId={`spacer-resize-handle-${containerId}-bottom`}
        height={localHeight}
        min={0}
        max={600}
        isHovered={isHovered}
        isResizing={isResizing}
        onMouseDown={handleResizeStart}
        onTouchStart={handleResizeStart}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          if (!isResizing) setIsHovered(false);
        }}
        showIndicator={true}
        style={{
          position: 'absolute',
          bottom: localHeight > 0 ? '-6px' : '-7px',
          left: 0,
          right: 0,
          height: '16px',
          zIndex: 35,
          opacity: isHovered || isResizing ? 1 : 0,
          pointerEvents: 'auto',
          transition: 'opacity 0.15s ease',
        }}
      />
    </div>
  );
};

/**
 * IntegratedBottomSpacer
 *
 * Concatenates bottom whitespace to any container.
 * In Print: outputs pure PrintSpacerBlock if height > 0, else null.
 * In Live Editor: renders EditableIntegratedBottomSpacer with bottom edge resize handle.
 */
export const IntegratedBottomSpacer = ({
  containerId,
  height = 0,
  onUpdateHeight,
  isPrint = false,
}) => {
  const numHeight = Number(height) || 0;
  if (isPrint) {
    if (numHeight <= 0) return null;
    return (
      <PrintSpacerBlock
        id={`${containerId}-bottom-space`}
        height={numHeight}
        isBlack={false}
      />
    );
  }

  return (
    <EditableIntegratedBottomSpacer
      containerId={containerId}
      height={numHeight}
      onUpdateHeight={onUpdateHeight}
    />
  );
};

export const EditableSpacerBlock = ({ section }) => {
  const { deleteSection, updateSectionProperty } = useCV();

  const rawHeight = Number(section?.height) || Number(section?.items?.[0]?.height) || 40;
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingExact, setIsEditingExact] = useState(false);
  const [exactInputVal, setExactInputVal] = useState(String(rawHeight));
  const exactInputRef = useRef(null);

  const commitHeight = useCallback((newH) => {
    const clamped = Math.round(Math.max(8, Math.min(600, newH)));
    setExactInputVal(String(clamped));
    if (typeof updateSectionProperty === 'function') {
      updateSectionProperty(section.id, 'height', clamped);
    }
  }, [section.id, updateSectionProperty]);

  const {
    localHeight,
    setLocalHeight,
    isResizing,
    handleResizeStart,
    handleKeyDown,
  } = useVerticalSpacerResize({
    initialHeight: rawHeight,
    min: 8,
    max: 600,
    onCommit: commitHeight,
  });

  // Sync external height changes if not actively resizing
  useEffect(() => {
    if (!isResizing) {
      setExactInputVal(String(rawHeight));
    }
  }, [rawHeight, isResizing]);

  const isBlack = section?.backgroundColor === '#000000' || section?.backgroundColor === 'black';

  // Sortable hook from @dnd-kit for section-level drag and drop
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    data: {
      type: 'section',
      section,
    },
    disabled: isResizing, // Disable sortable dragging while resizing height
  });

  const toggleColorMode = useCallback(() => {
    const newColor = isBlack ? 'transparent' : '#000000';
    if (typeof updateSectionProperty === 'function') {
      updateSectionProperty(section.id, 'backgroundColor', newColor);
    }
  }, [isBlack, section.id, updateSectionProperty]);

  const handleExactInputSubmit = (e) => {
    e.preventDefault();
    const parsed = parseInt(exactInputVal, 10);
    if (!isNaN(parsed)) {
      commitHeight(parsed);
    }
    setIsEditingExact(false);
  };

  useEffect(() => {
    if (isEditingExact && exactInputRef.current) {
      exactInputRef.current.focus();
      exactInputRef.current.select();
    }
  }, [isEditingExact]);

  const containerStyle = {
    transform: CSS.Transform.toString(transform),
    transition: isResizing ? 'none' : transition,
    position: 'relative',
    height: `${localHeight}px`,
    minHeight: `${localHeight}px`,
    boxSizing: 'border-box',
    opacity: isDragging ? 0.35 : 1,
    backgroundColor: isBlack ? '#000000' : 'transparent',
    border: isHovered || isResizing
      ? '1px dashed #3874ff'
      : '1px dashed rgba(148, 163, 184, 0.4)',
    borderRadius: '4px',
    margin: 0,
    padding: 0,
    userSelect: isResizing ? 'none' : 'auto',
  };

  const PRESETS = [20, 40, 80, 120];
  const containerDragListeners = createContainerDragListeners(listeners, false);

  return (
    <div
      ref={setNodeRef}
      id={section.id}
      data-testid={`spacer-section-${section.id}`}
      data-section-id={section.id}
      data-spacer-height={localHeight}
      className={`spacer-section editable-section-container cv-section ${isBlack ? 'spacer--black' : 'spacer--blank'}`}
      style={containerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        if (!isResizing && !isEditingExact) setIsHovered(false);
      }}
      {...attributes}
      {...containerDragListeners}
    >
      {/* 1. Sortable Drag Handle (top-left) */}
      <div
        className="no-print"
        style={{
          position: 'absolute',
          top: '-12px',
          left: '8px',
          zIndex: 40,
          opacity: isHovered || isResizing ? 1 : 0,
          transition: 'opacity 0.15s ease',
        }}
      >
        <DragHandle listeners={listeners} attributes={attributes} />
      </div>

      {/* 2. Floating Action Controls Bar (center) */}
      <div
        className="spacer-controls-bar no-print"
        data-testid={`spacer-controls-${section.id}`}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(4px)',
          border: '1px solid #cbd5e1',
          borderRadius: '20px',
          padding: '2px 8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
          zIndex: 30,
          opacity: isHovered || isResizing || isEditingExact ? 1 : 0,
          pointerEvents: isHovered || isResizing || isEditingExact ? 'auto' : 'none',
          transition: 'opacity 0.15s ease',
          whiteSpace: 'nowrap',
        }}
      >
        <MoveVertical size={13} color="#3874ff" />

        {/* Height Badge / Inline Editor */}
        {isEditingExact ? (
          <form onSubmit={handleExactInputSubmit} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <input
              ref={exactInputRef}
              type="number"
              min="8"
              max="600"
              value={exactInputVal}
              onChange={(e) => setExactInputVal(e.target.value)}
              onBlur={handleExactInputSubmit}
              style={{
                width: '44px',
                padding: '1px 3px',
                fontSize: '11px',
                fontWeight: 600,
                border: '1px solid #3874ff',
                borderRadius: '4px',
                outline: 'none',
                textAlign: 'center',
              }}
            />
            <span style={{ fontSize: '11px', color: '#64748b' }}>px</span>
            <button
              type="submit"
              style={{
                background: '#3874ff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '2px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Check size={11} />
            </button>
          </form>
        ) : (
          <button
            type="button"
            data-testid={`spacer-badge-${section.id}`}
            title="Haz clic para escribir altura exacta en px"
            onClick={() => setIsEditingExact(true)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '11px',
              fontWeight: 700,
              color: '#0f172a',
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: '4px',
            }}
          >
            {localHeight}px
          </button>
        )}

        {/* Quick Presets */}
        <div style={{ display: 'flex', gap: '3px', borderLeft: '1px solid #e2e8f0', paddingLeft: '6px' }}>
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              data-testid={`spacer-preset-${preset}-${section.id}`}
              onClick={() => commitHeight(preset)}
              style={{
                background: localHeight === preset ? '#3874ff' : 'rgba(241, 245, 249, 0.8)',
                color: localHeight === preset ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: 600,
                padding: '1px 5px',
                cursor: 'pointer',
                lineHeight: '16px',
              }}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Color Mode Toggle (Blanco / Negro) */}
        <button
          type="button"
          data-testid={`spacer-color-toggle-${section.id}`}
          onClick={toggleColorMode}
          title={isBlack ? 'Cambiar a espacio en blanco (transparente)' : 'Cambiar a bloque negro'}
          style={{
            background: isBlack ? '#000000' : '#ffffff',
            color: isBlack ? '#ffffff' : '#000000',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 700,
            padding: '1px 6px',
            cursor: 'pointer',
            marginLeft: '2px',
          }}
        >
          {isBlack ? 'Negro' : 'Blanco'}
        </button>

        {/* Delete Button */}
        <button
          type="button"
          data-testid={`spacer-del-btn-${section.id}`}
          onClick={(e) => {
            e.stopPropagation();
            deleteSection(section.id);
          }}
          title="Eliminar este espacio"
          style={{
            background: 'none',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            marginLeft: '2px',
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* 3. Bottom Vertical Resize Handle Bar */}
      <SpacerResizeHandle
        testId={`spacer-resize-handle-${section.id}`}
        height={localHeight}
        min={8}
        max={600}
        isHovered={isHovered}
        isResizing={isResizing}
        onMouseDown={handleResizeStart}
        onTouchStart={handleResizeStart}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

const SpacerBlock = (props) => {
  if (props.isPrint) {
    return <PrintSpacerBlock {...props} />;
  }
  return <EditableSpacerBlock {...props} />;
};

export default SpacerBlock;
