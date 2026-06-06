"""
Nova Act Post-Deployment Tests — Comprehensive Site Certification
==================================================================
These tests run after staging/live deployment to certify every feature.
All must pass for the site to achieve GOLDEN status.

Run: XCONVERT_TEST_URL=https://staging.xconvert24.com pytest tests/nova-act/test_post_deploy.py -v
"""

import os
import pytest
from nova_act import NovaAct, BOOL_SCHEMA

BASE_URL = os.getenv("XCONVERT_TEST_URL", "https://www.xconvert24.com")


@pytest.fixture
def nova():
    with NovaAct(starting_page=BASE_URL, headless=True) as n:
        yield n


# ═══════════════════════════════════════════════════════════════════════
# SECTION 1: Core Pages Load Successfully
# ═══════════════════════════════════════════════════════════════════════

class TestCorePages:
    """All main pages load without errors."""

    @pytest.mark.parametrize("path", [
        "/", "/about", "/contact", "/faq", "/search", "/privacy",
        "/terms", "/cookies", "/profile", "/rewards", "/report-bug",
        "/suggest", "/suggestions", "/vote-bugs", "/releases",
        "/guide", "/install", "/favourites", "/support", "/blog",
        "/tech-stack", "/opinion", "/embed",
    ])
    def test_page_loads(self, nova, path):
        nova.page.goto(f"{BASE_URL}{path}")
        status = nova.page.evaluate("document.readyState")
        assert status == "complete"

    @pytest.mark.parametrize("path", [
        "/", "/about", "/faq", "/convert/temperature",
        "/tools/bmi", "/blog",
    ])
    def test_page_has_h1(self, nova, path):
        nova.page.goto(f"{BASE_URL}{path}")
        h1_count = nova.page.evaluate("document.querySelectorAll('h1').length")
        assert h1_count >= 1


# ═══════════════════════════════════════════════════════════════════════
# SECTION 2: All Converters Work Correctly
# ═══════════════════════════════════════════════════════════════════════

class TestConverters:
    """Every converter page loads and produces a result."""

    @pytest.mark.parametrize("converter", [
        "weight", "length", "temperature", "area", "volume",
        "speed", "data", "currency", "time", "cooking",
        "energy", "pressure", "power", "fuel", "angle",
        "frequency", "base", "roman", "shoe-size", "clothing-size",
    ])
    def test_converter_loads(self, nova, converter):
        nova.page.goto(f"{BASE_URL}/convert/{converter}")
        has_converter = nova.act_get(
            "Does this page have input fields and a conversion result displayed?",
            schema=BOOL_SCHEMA,
        )
        assert has_converter.parsed_response

    def test_temperature_100c_to_f(self, nova):
        """100°C = 212°F — core accuracy test."""
        nova.page.goto(f"{BASE_URL}/convert/temperature")
        result = nova.act_get(
            "The default conversion is 100 Celsius to Fahrenheit. What is the result value shown?",
            schema={"type": "string"},
        )
        assert "212" in result.response

    def test_weight_1kg_to_lbs(self, nova):
        """1 kg ≈ 2.205 lbs."""
        nova.page.goto(f"{BASE_URL}/convert/weight")
        nova.act("Select Kilogram in From, Pound in To, clear input and type 1")
        result = nova.act_get("What is the result value?", schema={"type": "string"})
        assert "2.2" in result.response

    def test_length_1m_to_ft(self, nova):
        """1 meter ≈ 3.281 feet."""
        nova.page.goto(f"{BASE_URL}/convert/length")
        nova.act("Select Meter in From, Foot in To, clear input and type 1")
        result = nova.act_get("What is the result value?", schema={"type": "string"})
        assert "3.28" in result.response

    def test_swap_button_works(self, nova):
        """Swap button reverses From/To."""
        nova.page.goto(f"{BASE_URL}/convert/temperature")
        nova.act("Click the Swap button")
        result = nova.act_get(
            "What unit is now in the From dropdown?",
            schema={"type": "string"},
        )
        assert "fahrenheit" in result.response.lower()


# ═══════════════════════════════════════════════════════════════════════
# SECTION 3: All Tools Work
# ═══════════════════════════════════════════════════════════════════════

class TestTools:
    """Every tool page loads and functions."""

    @pytest.mark.parametrize("tool", [
        "bmi", "calculator", "color", "clock", "stopwatch",
        "alarm", "reminder", "age", "date-diff", "tip",
        "discount", "loan", "image-converter", "image-editor",
        "audio-converter", "video-converter", "distance-map",
        "password", "morse", "scrabble", "epoch", "aspect-ratio",
        "ruler", "guitar-tuner", "crypto-coins", "crypto-bubbles",
        "contagion",
    ])
    def test_tool_loads(self, nova, tool):
        nova.page.goto(f"{BASE_URL}/tools/{tool}")
        has_tool = nova.act_get(
            "Does this page have interactive elements like inputs, buttons, or a calculator?",
            schema=BOOL_SCHEMA,
        )
        assert has_tool.parsed_response

    def test_bmi_calculates(self, nova):
        """BMI calculator produces a result with default values."""
        nova.page.goto(f"{BASE_URL}/tools/bmi")
        result = nova.act_get(
            "What BMI value is displayed?",
            schema={"type": "string"},
        )
        assert "22" in result.response or "23" in result.response

    def test_bmi_health_content(self, nova):
        """BMI page has obesity/disease health information."""
        nova.page.goto(f"{BASE_URL}/tools/bmi")
        has_health = nova.act_get(
            "Does this page mention diabetes, heart disease, or obesity-related health risks?",
            schema=BOOL_SCHEMA,
        )
        assert has_health.parsed_response

    def test_calculator_addition(self, nova):
        """2 + 3 = 5."""
        nova.page.goto(f"{BASE_URL}/tools/calculator")
        nova.act("Click 2, then +, then 3, then = on the calculator")
        result = nova.act_get("What is shown in the display?", schema={"type": "string"})
        assert "5" in result.response

    def test_password_generates(self, nova):
        """Password generator produces a password."""
        nova.page.goto(f"{BASE_URL}/tools/password")
        has_password = nova.act_get(
            "Is a generated password visible on the page?",
            schema=BOOL_SCHEMA,
        )
        assert has_password.parsed_response

    def test_discount_20_off_100(self, nova):
        """20% off $100 = $80."""
        nova.page.goto(f"{BASE_URL}/tools/discount")
        nova.act("Enter 100 as original price and 20 as discount percentage")
        result = nova.act_get("What is the final price?", schema={"type": "string"})
        assert "80" in result.response


# ═══════════════════════════════════════════════════════════════════════
# SECTION 4: Navigation & UI
# ═══════════════════════════════════════════════════════════════════════

class TestNavigation:
    """Site navigation and UI elements work correctly."""

    def test_homepage_branding(self, nova):
        nova.page.goto(BASE_URL)
        has_brand = nova.act_get(
            "Does the page have the xConvert logo or brand name visible?",
            schema=BOOL_SCHEMA,
        )
        assert has_brand.parsed_response

    def test_search_works(self, nova):
        nova.page.goto(f"{BASE_URL}/search")
        nova.act("Type 'temperature' in the search input")
        has_results = nova.act_get(
            "Are there search results mentioning temperature?",
            schema=BOOL_SCHEMA,
        )
        assert has_results.parsed_response

    def test_dark_mode_toggle(self, nova):
        nova.page.goto(BASE_URL)
        has_toggle = nova.act_get(
            "Is there a dark mode or theme toggle button?",
            schema=BOOL_SCHEMA,
        )
        assert has_toggle.parsed_response

    def test_bookmark_button(self, nova):
        nova.page.goto(f"{BASE_URL}/convert/weight")
        has_bookmark = nova.act_get(
            "Is there a bookmark button in the header?",
            schema=BOOL_SCHEMA,
        )
        assert has_bookmark.parsed_response

    def test_coins_badge_visible(self, nova):
        nova.page.goto(BASE_URL)
        has_coins = nova.act_get(
            "Is there a ConvertCoins badge showing a coin count in the header?",
            schema=BOOL_SCHEMA,
        )
        assert has_coins.parsed_response

    def test_404_page(self, nova):
        nova.page.goto(f"{BASE_URL}/nonexistent-page-xyz-404")
        is_404 = nova.act_get(
            "Does the page show a 404 or page not found message?",
            schema=BOOL_SCHEMA,
        )
        assert is_404.parsed_response


# ═══════════════════════════════════════════════════════════════════════
# SECTION 5: Blog
# ═══════════════════════════════════════════════════════════════════════

class TestBlog:
    """Blog pages load with content."""

    def test_blog_index_has_posts(self, nova):
        nova.page.goto(f"{BASE_URL}/blog")
        has_posts = nova.act_get(
            "Are there blog post titles or article links visible?",
            schema=BOOL_SCHEMA,
        )
        assert has_posts.parsed_response

    def test_blog_post_renders(self, nova):
        nova.page.goto(f"{BASE_URL}/blog/how-to-convert-celsius-to-fahrenheit")
        has_content = nova.act_get(
            "Does this page have article content about Celsius to Fahrenheit conversion?",
            schema=BOOL_SCHEMA,
        )
        assert has_content.parsed_response


# ═══════════════════════════════════════════════════════════════════════
# SECTION 6: Community Features
# ═══════════════════════════════════════════════════════════════════════

class TestCommunity:
    """Community features work."""

    def test_report_bug_form(self, nova):
        nova.page.goto(f"{BASE_URL}/report-bug")
        has_form = nova.act_get(
            "Is there a bug report form with fields for description and severity?",
            schema=BOOL_SCHEMA,
        )
        assert has_form.parsed_response

    def test_suggest_feature_form(self, nova):
        nova.page.goto(f"{BASE_URL}/suggest")
        has_form = nova.act_get(
            "Is there a suggestion form with a title field?",
            schema=BOOL_SCHEMA,
        )
        assert has_form.parsed_response

    def test_vote_bugs_page(self, nova):
        nova.page.goto(f"{BASE_URL}/vote-bugs")
        has_voting = nova.act_get(
            "Does this page show bug reports that can be voted on?",
            schema=BOOL_SCHEMA,
        )
        assert has_voting.parsed_response

    def test_suggestions_page(self, nova):
        nova.page.goto(f"{BASE_URL}/suggestions")
        has_list = nova.act_get(
            "Does this page show community suggestions that can be rated?",
            schema=BOOL_SCHEMA,
        )
        assert has_list.parsed_response

    def test_opinion_page(self, nova):
        nova.page.goto(f"{BASE_URL}/opinion")
        has_question = nova.act_get(
            "Does this page ask a question about email sign-on with voting buttons?",
            schema=BOOL_SCHEMA,
        )
        assert has_question.parsed_response


# ═══════════════════════════════════════════════════════════════════════
# SECTION 7: Profile & Gamification
# ═══════════════════════════════════════════════════════════════════════

class TestProfile:
    """Profile and gamification features."""

    def test_profile_loads(self, nova):
        nova.page.goto(f"{BASE_URL}/profile")
        has_coins = nova.act_get(
            "Does the profile page show a Coins balance, Streak, and Level?",
            schema=BOOL_SCHEMA,
        )
        assert has_coins.parsed_response

    def test_profile_has_reward_summary(self, nova):
        nova.page.goto(f"{BASE_URL}/profile")
        has_summary = nova.act_get(
            "Is there a 'Reward Summary' section on this page?",
            schema=BOOL_SCHEMA,
        )
        assert has_summary.parsed_response

    def test_profile_has_future_features(self, nova):
        nova.page.goto(f"{BASE_URL}/profile")
        has_future = nova.act_get(
            "Does the page mention future features for ConvertCoins like themes, leaderboard, or redemption?",
            schema=BOOL_SCHEMA,
        )
        assert has_future.parsed_response

    def test_rewards_guide(self, nova):
        nova.page.goto(f"{BASE_URL}/rewards")
        has_guide = nova.act_get(
            "Does this page explain how to earn ConvertCoins with activities and rewards?",
            schema=BOOL_SCHEMA,
        )
        assert has_guide.parsed_response


# ═══════════════════════════════════════════════════════════════════════
# SECTION 8: Widgets
# ═══════════════════════════════════════════════════════════════════════

class TestWidgets:
    """Embeddable widgets work."""

    @pytest.mark.parametrize("widget", [
        "temperature", "weight", "length", "volume", "speed", "data",
    ])
    def test_widget_loads(self, nova, widget):
        nova.page.goto(f"{BASE_URL}/widgets/{widget}")
        has_widget = nova.act_get(
            "Does this page have an embeddable converter widget?",
            schema=BOOL_SCHEMA,
        )
        assert has_widget.parsed_response


# ═══════════════════════════════════════════════════════════════════════
# SECTION 9: SEO & Accessibility Basics
# ═══════════════════════════════════════════════════════════════════════

class TestSEO:
    """Basic SEO elements are present."""

    @pytest.mark.parametrize("path", [
        "/", "/convert/temperature", "/tools/bmi", "/blog",
    ])
    def test_has_meta_description(self, nova, path):
        nova.page.goto(f"{BASE_URL}{path}")
        has_desc = nova.page.evaluate(
            "!!document.querySelector('meta[name=\"description\"]')?.content"
        )
        assert has_desc

    def test_homepage_title_length(self, nova):
        nova.page.goto(BASE_URL)
        title = nova.page.evaluate("document.title")
        assert len(title) <= 70

    def test_structured_data_present(self, nova):
        nova.page.goto(BASE_URL)
        has_jsonld = nova.page.evaluate(
            "!!document.querySelector('script[type=\"application/ld+json\"]')"
        )
        assert has_jsonld


# ═══════════════════════════════════════════════════════════════════════
# SECTION 10: API Endpoints
# ═══════════════════════════════════════════════════════════════════════

class TestAPIs:
    """API endpoints respond correctly."""

    def test_site_status_api(self, nova):
        nova.page.goto(BASE_URL)
        result = nova.page.evaluate(
            "fetch('/api/site-status').then(r => r.json()).then(d => d.status)"
        )
        assert result in ["golden", "green", "red"]

    def test_coins_api(self, nova):
        nova.page.goto(BASE_URL)
        result = nova.page.evaluate(
            "fetch('/api/coins?uid=test123').then(r => r.ok)"
        )
        assert result

    def test_opinions_api(self, nova):
        nova.page.goto(BASE_URL)
        result = nova.page.evaluate(
            "fetch('/api/opinions').then(r => r.ok)"
        )
        assert result
