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
export const CVProvider = ({ children, initialCV = null, initialLanguage = null }) => {
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
    initialLanguage: initialLanguage || (initialCV && typeof initialCV === 'object' ? (initialCV.language || initialCV.layout?.language) : null),
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
    setCvData: data.setCvData,
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
    setActiveLanguage: data.setActiveLanguage,
    switchLanguage: data.switchLanguage,
    importLanguagePack: data.importLanguagePack,
    getActiveDictionary: data.getActiveDictionary,
    deletePage: data.deletePage,

    // History
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    recordHistoryTransition: history.recordHistoryTransition,

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
    setShowAITips: layout.setShowAITips,
    toggleAITips: layout.toggleAITips,

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

// ---------------------------------------------------------------------------
// Granular Domain Selectors (Phase 3 Interface Contract Hardening)
// ---------------------------------------------------------------------------

/**
 * Granular selector hook for layout mode and grid properties.
 */
export const useCVLayoutState = () => {
  const { cvData, updateLayout, updateSectionColumn, moveSectionToColumnAndIndex } = useCV();
  return { layout: cvData?.layout || {}, updateLayout, updateSectionColumn, moveSectionToColumnAndIndex };
};

/**
 * Granular selector hook for export actions (PDF, JSON) and toast alerts.
 */
export const useCVExportActions = () => {
  const { exportCleanPDF, exportJSON, isExporting, toast, showToast, hideToast } = useCV();
  return { exportCleanPDF, exportJSON, isExporting, toast, showToast, hideToast };
};

/**
 * Granular selector hook for discrete A4 pages state and pagination metrics.
 */
export const useCVPagesState = () => {
  const { totalPages, setTotalPages, pageHeightPx, setPageHeightPx, pageGapPx, getPageBounds, getElementPageInfo, deletePage } = useCV();
  return { totalPages, setTotalPages, pageHeightPx, setPageHeightPx, pageGapPx, getPageBounds, getElementPageInfo, deletePage };
};

/**
 * Granular selector hook for history undo/redo actions.
 */
export const useCVHistoryState = () => {
  const { undo, redo, canUndo, canRedo } = useCV();
  return { undo, redo, canUndo, canRedo };
};

/**
 * Granular selector hook for section and item content CRUD operations.
 */
export const useCVDataActions = () => {
  const {
    updateProfile,
    addSection,
    deleteSection,
    reorderSections,
    updateSectionTitle,
    updateSectionBulletStyle,
    updateSectionProperty,
    addSectionItem,
    deleteSectionItem,
    updateSectionItem,
    reorderSectionItems,
    moveItemBetweenSections,
    resetToDefault,
    restoreContactSection,
  } = useCV();
  return {
    updateProfile,
    addSection,
    deleteSection,
    reorderSections,
    updateSectionTitle,
    updateSectionBulletStyle,
    updateSectionProperty,
    addSectionItem,
    deleteSectionItem,
    updateSectionItem,
    reorderSectionItems,
    moveItemBetweenSections,
    resetToDefault,
    restoreContactSection,
  };
};

export { CVContext };
export default CVContext;

