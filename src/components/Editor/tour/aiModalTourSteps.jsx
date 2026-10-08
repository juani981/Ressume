import React from 'react';
import { createTourStep } from './tourUtils';

/**
 * Natural, step-by-step Joyride tour steps for the AI Advice & Prompts Modal (AIExportModal).
 * Tailored specifically per prompt category:
 * 1. Simple / Unidirectional prompts (Recruiter audit, STAR, interview prep)
 * 2. Translation & Cultural localization (translate_english)
 * 3. Bring Your Own CV / PDF extraction (bring_your_own_cv)
 */

export const AI_MODAL_STEPS_SIMPLE = [
  createTourStep({
    target: '[data-testid="ai-privacy-disclaimer-callout"]',
    title: '1. Privacidad y Soberanía Local-First',
    description: (
      <p style={{ margin: 0 }}>
        Tus datos nunca se envían a servidores de terceros ni entrenan modelos de lenguaje ajenos.
        Todo el procesamiento se realiza localmente en tu navegador y en el proveedor de inteligencia
        artificial externa que selecciones voluntariamente.
      </p>
    ),
    placement: 'bottom',
  }),
  createTourStep({
    target: '[data-testid="ai-copy-btn"]',
    title: '2. Copiar Prompt al Portapapeles',
    description: (
      <p style={{ margin: 0 }}>
        Presiona este botón para copiar la instrucción estructurada junto con la información
        completa de tu currículum. El sistema compila automáticamente el contenido en formato
        Markdown para su análisis.
      </p>
    ),
    placement: 'bottom',
  }),
  createTourStep({
    target: '[data-testid="ai-providers-container"]',
    title: '3. Abrir Inteligencia Artificial Externa',
    description: (
      <p style={{ margin: 0 }}>
        Selecciona tu proveedor preferido (ChatGPT, Claude, Gemini u Ollama). Al pulsar sobre
        cualquiera de ellos, se abrirá la plataforma en una pestaña nueva con el prompt listo en tu
        portapapeles para pegar con Ctrl+V.
      </p>
    ),
    placement: 'top',
  }),
];

export const AI_MODAL_STEPS_TRANSLATION = [
  createTourStep({
    target: '[data-testid="ai-privacy-disclaimer-callout"]',
    title: '1. Adaptación Cultural y Técnica',
    description: (
      <p style={{ margin: 0 }}>
        Adapta la terminología técnica y los verbos de acción de tu perfil a los estándares del
        mercado anglosajón, preservando la fidelidad de tus logros y la distribución visual de tus
        secciones.
      </p>
    ),
    placement: 'bottom',
  }),
  createTourStep({
    target: '[data-testid="ai-copy-btn"]',
    title: '2. Copiar Prompt de Traducción',
    description: (
      <p style={{ margin: 0 }}>
        Copia las directivas de traducción y el esquema JSON estructurado de tu currículum al
        portapapeles para procesarlo con un modelo de lenguaje avanzado.
      </p>
    ),
    placement: 'bottom',
  }),
  createTourStep({
    target: '[data-testid="ai-providers-container"]',
    title: '3. Procesar en Proveedor Externo',
    description: (
      <p style={{ margin: 0 }}>
        Abre tu proveedor de IA de preferencia (ChatGPT, Claude o Gemini). Pega el prompt copiado y
        solicita la generación del bloque de datos en inglés.
      </p>
    ),
    placement: 'top',
  }),
  createTourStep({
    target: '[data-testid="ai-paste-response-btn"]',
    title: '4. Pegar Respuesta e Integrar Cambios',
    description: (
      <p style={{ margin: 0 }}>
        Presiona este botón para pegar directamente el bloque JSON devuelto por la IA. El sistema
        creará un punto de restauración automático en tu historial de versiones y actualizará tu
        currículum al instante.
      </p>
    ),
    placement: 'top',
  }),
];

export const AI_MODAL_STEPS_BYO_CV = [
  createTourStep({
    target: '[data-testid="ai-privacy-disclaimer-callout"]',
    title: '1. Importación Asistida de Currículum',
    description: (
      <p style={{ margin: 0 }}>
        Permite transformar un currículum previo en texto plano o documento PDF al formato nativo
        del editor sin perder datos esenciales ni requerir transcripción manual.
      </p>
    ),
    placement: 'bottom',
  }),
  createTourStep({
    target: '[data-testid="ai-copy-btn"]',
    title: '2. Copiar Prompt de Extracción',
    description: (
      <p style={{ margin: 0 }}>
        Copia las directivas de extracción y mapeo estructurado. Si dispones de un archivo PDF,
        podrás adjuntarlo en la ventana de la IA junto a este prompt.
      </p>
    ),
    placement: 'bottom',
  }),
  createTourStep({
    target: '[data-testid="ai-providers-container"]',
    title: '3. Procesar Documento con IA',
    description: (
      <p style={{ margin: 0 }}>
        Abre ChatGPT, Claude o Gemini para procesar el documento. La IA organizará la información
        respetando la estructura requerida por el editor.
      </p>
    ),
    placement: 'top',
  }),
  createTourStep({
    target: '[data-testid="ai-paste-response-btn"]',
    title: '4. Pegar e Incorporar Contenido',
    description: (
      <p style={{ margin: 0 }}>
        Pega la respuesta estructurada desde el portapapeles. Podrás previsualizar los cambios
        incorporados y aplicarlos directamente sobre tu lienzo de trabajo con respaldo automático.
      </p>
    ),
    placement: 'top',
  }),
];

/**
 * Backward compatibility alias: default AI modal steps for simple prompts.
 */
export const AI_MODAL_STEPS = AI_MODAL_STEPS_SIMPLE;

/**
 * Resolves the appropriate Joyride steps matching the currently selected prompt.
 * @param {string} promptId
 * @returns {Array} Joyride tour steps
 */
export function getAIModalTourSteps(promptId) {
  if (promptId === 'translate_english') {
    return AI_MODAL_STEPS_TRANSLATION;
  }
  if (promptId === 'bring_your_own_cv') {
    return AI_MODAL_STEPS_BYO_CV;
  }
  return AI_MODAL_STEPS_SIMPLE;
}

/**
 * Checks whether a given step array corresponds to any AI modal tour.
 * @param {Array} steps
 * @returns {boolean}
 */
export function isAIModalSteps(steps) {
  return (
    steps === AI_MODAL_STEPS_SIMPLE ||
    steps === AI_MODAL_STEPS_TRANSLATION ||
    steps === AI_MODAL_STEPS_BYO_CV ||
    steps === AI_MODAL_STEPS
  );
}
