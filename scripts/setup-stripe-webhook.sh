#!/usr/bin/env bash
set -e

if [ -z "$STRIPE_SECRET_KEY" ]; then
  echo "Error: STRIPE_SECRET_KEY env var is not set"
  exit 1
fi

echo "Creating Stripe webhook endpoint for https://pagelens.vercel.app/api/webhook ..."

RESPONSE=$(curl -s -X POST https://api.stripe.com/v1/webhook_endpoints \
  -u "$STRIPE_SECRET_KEY:" \
  -d "url=https://pagelens.vercel.app/api/webhook" \
  -d "enabled_events[]=checkout.session.completed")

echo ""
echo "Stripe API response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

# Extract the signing secret
SECRET=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('secret','NOT_FOUND'))" 2>/dev/null || echo "")

echo ""
if [ -n "$SECRET" ] && [ "$SECRET" != "NOT_FOUND" ]; then
  echo "============================================================"
  echo "Webhook signing secret (add to Vercel env as STRIPE_WEBHOOK_SECRET):"
  echo ""
  echo "  $SECRET"
  echo "============================================================"
else
  echo "Could not extract signing secret. Check the response above."
  echo "Look for the 'secret' field (starts with whsec_)."
fi
