import MentoringItem from '../../components/CV/items/MentoringItem';
import { mentoringMarkdown } from '../itemFormatters';
import { generateUniqueId } from './idGenerator';

export const mentoringDescriptor = {
  type: 'mentoring',
  label: 'Mentoría',
  defaultTitle: 'MENTORÍA Y COACHING',
  defaultColumn: 'right',
  icon: 'Brain',
  description: 'Sesiones de mentoría, coaching técnico, o acompañamiento profesional.',
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
  get itemComponent() { return MentoringItem; },
  renderMarkdown: mentoringMarkdown,
  createDefaultItem: () => ({
    id: generateUniqueId('mentor'),
    title: 'Mentoría Técnica',
    date: '2024 – Presente',
    mentee: 'Nombre del mentee / Empresa',
    description: 'Descripción del impacto y habilidades transferidas durante la mentoría.'
  }),
  adaptItem: (source) => {
    const src = source || {};
    return {
      id: src.id || generateUniqueId('mentor'),
      title: src.title || 'Mentoría Técnica',
      date: src.date || '2024',
      mentee: src.mentee || src.subtitle || 'Mentee',
      description: src.description || (Array.isArray(src.bullets) ? src.bullets.join(' ') : '')
    };
  },
  schema: { title: 'string', date: 'string', mentee: 'string', description: 'string' }
};

export default mentoringDescriptor;
