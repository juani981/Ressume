import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CVProvider } from '../context/CVContext';
import InlineEdit from '../components/Editor/InlineEdit';
import SimpleListItem from '../components/CV/items/SimpleListItem';
import { SortableBulletItem } from '../components/CV/SortableBulletItem';
import { ExperienceItemPrintView } from '../components/CV/items/ExperienceItem';
import { ProjectsItemPrintView } from '../components/CV/items/ProjectsItem';
import { VolunteeringItemPrintView } from '../components/CV/items/VolunteeringItem';
import SkillsItem from '../components/CV/items/SkillsItem';
import fs from 'fs';
import path from 'path';

describe('Bullet Points Word-Wrap & Enter Newline Behavior', () => {
  it('1. SimpleListItem renders with multiline enabled and wraps with pre-wrap in edit mode', () => {
    const { container } = render(
      <CVProvider>
        <SimpleListItem
          item={{ id: 'b1', text: 'First line of bullet point\nSecond line of bullet point' }}
          sectionId="exp_sec"
          onUpdateItem={vi.fn()}
          isPrint={false}
        />
      </CVProvider>
    );

    const textSpan = container.querySelector('.simple-list-text');
    expect(textSpan).toBeTruthy();
    expect(textSpan.style.flex).toMatch(/1/);
    expect(['0', '0px']).toContain(textSpan.style.minWidth);
    expect(textSpan.style.maxWidth).toBe('100%');
    expect(textSpan.style.overflowWrap).toBe('break-word');
    expect(textSpan.style.wordBreak).toBe('break-word');
    expect(textSpan.style.whiteSpace).toBe('pre-wrap');

    const display = container.querySelector('.inline-edit-display');
    expect(display).toBeTruthy();
    expect(display.style.whiteSpace).toBe('pre-wrap');
    expect(display.style.overflowWrap).toBe('break-word');
  });

  it('2. SimpleListItem in print mode renders with multiline enabled and pre-wrap', () => {
    const { container } = render(
      <SimpleListItem
        item={{ id: 'b1', text: 'Long bullet text that must wrap to next line' }}
        sectionId="exp_sec"
        isPrint={true}
      />
    );

    const display = container.querySelector('.inline-edit-display');
    expect(display).toBeTruthy();
    expect(display.style.whiteSpace).toBe('pre-wrap');
    expect(display.style.overflowWrap).toBe('break-word');
    expect(display.style.wordBreak).toBe('break-word');
  });

  it('3. Pressing Enter inside a bullet point InlineEdit does not blur or abort editing', async () => {
    const onSaveMock = vi.fn();
    render(
      <CVProvider>
        <SimpleListItem
          item={{ id: 'b1', text: 'Bullet point' }}
          sectionId="sec"
          onUpdateItem={onSaveMock}
          isPrint={false}
        />
      </CVProvider>
    );

    const display = screen.getByTestId('inline-edit-display');
    fireEvent.click(display);

    const editor = screen.getByRole('textbox');
    expect(editor.getAttribute('aria-multiline')).toBe('true');
    expect(editor.style.whiteSpace).toBe('pre-wrap');

    // Dispatch Enter key event
    const enterEvt = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    const preventSpy = vi.spyOn(enterEvt, 'preventDefault');
    editor.dispatchEvent(enterEvt);

    // Enter must NOT be prevented in multiline mode
    expect(preventSpy).not.toHaveBeenCalled();
    // Editor should still be active, not blurred
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('4. Experience, Projects, and Volunteering print views render bullets with multiline pre-wrap', () => {
    const expItem = {
      id: 'exp1',
      title: 'Dev',
      bullets: ['Multi-line responsibility\nAccomplished feature']
    };
    const { container: expContainer } = render(
      <ExperienceItemPrintView item={expItem} sectionId="exp_sec" />
    );
    const expDisplay = expContainer.querySelector('ul.experience__bullets .inline-edit-display');
    expect(expDisplay).toBeTruthy();
    expect(expDisplay.style.whiteSpace).toBe('pre-wrap');

    const projItem = {
      id: 'proj1',
      title: 'App',
      bullets: ['Built fullstack application with automated testing']
    };
    const { container: projContainer } = render(
      <ProjectsItemPrintView item={projItem} sectionId="proj_sec" />
    );
    const projDisplay = projContainer.querySelector('ul.experience__bullets .inline-edit-display');
    expect(projDisplay).toBeTruthy();
    expect(projDisplay.style.whiteSpace).toBe('pre-wrap');

    const volItem = {
      id: 'vol1',
      title: 'Org',
      bullets: ['Organized workshops']
    };
    const { container: volContainer } = render(
      <VolunteeringItemPrintView item={volItem} sectionId="vol_sec" />
    );
    const volDisplay = volContainer.querySelector('ul.experience__bullets .inline-edit-display');
    expect(volDisplay).toBeTruthy();
    expect(volDisplay.style.whiteSpace).toBe('pre-wrap');
  });

  it('5. SkillsItem description renders with multiline enabled and pre-wrap word wrapping', () => {
    const { container } = render(
      <SkillsItem
        item={{ id: 's1', title: 'Frontend', description: 'React, Vue\nSvelte and Next.js' }}
        sectionId="skills_sec"
        onUpdateItem={vi.fn()}
        isPrint={false}
      />
    );

    const displays = container.querySelectorAll('.inline-edit-display');
    expect(displays.length).toBe(2);
    // Description is the second display element
    const descDisplay = displays[1];
    expect(descDisplay.style.whiteSpace).toBe('pre-wrap');
    expect(descDisplay.style.overflowWrap).toBe('break-word');
  });

  it('6. InlineEdit preserves newlines in display mode without collapsing to single line', () => {
    const multilineText = 'First line\nSecond line\nThird line';
    const { container } = render(
      <CVProvider>
        <InlineEdit value={multilineText} multiline={true} />
      </CVProvider>
    );

    const display = container.querySelector('.inline-edit-display');
    expect(display).toBeTruthy();
    expect(display.style.whiteSpace).toBe('pre-wrap');
    expect(display.textContent).toContain('First line');
    expect(display.textContent).toContain('Second line');
  });

  it('7. CSS files include pre-wrap and word-break rules for inline-edit and simple-list-text', () => {
    const indexCss = fs.readFileSync(path.resolve(__dirname, '../index.css'), 'utf-8');
    expect(indexCss).toContain('.simple-list-text');
    expect(indexCss).toMatch(/\.inline-edit-display\s*\{[^}]*white-space:\s*pre-wrap/);
    expect(indexCss).toMatch(/\.inline-input\s*\{[^}]*white-space:\s*pre-wrap/);

    const printCss = fs.readFileSync(path.resolve(__dirname, '../styles/print.css'), 'utf-8');
    expect(printCss).toContain('.simple-list-text');
    expect(printCss).toMatch(/\.inline-edit-display[^}]*white-space:\s*pre-wrap/);
  });
});
