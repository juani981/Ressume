import { describe, it, expect } from 'vitest';
import { defaultSchema } from '../utils/schema.js';
import { generateCleanPrintHTML } from '../services/print/cleanHtmlGenerator.js';
import { extractTextLayer } from '../utils/textLayerExtractor.js';
import { normalizePhoneNumber } from '../utils/phoneFormatter.js';
import { verifyModelPdfParity } from '../utils/parityChecker.js';
import { lintCVContent, checkIsFutureDate, CANONICAL_TECH_DICTIONARY } from '../utils/cvLinter.js';
import { sanitizeAndValidateCVSnapshot } from '../utils/cvSchemaValidator.js';
import { exportToAIMarkdown, exportToATSPlainText } from '../utils/aiExporter.js';

describe('Challenger PDF Roadmap Compliance Suite (Roadmap & Acceptance Criteria)', () => {

  // =========================================================================
  // CA-01 (RQ-026, RF-19): Block Boundary Separation & No Text Gluing
  // =========================================================================
  describe('CA-01 (RQ-026, RF-19): Texto pegado entre proyectos y bloques', () => {
    it('guarantees that extracted text layer from print HTML never glues project link/end and next project title', () => {
      const cvWithProjects = {
        ...defaultSchema,
        sections: [
          ...defaultSchema.sections.filter(s => s.id !== 'projects'),
          {
            id: 'projects',
            type: 'projects',
            title: 'Proyectos Destacados',
            column: 'right',
            items: [
              {
                id: 'proj_1',
                title: 'GitHub Projects.',
                subtitle: 'Plataforma de portafolio',
                link: 'https://github.com/juani981/projects',
                linkText: 'GitHub Projects.',
                description: 'Repositorio central de proyectos open-source.'
              },
              {
                id: 'proj_2',
                title: 'Plataforma online de reservas',
                subtitle: 'E-commerce',
                link: 'https://demo.app',
                linkText: 'Demo Online',
                description: 'Sistema completo de gestión y pagos.'
              }
            ]
          }
        ]
      };

      const html = generateCleanPrintHTML(cvWithProjects, 'es');
      const textLayer = extractTextLayer(html);

      // Must never contain glued text "GitHub Projects.Plataforma online"
      expect(textLayer).not.toContain('GitHub Projects.Plataforma online');
      // Must contain a real line break or whitespace boundary between the two
      expect(textLayer).toContain('GitHub Projects.');
      expect(textLayer).toContain('Plataforma online de reservas');

      // Check regex that there is whitespace or newline separating them
      const gluedMatch = textLayer.match(/GitHub Projects\.Plataforma online/i);
      expect(gluedMatch).toBeNull();
    });

    it('exportToAIMarkdown separates consecutive items with blank lines', () => {
      const cvData = {
        ...defaultSchema,
        sections: [
          {
            id: 'projects',
            type: 'projects',
            title: 'Proyectos Destacados',
            column: 'right',
            items: [
              {
                id: 'p1',
                title: 'Proyecto Uno',
                link: 'https://p1.dev',
                linkText: 'GitHub Projects.'
              },
              {
                id: 'p2',
                title: 'Plataforma online',
                link: 'https://p2.dev'
              }
            ]
          }
        ]
      };

      const md = exportToAIMarkdown(cvData);
      expect(md).not.toContain('GitHub Projects.Plataforma online');
      expect(md).toContain('Proyecto Uno');
      expect(md).toContain('Plataforma online');
    });
  });

  // =========================================================================
  // CA-02 (RQ-027, RF-23): Contact Formatting & Explicit Separators
  // =========================================================================
  describe('CA-02 (RQ-027, RF-23): Contacto con separadores y teléfono normalizado', () => {
    it('normalizes local and international phone numbers into standardized +XX format', () => {
      // 10 digits Argentina mobile
      expect(normalizePhoneNumber('11 1234-5678')).toBe('+54 9 11 1234-5678');
      expect(normalizePhoneNumber('1112345678')).toBe('+54 9 11 1234-5678');
      
      // Starting with 00
      expect(normalizePhoneNumber('0054 9 11 1234-5678')).toBe('+54 9 11 1234-5678');

      // Already formatted with +
      expect(normalizePhoneNumber('+54 9 11 1234-5678')).toBe('+54 9 11 1234-5678');
      expect(normalizePhoneNumber('+1 555 123 4567')).toBe('+1 555 123 4567');
    });

    it('renders contact elements in print HTML with explicit " | " text separators', () => {
      const cvWithContacts = {
        ...defaultSchema,
        sections: [
          {
            id: 'profile_header',
            type: 'profile_header',
            column: 'right',
            items: [
              {
                id: 'prof_item',
                name: 'Juan Ignacio Carrizo',
                subtitle: 'Ingeniero de Software',
                contacts: [
                  { id: 'c1', type: 'email', value: 'juan@ejemplo.com' },
                  { id: 'c2', type: 'phone', value: '11 1234-5678' },
                  { id: 'c3', type: 'location', value: 'Buenos Aires, Argentina' },
                  { id: 'c4', type: 'linkedin', value: 'linkedin.com/in/juan' },
                  { id: 'c5', type: 'github', value: 'github.com/juan' }
                ]
              }
            ]
          }
        ]
      };

      const html = generateCleanPrintHTML(cvWithContacts, 'es');
      const textLayer = extractTextLayer(html);

      // Contact text layer must have explicit pipe separators
      expect(textLayer).toContain('juan@ejemplo.com');
      expect(textLayer).toContain('|');
      expect(textLayer).toContain('+54 9 11 1234-5678');
      expect(textLayer).toContain('Buenos Aires, Argentina');

      // Check pipe separated line
      const contactLine = textLayer.split('\n').find(l => l.includes('juan@ejemplo.com'));
      expect(contactLine).toBeDefined();
      expect(contactLine).toContain(' | ');
      expect(contactLine).toContain('+54 9 11 1234-5678');
    });
  });

  // =========================================================================
  // CA-03 (RQ-036, RF-36): Model ↔ PDF Parity Audit
  // =========================================================================
  describe('CA-03 (RQ-036, RF-36): Verificación de paridad Modelo ↔ PDF', () => {
    it('detects omitted skills groups, internships, or job titles before export', () => {
      const cvData = {
        ...defaultSchema,
        sections: [
          {
            id: 'skills',
            type: 'skills',
            title: 'Habilidades Técnicas',
            items: [
              { id: 's1', title: 'Lenguajes', description: 'JavaScript, TypeScript, Python' },
              { id: 's2', title: 'Bases de Datos', description: 'PostgreSQL, Redis, MongoDB' }
            ]
          },
          {
            id: 'experience',
            type: 'experience',
            title: 'Experiencia Laboral',
            items: [
              { id: 'e1', title: 'Desarrollador Web Full-Stack', subtitle: 'Empresa Tech', date: '2023 - 2025' },
              { id: 'e2', title: 'Pasante de Soporte Técnico', subtitle: 'Facultad', date: '2021 - 2022' }
            ]
          }
        ]
      };

      // Mock an incomplete print output where "Bases de Datos" and "Pasante de Soporte Técnico" were omitted
      const incompleteHtml = `
        <div id="area-cv">
          <h2>Habilidades Técnicas</h2>
          <div>Lenguajes: JavaScript, TypeScript, Python</div>
          <h2>Experiencia Laboral</h2>
          <div>Desarrollador Web Full-Stack - Empresa Tech</div>
        </div>
      `;

      const parityReport = verifyModelPdfParity(cvData, incompleteHtml);

      expect(parityReport.isParityValid).toBe(false);
      expect(parityReport.missingItems.length).toBeGreaterThanOrEqual(2);

      const missingDatabase = parityReport.missingItems.some(it => it.itemTitle === 'Bases de Datos');
      const missingInternship = parityReport.missingItems.some(it => it.itemTitle === 'Pasante de Soporte Técnico');

      expect(missingDatabase).toBe(true);
      expect(missingInternship).toBe(true);
      expect(parityReport.summary).toContain('Aviso de Paridad');
    });

    it('returns isParityValid: true when all model items are present in rendered output', () => {
      const cvData = {
        ...defaultSchema,
        sections: [
          {
            id: 'skills',
            type: 'skills',
            title: 'Habilidades Técnicas',
            items: [
              { id: 's1', title: 'Bases de Datos', description: 'PostgreSQL, MongoDB' }
            ]
          },
          {
            id: 'experience',
            type: 'experience',
            title: 'Experiencia Laboral',
            items: [
              { id: 'e1', title: 'Desarrollador Web Full-Stack', subtitle: 'Acme', date: '2024' }
            ]
          }
        ]
      };

      const completeHtml = generateCleanPrintHTML(cvData, 'es');
      const parityReport = verifyModelPdfParity(cvData, completeHtml);

      expect(parityReport.isParityValid).toBe(true);
      expect(parityReport.missingItems.length).toBe(0);
      expect(parityReport.missingSections.length).toBe(0);
    });
  });

  // =========================================================================
  // CA-04 (RF-27): Future Dates Linter
  // =========================================================================
  describe('CA-04 (RF-27): Detección de fechas futuras sin aviso de "En curso"', () => {
    it('flags dates in the future when unlabelled, but accepts "En curso" / "Present"', () => {
      // Future date without label
      expect(checkIsFutureDate('Octubre 2026', new Date(2025, 0, 1))).toBe(true);
      expect(checkIsFutureDate('2028', new Date(2025, 0, 1))).toBe(true);
      expect(checkIsFutureDate('12/2026', new Date(2025, 0, 1))).toBe(true);

      // Future date explicitly marked as in progress or present -> Allowed
      expect(checkIsFutureDate('Octubre 2026 (En curso)', new Date(2025, 0, 1))).toBe(false);
      expect(checkIsFutureDate('2024 - Presente', new Date(2025, 0, 1))).toBe(false);
      expect(checkIsFutureDate('2026 (Esperada)', new Date(2025, 0, 1))).toBe(false);
    });

    it('lintCVContent emits warning for items with future date without badge', () => {
      const cvWithFutureDate = {
        ...defaultSchema,
        sections: [
          {
            id: 'education',
            type: 'education',
            title: 'Educación',
            items: [
              {
                id: 'edu_1',
                title: 'Licenciatura en Informática',
                subtitle: 'Universidad',
                date: 'Octubre 2029' // Definitely in future
              }
            ]
          }
        ]
      };

      const findings = lintCVContent(cvWithFutureDate);
      const futureDateFinding = findings.find(f => f.ruleId === 'RF-27');

      expect(futureDateFinding).toBeDefined();
      expect(futureDateFinding.severity).toBe('warning');
      expect(futureDateFinding.icon).toBe('⚠️');
      expect(futureDateFinding.suggestedFix).toContain('(En curso)');
    });
  });

  // =========================================================================
  // CA-05 (RF-02, RF-05): Clean Section Titles & Contact Deduplication
  // =========================================================================
  describe('CA-05 (RF-02, RF-05): Títulos de sección sin IDs y desduplicación de contacto', () => {
    it('sanitizes section titles so internal IDs (sec_...) are replaced with canonical titles', () => {
      const corruptSnapshot = {
        ...defaultSchema,
        sections: [
          {
            id: 'sec_172982847382',
            type: 'experience',
            title: 'sec_172982847382', // Corrupt internal ID as title
            items: []
          },
          {
            id: 'projects',
            type: 'projects',
            title: '', // Empty title
            items: []
          }
        ]
      };

      const sanitized = sanitizeAndValidateCVSnapshot(corruptSnapshot);
      const expSec = sanitized.sections.find(s => s.type === 'experience');
      const projSec = sanitized.sections.find(s => s.type === 'projects');

      expect(expSec.title).not.toMatch(/^sec_/);
      expect(expSec.title).toBe('Experiencia Laboral');
      expect(projSec.title).toBe('Proyectos');
    });

    it('deduplicates multiple contact sections and merges contacts into a single block', () => {
      const snapshotWithDuplicateContacts = {
        ...defaultSchema,
        sections: [
          {
            id: 'contact_1',
            type: 'contact',
            title: 'Contacto Principal',
            items: [
              {
                id: 'c_item_1',
                contacts: [{ id: '1', type: 'email', value: 'juan@test.com' }]
              }
            ]
          },
          {
            id: 'contact_2',
            type: 'contact',
            title: 'sec_987654321', // Duplicate contact section with internal ID
            items: [
              {
                id: 'c_item_2',
                contacts: [{ id: '2', type: 'linkedin', value: 'linkedin.com/in/juan' }]
              }
            ]
          }
        ]
      };

      const sanitized = sanitizeAndValidateCVSnapshot(snapshotWithDuplicateContacts);
      const contactSections = sanitized.sections.filter(s => s.type === 'contact');

      // Must be deduplicated to exactly 1 contact section
      expect(contactSections.length).toBe(1);

      // Must have merged contacts
      const mergedContacts = contactSections[0].items[0].contacts;
      expect(mergedContacts.some(c => c.value === 'juan@test.com')).toBe(true);
      expect(mergedContacts.some(c => c.value === 'linkedin.com/in/juan')).toBe(true);
    });
  });

  // =========================================================================
  // CA-06 (RF-28) & CA-07 (RF-29, RF-30, RF-32): Linter Quality Heuristics
  // =========================================================================
  describe('CA-06 & CA-07: Inconsistent URLs, Canonical Tech, and Action Verbs', () => {
    it('detects inconsistent URL formats across project links', () => {
      const cvWithMixedUrls = {
        ...defaultSchema,
        sections: [
          {
            id: 'projects',
            type: 'projects',
            title: 'Proyectos',
            items: [
              { id: 'p1', title: 'P1', link: 'https://github.com/juani981/app' },
              { id: 'p2', title: 'P2', link: 'github.com/juani981/demo' } // Missing https://
            ]
          }
        ]
      };

      const findings = lintCVContent(cvWithMixedUrls);
      const urlFinding = findings.find(f => f.ruleId === 'RF-28');

      expect(urlFinding).toBeDefined();
      expect(urlFinding.severity).toBe('warning');
      expect(urlFinding.message).toContain('mezcla de enlaces');
    });

    it('detects non-canonical technology casing (e.g. postgres -> PostgreSQL, plsql -> PL/SQL)', () => {
      const cvWithTechVariants = {
        ...defaultSchema,
        sections: [
          {
            id: 'skills',
            type: 'skills',
            title: 'Habilidades',
            items: [
              { id: 's1', title: 'Bases de datos', description: 'Experiencia avanzada con postgres y plsql.' }
            ]
          }
        ]
      };

      const findings = lintCVContent(cvWithTechVariants);
      const postgresFinding = findings.find(f => f.ruleId === 'RF-29' && f.canonical === 'PostgreSQL');
      const plsqlFinding = findings.find(f => f.ruleId === 'RF-29' && f.canonical === 'PL/SQL');

      expect(postgresFinding).toBeDefined();
      expect(postgresFinding.severity).toBe('info');
      expect(plsqlFinding).toBeDefined();
      expect(plsqlFinding.canonical).toBe('PL/SQL');
    });

    it('detects orphan skills not backed up by experience or projects', () => {
      const cvWithOrphanSkill = {
        ...defaultSchema,
        sections: [
          {
            id: 'skills',
            type: 'skills',
            title: 'Habilidades',
            items: [
              { id: 's1', title: 'Herramientas', description: 'Docker, Kubernetes, Rust' }
            ]
          },
          {
            id: 'experience',
            type: 'experience',
            title: 'Experiencia',
            items: [
              {
                id: 'e1',
                title: 'Frontend Developer',
                description: 'Desarrolló interfaces con React y Docker.',
                bullets: ['Automatizó despliegues usando contenedores Docker.']
              }
            ]
          }
        ]
      };

      const findings = lintCVContent(cvWithOrphanSkill);
      // Rust is never mentioned in experience
      const rustOrphan = findings.find(f => f.ruleId === 'RF-30' && f.skill.toLowerCase() === 'rust');

      expect(rustOrphan).toBeDefined();
      expect(rustOrphan.severity).toBe('info');
      expect(rustOrphan.message).toContain('no se menciona en ningún logro');
    });

    it('detects bullets lacking strong action verbs and Google XYZ metrics', () => {
      const cvWithWeakBullets = {
        ...defaultSchema,
        sections: [
          {
            id: 'experience',
            type: 'experience',
            title: 'Experiencia',
            items: [
              {
                id: 'e1',
                title: 'Backend Developer',
                bullets: [
                  'Estuve trabajando en la base de datos y haciendo tareas de mantenimiento general de servidores.',
                  'Optimizó tiempos de respuesta en un 40% reduciendo latencia a 120ms.' // Strong action + metric
                ]
              }
            ]
          }
        ]
      };

      const findings = lintCVContent(cvWithWeakBullets);
      const weakVerbFinding = findings.find(f => f.ruleId === 'RF-32' && f.title.includes('sin verbo de acción'));
      const missingMetricFinding = findings.find(f => f.ruleId === 'RF-32' && f.title.includes('cuantificación'));

      expect(weakVerbFinding).toBeDefined();
      expect(missingMetricFinding).toBeDefined();
    });
  });

  // =========================================================================
  // CA-08 (RQ-048): Golden-File Regression Parity
  // =========================================================================
  describe('CA-08 (RQ-048): Golden-file regression parity for 1-column ATS and 2-column layouts', () => {
    it('produces idempotent, deterministic plain-text extraction for 1-column ATS mode', () => {
      const atsCV = {
        ...defaultSchema,
        layout: {
          ...defaultSchema.layout,
          type: '1-column',
          isAtsMode: true
        }
      };

      const html1 = generateCleanPrintHTML(atsCV, 'es');
      const text1 = extractTextLayer(html1);

      const html2 = generateCleanPrintHTML(atsCV, 'es');
      const text2 = extractTextLayer(html2);

      expect(text1).toBe(text2);
      expect(text1.length).toBeGreaterThan(100);
      expect(text1).not.toContain('undefined');
      expect(text1).not.toContain('null');
    });

    it('produces idempotent, deterministic plain-text extraction for 2-column visual mode', () => {
      const twoColCV = {
        ...defaultSchema,
        layout: {
          ...defaultSchema.layout,
          type: '2-column',
          isAtsMode: false
        }
      };

      const html1 = generateCleanPrintHTML(twoColCV, 'es');
      const text1 = extractTextLayer(html1);

      const html2 = generateCleanPrintHTML(twoColCV, 'es');
      const text2 = extractTextLayer(html2);

      expect(text1).toBe(text2);
      expect(text1.length).toBeGreaterThan(100);
      expect(text1).not.toContain('undefined');
      expect(text1).not.toContain('null');
    });
  });
});
