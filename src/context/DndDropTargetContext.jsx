import React, { createContext, useContext } from 'react';

/**
 * DndDropTargetContext
 *
 * Ambient React context providing the active drop target indicator ('sombra')
 * during drag-and-drop operations, avoiding prop drilling through document pages,
 * columns, sections, and items.
 */
export const DndDropTargetContext = createContext(null);

/**
 * Hook to consume the active DnD drop target.
 * @returns {{
 *   type: 'section' | 'item',
 *   activeSectionId?: string,
 *   activeItemId?: string,
 *   targetSectionId?: string,
 *   targetItemId?: string,
 *   targetColumn?: string,
 *   position: 'above' | 'below' | 'end'
 * } | null}
 */
export const useDndDropTarget = () => useContext(DndDropTargetContext);

export default DndDropTargetContext;
