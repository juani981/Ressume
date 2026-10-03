import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AIExportModal from '../components/Editor/AIExportModal.jsx';
import ActionMenuRoot from '../components/Editor/ActionMenu/ActionMenuRoot.jsx';
import { CVProvider, useCV } from '../context/CVContext.jsx';

describe('Bidirectional AI Modes, Auto-Paste & Live Impact Summary Suite', () => {
  const mockCV = {
    profile: {
      name: 'Elena Rostova',
      subtitle: 'Senior Backend Engineer'
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
          name: 'Elena Rostova',
          subtitle: 'Senior Backend Engineer'
        }]
      },
      {
        id: 'experience',
        column: 'left',
        type: 'list',
        title: 'EXPERIENCIA LABORAL',
        items: [
          {
            id: 'exp1',
            title: 'Staff Distributed Systems Engineer',
            subtitle: 'FinTech Global',
            date: '2022 – Present',
            bullets: [
              'Architected high-throughput ledger processing 25k TPS with sub-10ms p99 latency.',
              'Mentored 6 engineers and standardized zero-downtime database migration pipelines.'
            ]
          },
          {
            id: 'exp2',
            title: 'Backend Software Engineer',
            subtitle: 'Cloud Solutions',
            date: '2019 – 2022',
            bullets: [
              'Designed REST and gRPC microservices using Go, Docker and PostgreSQL.'
            ]
          }
        ]
      },
      {
        id: 'skills',
        column: 'left',
        type: 'skills',
        title: 'HABILIDADES TÉCNICAS',
        items: [
          { id: 's1', title: 'Languages', description: 'Go, Python, TypeScript, Rust' },
          { id: 's2', title: 'Infrastructure', description: 'Kubernetes, AWS, Docker, Terraform' }
        ]
      },
      {
        id: 'education',
        column: 'left',
        type: 'education',
        title: 'EDUCACIÓN',
        items: [
          { id: 'edu1', title: 'B.S. in Computer Science', subtitle: 'University of Engineering', date: '2019' }
        ]
      }
    ]
  };

  const sampleLLMResponseJSON = JSON.stringify({
    layout: {
      type: '1-column',
      isAtsMode: true
    },
    profile: {
      name: 'Elena Rostova',
      subtitle: 'Staff Distributed Systems Engineer'
    },
    sections: [
      {
        id: 'profile_header',
        column: 'left',
        type: 'profile_header',
        items: [{
          id: 'ph1',
          name: 'Elena Rostova',
          subtitle: 'Staff Distributed Systems Engineer'
        }]
      },
      {
        id: 'experience',
        column: 'left',
        type: 'list',
        title: 'WORK EXPERIENCE',
        items: [
          {
            id: 'exp1',
            title: 'Staff Distributed Systems Engineer',
            subtitle: 'FinTech Global',
            date: '2022 – Present',
            bullets: [
              'Architected high-throughput ledger processing 25k TPS with sub-10ms p99 latency.',
              'Standardized zero-downtime database migration pipelines.'
            ]
          }
        ]
      },
      {
        id: 'skills',
        column: 'left',
        type: 'skills',
        title: 'TECHNICAL SKILLS',
        items: [
          { id: 's1', title: 'Backend', description: 'Go, Python, PostgreSQL, Kafka' }
        ]
      },
      {
        id: 'education',
        column: 'left',
        type: 'education',
        title: 'EDUCATION',
        items: [
          { id: 'edu1', title: 'B.S. Computer Science', subtitle: 'University of Engineering', date: '2019' }
        ]
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
  // 1. Independent Main Menu Triggers (ActionMenuRoot)
  // =========================================================================
  describe('1. Independent Main Menu Triggers in ActionMenuRoot', () => {
    it('T1.1: renders independent Translation and BYO-CV triggers outside the prompt dropdown in .l-navbar', () => {
      render(
        <CVProvider initialCV={mockCV}>
          <ActionMenuRoot />
        </CVProvider>
      );

      const navbar = document.querySelector('.l-navbar');
      expect(navbar).toBeInTheDocument();

      // Verify dedicated hub buttons exist in toolbar
      const translateBtn = screen.getByTestId('btn-open-translation');
      expect(translateBtn).toBeInTheDocument();
      expect(translateBtn).toHaveAttribute('aria-label', expect.stringMatching(/traducir cv/i));

      const byoBtn = screen.getByTestId('btn-open-byo-cv');
      expect(byoBtn).toBeInTheDocument();
      expect(byoBtn).toHaveAttribute('aria-label', expect.stringMatching(/trae tu propio cv/i));

      // Verify that the strict regression invariant <= 8 buttons on .action-menu-btn holds
      const topButtons = navbar.querySelectorAll('.action-menu-btn');
      expect(topButtons.length).toBeLessThanOrEqual(8);
    });

    it('T1.2: clicking Translation trigger opens modal configured directly for translate_english', () => {
      render(
        <CVProvider initialCV={mockCV}>
          <ActionMenuRoot />
        </CVProvider>
      );

      const translateBtn = screen.getByTestId('btn-open-translation');
      fireEvent.click(translateBtn);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Title must reflect translation mode directly
      expect(screen.getByText(/Traducción y Localización Cultural a Inglés/i)).toBeInTheDocument();
      expect(screen.getByTestId('ai-target-lang-select')).toBeInTheDocument();
      expect(screen.getByTestId('ai-response-ingestion-container')).toBeInTheDocument();
    });

    it('T1.3: clicking BYO-CV trigger opens modal configured directly for bring_your_own_cv', () => {
      render(
        <CVProvider initialCV={mockCV}>
          <ActionMenuRoot />
        </CVProvider>
      );

      const byoBtn = screen.getByTestId('btn-open-byo-cv');
      fireEvent.click(byoBtn);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Title must reflect ATS conversion mode
      expect(screen.getByRole('heading', { level: 3, name: /Trae tu propio CV \(Conversor PDF a JSON ATS 1:1\)/i })).toBeInTheDocument();
      expect(screen.getByTestId('ai-response-ingestion-container')).toBeInTheDocument();
    });

    it('T1.4: clicking standard Prompts button opens unidirectional modal filtering out bidirectional modes', () => {
      render(
        <CVProvider initialCV={mockCV}>
          <ActionMenuRoot />
        </CVProvider>
      );

      const promptsBtn = screen.getByRole('button', { name: /generar prompts de ia/i });
      fireEvent.click(promptsBtn);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // In unidirectional mode, select should NOT include translate_english
      const select = screen.getByTestId('ai-prompt-select');
      const options = Array.from(select.querySelectorAll('option')).map(o => o.value);
      expect(options).toContain('recruiter_audit');
      expect(options).toContain('star_enhancer');
      expect(options).not.toContain('translate_english');
      expect(options).not.toContain('bring_your_own_cv');
    });
  });

  // =========================================================================
  // 2. Live Impact Summary Enumeration
  // =========================================================================
  describe('2. Live Impact Summary Enumeration', () => {
    it('T2.1: displays Live Impact Summary enumerating candidate, experience, bullets and skills upon valid JSON input', () => {
      render(
        <CVProvider initialCV={mockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} initialPromptId="translate_english" />
        </CVProvider>
      );

      // Initially no impact summary
      expect(screen.queryByTestId('ai-impact-summary-callout')).toBeNull();

      // Paste formatted JSON
      const textarea = screen.getByTestId('ai-response-input');
      fireEvent.change(textarea, { target: { value: `\`\`\`json\n${sampleLLMResponseJSON}\n\`\`\`` } });

      // Live Impact Summary should appear immediately
      const impactCard = screen.getByTestId('ai-impact-summary-callout');
      expect(impactCard).toBeInTheDocument();

      // Enumerated elements verification
      expect(impactCard.textContent).toContain('Elena Rostova');
      expect(impactCard.textContent).toContain('Staff Distributed Systems Engineer');
      expect(impactCard.textContent).toContain('1 puestos registrados');
      expect(impactCard.textContent).toContain('2 viñetas de logros');
      expect(impactCard.textContent).toContain('1 categorías');
      expect(impactCard.textContent).toContain('4 tecnologías detectadas');
      expect(impactCard.textContent).toContain('1 títulos académicos');
      expect(impactCard.textContent).toContain('respaldará');
    });

    it('T2.2: hides Live Impact Summary if input is cleared or invalid', () => {
      render(
        <CVProvider initialCV={mockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} initialPromptId="translate_english" />
        </CVProvider>
      );

      const textarea = screen.getByTestId('ai-response-input');
      fireEvent.change(textarea, { target: { value: sampleLLMResponseJSON } });
      expect(screen.getByTestId('ai-impact-summary-callout')).toBeInTheDocument();

      // Change to invalid text
      fireEvent.change(textarea, { target: { value: 'invalid json text' } });
      expect(screen.queryByTestId('ai-impact-summary-callout')).toBeNull();
    });
  });

  // =========================================================================
  // 3. Auto-Paste on Window Focus & Toast Feedback
  // =========================================================================
  describe('3. Auto-Paste on Window Focus & Toast Feedback', () => {
    it('T3.1: auto-pastes from clipboard on window focus when waiting for AI and validates automatically', async () => {
      const mockShowToast = vi.fn();
      const ConsumerTester = () => {
        const { showToast } = useCV();
        return <div data-testid="toast-hook-tester" />;
      };

      // Mock navigator.clipboard
      const mockClipboardText = `\`\`\`json\n${sampleLLMResponseJSON}\n\`\`\``;
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(),
          readText: vi.fn().mockResolvedValue(mockClipboardText)
        }
      });

      render(
        <CVProvider initialCV={mockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} initialPromptId="translate_english" />
        </CVProvider>
      );

      // Trigger copy to enter waiting mode
      const copyBtn = screen.getByTestId('ai-copy-btn');
      await act(async () => {
        fireEvent.click(copyBtn);
      });

      // Simulate window focus (user returning from external AI tab)
      await act(async () => {
        window.dispatchEvent(new Event('focus'));
      });

      // Verification: text was pasted automatically into textarea
      await waitFor(() => {
        const textarea = screen.getByTestId('ai-response-input');
        expect(textarea.value).toBe(mockClipboardText);
      });

      // Verification: impact summary is rendered automatically
      expect(screen.getByTestId('ai-impact-summary-callout')).toBeInTheDocument();
    });
  });
});
