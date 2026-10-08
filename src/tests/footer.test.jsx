import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Footer, FOOTER_STORAGE_KEY, DEFAULT_FOOTER_MESSAGE } from '../components/common/Footer';

describe('Web Application Footer Component & Custom Message Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Mounting & Semantic Structure', () => {
    it('T1.1: renders semantic footer landmark with role="contentinfo" and data-testid="app-footer"', () => {
      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveAttribute('data-testid', 'app-footer');
    });

    it('T1.2: enforces .no-print class to strictly guarantee zero interference with PDF export and print media', () => {
      render(<Footer />);

      const footer = screen.getByTestId('app-footer');
      expect(footer.className).toContain('no-print');
    });

    it('T1.3: displays default custom message when localStorage is empty', () => {
      render(<Footer />);

      const messageEl = screen.getByTestId('footer-custom-message-text');
      expect(messageEl).toBeInTheDocument();
      expect(messageEl.textContent).toBe(DEFAULT_FOOTER_MESSAGE);
    });

    it('T1.4: displays branding and client-side privacy note', () => {
      render(<Footer />);

      expect(screen.getByText('Ressume')).toBeInTheDocument();
      expect(screen.getByText(/100% Privado en tu navegador/i)).toBeInTheDocument();
      expect(screen.getByText(/Sin coste alguno por uso ni descarga/i)).toBeInTheDocument();
    });

    it('T1.5: contains zero raw unicode emojis across all rendered states', () => {
      render(<Footer />);

      const footer = screen.getByTestId('app-footer');
      const text = footer.textContent || '';
      expect(text).not.toContain('🛑');
      expect(text).not.toContain('🚨');
      expect(text).not.toContain('⚠️');
      expect(text).not.toContain('ℹ️');
      expect(text).not.toContain('💡');
      expect(text).not.toContain('📝');
      expect(text).not.toContain('✏️');
    });
  });

  describe('2. Custom Message Editing & LocalStorage Persistence', () => {
    it('T2.1: initializes custom message from localStorage when present', () => {
      localStorage.setItem(FOOTER_STORAGE_KEY, 'Mi mensaje personalizado para reclutadores');

      render(<Footer />);

      const messageEl = screen.getByTestId('footer-custom-message-text');
      expect(messageEl.textContent).toBe('Mi mensaje personalizado para reclutadores');
    });

    it('T2.2: toggles into edit mode upon clicking edit button', () => {
      render(<Footer />);

      const editBtn = screen.getByTestId('footer-edit-btn');
      fireEvent.click(editBtn);

      const input = screen.getByTestId('footer-message-input');
      expect(input).toBeInTheDocument();
      expect(input.value).toBe(DEFAULT_FOOTER_MESSAGE);
      expect(screen.getByTestId('footer-save-btn')).toBeInTheDocument();
      expect(screen.getByTestId('footer-cancel-btn')).toBeInTheDocument();
    });

    it('T2.3: updates custom message and saves to localStorage upon clicking save', () => {
      render(<Footer />);

      fireEvent.click(screen.getByTestId('footer-edit-btn'));

      const input = screen.getByTestId('footer-message-input');
      fireEvent.change(input, { target: { value: 'Abierto a oportunidades remotas en Go y React' } });

      const saveBtn = screen.getByTestId('footer-save-btn');
      fireEvent.click(saveBtn);

      expect(screen.getByTestId('footer-custom-message-text').textContent).toBe(
        'Abierto a oportunidades remotas en Go y React'
      );
      expect(localStorage.getItem(FOOTER_STORAGE_KEY)).toBe(
        'Abierto a oportunidades remotas en Go y React'
      );
      expect(screen.queryByTestId('footer-message-input')).toBeNull();
    });

    it('T2.4: saves message when pressing Enter key in the input', () => {
      render(<Footer />);

      fireEvent.click(screen.getByTestId('footer-edit-btn'));

      const input = screen.getByTestId('footer-message-input');
      fireEvent.change(input, { target: { value: 'Mensaje confirmado con tecla Enter' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(screen.getByTestId('footer-custom-message-text').textContent).toBe(
        'Mensaje confirmado con tecla Enter'
      );
      expect(localStorage.getItem(FOOTER_STORAGE_KEY)).toBe(
        'Mensaje confirmado con tecla Enter'
      );
    });

    it('T2.5: discards changes when clicking cancel or pressing Escape key', () => {
      localStorage.setItem(FOOTER_STORAGE_KEY, 'Mensaje Original Guardado');

      render(<Footer />);

      // Cancel via button
      fireEvent.click(screen.getByTestId('footer-edit-btn'));
      const input = screen.getByTestId('footer-message-input');
      fireEvent.change(input, { target: { value: 'Cambio temporal no guardado' } });
      fireEvent.click(screen.getByTestId('footer-cancel-btn'));

      expect(screen.getByTestId('footer-custom-message-text').textContent).toBe(
        'Mensaje Original Guardado'
      );
      expect(localStorage.getItem(FOOTER_STORAGE_KEY)).toBe(
        'Mensaje Original Guardado'
      );

      // Cancel via Escape key
      fireEvent.click(screen.getByTestId('footer-edit-btn'));
      const input2 = screen.getByTestId('footer-message-input');
      fireEvent.change(input2, { target: { value: 'Otro cambio descartado' } });
      fireEvent.keyDown(input2, { key: 'Escape', code: 'Escape' });

      expect(screen.getByTestId('footer-custom-message-text').textContent).toBe(
        'Mensaje Original Guardado'
      );
    });

    it('T2.6: resets back to default message and removes custom entry from localStorage', () => {
      localStorage.setItem(FOOTER_STORAGE_KEY, 'Mensaje previo a reiniciar');

      render(<Footer />);

      fireEvent.click(screen.getByTestId('footer-edit-btn'));
      const resetBtn = screen.getByTestId('footer-reset-btn');
      fireEvent.click(resetBtn);

      expect(screen.getByTestId('footer-custom-message-text').textContent).toBe(
        DEFAULT_FOOTER_MESSAGE
      );
      expect(localStorage.getItem(FOOTER_STORAGE_KEY)).toBeNull();
    });

    it('T2.7: empty or whitespace-only input defaults gracefully without breaking', () => {
      render(<Footer />);

      fireEvent.click(screen.getByTestId('footer-edit-btn'));
      const input = screen.getByTestId('footer-message-input');
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.click(screen.getByTestId('footer-save-btn'));

      expect(screen.getByTestId('footer-custom-message-text').textContent).toBe(
        DEFAULT_FOOTER_MESSAGE
      );
    });
  });
});
