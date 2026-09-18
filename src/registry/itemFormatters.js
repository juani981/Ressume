import { renderRichHTML, stripHtml } from '../utils/richTextEngine';
import { normalizeItemContacts, getContactConfig } from '../utils/contactTypes';

/**
 * Escapes HTML characters for static HTML output
 */
const escapeHTML = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * itemFormatters.js
 * 
 * Central multi-representation formatters for CV items across 3 variants:
 * 1. Variant 1: React Component / Editor UI (components in src/components/CV/items/)
 * 2. Variant 2: Markdown & XML for AI Prompts & ATS export
 * 3. Variant 3: Standalone Clean Semantic HTML for Print & PDF rendering
 */

// ==========================================
// 1. MARKDOWN FORMATTERS (Variant 2)
// ==========================================

/**
 * Universal Base Item Markdown Formatter (Fallback)
 */
export const baseItemMarkdown = (item) => {
  if (!item) return '';
  const lines = [];
  const title = stripHtml(item.title || item.name || item.text || '');
  if (title) lines.push(`### ${title}`);

  const meta = [];
  const subtitle = stripHtml(item.subtitle || item.company || item.institution || item.mentee || '');
  if (subtitle) meta.push(`**${subtitle}**`);
  const date = stripHtml(item.date || item.year || '');
  if (date) meta.push(`\`${date}\``);
  if (item.link) {
    const rawLink = stripHtml(item.link).replace(/\s+/g, '');
    const url = rawLink.startsWith('http') ? rawLink : `https://${rawLink}`;
    const text = stripHtml(item.linkText) || 'Enlace';
    meta.push(`[${text}](${url})`);
  }
  if (meta.length > 0) lines.push(meta.join(' | '));

  const description = stripHtml(item.description || '')
    .replace(/\$([a-zA-Z0-9_\-+/]+)\$/g, '$1')
    .replace(/[☑☐✓✔🗹]/g, '')
    .trim();
  if (description) lines.push(description);

  if (Array.isArray(item.bullets) && item.bullets.length > 0) {
    item.bullets.forEach(b => {
      const cleanB = stripHtml(b)
        .replace(/\$([a-zA-Z0-9_\-+/]+)\$/g, '$1')
        .replace(/[☑☐✓✔🗹]/g, '')
        .trim();
      if (cleanB) lines.push(`- ${cleanB}`);
    });
  }
  return lines.join('\n');
};

export const skillsMarkdown = (item) => {
  if (!item) return '';
  const title = stripHtml(item.title || item.name || '');
  const desc = stripHtml(item.description || item.skills || '');
  return title && desc ? `- **${title}:** ${desc}` : `- ${title || desc}`;
};

export const educationMarkdown = (item) => {
  if (!item) return '';
  const parts = [];
  const title = stripHtml(item.title || item.degree || '');
  if (title) parts.push(`**${title}**`);
  const subtitle = stripHtml(item.subtitle || item.institution || '');
  if (subtitle) parts.push(subtitle);
  const date = stripHtml(item.date || item.year || '');
  if (date) parts.push(`\`${date}\``);

  let res = parts.length > 0 ? `- ${parts.join(' | ')}` : '';
  const desc = stripHtml(item.description || '');
  if (desc) {
    res += res ? `\n  ${desc}` : desc;
  }
  if (Array.isArray(item.bullets) && item.bullets.length > 0) {
    item.bullets.forEach(b => {
      const cleanB = stripHtml(b);
      if (cleanB) {
        res += res ? `\n  - ${cleanB}` : `- ${cleanB}`;
      }
    });
  }
  return res;
};

export const simpleListMarkdown = (item) => {
  if (!item) return '';
  const text = stripHtml(item.text || item.title || item.name || '');
  return text ? `- ${text}` : '';
};

export const languagesMarkdown = (item) => {
  if (!item) return '';
  const lang = stripHtml(item.title || item.language || item.name || '');
  const level = stripHtml(item.subtitle || item.level || 'Intermedio');
  const desc = stripHtml(item.description || '');
  return `- **${lang}**: ${level}${desc ? ` (${desc})` : ''}`;
};

export const certificatesMarkdown = (item) => {
  if (!item) return '';
  const title = stripHtml(item.title || item.name || '');
  const issuer = stripHtml(item.subtitle || item.issuer || '');
  const date = stripHtml(item.date || '');
  const credId = stripHtml(item.credentialId || '');
  const link = stripHtml(item.link || '');
  const linkText = stripHtml(item.linkText || '') || 'Credencial';
  const desc = stripHtml(item.description || '');

  let res = `- **${title}**`;
  if (issuer) res += ` | ${issuer}`;
  if (date) res += ` | \`${date}\``;
  if (credId) res += ` (ID: ${credId})`;
  if (link) {
    const url = link.startsWith('http') ? link : `https://${link}`;
    res += ` [${linkText}](${url})`;
  }
  if (desc) {
    res += `\n  ${desc}`;
  }
  return res;
};

export const aboutMarkdown = (item) => {
  if (!item) return '';
  if (item.description) return stripHtml(item.description);
  if (item.text) return stripHtml(item.text);
  if (Array.isArray(item.bullets) && item.bullets.length > 0) {
    return item.bullets.map(b => stripHtml(b)).filter(Boolean).join('\n');
  }
  return '';
};

export const awardsMarkdown = (item) => {
  if (!item) return '';
  const title = stripHtml(item.title || item.name || '');
  const issuer = stripHtml(item.subtitle || item.issuer || '');
  const date = stripHtml(item.date || '');
  const desc = stripHtml(item.description || '');

  const parts = [`- 🏆 **${title}**`];
  if (issuer) parts.push(issuer);
  if (date) parts.push(`\`${date}\``);
  let res = parts.join(' | ');
  if (desc) res += `\n  ${desc}`;
  return res;
};

export const publicationsMarkdown = (item) => {
  if (!item) return '';
  const title = stripHtml(item.title || item.name || '');
  const publisher = stripHtml(item.subtitle || item.publisher || '');
  const date = stripHtml(item.date || '');
  const link = stripHtml(item.link || '');
  const linkText = stripHtml(item.linkText || '') || 'Enlace';
  const desc = stripHtml(item.description || '');

  const parts = [`- 📖 **${title}**`];
  if (publisher) parts.push(publisher);
  if (date) parts.push(`\`${date}\``);
  if (link) {
    const url = link.startsWith('http') ? link : `https://${link}`;
    parts.push(`[${linkText}](${url})`);
  }
  let res = parts.join(' | ');
  if (desc) res += `\n  ${desc}`;
  return res;
};

export const referencesMarkdown = (item) => {
  if (!item) return '';
  const name = stripHtml(item.title || item.name || '');
  const role = stripHtml(item.subtitle || item.position || '');
  const email = stripHtml(item.email || '');
  const phone = stripHtml(item.phone || '');
  const rel = stripHtml(item.relationship || '');

  const parts = [`- 👤 **${name}**`];
  if (role) parts.push(role);
  if (email) parts.push(`✉️ ${email}`);
  if (phone) parts.push(`📞 ${phone}`);
  if (rel) parts.push(`(${rel})`);
  return parts.join(' | ');
};

// ==========================================
// 2. XML FORMATTERS (Variant 2)
// ==========================================

export const baseItemXML = (item, escapeXML) => {
  if (!item) return '';
  const esc = escapeXML || ((s) => s || '');
  const lines = [];
  const subtitle = esc(item.subtitle || item.company || item.institution || item.mentee || '');
  lines.push(`      <entry id="${esc(item.id)}" title="${esc(item.title || item.name)}" subtitle="${subtitle}" date="${esc(item.date || '')}" link="${esc(item.link || '')}">`);
  if (item.description) {
    lines.push(`        <description>${esc(item.description)}</description>`);
  }
  if (Array.isArray(item.bullets) && item.bullets.length > 0) {
    lines.push('        <bullets>');
    item.bullets.forEach(b => {
      if (b && b.trim()) lines.push(`          <bullet>${esc(b)}</bullet>`);
    });
    lines.push('        </bullets>');
  }
  lines.push('      </entry>');
  return lines.join('\n');
};

export const skillsXML = (item, escapeXML) => {
  if (!item) return '';
  const esc = escapeXML || ((s) => s || '');
  return `      <skill_category id="${esc(item.id)}" title="${esc(item.title)}">${esc(item.description)}</skill_category>`;
};

export const educationXML = (item, escapeXML) => {
  if (!item) return '';
  const esc = escapeXML || ((s) => s || '');
  return `      <education_entry id="${esc(item.id)}" degree="${esc(item.title)}" institution="${esc(item.subtitle)}" period="${esc(item.date)}" />`;
};

export const simpleListXML = (item, escapeXML) => {
  if (!item) return '';
  const esc = escapeXML || ((s) => s || '');
  return `      <item id="${esc(item.id)}">${esc(item.text)}</item>`;
};

// ==========================================
// 3. PLAIN TEXT FORMATTERS (ATS Export)
// ==========================================

export const baseItemPlainText = (item) => {
  if (!item) return '';
  const lines = [];
  lines.push(`${stripHtml(item.title || item.name || item.text || '')}`);
  const subtitle = stripHtml(item.subtitle || item.company || item.institution || item.mentee || '');
  if (subtitle || item.date) {
    lines.push(`${subtitle} | ${stripHtml(item.date || '')}`);
  }
  if (item.link) lines.push(`  Enlace: ${stripHtml(item.link).replace(/\s+/g, '')}`);
  if (item.description) {
    const cleanDesc = stripHtml(item.description)
      .replace(/\$([a-zA-Z0-9_\-+/]+)\$/g, '$1')
      .replace(/[☑☐✓✔🗹]/g, '')
      .trim();
    if (cleanDesc) lines.push(cleanDesc);
  }
  if (Array.isArray(item.bullets) && item.bullets.length > 0) {
    item.bullets.forEach(b => {
      const clean = stripHtml(b)
        .replace(/\$([a-zA-Z0-9_\-+/]+)\$/g, '$1')
        .replace(/[☑☐✓✔🗹]/g, '')
        .trim();
      if (clean) lines.push(`* ${clean}`);
    });
  }
  return lines.join('\n');
};

export const skillsPlainText = (item) => {
  if (!item) return '';
  return `* ${stripHtml(item.title || '')}: ${stripHtml(item.description || '')}`;
};

export const educationPlainText = (item) => {
  if (!item) return '';
  return `* ${stripHtml(item.title || '')} - ${stripHtml(item.subtitle || '')} (${stripHtml(item.date || '')})`;
};

export const simpleListPlainText = (item) => {
  if (!item) return '';
  return `* ${stripHtml(item.text || '')}`;
};


