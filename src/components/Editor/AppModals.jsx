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
          if (aiModalTimer) clearTimeout(aiModalTimer);
          aiModalTimer = setTimeout(() => {
            setCurrentSteps(AI_MODAL_STEPS);
            setRunTour(true);
          }, 350);
        }
      } else {
        // If AI modal closed while running its tour, stop tour
        if (currentSteps === AI_MODAL_STEPS && runTour) {
          setRunTour(false);
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

  // Listen for manual tour launch events (e.g. from help buttons, sidebar or devtools)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStartTourEvent = (e) => {
      const tourType = e.detail?.tour || 'main';
      if (tourType === 'ai_modal') {
        setCurrentSteps(AI_MODAL_STEPS);
      } else if (tourType === 'sidebar') {
        openSidebarProgrammatically();
        setCurrentSteps(SIDEBAR_STEPS);
      } else if (tourType === 'add_section') {
        setCurrentSteps(ADD_SECTION_MODAL_STEPS);
      } else {
        setCurrentSteps(COMPLETE_ONBOARDING_STEPS);
      }
      setRunTour(true);
    };
    window.addEventListener('start-cv-tour', handleStartTourEvent);
    return () => window.removeEventListener('start-cv-tour', handleStartTourEvent);
  }, []);

  const handleJoyrideCallback = (data) => {
    const { status, type, step } = data || {};

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
        if (currentSteps === AI_MODAL_STEPS) {
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
    }
  };

  const getTourKey = () => {
    if (currentSteps === AI_MODAL_STEPS) return 'ai-modal-tour';
    if (currentSteps === SIDEBAR_STEPS) return 'sidebar-tour';
    if (currentSteps === ADD_SECTION_MODAL_STEPS) return 'add-section-tour';
    return 'complete-onboarding-tour';
  };

  return (
    <>
      <Joyride
        key={getTourKey()}
        run={runTour}
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
