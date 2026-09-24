# Comprehensive Survey Report: AI Prompts Catalog, Output Formats & Payload Assembly

**Explorer Agent**: Explorer Survey 3  
**Date**: 2026-09-12  
**Working Directory**: `/home/juani/Documentos/Ressume/.agents/explorer_survey_3`  
**Target Subsystems**:
- `src/locales/es/prompts.json`
- `src/locales/en/prompts.json`
- `src/ai-knowledge/prompts.json`
- `src/utils/aiExporter.js` (`buildAIPromptPayload`, `exportToAIMarkdown`)
- `src/utils/versionValidator.js`
- `src/components/Editor/AIExportModal.jsx`
- Vitest Test Suite (`src/tests/`)

---

## 1. Executive Summary

This investigation surveys and designs the architectural refactoring for Ressume's AI Subsystem. Specifically, it establishes:
1. **Gold Standard Harmonization across All Prompts**: Elevating all existing prompts (`job_matcher`, `star_enhancer`, `technical_interview`, `translate_english`, `layout_advisor`) to the meticulous standard set by the **Auditoría ATS (17 puntos)** prompt. This includes explicit `output_format` specifications, 0-100 quantitative scoring rubrics, evaluation matrices, Google XYZ achievement transformations, and WCAG AA color contrast audits.
2. **Native JSON Importability for Translation & Localization (`translate_english`)**: Formulating an ultra-strict output format requiring the LLM to output a valid JSON code block conforming 1:1 to the `cvData` schema of Ressume. When imported via `versionValidator.js` (`sanitizeAndValidateCVSnapshot`), this output functions immediately as a fully editable, localized version of the CV without manual re-typing.
3. **Design of 6 New High-Impact Tech Career Prompts (Bilingual ES & EN)**: Creating production-ready prompt definitions for:
   - `system_design_simulator` (Scalability, microservices, SQL vs NoSQL, concurrency, Mermaid diagrams, 0-100 rubric)
   - `live_coding_coach` (Algorithmic patterns, Big-O proofs, boundary edge cases, 45-min verbal script)
   - `behavioral_leadership_prep` (FAANG/Tier-1 situational questions, Amazon LPs, STAR response matrices)
   - `career_upskilling_roadmap` (Technical gap diagnosis against Senior/Staff benchmarks, 30/60/90-day plan, DDIA, OSS repos, papers)
   - `cold_outreach_generator` (Hyper-personalized multi-vector outreach for EMs, Tech Leads, and Recruiters on LinkedIn and email)
   - `salary_negotiation_advisor` (Compensation bands P25-P90, CV value leverage, word-for-word phone screening scripts, counter-offers)
4. **Assembly Pipeline in `buildAIPromptPayload`**: Designing the deterministic payload assembly sequence:
   `role` ➔ `task` ➔ `output_format` ➔ `user_commentary` (conditional) ➔ `job_description` (conditional) ➔ `---` separator ➔ Formatted CV Input Data (with compact native `cvData` JSON reference schema automatically injected when `translate_english` is selected).
5. **Frontmatter YAML 1:1 Mirroring in `exportToAIMarkdown`**: Capturing all structural and visual metadata (`layout_type`, `is_ats_mode`, `page_padding`, `section_gap`, `item_gap`, `font_family`, `font_scale`, scale factors, container colors, and complete contact items) in the Markdown Frontmatter.
6. **Test Suite Architecture**: Noting the baseline 727 tests across 42 suites, identifying the current 0% test coverage for `aiExporter.js` and prompts catalogs, and designing a comprehensive Vitest suite (`src/tests/ai-prompts-and-exporter.test.js`) guaranteeing schema conformity, non-empty `output_format`, bilingual parity, and validator compatibility.

---

## 2. Current Prompt Catalog Audit & File Discrepancies

### 2.1 File Locations & Roles
The repository maintains prompt definitions in three distinct files:
1. `src/locales/es/prompts.json` (Consumed by `getPrompts('es')` via `src/locales/index.js`)
2. `src/locales/en/prompts.json` (Consumed by `getPrompts('en')` via `src/locales/index.js`)
3. `src/ai-knowledge/prompts.json` (Imported by `src/ai-knowledge/index.js` as `ALL_PROMPTS` and queried by `getAIPromptById`)

### 2.2 Critical Discrepancies & Flaws Identified

| Prompt ID | `src/locales/es/prompts.json` | `src/locales/en/prompts.json` | `src/ai-knowledge/prompts.json` | Status & Missing Elements |
|---|---|---|---|---|
| `recruiter_audit` | Has `output_format`: `"Structured evaluation (17-point checklist)"` | Missing `output_format` key entirely | Has `output_format`: `"Structured evaluation (17-point checklist)"` | Format string is vague; lacks concrete markdown section templates. |
| `job_matcher` | Missing `output_format` key entirely | Missing `output_format` key entirely | Has `"output_format": ""` (empty string) | **Defect**: No output format, no quantitative scoring rubric, no structured table format. |
| `star_enhancer` | Missing `output_format` key entirely | Missing `output_format` key entirely | Has `"output_format": ""` (empty string) | **Defect**: No output format, no rubric for bullet strength, no explicit Google XYZ decomposition. |
| `technical_interview` | Missing `output_format` key entirely | Missing `output_format` key entirely | Has `"output_format": ""` (empty string) | **Defect**: Hardcodes technologies (Laravel/.NET) in prompt rather than adapting to CV, lacks evaluation rubrics for Junior vs Senior. |
| `translate_english` | Missing `output_format` key entirely | Missing `output_format` key entirely | Has `"output_format": ""` (empty string) | **Critical Violation**: Outputs raw markdown text instead of strict `cvData` JSON code block importable into Version Manager. |
| `layout_advisor` | Missing `output_format` key entirely | Missing `output_format` key entirely | Has `"output_format": ""` (empty string) | **Defect**: No output format, no WCAG AA color contrast calculation table, no quantitative layout scorecard. |
| *6 New Tech Prompts* | **Absent** (0 of 6 present) | **Absent** (0 of 6 present) | **Absent** (0 of 6 present) | **Missing**: Need full bilingual implementation (total prompts must expand from 6 to 12). |

### 2.3 Payload Assembly Defect in `src/utils/aiExporter.js`
In `aiExporter.js` (lines 397-399):
```javascript
/*Formato de salida*/
payload.push('output_format: ' + promptDef.output_format);
payload.push('');
```
Because `promptDef.output_format` is missing (`undefined`) or empty (`""`) for 5 out of 6 prompts in all files, the assembled payload currently emits:
```
output_format: undefined
```
or
```
output_format: 
```
This leaves language models without constraints on structure, leading to unstructured, unpredictable, or conversational outputs that degrade user experience and cannot be programmatically validated.

---

## 3. ATS Audit (17 Points) Architectural Benchmark

The `recruiter_audit` prompt serves as the organizational and structural **gold standard** in Ressume. A granular analysis reveals why it is uniquely effective and how its architectural principles must be propagated across all prompts:

### 3.1 Architectural Anatomy of the 17 Points
1. **First Impression (5-10s Scan)**: Simulates the initial human screening window. Identifies immediate value proposition, core strengths, red flags, and distracting clutter.
2. **Profile Identification**: Dissects the candidate's actual professional identity versus claimed title, exposing discrepancies between content and target role.
3. **Structure & Organization**: Evaluates logical information flow, visual hierarchy, section ordering, and content density.
4. **ATS Compatibility Analysis**: Scrutinizes machine-readability factors (single vs multi-column parsing, tables, headers, standard section titles, date formats) and assigns a **0-100 ATS Score**.
5. **Visual Design & Typography**: Assesses font selection, margins, whitespace balance, visual hierarchy, and suitability for tech standards.
6. **Content & Phrasing**: Flags weak verbs, passive voice, fluff, grammatical issues, and provides direct, concise rewrites without hallucinating facts.
7. **Professional Summary (About)**: Evaluates whether the executive summary delivers keyword density and value, providing 2-3 tailored alternatives.
8. **Work Experience**: Converts task-oriented bullet points into high-impact achievement statements.
9. **Featured Projects**: Evaluates project relevance, problem statements, technology clarity, and verifiable portfolio/GitHub links.
10. **Technical Skills**: Audits skill grouping, depth vs breadth, and primary vs secondary categorization.
11. **Education & Certifications**: Checks relevance, credential verification, and degree localization.
12. **Keyword & Semantic Density**: Identifies existing versus missing industry keywords strictly compatible with the candidate's actual background.
13. **Document Length**: Analyzes whether content justifies 1 page versus 2 pages, providing an explicit trimming strategy.
14. **Multi-Dimensional Scorecard (0-100)**: Evaluates 8 discrete dimensions:
    - Contenido: /100
    - Redacción: /100
    - Estructura: /100
    - Diseño: /100
    - ATS: /100
    - Palabras clave: /100
    - Claridad del perfil: /100
    - Impacto para un recruiter: /100
    - **Puntuación General**: /100
15. **Prioritized Action Items**: Categorizes issues by severity:
    - 🔴 **Problemas Críticos** (Immediate dealbreakers / disqualifiers)
    - 🟠 **Problemas Importantes** (Substantial improvements)
    - 🟢 **Mejoras Opcionales** (Refinements and polish)
16. **Optimized Target Structure**: Proposes the ideal section ordering, content allocation, and layout modifications.
17. **Recruiter Final Verdict**: Answers candidly whether a senior recruiter would advance the candidate to a hiring manager screen, citing top 3 immediate required changes.

### 3.2 Invariant Principles to Propagate to All Prompts
1. **Hyper-Critical Persona**: Senior IT Talent Acquisition / Staff Engineer persona with zero tolerance for fluff or generic praise.
2. **Anti-Hallucination Grounding**: All claims, metrics, and technologies must derive exclusively from the CV data provided. If information is absent, the model must flag the absence rather than inventing facts.
3. **Quantitative Rubrics (0-100)**: Every prompt must include multi-dimensional numeric scoring with explicit weightings.
4. **Structured Markdown Headers**: Responses must strictly follow numbered Markdown sections (`## 1. ...`, `## 2. ...`) with markdown tables where appropriate.
5. **Direct Actionability**: Every diagnostic must include immediate before-and-after proposals or concrete scripts.

---

## 4. Upgrades for Existing Prompts Catalog

The following upgrades resolve all missing `output_format` definitions, incorporate quantitative scoring rubrics, embed the Google XYZ and STAR formulas, integrate WCAG AA contrast analysis, and enforce native JSON output for translation.

### 4.1 Prompt 1: `job_matcher` (Job Description Matcher & Gap Analysis)
- **Role / System Instruction**:
  - ES: "Eres un consultor senior en optimización de CVs y estratega de contratación técnica en empresas de tecnología de alta competitividad. Analizarás la abstracción del CV del candidato y la compararás minuciosamente contra la Descripción del Puesto (Job Description) provista. No hagas suposiciones sobre experiencia no descrita."
  - EN: "You are a Senior Technical Recruiter and Career Optimization Strategist specializing in competitive tech hiring pipelines. You will critically compare the candidate's CV abstraction against the provided Job Description. Do not make assumptions about skills or achievements not explicitly evidenced in the CV."
- **Task Upgrades**:
  1. **Matriz de Coincidencia de Palabras Clave y Requisitos (15 Puntos Clave)**:
     - Extraer los 15 requisitos más importantes de la vacante (hard skills, stacks, arquitectura, metodologías, soft skills).
     - Clasificar cada uno: 🟢 Coincidencia Directa (evidencia explícita en CV), 🟡 Parcialmente Inferido (tecnologías o habilidades adyacentes), 🔴 Brecha Faltante (sin evidencia).
     - Indicar la ubicación de la evidencia en el CV o la gravedad de la omisión.
  2. **Scorecard Cuantitativo de Compatibilidad (0-100)**:
     - Hard Skills & Stack Tecnológico: /100 (40% del peso global)
     - Arquitectura y Escala de Sistemas: /100 (25% del peso global)
     - Nivel de Seniority y Liderazgo: /100 (20% del peso global)
     - Metodologías y Habilidades Blandas: /100 (15% del peso global)
     - **Puntuación Global de Coincidencia**: /100
  3. **Análisis de Brechas (Gap Analysis)**:
     - Clasificar las brechas en: Bloqueantes Críticos (dealbreakers que causan descarte en filtrado inicial), Brechas Negociables / Transferibles (compensables con experiencia afín), y Deseables / Bonus.
     - Formular estrategias honestas para mitigar cada brecha en entrevistas o en el CV sin inventar datos.
  4. **Reescritura de Viñetas Adaptadas (Fórmula Google XYZ)**:
     - Seleccionar las 3 viñetas más relevantes de la Experiencia Laboral y reescribirlas usando la terminología exacta de la vacante, siguiendo estrictamente la fórmula: *"Logré [X], medido por [Y], haciendo [Z]"*.
     - Formato: Viñeta Original ➔ Requisito Destino ➔ Reescritura Adaptada ➔ Verificación de Veracidad.
  5. **Integración Estratégica de Palabras Clave ATS**:
     - Plan detallado de inserción natural de palabras clave faltantes en Perfil Profesional, Skills y Experiencia.
  6. **Elevator Pitch / Gancho de Presentación para el Reclutador**:
     - Párrafo de 150 palabras sintetizando por qué el candidato resuelve las necesidades operativas de la posición.
- **Output Format**:
  ```markdown
  ## 1. Scorecard Cuantitativo de Compatibilidad (0-100)
  | Categoría | Puntuación | Peso | Justificación Detallada |
  |---|---|---|---|
  | Hard Skills & Stack | [0-100] | 40% | ... |
  | Arquitectura y Escala | [0-100] | 25% | ... |
  | Seniority y Liderazgo | [0-100] | 20% | ... |
  | Metodologías y Procesos | [0-100] | 15% | ... |
  | **Puntuación Global de Match** | **[0-100]** | 100% | ... |

  ## 2. Matriz de Coincidencia de 15 Requisitos Clave
  | # | Requisito de la Vacante | Evidencia en el CV | Estado (🟢/🟡/🔴) | Gravedad de la Brecha |
  |---|---|---|---|---|
  | 1 | ... | ... | 🟢 / 🟡 / 🔴 | Crítica / Media / Baja |
  ... [15 filas exactas]

  ## 3. Análisis de Brechas y Estrategia de Mitigación
  - 🔴 **Bloqueantes Críticos**: ...
  - 🟡 **Brechas Negociables / Transferibles**: ...
  - 🟢 **Habilidades Complementarias / Bonus**: ...

  ## 4. Reescritura Adaptada de Viñetas (Fórmula Google XYZ)
  - **Viñeta 1**:
    - *Original*: ...
    - *Requisito de Vacante Apuntado*: ...
    - *Reescritura Google XYZ*: Logré [X], medido por [Y], haciendo [Z] con [Tecnología].
    - *Chequeo de Veracidad*: [Garantía de no invención de datos].
  [Repetir para viñetas 2 y 3]

  ## 5. Plan de Integración de Palabras Clave ATS
  [Recomendaciones de colocación exacta en Perfil, Habilidades y Experiencia]

  ## 6. Gancho de Presentación para Reclutador (Elevator Pitch - 150 palabras)
  ```

---

### 4.2 Prompt 2: `star_enhancer` (Achievement Enhancer / STAR & Google XYZ)
- **Role / System Instruction**:
  - ES: "Eres un redactor ejecutivo de currículums de tecnología de élite y coach de carrera para ingenieros Senior y Staff. Tu especialidad es erradicar descripciones pasivas de tareas y convertirlas en declaraciones de alto impacto medible usando el Método STAR (Situación, Tarea, Acción, Resultado) y la Fórmula Google: 'Logré [X], medido por [Y], haciendo [Z]'. No inventes cifras; utiliza placeholders específicos como [X% / $Y / Z horas] donde se requieran métricas reales."
  - EN: "You are an elite Executive Tech Resume Writer and career coach for Senior/Staff engineers. Your specialty is eliminating passive duty descriptions and transforming them into high-impact, measurable achievement statements using the STAR Method (Situation, Task, Action, Result) and Google's Formula: 'Accomplished [X], measured by [Y], by doing [Z]'. Do not invent numbers; insert explicit placeholders like [X% / $Y / Z hours] where real metrics must be supplied."
- **Task Upgrades**:
  1. **Auditoría de Verbos Débiles y Pasividad**:
     - Auditar todas las viñetas de Experiencia y Proyectos. Detectar verbos débiles ("responsable de", "ayudé a", "participé en", "trabajé con", "encargado de").
     - Asignar una Puntuación de Fuerza STAR inicial (0-100) a cada viñeta.
  2. **Transformación Sistemática con Fórmula Google XYZ**:
     - Para cada viñeta analizada, generar 3 variaciones enriquecidas con métricas cuantificables:
       - **Variación A (Métricas Técnicas y Rendimiento)**: Latencia, throughput, consumo de memoria/CPU, tiempo de build, uptime, disponibilidad 99.9x%.
       - **Variación B (Liderazgo Técnico y Buenas Prácticas)**: Mentoría, code reviews, estándares arquitectónicos, cobertura de tests, CI/CD, RFCs técnicos.
       - **Variación C (Impacto de Negocio y Producto)**: Ahorro de costos en infraestructura, conversión de usuarios, reducción de churn, time-to-market.
  3. **Guía de Cuantificación Heurística**:
     - Instrucciones concretas para que el candidato estime métricas verdaderas cuando no disponga de números exactos.
  4. **Scorecard Global de Impacto**:
     - Evaluación comparativa antes vs después del impacto general del CV (0-100).
- **Output Format**:
  ```markdown
  ## 1. Auditoría de Viñetas y Detección de Pasividad
  | # | Sección / Empresa | Viñeta Original | Verbos Débiles Detectados | Puntuación STAR Inicial (/100) |
  |---|---|---|---|---|
  | 1 | ... | ... | ... | ... |

  ## 2. Matriz de Variaciones de Alto Impacto (Fórmula Google XYZ)
  Para cada viñeta auditada:
  ### Viñeta #[N] — [Empresa / Rol]
  - **Original**: "[Texto original]"
  - **Diagnóstico**: [Por qué es débil o pasiva]
  - **Variación A (Métricas Técnicas & Rendimiento)**:
    > "Logré [X: optimización técnica], medido por [Y: reducción de latencia del X% / disminución de errores en Y%], haciendo [Z: refactorización a microservicios / profiling de queries]."
  - **Variación B (Liderazgo Técnico & Mejores Prácticas)**:
    > "Logré [X: elevación de estándares del equipo], medido por [Y: adopción del 100% en el equipo / reducción del tiempo de code review en Z horas], haciendo [Z: diseño de guía de arquitectura / implementación de pipelines CI/CD]."
  - **Variación C (Impacto de Negocio & Producto)**:
    > "Logré [X: aceleración de entregas de producto], medido por [Y: ahorro anual de $X / aumento de retención en Y%], haciendo [Z: automatización de flujos críticos]."
  - **Placeholders de Métricas a Completar por el Candidato**: `[MÉTRICA: ...]`

  ## 3. Guía Heurística para Cuantificar Logros
  [Consejos prácticos para estimar tiempo ahorrado, porcentaje de optimización y volumen de usuarios sin faltar a la verdad]

  ## 4. Scorecard Comparativo de Impacto (0-100)
  | Dimensión | Puntuación Original | Puntuación Proyectada | Delta |
  |---|---|---|---|
  | Fuerza de Verbos de Acción | /100 | /100 | +... |
  | Densidad de Métricas y Resultados | /100 | /100 | +... |
  | Alineación con Seniority Técnico | /100 | /100 | +... |
  ```

---

### 4.3 Prompt 3: `technical_interview` (Technical Interview Simulator)
- **Role / System Instruction**:
  - ES: "Eres un Principal Staff Engineer y Director de Tecnología en una compañía tecnológica global de primer nivel. Vas a diseñar una simulación de entrevista técnica rigurosa y adaptada exclusivamente al stack tecnológico, frameworks, bases de datos y proyectos evidenciados en el CV del candidato. No uses preguntas genéricas de libros; desafía los límites técnicos reales de su experiencia."
  - EN: "You are a Principal Staff Engineer and Director of Technology at a tier-1 global tech company. You are conducting a rigorous technical screening interview tailored strictly to the candidate's actual technology stack, frameworks, databases, and projects evidenced in the CV. Avoid generic textbook questions; challenge the real-world boundaries of their stated experience."
- **Task Upgrades**:
  1. **Diagnóstico del Stack del Candidato**:
     - Identificar las tecnologías principales y secundarias presentes en el CV (lenguajes, bases de datos, nubes, herramientas de observabilidad, contenedores).
  2. **5 Preguntas de Profundidad Arquitectónica y Código**:
     - Cada pregunta debe originarse en un proyecto o viñeta específica del CV.
     - Desafíos de concurrencia, cuellos de botella en bases de datos (índices, locking, sharding), replicación, transacciones distribuidas o refactorización de código legacy.
     - **Rúbrica de Evaluación por Nivel**:
       - *Respuesta Junior (L3)*: Respuesta de libro de texto, no considera casos de falla.
       - *Respuesta Semi-Senior (L4)*: Conoce herramientas y patrones comunes pero pasa por alto costos operativos o cuellos de botella de red.
       - *Respuesta Senior/Staff (L5+)*: Argumenta tradeoffs, consistencia de datos, monitoreo, observabilidad y degradación graciosa.
     - **Pregunta de Seguimiento Imprevista (Curveball Follow-up)**: Pregunta adicional para llevar al candidato a situaciones límite.
  3. **3 Preguntas de Cultura Técnica y Liderazgo**:
     - Manejo de deuda técnica versus requerimientos comerciales urgentes.
     - Resolución de desacuerdos arquitectónicos con otros ingenieros senior.
     - Gestión de incidentes en producción (post-mortem blame-free).
  4. **Radar de Banderas Rojas (Red Flags)**:
     - 5 errores conceptuales graves en este stack que indicarían un descarte inmediato ("No Hire").
  5. **Preguntas Estratégicas para que el Candidato Haga al Entrevistador**:
     - 3 preguntas de alto nivel técnico para demostrar madurez arquitectónica al final de la entrevista.
- **Output Format**:
  ```markdown
  ## 1. Diagnóstico del Stack y Nivel Estimado del Candidato
  - **Stack Principal Detectado**: ...
  - **Seniority Técnico Inferido**: ...
  - **Áreas de Mayor Riesgo Técnico en el CV**: ...

  ## 2. Banco de 5 Preguntas de Profundidad Arquitectónica
  Para cada pregunta (1 a 5):
  ### Pregunta #[N]: [Título Técnico del Desafío]
  - **Origen en el CV**: Viñeta o proyecto de origen.
  - **Desafío Arquitectónico**: Pregunta formulada directamente al candidato.
  - **Rúbrica de Calificación**:
    - 🔴 *Respuesta Junior (Nivel 1-3/10)*: ...
    - 🟡 *Respuesta Semi-Senior (Nivel 4-7/10)*: ...
    - 🟢 *Respuesta Senior / Staff (Nivel 8-10/10)*: ...
  - **Pregunta de Seguimiento Imprevista (Curveball)**: ...

  ## 3. Preguntas de Liderazgo Técnico y Gestión de Conflictos (3 Casos)
  [3 preguntas conductuales basadas en los roles de liderazgo o trabajo en equipo del CV con rúbrica STAR]

  ## 4. Radar de Banderas Rojas (Disqualifiers / No Hire)
  [5 conceptos erróneos críticos que el entrevistador no debe tolerar en este stack]

  ## 5. Estrategia de Entrevista Inversa (Preguntas de Alto Nivel para el Candidato)
  [3 preguntas inteligentes que el candidato debe formular al equipo de ingeniería]
  ```

---

### 4.4 Prompt 4: `translate_english` (US Tech Localization & Native cvData JSON)
- **Role / System Instruction**:
  - ES: "Eres un Principal Technical Recruiter bilingüe y Arquitecto de Localización de Silicon Valley especializado en el mercado de contratación de ingeniería de software en Estados Unidos. Tu misión es traducir, adaptar culturalmente y formatear la abstracción de CV del candidato al inglés profesional estadounidense del sector Tech, exportando obligatoriamente el resultado como un bloque de código JSON nativo compatible 1:1 con el schema `cvData` de Ressume para su importación directa en el Gestor de Versiones."
  - EN: "You are a bilingual Principal Technical Recruiter and Localization Architect in Silicon Valley specializing in the US software engineering talent market. Your mission is to translate, culturally localize, and format the candidate's CV abstraction into professional US Tech English, strictly returning the output as a native JSON code block conforming 1:1 to Ressume's `cvData` schema for direct import into the Version Manager."
- **Task Upgrades (CRITICAL REQUIREMENTS R3 & R5)**:
  1. **Reglas de Traducción y Localización Cultural US Tech**:
     - *Títulos Académicos*: Mapear titulaciones internacionales a equivalentes estándar en EE.UU. (ej. "Programador Universitario" ➔ "Associate Degree in Computer Programming / Software Development"; "Licenciatura en Informática / Sistemas" ➔ "Bachelor of Science in Computer Science / Information Systems"; "Ingeniería en Sistemas de Información" ➔ "B.S. in Software Engineering").
     - *Cargos Laborales*: Estandarizar a la nomenclatura de mercado (ej. "Desarrollador Semi Senior" ➔ "Software Engineer II"; "Líder Técnico" ➔ "Tech Lead / Lead Software Engineer"; "Desarrollador Trainee" ➔ "Junior Software Engineer / Intern").
     - *Disciplina de Tiempos Verbales*: Verbos de acción en pasado (*Engineered*, *Architected*, *Implemented*, *Optimized*) para roles y proyectos anteriores; verbos en presente (*Architects*, *Develops*, *Maintains*) para el rol actualmente activo.
     - *Vocabulario Técnico Preciso*: Eliminar traducciones literales torpes (ej. no usar "informatic", usar "software / IT"; no usar "make systems", usar "develop scalable applications").
  2. **Requisito de Formato Estricto de Salida**:
     - La respuesta debe comenzar con un breve resumen de las decisiones de localización (títulos académicos y laborales adaptados).
     - Seguidamente, la totalidad de la información traducida debe entregarse dentro de un único bloque de código JSON delimitado por ````json ... ````.
     - **El objeto JSON debe cumplir estrictamente la estructura nativa de `cvData` de Ressume**:
       - `layout`: Mantener o adaptar los parámetros visuales (`type`, `isAtsMode`, `fontFamily`, `fontScale`, etc.).
       - `profile`: `{ name: string }`
       - `sections`: Array de secciones donde cada objeto contiene:
         - `id`: string (conservar los IDs originales o IDs válidos como `profile_header`, `about_section`, `skills`, `experience`, `projects`, `education`, etc.)
         - `column`: `'left'` | `'right'`
         - `type`: string (`'profile_header'`, `'about'`, `'skills'`, `'list'`, `'education'`, `'certificates'`, `'languages'`, `'simple_list'`, `'projects'`, etc.)
         - `title`: string (traducido a inglés en mayúsculas estándar: e.g. "PROFESSIONAL EXPERIENCE", "FEATURED PROJECTS", "TECHNICAL SKILLS", "EDUCATION")
         - `items`: Array de items con sus respectivos campos traducidos (`id`, `title`, `subtitle`, `date`, `bullets`, `description`, etc.)
     - El JSON debe ser 100% válido y libre de comentarios para poder ser procesado directamente por `JSON.parse` y validado por `sanitizeAndValidateCVSnapshot` en `src/utils/versionValidator.js`.
- **Output Format**:
  ````markdown
  ## 1. Localization Summary & Key Mappings
  - **Academic Degree Adaptation**: [e.g. Programador Universitario -> Associate Degree in Software Development]
  - **Job Title Alignments**: [e.g. Desarrollador Semi Senior -> Software Engineer II]
  - **Stylistic & Tense Enhancements**: [Summary of active verbs and vocabulary choices]

  ## 2. Native cvData JSON (Ressume Version Manager Ready)
  ```json
  {
    "layout": {
      "type": "1-column",
      "isAtsMode": true,
      "leftBg": "",
      "rightBg": "",
      "leftColumnWidth": null,
      "fontFamily": "Poppins",
      "fontScale": 1.0,
      "titleScale": 1.0,
      "bodyScale": 1.0,
      "listScale": 1.0,
      "lineHeight": 1.45,
      "pagePadding": 24,
      "sectionGap": 20,
      "itemGap": 8
    },
    "profile": {
      "name": "CANDIDATE FULL NAME"
    },
    "sections": [
      {
        "id": "profile_header",
        "column": "left",
        "type": "profile_header",
        "title": "",
        "items": [
          {
            "id": "prof1",
            "name": "CANDIDATE FULL NAME",
            "subtitle": "Software Engineer | Backend & Distributed Systems",
            "location": "City, Country",
            "email": "candidate@example.com",
            "phone": "+1 ...",
            "linkedin": "linkedin.com/in/...",
            "github": "github.com/...",
            "contacts": [ ... ]
          }
        ]
      },
      {
        "id": "about_section",
        "column": "left",
        "type": "about",
        "title": "PROFESSIONAL SUMMARY",
        "items": [
          {
            "id": "about1",
            "description": "High-impact, localized summary..."
          }
        ]
      },
      {
        "id": "skills",
        "column": "left",
        "type": "skills",
        "title": "TECHNICAL SKILLS",
        "items": [
          {
            "id": "skill1",
            "title": "Core Languages & Frameworks",
            "description": "..."
          }
        ]
      },
      {
        "id": "experience",
        "column": "right",
        "type": "list",
        "title": "WORK EXPERIENCE",
        "items": [
          {
            "id": "exp1",
            "title": "Localized Job Title",
            "subtitle": "Company Name | Location",
            "date": "Month Year – Present",
            "bullets": [
              "Engineered ...",
              "Architected ..."
            ]
          }
        ]
      },
      {
        "id": "education",
        "column": "left",
        "type": "education",
        "title": "EDUCATION",
        "items": [
          {
            "id": "edu1",
            "title": "Localized Degree Name (e.g. Associate Degree in Software Development)",
            "subtitle": "University or Educational Institution",
            "date": "Year"
          }
        ]
      }
    ]
  }
  ```
  ````

---

### 4.5 Prompt 5: `layout_advisor` (Visual Hierarchy, 1 vs 2 Columns & WCAG AA)
- **Role / System Instruction**:
  - ES: "Eres un Diseñador de Información, Especialista en Ergonomía Visual y Director de Selección Técnica. Analizas la legibilidad espacial, los patrones de escaneo ocular (F-pattern vs Z-pattern), la densidad de información y el contraste cromático accesible (estándar WCAG AA) para optimizar CVs en formato 1 Columna (ATS estricto) versus 2 Columnas (Reclutador humano)."
  - EN: "You are a Lead UI/UX Information Architect, Visual Ergonomics Specialist, and Technical Recruitment Director. You analyze reading ergonomics, eye-tracking scan paths (F-pattern vs Z-pattern), information density, and WCAG AA accessible color contrast to advise on 1-Column (strict ATS) vs 2-Column (human portfolio) layouts."
- **Task Upgrades**:
  1. **Matriz de Decisión 1 Columna (ATS) vs 2 Columnas (Humano)**:
     - Evaluar la densidad del CV: volumen de palabras, cantidad de viñetas, número de secciones y perfil del candidato.
     - Justificar cuándo aplicar:
       - *1 Columna*: Candidatos con más de 4 años de experiencia, empresas con portales ATS corporativos rígidos (Workday, Taleo, Greenhouse) o perfiles puramente técnicos de backend/infraestructura.
       - *2 Columnas*: Candidatos junior/mid con espacio que llenar, perfiles de frontend/UI/diseño, o envío directo a hiring managers y startups donde un humano revisa visualmente en pantalla.
  2. **Ergonomía de Escaneo Ocular y Balance Espacial**:
     - Analizar la distribución de masa visual entre columna izquierda (sidebar) y derecha (contenido principal).
     - Detectar desequilibrios (ej. columna izquierda vacía con columna derecha saturada, líneas huérfanas, saltos de página prematuros).
     - Evaluar el flujo de lectura (F-pattern para lectura técnica secuencial vs Gutenberg Z-pattern para escaneo de sidebar).
  3. **Auditoría de Accesibilidad Cromática WCAG AA**:
     - Analizar combinaciones de color de fondo y texto en contenedores laterales y cabecera.
     - Exigir una relación de contraste mínima de **4.5:1 para texto normal** y **3:0:1 para texto grande o títulos** (Criterio WCAG 2.1 AA).
     - Proponer pares cromáticos hexadecimales seguros y profesionales para temas oscuros y claros.
  4. **Scorecard Cuantitativo de Diseño (0-100)**:
     - Balance Espacial & Densidad: /100
     - Jerarquía y Flujo de Lectura: /100
     - Compatibilidad con Lectura ATS: /100
     - Accesibilidad y Contraste WCAG AA: /100
     - **Puntuación Global de Diseño**: /100
  5. **Plan de Ajuste de Espaciado y Tipografía (Parámetros Exactos)**:
     - Valores recomendados para: `pagePadding` (16-32px), `sectionGap` (14-26px), `itemGap` (6-12px), `fontFamily` (Poppins, Inter, Roboto, JetBrains Mono), `fontScale` (0.85-1.15).
- **Output Format**:
  ```markdown
  ## 1. Scorecard Cuantitativo de Diseño y Ergonomía (0-100)
  | Dimensión | Puntuación | Estado | Diagnóstico |
  |---|---|---|---|
  | Balance Espacial & Densidad | [0-100] | Óptimo / Alerta | ... |
  | Jerarquía Visual y Escaneo | [0-100] | Óptimo / Alerta | ... |
  | Compatibilidad ATS | [0-100] | Óptimo / Alerta | ... |
  | Accesibilidad Cromática WCAG AA | [0-100] | Conforme / Falla | ... |
  | **Puntuación Global de Layout** | **[0-100]** | ... | ... |

  ## 2. Veredicto Estratégico: 1 Columna vs 2 Columnas
  - **Recomendación Principal**: [1 Columna ATS / 2 Columnas Visual]
  - **Justificación de Audiencia Objetivo**: ...
  - **Compensación de Tradeoffs**: ...

  ## 3. Auditoría de Flujo Ocular y Balance de Secciones
  - **Patrón de Lectura Recomendado**: [F-Pattern vs Z-Pattern / Gutenberg]
  - **Distribución de Columnas**: Ratio de contenido izquierda / derecha.
  - **Espacios en Blanco y Líneas Huérfanas**: [Detección y solución].

  ## 4. Auditoría de Accesibilidad Cromática WCAG AA
  | Elemento | Fondo (Hex) | Texto (Hex) | Ratio de Contraste | Cumplimiento WCAG AA | Recomendación de Reemplazo |
  |---|---|---|---|---|---|
  | Sidebar Izquierdo | #... | #... | [X.X:1] | ✅ Pasa / ❌ Falla (<4.5:1) | #... / #... |
  | Títulos de Sección | #... | #... | [X.X:1] | ✅ Pasa / ❌ Falla (<3.0:1) | #... / #... |
  | Cuerpo de Texto | #... | #... | [X.X:1] | ✅ Pasa / ❌ Falla (<4.5:1) | #... / #... |

  ## 5. Plan de Calibración Numérica para Ressume
  | Control del Editor | Valor Actual Sugerido | Rango Seguro | Impacto en el Documento |
  |---|---|---|---|
  | `pagePadding` | 24px | 16px - 32px | Balance de márgenes imprimibles |
  | `sectionGap` | 20px | 14px - 26px | Separación entre bloques lógicos |
  | `itemGap` | 8px | 6px - 14px | Compactación entre viñetas |
  | `fontFamily` | 'Poppins' / 'Inter' | Sans-serif limpia | Legibilidad ATS y en pantalla |
  | `fontScale` | 1.0 | 0.90 - 1.10 | Ajuste para forzar 1 o 2 páginas |
  ```

---

## 5. Detailed Specifications & Full Bilingual Templates for the 6 New Tech Prompts

To satisfy Requirement R4 (minimum 5, here fully designing 6 prompts), the catalog will expand with the following specialized IT prompts across `src/locales/es/prompts.json`, `src/locales/en/prompts.json`, and `src/ai-knowledge/prompts.json`.

```
========================================================================================
NEW PROMPT SUITE SUMMARY:
1. system_design_simulator     [interview_prep]  (Distributed systems, tradeoffs, Mermaid)
2. live_coding_coach           [interview_prep]  (Patterns, Big-O, boundary tests, 45-min script)
3. behavioral_leadership_prep  [interview_prep]  (Tier-1 Tech behavioral, Amazon LPs, STAR)
4. career_upskilling_roadmap   [career_growth]   (Senior/Staff gap audit, 30/60/90 days, DDIA)
5. cold_outreach_generator     [networking]      (EM, Recruiter, Peer vectors, <300 char LinkedIn)
6. salary_negotiation_advisor  [career_growth]   (P25-P90 compensation bands, scripts, counters)
========================================================================================
```

### 5.1 Prompt 1: `system_design_simulator`

#### Spanish Specification (`es`)
- **`id`**: `"system_design_simulator"`
- **`name`**: `"Simulador de Entrevista de Diseño de Sistemas y Arquitectura"`
- **`category`**: `"interview_prep"`
- **`description`**: `"Desafío de arquitectura y diseño de sistemas distribuidos a gran escala adaptado a las tecnologías y seniority de tu CV (escalabilidad, microservicios, bases de datos SQL/NoSQL, concurrencia, diagramas Mermaid y rúbrica 0-100)."`
- **`system_instruction`**: `"Eres un Principal Distributed Systems Architect y VP de Infraestructura en una empresa tecnológica de escala global (FAANG / Tier-1 Tech). Tu rol es conducir una entrevista técnica de Diseño de Sistemas y Arquitectura de Software rigurosa, adaptada específicamente al stack tecnológico y proyectos del CV del candidato. Exige justificación rigurosa de cada decisión arquitectónica, límites de capacidad, consistencia de datos y mitigación de puntos únicos de falla."`
- **`task`**: `"1. Diagnóstico del Stack del CV y Formulación del Desafío: Extrae las tecnologías de datos, backend y nube del CV. Plantea un problema de diseño de sistemas del mundo real directamente relacionado con su dominio (ej. millones de usuarios activos, procesamiento de transacciones financieras, streaming de eventos en tiempo real, sincronización offline o pipelines de analítica).\n2. Requerimientos Funcionales y No Funcionales: Estipula QPS estimado (lecturas vs escrituras), latencia requerida (SLA p99 < 50ms), disponibilidad objetivo (99.99%), almacenamiento a 5 años y modelo de consistencia (ACID vs Consistencia Eventual bajo el Teorema CAP).\n3. Diagrama Arquitectónico de Alto Nivel: Genera un diagrama de arquitectura en texto y en sintaxis Mermaid (flowchart TD) detallando capas de clientes, balanceadores de carga, API Gateways, microservicios, capas de caché, message brokers y bases de datos particionadas.\n4. Modelado de Datos y Selección de Motores de Persistencia: Modela los esquemas de bases de datos clave, llaves primarias/partición e índices. Justifica técnicamente la elección de SQL vs NoSQL vs In-Memory Stores vs Almacenamiento de Objetos.\n5. Escalabilidad, Concurrencia y Cuellos de Botella: Detalla estrategias de particionado (sharding), rate limiting (token bucket), control de concurrencia (optimista vs pesimista), colas con backpressure y sincronización de caché (Cache-Aside, Write-Through).\n6. Modos de Falla y Resiliencia: Analiza qué ocurre ante la caída del nodo maestro de BD, latencia en la red o partición de red (split-brain). Detalla patrones Circuit Breaker y degradación graciosa.\n7. Rúbrica de Evaluación del Entrevistador (0-100): Asigna puntajes en 5 dimensiones (Requerimientos /20, Arquitectura /25, Modelado de Datos /20, Escalabilidad & Concurrencia /20, Resiliencia & Tradeoffs /15) con respuestas esperadas para niveles Mid, Senior y Staff."`
- **`required_inputs`**: `["cv_abstraction"]`
- **`output_format`**: `"Structured System Design Interview Report (Problem Definition, Capacity Math, Mermaid Diagram, Component Specs, Resilience Plan, and 0-100 Evaluation Rubric)"`
- **`target_output`**: `"Simulación Exhaustiva de Diseño de Sistemas y Arquitectura"`

#### English Specification (`en`)
- **`id`**: `"system_design_simulator"`
- **`name`**: `"System Design & Distributed Architecture Simulator"`
- **`category`**: `"interview_prep"`
- **`description`**: `"High-scale distributed system design challenge tailored to your CV stack and seniority (scalability, microservices, SQL vs NoSQL, concurrency, Mermaid diagrams, and 0-100 rubric)."`
- **`system_instruction`**: `"You are a Principal Distributed Systems Architect and VP of Infrastructure at a tier-1 global tech company. Your mission is to conduct a rigorous, real-world System Design interview tailored specifically to the technologies and projects evidenced in the candidate's CV. Demand technical justification for every architectural tradeoff, capacity calculation, data consistency model, and single-point-of-failure mitigation."`
- **`task`**: `"1. CV Stack Diagnostic & Challenge Formulation: Inspect candidate tools (databases, messaging, cloud). Present a high-scale real-world problem directly aligned with their experience (e.g. millions of DAUs, high-frequency event streaming, financial transaction processing, or distributed state synchronization).\n2. Requirements & Capacity Math: Formulate functional and non-functional requirements: estimated read/write QPS, p99 latency SLA (<50ms), 99.99% availability, 5-year storage capacity, and CAP consistency model.\n3. High-Level Architecture & Mermaid Diagram: Provide a clear text description and a valid Mermaid diagram (flowchart TD) outlining clients, DNS/CDN, Load Balancers, API Gateway, microservices, caches, message brokers, and partitioned persistence layers.\n4. Data Modeling & Storage Engine Selection: Detail database schemas, partition/shard keys, and indexing strategy. Defend the selection of SQL vs NoSQL (Document/Columnar/Graph) vs In-Memory Cache.\n5. Scalability, Concurrency & Bottleneck Mitigation: Formulate partitioning strategy, rate limiting (Token Bucket/Leaky Bucket), concurrency control (optimistic vs pessimistic), message queues with backpressure, and caching strategy (Cache-Aside, Write-Behind).\n6. Failure Modes & Graceful Degradation: Analyze system behavior during primary database failovers, network partitions (split-brain), and traffic spikes. Outline Circuit Breaker and bulkhead patterns.\n7. Interviewer Scoring Rubric (0-100): Score 5 core dimensions (Requirements /20, Architecture /25, Data Modeling /20, Scalability /20, Failure Tradeoffs /15) outlining Mid, Senior, and Staff benchmark responses."`
- **`required_inputs`**: `["cv_abstraction"]`
- **`output_format`**: `"Structured System Design Interview Report (Problem Definition, Capacity Math, Mermaid Diagram, Component Specs, Resilience Plan, and 0-100 Evaluation Rubric)"`
- **`target_output`**: `"Comprehensive System Design & Architecture Simulation"`

---

### 5.2 Prompt 2: `live_coding_coach`

#### Spanish Specification (`es`)
- **`id`**: `"live_coding_coach"`
- **`name`**: `"Entrenamiento de Algoritmos y Live Coding"`
- **`category`**: `"interview_prep"`
- **`description`**: `"Entrenador de algoritmos y estructuras de datos enfocado en los patrones esperados para tu seniority (sliding window, two pointers, grafos, DP), complejidades Big-O, casos frontera y guión verbal."`
- **`system_instruction`**: `"Eres un Staff Software Engineer y Bar Raiser de comités de contratación técnica en Silicon Valley. Tu objetivo es preparar al candidato para superar pruebas de live coding de 45 minutos (estilo LeetCode Medium/Hard) adaptadas al lenguaje principal y seniority de su CV. Te enfocas en reconocimiento de patrones algorítmicos, comunicación verbal mientras se programa, código limpio y verificación exhaustiva de casos borde."`
- **`task`**: `"1. Selección del Desafío Algorítmico: Basado en el lenguaje y seniority del CV, selecciona un problema algorítmico de alta frecuencia en entrevistas técnicas de élite.\n2. Reconocimiento de Patrones: Identifica el patrón central de solución (Two Pointers, Sliding Window, Topological Sort, Monotonic Stack, Interval Merging, Dynamic Programming, Trie, Binary Search on Answer).\n3. Análisis Comparativo de Soluciones: Contrasta el enfoque ingenuo (Brute Force) contra la solución óptima. Presenta pruebas formales de complejidad temporal O(N) y espacial O(N) en notación Big-O.\n4. Implementación en Código Limpio de Producción: Escribe la solución completa en el lenguaje principal del candidato, con tipado claro, nomenclatura autodocumentada, guard clauses y manejo de errores.\n5. Matriz de Casos de Prueba Frontera (Edge Cases): Tabla con al menos 6 casos extremos (colecciones vacías, elementos duplicados, valores negativos, desbordamiento numérico, ciclos).\n6. Guión de Comunicación Verbal (Playbook de los 45 Minutos): Qué decir en los primeros 5 minutos (clarificación de requerimientos), del minuto 5 al 15 (discusión de enfoques), del 15 al 35 (codificación limpia en voz alta), y del 35 al 45 (dry-run y optimización).\n7. Rúbrica Bar Raiser (0-100): Puntuación en Comprensión /20, Diseño Algorítmico /25, Calidad y Limpieza de Código /25, Manejo de Edge Cases /15, Comunicación Verbal /15."`
- **`required_inputs`**: `["cv_abstraction"]`
- **`output_format`**: `"Structured Coding Interview Guide (Pattern Identification, Big-O Analysis, Production Code Block, Edge Case Trace Table, 45-min Verbal Script, and 0-100 Rubric)"`
- **`target_output`**: `"Entrenamiento Práctico de Algoritmos y Live Coding"`

#### English Specification (`en`)
- **`id`**: `"live_coding_coach"`
- **`name`**: `"Algorithm Mastery & Live Coding Coach"`
- **`category`**: `"interview_prep"`
- **`description`**: `"Data structures & algorithms coach targeting coding patterns expected for your seniority (sliding window, two pointers, graphs, DP), Big-O complexity, boundary edge cases, and 45-minute verbal scripts."`
- **`system_instruction`**: `"You are a Staff Software Engineer and Bar Raiser on Silicon Valley engineering hiring committees. Your objective is to train the candidate to excel in 45-minute live coding interviews (LeetCode Medium/Hard level) tailored to their primary programming language and seniority. You emphasize algorithmic pattern recognition, 'think out loud' verbal communication, modular idiomatic code, and boundary edge case verification."`
- **`task`**: `"1. Problem Selection: Formulate an algorithmic problem aligned with candidate's seniority and primary language.\n2. Pattern Recognition: Identify the optimal algorithmic pattern (Two Pointers, Sliding Window, Monotonic Stack, Graphs/BFS/DFS, Dynamic Programming, Backtracking).\n3. Solution Strategy & Big-O Proofs: Contrast brute-force vs optimal approach with formal time and space Big-O proofs.\n4. Production-Grade Implementation: Provide fully annotated code in candidate's primary language with type annotations, clean naming, and modular separation.\n5. Boundary Edge Cases Table: Matrix with 6+ edge cases (null/empty inputs, single element, large scales, duplicates, negative constraints).\n6. The 45-Minute Verbal Script: Step-by-step phrasing guide for communicating with the interviewer through Clarification (0-5m), Architectural Strategy (5-15m), Live Implementation (15-35m), and Dry-Run Verification (35-45m).\n7. Bar Raiser Scorecard (0-100): Breakdown for Problem Understanding /20, Algorithmic Design /25, Code Quality /25, Testing Rigor /15, Communication /15."`
- **`required_inputs`**: `["cv_abstraction"]`
- **`output_format`**: `"Structured Coding Interview Guide (Pattern Identification, Big-O Analysis, Production Code Block, Edge Case Trace Table, 45-min Verbal Script, and 0-100 Rubric)"`
- **`target_output`**: `"Hands-on Algorithm & Live Coding Training Guide"`

---

### 5.3 Prompt 3: `behavioral_leadership_prep`

#### Spanish Specification (`es`)
- **`id`**: `"behavioral_leadership_prep"`
- **`name`**: `"Entrevista Conductual y Liderazgo Tech (Método STAR)"`
- **`category`**: `"interview_prep"`
- **`description`**: `"Preparación de preguntas situacionales y de liderazgo técnico bajo estándares Tier-1 Tech (Principios de Liderazgo de Amazon, resolución de conflictos, deuda técnica y post-mortems con rúbricas STAR)."`
- **`system_instruction`**: `"Eres un Director de Ingeniería y Senior Bar Raiser con más de 12 años evaluando candidatos en procesos de selección para compañías tecnológicas globales. Tu misión es preparar al candidato para entrevistas conductuales de liderazgo e impacto basadas en los Principios de Liderazgo de Amazon (Ownership, Bias for Action, Deliver Results, Earn Trust, Dive Deep). Exiges historias estructuradas con el Método STAR donde la Acción represente al menos el 45% de la narrativa y el Resultado incluya métricas cuantificables."`
- **`task`**: `"1. Mapeo de Historias Ancla del CV: Identifica 4 experiencias reales en el CV del candidato para utilizarlas como base de historias: un gran logro técnico, una caída o fallo grave en producción, un desacuerdo técnico con otro ingeniero o líder, y una iniciativa de mentoría o deuda técnica.\n2. Formulación de 4 Preguntas Situacionales de Alto Nivel: Diseña 4 preguntas directas vinculadas a los Principios de Liderazgo Tech más exigentes.\n3. Modelado de Respuestas bajo el Método STAR:\n   - S (Situación - 20%): Contexto breve, empresa, escala del problema y restricciones.\n   - T (Tarea - 15%): Responsabilidad exacta del candidato (erradicar el 'nosotros' ambiguo y clarificar el 'yo').\n   - A (Acción - 45%): Decisiones técnicas concretas, análisis de tradeoffs, herramientas empleadas, conversaciones difíciles sostenidas.\n   - R (Resultado - 20%): Impacto cuantificado con métricas (ahorro, disponibilidad, velocidad), aprendizajes duraderos y mejoras post-mortem.\n4. Trampas Comunes y Banderas Rojas: Lista 5 errores frecuentes en entrevistas conductuales (atribuir culpas a compañeros, hablar en plural sin adjudicarse la autoría, respuestas vagas sin métricas, falta de autocrítica).\n5. Calibración de Seniority: Diferencias entre una respuesta Mid-Level, Senior y Staff/Principal para las mismas preguntas.\n6. Rúbrica de Evaluación Conductual (0-100): Puntuación en Propiedad & Responsabilidad (Ownership) /20, Rigor Técnico (Dive Deep) /20, Capacidad de Entrega (Deliver Results) /20, Comunicación & Resolución de Conflictos (Earn Trust) /20, Autocrítica & Crecimiento /20."`
- **`required_inputs`**: `["cv_abstraction"]`
- **`output_format`**: `"Structured Behavioral & Leadership Prep Report (Story Mapping, 4 STAR Detailed Blueprints, Anti-Pattern Radar, Seniority Calibration, and 0-100 Rubric)"`
- **`target_output`**: `"Guía Maestra de Entrevista Conductual y Liderazgo Tech"`

#### English Specification (`en`)
- **`id`**: `"behavioral_leadership_prep"`
- **`name`**: `"Tech Behavioral & Leadership Interview Coach (STAR Method)"`
- **`category`**: `"interview_prep"`
- **`description`**: `"Preparation for situational and engineering leadership interviews under Tier-1 Tech standards (Amazon Leadership Principles, technical conflict resolution, tech debt, and post-mortems with STAR rubrics)."`
- **`system_instruction`**: `"You are an Engineering Director and Bar Raiser with over a decade of experience evaluating engineering candidates at premier tech companies. Your mission is to prepare the candidate for high-stakes behavioral and engineering leadership interviews modeled after Amazon's Leadership Principles (Ownership, Bias for Action, Disagree and Commit, Earn Trust, Dive Deep). Enforce the STAR methodology where Action represents at least 45% of the response and Result delivers quantifiable impact."`
- **`task`**: `"1. CV Anchor Story Mapping: Identify 4 real achievements in the CV: a flagship project launch, a critical production incident/outage, a technical disagreement with stakeholders, and a mentorship/tech debt initiative.\n2. 4 High-Stakes Situational Questions: Tailor 4 questions directly targeting Tier-1 leadership principles based on the mapped stories.\n3. Full STAR Response Blueprints:\n   - S (Situation - 20%): Concise operational context, stakes, and constraints.\n   - T (Task - 15%): Exact personal responsibility (eliminating vague 'we' in favor of specific 'I').\n   - A (Action - 45%): Architectural decisions, tradeoffs weighed, tools chosen, and influence exerted.\n   - R (Result - 20%): Quantified metrics (uptime, latency, cost savings, delivery acceleration) and post-mortem takeaways.\n4. Anti-Patterns & Red Flag Radar: Identify 5 fatal pitfalls (blaming teammates, inability to discuss failure, lack of metrics, superficial technical depth).\n5. Seniority Calibration Guide: Contrast expected answer depth across Mid-Level (L4), Senior (L5), and Staff/Principal (L6+).\n6. Behavioral Interview Scorecard (0-100): Evaluated across Ownership /20, Dive Deep /20, Deliver Results /20, Earn Trust & Conflict Resolution /20, Self-awareness & Growth /20."`
- **`required_inputs`**: `["cv_abstraction"]`
- **`output_format`**: `"Structured Behavioral & Leadership Prep Report (Story Mapping, 4 STAR Detailed Blueprints, Anti-Pattern Radar, Seniority Calibration, and 0-100 Rubric)"`
- **`target_output`**: `"Master Guide for Tech Behavioral & Leadership Interviews"`

---

### 5.4 Prompt 4: `career_upskilling_roadmap`

#### Spanish Specification (`es`)
- **`id`**: `"career_upskilling_roadmap"`
- **`name`**: `"Hoja de Ruta de Upskilling y Recursos Externos Recomendados"`
- **`category`**: `"career_growth"`
- **`description`**: `"Diagnóstico de brechas técnicas frente a estándares Senior/Staff y plan estructurado de 30/60/90 días con libros de élite (DDIA), repositorios open source clave, papers y laboratorios prácticos."`
- **`system_instruction`**: `"Eres un Principal Engineering Career Mentor y Staff+ Talent Architect. Tu función es auditar con ojo crítico el perfil técnico del candidato, diagnosticar brechas frente al mercado internacional de ingenieros Senior/Staff y diseñar un plan de desarrollo profesional implacable y medible a 30, 60 y 90 días, respaldado por la literatura técnica más rigurosa de la industria."`
- **`task`**: `"1. Diagnóstico de Brechas Técnicas (Gap Analysis): Compara el stack y experiencia del CV contra las expectativas de un Senior / Staff Engineer en compañías globales. Detecta carencias en sistemas distribuidos, observabilidad avanzada, patrones de resiliencia, concurrencia de bajo nivel y arquitectura de datos.\n2. Matriz de Competencias en 5 Pilares: Evalúa de 0 a 100 y clasifica en Dominado, En Desarrollo o Brecha Crítica: (a) Diseño de Sistemas Distribuidos, (b) Internals de Bases de Datos & Almacenamiento, (c) Resiliencia en Nube & Observabilidad, (d) Excelencia en Código & Testing, (e) Liderazgo Técnico & RFCs.\n3. Plan de Acción de 30 / 60 / 90 Días con Entregables Verificables:\n   - Días 1-30 (Fundamentos & Profundidad): Estudio de internals del stack actual, optimización de queries, concurrencia. Entregable: Benchmark documentado o lab práctico.\n   - Días 31-60 (Sistemas Distribuidos & Resiliencia): Event-driven architecture, mensajería, caching avanzado y pruebas de caos. Entregable: Prototipo funcional distribuido.\n   - Días 61-90 (Liderazgo & Open Source): Contribución a repositorios open source clave, redacción de RFC técnico y publicación de artículo de profundidad.\n4. Biblioteca Curada de Recursos de Élite:\n   - Libros Fundamentales: 'Designing Data-Intensive Applications' (Martin Kleppmann), 'Database Internals' (Alex Petrov), 'System Design Interview' (Alex Xu).\n   - Papers Clásicos de CS: Spanner (Google), Dynamo (Amazon), Raft Consensus, MapReduce.\n   - Repositorios Open Source para Inspeccionar y Contribuir: Proyectos de producción relevantes en su stack.\n5. Scorecard de Madurez Técnica (0-100): Puntuación actual y proyectada a 90 días con justificación detallada."`
- **`required_inputs`**: `["cv_abstraction"]`
- **`output_format`**: `"Structured Upskilling Blueprint (Gap Analysis, 5-Pillar Competency Matrix, 30/60/90 Day Plan, Curated Elite Resources List, and 0-100 Maturity Scorecard)"`
- **`target_output`**: `"Plan Maestro de Upskilling Técnico y Recursos de Élite"`

#### English Specification (`en`)
- **`id`**: `"career_upskilling_roadmap"`
- **`name`**: `"Elite Career Upskilling Roadmap & Curated Resources"`
- **`category`**: `"career_growth"`
- **`description`**: `"Technical gap diagnosis against Senior/Staff market benchmarks with a structured 30/60/90-day plan featuring elite books (DDIA), key OSS repos, papers, and labs."`
- **`system_instruction`**: `"You are a Principal Engineering Career Mentor and Staff+ Talent Architect. Your objective is to rigorously audit the candidate's CV against top-tier Senior and Staff engineer market benchmarks, diagnosing technical blind spots and building an uncompromising, measurable 30/60/90-day execution roadmap backed by industry-standard literature and production codebases."`
- **`task`**: `"1. Technical Gap Diagnostic: Contrast CV stack and accomplishments against Senior/Staff expectations at premier tech firms. Expose vulnerabilities in distributed systems, advanced observability, concurrency primitives, and data architecture.\n2. 5-Pillar Competency Matrix: Score (0-100) and categorize as Mastered, Developing, or Critical Gap across: (a) Distributed System Architecture, (b) Database Internals & Storage Engines, (c) Cloud Reliability & Observability, (d) Testing & Code Excellence, (e) Technical Influence & Architecture RFCs.\n3. Structured 30/60/90-Day Execution Roadmap with Verifiable Milestones:\n   - Days 1-30 (Core Internals & Optimization): Deep dive into memory models, query optimization, and concurrency. Deliverable: Documented benchmark or practical lab.\n   - Days 31-60 (Distributed Resilience & Events): Event-driven architectures, distributed transactions, and chaos testing. Deliverable: Working distributed prototype.\n   - Days 61-90 (Staff-Level Proof-of-Work): Contributions to landmark open-source repositories, architectural RFC drafting, and technical blog writing.\n4. Curated Elite Resource Library:\n   - Canonical Books: 'Designing Data-Intensive Applications' (Kleppmann), 'Database Internals' (Petrov), 'Site Reliability Engineering' (Google).\n   - Seminal CS Papers: Google Spanner, Amazon Dynamo, Raft Consensus, Kafka Log Architecture.\n   - Target Open Source Repositories: Top production repositories to inspect and contribute to in candidate's stack.\n5. Technical Progression Scorecard (0-100): Current baseline vs 90-day projected score with detailed rationale."`
- **`required_inputs`**: `["cv_abstraction"]`
- **`output_format`**: `"Structured Upskilling Blueprint (Gap Analysis, 5-Pillar Competency Matrix, 30/60/90 Day Plan, Curated Elite Resources List, and 0-100 Maturity Scorecard)"`
- **`target_output`**: `"Master Technical Upskilling Roadmap & Elite Resources"`

---

### 5.5 Prompt 5: `cold_outreach_generator`

#### Spanish Specification (`es`)
- **`id`**: `"cold_outreach_generator"`
- **`name`**: `"Playbook de Contacto Directo y Networking Tech"`
- **`category`**: `"networking"`
- **`description`**: `"Mensajes de alto impacto y ultra-personalizados para contactar a Engineering Managers, Tech Leads y Recruiters en LinkedIn o email basándose en tus logros del CV sin sonar genérico."`
- **`system_instruction`**: `"Eres un Consultor de Executive Search y Estratega de Networking en la industria del software. Tu especialidad es transformar los mayores logros técnicos del CV en mensajes de contacto directo de altísima tasa de respuesta (>50%). Rechazas plantillas genéricas o de adulación vacía; formulas ganchos de valor concreto, brevedad quirúrgica y llamadas a la acción de baja fricción."`
- **`task`**: `"1. Extracción de Ganchos de Valor del CV: Extrae los 3 logros o métricas más impactantes del CV del candidato (optimizaciones de rendimiento, resoluciones de fallas críticas, modernizaciones de arquitectura).\n2. 3 Vectores de Contacto Especializados:\n   - Vector 1: Engineering Manager / VP of Engineering (Enfoque: resolución de problemas de escalabilidad, confiabilidad de sistemas, capacidad de entrega y velocidad de equipo).\n   - Vector 2: Senior Technical Recruiter / Talent Lead (Enfoque: coincidencia exacta con posiciones activas, disponibilidad, resumen de stack y logros en viñetas de 1 línea).\n   - Vector 3: Peer Técnico / Tech Lead (Enfoque entre colegas: interés genuino en su arquitectura, discusión técnica sin pedir empleo de inmediato, networking genuino).\n3. Variantes de Mensaje por Canal para Cada Vector:\n   - Nota de Conexión de LinkedIn: Estrictamente menor a 300 caracteres, con gancho directo y sin rodeos.\n   - InMail / Correo Electrónico Completo: Menor a 150 palabras, con línea de asunto irresistible (>65% apertura esperada), 2 viñetas de logros cuantificados y llamada a la acción de baja fricción (ej. '¿Tendrías 10 minutos para un café virtual?').\n   - Secuencia de Seguimiento (Follow-up): Mensaje breve a enviar a los 5 días aportando un nuevo dato técnico de valor.\n4. Arsenal de Líneas de Asunto de Alta Conversión: 5 asuntos probados para correo.\n5. Lista de Errores Fatales en Prospección: 5 errores que provocan archivado o bloqueo inmediato (ej. pedir trabajo en la primera línea, copiar la descripción del puesto, enviar CV sin saludar).\n6. Scorecard de Efectividad del Mensaje (0-100): Puntuación en Personalización /25, Claridad & Brevedad /25, Fuerza del Gancho de Valor /25, Fricción del CTA /25."`
- **`required_inputs`**: `["cv_abstraction"]`
- **`output_format`**: `"Structured Tech Outreach Playbook (Value Hooks, 3 Target Vectors with Multi-Channel Templates, Follow-Up Sequences, Subject Line Arsenal, and 0-100 Scorecard)"`
- **`target_output`**: `"Playbook de Contacto Directo y Networking para Tech"`

#### English Specification (`en`)
- **`id`**: `"cold_outreach_generator"`
- **`name`**: `"Tech Cold Outreach & Networking Playbook"`
- **`category`**: `"networking"`
- **`description`**: `"High-impact, hyper-personalized outreach messages for contacting Engineering Managers, Tech Leads, and Recruiters on LinkedIn or email based on your CV achievements without sounding generic."`
- **`system_instruction`**: `"You are a Silicon Valley Executive Search Consultant and Tech Networking Strategist. Your specialty is converting a software engineer's most impressive CV achievements into high-conversion cold outreach messages (>50% response rate). You strictly prohibit generic copy-paste templates and sycophantic flattery; you craft hyper-personalized value propositions with extreme brevity and low-friction calls to action."`
- **`task`**: `"1. CV Value Hook Extraction: Extract the 3 most compelling quantifiable accomplishments from the candidate's CV (e.g. latency reductions, cost cuts, database modernizations).\n2. 3 Distinct Outreach Vectors:\n   - Vector 1: Engineering Manager / VP of Engineering (Focus: solving system bottlenecks, reliability, team delivery velocity).\n   - Vector 2: Senior Technical Recruiter / Talent Acquisition (Focus: hard skills match, immediate availability, high-signal 1-line bullet points).\n   - Vector 3: Peer Tech Lead / Senior Engineer (Focus: peer-to-peer technical curiosity, stack discussion, zero initial begging).\n3. Multi-Channel Formats for Each Vector:\n   - LinkedIn Connection Request Note: Strictly under 300 characters, high-signal hook.\n   - Direct InMail / Cold Email: Under 150 words, compelling subject line (>65% expected open rate), 2 bullet points of proof, and low-friction call to action.\n   - 5-Day Follow-Up Message: Value-add nudge referencing an interesting architectural insight or article.\n4. High-Conversion Subject Line Arsenal: 5 tested email subject lines.\n5. Critical Outreach Red Flags & Anti-Patterns: 5 fatal blunders that trigger instant spam flags or unsubscriptions.\n6. Message Conversion Scorecard (0-100): Evaluated across Personalization /25, Brevity & Signal /25, Value Hook Strength /25, CTA Friction /25."`
- **`required_inputs`**: `["cv_abstraction"]`
- **`output_format`**: `"Structured Tech Outreach Playbook (Value Hooks, 3 Target Vectors with Multi-Channel Templates, Follow-Up Sequences, Subject Line Arsenal, and 0-100 Scorecard)"`
- **`target_output`**: `"Tech Cold Outreach & Networking Playbook"`

---

### 5.6 Prompt 6: `salary_negotiation_advisor`

#### Spanish Specification (`es`)
- **`id`**: `"salary_negotiation_advisor"`
- **`name`**: `"Estrategia y Negociación de Ofertas Salariales Tech"`
- **`category`**: `"career_growth"`
- **`description`**: `"Análisis de bandas salariales según stack y seniority, argumentos de valor fundamentados en el CV, guiones palabra por palabra para llamadas salariales y manejo de contraofertas."`
- **`system_instruction`**: `"Eres un Negociador Ejecutivo de Compensación Tecnológica y Coach Salarial para ingenieros de software. Ayudas a los candidatos a maximizar su compensación total (Base, Bonus, Equity/RSUs, Beneficios) basándose en el valor medible de su CV y dinámicas de mercado. Proporcionas guiones exactos palabra por palabra para desactivar el anclaje salarial del reclutador, presentar contraofertas convincentes y apalancar ofertas competitivas con diplomacia y firmeza."`
- **`task`**: `"1. Benchmark de Compensación de Mercado: Estima las bandas salariales de mercado según el stack y seniority inferidos del CV para mercados relevantes (US Remote, LatAm USD, Europa y Mercado Local) en los percentiles P25, P50, P75 y P90.\n2. Matriz de Palancas de Valor del CV: Vincula logros cuantificados específicos del CV (ej. reducción de costos en la nube, incremento de performance, liderazgo de equipos) con justificaciones comerciales que sitúan al candidato en el percentil P75-P90.\n3. Guiones de Conversación Palabra por Palabra:\n   - Guión A: Primera Llamada con el Reclutador (Desactivación del anclaje temprano: '¿Cuáles son tus pretensiones salariales?').\n   - Guión B: Entrega de la Contraoferta Verbal tras recibir la primera oferta formal.\n   - Guión C: Apalancamiento de Ofertas Competidoras concurrentes con elegancia y sin ultimátums agresivos.\n4. Menú Holístico de Compensación Total (Más Allá del Salario Base): Estrategias para negociar Bono de Firma (Sign-on Bonus), Equity / Opciones sobre Acciones / RSUs, Bono Anual por Rendimiento, Presupuesto Educativo / Conferencias, Días de Vacaciones Adicionales (PTO) y Cláusula de Revisión Salarial a los 6 meses.\n5. Árbol de Decisión para Contraofertas de la Empresa Actual: Cómo evaluar y cuándo rechazar una contraoferta del empleador actual (riesgos de despido diferido y estancamiento).\n6. Trampas Críticas y Líneas Rojas: 5 errores graves en negociación salarial.\n7. Scorecard de Poder de Negociación del Candidato (0-100): Puntuación en Raridad del Stack /25, Fuerza de Logros del CV /25, Apalancamiento de Mercado /25, Preparación de Guiones /25."`
- **`required_inputs`**: `["cv_abstraction"]`
- **`output_format`**: `"Structured Salary Negotiation Blueprint (Market Brackets P25-P90, CV Value Leverage Matrix, Word-for-Word Phone Scripts, Total Comp Expansion Menu, and 0-100 Leverage Scorecard)"`
- **`target_output`**: `"Estrategia Maestra de Negociación Salarial Tech"`

#### English Specification (`en`)
- **`id`**: `"salary_negotiation_advisor"`
- **`name`**: `"Tech Salary & Offer Negotiation Advisor"`
- **`category`**: `"career_growth"`
- **`description`**: `"Compensation band analysis by stack and seniority, value-based arguments grounded in CV metrics, word-for-word scripts for salary calls, and counter-offer management."`
- **`system_instruction`**: `"You are an Executive Tech Compensation Negotiator and Career Strategist. You empower software engineering candidates to maximize their Total Compensation (Base Salary, Performance Bonus, Equity/RSUs, Sign-on, Benefits) based on verifiable CV metrics and talent market supply/demand dynamics. You provide word-for-word scripts to deflect early salary anchors, negotiate initial offers upward, and leverage competing offers with diplomatic leverage."`
- **`task`**: `"1. Market Compensation Benchmark: Estimate compensation bands for candidate's stack and seniority across relevant markets (US Remote, Global Contractor USD, Western Europe, Local) across P25, P50, P75, and P90 percentiles.\n2. CV Value Leverage Matrix: Connect specific CV achievements (cloud cost reductions, latency optimizations, team leadership) directly to business value arguments that justify top-quartile (P75-P90) compensation.\n3. Word-for-Word Conversation Scripts:\n   - Script A: First Recruiter Call (Deflecting the early salary expectation question without giving a number).\n   - Script B: Verbal Counter-Offer Pitch upon receiving the formal initial offer.\n   - Script C: Leveraging Competing Offers with poise and professional urgency.\n4. Total Compensation Expansion Menu: Practical levers to negotiate beyond base salary (Sign-on bonus, equity acceleration, performance bonus multipliers, educational stipend, remote workspace budget, 6-month performance review clause).\n5. Current Employer Counter-Offer Decision Tree: Objective framework for evaluating counter-offers from current employers and managing retention risks.\n6. Critical Negotiation Red Flags: 5 costly negotiation blunders (accepting immediately, bluffing non-existent offers, aggressive ultimatums, neglecting total compensation).\n7. Candidate Negotiation Leverage Scorecard (0-100): Breakdown for Stack Scarcity /25, CV Achievement Impact /25, Market Alternatives /25, Script Preparation /25."`
- **`required_inputs`**: `["cv_abstraction"]`
- **`output_format`**: `"Structured Salary Negotiation Blueprint (Market Brackets P25-P90, CV Value Leverage Matrix, Word-for-Word Phone Scripts, Total Comp Expansion Menu, and 0-100 Leverage Scorecard)"`
- **`target_output`**: `"Master Tech Salary & Total Compensation Negotiation Playbook"`

---

## 6. `buildAIPromptPayload` & `aiExporter.js` Architectural Design

### 6.1 Assembly Sequence Specification (Requirements R1, R2, R5)
In `src/utils/aiExporter.js`, `buildAIPromptPayload` must assemble the final output payload in a deterministic, cleanly delimited order:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             PAYLOAD STRUCTURE                            │
├──────────────────────────────────────────────────────────────────────────┤
│ 1. Header Delimiter: "---"                                               │
│ 2. System Role:      "role: " + promptDef.system_instruction             │
│ 3. Task:             "task: " + promptDef.task                           │
│ 4. Output Format:    "output_format: " + promptDef.output_format         │
│ 5. User Commentary:  "user_commentary: " + options.userCommentary.trim() │
│                      (ONLY if userCommentary is present and non-empty)   │
│ 6. Job Description:  "job_description: " + options.jobDescription.trim() │
│                      (ONLY if jobDescription is present and non-empty)   │
│ 7. Separator:        "---"                                               │
│ 8. CV Input Header:  "# DATOS DE ENTRADA DEL CURRÍCULUM VITAE (<FMT>)"   │
│ 9. CV Data Block:    exportToAIMarkdown(cvData)                          │
│ 10. Native JSON Block: (SPECIAL: Injected ONLY when promptId is           │
│                        'translate_english')                              │
└──────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Proposed Code Implementation for `buildAIPromptPayload`

```javascript
/**
 * Compact cvData Schema Reference Skeleton (for translate_english prompt)
 */
const CVDATA_SCHEMA_REFERENCE = JSON.stringify({
  layout: {
    type: "1-column", // or "2-column"
    isAtsMode: true,
    fontFamily: "Poppins",
    fontScale: 1.0,
    titleScale: 1.0,
    bodyScale: 1.0,
    listScale: 1.0,
    lineHeight: 1.45,
    pagePadding: 24,
    sectionGap: 20,
    itemGap: 8
  },
  profile: {
    name: "Full Name"
  },
  sections: [
    {
      id: "profile_header",
      column: "left",
      type: "profile_header",
      title: "",
      items: [
        {
          id: "prof1",
          name: "Full Name",
          subtitle: "Job Title",
          location: "City, Country",
          email: "email@example.com",
          phone: "+1 234 567 890",
          linkedin: "linkedin.com/in/username",
          github: "github.com/username",
          contacts: [
            { id: "c1", type: "location", value: "City, Country" },
            { id: "c2", type: "email", value: "email@example.com" }
          ]
        }
      ]
    },
    {
      id: "about_section",
      column: "left",
      type: "about",
      title: "PROFESSIONAL SUMMARY",
      items: [
        { id: "about1", description: "Summary text..." }
      ]
    },
    {
      id: "skills",
      column: "left",
      type: "skills",
      title: "TECHNICAL SKILLS",
      items: [
        { id: "skill1", title: "Category", description: "Tech 1, Tech 2" }
      ]
    },
    {
      id: "experience",
      column: "right",
      type: "list",
      title: "WORK EXPERIENCE",
      items: [
        {
          id: "exp1",
          title: "Position",
          subtitle: "Company | Location",
          date: "Dates",
          bullets: ["Accomplishment 1", "Accomplishment 2"]
        }
      ]
    },
    {
      id: "education",
      column: "left",
      type: "education",
      title: "EDUCATION",
      items: [
        { id: "edu1", title: "Degree", subtitle: "Institution", date: "Year" }
      ]
    }
  ]
}, null, 2);

export const buildAIPromptPayload = (cvData, promptId = 'recruiter_audit', options = {}) => {
  const { 
    format = 'markdown', 
    jobDescription = '', 
    userCommentary = '', 
    lang = 'es' 
  } = options;

  const localizedPrompts = getPrompts(lang);
  const promptDef = localizedPrompts.find(p => p.id === promptId) || localizedPrompts[0];

  let cvFormatted = '';
  if (format === 'markdown') {
    cvFormatted = exportToAIMarkdown(cvData);
  } else if (format === 'xml') {
    cvFormatted = exportToAIXML(cvData);
  } else if (format === 'ats_text') {
    cvFormatted = exportToATSPlainText(cvData);
  } else {
    cvFormatted = JSON.stringify(cvData, null, 2);
  }

  const payload = [];
  payload.push('---');
  payload.push('role: ' + (promptDef.system_instruction || ''));
  payload.push('');
  payload.push('task: ' + (promptDef.task || ''));
  payload.push('');
  payload.push('output_format: ' + (promptDef.output_format || ''));
  payload.push('');

  // 1. User Commentary (Clean conditional inclusion)
  if (userCommentary && typeof userCommentary === 'string' && userCommentary.trim().length > 0) {
    payload.push('user_commentary: ' + userCommentary.trim());
    payload.push('');
  }

  // 2. Job Description (Clean conditional inclusion)
  if (jobDescription && typeof jobDescription === 'string' && jobDescription.trim().length > 0) {
    payload.push('job_description: ' + jobDescription.trim());
    payload.push('');
  }

  payload.push('---');
  payload.push(`# DATOS DE ENTRADA DEL CURRÍCULUM VITAE (${format.toUpperCase()})`);
  payload.push('A continuación se presenta el currículum del candidato estructurado en formato Markdown con su propio Frontmatter de metadatos. Analiza únicamente la información contenida dentro del siguiente bloque:');
  payload.push(cvFormatted);

  // 3. Special Injection for Translation & Localization Prompt
  if (promptId === 'translate_english') {
    payload.push('');
    payload.push('---');
    payload.push('# ESQUEMA JSON NATIVO DE CVDATA (SCHEMA DE REFERENCIA PARA LA SALIDA)');
    payload.push('IMPORTANTE: Para el prompt de traducción y localización, el bloque JSON de salida debe coincidir exactamente con el siguiente schema canónico de Ressume para permitir su importación directa en el Gestor de Versiones:');
    payload.push('```json');
    payload.push(CVDATA_SCHEMA_REFERENCE);
    payload.push('```');
  }

  return payload.join('\n');
};
```

### 6.3 Frontmatter YAML Enrichment in `exportToAIMarkdown` (Requirement R2)
In `exportToAIMarkdown(cvData)`:
```javascript
export const exportToAIMarkdown = (cvData) => {
  if (!cvData) return '';

  const layout = cvData.layout || {
    type: '1-column',
    isAtsMode: true,
    pagePadding: 24,
    sectionGap: 20,
    itemGap: 8,
    fontFamily: 'Poppins',
    fontScale: 1.0,
    titleScale: 1.0,
    bodyScale: 1.0,
    listScale: 1.0,
    lineHeight: 1.45,
    leftBg: '',
    rightBg: '',
    leftColumnWidth: null
  };
  const is1Col = layout.type === '1-column';

  const profileSection = cvData.sections?.find(s => s.type === 'profile_header');
  const profileItem = profileSection?.items?.[0] || {};
  const aboutSection = cvData.sections?.find(s => s.type === 'about');
  const aboutItem = aboutSection?.items?.[0] || {};

  const lines = [];

  // YAML Frontmatter (Exhaustive Visual & Structural State)
  lines.push('```markdown');
  lines.push('---');
  lines.push(`layout_type: "${layout.type || (is1Col ? '1-column' : '2-column')}"`);
  lines.push(`is_ats_mode: ${Boolean(layout.isAtsMode)}`);
  lines.push(`page_padding: ${layout.pagePadding ?? 24}`);
  lines.push(`section_gap: ${layout.sectionGap ?? 20}`);
  lines.push(`item_gap: ${layout.itemGap ?? 8}`);
  lines.push(`font_family: "${layout.fontFamily || 'Poppins'}"`);
  lines.push(`font_scale: ${layout.fontScale ?? 1.0}`);
  lines.push(`title_scale: ${layout.titleScale ?? 1.0}`);
  lines.push(`body_scale: ${layout.bodyScale ?? 1.0}`);
  lines.push(`list_scale: ${layout.listScale ?? 1.0}`);
  lines.push(`line_height: ${layout.lineHeight ?? 1.45}`);

  if (is1Col) {
    lines.push('target_audience: "ATS Parsers (Workday, Taleo, Greenhouse, Lever) & Technical Recruiters"');
    lines.push('reading_flow: "strictly linear top-to-bottom"');
    lines.push('section_order:');
    CANONICAL_ATS_ORDER.forEach(secId => {
      const sec = cvData.sections?.find(s => s.id === secId || s.type === secId);
      if (sec) {
        lines.push(`  - id: "${sec.id}"`);
        lines.push(`    title: "${sec.title || sec.id}"`);
      }
    });
  } else {
    lines.push('target_audience: "Human Hiring Managers & Portfolio Visual Review"');
    lines.push('reading_flow: "two-column visual hierarchy"');
    lines.push('visual_theme:');
    lines.push(`  left_sidebar_color: "${layout.leftBg || 'default'}"`);
    lines.push(`  right_main_color: "${layout.rightBg || 'default'}"`);
    lines.push(`  left_column_width: ${layout.leftColumnWidth ?? 33}`);
    lines.push('  sidebar_sections:');
    (cvData.sections || []).filter(s => s.column === 'left' && s.type !== 'profile_header').forEach(sec => {
      lines.push(`    - id: "${sec.id}"`);
      lines.push(`      title: "${sec.title || sec.id}"`);
    });
    lines.push('  main_content_sections:');
    (cvData.sections || []).filter(s => s.column === 'right').forEach(sec => {
      lines.push(`    - id: "${sec.id}"`);
      lines.push(`      title: "${sec.title || sec.id}"`);
    });
  }

  lines.push('candidate_profile:');
  lines.push(`  name: "${profileItem.name || cvData.profile?.name || ''}"`);
  lines.push(`  headline: "${profileItem.subtitle || ''}"`);
  lines.push(`  location: "${profileItem.location || ''}"`);
  lines.push('  contact:');
  lines.push(`    email: "${profileItem.email || ''}"`);
  lines.push(`    phone: "${profileItem.phone || ''}"`);
  lines.push(`    linkedin: "https://${(profileItem.linkedin || '').replace(/^https?:\/\//, '')}"`);
  lines.push(`    github: "https://${(profileItem.github || '').replace(/^https?:\/\//, '')}"`);
  lines.push('---');
  ...
```

---

## 7. Vitest Test Suite Analysis & Test Implementation Blueprint

### 7.1 Baseline Test Environment
- **Vitest**: `^1.3.1` with `jsdom` environment.
- **Current Total Tests**: 727 tests across 42 test files.
- **Current Coverage for AI Subsystem**: **0 tests** for `aiExporter.js`, 0 tests for `src/locales/es/prompts.json`, 0 tests for `src/locales/en/prompts.json`, 0 tests for `src/ai-knowledge/prompts.json`.

### 7.2 Proposed Automated Test Suite: `src/tests/ai-prompts-and-exporter.test.js`
A dedicated test suite should be added to `src/tests/ai-prompts-and-exporter.test.js` covering the following test suites:

#### Suite 1: Prompt Catalogs Integrity & Bilingual Parity
```javascript
describe('Suite 1: Prompt Catalogs Integrity & Bilingual Parity', () => {
  it('T1.1: all 3 catalog files exist and contain exactly 12 prompts', () => {
    expect(esPrompts.length).toBe(12);
    expect(enPrompts.length).toBe(12);
    expect(aiKnowledgePrompts.length).toBe(12);
  });

  it('T1.2: exact 1:1 ID parity across ES, EN, and ai-knowledge catalogs', () => {
    const esIds = esPrompts.map(p => p.id).sort();
    const enIds = enPrompts.map(p => p.id).sort();
    const aiIds = aiKnowledgePrompts.map(p => p.id).sort();
    expect(esIds).toEqual(enIds);
    expect(esIds).toEqual(aiIds);
  });

  it('T1.3: every prompt has non-empty required fields and non-empty output_format', () => {
    [esPrompts, enPrompts, aiKnowledgePrompts].forEach(catalog => {
      catalog.forEach(p => {
        expect(p.id).toBeTruthy();
        expect(p.name).toBeTruthy();
        expect(p.category).toBeTruthy();
        expect(p.description).toBeTruthy();
        expect(p.system_instruction).toBeTruthy();
        expect(p.task).toBeTruthy();
        expect(p.output_format).toBeDefined();
        expect(typeof p.output_format).toBe('string');
        expect(p.output_format.trim().length).toBeGreaterThan(10);
        expect(p.target_output).toBeTruthy();
      });
    });
  });

  it('T1.4: 6 new specialized tech prompts exist with valid categories', () => {
    const newPromptIds = [
      'system_design_simulator',
      'live_coding_coach',
      'behavioral_leadership_prep',
      'career_upskilling_roadmap',
      'cold_outreach_generator',
      'salary_negotiation_advisor'
    ];
    newPromptIds.forEach(id => {
      const foundEs = esPrompts.find(p => p.id === id);
      const foundEn = enPrompts.find(p => p.id === id);
      expect(foundEs).toBeDefined();
      expect(foundEn).toBeDefined();
      expect(['interview_prep', 'career_growth', 'networking']).toContain(foundEs.category);
    });
  });
});
```

#### Suite 2: `buildAIPromptPayload` Assembly, Ordering & Commentary
```javascript
describe('Suite 2: buildAIPromptPayload Assembly Order & Conditionals', () => {
  const mockCvData = {
    layout: { type: '1-column', isAtsMode: true, pagePadding: 24 },
    profile: { name: 'Ada Lovelace' },
    sections: [
      {
        id: 'profile_header',
        type: 'profile_header',
        items: [{ name: 'Ada Lovelace', subtitle: 'Software Pioneer' }]
      }
    ]
  };

  it('T2.1: strictly adheres to assembly sequence: role, task, output_format', () => {
    const payload = buildAIPromptPayload(mockCvData, 'recruiter_audit');
    const roleIdx = payload.indexOf('role:');
    const taskIdx = payload.indexOf('task:');
    const outFmtIdx = payload.indexOf('output_format:');
    const cvDataIdx = payload.indexOf('# DATOS DE ENTRADA DEL CURRÍCULUM VITAE');

    expect(roleIdx).toBeGreaterThan(-1);
    expect(taskIdx).toBeGreaterThan(roleIdx);
    expect(outFmtIdx).toBeGreaterThan(taskIdx);
    expect(cvDataIdx).toBeGreaterThan(outFmtIdx);
  });

  it('T2.2: includes user_commentary when provided and omits when empty', () => {
    const withComment = buildAIPromptPayload(mockCvData, 'recruiter_audit', {
      userCommentary: 'Focus specifically on my cloud architecture experience.'
    });
    expect(withComment).toContain('user_commentary: Focus specifically on my cloud architecture experience.');

    const emptyComment = buildAIPromptPayload(mockCvData, 'recruiter_audit', {
      userCommentary: '   '
    });
    expect(emptyComment).not.toContain('user_commentary:');

    const omittedComment = buildAIPromptPayload(mockCvData, 'recruiter_audit');
    expect(omittedComment).not.toContain('user_commentary:');
  });

  it('T2.3: includes job_description when provided and omits when empty', () => {
    const withJD = buildAIPromptPayload(mockCvData, 'job_matcher', {
      jobDescription: 'Senior Backend Engineer with Golang & PostgreSQL experience.'
    });
    expect(withJD).toContain('job_description: Senior Backend Engineer with Golang & PostgreSQL experience.');

    const emptyJD = buildAIPromptPayload(mockCvData, 'job_matcher', {
      jobDescription: ''
    });
    expect(emptyJD).not.toContain('job_description:');
  });

  it('T2.4: injects native cvData schema block specifically for translate_english', () => {
    const transPayload = buildAIPromptPayload(mockCvData, 'translate_english');
    expect(transPayload).toContain('# ESQUEMA JSON NATIVO DE CVDATA');
    expect(transPayload).toContain('"layout"');
    expect(transPayload).toContain('"sections"');

    const auditPayload = buildAIPromptPayload(mockCvData, 'recruiter_audit');
    expect(auditPayload).not.toContain('# ESQUEMA JSON NATIVO DE CVDATA');
  });
});
```

#### Suite 3: `exportToAIMarkdown` Frontmatter & Content Fidelity
```javascript
describe('Suite 3: exportToAIMarkdown Frontmatter & Content Fidelity', () => {
  it('T3.1: YAML Frontmatter includes visual and spacing metadata', () => {
    const fullCv = {
      layout: {
        type: '2-column',
        isAtsMode: false,
        pagePadding: 28,
        sectionGap: 22,
        itemGap: 10,
        fontFamily: 'Inter',
        fontScale: 1.05,
        titleScale: 1.1,
        bodyScale: 0.95,
        listScale: 0.95,
        lineHeight: 1.5,
        leftBg: '#1e293b',
        rightBg: '#ffffff',
        leftColumnWidth: 35
      },
      profile: { name: 'Grace Hopper' },
      sections: [
        {
          id: 'profile_header',
          type: 'profile_header',
          items: [{ name: 'Grace Hopper', subtitle: 'Rear Admiral & Systems Architect' }]
        },
        {
          id: 'experience',
          column: 'right',
          type: 'list',
          title: 'EXPERIENCIA',
          items: [{ title: 'Director', subtitle: 'US Navy', date: '1944-1986' }]
        }
      ]
    };

    const md = exportToAIMarkdown(fullCv);
    expect(md).toContain('layout_type: "2-column"');
    expect(md).toContain('page_padding: 28');
    expect(md).toContain('section_gap: 22');
    expect(md).toContain('item_gap: 10');
    expect(md).toContain('font_family: "Inter"');
    expect(md).toContain('font_scale: 1.05');
    expect(md).toContain('Grace Hopper');
    expect(md).toContain('US Navy');
  });
});
```

#### Suite 4: Translation Output Importability & `versionValidator` Compatibility
```javascript
describe('Suite 4: Translation Output Compatibility with versionValidator', () => {
  it('T4.1: simulated JSON translation output parses and passes sanitizeAndValidateCVSnapshot', () => {
    const simulatedTranslationJSON = {
      layout: {
        type: '1-column',
        isAtsMode: true,
        pagePadding: 24,
        sectionGap: 20,
        itemGap: 8,
        fontFamily: 'Poppins'
      },
      profile: { name: 'Linus Torvalds' },
      sections: [
        {
          id: 'profile_header',
          column: 'left',
          type: 'profile_header',
          title: '',
          items: [{
            id: 'prof1',
            name: 'Linus Torvalds',
            subtitle: 'Principal Kernel Architect'
          }]
        },
        {
          id: 'experience',
          column: 'left',
          type: 'list',
          title: 'WORK EXPERIENCE',
          items: [{
            id: 'exp1',
            title: 'Creator & Lead Architect',
            subtitle: 'Linux Foundation',
            date: '1991 – Present',
            bullets: [
              'Architected the Linux kernel operating system running across billions of devices.'
            ]
          }]
        }
      ]
    };

    const sanitized = sanitizeAndValidateCVSnapshot(simulatedTranslationJSON);
    expect(sanitized.profile.name).toBe('Linus Torvalds');
    expect(sanitized.layout.type).toBe('1-column');
    expect(sanitized.sections.length).toBeGreaterThanOrEqual(2);
    expect(sanitized.sections.find(s => s.id === 'experience').title).toBe('WORK EXPERIENCE');
  });
});
```

---

## 8. Summary of Architectural Recommendations

1. **Synchronize All 3 Prompt Files**:
   Update `src/locales/es/prompts.json`, `src/locales/en/prompts.json`, and `src/ai-knowledge/prompts.json` in lockstep so that:
   - All 12 prompt IDs match 100%.
   - Every prompt has an explicit, non-empty `output_format`.
   - The 6 new tech career prompts are fully available in both English and Spanish.
2. **Refactor `buildAIPromptPayload`**:
   - Assemble `role`, `task`, `output_format`, conditional `user_commentary`, conditional `job_description`, and formatted CV data.
   - Automatically inject the compact native `cvData` schema block when `translate_english` is selected.
3. **Enrich Frontmatter in `exportToAIMarkdown`**:
   - Expose the complete visual layout state (`layout_type`, `is_ats_mode`, `page_padding`, `section_gap`, `item_gap`, `font_family`, font scales, container colors, and all contacts) in YAML Frontmatter.
4. **Update `AIExportModal.jsx`**:
   - Dynamically bind to the active layout without offering manual dropdowns.
   - Provide a textarea for `user_commentary` accessible for all prompts.
   - Expose `job_description` exclusively when `selectedPrompt.required_inputs.includes('job_description')`.
5. **Implement Comprehensive Test Suite**:
   - Create `src/tests/ai-prompts-and-exporter.test.js` to ensure 100% test pass rate and prevent regression of prompt schemas or payload formatting.
