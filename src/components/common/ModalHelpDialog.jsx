import React from 'react';
import { HelpCircle, X, CheckCircle2 } from 'lucide-react';
import { useTourManager, MODAL_HELP_CONTENT } from '../../context/TourContext';
import { useModalTheme } from '../../hooks/useModalTheme';

/**
 * ModalHelpDialog
 *
 * Renders an accessible, non-condescending, step-by-step help guide
 * for any active modal or panel. Adapts to dark/light mode seamlessly.
 */
export const ModalHelpDialog = () => {
  const { helpModalTourId, closeModalHelp } = useTourManager();
  const { isDark } = useModalTheme();

  if (!helpModalTourId) return null;

  const content = MODAL_HELP_CONTENT[helpModalTourId];
  if (!content) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-help-title"
      data-testid="modal-help-dialog"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 2500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModalHelp();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          color: isDark ? '#f8fafc' : '#0f172a',
          borderRadius: '16px',
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
            : '0 20px 40px rgba(0, 0, 0, 0.25)',
          border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isDark ? '#0b1324' : '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: isDark ? 'rgba(56, 116, 255, 0.2)' : 'rgba(56, 116, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3874ff',
              }}
            >
              <HelpCircle size={20} />
            </div>
            <div>
              <h3
                id="modal-help-title"
                style={{
                  margin: 0,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: isDark ? '#f8fafc' : '#0f172a',
                }}
              >
                {content.title}
              </h3>
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '0.8rem',
                  color: isDark ? '#94a3b8' : '#64748b',
                }}
              >
                {content.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModalHelp}
            aria-label="Cerrar guía de ayuda"
            data-testid="btn-close-modal-help"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isDark ? '#94a3b8' : '#64748b',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body / Steps */}
        <div
          style={{
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {content.steps.map((st) => (
            <div
              key={st.step}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: isDark ? '#1e293b' : '#e0e7ff',
                  color: isDark ? '#60a5fa' : '#3730a3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: '1px',
                }}
              >
                {st.step}
              </div>
              <div style={{ flex: 1 }}>
                <h4
                  style={{
                    margin: '0 0 4px 0',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: isDark ? '#f1f5f9' : '#1e293b',
                  }}
                >
                  {st.title}
                </h4>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.84rem',
                    lineHeight: 1.48,
                    color: isDark ? '#94a3b8' : '#475569',
                  }}
                >
                  {st.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            background: isDark ? '#0b1324' : '#f8fafc',
          }}
        >
          <button
            type="button"
            onClick={closeModalHelp}
            data-testid="btn-dismiss-modal-help"
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: '#3874ff',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CheckCircle2 size={16} /> Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalHelpDialog;
