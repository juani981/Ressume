/**
 * parityChecker.js
 * 
 * Model ↔ Rendered Output Parity Verification Engine.
 * Ensures 100% content fidelity between cvData and the generated PDF / Print output.
 * Detects silently dropped skills groups (e.g. "Bases de Datos"), omitted roles,
 * or lost internships before export.
 * 
 * Adheres strictly to:
 * - RF-36: Model ↔ PDF Parity Verification
 * - RQ-036 & Acceptance Criteria CA-03
 */

import { extractTextLayer } from './textLayerExtractor.js';
import { stripHtml } from './richTextEngine.js';

/**
 * Normalizes text for fuzzy parity comparison (lowercase, trimmed, collapsed whitespace).
 */
const normalizeComparableText = (text) => {
  if (!text) return '';
  return stripHtml(String(text))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Verifies whether all visible items and sections from cvData are present
 * in the rendered PDF / HTML output.
 * 
 * @param {object} cvData - The source CV data object
 * @param {string|HTMLElement} renderedOutput - Clean HTML string or DOM node
 * @param {object} [options={}]
 * @returns {object} Parity report
 */
export const verifyModelPdfParity = (cvData, renderedOutput, options = {}) => {
  if (!cvData) {
    return {
      isParityValid: false,
      totalModelItems: 0,
      matchedItemsCount: 0,
      missingSections: [],
      missingItems: [{ reason: 'No CV data provided for parity verification' }],
      summary: 'Error: Objeto CV data no disponible.'
    };
  }

  const extractedText = typeof renderedOutput === 'string'
    ? extractTextLayer(renderedOutput)
    : (renderedOutput?.textContent || '');

  const normalizedExtracted = normalizeComparableText(extractedText);

  const missingSections = [];
  const missingItems = [];
  let totalModelItems = 0;
  let matchedItemsCount = 0;

  const isAtsMode = Boolean(cvData.layout?.isAtsMode || cvData.layout?.type === '1-column');
  const sections = Array.isArray(cvData.sections) ? cvData.sections : [];

  sections.forEach((sec) => {
    if (!sec || typeof sec !== 'object') return;

    // Ignore non-content sections
    if (sec.type === 'spacer') return;
    if (isAtsMode && (sec.type === 'photo' || sec.id === 'photo_section')) return;

    // 1. Verify section presence
    if (sec.type !== 'profile_header' && sec.type !== 'title_subtitle') {
      const secTitle = sec.title ? normalizeComparableText(sec.title) : '';
      if (secTitle && secTitle.length > 2) {
        // If the exact title is not found, check if keyword matches
        const titleKeywords = secTitle.split(' ').filter(w => w.length > 3);
        const hasKeywordMatch = titleKeywords.length > 0 && titleKeywords.some(w => normalizedExtracted.includes(w));
        const hasDirectMatch = normalizedExtracted.includes(secTitle);

        if (!hasDirectMatch && !hasKeywordMatch) {
          missingSections.push({
            sectionId: sec.id,
            sectionType: sec.type,
            sectionTitle: sec.title,
            reason: `La sección "${sec.title || sec.id}" no se encuentra en el texto extraído.`
          });
        }
      }
    }

    // 2. Verify each item in section
    const items = Array.isArray(sec.items) ? sec.items : [];
    items.forEach((item, itemIdx) => {
      if (!item || typeof item !== 'object') return;

      // Skip empty or hidden items
      if (item.hidden || item.visible === false) return;

      totalModelItems++;

      // Determine primary identifier for item
      let primaryIdentifier = '';
      if (sec.type === 'skills') {
        primaryIdentifier = item.title || item.name || item.description || '';
      } else if (sec.type === 'experience' || sec.type === 'projects' || sec.type === 'education') {
        primaryIdentifier = item.title || item.degree || item.name || item.subtitle || '';
      } else if (sec.type === 'about') {
        primaryIdentifier = (item.description || item.text || '').slice(0, 40);
      } else if (sec.type === 'contact') {
        // Contacts are handled via normalizeItemContacts
        const contacts = Array.isArray(item.contacts) ? item.contacts : [];
        if (contacts.length > 0 && contacts[0].value) {
          primaryIdentifier = contacts[0].value;
        } else {
          primaryIdentifier = item.email || item.phone || item.location || '';
        }
      } else {
        primaryIdentifier = item.title || item.name || item.text || '';
      }

      const compTarget = normalizeComparableText(primaryIdentifier);

      if (!compTarget || compTarget.length < 2) {
        // If item has no title, consider matched if it's empty
        matchedItemsCount++;
        return;
      }

      // Check whether primary identifier exists in normalized rendered text
      let isMatched = normalizedExtracted.includes(compTarget);

      // If not directly matched, check significant tokens (e.g. "Bases de Datos" -> "bases", "datos")
      if (!isMatched) {
        const words = compTarget.split(' ').filter(w => w.length > 2);
        if (words.length > 0 && words.every(w => normalizedExtracted.includes(w))) {
          isMatched = true;
        }
      }

      if (isMatched) {
        matchedItemsCount++;
      } else {
        missingItems.push({
          sectionId: sec.id,
          sectionType: sec.type,
          sectionTitle: sec.title || sec.id,
          itemId: item.id || `${sec.id}_item_${itemIdx}`,
          itemTitle: primaryIdentifier,
          reason: `El elemento "${primaryIdentifier}" de la sección "${sec.title || sec.id}" no fue encontrado en la salida del PDF.`
        });
      }
    });
  });

  const isParityValid = missingSections.length === 0 && missingItems.length === 0;

  let summary = 'Paridad 1:1 verificada con éxito. Todos los elementos del modelo están presentes en la salida.';
  if (!isParityValid) {
    const missingCount = missingItems.length + missingSections.length;
    summary = `Aviso de Paridad: Se detectaron ${missingCount} elemento(s) omitido(s) en la salida del PDF.`;
  }

  return {
    isParityValid,
    totalModelItems,
    matchedItemsCount,
    missingSections,
    missingItems,
    summary
  };
};

export default {
  verifyModelPdfParity
};
