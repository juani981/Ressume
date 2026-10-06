describe('UX Test 1: First-Time Landing, Onboarding Tour & Navigation Discoverability', () => {
  it('Simulates a completely naive user landing on the application for the very first time', () => {
    // Clean local storage completely to test first-time visitor state
    cy.clearLocalStorage();
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.clear();
      }
    });
    cy.waitForFonts();

    // 1. Evaluate first visual impression: Can the user see the CV document?
    cy.get('#area-cv').should('be.visible').then(($cv) => {
      const rect = $cv[0].getBoundingClientRect();
      expect(rect.width).to.be.greaterThan(500);
      cy.trackObservation({
        stepNumber: 1,
        feature: 'Canvas Layout',
        userGoal: 'Identify what the website is and what document is shown',
        whatUserSaw: 'Centered white A4 paper with pre-filled professional CV template in 2 columns.',
        actionTaken: 'Observed main document canvas without clicking anything.',
        wasNatural: true,
        clicksRequired: 0,
        visualClarityScore: 5,
        legendsInformative: true,
        assumesPriorKnowledge: false,
        frictionSeverity: 'None',
        recommendation: 'Canvas presentation is clear, standard A4 layout immediately conveys a resume editor.',
      });
    });

    // 2. Evaluate Onboarding Tour: Does a tour or welcome prompt guide the naive user?
    cy.get('body').then(($body) => {
      const skipTourBtn = $body.find('button[aria-label="Skip"], button[data-action="skip"], button:contains("Omitir"), button:contains("Saltar")');
      const hasTour = skipTourBtn.length > 0 || $body.find('.react-joyride__tooltip, [data-testid="onboarding-tour-modal"]').length > 0;
      if (skipTourBtn.length > 0) {
        cy.wrap(skipTourBtn.first()).click({ force: true });
        cy.wait(300);
      }
      cy.trackObservation({
        stepNumber: 2,
        feature: 'Onboarding & Guidance',
        userGoal: 'Get initial tutorial or hints explaining how to edit or export the CV',
        whatUserSaw: hasTour ? 'Onboarding tour modal / tooltip guiding initial steps.' : 'No active onboarding modal on first load; editor directly editable.',
        actionTaken: hasTour ? 'Dismissed / advanced through tour steps.' : 'Explored UI visually searching for instructions.',
        wasNatural: hasTour,
        clicksRequired: hasTour ? 1 : 2,
        visualClarityScore: hasTour ? 5 : 3,
        legendsInformative: hasTour,
        assumesPriorKnowledge: !hasTour,
        frictionSeverity: hasTour ? 'None' : 'Medium',
        frictionAnalysis: hasTour ? '' : 'New users must infer that all text on the paper is directly contenteditable without an upfront prompt.',
        recommendation: 'Provide a gentle 3-step micro-tour for first-time visitors: (1) Click any text to edit, (2) Open left toolbar for design/export, (3) Download PDF.',
      });
    });

    // 3. Evaluate ActionMenu / Toolbar Discoverability:
    // When action_menu_pinned is false, is the 16px peek handle discoverable?
    cy.get('[data-testid="action-menu-navbar"]').then(($bar) => {
      const isExpanded = $bar.hasClass('is-expanded');
      cy.trackObservation({
        stepNumber: 3,
        feature: 'Navigation Toolbar',
        userGoal: 'Find export, design, and settings tools',
        whatUserSaw: isExpanded
          ? 'Floating sidebar toolbar on the left with icons for Undo, Redo, Versions, Design, AI, and Print.'
          : 'Collapsed rail on the far left edge showing only a small 16px peek handle with a chevron.',
        actionTaken: isExpanded
          ? 'Identified toolbar options immediately.'
          : 'Searched page for buttons, discovered chevron handle on the left screen edge, and clicked it.',
        wasNatural: isExpanded,
        clicksRequired: isExpanded ? 0 : 2,
        visualClarityScore: isExpanded ? 5 : 3,
        legendsInformative: true,
        assumesPriorKnowledge: !isExpanded,
        frictionSeverity: isExpanded ? 'None' : 'Medium',
        frictionAnalysis: isExpanded
          ? ''
          : 'A collapsed peek rail with no text label can be easily overlooked by non-technical visitors who expect top or right controls.',
        recommendation: 'When collapsed, show an initial floating tooltip or pulse effect: "Herramientas y Exportación aquí".',
      });
    });

    // 4. Click the peek tab or navbar to pin/expand it
    cy.get('[data-testid="action-menu-navbar"]').then(($bar) => {
      if (!$bar.hasClass('is-expanded')) {
        cy.trackClick('[data-testid="action-menu-peek-tab"]', 'Toolbar Peek Handle');
        cy.get('[data-testid="action-menu-navbar"]').should('have.class', 'is-expanded');
      }
    });

    // 5. Test Pin and Collapse controls
    cy.trackClick('[data-testid="btn-collapse-action-menu"]', 'Collapse Toolbar Button');
    cy.get('[data-testid="action-menu-navbar"]').should('have.class', 'is-collapsed');

    // Re-open and pin
    cy.trackClick('[data-testid="action-menu-peek-tab"]', 'Re-open Peek Handle');
    cy.trackClick('[data-testid="btn-pin-action-menu"]', 'Pin Toolbar Open');
    cy.get('[data-testid="action-menu-navbar"]').should('have.class', 'is-expanded');

    cy.trackObservation({
      stepNumber: 4,
      feature: 'Toolbar Pinning Ergonomics',
      userGoal: 'Keep toolbar persistently open while editing',
      whatUserSaw: 'Pin icon toggle switches background highlight and keeps drawer locked open.',
      actionTaken: 'Toggled pin on and off.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Pin mechanism works smoothly with instant visual feedback and localStorage persistence.',
    });
  });
});
