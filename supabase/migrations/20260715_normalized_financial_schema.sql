-- BDFA Milestone 15: normalized financial schema and owner-scoped RLS draft.
-- REPOSITORY-ONLY DRAFT. Do not run against any Supabase project.
-- This file intentionally contains no owner UUID, email, credential, or token.
-- It requires the separately approved Milestone 2 security foundation:
-- private.is_current_user_approved() and public.approved_users.

begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
begin
  if to_regprocedure('private.is_current_user_approved()') is null then
    raise exception 'Missing approved-user helper; apply the approved owner security foundation first';
  end if;
  if to_regclass('public.approved_users') is null then
    raise exception 'Missing approved_users; apply the approved owner security foundation first';
  end if;
end $$;

create table public.institutions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete restrict,
  name text not null check (btrim(name) <> ''), legal_name text,
  institution_type text not null check (institution_type in ('bank', 'brokerage', 'employer', 'lender', 'hsa', 'other')),
  website text, source_kind text not null check (source_kind in ('provider', 'manual', 'import', 'system')),
  source_connection_id uuid, source_record_id text, observed_at timestamptz, effective_at timestamptz,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.financial_connections (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete restrict,
  institution_id uuid not null references public.institutions(id) on delete restrict,
  provider_name text not null, provider_connection_id text not null,
  status text not null check (status in ('active', 'stale', 'reauthentication_required', 'error', 'disconnected')),
  last_attempted_at timestamptz, last_successful_at timestamptz, provider_data_as_of timestamptz,
  error_code text, error_message text, requires_reauthentication boolean not null default false,
  token_reference text, source_kind text not null default 'provider' check (source_kind = 'provider'),
  source_record_id text, observed_at timestamptz, effective_at timestamptz,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, provider_name, provider_connection_id)
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete restrict,
  institution_id uuid references public.institutions(id) on delete restrict, name text not null check (btrim(name) <> ''),
  account_type text not null, account_subtype text, currency char(3) not null default 'USD',
  status text not null default 'active' check (status in ('active', 'closed', 'unknown')),
  include_in_net_worth boolean not null default true, include_in_available_cash boolean not null default false,
  is_manual boolean not null default false, display_mask text, reconciliation_state text not null default 'unreviewed',
  source_kind text not null check (source_kind in ('provider', 'manual', 'import', 'system')),
  source_connection_id uuid, source_record_id text, observed_at timestamptz, effective_at timestamptz,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.account_sources (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete restrict,
  account_id uuid not null references public.accounts(id) on delete cascade,
  financial_connection_id uuid not null references public.financial_connections(id) on delete restrict,
  provider_account_id text not null, display_mask text, is_preferred_source boolean not null default false,
  last_seen_at timestamptz, link_status text not null default 'active' check (link_status in ('active', 'missing', 'unlinked')),
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, financial_connection_id, provider_account_id)
);

create table public.account_balances (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete restrict,
  account_id uuid not null references public.accounts(id) on delete cascade, source_connection_id uuid, source_record_id text,
  available_amount numeric(20, 4), current_amount numeric(20, 4) not null, limit_amount numeric(20, 4), currency char(3) not null default 'USD',
  balance_type text not null default 'current', as_of timestamptz not null, observed_at timestamptz not null,
  reconciliation_state text not null default 'unreviewed', metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, account_id, source_connection_id, source_record_id, as_of)
);

create table public.securities (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete restrict,
  symbol text, name text not null, security_type text, currency char(3) not null default 'USD',
  source_kind text not null check (source_kind in ('provider', 'manual', 'import', 'system')),
  source_connection_id uuid, source_record_id text, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, source_connection_id, source_record_id)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete restrict,
  account_id uuid not null references public.accounts(id) on delete cascade, source_connection_id uuid, source_record_id text not null,
  transaction_date date not null, posted_date date, name text not null, merchant_name text, amount numeric(20, 4) not null,
  currency char(3) not null default 'USD', direction text not null check (direction in ('inflow', 'outflow', 'transfer', 'unknown')),
  transaction_type text not null, category text, subcategory text, pending boolean not null default false,
  status text not null default 'posted' check (status in ('pending', 'posted', 'removed', 'unknown')), transfer_group_id uuid,
  observed_at timestamptz not null, effective_at timestamptz, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, account_id, source_connection_id, source_record_id)
);

create table public.holdings (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete restrict,
  account_id uuid not null references public.accounts(id) on delete cascade, security_id uuid not null references public.securities(id) on delete restrict,
  source_connection_id uuid, source_record_id text, quantity numeric(28, 10) not null, price numeric(20, 6), market_value numeric(20, 4),
  currency char(3) not null default 'USD', as_of timestamptz not null, observed_at timestamptz not null,
  cost_basis_status text not null default 'unknown', metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, account_id, security_id, source_connection_id, source_record_id, as_of)
);

create table public.investment_transactions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete restrict,
  account_id uuid not null references public.accounts(id) on delete cascade, security_id uuid references public.securities(id) on delete restrict,
  source_connection_id uuid, source_record_id text not null, transaction_date date not null,
  transaction_type text not null check (transaction_type in ('buy', 'sell', 'dividend', 'interest', 'contribution', 'withdrawal', 'fee', 'transfer', 'split', 'adjustment')),
  quantity numeric(28, 10), price numeric(20, 6), amount numeric(20, 4), currency char(3) not null default 'USD',
  observed_at timestamptz not null, effective_at timestamptz, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, account_id, source_connection_id, source_record_id)
);

create table public.liabilities (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete restrict,
  institution_id uuid references public.institutions(id) on delete restrict, linked_asset_id uuid, name text not null,
  liability_type text not null, currency char(3) not null default 'USD', principal_amount numeric(20, 4), interest_rate numeric(10, 6),
  payment_amount numeric(20, 4), due_day smallint check (due_day between 1 and 31), originated_on date, maturity_on date,
  status text not null default 'active' check (status in ('active', 'paid', 'closed', 'unknown')), include_in_net_worth boolean not null default true,
  source_kind text not null check (source_kind in ('provider', 'manual', 'import', 'system')), source_connection_id uuid, source_record_id text,
  observed_at timestamptz, effective_at timestamptz, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.liability_observations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete restrict,
  liability_id uuid not null references public.liabilities(id) on delete cascade, source_connection_id uuid, source_record_id text,
  balance_amount numeric(20, 4) not null, interest_rate numeric(10, 6), payment_amount numeric(20, 4), delinquent boolean,
  as_of timestamptz not null, observed_at timestamptz not null, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, liability_id, source_connection_id, source_record_id, as_of)
);

create table public.recurring_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete restrict,
  account_id uuid references public.accounts(id) on delete set null, name text not null,
  direction text not null check (direction in ('income', 'expense')), amount numeric(20, 4) not null check (amount >= 0),
  currency char(3) not null default 'USD', frequency text not null, next_occurrence_date date, day_of_month smallint check (day_of_month between 1 and 31),
  active boolean not null default true, category text, confidence text not null default 'unknown', source_transaction_rule text,
  source_kind text not null check (source_kind in ('provider', 'manual', 'import', 'system')), source_connection_id uuid, source_record_id text,
  observed_at timestamptz, effective_at timestamptz, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.manual_assets (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete restrict,
  name text not null, asset_type text not null, currency char(3) not null default 'USD', include_in_net_worth boolean not null default true,
  linked_liability_id uuid references public.liabilities(id) on delete set null, notes text,
  source_kind text not null default 'manual' check (source_kind in ('manual', 'import')), source_record_id text,
  observed_at timestamptz, effective_at timestamptz, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

alter table public.liabilities add constraint liabilities_linked_asset_fk foreign key (linked_asset_id)
  references public.manual_assets(id) on delete set null;

create table public.asset_valuations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete restrict,
  asset_id uuid not null references public.manual_assets(id) on delete cascade, amount numeric(20, 4) not null, currency char(3) not null default 'USD',
  as_of timestamptz not null, valuation_method text not null, confidence text not null default 'unknown', notes text,
  source_kind text not null check (source_kind in ('manual', 'import', 'provider', 'system')), source_record_id text, observed_at timestamptz not null,
  effective_at timestamptz, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, asset_id, source_record_id, as_of)
);

create table public.sync_runs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete restrict,
  financial_connection_id uuid not null references public.financial_connections(id) on delete cascade, started_at timestamptz not null default now(), completed_at timestamptz,
  status text not null check (status in ('running', 'succeeded', 'partial', 'failed', 'cancelled')), requested_scopes jsonb not null default '[]'::jsonb,
  record_counts jsonb not null default '{}'::jsonb, provider_cursor_reference text, error_code text, error_message text,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.connection_events (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete restrict,
  financial_connection_id uuid not null references public.financial_connections(id) on delete cascade,
  event_type text not null check (event_type in ('connected', 'refreshed', 'partial_data', 'reauthentication_required', 'error', 'disconnected')),
  occurred_at timestamptz not null default now(), safe_error_code text, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

do $$
declare table_name text;
begin
  foreach table_name in array array['institutions', 'financial_connections', 'accounts', 'account_sources', 'account_balances', 'securities', 'transactions', 'holdings', 'investment_transactions', 'liabilities', 'liability_observations', 'recurring_items', 'manual_assets', 'asset_valuations', 'sync_runs', 'connection_events'] loop
    execute format('create index %I on public.%I (user_id)', 'idx_' || table_name || '_user_id', table_name);
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
    execute format('revoke all on table public.%I from public, anon', table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);
    execute format($policy$create policy %I on public.%I for all to authenticated using (auth.uid() = user_id and private.is_current_user_approved()) with check (auth.uid() = user_id and private.is_current_user_approved())$policy$, table_name || '_approved_owner_all', table_name);
  end loop;
end $$;

commit;
