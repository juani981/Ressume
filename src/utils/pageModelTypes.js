/**
 * pageModelTypes.js
 *
 * Canonical type definitions and factory helpers for the immutable PageModel data structure.
 * Governs Editor-Native Discrete A4 Boxes (Invariant 15) and Zero Dynamic Reflow on Print (Invariant 16).
 */

/**
 * @typedef {Object} PageModel
 * @property {number} pageNumber - 1-based page index (1, 2, ...)
 * @property {number} totalPages - Total number of pages in the document
 * @property {boolean} isLastPage - True if this page is the final page of the document
 * @property {Array<Object>} leftSections - Sections assigned to the left column (2-column layout)
 * @property {Array<Object>} rightSections - Sections assigned to the right column (2-column layout)
 * @property {Array<Object>} singleSections - Sections assigned for ATS / single-column layout
 */

export const PAGE_MODEL_KEYS = Object.freeze([
  'pageNumber',
  'totalPages',
  'isLastPage',
  'leftSections',
  'rightSections',
  'singleSections',
]);

/**
 * Creates a canonical, frozen PageModel instance.
 *
 * @param {Object} [params={}]
 * @param {number} [params.pageNumber=1]
 * @param {number} [params.totalPages=1]
 * @param {boolean} [params.isLastPage=true]
 * @param {Array<Object>} [params.leftSections=[]]
 * @param {Array<Object>} [params.rightSections=[]]
 * @param {Array<Object>} [params.singleSections=[]]
 * @returns {PageModel} Frozen immutable PageModel
 */
export function createPageModel({
  pageNumber = 1,
  totalPages = 1,
  isLastPage = (pageNumber === totalPages),
  leftSections = [],
  rightSections = [],
  singleSections = [],
} = {}) {
  const normPageNumber = Math.max(1, Math.floor(Number(pageNumber) || 1));
  const normTotalPages = Math.max(normPageNumber, Math.floor(Number(totalPages) || normPageNumber));
  const normIsLastPage = typeof isLastPage === 'boolean' ? isLastPage : (normPageNumber === normTotalPages);

  return Object.freeze({
    pageNumber: normPageNumber,
    totalPages: normTotalPages,
    isLastPage: normIsLastPage,
    leftSections: Object.freeze(Array.isArray(leftSections) ? [...leftSections] : []),
    rightSections: Object.freeze(Array.isArray(rightSections) ? [...rightSections] : []),
    singleSections: Object.freeze(Array.isArray(singleSections) ? [...singleSections] : []),
  });
}

/**
 * Validates that an object conforms to the canonical PageModel contract.
 *
 * @param {any} candidate
 * @returns {boolean} True if candidate is a valid PageModel
 */
export function isValidPageModel(candidate) {
  if (!candidate || typeof candidate !== 'object') return false;
  return (
    typeof candidate.pageNumber === 'number' &&
    candidate.pageNumber >= 1 &&
    typeof candidate.totalPages === 'number' &&
    candidate.totalPages >= candidate.pageNumber &&
    typeof candidate.isLastPage === 'boolean' &&
    Array.isArray(candidate.leftSections) &&
    Array.isArray(candidate.rightSections) &&
    Array.isArray(candidate.singleSections)
  );
}

/**
 * Deep freezes an object or array recursively to guarantee complete immutability.
 *
 * @template T
 * @param {T} obj
 * @returns {T} Deeply frozen object
 */
export function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Object.isFrozen(obj)) {
    return obj;
  }

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      deepFreeze(obj[i]);
    }
    return Object.freeze(obj);
  }

  const propNames = Object.getOwnPropertyNames(obj);
  for (const name of propNames) {
    const value = obj[name];
    if (value && typeof value === 'object') {
      deepFreeze(value);
    }
  }

  return Object.freeze(obj);
}
