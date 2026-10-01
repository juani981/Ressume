import { describe, it, expect } from 'vitest';
import { distributeSectionsToPages, estimateItemBaseHeight, estimateSingleBulletHeight, estimateHeaderHeight, estimateItemHeight } from '../utils/pageDistributor.js';

describe('Experience and Project Section Partitioning Investigation', () => {
  it('runs investigation tests', () => {
    // Test 1: Experience with 2 items, where item 0 fits and item 1's title + bullet 0 fits
    const cvMulti = {
      profile: { name: 'Test' },
      layout: { type: '2-column', pagePadding: 24, sectionGap: 20, itemGap: 8 },
      sections: [
        {
          id: 'sec_spacer',
          type: 'spacer',
          column: 'right',
          height: 800,
        },
        {
          id: 'sec_exp_multi',
          type: 'experience',
          column: 'right',
          title: 'Work Experience',
          items: [
            {
              id: 'job_1',
              title: 'Lead Architect',
              subtitle: 'Enterprise Co',
              bullets: [
                'First bullet for job 1.',
                'Second bullet for job 1.',
              ],
            },
            {
              id: 'job_2',
              title: 'Senior Developer',
              subtitle: 'Tech Corp',
              bullets: [
                'First bullet for job 2 that should fit on Page 1.',
                'Second bullet for job 2 that overflows to Page 2.',
                'Third bullet for job 2 that overflows to Page 2.',
              ],
            },
          ],
        },
      ],
    };

    const pagesMulti = distributeSectionsToPages(cvMulti, { isEditor: true, editorHeadroom: 0 });
    console.log('--- Multi-item Experience test ---');
    console.log('Total pages:', pagesMulti.length);
    pagesMulti.forEach((p, idx) => {
      console.log(`Page ${idx + 1} rightSections:`, JSON.stringify(p.rightSections?.map(s => ({
        id: s.id,
        isContinuation: s.isContinuation,
        itemsCount: s.items?.length,
        items: s.items?.map(it => ({
          id: it.id,
          isPartialItem: it.isPartialItem,
          isContinuationItem: it.isContinuationItem,
          bullets: it.bullets,
        })),
      })), null, 2));
    });

    // Test 2: Projects section with default project
    const cvProject = {
      profile: { name: 'Test' },
      layout: { type: '2-column', pagePadding: 24, sectionGap: 20, itemGap: 8 },
      sections: [
        {
          id: 'sec_spacer',
          type: 'spacer',
          column: 'right',
          height: 700,
        },
        {
          id: 'sec_proj',
          type: 'projects',
          column: 'right',
          title: 'PROYECTOS DESTACADOS',
          items: [
            {
              id: 'proj_1',
              title: 'Plataforma SaaS de Automatización',
              subtitle: 'React · Node.js · PostgreSQL · Docker',
              date: '2025',
              link: 'github.com/usuario/proyecto',
              linkText: 'Demo / Repositorio GitHub',
              description: 'Arquitectura escalable de microservicios con sincronización en tiempo real y tests integrados.',
              bullets: [
                'Implementé pipelines de CI/CD automatizados reduciendo tiempos de despliegue en un 50%.',
                'Diseñé una interfaz reactiva accesible optimizada para altos volúmenes de usuarios.'
              ]
            }
          ]
        }
      ]
    };

    const headerH = estimateHeaderHeight(cvProject.sections[1], false, { isEditor: true, column: 'right' });
    const baseH = estimateItemBaseHeight(cvProject.sections[1].items[0], cvProject.sections[1].type, { isEditor: true, column: 'right' });
    const bullet0H = estimateSingleBulletHeight(cvProject.sections[1].items[0].bullets[0], cvProject.sections[1].type, { isEditor: true, column: 'right' });
    const totalItemH = estimateItemHeight(cvProject.sections[1].items[0], cvProject.sections[1].type, { isEditor: true, column: 'right' });

    console.log('PROJECT METRICS:', {
      headerH,
      baseH,
      bullet0H,
      minBulletNeeded: 20 + headerH + baseH + bullet0H,
      totalItemH,
      remainingOnCurrent: 1075 - 850
    });

    const pagesProj = distributeSectionsToPages(cvProject, { isEditor: true, editorHeadroom: 0 });
    expect(pagesProj.length).toBe(1);
    expect(pagesProj[0].rightSections.find(s => s.id === 'sec_proj')).toBeDefined();

    // Test 3: Project splitting across page boundary
    const cvProjectSplit = {
      ...cvProject,
      sections: [
        { id: 'sec_spacer', type: 'spacer', column: 'right', height: 815 },
        cvProject.sections[1]
      ]
    };
    const pagesProjSplit = distributeSectionsToPages(cvProjectSplit, { isEditor: true, editorHeadroom: 0 });
    console.log('pagesProjSplit:', JSON.stringify(pagesProjSplit.map(p => ({
      pageNumber: p.pageNumber,
      rightSections: p.rightSections.map(s => ({ id: s.id, isContinuation: s.isContinuation, items: s.items }))
    })), null, 2));
    expect(pagesProjSplit.length).toBe(2);
    const p1Proj = pagesProjSplit[0].rightSections.find(s => s.id === 'sec_proj');
    const p2Proj = pagesProjSplit[1].rightSections.find(s => s.id.startsWith('sec_proj'));
    expect(p1Proj).toBeDefined();
    expect(p2Proj).toBeDefined();
    expect(p1Proj.items[0].isPartialItem).toBe(true);
    expect(p1Proj.items[0].bullets.length).toBe(1);
    expect(p1Proj.items[0].bullets[0]).toContain('Implementé pipelines');
    expect(p2Proj.items[0].isContinuationItem).toBe(true);
    expect(p2Proj.items[0].bullets.length).toBe(1);
    expect(p2Proj.items[0].bullets[0]).toContain('Diseñé una interfaz');

    // Test 4: Experience splitting across page boundary
    const cvExpSplit = {
      profile: { name: 'Test' },
      layout: { type: '2-column', pagePadding: 24, sectionGap: 20, itemGap: 8 },
      sections: [
        { id: 'sec_spacer', type: 'spacer', column: 'right', height: 880 },
        {
          id: 'sec_exp_single',
          type: 'experience',
          column: 'right',
          title: 'EXPERIENCIA LABORAL',
          items: [
            {
              id: 'job_single',
              title: 'Senior Frontend Engineer',
              subtitle: 'Google · Mountain View, CA',
              date: '2023 – Presente',
              description: 'Liderazgo técnico en la arquitectura de aplicaciones web globales.',
              bullets: [
                'Diseño e implementación de micro-frontends escalables de alto rendimiento.',
                'Reducción de latencia en un 40% mediante optimización de rendering y code-splitting.'
              ]
            }
          ]
        }
      ]
    };
    const pagesExpSplit = distributeSectionsToPages(cvExpSplit, { isEditor: true, editorHeadroom: 0 });
    expect(pagesExpSplit.length).toBe(2);
    const p1Exp = pagesExpSplit[0].rightSections.find(s => s.id === 'sec_exp_single');
    const p2Exp = pagesExpSplit[1].rightSections.find(s => s.id === 'sec_exp_single' && s.isContinuation);
    expect(p1Exp).toBeDefined();
    expect(p2Exp).toBeDefined();
    expect(p1Exp.items[0].isPartialItem).toBe(true);
    expect(p1Exp.items[0].bullets.length).toBe(1);
    expect(p2Exp.items[0].isContinuationItem).toBe(true);
    expect(p2Exp.items[0].bullets.length).toBe(1);

    // Test 5: Volunteering inheriting bullet splitting automatically
    const cvVolSplit = {
      profile: { name: 'Test' },
      layout: { type: '2-column', pagePadding: 24, sectionGap: 20, itemGap: 8 },
      sections: [
        { id: 'sec_spacer', type: 'spacer', column: 'right', height: 890 },
        {
          id: 'sec_vol',
          type: 'volunteering',
          column: 'right',
          title: 'VOLUNTARIADO',
          items: [
            {
              id: 'vol_1',
              title: 'Mentor Comunitario',
              subtitle: 'Tech For Good',
              date: '2024',
              description: 'Apoyo y formación a programadores jóvenes.',
              bullets: [
                'Coordinación de talleres semanales sobre tecnologías web modernas.',
                'Mentoría personalizada a más de 20 estudiantes de bootcamps.'
              ]
            }
          ]
        }
      ]
    };
    const pagesVolSplit = distributeSectionsToPages(cvVolSplit, { isEditor: true, editorHeadroom: 0 });
    expect(pagesVolSplit.length).toBe(2);
    const p1Vol = pagesVolSplit[0].rightSections.find(s => s.id === 'sec_vol');
    const p2Vol = pagesVolSplit[1].rightSections.find(s => s.id === 'sec_vol' && s.isContinuation);
    expect(p1Vol).toBeDefined();
    expect(p2Vol).toBeDefined();
    expect(p1Vol.items[0].isPartialItem).toBe(true);
    expect(p1Vol.items[0].bullets.length).toBe(1);
    expect(p2Vol.items[0].isContinuationItem).toBe(true);
    expect(p2Vol.items[0].bullets.length).toBe(1);

    // Test 6: Polymorphic/custom section with bullets inheriting splitting automatically
    const cvCustomSplit = {
      profile: { name: 'Test' },
      layout: { type: '2-column', pagePadding: 24, sectionGap: 20, itemGap: 8 },
      sections: [
        { id: 'sec_spacer', type: 'spacer', column: 'right', height: 910 },
        {
          id: 'sec_custom',
          type: 'custom_initiatives',
          column: 'right',
          title: 'INICIATIVAS PROPIAS',
          items: [
            {
              id: 'custom_item_1',
              title: 'Organizador Open Source Hackathon',
              subtitle: 'Comunidad Dev',
              date: '2024',
              bullets: [
                'Gestión de sponsors y plataformas de hosting para 150 participantes.',
                'Revisión y jurado de más de 30 proyectos de código abierto.'
              ]
            }
          ]
        }
      ]
    };
    const pagesCustomSplit = distributeSectionsToPages(cvCustomSplit, { isEditor: true, editorHeadroom: 0 });
    expect(pagesCustomSplit.length).toBe(2);
    const p1Cust = pagesCustomSplit[0].rightSections.find(s => s.id === 'sec_custom');
    const p2Cust = pagesCustomSplit[1].rightSections.find(s => s.id === 'sec_custom' && s.isContinuation);
    expect(p1Cust).toBeDefined();
    expect(p2Cust).toBeDefined();
    expect(p1Cust.items[0].isPartialItem).toBe(true);
    expect(p1Cust.items[0].bullets.length).toBe(1);
    expect(p2Cust.items[0].isContinuationItem).toBe(true);
    expect(p2Cust.items[0].bullets.length).toBe(1);
  });
});
