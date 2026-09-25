import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrintModeContext, usePrintMode } from '../context/PrintModeContext';
import InlineEdit from '../components/Editor/InlineEdit';
import HyperlinkEdit from '../components/Editor/HyperlinkEdit';
import { PrintBaseSection } from '../components/CV/BaseSection';
import { CVProvider } from '../context/CVContext';

const ConsumerComponent = () => {
  const isPrint = usePrintMode();
  return <div data-testid="consumer">{isPrint ? 'PRINT_MODE' : 'EDITOR_MODE'}</div>;
};

describe('PrintModeContext & usePrintMode Ambient Resolution', () => {
  it('defaults to false when outside provider', () => {
    render(<ConsumerComponent />);
    expect(screen.getByTestId('consumer').textContent).toBe('EDITOR_MODE');
  });

  it('provides true when wrapped in PrintModeContext.Provider value={true}', () => {
    render(
      <PrintModeContext.Provider value={true}>
        <ConsumerComponent />
      </PrintModeContext.Provider>
    );
    expect(screen.getByTestId('consumer').textContent).toBe('PRINT_MODE');
  });

  it('InlineEdit renders print view when wrapped in PrintModeContext.Provider without explicit prop', () => {
    render(
      <PrintModeContext.Provider value={true}>
        <InlineEdit value="Ambient Print Text" />
      </PrintModeContext.Provider>
    );
    // In print mode, InlineEdit displays as a simple span, not an interactive button with data-testid="inline-edit-display" (role="button")
    const el = screen.getByText('Ambient Print Text');
    expect(el.getAttribute('role')).toBeNull();
    expect(el.classList.contains('inline-edit-display')).toBe(true);
  });

  it('HyperlinkEdit renders print view when wrapped in PrintModeContext.Provider without explicit prop', () => {
    render(
      <PrintModeContext.Provider value={true}>
        <HyperlinkEdit url="https://example.com" text="Example Link" />
      </PrintModeContext.Provider>
    );
    // In print mode, HyperlinkEdit renders directly an <a> tag instead of a popover trigger span
    const link = screen.getByRole('link');
    expect(link).toBeDefined();
    expect(link.getAttribute('href')).toBe('https://example.com');
  });

  it('PrintBaseSection automatically provides PrintModeContext to descendants', () => {
    const dummySection = {
      id: 'section-test-ambient',
      type: 'skills',
      title: 'Habilidades Ambientales',
      items: [
        { id: 'skill-1', name: 'React Context API' }
      ]
    };

    render(
      <CVProvider>
        <PrintBaseSection section={dummySection} />
      </CVProvider>
    );

    // Title should be rendered in print mode (static span, no role="button")
    const titleText = screen.getByText('Habilidades Ambientales');
    expect(titleText.getAttribute('role')).toBeNull();
  });
});
