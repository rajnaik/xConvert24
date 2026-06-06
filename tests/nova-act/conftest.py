"""
Nova Act QA Test Suite for xConvert.com
========================================

Prerequisites:
1. Install: pip install 'nova-act[cli]' pytest
2. Set API key: export NOVA_ACT_API_KEY="your_key"
3. Start dev server: npm run dev (http://localhost:4321)
4. Run: pytest tests/nova-act/ -v

Or use the CLI directly:
  source .venv/bin/activate && act browser execute "..." --session-id test --headed
"""

import os
import pytest
from nova_act import NovaAct, BOOL_SCHEMA

BASE_URL = os.getenv("XCONVERT_TEST_URL", "http://localhost:4321")


@pytest.fixture(scope="session")
def base_url():
    """Base URL for the test suite."""
    return BASE_URL


@pytest.fixture
def nova(base_url):
    """Fresh Nova Act browser session per test."""
    with NovaAct(starting_page=base_url, headless=True) as n:
        yield n


@pytest.fixture
def nova_headed(base_url):
    """Headed Nova Act session (for debugging)."""
    with NovaAct(starting_page=base_url, headless=False) as n:
        yield n
