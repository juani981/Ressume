/**
 * pageDistributor.test.js
 *
 * Exhaustive unit tests for:
 * 1. Canonical PageModel data structure and factory (pageModelTypes.js)
 * 2. Pure deterministic section distributor (pageDistributor.js)
 *
 * Guarantees Invariant 15 (Discrete A4 Boxes) and Invariant 16 (Zero Dynamic Reflow).
 */

import { describe, it, expect } from 'vitest';
import { defaultSchema } from '../utils/schema';
import {
  createPageModel,
  isValidPageModel,
  PAGE_MODEL_KEYS,
  deepFreeze,
} from '../utils/pageModelTypes';
import {
  distributeSectionsToPages,
  estimateHeaderHeight,
  estimateItemHeight,
  estimateSectionHeight,
} from '../utils/pageDistributor';

describe('PageModel Canonical Data Structure & Types', () => {
  it('creates a canonical PageModel with all 6 required fields', () => {
    const page = createPageModel({
      pageNumber: 1,
      totalPages: 2,
      isLastPage: false,
      leftSections: [{ id: 's1' }],
      rightSections: [{ id: 's2' }],
      singleSections: [],
    });

    expect(page.pageNumber).toBe(1);
    expect(page.totalPages).toBe(2);
    expect(page.isLastPage).toBe(false);
    expect(page.leftSections).toEqual([{ id: 's1' }]);
    expect(page.rightSections).toEqual([{ id: 's2' }]);
    expect(page.singleSections).toEqual([]);

    PAGE_MODEL_KEYS.forEach((key) => {
      expect(page).toHaveProperty(key);
    });
  });

  it('validates canonical PageModel contract with isValidPageModel', () => {
    const valid = createPageModel({
      pageNumber: 1,
      totalPages: 1,
      isLastPage: true,
      leftSections: [],
      rightSections: [],
      singleSections: [],
    });
    expect(isValidPageModel(valid)).toBe(true);

    expect(isValidPageModel(null)).toBe(false);
    expect(isValidPageModel({})).toBe(false);
    expect(isValidPageModel({ pageNumber: 0, totalPages: 1 })).toBe(false);
    expect(isValidPageModel({ pageNumber: 2, totalPages: 1 })).toBe(false);
    expect(
      isValidPageModel({
        pageNumber: 1,
        totalPages: 1,
        isLastPage: true,
        leftSections: 'not-an-array',
        rightSections: [],
        singleSections: [],
      })
    ).toBe(false);
  });

  it('enforces immutability on PageModel instances', () => {
    const page = createPageModel({
      pageNumber: 1,
      totalPages: 1,
      isLastPage: true,
      leftSections: [{ id: 'sec1' }],
      rightSections: [],
      singleSections: [],
    });

    expect(Object.isFrozen(page)).toBe(true);
    expect(Object.isFrozen(page.leftSections)).toBe(true);
    expect(Object.isFrozen(page.rightSections)).toBe(true);
    expect(Object.isFrozen(page.singleSections)).toBe(true);

    // Attempting to mutate in strict mode must throw
    expect(() => {
      page.pageNumber = 2;
    }).toThrow();

    expect(() => {
      page.leftSections.push({ id: 'sec2' });
    }).toThrow();
  });
});

describe('Pure Page Distributor (distributeSectionsToPages)', () => {
  describe('Standard Concise 1-Page CV and Default 2-Page CV', () => {
    it('correctly distributes a concise CV into exactly 1 PageModel', () => {
      const conciseCv = {
        ...defaultSchema,
        sections: defaultSchema.sections.filter((s) => s.id !== 'languages' && s.id !== 'education'),
      };
      const pages = distributeSectionsToPages(conciseCv);

      expect(Array.isArray(pages)).toBe(true);
      expect(pages.length).toBe(1);

      const [page1] = pages;
      expect(page1.pageNumber).toBe(1);
      expect(page1.totalPages).toBe(1);
      expect(page1.isLastPage).toBe(true);

      // In 2-column mode, left and right sections are populated, singleSections is empty
      expect(page1.leftSections.length).toBeGreaterThan(0);
      expect(page1.rightSections.length).toBeGreaterThan(0);
      expect(page1.singleSections.length).toBe(0);

      // Check left column sections match expected default sections
      const leftIds = page1.leftSections.map((s) => s.id);
      expect(leftIds).toContain('profile_header');
      expect(leftIds).toContain('contact');
      expect(leftIds).toContain('about_section');
      expect(leftIds).toContain('skills');

      // Check right column sections match expected default sections
      const rightIds = page1.rightSections.map((s) => s.id);
      expect(rightIds).toContain('experience');
      expect(rightIds).toContain('projects');
      expect(rightIds).toContain('certificates');

      // None of the sections on page 1 should be marked as continuation
      page1.leftSections.forEach((s) => expect(s.isContinuation).toBeFalsy());
      page1.rightSections.forEach((s) => expect(s.isContinuation).toBeFalsy());
    });

    it('correctly distributes defaultSchema into exactly 1 PageModel when content fits on one page', () => {
      const pages = distributeSectionsToPages(defaultSchema);
      expect(pages.length).toBe(1);
      expect(pages[0].pageNumber).toBe(1);
      expect(pages[0].leftSections.length).toBeGreaterThan(0);
      expect(pages[0].rightSections.length).toBeGreaterThan(0);
    });
  });

  describe('Extensive Content Producing 2 Pages & Multi-Item Continuation', () => {
    it('cleanly splits a multi-item section and produces 2 pages', () => {
      // Build CV with 6 extensive experience entries with multiple bullets
      const heavyCv = JSON.parse(JSON.stringify(defaultSchema));
      const expSec = heavyCv.sections.find((s) => s.id === 'experience');

      expSec.items = [
        {
          id: 'exp1',
          title: 'Senior Software Architect',
          subtitle: 'Tech Global Corp | Buenos Aires',
          date: '2023 – Actualidad',
          description: 'Liderazgo de equipo de 12 ingenieros en migración a microservicios y cloud.',
          bullets: [
            'Liderazgo de equipo de 12 ingenieros en migración a microservicios.',
            'Optimización de latencia en 45% reduciendo costos en AWS.',
            'Diseño de arquitectura de eventos con Apache Kafka.',
          ],
        },
        {
          id: 'exp2',
          title: 'Lead Full Stack Developer',
          subtitle: 'Innovatech Solutions | Remoto',
          date: '2021 – 2023',
          description: 'Desarrollo de plataforma SaaS de analítica distribuida en tiempo real.',
          bullets: [
            'Desarrollo de plataforma SaaS de analítica en tiempo real.',
            'Implementación de pipelines CI/CD automatizados con GitHub Actions.',
            'Mentoring a 5 desarrolladores juniors y mid-level.',
          ],
        },
        {
          id: 'exp3',
          title: 'Full Stack Engineer',
          subtitle: 'Digital Agency Inc | Remoto',
          date: '2019 – 2021',
          description: 'Construcción de aplicaciones web en React, Node.js y bases de datos relacionales.',
          bullets: [
            'Construcción de aplicaciones web en React, Node.js y PostgreSQL.',
            'Integración de gateways de pago Stripe y Mercado Pago.',
          ],
        },
        {
          id: 'exp4',
          title: 'Frontend Developer',
          subtitle: 'Startup Labs | Buenos Aires',
          date: '2017 – 2019',
          description: 'Desarrollo de interfaces accesibles e interactivas con React y TypeScript.',
          bullets: [
            'Desarrollo de interfaces accesibles e interactivas con React.',
            'Aumento de score de rendimiento en Lighthouse de 60 a 98.',
          ],
        },
        {
          id: 'exp5',
          title: 'Junior Web Developer',
          subtitle: 'Software Factory | Córdoba',
          date: '2016 – 2017',
          description: 'Mantenimiento de portales web corporativos y resolución de bugs.',
          bullets: [
            'Mantenimiento de portales web corporativos en JavaScript y CSS.',
            'Resolución de bugs críticos de compatibilidad cross-browser.',
          ],
        },
        {
          id: 'exp6',
          title: 'Trainee Developer',
          subtitle: 'Consulting IT | Córdoba',
          date: '2015 – 2016',
          description: 'Automatización de pruebas de regresión y soporte técnico.',
          bullets: [
            'Automatización de pruebas de regresión.',
            'Soporte técnico y documentación de APIs REST.',
          ],
        },
        {
          id: 'exp7',
          title: 'QA Automation Engineer',
          subtitle: 'Quality Systems | Córdoba',
          date: '2014 – 2015',
          description: 'Implementación de framework integral de pruebas de extremo a extremo.',
          bullets: [
            'Implementación de framework de automatización con Cypress y Selenium.',
            'Reducción de tiempo de testing de regresión de 3 días a 4 horas.',
          ],
        },
        {
          id: 'exp8',
          title: 'Technical Support Specialist',
          subtitle: 'HelpDesk Pro | Remoto',
          date: '2013 – 2014',
          description: 'Resolución de incidencias de software de nivel 2 y 3 para clientes corporativos.',
          bullets: [
            'Resolución de incidencias de software de nivel 2 y 3.',
            'Documentación de base de conocimientos técnicos.',
          ],
        },
      ];

      heavyCv.sections = heavyCv.sections.filter((s) => s.id !== 'projects' && s.id !== 'certificates');

      const pages = distributeSectionsToPages(heavyCv);

      expect(pages.length).toBe(2);

      const [p1, p2] = pages;
      expect(p1.pageNumber).toBe(1);
      expect(p1.totalPages).toBe(2);
      expect(p1.isLastPage).toBe(false);

      expect(p2.pageNumber).toBe(2);
      expect(p2.totalPages).toBe(2);
      expect(p2.isLastPage).toBe(true);

      // Verify experience items were split across Page 1 and Page 2
      const p1Exp = p1.rightSections.find((s) => s.id === 'experience');
      const p2Exp = p2.rightSections.find((s) => s.id === 'experience');

      expect(p1Exp).toBeDefined();
      expect(p2Exp).toBeDefined();

      // Page 1 experience is not a continuation
      expect(p1Exp.isContinuation).toBeFalsy();
      expect(p1Exp.items.length).toBeGreaterThan(0);

      // Page 2 experience is a continuation
      expect(p2Exp.isContinuation).toBe(true);
      expect(p2Exp.originalSectionId).toBe('experience');
      expect(p2Exp.continuationId).toBe('experience__cont_2');
      expect(p2Exp.items.length).toBeGreaterThan(0);

      // Total items across page 1 and page 2 must equal total original items (8)
      const totalExpItems = p1Exp.items.length + p2Exp.items.length;
      expect(totalExpItems).toBe(8);

      // No item IDs duplicated or lost
      const combinedIds = [...p1Exp.items.map((i) => i.id), ...p2Exp.items.map((i) => i.id)];
      expect(combinedIds).toEqual(['exp1', 'exp2', 'exp3', 'exp4', 'exp5', 'exp6', 'exp7', 'exp8']);

      // Left column sections that fit on page 1 remain on page 1
      expect(p1.leftSections.length).toBeGreaterThan(0);
    });

    it('supports continuation header customization options', () => {
      const cv = {
        layout: { type: '2-column' },
        sections: [
          {
            id: 'experience',
            column: 'right',
            title: 'EXPERIENCIA LABORAL',
            items: [
              { id: 'e1', title: 'Job 1', height: 600 },
              { id: 'e2', title: 'Job 2', height: 600 },
            ],
          },
        ],
      };

      // 1. With omitContinuationHeader: true
      const pagesOmitted = distributeSectionsToPages(cv, {
        pageCapacity: 800,
        omitContinuationHeader: true,
      });
      expect(pagesOmitted.length).toBe(2);
      expect(pagesOmitted[1].rightSections[0].isContinuation).toBe(true);
      expect(pagesOmitted[1].rightSections[0].title).toBe('');

      // 2. With reduceContinuationHeader: true
      const pagesReduced = distributeSectionsToPages(cv, {
        pageCapacity: 800,
        reduceContinuationHeader: true,
      });
      expect(pagesReduced[1].rightSections[0].isContinuation).toBe(true);
      expect(pagesReduced[1].rightSections[0].title).toBe('EXPERIENCIA LABORAL (Cont.)');
    });
  });

  describe('Explicit Forced Page Assignments', () => {
    it('forces a section onto page 2 via section.page = 2', () => {
      const cv = {
        layout: { type: '2-column' },
        sections: [
          {
            id: 'about',
            column: 'left',
            title: 'About',
            items: [{ id: 'a1', description: 'Brief info' }],
          },
          {
            id: 'experience',
            column: 'right',
            title: 'Experience',
            page: 2, // Forced to page 2
            items: [{ id: 'e1', title: 'Engineer' }],
          },
        ],
      };

      const pages = distributeSectionsToPages(cv);

      expect(pages.length).toBe(2);

      const [p1, p2] = pages;
      // Page 1 has about in left, right is empty
      expect(p1.leftSections.map((s) => s.id)).toContain('about');
      expect(p1.rightSections.find((s) => s.id === 'experience')).toBeUndefined();

      // Page 2 has experience in right, left is empty
      expect(p2.leftSections.length).toBe(0);
      expect(p2.rightSections.map((s) => s.id)).toContain('experience');
      expect(p2.rightSections[0].pageNumber ?? 2).toBe(2);
    });

    it('forces a section onto page 2 via section.targetPage = 2', () => {
      const cv = {
        layout: { type: '2-column' },
        sections: [
          {
            id: 'sec1',
            column: 'right',
            title: 'Sec 1',
            items: [{ id: 'i1', title: 'Item 1' }],
          },
          {
            id: 'sec2',
            column: 'right',
            title: 'Sec 2',
            targetPage: 2,
            items: [{ id: 'i2', title: 'Item 2' }],
          },
        ],
      };

      const pages = distributeSectionsToPages(cv);

      expect(pages.length).toBe(2);
      expect(pages[0].rightSections.map((s) => s.id)).toContain('sec1');
      expect(pages[0].rightSections.map((s) => s.id)).not.toContain('sec2');
      expect(pages[1].rightSections.map((s) => s.id)).toContain('sec2');
    });

    it('splits a section based on explicit item.page assignments', () => {
      const cv = {
        layout: { type: '2-column' },
        sections: [
          {
            id: 'experience',
            column: 'right',
            title: 'EXPERIENCIA',
            items: [
              { id: 'exp1', page: 1, title: 'Job 1' },
              { id: 'exp2', page: 1, title: 'Job 2' },
              { id: 'exp3', page: 2, title: 'Job 3' },
              { id: 'exp4', page: 2, title: 'Job 4' },
            ],
          },
        ],
      };

      const pages = distributeSectionsToPages(cv);

      expect(pages.length).toBe(2);
      const [p1, p2] = pages;

      const p1Exp = p1.rightSections.find((s) => s.id === 'experience');
      const p2Exp = p2.rightSections.find((s) => s.id === 'experience');

      expect(p1Exp).toBeDefined();
      expect(p2Exp).toBeDefined();

      expect(p1Exp.items.map((i) => i.id)).toEqual(['exp1', 'exp2']);
      expect(p1Exp.isContinuation).toBeFalsy();

      expect(p2Exp.items.map((i) => i.id)).toEqual(['exp3', 'exp4']);
      expect(p2Exp.isContinuation).toBe(true);
      expect(p2Exp.originalSectionId).toBe('experience');
    });

    it('splits a section when an item has breakBefore: true', () => {
      const cv = {
        layout: { type: '2-column' },
        sections: [
          {
            id: 'education',
            column: 'left',
            title: 'Educación',
            items: [
              { id: 'edu1', title: 'Degree 1' },
              { id: 'edu2', breakBefore: true, title: 'Degree 2' },
            ],
          },
        ],
      };

      const pages = distributeSectionsToPages(cv);

      expect(pages.length).toBe(2);
      expect(pages[0].leftSections[0].items.map((i) => i.id)).toEqual(['edu1']);
      expect(pages[1].leftSections[0].items.map((i) => i.id)).toEqual(['edu2']);
      expect(pages[1].leftSections[0].isContinuation).toBe(true);
    });

    it('handles explicit assignment to page 3, generating empty intermediate page 2', () => {
      const cv = {
        layout: { type: '2-column' },
        sections: [
          {
            id: 'intro',
            column: 'left',
            title: 'Intro',
            items: [{ id: 'i1' }],
          },
          {
            id: 'future',
            column: 'left',
            title: 'Future',
            page: 3,
            items: [{ id: 'f1' }],
          },
        ],
      };

      const pages = distributeSectionsToPages(cv);

      expect(pages.length).toBe(3);
      expect(pages[0].pageNumber).toBe(1);
      expect(pages[0].totalPages).toBe(3);
      expect(pages[0].isLastPage).toBe(false);

      expect(pages[1].pageNumber).toBe(2);
      expect(pages[1].totalPages).toBe(3);
      expect(pages[1].isLastPage).toBe(false);
      expect(pages[1].leftSections.length).toBe(0);
      expect(pages[1].rightSections.length).toBe(0);

      expect(pages[2].pageNumber).toBe(3);
      expect(pages[2].totalPages).toBe(3);
      expect(pages[2].isLastPage).toBe(true);
      expect(pages[2].leftSections.map((s) => s.id)).toEqual(['future']);
    });
  });

  describe('ATS 1-Column Mode vs 2-Column Mode', () => {
    it('places all sections in singleSections when layout.isAtsMode is true', () => {
      const atsSections = defaultSchema.sections.slice(0, 4);
      const atsCv = {
        sections: atsSections,
        layout: {
          ...defaultSchema.layout,
          isAtsMode: true,
        },
      };

      const pages = distributeSectionsToPages(atsCv);

      expect(pages.length).toBe(1);
      const [page1] = pages;

      expect(page1.leftSections).toEqual([]);
      expect(page1.rightSections).toEqual([]);
      expect(page1.singleSections.length).toBe(4);

      // Verify sections are preserved in order
      const expectedIds = atsSections.map((s) => s.id);
      expect(page1.singleSections.map((s) => s.id)).toEqual(expectedIds);
    });

    it('places all sections in singleSections when layout.type is 1-column', () => {
      const atsSections = defaultSchema.sections.slice(0, 4);
      const atsCv = {
        sections: atsSections,
        layout: {
          ...defaultSchema.layout,
          type: '1-column',
        },
      };

      const pages = distributeSectionsToPages(atsCv);

      expect(pages.length).toBe(1);
      expect(pages[0].singleSections.length).toBe(4);
      expect(pages[0].leftSections).toEqual([]);
      expect(pages[0].rightSections).toEqual([]);
    });

    it('allows overriding mode to 1-column via options.mode = "1-column"', () => {
      const atsSections = defaultSchema.sections.slice(0, 4);
      const cv = {
        sections: atsSections,
        layout: { type: '2-column' },
      };
      const pages = distributeSectionsToPages(cv, { mode: '1-column' });

      expect(pages.length).toBe(1);
      expect(pages[0].singleSections.length).toBe(4);
      expect(pages[0].leftSections).toEqual([]);
      expect(pages[0].rightSections).toEqual([]);
    });

    it('distributes ATS single-column across 2 pages when content overflows', () => {
      const atsCv = {
        layout: { type: '1-column' },
        sections: [
          {
            id: 'sec1',
            title: 'Section 1',
            items: [{ id: 'i1', height: 600 }],
          },
          {
            id: 'sec2',
            title: 'Section 2',
            items: [{ id: 'i2', height: 600 }],
          },
        ],
      };

      const pages = distributeSectionsToPages(atsCv, { pageCapacity: 1000 });

      expect(pages.length).toBe(2);
      expect(pages[0].singleSections.map((s) => s.id)).toEqual(['sec1']);
      expect(pages[1].singleSections.map((s) => s.id)).toEqual(['sec2']);
      expect(pages[0].leftSections).toEqual([]);
      expect(pages[0].rightSections).toEqual([]);
      expect(pages[1].leftSections).toEqual([]);
      expect(pages[1].rightSections).toEqual([]);
    });
  });

  describe('Edge Cases, Invariants & Pure Immutability', () => {
    it('always returns at least 1 valid PageModel for empty or null cvData', () => {
      const emptyPages = distributeSectionsToPages({});
      expect(emptyPages.length).toBe(1);
      expect(isValidPageModel(emptyPages[0])).toBe(true);
      expect(emptyPages[0].pageNumber).toBe(1);
      expect(emptyPages[0].totalPages).toBe(1);
      expect(emptyPages[0].isLastPage).toBe(true);

      const nullPages = distributeSectionsToPages(null);
      expect(nullPages.length).toBe(1);
      expect(isValidPageModel(nullPages[0])).toBe(true);

      const undefinedPages = distributeSectionsToPages(undefined);
      expect(undefinedPages.length).toBe(1);
      expect(isValidPageModel(undefinedPages[0])).toBe(true);
    });

    it('never mutates input cvData', () => {
      const input = {
        layout: { type: '2-column' },
        sections: [
          {
            id: 'exp',
            column: 'right',
            title: 'Exp',
            items: [{ id: 'e1', title: 'Original Title' }],
          },
        ],
      };

      const cloneBefore = JSON.parse(JSON.stringify(input));
      distributeSectionsToPages(input);

      expect(input).toEqual(cloneBefore);
      expect(Object.isFrozen(input)).toBe(false);
      expect(Object.isFrozen(input.sections)).toBe(false);
    });

    it('returns deeply frozen PageModel array', () => {
      const pages = distributeSectionsToPages(defaultSchema);

      expect(Object.isFrozen(pages)).toBe(true);
      expect(Object.isFrozen(pages[0])).toBe(true);
      expect(Object.isFrozen(pages[0].leftSections)).toBe(true);
      expect(Object.isFrozen(pages[0].rightSections)).toBe(true);
      expect(Object.isFrozen(pages[0].singleSections)).toBe(true);
    });

    it('maintains 2-column symmetry when left column finishes early', () => {
      const cv = {
        layout: { type: '2-column' },
        sections: [
          {
            id: 'profile',
            column: 'left',
            items: [{ id: 'p1', height: 100 }],
          },
          {
            id: 'big_work',
            column: 'right',
            items: [
              { id: 'w1', height: 600 },
              { id: 'w2', height: 600 },
            ],
          },
        ],
      };

      const pages = distributeSectionsToPages(cv, { pageCapacity: 800 });

      expect(pages.length).toBe(2);

      // Page 1 has both left and right
      expect(pages[0].leftSections.length).toBe(1);
      expect(pages[0].rightSections.length).toBe(1);

      // Page 2 has empty left column (no extra left sections), but right continues
      expect(pages[1].leftSections.length).toBe(0);
      expect(pages[1].rightSections.length).toBe(1);
      expect(pages[1].rightSections[0].isContinuation).toBe(true);

      // Both pages have totalPages = 2
      expect(pages[0].totalPages).toBe(2);
      expect(pages[1].totalPages).toBe(2);
    });

    it('supports custom itemHeightEstimator in options', () => {
      const customEstimator = (item) => {
        if (item.customHeight) return item.customHeight;
        return 50;
      };

      const cv = {
        layout: { type: '1-column' },
        sections: [
          {
            id: 'sec',
            title: 'Sec',
            items: [
              { id: 'i1', customHeight: 400 },
              { id: 'i2', customHeight: 400 },
            ],
          },
        ],
      };

      const pages = distributeSectionsToPages(cv, {
        pageCapacity: 500,
        itemHeightEstimator: customEstimator,
      });

      expect(pages.length).toBe(2);
      expect(pages[0].singleSections[0].items.length).toBe(1);
      expect(pages[1].singleSections[0].items.length).toBe(1);
      expect(pages[1].singleSections[0].isContinuation).toBe(true);
    });
  });

  describe('User Acceptance Criteria: ATS Mode & Precise Page Jumping', () => {
    it('Criterion 1: If the size of the section plus margin fits on current page, does NOT jump', () => {
      const cv = {
        layout: { type: '1-column', isAtsMode: true, pagePadding: 24, sectionGap: 20 },
        sections: [
          {
            id: 'sec1',
            type: 'list',
            title: 'Section 1',
            items: [{ id: 'item1', height: 400 }],
          },
          {
            id: 'sec2',
            type: 'list',
            title: 'Section 2',
            items: [{ id: 'item2', height: 400 }],
          },
        ],
      };

      // Capacity is 1123 - 48 = 1075px. Total needed is ~850px <= 1075px. Must stay on Page 1!
      const pages = distributeSectionsToPages(cv, { isEditor: true });
      expect(pages.length).toBe(1);
      expect(pages[0].singleSections.map((s) => s.id)).toEqual(['sec1', 'sec2']);
    });

    it('Criterion 2: If only header fits on current page but not the first item, jumps to next page', () => {
      const cv = {
        layout: { type: '1-column', isAtsMode: true, pagePadding: 24, sectionGap: 20 },
        sections: [
          // Section 1 occupies almost entire page, leaving ~75px
          {
            id: 'sec1',
            type: 'list',
            title: 'Big Section',
            items: [{ id: 'item1', height: 1000 }],
          },
          // Section 2: header is 36px, item is 80px. Total needed = 20 + 36 + 80 = 136px > 75px.
          // Header alone would fit in 75px, but header + first item does not!
          {
            id: 'sec2',
            type: 'experience',
            title: 'Experience',
            items: [{ id: 'exp1', height: 80 }],
          },
        ],
      };

      const pages = distributeSectionsToPages(cv, { isEditor: true });
      expect(pages.length).toBe(2);
      expect(pages[0].singleSections.map((s) => s.id)).toEqual(['sec1']);
      expect(pages[1].singleSections.map((s) => s.id)).toEqual(['sec2']);
      expect(pages[1].singleSections[0].items.length).toBe(1);
    });

    it('Criterion 3: If header and n first items fit on current page, writes them on current page and remaining to next page', () => {
      const cv = {
        layout: { type: '1-column', isAtsMode: true, pagePadding: 24, sectionGap: 20 },
        sections: [
          {
            id: 'sec1',
            type: 'list',
            title: 'Top Section',
            items: [{ id: 'item1', height: 750 }],
          },
          {
            id: 'sec2',
            type: 'list',
            title: 'Multi Section',
            items: [
              { id: 'it1', height: 80 },
              { id: 'it2', height: 80 },
              { id: 'it3', height: 80 },
              { id: 'it4', height: 80 },
              { id: 'it5', height: 80 },
            ],
          },
        ],
      };

      const pages = distributeSectionsToPages(cv, { isEditor: true });
      expect(pages.length).toBe(2);

      const p1Sec2 = pages[0].singleSections.find((s) => s.id === 'sec2');
      const p2Sec2 = pages[1].singleSections.find((s) => s.id.startsWith('sec2'));

      expect(p1Sec2).toBeDefined();
      expect(p2Sec2).toBeDefined();

      // Verify n first items are on Page 1
      expect(p1Sec2.items.map((it) => it.id)).toEqual(['it1', 'it2']);
      // Verify remaining items are on Page 2
      expect(p2Sec2.items.map((it) => it.id)).toEqual(['it3', 'it4', 'it5']);
    });

    it('DnD Reordering: placing a section into page 1 with available space does not push it to page 2', () => {
      const cv = {
        layout: { type: '1-column', isAtsMode: true, pagePadding: 24, sectionGap: 20 },
        sections: [
          { id: 'profile', type: 'profile_header', title: '', items: [{ id: 'p1' }] },
          { id: 'contact', type: 'contact', title: '', items: [{ id: 'c1', contacts: ['email@test.com', '123456'] }] },
          { id: 'about', type: 'about', title: 'About', items: [{ id: 'a1', description: 'Brief bio' }] },
          { id: 'education', type: 'education', title: 'Education', items: [{ id: 'e1', title: 'BS Computer Science' }] },
        ],
      };

      // These 4 concise sections together require ~280px, well within 1075px page capacity
      const pages = distributeSectionsToPages(cv, { isEditor: true });
      expect(pages.length).toBe(1);
      expect(pages[0].singleSections.map((s) => s.id)).toEqual(['profile', 'contact', 'about', 'education']);
    });
  });
});
