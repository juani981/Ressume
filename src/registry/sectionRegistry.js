import React from 'react';
import ExperienceItem from '../components/CV/items/ExperienceItem';
import EducationItem from '../components/CV/items/EducationItem';
import SkillsItem from '../components/CV/items/SkillsItem';
import SimpleListItem from '../components/CV/items/SimpleListItem';
import AboutItem from '../components/CV/items/AboutItem';
import ProfileHeaderItem from '../components/CV/items/ProfileHeaderItem';
import ProjectsItem from '../components/CV/items/ProjectsItem';
import CertificatesItem from '../components/CV/items/CertificatesItem';
import LanguagesItem from '../components/CV/items/LanguagesItem';
import AwardsItem from '../components/CV/items/AwardsItem';
import PublicationsItem from '../components/CV/items/PublicationsItem';
import VolunteeringItem from '../components/CV/items/VolunteeringItem';
import ReferencesItem from '../components/CV/items/ReferencesItem';
import SpacerItem from '../components/CV/items/SpacerItem';
import SpacerBlock from '../components/CV/SpacerBlock';
import MentoringItem from '../components/CV/items/MentoringItem';
import PhotoItem from '../components/CV/items/PhotoItem';
import ProfileTitleItem from '../components/CV/items/ProfileTitleItem';
import ContactItem from '../components/CV/items/ContactItem';
import { normalizeItemContacts, syncFlatContactFields } from '../utils/contactTypes';

import {
  baseItemMarkdown,
  skillsMarkdown,
  educationMarkdown,
  simpleListMarkdown,
  languagesMarkdown,
  certificatesMarkdown,
  aboutMarkdown,
  awardsMarkdown,
  publicationsMarkdown,
  referencesMarkdown,
  baseItemXML,
  skillsXML,
  educationXML,
  simpleListXML,
  baseItemPlainText,
  skillsPlainText,
  educationPlainText,
  simpleListPlainText
} from './itemFormatters';

let uniqueIdCounter = 0;
const generateUniqueId = (prefix = 'item') => {
  uniqueIdCounter += 1;
  return `${prefix}_${Date.now()}_${uniqueIdCounter}_${Math.random().toString(36).substr(2, 5)}`;
};

/**
 * @typedef {Object} SectionDescriptor
 * @property {string} type - Unique identifier for the section type (e.g. 'list', 'skills', 'spacer').
 * @property {string} label - Human-readable name used in UI menus, dialogs, and button titles.
 * @property {string} [defaultTitle=''] - Initial title string rendered in the section header.
 * @property {'left'|'right'} [defaultColumn='right'] - Default column target in two-column layouts.
 * @property {string} [icon='FolderPlus'] - Lucide icon name for toolbar and modal buttons.
 * @property {string} [description] - Optional explanatory text describing the section's purpose.
 * @property {boolean} [allowDelete=true] - Whether the user can delete the section from the CV.
 * @property {boolean} [allowAddItem=true] - Whether users can add new items to this section.
 * @property {boolean} [allowDeleteItem=true] - Whether individual items within this section have a delete button.
 * @property {boolean} [hasTitle=true] - Whether section renders a section title (<h2 className="section-title">).
 * @property {boolean} [hasItemDrag=true] - Whether individual items feature drag handles.
 * @property {boolean} [supportsBulletCustomization=false] - Whether section supports timeline circle bullet styles.
 * @property {boolean} [isHeader=false] - Flag indicating special profile/header identity block.
 * @property {boolean} [isSpacer=false] - Flag indicating spacer whitespace block.
 * @property {boolean} [isListItem=false] - Flag indicating list item formatting.
 * @property {string} [sectionClass='experience'] - CSS class applied to the outer `<section>` container.
 * @property {string} [wrapperClass] - CSS class for the section inner grid container (empty string suppresses grid).
 * @property {'div'|'ul'|'ol'|React.ComponentType} [containerTag='div'] - Tag or component wrapping the items list.
 * @property {string} [containerClass='experience__container bd-grid'] - CSS class applied to the items container.
 * @property {React.CSSProperties} [containerStyle] - Inline styles applied to the items container in editable mode.
 * @property {React.CSSProperties} [printContainerStyle] - Inline styles applied to the items container in print mode.
 * @property {'div'|'li'|React.ComponentType} [itemTag='div'] - HTML element tag wrapping each item.
 * @property {string} [itemClass='experience__content'] - CSS class applied to each item container element.
 * @property {React.CSSProperties} [itemStyle] - Inline styles applied to each item in editable mode.
 * @property {React.CSSProperties} [printItemStyle] - Inline styles applied to each item in print mode.
 * @property {React.ComponentType} [sectionComponent] - Custom section-level renderer component (overriding BaseSection template).
 * @property {React.ComponentType} itemComponent - Component responsible for rendering item content fields.
 * @property {function(Object=): Object} createDefaultItem - Factory function producing a schema-compliant default item.
 * @property {function(Object): Object} adaptItem - Polymorphic adapter transforming an item from another section type.
 * @property {Object<string, string>} [schema] - Field schema mapping for type checking and validation.
 * @property {function(Object): string} [renderMarkdown] - Strategy function converting an item to Markdown format.
 * @property {function(Object): string} [renderXML] - Strategy function converting an item to XML format.
 * @property {function(Object): string} [renderPlainText] - Strategy function converting an item to Plain Text format.
 */

/**
 * Registry of section definitions
 * @type {Map<string, SectionDescriptor>}
 */
const sectionRegistry = new Map();

/**
 * Register a new section type
 * @param {SectionDescriptor} descriptor 
 */
export const registerSectionType = (descriptor) => {
  if (!descriptor || !descriptor.type) {
    throw new Error('Invalid section descriptor: missing "type" property.');
  }
  const containerTag = descriptor.containerTag || 'div';
  const enriched = {
    hasTitle: descriptor.hasTitle !== false,
    hasItemDrag: descriptor.hasItemDrag !== false,
    allowDelete: descriptor.allowDelete !== false,
    allowAddItem: descriptor.allowAddItem !== false,
    allowDeleteItem: descriptor.allowDeleteItem !== false,
    supportsBulletCustomization: Boolean(descriptor.supportsBulletCustomization),
    ...descriptor,
    sectionClass: descriptor.sectionClass || 'experience',
    containerTag,
    containerClass: descriptor.containerClass !== undefined ? descriptor.containerClass : (containerTag === 'ul' ? 'skills__content bd-grid' : 'experience__container bd-grid'),
    itemTag: descriptor.itemTag || (containerTag === 'ul' ? 'li' : 'div'),
    itemClass: descriptor.itemClass || (containerTag === 'ul' ? 'skills__name' : 'experience__content'),
    itemStyle: descriptor.itemStyle || { display: 'flex', position: 'relative', color: 'var(--text-color)' },
    printItemStyle: descriptor.printItemStyle || descriptor.itemStyle || { display: 'flex', position: 'relative', color: 'var(--text-color)' },
    renderMarkdown: descriptor.renderMarkdown || baseItemMarkdown,
    renderXML: descriptor.renderXML || baseItemXML,
    renderPlainText: descriptor.renderPlainText || baseItemPlainText,
    get itemComponent() {
      return descriptor.itemComponent;
    },
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
  const normalizedType = type === 'experience' ? 'list' : type;
  if (sectionRegistry.has(normalizedType)) {
    return sectionRegistry.get(normalizedType);
  }

  // Fallback descriptor for custom or unrecognized section types
  return {
    type: type || 'custom',
    label: type ? type.toUpperCase() : 'SECCIÓN PERSONALIZADA',
    defaultTitle: type ? type.toUpperCase() : 'NUEVA SECCIÓN',
    defaultColumn: 'right',
    icon: 'FolderPlus',
    allowDelete: true,
    allowAddItem: true,
    allowDeleteItem: true,
    hasTitle: true,
    hasItemDrag: true,
    supportsBulletCustomization: false,
    sectionClass: 'experience',
    containerTag: 'div',
    containerClass: 'experience__container bd-grid',
    itemTag: 'div',
    itemClass: 'experience__content',
    itemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
    printItemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
    get itemComponent() {
      return ExperienceItem;
    },
    renderMarkdown: baseItemMarkdown,
    renderXML: baseItemXML,
    renderPlainText: baseItemPlainText,
    createDefaultItem: () => ({
      id: generateUniqueId('custom'),
      title: 'Nuevo Elemento',
      subtitle: 'Detalle o rol',
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
 * Standard section descriptors covering multiple professional disciplines
 */
const standardDescriptors = [
  // 1. Cabecera de Contacto
  {
    type: 'profile_header',
    label: 'Título y Subtítulo',
    defaultTitle: '',
    defaultColumn: 'left',
    icon: 'UserSquare2',
    allowDelete: false,
    allowAddItem: false,
    allowDeleteItem: false,
    hasTitle: false,
    hasItemDrag: false,
    supportsBulletCustomization: false,
    isHeader: true,
    hideControls: true,
    sectionClass: 'home',
    wrapperClass: '',
    containerTag: 'div',
    containerClass: 'home__container bd-grid',
    itemTag: 'div',
    itemClass: 'home__data bd-grid',
    itemStyle: { position: 'relative', color: 'var(--text-color)' },
    printItemStyle: { position: 'relative', color: 'var(--text-color)' },
    get itemComponent() { return ProfileHeaderItem; },
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
  },

  // 2. Perfil Profesional / Sobre Mí
  {
    type: 'about',
    label: 'Perfil Profesional',
    defaultTitle: 'Perfil Profesional',
    defaultColumn: 'left',
    icon: 'UserSquare2',
    allowDelete: true,
    allowAddItem: false,
    allowDeleteItem: true,
    hasTitle: true,
    hasItemDrag: true,
    supportsBulletCustomization: false,
    sectionClass: 'profile',
    wrapperClass: '',
    containerTag: 'div',
    containerClass: '',
    itemTag: 'div',
    itemClass: 'profile__description',
    itemStyle: { position: 'relative', color: 'var(--text-color)' },
    printItemStyle: { position: 'relative', color: 'var(--text-color)' },
    get itemComponent() { return AboutItem; },
    renderMarkdown: aboutMarkdown,
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

  // 3. Experiencia Laboral
  {
    type: 'list',
    label: 'Experiencia Laboral',
    defaultTitle: 'EXPERIENCIA LABORAL',
    defaultColumn: 'right',
    icon: 'Briefcase',
    allowDelete: true,
    allowAddItem: true,
    allowDeleteItem: true,
    hasTitle: true,
    hasItemDrag: true,
    supportsBulletCustomization: true,
    sectionClass: 'experience',
    containerTag: 'div',
    containerClass: 'experience__container bd-grid',
    itemTag: 'div',
    itemClass: 'experience__content',
    itemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
    printItemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
    get itemComponent() { return ExperienceItem; },
    renderMarkdown: baseItemMarkdown,
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
        title: src.title || src.name || src.text || 'Nuevo Cargo / Rol',
        subtitle: src.subtitle || 'Organización / Empresa',
        date: src.date || '2024 – Actualidad',
        link: src.link || '',
        linkText: src.linkText || '',
        description: src.description || '',
        bullets
      };
    },
    schema: { title: 'string', subtitle: 'string', date: 'string', bullets: 'array' }
  },

  // 4. Proyectos Destacados (Portfolio & Open Source)
  {
    type: 'projects',
    label: 'Proyectos Destacados',
    defaultTitle: 'PROYECTOS DESTACADOS',
    defaultColumn: 'right',
    icon: 'FolderGit2',
    allowDelete: true,
    allowAddItem: true,
    allowDeleteItem: true,
    hasTitle: true,
    hasItemDrag: true,
    supportsBulletCustomization: true,
    sectionClass: 'experience',
    containerTag: 'div',
    containerClass: 'experience__container bd-grid',
    itemTag: 'div',
    itemClass: 'experience__content',
    itemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
    printItemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
    get itemComponent() { return ProjectsItem; },
    renderMarkdown: baseItemMarkdown,
    createDefaultItem: () => ({
      id: generateUniqueId('proj'),
      title: 'Plataforma SaaS de Automatización',
      subtitle: 'React · Node.js · PostgreSQL · Docker',
      date: '2025',
      link: 'github.com/usuario/proyecto',
      linkText: 'Demo / Repositorio GitHub',
      description: 'Arquitectura escalable de microservicios con sincronización en tiempo real y tests integrados.',
      bullets: [
        'Implementé pipelines de CI/CD automatizados reduciendo tiempos de despliegue en un 50%.',
        'Diseñé una interfaz reactiva accesible optimizada para altos volúmenes de usuarios.'
      ]
    }),
    adaptItem: (item) => {
      const src = item || {};
      return {
        id: src.id || generateUniqueId('proj'),
        title: src.title || src.name || 'Proyecto Destacado',
        subtitle: src.subtitle || 'Stack Tecnológico / Herramientas',
        date: src.date || '2025',
        link: src.link || '',
        linkText: src.linkText || 'Ver Proyecto',
        description: src.description || '',
        bullets: Array.isArray(src.bullets) ? src.bullets : ['Logro clave del proyecto con impacto directo.']
      };
    },
    schema: { title: 'string', subtitle: 'string', date: 'string', link: 'string', bullets: 'array' }
  },

  // 5. Educación y Formación
  {
    type: 'education',
    label: 'Educación y Formación',
    defaultTitle: 'EDUCACIÓN',
    defaultColumn: 'left',
    icon: 'GraduationCap',
    allowDelete: true,
    allowAddItem: true,
    allowDeleteItem: true,
    hasTitle: true,
    hasItemDrag: true,
    supportsBulletCustomization: true,
    sectionClass: 'education',
    containerTag: 'div',
    containerClass: 'education__container bd-grid',
    itemTag: 'div',
    itemClass: 'education__content',
    itemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
    printItemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
    get itemComponent() { return EducationItem; },
    renderMarkdown: educationMarkdown,
    renderXML: educationXML,
    renderPlainText: educationPlainText,
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

  // 6. Habilidades Técnicas y Especialidades
  {
    type: 'skills',
    label: 'Habilidades Técnicas',
    defaultTitle: 'HABILIDADES TÉCNICAS',
    defaultColumn: 'left',
    icon: 'Wrench',
    allowDelete: true,
    allowAddItem: true,
    allowDeleteItem: true,
    hasTitle: true,
    hasItemDrag: true,
    supportsBulletCustomization: false,
    isListItem: true,
    sectionClass: 'skills',
    containerTag: 'ul',
    containerClass: 'skills__content bd-grid',
    containerStyle: { gridTemplateColumns: '1fr', padding: 0 },
    printContainerStyle: { gridTemplateColumns: '1fr', padding: 0, margin: 0, listStyle: 'none' },
    itemTag: 'li',
    itemClass: 'skills__name',
    itemStyle: { display: 'flex', alignItems: 'flex-start', listStyle: 'none', position: 'relative', color: 'var(--text-color)', background: 'transparent' },
    printItemStyle: { display: 'flex', alignItems: 'flex-start', listStyle: 'none', position: 'relative', color: 'var(--text-color)', background: 'transparent' },
    get itemComponent() { return SkillsItem; },
    renderMarkdown: skillsMarkdown,
    renderXML: skillsXML,
    renderPlainText: skillsPlainText,
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

  // 7. Certificaciones y Licencias Detalladas
  {
    type: 'certificates',
    label: 'Certificaciones y Credenciales',
    defaultTitle: 'CERTIFICACIONES',
    defaultColumn: 'left',
    icon: 'BadgeCheck',
    allowDelete: true,
    allowAddItem: true,
    allowDeleteItem: true,
    hasTitle: true,
    hasItemDrag: true,
    supportsBulletCustomization: false,
    sectionClass: 'education',
    containerTag: 'div',
    containerClass: 'education__container bd-grid',
    itemTag: 'div',
    itemClass: 'experience__content',
    itemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
    printItemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
    get itemComponent() { return CertificatesItem; },
    renderMarkdown: certificatesMarkdown,
    createDefaultItem: () => ({
      id: generateUniqueId('cert'),
      title: 'AWS Certified Solutions Architect',
      subtitle: 'Amazon Web Services',
      date: '2025',
      credentialId: 'AWS-PSA-98214',
      link: 'aws.amazon.com/verification',
      linkText: 'Ver credencial oficial'
    }),
    adaptItem: (item) => {
      const src = item || {};
      return {
        id: src.id || generateUniqueId('cert'),
        title: src.title || src.name || src.text || 'Certificación Profesional',
        subtitle: src.subtitle || 'Entidad Emisora',
        date: src.date || '2025',
        credentialId: src.credentialId || '',
        link: src.link || '',
        linkText: src.linkText || 'Verificar'
      };
    },
    schema: { title: 'string', subtitle: 'string', date: 'string', credentialId: 'string', link: 'string' }
  },

  // 8. Idiomas con Nivel de Fluidez
  {
    type: 'languages',
    label: 'Idiomas',
    defaultTitle: 'IDIOMAS',
    defaultColumn: 'left',
    icon: 'Languages',
    allowDelete: true,
    allowAddItem: true,
    allowDeleteItem: true,
    hasTitle: true,
    hasItemDrag: true,
    supportsBulletCustomization: false,
    sectionClass: 'skills',
    containerTag: 'div',
    containerClass: 'skills__content bd-grid',
    itemTag: 'div',
    itemClass: 'experience__content',
    itemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
    printItemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
    get itemComponent() { return LanguagesItem; },
    renderMarkdown: languagesMarkdown,
    createDefaultItem: () => ({
      id: generateUniqueId('lang'),
      title: 'Inglés',
      subtitle: 'C2 Avanzado / Profesional',
      description: 'Certificación Internacional EF SET 75/100 · Fluidez técnica oral y escrita'
    }),
    adaptItem: (item) => {
      const src = item || {};
      return {
        id: src.id || generateUniqueId('lang'),
        title: src.title || src.language || src.name || src.text || 'Idioma',
        subtitle: src.subtitle || src.level || 'B2 Intermedio Avanzado',
        description: src.description || ''
      };
    },
    schema: { title: 'string', subtitle: 'string', description: 'string' }
  },

  // 9. Premios y Reconocimientos
  {
    type: 'awards',
    label: 'Premios y Distinciones',
    defaultTitle: 'PREMIOS Y RECONOCIMIENTOS',
    defaultColumn: 'right',
    icon: 'Trophy',
    allowDelete: true,
    allowAddItem: true,
    allowDeleteItem: true,
    hasTitle: true,
    hasItemDrag: true,
    supportsBulletCustomization: false,
    sectionClass: 'education',
    containerTag: 'div',
    containerClass: 'education__container bd-grid',
    itemTag: 'div',
    itemClass: 'experience__content',
    itemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
    printItemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
    get itemComponent() { return AwardsItem; },
    renderMarkdown: awardsMarkdown,
    createDefaultItem: () => ({
      id: generateUniqueId('award'),
      title: '1er Puesto — Hackathon Nacional de IA e Innovación',
      subtitle: 'Ministerio de Ciencia y Tecnología & IEEE',
      date: '2024',
      description: 'Desarrollo de un sistema de diagnóstico predictivo en tiempo real premiado por impacto e innovación.'
    }),
    adaptItem: (item) => {
      const src = item || {};
      return {
        id: src.id || generateUniqueId('award'),
        title: src.title || src.name || 'Premio / Distinción de Honor',
        subtitle: src.subtitle || 'Institución Otorgante',
        date: src.date || '2024',
        description: src.description || ''
      };
    },
    schema: { title: 'string', subtitle: 'string', date: 'string', description: 'string' }
  },

  // 10. Publicaciones y Artículos
  {
    type: 'publications',
    label: 'Publicaciones y Artículos',
    defaultTitle: 'PUBLICACIONES',
    defaultColumn: 'right',
    icon: 'BookOpen',
    allowDelete: true,
    allowAddItem: true,
    allowDeleteItem: true,
    hasTitle: true,
    hasItemDrag: true,
    supportsBulletCustomization: false,
    sectionClass: 'education',
    containerTag: 'div',
    containerClass: 'education__container bd-grid',
    itemTag: 'div',
    itemClass: 'experience__content',
    itemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
    printItemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
    get itemComponent() { return PublicationsItem; },
    renderMarkdown: publicationsMarkdown,
    createDefaultItem: () => ({
      id: generateUniqueId('pub'),
      title: 'Optimización de Arquitecturas de Microservicios con Event-Driven Design',
      subtitle: 'IEEE Latin America Transactions / Conferencia Regional',
      date: '2024',
      link: 'doi.org/10.1109/sample-paper',
      linkText: 'Leer Paper / DOI',
      description: 'Análisis empírico de rendimiento en backends distribuidos bajo alta concurrencia.'
    }),
    adaptItem: (item) => {
      const src = item || {};
      return {
        id: src.id || generateUniqueId('pub'),
        title: src.title || src.name || 'Título de Publicación o Artículo',
        subtitle: src.subtitle || 'Revista, Editorial o Medio',
        date: src.date || '2024',
        link: src.link || '',
        linkText: src.linkText || 'Leer Artículo',
        description: src.description || ''
      };
    },
    schema: { title: 'string', subtitle: 'string', date: 'string', link: 'string', description: 'string' }
  },

  // 11. Voluntariado y Liderazgo Comunitario
  {
    type: 'volunteering',
    label: 'Voluntariado y Liderazgo',
    defaultTitle: 'VOLUNTARIADO Y LIDERAZGO',
    defaultColumn: 'right',
    icon: 'HeartHandshake',
    allowDelete: true,
    allowAddItem: true,
    allowDeleteItem: true,
    hasTitle: true,
    hasItemDrag: true,
    supportsBulletCustomization: true,
    sectionClass: 'experience',
    containerTag: 'div',
    containerClass: 'experience__container bd-grid',
    itemTag: 'div',
    itemClass: 'experience__content',
    itemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
    printItemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
    get itemComponent() { return VolunteeringItem; },
    renderMarkdown: baseItemMarkdown,
    createDefaultItem: () => ({
      id: generateUniqueId('vol'),
      title: 'Mentor y Organizador Comunitario',
      subtitle: 'Comunidad Tecnológica / Open Source Argentina',
      date: '2023 – Presente',
      description: 'Capacitación gratuita en programación y desarrollo web para más de 120 jóvenes estudiantes.',
      bullets: [
        'Coordiné talleres prácticos sobre Git, Linux y desarrollo web moderno.',
        'Contribuí activamente a repositorios de código abierto de la comunidad.'
      ]
    }),
    adaptItem: (item) => {
      const src = item || {};
      return {
        id: src.id || generateUniqueId('vol'),
        title: src.title || src.name || 'Rol de Voluntariado',
        subtitle: src.subtitle || 'Organización / Comunidad',
        date: src.date || '2024',
        description: src.description || '',
        bullets: Array.isArray(src.bullets) ? src.bullets : ['Contribución comunitaria con impacto positivo.']
      };
    },
    schema: { title: 'string', subtitle: 'string', date: 'string', bullets: 'array' }
  },

  // 12. Referencias Profesionales
  {
    type: 'references',
    label: 'Referencias Profesionales',
    defaultTitle: 'REFERENCIAS',
    defaultColumn: 'left',
    icon: 'UserCheck',
    allowDelete: true,
    allowAddItem: true,
    allowDeleteItem: true,
    hasTitle: true,
    hasItemDrag: true,
    supportsBulletCustomization: false,
    sectionClass: 'skills',
    containerTag: 'div',
    containerClass: 'skills__content bd-grid',
    itemTag: 'div',
    itemClass: 'experience__content',
    itemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
    printItemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
    get itemComponent() { return ReferencesItem; },
    renderMarkdown: referencesMarkdown,
    createDefaultItem: () => ({
      id: generateUniqueId('ref'),
      title: 'Ing. Martín González',
      subtitle: 'Líder de Arquitectura & DevOps en Globant',
      email: 'martin.gonzalez@ejemplo.com',
      phone: '+54 9 381 555-1234',
      relationship: 'Ex-Líder Técnico Directo'
    }),
    adaptItem: (item) => {
      const src = item || {};
      return {
        id: src.id || generateUniqueId('ref'),
        title: src.title || src.name || 'Nombre de Referencia',
        subtitle: src.subtitle || 'Cargo y Empresa',
        email: src.email || '',
        phone: src.phone || '',
        relationship: src.relationship || 'Referencia Laboral'
      };
    },
    schema: { title: 'string', subtitle: 'string', email: 'string', phone: 'string', relationship: 'string' }
  },

  // 13. Lista Simple / Certificaciones / Otros
  {
    type: 'simple_list',
    label: 'Lista Simple / Cursos',
    defaultTitle: 'CURSOS Y CERTIFICACIONES',
    defaultColumn: 'right',
    icon: 'ListCheck',
    allowDelete: true,
    allowAddItem: true,
    allowDeleteItem: true,
    hasTitle: true,
    hasItemDrag: true,
    supportsBulletCustomization: false,
    isListItem: true,
    sectionClass: 'experience',
    containerTag: 'ul',
    containerClass: 'experience__bullets simple-list-ul',
    containerStyle: { color: 'var(--text-color)', padding: 0 },
    printContainerStyle: { color: 'var(--text-color)', paddingLeft: 0, marginTop: '0.25rem', marginBottom: 0, listStyle: 'none', listStyleType: 'none' },
    itemTag: 'li',
    itemClass: 'simple-list-item',
    itemStyle: { display: 'flex', alignItems: 'flex-start', listStyle: 'none', position: 'relative', color: 'var(--text-color)' },
    printItemStyle: { display: 'flex', alignItems: 'flex-start', listStyle: 'none', listStyleType: 'none', marginBottom: 'var(--item-gap, 8px)', lineHeight: 1.45, color: 'var(--text-color)' },
    get itemComponent() { return SimpleListItem; },
    renderMarkdown: simpleListMarkdown,
    renderXML: simpleListXML,
    renderPlainText: simpleListPlainText,
    createDefaultItem: () => ({
      id: generateUniqueId('item'),
      text: 'Nueva Certificación / Curso — Institución (2025)'
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

  // 14. Espacio en Blanco (Espaciador Vertical Ajustable)
  {
    type: 'spacer',
    label: 'Espacio en Blanco',
    description: 'Espacio vertical ajustable para balancear columnas y maquetar el documento',
    defaultTitle: '',
    defaultColumn: 'right',
    icon: 'MoveVertical',
    allowDelete: true,
    allowAddItem: false,
    allowDeleteItem: false,
    hasTitle: false,
    hasItemDrag: false,
    supportsBulletCustomization: false,
    isSpacer: true,
    sectionClass: 'spacer-section',
    containerTag: 'div',
    containerClass: 'spacer-container',
    itemTag: 'div',
    itemClass: 'spacer-item',
    sectionComponent: SpacerBlock,
    get itemComponent() { return SpacerItem; },
    renderMarkdown: () => '\n<br/>\n',
    renderXML: (item) => `<spacer height="${item?.height || 40}"/>`,
    renderPlainText: () => '\n',
    createDefaultItem: () => ({
      id: generateUniqueId('space'),
      height: 40,
      backgroundColor: 'transparent'
    }),
    adaptItem: (item) => {
      const src = item || {};
      return {
        id: src.id || generateUniqueId('space'),
        height: Number(src.height) || 40,
        backgroundColor: src.backgroundColor || 'transparent'
      };
    },
    schema: { height: 'number', backgroundColor: 'string' }
  }
];

// Register standard descriptors
standardDescriptors.forEach(d => registerSectionType(d));

/**
 * M5 Extensibility Smoke-Test: 'mentoring' section type.
 *
 * This call (plus the MentoringItem import at the top of this file) is the
 * ONLY change needed across the entire codebase to add a fully-functional
 * new section type. BaseItem, BaseSection, CVContext, and App are untouched.
 *
 * This proves the Template + Factory pattern is working correctly.
 */
registerSectionType({
  type: 'mentoring',
  label: 'Mentoría',
  defaultTitle: 'MENTORÍA Y COACHING',
  defaultColumn: 'right',
  icon: 'Brain',
  description: 'Sesiones de mentoría, coaching técnico, o acompañamiento profesional.',
  allowDelete: true,
  allowAddItem: true,
  allowDeleteItem: true,
  hasTitle: true,
  hasItemDrag: true,
  supportsBulletCustomization: false,
  sectionClass: 'experience',
  containerTag: 'div',
  containerClass: 'experience__container bd-grid',
  itemTag: 'div',
  itemClass: 'experience__content',
  itemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
  printItemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
  get itemComponent() { return MentoringItem; },
  renderMarkdown: baseItemMarkdown,
  createDefaultItem: () => ({
    id: generateUniqueId('mentor'),
    title: 'Mentoría Técnica',
    date: '2024 – Presente',
    mentee: 'Nombre del mentee / Empresa',
    description: 'Descripción del impacto y habilidades transferidas durante la mentoría.'
  }),
  adaptItem: (source) => {
    const src = source || {};
    return {
      id: src.id || generateUniqueId('mentor'),
      title: src.title || 'Mentoría Técnica',
      date: src.date || '2024',
      mentee: src.mentee || src.subtitle || 'Mentee',
      description: src.description || (Array.isArray(src.bullets) ? src.bullets.join(' ') : '')
    };
  },
  schema: { title: 'string', date: 'string', mentee: 'string', description: 'string' }
});

/**
 * Modular Photo Section Component Registration
 * Enables adding a customizable profile picture to the CV (left or right column)
 * Supporting local file upload (Data URL) and external web image URLs.
 */
registerSectionType({
  type: 'photo',
  label: 'Foto de Perfil',
  defaultTitle: '',
  defaultColumn: 'left',
  icon: 'Camera',
  description: 'Fotografía profesional de perfil con carga de archivo local o enlace URL y formas personalizables.',
  allowDelete: true,
  allowAddItem: false,
  allowDeleteItem: true,
  hasTitle: false,
  hasItemDrag: false,
  supportsBulletCustomization: false,
  sectionClass: 'cv-section-photo',
  containerTag: 'div',
  containerClass: 'photo__container',
  itemTag: 'div',
  itemClass: 'photo__content',
  itemStyle: { display: 'flex', justifyContent: 'center', width: '100%' },
  printItemStyle: { display: 'flex', justifyContent: 'center', width: '100%' },
  get itemComponent() { return PhotoItem; },
  renderMarkdown: (item) => item?.url ? `![Foto de Perfil](${item.url})\n` : '',
  renderXML: (item) => `<photo url="${item?.url || ''}" shape="${item?.shape || 'circle'}" size="${item?.size || 130}"/>`,
  renderPlainText: () => '',
  createDefaultItem: () => ({
    id: generateUniqueId('photo'),
    url: '',
    shape: 'circle',
    size: 130,
    alt: 'Foto de Perfil'
  }),
  adaptItem: (source) => {
    const src = source || {};
    return {
      id: src.id || generateUniqueId('photo'),
      url: src.url || src.image || '',
      shape: src.shape || 'circle',
      size: Number(src.size) || 130,
      alt: src.alt || 'Foto de Perfil'
    };
  },
  schema: { url: 'string', shape: 'string', size: 'number', alt: 'string' }
});

/**
 * Modular Contact Section Component Registration
 * Enables candidate contact details, links, and networks to be detached
 * from title/subtitle and placed freely across any column or layout position.
 */
registerSectionType({
  type: 'contact',
  label: 'Información de Contacto',
  defaultTitle: '',
  defaultColumn: 'left',
  icon: 'Contact',
  description: 'Datos de contacto, redes sociales, enlaces profesionales y canales de comunicación.',
  allowDelete: true,
  allowAddItem: false,
  allowDeleteItem: true,
  hasTitle: false,
  hasItemDrag: false,
  supportsBulletCustomization: false,
  sectionClass: 'social',
  wrapperClass: '',
  containerTag: 'div',
  containerClass: '',
  itemTag: 'div',
  itemClass: '',
  itemStyle: { position: 'relative', color: 'var(--text-color)' },
  printItemStyle: { position: 'relative', color: 'var(--text-color)' },
  get itemComponent() { return ContactItem; },
  createDefaultItem: () => ({
    id: generateUniqueId('contact'),
    contacts: [
      { id: 'c_email', type: 'email', value: 'tuemail@ejemplo.com' },
      { id: 'c_phone', type: 'phone', value: '+00 123 456 789' },
      { id: 'c_loc', type: 'location', value: 'Ciudad, País' },
      { id: 'c_linkedin', type: 'linkedin', value: 'linkedin.com/in/tu-perfil' },
      { id: 'c_github', type: 'github', value: 'github.com/tu-usuario' }
    ]
  }),
  adaptItem: (source) => {
    const src = source || {};
    const contacts = normalizeItemContacts(src);
    return {
      id: src.id || generateUniqueId('contact'),
      contacts,
      ...syncFlatContactFields(contacts)
    };
  },
  schema: { contacts: 'array', email: 'string', phone: 'string', location: 'string', linkedin: 'string', github: 'string' }
});

/**
 * Modular Title & Subtitle Section Component Registration
 * Enables candidate name and professional title to be detached
 * and placed freely across any column or layout position.
 */
registerSectionType({
  type: 'title_subtitle',
  label: 'Título y Subtítulo',
  defaultTitle: '',
  defaultColumn: 'left',
  icon: 'UserSquare2',
  description: 'Nombre y título profesional del candidato, desacoplado e independiente de los datos de contacto.',
  allowDelete: true,
  allowAddItem: false,
  allowDeleteItem: false,
  hasTitle: false,
  hasItemDrag: false,
  supportsBulletCustomization: false,
  isHeader: true,
  sectionClass: 'home',
  wrapperClass: '',
  containerTag: 'div',
  containerClass: 'home__container bd-grid',
  itemTag: 'div',
  itemClass: 'home__data bd-grid',
  itemStyle: { position: 'relative', color: 'var(--text-color)' },
  printItemStyle: { position: 'relative', color: 'var(--text-color)' },
  get itemComponent() { return ProfileTitleItem; },
  createDefaultItem: () => ({
    id: generateUniqueId('prof'),
    name: 'TU NOMBRE Y APELLIDO',
    subtitle: 'Título Profesional / Especialidad'
  }),
  adaptItem: (item) => {
    const src = item || {};
    return {
      id: src.id || generateUniqueId('prof'),
      name: src.name || src.title || '',
      subtitle: src.subtitle || ''
    };
  },
  schema: { name: 'string', subtitle: 'string' }
});



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
export const createDefaultSection = (column = 'right', type = 'list', title, bulletStyle) => {
  const descriptor = getSectionDescriptor(type);
  const finalTitle = title !== undefined ? title : descriptor.defaultTitle;
  const sectionId = generateUniqueId(type === 'spacer' ? 'spacer' : 'sec');
  const defaultItem = createDefaultItem(type);

  const baseSection = {
    id: sectionId,
    column: column || descriptor.defaultColumn || 'right',
    type: type || 'list',
    title: finalTitle,
    items: [defaultItem],
    bulletStyle: bulletStyle || { size: 'normal', variant: 'bold', showLine: true },
    bottomSpacing: 0
  };

  if (type === 'spacer') {
    baseSection.height = defaultItem?.height || 40;
    baseSection.backgroundColor = defaultItem?.backgroundColor || 'transparent';
  }

  return baseSection;
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
