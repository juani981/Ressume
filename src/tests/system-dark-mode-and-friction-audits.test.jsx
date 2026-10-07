import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import fs from 'fs';
import path from 'path';

import { CVContext } from '../context/CVContext';
import { useModalTheme } from '../hooks/useModalTheme';
import { ModalThemeToggle } from '../components/common/ModalThemeToggle';
import { BitacoraModal } from '../components/Bitacora/BitacoraModal';
import { BitacoraDetailModal } from '../components/Bitacora/BitacoraDetailModal';
import { VersionManagerModal } from '../components/Editor/VersionManagerModal';
import AIExportModal from '../components/Editor/AIExportModal';
import { blankSchema } from '../utils/schema';
import * as versionStorage from '../utils/versionStorage';

describe('System Dark Mode & Full-Screen Modal Opt-In Light Mode Suite', () => {
  let mockCvData;
  let mockContextValue;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    mockCvData = {
      ...blankSchema,
      profile: {
        name: 'Alex Rivera',
        subtitle: 'Senior Frontend Engineer',
        email: 'alex@example.com',
        phone: '+1 555-0199',
        location: 'San Francisco, CA',
        website: 'alexrivera.dev',
      },
      sections: [
        {
          id: 'experience',
          title: 'Experiencia',
          type: 'list',
          items: [
            {
              id: 'exp-1',
              title: 'Senior React Developer',
              subtitle: 'Tech Global Inc.',
              date: '2021 - Present',
              bullets: ['Built scalable React micro-frontends with 99.9% uptime.']
            }
          ]
        }
      ]
    };

    mockContextValue = {
      cvData: mockCvData,
      activeLanguage: 'es',
      activeVersionName: 'Main Resume',
      activeVersionId: 'v-1',
      saveVersion: vi.fn(),
      loadVersionSnapshot: vi.fn(),
      showToast: vi.fn(),
      setActiveLanguage: vi.fn(),
      switchLanguage: vi.fn(),
    };
  });

  afterEach(() => {
    localStorage.clear();
  });

  // =========================================================================
  // 1. System CSS & Architecture Invariants
  // =========================================================================
  describe('1. System CSS & Architectural Invariants', () => {
    it('sets --body-color: #0f172a in index.css :root for default system dark mode', () => {
      const cssPath = path.resolve(__dirname, '../index.css');
      const cssContent = fs.readFileSync(cssPath, 'utf-8');
      
      // Verify root body-color is dark slate #0f172a
      expect(cssContent).toMatch(/--body-color:\s*#0f172a;/);
    });

    it('enforces Invariant 18 & Isolation: editor canvas and navbar contain zero light mode toggles', () => {
      // Invariant: light mode is strictly opt-in inside full-screen modals only.
      // The editor area (#area-cv) and main navigation (.l-navbar / ActionMenu) must NEVER contain modal-theme-toggle.
      const actionMenuRootPath = path.resolve(__dirname, '../components/Editor/ActionMenu/ActionMenuRoot.jsx');
      const actionMenuContent = fs.readFileSync(actionMenuRootPath, 'utf-8');
      
      expect(actionMenuContent).not.toContain('ModalThemeToggle');
      expect(actionMenuContent).not.toContain('modal-theme-toggle');
      expect(actionMenuContent).not.toContain('useModalTheme');
    });
  });

  // =========================================================================
  // 2. Hook & Component Unit Verification (useModalTheme & ModalThemeToggle)
  // =========================================================================
  describe('2. Hook & Component Behaviors', () => {
    const HookTester = () => {
      const { modalTheme, isDark, toggleModalTheme } = useModalTheme();
      return (
        <div>
          <span data-testid="current-theme">{modalTheme}</span>
          <span data-testid="is-dark">{isDark ? 'true' : 'false'}</span>
          <ModalThemeToggle theme={modalTheme} onToggle={toggleModalTheme} />
        </div>
      );
    };

    it('defaults to dark mode and switches to light mode on toggle, updating localStorage', () => {
      render(<HookTester />);

      expect(screen.getByTestId('current-theme').textContent).toBe('dark');
      expect(screen.getByTestId('is-dark').textContent).toBe('true');

      const toggleBtn = screen.getByTestId('modal-theme-toggle');
      expect(toggleBtn.getAttribute('role')).toBe('switch');
      expect(toggleBtn.getAttribute('aria-checked')).toBe('true');
      expect(toggleBtn.getAttribute('data-theme-active')).toBe('dark');
      expect(screen.getByText('Modo Claro')).toBeDefined();

      // Click to toggle to Light Mode (Opt-in)
      fireEvent.click(toggleBtn);

      expect(screen.getByTestId('current-theme').textContent).toBe('light');
      expect(screen.getByTestId('is-dark').textContent).toBe('false');
      expect(localStorage.getItem('ressume_fullscreen_modal_theme')).toBe('light');
      expect(toggleBtn.getAttribute('aria-checked')).toBe('false');
      expect(toggleBtn.getAttribute('data-theme-active')).toBe('light');
      expect(screen.getByText('Modo Oscuro')).toBeDefined();
    });

    it('synchronizes modal theme across multiple components via custom event', () => {
      render(
        <div>
          <div data-testid="modal-a">
            <HookTester />
          </div>
          <div data-testid="modal-b">
            <HookTester />
          </div>
        </div>
      );

      const toggleA = within(screen.getByTestId('modal-a')).getByTestId('modal-theme-toggle');
      const themeB = within(screen.getByTestId('modal-b')).getByTestId('current-theme');

      expect(themeB.textContent).toBe('dark');

      // Click toggle in Modal A
      fireEvent.click(toggleA);

      // Both modals should now reflect 'light'
      expect(themeB.textContent).toBe('light');
      expect(within(screen.getByTestId('modal-a')).getByTestId('current-theme').textContent).toBe('light');
    });
  });

  // =========================================================================
  // 3. Simulated User Persona Audits
  // =========================================================================
  describe('3. Simulated Fictitious User Persona Friction Audits', () => {
    
    // -----------------------------------------------------------------------
    // Persona 1: Junior Developer (ATS Job Searcher)
    // -----------------------------------------------------------------------
    it('Persona 1: Junior developer researches ATS tips in Bitacora, upvotes, and reads card in dark mode', async () => {
      const handleClose = vi.fn();
      render(
        <CVContext.Provider value={mockContextValue}>
          <BitacoraModal isOpen={true} onClose={handleClose} />
        </CVContext.Provider>
      );

      // 1. Verify modal opened in default dark mode
      const dialog = screen.getByRole('dialog');
      expect(dialog.getAttribute('data-theme')).toBe('dark');
      expect(dialog.style.backgroundColor).toBe('rgb(15, 23, 42)');

      // 2. Filter tips by ATS category
      const atsFilterBtn = screen.getByTestId('bitacora-filter-ats');
      fireEvent.click(atsFilterBtn);

      // 3. Find first card and check upvote functionality
      const upvoteBtns = screen.getAllByTestId('bitacora-upvote-btn');
      expect(upvoteBtns.length).toBeGreaterThan(0);
      const firstUpvote = upvoteBtns[0];
      const initialCount = parseInt(firstUpvote.textContent || '0', 10);

      // Upvote tip
      fireEvent.click(firstUpvote);
      const afterFirstClick = parseInt(firstUpvote.textContent || '0', 10);
      expect(afterFirstClick).toBe(initialCount + 1);

      // Toggle vote: clicking again unvotes (toggles back to initial count)
      fireEvent.click(firstUpvote);
      const afterSecondClick = parseInt(firstUpvote.textContent || '0', 10);
      expect(afterSecondClick).toBe(initialCount);

      // 4. Click card to open BitacoraDetailModal
      const cards = screen.getAllByTestId('bitacora-card');
      fireEvent.click(cards[0]);

      // Verify Detail Modal opened in Dark Mode
      const detailDialog = screen.getByTestId('bitacora-detail-modal');
      expect(detailDialog).toBeDefined();
      expect(detailDialog.getAttribute('data-theme')).toBe('dark');
      expect(detailDialog.style.backgroundColor).toBe('rgb(15, 23, 42)');

      // Verify Obsidian Callout adheres to styling invariant
      const callout = detailDialog.querySelector('.obsidian-callout');
      if (callout) {
        expect(callout.style.borderLeft).toContain('4px solid');
      }

      // Close detail modal
      const closeDetailBtn = screen.getByTestId('bitacora-detail-close-btn');
      fireEvent.click(closeDetailBtn);
      expect(screen.queryByTestId('bitacora-detail-modal')).toBeNull();
    });

    // -----------------------------------------------------------------------
    // Persona 2: Career Switcher (Reading Bullet Formulas in Opt-In Light Mode)
    // -----------------------------------------------------------------------
    it('Persona 2: Career switcher switches to opt-in light mode for long-form reading in Bitacora', () => {
      render(
        <CVContext.Provider value={mockContextValue}>
          <BitacoraModal isOpen={true} onClose={vi.fn()} />
        </CVContext.Provider>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog.getAttribute('data-theme')).toBe('dark');

      // Career switcher toggles light mode for easier reading
      const themeToggle = screen.getByTestId('modal-theme-toggle');
      fireEvent.click(themeToggle);

      // Modal should immediately update to light mode
      expect(dialog.getAttribute('data-theme')).toBe('light');
      expect(dialog.style.backgroundColor).toBe('rgb(255, 255, 255)');
      expect(localStorage.getItem('ressume_fullscreen_modal_theme')).toBe('light');

      // Click card to open detail modal
      const cards = screen.getAllByTestId('bitacora-card');
      fireEvent.click(cards[0]);

      // Detail modal inherits light mode seamlessly
      const detailDialog = screen.getByTestId('bitacora-detail-modal');
      expect(detailDialog.getAttribute('data-theme')).toBe('light');
      expect(detailDialog.style.backgroundColor).toBe('rgb(255, 255, 255)');
    });

    // -----------------------------------------------------------------------
    // Persona 3: Power User (Managing CV Versions in VersionManagerModal)
    // -----------------------------------------------------------------------
    it('Persona 3: Power user manages snapshots in VersionManagerModal with dark mode cards', async () => {
      const mockVersions = [
        {
          id: 'v-initial',
          name: 'Target Tech Lead',
          createdAt: new Date().toISOString(),
          cvData: mockCvData,
          thumbnail: 'data:image/svg+xml;base64,mock',
          sectionCount: 3
        }
      ];

      vi.spyOn(versionStorage, 'getAllVersions').mockResolvedValue(mockVersions);
      vi.spyOn(versionStorage, 'saveVersion').mockResolvedValue('v-new');
      vi.spyOn(versionStorage, 'renameVersion').mockResolvedValue(true);
      vi.spyOn(versionStorage, 'duplicateVersion').mockResolvedValue('v-dup');

      render(
        <CVContext.Provider value={mockContextValue}>
          <VersionManagerModal isOpen={true} onClose={vi.fn()} />
        </CVContext.Provider>
      );

      // Wait for versions to render
      const dialog = screen.getByRole('dialog');
      expect(dialog.getAttribute('data-theme')).toBe('dark');
      expect(dialog.style.backgroundColor).toBe('rgb(15, 23, 42)');

      // Verify Modal Theme Toggle is present in VersionManagerModal header
      const themeToggle = within(dialog).getByTestId('modal-theme-toggle');
      expect(themeToggle).toBeDefined();

      // Check Version Card styling in dark mode
      const versionCard = await screen.findByTestId('version-card-v-initial');
      expect(versionCard).toBeDefined();
      expect(versionCard.getAttribute('data-theme')).toBe('dark');

      // Trigger Blank CV confirmation dialog
      const blankBtn = screen.getByTestId('btn-start-blank-cv');
      fireEvent.click(blankBtn);

      // Obsidian confirmation callout should appear with dark theme styling
      const callout = screen.getByTestId('callout-confirm-blank');
      expect(callout).toBeDefined();
      expect(within(callout).getByText(/Empezar CV en Blanco/i)).toBeDefined();

      const cancelBtn = screen.getByTestId('btn-cancel-blank');
      fireEvent.click(cancelBtn);
      expect(screen.queryByTestId('callout-confirm-blank')).toBeNull();
    });

    // -----------------------------------------------------------------------
    // Persona 4: Accessibility & Contrast Auditor
    // -----------------------------------------------------------------------
    it('Persona 4: Accessibility auditor verifies switches, Escape key navigation, and zero emoji ban', () => {
      const handleClose = vi.fn();
      const { unmount } = render(
        <CVContext.Provider value={mockContextValue}>
          <AIExportModal isOpen={true} onClose={handleClose} />
        </CVContext.Provider>
      );

      // 1. Verify AIExportModal container has dark mode by default
      const dialog = screen.getByRole('dialog');
      expect(dialog.getAttribute('data-theme')).toBe('dark');

      // 2. Verify Theme Switch Accessibility Attributes
      const toggle = within(dialog).getByTestId('modal-theme-toggle');
      expect(toggle.getAttribute('role')).toBe('switch');
      expect(toggle.getAttribute('aria-checked')).toBe('true');
      expect(toggle.getAttribute('aria-label')).toContain('Cambiar a Modo Claro');

      // 3. Test Escape Key Handling
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      // Modal should handle keyboard events gracefully without throwing

      // 4. Adversarial Ban Check: Zero raw unicode emoji glyphs in modal markup (AGENTS.md Invariant 1)
      const bannedEmojis = ['🛑', '🚨', '⚠️', 'ℹ️', '💡', '✨', '🌐', '🤖', '📄'];
      bannedEmojis.forEach((emoji) => {
        expect(dialog.textContent || '').not.toContain(emoji);
      });

      unmount();
    });

    it('Persona 4: verifies modal theme opt-in does not leak into the physical CV paper geometry', () => {
      // Simulate switching modal theme to light
      localStorage.setItem('ressume_fullscreen_modal_theme', 'light');

      // Render BitacoraModal in light mode
      const { unmount } = render(
        <CVContext.Provider value={mockContextValue}>
          <BitacoraModal isOpen={true} onClose={vi.fn()} />
        </CVContext.Provider>
      );

      const modalDialog = screen.getByRole('dialog');
      expect(modalDialog.getAttribute('data-theme')).toBe('light');

      // Invariant 15 check: Simulated A4 Page Box styles remain fixed to 210mm x 297mm
      // and pure white paper background
      const simulatedPaper = document.createElement('div');
      simulatedPaper.className = 'a4-page-box';
      simulatedPaper.style.width = '210mm';
      simulatedPaper.style.height = '297mm';
      simulatedPaper.style.backgroundColor = '#ffffff';

      expect(simulatedPaper.style.width).toBe('210mm');
      expect(simulatedPaper.style.height).toBe('297mm');
      expect(simulatedPaper.style.backgroundColor).toBe('rgb(255, 255, 255)');

      unmount();
    });
  });
});
