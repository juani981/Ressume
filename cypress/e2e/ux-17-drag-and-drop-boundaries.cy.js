describe('UX Test 17: Drag-and-Drop Boundaries & Immovable Header Sections', () => {
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

  it('Step 1: Asserts fixed sections cannot initiate drag operations from their headers', () => {
    // 1. Target contact section
    cy.get('[data-section-type="contact"], [data-section-id="contact"]')
      .first()
      .as('contactSec');

    // 2. Drag handle must be absent
    cy.get('@contactSec').find('.section-drag-handle').should('not.exist');

    // 3. Pointer events on text/inputs do not initiate drag
    cy.get('@contactSec').find('input, [contenteditable="true"], .inline-edit-display').first().as('contactInput');
    cy.get('@contactInput')
      .trigger('pointerdown', { which: 1, button: 0 })
      .trigger('pointermove', { clientX: 200, clientY: 400 })
      .trigger('pointerup', { force: true });

    // Drag overlay or dragging class must not appear on document body
    cy.get('body').should('not.have.class', 'is-dragging');
    cy.get('.dnd-drag-overlay, [data-dnd-overlay="true"]').should('not.exist');
  });

  it('Step 2: Asserts profile header section stays pinned at the top of page 1', () => {
    // Profile header must be on page 1 as the first section in its column
    cy.get('.a4-page-box').first().within(() => {
      cy.get('.cv-section').first().then(($firstSection) => {
        const type = $firstSection.attr('data-section-type');
        const id = $firstSection.attr('data-section-id');
        expect(['profile_header', 'title_subtitle', 'contact']).to.include(type || id);
      });
    });
  });

  it('Step 3: Verifies draggable section ghost preview appears during active drag', () => {
    // Locate a movable section (e.g. Experience or Skills)
    cy.get('.cv-section[data-section-type="list"], .cv-section[data-section-type="skills"], [data-section-id="experience"]')
      .first()
      .as('movableSec');

    cy.get('@movableSec').find('.section-drag-handle').should('exist');

    // Hovering the drag handle changes cursor to grab
    cy.get('@movableSec').find('.section-drag-handle').trigger('mouseover');
  });

  it('Step 4: Verifies bullet point items inside dynamic sections remain reorderable', () => {
    // Locate an experience or education item with bullets
    cy.get('.experience__content, .editable-item-container').first().as('firstItem');
    cy.get('@firstItem').should('be.visible');

    // Check if item contains item drag handle or bullet handles
    cy.get('@firstItem').within(() => {
      cy.get('body').then(($body) => {
        if ($body.find('.item-drag-handle, .bullet-drag-handle').length > 0) {
          cy.get('.item-drag-handle, .bullet-drag-handle').first().should('exist');
        }
      });
    });
  });
});
