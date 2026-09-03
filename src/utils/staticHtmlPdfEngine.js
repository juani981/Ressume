/**
 * staticHtmlPdfEngine.js
 * 
 * Dedicated static HTML PDF generation core for high-fidelity native printing.
 * Isolates visual content from editor artifacts, embeds strict CSS pagination rules,
 * and enforces dynamic auto-scaling to fit within a maximum of 2 A4 pages.
 */

const MAX_A4_2PAGE_HEIGHT_PX = 2246; // 2 A4 pages at 96 DPI (1123px * 2 = 2246px)
const MIN_SCALE_FLOOR = 0.75;

import { renderRichHTML, stripHtml } from './richTextEngine';
export { renderRichHTML, stripHtml };

/**
 * Escapes HTML characters to prevent XSS and malformed HTML
 */
export const escapeHTML = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Calculates auto-scale factor adhering to max 2 A4 pages limit
 * @param {number} renderedHeight 
 * @returns {number} Scale factor between 0.82 and 1.0
 */
export const calculatePrintScale = (renderedHeight) => {
  if (!renderedHeight || renderedHeight <= MAX_A4_2PAGE_HEIGHT_PX) {
    return 1.0;
  }
  const calculated = MAX_A4_2PAGE_HEIGHT_PX / renderedHeight;
  return Math.max(MIN_SCALE_FLOOR, +(calculated.toFixed(3)));
};

/**
 * Computes YIQ contrast colors for backgrounds
 */
const getDynamicTextColors = (hexcolor) => {
  let calcHex = hexcolor || '#ffffff';
  let hex = calcHex.replace("#", "");
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  const r = parseInt(hex.substr(0, 2), 16) || 0;
  const g = parseInt(hex.substr(2, 2), 16) || 0;
  const b = parseInt(hex.substr(4, 2), 16) || 0;
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  const adjustColor = (color, amount) => {
    return '#' + color.replace(/^#/, '').replace(/../g, c => ('0'+Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).substr(-2));
  };
  const circleColor = adjustColor(calcHex, yiq >= 128 ? -40 : 40);

  if (yiq < 128) {
    return {
      titleColor: '#fcfcfc',
      textColor: '#f0efef',
      textColorLight: '#cccccc',
      containerColorAlt: 'rgba(255, 255, 255, 0.1)',
      circleColor
    };
  } else {
    return {
      titleColor: '#0b0a0a',
      textColor: '#403a3a',
      textColorLight: '#707070',
      containerColorAlt: 'rgba(0, 0, 0, 0.05)',
      circleColor
    };
  }
};

/**
 * Renders an item to clean static HTML
 */
const renderItemHTML = (item, sectionType, isLast = false) => {
  if (!item) return '';

  if (sectionType === 'profile_header') {
    return `
      <div class="home__data bd-grid cv-block">
        <h1 class="home__title">${renderRichHTML(item.name)}</h1>
        <h2 class="home__subtitle">${renderRichHTML(item.subtitle)}</h2>
        <div class="social__container bd-grid" style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 0.75rem;">
          ${item.location ? `<span class="social__link"><i class='bx bx-map'></i> ${renderRichHTML(item.location)}</span>` : ''}
          ${item.email ? `<span class="social__link"><i class='bx bx-envelope'></i> ${renderRichHTML(item.email)}</span>` : ''}
          ${item.phone ? `<span class="social__link"><i class='bx bx-phone'></i> ${renderRichHTML(item.phone)}</span>` : ''}
          ${item.linkedin ? `<span class="social__link"><i class='bx bxl-linkedin-square'></i> ${renderRichHTML(item.linkedin)}</span>` : ''}
          ${item.github ? `<span class="social__link"><i class='bx bxl-github'></i> ${renderRichHTML(item.github)}</span>` : ''}
        </div>
      </div>
    `;
  }

  if (sectionType === 'about') {
    return `
      <div class="profile__description cv-block">
        <p>${renderRichHTML(item.description)}</p>
      </div>
    `;
  }

  if (sectionType === 'skills') {
    return `
      <li class="skills__name cv-block" style="display: flex; align-items: flex-start; margin-bottom: var(--item-gap, 6px);">
        <span class="skills__circle" style="display: inline-block; width: 5px; height: 5px; border-radius: 50%; margin: 7px 0.45rem 0 0; flex-shrink: 0; background-color: var(--circle-color, var(--text-color));"></span>
        <span style="flex: 1;">
          <b>${renderRichHTML(item.title)}:</b> ${renderRichHTML(item.description)}
        </span>
      </li>
    `;
  }

  if (sectionType === 'education') {
    return `
      <div class="education__content cv-block" style="display: flex; margin-bottom: var(--item-gap, 8px);">
        <div class="education__time" style="padding-right: 0.75rem;">
          <span class="education__rounder"></span>
          ${!isLast ? '<span class="education__line"></span>' : ''}
        </div>
        <div class="education__data bd-grid" style="width: 100%;">
          <h3 class="education__title">${renderRichHTML(item.title)}</h3>
          <span class="education__studies">${renderRichHTML(item.subtitle)}</span>
          <span class="education__year">${renderRichHTML(item.date)}</span>
        </div>
      </div>
    `;
  }

  if (sectionType === 'simple_list') {
    return `
      <li class="cv-block simple-list-item" style="display: flex; align-items: flex-start; margin-bottom: var(--item-gap, 6px); list-style: none;">
        <span style="display: inline-block; width: 5px; height: 5px; background-color: var(--circle-color, var(--text-color)); border-radius: 50%; margin: 7px 0.45rem 0 0; flex-shrink: 0;"></span>
        <span style="flex: 1;">${renderRichHTML(item.text)}</span>
      </li>
    `;
  }

  if (sectionType === 'languages') {
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
  }

  if (sectionType === 'certificates') {
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
  }

  if (sectionType === 'awards') {
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
  }

  if (sectionType === 'publications') {
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
  }

  if (sectionType === 'references') {
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
  }

  // default 'list', 'projects', 'volunteering', or custom
  const rounderColor = 'var(--circle-color, var(--text-color-light))';
  return `
    <div class="experience__content cv-block" style="display: flex; margin-bottom: var(--item-gap, 8px);">
      <div class="experience__time" style="padding-right: 0.75rem;">
        <span class="experience__rounder" style="background-color: ${rounderColor};"></span>
        ${!isLast ? '<span class="experience__line"></span>' : ''}
      </div>
      <div class="experience__data bd-grid" style="width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap;">
          <h3 class="experience__title" style="margin: 0;">${renderRichHTML(item.title)}</h3>
          ${item.date ? `<span style="font-size: var(--smaller-font-size); color: var(--text-color-light);">${renderRichHTML(item.date)}</span>` : ''}
        </div>
        ${item.subtitle ? `<span class="experience__company" style="font-weight: 500; color: var(--title-color);">${renderRichHTML(item.subtitle)}</span>` : ''}
        ${item.link ? `<span class="social__container bd-grid"><a href="https://${escapeHTML(item.link.replace(/^https?:\/\//, ''))}" class="social__link" target="_blank" rel="noreferrer" style="margin-top: 0.25rem; margin-bottom: 0.25rem;"><i class='bx bx-link-external'></i> ${renderRichHTML(item.linkText || item.link)}</a></span>` : ''}
        ${item.description ? `<p class="experience__description">${renderRichHTML(item.description)}</p>` : ''}
        ${item.bullets && item.bullets.length > 0 ? `
          <ul style="padding: 0; margin-top: 0.35rem; list-style: none;">
            ${item.bullets.map(b => `
              <li class="cv-block" style="display: flex; align-items: flex-start; margin-bottom: calc(var(--item-gap, 6px) / 2); list-style: none;">
                <span style="display: inline-block; width: 5px; height: 5px; background-color: var(--circle-color, var(--text-color-light)); border-radius: 50%; margin: 7px 0.45rem 0 0; flex-shrink: 0;"></span>
                <span style="flex: 1;">${renderRichHTML(b)}</span>
              </li>
            `).join('')}
          </ul>
        ` : ''}
      </div>
    </div>
  `;
};

/**
 * Renders a section to clean static HTML
 */
const renderSectionHTML = (section) => {
  if (!section) return '';

  const sectionClass = section.type === 'skills' 
    ? 'skills' 
    : section.type === 'education' 
      ? 'education' 
      : section.type === 'profile_header' 
        ? 'home' 
        : section.type === 'about' 
          ? 'profile' 
          : 'experience';

  const isProfile = section.type === 'profile_header';
  const items = section.items || [];

  let itemsHTML = '';
  if (section.type === 'simple_list' || section.type === 'skills') {
    itemsHTML = `
      <ul style="padding: 0; margin: 0; list-style: none;">
        ${items.map((item, index) => renderItemHTML(item, section.type, index === items.length - 1)).join('')}
      </ul>
    `;
  } else {
    itemsHTML = items.map((item, index) => renderItemHTML(item, section.type, index === items.length - 1)).join('');
  }

  return `
    <section class="${sectionClass} section cv-section" id="${escapeHTML(section.id)}">
      ${!isProfile && section.title ? `<h2 class="section-title">${renderRichHTML(section.title)}</h2>` : ''}
      <div class="${isProfile || section.type === 'about' ? '' : `${sectionClass}__container bd-grid`}">
        ${itemsHTML}
      </div>
    </section>
  `;
};

/**
 * Generates standalone clean static HTML for printing and PDF rendering.
 * Strips all interactive editor UI artifacts and guarantees 2-page print layout.
 * @param {Object} cvData 
 * @returns {string} Standalone HTML document string
 */
export const generateCleanPrintHTML = (cvData, lang = 'es') => {
  const data = cvData || {};
  const layout = data.layout || {};
  const docLang = lang || layout.language || data.activeLanguage || 'es';
  let rawSections = Array.isArray(data.sections) ? data.sections : [];

  let sections = rawSections;
  if (data.profile) {
    sections = rawSections.map(sec => {
      if (sec.id === 'profile_header' || sec.type === 'profile_header') {
        const firstItem = (sec.items && sec.items[0]) ? { ...sec.items[0] } : {};
        const mergedItem = {
          ...firstItem,
          ...(data.profile.name !== undefined ? { name: data.profile.name } : {}),
          ...(data.profile.subtitle !== undefined ? { subtitle: data.profile.subtitle } : {}),
          ...(data.profile.location !== undefined ? { location: data.profile.location } : {}),
          ...(data.profile.email !== undefined ? { email: data.profile.email } : {}),
          ...(data.profile.phone !== undefined ? { phone: data.profile.phone } : {}),
          ...(data.profile.linkedin !== undefined ? { linkedin: data.profile.linkedin } : {}),
          ...(data.profile.github !== undefined ? { github: data.profile.github } : {}),
        };
        return { ...sec, items: [mergedItem, ...(sec.items ? sec.items.slice(1) : [])] };
      }
      return sec;
    });
  }

  const is2Col = layout.type !== '1-column';
  const pagePadding = Number(layout.pagePadding ?? 24);
  const sectionGap = Number(layout.sectionGap ?? 20);
  const itemGap = Number(layout.itemGap ?? 8);

  const fontFamilies = {
    'Poppins': "'Poppins', sans-serif",
    'Inter': "'Inter', sans-serif",
    'Roboto': "'Roboto', sans-serif",
    'Merriweather': "'Merriweather', serif",
    'JetBrains Mono': "'JetBrains Mono', monospace"
  };
  const fontFamily = fontFamilies[layout.fontFamily] || layout.fontFamily || "'Poppins', sans-serif";
  const fontScale = layout.fontScale || 1.0;
  const titleScale = layout.titleScale || 1.0;
  const bodyScale = layout.bodyScale || 1.0;
  const listScale = layout.listScale || 1.0;
  const lineHeight = layout.lineHeight || 1.45;

  const leftBg = layout.leftBg || '#fafafa';
  const rightBg = layout.rightBg || '#ffffff';
  const leftColors = getDynamicTextColors(leftBg);
  const rightColors = getDynamicTextColors(rightBg);

  const leftSections = sections.filter(s => s.column === 'left');
  const rightSections = sections.filter(s => s.column === 'right');

  const leftColWidth = layout.leftColumnWidth;
  const gridColumns = leftColWidth ? `${leftColWidth}% ${100 - leftColWidth}%` : '1fr 2fr';

  let bodyContent = '';
  if (is2Col) {
    bodyContent = `
      <div class="resume" id="area-cv" style="display: grid; grid-template-columns: ${gridColumns}; width: 100%; max-width: 100%; margin: 0; padding: 0; box-shadow: none;">
        <div class="resume__left" style="background: ${leftBg}; padding: var(--page-padding, 1.5rem 1.25rem); --title-color: ${leftColors.titleColor}; --text-color: ${leftColors.textColor}; --text-color-light: ${leftColors.textColorLight}; --circle-color: ${leftColors.circleColor};">
          ${leftSections.map(renderSectionHTML).join('')}
        </div>
        <div class="resume__right" style="background: ${rightBg}; padding: var(--page-padding, 1.5rem 1.5rem); --title-color: ${rightColors.titleColor}; --text-color: ${rightColors.textColor}; --text-color-light: ${rightColors.textColorLight}; --circle-color: ${rightColors.circleColor};">
          ${rightSections.map(renderSectionHTML).join('')}
        </div>
      </div>
    `;
  } else {
    bodyContent = `
      <div class="resume resume__single-column" id="area-cv" style="width: 100%; max-width: 840px; margin: 0 auto; padding: var(--page-padding, 24px); background: #ffffff;">
        ${sections.map(renderSectionHTML).join('')}
      </div>
    `;
  }

  const profileName = stripHtml(data.profile?.name || '').trim();
  const profileSubtitle = stripHtml(data.profile?.subtitle || '').trim();
  const dynamicDocumentTitle = profileName && profileSubtitle
    ? `${profileName} - ${profileSubtitle}`
    : (profileName || profileSubtitle || 'Curriculum Vitae');

  return `<!DOCTYPE html>
<html lang="${escapeHTML(docLang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(dynamicDocumentTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">
  <style>
    :root {
      --page-padding: ${pagePadding}px;
      --section-gap: ${sectionGap}px;
      --item-gap: ${itemGap}px;
      --title-color: #0f172a;
      --text-color: #334155;
      --text-color-light: #64748b;
      --body-font: ${fontFamily};
      --font-scale: ${fontScale};
      --title-scale: ${titleScale};
      --body-scale: ${bodyScale};
      --list-scale: ${listScale};
      --line-height: ${lineHeight};
      --h1-font-size: calc(1.45rem * var(--font-scale, 1));
      --h2-font-size: calc(1.15rem * var(--font-scale, 1));
      --h3-font-size: calc(0.95rem * var(--font-scale, 1));
      --normal-font-size: calc(0.88rem * var(--font-scale, 1));
      --small-font-size: calc(0.82rem * var(--font-scale, 1));
      --smaller-font-size: calc(0.75rem * var(--font-scale, 1));

      --title-h1-size: calc(var(--h1-font-size) * var(--title-scale, 1));
      --title-h2-size: calc(var(--h2-font-size) * var(--title-scale, 1));
      --title-h3-size: calc(var(--h3-font-size) * var(--title-scale, 1));
      --title-subtitle-size: calc(var(--normal-font-size) * var(--title-scale, 1));

      --body-font-size: calc(var(--normal-font-size) * var(--body-scale, 1));
      --body-small-font-size: calc(var(--small-font-size) * var(--body-scale, 1));
      --body-smaller-font-size: calc(var(--smaller-font-size) * var(--body-scale, 1));

      --list-font-size: calc(var(--normal-font-size) * var(--list-scale, 1));
    }

    @page {
      size: A4;
      margin: 0;
    }

    *, ::before, ::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      width: 100%;
      margin: 0;
      padding: 0;
      font-family: var(--body-font);
      font-size: var(--normal-font-size);
      color: var(--text-color);
      background-color: #ffffff;
      line-height: 1.45;
      -webkit-font-smoothing: antialiased;
    }

    h1, h2, h3, h4, p, ul {
      margin: 0;
    }

    h1, h2, h3 {
      color: var(--title-color);
      font-weight: 600;
      break-after: avoid !important;
      page-break-after: avoid !important;
    }

    ul {
      list-style: none;
    }

    a {
      text-decoration: none;
      color: inherit;
    }

    .resume {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      box-shadow: none !important;
    }

    .resume__single-column {
      padding: var(--page-padding, ${pagePadding}px) !important;
    }

    .bd-grid {
      display: grid;
      gap: 0.75rem;
    }

    .section, .cv-section {
      padding: 0;
      margin-bottom: var(--section-gap, 18px) !important;
    }

    .section:last-of-type, .cv-section:last-of-type {
      margin-bottom: 0 !important;
    }

    .section-title {
      font-size: var(--title-h2-size, var(--h2-font-size));
      color: var(--title-color);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .2rem;
      margin-bottom: 0.6rem;
      text-align: left;
      break-after: avoid !important;
      page-break-after: avoid !important;
    }

    .home__title {
      font-size: var(--title-h1-size, var(--h1-font-size));
      margin-bottom: 0.2rem;
    }

    .home__subtitle {
      font-size: var(--title-subtitle-size, var(--normal-font-size));
      color: var(--text-color-light);
      margin-bottom: 0.4rem;
    }

    .social__container {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .social__link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: var(--body-small-font-size, var(--small-font-size));
      color: var(--text-color);
    }

    .education__time,
    .experience__time {
      padding-right: 0.75rem;
      position: relative;
    }

    .education__rounder,
    .experience__rounder {
      display: block;
      width: 13px;
      height: 13px;
      background-color: var(--text-color-light);
      border-radius: 50%;
      margin-top: 0.25rem;
    }

    .education__line,
    .experience__line {
      display: block;
      width: 2px;
      height: 100%;
      background-color: var(--text-color-light);
      transform: translate(5.5px, 0);
    }

    /* Global rule: Suppress timeline connector line on the last item of any list */
    .cv-block:last-child .experience__line,
    .cv-block:last-child .education__line,
    .cv-block:last-child [class*="__line"],
    .cv-block:last-of-type .experience__line,
    .cv-block:last-of-type .education__line,
    .cv-block:last-of-type [class*="__line"],
    .experience__content:last-child .experience__line,
    .experience__content:last-of-type .experience__line,
    .education__content:last-child .education__line,
    .education__content:last-of-type .education__line {
      display: none !important;
    }

    .education__title,
    .experience__title {
      font-size: var(--title-h3-size, var(--h3-font-size));
      color: var(--title-color);
    }

    .education__studies,
    .experience__company {
      font-size: var(--body-small-font-size, var(--small-font-size));
      color: var(--title-color);
    }

    .education__year {
      font-size: var(--body-smaller-font-size, var(--smaller-font-size));
      color: var(--text-color-light);
    }

    .experience__description,
    .profile__description {
      font-size: var(--body-font-size, var(--normal-font-size));
      margin-top: 0.25rem;
    }

    .experience__bullets li,
    .skills__name,
    .simple-list-item {
      font-size: var(--list-font-size, var(--normal-font-size));
    }

    /* Super-container CSS Page Break & Splitting Prevention */
    .cv-section,
    .cv-block,
    .section,
    .experience__content,
    .education__content,
    .skills__name {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    /* Orphan Header Protection */
    .section-title,
    h1,
    h2,
    h3 {
      break-after: avoid !important;
      page-break-after: avoid !important;
    }

    p, h1, h2, h3, li {
      orphans: 3;
      widows: 3;
    }

    @media print {
      @page {
        size: A4;
        margin: 0;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        background-color: #ffffff !important;
      }
      #area-cv {
        max-width: 100% !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0;
      }
      #area-cv.resume__single-column,
      .resume__single-column {
        padding: var(--page-padding, ${pagePadding}px) !important;
      }
      .cv-section,
      .cv-block,
      .section,
      .experience__content,
      .education__content,
      .skills__name {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      .section-title,
      h1,
      h2,
      h3 {
        break-after: avoid !important;
        page-break-after: avoid !important;
      }
    }
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
};

/**
 * Creates an isolated iframe, writes clean print HTML, calculates auto-scale,
 * triggers browser native print, and cleans up the DOM.
 * @param {Object} cvData 
 */
export const executeCleanPrint = (cvData, lang = 'es') => {
  return new Promise((resolve) => {
    const profileName = stripHtml(cvData?.profile?.name || '').trim();
    const profileSubtitle = stripHtml(cvData?.profile?.subtitle || '').trim();
    const dynamicDocumentTitle = profileName && profileSubtitle
      ? `${profileName} - ${profileSubtitle}`
      : (profileName || profileSubtitle || 'Curriculum Vitae');

    if (typeof document !== 'undefined' && dynamicDocumentTitle) {
      document.title = dynamicDocumentTitle;
    }

    const html = generateCleanPrintHTML(cvData, lang);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '794px';
    iframe.style.minWidth = '794px';
    iframe.style.height = '1123px';
    iframe.style.visibility = 'hidden';
    iframe.style.border = '0';
    iframe.setAttribute('title', 'Ressume Print Preview');

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      window.print();
      resolve();
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    const triggerPrint = async () => {
      try {
        if (iframe.contentWindow) {
          if (doc) {
            doc.title = dynamicDocumentTitle;
          }
          // Await font readiness with timeout fallback (max 1000ms)
          if (doc.fonts && typeof doc.fonts.ready?.then === 'function') {
            await Promise.race([
              doc.fonts.ready,
              new Promise((res) => setTimeout(res, 1000))
            ]);
          }

          const renderedHeight = doc.body?.scrollHeight || doc.documentElement?.scrollHeight || 1000;
          const scale = calculatePrintScale(renderedHeight);
          if (scale < 1.0 && doc.body) {
            doc.body.style.zoom = scale;
          }

          if (typeof iframe.contentWindow.focus === 'function') {
            iframe.contentWindow.focus();
          }
          if (typeof iframe.contentWindow.print === 'function') {
            iframe.contentWindow.print();
          } else {
            window.print();
          }
        }
      } catch (e) {
        console.warn('Iframe print failed, falling back to window.print()', e);
        window.print();
      } finally {
        resolve();
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 1000);
      }
    };

    if (iframe.contentWindow?.document?.readyState === 'complete') {
      triggerPrint();
    } else {
      iframe.onload = () => {
        triggerPrint();
      };
    }
  });
};

/**
 * Generates and triggers clean native PDF print dialog via executeCleanPrint.
 * @param {Object} cvData 
 * @param {string} lang 
 */
export const downloadPDF = async (cvData, lang = 'es') => {
  return executeCleanPrint(cvData, lang);
};

