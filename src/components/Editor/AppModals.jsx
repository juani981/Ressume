import React, { useState, useEffect } from 'react';
import { Joyride } from 'react-joyride';
import { CustomTooltip } from '../CustomTooltip';
import AddSectionModal from './AddSectionModal';
import SuggestionTooltip from './SuggestionTooltip';
import AITipsSidebar from './AITipsSidebar';
import ToastNotification from './ToastNotification';
import ModalHelpDialog from '../common/ModalHelpDialog';
import ModalErrorBoundary from '../common/ModalErrorBoundary';
import { useTourManager, TOUR_IDS } from '../../context/TourContext';
import { useModalTheme } from '../../hooks/useModalTheme';

import {
  COMPLETE_ONBOARDING_STEPS,
  MAIN_SCREEN_STEPS,
  SIDEBAR_STEPS,
  ADD_SECTION_MODAL_STEPS,
  AI_MODAL_STEPS,
  AI_MODAL_STEPS_SIMPLE,
  AI_MODAL_STEPS_TRANSLATION,
  AI_MODAL_STEPS_BYO_CV,
  getAIModalTourSteps,
  isAIModalSteps,
  openSidebarProgrammatically,
} from './tour';

export function AppModals({
  isAddSectionModalOpen,
  onCloseAddSectionModal,
  addSectionTargetColumn,
  addSectionTargetIndex,
  activeTooltip,
  layoutType,
}) {
  const { activeTour } = useTourManager();
  const { isDark } = useModalTheme();
  const [runTour, setRunTour] = useState(false);
  const [currentSteps, setCurrentSteps] = useState(COMPLETE_ONBOARDING_STEPS);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Manage body class for tour active state
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (runTour) {
      document.body.classList.add('has-running-tour');
    } else {
      document.body.classList.remove('has-running-tour');
    }
    return () => {
      document.body.classList.remove('has-running-tour');
    };
  }, [runTour]);

  // Initial main screen tour launch
  useEffect(() => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    if (
      typeof process !== 'undefined' &&
      (process.env?.NODE_ENV === 'test' || process.env?.VITEST)
    ) {
      return;
    }
    try {
      const hasSeenTour = localStorage.getItem('skip_onboarding_tour');
      if (!hasSeenTour) {
        setTourStepIndex(0);
        setRunTour(true);
      }
    } catch (_) {}
  }, []);

  // Progressive discovery: Trigger Sidebar tour if the user opens/expands the sidebar independently
  useEffect(() => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    if (
      typeof process !== 'undefined' &&
      (process.env?.NODE_ENV === 'test' || process.env?.VITEST)
    ) {
      return;
    }

    const checkSidebarExpanded = (el) => {
      if (!el) return;
      const isExpanded =
        el.getAttribute('data-expanded') === 'true' ||
        el.classList.contains('is-expanded');
      if (isExpanded) {
        const hasSkipped = localStorage.getItem('skip_onboarding_tour') === 'true';
        const hasSeenSidebar = localStorage.getItem('seen_sidebar_tour') === 'true';
        if (!hasSkipped && !hasSeenSidebar && !runTour) {
          setTimeout(() => {
            setCurrentSteps(SIDEBAR_STEPS);
            setTourStepIndex(0);
            setRunTour(true);
          }, 350);
        }
      }
    };

    let observer = null;
    let bodyObserver = null;

    const navEl = document.querySelector('[data-testid="action-menu-navbar"]');
    if (navEl) {
      observer = new MutationObserver(() => checkSidebarExpanded(navEl));
      observer.observe(navEl, { attributes: true, attributeFilter: ['data-expanded', 'class'] });
    } else {
      bodyObserver = new MutationObserver(() => {
        const el = document.querySelector('[data-testid="action-menu-navbar"]');
        if (el) {
          bodyObserver.disconnect();
          observer = new MutationObserver(() => checkSidebarExpanded(el));
          observer.observe(el, { attributes: true, attributeFilter: ['data-expanded', 'class'] });
        }
      });
      bodyObserver.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      if (observer) observer.disconnect();
      if (bodyObserver) bodyObserver.disconnect();
    };
  }, [runTour]);

  // Progressive discovery: Trigger AddSectionModal tour when the modal opens for the first time
  useEffect(() => {
    if (!isAddSectionModalOpen) return;
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    if (
      typeof process !== 'undefined' &&
      (process.env?.NODE_ENV === 'test' || process.env?.VITEST)
    ) {
      return;
    }

    const hasSkipped = localStorage.getItem('skip_onboarding_tour') === 'true';
    const hasSeenAddSectionTour = localStorage.getItem('seen_add_section_tour') === 'true';

    if (!hasSkipped && !hasSeenAddSectionTour && !runTour) {
      const timer = setTimeout(() => {
        setCurrentSteps(ADD_SECTION_MODAL_STEPS);
        setTourStepIndex(0);
        setRunTour(true);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isAddSectionModalOpen, runTour]);

  // Dedicated Joyride tour when AI Advice & Prompts Modal (AIExportModal) opens
  useEffect(() => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    if (
      typeof process !== 'undefined' &&
      (process.env?.NODE_ENV === 'test' || process.env?.VITEST)
    ) {
      return;
    }

    let aiModalTimer = null;

    const checkAIModalMounted = () => {
      const aiModal = document.querySelector('.ai-modal-dialog');
      if (aiModal) {
        const hasSkipped = localStorage.getItem('skip_onboarding_tour') === 'true';
        const hasSeenAITour = localStorage.getItem('seen_ai_modal_tour') === 'true';

        if (!hasSkipped && !hasSeenAITour) {
          const promptId = aiModal.getAttribute('data-prompt-id') || 'recruiter_audit';
          const tourSteps = getAIModalTourSteps(promptId);
          if (aiModalTimer) clearTimeout(aiModalTimer);
          aiModalTimer = setTimeout(() => {
            setCurrentSteps(tourSteps);
            setTourStepIndex(0);
            setRunTour(true);
          }, 350);
        }
      } else {
        // If AI modal closed while running its tour, stop tour
        if (isAIModalSteps(currentSteps) && runTour) {
          setRunTour(false);
          setTourStepIndex(0);
        }
      }
    };

    const modalObserver = new MutationObserver(checkAIModalMounted);
    modalObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      modalObserver.disconnect();
      if (aiModalTimer) clearTimeout(aiModalTimer);
    };
  }, [runTour, currentSteps]);

  // Handle dynamic events within AIExportModal (prompt selection change, action clicks)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePromptChanged = (e) => {
      const promptId = e.detail?.promptId;
      if (!promptId) return;

      const aiModal = document.querySelector('.ai-modal-dialog');
      if (aiModal && isAIModalSteps(currentSteps) && runTour) {
        const newSteps = getAIModalTourSteps(promptId);
        setCurrentSteps(newSteps);
        setTourStepIndex(0);
      }
    };

    const handleTourAction = (e) => {
      const { action } = e.detail || {};
      if (!runTour || !isAIModalSteps(currentSteps)) return;

      if (action === 'copy_clicked') {
        // Step index 2 focuses on external AI providers container
        setTourStepIndex(2);
      } else if (action === 'provider_clicked') {
        const isBidirectional =
          currentSteps === AI_MODAL_STEPS_TRANSLATION ||
          currentSteps === AI_MODAL_STEPS_BYO_CV;

        if (isBidirectional) {
          // Focus the paste response button (Step index 3)
          setTourStepIndex(3);
        } else {
          // Complete simple prompt tour immediately
          setRunTour(false);
          setTourStepIndex(0);
          try {
            localStorage.setItem('seen_ai_modal_tour', 'true');
          } catch (_) {}
        }
      } else if (action === 'paste_clicked') {
        // Output response received or pasted -> terminate tour completely
        setRunTour(false);
        setTourStepIndex(0);
        try {
          localStorage.setItem('seen_ai_modal_tour', 'true');
        } catch (_) {}
      }
    };

    window.addEventListener('ai-modal-prompt-changed', handlePromptChanged);
    window.addEventListener('ai-modal-tour-action', handleTourAction);

    return () => {
      window.removeEventListener('ai-modal-prompt-changed', handlePromptChanged);
      window.removeEventListener('ai-modal-tour-action', handleTourAction);
    };
  }, [runTour, currentSteps]);

  // Listen for manual tour launch events (e.g. from help buttons, sidebar or devtools)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStartTourEvent = (e) => {
      const tourType = e.detail?.tour || 'main';
      const promptId =
        e.detail?.promptId ||
        document.querySelector('.ai-modal-dialog')?.getAttribute('data-prompt-id') ||
        'recruiter_audit';

      if (tourType === 'ai_modal') {
        setCurrentSteps(getAIModalTourSteps(promptId));
      } else if (tourType === 'sidebar') {
        openSidebarProgrammatically();
        setCurrentSteps(SIDEBAR_STEPS);
      } else if (tourType === 'add_section') {
        setCurrentSteps(ADD_SECTION_MODAL_STEPS);
      } else {
        setCurrentSteps(COMPLETE_ONBOARDING_STEPS);
      }
      setTourStepIndex(0);
      setRunTour(true);
    };
    window.addEventListener('start-cv-tour', handleStartTourEvent);
    return () => window.removeEventListener('start-cv-tour', handleStartTourEvent);
  }, []);

  const handleJoyrideCallback = (data) => {
    const { status, type, step, action, index } = data || {};

    // Programmatically open sidebar whenever reaching or previewing sidebar steps
    if (type === 'step:before' || type === 'step:after') {
      const targetSelector = typeof step?.target === 'string' ? step.target : '';
      const isSidebarTarget =
        targetSelector.includes('action-menu') ||
        targetSelector.includes('versiones-item') ||
        targetSelector.includes('design-item') ||
        targetSelector.includes('ia-prompts-item') ||
        targetSelector.includes('translation-action-item') ||
        targetSelector.includes('byo-cv-action-item') ||
        targetSelector.includes('btn-action-native-print') ||
        targetSelector.includes('btn-pin-action-menu');

      if (isSidebarTarget) {
        openSidebarProgrammatically();
      }
    }

    if (type === 'step:after') {
      if (action === 'next') {
        setTourStepIndex(index + 1);
      } else if (action === 'prev') {
        setTourStepIndex(index - 1);
      }
    }

    if (
      status === 'finished' ||
      status === 'skipped' ||
      type === 'tour:end'
    ) {
      if (
        dontShowAgain ||
        localStorage.getItem('skip_onboarding_tour') === 'true'
      ) {
        localStorage.setItem('skip_onboarding_tour', 'true');
      }

      try {
        if (isAIModalSteps(currentSteps)) {
          localStorage.setItem('seen_ai_modal_tour', 'true');
        } else if (currentSteps === SIDEBAR_STEPS) {
          localStorage.setItem('seen_sidebar_tour', 'true');
        } else if (currentSteps === ADD_SECTION_MODAL_STEPS) {
          localStorage.setItem('seen_add_section_tour', 'true');
        } else {
          localStorage.setItem('seen_main_tour', 'true');
          localStorage.setItem('seen_sidebar_tour', 'true');
        }
      } catch (_) {}

      setRunTour(false);
      setTourStepIndex(0);
    }
  };

  const getTourKey = () => {
    if (currentSteps === AI_MODAL_STEPS_TRANSLATION) return 'ai-modal-tour-translation';
    if (currentSteps === AI_MODAL_STEPS_BYO_CV) return 'ai-modal-tour-byo-cv';
    if (isAIModalSteps(currentSteps)) return 'ai-modal-tour-simple';
    if (currentSteps === SIDEBAR_STEPS) return 'sidebar-tour';
    if (currentSteps === ADD_SECTION_MODAL_STEPS) return 'add-section-tour';
    return 'complete-onboarding-tour';
  };

  return (
    <>
      <Joyride
        key={getTourKey()}
        run={runTour}
        stepIndex={tourStepIndex}
        steps={currentSteps}
        continuous={true}
        disableOverlayClose={false}
        spotlightClicks={true}
        onEvent={handleJoyrideCallback}
        callback={handleJoyrideCallback}
        styles={{
          options: {
            zIndex: 10000,
            overlayColor: isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(0, 0, 0, 0.5)',
            primaryColor: '#3874ff',
          },
        }}
        tooltipComponent={(props) => (
          <CustomTooltip
            {...props}
            tourId={activeTour || TOUR_IDS.ONBOARDING}
            dontShowAgain={dontShowAgain}
            setDontShowAgain={setDontShowAgain}
          />
        )}
      />

      {/* Add Section Selection Modal */}
      <ModalErrorBoundary modalName="modal de agregar sección" onClose={onCloseAddSectionModal}>
        <AddSectionModal
          isOpen={isAddSectionModalOpen}
          onClose={onCloseAddSectionModal}
          targetColumn={addSectionTargetColumn}
          targetIndex={addSectionTargetIndex}
        />
      </ModalErrorBoundary>

      {/* Global Modal Help Step-by-Step Dialog */}
      <ModalErrorBoundary modalName="diálogo de ayuda">
        <ModalHelpDialog />
      </ModalErrorBoundary>

      {/* Global Singleton AI Suggestion Tooltip */}
      {activeTooltip && activeTooltip.section && activeTooltip.rect && (
        <SuggestionTooltip
          section={activeTooltip.section}
          isHovered={true}
          layoutType={layoutType}
          rect={activeTooltip.rect}
          anchorRef={activeTooltip.anchorRef}
        />
      )}

      {/* Master AI Tips Right-Hand Rail */}
      <AITipsSidebar />

      {/* Ephemeral Toast Notification */}
      <ToastNotification />
    </>
  );
}

export default AppModals;
