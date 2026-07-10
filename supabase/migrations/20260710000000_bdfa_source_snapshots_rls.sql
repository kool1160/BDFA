-- Task 174: Verify Supabase RLS and user isolation for BDFA source snapshots.
-- This migration intentionally uses only authenticated-user ownership checks.
-- It does not grant service-role access or expose secrets.

alter table public.bdfa_source_snapshots enable row level security;

-- Optional hardening: table owners should also be subject to RLS unless explicitly bypassed by Supabase internals.
alter table public.bdfa_source_snapshots force row level security;

drop policy if exists "bdfa_source_snapshots_select_own" on public.bdfa_source_snapshots;
drop policy if exists "bdfa_source_snapshots_insert_own" on public.bdfa_source_snapshots;
drop policy if exists "bdfa_source_snapshots_update_own" on public.bdfa_source_snapshots;
drop policy if exists "bdfa_source_snapshots_delete_own" on public.bdfa_source_snapshots;

create policy "bdfa_source_snapshots_select_own"
  on public.bdfa_source_snapshots
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "bdfa_source_snapshots_insert_own"
  on public.bdfa_source_snapshots
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "bdfa_source_snapshots_update_own"
  on public.bdfa_source_snapshots
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "bdfa_source_snapshots_delete_own"
  on public.bdfa_source_snapshots
  for delete
  to authenticated
  using (auth.uid() = user_id);
