import { describe, expect, it, vi } from 'vitest';
import { getRandomSeedCV, seedCVTemplateNames } from '../utils/seedCVTemplates';
import { defaultSchema } from '../utils/schema';
import { loadInitialCVData } from '../context/hooks/useCVData';
import { sanitizeAndValidateCVSnapshot } from '../utils/versionValidator';

describe('seed CV templates', () => {
  it('provides six distinct, complete sample profiles with mock contact details (location, email, phone, linkedin, github)', () => {
    expect(seedCVTemplateNames).toHaveLength(6);
    expect(new Set(seedCVTemplateNames).size).toBe(6);

    for (let index = 0; index < seedCVTemplateNames.length; index += 1) {
      const cv = getRandomSeedCV(() => index / seedCVTemplateNames.length);
      expect(cv.profile.name).toBe(seedCVTemplateNames[index]);
      expect(cv.sections.map(({ id }) => id)).toEqual([
        'profile_header',
        'contact',
        'about_section',
        'skills',
        'experience',
        'projects',
        'education',
      ]);
      expect(cv.sections.map(({ title }) => title)).toEqual([
        '',
        '',
        'PERFIL PROFESIONAL',
        'HABILIDADES TÉCNICAS',
        'EXPERIENCIA LABORAL',
        'PROYECTOS DESTACADOS',
        'EDUCACIÓN',
      ]);
      const contactItem = cv.sections.find(({ id }) => id === 'contact').items[0];
      expect(contactItem.location).toBe('Ciudad, País');
      expect(contactItem.email).toBe('tuemail@ejemplo.com');
      expect(contactItem.phone).toBe('+00 123 456 789');
      expect(contactItem.linkedin).toBe('linkedin.com/in/tu-perfil');
      expect(contactItem.github).toBe('github.com/tu-usuario');
      expect(contactItem.contacts.map((c) => c.type)).toEqual([
        'location',
        'email',
        'phone',
        'linkedin',
        'github',
      ]);
      expect(cv.sections.find(({ id }) => id === 'about_section').items[0].description).toBeTruthy();
      expect(cv.sections.find(({ id }) => id === 'experience').items.length).toBeGreaterThan(0);
      expect(sanitizeAndValidateCVSnapshot(cv)?.profile.name).toBe(seedCVTemplateNames[index]);
    }
  });

  it('returns independent copies of a selected sample', () => {
    const first = getRandomSeedCV(() => 0);
    first.sections[0].items[0].name = 'Changed';

    const second = getRandomSeedCV(() => 0);
    expect(second.sections[0].items[0].name).toBe('Ada Lovelace');
  });

  it('uses a random sample only for a new browser profile and preserves saved CV data', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VITEST', '');
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(5 / 6);
    const savedCV = { ...defaultSchema, profile: { name: 'Saved profile' } };

    localStorage.clear();
    try {
      const firstLoad = loadInitialCVData();
      expect(firstLoad.profile.name).toBe('Richard Stallman');

      localStorage.setItem('cvData', JSON.stringify(savedCV));
      expect(loadInitialCVData().profile.name).toBe('Saved profile');
      expect(randomSpy).toHaveBeenCalledTimes(1);
    } finally {
      randomSpy.mockRestore();
      vi.unstubAllEnvs();
      localStorage.clear();
    }
  });
});
