import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

const HyperlinkPrintView = ({ 
  url = '', 
  text = '', 
  icon = 'bx bx-link-external',
  className = ''
}) => {
  if (!url && !text) return null;
  const cleanUrl = (url || '').trim();
  const targetUrl = cleanUrl ? (cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`) : '#';
  const displayLabel = text || url;
  return (
    <a
      href={targetUrl}
      className={`social__link ${className}`}
      target="_blank"
      rel="noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        color: 'var(--first-color, #3874ff)',
        textDecoration: 'none',
        padding: '2px 4px',
        borderRadius: '4px'
      }}
    >
      {icon && <i className={icon}></i>}
      <span style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>{displayLabel}</span>
    </a>
  );
};

const HyperlinkEditEditor = ({ 
  url = '', 
  text = '', 
  onSave, 
  onRemove, 
  icon = 'bx bx-link-external',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editUrl, setEditUrl] = useState(url);
  const [editText, setEditText] = useState(text || url);
  const [copied, setCopied] = useState(false);
  const [popoverCoords, setPopoverCoords] = useState({ top: 0, left: 0 });

  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    setEditUrl(url);
    setEditText(text || url);
  }, [url, text]);

  const normalizeUrl = (rawUrl) => {
    if (!rawUrl) return '';
    const clean = rawUrl.trim();
    if (/^https?:\/\//i.test(clean)) return clean;
    return `https://${clean}`;
  };

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 320;
    const popoverHeight = 220;

    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 16) {
      left = window.innerWidth - popoverWidth - 16;
    }
    if (left < 16) left = 16;

    let top = rect.bottom + 6;
    // Flip above if escaping viewport bottom
    if (top + popoverHeight > window.innerHeight && rect.top > popoverHeight + 10) {
      top = rect.top - popoverHeight - 6;
    }

    setPopoverCoords({ top, left });
  };

  const handleOpen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    updatePosition();
    setEditUrl(url);
    setEditText(text || url);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setCopied(false);
  };

  const handleApply = (e) => {
    if (e) e.preventDefault();
    const finalUrl = editUrl.trim();
    const finalText = editText.trim() || finalUrl;
    if (onSave) {
      onSave({ url: finalUrl, text: finalText });
    }
    handleClose();
  };

  const handleRemove = (e) => {
    if (e) e.preventDefault();
    if (onRemove) {
      onRemove();
    }
    handleClose();
  };

  const handleCopy = async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(normalizeUrl(editUrl));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  // Close on outside click or escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(e.target) &&
        triggerRef.current && 
        !triggerRef.current.contains(e.target)
      ) {
        handleClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const targetUrl = normalizeUrl(editUrl || url);
  const displayLabel = text || url || 'Agregar hipervínculo';

  const popoverContent = isOpen ? (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Editor de hipervínculo estilo Google Docs"
      data-testid="hyperlink-popover"
      className="no-print"
      style={{
        position: 'fixed',
        top: `${popoverCoords.top}px`,
        left: `${popoverCoords.left}px`,
        width: '320px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0',
        padding: '0.85rem',
        zIndex: 9999,
        fontFamily: 'inherit',
        fontSize: '0.85rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        animation: 'fadeIn 0.12s ease-out'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Bar: Action Buttons (IR AL HIPERVINCULO, Copy, Unlink, Close) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <a
          href={targetUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="btn-go-to-link"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            padding: '5px 10px',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.78rem',
            textDecoration: 'none',
            border: '1px solid #bfdbfe',
            cursor: targetUrl ? 'pointer' : 'default',
            transition: 'background-color 0.15s ease'
          }}
          title="Abrir enlace en una nueva pestaña"
        >
          <i className='bx bx-link-external' style={{ fontSize: '1rem' }}></i>
          <span>IR AL HIPERVÍNCULO</span>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Copy Button */}
          <button
            type="button"
            data-testid="btn-copy-link"
            onClick={handleCopy}
            title={copied ? "¡Enlace copiado!" : "Copiar enlace"}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: '4px',
              color: copied ? '#10b981' : '#64748b',
              fontSize: '1rem'
            }}
          >
            <i className={copied ? 'bx bx-check' : 'bx bx-copy'}></i>
          </button>

          {/* Remove Link Button */}
          {onRemove && (
            <button
              type="button"
              data-testid="btn-remove-link"
              onClick={handleRemove}
              title="Quitar hipervínculo"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '4px',
                color: '#ef4444',
                fontSize: '1rem'
              }}
            >
              <i className='bx bx-unlink'></i>
            </button>
          )}

          {/* Close Popover Button */}
          <button
            type="button"
            data-testid="btn-close-popover"
            onClick={handleClose}
            title="Cerrar"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: '4px',
              color: '#94a3b8',
              fontSize: '1rem'
            }}
          >
            <i className='bx bx-x'></i>
          </button>
        </div>
      </div>

      <div style={{ height: '1px', background: '#f1f5f9', margin: '0 -0.85rem' }} />

      {/* Field 1: Nombre Visual / Texto Editable */}
      <div>
        <label 
          htmlFor="hyperlink-input-text" 
          style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '3px', textTransform: 'uppercase' }}
        >
          Texto (Nombre visual)
        </label>
        <input
          id="hyperlink-input-text"
          type="text"
          data-testid="input-link-text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleApply(e)}
          placeholder="Texto a mostrar en el documento"
          style={{
            width: '100%',
            padding: '6px 8px',
            fontSize: '0.82rem',
            border: '1px solid #cbd5e1',
            borderRadius: '5px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Field 2: Enlace / URL Editable */}
      <div>
        <label 
          htmlFor="hyperlink-input-url" 
          style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '3px', textTransform: 'uppercase' }}
        >
          Enlace (URL)
        </label>
        <input
          id="hyperlink-input-url"
          type="text"
          data-testid="input-link-url"
          value={editUrl}
          onChange={(e) => setEditUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleApply(e)}
          placeholder="https://ejemplo.com/recurso"
          style={{
            width: '100%',
            padding: '6px 8px',
            fontSize: '0.82rem',
            border: '1px solid #cbd5e1',
            borderRadius: '5px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Bottom Bar: Aplicar / Cancelar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '2px' }}>
        <button
          type="button"
          onClick={handleClose}
          style={{
            padding: '5px 12px',
            borderRadius: '5px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            color: '#64748b',
            fontSize: '0.8rem',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          Cancelar
        </button>
        <button
          type="button"
          data-testid="btn-apply-link"
          onClick={handleApply}
          style={{
            padding: '5px 14px',
            borderRadius: '5px',
            border: 'none',
            background: '#2563eb',
            color: '#ffffff',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Aplicar
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <span
        ref={triggerRef}
        onClick={handleOpen}
        className={`social__link ${className}`}
        data-testid="hyperlink-trigger"
        title="Clic para abrir o editar el hipervínculo"
        style={{
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          color: 'var(--first-color, #3874ff)',
          textDecoration: 'none',
          padding: '2px 4px',
          borderRadius: '4px',
          transition: 'background 0.15s ease'
        }}
      >
        <i className={icon}></i>
        <span style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>
          {displayLabel}
        </span>
      </span>

      {typeof document !== 'undefined' && ReactDOM.createPortal(popoverContent, document.body)}
    </>
  );
};

const HyperlinkEdit = (props) => {
  if (props.isPrint) {
    return <HyperlinkPrintView {...props} />;
  }
  return <HyperlinkEditEditor {...props} />;
};

export { HyperlinkPrintView, HyperlinkEditEditor };
export default HyperlinkEdit;
