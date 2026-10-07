/**
 * src/tests/errorBoundaries.test.jsx
 *
 * Unit test suite for 3-tier ErrorBoundary architecture:
 * 1. RootErrorBoundary (Obsidian Callout danger style, recovery actions)
 * 2. SectionErrorBoundary (isolated section crash resilience)
 * 3. ModalErrorBoundary (isolated modal dialog crash resilience)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RootErrorBoundary from '../components/common/RootErrorBoundary';
import ModalErrorBoundary from '../components/common/ModalErrorBoundary';
import SectionErrorBoundary from '../components/CV/SectionErrorBoundary';

// Component that throws on demand
const ProblemChild = ({ shouldThrow = true, message = 'Error intencional simulado' }) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div data-testid="healthy-child">Contenido saludable</div>;
};

describe('3-Tier ErrorBoundary Architecture Suite (F8)', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    // Suppress React boundary console.error outputs during intentional throws
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('RootErrorBoundary (Tier 1)', () => {
    it('renders children normally when no error occurs', () => {
      render(
        <RootErrorBoundary>
          <ProblemChild shouldThrow={false} />
        </RootErrorBoundary>
      );
      expect(screen.getByTestId('healthy-child')).toBeInTheDocument();
    });

    it('catches fatal rendering exception and renders Obsidian danger callout', () => {
      render(
        <RootErrorBoundary>
          <ProblemChild shouldThrow={true} message="Falla crítica en render" />
        </RootErrorBoundary>
      );

      const callout = screen.getByTestId('root-error-callout');
      expect(callout).toBeInTheDocument();
      expect(screen.getByText(/Interrupción imprevista en el editor/i)).toBeInTheDocument();
      expect(screen.getByText(/Falla crítica en render/i)).toBeInTheDocument();
      expect(screen.getByTestId('btn-error-retry')).toBeInTheDocument();
      expect(screen.getByTestId('btn-error-backup')).toBeInTheDocument();
      expect(screen.getByTestId('btn-error-reset')).toBeInTheDocument();
    });

    it('allows retry attempt via handleRetry button', () => {
      let fail = true;
      const DynamicChild = () => {
        if (fail) throw new Error('Fallo temporal');
        return <div data-testid="recovered-child">Recuperado con éxito</div>;
      };

      const { rerender } = render(
        <RootErrorBoundary>
          <DynamicChild />
        </RootErrorBoundary>
      );

      expect(screen.getByTestId('root-error-callout')).toBeInTheDocument();

      fail = false;
      fireEvent.click(screen.getByTestId('btn-error-retry'));
      rerender(
        <RootErrorBoundary>
          <DynamicChild />
        </RootErrorBoundary>
      );

      expect(screen.getByTestId('recovered-child')).toBeInTheDocument();
    });
  });

  describe('ModalErrorBoundary (Tier 2)', () => {
    it('renders modal children normally when healthy', () => {
      render(
        <ModalErrorBoundary modalName="modal de prueba">
          <ProblemChild shouldThrow={false} />
        </ModalErrorBoundary>
      );
      expect(screen.getByTestId('healthy-child')).toBeInTheDocument();
    });

    it('catches modal error and renders Obsidian callout with close button', () => {
      const handleClose = vi.fn();
      render(
        <ModalErrorBoundary modalName="exportación" onClose={handleClose}>
          <ProblemChild shouldThrow={true} message="JSON parsing overflow" />
        </ModalErrorBoundary>
      );

      expect(screen.getByTestId('modal-error-callout')).toBeInTheDocument();
      expect(screen.getByText(/Error al cargar el contenido del exportación/i)).toBeInTheDocument();
      expect(screen.getByText(/JSON parsing overflow/i)).toBeInTheDocument();

      const closeBtn = screen.getByTestId('btn-modal-error-close');
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('SectionErrorBoundary (Tier 3)', () => {
    it('renders section content normally without errors', () => {
      render(
        <SectionErrorBoundary sectionId="experience" sectionTitle="Experiencia Laboral">
          <ProblemChild shouldThrow={false} />
        </SectionErrorBoundary>
      );
      expect(screen.getByTestId('healthy-child')).toBeInTheDocument();
    });

    it('catches section rendering error and isolates it with an Obsidian callout', () => {
      render(
        <SectionErrorBoundary sectionId="custom_sec" sectionTitle="Proyectos">
          <ProblemChild shouldThrow={true} message="Item corrupto" />
        </SectionErrorBoundary>
      );

      const sectionCallout = screen.getByTestId('section-error-custom_sec');
      expect(sectionCallout).toBeInTheDocument();
      expect(screen.getByText(/Error al representar la sección: Proyectos/i)).toBeInTheDocument();
    });
  });
});
