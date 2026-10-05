/**
 * @file useCVLayout.js
 * @description Hook managing layout configuration (1-col ATS vs 2-col), column DnD movement,
 * sticky pagination metrics, page folds, and singleton overlay states (tooltips and formatting toolbars).
 */
import { useState, useCallback } from 'react';
import { defaultSchema } from '../../utils/schema';
import {
  A4_PAGE_HEIGHT_PX,
  A4_HEIGHT_CSS,
  A4_GAP_PX,
} from '../../constants';

/**
 * Hook managing CV layout dimensions, pagination geometry, and floating overlays.
 * @param {Object} [options] - Configuration options.
 * @param {Object} [options.cvData] - Active CV state.
 * @param {function} [options.applyStateWithHistory] - History-aware state updater.
 * @returns {Object} Layout metrics, overlay singletons, and column manipulation methods.
 */
export const useCVLayout = ({ cvData, applyStateWithHistory } = {}) => {
  // AI Suggestions visibility
  const [showAITips, setShowAITips] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('cv_show_ai_tips') !== 'false';
  });

  const toggleAITips = useCallback(() => {
    setShowAITips(prev => {
      const next = !prev;
      try {
        localStorage.setItem('cv_show_ai_tips', String(next));
      } catch (_) {}
      return next;
    });
  }, []);

  // Physical A4 Page Metrics (Standard A4 is 297mm height; ~1123px at 96 DPI)
  const [pageHeightPx, setPageHeightPx] = useState(() => {
    if (typeof document !== 'undefined') {
      try {
        const ruler = document.createElement('div');
        ruler.style.height = A4_HEIGHT_CSS;
        ruler.style.position = 'absolute';
        ruler.style.visibility = 'hidden';
        ruler.style.top = '-9999px';
        document.body.appendChild(ruler);
        const h = ruler.offsetHeight;
        ruler.remove();
        if (h > 0) return h;
      } catch (_) {}
    }
    return A4_PAGE_HEIGHT_PX;
  });

  const pageGapPx = A4_GAP_PX; // A4 gap visual representation in live editor
  const [totalPages, setTotalPages] = useState(1);
  const [paginationTrigger, setPaginationTrigger] = useState(0);

  const triggerPaginationRecalc = useCallback(() => {
    setPaginationTrigger(prev => prev + 1);
  }, []);

  const getPageBounds = useCallback((pageNum) => {
    const p = Math.max(1, pageNum);
    const top = (p - 1) * (pageHeightPx + pageGapPx);
    const bottom = top + pageHeightPx;
    const foldTop = p * pageHeightPx + (p - 1) * pageGapPx;
    const foldBottom = foldTop + pageGapPx;
    const pagePadding = Number(cvData?.layout?.pagePadding ?? 24);
    const contentTop = top + pagePadding;
    const contentBottom = foldTop - pagePadding;
    return {
      top, bottom, foldTop, foldBottom, pageHeightPx, pageGapPx, pagePadding, contentTop, contentBottom
    };
  }, [pageHeightPx, pageGapPx, cvData?.layout?.pagePadding]);

  const getElementPageInfo = useCallback((elementOrBounds) => {
    let top = 0;
    let height = 0;
    if (elementOrBounds && typeof elementOrBounds === 'object') {
      if ('top' in elementOrBounds && 'height' in elementOrBounds) {
        top = elementOrBounds.top;
        height = elementOrBounds.height;
      } else if (typeof elementOrBounds.getBoundingClientRect === 'function') {
        const areaCv = document.getElementById('area-cv');
        const elRect = elementOrBounds.getBoundingClientRect();
        if (areaCv) {
          const areaRect = areaCv.getBoundingClientRect();
          top = elRect.top - areaRect.top;
        } else {
          top = elementOrBounds.offsetTop || 0;
        }
        height = elRect.height || elementOrBounds.offsetHeight || 0;
      }
    }
    const pageNum = Math.max(1, Math.floor(top / (pageHeightPx + pageGapPx)) + 1);
    const bounds = getPageBounds(pageNum);
    const remainingInPage = Math.max(0, bounds.contentBottom - (top + height));
    const isCrossingFold = (top < bounds.contentBottom) && ((top + height) > bounds.contentBottom);

    return {
      pageNum, top, height, bottom: top + height, foldTop: bounds.foldTop,
      contentTop: bounds.contentTop, contentBottom: bounds.contentBottom,
      remainingInPage, isCrossingFold
    };
  }, [pageHeightPx, pageGapPx, getPageBounds]);

  // Tooltip singleton
  const [activeTooltip, setActiveTooltip] = useState(null);
  const clearActiveTooltip = useCallback(() => setActiveTooltip(null), []);
  const closeTooltip = clearActiveTooltip;

  const toggleTooltipForSection = useCallback((section, rect) => {
    setActiveTooltip(current => {
      if (current && current.section && current.section.id === section.id) return null;
      return { section, rect };
    });
  }, []);

  // Toolbar singleton
  const [activeToolbar, setActiveToolbar] = useState(null);
  const clearActiveToolbar = useCallback(() => setActiveToolbar(null), []);

  // Layout updates
  const updateLayout = useCallback((key, value) => {
    if (typeof applyStateWithHistory !== 'function') return;
    applyStateWithHistory(prev => {
      const prevLayout = prev.layout || defaultSchema.layout;
      const updates = typeof key === 'object' && key !== null ? key : { [key]: value };
      return {
        ...prev,
        layout: { ...defaultSchema.layout, ...prevLayout, ...updates }
      };
    });
  }, [applyStateWithHistory]);

  const updateSectionColumn = useCallback((sectionId, newColumn) => {
    if (typeof applyStateWithHistory !== 'function') return;
    applyStateWithHistory(prev => ({
      ...prev,
      sections: prev.sections.map(sec => sec.id === sectionId ? { ...sec, column: newColumn } : sec)
    }));
  }, [applyStateWithHistory]);

  const moveSectionToColumnAndIndex = useCallback((activeSectionId, targetColumn, overSectionId = null, position = null) => {
    if (typeof applyStateWithHistory !== 'function') return;
    applyStateWithHistory(prev => {
      const activeSec = prev.sections.find(s => s.id === activeSectionId);
      if (!activeSec) return prev;

      if (overSectionId === activeSectionId && targetColumn === activeSec.column) {
        return prev;
      }

      const updatedSec = { ...activeSec, column: targetColumn };
      const remainingSections = prev.sections.filter(s => s.id !== activeSectionId);

      let insertIndex = -1;
      if (overSectionId && overSectionId !== activeSectionId) {
        const overIndexInRemaining = remainingSections.findIndex(s => s.id === overSectionId);
        if (overIndexInRemaining !== -1) {
          let shouldPlaceBelow = false;
          if (position === 'below' || position === 'after') {
            shouldPlaceBelow = true;
          } else if (position === 'above' || position === 'before') {
            shouldPlaceBelow = false;
          } else {
            const colSections = prev.sections.filter(s => s.column === targetColumn);
            const oldColIdx = colSections.findIndex(s => s.id === activeSectionId);
            const overColIdx = colSections.findIndex(s => s.id === overSectionId);
            if (oldColIdx !== -1 && overColIdx !== -1) {
              shouldPlaceBelow = oldColIdx < overColIdx;
            } else if (activeSec.column === targetColumn) {
              const oldIdx = prev.sections.findIndex(s => s.id === activeSectionId);
              const overIdx = prev.sections.findIndex(s => s.id === overSectionId);
              shouldPlaceBelow = oldIdx !== -1 && overIdx !== -1 && oldIdx < overIdx;
            } else {
              shouldPlaceBelow = false;
            }
          }

          insertIndex = shouldPlaceBelow ? overIndexInRemaining + 1 : overIndexInRemaining;
        }
      }

      if (insertIndex === -1) {
        const lastColIndex = remainingSections.reduce((lastIdx, s, idx) => s.column === targetColumn ? idx : lastIdx, -1);
        insertIndex = lastColIndex !== -1 ? lastColIndex + 1 : remainingSections.length;
      }

      const newSections = [...remainingSections];
      newSections.splice(insertIndex, 0, updatedSec);
      return { ...prev, sections: newSections };
    });
  }, [applyStateWithHistory]);

  return {
    showAITips, setShowAITips, toggleAITips,
    pageHeightPx, setPageHeightPx,
    pageGapPx,
    totalPages, setTotalPages,
    paginationTrigger, triggerPaginationRecalc,
    getPageBounds, getElementPageInfo,
    activeTooltip, setActiveTooltip, clearActiveTooltip, closeTooltip, toggleTooltipForSection,
    activeToolbar, setActiveToolbar, clearActiveToolbar,
    updateLayout, updateSectionColumn, moveSectionToColumnAndIndex
  };
};

export default useCVLayout;
