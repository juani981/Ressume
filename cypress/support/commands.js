// ***********************************************
// Cypress Custom Commands for Ressume E2E Testing
// ***********************************************

/**
 * Ensures Google Fonts and document fonts are fully loaded before testing layout.
 */
Cypress.Commands.add('waitForFonts', () => {
  cy.document().then({ timeout: 10000 }, (doc) => {
    if (!doc || !doc.fonts || !doc.fonts.ready) return;
    return Promise.race([
      doc.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]).then(() => {
      const win = doc.defaultView;
      if (win) {
        win.dispatchEvent(new win.CustomEvent('cv-spacer-live-resize'));
      }
    });
  });
  cy.wait(150);
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
      const CustEvt = win.CustomEvent || CustomEvent;
      const Evt = win.Event || Event;
      try {
        win.dispatchEvent(new CustEvt('print-dialog-closed'));
        win.dispatchEvent(new Evt('afterprint'));
      } catch (_) {}
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

                const dispatchClose = () => {
                  const parentWin = this.ownerDocument ? (this.ownerDocument.defaultView || win) : win;
                  try {
                    const Evt = contentWin.Event || parentWin.Event || Event;
                    contentWin.dispatchEvent(new Evt('afterprint'));
                  } catch (_) {}
                  try {
                    const Evt = parentWin.Event || Event;
                    parentWin.dispatchEvent(new Evt('afterprint'));
                  } catch (_) {}
                  try {
                    const CustEvt = parentWin.CustomEvent || CustomEvent;
                    parentWin.dispatchEvent(new CustEvt('print-dialog-closed'));
                  } catch (_) {}
                  if (parentWin !== win) {
                    try {
                      win.dispatchEvent(new (win.CustomEvent || CustomEvent)('print-dialog-closed'));
                      win.dispatchEvent(new (win.Event || Event)('afterprint'));
                    } catch (_) {}
                  }
                };

                dispatchClose();
                setTimeout(dispatchClose, 50);
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
 * Uses Chrome DevTools Protocol (CDP) or Chromium headless to render the exact physical PDF
 * under @media print rules and writes it as a binary PDF to disk.
 */
Cypress.Commands.add('generatePdfWithCDP', (outputPath = 'cypress/downloads/curriculum.pdf') => {
  cy.window().then((win) => {
    let printDocHtml = win.__lastPrintDocHtml || win.__lastPrintDoc?.documentElement?.outerHTML;
    if (!printDocHtml) {
      printDocHtml = win.document?.documentElement?.outerHTML || '';
    }
    if (printDocHtml) {
      const tempHtmlPath = 'public/__clean_print_temp.html';
      const tempUrl = 'http://localhost:5173/__clean_print_temp.html';
      cy.writeFile(tempHtmlPath, printDocHtml, { timeout: 20000 });
      return cy.task('printWithChrome', { url: tempUrl, outputPath }).then((success) => {
        if (success) {
          return cy.wrap(outputPath);
        }
        return renderRunnerCDP(win, outputPath);
      });
    }

    return renderRunnerCDP(win, outputPath);
  });
});

function renderRunnerCDP(win, outputPath) {
  const topDoc = win.top?.document;
  const autIframe = topDoc?.querySelector('iframe.aut-iframe') || topDoc?.querySelector('.aut-iframe') || topDoc?.querySelector('iframe');
  const runnerContainer = topDoc?.querySelector('.iframe-container') || topDoc?.querySelector('.runner-body') || topDoc?.querySelector('.runner');
  const areaCv = win.document.getElementById('area-cv');
  const totalPages = parseInt(areaCv?.getAttribute('data-total-pages') || '1', 10);
  const targetHeightPx = Math.max(totalPages * 1123, 1123);
  const prevIframeHeight = autIframe ? autIframe.style.height : '';
  const prevIframeMinHeight = autIframe ? autIframe.style.minHeight : '';
  const prevTopHeight = topDoc?.documentElement?.style?.height || '';
  const prevTopOverflow = topDoc?.documentElement?.style?.overflow || '';
  const prevBodyHeight = topDoc?.body?.style?.height || '';
  const prevBodyOverflow = topDoc?.body?.style?.overflow || '';
  const prevContainerHeight = runnerContainer ? runnerContainer.style.height : '';

  if (autIframe) {
    autIframe.style.height = `${targetHeightPx}px`;
    autIframe.style.minHeight = `${targetHeightPx}px`;
  }
  if (runnerContainer) {
    runnerContainer.style.height = `${targetHeightPx}px`;
    runnerContainer.style.overflow = 'visible';
  }
  if (topDoc?.documentElement) {
    topDoc.documentElement.style.height = 'auto';
    topDoc.documentElement.style.overflow = 'visible';
  }
  if (topDoc?.body) {
    topDoc.body.style.height = 'auto';
    topDoc.body.style.overflow = 'visible';
  }

  // 1. Emulate print media so print.css styles apply cleanly
  cy.wrap(
    Cypress.automation('remote:debugger:protocol', {
      command: 'Emulation.setEmulatedMedia',
      params: { media: 'print' },
    }),
    { log: false }
  );

  // 2. Call Chromium's native Page.printToPDF
  return cy.wrap(
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
    // Restore styles
    if (autIframe) {
      autIframe.style.height = prevIframeHeight;
      autIframe.style.minHeight = prevIframeMinHeight;
    }
    if (runnerContainer) {
      runnerContainer.style.height = prevContainerHeight;
      runnerContainer.style.overflow = '';
    }
    if (topDoc?.documentElement) {
      topDoc.documentElement.style.height = prevTopHeight;
      topDoc.documentElement.style.overflow = prevTopOverflow;
    }
    if (topDoc?.body) {
      topDoc.body.style.height = prevBodyHeight;
      topDoc.body.style.overflow = prevBodyOverflow;
    }

    // 3. Restore normal screen media
    Cypress.automation('remote:debugger:protocol', {
      command: 'Emulation.setEmulatedMedia',
      params: { media: '' },
    });

    // 4. Save base64 PDF stream to disk
    cy.writeFile(outputPath, result.data, 'base64', { timeout: 20000 });
    return cy.wrap(outputPath);
  });
}

/**
 * Emulates print media in Chromium via Chrome DevTools Protocol.
 */
Cypress.Commands.add('emulatePrintMedia', () => {
  return cy.wrap(
    Cypress.automation('remote:debugger:protocol', {
      command: 'Emulation.setEmulatedMedia',
      params: { media: 'print' },
    })
  );
});

/**
 * Restores normal screen media in Chromium via Chrome DevTools Protocol.
 */
Cypress.Commands.add('restoreScreenMedia', () => {
  return cy.wrap(
    Cypress.automation('remote:debugger:protocol', {
      command: 'Emulation.setEmulatedMedia',
      params: { media: '' },
    })
  );
});

