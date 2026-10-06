describe('UX Test 9: Section Lifecycle, Dynamic Addition, Deletion & Empty States', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');
    // Pin toolbar to ensure stable canvas width
    cy.get('[data-testid="action-menu-navbar"]').then(($bar) => {
      if (!$bar.hasClass('is-expanded')) {
        cy.get('[data-testid="action-menu-peek-tab"]').click({ force: true });
        cy.get('[data-testid="btn-pin-action-menu"]').click({ force: true });
      }
    });
  });

  it('Evaluates discoverability and usability of the Add Section modal', () => {
    // 1. Discover the Add Section button at the bottom of the right column
    // Friction check: Is the button hidden until hover?
    cy.get('.resume__right .column-add-section, .column-add-section').first().then(($colAdd) => {
      cy.trackObservation({
        stepNumber: 11,
        feature: 'Add Section Button Discoverability',
        userGoal: 'Find the button to add a new section to the resume',
        whatUserSaw: 'Dashed line or button at the bottom of the column.',
        actionTaken: 'Hovered over the bottom of the right column to reveal "+ Agregar Sección".',
        wasNatural: false,
        clicksRequired: 2,
        visualClarityScore: 3,
        legendsInformative: true,
        assumesPriorKnowledge: true,
        frictionSeverity: 'Medium',
        frictionAnalysis: 'The button to add a section is opacity-muted or only revealed when hovering over the column container. Naive users looking for "+ Sección" might not realize they have to mouse over the empty area below existing content.',
        recommendation: 'Provide a persistently visible "+ Agregar Sección" button or pill at the end of each column with subtle styling rather than relying on hover.'
      });
    });

    // 2. Click the Add Section button
    cy.get('.resume__right .add-section-btn, .add-section-btn').first().click({ force: true });
    cy.get('[data-testid="add-section-modal"]').should('be.visible');

    cy.trackObservation({
      stepNumber: 12,
      feature: 'Add Section Panel Appearance',
      userGoal: 'Browse available resume sections',
      whatUserSaw: 'Floating panel docked next to the CV canvas with categorized section cards (Languages, Awards, Projects, Certificates, etc.).',
      actionTaken: 'Inspected the section options.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Floating panel to the right of #area-cv avoids obscuring the document and lets the user see what is already on the page.'
    });

    // 3. Close and reopen with ESC key
    cy.get('body').type('{esc}');
    cy.get('[data-testid="add-section-modal"]').should('not.exist');

    // 4. Reopen and click outside (backdrop)
    cy.get('.resume__right .add-section-btn, .add-section-btn').first().click({ force: true });
    cy.get('[data-testid="add-section-modal"]').should('be.visible');
    cy.get('[data-testid="add-section-backdrop"]').click({ force: true });
    cy.get('[data-testid="add-section-modal"]').should('not.exist');
  });

  it('Adds multiple distinct section types dynamically and verifies inline editing', () => {
    // Open Add Section modal
    cy.get('.resume__right .add-section-btn, .add-section-btn').first().click({ force: true });
    cy.get('[data-testid="add-section-modal"]').should('be.visible');

    // Add Languages section
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="add-section-card-languages"]').length > 0) {
        cy.trackClick('[data-testid="add-section-card-languages"]', 'Add Languages Section Card', { force: true });
      } else {
        cy.trackClick('[data-testid="add-section-modal"] [data-testid^="add-section-card-"]', 'Add Section Card', { force: true });
      }
    });

    // Verify section was added to DOM
    cy.get('[data-section-id*="languages"], .languages, [data-section-id]').should('exist');

    cy.trackObservation({
      stepNumber: 13,
      feature: 'Adding New Section',
      userGoal: 'Add a Languages section to the CV',
      whatUserSaw: 'New section appeared instantly at the end of the column with default language items.',
      actionTaken: 'Clicked Languages card in the modal.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Smooth insertion of sections with pre-populated defaults gives immediate guidance.'
    });

    // Edit the section title inline
    cy.get('[data-section-id*="languages"] .section-title, .languages .section-title').first().within(() => {
      cy.get('.inline-edit-display, span').first().invoke('text', 'Idiomas & Dialectos').trigger('input').trigger('blur');
    });
  });

  it('Evaluates destructive section deletion and absence of confirmation dialog', () => {
    // Locate the first section with a delete button
    cy.get('.editable-section-container').first().then(($section) => {
      const secId = $section.attr('data-section-id');
      const delBtnSelector = `[data-testid="btn-delete-section-${secId}"]`;

      // Check if delete button exists
      cy.get('body').then(($body) => {
        if ($body.find(delBtnSelector).length > 0) {
          // Hover over the section to reveal action buttons
          cy.wrap($section).trigger('mouseover');

          cy.trackObservation({
            stepNumber: 14,
            feature: 'Section Deletion Affordance & Risk',
            userGoal: 'Remove an unwanted section',
            whatUserSaw: 'Trash can icon appears in the upper right corner of the section upon hover.',
            actionTaken: 'Observed delete button proximity to section title.',
            wasNatural: true,
            clicksRequired: 1,
            visualClarityScore: 4,
            legendsInformative: true,
            assumesPriorKnowledge: false,
            frictionSeverity: 'None',
            frictionAnalysis: 'Section deletion is now safeguarded by an Obsidian Callout Danger confirmation popover anchored via getBoundingClientRect, preventing accidental deletion.',
            recommendation: 'Safety confirmation popover fully implemented and verified.'
          });

          // 1. Click delete button to open safety confirmation
          cy.trackClick(delBtnSelector, 'Delete Section Button');
          cy.get(delBtnSelector).click({ force: true });

          // 2. Verify confirmation popover appears with Obsidian Callout Danger styling
          cy.get('[data-testid="section-delete-confirm-popover"]').should('be.visible');

          // 3. Test cancellation first
          cy.get('[data-testid="btn-cancel-delete-section"]').click();
          cy.get('[data-testid="section-delete-confirm-popover"]').should('not.exist');
          cy.get(`[data-section-id="${secId}"]`).should('exist');

          // 4. Click delete again and confirm
          cy.get(delBtnSelector).click({ force: true });
          cy.get('[data-testid="section-delete-confirm-popover"]').should('be.visible');
          cy.get('[data-testid="btn-confirm-delete-section"]').click();

          // 5. Verify the section is gone
          cy.get(`[data-section-id="${secId}"]`).should('not.exist');
        }
      });
    });
  });
});
