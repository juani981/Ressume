import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import AIExportModal from '../components/Editor/AIExportModal.jsx';
import { CVProvider } from '../context/CVContext.jsx';
import esPrompts from '../locales/es/prompts.json' with { type: 'json' };

describe('AIExportModal Component & UI Reactivity', () => {

  const baseMockCV = {
    profile: {
      name: 'Ada Lovelace'
    },
    layout: {
      type: '1-column',
      isAtsMode: true,
      fontFamily: 'Poppins',
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

  // =========================================================================
  // 1. Mount and Visibility
  // =========================================================================
  describe('1. Mount and Visibility', () => {
    it('T1.1: does not render into DOM when isOpen is false', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={false} onClose={vi.fn()} />
        </CVProvider>
      );

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(screen.queryByTestId('ai-prompt-select')).toBeNull();
    });

    it('T1.2: renders modal dialog when isOpen is true', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(screen.getByText(/Generar Prompts de IA con los datos de tu CV/i)).toBeInTheDocument();
    });

    it('T1.3: triggers onClose when close button (X) is clicked', () => {
      const handleClose = vi.fn();
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={handleClose} />
        </CVProvider>
      );

      const closeBtn = screen.getByTestId('ai-modal-close-btn');
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // 2. Automatic Layout Mode Detection (No UI Selectors)
  // =========================================================================
  describe('2. Automatic Layout Mode Detection (No UI Selectors)', () => {
    it('T2.1: automatically detects 1-column ATS layout mode without showing layout dropdown', () => {
      render(
        <CVProvider initialCV={{ ...baseMockCV, layout: { ...baseMockCV.layout, type: '1-column', isAtsMode: true } }}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      // Verifies preview reflects 1-column ATS mode
      const preview = screen.getByTestId('ai-payload-preview');
      expect(preview.textContent).toContain('layout_type: "1-column"');
      expect(preview.textContent).toContain('is_ats_mode: true');

      // Verifies no interactive layout or format dropdowns are rendered
      expect(screen.queryByLabelText(/Disposición de Abstracción/i)).toBeNull();
      expect(screen.queryByLabelText(/Formato de Abstracción/i)).toBeNull();
    });

    it('T2.2: automatically detects 2-column Traditional layout mode without showing layout dropdown', () => {
      render(
        <CVProvider initialCV={{ ...baseMockCV, layout: { ...baseMockCV.layout, type: '2-column', isAtsMode: false } }}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      // Verifies preview reflects 2-column mode
      const preview = screen.getByTestId('ai-payload-preview');
      expect(preview.textContent).toContain('layout_type: "2-column"');
      expect(preview.textContent).toContain('is_ats_mode: false');

      // Verifies no interactive layout or format dropdowns are rendered
      expect(screen.queryByLabelText(/Disposición de Abstracción/i)).toBeNull();
      expect(screen.queryByLabelText(/Formato de Abstracción/i)).toBeNull();
    });

    it('T2.3: locks export format strictly to Semantic Markdown', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const preview = screen.getByTestId('ai-payload-preview');
      expect(preview.textContent).toContain('DATOS DE ENTRADA DEL CURRÍCULUM VITAE (MARKDOWN)');
      expect(preview.textContent).toContain('```markdown');
      expect(preview.textContent).toContain('---');
    });
  });

  // =========================================================================
  // 3. Universal User Commentary Input (R1)
  // =========================================================================
  describe('3. Universal User Commentary Input', () => {
    it('T3.1: renders user_commentary textarea for the default prompt (recruiter_audit)', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const commentaryInput = screen.getByTestId('ai-user-commentary');
      expect(commentaryInput).toBeInTheDocument();
      expect(commentaryInput.tagName.toLowerCase()).toBe('textarea');
    });

    it('T3.2: live preview updates synchronously when typing into user_commentary', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const commentaryInput = screen.getByTestId('ai-user-commentary');
      const preview = screen.getByTestId('ai-payload-preview');

      // Initially omitted
      expect(preview.textContent).not.toContain('user_commentary:');

      // Type commentary
      fireEvent.change(commentaryInput, {
        target: { value: 'Enfocar el perfil hacia ingeniería de compiladores y computación cuántica.' }
      });

      // Preview updates immediately
      expect(preview.textContent).toContain('user_commentary: Enfocar el perfil hacia ingeniería de compiladores y computación cuántica.');
    });

    it('T3.3: cleanly omits user_commentary block when textarea is empty or only whitespace', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const commentaryInput = screen.getByTestId('ai-user-commentary');
      const preview = screen.getByTestId('ai-payload-preview');

      // Whitespace only
      fireEvent.change(commentaryInput, { target: { value: '    \n   ' } });
      expect(preview.textContent).not.toContain('user_commentary:');

      // Back to empty
      fireEvent.change(commentaryInput, { target: { value: '' } });
      expect(preview.textContent).not.toContain('user_commentary:');
    });
  });

  // =========================================================================
  // 4. Gated Job Description Field (Exclusive to job_matcher)
  // =========================================================================
  describe('4. Gated Job Description Field', () => {
    it('T4.1: hides job_description textarea when recruiter_audit or other prompt is selected', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      expect(screen.queryByTestId('ai-job-description')).toBeNull();

      // Switch to star_enhancer
      const promptSelect = screen.getByTestId('ai-prompt-select');
      fireEvent.change(promptSelect, { target: { value: 'star_enhancer' } });
      expect(screen.queryByTestId('ai-job-description')).toBeNull();
    });

    it('T4.2: displays BOTH user_commentary and job_description when job_matcher is selected', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const promptSelect = screen.getByTestId('ai-prompt-select');
      fireEvent.change(promptSelect, { target: { value: 'job_matcher' } });

      // Both fields coexist
      expect(screen.getByTestId('ai-user-commentary')).toBeInTheDocument();
      expect(screen.getByTestId('ai-job-description')).toBeInTheDocument();
    });

    it('T4.3: live preview includes both user_commentary and job_description when both are filled', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const promptSelect = screen.getByTestId('ai-prompt-select');
      fireEvent.change(promptSelect, { target: { value: 'job_matcher' } });

      const commentaryInput = screen.getByTestId('ai-user-commentary');
      const jdInput = screen.getByTestId('ai-job-description');
      const preview = screen.getByTestId('ai-payload-preview');

      fireEvent.change(commentaryInput, {
        target: { value: 'Destacar experiencia en backend distribuido.' }
      });
      fireEvent.change(jdInput, {
        target: { value: 'Senior Backend Engineer with Go, Kafka, and Kubernetes.' }
      });

      expect(preview.textContent).toContain('user_commentary: Destacar experiencia en backend distribuido.');
      expect(preview.textContent).toContain('job_description: Senior Backend Engineer with Go, Kafka, and Kubernetes.');
    });

    it('T4.4: hides job_description when switching away from job_matcher', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const promptSelect = screen.getByTestId('ai-prompt-select');
      fireEvent.change(promptSelect, { target: { value: 'job_matcher' } });
      expect(screen.getByTestId('ai-job-description')).toBeInTheDocument();

      // Switch to system_design_simulator
      fireEvent.change(promptSelect, { target: { value: 'system_design_simulator' } });
      expect(screen.queryByTestId('ai-job-description')).toBeNull();
      // user_commentary remains visible
      expect(screen.getByTestId('ai-user-commentary')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 5. Prompt Selection & Schema Injections
  // =========================================================================
  describe('5. Prompt Selection & Schema Injections', () => {
    it('T5.1: populates select dropdown with all 13 prompts (existing + tech suite + bring_your_own_cv)', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const promptSelect = screen.getByTestId('ai-prompt-select');
      const options = promptSelect.querySelectorAll('option');
      expect(options.length).toBe(10);

      const promptIds = Array.from(options).map(o => o.value);
      expect(promptIds).toContain('recruiter_audit');
      expect(promptIds).toContain('job_matcher');
      expect(promptIds).toContain('star_enhancer');
      expect(promptIds).toContain('technical_interview');
      expect(promptIds).toContain('translate_english');
      expect(promptIds).toContain('live_coding_coach');
      expect(promptIds).toContain('career_upskilling_roadmap');
      expect(promptIds).toContain('cold_outreach_generator');
      expect(promptIds).toContain('salary_negotiation_advisor');
      expect(promptIds).toContain('bring_your_own_cv');
    });

    it('T5.2: selecting translate_english updates live preview with native cvData JSON schema block', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const promptSelect = screen.getByTestId('ai-prompt-select');
      fireEvent.change(promptSelect, { target: { value: 'translate_english' } });

      const preview = screen.getByTestId('ai-payload-preview');
      expect(preview.textContent).toContain('# SCHEMA JSON NATIVO COMPACTO (cvData)');
      expect(preview.textContent).toContain('"layout"');
      expect(preview.textContent).toContain('"sections"');
    });

    it('T5.3: character and token counter displays reactive values', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      expect(screen.getByText(/caracteres/i)).toBeInTheDocument();
      expect(screen.getByText(/tokens/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 6. Actions, Clipboard & Visual Invariants
  // =========================================================================
  describe('6. Actions, Clipboard & Visual Invariants', () => {
    it('T6.1: copies compiled payload to clipboard on button click', async () => {
      const writeTextMock = vi.fn().mockResolvedValue();
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock
        }
      });

      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const copyBtn = screen.getByTestId('ai-copy-btn');
      fireEvent.click(copyBtn);

      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledTimes(1);
        expect(writeTextMock.mock.calls[0][0]).toContain('Ada Lovelace');
        expect(screen.getByText(/¡Copiado al portapapeles!/i)).toBeInTheDocument();
      });
    });

    it('T6.2: downloads markdown file with candidate name and prompt id on download click', () => {
      const createObjectURLMock = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:http://localhost/mock-url');
      const revokeObjectURLMock = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});

      const clickedLinks = [];
      const origCreateElement = document.createElement.bind(document);
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
        const el = origCreateElement(tagName, options);
        if (tagName.toLowerCase() === 'a') {
          el.click = vi.fn(() => { clickedLinks.push(el); });
        }
        return el;
      });

      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const downloadBtn = screen.getByTestId('ai-download-btn');
      fireEvent.click(downloadBtn);

      expect(clickedLinks.length).toBe(1);
      expect(clickedLinks[0].download).toBe('Ada_Lovelace_AI_Prompt_recruiter_audit.md');

      createObjectURLMock.mockRestore();
      revokeObjectURLMock.mockRestore();
      createElementSpy.mockRestore();
    });

    it('T6.3: renders zero raw unicode emoji glyphs in the modal markup (adversarial ban compliant)', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const dialog = screen.getByRole('dialog');
      const text = dialog.textContent || '';
      // Assert absence of raw emojis banned per AGENTS.md and adversarial-challenger.test.jsx
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

  // =========================================================================
  // 7. Privacy, External AI, Zero Cost & Multi-Model Disclaimer
  // =========================================================================
  describe('7. Privacy, External AI, Zero Cost & Multi-Model Disclaimer', () => {
    it('T7.1: renders prominent Obsidian Callout disclaimer in AIExportModal with all required guarantees', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const disclaimer = screen.getByTestId('ai-privacy-disclaimer-callout');
      expect(disclaimer).toBeInTheDocument();
      expect(disclaimer.className).toContain('obsidian-callout');

      const title = disclaimer.querySelector('.callout-title');
      const content = disclaimer.querySelector('.callout-content');
      expect(title).toBeInTheDocument();
      expect(content).toBeInTheDocument();

      // Guarantees required by user contract:
      // 1. External and local AI processing
      expect(content.textContent).toMatch(/IA externa o local/i);
      // 2. Zero server retention / client privacy
      expect(content.textContent).toMatch(/no almacena tus datos/i);
      // 3. Zero cost for usage or download
      expect(content.textContent).toMatch(/genera coste alguno por uso o descarga/i);
      // 4. Recommend multi-model comparison
      expect(content.textContent).toMatch(/comparar y contrastar los resultados/i);
    });

    it('T7.2: preserves disclaimer visibility across bidirectional prompts (bring_your_own_cv)', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} initialPromptId="bring_your_own_cv" />
        </CVProvider>
      );

      const disclaimer = screen.getByTestId('ai-privacy-disclaimer-callout');
      expect(disclaimer).toBeInTheDocument();
      expect(screen.getByText('Privacidad, Procesamiento Externo y Uso Gratuito')).toBeInTheDocument();
    });
  });
});
