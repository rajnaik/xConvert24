#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# Deploy to Staging Pipeline
# ═══════════════════════════════════════════════════════════════════════
# Steps:
# 1. Set SiteStatus to 'green' (deployment in progress)
# 2. Build the project
# 3. Deploy to staging (xconvert24-staging)
# 4. Run post-deployment tests against staging
# 5. If tests pass → promote staging to live
# 6. Run post-live tests
# 7. Set SiteStatus to 'golden' (all tests passed)
# ═══════════════════════════════════════════════════════════════════════

set -e

LIVE_URL="https://www.xconvert24.com"
STAGING_URL="https://staging.xconvert24.com"

echo "🔄 Step 1: Setting SiteStatus to GREEN (deployment in progress)..."
curl -s -X POST "$LIVE_URL/api/site-status" \
  -H "Content-Type: application/json" \
  -d '{"status":"green","updated_by":"deploy-pipeline"}' > /dev/null

echo "🔨 Step 2: Building project..."
npm run build

echo "🚀 Step 3: Deploying to STAGING..."
npx wrangler deploy --config wrangler.staging.jsonc

echo "🧪 Step 4: Running post-deployment tests against staging..."
XCONVERT_TEST_URL="$STAGING_URL" pytest tests/nova-act/ -v --tb=short

if [ $? -ne 0 ]; then
  echo "❌ Staging tests FAILED. Setting SiteStatus to RED."
  curl -s -X POST "$LIVE_URL/api/site-status" \
    -H "Content-Type: application/json" \
    -d '{"status":"red","updated_by":"deploy-pipeline"}' > /dev/null
  exit 1
fi

echo "✅ Staging tests passed!"
echo "🚀 Step 5: Promoting to LIVE..."
npm run deploy

echo "🧪 Step 6: Running post-live tests..."
XCONVERT_TEST_URL="$LIVE_URL" pytest tests/nova-act/ -v --tb=short

if [ $? -ne 0 ]; then
  echo "⚠️ Post-live tests had failures. Setting SiteStatus to RED."
  curl -s -X POST "$LIVE_URL/api/site-status" \
    -H "Content-Type: application/json" \
    -d '{"status":"red","updated_by":"deploy-pipeline"}' > /dev/null
  exit 1
fi

echo "🌟 Step 7: All tests passed! Setting SiteStatus to GOLDEN."
curl -s -X POST "$LIVE_URL/api/site-status" \
  -H "Content-Type: application/json" \
  -d '{"status":"golden","updated_by":"deploy-pipeline"}' > /dev/null

echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ DEPLOYMENT COMPLETE — Site Status: GOLDEN 🌟"
echo "═══════════════════════════════════════════════════"
