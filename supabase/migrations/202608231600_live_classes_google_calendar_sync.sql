alter table public.live_classes
  add column if not exists google_calendar_event_id text,
  add column if not exists google_calendar_html_link text,
  add column if not exists student_invite_count integer not null default 0,
  add column if not exists calendar_last_synced_at timestamptz,
  add column if not exists created_by_profile_id uuid references public.profiles (id) on delete set null;

alter table public.live_classes
  add constraint live_classes_student_invite_count_non_negative
  check (student_invite_count >= 0);

create unique index if not exists uq_live_classes_google_calendar_event_id
  on public.live_classes (google_calendar_event_id)
  where google_calendar_event_id is not null;
