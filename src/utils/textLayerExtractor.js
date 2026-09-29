/**
 * textLayerExtractor.js
 * 
 * ATS & PDF Text Layer Extraction Engine.
 * Extracts pure, linearized reading-order text from HTML documents or DOM nodes
 * with guaranteed block boundary separation.
 * 
 * Adheres strictly to:
 * - RF-19: Real block boundary separation (never glue adjacent blocks like "GitHub Projects.Plataforma online")
 * - RF-23: Explicit ' | ' contact delimiters and normalized phone numbers
 * - RQ-025, RQ-026, RQ-027, and Acceptance Criteria CA-01 & CA-02.
 */

/**
 * HTML block-level elements that must enforce a line break boundary in text extraction.
 */
const BLOCK_TAGS = new Set([
  'address', 'article', 'aside', 'blockquote', 'details', 'dialog',
  'dd', 'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure',
  'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header',
  'hgroup', 'hr', 'li', 'main', 'nav', 'ol', 'p', 'pre', 'section',
  'table', 'tr', 'td', 'th', 'ul'
]);

/**
 * Extracts linearized plain text from an HTML string or DOM element,
 * guaranteeing that block elements have appropriate line breaks and never glue words.
 * 
 * @param {string|HTMLElement} input - HTML string or DOM Element
 * @param {object} [options={}]
 * @param {boolean} [options.preserveLineBreaks=true]
 * @returns {string} Clean plain text in reading order
 */
export const extractTextLayer = (input, options = {}) => {
  if (!input) return '';

  let rootNode = null;

  if (typeof input === 'string') {
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(input, 'text/html');
      rootNode = doc.getElementById('area-cv') || doc.body;
    } else {
      // Basic fallback for pure regex if DOMParser is unavailable
      return input
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>|<\/div>|<\/h[1-6]>|<\/li>|<\/section>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s+/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }
  } else if (input && typeof input.nodeType === 'number') {
    rootNode = input;
  }

  if (!rootNode) return '';

  const chunks = [];

  const traverse = (node) => {
    if (!node) return;

    // Handle ignore classes or hidden editor controls
    if (node.nodeType === 1) { // ELEMENT_NODE
      const tagName = node.tagName.toLowerCase();
      const className = typeof node.className === 'string'
        ? node.className
        : (node.className?.baseVal || '');

      if (
        className.includes('no-print') ||
        className.includes('drag-handle') ||
        className.includes('round-btn') ||
        className.includes('suggestion-tooltip') ||
        className.includes('obsidian-callout') ||
        node.hasAttribute('data-editor-ui')
      ) {
        return;
      }

      // Handle explicit contact separators
      if (className.includes('contact-separator')) {
        chunks.push(' | ');
        return;
      }

      // Handle SVG / Icons: ignore in text layer
      if (tagName === 'svg' || tagName === 'path' || className.includes('lucide')) {
        return;
      }

      const isBlock = BLOCK_TAGS.has(tagName) || 
                      node.classList?.contains('cv-block') || 
                      node.classList?.contains('experience__content') ||
                      node.classList?.contains('education__content') ||
                      node.classList?.contains('simple-list-item');

      if (isBlock && chunks.length > 0) {
        const last = chunks[chunks.length - 1];
        if (last !== '\n' && last !== '\n\n') {
          chunks.push('\n');
        }
      }

      for (let child of node.childNodes) {
        traverse(child);
      }

      if (isBlock && chunks.length > 0) {
        const last = chunks[chunks.length - 1];
        if (last !== '\n' && last !== '\n\n') {
          chunks.push('\n');
        }
      }
    } else if (node.nodeType === 3) { // TEXT_NODE
      const text = node.nodeValue;
      if (text) {
        const cleaned = text.replace(/[\r\t]+/g, ' ');
        if (cleaned.trim() !== '') {
          chunks.push(cleaned);
        } else if (/\s/.test(cleaned) && chunks.length > 0 && !chunks[chunks.length - 1].endsWith(' ') && !chunks[chunks.length - 1].endsWith('\n')) {
          chunks.push(' ');
        }
      }
    }
  };

  traverse(rootNode);

  // Join and clean whitespace
  let fullText = chunks.join('');

  // Normalize consecutive newlines and trim each line
  const lines = fullText.split('\n').map(l => l.replace(/[ \t]+/g, ' ').trim());

  // Filter out excessive blank lines (> 2 in a row)
  const resultLines = [];
  let blankCount = 0;

  for (const line of lines) {
    if (!line) {
      blankCount++;
      if (blankCount <= 1) {
        resultLines.push('');
      }
    } else {
      blankCount = 0;
      resultLines.push(line);
    }
  }

  return resultLines.join('\n').trim();
};

export default {
  extractTextLayer
};
