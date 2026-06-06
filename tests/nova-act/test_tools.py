"""
Nova Act QA Tests — Tools
===========================
Tests calculator, BMI, color picker, password generator, and other tools.
"""

import pytest
from nova_act import BOOL_SCHEMA


class TestBMICalculator:
    """BMI Calculator tool."""

    def test_normal_bmi_metric(self, nova, base_url):
        """175cm, 70kg should give BMI ~22.9 (Normal)."""
        nova.page.goto(f"{base_url}/tools/bmi")
        # Default values are 175cm and 70kg
        result = nova.act_get(
            "What BMI value is displayed in the result?",
            schema={"type": "string"},
        )
        assert "22" in result.response or "23" in result.response

    def test_bmi_category_normal(self, nova, base_url):
        """175cm, 70kg should show 'Normal' category."""
        nova.page.goto(f"{base_url}/tools/bmi")
        result = nova.act_get(
            "What BMI category or classification is shown?",
            schema={"type": "string"},
        )
        assert "normal" in result.response.lower()

    def test_bmi_imperial_toggle(self, nova, base_url):
        """Switching to Imperial should show feet/inches/lbs inputs."""
        nova.page.goto(f"{base_url}/tools/bmi")
        nova.act("Click the 'Imperial' button to switch to imperial units")
        has_imperial = nova.act_get(
            "Are there input fields for Feet, Inches, and Weight in lbs?",
            schema=BOOL_SCHEMA,
        )
        assert has_imperial.parsed_response


class TestCalculator:
    """Basic calculator tool."""

    def test_addition(self, nova, base_url):
        """2 + 3 should equal 5."""
        nova.page.goto(f"{base_url}/tools/calculator")
        nova.act("Click 2, then +, then 3, then = on the calculator")
        result = nova.act_get(
            "What number is shown in the calculator display?",
            schema={"type": "string"},
        )
        assert "5" in result.response

    def test_multiplication(self, nova, base_url):
        """7 × 8 should equal 56."""
        nova.page.goto(f"{base_url}/tools/calculator")
        nova.act("Click 7, then ×, then 8, then = on the calculator")
        result = nova.act_get(
            "What number is shown in the calculator display?",
            schema={"type": "string"},
        )
        assert "56" in result.response

    def test_clear(self, nova, base_url):
        """Clear button should reset the display."""
        nova.page.goto(f"{base_url}/tools/calculator")
        nova.act("Click 5, then click the clear (C or AC) button")
        result = nova.act_get(
            "What is shown in the calculator display after clearing?",
            schema={"type": "string"},
        )
        assert "0" in result.response


class TestPasswordGenerator:
    """Password generator tool."""

    def test_generates_password(self, nova, base_url):
        """Should generate a password on page load or button click."""
        nova.page.goto(f"{base_url}/tools/password")
        has_password = nova.act_get(
            "Is there a generated password displayed on the page?",
            schema=BOOL_SCHEMA,
        )
        assert has_password.parsed_response

    def test_password_length(self, nova, base_url):
        """Generated password should have characters visible."""
        nova.page.goto(f"{base_url}/tools/password")
        result = nova.act_get(
            "How many characters are in the generated password?",
            schema={"type": "integer"},
        )
        assert result.parsed_response >= 8


class TestColorTool:
    """Color converter/picker tool."""

    def test_color_page_loads(self, nova, base_url):
        """Color tool should show a color picker or input."""
        nova.page.goto(f"{base_url}/tools/color")
        has_color = nova.act_get(
            "Does the page have a color picker, hex input, or RGB input fields?",
            schema=BOOL_SCHEMA,
        )
        assert has_color.parsed_response


class TestDiscountCalculator:
    """Discount calculator tool."""

    def test_percentage_discount(self, nova, base_url):
        """$100 with 20% discount should show $80."""
        nova.page.goto(f"{base_url}/tools/discount")
        nova.act("Enter 100 as the original price and 20 as the discount percentage")
        result = nova.act_get(
            "What is the final price shown after discount?",
            schema={"type": "string"},
        )
        assert "80" in result.response
