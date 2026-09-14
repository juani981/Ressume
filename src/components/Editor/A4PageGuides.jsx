/**
 * A4PageGuides.jsx
 *
 * Renders visual A4 fold guides (representing the editor's 20px visual fold gap)
 * and margin boundary insets. Completely stripped during print via .no-print.
 */

import React from 'react';

/**
 * Visual indicators for A4 sheet boundaries and content margins in the live editor.
 *
 * @param {Object} props
 * @param {number} props.totalPages - Current estimated total pages
 * @param {number} [props.pagePadding=24] - Document page padding in pixels
 * @returns {React.ReactElement}
 */
export const A4PageGuides = ({ totalPages = 1, pagePadding = 24 }) => {
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
            top: `calc(${(i + 1) * 297}mm + ${i * 20}px)`,
            left: 0,
            right: 0,
            height: '20px',
            zIndex: 35,
            pointerEvents: 'none',
          }}>
          <div className="a4-page-fold-line" />
          <span className="a4-page-fold-badge">Página {i + 2}</span>
        </div>
      ))}

      {/* Visual Page Margin Insets — editor-only, no-print */}
      {Array.from({ length: totalPages }).map((_, i) => {
        const bottomInsetTop = `calc(${(i + 1) * 297}mm + ${i * 20}px - ${pagePaddingPx}px)`;
        const topInsetTop = `calc(${(i + 1) * 297}mm + ${i * 20 + 20}px)`;

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
