#!/bin/bash
# Fast secret scanning (baseline). For deep scan, use trufflehog/ggshield in CI.
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

VIOLATIONS=0
EXCLUDES=(--exclude-dir=.git --exclude-dir=target --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=frontend/node_modules --exclude='*.lock' --exclude='package-lock.json')

run_rg() {
  if command -v rg >/dev/null 2>&1; then
    rg -n --color=never -uu ${EXCLUDES[@]} -e "$1" || true
  else
    grep -rn ${EXCLUDES[@]} -- "$1" . 2>/dev/null || true
  fi
}

echo "🔐 Secret scan (baseline)..."

# AWS Access Key ID / Secret Access Key
aws_id=$(run_rg "AKIA[0-9A-Z]{16}")
aws_secret=$(run_rg "(?i)aws(.{0,20})?(secret|access).{0,20}?[A-Za-z0-9/+=]{40}")
# Private keys
priv_keys=$(run_rg "-----BEGIN (RSA|EC|DSA|OPENSSH|PGP) PRIVATE KEY-----")
# Generic tokens
tokens=$(run_rg "(?i)(token|apikey|api_key|secret)[\s:=]+[A-Za-z0-9\-_\.]{16,}")

report() {
  local name="$1"; shift; local matches="$1"
  if [[ -n "$matches" ]]; then
    echo -e "${RED}❌ Potential secret: $name${NC}"
    echo "$matches" | sed 's/^/  - /' | head -20
    VIOLATIONS=$((VIOLATIONS+1))
  else
    echo -e "${GREEN}✅ $name: clean${NC}"
  fi
}

report "AWS_ACCESS_KEY_ID" "$aws_id"
report "AWS_SECRET_ACCESS_KEY" "$aws_secret"
report "Private Keys" "$priv_keys"
report "Generic tokens" "$tokens"

if [[ $VIOLATIONS -gt 0 ]]; then
  echo -e "${RED}🚫 Secret scan found $VIOLATIONS potential issues${NC}"
  exit 1
else
  echo -e "${GREEN}🎉 Secret scan passed${NC}"
fi
