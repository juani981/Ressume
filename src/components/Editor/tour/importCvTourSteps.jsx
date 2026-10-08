import React from 'react';
import { createTourStep } from './tourUtils';

/**
 * Natural, user-focused Joyride tour step for importing an existing CV.
 * Serves as the definitive final step of the initial onboarding tour
 * before returning full editorial control to the user, and can also be
 * launched as a standalone tour.
 */
export const IMPORT_CV_STEP = createTourStep({
   target: "#byo-cv-action-item",
   title: "Adaptar un currículum existente",
   description: (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
         <p style={{ margin: 0 }}>
            Si ya dispone de un currículum en formato PDF, texto plano o .DOC.
         </p>
         <p style={{ margin: 0 }}>
            Obtendrá una directiva estructurada para que un modelo de lenguaje
            (como ChatGPT o Claude) extraiga su trayectoria y la importe en Easy
            CV Editor.
         </p>
      </div>
   ),
   placement: "right",
   //spotlightClicks: true,
});

export const IMPORT_CV_TOUR_STEPS = [IMPORT_CV_STEP];
