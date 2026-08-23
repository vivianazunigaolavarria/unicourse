create or replace function public.sync_auth_users_into_profiles()
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  inserted_count integer := 0;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Only admins can sync auth users into profiles.';
  end if;

  with inserted_rows as (
    insert into public.profiles (
      id,
      first_name,
      last_name,
      display_name,
      email,
      phone,
      country,
      date_of_birth,
      occupation,
      age_range,
      role,
      account_status,
      created_at
    )
    select
      user_row.id,
      coalesce(
        nullif(btrim(user_row.raw_user_meta_data ->> 'first_name'), ''),
        nullif(split_part(coalesce(user_row.email, ''), '@', 1), ''),
        'Nueva'
      ),
      coalesce(nullif(btrim(user_row.raw_user_meta_data ->> 'last_name'), ''), 'Usuaria'),
      nullif(btrim(user_row.raw_user_meta_data ->> 'display_name'), ''),
      coalesce(user_row.email, format('user-%s@placeholder.local', user_row.id)),
      nullif(btrim(user_row.raw_user_meta_data ->> 'phone'), ''),
      nullif(btrim(user_row.raw_user_meta_data ->> 'country'), ''),
      public.parse_profile_birth_date(user_row.raw_user_meta_data ->> 'date_of_birth'),
      public.parse_profile_occupation(user_row.raw_user_meta_data ->> 'occupation'),
      public.compute_profile_age_range(public.parse_profile_birth_date(user_row.raw_user_meta_data ->> 'date_of_birth')),
      'student',
      case
        when user_row.email_confirmed_at is null then 'invited'
        else 'active'
      end,
      coalesce(user_row.created_at, now())
    from auth.users as user_row
    left join public.profiles as profile_row
      on profile_row.id = user_row.id
    where profile_row.id is null
      and user_row.email is not null
    returning 1
  )
  select count(*)
    into inserted_count
    from inserted_rows;

  update public.profiles as profile_row
     set email = coalesce(nullif(btrim(profile_row.email), ''), coalesce(user_row.email, format('user-%s@placeholder.local', user_row.id))),
         phone = coalesce(profile_row.phone, nullif(btrim(user_row.raw_user_meta_data ->> 'phone'), '')),
         country = coalesce(profile_row.country, nullif(btrim(user_row.raw_user_meta_data ->> 'country'), '')),
         account_status = case
           when profile_row.account_status in ('suspended', 'archived') then profile_row.account_status
           when user_row.email_confirmed_at is null then 'invited'
           else 'active'
         end
    from auth.users as user_row
   where user_row.id = profile_row.id;

  return inserted_count;
end;
$$;

grant execute on function public.sync_auth_users_into_profiles() to authenticated, service_role;

revoke all on function public.sync_auth_users_into_profiles() from public, anon;
