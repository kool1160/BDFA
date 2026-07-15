# Secure Provider Backend Design

## Status and boundary

This is repository-only implementation preparation for Milestone 5. BDFA has
no server runtime, dependency manifest, backend deployment target, provider
selection, or approved live Supabase security foundation yet. This document
does not add a backend, contact a provider, create a database schema, handle
credentials, or change authentication/RLS.

The implementation phase requires explicit approval before selecting the
runtime/deployment boundary, storing provider tokens, applying database
changes, using provider credentials, or deploying anything. Sandbox fixtures
and local contract tests can proceed after that approval without using Chris's
real accounts.

## Security invariants

- Browser code may receive short-lived link or public tokens only when the
  provider explicitly defines them as safe for browser use.
- Provider secrets and permanent access tokens are server-only values. They
  must never appear in HTML, browser JavaScript, snapshots, exports, logs,
  error messages, URLs, or client-visible API responses.
- `user_id` comes from the authenticated server session, never from request
  JSON, query parameters, or provider payloads.
- Every connection, sync run, normalized record, and audit event is owner
  scoped and must be rejected unless the authenticated owner is authorized by
  the approved-user security controls.
- Provider identifiers are reconciliation metadata, not authorization
  controls. Raw provider payloads are disposable adapter input and are not
  persisted by default.
- Logs contain request/correlation IDs, operation type, safe provider error
  codes, counts, and timing; they exclude tokens, credentials, account
  numbers, balances, transaction descriptions, and raw payloads.
- Webhooks are accepted only after signature verification, replay protection,
  and provider-connection lookup. A webhook can enqueue or mark work; it must
  not trust a user ID supplied by the webhook body.

## Proposed server boundary

The browser should call a narrow authenticated BDFA API. Provider SDK calls,
token exchange, token deletion, normalization, persistence, and webhook
verification remain server-side.

| Operation | Browser request | Server behavior | Client response |
| --- | --- | --- | --- |
| Create link token | Provider intent/options without owner ID | Verify session and owner; create short-lived provider link token | Ephemeral link token and expiry only |
| Exchange public token | Provider public token | Verify session; exchange once; encrypt/store permanent token server-side; start initial sync | Connection ID and safe status |
| Refresh connection | Connection ID | Verify ownership; refresh through provider; update health state | Safe status and timestamps |
| Sync data | Connection ID and sync scope | Verify ownership; fetch, normalize, deduplicate, reconcile, persist; record sync run | Counts, quality state, and safe errors |
| Read normalized data | Typed resource/query | Verify ownership; return normalized records with source timestamps | Owner-scoped data only |
| Disconnect | Connection ID | Verify ownership; revoke/delete provider token; mark connection disconnected; retain safe audit event | Safe completion status |
| Provider webhook | Signed provider request | Verify signature/replay; resolve connection; record event; enqueue safe sync work | Provider-specific acknowledgement |

Exact routes, framework, queue mechanism, secret manager, and deployment
target are intentionally undecided until the protected implementation
approval identifies an operating environment.

## Token lifecycle

1. The server creates a short-lived link token after authenticating the owner.
2. The browser completes provider linking without receiving a permanent token.
3. The server exchanges the provider public token immediately and validates
   the returned institution/connection metadata.
4. The permanent token is encrypted at rest using an approved secret-management
   mechanism. The database stores only a ciphertext/reference and safe token
   metadata.
5. Sync jobs decrypt only inside the server process for the single provider
   request, then discard plaintext from memory as far as the runtime permits.
6. Reauthentication replaces the stored token only after a successful
   exchange. Failed refreshes update connection health without exposing the
   provider response.
7. Disconnect revokes the provider token where supported, deletes the stored
   secret, and records a non-sensitive audit event.

No token storage strategy is considered approved until recovery, key rotation,
least-privilege access, and lockout behavior are documented and tested.

## Sync and normalization contract

Provider adapters must map into the records in
`docs/NORMALIZED_FINANCIAL_MODEL.md`. A sync is successful only when it has:

- a connection-scoped idempotency/cursor strategy;
- deterministic mapping for accounts, balances, transactions, holdings,
  investment activity, and liabilities supported by that provider;
- duplicate and pending-to-posted reconciliation behavior;
- explicit partial, stale, reauthentication, and provider-error states;
- append-oriented observations and safe source timestamps;
- a sync-run record with counts and a correlation ID; and
- representative synthetic fixtures covering retries, duplicates, missing
  fields, stale data, and interrupted work.

Provider data must not be sent directly to Monthly Flow, Analytics, Planning,
or other derived-output code. The existing snapshot and
`bdfa:source-data-updated` compatibility contracts remain unchanged until a
separate adapter/runtime migration is approved.

## Approval-gated implementation sequence

1. Approve the server runtime, deployment boundary, secret manager, and
   recovery operator.
2. Complete Milestone 2's live owner/RLS/Auth controls before storing durable
   provider data or tokens.
3. Add local synthetic fixtures, adapter interfaces, redaction tests, and
   non-live schema artifacts.
4. Implement link, exchange, sync, webhook, reauthentication, and disconnect
   endpoints against provider Sandbox with no production credentials.
5. Run security, idempotency, ownership, failure-recovery, and contract tests.
6. Obtain separate approval before connecting real institutions, handling
   production tokens, applying live database changes, or deploying.

## Prepared acceptance evidence

The following are required before this milestone can be marked complete:

- no secret or permanent token reaches browser code or logs;
- owner and unauthorized-session tests pass for every endpoint;
- exchange, refresh, disconnect, and webhook replay tests pass;
- sync retries do not duplicate normalized records;
- partial/stale/reauthentication states remain visible;
- recovery and token deletion behavior is verified; and
- Sandbox verification is recorded for each provider-supported data class.
