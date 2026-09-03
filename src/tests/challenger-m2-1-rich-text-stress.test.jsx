import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import InlineEdit from '../components/Editor/InlineEdit';
import RichTextToolbar from '../components/Editor/RichTextToolbar';
import { CVProvider, useCV } from '../context/CVContext';
import { defaultSchema } from '../utils/schema';
import { generateCleanPrintHTML } from '../utils/staticHtmlPdfEngine';
import { 
  sanitizeRichHTML, 
  stripOuterAlignment, 
  applyAlignment, 
  extractAlignment, 
  parseHtmlToTokens,
  stripHtml,
  escapeHTML 
} from '../utils/richTextEngine';

describe('Challenger M2-1: Empirical Stress Tests for Rich Text Input, Shortcuts & Security', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // =========================================================================
  // TASK 1: Keyboard Shortcuts Stress Testing
  // Ctrl+B, Ctrl+I, Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y, Cut/Copy/Paste, Escape
  // =========================================================================
  describe('Task 1: Keyboard Shortcuts & In-Field History Stress Tests', () => {
    it('C1.1: Ctrl+B and Ctrl+I toggle repeatedly back and forth without corrupting text', () => {
      const onSaveMock = vi.fn();
      render(
        <CVProvider>
          <InlineEdit value="Senior Fullstack Architect" onSave={onSaveMock} />
        </CVProvider>
      );

      const display = screen.getByTestId('inline-edit-display');
      fireEvent.click(display);

      const editor = screen.getByRole('textbox');
      expect(editor.textContent).toBe('Senior Fullstack Architect');

      // 1. First Ctrl+B -> Bolds
      fireEvent.keyDown(editor, { key: 'b', ctrlKey: true });
      expect(editor.innerHTML).toContain('<b>Senior Fullstack Architect</b>');

      // 2. Second Ctrl+B -> Unbolds
      fireEvent.keyDown(editor, { key: 'b', ctrlKey: true });
      expect(editor.innerHTML).toBe('Senior Fullstack Architect');

      // 3. Third Ctrl+B -> Re-bolds
      fireEvent.keyDown(editor, { key: 'b', ctrlKey: true });
      expect(editor.innerHTML).toContain('<b>Senior Fullstack Architect</b>');

      // 4. Ctrl+I -> Applies italic over bold
      fireEvent.keyDown(editor, { key: 'i', ctrlKey: true });
      expect(editor.innerHTML).toMatch(/<i><b>Senior Fullstack Architect<\/b><\/i>|<b><i>Senior Fullstack Architect<\/i><\/b>/);

      // 5. Ctrl+I -> Un-italics
      fireEvent.keyDown(editor, { key: 'i', ctrlKey: true });
      expect(editor.innerHTML).toContain('<b>Senior Fullstack Architect</b>');
      expect(editor.innerHTML).not.toContain('<i>');
    });

    it('C1.2: Deep in-field undo/redo stack (10 steps) with Ctrl+Z and Ctrl+Shift+Z', () => {
      render(
        <CVProvider>
          <InlineEdit value="Base" onSave={vi.fn()} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('inline-edit-display'));
      const editor = screen.getByRole('textbox');

      // Simulate 10 incremental typing steps
      const steps = [
        'Base',
        'Base 1',
        'Base 1 2',
        'Base 1 2 3',
        'Base 1 2 3 4',
        'Base 1 2 3 4 5',
        'Base 1 2 3 4 5 6',
        'Base 1 2 3 4 5 6 7',
        'Base 1 2 3 4 5 6 7 8',
        'Base 1 2 3 4 5 6 7 8 9'
      ];

      for (let i = 1; i < steps.length; i++) {
        editor.innerHTML = steps[i];
        fireEvent.input(editor);
      }
      expect(editor.innerHTML).toBe('Base 1 2 3 4 5 6 7 8 9');

      // Step-by-step undo via Ctrl+Z back to 'Base'
      for (let i = steps.length - 2; i >= 0; i--) {
        fireEvent.keyDown(editor, { key: 'z', ctrlKey: true });
        expect(editor.innerHTML).toBe(steps[i]);
      }

      // Further undo when at base should not crash or erase base
      fireEvent.keyDown(editor, { key: 'z', ctrlKey: true });
      expect(editor.innerHTML).toBe('Base');

      // Step-by-step redo via Ctrl+Shift+Z forward to final step
      for (let i = 1; i < steps.length; i++) {
        fireEvent.keyDown(editor, { key: 'z', ctrlKey: true, shiftKey: true });
        expect(editor.innerHTML).toBe(steps[i]);
      }

      // Redo via Ctrl+Y when at head should be a safe no-op
      fireEvent.keyDown(editor, { key: 'y', ctrlKey: true });
      expect(editor.innerHTML).toBe('Base 1 2 3 4 5 6 7 8 9');
    });

    it('C1.3: Branching history clears future redo stack upon new edit', () => {
      render(
        <CVProvider>
          <InlineEdit value="Origin" onSave={vi.fn()} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('inline-edit-display'));
      const editor = screen.getByRole('textbox');

      // Edit 1
      editor.innerHTML = 'Origin Edit1';
      fireEvent.input(editor);

      // Edit 2
      editor.innerHTML = 'Origin Edit1 Edit2';
      fireEvent.input(editor);

      // Undo Edit 2
      fireEvent.keyDown(editor, { key: 'z', ctrlKey: true });
      expect(editor.innerHTML).toBe('Origin Edit1');

      // Branching action: new typing instead of redo
      editor.innerHTML = 'Origin Edit1 BranchB';
      fireEvent.input(editor);

      // Redo via Ctrl+Y must NOT restore abandoned 'Origin Edit1 Edit2'
      fireEvent.keyDown(editor, { key: 'y', ctrlKey: true });
      expect(editor.innerHTML).toBe('Origin Edit1 BranchB');
    });

    it('C1.4: Native Cut and Copy combinations (Ctrl+X, Ctrl+C) are NOT blocked by InlineEdit', () => {
      render(
        <CVProvider>
          <InlineEdit value="Copyable Content" onSave={vi.fn()} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('inline-edit-display'));
      const editor = screen.getByRole('textbox');

      // Dispatch Ctrl+C
      const copyEvt = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true, cancelable: true });
      const copyPreventSpy = vi.spyOn(copyEvt, 'preventDefault');
      editor.dispatchEvent(copyEvt);
      expect(copyPreventSpy).not.toHaveBeenCalled();

      // Dispatch Ctrl+X
      const cutEvt = new KeyboardEvent('keydown', { key: 'x', ctrlKey: true, bubbles: true, cancelable: true });
      const cutPreventSpy = vi.spyOn(cutEvt, 'preventDefault');
      editor.dispatchEvent(cutEvt);
      expect(cutPreventSpy).not.toHaveBeenCalled();

      // Dispatch Ctrl+A (Select All)
      const selectAllEvt = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, bubbles: true, cancelable: true });
      const selectPreventSpy = vi.spyOn(selectAllEvt, 'preventDefault');
      editor.dispatchEvent(selectAllEvt);
      expect(selectPreventSpy).not.toHaveBeenCalled();
    });

    it('C1.5: Mac MetaKey (Cmd+B, Cmd+I, Cmd+Z, Cmd+Shift+Z) behaves identically to Ctrl', () => {
      // Mock navigator.platform for Mac
      const originalPlatform = navigator.platform;
      Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true });

      render(
        <CVProvider>
          <InlineEdit value="Mac OS User" onSave={vi.fn()} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('inline-edit-display'));
      const editor = screen.getByRole('textbox');

      // Cmd+B
      fireEvent.keyDown(editor, { key: 'b', metaKey: true });
      expect(editor.innerHTML).toContain('<b>Mac OS User</b>');

      // Cmd+Z
      fireEvent.keyDown(editor, { key: 'z', metaKey: true });
      expect(editor.innerHTML).toBe('Mac OS User');

      // Cmd+Shift+Z
      fireEvent.keyDown(editor, { key: 'z', metaKey: true, shiftKey: true });
      expect(editor.innerHTML).toContain('<b>Mac OS User</b>');

      // Restore platform
      Object.defineProperty(navigator, 'platform', { value: originalPlatform, configurable: true });
    });

    it('C1.6: Selection-based formatting wraps and unwraps only selected text range', () => {
      render(
        <CVProvider>
          <InlineEdit value="Hello Wonderful World" onSave={vi.fn()} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('inline-edit-display'));
      const editor = screen.getByRole('textbox');

      // Select 'Wonderful'
      const textNode = editor.firstChild;
      const range = document.createRange();
      range.setStart(textNode, 6);
      range.setEnd(textNode, 15);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);

      // Hit Ctrl+B
      fireEvent.keyDown(editor, { key: 'b', ctrlKey: true });
      expect(editor.innerHTML).toBe('Hello <b>Wonderful</b> World');

      // Now select 'Wonderful' inside the bold tag and hit Ctrl+B again to unwrap
      const boldElem = editor.querySelector('b');
      const unwrapRange = document.createRange();
      unwrapRange.selectNodeContents(boldElem);
      sel.removeAllRanges();
      sel.addRange(unwrapRange);

      fireEvent.keyDown(editor, { key: 'b', ctrlKey: true });
      expect(editor.innerHTML).toBe('Hello Wonderful World');
    });
  });

  // =========================================================================
  // TASK 2: Rapid Typing, Empty Inputs & Multiline Newlines
  // =========================================================================
  describe('Task 2: Rapid Typing, Empty Inputs & Multiline Newlines', () => {
    it('C2.1: Handles 100 rapid keystroke inputs without crashing, freezing, or corrupting state', () => {
      const onSaveMock = vi.fn();
      render(
        <CVProvider>
          <InlineEdit value="" onSave={onSaveMock} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('inline-edit-display'));
      const editor = screen.getByRole('textbox');

      let currentStr = '';
      for (let i = 0; i < 100; i++) {
        currentStr += String.fromCharCode(65 + (i % 26));
        editor.innerHTML = currentStr;
        fireEvent.input(editor);
      }

      expect(editor.textContent.length).toBe(100);
      expect(editor.textContent).toBe(currentStr);
    });

    it('C2.2: Empty inputs and whitespace variations clean down to empty string and show placeholder', async () => {
      const onSaveMock = vi.fn();
      const { rerender } = render(
        <CVProvider>
          <InlineEdit value="Initial Heading" onSave={onSaveMock} placeholder="Escribe un título..." />
        </CVProvider>
      );

      // Case A: User deletes everything resulting in empty string
      fireEvent.click(screen.getByTestId('inline-edit-display'));
      let editor = screen.getByRole('textbox');
      editor.innerHTML = '';
      fireEvent.blur(editor);

      await act(async () => {
        await new Promise(r => setTimeout(r, 200));
      });

      expect(onSaveMock).toHaveBeenCalledWith('');

      // Case B: User leaves empty tags <b></b><i></i>
      onSaveMock.mockClear();
      rerender(
        <CVProvider>
          <InlineEdit value="Has Value" onSave={onSaveMock} />
        </CVProvider>
      );
      fireEvent.click(screen.getByTestId('inline-edit-display'));
      editor = screen.getByRole('textbox');
      editor.innerHTML = '<b></b><i>   </i><br>';
      fireEvent.blur(editor);

      await act(async () => {
        await new Promise(r => setTimeout(r, 200));
      });

      expect(onSaveMock).toHaveBeenCalledWith('');

      // Case C: When value is empty string, placeholder is visible in display mode
      rerender(
        <CVProvider>
          <InlineEdit value="" onSave={onSaveMock} placeholder="Texto de prueba..." />
        </CVProvider>
      );
      const display = screen.getByTestId('inline-edit-display');
      expect(display.textContent).toBe('Texto de prueba...');
    });

    it('C2.3: Multiline mode preserves multiple newlines and allows Enter without committing', async () => {
      const onSaveMock = vi.fn();
      render(
        <CVProvider>
          <InlineEdit 
            multiline={true} 
            value="Line 1\nLine 2\nLine 3" 
            onSave={onSaveMock} 
          />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('inline-edit-display'));
      const editor = screen.getByRole('textbox');
      expect(editor.getAttribute('aria-multiline')).toBe('true');

      // In multiline mode, pressing Enter must NOT call preventDefault or blur
      const enterEvt = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      const preventSpy = vi.spyOn(enterEvt, 'preventDefault');
      editor.dispatchEvent(enterEvt);

      expect(preventSpy).not.toHaveBeenCalled();

      // Enter 10 newlines with mixed content
      editor.innerHTML = 'Header<br><br><br>Paragraph 1<br><br><b>Bold Notes</b><br><br><br><br>Footer';
      fireEvent.blur(editor);

      await act(async () => {
        await new Promise(r => setTimeout(r, 200));
      });

      expect(onSaveMock).toHaveBeenCalled();
      const savedContent = onSaveMock.mock.calls[0][0];
      expect(savedContent).toContain('Header');
      expect(savedContent).toContain('<br>');
      expect(savedContent).toContain('<b>Bold Notes</b>');
      expect(savedContent).toContain('Footer');

      // Verify tokenization handles newlines
      const tokenized = parseHtmlToTokens(savedContent);
      expect(tokenized.tokens.some(t => t.text.includes('\n'))).toBe(true);
    });

    it('C2.4: Nested empty HTML tags and linebreaks clean to empty string', async () => {
      const onSaveMock = vi.fn();
      render(
        <CVProvider>
          <InlineEdit value="Existing" onSave={onSaveMock} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('inline-edit-display'));
      const editor = screen.getByRole('textbox');
      editor.innerHTML = '<div><p><span><br>   </span></p></div>';
      fireEvent.blur(editor);

      await act(async () => {
        await new Promise(r => setTimeout(r, 200));
      });

      expect(onSaveMock).toHaveBeenCalledWith('');
    });
  });

  // =========================================================================
  // TASK 3: External Rich HTML Pasting & Hostile Payloads Sanitization
  // =========================================================================
  describe('Task 3: External Hostile HTML Pasting & Sanitization Stress Tests', () => {
    it('C3.1: Pasting rich HTML intercepts clipboard and only ingests plain text', () => {
      render(
        <CVProvider>
          <InlineEdit value="" onSave={vi.fn()} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('inline-edit-display'));
      const editor = screen.getByRole('textbox');

      // Clipboard data containing malicious HTML in 'text/html' but safe text in 'text/plain'
      const clipboardMock = {
        getData: (format) => {
          if (format === 'text/html') {
            return '<style>body{background:red}</style><iframe src="evil.com"></iframe><script>evil()</script>Rich';
          }
          if (format === 'text/plain') {
            return 'Clean Plain Content';
          }
          return '';
        }
      };

      fireEvent.paste(editor, { clipboardData: clipboardMock });

      expect(editor.textContent).toBe('Clean Plain Content');
      expect(editor.innerHTML).not.toContain('<style>');
      expect(editor.innerHTML).not.toContain('<iframe>');
      expect(editor.innerHTML).not.toContain('<script>');
    });

    it('C3.2: Hostile HTML payloads are rigorously sanitized by sanitizeRichHTML', () => {
      const hostilePayloads = [
        {
          input: '<script>alert("XSS")</script>',
          unsafe: ['<script>', 'alert('],
          expectedPattern: /&lt;script&gt;/
        },
        {
          input: '<SCRIPT SRC="http://evil.com/xss.js"></SCRIPT>',
          unsafe: ['<SCRIPT'],
          expectedPattern: /&lt;SCRIPT/i
        },
        {
          input: '<iframe src="javascript:alert(1)"></iframe>',
          unsafe: ['<iframe'],
          expectedPattern: /&lt;iframe/
        },
        {
          input: '<img src="x" onerror="alert(1)">',
          unsafe: ['<img', 'onerror='],
          expectedPattern: /&lt;img/
        },
        {
          input: '<svg onload="alert(1)"><circle r="10"/></svg>',
          unsafe: ['<svg', 'onload='],
          expectedPattern: /&lt;svg/
        },
        {
          input: '<link rel="stylesheet" href="http://evil.com/malicious.css">',
          unsafe: ['<link'],
          expectedPattern: /&lt;link/
        },
        {
          input: '<style>body { display: none !important; }</style>',
          unsafe: ['<style>'],
          expectedPattern: /&lt;style&gt;/
        },
        {
          input: '<object data="data:text/html,<script>alert(1)</script>"></object>',
          unsafe: ['<object'],
          expectedPattern: /&lt;object/
        },
        {
          input: '<b onclick="stealCookies()" onmouseover="hack()">Safe Bold</b>',
          mustPreserve: '<b>Safe Bold</b>',
          unsafe: ['onclick', 'onmouseover', 'stealCookies']
        },
        {
          input: '<div style="position: fixed; width: 100vw; height: 100vh; background: red; text-align: center;">Overlay</div>',
          mustPreserve: '<div style="text-align: center;">Overlay</div>',
          unsafe: ['position: fixed', 'width: 100vw', 'background: red']
        }
      ];

      for (const payload of hostilePayloads) {
        const sanitized = sanitizeRichHTML(payload.input);

        if (payload.expectedPattern) {
          expect(sanitized).toMatch(payload.expectedPattern);
        }

        if (payload.unsafe) {
          for (const unsafeToken of payload.unsafe) {
            // Unsafe tokens must NOT appear as active raw HTML
            expect(sanitized.toLowerCase()).not.toContain(unsafeToken.toLowerCase() + ' ');
          }
        }

        if (payload.mustPreserve) {
          expect(sanitized).toBe(payload.mustPreserve);
        }
      }
    });

    it('C3.3: Static HTML PDF engine neutralizes script tags, iframes, and onerror handlers', () => {
      const hostileCV = {
        ...defaultSchema,
        profile: {
          name: '<script>alert("hacked")</script><b>Engineer</b>',
          subtitle: '<iframe src="evil.com"></iframe><i>Tech Lead</i>'
        },
        sections: [
          {
            id: 'profile_header',
            type: 'profile_header',
            column: 'left',
            items: [
              {
                id: 'p1',
                name: '<script>alert("hacked")</script><b>Engineer</b>',
                subtitle: '<iframe src="evil.com"></iframe><i>Tech Lead</i>'
              }
            ]
          },
          {
            id: 'sec_malicious',
            type: 'experience',
            title: '<img src=x onerror=alert(1)> Experiencia',
            column: 'right',
            items: [
              {
                id: 'item_bad',
                title: '<style>body{color:red}</style> Job Title',
                subtitle: '<a href="javascript:alert(1)">Company</a>',
                date: '2025',
                description: '<svg onload=alert(1)>Description</svg>',
                bullets: ['<script>evil()</script> bullet item']
              }
            ]
          }
        ]
      };

      const cleanHtml = generateCleanPrintHTML(hostileCV, 'es');

      // Must NOT contain live unescaped attack tags
      expect(cleanHtml).not.toContain('<script>alert("hacked")</script>');
      expect(cleanHtml).not.toContain('<iframe src="evil.com">');
      expect(cleanHtml).not.toContain('<img src=x onerror');
      expect(cleanHtml).not.toContain('<style>body{color:red}</style>');
      expect(cleanHtml).not.toContain('<svg onload');

      // Must preserve legitimate formatting
      expect(cleanHtml).toContain('<b>Engineer</b>');
      expect(cleanHtml).toContain('<i>Tech Lead</i>');
      expect(cleanHtml).toContain('Experiencia');
      expect(cleanHtml).toContain('Job Title');
      expect(cleanHtml).toContain('bullet item');
    });

    it('C3.4: Hostile paste committed via InlineEdit blur produces 0 executable scripts in DOM', async () => {
      const onSaveMock = vi.fn();
      render(
        <CVProvider>
          <InlineEdit value="Original" onSave={onSaveMock} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('inline-edit-display'));
      const editor = screen.getByRole('textbox');

      // Force raw HTML with attack vectors into contentEditable
      editor.innerHTML = '<script>window.__HACKED__ = true;</script><b>Safe Developer</b>';
      fireEvent.blur(editor);

      await act(async () => {
        await new Promise(r => setTimeout(r, 200));
      });

      expect(onSaveMock).toHaveBeenCalled();
      const saved = onSaveMock.mock.calls[0][0];

      // Verify the script tag is escaped as an entity, not executable
      expect(saved).toContain('&lt;script&gt;');
      expect(saved).toContain('<b>Safe Developer</b>');
      expect(window.__HACKED__).toBeUndefined();
    });

    it('C3.5: Obfuscated and nested hostile payloads preserve legitimate tags and escape attacks', () => {
      const payload = '<b>Level 1 <i>Level 2 <script src="http://xss.org"></script><u>Safe Underline</u></i></b>';
      const sanitized = sanitizeRichHTML(payload);
      expect(sanitized).toContain('<b>Level 1 <i>Level 2 ');
      expect(sanitized).toContain('&lt;script src=&quot;http://xss.org&quot;&gt;&lt;/script&gt;');
      expect(sanitized).toContain('<u>Safe Underline</u></i></b>');
      expect(sanitized).not.toContain('<script');
    });
  });

  // =========================================================================
  // TASK 4: Toolbar Geometry & Non-Overlapping Invariants Verification
  // =========================================================================
  describe('Task 4: Non-Overlapping Toolbar Positioning & Boundary Geometry', () => {
    const TOOLBAR_WIDTH = 290;
    const TOOLBAR_HEIGHT = 40;

    const checkOverlap = (rectA, rectB) => {
      // Return true if two bounding boxes intersect
      const horizontalOverlap = !(rectA.right <= rectB.left || rectA.left >= rectB.right);
      const verticalOverlap = !(rectA.bottom <= rectB.top || rectA.top >= rectB.bottom);
      return horizontalOverlap && verticalOverlap;
    };

    it('C4.1: Normal positioning above active element maintains vertical clearance (no overlap)', () => {
      const elementRect = {
        top: 250,
        bottom: 280,
        left: 200,
        right: 400,
        width: 200,
        height: 30
      };

      render(
        <RichTextToolbar
          visible={true}
          rect={elementRect}
          onFormat={vi.fn()}
          activeFormats={{ bold: false, italic: false, align: 'left' }}
        />
      );

      const toolbar = screen.getByTestId('rich-text-toolbar');
      const top = parseInt(toolbar.style.top, 10);
      const left = parseInt(toolbar.style.left, 10);

      const toolbarBox = {
        top,
        left,
        bottom: top + TOOLBAR_HEIGHT,
        right: left + TOOLBAR_WIDTH
      };

      // Toolbar must be positioned above element with >= 8px gap
      expect(toolbarBox.bottom).toBeLessThanOrEqual(elementRect.top);
      expect(elementRect.top - toolbarBox.bottom).toBeGreaterThanOrEqual(8);

      // Overlap must be strictly false
      expect(checkOverlap(toolbarBox, elementRect)).toBe(false);
    });

    it('C4.2: Top boundary condition (rect.top < 10px) flips toolbar below element (no overlap)', () => {
      const nearTopElement = {
        top: 8,
        bottom: 38,
        left: 150,
        right: 350,
        width: 200,
        height: 30
      };

      render(
        <RichTextToolbar
          visible={true}
          rect={nearTopElement}
          onFormat={vi.fn()}
          activeFormats={{ bold: false, italic: false, align: 'left' }}
        />
      );

      const toolbar = screen.getByTestId('rich-text-toolbar');
      const top = parseInt(toolbar.style.top, 10);
      const left = parseInt(toolbar.style.left, 10);

      const toolbarBox = {
        top,
        left,
        bottom: top + TOOLBAR_HEIGHT,
        right: left + TOOLBAR_WIDTH
      };

      // Flipped to bottom: toolbar.top must be >= element.bottom + 8
      expect(toolbarBox.top).toBeGreaterThanOrEqual(nearTopElement.bottom);
      expect(toolbarBox.top - nearTopElement.bottom).toBeGreaterThanOrEqual(8);

      // Overlap must be strictly false
      expect(checkOverlap(toolbarBox, nearTopElement)).toBe(false);
    });

    it('C4.3: Multi-coordinate boundary matrix verifies zero overlap across 20 distinct coordinates', () => {
      const viewports = [
        { vw: 1024, vh: 768 },
        { vw: 1440, vh: 900 },
        { vw: 1920, vh: 1080 }
      ];

      const testElements = [
        // Standard center
        { top: 200, bottom: 230, left: 300, right: 500, width: 200, height: 30 },
        { top: 400, bottom: 440, left: 250, right: 600, width: 350, height: 40 },
        { top: 500, bottom: 520, left: 100, right: 300, width: 200, height: 20 },
        // Near top (triggers flip below)
        { top: 2, bottom: 32, left: 200, right: 400, width: 200, height: 30 },
        { top: 5, bottom: 25, left: 50, right: 250, width: 200, height: 20 },
        { top: 9, bottom: 45, left: 400, right: 700, width: 300, height: 36 },
        // Mid-high (just enough room above)
        { top: 60, bottom: 90, left: 200, right: 400, width: 200, height: 30 },
        { top: 80, bottom: 110, left: 100, right: 300, width: 200, height: 30 }
      ];

      for (const vp of viewports) {
        window.innerWidth = vp.vw;
        window.innerHeight = vp.vh;

        for (const el of testElements) {
          const { unmount } = render(
            <RichTextToolbar
              visible={true}
              rect={el}
              onFormat={vi.fn()}
              activeFormats={{ bold: false, italic: false, align: 'left' }}
            />
          );

          const toolbar = screen.getByTestId('rich-text-toolbar');
          const top = parseInt(toolbar.style.top, 10);
          const left = parseInt(toolbar.style.left, 10);

          const toolbarBox = {
            top,
            left,
            bottom: top + TOOLBAR_HEIGHT,
            right: left + TOOLBAR_WIDTH
          };

          // Verification 1: Zero overlap with active editing element
          const overlap = checkOverlap(toolbarBox, el);
          expect(overlap).toBe(false);

          // Verification 2: Within viewport boundaries
          expect(toolbarBox.left).toBeGreaterThanOrEqual(16);
          expect(toolbarBox.right).toBeLessThanOrEqual(vp.vw);
          expect(toolbarBox.top).toBeGreaterThanOrEqual(10);
          expect(toolbarBox.bottom).toBeLessThanOrEqual(vp.vh);

          unmount();
        }
      }
    });

    it('C4.4: Right and left boundary clamping keeps toolbar fully visible inside viewport', () => {
      window.innerWidth = 800;
      window.innerHeight = 600;

      // Element far to the right (would cause toolbar to escape right edge)
      const farRightEl = {
        top: 200,
        bottom: 230,
        left: 700,
        right: 780,
        width: 80,
        height: 30
      };

      const { unmount } = render(
        <RichTextToolbar
          visible={true}
          rect={farRightEl}
          onFormat={vi.fn()}
          activeFormats={{ bold: false, italic: false, align: 'left' }}
        />
      );

      const toolbar = screen.getByTestId('rich-text-toolbar');
      const left = parseInt(toolbar.style.left, 10);

      // Clamped to window.innerWidth - TOOLBAR_WIDTH - 16 = 800 - 290 - 16 = 494
      expect(left).toBe(494);
      expect(left + TOOLBAR_WIDTH).toBeLessThanOrEqual(800 - 16);

      unmount();

      // Element off the left edge (e.g. left: -20)
      const farLeftEl = {
        top: 200,
        bottom: 230,
        left: -20,
        right: 50,
        width: 70,
        height: 30
      };

      render(
        <RichTextToolbar
          visible={true}
          rect={farLeftEl}
          onFormat={vi.fn()}
          activeFormats={{ bold: false, italic: false, align: 'left' }}
        />
      );

      const leftToolbar = screen.getByTestId('rich-text-toolbar');
      const clampedLeft = parseInt(leftToolbar.style.left, 10);
      expect(clampedLeft).toBe(16);
    });

    it('C4.5: Window resize and scroll events trigger dynamic coordinate recalculation', () => {
      const mockRect = {
        top: 200,
        bottom: 230,
        left: 100,
        right: 300,
        width: 200,
        height: 30
      };

      render(
        <RichTextToolbar
          visible={true}
          rect={mockRect}
          onFormat={vi.fn()}
          activeFormats={{ bold: false, italic: false, align: 'left' }}
        />
      );

      const toolbar = screen.getByTestId('rich-text-toolbar');
      expect(toolbar.style.top).toBe('152px'); // 200 - 40 - 8

      // Trigger resize event
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      expect(toolbar.style.top).toBe('152px');

      // Trigger scroll event
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });
      expect(toolbar.style.top).toBe('152px');
    });

    it('C4.6: Dynamically tracks real DOM activeElement getBoundingClientRect when rect prop is omitted', () => {
      const mockDomElem = document.createElement('div');
      mockDomElem.getBoundingClientRect = vi.fn(() => ({
        top: 300,
        bottom: 330,
        left: 250,
        right: 450,
        width: 200,
        height: 30
      }));

      render(
        <RichTextToolbar
          visible={true}
          activeElement={mockDomElem}
          onFormat={vi.fn()}
          activeFormats={{ bold: false, italic: false, align: 'left' }}
        />
      );

      const toolbar = screen.getByTestId('rich-text-toolbar');
      // top = 300 - 40 - 8 = 252px, left = 250px
      expect(toolbar.style.top).toBe('252px');
      expect(toolbar.style.left).toBe('250px');
    });
  });
});
