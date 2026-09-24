import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  generateCleanPrintHTML, 
  executeCleanPrint, 
  calculatePrintScale, 
  escapeHTML 
} from '../utils/staticHtmlPdfEngine';

/**
 * Fixture: Comprehensive CV dataset containing all 13 registered section types
 */
const buildCompleteCVData = (layoutOverrides = {}) => ({
  profile: {
    name: 'JUAN IGNACIO CARRIZO',
    subtitle: 'Senior Full-Stack Engineer & Systems Architect',
    location: 'San Miguel de Tucumán, Argentina',
    email: 'juanicarrizo97@gmail.com',
    phone: '+54 9 381 6706133',
    linkedin: 'linkedin.com/in/juan-ignacio-carrizo-juani981',
    github: 'github.com/juani981'
  },
  layout: {
    type: '2-column',
    fontFamily: 'Poppins',
    fontScale: 1.0,
    titleScale: 1.0,
    bodyScale: 1.0,
    listScale: 1.0,
    lineHeight: 1.45,
    pagePadding: 24,
    sectionGap: 20,
    itemGap: 8,
    leftBg: '#fafafa',
    rightBg: '#ffffff',
    leftColumnWidth: null,
    ...layoutOverrides
  },
  sections: [
    // 1. Profile Header
    {
      id: 'profile_header',
      type: 'profile_header',
      column: 'left',
      title: '',
      items: [{
        id: 'prof_1',
        name: 'JUAN IGNACIO CARRIZO',
        subtitle: 'Senior Full-Stack Engineer & Systems Architect',
        location: 'San Miguel de Tucumán, Argentina',
        email: 'juanicarrizo97@gmail.com',
        phone: '+54 9 381 6706133',
        linkedin: 'linkedin.com/in/juan-ignacio-carrizo-juani981',
        github: 'github.com/juani981'
      }]
    },
    // 2. About / Profile Description
    {
      id: 'about',
      type: 'about',
      column: 'left',
      title: 'Perfil Profesional',
      items: [{
        id: 'about_1',
        description: 'Ingeniero de software especializado en arquitecturas distribuidas y modernización de sistemas legacy.'
      }]
    },
    // 3. Experience (list)
    {
      id: 'experience',
      type: 'list',
      column: 'right',
      title: 'EXPERIENCIA LABORAL',
      items: [{
        id: 'exp_1',
        title: 'Desarrollador Web Full-Stack',
        subtitle: 'Dirección General de Catastro',
        date: '2023 – Actualidad',
        description: 'Liderazgo técnico en modernización de arquitecturas de bases de datos.',
        bullets: [
          'Refactorización integral de microservicios PHP y backend C#.',
          'Optimización de planes de ejecución en PostgreSQL y Oracle.'
        ]
      }]
    },
    // 4. Projects
    {
      id: 'projects',
      type: 'projects',
      column: 'right',
      title: 'PROYECTOS DESTACADOS',
      items: [{
        id: 'proj_1',
        title: 'Ressume PDF Vector Engine',
        subtitle: 'React · TypeScript · CSS Grid',
        date: '2025',
        link: 'github.com/juani981/Ressume',
        linkText: 'Demo / Repositorio',
        description: 'Motor de exportación de CVs con 100% de texto seleccionable y cero artefactos.',
        bullets: ['Renderizado estático A4 sin pérdida de calidad']
      }]
    },
    // 5. Education
    {
      id: 'education',
      type: 'education',
      column: 'left',
      title: 'EDUCACIÓN',
      items: [{
        id: 'edu_1',
        title: 'Ingeniería en Informática',
        subtitle: 'Universidad Nacional de Tucumán',
        date: '2020 – 2025'
      }]
    },
    // 6. Skills
    {
      id: 'skills',
      type: 'skills',
      column: 'left',
      title: 'HABILIDADES TÉCNICAS',
      items: [{
        id: 'skill_1',
        title: 'Backend & Cloud',
        description: 'PostgreSQL, Docker, CI/CD, Node.js, PHP, C#'
      }]
    },
    // 7. Certificates
    {
      id: 'certificates',
      type: 'certificates',
      column: 'right',
      title: 'CERTIFICACIONES',
      items: [{
        id: 'cert_1',
        title: 'AWS Certified Solutions Architect',
        subtitle: 'Amazon Web Services',
        date: '2025',
        credentialId: 'AWS-PSA-98214',
        link: 'aws.amazon.com/verify',
        linkText: 'Verificar Credencial'
      }]
    },
    // 8. Languages
    {
      id: 'languages',
      type: 'languages',
      column: 'left',
      title: 'IDIOMAS',
      items: [{
        id: 'lang_1',
        title: 'Inglés',
        subtitle: 'C2 Avanzado / Profesional',
        description: 'Certificación EF SET 75/100'
      }]
    },
    // 9. Awards
    {
      id: 'awards',
      type: 'awards',
      column: 'right',
      title: 'PREMIOS Y DISTINCIONES',
      items: [{
        id: 'award_1',
        title: '1er Puesto — Hackathon de IA',
        subtitle: 'MinCyT & IEEE',
        date: '2024',
        description: 'Premio por desarrollo de sistema de diagnóstico predictivo.'
      }]
    },
    // 10. Publications
    {
      id: 'publications',
      type: 'publications',
      column: 'right',
      title: 'PUBLICACIONES',
      items: [{
        id: 'pub_1',
        title: 'Optimización de Microservicios con Event-Driven Design',
        subtitle: 'IEEE Latin America Transactions',
        date: '2024',
        link: 'doi.org/10.1109/sample-paper',
        linkText: 'Leer Paper',
        description: 'Análisis de rendimiento en backends de alta concurrencia.'
      }]
    },
    // 11. Volunteering
    {
      id: 'volunteering',
      type: 'volunteering',
      column: 'right',
      title: 'VOLUNTARIADO Y LIDERAZGO',
      items: [{
        id: 'vol_1',
        title: 'Mentor Comunitario',
        subtitle: 'Open Source Argentina',
        date: '2023 – Presente',
        description: 'Capacitación en programación para estudiantes.',
        bullets: ['Talleres de Git y desarrollo web moderno']
      }]
    },
    // 12. References
    {
      id: 'references',
      type: 'references',
      column: 'left',
      title: 'REFERENCIAS',
      items: [{
        id: 'ref_1',
        title: 'Ing. Martín González',
        subtitle: 'Líder de Arquitectura en Globant',
        email: 'martin.gonzalez@ejemplo.com',
        phone: '+54 9 381 555-1234',
        relationship: 'Ex-Líder Técnico Directo'
      }]
    },
    // 13. Simple List
    {
      id: 'simple_list',
      type: 'simple_list',
      column: 'right',
      title: 'CURSOS ADICIONALES',
      items: [{
        id: 'sl_1',
        text: 'Diplomatura en Ingeniería de Datos de Alto Rendimiento — UNT (2024)'
      }]
    }
  ]
});

// The 18-selector blacklist across all interactive editor controls
const BLACKLIST_SELECTORS = [
  '.section-drag-handle',
  '.item-drag-handle',
  '.drag-handle',
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
  '.section-tips-toggle-btn',
  '.suggestion-tooltip',
  '.obsidian-callout',
  '.column-resizer',
  '.l-navbar'
];

describe('Clean Print & PDF Export Engine Automated Verification Suite', () => {
  let fullCVData;

  beforeEach(() => {
    fullCVData = buildCompleteCVData();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.querySelectorAll('iframe').forEach(el => el.remove());
  });

  // =========================================================================
  // PILLAR 1: 100% Vector & Selectable Text (0% Canvas Rasterization)
  // =========================================================================
  describe('Pillar 1: 100% Vector & Selectable Text (0% Canvas Rasterization)', () => {
    it('T1.1: produces 0% canvas rasterization (0 <canvas> elements) across 1-col and 2-col modes', () => {
      const html2Col = generateCleanPrintHTML(fullCVData);
      const doc2Col = new DOMParser().parseFromString(html2Col, 'text/html');
      expect(doc2Col.querySelectorAll('canvas').length).toBe(0);

      const html1Col = generateCleanPrintHTML({
        ...fullCVData,
        layout: { ...fullCVData.layout, type: '1-column' }
      });
      const doc1Col = new DOMParser().parseFromString(html1Col, 'text/html');
      expect(doc1Col.querySelectorAll('canvas').length).toBe(0);
    });

    it('T1.2: contains 0 Base64 screenshot images or raster image elements in DOM or CSS', () => {
      const html = generateCleanPrintHTML(fullCVData);
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const base64Images = doc.querySelectorAll('img[src^="data:image"], img[src*="base64"]');
      expect(base64Images.length).toBe(0);
      expect(html).not.toMatch(/data:image\/(?:png|jpeg|webp|gif);base64/i);
    });

    it('T1.3: preserves full semantic text hierarchy (h1, h2, h3, p, li, span) across all CV sections', () => {
      const html = generateCleanPrintHTML(fullCVData);
      const doc = new DOMParser().parseFromString(html, 'text/html');

      // h1 Candidate Name
      const h1 = doc.querySelector('h1.home__title');
      expect(h1).not.toBeNull();
      expect(h1.textContent).toBe('JUAN IGNACIO CARRIZO');

      // h2 Subtitle and Section Titles
      const h2Subtitle = doc.querySelector('h2.home__subtitle');
      expect(h2Subtitle).not.toBeNull();
      expect(h2Subtitle.textContent).toBe('Senior Full-Stack Engineer & Systems Architect');

      const sectionTitles = doc.querySelectorAll('h2.section-title');
      expect(sectionTitles.length).toBeGreaterThanOrEqual(10);

      // h3 Item Titles
      const h3Titles = doc.querySelectorAll('h3');
      expect(h3Titles.length).toBeGreaterThanOrEqual(5);

      // p Descriptions
      const pDescriptions = doc.querySelectorAll('p');
      expect(pDescriptions.length).toBeGreaterThanOrEqual(3);

      // li Skills and Bullets
      const liElements = doc.querySelectorAll('li');
      expect(liElements.length).toBeGreaterThanOrEqual(4);

      // span Metadata, Dates, Badges
      const spanElements = doc.querySelectorAll('span');
      expect(spanElements.length).toBeGreaterThanOrEqual(10);
    });

    it('T1.4: renders vector icons (lucide-react SVGs) with correct Lucide classes and 0 raster artifacts', () => {
      const html = generateCleanPrintHTML(fullCVData);
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const svgs = doc.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThanOrEqual(8);

      const svgClasses = Array.from(svgs).map(s => s.getAttribute('class') || '');

      // Contact vector icons
      expect(svgClasses.some(c => c.includes('lucide-map-pin'))).toBe(true);
      expect(svgClasses.some(c => c.includes('lucide-mail'))).toBe(true);
      expect(svgClasses.some(c => c.includes('lucide-phone'))).toBe(true);
      expect(svgClasses.some(c => c.includes('lucide-share-2') || c.includes('lucide-share2'))).toBe(true);
      expect(svgClasses.some(c => c.includes('lucide-folder-git-2') || c.includes('lucide-folder-git2'))).toBe(true);

      // Section badges and action vector icons
      expect(svgClasses.some(c => c.includes('lucide-badge-check'))).toBe(true);
      expect(svgClasses.some(c => c.includes('lucide-trophy'))).toBe(true);
      expect(svgClasses.some(c => c.includes('lucide-book-open'))).toBe(true);
      expect(svgClasses.some(c => c.includes('lucide-user-check'))).toBe(true);
      expect(svgClasses.some(c => c.includes('lucide-external-link'))).toBe(true);

      // Ensure no icons enclose raster images
      for (const svg of svgs) {
        expect(svg.querySelector('img')).toBeNull();
        expect(svg.querySelector('canvas')).toBeNull();
      }

      // Ensure external BoxIcons stylesheet is strictly absent
      const boxiconsLink = doc.querySelector('link[href*="boxicons"]');
      expect(boxiconsLink).toBeNull();
    });

    it('T1.5: extracts 100% selectable text stream without content degradation or missing entities', () => {
      const html = generateCleanPrintHTML(fullCVData);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const text = doc.body.textContent;

      expect(text).toContain('JUAN IGNACIO CARRIZO');
      expect(text).toContain('Senior Full-Stack Engineer');
      expect(text).toContain('Dirección General de Catastro');
      expect(text).toContain('Ressume PDF Vector Engine');
      expect(text).toContain('Ingeniería en Informática');
      expect(text).toContain('AWS Certified Solutions Architect');
      expect(text).toContain('AWS-PSA-98214');
      expect(text).toContain('1er Puesto — Hackathon de IA');
      expect(text).toContain('Ing. Martín González');
      expect(text).toContain('Diplomatura en Ingeniería de Datos');
    });
  });

  // =========================================================================
  // PILLAR 2: Complete Interactive Artifact Stripping (18-Selector Blacklist)
  // =========================================================================
  describe('Pillar 2: Complete Interactive Artifact Stripping (18-Selector Blacklist)', () => {
    it('T2.1: queries parsed document with 18-selector blacklist across all 13 section types, asserting each returns 0 nodes', () => {
      const html = generateCleanPrintHTML(fullCVData);
      const doc = new DOMParser().parseFromString(html, 'text/html');

      for (const selector of BLACKLIST_SELECTORS) {
        const nodes = doc.querySelectorAll(selector);
        expect(nodes.length, `Expected 0 nodes for selector "${selector}", but found ${nodes.length}`).toBe(0);
      }
    });

    it('T2.2: combined blacklist query across all 13 sections returns 0 total nodes', () => {
      const html = generateCleanPrintHTML(fullCVData);
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const combinedSelector = BLACKLIST_SELECTORS.join(', ');
      const matchedNodes = doc.querySelectorAll(combinedSelector);
      expect(matchedNodes.length).toBe(0);
    });

    it('T2.3: eliminates all interactive form elements (input, textarea, button, select) from print output', () => {
      const html = generateCleanPrintHTML(fullCVData);
      const doc = new DOMParser().parseFromString(html, 'text/html');

      expect(doc.querySelectorAll('input').length).toBe(0);
      expect(doc.querySelectorAll('textarea').length).toBe(0);
      expect(doc.querySelectorAll('button').length).toBe(0);
      expect(doc.querySelectorAll('select').length).toBe(0);
    });

    it('T2.4: verifies that editable fields render as plain semantic text nodes without contenteditable or inline-input', () => {
      const html = generateCleanPrintHTML(fullCVData);
      const doc = new DOMParser().parseFromString(html, 'text/html');

      expect(doc.querySelectorAll('[contenteditable="true"]').length).toBe(0);
      expect(doc.querySelectorAll('.inline-input').length).toBe(0);
    });

    it('T2.5: defense-in-depth raw HTML scan confirms zero editor UI strings leak into document markup', () => {
      const html = generateCleanPrintHTML(fullCVData);

      expect(html).not.toContain('drag-handle');
      expect(html).not.toContain('round-btn-del');
      expect(html).not.toContain('round-btn-add');
      expect(html).not.toContain('suggestion-tooltip');
      expect(html).not.toContain('obsidian-callout');
      expect(html).not.toContain('column-resizer');
      expect(html).not.toContain('l-navbar');
    });
  });

  // =========================================================================
  // PILLAR 3: Strict Zero-Split Super-Container Pagination
  // =========================================================================
  describe('Pillar 3: Strict Zero-Split Super-Container Pagination', () => {
    it('T3.1: enforces break-inside: avoid !important and page-break-inside: avoid !important in style block', () => {
      const html = generateCleanPrintHTML(fullCVData);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const styleContent = Array.from(doc.querySelectorAll('style')).map(s => s.textContent).join('\n');

      expect(styleContent).toMatch(/break-inside:\s*avoid\s*!important/i);
      expect(styleContent).toMatch(/page-break-inside:\s*avoid\s*!important/i);
    });

    it('T3.2: super-container rule block targets .cv-section, .cv-block, .experience__content, .education__content, and .skills__name', () => {
      const html = generateCleanPrintHTML(fullCVData);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const styleContent = Array.from(doc.querySelectorAll('style')).map(s => s.textContent).join('\n');

      expect(styleContent).toContain('.cv-section');
      expect(styleContent).toContain('.cv-block');
      expect(styleContent).toContain('.experience__content');
      expect(styleContent).toContain('.education__content');
      expect(styleContent).toContain('.skills__name');
    });

    it('T3.3: enforces orphan header protection on headings with break-after: avoid !important', () => {
      const html = generateCleanPrintHTML(fullCVData);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const styleContent = Array.from(doc.querySelectorAll('style')).map(s => s.textContent).join('\n');

      expect(styleContent).toMatch(/break-after:\s*avoid\s*!important/i);
      expect(styleContent).toMatch(/page-break-after:\s*avoid\s*!important/i);
      expect(styleContent).toMatch(/(?:\.section-title|h1|h2|h3)[^{]*\{[^}]*break-after:\s*avoid\s*!important/is);
    });

    it('T3.4: verifies that all rendered sections carry .cv-section and all items carry .cv-block', () => {
      const html = generateCleanPrintHTML(fullCVData);
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const sections = doc.querySelectorAll('section');
      expect(sections.length).toBeGreaterThanOrEqual(10);
      for (const sec of sections) {
        expect(sec.classList.contains('cv-section')).toBe(true);
      }

      const blocks = doc.querySelectorAll('.cv-block');
      expect(blocks.length).toBeGreaterThanOrEqual(15);
    });

    it('T3.5: embeds @media print rules enforcing A4 size, zero margins, and exact color reproduction', () => {
      const html = generateCleanPrintHTML(fullCVData);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const styleContent = Array.from(doc.querySelectorAll('style')).map(s => s.textContent).join('\n');

      expect(styleContent).toContain('@media print');
      expect(styleContent).toMatch(/size:\s*A4/i);
      expect(styleContent).toMatch(/print-color-adjust:\s*exact\s*!important/i);
      expect(styleContent).toMatch(/-webkit-print-color-adjust:\s*exact\s*!important/i);
    });

    it('T3.6: verifies that all three required print style tags (cv-base-styles, cv-print-styles, cv-snapshot-breaks) are injected with discrete IDs', () => {
      const html = generateCleanPrintHTML(fullCVData);
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const baseStylesTag = doc.getElementById('cv-base-styles');
      const printStylesTag = doc.getElementById('cv-print-styles');
      const snapshotBreaksTag = doc.getElementById('cv-snapshot-breaks');

      expect(baseStylesTag, '<style id="cv-base-styles"> is missing').not.toBeNull();
      expect(printStylesTag, '<style id="cv-print-styles"> is missing').not.toBeNull();
      expect(snapshotBreaksTag, '<style id="cv-snapshot-breaks"> is missing').not.toBeNull();

      expect(baseStylesTag.textContent).toContain('--page-padding:');
      expect(printStylesTag.textContent).toContain('@media print');
    });
  });

  // =========================================================================
  // PILLAR 4: Dynamic Typography & CSS Variables Binding
  // =========================================================================
  describe('Pillar 4: Dynamic Typography & CSS Variables Binding', () => {
    it('T4.1: evaluates and binds custom layout spacing and typography values into :root CSS variables', () => {
      const customLayoutCV = {
        ...fullCVData,
        layout: {
          ...fullCVData.layout,
          pagePadding: 36,
          sectionGap: 28,
          itemGap: 14,
          fontScale: 1.15,
          titleScale: 1.25,
          bodyScale: 0.95,
          listScale: 1.10,
          lineHeight: 1.65,
          fontFamily: 'Inter'
        }
      };

      const html = generateCleanPrintHTML(customLayoutCV);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const styleText = doc.querySelector('style')?.textContent || '';

      expect(styleText).toMatch(/--page-padding:\s*36px;/);
      expect(styleText).toMatch(/--section-gap:\s*28px;/);
      expect(styleText).toMatch(/--item-gap:\s*14px;/);
      expect(styleText).toMatch(/--font-scale:\s*1\.15;/);
      expect(styleText).toMatch(/--title-scale:\s*1\.25;/);
      expect(styleText).toMatch(/--body-scale:\s*0\.95;/);
      expect(styleText).toMatch(/--list-scale:\s*1\.1/);
      expect(styleText).toMatch(/--line-height:\s*1\.65;/);
      expect(styleText).toMatch(/--body-font:\s*'Inter',\s*sans-serif;/);
    });

    it('T4.2: maps all 5 curated font families accurately to their respective CSS font declarations', () => {
      const fontTests = [
        { name: 'Poppins', expected: "'Poppins', sans-serif" },
        { name: 'Inter', expected: "'Inter', sans-serif" },
        { name: 'Roboto', expected: "'Roboto', sans-serif" },
        { name: 'Merriweather', expected: "'Merriweather', serif" },
        { name: 'JetBrains Mono', expected: "'JetBrains Mono', monospace" }
      ];

      for (const { name, expected } of fontTests) {
        const html = generateCleanPrintHTML({
          ...fullCVData,
          layout: { ...fullCVData.layout, fontFamily: name }
        });
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const styleText = doc.querySelector('style')?.textContent || '';
        expect(styleText).toContain(`--body-font: ${expected};`);
      }
    });

    it('T4.3: renders 1-column ATS container geometry (794px centered block, no left/right split columns)', () => {
      const html1Col = generateCleanPrintHTML({
        ...fullCVData,
        layout: { ...fullCVData.layout, type: '1-column', pagePadding: 30 }
      });
      const doc = new DOMParser().parseFromString(html1Col, 'text/html');
      const areaCv = doc.getElementById('area-cv');

      expect(areaCv).not.toBeNull();
      expect(areaCv.classList.contains('resume__single-column')).toBe(true);
      expect(areaCv.getAttribute('style')).toContain('max-width: 794px');
      expect(areaCv.getAttribute('style')).toContain('margin: 0 auto');

      // Ensure no separate left or right column wrappers exist
      expect(doc.querySelector('.resume__left')).toBeNull();
      expect(doc.querySelector('.resume__right')).toBeNull();

      // Ensure sections are rendered sequentially inside #area-cv
      const sections = areaCv.querySelectorAll(':scope > .cv-section');
      expect(sections.length).toBe(fullCVData.sections.length);
    });

    it('T4.4: renders 2-column grid geometry with proportional column widths and column containers', () => {
      // Test with custom leftColumnWidth (38%)
      const html2ColCustom = generateCleanPrintHTML({
        ...fullCVData,
        layout: { ...fullCVData.layout, type: '2-column', leftColumnWidth: 38 }
      });
      const docCustom = new DOMParser().parseFromString(html2ColCustom, 'text/html');
      const areaCvCustom = docCustom.getElementById('area-cv');

      expect(areaCvCustom.getAttribute('style')).toContain('display: grid');
      expect(areaCvCustom.getAttribute('style')).toContain('grid-template-columns: 38% 62%');
      expect(docCustom.querySelector('.resume__left')).not.toBeNull();
      expect(docCustom.querySelector('.resume__right')).not.toBeNull();

      // Test with default leftColumnWidth (null -> 1fr 2fr)
      const html2ColDefault = generateCleanPrintHTML({
        ...fullCVData,
        layout: { ...fullCVData.layout, type: '2-column', leftColumnWidth: null }
      });
      const docDefault = new DOMParser().parseFromString(html2ColDefault, 'text/html');
      const areaCvDefault = docDefault.getElementById('area-cv');
      expect(areaCvDefault.getAttribute('style')).toContain('grid-template-columns: 1fr 2fr');
    });

    it('T4.5: calculates dynamic text colors adaptively according to background luminance (YIQ contrast)', () => {
      const htmlDark = generateCleanPrintHTML({
        ...fullCVData,
        layout: { ...fullCVData.layout, type: '2-column', leftBg: '#0f172a', rightBg: '#ffffff' }
      });
      const docDark = new DOMParser().parseFromString(htmlDark, 'text/html');
      const leftCol = docDark.querySelector('.resume__left');
      const rightCol = docDark.querySelector('.resume__right');

      // Dark background calculates light text colors
      expect(leftCol.getAttribute('style')).toContain('--title-color: #fcfcfc');
      expect(leftCol.getAttribute('style')).toContain('--text-color: #f0efef');

      // Light background calculates dark text colors
      expect(rightCol.getAttribute('style')).toContain('--title-color: #0b0a0a');
      expect(rightCol.getAttribute('style')).toContain('--text-color: #403a3a');
    });
  });

  // =========================================================================
  // PILLAR 5: executeCleanPrint Lifecycle & Iframe Validation
  // =========================================================================
  describe('Pillar 5: executeCleanPrint Lifecycle & Iframe Validation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('T5.1: executeCleanPrint creates an offscreen iframe with standard desktop A4 dimensions (794px x 1123px)', () => {
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      executeCleanPrint(fullCVData);

      expect(appendChildSpy).toHaveBeenCalled();
      const iframe = appendChildSpy.mock.calls.find(call => call[0].tagName === 'IFRAME')?.[0];
      expect(iframe).toBeDefined();

      // Validate desktop A4 dimensions & properties
      expect(iframe.style.width).toBe('794px');
      expect(iframe.style.height).toBe('1123px');
      expect(iframe.style.position).toBe('fixed');
      expect(iframe.getAttribute('title')).toBe('Ressume Print Preview');
    });

    it('T5.2: writes clean HTML5 markup into the iframe document and closes writer stream', () => {
      let writtenHtml = '';
      vi.spyOn(document.body, 'appendChild').mockImplementation(function (child) {
        if (child.tagName === 'IFRAME') {
          Object.defineProperty(child, 'contentWindow', {
            configurable: true,
            value: {
              document: {
                open: vi.fn(),
                write: vi.fn((content) => { writtenHtml += content; }),
                close: vi.fn(),
                readyState: 'complete',
                body: { scrollHeight: 1000, style: {} }
              },
              focus: vi.fn(),
              print: vi.fn()
            }
          });
        }
        return HTMLBodyElement.prototype.appendChild.call(this, child);
      });

      executeCleanPrint(fullCVData);

      expect(writtenHtml).toContain('<!DOCTYPE html>');
      expect(writtenHtml).toContain('id="area-cv"');
      expect(writtenHtml).toContain('JUAN IGNACIO CARRIZO');
      expect(writtenHtml).not.toContain('drag-handle');
    });

    it('T5.3: calculatePrintScale accurately clamps scale within [0.75, 1.0] adhering to max 2 A4 pages (2246px)', () => {
      // Height <= 2246px -> scale is 1.0
      expect(calculatePrintScale(1000)).toBe(1.0);
      expect(calculatePrintScale(2246)).toBe(1.0);
      expect(calculatePrintScale(0)).toBe(1.0);
      expect(calculatePrintScale(null)).toBe(1.0);
      expect(calculatePrintScale(undefined)).toBe(1.0);

      // Height = 2500px -> 2246 / 2500 = 0.898
      const scale2500 = calculatePrintScale(2500);
      expect(scale2500).toBe(0.898);

      // Height = 3000px -> 2246 / 3000 = 0.749 -> clamped to 0.75 floor
      const scale3000 = calculatePrintScale(3000);
      expect(scale3000).toBe(0.75);

      // Extreme height = 10000px -> clamped to 0.75 floor
      expect(calculatePrintScale(10000)).toBe(0.75);
    });

    it('T5.4: applies auto-scale zoom factor to iframe document body when rendered height exceeds 2246px', () => {
      let assignedZoom = null;
      const mockDoc = {
        open: vi.fn(),
        write: vi.fn(),
        close: vi.fn(),
        readyState: 'complete',
        body: {
          scrollHeight: 2600,
          style: {
            set zoom(val) { assignedZoom = val; },
            get zoom() { return assignedZoom; }
          }
        }
      };

      vi.spyOn(document.body, 'appendChild').mockImplementation(function (child) {
        if (child.tagName === 'IFRAME') {
          Object.defineProperty(child, 'contentWindow', {
            configurable: true,
            value: {
              document: mockDoc,
              focus: vi.fn(),
              print: vi.fn()
            }
          });
        }
        return HTMLBodyElement.prototype.appendChild.call(this, child);
      });

      executeCleanPrint(fullCVData);

      // 2246 / 2600 = 0.864
      expect(assignedZoom).toBe(0.864);
    });

    it('T5.5: cleans up and removes iframe from DOM lifecycle via timer unmounting', () => {
      executeCleanPrint(fullCVData);

      const iframesBefore = document.querySelectorAll('iframe');
      expect(iframesBefore.length).toBeGreaterThan(0);

      // Advance timers past 1000ms cleanup threshold
      vi.advanceTimersByTime(1200);

      const iframesAfter = document.querySelectorAll('iframe');
      expect(iframesAfter.length).toBe(0);
    });

    it('T5.6: executeCleanPrint transfers dynamic CSS custom properties from editor #area-cv to print iframe root element', async () => {
      vi.useRealTimers();
      const editorAreaCv = document.createElement('div');
      editorAreaCv.id = 'area-cv';
      editorAreaCv.style.setProperty('--page-padding', '42px');
      editorAreaCv.style.setProperty('--section-gap', '30px');
      editorAreaCv.style.setProperty('--font-scale', '1.2');
      document.body.appendChild(editorAreaCv);

      let capturedDoc = null;
      const originalAppendChild = document.body.appendChild.bind(document.body);
      const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(function (child) {
        if (child && child.tagName === 'IFRAME') {
          const doc = document.implementation.createHTMLDocument('Print Preview');
          Object.defineProperty(doc, 'readyState', {
            get: () => 'complete',
            configurable: true
          });
          Object.defineProperty(doc, 'fonts', {
            get: () => ({ ready: Promise.resolve() }),
            configurable: true
          });
          capturedDoc = doc;
          Object.defineProperty(child, 'contentDocument', { get: () => doc, configurable: true });
          Object.defineProperty(child, 'contentWindow', {
            get: () => ({
              document: doc,
              focus: vi.fn(),
              print: vi.fn(),
              addEventListener: (evt, cb) => { if (evt === 'load') cb(); }
            }),
            configurable: true
          });
        }
        return originalAppendChild(child);
      });

      try {
        await executeCleanPrint(fullCVData);

        expect(capturedDoc).not.toBeNull();
        const rootStyle = capturedDoc.documentElement.style;
        expect(rootStyle.getPropertyValue('--page-padding')).toBe('42px');
        expect(rootStyle.getPropertyValue('--section-gap')).toBe('30px');
        expect(rootStyle.getPropertyValue('--font-scale')).toBe('1.2');
      } finally {
        appendSpy.mockRestore();
        if (editorAreaCv.parentNode) {
          editorAreaCv.parentNode.removeChild(editorAreaCv);
        }
      }
    });
  });
});
