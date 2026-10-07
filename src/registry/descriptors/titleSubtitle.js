import ProfileTitleItem from '../../components/CV/items/ProfileTitleItem';
import { generateUniqueId } from './idGenerator';
import { profileHeaderMarkdown } from '../itemFormatters';

export const titleSubtitleDescriptor = {
  type: 'title_subtitle',
  label: 'Título y Subtítulo',
  defaultTitle: '',
  defaultColumn: 'left',
  icon: 'UserSquare2',
  description: 'Nombre y título profesional del candidato, desacoplado e independiente de los datos de contacto.',
  allowDelete: true,
  allowAddItem: false,
  allowDeleteItem: false,
  hasTitle: false,
  hasItemDrag: false,
  allowSectionDrag: false,
  isMoveDisabled: true,
  supportsBulletCustomization: false,
  isHeader: true,
  sectionClass: 'home',
  wrapperClass: '',
  containerTag: 'div',
  containerClass: 'home__container bd-grid',
  itemTag: 'div',
  itemClass: 'home__data bd-grid',
  itemStyle: { position: 'relative', color: 'var(--text-color)' },
  printItemStyle: { position: 'relative', color: 'var(--text-color)' },
  get itemComponent() { return ProfileTitleItem; },
  renderMarkdown: profileHeaderMarkdown,
  createDefaultItem: () => ({
    id: generateUniqueId('prof'),
    name: 'TU NOMBRE Y APELLIDO',
    subtitle: 'Título Profesional / Especialidad'
  }),
  adaptItem: (item) => {
    const src = item || {};
    return {
      id: src.id || generateUniqueId('prof'),
      name: src.name || src.title || '',
      subtitle: src.subtitle || ''
    };
  },
  schema: { name: 'string', subtitle: 'string' }
};

export default titleSubtitleDescriptor;
