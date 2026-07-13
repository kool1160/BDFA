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

echo "::group::Static asset integrity"
python3 scripts/check-static-site.py
echo "::endgroup::"

echo "BDFA repository checks passed."
