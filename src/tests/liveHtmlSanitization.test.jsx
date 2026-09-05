import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import InlineEdit from '../components/Editor/InlineEdit';
import { CVProvider } from '../context/CVContext';
import { 
  normalizeHtmlEntities, 
  decodeHtmlEntities, 
  escapeTextNode, 
  sanitizeRichHTML, 
  cleanLiveEditorHtml, 
  hasMalformedEntities,
  escapeHTML 
} from '../utils/richTextEngine';

describe('Live HTML Sanitization & Standard Entity Normalization Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // =========================================================================
  // Pillar 1: Standard Entity Normalization Core (Mathematical & Pattern Coverage)
  // =========================================================================
  describe('Pillar 1: Standard Entity Normalization Core', () => {
    it('1.1: Normalizes chained ampersand corruptions (;amp;amp, &amp;amp;, etc.) to standard entity', () => {
      expect(normalizeHtmlEntities('Software ;amp;amp Hardware')).toBe('Software &amp; Hardware');
      expect(normalizeHtmlEntities('Software ;amp;amp; Hardware')).toBe('Software &amp; Hardware');
      expect(normalizeHtmlEntities('Software &amp;amp; Hardware')).toBe('Software &amp; Hardware');
      expect(normalizeHtmlEntities('Software ;amp;amp;amp; Hardware')).toBe('Software &amp; Hardware');
      expect(normalizeHtmlEntities('Software &amp;amp;amp; Hardware')).toBe('Software &amp; Hardware');
      expect(normalizeHtmlEntities('Software &amp;;amp; Hardware')).toBe('Software &amp; Hardware');
    });

    it('1.2: Normalizes semicolon-prefixed entities with missing leading ampersand', () => {
      expect(normalizeHtmlEntities('Dev ;amp; Ops')).toBe('Dev &amp; Ops');
      expect(normalizeHtmlEntities('Dev ;amp Ops')).toBe('Dev &amp; Ops');
      expect(normalizeHtmlEntities('Formula: a ;lt; b')).toBe('Formula: a &lt; b');
      expect(normalizeHtmlEntities('Formula: a ;gt; b')).toBe('Formula: a &gt; b');
      expect(normalizeHtmlEntities('He said ;quot;Hello;quot;')).toBe('He said &quot;Hello&quot;');
      expect(normalizeHtmlEntities('John;apos;s Book')).toBe('John&apos;s Book');
      expect(normalizeHtmlEntities('Word;nbsp;Another')).toBe('Word&nbsp;Another');
      expect(normalizeHtmlEntities('Price: 100 ;euro;')).toBe('Price: 100 &euro;');
      expect(normalizeHtmlEntities('Price: 50 ;pound;')).toBe('Price: 50 &pound;');
      expect(normalizeHtmlEntities('Copyright ;copy; 2026')).toBe('Copyright &copy; 2026');
      expect(normalizeHtmlEntities('Brand ;trade;')).toBe('Brand &trade;');
      expect(normalizeHtmlEntities('Registered ;reg;')).toBe('Registered &reg;');
    });

    it('1.3: Normalizes numeric entities (decimal and hex) with missing or malformed prefixes', () => {
      expect(normalizeHtmlEntities('Code: ;#38;')).toBe('Code: &#38;');
      expect(normalizeHtmlEntities('Code: ;#x26;')).toBe('Code: &#x26;');
      expect(normalizeHtmlEntities('Code: &amp;#38;')).toBe('Code: &#38;');
      expect(normalizeHtmlEntities('Code: &amp;#x26;')).toBe('Code: &#x26;');
    });

    it('1.4: Recursively unwraps double/multi-escaped entities until canonical', () => {
      expect(normalizeHtmlEntities('Text &amp;lt;div&amp;gt;')).toBe('Text &lt;div&gt;');
      expect(normalizeHtmlEntities('&amp;quot;Title&amp;quot;')).toBe('&quot;Title&quot;');
      expect(normalizeHtmlEntities('&amp;apos;Subtitle&amp;apos;')).toBe('&apos;Subtitle&apos;');
      expect(normalizeHtmlEntities('Chained &amp;amp;amp;lt; Nested')).toBe('Chained &lt; Nested');
    });

    it('1.5: Decodes entities into clean Unicode characters via decodeHtmlEntities', () => {
      expect(decodeHtmlEntities('AT&amp;T')).toBe('AT&T');
      expect(decodeHtmlEntities('AT;amp;amp;T')).toBe('AT&T');
      expect(decodeHtmlEntities('&copy; 2026 &euro;50')).toBe('© 2026 €50');
      expect(decodeHtmlEntities('&#38; and &#x26;')).toBe('& and &');
      expect(decodeHtmlEntities('&quot;Hello&quot; &amp; &apos;World&apos;')).toBe('"Hello" & \'World\'');
      expect(decodeHtmlEntities('&lt;tag&gt;')).toBe('<tag>');
    });

    it('1.6: escapeTextNode escapes unescaped symbols without double-escaping valid entities', () => {
      expect(escapeTextNode('Tom & Jerry')).toBe('Tom &amp; Jerry');
      expect(escapeTextNode('Tom &amp; Jerry')).toBe('Tom &amp; Jerry');
      expect(escapeTextNode('Tom ;amp;amp Jerry')).toBe('Tom &amp; Jerry');
      expect(escapeTextNode('Score < 10 && Score > 5')).toBe('Score &lt; 10 &amp;&amp; Score &gt; 5');
      // Full idempotency
      const firstPass = escapeTextNode('Score < 10 && Score > 5');
      expect(escapeTextNode(firstPass)).toBe(firstPass);
    });

    it('1.7: hasMalformedEntities accurately detects corrupt patterns', () => {
      expect(hasMalformedEntities('Software ;amp;amp Hardware')).toBe(true);
      expect(hasMalformedEntities('Software &amp;amp; Hardware')).toBe(true);
      expect(hasMalformedEntities('Price: ;euro; 50')).toBe(true);
      expect(hasMalformedEntities('&amp;lt;div&gt;')).toBe(true);
      expect(hasMalformedEntities(';#38;')).toBe(true);
      expect(hasMalformedEntities('Normal clean text')).toBe(false);
      expect(hasMalformedEntities('Clean &amp; valid')).toBe(false);
    });
  });

  // =========================================================================
  // Pillar 2: Rich Text HTML Sanitization Integration (sanitizeRichHTML)
  // =========================================================================
  describe('Pillar 2: Rich Text HTML Sanitization Integration', () => {
    it('2.1: Sanitizes malformed entities within formatted rich HTML', () => {
      const input = '<b>Software ;amp;amp Hardware</b>';
      const output = sanitizeRichHTML(input);
      expect(output).toBe('<b>Software &amp; Hardware</b>');
    });

    it('2.2: Preserves allowed formatting tags while fixing nested corrupt entities', () => {
      const input = '<i>Design</i> &amp;amp; <strong>Architecture ;amp; Engineering</strong>';
      const output = sanitizeRichHTML(input);
      expect(output).toBe('<i>Design</i> &amp; <strong>Architecture &amp; Engineering</strong>');
    });

    it('2.3: Preserves text-align containers and sanitizes their text contents', () => {
      const input = '<div style="text-align: center;">AT&amp;amp;T ;amp; Verizon</div>';
      const output = sanitizeRichHTML(input);
      expect(output).toBe('<div style="text-align: center;">AT&amp;T &amp; Verizon</div>');
    });

    it('2.4: Guarantees strict idempotency across multiple sanitizeRichHTML passes', () => {
      const input = '<div><b>Senior ;amp;amp Lead</b>: Python &amp;amp; C++ <script>alert(1)</script></div>';
      const pass1 = sanitizeRichHTML(input);
      const pass2 = sanitizeRichHTML(pass1);
      const pass3 = sanitizeRichHTML(pass2);

      expect(pass1).toBe('<div><b>Senior &amp; Lead</b>: Python &amp; C++ &lt;script&gt;alert(1)&lt;/script&gt;</div>');
      expect(pass2).toBe(pass1);
      expect(pass3).toBe(pass1);
    });

    it('2.5: Neutralizes XSS attack vectors while sanitizing entities', () => {
      const hostile = '<b>Safe</b> <script>window.hack=1</script> <img src=x onerror=alert(1)> ;amp;amp';
      const clean = sanitizeRichHTML(hostile);
      expect(clean).toContain('<b>Safe</b>');
      expect(clean).toContain('&lt;script&gt;');
      expect(clean).toContain('&lt;img src=x onerror=alert(1)&gt;');
      expect(clean).toContain('&amp;');
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('<img');
    });
  });

  // =========================================================================
  // Pillar 3: Live In-Editor Sanitization (InlineEdit.jsx)
  // =========================================================================
  describe('Pillar 3: Live In-Editor Sanitization in InlineEdit.jsx', () => {
    it('3.1: Sanitizes malformed ;amp;amp live on input event inside contentEditable', () => {
      const onSaveMock = vi.fn();
      render(
        <CVProvider>
          <InlineEdit value="Initial Title" onSave={onSaveMock} />
        </CVProvider>
      );

      // Open editor
      fireEvent.click(screen.getByTestId('inline-edit-display'));
      const editor = screen.getByRole('textbox');

      // Simulate user typing a malformed entity
      editor.innerHTML = 'Software ;amp;amp Hardware';
      fireEvent.input(editor);

      // Live contentEditable innerHTML must be sanitized immediately
      expect(editor.innerHTML).toBe('Software &amp; Hardware');
    });

    it('3.2: Sanitizes double-escaped &amp;amp; live on input event', () => {
      render(
        <CVProvider>
          <InlineEdit value="Tech Stack" onSave={vi.fn()} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('inline-edit-display'));
      const editor = screen.getByRole('textbox');

      editor.innerHTML = 'React &amp;amp; Node.js';
      fireEvent.input(editor);

      expect(editor.innerHTML).toBe('React &amp; Node.js');
    });

    it('3.3: Sanitizes semicolon-prefixed ;lt; and ;gt; live on input event', () => {
      render(
        <CVProvider>
          <InlineEdit value="Exp" onSave={vi.fn()} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('inline-edit-display'));
      const editor = screen.getByRole('textbox');

      editor.innerHTML = 'Experience ;gt; 5 years &amp; ;lt; 10 years';
      fireEvent.input(editor);

      expect(editor.innerHTML).toBe('Experience &gt; 5 years &amp; &lt; 10 years');
    });

    it('3.4: Sanitizes clipboard text containing malformed entities on paste', () => {
      render(
        <CVProvider>
          <InlineEdit value="Pasting" onSave={vi.fn()} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('inline-edit-display'));
      const editor = screen.getByRole('textbox');

      const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
      pasteEvent.clipboardData = {
        getData: vi.fn().mockReturnValue('DevOps ;amp;amp SRE')
      };

      fireEvent(editor, pasteEvent);

      expect(editor.innerHTML).toContain('DevOps &amp; SRE');
    });

    it('3.5: Sanitizes on blur and persists clean value through onSave callback', async () => {
      const onSaveMock = vi.fn();
      render(
        <CVProvider>
          <InlineEdit value="Clean Start" onSave={onSaveMock} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('inline-edit-display'));
      const editor = screen.getByRole('textbox');

      editor.innerHTML = '<b>Architect</b> ;amp;amp <i>Consultant</i>';
      fireEvent.blur(editor);

      await act(async () => {
        await new Promise(r => setTimeout(r, 200));
      });

      expect(onSaveMock).toHaveBeenCalledWith('<b>Architect</b> &amp; <i>Consultant</i>');
    });

    it('3.6: Mounts existing corrupted strings from state into sanitized contentEditable', () => {
      render(
        <CVProvider>
          <InlineEdit value="Pre-existing ;amp;amp Corrupted" onSave={vi.fn()} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('inline-edit-display'));
      const editor = screen.getByRole('textbox');

      // Mounted value must already be cleaned
      expect(editor.innerHTML).toBe('Pre-existing &amp; Corrupted');
    });

    it('3.7: InlineEdit print view renders clean sanitized rich HTML', () => {
      const { container } = render(
        <InlineEdit 
          isPrint={true} 
          value="<b>Lead</b> ;amp;amp <i>Director</i>" 
        />
      );

      expect(container.innerHTML).toContain('<b>Lead</b> &amp; <i>Director</i>');
      expect(container.innerHTML).not.toContain(';amp;amp');
    });
  });
});
