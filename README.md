# UniCourse

UniCourse is the new Next.js foundation for `unicourse.training`.

This repository now contains the UniCourse foundation plus Module 1:

- public landing page
- Supabase Auth sign up / sign in / sign out / password recovery
- student portal wired to real Supabase data
- protected admin area with role-aware navigation
- admin role management for the super admin
- audited course creation and course-access management
- UniCourse brand tokens extracted from the original Squarespace CSS
- setup files for Tailwind, TypeScript, and ESLint
- environment template for Supabase integration

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase client libraries

## Local setup

Use the bundled `pnpm`/`node` runtime available in Codex, or your own local Node 20.9+ environment.

```bash
pnpm install
pnpm dev
```

Then open:

- `/`
- `/iniciar-sesion`
- `/actualizar-contrasena`
- `/mis-cursos`
- `/admin`

If Turbopack causes environment-specific issues, the production build already falls back to Webpack through:

```bash
pnpm build
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_CALENDAR_ID` (optional, defaults to `primary`)
- `GOOGLE_CALENDAR_TIME_ZONE` (optional, defaults to `America/Mexico_City`)

The app still renders without local env vars, but the real auth and data features require the public Supabase values. The service-role key is only for protected backend or maintenance tasks and must never be exposed in the browser.
The Google variables are only needed for the admin scheduler that creates Google Meet sessions and sends Calendar invitations to enrolled students.

## Module 1 highlights

- Supabase Auth with persistent SSR sessions
- `profiles` sync from `auth.users`
- protected `/admin`
- searchable `/admin/students`
- `/admin/students/[id]` detail view
- `/admin/courses` plus `/admin/courses/new`
- `/admin/submissions`
- `/admin/admins` for the `super_admin`
- `admin_audit_logs`
- SQL bootstrap path for the first `super_admin`

## Google Meet scheduling

The admin page `/admin/sesiones-en-vivo` now supports:

- creating a published live class from the admin panel
- generating a Google Meet automatically through Google Calendar
- inviting the enrolled students of the selected course or cohort
- storing the event metadata back in `live_classes`

To make it work in a real environment, the Google account that will own the calendar must grant offline Calendar access and provide a refresh token with Calendar write scope.

## First super admin

After the platform owner creates an auth account in Supabase, run the migration set and then execute:

```sql
select public.bootstrap_first_super_admin('owner@example.com');
```

Run it only once. The function refuses to create a second bootstrap super admin.

## Domain plan

`unicourse.training` can stay registered in Squarespace while the application is hosted elsewhere.

Typical flow:

1. Deploy UniCourse to a real host.
2. Add `unicourse.training` or `www.unicourse.training` as a custom domain there.
3. Update the DNS records in Squarespace to point to the new host.
4. Leave Squarespace only as registrar/DNS if you want.
