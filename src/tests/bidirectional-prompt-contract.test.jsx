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
import { getPrompts } from '../locales/index.js';
import { ensureContactSectionWithFallback } from '../utils/cvSchemaValidator.js';

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

  describe('4. Bring Your Own CV (Importar CV) Contact Structure & Mandatory Fallback Invariants', () => {
    it('T4.1: bring_your_own_cv prompt explicitly specifies contact section and fallback directive in Spanish catalog', () => {
      const esPrompts = getPrompts('es');
      const byoPrompt = esPrompts.find(p => p.id === 'bring_your_own_cv');
      expect(byoPrompt).toBeDefined();
      expect(byoPrompt.task).toContain('contact (tipo \'contact\')');
      expect(byoPrompt.task).toContain('Invariante de contacto único y Fallback obligatorio');
      expect(byoPrompt.task).toContain('Ciudad, País');
      expect(byoPrompt.task).toContain('tuemail@ejemplo.com');
    });

    it('T4.2: bring_your_own_cv prompt explicitly specifies contact section and fallback directive in English catalog', () => {
      const enPrompts = getPrompts('en');
      const byoPrompt = enPrompts.find(p => p.id === 'bring_your_own_cv');
      expect(byoPrompt).toBeDefined();
      expect(byoPrompt.task).toContain('contact (type \'contact\')');
      expect(byoPrompt.task).toContain('Single Contact Source invariant & Mandatory Fallback');
      expect(byoPrompt.task).toContain('City, Country');
      expect(byoPrompt.task).toContain('youremail@example.com');
    });

    it('T4.3: injects default fallback contact placeholders when imported CV completely lacks contact section', () => {
      const byoHandler = getBidirectionalHandler('bring_your_own_cv');
      const rawJsonWithoutContact = JSON.stringify({
        profile: { name: 'Alan Turing', subtitle: 'Mathematician' },
        sections: [
          {
            id: 'profile_header',
            type: 'profile_header',
            items: [{ id: 'ph1', name: 'Alan Turing', subtitle: 'Mathematician' }]
          },
          {
            id: 'experience',
            type: 'list',
            title: 'EXPERIENCIA LABORAL',
            items: [{ id: 'exp1', title: 'Codebreaker', subtitle: 'Bletchley Park', date: '1939 – 1945' }]
          }
        ]
      });

      const result = byoHandler.parseAndValidate(rawJsonWithoutContact);
      expect(result.isValid).toBe(true);

      const contactSec = result.cvData.sections.find(s => s.id === 'contact' || s.type === 'contact');
      expect(contactSec).toBeDefined();
      expect(contactSec.items[0].contacts.length).toBeGreaterThanOrEqual(4);
      expect(contactSec.items[0].contacts.map(c => c.type)).toEqual(
        expect.arrayContaining(['email', 'phone', 'location'])
      );
      expect(contactSec.items[0].email).toBe('tuemail@ejemplo.com');
      expect(contactSec.items[0].location).toBe('Ciudad, País');
    });

    it('T4.4: injects default fallback contact placeholders when contact section exists but contains empty contacts', () => {
      const byoHandler = getBidirectionalHandler('bring_your_own_cv');
      const rawJsonWithEmptyContacts = JSON.stringify({
        profile: { name: 'Ada Lovelace' },
        sections: [
          {
            id: 'profile_header',
            type: 'profile_header',
            items: [{ id: 'ph1', name: 'Ada Lovelace' }]
          },
          {
            id: 'contact',
            type: 'contact',
            title: '',
            items: [{ id: 'contact1', contacts: [{ type: 'email', value: '' }, { type: 'phone', value: '   ' }] }]
          }
        ]
      });

      const result = byoHandler.parseAndValidate(rawJsonWithEmptyContacts);
      expect(result.isValid).toBe(true);

      const contactSec = result.cvData.sections.find(s => s.id === 'contact' || s.type === 'contact');
      expect(contactSec).toBeDefined();
      expect(contactSec.items[0].contacts.some(c => c.value === 'tuemail@ejemplo.com')).toBe(true);
      expect(contactSec.items[0].contacts.some(c => c.value === 'Ciudad, País')).toBe(true);
    });

    it('T4.5: preserves valid contacts and extracts bundled contacts from profile_header', () => {
      const byoHandler = getBidirectionalHandler('bring_your_own_cv');
      const rawJsonWithBundledContacts = JSON.stringify({
        profile: { name: 'Grace Hopper' },
        sections: [
          {
            id: 'profile_header',
            type: 'profile_header',
            items: [{
              id: 'ph1',
              name: 'Grace Hopper',
              email: 'grace@navy.mil',
              contacts: [
                { id: 'c1', type: 'email', value: 'grace@navy.mil' },
                { id: 'c2', type: 'location', value: 'New York, NY' }
              ]
            }]
          }
        ]
      });

      const result = byoHandler.parseAndValidate(rawJsonWithBundledContacts);
      expect(result.isValid).toBe(true);

      const headerSec = result.cvData.sections.find(s => s.type === 'profile_header');
      const contactSec = result.cvData.sections.find(s => s.type === 'contact');

      expect(headerSec).toBeDefined();
      expect(headerSec.items[0].contacts).toBeUndefined();
      expect(contactSec).toBeDefined();
      expect(contactSec.items[0].contacts.map(c => c.value)).toContain('grace@navy.mil');
      expect(contactSec.items[0].contacts.map(c => c.value)).toContain('New York, NY');
    });

    it('T4.6: successfully parses and validates full tech CV JSON from bring_your_own_cv', () => {
      const byoHandler = getBidirectionalHandler('bring_your_own_cv');
      const userCvJson = JSON.stringify({
        layout: {
          type: "1-column",
          isAtsMode: true,
          fontFamily: "Inter",
          fontScale: 1.0,
          titleScale: 1.0,
          bodyScale: 1.0,
          listScale: 1.0,
          lineHeight: 1.3,
          pagePadding: 24,
          sectionGap: 20,
          itemGap: 8
        },
        profile: {
          name: "Juan Ignacio Carrizo",
          subtitle: "Desarrollador Backend | PHP, Laravel, Oracle | CI/CD y Automatización"
        },
        sections: [
          {
            id: "profile_header",
            type: "profile_header",
            title: "",
            column: "left",
            items: [
              {
                id: "prof_header_item",
                name: "Juan Ignacio Carrizo",
                subtitle: "Desarrollador Backend | PHP, Laravel, Oracle | CI/CD y Automatización"
              }
            ]
          },
          {
            id: "contact",
            type: "contact",
            title: "",
            column: "left",
            items: [
              {
                id: "contact1",
                contacts: [
                  { id: "c1", type: "email", value: "juanicarrizo97@gmail.com" },
                  { id: "c2", type: "phone", value: "+54 381 6706133" },
                  { id: "c3", type: "location", value: "Tucumán, Argentina" },
                  { id: "c4", type: "github", value: "https://github.com/juani981" },
                  { id: "c5", type: "linkedin", value: "https://linkedin.com/in/juan-ignacio-carrizo-juani981/" }
                ]
              }
            ]
          },
          {
            id: "about_section",
            type: "about",
            title: "PERFIL PROFESIONAL",
            column: "left",
            items: [
              {
                id: "about_item",
                description: "Desarrollador Backend enfocado en modernización de sistemas legacy..."
              }
            ]
          },
          {
            id: "skills",
            type: "skills",
            title: "HABILIDADES TÉCNICAS",
            column: "left",
            items: [
              { id: "skill_1", title: "Backend", description: "PHP (Laravel), Python, ASP.NET, Playwright, RESTful APIs" }
            ]
          },
          {
            id: "experience",
            type: "list",
            title: "EXPERIENCIA LABORAL",
            column: "right",
            items: [
              {
                id: "exp_1",
                title: "Desarrollador Back-End (PHP, Laravel, Oracle)",
                subtitle: "Dirección General de Catastro",
                date: "Julio 2025 – Actualidad",
                bullets: ["Diseñé una arquitectura de transición..."]
              }
            ]
          }
        ]
      });

      const result = byoHandler.parseAndValidate(userCvJson);
      expect(result.isValid).toBe(true);
      expect(result.cvData.profile.name).toBe("Juan Ignacio Carrizo");

      const contactSec = result.cvData.sections.find(s => s.id === 'contact');
      expect(contactSec).toBeDefined();
      expect(contactSec.items[0].contacts.length).toBe(5);
      expect(contactSec.items[0].email).toBe("juanicarrizo97@gmail.com");
      expect(contactSec.items[0].phone).toBe("+54 381 6706133");
      expect(contactSec.items[0].location).toBe("Tucumán, Argentina");
    });
  });
});


