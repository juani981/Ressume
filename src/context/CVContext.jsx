/**
 * @file CVContext.jsx
 * @description Backward-compatible facade providing `useCV()` and `CVProvider` by
 * composing focused domain hooks (useCVHistory, useCVData, useCVLayout, useCVExport).
 * Strict constraint: <= 200 lines.
 */
import React, { createContext, useContext, useMemo, useState } from 'react';
import { useCVHistory } from './hooks/useCVHistory';
import { useCVData, loadInitialCVData } from './hooks/useCVData';
import { useCVLayout } from './hooks/useCVLayout';
import { useCVExport } from './hooks/useCVExport';

const CVContext = createContext();

/**
 * Hook to consume the unified CV context.
 * @returns {Object} Unified CV state and actions.
 */
export const useCV = () => useContext(CVContext);

/**
 * Main CV Context Provider component.
 * Composes useCVHistory, useCVData, useCVLayout, and useCVExport into a unified context value.
 * @param {Object} props - React props.
 * @param {React.ReactNode} props.children - Child components.
 * @returns {JSX.Element} Provider wrapping children.
 */
export const CVProvider = ({ children, initialCV = null }) => {
  // Shared CV document state holder
  const [cvData, setCvData] = useState(() => {
    if (initialCV) {
      const base = loadInitialCVData();
      const overrides = typeof initialCV === 'function' ? initialCV() : initialCV;
      return {
        ...base,
        ...overrides,
        layout: {
          ...(base.layout || {}),
          ...(overrides.layout || {})
        }
      };
    }
    return loadInitialCVData();
  });

  // 1. History stack & undo/redo engine
  const history = useCVHistory(setCvData);

  // 2. Core document data CRUD & translation
  const data = useCVData({
    cvData,
    setCvData,
    applyStateWithHistory: history.applyStateWithHistory,
    clearHistory: history.clearHistory,
  });

  // 3. Layout modes, column moves, sticky pagination, tooltips & toolbars
  const layout = useCVLayout({
    cvData,
    applyStateWithHistory: history.applyStateWithHistory,
  });

  // 4. Toast notifications and export pipelines
  const exportOps = useCVExport();

  // Unified public API contract (100% backward compatible with existing callers)
  const contextValue = useMemo(() => ({
    // Data & CRUD
    cvData: data.cvData,
    updateProfile: data.updateProfile,
    addSection: data.addSection,
    deleteSection: data.deleteSection,
    reorderSections: data.reorderSections,
    updateSectionTitle: data.updateSectionTitle,
    updateSectionBulletStyle: data.updateSectionBulletStyle,
    updateSectionProperty: data.updateSectionProperty,
    addSectionItem: data.addSectionItem,
    deleteSectionItem: data.deleteSectionItem,
    updateSectionItem: data.updateSectionItem,
    reorderSectionItems: data.reorderSectionItems,
    moveItemBetweenSections: data.moveItemBetweenSections,
    loadVersionSnapshot: data.loadVersionSnapshot,
    resetToDefault: data.resetToDefault,
    restoreContactSection: data.restoreContactSection,
    languagePacks: data.languagePacks,
    activeLanguage: data.activeLanguage,
    switchLanguage: data.switchLanguage,
    importLanguagePack: data.importLanguagePack,
    getActiveDictionary: data.getActiveDictionary,

    // History
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,

    // Layout & Pagination
    updateLayout: layout.updateLayout,
    updateSectionColumn: layout.updateSectionColumn,
    moveSectionToColumnAndIndex: layout.moveSectionToColumnAndIndex,
    pageHeightPx: layout.pageHeightPx,
    setPageHeightPx: layout.setPageHeightPx,
    pageGapPx: layout.pageGapPx,
    totalPages: layout.totalPages,
    setTotalPages: layout.setTotalPages,
    getPageBounds: layout.getPageBounds,
    getElementPageInfo: layout.getElementPageInfo,
    paginationTrigger: layout.paginationTrigger,
    triggerPaginationRecalc: layout.triggerPaginationRecalc,

    // Overlays & UI
    activeTooltip: layout.activeTooltip,
    setActiveTooltip: layout.setActiveTooltip,
    clearActiveTooltip: layout.clearActiveTooltip,
    closeTooltip: layout.closeTooltip,
    toggleTooltipForSection: layout.toggleTooltipForSection,
    activeToolbar: layout.activeToolbar,
    setActiveToolbar: layout.setActiveToolbar,
    clearActiveToolbar: layout.clearActiveToolbar,
    showAITips: layout.showAITips,

    // Export & Notifications
    toast: exportOps.toast,
    showToast: exportOps.showToast,
    hideToast: exportOps.hideToast,
    isExporting: exportOps.isExporting,
    exportCleanPDF: exportOps.exportCleanPDF,
    exportJSON: exportOps.exportJSON,
  }), [data, history, layout, exportOps]);

  return (
    <CVContext.Provider value={contextValue}>
      {children}
    </CVContext.Provider>
  );
};

export { CVContext };
export default CVContext;
