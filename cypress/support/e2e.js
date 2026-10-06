// ***********************************************************
// Cypress Support File for Ressume
// ***********************************************************

import './commands';

// Automatically disable the onboarding tour and ensure ActionMenu is pinned by default for standard E2E tests
Cypress.on('window:before:load', (win) => {
  try {
    if (win.localStorage.getItem('skip_onboarding_tour') === null) {
      win.localStorage.setItem('skip_onboarding_tour', 'true');
    }
    if (win.localStorage.getItem('action_menu_pinned') === null) {
      win.localStorage.setItem('action_menu_pinned', 'true');
    }
  } catch (_) {}
});

// Uncaught exception handling (prevent 3rd party or minor React errors from failing E2E tests)
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test on unhandled exceptions
  if (err.message && (
    err.message.includes('ResizeObserver') ||
    err.message.includes('print')
  )) {
    return false;
  }
  return true;
});
