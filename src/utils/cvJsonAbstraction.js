/**
 * cvJsonAbstraction.js
 *
 * High-Fidelity 1:1 Live Preview PDF-to-JSON Abstraction Engine & Prompting Agent.
 *
 * Translates active CV editor state into a comprehensive, zero-ambiguity,
 * semantically rich JSON representation designed for Large Language Models (LLMs)
 * and Automated Tracking Systems (ATS).
 *
 * Key Invariants:
 * 1. Doubles semantic information density: integrates the full Print-To-PDF
 *    translation layer, physical A4 page distribution, typography scales,
 *    ATS sanitization audit, and AI knowledge rules (src/ai-knowledge/).
 * 2. Explicit Document Context: informs downstream LLMs beforehand that they are
 *    analyzing a contextualized 1:1 WYSIWYG abstraction of a live-rendered A4 PDF.
 * 3. Normalized Section & Metadata Names: strips cryptic internal random IDs,
 *    replacing them with standardized semantic keys and structured item fields.
 * 4. Deterministic & Idempotent: consecutive runs with identical data produce
 *    byte-for-byte stable and predictable JSON structures without drift.
 * 5. Full Backward Compatibility: maintains root profile, layout, and sections
 *    for immediate consumption by existing modules and test suites.
 */

import { distributeSectionsToPages } from './pageDistributor.js';
import { getDynamicTextColors } from './colorUtils.js';
import { normalizeItemContacts, getContactConfig } from './contactTypes.js';
import { sanitizeAndValidateCVSnapshot } from './cvSchemaValidator.js';
import { stripHtml } from './richTextEngine.js';
import ALL_RULES from '../ai-knowledge/index.js';
import { A4_PRINT_WIDTH_PX, A4_PAGE_HEIGHT_PX } from '../constants';

/**
 * Canonical ATS Section Ordering for strictly linear reading flow
 */
export const CANONICAL_ATS_ORDER = Object.freeze([
  'profile_header',
  'about_section',
  'skills',
  'experience',
  'projects',
  'education',
  'certificates',
  'languages',
  'awards',
  'volunteering',
  'publications'
]);

/**
 * Recognized action verbs for technical & executive CVs
 */
const ACTION_VERBS = new Set([
  // English Past & Present
  'architect', 'architected', 'accelerate', 'accelerated', 'build', 'built',
  'spearhead', 'spearheaded', 'lead', 'led', 'engineer', 'engineered',
  'design', 'designed', 'develop', 'developed', 'refactor', 'refactored',
  'optimize', 'optimized', 'streamline', 'streamlined', 'deploy', 'deployed',
  'implement', 'implemented', 'scale', 'scaled', 'automate', 'automated',
  'author', 'authored', 'orchestrate', 'orchestrated', 'mentor', 'mentored',
  'reduce', 'reduced', 'increase', 'increased', 'establish', 'established',
  'pioneer', 'pioneered', 'deliver', 'delivered', 'launch', 'launched',
  'formulate', 'formulated', 'unify', 'unified', 'overhaul', 'overhauled',
  // Spanish Past & Present
  'diseñó', 'diseña', 'desarrolló', 'desarrolla', 'lideró', 'lidera',
  'arquitectó', 'construyó', 'optimizó', 'optimiza', 'implementó', 'implementa',
  'refactorizó', 'redujo', 'incrementó', 'automatizó', 'desplegó', 'escaló',
  'coordinó', 'coordinó', 'encabezó', 'formuló', 'creó', 'crea'
]);

/**
 * Sanitizes URLs: removes whitespace, enforces https:// protocol.
 */
export const sanitizeContactUrl = (val) => {
  if (!val) return '';
  const cleaned = String(val).replace(/\s+/g, '');
  return cleaned.startsWith('http://') || cleaned.startsWith('https://')
    ? cleaned
    : `https://${cleaned.replace(/^https?:\/\//, '').replace(/^\/+/, '')}`;
};

/**
 * Normalizes arbitrary section keys into standard semantic section identifiers.
 */
export const normalizeSectionKey = (type, id, title = '') => {
  const normType = String(type || '').toLowerCase().trim();
  const normId = String(id || '').toLowerCase().trim();
  const normTitle = String(title || '').toLowerCase().trim();

  if (normType === 'profile_header' || normType === 'title_subtitle' || normId === 'profile_header') {
    return 'candidate_profile';
  }
  if (normType === 'about' || normId.includes('about') || normTitle.includes('perfil') || normTitle.includes('summary')) {
    return 'professional_summary';
  }
  if (normType === 'experience' || normId === 'experience' || normTitle.includes('experiencia') || normTitle.includes('experience') || normTitle.includes('laboral')) {
    return 'work_experience';
  }
  if (normType === 'skills' || normId === 'skills' || normTitle.includes('habilidades') || normTitle.includes('skills') || normTitle.includes('tecnologías')) {
    return 'skills_and_technologies';
  }
  if (normType === 'education' || normId === 'education' || normTitle.includes('educación') || normTitle.includes('education') || normTitle.includes('estudios')) {
    return 'education';
  }
  if (normType === 'projects' || normId === 'projects' || normTitle.includes('proyectos') || normTitle.includes('projects')) {
    return 'projects';
  }
  if (normType === 'certificates' || normType === 'certifications' || normId.includes('certif') || normTitle.includes('certifica')) {
    return 'certifications';
  }
  if (normType === 'languages' || normId === 'languages' || normTitle.includes('idiomas') || normTitle.includes('languages')) {
    return 'languages';
  }
  if (normType === 'awards' || normId === 'awards' || normTitle.includes('premios') || normTitle.includes('awards')) {
    return 'awards';
  }
  if (normType === 'volunteering' || normId === 'volunteering' || normTitle.includes('voluntariado')) {
    return 'volunteering';
  }
  if (normType === 'publications' || normId === 'publications' || normTitle.includes('publicaciones')) {
    return 'publications';
  }
  if (normType === 'contact' || normId === 'contact') {
    return 'contact_details';
  }
  if (normType === 'spacer') {
    return 'spacer';
  }

  // Fallback to sanitized type or id
  const raw = normId || normType || 'custom_section';
  return raw.replace(/[^a-z0-9_]/g, '_');
};

/**
 * Extracts and normalizes candidate personal profile and all contact channels.
 */
export const extractNormalizedProfile = (cvData) => {
  const sections = Array.isArray(cvData?.sections) ? cvData.sections : [];
  const profileSection = sections.find(s => s?.type === 'profile_header' || s?.type === 'title_subtitle' || s?.id === 'profile_header');
  const profileItem = profileSection?.items?.[0] || {};
  const contactSection = sections.find(s => s?.type === 'contact' || s?.id === 'contact');
  const contactItem = contactSection?.items?.[0] || {};
  const aboutSection = sections.find(s => s?.type === 'about' || s?.id === 'about_section');
  const aboutItem = aboutSection?.items?.[0] || {};

  const fullName = stripHtml(profileItem.name || cvData?.profile?.name || '').trim();
  const headline = stripHtml(profileItem.subtitle || '').trim();
  const location = stripHtml(profileItem.location || contactItem.location || '').trim();
  const summary = stripHtml(aboutItem.description || aboutItem.text || '').trim();

  // Aggregate and normalize all contact channels
  const dynamicContacts = [
    ...normalizeItemContacts(profileItem),
    ...normalizeItemContacts(contactItem)
  ];

  const contactChannels = {};
  if (profileItem.email || contactItem.email) contactChannels.email = (profileItem.email || contactItem.email).trim();
  if (profileItem.phone || contactItem.phone) contactChannels.phone = (profileItem.phone || contactItem.phone).trim();
  if (location) contactChannels.location = location;
  if (profileItem.linkedin || contactItem.linkedin) {
    contactChannels.linkedin = sanitizeContactUrl(profileItem.linkedin || contactItem.linkedin);
  }
  if (profileItem.github || contactItem.github) {
    contactChannels.github = sanitizeContactUrl(profileItem.github || contactItem.github);
  }

  dynamicContacts.forEach(c => {
    if (!c || !c.type || !c.value) return;
    const typeKey = c.type.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
    if (typeKey === 'location') {
      if (!contactChannels.location) contactChannels.location = c.value.trim();
      return;
    }
    const isUrl = ['linkedin', 'github', 'gitlab', 'leetcode', 'stackoverflow', 'portfolio', 'website', 'blog', 'figma', 'dribbble'].includes(c.type) || String(c.value).startsWith('http');
    contactChannels[typeKey] = isUrl ? sanitizeContactUrl(c.value) : c.value.trim();
  });

  return {
    full_name: fullName,
    headline,
    location,
    professional_summary: summary,
    contact_channels: contactChannels
  };
};

/**
 * Detects whether a bullet point contains measurable metrics (Google XYZ formula).
 */
const detectMetricsInText = (text) => {
  if (!text || typeof text !== 'string') return false;
  // Match percentages (e.g. 30%), multiplier (e.g. 10x, 2X), numbers followed by k/M/B/events/users/ms/s
  return /\b\d+(?:[.,]\d+)?\s*(?:%|x|X|k|K|M|B|ms|s|sec|users|req\/s|events|queries|consultas|millones|mil)\b/.test(text) ||
         /\b\d{2,}\b/.test(text) ||
         /\$\d+/.test(text);
};

/**
 * Detects strong action verbs in bullet points.
 */
const extractActionVerbsFromText = (text) => {
  if (!text || typeof text !== 'string') return [];
  const words = text.toLowerCase().replace(/[^a-záéíóúñü\s]/g, ' ').split(/\s+/);
  const found = new Set();
  words.forEach(w => {
    if (ACTION_VERBS.has(w)) found.add(w);
  });
  return Array.from(found);
};

/**
 * Parses and audits ATS compliance and extracts AI Knowledge suggestions.
 */
export const analyzeCVWithATSKnowledge = (cvData, layout, isAtsMode) => {
  const sections = Array.isArray(cvData?.sections) ? cvData.sections : [];
  const profileInfo = extractNormalizedProfile(cvData);

  // 1. Audit Text Content for ATS Pitfalls
  let pseudoMathCount = 0;
  let disruptiveOcrSymbolsCount = 0;
  let totalBullets = 0;
  let bulletsWithMetrics = 0;
  let bulletsWithActionVerbs = 0;
  const allActionVerbs = new Set();
  let totalExperienceItems = 0;

  sections.forEach(sec => {
    const items = Array.isArray(sec.items) ? sec.items : [];
    if (sec.type === 'experience' || sec.type === 'list' || sec.id === 'experience') {
      totalExperienceItems += items.length;
    }

    items.forEach(it => {
      const textsToScan = [
        it.title,
        it.subtitle,
        it.description,
        ...(Array.isArray(it.bullets) ? it.bullets : [])
      ].filter(Boolean);

      textsToScan.forEach(t => {
        const mathMatches = String(t).match(/\$([a-zA-Z0-9_\-+/]+)\$/g);
        if (mathMatches) pseudoMathCount += mathMatches.length;

        const ocrMatches = String(t).match(/[☑☐✓✔🗹]/g);
        if (ocrMatches) disruptiveOcrSymbolsCount += ocrMatches.length;
      });

      if (Array.isArray(it.bullets)) {
        it.bullets.forEach(b => {
          totalBullets++;
          const cleanB = stripHtml(b);
          if (detectMetricsInText(cleanB)) bulletsWithMetrics++;
          const verbs = extractActionVerbsFromText(cleanB);
          if (verbs.length > 0) {
            bulletsWithActionVerbs++;
            verbs.forEach(v => allActionVerbs.add(v));
          }
        });
      }
    });
  });

  // 2. Contact Completeness Audit
  const contacts = profileInfo.contact_channels;
  const hasName = Boolean(profileInfo.full_name);
  const hasEmail = Boolean(contacts.email);
  const hasPhone = Boolean(contacts.phone);
  const hasLocation = Boolean(profileInfo.location);
  const hasLinkedin = Boolean(contacts.linkedin);
  const hasGithub = Boolean(contacts.github);

  const missingContacts = [];
  if (!hasEmail) missingContacts.push('email');
  if (!hasPhone) missingContacts.push('phone');
  if (!hasLocation) missingContacts.push('location');
  if (!hasLinkedin) missingContacts.push('linkedin');

  // 3. Section Sequence Compliance (in 1-col ATS mode)
  const currentSectionIds = sections.map(s => s.id);
  const canonicalPresent = CANONICAL_ATS_ORDER.filter(id => currentSectionIds.includes(id));
  const isCanonicalOrdered = canonicalPresent.every((id, idx) => {
    if (idx === 0) return true;
    const prevIdx = currentSectionIds.indexOf(canonicalPresent[idx - 1]);
    const currIdx = currentSectionIds.indexOf(id);
    return currIdx > prevIdx;
  });

  // 4. Calculate ATS Compatibility Score (0 - 100)
  let score = 0;
  // Layout suitability (Max 25 pts)
  if (isAtsMode) score += 25;
  else score += 15;

  // Contact completeness (Max 20 pts)
  if (hasName) score += 5;
  if (hasEmail) score += 5;
  if (hasPhone) score += 4;
  if (hasLocation) score += 3;
  if (hasLinkedin) score += 3;

  // Text Hygiene (Max 15 pts)
  if (pseudoMathCount === 0) score += 8;
  if (disruptiveOcrSymbolsCount === 0) score += 7;

  // Impact Metrics & Verbs (Max 25 pts)
  if (totalBullets > 0) {
    const metricRatio = bulletsWithMetrics / totalBullets;
    const verbRatio = bulletsWithActionVerbs / totalBullets;
    score += Math.round(metricRatio * 15);
    score += Math.round(verbRatio * 10);
  } else {
    score += 10;
  }

  // Structure & Skills (Max 15 pts)
  const hasSkills = sections.some(s => s.type === 'skills' || s.id === 'skills');
  const hasExp = totalExperienceItems > 0;
  const hasEdu = sections.some(s => s.type === 'education' || s.id === 'education');
  if (hasSkills) score += 5;
  if (hasExp) score += 5;
  if (hasEdu) score += 5;

  score = Math.min(100, Math.max(0, score));

  // 5. Query Relevant AI Knowledge Base Rules from src/ai-knowledge/
  const targetLayoutKey = isAtsMode ? 'ATS_1_col' : 'Human_2_col';
  const relevantRules = ALL_RULES.filter(rule => {
    const matchLayout = rule.target_layout === targetLayoutKey || rule.target_layout === 'both';
    const matchSection = rule.target_section === 'global' || sections.some(s => s.type === rule.target_section || s.id === rule.target_section);
    return matchLayout && matchSection;
  }).slice(0, 10).map(r => ({
    id: r.id,
    target_section: r.target_section,
    severity: r.severity,
    suggestion_title: r.suggestion_title,
    suggestion_body: r.suggestion_body
  }));

  return {
    ats_compatibility_score: score,
    ats_readiness_level: score >= 90 ? 'OPTIMAL' : (score >= 75 ? 'GOOD' : 'NEEDS_IMPROVEMENT'),
    canonical_ats_sequence: Array.from(CANONICAL_ATS_ORDER),
    canonical_order_compliance: isCanonicalOrdered,
    sanitization_audit: {
      pseudo_math_dollars_found: pseudoMathCount,
      disruptive_ocr_symbols_found: disruptiveOcrSymbolsCount,
      clean_contact_urls: true
    },
    contact_completeness: {
      has_name: hasName,
      has_email: hasEmail,
      has_phone: hasPhone,
      has_location: hasLocation,
      has_linkedin: hasLinkedin,
      has_github: hasGithub,
      missing_recommended_channels: missingContacts
    },
    content_metrics: {
      total_sections: sections.length,
      total_experience_items: totalExperienceItems,
      total_bullets: totalBullets,
      bullets_with_xyz_formula: bulletsWithMetrics,
      bullets_with_action_verbs: bulletsWithActionVerbs,
      action_verbs_detected: Array.from(allActionVerbs)
    },
    active_knowledge_rules: relevantRules
  };
};

/**
 * Extracts and maps sections into clean, normalized semantic structures without cryptic IDs.
 */
export const extractNormalizedSections = (cvData, pageModels = []) => {
  const sections = Array.isArray(cvData?.sections) ? cvData.sections : [];

  // Build section to page mapping
  const sectionPageMap = new Map();
  pageModels.forEach(page => {
    const allPageSections = [
      ...(page.singleSections || []),
      ...(page.leftSections || []),
      ...(page.rightSections || [])
    ];
    allPageSections.forEach(s => {
      const origId = s.originalSectionId || s.id;
      if (!sectionPageMap.has(origId)) {
        sectionPageMap.set(origId, page.pageNumber);
      }
    });
  });

  return sections
    .filter(sec => sec && sec.type !== 'spacer')
    .map(sec => {
      const normKey = normalizeSectionKey(sec.type, sec.id, sec.title);
      const assignedPage = sectionPageMap.get(sec.id) || 1;
      const col = sec.column === 'right' ? 'right' : 'left';

      // Normalize items
      const items = (Array.isArray(sec.items) ? sec.items : []).map(item => {
        if (!item) return {};

        if (sec.type === 'skills') {
          const rawDesc = stripHtml(item.description || '');
          const techList = rawDesc.split(/[,;|•\n]+/).map(t => t.trim()).filter(Boolean);
          return {
            category_name: stripHtml(item.title || 'General').trim(),
            technologies: techList,
            raw_content: rawDesc
          };
        }

        if (sec.type === 'education') {
          return {
            degree: stripHtml(item.title || '').trim(),
            institution: stripHtml(item.subtitle || '').trim(),
            location: stripHtml(item.location || '').trim(),
            period: stripHtml(item.date || '').trim(),
            description: stripHtml(item.description || '').trim()
          };
        }

        if (sec.type === 'experience' || sec.type === 'list') {
          const bullets = (Array.isArray(item.bullets) ? item.bullets : []).map(b => stripHtml(b).trim()).filter(Boolean);
          const hasMetrics = bullets.some(b => detectMetricsInText(b));
          const verbs = new Set();
          bullets.forEach(b => extractActionVerbsFromText(b).forEach(v => verbs.add(v)));

          return {
            role_title: stripHtml(item.title || '').trim(),
            organization: stripHtml(item.subtitle || '').trim(),
            location: stripHtml(item.location || '').trim(),
            period: stripHtml(item.date || '').trim(),
            link: sanitizeContactUrl(item.link || ''),
            summary: stripHtml(item.description || '').trim(),
            achievements: bullets,
            has_metrics: hasMetrics,
            detected_action_verbs: Array.from(verbs)
          };
        }

        if (sec.type === 'projects') {
          const bullets = (Array.isArray(item.bullets) ? item.bullets : []).map(b => stripHtml(b).trim()).filter(Boolean);
          return {
            project_name: stripHtml(item.title || '').trim(),
            organization_or_context: stripHtml(item.subtitle || '').trim(),
            period: stripHtml(item.date || '').trim(),
            project_url: sanitizeContactUrl(item.link || ''),
            description: stripHtml(item.description || '').trim(),
            highlights: bullets
          };
        }

        if (sec.type === 'languages') {
          return {
            language: stripHtml(item.text || item.title || '').trim(),
            proficiency_level: stripHtml(item.subtitle || item.description || '').trim()
          };
        }

        if (sec.type === 'certificates') {
          return {
            title: stripHtml(item.text || item.title || '').trim(),
            issuer_or_institution: stripHtml(item.subtitle || '').trim(),
            date: stripHtml(item.date || '').trim(),
            credential_url: sanitizeContactUrl(item.link || '')
          };
        }

        if (sec.type === 'about') {
          return {
            description: stripHtml(item.description || item.text || '').trim()
          };
        }

        // Generic / Custom section item
        const baseObj = {
          title: stripHtml(item.title || item.name || item.text || '').trim()
        };
        if (item.subtitle) baseObj.subtitle = stripHtml(item.subtitle).trim();
        if (item.date) baseObj.date = stripHtml(item.date).trim();
        if (item.link) baseObj.link = sanitizeContactUrl(item.link);
        if (item.description) baseObj.description = stripHtml(item.description).trim();
        if (Array.isArray(item.bullets) && item.bullets.length > 0) {
          baseObj.bullets = item.bullets.map(b => stripHtml(b).trim()).filter(Boolean);
        }
        return baseObj;
      });

      return {
        section_key: normKey,
        display_title: sec.title || normKey,
        display_column: col,
        assigned_page: assignedPage,
        items
      };
    });
};

/**
 * Builds the physical page layout translation layer using pure deterministic distributor.
 */
export const generatePhysicalPageLayout = (cvData, options = {}) => {
  const layout = cvData?.layout || {};
  const isAts = Boolean(options.mode === '1-column' || options.mode === 'ats' || layout.isAtsMode === true || layout.type === '1-column');
  const pageModels = distributeSectionsToPages(cvData, {
    ...options,
    isAtsMode: isAts,
    mode: isAts ? '1-column' : '2-column'
  });

  const dynamicColors = getDynamicTextColors(layout.rightBg || layout.leftBg || '#ffffff');
  const leftColPercent = layout.leftColumnWidth || (isAts ? 100 : 33.33);

  const pageDistribution = pageModels.map(page => {
    const singleSecs = (page.singleSections || []).map(s => s.title || s.id);
    const leftSecs = (page.leftSections || []).map(s => s.title || s.id);
    const rightSecs = (page.rightSections || []).map(s => s.title || s.id);
    const totalItems = [
      ...(page.singleSections || []),
      ...(page.leftSections || []),
      ...(page.rightSections || [])
    ].reduce((sum, s) => sum + (Array.isArray(s.items) ? s.items.length : 0), 0);

    return {
      page_number: page.pageNumber,
      is_last_page: page.isLastPage,
      total_items_on_page: totalItems,
      ...(isAts ? { single_column_sections: singleSecs } : { left_column_sections: leftSecs, right_column_sections: rightSecs })
    };
  });

  return {
    pageModels,
    physicalLayoutData: {
      standard: 'ISO 216 A4',
      dimensions_mm: { width: 210, height: 297 },
      dimensions_px: { width: A4_PRINT_WIDTH_PX, height: A4_PAGE_HEIGHT_PX, scale: 1.0 },
      layout_type: isAts ? '1-column' : '2-column',
      is_ats_mode: isAts,
      reading_flow: isAts ? 'strictly_linear_top_to_bottom' : 'two_column_visual_hierarchy',
      total_pages: pageModels.length,
      columns: {
        count: isAts ? 1 : 2,
        left_column_ratio_percent: leftColPercent,
        right_column_ratio_percent: isAts ? 0 : +(100 - leftColPercent).toFixed(2)
      },
      typography: {
        font_family: layout.fontFamily || 'Poppins',
        font_scale: layout.fontScale ?? 1.0,
        title_scale: layout.titleScale ?? 1.0,
        body_scale: layout.bodyScale ?? 1.0,
        list_scale: layout.listScale ?? 1.0,
        line_height: layout.lineHeight ?? 1.3
      },
      spacing_and_geometry: {
        page_padding_px: layout.pagePadding ?? 24,
        section_gap_px: layout.sectionGap ?? 20,
        item_gap_px: layout.itemGap ?? 8
      },
      color_palette: {
        left_sidebar_background: layout.leftBg || '#fafafa',
        right_main_background: layout.rightBg || '#ffffff',
        title_color: dynamicColors.titleColor || '#0b0a0a',
        text_color: dynamicColors.textColor || '#403a3a',
        container_color: dynamicColors.containerColor || '#ffffff'
      },
      page_distribution: pageDistribution
    }
  };
};

/**
 * Generates the formal JSON schema contract for downstream LLMs.
 */
export const generateSchemaContractForLLM = () => {
  return {
    contract_version: '3.0',
    contract_purpose: 'Deterministic 1-click import into Ressume Editor and Version Manager',
    idempotence_invariant: 'All repeated translations or prompt runs must return this exact JSON schema. Zero information loss.',
    accepted_root_structure: {
      candidate_profile: {
        full_name: 'string (required)',
        headline: 'string (optional)',
        location: 'string (optional)',
        professional_summary: 'string (optional)',
        contact_channels: {
          email: 'string',
          phone: 'string',
          linkedin: 'url',
          github: 'url',
          portfolio: 'url'
        }
      },
      layout: {
        type: "'1-column' | '2-column'",
        is_ats_mode: 'boolean',
        font_family: "'Poppins' | 'Inter' | 'Roboto' | 'Merriweather' | 'JetBrains Mono'"
      },
      sections: [
        {
          section_key: "'work_experience' | 'skills_and_technologies' | 'education' | 'projects' | 'certifications' | 'languages' | 'awards' | 'custom'",
          title: 'string',
          column: "'left' | 'right'",
          items: 'array of objects matching section_key schema'
        }
      ]
    }
  };
};

/**
 * Generates the complete, high-fidelity 1:1 Live Preview PDF-to-JSON Abstraction.
 */
export const generateCVLivePdfAbstraction = (cvData, options = {}) => {
  const validated = sanitizeAndValidateCVSnapshot(cvData);
  const layout = validated.layout || {};
  const isAts = Boolean(options.mode === '1-column' || options.mode === 'ats' || layout.isAtsMode === true || layout.type === '1-column');

  // 1. Generate Physical Layout and Page Distribution
  const { pageModels, physicalLayoutData } = generatePhysicalPageLayout(validated, {
    ...options,
    isAtsMode: isAts,
    mode: isAts ? '1-column' : '2-column'
  });

  // 2. Extract Candidate Profile & Contacts
  const candidateProfile = extractNormalizedProfile(validated);

  // 3. Analyze ATS Compliance & AI Knowledge Rules
  const atsAndKnowledge = analyzeCVWithATSKnowledge(validated, layout, isAts);

  // 4. Extract Normalized Sections
  const normalizedSections = extractNormalizedSections(validated, pageModels);

  // 5. Schema Contract for LLMs
  const schemaContract = generateSchemaContractForLLM();

  // 6. Build Contextual System Preamble
  const documentContext = {
    is_live_preview_pdf_abstraction: true,
    schema_version: '3.0',
    description: 'Contextualized, deterministic 1:1 abstraction of an active CV/Resume rendered in the Ressume live preview and print-to-PDF engine.',
    wysiwyg_print_parity: 'What You See Is What You Get: Exact visual, structural, and physical page-budget mirroring of the printed A4 PDF.',
    system_notice: 'You are reading a contextualized, deterministic 1:1 abstraction of a PDF currently in live preview in the Ressume CV editor. All content, sections, physical page assignments, layout bounds, and ATS compliance factors correspond strictly to the printed PDF output. Any JSON modification or translation output you generate must adhere strictly to the schema_contract defined below so that it can be imported into the Ressume editor with 100% idempotence and zero data loss.',
    rendering_engine: 'Ressume Deterministic Page Distributor & Print Engine',
    locale: options.lang || 'es',
    total_physical_pages: physicalLayoutData.total_pages,
    is_ats_mode: isAts,
    generated_at: options.timestamp || '2026-09-28T00:00:00.000Z'
  };

  // Build complete, backwards-compatible, hyper-detailed JSON object
  return {
    document_context: documentContext,
    candidate_profile: candidateProfile,
    physical_page_layout: physicalLayoutData,
    ats_and_ai_knowledge: atsAndKnowledge,
    normalized_sections: normalizedSections,
    schema_contract_for_llm_import: schemaContract,

    // Backward-compatibility properties guaranteed for existing tests and Version Manager:
    profile: {
      name: candidateProfile.full_name || validated.profile?.name || ''
    },
    layout: {
      type: physicalLayoutData.layout_type,
      isAtsMode: physicalLayoutData.is_ats_mode,
      fontFamily: physicalLayoutData.typography.font_family,
      fontScale: physicalLayoutData.typography.font_scale,
      titleScale: physicalLayoutData.typography.title_scale,
      bodyScale: physicalLayoutData.typography.body_scale,
      listScale: physicalLayoutData.typography.list_scale,
      lineHeight: physicalLayoutData.typography.line_height,
      pagePadding: physicalLayoutData.spacing_and_geometry.page_padding_px,
      sectionGap: physicalLayoutData.spacing_and_geometry.section_gap_px,
      itemGap: physicalLayoutData.spacing_and_geometry.item_gap_px,
      leftBg: layout.leftBg || '',
      rightBg: layout.rightBg || '',
      leftColumnWidth: layout.leftColumnWidth || null
    },
    sections: (validated.sections || []).map(sec => ({
      id: sec.id,
      column: sec.column || 'left',
      type: sec.type || 'list',
      title: sec.title || '',
      ...(sec.bulletStyle ? { bulletStyle: sec.bulletStyle } : {}),
      items: (sec.items || []).map(item => ({ ...item }))
    }))
  };
};

/**
 * Enhanced exportToAIJson: Produces the standardized, idempotent, hyper-detailed
 * JSON abstraction string ready for LLMs, download, or direct re-import.
 */
export const exportToAIJson = (cvData, options = {}) => {
  if (!cvData) return '{}';
  const abstraction = generateCVLivePdfAbstraction(cvData, options);
  if (options.rawObject) return abstraction;
  return JSON.stringify(abstraction, null, 2);
};

export default {
  generateCVLivePdfAbstraction,
  exportToAIJson,
  normalizeSectionKey,
  extractNormalizedProfile,
  extractNormalizedSections,
  analyzeCVWithATSKnowledge,
  generatePhysicalPageLayout,
  generateSchemaContractForLLM,
  CANONICAL_ATS_ORDER,
  sanitizeContactUrl
};
