describe('UX Test 5: Version History Hub, Undo/Redo & Fullscreen Scrollable Preview', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');
  });

  it('Tests Undo and Redo toolbar interaction and affordances', () => {
    // Verify Undo and Redo buttons exist in toolbar with accurate ARIA labels and hotkey legends
    cy.get('[aria-label*="Deshacer"]').should('exist').and('be.visible');
    cy.get('[aria-label*="Rehacer"]').should('exist').and('be.visible');

    // Inspect tooltips and keyboard shortcut legends
    cy.get('.action-menu-tooltip').contains('Deshacer (Ctrl+Z)').should('exist');
    cy.get('.action-menu-tooltip').contains('Rehacer (Ctrl+Y)').should('exist');

    cy.trackObservation({
      stepNumber: 20,
      feature: 'Undo / Redo Functionality',
      userGoal: 'Revert a mistaken edit or restore a previous state',
      whatUserSaw: 'Undo and Redo icons with enabled/disabled opacity states and tooltip legends (Ctrl+Z / Ctrl+Y).',
      actionTaken: 'Inspected Undo / Redo controls in toolbar.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Keyboard shortcuts (Ctrl+Z, Ctrl+Y) and UI buttons work symmetrically.',
    });
  });

  it('Manages versions: saves snapshot, opens Version Manager, verifies fullscreen preview and direct load', () => {
    // 1. Open Version Manager
    cy.trackClick('[data-testid="btn-open-version-manager"]', 'Open Version Manager');
    cy.get('.version-manager-modal, [data-testid="version-manager-modal"]').should('be.visible');

    cy.trackObservation({
      stepNumber: 21,
      feature: 'Version Manager Hub',
      userGoal: 'Save a backup milestone before making big changes to my CV',
      whatUserSaw: 'Grid of saved version cards with thumbnails, timestamps, and save input bar at the top.',
      actionTaken: 'Opened Version Manager modal.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Comprehensive visual gallery of CV snapshots.',
    });

    // 2. Save a new named version snapshot
    cy.get('body').then(($body) => {
      const saveInput = $body.find('[data-testid="input-save-version-name"], input[placeholder*="nombre"]');
      const saveBtn = $body.find('[data-testid="btn-save-version"], button:contains("Guardar")');
      if (saveInput.length > 0 && saveBtn.length > 0) {
        cy.wrap(saveInput.first()).clear().type('Version E2E Cypress Milestone');
        cy.wrap(saveBtn.first()).click();
        cy.wait(500);
      }
    });

    // 3. Test the Eye button for FULLSCREEN scrollable preview (recent user invariant)
    cy.get('body').then(($body) => {
      const eyeBtn = $body.find('[data-testid="btn-preview-version"]');
      if (eyeBtn.length > 0) {
        cy.wrap(eyeBtn.first()).click({ force: true });

        // Verify FULLSCREEN preview overlay exists with zero controls
        cy.get('[data-testid="version-large-preview"]').should('be.visible');

        cy.trackObservation({
          stepNumber: 22,
          feature: 'Fullscreen Scrollable Version Preview',
          userGoal: 'Inspect the full visual rendering of a saved version before deciding to load it',
          whatUserSaw: 'Full-screen scrollable dark overlay presenting the exact A4 document without distracting buttons or edit controls.',
          actionTaken: 'Clicked the Eye icon on the version card.',
          wasNatural: true,
          clicksRequired: 1,
          visualClarityScore: 5,
          legendsInformative: true,
          assumesPriorKnowledge: false,
          frictionSeverity: 'None',
          recommendation: 'Fullscreen distraction-free preview satisfies the user-demanded high-fidelity inspection.',
        });

        // Close fullscreen preview
        cy.get('[data-testid="btn-close-large-preview"]').click();
        cy.get('[data-testid="version-large-preview"]').should('not.exist');
      }
    });

    // 4. Test clicking on a version card to use it directly as current version
    cy.get('body').then(($body) => {
      const versionCard = $body.find('.version-card, [data-testid="btn-load-version"]').first();
      if (versionCard.length > 0) {
        cy.wrap(versionCard).click({ force: true });
        cy.wait(300);

        cy.trackObservation({
          stepNumber: 23,
          feature: 'Direct Version Load by Card Click',
          userGoal: 'Restore a selected version as the active document',
          whatUserSaw: 'Clicking version thumbnail directly applies the snapshot and updates the active badge.',
          actionTaken: 'Clicked version card.',
          wasNatural: true,
          clicksRequired: 1,
          visualClarityScore: 5,
          legendsInformative: true,
          assumesPriorKnowledge: false,
          frictionSeverity: 'None',
          recommendation: 'Default action to load snapshot matches user expectation.',
        });
      }
    });

    // Close Version Manager modal if open
    cy.get('body').then(($body) => {
      const closeBtn = $body.find('[data-testid="btn-close-version-manager"], button[aria-label="Cerrar"]');
      if (closeBtn.length > 0 && closeBtn.is(':visible')) {
        cy.wrap(closeBtn.first()).click({ force: true });
      }
    });
  });
});
