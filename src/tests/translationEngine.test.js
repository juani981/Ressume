import { describe, it, expect } from 'vitest';
import {
  SUPPORTED_LANGUAGES,
  extractDictionaryFromCV,
  buildTranslationPrompt,
  sanitizeAndParseAIResponse,
  cleanAndParseAIResponse,
  validateKeyCoverage,
  applyDictionaryToCVState
} from '../utils/translationEngine.js';

describe('Translation Engine Suite', () => {
  describe('SUPPORTED_LANGUAGES', () => {
    it('defines supported global languages with code, name, and flag', () => {
      expect(Array.isArray(SUPPORTED_LANGUAGES)).toBe(true);
      expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(8);
      const en = SUPPORTED_LANGUAGES.find(l => l.code === 'en');
      const es = SUPPORTED_LANGUAGES.find(l => l.code === 'es');
      expect(en).toBeDefined();
      expect(en.name).toContain('English');
      expect(es).toBeDefined();
      expect(es.name).toContain('Español');
    });
  });

  describe('extractDictionaryFromCV', () => {
    it('returns empty dictionary for null, undefined, or non-object inputs', () => {
      expect(extractDictionaryFromCV(null)).toEqual({});
      expect(extractDictionaryFromCV(undefined)).toEqual({});
      expect(extractDictionaryFromCV('invalid')).toEqual({});
      expect(extractDictionaryFromCV(123)).toEqual({});
      expect(extractDictionaryFromCV({})).toHaveProperty('section_social', 'Contacto');
    });

    it('extracts profile header and about data correctly', () => {
      const mockCV = {
        profile: { name: 'Fallback Name' },
        sections: [
          {
            type: 'profile_header',
            items: [{ name: 'Juan Perez', subtitle: 'Software Engineer', location: 'Tucuman, AR' }]
          },
          {
            type: 'about',
            title: 'Sobre Mi',
            items: [{ description: 'Experienced full stack developer.' }]
          }
        ]
      };

      const dict = extractDictionaryFromCV(mockCV);
      expect(dict['profile_title']).toBe('Juan Perez');
      expect(dict['profile_subtitle']).toBe('Software Engineer');
      expect(dict['profile_location']).toBe('Tucuman, AR');
      expect(dict['section_profile']).toBe('Sobre Mi');
      expect(dict['profile_desc']).toBe('Experienced full stack developer.');
    });

    it('falls back to cvData.profile.name if profile_header items are absent', () => {
      const mockCV = {
        profile: { name: 'Juan Fallback' },
        sections: [{ type: 'profile_header', items: [] }]
      };
      const dict = extractDictionaryFromCV(mockCV);
      expect(dict['profile_title']).toBe('Juan Fallback');
    });

    it('extracts experience with bullet points and subtitle/date formatting', () => {
      const mockCV = {
        sections: [
          {
            id: 'experience',
            title: 'Work Experience',
            items: [
              {
                title: 'Senior Developer',
                subtitle: 'Tech Corp',
                date: '2021 - Present',
                bullets: ['Built scalable systems', 'Mentored juniors'],
                link: 'https://techcorp.com'
              },
              {
                title: 'Junior Developer',
                date: '2019 - 2021',
                description: 'Maintenance and bug fixes.'
              }
            ]
          }
        ]
      };

      const dict = extractDictionaryFromCV(mockCV);
      expect(dict['section_experience']).toBe('Work Experience');
      expect(dict['exp1_title']).toBe('Senior Developer');
      expect(dict['exp1_company']).toBe('Tech Corp | 2021 - Present');
      expect(dict['exp1_link']).toBe('https://techcorp.com');
      expect(dict['exp1_desc']).toBe('Built scalable systems\nMentored juniors');

      expect(dict['exp2_title']).toBe('Junior Developer');
      expect(dict['exp2_company']).toBe('2019 - 2021');
      expect(dict['exp2_desc']).toBe('Maintenance and bug fixes.');
    });

    it('extracts projects, skills, education, certificates, and languages', () => {
      const mockCV = {
        sections: [
          {
            id: 'projects',
            title: 'Side Projects',
            items: [
              { title: 'Project A', subtitle: 'Open Source', date: '2023', description: 'Web app' }
            ]
          },
          {
            type: 'skills',
            title: 'Technical Skills',
            items: [
              { title: 'Languages', description: 'JavaScript, TypeScript' }
            ]
          },
          {
            type: 'education',
            title: 'Academic Degrees',
            items: [
              { title: 'University', subtitle: 'Computer Science', date: '2015 - 2020' }
            ]
          },
          {
            id: 'certificates',
            title: 'Certifications',
            items: [
              { text: 'AWS Solutions Architect' }
            ]
          },
          {
            id: 'languages',
            title: 'Spoken Languages',
            items: [
              { text: 'Spanish (Native)' }
            ]
          }
        ]
      };

      const dict = extractDictionaryFromCV(mockCV);
      expect(dict['section_projects']).toBe('Side Projects');
      expect(dict['proj1_title']).toBe('Project A');
      expect(dict['proj1_company']).toBe('Open Source | 2023');
      expect(dict['proj1_desc']).toBe('Web app');

      expect(dict['section_skills']).toBe('Technical Skills');
      expect(dict['skill1_category']).toBe('Languages');
      expect(dict['skill1_content']).toBe('JavaScript, TypeScript');

      expect(dict['section_education']).toBe('Academic Degrees');
      expect(dict['edu1_title']).toBe('University');
      expect(dict['edu1_study']).toBe('Computer Science');
      expect(dict['edu1_year']).toBe('2015 - 2020');

      expect(dict['section_certificates']).toBe('Certifications');
      expect(dict['cert1_title']).toBe('AWS Solutions Architect');

      expect(dict['section_languages']).toBe('Spoken Languages');
      expect(dict['lang1']).toBe('Spanish (Native)');
    });

    it('guards safely against corrupted section items or null values', () => {
      const mockCV = {
        sections: [
          { id: 'experience', items: null },
          { id: 'projects', items: [null, {}] },
          { type: 'skills', items: 'invalid-string' },
          null
        ]
      };

      expect(() => extractDictionaryFromCV(mockCV)).not.toThrow();
      const dict = extractDictionaryFromCV(mockCV);
      expect(dict['section_experience']).toBe('Experiencia Laboral');
      expect(dict['section_projects']).toBe('Proyectos Destacados');
    });
  });

  describe('buildTranslationPrompt', () => {
    it('constructs a prompt containing system instructions, localization directives, and JSON payload', () => {
      const sourceDict = {
        profile_title: 'Juan Perez',
        profile_subtitle: 'Programador Universitario'
      };

      const prompt = buildTranslationPrompt(sourceDict, 'en', 'es', 'Focus on FinTech');
      expect(prompt).toContain('[SYSTEM INSTRUCTION: ELITE TECHNICAL RESUME TRANSLATOR & LOCALIZER]');
      expect(prompt).toContain('English (US/Global) (en)');
      expect(prompt).toContain('Español (LatAm / España) (es)');
      expect(prompt).toContain('Focus on FinTech');
      expect(prompt).toContain('"profile_title": "Juan Perez"');
      expect(prompt).toContain('"profile_subtitle": "Programador Universitario"');
    });

    it('handles undefined custom guidelines and missing dictionary gracefully', () => {
      const prompt = buildTranslationPrompt(null, 'de', 'en');
      expect(prompt).toContain('Deutsch (Germany / DACH) (de)');
      expect(prompt).toContain('English (US/Global) (en)');
      expect(prompt).not.toContain('ADDITIONAL USER GUIDELINES');
    });
  });

  describe('sanitizeAndParseAIResponse & cleanAndParseAIResponse', () => {
    it('exports cleanAndParseAIResponse as alias to sanitizeAndParseAIResponse', () => {
      expect(cleanAndParseAIResponse).toBe(sanitizeAndParseAIResponse);
    });

    it('returns error for empty or non-string inputs', () => {
      expect(sanitizeAndParseAIResponse('').success).toBe(false);
      expect(sanitizeAndParseAIResponse(null).success).toBe(false);
      expect(sanitizeAndParseAIResponse(undefined).success).toBe(false);
      expect(sanitizeAndParseAIResponse(123).success).toBe(false);
    });

    it('parses pristine JSON response with expected language key', () => {
      const raw = JSON.stringify({
        en: {
          profile_title: 'John Doe',
          profile_subtitle: 'Lead Software Engineer'
        }
      });

      const res = sanitizeAndParseAIResponse(raw, 'en');
      expect(res.success).toBe(true);
      expect(res.languageCode).toBe('en');
      expect(res.dictionary.profile_title).toBe('John Doe');
      expect(res.dictionary.profile_subtitle).toBe('Lead Software Engineer');
    });

    it('strips markdown code blocks (```json ... ```)', () => {
      const raw = "```json\n" + JSON.stringify({
        en: { profile_title: 'John Doe' }
      }) + "\n```";

      const res = sanitizeAndParseAIResponse(raw, 'en');
      expect(res.success).toBe(true);
      expect(res.dictionary.profile_title).toBe('John Doe');
    });

    it('strips preamble text and postamble commentary', () => {
      const raw = `Here is your localized CV:\n\n{\n  "en": {\n    "profile_title": "Jane Doe"\n  }\n}\n\nHope this helps!`;
      const res = sanitizeAndParseAIResponse(raw, 'en');
      expect(res.success).toBe(true);
      expect(res.dictionary.profile_title).toBe('Jane Doe');
    });

    it('auto-repairs trailing commas before closing braces', () => {
      const raw = `{
        "en": {
          "profile_title": "Jane Doe",
          "profile_subtitle": "Architect",
        }
      }`;
      const res = sanitizeAndParseAIResponse(raw, 'en');
      expect(res.success).toBe(true);
      expect(res.dictionary.profile_subtitle).toBe('Architect');
    });

    it('falls back to flat dictionary if no language nesting is provided', () => {
      const raw = `{ "profile_title": "Direct Dict", "profile_subtitle": "Direct Subtitle" }`;
      const res = sanitizeAndParseAIResponse(raw, 'en');
      expect(res.success).toBe(true);
      expect(res.dictionary.profile_title).toBe('Direct Dict');
    });

    it('rejects invalid or empty dictionaries and corrupt syntax', () => {
      expect(sanitizeAndParseAIResponse('{}').success).toBe(false);
      expect(sanitizeAndParseAIResponse('{ "en": {} }').success).toBe(false);
      expect(sanitizeAndParseAIResponse('not-json').success).toBe(false);
      expect(sanitizeAndParseAIResponse('[1, 2, 3]').success).toBe(false);
    });
  });

  describe('validateKeyCoverage', () => {
    it('calculates 100% match when all keys match', () => {
      const source = { k1: 'val1', k2: 'val2' };
      const target = { k1: 'val1_trans', k2: 'val2_trans' };

      const res = validateKeyCoverage(source, target);
      expect(res.totalSource).toBe(2);
      expect(res.matchedCount).toBe(2);
      expect(res.missingCount).toBe(0);
      expect(res.extraCount).toBe(0);
      expect(res.matchPercentage).toBe(100);
      expect(res.missingKeys).toHaveLength(0);
    });

    it('identifies missing keys and empty values in target', () => {
      const source = { k1: 'val1', k2: 'val2', k3: 'val3' };
      const target = { k1: 'val1_trans', k2: '', k4: 'extra' };

      const res = validateKeyCoverage(source, target);
      expect(res.totalSource).toBe(3);
      expect(res.matchedCount).toBe(1);
      expect(res.missingCount).toBe(2);
      expect(res.missingKeys).toEqual(['k2', 'k3']);
      expect(res.extraKeys).toEqual(['k4']);
      expect(res.matchPercentage).toBe(33);
    });

    it('handles null, undefined, or empty dictionaries gracefully', () => {
      expect(validateKeyCoverage(null, null).matchPercentage).toBe(100);
      expect(validateKeyCoverage({}, {}).matchPercentage).toBe(100);
      expect(validateKeyCoverage({ a: 1 }, null).missingCount).toBe(1);
    });
  });

  describe('applyDictionaryToCVState', () => {
    it('returns original cvData unmodified if input or dictionary is invalid', () => {
      const cv = { profile: { name: 'Juan' } };
      expect(applyDictionaryToCVState(null, {})).toBe(null);
      expect(applyDictionaryToCVState(cv, null)).toBe(cv);
      expect(applyDictionaryToCVState(cv, 'invalid')).toBe(cv);
    });

    it('performs a non-destructive deep clone without mutating original state', () => {
      const original = {
        profile: { name: 'Original Name' },
        sections: [
          {
            type: 'profile_header',
            items: [{ name: 'Original Name', subtitle: 'Orig Sub' }]
          }
        ]
      };

      const dict = { profile_title: 'New Name' };
      const updated = applyDictionaryToCVState(original, dict);

      expect(updated).not.toBe(original);
      expect(original.profile.name).toBe('Original Name');
      expect(original.sections[0].items[0].name).toBe('Original Name');
      expect(updated.profile.name).toBe('New Name');
      expect(updated.sections[0].items[0].name).toBe('New Name');
    });

    it('maps experience section with subtitle/date splitting and bullet point parsing', () => {
      const cv = {
        sections: [
          {
            id: 'experience',
            title: 'Experiencia',
            items: [
              {
                title: 'Old Title',
                subtitle: 'Old Company',
                date: '2020',
                bullets: ['Old bullet']
              }
            ]
          }
        ]
      };

      const dict = {
        section_experience: 'Professional Experience',
        exp1_title: 'Staff Engineer',
        exp1_company: 'Acme Corp | 2021 - Present',
        exp1_desc: 'Lead architect\nManaged team'
      };

      const updated = applyDictionaryToCVState(cv, dict);
      const expSec = updated.sections[0];
      expect(expSec.title).toBe('Professional Experience');
      expect(expSec.items[0].title).toBe('Staff Engineer');
      expect(expSec.items[0].subtitle).toBe('Acme Corp');
      expect(expSec.items[0].date).toBe('2021 - Present');
      expect(expSec.items[0].bullets).toEqual(['Lead architect', 'Managed team']);
    });

    it('maps projects, skills, education, certificates, and languages accurately', () => {
      const cv = {
        sections: [
          {
            id: 'projects',
            title: 'Proyectos',
            items: [{ title: 'P1', subtitle: 'Sub', description: 'Desc' }]
          },
          {
            type: 'skills',
            title: 'Habilidades',
            items: [{ title: 'Frontend', description: 'React' }]
          },
          {
            type: 'education',
            title: 'Educacion',
            items: [{ title: 'Univ', subtitle: 'Deg', date: '2019' }]
          },
          {
            id: 'certificates',
            title: 'Certificados',
            items: [{ text: 'Cert1' }]
          },
          {
            id: 'languages',
            title: 'Idiomas',
            items: [{ text: 'Espanol' }]
          }
        ]
      };

      const dict = {
        section_projects: 'Featured Projects',
        proj1_title: 'Enterprise Portal',
        proj1_company: 'Freelance | 2024',
        proj1_desc: 'High-throughput system',
        section_skills: 'Core Competencies',
        skill1_category: 'Frontend Engineering',
        skill1_content: 'React, Next.js, Redux',
        section_education: 'Education',
        edu1_title: 'MIT',
        edu1_study: 'B.S. in Computer Science',
        edu1_year: '2016 - 2020',
        section_certificates: 'Licenses & Certifications',
        cert1_title: 'Kubernetes Administrator (CKA)',
        section_languages: 'Languages',
        lang1: 'English (Fluent)'
      };

      const updated = applyDictionaryToCVState(cv, dict);
      expect(updated.sections[0].title).toBe('Featured Projects');
      expect(updated.sections[0].items[0].title).toBe('Enterprise Portal');

      expect(updated.sections[1].title).toBe('Core Competencies');
      expect(updated.sections[1].items[0].title).toBe('Frontend Engineering');
      expect(updated.sections[1].items[0].description).toBe('React, Next.js, Redux');

      expect(updated.sections[2].title).toBe('Education');
      expect(updated.sections[2].items[0].title).toBe('MIT');
      expect(updated.sections[2].items[0].subtitle).toBe('B.S. in Computer Science');
      expect(updated.sections[2].items[0].date).toBe('2016 - 2020');

      expect(updated.sections[3].title).toBe('Licenses & Certifications');
      expect(updated.sections[3].items[0].text).toBe('Kubernetes Administrator (CKA)');

      expect(updated.sections[4].title).toBe('Languages');
      expect(updated.sections[4].items[0].text).toBe('English (Fluent)');
    });
  });
});
