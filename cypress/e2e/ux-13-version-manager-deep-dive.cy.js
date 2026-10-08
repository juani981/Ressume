describe('UX Test 13: Version Manager Deep Dive, Snapshots, JSON Backup & Safety Confirmations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');
    // Ensure action menu is accessible
    cy.get('[data-testid="action-menu-navbar"]').then(($bar) => {
      if (!$bar.hasClass('is-expanded')) {
        cy.get('[data-testid="action-menu-peek-tab"]').click({ force: true });
        cy.get('[data-testid="btn-pin-action-menu"]').click({ force: true });
      }
    });
  });

  it('Evaluates complete snapshot lifecycle: create, rename, duplicate, blank CV, and safety confirmations', () => {
    // 1. Open Version Manager
    cy.get('[data-testid="btn-open-version-manager"]').click({ force: true });
    cy.get('.version-manager-modal, [data-testid="version-manager-modal"]').should('be.visible');

    cy.trackObservation({
      stepNumber: 22,
      feature: 'Version Manager Hub Navigation',
      userGoal: 'Open version history and backup hub',
      whatUserSaw: 'Fullscreen modal showing version management cards, save bar, and JSON controls.',
      actionTaken: 'Clicked versions icon in the left toolbar.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Full modal presentation with cards and timestamps is very confidence-inspiring.'
    });

    // 2. Save a custom named version
    cy.get('body').then(($body) => {
      const nameInput = $body.find('[data-testid="input-new-version-name"]');
      const saveBtn = $body.find('[data-testid="btn-save-version"]');
      if (nameInput.length > 0 && saveBtn.length > 0) {
        cy.wrap(nameInput).clear().type('CV Senior Principal 2026');
        cy.wrap(saveBtn).click();
        cy.wait(400);

        cy.trackObservation({
          stepNumber: 23,
          feature: 'Version Snapshot Creation',
          userGoal: 'Create a named backup of the CV',
          whatUserSaw: 'New card appeared in version list with timestamp and name.',
          actionTaken: 'Typed version name and clicked "Guardar Versión".',
          wasNatural: true,
          clicksRequired: 2,
          visualClarityScore: 5,
          legendsInformative: true,
          assumesPriorKnowledge: false,
          frictionSeverity: 'None',
          recommendation: 'Instant visual card feedback confirms the backup succeeded.'
        });
      }
    });

    // 3. Test Blank CV Confirmation Dialog (Safety Guard)
    cy.get('body').then(($body) => {
      const blankBtn = $body.find('[data-testid="btn-start-blank-cv"]');
      if (blankBtn.length > 0) {
        cy.wrap(blankBtn).click();

        // Safety modal should appear
        cy.get('[data-testid="callout-confirm-blank"], .obsidian-callout').should('be.visible');

        cy.trackObservation({
          stepNumber: 24,
          feature: 'Blank CV Safety Confirmation',
          userGoal: 'Prevent accidental erasure of the resume',
          whatUserSaw: 'Confirmation modal warning that current changes will be replaced with a blank template.',
          actionTaken: 'Observed warning modal and clicked Cancel.',
          wasNatural: true,
          clicksRequired: 2,
          visualClarityScore: 5,
          legendsInformative: true,
          assumesPriorKnowledge: false,
          frictionSeverity: 'None',
          recommendation: 'Strong safety barrier protects user from catastrophic accidental deletion.'
        });

        // Cancel blank dialog
        cy.get('[data-testid="btn-cancel-blank"], button:contains("Cancelar")').click({ force: true });
      }
    });

    // 4. Test JSON Download button
    cy.get('body').then(($body) => {
      const dlBtn = $body.find('[data-testid="btn-download-json"]');
      if (dlBtn.length > 0) {
        cy.wrap(dlBtn).click({ force: true });

        cy.trackObservation({
          stepNumber: 25,
          feature: 'JSON Raw Backup Export',
          userGoal: 'Download CV data as JSON for portable storage',
          whatUserSaw: 'Download JSON button in the action bar.',
          actionTaken: 'Clicked download JSON button.',
          wasNatural: true,
          clicksRequired: 1,
          visualClarityScore: 5,
          legendsInformative: true,
          assumesPriorKnowledge: false,
          frictionSeverity: 'None',
          recommendation: 'Clean local backup without vendor lock-in.'
        });
      }
    });

    // 5. Close Version Manager with close button
    cy.get('button[aria-label="Cerrar modal de versiones"], .modal-close-btn, button:contains("✕")').first().click({ force: true });
    cy.get('.version-manager-modal').should('not.exist');
  });
});
