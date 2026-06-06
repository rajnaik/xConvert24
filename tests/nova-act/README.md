# Nova Act QA Test Suite — xConvert.com

AI-powered browser tests using [Amazon Nova Act](https://github.com/aws/nova-act).

## Setup

```bash
# 1. Activate virtual environment
source .venv/bin/activate

# 2. Install dependencies (already done if you followed onboarding)
pip install 'nova-act[cli]' pytest

# 3. Set your API key (get it at https://nova.amazon.com/act?tab=dev_tools)
export NOVA_ACT_API_KEY="your_key_here"

# 4. Start the dev server (in another terminal)
npm run dev
```

## Running Tests

```bash
# Run all Nova Act tests
pytest tests/nova-act/ -v

# Run just converter tests
pytest tests/nova-act/test_converters.py -v

# Run just tool tests
pytest tests/nova-act/test_tools.py -v

# Run just navigation tests
pytest tests/nova-act/test_navigation.py -v

# Run a specific test
pytest tests/nova-act/test_converters.py::TestTemperatureConverter::test_celsius_to_fahrenheit -v

# Run against production
XCONVERT_TEST_URL="https://xconvert24.com" pytest tests/nova-act/ -v
```

## Using the CLI Directly

You can also run individual checks with the `act` CLI:

```bash
# Start a session and test a converter
act browser goto http://localhost:4321/convert/temperature --session-id qa --headed
act browser verify "The result shows 212 for 100 Celsius to Fahrenheit" --session-id qa
act browser extract "Get the conversion result value" --schema string --session-id qa

# Test navigation
act browser execute "1. Go to homepage 2. Find and click on the Temperature converter link 3. Verify the page loads" --session-id qa --headed

# Check all converter pages load
act browser execute "1. Go to http://localhost:4321/convert/weight 2. Verify there are From and To dropdowns and an input field" --session-id qa --headed
```

## Test Structure

| File | Coverage |
|------|----------|
| `conftest.py` | Shared fixtures (nova session, base URL) |
| `test_converters.py` | Temperature, Weight, Length, Speed, Volume, Data, Currency converters |
| `test_tools.py` | BMI, Calculator, Password Generator, Color, Discount tools |
| `test_navigation.py` | Homepage, Navigation, Search, Bookmarks, Dark Mode, 404 |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NOVA_ACT_API_KEY` | — | Required. Your Nova Act API key |
| `XCONVERT_TEST_URL` | `http://localhost:4321` | Base URL to test against |
| `NOVA_ACT_HEADLESS` | `true` (in tests) | Set to `false` to watch the browser |
