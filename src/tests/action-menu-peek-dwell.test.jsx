import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ActionMenuRoot from '../components/Editor/ActionMenu/ActionMenuRoot';
import { CVProvider } from '../context/CVContext';

describe('ActionMenu Peek & Dwell Hover Intent Feature', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('T1: renders the peek tab and toolbar in collapsed state when isPinned is false', () => {
    localStorage.setItem('action_menu_pinned', 'false');

    render(
      <CVProvider>
        <ActionMenuRoot />
      </CVProvider>
    );

    const peekTab = screen.getByTestId('action-menu-peek-tab');
    expect(peekTab).toBeInTheDocument();

    const navbar = document.querySelector('.l-navbar');
    expect(navbar).toBeInTheDocument();
    expect(navbar.getAttribute('data-expanded')).toBe('false');
  });

  it('T2: hovering over peek tab triggers preparing state and expands after 280ms dwell', () => {
    localStorage.setItem('action_menu_pinned', 'false');

    render(
      <CVProvider>
        <ActionMenuRoot />
      </CVProvider>
    );

    const peekTab = screen.getByTestId('action-menu-peek-tab');
    const navbar = document.querySelector('.l-navbar');

    expect(navbar.getAttribute('data-expanded')).toBe('false');

    // Mouse enters peek tab
    act(() => {
      fireEvent.mouseEnter(peekTab);
    });

    // Advance 100ms: should still be collapsed (filtering accidental pass)
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(navbar.getAttribute('data-expanded')).toBe('false');

    // Advance remaining 180ms (total 280ms): dwell met!
    act(() => {
      vi.advanceTimersByTime(180);
    });
    expect(navbar.getAttribute('data-expanded')).toBe('true');
  });

  it('T3: mouse leave triggers 350ms grace period before auto-collapsing', () => {
    localStorage.setItem('action_menu_pinned', 'false');

    render(
      <CVProvider>
        <ActionMenuRoot />
      </CVProvider>
    );

    const peekTab = screen.getByTestId('action-menu-peek-tab');
    const navbar = document.querySelector('.l-navbar');

    // Dwell to expand
    act(() => {
      fireEvent.mouseEnter(peekTab);
      vi.advanceTimersByTime(280);
    });
    expect(navbar.getAttribute('data-expanded')).toBe('true');

    // Mouse leaves
    act(() => {
      fireEvent.mouseLeave(navbar);
    });

    // At 200ms grace period: still expanded
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(navbar.getAttribute('data-expanded')).toBe('true');

    // At 351ms (grace period exceeded): collapses
    act(() => {
      vi.advanceTimersByTime(160);
    });
    expect(navbar.getAttribute('data-expanded')).toBe('false');
  });

  it('T4: clicking peek tab immediately opens and pins the toolbar', () => {
    localStorage.setItem('action_menu_pinned', 'false');

    render(
      <CVProvider>
        <ActionMenuRoot />
      </CVProvider>
    );

    const peekTab = screen.getByTestId('action-menu-peek-tab');
    const navbar = document.querySelector('.l-navbar');

    act(() => {
      fireEvent.click(peekTab);
    });

    expect(navbar.getAttribute('data-expanded')).toBe('true');
    expect(localStorage.getItem('action_menu_pinned')).toBe('true');

    // Even if mouse leaves, it stays expanded because it is pinned
    act(() => {
      fireEvent.mouseLeave(navbar);
      vi.advanceTimersByTime(500);
    });
    expect(navbar.getAttribute('data-expanded')).toBe('true');
  });

  it('T5: clicking collapse button immediately collapses the toolbar', () => {
    localStorage.setItem('action_menu_pinned', 'true');

    render(
      <CVProvider>
        <ActionMenuRoot />
      </CVProvider>
    );

    const navbar = document.querySelector('.l-navbar');
    expect(navbar.getAttribute('data-expanded')).toBe('true');

    const collapseBtn = screen.getByTestId('btn-collapse-action-menu');
    act(() => {
      fireEvent.click(collapseBtn);
    });

    expect(navbar.getAttribute('data-expanded')).toBe('false');
    expect(localStorage.getItem('action_menu_pinned')).toBe('false');
  });

  it('T6: clicking pin button toggles pinned state', () => {
    localStorage.setItem('action_menu_pinned', 'true');

    render(
      <CVProvider>
        <ActionMenuRoot />
      </CVProvider>
    );

    const pinBtn = screen.getByTestId('btn-pin-action-menu');
    expect(pinBtn).toHaveClass('is-pinned');

    // Unpin
    act(() => {
      fireEvent.click(pinBtn);
    });
    expect(pinBtn).not.toHaveClass('is-pinned');
    expect(localStorage.getItem('action_menu_pinned')).toBe('false');

    // Pin again
    act(() => {
      fireEvent.click(pinBtn);
    });
    expect(pinBtn).toHaveClass('is-pinned');
    expect(localStorage.getItem('action_menu_pinned')).toBe('true');
  });
});
