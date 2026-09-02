import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import HyperlinkEdit from '../components/Editor/HyperlinkEdit';
import { CVProvider } from '../context/CVContext';
import ExperienceItem from '../components/CV/items/ExperienceItem';

describe('Google Docs Style HyperlinkEdit UX Component', () => {
  const defaultUrl = 'github.com/juani981/WebEncuestas-Demo';
  const defaultText = 'Proyecto de Encuestas';

  it('T1: Renders the hyperlink with icon and visual display text', () => {
    render(
      <HyperlinkEdit 
        url={defaultUrl} 
        text={defaultText} 
        onSave={vi.fn()} 
      />
    );

    const trigger = screen.getByTestId('hyperlink-trigger');
    expect(trigger).toBeInTheDocument();
    expect(trigger.textContent).toContain(defaultText);
    expect(trigger.querySelector('i.bx-link-external')).not.toBeNull();
  });

  it('T2: Clicking the trigger opens the Google Docs popover with IR AL HIPERVINCULO and both editable fields', () => {
    render(
      <HyperlinkEdit 
        url={defaultUrl} 
        text={defaultText} 
        onSave={vi.fn()} 
        onRemove={vi.fn()} 
      />
    );

    fireEvent.click(screen.getByTestId('hyperlink-trigger'));

    // Verify popover is visible
    expect(screen.getByTestId('hyperlink-popover')).toBeInTheDocument();

    // Verify "IR AL HIPERVINCULO" button
    const goBtn = screen.getByTestId('btn-go-to-link');
    expect(goBtn).toBeInTheDocument();
    expect(goBtn.textContent).toContain('IR AL HIPERVÍNCULO');
    expect(goBtn.getAttribute('href')).toBe(`https://${defaultUrl}`);
    expect(goBtn.getAttribute('target')).toBe('_blank');

    // Verify both editable fields
    const textInput = screen.getByTestId('input-link-text');
    const urlInput = screen.getByTestId('input-link-url');
    expect(textInput).toBeInTheDocument();
    expect(textInput.value).toBe(defaultText);
    expect(urlInput).toBeInTheDocument();
    expect(urlInput.value).toBe(defaultUrl);
  });

  it('T3: Editing the visual name and URL and clicking Aplicar triggers onSave with updated values', () => {
    const onSaveMock = vi.fn();
    render(
      <HyperlinkEdit 
        url={defaultUrl} 
        text={defaultText} 
        onSave={onSaveMock} 
      />
    );

    fireEvent.click(screen.getByTestId('hyperlink-trigger'));

    const textInput = screen.getByTestId('input-link-text');
    const urlInput = screen.getByTestId('input-link-url');

    fireEvent.change(textInput, { target: { value: 'Repositorio Oficial' } });
    fireEvent.change(urlInput, { target: { value: 'https://github.com/juani981/repo-oficial' } });

    fireEvent.click(screen.getByTestId('btn-apply-link'));

    expect(onSaveMock).toHaveBeenCalledWith({
      url: 'https://github.com/juani981/repo-oficial',
      text: 'Repositorio Oficial'
    });

    // Popover closes after apply
    expect(screen.queryByTestId('hyperlink-popover')).toBeNull();
  });

  it('T4: Pressing Enter inside an input field applies the changes', () => {
    const onSaveMock = vi.fn();
    render(
      <HyperlinkEdit 
        url={defaultUrl} 
        text={defaultText} 
        onSave={onSaveMock} 
      />
    );

    fireEvent.click(screen.getByTestId('hyperlink-trigger'));

    const textInput = screen.getByTestId('input-link-text');
    fireEvent.change(textInput, { target: { value: 'Nuevo Texto' } });
    fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter' });

    expect(onSaveMock).toHaveBeenCalledWith({
      url: defaultUrl,
      text: 'Nuevo Texto'
    });
    expect(screen.queryByTestId('hyperlink-popover')).toBeNull();
  });

  it('T5: Clicking remove link button triggers onRemove and closes popover', () => {
    const onRemoveMock = vi.fn();
    render(
      <HyperlinkEdit 
        url={defaultUrl} 
        text={defaultText} 
        onSave={vi.fn()} 
        onRemove={onRemoveMock} 
      />
    );

    fireEvent.click(screen.getByTestId('hyperlink-trigger'));
    fireEvent.click(screen.getByTestId('btn-remove-link'));

    expect(onRemoveMock).toHaveBeenCalled();
    expect(screen.queryByTestId('hyperlink-popover')).toBeNull();
  });

  it('T6: Integration with ExperienceItem renders HyperlinkEdit and handles updates cleanly', () => {
    const onUpdateMock = vi.fn();
    const item = {
      id: 'proj1',
      title: 'Demo Project',
      subtitle: 'React & Laravel',
      date: '2024',
      link: 'github.com/juani981/demo',
      linkText: 'Ver código fuente'
    };

    render(
      <ExperienceItem 
        item={item} 
        sectionId="projects" 
        onUpdateItem={onUpdateMock} 
      />
    );

    // Initial render displays linkText
    const trigger = screen.getByTestId('hyperlink-trigger');
    expect(trigger.textContent).toContain('Ver código fuente');

    // Click to open popover
    fireEvent.click(trigger);
    expect(screen.getByTestId('hyperlink-popover')).toBeInTheDocument();

    // Edit visual text
    const textInput = screen.getByTestId('input-link-text');
    fireEvent.change(textInput, { target: { value: 'GitHub Repo' } });
    fireEvent.click(screen.getByTestId('btn-apply-link'));

    expect(onUpdateMock).toHaveBeenCalledWith('projects', 'proj1', {
      link: 'github.com/juani981/demo',
      linkText: 'GitHub Repo'
    });
  });
});
