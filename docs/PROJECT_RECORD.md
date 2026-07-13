# BDFA Project Record

## Milestone 5 — Secure Provider Backend Design Preparation

- Date prepared: 2026-07-13
- Scope: Repository-only security and implementation design up to the protected backend boundary.
- Design: `docs/SECURE_PROVIDER_BACKEND_DESIGN.md` defines a provider-neutral server boundary, endpoint contract, token storage/deletion rules, webhook verification, normalized persistence boundary, safe logging, approval gates, and synthetic sandbox verification requirements.
- Privacy: No provider credentials, access tokens, account identifiers, live payloads, or personal identity values were added.
- Runtime/database/authentication/RLS/provider/financial calculations: Unchanged. No backend runtime, dependency, migration, live catalog access, provider selection, or deployment was performed.
- Status: Approval required before server implementation, token storage, database/schema work, provider sandbox credentials, live Auth/RLS verification, or deployment.

## Milestone 4 — Normalized Financial Model Design

- Date completed: 2026-07-13
- Scope: Repository-only provider-independent source-data model and implementation sequence.
- Design: `docs/NORMALIZED_FINANCIAL_MODEL.md` defines institutions, financial connections, accounts and provider links, balance history, transactions, holdings, investment transactions, liabilities, recurring items, manual assets and valuations, sync runs, connection events, and snapshot/audit metadata.
- Source-of-truth rule: BDFA normalized records are the future product source of truth; provider payloads remain adapter inputs; derived outputs remain computed.
- Recovery: Existing `bdfa_source_snapshots` remains a complete portable recovery/fallback mechanism while normalized syncing is proven.
- Privacy: No personal account identifiers, balances, credentials, tokens, or production identifiers were added.
- Runtime/database/authentication/RLS/provider/financial calculations: Unchanged. No migration was executed and no provider was selected.
- Verification: `bash scripts/ci.sh` and `git diff --check` passed after the design changes.
- Status: Complete — next implementation requires synthetic fixtures and a separately approved database/security phase before any live persistence work.

## Milestone 3 — Account Coverage Matrix Preparation

- Date prepared: 2026-07-13
- Scope: Repository-only account and asset coverage matrix template; no provider connection or live credential handling.
- Matrix: `docs/ACCOUNT_COVERAGE_MATRIX.md`
- Coverage prepared: Checking/savings, credit cards, loans, brokerage, retirement, HealthEquity HSA, and manual assets are represented with required data, freshness, provider-verification, and fallback fields.
- HealthEquity: Required test case; support remains unverified and no secondary provider was selected in advance.
- Privacy: No account numbers, masks, balances, credentials, tokens, production identifiers, or unconfirmed institution claims were added.
- Provider testing: Not performed. Plaid and any secondary provider require later Sandbox testing against Chris's confirmed institution inventory.
- Runtime/database/authentication/RLS/financial calculations: Unchanged.
- Status: Waiting — the template is prepared, but Chris must confirm the actual institutions and account types before Milestone 3 can be complete.

## Milestone 2 — Single-Owner Security Implementation Preparation

- Date prepared: 2026-07-13
- Scope: Repository-only preparation up to the live database/authentication approval boundary.
- Runtime preparation: Public signup UI/client call removed; approved-account password reset and recovery completion flow added; recovery events no longer trigger automatic cloud synchronization before password update.
- Database preparation: Read-only catalog preflight and an interactive, transaction-protected approved-owner allowlist/RLS script prepared. Owner identity and email remain execution-time inputs and are not stored in the repository.
- Verification preparation: Anonymous, approved-owner, authenticated-unapproved, forged-owner, disablement, session, logout, and recovery checks documented in `docs/SINGLE_OWNER_SECURITY_RUNBOOK.md`.
- Automated checks: `bash scripts/ci.sh` includes single-owner security preparation assertions.
- Live Supabase catalog inspected: No; protected action pending approval.
- Live database/RLS changed: No.
- Live Auth settings changed: No.
- Runtime deployed: No.
- Financial calculations or source-data contracts changed: No.
- Status: Approval required before live catalog access, applying the transaction, changing Auth/signup settings, using test identities, or deploying the prepared client.

## Vercel Operational Note

- Vercel Node.js version changed from 24.x to 22.x LTS after preview deployments failed during build-container initialization. Redeploy succeeded after the change.

## Task 180 — Single-Owner Authentication and Approved-User Security Assessment

- Date opened: 2026-07-10
- Pull request: #110 (draft)
- Review status: PASS
- Assessment document: `docs/SINGLE_OWNER_AUTH_SECURITY_ASSESSMENT.md`
- Files inspected: `index.html`, `js/supabase-config.js`, `js/supabase-client.js`, `js/app.js`, `js/data-adapter.js`, current Supabase-related repository paths, Vercel configuration, security/product documents, PR #108, and PR #109.
- Authentication-flow summary: Browser email/password signup, sign-in, sign-out, session lookup, and auth-state subscription are implemented. Password reset and OAuth flows are not represented in the repository. No approved-user check exists.
- User-owned tables identified: `public.bdfa_source_snapshots` is the only user-owned table referenced by current runtime code.
- Repository RLS evidence: Current `main` has no tracked schema or migration SQL. PR #108 contains an unmerged ownership-only RLS proposal that does not enforce approved-user status and cannot prove or clear unknown live legacy policies.
- Service-role exposure result: No committed service-role key or common secret-token signature was found. The browser-visible project URL and publishable/anon key are intentionally not reproduced here.
- Approved-user design status: Proposed only; no table, helper function, grants, or policy changes were implemented.
- Deployed-state verification status: Pending.
- Live negative-testing status: Pending.
- Runtime code changed: No.
- Database changed: No.
- Authentication changed: No.
- Financial calculations changed: No.
- Source-data contracts changed: No.
- Production commit SHA: Pending.
- Next implementation phase: Phase A — approved-user schema and security design (4X; requires separate explicit implementation approval).
- Status: Complete — assessment review passed. No security controls were implemented.

## Milestone 1 — Trusted Baseline

- Baseline verification date: 2026-07-10
- Authoritative local branch: `main`, tracking `origin/main`
- Baseline commit: `9ea8905d623f05b4433f946627f9b38b2fadbf22` (`docs: add simplified milestone backlog`)
- Remote: `https://github.com/kool1160/BDFA.git`
- Working tree before baseline recording: clean
- Superseded pull requests closed: #104, #105, and #106. Their closure was authorized by Task 173 after merged consolidation PR #107.
- Open pull requests retained: #97, #108, and #109. They contain unmerged work and were not treated as superseded by this milestone.
- Tracked-file and reachable-history credential scan: no matches for common AWS, Google, GitHub, OpenAI, Supabase service-role, or private-key signatures. No rotation is indicated by this scan.
- Production deployment: `https://bdfa-fawn.vercel.app` is the production alias of READY Vercel deployment `dpl_Faers8xkJVJUnYBCD1cpuvyP6oNv`.
- Production deployment commit: verified as `4a785241e6dd4cb62f6717f9e2c58b6689192889` (`docs: record trusted repository baseline`) from Vercel deployment metadata.
- Production smoke test: passed on 2026-07-10. The production URL returned HTTP 200; the dashboard, Accounts, Monthly Flow, and Analytics rendered; and no browser console errors were recorded.
- Milestone status: Complete.

## Task 173 — Consolidate PRs #104, #105, And #106 Into One Clean Production Baseline

- Date opened: 2026-07-10
- Pull request: #107
- Implementation commit reviewed before evidence update: 5c931cecd65cb60f930fe3dc871a703596874723
- Current PR head: verified through GitHub PR metadata and expected to change when fixes or documentation are committed
- Status: PR approved pending merge, production deployment, and production smoke-test evidence.
- Authoritative consolidation PR: #107
- Superseded PRs: #104, #105, #106
- Superseded PR closure timing: close PRs #104, #105, and #106 only after PR #107 is merged successfully.
- Vercel preview status: Ready
- Preview deployment verification date: 2026-07-10
- Final production commit SHA: Pending merge and production deployment
- Production smoke-test result: Pending production deployment

### Approved changes consolidated

- Monthly Flow was positioned as the flagship monthly cash command center with clearer introduction copy, projection-estimate language, stronger hierarchy, and clearer section headings for what happens next and incoming income.
- Monthly Flow labels were corrected to avoid recommendation language: Planning signal, On track, Projected Ending Balance, and Cash After Estimated Bills.
- Monthly Flow helper meaning was clarified: Projected Ending Balance is the estimated ending balance after currently dated income and bills; Cash After Estimated Bills is cash after estimated monthly bills only and is not a recommendation to invest.
- Mobile Monthly Flow week chips were made mobile-safe without changing month, week, quarter, or year behavior.
- Mobile Monthly Flow timeline rows now present Day · Type · Name on the first line and Balance · Amount as the second-line structure, with wrapping safeguards for long names.
- Monthly Flow spacing between timeline, bills, and incoming income was improved while preserving bottom navigation behavior.
- Analytics received premium dark visual corrections for gradients, score ring contrast, score bars, and positive/caution/growth/debt accents.
- Overview Accounts collapsed-card mobile spacing was tightened so the amount chip and chevron remain clean at iPhone widths.

### Protected-contract confirmation

Financial calculations were unchanged. Source-data contracts were unchanged. This consolidation changed labels, helper copy, layout structure, CSS presentation, and project-record evidence only. Monthly Flow formulas, Analytics calculations, source data, source-data contracts, Supabase behavior, cloud save/load, auth behavior, localStorage behavior, import/export behavior, CRUD behavior, panel behavior, mobile bottom-nav logic, community feedback storage, and the transactions scaffold were not intentionally modified.

### Verification evidence

- Syntax check: `node --check js/app.js` — passed on 2026-07-10
- Syntax check: `node --check js/monthly-flow-runtime.js` — passed on 2026-07-10
- Syntax check: `node --check js/analytics.js` — passed on 2026-07-10
- Diff check: `git diff --check` — passed on 2026-07-10
- Forbidden phrase search: passed on 2026-07-10 for deprecated Monthly Flow recommendation wording
- Browser/mobile verification: static responsive code inspection completed on 2026-07-10 for iPhone-width Accounts header spacing, Monthly Flow week overflow safeguards, two-line timeline wrapping, section spacing, and premium Analytics visuals.
- Vercel preview verification: Ready preview verified on 2026-07-10.
- Production verification: pending production deployment; this task must not be marked fully complete until the final production commit SHA and production smoke-test result are recorded.
