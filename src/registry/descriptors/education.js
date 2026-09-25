import EducationItem from '../../components/CV/items/EducationItem';
import {
  educationMarkdown,
  educationXML,
  educationPlainText
} from '../itemFormatters';
import { generateUniqueId } from './idGenerator';

export const educationDescriptor = {
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
};

export default educationDescriptor;
