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
    title: 'Fórmula Google X-Y-Z para redactar logros verificables',
    summary: 'Estructura técnica de viñetas utilizada para acreditar impacto en ingeniería de software.',
    readTimeMinutes: 2,
    callout: {
      type: 'info',
      title: 'Estructura Canónica',
      text: 'Logré [X], medido por [Y], haciendo [Z]. Por ejemplo: "Reduje la latencia de respuesta de la API en un 38% (Y) mediante la implementación de almacenamiento en caché distribuido con Redis (Z), soportando un tráfico concurrente de 500k usuarios diarios (X)".'
    },
    content: `
### Análisis de descarte en revisión técnica
La mayoría de los perfiles omiten resultados concretos y se limitan a enumerar asignaciones diarias:
- ❌ *"Encargado de desarrollar endpoints en Node.js y mantener la base de datos."*
- ✅ *"Diseñé y desplegué 14 microservicios en Node.js, reduciendo el tiempo de incorporación de clientes en un 45% y tolerando picos de 12.000 req/s."*

### Los tres componentes de la fórmula:
1. **Acción/Resultado [X]:** Modificación funcional concreta introducida en el sistema o producto.
2. **Métrica [Y]:** Indicador numérico cuantificable de rendimiento, costo o latencia.
3. **Mecanismo [Z]:** Patrón arquitectónico, tecnología o solución implementada.
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
    title: 'Funcionamiento real de los sistemas ATS en procesos técnicos',
    summary: 'Mecanismo de indexación de plataformas como Greenhouse, Workday y Taleo frente a estructuras de una o dos columnas.',
    readTimeMinutes: 4,
    callout: {
      type: 'warning',
      title: 'Restricción de Formato',
      text: 'No incruste información dentro de imágenes, tablas complejas o capas flotantes sin flujo semántico. El analizador extrae texto plano secuencial.'
    },
    content: `
### Funcionamiento técnico de los analizadores
Los ATS son sistemas de gestión de bases de datos relacionales configurados para:
1. Extraer el contenido del documento hacia campos estructurados (*Nombre*, *Experiencia*, *Habilidades*).
2. Facilitar búsquedas booleanas a los equipos técnicos (por ejemplo: \`React AND TypeScript AND AWS\`).
3. Si el texto se renderiza como mapa de bits o trazos vectoriales cerrados sin codificación de caracteres, el sistema procesa un documento vacío.

### Criterios de compatibilidad estructural:
- Emplear fuentes con mapa tipográfico estándar incrustado.
- Encabezados unívocos de sección (\`EXPERIENCIA LABORAL\`, \`EDUCACIÓN\`, \`HABILIDADES\`).
- Fechas normalizadas (\`MM/AAAA – MM/AAAA\` o \`AAAA – AAAA\`).
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
    title: 'Estructuración de respuestas en entrevistas conductuales (Método STAR)',
    summary: 'Metodología para abordar preguntas sobre fallas técnicas y debilidades profesionales con rigor y criterio de ingeniería.',
    readTimeMinutes: 3,
    callout: {
      type: 'danger',
      title: 'Error Frecuente',
      text: 'Evite respuestas evasivas como "trabajo en exceso" o "soy perfeccionista". Los evaluadores consideran estas respuestas como falta de autocrítica técnica.'
    },
    content: `
### Método STAR aplicado a incidentes y resolución técnica:
Las preguntas sobre incidentes evalúan la capacidad de diagnóstico, mitigación y prevención sistemática:

1. **Situación (S):** Contexto técnico del problema o falla detectada.
2. **Tarea (T):** Responsabilidad directa asumida durante la contingencia.
3. **Acción (A):** Diagnóstico realizado, contención inmediata y corrección de fondo.
4. **Resultado (R) y Prevención:** Pruebas automatizadas, monitoreo o políticas implementadas para impedir la recurrencia del fallo.
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
    title: 'Titular profesional: indexación por especialidad y stack técnico',
    summary: 'Los algoritmos de búsqueda priorizan denominaciones de cargo estandarizadas y tecnologías concretas frente a estados de disponibilidad.',
    readTimeMinutes: 2,
    callout: {
      type: 'warning',
      title: 'Indexación en Búsquedas',
      text: 'Las consultas de perfiles utilizan filtros como "Senior Frontend Engineer | React, TypeScript". Las expresiones de búsqueda no incorporan frases genéricas de disponibilidad.'
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
    title: 'Criterios de negociación y rangos salariales en ingeniería',
    summary: 'Procedimiento para contextualizar expectativas de compensación durante las etapas iniciales de evaluación técnica.',
    readTimeMinutes: 3,
    callout: {
      type: 'info',
      title: 'Formulación Técnica',
      text: 'Ante la consulta sobre pretensiones salariales iniciales, una formulación adecuada es: "Para establecer un parámetro certero es necesario dimensionar el alcance técnico del rol y el esquema integral de compensación. ¿Cuál es el rango presupuestado definido para esta posición?".'
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
    title: 'Compendio de arquitectura y diseño de sistemas',
    summary: 'Colección de diagramas de sistemas distribuidos, estructuras de datos y patrones de concurrencia para preparación técnica.',
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
