import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';

import {
  normalizeHex,
  calculateYIQ,
  getContrastYIQ,
  isDarkColor,
  adjustColor,
  validateHexColor,
  getDynamicTextColors,
  getDynamicTextVariables,
} from '../utils/colorUtils';

import {
  A4_PAGE_HEIGHT_PX,
  A4_WIDTH_PX,
  A4_GAP_PX,
  DEFAULT_PAGE_PADDING,
  getRulerHeightPx,
  getRelativeBounds,
  getForbiddenZone,
  isInForbiddenBoundaryZone,
} from '../utils/pageGeometry';

import {
  FONT_FAMILIES,
  DEFAULT_FONT_FAMILY,
  getFontFamilyStack,
  computeTypographyTokens,
  applyTypographyTokens,
} from '../utils/typographyUtils';

import { resetForcedPageBreaks } from '../utils/pageDeletionEngine';

import { useDocumentPages } from '../hooks/useDocumentPages';
import { useCVDndCoordinator } from '../hooks/useCVDndCoordinator';
import { useColumnResizer } from '../hooks/useColumnResizer';

describe('Milestone M2: Modularization and Utility Deduplication', () => {
  describe('colorUtils.js', () => {
    it('normalizes 3-char, 6-char, hash and non-hash hex strings', () => {
      expect(normalizeHex('#fff')).toBe('ffffff');
      expect(normalizeHex('abc')).toBe('aabbcc');
      expect(normalizeHex('#123456')).toBe('123456');
      expect(normalizeHex('123456')).toBe('123456');
      expect(normalizeHex(null)).toBe('ffffff');
      expect(normalizeHex('not-a-hex')).toBe('ffffff');
    });

    it('calculates YIQ contrast and returns dark/light', () => {
      expect(calculateYIQ('#ffffff')).toBe(255);
      expect(calculateYIQ('#000000')).toBe(0);
      expect(getContrastYIQ('#000000')).toBe('dark');
      expect(getContrastYIQ('#ffffff')).toBe('light');
      expect(isDarkColor('#111111')).toBe(true);
      expect(isDarkColor('#f3f4f6')).toBe(false);
    });

    it('adjusts color brightness up and down', () => {
      const darkened = adjustColor('#888888', -40);
      expect(darkened).toMatch(/^#[0-9a-f]{6}$/i);
      const lightened = adjustColor('#888888', 40);
      expect(lightened).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('validates hex color syntax', () => {
      expect(validateHexColor('#ffffff')).toBe(true);
      expect(validateHexColor('3874ff')).toBe(true);
      expect(validateHexColor('#abc')).toBe(true);
      expect(validateHexColor('red')).toBe(false);
      expect(validateHexColor('')).toBe(false);
    });

    it('generates dynamic text colors and CSS variables', () => {
      const darkBgTokens = getDynamicTextVariables('#000000');
      expect(darkBgTokens['--title-color']).toBe('#fcfcfc');
      expect(darkBgTokens['--text-color']).toBe('#f0efef');

      const lightBgTokens = getDynamicTextVariables('#ffffff');
      expect(lightBgTokens['--title-color']).toBe('#0b0a0a');
      expect(lightBgTokens['--text-color']).toBe('#403a3a');

      const camelCaseTokens = getDynamicTextColors('#ffffff', false);
      expect(camelCaseTokens.titleColor).toBe('#0b0a0a');
      expect(camelCaseTokens.textColor).toBe('#403a3a');
    });
  });

  describe('pageGeometry.js', () => {
    it('provides standard A4 constants', () => {
      expect(A4_PAGE_HEIGHT_PX).toBe(1123);
      expect(A4_WIDTH_PX).toBe(794);
      expect(A4_GAP_PX).toBe(20);
      expect(DEFAULT_PAGE_PADDING).toBe(24);
    });

    it('measures 297mm ruler height in pixels with resilient fallback', () => {
      const height = getRulerHeightPx();
      expect(height).toBeGreaterThan(0);
    });

    it('calculates relative bounds between child and parent container', () => {
      const parent = document.createElement('div');
      const child = document.createElement('div');
      parent.appendChild(child);

      // In JSDOM getBoundingClientRect defaults to 0, fallback handles gracefully
      const bounds = getRelativeBounds(child, parent);
      expect(bounds).toHaveProperty('top');
      expect(bounds).toHaveProperty('bottom');
      expect(bounds).toHaveProperty('left');
      expect(bounds).toHaveProperty('width');
      expect(bounds).toHaveProperty('height');
    });

    it('computes forbidden zone boundaries for page folds', () => {
      const zone1 = getForbiddenZone(1, 1123, 24, 20);
      // foldTop = 1 * 1123 + 0 * 20 = 1123
      expect(zone1.foldTop).toBe(1123);
      expect(zone1.foldBottom).toBe(1143);
      expect(zone1.forbiddenStart).toBe(1123 - 24); // 1099
      expect(zone1.forbiddenEnd).toBe(1143 + 24);   // 1167
    });

    it('detects elements that intrude into forbidden boundary zones', () => {
      // Element [1100 .. 1150] intersects [1099 .. 1167]
      expect(isInForbiddenBoundaryZone(1100, 1150, 1123, 24, 20)).toBe(true);
      // Element [500 .. 600] is completely in safe page 1 content
      expect(isInForbiddenBoundaryZone(500, 600, 1123, 24, 20)).toBe(false);
      // Element [1200 .. 1300] is safely on page 2
      expect(isInForbiddenBoundaryZone(1200, 1300, 1123, 24, 20)).toBe(false);
    });
  });

  describe('typographyUtils.js', () => {
    it('maps font families to robust CSS font stacks', () => {
      expect(getFontFamilyStack('Poppins')).toBe(FONT_FAMILIES.Poppins);
      expect(getFontFamilyStack('Inter')).toBe(FONT_FAMILIES.Inter);
      expect(getFontFamilyStack('JetBrains Mono')).toBe(FONT_FAMILIES['JetBrains Mono']);
      expect(getFontFamilyStack('UnknownFont')).toBe('UnknownFont');
      expect(getFontFamilyStack(null)).toBe(DEFAULT_FONT_FAMILY);
    });

    it('compiles layout configuration into dynamic CSS typography tokens', () => {
      const tokens = computeTypographyTokens({
        fontFamily: 'Inter',
        fontScale: 1.2,
        lineHeight: 1.5,
        pagePadding: 32,
        sectionGap: 24,
        itemGap: 10,
      });

      expect(tokens['--body-font']).toBe(FONT_FAMILIES.Inter);
      expect(tokens['--font-scale']).toBe('1.2');
      expect(tokens['--line-height']).toBe('1.5');
      expect(tokens['--page-padding']).toBe('32px');
      expect(tokens['--section-gap']).toBe('24px');
      expect(tokens['--item-gap']).toBe('10px');
    });

    it('applies typography tokens to an HTMLElement style', () => {
      const el = document.createElement('div');
      applyTypographyTokens(el, 1.1, 1.6, 'Roboto');
      expect(el.style.getPropertyValue('--font-scale')).toBe('1.1');
      expect(el.style.getPropertyValue('--line-height')).toBe('1.6');
      expect(el.style.getPropertyValue('--body-font')).toBe(FONT_FAMILIES.Roboto);
    });
  });

  describe('pageDeletionEngine.js resetForcedPageBreaks', () => {
    it('resets forced break attributes and inline margin-top', () => {
      const container = document.createElement('div');
      const item = document.createElement('div');
      item.setAttribute('data-editor-break-forced', 'true');
      item.setAttribute('data-editor-break-fold', '1');
      item.style.marginTop = '50px';
      container.appendChild(item);

      resetForcedPageBreaks(container);

      expect(item.getAttribute('data-editor-break-forced')).toBeNull();
      expect(item.getAttribute('data-editor-break-fold')).toBeNull();
      expect(item.style.marginTop).toBe('');
    });
  });

  describe('Custom Hooks', () => {
    describe('useColumnResizer', () => {
      it('initializes with default state and provides resize trigger handler', () => {
        const onResize = vi.fn();
        const areaCvRef = { current: document.createElement('div') };
        const { result } = renderHook(() =>
          useColumnResizer({
            areaCvRef,
            onResize,
            minPercent: 20,
            maxPercent: 55,
            initialLeftWidth: 35,
          })
        );

        expect(result.current.isResizing).toBe(false);
        expect(result.current.leftWidth).toBe(35);
        expect(typeof result.current.startResizing).toBe('function');
        expect(typeof result.current.handleResizerMouseDown).toBe('function');
      });
    });

    describe('useCVDndCoordinator', () => {
      it('initializes with sensors and event handlers', () => {
        const cvData = { sections: [] };
        const moveItemBetweenSections = vi.fn();
        const moveSectionToColumnAndIndex = vi.fn();

        const { result } = renderHook(() =>
          useCVDndCoordinator({
            cvData,
            moveItemBetweenSections,
            moveSectionToColumnAndIndex,
          })
        );

        expect(result.current.sensors).toBeDefined();
        expect(result.current.collisionDetection).toBeDefined();
        expect(typeof result.current.handleDragStart).toBe('function');
        expect(typeof result.current.handleDragOver).toBe('function');
        expect(typeof result.current.handleDragEnd).toBe('function');
        expect(result.current.activeDragItem).toBeNull();
        expect(result.current.activeDragSection).toBeNull();
      });
    });

    describe('useDocumentPages', () => {
      it('initializes pages and exposes totalPages for document partition', () => {
        const cvData = { layout: { type: '2-column' }, sections: [] };

        const { result } = renderHook(() =>
          useDocumentPages({
            cvData,
          })
        );

        expect(result.current.totalPages).toBeGreaterThanOrEqual(1);
        expect(Array.isArray(result.current.pages)).toBe(true);
      });
    });
  });
});
