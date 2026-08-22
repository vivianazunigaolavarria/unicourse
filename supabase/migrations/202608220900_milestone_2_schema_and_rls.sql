create extension if not exists pgcrypto with schema extensions;

create type public.app_role_enum as enum ('student', 'instructor', 'admin', 'super_admin');
create type public.account_status_enum as enum ('invited', 'active', 'suspended', 'archived');
create type public.profile_age_range_enum as enum (
  'under_30',
  '30_39',
  '40_49',
  '50_59',
  '60_69',
  '70_plus',
  'prefer_not_to_say'
);
create type public.publication_status_enum as enum ('draft', 'published', 'archived');
create type public.course_difficulty_enum as enum ('beginner', 'intermediate', 'advanced', 'all_levels');
create type public.cohort_status_enum as enum ('planned', 'active', 'completed', 'archived', 'cancelled');
create type public.enrollment_status_enum as enum ('active', 'completed', 'paused', 'cancelled');
create type public.access_state_enum as enum ('enabled', 'disabled');
create type public.lesson_progress_status_enum as enum ('not_started', 'in_progress', 'completed');
create type public.assignment_submission_type_enum as enum ('text', 'file', 'pdf', 'image', 'audio', 'video', 'url');
create type public.submission_status_enum as enum ('draft', 'submitted', 'reviewed', 'changes_requested', 'approved');
create type public.content_block_type_enum as enum (
  'rich_text',
  'heading',
  'image',
  'video',
  'pdf',
  'file',
  'external_link',
  'callout',
  'divider',
  'quiz',
  'assignment',
  'live_class',
  'embed'
);
create type public.activity_event_type_enum as enum (
  'account_created',
  'enrolled',
  'course_opened',
  'lesson_started',
  'lesson_completed',
  'assignment_submitted',
  'assignment_approved',
  'changes_requested',
  'live_class_accessed',
  'course_completed'
);
create type public.related_entity_type_enum as enum (
  'profile',
  'course',
  'module',
  'lesson',
  'assignment',
  'submission',
  'live_class',
  'cohort',
  'tag'
);

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.protect_profile_admin_fields()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  acting_role public.app_role_enum;
begin
  if auth.uid() is null or auth.role() = 'service_role' then
    return new;
  end if;

  select p.role
    into acting_role
    from public.profiles p
   where p.id = auth.uid();

  if acting_role in ('admin', 'super_admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.id <> auth.uid() then
      raise exception 'Profiles can only be created for the authenticated user.';
    end if;

    if new.role <> 'student' then
      raise exception 'Only admins can assign profile roles.';
    end if;

    if new.account_status <> 'invited' then
      raise exception 'Only admins can set account status during profile creation.';
    end if;

    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Only admins can change profile roles.';
  end if;

  if new.account_status is distinct from old.account_status then
    raise exception 'Only admins can change account status.';
  end if;

  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null check (length(btrim(first_name)) > 0),
  last_name text not null check (length(btrim(last_name)) > 0),
  display_name text,
  avatar_url text,
  role public.app_role_enum not null default 'student',
  account_status public.account_status_enum not null default 'invited',
  age_range public.profile_age_range_enum,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (display_name is null or length(btrim(display_name)) > 0)
);

create table public.courses (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null check (length(btrim(title)) > 0),
  slug text not null check (length(btrim(slug)) > 0),
  short_description text not null default '',
  full_description text not null default '',
  cover_image_path text,
  difficulty public.course_difficulty_enum not null default 'all_levels',
  estimated_duration_minutes integer check (estimated_duration_minutes is null or estimated_duration_minutes > 0),
  status public.publication_status_enum not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.course_instructors (
  course_id uuid not null references public.courses (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete restrict,
  assigned_at timestamptz not null default now(),
  primary key (course_id, profile_id)
);

create table public.cohorts (
  id uuid primary key default extensions.gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete restrict,
  name text not null check (length(btrim(name)) > 0),
  start_date date,
  end_date date,
  status public.cohort_status_enum not null default 'planned',
  enrollment_limit integer check (enrollment_limit is null or enrollment_limit > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_date is null or end_date is null or end_date >= start_date)
);

create table public.cohort_instructors (
  cohort_id uuid not null references public.cohorts (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete restrict,
  assigned_at timestamptz not null default now(),
  primary key (cohort_id, profile_id)
);

create table public.modules (
  id uuid primary key default extensions.gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  slug text not null check (length(btrim(slug)) > 0),
  summary text not null default '',
  position bigint not null check (position > 0),
  status public.publication_status_enum not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug),
  unique (course_id, position)
);

create table public.lessons (
  id uuid primary key default extensions.gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  slug text not null check (length(btrim(slug)) > 0),
  summary text not null default '',
  estimated_duration_minutes integer check (estimated_duration_minutes is null or estimated_duration_minutes > 0),
  position bigint not null check (position > 0),
  status public.publication_status_enum not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, slug),
  unique (module_id, position)
);

create table public.assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete restrict,
  module_id uuid references public.modules (id) on delete set null,
  lesson_id uuid references public.lessons (id) on delete set null,
  cohort_id uuid references public.cohorts (id) on delete restrict,
  title text not null check (length(btrim(title)) > 0),
  instructions text not null default '',
  due_at timestamptz,
  allow_late_submissions boolean not null default false,
  max_files integer not null default 1 check (max_files >= 0),
  max_file_size_bytes bigint check (max_file_size_bytes is null or max_file_size_bytes > 0),
  status public.publication_status_enum not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.live_classes (
  id uuid primary key default extensions.gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete restrict,
  cohort_id uuid references public.cohorts (id) on delete restrict,
  instructor_profile_id uuid not null references public.profiles (id) on delete restrict,
  title text not null check (length(btrim(title)) > 0),
  description text not null default '',
  starts_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes > 0),
  meeting_url text,
  recording_url text,
  status public.publication_status_enum not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_blocks (
  id uuid primary key default extensions.gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  block_type public.content_block_type_enum not null,
  title text,
  payload jsonb not null default '{}'::jsonb,
  position bigint not null check (position > 0),
  assignment_id uuid references public.assignments (id) on delete restrict,
  live_class_id uuid references public.live_classes (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(payload) = 'object'),
  check (assignment_id is null or block_type = 'assignment'),
  check (live_class_id is null or block_type = 'live_class'),
  check (block_type <> 'assignment' or assignment_id is not null),
  check (block_type <> 'live_class' or live_class_id is not null),
  unique (lesson_id, position)
);

create table public.enrollments (
  id uuid primary key default extensions.gen_random_uuid(),
  student_profile_id uuid not null references public.profiles (id) on delete restrict,
  course_id uuid not null references public.courses (id) on delete restrict,
  cohort_id uuid references public.cohorts (id) on delete restrict,
  status public.enrollment_status_enum not null default 'active',
  access_state public.access_state_enum not null default 'enabled',
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (completed_at is null or completed_at >= enrolled_at),
  check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

create table public.lesson_progress (
  id uuid primary key default extensions.gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete restrict,
  status public.lesson_progress_status_enum not null default 'not_started',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (enrollment_id, lesson_id),
  check (completed_at is null or started_at is null or completed_at >= started_at),
  check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed')
  )
);

create table public.assignment_submission_types (
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  submission_type public.assignment_submission_type_enum not null,
  primary key (assignment_id, submission_type)
);

create table public.submissions (
  id uuid primary key default extensions.gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete restrict,
  enrollment_id uuid not null references public.enrollments (id) on delete restrict,
  previous_submission_id uuid references public.submissions (id) on delete restrict,
  attempt_number integer not null check (attempt_number > 0),
  status public.submission_status_enum not null default 'draft',
  written_response text,
  url_response text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewer_profile_id uuid references public.profiles (id) on delete set null,
  instructor_feedback text,
  is_late boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, enrollment_id, attempt_number),
  check (url_response is null or url_response ~* '^https?://'),
  check (
    (status = 'draft' and submitted_at is null and reviewed_at is null)
    or (status = 'submitted' and submitted_at is not null and reviewed_at is null)
    or (
      status in ('reviewed', 'changes_requested', 'approved')
      and submitted_at is not null
      and reviewed_at is not null
    )
  )
);

create table public.submission_files (
  id uuid primary key default extensions.gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  storage_path text not null check (length(btrim(storage_path)) > 0),
  original_filename text not null check (length(btrim(original_filename)) > 0),
  mime_type text not null check (length(btrim(mime_type)) > 0),
  byte_size bigint not null check (byte_size > 0),
  created_at timestamptz not null default now(),
  unique (submission_id, storage_path)
);

create table public.tags (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  description text,
  color text,
  category text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (color is null or color ~ '^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$')
);

create table public.user_tags (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  assigned_by_profile_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (profile_id, tag_id)
);

create table public.activity_events (
  id uuid primary key default extensions.gen_random_uuid(),
  actor_profile_id uuid references public.profiles (id) on delete set null,
  enrollment_id uuid references public.enrollments (id) on delete set null,
  course_id uuid references public.courses (id) on delete set null,
  cohort_id uuid references public.cohorts (id) on delete set null,
  event_type public.activity_event_type_enum not null,
  related_entity_type public.related_entity_type_enum,
  related_entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(metadata) = 'object'),
  check (
    (related_entity_type is null and related_entity_id is null)
    or (related_entity_type is not null and related_entity_id is not null)
  )
);

create table public.admin_notes (
  id uuid primary key default extensions.gen_random_uuid(),
  student_profile_id uuid not null references public.profiles (id) on delete restrict,
  author_profile_id uuid not null references public.profiles (id) on delete restrict,
  note_content text not null check (length(btrim(note_content)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index uq_courses_slug_ci on public.courses (lower(slug));
create unique index uq_cohorts_course_name_ci on public.cohorts (course_id, lower(name));
create unique index uq_tags_name_ci_active on public.tags (lower(name)) where archived_at is null;
create unique index uq_enrollments_active_course_per_student
  on public.enrollments (student_profile_id, course_id)
  where status in ('active', 'paused') and access_state = 'enabled';
create unique index uq_submissions_single_draft_per_assignment
  on public.submissions (assignment_id, enrollment_id)
  where status = 'draft';

create index ix_profiles_role_status on public.profiles (role, account_status);
create index ix_profiles_name_lookup on public.profiles (lower(last_name), lower(first_name));
create index ix_course_instructors_profile on public.course_instructors (profile_id, course_id);
create index ix_cohorts_course_status on public.cohorts (course_id, status, start_date);
create index ix_cohort_instructors_profile on public.cohort_instructors (profile_id, cohort_id);
create index ix_modules_course_status on public.modules (course_id, status, position);
create index ix_lessons_module_status on public.lessons (module_id, status, position);
create index ix_assignments_course_due on public.assignments (course_id, cohort_id, due_at);
create index ix_live_classes_upcoming on public.live_classes (course_id, cohort_id, starts_at) where status = 'published';
create index ix_enrollments_student_lookup on public.enrollments (student_profile_id, created_at desc);
create index ix_enrollments_by_course on public.enrollments (course_id, status, access_state);
create index ix_enrollments_by_cohort on public.enrollments (cohort_id, status) where cohort_id is not null;
create index ix_lesson_progress_enrollment on public.lesson_progress (enrollment_id, status, completed_at);
create index ix_lesson_progress_lesson on public.lesson_progress (lesson_id, status);
create index ix_assignment_submission_types_assignment on public.assignment_submission_types (assignment_id);
create index ix_submissions_review_queue on public.submissions (submitted_at desc) where status = 'submitted';
create index ix_submissions_enrollment_assignment on public.submissions (enrollment_id, assignment_id, attempt_number desc);
create index ix_submission_files_submission on public.submission_files (submission_id);
create index ix_user_tags_profile on public.user_tags (profile_id, created_at desc);
create index ix_user_tags_tag on public.user_tags (tag_id, profile_id);
create index ix_activity_events_actor_recent on public.activity_events (actor_profile_id, created_at desc);
create index ix_activity_events_enrollment_recent on public.activity_events (enrollment_id, created_at desc);
create index ix_activity_events_course_recent on public.activity_events (course_id, created_at desc);
create index ix_admin_notes_student_recent on public.admin_notes (student_profile_id, created_at desc);

create or replace function public.set_module_position()
returns trigger
language plpgsql
as $$
begin
  if new.position is not null then
    return new;
  end if;

  select coalesce(max(position), 0) + 1024
    into new.position
    from public.modules
   where course_id = new.course_id;

  return new;
end;
$$;

create or replace function public.set_lesson_position()
returns trigger
language plpgsql
as $$
begin
  if new.position is not null then
    return new;
  end if;

  select coalesce(max(position), 0) + 1024
    into new.position
    from public.lessons
   where module_id = new.module_id;

  return new;
end;
$$;

create or replace function public.set_content_block_position()
returns trigger
language plpgsql
as $$
begin
  if new.position is not null then
    return new;
  end if;

  select coalesce(max(position), 0) + 1024
    into new.position
    from public.content_blocks
   where lesson_id = new.lesson_id;

  return new;
end;
$$;

create or replace function public.validate_assignment_scope()
returns trigger
language plpgsql
as $$
declare
  module_course_id uuid;
  lesson_course_id uuid;
  lesson_module_id uuid;
  cohort_course_id uuid;
begin
  if new.module_id is not null then
    select course_id
      into module_course_id
      from public.modules
     where id = new.module_id;

    if module_course_id is null or module_course_id <> new.course_id then
      raise exception 'Assignment module must belong to the same course.';
    end if;
  end if;

  if new.lesson_id is not null then
    select m.course_id, l.module_id
      into lesson_course_id, lesson_module_id
      from public.lessons l
      join public.modules m on m.id = l.module_id
     where l.id = new.lesson_id;

    if lesson_course_id is null or lesson_course_id <> new.course_id then
      raise exception 'Assignment lesson must belong to the same course.';
    end if;

    if new.module_id is not null and lesson_module_id <> new.module_id then
      raise exception 'Assignment lesson must belong to the selected module.';
    end if;
  end if;

  if new.cohort_id is not null then
    select course_id
      into cohort_course_id
      from public.cohorts
     where id = new.cohort_id;

    if cohort_course_id is null or cohort_course_id <> new.course_id then
      raise exception 'Assignment cohort must belong to the same course.';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.validate_live_class_scope()
returns trigger
language plpgsql
as $$
declare
  cohort_course_id uuid;
begin
  if new.cohort_id is not null then
    select course_id
      into cohort_course_id
      from public.cohorts
     where id = new.cohort_id;

    if cohort_course_id is null or cohort_course_id <> new.course_id then
      raise exception 'Live class cohort must belong to the same course.';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.validate_content_block_scope()
returns trigger
language plpgsql
as $$
declare
  lesson_course_id uuid;
  assignment_course_id uuid;
  live_class_course_id uuid;
begin
  select m.course_id
    into lesson_course_id
    from public.lessons l
    join public.modules m on m.id = l.module_id
   where l.id = new.lesson_id;

  if new.assignment_id is not null then
    select course_id
      into assignment_course_id
      from public.assignments
     where id = new.assignment_id;

    if assignment_course_id is null or assignment_course_id <> lesson_course_id then
      raise exception 'Assignment block must reference an assignment in the same course.';
    end if;
  end if;

  if new.live_class_id is not null then
    select course_id
      into live_class_course_id
      from public.live_classes
     where id = new.live_class_id;

    if live_class_course_id is null or live_class_course_id <> lesson_course_id then
      raise exception 'Live class block must reference a live class in the same course.';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.validate_enrollment_scope()
returns trigger
language plpgsql
as $$
declare
  cohort_course_id uuid;
begin
  if new.cohort_id is not null then
    select course_id
      into cohort_course_id
      from public.cohorts
     where id = new.cohort_id;

    if cohort_course_id is null or cohort_course_id <> new.course_id then
      raise exception 'Enrollment cohort must belong to the same course.';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.validate_lesson_progress_scope()
returns trigger
language plpgsql
as $$
declare
  enrollment_course_id uuid;
  lesson_course_id uuid;
begin
  select course_id
    into enrollment_course_id
    from public.enrollments
   where id = new.enrollment_id;

  select m.course_id
    into lesson_course_id
    from public.lessons l
    join public.modules m on m.id = l.module_id
   where l.id = new.lesson_id;

  if enrollment_course_id is null or lesson_course_id is null or enrollment_course_id <> lesson_course_id then
    raise exception 'Lesson progress must belong to the enrollment course.';
  end if;

  return new;
end;
$$;

create or replace function public.validate_submission_scope()
returns trigger
language plpgsql
as $$
declare
  assignment_course_id uuid;
  assignment_cohort_id uuid;
  enrollment_course_id uuid;
  enrollment_cohort_id uuid;
  previous_assignment_id uuid;
  previous_enrollment_id uuid;
  previous_attempt_number integer;
begin
  select course_id, cohort_id
    into assignment_course_id, assignment_cohort_id
    from public.assignments
   where id = new.assignment_id;

  select course_id, cohort_id
    into enrollment_course_id, enrollment_cohort_id
    from public.enrollments
   where id = new.enrollment_id;

  if assignment_course_id is null or enrollment_course_id is null or assignment_course_id <> enrollment_course_id then
    raise exception 'Submission assignment and enrollment must belong to the same course.';
  end if;

  if assignment_cohort_id is not null and assignment_cohort_id <> enrollment_cohort_id then
    raise exception 'Cohort-specific assignments must be submitted from the matching cohort enrollment.';
  end if;

  if new.attempt_number > 1 and new.previous_submission_id is null then
    raise exception 'Resubmissions must reference the previous submission.';
  end if;

  if new.previous_submission_id is not null then
    select assignment_id, enrollment_id, attempt_number
      into previous_assignment_id, previous_enrollment_id, previous_attempt_number
      from public.submissions
     where id = new.previous_submission_id;

    if previous_assignment_id is null then
      raise exception 'Previous submission was not found.';
    end if;

    if previous_assignment_id <> new.assignment_id or previous_enrollment_id <> new.enrollment_id then
      raise exception 'Previous submission must match the same assignment and enrollment.';
    end if;

    if previous_attempt_number <> new.attempt_number - 1 then
      raise exception 'Submission attempt_number must advance one step at a time.';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.sync_submission_lateness()
returns trigger
language plpgsql
as $$
declare
  assignment_due_at timestamptz;
  allows_late boolean;
begin
  select due_at, allow_late_submissions
    into assignment_due_at, allows_late
    from public.assignments
   where id = new.assignment_id;

  if new.status = 'draft' or new.submitted_at is null then
    new.is_late = false;
    return new;
  end if;

  if assignment_due_at is not null and new.submitted_at > assignment_due_at then
    if not allows_late then
      raise exception 'Late submissions are disabled for this assignment.';
    end if;

    new.is_late = true;
  else
    new.is_late = false;
  end if;

  return new;
end;
$$;

create or replace function public.enforce_submission_update_rules()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  acting_role public.app_role_enum;
  is_submission_owner boolean;
  can_review_submission boolean;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if auth.uid() is null or auth.role() = 'service_role' then
    return new;
  end if;

  select p.role
    into acting_role
    from public.profiles p
   where p.id = auth.uid();

  if acting_role in ('admin', 'super_admin') then
    return new;
  end if;

  select exists (
    select 1
      from public.enrollments e
     where e.id = old.enrollment_id
       and e.student_profile_id = auth.uid()
  )
    into is_submission_owner;

  if is_submission_owner then
    if old.status <> 'draft' then
      raise exception 'Students can only edit draft submissions.';
    end if;

    if new.assignment_id is distinct from old.assignment_id
      or new.enrollment_id is distinct from old.enrollment_id
      or new.previous_submission_id is distinct from old.previous_submission_id
      or new.attempt_number is distinct from old.attempt_number
      or new.created_at is distinct from old.created_at then
      raise exception 'Students cannot change submission identity fields after creation.';
    end if;

    if new.reviewed_at is not null
      or new.reviewer_profile_id is not null
      or new.instructor_feedback is not null then
      raise exception 'Students cannot write instructor review fields.';
    end if;

    return new;
  end if;

  select exists (
    select 1
      from public.assignments a
      join public.enrollments e on e.id = old.enrollment_id
     where a.id = old.assignment_id
       and (
         exists (
           select 1
             from public.course_instructors ci
            where ci.course_id = a.course_id
              and ci.profile_id = auth.uid()
         )
         or (
           a.cohort_id is not null
           and exists (
             select 1
               from public.cohort_instructors ci
              where ci.cohort_id = a.cohort_id
                and ci.profile_id = auth.uid()
           )
         )
         or (
           e.cohort_id is not null
           and exists (
             select 1
               from public.cohort_instructors ci
              where ci.cohort_id = e.cohort_id
                and ci.profile_id = auth.uid()
           )
         )
       )
  )
    into can_review_submission;

  if can_review_submission then
    if old.status = 'draft' then
      raise exception 'Instructors cannot review draft submissions.';
    end if;

    if new.assignment_id is distinct from old.assignment_id
      or new.enrollment_id is distinct from old.enrollment_id
      or new.previous_submission_id is distinct from old.previous_submission_id
      or new.attempt_number is distinct from old.attempt_number
      or new.written_response is distinct from old.written_response
      or new.url_response is distinct from old.url_response
      or new.submitted_at is distinct from old.submitted_at
      or new.created_at is distinct from old.created_at then
      raise exception 'Instructors can only update review fields on submissions.';
    end if;

    if new.status not in ('reviewed', 'changes_requested', 'approved') then
      raise exception 'Instructor reviews must move submissions into a reviewed state.';
    end if;

    if new.reviewed_at is null or new.reviewer_profile_id <> auth.uid() then
      raise exception 'Instructor reviews must record the current reviewer and review time.';
    end if;

    return new;
  end if;

  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_row_updated_at();

create trigger protect_profiles_admin_fields_before_write
before insert or update on public.profiles
for each row execute function public.protect_profile_admin_fields();

create trigger set_courses_updated_at
before update on public.courses
for each row execute function public.set_row_updated_at();

create trigger set_cohorts_updated_at
before update on public.cohorts
for each row execute function public.set_row_updated_at();

create trigger set_modules_updated_at
before update on public.modules
for each row execute function public.set_row_updated_at();

create trigger set_lessons_updated_at
before update on public.lessons
for each row execute function public.set_row_updated_at();

create trigger set_assignments_updated_at
before update on public.assignments
for each row execute function public.set_row_updated_at();

create trigger set_live_classes_updated_at
before update on public.live_classes
for each row execute function public.set_row_updated_at();

create trigger set_content_blocks_updated_at
before update on public.content_blocks
for each row execute function public.set_row_updated_at();

create trigger set_enrollments_updated_at
before update on public.enrollments
for each row execute function public.set_row_updated_at();

create trigger set_lesson_progress_updated_at
before update on public.lesson_progress
for each row execute function public.set_row_updated_at();

create trigger set_submissions_updated_at
before update on public.submissions
for each row execute function public.set_row_updated_at();

create trigger set_tags_updated_at
before update on public.tags
for each row execute function public.set_row_updated_at();

create trigger set_admin_notes_updated_at
before update on public.admin_notes
for each row execute function public.set_row_updated_at();

create trigger set_modules_position
before insert on public.modules
for each row execute function public.set_module_position();

create trigger set_lessons_position
before insert on public.lessons
for each row execute function public.set_lesson_position();

create trigger set_content_blocks_position
before insert on public.content_blocks
for each row execute function public.set_content_block_position();

create trigger validate_assignments_before_write
before insert or update on public.assignments
for each row execute function public.validate_assignment_scope();

create trigger validate_live_classes_before_write
before insert or update on public.live_classes
for each row execute function public.validate_live_class_scope();

create trigger validate_content_blocks_before_write
before insert or update on public.content_blocks
for each row execute function public.validate_content_block_scope();

create trigger validate_enrollments_before_write
before insert or update on public.enrollments
for each row execute function public.validate_enrollment_scope();

create trigger validate_lesson_progress_before_write
before insert or update on public.lesson_progress
for each row execute function public.validate_lesson_progress_scope();

create trigger validate_submissions_before_write
before insert or update on public.submissions
for each row execute function public.validate_submission_scope();

create trigger sync_submission_lateness_before_write
before insert or update on public.submissions
for each row execute function public.sync_submission_lateness();

create trigger enforce_submission_update_rules_before_write
before update on public.submissions
for each row execute function public.enforce_submission_update_rules();

create or replace function public.current_app_role()
returns public.app_role_enum
language sql
stable
security definer
set search_path = public
as $$
  select p.role
    from public.profiles p
   where p.id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() in ('admin', 'super_admin'), false);
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() = 'super_admin', false);
$$;

create or replace function public.is_enrollment_owner(target_enrollment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.enrollments e
     where e.id = target_enrollment_id
       and e.student_profile_id = auth.uid()
  );
$$;

create or replace function public.can_manage_course(target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
        from public.course_instructors ci
       where ci.course_id = target_course_id
         and ci.profile_id = auth.uid()
    );
$$;

create or replace function public.can_manage_cohort(target_cohort_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
        from public.cohort_instructors ci
       where ci.cohort_id = target_cohort_id
         and ci.profile_id = auth.uid()
    )
    or exists (
      select 1
        from public.cohorts c
        join public.course_instructors ci on ci.course_id = c.course_id
       where c.id = target_cohort_id
         and ci.profile_id = auth.uid()
    );
$$;

create or replace function public.can_view_course_content(target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or public.can_manage_course(target_course_id)
    or exists (
      select 1
        from public.cohorts c
       where c.course_id = target_course_id
         and public.can_manage_cohort(c.id)
    );
$$;

create or replace function public.can_access_course_as_student(target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.enrollments e
     where e.course_id = target_course_id
       and e.student_profile_id = auth.uid()
       and e.access_state = 'enabled'
       and e.status in ('active', 'completed', 'paused')
  );
$$;

create or replace function public.can_access_cohort_as_student(target_cohort_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.enrollments e
     where e.cohort_id = target_cohort_id
       and e.student_profile_id = auth.uid()
       and e.access_state = 'enabled'
       and e.status in ('active', 'completed', 'paused')
  );
$$;

create or replace function public.can_access_assignment_as_student(target_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.assignments a
      join public.enrollments e on e.course_id = a.course_id
     where a.id = target_assignment_id
       and e.student_profile_id = auth.uid()
       and e.access_state = 'enabled'
       and e.status in ('active', 'completed', 'paused')
       and (a.cohort_id is null or a.cohort_id = e.cohort_id)
  );
$$;

create or replace function public.can_access_live_class_as_student(target_live_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.live_classes lc
      join public.enrollments e on e.course_id = lc.course_id
     where lc.id = target_live_class_id
       and e.student_profile_id = auth.uid()
       and e.access_state = 'enabled'
       and e.status in ('active', 'completed', 'paused')
       and (lc.cohort_id is null or lc.cohort_id = e.cohort_id)
  );
$$;

create or replace function public.can_review_submission(target_submission_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
        from public.submissions s
        join public.assignments a on a.id = s.assignment_id
        join public.enrollments e on e.id = s.enrollment_id
       where s.id = target_submission_id
         and (
           public.can_manage_course(a.course_id)
           or (a.cohort_id is not null and public.can_manage_cohort(a.cohort_id))
           or (e.cohort_id is not null and public.can_manage_cohort(e.cohort_id))
         )
    );
$$;

create or replace function public.get_instructor_student_directory()
returns table (
  profile_id uuid,
  first_name text,
  last_name text,
  display_name text,
  avatar_url text,
  account_status public.account_status_enum,
  enrollment_id uuid,
  course_id uuid,
  cohort_id uuid,
  enrollment_status public.enrollment_status_enum,
  access_state public.access_state_enum
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct
    p.id as profile_id,
    p.first_name,
    p.last_name,
    p.display_name,
    p.avatar_url,
    p.account_status,
    e.id as enrollment_id,
    e.course_id,
    e.cohort_id,
    e.status as enrollment_status,
    e.access_state
  from public.profiles p
  join public.enrollments e on e.student_profile_id = p.id
  where public.is_admin()
     or public.can_manage_course(e.course_id)
     or (e.cohort_id is not null and public.can_manage_cohort(e.cohort_id));
$$;

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;

grant execute on function public.current_app_role() to authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.is_super_admin() to authenticated, service_role;
grant execute on function public.is_enrollment_owner(uuid) to authenticated, service_role;
grant execute on function public.can_manage_course(uuid) to authenticated, service_role;
grant execute on function public.can_manage_cohort(uuid) to authenticated, service_role;
grant execute on function public.can_view_course_content(uuid) to authenticated, service_role;
grant execute on function public.can_access_course_as_student(uuid) to authenticated, service_role;
grant execute on function public.can_access_cohort_as_student(uuid) to authenticated, service_role;
grant execute on function public.can_access_assignment_as_student(uuid) to authenticated, service_role;
grant execute on function public.can_access_live_class_as_student(uuid) to authenticated, service_role;
grant execute on function public.can_review_submission(uuid) to authenticated, service_role;
revoke all on function public.get_instructor_student_directory() from public;
grant execute on function public.get_instructor_student_directory() to authenticated, service_role;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_instructors enable row level security;
alter table public.cohorts enable row level security;
alter table public.cohort_instructors enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.content_blocks enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_submission_types enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_files enable row level security;
alter table public.tags enable row level security;
alter table public.user_tags enable row level security;
alter table public.live_classes enable row level security;
alter table public.activity_events enable row level security;
alter table public.admin_notes enable row level security;

create policy "profiles_select_self_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "profiles_insert_self_or_admin"
on public.profiles
for insert
to authenticated
with check (id = auth.uid() or public.is_admin());

create policy "profiles_update_self_or_admin"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "courses_select_visible"
on public.courses
for select
to authenticated
using (
  public.can_view_course_content(id)
  or (
    status = 'published'
    and public.can_access_course_as_student(id)
  )
);

create policy "courses_admin_write"
on public.courses
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "course_instructors_select_visible"
on public.course_instructors
for select
to authenticated
using (profile_id = auth.uid() or public.can_manage_course(course_id));

create policy "course_instructors_admin_write"
on public.course_instructors
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "cohorts_select_visible"
on public.cohorts
for select
to authenticated
using (
  public.can_manage_cohort(id)
  or public.can_access_cohort_as_student(id)
);

create policy "cohorts_admin_write"
on public.cohorts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "cohort_instructors_select_visible"
on public.cohort_instructors
for select
to authenticated
using (profile_id = auth.uid() or public.can_manage_cohort(cohort_id));

create policy "cohort_instructors_admin_write"
on public.cohort_instructors
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "modules_select_visible"
on public.modules
for select
to authenticated
using (
  public.can_view_course_content(course_id)
  or (
    status = 'published'
    and exists (
      select 1
        from public.courses c
       where c.id = course_id
         and c.status = 'published'
         and public.can_access_course_as_student(c.id)
    )
  )
);

create policy "modules_admin_write"
on public.modules
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "lessons_select_visible"
on public.lessons
for select
to authenticated
using (
  exists (
    select 1
      from public.modules m
     where m.id = module_id
       and public.can_view_course_content(m.course_id)
  )
  or (
    status = 'published'
    and exists (
      select 1
        from public.modules m
        join public.courses c on c.id = m.course_id
       where m.id = module_id
         and m.status = 'published'
         and c.status = 'published'
         and public.can_access_course_as_student(c.id)
    )
  )
);

create policy "lessons_admin_write"
on public.lessons
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "content_blocks_select_visible"
on public.content_blocks
for select
to authenticated
using (
  exists (
    select 1
      from public.lessons l
      join public.modules m on m.id = l.module_id
     where l.id = lesson_id
       and public.can_view_course_content(m.course_id)
  )
  or exists (
    select 1
      from public.lessons l
      join public.modules m on m.id = l.module_id
      join public.courses c on c.id = m.course_id
     where l.id = lesson_id
       and l.status = 'published'
       and m.status = 'published'
       and c.status = 'published'
       and public.can_access_course_as_student(c.id)
  )
);

create policy "content_blocks_admin_write"
on public.content_blocks
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "enrollments_select_visible"
on public.enrollments
for select
to authenticated
using (
  public.is_enrollment_owner(id)
  or public.can_manage_course(course_id)
  or (cohort_id is not null and public.can_manage_cohort(cohort_id))
);

create policy "enrollments_admin_write"
on public.enrollments
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "lesson_progress_select_visible"
on public.lesson_progress
for select
to authenticated
using (
  public.is_enrollment_owner(enrollment_id)
  or public.is_admin()
  or exists (
    select 1
      from public.enrollments e
     where e.id = enrollment_id
       and (
         public.can_manage_course(e.course_id)
         or (e.cohort_id is not null and public.can_manage_cohort(e.cohort_id))
       )
  )
);

create policy "lesson_progress_student_or_admin_insert"
on public.lesson_progress
for insert
to authenticated
with check (
  public.is_admin()
  or (
    public.is_enrollment_owner(enrollment_id)
    and exists (
      select 1
        from public.enrollments e
        join public.lessons l on l.id = lesson_id
        join public.modules m on m.id = l.module_id
       where e.id = enrollment_id
         and m.course_id = e.course_id
         and public.can_access_course_as_student(e.course_id)
    )
  )
);

create policy "lesson_progress_student_or_admin_update"
on public.lesson_progress
for update
to authenticated
using (
  public.is_admin()
  or public.is_enrollment_owner(enrollment_id)
)
with check (
  public.is_admin()
  or (
    public.is_enrollment_owner(enrollment_id)
    and exists (
      select 1
        from public.enrollments e
       where e.id = enrollment_id
         and public.can_access_course_as_student(e.course_id)
    )
  )
);

create policy "assignments_select_visible"
on public.assignments
for select
to authenticated
using (
  public.can_manage_course(course_id)
  or (cohort_id is not null and public.can_manage_cohort(cohort_id))
  or (cohort_id is null and public.can_view_course_content(course_id))
  or (
    status = 'published'
    and exists (
      select 1
        from public.courses c
       where c.id = course_id
         and c.status = 'published'
         and public.can_access_assignment_as_student(id)
    )
  )
);

create policy "assignments_admin_write"
on public.assignments
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "assignment_submission_types_select_visible"
on public.assignment_submission_types
for select
to authenticated
using (
  exists (
    select 1
      from public.assignments a
      join public.courses c on c.id = a.course_id
     where a.id = assignment_id
       and (
         public.can_manage_course(a.course_id)
         or (a.cohort_id is not null and public.can_manage_cohort(a.cohort_id))
         or (a.cohort_id is null and public.can_view_course_content(a.course_id))
         or (
           a.status = 'published'
           and c.status = 'published'
           and public.can_access_assignment_as_student(a.id)
         )
       )
  )
);

create policy "assignment_submission_types_admin_write"
on public.assignment_submission_types
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "submissions_select_visible"
on public.submissions
for select
to authenticated
using (
  public.is_enrollment_owner(enrollment_id)
  or public.is_admin()
  or exists (
    select 1
      from public.assignments a
      join public.enrollments e on e.id = enrollment_id
     where a.id = assignment_id
       and (
         public.can_manage_course(a.course_id)
         or (a.cohort_id is not null and public.can_manage_cohort(a.cohort_id))
         or (e.cohort_id is not null and public.can_manage_cohort(e.cohort_id))
       )
  )
);

create policy "submissions_student_or_admin_insert"
on public.submissions
for insert
to authenticated
with check (
  public.is_admin()
  or (
    public.is_enrollment_owner(enrollment_id)
    and public.can_access_assignment_as_student(assignment_id)
  )
);

create policy "submissions_student_draft_or_admin_update"
on public.submissions
for update
to authenticated
using (
  public.is_admin()
  or (
    public.is_enrollment_owner(enrollment_id)
    and status = 'draft'
  )
)
with check (
  public.is_admin()
  or (
    public.is_enrollment_owner(enrollment_id)
    and public.can_access_assignment_as_student(assignment_id)
    and status in ('draft', 'submitted')
    and reviewed_at is null
    and reviewer_profile_id is null
  )
);

create policy "submissions_instructor_review_update"
on public.submissions
for update
to authenticated
using (public.can_review_submission(id))
with check (
  public.can_review_submission(id)
  and status in ('reviewed', 'changes_requested', 'approved')
  and submitted_at is not null
  and reviewed_at is not null
  and reviewer_profile_id = auth.uid()
);

create policy "submissions_student_draft_or_admin_delete"
on public.submissions
for delete
to authenticated
using (
  public.is_admin()
  or (
    public.is_enrollment_owner(enrollment_id)
    and status = 'draft'
  )
);

create policy "submission_files_select_visible"
on public.submission_files
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
      from public.submissions s
      join public.assignments a on a.id = s.assignment_id
      join public.enrollments e on e.id = s.enrollment_id
     where s.id = submission_id
       and (
         public.is_enrollment_owner(s.enrollment_id)
         or public.can_manage_course(a.course_id)
         or (a.cohort_id is not null and public.can_manage_cohort(a.cohort_id))
         or (e.cohort_id is not null and public.can_manage_cohort(e.cohort_id))
       )
  )
);

create policy "submission_files_student_or_admin_insert"
on public.submission_files
for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1
      from public.submissions s
     where s.id = submission_id
       and public.is_enrollment_owner(s.enrollment_id)
       and s.status = 'draft'
  )
);

create policy "submission_files_student_or_admin_delete"
on public.submission_files
for delete
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
      from public.submissions s
     where s.id = submission_id
       and public.is_enrollment_owner(s.enrollment_id)
       and s.status = 'draft'
  )
);

create policy "tags_admin_only"
on public.tags
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "user_tags_admin_only"
on public.user_tags
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "live_classes_select_visible"
on public.live_classes
for select
to authenticated
using (
  public.can_manage_course(course_id)
  or (cohort_id is not null and public.can_manage_cohort(cohort_id))
  or (cohort_id is null and public.can_view_course_content(course_id))
  or (
    status = 'published'
    and (
      (cohort_id is not null and public.can_access_cohort_as_student(cohort_id))
      or (cohort_id is null and public.can_access_live_class_as_student(id))
    )
  )
);

create policy "live_classes_admin_write"
on public.live_classes
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "activity_events_select_visible"
on public.activity_events
for select
to authenticated
using (
  public.is_admin()
  or actor_profile_id = auth.uid()
  or (enrollment_id is not null and public.is_enrollment_owner(enrollment_id))
  or (course_id is not null and public.can_manage_course(course_id))
  or (cohort_id is not null and public.can_manage_cohort(cohort_id))
);

create policy "activity_events_insert_actor_or_admin"
on public.activity_events
for insert
to authenticated
with check (
  public.is_admin()
  or (
    actor_profile_id = auth.uid()
    and (
      enrollment_id is null
      or public.is_enrollment_owner(enrollment_id)
      or (course_id is not null and public.can_manage_course(course_id))
      or (cohort_id is not null and public.can_manage_cohort(cohort_id))
    )
  )
);

create policy "activity_events_admin_delete"
on public.activity_events
for delete
to authenticated
using (public.is_admin());

create policy "admin_notes_admin_only"
on public.admin_notes
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
