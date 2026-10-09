import PhotoItem from '../../components/CV/items/PhotoItem';
import { generateUniqueId } from './idGenerator';

export const photoDescriptor = {
  type: 'photo',
  label: 'Foto de Perfil',
  defaultTitle: '',
  defaultColumn: 'left',
  icon: 'Camera',
  description: 'Fotografía profesional de perfil con carga de archivo local o enlace URL y formas personalizables.',
  allowDelete: true,
  allowAddItem: false,
  allowDeleteItem: false,
  hasTitle: false,
  hasItemDrag: false,
  supportsBulletCustomization: false,
  sectionClass: 'cv-section-photo',
  containerTag: 'div',
  containerClass: 'photo__container',
  itemTag: 'div',
  itemClass: 'photo__content',
  itemStyle: { display: 'flex', justifyContent: 'center', width: '100%' },
  printItemStyle: { display: 'flex', justifyContent: 'center', width: '100%' },
  get itemComponent() { return PhotoItem; },
  renderMarkdown: (item) => item?.url ? `![Foto de Perfil](${item.url})\n` : '',
  renderXML: (item) => `<photo url="${item?.url || ''}" shape="${item?.shape || 'circle'}" size="${item?.size || 130}"/>`,
  renderPlainText: () => '',
  createDefaultItem: () => ({
    id: generateUniqueId('photo'),
    url: '',
    shape: 'circle',
    size: 130,
    alt: 'Foto de Perfil'
  }),
  adaptItem: (source) => {
    const src = source || {};
    return {
      id: src.id || generateUniqueId('photo'),
      url: src.url || src.image || '',
      shape: src.shape || 'circle',
      size: Number(src.size) || 130,
      alt: src.alt || 'Foto de Perfil'
    };
  },
  schema: { url: 'string', shape: 'string', size: 'number', alt: 'string' }
};

export default photoDescriptor;
