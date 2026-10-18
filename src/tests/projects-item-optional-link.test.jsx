import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectsItem, { ProjectsItemEditView, ProjectsItemPrintView } from '../components/CV/items/ProjectsItem';

describe('ProjectsItem Optional Link UX & Deletion', () => {
  const itemWithLink = {
    id: 'proj-1',
    title: 'Sistema de Gestión Cloud',
    subtitle: 'React · TypeScript · GraphQL',
    date: '2025',
    link: 'https://github.com/usuario/cloud-manager',
    linkText: 'Repositorio GitHub',
    description: 'Arquitectura escalable en la nube.',
    bullets: ['Optimización de latencia en un 40%']
  };

  const itemWithoutLink = {
    id: 'proj-2',
    title: 'Herramienta CLI Interna',
    subtitle: 'Go · Docker',
    date: '2024',
    link: '',
    linkText: '',
    description: 'Automatización de tareas de infraestructura.',
    bullets: ['Reducción de tareas manuales']
  };

  describe('When project item HAS a link', () => {
    it('renders the hyperlink and the quick remove button in edit mode', () => {
      const onUpdateItem = vi.fn();
      render(
        <ProjectsItem 
          item={itemWithLink} 
          sectionId="projects" 
          onUpdateItem={onUpdateItem} 
        />
      );

      // Hyperlink trigger should be present with text
      const trigger = screen.getByTestId('hyperlink-trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger.textContent).toContain('Repositorio GitHub');

      // Direct remove button should be present
      const removeBtn = screen.getByTestId('btn-remove-project-link');
      expect(removeBtn).toBeInTheDocument();
      expect(removeBtn).toHaveClass('no-print');

      // Add link button should NOT be present
      expect(screen.queryByTestId('btn-add-project-link')).toBeNull();
    });

    it('clicking the quick remove button clears link and linkText', () => {
      const onUpdateItem = vi.fn();
      render(
        <ProjectsItem 
          item={itemWithLink} 
          sectionId="projects" 
          onUpdateItem={onUpdateItem} 
        />
      );

      const removeBtn = screen.getByTestId('btn-remove-project-link');
      fireEvent.click(removeBtn);

      expect(onUpdateItem).toHaveBeenCalledWith('projects', 'proj-1', {
        link: '',
        linkText: ''
      });
    });

    it('clicking remove link from the Google Docs style popover also clears link and linkText', () => {
      const onUpdateItem = vi.fn();
      render(
        <ProjectsItem 
          item={itemWithLink} 
          sectionId="projects" 
          onUpdateItem={onUpdateItem} 
        />
      );

      // Open popover
      const trigger = screen.getByTestId('hyperlink-trigger');
      fireEvent.click(trigger);

      // Find popover remove button
      const popoverRemoveBtn = screen.getByTestId('btn-remove-link');
      expect(popoverRemoveBtn).toBeInTheDocument();
      fireEvent.click(popoverRemoveBtn);

      expect(onUpdateItem).toHaveBeenCalledWith('projects', 'proj-1', {
        link: '',
        linkText: ''
      });
    });

    it('editing link via popover updates link and linkText', () => {
      const onUpdateItem = vi.fn();
      render(
        <ProjectsItem 
          item={itemWithLink} 
          sectionId="projects" 
          onUpdateItem={onUpdateItem} 
        />
      );

      // Open popover
      const trigger = screen.getByTestId('hyperlink-trigger');
      fireEvent.click(trigger);

      const textInput = screen.getByTestId('input-link-text');
      const urlInput = screen.getByTestId('input-link-url');

      fireEvent.change(textInput, { target: { value: 'Demo en Vivo' } });
      fireEvent.change(urlInput, { target: { value: 'https://demo.app.com' } });
      fireEvent.click(screen.getByTestId('btn-apply-link'));

      expect(onUpdateItem).toHaveBeenCalledWith('projects', 'proj-1', {
        link: 'https://demo.app.com',
        linkText: 'Demo en Vivo'
      });
    });
  });

  describe('When project item does NOT have a link', () => {
    it('does NOT render HyperlinkEdit and renders "+ Agregar link" button', () => {
      const onUpdateItem = vi.fn();
      render(
        <ProjectsItem 
          item={itemWithoutLink} 
          sectionId="projects" 
          onUpdateItem={onUpdateItem} 
        />
      );

      // No hyperlink trigger or remove button
      expect(screen.queryByTestId('hyperlink-trigger')).toBeNull();
      expect(screen.queryByTestId('btn-remove-project-link')).toBeNull();

      // Add button should be visible with no-print class
      const addBtn = screen.getByTestId('btn-add-project-link');
      expect(addBtn).toBeInTheDocument();
      expect(addBtn).toHaveClass('no-print');
      expect(addBtn.textContent).toContain('Agregar enlace');
    });

    it('clicking "+ Agregar link" adds a default link to the project item', () => {
      const onUpdateItem = vi.fn();
      render(
        <ProjectsItem 
          item={itemWithoutLink} 
          sectionId="projects" 
          onUpdateItem={onUpdateItem} 
        />
      );

      const addBtn = screen.getByTestId('btn-add-project-link');
      fireEvent.click(addBtn);

      expect(onUpdateItem).toHaveBeenCalledWith('projects', 'proj-2', {
        link: 'https://github.com',
        linkText: 'Ver Proyecto'
      });
    });

    it('treats whitespace-only link as absent', () => {
      const whitespaceItem = { ...itemWithoutLink, link: '   ' };
      render(
        <ProjectsItem 
          item={whitespaceItem} 
          sectionId="projects" 
          onUpdateItem={vi.fn()} 
        />
      );

      expect(screen.queryByTestId('hyperlink-trigger')).toBeNull();
      expect(screen.getByTestId('btn-add-project-link')).toBeInTheDocument();
    });
  });

  describe('Print View Parity', () => {
    it('renders link in print mode when link is present', () => {
      render(
        <ProjectsItem 
          item={itemWithLink} 
          sectionId="projects" 
          isPrint={true} 
        />
      );

      const printLink = screen.getByRole('link');
      expect(printLink).toBeInTheDocument();
      expect(printLink.getAttribute('href')).toBe('https://github.com/usuario/cloud-manager');
      expect(printLink.textContent).toContain('Repositorio GitHub');

      // No editor buttons in print mode
      expect(screen.queryByTestId('btn-remove-project-link')).toBeNull();
      expect(screen.queryByTestId('btn-add-project-link')).toBeNull();
    });

    it('does NOT render any link or editor buttons in print mode when link is absent', () => {
      render(
        <ProjectsItem 
          item={itemWithoutLink} 
          sectionId="projects" 
          isPrint={true} 
        />
      );

      expect(screen.queryByRole('link')).toBeNull();
      expect(screen.queryByTestId('btn-remove-project-link')).toBeNull();
      expect(screen.queryByTestId('btn-add-project-link')).toBeNull();
    });
  });
});
