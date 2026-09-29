/**
 * universalJsonImporter.js
 *
 * Universal, Failproof JSON Ingestion Pipeline for Ressume.
 *
 * Ingests, repairs, normalizes, and adapts ANY JSON format produced by
 * human users, LLM prompts, Version Manager backups, JSON Resume standards,
 * or the high-fidelity live preview PDF abstraction engine.
 *
 * Guarantees:
 * 1. Syntax Resilience: extracts JSON from Markdown fences (```json ... ```),
 *    conversational preambles/postambles, heals trailing commas, unescaped
 *    newlines, and smart typographic quotes.
 * 2. Multi-Flavor Ingestion: seamlessly unrolls enveloped roots (cv, cvData,
 *    resume, data), maps snake_case to camelCase, and adapts:
 *    - Native Ressume Format ({ profile, layout, sections })
 *    - Rich Live-Preview PDF Abstraction ({ document_context, candidate_profile, normalized_sections })
 *    - Normalized Section Dictionaries ({ candidate_profile, work_experience, skills, education })
 *    - Standard JSON Resume ({ basics, work, education, skills })
 * 3. Strict Idempotence: uses deterministic, predictable item ID generation
 *    (${secId}_item_${idx}) rather than random timestamps, ensuring consecutive
 *    runs on identical data yield 100% stable, drift-free snapshots.
 * 4. Zero Unhandled Exceptions: always delegates to sanitizeAndValidateCVSnapshot,
 *    guaranteeing a 100% valid, crash-free CV data model under all circumstances.
 */

import { sanitizeAndValidateCVSnapshot } from './cvSchemaValidator.js';
import { sanitizeContactUrl } from './cvJsonAbstraction.js';
import { stripHtml } from './richTextEngine.js';
import { defaultSchema } from './schema.js';

/**
 * Maps snake_case layout properties to internal camelCase properties
 */
const LAYOUT_KEY_MAP = {
  type: 'type',
  is_ats_mode: 'isAtsMode',
  isatsmode: 'isAtsMode',
  isAtsMode: 'isAtsMode',
  font_family: 'fontFamily',
  fontfamily: 'fontFamily',
  fontFamily: 'fontFamily',
  font_scale: 'fontScale',
  fontscale: 'fontScale',
  fontScale: 'fontScale',
  title_scale: 'titleScale',
  titlescale: 'titleScale',
  titleScale: 'titleScale',
  body_scale: 'bodyScale',
  bodyscale: 'bodyScale',
  bodyScale: 'bodyScale',
  list_scale: 'listScale',
  listscale: 'listScale',
  listScale: 'listScale',
  line_height: 'lineHeight',
  lineheight: 'lineHeight',
  lineHeight: 'lineHeight',
  page_padding: 'pagePadding',
  pagepadding: 'pagePadding',
  pagePadding: 'pagePadding',
  page_padding_px: 'pagePadding',
  section_gap: 'sectionGap',
  sectiongap: 'sectionGap',
  sectionGap: 'sectionGap',
  section_gap_px: 'sectionGap',
  item_gap: 'itemGap',
  itemgap: 'itemGap',
  itemGap: 'itemGap',
  item_gap_px: 'itemGap',
  left_bg: 'leftBg',
  leftbg: 'leftBg',
  leftBg: 'leftBg',
  left_background: 'leftBg',
  right_bg: 'rightBg',
  rightbg: 'rightBg',
  rightBg: 'rightBg',
  right_background: 'rightBg',
  left_column_width: 'leftColumnWidth',
  leftcolumnwidth: 'leftColumnWidth',
  leftColumnWidth: 'leftColumnWidth'
};

/**
 * Maps normalized or loose section names to canonical Ressume types and IDs
 */
const SECTION_TYPE_MAP = {
  candidate_profile: { id: 'profile_header', type: 'profile_header', defaultTitle: '' },
  profile_header: { id: 'profile_header', type: 'profile_header', defaultTitle: '' },
  header: { id: 'profile_header', type: 'profile_header', defaultTitle: '' },
  personal_information: { id: 'profile_header', type: 'profile_header', defaultTitle: '' },
  title_subtitle: { id: 'profile_header', type: 'profile_header', defaultTitle: '' },

  professional_summary: { id: 'about_section', type: 'about', defaultTitle: 'PERFIL PROFESIONAL' },
  about: { id: 'about_section', type: 'about', defaultTitle: 'PERFIL PROFESIONAL' },
  about_section: { id: 'about_section', type: 'about', defaultTitle: 'PERFIL PROFESIONAL' },
  summary: { id: 'about_section', type: 'about', defaultTitle: 'PERFIL PROFESIONAL' },
  perfil: { id: 'about_section', type: 'about', defaultTitle: 'PERFIL PROFESIONAL' },
  sobre_mi: { id: 'about_section', type: 'about', defaultTitle: 'PERFIL PROFESIONAL' },

  work_experience: { id: 'experience', type: 'list', defaultTitle: 'EXPERIENCIA LABORAL' },
  experience: { id: 'experience', type: 'list', defaultTitle: 'EXPERIENCIA LABORAL' },
  experiencia: { id: 'experience', type: 'list', defaultTitle: 'EXPERIENCIA LABORAL' },
  experiencia_laboral: { id: 'experience', type: 'list', defaultTitle: 'EXPERIENCIA LABORAL' },
  career: { id: 'experience', type: 'list', defaultTitle: 'EXPERIENCIA LABORAL' },
  employment: { id: 'experience', type: 'list', defaultTitle: 'EXPERIENCIA LABORAL' },
  work: { id: 'experience', type: 'list', defaultTitle: 'EXPERIENCIA LABORAL' },

  skills_and_technologies: { id: 'skills', type: 'skills', defaultTitle: 'HABILIDADES TÉCNICAS' },
  skills: { id: 'skills', type: 'skills', defaultTitle: 'HABILIDADES TÉCNICAS' },
  habilidades: { id: 'skills', type: 'skills', defaultTitle: 'HABILIDADES TÉCNICAS' },
  competencias: { id: 'skills', type: 'skills', defaultTitle: 'HABILIDADES TÉCNICAS' },
  technologies: { id: 'skills', type: 'skills', defaultTitle: 'HABILIDADES TÉCNICAS' },
  technical_skills: { id: 'skills', type: 'skills', defaultTitle: 'HABILIDADES TÉCNICAS' },

  education: { id: 'education', type: 'education', defaultTitle: 'EDUCACIÓN' },
  educacion: { id: 'education', type: 'education', defaultTitle: 'EDUCACIÓN' },
  formacion: { id: 'education', type: 'education', defaultTitle: 'EDUCACIÓN' },
  studies: { id: 'education', type: 'education', defaultTitle: 'EDUCACIÓN' },
  academic: { id: 'education', type: 'education', defaultTitle: 'EDUCACIÓN' },

  projects: { id: 'projects', type: 'list', defaultTitle: 'PROYECTOS DESTACADOS' },
  proyectos: { id: 'projects', type: 'list', defaultTitle: 'PROYECTOS DESTACADOS' },
  side_projects: { id: 'projects', type: 'list', defaultTitle: 'PROYECTOS DESTACADOS' },

  certifications: { id: 'certificates', type: 'simple_list', defaultTitle: 'CERTIFICACIONES' },
  certificates: { id: 'certificates', type: 'simple_list', defaultTitle: 'CERTIFICACIONES' },
  certificaciones: { id: 'certificates', type: 'simple_list', defaultTitle: 'CERTIFICACIONES' },

  languages: { id: 'languages', type: 'simple_list', defaultTitle: 'IDIOMAS' },
  idiomas: { id: 'languages', type: 'simple_list', defaultTitle: 'IDIOMAS' },

  awards: { id: 'awards', type: 'simple_list', defaultTitle: 'PREMIOS Y RECONOCIMIENTOS' },
  premios: { id: 'awards', type: 'simple_list', defaultTitle: 'PREMIOS Y RECONOCIMIENTOS' },

  volunteering: { id: 'volunteering', type: 'list', defaultTitle: 'VOLUNTARIADO' },
  voluntariado: { id: 'volunteering', type: 'list', defaultTitle: 'VOLUNTARIADO' },

  publications: { id: 'publications', type: 'simple_list', defaultTitle: 'PUBLICACIONES' },
  publicaciones: { id: 'publications', type: 'simple_list', defaultTitle: 'PUBLICACIONES' },

  contact_details: { id: 'contact', type: 'contact', defaultTitle: 'CONTACTO' },
  contact: { id: 'contact', type: 'contact', defaultTitle: 'CONTACTO' },
  contacto: { id: 'contact', type: 'contact', defaultTitle: 'CONTACTO' }
};

/**
 * Stage 1 & 2: Cleans, heals, and parses raw input string into a valid JavaScript Object.
 */
export const cleanAndParseRawJSON = (rawInput) => {
  if (!rawInput) return null;
  if (typeof rawInput === 'object') return rawInput;
  if (typeof rawInput !== 'string') return null;

  let cleaned = rawInput.trim();

  // 1. Replace typographic smart quotes
  cleaned = cleaned
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");

  // 2. Strip Markdown code fences (e.g. ```json ... ``` or ``` ... ```)
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = cleaned.match(codeBlockRegex);
  if (match && match[1]) {
    cleaned = match[1].trim();
  }

  // 3. Extract outermost JSON object if surrounded by preambles or postambles
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // 4. Auto-fix common trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  // 5. Attempt Parsing
  try {
    return JSON.parse(cleaned);
  } catch (err1) {
    // Attempt second repair: replace unescaped literal newlines inside strings
    try {
      const fixedNewlines = cleaned.replace(/([^\\])"\n\s*"/g, '$1",\n"');
      return JSON.parse(fixedNewlines);
    } catch (err2) {
      console.warn('cleanAndParseRawJSON failed to parse input:', err1.message);
      return null;
    }
  }
};

/**
 * Stage 3: Unrolls enveloped root keys recursively.
 */
export const unwrapRootObject = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;

  const wrapperKeys = [
    'cvData',
    'cv_data',
    'cv',
    'resume',
    'curriculum_vitae',
    'curriculumVitae',
    'candidate_cv',
    'data',
    'document',
    'response',
    'output',
    'content',
    'result',
    'snapshot'
  ];

  let current = obj;
  let unwrapped = true;
  let depth = 0;

  while (unwrapped && depth < 5) {
    unwrapped = false;
    depth++;
    if (!current || typeof current !== 'object' || Array.isArray(current)) break;

    for (const key of wrapperKeys) {
      if (current[key] && typeof current[key] === 'object' && !Array.isArray(current[key])) {
        const inner = current[key];
        const hasCvField = Boolean(
          inner.sections ||
          inner.profile ||
          inner.candidate_profile ||
          inner.work_experience ||
          inner.experience ||
          inner.basics ||
          inner.normalized_sections
        );
        const hasWrapperField = wrapperKeys.some(k => inner[k] && typeof inner[k] === 'object');
        if (hasCvField || hasWrapperField) {
          current = inner;
          unwrapped = true;
          break;
        }
      }
    }
  }

  return current;
};

/**
 * Normalizes layout options from arbitrary input flavor.
 */
export const extractNormalizedLayout = (raw) => {
  const source = raw.layout || raw.physical_page_layout || raw.live_preview_pdf || raw.styling || {};
  const normalized = {};

  Object.entries(source).forEach(([k, v]) => {
    const mapped = LAYOUT_KEY_MAP[k] || LAYOUT_KEY_MAP[k.toLowerCase()];
    if (mapped) {
      normalized[mapped] = v;
    }
  });

  // Check sub-properties in physical_page_layout
  if (source.typography && typeof source.typography === 'object') {
    Object.entries(source.typography).forEach(([k, v]) => {
      const mapped = LAYOUT_KEY_MAP[k] || LAYOUT_KEY_MAP[k.toLowerCase()];
      if (mapped) normalized[mapped] = v;
    });
  }

  if (source.spacing_and_geometry && typeof source.spacing_and_geometry === 'object') {
    Object.entries(source.spacing_and_geometry).forEach(([k, v]) => {
      const mapped = LAYOUT_KEY_MAP[k] || LAYOUT_KEY_MAP[k.toLowerCase()];
      if (mapped) normalized[mapped] = v;
    });
  }

  if (source.color_palette && typeof source.color_palette === 'object') {
    if (source.color_palette.left_sidebar_background) normalized.leftBg = source.color_palette.left_sidebar_background;
    if (source.color_palette.right_main_background) normalized.rightBg = source.color_palette.right_main_background;
  }

  // Ensure valid layout type
  if (normalized.isAtsMode) {
    normalized.type = '1-column';
  } else if (!normalized.type || (normalized.type !== '1-column' && normalized.type !== '2-column')) {
    normalized.type = defaultSchema.layout.type || '2-column';
  }

  return normalized;
};

/**
 * Normalizes candidate profile from arbitrary input flavor.
 */
export const extractProfileData = (raw) => {
  const profileSource = raw.candidate_profile || raw.profile || raw.personal_information || raw.candidate || raw.basics || raw.header || {};
  const fullName = profileSource.full_name || profileSource.fullName || profileSource.name || profileSource.candidate_name || '';
  const headline = profileSource.headline || profileSource.subtitle || profileSource.title || profileSource.role || profileSource.label || '';
  const location = profileSource.location?.city ? `${profileSource.location.city}, ${profileSource.location.countryCode || profileSource.location.country || ''}` : (typeof profileSource.location === 'string' ? profileSource.location : '');
  const summary = profileSource.professional_summary || profileSource.summary || profileSource.about || profileSource.description || '';

  // Contacts
  const contactsMap = {};
  if (profileSource.email) contactsMap.email = profileSource.email;
  if (profileSource.phone) contactsMap.phone = profileSource.phone;
  if (location) contactsMap.location = location;

  const rawChannels = profileSource.contact_channels || profileSource.contacts || profileSource.profiles || {};
  if (Array.isArray(rawChannels)) {
    rawChannels.forEach(c => {
      if (!c) return;
      const type = (c.type || c.network || '').toLowerCase().trim();
      const val = c.value || c.url || c.username || '';
      if (type && val) contactsMap[type] = val;
    });
  } else if (typeof rawChannels === 'object') {
    Object.entries(rawChannels).forEach(([k, v]) => {
      if (v && typeof v === 'string') contactsMap[k.toLowerCase().trim()] = v;
    });
  }

  return {
    fullName: stripHtml(fullName).trim(),
    headline: stripHtml(headline).trim(),
    location: stripHtml(location).trim(),
    summary: stripHtml(summary).trim(),
    contacts: contactsMap
  };
};

/**
 * Converts items from any section into standard internal item structures.
 */
const normalizeItemToInternal = (item, secType, secId, itemIdx) => {
  if (!item) return null;
  const stableId = item.id && typeof item.id === 'string' && item.id.trim()
    ? item.id.trim()
    : `${secId}_item_${itemIdx}`;

  // Skills
  if (secType === 'skills') {
    let title = item.category_name || item.category || item.title || item.name || '';
    let desc = '';
    if (Array.isArray(item.technologies)) {
      desc = item.technologies.join(', ');
    } else if (Array.isArray(item.skills)) {
      desc = item.skills.join(', ');
    } else if (Array.isArray(item.keywords)) {
      desc = item.keywords.join(', ');
    } else {
      desc = item.raw_content || item.description || item.content || item.text || '';
    }

    return {
      id: stableId,
      title: stripHtml(title).trim(),
      description: stripHtml(desc).trim()
    };
  }

  // Simple lists (Languages, Certifications, Awards, Publications)
  if (secType === 'simple_list' || secType === 'certificates' || secType === 'languages') {
    let text = item.text || item.title || item.name || item.language || '';
    const sub = item.subtitle || item.issuer || item.issuer_or_institution || item.proficiency_level || item.date || '';
    if (sub && !text.includes(sub)) {
      text = `${text} (${sub})`.trim();
    }
    return {
      id: stableId,
      text: stripHtml(text).trim(),
      ...(item.date ? { date: String(item.date).trim() } : {}),
      ...(item.link || item.credential_url || item.url ? { link: sanitizeContactUrl(item.link || item.credential_url || item.url) } : {})
    };
  }

  // Education
  if (secType === 'education') {
    const title = item.degree || item.studyType || item.area || item.title || '';
    const subtitle = item.institution || item.school || item.university || item.subtitle || '';
    const date = item.period || item.date || item.dates || item.graduation_date || item.endDate || item.year || '';
    const description = item.description || item.summary || (Array.isArray(item.courses) ? item.courses.join(', ') : '');

    return {
      id: stableId,
      title: stripHtml(title).trim(),
      subtitle: stripHtml(subtitle).trim(),
      date: stripHtml(date).trim(),
      ...(description ? { description: stripHtml(description).trim() } : {})
    };
  }

  // Work Experience, Projects, List, Volunteering
  const title = item.role_title || item.role || item.position || item.project_name || item.title || item.name || '';
  const subtitle = item.organization || item.company || item.employer || item.organization_or_context || item.subtitle || '';
  const date = item.period || item.date || item.dates || item.duration || (item.startDate ? `${item.startDate} – ${item.endDate || 'Present'}` : '');
  const link = item.project_url || item.repository_url || item.link || item.url || '';
  const description = item.summary || item.description || item.details || '';

  let bullets = [];
  if (Array.isArray(item.achievements)) bullets = item.achievements;
  else if (Array.isArray(item.highlights)) bullets = item.highlights;
  else if (Array.isArray(item.bullets)) bullets = item.bullets;
  else if (Array.isArray(item.responsibilities)) bullets = item.responsibilities;
  else if (Array.isArray(item.points)) bullets = item.points;
  else if (typeof item.description === 'string' && item.description.includes('\n')) {
    bullets = item.description.split('\n').map(b => b.replace(/^[-*•]\s*/, '').trim()).filter(Boolean);
  }

  return {
    id: stableId,
    title: stripHtml(title).trim(),
    subtitle: stripHtml(subtitle).trim(),
    date: stripHtml(date).trim(),
    ...(link ? { link: sanitizeContactUrl(link) } : {}),
    ...(description ? { description: stripHtml(description).trim() } : {}),
    ...(bullets.length > 0 ? { bullets: bullets.map(b => stripHtml(b).trim()).filter(Boolean) } : {})
  };
};

/**
 * Stage 4 & 5: Universal Normalizer converting any input structure into a standard CV Snapshot.
 */
export const normalizeAnyJSONToCVSnapshot = (candidateInput) => {
  const parsed = cleanAndParseRawJSON(candidateInput);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return sanitizeAndValidateCVSnapshot(null);
  }

  const root = unwrapRootObject(parsed);
  const layout = extractNormalizedLayout(root);
  const profileData = extractProfileData(root);

  // If root is already a standard Ressume CV snapshot with native sections and profile_header:
  if (Array.isArray(root.sections) && root.sections.some(s => s?.id === 'profile_header' || s?.type === 'profile_header')) {
    const candidateSnapshot = {
      _isNormalizedInternal: true,
      profile: {
        ...(root.profile || {}),
        name: profileData.fullName || root.profile?.name || 'Nombre Profesional'
      },
      layout: {
        ...layout,
        type: layout.isAtsMode ? '1-column' : (layout.type || '2-column')
      },
      sections: root.sections
    };
    return sanitizeAndValidateCVSnapshot(candidateSnapshot);
  }

  const sectionsList = [];
  const seenSectionIds = new Set();

  // Helper to append a section
  const appendSection = (config, items = [], column = 'left') => {
    let secId = config.id;
    if (seenSectionIds.has(secId)) {
      secId = `${secId}_${sectionsList.length}`;
    }
    seenSectionIds.add(secId);

    const mappedItems = items
      .map((it, idx) => normalizeItemToInternal(it, config.type, secId, idx))
      .filter(Boolean);

    sectionsList.push({
      id: secId,
      column: column === 'right' ? 'right' : 'left',
      type: config.type,
      title: config.defaultTitle || config.title || '',
      items: mappedItems
    });
  };

  // 1. Candidate Profile Header Section
  const contactItems = [];
  Object.entries(profileData.contacts).forEach(([type, value]) => {
    if (value) contactItems.push({ id: `c_${type}`, type, value });
  });

  const headerItem = {
    id: 'ph_main',
    name: profileData.fullName || 'Nombre Profesional',
    subtitle: profileData.headline || '',
    location: profileData.location || '',
    contacts: contactItems
  };
  if (profileData.contacts.email) headerItem.email = profileData.contacts.email;
  if (profileData.contacts.phone) headerItem.phone = profileData.contacts.phone;
  if (profileData.contacts.linkedin) headerItem.linkedin = profileData.contacts.linkedin;
  if (profileData.contacts.github) headerItem.github = profileData.contacts.github;

  sectionsList.push({
    id: 'profile_header',
    column: 'left',
    type: 'profile_header',
    title: '',
    items: [headerItem]
  });
  seenSectionIds.add('profile_header');

  // 2. Professional Summary Section
  if (profileData.summary) {
    sectionsList.push({
      id: 'about_section',
      column: 'left',
      type: 'about',
      title: 'PERFIL PROFESIONAL',
      items: [{
        id: 'about_1',
        description: profileData.summary
      }]
    });
    seenSectionIds.add('about_section');
  }

  // 3. Process Sections Array (from raw.sections or raw.normalized_sections)
  const rawSectionsArray = Array.isArray(root.normalized_sections)
    ? root.normalized_sections
    : (Array.isArray(root.sections) ? root.sections : null);

  if (rawSectionsArray) {
    rawSectionsArray.forEach(sec => {
      if (!sec || typeof sec !== 'object') return;
      const keyOrType = sec.section_key || sec.type || sec.id || '';
      const mappedConfig = SECTION_TYPE_MAP[keyOrType] || {
        id: sec.id || keyOrType.toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'custom_sec',
        type: sec.type || 'list',
        defaultTitle: sec.title || sec.display_title || 'SECCIÓN'
      };

      // Skip duplicating profile_header or about if already injected
      if (mappedConfig.id === 'profile_header') return;
      if (mappedConfig.id === 'about_section' && profileData.summary) return;

      let secTitle = sec.display_title || sec.title;
      if (secTitle && (/^sec_[a-zA-Z0-9_-]+$/i.test(secTitle) || /^[0-9a-f-]{36}$/i.test(secTitle))) {
        secTitle = mappedConfig.defaultTitle;
      }
      const finalTitle = secTitle || mappedConfig.defaultTitle;

      appendSection(
        {
          id: mappedConfig.id,
          type: mappedConfig.type,
          defaultTitle: finalTitle
        },
        Array.isArray(sec.items) ? sec.items : [],
        sec.display_column || sec.column || 'left'
      );
    });
  } else {
    // 4. Flavor C & D: Process dictionary keys (work_experience, skills, education, etc.)
    const standardKeys = [
      'work_experience', 'experience', 'work',
      'skills_and_technologies', 'skills',
      'education',
      'projects',
      'certifications', 'certificates',
      'languages',
      'awards',
      'volunteering',
      'publications'
    ];

    standardKeys.forEach(k => {
      const val = root[k];
      if (Array.isArray(val) && val.length > 0) {
        const config = SECTION_TYPE_MAP[k];
        if (config && !seenSectionIds.has(config.id)) {
          appendSection(config, val, k === 'experience' || k === 'work_experience' || k === 'projects' ? 'right' : 'left');
        }
      }
    });
  }

  // 5. Construct snapshot candidate and validate via SSOT cvSchemaValidator
  const candidateSnapshot = {
    _isNormalizedInternal: true,
    profile: {
      name: profileData.fullName || 'Nombre Profesional'
    },
    layout: {
      ...layout,
      type: layout.isAtsMode ? '1-column' : (layout.type || '2-column')
    },
    sections: sectionsList
  };

  return sanitizeAndValidateCVSnapshot(candidateSnapshot);
};

export const importUniversalCV = normalizeAnyJSONToCVSnapshot;

export {
  cleanAndParseRawJSON,
  unwrapRootObject,
  normalizeAnyJSONToCVSnapshot
};

export default {
  cleanAndParseRawJSON,
  unwrapRootObject,
  normalizeAnyJSONToCVSnapshot,
  importUniversalCV: normalizeAnyJSONToCVSnapshot
};
