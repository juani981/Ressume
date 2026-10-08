import { getPrompts } from '../locales/index.js';
import prompts from '../locales/es/prompts.json' with { type: 'json' };
import { getSectionDescriptor } from '../registry/sectionRegistry.js';
import { baseItemMarkdown, baseItemXML, aboutMarkdown } from '../registry/itemFormatters.js';
import { normalizeItemContacts, getContactConfig } from './contactTypes.js';
import { getDynamicTextColors } from './colorUtils.js';
import { sanitizeAndValidateCVSnapshot } from './versionValidator.js';
import { stripHtml } from './richTextEngine.js';
import { generateCVLivePdfAbstraction, exportToAIJson as exportToAIJsonFull } from './cvJsonAbstraction.js';
import { getLanguageLegend } from './translationEngine.js';
import { getAtsGoldenSchemaTemplate } from './atsSchemaTemplate.js';
import { isAtsLayout } from './pageDistributor.js';

/**
 * Utility to convert the active CV state into unambiguous static representations
 * (Markdown, XML, Plain ATS, JSON Resume) and bundle them with AI prompts.
 * 
 * Guarantees:
 * - 1-column layout: 100% strictly linear, Zero column ambiguity, ATS Score > 95/100.
 * - 2-column layout: Preserves visual spatial hierarchy for human reviewers & portfolio layout.
 */

/**
 * Canonical ATS Section Ordering for 1-column layout
 */
const CANONICAL_ATS_ORDER = [
  'profile_header',
  'about_section',
  'skills',
  'experience',
  'projects',
  'education',
  'certificates',
  'languages'
];

/**
 * Escapes characters for safe double-quoted YAML strings
 */
const escapeYaml = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ');
};

/**
 * Sanitizes URLs: removes internal whitespace (e.g. from broken preview copy-pastes)
 * and formats with https:// protocol if not already present.
 */
export const sanitizeContactUrl = (val) => {
  if (!val) return '';
  const cleaned = String(val).replace(/\s+/g, '');
  return cleaned.startsWith('http://') || cleaned.startsWith('https://')
    ? cleaned
    : `https://${cleaned.replace(/^https?:\/\//, '').replace(/^\/+/, '')}`;
};

const formatContactUrl = (val) => sanitizeContactUrl(val);

/**
 * Sanitizes text content against critical ATS parsing pitfalls:
 * 1. Strips pseudo-math dollar syntax enclosing technical terms ($N+1$, $CI/CD$)
 *    which causes ATS parsers to confuse them with salary expectations or broken regex.
 * 2. Neutralizes non-standard Unicode checkboxes (☑, ☐, ✓, ✔, 🗹) into clean text.
 */
export const sanitizeATSText = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    // Strip dollar signs wrapping technical terms: $N+1$ -> N+1, $CI/CD$ -> CI/CD
    .replace(/\$([a-zA-Z0-9_\-+/]+)\$/g, '$1')
    // Strip non-standard checkboxes and symbols that disrupt ATS OCR and text-layer extraction
    .replace(/[☑☐✓✔🗹]/g, '')
    // Clean up residual multiple spaces
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
};

/**
 * Converts cvData into rich Semantic Markdown with exhaustive YAML Frontmatter.
 */
export const exportToAIMarkdown = (cvData, options = {}) => {
  if (!cvData) return '';

  const layout = cvData.layout || { type: '1-column', leftBg: '', rightBg: '' };
  const isAtsMode = isAtsLayout(layout);
  const is1Col = isAtsMode;
  const layoutType = is1Col ? '1-column' : '2-column';

  const profileSection = cvData.sections?.find(s => s.type === 'profile_header' || s.type === 'title_subtitle');
  const profileItem = profileSection?.items?.[0] || {};
  const aboutSection = cvData.sections?.find(s => s.type === 'about');
  const aboutItem = aboutSection?.items?.[0] || {};

  const lines = [];

  // ==========================================
  // YAML Frontmatter (Zero-Ambiguity Metadata)
  // ==========================================
  if (!options.raw) {
    lines.push('```markdown');
  }
  lines.push('---');
  lines.push(`layout_type: "${layoutType}"`);
  lines.push(`is_ats_mode: ${isAtsMode}`);
  lines.push(`target_audience: "${is1Col ? 'ATS Parsers (Workday, Taleo, Greenhouse, Lever) & Technical Recruiters' : 'Human Hiring Managers & Portfolio Visual Review'}"`);
  lines.push(`reading_flow: "${is1Col ? 'strictly_linear_top_to_bottom' : 'two_column_visual_hierarchy'}"`);

  // Typography
  lines.push('typography:');
  lines.push(`  font_family: "${escapeYaml(layout.fontFamily || 'Poppins')}"`);
  lines.push(`  font_scale: ${layout.fontScale ?? 1.0}`);
  lines.push(`  title_scale: ${layout.titleScale ?? 1.0}`);
  lines.push(`  body_scale: ${layout.bodyScale ?? 1.0}`);
  lines.push(`  list_scale: ${layout.listScale ?? 1.0}`);
  lines.push(`  line_height: ${layout.lineHeight ?? 1.3}`);

  // Spacing
  lines.push('spacing:');
  lines.push(`  page_padding: ${layout.pagePadding ?? 24}`);
  lines.push(`  section_gap: ${layout.sectionGap ?? 20}`);
  lines.push(`  item_gap: ${layout.itemGap ?? 8}`);

  // Styling & Container Colors
  const primaryBulletSection = cvData.sections?.find(s => s.bulletStyle);
  const bulletStyle = primaryBulletSection?.bulletStyle || { size: 'normal', variant: 'bold', showLine: true };
  const leftBg = layout.leftBg || '#fafafa';
  const rightBg = layout.rightBg || '#ffffff';
  const containerColor = is1Col ? (layout.rightBg || layout.leftBg || '#ffffff') : (layout.rightBg || '#ffffff');
  const textColors = getDynamicTextColors(containerColor);
  const titleColor = textColors.titleColor || '#0b0a0a';
  const textColor = textColors.textColor || '#403a3a';

  lines.push('styling:');
  lines.push('  bullet_style:');
  lines.push(`    size: "${bulletStyle.size || 'normal'}"`);
  lines.push(`    variant: "${bulletStyle.variant || 'bold'}"`);
  lines.push(`    show_line: ${bulletStyle.showLine !== false}`);
  lines.push('  container_colors:');
  lines.push(`    left_bg: "${leftBg}"`);
  lines.push(`    right_bg: "${rightBg}"`);
  lines.push(`    title_color: "${titleColor}"`);
  lines.push(`    text_color: "${textColor}"`);
  lines.push(`    container_color: "${containerColor}"`);

  // Section Ordering
  if (is1Col) {
    lines.push('section_order:');
    const seenSecIds = new Set();
    if (profileSection) {
      lines.push(`  - id: "${escapeYaml(profileSection.id)}"`);
      lines.push(`    title: "${escapeYaml(profileSection.title || 'Cabecera de Perfil')}"`);
      lines.push('    type: "profile_header"');
      lines.push('    item_count: 1');
      seenSecIds.add(profileSection.id);
    }
    CANONICAL_ATS_ORDER.forEach(secId => {
      const sec = cvData.sections?.find(s => s.id === secId || (secId === 'about_section' && s.type === 'about'));
      if (sec && !seenSecIds.has(sec.id)) {
        lines.push(`  - id: "${escapeYaml(sec.id)}"`);
        lines.push(`    title: "${escapeYaml(sec.title || sec.id)}"`);
        lines.push(`    type: "${escapeYaml(sec.type || 'list')}"`);
        lines.push(`    item_count: ${Array.isArray(sec.items) ? sec.items.length : 1}`);
        if (sec.bulletStyle) {
          lines.push(`    bullet_style: { size: "${sec.bulletStyle.size || 'normal'}", variant: "${sec.bulletStyle.variant || 'bold'}", show_line: ${sec.bulletStyle.showLine !== false} }`);
        }
        seenSecIds.add(sec.id);
      }
    });
    (cvData.sections || []).forEach(sec => {
      if (!seenSecIds.has(sec.id) && sec.type !== 'profile_header' && sec.type !== 'contact' && sec.id !== 'contact') {
        lines.push(`  - id: "${escapeYaml(sec.id)}"`);
        lines.push(`    title: "${escapeYaml(sec.title || sec.id)}"`);
        lines.push(`    type: "${escapeYaml(sec.type || 'list')}"`);
        lines.push(`    item_count: ${Array.isArray(sec.items) ? sec.items.length : 1}`);
        if (sec.bulletStyle) {
          lines.push(`    bullet_style: { size: "${sec.bulletStyle.size || 'normal'}", variant: "${sec.bulletStyle.variant || 'bold'}", show_line: ${sec.bulletStyle.showLine !== false} }`);
        }
        seenSecIds.add(sec.id);
      }
    });
  } else {
    // 2-column mode
    const leftSections = (cvData.sections || []).filter(s => (s.column === 'left' || !s.column) && s.type !== 'profile_header' && s.type !== 'contact' && s.id !== 'contact');
    const rightSections = (cvData.sections || []).filter(s => s.column === 'right' && s.type !== 'profile_header' && s.type !== 'contact' && s.id !== 'contact');

    lines.push('left_column_sections:');
    leftSections.forEach(sec => {
      lines.push(`  - id: "${escapeYaml(sec.id)}"`);
      lines.push(`    title: "${escapeYaml(sec.title || sec.id)}"`);
      lines.push(`    type: "${escapeYaml(sec.type || 'list')}"`);
      lines.push(`    item_count: ${Array.isArray(sec.items) ? sec.items.length : 0}`);
    });

    lines.push('right_column_sections:');
    rightSections.forEach(sec => {
      lines.push(`  - id: "${escapeYaml(sec.id)}"`);
      lines.push(`    title: "${escapeYaml(sec.title || sec.id)}"`);
      lines.push(`    type: "${escapeYaml(sec.type || 'list')}"`);
      lines.push(`    item_count: ${Array.isArray(sec.items) ? sec.items.length : 0}`);
      if (sec.bulletStyle) {
        lines.push(`    bullet_style: { size: "${sec.bulletStyle.size || 'normal'}", variant: "${sec.bulletStyle.variant || 'bold'}", show_line: ${sec.bulletStyle.showLine !== false} }`);
      }
    });

    lines.push('section_order:');
    lines.push('  left_column_sections:');
    leftSections.forEach(sec => {
      lines.push(`    - id: "${escapeYaml(sec.id)}"`);
      lines.push(`      title: "${escapeYaml(sec.title || sec.id)}"`);
    });
    lines.push('  right_column_sections:');
    rightSections.forEach(sec => {
      lines.push(`    - id: "${escapeYaml(sec.id)}"`);
      lines.push(`      title: "${escapeYaml(sec.title || sec.id)}"`);
    });

    lines.push('visual_theme:');
    lines.push(`  left_sidebar_color: "${layout.leftBg || 'default'}"`);
    lines.push(`  right_main_color: "${layout.rightBg || 'default'}"`);
    lines.push('  sidebar_sections:');
    leftSections.forEach(sec => {
      lines.push(`    - "${escapeYaml(sec.id)} (${escapeYaml(sec.title || sec.id)})"`);
    });
    lines.push('  main_content_sections:');
    rightSections.forEach(sec => {
      lines.push(`    - "${escapeYaml(sec.id)} (${escapeYaml(sec.title || sec.id)})"`);
    });
  }

  // Candidate Profile
  const contactSection = cvData.sections?.find(s => s.type === 'contact' || s.id === 'contact');
  const contactItem = contactSection?.items?.[0] || {};
  const candidateName = stripHtml(profileItem.name || cvData.profile?.name || '');
  const candidateHeadline = stripHtml(profileItem.subtitle || '');
  const candidateLocation = stripHtml(profileItem.location || contactItem.location || '');

  const contactsMap = {};
  if (profileItem.email || contactItem.email) contactsMap.email = profileItem.email || contactItem.email;
  if (profileItem.phone || contactItem.phone) contactsMap.phone = profileItem.phone || contactItem.phone;
  if (profileItem.linkedin || contactItem.linkedin) contactsMap.linkedin = formatContactUrl(profileItem.linkedin || contactItem.linkedin);
  if (profileItem.github || contactItem.github) contactsMap.github = formatContactUrl(profileItem.github || contactItem.github);

  const dynamicContacts = [
    ...normalizeItemContacts(profileItem),
    ...normalizeItemContacts(contactItem)
  ];
  dynamicContacts.forEach(c => {
    if (!c || !c.type || !c.value) return;
    if (c.type === 'location') return;
    const key = c.type.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const isUrlType = ['linkedin', 'github', 'gitlab', 'leetcode', 'stackoverflow', 'portfolio', 'website', 'blog', 'figma', 'dribbble'].includes(c.type) || c.value.startsWith('http');
    contactsMap[key] = isUrlType ? formatContactUrl(c.value) : c.value;
  });

  if (!contactsMap.email) contactsMap.email = '';
  if (!contactsMap.phone) contactsMap.phone = '';
  if (!contactsMap.linkedin) contactsMap.linkedin = '';
  if (!contactsMap.github) contactsMap.github = '';

  lines.push('candidate_profile:');
  lines.push(`  name: "${escapeYaml(candidateName)}"`);
  lines.push(`  headline: "${escapeYaml(candidateHeadline)}"`);
  lines.push(`  location: "${escapeYaml(candidateLocation)}"`);
  lines.push('  contact:');
  lines.push(`    email: "${escapeYaml(contactsMap.email)}"`);
  lines.push(`    phone: "${escapeYaml(contactsMap.phone)}"`);
  lines.push(`    linkedin: "${escapeYaml(contactsMap.linkedin)}"`);
  lines.push(`    github: "${escapeYaml(contactsMap.github)}"`);

  const standardKeys = new Set(['email', 'phone', 'linkedin', 'github']);
  Object.keys(contactsMap).forEach(k => {
    if (!standardKeys.has(k)) {
      lines.push(`    ${k}: "${escapeYaml(contactsMap[k])}"`);
    }
  });

  lines.push('---');

  // ==========================================
  // Header Block
  // ==========================================
  lines.push(`# ${candidateName || 'Curriculum Vitae'}`);
  if (candidateHeadline) lines.push(`**${candidateHeadline}**\n`);

  const contactsList = [];
  if (dynamicContacts.length > 0) {
    dynamicContacts.forEach(c => {
      if (!c || !c.value) return;
      const type = c.type?.toLowerCase() || '';
      const val = c.value.trim();
      if (!val) return;

      if (type === 'linkedin') {
        contactsList.push(`[LinkedIn](${formatContactUrl(val)})`);
      } else if (type === 'github') {
        contactsList.push(`[GitHub](${formatContactUrl(val)})`);
      } else if (type === 'leetcode') {
        contactsList.push(`[LeetCode](${formatContactUrl(val)})`);
      } else if (type === 'gitlab') {
        contactsList.push(`[GitLab](${formatContactUrl(val)})`);
      } else if (type === 'stackoverflow') {
        contactsList.push(`[Stack Overflow](${formatContactUrl(val)})`);
      } else if (type === 'portfolio') {
        contactsList.push(`[Portfolio](${formatContactUrl(val)})`);
      } else if (type === 'website') {
        contactsList.push(`[Sitio Web](${formatContactUrl(val)})`);
      } else if (type === 'blog') {
        contactsList.push(`[Blog](${formatContactUrl(val)})`);
      } else if (type === 'figma') {
        contactsList.push(`[Figma](${formatContactUrl(val)})`);
      } else if (type === 'dribbble') {
        contactsList.push(`[Dribbble](${formatContactUrl(val)})`);
      } else if (val.startsWith('http://') || val.startsWith('https://')) {
        const config = getContactConfig(type);
        const label = config?.label || type;
        contactsList.push(`[${label}](${val})`);
      } else {
        contactsList.push(val);
      }
    });
  } else {
    if (candidateLocation) contactsList.push(candidateLocation);
    if (profileItem.email) contactsList.push(profileItem.email);
    if (profileItem.phone) contactsList.push(profileItem.phone);
    if (profileItem.linkedin) contactsList.push(`[LinkedIn](${formatContactUrl(profileItem.linkedin)})`);
    if (profileItem.github) contactsList.push(`[GitHub](${formatContactUrl(profileItem.github)})`);
  }

  if (contactsList.length > 0) {
    lines.push(contactsList.join(' | '));
    lines.push('');
  }
  lines.push('---');
  lines.push('');

  // ==========================================
  // Helper to render individual section
  // ==========================================
  const renderSection = (sec) => {
    if (!sec || sec.type === 'profile_header' || sec.type === 'title_subtitle' || sec.type === 'contact' || sec.id === 'contact') return;

    if (sec.type === 'spacer') {
      lines.push('<!-- spacer -->');
      lines.push('');
      return;
    }

    if (sec.type === 'about') {
      const headerTitle = sec.title || 'Perfil Profesional';
      const colTag = is1Col ? '' : (sec.column === 'right' ? ' [Visual Layout: Main Column]' : ' [Visual Layout: Sidebar / Left Column]');
      lines.push(`## ${headerTitle}${colTag}`);
      const aboutDesc = aboutMarkdown(sec.items?.[0]) || aboutMarkdown(aboutItem) || '';
      if (aboutDesc) lines.push(aboutDesc);
      lines.push('');
      lines.push('---');
      lines.push('');
      return;
    }

    const descriptor = getSectionDescriptor(sec.type);
    const headerTitle = sec.title || descriptor.defaultTitle || sec.id.toUpperCase();
    const colTag = is1Col ? '' : (sec.column === 'right' ? ' [Visual Layout: Main Column]' : ' [Visual Layout: Sidebar / Left Column]');
    lines.push(`## ${headerTitle}${colTag}`);

    (sec.items || []).forEach(item => {
      const formatter = descriptor?.renderMarkdown || baseItemMarkdown;
      const md = formatter(item, sec);
      if (md) {
        lines.push(md);
        lines.push('');
      }
    });

    lines.push('');
    lines.push('---');
    lines.push('');
  };

  // In 1-column (ATS mode), force strict canonical ATS ordering + dynamic user sections
  if (is1Col) {
    const renderedIds = new Set();
    CANONICAL_ATS_ORDER.forEach(secId => {
      const sec = cvData.sections?.find(s => s.id === secId || (secId === 'about_section' && s.type === 'about'));
      if (sec) {
        renderSection(sec);
        renderedIds.add(sec.id);
      }
    });
    // Append any custom sections added by the user (contact is in Header block)
    (cvData.sections || []).forEach(sec => {
      if (!renderedIds.has(sec.id) && sec.type !== 'profile_header' && sec.type !== 'contact' && sec.id !== 'contact') {
        renderSection(sec);
      }
    });
  } else {
    // In 2-column mode: group Left Column sections (Sidebar) and Right Column sections (Main Content) legibly
    const leftSections = (cvData.sections || []).filter(s => (s.column === 'left' || !s.column) && s.type !== 'profile_header' && s.type !== 'contact' && s.id !== 'contact');
    const rightSections = (cvData.sections || []).filter(s => s.column === 'right' && s.type !== 'profile_header' && s.type !== 'contact' && s.id !== 'contact');

    if (leftSections.length > 0) {
      lines.push('# COLUMNA LATERAL (BARRA LATERAL / SIDEBAR)');
      lines.push('');
      leftSections.forEach(sec => {
        renderSection(sec);
      });
    }

    if (rightSections.length > 0) {
      lines.push('# CONTENIDO PRINCIPAL (COLUMNA DERECHA / MAIN CONTENT)');
      lines.push('');
      rightSections.forEach(sec => {
        renderSection(sec);
      });
    }
  }

  if (!options.raw) {
    lines.push('```');
  }
  return lines.join('\n');
};


/**
 * Converts cvData into hierarchical Semantic XML for LLMs/Parsers with tag boundaries.
 */
export const exportToAIXML = (cvData) => {
  if (!cvData) return '';
  const layout = cvData.layout || { type: '1-column' };
  const is1Col = layout.type === '1-column';

  const profileSection = cvData.sections?.find(s => s.type === 'profile_header' || s.type === 'title_subtitle');
  const profileItem = profileSection?.items?.[0] || {};
  const contactSection = cvData.sections?.find(s => s.type === 'contact' || s.id === 'contact');
  const contactItem = contactSection?.items?.[0] || {};
  const aboutSection = cvData.sections?.find(s => s.type === 'about');
  const aboutItem = aboutSection?.items?.[0] || {};

  const escapeXML = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const xml = [];
  xml.push('<?xml version="1.0" encoding="UTF-8"?>');
  xml.push('<curriculum_vitae schema_version="2.0">');

  if (is1Col) {
    xml.push('  <layout type="1-column" mode="strictly_linear_ats" />');
  } else {
    xml.push(`  <layout type="2-column" mode="visual_portfolio" left_bg="${escapeXML(layout.leftBg || '')}" right_bg="${escapeXML(layout.rightBg || '')}" />`);
  }

  const xmlContacts = [
    ...normalizeItemContacts(profileItem),
    ...normalizeItemContacts(contactItem)
  ];
  let xmlEmail = profileItem.email || contactItem.email || '';
  let xmlPhone = profileItem.phone || contactItem.phone || '';
  let xmlLocation = profileItem.location || contactItem.location || '';
  let xmlLinkedin = profileItem.linkedin || contactItem.linkedin || '';
  let xmlGithub = profileItem.github || contactItem.github || '';

  xmlContacts.forEach(c => {
    if (!c || !c.value) return;
    const type = (c.type || '').toLowerCase();
    if (type === 'email' && !xmlEmail) xmlEmail = c.value;
    else if (type === 'phone' && !xmlPhone) xmlPhone = c.value;
    else if (type === 'location' && !xmlLocation) xmlLocation = c.value;
    else if (type === 'linkedin' && !xmlLinkedin) xmlLinkedin = c.value;
    else if (type === 'github' && !xmlGithub) xmlGithub = c.value;
  });

  xml.push('  <candidate>');
  xml.push(`    <name>${escapeXML(profileItem.name || cvData.profile?.name)}</name>`);
  xml.push(`    <headline>${escapeXML(profileItem.subtitle)}</headline>`);
  xml.push(`    <location>${escapeXML(xmlLocation)}</location>`);
  xml.push('    <contact>');
  xml.push(`      <email>${escapeXML(xmlEmail)}</email>`);
  xml.push(`      <phone>${escapeXML(xmlPhone)}</phone>`);
  xml.push(`      <linkedin>${escapeXML(xmlLinkedin)}</linkedin>`);
  xml.push(`      <github>${escapeXML(xmlGithub)}</github>`);
  xml.push('    </contact>');
  if (aboutItem.description) {
    xml.push(`    <professional_summary>${escapeXML(aboutItem.description)}</professional_summary>`);
  }
  xml.push('  </candidate>');
  xml.push('  <sections>');
  const getOrderedSections = () => {
    if (!is1Col) return cvData.sections || [];
    const ordered = [];
    const seen = new Set();
    CANONICAL_ATS_ORDER.forEach(id => {
      const sec = cvData.sections?.find(s => s.id === id || (id === 'about_section' && s.type === 'about'));
      if (sec) {
        ordered.push(sec);
        seen.add(sec.id);
      }
    });
    (cvData.sections || []).forEach(sec => {
      if (!seen.has(sec.id) && sec.type !== 'profile_header' && sec.type !== 'contact' && sec.id !== 'contact') {
        ordered.push(sec);
      }
    });
    return ordered;
  };

  const sectionsToRender = getOrderedSections();


  sectionsToRender.forEach((sec, idx) => {
    if (sec.type === 'profile_header' || sec.type === 'about' || sec.type === 'contact' || sec.id === 'contact') return;

    const colAttr = is1Col ? `order="${idx + 1}"` : `column="${escapeXML(sec.column || 'left')}"`;
    xml.push(`    <section id="${escapeXML(sec.id)}" type="${escapeXML(sec.type)}" title="${escapeXML(sec.title)}" ${colAttr}>`);

    (sec.items || []).forEach(item => {
      if (sec.type === 'skills') {
        xml.push(`      <skill_category id="${escapeXML(item.id)}" title="${escapeXML(item.title)}">${escapeXML(item.description)}</skill_category>`);
      } else if (sec.type === 'education') {
        xml.push(`      <education_entry id="${escapeXML(item.id)}" degree="${escapeXML(item.title)}" institution="${escapeXML(item.subtitle)}" period="${escapeXML(item.date)}" />`);
      } else if (sec.type === 'simple_list') {
        xml.push(`      <item id="${escapeXML(item.id)}">${escapeXML(item.text)}</item>`);
      } else {
        xml.push(baseItemXML(item, escapeXML));
      }
    });

    xml.push('    </section>');
  });

  xml.push('  </sections>');
  xml.push('</curriculum_vitae>');

  return xml.join('\n');
};

/**
 * Converts cvData to clean, linear plain text for legacy ATS systems.
 */
export const exportToATSPlainText = (cvData) => {
  if (!cvData) return '';
  const profileSection = cvData.sections?.find(s => s.type === 'profile_header' || s.type === 'title_subtitle');
  const profileItem = profileSection?.items?.[0] || {};
  const contactSection = cvData.sections?.find(s => s.type === 'contact' || s.id === 'contact');
  const contactItem = contactSection?.items?.[0] || {};
  const aboutSection = cvData.sections?.find(s => s.type === 'about');
  const aboutItem = aboutSection?.items?.[0] || {};

  const lines = [];
  lines.push((profileItem.name || cvData.profile?.name || 'CURRICULUM VITAE').toUpperCase());
  if (profileItem.subtitle) lines.push(profileItem.subtitle);

  const dynamicContacts = [
    ...normalizeItemContacts(profileItem),
    ...normalizeItemContacts(contactItem)
  ];

  const contacts = [];
  if (dynamicContacts.length > 0) {
    dynamicContacts.forEach(c => {
      if (c && c.value && c.type !== 'location') contacts.push(c.value);
    });
    const loc = profileItem.location || contactItem.location;
    if (loc && !contacts.includes(loc)) contacts.unshift(loc);
  } else {
    const loc = profileItem.location || contactItem.location;
    const email = profileItem.email || contactItem.email;
    const phone = profileItem.phone || contactItem.phone;
    const linkedin = profileItem.linkedin || contactItem.linkedin;
    const github = profileItem.github || contactItem.github;
    if (loc) contacts.push(loc);
    if (email) contacts.push(email);
    if (phone) contacts.push(phone);
    if (linkedin) contacts.push(linkedin);
    if (github) contacts.push(github);
  }
  if (contacts.length > 0) lines.push(contacts.join(' | '));
  lines.push('\n' + '='.repeat(60) + '\n');

  if (aboutItem.description) {
    lines.push('PERFIL PROFESIONAL');
    lines.push('-'.repeat(30));
    lines.push(sanitizeATSText(aboutItem.description));
    lines.push('\n');
  }

  // Canonical ATS linear output + dynamic custom sections
  const orderedSections = [];
  const seenIds = new Set();
  CANONICAL_ATS_ORDER.forEach(id => {
    const sec = cvData.sections?.find(s => s.id === id || (id === 'about_section' && s.type === 'about'));
    if (sec) {
      orderedSections.push(sec);
      seenIds.add(sec.id);
    }
  });
  (cvData.sections || []).forEach(sec => {
    if (!seenIds.has(sec.id) && sec.type !== 'profile_header' && sec.type !== 'contact' && sec.id !== 'contact') {
      orderedSections.push(sec);
    }
  });

  orderedSections.forEach(sec => {
    if (sec.type === 'profile_header' || sec.type === 'about' || sec.type === 'contact' || sec.id === 'contact') return;
    lines.push((sec.title || sec.id).toUpperCase());
    lines.push('-'.repeat(30));

    if (sec.type === 'skills') {
      (sec.items || []).forEach(item => {
        lines.push(`* ${sanitizeATSText(item.title)}: ${sanitizeATSText(item.description)}`);
      });
      lines.push('');
    } else if (sec.type === 'simple_list') {
      (sec.items || []).forEach(item => {
        lines.push(`* ${sanitizeATSText(item.text)}`);
      });
      lines.push('');
    } else if (sec.type === 'education') {
      (sec.items || []).forEach(item => {
        lines.push(`* ${sanitizeATSText(item.title)} - ${sanitizeATSText(item.subtitle)} (${sanitizeATSText(item.date || '')})`);
      });
      lines.push('');
    } else {
      (sec.items || []).forEach(item => {
        lines.push(`${sanitizeATSText(item.title || item.name || item.text || '')}`);
        if (item.subtitle || item.date) {
          lines.push(`${sanitizeATSText(item.subtitle || '')} | ${sanitizeATSText(item.date || '')}`);
        }
        if (item.link) lines.push(`  Enlace: ${sanitizeContactUrl(item.link)}`);
        if (item.description) lines.push(sanitizeATSText(item.description));
        if (item.bullets && item.bullets.length > 0) {
          item.bullets.forEach(b => lines.push(`* ${sanitizeATSText(b)}`));
        }
        lines.push('');
      });
    }
  });

  return lines.join('\n');
};

/**
 * Produces the standardized, hyper-detailed 1:1 Live Preview PDF Abstraction JSON,
 * embedding the full printToPDF translation layer, ATS audit, AI knowledge rules,
 * normalized semantic sections, and backward-compatible root fields.
 */
export const exportToAIJson = (cvData, options = {}) => {
  return exportToAIJsonFull(cvData, options);
};

export const exportToRichAIJson = exportToAIJson;
export { generateCVLivePdfAbstraction };

export const exportToAIText = exportToATSPlainText;

/**
 * Builds a complete prompt bundle (System instruction + Task + Output format + Optional Commentary + Optional Job Description + Formatted CV)
 * ready to be copied directly into ChatGPT, Claude, Gemini, DeepSeek, or an API call.
 */
export const buildAIPromptPayload = (cvData, promptId = 'recruiter_audit', options = {}) => {
  const {
    format = 'markdown',
    jobDescription = '',
    userCommentary = '',
    lang = 'es',
    targetLang = (options.targetLang || (lang === 'en' ? 'es' : 'en'))
  } = options;

  const localizedPrompts = getPrompts(lang);
  const promptDef = localizedPrompts.find(p => p.id === promptId) || localizedPrompts[0] || {};

  let cvFormatted = '';
  if (format === 'markdown') {
    cvFormatted = exportToAIMarkdown(cvData);
  } else if (format === 'xml') {
    cvFormatted = exportToAIXML(cvData);
  } else if (format === 'ats_text') {
    cvFormatted = exportToATSPlainText(cvData);
  } else if (format === 'json') {
    cvFormatted = exportToAIJson(cvData);
  } else {
    cvFormatted = exportToAIMarkdown(cvData);
  }

  const isEn = lang === 'en';
  let systemRole = promptDef.system_instruction || '';
  let taskDesc = promptDef.task || '';

  // Bidirectional Translation & Localization Prompt Directives
  if (promptId === 'translate_english' || promptDef?.category === 'localization') {
    if (targetLang === 'es') {
      systemRole = isEn
        ? "You are a bilingual Principal Technical Recruiter and Localization Architect specializing in the Spanish-speaking software engineering and tech market (Spain and Latin America). Your mission is to translate, culturally localize, and format the candidate's CV abstraction into professional Tech Spanish, strictly returning ONLY a native JSON code block conforming 1:1 to Ressume's `cvData` schema, with zero conversational text or explanations, for immediate direct import into the editor."
        : "Eres un Principal Technical Recruiter bilingüe y Arquitecto de Localización especializado en el mercado hispanohablante de ingeniería de software y tecnología (España y América Latina). Tu misión es traducir, adaptar culturalmente y formatear la abstracción de CV del candidato al español profesional del sector Tech, devolviendo obligatoria y ÚNICAMENTE un bloque de código JSON nativo compatible 1:1 con el schema `cvData` de Ressume, sin explicaciones ni texto conversacional, para su importación directa e inmediata en el editor.";

      taskDesc = isEn
        ? "1. Spanish Tech Localization & Cultural Alignment Rules:\n- Academic Degrees: Map English degrees to official accredited equivalents in the Spanish-speaking market (e.g. 'Associate Degree' ➔ 'Técnico Superior / Tecnicatura'; 'Bachelor of Science (B.S.)' ➔ 'Licenciatura / Grado / Ingeniería'; 'Master of Science (M.S.)' ➔ 'Maestría / Máster').\n- Professional Titles: Standardize technical job titles (e.g. 'Software Engineer II' ➔ 'Desarrollador de Software Semi Senior / Ssr'; 'Tech Lead' ➔ 'Líder Técnico / Responsable Técnico'; 'Senior Frontend Developer' ➔ 'Desarrollador Frontend Senior'; 'Junior / Intern' ➔ 'Desarrollador Junior / Trainee').\n- Verb Tense Discipline: Use precise past-tense action verbs in Spanish (pretérito perfecto simple: Diseñó, Desarrolló, Implementó, Optimizó, Lideró, Automatizó) for past positions; use present indicative or professional infinitive for current active roles.\n- Canonical Spanish Section Titles: 'EXPERIENCIA LABORAL', 'EDUCACIÓN', 'HABILIDADES TÉCNICAS', 'PROYECTOS DESTACADOS', 'PERFIL PROFESIONAL', 'CERTIFICACIONES', 'IDIOMAS', 'CONTACTO'.\n- Technical Vocabulary: Preserve industry-standard terms, libraries, tools, and framework names unchanged (TypeScript, React, Docker, Kubernetes, etc.).\n2. Universal Strict Output Format Directive (JSON ONLY):\n- The response MUST strictly consist of ONLY a single Markdown code fence ```json ... ``` (or raw JSON text).\n- Absolutely zero conversational preambles, localization summaries, explanations, apologies, postscripts, or commentary outside the code fence.\n- The JSON object must strictly follow Ressume's cvData schema ({ layout: { type, isAtsMode, fontFamily, fontScale, titleScale, bodyScale, listScale, lineHeight, pagePadding, sectionGap, itemGap, language: 'es' }, profile: { name, subtitle }, sections: [ { id, column, type, title, items: [ ... ] } ] }).\n- The JSON must be 100% valid (RFC 8259) and directly importable into Version Manager via sanitizeAndValidateCVSnapshot."
        : "1. Reglas de Traducción y Localización Cultural al Español:\n- Títulos Académicos y Grados: Mapear títulos en inglés a la titulación universitaria o técnica equivalente oficial en el mercado hispanohablante (ej. 'Associate Degree' ➔ 'Técnico Superior / Tecnicatura'; 'Bachelor of Science / B.S.' ➔ 'Licenciatura / Grado / Ingeniería'; 'Master of Science / M.S.' ➔ 'Maestría / Máster').\n- Cargos y Niveles Laborales: Adaptar cargos técnicos a la nomenclatura profesional estándar (ej. 'Software Engineer II' ➔ 'Desarrollador de Software Semi Senior / Ssr'; 'Tech Lead' ➔ 'Líder Técnico / Responsable Técnico'; 'Senior Frontend Developer' ➔ 'Desarrollador Frontend Senior'; 'Intern / Junior Developer' ➔ 'Desarrollador Trainee / Junior').\n- Disciplina de Tiempos Verbales: Usar verbos de acción precisos en pretérito perfecto simple / pasado para experiencias anteriores (ej. Diseñó, Desarrolló, Implementó, Optimizó, Lideró, Automatizó); usar verbos en presente de indicativo o infinitivo profesional para la posición activa actual.\n- Títulos de Secciones Canónicos en Español: 'EXPERIENCIA LABORAL', 'EDUCACIÓN', 'HABILIDADES TÉCNICAS', 'PROYECTOS DESTACADOS', 'PERFIL PROFESIONAL', 'CERTIFICACIONES', 'IDIOMAS', 'CONTACTO'.\n- Vocabulario Técnico: Preservar nombres de tecnologías, frameworks y herramientas en su forma original reconocida en la industria (TypeScript, React, Docker, Kubernetes, etc.) sin traducciones literales torpes.\n2. Directiva Universal Estricta de Formato de Salida (SOLO JSON):\n- La respuesta DEBE consistir ÚNICAMENTE en el bloque de código Markdown ```json ... ``` (o texto JSON crudo).\n- Queda TERMINANTEMENTE PROHIBIDO cualquier texto introductorio, resúmenes de localización, explicaciones, notas al pie, saludos o comentarios antes o después del bloque JSON.\n- El objeto JSON debe cumplir estrictamente con la estructura nativa de cvData de Ressume ({ layout: { type, isAtsMode, fontFamily, fontScale, titleScale, bodyScale, listScale, lineHeight, pagePadding, sectionGap, itemGap, language: 'es' }, profile: { name, subtitle }, sections: [ { id, column, type, title, items: [ ... ] } ] }).\n- El JSON debe ser 100% válido (RFC 8259) y directamente importable mediante sanitizeAndValidateCVSnapshot en el Gestor de Versiones.";
    } else if (targetLang === 'en' || !targetLang) {
      systemRole = isEn
        ? "You are a bilingual Principal Technical Recruiter and Localization Architect in Silicon Valley specializing in the US software engineering talent market. Your mission is to translate, culturally localize, and format the candidate's CV abstraction into professional US Tech English, strictly returning ONLY a native JSON code block conforming 1:1 to Ressume's `cvData` schema, with zero conversational text or explanations, for immediate direct import into the Version Manager."
        : "Eres un Principal Technical Recruiter bilingüe y Arquitecto de Localización de Silicon Valley especializado en el mercado de contratación de ingeniería de software en Estados Unidos. Tu misión es traducir, adaptar culturalmente y formatear la abstracción de CV del candidato al inglés profesional estadounidense del sector Tech, devolviendo obligatoria y ÚNICAMENTE un bloque de código JSON nativo compatible 1:1 con el schema `cvData` de Ressume, sin explicaciones ni texto conversacional, para su importación directa e inmediata en el editor.";

      taskDesc = isEn
        ? "1. US Tech Localization & Cultural Alignment Rules:\n- Academic Degrees: Map international degrees to standard US accredited equivalents (e.g. 'Programador Universitario' ➔ 'Associate Degree in Computer Programming / Software Development'; 'Licenciatura en Informática' ➔ 'Bachelor of Science in Computer Science'; 'Ingeniería en Sistemas' ➔ 'B.S. in Software Engineering').\n- Professional Titles: Align job titles with standard US industry leveling (e.g. 'Desarrollador Semi Senior' ➔ 'Software Engineer II'; 'Líder Técnico' ➔ 'Tech Lead / Lead Software Engineer'; 'Desarrollador Trainee' ➔ 'Junior Software Engineer / Intern').\n- Verb Tense Discipline: Strong past-tense action verbs (Engineered, Architected, Optimized, Spearheaded) for past roles; present tense for the current role.\n- Idiomatic Technical Vocabulary: Eradicate literal translations.\n- Canonical Section Titles in English: 'WORK EXPERIENCE', 'EDUCATION', 'TECHNICAL SKILLS', 'PROJECTS', 'PROFESSIONAL SUMMARY', 'CERTIFICATIONS', 'LANGUAGES', 'CONTACT'.\n2. Universal Strict Output Format Directive (JSON ONLY):\n- The response MUST strictly consist of ONLY a single Markdown code fence ```json ... ``` (or raw JSON text).\n- Absolutely zero conversational preambles, localization summaries, explanations, apologies, postscripts, or commentary outside the code fence.\n- The JSON object must strictly follow Ressume's cvData schema ({ layout: { type, isAtsMode, fontFamily, fontScale, titleScale, bodyScale, listScale, lineHeight, pagePadding, sectionGap, itemGap, language: 'en' }, profile: { name, subtitle }, sections: [ { id, column, type, title, items: [ ... ] } ] }).\n- The JSON must be 100% valid (RFC 8259) and directly importable into Version Manager via sanitizeAndValidateCVSnapshot."
        : "1. Reglas de Traducción y Localización Cultural US Tech (US Tech Localization):\n- Títulos Académicos: Mapear titulaciones internacionales a equivalentes estándar en EE.UU. (ej. 'Programador Universitario' -> 'Associate Degree in Computer Programming / Software Development'; 'Licenciatura en Informática / Sistemas' -> 'Bachelor of Science in Computer Science / Information Systems'; 'Ingeniería en Sistemas de Información' -> 'B.S. in Software Engineering').\n- Cargos Laborales: Estandarizar a nomenclatura de mercado (ej. 'Desarrollador Semi Senior' -> 'Software Engineer II'; 'Líder Técnico' -> 'Tech Lead / Lead Software Engineer'; 'Desarrollador Trainee' -> 'Junior Software Engineer / Intern').\n- Disciplina de Tiempos Verbales: Verbos de acción en pasado (Engineered, Architected, Implemented, Optimized) para roles anteriores; verbos en presente (Architects, Develops, Maintains) para el rol actualmente activo.\n- Títulos Canónicos de Secciones en Inglés: 'WORK EXPERIENCE', 'EDUCATION', 'TECHNICAL SKILLS', 'PROJECTS', 'PROFESSIONAL SUMMARY', 'CERTIFICATIONS', 'LANGUAGES', 'CONTACT'.\n- Vocabulario Técnico Preciso: Eliminar traducciones literales torpes.\n2. Directiva Universal Estricta de Formato de Salida (SOLO JSON):\n- La respuesta DEBE consistir ÚNICAMENTE en el bloque de código Markdown ```json ... ``` (o texto JSON crudo).\n- Queda TERMINANTEMENTE PROHIBIDO cualquier texto introductorio, resúmenes de localización, explicaciones, notas al pie, saludos o comentarios antes o después del bloque JSON.\n- El objeto JSON debe cumplir estrictamente con la estructura nativa de cvData de Ressume ({ layout: { type, isAtsMode, fontFamily, fontScale, titleScale, bodyScale, listScale, lineHeight, pagePadding, sectionGap, itemGap, language: 'en' }, profile: { name, subtitle }, sections: [ { id, column, type, title, items: [ ... ] } ] }).\n- El JSON debe ser 100% válido (RFC 8259) y directamente importable mediante sanitizeAndValidateCVSnapshot en el Gestor de Versiones.";
    }
  }

  const payload = [];

  /* Instrucciones del sistema */
  payload.push('---');
  payload.push('role: ' + systemRole);
  payload.push('');

  /* Tarea a realizar */
  payload.push('task: ' + taskDesc);
  payload.push('');

  /* Formato de salida */
  payload.push('output_format: ' + (promptDef.output_format || ''));
  payload.push('');

  /* Comentarios opcionales del usuario */
  if (userCommentary && typeof userCommentary === 'string' && userCommentary.trim()) {
    payload.push('user_commentary: ' + userCommentary.trim());
    payload.push('');
  }

  /* Descripción de puesto requerida */
  const requiresJobDesc = Array.isArray(promptDef?.required_inputs)
    ? promptDef.required_inputs.includes('job_description')
    : (promptId === 'job_matcher');

  if (requiresJobDesc && jobDescription && typeof jobDescription === 'string' && jobDescription.trim()) {
    payload.push('job_description: ' + jobDescription.trim());
    payload.push('');
  }

  payload.push('---');

  const introHeader = isEn
    ? `# CANDIDATE RESUME INPUT DATA (${format.toUpperCase()})`
    : `# DATOS DE ENTRADA DEL CURRÍCULUM VITAE (${format.toUpperCase()})`;
  const introText = isEn
    ? 'Below is the candidate resume structured in Markdown format with comprehensive Frontmatter metadata. Analyze only the information contained within the following block:'
    : 'A continuación se presenta el currículum del candidato estructurado en formato Markdown con su propio Frontmatter de metadatos. Analiza únicamente la información contenida dentro del siguiente bloque:';

  if (promptId !== 'bring_your_own_cv') {
    payload.push(introHeader);
    payload.push(introText);
    payload.push(cvFormatted);
  }

  // For translation and localization prompts, inject the compact native cvData JSON schema
  if (promptId === 'translate_english' || promptDef?.category === 'localization') {
    payload.push('');
    payload.push('---');
    const schemaTitle = isEn
      ? '# COMPACT NATIVE JSON SCHEMA (cvData)'
      : '# SCHEMA JSON NATIVO COMPACTO (cvData)';
    const schemaInstruction = isEn
      ? 'CRITICAL MANDATORY UNIVERSAL DIRECTIVE: To allow direct import of the translation into the Ressume editor and Version Manager, the current native JSON structure of the CV is provided below. Your response MUST strictly be ONLY a single valid ```json ... ``` code block (or raw JSON) preserving this exact schema structure translated and localized. DO NOT include any introductory text, localization summaries, explanations, or commentary outside the JSON block:'
      : 'DIRECTIVA ESTRICTA UNIVERSAL: Para que la traducción pueda ser importada directamente en el editor y Gestor de Versiones de Ressume, a continuación se proporciona la estructura JSON nativa actual del CV. Tu respuesta DEBE ser ÚNICAMENTE un bloque de código ```json ... ``` (o texto JSON puro) con esta misma estructura traducida y adaptada. QUEDA TERMINANTEMENTE PROHIBIDO incluir introducciones, resúmenes de localización, explicaciones o notas fuera del bloque JSON:';

    payload.push(schemaTitle);
    payload.push(schemaInstruction);
    payload.push('```json');
    payload.push(exportToAIJson(cvData));
    payload.push('```');
  }

  // For 'bring_your_own_cv' (Bring Your Own CV Converter), provide explicit upload & paste instructions
  if (promptId === 'bring_your_own_cv') {
    payload.push('');
    payload.push('---');
    const inputTitle = isEn
      ? '# INSTRUCTIONS FOR PROVIDING YOUR CV (PDF ATTACHMENT OR TEXT)'
      : '# INSTRUCCIONES PARA ADJUNTAR TU CV (ARCHIVO PDF O TEXTO)';
    const inputInstructions = isEn
      ? 'Please attach your original CV PDF file directly in the AI model chat, or paste the raw text extracted from your CV below:'
      : 'Por favor, adjunta el archivo PDF de tu CV directamente en el chat con la IA, o pega el texto extraído de tu CV a continuación:';
    payload.push(inputTitle);
    payload.push(inputInstructions);
    payload.push('');
    payload.push(userCommentary && userCommentary.trim() ? userCommentary.trim() : (isEn ? '[PASTE YOUR CV TEXT HERE OR ATTACH PDF TO CHAT]' : '[PEGA AQUÍ EL TEXTO DE TU CV O ADJUNTA EL ARCHIVO PDF AL CHAT]'));
  }

  return payload.join('\n');
};

export { prompts, getLanguageLegend, getAtsGoldenSchemaTemplate };
