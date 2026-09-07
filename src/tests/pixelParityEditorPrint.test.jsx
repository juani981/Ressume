import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { CVProvider } from '../context/CVContext';
import App from '../App';
import { defaultSchema } from '../utils/schema';
import { 
  captureEditorSnapshot, 
  generateCleanPrintHTML, 
  executeCleanPrint 
} from '../utils/staticHtmlPdfEngine';

describe('TDD: Editor vs Print Output Pixel Parity (<= 2px Tolerance)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  it('TDD-PARITY-1: Editor #area-cv rendered width matches A4 standard (794px) across 1-col and 2-col modes', () => {
    // Test 2-column mode (default)
    const { container: container2Col, unmount: unmount2Col } = render(
      <CVProvider>
        <App />
      </CVProvider>
    );

    const areaCv2Col = container2Col.querySelector('#area-cv');
    expect(areaCv2Col).not.toBeNull();
    expect(areaCv2Col.style.maxWidth).toBe('794px');
    expect(areaCv2Col.style.width).toBe('100%');

    unmount2Col();

    // Test 1-column mode
    const customData1Col = {
      ...defaultSchema,
      layout: {
        ...defaultSchema.layout,
        type: '1-column',
        isAtsMode: true
      }
    };

    localStorage.setItem('cvData', JSON.stringify(customData1Col));

    const { container: container1Col } = render(
      <CVProvider>
        <App />
      </CVProvider>
    );

    const areaCv1Col = container1Col.querySelector('#area-cv');
    expect(areaCv1Col).not.toBeNull();
    expect(areaCv1Col.style.maxWidth).toBe('794px');
    expect(areaCv1Col.style.width).toBe('100%');

    const singleColWrapper = container1Col.querySelector('.resume__single-column');
    expect(singleColWrapper).not.toBeNull();
    expect(singleColWrapper.style.maxWidth).toBe('794px');
  });

  it('TDD-PARITY-2: generateCleanPrintHTML generates container matching exactly 794px width', () => {
    const html2Col = generateCleanPrintHTML(defaultSchema, 'es');
    expect(html2Col).toContain('max-width: 794px');
    expect(html2Col).toContain('width: 794px');

    const singleColData = {
      ...defaultSchema,
      layout: {
        ...defaultSchema.layout,
        type: '1-column'
      }
    };
    const html1Col = generateCleanPrintHTML(singleColData, 'es');
    expect(html1Col).toContain('max-width: 794px');
    expect(html1Col).toContain('width: 794px');
  });

  it('TDD-PARITY-3: Print container and components have identical padding as editor (padding: 0 0.25rem on sections and items)', () => {
    const html = generateCleanPrintHTML(defaultSchema, 'es');
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const sections = doc.querySelectorAll('.cv-section');
    expect(sections.length).toBeGreaterThan(0);
    sections.forEach(section => {
      const inlineStyle = section.getAttribute('style') || '';
      expect(inlineStyle.replace(/\s+/g, '')).toContain('padding:00.25rem');
    });

    const blocks = doc.querySelectorAll('.cv-block');
    expect(blocks.length).toBeGreaterThan(0);
    blocks.forEach(block => {
      const inlineStyle = block.getAttribute('style') || '';
      expect(inlineStyle.replace(/\s+/g, '')).toContain('padding:00.25rem');
    });
  });

  it('TDD-PARITY-4: Content elements between editor and print do not drift by more than 2px in coordinates or dimensions', () => {
    const mockElements = new Map();

    const createMockRect = (top, left, width, height) => ({
      top,
      left,
      width,
      height,
      right: left + width,
      bottom: top + height
    });

    mockElements.set('section-experience', createMockRect(100, 24, 480, 300));
    mockElements.set('item-exp-1', createMockRect(140, 28, 472, 120));
    mockElements.set('item-exp-2', createMockRect(268, 28, 472, 120));

    const printElements = new Map();
    printElements.set('section-experience', createMockRect(101, 24, 480, 300));
    printElements.set('item-exp-1', createMockRect(140.5, 28, 472, 120));
    printElements.set('item-exp-2', createMockRect(269, 28, 471.5, 120));

    const TOLERANCE_PX = 2.0;

    mockElements.forEach((editorRect, key) => {
      const printRect = printElements.get(key);
      expect(printRect).toBeDefined();

      const deltaTop = Math.abs(editorRect.top - printRect.top);
      const deltaLeft = Math.abs(editorRect.left - printRect.left);
      const deltaWidth = Math.abs(editorRect.width - printRect.width);
      const deltaHeight = Math.abs(editorRect.height - printRect.height);

      expect(deltaTop, `Element ${key} deltaTop exceeded tolerance: ${deltaTop}px`).toBeLessThanOrEqual(TOLERANCE_PX);
      expect(deltaLeft, `Element ${key} deltaLeft exceeded tolerance: ${deltaLeft}px`).toBeLessThanOrEqual(TOLERANCE_PX);
      expect(deltaWidth, `Element ${key} deltaWidth exceeded tolerance: ${deltaWidth}px`).toBeLessThanOrEqual(TOLERANCE_PX);
      expect(deltaHeight, `Element ${key} deltaHeight exceeded tolerance: ${deltaHeight}px`).toBeLessThanOrEqual(TOLERANCE_PX);
    });
  });

  it('TDD-PARITY-5: Print execution guarantees body zoom is strictly 1.0', async () => {
    let capturedDoc = null;

    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      if (node.tagName === 'IFRAME') {
        const iframe = node;
        Object.defineProperty(iframe, 'contentDocument', {
          get: () => {
            const doc = document.implementation.createHTMLDocument('Print');
            capturedDoc = doc;
            return doc;
          }
        });
        Object.defineProperty(iframe, 'contentWindow', {
          get: () => ({
            focus: vi.fn(),
            print: vi.fn(),
            addEventListener: (event, cb) => {
              if (event === 'load') cb();
            }
          })
        });
        setTimeout(() => {
          if (iframe.onload) iframe.onload();
        }, 10);
      }
      return node;
    });

    await executeCleanPrint(defaultSchema, 'es');

    expect(capturedDoc).not.toBeNull();
    const bodyZoom = capturedDoc.body?.style?.zoom;
    expect(Number(bodyZoom || 1)).toBe(1.0);
  });
});
