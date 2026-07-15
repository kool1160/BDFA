# Provider Adapter Contract

This repository-only contract is the boundary between a future provider
implementation and BDFA's normalized source model. It performs no network
access, token handling, database writes, or DOM work.

## Required datasets

Every adapter exposes `institutions`, `accounts`, `balances`, `transactions`,
`holdings`, `investmentActivity`, `liabilities`, and `connectionHealth` through
`fetchDataset()` and `fetchSnapshot()`.

`normalizeAdapterSnapshot()` maps provider-neutral records into the existing
source collections while retaining provider provenance. Derived financial
outputs remain downstream of this boundary.

## Health and safety

Sandbox coverage includes healthy, stale, partial, reauthentication-required,
duplicate-records, and disconnected states. These remain visible in
`metadata.connectionHealth`; normalization does not silently make incomplete
data healthy.

Only sandbox adapters can be created by this module. Provider SDKs,
credentials, access tokens, raw payload persistence, and live API calls are out
of scope. `redactAdapterEvent()` removes token, credential, password,
authorization, cookie, and account-number-shaped fields before an event can be
logged or surfaced to a UI seam.
