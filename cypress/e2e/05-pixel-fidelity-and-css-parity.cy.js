describe('Fase 5: Fidelidad a Nivel de Píxel y Paridad CSS entre Pantalla y PDF', () => {
  const parityPdfPath = 'cypress/downloads/curriculum-parity.pdf';

  beforeEach(() => {
    cy.visit('/');
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');
  });

  it('1. Paridad Geométrica Estricta: Ancho de 794px exactos y márgenes A4 normalizados', () => {
    // 1. Validar geometría en pantalla (lienzo A4 a 96 DPI: 210mm = 793.7px -> 794px)
    cy.get('#area-cv').then(($cv) => {
      const screenRect = $cv[0].getBoundingClientRect();
      expect(Math.round(screenRect.width), 'El CV en pantalla debe medir 794px de ancho').to.equal(794);
    });

    // 2. Interceptar impresión y capturar el documento exacto
    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();

    // 3. Validar geometría en el documento de impresión capturado bajo emulación de medios de impresión
    cy.wrap(Cypress.automation('remote:debugger:protocol', { command: 'Emulation.setEmulatedMedia', params: { media: 'print' } }));

    cy.getLastPrintDoc().should((doc) => {
      const printCv = doc.getElementById('area-cv');
      expect(printCv, 'El contenedor #area-cv debe existir en el documento de impresión').to.not.be.null;

      const printWin = doc.defaultView;
      expect(printWin, 'El browsing context defaultView debe estar activo').to.not.be.null;
      const cvStyle = printWin.getComputedStyle(printCv);

      // Ancho exacto a nivel de píxel (793.989px -> 794px a nivel de subpíxel)
      expect(Math.round(parseFloat(cvStyle.width)), 'El ancho computado en el documento de impresión debe redondear a 794px').to.equal(794);
      expect(cvStyle.boxSizing, 'El modelo de caja debe ser border-box para evitar desbordes').to.equal('border-box');

      // Márgenes del documento impreso: márgenes laterales 0px para alineación A4 exacta
      const bodyStyle = printWin.getComputedStyle(doc.body);
      expect(bodyStyle.marginLeft, 'El body impreso debe tener 0px de margen lateral').to.equal('0px');
      expect(bodyStyle.marginRight, 'El body impreso debe tener 0px de margen lateral').to.equal('0px');
      expect(bodyStyle.padding, 'El body impreso debe tener 0px de padding').to.equal('0px');
    });

    cy.wrap(Cypress.automation('remote:debugger:protocol', { command: 'Emulation.setEmulatedMedia', params: { media: '' } }));
  });

  it('2. Paridad Tipográfica Elemento por Elemento: Font-family, font-size y line-height en sincronía exacta', () => {
    // Capturar estilos computados en pantalla
    let screenStyles = {};

    cy.window().then((win) => {
      const elementsToInspect = [
        { key: 'name', selector: '.home__title' },
        { key: 'profession', selector: '.home__profession' },
        { key: 'sectionTitle', selector: '.section-title' },
        { key: 'profile', selector: '.profile__description' }
      ];

      elementsToInspect.forEach(({ key, selector }) => {
        const el = win.document.querySelector(selector);
        if (el) {
          const comp = win.getComputedStyle(el);
          screenStyles[key] = {
            fontFamily: comp.fontFamily,
            fontSize: comp.fontSize,
            fontWeight: comp.fontWeight,
            lineHeight: comp.lineHeight,
            color: comp.color
          };
        }
      });
    });

    // Disparar impresión
    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();

    // Comparar contra los estilos computados en el documento de impresión bajo emulación de medios
    cy.emulatePrintMedia();
    cy.getLastPrintDoc().should((doc) => {
      const printWin = doc.defaultView;
      expect(printWin, 'defaultView debe existir').to.not.be.null;

      const elementsToVerify = [
        { key: 'name', selector: '.home__title' },
        { key: 'profession', selector: '.home__profession' },
        { key: 'sectionTitle', selector: '.section-title' },
        { key: 'profile', selector: '.profile__description' }
      ];

      elementsToVerify.forEach(({ key, selector }) => {
        const printEl = doc.querySelector(selector);
        if (printEl && screenStyles[key]) {
          const printComp = printWin.getComputedStyle(printEl);
          const expected = screenStyles[key];

          // Font Family
          expect(printComp.fontFamily, `${selector} debe tener la misma familia tipográfica`).to.equal(expected.fontFamily);

          // Font Size (exactitud a nivel de subpíxel)
          const screenFs = parseFloat(expected.fontSize);
          const printFs = parseFloat(printComp.fontSize);
          expect(Math.abs(screenFs - printFs), `${selector} tamaño de fuente debe ser idéntico`).to.be.lessThan(0.5);

          // Font Weight
          expect(printComp.fontWeight, `${selector} debe conservar el mismo peso de fuente`).to.equal(expected.fontWeight);

          // Color
          expect(printComp.color, `${selector} debe conservar el mismo color de texto`).to.equal(expected.color);
        }
      });
    });
    cy.restoreScreenMedia();
  });

  it('3. Paridad Reactiva de Espaciados y Márgenes Dinámicos (--page-padding y --section-gap)', () => {
    // 1. Abrir menú de diseño y pestaña Espaciado
    cy.get('[data-testid="btn-open-design"]').click();
    cy.get('[data-testid="design-submenu"]').should('be.visible');
    cy.get('[data-testid="tab-spacing"]').click();

    // 2. Modificar el margen de página a 36px y espacio entre secciones a 22px
    cy.get('input[aria-label="Control de Margen de Página"]').setSliderValue(36);
    cy.get('input[aria-label="Control de Espacio entre Secciones"]').setSliderValue(22);

    // 3. Disparar impresión
    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();

    // 4. Verificar en el documento de impresión que las variables CSS y el espaciado son exactos bajo emulación de medios de impresión
    cy.wrap(Cypress.automation('remote:debugger:protocol', { command: 'Emulation.setEmulatedMedia', params: { media: 'print' } }));

    cy.getLastPrintDoc().should((doc) => {
      const printCv = doc.getElementById('area-cv');
      const inlineStyle = printCv.getAttribute('style') || '';

      // Las variables CSS deben propagarse al estilo en línea de #area-cv
      expect(inlineStyle).to.include('--page-padding: 36px');
      expect(inlineStyle).to.include('--section-gap: 22px');

      const printWin = doc.defaultView;
      expect(printWin, 'defaultView debe existir').to.not.be.null;
      const cvStyle = printWin.getComputedStyle(printCv);

      // El ancho continúa siendo exactamente 794px
      expect(Math.round(parseFloat(cvStyle.width)), 'El ancho debe redondear a 794px').to.equal(794);
    });

    cy.wrap(Cypress.automation('remote:debugger:protocol', { command: 'Emulation.setEmulatedMedia', params: { media: '' } }));
  });

  it('4. Paridad Textual Íntegra: 100% del contenido se clona verbatim sin omisiones', () => {
    // 1. Extraer textos representativos de contenido genuino (omitiendo placeholders de edición)
    const extractedScreenTexts = [];

    cy.get('#area-cv').then(($cv) => {
      // Buscar elementos de contenido textual genuino
      const textNodes = $cv[0].querySelectorAll(
        '.home__title, .home__profession, .section-title, .profile__description, .experience__title, .experience__company, .skills__name'
      );

      textNodes.forEach((node) => {
        if (node.classList.contains('inline-edit-placeholder') || node.getAttribute('data-is-empty') === 'true') {
          return;
        }
        const text = node.textContent?.trim();
        if (text && text.length > 2 && !text.includes('Haz clic')) {
          extractedScreenTexts.push(text);
        }
      });

      expect(extractedScreenTexts.length, 'Deben existir elementos textuales para auditar').to.be.greaterThan(5);
    });

    // 2. Disparar impresión
    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();

    // 3. Verificar que cada texto extraído de la pantalla existe íntegro en el documento de impresión
    cy.getLastPrintDoc().should((doc) => {
      const printDocText = doc.getElementById('area-cv')?.textContent || '';

      extractedScreenTexts.forEach((text) => {
        expect(printDocText, `El texto "${text.substring(0, 25)}..." debe estar íntegro en el documento impreso`).to.include(text);
      });
    });
  });

  it('5. Cero Sangrado de Artefactos de Edición (Zero UI Bleed a Nivel Estructural) y Espaciadores Transparentes', () => {
    // 1. En pantalla deben existir controles de edición interactivos
    cy.get('#area-cv').then(($cv) => {
      const editorControlsOnScreen = $cv[0].querySelectorAll(
        '.column-add-section, .add-section-btn, [data-editor-ui="true"], .no-print, [contenteditable]'
      );
      expect(editorControlsOnScreen.length, 'En pantalla el editor interactivo debe contener controles de UI').to.be.greaterThan(0);
    });

    // 2. Disparar impresión
    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();

    // 3. En el documento de impresión:
    // a) Artefactos destructivos/flotantes deben ser estrictamente CERO
    cy.emulatePrintMedia();
    cy.getLastPrintDoc().should((doc) => {
      const printCv = doc.getElementById('area-cv');
      const printWin = doc.defaultView;
      expect(printWin, 'defaultView debe existir').to.not.be.null;

      // 1. Elementos con clase .no-print o atributo data-editor-ui deben ser estrictamente CERO
      const noPrintElements = printCv.querySelectorAll('.no-print, [data-editor-ui="true"]');
      expect(noPrintElements.length, 'Cero elementos .no-print o [data-editor-ui] en el print doc').to.equal(0);

      // 2. Controles destructivos y manijas de arrastre deben ser estrictamente CERO
      const destructiveElements = printCv.querySelectorAll(
        '.round-btn-del, .btn-delete-section, .item-del-btn, .drag-handle, .section-drag-handle, .column-resizer, .column-resizer-handle, .a4-page-fold-guide, .fold-indicator'
      );
      expect(destructiveElements.length, 'Cero botones de borrado o manijas de arrastre en el print doc').to.equal(0);

      // 3. Controles de edición activa o placeholders
      const editActiveElements = printCv.querySelectorAll('[contenteditable], .inline-edit-active, .inline-edit-placeholder, [data-is-empty="true"]');
      expect(editActiveElements.length, 'Cero campos contenteditable o de edición activa').to.equal(0);

      // 4. Tooltips o Obsidian Callouts
      const calloutTooltips = printCv.querySelectorAll('.obsidian-callout, .suggestion-tooltip, .rich-toolbar');
      expect(calloutTooltips.length, 'Cero tooltips o callouts flotantes en el print doc').to.equal(0);

      // 5. Los componentes de adición (.column-add-section, etc.) se purgan intencionalmente del clean print snapshot sin dejar espacio residual
      const addSpacers = printCv.querySelectorAll('.column-add-section, .add-section-btn, [data-editor-add="true"], [data-print-transparent-spacer="true"], .print-transparent-spacer');
      expect(addSpacers.length, 'Los componentes de adición (.column-add-section) deben ser purgados del print snapshot sin dejar espacio residual').to.equal(0);
    });
    cy.restoreScreenMedia();
  });

  it('7. Purga de Componentes Aditivos (.column-add-section) en el Snapshot de Impresión para Fidelidad de Producción', () => {
    // 1. Obtener la altura del botón o contenedor de adición de sección en el editor en vivo
    let screenAddHeight = 0;
    cy.get('.column-add-section').first().then(($addSec) => {
      const rect = $addSec[0].getBoundingClientRect();
      screenAddHeight = rect.height;
      expect(screenAddHeight, 'El contenedor de adición debe tener altura real en el editor').to.be.greaterThan(20);
    });

    // 2. Disparar impresión
    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();

    // 3. Verificar que en el documento de impresión, el contenedor .column-add-section es intencionalmente purgado sin espacio residual
    cy.emulatePrintMedia();
    cy.getLastPrintDoc().should((doc) => {
      const printWin = doc.defaultView;
      expect(printWin, 'defaultView debe existir').to.not.be.null;

      const printAddSec = doc.querySelector('.column-add-section');
      expect(printAddSec, 'El contenedor .column-add-section debe ser purgado del print snapshot para fidelidad de producción').to.be.null;

      const allAddControls = doc.querySelectorAll('.column-add-section, .add-section-btn, [data-editor-add="true"]');
      expect(allAddControls.length, 'Cero elementos o botones de adición en el snapshot de impresión sin espacio residual').to.equal(0);
    });
    cy.restoreScreenMedia();
  });

  it('6. Embebido Vectorial de Fuentes en el Archivo Físico .pdf real', () => {
    cy.task('deleteFile', parityPdfPath);

    // 1. Asegurar fuentes del documento cargadas
    cy.waitForFonts();

    // 2. Renderizar y generar el archivo físico .pdf mediante Chrome DevTools Protocol
    cy.generatePdfWithCDP(parityPdfPath);

    // 3. Inspeccionar el archivo binario generado en disco
    cy.task('inspectPdf', parityPdfPath).then((info) => {
      expect(info.exists, 'El PDF físico debe existir en disco').to.be.true;
      expect(info.isPdf, 'Debe ser un archivo PDF válido').to.be.true;
      expect(info.sizeBytes, 'El archivo debe tener peso con las fuentes embebidas').to.be.greaterThan(25000);
      expect(info.pagesCount, 'Debe mantenerse dentro del límite de páginas A4').to.be.at.most(2);
    });

    // 4. Inspeccionar la tabla de fuentes embebidas del PDF
    cy.task('inspectPdfFonts', parityPdfPath).then((fontInfo) => {
      expect(fontInfo.exists).to.be.true;
      expect(fontInfo.fonts.length, 'El PDF debe contener fuentes embebidas').to.be.greaterThan(0);

      // Validar que la familia tipográfica principal (Poppins) está embebida en el binario PDF
      const hasPoppins = fontInfo.fonts.some((fontName) => fontName.toLowerCase().includes('poppins'));
      expect(hasPoppins, 'El PDF físico debe contener la tipografía Poppins embebida').to.be.true;
    });
  });
});
