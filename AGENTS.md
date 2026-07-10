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

Agents should make reasonable implementation decisions without asking Chris about routine technical details when the task, product direction, and acceptance criteria are clear.

Prefer completing one coherent milestone over creating many tiny pull requests. Small related changes may be grouped when they share one objective and can be verified together.

Do not create a pull request for every copy, spacing, documentation, or isolated low-risk fix unless explicitly requested. Use focused commits as checkpoints. Pull requests should normally represent meaningful milestones.

## Stop-and-ask boundaries

Stop and obtain explicit approval before:

- destructive database changes
- authentication or RLS changes that could lock out the owner or expose data
- handling live financial-provider credentials or production access tokens
- purchasing or enabling a paid service
- deleting major existing functionality
- deploying a new or changed financial calculation without verification
- changing the product direction
- introducing a major framework, backend, or source-of-truth migration

## Task execution

For each task:

1. Read the governing documents listed above.
2. Inspect the actual repository and report material differences from the plan.
3. Make the smallest complete change that advances the active backlog milestone.
4. Run risk-appropriate tests and checks.
5. Fix failures caused by the change.
6. Review the diff.
7. Commit verified work with a clear message.
8. Report what changed, what was tested, unresolved risks, and the next backlog item.

For high-risk work, begin with a read-only assessment and divide the work into separately verifiable phases.

## Reasoning level guidance

Use the lowest level that can safely complete the work:

- **1X:** narrow documentation, copy, or obvious reversible visual fixes
- **2X:** normal contained implementation and routine bug fixes
- **3X:** provider integrations, normalization, synchronization, portfolio calculations, meaningful migrations, and cross-system work
- **4X:** RLS, authentication architecture, access-token storage, destructive migrations, source-of-truth redesign, recovery architecture, or financial methodology where silent errors could be severe

Do not run every task through all levels. Planning should recommend one primary level and state whether read-only assessment or multiple runs are required.

## Completion standard

No task is complete until the implementation evidence is recorded clearly. Include changed files, checks performed, commit SHA, deployment or PR information when applicable, and remaining risks.
