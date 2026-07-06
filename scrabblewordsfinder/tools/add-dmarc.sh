#!/bin/bash
# Add DMARC record to scrabblewordsfinder.com via Cloudflare API
#
# Usage (Global API Key):
#   export CF_EMAIL="raj007@gmail.com"
#   export CF_API_KEY="your-global-api-key"
#   bash tools/add-dmarc.sh
#
# To find your Global API Key:
#   https://dash.cloudflare.com/profile/api-tokens → "Global API Key" → View

set -e

# Config
ZONE_NAME="scrabblewordsfinder.com"
ACCOUNT_ID="765d11531ac2294b9759a4193b6e0423"
DMARC_CONTENT="v=DMARC1; p=none; rua=mailto:dmarc@scrabblewordsfinder.com"

# Check credentials
if [ -z "$CF_EMAIL" ] || [ -z "$CF_API_KEY" ]; then
  echo "❌ Error: CF_EMAIL and CF_API_KEY not set"
  echo ""
  echo "Find your Global API Key at:"
  echo "  https://dash.cloudflare.com/profile/api-tokens"
  echo "  → Scroll to 'Global API Key' → View"
  echo ""
  echo "Then run:"
  echo "  export CF_EMAIL=\"raj007@gmail.com\""
  echo "  export CF_API_KEY=\"your-global-api-key\""
  echo "  bash tools/add-dmarc.sh"
  exit 1
fi

AUTH_HEADERS="-H \"X-Auth-Email: $CF_EMAIL\" -H \"X-Auth-Key: $CF_API_KEY\""

echo "🔍 Looking up Zone ID for $ZONE_NAME..."
ZONE_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$ZONE_NAME&account.id=$ACCOUNT_ID" \
  -H "X-Auth-Email: $CF_EMAIL" \
  -H "X-Auth-Key: $CF_API_KEY" \
  -H "Content-Type: application/json" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['result'][0]['id'])")

if [ -z "$ZONE_ID" ]; then
  echo "❌ Could not find zone ID for $ZONE_NAME"
  exit 1
fi

echo "✅ Zone ID: $ZONE_ID"

# Check if DMARC record already exists
echo "🔍 Checking for existing DMARC record..."
EXISTING=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=_dmarc.$ZONE_NAME&type=TXT" \
  -H "X-Auth-Email: $CF_EMAIL" \
  -H "X-Auth-Key: $CF_API_KEY" \
  -H "Content-Type: application/json" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d['result']))")

if [ "$EXISTING" != "0" ]; then
  echo "⚠️  DMARC record already exists! Skipping."
  echo "   Run: dig TXT _dmarc.scrabblewordsfinder.com +short"
  exit 0
fi

# Add DMARC record
echo "📝 Adding DMARC TXT record: _dmarc.$ZONE_NAME"
echo "   Content: $DMARC_CONTENT"
echo ""

RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "X-Auth-Email: $CF_EMAIL" \
  -H "X-Auth-Key: $CF_API_KEY" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"TXT\",\"name\":\"_dmarc\",\"content\":\"$DMARC_CONTENT\",\"ttl\":1}")

SUCCESS=$(echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('success',False))")

if [ "$SUCCESS" = "True" ]; then
  echo "✅ DMARC record added successfully!"
  echo ""
  echo "Verify with:"
  echo "  dig TXT _dmarc.scrabblewordsfinder.com +short"
  echo ""
  echo "Expected output:"
  echo "  \"v=DMARC1; p=none; rua=mailto:dmarc@scrabblewordsfinder.com\""
else
  echo "❌ Failed to add record:"
  echo "$RESULT" | python3 -m json.tool
fi
