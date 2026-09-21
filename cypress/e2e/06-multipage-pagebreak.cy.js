describe('Debug Multipage Pagebreak', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');
  });

  it('Verifica número de páginas en PDF cuando hay un quiebre de página', () => {
    // 1. Agregar múltiples elementos para forzar que el CV quiebre a la página 2
    for (let i = 0; i < 8; i++) {
      cy.get('[data-section-id="experience"] .round-btn-add').click({ force: true });
    }

    // Esperar a que el motor de paginación procese el quiebre
    cy.wait(1000);

    // 2. Disparar impresión nativa (executeCleanPrint)
    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();

    // 3. Validar que el documento de impresión se generó con margin-top: 0 y padding-top: var(--page-padding)
    cy.getLastPrintDoc().then((doc) => {
      const brokenNodes = doc.querySelectorAll('[data-editor-break-forced="true"], .break-page-before, .force-page-break-before');
      expect(brokenNodes.length, 'Debe haber elementos con quiebre de página forzado').to.be.greaterThan(0);

      brokenNodes.forEach((node) => {
        // Validación rigurosa de margin-top: 0 !important para evitar desborde de página en blanco
        expect(node.style.marginTop).to.be.oneOf(['0', '0px', '']);
        expect(node.style.paddingTop).to.contain('page-padding');
        expect(node.style.breakBefore).to.be.oneOf(['page', 'auto', '']);
      });

      // Guardar el documento de impresión exacto para validación con Chromium headless
      const fullHtml = doc.documentElement.outerHTML;
      cy.writeFile('public/test-print.html', fullHtml);
    });

    // 4. Imprimir directamente a PDF físico con Chromium y validar que son exactamente 2 páginas (sin página blanca adicional)
    const multipagePdfPath = 'cypress/downloads/multipage-chrome-verified.pdf';
    cy.task('deleteFile', multipagePdfPath);
    cy.task('printWithChrome', {
      url: 'http://localhost:5173/test-print.html',
      outputPath: multipagePdfPath,
    }).should('be.true');

    // 5. Inspeccionar y verificar que son EXACTAMENTE 2 páginas
    cy.task('inspectPdf', multipagePdfPath).then((info) => {
      expect(info.exists, 'El PDF debe haberse generado en disco').to.be.true;
      expect(info.isPdf, 'El archivo debe ser un PDF válido').to.be.true;
      expect(info.pagesCount, 'El documento debe contener exactamente 2 páginas (sin página en blanco adicional)').to.equal(2);
      expect(info.sizeBytes, 'El archivo debe tener un tamaño coherente').to.be.greaterThan(20000);
    });
  });
});
