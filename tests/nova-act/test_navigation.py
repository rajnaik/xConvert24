"""
Nova Act QA Tests — Navigation & UI
======================================
Tests site navigation, search, responsive layout, and common UI elements.
"""

import pytest
from nova_act import BOOL_SCHEMA


class TestHomepage:
    """Homepage loads correctly with key elements."""

    def test_homepage_loads(self, nova, base_url):
        """Homepage should have the xConvert branding and converter links."""
        nova.page.goto(base_url)
        has_branding = nova.act_get(
            "Does the page have a logo or site name visible in the header?",
            schema=BOOL_SCHEMA,
        )
        assert has_branding.parsed_response

    def test_homepage_has_converter_links(self, nova, base_url):
        """Homepage should link to converter categories."""
        nova.page.goto(base_url)
        has_links = nova.act_get(
            "Are there links or cards for converters like Temperature, Weight, or Length?",
            schema=BOOL_SCHEMA,
        )
        assert has_links.parsed_response


class TestNavigation:
    """Header navigation works correctly."""

    def test_navigate_to_tools(self, nova, base_url):
        """Clicking a tools link should navigate to a tool page."""
        nova.page.goto(base_url)
        nova.act("Navigate to the BMI calculator using the site navigation or links")
        result = nova.act_get(
            "Am I on the BMI Calculator page?",
            schema=BOOL_SCHEMA,
        )
        assert result.parsed_response

    def test_navigate_to_blog(self, nova, base_url):
        """Blog page should load with articles listed."""
        nova.page.goto(f"{base_url}/blog")
        has_articles = nova.act_get(
            "Are there blog post titles or article links visible on this page?",
            schema=BOOL_SCHEMA,
        )
        assert has_articles.parsed_response

    def test_navigate_to_faq(self, nova, base_url):
        """FAQ page should show questions and answers."""
        nova.page.goto(f"{base_url}/faq")
        has_faqs = nova.act_get(
            "Are there FAQ questions visible on this page?",
            schema=BOOL_SCHEMA,
        )
        assert has_faqs.parsed_response


class TestSearch:
    """Search functionality."""

    def test_search_finds_converter(self, nova, base_url):
        """Searching 'temperature' should show temperature converter in results."""
        nova.page.goto(f"{base_url}/search")
        nova.act("Type 'temperature' in the search input field")
        result = nova.act_get(
            "Are there search results that mention temperature or temperature converter?",
            schema=BOOL_SCHEMA,
        )
        assert result.parsed_response

    def test_search_no_results(self, nova, base_url):
        """Searching gibberish should show no results or empty state."""
        nova.page.goto(f"{base_url}/search")
        nova.act("Type 'xyzzznonexistent999' in the search input field")
        result = nova.act_get(
            "Does the page indicate no results were found or show an empty state?",
            schema=BOOL_SCHEMA,
        )
        assert result.parsed_response


class TestBookmark:
    """Bookmark button functionality."""

    def test_bookmark_button_exists(self, nova, base_url):
        """Bookmark button should be visible in the header."""
        nova.page.goto(f"{base_url}/convert/temperature")
        has_bookmark = nova.act_get(
            "Is there a bookmark icon or button in the page header?",
            schema=BOOL_SCHEMA,
        )
        assert has_bookmark.parsed_response

    def test_bookmark_dropdown_opens(self, nova, base_url):
        """Clicking bookmark should open a dropdown."""
        nova.page.goto(f"{base_url}/convert/temperature")
        nova.act("Click the bookmark button in the header")
        dropdown_visible = nova.act_get(
            "Is a bookmark dropdown or panel now visible showing 'Your Bookmarks'?",
            schema=BOOL_SCHEMA,
        )
        assert dropdown_visible.parsed_response


class TestDarkMode:
    """Dark mode toggle."""

    def test_dark_mode_toggle_exists(self, nova, base_url):
        """Theme toggle button should be present."""
        nova.page.goto(base_url)
        has_toggle = nova.act_get(
            "Is there a dark mode or theme toggle button visible on the page?",
            schema=BOOL_SCHEMA,
        )
        assert has_toggle.parsed_response


class TestErrorPages:
    """Error pages render correctly."""

    def test_404_page(self, nova, base_url):
        """Non-existent page should show a 404 error page."""
        nova.page.goto(f"{base_url}/this-page-does-not-exist-xyz")
        is_404 = nova.act_get(
            "Does the page show a 404 error or 'page not found' message?",
            schema=BOOL_SCHEMA,
        )
        assert is_404.parsed_response
