# BDFA AI Agent Instructions

All AI coding agents working on BDFA must read and follow, in this order:

1. `AGENTS.md`
2. `docs/PRODUCT_DIRECTION.md`
3. `docs/ENGINEERING_CONSTITUTION.md`
4. `BACKLOG.md`

The Engineering Constitution remains the highest-priority engineering standard. The Product Direction governs what BDFA is being built to become. The Backlog identifies the current implementation order.

## Product identity

BDFA is a private, personal financial command center for one approved owner: Chris.

It is not currently a public SaaS product. Do not add public signup, subscriptions, Stripe billing, organizations, household accounts, public marketing infrastructure, customer-support systems, or enterprise scaling unless the product direction is explicitly changed.

The primary product goal is automatic assembly of Chris's complete financial picture through one or more financial-data providers, with manual entry or imports only as fallback methods.

## Working style

Agents should make reasonable implementation decisions without asking Chris about routine technical details when the milestone, product direction, and acceptance criteria are clear.

Planning should hand Codex one complete milestone, not a chain of small sequential tasks. A high-risk milestone may contain internal phases, but Codex should proceed through all safe phases automatically within the same milestone.

Prefer completing one coherent milestone over creating many tiny pull requests. Use focused commits as checkpoints. Pull requests should normally represent whole milestones, not each internal phase.

Do not create a pull request for every copy, spacing, documentation, assessment, design, or isolated low-risk fix unless explicitly requested.

## Stop-and-ask boundaries

Stop and obtain explicit approval immediately before:

- a live database or migration change that could lose, overwrite, expose, or corrupt data
- an authentication or RLS change that could lock out the owner or expose data
- handling live financial-provider credentials or production access tokens
- purchasing or enabling a paid service
- deleting major existing functionality
- deploying a new or changed financial calculation without verification
- changing the product direction
- introducing a major framework, backend, or source-of-truth migration

Do not stop merely because an internal assessment, design, documentation phase, commit, branch, or draft pull request is complete. Continue through safe phases until reaching a real approval boundary or completing the milestone.

## Milestone execution

For each milestone:

1. Read the governing documents listed above.
2. Inspect the actual repository and report material differences from the plan.
3. Complete all safe internal phases needed to satisfy the milestone.
4. Run risk-appropriate tests and checks.
5. Fix failures caused by the work.
6. Review the diff.
7. Commit verified checkpoints with clear messages.
8. Push changes and manage the milestone pull request when applicable.
9. Pause only at a stop-and-ask boundary or when a material unknown prevents safe progress.
10. Finish with a concise Planning Handoff.

For high-risk work, begin with a read-only assessment, but keep the assessment, design, implementation preparation, testing preparation, documentation, and other safe phases inside the same milestone unless a stop-and-ask boundary is reached.

## Reasoning level guidance

Use the lowest level that can safely complete the work:

- **1X:** narrow documentation, copy, or obvious reversible visual fixes
- **2X:** normal contained implementation and routine bug fixes
- **3X:** provider integrations, normalization, synchronization, portfolio calculations, meaningful migrations, and cross-system work
- **4X:** RLS, authentication architecture, access-token storage, destructive migrations, source-of-truth redesign, recovery architecture, or financial methodology where silent errors could be severe

Do not run every task through all levels. Planning should recommend one primary level for the full milestone and identify the exact approval boundaries inside it.

## Planning handoff requirement

Every completed or paused milestone must end with a concise `Planning Handoff` containing:

- milestone name and status
- runtime, database, authentication, RLS, and financial-impact summary
- files changed
- pull request number and state, when applicable
- commit SHA
- tests and verification results
- unresolved items or the exact approval blocker
- recommended next milestone
- recommended reasoning level for the next milestone

If the milestone is paused at a real approval boundary, state exactly what approval is needed and what Codex will do after approval.

Keep the handoff short and directly reusable in the BDFA Planning chat.

## Completion standard

No milestone is complete until the implementation evidence is recorded clearly. Include changed files, checks performed, commit SHA, deployment or PR information when applicable, and remaining risks.