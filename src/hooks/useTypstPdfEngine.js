/**
 * useTypstPdfEngine.js
 * Hook React que orquesta el Web Worker de Typst WASM para exportación PDF.
 *
 * Características:
 *  - Lazy-inicializa el Worker en el primer uso (los ~13MB WASM no se descargan
 *    hasta que el usuario hace clic por primera vez).
 *  - Anti-stale: cada compilación tiene un ID monotónico; resultados de
 *    compilaciones previas son descartados automáticamente.
 *  - Las fuentes se fetchean desde /fonts/ y se pasan al Worker como ArrayBuffer.
 *  - El PDF resultante se descarga automáticamente con el nombre derivado del CV.
 */

import { useState, useRef, useCallback } from 'react';
import { cvDataToTypst } from '../utils/cvDataToTypst';
import { getDynamicPdfTitle } from '../utils/staticHtmlPdfEngine';

/**
 * Fuentes locales a incrustar en el PDF Typst.
 * Deben existir en public/fonts/ para funcionar offline.
 * El Worker intentará cargar cada una; las que fallen (404) son ignoradas.
 * Mezcla de .woff2 (descargados de Google Fonts) y .ttf (GitHub).
 */
const FONT_PATHS = [
  '/fonts/Poppins-Regular.woff2',
  '/fonts/Poppins-Medium.woff2',
  '/fonts/Poppins-SemiBold.woff2',
  '/fonts/Poppins-Bold.woff2',
  '/fonts/Inter-Regular.woff2',
  '/fonts/Roboto-Regular.woff2',
  '/fonts/Roboto-Medium.woff2',
  '/fonts/Roboto-Bold.woff2',
  '/fonts/Merriweather-Bold.woff2',
  '/fonts/Merriweather-Regular.ttf',
  '/fonts/JetBrainsMono-Regular.ttf',
  '/fonts/JetBrainsMono-Bold.ttf',
];

export const useTypstPdfEngine = () => {
  const workerRef        = useRef(null);
  const initializedRef   = useRef(false);
  const initPromiseRef   = useRef(null);   // Para deduplicar llamadas concurrentes a initWorker
  const compileIdRef     = useRef(0);

  const [isExporting,   setIsExporting]   = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error,          setError]          = useState(null);

  /**
   * Carga todas las fuentes locales como ArrayBuffer.
   * Las fuentes que fallen (404 o error de red) son silenciosamente ignoradas.
   */
  const loadFonts = useCallback(async () => {
    const results = await Promise.allSettled(
      FONT_PATHS.map(path =>
        fetch(path).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null)
      )
    );
    return results
      .map(r => r.status === 'fulfilled' ? r.value : null)
      .filter(Boolean);
  }, []);

  /**
   * Inicializa el Worker y el compilador WASM.
   * Solo se ejecuta una vez; llamadas subsecuentes devuelven el Worker existente.
   * Usa una Promise cache para evitar inicializaciones concurrentes.
   */
  const initWorker = useCallback(async () => {
    // Ya inicializado: retornar inmediatamente
    if (initializedRef.current && workerRef.current) {
      return workerRef.current;
    }

    // Inicialización en progreso: esperar la Promise existente
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    setIsInitializing(true);

    initPromiseRef.current = (async () => {
      try {
        // Lazy import del Worker (Vite genera un chunk separado con el WASM)
        const TypstWorkerModule = await import('../workers/typst.worker.js?worker');
        const TypstWorker = TypstWorkerModule.default;
        const worker = new TypstWorker();
        workerRef.current = worker;

        // Cargar fuentes antes de enviar INIT
        const fontBuffers = await loadFonts();

        // Esperar confirmación INIT_DONE del Worker (timeout de 45s para WASM ~13MB)
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error('Timeout inicializando Typst WASM (>45s). Verificá tu conexión.')),
            45000
          );

          worker.onmessage = (e) => {
            if (e.data.type === 'INIT_DONE') {
              clearTimeout(timeout);
              resolve();
            } else if (e.data.type === 'INIT_ERROR') {
              clearTimeout(timeout);
              reject(new Error(e.data.error));
            }
          };

          worker.onerror = (e) => {
            clearTimeout(timeout);
            reject(new Error(`Worker error: ${e.message || 'Error desconocido'}`));
          };

          // Transferir los ArrayBuffer de fuentes (zero-copy)
          const transferables = fontBuffers.map(b => b);
          worker.postMessage({ type: 'INIT', fonts: fontBuffers }, transferables);
        });

        initializedRef.current = true;
        return worker;
      } catch (err) {
        // Resetear para permitir reintentos
        initPromiseRef.current = null;
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
        throw err;
      } finally {
        setIsInitializing(false);
      }
    })();

    return initPromiseRef.current;
  }, [loadFonts]);

  /**
   * Exporta el CV actual como PDF via Typst WASM y lo descarga automáticamente.
   *
   * @param {Object} cvData - Estado completo del CV
   */
  const exportTypstPDF = useCallback(async (cvData) => {
    if (isExporting) return;

    setIsExporting(true);
    setError(null);

    try {
      // Obtener (o inicializar) el Worker
      const worker = await initWorker();

      // Serializar estado → markup Typst
      const typstSource = cvDataToTypst(cvData);

      // ID único para esta compilación (anti-stale)
      const compileId = ++compileIdRef.current;

      // Nombre del archivo PDF
      const pdfTitle = getDynamicPdfTitle(cvData);
      const fileName = `${pdfTitle || 'CV'}.pdf`;

      // Enviar al Worker y esperar resultado
      const pdfBytes = await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('Timeout compilando PDF con Typst (>60s).')),
          60000
        );

        const handleMessage = (e) => {
          const { type, id, pdfBytes: bytes, error: err } = e.data;

          // Ignorar mensajes de otras compilaciones (stale)
          if (id !== compileId) return;

          worker.removeEventListener('message', handleMessage);
          clearTimeout(timeout);

          if (type === 'COMPILE_SUCCESS') {
            resolve(bytes);
          } else {
            reject(new Error(err || 'Error desconocido en la compilación Typst.'));
          }
        };

        worker.addEventListener('message', handleMessage);
        worker.postMessage({ type: 'COMPILE', id: compileId, typstSource });
      });

      // Trigger de descarga automática
      const blob   = new Blob([pdfBytes], { type: 'application/pdf' });
      const url    = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href     = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      // Liberar la Object URL tras 5 segundos
      setTimeout(() => URL.revokeObjectURL(url), 5000);

    } catch (err) {
      const msg = err?.message || String(err);
      console.error('[useTypstPdfEngine] Error:', msg);
      setError(msg);
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, initWorker]);

  /**
   * Termina el Worker y resetea el estado.
   * Útil para limpiar recursos al desmontar el componente.
   */
  const terminateWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    initializedRef.current = false;
    initPromiseRef.current = null;
  }, []);

  return {
    exportTypstPDF,
    isExporting,
    isInitializing,
    error,
    terminateWorker,
  };
};

export default useTypstPdfEngine;
