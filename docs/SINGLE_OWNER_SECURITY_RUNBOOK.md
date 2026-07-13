# Single-Owner Security Execution Runbook

## Boundary

This runbook and its SQL are prepared implementation evidence only. Applying the SQL, changing Supabase Auth settings, deploying the client changes, or using live owner/test credentials requires Chris's explicit approval. Never record identifiers, emails, passwords, tokens, or snapshot contents in source control or logs.

## Preconditions

1. Confirm a current backup and a privileged recovery path.
2. Run `supabase/security/01-preflight.sql` read-only and compare the catalog with the Task 180 assessment. Stop on extra user-owned tables, multiple snapshot owners, null owners, unexpected views/functions/triggers, or permissive grants/policies.
3. In the Supabase dashboard, inspect email provider settings, signup state, redirect allowlist, session controls, and the existing owner's recovery readiness without copying private values into evidence.
4. Prepare one synthetic authenticated-but-unapproved test identity containing no real financial data.

## Controlled database change

Run `supabase/security/02-lock-to-approved-owner.sql` through an interactive `psql` session, supplying `owner_user_id` and `owner_email` as non-logged variables. The script starts a transaction, validates existing snapshot ownership, creates and bootstraps the protected allowlist, creates the hardened helper, replaces every snapshot policy, and prompts before commit. Any answer other than `true` rolls back.

Before `COMMIT`, verify the staged catalog, function owner/search path/grants, exactly one enabled approval row, snapshot RLS flags, and four policy expressions. Roll back on any mismatch. After commit, repeat the catalog preflight and live behavior tests; retain only redacted counts, policy definitions, and pass/fail evidence.

## Live behavior verification

Use disposable, non-financial fixtures and record pass/fail only.

| Identity | Verification | Expected result |
|---|---|---|
| Anonymous | SELECT, INSERT, UPDATE, DELETE | No rows or denied for every operation. |
| Approved owner | Own-row create, read, update, delete | Succeeds. Restore the original snapshot afterward. |
| Approved owner | Insert another `user_id`; change row ownership | Denied. |
| Authenticated unapproved test user | Own-row and forged-owner CRUD | No rows or denied for every operation. |
| Disabled owner | CRUD after session refresh/revocation | No rows or denied; then recover through privileged re-enable. |
| Expired/revoked session | Snapshot access | Denied until the approved owner signs in again. |

## Authentication and recovery order

1. Verify approved-owner sign-in and database CRUD after RLS is committed.
2. Add the production URL to the permitted password-recovery redirects and test the same-account recovery flow.
3. Disable new email/password signups in Supabase Auth settings. Do not disable email/password sign-in or recovery.
4. Deploy the prepared client only after recovery works. Confirm the signup UI is absent and a recovery event cannot trigger automatic cloud synchronization before the password is updated.
5. Verify direct signup through the Supabase API is rejected; hiding the browser button alone is not enforcement.
6. Verify logout ends remote access. Local browser data intentionally remains available in local mode; on a shared device, use the existing owner-confirmed reset/backup controls. A destructive automatic local clear is not introduced by this milestone.

## Rollback

Before commit, use `ROLLBACK`. After commit, prefer correcting or disabling the allowlist through the privileged database path; never reopen public signup as an authorization workaround. If the owner is locked out, restore the enabled owner record and prior reviewed policies through the privileged recovery session, verify access, and investigate before continuing.

## Completion evidence

Milestone 2 is complete only when the project record contains the redacted catalog result, approved/anonymous/unapproved CRUD results, recovery/signup/logout/session results, production commit, deployment, and rollback-readiness result. Until then, keep the backlog status active.
