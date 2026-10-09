describe('Backlog 01: Technical Interview prompt clarity + sober tone', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');
  });

  it('Shows renamed reverse-interview section and AI-cliche guardrail, without typos', () => {
    cy.trackClick('#ia-prompts-item', 'Open AI Prompts Modal');
    cy.get('#ai-modal-title').should('be.visible');

    // Select the technical interview prompt
    cy.get('[data-testid="ai-prompt-select"]').select('technical_interview');

    // Expand the compiled payload preview
    cy.get('[data-testid="ai-toggle-prompt-btn"]').click();
    cy.get('[data-testid="ai-payload-preview"]').should('be.visible');

    // 1. Reverse interview is explained as candidate questions to evaluate the team
    cy.get('[data-testid="ai-payload-preview"]')
      .should('contain', 'Preguntas del Candidato al Equipo')
      .and('contain', 'entrevista inversa: preguntas para evaluar al equipo');

    // 2. Old cryptic title is gone
    cy.get('[data-testid="ai-payload-preview"]')
      .should('not.contain', 'Estrategia de Entrevista Inversa:');

    // 3. Sober-tone guardrail references Signs of AI writing
    cy.get('[data-testid="ai-payload-preview"]')
      .should('contain', 'Signs_of_AI_writing');

    // 4. Typos are gone
    cy.get('[data-testid="ai-payload-preview"]')
      .should('not.contain', 'porsteriormente')
      .and('not.contain', 'apĺicaciones');

    // 5. Generic-textbook framing is gone
    cy.get('[data-testid="ai-payload-preview"]')
      .should('not.contain', 'Empieza con preguntas genéricas de libro');

    cy.trackObservation({
      stepNumber: 1,
      feature: 'Technical Interview prompt',
      userGoal: 'Understand what the reverse-interview section means',
      whatUserSaw: 'Prompt section renamed to candidate questions for evaluating the team, with sober tone guardrail.',
      actionTaken: 'Selected technical_interview prompt and expanded the compiled payload.',
      wasNatural: true,
      clicksRequired: 2,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Clear section titles remove the ENTREVISTA INVERSA confusion.',
    });

    cy.trackClick('[data-testid="ai-modal-close-btn"]', 'Close AI Modal');
    cy.get('#ai-modal-title').should('not.exist');
  });
});
