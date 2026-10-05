import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { OctagonAlert, X } from 'lucide-react';

/**
 * SectionDeleteConfirmPopover
 * 
 * Floating Obsidian Callout (Danger standard) popover for confirming section deletion.
 * Rendered via Portal to document.body to ensure ZERO DOM height mutation inside
 * .a4-page-box, preventing accidental pagination reflow or item clipping (Invariants 1, 3, 15).
 */
const SectionDeleteConfirmPopover = ({
  isOpen,
  onClose,
  onConfirm,
  sectionTitle,
  triggerRect,
  portalTarget
}) => {
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate dynamic coordinates anchored to triggerRect (Invariant 3)
  const calculatePosition = () => {
    const popoverWidth = 280;
    const padding = 12;

    let top = 100;
    let left = 100;

    if (triggerRect) {
      top = triggerRect.bottom + 6;
      left = triggerRect.right - popoverWidth;

      // Prevent escaping left edge
      if (left < padding) left = padding;

      // Prevent escaping right edge
      if (typeof window !== 'undefined' && left + popoverWidth > window.innerWidth - padding) {
        left = window.innerWidth - popoverWidth - padding;
      }

      // Flip above if escaping viewport bottom
      if (typeof window !== 'undefined' && top + 160 > window.innerHeight - padding) {
        top = Math.max(padding, triggerRect.top - 160);
      }
    }

    return { top: `${Math.round(top)}px`, left: `${Math.round(left)}px` };
  };

  const pos = calculatePosition();

  const popoverContent = (
    <div
      ref={popoverRef}
      className="obsidian-callout section-delete-confirm-popover"
      data-testid="section-delete-confirm-popover"
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: '280px',
        background: '#ffffff',
        border: '1px solid rgba(233, 49, 71, 0.3)',
        borderLeft: '4px solid rgba(233, 49, 71, 1)',
        borderRadius: '8px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        padding: '12px 14px',
        zIndex: 9999,
        fontSize: '0.82rem',
        color: '#1e293b'
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div 
        className="callout-title"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          fontWeight: 700,
          color: 'rgba(233, 49, 71, 1)',
          marginBottom: '6px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <OctagonAlert size={16} />
          <span>¿Eliminar sección?</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px'
          }}
          title="Cancelar"
          aria-label="Cerrar confirmación"
        >
          <X size={14} />
        </button>
      </div>

      <div 
        className="callout-content"
        style={{
          color: '#475569',
          fontSize: '0.78rem',
          lineHeight: 1.4,
          marginBottom: '12px'
        }}
      >
        Se eliminará permanentemente la sección <strong>"{sectionTitle || 'esta sección'}"</strong> y todos sus elementos.
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onClose}
          data-testid="btn-cancel-delete-section"
          style={{
            padding: '5px 10px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: '#475569',
            fontWeight: 600,
            fontSize: '0.75rem',
            cursor: 'pointer'
          }}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          data-testid="btn-confirm-delete-section"
          style={{
            padding: '5px 10px',
            borderRadius: '6px',
            border: 'none',
            background: 'rgba(233, 49, 71, 1)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.75rem',
            cursor: 'pointer'
          }}
        >
          Eliminar
        </button>
      </div>
    </div>
  );

  const target = portalTarget !== undefined
    ? portalTarget
    : (triggerRect && typeof document !== 'undefined' ? document.body : null);

  if (target) {
    return ReactDOM.createPortal(popoverContent, target);
  }
  return popoverContent;
};

export default SectionDeleteConfirmPopover;
