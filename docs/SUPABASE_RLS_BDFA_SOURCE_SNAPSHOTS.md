# Supabase RLS: `bdfa_source_snapshots`

## Scope

This document covers Row Level Security for the Supabase table `public.bdfa_source_snapshots`, which stores each authenticated user's BDFA source-data snapshot for cloud save/load.

The frontend currently uses the public Supabase URL and publishable anon key from browser JavaScript. Those values are not database secrets by themselves; they are safe to ship only when Supabase Row Level Security is enabled and every user-owned table has owner-only policies. Authentication proves who the caller is, but RLS is what prevents one authenticated user from reading or writing another user's financial snapshot.

## Migration

Policy SQL is stored in:

- `supabase/migrations/20260710000000_bdfa_source_snapshots_rls.sql`

The migration explicitly enables and forces RLS on `public.bdfa_source_snapshots`.

## Policies Added

The migration adds these owner-only policies:

| Policy name | Command | Role | Restriction |
|---|---:|---|---|
| `bdfa_source_snapshots_select_own` | `SELECT` | `authenticated` | `USING (auth.uid() = user_id)` |
| `bdfa_source_snapshots_insert_own` | `INSERT` | `authenticated` | `WITH CHECK (auth.uid() = user_id)` |
| `bdfa_source_snapshots_update_own` | `UPDATE` | `authenticated` | `USING (auth.uid() = user_id)` and `WITH CHECK (auth.uid() = user_id)` |
| `bdfa_source_snapshots_delete_own` | `DELETE` | `authenticated` | `USING (auth.uid() = user_id)` |

`UPDATE` uses both `USING` and `WITH CHECK` so a user can only target their existing row and cannot change the row into another user's ownership. `INSERT` uses `WITH CHECK` so a user cannot create a snapshot with someone else's `user_id`. `DELETE` is owner-only if deletion is used by future maintenance or app behavior.

## Two-User Isolation Test Plan

Live Supabase verification requires a configured project and two real authenticated users. Do not mark this as passed unless it is executed against the target Supabase project.

1. Apply the migration to the target Supabase project.
2. Create or use two non-admin test users: User A and User B.
3. Sign in as User A using the public URL and publishable anon key.
4. Insert or upsert a `bdfa_source_snapshots` row where `user_id = auth.uid()` for User A; expect success.
5. Attempt to select User A's row while signed in as User A; expect exactly User A's row.
6. Sign in as User B using the same public URL and publishable anon key.
7. Attempt to select User A's row by filtering on User A's `user_id`; expect no rows.
8. Attempt to insert a row while signed in as User B with `user_id` set to User A's UUID; expect RLS rejection.
9. Attempt to update User A's row while signed in as User B; expect no affected rows or RLS rejection.
10. If delete behavior is exercised, attempt to delete User A's row while signed in as User B; expect no affected rows or RLS rejection.
11. Confirm User B can insert, select, update, and, if supported, delete only a row where `user_id = auth.uid()` for User B.

## Unauthenticated Access Test Plan

1. Use a Supabase client with only the public URL and publishable anon key, but do not sign in.
2. Attempt to select from `bdfa_source_snapshots`; expect denial or no accessible rows.
3. Attempt to insert a row with any `user_id`; expect RLS rejection because the request does not have the `authenticated` role and `auth.uid()` is null.
4. Attempt to update and delete rows; expect denial or no affected rows.

## Secret Handling

The migration and documentation do not contain service-role keys, passwords, tokens, or private credentials. Never commit a Supabase service-role key to this repository.
