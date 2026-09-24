import highDensityCV from '../fixtures/highDensityCV.json';

describe('Milestone 2: Sincronización de Impresión en 2 Columnas y Validación E2E de Alta Densidad', () => {
  const highDensity2ColPdf = 'cypress/downloads/high-density-2col.pdf';
  const highDensityAtsPdf = 'cypress/downloads/high-density-ats.pdf';

  beforeEach(() => {
    // Inyectar el fixture de alta densidad directamente en localStorage antes de que la aplicación cargue
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('skip_onboarding_tour', 'true');
        win.localStorage.setItem('cvData', JSON.stringify(highDensityCV));
      },
    });
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');
  });

  it('1. Carga el CV de alta densidad en el editor en vivo y sincroniza a exactamente 2 páginas con 1 fold guide', () => {
    // Validar nombre del candidato
    cy.get('.home__title, #area-cv').should('contain.text', 'JUAN IGNACIO CARRIZO');

    // El editor en vivo debe calcular exactamente 2 páginas para este volumen de contenido
    cy.get('#area-cv', { timeout: 10000 })
      .should('have.attr', 'data-total-pages', '2');

    // Debe existir exactamente 1 guía de pliegue A4 (entre Página 1 y Página 2)
    cy.get('.a4-page-fold-guide').should('have.length', 1);
    cy.get('[data-testid="a4-page-fold-1"]').should('be.visible');
  });

  it('2. Snapshot de impresión limpia: Valida métricas DOM exactas de 2 páginas y distribución armónica en ambas columnas', () => {
    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();

    cy.getLastPrintDoc().should((doc) => {
      const areaCv = doc.getElementById('area-cv');
      expect(areaCv, '#area-cv debe existir en el iframe de impresión').to.not.be.null;

      // 1. --print-total-pages debe ser exactamente "2"
      const printTotalPages = areaCv.style.getPropertyValue('--print-total-pages');
      expect(printTotalPages, '--print-total-pages debe ser "2"').to.equal('2');

      // 2. Altura mínima correspondiente a 2 páginas (594mm escalado)
      const targetHeight = areaCv.style.getPropertyValue('--print-target-height-mm') || areaCv.style.minHeight || '';
      const targetHeightMm = parseFloat(targetHeight);
      expect(targetHeightMm, 'target-height de #area-cv corresponde a 2 páginas (594mm escalado)').to.be.within(550, 600);

      // 3. Ambas columnas deben existir
      const leftCol = areaCv.querySelector('.resume__left');
      const rightCol = areaCv.querySelector('.resume__right');
      expect(leftCol, 'Columna izquierda presente').to.not.be.null;
      expect(rightCol, 'Columna derecha presente').to.not.be.null;

      // Medición vertical de elementos respecto al tope del contenedor #area-cv
      const cvRect = areaCv.getBoundingClientRect();
      const cvTop = cvRect.top;
      const pageHeightPx = 1123; // Altura estándar A4 a 96 DPI
      const page2BottomPx = pageHeightPx * 2; // 2246px

      const leftBlocks = Array.from(leftCol.querySelectorAll('.cv-block, .cv-section, section'));
      const rightBlocks = Array.from(rightCol.querySelectorAll('.cv-block, .cv-section, section'));

      // Elementos de la columna izquierda en Página 1 y Página 2
      const leftPage1 = leftBlocks.filter((el) => {
        const top = el.getBoundingClientRect().top - cvTop;
        return top < pageHeightPx;
      });
      const leftPage2 = leftBlocks.filter((el) => {
        const top = el.getBoundingClientRect().top - cvTop;
        return top >= pageHeightPx && top < page2BottomPx;
      });

      // Elementos de la columna derecha en Página 1 y Página 2
      const rightPage1 = rightBlocks.filter((el) => {
        const top = el.getBoundingClientRect().top - cvTop;
        return top < pageHeightPx;
      });
      const rightPage2 = rightBlocks.filter((el) => {
        const top = el.getBoundingClientRect().top - cvTop;
        return top >= pageHeightPx && top < page2BottomPx;
      });

      // Elementos que desbordan a una hipotética Página 3
      const allBlocks = Array.from(areaCv.querySelectorAll('.cv-block, .cv-section, section'));
      const page3Overflow = allBlocks.filter((el) => {
        const top = el.getBoundingClientRect().top - cvTop;
        return top >= page2BottomPx;
      });

      // Aserciones de paginación sincronizada:
      expect(leftPage1.length, 'Columna izquierda con contenido en Página 1').to.be.greaterThan(0);
      expect(rightPage1.length, 'Columna derecha con contenido en Página 1').to.be.greaterThan(0);

      expect(leftPage2.length, 'Columna izquierda con contenido en Página 2').to.be.greaterThan(0);
      expect(rightPage2.length, 'Columna derecha con contenido en Página 2').to.be.greaterThan(0);

      // CERO columnas alternadas en blanco (ambas páginas tienen ambas columnas pobladas)
      expect(leftPage1.length > 0 && rightPage1.length > 0, 'Página 1 balanceada sin columnas vacías').to.be.true;
      expect(leftPage2.length > 0 && rightPage2.length > 0, 'Página 2 balanceada sin columnas vacías').to.be.true;

      // CERO elementos en Página 3 (sin páginas fantasma)
      expect(page3Overflow.length, 'Cero elementos desbordando a Página 3').to.equal(0);
    });
  });

  it('3. Generación y Validación del PDF Físico real vía CDP: Exactamente 2 páginas en disco', () => {
    cy.task('deleteFile', highDensity2ColPdf);

    // Disparar impresión limpia y capturar el snapshot del documento limpio
    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();
    cy.getLastPrintDoc().should('exist');

    // Renderizar mediante Chrome DevTools Protocol / Chromium headless directamente a PDF físico real
    cy.generatePdfWithCDP(highDensity2ColPdf);

    // Validar propiedades binarias y conteo estricto de páginas del archivo generado
    cy.task('inspectPdf', highDensity2ColPdf).then((info) => {
      expect(info.exists, 'El archivo PDF de 2 columnas debe haberse generado').to.be.true;
      expect(info.isPdf, 'El archivo debe ser un PDF válido').to.be.true;
      expect(info.header, 'Firma mágica de PDF válida').to.match(/^%PDF-1\.[0-7]/);
      expect(info.sizeBytes, 'El archivo PDF debe tener un peso completo con fuentes y estilos').to.be.greaterThan(15000);
      // Validación crítica de Milestone 2: Exactamente 2 páginas (0 páginas fantasma)
      expect(info.pagesCount, 'El PDF de alta densidad debe contener exactamente 2 páginas').to.equal(2);
    });
  });

  it('4. Garantía de Cero Regresión en Modo ATS (1 Columna): Flujo lineal unificado y paridad en impresión', () => {
    // 0. Configurar ajustes de slider compactos en el fixture mediante el esquema oficial cvData.layout
    const compactAtsCv = JSON.parse(JSON.stringify(highDensityCV));
    compactAtsCv.layout = {
      ...compactAtsCv.layout,
      sectionGap: 6,
      itemGap: 4,
      pagePadding: 16,
      lineHeight: 1.35,
    };
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('skip_onboarding_tour', 'true');
        win.localStorage.setItem('cvData', JSON.stringify(compactAtsCv));
      },
    });
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');

    // 1. Activar modo ATS en el editor
    cy.get('[data-testid="ats-mode-toggle"]').click();

    // 2. Verificar clases y layout en el editor en vivo
    cy.get('#area-cv')
      .should('have.class', 'resume--ats-mode')
      .and('have.class', 'resume__single-column');

    // 3. Disparar impresión limpia y comprobar el snapshot del iframe
    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();

    cy.getLastPrintDoc().should((doc) => {
      const areaCv = doc.getElementById('area-cv');
      expect(areaCv, '#area-cv en iframe de impresión').to.not.be.null;

      // Debe heredar clases de modo ATS
      const isAtsActive = (
        areaCv.classList.contains('resume--ats-mode') ||
        areaCv.classList.contains('resume__single-column')
      );
      expect(isAtsActive, 'Modo ATS activo en impresión').to.be.true;

      // En modo ATS NO deben existir columnas separadas
      const leftCol = areaCv.querySelector('.resume__left');
      const rightCol = areaCv.querySelector('.resume__right');
      expect(leftCol, 'No debe existir .resume__left en modo ATS').to.be.null;
      expect(rightCol, 'No debe existir .resume__right en modo ATS').to.be.null;

      // Secciones se organizan en flujo vertical directo
      const sections = areaCv.querySelectorAll('.cv-section, section');
      expect(sections.length, 'Múltiples secciones en flujo lineal continuo').to.be.greaterThan(1);
    });

    // 4. Generar y comprobar PDF físico en modo ATS
    cy.task('deleteFile', highDensityAtsPdf);
    cy.generatePdfWithCDP(highDensityAtsPdf);

    cy.task('inspectPdf', highDensityAtsPdf).then((info) => {
      expect(info.exists, 'El PDF ATS debe existir').to.be.true;
      expect(info.isPdf, 'El PDF ATS debe ser válido').to.be.true;
      expect(info.pagesCount, 'El PDF ATS debe mantenerse acotado a máximo 2 páginas').to.be.at.most(2);
    });
  });
});
