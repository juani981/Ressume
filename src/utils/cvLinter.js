/**
 * cvLinter.js
 * 
 * Modular CV Content & Layout Quality Analysis Engine (Fase 2 Calidad).
 * Audits CV content against ATS standards, recruiter heuristics, and empirical requirements:
 * 
 * - RF-27 (CA-04): Future dates without "En curso" / "Esperada"
 * - RF-28 (CA-06): Inconsistent hyperlink formats across projects/items
 * - RF-29: Canonical technology names (PL/SQL, PostgreSQL, GitHub Actions, TypeScript)
 * - RF-30: Orphan skills listed in Skills but unmentioned in Experience or Projects
 * - RF-32: Bullets lacking strong action verbs or quantitative metrics (Google XYZ)
 * - RF-02 & RF-05 (CA-05): Internal ID as section title or duplicate contact sections
 * 
 * Strict Invariant: All suggestion cards adhere to Obsidian Callout design (AGENTS.md Rule 1).
 */

import { stripHtml } from './richTextEngine.js';

/**
 * Canonical Technology Dictionary (RF-29).
 * Maps common variations/casings to their standardized industry names.
 */
export const CANONICAL_TECH_DICTIONARY = {
  'pl/sql': 'PL/SQL',
  'plsql': 'PL/SQL',
  'pl-sql': 'PL/SQL',
  'postgresql': 'PostgreSQL',
  'postgres': 'PostgreSQL',
  'postgre': 'PostgreSQL',
  'github actions': 'GitHub Actions',
  'github-actions': 'GitHub Actions',
  'typescript': 'TypeScript',
  'javascript': 'JavaScript',
  'docker': 'Docker',
  'react': 'React',
  'reactjs': 'React',
  'react.js': 'React',
  'node.js': 'Node.js',
  'nodejs': 'Node.js',
  'kubernetes': 'Kubernetes',
  'k8s': 'Kubernetes',
  'mongodb': 'MongoDB',
  'graphql': 'GraphQL',
  'redis': 'Redis',
  'ci/cd': 'CI/CD',
  'cicd': 'CI/CD',
  'next.js': 'Next.js',
  'nextjs': 'Next.js',
  'aws': 'AWS',
  'azure': 'Azure',
  'gcp': 'GCP',
  'linux': 'Linux',
  'html5': 'HTML5',
  'css3': 'CSS3',
  'sass': 'Sass',
  'tailwind': 'Tailwind CSS',
  'tailwindcss': 'Tailwind CSS'
};

/**
 * Common Strong Action Verbs for CV bullets (Spanish & English)
 */
const ACTION_VERB_REGEX = /^(lideró|diseñó|desarrolló|implementó|optimizó|automatizó|construyó|arquitecturó|creó|coordinó|dirigió|redujo|incrementó|mejoró|resolvió|estableció|administró|migró|desplegó|integró|supervisó|capacitó|led|designed|developed|implemented|optimized|automated|built|architected|created|coordinated|directed|reduced|increased|improved|resolved|established|administered|migrated|deployed|integrated|spearheaded|engineered|overhauled)\b/i;

/**
 * Google XYZ Formula metric detection (numbers, percentages, multipliers, currencies)
 */
const METRIC_REGEX = /(\b\d+(\.\d+)?%|\b\d+x\b|\$[\d,.]+|\b\d+\s*(usuarios|users|clientes|clients|ms|segundos|seconds|horas|hours|días|days|puntos|req\/s|tps)\b)/i;

/**
 * Spanish & English Month dictionary for future date extraction
 */
const MONTH_MAP = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
  jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
  jan: 0, apr: 3, aug: 7, dec: 11
};

/**
 * Parses date string and checks if it falls in the future relative to the current date.
 */
export const checkIsFutureDate = (dateStr, referenceDate = new Date()) => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const clean = dateStr.trim().toLowerCase();

  // Exclude explicit "in progress" or "present" markers
  if (
    clean.includes('en curso') ||
    clean.includes('actualidad') ||
    clean.includes('present') ||
    clean.includes('presente') ||
    clean.includes('current') ||
    clean.includes('esperada') ||
    clean.includes('estimada') ||
    clean.includes('expected') ||
    clean.includes('in progress')
  ) {
    return false;
  }

  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();

  // 1. Check Year (e.g. 2027 or 2026)
  const yearMatch = clean.match(/\b(20\d\d)\b/);
  if (!yearMatch) return false;

  const targetYear = parseInt(yearMatch[1], 10);
  if (targetYear > currentYear) return true;

  // 2. If same year, check month if present
  if (targetYear === currentYear) {
    for (const [monthName, monthIndex] of Object.entries(MONTH_MAP)) {
      const monthRegex = new RegExp(`\\b${monthName}\\b`, 'i');
      if (monthRegex.test(clean)) {
        if (monthIndex > currentMonth) {
          return true;
        }
        break;
      }
    }

    // Numerical month (MM/YYYY or YYYY-MM)
    const numMonthMatch = clean.match(/\b(0?[1-9]|1[0-2])\s*[/-]\s*(20\d\d)\b/) || clean.match(/\b(20\d\d)\s*[/-]\s*(0?[1-9]|1[0-2])\b/);
    if (numMonthMatch) {
      const m = parseInt(numMonthMatch[1].length === 4 ? numMonthMatch[2] : numMonthMatch[1], 10) - 1;
      if (m > currentMonth) return true;
    }
  }

  return false;
};

/**
 * Runs complete quality audit over cvData and returns list of actionable Obsidian Callouts.
 * 
 * @param {object} cvData 
 * @param {object} [options={}]
 * @returns {Array<object>} List of lint findings
 */
export const lintCVContent = (cvData, options = {}) => {
  if (!cvData) return [];
  const findings = [];
  const sections = Array.isArray(cvData.sections) ? cvData.sections : [];

  // =========================================================================
  // Rule 1: RF-02 & RF-05 (CA-05) - Section Titles with Internal IDs & Duplicates
  // =========================================================================
  let contactSectionCount = 0;
  sections.forEach((sec, idx) => {
    if (sec.type === 'contact' || sec.id === 'contact') {
      contactSectionCount++;
    }
    const isInternalId = /^sec_[a-zA-Z0-9_-]+$/i.test(sec.title) || /^[0-9a-f-]{36}$/i.test(sec.title) || sec.title === sec.id;
    if (isInternalId) {
      findings.push({
        id: `lint_sec_internal_id_${sec.id}`,
        ruleId: 'RF-02',
        severity: 'danger', // 🛑 Obsidian Callout
        title: 'Título de sección con ID interno',
        icon: '🛑',
        message: `La sección "${sec.id}" tiene un ID interno ("${sec.title}") como título visible. Debe utilizarse un título descriptivo y editable.`,
        sectionId: sec.id,
        autoFixable: true
      });
    }
  });

  if (contactSectionCount > 1) {
    findings.push({
      id: 'lint_duplicate_contact_sections',
      ruleId: 'RF-05',
      severity: 'danger', // 🛑 Obsidian Callout
      title: 'Sección de contacto duplicada',
      icon: '🛑',
      message: 'Se detectaron múltiples secciones de contacto. Los datos de contacto deben residir en un único bloque unificado.',
      autoFixable: true
    });
  }

  // =========================================================================
  // Rule 2: RF-27 (CA-04) - Future Dates without "En curso" / "Esperada"
  // =========================================================================
  sections.forEach((sec) => {
    const items = Array.isArray(sec.items) ? sec.items : [];
    items.forEach((item) => {
      const dateField = item.date || item.year || item.period;
      if (dateField && checkIsFutureDate(dateField)) {
        findings.push({
          id: `lint_future_date_${item.id || sec.id}`,
          ruleId: 'RF-27',
          severity: 'warning', // ⚠️ Obsidian Callout
          title: 'Fecha futura sin aviso de "En curso"',
          icon: '⚠️',
          message: `El elemento "${item.title || item.name || 'Sin título'}" en "${sec.title || sec.id}" tiene la fecha "${dateField}" en el futuro. Se recomienda marcarla como "(En curso)" o "(Esperada)".`,
          sectionId: sec.id,
          itemId: item.id,
          dateValue: dateField,
          suggestedFix: `${dateField} (En curso)`
        });
      }
    });
  });

  // =========================================================================
  // Rule 3: RF-28 (CA-06) - Inconsistent URL formats across projects/items
  // =========================================================================
  const collectedUrls = [];
  sections.forEach((sec) => {
    const items = Array.isArray(sec.items) ? sec.items : [];
    items.forEach((item) => {
      if (item.link) {
        collectedUrls.push({
          sectionId: sec.id,
          itemId: item.id,
          itemTitle: item.title || item.name || 'Proyecto',
          link: item.link,
          linkText: item.linkText
        });
      }
    });
  });

  if (collectedUrls.length > 1) {
    const hasRawDomains = collectedUrls.some(u => !u.link.startsWith('http://') && !u.link.startsWith('https://'));
    const hasHttps = collectedUrls.some(u => u.link.startsWith('https://'));
    if (hasRawDomains && hasHttps) {
      findings.push({
        id: 'lint_inconsistent_urls',
        ruleId: 'RF-28',
        severity: 'warning', // ⚠️ Obsidian Callout
        title: 'Formatos de enlace inconsistentes',
        icon: '⚠️',
        message: 'Se detectó una mezcla de enlaces con protocolo completo ("https://...") y enlaces directos ("github.com/..."). Se recomienda estandarizar todos los enlaces con HTTPS.',
        affectedCount: collectedUrls.length,
        autoFixable: true
      });
    }
  }

  // =========================================================================
  // Rule 4: RF-29 - Canonical Technology Names
  // =========================================================================
  const allTextChunks = [];
  sections.forEach((sec) => {
    (sec.items || []).forEach((item) => {
      if (item.title) allTextChunks.push({ text: item.title, sec, item });
      if (item.description) allTextChunks.push({ text: item.description, sec, item });
      if (item.skills) allTextChunks.push({ text: item.skills, sec, item });
      (item.bullets || []).forEach(b => allTextChunks.push({ text: typeof b === 'string' ? b : b?.text, sec, item }));
    });
  });

  const seenVariants = new Set();
  allTextChunks.forEach(({ text, sec, item }) => {
    if (!text) return;
    const clean = stripHtml(text);
    for (const [variant, canonical] of Object.entries(CANONICAL_TECH_DICTIONARY)) {
      // Look for exact word boundaries where variant is used with non-canonical casing/spelling
      const regex = new RegExp(`\\b${variant.replace('/', '\\/')}\\b`, 'gi');
      let match;
      while ((match = regex.exec(clean)) !== null) {
        const foundWord = match[0];
        if (foundWord !== canonical && !seenVariants.has(foundWord.toLowerCase())) {
          seenVariants.add(foundWord.toLowerCase());
          findings.push({
            id: `lint_tech_casing_${foundWord.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            ruleId: 'RF-29',
            severity: 'info', // ℹ️ Obsidian Callout
            title: 'Estandarización de nombre tecnológico',
            icon: 'ℹ️',
            message: `Se encontró la variante "${foundWord}". El estándar de la industria es escribirlo como "${canonical}".`,
            found: foundWord,
            canonical,
            autoFixable: true
          });
        }
      }
    }
  });

  // =========================================================================
  // Rule 5: RF-30 - Orphan Skills (in Skills section but never in Experience/Projects)
  // =========================================================================
  const skillsSection = sections.find(s => s.type === 'skills' || s.id === 'skills');
  const experienceSections = sections.filter(s => s.type === 'experience' || s.type === 'projects');

  if (skillsSection && experienceSections.length > 0) {
    const experienceText = experienceSections
      .flatMap(s => (s.items || []))
      .flatMap(it => [it.title, it.description, ...(it.bullets || [])])
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    (skillsSection.items || []).forEach((skillItem) => {
      const skillText = skillItem.description || skillItem.title || '';
      // Parse individual skills separated by commas, slashes, or bullets
      const individualSkills = skillText.split(/[,/•|]/).map(s => s.trim()).filter(s => s.length > 2);

      individualSkills.forEach((skill) => {
        const skillLower = skill.toLowerCase();
        // Avoid flagging generic words
        if (['otros', 'herramientas', 'tools', 'lenguajes', 'frameworks'].includes(skillLower)) return;

        if (!experienceText.includes(skillLower)) {
          findings.push({
            id: `lint_orphan_skill_${skillLower.replace(/[^a-z0-9]/g, '_')}`,
            ruleId: 'RF-30',
            severity: 'info', // ℹ️ Obsidian Callout
            title: 'Habilidad sin respaldo en experiencia',
            icon: 'ℹ️',
            message: `La tecnología "${skill}" figura en Habilidades, pero no se menciona en ningún logro de Experiencia ni Proyectos. Respaldarla con un ejemplo práctico mejora el score ATS.`,
            skill
          });
        }
      });
    });
  }

  // =========================================================================
  // Rule 6: RF-32 - Action Verbs & Google XYZ Formula in Bullets
  // =========================================================================
  experienceSections.forEach((sec) => {
    (sec.items || []).forEach((item) => {
      (item.bullets || []).forEach((b, bIdx) => {
        const bulletText = stripHtml(typeof b === 'string' ? b : (b?.text || '')).trim();
        if (!bulletText || bulletText.length < 10) return;

        const hasActionVerb = ACTION_VERB_REGEX.test(bulletText);
        const hasMetric = METRIC_REGEX.test(bulletText);

        if (!hasActionVerb) {
          findings.push({
            id: `lint_bullet_weak_verb_${item.id}_${bIdx}`,
            ruleId: 'RF-32',
            severity: 'info', // ℹ️ Obsidian Callout
            title: 'Viñeta sin verbo de acción inicial',
            icon: 'ℹ️',
            message: `La viñeta "${bulletText.slice(0, 45)}..." comenzaría con mayor impacto usando un verbo de acción fuerte en pretérito (ej: "Lideró", "Optimizó", "Implementó").`,
            itemId: item.id,
            bulletIndex: bIdx
          });
        }

        if (!hasMetric && bulletText.length > 30) {
          findings.push({
            id: `lint_bullet_missing_metric_${item.id}_${bIdx}`,
            ruleId: 'RF-32',
            severity: 'info', // ℹ️ Obsidian Callout
            title: 'Oportunidad de cuantificación (Fórmula Google XYZ)',
            icon: 'ℹ️',
            message: `La viñeta "${bulletText.slice(0, 45)}..." describe la tarea pero carece de un indicador cuantificable (ej: % de mejora, tiempo reducido, usuarios impactados).`,
            itemId: item.id,
            bulletIndex: bIdx
          });
        }
      });
    });
  });

  return findings;
};

export default {
  CANONICAL_TECH_DICTIONARY,
  checkIsFutureDate,
  lintCVContent
};
