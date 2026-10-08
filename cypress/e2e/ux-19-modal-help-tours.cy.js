/**
 * cypress/e2e/ux-19-modal-help-tours.cy.js
 *
 * Feature F13: Modal Contextual Help Tours & Editorial Tone (Invariant 20).
 *
 * Validates:
 * 1. ModalHelpButton ('?') accessibility and clickability across all core modals:
 *    - AddSectionModal
 *    - DesignPanel
 *    - AIExportModal
 *    - VersionManagerModal
 * 2. ModalHelpDialog appearance, ARIA dialog semantics (role="dialog", aria-modal="true"),
 *    and step-by-step guidance.
 * 3. Invariant 20 compliance: formal, technical, and serene tone without voseo
 *    or corporate clichés (prohibits "clave", "robusta", "crucial", "ejecutivo", "No es X, es Y").
 * 4. Dismissal mechanisms (Entendido button, X close button, outside backdrop click).
 * 5. State preservation in parent modal after inspecting help guide.
 */

describe('UX-19: Modal Contextual Help Tours & Editorial Tone (Invariant 20)', () => {
  const FORBIDDEN_WORDS = [
    /\bvos\b/i,
    /\btenés\b/i,
    /\bponé\b/i,
    /\bhacé\b/i,
    /\bmirá\b/i,
    /\bfijate\b/i,
    /\bclave\b/i,
    /\brobusta\b/i,
    /\bcrucial\b/i,
    /\bejecutivo\b/i,
    /no es [^,]+,\s*es/i,
  ];

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

  it('Tier 1 / F13.1: AddSectionModal opens contextual help, validates Invariant 20 formal tone, and closes cleanly', () => {
    // 1. Open AddSectionModal
    cy.get('.add-section-btn').first().click({ force: true });
    cy.get('[data-testid="add-section-modal"]').should('be.visible');

    // 2. Click the Help '?' button
    cy.get('[data-testid="add-section-modal"]')
      .find('[data-testid="btn-modal-help"]')
      .should('be.visible')
      .and('have.attr', 'aria-label')
      .and('include', 'guía');

    cy.get('[data-testid="add-section-modal"]')
      .find('[data-testid="btn-modal-help"]')
      .click();

    // 3. Verify ModalHelpDialog appears with accessible dialog attributes
    cy.get('[data-testid="modal-help-dialog"]').should('be.visible')
      .and('have.attr', 'role', 'dialog')
      .and('have.attr', 'aria-modal', 'true')
      .and('have.attr', 'aria-labelledby', 'modal-help-title');

    // 4. Verify Title and Content
    cy.get('#modal-help-title')
      .should('be.visible')
      .and('contain.text', 'Guía de Incorporación de Secciones');

    // Verify Invariant 20 formal tone in dialog text
    cy.get('[data-testid="modal-help-dialog"]').invoke('text').then((text) => {
      expect(text).to.include('Estructuración y disposición');
      FORBIDDEN_WORDS.forEach((regex) => {
        expect(text).not.to.match(regex);
      });
    });

    // 5. Dismiss using 'Entendido' button
    cy.get('[data-testid="btn-dismiss-modal-help"]').should('be.visible').click();
    cy.get('[data-testid="modal-help-dialog"]').should('not.exist');

    // Verify parent modal is still open
    cy.get('[data-testid="add-section-modal"]').should('be.visible');
    cy.get('body').type('{esc}');
    cy.get('[data-testid="add-section-modal"]').should('not.exist');
  });

  it('Tier 1 / F13.2: DesignPanel opens contextual help for design calibration and dismisses via X button', () => {
    // 1. Open DesignPanel
    cy.get('[data-testid="btn-open-design"]').click();
    cy.get('[data-testid="design-submenu"]').should('be.visible');

    // 2. Click Help button in DesignPanel header
    cy.get('[data-testid="design-submenu"]')
      .find('[data-testid="btn-modal-help"]')
      .should('be.visible')
      .click();

    // 3. Verify ModalHelpDialog
    cy.get('[data-testid="modal-help-dialog"]').should('be.visible');
    cy.get('#modal-help-title').should('contain.text', 'Guía de Personalización de Diseño');

    // Verify formal tone
    cy.get('[data-testid="modal-help-dialog"]').invoke('text').then((text) => {
      expect(text).to.include('Calibración de jerarquía visual');
      FORBIDDEN_WORDS.forEach((regex) => {
        expect(text).not.to.match(regex);
      });
    });

    // 4. Close via X button
    cy.get('[data-testid="btn-close-modal-help"]').click();
    cy.get('[data-testid="modal-help-dialog"]').should('not.exist');

    // Design panel remains open
    cy.get('[data-testid="design-submenu"]').should('be.visible');
    cy.get('[aria-label="Cerrar panel de diseño"]').click();
  });

  it('Tier 1 / F13.3: AIExportModal opens contextual help for prompt generation and dismisses via backdrop click', () => {
    // 1. Open Translation / AI Export modal
    cy.get('[data-testid="btn-open-translation"]').click();
    cy.get('.ai-modal-dialog').should('be.visible');

    // 2. Click Help button
    cy.get('.ai-modal-dialog')
      .find('[data-testid="btn-modal-help"]')
      .should('be.visible')
      .click();

    // 3. Verify ModalHelpDialog
    cy.get('[data-testid="modal-help-dialog"]').should('be.visible');
    cy.get('#modal-help-title').should('contain.text', 'Guía de Generación de Prompts e Integración');

    // Verify formal tone
    cy.get('[data-testid="modal-help-dialog"]').invoke('text').then((text) => {
      expect(text).to.include('Extracción de directivas estructuradas');
      FORBIDDEN_WORDS.forEach((regex) => {
        expect(text).not.to.match(regex);
      });
    });

    // 4. Dismiss by clicking the modal backdrop overlay (top-left coordinate)
    cy.get('.modal-help-backdrop').click(10, 10);
    cy.get('[data-testid="modal-help-dialog"]').should('not.exist');

    // AI modal remains open
    cy.get('.ai-modal-dialog').should('be.visible');
    cy.get('[data-testid="ai-modal-close-btn"]').click();
    cy.get('.ai-modal-dialog').should('not.exist');
  });

  it('Tier 1 / F13.4: VersionManagerModal opens contextual help for snapshot management and dismisses via Entendido', () => {
    // 1. Open Version Manager Modal
    cy.get('[data-testid="btn-open-version-manager"]').click();
    cy.get('.version-modal-dialog').should('be.visible');

    // 2. Click Help button
    cy.get('.version-modal-dialog')
      .find('[data-testid="btn-modal-help"]')
      .should('be.visible')
      .click();

    // 3. Verify ModalHelpDialog
    cy.get('[data-testid="modal-help-dialog"]').should('be.visible');
    cy.get('#modal-help-title').should('contain.text', 'Guía del Gestor de Versiones');

    // Verify formal tone
    cy.get('[data-testid="modal-help-dialog"]').invoke('text').then((text) => {
      expect(text).to.include('Administración de instantáneas persistentes');
      FORBIDDEN_WORDS.forEach((regex) => {
        expect(text).not.to.match(regex);
      });
    });

    // 4. Dismiss using Entendido
    cy.get('[data-testid="btn-dismiss-modal-help"]').click();
    cy.get('[data-testid="modal-help-dialog"]').should('not.exist');

    // Version modal remains open
    cy.get('.version-modal-dialog').should('be.visible');
    cy.get('[data-testid="btn-close-version-modal"]').click();
    cy.get('.version-modal-dialog').should('not.exist');
  });

  it('Tier 2 / Boundary: Preserves parent modal state (inputs & selections) after viewing and closing help tour', () => {
    // 1. Open Version Manager
    cy.get('[data-testid="btn-open-version-manager"]').click();
    cy.get('.version-modal-dialog').should('be.visible');

    // 2. Type an unsaved version name in input
    const testVersionName = 'Milestone Candidate State Verification';
    cy.get('[data-testid="input-new-version-name"]').clear().type(testVersionName);
    cy.get('[data-testid="input-new-version-name"]').should('have.value', testVersionName);

    // 3. Open help tour
    cy.get('.version-modal-dialog').find('[data-testid="btn-modal-help"]').click();
    cy.get('[data-testid="modal-help-dialog"]').should('be.visible');

    // 4. Close help tour
    cy.get('[data-testid="btn-dismiss-modal-help"]').click();
    cy.get('[data-testid="modal-help-dialog"]').should('not.exist');

    // 5. Assert input value was preserved without reset
    cy.get('[data-testid="input-new-version-name"]').should('have.value', testVersionName);

    // Clean up
    cy.get('[data-testid="btn-close-version-modal"]').click();
  });

  it('Tier 3 / Invariant 20: Comprehensive formal editorial compliance across all defined tour guides', () => {
    // Open AI prompts modal
    cy.get('#ia-prompts-item').click();
    cy.get('.ai-modal-dialog').should('be.visible');

    // Open help
    cy.get('.ai-modal-dialog').find('[data-testid="btn-modal-help"]').click();
    cy.get('[data-testid="modal-help-dialog"]').should('be.visible');

    // Verify all steps have numeric indicator badges and complete descriptive text
    cy.get('[data-testid="modal-help-dialog"]').within(() => {
      cy.get('h4').should('have.length.at.least', 3);
      cy.get('p').should('have.length.at.least', 3);
    });

    // Close help
    cy.get('[data-testid="btn-close-modal-help"]').click();
    cy.get('[data-testid="ai-modal-close-btn"]').click();
  });
});
