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
  const subtitle = stripHtml(item.subtitle || item.company || item.institution || '');
  if (subtitle) meta.push(`**${subtitle}**`);
  const date = stripHtml(item.date || item.year || '');
  if (date) meta.push(`\`${date}\``);
  if (item.link) {
    const rawLink = stripHtml(item.link);
    const url = rawLink.startsWith('http') ? rawLink : `https://${rawLink}`;
    const text = stripHtml(item.linkText) || 'Enlace';
    meta.push(`[${text}](${url})`);
  }
  if (meta.length > 0) lines.push(meta.join(' | '));

  const description = stripHtml(item.description || '');
  if (description) lines.push(description);

  if (Array.isArray(item.bullets) && item.bullets.length > 0) {
    item.bullets.forEach(b => {
      const cleanB = stripHtml(b);
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
  return parts.length > 0 ? `- ${parts.join(' | ')}` : '';
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

  let res = `- **${title}**`;
  if (issuer) res += ` | ${issuer}`;
  if (date) res += ` | \`${date}\``;
  if (credId) res += ` (ID: ${credId})`;
  if (link) {
    const url = link.startsWith('http') ? link : `https://${link}`;
    res += ` [Credencial](${url})`;
  }
  return res;
};

export const aboutMarkdown = (item) => {
  if (!item) return '';
  return stripHtml(item.description || item.text || '');
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
  const desc = stripHtml(item.description || '');

  const parts = [`- 📖 **${title}**`];
  if (publisher) parts.push(publisher);
  if (date) parts.push(`\`${date}\``);
  if (link) {
    const url = link.startsWith('http') ? link : `https://${link}`;
    parts.push(`[Enlace](${url})`);
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
  lines.push(`      <entry id="${esc(item.id)}" title="${esc(item.title || item.name)}" subtitle="${esc(item.subtitle || '')}" date="${esc(item.date || '')}" link="${esc(item.link || '')}">`);
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
  if (item.subtitle || item.date) {
    lines.push(`${stripHtml(item.subtitle || '')} | ${stripHtml(item.date || '')}`);
  }
  if (item.link) lines.push(`  Enlace: ${stripHtml(item.link)}`);
  if (item.description) lines.push(stripHtml(item.description));
  if (Array.isArray(item.bullets) && item.bullets.length > 0) {
    item.bullets.forEach(b => {
      const clean = stripHtml(b);
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

/* ==========================================================================
 * 4. [DEPRECATED / DEREFERENCED] LEGACY CLEAN HTML FORMATTERS (Variant 3)
 *
 * NOTE: These string-based HTML generators are deprecated and dereferenced.
 * The Single Source of Truth for CV visual structure and print rendering is now
 * unified in the React component tree (PrintBaseItem / PrintBaseSection in src/components/CV/)
 * with styles governed by src/index.css (?raw) and src/styles/print.css (?raw).
 *
 * Kept commented below for historical reference only.
 * ==========================================================================
// ==========================================
// 4. CLEAN HTML FORMATTERS (Variant 3 - PDF & Print)
// ==========================================

export const profileHeaderHTML = (item) => {
  if (!item) return '';
  const contacts = normalizeItemContacts(item);
  const contactsHtml = contacts
    .filter(c => c && c.value && String(c.value).trim() !== '')
    .map(c => {
      const cfg = getContactConfig(c.type);
      return `<span class="social__link"><i class='${cfg.icon}'></i> ${renderRichHTML(c.value)}</span>`;
    })
    .join('\n');

  return `
    <div class="home__data bd-grid cv-block">
      <h1 class="home__title">${renderRichHTML(item.name)}</h1>
      <h2 class="home__subtitle">${renderRichHTML(item.subtitle)}</h2>
      <div class="social__container bd-grid" style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 0.75rem;">
        ${contactsHtml}
      </div>
    </div>
  `;
};

export const aboutHTML = (item) => {
  if (!item) return '';
  return `
    <div class="profile__description cv-block">
      <p>${renderRichHTML(item.description)}</p>
    </div>
  `;
};

export const skillsHTML = (item) => {
  if (!item) return '';
  return `
    <li class="skills__name cv-block" style="display: flex; align-items: flex-start; margin-bottom: var(--item-gap, 6px);">
      <span class="skills__circle" style="display: inline-block; width: 5px; height: 5px; border-radius: 50%; margin: 7px 0.45rem 0 0; flex-shrink: 0; background-color: var(--circle-color, var(--text-color));"></span>
      <span style="flex: 1;">
        <b>${renderRichHTML(item.title)}:</b> ${renderRichHTML(item.description)}
      </span>
    </li>
  `;
};

export const educationHTML = (item, isLast = false) => {
  if (!item) return '';
  return `
    <div class="education__content cv-block" style="display: flex;">
      
      <!-- Usar div, NO span -->
      <div class="education__time" style="padding-right: 0.75rem; flex-shrink: 0;">
        <span class="education__rounder"></span>
        ${!isLast ? '<span class="education__line"></span>' : ''}
      </div>

      <!-- Usar div, NO span -->
      <div class="education__data bd-grid" style="flex: 1;">
        <h3 class="education__title">${renderRichHTML(item.title)}</h3>
        <span class="education__studies">${renderRichHTML(item.subtitle)}</span>
        <span class="education__year">${renderRichHTML(item.date)}</span>
      </div>
      
    </div>
  `;
};

export const simpleListHTML = (item) => {
  if (!item) return '';
  return `
    <li class="cv-block simple-list-item" style="display: list-item; list-style-type: disc; margin-bottom: calc(var(--item-gap, 6px) / 2); line-height: 1.45; color: inherit; padding: 0;">
      ${renderRichHTML(item.text)}
    </li>
  `;
};

export const languagesHTML = (item) => {
  if (!item) return '';
  return `
    <div class="cv-block" style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: var(--item-gap, 6px);">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span style="display: inline-block; width: 6px; height: 6px; background-color: var(--circle-color, var(--text-color-light)); border-radius: 50%; flex-shrink: 0;"></span>
        <div>
          <span style="font-weight: 600; font-size: var(--normal-font-size); color: var(--title-color);">${renderRichHTML(item.title || item.language)}</span>
          ${item.description ? `<div style="font-size: var(--smaller-font-size); color: var(--text-color-light);">${renderRichHTML(item.description)}</div>` : ''}
        </div>
      </div>
      <span style="font-size: var(--small-font-size); font-weight: 500; padding: 2px 8px; border-radius: 12px; background: var(--container-color-alt, rgba(0, 0, 0, 0.05)); color: var(--title-color); border: 1px solid rgba(0, 0, 0, 0.08); white-space: nowrap;">
        ${renderRichHTML(item.subtitle || item.level || 'Intermedio')}
      </span>
    </div>
  `;
};

export const certificatesHTML = (item) => {
  if (!item) return '';
  return `
    <div class="cv-block" style="display: flex; align-items: flex-start; gap: 0.65rem; margin-bottom: var(--item-gap, 6px);">
      <span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: var(--container-color-alt, rgba(0, 0, 0, 0.05)); color: var(--title-color); flex-shrink: 0; margin-top: 2px;">
        <i class='bx bx-badge-check' style="font-size: 14px;"></i>
      </span>
      <div style="flex: 1;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap;">
          <h3 class="education__title" style="margin: 0; font-weight: 600;">${renderRichHTML(item.title)}</h3>
          ${item.date ? `<span style="font-size: var(--smaller-font-size); color: var(--text-color-light);">${renderRichHTML(item.date)}</span>` : ''}
        </div>
        <div style="font-size: var(--small-font-size); color: var(--text-color);">
          ${renderRichHTML(item.subtitle)}${item.credentialId ? ` · <span style="color: var(--text-color-light); font-size: var(--smaller-font-size);">ID: ${renderRichHTML(item.credentialId)}</span>` : ''}
        </div>
        ${item.link ? `<div class="social__container bd-grid" style="margin-top: 0.15rem;"><a href="https://${escapeHTML(item.link.replace(/^https?:\/\//, ''))}" class="social__link" target="_blank" rel="noreferrer"><i class='bx bx-link-external'></i> ${renderRichHTML(item.linkText || item.link)}</a></div>` : ''}
      </div>
    </div>
  `;
};

export const awardsHTML = (item) => {
  if (!item) return '';
  return `
    <div class="cv-block" style="display: flex; align-items: flex-start; gap: 0.65rem; margin-bottom: var(--item-gap, 6px);">
      <span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: var(--container-color-alt, rgba(0, 0, 0, 0.05)); color: var(--title-color); flex-shrink: 0; margin-top: 2px;">
        <i class='bx bx-trophy' style="font-size: 14px;"></i>
      </span>
      <div style="flex: 1;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap;">
          <h3 class="education__title" style="margin: 0; font-weight: 600;">${renderRichHTML(item.title)}</h3>
          ${item.date ? `<span style="font-size: var(--smaller-font-size); color: var(--text-color-light);">${renderRichHTML(item.date)}</span>` : ''}
        </div>
        ${item.subtitle ? `<div style="font-size: var(--small-font-size); color: var(--text-color);">${renderRichHTML(item.subtitle)}</div>` : ''}
        ${item.description ? `<p class="experience__description" style="margin-top: 0.2rem;">${renderRichHTML(item.description)}</p>` : ''}
      </div>
    </div>
  `;
};

export const publicationsHTML = (item) => {
  if (!item) return '';
  return `
    <div class="cv-block" style="display: flex; align-items: flex-start; gap: 0.65rem; margin-bottom: var(--item-gap, 6px);">
      <span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: var(--container-color-alt, rgba(0, 0, 0, 0.05)); color: var(--title-color); flex-shrink: 0; margin-top: 2px;">
        <i class='bx bx-book-open' style="font-size: 14px;"></i>
      </span>
      <div style="flex: 1;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap;">
          <h3 class="education__title" style="margin: 0; font-weight: 600;">${renderRichHTML(item.title)}</h3>
          ${item.date ? `<span style="font-size: var(--smaller-font-size); color: var(--text-color-light);">${renderRichHTML(item.date)}</span>` : ''}
        </div>
        ${item.subtitle ? `<div style="font-size: var(--small-font-size); color: var(--text-color);">${renderRichHTML(item.subtitle)}</div>` : ''}
        ${item.link ? `<div class="social__container bd-grid" style="margin-top: 0.15rem;"><a href="https://${escapeHTML(item.link.replace(/^https?:\/\//, ''))}" class="social__link" target="_blank" rel="noreferrer"><i class='bx bx-link-external'></i> ${renderRichHTML(item.linkText || item.link)}</a></div>` : ''}
        ${item.description ? `<p class="experience__description" style="margin-top: 0.2rem;">${renderRichHTML(item.description)}</p>` : ''}
      </div>
    </div>
  `;
};

export const referencesHTML = (item) => {
  if (!item) return '';
  return `
    <div class="cv-block" style="display: flex; align-items: flex-start; gap: 0.65rem; margin-bottom: var(--item-gap, 6px);">
      <span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: var(--container-color-alt, rgba(0, 0, 0, 0.05)); color: var(--title-color); flex-shrink: 0; margin-top: 2px;">
        <i class='bx bx-user-check' style="font-size: 14px;"></i>
      </span>
      <div style="flex: 1;">
        <h3 class="education__title" style="margin: 0; font-weight: 600;">${renderRichHTML(item.title || item.name)}</h3>
        <div style="font-size: var(--small-font-size); color: var(--text-color);">${renderRichHTML(item.subtitle || item.position)}</div>
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.2rem; font-size: var(--smaller-font-size); color: var(--text-color-light);">
          ${item.email ? `<span><i class='bx bx-envelope'></i> ${renderRichHTML(item.email)}</span>` : ''}
          ${item.phone ? `<span><i class='bx bx-phone'></i> ${renderRichHTML(item.phone)}</span>` : ''}
          ${item.relationship ? `<span>(${renderRichHTML(item.relationship)})</span>` : ''}
        </div>
      </div>
    </div>
  `;
};

/**
 * Universal Base Item HTML Formatter (Fallback)
 * /
export const baseItemHTML = (item, isLast = false) => {
  if (!item) return '';
  const rounderColor = 'var(--circle-color, var(--text-color-light))';
  return `
    <div class="experience__content cv-block" style="display: flex; margin-bottom: var(--item-gap, 8px);">
      <div class="experience__time" style="padding-right: 0.75rem;">
        <span class="experience__rounder" style="background-color: ${rounderColor};"></span>
        ${!isLast ? '<span class="experience__line"></span>' : ''}
      </div>
      <div class="experience__data bd-grid" style="width: 100%;">
        <h3 class="experience__title" style="margin: 0;">${renderRichHTML(item.title)}</h3>
        <span class="experience__company" style="font-weight: 500; color: var(--title-color);">
          ${renderRichHTML(item.date)}
          ${(item.subtitle && item.date) ? ' | ' : ''}
          ${renderRichHTML(item.subtitle)}
        </span>
        ${item.link ? `<span class="social__container bd-grid"><a href="https://${escapeHTML(item.link.replace(/^https?:\/\//, ''))}" class="social__link" target="_blank" rel="noreferrer" style="margin-top: 0.25rem; margin-bottom: 0.25rem;"><i class='bx bx-link-external'></i> ${renderRichHTML(item.linkText || item.link)}</a></span>` : ''}
        ${item.description ? `<p class="experience__description">${renderRichHTML(item.description)}</p>` : ''}
        ${item.bullets && item.bullets.length > 0 ? `
          <ul class="experience__bullets" style="padding-left: 1.15rem; margin-top: 0.25rem; margin-bottom: 0.25rem; list-style-type: disc;">
            ${item.bullets.map(b => `
              <li class="cv-block" style="display: list-item; list-style-type: disc; margin-bottom: calc(var(--item-gap, 6px) / 2); line-height: 1.45; color: inherit; padding: 0;">
                ${renderRichHTML(typeof b === 'string' ? b : (b?.text || ''))}
              </li>
            `).join('')}
          </ul>
        ` : ''}
      </div>
    </div>
  `;
};

*/
