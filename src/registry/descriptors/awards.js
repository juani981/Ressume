import AwardsItem from '../../components/CV/items/AwardsItem';
import { awardsMarkdown } from '../itemFormatters';
import { generateUniqueId } from './idGenerator';

export const awardsDescriptor = {
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
};

export default awardsDescriptor;
