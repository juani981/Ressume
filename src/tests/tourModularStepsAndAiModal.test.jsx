import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import {
  COMPLETE_ONBOARDING_STEPS,
  MAIN_SCREEN_STEPS,
  CANVAS_STEPS,
  WELCOME_STEP,
  SIDEBAR_TRANSITION_STEP,
  SIDEBAR_STEPS,
  AI_MODAL_STEPS,
  AI_MODAL_STEPS_SIMPLE,
  AI_MODAL_STEPS_TRANSLATION,
  AI_MODAL_STEPS_BYO_CV,
  getAIModalTourSteps,
  isAIModalSteps,
  ADD_SECTION_MODAL_STEPS,
  openSidebarProgrammatically,
  createTourStep,
} from '../components/Editor/tour';
import { AppModals } from '../components/Editor/AppModals';
import { TourProvider } from '../context/TourContext';
import { CVProvider } from '../context/CVContext';

vi.mock('react-joyride', () => {
  return {
    Joyride: (props) => (
      <div
        data-testid="joyride-mock"
        data-run={String(props.run)}
        data-step-index={props.stepIndex}
      />
    ),
    default: (props) => (
      <div
        data-testid="joyride-mock"
        data-run={String(props.run)}
        data-step-index={props.stepIndex}
      />
    ),
  };
});

describe('Modular Tour Architecture & Step Sequences', () => {
  it('exports all modular step definitions correctly', () => {
    expect(Array.isArray(MAIN_SCREEN_STEPS)).toBe(true);
    expect(Array.isArray(CANVAS_STEPS)).toBe(true);
    expect(Array.isArray(SIDEBAR_STEPS)).toBe(true);
    expect(Array.isArray(AI_MODAL_STEPS)).toBe(true);
    expect(Array.isArray(AI_MODAL_STEPS_SIMPLE)).toBe(true);
    expect(Array.isArray(AI_MODAL_STEPS_TRANSLATION)).toBe(true);
    expect(Array.isArray(AI_MODAL_STEPS_BYO_CV)).toBe(true);
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

  it('AI_MODAL_STEPS_SIMPLE has 3 steps: privacy callout -> copy btn -> external providers', () => {
    expect(AI_MODAL_STEPS_SIMPLE.length).toBe(3);
    const targets = AI_MODAL_STEPS_SIMPLE.map((s) => s.target);
    expect(targets[0]).toBe('[data-testid="ai-privacy-disclaimer-callout"]');
    expect(targets[1]).toBe('[data-testid="ai-copy-btn"]');
    expect(targets[2]).toBe('[data-testid="ai-providers-container"]');
  });

  it('AI_MODAL_STEPS_TRANSLATION has 4 steps ending with paste response button', () => {
    expect(AI_MODAL_STEPS_TRANSLATION.length).toBe(4);
    const targets = AI_MODAL_STEPS_TRANSLATION.map((s) => s.target);
    expect(targets[0]).toBe('[data-testid="ai-privacy-disclaimer-callout"]');
    expect(targets[1]).toBe('[data-testid="ai-copy-btn"]');
    expect(targets[2]).toBe('[data-testid="ai-providers-container"]');
    expect(targets[3]).toBe('[data-testid="ai-paste-response-btn"]');
  });

  it('AI_MODAL_STEPS_BYO_CV has 4 steps ending with paste response button', () => {
    expect(AI_MODAL_STEPS_BYO_CV.length).toBe(4);
    const targets = AI_MODAL_STEPS_BYO_CV.map((s) => s.target);
    expect(targets[0]).toBe('[data-testid="ai-privacy-disclaimer-callout"]');
    expect(targets[1]).toBe('[data-testid="ai-copy-btn"]');
    expect(targets[2]).toBe('[data-testid="ai-providers-container"]');
    expect(targets[3]).toBe('[data-testid="ai-paste-response-btn"]');
  });

  it('getAIModalTourSteps and isAIModalSteps resolve and identify steps accurately', () => {
    expect(getAIModalTourSteps('recruiter_audit')).toBe(AI_MODAL_STEPS_SIMPLE);
    expect(getAIModalTourSteps('interview_prep')).toBe(AI_MODAL_STEPS_SIMPLE);
    expect(getAIModalTourSteps('translate_english')).toBe(AI_MODAL_STEPS_TRANSLATION);
    expect(getAIModalTourSteps('bring_your_own_cv')).toBe(AI_MODAL_STEPS_BYO_CV);

    expect(isAIModalSteps(AI_MODAL_STEPS_SIMPLE)).toBe(true);
    expect(isAIModalSteps(AI_MODAL_STEPS_TRANSLATION)).toBe(true);
    expect(isAIModalSteps(AI_MODAL_STEPS_BYO_CV)).toBe(true);
    expect(isAIModalSteps(AI_MODAL_STEPS)).toBe(true);
    expect(isAIModalSteps(SIDEBAR_STEPS)).toBe(false);
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

describe('AppModals Interactive AI Tour Event Handling', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('launches translation tour and responds to copy, provider, and paste actions', () => {
    const callout = document.createElement('div');
    callout.setAttribute('data-testid', 'ai-privacy-disclaimer-callout');
    const copyBtn = document.createElement('button');
    copyBtn.setAttribute('data-testid', 'ai-copy-btn');
    const providers = document.createElement('div');
    providers.setAttribute('data-testid', 'ai-providers-container');
    const pasteBtn = document.createElement('button');
    pasteBtn.setAttribute('data-testid', 'ai-paste-response-btn');

    document.body.appendChild(callout);
    document.body.appendChild(copyBtn);
    document.body.appendChild(providers);
    document.body.appendChild(pasteBtn);

    render(
      <CVProvider>
        <TourProvider>
          <AppModals />
        </TourProvider>
      </CVProvider>
    );

    // Launch translation tour manually
    act(() => {
      window.dispatchEvent(
        new CustomEvent('start-cv-tour', {
          detail: { tour: 'ai_modal', promptId: 'translate_english' },
        })
      );
    });

    expect(document.body.classList.contains('has-running-tour')).toBe(true);

    // User clicks copy prompt -> should advance to provider container
    act(() => {
      window.dispatchEvent(
        new CustomEvent('ai-modal-tour-action', {
          detail: { action: 'copy_clicked' },
        })
      );
    });
    expect(document.body.classList.contains('has-running-tour')).toBe(true);

    // User clicks external provider launcher -> should advance to paste button
    act(() => {
      window.dispatchEvent(
        new CustomEvent('ai-modal-tour-action', {
          detail: { action: 'provider_clicked' },
        })
      );
    });
    expect(document.body.classList.contains('has-running-tour')).toBe(true);

    // User clicks paste response button -> should terminate tour completely
    act(() => {
      window.dispatchEvent(
        new CustomEvent('ai-modal-tour-action', {
          detail: { action: 'paste_clicked' },
        })
      );
    });
    expect(document.body.classList.contains('has-running-tour')).toBe(false);
    expect(localStorage.getItem('seen_ai_modal_tour')).toBe('true');
  });

  it('completes simple prompt tour immediately upon clicking an AI provider', () => {
    const callout = document.createElement('div');
    callout.setAttribute('data-testid', 'ai-privacy-disclaimer-callout');
    const copyBtn = document.createElement('button');
    copyBtn.setAttribute('data-testid', 'ai-copy-btn');
    const providers = document.createElement('div');
    providers.setAttribute('data-testid', 'ai-providers-container');

    document.body.appendChild(callout);
    document.body.appendChild(copyBtn);
    document.body.appendChild(providers);

    render(
      <CVProvider>
        <TourProvider>
          <AppModals />
        </TourProvider>
      </CVProvider>
    );

    act(() => {
      window.dispatchEvent(
        new CustomEvent('start-cv-tour', {
          detail: { tour: 'ai_modal', promptId: 'recruiter_audit' },
        })
      );
    });

    expect(document.body.classList.contains('has-running-tour')).toBe(true);

    // In simple prompt, clicking an external AI provider terminates the tutorial
    act(() => {
      window.dispatchEvent(
        new CustomEvent('ai-modal-tour-action', {
          detail: { action: 'provider_clicked' },
        })
      );
    });

    expect(document.body.classList.contains('has-running-tour')).toBe(false);
    expect(localStorage.getItem('seen_ai_modal_tour')).toBe('true');
  });
});
