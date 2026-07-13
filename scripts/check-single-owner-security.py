#!/usr/bin/env python3
from pathlib import Path


root = Path(__file__).resolve().parent.parent
index = (root / "index.html").read_text()
client = (root / "js/supabase-client.js").read_text()
capture_sql = (root / "supabase/security/00-capture-current-security-state.sql").read_text()
policy_sql = (root / "supabase/security/02-lock-to-approved-owner.sql").read_text()
lockdown_sql = (root / "supabase/security/03-emergency-lockdown.sql").read_text()
runbook = (root / "docs/SINGLE_OWNER_SECURITY_RUNBOOK.md").read_text()

assert 'id="authSignUp"' not in index, "Public signup control is present"
assert ".auth.signUp(" not in client, "Browser signup call is present"
assert ".auth.resetPasswordForEmail(" in client, "Password recovery request is missing"
assert ".auth.updateUser({ password })" in client, "Password recovery completion is missing"

required_sql = (
    "alter table public.approved_users enable row level security",
    "revoke all on table public.approved_users from public, anon, authenticated",
    "security definer",
    "set search_path = ''",
    "revoke all on function private.is_current_user_approved() from public, anon",
    "auth.uid() = user_id and private.is_current_user_approved()",
    "alter table public.bdfa_source_snapshots force row level security",
)
for requirement in required_sql:
    assert requirement in policy_sql, f"Security SQL requirement missing: {requirement}"

assert "owner_user_id'::uuid" in policy_sql, "Owner identity must be an execution variable"
assert "owner_email'" in policy_sql, "Owner email must be an execution variable"

required_capture = (
    "Existing policy definitions",
    "Existing table grants",
    "Generated CREATE POLICY rollback statements",
    "pg_catalog.pg_policies",
)
for requirement in required_capture:
    assert requirement in capture_sql, f"Pre-change capture requirement missing: {requirement}"

required_lockdown = (
    "force row level security",
    "revoke all on table public.bdfa_source_snapshots from public, anon, authenticated",
    "set enabled = false",
    "Commit emergency fail-closed lockdown?",
)
for requirement in required_lockdown:
    assert requirement in lockdown_sql, f"Emergency lockdown requirement missing: {requirement}"

assert "00-capture-current-security-state.sql" in runbook, "Runbook does not require pre-change capture"
assert "03-emergency-lockdown.sql" in runbook, "Runbook does not document emergency containment"
assert "Do not improvise prior policy definitions from memory" in runbook, "Rollback guidance is incomplete"

print("Single-owner security preparation checks passed.")
