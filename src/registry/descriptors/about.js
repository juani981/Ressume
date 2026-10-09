import AboutItem from '../../components/CV/items/AboutItem';
import { aboutMarkdown } from '../itemFormatters';
import { generateUniqueId } from './idGenerator';

export const aboutDescriptor = {
  type: 'about',
  label: 'Perfil Profesional',
  defaultTitle: 'Perfil Profesional',
  defaultColumn: 'left',
  icon: 'UserSquare2',
  allowDelete: true,
  allowAddItem: false,
  allowDeleteItem: true,
  hasTitle: true,
  hasItemDrag: false,
  allowSectionDrag: false,
  isMoveDisabled: true,
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
};

export default aboutDescriptor;
