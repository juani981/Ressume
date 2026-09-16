// ***********************************************
// Cypress Custom Commands for Ressume E2E Testing
// ***********************************************

/**
 * Ensures Google Fonts and document fonts are fully loaded before testing layout.
 */
Cypress.Commands.add('waitForFonts', () => {
  cy.document().then((doc) => {
    return doc.fonts.ready;
  });
});

/**
 * Intercepts window.print and iframe.contentWindow.print to prevent OS dialog blocks,
 * smoothly completes the clean print lifecycle, and captures the exact print document.
 */
Cypress.Commands.add('stubPrint', () => {
  cy.window().then((win) => {
    // Flag to prevent iframe teardown during test assertions
    win.__CYPRESS_PRINT_TEST__ = true;

    // Record calls and state on window
    win.__printCalls = [];
    win.__lastPrintDoc = null;
    win.__lastPrintDocHtml = null;

    // Fallback stub on main window
    cy.stub(win, 'print').callsFake(() => {
      win.__printCalls.push({ type: 'window', timestamp: Date.now() });
      win.dispatchEvent(new win.CustomEvent('print-dialog-closed'));
      win.dispatchEvent(new Event('afterprint'));
    }).as('windowPrintStub');

    // Intercept iframe.contentWindow.print
    const originalContentWindow = Object.getOwnPropertyDescriptor(
      win.HTMLIFrameElement.prototype,
      'contentWindow'
    );

    if (originalContentWindow && originalContentWindow.get) {
      Object.defineProperty(win.HTMLIFrameElement.prototype, 'contentWindow', {
        get() {
          const contentWin = originalContentWindow.get.call(this);
          if (contentWin && !contentWin.__printStubbed) {
            try {
              contentWin.print = () => {
                win.__printCalls.push({ type: 'iframe', timestamp: Date.now() });

                // Capture document snapshot right when print is triggered
                try {
                  win.__lastPrintDoc = contentWin.document;
                  win.__lastPrintDocHtml = contentWin.document?.documentElement?.outerHTML || '';
                } catch (_) {}

                try {
                  contentWin.dispatchEvent(new Event('afterprint'));
                } catch (_) {}
                try {
                  win.dispatchEvent(new Event('afterprint'));
                } catch (_) {}
                try {
                  win.dispatchEvent(new win.CustomEvent('print-dialog-closed'));
                } catch (_) {}
              };
              contentWin.__printStubbed = true;
            } catch (_) {}
          }
          return contentWin;
        },
        configurable: true,
      });
    }
  });
});

/**
 * Retrieves the captured document of the last print job (with retry until populated).
 */
Cypress.Commands.add('getLastPrintDoc', () => {
  return cy.window().its('__lastPrintDoc', { timeout: 10000 }).should('exist').and('not.be.null');
});

/**
 * Sets the value of a React-controlled range slider cleanly triggering React's synthetic event tracker.
 */
Cypress.Commands.add('setSliderValue', { prevSubject: 'element' }, (subject, value) => {
  cy.window().then((win) => {
    const input = subject[0];
    const nativeSetter = Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'value').set;
    nativeSetter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
});

/**
 * Uses Chrome DevTools Protocol (CDP) to render the exact physical PDF via Page.printToPDF
 * under @media print rules and writes it as a binary PDF to disk.
 */
Cypress.Commands.add('generatePdfWithCDP', (outputPath = 'cypress/downloads/curriculum.pdf') => {
  // 1. Emulate print media so print.css styles apply cleanly
  cy.wrap(
    Cypress.automation('remote:debugger:protocol', {
      command: 'Emulation.setEmulatedMedia',
      params: { media: 'print' },
    }),
    { log: false }
  );

  // 2. Call Chromium's native Page.printToPDF
  cy.wrap(
    Cypress.automation('remote:debugger:protocol', {
      command: 'Page.printToPDF',
      params: {
        paperWidth: 8.27, // A4 width (210 mm)
        paperHeight: 11.69, // A4 height (297 mm)
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
        printBackground: true,
        preferCSSPageSize: true,
      },
    }),
    { log: false }
  ).then((result) => {
    // 3. Restore normal screen media
    Cypress.automation('remote:debugger:protocol', {
      command: 'Emulation.setEmulatedMedia',
      params: { media: '' },
    });

    // 4. Save base64 PDF stream to disk
    cy.writeFile(outputPath, result.data, 'base64');
    return cy.wrap(outputPath);
  });
});
