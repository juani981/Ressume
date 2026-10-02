import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { distributeSectionsToPages, estimateItemHeight, estimateSectionHeight } from '../utils/pageDistributor.js';
import { defaultSchema } from '../utils/schema.js';
import { A4PageBox } from '../components/CV/A4PageBox.jsx';

describe('Two-Column Independent Column Pagination & Full Background Extension', () => {
  it('TC1: right column content overflow cleanly cuts and spawns Page 2 with remaining content', () => {
    const cv = {
      ...defaultSchema,
      sections: defaultSchema.sections.map((sec) => {
        if (sec.id === 'experience') {
          return {
            ...sec,
            items: [
              {
                id: 'exp1',
                title: 'Senior Software Architect',
                subtitle: 'Google Cloud Platform | Tech Lead',
                date: '2022 - Present',
                description: 'Liderazgo técnico en la arquitectura de microservicios de alta concurrencia y despliegue distribuido en Kubernetes.',
                bullets: [
                  'Diseño e implementación de arquitectura distribuida procesando más de 100k requests por segundo con latencia sub-50ms.',
                  'Migración de monolito a más de 30 microservicios independientes utilizando gRPC, Go y PostgreSQL con particionado.',
                  'Implementación de pipelines CI/CD automatizados reduciendo el tiempo de despliegue de 45 minutos a 6 minutos.',
                  'Mentoría directa de 12 ingenieros de software e instauración de prácticas rigurosas de Clean Code y TDD.',
                ],
              },
              {
                id: 'exp2',
                title: 'Tech Lead / Senior Fullstack Engineer',
                subtitle: 'MercadoLibre | Core Platform',
                date: '2019 - 2022',
                description: 'Responsable de la infraestructura de pagos y transacciones en tiempo real con tolerancia a fallos.',
                bullets: [
                  'Desarrollo de motor transaccional con arquitectura idempotente para procesamiento de pagos críticos.',
                  'Optimización de consultas en bases de datos relacionales y caching con Redis, bajando la carga de base de datos en un 60%.',
                  'Coordinación con equipos de producto y seguridad para certificación PCI-DSS Nivel 1.',
                ],
              },
              {
                id: 'exp3',
                title: 'Software Developer',
                subtitle: 'Globant | Enterprise Solutions',
                date: '2016 - 2019',
                description: 'Desarrollo de aplicaciones web escalables con React y backend en Node.js.',
                bullets: [
                  'Construcción de interfaces de usuario altamente interactivas con React, Redux y Webpack.',
                  'Diseño de APIs RESTful seguras con autenticación OAuth2 y JWT.',
                ],
              },
            ],
          };
        }
        return sec;
      }),
    };

    const pages = distributeSectionsToPages(cv, { isEditor: true });

    // Must spawn at least 2 pages
    expect(pages.length).toBe(2);

    // Page 1 contains experience (which fits on Page 1)
    expect(pages[0].rightSections.some((s) => s.id === 'experience')).toBe(true);

    // Page 2 contains remainder that did not fit on Page 1 (e.g. certificates)
    expect(pages[1].rightSections.length).toBeGreaterThan(0);
    expect(pages[1].rightSections.some((s) => s.id === 'certificates' || s.id.startsWith('certificates'))).toBe(true);

    // Left sections on Page 1 remain intact and consistent
    expect(pages[0].leftSections.length).toBeGreaterThan(0);
  });

  it('TC2: left column content overflow cleanly cuts and spawns Page 2 with remaining content', () => {
    const cv = {
      ...defaultSchema,
      sections: defaultSchema.sections.map((sec) => {
        if (sec.id === 'skills') {
          return {
            ...sec,
            items: [
              ...sec.items,
              { id: 'sk3', title: 'Cloud & DevOps', description: 'AWS, Docker, Kubernetes, Terraform, CI/CD pipelines, Linux administration' },
              { id: 'sk4', title: 'Bases de Datos', description: 'PostgreSQL, MySQL, Redis, MongoDB, Elasticsearch, Modelado relacional' },
              { id: 'sk5', title: 'Metodologías', description: 'Scrum, Kanban, Agile, TDD, Code Review, Jira, Git' },
            ],
          };
        }
        if (sec.id === 'education') {
          return {
            ...sec,
            items: [
              ...sec.items,
              { id: 'ed2', title: 'Especialización en Seguridad Informática', subtitle: 'Universidad Tecnológica Nacional', date: '2021 - 2022' },
              { id: 'ed3', title: 'Diplomatura en Cloud Architecture', subtitle: 'ITBA', date: '2020' },
            ],
          };
        }
        return sec;
      }),
    };

    const pages = distributeSectionsToPages(cv, { isEditor: true });

    // Left column overflow triggers Page 2
    expect(pages.length).toBe(2);

    // Page 1 contains initial left sections
    expect(pages[0].leftSections.some((s) => s.id === 'profile_header')).toBe(true);
    expect(pages[0].leftSections.some((s) => s.id === 'skills')).toBe(true);

    // Page 2 receives remainder that escaped left column
    expect(pages[1].leftSections.some((s) => s.id === 'education' || s.id === 'languages')).toBe(true);

    // Right sections on Page 1 remain intact
    expect(pages[0].rightSections.some((s) => s.id === 'experience')).toBe(true);
  });

  it('TC3: A4PageBox ensures column backgrounds extend 100% to the bottom on new/subsequent pages', () => {
    const leftBg = '#1e293b';
    const rightBg = '#f8fafc';

    const { container } = render(
      <A4PageBox
        pageNumber={2}
        totalPages={2}
        is2Col={true}
        leftBg={leftBg}
        rightBg={rightBg}
        leftColPercent={33.33}
      />
    );

    const pageBox = container.querySelector('.a4-page-box');
    expect(pageBox).toBeInTheDocument();

    // Check CSS Grid setup with 1fr row and gradient background
    expect(pageBox.style.display).toBe('grid');
    expect(pageBox.style.gridTemplateRows).toBe('1fr');
    expect(pageBox.style.alignItems).toBe('stretch');
    expect(pageBox.style.background).toContain(leftBg);
    expect(pageBox.style.background).toContain(rightBg);

    // Both columns must have height: 100% and min-height: 100%
    const leftCol = container.querySelector('.resume__left');
    const rightCol = container.querySelector('.resume__right');

    expect(leftCol).toBeInTheDocument();
    expect(rightCol).toBeInTheDocument();
    expect(leftCol.style.height).toBe('100%');
    expect(leftCol.style.minHeight).toBe('100%');
    expect(rightCol.style.height).toBe('100%');
    expect(rightCol.style.minHeight).toBe('100%');
  });

  it('TC4: defaultSchema fits cleanly within exactly 1 PageModel', () => {
    const pages = distributeSectionsToPages(defaultSchema, { isEditor: true });
    expect(pages.length).toBe(1);
    expect(pages[0].pageNumber).toBe(1);
    expect(pages[0].leftSections.length).toBeGreaterThan(0);
    expect(pages[0].rightSections.length).toBeGreaterThan(0);
  });

  it('TC5: renders connector line in both pages when an experience item splits across pages', async () => {
    const { ExperienceItemPrintView } = await import('../components/CV/items/ExperienceItem.jsx');
    const { PrintBaseItem } = await import('../components/CV/BaseItem.jsx');

    // Page 1: item is partial and is the last item on page 1 (isLast=true)
    const partialItem = {
      id: 'exp1',
      title: 'Software Architect',
      subtitle: 'Tech Co',
      isPartialItem: true,
      bullets: ['Bullet 1 on page 1'],
    };

    const { container: p1Cont } = render(
      <ExperienceItemPrintView item={partialItem} sectionId="exp" isLast={true} />
    );

    // Connector line MUST be rendered on Page 1 even if isLast=true
    const lineP1 = p1Cont.querySelector('.experience__line');
    expect(lineP1).not.toBeNull();

    // Page 2: item is continuation (isContinuationItem=true) and may also be isLast
    const continuationItem = {
      id: 'exp1__cont_2',
      originalItemId: 'exp1',
      isContinuationItem: true,
      bullets: ['Bullet 2 on page 2'],
    };

    const { container: p2Cont } = render(
      <ExperienceItemPrintView item={continuationItem} sectionId="exp" isLast={true} />
    );

    // Connector line MUST be rendered on Page 2
    const lineP2 = p2Cont.querySelector('.experience__line');
    expect(lineP2).not.toBeNull();

    // PrintBaseItem wrapper must include .item-is-partial and data-is-partial for CSS protection
    const { container: baseCont } = render(
      <PrintBaseItem item={partialItem} sectionId="exp" sectionType="experience" isLast={true} />
    );

    const baseEl = baseCont.querySelector('.cv-block');
    expect(baseEl.classList.contains('item-is-partial')).toBe(true);
    expect(baseEl.getAttribute('data-is-partial')).toBe('true');
    expect(baseCont.querySelector('.experience__line')).not.toBeNull();
  });

  it('TC6: 2 jobs with 4 bullets each in 2-column mode cleanly breaks and spawns Page 2', () => {
    const cv = {
      ...defaultSchema,
      sections: defaultSchema.sections.map((s) => {
        if (s.id === 'experience') {
          return {
            ...s,
            items: [
              {
                id: 'exp1',
                title: 'Senior Frontend Developer',
                subtitle: 'Tech Company | Remote',
                date: '2022 - Present',
                description: 'Liderazgo técnico del equipo frontend en el desarrollo de aplicaciones web complejas y escalables con arquitectura de microfrontends y altos estándares de calidad.',
                bullets: [
                  'Desarrollo de nuevas funcionalidades clave en la plataforma web utilizando React y TypeScript con foco en arquitectura modular y escalable para aplicaciones de gran porte.',
                  'Optimización de rendimiento mejorando las métricas de Core Web Vitals en un 40% mediante carga diferida de módulos y code splitting exhaustivo.',
                  'Implementación de pruebas unitarias y de integración alcanzando 90% de cobertura de código con Vitest y Testing Library en pipelines CI/CD.',
                  'Colaboración estrecha con equipos de diseño de producto y backend en sprints ágiles para definición técnica de interfaces de usuario.',
                ],
              },
              {
                id: 'exp2',
                title: 'Full Stack Developer',
                subtitle: 'Digital Agency | Buenos Aires',
                date: '2020 - 2022',
                description: 'Desarrollo integral de soluciones de software de comercio electrónico de alta concurrencia, garantizando alta disponibilidad y escalabilidad continua en infraestructura cloud.',
                bullets: [
                  'Diseño e implementación de APIs RESTful robustas y seguras utilizando Node.js, Express y bases de datos relacionales PostgreSQL con alta disponibilidad.',
                  'Desarrollo de interfaces de usuario responsivas y completamente accesibles con React, TypeScript y Tailwind CSS para múltiples dispositivos.',
                  'Mantenimiento y despliegue continuo con contenedores Docker en infraestructura en la nube AWS con monitoreo en tiempo real.',
                  'Resolución de incidencias críticas en producción con tiempos de respuesta menores a 2 horas garantizando continuidad operativa.',
                ],
              },
            ],
          };
        }
        return s;
      }),
    };

    const pages = distributeSectionsToPages(cv, { isEditor: true });
    expect(pages.length).toBe(2);
    expect(pages[0].rightSections.some((s) => s.id === 'experience')).toBe(true);
    expect(pages[1].rightSections.length).toBeGreaterThan(0);
  });

  it('TC7: 3 jobs with 3 bullets each in 2-column mode cleanly breaks and spawns Page 2', () => {
    const cv = {
      ...defaultSchema,
      sections: defaultSchema.sections.map((s) => {
        if (s.id === 'experience') {
          return {
            ...s,
            items: [
              {
                id: 'exp1',
                title: 'Senior Frontend Developer',
                subtitle: 'Tech Company | Remote',
                date: '2022 - Present',
                description: 'Liderazgo técnico del equipo frontend en el desarrollo de aplicaciones web complejas y escalables con arquitectura de microfrontends y altos estándares de calidad.',
                bullets: [
                  'Desarrollo de nuevas funcionalidades clave en la plataforma web utilizando React y TypeScript con foco en arquitectura modular y escalable para aplicaciones de gran porte.',
                  'Optimización de rendimiento mejorando las métricas de Core Web Vitals en un 40% mediante carga diferida de módulos y code splitting exhaustivo.',
                  'Implementación de pruebas unitarias y de integración alcanzando 90% de cobertura de código con Vitest y Testing Library en pipelines CI/CD.',
                ],
              },
              {
                id: 'exp2',
                title: 'Full Stack Developer',
                subtitle: 'Digital Agency | Buenos Aires',
                date: '2020 - 2022',
                description: 'Desarrollo de soluciones completas de software con microservicios y bases de datos relacionales garantizando alta disponibilidad.',
                bullets: [
                  'Diseño e implementación de APIs RESTful robustas utilizando Node.js, Express y bases de datos relacionales PostgreSQL.',
                  'Desarrollo de interfaces de usuario responsivas y accesibles con React, TypeScript y Tailwind CSS.',
                  'Mantenimiento y despliegue continuo con contenedores Docker en infraestructura en la nube AWS.',
                ],
              },
              {
                id: 'exp3',
                title: 'Junior Web Developer',
                subtitle: 'Software Factory | Córdoba',
                date: '2018 - 2020',
                description: 'Colaboración en el desarrollo frontend y maquetación de portales corporativos de comercio electrónico.',
                bullets: [
                  'Desarrollo y maquetación de sitios web responsivos con HTML5 semántico, CSS3 avanzado y JavaScript moderno.',
                  'Integración de pasarelas de pago y formularios de contacto dinámicos con validaciones en tiempo real.',
                  'Participación activa en reuniones de planificación de requerimientos técnicos y retrospectivas ágiles.',
                ],
              },
            ],
          };
        }
        return s;
      }),
    };

    const pages = distributeSectionsToPages(cv, { isEditor: true });
    expect(pages.length).toBe(2);
    expect(pages[0].rightSections.some((s) => s.id === 'experience')).toBe(true);
    expect(pages[1].rightSections.length).toBeGreaterThan(0);
  });
});
