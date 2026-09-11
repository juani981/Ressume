/**
 * @file cvContextDecomposition.test.jsx
 * Unit tests verifying CVContext decomposition into 4 domain hooks,
 * barrel exports, and full 48-member public API contract preservation.
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';

// Facade import
import { CVContext, CVProvider, useCV } from '../context/CVContext';

// Root barrel import
import RootCVContext, {
  CVContext as BarrelCVContext,
  CVProvider as BarrelCVProvider,
  useCV as barrelUseCV,
  useCVHistory,
  useCVData,
  useCVLayout,
  useCVExport
} from '../context/index';

// Hooks barrel import
import {
  useCVHistory as HooksHistory,
  useCVData as HooksData,
  useCVLayout as HooksLayout,
  useCVExport as HooksExport,
  ensureProfileHeader,
  loadInitialCVData,
  baseDefaultContent
} from '../context/hooks/index';

describe('CVContext Decomposition Architecture', () => {
  describe('1. Barrel Exports & Re-export Integrity', () => {
    it('verifies root context/index.js exports all primary components and hooks', () => {
      expect(RootCVContext).toBeDefined();
      expect(BarrelCVContext).toBe(CVContext);
      expect(BarrelCVProvider).toBe(CVProvider);
      expect(barrelUseCV).toBe(useCV);
      expect(useCVHistory).toBe(HooksHistory);
      expect(useCVData).toBe(HooksData);
      expect(useCVLayout).toBe(HooksLayout);
      expect(useCVExport).toBe(HooksExport);
    });

    it('verifies context/hooks/index.js exports all 4 domain hooks and data utilities', () => {
      expect(typeof HooksHistory).toBe('function');
      expect(typeof HooksData).toBe('function');
      expect(typeof HooksLayout).toBe('function');
      expect(typeof HooksExport).toBe('function');
      expect(typeof ensureProfileHeader).toBe('function');
      expect(typeof loadInitialCVData).toBe('function');
      expect(baseDefaultContent).toBeDefined();
      expect(baseDefaultContent.es).toBeDefined();
      expect(baseDefaultContent.en).toBeDefined();
    });
  });

  describe('2. Public API Contract (48+ Members in useCV)', () => {
    const requiredMembers = [
      // Data & CRUD (21)
      'cvData', 'updateProfile', 'updateSectionProperty', 'updateSectionTitle',
      'updateSectionBulletStyle', 'updateSectionItem', 'addSectionItem',
      'deleteSectionItem', 'reorderSectionItems', 'moveItemBetweenSections',
      'addSection', 'deleteSection', 'reorderSections', 'loadVersionSnapshot',
      'resetToDefault', 'restoreContactSection', 'languagePacks', 'activeLanguage',
      'switchLanguage', 'importLanguagePack', 'getActiveDictionary',
      // History (4)
      'undo', 'redo', 'canUndo', 'canRedo',
      // Layout & Pagination (21)
      'updateLayout', 'updateSectionColumn', 'moveSectionToColumnAndIndex',
      'pageHeightPx', 'setPageHeightPx', 'pageGapPx', 'totalPages', 'setTotalPages',
      'getPageBounds', 'getElementPageInfo', 'paginationTrigger',
      'triggerPaginationRecalc', 'activeTooltip', 'setActiveTooltip',
      'clearActiveTooltip', 'closeTooltip', 'toggleTooltipForSection',
      'activeToolbar', 'setActiveToolbar', 'clearActiveToolbar', 'showAITips',
      // Export & Toasts (6)
      'toast', 'showToast', 'hideToast', 'isExporting', 'exportCleanPDF', 'exportJSON'
    ];

    it('ensures all required public API members exist on useCV() result', () => {
      const wrapper = ({ children }) => <CVProvider>{children}</CVProvider>;
      const { result } = renderHook(() => useCV(), { wrapper });

      for (const member of requiredMembers) {
        expect(result.current[member], `Expected useCV() to provide member: ${member}`).toBeDefined();
      }
    });
  });

  describe('3. Isolated Domain Hook Behavior', () => {
    it('useCVHistory manages undo/redo stacks correctly', () => {
      let mockState = { count: 0 };
      const setMockState = (updater) => {
        mockState = typeof updater === 'function' ? updater(mockState) : updater;
      };

      const { result } = renderHook(() => useCVHistory(setMockState));
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);

      act(() => {
        result.current.applyStateWithHistory({ count: 1 });
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);

      act(() => {
        result.current.undo();
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });

    it('useCVExport manages toast show and hide correctly', () => {
      const { result } = renderHook(() => useCVExport());
      expect(result.current.toast).toBeNull();

      act(() => {
        result.current.showToast('Test Toast', 'success', 0);
      });

      expect(result.current.toast).toEqual(expect.objectContaining({
        text: 'Test Toast',
        type: 'success'
      }));

      act(() => {
        result.current.hideToast();
      });

      expect(result.current.toast).toBeNull();
    });

    it('useCVLayout calculates page bounds reliably', () => {
      const { result } = renderHook(() => useCVLayout());
      const bounds = result.current.getPageBounds(1);

      expect(bounds.top).toBe(0);
      expect(bounds.bottom).toBeGreaterThan(0);
      expect(bounds.pageGapPx).toBe(20);
    });
  });
});
