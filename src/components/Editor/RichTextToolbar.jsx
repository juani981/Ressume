import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useCV } from '../../context/CVContext';
import { 
  Bold, 
  Italic, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  Undo2, 
  Redo2 
} from 'lucide-react';

/**
 * RichTextToolbar - Singleton floating formatting toolbar
 * Strictly conforms to AGENTS.md Rule 3:
 * - Dynamically tracks getBoundingClientRect() of the active editing element
 * - Non-obstructive positioning: floats directly above the element without obscuring it
 * - Flips to bottom if approaching the viewport top boundary
 * - Flips / shifts horizontally when approaching window.innerWidth
 * - Clamps vertically to prevent escaping window.innerHeight
 * - onMouseDown preventDefault on all buttons to preserve text selection
 */
const RichTextToolbar = (props) => {
  const cvContext = useCV();
  const toolbarData = cvContext?.activeToolbar;

  // Prioritize direct props (for standalone tests or controlled usage),
  // fallback to context singleton state
  const isControlled = props.visible !== undefined;
  const isVisible = isControlled ? props.visible : Boolean(toolbarData?.visible);
  const activeElement = props.activeElement !== undefined ? props.activeElement : toolbarData?.activeElement;
  const onFormat = props.onFormat || toolbarData?.onFormat || (() => {});
  const activeFormats = props.activeFormats || toolbarData?.activeFormats || {
    bold: false,
    italic: false,
    align: 'left'
  };
  const propRect = props.rect || toolbarData?.rect;

  const [coords, setCoords] = useState({ top: 100, left: 100 });
  const toolbarRef = useRef(null);

  const TOOLBAR_WIDTH = 290;
  const TOOLBAR_HEIGHT = 40;

  const updatePosition = useCallback(() => {
    let targetRect = propRect;
    if (activeElement && typeof activeElement.getBoundingClientRect === 'function') {
      const domRect = activeElement.getBoundingClientRect();
      // Use domRect if it has dimension/position
      if (domRect.width > 0 || domRect.height > 0 || domRect.top > 0 || domRect.left > 0) {
        targetRect = domRect;
      }
    }

    if (!targetRect) {
      targetRect = { top: 100, left: 100, right: 300, bottom: 130, width: 200, height: 30 };
    }

    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768;

    // Rule 3 Positioning:
    // Float directly above the text element so it does NOT obscure the text
    let top = Math.round(targetRect.top - TOOLBAR_HEIGHT - 8);

    // Flip to below element if approaching the top viewport boundary (< 10px)
    if (top < 10) {
      top = Math.round(targetRect.bottom + 8);
    }

    // Clamp vertically to prevent escaping window.innerHeight
    if (top + TOOLBAR_HEIGHT > vh - 10) {
      top = Math.max(10, vh - TOOLBAR_HEIGHT - 10);
    }
    if (top < 10) {
      top = 10;
    }

    // Horizontal position: align with element's left edge
    let left = Math.round(targetRect.left);

    // Flip / shift when approaching right viewport boundary (window.innerWidth)
    if (left + TOOLBAR_WIDTH > vw - 16) {
      left = Math.round(vw - TOOLBAR_WIDTH - 16);
    }
    if (left < 16) {
      left = 16;
    }

    setCoords({ top, left });
  }, [activeElement, propRect]);

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isVisible, updatePosition]);

  if (!isVisible) {
    return null;
  }

  const handleCommand = (cmd) => {
    if (typeof onFormat === 'function') {
      onFormat(cmd);
    }
  };

  const currentAlign = activeFormats?.align || 'left';
  const isBold = Boolean(activeFormats?.bold);
  const isItalic = Boolean(activeFormats?.italic);

  const buttonStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    padding: 0,
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: isActive ? '#3874ff' : 'transparent',
    color: isActive ? '#ffffff' : '#334155',
    transition: 'background-color 0.12s ease, color 0.12s ease',
    boxShadow: isActive ? '0 1px 3px rgba(56, 116, 255, 0.3)' : 'none'
  });

  const dividerStyle = {
    width: '1px',
    height: '18px',
    backgroundColor: '#e2e8f0',
    margin: '0 3px'
  };

  const toolbarContent = (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Barra de formato de texto"
      data-testid="rich-text-toolbar"
      className="rich-text-toolbar no-print"
      onMouseDown={(e) => {
        // Essential for preserving text selection and focus in contentEditable
        e.preventDefault();
      }}
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        height: `${TOOLBAR_HEIGHT}px`,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '3px 6px',
        backgroundColor: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.15), 0 2px 6px -1px rgba(0, 0, 0, 0.08)',
        userSelect: 'none',
        pointerEvents: 'auto',
        boxSizing: 'border-box'
      }}
    >
      {/* Bold Button */}
      <button
        type="button"
        data-testid="btn-format-bold"
        aria-label="Negrita (Ctrl+B)"
        title="Negrita (Ctrl+B)"
        aria-pressed={isBold}
        style={buttonStyle(isBold)}
        onMouseDown={(e) => {
          e.preventDefault();
          handleCommand('bold');
        }}
        onClick={(e) => {
          e.preventDefault();
          handleCommand('bold');
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCommand('bold');
          }
        }}
      >
        <Bold size={15} strokeWidth={2.5} />
      </button>

      {/* Italic Button */}
      <button
        type="button"
        data-testid="btn-format-italic"
        aria-label="Cursiva (Ctrl+I)"
        title="Cursiva (Ctrl+I)"
        aria-pressed={isItalic}
        style={buttonStyle(isItalic)}
        onMouseDown={(e) => {
          e.preventDefault();
          handleCommand('italic');
        }}
        onClick={(e) => {
          e.preventDefault();
          handleCommand('italic');
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCommand('italic');
          }
        }}
      >
        <Italic size={15} strokeWidth={2.5} />
      </button>

      <div style={dividerStyle} />

      {/* Align Left Button */}
      <button
        type="button"
        data-testid="btn-format-align-left"
        aria-label="Alinear a la izquierda"
        title="Alinear a la izquierda"
        aria-pressed={currentAlign === 'left'}
        style={buttonStyle(currentAlign === 'left')}
        onMouseDown={(e) => {
          e.preventDefault();
          handleCommand('justifyLeft');
        }}
        onClick={(e) => {
          e.preventDefault();
          handleCommand('justifyLeft');
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCommand('justifyLeft');
          }
        }}
      >
        <AlignLeft size={15} />
      </button>

      {/* Align Center Button */}
      <button
        type="button"
        data-testid="btn-format-align-center"
        aria-label="Centrar"
        title="Centrar"
        aria-pressed={currentAlign === 'center'}
        style={buttonStyle(currentAlign === 'center')}
        onMouseDown={(e) => {
          e.preventDefault();
          handleCommand('justifyCenter');
        }}
        onClick={(e) => {
          e.preventDefault();
          handleCommand('justifyCenter');
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCommand('justifyCenter');
          }
        }}
      >
        <AlignCenter size={15} />
      </button>

      {/* Align Right Button */}
      <button
        type="button"
        data-testid="btn-format-align-right"
        aria-label="Alinear a la derecha"
        title="Alinear a la derecha"
        aria-pressed={currentAlign === 'right'}
        style={buttonStyle(currentAlign === 'right')}
        onMouseDown={(e) => {
          e.preventDefault();
          handleCommand('justifyRight');
        }}
        onClick={(e) => {
          e.preventDefault();
          handleCommand('justifyRight');
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCommand('justifyRight');
          }
        }}
      >
        <AlignRight size={15} />
      </button>

      {/* Align Justify Button */}
      <button
        type="button"
        data-testid="btn-format-align-justify"
        aria-label="Justificar"
        title="Justificar"
        aria-pressed={currentAlign === 'justify'}
        style={buttonStyle(currentAlign === 'justify')}
        onMouseDown={(e) => {
          e.preventDefault();
          handleCommand('justifyFull');
        }}
        onClick={(e) => {
          e.preventDefault();
          handleCommand('justifyFull');
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCommand('justifyFull');
          }
        }}
      >
        <AlignJustify size={15} />
      </button>

      <div style={dividerStyle} />

      {/* Undo Button */}
      <button
        type="button"
        data-testid="btn-format-undo"
        aria-label="Deshacer (Ctrl+Z)"
        title="Deshacer (Ctrl+Z)"
        style={buttonStyle(false)}
        onMouseDown={(e) => {
          e.preventDefault();
          handleCommand('undo');
        }}
        onClick={(e) => {
          e.preventDefault();
          handleCommand('undo');
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCommand('undo');
          }
        }}
      >
        <Undo2 size={15} />
      </button>

      {/* Redo Button */}
      <button
        type="button"
        data-testid="btn-format-redo"
        aria-label="Rehacer (Ctrl+Y)"
        title="Rehacer (Ctrl+Y)"
        style={buttonStyle(false)}
        onMouseDown={(e) => {
          e.preventDefault();
          handleCommand('redo');
        }}
        onClick={(e) => {
          e.preventDefault();
          handleCommand('redo');
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCommand('redo');
          }
        }}
      >
        <Redo2 size={15} />
      </button>
    </div>
  );

  const target = props.portalTarget !== undefined
    ? props.portalTarget
    : ((activeElement || propRect) && typeof document !== 'undefined' ? document.body : null);

  if (target) {
    return ReactDOM.createPortal(toolbarContent, target);
  }
  return toolbarContent;
};

export default RichTextToolbar;
