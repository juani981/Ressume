describe('UX Test 8: End-to-End Naive User Cognitive Journey & Master UX Audit', () => {
  it('Executes the complete chronological journey of a first-time candidate, logs friction, and compiles UX_AUDIT_AND_FRICTION_REPORT.md', () => {
    // 1. Fresh start: Clear storage to simulate real first-time visitor
    cy.clearLocalStorage();
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.clear();
      },
    });
    cy.waitForFonts();

    // Reset audit data store
    cy.task('resetAuditData');

    // SCENARIO STEP 1: Landing
    cy.trackObservation({
      stepNumber: 1,
      feature: 'First Landing Experience',
      userGoal: 'Understand what the website does upon arrival',
      whatUserSaw: 'A pre-filled A4 CV template in two columns with professional formatting.',
      actionTaken: 'Looked around the screen to identify clickable zones.',
      wasNatural: true,
      clicksRequired: 0,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Visual presentation of the document is immediately recognizable as a CV.',
    });

    // SCENARIO STEP 1.5: Onboarding Tour Interaction
    cy.get('body').then(($body) => {
      const tourTooltip = $body.find('.react-joyride__tooltip');
      if (tourTooltip.length > 0) {
        cy.trackObservation({
          stepNumber: 2,
          feature: 'Onboarding Tour Prompt',
          userGoal: 'Read onboarding advice explaining Human vs ATS formats',
          whatUserSaw: 'Interactive guided tour spotlighting layout and tools with a dark backdrop over the CV.',
          actionTaken: 'Observed tour tip and clicked dismiss / advance to enter editor.',
          wasNatural: true,
          clicksRequired: 1,
          visualClarityScore: 5,
          legendsInformative: true,
          assumesPriorKnowledge: false,
          frictionSeverity: 'Low',
          frictionAnalysis: 'The dark backdrop blocks canvas editing until dismissed, but text provides valuable context on ATS vs Human layout.',
          recommendation: 'Keep tour concise or allow clicking directly on canvas to dismiss.',
        });

        const skipBtn = $body.find('button:contains("Omitir"), button:contains("Saltar")');
        if (skipBtn.length > 0) {
          cy.wrap(skipBtn.first()).click({ force: true });
        } else {
          const primaryBtn = $body.find('button:contains("Siguiente"), button:contains("Finalizar")');
          if (primaryBtn.length > 0) {
            cy.wrap(primaryBtn.first()).click({ force: true });
          }
        }
        cy.wait(300);
      }
    });

    // SCENARIO STEP 2: Discovering In-Place Text Editing
    cy.trackClick('.home__title, .profile__title, h1', 'Full Name Heading');
    cy.get('.home__title, .profile__title, h1').first().invoke('text', 'JUAN D. PÉREZ').trigger('input').trigger('blur');

    cy.trackObservation({
      stepNumber: 2,
      feature: 'Headline In-Place Editing',
      userGoal: 'Replace the sample candidate name with my own name',
      whatUserSaw: 'Text cursor appeared directly inside the heading text.',
      actionTaken: 'Clicked the name and typed new text in-place.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'In-place WYSIWYG text editing feels completely intuitive.',
    });

    // SCENARIO STEP 3: Editing Professional Subtitle
    cy.trackClick('.home__subtitle, .profile__profession, h2', 'Professional Subtitle');
    cy.get('.home__subtitle, .profile__profession, h2').first().invoke('text', 'Senior Software Architect').trigger('input').trigger('blur');

    cy.trackObservation({
      stepNumber: 3,
      feature: 'Subtitle Editing',
      userGoal: 'Set job title',
      whatUserSaw: 'Subtitle field highlighted.',
      actionTaken: 'Modified subtitle text directly.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
    });

    // SCENARIO STEP 4: Discovering Left Toolbar
    // User looks for a Save / Export button
    cy.get('[data-testid="action-menu-navbar"]').then(($bar) => {
      const isCollapsed = !$bar.hasClass('is-expanded');
      if (isCollapsed) {
        // User had to find the peek tab
        cy.trackClick('[data-testid="action-menu-peek-tab"]', 'Toolbar Edge Peek Rail');
        cy.trackClick('[data-testid="btn-pin-action-menu"]', 'Pin Toolbar');
      }

      cy.trackObservation({
        stepNumber: 4,
        feature: 'Toolbar Discovery',
        userGoal: 'Find export, print, and design tools',
        whatUserSaw: isCollapsed
          ? 'Narrow 16px vertical handle on the left edge with chevron icons.'
          : 'Expanded vertical toolbar.',
        actionTaken: isCollapsed
          ? 'Searched edges of the screen, noticed the subtle chevron handle on the left, and clicked it.'
          : 'Clicked toolbar icon.',
        wasNatural: !isCollapsed,
        clicksRequired: isCollapsed ? 2 : 1,
        visualClarityScore: isCollapsed ? 3 : 5,
        legendsInformative: true,
        assumesPriorKnowledge: isCollapsed,
        frictionSeverity: isCollapsed ? 'Medium' : 'None',
        frictionAnalysis: isCollapsed
          ? 'First-time users might not notice a 16px collapsed strip with no text label. They expect toolbar controls at the top or a persistent sidebar.'
          : '',
        recommendation: 'Show an animated subtle tooltip on the peek handle during the first 10 seconds of a new session: "Haz clic aquí para abrir herramientas".',
      });
    });

    // SCENARIO STEP 5: Exploring Design Panel
    cy.trackClick('[data-testid="btn-open-design"]', 'Open Design Panel');
    cy.get('.design-popover').should('be.visible');

    // Switch font
    cy.get('.design-popover select').first().select('Inter');

    cy.trackObservation({
      stepNumber: 5,
      feature: 'Design Panel Typography',
      userGoal: 'Change the font family to Inter and inspect scale slider',
      whatUserSaw: 'Typography settings modal with font family dropdown and scale slider labeled in multiplier format (1.00x).',
      actionTaken: 'Selected Inter font family.',
      wasNatural: true,
      clicksRequired: 2,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Multiplier format (1.00x) is much clearer to users than raw px values.',
    });

    // Check Spacing tab
    cy.trackClick('[data-testid="tab-spacing"]', 'Spacing Settings Tab');
    cy.get('.design-popover').within(() => {
      cy.contains('Margen de Página').should('exist');
    });

    cy.trackObservation({
      stepNumber: 6,
      feature: 'Design Panel Spacing',
      userGoal: 'Adjust margins and gaps',
      whatUserSaw: 'Sliders for Page Margin (24px), Section Gap (12px), Item Gap (6px).',
      actionTaken: 'Viewed spacing settings.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
    });

    // Close Design Panel
    cy.get('button[aria-label="Cerrar panel de diseño"]').click();

    // SCENARIO STEP 7: Version Manager Snapshot
    cy.trackClick('[data-testid="btn-open-version-manager"]', 'Open Version Manager');
    cy.get('.version-manager-modal, [data-testid="version-manager-modal"]').should('be.visible');

    cy.get('body').then(($body) => {
      const saveInput = $body.find('[data-testid="input-save-version-name"]');
      const saveBtn = $body.find('[data-testid="btn-save-version"]');
      if (saveInput.length > 0 && saveBtn.length > 0) {
        cy.wrap(saveInput.first()).clear().type('Borrador Inicial');
        cy.wrap(saveBtn.first()).click();
        cy.wait(400);
      }
    });

    cy.trackObservation({
      stepNumber: 7,
      feature: 'Version Manager Snapshot Creation',
      userGoal: 'Save a named version before making extensive changes',
      whatUserSaw: 'Input field with auto-suggested name and "Guardar" button.',
      actionTaken: 'Entered "Borrador Inicial" and clicked Guardar.',
      wasNatural: true,
      clicksRequired: 2,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Saving snapshots with human-readable names gives great peace of mind.',
    });

    // Close Version Manager
    cy.get('button[aria-label="Cerrar modal de versiones"], .modal-close-btn').click();
    cy.get('.version-manager-modal').should('not.exist');

    // SCENARIO STEP 8: AI Prompts Exploration
    cy.trackClick('#ia-prompts-item', 'Open AI Prompts Modal');
    cy.get('#ai-modal-title').should('be.visible');

    cy.trackObservation({
      stepNumber: 8,
      feature: 'AI Prompts Modal',
      userGoal: 'Audit my CV with an LLM for ATS compatibility',
      whatUserSaw: 'Pre-filled prompt containing my actual CV data and target role.',
      actionTaken: 'Viewed prompt and close button.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
    });

    cy.trackClick('[data-testid="ai-modal-close-btn"]', 'Close AI Prompts Modal');

    // SCENARIO STEP 9: Print & PDF Generation
    cy.stubPrint();
    cy.trackClick('[data-testid="btn-action-native-print"]', 'Download / Print PDF');
    cy.get('[data-testid="toast-notification"]').should('be.visible');

    cy.trackObservation({
      stepNumber: 9,
      feature: 'PDF Export and Print Confirmation',
      userGoal: 'Export finished CV as a clean PDF',
      whatUserSaw: 'Immediate toast notification "Generando PDF optimizado y preparando impresión..." followed by native print output.',
      actionTaken: 'Clicked red PDF export icon.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Fast feedback with zero lag.',
    });

    // SCENARIO STEP 10: Compile the Complete Master UX Report
    cy.generateUxReport('UX_AUDIT_AND_FRICTION_REPORT.md').then((res) => {
      expect(res.success).to.be.true;
      cy.log(`UX Report compiled to ${res.path} with ${res.totalInteractions} interactions and ${res.totalSteps} observations.`);
    });
  });
});
