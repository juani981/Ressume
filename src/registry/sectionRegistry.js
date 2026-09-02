import React from 'react';
import ExperienceItem from '../components/CV/items/ExperienceItem';
import EducationItem from '../components/CV/items/EducationItem';
import SkillsItem from '../components/CV/items/SkillsItem';
import SimpleListItem from '../components/CV/items/SimpleListItem';
import AboutItem from '../components/CV/items/AboutItem';
import ProfileHeaderItem from '../components/CV/items/ProfileHeaderItem';

let uniqueIdCounter = 0;
const generateUniqueId = (prefix = 'item') => {
  uniqueIdCounter += 1;
  return `${prefix}_${Date.now()}_${uniqueIdCounter}_${Math.random().toString(36).substr(2, 5)}`;
};

/**
 * Registry of section definitions
 */
const sectionRegistry = new Map();

/**
 * Register a new section type
 * @param {Object} descriptor 
 */
export const registerSectionType = (descriptor) => {
  if (!descriptor || !descriptor.type) {
    throw new Error('Invalid section descriptor: missing "type" property.');
  }
  const enriched = {
    ...descriptor,
    get defaultItem() {
      return typeof this.createDefaultItem === 'function' ? this.createDefaultItem() : undefined;
    }
  };
  sectionRegistry.set(descriptor.type, enriched);
};

/**
 * Retrieve descriptor by section type, or return safe fallback descriptor
 * @param {string} type 
 * @returns {Object}
 */
export const getSectionDescriptor = (type) => {
  if (sectionRegistry.has(type)) {
    return sectionRegistry.get(type);
  }

  // Fallback descriptor for custom or unrecognized section types
  return {
    type: type || 'custom',
    label: type ? type.toUpperCase() : 'SECCIÓN',
    defaultTitle: type ? type.toUpperCase() : 'NUEVA SECCIÓN',
    defaultColumn: 'right',
    allowDelete: true,
    allowAddItem: true,
    containerTag: 'div',
    containerClass: 'experience__container bd-grid',
    itemComponent: ExperienceItem,
    createDefaultItem: () => ({
      id: generateUniqueId('custom'),
      title: 'Nuevo Elemento',
      subtitle: 'Detalle adicional',
      date: '2025',
      bullets: ['Descripción o logro relevante']
    }),
    get defaultItem() {
      return this.createDefaultItem();
    },
    adaptItem: (source) => {
      const src = source || {};
      return {
        id: src.id || generateUniqueId('custom'),
        title: src.title || src.name || src.text || 'Nuevo Elemento',
        subtitle: src.subtitle || src.description || 'Detalle',
        date: src.date || '2025',
        bullets: Array.isArray(src.bullets) ? src.bullets : src.description ? [src.description] : ['Descripción o logro relevante']
      };
    },
    schema: { title: 'string', subtitle: 'string', date: 'string' }
  };
};

/**
 * Get all registered section descriptors
 */
export const getAllSectionDescriptors = () => {
  return Array.from(sectionRegistry.values());
};

/**
 * Get all registered section types
 */
export const getAllSectionTypes = () => {
  return Array.from(sectionRegistry.keys());
};

/**
 * Standard section descriptors
 */
const standardDescriptors = [
  {
    type: 'skills',
    label: 'Habilidades Técnicas',
    defaultTitle: 'HABILIDADES TÉCNICAS',
    defaultColumn: 'left',
    allowDelete: true,
    allowAddItem: true,
    containerTag: 'ul',
    containerClass: 'skills__content bd-grid',
    itemComponent: SkillsItem,
    createDefaultItem: () => ({
      id: generateUniqueId('skill'),
      title: 'Nueva Especialidad',
      description: 'Tecnología A, Framework B, Herramienta C'
    }),
    adaptItem: (item) => {
      const src = item || {};
      let title = src.title || src.name || 'Nueva Especialidad';
      let description = src.description || '';

      if (!description) {
        if (src.bullets && Array.isArray(src.bullets) && src.bullets.length > 0) {
          description = src.bullets.join(', ');
        } else if (src.text) {
          description = src.text;
        } else if (src.subtitle) {
          description = src.subtitle;
        } else {
          description = 'Herramientas y tecnologías especializadas';
        }
      }

      return {
        id: src.id || generateUniqueId('skill'),
        title,
        description
      };
    },
    schema: { title: 'string', description: 'string' }
  },
  {
    type: 'education',
    label: 'Educación',
    defaultTitle: 'EDUCACIÓN',
    defaultColumn: 'left',
    allowDelete: true,
    allowAddItem: true,
    containerTag: 'div',
    containerClass: 'education__container bd-grid',
    itemComponent: EducationItem,
    createDefaultItem: () => ({
      id: generateUniqueId('edu'),
      title: 'Nueva Titulación / Grado',
      subtitle: 'Universidad / Instituto',
      date: '2024 – Actualidad'
    }),
    adaptItem: (item) => {
      const src = item || {};
      return {
        id: src.id || generateUniqueId('edu'),
        title: src.title || src.name || src.text || 'Título / Certificación Académica',
        subtitle: src.subtitle || src.description || 'Institución Universitaria / Centro de Estudios',
        date: src.date || '2024 – Actualidad'
      };
    },
    schema: { title: 'string', subtitle: 'string', date: 'string' }
  },
  {
    type: 'list',
    label: 'Experiencia / Lista Estructurada',
    defaultTitle: 'EXPERIENCIA LABORAL',
    defaultColumn: 'right',
    allowDelete: true,
    allowAddItem: true,
    containerTag: 'div',
    containerClass: 'experience__container bd-grid',
    itemComponent: ExperienceItem,
    createDefaultItem: () => ({
      id: generateUniqueId('exp'),
      title: 'Nuevo Cargo / Rol Profesional',
      subtitle: 'Empresa / Institución | Ubicación',
      date: '2025 – Presente',
      bullets: [
        'Liderazgo y ejecución técnica con resultados medibles e impacto directo.',
        'Diseñé y automaticé flujos de trabajo con metodologías ágiles.'
      ]
    }),
    adaptItem: (item) => {
      const src = item || {};
      let bullets = [];
      if (src.bullets && Array.isArray(src.bullets) && src.bullets.length > 0) {
        bullets = [...src.bullets];
      } else if (src.description) {
        bullets = src.description.split('\n').filter(b => b.trim());
        if (bullets.length === 0) bullets = [src.description];
      } else if (src.text) {
        bullets = [src.text];
      } else {
        bullets = ['Liderazgo y ejecución técnica con resultados medibles e impacto directo.'];
      }

      return {
        id: src.id || generateUniqueId('exp'),
        title: src.title || src.name || src.text || 'Nuevo Cargo / Proyecto',
        subtitle: src.subtitle || 'Organización / Empresa',
        date: src.date || '2024 – Actualidad',
        link: src.link || '',
        description: src.description || '',
        bullets
      };
    },
    schema: { title: 'string', subtitle: 'string', date: 'string', bullets: 'array' }
  },
  {
    type: 'simple_list',
    label: 'Lista Simple',
    defaultTitle: 'CERTIFICACIONES',
    defaultColumn: 'right',
    allowDelete: true,
    allowAddItem: true,
    containerTag: 'ul',
    containerClass: '',
    itemComponent: SimpleListItem,
    createDefaultItem: () => ({
      id: generateUniqueId('item'),
      text: 'Nueva Certificación / Idioma — Institución (2025)'
    }),
    adaptItem: (item) => {
      const src = item || {};
      let text = src.text;
      if (!text) {
        const parts = [];
        if (src.title || src.name) parts.push(src.title || src.name);
        if (src.subtitle) parts.push(`— ${src.subtitle}`);
        if (src.date) parts.push(`(${src.date})`);
        text = parts.length > 0 ? parts.join(' ') : (src.description || 'Nuevo elemento destacado');
      }

      return {
        id: src.id || generateUniqueId('item'),
        text
      };
    },
    schema: { text: 'string' }
  },
  {
    type: 'about',
    label: 'Perfil Profesional',
    defaultTitle: 'Perfil Profesional',
    defaultColumn: 'left',
    allowDelete: true,
    allowAddItem: false,
    containerTag: 'div',
    containerClass: '',
    itemComponent: AboutItem,
    createDefaultItem: () => ({
      id: generateUniqueId('about'),
      description: 'Ingresa aquí un resumen profesional conciso enfocado en tus fortalezas técnicas y objetivos.'
    }),
    adaptItem: (item) => {
      const src = item || {};
      let desc = src.description;
      if (!desc) {
        if (src.bullets && Array.isArray(src.bullets) && src.bullets.length > 0) {
          desc = src.bullets.join('. ');
        } else if (src.text) {
          desc = src.text;
        } else if (src.title) {
          desc = src.subtitle ? `${src.title} — ${src.subtitle}` : src.title;
        } else {
          desc = 'Perfil profesional orientado a resultados y buenas prácticas.';
        }
      }
      return {
        id: src.id || generateUniqueId('about'),
        description: desc
      };
    },
    schema: { description: 'string' }
  },
  {
    type: 'profile_header',
    label: 'Cabecera de Perfil',
    defaultTitle: '',
    defaultColumn: 'left',
    allowDelete: false,
    allowAddItem: false,
    containerTag: 'div',
    containerClass: 'home__container bd-grid',
    itemComponent: ProfileHeaderItem,
    createDefaultItem: () => ({
      id: generateUniqueId('prof'),
      name: '',
      subtitle: '',
      location: '',
      email: '',
      phone: '',
      linkedin: '',
      github: ''
    }),
    adaptItem: (item) => {
      const src = item || {};
      return {
        id: src.id || generateUniqueId('prof'),
        name: src.name || src.title || '',
        subtitle: src.subtitle || '',
        location: src.location || '',
        email: src.email || '',
        phone: src.phone || '',
        linkedin: src.linkedin || '',
        github: src.github || ''
      };
    },
    schema: { name: 'string', subtitle: 'string', location: 'string', email: 'string', phone: 'string', linkedin: 'string', github: 'string' }
  }
];

// Register standard descriptors
standardDescriptors.forEach(d => registerSectionType(d));

/**
 * Factory for creating default item by section type
 */
export const createDefaultItem = (sectionType) => {
  const descriptor = getSectionDescriptor(sectionType);
  if (descriptor && typeof descriptor.createDefaultItem === 'function') {
    return descriptor.createDefaultItem();
  }
  return {
    id: generateUniqueId('item'),
    title: 'Nuevo Elemento'
  };
};

export const createDefaultItemForSection = createDefaultItem;

/**
 * Factory for creating default section container
 */
export const createDefaultSection = (column = 'right', type = 'list', title) => {
  const descriptor = getSectionDescriptor(type);
  const finalTitle = title !== undefined ? title : descriptor.defaultTitle;
  const sectionId = generateUniqueId('sec');

  return {
    id: sectionId,
    column: column || descriptor.defaultColumn || 'right',
    type: type || 'list',
    title: finalTitle,
    items: [createDefaultItem(type)]
  };
};

/**
 * Polymorphic item adapter
 */
export const adaptItemToSectionType = (sourceItem, targetSectionType) => {
  const descriptor = getSectionDescriptor(targetSectionType);
  if (descriptor && typeof descriptor.adaptItem === 'function') {
    return descriptor.adaptItem(sourceItem);
  }
  return { ...(sourceItem || {}), id: (sourceItem && sourceItem.id) || generateUniqueId('item') };
};
