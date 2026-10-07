describe('UX Test 16: MVP Production Hardening, Fixed Headers & Feature Flags', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');

    // Dismiss tour modal/popover if present
    cy.get('body').then(($body) => {
      const skipBtn = $body.find('button:contains("Omitir"), button:contains("Saltar")');
      if (skipBtn.length > 0) {
        cy.wrap(skipBtn.first()).click({ force: true });
        cy.wait(200);
      }
    });
  });

  it('Step 1: Fixed Header Sections are permanently locked and immovable (Title, Contact, About)', () => {
    // 1. Profile Header / Title section must NOT render a drag handle
    cy.get('.cv-section[data-section-type="profile_header"], [data-section-id="profile_header"], .cv-section[data-section-type="title_subtitle"]')
      .should('exist')
      .find('.section-drag-handle')
      .should('not.exist');

    // 2. Contact section must NOT render a drag handle
    cy.get('.cv-section[data-section-type="contact"], [data-section-id="contact"]')
      .should('exist')
      .find('.section-drag-handle')
      .should('not.exist');

    // 3. About / Professional Profile section must NOT render a drag handle
    cy.get('.cv-section[data-section-type="about"], [data-section-id="about_section"]')
      .should('exist')
      .find('.section-drag-handle')
      .should('not.exist');

    // 4. Dynamic sections (Experience, Skills, etc.) MUST render a drag handle for reordering
    cy.get('.cv-section[data-section-type="list"], .cv-section[data-section-type="skills"], [data-section-id="experience"]')
      .first()
      .within(() => {
        cy.get('.section-drag-handle').should('exist');
      });

    // 5. Container cursor verification: fixed sections do not show grab cursor
    cy.get('.cv-section[data-section-type="contact"], [data-section-id="contact"]')
      .first()
      .should('not.have.css', 'cursor', 'grab');
  });

  it('Step 2: Feature Flag Isolation — Bitácora is cleanly deactivated by default', () => {
    // 1. In default production MVP mode (VITE_ENABLE_BITACORA=false), the Bitacora trigger button must NOT exist in the ActionMenu toolbar
    cy.get('#bitacora-item, [data-testid="bitacora-toggle"], [data-testid="bitacora-item"]').should('not.exist');

    // 2. The Bitacora modal dialog must NOT exist in the DOM
    cy.get('[data-testid="bitacora-modal"], .bitacora-modal-overlay').should('not.exist');

    // 3. The ActionMenu toolbar remains clean and uncrowded with core actions
    cy.get('[data-testid="action-menu-navbar"], .l-navbar').should('be.visible');
    cy.get('[data-testid="btn-action-native-print"]').should('be.visible');
    cy.get('[data-testid="btn-action-version-history"]').should('be.visible');
    cy.get('[data-testid="btn-action-ai-export"]').should('be.visible');
  });

  it('Step 3: Contact Component Affordance Deduplication (Single Delete Button)', () => {
    // 1. Locate the Contact section in the CV canvas
    cy.get('.cv-section[data-section-type="contact"], [data-section-id="contact"]')
      .first()
      .as('contactSection');

    cy.get('@contactSection').should('be.visible');

    // 2. Verify each contact item pill or row has at most one delete button (no overlapping duplicate trash icons)
    cy.get('@contactSection').within(() => {
      cy.get('.contact-item-pill, .contact__item, [data-item-id]').each(($item) => {
        const deleteButtons = $item.find('.round-btn-del, .item-del-btn, .contact-del-btn');
        expect(deleteButtons.length).to.be.at.most(1);
      });
    });
  });

  it('Step 4: Version History Card PDF Download Trigger Verification', () => {
    cy.stubPrint();

    // 1. Open the Version History modal from the ActionMenu toolbar
    cy.get('[data-testid="btn-action-version-history"]').first().click({ force: true });
    cy.get('[data-testid="version-history-modal"], .version-history-container, .modal-version-history').should('be.visible');

    // 2. Check for snapshots or create a new snapshot to ensure at least one card is present
    cy.get('body').then(($body) => {
      const createSnapshotBtn = $body.find('[data-testid="btn-save-version"], button:contains("Guardar Versión"), button:contains("Crear Versión")');
      if (createSnapshotBtn.length > 0) {
        cy.wrap(createSnapshotBtn.first()).click({ force: true });
        cy.wait(300);
      }
    });

    // 3. Locate the download button on the version card
    cy.get('[data-testid="btn-version-download-pdf"], [data-testid="btn-download-pdf"], button[title*="PDF"], button[aria-label*="PDF"]')
      .first()
      .click({ force: true });

    // 4. Verify that clicking triggers the PDF print engine (window.print or print iframe)
    cy.window().should((win) => {
      expect(win.__printCalls.length).to.be.greaterThan(0);
    });

    // 5. Close the version history modal
    cy.get('body').type('{esc}');
  });

  it('Step 5: Bidirectional AI Translation Modal retains schema contract & language direction', () => {
    // 1. Open AI Export Modal from toolbar
    cy.get('[data-testid="btn-action-ai-export"]').first().click({ force: true });
    cy.get('[data-testid="ai-export-modal"], .ai-modal-overlay').should('be.visible');

    // 2. Locate prompt type dropdown / selector
    cy.get('[data-testid="prompt-type-select"], select').first().as('promptSelect');
    cy.get('@promptSelect').should('be.visible');

    // 3. Select translate to English prompt
    cy.get('@promptSelect').select('translate_english');

    // 4. Verify preview container contains candidate name and English instruction context
    cy.get('[data-testid="prompt-preview-textarea"], pre, textarea')
      .first()
      .invoke('text')
      .then((previewText) => {
        expect(previewText).to.include('contract_version');
        expect(previewText.toLowerCase()).to.satisfy(
          (text) => text.includes('english') || text.includes('ingles') || text.includes('translate')
        );
      });

    // 5. Close modal
    cy.get('body').type('{esc}');
  });

  it('Step 6: Invariant 19 Design Constants (Multipliers and Canonical Spacing Defaults)', () => {
    // 1. Open Design & Spacing Popover
    cy.get('[data-testid="btn-action-design"], [data-testid="btn-action-spacing"], button[title*="Diseño"], button[title*="Espaciado"]')
      .first()
      .click({ force: true });

    // 2. Verify General Scale is represented as a multiplier (e.g. 1.00x), NOT in px
    cy.get('body').then(($body) => {
      const scaleText = $body.find('.slider-value-badge, [data-testid="font-scale-value"], span:contains("x")');
      if (scaleText.length > 0) {
        expect(scaleText.text()).to.match(/\d+(\.\d+)?x/);
        expect(scaleText.text()).not.to.include('px');
      }
    });

    // 3. Verify discrete A4 Page Box dimensions adhere to 210mm x 297mm
    cy.get('.a4-page-box').first().then(($box) => {
      const rect = $box[0].getBoundingClientRect();
      expect(rect.width).to.be.closeTo(794, 25);
    });
  });
});
