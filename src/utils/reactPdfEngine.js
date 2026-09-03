import React from 'react';
import { pdf } from '@react-pdf/renderer';
import CVDocument from '../components/PDF/CVDocument';
import { defaultSchema } from './schema';

/**
 * Creates an ObjectURL safely across browser and test/JSDOM environments.
 * @param {Blob} blob 
 * @returns {string|null}
 */
const safeCreateObjectURL = (blob) => {
  if (typeof window !== 'undefined' && window.URL && typeof window.URL.createObjectURL === 'function') {
    return window.URL.createObjectURL(blob);
  }
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    return URL.createObjectURL(blob);
  }
  return null;
};

/**
 * Revokes an ObjectURL safely across environments.
 * @param {string} url 
 */
const safeRevokeObjectURL = (url) => {
  if (!url) return;
  if (typeof window !== 'undefined' && window.URL && typeof window.URL.revokeObjectURL === 'function') {
    window.URL.revokeObjectURL(url);
  } else if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url);
  }
};

/**
 * Normalizes cvData to ensure complete, valid schema structure for PDF rendering.
 * @param {Object} data 
 * @returns {Object}
 */
export const normalizeCvDataForPdf = (data) => {
  if (!data || typeof data !== 'object') {
    return defaultSchema;
  }

  return {
    ...defaultSchema,
    ...data,
    profile: {
      ...(defaultSchema.profile || {}),
      ...(data.profile || {})
    },
    layout: {
      ...defaultSchema.layout,
      ...(data.layout || {})
    },
    sections: Array.isArray(data.sections) ? data.sections : []
  };
};

/**
 * Compiles cvData into a selectable vector PDF Blob client-side.
 * Operates completely offline with 0 external network requests.
 * 
 * @param {Object} cvData - Current CV state object
 * @param {string} lang - Active language code ('es' | 'en')
 * @returns {Promise<Blob>} Selectable vector PDF Blob
 */
export const renderPdfBlob = async (cvData, lang = 'es') => {
  const safeData = normalizeCvDataForPdf(cvData);
  const doc = React.createElement(CVDocument, { cvData: safeData, lang });
  const blob = await pdf(doc).toBlob();
  return blob;
};

/**
 * Renders cvData to a PDF blob, generates an ObjectURL, triggers browser download,
 * and handles toast notification.
 * 
 * @param {Object} cvData - Current CV state object
 * @param {string} lang - Active language code ('es' | 'en')
 * @param {Object} options - Optional configuration { filename, showToast }
 * @returns {Promise<Blob>} The generated PDF Blob
 */
export const generateAndDownloadPdf = async (cvData, lang = 'es', options = {}) => {
  const blob = await renderPdfBlob(cvData, lang);

  // Derive sanitized filename from candidate name or fallback
  const candidateName = 
    cvData?.profile?.name || 
    (cvData?.sections?.find(s => s.type === 'profile_header')?.items?.[0]?.name) || 
    'Curriculum_Vitae';
  
  const cleanName = candidateName
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'Curriculum_Vitae';
  const filename = options.filename || `CV_${cleanName}.pdf`;

  // Trigger browser download via anchor element if DOM is available
  const blobUrl = safeCreateObjectURL(blob);
  if (blobUrl && typeof document !== 'undefined' && document.createElement && document.body) {
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => safeRevokeObjectURL(blobUrl), 2500);
  }

  // Trigger optional toast feedback callback if provided
  if (typeof options.showToast === 'function') {
    const successMsg = lang === 'en' ? 'PDF generated successfully' : 'PDF generado con éxito';
    options.showToast(successMsg, 'success');
  }

  return blob;
};

export default {
  normalizeCvDataForPdf,
  renderPdfBlob,
  generateAndDownloadPdf,
};
