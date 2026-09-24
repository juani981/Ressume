import { describe, it, expect } from 'vitest';
import { sanitizeATSText, sanitizeContactUrl, exportToATSPlainText } from '../utils/aiExporter.js';
import atsKnowledgeRules from '../ai-knowledge/ats.json' with { type: 'json' };
import esRules from '../locales/es/rules.json' with { type: 'json' };
import enRules from '../locales/en/rules.json' with { type: 'json' };
import { defaultSchema } from '../utils/schema.js';

describe('Real ATS Parser Format & Syntax Sanitization Suite', () => {
  it('ATS-PARSER-1: strips dollar signs enclosing tech terms ($N+1$, $CI/CD$) to prevent salary/regex confusion', () => {
    const raw = 'Optimizó consultas reduciendo problemas de $N+1$ en Laravel y automatizó pipelines de $CI/CD$ con Docker.';
    const sanitized = sanitizeATSText(raw);
    expect(sanitized).toBe('Optimizó consultas reduciendo problemas de N+1 en Laravel y automatizó pipelines de CI/CD con Docker.');
    expect(sanitized).not.toContain('$');
  });

  it('ATS-PARSER-2: strips non-standard Unicode checkboxes (☑, ☐, ✓, ✔, 🗹) to prevent OCR text dropping', () => {
    const raw = '☑ Lideró modernización de sistemas legacy ✓ Implementó pruebas unitarias';
    const sanitized = sanitizeATSText(raw);
    expect(sanitized).toBe('Lideró modernización de sistemas legacy Implementó pruebas unitarias');
    expect(sanitized).not.toContain('☑');
    expect(sanitized).not.toContain('✓');
  });

  it('ATS-PARSER-3: sanitizes URLs by stripping spaces and enforcing https protocol', () => {
    const rawWithSpaces = '  https://deploy-preview-4 --ressume.netlify.app/demo  ';
    const cleanUrl = sanitizeContactUrl(rawWithSpaces);
    expect(cleanUrl).toBe('https://deploy-preview-4--ressume.netlify.app/demo');
    expect(cleanUrl).not.toContain(' ');

    const plainDomainWithSpace = ' github.com /juani981/project ';
    expect(sanitizeContactUrl(plainDomainWithSpace)).toBe('https://github.com/juani981/project');
  });

  it('ATS-PARSER-4: exportToATSPlainText sanitizes dollar syntax, checkboxes, and link whitespace in full CV output', () => {
    const cvDataWithIssues = {
      ...defaultSchema,
      sections: [
        ...defaultSchema.sections.map(s => {
          if (s.id === 'experience') {
            return {
              ...s,
              items: [
                {
                  id: 'exp1',
                  title: 'Full-Stack Developer',
                  subtitle: 'Catastro',
                  date: '2025 – Present',
                  link: ' https://deploy-preview-4 --app.netlify.app ',
                  bullets: [
                    '☑ Resolvió cuellos de botella $N+1$ en bases de datos relacionales.',
                    '✓ Configuración de despliegue continuo con pipelines $CI/CD$.'
                  ]
                }
              ]
            };
          }
          return s;
        })
      ]
    };

    const plainText = exportToATSPlainText(cvDataWithIssues);
    expect(plainText).not.toContain('$N+1$');
    expect(plainText).toContain('N+1');
    expect(plainText).not.toContain('$CI/CD$');
    expect(plainText).toContain('CI/CD');
    expect(plainText).not.toContain('☑');
    expect(plainText).not.toContain('✓');
    expect(plainText).toContain('Enlace: https://deploy-preview-4--app.netlify.app');
  });

  it('ATS-PARSER-5: verifies knowledge base contains the 4 empirical ATS format rules', () => {
    const expectedRuleIds = [
      'ats_crit_dollar_syntax',
      'ats_crit_url_integrity',
      'ats_warn_glyph_overload',
      'ats_info_technology_casing'
    ];

    expectedRuleIds.forEach(id => {
      const inAtsKnowledge = atsKnowledgeRules.some(r => r.id === id);
      expect(inAtsKnowledge).toBe(true);
    });

    // Check Spanish locale rules
    expect(esRules.some(r => r.id === 'ats_crit_es_dollar_syntax')).toBe(true);
    expect(esRules.some(r => r.id === 'ats_crit_es_url_integrity')).toBe(true);
    expect(esRules.some(r => r.id === 'ats_warn_es_glyph_overload')).toBe(true);
    expect(esRules.some(r => r.id === 'ats_info_es_technology_casing')).toBe(true);

    // Check English locale rules
    expect(enRules.some(r => r.id === 'ats_crit_en_dollar_syntax')).toBe(true);
    expect(enRules.some(r => r.id === 'ats_crit_en_url_integrity')).toBe(true);
    expect(enRules.some(r => r.id === 'ats_warn_en_glyph_overload')).toBe(true);
    expect(enRules.some(r => r.id === 'ats_info_en_technology_casing')).toBe(true);
  });
});
