# Roadmap

## Phase 1 — Static prototype

- Build responsive HTML/CSS/JS prototype
- Use mock data
- Create Home dashboard
- Create expandable Accounts, Bills, Allocations, Investments sections
- Add AI assistant placeholder

## Phase 2 — Local data

- Add local storage
- Add editable accounts
- Add editable bills
- Add recurring bill schedule logic
- Calculate Available to Allocate dynamically

## Phase 3 — Real integrations

- Add backend
- Add auth
- Add financial aggregators
- Add manual CSV/import fallback
- Add statement upload fallback

## Phase 4 — Intelligence

- Add AI assistant
- Ask questions about affordability, savings, investments, and allocation
- Explain why Available to Allocate changed

## Current engine wiring status

The reusable financial engine files are ES modules that exist as architecture foundations, but they are not currently loaded by the static dashboard. Future wiring should use `type="module"` or an equivalent module-aware approach when a scoped engine-integration task connects them.
