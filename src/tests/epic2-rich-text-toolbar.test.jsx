import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import RichTextToolbar from '../components/Editor/RichTextToolbar';
import InlineEdit from '../components/Editor/InlineEdit';
import { CVProvider, useCV } from '../context/CVContext';
import { defaultSchema } from '../utils/schema';
import { generateCleanPrintHTML } from '../utils/staticHtmlPdfEngine';
import { 
  extractAlignment, 
  applyAlignment, 
  stripOuterAlignment, 
  sanitizeRichHTML, 
  parseHtmlToTokens 
} from '../utils/richTextEngine';

describe('Epic 2: Rich Inline Text Editing Toolbar with Persistent State', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // =========================================================================
  // Suite 1: RichTextToolbar Component & AGENTS.md Rule 3 Dynamic Positioning
  // =========================================================================
  describe('Suite 1: RichTextToolbar Component & Rule 3 Positioning', () => {
    it('T1.1: renders all 8 formatting and alignment buttons when visible', () => {
      render(
        <RichTextToolbar
          visible={true}
          activeElement={null}
          onFormat={vi.fn()}
          activeFormats={{ bold: false, italic: false, align: 'left' }}
        />
      );

      expect(screen.getByTestId('rich-text-toolbar')).toBeInTheDocument();
      expect(screen.getByTestId('btn-format-bold')).toBeInTheDocument();
      expect(screen.getByTestId('btn-format-italic')).toBeInTheDocument();
      expect(screen.getByTestId('btn-format-align-left')).toBeInTheDocument();
      expect(screen.getByTestId('btn-format-align-center')).toBeInTheDocument();
      expect(screen.getByTestId('btn-format-align-right')).toBeInTheDocument();
      expect(screen.getByTestId('btn-format-align-justify')).toBeInTheDocument();
      expect(screen.getByTestId('btn-format-undo')).toBeInTheDocument();
      expect(screen.getByTestId('btn-format-redo')).toBeInTheDocument();
    });

    it('T1.2: preserves selection on mouse down and runs each command once on click', () => {
      const onFormatMock = vi.fn();
      render(
        <RichTextToolbar
          visible={true}
          activeElement={null}
          onFormat={onFormatMock}
          activeFormats={{ bold: false, italic: false, align: 'left' }}
        />
      );

      const boldBtn = screen.getByTestId('btn-format-bold');
      const mousedownEvt = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      const preventSpy = vi.spyOn(mousedownEvt, 'preventDefault');

      boldBtn.dispatchEvent(mousedownEvt);
      expect(preventSpy).toHaveBeenCalled();
      expect(onFormatMock).not.toHaveBeenCalled();
      fireEvent.click(boldBtn);
      expect(onFormatMock).toHaveBeenCalledTimes(1);
      expect(onFormatMock).toHaveBeenCalledWith('bold');

      const alignCenterBtn = screen.getByTestId('btn-format-align-center');
      fireEvent.click(alignCenterBtn);
      expect(onFormatMock).toHaveBeenCalledTimes(2);
      expect(onFormatMock).toHaveBeenLastCalledWith('justifyCenter');
    });

    it('T1.3: positions toolbar directly above active element (Rule 3 non-obstructive)', () => {
      const mockRect = { top: 200, left: 150, right: 350, bottom: 230, width: 200, height: 30 };
      render(
        <RichTextToolbar
          visible={true}
          rect={mockRect}
          onFormat={vi.fn()}
          activeFormats={{ bold: false, italic: false, align: 'left' }}
        />
      );

      const toolbar = screen.getByTestId('rich-text-toolbar');
      // top = rect.top - 40 - 8 = 152px
      expect(toolbar.style.top).toBe('152px');
      expect(toolbar.style.left).toBe('150px');
    });

    it('T1.4: flips toolbar below element when approaching top viewport boundary (rect.top < 10px)', () => {
      const mockTopRect = { top: 5, left: 100, right: 300, bottom: 35, width: 200, height: 30 };
      render(
        <RichTextToolbar
          visible={true}
          rect={mockTopRect}
          onFormat={vi.fn()}
          activeFormats={{ bold: false, italic: false, align: 'left' }}
        />
      );

      const toolbar = screen.getByTestId('rich-text-toolbar');
      // top < 10 -> flips to bottom: rect.bottom + 8 = 35 + 8 = 43px
      expect(toolbar.style.top).toBe('43px');
    });

    it('T1.5: shifts/clamps horizontally when approaching window.innerWidth', () => {
      const originalInnerWidth = window.innerWidth;
      window.innerWidth = 500;

      const mockNearRightRect = { top: 200, left: 450, right: 490, bottom: 230, width: 40, height: 30 };
      render(
        <RichTextToolbar
          visible={true}
          rect={mockNearRightRect}
          onFormat={vi.fn()}
          activeFormats={{ bold: false, italic: false, align: 'left' }}
        />
      );

      const toolbar = screen.getByTestId('rich-text-toolbar');
      // left + 290 > 500 - 16 -> clamped to 500 - 290 - 16 = 194px
      expect(toolbar.style.left).toBe('194px');

      window.innerWidth = originalInnerWidth;
    });

    it('T1.6: clamps vertically to prevent escaping window.innerHeight', () => {
      const originalInnerHeight = window.innerHeight;
      window.innerHeight = 600;

      const mockBottomRect = { top: 590, left: 100, right: 300, bottom: 620, width: 200, height: 30 };
      render(
        <RichTextToolbar
          visible={true}
          rect={mockBottomRect}
          onFormat={vi.fn()}
          activeFormats={{ bold: false, italic: false, align: 'left' }}
        />
      );

      const toolbar = screen.getByTestId('rich-text-toolbar');
      // top clamped to window.innerHeight - 40 - 10 = 550px
      expect(toolbar.style.top).toBe('542px');

      window.innerHeight = originalInnerHeight;
    });

    it('T1.7: highlights active formatting states on buttons (bold, italic, alignment)', () => {
      render(
        <RichTextToolbar
          visible={true}
          activeElement={null}
          onFormat={vi.fn()}
          activeFormats={{ bold: true, italic: true, align: 'center' }}
        />
      );

      const boldBtn = screen.getByTestId('btn-format-bold');
      const italicBtn = screen.getByTestId('btn-format-italic');
      const centerBtn = screen.getByTestId('btn-format-align-center');
      const leftBtn = screen.getByTestId('btn-format-align-left');

      expect(boldBtn).toHaveAttribute('aria-pressed', 'true');
      expect(italicBtn).toHaveAttribute('aria-pressed', 'true');
      expect(centerBtn).toHaveAttribute('aria-pressed', 'true');
      expect(leftBtn).toHaveAttribute('aria-pressed', 'false');
    });
  });

  // =========================================================================
  // Suite 2: InlineEdit Rich-Text contentEditable & Keyboard Shortcuts
  // =========================================================================
  describe('Suite 2: InlineEdit Rich-Text contentEditable & Keyboard Shortcuts', () => {
    it('T2.1: preserves 100% backward compatibility for plain strings in unedited mode', () => {
      render(
        <CVProvider>
          <InlineEdit value="Desarrollador Web Senior" onSave={vi.fn()} />
        </CVProvider>
      );

      const display = screen.getByTestId('inline-edit-display');
      expect(display).toBeInTheDocument();
      expect(display.textContent).toBe('Desarrollador Web Senior');
      expect(display.style.cursor).toBe('text');
    });

    it('T2.2: switches to contentEditable and renders formatting toolbar on click', () => {
      render(
        <CVProvider>
          <InlineEdit value="Ingeniero de Software" onSave={vi.fn()} />
        </CVProvider>
      );

      const display = screen.getByTestId('inline-edit-display');
      fireEvent.click(display);

      const editor = screen.getByRole('textbox');
      expect(editor).toBeInTheDocument();
      expect(editor).toHaveAttribute('contenteditable', 'true');
      expect(screen.getByTestId('rich-text-toolbar')).toBeInTheDocument();
    });

    it('T2.3: Ctrl+B toggles bold formatting via keyboard shortcut', () => {
      const onSaveMock = vi.fn();
      render(
        <CVProvider>
          <InlineEdit value="Arquitecto Cloud" onSave={onSaveMock} />
        </CVProvider>
      );

      const display = screen.getByTestId('inline-edit-display');
      fireEvent.click(display);

      const editor = screen.getByRole('textbox');
      // Fire Ctrl+B
      fireEvent.keyDown(editor, { key: 'b', ctrlKey: true });

      expect(editor.innerHTML).toContain('<b>Arquitecto Cloud</b>');
    });

    it('T2.4: Ctrl+I toggles italic formatting via keyboard shortcut', () => {
      render(
        <CVProvider>
          <InlineEdit value="Líder Técnico" onSave={vi.fn()} />
        </CVProvider>
      );

      const display = screen.getByTestId('inline-edit-display');
      fireEvent.click(display);

      const editor = screen.getByRole('textbox');
      fireEvent.keyDown(editor, { key: 'i', ctrlKey: true });

      expect(editor.innerHTML).toContain('<i>Líder Técnico</i>');
    });

    it('T2.4a: toolbar clicks apply bold and italic once without immediately toggling them off', () => {
      render(
        <CVProvider>
          <InlineEdit value="Texto con formato" onSave={vi.fn()} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('inline-edit-display'));
      const editor = screen.getByRole('textbox');

      const boldButton = screen.getByTestId('btn-format-bold');
      fireEvent.mouseDown(boldButton);
      fireEvent.click(boldButton);
      expect(editor.innerHTML).toContain('<b>Texto con formato</b>');

      const italicButton = screen.getByTestId('btn-format-italic');
      fireEvent.mouseDown(italicButton);
      fireEvent.click(italicButton);
      expect(editor.innerHTML).toContain('<i><b>Texto con formato</b></i>');
    });

    it('T2.5: alignment buttons update field text-align and toolbar state', () => {
      render(
        <CVProvider>
          <InlineEdit value="Título Centrado" onSave={vi.fn()} />
        </CVProvider>
      );

      const display = screen.getByTestId('inline-edit-display');
      fireEvent.click(display);

      const editor = screen.getByRole('textbox');
      const centerBtn = screen.getByTestId('btn-format-align-center');
      fireEvent.click(centerBtn);

      expect(editor.style.textAlign).toBe('center');
      expect(centerBtn).toHaveAttribute('aria-pressed', 'true');

      const rightBtn = screen.getByTestId('btn-format-align-right');
      fireEvent.click(rightBtn);

      expect(editor.style.textAlign).toBe('right');
      expect(rightBtn).toHaveAttribute('aria-pressed', 'true');
    });

    it('T2.6: Ctrl+Z and Ctrl+Y execute in-field undo and redo', () => {
      render(
        <CVProvider>
          <InlineEdit value="Estado Inicial" onSave={vi.fn()} />
        </CVProvider>
      );

      const display = screen.getByTestId('inline-edit-display');
      fireEvent.click(display);

      const editor = screen.getByRole('textbox');

      // 1. Make bold
      fireEvent.keyDown(editor, { key: 'b', ctrlKey: true });
      expect(editor.innerHTML).toContain('<b>Estado Inicial</b>');

      // 2. Undo via Ctrl+Z
      fireEvent.keyDown(editor, { key: 'z', ctrlKey: true });
      expect(editor.innerHTML).not.toContain('<b>');

      // 3. Redo via Ctrl+Y
      fireEvent.keyDown(editor, { key: 'y', ctrlKey: true });
      expect(editor.innerHTML).toContain('<b>Estado Inicial</b>');
    });

    it('T2.7: Escape key cancels pending changes and restores original value', async () => {
      const onSaveMock = vi.fn();
      render(
        <CVProvider>
          <InlineEdit value="Texto Original" onSave={onSaveMock} />
        </CVProvider>
      );

      const display = screen.getByTestId('inline-edit-display');
      fireEvent.click(display);

      const editor = screen.getByRole('textbox');
      fireEvent.keyDown(editor, { key: 'b', ctrlKey: true });
      expect(editor.innerHTML).toContain('<b>Texto Original</b>');

      // Press Escape
      fireEvent.keyDown(editor, { key: 'Escape' });

      // Wait for blur timeout
      await act(async () => {
        await new Promise(r => setTimeout(r, 200));
      });

      expect(onSaveMock).not.toHaveBeenCalled();
    });

    it('T2.8: Single-line mode commits edit on Enter; multiline mode allows Enter', async () => {
      const onSaveMock = vi.fn();
      render(
        <CVProvider>
          <InlineEdit value="Línea Única" onSave={onSaveMock} multiline={false} />
        </CVProvider>
      );

      const display = screen.getByTestId('inline-edit-display');
      fireEvent.click(display);

      const editor = screen.getByRole('textbox');
      fireEvent.keyDown(editor, { key: 'b', ctrlKey: true });

      // Press Enter in single-line
      fireEvent.keyDown(editor, { key: 'Enter' });

      await act(async () => {
        await new Promise(r => setTimeout(r, 200));
      });

      expect(onSaveMock).toHaveBeenCalledWith('<b>Línea Única</b>');
    });

    it('T2.9: Paste sanitization intercepts paste and strips external HTML styling', () => {
      render(
        <CVProvider>
          <InlineEdit value="" onSave={vi.fn()} />
        </CVProvider>
      );

      const display = screen.getByTestId('inline-edit-display');
      fireEvent.click(display);

      const editor = screen.getByRole('textbox');

      const pasteData = {
        getData: (format) => format === 'text/plain' ? 'Texto Seguro Pegado' : '<span style="font-size:40pt">bad</span>'
      };

      fireEvent.paste(editor, { clipboardData: pasteData });
      expect(editor.textContent).toContain('Texto Seguro Pegado');
    });
  });

  // =========================================================================
  // Suite 3: State Persistence in cvData & localStorage
  // =========================================================================
  describe('Suite 3: State Persistence in cvData & localStorage', () => {
    it('T3.1: Formatted HTML with bold and alignment saves properly via onSave', async () => {
      const onSaveMock = vi.fn();
      render(
        <CVProvider>
          <InlineEdit value="Desarrollador" onSave={onSaveMock} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('inline-edit-display'));
      const editor = screen.getByRole('textbox');

      // Bold + Center
      fireEvent.keyDown(editor, { key: 'b', ctrlKey: true });
      const centerButton = screen.getByTestId('btn-format-align-center');
      fireEvent.mouseDown(centerButton);
      fireEvent.click(centerButton);

      fireEvent.blur(editor);

      await act(async () => {
        await new Promise(r => setTimeout(r, 200));
      });

      expect(onSaveMock).toHaveBeenCalledWith('<div style="text-align: center;"><b>Desarrollador</b></div>');
    });

    it('T3.2: Persists rich formatted strings in localStorage and restores them upon reload', () => {
      const richCV = {
        ...defaultSchema,
        profile: {
          name: '<div style="text-align: center;"><b>CARRIZO</b> JUAN</div>',
          subtitle: '<i>Senior Full-Stack Architect</i>'
        }
      };

      localStorage.setItem('cvData', JSON.stringify(richCV));

      const Consumer = () => {
        const { cvData } = useCV();
        return (
          <div>
            <div data-testid="cv-name">{cvData.profile.name}</div>
            <div data-testid="cv-subtitle">{cvData.profile.subtitle}</div>
          </div>
        );
      };

      render(
        <CVProvider>
          <Consumer />
        </CVProvider>
      );

      expect(screen.getByTestId('cv-name').textContent).toBe('<div style="text-align: center;"><b>CARRIZO</b> JUAN</div>');
      expect(screen.getByTestId('cv-subtitle').textContent).toBe('<i>Senior Full-Stack Architect</i>');
    });
  });

  // =========================================================================
  // Suite 4: CVContext Window Shortcut Isolation (Task 3)
  // =========================================================================
  describe('Suite 4: CVContext Window Shortcut Isolation', () => {
    it('T4.1: Window Ctrl+Z listener does NOT hijack editing when activeElement is editable', () => {
      let contextUndoCalled = false;
      const Consumer = () => {
        const cv = useCV();
        return (
          <div>
            <div contentEditable data-testid="editable-area" />
            <button 
              data-testid="trigger-state-change" 
              onClick={() => cv.updateProfile('name', 'New Name')}
            >
              Update
            </button>
          </div>
        );
      };

      render(
        <CVProvider>
          <Consumer />
        </CVProvider>
      );

      // Create history entry
      fireEvent.click(screen.getByTestId('trigger-state-change'));

      const editable = screen.getByTestId('editable-area');
      editable.focus();

      // Fire global window keydown while inside editable
      const keydownEvt = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true });
      const preventSpy = vi.spyOn(keydownEvt, 'preventDefault');

      window.dispatchEvent(keydownEvt);

      // Global window listener must NOT preventDefault because focus is in an editable area!
      expect(preventSpy).not.toHaveBeenCalled();
    });

    it('T4.2: Window Ctrl+Z listener executes undo normally when focused outside editable elements', () => {
      const Consumer = () => {
        const cv = useCV();
        return (
          <div>
            <div data-testid="non-editable">Non-editable</div>
            <button 
              data-testid="btn-change-state" 
              onClick={() => cv.updateProfile('name', 'Changed Name')}
            >
              Change
            </button>
            <div data-testid="current-name">{cv.cvData.profile?.name}</div>
          </div>
        );
      };

      render(
        <CVProvider>
          <Consumer />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('btn-change-state'));
      expect(screen.getByTestId('current-name').textContent).toBe('Changed Name');

      // Focus non-editable element
      screen.getByTestId('non-editable').focus();

      act(() => {
        const keydownEvt = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true });
        window.dispatchEvent(keydownEvt);
      });

      expect(screen.getByTestId('current-name').textContent).toBe(defaultSchema.profile?.name || '');
    });
  });

  // =========================================================================
  // Suite 5: Cross-Engine Rich Text Rendering (staticHtmlPdfEngine & React-PDF)
  // =========================================================================
  describe('Suite 5: Cross-Engine Rich Text Rendering', () => {
    it('T5.1: staticHtmlPdfEngine preserves <b>, <i>, and alignment without escaping to &lt;b&gt;', () => {
      const richCV = {
        ...defaultSchema,
        profile: {
          name: '<div style="text-align: center;"><b>JUAN IGNACIO</b></div>',
          subtitle: '<i>Senior Engineer</i>'
        },
        sections: [
          {
            id: 'profile_header',
            type: 'profile_header',
            column: 'left',
            items: [
              {
                id: 'prof_item',
                name: '<div style="text-align: center;"><b>JUAN IGNACIO</b></div>',
                subtitle: '<i>Senior Engineer</i>'
              }
            ]
          },
          {
            id: 'exp_rich',
            type: 'experience',
            title: '<b>Experiencia</b> Profesional',
            column: 'right',
            items: [
              {
                id: 'item1',
                title: 'Tech Lead <b>Fintech</b>',
                subtitle: '<i>Startup</i>',
                date: '2024',
                description: '<div style="text-align: justify;">Diseño de microservicios.</div>',
                bullets: ['Liderazgo de <b>5</b> ingenieros']
              }
            ]
          }
        ]
      };

      const html = generateCleanPrintHTML(richCV, 'es');

      // Preserves legitimate tags
      expect(html).toContain('<b>JUAN IGNACIO</b>');
      expect(html).toContain('<i>Senior Engineer</i>');
      expect(html).toContain('<b>Experiencia</b> Profesional');
      expect(html).toContain('Tech Lead <b>Fintech</b>');
      expect(html).toContain('text-align: center;');
      expect(html).toContain('text-align: justify;');
      expect(html).toContain('<b>5</b> ingenieros');

      // Does NOT escape into literal &lt;b&gt;
      expect(html).not.toContain('&lt;b&gt;JUAN IGNACIO&lt;/b&gt;');
      expect(html).not.toContain('&lt;b&gt;Fintech&lt;/b&gt;');
    });

    it('T5.2: staticHtmlPdfEngine neutralizes XSS and script injections while preserving rich text', () => {
      const maliciousCV = {
        ...defaultSchema,
        profile: {
          name: '<b>Juan</b> <script>alert("hack")</script>',
          subtitle: '<img src=x onerror=alert(1)>'
        }
      };

      const html = generateCleanPrintHTML(maliciousCV, 'es');

      expect(html).toContain('<b>Juan</b>');
      expect(html).not.toContain('<script>alert("hack")</script>');
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<img src=x onerror');
      expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    });

    it('T5.3: parseHtmlToTokens tokenizes bold, italic, and alignment cleanly', () => {
      const parsed = parseHtmlToTokens('<div style="text-align: center;"><b>Senior</b> <i>Developer</i></div>');
      expect(parsed.align).toBe('center');
      expect(parsed.tokens.some(t => t.text.includes('Senior') && t.bold)).toBe(true);
      expect(parsed.tokens.some(t => t.text.includes('Developer') && t.italic)).toBe(true);
    });

    it('T5.4: richTextEngine utility functions correctly handle edge cases', () => {
      // extractAlignment
      expect(extractAlignment('<div style="text-align: right;">test</div>')).toBe('right');
      expect(extractAlignment('plain text')).toBe('left');
      expect(extractAlignment(null)).toBe('left');

      // applyAlignment
      expect(applyAlignment('<b>Text</b>', 'center')).toBe('<div style="text-align: center;"><b>Text</b></div>');
      expect(applyAlignment('<div style="text-align: center;"><b>Text</b></div>', 'left')).toBe('<b>Text</b>');
      expect(applyAlignment('', 'center')).toBe('');

      // stripOuterAlignment
      expect(stripOuterAlignment('<div style="text-align: justify;">Content</div>')).toEqual({
        alignment: 'justify',
        innerHtml: 'Content'
      });

      // parseHtmlToTokens
      const tokenized = parseHtmlToTokens('<div style="text-align: right;">Hello <b>World</b>!</div>');
      expect(tokenized.align).toBe('right');
      expect(tokenized.tokens).toEqual([
        { text: 'Hello ', bold: false, italic: false },
        { text: 'World', bold: true, italic: false },
        { text: '!', bold: false, italic: false }
      ]);
    });
  });
});
