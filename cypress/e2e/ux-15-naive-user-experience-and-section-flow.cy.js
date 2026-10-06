describe('UX Test 15: Naive User Experience, Cognitive Friction & Section Flow', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('#area-cv').should('be.visible');
    cy.waitForFonts();

    // Dismiss tour if present to begin naive evaluation
    cy.get('body').then(($body) => {
      const skipBtn = $body.find('button:contains("Omitir"), button:contains("Saltar")');
      if (skipBtn.length > 0) {
        cy.wrap(skipBtn.first()).click({ force: true });
        cy.wait(200);
      }
    });
  });

  it('Step 1: Audits overwhelming elements and cognitive load (no inter-page add buttons, controlled AI tips)', () => {
    // 1. Verify NO inter-page or mid-page section add buttons exist between pages or between sections
    // Inter-page adders previously caused severe UX confusion by hanging in the middle of page margins
    cy.get('.inter-page-add-section, [data-testid="inter-page-add-section"]').should('not.exist');

    // 2. Verify section adders (.column-add-section) exist ONLY at the bottom of columns on the final page
    cy.get('.a4-page-box').then(($pages) => {
      const totalPages = $pages.length;
      if (totalPages > 1) {
        // Page 1 should NOT contain column-add-section buttons
        cy.wrap($pages.first()).find('.column-add-section').should('not.exist');
      }
      // The final page contains the terminal column add buttons
      cy.wrap($pages.last()).find('.column-add-section').should('exist');
    });

    // 3. Verify AI Advice does not overwhelm or stretch the canvas infinitely
    // Check that AI advice cards inside sections use progressive disclosure or are collapsed
    cy.get('body').then(($body) => {
      const tipsCol = $body.find('.floating-section-tips-column, .ai-tips-sidebar, [data-testid="ai-tips-sidebar"]');
      if (tipsCol.length > 0) {
        cy.wrap(tipsCol).should('be.visible');
      }
      // If inline advice cards exist, verify they don't produce uncontrolled vertical overflow
      const adviceCards = $body.find('.ai-advice-item, .section-ai-tip');
      if (adviceCards.length > 3) {
        // Must provide a collapse or 'Ver más' toggle if many tips are present
        cy.get('button:contains("Ver más"), button:contains("ver más"), .tips-toggle-btn').should('exist');
      }
    });

    // 4. Verify Add Section modal affordance does not cover the CV document
    cy.get('.add-section-btn').first().click({ force: true });
    cy.get('[data-testid="add-section-modal"]').should('be.visible');

    // Modal must be docked to the right side of the canvas (not centered right over candidate text)
    cy.get('#area-cv').then(($cv) => {
      const cvRect = $cv[0].getBoundingClientRect();
      cy.get('[data-testid="add-section-modal"]').then(($modal) => {
        const modalRect = $modal[0].getBoundingClientRect();
        // The modal should be anchored to the right of or near the border of the canvas when space permits
        expect(modalRect.left).to.be.at.least(cvRect.left);
      });
    });

    // Clean dismissal: Escape key closes modal effortlessly
    cy.get('body').type('{esc}');
    cy.get('[data-testid="add-section-modal"]').should('not.exist');
  });
});
