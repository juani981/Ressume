import SpacerItem from '../../components/CV/items/SpacerItem';
import SpacerBlock from '../../components/CV/SpacerBlock';
import { generateUniqueId } from './idGenerator';

export const spacerDescriptor = {
  type: 'spacer',
  label: 'Espacio en Blanco',
  description: 'Espacio vertical ajustable para balancear columnas y maquetar el documento',
  defaultTitle: '',
  defaultColumn: 'right',
  icon: 'MoveVertical',
  allowDelete: true,
  allowAddItem: false,
  allowDeleteItem: false,
  hasTitle: false,
  hasItemDrag: false,
  supportsBulletCustomization: false,
  isSpacer: true,
  sectionClass: 'spacer-section',
  containerTag: 'div',
  containerClass: 'spacer-container',
  itemTag: 'div',
  itemClass: 'spacer-item',
  sectionComponent: SpacerBlock,
  get itemComponent() { return SpacerItem; },
  renderMarkdown: () => '\n<br/>\n',
  renderXML: (item) => `<spacer height="${item?.height || 40}"/>`,
  renderPlainText: () => '\n',
  createDefaultItem: () => ({
    id: generateUniqueId('space'),
    height: 40,
    backgroundColor: 'transparent'
  }),
  adaptItem: (item) => {
    const src = item || {};
    return {
      id: src.id || generateUniqueId('space'),
      height: Number(src.height) || 40,
      backgroundColor: src.backgroundColor || 'transparent'
    };
  },
  schema: { height: 'number', backgroundColor: 'string' }
};

export default spacerDescriptor;
