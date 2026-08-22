# Supabase Database Workflow

This folder contains Milestone 2 for UniCourse:

- production-oriented PostgreSQL schema
- Row Level Security policies
- helper functions for secure role lookup
- development-only seed data

## What is in this milestone

- `migrations/202608220900_milestone_2_schema_and_rls.sql`
- `seed.sql`

## Key design decisions

### Role lookup

Roles are stored in `public.profiles.role`, which is linked one-to-one with `auth.users.id`.

RLS does **not** trust a browser-sent role. Policies use helper functions such as:

- `public.current_app_role()`
- `public.is_admin()`
- `public.can_manage_course()`
- `public.can_manage_cohort()`
- `public.can_view_course_content()`
- `public.can_review_submission()`

These functions read trusted database state using `auth.uid()` inside `SECURITY DEFINER` functions with an explicit `search_path`.

### Ordering strategy

`modules`, `lessons`, and `content_blocks` use a `position bigint` with gap-based ordering.

- initial positions are assigned in increments of `1024`
- inserts can usually fit between existing records without renumbering everything
- if a local group becomes crowded later, only that parent scope needs rebalancing

This is simpler than floating-point ordering and avoids renumbering large trees after every drag-and-drop move.

### Repeat enrollment strategy

`enrollments` uses a partial unique index that prevents duplicate concurrently active enrollments for the same student and course:

- allowed uniqueness scope: `(student_profile_id, course_id)`
- enforced only when `status in ('active', 'paused')` and `access_state = 'enabled'`

This allows historical completed or cancelled enrollments to remain intact, while still supporting a legitimate future retake.

### Assignment submission types

Accepted submission types are modeled with `assignment_submission_types`, not a JSON array.

That keeps the allowed combinations normalized, queryable, and easy to validate.

### Submission history

`submissions` stores one row per attempt.

- `attempt_number` is preserved
- `previous_submission_id` links resubmissions
- only one draft per assignment/enrollment is allowed at a time

This keeps academic history intact instead of overwriting a previous submission in place.

Review updates are additionally guarded so instructors can write review fields on relevant submissions without mutating the student-authored submission body or submission identity fields after creation.

### Tags

Tags are globally unique among active tags using a case-insensitive partial unique index on `lower(name)` where `archived_at is null`.

Categories are organizational metadata, not identity keys.

### Demographic privacy

`age_range` stays on `profiles`, but instructors are not granted broad `profiles` access.

For future instructor workflows, use the safe helper:

- `public.get_instructor_student_directory()`

That function returns only non-sensitive student identity and enrollment fields, so `age_range` is not exposed by default to instructors.

The schema also includes a trigger guard on `profiles` so self-service profile writes cannot escalate `role` or `account_status`. Students can update their own demographic/profile fields, but trusted role and status changes still require admin or service-side execution.

### Instructor access boundaries

Course content access and student-data access are intentionally separated.

- cohort instructors can read shared course structure for the course they teach
- cohort instructors do **not** automatically gain course-wide student access
- enrollment, submission, and student-directory access stays scoped through course/cohort assignment checks

This keeps the teaching experience workable without widening demographic or CRM exposure.

### Delete and archive strategy

Prefer archive/soft-delete for business records:

- `courses`, `modules`, `lessons`, `assignments`, and `live_classes` use `status`
- `tags` use `archived_at`
- `cohorts` use `status`

Avoid hard delete in normal operations for:

- `enrollments`
- `lesson_progress`
- `submissions`
- `submission_files`
- `activity_events`
- `admin_notes`

Child tables may still use `on delete cascade` where the parent should almost never be hard-deleted in production and where cleanup is desirable in local development or test resets.

## Optional future research fields

Future self-reported research attributes such as:

- occupation
- technology experience level
- primary learning interest

can be added as new nullable profile columns without redesigning the auth/profile relationship.

If the research model grows beyond a few stable fields, a separate one-to-one or one-to-many research table can be introduced later without changing course, enrollment, or permission architecture.

## Type generation strategy

Use Supabase-generated TypeScript types instead of maintaining manual database interfaces.

Recommended generated file path:

- `lib/supabase/database.types.ts`

Recommended command from the official Supabase CLI docs:

```bash
npx supabase gen types typescript --local > lib/supabase/database.types.ts
```

If generating from a linked remote project instead:

```bash
npx supabase gen types typescript --project-id "$PROJECT_REF" --schema public > lib/supabase/database.types.ts
```

## Local CLI workflow

Supabase’s official local-development flow is:

```bash
npx supabase init
npx supabase start
npx supabase db reset
```

If this repository has not been initialized with the Supabase CLI on a machine yet, run `npx supabase init` first so the CLI can generate `supabase/config.toml`.

After schema changes:

```bash
npx supabase db reset
npx supabase gen types typescript --local > lib/supabase/database.types.ts
```

## Validation status for this milestone

In this Codex environment:

- Docker was not available
- Supabase CLI was not installed

So the migration chain and seed strategy were created and reviewed in-repo, but they were **not** executed against a local Supabase stack here.
