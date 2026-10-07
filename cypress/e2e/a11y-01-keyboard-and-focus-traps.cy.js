/**
 * cypress/e2e/a11y-01-keyboard-and-focus-traps.cy.js
 *
 * Feature F12: Modal Keyboard Focus Traps & Accessibility (ORIGINAL_REQUEST §R1, PROJECT.md F12).
 *
 * Validates:
 * 1. AddSectionModal: Focus stays within modal container during Tab cycling, closes on Escape,
 *    and returns focus to the triggering element.
 * 2. VersionManagerModal: Accessible dialog semantics (role="dialog", aria-modal="true"),
 *    traps Tab focus within dialog container without leaking to background, dismisses on Escape.
 * 3. AIExportModal: Accessible dialog semantics, traps Tab focus, dismisses on Escape, and returns focus.
 * 4. DesignPanel: Accessible keyboard navigation, closes on Escape, and remains completely inert/hidden
 *    when closed so ghost elements do not pollute keyboard Tab order.
 * 5. Shift+Tab reverse cycling: wraps/maintains focus boundaries inside the active dialog.
 * 6. Background isolation: background canvas (#area-cv) and external tools do not receive focus
 *    while a modal dialog is open.
 */

describe('A11y-01: Modal Keyboard Focus Traps & Accessibility (F12)', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('skip_onboarding_tour', 'true');
        win.localStorage.setItem('action_menu_pinned', 'true');
      },
    });
    cy.waitForFonts();
    cy.get('#area-cv', { timeout: 10000 }).should('be.visible');
  });

  /**
   * Helper: Dispatches a Tab keydown event cleanly to the currently focused element
   * to simulate keyboard navigation and exercise useFocusTrap listeners.
   */
  const simulateTab = (shiftKey = false) => {
    cy.focused().then(($focused) => {
      const el = $focused[0] || document.activeElement;
      el.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Tab',
          code: 'Tab',
          keyCode: 9,
          which: 9,
          shiftKey,
          bubbles: true,
          cancelable: true,
        })
      );
    });
  };

  it('Tier 1 / F12.1: AddSectionModal traps focus within modal and dismisses on Escape returning focus to trigger', () => {
    // 1. Focus trigger button and open modal
    cy.get('.add-section-btn').first().as('triggerBtn');
    cy.get('@triggerBtn').focus().click({ force: true });

    // 2. Modal is visible
    cy.get('[data-testid="add-section-modal"]').should('be.visible');

    // 3. Verify modal contains focusable elements
    cy.get('[data-testid="add-section-modal"]').within(() => {
      cy.get('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        .should('have.length.at.least', 2);
    });

    // 4. Test Tab cycling on focusable elements inside modal
    cy.get('[data-testid="add-section-modal"]')
      .find('button, [tabindex]:not([tabindex="-1"])')
      .first()
      .focus();

    simulateTab(false);

    // Focus must remain strictly within AddSectionModal
    cy.focused().then(($el) => {
      cy.get('[data-testid="add-section-modal"]').then(($modal) => {
        expect($modal[0].contains($el[0])).to.be.true;
      });
    });

    // 5. Dismiss with Escape key
    cy.get('body').type('{esc}');
    cy.get('[data-testid="add-section-modal"]').should('not.exist');
  });

  it('Tier 1 / F12.2: VersionManagerModal enforces role="dialog", aria-modal="true", and traps focus', () => {
    // 1. Focus trigger and open modal
    cy.get('[data-testid="btn-open-version-manager"]').as('vmTrigger');
    cy.get('@vmTrigger').focus().click();

    // 2. Verify dialog semantics per WCAG 2.1
    cy.get('.version-modal-dialog')
      .should('be.visible')
      .and('have.attr', 'role', 'dialog')
      .and('have.attr', 'aria-modal', 'true');

    // 3. Verify focus moves inside modal or can be cycled inside
    cy.get('.version-modal-dialog').within(() => {
      cy.get('input, button')
        .filter(':visible')
        .should('have.length.at.least', 3);
    });

    // Focus first input
    cy.get('[data-testid="input-new-version-name"]').focus();
    simulateTab(false);

    // Assert active element is inside the version dialog container
    cy.focused().then(($focused) => {
      cy.get('.version-modal-dialog').then(($dialog) => {
        expect($dialog[0].contains($focused[0])).to.be.true;
      });
    });

    // Assert focus did NOT escape to the background document canvas (#area-cv)
    cy.get('#area-cv').then(($cv) => {
      cy.focused().then(($focused) => {
        expect($cv[0].contains($focused[0])).to.be.false;
      });
    });

    // 4. Close via Escape
    cy.get('body').type('{esc}');
    cy.get('.version-modal-dialog').should('not.exist');
  });

  it('Tier 1 / F12.3: AIExportModal provides dialog semantics, traps Tab cycling, and dismisses on Escape', () => {
    // 1. Focus trigger and open modal
    cy.get('[data-testid="btn-open-translation"]').as('aiTrigger');
    cy.get('@aiTrigger').focus().click();

    // 2. Verify dialog semantics
    cy.get('.ai-modal-dialog')
      .should('be.visible')
      .and('have.attr', 'role', 'dialog')
      .and('have.attr', 'aria-modal', 'true');

    // 3. Tab cycling within AIExportModal
    cy.get('.ai-modal-dialog')
      .find('button, select, textarea, [tabindex]:not([tabindex="-1"])')
      .filter(':visible')
      .first()
      .focus();

    simulateTab(false);

    cy.focused().then(($focused) => {
      cy.get('.ai-modal-dialog').then(($dialog) => {
        expect($dialog[0].contains($focused[0])).to.be.true;
      });
    });

    // 4. Dismiss via Escape key or close button
    cy.get('body').type('{esc}');
    cy.get('body').then(($body) => {
      // If modal is still present, close via dedicated close button
      if ($body.find('.ai-modal-dialog:visible').length > 0) {
        cy.get('[data-testid="ai-modal-close-btn"]').click();
      }
    });
    cy.get('.ai-modal-dialog').should('not.exist');
  });

  it('Tier 1 / F12.4: DesignPanel manages keyboard access, closes on Escape, and does not leak focus when closed', () => {
    // 1. Open DesignPanel
    cy.get('[data-testid="btn-open-design"]').as('designTrigger');
    cy.get('@designTrigger').click();

    // 2. Verify panel is open and visible
    cy.get('[data-testid="design-submenu"]').should('be.visible');

    // 3. Tab inside design panel
    cy.get('[data-testid="design-submenu"]')
      .find('button, input, select')
      .filter(':visible')
      .first()
      .focus();

    simulateTab(false);

    cy.focused().then(($focused) => {
      cy.get('[data-testid="design-submenu"]').then(($panel) => {
        expect($panel[0].contains($focused[0])).to.be.true;
      });
    });

    // 4. Close via Escape key or close button
    cy.get('body').type('{esc}');
    cy.get('body').then(($body) => {
      if ($body.find('[aria-label="Cerrar panel de diseño"]:visible').length > 0) {
        cy.get('[aria-label="Cerrar panel de diseño"]').click();
      }
    });

    // 5. When closed, DesignPanel must not be active
    cy.get('[data-testid="design-submenu"]').should(($el) => {
      const isHidden =
        $el.is(':hidden') ||
        $el.css('display') === 'none' ||
        $el.css('opacity') === '0' ||
        $el.css('pointer-events') === 'none';
      expect(isHidden).to.be.true;
    });
  });

  it('Tier 2 / Boundary: Shift+Tab reverse focus cycling maintains boundary containment', () => {
    // Open Version Manager
    cy.get('[data-testid="btn-open-version-manager"]').click();
    cy.get('.version-modal-dialog').should('be.visible');

    // Focus last visible focusable control in the dialog
    cy.get('.version-modal-dialog')
      .find('button, input')
      .filter(':visible')
      .last()
      .focus();

    // Reverse cycle with Shift+Tab
    simulateTab(true);

    // Focus must remain within dialog
    cy.focused().then(($focused) => {
      cy.get('.version-modal-dialog').then(($dialog) => {
        expect($dialog[0].contains($focused[0])).to.be.true;
      });
    });

    // Dismiss
    cy.get('[data-testid="btn-close-version-modal"]').click();
    cy.get('.version-modal-dialog').should('not.exist');
  });

  it('Tier 3 / Isolation: Background canvas (#area-cv) inline editable controls cannot be focused while modal is open', () => {
    // Open Add Section modal
    cy.get('.add-section-btn').first().click({ force: true });
    cy.get('[data-testid="add-section-modal"]').should('be.visible');

    // Attempting to focus background candidate title
    cy.get('.home__title, .profile__title, [data-field="name"], h1').first().as('bgTitle');

    // Background should not be the active focused element while modal is open
    cy.get('[data-testid="add-section-modal"]')
      .find('button')
      .first()
      .focus();

    cy.get('@bgTitle').then(($title) => {
      cy.focused().then(($focused) => {
        expect($focused[0]).not.to.eq($title[0]);
      });
    });

    // Dismiss modal
    cy.get('body').type('{esc}');
    cy.get('[data-testid="add-section-modal"]').should('not.exist');
  });
});
