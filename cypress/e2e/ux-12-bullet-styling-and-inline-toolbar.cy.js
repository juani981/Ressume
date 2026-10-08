describe('UX Test 12: Bullet Point Customization, Add/Delete Ergonomics & Spacing', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');
  });

  it('Evaluates bullet style popover discoverability and customization', () => {
    // 1. Locate a section supporting bullet customization (e.g., Experience or Education)
    cy.get('button[data-testid^="btn-bullet-style-"]').first().then(($btn) => {
      cy.trackObservation({
        stepNumber: 19,
        feature: 'Section Bullet Customizer Discoverability',
        userGoal: 'Customize the visual style of section bullets and title dots',
        whatUserSaw: 'Three horizontal dots icon (MoreHorizontal) in the section header action buttons on hover.',
        actionTaken: 'Hovered over the section and clicked the three dots button.',
        wasNatural: false,
        clicksRequired: 2,
        visualClarityScore: 3,
        legendsInformative: true,
        assumesPriorKnowledge: true,
        frictionSeverity: 'Low',
        frictionAnalysis: 'The three dots icon is ambiguous: users might expect it to be a general menu (Copy, Move, Settings) rather than specifically a bullet/circle style configurator.',
        recommendation: 'Change the icon to a bullet-list or palette icon, or provide a tooltip: "Personalizar viñetas".'
      });

      cy.wrap($btn).click({ force: true });
    });

    // 2. Verify SectionBulletStylePopover opens
    cy.get('.section-bullet-style-popover, [data-testid="bullet-style-popover"]').should('exist');

    // 3. Close popover with ESC
    cy.get('body').type('{esc}');
  });

  it('Evaluates adding, editing, and deleting individual bullet points within a job entry', () => {
    // 1. Find "+ Agregar nueva viñeta" button
    cy.get('.add-bullet-btn').first().then(($addBtn) => {
      cy.trackObservation({
        stepNumber: 20,
        feature: 'Add Bullet Point Button Affordance',
        userGoal: 'Add another bullet accomplishment to my current job',
        whatUserSaw: 'Inline button "+ Agregar nueva viñeta" below current job bullets.',
        actionTaken: 'Clicked the add bullet button.',
        wasNatural: true,
        clicksRequired: 1,
        visualClarityScore: 5,
        legendsInformative: true,
        assumesPriorKnowledge: false,
        frictionSeverity: 'None',
        recommendation: 'The explicit text "+ Agregar nueva viñeta" is immediately clear to naive users.'
      });

      cy.wrap($addBtn).click({ force: true });
    });

    // 2. Verify new bullet item was appended and edit it inline
    cy.get('.bullet-item-row').last().find('[data-editor-input="true"], .inline-edit-display, .simple-list-item-text, span:not(.simple-list-circle)').first().invoke('text', 'Lideró migración a Kubernetes reduciendo latencia en un 35%.').trigger('input', { force: true }).trigger('blur', { force: true });

    // 3. Delete a bullet point using the minus button
    cy.get('.bullet-item-row').last().then(($bulletRow) => {
      cy.wrap($bulletRow).find('.bullet-del-btn').click({ force: true });
    });

    cy.trackObservation({
      stepNumber: 21,
      feature: 'Bullet Deletion Feedback',
      userGoal: 'Delete an accidental or obsolete bullet point',
      whatUserSaw: 'Minus circle button on the right edge of the bullet row.',
      actionTaken: 'Clicked minus button to delete bullet.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Direct row deletion is snappy and responsive.'
    });
  });
});
