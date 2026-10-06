/**
 * @file categories.js
 * @description Master category registry for the Bitácora / Knowledge Hub.
 * Extensible configuration: adding or modifying categories only requires editing this list.
 */

export const BITACORA_CATEGORIES = [
  {
    id: 'all',
    label: 'Todos',
    icon: 'Sparkles',
    badgeColor: '#6366f1',
    description: 'Todos los recursos, guías y consejos tácticos.',
  },
  {
    id: 'ats',
    label: 'ATS & Filtros',
    icon: 'Cpu',
    badgeColor: '#0284c7',
    description: 'Estrategias para superar los filtros automatizados y parseadores de RRHH.',
  },
  {
    id: 'bullets',
    label: 'Bullets de Impacto',
    icon: 'FileText',
    badgeColor: '#059669',
    description: 'Estructuración de logros con métricas, verbos de acción y metodologías STAR/XYZ.',
  },
  {
    id: 'interviews',
    label: 'Entrevistas',
    icon: 'Users',
    badgeColor: '#d97706',
    description: 'Preparación técnica y de comportamiento (behavioral), preguntas trampa y negociación.',
  },
  {
    id: 'strategy',
    label: 'Estrategia Laboral',
    icon: 'Compass',
    badgeColor: '#7c3aed',
    description: 'Networking, optimización de LinkedIn, cartas de presentación y posicionamiento.',
  },
  {
    id: 'resources',
    label: 'Herramientas & Links',
    icon: 'Link',
    badgeColor: '#db2777',
    description: 'Cheatsheets, repositorios, simuladores de entrevistas y herramientas curadas.',
  },
];
