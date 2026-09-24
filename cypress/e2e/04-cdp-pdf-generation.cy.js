describe('Fase 4: Generación y Validación del Archivo Físico .pdf vía CDP', () => {
  const defaultPdfPath = 'cypress/downloads/curriculum-default.pdf';
  const atsPdfPath = 'cypress/downloads/curriculum-ats.pdf';
  const editedPdfPath = 'cypress/downloads/curriculum-edited.pdf';

  beforeEach(() => {
    cy.visit('/');
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');
  });

  it('1. Genera y descarga el archivo binario .pdf físico real en disco', () => {
    cy.task('deleteFile', defaultPdfPath);

    // Renderizar mediante Chrome DevTools Protocol directamente a PDF físico
    cy.generatePdfWithCDP(defaultPdfPath);

    // Inspeccionar las propiedades binarias del archivo en disco
    cy.task('inspectPdf', defaultPdfPath).then((info) => {
      expect(info.exists, 'El archivo PDF debe haberse creado en disco').to.be.true;
      expect(info.isPdf, 'El archivo debe ser un PDF válido').to.be.true;
      expect(info.header, 'Debe iniciar con la firma mágica de PDF').to.match(/^%PDF-1\.[0-7]/);
      expect(info.sizeBytes, 'El PDF debe tener un peso realista con estilos embebidos').to.be.greaterThan(15000);
    });
  });

  it('2. Control de Paginación A4: El PDF generado cumple con el límite de páginas', () => {
    cy.task('inspectPdf', defaultPdfPath).then((info) => {
      if (!info.exists) {
        cy.generatePdfWithCDP(defaultPdfPath);
      }
    });

    cy.task('inspectPdf', defaultPdfPath).then((info) => {
      expect(info.exists).to.be.true;
      // Validar que el currículum estándar no desborda en páginas infinitas (<= 2 páginas A4)
      expect(info.pagesCount, 'El número de páginas A4 debe ser de 1 o 2 páginas').to.be.at.most(2);
    });
  });

  it('3. Genera un archivo .pdf físico independiente en modo Optimizado ATS', () => {
    cy.task('deleteFile', atsPdfPath);

    // Activar modo ATS
    cy.get('[data-testid="ats-mode-toggle"]').click();
    cy.get('#area-cv').should('have.class', 'resume--ats-mode');

    // Generar PDF del modo ATS
    cy.generatePdfWithCDP(atsPdfPath);

    // Validar integridad del archivo ATS
    cy.task('inspectPdf', atsPdfPath).then((info) => {
      expect(info.exists, 'El PDF ATS debe existir en disco').to.be.true;
      expect(info.isPdf, 'Debe ser un archivo PDF válido').to.be.true;
      expect(info.sizeBytes, 'El archivo PDF ATS debe tener contenido').to.be.greaterThan(10000);
      expect(info.pagesCount, 'El PDF ATS debe caber en páginas A4 definidas').to.be.at.least(1);
    });
  });

  it('4. Persistencia fiel tras edición: El PDF físico se genera correctamente con texto modificado', () => {
    cy.task('deleteFile', editedPdfPath);
    const nombreEditado = 'Dra. Elena Rostova';

    // Modificar nombre en vivo
    cy.get('.home__title').click();
    cy.get('.home__title [contenteditable="true"]')
      .should('exist')
      .clear()
      .type(`${nombreEditado}{enter}`);

    cy.get('.home__title').should('contain.text', nombreEditado);

    // Generar PDF con la modificación
    cy.generatePdfWithCDP(editedPdfPath);

    // Validar que el archivo físico existe y está íntegro
    cy.task('inspectPdf', editedPdfPath).then((info) => {
      expect(info.exists, 'El PDF modificado debe existir').to.be.true;
      expect(info.isPdf, 'Debe ser un PDF legítimo').to.be.true;
      expect(info.sizeBytes).to.be.greaterThan(15000);
    });
  });
});
