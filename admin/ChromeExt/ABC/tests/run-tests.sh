#!/bin/bash
# ABC Extension — Build & Test Runner
# Displays green banner on pass, red on fail

echo "=================================="
echo "  ABC Extension — Test Suite"
echo "=================================="
echo ""

cd "$(dirname "$0")/.."

# Run tests
npx playwright test --config=tests/playwright.config.ts --reporter=list 2>&1
EXIT_CODE=$?

echo ""
echo "=================================="

if [ $EXIT_CODE -eq 0 ]; then
  echo ""
  echo "🟩��🟩🟩🟩🟩🟩🟩🟩🟩"
  echo "✅ DONE — All tests passed"
  echo "🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩"
  echo ""
else
  echo ""
  echo "🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥"
  echo "❌ FAILED — Tests did not pass"
  echo "🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥"
  echo ""
fi

exit $EXIT_CODE
