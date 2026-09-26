import CertificatesItem from '../../components/CV/items/CertificatesItem';
import { certificatesMarkdown } from '../itemFormatters';
import { generateUniqueId } from './idGenerator';

export const certificatesDescriptor = {
  type: 'certificates',
  label: 'Certificaciones y Credenciales',
  defaultTitle: 'CERTIFICACIONES',
  defaultColumn: 'left',
  icon: 'BadgeCheck',
  allowDelete: true,
  allowAddItem: true,
  allowDeleteItem: true,
  hasTitle: true,
  hasItemDrag: true,
  supportsBulletCustomization: false,
  sectionClass: 'education',
  containerTag: 'div',
  containerClass: 'education__container bd-grid',
  itemTag: 'div',
  itemClass: 'experience__content',
  itemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
  printItemStyle: { display: 'flex', position: 'relative', color: 'var(--text-color)' },
  get itemComponent() { return CertificatesItem; },
  renderMarkdown: certificatesMarkdown,
  createDefaultItem: () => ({
    id: generateUniqueId('cert'),
    title: 'AWS Certified Solutions Architect',
    subtitle: 'Amazon Web Services',
    date: '2025',
    credentialId: 'AWS-PSA-98214',
    link: 'aws.amazon.com/verification',
    linkText: 'Ver credencial oficial'
  }),
  adaptItem: (item) => {
    const src = item || {};
    return {
      id: src.id || generateUniqueId('cert'),
      title: src.title || src.name || src.text || 'Certificación Profesional',
      subtitle: src.subtitle || 'Entidad Emisora',
      date: src.date || '2025',
      credentialId: src.credentialId || '',
      link: src.link || '',
      linkText: src.linkText || 'Verificar'
    };
  },
  schema: { title: 'string', subtitle: 'string', date: 'string', credentialId: 'string', link: 'string' }
};

export default certificatesDescriptor;
