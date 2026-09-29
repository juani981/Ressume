/**
 * A4PageGuides.jsx
 *
 * Renders visual A4 fold guides (representing the editor's 20px visual fold gap)
 * and margin boundary insets. Completely stripped during print via .no-print.
 */

import React from 'react';
import { Trash2 } from 'lucide-react';
import { EDITOR_PAGE_HEIGHT_MM, A4_GAP_PX } from '../../constants';

/**
 * Visual indicators for A4 sheet boundaries and content margins in the live editor.
 *
 * @param {Object} props
 * @param {number} props.totalPages - Current estimated total pages
 * @param {number} [props.pagePadding=24] - Document page padding in pixels
 * @param {Function} [props.onDeletePage] - Callback to delete a specific page
 * @returns {React.ReactElement}
 */
export const A4PageGuides = ({ totalPages = 1, pagePadding = 24, onDeletePage }) => {
  const pagePaddingPx = Number(pagePadding ?? 24);

  return (
    <>
      {/* Visual A4 Page Fold Guides (20px gap representation in live editor) */}
      {Array.from({ length: Math.max(0, totalPages - 1) }).map((_, i) => (
        <div
          key={`page-fold-${i}`}
          className="a4-page-fold-guide no-print"
          data-editor-ui="true"
          data-testid={`a4-page-fold-${i + 1}`}
          style={{
            position: 'absolute',
            top: `calc(${(i + 1) * EDITOR_PAGE_HEIGHT_MM}mm + ${i * A4_GAP_PX}px)`,
            left: 0,
            right: 0,
            height: `${A4_GAP_PX}px`,
            zIndex: 60,
            pointerEvents: 'auto',
          }}>
          <div className="a4-page-fold-line" />
          <span className="a4-page-fold-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', zIndex: 65, position: 'relative', pointerEvents: 'auto' }}>
            Página {i + 2}
            {typeof onDeletePage === 'function' && (
              <button
                type="button"
                className="a4-page-delete-btn"
                data-testid={`btn-delete-page-${i + 2}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePage(i + 2);
                }}
                title={`Eliminar página ${i + 2}`}
                style={{
                  position: 'relative',
                  zIndex: 70,
                  pointerEvents: 'auto',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
              >
                <Trash2 size={12} />
                Eliminar página
              </button>
            )}
          </span>
        </div>
      ))}

      {/* Visual Page Margin Insets — editor-only, no-print */}
      {Array.from({ length: totalPages }).map((_, i) => {
        const bottomInsetTop = `calc(${(i + 1) * EDITOR_PAGE_HEIGHT_MM}mm + ${i * A4_GAP_PX}px - ${pagePaddingPx}px)`;
        const topInsetTop = `calc(${(i + 1) * EDITOR_PAGE_HEIGHT_MM}mm + ${i * A4_GAP_PX + A4_GAP_PX}px)`;

        return (
          <React.Fragment key={`page-inset-${i}`}>
            {i < totalPages - 1 && (
              <div
                className="a4-page-inset a4-page-inset--bottom no-print"
                data-editor-ui="true"
                data-testid={`a4-page-inset-bottom-${i + 1}`}
                style={{
                  position: 'absolute',
                  top: bottomInsetTop,
                  left: 0,
                  right: 0,
                  height: `${pagePaddingPx}px`,
                  zIndex: 30,
                  pointerEvents: 'none',
                }}
              />
            )}
            {i < totalPages - 1 && (
              <div
                className="a4-page-inset a4-page-inset--top no-print"
                data-editor-ui="true"
                data-testid={`a4-page-inset-top-${i + 2}`}
                style={{
                  position: 'absolute',
                  top: topInsetTop,
                  left: 0,
                  right: 0,
                  height: `${pagePaddingPx}px`,
                  zIndex: 30,
                  pointerEvents: 'none',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

export default A4PageGuides;
