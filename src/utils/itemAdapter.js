/**
 * itemAdapter.js
 * 
 * Re-exports polymorphic item conversion, section creation, and item factories
 * from the unified sectionRegistry.
 */
export {
  registerSectionType,
  getSectionDescriptor,
  getAllSectionDescriptors,
  createDefaultItem,
  createDefaultItemForSection,
  createDefaultSection,
  adaptItemToSectionType
} from '../registry/sectionRegistry';
