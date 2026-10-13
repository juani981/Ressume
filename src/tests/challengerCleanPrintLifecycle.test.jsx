import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { 
  calculatePrintScale, 
  executeCleanPrint,
  generateCleanPrintHTML
} from '../utils/staticHtmlPdfEngine';
import ActionMenu from '../components/Editor/ActionMenu';
import { CVProvider } from '../context/CVContext';
import * as printEngineModule from '../utils/staticHtmlPdfEngine';

describe('Empirical Challenger: Clean Print Engine & Lifecycle Boundary Stress Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.querySelectorAll('iframe').forEach(el => el.remove());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.querySelectorAll('iframe').forEach(el => el.remove());
  });

  // =========================================================================
  // SECTION 1: calculatePrintScale Boundary & Edge-Case Math Stress Testing
  // =========================================================================
  describe('Section 1: calculatePrintScale Boundary & Mathematical Clamping', () => {
    it('C1.1: strictly returns 1.0 for renderedHeight <= 2246px', () => {
      expect(calculatePrintScale(1)).toBe(1.0);
      expect(calculatePrintScale(500)).toBe(1.0);
      expect(calculatePrintScale(1123)).toBe(1.0);
      expect(calculatePrintScale(1500)).toBe(1.0);
      expect(calculatePrintScale(2245)).toBe(1.0);
      expect(calculatePrintScale(2245.999)).toBe(1.0);
      expect(calculatePrintScale(2246)).toBe(1.0);
    });

    it('C1.2: correctly returns scaled factor 2246 / renderedHeight for 2246px < renderedHeight <= 2994px', () => {
      // 2246 / 2300 = 0.9765217... -> 0.977
      expect(calculatePrintScale(2300)).toBe(0.977);

      // 2246 / 2400 = 0.9358333... -> 0.936
      expect(calculatePrintScale(2400)).toBe(0.936);

      // 2246 / 2500 = 0.8984 -> 0.898
      expect(calculatePrintScale(2500)).toBe(0.898);

      // 2246 / 2600 = 0.863846... -> 0.864
      expect(calculatePrintScale(2600)).toBe(0.864);

      // 2246 / 2700 = 0.83185... -> 0.832
      expect(calculatePrintScale(2700)).toBe(0.832);

      // 2246 / 2800 = 0.80214... -> 0.802
      expect(calculatePrintScale(2800)).toBe(0.802);

      // 2246 / 2994 = 0.750167... -> 0.75
      expect(calculatePrintScale(2994)).toBe(0.75);
    });

    it('C1.3: strictly clamps massive inputs to MIN_SCALE_FLOOR (0.75)', () => {
      expect(calculatePrintScale(2995)).toBe(0.75);
      expect(calculatePrintScale(3000)).toBe(0.75);
      expect(calculatePrintScale(5000)).toBe(0.75);
      expect(calculatePrintScale(10000)).toBe(0.75);
      expect(calculatePrintScale(50000)).toBe(0.75);
      expect(calculatePrintScale(1000000)).toBe(0.75);
      expect(calculatePrintScale(Infinity)).toBe(0.75);
    });

    it('C1.4: safely handles invalid, falsy, zero, and negative inputs by returning 1.0', () => {
      expect(calculatePrintScale(0)).toBe(1.0);
      expect(calculatePrintScale(-1)).toBe(1.0);
      expect(calculatePrintScale(-500)).toBe(1.0);
      expect(calculatePrintScale(-2246)).toBe(1.0);
      expect(calculatePrintScale(null)).toBe(1.0);
      expect(calculatePrintScale(undefined)).toBe(1.0);
      expect(calculatePrintScale(false)).toBe(1.0);
      expect(calculatePrintScale(NaN)).toBe(1.0);
    });
  });

  // =========================================================================
  // SECTION 2: executeCleanPrint DOM and Execution Lifecycle
  // =========================================================================
  describe('Section 2: executeCleanPrint DOM and Execution Lifecycle', () => {
    it('C2.1: validates iframe creation, dimensions (794px x 1123px), positioning, and title', async () => {
      let createdIframe = null;
      const originalAppendChild = document.body.appendChild.bind(document.body);

      vi.spyOn(document.body, 'appendChild').mockImplementation(function (child) {
        if (child.tagName === 'IFRAME') {
          createdIframe = child;
          Object.defineProperty(child, 'contentWindow', {
            configurable: true,
            value: {
              document: {
                open: vi.fn(),
                write: vi.fn(),
                close: vi.fn(),
                readyState: 'complete',
                fonts: { ready: Promise.resolve() },
                body: { scrollHeight: 1100, style: {} }
              },
              focus: vi.fn(),
              print: vi.fn()
            }
          });
        }
        return originalAppendChild(child);
      });

      await executeCleanPrint({});

      expect(createdIframe).not.toBeNull();
      expect(createdIframe.style.width).toBe('794px');
      expect(createdIframe.style.minWidth).toBe('794px');
      expect(createdIframe.style.height).toBe('1123px');
      expect(createdIframe.style.position).toBe('fixed');
      expect(createdIframe.style.top).toBe('-10000px');
      expect(createdIframe.style.left).toBe('-10000px');
      expect(createdIframe.style.visibility).toBe('hidden');
      expect(createdIframe.style.border).toBe('0px');
      expect(createdIframe.getAttribute('title')).toMatch(/Easy CV Editor Print Preview|Ressume Print Preview/);
    });

    it('C2.2: synchronizes font readiness via Promise.race and triggers focus and print', async () => {
      let fontReadyAwaited = false;
      let focusCalled = false;
      let printCalled = false;

      const slowFontPromise = new Promise((resolve) => {
        setTimeout(() => {
          fontReadyAwaited = true;
          resolve();
        }, 50);
      });

      vi.spyOn(document.body, 'appendChild').mockImplementation(function (child) {
        if (child.tagName === 'IFRAME') {
          Object.defineProperty(child, 'contentWindow', {
            configurable: true,
            value: {
              document: {
                open: vi.fn(),
                write: vi.fn(),
                close: vi.fn(),
                readyState: 'complete',
                fonts: { ready: slowFontPromise },
                body: { scrollHeight: 1000, style: {} }
              },
              focus: vi.fn(() => { focusCalled = true; }),
              print: vi.fn(() => { printCalled = true; })
            }
          });
        }
        return HTMLBodyElement.prototype.appendChild.call(this, child);
      });

      await executeCleanPrint({});

      expect(fontReadyAwaited).toBe(true);
      expect(focusCalled).toBe(true);
      expect(printCalled).toBe(true);
    });

    it('C2.3: handles hanging fonts gracefully with 1000ms timeout fallback', async () => {
      vi.useFakeTimers();

      let printCalled = false;
      // An unending font ready promise that never resolves
      const hangingFontPromise = new Promise(() => {});

      vi.spyOn(document.body, 'appendChild').mockImplementation(function (child) {
        if (child.tagName === 'IFRAME') {
          Object.defineProperty(child, 'contentWindow', {
            configurable: true,
            value: {
              document: {
                open: vi.fn(),
                write: vi.fn(),
                close: vi.fn(),
                readyState: 'complete',
                fonts: { ready: hangingFontPromise },
                body: { scrollHeight: 1000, style: {} }
              },
              focus: vi.fn(),
              print: vi.fn(() => { printCalled = true; })
            }
          });
        }
        return HTMLBodyElement.prototype.appendChild.call(this, child);
      });

      const printPromise = executeCleanPrint({});

      // Advance timers by 1000ms to trigger Promise.race timeout
      await vi.advanceTimersByTimeAsync(1050);

      await printPromise;
      expect(printCalled).toBe(true);

      vi.useRealTimers();
    });

    it('C2.4: falls back to window.print() when document is not accessible', async () => {
      const windowPrintSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

      vi.spyOn(document.body, 'appendChild').mockImplementation(function (child) {
        if (child.tagName === 'IFRAME') {
          Object.defineProperty(child, 'contentWindow', {
            configurable: true,
            value: null
          });
          Object.defineProperty(child, 'contentDocument', {
            configurable: true,
            value: null
          });
        }
        return HTMLBodyElement.prototype.appendChild.call(this, child);
      });

      await executeCleanPrint({});

      expect(windowPrintSpy).toHaveBeenCalled();
    });

    it('C2.5: falls back to window.print() when iframe.print throws an exception', async () => {
      const windowPrintSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      vi.spyOn(document.body, 'appendChild').mockImplementation(function (child) {
        if (child.tagName === 'IFRAME') {
          Object.defineProperty(child, 'contentWindow', {
            configurable: true,
            value: {
              document: {
                open: vi.fn(),
                write: vi.fn(),
                close: vi.fn(),
                readyState: 'complete',
                body: { scrollHeight: 1000, style: {} }
              },
              focus: vi.fn(),
              print: vi.fn(() => {
                throw new Error('SecurityError: Not allowed to print iframe');
              })
            }
          });
        }
        return HTMLBodyElement.prototype.appendChild.call(this, child);
      });

      await executeCleanPrint({});

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(windowPrintSpy).toHaveBeenCalled();
    });

    it('C2.6: timer unmounts iframe cleanly after print without throwing or leaking nodes', async () => {
      vi.useFakeTimers();

      let attachedIframe = null;
      vi.spyOn(document.body, 'appendChild').mockImplementation(function (child) {
        if (child.tagName === 'IFRAME') {
          attachedIframe = child;
          Object.defineProperty(child, 'contentWindow', {
            configurable: true,
            value: {
              document: {
                open: vi.fn(),
                write: vi.fn(),
                close: vi.fn(),
                readyState: 'complete',
                body: { scrollHeight: 1000, style: {} }
              },
              focus: vi.fn(),
              print: vi.fn()
            }
          });
        }
        return HTMLBodyElement.prototype.appendChild.call(this, child);
      });

      const printPromise = executeCleanPrint({});
      await printPromise;

      expect(attachedIframe.parentNode).toBe(document.body);

      // Advance timer by 1000ms
      vi.advanceTimersByTime(1100);

      expect(attachedIframe.parentNode).toBeNull();

      vi.useRealTimers();
    });
  });

  // =========================================================================
  // SECTION 3: ActionMenu Integration & Trigger Path
  // =========================================================================
  describe('Section 3: ActionMenu Integration & Export Trigger Path', () => {
    it('C3.1: clicking PDF export button in ActionMenu invokes executeCleanPrint with active CV state', async () => {
      const executeCleanPrintSpy = vi.spyOn(printEngineModule, 'executeCleanPrint').mockResolvedValue();

      render(
        <CVProvider>
          <ActionMenu />
        </CVProvider>
      );

      const pdfButton = screen.getByRole('button', { name: /descargar \/ imprimir pdf|generar pdf nativo/i });
      expect(pdfButton).toBeDefined();

      fireEvent.click(pdfButton);

      expect(executeCleanPrintSpy).toHaveBeenCalledTimes(1);
      const [calledCvData, calledLang] = executeCleanPrintSpy.mock.calls[0];
      expect(calledCvData).toBeDefined();
      expect(calledCvData.profile).toBeDefined();
      expect(calledLang).toBe('es');
    });

    it('C3.2: catches executeCleanPrint synchronous error, falls back to window.print(), and resets loading', async () => {
      const windowPrintSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      vi.spyOn(printEngineModule, 'executeCleanPrint').mockImplementation(() => {
        throw new Error('Fatal engine crash during print setup');
      });

      render(
        <CVProvider>
          <ActionMenu />
        </CVProvider>
      );

      const pdfButton = screen.getByRole('button', { name: /descargar \/ imprimir pdf|generar pdf nativo/i });
      fireEvent.click(pdfButton);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'executeCleanPrint fallback',
        expect.any(Error)
      );
      expect(windowPrintSpy).toHaveBeenCalled();
      expect(pdfButton.hasAttribute('disabled')).toBe(false);
    });
  });
});
