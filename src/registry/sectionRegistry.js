import React from 'react';
import ExperienceItem from '../components/CV/items/ExperienceItem';
import {
  baseItemMarkdown,
  baseItemXML,
  baseItemPlainText,
} from './itemFormatters';
import { generateUniqueId } from './descriptors/idGenerator';
import { allDescriptors } from './descriptors/index';

/**
 * Registry of section definitions
 * @type {Map<string, Object>}
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

// Initialize registry with all standard and modular descriptors
allDescriptors.forEach((descriptor) => registerSectionType(descriptor));

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

export default {
  registerSectionType,
  getSectionDescriptor,
  getAllSectionDescriptors,
  getAllSectionTypes,
  createDefaultItem,
  createDefaultItemForSection,
  createDefaultSection,
  adaptItemToSectionType,
};
