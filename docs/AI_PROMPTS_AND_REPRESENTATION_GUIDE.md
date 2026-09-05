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

### 🟢 Prompt 1: Auditoría Integral de Recruiter IT & ATS (17 Puntos - Modo por Defecto)

**Objetivo:** Auditoría exhaustiva, hiper-crítica y profesional realizada desde la perspectiva de un Senior IT Talent Acquisition & Especialista ATS.

```text
Quiero que actúes como un profesional senior de Recursos Humanos y Talent Acquisition especializado en perfiles de IT, Software y Technology, con experiencia en selección de candidatos, revisión de CVs, sistemas ATS (Applicant Tracking Systems), LinkedIn Recruiting y procesos de selección para diferentes niveles de experiencia.

Voy a proporcionarte un CV. Quiero que hagas una auditoría profesional, crítica y detallada del documento.

No quiero solamente una opinión general. Quiero que detectes problemas, oportunidades de mejora y me indiques exactamente qué cambiar y cómo hacerlo.

Toda conclusión sobre el perfil debe basarse exclusivamente en la información presente en el CV.

Si el CV no proporciona suficiente información para determinar algo, indícalo explícitamente en lugar de asumirlo.

---

1. Primera impresión
Analiza mi CV como si fueras un recruiter que recibe cientos de CVs.
Indica:
- ¿Qué impresión genera durante los primeros 5-10 segundos?
- ¿Se entiende rápidamente quién es la persona?
- ¿Se entiende su perfil profesional?
- ¿Se entiende qué tipo de experiencia o conocimientos tiene?
- ¿Cuál es su principal fortaleza?
- ¿Cuál es su principal debilidad?
- ¿Qué información sobra o distrae?
- ¿Qué información importante falta?
- ¿El CV consigue transmitir rápidamente el valor profesional de la persona?
Sé crítico y específico.

---

2. Identificación del perfil
Antes de evaluar el CV, analiza qué perfil profesional transmite realmente el documento.
Indica:
- Qué área o áreas profesionales parecen ser las principales.
- Qué tecnologías, conocimientos o competencias destacan.
- Qué nivel de experiencia parece transmitir el CV, únicamente basándote en la información disponible.
- Qué tipo de posiciones podría parecer que está buscando, si esto puede inferirse razonablemente.
- Si existe una contradicción entre el perfil que parece querer transmitir y el contenido real del CV.
Si algo no puede determinarse, indícalo. No agregues ni inventes información.

---

3. Estructura y organización
Analiza el orden y la estructura de las secciones.
Evalúa si la organización actual permite encontrar rápidamente la información más importante.
Analiza:
- Orden de las secciones.
- Jerarquía de la información.
- Organización del contenido.
- Consistencia entre secciones.
- Información repetida.
- Secciones innecesarias.
- Secciones que podrían combinarse.
- Información que debería tener mayor protagonismo.
- Información que debería reducirse.
Propón una estructura alternativa si consideras que la actual puede mejorarse.
No asumas que existe un único orden correcto: justifica tu propuesta según el contenido real del CV.

---

4. Análisis ATS
Analiza específicamente la compatibilidad con sistemas ATS.
Evalúa:
- Uso de palabras clave.
- Títulos de las secciones.
- Formato.
- Estructura.
- Columnas.
- Tablas.
- Íconos.
- Gráficos.
- Barras de nivel de habilidades.
- Elementos visuales que puedan dificultar la lectura automática.
- Información de contacto.
- Fechas.
- Nombres de tecnologías.
- Consistencia en la escritura de tecnologías y herramientas.
- Uso de abreviaturas.
- Formatos de archivo y elementos que puedan afectar la extracción de texto.
Indica claramente:
¿Consideras que este CV es ATS-friendly?
Dale una evaluación de 0 a 100 y explica por qué.
Indica también qué elementos concretos debería modificar para mejorar su compatibilidad con ATS.

---

5. Diseño y formato visual
Analiza el CV desde el punto de vista visual y profesional.
Evalúa:
- Tipografía, tamaño de letra, espaciado, márgenes, jerarquía visual, uso de colores, negritas, títulos, distribución del contenido, densidad de información, consistencia visual, facilidad de lectura y equilibrio entre texto y espacio en blanco.
Determina si el diseño transmite una imagen: Profesional, Moderna, Clara, Sobrecargada, Demasiado vacía, Demasiado creativa, Poco profesional, o Adecuada para un CV de IT.
Si existen elementos visuales que deberían eliminarse para mejorar la legibilidad o el ATS, indícalos.

---

6. Contenido y redacción
Analiza todo el texto del CV.
Busca: Frases innecesariamente largas, información redundante, errores gramaticales u ortográficos, frases poco profesionales, descripciones genéricas, verbos débiles, tecnologías sin contexto, información que debería resumirse o ampliarse, falta de claridad.
Cuando una sección pueda mejorarse, propón una versión más breve y profesional.
No inventes experiencia, conocimientos, logros, métricas ni tecnologías que no aparezcan en el CV.

---

7. Perfil profesional / resumen
Analiza especialmente el resumen o perfil profesional, si existe.
Determina si comunica claramente el perfil, si es demasiado largo o genérico, si utiliza palabras clave adecuadas y si contiene afirmaciones no respaldadas.
Si puede mejorarse, proporciona 2 o 3 versiones alternativas utilizando exclusivamente información del CV.

---

8. Experiencia profesional
Analiza cada experiencia laboral o profesional (título del puesto, empresa, fechas, descripción, verbos utilizados, tecnologías, responsabilidades, logros, resultados, cantidad de texto y relevancia).
Indica cómo transformar tareas en descripciones orientadas a resultados sin inventar métricas.

---

9. Proyectos
Si el CV contiene proyectos, analiza cuáles deberían destacarse, si las tecnologías están claras, si se explica el problema resuelto y si deberían incluirse enlaces a GitHub, portfolio o demos. Propón una estructura clara.

---

10. Skills / tecnologías
Analiza si está demasiado extensa, si hay tecnologías repetidas, si algunas deberían eliminarse o destacarse, si están correctamente agrupadas y si el nivel es creíble.

---

11. Educación, cursos y certificaciones
Analiza qué mantener, qué eliminar, qué destacar, cómo ordenar cursos y certificaciones, y la claridad de las fechas.

---

12. Palabras clave
Identifica palabras clave presentes, tecnologías clave y palabras clave que podrían faltar y sean coherentes con el perfil real sin agregarlas artificialmente.

---

13. Longitud
Determina si la extensión (1 página, 2 páginas o más) es adecuada y justifica qué contenido eliminar, combinar o resumir si aplica.

---

14. Evaluación general
Dale una puntuación de 0 a 100 a cada categoría:
- Contenido: /100
- Redacción: /100
- Estructura: /100
- Diseño: /100
- ATS: /100
- Palabras clave: /100
- Claridad del perfil: /100
- Impacto para un recruiter: /100
Proporciona la puntuación general global y explica el motivo de cada puntuación.

---

15. Problemas prioritarios
Clasifica en:
🔴 Problemas críticos (a corregir sí o sí).
🟠 Problemas importantes (mejorarían considerablemente el CV).
🟢 Mejoras opcionales.

---

16. Propuesta de estructura optimizada
Propón cómo estructurar el CV (secciones, orden, qué eliminar, qué resumir y qué destacar).

---

17. Conclusión como recruiter
Responde: ¿Qué tan probable sería avanzar con esta candidatura?
1. Qué te convencería.
2. Qué te generaría dudas.
3. Qué podría hacer que descartaras el CV.
4. Qué tres cambios harías primero.
5. Qué impresión profesional te deja el candidato.

[INPUT_CV]
{INSERTAR_ABSTRACCION_CV_MARKDOWN_O_JSON}
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
