/**
 * pdfTitleService.js
 * 
 * Sanitization and deterministic filename / title generation for CV exports.
 */

import { stripHtml } from '../../utils/richTextEngine';

/**
 * Sanitizes a string for use as a safe, cross-platform PDF file name.
 * 
 * @param {string} name
 * @returns {string} Sanitized filename
 */
export const sanitizeFileName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+|\.+$/g, '');
};

/**
 * Generates standardized PDF filename / document title based on active version or defaults.
 * 
 * @param {Object} cvData 
 * @returns {string} Safe document title / filename
 */
export const getDynamicPdfTitle = (cvData) => {
  if (!cvData || typeof cvData !== 'object') return 'CV';

  // 1. Check if a saved version name is loaded or active
  const candidateVersionName = (
    (typeof cvData.versionName === 'string' && cvData.versionName.trim()) ||
    (typeof cvData.activeVersionName === 'string' && cvData.activeVersionName.trim()) ||
    (typeof cvData.layout?.versionName === 'string' && cvData.layout?.versionName.trim()) ||
    ''
  );

  if (candidateVersionName) {
    const sanitized = sanitizeFileName(candidateVersionName);
    if (sanitized) return sanitized;
  }

  // 2. Default: "CV_${profileName}_${profileSubtitle}"
  const rawProfileName = (
    cvData.profile?.name ||
    cvData.sections?.find((s) => s.id === 'profile_header' || s.type === 'profile_header' || s.type === 'title_subtitle')?.items?.[0]?.name ||
    ''
  );
  const rawProfileSubtitle = (
    cvData.profile?.subtitle ||
    cvData.sections?.find((s) => s.id === 'profile_header' || s.type === 'profile_header' || s.type === 'title_subtitle')?.items?.[0]?.subtitle ||
    ''
  );

  const profileName = stripHtml(rawProfileName).trim();
  const profileSubtitle = stripHtml(rawProfileSubtitle).trim();

  let defaultTitle = 'CV';
  if (profileName && profileSubtitle) {
    defaultTitle = `CV_${profileName}_${profileSubtitle}`;
  } else if (profileName) {
    defaultTitle = `CV_${profileName}`;
  } else if (profileSubtitle) {
    defaultTitle = `CV_${profileSubtitle}`;
  }

  return sanitizeFileName(defaultTitle) || 'CV';
};
