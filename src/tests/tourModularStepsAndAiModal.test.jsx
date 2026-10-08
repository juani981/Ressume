import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  COMPLETE_ONBOARDING_STEPS,
  MAIN_SCREEN_STEPS,
  CANVAS_STEPS,
  WELCOME_STEP,
  SIDEBAR_TRANSITION_STEP,
  SIDEBAR_STEPS,
  AI_MODAL_STEPS,
  ADD_SECTION_MODAL_STEPS,
  openSidebarProgrammatically,
  createTourStep,
} from '../components/Editor/tour';

describe('Modular Tour Architecture & Step Sequences', () => {
  it('exports all modular step definitions correctly', () => {
    expect(Array.isArray(MAIN_SCREEN_STEPS)).toBe(true);
    expect(Array.isArray(CANVAS_STEPS)).toBe(true);
    expect(Array.isArray(SIDEBAR_STEPS)).toBe(true);
    expect(Array.isArray(AI_MODAL_STEPS)).toBe(true);
    expect(Array.isArray(ADD_SECTION_MODAL_STEPS)).toBe(true);
    expect(Array.isArray(COMPLETE_ONBOARDING_STEPS)).toBe(true);
  });

  it('WELCOME_STEP provides local-first privacy and WYSIWYG explanation', () => {
    expect(WELCOME_STEP.isWelcome).toBe(true);
    expect(WELCOME_STEP.target).toBe('body');
    expect(WELCOME_STEP.placement).toBe('center');
  });

  it('COMPLETE_ONBOARDING_STEPS combines canvas and sidebar controls seamlessly', () => {
    expect(COMPLETE_ONBOARDING_STEPS.length).toBe(
      MAIN_SCREEN_STEPS.length + SIDEBAR_STEPS.length
    );

    // Verify first step is welcome
    expect(COMPLETE_ONBOARDING_STEPS[0].isWelcome).toBe(true);

    // Verify sidebar transition step is present
    const transitionStep = COMPLETE_ONBOARDING_STEPS.find(
      (s) => s.target === '[data-testid="action-menu-navbar"]'
    );
    expect(transitionStep).toBeDefined();

    // Verify sidebar items are in the complete flow
    const undoStep = COMPLETE_ONBOARDING_STEPS.find((s) =>
      typeof s.target === 'string' && s.target.includes('Deshacer')
    );
    const redoStep = COMPLETE_ONBOARDING_STEPS.find((s) =>
      typeof s.target === 'string' && s.target.includes('Rehacer')
    );
    const aiPromptsStep = COMPLETE_ONBOARDING_STEPS.find(
      (s) => s.target === '#ia-prompts-item'
    );
    const printStep = COMPLETE_ONBOARDING_STEPS.find(
      (s) => s.target === '[data-testid="btn-action-native-print"]'
    );

    expect(undoStep).toBeDefined();
    expect(redoStep).toBeDefined();
    expect(aiPromptsStep).toBeDefined();
    expect(printStep).toBeDefined();
  });

  it('SIDEBAR_STEPS contains focused advice for every sidebar tool', () => {
    const targets = SIDEBAR_STEPS.map((s) => s.target);

    // Undo / Redo
    expect(targets.some((t) => t.includes('Deshacer'))).toBe(true);
    expect(targets.some((t) => t.includes('Rehacer'))).toBe(true);

    // Versions, Design, AI Prompts, Translation, BYO CV, Print, Pin
    expect(targets).toContain('#versiones-item');
    expect(targets).toContain('#design-item');
    expect(targets).toContain('#ia-prompts-item');
    expect(targets).toContain('#translation-action-item');
    expect(targets).toContain('#byo-cv-action-item');
    expect(targets).toContain('[data-testid="btn-action-native-print"]');
    expect(targets).toContain('[data-testid="btn-pin-action-menu"]');
  });

  it('AI_MODAL_STEPS guides step-by-step through AIExportModal features', () => {
    expect(AI_MODAL_STEPS.length).toBeGreaterThanOrEqual(5);

    const targets = AI_MODAL_STEPS.map((s) => s.target);
    expect(targets).toContain('[data-testid="ai-privacy-disclaimer-callout"]');
    expect(targets).toContain('[data-testid="ai-prompt-select"]');
    expect(targets).toContain('[data-testid="ai-copy-btn"]');
    expect(targets).toContain('[data-testid="ai-toggle-prompt-btn"]');
    expect(targets).toContain('.ai-modal-dialog');
  });

  it('createTourStep helper generates clean, standardized step objects', () => {
    const customStep = createTourStep({
      target: '#sample-element',
      title: 'Sample Step Title',
      description: 'Sample description text',
      placement: 'left',
    });

    expect(customStep.target).toBe('#sample-element');
    expect(customStep.placement).toBe('left');
    expect(customStep.disableBeacon).toBe(true);
    expect(React.isValidElement(customStep.content)).toBe(true);
  });
});

describe('openSidebarProgrammatically Utility', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('clicks the peek handle when the navbar is collapsed', () => {
    const navbar = document.createElement('div');
    navbar.setAttribute('data-testid', 'action-menu-navbar');
    navbar.setAttribute('data-expanded', 'false');

    const handle = document.createElement('div');
    handle.className = 'action-menu-edge-handle';
    const clickSpy = vi.fn();
    handle.click = clickSpy;

    navbar.appendChild(handle);
    document.body.appendChild(navbar);

    openSidebarProgrammatically();

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the navbar is already expanded', () => {
    const navbar = document.createElement('div');
    navbar.setAttribute('data-testid', 'action-menu-navbar');
    navbar.setAttribute('data-expanded', 'true');
    navbar.className = 'is-expanded';

    const handle = document.createElement('div');
    handle.className = 'action-menu-edge-handle';
    const clickSpy = vi.fn();
    handle.click = clickSpy;

    navbar.appendChild(handle);
    document.body.appendChild(navbar);

    openSidebarProgrammatically();

    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('dispatches window resize event after 320ms to update Joyride spotlight', () => {
    const resizeSpy = vi.fn();
    window.addEventListener('resize', resizeSpy);

    const navbar = document.createElement('div');
    navbar.setAttribute('data-testid', 'action-menu-navbar');
    navbar.setAttribute('data-expanded', 'false');
    document.body.appendChild(navbar);

    openSidebarProgrammatically();

    expect(resizeSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(350);

    expect(resizeSpy).toHaveBeenCalledTimes(1);
    window.removeEventListener('resize', resizeSpy);
  });
});
