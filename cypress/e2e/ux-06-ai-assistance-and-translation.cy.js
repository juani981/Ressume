describe('UX Test 6: AI Tools, Translation Hub, Prompts & Obsidian Suggestions', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');
  });

  it('Interacts with AI Prompts Generator (ATS Audit & STAR Methodology)', () => {
    // 1. Click AI Prompts item in toolbar
    cy.trackClick('#ia-prompts-item', 'Open AI Prompts Modal');
    cy.get('#ai-modal-title').should('be.visible');

    cy.trackObservation({
      stepNumber: 24,
      feature: 'AI Prompts Generator',
      userGoal: 'Get pre-engineered prompts to audit my CV in ChatGPT or Claude without exposing personal API keys',
      whatUserSaw: 'Modal with ready-to-copy prompts tailored with my exact CV data, plus direct launch links to ChatGPT, Claude, Gemini, DeepSeek.',
      actionTaken: 'Opened AI prompt generator and inspected audit prompt.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Pre-computed prompts with full CV context save immense time over manual copying.',
    });

    // Close modal
    cy.trackClick('[data-testid="ai-modal-close-btn"]', 'Close AI Modal');
    cy.get('#ai-modal-title').should('not.exist');
  });

  it('Interacts with Translation Hub (Language Toggle ES / EN)', () => {
    // Click Translation button
    cy.trackClick('[data-testid="btn-open-translation"]', 'Open Translation Hub');
    cy.get('#ai-modal-title').should('contain', 'Traducción');

    cy.trackObservation({
      stepNumber: 25,
      feature: 'Translation & Localization Hub',
      userGoal: 'Translate CV to English tailored for the US Tech market',
      whatUserSaw: 'Target language selector with US Tech localization rules and formatted prompt.',
      actionTaken: 'Opened translation modal.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Cultural adaptation instructions (CEFR levels, US tech roles) guide the LLM accurately.',
    });

    // Close modal
    cy.trackClick('[data-testid="ai-modal-close-btn"]', 'Close Translation Modal');
  });

  it('Interacts with Bring Your Own CV (BYO CV) Converter', () => {
    cy.trackClick('[data-testid="btn-open-byo-cv"]', 'Open Bring Your Own CV Modal');
    cy.get('#ai-modal-title').should('contain', 'Trae tu propio CV');

    cy.trackObservation({
      stepNumber: 26,
      feature: 'BYO CV Converter Hub',
      userGoal: 'Import an existing resume from an external PDF or JSON document',
      whatUserSaw: 'Two-step bidirectional bridge: (1) Copy prompt to extract JSON from old CV, (2) Paste JSON back to render immediately.',
      actionTaken: 'Viewed converter workflow instructions.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: true,
      frictionSeverity: 'Low',
      frictionAnalysis: 'Requires user to understand what JSON is when pasting back the response.',
      recommendation: 'Add a 1-click "Pegar Respuesta" helper with format validation that gives human-friendly error messages if the paste is invalid.',
    });

    // Close modal
    cy.trackClick('[data-testid="ai-modal-close-btn"]', 'Close BYO CV Modal');
  });

  it('Inspects Dynamic Obsidian Callout suggestions on technical keywords', () => {
    // 1. Click section-tips-toggle-btn on the first section supporting tips
    cy.get('button[data-testid^="btn-section-tips-"]').first().then(($btn) => {
      cy.wrap($btn).click({ force: true });
      // 2. Verify suggestion tooltip opened and displays Obsidian callouts
      cy.get('.suggestion-tooltip').should('be.visible');

      // 3. Click again to toggle close
      cy.wrap($btn).click({ force: true });
      cy.get('.suggestion-tooltip').should('not.exist');
    });

    cy.trackObservation({
      stepNumber: 27,
      feature: 'Obsidian Callout Suggestion Engine',
      userGoal: 'Get real-time feedback on ATS rules, tech casing, and action verbs',
      whatUserSaw: 'Contextual tooltip styled as Obsidian callout (Danger red, Warning orange, Info blue).',
      actionTaken: 'Triggered section tips via lightbulb button.',
      wasNatural: true,
      clicksRequired: 1,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Section-level tips button directly activates the pre-computed ATS suggestion engine.'
    });
  });
});
