describe('Fase 1: Ciclo de Vida de Impresión y Sanitización de Artefactos', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');
  });

  it('1. Carga el editor de CV y estabiliza la tipografía base', () => {
    // Verificar que el contenedor principal del CV está presente y contiene secciones
    cy.get('#area-cv').within(() => {
      cy.get('.cv-section, section').should('have.length.at.least', 2);
    });

    // Validar que la barra de navegación y el botón de exportación están presentes
    cy.get('.l-navbar').should('be.visible');
    cy.get('[data-testid="btn-action-native-print"]').should('be.visible');
  });

  it('2. Dispara el ciclo completo de exportación PDF con sus notificaciones toast', () => {
    cy.stubPrint();

    // Clic en el botón de impresión / descarga de PDF
    cy.get('[data-testid="btn-action-native-print"]').click();

    // 1. Se confirma la llamada a la impresión nativa
    cy.window().should((win) => {
      expect(win.__printCalls.length).to.be.greaterThan(0);
    });

    // 2. Debe mostrarse el toast de confirmación
    cy.get('[data-testid="toast-notification"]').should('contain.text', 'Documento PDF procesado');
  });

  it('3. Genera un iframe de impresión con las dos hojas de estilo maestras (base y print)', () => {
    cy.stubPrint();

    cy.get('[data-testid="btn-action-native-print"]').click();

    // Obtener el documento capturado en el iframe de impresión
    cy.getLastPrintDoc().should((doc) => {
      expect(doc, 'El documento del iframe de impresión debe haberse generado').to.not.be.null;

      // Comprobar las dos hojas de estilo obligatorias
      const baseStyles = doc.getElementById('cv-base-styles');
      const printStyles = doc.getElementById('cv-print-styles');

      expect(baseStyles, 'cv-base-styles debe existir en el head del iframe').to.not.be.null;
      expect(printStyles, 'cv-print-styles debe existir en el head del iframe').to.not.be.null;

      // Comprobar el contenedor raíz del CV
      const printAreaCv = doc.getElementById('area-cv');
      expect(printAreaCv, '#area-cv debe estar presente en el cuerpo impreso').to.not.be.null;
    });
  });

  it('4. Cumple la regla de CERO ARTEFACTOS INTERACTIVOS en el documento impreso', () => {
    cy.stubPrint();

    cy.get('[data-testid="btn-action-native-print"]').click();

    cy.getLastPrintDoc().should((doc) => {
      expect(doc, 'El documento de impresión debe existir').to.not.be.null;
      const printBody = doc.body;

      // Lista negra de 12 selectores de edición que NUNCA deben filtrarse en el PDF
      const FORBIDDEN_SELECTORS = [
        '.drag-handle',
        '.section-drag-handle',
        '.item-drag-handle',
        '.round-btn-del',
        '.item-del-btn',
        '.action-menu',
        '.l-navbar',
        '.a4-page-fold-guide',
        '.obsidian-callout',
        '.suggestion-tooltip',
        '[data-editor-ui="true"]',
        '.no-print'
      ];

      FORBIDDEN_SELECTORS.forEach((selector) => {
        const found = printBody.querySelectorAll(selector);
        expect(
          found.length,
          `Artefacto prohibido "${selector}" detectado en el documento de impresión`
        ).to.equal(0);
      });

      // Verificar que ningún elemento tenga contenteditable activo
      const editableElements = printBody.querySelectorAll('[contenteditable="true"]');
      expect(editableElements.length, 'No debe haber elementos contenteditable en impresión').to.equal(0);
    });
  });
});
