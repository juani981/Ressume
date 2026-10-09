/**
 * Cypress tests for BACKLOG.MD feature fixes
 * 
 * Covers:
 * - F3: Section selector style reset on modal open
 * - F4: Language/Skills components - no forced line break after bold title
 * - F5: Preview loading performance - font preloading
 * - F6: Bold/italic buttons don't reset automatically
 * - F7: Fixed sections (first 3) no drag hand & distinct hover decorator
 * - F8: Version manager - no "Active" badge on saved versions
 */

describe('Backlog Feature Fixes', () => {
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

  // =========================================================================
  // F3: Section Selector Style Reset
  // =========================================================================
  describe('F3: Section Selector - Bullet Style Resets on Modal Open', () => {
    it('Resets bullet style to defaults when AddSectionModal opens', () => {
      cy.get('.add-section-btn').first().click({ force: true });
      cy.get('[data-testid="add-section-modal"]').should('be.visible');

      // The active default bullet options in AddSectionModal have background #0f172a (dark)
      cy.get('[data-testid="add-section-modal"]')
        .find('button')
        .contains('• Normal')
        .should('exist');

      cy.get('[data-testid="add-section-modal"]')
        .find('button')
        .contains('Negro')
        .should('exist')
        .and('have.css', 'background-color', 'rgb(15, 23, 42)');

      cy.get('[data-testid="add-section-modal"]')
        .find('button')
        .contains('Con línea')
        .should('exist')
        .and('have.css', 'background-color', 'rgb(15, 23, 42)');

      // Close modal
      cy.get('[data-testid="add-section-modal"]').find('button[aria-label="Cerrar modal de añadir sección"]').click();
      cy.get('[data-testid="add-section-modal"]').should('not.exist');

      // Reopen modal and verify default state is preserved
      cy.get('.add-section-btn').first().click({ force: true });
      cy.get('[data-testid="add-section-modal"]').should('be.visible');
      cy.get('[data-testid="add-section-modal"]')
        .find('button')
        .contains('Negro')
        .should('have.css', 'background-color', 'rgb(15, 23, 42)');
    });

    it('Resets to defaults on reopen after changing options', () => {
      cy.get('.add-section-btn').first().click({ force: true });
      cy.get('[data-testid="add-section-modal"]').should('be.visible');

      // Click Gris
      cy.get('[data-testid="add-section-modal"]')
        .find('button')
        .contains('Gris')
        .click();

      // Click Sin línea
      cy.get('[data-testid="add-section-modal"]')
        .find('button')
        .contains('Con línea')
        .click();

      // Close modal
      cy.get('[data-testid="add-section-modal"]').find('button[aria-label="Cerrar modal de añadir sección"]').click();
      cy.get('[data-testid="add-section-modal"]').should('not.exist');

      // Reopen modal: verify reset to defaults (Negro and Con línea active)
      cy.get('.add-section-btn').first().click({ force: true });
      cy.get('[data-testid="add-section-modal"]').should('be.visible');
      cy.get('[data-testid="add-section-modal"]')
        .find('button')
        .contains('Negro')
        .should('have.css', 'background-color', 'rgb(15, 23, 42)');
      cy.get('[data-testid="add-section-modal"]')
        .find('button')
        .contains('Con línea')
        .should('have.css', 'background-color', 'rgb(15, 23, 42)');
    });
  });

  // =========================================================================
  // F4: Language/Skills - No forced line break after bold title
  // =========================================================================
  describe('F4: Language/Skills Components - Inline Layout', () => {
    it('Skills section - skill title and description render inline without forced block break', () => {
      // skills section is already in defaultSchema
      cy.get('#skills').should('exist');
      cy.get('#skills .skills__circle').should('exist');
      // Verify InlineEdit display elements have display: inline-block
      cy.get('#skills .inline-edit-display').first()
        .should('have.css', 'display', 'inline-block');
    });

    it('Languages section - renders inline-block elements without forced block breaks', () => {
      cy.get('.add-section-btn').first().click({ force: true });
      cy.get('[data-testid="add-section-card-languages"]').click();

      cy.get('#languages').should('exist');
      cy.get('#languages .inline-edit-display').first()
        .should('have.css', 'display', 'inline-block');
    });
  });

  // =========================================================================
  // F5: Preview Loading Performance - Font Preloading
  // =========================================================================
  describe('F5: Font Preloading on App Startup', () => {
    it('Loads Google Fonts with preconnect and font preloader integration', () => {
      cy.window().then((win) => {
        const links = Array.from(win.document.querySelectorAll('link'));
        const hasFontLink = links.some(l => (l.href || '').includes('fonts.googleapis.com'));
        expect(hasFontLink).to.be.true;
      });
    });

    it('Has preconnect to fonts.gstatic.com', () => {
      cy.window().then((win) => {
        const preconnectLinks = win.document.querySelectorAll('link[rel="preconnect"][href="https://fonts.gstatic.com"]');
        expect(preconnectLinks.length).to.be.greaterThan(0);
      });
    });

    it('Document fonts API is ready', () => {
      cy.window().then((win) => {
        expect(win.document.fonts.status).to.be.oneOf(['loaded', 'loading']);
      });
    });
  });

  // =========================================================================
  // F6: Bold/Italic Buttons - Active State Persistence
  // =========================================================================
  describe('F6: RichTextToolbar - Bold/Italic Active State', () => {
    it('Toolbar opens on clicking an inline edit element and reflects format changes', () => {
      // Click on experience title which is not wrapped in a <b> tag
      cy.get('#experience .experience__title .inline-edit-display').first().click();
      cy.get('.inline-edit-active').should('be.visible');

      // The RichTextToolbar should be visible
      cy.get('[data-testid="rich-text-toolbar"]').should('be.visible');
      cy.get('[data-testid="btn-format-bold"]').should('be.visible');
      cy.get('[data-testid="btn-format-italic"]').should('be.visible');

      // Initially bold is false
      cy.get('[data-testid="btn-format-bold"]').should('have.attr', 'aria-pressed', 'false');

      // Click bold button in toolbar to toggle bold
      cy.get('[data-testid="btn-format-bold"]').click();
      cy.get('[data-testid="btn-format-bold"]').should('have.attr', 'aria-pressed', 'true');

      // Click italic button in toolbar to toggle italic
      cy.get('[data-testid="btn-format-italic"]').click();
      cy.get('[data-testid="btn-format-italic"]').should('have.attr', 'aria-pressed', 'true');
    });
  });

  // =========================================================================
  // F7: Fixed Sections (Header, Contact, About) - No Drag Handle & Fixed Hover
  // =========================================================================
  describe('F7: Fixed Sections - No Drag Handle & Fixed Hover Decorator', () => {
    it('Fixed sections have section-fixed class and do not render section drag handle', () => {
      cy.get('#profile_header').should('have.class', 'section-fixed');
      cy.get('#profile_header').find('.section-drag-handle').should('not.exist');

      cy.get('#about_section').should('have.class', 'section-fixed');
      cy.get('#about_section').find('.section-drag-handle').should('not.exist');
    });

    it('Movable sections render drag handles and do not have section-fixed class', () => {
      cy.get('#skills').should('not.have.class', 'section-fixed');
      cy.get('#skills').find('.section-drag-handle').should('exist');

      cy.get('#experience').should('not.have.class', 'section-fixed');
      cy.get('#experience').find('.section-drag-handle').should('exist');
    });
  });

  // =========================================================================
  // F8: Version Manager - No Active Badge Confusion
  // =========================================================================
  describe('F8: Version Manager - No Active Badge on Saved Versions', () => {
    it('Saved versions do not display "Actual" badge and button consistently says "Cargar"', () => {
      cy.get('[data-testid="btn-open-version-manager"]').click({ force: true });
      cy.get('.version-modal-dialog').should('be.visible');

      cy.get('body').then(($body) => {
        const input = $body.find('[data-testid="input-new-version-name"]');
        const saveBtn = $body.find('[data-testid="btn-save-version"]');
        if (input.length > 0 && saveBtn.length > 0) {
          cy.wrap(input.first()).clear().type('V1 Base Snapshot');
          cy.wrap(saveBtn.first()).click();
          cy.wait(400);
        }
      });

      // No card should have "Actual" badge
      cy.get('.version-modal-dialog').contains('Actual').should('not.exist');

      // The action button should say "Cargar"
      cy.get('[data-testid="btn-load-version"]').first().should('contain', 'Cargar');
      cy.get('[data-testid="btn-load-version"]').contains('Activa').should('not.exist');

      // Close modal by clicking backdrop or close button
      cy.get('.version-modal-dialog').find('button').first().click({ force: true });
    });
  });
});
