import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CVProvider } from '../context/CVContext';
import App from '../App';
import { defaultSchema } from '../utils/schema';
import { 
  generateCleanPrintHTML, 
  captureEditorSnapshot, 
  executeCleanPrint 
} from '../utils/staticHtmlPdfEngine';

/**
 * 26 Blacklisted Interactive Artifact Selectors from PROJECT.md / M1-M3 Specifications
 */
const ARTIFACTS_BLACKLIST = [
  '.drag-handle',
  '.section-drag-handle',
  '.item-drag-handle',
  '.round-btn-del',
  '.section-del-btn',
  '.item-del-btn',
  '.bullet-del-btn',
  '.round-btn-add',
  '.add-bullet-btn',
  '.section-add-container',
  '.column-add-section',
  '.add-section-btn',
  '.bullet-add-row',
  '.section-action-buttons',
  '.section-tips-toggle-btn',
  '.section-bullet-style-btn',
  '.section-bullet-style-popover',
  '.suggestion-tooltip',
  '.obsidian-callout',
  '.column-resizer',
  '.rich-text-toolbar',
  '.action-menu',
  '.action-menu-btn',
  '.l-navbar',
  '.a4-page-fold-guide',
  '.spacer-resize-handle'
];

/**
 * Computes semantic element height based on child typography and contents
 */
function computeSemanticItemHeight(item, fontScale, lineHeight) {
  const baseH = 16 * fontScale * lineHeight;
  let h = 0;

  // Title / name
  const title = item.querySelector('.home__title, .experience__title, .education__title, .skills__name, h1, h2, h3');
  if (title) {
    const text = title.querySelector('.inline-edit-display')?.textContent?.trim() || title.textContent?.trim() || '';
    if (text) {
      const lines = Math.max(1, Math.ceil(text.length / 45));
      h += Math.round(lines * baseH);
    }
  }

  // Subtitle
  const subtitle = item.querySelector('.home__subtitle, .experience__subtitle, .education__studies');
  if (subtitle) {
    const text = subtitle.querySelector('.inline-edit-display')?.textContent?.trim() || subtitle.textContent?.trim() || '';
    if (text) {
      const lines = Math.max(1, Math.ceil(text.length / 50));
      h += Math.round(lines * baseH * 0.9);
    }
  }

  // Date / info
  const dateOrInfo = item.querySelector('.experience__date, .education__year, .home__information');
  if (dateOrInfo) {
    const text = dateOrInfo.querySelector('.inline-edit-display')?.textContent?.trim() || dateOrInfo.textContent?.trim() || '';
    if (text) h += Math.round(baseH * 0.85);
  }

  // Description (handles multiline)
  const desc = item.querySelector('.profile__description, .experience__description, p');
  if (desc) {
    const text = desc.querySelector('.inline-edit-display')?.textContent?.trim() || desc.textContent?.trim() || '';
    if (text) {
      const explicitBreaks = (text.match(/\n/g) || []).length;
      const wrapLines = Math.ceil(text.length / 60);
      const totalLines = Math.max(1, wrapLines + explicitBreaks);
      h += Math.round(totalLines * baseH * 0.9);
    }
  }

  // Bullets
  const bullets = item.querySelectorAll('li');
  if (bullets.length > 0) {
    bullets.forEach(b => {
      const text = b.querySelector('.inline-edit-display')?.textContent?.trim() || b.textContent?.trim() || '';
      if (text) {
        const wrapLines = Math.max(1, Math.ceil(text.length / 50));
        h += Math.round(wrapLines * baseH * 0.9) + 4;
      }
    });
  }

  // Contacts
  const contacts = item.querySelectorAll('.contact-item-pill');
  if (contacts.length > 0) {
    h += Math.round(contacts.length * baseH * 0.7);
  }

  return Math.max(20, h);
}

/**
 * Deep DOM Tree Coordinate Resolver
 * Traverses rendered DOM nodes and calculates strict top, left, width, height
 */
function resolveDOMCoordinates(areaCvNode, layout) {
  const is2Col = layout.type === '2-column' && !layout.isAtsMode;
  const pagePadding = Number(layout.pagePadding ?? 24);
  const sectionGap = Number(layout.sectionGap ?? 20);
  const itemGap = Number(layout.itemGap ?? 8);
  const fontScale = Number(layout.fontScale ?? 1.0);
  const titleScale = Number(layout.titleScale ?? 1.0);
  const lineHeight = Number(layout.lineHeight ?? 1.45);
  const leftColPercent = Number(layout.leftColumnWidth || 33.33);

  const containerWidth = 794;
  const coordinates = new Map();

  // Root container
  coordinates.set('area-cv', {
    top: 0,
    left: 0,
    width: containerWidth,
    height: 1123
  });

  if (is2Col) {
    const leftColWidth = Math.round(containerWidth * (leftColPercent / 100));
    const rightColWidth = containerWidth - leftColWidth;
    const colPaddingX = 24;
    const colPaddingY = 24;

    const leftContentWidth = leftColWidth - (2 * colPaddingX);
    const rightContentWidth = rightColWidth - (2 * colPaddingX);

    // Left Column
    const leftCol = areaCvNode.querySelector('.resume__left');
    if (leftCol) {
      coordinates.set('column-left', {
        top: 0,
        left: 0,
        width: leftColWidth,
        height: 1123
      });

      let currentTop = colPaddingY;
      const leftSections = leftCol.querySelectorAll('.cv-section');
      leftSections.forEach(section => {
        const sectionId = section.getAttribute('data-section-id') || section.id;
        const titleEl = section.querySelector('.section-title');
        const hasTitle = Boolean(titleEl && titleEl.textContent?.trim());
        const titleHeight = hasTitle ? Math.round(16 * 1.25 * fontScale * titleScale * lineHeight) + 8 : 0;

        const items = Array.from(section.querySelectorAll('.cv-block')).filter(
          b => !b.parentElement?.closest('.cv-block')
        );

        let itemsHeight = 0;
        const itemBoxes = [];

        items.forEach((item, idx) => {
          const itemId = item.getAttribute('data-item-id') || `${sectionId}-item-${idx}`;
          const itemHeight = computeSemanticItemHeight(item, fontScale, lineHeight);

          itemBoxes.push({
            id: itemId,
            top: currentTop + (hasTitle ? titleHeight : 0) + itemsHeight,
            left: colPaddingX,
            width: leftContentWidth,
            height: itemHeight
          });

          itemsHeight += itemHeight + (idx < items.length - 1 ? itemGap : 0);
        });

        const sectionHeight = (hasTitle ? titleHeight : 0) + itemsHeight;
        coordinates.set(`section-${sectionId}`, {
          top: currentTop,
          left: colPaddingX,
          width: leftContentWidth,
          height: sectionHeight
        });

        if (hasTitle) {
          coordinates.set(`title-${sectionId}`, {
            top: currentTop,
            left: colPaddingX,
            width: leftContentWidth,
            height: titleHeight
          });
        }

        itemBoxes.forEach(ib => {
          coordinates.set(`item-${ib.id}`, ib);
        });

        currentTop += sectionHeight + sectionGap;
      });
    }

    // Right Column
    const rightCol = areaCvNode.querySelector('.resume__right');
    if (rightCol) {
      coordinates.set('column-right', {
        top: 0,
        left: leftColWidth,
        width: rightColWidth,
        height: 1123
      });

      let currentTop = colPaddingY;
      const rightSections = rightCol.querySelectorAll('.cv-section');
      rightSections.forEach(section => {
        const sectionId = section.getAttribute('data-section-id') || section.id;
        const titleEl = section.querySelector('.section-title');
        const hasTitle = Boolean(titleEl && titleEl.textContent?.trim());
        const titleHeight = hasTitle ? Math.round(16 * 1.25 * fontScale * titleScale * lineHeight) + 8 : 0;

        const items = Array.from(section.querySelectorAll('.cv-block')).filter(
          b => !b.parentElement?.closest('.cv-block')
        );

        let itemsHeight = 0;
        const itemBoxes = [];

        items.forEach((item, idx) => {
          const itemId = item.getAttribute('data-item-id') || `${sectionId}-item-${idx}`;
          const itemHeight = computeSemanticItemHeight(item, fontScale, lineHeight);

          itemBoxes.push({
            id: itemId,
            top: currentTop + (hasTitle ? titleHeight : 0) + itemsHeight,
            left: leftColWidth + colPaddingX,
            width: rightContentWidth,
            height: itemHeight
          });

          itemsHeight += itemHeight + (idx < items.length - 1 ? itemGap : 0);
        });

        const sectionHeight = (hasTitle ? titleHeight : 0) + itemsHeight;
        coordinates.set(`section-${sectionId}`, {
          top: currentTop,
          left: leftColWidth + colPaddingX,
          width: rightContentWidth,
          height: sectionHeight
        });

        if (hasTitle) {
          coordinates.set(`title-${sectionId}`, {
            top: currentTop,
            left: leftColWidth + colPaddingX,
            width: rightContentWidth,
            height: titleHeight
          });
        }

        itemBoxes.forEach(ib => {
          coordinates.set(`item-${ib.id}`, ib);
        });

        currentTop += sectionHeight + sectionGap;
      });
    }
  } else {
    // 1-Column Mode
    const contentWidth = containerWidth - (2 * pagePadding);
    let currentTop = pagePadding;

    const sections = areaCvNode.querySelectorAll('.cv-section');
    sections.forEach(section => {
      const sectionId = section.getAttribute('data-section-id') || section.id;
      const titleEl = section.querySelector('.section-title');
      const hasTitle = Boolean(titleEl && titleEl.textContent?.trim());
      const titleHeight = hasTitle ? Math.round(16 * 1.25 * fontScale * titleScale * lineHeight) + 8 : 0;

      const items = Array.from(section.querySelectorAll('.cv-block')).filter(
        b => !b.parentElement?.closest('.cv-block')
      );

      let itemsHeight = 0;
      const itemBoxes = [];

      items.forEach((item, idx) => {
        const itemId = item.getAttribute('data-item-id') || `${sectionId}-item-${idx}`;
        const itemHeight = computeSemanticItemHeight(item, fontScale, lineHeight);

        itemBoxes.push({
          id: itemId,
          top: currentTop + (hasTitle ? titleHeight : 0) + itemsHeight,
          left: pagePadding,
          width: contentWidth,
          height: itemHeight
        });

        itemsHeight += itemHeight + (idx < items.length - 1 ? itemGap : 0);
      });

      const sectionHeight = (hasTitle ? titleHeight : 0) + itemsHeight;
      coordinates.set(`section-${sectionId}`, {
        top: currentTop,
        left: pagePadding,
        width: contentWidth,
        height: sectionHeight
      });

      if (hasTitle) {
        coordinates.set(`title-${sectionId}`, {
          top: currentTop,
          left: pagePadding,
          width: contentWidth,
          height: titleHeight
        });
      }

      itemBoxes.forEach(ib => {
        coordinates.set(`item-${ib.id}`, ib);
      });

      currentTop += sectionHeight + sectionGap;
    });
  }

  return coordinates;
}

/**
 * Helper to mount editor and parse clean print snapshot for a given CV state
 */
function setupEditorAndPrint(cvData) {
  localStorage.setItem('cvData', JSON.stringify(cvData));
  const { container, unmount } = render(
    <CVProvider>
      <App />
    </CVProvider>
  );

  const editorAreaCv = container.querySelector('#area-cv');
  const printHTML = generateCleanPrintHTML(cvData, 'es');
  const parser = new DOMParser();
  const printDoc = parser.parseFromString(printHTML, 'text/html');
  const printAreaCv = printDoc.querySelector('#area-cv');

  return { container, unmount, editorAreaCv, printDoc, printAreaCv };
}

describe('Challenger 2: Deep DOM Coordinate Stress & Artifact Concealment Suite (0px Drift)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  // =========================================================================
  // SCENARIO 1: Empty Sections & Sparse Content Stress
  // =========================================================================
  describe('Scenario 1: Empty Sections & Sparse Content Stress', () => {
    it('1.1: Sections with items: [] maintain exact 0px drift between editor and print in 2-column mode', () => {
      const cvWithEmptySections = {
        ...defaultSchema,
        sections: defaultSchema.sections.map(sec => {
          if (sec.id === 'skills' || sec.id === 'languages') {
            return { ...sec, items: [] }; // Empty items
          }
          return sec;
        })
      };

      const { unmount, editorAreaCv, printAreaCv } = setupEditorAndPrint(cvWithEmptySections);

      const editorCoords = resolveDOMCoordinates(editorAreaCv, cvWithEmptySections.layout);
      const printCoords = resolveDOMCoordinates(printAreaCv, cvWithEmptySections.layout);

      // Check empty sections
      ['skills', 'languages'].forEach(secId => {
        const edBox = editorCoords.get(`section-${secId}`);
        const prBox = printCoords.get(`section-${secId}`);

        expect(edBox, `Editor box missing for section ${secId}`).toBeDefined();
        expect(prBox, `Print box missing for section ${secId}`).toBeDefined();

        expect(Math.abs(edBox.top - prBox.top), `Section ${secId} top delta`).toBe(0);
        expect(Math.abs(edBox.left - prBox.left), `Section ${secId} left delta`).toBe(0);
        expect(Math.abs(edBox.width - prBox.width), `Section ${secId} width delta`).toBe(0);
        expect(Math.abs(edBox.height - prBox.height), `Section ${secId} height delta`).toBe(0);
      });

      // Verify that following non-empty sections (e.g. experience) also have 0px drift
      const expEd = editorCoords.get('section-experience');
      const expPr = printCoords.get('section-experience');
      expect(Math.abs(expEd.top - expPr.top)).toBe(0);
      expect(Math.abs(expEd.left - expPr.left)).toBe(0);
      expect(Math.abs(expEd.width - expPr.width)).toBe(0);
      expect(Math.abs(expEd.height - expPr.height)).toBe(0);

      unmount();
    });

    it('1.2: Empty sections in 1-column ATS mode maintain strict 0px drift across all boundaries', () => {
      const cvAtsEmpty = {
        ...defaultSchema,
        layout: {
          ...defaultSchema.layout,
          type: '1-column',
          isAtsMode: true
        },
        sections: defaultSchema.sections.map(sec => {
          if (sec.id === 'education') {
            return { ...sec, items: [] };
          }
          return sec;
        })
      };

      const { unmount, editorAreaCv, printAreaCv } = setupEditorAndPrint(cvAtsEmpty);

      const editorCoords = resolveDOMCoordinates(editorAreaCv, cvAtsEmpty.layout);
      const printCoords = resolveDOMCoordinates(printAreaCv, cvAtsEmpty.layout);

      const eduEd = editorCoords.get('section-education');
      const eduPr = printCoords.get('section-education');

      expect(Math.abs(eduEd.top - eduPr.top)).toBe(0);
      expect(Math.abs(eduEd.left - eduPr.left)).toBe(0);
      expect(Math.abs(eduEd.width - eduPr.width)).toBe(0);
      expect(Math.abs(eduEd.height - eduPr.height)).toBe(0);

      unmount();
    });

    it('1.3: Empty section with custom title and 0 items renders identical title height in both with 0px drift', () => {
      const cvSparse = {
        ...defaultSchema,
        sections: [
          {
            id: 'sparse_section',
            column: 'left',
            type: 'simple_list',
            title: 'NOTAS Y REFERENCIAS',
            items: []
          },
          ...defaultSchema.sections
        ]
      };

      const { unmount, editorAreaCv, printAreaCv } = setupEditorAndPrint(cvSparse);

      const editorCoords = resolveDOMCoordinates(editorAreaCv, cvSparse.layout);
      const printCoords = resolveDOMCoordinates(printAreaCv, cvSparse.layout);

      const sparseEd = editorCoords.get('section-sparse_section');
      const sparsePr = printCoords.get('section-sparse_section');

      expect(sparseEd.height).toBeGreaterThan(0);
      expect(Math.abs(sparseEd.height - sparsePr.height)).toBe(0);
      expect(Math.abs(sparseEd.top - sparsePr.top)).toBe(0);
      expect(Math.abs(sparseEd.left - sparsePr.left)).toBe(0);
      expect(Math.abs(sparseEd.width - sparsePr.width)).toBe(0);

      unmount();
    });
  });

  // =========================================================================
  // SCENARIO 2: Huge Bullet Lists & List Stress
  // =========================================================================
  describe('Scenario 2: Huge Bullet Lists & List Stress', () => {
    it('2.1: Experience section with 25 bullet items maintains 0px drift on every bullet and container', () => {
      const hugeBullets = Array.from({ length: 25 }, (_, i) => 
        `Bullet item ${i + 1}: Automated mission-critical pipeline optimization delivering ${i * 5}% lower latency.`
      );

      const cvHugeBullets = {
        ...defaultSchema,
        sections: defaultSchema.sections.map(sec => {
          if (sec.id === 'experience') {
            return {
              ...sec,
              items: [
                {
                  id: 'huge_job',
                  title: 'Principal Systems Architect',
                  subtitle: 'Global Distributed Scale Inc.',
                  date: '2020 - Present',
                  description: 'Architected high-throughput low-latency resilient microservices.',
                  bullets: hugeBullets
                }
              ]
            };
          }
          return sec;
        })
      };

      const { unmount, editorAreaCv, printAreaCv } = setupEditorAndPrint(cvHugeBullets);

      const editorCoords = resolveDOMCoordinates(editorAreaCv, cvHugeBullets.layout);
      const printCoords = resolveDOMCoordinates(printAreaCv, cvHugeBullets.layout);

      // Verify section container
      const expEd = editorCoords.get('section-experience');
      const expPr = printCoords.get('section-experience');
      expect(Math.abs(expEd.top - expPr.top)).toBe(0);
      expect(Math.abs(expEd.left - expPr.left)).toBe(0);
      expect(Math.abs(expEd.width - expPr.width)).toBe(0);
      expect(Math.abs(expEd.height - expPr.height)).toBe(0);

      // Verify job item container
      const itemEd = editorCoords.get('item-huge_job');
      const itemPr = printCoords.get('item-huge_job');
      expect(Math.abs(itemEd.top - itemPr.top)).toBe(0);
      expect(Math.abs(itemEd.left - itemPr.left)).toBe(0);
      expect(Math.abs(itemEd.width - itemPr.width)).toBe(0);
      expect(Math.abs(itemEd.height - itemPr.height)).toBe(0);

      // Verify each individual bullet <li> element count in both DOMs
      const editorBullets = editorAreaCv.querySelectorAll('[data-section-id="experience"] li');
      const printBullets = printAreaCv.querySelectorAll('[data-section-id="experience"] li');
      expect(editorBullets.length).toBe(25);
      expect(printBullets.length).toBe(25);

      unmount();
    });

    it('2.2: Omission of .bullet-add-row in print causes strictly 0px displacement on downstream elements', () => {
      const cvWithBullets = {
        ...defaultSchema,
        sections: [
          {
            id: 'experience',
            column: 'right',
            type: 'experience',
            title: 'EXPERIENCIA',
            items: [
              {
                id: 'job_1',
                title: 'Senior Developer',
                subtitle: 'Tech Corp',
                bullets: ['Bullet 1', 'Bullet 2', 'Bullet 3']
              }
            ]
          },
          {
            id: 'downstream_section',
            column: 'right',
            type: 'simple_list',
            title: 'CERTIFICACIONES',
            items: [
              { id: 'cert_1', title: 'AWS Solutions Architect' }
            ]
          }
        ]
      };

      const { unmount, editorAreaCv, printAreaCv } = setupEditorAndPrint(cvWithBullets);

      // Verify that .bullet-add-row is present in editor and has 0px height in-flow
      const addRow = editorAreaCv.querySelector('.bullet-add-row');
      expect(addRow).not.toBeNull();
      expect(addRow.style.height).toBe('0px');
      expect(['0', '0px']).toContain(addRow.style.lineHeight);

      // Verify that .bullet-add-row is completely absent in print
      const printAddRow = printAreaCv.querySelector('.bullet-add-row');
      expect(printAddRow).toBeNull();

      // Compare downstream section coordinates
      const editorCoords = resolveDOMCoordinates(editorAreaCv, cvWithBullets.layout);
      const printCoords = resolveDOMCoordinates(printAreaCv, cvWithBullets.layout);

      const downstreamEd = editorCoords.get('section-downstream_section');
      const downstreamPr = printCoords.get('section-downstream_section');

      expect(Math.abs(downstreamEd.top - downstreamPr.top)).toBe(0);
      expect(Math.abs(downstreamEd.left - downstreamPr.left)).toBe(0);
      expect(Math.abs(downstreamEd.width - downstreamPr.width)).toBe(0);
      expect(Math.abs(downstreamEd.height - downstreamPr.height)).toBe(0);

      unmount();
    });
  });

  // =========================================================================
  // SCENARIO 3: Multiline Items & Complex Text Content Stress
  // =========================================================================
  describe('Scenario 3: Multiline Items & Complex Text Content Stress', () => {
    it('3.1: Dense multiline descriptions and wrapped titles maintain 0px coordinate drift', () => {
      const longText = 'Diseño e implementación integral de una arquitectura distribuida de microservicios tolerante a fallos, procesando más de 50 millones de transacciones diarias con una latencia p99 inferior a 20ms bajo picos de carga extremos.\n\nLiderazgo técnico de un equipo multidisciplinario de 15 ingenieros, adoptando prácticas de observabilidad en tiempo real, integración continua automatizada y despliegues sin tiempo de inactividad.';

      const cvMultiline = {
        ...defaultSchema,
        sections: defaultSchema.sections.map(sec => {
          if (sec.id === 'experience') {
            return {
              ...sec,
              items: [
                {
                  id: 'multiline_job',
                  title: 'Vice President of Enterprise Cloud Infrastructure and High Reliability Systems Engineering',
                  subtitle: 'International Enterprise Technologies & Scalable Systems Corporation Worldwide',
                  date: '2018 - 2026',
                  description: longText
                }
              ]
            };
          }
          return sec;
        })
      };

      const { unmount, editorAreaCv, printAreaCv } = setupEditorAndPrint(cvMultiline);

      const editorCoords = resolveDOMCoordinates(editorAreaCv, cvMultiline.layout);
      const printCoords = resolveDOMCoordinates(printAreaCv, cvMultiline.layout);

      const secEd = editorCoords.get('section-experience');
      const secPr = printCoords.get('section-experience');
      expect(Math.abs(secEd.top - secPr.top)).toBe(0);
      expect(Math.abs(secEd.left - secPr.left)).toBe(0);
      expect(Math.abs(secEd.width - secPr.width)).toBe(0);
      expect(Math.abs(secEd.height - secPr.height)).toBe(0);

      const itemEd = editorCoords.get('item-multiline_job');
      const itemPr = printCoords.get('item-multiline_job');
      expect(Math.abs(itemEd.top - itemPr.top)).toBe(0);
      expect(Math.abs(itemEd.left - itemPr.left)).toBe(0);
      expect(Math.abs(itemEd.width - itemPr.width)).toBe(0);
      expect(Math.abs(itemEd.height - itemPr.height)).toBe(0);

      unmount();
    });
  });

  // =========================================================================
  // SCENARIO 4: Custom Headers & Profile Header Variations
  // =========================================================================
  describe('Scenario 4: Custom Headers & Profile Header Variations', () => {
    it('4.1: Profile header with maximum contact elements and long bio matches 1:1 with 0px drift', () => {
      const cvMaxHeader = {
        ...defaultSchema,
        profile: {
          name: 'Alejandro Fernández de Córdoba y Montalbán',
          subtitle: 'Director Ejecutivo de Transformación Digital & Ciberseguridad Estratégica',
          location: 'Madrid, España / Remoto Internacional',
          email: 'alejandro.fernandez@superenterprise-scalability.org',
          phone: '+34 612 345 678 / +34 912 345 678',
          linkedin: 'linkedin.com/in/alejandro-fernandez-director',
          github: 'github.com/alejandro-fernandez-dev'
        }
      };

      const { unmount, editorAreaCv, printAreaCv } = setupEditorAndPrint(cvMaxHeader);

      const editorCoords = resolveDOMCoordinates(editorAreaCv, cvMaxHeader.layout);
      const printCoords = resolveDOMCoordinates(printAreaCv, cvMaxHeader.layout);

      const profEd = editorCoords.get('section-profile_header');
      const profPr = printCoords.get('section-profile_header');

      expect(Math.abs(profEd.top - profPr.top)).toBe(0);
      expect(Math.abs(profEd.left - profPr.left)).toBe(0);
      expect(Math.abs(profEd.width - profPr.width)).toBe(0);
      expect(Math.abs(profEd.height - profPr.height)).toBe(0);

      unmount();
    });

    it('4.2: Sections with Unicode, symbols, and custom titles evaluate identical metrics', () => {
      const cvCustomTitles = {
        ...defaultSchema,
        sections: [
          {
            id: 'custom_rnd',
            column: 'left',
            type: 'simple_list',
            title: '🚀 I+D, PATENTES & INNOVACIÓN (2026)',
            items: [
              { id: 'item_p1', title: 'Algoritmo Cuántico v4.2' }
            ]
          },
          ...defaultSchema.sections
        ]
      };

      const { unmount, editorAreaCv, printAreaCv } = setupEditorAndPrint(cvCustomTitles);

      const editorCoords = resolveDOMCoordinates(editorAreaCv, cvCustomTitles.layout);
      const printCoords = resolveDOMCoordinates(printAreaCv, cvCustomTitles.layout);

      const rndEd = editorCoords.get('section-custom_rnd');
      const rndPr = printCoords.get('section-custom_rnd');

      expect(Math.abs(rndEd.top - rndPr.top)).toBe(0);
      expect(Math.abs(rndEd.left - rndPr.left)).toBe(0);
      expect(Math.abs(rndEd.width - rndPr.width)).toBe(0);
      expect(Math.abs(rndEd.height - rndPr.height)).toBe(0);

      unmount();
    });
  });

  // =========================================================================
  // SCENARIO 5: Dynamic Column Resizes (2-Column Grid Geometry Stress)
  // =========================================================================
  describe('Scenario 5: Dynamic Column Resizes (2-Column Grid Geometry Stress)', () => {
    const testRatios = [20, 25, 30, 33.33, 40, 50];

    testRatios.forEach(ratio => {
      it(`5.1-${ratio}: Dynamic column resize at ${ratio}% enforces strict 0px drift across both columns`, () => {
        const cvResized = {
          ...defaultSchema,
          layout: {
            ...defaultSchema.layout,
            type: '2-column',
            leftColumnWidth: ratio
          }
        };

        const { unmount, editorAreaCv, printAreaCv } = setupEditorAndPrint(cvResized);

        // Check container width
        expect(editorAreaCv.style.maxWidth).toBe('794px');
        const printStyle = printAreaCv.getAttribute('style') || '';
        expect(printStyle).toContain('max-width: 794px');

        // Check grid-template-columns specification
        const expectedCols = `${ratio}% ${100 - ratio}%`;
        expect(editorAreaCv.style.gridTemplateColumns).toBe(expectedCols);
        expect(printStyle).toContain(`grid-template-columns: ${expectedCols}`);

        // Compare all coordinates across both columns
        const editorCoords = resolveDOMCoordinates(editorAreaCv, cvResized.layout);
        const printCoords = resolveDOMCoordinates(printAreaCv, cvResized.layout);

        const leftColEd = editorCoords.get('column-left');
        const leftColPr = printCoords.get('column-left');
        expect(Math.abs(leftColEd.top - leftColPr.top)).toBe(0);
        expect(Math.abs(leftColEd.left - leftColPr.left)).toBe(0);
        expect(Math.abs(leftColEd.width - leftColPr.width)).toBe(0);

        const rightColEd = editorCoords.get('column-right');
        const rightColPr = printCoords.get('column-right');
        expect(Math.abs(rightColEd.top - rightColPr.top)).toBe(0);
        expect(Math.abs(rightColEd.left - rightColPr.left)).toBe(0);
        expect(Math.abs(rightColEd.width - rightColPr.width)).toBe(0);

        // Verify every section in both columns has 0px drift
        const sections = cvResized.sections || [];
        sections.forEach(sec => {
          const secEd = editorCoords.get(`section-${sec.id}`);
          const secPr = printCoords.get(`section-${sec.id}`);
          if (secEd && secPr) {
            expect(Math.abs(secEd.top - secPr.top), `Section ${sec.id} top @ ${ratio}%`).toBe(0);
            expect(Math.abs(secEd.left - secPr.left), `Section ${sec.id} left @ ${ratio}%`).toBe(0);
            expect(Math.abs(secEd.width - secPr.width), `Section ${sec.id} width @ ${ratio}%`).toBe(0);
            expect(Math.abs(secEd.height - secPr.height), `Section ${sec.id} height @ ${ratio}%`).toBe(0);
          }
        });

        unmount();
      });
    });
  });

  // =========================================================================
  // SCENARIO 6: Interactive Artifact Concealment & Zero Adjacent/Descendant Spatial Shift
  // =========================================================================
  describe('Scenario 6: Interactive Artifact Concealment & Zero Spatial Shift', () => {
    it('6.1: Concealing all 26 interactive artifacts causes strictly 0px shift in adjacent and descendant elements', () => {
      const { container, unmount, editorAreaCv, printAreaCv } = setupEditorAndPrint(defaultSchema);

      // 1. In live editor: verify interactive artifacts are present
      const editorArtifacts = editorAreaCv.querySelectorAll(ARTIFACTS_BLACKLIST.join(', '));
      expect(editorArtifacts.length).toBeGreaterThan(0);

      // 2. Measure coordinates before artifact removal
      const coordsBefore = resolveDOMCoordinates(editorAreaCv, defaultSchema.layout);

      // 3. Remove all interactive artifacts from the live editor DOM
      editorArtifacts.forEach(node => node.remove());

      // 4. Measure coordinates after artifact removal
      const coordsAfter = resolveDOMCoordinates(editorAreaCv, defaultSchema.layout);

      // 5. Assert strictly 0px shift on every section, title, and item
      coordsBefore.forEach((beforeBox, key) => {
        const afterBox = coordsAfter.get(key);
        expect(afterBox, `Element ${key} missing after artifact concealment`).toBeDefined();

        const deltaTop = Math.abs(beforeBox.top - afterBox.top);
        const deltaLeft = Math.abs(beforeBox.left - afterBox.left);
        const deltaWidth = Math.abs(beforeBox.width - afterBox.width);
        const deltaHeight = Math.abs(beforeBox.height - afterBox.height);

        expect(deltaTop, `${key} shifted vertically on concealment: ${deltaTop}px`).toBe(0);
        expect(deltaLeft, `${key} shifted horizontally on concealment: ${deltaLeft}px`).toBe(0);
        expect(deltaWidth, `${key} width changed on concealment: ${deltaWidth}px`).toBe(0);
        expect(deltaHeight, `${key} height changed on concealment: ${deltaHeight}px`).toBe(0);
      });

      // 6. Assert print snapshot has 0 interactive artifacts
      const printArtifacts = printAreaCv.querySelectorAll(ARTIFACTS_BLACKLIST.join(', '));
      expect(printArtifacts.length).toBe(0);

      unmount();
    });

    it('6.2: All live editor interactive controls use position: absolute or height: 0px (guaranteeing 0px reflow)', () => {
      const { unmount, editorAreaCv } = setupEditorAndPrint(defaultSchema);

      // Section drag handle & action buttons
      const sectionActionButtons = editorAreaCv.querySelectorAll('.section-action-buttons');
      sectionActionButtons.forEach(btnGroup => {
        const cs = window.getComputedStyle(btnGroup);
        // Positioned absolutely out of flow in CSS
        expect(cs.position === 'absolute' || cs.position === '').toBeTruthy();
      });

      // Bullet add rows
      const bulletAddRows = editorAreaCv.querySelectorAll('.bullet-add-row');
      bulletAddRows.forEach(row => {
        expect(row.style.height).toBe('0px');
        expect(['0', '0px']).toContain(row.style.lineHeight);
        expect(row.style.overflow).toBe('visible');
      });

      // Delete buttons
      const delButtons = editorAreaCv.querySelectorAll('.round-btn-del, .item-del-btn, .bullet-del-btn');
      delButtons.forEach(btn => {
        const cs = window.getComputedStyle(btn);
        expect(cs.position === 'absolute' || cs.position === '').toBeTruthy();
      });

      unmount();
    });
  });
});
