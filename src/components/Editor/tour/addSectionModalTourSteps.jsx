import React from 'react';
import { createTourStep } from './tourUtils';

/**
 * Natural Joyride tour steps for the Add Section (Component Catalog) Modal.
 */

export const ADD_SECTION_MODAL_STEPS = [
  createTourStep({
    target: '[data-testid="add-section-modal"]',
    title: 'Catálogo de Componentes',
    description: (
      <p style={{ margin: 0 }}>
        Selecciona el estilo inicial de las viñetas en la parte superior y luego haz clic en
        cualquier bloque (Proyectos, Certificaciones, Idiomas o sección personalizada) para insertarlo
        en la columna elegida.
      </p>
    ),
    placement: 'left',
  }),
];
