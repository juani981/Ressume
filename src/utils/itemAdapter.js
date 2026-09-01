/**
 * itemAdapter.js
 * 
 * Provides polymorphic item conversion and default item factories for CV sections.
 * Allows any item dragged from Section A to Section B to automatically adopt and inherit
 * the structure, fields, and rendering rules of the destination container.
 */

/**
 * Transforms an arbitrary item into the target section's expected schema.
 * @param {Object} item - Source item
 * @param {string} targetSectionType - 'skills' | 'education' | 'list' | 'simple_list' | 'about' | 'profile_header'
 * @returns {Object} Adapted item conforming to targetSectionType
 */
export const adaptItemToSectionType = (item, targetSectionType) => {
  if (!item) return createDefaultItemForSection(targetSectionType);

  const baseId = item.id ? (item.id.includes('_') ? item.id : `${targetSectionType}_${Date.now()}`) : `${targetSectionType}_${Date.now()}`;

  switch (targetSectionType) {
    case 'skills': {
      // Destination requires: title (category name), description (comma-separated skills)
      let title = item.title || item.name || 'Nueva Categoría';
      let description = item.description || '';
      
      if (!description) {
        if (item.bullets && Array.isArray(item.bullets) && item.bullets.length > 0) {
          description = item.bullets.join(', ');
        } else if (item.text) {
          description = item.text;
        } else if (item.subtitle) {
          description = item.subtitle;
        } else {
          description = 'Herramientas y tecnologías especializadas';
        }
      }

      return {
        id: baseId,
        title,
        description
      };
    }

    case 'education': {
      // Destination requires: title (degree), subtitle (institution), date (period)
      return {
        id: baseId,
        title: item.title || item.name || item.text || 'Título / Certificación Académica',
        subtitle: item.subtitle || item.description || 'Institución Universitaria / Centro de Estudios',
        date: item.date || '2023 – Presente'
      };
    }

    case 'list': {
      // Destination requires: title (role/project), subtitle (company/context), date, bullets, link, description
      let bullets = [];
      if (item.bullets && Array.isArray(item.bullets) && item.bullets.length > 0) {
        bullets = [...item.bullets];
      } else if (item.description) {
        bullets = item.description.split('\n').filter(b => b.trim());
        if (bullets.length === 0) bullets = [item.description];
      } else if (item.text) {
        bullets = [item.text];
      } else {
        bullets = ['Liderazgo y ejecución técnica con resultados medibles e impacto directo.'];
      }

      return {
        id: baseId,
        title: item.title || item.name || 'Nuevo Cargo / Proyecto',
        subtitle: item.subtitle || 'Organización / Empresa',
        date: item.date || '2024 – Actualidad',
        link: item.link || '',
        description: item.description || '',
        bullets
      };
    }

    case 'simple_list': {
      // Destination requires: text (single descriptive line)
      let text = item.text;
      if (!text) {
        const parts = [];
        if (item.title) parts.push(item.title);
        if (item.subtitle) parts.push(`— ${item.subtitle}`);
        if (item.date) parts.push(`(${item.date})`);
        text = parts.length > 0 ? parts.join(' ') : (item.description || 'Nuevo elemento destacado');
      }

      return {
        id: baseId,
        text
      };
    }

    case 'about': {
      return {
        id: baseId,
        description: item.description || item.text || item.title || 'Perfil profesional orientado a resultados y buenas prácticas.'
      };
    }

    default:
      return { ...item, id: baseId };
  }
};

/**
 * Creates a fresh default item pre-configured for a given section type.
 * @param {string} sectionType - 'skills' | 'education' | 'list' | 'simple_list' | 'about'
 * @returns {Object} New default item
 */
export const createDefaultItemForSection = (sectionType) => {
  const timestamp = Date.now().toString().slice(-4);

  switch (sectionType) {
    case 'skills':
      return {
        id: `skill_${timestamp}`,
        title: 'Nueva Especialidad',
        description: 'Tecnología A, Framework B, Herramienta C'
      };

    case 'education':
      return {
        id: `edu_${timestamp}`,
        title: 'Nueva Titulación / Grado',
        subtitle: 'Universidad / Instituto',
        date: '2024 – Actualidad'
      };

    case 'list':
      return {
        id: `exp_${timestamp}`,
        title: 'Nuevo Cargo / Rol Profesional',
        subtitle: 'Empresa / Institución | Ubicación',
        date: '2025 – Presente',
        bullets: [
          'Lideré la implementación de soluciones técnicas optimizando procesos.',
          'Diseñé y automaticé flujos de trabajo con metodologías ágiles.'
        ]
      };

    case 'simple_list':
      return {
        id: `item_${timestamp}`,
        text: 'Nueva Certificación / Idioma — Institución (2025)'
      };

    case 'about':
      return {
        id: `about_${timestamp}`,
        description: 'Ingresa aquí un resumen profesional conciso enfocado en tus fortalezas técnicas y objetivos.'
      };

    default:
      return {
        id: `item_${timestamp}`,
        title: 'Nuevo Elemento',
        subtitle: 'Detalle adicional',
        date: '2025'
      };
  }
};

/**
 * Creates a brand new section container.
 * @param {string} column - 'left' | 'right'
 * @param {string} type - 'list' | 'skills' | 'education' | 'simple_list'
 * @param {string} title - Section title
 * @returns {Object} New section object
 */
export const createDefaultSection = (column = 'right', type = 'list', title = 'NUEVA SECCIÓN') => {
  const timestamp = Date.now().toString().slice(-4);
  const sectionId = `sec_${timestamp}`;

  return {
    id: sectionId,
    column,
    type,
    title,
    items: [createDefaultItemForSection(type)]
  };
};
