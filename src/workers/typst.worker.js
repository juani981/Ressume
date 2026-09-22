/**
 * typst.worker.js
 * Web Worker dedicado al pipeline de compilación Typst WASM.
 * Se ejecuta en un hilo separado para no bloquear la UI de React.
 *
 * ── Protocolo de mensajes ─────────────────────────────────────────────────────
 *   ENTRADA { type: 'INIT',    fonts: ArrayBuffer[] }
 *   SALIDA  { type: 'INIT_DONE' } | { type: 'INIT_ERROR', error: string }
 *
 *   ENTRADA { type: 'COMPILE', id: number, typstSource: string }
 *   SALIDA  { type: 'COMPILE_SUCCESS', id: number, pdfBytes: Uint8Array }
 *           { type: 'COMPILE_ERROR',   id: number, error: string }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { $typst } from '@myriaddreamin/typst.ts/dist/esm/contrib/snippet.mjs';

let initialized = false;
let pendingCompileId = null; // Anti-stale: solo el último id importa

self.onmessage = async (event) => {
  const { type, id, typstSource, fonts } = event.data;

  // ── INIT ────────────────────────────────────────────────────────────────────
  if (type === 'INIT') {
    try {
      await $typst.setCompilerInitOptions({
        // El archivo WASM es servido como asset estático desde public/wasm/
        getModule: () => '/wasm/typst_ts_web_compiler_bg.wasm',
      });

      // Cargar fuentes pasadas como ArrayBuffer desde el hilo principal
      if (Array.isArray(fonts)) {
        for (const fontBuf of fonts) {
          if (fontBuf instanceof ArrayBuffer && fontBuf.byteLength > 0) {
            await $typst.addFont(fontBuf);
          }
        }
      }

      initialized = true;
      self.postMessage({ type: 'INIT_DONE' });
    } catch (err) {
      const msg = err?.message || String(err);
      console.error('[Typst Worker] Error en INIT:', msg);
      self.postMessage({ type: 'INIT_ERROR', error: msg });
    }
    return;
  }

  // ── COMPILE ─────────────────────────────────────────────────────────────────
  if (type === 'COMPILE') {
    if (!initialized) {
      self.postMessage({
        type: 'COMPILE_ERROR',
        id,
        error: 'El Worker Typst no está inicializado. Ejecutá INIT primero.',
      });
      return;
    }

    pendingCompileId = id;

    try {
      const pdfBytes = await $typst.pdf({ mainContent: typstSource });

      // Anti-stale: si llegó una compilación más nueva, ignorar esta respuesta
      if (pendingCompileId !== id) return;

      // Transferir el buffer sin copia (zero-copy transfer)
      self.postMessage(
        { type: 'COMPILE_SUCCESS', id, pdfBytes },
        [pdfBytes.buffer]
      );
    } catch (err) {
      if (pendingCompileId !== id) return;
      const msg = err?.message || String(err);
      console.error('[Typst Worker] Error en COMPILE:', msg);
      self.postMessage({ type: 'COMPILE_ERROR', id, error: msg });
    }
    return;
  }
};
