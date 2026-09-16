// ***********************************************************
// Cypress Support File for Ressume
// ***********************************************************

import './commands';

// Automatically disable the onboarding tour in all E2E tests to avoid backdrop click-blocking
Cypress.on('window:before:load', (win) => {
  try {
    win.localStorage.setItem('skip_onboarding_tour', 'true');
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
