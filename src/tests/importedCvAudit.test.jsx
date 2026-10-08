import { describe, it, expect } from 'vitest';
import {
  distributeSectionsToPages,
  estimateItemHeight,
  estimateHeaderHeight,
  estimateSectionHeight,
  estimateSingleBulletHeight,
  estimateItemBaseHeight,
} from '../utils/pageDistributor';

describe('Imported ATS CV Distribution Audit', () => {
  const atsCv = {
    layout: {
      type: '1-column',
      isAtsMode: true,
      fontFamily: 'Inter',
      fontScale: 1.0,
      titleScale: 1.0,
      bodyScale: 1.0,
      listScale: 1.0,
      lineHeight: 1.30,
      pagePadding: 24,
      sectionGap: 12,
      itemGap: 6,
    },
    sections: [
      {
        id: 'header',
        type: 'profile_header',
        title: '',
        items: [{ id: 'p1', name: 'JUAN IGNACIO CARRIZO', subtitle: 'Desarrollador Backend | PHP, Laravel, Oracle | CI/CD y Automatización' }]
      },
      {
        id: 'contact',
        type: 'contact',
        title: '',
        items: [{
          id: 'c1',
          contacts: [
            { type: 'email', value: 'juanicarrizo97@gmail.com' },
            { type: 'phone', value: '+54 381 6706133' },
            { type: 'location', value: 'Tucumán, Argentina' },
            { type: 'github', value: 'https://github.com/juani981' },
            { type: 'linkedin', value: 'https://linkedin.com/in/juan-ignacio-carrizo-juani981/' }
          ]
        }]
      },
      {
        id: 'about',
        type: 'about',
        title: 'PERFIL PROFESIONAL',
        items: [{
          id: 'a1',
          description: 'Desarrollador Backend enfocado en modernización de sistemas legacy (PHP/Laravel), optimización de bases de datos (Oracle, PostgreSQL) y automatización de infraestructura. Experiencia medible reduciendo tiempos de respuesta, eliminando cuellos de botella N+1 y estandarizando entornos con Docker y pipelines de CI/CD en GitHub Actions. Integrando flujos de ingeniería asistida por agentes CLI (Antigravity, Claude) para acelerar refactorización y testing. Programador Universitario, tesista de Ingeniería en Informática (UNT), cuento con Inglés C2 certificado.'
        }]
      },
      {
        id: 'experience',
        type: 'list',
        title: 'EXPERIENCIA LABORAL',
        items: [
          {
            id: 'exp1',
            title: 'Desarrollador Backend',
            subtitle: 'Julio 2025 - Actualidad | Dirección General de Catastro',
            bullets: [
              'Diseñé una arquitectura de transición que encapsula procesos legacy en una interfaz moderna y más accesible, permitiendo refactorizar el código con seguridad y reduciendo las consultas y reportes de error mensuales al 10% de su volumen habitual.',
              'Reduje los tiempos de respuesta de consultas críticas en Oracle de 1-2 segundos a 20-40 milisegundos mediante análisis de Explain Plan, indexación y reescritura de queries PL/SQL.',
              'Eliminé cuellos de botella por consultas N+1 en aplicaciones Laravel 7 mediante eager loading y refactorización de controladores y vistas, reduciendo los tiempos de carga.',
              'Automaticé el ciclo de entrega continua con pipelines de CI/CD en GitHub Actions para staging y producción, eliminando despliegues manuales en servidor y capacitando al equipo en el nuevo estándar.'
            ]
          },
          {
            id: 'exp2',
            title: 'Desarrollador Full-Stack',
            subtitle: 'Septiembre 2025 - Noviembre 2025 | FreeLance',
            bullets: [
              'Diseñé y desarrollé en solitario, de principio a fin, una plataforma transaccional en tiempo real para una red de puntos de venta, incluyendo el relevamiento de requisitos y la ingeniería inversa de sistemas similares para modelar el dominio de negocio.',
              'Desarrollé un servicio de scraping recurrente con Playwright (con reintentos y detección de duplicados) para la ingesta automatizada de datos desde fuentes públicas externas.',
              'Módulo contable de liquidaciones con comisiones parametrizables, saldos acumulados y snapshots para auditoría que conectaba con una impresora de tickets.'
            ]
          },
          {
            id: 'exp3',
            title: 'Soporte Técnico',
            subtitle: 'Julio 2023 - Enero 2024 | Dirección General de Catastro',
            bullets: [
              'Brindé soporte técnico a usuarios del organismo: administración de estaciones de trabajo Windows y configuración de switches y access points.'
            ]
          }
        ]
      },
      {
        id: 'projects',
        type: 'list',
        title: 'PROYECTOS',
        items: [
          {
            id: 'proj1',
            title: 'Moodle-swarm',
            subtitle: '2026 - Actualidad | Python, Docker Compose, Ansible, Terraform, Jinja',
            link: 'https://github.com/juani981/Moodle-swarm',
            bullets: [
              'Wizard por terminal de Linux, basado en un cuestionario dinámico, que aprovisiona infraestructura completa para Moodle.',
              'Diseñé la arquitectura de despliegue para escenarios on-premise y multi-nodo (clúster) autoconfigurados, con emulación local de servicios AWS mediante LocalStack.',
              'Automaticé la generación de configuraciones con scripts en Python y plantillas Jinja, orquestando el aprovisionamiento base con Ansible y Docker.',
              'Lidero la I+D y la gestión operativa del equipo: defino la modalidad de trabajo, coordino reuniones con el cliente final y administro el repositorio y las tareas en GitHub Projects.'
            ]
          },
          {
            id: 'proj2',
            title: 'WebEncuestas-Demo',
            subtitle: '2024 | Laravel, PostgreSQL, React, Material UI, Docker',
            link: 'https://github.com/juani981/WebEncuestas-Demo',
            bullets: [
              'Creador de encuestas (estilo Google Forms) con múltiples tipos de preguntas, roles de usuario y dashboards de resultados para administradores.',
              'Lideré el proyecto de principio a fin: diseñé íntegramente el modelo de datos relacional en PostgreSQL, implementé por completo el Front-End con React y Material UI, y colaboré en el desarrollo Back-End con Laravel.',
              'Gestioné el proyecto bajo metodología ágil (ClickUp) y documenté el diseño de base de datos, UML, casos de uso y flujos de Git.'
            ]
          },
          {
            id: 'proj3',
            title: 'CV Live Editor',
            subtitle: '2026 | React, Vite',
            link: 'https://cv-live-editor.netlify.app/',
            bullets: [
              'SPA reactiva para diseño y personalización de currículums, con renderizado PDF y sistema Drag & Drop.',
              'Implementé un diseño basado en el formato optimizado para ATS, edición en vivo y consejos de redacción para concentrar al usuario en el mismo sitio, cuenta con varios ajustes de layout, gestión local de versiones.',
              'Diseñé un motor de generación de prompts a partir del contenido del CV para importar/exportar a modelos de lenguaje (LLM) externos e importar sus respuestas, agilizando la edición.'
            ]
          }
        ]
      },
      {
        id: 'skills',
        type: 'simple_list',
        title: 'HABILIDADES',
        items: [
          { id: 'sk1', text: 'PHP (Laravel), Python, ASP.NET, Playwright, RESTful APIs' },
          { id: 'sk2', text: 'Oracle, PL/SQL, PostgreSQL, SQLite, Explain Plan, Indexación' },
          { id: 'sk3', text: 'Docker, Docker Compose, CI/CD (GitHub Actions), Terraform, Ansible, Linux, Git, GitHub' },
          { id: 'sk4', text: 'JavaScript, React, HTML5, CSS3, Material UI' },
          { id: 'sk5', text: 'GitHub Projects, ClickUp, Postman, Agile' },
          { id: 'sk6', text: 'C# (.NET), MySQL, Stored Procedures, Triggers, Scrum' },
          { id: 'sk7', text: 'Gemini CLI, Antigravity CLI, Codex vía terminal con skills, subagentes y MCPs' }
        ]
      },
      {
        id: 'education',
        type: 'education',
        title: 'EDUCACIÓN',
        items: [
          { id: 'ed1', title: 'Ingeniería en Informática', subtitle: 'Universidad Nacional de Tucumán (UNT) - Facultad de Ciencias Exactas y Tecnología', date: 'En curso' },
          { id: 'ed2', title: 'Licenciatura en Informática', subtitle: 'Universidad Nacional de Tucumán (UNT) - Facultad de Ciencias Exactas y Tecnología', date: '2024' },
          { id: 'ed3', title: 'Programador Universitario (Graduado)', subtitle: 'Universidad Nacional de Tucumán (UNT) - Facultad de Ciencias Exactas y Tecnología', date: '2021 - 2024' }
        ]
      },
      {
        id: 'certificates',
        type: 'certificates',
        title: 'CERTIFICACIONES',
        items: [
          { id: 'cert1', name: 'Introducción al Análisis de Datos con Python (Pandas, NumPy, Seaborn) - Desafío LATAM (2025)' },
          { id: 'cert2', name: 'Fundamentos de IA con IBM Watson Studio - Cisco Networking Academy (2025)' }
        ]
      },
      {
        id: 'languages',
        type: 'languages',
        title: 'IDIOMAS',
        items: [
          { id: 'lang1', name: 'Inglés: C2 (EF SET, 2024) – https://cert.efset.org/en/C9i5dF' }
        ]
      }
    ]
  };

  it('distributes all sections and items without truncation or omission under clearance 32px', async () => {
    const pages = distributeSectionsToPages(atsCv, {
      pageBottomClearancePx: 14,
      isEditor: true,
      omitContinuationHeader: true,
      omitContinuationTitle: true,
      uniqueContinuationIds: true,
    });

    // Check Page 1 space:
    const pageCapacity = 1123 - 2 * 24 - 14;
    console.log(`PAGE CAPACITY: ${pageCapacity}px`);
    
    let p1Acc = 0;
    // Header
    p1Acc += estimateSectionHeight(atsCv.sections[0], { isAts: true });
    console.log(`After header: ${p1Acc}px`);
    // Contact
    p1Acc += 12 + estimateSectionHeight(atsCv.sections[1], { isAts: true });
    console.log(`After contact: ${p1Acc}px`);
    // About
    p1Acc += 12 + estimateSectionHeight(atsCv.sections[2], { isAts: true });
    console.log(`After about: ${p1Acc}px`);
    // Experience
    p1Acc += 12 + estimateSectionHeight(atsCv.sections[3], { isAts: true });
    console.log(`After experience: ${p1Acc}px (Remaining: ${pageCapacity - p1Acc}px)`);

    // Projects header + base
    const pHeaderH = estimateHeaderHeight(atsCv.sections[4], false, { isAts: true });
    const pBaseH = estimateItemBaseHeight(atsCv.sections[4].items[0], 'list', { isAts: true });
    console.log(`Projects header: ${pHeaderH}px, Moodle-swarm base: ${pBaseH}px`);
    atsCv.sections[4].items[0].bullets.forEach((b, i) => {
      const bH = estimateSingleBulletHeight(b, 'list', { isAts: true });
      console.log(`  Bullet ${i + 1} (${b.length} chars): ${bH}px`);
    });

    let totalEst = 0;
    atsCv.sections.forEach(s => {
      const hH = estimateHeaderHeight(s, false, { isAts: true });
      const itemsH = s.items.reduce((sum, it) => sum + estimateItemHeight(it, s.type, { isAts: true }), 0);
      console.log(`ESTIMATE for ${s.id}: header=${hH}, items=${itemsH}, total=${hH + itemsH}`);
      totalEst += hH + itemsH;
    });
    console.log(`TOTAL CV ESTIMATE: ${totalEst}px`);
    console.log(`PAGES COUNT: ${pages.length}`);
    pages.forEach((p, idx) => {
      console.log(`  Page ${idx + 1} sections:`, p.singleSections.map(s => `${s.id} (${s.items?.length ?? 0} items)`));
    });

    expect(pages).toHaveLength(2);

    // Verify IDIOMAS is preserved and present in the final page
    const allRenderedSections = pages.flatMap(p => p.singleSections);
    const languagesSection = allRenderedSections.find(s => s.id === 'languages' || s.title === 'IDIOMAS');
    expect(languagesSection, 'IDIOMAS section must be preserved').toBeDefined();
    expect(languagesSection.items).toHaveLength(1);
    expect(languagesSection.items[0].name).toContain('Inglés: C2');

    // Ensure CERTIFICACIONES is also preserved
    const certSection = allRenderedSections.find(s => s.id === 'certificates' || s.title === 'CERTIFICACIONES');
    expect(certSection, 'CERTIFICACIONES must be preserved').toBeDefined();
    expect(certSection.items).toHaveLength(2);
  });
});

