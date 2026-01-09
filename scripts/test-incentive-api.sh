#!/bin/bash

echo "🧪 Testing MR Incentive Calculation API"
echo "=========================================="
echo ""

# Test Case 1: Refrigerator at ₹35,000 for 3 years
echo "Test 1: Refrigerator @ ₹35,000 for 3 years"
curl -X POST http://localhost:3000/api/canvasser/incentive/calculate-spot \
  -H "Content-Type: application/json" \
  -d '{"category":"Refrigerator","invoicePrice":35000,"tenure":3}' \
  -s | python3 -m json.tool

echo ""
echo "---"
echo ""

# Test Case 2: Washing Machine at ₹22,000 for 2 years
echo "Test 2: Washing Machine @ ₹22,000 for 2 years"
curl -X POST http://localhost:3000/api/canvasser/incentive/calculate-spot \
  -H "Content-Type: application/json" \
  -d '{"category":"Washing Machine","invoicePrice":22000,"tenure":2}' \
  -s | python3 -m json.tool

echo ""
echo "---"
echo ""

# Test Case 3: Invalid tenure
echo "Test 3: Invalid tenure (should fail)"
curl -X POST http://localhost:3000/api/canvasser/incentive/calculate-spot \
  -H "Content-Type: application/json" \
  -d '{"category":"Refrigerator","invoicePrice":35000,"tenure":5}' \
  -s | python3 -m json.tool

echo ""
echo "---"
echo ""

# Test Case 4: Missing fields
echo "Test 4: Missing required fields (should fail)"
curl -X POST http://localhost:3000/api/canvasser/incentive/calculate-spot \
  -H "Content-Type: application/json" \
  -d '{"category":"Refrigerator"}' \
  -s | python3 -m json.tool

echo ""
echo "✅ API tests completed!"
