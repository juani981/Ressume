/**
 * src/utils/versionValidator.js
 *
 * Facade exporting CV schema validation and sanitization utilities.
 * Powered by declarative cvSchemaValidator engine.
 */

export {
  validateCVSnapshot,
  sanitizeAndValidateCVSnapshot,
  ALLOWED_LAYOUT_TYPES,
  ALLOWED_COLUMNS,
  ALLOWED_FONT_FAMILIES,
  NUMERIC_BOUNDS,
} from './cvSchemaValidator.js';

import { sanitizeAndValidateCVSnapshot } from './cvSchemaValidator.js';
export default sanitizeAndValidateCVSnapshot;
