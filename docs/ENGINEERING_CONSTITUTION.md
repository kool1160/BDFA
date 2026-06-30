# BDFA Engineering Constitution

This document is the canonical engineering standard for BDFA. All implementation work, maintenance work, and AI-assisted coding work in this repository must follow it.

## 1. Product Identity

BDFA means **Best Damn Financial App Ever**.

BDFA is a mobile-first financial operating system designed to make money simple, calm, and controlled. The product promise is:

> Know where every dollar belongs.

BDFA should show purpose, not just balances. Every screen, calculation, and interaction should help the user understand what they own, what they owe, what is reserved, and what is available to allocate.

## 2. Authoritative Engineering Rules

1. This Engineering Constitution is the highest-priority repository guidance document.
2. If another repository document conflicts with this file, this file takes precedence.
3. Product behavior must remain explainable in plain English.
4. Financial calculations must be deterministic, traceable, and easy to audit.
5. UI changes must preserve the calm, mobile-first, Apple-inspired design language.
6. Application code must stay simple until a real architectural need exists.
7. Do not introduce frameworks, build systems, backends, or dependencies without an explicit task requiring them.
8. Prefer small, focused changes over broad rewrites.
9. Do not make opportunistic changes outside the assigned task.
10. Do not alter user-facing behavior unless the task explicitly requires it.

## 3. Architecture Standard

BDFA currently uses a static frontend architecture:

- plain HTML
- plain CSS
- plain JavaScript
- static assets
- documentation in `docs/`

The repository must remain understandable without a build step unless a future task explicitly changes the architecture.

### 3.1 Separation of Concerns

- HTML defines structure and semantic content.
- CSS defines presentation, layout, responsive behavior, and visual states.
- JavaScript defines data shaping, calculations, rendering behavior, and interactions.
- Documentation defines product, design, workflow, and engineering guidance.

### 3.2 Application Boundaries

Do not mix unrelated concerns. In particular:

- Keep financial model logic separate from rendering logic where practical.
- Keep mock data adaptation separate from derived financial outputs.
- Keep analytics behavior isolated from Monthly Flow behavior.
- Keep documentation-only maintenance separate from application behavior changes.

## 4. Implementation Rules

Before implementing any task:

1. Read `AGENTS.md` if it exists.
2. Read this Engineering Constitution.
3. Inspect the files relevant to the task.
4. Identify the smallest safe change that satisfies the task.
5. Avoid touching files that are not required.

During implementation:

1. Preserve existing naming patterns unless there is a clear reason to change them.
2. Preserve existing formatting patterns within each file.
3. Avoid global rewrites for local problems.
4. Avoid speculative abstractions.
5. Do not add dead code, unused functions, unused CSS, or unused assets.
6. Do not wrap imports in `try`/`catch` blocks.
7. Keep code readable enough that financial behavior can be reviewed manually.

## 5. Financial Logic Standard

Financial logic is high-trust code. It must be treated as product-critical.

Financial calculations must be:

- deterministic
- documented through clear names and structure
- resistant to accidental double counting
- explicit about inflows, outflows, reserves, liabilities, and available funds
- easy to test or manually verify with mock data

Do not change financial formulas, derived output contracts, allocation rules, debt logic, bill timing logic, Monthly Flow behavior, or Analytics behavior unless the task explicitly requires that change.

## 6. Monthly Flow Protection

Monthly Flow is a protected product area.

Do not modify Monthly Flow files, calculations, UI, copy, styles, or data flow unless the assigned task explicitly names Monthly Flow as in scope.

When Monthly Flow is in scope:

1. Document the intended behavior before changing it.
2. Preserve existing contracts unless the task explicitly changes them.
3. Verify that related financial summaries still make sense.
4. Include regression notes in the final handoff.

## 7. Analytics Protection

Analytics is a protected product area.

Do not modify Analytics files, calculations, UI, copy, styles, or data flow unless the assigned task explicitly names Analytics as in scope.

When Analytics is in scope:

1. Identify source data and derived outputs before editing.
2. Preserve existing user-facing meaning unless the task explicitly changes it.
3. Verify that any displayed metric remains traceable to its source.
4. Include regression notes in the final handoff.

## 8. UI and UX Standard

BDFA is Apple-inspired, not Apple-copied. The UI must remain calm, clear, and mobile-first.

UI rules:

- Design mobile-first.
- Support iPhone and iPad layouts from day one.
- Prefer large readable numbers.
- Use soft cards and clear spacing.
- Keep dark mode first unless a task says otherwise.
- Avoid clutter.
- Avoid dense finance tables on primary screens.
- Each screen should answer one clear question.
- Use plain English instead of finance jargon unless the user asks for technical detail.

Responsive expectations:

- iPhone: single-column cards.
- iPad portrait: larger cards and tighter spacing.
- iPad landscape: two-column dashboard and panels where appropriate.
- Desktop: only expand complexity when the design remains calm and clear.

## 9. Coding Standards

### 9.1 HTML

- Preserve semantic structure.
- Do not add unnecessary wrapper elements.
- Keep accessibility in mind for headings, labels, buttons, and landmarks.
- Do not change copy unless the task requires it.

### 9.2 CSS

- Follow existing CSS organization and naming patterns.
- Prefer targeted selectors over broad overrides.
- Avoid magic values when an existing token or pattern is available.
- Preserve responsive behavior.
- Do not modify unrelated visual areas.

### 9.3 JavaScript

- Use plain JavaScript.
- Keep functions small and named for intent.
- Prefer explicit data transformations over clever shortcuts.
- Avoid hidden side effects.
- Preserve existing public contracts between modules.
- Do not introduce dependencies unless explicitly required.

### 9.4 Documentation

- Documentation should be direct, durable, and easy to follow.
- Prefer canonical guidance over duplicate guidance.
- When adding new process rules, make the owner and scope clear.
- Keep maintenance documents aligned with current repository architecture.

## 10. Planning Workflow

For non-trivial tasks, use this workflow:

1. Confirm scope.
2. Identify protected areas that must not be touched.
3. Inspect relevant files.
4. Plan the smallest safe change.
5. Implement only the scoped change.
6. Run appropriate checks.
7. Review the diff.
8. Commit the completed work.
9. Provide a clear handoff.

For documentation-only tasks, do not modify application code, HTML, CSS, or JavaScript unless explicitly required.

## 11. Testing Expectations

Testing should match the risk and scope of the change.

Minimum expectations:

- Documentation-only changes: verify changed files and review the diff.
- HTML/CSS changes: inspect affected UI and responsive behavior where possible.
- JavaScript changes: run available checks and manually reason through affected data paths.
- Financial logic changes: verify calculations with representative mock data and include regression notes.

If a check cannot run because of an environment limitation, report it clearly as a warning.

## 12. Git and Change Hygiene

- Keep commits focused.
- Commit only files required for the task.
- Do not include generated, temporary, or unrelated files.
- Review `git diff` before committing.
- Ensure `git status` is clean after committing unless the handoff explicitly explains otherwise.

## 13. Standard Planning Handoff

Maintenance and implementation tasks should end with a Planning Handoff that includes:

- Status
- Files Changed
- Commit SHA
- Pull Request, when applicable
- Tests or checks performed
- Notes or risks, when useful

The handoff must be concise but complete enough for the next engineer or agent to continue safely.

## 14. Output Format Standard

When reporting completed code or documentation changes, include:

- a summary of what changed
- file references for changed files
- tests or checks run
- whether the work was committed
- the commit SHA
- pull request information when available

Commands reported in the testing section should indicate pass, warning, or failure.

## 15. Non-Negotiable Guardrails

Unless explicitly instructed by the task, do not:

- modify application behavior
- modify Monthly Flow
- modify Analytics
- modify financial formulas
- modify derived output contracts
- introduce dependencies
- introduce a build step
- rewrite unrelated files
- change HTML, CSS, or JavaScript during documentation-only maintenance

BDFA should remain simple, understandable, auditable, and calm.
