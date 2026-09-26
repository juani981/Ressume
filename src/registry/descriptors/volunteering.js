import VolunteeringItem from '../../components/CV/items/VolunteeringItem';
import { baseItemMarkdown } from '../itemFormatters';
import { generateUniqueId } from './idGenerator';

export const volunteeringDescriptor = {
  type: 'volunteering',
  label: 'Voluntariado y Liderazgo',
  defaultTitle: 'VOLUNTARIADO Y LIDERAZGO',
  defaultColumn: 'right',
  icon: 'HeartHandshake',
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
  get itemComponent() { return VolunteeringItem; },
  renderMarkdown: baseItemMarkdown,
  createDefaultItem: () => ({
    id: generateUniqueId('vol'),
    title: 'Mentor y Organizador Comunitario',
    subtitle: 'Comunidad Tecnológica / Open Source Argentina',
    date: '2023 – Presente',
    description: 'Capacitación gratuita en programación y desarrollo web para más de 120 jóvenes estudiantes.',
    bullets: [
      'Coordiné talleres prácticos sobre Git, Linux y desarrollo web moderno.',
      'Contribuí activamente a repositorios de código abierto de la comunidad.'
    ]
  }),
  adaptItem: (item) => {
    const src = item || {};
    return {
      id: src.id || generateUniqueId('vol'),
      title: src.title || src.name || 'Rol de Voluntariado',
      subtitle: src.subtitle || 'Organización / Comunidad',
      date: src.date || '2024',
      description: src.description || '',
      bullets: Array.isArray(src.bullets) ? src.bullets : ['Contribución comunitaria con impacto positivo.']
    };
  },
  schema: { title: 'string', subtitle: 'string', date: 'string', bullets: 'array' }
};

export default volunteeringDescriptor;
