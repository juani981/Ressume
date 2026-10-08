import React from 'react';
import { createTourStep } from './tourUtils';

/**
 * Natural, user-focused Joyride tour step for importing an existing CV.
 * Serves as the definitive final step of the initial onboarding tour
 * before returning full editorial control to the user, and can also be
 * launched as a standalone tour.
 */
export const IMPORT_CV_STEP = createTourStep({
  target: '#byo-cv-action-item',
  title: 'Paso final: Importar un currículum existente',
  description: (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p style={{ margin: 0 }}>
        Si ya dispone de un currículum en formato PDF, texto plano o Markdown, no necesita
        transcribir su información manualmente.
      </p>
      <p style={{ margin: 0 }}>
        Haga clic en este acceso de <strong>Trae tu propio CV</strong> para abrir el conversor asistido:
        obtendrá una directiva estructurada para que un modelo de lenguaje (como ChatGPT o Claude)
        extraiga su trayectoria y la vuelque directamente sobre las hojas de Ressume.
      </p>
      <div
        style={{
          marginTop: '4px',
          padding: '6px 10px',
          background: '#f0fdf4',
          borderRadius: '6px',
          border: '1px solid #bbf7d0',
          fontSize: '0.8rem',
          color: '#166534',
          lineHeight: 1.4,
        }}
      >
        💡 <strong>Control devuelto:</strong> Puede hacer clic en el botón ahora para importar su
        documento o finalizar este recorrido para comenzar a editar libremente el lienzo actual.
      </div>
    </div>
  ),
  placement: 'right',
  spotlightClicks: true,
});

export const IMPORT_CV_TOUR_STEPS = [IMPORT_CV_STEP];
