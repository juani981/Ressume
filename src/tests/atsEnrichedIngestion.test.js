/**
 * src/tests/atsEnrichedIngestion.test.js
 *
 * Validates the Anti-Corruption Layer / Ingestion Adapter for Enriched ATS JSON.
 * Proves that:
 * 1. Semantic `ats` metadata objects on items are folded into canonical flat strings (title, subtitle, date, bullets, description).
 * 2. Nested objects ({ city, country }, { start, isCurrent }) are deterministically formatted.
 * 3. Arrays of skills/technologies are joined into clean comma-separated strings.
 * 4. The resulting document is 100% flat SSOT without leftover `ats` metadata keys.
 * 5. Works identically whether wrapped in native sections or top-level dictionary formats.
 */

import { describe, it, expect } from 'vitest';
import { normalizeAnyJSONToCVSnapshot } from '../utils/universalJsonImporter.js';

describe('Enriched ATS Ingestion Adapter Suite (Anti-Corruption Layer)', () => {
  it('folds enriched work experience with ats metadata into canonical flat item structure', () => {
    const enrichedInput = {
      profile: {
        name: 'Ada Lovelace',
        subtitle: 'First Computer Programmer'
      },
      sections: [
        {
          id: 'profile_header',
          type: 'profile_header',
          items: [{ id: 'ph1', name: 'Ada Lovelace', subtitle: 'First Computer Programmer' }]
        },
        {
          id: 'experience',
          type: 'list',
          title: 'EXPERIENCIA LABORAL',
          items: [
            {
              id: 'exp1',
              ats: {
                role: 'Desarrollador Web Full-Stack',
                company: 'Dirección General de Catastro',
                location: { city: 'San Miguel de Tucumán', country: 'Argentina' },
                period: { start: '2025', isCurrent: true },
                technologies: ['PHP', 'Laravel', 'JS'],
                actionBullets: [
                  { text: 'Lidero la modernización y refactorización de sistemas legacy.', actionVerb: 'Liderar' },
                  { text: 'Optimizo el rendimiento de bases de datos relacionales.', actionVerb: 'Optimizar' }
                ]
              }
            }
          ]
        }
      ]
    };

    const normalized = normalizeAnyJSONToCVSnapshot(enrichedInput);
    const expSec = normalized.sections.find(s => s.id === 'experience');
    expect(expSec).toBeDefined();

    const item = expSec.items[0];
    expect(item.id).toBe('exp1');
    expect(item.title).toBe('Desarrollador Web Full-Stack (PHP, Laravel, JS)');
    expect(item.subtitle).toBe('Dirección General de Catastro | San Miguel de Tucumán, Argentina');
    expect(item.date).toBe('2025 – Actualidad');
    expect(item.bullets).toEqual([
      'Lidero la modernización y refactorización de sistemas legacy.',
      'Optimizo el rendimiento de bases de datos relacionales.'
    ]);
    // Verifies that the internal item has NO leftover 'ats' key to preserve strict SSOT
    expect(item.ats).toBeUndefined();
  });

  it('folds enriched education with period and degree metadata', () => {
    const enrichedEdu = {
      candidate_profile: { full_name: 'Alan Turing' },
      education: [
        {
          ats: {
            degree: 'Ingeniería en Informática',
            institution: 'Universidad Nacional de Tucumán (UNT)',
            location: 'Tucumán, Argentina',
            period: { start: '2023', isCurrent: true }
          }
        }
      ]
    };

    const normalized = normalizeAnyJSONToCVSnapshot(enrichedEdu);
    const eduSec = normalized.sections.find(s => s.type === 'education');
    expect(eduSec).toBeDefined();

    const item = eduSec.items[0];
    expect(item.title).toBe('Ingeniería en Informática');
    expect(item.subtitle).toBe('Universidad Nacional de Tucumán (UNT) | Tucumán, Argentina');
    expect(item.date).toBe('2023 – Actualidad');
  });

  it('folds enriched skills array into comma-separated description string', () => {
    const enrichedSkills = {
      profile: { name: 'Grace Hopper' },
      sections: [
        {
          id: 'profile_header',
          type: 'profile_header',
          items: [{ id: 'p1', name: 'Grace Hopper' }]
        },
        {
          id: 'skills',
          type: 'skills',
          title: 'HABILIDADES TÉCNICAS',
          items: [
            {
              id: 'sk1',
              ats: {
                category: 'Backend & Lenguajes',
                skills: ['PHP', 'Laravel', 'C#', '.NET Core', 'Python', 'FastAPI']
              }
            }
          ]
        }
      ]
    };

    const normalized = normalizeAnyJSONToCVSnapshot(enrichedSkills);
    const skillsSec = normalized.sections.find(s => s.id === 'skills');
    expect(skillsSec).toBeDefined();

    const item = skillsSec.items[0];
    expect(item.title).toBe('Backend & Lenguajes');
    expect(item.description).toBe('PHP, Laravel, C#, .NET Core, Python, FastAPI');
    expect(item.ats).toBeUndefined();
  });

  it('folds enriched languages and certifications with structured metadata', () => {
    const enrichedLists = {
      profile: { name: 'Margaret Hamilton' },
      sections: [
        {
          id: 'profile_header',
          type: 'profile_header',
          items: [{ id: 'p1', name: 'Margaret Hamilton' }]
        },
        {
          id: 'languages',
          type: 'simple_list',
          items: [
            {
              ats: {
                language: 'Inglés',
                proficiency: 'Avanzado (C2 – Certificación EF SET)'
              }
            }
          ]
        },
        {
          id: 'certificates',
          type: 'simple_list',
          items: [
            {
              ats: {
                name: 'Fundamentos de IA con IBM Watson Studio',
                issuer: 'Cisco Networking Academy',
                year: '2025'
              }
            }
          ]
        }
      ]
    };

    const normalized = normalizeAnyJSONToCVSnapshot(enrichedLists);
    const langSec = normalized.sections.find(s => s.id === 'languages');
    expect(langSec.items[0].text).toBe('Inglés: Avanzado (C2 – Certificación EF SET)');

    const certSec = normalized.sections.find(s => s.id === 'certificates');
    expect(certSec.items[0].text).toBe('Fundamentos de IA con IBM Watson Studio — Cisco Networking Academy (2025)');
  });
});
