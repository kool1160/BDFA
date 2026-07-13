# BDFA Automation

BDFA uses a controlled Codex workflow called **BDFA Foreman**. It turns the milestone backlog into a reviewable branch and pull request while preserving the approval boundaries in `AGENTS.md`.

## What is automated

A manually triggered Foreman run:

1. Reads `BACKLOG.md` and selects the first incomplete milestone, unless a milestone number is supplied.
2. Creates an isolated `codex/milestone-*` branch.
3. Runs the official `openai/codex-action@v1` in a workspace-write sandbox.
4. Gives Codex the complete milestone and allows it to finish every safe phase.
5. Runs BDFA repository checks.
6. Commits and pushes reviewable changes.
7. Opens one milestone pull request, or opens an issue when the milestone reaches an approval boundary without producing repository changes.

The workflow is intentionally manual rather than scheduled. This prevents surprise API spending and keeps a human decision between milestones.

## One-time repository setup

In GitHub, add an Actions repository secret named:

- `OPENAI_API_KEY` — an OpenAI API key authorized for Codex API usage.

Do not commit the key. The workflow passes it only to the official Codex action. The checkout does not persist the GitHub write token while Codex is running.

For a private financial application, keep the repository private before adding live provider integrations, personal institution inventories, or production credentials.

## Running the Foreman

1. Open the repository's **Actions** tab.
2. Select **BDFA Foreman**.
3. Choose **Run workflow**.
4. Leave the milestone field blank to use the first incomplete milestone, or enter a specific pending milestone number.
5. Leave **draft PR** enabled for security, database, authentication, RLS, provider, or financial-calculation work.

The run will create either:

- a pull request containing safe milestone work and a structured Planning Handoff; or
- an issue explaining the exact approval or blocker when no repository change should be made.

## Safety model

The Foreman is allowed to edit the checked-out repository. It is not authorized to:

- apply live Supabase migrations, RLS policies, or authentication changes;
- use live financial-provider credentials or production tokens;
- purchase services;
- perform destructive changes;
- deploy unverified financial calculations;
- change BDFA's product direction.

Codex may prepare the code, migration, tests, and verification steps for those actions, but it must stop before the protected operation.

## Continuous checks

`BDFA CI` runs on every pull request and on pushes to `main`. It checks:

- backlog milestone structure;
- JavaScript syntax across the repository;
- local assets referenced by HTML;
- whitespace errors in changed lines.

Run the same checks locally with:

```bash
bash scripts/ci.sh
```

## Cost and operating notes

Foreman runs use the OpenAI API key and are billed as API usage. A manual trigger is used so a failed loop cannot silently consume unlimited API spend. GitHub branch protection should require `BDFA CI` before merging milestone pull requests.
