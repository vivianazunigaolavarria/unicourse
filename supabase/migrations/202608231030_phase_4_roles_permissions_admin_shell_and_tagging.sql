alter type public.admin_audit_action_enum add value if not exists 'tag_created';
alter type public.admin_audit_action_enum add value if not exists 'tag_updated';
alter type public.admin_audit_action_enum add value if not exists 'tag_assigned';
alter type public.admin_audit_action_enum add value if not exists 'tag_removed';

do $$
begin
  if not exists (
    select 1
      from pg_type t
      join pg_namespace n on n.oid = t.typnamespace
     where t.typname = 'tag_source_enum'
       and n.nspname = 'public'
  ) then
    create type public.tag_source_enum as enum ('manual', 'automatic');
  end if;
end
$$;

alter table public.tags
  add column if not exists source public.tag_source_enum not null default 'manual',
  add column if not exists system_key text;

create unique index if not exists uq_tags_system_key on public.tags (system_key);

create or replace function public.normalize_tag_key(raw_value text)
returns text
language sql
immutable
as $$
  select trim(
    both '-'
    from regexp_replace(
      lower(
        translate(
          coalesce(raw_value, ''),
          'ÁÀÄÂáàäâÉÈËÊéèëêÍÌÏÎíìïîÓÒÖÔóòöôÚÙÜÛúùüûÑñÇç',
          'AAAAaaaaEEEEeeeeIIIIiiiiOOOOooooUUUUuuuuNnCc'
        )
      ),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  );
$$;

create or replace function public.resolve_profile_automatic_age_label(
  input_date date,
  fallback_range public.profile_age_range_enum default null
)
returns text
language plpgsql
stable
as $$
declare
  years integer;
begin
  if input_date is not null then
    years := date_part('year', age(current_date, input_date));

    if years < 30 then
      return '<30';
    elsif years < 40 then
      return '30-39';
    elsif years < 50 then
      return '40-49';
    elsif years < 60 then
      return '50-59';
    else
      return '60+';
    end if;
  end if;

  case fallback_range
    when 'under_30' then return '<30';
    when '30_39' then return '30-39';
    when '40_49' then return '40-49';
    when '50_59' then return '50-59';
    when '60_69' then return '60+';
    when '70_plus' then return '60+';
    else return null;
  end case;
end;
$$;

create or replace function public.resolve_profile_region(country_name text)
returns text
language plpgsql
immutable
as $$
declare
  normalized_country text := lower(btrim(coalesce(country_name, '')));
begin
  if normalized_country = '' then
    return null;
  end if;

  if normalized_country in (
    'méxico', 'mexico',
    'argentina',
    'bolivia',
    'brasil',
    'chile',
    'colombia',
    'costa rica',
    'cuba',
    'ecuador',
    'el salvador',
    'guatemala',
    'honduras',
    'nicaragua',
    'panamá', 'panama',
    'paraguay',
    'perú', 'peru',
    'puerto rico',
    'república dominicana', 'republica dominicana',
    'uruguay',
    'venezuela'
  ) then
    return 'Latinoamérica';
  end if;

  if normalized_country in ('canadá', 'canada', 'estados unidos') then
    return 'Norteamérica';
  end if;

  if normalized_country in (
    'alemania',
    'austria',
    'bélgica', 'belgica',
    'dinamarca',
    'españa', 'espana',
    'finlandia',
    'francia',
    'grecia',
    'irlanda',
    'italia',
    'noruega',
    'países bajos', 'paises bajos',
    'polonia',
    'portugal',
    'reino unido',
    'república checa', 'republica checa',
    'rumania',
    'suecia',
    'suiza',
    'turquía', 'turquia'
  ) then
    return 'Europa';
  end if;

  if normalized_country in ('australia', 'nueva zelanda') then
    return 'Oceanía';
  end if;

  if normalized_country in ('corea del sur', 'filipinas', 'india', 'israel', 'japón', 'japon', 'singapur') then
    return 'Asia';
  end if;

  if normalized_country in ('marruecos', 'sudáfrica', 'sudafrica') then
    return 'África';
  end if;

  return null;
end;
$$;

create or replace function public.ensure_automatic_tag(
  tag_name text,
  tag_category text,
  tag_color text,
  automatic_system_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  ensured_tag_id uuid;
begin
  insert into public.tags (name, category, color, source, system_key, archived_at)
  values (
    btrim(tag_name),
    nullif(btrim(coalesce(tag_category, '')), ''),
    nullif(btrim(coalesce(tag_color, '')), ''),
    'automatic',
    automatic_system_key,
    null
  )
  on conflict (system_key) do update
    set name = excluded.name,
        category = excluded.category,
        color = excluded.color,
        source = excluded.source,
        archived_at = null
  returning id
    into ensured_tag_id;

  return ensured_tag_id;
end;
$$;

create or replace function public.sync_profile_automatic_tags(target_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_profile public.profiles%rowtype;
  automatic_tag_ids uuid[] := '{}'::uuid[];
  country_label text;
  region_label text;
  age_label text;
  automatic_tag_id uuid;
begin
  select *
    into target_profile
    from public.profiles
   where id = target_profile_id;

  if target_profile.id is null then
    return;
  end if;

  country_label := nullif(btrim(coalesce(target_profile.country, '')), '');
  region_label := public.resolve_profile_region(country_label);
  age_label := public.resolve_profile_automatic_age_label(target_profile.date_of_birth, target_profile.age_range);

  if age_label is not null then
    automatic_tag_id := public.ensure_automatic_tag(
      age_label,
      'age_range',
      '#6b5ce0',
      format('age:%s', public.normalize_tag_key(age_label))
    );
    automatic_tag_ids := array_append(automatic_tag_ids, automatic_tag_id);
  end if;

  if country_label is not null then
    automatic_tag_id := public.ensure_automatic_tag(
      country_label,
      'country',
      '#7fdfc9',
      format('country:%s', public.normalize_tag_key(country_label))
    );
    automatic_tag_ids := array_append(automatic_tag_ids, automatic_tag_id);
  end if;

  if region_label is not null then
    automatic_tag_id := public.ensure_automatic_tag(
      region_label,
      'region',
      '#2fa98f',
      format('region:%s', public.normalize_tag_key(region_label))
    );
    automatic_tag_ids := array_append(automatic_tag_ids, automatic_tag_id);
  end if;

  delete from public.user_tags ut
   using public.tags t
   where ut.profile_id = target_profile_id
     and ut.tag_id = t.id
     and t.source = 'automatic';

  insert into public.user_tags (profile_id, tag_id, assigned_by_profile_id)
  select target_profile_id, tag_id, null
    from unnest(automatic_tag_ids) as tag_id
  on conflict (profile_id, tag_id) do nothing;
end;
$$;

create or replace function public.sync_profile_automatic_tags_after_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_profile_automatic_tags(new.id);
  return new;
end;
$$;

drop trigger if exists sync_profile_automatic_tags_after_write on public.profiles;
create trigger sync_profile_automatic_tags_after_write
after insert or update of date_of_birth, age_range, country on public.profiles
for each row execute function public.sync_profile_automatic_tags_after_write();

do $$
declare
  profile_row record;
begin
  for profile_row in
    select id
      from public.profiles
  loop
    perform public.sync_profile_automatic_tags(profile_row.id);
  end loop;
end
$$;

grant execute on function public.normalize_tag_key(text) to authenticated, service_role;
grant execute on function public.resolve_profile_automatic_age_label(date, public.profile_age_range_enum) to authenticated, service_role;
grant execute on function public.resolve_profile_region(text) to authenticated, service_role;
grant execute on function public.ensure_automatic_tag(text, text, text, text) to service_role;
grant execute on function public.sync_profile_automatic_tags(uuid) to service_role;
