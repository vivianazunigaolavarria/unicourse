# UniCourse

UniCourse is the new Next.js foundation for `unicourse.training`.

This folder contains Milestone 1:

- public landing shell
- Spanish-first login route
- student portal shell
- admin shell
- UniCourse brand tokens extracted from the original Squarespace CSS
- setup files for Tailwind, TypeScript, and ESLint
- environment template for future Supabase integration

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
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Milestone 1 does not require these values to build, but Milestone 2 will use them for the real database, auth, and storage connection.

## What comes next

Milestone 2 will add:

- reproducible Supabase/PostgreSQL schema
- migrations
- seed data
- role model
- initial RLS strategy

## Domain plan

`unicourse.training` can stay registered in Squarespace while the application is hosted elsewhere.

Typical flow:

1. Deploy UniCourse to a real host.
2. Add `unicourse.training` or `www.unicourse.training` as a custom domain there.
3. Update the DNS records in Squarespace to point to the new host.
4. Leave Squarespace only as registrar/DNS if you want.
