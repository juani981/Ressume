import ContactItem from '../../components/CV/items/ContactItem';
import { normalizeItemContacts, syncFlatContactFields } from '../../utils/contactTypes';
import { generateUniqueId } from './idGenerator';
import { contactMarkdown, contactXML, contactPlainText } from '../itemFormatters';

export const contactDescriptor = {
  type: 'contact',
  label: 'Información de Contacto',
  defaultTitle: '',
  defaultColumn: 'left',
  icon: 'Contact',
  description: 'Datos de contacto, redes sociales, enlaces profesionales y canales de comunicación.',
  allowDelete: true,
  allowAddItem: false,
  allowDeleteItem: false,
  hasTitle: false,
  hasItemDrag: false,
  supportsBulletCustomization: false,
  sectionClass: 'social',
  wrapperClass: '',
  containerTag: 'div',
  containerClass: '',
  itemTag: 'div',
  itemClass: '',
  itemStyle: { position: 'relative', color: 'var(--text-color)' },
  printItemStyle: { position: 'relative', color: 'var(--text-color)' },
  get itemComponent() { return ContactItem; },
  renderMarkdown: contactMarkdown,
  renderXML: contactXML,
  renderPlainText: contactPlainText,
  createDefaultItem: () => ({
    id: generateUniqueId('contact'),
    contacts: [
      { id: 'c_email', type: 'email', value: 'tuemail@ejemplo.com' },
      { id: 'c_phone', type: 'phone', value: '+00 123 456 789' },
      { id: 'c_loc', type: 'location', value: 'Ciudad, País' },
      { id: 'c_linkedin', type: 'linkedin', value: 'linkedin.com/in/tu-perfil' },
      { id: 'c_github', type: 'github', value: 'github.com/tu-usuario' }
    ]
  }),
  adaptItem: (source) => {
    const src = source || {};
    const contacts = normalizeItemContacts(src);
    return {
      id: src.id || generateUniqueId('contact'),
      contacts,
      ...syncFlatContactFields(contacts)
    };
  },
  schema: { contacts: 'array', email: 'string', phone: 'string', location: 'string', linkedin: 'string', github: 'string' }
};

export default contactDescriptor;
