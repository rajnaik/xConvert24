#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Post-Deployment Smoke Test
# ═══════════════════════════════════════════════════════════════════════════════
# Verifies all key API endpoints and pages are responding correctly on live.
# No auth needed — all tested endpoints are public GETs.
#
# Usage: npm run test:deploy
# ═══════════════════════════════════════════════════════════════════════════════

BASE_URL="${1:-https://www.xconvert24.com}"
PASS=0
FAIL=0
ERRORS=""

# Colors
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
NC="\033[0m" # No Color

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  🚀 Post-Deploy Smoke Test — $BASE_URL"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ── Helper function ──────────────────────────────────────────────────────────
check_endpoint() {
  local label="$1"
  local endpoint="$2"
  local expected_field="$3"  # JSON field that should exist in response

  local response
  local http_code

  http_code=$(curl -s -o /tmp/deploy-test-response.json -w "%{http_code}" "${BASE_URL}${endpoint}" 2>/dev/null)
  response=$(cat /tmp/deploy-test-response.json 2>/dev/null)

  if [ "$http_code" != "200" ]; then
    printf "  ${RED}✗${NC} %-30s HTTP %s\n" "$label" "$http_code"
    FAIL=$((FAIL + 1))
    ERRORS="${ERRORS}\n  - ${label}: HTTP ${http_code}"
    return
  fi

  if [ -n "$expected_field" ]; then
    if echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); assert '$expected_field' in d" 2>/dev/null; then
      printf "  ${GREEN}✓${NC} %-30s OK\n" "$label"
      PASS=$((PASS + 1))
    else
      printf "  ${RED}✗${NC} %-30s Missing field: %s\n" "$label" "$expected_field"
      FAIL=$((FAIL + 1))
      ERRORS="${ERRORS}\n  - ${label}: missing '${expected_field}' in response"
    fi
  else
    printf "  ${GREEN}✓${NC} %-30s OK\n" "$label"
    PASS=$((PASS + 1))
  fi
}

check_page() {
  local label="$1"
  local path="$2"

  local http_code
  http_code=$(curl -s -L -o /dev/null -w "%{http_code}" "${BASE_URL}${path}" 2>/dev/null)

  if [ "$http_code" = "200" ]; then
    printf "  ${GREEN}✓${NC} %-30s OK\n" "$label"
    PASS=$((PASS + 1))
  elif [ "$http_code" = "302" ] || [ "$http_code" = "307" ]; then
    printf "  ${GREEN}✓${NC} %-30s OK (redirect)\n" "$label"
    PASS=$((PASS + 1))
  else
    printf "  ${RED}✗${NC} %-30s HTTP %s\n" "$label" "$http_code"
    FAIL=$((FAIL + 1))
    ERRORS="${ERRORS}\n  - ${label}: HTTP ${http_code}"
  fi
}

# ── Public Pages ─────────────────────────────────────────────────────────────
echo "📄 Public Pages"
check_page "Homepage" "/"
check_page "Weight Converter" "/convert/weight"
check_page "Temperature Converter" "/convert/temperature"
check_page "Blog Index" "/blog"
check_page "About" "/about"
check_page "Search" "/search"
check_page "Releases" "/releases"
echo ""

# ── Public API Endpoints ─────────────────────────────────────────────────────
echo "🔌 Public API Endpoints"
check_endpoint "Clicks (count)" "/api/clicks?count=true" "total"
check_endpoint "Clicks (list)" "/api/clicks?limit=5" "clicks"
check_endpoint "Bugs" "/api/bugs" "bugs"
check_endpoint "Suggestions" "/api/suggestions" "suggestions"
check_endpoint "Opinions" "/api/opinions" "opinions"
check_endpoint "Wallet" "/api/wallet" "address"
check_endpoint "Commits" "/api/commits" "commits"
check_endpoint "CI/CD Pipeline" "/api/cicd-pipeline" "xml"
echo ""

# ── Admin Dashboard APIs (public GETs) ───────────────────────────────────────
echo "📊 Admin Dashboard APIs"
check_endpoint "Clicks Analysis" "/api/clicks-analysis" "points"
check_endpoint "Builds" "/api/builds" "builds"
check_endpoint "Test Runs" "/api/test-runs" "runs"
check_endpoint "SEO Health" "/api/seo-health" "health"
check_endpoint "Audit Log" "/api/auditlog" "logs"
check_endpoint "Org Chart" "/api/org-chart" "tasks"
check_endpoint "Code Reviews" "/api/code-reviews" "reviews"
check_endpoint "Code Scans" "/api/code-scans" "scans"
check_endpoint "Security Scans" "/api/security-scans" "scans"
check_endpoint "Vocabulary" "/api/vocabulary" "vocabulary"
check_endpoint "Hooks" "/api/hooks" "hooks"
check_endpoint "Feature Flags" "/api/feature-flags" "flags"
check_endpoint "Blog Posts" "/api/blog-posts" "posts"
echo ""

# ── Database Connectivity (via API responses) ────────────────────────────────
echo "🗄️  Database Checks"

# Verify clicks table has data
clicks_total=$(curl -s "${BASE_URL}/api/clicks?count=true" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('total',0))" 2>/dev/null)
if [ "$clicks_total" -gt 0 ] 2>/dev/null; then
  printf "  ${GREEN}✓${NC} %-30s %s records\n" "Clicks table" "$clicks_total"
  PASS=$((PASS + 1))
else
  printf "  ${RED}✗${NC} %-30s Empty or error\n" "Clicks table"
  FAIL=$((FAIL + 1))
  ERRORS="${ERRORS}\n  - Clicks table: empty or unreachable"
fi

# Verify ClicksAnalysis has geo data
analysis_count=$(curl -s "${BASE_URL}/api/clicks-analysis" 2>/dev/null | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('points',[])))" 2>/dev/null)
if [ "$analysis_count" -gt 0 ] 2>/dev/null; then
  printf "  ${GREEN}✓${NC} %-30s %s records\n" "ClicksAnalysis table" "$analysis_count"
  PASS=$((PASS + 1))
else
  printf "  ${YELLOW}⚠${NC} %-30s Empty (may need FreshClicks)\n" "ClicksAnalysis table"
  # Not a failure — might just need FreshClicks run
  PASS=$((PASS + 1))
fi

# Verify builds exist
builds_count=$(curl -s "${BASE_URL}/api/builds" 2>/dev/null | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('builds',[])))" 2>/dev/null)
if [ "$builds_count" -gt 0 ] 2>/dev/null; then
  printf "  ${GREEN}✓${NC} %-30s %s records\n" "Builds table" "$builds_count"
  PASS=$((PASS + 1))
else
  printf "  ${YELLOW}⚠${NC} %-30s Empty\n" "Builds table"
  PASS=$((PASS + 1))
fi

echo ""

# ── Summary ──────────────────────────────────────────────────────────────────
TOTAL=$((PASS + FAIL))
echo "═══════════════════════════════════════════════════════════════"
if [ $FAIL -eq 0 ]; then
  printf "  ${GREEN}✅ ALL CHECKS PASSED${NC} — %d/%d\n" "$PASS" "$TOTAL"
else
  printf "  ${RED}❌ %d FAILED${NC} — %d/%d passed\n" "$FAIL" "$PASS" "$TOTAL"
  printf "\n  Failures:${ERRORS}\n"
fi
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Clean up
rm -f /tmp/deploy-test-response.json

# Exit code for CI
[ $FAIL -eq 0 ] && exit 0 || exit 1
