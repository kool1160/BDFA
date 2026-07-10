# BDFA Project Record

## Task 174 — Verify Supabase RLS And User Isolation

- Date opened: 2026-07-10
- Pull request: Pending
- Migration or SQL file path: `supabase/migrations/20260710000000_bdfa_source_snapshots_rls.sql`
- Security documentation: `docs/SUPABASE_RLS_BDFA_SOURCE_SNAPSHOTS.md`
- Protected table: `public.bdfa_source_snapshots`
- Exact policy names:
  - `bdfa_source_snapshots_select_own`
  - `bdfa_source_snapshots_insert_own`
  - `bdfa_source_snapshots_update_own`
  - `bdfa_source_snapshots_delete_own`
- No secrets committed: Confirmed by repository diff review and service-role keyword scan. No Supabase service-role key, password, token, or private credential was added.
- Test matrix:
  - RLS enable statement exists: Passed by manual migration review.
  - SELECT policy exists and restricts access with `auth.uid() = user_id`: Passed by manual migration review.
  - INSERT policy exists and restricts access with `auth.uid() = user_id`: Passed by manual migration review.
  - UPDATE policy exists and restricts access with `auth.uid() = user_id`: Passed by manual migration review.
  - DELETE policy exists and restricts access with `auth.uid() = user_id`: Passed by manual migration review.
  - Two-user live Supabase isolation verification: Pending; cannot be performed from repository-only changes.
  - Unauthenticated live Supabase access verification: Pending; cannot be performed from repository-only changes.
  - No unrelated files changed: Passed by final diff review; only allowed `supabase/migrations/*` and `docs/*` files changed.
- Production commit SHA: Pending
- Production verification: Pending

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
