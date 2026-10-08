import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Footer } from '../components/common/Footer';
import { Footer as ExportedFooter, FooterComponent } from '../components/common';

describe('Web Application Footer Component Suite', () => {
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

    it('T1.3: displays client-side local data storage privacy message', () => {
      render(<Footer />);

      expect(screen.getByText('Los datos se guardan localmente en tu navegador')).toBeInTheDocument();
    });

    it('T1.4: displays developer contact link to LinkedIn', () => {
      render(<Footer />);

      const link = screen.getByRole('link', { name: /Contactame/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://linkedin.com/in/juan-ignacio-carrizo-juani981/');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('T1.5: displays copyright notice', () => {
      render(<Footer />);

      expect(screen.getByText(/© 2026 - Juan Ignacio Carrizo/i)).toBeInTheDocument();
    });

    it('T1.6: contains zero raw unicode emojis across all rendered elements', () => {
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

  describe('2. Module Exports', () => {
    it('T2.1: exports Footer and FooterComponent correctly from common index', () => {
      expect(ExportedFooter).toBeDefined();
      expect(FooterComponent).toBeDefined();
      expect(ExportedFooter).toBe(Footer);
    });
  });
});
