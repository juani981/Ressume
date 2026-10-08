import {
  MAIN_SCREEN_STEPS,
  CANVAS_STEPS,
  WELCOME_STEP,
  SIDEBAR_TRANSITION_STEP,
} from './mainTourSteps';
import { SIDEBAR_STEPS } from './sidebarTourSteps';
import {
  AI_MODAL_STEPS,
  AI_MODAL_STEPS_SIMPLE,
  AI_MODAL_STEPS_TRANSLATION,
  AI_MODAL_STEPS_BYO_CV,
  getAIModalTourSteps,
  isAIModalSteps,
} from './aiModalTourSteps';
import { ADD_SECTION_MODAL_STEPS } from './addSectionModalTourSteps';
import { IMPORT_CV_STEP, IMPORT_CV_TOUR_STEPS } from './importCvTourSteps';
import { openSidebarProgrammatically, closeSidebarProgrammatically, createTourStep } from './tourUtils';

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
  IMPORT_CV_STEP,
  IMPORT_CV_TOUR_STEPS,
  AI_MODAL_STEPS,
  AI_MODAL_STEPS_SIMPLE,
  AI_MODAL_STEPS_TRANSLATION,
  AI_MODAL_STEPS_BYO_CV,
  getAIModalTourSteps,
  isAIModalSteps,
  ADD_SECTION_MODAL_STEPS,
  openSidebarProgrammatically,
  closeSidebarProgrammatically,
  createTourStep,
};

