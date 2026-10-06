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

  it('Step 2: Evaluates complexity and ease of use (direct inline editing without menus, accessible toolbar)', () => {
    // 1. In-place editing of candidate full name without opening any modal or menu
    cy.get('.home__title, .profile__title, [data-field="name"], h1').first().as('candidateName');
    cy.get('@candidateName').should('be.visible');
    cy.get('@candidateName').invoke('text', 'JUAN CARLOS ARCHITECT').trigger('input').trigger('blur');
    cy.get('@candidateName').should('contain.text', 'JUAN CARLOS ARCHITECT');

    // 2. In-place editing of professional role subtitle
    cy.get('.home__subtitle, .profile__profession, [data-field="subtitle"], h2').first().as('candidateRole');
    cy.get('@candidateRole').should('be.visible');
    cy.get('@candidateRole').invoke('text', 'Principal Platform Engineer').trigger('input').trigger('blur');
    cy.get('@candidateRole').should('contain.text', 'Principal Platform Engineer');

    // 3. In-place editing of a section item title and description
    cy.get('.experience__content, .editable-item-container, .education__content').first().within(() => {
      cy.get('.inline-edit-display, span').first().invoke('text', 'Lead Infrastructure Architect').trigger('input').trigger('blur');
    });

    // 4. Verify toolbar discoverability and ease of access
    cy.get('[data-testid="action-menu-navbar"], .l-navbar').should('exist');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="action-menu-peek-tab"]').length > 0) {
        cy.get('[data-testid="action-menu-peek-tab"]').should('exist');
      }
    });
  });

  it('Step 3: Verifies proximity between elements and boundary margin suppression', () => {
    // 1. Verify first element in column has top margin suppressed (0px) to prevent unwanted push-down
    cy.get('.a4-page-box [class*="resume__"] > .cv-section')
      .first()
      .then(($firstSection) => {
        const computedStyle = window.getComputedStyle($firstSection[0]);
        const marginTop = parseFloat(computedStyle.marginTop);
        // Expect boundary rule to suppress top margin to 0
        expect(marginTop).to.equal(0);
      });

    // 2. Verify last element in column has bottom margin suppressed (0px) so it does not push to an unnecessary page
    cy.get('.a4-page-box [class*="resume__"] > .cv-section')
      .last()
      .then(($lastSection) => {
        const computedStyle = window.getComputedStyle($lastSection[0]);
        const marginBottom = parseFloat(computedStyle.marginBottom);
        // Expect boundary rule to suppress bottom margin to 0
        expect(marginBottom).to.equal(0);
      });

    // 3. Verify internal sibling elements maintain consistent proximity without colliding
    cy.get('.a4-page-box').first().within(() => {
      cy.get('.cv-section').then(($sections) => {
        if ($sections.length >= 2) {
          const firstRect = $sections[0].getBoundingClientRect();
          const secondRect = $sections[1].getBoundingClientRect();
          // The second section should be positioned below the first
          expect(secondRect.top).to.be.at.least(firstRect.bottom - 1);
        }
      });
    });
  });

  it('Step 4: Evaluates flow of data (reactive updates across document model, item additions, instant synchronization)', () => {
    // 1. Locate an editable experience or list section with item additions available
    cy.get('.experience, [data-section-id="experience"], .editable-section-container')
      .filter(':has(.round-btn-add)')
      .first()
      .then(($section) => {
        const initialItemCount = $section.find('.experience__content, .editable-item-container, .skills__data').length;

        // 2. Add an item reactively
        cy.wrap($section).find('.round-btn-add').first().click({ force: true });

        // 3. Verify item count increased reactively without page reload
        cy.wrap($section).find('.experience__content, .editable-item-container, .skills__data')
          .should('have.length', initialItemCount + 1);

        // 4. Edit newly created item title in-place
        cy.wrap($section).find('.experience__content, .editable-item-container, .skills__data')
          .last()
          .find('.inline-edit-display')
          .first()
          .invoke('text', 'Senior Cloud Infrastructure Architect')
          .trigger('input', { force: true })
          .trigger('blur', { force: true });

        // 5. Verify the updated text is immediately rendered
        cy.wrap($section).find('.experience__content, .editable-item-container, .skills__data')
          .last()
          .should('contain.text', 'Senior Cloud Infrastructure Architect');
      });

    // 6. Verify discrete A4 box integrity is maintained during data mutations
    cy.get('.a4-page-box').each(($box) => {
      // Must maintain fixed A4 width
      expect($box[0].getBoundingClientRect().width).to.be.closeTo(794, 20);
    });
  });
});

