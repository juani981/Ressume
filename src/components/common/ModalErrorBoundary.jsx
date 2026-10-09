/**
 * src/components/common/ModalErrorBoundary.jsx
 *
 * Tier 2 Modal Error Boundary protecting individual dialog containers from crashing the editor.
 * Adheres strictly to Rule 1 (Obsidian Callout Standard) and Rule 20 (Formal Editorial Tone).
 */

import React, { Component } from 'react';
import { OBSIDIAN_CALLOUT_COLORS } from '../../constants/colors';

export class ModalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ModalErrorBoundary] Error dentro de modal:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const danger = OBSIDIAN_CALLOUT_COLORS.danger;
      const { onClose, modalName = 'diálogo' } = this.props;

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="obsidian-callout"
          data-testid="modal-error-callout"
          style={{
            margin: '1.5rem',
            backgroundColor: danger.bg,
            borderLeft: `4px solid ${danger.border}`,
            borderRadius: '8px',
            padding: '1.25rem',
          }}
        >
          <div
            className="callout-title"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              fontSize: '1rem',
              color: danger.titleColor,
              marginBottom: '0.75rem',
            }}
          >
            <span aria-hidden="true">{danger.icon}</span>
            <span>Error al cargar el contenido del {modalName}</span>
          </div>

          <div
            className="callout-content"
            style={{
              fontSize: '0.88rem',
              lineHeight: 1.5,
              color: '#334155',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <p>
              Ocurrió un problema durante el procesamiento interno de este componente. Puede reintentar la acción o cerrar la ventana.
            </p>

            {this.state.error?.message && (
              <pre
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  overflowX: 'auto',
                  color: '#b91c1c',
                }}
              >
                {this.state.error.message}
              </pre>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                onClick={this.handleRetry}
                data-testid="btn-modal-error-retry"
                style={{
                  padding: '0.45rem 0.85rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '5px',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Reintentar
              </button>

              {typeof onClose === 'function' && (
                <button
                  type="button"
                  onClick={onClose}
                  data-testid="btn-modal-error-close"
                  style={{
                    padding: '0.45rem 0.85rem',
                    backgroundColor: '#e2e8f0',
                    color: '#334155',
                    border: 'none',
                    borderRadius: '5px',
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Cerrar ventana
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ModalErrorBoundary;
