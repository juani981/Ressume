import React, { useState } from 'react';
import {
  MessageSquareQuote,
  PenLine,
  Check,
  X,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

export const FOOTER_STORAGE_KEY = 'ressume_custom_footer_message';
export const DEFAULT_FOOTER_MESSAGE = 'Diseñado para impulsar tu carrera profesional • 100% Privado y Gratuito';

export const Footer = () => {
  const [customMessage, setCustomMessage] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(FOOTER_STORAGE_KEY);
        if (stored !== null && stored !== undefined && stored.trim() !== '') {
          return stored;
        }
      } catch (_) {}
    }
    return DEFAULT_FOOTER_MESSAGE;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [draftMessage, setDraftMessage] = useState(customMessage);

  const handleStartEdit = () => {
    setDraftMessage(customMessage);
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmed = draftMessage.trim();
    const nextMessage = trimmed.length > 0 ? trimmed : DEFAULT_FOOTER_MESSAGE;
    setCustomMessage(nextMessage);
    setIsEditing(false);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(FOOTER_STORAGE_KEY, nextMessage);
      }
    } catch (_) {}
  };

  const handleCancel = () => {
    setDraftMessage(customMessage);
    setIsEditing(false);
  };

  const handleReset = () => {
    setCustomMessage(DEFAULT_FOOTER_MESSAGE);
    setDraftMessage(DEFAULT_FOOTER_MESSAGE);
    setIsEditing(false);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(FOOTER_STORAGE_KEY);
      }
    } catch (_) {}
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <footer
      className="app-footer bd-container no-print"
      data-testid="app-footer"
      role="contentinfo"
      style={{
        marginTop: '2rem',
        marginBottom: '2.5rem',
        padding: '1.25rem 1.5rem',
        borderRadius: '16px',
        backgroundColor: 'var(--container-color, #ffffff)',
        border: '1px solid var(--border-color, rgba(150, 150, 150, 0.15))',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        color: 'var(--text-color, #334155)',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Row: Custom Message Banner / Editor */}
      <div
        data-testid="footer-custom-message-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.85rem 1.15rem',
          borderRadius: '12px',
          backgroundColor: 'var(--body-color, #f8fafc)',
          border: '1px solid var(--border-color, rgba(150, 150, 150, 0.12))'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(56, 116, 255, 0.1)',
              color: '#3874ff',
              flexShrink: 0
            }}
          >
            <MessageSquareQuote size={18} />
          </div>

          {isEditing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', flexWrap: 'wrap' }}>
              <input
                type="text"
                data-testid="footer-message-input"
                value={draftMessage}
                onChange={(e) => setDraftMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje personalizado..."
                autoFocus
                maxLength={200}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #3874ff',
                  backgroundColor: 'var(--container-color, #ffffff)',
                  color: 'var(--text-color, #0f172a)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxShadow: '0 0 0 2px rgba(56, 116, 255, 0.2)'
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <button
                  type="button"
                  data-testid="footer-save-btn"
                  onClick={handleSave}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#3874ff',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'opacity 0.15s ease'
                  }}
                  title="Guardar mensaje (Enter)"
                >
                  <Check size={14} /> Guardar
                </button>
                <button
                  type="button"
                  data-testid="footer-cancel-btn"
                  onClick={handleCancel}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color, rgba(150, 150, 150, 0.25))',
                    backgroundColor: 'transparent',
                    color: 'var(--text-color-light, #64748b)',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                  title="Cancelar edición (Esc)"
                >
                  <X size={14} /> Cancelar
                </button>
                <button
                  type="button"
                  data-testid="footer-reset-btn"
                  onClick={handleReset}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.45rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color, rgba(150, 150, 150, 0.25))',
                    backgroundColor: 'transparent',
                    color: 'var(--text-color-light, #64748b)',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                  title="Restablecer mensaje original"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-color-light, #64748b)',
                  fontWeight: 600
                }}
              >
                Mensaje personalizado
              </span>
              <p
                data-testid="footer-custom-message-text"
                style={{
                  margin: 0,
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  color: 'var(--text-color, #1e293b)',
                  lineHeight: '1.4'
                }}
              >
                {customMessage}
              </p>
            </div>
          )}
        </div>

        {!isEditing && (
          <button
            type="button"
            data-testid="footer-edit-btn"
            onClick={handleStartEdit}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '0.35rem 0.7rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color, rgba(150, 150, 150, 0.25))',
              backgroundColor: 'transparent',
              color: 'var(--text-color-light, #475569)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Editar mensaje personalizado"
            aria-label="Editar mensaje personalizado"
          >
            <PenLine size={13} />
            <span>Editar mensaje</span>
          </button>
        )}
      </div>

      {/* Bottom Row: Branding, Privacy & Copyright */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.78rem',
          color: 'var(--text-color-light, #64748b)',
          paddingTop: '0.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <strong style={{ color: 'var(--text-color, #0f172a)', fontWeight: 700 }}>Ressume</strong>
          <span>•</span>
          <span>Editor de Currículum ATS</span>
          <span>•</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={13} color="#10b981" /> 100% Privado en tu navegador
          </span>
        </div>

        <div>
          <span>© {new Date().getFullYear()} Ressume. Sin coste alguno por uso ni descarga.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
