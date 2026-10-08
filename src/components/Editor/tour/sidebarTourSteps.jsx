import React from 'react';
import { createTourStep } from './tourUtils';
import { IMPORT_CV_STEP } from './importCvTourSteps';

/**
 * Natural, user-focused Joyride tour steps for the ActionMenu sidebar controls.
 * Modular, clean, and easily customizable by any team member.
 */

export const SIDEBAR_STEPS = [
  createTourStep({
    target: '[data-testid="action-menu-navbar"] button[aria-label*="Deshacer"]',
    title: 'Deshacer cambios (Ctrl+Z)',
    description: (
      <p style={{ margin: 0 }}>
        Revierte instantáneamente cualquier modificación de texto, reorganización de bloques o
        cambio de diseño. Tu historial de edición se preserva de forma local.
      </p>
    ),
    placement: 'right',
  }),
  createTourStep({
    target: '[data-testid="action-menu-navbar"] button[aria-label*="Rehacer"]',
    title: 'Rehacer cambios (Ctrl+Y)',
    description: (
      <p style={{ margin: 0 }}>
        Restaura cualquier acción deshecha con total comodidad si decides recuperar una redacción o
        estructura previa.
      </p>
    ),
    placement: 'right',
  }),
  createTourStep({
    target: '#versiones-item',
    title: 'Gestor de Versiones',
    description: (
      <p style={{ margin: 0 }}>
        Crea y guarda distintas versiones de tu currículum orientadas a diferentes búsquedas laborales
        (por ejemplo: perfil Frontend, perfil Fullstack o CV en inglés) sin sobrescribir tu trabajo
        principal.
      </p>
    ),
    placement: 'right',
  }),
  createTourStep({
    target: '#design-item',
    title: 'Ajustes de Diseño y Tipografía',
    description: (
      <p style={{ margin: 0 }}>
        Personaliza tipografías, jerarquías de títulos, espaciado entre secciones y esquemas de color
        con previsualización en tiempo real y respeto estricto del estándar A4.
      </p>
    ),
    placement: 'right',
  }),
  createTourStep({
    target: '#ia-prompts-item',
    title: 'Auditoría ATS y Consejos de Reclutador',
    description: (
      <p style={{ margin: 0 }}>
        Genera prompts técnicos y estructurados con los datos de tu CV para que ChatGPT o Claude
        auditen tu experiencia con criterios de reclutadores tech y filtros ATS. Haz clic para abrir el
        panel interactivo de prompts.
      </p>
    ),
    placement: 'right',
  }),
  createTourStep({
    target: '#translation-action-item',
    title: 'Traducir CV a Inglés (US Tech)',
    description: (
      <p style={{ margin: 0 }}>
        Adapta automáticamente tu currículum al estándar del mercado estadounidense: traduce títulos
        académicos, adapta terminología técnica y ajusta el tono profesional.
      </p>
    ),
    placement: 'right',
  }),
  createTourStep({
    target: '[data-testid="btn-action-native-print"]',
    title: 'Descargar / Imprimir PDF',
    description: (
      <p style={{ margin: 0 }}>
        Exporta una copia vectorial nítida en formato A4 estándar. La salida impresa coincide 1:1 con
        lo que ves en el editor, libre de saltos de página partidos o márgenes desalineados.
      </p>
    ),
    placement: 'right',
  }),
  createTourStep({
    target: '[data-testid="btn-pin-action-menu"]',
    title: 'Fijar o replegar barra lateral',
    description: (
      <p style={{ margin: 0 }}>
        Haz clic aquí para anclar la barra lateral y mantener los controles siempre accesibles, o
        desánclala para ocultarla automáticamente y aprovechar al máximo el ancho de tu pantalla.
      </p>
    ),
    placement: 'right',
  }),
  IMPORT_CV_STEP,
];
