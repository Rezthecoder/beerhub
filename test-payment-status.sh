#!/bin/bash

# Payment Status Testing Script for BeerHub
# This script helps test the payment status endpoints

BASE_URL="http://localhost:3000"
ORDER_ID="102"

echo "🍺 BeerHub Payment Status Testing Script"
echo "========================================"
echo ""

echo "1. Checking current payment status for Order $ORDER_ID..."
echo "Response:"
curl -s "$BASE_URL/api/check-payment-status?orderId=$ORDER_ID" | python3 -m json.tool 2>/dev/null || curl -s "$BASE_URL/api/check-payment-status?orderId=$ORDER_ID"

echo ""
echo "2. Force completing Order $ORDER_ID..."
echo "Response:"
curl -s -X POST "$BASE_URL/api/check-payment-status" \
  -H "Content-Type: application/json" \
  -d "{\"orderId\": \"$ORDER_ID\", \"action\": \"force_complete\"}" | python3 -m json.tool 2>/dev/null || curl -s -X POST "$BASE_URL/api/check-payment-status" -H "Content-Type: application/json" -d "{\"orderId\": \"$ORDER_ID\", \"action\": \"force_complete\"}"

echo ""
echo "3. Checking updated payment status..."
echo "Response:"
curl -s "$BASE_URL/api/check-payment-status?orderId=$ORDER_ID" | python3 -m json.tool 2>/dev/null || curl -s "$BASE_URL/api/check-payment-status?orderId=$ORDER_ID"

echo ""
echo "4. Resetting API errors for Order $ORDER_ID..."
echo "Response:"
curl -s -X POST "$BASE_URL/api/check-payment-status" \
  -H "Content-Type: application/json" \
  -d "{\"orderId\": \"$ORDER_ID\", \"action\": \"reset_api_errors\"}" | python3 -m json.tool 2>/dev/null || curl -s -X POST "$BASE_URL/api/check-payment-status" -H "Content-Type: application/json" -d "{\"orderId\": \"$ORDER_ID\", \"action\": \"reset_api_errors\"}"

echo ""
echo "✅ Testing complete!"
echo ""
echo "Note: This script will try to format JSON output using Python3 if available."
echo "If Python3 is not available, it will show raw JSON output."
echo ""
echo "Available actions:"
echo "  - force_complete: Force complete an order"
echo "  - reset_api_errors: Reset API error counter"
echo "  - manual_update: Manually update order status"
