# Universal AI Foreman Handoff

## Purpose

This document explains how to reproduce the milestone-driven AI development workflow proven in BDFA for almost any software project.

The pattern is intentionally application-agnostic. It can be adapted to:

- personal web applications
- mobile apps
- SaaS products
- internal business tools
- APIs and backend services
- desktop applications
- automation systems
- data pipelines
- hardware-support software
- documentation-heavy engineering projects

The central idea is simple:

> A human defines product direction, safety boundaries, and milestone outcomes. An AI implementation agent executes one milestone inside a controlled GitHub Actions environment, validates the work, and opens a pull request for human review.

This is not unrestricted autonomous development. It is controlled automation with explicit approval gates.

---

## The operating model

The reusable loop is:

1. The repository contains a short, ordered milestone backlog.
2. A GitHub Actions workflow selects the next eligible milestone.
3. Codex reads the project rules and the selected milestone.
4. Codex inspects the real repository before editing.
5. Codex completes every safe part of the milestone.
6. Repository checks run inside the AI workspace.
7. The workflow exports the changes as an artifact.
8. A clean publishing job reapplies and validates the patch.
9. GitHub Actions creates a branch and pull request.
10. A human or review agent inspects the PR.
11. Incorrect claims or unsafe changes are fixed before merge.
12. The backlog status advances only when evidence supports it.
13. The process repeats for the next milestone.

The human remains responsible for:

- product direction
- real-world priorities
- protected credentials
- paid-service commitments
- live infrastructure changes
- destructive operations
- production authorization
- final merge decisions

---

## Why this architecture works

### Milestones instead of tiny prompts

The AI receives a complete outcome rather than a long chain of individually approved micro-tasks. This reduces management overhead and gives the agent enough context to make coherent implementation decisions.

A good milestone is large enough to produce a meaningful result but small enough to review as one pull request.

Examples:

- Establish the trusted repository baseline
- Add secure single-owner authentication
- Define the normalized data model
- Build the provider abstraction layer
- Add automated synchronization and health reporting
- Implement reporting calculations with representative tests

Avoid milestones such as:

- Change one button label
- Create one helper function
- Add one field

Those are implementation steps, not outcomes.

### Two-job execution and publishing model

The strongest version of this workflow separates AI execution from GitHub publishing.

**Job 1: AI execution**

- checks out the authoritative branch
- selects the milestone
- runs Codex in a restricted workspace
- validates the changed working tree
- exports a patch and structured handoff artifact

**Job 2: clean publishing**

- checks out a clean authoritative branch
- downloads the artifact
- applies the patch
- validates the patch again
- creates a branch and commit
- pushes the branch
- opens the pull request or approval issue

This separation provides several benefits:

- the AI does not need direct GitHub write credentials
- publishing happens from a clean checkout
- the patch is validated twice
- a completed AI run can be recovered if PR creation fails
- GitHub permissions are isolated to the publishing job

---

## Required repository components

A reusable implementation normally includes the following files.

```text
.github/
  workflows/
    app-foreman.yml
  codex/
    model-default.txt
    prompts/
      run-milestone.md
    schemas/
      planning-handoff.schema.json
AGENTS.md
BACKLOG.md
docs/
  PRODUCT_DIRECTION.md
  ENGINEERING_CONSTITUTION.md
  PROJECT_RECORD.md
scripts/
  app-backlog.mjs
  ci.sh
```

The names may change, but the responsibilities should remain separate.

---

## 1. Product direction

`docs/PRODUCT_DIRECTION.md` defines what the application is and is not.

It should answer:

- Who is the product for?
- What problem is it solving?
- Is it personal, internal, commercial, public, or regulated?
- Which capabilities are core?
- Which features are intentionally out of scope?
- What architecture tradeoffs are preferred?

This prevents the agent from introducing generic SaaS complexity, unnecessary billing systems, public registration, or hypothetical scaling requirements that do not serve the actual product.

A strong product-direction document is opinionated.

---

## 2. Engineering constitution

`docs/ENGINEERING_CONSTITUTION.md` defines durable technical rules.

Typical sections include:

- source data versus derived data
- security expectations
- secrets and environment-variable policy
- database ownership model
- testing requirements
- migration and rollback requirements
- logging restrictions
- browser/server trust boundary
- accessibility and mobile requirements
- documentation expectations
- preferred technologies
- prohibited shortcuts

This document should describe rules that remain true across milestones.

---

## 3. Agent instructions and approval boundaries

`AGENTS.md` tells implementation agents how to work in the repository.

It should define:

- authoritative branch
- files to read first
- test commands
- formatting rules
- commit expectations
- systems that may be modified
- systems that require explicit approval
- privacy and secret-handling rules
- production and deployment boundaries

A critical section is the stop-and-ask list.

Common protected actions include:

- live database migrations
- destructive schema changes
- authentication or authorization changes
- production deployment
- live credential handling
- paid-service activation
- domain or DNS changes
- financial calculations
- irreversible data migration
- emailing or messaging real users
- deleting production resources

The agent may prepare everything up to a boundary without crossing it.

---

## 4. Milestone backlog

`BACKLOG.md` is the execution queue.

Each milestone should contain:

```markdown
## Milestone 4 — Define the normalized data model

**Status:** Pending

**Issue:** #116

Describe the intended outcome and scope.

- acceptance item
- acceptance item
- acceptance item

**Recommended level:** Terra for architecture; Luna for routine implementation.
```

Recommended statuses:

- `Pending` — eligible for automatic selection
- `Active` — currently being worked
- `Waiting` — needs owner information
- `Blocked` — requires a protected action or external dependency
- `Paused` — intentionally deferred
- `Complete` — supported by repository or production evidence

The selector should automatically skip `Blocked`, `Waiting`, and `Paused` milestones unless a milestone number is supplied explicitly.

Do not mark a milestone complete merely because a template, plan, or preparation document exists. Completion must match the actual milestone outcome.

---

## 5. Milestone selector

The selector script parses `BACKLOG.md`, chooses the first eligible milestone, and writes a temporary context file.

Its responsibilities are:

- validate milestone formatting
- reject duplicate milestone numbers
- allow explicit milestone selection
- skip completed or blocked milestones
- emit milestone number, title, slug, status, and branch name
- create a concise selected-milestone context file

Example output:

```text
Number: 4
Name: Define the normalized data model
Status: Pending
Branch: codex/milestone-4-define-the-normalized-data-model
```

The temporary context directory should be excluded from commits.

---

## 6. Codex execution prompt

The execution prompt should be specific about behavior but generic about implementation.

A strong prompt instructs Codex to:

- read the repository rules in order
- inspect the actual code before changing anything
- reconcile the milestone with the real repository
- treat the milestone as one outcome
- complete all safe internal phases
- make routine technical decisions independently
- avoid unrelated cleanup
- run the required checks
- fix failures caused by its own changes
- review the final diff
- update status only when evidence supports it
- avoid secrets and personal identifiers
- stop at protected boundaries
- return a structured handoff

The prompt should not tell Codex to create commits inside the sandbox if `.git` is intentionally read-only. The publishing job handles commits and PR creation.

---

## 7. Structured planning handoff

The Codex result should conform to a JSON schema.

Useful fields include:

```json
{
  "status": "completed | blocked | waiting",
  "milestone_number": 4,
  "milestone_name": "Define the normalized data model",
  "summary": "What was accomplished",
  "runtime_impact": "What changes at runtime",
  "database_impact": "Database effect",
  "authentication_rls_impact": "Auth/security effect",
  "financial_impact": "Calculation or monetary effect",
  "files_changed": [],
  "tests": [],
  "approval_required": null,
  "unresolved_items": [],
  "recommended_next_milestone": null,
  "recommended_next_level": "Luna"
}
```

For a non-financial application, replace specialized impact fields with project-appropriate fields such as:

- user-data impact
- API-contract impact
- infrastructure impact
- device-control impact
- compliance impact
- migration impact

The schema makes the result machine-readable and simplifies PR generation.

---

## 8. GitHub Actions permissions

The workflow requires repository settings that allow GitHub Actions to publish its result.

Under:

```text
Settings → Actions → General → Workflow permissions
```

Enable:

- Read and write permissions
- Allow GitHub Actions to create and approve pull requests

The build job should still use minimal permissions, usually:

```yaml
permissions:
  contents: read
```

The publishing job receives only what it needs:

```yaml
permissions:
  contents: write
  pull-requests: write
  issues: write
```

Do not grant broad write access to the AI execution job.

---

## 9. OpenAI API configuration

Create a dedicated OpenAI project for the application or automation system.

Create an API key and add it to the repository as an Actions secret:

```text
OPENAI_API_KEY
```

Never commit the key to the repository.

Set a monthly spend limit and alerts before the first run.

Recommended controls:

- dedicated API project per important application
- low initial spend limit
- alerts at multiple thresholds
- model explicitly configured in the workflow
- no reliance on an unknown default model

---

## 10. Model and cost strategy

A universal Foreman should choose models by risk, not ego.

A practical policy is:

### Luna

Use for:

- documentation
- ordinary UI work
- contained bug fixes
- tests
- routine refactors
- backlog maintenance
- simple endpoints
- templates and scaffolding

### Terra

Use for:

- architecture
- concurrency
- authentication design
- database design
- provider integrations
- complex state transitions
- reconciliation logic
- security-sensitive code

### Sol

Reserve for:

- severe security incidents
- unusually difficult cross-system debugging
- major irreversible migrations
- high-risk algorithms
- deeply ambiguous legacy systems

Defaulting to the least expensive capable model keeps repeated milestone runs affordable.

The model should live in a tracked configuration file such as:

```text
.github/codex/model-default.txt
```

This makes cost behavior visible in code review.

---

## 11. Validation strategy

The project must have one reliable command that represents repository health.

Example:

```bash
bash scripts/ci.sh
```

That script may run:

- syntax checks
- unit tests
- integration tests
- linting
- schema validation
- forbidden-secret scans
- backlog validation
- documentation assertions
- build checks

The workflow should also run:

```bash
git diff --check
```

For pull requests, compare the actual base SHA to the actual head SHA rather than relying on GitHub's synthetic merge commit.

Validation should happen:

1. after Codex edits the workspace
2. after the publisher reapplies the patch to a clean checkout
3. again through normal PR CI

This is deliberate redundancy.

---

## 12. Pull request policy

Foreman-generated PRs should default to draft unless the project has an established automated review layer.

The PR body should include:

- milestone number and title
- model used
- Codex status
- validation result
- summary
- approval boundary
- structured handoff
- explicit statement that protected live actions still require approval

The reviewer should inspect both implementation and status claims.

A common failure mode is technically correct work paired with an incorrect claim that a milestone is complete. Status accuracy matters because it controls the next automatic run.

---

## 13. Recovery when publishing fails

The workflow should upload an artifact even when Codex or validation fails.

The artifact should contain:

- generated patch
- structured handoff
- execution metadata

This allows recovery when:

- GitHub cannot create the PR
- repository permissions are wrong
- branch push succeeds but PR creation fails
- a temporary GitHub outage occurs

A publishing failure should not require paying for another AI run when the patch already exists.

---

## 14. Universal safety patterns

### Fail closed

When uncertain, stop before the protected action rather than attempting a best guess.

### No secrets in browser code or repository history

Use environment variables, secret stores, and server-side execution.

### Prepare first, execute separately

The agent may create migrations, scripts, rollback plans, and tests. Live execution happens only after approval.

### Preserve rollback evidence

Before replacing policies, schemas, infrastructure, or configuration, capture the current state and prepare a recovery path.

### Evidence-based completion

A milestone is complete only when its acceptance criteria are supported by tests, deployment evidence, or documented owner confirmation.

### Human correction without rerunning AI

Small review fixes should be applied directly to the PR branch rather than launching another paid AI run.

---

## 15. Adapting the system to different application types

### Consumer mobile app

Add boundaries for:

- App Store submission
- push-notification credentials
- analytics SDKs
- privacy disclosures
- device permissions
- production API configuration

### SaaS platform

Add milestones for:

- tenant isolation
- billing
- account lifecycle
- support tooling
- observability
- rate limits
- compliance

Do not add these automatically to personal or internal tools.

### Industrial or hardware-control application

Add hard boundaries for:

- physical actuator commands
- safety interlocks
- firmware flashing
- PLC or robot deployment
- machine motion
- production-line configuration

Simulation and offline preparation may be automated. Physical execution requires explicit authorization and safety verification.

### Healthcare application

Add boundaries for:

- protected health information
- clinical recommendations
- regulated data storage
- audit requirements
- production access

### Financial application

Add boundaries for:

- account credentials
- financial-provider tokens
- money movement
- live balances and transactions
- financial methodology
- destructive reconciliation
- regulatory representations

### Data or analytics platform

Add boundaries for:

- source-of-truth changes
- destructive backfills
- personally identifiable information
- model deployment
- retention changes
- production metric definitions

---

## 16. Setup sequence for a new application

Use this order:

1. Create the GitHub repository.
2. Establish the authoritative branch.
3. Add product direction.
4. Add engineering rules.
5. Add `AGENTS.md` with approval boundaries.
6. Create a short milestone backlog.
7. Add a single repository health command.
8. Add the milestone selector.
9. Add the Codex prompt and JSON schema.
10. Add the two-job Foreman workflow.
11. Create a dedicated OpenAI API project and key.
12. Add `OPENAI_API_KEY` as a GitHub Actions secret.
13. Set API spend limits and alerts.
14. Enable GitHub Actions read/write and PR creation.
15. Set the default model explicitly.
16. Run a low-risk baseline milestone first.
17. Verify artifact creation, branch publishing, and PR creation.
18. Review and merge.
19. Refine milestone wording based on actual agent behavior.
20. Continue one milestone at a time.

---

## 17. Recommended first milestones for a new project

A broadly useful starting sequence is:

1. Establish the trusted baseline
2. Record product direction and non-goals
3. Add CI and repository health checks
4. Define security and approval boundaries
5. Document the current architecture
6. Define the canonical data model
7. Build the first complete vertical slice
8. Add error handling and observability
9. Add backup, recovery, and rollback procedures
10. Perform production-readiness review

The exact sequence should follow the application's real risk and value, not a generic template.

---

## 18. Known limitations

This system does not eliminate human review.

It may still:

- misunderstand incomplete milestone wording
- overstate completion
- create a correct template instead of the requested real inventory
- make architecture assumptions that need correction
- consume API spend on work that later fails during publishing
- require direct human fixes on the generated branch
- reach external boundaries that cannot be automated safely

The solution is not to remove controls. The solution is to improve milestone definitions, repository rules, tests, and review discipline.

---

## 19. The core reusable principle

The universal pattern is:

> Give the AI enough authority to complete safe engineering work, enough context to understand the product, enough tests to prove its changes, and clear boundaries that prevent it from crossing into protected real-world actions.

That balance is what turns an AI coding agent from a chat-based helper into a repeatable software-development system.

---

## Handoff summary

To reproduce this system in another repository:

- copy the architecture, not BDFA-specific financial rules
- replace the product direction and approval boundaries
- define outcome-based milestones
- keep AI execution separate from GitHub publishing
- use a structured result schema
- validate patches twice
- explicitly control the model and API spend
- keep protected actions human-approved
- correct small PR issues directly instead of rerunning the model
- advance the backlog only when evidence supports completion

With those pieces in place, the same Foreman approach can manage development across many different application types while preserving human control, reviewability, cost visibility, and safety.