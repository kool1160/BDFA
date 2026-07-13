-- Read-only capture for the live security state before any Milestone 2 change.
-- Run in psql with a privileged, read-only session and save the output outside
-- the repository. The output may contain policy expressions and role names.
\set ON_ERROR_STOP on

\echo '=== RLS flags ==='
select n.nspname as schema_name,
       c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('bdfa_source_snapshots', 'approved_users')
order by c.relname;

\echo '=== Existing policy definitions ==='
select schemaname,
       tablename,
       policyname,
       permissive,
       roles,
       cmd,
       qual,
       with_check
from pg_catalog.pg_policies
where schemaname = 'public'
  and tablename in ('bdfa_source_snapshots', 'approved_users')
order by tablename, policyname;

\echo '=== Existing table grants ==='
select grantee,
       table_schema,
       table_name,
       privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('bdfa_source_snapshots', 'approved_users')
order by table_name, grantee, privilege_type;

\echo '=== Generated CREATE POLICY rollback statements for snapshots ==='
select format(
  'create policy %I on %I.%I as %s for %s to %s%s%s;',
  policyname,
  schemaname,
  tablename,
  case when permissive = 'PERMISSIVE' then 'permissive' else 'restrictive' end,
  lower(cmd),
  array_to_string(roles, ', '),
  case when qual is not null then format(' using (%s)', qual) else '' end,
  case when with_check is not null then format(' with check (%s)', with_check) else '' end
)
from pg_catalog.pg_policies
where schemaname = 'public'
  and tablename = 'bdfa_source_snapshots'
order by policyname;

\echo 'Capture complete. Store this output securely outside source control before proceeding.'
