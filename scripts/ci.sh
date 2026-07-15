#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

echo "::group::Backlog structure"
node scripts/bdfa-backlog.mjs validate
echo "::endgroup::"

echo "::group::JavaScript syntax"
mapfile -d '' javascript_files < <(find . -type f -name '*.js' \
  -not -path './.git/*' \
  -not -path './node_modules/*' \
  -not -path './vendor/*' \
  -print0 | sort -z)
if ((${#javascript_files[@]} == 0)); then
  echo "No JavaScript files found."
else
  for file in "${javascript_files[@]}"; do
    node --check "$file"
  done
  echo "Checked ${#javascript_files[@]} JavaScript file(s)."
fi
echo "::endgroup::"

echo "::group::Single-owner security preparation"
python3 scripts/check-single-owner-security.py
echo "::endgroup::"

echo "::group::Normalized schema migration draft safety"
python3 scripts/check-normalized-schema-draft.py
echo "::endgroup::"

echo "::group::Static asset integrity"
python3 scripts/check-static-site.py
echo "::endgroup::"

echo "::group::Financial truth representative checks"
node scripts/test-financial-truth.mjs
echo "::endgroup::"

echo "::group::Portfolio analytics representative checks"
node scripts/test-portfolio-analytics.mjs
echo "::endgroup::"

echo "::group::Retirement planning representative checks"
node scripts/test-retirement-planning.mjs
echo "::endgroup::"

echo "::group::Dashboard integration representative checks"
node scripts/test-dashboard-integration.mjs
echo "::endgroup::"

echo "::group::Data trust representative checks"
node scripts/test-data-trust.mjs
echo "::endgroup::"

echo "::group::Manual source record representative checks"
node scripts/test-manual-source-records.mjs
echo "::endgroup::"

echo "::group::Normalized source reconciliation representative checks"
node scripts/test-normalized-source-reconciliation.mjs
echo "::endgroup::"

echo "::group::Monthly Flow intelligence representative checks"
node scripts/test-monthly-flow-intelligence.mjs
echo "::endgroup::"

echo "::group::Source import/export recovery representative checks"
node scripts/test-source-recovery.mjs
echo "::endgroup::"

echo "::group::Provider adapter contract and sandbox checks"
node scripts/test-provider-adapter-contract.mjs
echo "::endgroup::"

echo "BDFA repository checks passed."
