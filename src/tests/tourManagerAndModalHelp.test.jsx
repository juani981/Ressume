import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TourProvider, useTourManager, TOUR_IDS, MODAL_HELP_CONTENT } from '../context/TourContext';
import ModalHelpButton from '../components/common/ModalHelpButton';
import ModalHelpDialog from '../components/common/ModalHelpDialog';

// Componente de prueba para consumir el hook
const TestTourConsumer = () => {
  const {
    activeTour,
    startTour,
    endTour,
    isTourCompleted,
    notifyPrintSuccess,
    openModalHelp,
  } = useTourManager();

  return (
    <div>
      <span data-testid="active-tour-id">{activeTour || 'none'}</span>
      <span data-testid="is-completed-onboarding">{String(isTourCompleted(TOUR_IDS.ONBOARDING))}</span>
      <button data-testid="btn-start-onboarding" onClick={() => startTour(TOUR_IDS.ONBOARDING, true)}>
        Start Onboarding
      </button>
      <button data-testid="btn-end-onboarding" onClick={() => endTour(TOUR_IDS.ONBOARDING, true)}>
        End Onboarding
      </button>
      <button data-testid="btn-notify-print" onClick={notifyPrintSuccess}>
        Print Success
      </button>
      <button data-testid="btn-open-help" onClick={() => openModalHelp(TOUR_IDS.ADD_SECTION)}>
        Open Help
      </button>
    </div>
  );
};

describe('TourContext, ModalHelpButton & ModalHelpDialog Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('proporciona el estado por defecto sin tour activo cuando está fuera de modo test', () => {
    render(
      <TourProvider>
        <TestTourConsumer />
      </TourProvider>
    );

    expect(screen.getByTestId('active-tour-id')).toHaveTextContent('none');
    expect(screen.getByTestId('is-completed-onboarding')).toHaveTextContent('false');
  });

  it('inicia y finaliza un tour persistiendo el estado en localStorage', () => {
    render(
      <TourProvider>
        <TestTourConsumer />
      </TourProvider>
    );

    // Iniciar tour
    act(() => {
      fireEvent.click(screen.getByTestId('btn-start-onboarding'));
    });
    expect(screen.getByTestId('active-tour-id')).toHaveTextContent(TOUR_IDS.ONBOARDING);

    // Finalizar tour
    act(() => {
      fireEvent.click(screen.getByTestId('btn-end-onboarding'));
    });
    expect(screen.getByTestId('active-tour-id')).toHaveTextContent('none');
    expect(screen.getByTestId('is-completed-onboarding')).toHaveTextContent('true');
    expect(localStorage.getItem('ressume_tour_onboarding')).toBe('true');
    expect(localStorage.getItem('skip_onboarding_tour')).toBe('true');
  });

  it('ModalHelpButton abre el diálogo con la guía paso a paso y ModalHelpDialog lo renderiza', () => {
    render(
      <TourProvider>
        <ModalHelpButton tourId={TOUR_IDS.ADD_SECTION} />
        <ModalHelpDialog />
      </TourProvider>
    );

    // El diálogo no debe estar en pantalla inicialmente
    expect(screen.queryByTestId('modal-help-dialog')).toBeNull();

    // Clic en el botón "?"
    const helpBtn = screen.getByTestId('btn-modal-help');
    expect(helpBtn).toBeInTheDocument();
    fireEvent.click(helpBtn);

    // El diálogo debe aparecer con el contenido formal de ADD_SECTION
    expect(screen.getByTestId('modal-help-dialog')).toBeInTheDocument();
    expect(screen.getByText(MODAL_HELP_CONTENT[TOUR_IDS.ADD_SECTION].title)).toBeInTheDocument();
    expect(screen.getByText('Selección del tipo de bloque')).toBeInTheDocument();

    // Cerrar con el botón "Entendido"
    const dismissBtn = screen.getByTestId('btn-dismiss-modal-help');
    fireEvent.click(dismissBtn);
    expect(screen.queryByTestId('modal-help-dialog')).toBeNull();
  });

  it('ModalHelpButton se adapta visualmente a los temas y maneja el botón de cierre X', () => {
    render(
      <TourProvider>
        <ModalHelpButton tourId={TOUR_IDS.VERSION_MANAGER} isDark={true} />
        <ModalHelpDialog />
      </TourProvider>
    );

    fireEvent.click(screen.getByTestId('btn-modal-help'));
    expect(screen.getByText(MODAL_HELP_CONTENT[TOUR_IDS.VERSION_MANAGER].title)).toBeInTheDocument();

    // Cerrar con el botón X
    const closeBtn = screen.getByTestId('btn-close-modal-help');
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('modal-help-dialog')).toBeNull();
  });

  it('notifica el evento de primera impresión correctamente', () => {
    const printEventSpy = vi.fn();
    window.addEventListener('ressume_first_print_success', printEventSpy);

    render(
      <TourProvider>
        <TestTourConsumer />
      </TourProvider>
    );

    act(() => {
      fireEvent.click(screen.getByTestId('btn-notify-print'));
    });

    expect(printEventSpy).toHaveBeenCalledTimes(1);
    window.removeEventListener('ressume_first_print_success', printEventSpy);
  });
});
