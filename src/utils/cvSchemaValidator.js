/**
 * src/utils/cvSchemaValidator.js
 *
 * Declarative Schema Definitions & Validation Engine for Ressume CV data models.
 * 
 * Provides:
 * 1. Declarative constants & constraints (Layout, Profile, Section, Item).
 * 2. Pure diagnostic validator `validateCVSnapshot(candidate)` returning detailed errors & warnings.
 * 3. Sanitizing normalizer `sanitizeAndValidateCVSnapshot(snapshot)` guaranteeing robust runtime recovery.
 */

import { defaultSchema } from './schema.js';
import { normalizeAnyJSONToCVSnapshot } from './universalJsonImporter.js';
import { normalizeItemContacts, syncFlatContactFields } from './contactTypes.js';
import { SPACING_LIMITS, DEFAULT_LINE_HEIGHT } from '../constants/spacing.js';
import { TYPOGRAPHY_SCALE_LIMITS, SUPPORTED_FONT_NAMES } from '../constants/typography.js';

export const ALLOWED_LAYOUT_TYPES = Object.freeze(['1-column', '2-column']);
export const ALLOWED_COLUMNS = Object.freeze(['left', 'right']);
export const ALLOWED_FONT_FAMILIES = SUPPORTED_FONT_NAMES;

export const NUMERIC_BOUNDS = Object.freeze({
  pagePadding: { min: SPACING_LIMITS.pagePadding.min, max: SPACING_LIMITS.pagePadding.max, default: SPACING_LIMITS.pagePadding.default },
  sectionGap: { min: SPACING_LIMITS.sectionGap.min, max: SPACING_LIMITS.sectionGap.max, default: SPACING_LIMITS.sectionGap.default },
  itemGap: { min: SPACING_LIMITS.itemGap.min, max: SPACING_LIMITS.itemGap.max, default: SPACING_LIMITS.itemGap.default },
  fontScale: { min: TYPOGRAPHY_SCALE_LIMITS.fontScale.min, max: TYPOGRAPHY_SCALE_LIMITS.fontScale.max, default: TYPOGRAPHY_SCALE_LIMITS.fontScale.default },
  titleScale: { min: TYPOGRAPHY_SCALE_LIMITS.titleScale.min, max: TYPOGRAPHY_SCALE_LIMITS.titleScale.max, default: TYPOGRAPHY_SCALE_LIMITS.titleScale.default },
  bodyScale: { min: TYPOGRAPHY_SCALE_LIMITS.bodyScale.min, max: TYPOGRAPHY_SCALE_LIMITS.bodyScale.max, default: TYPOGRAPHY_SCALE_LIMITS.bodyScale.default },
  listScale: { min: TYPOGRAPHY_SCALE_LIMITS.listScale.min, max: TYPOGRAPHY_SCALE_LIMITS.listScale.max, default: TYPOGRAPHY_SCALE_LIMITS.listScale.default },
  lineHeight: { min: TYPOGRAPHY_SCALE_LIMITS.lineHeight.min, max: TYPOGRAPHY_SCALE_LIMITS.lineHeight.max, default: DEFAULT_LINE_HEIGHT }
});

export const CANONICAL_SECTION_TITLES = Object.freeze({
  es: {
    profile_header: 'Cabecera de Perfil',
    title_subtitle: 'Nombre y Perfil',
    about: 'Perfil Profesional',
    contact: 'Información de Contacto',
    skills: 'Habilidades Técnicas',
    experience: 'Experiencia Laboral',
    projects: 'Proyectos Destacados',
    education: 'Educación',
    certificates: 'Certificaciones',
    languages: 'Idiomas',
    awards: 'Premios y Logros',
    publications: 'Publicaciones',
    references: 'Referencias',
    mentoring: 'Mentoría',
    volunteering: 'Voluntariado',
    simple_list: 'Información Adicional'
  },
  en: {
    profile_header: 'Profile Header',
    title_subtitle: 'Name & Profile',
    about: 'Professional Summary',
    contact: 'Contact Information',
    skills: 'Technical Skills',
    experience: 'Work Experience',
    projects: 'Featured Projects',
    education: 'Education',
    certificates: 'Certifications',
    languages: 'Languages',
    awards: 'Awards & Honors',
    publications: 'Publications',
    references: 'References',
    mentoring: 'Mentoring',
    volunteering: 'Volunteering',
    simple_list: 'Additional Information'
  }
});

export const DEFAULT_CONTACT_PLACEHOLDERS = Object.freeze({
  es: [
    { id: 'c_loc', type: 'location', value: 'Ciudad, País' },
    { id: 'c_email', type: 'email', value: 'tuemail@ejemplo.com' },
    { id: 'c_phone', type: 'phone', value: '+00 123 456 789' },
    { id: 'c_linkedin', type: 'linkedin', value: 'linkedin.com/in/tu-perfil' },
    { id: 'c_github', type: 'github', value: 'github.com/tu-usuario' }
  ],
  en: [
    { id: 'c_loc', type: 'location', value: 'City, Country' },
    { id: 'c_email', type: 'email', value: 'youremail@example.com' },
    { id: 'c_phone', type: 'phone', value: '+00 123 456 789' },
    { id: 'c_linkedin', type: 'linkedin', value: 'linkedin.com/in/your-profile' },
    { id: 'c_github', type: 'github', value: 'github.com/your-username' }
  ]
});

/**
 * Validates a candidate CV data snapshot against declarative schema constraints.
 * Pure inspection function: does not mutate or modify input data.
 *
 * @param {any} candidate - The snapshot object to inspect.
 * @returns {{ isValid: boolean, errors: Array<{ path: string, message: string, code: string }>, warnings: Array<{ path: string, message: string }> }}
 */
export function validateCVSnapshot(candidate) {
  const errors = [];
  const warnings = [];

  // Root validation
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return {
      isValid: false,
      errors: [{ path: '$', message: 'Candidate CV snapshot must be a non-null object', code: 'INVALID_ROOT' }],
      warnings: []
    };
  }

  // 1. Profile Validation
  if (!candidate.profile || typeof candidate.profile !== 'object' || Array.isArray(candidate.profile)) {
    errors.push({ path: '$.profile', message: 'Profile must be an object', code: 'INVALID_PROFILE' });
  } else {
    if (typeof candidate.profile.name !== 'string' || !candidate.profile.name.trim()) {
      warnings.push({ path: '$.profile.name', message: 'Profile name is missing or empty' });
    }
  }

  // 2. Layout Validation
  if (!candidate.layout || typeof candidate.layout !== 'object' || Array.isArray(candidate.layout)) {
    errors.push({ path: '$.layout', message: 'Layout must be an object', code: 'INVALID_LAYOUT' });
  } else {
    if (candidate.layout.type && !ALLOWED_LAYOUT_TYPES.includes(candidate.layout.type)) {
      errors.push({
        path: '$.layout.type',
        message: `Layout type "${candidate.layout.type}" is invalid. Allowed: ${ALLOWED_LAYOUT_TYPES.join(', ')}`,
        code: 'INVALID_LAYOUT_TYPE'
      });
    }

    // Check numeric properties
    Object.entries(NUMERIC_BOUNDS).forEach(([prop, bounds]) => {
      const val = candidate.layout[prop];
      if (val !== undefined) {
        if (typeof val !== 'number' || Number.isNaN(val)) {
          errors.push({ path: `$.layout.${prop}`, message: `Layout ${prop} must be a number`, code: 'INVALID_TYPE' });
        } else if (val < bounds.min || val > bounds.max) {
          warnings.push({ path: `$.layout.${prop}`, message: `Layout ${prop} (${val}) is outside standard bounds [${bounds.min}, ${bounds.max}]` });
        }
      }
    });
  }

  // 3. Sections Array Validation
  if (!Array.isArray(candidate.sections)) {
    errors.push({ path: '$.sections', message: 'Sections must be an array', code: 'INVALID_SECTIONS' });
  } else if (candidate.sections.length === 0) {
    warnings.push({ path: '$.sections', message: 'Sections array is empty' });
  } else {
    const seenSectionIds = new Set();
    const seenItemIds = new Set();
    let hasHeader = false;

    candidate.sections.forEach((sec, idx) => {
      const secPath = `$.sections[${idx}]`;
      if (!sec || typeof sec !== 'object' || Array.isArray(sec)) {
        errors.push({ path: secPath, message: 'Section item must be an object', code: 'INVALID_SECTION_ITEM' });
        return;
      }

      // Check Section ID
      if (typeof sec.id !== 'string' || !sec.id.trim()) {
        errors.push({ path: `${secPath}.id`, message: 'Section requires a non-empty string ID', code: 'MISSING_SECTION_ID' });
      } else {
        if (seenSectionIds.has(sec.id)) {
          errors.push({ path: `${secPath}.id`, message: `Duplicate section ID "${sec.id}" detected`, code: 'DUPLICATE_SECTION_ID' });
        }
        seenSectionIds.add(sec.id);
      }

      // Check Column
      if (sec.column && !ALLOWED_COLUMNS.includes(sec.column)) {
        errors.push({
          path: `${secPath}.column`,
          message: `Section column "${sec.column}" is invalid. Allowed: ${ALLOWED_COLUMNS.join(', ')}`,
          code: 'INVALID_SECTION_COLUMN'
        });
      }

      // Check Type
      if (typeof sec.type !== 'string' || !sec.type.trim()) {
        errors.push({ path: `${secPath}.type`, message: 'Section requires a non-empty type identifier', code: 'MISSING_SECTION_TYPE' });
      }

      if (sec.id === 'profile_header' || sec.type === 'profile_header' || sec.type === 'title_subtitle') {
        hasHeader = true;
      }

      // Check items array
      if (sec.items !== undefined && !Array.isArray(sec.items)) {
        errors.push({ path: `${secPath}.items`, message: 'Section items must be an array', code: 'INVALID_ITEMS_ARRAY' });
      } else if (Array.isArray(sec.items)) {
        sec.items.forEach((item, itemIdx) => {
          const itemPath = `${secPath}.items[${itemIdx}]`;
          if (!item || typeof item !== 'object' || Array.isArray(item)) {
            errors.push({ path: itemPath, message: 'Item entry must be an object', code: 'INVALID_ITEM_OBJECT' });
            return;
          }
          if (item.id) {
            if (seenItemIds.has(item.id)) {
              warnings.push({ path: `${itemPath}.id`, message: `Duplicate item ID "${item.id}" found` });
            }
            seenItemIds.add(item.id);
          }
        });
      }
    });

    if (!hasHeader) {
      warnings.push({ path: '$.sections', message: 'No profile_header section found in snapshot' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates and sanitizes a candidate CV data snapshot.
 * Merges missing properties with defaultSchema to guarantee application stability.
 * Recovers safely from null, primitive, or corrupt snapshots.
 *
 * @param {any} snapshot - The candidate snapshot to validate.
 * @returns {object} - Sanitized, guaranteed-valid CV data object.
 */
export function sanitizeAndValidateCVSnapshot(snapshot) {
  // If already normalized internally, bypass re-normalization
  if (snapshot && snapshot._isNormalizedInternal) {
    // Proceed directly to sanitization
  } else if (
    typeof snapshot === 'string' ||
    Boolean(
      snapshot &&
      typeof snapshot === 'object' &&
      !Array.isArray(snapshot) &&
      (
        snapshot.candidate_profile ||
        snapshot.normalized_sections ||
        snapshot.document_context ||
        snapshot.cvData ||
        snapshot.cv_data ||
        snapshot.resume ||
        snapshot.basics ||
        (!snapshot.sections && (snapshot.work_experience || snapshot.experience || snapshot.skills))
      )
    )
  ) {
    return normalizeAnyJSONToCVSnapshot(snapshot);
  }

  const safeSnapshot = (snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot))
    ? snapshot
    : {};

  const docLang = (safeSnapshot?.layout?.language || safeSnapshot?.language || (Array.isArray(safeSnapshot?.sections) && safeSnapshot.sections.some(s => /\b(experience|education|skills|projects|summary)\b/i.test(s?.title || '')) ? 'en' : 'es'));

  try {
    // 1. Sanitize Profile
    const rawProfile = safeSnapshot.profile && typeof safeSnapshot.profile === 'object' && !Array.isArray(safeSnapshot.profile)
      ? safeSnapshot.profile
      : {};

    const profile = {
      ...(defaultSchema.profile || {}),
      ...rawProfile,
    };

    if (typeof profile.name !== 'string' || !profile.name.trim()) {
      profile.name = defaultSchema.profile?.name || 'Nombre Profesional';
    } else {
      profile.name = profile.name.trim();
    }

    // 2. Sanitize Layout
    const rawLayout = safeSnapshot.layout && typeof safeSnapshot.layout === 'object' && !Array.isArray(safeSnapshot.layout)
      ? safeSnapshot.layout
      : {};

    const layout = {
      ...(defaultSchema.layout || {}),
      ...rawLayout,
    };

    // Guarantee layout.type is '1-column' or '2-column'
    if (layout.type !== '1-column' && layout.type !== '2-column') {
      layout.type = layout.isAtsMode ? '1-column' : (defaultSchema.layout?.type || '2-column');
    }
    layout.isAtsMode = Boolean(layout.isAtsMode);

    // Apply numerical bounds and default fallbacks
    Object.entries(NUMERIC_BOUNDS).forEach(([prop, bounds]) => {
      const val = layout[prop];
      if (typeof val !== 'number' || Number.isNaN(val)) {
        layout[prop] = defaultSchema.layout?.[prop] ?? bounds.default;
      }
    });

    if (!layout.fontFamily) {
      layout.fontFamily = defaultSchema.layout?.fontFamily || 'Poppins';
    }

    // 3. Sanitize Sections Array
    let rawSections = safeSnapshot.sections;
    if (!Array.isArray(rawSections) || rawSections.length === 0) {
      rawSections = defaultSchema.sections || [];
    }

    const seenItemIds = new Set();
    const seenSectionIds = new Set();

    const sanitizedSections = rawSections
      .filter((sec) => sec && typeof sec === 'object' && !Array.isArray(sec))
      .map((sec, secIndex) => {
        let secId = typeof sec.id === 'string' && sec.id.trim() ? sec.id.trim() : `sec_${secIndex}`;
        if (seenSectionIds.has(secId)) {
          secId = `${secId}_${secIndex}`;
        }
        seenSectionIds.add(secId);

        const column = sec.column === 'right' ? 'right' : 'left';
        const type = typeof sec.type === 'string' && sec.type.trim() ? sec.type.trim() : 'list';
        let title = typeof sec.title === 'string' ? sec.title.trim() : '';
        const docLang = (safeSnapshot?.layout?.language || safeSnapshot?.language || (Array.isArray(safeSnapshot?.sections) && safeSnapshot.sections.some(s => /\b(experience|education|skills|projects|summary)\b/i.test(s?.title || '')) ? 'en' : 'es'));
        const canonicalMap = (CANONICAL_SECTION_TITLES && CANONICAL_SECTION_TITLES[docLang])
          ? CANONICAL_SECTION_TITLES[docLang]
          : {
            profile_header: docLang === 'en' ? 'Profile Header' : 'Cabecera de Perfil',
            title_subtitle: docLang === 'en' ? 'Name & Profile' : 'Nombre y Perfil',
            about: docLang === 'en' ? 'Professional Summary' : 'Perfil Profesional',
            contact: docLang === 'en' ? 'Contact Information' : 'Información de Contacto',
            skills: docLang === 'en' ? 'Technical Skills' : 'Habilidades Técnicas',
            experience: docLang === 'en' ? 'Work Experience' : 'Experiencia Laboral',
            projects: docLang === 'en' ? 'Featured Projects' : 'Proyectos Destacados',
            education: docLang === 'en' ? 'Education' : 'Educación',
            certificates: docLang === 'en' ? 'Certifications' : 'Certificaciones',
            languages: docLang === 'en' ? 'Languages' : 'Idiomas',
            awards: docLang === 'en' ? 'Awards & Honors' : 'Premios y Logros',
            publications: docLang === 'en' ? 'Publications' : 'Publicaciones',
            references: docLang === 'en' ? 'References' : 'Referencias',
            mentoring: docLang === 'en' ? 'Mentoring' : 'Mentoría',
            volunteering: docLang === 'en' ? 'Volunteering' : 'Voluntariado',
            simple_list: docLang === 'en' ? 'Additional Information' : 'Información Adicional'
          };

        const isInternalIdPattern = /^sec_[a-zA-Z0-9_-]+$/i.test(title) ||
                                    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(title);
        const matchesSecId = Boolean(title && secId && title.toLowerCase() === secId.toLowerCase());
        const isSemanticSec = /^(experience|work_experience|skills|education|projects|about|summary|contact|languages|certificates)$/i.test(secId);

        if (isInternalIdPattern || !title) {
          title = canonicalMap[type] || canonicalMap[secId] || (type ? type.charAt(0).toUpperCase() + type.slice(1) : (docLang === 'en' ? 'Section' : 'Sección'));
        } else if (matchesSecId && isSemanticSec) {
          title = canonicalMap[secId] || canonicalMap[type] || (title.charAt(0).toUpperCase() + title.slice(1));
        }

        const rawItems = Array.isArray(sec.items) ? sec.items : [];
        const sanitizedItems = rawItems
          .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
          .map((item, itemIndex) => {
            let itemId = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : '';
            if (!itemId || seenItemIds.has(itemId)) {
              itemId = `${secId}_item_${itemIndex}`;
              if (seenItemIds.has(itemId)) {
                itemId = `${secId}_item_${itemIndex}_${seenItemIds.size}`;
              }
            }
            seenItemIds.add(itemId);

            return {
              ...item,
              id: itemId,
            };
          });

        return {
          ...sec,
          id: secId,
          column,
          type,
          title,
          items: sanitizedItems,
        };
      });

    // Ensure profile_header section exists
    const hasHeader = sanitizedSections.some((s) => s.id === 'profile_header' || s.type === 'profile_header' || s.type === 'title_subtitle');
    let finalSections = sanitizedSections;

    if (!hasHeader && defaultSchema.sections && defaultSchema.sections[0]) {
      const defaultHeader = defaultSchema.sections[0];
      finalSections = [
        {
          ...defaultHeader,
          items: (defaultHeader.items || []).map((it) => ({
            ...it,
            name: profile.name,
            subtitle: profile.subtitle || it.subtitle || '',
          })),
        },
        ...sanitizedSections,
      ];
    } else {
      // Synchronize profile.name and profile.subtitle with profile_header section item if needed
      finalSections = finalSections.map((sec) => {
        if (sec.id === 'profile_header' || sec.type === 'profile_header') {
          if (sec.items && sec.items.length > 0) {
            const firstItem = { ...sec.items[0] };
            if (!firstItem.name && profile.name) {
              firstItem.name = profile.name;
            }
            if (!profile.name && firstItem.name) {
              profile.name = firstItem.name;
            }
            const candidateSubtitle = (profile.subtitle || profile.title || '').trim();
            const itemSubtitle = (firstItem.subtitle || '').trim();
            if (!itemSubtitle && candidateSubtitle) {
              firstItem.subtitle = candidateSubtitle;
            }
            if (!candidateSubtitle && itemSubtitle) {
              profile.subtitle = itemSubtitle;
            }
            return {
              ...sec,
              items: [firstItem, ...sec.items.slice(1)],
            };
          }
        }
        return sec;
      });
    }

    // Deduplicate contact sections (RF-05, CA-05)
    let seenContactSection = false;
    const deduplicatedSections = [];
    finalSections.forEach((sec) => {
      const isContactSec = sec.type === 'contact' || sec.id === 'contact';
      if (isContactSec) {
        if (!seenContactSection) {
          seenContactSection = true;
          deduplicatedSections.push(sec);
        } else {
          // Merge items into primary contact section
          const primaryContact = deduplicatedSections.find(s => s.type === 'contact' || s.id === 'contact');
          if (primaryContact && Array.isArray(sec.items) && sec.items.length > 0) {
            const existingItems = Array.isArray(primaryContact.items) ? primaryContact.items : [];
            const primaryItem = existingItems[0] || {};
            const secondaryItem = sec.items[0] || {};
            const primaryContacts = Array.isArray(primaryItem.contacts) ? primaryItem.contacts : [];
            const secondaryContacts = Array.isArray(secondaryItem.contacts) ? secondaryItem.contacts : [];
            const mergedContacts = [...primaryContacts];
            secondaryContacts.forEach(c => {
              if (c && c.value && !mergedContacts.some(mc => mc.value === c.value)) {
                mergedContacts.push(c);
              }
            });
            primaryItem.contacts = mergedContacts;
            primaryContact.items = [primaryItem, ...existingItems.slice(1)];
          }
        }
      } else {
        deduplicatedSections.push(sec);
      }
    });
    finalSections = deduplicatedSections;

    // 5. Ensure Contact Section & Fallback Placeholders (Single Source of Truth)
    const fallbackContacts = docLang === 'en'
      ? DEFAULT_CONTACT_PLACEHOLDERS.en
      : DEFAULT_CONTACT_PLACEHOLDERS.es;

    const contactSecIdx = finalSections.findIndex(s => s.type === 'contact' || s.id === 'contact');
    const profHeaderIdx = finalSections.findIndex(s => s.type === 'profile_header' || s.id === 'profile_header');

    if (contactSecIdx !== -1) {
      const contactSec = finalSections[contactSecIdx];
      const rawContactItem = contactSec.items?.[0] || {};
      const normalizedContacts = Array.isArray(rawContactItem.contacts)
        ? rawContactItem.contacts
        : normalizeItemContacts(rawContactItem);
      const validContacts = normalizedContacts.filter(c => c && c.value && String(c.value).trim() !== '');

      if (validContacts.length === 0) {
        let salvagedContacts = [];
        if (profHeaderIdx !== -1) {
          const profItem = finalSections[profHeaderIdx]?.items?.[0] || {};
          const rawProfContacts = Array.isArray(profItem.contacts) && profItem.contacts.length > 0
            ? profItem.contacts
            : normalizeItemContacts(profItem);
          salvagedContacts = rawProfContacts.filter(c => c && c.value && String(c.value).trim() !== '');
        }
        const contactsToUse = salvagedContacts.length > 0 ? salvagedContacts : fallbackContacts;
        finalSections[contactSecIdx] = {
          ...contactSec,
          items: [
            {
              ...rawContactItem,
              id: rawContactItem.id || 'contact1',
              contacts: contactsToUse,
              ...syncFlatContactFields(contactsToUse)
            },
            ...(contactSec.items ? contactSec.items.slice(1) : [])
          ]
        };
      }
    }

    return {
      ...safeSnapshot,
      profile,
      layout,
      sections: finalSections,
    };
  } catch (err) {
    console.error('Snapshot validation failed:', err);
    return JSON.parse(JSON.stringify(defaultSchema));
  }
}

export function ensureContactSectionWithFallback(cvData, lang = 'es') {
  if (!cvData || !Array.isArray(cvData.sections)) return cvData;
  const docLang = lang || cvData.layout?.language || cvData.language || 'es';
  const fallbackContacts = docLang === 'en'
    ? DEFAULT_CONTACT_PLACEHOLDERS.en
    : DEFAULT_CONTACT_PLACEHOLDERS.es;

  let sections = [...cvData.sections];
  const contactIdx = sections.findIndex(s => s.id === 'contact' || s.type === 'contact');
  const profHeaderIdx = sections.findIndex(s => s.id === 'profile_header' || s.type === 'profile_header');

  if (contactIdx === -1) {
    let extractedContacts = [];
    if (profHeaderIdx !== -1) {
      const profItem = sections[profHeaderIdx]?.items?.[0] || {};
      const raw = Array.isArray(profItem.contacts) ? profItem.contacts : normalizeItemContacts(profItem);
      extractedContacts = raw.filter(c => c && c.value && String(c.value).trim() !== '');
    }
    const contactsToUse = extractedContacts.length > 0 ? extractedContacts : fallbackContacts;
    const newContactSection = {
      id: 'contact',
      type: 'contact',
      column: profHeaderIdx !== -1 ? sections[profHeaderIdx].column || 'left' : 'left',
      title: '',
      items: [
        {
          id: 'contact1',
          contacts: contactsToUse,
          ...syncFlatContactFields(contactsToUse)
        }
      ]
    };
    const insertAt = profHeaderIdx !== -1 ? profHeaderIdx + 1 : 0;
    sections.splice(insertAt, 0, newContactSection);
  } else {
    const contactSec = sections[contactIdx];
    const contactItem = contactSec?.items?.[0] || {};
    const raw = Array.isArray(contactItem.contacts) ? contactItem.contacts : normalizeItemContacts(contactItem);
    const valid = raw.filter(c => c && c.value && String(c.value).trim() !== '');
    if (valid.length === 0) {
      let salvaged = [];
      if (profHeaderIdx !== -1) {
        const profItem = sections[profHeaderIdx]?.items?.[0] || {};
        const rawProf = Array.isArray(profItem.contacts) ? profItem.contacts : normalizeItemContacts(profItem);
        salvaged = rawProf.filter(c => c && c.value && String(c.value).trim() !== '');
      }
      const contactsToUse = salvaged.length > 0 ? salvaged : fallbackContacts;
      sections[contactIdx] = {
        ...contactSec,
        items: [
          {
            ...contactItem,
            id: contactItem.id || 'contact1',
            contacts: contactsToUse,
            ...syncFlatContactFields(contactsToUse)
          },
          ...(contactSec.items ? contactSec.items.slice(1) : [])
        ]
      };
    }
  }

  // Clean bundled contacts from profile_header
  if (profHeaderIdx !== -1) {
    const profSec = sections[profHeaderIdx];
    const cleanItems = (profSec.items || []).map(item => {
      const { contacts, email, phone, location, linkedin, github, ...rest } = item;
      return rest;
    });
    sections[profHeaderIdx] = { ...profSec, items: cleanItems };
  }

  return { ...cvData, sections };
}

export { normalizeAnyJSONToCVSnapshot };
export default sanitizeAndValidateCVSnapshot;
