import React, { createContext, useContext } from 'react';

/**
 * PrintModeContext
 * 
 * Provides global ambient print-mode status without requiring
 * `isPrint` prop-drilling through BaseSection -> BaseItem -> concrete ItemComponents.
 */
export const PrintModeContext = createContext(false);

/**
 * Hook to read current print mode.
 * @returns {boolean}
 */
export const usePrintMode = () => useContext(PrintModeContext);

export default PrintModeContext;
