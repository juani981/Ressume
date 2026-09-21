describe('Fase 2: Geometría A4, Variables CSS y Paginación Zero-Split', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');
  });

  it('1. Geometría A4: #area-cv en impresión fija 794px de ancho exacto y estructura de 2 columnas', () => {
    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();

    cy.getLastPrintDoc().should((doc) => {
      const areaCv = doc.getElementById('area-cv');
      expect(areaCv, '#area-cv debe existir en el iframe de impresión').to.not.be.null;

      // El contenedor fija ancho A4 estándar (100% del contenedor o 794px)
      const maxWidth = areaCv.style.maxWidth || areaCv.style.minWidth || areaCv.style.width || '';
      expect(maxWidth).to.satisfy((val) => val.includes('794px') || val.includes('100%'));

      // En el modo 2 columnas por defecto, deben existir ambas columnas
      const leftCol = areaCv.querySelector('.resume__left');
      const rightCol = areaCv.querySelector('.resume__right');
      expect(leftCol, 'Columna izquierda debe existir en impresión 2-col').to.not.be.null;
      expect(rightCol, 'Columna derecha debe existir en impresión 2-col').to.not.be.null;

      // Verificar que la hoja print.css contiene las directivas A4 y margen cero
      const printStyles = doc.getElementById('cv-print-styles')?.textContent || '';
      expect(printStyles).to.include('size: A4');
      expect(printStyles).to.include('margin: 0');
      expect(printStyles).to.include('width: 794px !important');
    });
  });

  it('2. Variables CSS: Transfiere idénticamente los tokens de diseño al documento de impresión', () => {
    // 1. Obtener los valores de tokens de diseño en el editor activo
    cy.get('#area-cv').then(($editorCv) => {
      const editorStyles = window.getComputedStyle($editorCv[0]);
      const expectedPagePadding = editorStyles.getPropertyValue('--page-padding').trim();
      const expectedSectionGap = editorStyles.getPropertyValue('--section-gap').trim();
      const expectedLineHeight = editorStyles.getPropertyValue('--line-height').trim();

      // 2. Disparar impresión
      cy.stubPrint();
      cy.get('[data-testid="btn-action-native-print"]').click();

      // 3. Verificar que los tokens existen en el documento de impresión
      cy.getLastPrintDoc().should((doc) => {
        const printAreaCv = doc.getElementById('area-cv');
        const printRoot = doc.documentElement;
        
        // Helper para consultar propiedad en style inline, root o printAreaCv
        const getProp = (name) => {
          return (
            printAreaCv?.style?.getPropertyValue(name)?.trim() ||
            printRoot?.style?.getPropertyValue(name)?.trim() ||
            ''
          );
        };

        const printPagePadding = getProp('--page-padding');
        const printSectionGap = getProp('--section-gap');
        const printLineHeight = getProp('--line-height');

        // Los tokens esenciales deben estar definidos
        if (expectedPagePadding) {
          expect(printPagePadding, '--page-padding transferida').to.include(expectedPagePadding.replace('px', ''));
        }
        if (expectedSectionGap) {
          expect(printSectionGap, '--section-gap transferida').to.include(expectedSectionGap.replace('px', ''));
        }
        if (expectedLineHeight) {
          expect(printLineHeight, '--line-height transferida').to.equal(expectedLineHeight);
        }
      });
    });
  });

  it('3. Paridad ATS: Al activar el modo ATS, el documento impreso adopta layout de 1 columna', () => {
    // 1. Activar modo ATS en el editor
    cy.get('[data-testid="ats-mode-toggle"]').click();

    // 2. Verificar que el editor visual cambia a modo ATS
    cy.get('#area-cv').should('have.class', 'resume--ats-mode');

    // 3. Disparar impresión
    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();

    // 4. Verificar estructura en el documento impreso
    cy.getLastPrintDoc().should((doc) => {
      const printAreaCv = doc.getElementById('area-cv');
      expect(printAreaCv, '#area-cv en impresión').to.not.be.null;

      // Debe tener la clase resume--ats-mode o resume__single-column
      const isAtsClassPresent = (
        printAreaCv.classList.contains('resume--ats-mode') ||
        printAreaCv.classList.contains('resume__single-column')
      );
      expect(isAtsClassPresent, 'El contenedor debe tener clases de modo ATS').to.be.true;

      // En modo ATS NO deben existir columnas separadas
      const leftCol = printAreaCv.querySelector('.resume__left');
      const rightCol = printAreaCv.querySelector('.resume__right');
      expect(leftCol, 'No debe existir columna izquierda en modo ATS').to.be.null;
      expect(rightCol, 'No debe existir columna derecha en modo ATS').to.be.null;

      // Debe contener secciones en flujo vertical directo
      const sections = printAreaCv.querySelectorAll('.cv-section, section');
      expect(sections.length, 'Debe renderizar secciones en 1 columna').to.be.greaterThan(1);
    });
  });

  it('4. Protección Zero-Split: print.css impone reglas anti-rotura de bloques y encabezados', () => {
    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();

    cy.getLastPrintDoc().should((doc) => {
      const printStylesTag = doc.getElementById('cv-print-styles');
      expect(printStylesTag, 'cv-print-styles debe existir').to.not.be.null;
      const css = printStylesTag.textContent;

      // Regla 1: Bloques atómicos no deben cortarse al medio
      expect(css).to.include('break-inside: avoid !important');
      expect(css).to.include('.cv-block');
      expect(css).to.include('.experience__content');
      expect(css).to.include('.education__content');

      // Regla 2: Encabezados huérfanos prevenidos con break-after: avoid
      expect(css).to.include('break-after: avoid !important');
      expect(css).to.include('.section-title');

      // Regla 3: Protección contra corte del primer hijo de cada columna
      expect(css).to.include('break-before: avoid !important');
    });
  });
});
