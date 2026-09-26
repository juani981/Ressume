import ProfileHeaderItem from '../../components/CV/items/ProfileHeaderItem';
import { generateUniqueId } from './idGenerator';
import { profileHeaderMarkdown } from '../itemFormatters';

export const profileHeaderDescriptor = {
  type: 'profile_header',
  label: 'Título y Subtítulo',
  defaultTitle: '',
  defaultColumn: 'left',
  icon: 'UserSquare2',
  allowDelete: false,
  allowAddItem: false,
  allowDeleteItem: false,
  hasTitle: false,
  hasItemDrag: false,
  supportsBulletCustomization: false,
  isHeader: true,
  hideControls: true,
  sectionClass: 'home',
  wrapperClass: '',
  containerTag: 'div',
  containerClass: 'home__container bd-grid',
  itemTag: 'div',
  itemClass: 'home__data bd-grid',
  itemStyle: { position: 'relative', color: 'var(--text-color)' },
  printItemStyle: { position: 'relative', color: 'var(--text-color)' },
  get itemComponent() { return ProfileHeaderItem; },
  renderMarkdown: profileHeaderMarkdown,
  createDefaultItem: () => ({
    id: generateUniqueId('prof'),
    name: '',
    subtitle: '',
    location: '',
    email: '',
    phone: '',
    linkedin: '',
    github: ''
  }),
  adaptItem: (item) => {
    const src = item || {};
    return {
      id: src.id || generateUniqueId('prof'),
      name: src.name || src.title || '',
      subtitle: src.subtitle || '',
      location: src.location || '',
      email: src.email || '',
      phone: src.phone || '',
      linkedin: src.linkedin || '',
      github: src.github || ''
    };
  },
  schema: { name: 'string', subtitle: 'string', location: 'string', email: 'string', phone: 'string', linkedin: 'string', github: 'string' }
};

export default profileHeaderDescriptor;
