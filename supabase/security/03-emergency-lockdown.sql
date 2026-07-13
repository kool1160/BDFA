-- Emergency fail-closed control for Milestone 2.
-- This does not restore the prior policy set. It blocks browser-role access while
-- the captured pre-change state is reviewed and restored by a privileged operator.
-- Run only with Chris's explicit approval and a privileged interactive session.
\set ON_ERROR_STOP on

begin;

alter table public.bdfa_source_snapshots enable row level security;
alter table public.bdfa_source_snapshots force row level security;
revoke all on table public.bdfa_source_snapshots from public, anon, authenticated;

update public.approved_users
set enabled = false,
    updated_at = now()
where enabled;

select count(*) as enabled_approved_owner_count
from public.approved_users
where enabled;

\prompt 'Commit emergency fail-closed lockdown? Type true to COMMIT; anything else rolls back: ' commit_lockdown
\if :commit_lockdown
  commit;
  \echo 'Emergency lockdown committed. Restore only from the securely captured pre-change state.'
\else
  rollback;
  \echo 'Emergency lockdown rolled back.'
\endif
