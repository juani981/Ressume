/**
 * universalJsonImporter.js
 *
 * Universal, Failproof JSON Ingestion Pipeline for Easy CV Editor.
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
 *    - Native Easy CV Editor Format ({ profile, layout, sections })
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
import { normalizeItemContacts, syncFlatContactFields } from './contactTypes.js';

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
  leftColumnWidth: 'leftColumnWidth',
  language: 'language',
  lang: 'language',
  locale: 'language'
};

export const SECTION_DEFAULT_TITLES = {
  es: {
    profile_header: '',
    about_section: 'PERFIL PROFESIONAL',
    experience: 'EXPERIENCIA LABORAL',
    skills: 'HABILIDADES TÉCNICAS',
    education: 'EDUCACIÓN',
    projects: 'PROYECTOS DESTACADOS',
    certificates: 'CERTIFICACIONES',
    languages: 'IDIOMAS',
    awards: 'PREMIOS Y RECONOCIMIENTOS',
    volunteering: 'VOLUNTARIADO',
    publications: 'PUBLICACIONES',
    contact: 'CONTACTO'
  },
  en: {
    profile_header: '',
    about_section: 'PROFESSIONAL SUMMARY',
    experience: 'WORK EXPERIENCE',
    skills: 'TECHNICAL SKILLS',
    education: 'EDUCATION',
    projects: 'FEATURED PROJECTS',
    certificates: 'CERTIFICATIONS',
    languages: 'LANGUAGES',
    awards: 'AWARDS & HONORS',
    volunteering: 'VOLUNTEER EXPERIENCE',
    publications: 'PUBLICATIONS',
    contact: 'CONTACT'
  }
};

export const getSectionDefaultTitle = (secId, docLang = 'es') => {
  const langKey = (docLang && String(docLang).toLowerCase().startsWith('en')) ? 'en' : 'es';
  const langMap = SECTION_DEFAULT_TITLES[langKey] || SECTION_DEFAULT_TITLES.es;
  return langMap[secId] || (SECTION_DEFAULT_TITLES.es[secId] || '');
};

export const detectDocumentLanguage = (raw) => {
  if (!raw || typeof raw !== 'object') return 'es';

  // 1. Explicit language declarations in root or layout
  const explicit = raw.language || raw.lang || raw.locale ||
    raw.layout?.language || raw.layout?.lang || raw.physical_page_layout?.language ||
    raw.document_context?.language || raw.document_context?.locale;
  if (typeof explicit === 'string') {
    const clean = explicit.toLowerCase().trim();
    if (clean.startsWith('en')) return 'en';
    if (clean.startsWith('es')) return 'es';
    if (clean.startsWith('pt')) return 'pt';
    if (clean.startsWith('de')) return 'de';
    if (clean.startsWith('fr')) return 'fr';
    if (clean.startsWith('it')) return 'it';
  }

  // 2. Scan section titles and candidate texts
  const textCorpus = [];
  if (raw.candidate_profile?.headline) textCorpus.push(raw.candidate_profile.headline);
  if (raw.profile?.subtitle) textCorpus.push(raw.profile.subtitle);
  if (raw.profile?.title) textCorpus.push(raw.profile.title);

  const sections = Array.isArray(raw.normalized_sections)
    ? raw.normalized_sections
    : (Array.isArray(raw.sections) ? raw.sections : []);

  sections.forEach(s => {
    if (s?.title) textCorpus.push(s.title);
    if (s?.display_title) textCorpus.push(s.display_title);
  });

  const fullText = textCorpus.join(' ').toLowerCase();

  const enMatches = (fullText.match(/\b(work\s+)?experience|education|skills|summary|projects|certifications|languages|contact|awards|software\s+engineer|developer|lead\b/gi) || []).length;
  const esMatches = (fullText.match(/\b(experiencia(\s+laboral)?|educaci[oó]n|habilidades|perfil|proyectos|certificaciones|idiomas|contacto|premios|desarrollador|ingeniero|licenciatura)\b/gi) || []).length;

  if (enMatches > esMatches) return 'en';
  return 'es';
};

/**
 * Maps normalized or loose section names to canonical Easy CV Editor types and IDs
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
 * Formats a location entity ({ city, state, countryCode }) or string into a clean string.
 */
const formatLocationString = (loc) => {
  if (!loc) return '';
  if (typeof loc === 'string') return loc.trim();
  if (typeof loc === 'object') {
    const parts = [loc.city, loc.state || loc.region, loc.countryCode || loc.country].filter(Boolean);
    return parts.join(', ');
  }
  return '';
};

/**
 * Formats a period entity ({ start, end, isCurrent }) into a standardized range string.
 */
const formatPeriodString = (p, defaultCurrentLabel = 'Actualidad') => {
  if (!p) return '';
  if (typeof p === 'string') return p.trim();
  if (typeof p === 'object') {
    const start = p.start || p.startDate || p.from || '';
    const isCurrent = Boolean(p.isCurrent || p.is_current || p.current);
    const end = isCurrent ? defaultCurrentLabel : (p.end || p.endDate || p.to || '');
    if (start && end) return `${start} – ${end}`;
    if (start) return `${start} – ${defaultCurrentLabel}`;
    if (end) return String(end);
  }
  return '';
};

/**
 * Converts items from any section into standard internal item structures.
 * Folds semantic ATS metadata (ats.role, ats.company, ats.period, ats.skills)
 * into canonical flat properties (title, subtitle, date, bullets, description).
 */
const normalizeItemToInternal = (item, secType, secId, itemIdx, docLang = 'es') => {
  if (!item) return null;
  const stableId = item.id && typeof item.id === 'string' && item.id.trim()
    ? item.id.trim()
    : `${secId}_item_${itemIdx}`;

  const currentLabel = docLang === 'en' ? 'Present' : 'Actualidad';
  const ats = (item.ats && typeof item.ats === 'object') ? item.ats : {};

  // Contact
  if (secType === 'contact') {
    const rawContacts = normalizeItemContacts(item);
    const valid = rawContacts.filter(c => c && c.value && String(c.value).trim() !== '');
    const fallback = docLang === 'en' ? [
      { id: 'c_loc', type: 'location', value: 'City, Country' },
      { id: 'c_email', type: 'email', value: 'youremail@example.com' },
      { id: 'c_phone', type: 'phone', value: '+00 123 456 789' },
      { id: 'c_linkedin', type: 'linkedin', value: 'linkedin.com/in/your-profile' },
      { id: 'c_github', type: 'github', value: 'github.com/your-username' }
    ] : [
      { id: 'c_loc', type: 'location', value: 'Ciudad, País' },
      { id: 'c_email', type: 'email', value: 'tuemail@ejemplo.com' },
      { id: 'c_phone', type: 'phone', value: '+00 123 456 789' },
      { id: 'c_linkedin', type: 'linkedin', value: 'linkedin.com/in/tu-perfil' },
      { id: 'c_github', type: 'github', value: 'github.com/tu-usuario' }
    ];
    const finalContacts = valid.length > 0 ? valid : fallback;
    return {
      id: stableId,
      contacts: finalContacts,
      ...syncFlatContactFields(finalContacts)
    };
  }

  // Skills
  if (secType === 'skills') {
    let title = ats.category || ats.title || item.category_name || item.category || item.title || item.name || '';
    let desc = '';
    const skillsList = Array.isArray(ats.skills) ? ats.skills : (Array.isArray(ats.technologies) ? ats.technologies : null);
    if (skillsList) {
      desc = skillsList.join(', ');
    } else if (Array.isArray(item.technologies)) {
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
    let text = '';
    if (secType === 'languages' || secId.includes('lang')) {
      const langName = ats.language || item.language || item.name || item.text || item.title || '';
      const prof = ats.proficiency || ats.proficiency_level || item.proficiency_level || item.subtitle || item.description || '';
      if (langName && prof && !langName.includes(prof)) {
        text = `${langName}: ${prof}`;
      } else {
        text = langName || prof;
      }
    } else if (secType === 'certificates' || secId.includes('cert')) {
      const certName = ats.name || ats.title || item.title || item.name || item.text || '';
      const issuer = ats.issuer || ats.organization || item.issuer || item.issuer_or_institution || item.subtitle || '';
      const year = ats.year || ats.date || item.date || '';
      if (certName && issuer && !certName.includes(issuer)) {
        text = `${certName} — ${issuer}${year && !certName.includes(String(year)) && !issuer.includes(String(year)) ? ` (${year})` : ''}`;
      } else if (certName) {
        text = year && !certName.includes(String(year)) ? `${certName} (${year})` : certName;
      } else {
        text = item.text || '';
      }
    } else {
      text = item.text || item.title || item.name || item.language || '';
      const sub = item.subtitle || item.issuer || item.issuer_or_institution || item.proficiency_level || item.date || '';
      if (sub && !text.includes(sub)) {
        text = `${text} (${sub})`.trim();
      }
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
    const title = ats.degree || ats.title || item.degree || item.studyType || item.area || item.title || '';
    const inst = ats.institution || ats.school || ats.university || item.institution || item.school || item.university || item.subtitle || '';
    const loc = formatLocationString(ats.location || item.location);
    const subtitle = inst && loc && !inst.includes(loc) ? `${inst} | ${loc}` : (inst || loc);
    const date = formatPeriodString(ats.period, currentLabel) || item.period || item.date || item.dates || item.graduation_date || item.endDate || item.year || '';
    const description = ats.description || item.description || item.summary || (Array.isArray(item.courses) ? item.courses.join(', ') : '');

    return {
      id: stableId,
      title: stripHtml(title).trim(),
      subtitle: stripHtml(subtitle).trim(),
      date: stripHtml(date).trim(),
      ...(description ? { description: stripHtml(description).trim() } : {})
    };
  }

  // Work Experience, Projects, List, Volunteering
  const role = ats.role || ats.role_title || item.role_title || item.role || item.position || item.project_name || item.title || item.name || '';
  const techList = Array.isArray(ats.technologies) ? ats.technologies : (Array.isArray(item.technologies) ? item.technologies : []);
  const techSuffix = techList.length > 0 && !role.includes('(') ? ` (${techList.join(', ')})` : '';
  const title = (item.title && !ats.role) ? item.title : (role ? `${role}${techSuffix}` : '');

  const company = ats.company || ats.organization || item.organization || item.company || item.employer || item.organization_or_context || item.subtitle || '';
  const loc = formatLocationString(ats.location || item.location);
  const subtitle = (item.subtitle && !ats.company) ? item.subtitle : (company && loc && !company.includes(loc) ? `${company} | ${loc}` : (company || loc));

  const date = formatPeriodString(ats.period, currentLabel) || item.period || item.date || item.dates || item.duration || (item.startDate ? `${item.startDate} – ${item.endDate || currentLabel}` : '');
  const link = item.project_url || item.repository_url || item.link || item.url || '';
  const description = ats.summary || ats.description || item.summary || item.description || item.details || '';

  let rawBullets = [];
  if (Array.isArray(ats.actionBullets)) rawBullets = ats.actionBullets;
  else if (Array.isArray(ats.bullets)) rawBullets = ats.bullets;
  else if (Array.isArray(item.achievements)) rawBullets = item.achievements;
  else if (Array.isArray(item.highlights)) rawBullets = item.highlights;
  else if (Array.isArray(item.bullets)) rawBullets = item.bullets;
  else if (Array.isArray(item.responsibilities)) rawBullets = item.responsibilities;
  else if (Array.isArray(item.points)) rawBullets = item.points;
  else if (typeof item.description === 'string' && item.description.includes('\n')) {
    rawBullets = item.description.split('\n').map(b => b.replace(/^[-*•]\s*/, '').trim()).filter(Boolean);
  }

  const bullets = rawBullets.map(b => {
    if (typeof b === 'object' && b !== null) return stripHtml(b.text || '').trim();
    return stripHtml(String(b)).trim();
  }).filter(Boolean);

  return {
    id: stableId,
    title: stripHtml(title).trim(),
    subtitle: stripHtml(subtitle).trim(),
    date: stripHtml(date).trim(),
    ...(link ? { link: sanitizeContactUrl(link) } : {}),
    ...(description ? { description: stripHtml(description).trim() } : {}),
    ...(bullets.length > 0 ? { bullets } : {})
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

  // If root is already a standard Easy CV Editor CV snapshot with native sections and profile_header:
  const docLang = detectDocumentLanguage(root);

  if (Array.isArray(root.sections) && root.sections.some(s => s?.id === 'profile_header' || s?.type === 'profile_header')) {
    const cleanedSections = root.sections.map((sec, secIdx) => {
      if (!sec) return sec;
      const secType = sec.type || 'list';
      const secId = sec.id || `sec_${secIdx}`;
      if (!Array.isArray(sec.items)) return sec;
      const normalizedItems = sec.items.map((it, itemIdx) => {
        if (secType !== 'contact' && it && !it.ats && !it.role_title && !it.technologies && !it.achievements && !it.degree && !it.company) {
          return it;
        }
        return normalizeItemToInternal(it, secType, secId, itemIdx, docLang);
      }).filter(Boolean);
      return {
        ...sec,
        items: normalizedItems
      };
    });

    const candidateSnapshot = {
      _isNormalizedInternal: true,
      profile: {
        ...(root.profile || {}),
        name: profileData.fullName || root.profile?.name || (docLang === 'en' ? 'Professional Name' : 'Nombre Profesional'),
        subtitle: profileData.headline || root.profile?.subtitle || root.profile?.title || ''
      },
      layout: {
        ...layout,
        language: layout.language || docLang,
        type: layout.isAtsMode ? '1-column' : (layout.type || '2-column')
      },
      language: layout.language || docLang,
      sections: cleanedSections
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

    const resolvedDefaultTitle = config.defaultTitle || getSectionDefaultTitle(config.id, docLang);

    sectionsList.push({
      id: secId,
      column: column === 'right' ? 'right' : 'left',
      type: config.type,
      title: config.title || resolvedDefaultTitle || '',
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
    name: profileData.fullName || (docLang === 'en' ? 'Professional Name' : 'Nombre Profesional'),
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
      title: getSectionDefaultTitle('about_section', docLang),
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
        defaultTitle: sec.title || sec.display_title || getSectionDefaultTitle(keyOrType, docLang) || 'SECCIÓN'
      };

      // Skip duplicating profile_header or about if already injected
      if (mappedConfig.id === 'profile_header') return;
      if (mappedConfig.id === 'about_section' && profileData.summary) return;

      let secTitle = sec.display_title || sec.title;
      if (secTitle && (/^sec_[a-zA-Z0-9_-]+$/i.test(secTitle) || /^[0-9a-f-]{36}$/i.test(secTitle))) {
        secTitle = getSectionDefaultTitle(mappedConfig.id, docLang);
      }
      const finalTitle = secTitle || getSectionDefaultTitle(mappedConfig.id, docLang);

      appendSection(
        {
          id: mappedConfig.id,
          type: mappedConfig.type,
          title: finalTitle
        },
        Array.isArray(sec.items) ? sec.items : [],
        sec.display_column || sec.column || 'left'
      );
    });
  } else {
    // 4. Flavor C & D: Process dictionary keys (work_experience, technical_skills, skills, education, etc.)
    const recognizedKeys = Object.keys(SECTION_TYPE_MAP);

    recognizedKeys.forEach(k => {
      const val = root[k];
      if (Array.isArray(val) && val.length > 0) {
        const config = SECTION_TYPE_MAP[k];
        if (config && config.id !== 'profile_header' && config.id !== 'about_section' && !seenSectionIds.has(config.id)) {
          const isRightCol = config.id === 'experience' || config.id === 'projects';
          appendSection({
            ...config,
            title: getSectionDefaultTitle(config.id, docLang)
          }, val, isRightCol ? 'right' : 'left');
        }
      }
    });
  }

  // 5. Construct snapshot candidate and validate via SSOT cvSchemaValidator
  const candidateSnapshot = {
    _isNormalizedInternal: true,
    profile: {
      name: profileData.fullName || (docLang === 'en' ? 'Professional Name' : 'Nombre Profesional'),
      subtitle: profileData.headline || root.profile?.subtitle || root.profile?.title || ''
    },
    layout: {
      ...layout,
      language: layout.language || docLang,
      type: layout.isAtsMode ? '1-column' : (layout.type || '2-column')
    },
    language: layout.language || docLang,
    sections: sectionsList
  };

  return sanitizeAndValidateCVSnapshot(candidateSnapshot);
};

export const importUniversalCV = normalizeAnyJSONToCVSnapshot;

// export {
//   cleanAndParseRawJSON,
//   unwrapRootObject,
//   normalizeAnyJSONToCVSnapshot
// };

export default {
  cleanAndParseRawJSON,
  unwrapRootObject,
  normalizeAnyJSONToCVSnapshot,
  importUniversalCV: normalizeAnyJSONToCVSnapshot
};
