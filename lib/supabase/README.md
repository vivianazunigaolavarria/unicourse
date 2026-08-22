# Supabase Types

This directory is reserved for generated Supabase database types.

Expected generated file:

- `database.types.ts`

Recommended regeneration command:

```bash
npx supabase gen types typescript --local > lib/supabase/database.types.ts
```

The file is intentionally not hand-maintained. It should be generated from the current database schema after migrations are applied.
