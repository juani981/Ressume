/**
 * richTextEngine.js
 * 
 * Shared utilities for rich text processing, alignment persistence,
 * HTML sanitization, and tokenization for cross-engine rendering
 * (DOM editor, staticHtmlPdfEngine, and React-PDF).
 */

/**
 * Escapes unsafe HTML characters into HTML entities
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
 * Extracts alignment from an HTML string or style attribute.
 * Supports: 'left', 'center', 'right', 'justify'. Defaults to 'left'.
 */
export const extractAlignment = (html) => {
  if (!html) return 'left';
  const match = /text-align:\s*(left|center|right|justify)/i.exec(String(html));
  return match ? match[1].toLowerCase() : 'left';
};

/**
 * Strips outer wrapper <div> added solely for alignment,
 * returning the detected alignment and inner HTML.
 */
export const stripOuterAlignment = (html) => {
  if (!html) return { alignment: 'left', innerHtml: '' };
  const str = String(html).trim();
  const outerMatch = /^<div\s+style=["']text-align:\s*(left|center|right|justify);?["']>([\s\S]*)<\/div>$/i.exec(str);
  if (outerMatch) {
    return {
      alignment: outerMatch[1].toLowerCase(),
      innerHtml: outerMatch[2]
    };
  }
  return {
    alignment: extractAlignment(str),
    innerHtml: str
  };
};

/**
 * Wraps or updates an HTML string with text-align style.
 * If alignment is 'left', avoids unnecessary wrapping.
 */
export const applyAlignment = (html, align = 'left') => {
  if (!html) return '';
  const trimmed = String(html).trim();
  if (!trimmed) return '';

  const { innerHtml } = stripOuterAlignment(trimmed);

  if (align && align !== 'left') {
    return `<div style="text-align: ${align.toLowerCase()};">${innerHtml}</div>`;
  }
  return innerHtml;
};

/**
 * Sanitizes rich text HTML:
 * - Preserves allowed formatting tags: <b>, <strong>, <i>, <em>, <u>, <br>, <div>, <p>, <span>
 * - Preserves text-align styles on containers
 * - Escapes unsafe tags (<script>, <img ...>, <iframe ...>, <svg ...>) and scripts into entities
 * - Escapes raw special characters in text nodes
 */
export const sanitizeRichHTML = (html) => {
  if (html === null || html === undefined) return '';
  const text = String(html);
  if (!text) return '';

  const tagRegex = /<(\/?[a-z0-9]+)([^>]*)>/gi;
  let lastIndex = 0;
  let result = '';
  let match;

  while ((match = tagRegex.exec(text)) !== null) {
    const textBefore = text.slice(lastIndex, match.index);
    if (textBefore) {
      result += escapeHTML(textBefore);
    }
    lastIndex = tagRegex.lastIndex;

    const fullTag = match[0];
    const tagName = match[1].toLowerCase();
    const attrs = match[2] || '';

    if (['b', '/b', 'strong', '/strong', 'i', '/i', 'em', '/em', 'u', '/u', 'br'].includes(tagName)) {
      result += `<${tagName}>`;
    } else if (['div', 'p', 'span'].includes(tagName)) {
      const alignMatch = /text-align:\s*(left|center|right|justify)/i.exec(attrs);
      if (alignMatch) {
        result += `<${tagName} style="text-align: ${alignMatch[1].toLowerCase()};">`;
      } else {
        result += `<${tagName}>`;
      }
    } else if (['/div', '/p', '/span'].includes(tagName)) {
      result += `<${tagName}>`;
    } else {
      // Escape unsafe tags like <script>, <img ...>, <iframe ...>
      result += escapeHTML(fullTag);
    }
  }

  const textRemaining = text.slice(lastIndex);
  if (textRemaining) {
    result += escapeHTML(textRemaining);
  }

  return result;
};

export const renderRichHTML = sanitizeRichHTML;

/**
 * Parses rich text into tokens and alignment for React-PDF consumption.
 */
export const parseHtmlToTokens = (html) => {
  if (!html) return { align: 'left', tokens: [] };
  const str = String(html);
  const align = extractAlignment(str);

  const normalized = str.replace(/<br\s*\/?>/gi, '\n');
  const splitTokens = normalized.split(/(<\/?(?:b|strong|i|em)>)/gi);

  let isBold = false;
  let isItalic = false;
  const tokens = [];

  for (const token of splitTokens) {
    const lower = token.toLowerCase();
    if (lower === '<b>' || lower === '<strong>') {
      isBold = true;
      continue;
    }
    if (lower === '</b>' || lower === '</strong>') {
      isBold = false;
      continue;
    }
    if (lower === '<i>' || lower === '<em>') {
      isItalic = true;
      continue;
    }
    if (lower === '</i>' || lower === '</em>') {
      isItalic = false;
      continue;
    }
    if (!token) continue;

    const cleanText = token.replace(/<[^>]*>/g, '');
    if (cleanText) {
      tokens.push({
        text: cleanText,
        bold: isBold,
        italic: isItalic
      });
    }
  }

  return { align, tokens };
};

/**
 * Strips all HTML tags and returns plain text.
 */
export const stripHtml = (html) => {
  if (html === null || html === undefined) return '';
  return String(html).replace(/<[^>]*>/g, '').trim();
};
