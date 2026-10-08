import React from 'react';
import { createTourStep } from './tourUtils';

/**
 * Natural, step-by-step Joyride tour steps for the AI Advice & Prompts Modal (AIExportModal).
 * Explains local-first privacy, prompt selection, copy workflow, and response ingestion.
 */

export const AI_MODAL_STEPS = [
  createTourStep({
    target: '[data-testid="ai-privacy-disclaimer-callout"]',
    title: '1. Privacidad y Soberanía Local-First',
    description: (
      <p style={{ margin: 0 }}>
        Tus datos nunca se envían a servidores de terceros ni entrenan modelos de lenguaje. Todo el
        procesamiento de la información se ejecuta en tu propio navegador y en la herramienta de IA
        externa (ChatGPT, Claude, Gemini u Ollama) que decidas utilizar libremente.
      </p>
    ),
    placement: 'bottom',
  }),
  createTourStep({
    target: '[data-testid="ai-prompt-select"]',
    title: '2. Selección del Objetivo de Auditoría',
    description: (
      <p style={{ margin: 0 }}>
        Elige qué tipo de análisis deseas solicitar: <em>Auditoría ATS y Consejos de Reclutador</em>{' '}
        para detectar debilidades en tu perfil, <em>Preguntas de Entrevista Técnica</em> para
        prepararte, o <em>Estructuración STAR</em> para potenciar la redacción de tus logros.
      </p>
    ),
    placement: 'bottom',
  }),
  createTourStep({
    target: '[data-testid="ai-copy-btn"]',
    title: '3. Copiar Prompt y Consultar IA',
    description: (
      <p style={{ margin: 0 }}>
        Presiona este botón para copiar al portapapeles el prompt compilado junto con todos los datos
        de tu currículum en formato Markdown estructurado. Luego pégalo en tu IA favorita sin
        necesidad de adjuntar archivos.
      </p>
    ),
    placement: 'bottom',
  }),
  createTourStep({
    target: '[data-testid="ai-toggle-prompt-btn"]',
    title: '4. Inspeccionar Prompt Compilado',
    description: (
      <p style={{ margin: 0 }}>
        Haz clic aquí si deseas desplegar y auditar la instrucción exacta generada por el sistema.
        Verás cómo se formulan las preguntas técnicas y cómo se estructura la información de tu CV.
      </p>
    ),
    placement: 'top',
  }),
  createTourStep({
    target: '.ai-modal-dialog',
    title: '5. Aplicar Recomendaciones en tu CV',
    description: (
      <p style={{ margin: 0 }}>
        En los flujos bidireccionales (Traducción a Inglés o Importador de CV), podrás pegar la
        respuesta devuelta por la IA para previsualizar el impacto e integrarla directamente en el
        editor sin perder tu diseño.
      </p>
    ),
    placement: 'center',
  }),
];
