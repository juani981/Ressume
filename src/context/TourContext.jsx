import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const TOUR_STORAGE_PREFIX = 'ressume_tour_';
export const TOUR_COMPLETED_EVENT = 'ressume_tour_completed';
export const FIRST_PRINT_SUCCESS_EVENT = 'ressume_first_print_success';

export const TOUR_IDS = {
  ONBOARDING: 'onboarding',
  ADD_SECTION: 'add_section',
  VERSION_MANAGER: 'version_manager',
  AI_EXPORT: 'ai_export',
  DESIGN: 'design',
  BITACORA_NUDGE: 'bitacora_nudge',
};

// Help step-by-step guides for each modal / tool (written in a formal, technical, non-condescending tone)
export const MODAL_HELP_CONTENT = {
  [TOUR_IDS.ADD_SECTION]: {
    title: 'Guía de Incorporación de Secciones',
    subtitle: 'Estructuración y disposición de nuevos bloques en el documento.',
    steps: [
      {
        step: 1,
        title: 'Selección del tipo de bloque',
        description: 'Explore las categorías disponibles (Experiencia, Proyectos, Habilidades, Idiomas, etc.). Cada sección incluye metadatos predefinidos adaptados a estándares de reclutamiento.',
      },
      {
        step: 2,
        title: 'Estilo de viñetas y conectores',
        description: 'Configure en la barra superior el tamaño y variante de los indicadores visuales antes de insertar el elemento en el lienzo.',
      },
      {
        step: 3,
        title: 'Asignación de columna',
        description: 'Haga clic sobre la tarjeta deseada. En plantillas de dos columnas, el bloque se insertará automáticamente en la posición seleccionada o por defecto.',
      },
    ],
  },
  [TOUR_IDS.VERSION_MANAGER]: {
    title: 'Guía del Gestor de Versiones',
    subtitle: 'Administración de instantáneas persistentes y trazabilidad.',
    steps: [
      {
        step: 1,
        title: 'Guardado de instantánea actual',
        description: 'Asigne un nombre representativo y guarde el estado actual del currículum. La versión se persiste de forma local con su miniatura.',
      },
      {
        step: 2,
        title: 'Restauración y conmutación',
        description: 'Haga clic en «Cargar» sobre cualquier tarjeta para restaurar todos los campos en el editor principal.',
      },
      {
        step: 3,
        title: 'Exportación e importación JSON',
        description: 'Descargue copias de seguridad portátiles en formato JSON o incorpore archivos externos para continuar su edición.',
      },
    ],
  },
  [TOUR_IDS.AI_EXPORT]: {
    title: 'Guía de Generación de Prompts e Integración',
    subtitle: 'Extracción de directivas estructuradas para análisis asistido.',
    steps: [
      {
        step: 1,
        title: 'Selección del objetivo',
        description: 'Elija entre auditoría contra filtros ATS, adaptación a marco STAR, traducción cultural o importación de documento externo.',
      },
      {
        step: 2,
        title: 'Copia del prompt compilado',
        description: 'Copie la directiva generada hacia el modelo de lenguaje de su preferencia sin necesidad de subir archivos confidenciales a servidores remotos.',
      },
      {
        step: 3,
        title: 'Reingreso de respuesta',
        description: 'En flujos bidireccionales, pegue el bloque de datos estructurados para previsualizar el impacto e integrarlo al editor.',
      },
    ],
  },
  [TOUR_IDS.DESIGN]: {
    title: 'Guía de Personalización de Diseño',
    subtitle: 'Calibración de jerarquía visual, espaciado y legibilidad.',
    steps: [
      {
        step: 1,
        title: 'Tipografía y escalas',
        description: 'Ajuste la fuente y proporciones relativas de títulos y cuerpo de texto para optimizar la densidad de información.',
      },
      {
        step: 2,
        title: 'Márgenes y separaciones',
        description: 'Controle el espaciado entre secciones e ítems para garantizar que el contenido encaje de manera armónica en páginas discretas A4.',
      },
      {
        step: 3,
        title: 'Esquema cromático',
        description: 'En modo de dos columnas, seleccione contrastes cromáticos sobrios que preserven la nitidez en impresión vectorial.',
      },
    ],
  },
};

// Joyride Onboarding steps for the main application
export const ONBOARDING_TOUR_STEPS = [
  {
    target: '.layout-mode-toggle-pill',
    content: (
      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 600 }}>
          Modo Dual de Visualización
        </h4>
        <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.45 }}>
          Permite conmutar entre el diseño visual en dos columnas y la disposición optimizada para sistemas automáticos de seguimiento de candidatos (ATS).
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '#versiones-item',
    content: (
      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 600 }}>
          Gestor de Versiones
        </h4>
        <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.45 }}>
          Almacene variantes del currículum para diferentes perfiles, idiomas o postulaciones técnicas con respaldo local seguro.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '#ia-prompts-item',
    content: (
      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 600 }}>
          Generador de Prompts
        </h4>
        <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.45 }}>
          Cree instrucciones rigurosas para auditar verbos de acción, métricas de impacto y consistencia profesional con su modelo de lenguaje predilecto.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-testid="btn-action-native-print"]',
    content: (
      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 600 }}>
          Exportación e Impresión Vectorial
        </h4>
        <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.45 }}>
          Genere el documento final respetando la geometría física A4 definida en pantalla, sin desplazamientos inesperados.
        </p>
      </div>
    ),
    placement: 'right',
  },
];

// Tour steps leading user to Bitácora after their first print
export const BITACORA_NUDGE_STEPS = [
  {
    target: '#bitacora-item',
    content: (
      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 600 }}>
          Bitácora de Carrera y Criterios Técnicos
        </h4>
        <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.45 }}>
          Su documento ha sido preparado. Para complementar su postulación, consulte en la bitácora los estándares de redacción, diseño y evaluación técnica compartidos por la comunidad.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
];

const TourContext = createContext(null);

export const TourProvider = ({ children }) => {
  // Master switch for the post-print bitacora tour (disabled by default until feature is globally active)
  const isBitacoraTourEnabled = import.meta.env?.VITE_ENABLE_BITACORA_TOUR === 'true';

  const [activeTour, setActiveTour] = useState(null);
  const [completedTours, setCompletedTours] = useState(() => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return {};
    const state = {};
    try {
      // Legacy key compatibility
      if (localStorage.getItem('skip_onboarding_tour') === 'true') {
        state[TOUR_IDS.ONBOARDING] = true;
      }
      Object.values(TOUR_IDS).forEach((id) => {
        if (localStorage.getItem(`${TOUR_STORAGE_PREFIX}${id}`) === 'true') {
          state[id] = true;
        }
      });
    } catch (_) {}
    return state;
  });

  const [helpModalTourId, setHelpModalTourId] = useState(null);

  // Check if a specific tour has been completed or marked to not show
  const isTourCompleted = useCallback((tourId) => {
    return Boolean(completedTours[tourId]);
  }, [completedTours]);

  // Mark tour as completed
  const markTourCompleted = useCallback((tourId, persist = true) => {
    setCompletedTours((prev) => ({ ...prev, [tourId]: true }));
    if (persist && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`${TOUR_STORAGE_PREFIX}${tourId}`, 'true');
        if (tourId === TOUR_IDS.ONBOARDING) {
          localStorage.setItem('skip_onboarding_tour', 'true');
        }
      } catch (_) {}
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(TOUR_COMPLETED_EVENT, { detail: { tourId } }));
    }
  }, []);

  // Reset or clear completion status
  const resetTourStatus = useCallback((tourId) => {
    setCompletedTours((prev) => {
      const next = { ...prev };
      delete next[tourId];
      return next;
    });
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(`${TOUR_STORAGE_PREFIX}${tourId}`);
        if (tourId === TOUR_IDS.ONBOARDING) {
          localStorage.removeItem('skip_onboarding_tour');
        }
      } catch (_) {}
    }
  }, []);

  // Trigger a tour if not completed, or force run
  const startTour = useCallback((tourId, force = false) => {
    if (!force && isTourCompleted(tourId)) {
      return false;
    }
    setActiveTour(tourId);
    return true;
  }, [isTourCompleted]);

  const endTour = useCallback((tourId, dontShowAgain = true) => {
    if (tourId && dontShowAgain) {
      markTourCompleted(tourId, true);
    }
    setActiveTour(null);
  }, [markTourCompleted]);

  // Handle first print success trigger
  const notifyPrintSuccess = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(FIRST_PRINT_SUCCESS_EVENT));
    }
    // Only launch tour if feature flag is active and tour not completed
    if (isBitacoraTourEnabled && !isTourCompleted(TOUR_IDS.BITACORA_NUDGE)) {
      // Check if bitacora button exists in DOM
      const targetEl = document.querySelector('#bitacora-item');
      if (targetEl) {
        setActiveTour(TOUR_IDS.BITACORA_NUDGE);
      }
    }
  }, [isBitacoraTourEnabled, isTourCompleted]);

  // Check initial onboarding run
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || process.env?.VITEST)) {
      return;
    }
    if (!isTourCompleted(TOUR_IDS.ONBOARDING)) {
      const timer = setTimeout(() => {
        setActiveTour(TOUR_IDS.ONBOARDING);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isTourCompleted]);

  // Open modal help guide
  const openModalHelp = useCallback((tourId) => {
    setHelpModalTourId(tourId);
  }, []);

  const closeModalHelp = useCallback(() => {
    setHelpModalTourId(null);
  }, []);

  const value = {
    activeTour,
    isTourCompleted,
    startTour,
    endTour,
    markTourCompleted,
    resetTourStatus,
    notifyPrintSuccess,
    openModalHelp,
    closeModalHelp,
    helpModalTourId,
    isBitacoraTourEnabled,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

const DEFAULT_TOUR_FALLBACK = {
  activeTour: null,
  isTourCompleted: () => false,
  startTour: () => false,
  endTour: () => {},
  markTourCompleted: () => {},
  resetTourStatus: () => {},
  notifyPrintSuccess: () => {},
  openModalHelp: () => {},
  closeModalHelp: () => {},
  helpModalTourId: null,
  isBitacoraTourEnabled: false,
};

export const useTourManager = () => {
  const context = useContext(TourContext);
  if (!context) {
    return DEFAULT_TOUR_FALLBACK;
  }
  return context;
};

export default useTourManager;
