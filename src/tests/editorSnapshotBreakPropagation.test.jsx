import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  captureEditorSnapshot,
  generateCleanPrintHTML,
  executeCleanPrint
} from '../utils/staticHtmlPdfEngine';
import { defaultSchema } from '../utils/schema';

describe('Editor Snapshot & 1:1 Break Propagation to Print Engine', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-suite-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.restoreAllMocks();
  });

  describe('1. captureEditorSnapshot API', () => {
    it('returns null when #area-cv is not in the DOM', () => {
      const snapshot = captureEditorSnapshot();
      expect(snapshot).toBeNull();
    });

    it('captures exact container width, height, and ruler pageHeightPx', () => {
      const areaCv = document.createElement('div');
      areaCv.id = 'area-cv';
      areaCv.className = 'resume bd-grid';
      Object.defineProperty(areaCv, 'offsetWidth', { value: 1024, configurable: true });
      Object.defineProperty(areaCv, 'scrollHeight', { value: 2300, configurable: true });
      areaCv.getBoundingClientRect = vi.fn(() => ({
        top: 0,
        left: 0,
        width: 1024,
        height: 2300,
        right: 1024,
        bottom: 2300
      }));
      container.appendChild(areaCv);

      const snapshot = captureEditorSnapshot();
      expect(snapshot).not.toBeNull();
      expect(snapshot.width).toBe(1024);
      expect(snapshot.height).toBe(2300);
      expect(snapshot.pageHeightPx).toBeGreaterThan(0);
      expect(snapshot.brokenElements).toEqual([]);
    });

    it('identifies and snapshots both section titles and items marked with data-editor-break-forced', () => {
      const areaCv = document.createElement('div');
      areaCv.id = 'area-cv';
      areaCv.getBoundingClientRect = vi.fn(() => ({ top: 0, left: 0, width: 840, height: 1800, right: 840, bottom: 1800 }));
      container.appendChild(areaCv);

      const section1 = document.createElement('section');
      section1.className = 'section cv-section';
      section1.setAttribute('data-section-id', 'experience');

      const title = document.createElement('h2');
      title.className = 'section-title';
      title.setAttribute('data-section-title', 'experience');
      title.setAttribute('data-editor-break-forced', 'true');
      title.setAttribute('data-editor-break-fold', '1');
      title.style.marginTop = '120px';
      title.getBoundingClientRect = vi.fn(() => ({ top: 1150, bottom: 1190, height: 40 }));
      section1.appendChild(title);

      const item1 = document.createElement('div');
      item1.className = 'cv-block experience__content';
      item1.setAttribute('data-item-id', 'exp-101');
      item1.setAttribute('data-section-id', 'experience');
      item1.setAttribute('data-editor-break-forced', 'true');
      item1.setAttribute('data-editor-break-fold', '2');
      item1.style.marginTop = '85px';
      item1.getBoundingClientRect = vi.fn(() => ({ top: 2260, bottom: 2340, height: 80 }));
      section1.appendChild(item1);

      areaCv.appendChild(section1);

      const snapshot = captureEditorSnapshot();
      expect(snapshot.brokenElements).toHaveLength(2);

      const titleBreak = snapshot.brokenElements.find(b => b.isTitle);
      expect(titleBreak).toBeDefined();
      expect(titleBreak.sectionId).toBe('experience');
      expect(titleBreak.fold).toBe('1');
      expect(titleBreak.pageNum).toBe(1);
      expect(titleBreak.marginTop).toBe('120px');

      const itemBreak = snapshot.brokenElements.find(b => !b.isTitle);
      expect(itemBreak).toBeDefined();
      expect(itemBreak.itemId).toBe('exp-101');
      expect(itemBreak.sectionId).toBe('experience');
      expect(itemBreak.fold).toBe('2');
      expect(itemBreak.pageNum).toBe(2);
      expect(itemBreak.marginTop).toBe('85px');
    });
  });

  describe('2. generateCleanPrintHTML with Snapshot', () => {
    it('sets #area-cv width and max-width to match snapshot container width', () => {
      const customSnapshot = {
        width: 1024,
        height: 2000,
        pageHeightPx: 1123,
        brokenElements: []
      };

      const html = generateCleanPrintHTML(defaultSchema, 'es', customSnapshot);
      expect(html).toContain('width: 1024px');
      expect(html).toContain('max-width: 1024px');
    });

    it('injects <style id="cv-snapshot-breaks"> with exact break rules when brokenElements exist', () => {
      const customSnapshot = {
        width: 840,
        height: 2000,
        pageHeightPx: 1123,
        brokenElements: [
          { sectionId: 'education', itemId: null, isTitle: true, fold: '1' },
          { sectionId: 'skills', itemId: 'skill-99', isTitle: false, fold: '1' }
        ]
      };

      const html = generateCleanPrintHTML(defaultSchema, 'es', customSnapshot);
      expect(html).toContain('id="cv-snapshot-breaks"');
      expect(html).toContain('[data-section-title="education"]');
      expect(html).toContain('[data-item-id="skill-99"]');
      expect(html).toContain('break-before: page !important');
      expect(html).toContain('page-break-before: always !important');
    });
  });

  describe('3. executeCleanPrint with Snapshot Propagation & Zero Downscaling', () => {
    it('creates iframe matching snapshot width and applies breaks with zoom: 1.0', async () => {
      let createdIframe = null;
      let assignedZoom = null;
      const originalAppendChild = document.body.appendChild.bind(document.body);

      const customSnapshot = {
        width: 1024,
        height: 2500,
        pageHeightPx: 1123,
        brokenElements: [
          { sectionId: 'experience', itemId: 'exp-1', isTitle: false, fold: '1' }
        ]
      };

      vi.spyOn(document.body, 'appendChild').mockImplementation(function (child) {
        if (child.tagName === 'IFRAME') {
          createdIframe = child;
          const mockAreaCv = document.createElement('div');
          mockAreaCv.id = 'area-cv';

          const brokenItem = document.createElement('div');
          brokenItem.setAttribute('data-item-id', 'exp-1');
          mockAreaCv.appendChild(brokenItem);

          Object.defineProperty(child, 'contentWindow', {
            configurable: true,
            value: {
              document: {
                open: vi.fn(),
                write: vi.fn(),
                close: vi.fn(),
                readyState: 'complete',
                fonts: { ready: Promise.resolve() },
                getElementById: (id) => id === 'area-cv' ? mockAreaCv : null,
                querySelector: (sel) => mockAreaCv.querySelector(sel),
                body: {
                  scrollHeight: 2500,
                  style: {
                    set zoom(val) { assignedZoom = val; },
                    get zoom() { return assignedZoom; }
                  },
                  querySelector: () => mockAreaCv
                }
              },
              focus: vi.fn(),
              print: vi.fn(),
              close: vi.fn()
            }
          });
        }
        return originalAppendChild(child);
      });

      await executeCleanPrint(defaultSchema, 'es', customSnapshot);

      expect(createdIframe).not.toBeNull();
      expect(createdIframe.style.width).toBe('1024px');
      expect(createdIframe.style.minWidth).toBe('1024px');

      // Crucial: Zero downscaling when snapshot is provided
      expect(assignedZoom).toBe(1.0);
    });
  });
});
