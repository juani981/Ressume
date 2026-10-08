import React, { createContext, useContext } from 'react';

/**
 * DndStatusContext
 * Ambient context providing live drag status (active item/section)
 * and the ID of the element that just finished dropping (for smooth settle animation).
 */
export const DndStatusContext = createContext({
  activeDragItem: null,
  activeDragSection: null,
  justDroppedId: null,
});

export const useDndStatus = () => useContext(DndStatusContext);

export default DndStatusContext;
