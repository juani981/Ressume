import SimpleListItem from '../../components/CV/items/SimpleListItem';
import {
  simpleListMarkdown,
  simpleListXML,
  simpleListPlainText
} from '../itemFormatters';
import { generateUniqueId } from './idGenerator';

export const simpleListDescriptor = {
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
};

export default simpleListDescriptor;
