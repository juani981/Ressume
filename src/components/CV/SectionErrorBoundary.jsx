/**
 * src/components/CV/SectionErrorBoundary.jsx
 *
 * Tier 3 Section Error Boundary protecting individual CV section containers.
 * Allows other valid sections to render uninterrupted if one section throws an exception.
 * Adheres strictly to Rule 1 (Obsidian Callout Standard) and Rule 20 (Formal Editorial Tone).
 */

import React, { Component } from 'react';
import { OBSIDIAN_CALLOUT_COLORS } from '../../constants/colors';

export class SectionErrorBoundary extends Component {
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
    console.error(`[SectionErrorBoundary] Error en sección "${this.props.sectionId || 'desconocida'}":`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const danger = OBSIDIAN_CALLOUT_COLORS.danger;
      const { sectionTitle, sectionId } = this.props;

      return (
        <div
          role="alert"
          aria-live="polite"
          className="obsidian-callout no-print"
          data-testid={`section-error-${sectionId || 'unknown'}`}
          style={{
            margin: '0.75rem 0',
            backgroundColor: danger.bg,
            borderLeft: `4px solid ${danger.border}`,
            borderRadius: '6px',
            padding: '1rem',
          }}
        >
          <div
            className="callout-title"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: danger.titleColor,
              marginBottom: '0.5rem',
            }}
          >
            <span aria-hidden="true">{danger.icon}</span>
            <span>Error al representar la sección: {sectionTitle || sectionId || 'Personalizada'}</span>
          </div>

          <div
            className="callout-content"
            style={{
              fontSize: '0.8rem',
              lineHeight: 1.4,
              color: 'var(--text-color, #334155)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <p>
              Los datos de esta sección no pudieron representarse correctamente. El resto del documento se mantiene operativo.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={this.handleRetry}
                style={{
                  padding: '0.3rem 0.6rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SectionErrorBoundary;
