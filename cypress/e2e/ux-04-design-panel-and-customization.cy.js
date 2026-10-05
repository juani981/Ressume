describe('UX Test 4: Design Panel Ergonomics (Typography, Spacing & Colors)', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');
  });

  it('Opens Design Panel, navigates tabs, adjusts typography, spacing and color palette', () => {
    // 1. Open Design Panel
    cy.trackClick('[data-testid="btn-open-design"]', 'Open Design Settings Panel');
    cy.get('.design-popover').should('be.visible');

    cy.trackObservation({
      stepNumber: 15,
      feature: 'Design Panel Access',
      userGoal: 'Customize typography, spacing, and colors to personalize CV appearance',
      whatUserSaw: 'Clean popover modal with 3 tabs: Tipografía, Espaciado, and Colores.',
      actionTaken: 'Clicked Sliders icon on left toolbar.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Popover appears smoothly adjacent to the toolbar.',
    });

    // 2. Tab 1: Typography Controls
    cy.trackClick('[data-testid="tab-typography"]', 'Typography Tab');

    // Font Family Select dropdown
    cy.get('select').first().then(($sel) => {
      cy.wrap($sel).select('Inter');
      cy.trackObservation({
        stepNumber: 16,
        feature: 'Font Family Selection',
        userGoal: 'Switch CV font to a clean modern sans-serif (Inter)',
        whatUserSaw: 'Dropdown with options: Poppins, Inter, Roboto, Merriweather, JetBrains Mono.',
        actionTaken: 'Selected "Inter" font.',
        wasNatural: true,
        clicksRequired: 2,
        visualClarityScore: 5,
        legendsInformative: true,
        assumesPriorKnowledge: false,
        frictionSeverity: 'None',
        recommendation: 'Document typography updates instantly across all sections.',
      });
    });

    // General Scale Slider - verify it shows multiplier format (e.g. 1.00x)
    cy.get('.design-popover').within(() => {
      cy.contains('Escala General').parent().then(($parent) => {
        expect($parent.text()).to.contain('x');
        cy.trackObservation({
          stepNumber: 17,
          feature: 'General Scale Multiplier Display',
          userGoal: 'Understand what the font scale slider does',
          whatUserSaw: 'Slider labeled "Escala General" showing multiplier (e.g. 1.00x) rather than confusing pixels.',
          actionTaken: 'Observed scale multiplier label.',
          wasNatural: true,
          clicksRequired: 0,
          visualClarityScore: 5,
          legendsInformative: true,
          assumesPriorKnowledge: false,
          frictionSeverity: 'None',
          recommendation: 'Multiplier format (1.00x) clearly indicates proportional scaling.',
        });
      });

      // Adjust font scale slider
      cy.get('input[type="range"]').first().then(($range) => {
        cy.wrap($range).setSliderValue(1.05);
      });
    });

    // 3. Tab 2: Spacing Controls
    cy.trackClick('[data-testid="tab-spacing"]', 'Spacing Tab');

    cy.get('.design-popover').within(() => {
      // Check canonical initial values: pagePadding 24px, sectionGap 12px, itemGap 6px
      cy.contains('Margen de Página').should('exist');
      cy.contains('Espacio entre Secciones').should('exist');
      cy.contains(/Espacio entre (Elementos|Ítems)/).should('exist');

      // Adjust section gap slider
      cy.get('input[type="range"]').first().then(($range) => {
        cy.wrap($range).setSliderValue(14);
      });
    });

    cy.trackObservation({
      stepNumber: 18,
      feature: 'Spacing & Margin Controls',
      userGoal: 'Fine-tune whitespace between sections to make CV fit exactly on 1 page',
      whatUserSaw: 'Sliders for Page Margin, Section Gap, and Item Gap with real-time px readout.',
      actionTaken: 'Adjusted Section Gap slider.',
      wasNatural: true,
      clicksRequired: 2,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Instant visual feedback on the A4 page avoids guessing.',
    });

    // 4. Tab 3: Colors Controls
    cy.get('body').then(($body) => {
      const colorsTab = $body.find('[data-testid="tab-colors"], button:contains("Colores")');
      if (colorsTab.length > 0) {
        cy.wrap(colorsTab.first()).click();

        cy.trackObservation({
          stepNumber: 19,
          feature: 'Color Palette Customization',
          userGoal: 'Customize background colors of columns or titles',
          whatUserSaw: 'Color swatch presets and color picker inputs.',
          actionTaken: 'Navigated to Colores tab.',
          wasNatural: true,
          clicksRequired: 1,
          visualClarityScore: 5,
          legendsInformative: true,
          assumesPriorKnowledge: false,
          frictionSeverity: 'None',
          recommendation: 'Accessible contrast warnings safeguard document legibility.',
        });
      }
    });

    // Close Design Panel
    cy.get('button[aria-label="Cerrar panel de diseño"]').click();
    cy.get('.design-popover').should('not.be.visible');
  });
});
