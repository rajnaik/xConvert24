"""
Nova Act QA Tests — Unit Converters
=====================================
Tests all converter pages for correct calculation results.
"""

import pytest
from nova_act import BOOL_SCHEMA


class TestTemperatureConverter:
    """Temperature converter: Celsius, Fahrenheit, Kelvin."""

    def test_celsius_to_fahrenheit(self, nova, base_url):
        """100°C should equal 212°F."""
        nova.page.goto(f"{base_url}/convert/temperature")
        result = nova.act_get(
            "What is the conversion result displayed? The input is 100 Celsius to Fahrenheit.",
            schema={"type": "string"},
        )
        assert "212" in result.response

    def test_fahrenheit_to_celsius(self, nova, base_url):
        """32°F should equal 0°C."""
        nova.page.goto(f"{base_url}/convert/temperature")
        nova.act("Select 'Fahrenheit' in the 'From' dropdown and 'Celsius' in the 'To' dropdown")
        nova.act("Clear the input field and type 32")
        result = nova.act_get(
            "What number is shown in the result field?",
            schema={"type": "string"},
        )
        assert "0" in result.response

    def test_celsius_to_kelvin(self, nova, base_url):
        """0°C should equal 273.15 K."""
        nova.page.goto(f"{base_url}/convert/temperature")
        nova.act("Select 'Celsius' in the 'From' dropdown and 'Kelvin' in the 'To' dropdown")
        nova.act("Clear the input field and type 0")
        result = nova.act_get(
            "What number is shown in the result field?",
            schema={"type": "string"},
        )
        assert "273" in result.response

    def test_swap_button(self, nova, base_url):
        """Swap button should reverse From/To units."""
        nova.page.goto(f"{base_url}/convert/temperature")
        nova.act("Click the Swap button")
        result = nova.act_get(
            "What unit is now selected in the 'From' dropdown?",
            schema={"type": "string"},
        )
        assert "fahrenheit" in result.response.lower()


class TestWeightConverter:
    """Weight converter: kg, lbs, oz, stone, etc."""

    def test_kg_to_lbs(self, nova, base_url):
        """1 kg should equal approximately 2.205 lbs."""
        nova.page.goto(f"{base_url}/convert/weight")
        nova.act("Select 'Kilogram' in the From dropdown and 'Pound' in the To dropdown")
        nova.act("Clear the input field and type 1")
        result = nova.act_get(
            "What number is shown in the result field?",
            schema={"type": "string"},
        )
        assert "2.2" in result.response

    def test_lbs_to_kg(self, nova, base_url):
        """100 lbs should equal approximately 45.36 kg."""
        nova.page.goto(f"{base_url}/convert/weight")
        nova.act("Select 'Pound' in the From dropdown and 'Kilogram' in the To dropdown")
        nova.act("Clear the input field and type 100")
        result = nova.act_get(
            "What number is shown in the result field?",
            schema={"type": "string"},
        )
        assert "45" in result.response


class TestLengthConverter:
    """Length converter: meters, feet, inches, km, miles, etc."""

    def test_meters_to_feet(self, nova, base_url):
        """1 meter should equal approximately 3.281 feet."""
        nova.page.goto(f"{base_url}/convert/length")
        nova.act("Select 'Meter' in the From dropdown and 'Foot' in the To dropdown")
        nova.act("Clear the input field and type 1")
        result = nova.act_get(
            "What number is shown in the result field?",
            schema={"type": "string"},
        )
        assert "3.28" in result.response

    def test_km_to_miles(self, nova, base_url):
        """10 km should equal approximately 6.214 miles."""
        nova.page.goto(f"{base_url}/convert/length")
        nova.act("Select 'Kilometer' in the From dropdown and 'Mile' in the To dropdown")
        nova.act("Clear the input field and type 10")
        result = nova.act_get(
            "What number is shown in the result field?",
            schema={"type": "string"},
        )
        assert "6.2" in result.response


class TestSpeedConverter:
    """Speed converter: km/h, mph, m/s, knots."""

    def test_kmh_to_mph(self, nova, base_url):
        """100 km/h should equal approximately 62.14 mph."""
        nova.page.goto(f"{base_url}/convert/speed")
        nova.act("Select 'Kilometer per hour' in the From dropdown and 'Mile per hour' in the To dropdown")
        nova.act("Clear the input field and type 100")
        result = nova.act_get(
            "What number is shown in the result field?",
            schema={"type": "string"},
        )
        assert "62" in result.response


class TestVolumeConverter:
    """Volume converter: liters, gallons, cups, ml."""

    def test_liters_to_gallons(self, nova, base_url):
        """1 liter should equal approximately 0.264 US gallons."""
        nova.page.goto(f"{base_url}/convert/volume")
        nova.act("Select 'Liter' in the From dropdown and 'Gallon' in the To dropdown")
        nova.act("Clear the input field and type 1")
        result = nova.act_get(
            "What number is shown in the result field?",
            schema={"type": "string"},
        )
        assert "0.26" in result.response


class TestDataConverter:
    """Data/storage converter: bytes, KB, MB, GB, TB."""

    def test_gb_to_mb(self, nova, base_url):
        """1 GB should equal 1024 MB (or 1000 depending on standard)."""
        nova.page.goto(f"{base_url}/convert/data")
        nova.act("Select 'Gigabyte' in the From dropdown and 'Megabyte' in the To dropdown")
        nova.act("Clear the input field and type 1")
        result = nova.act_get(
            "What number is shown in the result field?",
            schema={"type": "string"},
        )
        # Either 1000 (SI) or 1024 (binary) is acceptable
        assert "1000" in result.response or "1024" in result.response


class TestCurrencyConverter:
    """Currency converter — verifies the UI works (rates are dynamic)."""

    def test_currency_page_loads(self, nova, base_url):
        """Currency converter page should load with dropdowns and input."""
        nova.page.goto(f"{base_url}/convert/currency")
        has_inputs = nova.act_get(
            "Does the page have a currency input field and two currency selection dropdowns?",
            schema=BOOL_SCHEMA,
        )
        assert has_inputs.parsed_response
