# Approved-User Schema and Security Design

## Status and scope

Task 181 / Phase A is a 4X design-only milestone. It defines the later Phase B database work but does not create a table, function, policy, migration, user, or configuration change. The deployed Supabase catalog, grants, and Auth settings remain unverified.

BDFA has one intended owner. The authorization design must allow that owner to access only their financial rows and deny every other identity, including an authenticated identity that has its own `user_id`.

## Decision summary

1. Use `public.approved_users` as the protected allowlist table.
2. Authorize by immutable `user_id` and enabled status, never by email, browser input, user metadata, or a hard-coded identifier in RLS.
3. Use one boolean `SECURITY DEFINER` helper in a non-exposed schema for approval status. It avoids exposing the allowlist to browser clients and avoids policy recursion.
4. Use explicit row ownership predicates plus the approval helper in every financial-table policy.
5. Prefer disablement to deletion for normal revocation. Treat deletion as a privileged recovery or account-removal operation only.

## Approved-user table design

### Table: `public.approved_users`

| Column | Constraint and default | Purpose |
|---|---|---|
| `user_id uuid` | Primary key, `NOT NULL`, foreign key to `auth.users(id)` with `ON DELETE RESTRICT`. | The immutable authorization subject. |
| `approved_email text` | `NOT NULL`; normalized before insertion; unique case-insensitively. | Restricted audit and recovery reference, not an authorization input. |
| `enabled boolean` | `NOT NULL DEFAULT false`. | Explicit allow/deny switch. A record is unusable until enabled. |
| `created_at timestamptz` | `NOT NULL DEFAULT now()`. | Creation audit timestamp. |
| `updated_at timestamptz` | `NOT NULL DEFAULT now()`; maintained by a reviewed `BEFORE UPDATE` timestamp trigger in Phase B. | Last privileged change timestamp. |

The later migration should also reject blank `approved_email` values. Do not add a generic role, organization, invitation, household, or tenant model.

### Constraints and lifecycle

- The primary key guarantees one approval record per Supabase user.
- The foreign key prevents approval records that do not correspond to an Auth identity. `ON DELETE RESTRICT` deliberately makes user deletion a reviewed operation rather than silently removing authorization history.
- A unique, case-insensitive email index prevents accidental duplicate records. Email is informational and recovery-oriented only; it must never be used in RLS instead of `user_id`.
- A normal revocation sets `enabled = false`; it does not delete the row. This preserves audit context and provides a controlled re-enable path.
- Disabling the owner causes future database authorization checks to fail. Phase C must also define session revocation and UI handling; existing browser sessions must not be treated as authorization evidence.
- An email change updates the protected audit field through a privileged operator workflow after identity and recovery checks. It does not change `user_id` or row ownership.
- Password reset and account recovery remain Supabase Auth responsibilities. Recovery must restore the same approved `user_id`; it must not create or enable a second usable identity.

### Allowlist access model

`public.approved_users` is protected even though it is in the `public` schema:

- Enable RLS and use a deny-by-default policy posture.
- Grant no normal browser client `SELECT`, `INSERT`, `UPDATE`, or `DELETE` access.
- Do not expose a browser RPC, admin screen, or direct table query for allowlist maintenance.
- Insert, enable, disable, change email, or delete records only through a separately approved operator-controlled deployment or recovery procedure.

RLS does not replace privilege management. Phase B must inspect and explicitly restrict table privileges, Data API exposure, views, functions, and default grants.

## Authoritative authorization rule

For every user-owned financial row, authorize only when all three conditions are true:

1. The request is made by an authenticated Supabase identity.
2. `auth.uid()` equals the row's `user_id`.
3. `auth.uid()` has one enabled record in `public.approved_users`.

This rule rejects browser-supplied ownership as an authorization source. A browser may send a `user_id`, but the database independently compares it with `auth.uid()` and checks the protected allowlist. The rule also prevents an unauthorized authenticated identity from accessing a row it created for itself.

Do not use an email claim, `user_metadata`, localStorage state, a client-side identity check, or a hard-coded owner UUID as authorization.

### Financial-table policy contract

Later Phase B policies must apply the same rule per command:

| Command | Required policy condition |
|---|---|
| SELECT | `USING`: enabled approved identity and `auth.uid() = user_id`. |
| INSERT | `WITH CHECK`: enabled approved identity and `auth.uid() = user_id`. |
| UPDATE | Both `USING` and `WITH CHECK`: enabled approved identity and `auth.uid() = user_id`. |
| DELETE | `USING`: enabled approved identity and `auth.uid() = user_id`. |

`UPDATE` needs both clauses: `USING` protects the existing row and `WITH CHECK` prevents ownership reassignment. Policies must target `authenticated` explicitly; that role alone is not authorization.

## Approval helper-function design

### Selected approach

Use a narrow helper equivalent to `private.is_current_user_approved() returns boolean`. Direct policy subqueries are not selected because the allowlist must not be browser-readable and policies that read an RLS-protected allowlist can create recursion or grant complexity. The helper returns only approval status and performs no writes.

The helper's conceptual result is:

```text
auth.uid() is not null
AND an enabled row exists in public.approved_users for auth.uid()
```

Financial-table policies call the helper alongside their own explicit `user_id` comparison. The helper never accepts a caller-supplied UUID or email parameter.

### Required `SECURITY DEFINER` hardening

The helper requires `SECURITY DEFINER` only to evaluate the protected allowlist without granting direct browser access. Phase B must implement all of these requirements:

- Create the function in a non-exposed schema such as `private`, not `public`.
- Set a fixed, hardened `search_path` to an empty path and schema-qualify every referenced object, including `auth.uid()` and `public.approved_users`.
- Make the function `STABLE`, boolean-only, argument-free, and read-only.
- Use no dynamic SQL, no caller-provided identifiers, and no data-returning behavior beyond the boolean result.
- Assign ownership to a reviewed privileged database role that can read the allowlist. Verify how `FORCE ROW LEVEL SECURITY` and the function owner's privileges interact before deployment.
- Revoke default `EXECUTE` from `PUBLIC`. Grant only the minimum execute and schema-usage permissions required for `authenticated` policies to evaluate the helper.
- Keep direct grants on `public.approved_users` absent for `anon` and `authenticated`.
- Review function owner, grants, dependencies, and `bypassrls` behavior after creation. A `SECURITY DEFINER` function is not a general permission workaround.

The helper avoids recursion because it reads the allowlist directly under its reviewed definer context; financial-table policies do not need a browser-readable allowlist policy. If live privilege testing shows a safe invoker design can meet all requirements without direct table exposure or recursion, prefer that simpler design. Do not make that substitution without documenting the live test evidence.

### Performance and indexes

The primary key on `approved_users.user_id` supports the helper's single-row existence check. The case-insensitive email uniqueness index supports privileged maintenance only; it is not in the request authorization path. Financial tables still need an index appropriate to their `user_id` policy predicate. Confirm query plans and helper call behavior against representative data in Phase D; do not optimize from assumptions alone.

## Migration-ready Phase B outline

This is an execution order, not migration SQL.

1. **Preflight and rollback readiness**
   - Inspect the live schema, RLS flags, all policies, grants, exposed schemas, views, functions, triggers, Auth settings, and existing snapshot data.
   - Confirm the approved owner's existing Auth identity and recovery path through a secure operator channel.
   - Prepare an approved rollback procedure and a safe test fixture. Abort if the live catalog differs from the expected plan.
2. **Create the protected allowlist**
   - Create `public.approved_users` with the constraints above, RLS enabled, deny-by-default policies, and restricted privileges.
   - Create the primary-key and case-insensitive email indexes, plus reviewed timestamp-maintenance behavior.
3. **Bootstrap the owner safely**
   - Insert exactly one enabled owner record through an operator-controlled secure deployment input.
   - Do not commit the owner UUID, private email, password, token, or SQL literal containing either value to GitHub, logs, or a browser client.
4. **Create and inspect the helper**
   - Create the hardened helper only after the allowlist and owner record are verified.
   - Verify function ownership, fixed search path, `PUBLIC` execute revocation, required role grants, and no direct browser access to the table.
5. **Replace financial-table RLS policies**
   - Inventory legacy policies by actual name and behavior before removal; never rely solely on known policy names.
   - Apply the authoritative rule to SELECT, INSERT, UPDATE, and DELETE. Enable and force RLS where justified by the live ownership model.
6. **Transaction-safe verification and decision**
   - Use a transaction where the live migration sequence permits, so an unexpected catalog or policy verification failure rolls back rather than leaving a partial boundary.
   - Test approved-owner access before committing the security boundary. If verification fails, roll back and preserve the prior state for investigation.
7. **Post-commit evidence**
   - Run the separately approved Phase D negative tests, record the live catalog and results without private values, and only then proceed to Auth/signup enforcement in Phase C.

### Secure operator-supplied values

The following values must be supplied through a secure operator-controlled channel during Phase B and must not appear in source control, migration files, browser code, PR text, or logs:

- approved owner's Auth `user_id`;
- approved owner's private email;
- any privileged database or deployment credential;
- recovery-test credentials and test-user identifiers.

## Live verification assumptions

Task 181 does not prove that `auth.users` may be referenced by the deployed migration role, that a private schema is available, that the Data API exposes or grants the relevant tables, or that existing policies can be safely replaced. Those facts require Phase B catalog inspection and Phase D negative testing.

## Completion boundary

This design authorizes no database or runtime change. After review, the next separately approved 4X task may be Phase B only. Do not combine Phase B with Auth/signup enforcement, user creation, provider integration, or production rollout.
