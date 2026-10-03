/**
 * pageModelTypes.js
 *
 * Canonical type definitions and factory helpers for the immutable PageModel data structure.
 * Governs Editor-Native Discrete A4 Boxes (Invariant 15) and Zero Dynamic Reflow on Print (Invariant 16).
 */

/**
 * @typedef {Object} CVItem
 * @property {string} id - Unique item identifier (e.g. 'exp-1', 'edu-1')
 * @property {string} [title] - Primary title, role, degree or heading
 * @property {string} [subtitle] - Secondary title, company, institution or context
 * @property {string} [date] - Normalized date string or date range
 * @property {string} [description] - Rich or plain text body description
 * @property {Array<string>} [bulletPoints] - Itemized bullet points or achievements
 * @property {Array<Object>} [contacts] - Dynamic contact entries (for profile header)
 * @property {Array<Object>} [skills] - Categorized or tagged skills
 */

/**
 * @typedef {Object} CVSection
 * @property {string} id - Unique section identifier
 * @property {string} type - Section type registry key ('experience', 'education', 'skills', etc.)
 * @property {string} title - Human-readable section heading
 * @property {'left'|'right'} column - Column assignment for 2-column layout
 * @property {Array<CVItem>} items - Contained list of CV items
 * @property {Object} [properties] - Section-specific configuration flags
 * @property {boolean} [isContinuation] - True if this section is a continuation split from a previous page
 * @property {string} [originalSectionId] - Parent section ID when split across page folds
 */

/**
 * @typedef {Object} CVProfile
 * @property {string} name - Full candidate name
 * @property {string} title - Professional title or headline
 * @property {string} [summary] - Professional summary statement
 * @property {string} [photo] - Base64 data URI or image URL
 * @property {Array<Object>} [contacts] - Root level contact items
 */

/**
 * @typedef {Object} CVLayout
 * @property {'1-column'|'2-column'} type - Layout grid structure
 * @property {number} leftColumnWidth - Left column width percentage (typically 33.33)
 * @property {string} fontFamily - Active font family key (e.g. 'Poppins', 'Inter')
 * @property {number} fontScale - Universal typography scale factor (0.5 to 2.0)
 * @property {number} titleScale - Heading font scale factor
 * @property {number} bodyScale - Body font scale factor
 * @property {number} listScale - Bullet list font scale factor
 * @property {number} lineHeight - Relative line height (1.0 to 2.5)
 * @property {number} pagePadding - Outer sheet margin in pixels
 * @property {number} sectionGap - Vertical gap between sections in pixels
 * @property {number} itemGap - Vertical gap between items in pixels
 * @property {string} [leftBg] - Background color token or hex for left column
 * @property {string} [rightBg] - Background color token or hex for right column
 * @property {string} [language] - Active document language code ('es', 'en')
 */

/**
 * @typedef {Object} CVSnapshot
 * @property {CVProfile} profile - Candidate profile information
 * @property {Array<CVSection>} sections - Ordered collection of document sections
 * @property {CVLayout} layout - Global document layout and styling configuration
 * @property {Object} [metadata] - Version metadata, active dictionary, etc.
 */

/**
 * @typedef {Object} PageModel
 * @property {number} pageNumber - 1-based page index (1, 2, ...)
 * @property {number} totalPages - Total number of pages in the document
 * @property {boolean} isLastPage - True if this page is the final page of the document
 * @property {Array<CVSection>} leftSections - Sections assigned to the left column (2-column layout)
 * @property {Array<CVSection>} rightSections - Sections assigned to the right column (2-column layout)
 * @property {Array<CVSection>} singleSections - Sections assigned for ATS / single-column layout
 * @property {number} [estimatedHeightLeft] - Calculated pixel height of left column content
 * @property {number} [estimatedHeightRight] - Calculated pixel height of right column content
 */

/**
 * Canonical property keys guaranteed on all PageModel instances.
 * @type {ReadonlyArray<string>}
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
 * @param {Array<CVSection>} [params.leftSections=[]]
 * @param {Array<CVSection>} [params.rightSections=[]]
 * @param {Array<CVSection>} [params.singleSections=[]]
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
 * @returns {candidate is PageModel} True if candidate is a valid PageModel
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
