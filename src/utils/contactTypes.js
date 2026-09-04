/**
 * Standardized Contact Types Catalog
 * 
 * Provides predefined, popular contact and profile item types with BoxIcons
 * tailored for recruiters and technical ATS-friendly resumes.
 */

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
    icon: 'bx bx-envelope',
    category: 'direct',
    placeholder: 'tu.email@ejemplo.com'
  },
  {
    id: 'phone',
    label: 'Teléfono',
    icon: 'bx bx-phone',
    category: 'direct',
    placeholder: '+54 9 11 1234 5678'
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: 'bx bxl-whatsapp',
    category: 'direct',
    placeholder: '+54 9 11 1234 5678'
  },
  {
    id: 'telegram',
    label: 'Telegram',
    icon: 'bx bxl-telegram',
    category: 'direct',
    placeholder: 't.me/usuario'
  },

  // Ubicación & Disponibilidad
  {
    id: 'location',
    label: 'Ubicación',
    icon: 'bx bx-map',
    category: 'availability',
    placeholder: 'Ciudad, País'
  },
  {
    id: 'work_mode',
    label: 'Modalidad de Trabajo',
    icon: 'bx bx-laptop',
    category: 'availability',
    placeholder: 'Remoto / Híbrido'
  },
  {
    id: 'citizenship',
    label: 'Ciudadanía / Visado',
    icon: 'bx bx-id-card',
    category: 'availability',
    placeholder: 'Ciudadanía Europea / Permiso de trabajo'
  },
  {
    id: 'age',
    label: 'Edad / Fecha',
    icon: 'bx bx-calendar',
    category: 'availability',
    placeholder: '26 años'
  },

  // Código & Plataformas
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: 'bx bxl-linkedin-square',
    category: 'code',
    placeholder: 'linkedin.com/in/usuario'
  },
  {
    id: 'github',
    label: 'GitHub',
    icon: 'bx bxl-github',
    category: 'code',
    placeholder: 'github.com/usuario'
  },
  {
    id: 'gitlab',
    label: 'GitLab',
    icon: 'bx bxl-gitlab',
    category: 'code',
    placeholder: 'gitlab.com/usuario'
  },
  {
    id: 'leetcode',
    label: 'LeetCode',
    icon: 'bx bx-code-alt',
    category: 'code',
    placeholder: 'leetcode.com/usuario'
  },
  {
    id: 'stackoverflow',
    label: 'Stack Overflow',
    icon: 'bx bxl-stack-overflow',
    category: 'code',
    placeholder: 'stackoverflow.com/users/...'
  },

  // Web & Portfolio
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: 'bx bx-briefcase',
    category: 'web',
    placeholder: 'mi-portfolio.dev'
  },
  {
    id: 'website',
    label: 'Sitio Web',
    icon: 'bx bx-globe',
    category: 'web',
    placeholder: 'misitio.com'
  },
  {
    id: 'blog',
    label: 'Blog / Artículos',
    icon: 'bx bxl-medium',
    category: 'web',
    placeholder: 'medium.com/@usuario'
  },
  {
    id: 'figma',
    label: 'Figma',
    icon: 'bx bxl-figma',
    category: 'web',
    placeholder: 'figma.com/@usuario'
  },
  {
    id: 'dribbble',
    label: 'Dribbble / Behance',
    icon: 'bx bxl-dribbble',
    category: 'web',
    placeholder: 'dribbble.com/usuario'
  }
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
    icon: 'bx bx-link',
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
