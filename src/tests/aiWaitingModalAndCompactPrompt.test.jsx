import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AIExportModal from '../components/Editor/AIExportModal.jsx';
import TranslationModal from '../components/Editor/TranslationModal.jsx';
import { CVProvider } from '../context/CVContext.jsx';

describe('AI Waiting Modal & Compact Prompt UX Suite', () => {

  const baseMockCV = {
    profile: {
      name: 'Ada Lovelace'
    },
    layout: {
      type: '1-column',
      isAtsMode: true,
      fontFamily: 'Inter',
      fontScale: 1.0,
      pagePadding: 24,
      sectionGap: 20,
      itemGap: 8
    },
    sections: [
      {
        id: 'profile_header',
        column: 'left',
        type: 'profile_header',
        items: [{
          id: 'ph1',
          name: 'Ada Lovelace',
          subtitle: 'First Computer Programmer',
          email: 'ada@analytical.engine',
          phone: '+44 20 7946 0991'
        }]
      },
      {
        id: 'experience',
        column: 'left',
        type: 'list',
        title: 'WORK EXPERIENCE',
        items: [{
          id: 'exp1',
          title: 'Computing Pioneer',
          subtitle: 'Analytical Engine Project',
          date: '1843',
          bullets: ['Published the first algorithm intended to be executed by a machine.']
        }]
      }
    ]
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Collapsible Prompt Preview (Eliminates Visual Fatigue)', () => {
    it('1.1: renders prompt preview in compact mode by default with toggle button', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const preview = screen.getByTestId('ai-payload-preview');
      expect(preview).toBeInTheDocument();
      expect(preview.style.maxHeight).toBe('44px');
      expect(preview.style.fontSize).toBe('0.68rem');

      const toggleBtn = screen.getByTestId('ai-toggle-prompt-btn');
      expect(toggleBtn).toBeInTheDocument();
      expect(toggleBtn.textContent).toContain('Ver prompt completo');
    });

    it('1.2: expands prompt preview when clicking toggle button, then collapses when clicking again', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const toggleBtn = screen.getByTestId('ai-toggle-prompt-btn');
      const preview = screen.getByTestId('ai-payload-preview');

      // Click to expand
      fireEvent.click(toggleBtn);
      expect(preview.style.maxHeight).toBe('260px');
      expect(preview.style.fontSize).toBe('0.8rem');
      expect(toggleBtn.textContent).toContain('Ocultar prompt');

      // Click to collapse again
      fireEvent.click(toggleBtn);
      expect(preview.style.maxHeight).toBe('44px');
      expect(preview.style.fontSize).toBe('0.68rem');
      expect(toggleBtn.textContent).toContain('Ver prompt completo');
    });
  });

  describe('2. Two-Way AI Flow & Waiting Screen (Bring Your Own CV & Translation)', () => {
    it('2.1: enters dedicated Waiting State when clicking copy button on translate_english prompt', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
          readText: vi.fn().mockResolvedValue('')
        }
      });

      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const promptSelect = screen.getByTestId('ai-prompt-select');
      fireEvent.change(promptSelect, { target: { value: 'translate_english' } });

      // Before copying, waiting banner is not shown
      expect(screen.queryByTestId('ai-waiting-banner')).not.toBeInTheDocument();

      // Click copy button
      const copyBtn = screen.getByTestId('ai-copy-btn');
      await act(async () => {
        fireEvent.click(copyBtn);
      });

      expect(writeTextMock).toHaveBeenCalledTimes(1);

      // Dedicated waiting banner should now be rendered
      const waitingBanner = screen.getByTestId('ai-waiting-banner');
      expect(waitingBanner).toBeInTheDocument();
      expect(waitingBanner.textContent).toContain('Esperando respuesta de tu IA externa...');
      expect(waitingBanner.textContent).toContain('1. Prompt copiado');
      expect(waitingBanner.textContent).toContain('2. Ve a tu IA externa');
      expect(waitingBanner.textContent).toContain('3. Copia el JSON');
      expect(waitingBanner.textContent).toContain('4. Pega aquí abajo');

      // External AI quick launchers are present
      expect(screen.getByText('ChatGPT')).toBeInTheDocument();
      expect(screen.getByText('Claude')).toBeInTheDocument();
      expect(screen.getByText('Gemini')).toBeInTheDocument();
      expect(screen.getByText('DeepSeek')).toBeInTheDocument();

      // Giant response textarea is present
      const textarea = screen.getByTestId('ai-response-input');
      expect(textarea).toBeInTheDocument();
      expect(textarea.style.minHeight).toBe('260px');
    });

    it('2.2: enters dedicated Waiting State on bring_your_own_cv and allows returning to setup', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
          readText: vi.fn().mockResolvedValue('')
        }
      });

      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const promptSelect = screen.getByTestId('ai-prompt-select');
      fireEvent.change(promptSelect, { target: { value: 'bring_your_own_cv' } });

      const copyBtn = screen.getByTestId('ai-copy-btn');
      await act(async () => {
        fireEvent.click(copyBtn);
      });

      expect(screen.getByTestId('ai-waiting-banner')).toBeInTheDocument();

      // Click back to setup button
      const backBtn = screen.getByTestId('ai-back-to-setup-btn');
      fireEvent.click(backBtn);

      expect(screen.queryByTestId('ai-waiting-banner')).not.toBeInTheDocument();
    });

    it('2.3: resets waiting mode automatically when changing prompt', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
          readText: vi.fn().mockResolvedValue('')
        }
      });

      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const promptSelect = screen.getByTestId('ai-prompt-select');
      fireEvent.change(promptSelect, { target: { value: 'translate_english' } });

      const copyBtn = screen.getByTestId('ai-copy-btn');
      await act(async () => {
        fireEvent.click(copyBtn);
      });

      expect(screen.getByTestId('ai-waiting-banner')).toBeInTheDocument();

      // Switch prompt to recruiter_audit
      fireEvent.change(promptSelect, { target: { value: 'recruiter_audit' } });
      expect(screen.queryByTestId('ai-waiting-banner')).not.toBeInTheDocument();
    });
  });

  describe('3. TranslationModal Collapsible Prompt & Hand-off', () => {
    it('3.1: renders collapsible prompt in Tab 1 and auto-switches to Tab 2 with waiting banner on copy', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
          readText: vi.fn().mockResolvedValue('')
        }
      });

      render(
        <CVProvider initialCV={baseMockCV}>
          <TranslationModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      // In Tab 1, toggle prompt button exists
      expect(screen.getByText('Desplegar prompt completo')).toBeInTheDocument();

      // Click copy and wait button
      const copyWaitBtn = screen.getByText(/Copiar Prompt y Esperar IA/);
      await act(async () => {
        fireEvent.click(copyWaitBtn);
      });

      expect(writeTextMock).toHaveBeenCalledTimes(1);

      // Auto-switched to import tab with waiting indicator
      expect(screen.getByText('Esperando respuesta de tu IA externa...')).toBeInTheDocument();
      expect(screen.getByText(/Pegar Respuesta Completa de la IA/)).toBeInTheDocument();
    });
  });

  describe('4. Invariants & Zero Emoji Ban Compliance', () => {
    it('4.1: asserts absence of raw unicode emojis across all waiting and collapsed states', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
          readText: vi.fn().mockResolvedValue('')
        }
      });

      const { container } = render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
          <TranslationModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      // Trigger waiting state in AIExportModal
      const promptSelect = screen.getByTestId('ai-prompt-select');
      fireEvent.change(promptSelect, { target: { value: 'translate_english' } });
      const copyBtn = screen.getByTestId('ai-copy-btn');
      await act(async () => {
        fireEvent.click(copyBtn);
      });

      const text = container.textContent || '';
      expect(text).not.toContain('🛑');
      expect(text).not.toContain('🚨');
      expect(text).not.toContain('⚠️');
      expect(text).not.toContain('ℹ️');
      expect(text).not.toContain('💡');
      expect(text).not.toContain('✨');
      expect(text).not.toContain('🌐');
      expect(text).not.toContain('🤖');
      expect(text).not.toContain('📄');
    });
  });
});
