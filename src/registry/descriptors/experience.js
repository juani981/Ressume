import ExperienceItem from '../../components/CV/items/ExperienceItem';
import { baseItemMarkdown } from '../itemFormatters';
import { generateUniqueId } from './idGenerator';

export const experienceDescriptor = {
  type: 'list',
  label: 'Experiencia Laboral',
  defaultTitle: 'EXPERIENCIA LABORAL',
  defaultColumn: 'right',
  icon: 'Briefcase',
  allowDelete: true,
  allowAddItem: true,
  allowDeleteItem: true,
  hasTitle: true,
  hasItemDrag: true,
  supportsBulletCustomization: true,
  sectionClass: 'experience',
  containerTag: 'div',
  containerClass: 'experience__container bd-grid',
  itemTag: 'div',
  itemClass: 'experience__content',
  itemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
  printItemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
  get itemComponent() { return ExperienceItem; },
  renderMarkdown: baseItemMarkdown,
  createDefaultItem: () => ({
    id: generateUniqueId('exp'),
    title: 'Nuevo Cargo / Rol Profesional',
    subtitle: 'Empresa / Institución | Ubicación',
    date: '2025 – Presente',
    bullets: [
      'Liderazgo y ejecución técnica con resultados medibles e impacto directo.',
      'Diseñé y automaticé flujos de trabajo con metodologías ágiles.'
    ]
  }),
  adaptItem: (item) => {
    const src = item || {};
    let bullets = [];
    if (src.bullets && Array.isArray(src.bullets) && src.bullets.length > 0) {
      bullets = [...src.bullets];
    } else if (src.description) {
      bullets = src.description.split('\n').filter(b => b.trim());
      if (bullets.length === 0) bullets = [src.description];
    } else if (src.text) {
      bullets = [src.text];
    } else {
      bullets = ['Liderazgo y ejecución técnica con resultados medibles e impacto directo.'];
    }

    return {
      id: src.id || generateUniqueId('exp'),
      title: src.title || src.name || src.text || 'Nuevo Cargo / Rol',
      subtitle: src.subtitle || 'Organización / Empresa',
      date: src.date || '2024 – Actualidad',
      link: src.link || '',
      linkText: src.linkText || '',
      description: src.description || '',
      bullets
    };
  },
  schema: { title: 'string', subtitle: 'string', date: 'string', bullets: 'array' }
};

export default experienceDescriptor;
