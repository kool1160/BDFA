# Normalized Schema Migration Runbook

## Status and boundary

Milestone 15 is complete as repository-only preparation. The SQL in
`supabase/migrations/20260715_normalized_financial_schema.sql` is a review
draft and has not been sent to Supabase. It requires the separately approved
single-owner foundation: `public.approved_users` and the hardened
`private.is_current_user_approved()` helper. It contains no owner identity,
email, credential, access token, or provider data.

## Review checklist before any live execution

1. Obtain explicit approval for live database and RLS execution.
2. Run the read-only catalog preflight in `supabase/security/01-preflight.sql`.
3. Confirm the approved-user foundation exists; verify helper ownership,
   fixed `search_path`, `SECURITY DEFINER` behavior, grants, and allowlist
   privacy. Never bootstrap an owner from a migration file.
4. Compare every table, constraint, index, and policy with the live catalog;
   stop if names collide or normalized data already exists.
5. Review backup, retention, and recovery behavior. The rollback draft drops
   all normalized tables and is destructive, not a routine down migration.
6. Test in a non-production project with synthetic records: approved-owner
   CRUD, anonymous denial, unapproved-authenticated denial, forged `user_id`
   denial, cross-owner foreign-key denial, and Data API role behavior.
7. Confirm owner-policy query plans and reconciliation uniqueness with
   representative synthetic volume.
8. Record checksum, catalog evidence, test identities, and commit/rollback
   decision without recording private values or tokens.

## Recovery and rollback

Do not run rollback for ordinary sync errors. Preserve the database and
investigate. A protected reversal requires stopped writes, a verified backup,
separate destructive-action approval, and confirmation that no normalized data
must be retained. The existing `bdfa_source_snapshots` recovery path remains.
