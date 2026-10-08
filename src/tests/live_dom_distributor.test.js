import { describe, it, expect } from 'vitest';
import { distributeSectionsToPages, estimateItemHeight, estimateItemBulletsHeight } from '../utils/pageDistributor';

describe('Live DOM Measurement Page Distribution', () => {
  it('uses exact measured DOM heights when provided, eliminating artificial gaps', () => {
    const cvData = {
      layout: {
        type: '1-column',
        isAtsMode: true,
        fontFamily: 'Inter',
        fontScale: 1.0,
        titleScale: 1.0,
        bodyScale: 1.0,
        listScale: 1.0,
        lineHeight: 1.3,
        pagePadding: 24,
        sectionGap: 20,
        itemGap: 8,
      },
      profile: {
        name: 'JUAN IGNACIO CARRIZO',
        subtitle: 'Desarrollador Web Back-End | Ingeniero en Informática',
      },
      sections: [
        {
          id: 'profile_header',
          type: 'profile_header',
          title: '',
          column: 'left',
          items: [
            {
              id: 'prof1',
              name: 'JUAN IGNACIO CARRIZO',
              subtitle: 'Desarrollador Web Back-End | Ingeniero en Informática',
              contacts: [
                { id: 'c1', type: 'email', value: 'juanicarrizo97@gmail.com' },
                { id: 'c2', type: 'phone', value: '+54 381 000 0000' },
                { id: 'c3', type: 'location', value: 'Tucumán, Argentina' },
                { id: 'c4', type: 'linkedin', value: 'linkedin.com/in/juani' },
                { id: 'c5', type: 'github', value: 'github.com/juani' },
              ],
            },
          ],
        },
        {
          id: 'about_section',
          type: 'about',
          title: 'PERFIL PROFESIONAL',
          column: 'left',
          items: [
            {
              id: 'about1',
              description: 'Ingeniero de Software Senior con más de 7 años de experiencia diseñando y operando sistemas distribuidos, microservicios de alta concurrencia y arquitecturas reactivas en entornos tecnológicos competitivos.',
            },
          ],
        },
        {
          id: 'projects',
          type: 'list',
          title: 'PROYECTOS DESTACADOS',
          column: 'right',
          items: [
            {
              id: 'proj1',
              title: 'Ressume',
              subtitle: 'React, Vite, CSS Paged Media',
              description: 'SPA reactiva para diseño y personalización de currículums, con renderizado PDF y sistema Drag & Drop.',
              bullets: [
                'Implementé un diseño dual con contenido sincronizado entre la maquetación en 2 columnas y el formato optimizado para ATS, con gestión local de versiones e historial',
                'Diseñé un motor de generación de prompts a partir del contenido del CV para exportar a modelos de lenguaje (LLM) externos e importar sus respuestas, agilizando la edición',
              ],
            },
            {
              id: 'proj2',
              title: 'Creador de encuestas (estilo Google Forms)',
              subtitle: 'Laravel, MySQL, Vue.js',
              description: 'Creador de encuestas (estilo Google Forms) con múltiples tipos de preguntas, roles de usuario y dashboards de resultados para administradores.',
              bullets: [],
            },
          ],
        },
        {
          id: 'education',
          type: 'education',
          title: 'EDUCACIÓN',
          column: 'right',
          items: [
            { id: 'edu1', title: 'Ingeniería en Informática (En etapa de tesis final)', subtitle: 'UNT' },
            { id: 'edu2', title: 'Diplomatura en Ingeniería de Datos', subtitle: 'UNT' },
            { id: 'edu3', title: 'Programador Universitario', subtitle: 'UNT', date: '2021-2024' },
          ],
        },
        {
          id: 'skills',
          type: 'skills',
          title: 'HABILIDADES TÉCNICAS',
          column: 'left',
          items: [
            { id: 's1', title: 'Backend', description: 'PHP (Laravel), Python, RESTful APIs' },
            { id: 's2', title: 'Bases de Datos', description: 'Oracle, PL/SQL, PostgreSQL, Explain Plan, Indexación' },
            { id: 's3', title: 'DevOps e Infraestructura', description: 'Docker, Docker Compose, CI/CD (GitHub Actions), Terraform, Ansible, Linux, Git, GitHub' },
            { id: 's4', title: 'Frontend', description: 'JavaScript, React, HTML5, CSS3, Material UI' },
            { id: 's5', title: 'Herramientas y Metodologías', description: 'GitHub Projects, ClickUp, Postman, Agile, asistentes de IA para desarrollo (Claude, Gemini)' },
            { id: 's6', title: 'Base Académica (Ingeniería en Informática)', description: 'C# (.NET), MySQL, Stored Procedures, Triggers, Scrum' },
          ],
        },
        {
          id: 'experience',
          type: 'list',
          title: 'EXPERIENCIA LABORAL',
          column: 'right',
          items: [
            {
              id: 'exp1',
              title: 'Desarrollador Web Back-End (PHP, Laravel, JS)',
              subtitle: 'Dirección General de Catastro',
              date: 'Julio 2025 - Actualidad',
              bullets: [
                'Diseñé una arquitectura de transición que encapsula procesos legacy...',
                'Reduje los tiempos de respuesta de consultas críticas en Oracle...',
                'Eliminé cuellos de botella por consultas N+1 en aplicaciones Laravel 7...',
              ],
            },
          ],
        },
        {
          id: 'certificates',
          type: 'simple_list',
          title: 'CERTIFICACIONES',
          column: 'right',
          items: [
            { id: 'cert1', text: 'Introducción al Análisis de Datos con Python - Desafío LATAM (2025)' },
            { id: 'cert2', text: 'Fundamentos de IA con IBM Watson Studio - Cisco Networking Academy (2025)' },
          ],
        },
        {
          id: 'languages',
          type: 'simple_list',
          title: 'IDIOMAS',
          column: 'left',
          items: [
            { id: 'lang1', text: 'Inglés: C2 (EF SET, 2024)' },
          ],
        },
      ],
    };

    // Real measured DOM heights from the browser render
    const measuredHeights = {
      'prof1': 70,
      'header_about_section': 44,
      'about1': 60,
      'header_projects': 44,
      'proj1': 160,
      'proj2': 55,
      'header_education': 44,
      'edu1': 35,
      'edu2': 35,
      'edu3': 35,
      'header_skills': 44,
      's1': 24,
      's2': 24,
      's3': 37,
      's4': 20,
      's5': 38,
      's6': 38,
      'header_experience': 44,
      'exp1': 180,
      'header_certificates': 44,
      'cert1': 25,
      'cert2': 25,
      'header_languages': 44,
      'lang1': 22,
    };

    const options = {
      isAtsMode: true,
      mode: 'ats',
      isEditor: true,
      omitContinuationHeader: true,
      omitContinuationTitle: true,
      uniqueContinuationIds: true,
      measuredHeights,
    };

    const pages = distributeSectionsToPages(cvData, options);

    // All 6 skills MUST fit on Page 1
    const p1Skills = pages[0].singleSections.find(s => s.id === 'skills');
    expect(p1Skills).toBeDefined();
    expect(p1Skills.items.length).toBe(6);
    expect(p1Skills.items.map(i => i.id)).toEqual(['s1', 's2', 's3', 's4', 's5', 's6']);
    expect(pages.length).toBe(2);
  });

  it('prevents circular measurement poisoning: splittable items calculate base + bullets and never return partial wrapper height', () => {
    const item = {
      id: 'exp_1',
      title: 'Senior Engineer',
      bullets: ['Bullet 1', 'Bullet 2', 'Bullet 3', 'Bullet 4'],
    };

    // Simulated poisoned cache where exp_1 has a partial measurement (e.g. 50px from P1)
    const poisonedMeasuredHeights = {
      'exp_1': 50, // Poisoned partial wrapper height
      'base_exp_1': 40,
      'exp_1_bullet_0': 25,
      'exp_1_bullet_1': 25,
      'exp_1_bullet_2': 25,
      'exp_1_bullet_3': 25,
    };

    const options = {
      measuredHeights: poisonedMeasuredHeights,
    };

    // For splittable section ('experience'), estimateItemHeight MUST NOT return 50
    // It must return base (40) + bullets (25 * 4 = 100) = 140
    const totalH = estimateItemHeight(item, 'experience', options);
    expect(totalH).toBe(140);
  });

  it('correctly maps continuation item bullets with bulletStartIndex offset', () => {
    const contBullets = ['Bullet 3', 'Bullet 4'];
    const measuredHeights = {
      'exp_1_bullet_0': 20,
      'exp_1_bullet_1': 20,
      'exp_1_bullet_2': 35,
      'exp_1_bullet_3': 40,
    };

    const options = { measuredHeights };
    // Continuation item with startOffset = 2 (points to bullets 2 and 3)
    const bulletsH = estimateItemBulletsHeight(contBullets, 'experience', options, 'exp_1', 2);
    expect(bulletsH).toBe(75); // 35 + 40
  });
});

