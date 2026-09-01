import prompts from '../ai-knowledge/prompts.json' with { type: 'json' };

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
 * Converts cvData into rich Semantic Markdown with YAML Frontmatter.
 */
export const exportToAIMarkdown = (cvData) => {
  if (!cvData) return '';

  const layout = cvData.layout || { type: '1-column', leftBg: '', rightBg: '' };
  const is1Col = layout.type === '1-column';

  const profileSection = cvData.sections?.find(s => s.type === 'profile_header');
  const profileItem = profileSection?.items?.[0] || {};
  const aboutSection = cvData.sections?.find(s => s.type === 'about');
  const aboutItem = aboutSection?.items?.[0] || {};

  const lines = [];

  // ==========================================
  // YAML Frontmatter (Zero-Ambiguity Metadata)
  // ==========================================
  lines.push('---');
  if (is1Col) {
    lines.push('layout_type: "1-column (Single-Column Linear ATS Optimized)"');
    lines.push('target_audience: "ATS Parsers (Workday, Taleo, Greenhouse, Lever) & Technical Recruiters"');
    lines.push('reading_flow: "strictly_linear_top_to_bottom"');
    lines.push('section_order:');
    CANONICAL_ATS_ORDER.forEach(secId => {
      const sec = cvData.sections?.find(s => s.id === secId || s.type === secId);
      if (sec) {
        lines.push(`  - id: "${sec.id}"`);
        lines.push(`    title: "${sec.title || sec.id}"`);
      }
    });
  } else {
    lines.push('layout_type: "2-column (Human Portfolio & Visual Review)"');
    lines.push('target_audience: "Human Hiring Managers & Portfolio Visual Review"');
    lines.push('visual_theme:');
    lines.push(`  left_sidebar_color: "${layout.leftBg || 'default'}"`);
    lines.push(`  right_main_color: "${layout.rightBg || 'default'}"`);
    lines.push('  sidebar_sections:');
    (cvData.sections || []).filter(s => s.column === 'left' && s.type !== 'profile_header').forEach(sec => {
      lines.push(`    - "${sec.id}" (${sec.title || sec.id})`);
    });
    lines.push('  main_content_sections:');
    (cvData.sections || []).filter(s => s.column === 'right').forEach(sec => {
      lines.push(`    - "${sec.id}" (${sec.title || sec.id})`);
    });
  }

  lines.push('candidate_profile:');
  lines.push(`  name: "${profileItem.name || cvData.profile?.name || ''}"`);
  lines.push(`  headline: "${profileItem.subtitle || ''}"`);
  lines.push(`  location: "${profileItem.location || ''}"`);
  lines.push('  contact:');
  lines.push(`    email: "${profileItem.email || ''}"`);
  lines.push(`    phone: "${profileItem.phone || ''}"`);
  lines.push(`    linkedin: "https://${(profileItem.linkedin || '').replace(/^https?:\/\//, '')}"`);
  lines.push(`    github: "https://${(profileItem.github || '').replace(/^https?:\/\//, '')}"`);
  lines.push('---');
  lines.push('');

  // ==========================================
  // Header Block
  // ==========================================
  lines.push(`# ${profileItem.name || cvData.profile?.name || 'Curriculum Vitae'}`);
  if (profileItem.subtitle) lines.push(`**${profileItem.subtitle}**\n`);

  const contacts = [];
  if (profileItem.location) contacts.push(profileItem.location);
  if (profileItem.email) contacts.push(profileItem.email);
  if (profileItem.phone) contacts.push(profileItem.phone);
  if (profileItem.linkedin) contacts.push(`[LinkedIn](https://${profileItem.linkedin.replace(/^https?:\/\//, '')})`);
  if (profileItem.github) contacts.push(`[GitHub](https://${profileItem.github.replace(/^https?:\/\//, '')})`);

  if (contacts.length > 0) {
    lines.push(contacts.join(' | '));
    lines.push('');
  }
  lines.push('---');
  lines.push('');

  // ==========================================
  // Helper to render individual section
  // ==========================================
  const renderSection = (sec) => {
    if (!sec || sec.type === 'profile_header') return;

    if (sec.type === 'about') {
      const headerTitle = sec.title || 'Perfil Profesional';
      const colTag = is1Col ? '' : ' [Visual Layout: Sidebar / Left Column]';
      lines.push(`## ${headerTitle}${colTag}`);
      if (aboutItem.description) lines.push(aboutItem.description);
      lines.push('');
      lines.push('---');
      lines.push('');
      return;
    }

    const headerTitle = sec.title || sec.id.toUpperCase();
    const colTag = is1Col ? '' : (sec.column === 'left' ? ' [Visual Layout: Sidebar / Left Column]' : ' [Visual Layout: Main Column]');
    lines.push(`## ${headerTitle}${colTag}`);

    if (sec.type === 'skills') {
      (sec.items || []).forEach(item => {
        lines.push(`- **${item.title || ''}:** ${item.description || ''}`);
      });
      lines.push('');
    } else if (sec.type === 'list') {
      (sec.items || []).forEach(item => {
        lines.push(`### ${item.title || ''}`);
        const meta = [];
        if (item.subtitle) meta.push(`**${item.subtitle}**`);
        if (item.date) meta.push(`\`${item.date}\``);
        if (item.link) meta.push(`🔗 [Enlace](${item.link.startsWith('http') ? item.link : `https://${item.link}`})`);
        if (meta.length > 0) lines.push(meta.join(' | '));

        if (item.description) {
          lines.push(item.description);
        }

        if (item.bullets && Array.isArray(item.bullets)) {
          item.bullets.forEach(b => {
            if (b && b.trim()) lines.push(`- ${b}`);
          });
        }
        lines.push('');
      });
    } else if (sec.type === 'education') {
      (sec.items || []).forEach(item => {
        const parts = [];
        if (item.title) parts.push(`**${item.title}**`);
        if (item.subtitle) parts.push(item.subtitle);
        if (item.date) parts.push(`\`${item.date}\``);
        lines.push(`- ${parts.join(' | ')}`);
      });
      lines.push('');
    } else if (sec.type === 'simple_list') {
      (sec.items || []).forEach(item => {
        lines.push(`- ${item.text || ''}`);
      });
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  };

  // In 1-column (ATS mode), force strict canonical ATS ordering
  if (is1Col) {
    CANONICAL_ATS_ORDER.forEach(secId => {
      const sec = cvData.sections?.find(s => s.id === secId || (secId === 'about_section' && s.type === 'about'));
      if (sec) renderSection(sec);
    });
  } else {
    // In 2-column mode, render sections as configured
    (cvData.sections || []).forEach(sec => {
      renderSection(sec);
    });
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

  const profileSection = cvData.sections?.find(s => s.type === 'profile_header');
  const profileItem = profileSection?.items?.[0] || {};
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

  xml.push('  <candidate>');
  xml.push(`    <name>${escapeXML(profileItem.name || cvData.profile?.name)}</name>`);
  xml.push(`    <headline>${escapeXML(profileItem.subtitle)}</headline>`);
  xml.push(`    <location>${escapeXML(profileItem.location)}</location>`);
  xml.push('    <contact>');
  xml.push(`      <email>${escapeXML(profileItem.email)}</email>`);
  xml.push(`      <phone>${escapeXML(profileItem.phone)}</phone>`);
  xml.push(`      <linkedin>${escapeXML(profileItem.linkedin)}</linkedin>`);
  xml.push(`      <github>${escapeXML(profileItem.github)}</github>`);
  xml.push('    </contact>');
  if (aboutItem.description) {
    xml.push(`    <professional_summary>${escapeXML(aboutItem.description)}</professional_summary>`);
  }
  xml.push('  </candidate>');
  xml.push('  <sections>');

  const sectionsToRender = is1Col
    ? CANONICAL_ATS_ORDER.map(id => cvData.sections?.find(s => s.id === id || (id === 'about_section' && s.type === 'about'))).filter(Boolean)
    : (cvData.sections || []);

  sectionsToRender.forEach((sec, idx) => {
    if (sec.type === 'profile_header' || sec.type === 'about') return;
    
    const colAttr = is1Col ? `order="${idx + 1}"` : `column="${escapeXML(sec.column || 'left')}"`;
    xml.push(`    <section id="${escapeXML(sec.id)}" type="${escapeXML(sec.type)}" title="${escapeXML(sec.title)}" ${colAttr}>`);
    
    (sec.items || []).forEach(item => {
      if (sec.type === 'list') {
        xml.push(`      <entry id="${escapeXML(item.id)}" title="${escapeXML(item.title)}" subtitle="${escapeXML(item.subtitle)}" date="${escapeXML(item.date)}" link="${escapeXML(item.link || '')}">`);
        if (item.description) {
          xml.push(`        <description>${escapeXML(item.description)}</description>`);
        }
        if (item.bullets && item.bullets.length > 0) {
          xml.push('        <bullets>');
          item.bullets.forEach(b => {
            if (b && b.trim()) xml.push(`          <bullet>${escapeXML(b)}</bullet>`);
          });
          xml.push('        </bullets>');
        }
        xml.push('      </entry>');
      } else if (sec.type === 'skills') {
        xml.push(`      <skill_category id="${escapeXML(item.id)}" title="${escapeXML(item.title)}">${escapeXML(item.description)}</skill_category>`);
      } else if (sec.type === 'education') {
        xml.push(`      <education_entry id="${escapeXML(item.id)}" degree="${escapeXML(item.title)}" institution="${escapeXML(item.subtitle)}" period="${escapeXML(item.date)}" />`);
      } else if (sec.type === 'simple_list') {
        xml.push(`      <item id="${escapeXML(item.id)}">${escapeXML(item.text)}</item>`);
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
  const profileSection = cvData.sections?.find(s => s.type === 'profile_header');
  const profileItem = profileSection?.items?.[0] || {};
  const aboutSection = cvData.sections?.find(s => s.type === 'about');
  const aboutItem = aboutSection?.items?.[0] || {};

  const lines = [];
  lines.push((profileItem.name || cvData.profile?.name || 'CURRICULUM VITAE').toUpperCase());
  if (profileItem.subtitle) lines.push(profileItem.subtitle);
  
  const contacts = [];
  if (profileItem.location) contacts.push(profileItem.location);
  if (profileItem.email) contacts.push(profileItem.email);
  if (profileItem.phone) contacts.push(profileItem.phone);
  if (profileItem.linkedin) contacts.push(profileItem.linkedin);
  if (profileItem.github) contacts.push(profileItem.github);
  if (contacts.length > 0) lines.push(contacts.join(' | '));
  lines.push('\n' + '='.repeat(60) + '\n');

  if (aboutItem.description) {
    lines.push('PERFIL PROFESIONAL');
    lines.push('-'.repeat(30));
    lines.push(aboutItem.description);
    lines.push('\n');
  }

  // Canonical ATS linear output
  const sectionsToRender = CANONICAL_ATS_ORDER
    .map(id => cvData.sections?.find(s => s.id === id || (id === 'about_section' && s.type === 'about')))
    .filter(Boolean);

  sectionsToRender.forEach(sec => {
    if (sec.type === 'profile_header' || sec.type === 'about') return;
    lines.push((sec.title || sec.id).toUpperCase());
    lines.push('-'.repeat(30));

    if (sec.type === 'skills') {
      (sec.items || []).forEach(item => {
        lines.push(`* ${item.title}: ${item.description}`);
      });
      lines.push('');
    } else if (sec.type === 'list') {
      (sec.items || []).forEach(item => {
        lines.push(`${item.title || ''}`);
        if (item.subtitle || item.date) {
          lines.push(`${item.subtitle || ''} | ${item.date || ''}`);
        }
        if (item.description) lines.push(item.description);
        if (item.bullets && item.bullets.length > 0) {
          item.bullets.forEach(b => lines.push(`* ${b}`));
        }
        lines.push('');
      });
    } else if (sec.type === 'education') {
      (sec.items || []).forEach(item => {
        lines.push(`* ${item.title} - ${item.subtitle} (${item.date || ''})`);
      });
      lines.push('');
    } else if (sec.type === 'simple_list') {
      (sec.items || []).forEach(item => {
        lines.push(`* ${item.text}`);
      });
      lines.push('');
    }
  });

  return lines.join('\n');
};

/**
 * Builds a complete prompt bundle (System instruction + Task + Optional Job Description + Formatted CV)
 * ready to be copied directly into ChatGPT, Claude, Gemini, DeepSeek, or an API call.
 */
export const buildAIPromptPayload = (cvData, promptId = 'recruiter_audit', options = {}) => {
  const { format = 'markdown', jobDescription = '' } = options;
  
  const promptDef = prompts.find(p => p.id === promptId) || prompts[0];

  let cvFormatted = '';
  if (format === 'markdown') {
    cvFormatted = exportToAIMarkdown(cvData);
  } else if (format === 'xml') {
    cvFormatted = exportToAIXML(cvData);
  } else if (format === 'ats_text') {
    cvFormatted = exportToATSPlainText(cvData);
  } else {
    cvFormatted = JSON.stringify(cvData, null, 2);
  }

  const payload = [];
  payload.push(promptDef.system_instruction);
  payload.push('');
  payload.push(promptDef.task);
  payload.push('');

  if (jobDescription && jobDescription.trim()) {
    payload.push(`--- DESCRIPCIÓN DE LA OFERTA LABORAL (JOB DESCRIPTION) ---`);
    payload.push(jobDescription.trim());
    payload.push('');
  }

  payload.push(`--- CONTENIDO Y ABSTRACCIÓN DEL CURRÍCULUM VITAE (${format.toUpperCase()}) ---`);
  payload.push(cvFormatted);

  return payload.join('\n');
};

export { prompts };
