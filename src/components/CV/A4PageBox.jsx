/**
 * A4PageBox.jsx
 *
 * Renders an editor-native discrete A4 box container (.a4-page-box).
 * Invariant Rule 15 of AGENTS.md:
 * - Immutable physical dimensions: 210mm x 297mm, overflow: hidden.
 * - Paper box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) and bottom separation: margin: 0 auto 32px auto.
 * - Non-printing page badge ("Página N de M") in the corner (.no-print).
 * - 2-Column mode (is2Col): CSS grid with static linear-gradient background,
 *   rendering left column (.resume__left) and right column (.resume__right), each height: 100%; min-height: 100%.
 * - 1-Column / ATS mode (isAtsMode): background: #ffffff, padding: var(--page-padding, 24px),
 *   rendering .resume__single-column.
 */

import React from 'react';
import { A4_WIDTH_CSS, A4_HEIGHT_CSS, EDITOR_PAGE_HEIGHT_CSS } from '../../constants';

const flattenChildren = (children) => {
  const result = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && (child.type === React.Fragment || (child.props?.children && !child.props.className))) {
      result.push(...flattenChildren(child.props.children));
    } else if (child !== null && child !== undefined && typeof child !== 'boolean') {
      result.push(child);
    }
  });
  return result;
};

/**
 * Helper to check if children contain custom column elements (.resume__left or .resume__right)
 */
const hasCustomColumns = (children) => {
  return flattenChildren(children).some(
    (child) =>
      React.isValidElement(child) &&
      child.props?.className &&
      (child.props.className.includes('resume__left') ||
        child.props.className.includes('resume__right'))
  );
};

/**
 * Helper to check if children already include a single column element (.resume__single-column)
 */
const hasSingleColumn = (children) => {
  return flattenChildren(children).some(
    (child) =>
      React.isValidElement(child) &&
      child.props?.className &&
      child.props.className.includes('resume__single-column')
  );
};

/**
 * A4PageBox Component
 *
 * @param {Object} props
 * @param {number} [props.pageNumber=1] - 1-indexed page number
 * @param {number} [props.totalPages=1] - Total number of pages
 * @param {boolean} [props.is2Col=false] - Whether layout is in 2-column mode
 * @param {boolean} [props.isAtsMode=false] - Whether layout is in ATS / 1-column mode
 * @param {string} [props.leftBg='#f3f4f6'] - Background color for left column
 * @param {string} [props.rightBg='#ffffff'] - Background color for right column
 * @param {number|string} [props.leftColPercent=32] - Percentage width of left column
 * @param {string} [props.gridTemplateColumns] - CSS grid-template-columns value
 * @param {string} [props.pagePadding] - Padding for single-column / ATS mode
 * @param {React.ReactNode} [props.leftContent] - Content to place inside left column (.resume__left)
 * @param {React.ReactNode} [props.rightContent] - Content to place inside right column (.resume__right)
 * @param {React.ReactNode} [props.singleColumnContent] - Content for single column mode (.resume__single-column)
 * @param {React.ReactNode} [props.children] - Children elements
 * @param {string} [props.badgePosition='bottom-right'] - 'bottom-right' or 'top-right'
 * @param {boolean} [props.showBadge=true] - Whether to show the page badge
 * @param {string} [props.badgeText] - Custom badge text override
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {Object} [props.style] - Additional inline styles
 * @param {Object} [props.leftStyle] - Additional inline styles for left column
 * @param {Object} [props.rightStyle] - Additional inline styles for right column
 * @param {Object} [props.singleColumnStyle] - Additional inline styles for single column container
 */
export const A4PageBox = React.forwardRef(function A4PageBox(
  {
    pageNumber = 1,
    totalPages = 1,
    is2Col = false,
    isAtsMode = false,
    leftBg = '#f3f4f6',
    rightBg = '#ffffff',
    leftColPercent = 32,
    gridTemplateColumns,
    pagePadding,
    pageHeight = A4_HEIGHT_CSS,
    leftContent,
    rightContent,
    singleColumnContent,
    children,
    badgePosition = 'bottom-right',
    showBadge = true,
    badgeText,
    onDeletePage,
    className = '',
    style = {},
    leftStyle = {},
    rightStyle = {},
    singleColumnStyle = {},
    ...restProps
  },
  ref
) {
  // Effective mode: if isAtsMode is true, it forces 1-column layout
  const effective2Col = Boolean(is2Col && !isAtsMode);

  // Column background gradient for 2-column mode
  const normLeftColPercent = typeof leftColPercent === 'string' && leftColPercent.endsWith('%')
    ? leftColPercent
    : `${leftColPercent}%`;
  const gradientBackground = `linear-gradient(to right, ${leftBg} 0%, ${leftBg} ${normLeftColPercent}, ${rightBg} ${normLeftColPercent}, ${rightBg} 100%)`;

  // Grid columns template
  const effectiveGridColumns = gridTemplateColumns || 'var(--grid-template-columns, 1fr 2fr)';

  // Immutable physical A4 container dimensions
  const effectivePadding = pagePadding != null
    ? (typeof pagePadding === 'number' ? `${pagePadding}px` : pagePadding)
    : 'var(--page-padding, 24px)';

  // Effective height: defaults to standard A4 height (297mm), overridable by prop
  const effectiveHeight = pageHeight || A4_HEIGHT_CSS;

  // Container style adhering strictly to Rule 15 of AGENTS.md
  const containerStyle = {
    width: A4_WIDTH_CSS,
    minWidth: A4_WIDTH_CSS,
    maxWidth: A4_WIDTH_CSS,
    height: effectiveHeight,
    minHeight: effectiveHeight,
    maxHeight: effectiveHeight,
    overflow: 'hidden',
    boxSizing: 'border-box',
    position: 'relative',
    zIndex: 1,
    margin: '0 auto 32px auto',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    gridColumn: '1 / -1',
    ...(effective2Col
      ? {
          display: 'grid',
          gridTemplateColumns: effectiveGridColumns,
          gridTemplateRows: '1fr',
          alignItems: 'stretch',
          background: gradientBackground,
          padding: 0,
          gap: 0,
          columnGap: 0,
          rowGap: 0,
        }
      : {
          display: 'block',
          background: '#ffffff',
          padding: effectivePadding,
        }),
    ...style,
  };

  // Badge text: "Página N de M"
  const currentBadgeText = badgeText || `Página ${pageNumber} de ${totalPages}`;

  // Badge style for editor display
  const badgeStyle = {
    position: 'absolute',
    bottom: '12px',
    right: '16px',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    color: '#ffffff',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.05em',
    zIndex: 10,
    pointerEvents: 'none',
    userSelect: 'none',
    ...(badgePosition === 'top-right' ? { top: '12px', bottom: 'auto' } : {}),
    ...(!badgePosition.includes('top') && !badgePosition.includes('bottom') ? {} : {}),
  };

  // Render 2-column content
  const render2ColContent = () => {
    if (leftContent !== undefined || rightContent !== undefined) {
      return (
        <>
          <div
            className="resume__left"
            style={{
              height: '100%',
              minHeight: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              maxWidth: '100%',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              padding: effectivePadding,
              ...leftStyle,
            }}
          >
            {leftContent}
          </div>
          <div
            className="resume__right"
            style={{
              height: '100%',
              minHeight: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              maxWidth: '100%',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              padding: effectivePadding,
              ...rightStyle,
            }}
          >
            {rightContent}
          </div>
        </>
      );
    }

    if (children) {
      if (hasCustomColumns(children)) {
        return children;
      }

      if (Array.isArray(children) && children.length === 2) {
        return (
          <>
            <div
              className="resume__left"
              style={{
                height: '100%',
                minHeight: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                maxWidth: '100%',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                padding: effectivePadding,
                ...leftStyle,
              }}
            >
              {children[0]}
            </div>
            <div
              className="resume__right"
              style={{
                height: '100%',
                minHeight: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                maxWidth: '100%',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                padding: effectivePadding,
                ...rightStyle,
              }}
            >
              {children[1]}
            </div>
          </>
        );
      }

      return (
        <>
          <div
            className="resume__left"
            style={{
              height: '100%',
              minHeight: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              maxWidth: '100%',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              ...leftStyle,
            }}
          >
            {children}
          </div>
          <div
            className="resume__right"
            style={{
              height: '100%',
              minHeight: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              maxWidth: '100%',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              ...rightStyle,
            }}
          />
        </>
      );
    }

    return (
      <>
        <div
          className="resume__left"
          style={{
            height: '100%',
            minHeight: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            maxWidth: '100%',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            ...leftStyle,
          }}
        />
        <div
          className="resume__right"
          style={{
            height: '100%',
            minHeight: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            maxWidth: '100%',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            ...rightStyle,
          }}
        />
      </>
    );
  };

  // Render 1-column / ATS content
  const render1ColContent = () => {
    if (children && hasSingleColumn(children)) {
      return children;
    }

    return (
      <div
        className="resume__single-column"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          ...singleColumnStyle,
        }}
      >
        {singleColumnContent !== undefined ? singleColumnContent : children}
      </div>
    );
  };

  const classNames = [
    'a4-page-box',
    effective2Col ? 'bd-grid' : 'resume__single-column-page',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={ref}
      className={classNames}
      data-page-number={pageNumber}
      data-total-pages={totalPages}
      data-testid={`a4-page-box-${pageNumber}`}
      style={containerStyle}
      {...restProps}
    >
      {effective2Col ? render2ColContent() : render1ColContent()}

      {showBadge && (
        <div
          className="a4-page-badge no-print"
          data-editor-ui="true"
          style={{
            ...badgeStyle,
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>{currentBadgeText}</span>
          {pageNumber > 1 && typeof onDeletePage === 'function' && (
            <button
              type="button"
              className="page-delete-btn"
              data-editor-ui="true"
              style={{
                background: 'rgba(239, 68, 68, 0.85)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '10px',
                cursor: 'pointer',
                lineHeight: 1,
              }}
              title={`Eliminar página ${pageNumber}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDeletePage(pageNumber);
              }}
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default A4PageBox;
