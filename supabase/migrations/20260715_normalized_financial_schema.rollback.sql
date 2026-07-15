-- BDFA Milestone 15 rollback draft. Repository-only; do not run live.
-- This is destructive and requires separate approval after backup verification.
begin;
set local lock_timeout = '5s';
drop table if exists public.connection_events;
drop table if exists public.sync_runs;
drop table if exists public.asset_valuations;
drop table if exists public.manual_assets;
drop table if exists public.recurring_items;
drop table if exists public.liability_observations;
drop table if exists public.liabilities;
drop table if exists public.investment_transactions;
drop table if exists public.holdings;
drop table if exists public.transactions;
drop table if exists public.securities;
drop table if exists public.account_balances;
drop table if exists public.account_sources;
drop table if exists public.accounts;
drop table if exists public.financial_connections;
drop table if exists public.institutions;
commit;
