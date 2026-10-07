import { useState, useEffect, useCallback } from 'react';

export const MODAL_THEME_STORAGE_KEY = 'ressume_fullscreen_modal_theme';
export const MODAL_THEME_CHANGE_EVENT = 'ressume_modal_theme_changed';

/**
 * useModalTheme Hook
 *
 * Controls the visual theme exclusively for full-screen modals.
 * - Defaults to 'dark' mode.
 * - Allows user opt-in to 'light' mode.
 * - Does NOT affect the editor canvas (strictly adhering to design constraints).
 * - Persists preference in localStorage.
 * - Synchronizes across modal instances via custom window event.
 */
export function useModalTheme(initialOverride) {
  const [modalTheme, setModalThemeState] = useState(() => {
    if (initialOverride) return initialOverride;
    if (typeof window === 'undefined' || !window.localStorage) return 'dark';
    try {
      const stored = localStorage.getItem(MODAL_THEME_STORAGE_KEY);
      return stored === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  // Listen for changes across other modal instances
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorage = (e) => {
      if (e.key === MODAL_THEME_STORAGE_KEY && e.newValue) {
        setModalThemeState(e.newValue === 'light' ? 'light' : 'dark');
      }
    };

    const handleCustomEvent = (e) => {
      if (e.detail?.theme) {
        setModalThemeState(e.detail.theme === 'light' ? 'light' : 'dark');
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(MODAL_THEME_CHANGE_EVENT, handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(MODAL_THEME_CHANGE_EVENT, handleCustomEvent);
    };
  }, []);

  const setTheme = useCallback((theme) => {
    const nextTheme = theme === 'light' ? 'light' : 'dark';
    setModalThemeState(nextTheme);
    try {
      localStorage.setItem(MODAL_THEME_STORAGE_KEY, nextTheme);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(MODAL_THEME_CHANGE_EVENT, { detail: { theme: nextTheme } })
        );
      }
    } catch {}
  }, []);

  const toggleModalTheme = useCallback(() => {
    setModalThemeState((prev) => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(MODAL_THEME_STORAGE_KEY, nextTheme);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent(MODAL_THEME_CHANGE_EVENT, { detail: { theme: nextTheme } })
          );
        }
      } catch {}
      return nextTheme;
    });
  }, []);

  return {
    modalTheme,
    isDark: modalTheme === 'dark',
    toggleModalTheme,
    setModalTheme: setTheme,
  };
}

export default useModalTheme;
