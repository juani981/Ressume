import ReferencesItem from '../../components/CV/items/ReferencesItem';
import { referencesMarkdown } from '../itemFormatters';
import { generateUniqueId } from './idGenerator';

export const referencesDescriptor = {
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
};

export default referencesDescriptor;
