import React, { useState } from 'react';
import { Joyride } from 'react-joyride';
import { CustomTooltip } from '../CustomTooltip';
import AddSectionModal from './AddSectionModal';
import SuggestionTooltip from './SuggestionTooltip';
import AITipsSidebar from './AITipsSidebar';
import ToastNotification from './ToastNotification';
import ModalHelpDialog from '../common/ModalHelpDialog';
import {
  useTourManager,
  TOUR_IDS,
  ONBOARDING_TOUR_STEPS,
  BITACORA_NUDGE_STEPS,
} from '../../context/TourContext';
import { useModalTheme } from '../../hooks/useModalTheme';

export function AppModals({
  isAddSectionModalOpen,
  onCloseAddSectionModal,
  addSectionTargetColumn,
  addSectionTargetIndex,
  activeTooltip,
  layoutType,
}) {
  const { activeTour, endTour } = useTourManager();
  const { isDark } = useModalTheme();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const isJoyrideRunning = Boolean(
    activeTour === TOUR_IDS.ONBOARDING || activeTour === TOUR_IDS.BITACORA_NUDGE
  );

  const currentSteps =
    activeTour === TOUR_IDS.BITACORA_NUDGE
      ? BITACORA_NUDGE_STEPS
      : ONBOARDING_TOUR_STEPS;

  const handleJoyrideCallback = (data) => {
    const { status, type } = data || {};
    if (
      status === 'finished' ||
      status === 'skipped' ||
      type === 'tour:end'
    ) {
      endTour(activeTour, dontShowAgain || status === 'finished' || status === 'skipped');
    }
  };

  return (
    <>
      <Joyride
        run={isJoyrideRunning}
        steps={currentSteps}
        continuous={true}
        onEvent={handleJoyrideCallback}
        callback={handleJoyrideCallback}
        disableOverlayClose={true}
        spotlightClicks={false}
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
      <AddSectionModal
        isOpen={isAddSectionModalOpen}
        onClose={onCloseAddSectionModal}
        targetColumn={addSectionTargetColumn}
        targetIndex={addSectionTargetIndex}
      />

      {/* Global Modal Help Step-by-Step Dialog */}
      <ModalHelpDialog />

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
