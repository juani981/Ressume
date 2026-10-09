import React from 'react';
import { createTourStep } from './tourUtils';
import { IMPORT_CV_STEP } from './importCvTourSteps';

/**
 * Natural, user-focused Joyride tour steps for the ActionMenu sidebar controls.
 * Modular, clean, and easily customizable by any team member.
 */

export const SIDEBAR_STEPS = [
   createTourStep({
      target: "#versiones-item",
      title: "Gestor de Versiones",
      description: (
         <p style={{ margin: 0 }}>
            Crea y guarda distintas versiones de tu currículum orientadas a
            diferentes búsquedas laborales (por ejemplo: perfil Frontend, perfil
            Fullstack o CV en inglés) sin sobrescribir tu trabajo principal.
         </p>
      ),
      placement: "right",
   }),
   createTourStep({
      target: "#design-item",
      title: "Ajustes de Diseño y Tipografía",
      description: (
         <p style={{ margin: 0 }}>
            Personaliza las tipografías, el tamaño y el espaciado entre
            secciones.
         </p>
      ),
      placement: "right",
   }),
   createTourStep({
      target: "#ia-prompts-item",
      title: "Biblioteca de Prompts IA",
      description: (
         <p style={{ margin: 0 }}>
            Elige de una biblioteca de prompts estructurados para que cualquier
            modelo de IA audite tu CV como un reclutador tech, traduzca tu
            perfil, analicen compatibilidad con una oferta, entre otros.
         </p>
      ),
      placement: "right",
   }),
   createTourStep({
      target: "#translation-action-item",
      title: "Traducir tu CV usando IA",
      description: (
         <p style={{ margin: 0 }}>
            Prompt auto-generado para traducir tu CV: traduce títulos
            académicos, adapta terminología técnica, ajusta el tono profesional,
            y adapta al diseño de Easy CV Editor.
         </p>
      ),
      placement: "right",
   }),
   IMPORT_CV_STEP,
   createTourStep({
      target: '[data-testid="btn-action-native-print"]',
      title: "Descargar / Imprimir PDF",
      description: (
         <p style={{ margin: 0 }}>
            Descarga tu CV en formato PDF, tamaño estándar A4.
         </p>
      ),
      placement: "right",
      spotlightClicks: true,
   }),
];
