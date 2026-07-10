# BDFA Product Direction

## Purpose

BDFA is a private, personal financial application designed primarily for one owner: Chris.

It is not currently being developed as a public SaaS product, commercial fintech platform, subscription service, or broadly distributed consumer application.

All planning, architecture decisions, feature recommendations, and development priorities must reflect this personal-use direction.

## Core objective

BDFA should automatically connect and organize Chris's complete financial picture, including:

- checking and savings accounts
- credit cards
- mortgages and loans
- brokerage accounts
- 401(k) and retirement accounts
- HSA cash and investments
- manually valued assets such as a home and vehicles
- liabilities, recurring expenses, and cash flow
- total net worth
- portfolio performance and analytics

Automatic account balance, transaction, liability, and holdings synchronization is a core requirement. Manual entry and file imports are fallback methods for institutions that cannot be connected automatically.

## Product scope

Prioritize:

- reliable automatic account syncing
- support for Chris's actual institutions
- normalized provider-independent financial data
- accurate net-worth and Monthly Flow calculations
- portfolio analytics and contribution tracking
- retirement and part-time-work projections
- account freshness and connection-health reporting
- mobile-friendly use
- low maintenance
- strong security

Do not prioritize:

- public registration
- multiple unrelated users
- organizations or household accounts
- subscription tiers or Stripe billing
- marketing pages
- customer-support systems
- public App Store distribution
- enterprise scaling
- broad compatibility for institutions Chris does not use

## User and authentication model

The intended user model is one authorized owner.

- Public signup must be disabled.
- Access must be restricted to Chris's approved authenticated identity.
- Retain owner-scoped `user_id` boundaries where they improve security and maintainability.
- Do not add organization, membership, invitation, role, household, or tenant-routing systems.

## Financial connectivity

BDFA may use more than one provider because no single aggregator is expected to support every institution.

Planning should account for:

- Plaid for supported banks, cards, loans, and investment accounts
- an additional provider for unsupported institutions such as HealthEquity
- automatic scheduled syncing
- refresh on login or dashboard open where appropriate
- normalized accounts, balances, transactions, liabilities, holdings, and investment activity
- connection-health monitoring
- reauthentication alerts
- clearly displayed source and sync timestamps

“Real time” means the freshest data each provider and institution can reliably supply. BDFA must show when data was sourced and when BDFA last synchronized it.

## Portfolio and planning priorities

BDFA should eventually provide:

- combined allocation across every investment account
- holdings by account and across the complete portfolio
- contributions separated from investment gains
- realized and unrealized gains
- dividends and interest
- asset-class and sector exposure
- overlapping funds and duplicate holdings
- concentration risk
- HSA and 401(k) contribution tracking
- net-worth history
- retirement projections
- progress toward working less or going part-time after age 55

## Security

Personal use does not reduce the need for financial-data security.

Required principles:

- provider secrets handled only server-side
- secure storage of access tokens
- secrets stored through approved environment configuration
- Supabase Row Level Security
- access restricted to the approved owner
- no secrets in browser code or GitHub
- safe logging that excludes sensitive financial information
- MFA wherever supported
- account-disconnection and token-deletion controls
- backups and tested recovery procedures

## Decision rule

When choosing between approaches, prefer the one that:

1. works reliably for Chris
2. improves automatic financial syncing or financial understanding
3. protects sensitive data
4. is easy to maintain
5. avoids complexity created only for hypothetical public users

Keep the architecture clean enough that future expansion remains possible, but do not build or pay for public-product infrastructure unless the direction changes.
