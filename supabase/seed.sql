-- Development-only seed data for UniCourse.
-- These auth.users rows are placeholders so local app data has stable user IDs.
-- They are not login-capable accounts and should never be used for production seeding.

insert into auth.users (id, email, raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111', 'viviana@unicourse.local', '{}'::jsonb),
  ('22222222-2222-2222-2222-222222222222', 'laura@unicourse.local', '{}'::jsonb),
  ('33333333-3333-3333-3333-333333333333', 'ana@unicourse.local', '{}'::jsonb),
  ('44444444-4444-4444-4444-444444444444', 'carmen@unicourse.local', '{}'::jsonb),
  ('55555555-5555-5555-5555-555555555555', 'maria@unicourse.local', '{}'::jsonb);

insert into public.profiles (
  id,
  first_name,
  last_name,
  display_name,
  email,
  role,
  account_status,
  age_range,
  country
)
values
  ('11111111-1111-1111-1111-111111111111', 'Viviana', 'Olavarria', 'Viviana', 'viviana@unicourse.local', 'super_admin', 'active', '40_49', 'México'),
  ('22222222-2222-2222-2222-222222222222', 'Laura', 'Hernández', 'Laura', 'laura@unicourse.local', 'instructor', 'active', '30_39', 'México'),
  ('33333333-3333-3333-3333-333333333333', 'Ana', 'Pérez', 'Ana', 'ana@unicourse.local', 'student', 'active', '40_49', 'México'),
  ('44444444-4444-4444-4444-444444444444', 'Carmen', 'Ruiz', 'Carmen', 'carmen@unicourse.local', 'student', 'active', '50_59', 'México'),
  ('55555555-5555-5555-5555-555555555555', 'María', 'López', 'María', 'maria@unicourse.local', 'student', 'active', 'prefer_not_to_say', 'México');

insert into public.courses (
  id,
  title,
  slug,
  short_description,
  full_description,
  difficulty,
  estimated_duration_minutes,
  status
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'IA desde cero',
    'ia-desde-cero',
    'Curso base para aprender a usar IA en el trabajo diario.',
    'Un recorrido completo para entender fundamentos, prompts, automatización simple y aplicaciones reales para mujeres adultas con distintos niveles de experiencia tecnológica.',
    'beginner',
    720,
    'published'
  );

insert into public.course_instructors (course_id, profile_id)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222');

insert into public.cohorts (
  id,
  course_id,
  name,
  start_date,
  end_date,
  status,
  enrollment_limit
)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Agosto 2026', '2026-08-18', '2026-11-10', 'active', 40),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Octubre 2026', '2026-10-05', '2027-01-22', 'planned', 40);

insert into public.cohort_instructors (cohort_id, profile_id)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '22222222-2222-2222-2222-222222222222'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '22222222-2222-2222-2222-222222222222');

insert into public.modules (id, course_id, title, slug, summary, position, status)
values
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bienvenida', 'bienvenida', 'Primeros pasos dentro del curso.', 1024, 'published'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Prompts útiles', 'prompts-utiles', 'Cómo escribir mejores instrucciones para obtener resultados más claros.', 2048, 'published');

insert into public.lessons (
  id,
  module_id,
  title,
  slug,
  summary,
  estimated_duration_minutes,
  position,
  status
)
values
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'Cómo aprovechar el curso', 'como-aprovechar-el-curso', 'Ruta de estudio y expectativas.', 18, 1024, 'published'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd2', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 'Prompts para atención al cliente', 'prompts-atencion-cliente', 'Ejemplos aplicados para responder con más claridad.', 26, 1024, 'published');

insert into public.assignments (
  id,
  course_id,
  module_id,
  lesson_id,
  cohort_id,
  title,
  instructions,
  due_at,
  allow_late_submissions,
  max_files,
  max_file_size_bytes,
  status
)
values
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'cccccccc-cccc-cccc-cccc-ccccccccccc2',
    'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'Proyecto del módulo 3',
    'Sube un archivo con tres prompts aplicados a tu negocio y explica cuál te funcionó mejor.',
    '2026-08-27T23:59:00Z',
    true,
    2,
    10485760,
    'published'
  );

insert into public.assignment_submission_types (assignment_id, submission_type)
values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'text'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'file'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'pdf'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'url');

insert into public.live_classes (
  id,
  course_id,
  cohort_id,
  instructor_profile_id,
  title,
  description,
  starts_at,
  duration_minutes,
  meeting_url,
  status
)
values
  (
    'ffffffff-ffff-ffff-ffff-fffffffffff1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    '22222222-2222-2222-2222-222222222222',
    'Cómo usar IA para ahorrar tiempo',
    'Sesión en vivo con ejemplos prácticos y espacio para preguntas.',
    '2026-08-25T01:00:00Z',
    90,
    'https://meet.example.com/unicourse/agosto-2026',
    'published'
  );

insert into public.content_blocks (
  id,
  lesson_id,
  block_type,
  title,
  payload,
  position
)
values
  (
    '12121212-1212-1212-1212-121212121211',
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    'rich_text',
    'Qué vas a encontrar aquí',
    '{"body":"Bienvenida al curso. Aquí te explicamos cómo estudiar sin sentirte perdida."}'::jsonb,
    1024
  ),
  (
    '12121212-1212-1212-1212-121212121212',
    'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    'heading',
    'Prompts útiles para tu negocio',
    '{"level":2,"text":"Prompts útiles para tu negocio"}'::jsonb,
    1024
  ),
  (
    '12121212-1212-1212-1212-121212121213',
    'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    'assignment',
    'Entrega del módulo',
    '{"button_label":"Entregar tarea"}'::jsonb,
    2048,
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
    null
  ),
  (
    '12121212-1212-1212-1212-121212121214',
    'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    'live_class',
    'Próxima sesión en vivo',
    '{"button_label":"Entrar a la clase"}'::jsonb,
    3072,
    null,
    'ffffffff-ffff-ffff-ffff-fffffffffff1'
  );

insert into public.enrollments (
  id,
  student_profile_id,
  course_id,
  cohort_id,
  status,
  access_state,
  enrolled_at
)
values
  (
    '13131313-1313-1313-1313-131313131311',
    '33333333-3333-3333-3333-333333333333',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'active',
    'enabled',
    '2026-08-18T18:00:00Z'
  ),
  (
    '13131313-1313-1313-1313-131313131312',
    '44444444-4444-4444-4444-444444444444',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'active',
    'enabled',
    '2026-08-18T18:05:00Z'
  ),
  (
    '13131313-1313-1313-1313-131313131313',
    '55555555-5555-5555-5555-555555555555',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'active',
    'enabled',
    '2026-08-20T15:00:00Z'
  );

insert into public.lesson_progress (
  id,
  enrollment_id,
  lesson_id,
  status,
  started_at,
  completed_at
)
values
  (
    '14141414-1414-1414-1414-141414141411',
    '13131313-1313-1313-1313-131313131311',
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    'completed',
    '2026-08-18T19:00:00Z',
    '2026-08-18T19:20:00Z'
  ),
  (
    '14141414-1414-1414-1414-141414141412',
    '13131313-1313-1313-1313-131313131311',
    'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    'in_progress',
    '2026-08-21T18:00:00Z',
    null
  );

insert into public.submissions (
  id,
  assignment_id,
  enrollment_id,
  attempt_number,
  status,
  written_response,
  submitted_at,
  reviewed_at,
  reviewer_profile_id,
  instructor_feedback,
  is_late
)
values
  (
    '15151515-1515-1515-1515-151515151511',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
    '13131313-1313-1313-1313-131313131311',
    1,
    'changes_requested',
    'Probé tres prompts para responder preguntas frecuentes de mis clientas.',
    '2026-08-21T21:30:00Z',
    '2026-08-22T15:00:00Z',
    '22222222-2222-2222-2222-222222222222',
    'El segundo prompt todavía es muy amplio. Agrega un ejemplo de tono y define mejor el resultado esperado.',
    false
  ),
  (
    '15151515-1515-1515-1515-151515151512',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
    '13131313-1313-1313-1313-131313131311',
    2,
    'draft',
    'Ya ajusté el segundo prompt con un tono más concreto y una instrucción más específica.',
    null,
    null,
    null,
    null,
    false
  );

update public.submissions
   set previous_submission_id = '15151515-1515-1515-1515-151515151511'
 where id = '15151515-1515-1515-1515-151515151512';

insert into public.submission_files (
  id,
  submission_id,
  storage_path,
  original_filename,
  mime_type,
  byte_size
)
values
  (
    '16161616-1616-1616-1616-161616161611',
    '15151515-1515-1515-1515-151515151511',
    'submissions/ana-perez/proyecto-modulo-3-v1.pdf',
    'proyecto-modulo-3-ana-perez.pdf',
    'application/pdf',
    485920
  );

insert into public.tags (id, name, description, color, category)
values
  ('17171717-1717-1717-1717-171717171711', 'Principiante', 'Necesita acompañamiento inicial más guiado.', '#E0954A', 'nivel'),
  ('17171717-1717-1717-1717-171717171712', 'Muy activa', 'Participa con frecuencia y termina tareas con constancia.', '#2FA98F', 'participacion'),
  ('17171717-1717-1717-1717-171717171713', 'Necesita seguimiento', 'Conviene revisar avances o recordar fechas clave.', '#6B5CE0', 'seguimiento'),
  ('17171717-1717-1717-1717-171717171714', 'ChatGPT', 'Interés principal en herramientas conversacionales.', '#C9A6F2', 'interes');

insert into public.user_tags (profile_id, tag_id, assigned_by_profile_id)
values
  ('33333333-3333-3333-3333-333333333333', '17171717-1717-1717-1717-171717171713', '11111111-1111-1111-1111-111111111111'),
  ('44444444-4444-4444-4444-444444444444', '17171717-1717-1717-1717-171717171712', '11111111-1111-1111-1111-111111111111'),
  ('55555555-5555-5555-5555-555555555555', '17171717-1717-1717-1717-171717171711', '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333', '17171717-1717-1717-1717-171717171714', '11111111-1111-1111-1111-111111111111');

insert into public.activity_events (
  id,
  actor_profile_id,
  enrollment_id,
  course_id,
  cohort_id,
  event_type,
  related_entity_type,
  related_entity_id,
  metadata
)
values
  (
    '18181818-1818-1818-1818-181818181811',
    '33333333-3333-3333-3333-333333333333',
    '13131313-1313-1313-1313-131313131311',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'lesson_completed',
    'lesson',
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    '{"source":"seed"}'::jsonb
  ),
  (
    '18181818-1818-1818-1818-181818181812',
    '33333333-3333-3333-3333-333333333333',
    '13131313-1313-1313-1313-131313131311',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'assignment_submitted',
    'submission',
    '15151515-1515-1515-1515-151515151511',
    '{"attempt":1}'::jsonb
  ),
  (
    '18181818-1818-1818-1818-181818181813',
    '22222222-2222-2222-2222-222222222222',
    '13131313-1313-1313-1313-131313131311',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'changes_requested',
    'submission',
    '15151515-1515-1515-1515-151515151511',
    '{"reviewer":"Laura Hernández"}'::jsonb
  );

insert into public.admin_notes (
  id,
  student_profile_id,
  author_profile_id,
  note_content
)
values
  (
    '19191919-1919-1919-1919-191919191911',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Ana entiende bien el contenido, pero conviene reforzar ejemplos concretos cuando trabaja sus entregas.'
  );
