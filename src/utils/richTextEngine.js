/**
 * richTextEngine.js
 * 
 * Shared utilities for rich text processing, alignment persistence,
 * HTML sanitization, live entity normalization, and tokenization for cross-engine
 * rendering (DOM editor, staticHtmlPdfEngine, and React-PDF).
 */

/**
 * Escapes unsafe HTML characters into HTML entities.
 * Kept for raw string escaping and strict test backward compatibility.
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
 * Standard HTML Entity map covering named entities for canonical decoding and normalization.
 */
export const HTML_ENTITIES_MAP = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00A0',
  iexcl: '¡',
  cent: '¢',
  pound: '£',
  curren: '¤',
  yen: '¥',
  brvbar: '¦',
  sect: '§',
  uml: '¨',
  copy: '©',
  ordf: 'ª',
  laquo: '«',
  not: '¬',
  shy: '\u00AD',
  reg: '®',
  macr: '¯',
  deg: '°',
  plusmn: '±',
  sup2: '²',
  sup3: '³',
  acute: '´',
  micro: 'µ',
  para: '¶',
  middot: '·',
  cedil: '¸',
  sup1: '¹',
  ordm: 'º',
  raquo: '»',
  frac14: '¼',
  frac12: '½',
  frac34: '¾',
  iquest: '¿',
  times: '×',
  divide: '÷',
  euro: '€',
  trade: '™',
  bull: '•',
  hellip: '…',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”'
};

const KNOWN_ENTITIES_PATTERN = Object.keys(HTML_ENTITIES_MAP).join('|');

/**
 * Standard entity normalizer:
 * Resolves malformed, unescaped, and multi-escaped entity artifacts:
 * - Chained ampersands (e.g. ;amp;amp, &amp;amp;, ;amp;amp;) -> &amp;
 * - Semicolon-prefixed entities (e.g. ;amp;, ;lt;, ;gt;, ;quot;, ;apos;, ;#38;) -> &...;
 * - Double-escaped entities (e.g. &amp;lt;, &amp;quot;, &amp;#38;) -> &...; (recursively unwrapped)
 */
export const normalizeHtmlEntities = (str) => {
  if (str === null || str === undefined) return '';
  let text = String(str);
  if (!text) return '';

  // 1. Double/multi-escaped entities: &amp;entity; -> &entity;
  // Unwrap recursively up to 5 passes until stable
  const doubleEntityPattern = /&amp;([a-zA-Z]+|#[0-9]{1,7}|#x[0-9a-fA-F]{1,6});/gi;
  let prev = '';
  let passes = 0;
  while (prev !== text && passes < 5) {
    prev = text;
    text = text.replace(doubleEntityPattern, '&$1;');
    passes++;
  }

  // 2. Corrupt chained ampersand variants (e.g. ;amp;amp, ;amp;amp;, ;amp;;amp, &amp;;amp;)
  text = text.replace(/;+(?:amp;*){2,}/gi, '&amp;');
  text = text.replace(/&amp;;+amp;?/gi, '&amp;');
  text = text.replace(/&amp;amp;?/gi, '&amp;');

  // 3. Semicolon-prefixed entity without leading & (e.g. ;amp;, ;amp, ;lt;, ;gt;, ;#38;)
  // Must NOT be preceded by & (to avoid splitting valid entities)
  const semiPrefixPattern = new RegExp(
    `(?:^|(?<=[^&]))(;+)(${KNOWN_ENTITIES_PATTERN}|#[0-9]{1,7}|#x[0-9a-fA-F]{1,6})(?:;|(?=[^a-zA-Z0-9#]|$))`,
    'gi'
  );
  text = text.replace(semiPrefixPattern, '&$2;');

  return text;
};

/**
 * Canonicalizes HTML entities into raw Unicode characters.
 */
export const decodeHtmlEntities = (str) => {
  if (str === null || str === undefined) return '';
  let text = normalizeHtmlEntities(String(str));

  // Decode named entities
  text = text.replace(/&([a-zA-Z]+);/g, (match, entityName) => {
    const lower = entityName.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(HTML_ENTITIES_MAP, lower)) {
      return HTML_ENTITIES_MAP[lower];
    }
    return match;
  });

  // Decode decimal numeric entities
  text = text.replace(/&#([0-9]{1,7});/g, (match, dec) => {
    try {
      const code = parseInt(dec, 10);
      return String.fromCodePoint(code);
    } catch (e) {
      return match;
    }
  });

  // Decode hexadecimal numeric entities
  text = text.replace(/&#x([0-9a-fA-F]{1,6});/g, (match, hex) => {
    try {
      const code = parseInt(hex, 16);
      return String.fromCodePoint(code);
    } catch (e) {
      return match;
    }
  });

  return text;
};

/**
 * Safely escapes text inside HTML text nodes:
 * - Normalizes corrupt/malformed entities first
 * - Escapes raw <, >, ", '
 * - Escapes lone/unescaped & without re-escaping already valid HTML entities
 * - 100% idempotent: escapeTextNode(escapeTextNode(x)) === escapeTextNode(x)
 */
export const escapeTextNode = (str) => {
  if (str === null || str === undefined) return '';
  let text = normalizeHtmlEntities(String(str));
  if (!text) return '';

  return text
    .replace(/&(?!(?:[a-zA-Z]+|#[0-9]{1,7}|#x[0-9a-fA-F]{1,6});)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Fast detection of malformed, corrupt, or double-escaped entity patterns.
 */
export const hasMalformedEntities = (str) => {
  if (!str) return false;
  return new RegExp(
    `;+(?:amp;*){2,}|&amp;;+amp|&amp;amp|&amp;(?:${KNOWN_ENTITIES_PATTERN}|#[0-9]{1,7}|#x[0-9a-fA-F]{1,6});|(?:^|(?<=[^&]))(?:;+)(${KNOWN_ENTITIES_PATTERN}|#[0-9]{1,7}|#x[0-9a-fA-F]{1,6})(?:;|(?=[^a-zA-Z0-9#]|$))`,
    'i'
  ).test(String(str));
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
 * - Escapes unsafe tags (<script>, <img ...>, <iframe ...>, <svg ...>) into safe entities
 * - Normalizes corrupt/malformed entities and safely escapes text nodes
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
      result += escapeTextNode(textBefore);
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
    result += escapeTextNode(textRemaining);
  }

  return result;
};

export const cleanLiveEditorHtml = sanitizeRichHTML;
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
        text: decodeHtmlEntities(cleanText),
        bold: isBold,
        italic: isItalic
      });
    }
  }

  return { align, tokens };
};

/**
 * Strips all HTML tags, decodes entities, and returns plain text.
 */
export const stripHtml = (html) => {
  if (html === null || html === undefined) return '';
  return decodeHtmlEntities(String(html).replace(/<[^>]*>/g, '').trim());
};
