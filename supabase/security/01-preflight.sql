-- Read-only Milestone 2 catalog preflight. Run with a privileged, read-only session.
-- Review every result before applying 02-lock-to-approved-owner.sql.

select current_database() as database_name, current_user as inspecting_role;

select n.nspname as schema_name, c.relname as table_name,
       c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
order by c.relname;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_catalog.pg_policies
where schemaname = 'public'
order by tablename, policyname;

select grantee, table_schema, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated', 'public')
order by table_name, grantee, privilege_type;

select n.nspname as schema_name, p.proname as function_name,
       pg_catalog.pg_get_userbyid(p.proowner) as owner,
       p.prosecdef as security_definer,
       p.proconfig as configuration,
       pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'private')
order by n.nspname, p.proname;

select event_object_schema, event_object_table, trigger_name, action_timing, event_manipulation
from information_schema.triggers
where event_object_schema = 'public'
order by event_object_table, trigger_name;

select count(*) as snapshot_rows,
       count(*) filter (where user_id is null) as snapshots_without_owner,
       count(distinct user_id) as distinct_snapshot_owners
from public.bdfa_source_snapshots;

