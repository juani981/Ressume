import React, { useState, useEffect } from 'react';
import { Joyride } from 'react-joyride';
import { CustomTooltip } from '../CustomTooltip';
import AddSectionModal from './AddSectionModal';
import SuggestionTooltip from './SuggestionTooltip';
import AITipsSidebar from './AITipsSidebar';
import ToastNotification from './ToastNotification';

import { MAIN_SCREEN_STEPS, SIDEBAR_STEPS, ADD_SECTION_MODAL_STEPS } from './tour/tourSteps';

export function AppModals({
  isAddSectionModalOpen,
  onCloseAddSectionModal,
  addSectionTargetColumn,
  addSectionTargetIndex,
  activeTooltip,
  layoutType,
}) {
  const [runTour, setRunTour] = useState(false);
  const [currentSteps, setCurrentSteps] = useState(MAIN_SCREEN_STEPS);
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

  // Progressive discovery: Trigger Sidebar tour only after the user opens/expands the sidebar
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

  // Listen for manual tour launch events (e.g. from help button or sidebar)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStartTourEvent = (e) => {
      const tourType = e.detail?.tour || 'main';
      if (tourType === 'sidebar') {
        setCurrentSteps(SIDEBAR_STEPS);
      } else if (tourType === 'add_section') {
        setCurrentSteps(ADD_SECTION_MODAL_STEPS);
      } else {
        setCurrentSteps(MAIN_SCREEN_STEPS);
      }
      setRunTour(true);
    };
    window.addEventListener('start-cv-tour', handleStartTourEvent);
    return () => window.removeEventListener('start-cv-tour', handleStartTourEvent);
  }, []);

  const handleJoyrideCallback = (data) => {
    const { status, type } = data || {};
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
        if (currentSteps === SIDEBAR_STEPS) {
          localStorage.setItem('seen_sidebar_tour', 'true');
        } else if (currentSteps === ADD_SECTION_MODAL_STEPS) {
          localStorage.setItem('seen_add_section_tour', 'true');
        } else if (currentSteps === MAIN_SCREEN_STEPS) {
          localStorage.setItem('seen_main_tour', 'true');
        }
      } catch (_) {}

      setRunTour(false);
    }
  };

  return (
    <>
      <Joyride
        key={
          currentSteps === SIDEBAR_STEPS
            ? 'sidebar-tour'
            : currentSteps === ADD_SECTION_MODAL_STEPS
            ? 'add-section-tour'
            : 'main-tour'
        }
        run={runTour}
        steps={currentSteps}
        continuous={true}
        disableOverlayClose={false}
        spotlightClicks={true}
        onEvent={handleJoyrideCallback}
        callback={handleJoyrideCallback}
        tooltipComponent={(props) => (
          <CustomTooltip
            {...props}
            dontShowAgain={dontShowAgain}
            setDontShowAgain={setDontShowAgain}
          />
        )}
      />

      {/* Add Section Selection Modal */}
      <AddSectionModal
        isOpen={isAddSectionModalOpen}
        onClose={onCloseAddSectionModal}
        targetColumn={addSectionTargetColumn}
        targetIndex={addSectionTargetIndex}
      />

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
