import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  createPageModel,
  isValidPageModel,
  PAGE_MODEL_KEYS,
  deepFreeze,
} from '../utils/pageModelTypes';
import { validateSnapshotContract } from '../services/print/printExecutionDriver';
import {
  CVProvider,
  useCV,
  useCVLayoutState,
  useCVExportActions,
  useCVPagesState,
  useCVHistoryState,
  useCVDataActions,
} from '../context';

describe('Phase 3: Interface Contracts & Granular Selectors', () => {
  describe('1. PageModel & Document Contracts (pageModelTypes.js)', () => {
    it('creates a frozen PageModel instance complying with canonical keys', () => {
      const page = createPageModel({
        pageNumber: 1,
        totalPages: 2,
        isLastPage: false,
        leftSections: [{ id: 's1', type: 'experience', title: 'Exp', column: 'left', items: [] }],
        rightSections: [{ id: 's2', type: 'education', title: 'Edu', column: 'right', items: [] }],
        singleSections: [],
      });

      expect(page.pageNumber).toBe(1);
      expect(page.totalPages).toBe(2);
      expect(page.isLastPage).toBe(false);
      expect(page.leftSections).toHaveLength(1);
      expect(page.rightSections).toHaveLength(1);
      expect(page.singleSections).toHaveLength(0);

      PAGE_MODEL_KEYS.forEach((key) => {
        expect(page).toHaveProperty(key);
      });

      expect(Object.isFrozen(page)).toBe(true);
      expect(Object.isFrozen(page.leftSections)).toBe(true);
      expect(Object.isFrozen(page.rightSections)).toBe(true);
      expect(isValidPageModel(page)).toBe(true);
    });

    it('rejects candidate objects violating PageModel contract', () => {
      expect(isValidPageModel(null)).toBe(false);
      expect(isValidPageModel(undefined)).toBe(false);
      expect(isValidPageModel({})).toBe(false);
      expect(isValidPageModel({ pageNumber: 0, totalPages: 1 })).toBe(false);
      expect(isValidPageModel({ pageNumber: 2, totalPages: 1 })).toBe(false);
      expect(isValidPageModel({ pageNumber: 1, totalPages: 1, isLastPage: 'not-bool' })).toBe(false);
    });

    it('deeply freezes nested data structures without mutation', () => {
      const data = {
        meta: { nested: { count: 42 } },
        list: [{ name: 'item1' }],
      };
      deepFreeze(data);
      expect(Object.isFrozen(data)).toBe(true);
      expect(Object.isFrozen(data.meta)).toBe(true);
      expect(Object.isFrozen(data.meta.nested)).toBe(true);
      expect(Object.isFrozen(data.list)).toBe(true);
      expect(Object.isFrozen(data.list[0])).toBe(true);
    });
  });

  describe('2. Print Service Snapshot Contract (printExecutionDriver.js)', () => {
    it('validates and normalizes valid editor snapshots', () => {
      const validCandidate = {
        width: 794,
        totalPages: 2,
        pages: [{ pageNumber: 1 }, { pageNumber: 2 }],
        layout: { type: '2-column' },
        breaks: [100, 200],
      };

      const validated = validateSnapshotContract(validCandidate);
      expect(validated).not.toBeNull();
      expect(validated.width).toBe(794);
      expect(validated.totalPages).toBe(2);
      expect(validated.breaks).toEqual([100, 200]);
    });

    it('defaults totalPages to 1 when missing or non-positive', () => {
      const candidate = { width: 794, totalPages: -5 };
      const validated = validateSnapshotContract(candidate);
      expect(validated.totalPages).toBe(1);
    });

    it('returns null for null or primitive candidates', () => {
      expect(validateSnapshotContract(null)).toBeNull();
      expect(validateSnapshotContract(undefined)).toBeNull();
      expect(validateSnapshotContract('string')).toBeNull();
      expect(validateSnapshotContract(123)).toBeNull();
    });
  });

  describe('3. Granular Context Selectors (CVContext)', () => {
    const wrapper = ({ children }) => <CVProvider>{children}</CVProvider>;

    it('useCVLayoutState provides layout configuration and layout modifiers', () => {
      const { result } = renderHook(() => useCVLayoutState(), { wrapper });
      expect(result.current).toHaveProperty('layout');
      expect(typeof result.current.updateLayout).toBe('function');
      expect(typeof result.current.updateSectionColumn).toBe('function');
      expect(typeof result.current.moveSectionToColumnAndIndex).toBe('function');
    });

    it('useCVExportActions provides export handlers and toast states', () => {
      const { result } = renderHook(() => useCVExportActions(), { wrapper });
      expect(typeof result.current.exportCleanPDF).toBe('function');
      expect(typeof result.current.exportJSON).toBe('function');
      expect(typeof result.current.isExporting).toBe('boolean');
      expect(typeof result.current.showToast).toBe('function');
      expect(typeof result.current.hideToast).toBe('function');
    });

    it('useCVPagesState provides discrete pagination metrics and page management', () => {
      const { result } = renderHook(() => useCVPagesState(), { wrapper });
      expect(typeof result.current.totalPages).toBe('number');
      expect(typeof result.current.setTotalPages).toBe('function');
      expect(typeof result.current.deletePage).toBe('function');
      expect(typeof result.current.getPageBounds).toBe('function');
    });

    it('useCVHistoryState provides undo/redo capability flags and dispatchers', () => {
      const { result } = renderHook(() => useCVHistoryState(), { wrapper });
      expect(typeof result.current.undo).toBe('function');
      expect(typeof result.current.redo).toBe('function');
      expect(typeof result.current.canUndo).toBe('boolean');
      expect(typeof result.current.canRedo).toBe('boolean');
    });

    it('useCVDataActions provides section/item CRUD actions', () => {
      const { result } = renderHook(() => useCVDataActions(), { wrapper });
      expect(typeof result.current.updateProfile).toBe('function');
      expect(typeof result.current.addSection).toBe('function');
      expect(typeof result.current.deleteSection).toBe('function');
      expect(typeof result.current.reorderSections).toBe('function');
      expect(typeof result.current.addSectionItem).toBe('function');
      expect(typeof result.current.deleteSectionItem).toBe('function');
      expect(typeof result.current.updateSectionItem).toBe('function');
    });
  });
});
