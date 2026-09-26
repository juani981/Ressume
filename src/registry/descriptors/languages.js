import LanguagesItem from '../../components/CV/items/LanguagesItem';
import { languagesMarkdown } from '../itemFormatters';
import { generateUniqueId } from './idGenerator';

export const languagesDescriptor = {
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
};

export default languagesDescriptor;
