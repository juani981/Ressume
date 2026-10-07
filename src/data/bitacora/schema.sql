-- =============================================================================
-- Ressume Bitácora / Career Knowledge Hub - Supabase Database Schema
-- Production-ready schema with RLS, anti-abuse atomic vote RPC, and seed data.
-- =============================================================================

-- 1. Create table: bitacora_posts
create table if not exists public.bitacora_posts (
  id text primary key,
  category text not null,
  title text not null,
  summary text not null,
  read_time_minutes integer default 2,
  callout jsonb default null,
  content text default null,
  links jsonb default '[]'::jsonb,
  author jsonb not null,
  tags text[] default array[]::text[],
  upvotes integer default 0 check (upvotes >= 0),
  status text default 'published' check (status in ('published', 'pending_review', 'archived')),
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Indexing for fast search and category filtering
create index if not exists idx_bitacora_posts_category on public.bitacora_posts(category);
create index if not exists idx_bitacora_posts_status on public.bitacora_posts(status);
create index if not exists idx_bitacora_posts_created_at on public.bitacora_posts(created_at desc);

-- 2. Create table: bitacora_votes (Anti-Abuse Token Tracking)
create table if not exists public.bitacora_votes (
  id uuid default gen_random_uuid() primary key,
  post_id text not null references public.bitacora_posts(id) on delete cascade,
  voter_token text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  constraint uq_post_voter unique (post_id, voter_token)
);

create index if not exists idx_bitacora_votes_post on public.bitacora_votes(post_id);
create index if not exists idx_bitacora_votes_token on public.bitacora_votes(voter_token);

-- 3. Atomic Anti-Abuse Vote Function (RPC)
-- Prevents race conditions and prevents multiple votes from the same client/user token
create or replace function public.toggle_bitacora_vote(
  p_post_id text,
  p_voter_token text
)
returns json
language plpgsql
security definer
as $$
declare
  v_voted boolean;
  v_new_upvotes integer;
begin
  -- Check if already voted
  if exists (
    select 1 from public.bitacora_votes 
    where post_id = p_post_id and voter_token = p_voter_token
  ) then
    -- Remove vote
    delete from public.bitacora_votes 
    where post_id = p_post_id and voter_token = p_voter_token;

    update public.bitacora_posts
    set upvotes = greatest(0, upvotes - 1)
    where id = p_post_id
    returning upvotes into v_new_upvotes;

    v_voted := false;
  else
    -- Insert vote
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

-- 4. Enable Row Level Security (RLS)
alter table public.bitacora_posts enable row level security;
alter table public.bitacora_votes enable row level security;

-- Policies for bitacora_posts:
-- Public can read published posts
create policy "Public read published posts"
  on public.bitacora_posts for select
  using (status = 'published');

-- Anyone can submit a post (status set to published or pending_review)
create policy "Allow community submissions"
  on public.bitacora_posts for insert
  with check (true);

-- Policies for bitacora_votes:
create policy "Public can read their own votes"
  on public.bitacora_votes for select
  using (true);

-- 5. Seed Initial Curated Content (if table is empty)
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
  'Estructuración de respuestas en entrevistas conductuales (Método STAR)',
  'Metodología para abordar preguntas sobre fallas técnicas y debilidades profesionales con rigor y criterio de ingeniería.',
  3,
  '{"type": "danger", "title": "Error Frecuente", "text": "Evite respuestas evasivas como \"trabajo en exceso\" o \"soy perfeccionista\". Los evaluadores consideran estas respuestas como falta de autocrítica técnica."}'::jsonb,
  E'### Método STAR aplicado a incidentes y resolución técnica:\n1. Situación (S): Contexto técnico del problema o falla detectada.\n2. Tarea (T): Responsabilidad directa asumida durante la contingencia.\n3. Acción (A): Diagnóstico realizado, contención inmediata y corrección de fondo.\n4. Resultado (R) y Prevención: Pruebas automatizadas, monitoreo o políticas implementadas para impedir la recurrencia del fallo.',
  '[{"label": "Tech Interview Handbook", "url": "https://www.techinterviewhandbook.org/behavioral-interview/", "type": "repo"}]'::jsonb,
  '{"name": "Juani Carrizo", "role": "Staff Architect & Autor", "isOfficial": true}'::jsonb,
  array['STAR', 'Entrevistas', 'Behavioral', 'Psicotécnico'],
  52,
  'published'
),
(
  'tip-linkedin-headline',
  'strategy',
  'Titular profesional: indexación por especialidad y stack técnico',
  'Los algoritmos de búsqueda priorizan denominaciones de cargo estandarizadas y tecnologías concretas frente a estados de disponibilidad.',
  2,
  '{"type": "warning", "title": "Indexación en Búsquedas", "text": "Las consultas de perfiles utilizan filtros como \"Senior Frontend Engineer | React, TypeScript\". Las expresiones de búsqueda no incorporan frases genéricas de disponibilidad."}'::jsonb,
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
  'Criterios de negociación y rangos salariales en ingeniería',
  'Procedimiento para contextualizar expectativas de compensación durante las etapas iniciales de evaluación técnica.',
  3,
  '{"type": "info", "title": "Formulación Técnica", "text": "Ante la consulta sobre pretensiones salariales iniciales, una formulación adecuada es: \"Para establecer un parámetro certero es necesario dimensionar el alcance técnico del rol y el esquema integral de compensación. ¿Cuál es el rango presupuestado definido para esta posición?\"."}'::jsonb,
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
)
on conflict (id) do nothing;
