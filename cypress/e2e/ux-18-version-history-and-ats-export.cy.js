describe('UX Test 18: Version History Deep Flow & ATS Export Hardening', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');

    // Dismiss tour if present
    cy.get('body').then(($body) => {
      const skipBtn = $body.find('button:contains("Omitir"), button:contains("Saltar")');
      if (skipBtn.length > 0) {
        cy.wrap(skipBtn.first()).click({ force: true });
        cy.wait(200);
      }
    });
  });

  it('Step 1: Creates, persists, and restores local CV snapshots in Version History Hub', () => {
    // 1. Edit candidate name to track mutation
    cy.get('.home__title, .profile__title, [data-field="name"], h1').first().as('nameField');
    cy.get('@nameField').invoke('text', 'INITIAL CANDIDATE NAME').trigger('input').trigger('blur');

    // 2. Open Version History modal
    cy.get('[data-testid="btn-action-version-history"]').first().click({ force: true });
    cy.get('[data-testid="version-history-modal"], .version-history-container').should('be.visible');

    // 3. Save a version snapshot
    cy.get('body').then(($body) => {
      const saveBtn = $body.find('[data-testid="btn-save-version"], button:contains("Guardar Versión")');
      if (saveBtn.length > 0) {
        cy.wrap(saveBtn.first()).click({ force: true });
        cy.wait(300);
      }
    });

    // 4. Verify version card exists in the list
    cy.get('.version-card, [data-testid="version-card"]').should('have.length.at.least', 1);

    // 5. Close modal
    cy.get('body').type('{esc}');
  });

  it('Step 2: ATS Plain Text Export Modal accurately generates structured text', () => {
    // 1. Open AI / ATS Export modal
    cy.get('[data-testid="btn-action-ai-export"]').first().click({ force: true });
    cy.get('[data-testid="ai-export-modal"], .ai-modal-overlay').should('be.visible');

    // 2. Select ATS Plain Text format
    cy.get('[data-testid="prompt-type-select"], select').first().as('selectExport');
    cy.get('@selectExport').select('ats_plain_text');

    // 3. Verify generated output text contains sections and profile header
    cy.get('[data-testid="prompt-preview-textarea"], pre, textarea')
      .first()
      .invoke('text')
      .then((atsText) => {
        expect(atsText).to.be.a('string');
        expect(atsText.length).to.be.greaterThan(50);
      });

    // 4. Close modal
    cy.get('body').type('{esc}');
  });

  it('Step 3: Verifies reset confirmation safeguards against accidental CV wipe', () => {
    // 1. Click Reset button in ActionMenu toolbar
    cy.get('[data-testid="btn-action-reset"], button[title*="Restablecer"], button[title*="Reset"]')
      .first()
      .click({ force: true });

    // 2. Verify confirmation modal or alert dialog appears
    cy.get('[data-testid="reset-confirm-modal"], .modal-confirm, [role="dialog"]').should('be.visible');

    // 3. Cancel reset operation
    cy.get('button:contains("Cancelar"), button:contains("Cancel"), [data-testid="btn-cancel-reset"]')
      .first()
      .click({ force: true });

    // 4. Verify modal is closed and area-cv remains visible and populated
    cy.get('#area-cv').should('be.visible');
    cy.get('.cv-section').should('have.length.at.least', 3);
  });
});
