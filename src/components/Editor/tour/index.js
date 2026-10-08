import {
  MAIN_SCREEN_STEPS,
  CANVAS_STEPS,
  WELCOME_STEP,
  SIDEBAR_TRANSITION_STEP,
} from './mainTourSteps';
import { SIDEBAR_STEPS } from './sidebarTourSteps';
import { AI_MODAL_STEPS } from './aiModalTourSteps';
import { ADD_SECTION_MODAL_STEPS } from './addSectionModalTourSteps';
import { openSidebarProgrammatically, createTourStep } from './tourUtils';

/**
 * Complete, sequential onboarding tour that flows smoothly from the main canvas
 * through the programmatically expanded sidebar controls.
 */
export const COMPLETE_ONBOARDING_STEPS = [
  ...MAIN_SCREEN_STEPS,
  ...SIDEBAR_STEPS,
];

export {
  MAIN_SCREEN_STEPS,
  CANVAS_STEPS,
  WELCOME_STEP,
  SIDEBAR_TRANSITION_STEP,
  SIDEBAR_STEPS,
  AI_MODAL_STEPS,
  ADD_SECTION_MODAL_STEPS,
  openSidebarProgrammatically,
  createTourStep,
};
