import PublicationsItem from '../../components/CV/items/PublicationsItem';
import { publicationsMarkdown } from '../itemFormatters';
import { generateUniqueId } from './idGenerator';

export const publicationsDescriptor = {
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
};

export default publicationsDescriptor;
