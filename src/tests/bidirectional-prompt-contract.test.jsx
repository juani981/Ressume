import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AIExportModal from '../components/Editor/AIExportModal.jsx';
import { CVProvider } from '../context/CVContext.jsx';
import { 
  formatBackupVersionTitle, 
  executeAutoBackup, 
  getBidirectionalHandler, 
  isBidirectionalPrompt, 
  registerBidirectionalHandler 
} from '../services/ai/bidirectionalPromptContract.js';
import { getAllVersions } from '../utils/versionStorage.js';
import { buildAIPromptPayload } from '../utils/aiExporter.js';
import { normalizeAnyJSONToCVSnapshot } from '../utils/universalJsonImporter.js';
import { buildTranslationPrompt } from '../utils/translationEngine.js';

describe('Bidirectional Prompt Contract & Multi-Provider Launcher Suite', () => {
  const mockCV = {
    profile: {
      name: 'Ada Lovelace',
      subtitle: 'First Computer Programmer'
    },
    layout: {
      type: '1-column',
      isAtsMode: true
    },
    sections: [
      {
        id: 'profile_header',
        type: 'profile_header',
        items: [{ id: 'p1', name: 'Ada Lovelace', subtitle: 'First Computer Programmer' }]
      }
    ]
  };

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

  describe('1. Contract Architecture & Backup Title Invariant [subtitulo + Nombre][Backup][idioma]', () => {
    it('T1.1: formats backup version title strictly following [subtitulo + Nombre][Backup][idioma]', () => {
      const titleEs = formatBackupVersionTitle(mockCV, 'es');
      expect(titleEs).toBe('[First Computer Programmer - Ada Lovelace][Backup][ESPAÑOL]');

      const titleEn = formatBackupVersionTitle(mockCV, 'en');
      expect(titleEn).toBe('[First Computer Programmer - Ada Lovelace][Backup][ENGLISH]');

      const cvWithoutSubtitle = { profile: { name: 'Alan Turing' } };
      const titleNoSub = formatBackupVersionTitle(cvWithoutSubtitle, 'es');
      expect(titleNoSub).toBe('[Alan Turing][Backup][ESPAÑOL]');
    });

    it('T1.2: executeAutoBackup persists snapshot adhering to the backup format', async () => {
      const savedTitle = await executeAutoBackup(mockCV, 'es');
      expect(savedTitle).toBe('[First Computer Programmer - Ada Lovelace][Backup][ESPAÑOL]');

      const versions = await getAllVersions();
      const found = versions.find(v => v.name === savedTitle);
      expect(found).toBeDefined();
      expect(found.cvData.profile.name).toBe('Ada Lovelace');
    });

    it('T1.3: verifies built-in handlers for translate_english and bring_your_own_cv', () => {
      expect(isBidirectionalPrompt('translate_english')).toBe(true);
      expect(isBidirectionalPrompt('bring_your_own_cv')).toBe(true);
      expect(isBidirectionalPrompt('recruiter_audit')).toBe(false);

      const translateHandler = getBidirectionalHandler('translate_english');
      expect(translateHandler.id).toBe('translate_english');
      expect(translateHandler.requiresJsonResponse).toBe(true);

      const byoHandler = getBidirectionalHandler('bring_your_own_cv');
      expect(byoHandler.id).toBe('bring_your_own_cv');
      expect(byoHandler.requiresJsonResponse).toBe(true);
    });

    it('T1.4: allows registering new bidirectional handlers via open-closed principle', () => {
      const customHandler = {
        id: 'executive_rewrite',
        name: 'Reescritura Ejecutiva C-Level',
        category: 'executive',
        requiresJsonResponse: true,
        parseAndValidate: (raw) => ({ isValid: true, data: raw }),
        getNewVersionTitle: () => '[Executive C-Level]'
      };

      registerBidirectionalHandler(customHandler);
      expect(isBidirectionalPrompt('executive_rewrite')).toBe(true);
      expect(getBidirectionalHandler('executive_rewrite').name).toBe('Reescritura Ejecutiva C-Level');
    });
  });

  describe('2. Multi-Provider Auto-Copy Launcher in Step 1 (L159)', () => {
    it('T2.1: displays Copiar prompt y abrir en with ChatGPT, Claude, Gemini, DeepSeek when not waiting', () => {
      render(
        <CVProvider initialCV={mockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} initialPromptId="translate_english" />
        </CVProvider>
      );

      expect(screen.getByText('Copiar prompt y abrir en:')).toBeInTheDocument();
      expect(screen.getByText('ChatGPT')).toBeInTheDocument();
      expect(screen.getByText('Claude')).toBeInTheDocument();
      expect(screen.getByText('Gemini')).toBeInTheDocument();
      expect(screen.getByText('DeepSeek')).toBeInTheDocument();
    });

    it('T2.2: clicking ChatGPT copies prompt to clipboard in background and opens URL in new tab', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
          readText: vi.fn().mockResolvedValue('')
        }
      });
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      render(
        <CVProvider initialCV={mockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} initialPromptId="translate_english" />
        </CVProvider>
      );

      const chatGptBtn = screen.getByText('ChatGPT').closest('button');
      await act(async () => {
        fireEvent.click(chatGptBtn);
      });

      // Assert auto-copy in background
      expect(writeTextMock).toHaveBeenCalledTimes(1);

      // Assert opening external provider URL in new tab
      expect(windowOpenSpy).toHaveBeenCalledWith('https://chatgpt.com', '_blank', 'noopener,noreferrer');

      // Assert transitions into waiting mode
      expect(screen.getByTestId('ai-waiting-banner')).toBeInTheDocument();
      expect(screen.getByText(/Prompt copiado al portapapeles.*ChatGPT.*Ctrl\+V/)).toBeInTheDocument();

      windowOpenSpy.mockRestore();
    });

    it('T2.3: clicking Claude copies prompt to clipboard and opens claude.ai in new tab', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
          readText: vi.fn().mockResolvedValue('')
        }
      });
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      render(
        <CVProvider initialCV={mockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} initialPromptId="translate_english" />
        </CVProvider>
      );

      const claudeBtn = screen.getByText('Claude').closest('button');
      await act(async () => {
        fireEvent.click(claudeBtn);
      });

      expect(writeTextMock).toHaveBeenCalledTimes(1);
      expect(windowOpenSpy).toHaveBeenCalledWith('https://claude.ai', '_blank', 'noopener,noreferrer');
      expect(screen.getByText(/Prompt copiado al portapapeles.*Claude.*Ctrl\+V/)).toBeInTheDocument();

      windowOpenSpy.mockRestore();
    });

    it('T2.4: does not display prompt selector when prompt is bidirectional', () => {
      const { rerender } = render(
        <CVProvider initialCV={mockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} initialPromptId="translate_english" />
        </CVProvider>
      );

      const promptSelect = screen.getByTestId('ai-prompt-select');
      const container = promptSelect.closest('div').parentElement;
      expect(container.style.display).toBe('none');

      // Unidirectional prompt shows selector
      rerender(
        <CVProvider initialCV={mockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} initialPromptId="recruiter_audit" />
        </CVProvider>
      );

      expect(container.style.display).toBe('flex');
    });
  });

  describe('3. Bidirectional Localization & English Import Fidelity', () => {
    it('T3.1: buildAIPromptPayload generates Spanish directives when targetLang is es', () => {
      const promptPayload = buildAIPromptPayload(mockCV, 'translate_english', {
        format: 'markdown',
        lang: 'en',
        targetLang: 'es'
      });

      expect(promptPayload).toContain('Spanish Tech Localization');
      expect(promptPayload).toContain('Técnico Superior / Tecnicatura');
      expect(promptPayload).toContain('EXPERIENCIA LABORAL');
      expect(promptPayload).toContain('language: \'es\'');
    });

    it('T3.2: buildAIPromptPayload generates English directives when targetLang is en', () => {
      const promptPayload = buildAIPromptPayload(mockCV, 'translate_english', {
        format: 'markdown',
        lang: 'es',
        targetLang: 'en'
      });

      expect(promptPayload).toContain('US Tech Localization');
      expect(promptPayload).toContain('Associate Degree');
      expect(promptPayload).toContain('WORK EXPERIENCE');
      expect(promptPayload).toContain('language: \'en\'');
    });

    it('T3.3: buildTranslationPrompt provides Spanish localization directives when targetLangCode is es', () => {
      const prompt = buildTranslationPrompt({ profile_title: 'Ada Lovelace' }, 'es', 'en');
      expect(prompt).toContain('ACADEMIC & DEGREE LOCALIZATION (SPANISH)');
      expect(prompt).toContain('Técnico Universitario en Programación');
      expect(prompt).toContain('EXPERIENCIA LABORAL');
      expect(prompt).toContain('HABILIDADES TÉCNICAS');
    });

    it('T3.4: normalizeAnyJSONToCVSnapshot preserves English titles and subtitles when importing English CV', () => {
      const englishCVJson = {
        language: 'en',
        candidate_profile: {
          fullName: 'Grace Hopper',
          headline: 'Computer Pioneer & Rear Admiral'
        },
        work_experience: [
          {
            title: 'Director',
            company: 'US Navy',
            startDate: '1943',
            endDate: '1986',
            description: 'Led compiler development and standards.'
          }
        ],
        technical_skills: [
          {
            category: 'Systems',
            skills: ['COBOL', 'Compilers', 'Mainframes']
          }
        ]
      };

      const normalized = normalizeAnyJSONToCVSnapshot(englishCVJson);
      expect(normalized.language).toBe('en');
      expect(normalized.layout.language).toBe('en');
      expect(normalized.profile.name).toBe('Grace Hopper');
      expect(normalized.profile.subtitle).toBe('Computer Pioneer & Rear Admiral');

      const expSec = normalized.sections.find(s => s.id === 'experience');
      expect(expSec).toBeDefined();
      expect(expSec.title).toBe('WORK EXPERIENCE');

      const skillsSec = normalized.sections.find(s => s.id === 'skills');
      expect(skillsSec).toBeDefined();
      expect(skillsSec.title).toBe('TECHNICAL SKILLS');
    });

    it('T3.5: AIExportModal targets Spanish by default when activeLanguage is English', () => {
      const englishCV = {
        ...mockCV,
        language: 'en',
        layout: { ...mockCV.layout, language: 'en' }
      };

      render(
        <CVProvider initialCV={englishCV} initialLanguage="en">
          <AIExportModal isOpen={true} onClose={vi.fn()} initialPromptId="translate_english" />
        </CVProvider>
      );

      const targetSelect = screen.getByTestId('ai-target-lang-select');
      expect(targetSelect).toBeInTheDocument();
      expect(targetSelect.value).toBe('es');
    });
  });
});

