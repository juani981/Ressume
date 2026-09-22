/**
 * cvDataToTypst.js
 * Serializa el estado cvData de Ressume a markup Typst (.typ).
 *
 * Produce un documento Typst compilable con layout, tipografía y paginación
 * deterministas, eliminando toda dependencia del motor CSS del navegador.
 *
 * Secciones soportadas:
 *  - profile_header   → encabezado centrado con nombre y cargo
 *  - contact          → lista de datos de contacto
 *  - experience       → entradas con fecha, empresa, descripción y bullets
 *  - education        → entradas con título, institución y fecha
 *  - skills           → lista separada por puntos intermedios
 *  - simple_list      → lista simple de ítems
 *  - projects         → entradas con link y bullets
 *  - certificates     → entradas con emisor y fecha
 *  - languages        → pares idioma / nivel
 *  - about            → bloque de descripción
 *  - spacer           → espacio vertical configurable
 *  - (genérico)       → título + ítems con campos disponibles
 */

// ─── Utilidades ──────────────────────────────────────────────────────────────

/**
 * Escapa caracteres especiales del lenguaje Typst.
 * Los delimitadores de Typst son: # $ @ < > \ *  _ ` [ ] { }
 */
const esc = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/#/g, '\\#')
    .replace(/\$/g, '\\$')
    .replace(/@/g, '\\@')
    .replace(/</g, '\\<')
    .replace(/>/g, '\\>')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}');
};

/** Strips HTML tags y decodifica entidades comunes */
const clean = (html) => {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
};

/** Shorthand: clean + escape */
const ce = (str) => esc(clean(str));

// ─── Mapeo de tipografías ─────────────────────────────────────────────────────

const FONT_MAP = {
  'Poppins':        'Poppins',
  'Inter':          'Inter',
  'Roboto':         'Roboto',
  'Merriweather':   'Merriweather',
  'JetBrains Mono': 'JetBrains Mono',
};

// ─── Configuración de página y tipografía ────────────────────────────────────

const generatePageSetup = (layout = {}) => {
  const fontName     = FONT_MAP[layout.fontFamily] || 'Poppins';
  const fontScale    = layout.fontScale    ?? 1.0;
  const titleScale   = layout.titleScale   ?? 1.0;
  const bodyScale    = layout.bodyScale    ?? 1.0;
  const lineHeight   = layout.lineHeight   ?? 1.45;
  const pagePadding  = layout.pagePadding  ?? 24;
  const sectionGap   = layout.sectionGap   ?? 20;

  // Conversiones px → mm (96 DPI: 1mm ≈ 3.7795px)
  const padMm   = (pagePadding / 3.7795).toFixed(1);
  const secGapMm = (sectionGap / 3.7795).toFixed(1);

  // Tamaño base tipográfico en pt (9.5pt base × escalas)
  const basePt  = (9.5  * fontScale * bodyScale).toFixed(2);
  const h2Pt    = (12.0 * fontScale * titleScale).toFixed(2);
  const h3Pt    = (10.0 * fontScale * titleScale).toFixed(2);
  const h1Pt    = (18.0 * fontScale * titleScale).toFixed(2);
  const leadingEm = Math.max(0, lineHeight - 1).toFixed(3);

  return `\
#set page(
  paper: "a4",
  margin: (top: ${padMm}mm, bottom: ${padMm}mm, left: ${padMm}mm, right: ${padMm}mm),
)
#set text(font: "${fontName}", size: ${basePt}pt, fill: rgb("#334155"))
#set par(leading: ${leadingEm}em, justify: false)

// Estilos de encabezados
#show heading.where(level: 1): it => block(above: 0pt, below: 2mm)[
  #text(size: ${h1Pt}pt, weight: "bold", fill: rgb("#0f172a"))[#it.body]
]
#show heading.where(level: 2): it => block(above: ${secGapMm}mm, below: 1.5mm)[
  #text(size: ${h2Pt}pt, weight: "semibold", fill: rgb("#0f172a"))[#it.body]
  #line(length: 100%, stroke: 0.5pt + rgb("#e2e8f0"))
]
#show heading.where(level: 3): it => block(above: 1mm, below: 0.5mm)[
  #text(size: ${h3Pt}pt, weight: "medium", fill: rgb("#0f172a"))[#it.body]
]
`;
};

// ─── Generadores de secciones ─────────────────────────────────────────────────

const generateHeader = (section) => {
  const item     = section?.items?.[0] || {};
  const name     = ce(item.name     || item.title    || '');
  const subtitle = ce(item.subtitle || item.position || '');
  if (!name) return '';

  return `\
#align(center)[
  #text(size: 22pt, weight: "bold", fill: rgb("#0f172a"))[${name}] \\
  #v(1mm)
  #text(size: 11pt, fill: rgb("#64748b"))[${subtitle}]
]
#v(3mm)
`;
};

const generateContact = (section) => {
  if (!section) return '';
  const contacts = section?.items?.[0]?.contacts || [];
  if (!contacts.length) return '';

  const title = ce(section.title || '');
  const lines = contacts
    .map(c => `- ${ce(c.value || '')}`)
    .filter(l => l.length > 2)
    .join('\n');

  return `\
${title ? `== ${title}` : ''}
${lines}
`;
};

const generateExperience = (section, layout = {}) => {
  if (!section?.items?.length) return '';
  const title   = ce(section.title || '');
  const itemGap = ((layout.itemGap ?? 8) / 3.7795).toFixed(1);

  const items = section.items.map(item => {
    const jobTitle = ce(item.title    || '');
    const company  = ce(item.subtitle || '');
    const date     = ce(item.date     || '');
    const desc     = ce(item.description || '');
    const bullets  = (item.bullets || [])
      .map(b => `  - ${ce(typeof b === 'string' ? b : b?.text || '')}`)
      .filter(b => b.length > 4)
      .join('\n');

    return `\
#block(breakable: false)[
  #grid(columns: (1fr, auto), column-gutter: 3mm)[
    #text(weight: "semibold")[${jobTitle}]
  ][
    #text(size: 0.85em, fill: rgb("#64748b"))[${date}]
  ]
  ${company ? `#text(fill: rgb("#64748b"), size: 0.9em)[${company}]` : ''}
  ${desc ? `\n  #v(0.5mm)\n  ${desc}` : ''}
  ${bullets ? `\n${bullets}` : ''}
]
#v(${itemGap}mm)`;
  }).join('\n');

  return `== ${title}\n${items}\n`;
};

const generateEducation = (section, layout = {}) => {
  if (!section?.items?.length) return '';
  const title   = ce(section.title || '');
  const itemGap = ((layout.itemGap ?? 8) / 3.7795).toFixed(1);

  const items = section.items.map(item => {
    const degree  = ce(item.title    || '');
    const school  = ce(item.subtitle || '');
    const date    = ce(item.date     || '');

    return `\
#block(breakable: false)[
  #grid(columns: (1fr, auto), column-gutter: 3mm)[
    #text(weight: "semibold")[${degree}]
  ][
    #text(size: 0.85em, fill: rgb("#64748b"))[${date}]
  ]
  ${school ? `#text(fill: rgb("#64748b"), size: 0.9em)[${school}]` : ''}
]
#v(${itemGap}mm)`;
  }).join('\n');

  return `== ${title}\n${items}\n`;
};

const generateSkills = (section) => {
  if (!section?.items?.length) return '';
  const title = ce(section.title || '');
  const skills = section.items
    .map(i => ce(i.name || i.title || ''))
    .filter(Boolean)
    .join(' · ');

  return `== ${title}\n${skills}\n`;
};

const generateSimpleList = (section, layout = {}) => {
  if (!section?.items?.length) return '';
  const title   = ce(section.title || '');
  const itemGap = ((layout.itemGap ?? 8) / 3.7795).toFixed(1);

  const items = section.items
    .map(i => `- ${ce(i.name || i.title || '')}`)
    .filter(l => l.length > 2)
    .join('\n');

  return `== ${title}\n${items}\n#v(${itemGap}mm)\n`;
};

const generateProjects = (section, layout = {}) => {
  if (!section?.items?.length) return '';
  const title   = ce(section.title || '');
  const itemGap = ((layout.itemGap ?? 8) / 3.7795).toFixed(1);

  const items = section.items.map(item => {
    const projTitle = ce(item.title || '');
    const date      = ce(item.date || '');
    const link      = ce(item.link || '');
    const linkText  = ce(item.linkText || item.link || '');
    const desc      = ce(item.description || '');
    const bullets   = (item.bullets || [])
      .map(b => `  - ${ce(typeof b === 'string' ? b : b?.text || '')}`)
      .filter(b => b.length > 4)
      .join('\n');

    return `\
#block(breakable: false)[
  #grid(columns: (1fr, auto), column-gutter: 3mm)[
    #text(weight: "semibold")[${projTitle}]
  ][
    #text(size: 0.85em, fill: rgb("#64748b"))[${date}]
  ]
  ${link ? `#link("${link}")[#text(size: 0.85em, fill: rgb("#3b82f6"))[${linkText}]]` : ''}
  ${desc ? `\n  ${desc}` : ''}
  ${bullets ? `\n${bullets}` : ''}
]
#v(${itemGap}mm)`;
  }).join('\n');

  return `== ${title}\n${items}\n`;
};

const generateCertificates = (section, layout = {}) => {
  if (!section?.items?.length) return '';
  const title   = ce(section.title || '');
  const itemGap = ((layout.itemGap ?? 8) / 3.7795).toFixed(1);

  const items = section.items.map(item => {
    const certTitle = ce(item.title    || '');
    const issuer    = ce(item.subtitle || '');
    const date      = ce(item.date     || '');

    return `\
#block(breakable: false)[
  #grid(columns: (1fr, auto), column-gutter: 3mm)[
    #text(weight: "semibold")[${certTitle}]
  ][
    #text(size: 0.85em, fill: rgb("#64748b"))[${date}]
  ]
  ${issuer ? `#text(size: 0.9em, fill: rgb("#64748b"))[${issuer}]` : ''}
]
#v(${itemGap}mm)`;
  }).join('\n');

  return `== ${title}\n${items}\n`;
};

const generateLanguages = (section) => {
  if (!section?.items?.length) return '';
  const title = ce(section.title || '');
  const langs = section.items
    .map(i => {
      const name  = ce(i.name  || i.title    || '');
      const level = ce(i.level || i.subtitle || '');
      return level ? `- ${name}: ${level}` : `- ${name}`;
    })
    .filter(l => l.length > 2)
    .join('\n');

  return `== ${title}\n${langs}\n`;
};

const generateAbout = (section) => {
  const item = section?.items?.[0];
  if (!item) return '';
  const title = ce(section.title || '');
  const desc  = ce(item.description || item.content || '');
  if (!desc) return '';

  return `== ${title}\n${desc}\n`;
};

const generateSpacer = (section) => {
  const height = section?.height ?? 16;
  const heightMm = (height / 3.7795).toFixed(1);
  return `#v(${heightMm}mm)\n`;
};

/**
 * Generador genérico para tipos de sección no especializados.
 */
const generateGeneric = (section, layout = {}) => {
  if (!section?.items?.length) return '';
  const title   = ce(section.title || '');
  const itemGap = ((layout.itemGap ?? 8) / 3.7795).toFixed(1);

  const items = section.items.map(item => {
    const itemTitle = ce(item.title    || item.name || '');
    const sub       = ce(item.subtitle || '');
    const date      = ce(item.date     || '');
    const desc      = ce(item.description || '');

    return `\
#block(breakable: false)[
  ${itemTitle ? `#text(weight: "semibold")[${itemTitle}]` : ''}
  ${(sub || date) ? `#text(size: 0.85em, fill: rgb("#64748b"))[${[sub, date].filter(Boolean).join(' | ')}]` : ''}
  ${desc ? `\n  ${desc}` : ''}
]
#v(${itemGap}mm)`;
  }).join('\n');

  return `${title ? `== ${title}\n` : ''}${items}\n`;
};

// ─── Dispatcher de sección ───────────────────────────────────────────────────

const generateSection = (section, layout) => {
  if (!section) return '';
  const type = section.type || 'generic';

  switch (type) {
    case 'profile_header': return generateHeader(section);
    case 'contact':        return generateContact(section);
    case 'experience':
    case 'list':           return generateExperience(section, layout);
    case 'education':      return generateEducation(section, layout);
    case 'skills':         return generateSkills(section);
    case 'simple_list':    return generateSimpleList(section, layout);
    case 'projects':       return generateProjects(section, layout);
    case 'certificates':   return generateCertificates(section, layout);
    case 'languages':      return generateLanguages(section);
    case 'about':          return generateAbout(section);
    case 'spacer':         return generateSpacer(section);
    default:               return generateGeneric(section, layout);
  }
};

// ─── Punto de entrada principal ───────────────────────────────────────────────

/**
 * Convierte el estado completo del CV en markup Typst compilable.
 *
 * @param {Object} cvData - Estado completo del CV (mismo schema que usa React)
 * @returns {string} Documento Typst (.typ) como string
 */
export const cvDataToTypst = (cvData) => {
  const layout   = cvData?.layout  || {};
  const sections = cvData?.sections || [];

  const is2Col  = layout.type === '2-column' && !layout.isAtsMode;
  const leftBg  = layout.leftBg  || '#f3f4f6';
  const rightBg = layout.rightBg || '#ffffff';

  const pageSetup = generatePageSetup(layout);

  // ── MODO 1 COLUMNA (ATS) ─────────────────────────────────────────────────
  if (!is2Col) {
    const content = sections
      .map(sec => generateSection(sec, layout))
      .filter(Boolean)
      .join('\n');

    return `${pageSetup}\n${content}`;
  }

  // ── MODO 2 COLUMNAS ──────────────────────────────────────────────────────
  const leftColPct  = layout.leftColumnWidth || 33.33;
  const leftFr      = (leftColPct / 100).toFixed(4);
  const rightFr     = (1 - leftColPct / 100).toFixed(4);
  const colGapMm    = 6;

  const leftSections  = sections.filter(s => (s.column || 'left') === 'left');
  const rightSections = sections.filter(s => (s.column || 'right') === 'right');

  const sidebarContent = leftSections
    .map(sec => generateSection(sec, layout))
    .filter(Boolean)
    .join('\n');

  const mainContent = rightSections
    .map(sec => generateSection(sec, layout))
    .filter(Boolean)
    .join('\n');

  // Fondo asimétrico via rect absoluto en background de página
  const bgRect = `\
#set page(background: place(
  top + left,
  rect(
    width: ${leftColPct.toFixed(1)}%,
    height: 100%,
    fill: rgb("${leftBg}"),
  )
))
`;

  return `\
${pageSetup}
${bgRect}

#grid(
  columns: (${leftFr}fr, ${rightFr}fr),
  column-gutter: ${colGapMm}mm,
  [
${sidebarContent}
  ],
  [
${mainContent}
  ],
)
`;
};
