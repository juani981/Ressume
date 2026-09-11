/**
 * @file useCVExport.js
 * @description Hook managing ephemeral toast notifications and clean PDF export / JSON download pipelines.
 */
import { useState, useCallback, useRef } from 'react';
import { executeCleanPrint } from '../../utils/staticHtmlPdfEngine';

/**
 * Hook managing toast notifications and document export actions (PDF & JSON).
 * @returns {Object} Toast state, toast controls, exportCleanPDF, and exportJSON.
 */
export const useCVExport = () => {
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  const showToast = useCallback((text, type = 'info', duration = 2800) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    const newToast = { id: Date.now(), text, type };
    setToast(newToast);
    if (duration > 0) {
      toastTimeoutRef.current = setTimeout(() => setToast(null), duration);
    }
  }, []);

  const hideToast = useCallback(() => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(null);
  }, []);

  const exportCleanPDF = useCallback(async (cvData, activeLanguage = 'es') => {
    if (isExporting) return;
    setIsExporting(true);
    showToast('Generando PDF optimizado y preparando impresión...', 'loading', 0);

    let isFinished = false;
    let focusTimeout = null;
    let fallbackTimeout = null;

    const onControlReturned = () => {
      if (isFinished) return;
      isFinished = true;
      if (focusTimeout) clearTimeout(focusTimeout);
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      if (typeof window !== 'undefined') {
        window.removeEventListener('afterprint', onControlReturned);
        window.removeEventListener('print-dialog-closed', onControlReturned);
        window.removeEventListener('focus', onControlReturned);
      }
      setIsExporting(false);
      showToast('¡Documento PDF procesado correctamente!', 'success', 3500);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('afterprint', onControlReturned, { once: true });
      window.addEventListener('print-dialog-closed', onControlReturned, { once: true });
      focusTimeout = setTimeout(() => {
        if (!isFinished) window.addEventListener('focus', onControlReturned, { once: true });
      }, 1200);
      fallbackTimeout = setTimeout(() => onControlReturned(), 8000);
    }

    try {
      await executeCleanPrint(cvData, activeLanguage);
    } catch (e) {
      console.warn('executeCleanPrint fallback', e);
      if (typeof window !== 'undefined') window.print();
      onControlReturned();
    }
  }, [isExporting, showToast]);

  const exportJSON = useCallback((cvData) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cvData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${cvData?.profile?.name?.replace(/\s+/g, '_') || 'cv'}_backup.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('CV exportado en formato JSON correctamente', 'success', 2500);
  }, [showToast]);

  return {
    toast,
    showToast,
    hideToast,
    isExporting,
    exportCleanPDF,
    exportJSON,
  };
};

export default useCVExport;
