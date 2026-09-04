import React, { useEffect, useRef } from 'react';
import { BULLET_SIZES, BULLET_VARIANTS, DEFAULT_BULLET_STYLE } from '../../utils/bulletStyles';
import { X, Check } from 'lucide-react';

/**
 * SectionBulletStylePopover
 * 
 * Discreet popover attached to section containers allowing the user to configure
 * bullet and circle styling (size, variant, and line connector) once for all items in that container.
 */
const SectionBulletStylePopover = ({ 
  isOpen, 
  onClose, 
  bulletStyle, 
  onUpdateStyle, 
  triggerRect 
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

  const current = { ...DEFAULT_BULLET_STYLE, ...(bulletStyle || {}) };

  // Calculate dynamic coordinates based on triggerRect (AGENTS.md Rule 3)
  const calculatePosition = () => {
    const popoverWidth = 260;
    const popoverHeight = 250;
    const padding = 12;

    let top = 100;
    let left = 100;

    if (triggerRect) {
      top = triggerRect.bottom + 6;
      left = triggerRect.left - popoverWidth / 2 + triggerRect.width / 2;

      // Flip above if escaping viewport bottom
      if (top + popoverHeight > window.innerHeight - padding) {
        top = Math.max(padding, triggerRect.top - popoverHeight - 6);
      }

      // Clamp horizontally
      if (left + popoverWidth > window.innerWidth - padding) {
        left = window.innerWidth - popoverWidth - padding;
      }
      if (left < padding) {
        left = padding;
      }
    } else {
      top = window.innerHeight / 2 - 120;
      left = window.innerWidth / 2 - 130;
    }

    return { top: `${top}px`, left: `${left}px` };
  };

  const positionStyle = calculatePosition();

  return (
    <div
      ref={popoverRef}
      className="section-bullet-style-popover no-print"
      data-testid="bullet-style-popover"
      style={{
        position: 'fixed',
        ...positionStyle,
        width: '260px',
        backgroundColor: 'var(--container-color, #ffffff)',
        borderRadius: '10px',
        boxShadow: '0 10px 28px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.08)',
        zIndex: 1000,
        padding: '0.75rem 0.85rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        fontSize: '0.8rem'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.4rem' }}>
        <span style={{ fontWeight: 700, color: 'var(--title-color, #0f172a)' }}>
          Círculo del Título
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-color-light, #94a3b8)' }}
          title="Cerrar"
        >
          <X size={15} />
        </button>
      </div>

      {/* Control 1: Tamaño */}
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-color-light, #64748b)', marginBottom: '4px' }}>
          Tamaño
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {BULLET_SIZES.map(s => {
            const isActive = current.size === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onUpdateStyle({ size: s.id })}
                data-testid={`bullet-size-${s.id}`}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  borderRadius: '6px',
                  border: isActive ? '1.5px solid #0f172a' : '1px solid rgba(0,0,0,0.08)',
                  background: isActive ? '#0f172a' : 'var(--container-color-alt, #f8fafc)',
                  color: isActive ? '#ffffff' : 'var(--text-color, #334155)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                {isActive && <Check size={12} color="#ffffff" />}
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Control 2: Artefacto Visual / Variante */}
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-color-light, #64748b)', marginBottom: '4px' }}>
          Estilo del Círculo
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {BULLET_VARIANTS.map(v => {
            const isActive = current.variant === v.id || 
              (v.id === 'bold' && current.variant === 'black') || 
              (v.id === 'circle' && current.variant === 'ring');
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onUpdateStyle({ variant: v.id })}
                data-testid={`bullet-variant-${v.id}`}
                style={{
                  flex: 1,
                  padding: '5px 6px',
                  borderRadius: '6px',
                  border: isActive ? '1.5px solid #0f172a' : '1px solid rgba(0,0,0,0.08)',
                  background: isActive ? '#0f172a' : 'var(--container-color-alt, #f8fafc)',
                  color: isActive ? '#ffffff' : 'var(--text-color, #334155)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.73rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  transition: 'all 0.15s ease'
                }}
              >
                {isActive && <Check size={11} color="#ffffff" />}
                <span>{v.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Control 3: Línea conectora debajo */}
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-color-light, #64748b)', marginBottom: '4px' }}>
          Línea Conectora
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            onClick={() => onUpdateStyle({ showLine: true })}
            data-testid="bullet-line-show"
            style={{
              flex: 1,
              padding: '5px 8px',
              borderRadius: '6px',
              border: current.showLine !== false ? '1.5px solid #0f172a' : '1px solid rgba(0,0,0,0.08)',
              background: current.showLine !== false ? '#0f172a' : 'var(--container-color-alt, #f8fafc)',
              color: current.showLine !== false ? '#ffffff' : 'var(--text-color, #334155)',
              fontWeight: current.showLine !== false ? 700 : 500,
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            {current.showLine !== false && <Check size={12} color="#ffffff" />}
            <span>Con Línea</span>
          </button>
          <button
            type="button"
            onClick={() => onUpdateStyle({ showLine: false })}
            data-testid="bullet-line-hide"
            style={{
              flex: 1,
              padding: '5px 8px',
              borderRadius: '6px',
              border: current.showLine === false ? '1.5px solid #0f172a' : '1px solid rgba(0,0,0,0.08)',
              background: current.showLine === false ? '#0f172a' : 'var(--container-color-alt, #f8fafc)',
              color: current.showLine === false ? '#ffffff' : 'var(--text-color, #334155)',
              fontWeight: current.showLine === false ? 700 : 500,
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            {current.showLine === false && <Check size={12} color="#ffffff" />}
            <span>Sin Línea</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectionBulletStylePopover;
