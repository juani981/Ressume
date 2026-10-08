import React from 'react';

/**
 * Utility helper to build standardized, clean Joyride tour steps.
 * Designed for maximum modularity and ease of maintenance.
 * Uses React.createElement to ensure pure JS compatibility across bundlers.
 *
 * @param {Object} config
 * @param {string} config.target - CSS selector or 'body'
 * @param {string} config.title - Bold title of the step
 * @param {React.ReactNode|string} config.description - Explanatory body text or elements
 * @param {string} [config.placement='bottom'] - Tooltip placement ('top', 'bottom', 'left', 'right', 'center')
 * @param {boolean} [config.disableBeacon=true] - Disable flashing beacon
 * @returns {Object} Joyride step object
 */
export function createTourStep({
  target,
  title,
  description,
  placement = 'bottom',
  disableBeacon = true,
  ...rest
}) {
  return {
    target,
    placement,
    disableBeacon,
    disableOverlayClose: true,
    overlayClickAction: false,
    content: React.createElement(
      'div',
      { style: { textAlign: 'left' } },
      title
        ? React.createElement(
            'h4',
            {
              style: {
                margin: '0 0 6px 0',
                fontSize: '1rem',
                fontWeight: 700,
                color: '#0f172a',
              },
            },
            title
          )
        : null,
      React.createElement(
        'div',
        {
          style: {
            margin: 0,
            fontSize: '0.875rem',
            lineHeight: 1.45,
            color: '#475569',
          },
        },
        description
      )
    ),
    ...rest,
  };
}

/**
 * Safely expands and pins the ActionMenu navbar sidebar programmatically.
 * Idempotent: does not toggle or close if already expanded.
 */
export function openSidebarProgrammatically() {
  if (typeof document === 'undefined') return;

  const navbar = document.querySelector('[data-testid="action-menu-navbar"]');
  if (!navbar) return;

  const isExpanded =
    navbar.getAttribute('data-expanded') === 'true' ||
    navbar.classList.contains('is-expanded');

  if (!isExpanded) {
    const handle =
      navbar.querySelector('.action-menu-edge-handle') ||
      navbar.querySelector('[data-testid="action-menu-peek-tab"]') ||
      navbar;

    if (typeof handle.click === 'function') {
      handle.click();
    }
  }

  // Trigger window resize event after CSS animation finishes (~280ms)
  // so Joyride recalculates the target coordinates and spotlight
  setTimeout(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('resize'));
    }
  }, 320);
}

/**
 * Safely unpins and collapses the ActionMenu navbar sidebar programmatically.
 * Ensures the sidebar does not remain pinned by default when onboarding or tours end.
 */
export function closeSidebarProgrammatically() {
  if (typeof document === 'undefined') return;

  try {
    localStorage.setItem('action_menu_pinned', 'false');
  } catch {}

  const collapseBtn =
    document.querySelector('[data-testid="btn-collapse-action-menu"]') ||
    document.querySelector('.action-menu-collapse-btn');

  if (collapseBtn && typeof collapseBtn.click === 'function') {
    collapseBtn.click();
  } else {
    const pinBtn = document.querySelector('[data-testid="btn-pin-action-menu"]');
    if (pinBtn && pinBtn.classList.contains('is-pinned') && typeof pinBtn.click === 'function') {
      pinBtn.click();
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('unpin-action-menu'));
    window.dispatchEvent(new Event('resize'));
  }
}
