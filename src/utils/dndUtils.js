/**
 * Utility helpers for forgiving and ergonomic Drag-and-Drop interactions (@dnd-kit).
 * Enables dragging anywhere on non-text areas of the hovered container (section, item, or bullet),
 * while cleanly preserving text editing, text selection, and button/link clicks.
 */

export const NON_DRAGGABLE_SELECTORS = Object.freeze([
  'input',
  'textarea',
  'select',
  'button',
  'a',
  '[contenteditable="true"]',
  '[data-editor-ui="true"]',
  '[data-editor-add="true"]',
  '.inline-input',
  '.inline-edit-active',
  '.inline-edit-display',
  '.contact-item-pill',
  '.social__link',
  '.social__icon',
  '.rich-text-toolbar',
  '.section-action-buttons',
  '.section-tips-toggle-btn',
  '.section-bullet-style-btn',
  '.round-btn-del',
  '.round-btn-add',
  '.add-bullet-btn',
  '.add-section-btn',
  '.add-contact-btn',
  '.bullet-del-btn',
  '.section-del-btn',
  '.item-del-btn',
  '.contact-del-btn',
  '.page-delete-btn',
  '.column-resizer',
  '.column-resizer-bar',
  '.column-resizer-handle',
  '.spacer-resize-handle',
  '.spacer-controls-bar',
  '.spacer-del-btn',
  '.popover',
  '.suggestion-tooltip',
  '.obsidian-callout',
  '.contact-type-picker',
  '.cv-photo-controls-floating'
]);

const NON_DRAGGABLE_QUERY = NON_DRAGGABLE_SELECTORS.join(', ');

/**
 * Checks if the pointer event target is an interactive element or text-editing element
 * where drag initiation must be prevented.
 *
 * @param {EventTarget|null} target
 * @returns {boolean} true if drag should be prevented, false if drag is allowed
 */
export const isNonDraggableTarget = (rawTarget) => {
  if (!rawTarget) return false;

  // Normalize text node (nodeType === 3) or non-element to its parent element
  const target = rawTarget.nodeType === 1 ? rawTarget : rawTarget.parentElement;
  if (!target || typeof target.closest !== 'function') return false;

  // 1. If clicking explicitly on any drag handle icon, ALWAYS allow drag
  if (target.closest('.drag-handle')) {
    return false;
  }

  // 2. Interactive buttons, links, inputs, and editing controls
  const isInteractive = target.closest(NON_DRAGGABLE_QUERY);

  if (isInteractive) {
    return true;
  }

  return false;
};

/**
 * Creates wrapped synthetic listeners for a draggable/sortable container
 * that allows dragging anywhere in non-text areas while stopping propagation
 * to parent containers when shouldStopPropagation is true.
 *
 * @param {Object} listeners dnd-kit listeners
 * @param {boolean} shouldStopPropagation whether to call e.stopPropagation()
 * @returns {Object} wrapped listeners
 */
export const createContainerDragListeners = (listeners, shouldStopPropagation = false) => {
  if (!listeners) return {};

  return {
    ...listeners,
    onPointerDown: (e) => {
      if (isNonDraggableTarget(e.target)) {
        return;
      }
      if (shouldStopPropagation) {
        e.stopPropagation();
      }
      listeners.onPointerDown?.(e);
    },
    onKeyDown: (e) => {
      if (isNonDraggableTarget(e.target)) {
        return;
      }
      listeners.onKeyDown?.(e);
    }
  };
};
