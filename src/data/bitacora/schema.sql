-- =============================================================================
-- Ressume Bitácora / Career Knowledge Hub - Supabase Database Schema (Production Ready)
-- Incluye: Tablas con constraints, RLS endurecido, función RPC atómica anti-race-conditions,
-- función de verificación de voto seguro, e inserción de seeds completos y curados.
-- =============================================================================

-- 1. Tabla: bitacora_posts
create table if not exists public.bitacora_posts (
  id text primary key,
  category text not null check (category in ('bullets', 'ats', 'interviews', 'strategy', 'resources', 'networking')),
  title text not null,
  summary text not null,
  read_time_minutes integer default 2 check (read_time_minutes > 0),
  callout jsonb default null,
  content text default null,
  links jsonb default '[]'::jsonb,
  author jsonb not null,
  tags text[] default array[]::text[],
  upvotes integer default 0 check (upvotes >= 0),
  status text default 'published' check (status in ('published', 'pending_review', 'archived')),
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Índices para búsqueda rápida y filtrado optimizado en feeds
create index if not exists idx_bitacora_posts_category on public.bitacora_posts(category);
create index if not exists idx_bitacora_posts_status on public.bitacora_posts(status);
create index if not exists idx_bitacora_posts_feed on public.bitacora_posts(status, category, created_at desc);

-- 2. Tabla: bitacora_votes (Anti-Abuse Token Tracking)
create table if not exists public.bitacora_votes (
  id uuid default gen_random_uuid() primary key,
  post_id text not null references public.bitacora_posts(id) on delete cascade,
  voter_token text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  constraint uq_post_voter unique (post_id, voter_token)
);

create index if not exists idx_bitacora_votes_post on public.bitacora_votes(post_id);
create index if not exists idx_bitacora_votes_token on public.bitacora_votes(voter_token);

-- 3. Función RPC atómica para votación anti-abuso y prevención de race conditions
create or replace function public.toggle_bitacora_vote(
  p_post_id text,
  p_voter_token text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_voted boolean;
  v_new_upvotes integer;
begin
  -- Bloqueo de fila para evitar condiciones de carrera en ráfagas concurrentes
  perform 1 from public.bitacora_posts where id = p_post_id for update;

  if exists (
    select 1 from public.bitacora_votes 
    where post_id = p_post_id and voter_token = p_voter_token
  ) then
    -- Quitar voto
    delete from public.bitacora_votes 
    where post_id = p_post_id and voter_token = p_voter_token;

    update public.bitacora_posts
    set upvotes = greatest(0, upvotes - 1)
    where id = p_post_id
    returning upvotes into v_new_upvotes;

    v_voted := false;
  else
    -- Insertar voto
    insert into public.bitacora_votes (post_id, voter_token)
    values (p_post_id, p_voter_token);

    update public.bitacora_posts
    set upvotes = upvotes + 1
    where id = p_post_id
    returning upvotes into v_new_upvotes;

    v_voted := true;
  end if;

  return json_build_object(
    'has_voted', v_voted,
    'upvotes', coalesce(v_new_upvotes, 0)
  );
end;
$$;

-- Función segura de comprobación de voto por cliente (sin exponer la tabla de votos a SELECT general)
create or replace function public.check_user_vote(
  p_post_id text,
  p_voter_token text
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.bitacora_votes
    where post_id = p_post_id and voter_token = p_voter_token
  );
$$;

-- 4. Configuración y Endurecimiento de Row Level Security (RLS)
alter table public.bitacora_posts enable row level security;
alter table public.bitacora_votes enable row level security;

-- bitacora_posts: Lectura pública restringida a posts publicados
create policy "Public read published posts"
  on public.bitacora_posts for select
  using (status = 'published');

-- bitacora_posts: Inserciones comunitarias forzadas a pending_review y sin suplantación de oficial
create policy "Allow community submissions"
  on public.bitacora_posts for insert
  with check (
    status = 'pending_review'
    and (coalesce((author->>'isOfficial')::boolean, false) is false)
  );

-- bitacora_votes: Protegida. No se permite SELECT indiscriminado a anónimos para proteger tokens.
-- Toda mutación y consulta de estado se opera de forma segura vía las RPCs `toggle_bitacora_vote` y `check_user_vote`.

-- 5. Carga de Seeds Iniciales Curados
insert into public.bitacora_posts (id, category, title, summary, read_time_minutes, callout, content, links, author, tags, upvotes, status)
values
(
  'tip-google-xyz',
  'bullets',
  'Fórmula Google X-Y-Z para redactar logros irresistibles',
  'La estructura de redacción de viñetas más respetada en la industria tecnológica para demostrar impacto real.',
  2,
  '{"type": "info", "title": "Estructura Canónica", "text": "Logré [X], medido por [Y], haciendo [Z]. Por ejemplo: \"Reduje la latencia de respuesta de la API en un 38% (Y) mediante la implementación de Redis caching distribuido (Z), acelerando la carga para 500k usuarios diarios (X)\"."}'::jsonb,
  E'### ¿Por qué la mayoría de los CVs son ignorados?\nEl 90% de los candidatos escribe listas de tareas cotidianas en lugar de resultados medibles.\n\n### Los 3 componentes de la fórmula:\n1. Acción/Resultado [X]: Qué lograste cambiar en el negocio o producto.\n2. Métrica [Y]: Un número, porcentaje o ahorro cuantificable.\n3. Mecanismo [Z]: La tecnología, patrón o arquitectura que aplicaste.',
  '[]'::jsonb,
  '{"name": "Juani Carrizo", "role": "Staff Architect & Autor", "isOfficial": true}'::jsonb,
  array['Métricas', 'Bullets', 'Impacto', 'Google'],
  84,
  'published'
),
(
  'guide-ats-myths-vs-reality',
  'ats',
  'Mitos vs. Realidad de los sistemas ATS en 2026',
  'Qué parsean realmente Workday, Taleo y Greenhouse, y por qué los diseños a dos columnas no siempre fallan si la jerarquía es semántica.',
  4,
  '{"type": "warning", "title": "Alerta de Formato", "text": "Nunca incrustes texto crítico dentro de imágenes, tablas complejas anidadas o cuadros de texto flotantes no estándar. El parser extrae el flujo en texto plano secuencial."}'::jsonb,
  E'### La mentira de \"el robot que te rechaza automáticamente\"\nLos ATS no son inteligencias artificiales maquiavélicas. Son sistemas de gestión de bases de datos que extraen texto plano estructurado.\n\n### Reglas para un PDF 100% parseable:\n- Usar tipografías estándar o incrustadas correctamente.\n- Encabezados claros de sección.\n- Fechas consistentes.\n- Exportación vectorial limpia.',
  '[{"label": "Verificador de Texto Seleccionable", "url": "https://pdfcheck.org", "type": "tool"}]'::jsonb,
  '{"name": "Juani Carrizo", "role": "Staff Architect & Autor", "isOfficial": true}'::jsonb,
  array['ATS', 'Greenhouse', 'Workday', 'Parsers'],
  67,
  'published'
),
(
  'resource-tech-interview-handbook',
  'interviews',
  'Guía de preguntas trampa en entrevistas de comportamiento (STAR)',
  'Cómo responder "¿Cuál es tu mayor debilidad?" y "¿Contame una vez que fallaste?" sin sonar cliché ni arruinar tu candidatura.',
  3,
  '{"type": "danger", "title": "Peligro Crítico", "text": "Nunca respondas \"Soy demasiado perfeccionista\" o \"Trabajo demasiado\". Los entrevistadores experimentados consideran esto una falta de autoconciencia."}'::jsonb,
  E'### El Método STAR aplicado a errores reales:\n1. Situación (S): Contexto breve del problema.\n2. Tarea (T): Tu responsabilidad.\n3. Acción (A): El error honesto y qué hiciste de inmediato para mitigar el daño.\n4. Resultado (R) + Aprendizaje: La regla o proceso que implementaste para que NUNCA más se repita.',
  '[{"label": "Tech Interview Handbook", "url": "https://www.techinterviewhandbook.org/behavioral-interview/", "type": "repo"}]'::jsonb,
  '{"name": "Juani Carrizo", "role": "Staff Architect & Autor", "isOfficial": true}'::jsonb,
  array['STAR', 'Entrevistas', 'Behavioral', 'Psicotécnico'],
  52,
  'published'
),
(
  'tip-linkedin-headline',
  'strategy',
  'Tu titular de LinkedIn: Dejá de poner "Buscando activamente"',
  'El algoritmo de LinkedIn favorece términos de búsqueda de cargos y stack técnico exacto por sobre estados de necesidad.',
  2,
  '{"type": "warning", "title": "SEO de Reclutamiento", "text": "Los reclutadores buscan \"Senior Frontend Engineer | React, TypeScript\". Nadie tipea \"En búsqueda de nuevas oportunidades\" cuando necesita cubrir una vacante."}'::jsonb,
  null,
  '[]'::jsonb,
  '{"name": "Comunidad Ressume", "role": "Colaborador Verificado", "isOfficial": false}'::jsonb,
  array['LinkedIn', 'SEO', 'Marca Personal', 'Recruiters'],
  41,
  'published'
),
(
  'resource-salary-negotiation',
  'strategy',
  'Reglas inquebrantables de negociación salarial en Tech',
  'Cómo evitar anclarte con un número bajo en la primera llamada de screening telefónico.',
  3,
  '{"type": "info", "title": "Táctica de Respuesta", "text": "Cuando te pregunten \"¿Cuáles son tus expectativas salariales?\", respondé: \"Para darte un número exacto me gustaría entender mejor las responsabilidades y el paquete total de beneficios. ¿Cuál es el rango presupuestado que tienen definido para esta posición?\"."}'::jsonb,
  null,
  '[{"label": "Levels.fyi - Salarios Reales Verificados", "url": "https://www.levels.fyi", "type": "tool"}]'::jsonb,
  '{"name": "Juani Carrizo", "role": "Staff Architect & Autor", "isOfficial": true}'::jsonb,
  array['Salario', 'Negociación', 'Screening', 'Ofertas'],
  95,
  'published'
),
(
  'resource-awesome-cheat-sheets',
  'resources',
  'Repositorio de Cheatsheets y Roadmap de Arquitectura',
  'Colección de diagramas de diseño de sistemas, estructuras de datos y guías de patrones limpios para repasar antes de una entrevista.',
  1,
  null,
  null,
  '[{"label": "System Design Primer (GitHub)", "url": "https://github.com/donnemartin/system-design-primer", "type": "repo"}, {"label": "Roadmap.sh - Developer Roadmaps", "url": "https://roadmap.sh", "type": "doc"}]'::jsonb,
  '{"name": "Comunidad Ressume", "role": "Colaborador Verificado", "isOfficial": false}'::jsonb,
  array['System Design', 'Roadmaps', 'Cheatsheets'],
  38,
  'published'
),
(
  'strategy-value-validation-project',
  'strategy',
  'El Proyecto de Validación de Valor (VVP): Superar la falta de experiencia',
  'Cómo crear un mini entregable funcional para el Hiring Manager en lugar de enviar 200 solicitudes pasivas con Easy Apply.',
  3,
  '{"type": "info", "title": "Regla 80/20", "text": "Dedicar el 80% del tiempo a 10 empresas objetivo construyendo un prototipo o teardown técnico supera con creces el envío indiscriminado de CVs genéricos."}'::jsonb,
  E'### ¿Qué es un Value Validation Project (Austin Belcak)?\nEs un trabajo previo no solicitado que demuestra cómo resolverías un problema real del equipo antes de ser contratado.\n\n### 3 Formatos de VVP para Juniors:\n1. **Auditoría de API / Rendimiento:** Analizar tiempos de respuesta de endpoints públicos de la empresa y proponer optimizaciones.\n2. **Feature Prototype:** Construir una funcionalidad pequeña que sus usuarios reclaman en foros o redes.\n3. **Data Dashboard:** Procesar datos públicos de su sector y presentarlos en un panel interactivo.',
  '[{"label": "Metodología VVP - Cultivated Culture", "url": "https://cultivatedculture.com", "type": "doc"}]'::jsonb,
  '{"name": "Juani Carrizo", "role": "Staff Architect & Autor", "isOfficial": true}'::jsonb,
  array['VVP', 'Estrategia', 'Portafolio', 'Networking'],
  78,
  'published'
),
(
  'tech-live-coding-think-aloud',
  'interviews',
  'Protocolo \"Pensar en Voz Alta\" en pruebas técnicas de Live Coding',
  'Por qué los evaluadores prefieren a un candidato que comunica su razonamiento antes que a quien escribe código perfecto en silencio.',
  3,
  '{"type": "warning", "title": "Criterio de Evaluación", "text": "Si te trabas durante la prueba técnica, verbalizá el obstáculo: \"Sé que esto cuesta O(n²), estoy evaluando si un HashMap permite resolverlo en tiempo lineal\". Dar contexto permite al entrevistador guiarte."}'::jsonb,
  E'### Los 4 pasos obligatorios antes de escribir código:\n1. **Clarificar restricciones:** Preguntar por casos límite (arrays vacíos, números negativos, concurrencia).\n2. **Proponer solución ingenua (Brute Force):** Explicar su complejidad temporal y espacial.\n3. **Optimizar en voz alta:** Discutir estructuras de datos alternativas.\n4. **Pruebas manuales:** Recorrer el código con un ejemplo paso a paso antes de darlo por finalizado.',
  '[]'::jsonb,
  '{"name": "Juani Carrizo", "role": "Staff Architect & Autor", "isOfficial": true}'::jsonb,
  array['Live Coding', 'Algoritmos', 'Entrevista Técnica', 'Soft Skills'],
  63,
  'published'
),
(
  'networking-linkedin-alumni-tool',
  'strategy',
  'Cómo conseguir referrals usando el Alumni Tool de LinkedIn',
  'La técnica con más del 40% de tasa de respuesta para graduados universitarios y bootcamps.',
  2,
  '{"type": "info", "title": "Paso a Paso", "text": "Entrá a la página de tu universidad en LinkedIn > pestaña \"Exalumnos\" > filtrá por tu empresa objetivo y cargo (ej. Software Engineer). Enviá un mensaje de máximo 300 caracteres apelando al sentido de pertenencia."}'::jsonb,
  E'### Plantilla de mensaje de conexión (300 caracteres):\n\"Hola [Nombre], vi que sos graduado de [Universidad] y hoy estás como Dev en [Empresa]. Soy egresado reciente de Sistemas enfocado en [Stack]. Me encantaría conectar para seguir de cerca los desafíos de ingeniería de su equipo. ¡Un saludo!\"',
  '[]'::jsonb,
  '{"name": "Comunidad Ressume", "role": "Colaborador Verificado", "isOfficial": false}'::jsonb,
  array['LinkedIn', 'Networking', 'Alumni', 'Referrals'],
  59,
  'published'
),
(
  'ats-modern-llm-scorecards',
  'ats',
  'Cómo evalúan los ATS con IA en 2026 (Ashby, Lever y Greenhouse)',
  'La transición de conteo simple de palabras clave hacia tarjetas de puntuación semánticas basadas en LLMs.',
  4,
  '{"type": "danger", "title": "Encabezados Críticos", "text": "Los parsers semánticos asignan scorecards automáticos. Usar títulos no estándar como \"Mis Creaciones\" en vez de \"Projects\" o \"Work Experience\" fragmenta el reporte del evaluador."}'::jsonb,
  E'### ¿Cómo leen los ATS modernos?\n- **Scorecards por requerimiento:** Si la vacante pide 1 año en Docker o PostgreSQL, el LLM busca la tecnología asociada a proyectos concretos con fechas, no en una lista aislada al pie del CV.\n- **Oraciones con contexto semántico:** Describir \"Desarrollo de microservicios con Go y gRPC\" califica muy por encima de listar simplemente las palabras sueltas.\n- **Texto seleccionable:** Si al hacer Ctrl+A en el PDF los caracteres se copian con símbolos rotos, el parser registra perfil vacío.',
  '[{"label": "Ashby Parsing Guidelines", "url": "https://ashbyhq.com", "type": "doc"}]'::jsonb,
  '{"name": "Juani Carrizo", "role": "Staff Architect & Autor", "isOfficial": true}'::jsonb,
  array['ATS', 'Ashby', 'Greenhouse', 'Scorecards', 'IA'],
  81,
  'published'
)
on conflict (id) do nothing;
