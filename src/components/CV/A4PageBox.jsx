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
import {
  A4_WIDTH_CSS,
  A4_HEIGHT_CSS,
  EDITOR_PAGE_HEIGHT_CSS,
  DEFAULT_PAGE_PADDING_PX,
  DEFAULT_LEFT_COLUMN_WIDTH_PERCENT,
  DEFAULT_GRID_TEMPLATE_COLUMNS,
  EDITOR_PAGE_GAP_PX,
  BASE_COLUMN_STYLE,
  COLOR_TOKENS,
  PAGE_BOTTOM_CLEARANCE_PX,
} from '../../constants';

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
    leftBg = COLOR_TOKENS.containerLight,
    rightBg = COLOR_TOKENS.containerWhite,
    leftColPercent = DEFAULT_LEFT_COLUMN_WIDTH_PERCENT,
    gridTemplateColumns,
    pagePadding,
    pageBottomClearance,
    pageHeight = A4_HEIGHT_CSS,
    leftContent,
    rightContent,
    singleColumnContent,
    children,
    badgePosition = 'gap',
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
  const effectiveGridColumns = gridTemplateColumns || `var(--grid-template-columns, ${DEFAULT_GRID_TEMPLATE_COLUMNS})`;

  // Immutable physical A4 container dimensions:
  // TOP, RIGHT, LEFT take user slider padding; BOTTOM takes 1/2 of slider padding
  let effectivePadding;
  if (pagePadding != null) {
    if (typeof pagePadding === 'number') {
      const bPad = Math.round(pagePadding / 2);
      effectivePadding = `${pagePadding}px ${pagePadding}px ${bPad}px ${pagePadding}px`;
    } else if (typeof pagePadding === 'string' && pagePadding.includes('px')) {
      const num = parseInt(pagePadding, 10);
      const bPad = Math.round(num / 2);
      effectivePadding = `${num}px ${num}px ${bPad}px ${num}px`;
    } else {
      effectivePadding = pagePadding;
    }
  } else {
    effectivePadding = `var(--page-padding, ${DEFAULT_PAGE_PADDING_PX}px) var(--page-padding, ${DEFAULT_PAGE_PADDING_PX}px) var(--page-padding-bottom, calc(${DEFAULT_PAGE_PADDING_PX}px / 2)) var(--page-padding, ${DEFAULT_PAGE_PADDING_PX}px)`;
  }

  // Safety margin calculation for live boundary visualization
  const paddingNum = pagePadding != null ? parseInt(pagePadding, 10) : DEFAULT_PAGE_PADDING_PX;
  const bottomPaddingNum = isAtsMode ? Math.round(paddingNum / 2) : paddingNum;
  const clearanceNum = typeof pageBottomClearance === 'number' ? pageBottomClearance : PAGE_BOTTOM_CLEARANCE_PX;
  const safetyMarginPx = bottomPaddingNum + clearanceNum;

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
    margin: `0 auto ${EDITOR_PAGE_GAP_PX}px auto`,
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
          background: COLOR_TOKENS.containerWhite,
          padding: effectivePadding,
        }),
    ...style,
  };

  // Badge text: "Página N de M"
  const currentBadgeText = badgeText || `Página ${pageNumber} de ${totalPages}`;

  // Badge style for editor display - positioned in the inter-page gap by default
  const badgeStyle = {
    position: 'absolute',
    right: '16px',
    backgroundColor: COLOR_TOKENS.badgeBg,
    color: COLOR_TOKENS.badgeText,
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.05em',
    zIndex: 50,
    pointerEvents: 'none',
    userSelect: 'none',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
    ...(badgePosition === 'top-right'
      ? { top: '12px', bottom: 'auto' }
      : badgePosition === 'bottom-right'
      ? { bottom: '12px', top: 'auto' }
      : { bottom: '5px', top: 'auto' }),
  };

  // Render 2-column content
  const render2ColContent = () => {
    if (children && hasCustomColumns(children)) {
      return children;
    }

    let left = leftContent;
    let right = rightContent;
    let applyPadding = true;

    if (left === undefined && right === undefined) {
      if (children) {
        if (Array.isArray(children) && children.length === 2) {
          left = children[0];
          right = children[1];
        } else {
          left = children;
          right = null;
          applyPadding = false;
        }
      } else {
        left = null;
        right = null;
        applyPadding = false;
      }
    }

    const columnPadding = applyPadding ? effectivePadding : undefined;

    return (
      <>
        <div
          className="resume__left"
          style={{
            ...BASE_COLUMN_STYLE,
            ...(columnPadding ? { padding: columnPadding } : {}),
            ...leftStyle,
          }}
        >
          {left}
        </div>
        <div
          className="resume__right"
          style={{
            ...BASE_COLUMN_STYLE,
            ...(columnPadding ? { padding: columnPadding } : {}),
            ...rightStyle,
          }}
        >
          {right}
        </div>
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
      className="a4-page-wrapper"
      data-page-wrapper={pageNumber}
      style={{
        position: 'relative',
        width: A4_WIDTH_CSS,
        margin: '0 auto',
      }}
    >
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

        {/* Línea roja de debug momentáneo para calibrar el margen de seguridad */}
        <div
          className="debug-safety-margin-line no-print"
          data-editor-ui="true"
          aria-hidden="true"
          data-testid={`debug-safety-margin-${pageNumber}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: `${safetyMarginPx}px`,
            height: 0,
            borderTop: '2px dashed #ef4444',
            zIndex: 9999,
            pointerEvents: 'none',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'monospace',
              fontWeight: 700,
              color: '#dc2626',
              backgroundColor: 'rgba(254, 226, 226, 0.95)',
              border: '1px solid #ef4444',
              borderRadius: '3px',
              padding: '1px 6px',
              marginBottom: '2px',
              marginRight: '12px',
              pointerEvents: 'none',
              userSelect: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            Margen de seguridad: {safetyMarginPx}px (clearance: {clearanceNum}px + base: {bottomPaddingNum}px)
          </span>
        </div>
      </div>

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
                background: COLOR_TOKENS.deleteBtnBg,
                color: COLOR_TOKENS.deleteBtnText,
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
