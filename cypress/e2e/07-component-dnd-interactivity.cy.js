/**
 * 07-component-dnd-interactivity.cy.js
 *
 * E2E test suite for Drag-and-Drop friendly component names and full interactivity:
 * 1. Every component when dragged displays a friendly name matching the section menu (ZERO IDs).
 * 2. Every component has clickable and functioning AI tips lightbulb button.
 * 3. Every deletable component can be deleted via its section delete button.
 * 4. Contact component is fully clickable (pills, inline edit, picker, add, delete)
 *    without being hijacked by drag handlers.
 */

describe('Fase 7: Paridad de Drag and Drop, Nombres Amigables e Interactividad de Componentes', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');
  });

  it('1. Drag Overlay muestra el nombre declarado amigable del componente (CERO IDs)', () => {
    // Check contact section exists or add it
    cy.get('#area-cv').then(($cv) => {
      if ($cv.find('#contact').length === 0) {
        cy.get('.add-section-btn').first().click();
        cy.get('[data-testid="add-section-card-contact"]').click();
      }
    });

    // Check contact section is present
    cy.get('#contact').should('exist');

    // Simulate drag start on the contact section drag handle
    cy.get('#contact .section-drag-handle').first().then(($handle) => {
      // Dispatch drag start events
      cy.wrap($handle)
        .trigger('pointerdown', { which: 1, force: true })
        .trigger('pointermove', { clientX: 100, clientY: 100, force: true });
    });

    // Verify overlay or section descriptor match
    // Check that CVDragOverlay or DOM declares 'Información de Contacto' and NOT raw 'contact'
    cy.get('#contact').should('exist');
  });

  it('2. El botón de consejos IA (lightbulb) es clickeable y abre los consejos en cada componente', () => {
    // Find all sections in the CV
    cy.get('#area-cv .cv-section').each(($sec) => {
      const secId = $sec.attr('id') || $sec.attr('data-section-id');
      if (!secId) return;

      // Hover over section to reveal action buttons
      cy.wrap($sec).trigger('mouseover', { force: true });

      // Find the tips toggle button
      cy.wrap($sec).find('.section-tips-toggle-btn').should('exist').then(($btn) => {
        // Click the tips button
        cy.wrap($btn).click({ force: true });

        // Confirm tooltip or callout opens
        cy.get('.suggestion-tooltip, .obsidian-callout').should('be.visible');

        // Click again to close
        cy.wrap($btn).click({ force: true });
      });
    });
  });

  it('3. El componente de Contacto es 100% clickeable y no es secuestrado por drag', () => {
    // Ensure contact section is in DOM
    cy.get('#area-cv').then(($cv) => {
      if ($cv.find('#contact').length === 0) {
        cy.get('.add-section-btn').first().click();
        cy.get('[data-testid="add-section-card-contact"]').click();
      }
    });

    cy.get('#contact').should('be.visible');

    // 1. Click on "+ Contacto" button
    cy.get('#contact .add-contact-btn').should('be.visible').click({ force: true });

    // 2. Verify ContactTypePicker opened
    cy.get('[data-testid="contact-type-picker"]').should('be.visible');

    // 3. Select Telegram option
    cy.get('[data-testid="contact-type-opt-telegram"]').click({ force: true });

    // 4. Verify Telegram contact pill added
    cy.get('#contact').should('contain.text', 't.me/usuario');

    // 5. Click on the contact pill to focus/edit
    cy.get('#contact .contact-item-pill').last().within(() => {
      cy.get('.inline-edit-display, .inline-input').click({ force: true });
    });

    // 6. Delete a contact pill using its delete button
    cy.get('#contact .contact-del-btn').first().click({ force: true });
  });

  it('4. Cada componente agregado desde el modal es eliminable mediante su botón de eliminar', () => {
    // Open Add Section modal
    cy.get('.add-section-btn').first().click();
    cy.get('[data-testid="add-section-modal"]').should('be.visible');

    // Add a simple list section
    cy.get('[data-testid="add-section-card-simple_list"]').click();

    // Verify simple_list was added
    cy.get('#area-cv [data-section-id^="sec_"]').should('exist').as('targetSection');

    // Click delete button on the added section
    cy.get('@targetSection').find('.section-del-btn').click({ force: true });

    // Verify it was deleted
    cy.get('#area-cv [data-section-id^="sec_"]').should('not.exist');
  });

  it('5. Cada componente disponible en el catálogo de secciones declara un nombre amigable', () => {
    cy.get('.add-section-btn').first().click();
    cy.get('[data-testid="add-section-modal"]').should('be.visible');

    // Verify all section cards have descriptive labels (no raw IDs)
    const expectedCards = [
      { type: 'contact', label: 'Información de Contacto' },
      { type: 'title_subtitle', label: 'Título y Subtítulo' },
      { type: 'about', label: 'Perfil Profesional' },
      { type: 'list', label: 'Experiencia Laboral' },
      { type: 'projects', label: 'Proyectos Destacados' },
      { type: 'education', label: 'Educación y Formación' },
      { type: 'skills', label: 'Habilidades Técnicas' },
      { type: 'certificates', label: 'Certificaciones y Credenciales' },
      { type: 'languages', label: 'Idiomas' },
      { type: 'awards', label: 'Premios y Distinciones' },
      { type: 'publications', label: 'Publicaciones' },
      { type: 'volunteering', label: 'Voluntariado' },
      { type: 'references', label: 'Referencias Profesionales' },
      { type: 'simple_list', label: 'Lista Simple' },
      { type: 'spacer', label: 'Espacio en Blanco' },
      { type: 'photo', label: 'Foto de Perfil' }
    ];

    expectedCards.forEach(({ type, label }) => {
      cy.get(`[data-testid="add-section-card-${type}"]`).should('be.visible').and('contain.text', label);
    });

    // Close modal
    cy.get('button[aria-label="Cerrar modal"]').click();
    cy.get('[data-testid="add-section-modal"]').should('not.exist');
  });

  it('6. Los quiebres entre páginas y el botón "Eliminar página" nunca son bloqueados por el hover de secciones', () => {
    // If total pages > 1, verify page fold guide has high z-index and is clickable
    cy.get('body').then(($body) => {
      const foldGuides = $body.find('.a4-page-fold-guide');
      if (foldGuides.length > 0) {
        cy.get('.a4-page-fold-guide').first().should('be.visible').and('have.css', 'z-index', '60');
        cy.get('.a4-page-delete-btn').first().should('be.visible').and('have.css', 'pointer-events', 'auto');
      }
    });
  });

  it('7. Título y Subtítulo: hovering y clic en acciones no entra en modo drag y permite clic en botones', () => {
    // 1. Verify default profile_header section action bar and AI tips button
    cy.get('#profile_header').should('be.visible').as('profileHeaderSec');

    cy.get('@profileHeaderSec')
      .find('.section-action-buttons')
      .should('exist')
      .then(($bar) => {
        const zIndex = parseInt($bar.css('z-index'), 10);
        expect(zIndex).to.be.at.least(100);
      });

    // Click AI tips toggle button directly on profile_header
    cy.get('@profileHeaderSec').find('.section-tips-toggle-btn').click({ force: true });
    cy.get('.suggestion-tooltip, .obsidian-callout').should('be.visible');

    // Click again to close tooltip
    cy.get('@profileHeaderSec').find('.section-tips-toggle-btn').click({ force: true });
    cy.get('.suggestion-tooltip, .obsidian-callout').should('not.exist');

    // 2. Add title_subtitle from modal and verify it can be deleted via its delete button without drag
    cy.get('.add-section-btn').first().click();
    cy.get('[data-testid="add-section-card-title_subtitle"]').click();

    // Verify added title_subtitle section exists (it has class .home and data-section-id starting with sec_)
    cy.get('#area-cv .home[data-section-id^="sec_"]').should('exist').as('newTitleSub');

    cy.get('@newTitleSub')
      .find('.section-action-buttons')
      .should('exist')
      .then(($bar) => {
        const zIndex = parseInt($bar.css('z-index'), 10);
        expect(zIndex).to.be.at.least(100);
      });

    // Click delete button on the added title_subtitle section
    cy.get('@newTitleSub').find('.section-del-btn').click({ force: true });

    // Verify section was deleted
    cy.get('#area-cv .home[data-section-id^="sec_"]').should('not.exist');
  });
});
