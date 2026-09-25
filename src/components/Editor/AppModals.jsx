import React, { useState, useEffect } from 'react';
import { Joyride } from 'react-joyride';
import { CustomTooltip } from '../CustomTooltip';
import AddSectionModal from './AddSectionModal';
import SuggestionTooltip from './SuggestionTooltip';
import AITipsSidebar from './AITipsSidebar';
import ToastNotification from './ToastNotification';

const TOUR_STEPS = [
  {
    content: (
      <>
        <p>
          Editá tu CV una vez, y siempre podés tenerlo en dos formatos.
        </p>
        <p>
          Para humanos, que pueden entender el diseño y personalidad que
          intentas demostrar. Y para Sistemas Automáticos que sólo deben
          leer los datos de manera directa y ordenada
        </p>
      </>
    ),
    blockTargetInteraction: true,
    id: 'disabled-interaction',
    placement: 'right',
    skipBeacon: true,
    styles: {
      tooltipContent: {
        paddingTop: 0,
      },
    },
    target: '.layout-mode-toggle-pill',
  },
  {
    content:
      'Podés generar prompts para refinar el contenido y orden de tu CV con un sólo click!',
    target: '#ia-prompts-item',
  },
  {
    content:
      'Gestioná tus versiones para tener múltiples idiomas, enfoques, o diseños',
    target: '#versiones-item',
  },
];

export function AppModals({
  isAddSectionModalOpen,
  onCloseAddSectionModal,
  addSectionTargetColumn,
  activeTooltip,
  layoutType,
}) {
  const [runTour, setRunTour] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

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
      setRunTour(false);
    }
  };

  return (
    <>
      <Joyride
        run={runTour}
        steps={TOUR_STEPS}
        continuous={true}
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
      />

      {/* Global Singleton AI Suggestion Tooltip */}
      {activeTooltip && activeTooltip.section && activeTooltip.rect && (
        <SuggestionTooltip
          section={activeTooltip.section}
          isHovered={true}
          layoutType={layoutType}
          rect={activeTooltip.rect}
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
