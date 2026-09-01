# 🧠 Guía de Abstracción de CV para Inteligencia Artificial y ATS

> **Propósito:** Definir un estándar de representación estática, inequívoca y semántica del Currículum Vitae (CV) que reemplace al formato PDF binario al interactuar con Modelos de Lenguaje (LLMs) y Sistemas de Seguimiento de Candidatos (ATS).

---

## 1. 🎯 Por qué una Abstracción Estática supera al PDF para IA

Los archivos PDF fueron diseñados para la **fidelidad visual de impresión**, no para la interpretabilidad semántica de datos:
- **Problema de columnas:** Los parsers de PDF y OCR leen horizontalmente a través de columnas de texto (`columna izquierda + columna derecha` se mezclan en una sola línea ilegible).
- **Pérdida de jerarquía:** Los estilos visuales (negrita, tamaño de fuente, márgenes) se pierden al extraer texto plano de un PDF.
- **Inconsistencia de caracteres:** Símbolos como viñetas (`•`), guiones largos (`—`) o iconos vectoriales suelen convertirse en caracteres corruptos (`?`, `\uFFFD`).

### La Solución de Esta Abstracción:
1. **Jerarquía Espacial y Estructural Preservada:** Se modela explícitamente la distribución visual (1 columna vs 2 columnas, posición izquierda/derecha, pesos de lectura).
2. **Semántica Unívoca:** Cada entidad (experiencia, fechas, tecnologías, métricas de impacto, rol) posee etiquetas o markdown inequívoco.
3. **Optimización Token-Eficiente:** Formato denso en información útil, sin overhead binario ni ruido de renderizado.

---

## 2. 📐 Formatos Estáticos de Abstracción Soportados

### Formato A: Semantic Markdown con Frontmatter YAML (Recomendado para LLMs)
Combina metadatos de configuración visual y jerárquica en YAML con un cuerpo en Markdown estructurado de alta legibilidad.

```markdown
---
layout_type: "2-column"
visual_theme:
  left_column_color: "#f4f6f8"
  right_column_color: "#ffffff"
  reading_priority: ["profile_header", "about", "experience", "projects", "skills", "education", "certificates", "languages"]
target_candidate:
  full_name: "JUAN IGNACIO CARRIZO"
  primary_role: "Desarrollador Full-Stack | Backend & Bases de Datos"
  seniority_level: "Mid-Senior"
  location: "San Miguel de Tucumán, Argentina"
  contact:
    email: "juanicarrizo97@gmail.com"
    phone: "+54 9 381 6706133"
    linkedin: "linkedin.com/in/juan-ignacio-carrizo-juani981"
    github: "github.com/juani981"
---

# Juan Ignacio Carrizo
**Desarrollador Full-Stack | Backend & Bases de Datos**  
📍 San Miguel de Tucumán, Argentina | ✉️ juanicarrizo97@gmail.com | 📱 +54 9 381 6706133  
🔗 [LinkedIn](https://linkedin.com/in/juan-ignacio-carrizo-juani981) | 🐙 [GitHub](https://github.com/juani981)

---

## 📌 Perfil Profesional [Layout: Left Column | Weight: Primary]
Desarrollador Full-Stack con sólida experiencia en backend (.NET, C#, PHP, Laravel) y gestión avanzada de bases de datos relacionales (Oracle, PostgreSQL, MySQL). Especializado en modernización de sistemas legacy, optimización de consultas SQL/PL-SQL y automatización de flujos de trabajo mediante Docker y pipelines CI/CD con GitHub Actions. Titulado como Programador Universitario y cursando la etapa final de Ingeniería en Informática.

---

## 💼 Experiencia Laboral [Layout: Right Column | Weight: Critical]

### Desarrollador Web Full-Stack (PHP, Laravel, JS)
**Dirección General de Catastro | San Miguel de Tucumán** | `2025 – Actualidad`
- Lidero la modernización y refactorización de sistemas legacy desarrollados en PHP, Laravel, JavaScript y Visual Basic.
- Optimizo el rendimiento de bases de datos relacionales mediante el análisis de planes de ejecución, reestructuración de consultas complejas y diseño de índices.
- Configuro y despliego entornos de desarrollo y testing contenerizados con Docker, automatizando pipelines de CI/CD para integración continua.
- Estandarizo flujos de trabajo en el equipo mediante la redacción de guías técnicas de buenas prácticas en Git, pruebas y control de versiones.

### Pasante de Soporte Técnico (IT)
**Dirección General de Catastro | San Miguel de Tucumán** | `Julio 2023 – Enero 2024`
- Instalación, configuración y mantenimiento de sistemas operativos Windows y aplicaciones institucionales.
- Diagnóstico y reparación de hardware en estaciones de trabajo, impresoras y equipamiento de infraestructura.
- Despliegue y configuración de dispositivos de red local, incluyendo switches, cámaras de seguridad y puntos de acceso (Access Points).

### Técnico en Electrónica y Microelectrónica
**Freelance | Tucumán, Argentina** | `2023 – Actualidad`
- Diagnóstico y reparación a nivel componente (SMD/THT) de equipamiento informático y circuitos electrónicos.
- Administración del flujo de trabajo, gestión de inventario y emisión de presupuestos mediante sistema de tickets.

---

## 🚀 Proyectos Destacados [Layout: Right Column]

### Sitio Dinámico de Creación y Gestión de Encuestas (React, Laravel)
**Proyecto de Graduación — Programador Universitario** | `Octubre 2024`  
🔗 Repo: `github.com/juani981/WebEncuestas-Demo`  
- Lideré el desarrollo Front-End para un sitio web dinámico de creación de encuestas utilizando React, Material UI y Laravel.
- Lideré la gestión Agile del proyecto en ClickUp. Documenté el diseño lógico de la base de datos, diagramas UML, diseño de interfaz con Figma y casos de uso.
- Implementé y mantuve el estándar de los flujos de Git.

---

## 🛠️ Habilidades Técnicas [Layout: Left Column]
- **Lenguajes y Frameworks:** PHP (Laravel), C# (.NET), JavaScript (React, jQuery), Python, HTML5, CSS3, Bootstrap, Material UI.
- **Bases de Datos:** Oracle (PL/SQL, Stored Procedures, Triggers), PostgreSQL, MySQL, SQLite, Optimización de Queries e Índices.
- **DevOps y Herramientas:** Docker, CI/CD (GitHub Actions), Git, GitHub, Bitbucket, Linux, Ansible, Terraform.
- **Metodologías y Gestión:** Scrum, ClickUp, Trello, Figma, Postman.

---

## 🎓 Educación [Layout: Left Column]
- **Ingeniería en Informática (En etapa de tesis final)** | Universidad Nacional de Tucumán (UNT) – FACET | `2023 – Actualidad`
- **Programador Universitario (Graduado)** | Universidad Nacional de Tucumán (UNT) – FACET | `2021 – 2024`

---

## 📜 Certificaciones [Layout: Right Column]
- Diplomatura en Ingeniería de Datos de Alto Rendimiento (CASE & MySQL/Percona) — UNT (2024)
- Fundamentos de IA con IBM Watson Studio — Cisco Networking Academy (2025)
- Introducción al Análisis de Datos con Python (Pandas, NumPy, Seaborn) — Desafío LATAM (2025)
- Introducción a la Ciberseguridad — Cisco Networking Academy (2024)

---

## 🌐 Idiomas [Layout: Left Column]
- **Inglés:** Avanzado (C2 – Certificación EF SET)
- **Español:** Nativo
```

---

### Formato B: Semantic XML con Tags Estructurales (Recomendado para Claude, OpenAI Function Calling y Parsers Automáticos)

```xml
<curriculum_vitae version="2.0">
  <metadata>
    <layout type="2-column" left_bg="#f4f6f8" right_bg="#ffffff" />
    <target_language>es</target_language>
  </metadata>

  <candidate>
    <name>JUAN IGNACIO CARRIZO</name>
    <headline>Desarrollador Full-Stack | Backend &amp; Bases de Datos</headline>
    <location>San Miguel de Tucumán, Argentina</location>
    <contact>
      <email>juanicarrizo97@gmail.com</email>
      <phone>+54 9 381 6706133</phone>
      <linkedin>https://linkedin.com/in/juan-ignacio-carrizo-juani981</linkedin>
      <github>https://github.com/juani981</github>
    </contact>
    <summary>
      Desarrollador Full-Stack con sólida experiencia en backend (.NET, C#, PHP, Laravel) y gestión avanzada de bases de datos relacionales (Oracle, PostgreSQL, MySQL)...
    </summary>
  </candidate>

  <sections>
    <section id="experience" title="EXPERIENCIA LABORAL" column="right" weight="1">
      <entry id="exp1" role="Desarrollador Web Full-Stack (PHP, Laravel, JS)" organization="Dirección General de Catastro" period="2025 – Actualidad" location="San Miguel de Tucumán">
        <achievements>
          <bullet action_verb="Lidero" scope="Modernización de sistemas legacy (PHP, Laravel, JS, VB)">Lidero la modernización y refactorización de sistemas legacy desarrollados en PHP, Laravel, JavaScript y Visual Basic.</bullet>
          <bullet action_verb="Optimizo" scope="Bases de datos relacionales" impact="Mejora en planes de ejecución e índices">Optimizo el rendimiento de bases de datos relacionales mediante el análisis de planes de ejecución, reestructuración de consultas complejas y diseño de índices.</bullet>
          <bullet action_verb="Configuro" scope="Infraestructura Docker y CI/CD">Configuro y despliego entornos de desarrollo y testing contenerizados con Docker, automatizando pipelines de CI/CD para integración continua.</bullet>
        </achievements>
      </entry>
    </section>
  </sections>
</curriculum_vitae>
```

---

## 3. 📚 Biblioteca de Prompts de IA Especializados

Esta biblioteca contiene prompts diseñados específicamente para interactuar con cualquier LLM (GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro / Flash, DeepSeek R1). 

---

### 🟢 Prompt 1: Auditoría ATS Completa y Simulador de Puntuación (Scorecard)

**Objetivo:** Simular un parser ATS estricto (tipo Workday, Taleo, Greenhouse, Lever) y obtener un puntaje 0-100 con desglose de fallos y advertencias.

```text
[SYSTEM_INSTRUCTION]
Eres un Auditor Senior de Sistemas de Seguimiento de Candidatos (ATS) y Reclutador Técnico Principal en empresas Fortune 500. Tu tarea es auditar de manera rigurosa, cuantitativa y objetiva la abstracción semántica de CV proporcionada.

[EVALUATION_CRITERIA]
1. Parseabilidad de encabezados estándar y títulos de secciones (0-20 pts).
2. Densidad y relevancia de Hard Skills vs Soft Skills (0-20 pts).
3. Estructura de viñetas de experiencia laboral: Uso de verbos de acción fuertes y métricas cuantificables (STAR / Google X-Y-Z formula) (0-30 pts).
4. Coherencia cronológica y continuidad de trayectoria (0-15 pts).
5. Contactabilidad y formato de enlaces profesionales (0-15 pts).

[INPUT_CV]
{INSERTAR_ABSTRACCION_CV_MARKDOWN_O_JSON}

[REQUIRED_OUTPUT_FORMAT]
Genera un informe en Markdown estructurado de la siguiente forma:
# 📊 ATS Audit & Parsing Scorecard
- **Puntuación Global ATS:** [X / 100]
- **Veredicto de Filtro:** [Pasa el filtro automático / En riesgo / Rechazado por parser]

### 1. Desglose de Puntuación por Categoría
(Tabla con Categoría, Puntos Obtenidos, Puntos Máximos, Estado)

### 2. Detección de Inconsistencias o Fallos Críticos
- Listado de puntos donde un parser ATS podría confundirse o perder información.

### 3. Recomendaciones de Optimización Inmediata
- Lista numerada de cambios concretos palabra por palabra para subir la puntuación al rango > 95 pts.
```

---

### 🔵 Prompt 2: Alineación y Adaptación a Descripción de Puesto (Job Matcher & Gap Analysis)

**Objetivo:** Comparar el CV contra una oferta laboral real, identificar vacíos de palabras clave (hard/soft skills faltantes) y reescribir viñetas para coincidir con la vacante.

```text
[SYSTEM_INSTRUCTION]
Eres un consultor experto en optimización de CVs para procesos de selección de alta competitividad. Analizarás la abstracción del CV del candidato y la comparará contra la Descripción del Puesto (Job Description).

[INPUT_DATA]
--- DESCRIPCIÓN DEL PUESTO (JOB DESCRIPTION) ---
{INSERTAR_JOB_DESCRIPTION_AQUI}

--- ABSTRACCIÓN DEL CV DEL CANDIDATO ---
{INSERTAR_ABSTRACCION_CV_MARKDOWN_O_JSON}

[TASK]
1. Matriz de Coincidencia de Palabras Clave: Extrae los 15 requisitos clave de la vacante y marca si el candidato los cumple (🟢 Cumple, 🟡 Parcialmente inferido, 🔴 Faltante).
2. Análisis de Brecha (Gap Analysis): Identifica qué tecnologías, metodologías o certificaciones requeridas por el empleo no están explícitas en el CV.
3. Propuesta de Reescritura Adaptada: Reescribe las 3 viñetas de experiencia más relevantes del CV utilizando la terminología exacta de la vacante, sin mentir ni alterar la veracidad de la experiencia real del candidato.
```

---

### 🟣 Prompt 3: Potenciador de Viñetas de Experiencia (Fórmula Google XYZ / Método STAR)

**Objetivo:** Transformar viñetas pasivas o descriptivas en logros de alto impacto con métricas y tecnologías explícitas.

```text
[SYSTEM_INSTRUCTION]
Eres un redactor ejecutivo de currículums de élite. Tu especialidad es transformar responsabilidades pasivas ("hacía tareas de X") en declaraciones de impacto de alto calibre basadas en la Fórmula Google:
"Logré [X], medido por [Y], haciendo [Z]" (Accomplished [X] as measured by [Y], by doing [Z]).

[INPUT_CV]
{INSERTAR_ABSTRACCION_CV_MARKDOWN_O_JSON}

[TASK]
Toma cada una de las viñetas de la sección "Experiencia Laboral" y "Proyectos" del CV, y genera 3 variaciones mejoradas para cada una:
- Variación A (Enfocada en Rendimiento y Métricas Técnicas).
- Variación B (Enfocada en Liderazgo Técnico y Buenas Prácticas).
- Variación C (Enfocada en Impacto de Negocio y Entrega de Valor).

Incluye placeholders `[X% / $Y / Z horas]` donde el candidato deba rellenar números reales de su experiencia.
```

---

### 🟠 Prompt 4: Simulador de Entrevista Técnica y Preguntas de Profundidad (Behavioral & Technical)

**Objetivo:** Actuar como el Hiring Manager o Líder Técnico que entrevistará al candidato basándose exclusivamente en el contenido de su CV.

```text
[SYSTEM_INSTRUCTION]
Eres el Staff Engineer y Director de Tecnología que va a entrevistar al candidato cuyo CV se adjunta. 
Conoces en profundidad las tecnologías que menciona (Laravel, .NET, PostgreSQL, Docker, CI/CD, React).

[INPUT_CV]
{INSERTAR_ABSTRACCION_CV_MARKDOWN_O_JSON}

[TASK]
1. Preguntas de Profundidad Arquitectural (5 preguntas): Basadas en sus proyectos de bases de datos, modernización legacy y Docker. Deben evaluar si el candidato realmente domina lo que escribió.
2. Preguntas de Situación / Behavioral (3 preguntas): Enfocadas en resolución de conflictos técnicos y liderazgo en modernización de sistemas heredados.
3. Lo que un entrevistador buscará en cada respuesta: Para cada pregunta, detalla qué respuestas se consideran "Nivel Junior", "Nivel Semi-Senior" y "Nivel Senior/Excelente".
```

---

### 🟡 Prompt 5: Traducción y Localización Cultural (Español LatAm ➔ Inglés US/Global Tech)

**Objetivo:** Traducir y localizar culturalmente el CV al estándar de la industria tecnológica estadounidense/europea (ajustando títulos académicos y términos laborales).

```text
[SYSTEM_INSTRUCTION]
Eres un traductor profesional y reclutador bilingüe en Silicon Valley especializado en el ecosistema Tech.
Traduce la siguiente abstracción de CV de Español a Inglés estadounidense profesional.

[REGLAS_DE_LOCALIZACION]
1. Títulos académicos argentinos/latinos:
   - "Programador Universitario" ➔ "Associate Degree in Computer Programming / Software Development"
   - "Ingeniería en Informática (En etapa de tesis final)" ➔ "B.S. in Computer Science & Engineering (Final Thesis Stage / Expected [Year])"
2. Terminología de roles:
   - "Soporte Técnico" ➔ "IT Support Specialist" o "Systems Support Specialist"
   - "Desarrollador Web Full-Stack" ➔ "Full-Stack Software Engineer"
3. Tono: Utiliza verbos de acción en tiempo pasado para roles anteriores (e.g., *Architected, Spearheaded, Refactored, Streamlined*) y presente continuo para el rol actual (*Spearhead, Modernize, Optimize*).

[INPUT_CV]
{INSERTAR_ABSTRACCION_CV_MARKDOWN_O_JSON}

[OUTPUT]
Devuelve la abstracción completa en Semantic Markdown en Inglés lista para ser exportada.
```

---

### 🔴 Prompt 6: Ingeniero Inverso de Texto a Esquema JSON del CV

**Objetivo:** Convertir cualquier texto no estructurado (ej. perfil de LinkedIn o texto pegado de un CV antiguo) en el formato JSON nativo de la aplicación.

```text
[SYSTEM_INSTRUCTION]
Eres un motor de extracción de entidades y estructuración de datos. Convierte el texto no estructurado proporcionado en el esquema JSON exacto de la aplicación Ressume.

[TARGET_SCHEMA]
```json
{
  "layout": { "type": "2-column", "leftBg": "", "rightBg": "" },
  "profile": { "name": "..." },
  "sections": [
    {
      "id": "profile_header",
      "column": "left",
      "type": "profile_header",
      "title": "",
      "items": [{ "id": "prof1", "name": "...", "subtitle": "...", "location": "...", "email": "...", "phone": "...", "linkedin": "...", "github": "..." }]
    },
    {
      "id": "about_section",
      "column": "left",
      "type": "about",
      "title": "Perfil Profesional",
      "items": [{ "id": "about1", "description": "..." }]
    },
    {
      "id": "experience",
      "column": "right",
      "type": "list",
      "title": "EXPERIENCIA LABORAL",
      "items": [{ "id": "exp1", "title": "...", "subtitle": "...", "date": "...", "bullets": ["..."] }]
    },
    {
      "id": "skills",
      "column": "left",
      "type": "skills",
      "title": "HABILIDADES TÉCNICAS",
      "items": [{ "id": "skill1", "title": "...", "description": "..." }]
    },
    {
      "id": "education",
      "column": "left",
      "type": "education",
      "title": "EDUCACIÓN",
      "items": [{ "id": "edu1", "title": "...", "subtitle": "...", "date": "..." }]
    },
    {
      "id": "certificates",
      "column": "right",
      "type": "simple_list",
      "title": "CERTIFICACIONES",
      "items": [{ "id": "cert1", "text": "..." }]
    },
    {
      "id": "languages",
      "column": "left",
      "type": "simple_list",
      "title": "IDIOMAS",
      "items": [{ "id": "lang1", "text": "..." }]
    }
  ]
}
```

[INPUT_UNSTRUCTURED_TEXT]
{INSERTAR_TEXTO_BRUTO_AQUI}
```
