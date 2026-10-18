import ProjectsItem from '../../components/CV/items/ProjectsItem';
import { baseItemMarkdown } from '../itemFormatters';
import { generateUniqueId } from './idGenerator';

export const projectsDescriptor = {
  type: 'projects',
  label: 'Proyectos Destacados',
  defaultTitle: 'PROYECTOS DESTACADOS',
  defaultColumn: 'right',
  icon: 'FolderGit2',
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
  get itemComponent() { return ProjectsItem; },
  renderMarkdown: baseItemMarkdown,
  createDefaultItem: () => ({
    id: generateUniqueId('proj'),
    title: 'Plataforma SaaS de Automatización',
    subtitle: 'React · Node.js · PostgreSQL · Docker',
    date: '2025',
    link: 'github.com/usuario/proyecto',
    linkText: 'Demo / Repositorio GitHub',
    description: 'Arquitectura escalable de microservicios con sincronización en tiempo real y tests integrados.',
    bullets: [
      'Implementé pipelines de CI/CD automatizados reduciendo tiempos de despliegue en un 50%.',
      'Diseñé una interfaz reactiva accesible optimizada para altos volúmenes de usuarios.'
    ]
  }),
  adaptItem: (item) => {
    const src = item || {};
    return {
      id: src.id || generateUniqueId('proj'),
      title: src.title || src.name || 'Proyecto Destacado',
      subtitle: src.subtitle || 'Stack Tecnológico / Herramientas',
      date: src.date || '2025',
      link: src.link || '',
      linkText: src.link ? (src.linkText || 'Ver Proyecto') : (src.linkText || ''),
      description: src.description || '',
      bullets: Array.isArray(src.bullets) ? src.bullets : ['Logro clave del proyecto con impacto directo.']
    };
  },
  schema: { title: 'string', subtitle: 'string', date: 'string', link: 'string', bullets: 'array' }
};

export default projectsDescriptor;
