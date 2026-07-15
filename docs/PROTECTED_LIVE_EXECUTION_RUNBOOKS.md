# Protected-Live Execution Runbooks

**Milestone:** 17 — Create protected-live execution runbooks
**Status:** Repository-only preparation; no live action is authorized by this document

This document is the approval-gated execution plan for BDFA's blocked live
milestones. It is intentionally written so an operator can pause after every
protected step, preserve evidence, and recover without improvising. Use only
redacted evidence in project records. Never place emails, user IDs, account
numbers, provider tokens, secrets, raw provider payloads, or balances in GitHub,
logs, screenshots, or tickets.

## Common approval and evidence gate

Chris must explicitly approve the exact operation, environment, operator, and
rollback authority before any protected step begins. Approval for one section
does not authorize another section.

Before each change:

- record the repository commit and relevant file checksums;
- confirm the target is the intended non-production or production project;
- capture a redacted pre-change state and confirm its secure retention;
- verify a tested rollback or fail-closed containment path;
- define the abort condition and the person authorized to abort;
- open a time-bounded change record with start, stop, and evidence locations.

After each change, stop if any expected result differs from the checklist. Do
not continue through a failed security, ownership, token, migration, or data
reconciliation check.

## 1. Single-owner Supabase, Auth, and RLS

**Prerequisites:** Milestone 2 approval; approved owner identity supplied only
at execution time; privileged operator; recovery access; maintenance window;
and a securely captured pre-change catalog.

### Approval checklist

- [ ] Chris approved live catalog inspection, Auth setting changes, and the
  owner/RLS transaction separately.
- [ ] The operator ran the read-only
  `supabase/security/00-capture-current-security-state.sql` and
  `supabase/security/01-preflight.sql` scripts and retained redacted output.
- [ ] The preflight confirmed the expected snapshot table, row ownership, role
  grants, policies, triggers, and absence of unexpected owner rows.
- [ ] The approved owner account already exists, recovery works, and its
  identity is supplied securely rather than stored in the repository.
- [ ] Public signup is disabled in the Supabase Auth configuration, and the
  setting change has an independent before/after record.
- [ ] The operator reviewed `02-lock-to-approved-owner.sql` and supplied its
  execution variables through the secure SQL client mechanism.
- [ ] The transaction was staged and reviewed before the explicit commit
  prompt was answered.

### Verification checklist

- [ ] Approved owner can sign in, read, create, update, delete, and restore the
  existing snapshot path.
- [ ] Unauthenticated requests fail.
- [ ] An authenticated non-owner test identity cannot read or mutate rows.
- [ ] Forged or mismatched `user_id` values fail.
- [ ] `approved_users` is not readable by browser roles.
- [ ] Exactly one enabled approved owner exists.
- [ ] Logout, session refresh, password recovery, and recovery completion work.
- [ ] No browser or server log contains an email, token, password, or snapshot.

### Rollback and containment

Do not recreate old policies from memory. If the staged transaction has not
committed, answer the SQL commit prompt negatively and preserve the rollback
output. After commit, use the securely captured pre-change definitions and
grants to restore the prior state only with fresh approval. If access must be
blocked immediately, run `supabase/security/03-emergency-lockdown.sql`, verify
zero enabled owners and denied browser-role access, then restore from the
captured state through a separately reviewed change. Never re-enable public
signup as a recovery shortcut.

## 2. Secure backend runtime and provider secret storage

**Prerequisites:** Milestone 2 owner/RLS foundation verified; Chris approved a
runtime/deployment target and a secret-management service already available;
provider adapter contract tests passing; and no production provider account yet
connected.

### Selection and approval checklist

- [ ] Runtime is selected for server-only execution, private environment
  variables, least-privilege deployment, request timeouts, and audit logs.
- [ ] Deployment region, operator access, service account, and incident owner
  are recorded without storing credentials.
- [ ] Secret manager supports encryption at rest, access audit, rotation,
  revocation, backup/recovery, and environment separation.
- [ ] Browser receives only short-lived link/session material; permanent
  provider tokens never enter browser code, URLs, analytics, or logs.
- [ ] Database stores only an encrypted token ciphertext or opaque secret
  reference plus non-sensitive metadata; plaintext token retrieval is limited to
  one server request.
- [ ] Logging uses correlation IDs and safe error codes; request/response body,
  authorization headers, account identifiers, and provider payloads are denied.
- [ ] Rotation, deletion, operator offboarding, and emergency revocation have
  been tested with synthetic values.
- [ ] `docs/SECURE_PROVIDER_BACKEND_DESIGN.md` acceptance tests are mapped to
  CI or an approved test record before deployment.

### Rollback

Disable the deployment or route before changing stored secrets. Revoke the
synthetic/test secret, remove its ciphertext/reference, and confirm failed
requests produce only a safe connection-health event. For a real token,
disconnect at the provider first where supported, delete the secret, and retain
only a non-sensitive deletion event. Do not roll back by printing or copying a
previous secret.

## 3. Plaid Sandbox credential setup

**Prerequisites:** Backend runtime and secret manager approved; Plaid Sandbox
access approved; confirmed institution/account-type inventory supplied outside
the repository; and Milestone 6 protocol reviewed.

- [ ] Create or obtain Sandbox credentials through the approved operator path.
- [ ] Store them only in the approved secret manager or ephemeral local
  environment; verify they are absent from Git, shell history, CI output, and
  browser bundles.
- [ ] Use deterministic Sandbox fixtures first and record only the redacted
  labels and pass/partial/fail/unsupported results from
  `docs/PLAID_SANDBOX_COVERAGE_PROTOCOL.md`.
- [ ] Verify accounts/balances, transactions, liabilities, holdings,
  investment activity, refresh health, reauthentication, pagination, retry
  deduplication, and normalized-contract mapping as applicable.
- [ ] Confirm HealthEquity is explicitly tested; do not infer support from a
  generic institution directory.
- [ ] Delete or rotate Sandbox credentials after the test window and record
  deletion without the credential value.

Rollback is credential revocation and deletion, followed by disabling the
Sandbox route. No production credential may be substituted to repair a Sandbox
failure.

## 4. First live institution connection

**Prerequisites:** Milestones 2, 5, and 6 acceptance evidence complete; Chris
approved the named institution and data classes; production secret handling,
backup, disconnection, and support contacts are verified.

- [ ] Confirm the institution is the first approved test case and scope the
  minimum required data classes.
- [ ] Capture a pre-connection snapshot backup and verify it can be restored in
  a non-production test.
- [ ] Create a short-lived server-side link token; never accept a permanent
  token from the browser.
- [ ] Exchange and validate the provider token server-side, encrypt/store only
  the ciphertext or secret reference, and record safe connection metadata.
- [ ] Run one bounded sync with idempotency/cursor tracking and no derived-data
  migration.
- [ ] Reconcile account count, data-class coverage, source timestamps, and
  duplicate/pending-to-posted behavior using redacted counts and statuses.
- [ ] Verify stale, partial, provider-error, and reauthentication states.
- [ ] Obtain Chris's explicit approval before expanding refresh scope or adding
  another institution.

Rollback is: stop sync jobs, revoke/disconnect the provider connection, delete
the stored token, restore the pre-connection snapshot if required, and verify
that the app shows disconnected/stale state without exposing provider data.

## 5. HealthEquity and secondary-provider evaluation

Do not select a provider in advance. Use the confirmed Plaid evidence and the
required HealthEquity result to identify the smallest missing data class.

- [ ] Record the Plaid result per institution and data class using labels only.
- [ ] Identify whether the gap is unsupported, partial, stale, or a reliability
  failure, and document the required fallback.
- [ ] Compare candidate providers only for that demonstrated gap, including
  supported data classes, refresh/reauthentication behavior, token lifecycle,
  pricing approval, retention, and normalized-contract fit.
- [ ] Obtain Chris's explicit provider-selection and Sandbox-credential
  approval before any candidate API call.
- [ ] Run the same redacted contract, retry, duplicate, partial, stale,
  reauthentication, disconnect, and deletion tests.
- [ ] Reject the candidate if it requires browser token exposure, unverified
  ownership boundaries, or unsupported recovery/deletion behavior.

Rollback is to reject the candidate, revoke/delete its Sandbox credentials,
remove the adapter route, and retain the proven fallback. Do not migrate source
records between providers until a separate migration plan is approved.

## 6. Live normalized migration verification

**Prerequisites:** Milestone 2 security foundation live and verified; migration
draft reviewed; backup/recovery tested; maintenance window approved; and Chris
explicitly approved SQL execution and the destructive rollback draft.

- [ ] Run the read-only preflight and compare catalog output with the expected
  baseline; abort on unexpected tables, policies, grants, triggers, extensions,
  or ownership.
- [ ] Capture a complete backup and verify restore/readability before migration.
- [ ] Review the checksum and exact commit of
  `supabase/migrations/20260715_normalized_financial_schema.sql`.
- [ ] Confirm `private.is_current_user_approved()` and `public.approved_users`
  exist before applying the normalized draft.
- [ ] Apply in a transaction with the documented timeout settings; never edit
  the draft interactively.
- [ ] Verify all 16 tables, owner foreign keys, uniqueness constraints, indexes,
  enabled/forced RLS, authenticated-owner policies, denied anon access, and
  grants.
- [ ] Run representative synthetic insert/read/update/delete ownership tests,
  including an unauthorized identity and a mismatched owner ID.
- [ ] Verify existing snapshot reads/writes and derived outputs remain on their
  existing compatibility path.
- [ ] Record migration result, catalog evidence, backup identifier, and rollback
  readiness without sensitive rows.

Rollback is not for ordinary sync errors. Stop writers, preserve failure
evidence, and use the approved backup restore or the reviewed rollback draft
only after Chris authorizes the destructive action. Verify the security
foundation again after either recovery path.

## 7. Token deletion and account disconnection

- [ ] Authenticate the owner and require an explicit, auditable disconnect
  confirmation.
- [ ] Stop queued sync work and mark the connection as disconnecting.
- [ ] Revoke the provider token where supported, then delete ciphertext/reference
  material from the secret store and token metadata from durable storage.
- [ ] Record only connection label, safe event type, timestamp, and correlation
  ID; never record token values or provider payloads.
- [ ] Verify subsequent sync/link requests fail safely and the UI shows
  disconnected state.
- [ ] Decide and record the retention treatment for already-normalized source
  records; do not silently delete financial history without a separate approved
  data-retention decision.
- [ ] Confirm backup copies and logs do not retain recoverable token material.

If revocation fails, keep the local connection disabled, retry through the
provider's documented mechanism, and escalate; do not claim deletion succeeded.

## Evidence and completion record

The project record may contain only: approval reference, redacted environment
label, commit/checksum, timestamps, result statuses, counts, policy/table names,
rollback readiness, and unresolved risks. It must not contain owner identity,
provider credentials, access tokens, raw payloads, account identifiers, or
financial values.
