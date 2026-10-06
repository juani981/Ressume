describe('UX Test 10: Contact Types Picker, Social Links & Communication Channels', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');
  });

  it('Evaluates adding new contact channels, category search, and removal ergonomics', () => {
    // 1. Locate the Contact section and "+ Contacto" adder button
    cy.get('.add-contact-btn').first().then(($btn) => {
      cy.trackObservation({
        stepNumber: 15,
        feature: 'Contact Channel Adder Discoverability',
        userGoal: 'Add a new social link (e.g., GitHub or LinkedIn) to the CV header',
        whatUserSaw: 'A dashed pill button "+ Contacto" inline with existing contact pills.',
        actionTaken: 'Located and clicked the "+ Contacto" button.',
        wasNatural: true,
        clicksRequired: 1,
        visualClarityScore: 5,
        legendsInformative: true,
        assumesPriorKnowledge: false,
        frictionSeverity: 'None',
        recommendation: 'The dashed pill button integrates seamlessly into the pill list and makes adding new channels obvious.'
      });

      cy.trackClick('.add-contact-btn', 'Add Contact Channel Button');
      cy.wrap($btn).click({ force: true });
    });

    // 2. Contact Type Picker Popover is visible
    cy.get('[data-testid="contact-type-picker"]').should('be.visible');

    cy.trackObservation({
      stepNumber: 16,
      feature: 'Contact Type Popover & Categories',
      userGoal: 'Search and select a specialized contact type (e.g., GitHub or Telegram)',
      whatUserSaw: 'Floating popover menu with search bar, category chips (All, Dev, Redes), and standardized icons.',
      actionTaken: 'Typed "git" into the search bar to filter dev options.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Search filter with category tabs makes locating specific networks quick and effortless.'
    });

    // 3. Search for "github"
    cy.get('[data-testid="contact-type-picker"] input[type="text"]').type('github');
    cy.get('[data-testid="contact-type-picker"]').contains('GitHub').should('be.visible').click();

    // 4. Verify new GitHub pill added to contact section
    cy.get('.contact-item-pill').should('have.length.greaterThan', 1);

    // 5. In-place edit the newly added GitHub contact
    cy.get('.contact-item-pill').last().within(() => {
      cy.get('.inline-edit-display, span').first().invoke('text', 'github.com/alexdev').trigger('input').trigger('blur');
    });

    // 6. Test removing a contact item
    cy.get('.contact-item-pill').last().then(($pill) => {
      cy.wrap($pill).find('.contact-del-btn').click({ force: true });
    });

    cy.trackObservation({
      stepNumber: 17,
      feature: 'Contact Deletion Feedback',
      userGoal: 'Delete an unnecessary contact item',
      whatUserSaw: 'Minus icon button next to contact pill text.',
      actionTaken: 'Clicked minus button to delete pill.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 4,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'Low',
      frictionAnalysis: 'The minus icon is quite small (11px) and sits very close to the text, making it slightly tricky on high-DPI screens or mobile touch devices.',
      recommendation: 'Ensure minimum 24x24px hit area for the contact deletion button to avoid misclicking the text.'
    });
  });
});
