-- Protected live change: do not run without Chris's explicit approval.
-- psql variables owner_user_id and owner_email must be supplied securely at execution.
\set ON_ERROR_STOP on

begin;

do $$
begin
  if to_regclass('public.bdfa_source_snapshots') is null then
    raise exception 'Expected public.bdfa_source_snapshots is missing';
  end if;
  if exists (select 1 from public.bdfa_source_snapshots where user_id is null) then
    raise exception 'Snapshot rows without user_id require investigation';
  end if;
  if (select count(distinct user_id) from public.bdfa_source_snapshots) > 1 then
    raise exception 'Multiple snapshot owners require investigation';
  end if;
end $$;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.approved_users (
  user_id uuid primary key references auth.users(id) on delete restrict,
  approved_email text not null check (btrim(approved_email) <> ''),
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index approved_users_email_lower_key
  on public.approved_users (lower(approved_email));

alter table public.approved_users enable row level security;
alter table public.approved_users force row level security;
revoke all on table public.approved_users from public, anon, authenticated;

create function private.set_approved_user_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_approved_user_updated_at() from public, anon, authenticated;

create trigger approved_users_set_updated_at
before update on public.approved_users
for each row execute function private.set_approved_user_updated_at();

insert into public.approved_users (user_id, approved_email, enabled)
values (:'owner_user_id'::uuid, lower(btrim(:'owner_email')), true);

do $$
begin
  if (select count(*) from public.approved_users where enabled) <> 1 then
    raise exception 'Exactly one enabled approved owner is required';
  end if;
  if exists (
    select 1 from public.bdfa_source_snapshots
    where user_id <> (select user_id from public.approved_users where enabled)
  ) then
    raise exception 'Existing snapshot ownership does not match approved owner';
  end if;
end $$;

create function private.is_current_user_approved()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.approved_users
      where user_id = auth.uid() and enabled
    );
$$;

revoke all on function private.is_current_user_approved() from public, anon;
grant execute on function private.is_current_user_approved() to authenticated;

do $$
declare policy_record record;
begin
  for policy_record in
    select policyname
    from pg_catalog.pg_policies
    where schemaname = 'public' and tablename = 'bdfa_source_snapshots'
  loop
    execute format('drop policy %I on public.bdfa_source_snapshots', policy_record.policyname);
  end loop;
end $$;

alter table public.bdfa_source_snapshots enable row level security;
alter table public.bdfa_source_snapshots force row level security;
revoke all on table public.bdfa_source_snapshots from public, anon;
grant select, insert, update, delete on table public.bdfa_source_snapshots to authenticated;

create policy bdfa_source_snapshots_select_approved_owner
on public.bdfa_source_snapshots for select to authenticated
using (auth.uid() = user_id and private.is_current_user_approved());

create policy bdfa_source_snapshots_insert_approved_owner
on public.bdfa_source_snapshots for insert to authenticated
with check (auth.uid() = user_id and private.is_current_user_approved());

create policy bdfa_source_snapshots_update_approved_owner
on public.bdfa_source_snapshots for update to authenticated
using (auth.uid() = user_id and private.is_current_user_approved())
with check (auth.uid() = user_id and private.is_current_user_approved());

create policy bdfa_source_snapshots_delete_approved_owner
on public.bdfa_source_snapshots for delete to authenticated
using (auth.uid() = user_id and private.is_current_user_approved());

do $$
begin
  if (select count(*) from pg_catalog.pg_policies
      where schemaname = 'public' and tablename = 'bdfa_source_snapshots') <> 4 then
    raise exception 'Unexpected snapshot policy count';
  end if;
  if has_table_privilege('anon', 'public.approved_users', 'select')
     or has_table_privilege('authenticated', 'public.approved_users', 'select') then
    raise exception 'Allowlist is readable by a browser role';
  end if;
end $$;

-- The operator must inspect the staged catalog in this session before answering.
select relrowsecurity as rls_enabled, relforcerowsecurity as rls_forced
from pg_catalog.pg_class
where oid = 'public.bdfa_source_snapshots'::regclass;

select policyname, roles, cmd, qual, with_check
from pg_catalog.pg_policies
where schemaname = 'public' and tablename = 'bdfa_source_snapshots'
order by policyname;

select count(*) as enabled_approved_owner_count
from public.approved_users
where enabled;

\prompt 'Commit the staged security boundary? Type true to COMMIT; anything else rolls back: ' commit_changes
\if :commit_changes
  commit;
  \echo 'Security boundary committed.'
\else
  rollback;
  \echo 'Security boundary rolled back.'
\endif
