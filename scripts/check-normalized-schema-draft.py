#!/usr/bin/env python3
"""Static safety checks for the repository-only normalized SQL draft."""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
forward = (root / 'supabase/migrations/20260715_normalized_financial_schema.sql').read_text()
rollback = (root / 'supabase/migrations/20260715_normalized_financial_schema.rollback.sql').read_text()
assert 'REPOSITORY-ONLY DRAFT' in forward
assert 'private.is_current_user_approved()' in forward
assert not re.search(r'[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}', forward, re.I)
assert not re.search(r'(access[_ -]?token|client[_ -]?secret|service[_ -]?role|password)\s*[:=]', forward, re.I)
tables = ['institutions', 'financial_connections', 'accounts', 'account_sources', 'account_balances', 'securities', 'transactions', 'holdings', 'investment_transactions', 'liabilities', 'liability_observations', 'recurring_items', 'manual_assets', 'asset_valuations', 'sync_runs', 'connection_events']
for table in tables:
    assert f"'{table}'" in forward
    assert f'idx_\' || table_name || \'_user_id' in forward
assert 'force row level security' in forward
assert 'grant select, insert, update, delete' in forward
assert 'drop table if exists public.institutions' in rollback
assert 'drop table if exists public.connection_events' in rollback
print(f'Normalized schema draft checks passed for {len(tables)} tables.')
