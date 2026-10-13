/**
 * @file bidirectionalPromptContract.js
 * @description Contract and registry architecture for bidirectional AI prompts.
 * Unifies input/output transformation workflows (Translation, BYO-CV, Rewrites, etc.)
 * under a single, extensible, and type-safe interface.
 */

import { cleanAndParseRawJSON, normalizeAnyJSONToCVSnapshot } from '../../utils/universalJsonImporter';
import { ensureContactSectionWithFallback } from '../../utils/cvSchemaValidator';
import { getLanguageLegend } from '../../utils/aiExporter';
import { saveVersion } from '../../utils/versionStorage';
import { generateThumbnail } from '../../utils/thumbnailGenerator';

/**
 * Standard Naming format for automatic pre-transformation backups:
 * [subtitulo + Nombre][Backup][idioma]
 * 
 * @param {object} cvData 
 * @param {string} activeLanguage 
 * @returns {string} Formatted backup title
 */
export function formatBackupVersionTitle(cvData, activeLanguage = 'es') {
  const subtitle = cvData?.profile?.subtitle || cvData?.profile?.title || '';
  const name = cvData?.profile?.name || 'CV';
  const langLegend = getLanguageLegend(activeLanguage || 'es');
  const label = subtitle ? `${subtitle} - ${name}` : name;
  return `[${label}][Backup][${langLegend}]`;
}

/**
 * Executes automatic version backup in the Version Manager
 * adhering to the strict [subtitulo + Nombre][Backup][idioma] invariant.
 * 
 * @param {object} cvData 
 * @param {string} activeLanguage 
 * @returns {Promise<string>} The saved backup version title
 */
export async function executeAutoBackup(cvData, activeLanguage = 'es') {
  const backupTitle = formatBackupVersionTitle(cvData, activeLanguage);
  try {
    const snapshotToSave = {
      ...cvData,
      versionName: backupTitle,
      activeVersionName: backupTitle
    };
    const thumbnail = await generateThumbnail(snapshotToSave);
    await saveVersion(backupTitle, snapshotToSave, thumbnail);
  } catch (err) {
    console.warn('executeAutoBackup warning:', err);
  }
  return backupTitle;
}

/**
 * @typedef {Object} BidirectionalPromptHandler
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {boolean} requiresJsonResponse
 * @property {(cvData: object, options?: object) => string} [buildPrompt]
 * @property {(rawResponse: string, options?: object) => { isValid: boolean, cvData?: object, error?: string, raw?: any }} parseAndValidate
 * @property {(parsedData: object, options?: object) => string} getNewVersionTitle
 */

/**
 * Handler registry for bidirectional prompt contracts
 */
const registry = new Map();

/**
 * Register a bidirectional prompt handler
 * @param {BidirectionalPromptHandler} handler 
 */
export function registerBidirectionalHandler(handler) {
  if (!handler || !handler.id) {
    throw new Error('Invalid BidirectionalPromptHandler: id is required.');
  }
  registry.set(handler.id, handler);
}

/**
 * Retrieve a bidirectional prompt handler by ID
 * @param {string} id 
 * @returns {BidirectionalPromptHandler | null}
 */
export function getBidirectionalHandler(id) {
  return registry.get(id) || null;
}

/**
 * Check if a prompt ID has a registered bidirectional handler
 * @param {string} id 
 * @returns {boolean}
 */
export function isBidirectionalPrompt(id) {
  return registry.has(id);
}

// ============================================================================
// Built-in Handlers Registration
// ============================================================================

// 1. Handler: Translate English / Cultural Localization (translate_english)
registerBidirectionalHandler({
  id: 'translate_english',
  name: 'Traducir CV al Inglés (US Tech)',
  category: 'localization',
  requiresJsonResponse: true,
  parseAndValidate: (rawResponse) => {
    try {
      const parsed = cleanAndParseRawJSON(rawResponse);
      if (!parsed || typeof parsed !== 'object') {
        return {
          isValid: false,
          error: 'No se pudo encontrar un JSON válido en la respuesta pegada. Asegúrate de copiar el bloque ```json ... ``` devuelto por la IA.'
        };
      }
      const validatedCV = normalizeAnyJSONToCVSnapshot(parsed);
      if (!validatedCV) {
        return {
          isValid: false,
          error: 'El JSON devuelto no cumple con la estructura de currículum válida requerida por Ressume.'
        };
      }
      return { isValid: true, cvData: validatedCV, raw: parsed };
    } catch (err) {
      return { isValid: false, error: err.message || 'Error de parseo JSON.' };
    }
  },
  getNewVersionTitle: (validatedCV, options = {}) => {
    const targetLang = options.targetLang || 'en';
    const langLegend = getLanguageLegend(targetLang);
    const candidateName = validatedCV?.profile?.name || options.fallbackName || 'CV';
    const subtitle = validatedCV?.profile?.subtitle || validatedCV?.profile?.title || '';
    const label = subtitle ? `${subtitle} - ${candidateName}` : candidateName;
    return `[${label}][${langLegend}]`;
  }
});

// 2. Handler: Bring Your Own CV (bring_your_own_cv)
registerBidirectionalHandler({
  id: 'bring_your_own_cv',
  name: 'Trae tu propio CV (PDF a ATS)',
  category: 'conversion',
  requiresJsonResponse: true,
  parseAndValidate: (rawResponse) => {
    try {
      const parsed = cleanAndParseRawJSON(rawResponse);
      if (!parsed || typeof parsed !== 'object') {
        return {
          isValid: false,
          error: 'No se pudo encontrar un JSON válido en la respuesta pegada. Asegúrate de copiar el bloque ```json ... ``` devuelto por la IA.'
        };
      }
      const rawValidated = normalizeAnyJSONToCVSnapshot(parsed);
      const validatedCV = rawValidated ? ensureContactSectionWithFallback(rawValidated, parsed.language || parsed.layout?.language) : null;
      if (!validatedCV) {
        return {
          isValid: false,
          error: 'El JSON devuelto no cumple con la estructura de currículum requerida para la conversión ATS. Intentá nuevamente'
        };
      }
      return { isValid: true, cvData: validatedCV, raw: parsed };
    } catch (err) {
      return { isValid: false, error: err.message || 'Error al validar estructura de CV.' };
    }
  },
  getNewVersionTitle: (validatedCV, options = {}) => {
    const candidateName = validatedCV?.profile?.name || options.fallbackName || 'CV';
    const subtitle = validatedCV?.profile?.subtitle || validatedCV?.profile?.title || '';
    const label = subtitle ? `${subtitle} - ${candidateName}` : candidateName;
    return `[${label}][IMPORT]`;
  }
});
