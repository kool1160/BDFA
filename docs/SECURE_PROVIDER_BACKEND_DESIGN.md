# Secure Provider Backend Design

## Status and boundary

This is repository-only design evidence for Milestone 5. It does not add a
server runtime, dependency, provider integration, database migration, Auth or
RLS change, provider credential, production token, or live deployment.

The current repository is a static frontend with browser Supabase access for
the existing source snapshot flow. A provider backend must be introduced
behind a protected server boundary before any provider secret or permanent
access token is handled. The backend must not be simulated by putting secrets
in browser JavaScript or by treating the publishable Supabase key as a server
credential.

## Recommended boundary

Use one small server-side function boundary compatible with the existing
Supabase direction (for example, a reviewed Supabase Edge Function or an
equivalent private server endpoint). Do not add a general Node/Express service
until a concrete hosting or operational need exists.

The browser may send an authenticated session and short-lived link data. The
server boundary is responsible for:

- validating the authenticated owner through the approved-user control;
- receiving a provider public token only for immediate exchange;
- calling the provider with server-held configuration;
- storing only an encrypted or vault-backed token reference, never a raw token
  in browser data, snapshots, logs, or webhook payloads;
- writing normalized records and sync metadata under the authenticated owner;
- returning safe display data and operation status, not provider payloads or
  credentials.

Provider selection remains unapproved until the account coverage matrix has
actual institution inventory and sandbox support results. The interface must
therefore be provider-neutral even if the first sandbox adapter is Plaid.

## Endpoint contract

These are proposed operation names, not implemented routes. Every operation
requires an authenticated, approved owner session and an authorization check
at the server/database boundary.

| Operation | Input | Output | Sensitive handling |
|---|---|---|---|
| `create-link-token` | Safe client redirect/context | Short-lived link token | Never persist or log the token. |
| `exchange-public-token` | One-time public token, provider metadata | Connection id and safe institution label | Exchange immediately; discard input; store token only in protected storage. |
| `sync-connection` | BDFA connection id, optional cursor | Sync run status and counts | Provider payloads stay server-side; counts must not contain account identifiers. |
| `list-connection-data` | Owner-scoped connection/account filters | Normalized safe records | Apply ownership and redaction rules; no raw provider response. |
| `disconnect-connection` | Owner-scoped connection id | Disconnection status | Revoke/delete provider token before marking the connection disconnected. |
| `reauthenticate-connection` | Owner-scoped connection id | Safe reauthentication state | Do not return or expose the stored token. |
| `provider-webhook` | Provider signature and raw request body | Generic 2xx/4xx response | Verify signature before parsing; do not log body or signature. |

The server should reject unsupported operations, malformed identifiers,
missing owner approval, stale sessions, replayed exchange requests, and
cross-owner identifiers. Error responses should use stable safe codes such as
`unauthorized`, `invalid_request`, `provider_unavailable`, and
`reauthentication_required`; provider account numbers, tokens, and raw error
payloads must not be returned.

## Token and secret rules

- Provider client secrets exist only in approved server environment or secret
  storage.
- Permanent access tokens are encrypted at rest or stored in an approved
  secret vault, referenced by an opaque BDFA connection record.
- Token plaintext is held only for the minimum time needed by the provider
  call and is never included in structured logs, exceptions, snapshots,
  exports, analytics, or client responses.
- Token deletion must be explicit, idempotent, and followed by local secret
  deletion or vault revocation.
- Provider webhooks must use signature verification and replay protection;
  webhook URLs must not authorize data access by URL parameters alone.
- No provider credentials or live account identifiers belong in this
  repository, CI output, fixtures, screenshots, or issue comments.

## Normalized persistence boundary

The backend writes the provider-independent model defined in
`docs/NORMALIZED_FINANCIAL_MODEL.md`. Provider payloads are adapter inputs,
not the application source of truth. Each write must carry owner scope,
provider/source identity, source timestamp, sync run identity, and an
idempotency key where applicable.

The first implementation should cover connection metadata and safe sync
metadata before expanding into accounts, balances, transactions, holdings,
investment activity, and liabilities. It must preserve the existing snapshot
recovery path until normalized synchronization has passed reconciliation
tests. Derived values remain computed by the existing financial engine.

## Safe logging and observability

Record only operational metadata: operation name, internal sync-run id,
provider family, normalized connection id, outcome, timestamps, retry count,
and a redacted safe error code. Never record emails, UUIDs in public logs,
account numbers, masks, balances, transaction descriptions, tokens, request
bodies, authorization headers, or provider raw errors.

Sync records should distinguish attempted, succeeded, partial, failed,
reauthentication-required, and disconnected states. Partial results must not
silently replace a known-good normalized record set.

## Approval and implementation gates

Before implementation or live execution, obtain approval for the protected
phases below:

1. Confirm the approved-owner/Auth/RLS foundation is live and tested. Provider
   endpoints must not become an alternate authorization path.
2. Confirm Chris's institution inventory and the first sandbox provider. Do
   not purchase or enable a provider based on this document.
3. Approve the server execution target, secret storage mechanism, retention
   policy, and database schema/migration plan.
4. Implement a synthetic sandbox adapter and tests using fake identities,
   fake tokens, and non-financial fixtures only.
5. Review representative exchange, sync retry, duplicate, webhook replay,
   disconnect, token deletion, and reauthentication tests before any live
   provider credential is introduced.
6. Perform live database/Auth/RLS changes, production credential handling, and
   deployment only through their separate explicit approvals.

## Verification contract

The implementation phase is not complete until automated or repeatable tests
prove that:

- anonymous and unapproved sessions cannot invoke provider operations;
- a user cannot read, sync, disconnect, or delete another owner's connection;
- public-token exchange input is not persisted or logged;
- permanent tokens never appear in browser responses, snapshots, exports, or
  logs;
- webhook signatures and replay behavior are enforced;
- retries are idempotent and do not duplicate normalized records;
- partial and failed syncs retain an explicit status and safe error code;
- disconnect removes provider authorization and is safe to repeat;
- representative normalized records reconcile to provider fixtures without
  changing Monthly Flow, Analytics, or financial formulas.

Until those tests and the protected approvals exist, Milestone 5 remains
approval-blocked after repository design preparation.
