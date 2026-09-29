import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIExportModal from '../components/Editor/AIExportModal.jsx';
import { CVProvider, useCV } from '../context/CVContext.jsx';
import { getAllVersions } from '../utils/versionStorage.js';
import { buildAIPromptPayload, getLanguageLegend } from '../utils/aiExporter.js';

describe('AI Response Ingestion, Version Backup & Language Switch Suite', () => {
  const mockSpanishCV = {
    profile: {
      name: 'Carlos González',
      subtitle: 'Desarrollador Full Stack'
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
          name: 'Carlos González',
          subtitle: 'Desarrollador Full Stack'
        }]
      },
      {
        id: 'experience',
        column: 'left',
        type: 'list',
        title: 'EXPERIENCIA LABORAL',
        items: [{
          id: 'exp1',
          title: 'Ingeniero de Software',
          subtitle: 'Tech Co',
          date: '2021 – Presente',
          bullets: ['Diseñé servicios distribuidos de alta concurrencia.']
        }]
      }
    ]
  };

  const validEnglishResponseJSON = JSON.stringify({
    layout: {
      type: '1-column',
      isAtsMode: true,
      fontFamily: 'Inter',
      fontScale: 1.0
    },
    profile: {
      name: 'Carlos Gonzalez',
      subtitle: 'Senior Full Stack Engineer'
    },
    sections: [
      {
        id: 'profile_header',
        column: 'left',
        type: 'profile_header',
        items: [{
          id: 'ph1',
          name: 'Carlos Gonzalez',
          subtitle: 'Senior Full Stack Engineer'
        }]
      },
      {
        id: 'experience',
        column: 'left',
        type: 'list',
        title: 'WORK EXPERIENCE',
        items: [{
          id: 'exp1',
          title: 'Software Engineer II',
          subtitle: 'Tech Co',
          date: '2021 – Present',
          bullets: ['Architected high-throughput distributed microservices.']
        }]
      }
    ]
  }, null, 2);

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Universal Strict Directive in Prompt Payloads
  // =========================================================================
  describe('1. Universal Strict Directive in Output Prompts', () => {
    it('T1.1: translate_english payload enforces strict directive to only return JSON', () => {
      const payload = buildAIPromptPayload(mockSpanishCV, 'translate_english', { lang: 'es' });
      expect(payload).toContain('DIRECTIVA ESTRICTA UNIVERSAL');
      expect(payload).toContain('Tu respuesta DEBE ser ÚNICAMENTE un bloque de código ```json ... ```');
      expect(payload).toContain('QUEDA TERMINANTEMENTE PROHIBIDO incluir');
    });

    it('T1.2: translate_english English localized payload enforces strict JSON only directive', () => {
      const payload = buildAIPromptPayload(mockSpanishCV, 'translate_english', { lang: 'en' });
      expect(payload).toContain('CRITICAL MANDATORY UNIVERSAL DIRECTIVE');
      expect(payload).toContain('Your response MUST strictly be ONLY a single valid ```json ... ``` code block');
      expect(payload).toContain('DO NOT include any introductory text');
    });

    it('T1.3: getLanguageLegend maps ISO codes to standardized uppercase legends', () => {
      expect(getLanguageLegend('es')).toBe('ESPAÑOL');
      expect(getLanguageLegend('en')).toBe('ENGLISH');
      expect(getLanguageLegend('de')).toBe('DEUTSCH');
      expect(getLanguageLegend('fr')).toBe('FRANÇAIS');
      expect(getLanguageLegend('pt')).toBe('PORTUGUÊS');
      expect(getLanguageLegend('it')).toBe('ITALIANO');
      expect(getLanguageLegend(null)).toBe('ESPAÑOL');
    });
  });

  // =========================================================================
  // 2. UI Gating of External LLM Response Ingestion Section
  // =========================================================================
  describe('2. UI Gating of External LLM Response Ingestion Section', () => {
    it('T2.1: does NOT show response ingestion container for analysis prompts like recruiter_audit', () => {
      render(
        <CVProvider initialCV={mockSpanishCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      expect(screen.queryByTestId('ai-response-ingestion-container')).toBeNull();
      expect(screen.queryByTestId('ai-response-input')).toBeNull();
      expect(screen.queryByTestId('ai-apply-response-btn')).toBeNull();
    });

    it('T2.2: shows response ingestion container when translate_english is selected', () => {
      render(
        <CVProvider initialCV={mockSpanishCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const promptSelect = screen.getByTestId('ai-prompt-select');
      fireEvent.change(promptSelect, { target: { value: 'translate_english' } });

      expect(screen.getByTestId('ai-response-ingestion-container')).toBeInTheDocument();
      expect(screen.getByTestId('ai-response-input')).toBeInTheDocument();
      expect(screen.getByTestId('ai-apply-response-btn')).toBeInTheDocument();
      expect(screen.getByTestId('ai-target-lang-select')).toBeInTheDocument();
    });

    it('T2.3: shows response ingestion container when bring_your_own_cv is selected', () => {
      render(
        <CVProvider initialCV={mockSpanishCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const promptSelect = screen.getByTestId('ai-prompt-select');
      fireEvent.change(promptSelect, { target: { value: 'bring_your_own_cv' } });

      expect(screen.getByTestId('ai-response-ingestion-container')).toBeInTheDocument();
      expect(screen.getByTestId('ai-response-input')).toBeInTheDocument();
      expect(screen.getByTestId('ai-apply-response-btn')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 3. Application Flow: Backup with "ESPAÑOL", JSON Apply & Language Switch
  // =========================================================================
  describe('3. Application Flow: Backup with "ESPAÑOL", JSON Apply & Language Switch', () => {
    it('T3.1: successfully saves backup version with ESPAÑOL legend and activates new English CV', async () => {
      const ConsumerTester = () => {
        const { cvData, activeLanguage } = useCV();
        return (
          <div>
            <span data-testid="active-lang">{activeLanguage}</span>
            <span data-testid="cv-candidate-name">{cvData?.profile?.name}</span>
            <span data-testid="cv-job-title">{cvData?.profile?.subtitle}</span>
          </div>
        );
      };

      render(
        <CVProvider initialCV={mockSpanishCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
          <ConsumerTester />
        </CVProvider>
      );

      // Verify initial state
      expect(screen.getByTestId('active-lang').textContent).toBe('es');
      expect(screen.getByTestId('cv-candidate-name').textContent).toBe('Carlos González');

      // Select translation prompt
      const promptSelect = screen.getByTestId('ai-prompt-select');
      fireEvent.change(promptSelect, { target: { value: 'translate_english' } });

      // Paste external LLM JSON response (enclosed in markdown code fence)
      const responseTextarea = screen.getByTestId('ai-response-input');
      const markdownWrapped = `Here is the translated CV:\n\`\`\`json\n${validEnglishResponseJSON}\n\`\`\``;
      fireEvent.change(responseTextarea, { target: { value: markdownWrapped } });

      // Click apply button
      const applyBtn = screen.getByTestId('ai-apply-response-btn');
      fireEvent.click(applyBtn);

      // Verify success callout
      await waitFor(() => {
        expect(screen.getByTestId('ai-apply-success-callout')).toBeInTheDocument();
      });

      // Verify versions stored in Version Manager
      const savedVersions = await getAllVersions();
      expect(savedVersions.length).toBeGreaterThanOrEqual(2);

      // The pre-translation version MUST contain "ESPAÑOL"
      const spanishBackup = savedVersions.find(v => v.name.includes('ESPAÑOL'));
      expect(spanishBackup).toBeDefined();
      expect(spanishBackup.name).toContain('Carlos González');
      expect(spanishBackup.name).toContain('ESPAÑOL');
      expect(spanishBackup.cvData.profile.name).toBe('Carlos González');

      // The new translated version MUST contain "ENGLISH"
      const englishVersion = savedVersions.find(v => v.name.includes('ENGLISH'));
      expect(englishVersion).toBeDefined();
      expect(englishVersion.cvData.profile.name).toBe('Carlos Gonzalez');
      expect(englishVersion.cvData.profile.subtitle).toBe('Senior Full Stack Engineer');

      // Verify active CV in editor state was updated immediately
      expect(screen.getByTestId('active-lang').textContent).toBe('en');
      expect(screen.getByTestId('cv-candidate-name').textContent).toBe('Carlos Gonzalez');
      expect(screen.getByTestId('cv-job-title').textContent).toBe('Senior Full Stack Engineer');
    });

    it('T3.2: displays Obsidian Danger Callout when pasting invalid/malformed JSON and avoids state mutation', async () => {
      const ConsumerTester = () => {
        const { cvData, activeLanguage } = useCV();
        return (
          <div>
            <span data-testid="active-lang">{activeLanguage}</span>
            <span data-testid="cv-candidate-name">{cvData?.profile?.name}</span>
          </div>
        );
      };

      render(
        <CVProvider initialCV={mockSpanishCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
          <ConsumerTester />
        </CVProvider>
      );

      // Select translation prompt
      const promptSelect = screen.getByTestId('ai-prompt-select');
      fireEvent.change(promptSelect, { target: { value: 'translate_english' } });

      // Paste broken/invalid text
      const responseTextarea = screen.getByTestId('ai-response-input');
      fireEvent.change(responseTextarea, { target: { value: 'Sorry, as an AI model I cannot translate this CV.' } });

      // Click apply button
      const applyBtn = screen.getByTestId('ai-apply-response-btn');
      fireEvent.click(applyBtn);

      // Verify error callout renders
      await waitFor(() => {
        expect(screen.getByTestId('ai-apply-error-callout')).toBeInTheDocument();
      });

      // Verify initial state remains strictly intact
      expect(screen.getByTestId('active-lang').textContent).toBe('es');
      expect(screen.getByTestId('cv-candidate-name').textContent).toBe('Carlos González');
    });

    it('T3.3: works seamlessly with bring_your_own_cv prompt', async () => {
      render(
        <CVProvider initialCV={mockSpanishCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const promptSelect = screen.getByTestId('ai-prompt-select');
      fireEvent.change(promptSelect, { target: { value: 'bring_your_own_cv' } });

      const responseTextarea = screen.getByTestId('ai-response-input');
      fireEvent.change(responseTextarea, { target: { value: validEnglishResponseJSON } });

      const applyBtn = screen.getByTestId('ai-apply-response-btn');
      fireEvent.click(applyBtn);

      await waitFor(() => {
        expect(screen.getByTestId('ai-apply-success-callout')).toBeInTheDocument();
      });

      const versions = await getAllVersions();
      const backup = versions.find(v => v.name.includes('ESPAÑOL'));
      expect(backup).toBeDefined();

      const imported = versions.find(v => v.name.includes('IMPORTADO ATS'));
      expect(imported).toBeDefined();
    });

    it('T3.4: renders zero raw unicode emoji glyphs in the entire modal DOM when response ingestion is active', () => {
      render(
        <CVProvider initialCV={mockSpanishCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const promptSelect = screen.getByTestId('ai-prompt-select');
      fireEvent.change(promptSelect, { target: { value: 'translate_english' } });

      const dialog = screen.getByRole('dialog');
      const text = dialog.textContent || '';
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
