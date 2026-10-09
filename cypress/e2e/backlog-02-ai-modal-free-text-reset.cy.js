describe('Backlog 02: AI modal free text resets on prompt switch and close', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');
  });

  it('Clears commentary on prompt change and clears all free text on close/reopen', () => {
    cy.trackClick('#ia-prompts-item', 'Open AI Prompts Modal');
    cy.get('#ai-modal-title').should('be.visible');

    // Type a temporary note
    cy.get('[data-testid="ai-user-commentary"]')
      .clear()
      .type('nota temporal que no debe persistir 123');
    cy.get('[data-testid="ai-user-commentary"]').should('have.value', 'nota temporal que no debe persistir 123');

    // Switch prompt -> commentary must reset
    cy.get('[data-testid="ai-prompt-select"]').select('star_enhancer');
    cy.get('[data-testid="ai-user-commentary"]').should('have.value', '');

    // Job description round-trip: type, leave, return -> cleared
    cy.get('[data-testid="ai-prompt-select"]').select('job_matcher');
    cy.get('[data-testid="ai-job-description"]').should('be.visible');
    cy.get('[data-testid="ai-job-description"]')
      .clear()
      .type('oferta temporal que no debe persistir');
    cy.get('[data-testid="ai-prompt-select"]').select('recruiter_audit');
    cy.get('[data-testid="ai-prompt-select"]').select('job_matcher');
    cy.get('[data-testid="ai-job-description"]').should('have.value', '');

    // Type again, close modal, reopen -> cleared
    cy.get('[data-testid="ai-prompt-select"]').select('recruiter_audit');
    cy.get('[data-testid="ai-user-commentary"]')
      .clear()
      .type('nota de sesion anterior');
    cy.trackClick('[data-testid="ai-modal-close-btn"]', 'Close AI Modal');
    cy.get('#ai-modal-title').should('not.exist');

    cy.trackClick('#ia-prompts-item', 'Reopen AI Prompts Modal');
    cy.get('#ai-modal-title').should('be.visible');
    cy.get('[data-testid="ai-user-commentary"]').should('have.value', '');

    cy.trackObservation({
      stepNumber: 2,
      feature: 'AI Prompts free text',
      userGoal: 'Avoid stale notes leaking into another prompt or session',
      whatUserSaw: 'Commentary and job description reset on prompt switch and on modal close.',
      actionTaken: 'Typed notes, switched prompts, closed and reopened the modal.',
      wasNatural: true,
      clicksRequired: 3,
      visualClarityScore: 5,
      legendsInformative: true,
      assumesPriorKnowledge: false,
      frictionSeverity: 'None',
      recommendation: 'Reset matches backlog: no persistence across prompts or sessions.',
    });

    cy.trackClick('[data-testid="ai-modal-close-btn"]', 'Close AI Modal');
    cy.get('#ai-modal-title').should('not.exist');
  });
});
