alter type public.enrollment_status_enum add value if not exists 'suspended';
alter type public.enrollment_status_enum add value if not exists 'revoked';

create type public.admin_audit_action_enum as enum (
  'bootstrap_super_admin',
  'user_promoted_to_admin',
  'admin_demoted',
  'course_created',
  'course_access_granted',
  'course_access_revoked'
);

alter table public.profiles
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists country text;

update public.profiles p
   set email = coalesce(nullif(btrim(p.email), ''), u.email)
  from auth.users u
 where u.id = p.id;

alter table public.profiles
  alter column email set not null;

alter table public.profiles
  add constraint profiles_email_not_blank check (length(btrim(email)) > 0),
  add constraint profiles_phone_not_blank check (phone is null or length(btrim(phone)) > 0),
  add constraint profiles_country_not_blank check (country is null or length(btrim(country)) > 0);

create unique index if not exists uq_profiles_email_ci on public.profiles (lower(email));
create index if not exists ix_profiles_country_lookup on public.profiles (country);
create index if not exists ix_profiles_created_at on public.profiles (created_at desc);

drop index if exists uq_enrollments_active_course_per_student;
create unique index uq_enrollments_active_course_per_student
  on public.enrollments (student_profile_id, course_id)
  where status in ('active', 'paused', 'suspended') and access_state = 'enabled';

create table public.admin_audit_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  actor_user_id uuid not null references public.profiles (id) on delete restrict,
  target_user_id uuid references public.profiles (id) on delete set null,
  action public.admin_audit_action_enum not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(metadata) = 'object')
);

create index ix_admin_audit_logs_actor_recent on public.admin_audit_logs (actor_user_id, created_at desc);
create index ix_admin_audit_logs_target_recent on public.admin_audit_logs (target_user_id, created_at desc);
create index ix_admin_audit_logs_action_recent on public.admin_audit_logs (action, created_at desc);

create or replace function public.parse_profile_age_range(raw_value text)
returns public.profile_age_range_enum
language plpgsql
immutable
as $$
begin
  if raw_value is null or btrim(raw_value) = '' then
    return null;
  end if;

  if raw_value in ('under_30', '30_39', '40_49', '50_59', '60_69', '70_plus', 'prefer_not_to_say') then
    return raw_value::public.profile_age_range_enum;
  end if;

  return null;
end;
$$;

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  resolved_first_name text;
  resolved_last_name text;
begin
  resolved_first_name := coalesce(
    nullif(btrim(metadata ->> 'first_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Nueva'
  );
  resolved_last_name := coalesce(nullif(btrim(metadata ->> 'last_name'), ''), 'Usuaria');

  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    display_name,
    phone,
    country,
    age_range,
    role,
    account_status
  )
  values (
    new.id,
    coalesce(new.email, format('user-%s@placeholder.local', new.id)),
    resolved_first_name,
    resolved_last_name,
    nullif(btrim(metadata ->> 'display_name'), ''),
    nullif(btrim(metadata ->> 'phone'), ''),
    nullif(btrim(metadata ->> 'country'), ''),
    public.parse_profile_age_range(metadata ->> 'age_range'),
    'student',
    case
      when new.email_confirmed_at is null then 'invited'
      else 'active'
    end
  )
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  update public.profiles p
     set email = coalesce(new.email, p.email),
         account_status = case
           when p.account_status in ('suspended', 'archived') then p.account_status
           when new.email_confirmed_at is not null then 'active'
           else p.account_status
         end,
         updated_at = now()
   where p.id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_auth_user_created();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email, email_confirmed_at on auth.users
for each row execute function public.handle_auth_user_updated();

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

  if tg_op = 'INSERT' then
    if acting_role = 'super_admin' then
      return new;
    end if;

    if new.id <> auth.uid() then
      raise exception 'Profiles can only be created for the authenticated user.';
    end if;

    if new.role <> 'student' then
      raise exception 'Only super admins can assign profile roles.';
    end if;

    if new.account_status <> 'invited' then
      raise exception 'Only super admins can set account status during profile creation.';
    end if;

    return new;
  end if;

  if acting_role = 'super_admin' then
    return new;
  end if;

  if new.id <> auth.uid() then
    raise exception 'Only super admins can update other profiles directly.';
  end if;

  if new.role is distinct from old.role then
    raise exception 'Users cannot change their own role.';
  end if;

  if new.account_status is distinct from old.account_status then
    raise exception 'Users cannot change their own account status.';
  end if;

  if new.email is distinct from old.email then
    raise exception 'Email changes must be handled through Supabase Auth.';
  end if;

  return new;
end;
$$;

create or replace function public.bootstrap_first_super_admin(target_email text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user auth.users%rowtype;
  target_profile_id uuid;
begin
  if exists (select 1 from public.profiles where role = 'super_admin') then
    raise exception 'A super_admin already exists. Use controlled role management for future changes.';
  end if;

  select *
    into target_user
    from auth.users
   where lower(email) = lower(target_email);

  if target_user.id is null then
    raise exception 'No auth user found for %.', target_email;
  end if;

  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    display_name,
    age_range,
    phone,
    country,
    role,
    account_status
  )
  values (
    target_user.id,
    coalesce(target_user.email, format('user-%s@placeholder.local', target_user.id)),
    coalesce(nullif(btrim(target_user.raw_user_meta_data ->> 'first_name'), ''), 'Propietaria'),
    coalesce(nullif(btrim(target_user.raw_user_meta_data ->> 'last_name'), ''), 'UniCourse'),
    nullif(btrim(target_user.raw_user_meta_data ->> 'display_name'), ''),
    public.parse_profile_age_range(target_user.raw_user_meta_data ->> 'age_range'),
    nullif(btrim(target_user.raw_user_meta_data ->> 'phone'), ''),
    nullif(btrim(target_user.raw_user_meta_data ->> 'country'), ''),
    'super_admin',
    'active'
  )
  on conflict (id) do update
    set role = 'super_admin',
        account_status = 'active',
        email = excluded.email;

  target_profile_id := target_user.id;

  insert into public.admin_audit_logs (actor_user_id, target_user_id, action, metadata)
  values (
    target_profile_id,
    target_profile_id,
    'bootstrap_super_admin',
    jsonb_build_object('email', lower(target_email))
  );

  return target_profile_id;
end;
$$;

create or replace function public.set_platform_role(
  target_profile_id uuid,
  target_role public.app_role_enum,
  reason text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  current_target public.profiles%rowtype;
  updated_target public.profiles%rowtype;
  audit_action public.admin_audit_action_enum;
begin
  if actor_id is null or not public.is_super_admin() then
    raise exception 'Only the super_admin can change admin roles.';
  end if;

  if target_role not in ('student', 'admin') then
    raise exception 'Role changes are limited to student and admin in this module.';
  end if;

  select *
    into current_target
    from public.profiles
   where id = target_profile_id
   for update;

  if current_target.id is null then
    raise exception 'Target user was not found.';
  end if;

  if current_target.role = 'super_admin' then
    raise exception 'The bootstrap super_admin cannot be changed from the dashboard.';
  end if;

  if current_target.role = target_role then
    return current_target;
  end if;

  if current_target.role = 'student' and target_role = 'admin' then
    audit_action := 'user_promoted_to_admin';
  elsif current_target.role = 'admin' and target_role = 'student' then
    audit_action := 'admin_demoted';
  else
    raise exception 'Unsupported role transition from % to %.', current_target.role, target_role;
  end if;

  update public.profiles
     set role = target_role,
         account_status = case
           when account_status = 'invited' then 'active'
           else account_status
         end
   where id = target_profile_id
   returning *
    into updated_target;

  insert into public.admin_audit_logs (actor_user_id, target_user_id, action, metadata)
  values (
    actor_id,
    target_profile_id,
    audit_action,
    jsonb_build_object(
      'previous_role', current_target.role,
      'next_role', target_role,
      'reason', nullif(btrim(reason), '')
    )
  );

  return updated_target;
end;
$$;

create or replace function public.create_course_from_admin(
  course_title text,
  requested_slug text,
  requested_short_description text default '',
  requested_full_description text default '',
  requested_difficulty public.course_difficulty_enum default 'all_levels'
)
returns public.courses
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  created_course public.courses%rowtype;
begin
  if actor_id is null or not public.is_admin() then
    raise exception 'Only admins can create courses.';
  end if;

  if course_title is null or length(btrim(course_title)) = 0 then
    raise exception 'Course title is required.';
  end if;

  if requested_slug is null or length(btrim(requested_slug)) = 0 then
    raise exception 'Course slug is required.';
  end if;

  insert into public.courses (
    title,
    slug,
    short_description,
    full_description,
    difficulty,
    status
  )
  values (
    btrim(course_title),
    btrim(requested_slug),
    coalesce(requested_short_description, ''),
    coalesce(requested_full_description, ''),
    coalesce(requested_difficulty, 'all_levels'),
    'draft'
  )
  returning *
    into created_course;

  insert into public.admin_audit_logs (actor_user_id, action, metadata)
  values (
    actor_id,
    'course_created',
    jsonb_build_object(
      'course_id', created_course.id,
      'title', created_course.title,
      'slug', created_course.slug
    )
  );

  return created_course;
end;
$$;

create or replace function public.upsert_student_course_access(
  target_student_profile_id uuid,
  target_course_id uuid,
  target_cohort_id uuid default null,
  enable_access boolean default true
)
returns public.enrollments
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_profile public.profiles%rowtype;
  existing_enrollment public.enrollments%rowtype;
  updated_enrollment public.enrollments%rowtype;
  audit_action public.admin_audit_action_enum;
begin
  if actor_id is null or not public.is_admin() then
    raise exception 'Only admins can manage course access.';
  end if;

  select *
    into target_profile
    from public.profiles
   where id = target_student_profile_id
   for update;

  if target_profile.id is null or target_profile.role <> 'student' then
    raise exception 'Course access can only be managed for student profiles.';
  end if;

  perform 1
    from public.courses
   where id = target_course_id;

  if not found then
    raise exception 'Target course was not found.';
  end if;

  if target_cohort_id is not null then
    perform 1
      from public.cohorts
     where id = target_cohort_id
       and course_id = target_course_id;

    if not found then
      raise exception 'Selected cohort does not belong to the selected course.';
    end if;
  end if;

  select *
    into existing_enrollment
    from public.enrollments
   where student_profile_id = target_student_profile_id
     and course_id = target_course_id
   order by created_at desc
   limit 1
   for update;

  if enable_access then
    if existing_enrollment.id is null then
      insert into public.enrollments (
        student_profile_id,
        course_id,
        cohort_id,
        status,
        access_state
      )
      values (
        target_student_profile_id,
        target_course_id,
        target_cohort_id,
        'active',
        'enabled'
      )
      returning *
        into updated_enrollment;
    else
      update public.enrollments
         set cohort_id = coalesce(target_cohort_id, existing_enrollment.cohort_id),
             status = case
               when existing_enrollment.status = 'completed' then 'completed'
               else 'active'
             end,
             access_state = 'enabled'
       where id = existing_enrollment.id
       returning *
        into updated_enrollment;
    end if;

    audit_action := 'course_access_granted';
  else
    if existing_enrollment.id is null then
      raise exception 'There is no existing enrollment to revoke.';
    end if;

    update public.enrollments
       set access_state = 'disabled',
           status = 'revoked'
     where id = existing_enrollment.id
     returning *
      into updated_enrollment;

    audit_action := 'course_access_revoked';
  end if;

  insert into public.admin_audit_logs (actor_user_id, target_user_id, action, metadata)
  values (
    actor_id,
    target_student_profile_id,
    audit_action,
    jsonb_build_object(
      'enrollment_id', updated_enrollment.id,
      'course_id', updated_enrollment.course_id,
      'cohort_id', updated_enrollment.cohort_id,
      'status', updated_enrollment.status,
      'access_state', updated_enrollment.access_state
    )
  );

  return updated_enrollment;
end;
$$;

grant select, insert on public.admin_audit_logs to authenticated;
grant select, insert, update, delete on public.admin_audit_logs to service_role;
grant execute on function public.parse_profile_age_range(text) to authenticated, service_role;
grant execute on function public.set_platform_role(uuid, public.app_role_enum, text) to authenticated, service_role;
grant execute on function public.create_course_from_admin(text, text, text, text, public.course_difficulty_enum) to authenticated, service_role;
grant execute on function public.upsert_student_course_access(uuid, uuid, uuid, boolean) to authenticated, service_role;
grant execute on function public.bootstrap_first_super_admin(text) to service_role;

revoke all on function public.bootstrap_first_super_admin(text) from public, anon, authenticated;
revoke all on function public.set_platform_role(uuid, public.app_role_enum, text) from anon;
revoke all on function public.create_course_from_admin(text, text, text, text, public.course_difficulty_enum) from anon;
revoke all on function public.upsert_student_course_access(uuid, uuid, uuid, boolean) from anon;

alter table public.admin_audit_logs enable row level security;

drop policy if exists "profiles_insert_self_or_admin" on public.profiles;
drop policy if exists "profiles_update_self_or_admin" on public.profiles;

create policy "profiles_insert_self_or_super_admin"
on public.profiles
for insert
to authenticated
with check (id = auth.uid() or public.is_super_admin());

create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "profiles_update_super_admin"
on public.profiles
for update
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "admin_audit_logs_select_admins"
on public.admin_audit_logs
for select
to authenticated
using (public.is_admin());

create policy "admin_audit_logs_insert_admins"
on public.admin_audit_logs
for insert
to authenticated
with check (public.is_admin() and actor_user_id = auth.uid());
