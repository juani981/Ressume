import React from 'react';
import {
  Mail,
  Phone,
  MessageCircle,
  Send,
  MapPin,
  Laptop,
  IdCard,
  Calendar,
  Share2,
  FolderGit2,
  FolderGit,
  Code2,
  Layers,
  Briefcase,
  Globe,
  FileText,
  PenTool,
  Palette,
  Link as LinkIcon
} from 'lucide-react';

/**
 * Standardized Contact Types Catalog
 * 
 * Provides predefined, popular contact and profile item types with Lucide icons
 * tailored for recruiters and technical ATS-friendly resumes.
 */

export const CONTACT_ICON_MAP = {
  Mail,
  Phone,
  MessageCircle,
  Send,
  MapPin,
  Laptop,
  IdCard,
  Calendar,
  Share2,
  FolderGit2,
  FolderGit,
  Code2,
  Layers,
  Briefcase,
  Globe,
  FileText,
  PenTool,
  Palette,
  Link: LinkIcon
};

/**
 * ContactIcon component rendering Lucide-React SVG with fallback support
 */
export const ContactIcon = ({ name, size = 14, className = '', style = {}, ...props }) => {
  let IconComponent = CONTACT_ICON_MAP[name];

  if (!IconComponent && typeof name === 'string') {
    const lower = name.toLowerCase();
    if (lower.includes('envelope') || lower.includes('mail')) IconComponent = Mail;
    else if (lower.includes('phone')) IconComponent = Phone;
    else if (lower.includes('whatsapp')) IconComponent = MessageCircle;
    else if (lower.includes('telegram')) IconComponent = Send;
    else if (lower.includes('map') || lower.includes('location')) IconComponent = MapPin;
    else if (lower.includes('laptop')) IconComponent = Laptop;
    else if (lower.includes('id-card') || lower.includes('card')) IconComponent = IdCard;
    else if (lower.includes('calendar')) IconComponent = Calendar;
    else if (lower.includes('linkedin')) IconComponent = Share2;
    else if (lower.includes('github')) IconComponent = FolderGit2;
    else if (lower.includes('gitlab')) IconComponent = FolderGit;
    else if (lower.includes('code')) IconComponent = Code2;
    else if (lower.includes('stack-overflow') || lower.includes('stack')) IconComponent = Layers;
    else if (lower.includes('briefcase') || lower.includes('portfolio')) IconComponent = Briefcase;
    else if (lower.includes('globe') || lower.includes('website')) IconComponent = Globe;
    else if (lower.includes('medium') || lower.includes('blog')) IconComponent = FileText;
    else if (lower.includes('figma')) IconComponent = PenTool;
    else if (lower.includes('dribbble')) IconComponent = Palette;
  }

  if (!IconComponent) {
    IconComponent = LinkIcon;
  }

  return React.createElement(IconComponent, {
    size,
    className: `lucide ${className}`.trim(),
    style: { userSelect: 'none', WebkitUserSelect: 'none', ...style },
    'aria-hidden': 'true',
    focusable: 'false',
    role: 'presentation',
    ...props
  });
};

export const CONTACT_CATEGORIES = {
  direct: { id: 'direct', label: 'Contacto Directo' },
  availability: { id: 'availability', label: 'Ubicación & Disponibilidad' },
  code: { id: 'code', label: 'Código & Plataformas' },
  web: { id: 'web', label: 'Web & Portfolio' }
};

export const CONTACT_TYPES = [
  // Contacto Directo
  {
    id: 'email',
    label: 'Email',
    icon: 'Mail',
    category: 'direct',
    placeholder: 'tu.email@ejemplo.com'
  },
  {
    id: 'phone',
    label: 'Teléfono',
    icon: 'Phone',
    category: 'direct',
    placeholder: '+54 9 11 1234 5678'
  },
  {
    id: 'telegram',
    label: 'Telegram',
    icon: 'Send',
    category: 'direct',
    placeholder: 't.me/usuario'
  },

  // Ubicación & Disponibilidad
  {
    id: 'location',
    label: 'Ubicación',
    icon: 'MapPin',
    category: 'availability',
    placeholder: 'Ciudad, País'
  },
  {
    id: 'work_mode',
    label: 'Modalidad de Trabajo',
    icon: 'Laptop',
    category: 'availability',
    placeholder: 'Remoto / Híbrido'
  },
  {
    id: 'age',
    label: 'Edad / Fecha',
    icon: 'Calendar',
    category: 'availability',
    placeholder: '26 años'
  },
  // Web & Portfolio
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: 'Briefcase',
    category: 'web',
    placeholder: 'mi-portfolio.dev'
  },
  {
    id: 'website',
    label: 'Sitio Web',
    icon: 'Globe',
    category: 'web',
    placeholder: 'misitio.com'
  },
  // Código & Plataformas
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: 'Share2',
    category: 'code',
    placeholder: 'linkedin.com/in/usuario'
  },
  {
    id: 'github',
    label: 'GitHub',
    icon: 'FolderGit2',
    category: 'code',
    placeholder: 'github.com/usuario'
  },
  {
    id: 'gitlab',
    label: 'GitLab',
    icon: 'FolderGit',
    category: 'code',
    placeholder: 'gitlab.com/usuario'
  },
  {
    id: 'leetcode',
    label: 'LeetCode',
    icon: 'Code2',
    category: 'code',
    placeholder: 'leetcode.com/usuario'
  },
  {
    id: 'stackoverflow',
    label: 'Stack Overflow',
    icon: 'Layers',
    category: 'code',
    placeholder: 'stackoverflow.com/users/...'
  },
];

/**
 * Returns configuration metadata for a given contact type.
 * Falls back to generic link icon if not found.
 */
export const getContactConfig = (typeId) => {
  const found = CONTACT_TYPES.find(t => t.id === typeId);
  if (found) return found;

  return {
    id: typeId || 'custom',
    label: typeId ? typeId.charAt(0).toUpperCase() + typeId.slice(1) : 'Contacto',
    icon: 'Link',
    category: 'direct',
    placeholder: 'Información de contacto'
  };
};

/**
 * Normalizes item contacts into a unified array structure.
 * Automatically migrates legacy flat fields (location, email, phone, linkedin, github)
 * if `item.contacts` is undefined or not an array.
 */
export const normalizeItemContacts = (item) => {
  if (!item || typeof item !== 'object') return [];

  if (Array.isArray(item.contacts)) {
    return item.contacts;
  }

  // Fallback / legacy migration for flat fields
  const contacts = [];
  if (item.location) contacts.push({ id: 'contact_loc', type: 'location', value: item.location });
  if (item.email) contacts.push({ id: 'contact_email', type: 'email', value: item.email });
  if (item.phone) contacts.push({ id: 'contact_phone', type: 'phone', value: item.phone });
  if (item.linkedin) contacts.push({ id: 'contact_linkedin', type: 'linkedin', value: item.linkedin });
  if (item.github) contacts.push({ id: 'contact_github', type: 'github', value: item.github });

  return contacts;
};

/**
 * Syncs flat legacy fields (email, phone, etc.) from contacts array
 * to maintain 100% backward compatibility with tests and legacy code.
 */
export const syncFlatContactFields = (contacts) => {
  const flatFields = {
    location: '',
    email: '',
    phone: '',
    linkedin: '',
    github: ''
  };

  if (!Array.isArray(contacts)) return flatFields;

  contacts.forEach(c => {
    if (c.type === 'location' && !flatFields.location) flatFields.location = c.value || '';
    if (c.type === 'email' && !flatFields.email) flatFields.email = c.value || '';
    if (c.type === 'phone' && !flatFields.phone) flatFields.phone = c.value || '';
    if (c.type === 'linkedin' && !flatFields.linkedin) flatFields.linkedin = c.value || '';
    if (c.type === 'github' && !flatFields.github) flatFields.github = c.value || '';
  });

  return flatFields;
};

export { normalizePhoneNumber } from './phoneFormatter.js';
