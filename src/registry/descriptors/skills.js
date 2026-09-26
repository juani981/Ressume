import SkillsItem from '../../components/CV/items/SkillsItem';
import {
  skillsMarkdown,
  skillsXML,
  skillsPlainText
} from '../itemFormatters';
import { generateUniqueId } from './idGenerator';

export const skillsDescriptor = {
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
};

export default skillsDescriptor;
