import highDensityCV from '../fixtures/highDensityCV.json';

describe('Adversarial Stress Test: Layout & PDF Print Stability (Challenger 2)', () => {
  const getAdversarialCv = (overrides = {}) => {
    const cv = JSON.parse(JSON.stringify(highDensityCV));
    cv.layout = {
      ...cv.layout,
      ...overrides,
    };
    return cv;
  };

  beforeEach(() => {
    cy.viewport(1280, 900);
  });

  it('1. Sliders en Mínimos Extremos (fontScale=0.50, lineHeight=1.25, pagePadding=0, leftColumnWidth=20%)', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('skip_onboarding_tour', 'true');
        win.localStorage.setItem('cvData', JSON.stringify(getAdversarialCv()));
      },
    });
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');

    // Modificar mediante UI interactiva (ActionMenu)
    cy.get('[data-testid="btn-open-design"]').click();
    cy.get('[data-testid="design-submenu"]').should('be.visible');

    // Pestaña Tipografía
    cy.get('[data-testid="tab-typography"]').click();
    cy.get('input[aria-label="Control de Escala de Fuente"]').setSliderValue(0.50);
    cy.get('input[aria-label="Control de Altura de Línea"]').setSliderValue(1.25);

    // Pestaña Espaciado
    cy.get('[data-testid="tab-spacing"]').click();
    cy.get('input[aria-label="Control de Margen de Página"]').setSliderValue(0);
    cy.get('input[aria-label="Control de Ancho de Columna Lateral"]').setSliderValue(20);

    // Verificar en Editor en Vivo
    cy.get('#area-cv').should(($cv) => {
      const style = $cv[0].getAttribute('style') || '';
      expect(style).to.include('--font-scale: 0.5');
      expect(style).to.include('--line-height: 1.25');
      expect(style).to.include('--page-padding: 0px');
      expect(style).to.include('--left-col-percent: 20%');
    });

    // Disparar Impresión Limpia
    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();

    // Validar en el iframe de impresión
    cy.emulatePrintMedia();
    cy.getLastPrintDoc().should((doc) => {
      const printCv = doc.getElementById('area-cv');
      expect(printCv, '#area-cv debe existir en print iframe').to.not.be.null;

      const inlineStyle = printCv.getAttribute('style') || '';
      expect(inlineStyle, 'Print iframe conserva --font-scale: 0.5').to.include('--font-scale: 0.5');
      expect(inlineStyle, 'Print iframe conserva --line-height: 1.25').to.include('--line-height: 1.25');
      expect(inlineStyle, 'Print iframe conserva --page-padding: 0px').to.include('--page-padding: 0px');
      expect(inlineStyle, 'Print iframe conserva --left-col-percent: 20%').to.include('--left-col-percent: 20%');

      const printWin = doc.defaultView;
      const cvComp = printWin.getComputedStyle(printCv);
      expect(Math.round(parseFloat(cvComp.width)), 'Ancho base A4 794px').to.equal(794);

      // Columna lateral a ~20% (158.8px)
      const leftCol = printCv.querySelector('.resume__left');
      expect(leftCol).to.not.be.null;
      const leftColWidth = parseFloat(printWin.getComputedStyle(leftCol).width);
      expect(leftColWidth, 'Columna lateral refleja 20% del ancho').to.be.within(145, 175);
    });

    // Generar PDF físico
    cy.window().its('__lastPrintDocHtml', { timeout: 10000 }).should('be.a', 'string').and('have.length.greaterThan', 500);
    cy.generatePdfWithCDP('tests/adversarial-output/01-min-extremes.pdf');
    cy.restoreScreenMedia();
  });

  it('2. Sliders en Máximos Extremos (fontScale=1.25, lineHeight=1.85, pagePadding=60, leftColumnWidth=55%)', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('skip_onboarding_tour', 'true');
        win.localStorage.setItem('cvData', JSON.stringify(getAdversarialCv()));
      },
    });
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');

    // Modificar mediante UI interactiva
    cy.get('[data-testid="btn-open-design"]').click();
    cy.get('[data-testid="design-submenu"]').should('be.visible');

    cy.get('[data-testid="tab-typography"]').click();
    cy.get('input[aria-label="Control de Escala de Fuente"]').setSliderValue(1.25);
    cy.get('input[aria-label="Control de Altura de Línea"]').setSliderValue(1.85);

    cy.get('[data-testid="tab-spacing"]').click();
    cy.get('input[aria-label="Control de Margen de Página"]').setSliderValue(60);
    cy.get('input[aria-label="Control de Ancho de Columna Lateral"]').setSliderValue(55);

    // Verificar en Editor en Vivo
    cy.get('#area-cv').should(($cv) => {
      const style = $cv[0].getAttribute('style') || '';
      expect(style).to.include('--font-scale: 1.25');
      expect(style).to.include('--line-height: 1.85');
      expect(style).to.include('--page-padding: 60px');
      expect(style).to.include('--left-col-percent: 55%');
    });

    // Disparar Impresión Limpia
    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();

    cy.emulatePrintMedia();
    cy.getLastPrintDoc().should((doc) => {
      const printCv = doc.getElementById('area-cv');
      expect(printCv).to.not.be.null;

      const inlineStyle = printCv.getAttribute('style') || '';
      expect(inlineStyle, 'Print iframe conserva --font-scale: 1.25').to.include('--font-scale: 1.25');
      expect(inlineStyle, 'Print iframe conserva --line-height: 1.85').to.include('--line-height: 1.85');
      expect(inlineStyle, 'Print iframe conserva --page-padding: 60px').to.include('--page-padding: 60px');
      expect(inlineStyle, 'Print iframe conserva --left-col-percent: 55%').to.include('--left-col-percent: 55%');

      const printWin = doc.defaultView;
      const leftCol = printCv.querySelector('.resume__left');
      expect(leftCol).to.not.be.null;
      const leftColWidth = parseFloat(printWin.getComputedStyle(leftCol).width);
      expect(leftColWidth, 'Columna lateral refleja 55% del ancho (~436px)').to.be.within(420, 455);
    });

    cy.window().its('__lastPrintDocHtml', { timeout: 10000 }).should('be.a', 'string').and('have.length.greaterThan', 500);
    cy.generatePdfWithCDP('tests/adversarial-output/02-max-extremes.pdf');
    cy.restoreScreenMedia();
  });

  it('3. Sliders Cruzados 1: Gran Fuente (1.25) + Altura Línea Compacta (1.25) + Sin Margen (0px) + Columna Ancha (55%)', () => {
    const crossCv = getAdversarialCv({
      fontScale: 1.25,
      lineHeight: 1.25,
      pagePadding: 0,
      leftColumnWidth: 55,
      itemGap: 14,
      sectionGap: 24,
    });

    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('skip_onboarding_tour', 'true');
        win.localStorage.setItem('cvData', JSON.stringify(crossCv));
      },
    });
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');

    cy.get('#area-cv').should(($cv) => {
      const style = $cv[0].getAttribute('style') || '';
      expect(style).to.include('--font-scale: 1.25');
      expect(style).to.include('--line-height: 1.25');
      expect(style).to.include('--page-padding: 0px');
      expect(style).to.include('--left-col-percent: 55%');
    });

    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();

    cy.emulatePrintMedia();
    cy.getLastPrintDoc().should((doc) => {
      const printCv = doc.getElementById('area-cv');
      const inlineStyle = printCv.getAttribute('style') || '';
      expect(inlineStyle).to.include('--font-scale: 1.25');
      expect(inlineStyle).to.include('--line-height: 1.25');
      expect(inlineStyle).to.include('--page-padding: 0px');
      expect(inlineStyle).to.include('--left-col-percent: 55%');
    });

    cy.window().its('__lastPrintDocHtml', { timeout: 10000 }).should('be.a', 'string').and('have.length.greaterThan', 500);
    cy.generatePdfWithCDP('tests/adversarial-output/03-cross-extremes-1.pdf');
    cy.restoreScreenMedia();
  });

  it('4. Sliders Cruzados 2: Micro Fuente (0.50) + Altura Línea Holgada (1.85) + Margen Gigante (60px) + Columna Estrecha (20%)', () => {
    const crossCv = getAdversarialCv({
      fontScale: 0.50,
      lineHeight: 1.85,
      pagePadding: 60,
      leftColumnWidth: 20,
      itemGap: 4,
      sectionGap: 10,
    });

    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('skip_onboarding_tour', 'true');
        win.localStorage.setItem('cvData', JSON.stringify(crossCv));
      },
    });
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');

    cy.get('#area-cv').should(($cv) => {
      const style = $cv[0].getAttribute('style') || '';
      expect(style).to.include('--font-scale: 0.5');
      expect(style).to.include('--line-height: 1.85');
      expect(style).to.include('--page-padding: 60px');
      expect(style).to.include('--left-col-percent: 20%');
    });

    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();

    cy.emulatePrintMedia();
    cy.getLastPrintDoc().should((doc) => {
      const printCv = doc.getElementById('area-cv');
      const inlineStyle = printCv.getAttribute('style') || '';
      expect(inlineStyle).to.include('--font-scale: 0.5');
      expect(inlineStyle).to.include('--line-height: 1.85');
      expect(inlineStyle).to.include('--page-padding: 60px');
      expect(inlineStyle).to.include('--left-col-percent: 20%');
    });

    cy.window().its('__lastPrintDocHtml', { timeout: 10000 }).should('be.a', 'string').and('have.length.greaterThan', 500);
    cy.generatePdfWithCDP('tests/adversarial-output/04-cross-extremes-2.pdf');
    cy.restoreScreenMedia();
  });

  it('5. Modo ATS 1-Columna con Sliders Extremos (pagePadding=60, fontScale=1.25, lineHeight=1.85)', () => {
    const atsCv = getAdversarialCv({
      type: '1-column',
      isAtsMode: true,
      fontScale: 1.25,
      lineHeight: 1.85,
      pagePadding: 60,
      itemGap: 16,
      sectionGap: 28,
    });

    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('skip_onboarding_tour', 'true');
        win.localStorage.setItem('cvData', JSON.stringify(atsCv));
      },
    });
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');

    cy.get('#area-cv').should('have.class', 'resume__single-column');

    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();

    cy.emulatePrintMedia();
    cy.getLastPrintDoc().should((doc) => {
      const printCv = doc.getElementById('area-cv');
      expect(printCv).to.not.be.null;
      expect(printCv.classList.contains('resume__single-column')).to.be.true;

      const inlineStyle = printCv.getAttribute('style') || '';
      expect(inlineStyle).to.include('--font-scale: 1.25');
      expect(inlineStyle).to.include('--line-height: 1.85');
      expect(inlineStyle).to.include('--page-padding: 60px');
    });

    cy.window().its('__lastPrintDocHtml', { timeout: 10000 }).should('be.a', 'string').and('have.length.greaterThan', 500);
    cy.generatePdfWithCDP('tests/adversarial-output/05-ats-extremes.pdf');
    cy.restoreScreenMedia();
  });

  it('6. Pliegue de Viñetas en Límite de Página: División Limpia sin Ruptura de Palabras ni Solitarias', () => {
    const foldCv = getAdversarialCv({
      pagePadding: 24,
      itemGap: 8,
      sectionGap: 20,
    });

    const expSection = foldCv.sections.find((s) => s.id === 'experience');
    if (expSection) {
      expSection.items = [
        {
          id: 'exp_p1_1',
          title: 'Arquitecto de Soluciones Cloud Senior',
          subtitle: 'Enterprise Cloud Technologies | Remoto',
          date: '2021 – 2023',
          description: 'Liderazgo técnico en arquitecturas distribuidas de alta resiliencia y procesamiento de flujos asíncronos.',
          bullets: [
            'Diseño de topologías de microservicios con Kafka Streams y clústeres redundantes Kubernetes.',
            'Optimización de bases de datos relacionales distribuidas con particionamiento horizontal avanzado.',
            'Definición de políticas de observabilidad proactiva con OpenTelemetry, Prometheus y Grafana.'
          ]
        },
        {
          id: 'exp_p1_2',
          title: 'Líder Técnico Backend & Microservicios',
          subtitle: 'Fintech Payments Group | San Miguel de Tucumán',
          date: '2022 – 2023',
          description: 'Dirección de ingeniería para plataformas de pagos transaccionales de alto rendimiento.',
          bullets: [
            'Implementación de pasarelas de pago concurrentes bajo certificación estricta PCI-DSS.',
            'Automatización de despliegues globales con Terraform y pipelines GitOps en GitLab CI.',
            'Reducción de latencia en consultas críticas mediante invalidación estratégica en Redis Cluster.'
          ]
        },
        {
          id: 'exp_fold_split',
          title: 'Ingeniero de Software Senior (Pliegue de Página)',
          subtitle: 'Sistemas Críticos & Alta Concurrencia',
          date: '2023 – Actualidad',
          description: 'Desarrollo de motores de cálculo financiero distribuidos con tolerancia total a fallos.',
          bullets: [
            'Viñeta A (Página 1): Refactorización integral de servicios monolíticos heredados hacia arquitecturas orientadas a eventos desacopladas.',
            'Viñeta B (Página 1): Optimización de algoritmos de indexación en PostgreSQL, disminuyendo consumo de memoria y CPU en un 38%.',
            'Viñeta C (Página 2): Implementación de esquemas de tolerancia a particiones de red mediante algoritmos de consenso distribuido Raft.',
            'Viñeta D (Página 2): Coordinación y auditoría de ciberseguridad para certificaciones SOC2 Tipo II e ISO 27001 multi-región.'
          ]
        }
      ];
    }
    foldCv.sections = foldCv.sections.filter((s) =>
      ['profile_header', 'contact', 'experience', 'education', 'skills'].includes(s.id)
    );

    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('skip_onboarding_tour', 'true');
        win.localStorage.setItem('cvData', JSON.stringify(foldCv));
      },
    });
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');

    cy.stubPrint();
    cy.get('[data-testid="btn-action-native-print"]').click();

    cy.emulatePrintMedia();
    cy.getLastPrintDoc().should((doc) => {
      const printCv = doc.getElementById('area-cv');
      expect(printCv).to.not.be.null;

      const bulletItems = Array.from(printCv.querySelectorAll('.experience__bullets li'));
      expect(bulletItems.length, 'Se deben encontrar todas las viñetas').to.be.at.least(4);

      bulletItems.forEach((li) => {
        const comp = doc.defaultView.getComputedStyle(li);
        expect(comp.breakInside, 'li no debe cortarse internamente').to.satisfy(
          (val) => val === 'avoid' || comp.pageBreakInside === 'avoid'
        );
      });
    });

    cy.window().its('__lastPrintDocHtml', { timeout: 10000 }).should('be.a', 'string').and('have.length.greaterThan', 500);
    cy.generatePdfWithCDP('tests/adversarial-output/06-bullet-boundary.pdf');
    cy.restoreScreenMedia();
  });
});
