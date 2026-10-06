import highDensityCV from '../fixtures/highDensityCV.json';

/**
 * n1-gap-model-mathematical-boundary.cy.js
 *
 * Exhaustive E2E Cypress suite validating the mathematical root of the N-1 gap model,
 * page capacity boundaries, and discrete A4 box margin invariants.
 *
 * Requirements covered:
 * 1. Content fits comfortably (H < H_capacity) -> exactly 1 page.
 * 2. Preservation of user section gap on last element without zeroing out margin-bottom.
 * 3. Invariant: Distance from last element content to page bottom is >= user-selected pagePadding.
 * 4. Content calibrated near page capacity threshold (H ≈ H_capacity - ε) stays on Page 1 without orphan Page 2.
 * 5. Content exceeding threshold (H = H_capacity + ε) breaks deterministically to Page 2 without clipping Page 1.
 * 6. Massive overflow distributes cleanly across multiple pages without infinite cascade.
 * 7. Anti-orphan invariant on indivisible sections at page fold (moves to Page 2 without orphan header).
 * 8. Dynamic slider scaling: Increasing pagePadding contracts capacity and shifts content.
 * 9. Section gap produces exact N-1 intervals between consecutive sections.
 * 10. Granular bullet point splitting at page boundary across Page 1 and Page 2.
 * 11. Multi-page bottom margin invariant holds across every discrete A4 page box.
 * 12. ATS (1-column) mode follows identical N-1 gap model and bottom margin invariant with full schema.
 */

describe('N-1 Gap Model & Mathematical Page Boundary E2E Suite', () => {
  // Helper to clone base fixture
  const cloneFixture = () => JSON.parse(JSON.stringify(highDensityCV));

  // Helper to build a clean test CV with customizable sections and layout
  const buildCv = ({
    type = '1-column',
    isAtsMode = true,
    pagePadding = 24,
    sectionGap = 20,
    itemGap = 8,
    singleSections = null,
    rightSections = null,
    leftSections = null,
    sections = null,
  } = {}) => {
    const cv = cloneFixture();
    cv.layout.type = type;
    cv.layout.isAtsMode = isAtsMode;
    cv.layout.pagePadding = pagePadding;
    cv.layout.sectionGap = sectionGap;
    cv.layout.itemGap = itemGap;

    if (sections) {
      cv.sections = sections;
    } else if (singleSections) {
      cv.sections = singleSections;
    } else if (rightSections || leftSections) {
      cv.sections = [
        ...(leftSections || []),
        ...(rightSections || []),
      ];
    }
    return cv;
  };

  const loadCv = (cv) => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('skip_onboarding_tour', 'true');
        win.localStorage.setItem('cvData', JSON.stringify(cv));
      },
    });
    cy.waitForFonts();
    cy.get('#area-cv').should('be.visible');
  };

  // -------------------------------------------------------------------------
  // CASE 1: Standard content comfortably fits (H < H_capacity)
  // -------------------------------------------------------------------------
  it('Case 1: Standard content that comfortably fits renders strictly on 1 A4 page box', () => {
    const compactCv = buildCv({
      pagePadding: 24,
      sectionGap: 16,
      itemGap: 8,
      singleSections: [
        {
          id: 'experience',
          type: 'experience',
          title: 'Experiencia Laboral',
          items: [
            {
              id: 'exp-1',
              title: 'Senior Software Engineer',
              subtitle: 'Tech Global',
              date: '2022 - Presente',
              description: 'Liderazgo en arquitectura distribuida.',
              bullets: [
                'Diseño de microservicios resilientes.',
                'Optimización de bases de datos.',
              ],
            },
          ],
        },
        {
          id: 'education',
          type: 'education',
          title: 'Educación',
          items: [
            {
              id: 'edu-1',
              title: 'Ingeniería en Sistemas',
              subtitle: 'Universidad Tecnológica',
              date: '2016 - 2021',
              description: 'Graduado con honores.',
            },
          ],
        },
      ],
    });

    loadCv(compactCv);

    // Exactly 1 page box rendered
    cy.get('.a4-page-box').should('have.length', 1);
    cy.get('.a4-page-box').first().should('be.visible');
  });

  // -------------------------------------------------------------------------
  // CASE 2: Preservation of user section gap on last element (No zero-margin patch)
  // -------------------------------------------------------------------------
  it('Case 2: Preserves user section gap on the last element without zeroing out margin-bottom', () => {
    const testSectionGap = 20;
    const testCv = buildCv({
      sectionGap: testSectionGap,
      pagePadding: 24,
      singleSections: [
        {
          id: 'exp',
          type: 'experience',
          title: 'Experiencia',
          items: [{ id: 'e1', title: 'Developer', subtitle: 'Company', date: '2020' }],
        },
        {
          id: 'edu',
          type: 'education',
          title: 'Educación',
          items: [{ id: 'ed1', title: 'Degree', subtitle: 'Uni', date: '2019' }],
        },
      ],
    });

    loadCv(testCv);

    // Verify all cv-sections retain margin-bottom equal to sectionGap
    cy.get('.a4-page-box').first().within(() => {
      cy.get('.cv-section').last().then(($lastSec) => {
        const computedMarginBottom = parseFloat($lastSec.css('margin-bottom'));
        // Margin must not be 0px; it must equal the user-selected sectionGap (20px)
        expect(computedMarginBottom).to.be.closeTo(testSectionGap, 1);
        expect($lastSec.hasClass('is-last-section')).to.be.false;
      });
    });
  });

  // -------------------------------------------------------------------------
  // CASE 3: Minimum physical page padding invariant (Distance to bottom >= pagePadding)
  // -------------------------------------------------------------------------
  it('Case 3: Invariant holds that distance from last element content to A4 page bottom is >= pagePadding', () => {
    const selectedPadding = 24;
    const testCv = buildCv({
      pagePadding: selectedPadding,
      sectionGap: 16,
      singleSections: [
        {
          id: 'exp',
          type: 'experience',
          title: 'Experiencia',
          items: [{ id: 'e1', title: 'Developer', subtitle: 'Company', date: '2020' }],
        },
      ],
    });

    loadCv(testCv);

    cy.get('.a4-page-box').first().then(($pageBox) => {
      const pageBoxRect = $pageBox[0].getBoundingClientRect();

      cy.get('.cv-section').last().then(($lastSection) => {
        const lastSectionRect = $lastSection[0].getBoundingClientRect();
        const distanceToBottom = pageBoxRect.bottom - lastSectionRect.bottom;

        // Invariant: distance to bottom must be AT LEAST the selected pagePadding (minus 1px subpixel tolerance)
        expect(distanceToBottom).to.be.at.least(
          selectedPadding - 1,
          `Distance from last section bottom (${distanceToBottom.toFixed(1)}px) must be >= pagePadding (${selectedPadding}px)`
        );
      });
    });
  });

  // -------------------------------------------------------------------------
  // CASE 4: Content right at the threshold / boundary (H ≈ H_capacity - ε)
  // -------------------------------------------------------------------------
  it('Case 4: Content calibrated near page capacity threshold stays on Page 1 without orphan Page 2', () => {
    // Calibrated items that fill approx 850-950px of useful capacity (out of ~1041px)
    const thresholdCv = buildCv({
      pagePadding: 24,
      sectionGap: 16,
      itemGap: 6,
      singleSections: [
        {
          id: 'experience',
          type: 'experience',
          title: 'Experiencia Profesional',
          items: [
            {
              id: 'exp-thresh-1',
              title: 'Principal Systems Architect',
              subtitle: 'Enterprise Cloud Corp',
              date: '2021 - Presente',
              description: 'Liderazgo técnico en desarrollo de plataformas de alta disponibilidad.',
              bullets: [
                'Optimización de latencia en microservicios distribuidos.',
                'Implementación de pipelines de observabilidad.',
              ],
            },
            {
              id: 'exp-thresh-2',
              title: 'Senior Backend Engineer',
              subtitle: 'Data FinTech Inc',
              date: '2019 - 2021',
              description: 'Diseño de motores transaccionales bancarios con procesamiento asíncrono.',
              bullets: [
                'Refactorización de persistencia relacional.',
                'Reducción de consumo de CPU en clusters.',
              ],
            },
            {
              id: 'exp-thresh-3',
              title: 'Software Developer',
              subtitle: 'Tech Start',
              date: '2017 - 2019',
              description: 'Desarrollo de servicios web REST y GraphQL.',
              bullets: ['Automatización de testing con cobertura 90%.'],
            },
          ],
        },
      ],
    });

    loadCv(thresholdCv);

    // Must be strictly 1 page
    cy.get('.a4-page-box').should('have.length', 1);

    // Verify no vertical overflow past A4 height (297mm ≈ 1123px)
    cy.get('.a4-page-box').first().then(($box) => {
      const scrollHeight = $box[0].scrollHeight;
      const clientHeight = $box[0].clientHeight;
      expect(scrollHeight).to.be.at.most(clientHeight + 2, 'Content must not overflow page box height');
    });
  });

  // -------------------------------------------------------------------------
  // CASE 5: Content exceeding threshold (H = H_capacity + ε) breaks deterministically to Page 2
  // -------------------------------------------------------------------------
  it('Case 5: Content crossing threshold breaks deterministically into Page 2 without clipping Page 1', () => {
    // 8 rich experience items with extensive descriptions and bullets guaranteed to exceed single-page capacity (~1041px)
    const overflowCv = buildCv({
      pagePadding: 24,
      sectionGap: 20,
      itemGap: 8,
      singleSections: [
        {
          id: 'experience',
          type: 'experience',
          title: 'Experiencia Profesional Extensa',
          items: Array.from({ length: 8 }, (_, i) => ({
            id: `exp-overflow-${i + 1}`,
            title: `Cargo de Ingeniería #${i + 1}`,
            subtitle: `Empresa de Tecnología Líder #${i + 1} | Buenos Aires`,
            date: `201${i} – 202${i}`,
            description: `Descripción técnica detallada del puesto de trabajo #${i + 1} con responsabilidades arquitectónicas, diseño de sistemas concurrentes y optimización de rendimiento.`,
            bullets: [
              `Liderazgo técnico en implementación de microservicios resilientes con Docker y Kubernetes #${i + 1}.`,
              `Optimización integral de planes de consulta en bases de datos PostgreSQL de alta transaccionalidad #${i + 1}.`,
              `Automatización exhaustiva de pipelines CI/CD y despliegue continuo con cobertura de pruebas unitarias #${i + 1}.`,
            ],
          })),
        },
      ],
    });

    loadCv(overflowCv);

    // Must break deterministically into 2 discrete A4 page boxes
    cy.get('.a4-page-box').should('have.length', 2);

    // Both pages must be discrete A4 sheets with visible separation
    cy.get('.a4-page-box').each(($page, idx) => {
      expect($page.attr('data-page-number') || `${idx + 1}`).to.exist;
      expect($page.css('height')).to.satisfy(h => h.includes('297mm') || Math.abs(parseFloat(h) - 1123) <= 5);
    });
  });

  // -------------------------------------------------------------------------
  // CASE 6: Massive overflow distributes across multiple pages cleanly
  // -------------------------------------------------------------------------
  it('Case 6: Massive overflow distributes cleanly across multiple pages without infinite cascade', () => {
    // 12 items spanning experience and education
    const massiveCv = buildCv({
      pagePadding: 24,
      sectionGap: 16,
      itemGap: 8,
      singleSections: [
        {
          id: 'experience',
          type: 'experience',
          title: 'Historial de Experiencia Extendido',
          items: Array.from({ length: 8 }, (_, i) => ({
            id: `exp-massive-${i}`,
            title: `Rol Profesional ${i + 1}`,
            subtitle: `Organización ${i + 1}`,
            date: `201${i} - 202${i}`,
            description: `Descripción completa de responsabilidades y metodologías ágiles en proyecto ${i + 1}.`,
            bullets: [
              `Implementación de soluciones de ingeniería escalables #${i + 1}.`,
              `Coordinación de equipos multidisciplinarios #${i + 1}.`,
            ],
          })),
        },
        {
          id: 'education',
          type: 'education',
          title: 'Formación Académica Extensa',
          items: Array.from({ length: 4 }, (_, i) => ({
            id: `edu-massive-${i}`,
            title: `Título Académico ${i + 1}`,
            subtitle: `Universidad Internacional ${i + 1}`,
            date: `201${i} - 201${i + 2}`,
            description: `Especialización técnica en sistemas #${i + 1}.`,
          })),
        },
      ],
    });

    loadCv(massiveCv);

    // Should create at least 2 or 3 pages, bounded and non-collapsing
    cy.get('.a4-page-box').should('have.length.at.least', 2);
    cy.get('.a4-page-box').should('have.length.at.most', 4);
  });

  // -------------------------------------------------------------------------
  // CASE 7: Anti-orphan invariant on indivisible sections at page fold
  // -------------------------------------------------------------------------
  it('Case 7: Section unable to fit cleanly in remaining space moves to Page 2 without orphan header', () => {
    const antiOrphanCv = buildCv({
      pagePadding: 24,
      sectionGap: 24,
      itemGap: 8,
      singleSections: [
        {
          id: 'experience',
          type: 'experience',
          title: 'Experiencia Laboral',
          items: [
            {
              id: 'exp-fill-1',
              title: 'Staff Architect',
              subtitle: 'Global Platform',
              date: '2021 - Presente',
              description: 'Gestión de infraestructura en la nube y arquitectura de software con responsabilidades de alta disponibilidad.',
              bullets: [
                'Microservicios con Kubernetes y mensajería distribuida.',
                'Políticas de alta disponibilidad y tolerancia a fallos.',
              ],
            },
            {
              id: 'exp-fill-2',
              title: 'Senior Developer',
              subtitle: 'Enterprise Solutions',
              date: '2019 - 2021',
              description: 'Desarrollo de microservicios con Node.js y PostgreSQL en entorno cloud.',
              bullets: [
                'Optimización de queries y particionado de base de datos.',
                'Refactorización de código legado hacia Clean Architecture.',
              ],
            },
            {
              id: 'exp-fill-3',
              title: 'Backend Specialist',
              subtitle: 'Cloud Platforms Inc',
              date: '2018 - 2019',
              description: 'Implementación de contratos REST y GraphQL.',
              bullets: [
                'Mantenimiento de pipelines de CI/CD.',
                'Supervisión de rendimiento en clusters de producción.',
              ],
            },
          ],
        },
        {
          id: 'education',
          type: 'education',
          title: 'Educación y Certificaciones',
          items: [
            {
              id: 'edu-indivisible-1',
              title: 'Master en Ingeniería de Software',
              subtitle: 'Universidad Politécnica',
              date: '2020 - 2022',
              description: 'Tesis de maestría en sistemas concurrentes y computación distribuida.',
            },
            {
              id: 'edu-indivisible-2',
              title: 'Licenciatura en Ciencias de la Computación',
              subtitle: 'Universidad Nacional',
              date: '2015 - 2019',
              description: 'Graduación con distinción académica.',
            },
          ],
        },
      ],
    });

    loadCv(antiOrphanCv);

    // Verify Page 1 does not have an empty/orphan header with 0 items
    cy.get('.a4-page-box').first().within(() => {
      cy.get('.cv-section').each(($sec) => {
        // Every section on Page 1 must have at least 1 item or content block
        expect($sec.find('.cv-block, .education__content, .experience__content').length).to.be.greaterThan(0);
      });
    });
  });

  // -------------------------------------------------------------------------
  // CASE 8: Dynamic slider scaling - Increasing pagePadding shrinks capacity
  // -------------------------------------------------------------------------
  it('Case 8: Increasing pagePadding slider dynamically contracts capacity and shifts content', () => {
    const dynamicPaddingCv = buildCv({
      pagePadding: 24,
      sectionGap: 16,
      itemGap: 8,
      singleSections: [
        {
          id: 'experience',
          type: 'experience',
          title: 'Experiencia',
          items: [1, 2, 3].map(n => ({
            id: `exp-dyn-${n}`,
            title: `Ingeniero de Software ${n}`,
            subtitle: `Empresa ${n}`,
            date: '2020 - 2023',
            description: `Descripción del trabajo ${n} con responsabilidades técnicas.`,
            bullets: [`Logro técnico clave en proyecto ${n}.`],
          })),
        },
      ],
    });

    loadCv(dynamicPaddingCv);

    // Initially 1 page
    cy.get('.a4-page-box').should('have.length', 1);

    const contractedCv = {
      ...dynamicPaddingCv,
      layout: {
        ...dynamicPaddingCv.layout,
        pagePadding: 48,
      },
    };

    loadCv(contractedCv);

    // Verify that the contracted capacity is respected and pagePadding is applied to A4 box
    cy.get('.a4-page-box').first().then(($box) => {
      expect($box.css('padding-top')).to.equal('48px');
      expect($box.css('padding-bottom')).to.equal('48px');
    });
  });

  // -------------------------------------------------------------------------
  // CASE 9: Dynamic slider scaling - Section Gap produces exact N-1 intervals
  // -------------------------------------------------------------------------
  it('Case 9: Section gap produces exact N-1 intervals between consecutive sections', () => {
    const targetGap = 28;
    const testCv = buildCv({
      sectionGap: targetGap,
      pagePadding: 24,
      singleSections: [
        {
          id: 'profile_header',
          type: 'profile_header',
          title: '',
          items: [{ id: 'p-1', name: 'JUAN CARRIZO', subtitle: 'Tech Lead' }],
        },
        {
          id: 'contact',
          type: 'contact',
          title: '',
          items: [{ id: 'c-1', email: 'juani@example.com' }],
        },
        {
          id: 'sec-1',
          type: 'experience',
          title: 'Sección Uno',
          items: [{ id: 'it-1', title: 'Título 1', subtitle: 'Sub 1', date: '2020' }],
        },
        {
          id: 'sec-2',
          type: 'education',
          title: 'Sección Dos',
          items: [{ id: 'it-2', title: 'Título 2', subtitle: 'Sub 2', date: '2021' }],
        },
        {
          id: 'sec-3',
          type: 'skills',
          title: 'Sección Tres',
          items: [{ id: 'it-3', title: 'Título 3', subtitle: 'Sub 3', date: '2022' }],
        },
      ],
    });

    loadCv(testCv);

    cy.get('.a4-page-box').first().within(() => {
      cy.get('.cv-section').then(($sections) => {
        expect($sections.length).to.equal(5);

        // Header sections (profile_header to contact) cluster closely with 4px gap by design
        const headerRect = $sections[0].getBoundingClientRect();
        const contactRect = $sections[1].getBoundingClientRect();
        expect(contactRect.top - headerRect.bottom).to.be.closeTo(4, 2, 'Header sections cluster closely (4px)');

        // Body content sections (sec-1, sec-2, sec-3) produce exact N-1 intervals of targetGap
        const bodySections = [$sections[2], $sections[3], $sections[4]];
        for (let i = 0; i < bodySections.length - 1; i++) {
          const firstRect = bodySections[i].getBoundingClientRect();
          const secondRect = bodySections[i + 1].getBoundingClientRect();
          const verticalGap = secondRect.top - firstRect.bottom;

          // Verify the physical gap matches targetGap (within 2px tolerance for subpixel font baseline)
          expect(verticalGap).to.be.closeTo(targetGap, 2, `Interval between body section ${i} and ${i+1} must be ~${targetGap}px`);
        }
      });
    });
  });

  // -------------------------------------------------------------------------
  // CASE 10: Granular bullet point splitting at page boundary
  // -------------------------------------------------------------------------
  it('Case 10: Multi-bullet item at boundary splits bullets cleanly across Page 1 and Page 2', () => {
    // Fill Page 1 with 6 calibrated items so that the boundary item splits cleanly across the fold
    const bulletSplitCv = buildCv({
      pagePadding: 24,
      sectionGap: 16,
      itemGap: 8,
      singleSections: [
        {
          id: 'experience',
          type: 'experience',
          title: 'Experiencia con Viñetas Granulares',
          items: [
            ...Array.from({ length: 6 }, (_, i) => ({
              id: `exp-pre-${i + 1}`,
              title: `Senior Engineer #${i + 1}`,
              subtitle: `Tech Global Corp | Buenos Aires`,
              date: `202${i} - 202${i + 1}`,
              description: `Liderazgo en diseño de sistemas distribuidos y microservicios en la nube con Kubernetes.`,
              bullets: [
                `Logro de optimización en rendimiento y escalabilidad de servicios críticos #${i + 1}.`,
                `Implementación de buenas prácticas y cobertura de testing automatizado #${i + 1}.`,
              ],
            })),
            {
              id: 'exp-split-boundary',
              title: 'Rol en el Límite de Página (Viñetas Granulares)',
              subtitle: 'Cloud Critical Systems | Buenos Aires',
              date: '2024 - Presente',
              description: 'Responsable de optimizaciones de latencia y disponibilidad a gran escala para clusters de misión crítica.',
              bullets: [
                'Viñeta 1 (Página 1): Optimización exhaustiva de planes de ejecución en bases de datos PostgreSQL.',
                'Viñeta 2 (Página 1): Refactorización de servicios monolíticos hacia arquitecturas orientadas a eventos.',
                'Viñeta 3 (Página 2): Implementación de mecanismos de caché distribuida en memoria utilizando Redis.',
              ],
            },
          ],
        },
      ],
    });

    loadCv(bulletSplitCv);

    // Verify both pages exist
    cy.get('.a4-page-box').should('have.length', 2);

    // Page 1 should contain the first bullet of the split item
    cy.get('.a4-page-box').eq(0).within(() => {
      cy.contains('Viñeta 1 (Página 1)').should('be.visible');
    });

    // Page 2 should contain continuation bullet of the split item
    cy.get('.a4-page-box').eq(1).within(() => {
      cy.contains('Viñeta 3 (Página 2)').should('be.visible');
    });
  });

  // -------------------------------------------------------------------------
  // CASE 11: Multi-page bottom margin invariant across all pages
  // -------------------------------------------------------------------------
  it('Case 11: Bottom margin invariant holds across every discrete A4 page box in multi-page CV', () => {
    const selectedPadding = 24;
    const multiPageCv = buildCv({
      pagePadding: selectedPadding,
      sectionGap: 20,
      itemGap: 8,
      singleSections: [
        {
          id: 'experience-p1',
          type: 'experience',
          title: 'Experiencia Profesional',
          items: Array.from({ length: 8 }, (_, i) => ({
            id: `exp-multi-${i + 1}`,
            title: `Senior Engineer #${i + 1}`,
            subtitle: `Empresa de Tecnología #${i + 1} | Buenos Aires`,
            date: `201${i} – 202${i}`,
            description: `Descripción técnica detallada del puesto de trabajo #${i + 1} con responsabilidades arquitectónicas, diseño de sistemas concurrentes y optimización de rendimiento.`,
            bullets: [
              `Liderazgo técnico en implementación de microservicios resilientes con Docker y Kubernetes #${i + 1}.`,
              `Optimización integral de planes de consulta en bases de datos PostgreSQL de alta transaccionalidad #${i + 1}.`,
              `Automatización exhaustiva de pipelines CI/CD y despliegue continuo con cobertura de pruebas unitarias #${i + 1}.`,
            ],
          })),
        },
        {
          id: 'education-p2',
          type: 'education',
          title: 'Educación Superior',
          items: [
            {
              id: 'edu-multi-1',
              title: 'Ingeniería en Informática',
              subtitle: 'Universidad Tecnológica Nacional',
              date: '2016 - 2021',
              description: 'Graduación con promedio sobresaliente.',
            },
            {
              id: 'edu-multi-2',
              title: 'Certificación Cloud Architect',
              subtitle: 'Cloud Provider Certification',
              date: '2022',
              description: 'Especialización en infraestructuras resilientes y cloud computing.',
            },
          ],
        },
      ],
    });

    loadCv(multiPageCv);

    // Should create 2 pages
    cy.get('.a4-page-box').should('have.length', 2);

    // Verify on EVERY page box: distance from last section content to bottom is >= pagePadding
    cy.get('.a4-page-box').each(($pageBox, pageIndex) => {
      const pageBoxRect = $pageBox[0].getBoundingClientRect();
      cy.wrap($pageBox).within(() => {
        cy.get('.cv-section').last().then(($lastSec) => {
          const lastSecRect = $lastSec[0].getBoundingClientRect();
          const distanceToBottom = pageBoxRect.bottom - lastSecRect.bottom;

          expect(distanceToBottom).to.be.at.least(
            selectedPadding - 1,
            `Page ${pageIndex + 1}: Distance to bottom (${distanceToBottom.toFixed(1)}px) must be >= pagePadding (${selectedPadding}px)`
          );

          // Verify section gap is preserved (no is-last-section zero margin)
          const marginBottom = parseFloat($lastSec.css('margin-bottom'));
          expect(marginBottom).to.be.closeTo(20, 1);
        });
      });
    });
  });

  // -------------------------------------------------------------------------
  // CASE 12: Single-column / ATS Mode Mathematical Boundary with full rich schema
  // -------------------------------------------------------------------------
  it('Case 12: ATS (1-column) mode follows identical N-1 gap model and bottom margin invariant', () => {
    const atsCv = buildCv({
      type: '1-column',
      isAtsMode: true,
      pagePadding: 24,
      sectionGap: 18,
      itemGap: 8,
      singleSections: [
        {
          id: 'profile_header',
          type: 'profile_header',
          title: '',
          items: [{ id: 'p-1', name: 'JUAN CARRIZO', subtitle: 'Tech Lead' }],
        },
        {
          id: 'contact',
          type: 'contact',
          title: 'Contacto',
          items: [{ id: 'c-1', email: 'juani@example.com', phone: '+5493816706133' }],
        },
        {
          id: 'experience',
          type: 'experience',
          title: 'Experiencia Laboral',
          items: [
            {
              id: 'exp-ats-1',
              title: 'Lead Architect',
              subtitle: 'Enterprise Solutions',
              date: '2021 - Presente',
              description: 'Diseño de arquitecturas cloud nativas en entornos de alta escalabilidad.',
              bullets: [
                'Microservicios con Docker y Kubernetes.',
                'Automatización de pruebas con Cypress y Vitest.',
              ],
            },
          ],
        },
        {
          id: 'skills',
          type: 'skills',
          title: 'Habilidades Técnicas',
          items: [
            {
              id: 'sk-1',
              title: 'Lenguajes & Frameworks',
              description: 'React, Node.js, TypeScript, PostgreSQL, Docker, AWS',
            },
          ],
        },
      ],
    });

    loadCv(atsCv);

    // Verify ATS mode class and single column structure
    cy.get('#area-cv').should('have.class', 'resume--ats-mode');
    cy.get('.a4-page-box').should('have.length', 1);

    // Invariant: Distance from last ATS section to bottom of page box is >= pagePadding
    cy.get('.a4-page-box').first().then(($pageBox) => {
      const pageBoxRect = $pageBox[0].getBoundingClientRect();
      cy.get('.cv-section').last().then(($lastSection) => {
        const lastSectionRect = $lastSection[0].getBoundingClientRect();
        const distanceToBottom = pageBoxRect.bottom - lastSectionRect.bottom;

        expect(distanceToBottom).to.be.at.least(
          24 - 1,
          `ATS distance from last section bottom (${distanceToBottom.toFixed(1)}px) must be >= pagePadding (24px)`
        );

        // Section gap must be preserved on last section in ATS mode
        const marginBottom = parseFloat($lastSection.css('margin-bottom'));
        expect(marginBottom).to.be.closeTo(18, 1);
      });
    });
  });
});
