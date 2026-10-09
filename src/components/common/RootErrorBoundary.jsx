/**
 * src/components/common/RootErrorBoundary.jsx
 *
 * Tier 1 Root Error Boundary catching unhandled application exceptions.
 * Adheres strictly to Rule 1 (Obsidian Callout Standard) and Rule 20 (Formal Editorial Tone).
 */

import React, { Component } from 'react';
import { OBSIDIAN_CALLOUT_COLORS } from '../../constants/colors';

export class RootErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[RootErrorBoundary] Error no controlado capturado:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleDownloadBackup = () => {
    try {
      const data = localStorage.getItem('cvData') || localStorage.getItem('ressume_quarantined_snapshots') || '{}';
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ressume-respaldo-emergencia-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('[RootErrorBoundary] No fue posible generar la copia de seguridad:', e);
    }
  };

  handleResetToDefault = () => {
    try {
      localStorage.removeItem('cvData');
      window.location.reload();
    } catch (e) {
      console.error('[RootErrorBoundary] Error al restablecer datos:', e);
    }
  };

  render() {
    if (this.state.hasError) {
      const danger = OBSIDIAN_CALLOUT_COLORS.danger;

      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <div
            className="obsidian-callout"
            data-testid="root-error-callout"
            style={{
              maxWidth: '640px',
              width: '100%',
              backgroundColor: danger.bg,
              borderLeft: `4px solid ${danger.border}`,
              borderRadius: '8px',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div
              className="callout-title"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600,
                fontSize: '1.15rem',
                color: danger.titleColor,
                marginBottom: '1rem',
              }}
            >
              <span aria-hidden="true">{danger.icon}</span>
              <span>Interrupción imprevista en el editor</span>
            </div>

            <div
              className="callout-content"
              style={{
                fontSize: '0.92rem',
                lineHeight: 1.6,
                color: '#e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <p>
                Se ha producido un error durante el procesamiento de la interfaz. Para preservar la integridad del documento, se han dispuesto las siguientes opciones de recuperación:
              </p>

              {this.state.error?.message && (
                <pre
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    overflowX: 'auto',
                    color: '#fca5a5',
                    border: '1px solid rgba(233, 49, 71, 0.3)',
                  }}
                >
                  {this.state.error.message}
                </pre>
              )}

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginTop: '0.5rem',
                }}
              >
                <button
                  type="button"
                  onClick={this.handleRetry}
                  data-testid="btn-error-retry"
                  style={{
                    padding: '0.55rem 1rem',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Recuperar sesión y reintentar
                </button>

                <button
                  type="button"
                  onClick={this.handleDownloadBackup}
                  data-testid="btn-error-backup"
                  style={{
                    padding: '0.55rem 1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Descargar copia de seguridad
                </button>

                <button
                  type="button"
                  onClick={this.handleResetToDefault}
                  data-testid="btn-error-reset"
                  style={{
                    padding: '0.55rem 1rem',
                    backgroundColor: 'transparent',
                    color: '#f87171',
                    border: '1px solid #dc2626',
                    borderRadius: '6px',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Restablecer plantilla inicial segura
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RootErrorBoundary;
