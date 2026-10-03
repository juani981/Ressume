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

export const ALLOWED_LAYOUT_TYPES = Object.freeze(['1-column', '2-column']);
export const ALLOWED_COLUMNS = Object.freeze(['left', 'right']);
export const ALLOWED_FONT_FAMILIES = Object.freeze([
  'Poppins',
  'Inter',
  'Roboto',
  'Merriweather',
  'JetBrains Mono'
]);

export const NUMERIC_BOUNDS = Object.freeze({
  pagePadding: { min: 0, max: 100, default: 24 },
  sectionGap: { min: 0, max: 100, default: 20 },
  itemGap: { min: 0, max: 50, default: 8 },
  fontScale: { min: 0.5, max: 2.0, default: 1.0 },
  titleScale: { min: 0.5, max: 2.0, default: 1.0 },
  bodyScale: { min: 0.5, max: 2.0, default: 1.0 },
  listScale: { min: 0.5, max: 2.0, default: 1.0 },
  lineHeight: { min: 1.0, max: 2.5, default: 1.3 }
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
        const isInternalIdTitle = /^sec_[a-zA-Z0-9_-]+$/i.test(title) ||
                                  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(title) ||
                                  title === secId;
        if (isInternalIdTitle || !title) {
          const canonicalMap = {
            profile_header: 'Cabecera de Perfil',
            title_subtitle: 'Nombre y Perfil',
            about: 'Perfil Profesional',
            contact: 'Información de Contacto',
            skills: 'Habilidades',
            experience: 'Experiencia Laboral',
            projects: 'Proyectos',
            education: 'Educación',
            certificates: 'Certificaciones',
            languages: 'Idiomas',
            awards: 'Premios y Logros',
            publications: 'Publicaciones',
            references: 'Referencias',
            mentoring: 'Mentoría',
            volunteering: 'Voluntariado',
            simple_list: 'Información Adicional'
          };
          title = canonicalMap[type] || (type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Sección');
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
          })),
        },
        ...sanitizedSections,
      ];
    } else {
      // Synchronize profile.name with profile_header section item if needed
      finalSections = finalSections.map((sec) => {
        if (sec.id === 'profile_header' || sec.type === 'profile_header') {
          if (sec.items && sec.items.length > 0) {
            const firstItem = { ...sec.items[0] };
            if (!firstItem.name && profile.name) {
              firstItem.name = profile.name;
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

export { normalizeAnyJSONToCVSnapshot };
export default sanitizeAndValidateCVSnapshot;
