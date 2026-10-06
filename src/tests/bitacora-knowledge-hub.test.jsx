import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BitacoraModal } from '../components/Bitacora/BitacoraModal';
import { BitacoraCard } from '../components/Bitacora/BitacoraCard';
import { ObsidianCallout } from '../components/Bitacora/ObsidianCallout';
import { BITACORA_CATEGORIES } from '../data/bitacora/categories';
import { INITIAL_BITACORA_ITEMS } from '../data/bitacora/items';
import * as storage from '../utils/bitacoraStorage';

describe('Bitácora / Knowledge Hub System', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('ObsidianCallout (Invariant 1 Compliance)', () => {
    it('renders danger callout with proper styles, bold title and 🛑 icon', () => {
      const { container } = render(
        <ObsidianCallout
          type="danger"
          title="Peligro Crítico"
          content="No uses formatos no estándar."
        />
      );
      const callout = container.querySelector('.obsidian-callout');
      expect(callout).toBeInTheDocument();
      expect(callout.style.backgroundColor).toBe('rgba(233, 49, 71, 0.1)');
      expect(callout.style.borderLeft).toContain('4px solid rgb(233, 49, 71)');
      expect(screen.getByText('🛑')).toBeInTheDocument();
      expect(screen.getByText('Peligro Crítico')).toBeInTheDocument();
      expect(screen.getByText('No uses formatos no estándar.')).toBeInTheDocument();
    });

    it('renders warning callout with proper styles and ⚠️ icon', () => {
      const { container } = render(
        <ObsidianCallout
          type="warning"
          title="Atención"
          content="Cuidado con las columnas complejas."
        />
      );
      const callout = container.querySelector('.obsidian-callout');
      expect(callout.style.backgroundColor).toBe('rgba(219, 139, 0, 0.1)');
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('renders info callout with proper styles and ℹ️ icon', () => {
      const { container } = render(
        <ObsidianCallout
          type="info"
          title="Regla de Oro"
          content="Fórmula Google XYZ."
        />
      );
      const callout = container.querySelector('.obsidian-callout');
      expect(callout.style.backgroundColor).toBe('rgba(8, 109, 221, 0.1)');
      expect(screen.getByText('ℹ️')).toBeInTheDocument();
    });
  });

  describe('Polymorphic BitacoraCard', () => {
    const mockItemWithAll = {
      id: 'test-1',
      category: 'bullets',
      title: 'Título de Prueba',
      summary: 'Resumen descriptivo del consejo.',
      readTimeMinutes: 2,
      callout: {
        type: 'info',
        title: 'Consejo Rápido',
        text: 'Contenido del callout.',
      },
      content: 'Contenido extenso de la guía detallada.',
      links: [{ label: 'Enlace Externo', url: 'https://example.com' }],
      author: { name: 'Juani Carrizo', role: 'Staff', isOfficial: true },
      upvotes: 10,
      tags: ['TestTag', 'React'],
    };

    it('renders title, summary, callout, tags, links and author', () => {
      const onVote = vi.fn();
      const onOpenDetail = vi.fn();
      const onSelectTag = vi.fn();

      render(
        <BitacoraCard
          item={mockItemWithAll}
          isVoted={false}
          onVote={onVote}
          onOpenDetail={onOpenDetail}
          onSelectTag={onSelectTag}
          categoryConfig={{ label: 'Bullets', badgeColor: '#059669' }}
        />
      );

      expect(screen.getByText('Título de Prueba')).toBeInTheDocument();
      expect(screen.getByText('Resumen descriptivo del consejo.')).toBeInTheDocument();
      expect(screen.getByText('Consejo Rápido')).toBeInTheDocument();
      expect(screen.getByText('Enlace Externo')).toBeInTheDocument();
      expect(screen.getByText('Juani Carrizo')).toBeInTheDocument();
      expect(screen.getByText('TestTag')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();

      // Clicking upvote
      const voteBtn = screen.getByRole('button', { name: /Marcar como útil/i });
      fireEvent.click(voteBtn);
      expect(onVote).toHaveBeenCalledWith('test-1');

      // Clicking detail
      const detailBtn = screen.getByRole('button', { name: /Leer guía/i });
      fireEvent.click(detailBtn);
      expect(onOpenDetail).toHaveBeenCalledWith(mockItemWithAll);

      // Clicking tag
      fireEvent.click(screen.getByText('TestTag'));
      expect(onSelectTag).toHaveBeenCalledWith('TestTag');
    });

    it('gracefully renders card without links and without long content', () => {
      const mockSimpleItem = {
        id: 'simple-1',
        category: 'ats',
        title: 'Tip Corto',
        summary: 'Solo resumen.',
        author: { name: 'Comunidad', isOfficial: false },
        upvotes: 2,
        tags: [],
      };

      render(
        <BitacoraCard
          item={mockSimpleItem}
          isVoted={true}
          onVote={vi.fn()}
          onOpenDetail={vi.fn()}
          onSelectTag={vi.fn()}
        />
      );

      expect(screen.getByText('Tip Corto')).toBeInTheDocument();
      expect(screen.queryByText(/Leer guía/i)).not.toBeInTheDocument();
    });
  });

  describe('BitacoraModal Full-Screen Integration', () => {
    it('does not render when isOpen is false', () => {
      render(<BitacoraModal isOpen={false} onClose={vi.fn()} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders full-screen hub with categories, search and items when isOpen is true', () => {
      const onClose = vi.fn();
      render(<BitacoraModal isOpen={true} onClose={onClose} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Bitácora & Playbook de Carrera/i)).toBeInTheDocument();

      // Check category pills rendered
      expect(screen.getByText('Todos')).toBeInTheDocument();
      expect(screen.getAllByText('ATS & Filtros').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Bullets de Impacto').length).toBeGreaterThan(0);

      // Search functionality
      const searchInput = screen.getByPlaceholderText(/Buscar por palabra clave/i);
      fireEvent.change(searchInput, { target: { value: 'Google' } });

      expect(screen.getByText(/Fórmula Google X-Y-Z/i)).toBeInTheDocument();

      // Close button
      const closeBtn = screen.getByLabelText('Cerrar bitácora');
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    });

    it('filters items by category when clicking category pills', () => {
      render(<BitacoraModal isOpen={true} onClose={vi.fn()} />);

      // Switch to 'Bullets de Impacto'
      const bulletsPill = screen.getByRole('button', { name: /Bullets de Impacto/i });
      fireEvent.click(bulletsPill);

      expect(screen.getByText(/Fórmula Google X-Y-Z/i)).toBeInTheDocument();
      expect(screen.queryByText(/Mitos vs. Realidad de los sistemas ATS/i)).not.toBeInTheDocument();
    });

    it('handles upvoting with anti-abuse persistence', () => {
      render(<BitacoraModal isOpen={true} onClose={vi.fn()} />);

      const voteButtons = screen.getAllByTitle(/Votar consejo como útil/i);
      expect(voteButtons.length).toBeGreaterThan(0);

      // Vote first item
      fireEvent.click(voteButtons[0]);

      const votedIds = storage.getVotedItemIds();
      expect(votedIds.length).toBe(1);
    });
  });
});
