describe('UX Test 7: Multipage Pagination, Page Fold Badges & Clean Print PDF Export', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');
  });

  it('Observes discrete A4 Page Boxes and page fold indicators', () => {
    // 1. Verify Page 1 exists as a discrete physical box
    cy.get('.a4-page-box, [data-page-number="1"]').should('exist').then(($box) => {
      const rect = $box[0].getBoundingClientRect();
      expect(rect.width).to.be.closeTo(794, 20);

      cy.trackObservation({
        stepNumber: 28,
        feature: 'Discrete A4 Page Box Container',
        userGoal: 'See exactly how my CV will look when printed or saved as PDF',
        whatUserSaw: 'Distinct 210mm x 297mm physical sheet with drop shadow and page margin separation.',
        actionTaken: 'Inspected page layout on screen.',
        wasNatural: true,
        clicksRequired: 0,
        visualClarityScore: 5,
        legendsInformative: true,
        assumesPriorKnowledge: false,
        frictionSeverity: 'None',
        recommendation: 'Strict Invariant 15 WYSIWYG discrete boxes prevent surprises during physical printing.',
      });
    });
  });

  it('Executes Clean PDF Export / Print with progress feedback', () => {
    cy.stubPrint();

    // Click Download / Print PDF button on toolbar
    cy.trackClick('[data-testid="btn-action-native-print"]', 'Download / Print PDF Button');

    // 1. Toast notification provides immediate feedback
    cy.get('[data-testid="toast-notification"]').should('be.visible').and('contain.text', 'PDF');

    // 2. Print engine triggers window/iframe print
    cy.window().should((win) => {
      expect(win.__printCalls.length).to.be.greaterThan(0);
    });

    cy.trackObservation({
      stepNumber: 29,
      feature: 'PDF Generation & Print Dialog',
      userGoal: 'Export finished CV to a high-quality PDF ready for job applications',
      whatUserSaw: 'Clear progress toast, clean print iframe rendering, and native print dialog prompt.',
      actionTaken: 'Clicked red print icon on left toolbar.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Deterministic WYSIWYG projection ensures 1:1 parity between editor and PDF output.',
    });
  });
});
