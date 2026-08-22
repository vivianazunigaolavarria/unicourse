do $$
begin
  if not exists (
    select 1
      from pg_type t
      join pg_namespace n on n.oid = t.typnamespace
     where t.typname = 'profile_occupation_enum'
       and n.nspname = 'public'
  ) then
    create type public.profile_occupation_enum as enum (
      'employed_professional',
      'entrepreneur',
      'business_owner',
      'homemaker',
      'caregiver',
      'student',
      'freelancer',
      'career_transition',
      'retired',
      'other',
      'prefer_not_to_say'
    );
  end if;
end
$$;

alter table public.profiles
  add column if not exists date_of_birth date,
  add column if not exists occupation public.profile_occupation_enum;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conrelid = 'public.profiles'::regclass
       and conname = 'profiles_date_of_birth_after_1900'
  ) then
    alter table public.profiles
      add constraint profiles_date_of_birth_after_1900
      check (date_of_birth is null or date_of_birth >= date '1900-01-01');
  end if;
end
$$;

create or replace function public.parse_profile_occupation(raw_value text)
returns public.profile_occupation_enum
language plpgsql
immutable
as $$
begin
  if raw_value is null or btrim(raw_value) = '' then
    return null;
  end if;

  if raw_value in (
    'employed_professional',
    'entrepreneur',
    'business_owner',
    'homemaker',
    'caregiver',
    'student',
    'freelancer',
    'career_transition',
    'retired',
    'other',
    'prefer_not_to_say'
  ) then
    return raw_value::public.profile_occupation_enum;
  end if;

  return null;
end;
$$;

create or replace function public.parse_profile_birth_date(raw_value text)
returns date
language plpgsql
immutable
as $$
begin
  if raw_value is null or btrim(raw_value) = '' then
    return null;
  end if;

  begin
    return raw_value::date;
  exception
    when others then
      return null;
  end;
end;
$$;

create or replace function public.compute_profile_age_range(input_date date)
returns public.profile_age_range_enum
language plpgsql
stable
as $$
declare
  years integer;
begin
  if input_date is null then
    return null;
  end if;

  years := date_part('year', age(current_date, input_date));

  if years < 30 then
    return 'under_30';
  elsif years < 40 then
    return '30_39';
  elsif years < 50 then
    return '40_49';
  elsif years < 60 then
    return '50_59';
  elsif years < 70 then
    return '60_69';
  else
    return '70_plus';
  end if;
end;
$$;

create or replace function public.sync_profile_derived_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.first_name := btrim(new.first_name);
  new.last_name := btrim(new.last_name);
  new.display_name := nullif(btrim(coalesce(new.display_name, '')), '');
  new.email := nullif(btrim(coalesce(new.email, '')), '');
  new.phone := nullif(btrim(coalesce(new.phone, '')), '');
  new.country := nullif(btrim(coalesce(new.country, '')), '');

  if new.date_of_birth is not null and new.date_of_birth > current_date then
    raise exception 'Date of birth cannot be in the future.';
  end if;

  new.age_range := public.compute_profile_age_range(new.date_of_birth);
  return new;
end;
$$;

update public.profiles p
   set date_of_birth = coalesce(p.date_of_birth, public.parse_profile_birth_date(u.raw_user_meta_data ->> 'date_of_birth')),
       occupation = coalesce(p.occupation, public.parse_profile_occupation(u.raw_user_meta_data ->> 'occupation')),
       country = coalesce(nullif(btrim(p.country), ''), nullif(btrim(u.raw_user_meta_data ->> 'country'), ''))
  from auth.users u
 where u.id = p.id;

update public.profiles
   set age_range = public.compute_profile_age_range(date_of_birth)
 where date_of_birth is not null;

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
  resolved_birth_date date;
  resolved_occupation public.profile_occupation_enum;
begin
  resolved_first_name := coalesce(
    nullif(btrim(metadata ->> 'first_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Nueva'
  );
  resolved_last_name := coalesce(nullif(btrim(metadata ->> 'last_name'), ''), 'Usuaria');
  resolved_birth_date := public.parse_profile_birth_date(metadata ->> 'date_of_birth');
  resolved_occupation := public.parse_profile_occupation(metadata ->> 'occupation');

  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    display_name,
    phone,
    country,
    date_of_birth,
    occupation,
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
    resolved_birth_date,
    resolved_occupation,
    public.compute_profile_age_range(resolved_birth_date),
    'student',
    case
      when new.email_confirmed_at is null then 'invited'
      else 'active'
    end
  )
  on conflict (id) do update
    set email = excluded.email,
        first_name = coalesce(public.profiles.first_name, excluded.first_name),
        last_name = coalesce(public.profiles.last_name, excluded.last_name),
        date_of_birth = coalesce(public.profiles.date_of_birth, excluded.date_of_birth),
        occupation = coalesce(public.profiles.occupation, excluded.occupation),
        country = coalesce(public.profiles.country, excluded.country);

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

  if new.age_range is distinct from old.age_range and new.date_of_birth is not distinct from old.date_of_birth then
    raise exception 'Age range is derived from the date of birth.';
  end if;

  return new;
end;
$$;

drop trigger if exists sync_profiles_derived_fields_before_write on public.profiles;
create trigger sync_profiles_derived_fields_before_write
before insert or update on public.profiles
for each row execute function public.sync_profile_derived_fields();
