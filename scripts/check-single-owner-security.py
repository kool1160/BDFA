#!/usr/bin/env python3
from pathlib import Path


root = Path(__file__).resolve().parent.parent
index = (root / "index.html").read_text()
client = (root / "js/supabase-client.js").read_text()
policy_sql = (root / "supabase/security/02-lock-to-approved-owner.sql").read_text()

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

print("Single-owner security preparation checks passed.")

