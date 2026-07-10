# Single-Owner Authentication and Approved-User Security Assessment

## Scope and assessment boundary

This Task 180 assessment is a 4X, repository-only review of BDFA authentication, browser-visible Supabase access, cloud-snapshot ownership, and proposed single-owner authorization architecture. It does not prove the state of the deployed Supabase project, alter runtime behavior, apply SQL, change authentication settings, or access production credentials.

The assessment uses repository evidence from the current `main` baseline and read-only review of open PRs #108 and #109. Any conclusion labelled **deployed-state pending** requires later live verification against the target Supabase project.

## Executive finding

BDFA already ships a browser Supabase client for email/password authentication and cloud snapshots, contrary to older planning documents that describe it as having no auth or database. The current client exposes Sign Up, allows any account that Supabase accepts to sign in, and has no approved-user check. Current `main` contains no tracked migration or RLS policy for the referenced snapshot table. Therefore, the repository cannot establish that financial snapshots are protected from an authenticated but unapproved user or that legacy permissive policies are absent in production.

Do not add provider integrations, real financial data, or additional user-owned tables until the later implementation phases have been approved, implemented, and live-tested.

## Repository evidence and material discrepancies

| Area | Repository evidence | Assessment |
|---|---|---|
| Auth runtime | `index.html`, `js/supabase-client.js`, and `js/app.js` load and use the Supabase browser SDK. | Authentication is implemented in the static frontend. |
| Snapshot persistence | `js/supabase-client.js` references only `public.bdfa_source_snapshots`. | This is the only current user-owned table referenced by runtime code. |
| Current SQL | No tracked `supabase/` directory or `.sql` migration exists on current `main`. | Current repository RLS evidence is absent. Deployed state is unknown. |
| PR #108 | Unmerged proposal adds owner-only RLS for `bdfa_source_snapshots`. | It is not part of current `main`, does not prove deployment, and does not require approved-user status. |
| PR #109 / Task 179 | Unmerged documentation proposes a protected approved-user allowlist and blocks Plaid pending Task 179 approval. | Treat as future direction, not merged implementation. |
| Older backend documentation | `docs/BACKEND_ARCHITECTURE.md` still says BDFA has no auth, database, or Supabase wiring. | Materially stale; current code has auth and cloud-save wiring. |
| Product direction | `docs/PRODUCT_DIRECTION.md` requires one approved owner and disabled public signup. | Current Sign Up UI and `auth.signUp` call do not yet meet this direction. |

## Current authentication flow

### Implemented browser flow

| Capability | Repository behavior | Risk or gap |
|---|---|---|
| Login | `supabase.auth.signInWithPassword(email, password)` is called from `js/supabase-client.js`. | No post-login approved-user authorization check exists. |
| Signup | The rendered UI includes Sign Up and calls `supabase.auth.signUp` with an email confirmation redirect to the current app URL. | Public registration is available in the client and conflicts with the intended single-owner model. Dashboard settings are still unverified. |
| Password reset | No `resetPasswordForEmail`, reset screen, or recovery handler is present. | Owner recovery is not implemented in the app and must be preserved in a later auth phase. |
| OAuth | No OAuth sign-in call or provider configuration is present. | No repository OAuth flow exists; dashboard/provider settings remain unverified. |
| Session restoration | Startup calls `getSession()` through `getUser()`, then calls cloud load. An `onAuthStateChange` subscription invokes cloud sync after auth changes. | The client supplies no explicit session persistence options, so browser session-storage behavior relies on SDK defaults and requires later live/browser verification. |
| Logout | `supabase.auth.signOut()` is called; UI returns to local mode. | Sign-out does not clear locally stored financial data or local restore backups. |
| Client identity check | Snapshot calls obtain `session.user.id` and use it in the query/upsert payload. | This is a convenience/ownership hint only. It is not authorization and can be forged in a browser request. |
| Server-side identity check | No serverless function, backend endpoint, or server-side authorization code is tracked. | Database RLS must be the enforcement point until a future server boundary is approved. |
| Authenticated but unapproved identity | No allowlist lookup, enabled flag, or rejection path exists. | Any authenticated identity reaches cloud-save/load code; actual database access depends entirely on unknown deployed RLS. |

## Browser-visible Supabase configuration and token exposure

The browser loads `@supabase/supabase-js` from a CDN, then loads `js/supabase-config.js` before `js/supabase-client.js`. The configuration object contains a Supabase project URL and a publishable/anon key, both browser-visible by design. This assessment intentionally does not reproduce either value.

The current client constructs `createClient(url, anonKey)` without custom session-storage options. The application itself does not store a service-role key, provider token, password, or session token in its own code. The publishable/anon key is not a secret, but its safety depends on correct RLS and least-privilege grants.

Repository scans found no `SUPABASE_SERVICE_ROLE`, `sb_secret_`, common JWT-like secret, OpenAI, GitHub, AWS, Google, or private-key signature. A `service_role` text match exists only in historical-security wording in the project record, not as a credential. This scan is evidence against committed common secret patterns, not proof that Vercel or Supabase environment settings are safe.

## Financial-data ownership and local fallback model

### Cloud snapshot table

Runtime code references `public.bdfa_source_snapshots` and assumes at least these fields:

| Field | Runtime use | Ownership observation |
|---|---|---|
| `user_id` | Browser sets it to the current authenticated user's id; reads filter with `.eq('user_id', user.id)`. | Browser input is forgeable; RLS must enforce both existing-row and new-row ownership. |
| `source_data` | Full validated source snapshot is read and written. | Contains financial source data and requires owner-only access. |
| `updated_at` | Browser writes an ISO timestamp and reads it for sync messaging. | It is not an authorization control. |

The write path uses an upsert with conflict target `user_id`. The current runtime has no explicit cloud-delete call. Load reads a single row; save inserts or updates the snapshot. All source-data validation occurs client-side and does not substitute for database authorization.

### Local data and identity transitions

When Supabase is unavailable, signed out, or cloud operations fail, BDFA continues with localStorage data. It stores source collections, a pre-cloud-restore backup, cloud-dirty state, last-known cloud timestamp, panel state, and community-feedback drafts locally. Logout changes auth state but does not clear those local records.

This is a shared-device risk: a later browser user may see prior local financial data even after Supabase logout. The later authentication phase must decide and test a safe account-switch policy, including explicit warnings and a non-destructive way to separate or clear local data only with owner confirmation.

## RLS evidence

### Current main branch

| User-owned table | RLS status represented on current `main` | Policies represented on current `main` | Deployed-state conclusion |
|---|---|---|---|
| `public.bdfa_source_snapshots` | No tracked schema, migration, or RLS SQL. | None. | Unknown; live catalog inspection and negative tests are required. |

Planning documents describe future user-owned records for accounts, bills, allocations, investments, recurring income, assets, transactions, liabilities, preferences, and source snapshots. They are not current database-table evidence and must not be assumed to exist or be secured in production.

### PR #108 proposal, not current implementation

PR #108 proposes `enable row level security` and `force row level security` on `public.bdfa_source_snapshots`, with these policies for role `authenticated`:

| Policy | Command | `USING` | `WITH CHECK` |
|---|---|---|---|
| `bdfa_source_snapshots_select_own` | SELECT | `auth.uid() = user_id` | N/A |
| `bdfa_source_snapshots_insert_own` | INSERT | N/A | `auth.uid() = user_id` |
| `bdfa_source_snapshots_update_own` | UPDATE | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `bdfa_source_snapshots_delete_own` | DELETE | `auth.uid() = user_id` | N/A |

The proposed ownership predicates correctly address a forged `user_id` and ownership reassignment during UPDATE. They are still insufficient for BDFA's intended single-owner model because they permit every authenticated user to operate on their own row and do not check an enabled approved-user record. They only drop four same-named policies; unknown differently named or permissive legacy policies could remain active. PR #108 is unmerged, so it supplies no deployed-state evidence.

Before implementation, inspect `pg_class.relrowsecurity`, `pg_class.relforcerowsecurity`, `pg_policies`, table grants, exposed-schema/Data API settings, views, functions, triggers, and all policies on every user-owned table in the live project. Do not claim RLS is correct until those checks and live negative tests pass.

## Approved-user architecture proposal

### Proposed protected allowlist

Use a single protected allowlist table, for example `public.approved_users`, instead of repeating an owner identifier in each financial-table policy.

| Field | Recommendation |
|---|---|
| `user_id uuid` | Primary key; `NOT NULL`; foreign key to `auth.users(id)` with deletion behavior chosen deliberately during implementation. Prefer preventing accidental removal of the approved owner over an automatic cascade. |
| `approved_email text` | Required audit and recovery reference, normalized consistently, but not the authorization key. Do not expose it to browser clients. |
| `enabled boolean` | `NOT NULL DEFAULT false` so a new record is not usable until explicitly enabled. |
| `created_at timestamptz` | `NOT NULL DEFAULT now()`. |
| `updated_at timestamptz` | `NOT NULL DEFAULT now()` and maintained by a reviewed trigger or explicit privileged update path. |
| `notes` / audit metadata | Optional, restricted administrative metadata only; never browser-readable. |

Normal browser clients should have no direct SELECT, INSERT, UPDATE, or DELETE access to this table. Enable RLS and use a deny-by-default posture. Allowlist changes should occur only through a separately approved, tightly controlled administrative/bootstrap process—not a browser UI and not an unauthenticated RPC.

### Reusable approval helper

A narrow helper is justified because directly reading an RLS-protected allowlist from financial-table policies risks policy recursion and would expose an authorization table to ordinary clients. Prefer a boolean-only helper in a non-exposed schema, such as `private.is_current_user_approved()`, that checks only whether `auth.uid()` has an enabled allowlist record.

If a `SECURITY DEFINER` helper is used, it must:

- return only a boolean and perform no writes;
- use a fixed, hardened `search_path` (prefer an empty path with fully qualified object names);
- validate that `auth.uid()` is not null;
- reference only the protected allowlist table;
- revoke default `EXECUTE` from `PUBLIC` and grant only the minimum role needed for RLS evaluation;
- live outside an exposed API schema where practical;
- have no dynamic SQL and no caller-controlled table, schema, or identifier inputs;
- be reviewed for owner, grants, recursion, and `bypassrls` behavior before deployment.

Prefer a `SECURITY INVOKER` design when it can meet the requirement without exposing the table or creating recursion. Do not use `SECURITY DEFINER` merely to bypass a permission error.

### Lifecycle rules

- **Disable owner:** Set `enabled = false` only through a reviewed recovery procedure. All new data operations must fail immediately after a fresh authorization check. Existing sessions and token freshness must be considered; logout/revoke sessions before relying on the disabled state.
- **Email change:** Authorization remains keyed to immutable `user_id`. Update `approved_email` only in the privileged workflow after verifying the authenticated account and recovery implications; never authorize by editable user metadata or client-supplied email.
- **Account recovery:** Preserve Supabase password recovery for the approved account, but test it before disabling signup. Recovery must not create a usable unapproved identity and must not require exposing the allowlist table.
- **Bootstrap and lockout prevention:** Establish and verify exactly one enabled owner record before enforcing the helper on financial tables. Prepare a tested, privileged rollback path before changing signup or RLS.

## Authoritative authorization rule

Every user-owned financial-row policy should enforce one reusable rule:

1. the request is authenticated;
2. `auth.uid()` equals the row's `user_id`; and
3. the current authenticated identity has an enabled approved-user record.

For INSERT and UPDATE, place the row-ownership and approval requirements in `WITH CHECK`; for SELECT, UPDATE target selection, and DELETE, place them in `USING`. UPDATE needs both clauses. The helper centralizes approval status, while the row predicate remains explicit per table. This avoids hard-coded owner identifiers and prevents an authenticated second account from receiving access merely because it has its own row.

## Future public-signup shutdown plan

Do not execute these steps in Task 180.

1. Inventory the current production Auth settings, providers, redirect URLs, email-confirmation behavior, and existing owner identity without recording private identifiers in repository docs.
2. Create and verify the protected allowlist and one enabled owner record in a reversible, reviewed phase.
3. Apply the reusable approval rule to every user-owned table and verify approved-owner CRUD before changing Auth settings.
4. Test password reset and recovery for the approved owner, including the confirmation redirect and a fresh-session sign-in.
5. Disable unrestricted email/password signup in Supabase Auth settings only after owner access and recovery are proven.
6. If OAuth is enabled later, prevent first-time OAuth sign-in from becoming usable without an enabled allowlist record; do not treat a provider email claim as authorization.
7. Reject authenticated but unapproved identities at database authorization boundaries and provide a safe, non-sensitive app message in a later UI/auth task.
8. Revoke or expire stale sessions as appropriate, run negative tests, and retain a rollback procedure that restores the approved owner without opening public signup.

## Threat model

| Threat | Required later control |
|---|---|
| Anonymous access | RLS enabled, no anonymous table privileges, and explicit anonymous CRUD negative tests. |
| Unauthorized authenticated user | Enabled allowlist check plus per-row `auth.uid() = user_id` rule. |
| Accidentally created second user | Disable public signup and ensure unapproved users fail all financial-table operations. |
| Stolen browser session | Short/managed session lifetime, logout/revocation procedure, fresh approval evaluation, and shared-device local-data protections. |
| Leaked anon key | Treat as expected public configuration; rely on RLS, grants, and rate/abuse controls rather than secrecy. |
| Leaked service-role key | Never ship it to browsers or commit it; rotate immediately and audit access if exposure is found. |
| Permissive legacy RLS policy | Inventory every live policy and grant; remove or replace only in a reviewed migration, then run negative tests. |
| Forged `user_id` request | `WITH CHECK` ownership predicate and approved-user predicate on insert/update. |
| Insecure SECURITY DEFINER function | Non-exposed schema, fixed search path, minimal grants, boolean-only behavior, no dynamic SQL, and live review. |
| Allowlist modification by browser client | No browser grants or RPC write path for `approved_users`; privileged administrative workflow only. |
| Owner lockout | Bootstrap enabled owner first, test recovery, define rollback, and change one boundary at a time. |
| Malicious or accidental data deletion | Owner-only DELETE policy, backups, restoration procedure, and deletion tests. |
| Stale sessions after approval is disabled | Session revocation/refresh strategy and tests that a disabled record loses authorization. |
| Sensitive data in logs | Redact snapshot content, credentials, identifiers, and provider data; log only safe operational metadata. |
| Local data on shared device | Explicit local-data retention policy, account-switch warning, and owner-confirmed clear/restore behavior. |

## Required future negative-test plan

Run these against the deployed project with a configured approved owner and a separate authenticated but unapproved test identity. Never put real financial data, private emails, or identifiers in test records or repository logs.

| Test | Expected result |
|---|---|
| Anonymous SELECT / INSERT / UPDATE / DELETE | Denied or no rows; no financial data exposed. |
| Approved owner CRUD | Only the approved owner can create, read, update, and delete their own permitted rows. |
| Authenticated but unapproved user CRUD | All operations fail or return no rows, including rows whose `user_id` matches that user's id. |
| Forged `user_id` INSERT | Rejected. |
| Ownership change during UPDATE | Rejected by `WITH CHECK`. |
| Insert another user's `user_id` | Rejected. |
| Disabled allowlist record | All financial CRUD becomes unavailable after required session refresh/revocation behavior is verified. |
| Deleted allowlist record | All financial CRUD becomes unavailable; recovery path is validated. |
| Expired and revoked session | Requests fail until a valid approved-owner session is restored. |
| Password reset and recovery | Approved owner can recover; reset does not create a usable unapproved account. |
| Logout | Remote access ends and local-data behavior follows the approved shared-device policy. |
| Legacy permissive-policy detection | Live catalog query proves all policies, grants, views, functions, and RLS flags conform to the approved design. |

## Separately reviewable implementation phases

| Phase | Scope | Recommended level |
|---|---|---|
| A — Approved-user schema and security design | Finalize allowlist schema, bootstrap/recovery process, helper-function decision, grants, rollback design, and live catalog baseline. No runtime change. | 4X |
| B — Migration and RLS implementation | Apply reviewed migrations for allowlist and financial-table policies; inventory and remove/replace legacy policies safely. | 4X |
| C — Authentication and signup enforcement | Disable unrestricted signup, preserve recovery, handle unapproved sessions, and define local-data account-switch behavior. | 4X |
| D — Automated and live negative testing | Execute anonymous, forged-ownership, unapproved-user, disable/recovery, session, and legacy-policy tests with safe fixtures. | 4X |
| E — Production deployment, rollback verification, and project record | Deploy in controlled order, verify production catalog and behavior, exercise rollback/recovery, and record evidence. | 4X |

No phase should begin without explicit approval of the preceding phase's evidence. Task 179 remains a separate provider-coverage gate; no Plaid or secondary-provider work begins here.

## Files and functions inspected

- `index.html` — browser auth controls and Supabase script order.
- `js/supabase-config.js` — browser-visible project URL and publishable/anon configuration fields.
- `js/supabase-client.js` — client construction; sign up, sign in, sign out, session lookup, snapshot load/save, auth-state subscription.
- `js/app.js` — rendered auth state, automatic cloud sync after auth, startup cloud load, logout handling, and local-mode messaging.
- `js/data-adapter.js` — cloud snapshot orchestration, local fallback, pre-cloud restore backup, and local source-data persistence.
- `docs/PRODUCT_DIRECTION.md`, `docs/ENGINEERING_CONSTITUTION.md`, `BACKLOG.md`, `docs/BACKEND_ARCHITECTURE.md`, `docs/SOURCE_DATA_CONTRACT.md`, `docs/roadmap.md`, and `docs/PROJECT_RECORD.md` — governing direction and documentation consistency.
- PR #108 — unmerged RLS migration proposal and RLS test-plan documentation.
- PR #109 — unmerged Task 179 coverage direction and approved-user preference.
- `vercel.json` — static-site clean-URL configuration only; no repository environment-variable references.

## Deployed-state verification still required

The repository cannot prove the deployed Supabase project, Auth configuration, redirect URLs, email confirmation settings, OAuth provider state, session persistence behavior, table schema, RLS flags, policy catalog, grants, views, functions, triggers, backups, or existing users. Those facts must be inspected and tested in later approved phases without exposing credentials or personal identifiers.

## Assessment conclusion

Task 180 establishes the required design and evidence boundary but does not implement it. The next action is **Phase A only**, pending review and explicit approval of this assessment. Do not merge PR #108 as the single-owner solution without redesigning it to include approved-user authorization and live legacy-policy verification.
