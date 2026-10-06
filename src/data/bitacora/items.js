/**
 * @file items.js
 * @description Curated knowledge entries for the Bitácora / Community Hub.
 * Extensible schema ready for Supabase sync and user submissions:
 * - id: string
 * - category: string (matching categories.js)
 * - title: string
 * - summary: string
 * - readTimeMinutes?: number
 * - callout?: { type: 'danger' | 'warning' | 'info', title: string, text: string }
 * - content?: string (rich markdown/guide text for deep reading)
 * - links?: Array<{ label: string, url: string, type?: 'tool' | 'doc' | 'repo' }>
 * - author: { name: string, role: string, isOfficial: boolean, avatarUrl?: string }
 * - upvotes: number
 * - tags: string[]
 * - createdAt: string
 */

export const INITIAL_BITACORA_ITEMS = [
  {
    id: 'tip-google-xyz',
    category: 'bullets',
    title: 'Fórmula Google X-Y-Z para redactar logros irresistibles',
    summary: 'La estructura de redacción de viñetas más respetada en la industria tecnológica para demostrar impacto real.',
    readTimeMinutes: 2,
    callout: {
      type: 'info',
      title: 'Estructura Canónica',
      text: 'Logré [X], medido por [Y], haciendo [Z]. Por ejemplo: "Reduje la latencia de respuesta de la API en un 38% (Y) mediante la implementación de Redis caching distribuido (Z), acelerando la carga para 500k usuarios diarios (X)".'
    },
    content: `
### ¿Por qué la mayoría de los CVs son ignorados?
El 90% de los candidatos escribe listas de **tareas cotidianas** en lugar de **resultados medibles**:
- ❌ *"Encargado de desarrollar endpoints en Node.js y mantener la base de datos."*
- ✅ *"Diseñé y desplegué 14 microservicios en Node.js, reduciendo el tiempo de onboarding de clientes en un 45% y soportando picos de 12.000 req/s."*

### Los 3 componentes de la fórmula:
1. **Acción/Resultado [X]:** Qué lograste cambiar en el negocio o producto.
2. **Métrica [Y]:** Un número, porcentaje o ahorro cuantificable.
3. **Mecanismo [Z]:** La tecnología, patrón o arquitectura que aplicaste.
    `,
    tags: ['Métricas', 'Bullets', 'Impacto', 'Google'],
    author: {
      name: 'Juani Carrizo',
      role: 'Staff Architect & Autor',
      isOfficial: true,
    },
    upvotes: 84,
    createdAt: '2026-10-01',
  },
  {
    id: 'guide-ats-myths-vs-reality',
    category: 'ats',
    title: 'Mitos vs. Realidad de los sistemas ATS en 2026',
    summary: 'Qué parsean realmente Workday, Taleo y Greenhouse, y por qué los diseños a dos columnas no siempre fallan si la jerarquía es semántica.',
    readTimeMinutes: 4,
    callout: {
      type: 'warning',
      title: 'Alerta de Formato',
      text: 'Nunca incrustes texto crítico dentro de imágenes, tablas complejas anidadas o cuadros de texto flotantes no estándar. El parser extrae el flujo en texto plano secuencial.'
    },
    content: `
### La mentira de "el robot que te rechaza automáticamente"
Los ATS no son inteligencias artificiales maquiavélicas que descartan CVs por diversión. Son **sistemas de gestión de base de datos** (Applicant Tracking Systems) que:
1. Extraen el texto del PDF/Word en campos estructurados (*Name*, *Experience*, *Skills*).
2. Permiten a los reclutadores humanos buscar por palabras clave (ej: \`React AND TypeScript AND AWS\`).
3. Si el texto está codificado como curvas vectoriales o dentro de un Canvas/SVG, el ATS ve una hoja en blanco.

### Reglas para un PDF 100% parseable:
- Usar tipografías estándar o incrustadas correctamente.
- Encabezados claros de sección (\`Experiencia Laboral\`, \`Educación\`, etc.).
- Fechas consistentes (ej: \`MM/AAAA - MM/AAAA\` o \`2022 - 2024\`).
- Exportación vectorial directa con texto seleccionable.
    `,
    links: [
      {
        label: 'Verificador de Texto Seleccionable',
        url: 'https://pdfcheck.org',
        type: 'tool',
      },
    ],
    tags: ['ATS', 'Greenhouse', 'Workday', 'Parsers'],
    author: {
      name: 'Juani Carrizo',
      role: 'Staff Architect & Autor',
      isOfficial: true,
    },
    upvotes: 67,
    createdAt: '2026-10-02',
  },
  {
    id: 'resource-tech-interview-handbook',
    category: 'interviews',
    title: 'Guía de preguntas trampa en entrevistas de comportamiento (STAR)',
    summary: 'Cómo responder "¿Cuál es tu mayor debilidad?" y "¿Contame una vez que fallaste?" sin sonar cliché ni arruinar tu candidatura.',
    readTimeMinutes: 3,
    callout: {
      type: 'danger',
      title: 'Peligro Crítico',
      text: 'Nunca respondas "Soy demasiado perfeccionista" o "Trabajo demasiado". Los entrevistadores experimentados consideran esto una falta de autoconciencia o un intento barato de evasión.'
    },
    content: `
### El Método STAR aplicado a errores reales:
Cuando te pregunten sobre un fracaso o debilidad, están evaluando tu **capacidad de autorreflexión y aprendizaje**.

1. **Situación (S):** Contexto breve de qué problema real existía.
2. **Tarea (T):** Tu responsabilidad en ese momento.
3. **Acción (A):** El error honesto que cometiste y qué hiciste inmediatamente para mitigar el daño.
4. **Resultado (R) + Aprendizaje:** La regla, proceso o automatización que implementaste para asegurar que ese error NUNCA más se repita.
    `,
    links: [
      {
        label: 'Tech Interview Handbook (Yangshun Tay)',
        url: 'https://www.techinterviewhandbook.org/behavioral-interview/',
        type: 'repo',
      },
    ],
    tags: ['STAR', 'Entrevistas', 'Behavioral', 'Psicotécnico'],
    author: {
      name: 'Juani Carrizo',
      role: 'Staff Architect & Autor',
      isOfficial: true,
    },
    upvotes: 52,
    createdAt: '2026-10-03',
  },
  {
    id: 'tip-linkedin-headline',
    category: 'strategy',
    title: 'Tu titular de LinkedIn: Dejá de poner "Buscando activamente"',
    summary: 'El algoritmo de LinkedIn favorece términos de búsqueda de cargos y stack técnico exacto por sobre estados de necesidad.',
    readTimeMinutes: 2,
    callout: {
      type: 'warning',
      title: 'SEO de Reclutamiento',
      text: 'Los reclutadores buscan "Senior Frontend Engineer | React, TypeScript" en su barra de búsqueda. Nadie tipea "En búsqueda de nuevas oportunidades" cuando necesita cubrir una vacante.'
    },
    tags: ['LinkedIn', 'SEO', 'Marca Personal', 'Recruiters'],
    author: {
      name: 'Comunidad Ressume',
      role: 'Colaborador Verificado',
      isOfficial: false,
    },
    upvotes: 41,
    createdAt: '2026-10-04',
  },
  {
    id: 'resource-salary-negotiation',
    category: 'strategy',
    title: 'Reglas inquebrantables de negociación salarial en Tech',
    summary: 'Cómo evitar anclarte con un número bajo en la primera llamada de screening telefónico.',
    readTimeMinutes: 3,
    callout: {
      type: 'info',
      title: 'Táctica de Respuesta',
      text: 'Cuando te pregunten "¿Cuáles son tus expectativas salariales?", respondé: "Para darte un número exacto me gustaría entender mejor las responsabilidades y el paquete total de beneficios. ¿Cuál es el rango presupuestado que tienen definido para esta posición?".'
    },
    links: [
      {
        label: 'Levels.fyi - Salarios Reales Verificados',
        url: 'https://www.levels.fyi',
        type: 'tool',
      },
    ],
    tags: ['Salario', 'Negociación', 'Screening', 'Ofertas'],
    author: {
      name: 'Juani Carrizo',
      role: 'Staff Architect & Autor',
      isOfficial: true,
    },
    upvotes: 95,
    createdAt: '2026-10-05',
  },
  {
    id: 'resource-awesome-cheat-sheets',
    category: 'resources',
    title: 'Repositorio de Cheatsheets y Roadmap de Arquitectura',
    summary: 'Colección de diagramas de diseño de sistemas, estructuras de datos y guías de patrones limpios para repasar antes de una entrevista.',
    readTimeMinutes: 1,
    links: [
      {
        label: 'System Design Primer (GitHub)',
        url: 'https://github.com/donnemartin/system-design-primer',
        type: 'repo',
      },
      {
        label: 'Roadmap.sh - Developer Roadmaps',
        url: 'https://roadmap.sh',
        type: 'doc',
      },
    ],
    tags: ['System Design', 'Roadmaps', 'Cheatsheets'],
    author: {
      name: 'Comunidad Ressume',
      role: 'Colaborador Verificado',
      isOfficial: false,
    },
    upvotes: 38,
    createdAt: '2026-10-06',
  },
];
