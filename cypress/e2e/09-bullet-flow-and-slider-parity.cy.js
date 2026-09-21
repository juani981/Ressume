import highDensityCV from '../fixtures/highDensityCV.json';

describe('Milestone 4: Paridad de Viñetas, Sincronización de Sliders y Verificación Real-Browser (Feature 12)', () => {
  const outputPdfPath = 'cypress/downloads/bullet-and-slider-parity.pdf';

  // Fixture con un ítem de 4 viñetas calibrado para cruzar el pliegue de página (2 en P1, 2 en P2)
  const createBulletFoldCV = () => {
    const cv = JSON.parse(JSON.stringify(highDensityCV));
    cv.layout.pagePadding = 24;
    cv.layout.itemGap = 8;
    cv.layout.sectionGap = 20;

    // Colocar un ítem de 4 viñetas en la sección de experiencia
    const expSection = cv.sections.find((s) => s.id === 'experience');
    if (expSection) {
      expSection.items = [
        {
          id: 'exp_lead',
          title: 'Arquitecto de Software Principal & Tech Lead',
          subtitle: 'Global Enterprise Cloud Systems | Remoto',
          date: '2021 – 2023',
          description: 'Liderazgo estratégico en transformación digital y modernización de plataformas empresariales distribuidas de alta concurrencia.',
          bullets: [
            'Diseño de topologías de microservicios resilientes con mensajería asíncrona Kafka.',
            'Implementación de infraestructura como código mediante Terraform y clústeres Kubernetes.',
            'Establecimiento de políticas de observabilidad proactiva con Prometheus y Grafana OpenTelemetry.',
            'Automatización de pipelines CI/CD con pruebas de integración continuas y análisis de cobertura.'
          ]
        },
        {
          id: 'exp_lead_2',
          title: 'Líder Técnico de Backend & Cloud Infrastructure',
          subtitle: 'Fintech Solutions | San Miguel de Tucumán',
          date: '2022 – 2023',
          description: 'Gestión técnica y diseño de arquitecturas escalables para procesamiento de pagos en tiempo real.',
          bullets: [
            'Desarrollo de API gateways con autenticación JWT y limitación de tasa distribuida.',
            'Implementación de esquemas de particionado en bases de datos de transacciones de alto volumen.',
            'Integración de pasarelas de pago internacionales cumpliendo normativas PCI-DSS y validación antifraude.'
          ]
        },
        {
          id: 'exp_split_4bullets',
          title: 'Ingeniero de Software Senior (Ítem de 4 Viñetas en Pliegue)',
          subtitle: 'Sistemas Críticos & Alta Disponibilidad',
          date: '2023 – Actualidad',
          description: 'Desarrollo y optimización de motores de cálculo distribuido y persistencia relacional a gran escala para clientes bancarios y de telecomunicaciones con tolerancia cero a fallos.',
          bullets: [
            'Viñeta 1 (Página 1): Optimización exhaustiva de planes de ejecución y particionamiento de bases de datos PostgreSQL y Oracle, reduciendo tiempos de latencia en consultas críticas en un 42%.',
            'Viñeta 2 (Página 1): Refactorización integral de microservicios monolíticos hacia arquitecturas orientadas a eventos desacopladas, garantizando alta disponibilidad del 99.99%.',
            'Viñeta 3 (Página 2): Implementación de mecanismos de caché distribuida en memoria utilizando Redis Cluster con invalidación proactiva y consistencia eventual estricta.',
            'Viñeta 4 (Página 2): Coordinación y auditoría de ciberseguridad para cumplimiento estricto de normativas ISO 27001 y SOC2 en entornos productivos multi-región.'
          ]
        }
      ];
    }

    // Mantener únicamente las secciones requeridas para un documento balanceado de exactamente 2 páginas
    cv.sections = cv.sections.filter((s) =>
      ['profile_header', 'contact', 'experience', 'education', 'skills'].includes(s.id)
    );

    return cv;
  };

  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('skip_onboarding_tour', 'true');
        win.localStorage.setItem('cvData', JSON.stringify(createBulletFoldCV()));
      },
    });
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');
  });

  it('1. Paridad y Distribución de Viñetas: Ítem de 4 viñetas divide exactamente 2 en Página 1 y 2 en Página 2 sin corte de caracteres', () => {
    // 1. Verificar en el editor en vivo la distribución de las 4 viñetas
    cy.get('#area-cv').then(($areaCv) => {
      const cvRect = $areaCv[0].getBoundingClientRect();
      const cvTop = cvRect.top;
      const pageHeightPx = 1123;

      // Localizar las 4 viñetas del ítem en pliegue
      const bullets = Array.from($areaCv[0].querySelectorAll('.experience__bullets li')).filter((li) =>
        li.textContent.includes('Viñeta 1 (Página 1)') ||
        li.textContent.includes('Viñeta 2 (Página 1)') ||
        li.textContent.includes('Viñeta 3 (Página 2)') ||
        li.textContent.includes('Viñeta 4 (Página 2)')
      );
      expect(bullets.length, 'Se deben encontrar las 4 viñetas en pantalla').to.equal(4);

      const screenP1Bullets = bullets.filter((b) => (b.getBoundingClientRect().top - cvTop) < pageHeightPx - 2);
      const screenP2Bullets = bullets.filter((b) => (b.getBoundingClientRect().top - cvTop) >= pageHeightPx - 2);
      const info = bullets.map((b, i) => {
        const r = b.getBoundingClientRect();
        const forced = b.getAttribute('data-editor-break-forced');
        const fold = b.getAttribute('data-editor-break-fold');
        const mt = b.style.marginTop;
        return `B${i+1}: top=${Math.round(r.top - cvTop)}, bottom=${Math.round(r.bottom - cvTop)}, forced=${forced}, fold=${fold}, mt=${mt}`;
      }).join(' \n ');
      expect(screenP1Bullets.length, `Bullets state:\n${info}\n - En el editor deben quedar 2 viñetas en Página 1`).to.equal(2);
      expect(screenP2Bullets.length, 'En el editor deben quedar 2 viñetas en Página 2').to.equal(2);
    });

    // 2. Disparar impresión nativa y capturar snapshot limpio
    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();

    // 3. Validar en el documento de impresión limpio
    cy.emulatePrintMedia();
    cy.getLastPrintDoc().should((doc) => {
      const printCv = doc.getElementById('area-cv');
      expect(printCv, '#area-cv debe existir en el iframe de impresión').to.not.be.null;

      const cvRect = printCv.getBoundingClientRect();
      const cvTop = cvRect.top;
      const pageHeightPx = 1123;
      const foldY = cvTop + pageHeightPx;

      // Contenedores de viñetas en el snapshot de impresión
      const bulletLists = printCv.querySelectorAll('.experience__bullets, .experience__bullets-container');
      bulletLists.forEach((list) => {
        const comp = doc.defaultView.getComputedStyle(list);
        expect(comp.breakInside, 'El contenedor de viñetas debe permitir quiebre orgánico (break-inside: auto)').to.not.equal('avoid');
      });

      // Localizar las 4 viñetas del ítem en el snapshot de impresión
      const printBullets = Array.from(printCv.querySelectorAll('.experience__bullets li')).filter((li) =>
        li.textContent.includes('Viñeta 1 (Página 1)') ||
        li.textContent.includes('Viñeta 2 (Página 1)') ||
        li.textContent.includes('Viñeta 3 (Página 2)') ||
        li.textContent.includes('Viñeta 4 (Página 2)')
      );
      expect(printBullets.length, 'Se deben encontrar las 4 viñetas en el documento impreso').to.equal(4);

      // Cada viñeta individual debe tener break-inside: avoid estricto (cero corte de caracteres o palabras)
      printBullets.forEach((bullet) => {
        const comp = doc.defaultView.getComputedStyle(bullet);
        expect(comp.breakInside, 'Cada viñeta individual debe evitar quiebre interno').to.satisfy(
          (val) => val === 'avoid' || comp.pageBreakInside === 'avoid'
        );
      });

      // Viñetas 1 y 2 permanecen en Página 1 sin quiebre forzado
      expect(printBullets[0].style.breakBefore || '').to.not.equal('page');
      expect(printBullets[1].style.breakBefore || '').to.not.equal('page');

      // Viñeta 3 inicia el quiebre hacia Página 2 mediante CSS Paged Media declarativo
      expect(
        printBullets[2].style.breakBefore === 'page' ||
        printBullets[2].getAttribute('data-editor-break-forced') === 'true' ||
        printBullets[2].classList.contains('force-page-break-before'),
        'Viñeta 3 debe tener quiebre declarativo a Página 2'
      ).to.be.true;

      expect(printBullets[2].getAttribute('data-editor-break-forced'), 'Viñeta 3 debe conservar el marcador de quiebre forzado').to.equal('true');
      expect(printBullets[2].style.paddingTop, 'Viñeta 3 debe recibir padding-top de margen de página').to.include('var(--page-padding');
    });
    cy.restoreScreenMedia();
  });

  it('2. Margen Superior en Página 2+: El contenido post-salto respeta padding-top: var(--page-padding) y no se adhiere a y=0', () => {
    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();

    cy.emulatePrintMedia();
    cy.getLastPrintDoc().should((doc) => {
      const printCv = doc.getElementById('area-cv');
      expect(printCv).to.not.be.null;

      const printWin = doc.defaultView;
      const cvRect = printCv.getBoundingClientRect();
      const pageHeightPx = 1123;

      // Buscar elementos que hayan recibido quiebre forzado o que se ubiquen en Página 2
      const brokenElements = printCv.querySelectorAll('[data-editor-break-forced="true"]');
      expect(brokenElements.length, 'Deben existir elementos desplazados a Página 2').to.be.greaterThan(0);

      brokenElements.forEach((el) => {
        const style = printWin.getComputedStyle(el);
        const paddingTop = parseFloat(style.paddingTop);
        // Debe respetar var(--page-padding, 24px)
        expect(paddingTop, 'Elemento post-salto debe tener padding-top >= 16px').to.be.at.least(16);

        // Posición relativa a la página
        const elRect = el.getBoundingClientRect();
        const relTop = elRect.top - cvRect.top;
        const pageIndex = Math.floor(relTop / pageHeightPx);

        if (pageIndex >= 1) {
          const topOnPage = relTop - (pageIndex * pageHeightPx);
          expect(topOnPage, 'El elemento en Página 2+ no debe sentarse a y=0 contra el borde físico del papel').to.be.greaterThan(10);
        }
      });
    });
    cy.restoreScreenMedia();
  });

  it('3. Sincronización Estricta de Sliders: fontScale, itemGap, pagePadding y leftColumnWidth sin sobreescrituras en @media print', () => {
    // 1. Abrir menú de diseño
    cy.get('[data-testid="btn-open-design"]').click();
    cy.get('[data-testid="design-submenu"]').should('be.visible');

    // 2. Modificar fontScale en pestaña Tipografía
    cy.get('[data-testid="tab-typography"]').click();
    cy.get('input[aria-label="Control de Escala de Fuente"]').setSliderValue(1.15);

    // 3. Modificar espaciados en pestaña Espaciado
    cy.get('[data-testid="tab-spacing"]').click();
    cy.get('input[aria-label="Control de Margen de Página"]').setSliderValue(34);
    cy.get('input[aria-label="Control de Espacio entre Elementos"]').setSliderValue(14);
    cy.get('input[aria-label="Control de Ancho de Columna Lateral"]').setSliderValue(40);

    // 4. Verificar en el editor en vivo que las variables se actualizaron
    cy.get('#area-cv').should(($cv) => {
      const style = $cv[0].getAttribute('style') || '';
      expect(style).to.include('--font-scale: 1.15');
      expect(style).to.include('--page-padding: 34px');
      expect(style).to.include('--item-gap: 14px');
      expect(style).to.include('--left-col-percent: 40%');
    });

    // 5. Disparar impresión limpia
    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();

    // 6. Verificar en el snapshot de impresión bajo emulación de medios
    cy.emulatePrintMedia();
    cy.getLastPrintDoc().should((doc) => {
      const printCv = doc.getElementById('area-cv');
      const inlineStyle = printCv.getAttribute('style') || '';

      // Variables sincronizadas íntegramente
      expect(inlineStyle).to.include('--font-scale: 1.15');
      expect(inlineStyle).to.include('--page-padding: 34px');
      expect(inlineStyle).to.include('--item-gap: 14px');
      expect(inlineStyle).to.include('--left-col-percent: 40%');

      const printWin = doc.defaultView;
      const cvComp = printWin.getComputedStyle(printCv);

      // Ancho se mantiene en 794px A4
      expect(Math.round(parseFloat(cvComp.width))).to.equal(794);

      // Columna izquierda refleja la proporción de 40% (40% de 794px = ~317.6px)
      const leftCol = printCv.querySelector('.resume__left');
      if (leftCol) {
        const leftColWidth = parseFloat(printWin.getComputedStyle(leftCol).width);
        expect(leftColWidth, 'Columna lateral debe reflejar el 40% del ancho').to.be.within(305, 330);
      }
    });
    cy.restoreScreenMedia();
  });

  it('4. Generación Física de PDF con CDP: Produce un archivo PDF válido coincidente con data-total-pages', () => {
    cy.task('deleteFile', outputPdfPath);

    // Obtener data-total-pages del editor
    cy.get('#area-cv').invoke('attr', 'data-total-pages').then((totalPagesStr) => {
      const totalPages = parseInt(totalPagesStr || '2', 10);
      expect(totalPages).to.be.at.least(1);

      // Disparar impresión y generar PDF físico
      cy.stubPrint();
      cy.get('[data-testid="btn-action-native-print"]').click();
      cy.getLastPrintDoc().should('exist');

      cy.generatePdfWithCDP(outputPdfPath);

      // Verificar propiedades del PDF generado
      cy.task('inspectPdf', outputPdfPath).then((info) => {
        expect(info.exists, 'El archivo PDF debe existir en disco').to.be.true;
        expect(info.isPdf, 'Debe ser un archivo PDF válido').to.be.true;
        expect(info.sizeBytes, 'El archivo debe tener peso completo').to.be.greaterThan(15000);
        expect(info.pagesCount, `El conteo físico de páginas del PDF (${info.pagesCount}) debe coincidir con data-total-pages (${totalPages})`).to.equal(totalPages);
      });
    });
  });
});
