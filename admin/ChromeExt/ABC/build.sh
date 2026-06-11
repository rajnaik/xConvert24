#!/bin/bash
# ABC Extension — Build & Test
# Run: ./build.sh

echo "========================================="
echo "  Auto Clicker — Build & Test"
echo "========================================="
echo ""

# Copy to Desktop
rm -rf ~/Desktop/ChromeExt/ABC
cp -r "$(dirname "$0")" ~/Desktop/ChromeExt/ABC
echo "✓ Copied to ~/Desktop/ChromeExt/ABC"

# Run tests
echo ""
echo "Running tests..."
cd "$(dirname "$0")/tests"
npx playwright test --config=playwright.config.ts --reporter=list 2>&1
TEST_EXIT=$?

echo ""
echo "========================================="
if [ $TEST_EXIT -eq 0 ]; then
  echo ""
  echo "🟩🟩🟩🟩🟩��🟩🟩🟩🟩"
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
echo "========================================="
exit $TEST_EXIT
