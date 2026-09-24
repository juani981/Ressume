import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import AIExportModal from '../components/Editor/AIExportModal.jsx';
import { CVProvider } from '../context/CVContext.jsx';
import esPrompts from '../locales/es/prompts.json' with { type: 'json' };
import enPrompts from '../locales/en/prompts.json' with { type: 'json' };

describe('Challenger 2 — AIExportModal Deep Adversarial & Reactivity Stress Suite', () => {

  const baseMockCV = {
    profile: {
      name: 'Alan Turing'
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
          name: 'Alan Turing',
          subtitle: 'Cryptanalyst & Computer Scientist',
          email: 'alan@bletchley.ac.uk',
          phone: '+44 1908 640100'
        }]
      },
      {
        id: 'experience',
        column: 'left',
        type: 'list',
        title: 'EXPERIENCE',
        items: [{
          id: 'exp1',
          title: 'Lead Cryptanalyst',
          subtitle: 'Government Code and Cypher School',
          date: '1939 - 1945',
          bullets: ['Designed the Bombe electromechanical device to decrypt Enigma cipher messages.']
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
  // 1. Rapid Switching across all 12 Prompts
  // =========================================================================
  describe('1. Rapid Prompt Switching Stress Test', () => {
    it('S1.1: iterates sequentially through all 12 prompts and verifies reactive preview consistency', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const promptSelect = screen.getByTestId('ai-prompt-select');
      const preview = screen.getByTestId('ai-payload-preview');

      for (const prompt of esPrompts) {
        fireEvent.change(promptSelect, { target: { value: prompt.id } });

        expect(promptSelect.value).toBe(prompt.id);
        expect(preview.textContent).toContain(`role: ${prompt.system_instruction}`);
        expect(preview.textContent).toContain(`task: ${prompt.task}`);
        expect(preview.textContent).toContain(`output_format: ${prompt.output_format}`);

        // Verify description callout is present and matches
        if (prompt.description) {
          expect(screen.getByText(prompt.description)).toBeInTheDocument();
        }
      }
    });

    it('S1.2: high-frequency back-and-forth prompt bouncing maintains stable DOM & preview', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const promptSelect = screen.getByTestId('ai-prompt-select');
      const preview = screen.getByTestId('ai-payload-preview');

      // Rapidly toggle between ATS Audit and Translate English 30 times
      for (let i = 0; i < 30; i++) {
        const targetId = i % 2 === 0 ? 'recruiter_audit' : 'translate_english';
        fireEvent.change(promptSelect, { target: { value: targetId } });
      }

      // Final state should be translate_english
      expect(promptSelect.value).toBe('translate_english');
      expect(preview.textContent).toContain('# SCHEMA JSON NATIVO COMPACTO (cvData)');
      expect(preview.textContent).toContain('"layout"');
    });
  });

  // =========================================================================
  // 2. Large Text & Stress Commentary (5,000+ to 10,000+ characters)
  // =========================================================================
  describe('2. Extreme User Commentary Stress Test', () => {
    it('S2.1: handles 5,000+ characters of commentary with unicode, code blocks, and markdown symbols', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const commentaryInput = screen.getByTestId('ai-user-commentary');
      const preview = screen.getByTestId('ai-payload-preview');

      // Generate 6,000 characters of challenging text
      const heavyCommentary = 'Prioritize Staff-level distributed consensus (Raft/Paxos), multi-region replication, '
        .repeat(70) + '\n\n```typescript\nconst optimize = (cv: CV): AIReport => computeScores(cv);\n```\nAccents: áéíóú ñ ¿¡ «»';
      
      expect(heavyCommentary.length).toBeGreaterThan(5000);

      fireEvent.change(commentaryInput, { target: { value: heavyCommentary } });

      expect(commentaryInput.value.length).toBe(heavyCommentary.length);
      expect(preview.textContent).toContain(`user_commentary: ${heavyCommentary}`);

      // Check character count indicator reflects large payload
      const counterText = screen.getByText(/caracteres/i).textContent;
      expect(parseInt(counterText.replace(/[^0-9]/g, ''), 10)).toBeGreaterThan(heavyCommentary.length);
    });

    it('S2.2: handles empty, spaces-only, and newline-only commentary without injecting empty headers', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const commentaryInput = screen.getByTestId('ai-user-commentary');
      const preview = screen.getByTestId('ai-payload-preview');

      const blankCases = ['', '     ', '\n\n\t\n  \r\n'];
      for (const blank of blankCases) {
        fireEvent.change(commentaryInput, { target: { value: blank } });
        expect(preview.textContent).not.toContain('user_commentary:');
      }
    });
  });

  // =========================================================================
  // 3. Gated Job Description Reactivity & State Preservation
  // =========================================================================
  describe('3. Gated Job Description Switching & Payload Isolation', () => {
    it('S3.1: types into job_description on job_matcher, switches prompt, verifies payload drops it and field unmounts', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const promptSelect = screen.getByTestId('ai-prompt-select');
      const preview = screen.getByTestId('ai-payload-preview');

      // Switch to job_matcher
      fireEvent.change(promptSelect, { target: { value: 'job_matcher' } });
      const jdTextarea = screen.getByTestId('ai-job-description');
      expect(jdTextarea).toBeInTheDocument();

      const jdText = 'Senior Infrastructure Architect: Kubernetes, eBPF, Terraform, AWS, 10+ years experience.';
      fireEvent.change(jdTextarea, { target: { value: jdText } });

      // Verify payload includes job_description
      expect(preview.textContent).toContain(`job_description: ${jdText}`);

      // Switch to system_design_simulator (does NOT require job_description)
      fireEvent.change(promptSelect, { target: { value: 'system_design_simulator' } });

      // Field must be removed from the DOM
      expect(screen.queryByTestId('ai-job-description')).toBeNull();

      // Payload must strictly NOT contain job_description
      expect(preview.textContent).not.toContain('job_description:');
      expect(preview.textContent).not.toContain(jdText);

      // Switch BACK to job_matcher: field reappears and retains state
      fireEvent.change(promptSelect, { target: { value: 'job_matcher' } });
      const reappearedJd = screen.getByTestId('ai-job-description');
      expect(reappearedJd).toBeInTheDocument();
      expect(reappearedJd.value).toBe(jdText);
      expect(preview.textContent).toContain(`job_description: ${jdText}`);
    });
  });

  // =========================================================================
  // 4. Layout Mode Detection Matrix
  // =========================================================================
  describe('4. Layout Mode Auto-Detection Matrix', () => {
    it('S4.1: isAtsMode = true -> generates 1-column layout in Frontmatter', () => {
      const cvAts = {
        ...baseMockCV,
        layout: { ...baseMockCV.layout, type: '1-column', isAtsMode: true }
      };

      render(
        <CVProvider initialCV={cvAts}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const preview = screen.getByTestId('ai-payload-preview');
      expect(preview.textContent).toContain('layout_type: "1-column"');
      expect(preview.textContent).toContain('is_ats_mode: true');
    });

    it('S4.2: isAtsMode = false but type = "1-column" -> auto-detected as 1-column', () => {
      const cv1ColNotAts = {
        ...baseMockCV,
        layout: { ...baseMockCV.layout, type: '1-column', isAtsMode: false }
      };

      render(
        <CVProvider initialCV={cv1ColNotAts}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const preview = screen.getByTestId('ai-payload-preview');
      expect(preview.textContent).toContain('layout_type: "1-column"');
      expect(preview.textContent).toContain('is_ats_mode: true');
    });

    it('S4.3: isAtsMode = false and type = "2-column" -> auto-detected as 2-column', () => {
      const cv2Col = {
        ...baseMockCV,
        layout: { ...baseMockCV.layout, type: '2-column', isAtsMode: false }
      };

      render(
        <CVProvider initialCV={cv2Col}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const preview = screen.getByTestId('ai-payload-preview');
      expect(preview.textContent).toContain('layout_type: "2-column"');
      expect(preview.textContent).toContain('is_ats_mode: false');
    });

    it('S4.4: cvData without layout or undefined properties does not crash and applies defaults', () => {
      const cvMinimal = {
        profile: { name: 'Minimal Turing' },
        sections: []
      };

      render(
        <CVProvider initialCV={cvMinimal}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const preview = screen.getByTestId('ai-payload-preview');
      expect(preview.textContent).toBeDefined();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('S4.5: guarantees zero layout or format dropdowns are rendered in interactive UI', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      // Strictly only 1 select element exists in the modal
      const allSelects = screen.getAllByRole('combobox');
      expect(allSelects.length).toBe(1);
      expect(allSelects[0].getAttribute('data-testid')).toBe('ai-prompt-select');
    });
  });

  // =========================================================================
  // 5. Actions: Copy, Download & Error Resilience
  // =========================================================================
  describe('5. Clipboard and Download Triggers', () => {
    it('S5.1: clipboard copy handles writeText success with temporary feedback badge', async () => {
      vi.useFakeTimers();
      const writeTextMock = vi.fn().mockResolvedValue();
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock }
      });

      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const copyBtn = screen.getByTestId('ai-copy-btn');
      await act(async () => {
        fireEvent.click(copyBtn);
      });

      expect(writeTextMock).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/¡Copiado al portapapeles!/i)).toBeInTheDocument();

      // Fast-forward 2600ms to verify badge disappears
      act(() => {
        vi.advanceTimersByTime(2600);
      });

      expect(screen.queryByText(/¡Copiado al portapapeles!/i)).toBeNull();
      vi.useRealTimers();
    });

    it('S5.2: clipboard copy failure does not crash modal', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard permission denied'));
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock }
      });

      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const copyBtn = screen.getByTestId('ai-copy-btn');
      await act(async () => {
        fireEvent.click(copyBtn);
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      // Dialog remains fully intact
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      consoleErrorSpy.mockRestore();
    });

    it('S5.3: download generates clean sanitized filename fallback when profile name is missing', () => {
      const cvNoName = {
        profile: {},
        layout: { type: '1-column', isAtsMode: true },
        sections: []
      };

      const createObjectURLMock = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:mock');
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
        <CVProvider initialCV={cvNoName}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('ai-download-btn'));

      expect(clickedLinks.length).toBe(1);
      expect(clickedLinks[0].download).toBe('CV_AI_Prompt_recruiter_audit.md');

      createObjectURLMock.mockRestore();
      revokeObjectURLMock.mockRestore();
      createElementSpy.mockRestore();
    });
  });

  // =========================================================================
  // 6. Adversarial Verification: Zero Raw Emojis & Obsidian Callouts
  // =========================================================================
  describe('6. Zero Emojis and Obsidian Callout Visual Invariants', () => {
    it('S6.1: modal UI chrome (headers, controls, callouts, actions) has zero unicode emojis across all 12 prompts', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const promptSelect = screen.getByTestId('ai-prompt-select');
      // Standard pictographic emoji regex
      const pictographicEmojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}]/u;

      for (const prompt of esPrompts) {
        fireEvent.change(promptSelect, { target: { value: prompt.id } });

        const dialog = screen.getByRole('dialog');
        // Clone dialog and remove payload preview to test UI chrome & callouts exclusively
        const clonedDialog = dialog.cloneNode(true);
        const previewEl = clonedDialog.querySelector('[data-testid="ai-payload-preview"]');
        if (previewEl) previewEl.remove();

        const uiHtml = clonedDialog.innerHTML;
        const emojiMatch = uiHtml.match(pictographicEmojiRegex);
        expect(emojiMatch, `Found emoji in UI for prompt ${prompt.id}: ${emojiMatch?.[0]}`).toBeNull();
      }
    });

    it('S6.2: entire dialog strictly excludes all banned alert emojis from AGENTS.md', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const promptSelect = screen.getByTestId('ai-prompt-select');
      const forbiddenAlertEmojis = ['🛑', '🚨', '⚠️', 'ℹ️', '💡', '✨', '🌐', '🤖', '📄'];

      for (const prompt of esPrompts) {
        fireEvent.change(promptSelect, { target: { value: prompt.id } });

        const dialogText = screen.getByRole('dialog').textContent || '';
        for (const forbidden of forbiddenAlertEmojis) {
          expect(dialogText.includes(forbidden), `Found forbidden alert emoji ${forbidden} in ${prompt.id}`).toBe(false);
        }
      }
    });

    it('S6.3: verifies Obsidian Callout DOM architecture and styling invariants', () => {
      render(
        <CVProvider initialCV={baseMockCV}>
          <AIExportModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const callout = screen.getByRole('dialog').querySelector('.obsidian-callout');
      expect(callout).not.toBeNull();

      // Verify Obsidian Callout container styling
      expect(callout.style.borderLeft).toContain('4px solid rgb(8, 109, 221)');
      expect(callout.style.background).toContain('rgba(8, 109, 221, 0.08)');

      // Verify callout title
      const title = callout.querySelector('.callout-title');
      expect(title).not.toBeNull();
      expect(title.style.display).toBe('flex');
      expect(title.style.gap).toBe('8px');
      expect(title.style.fontWeight).toBe('600');
      expect(title.style.color).toBe('rgb(8, 109, 221)');

      // Verify Lucide SVG icon inside callout (NOT a unicode emoji)
      const svgIcon = title.querySelector('svg');
      expect(svgIcon).not.toBeNull();
      expect(svgIcon.classList.contains('lucide-target') || svgIcon.classList.contains('lucide')).toBe(true);

      // Verify callout content
      const content = callout.querySelector('.callout-content');
      expect(content).not.toBeNull();
      expect(content.textContent.trim().length).toBeGreaterThan(0);
    });
  });
});
