#!/usr/bin/env python3
"""
Scrape Kiro Credits from app.kiro.dev/settings/account
======================================================

Uses Playwright with your real Chrome profile to bypass authentication.
Scrapes credit usage data and stores it in the xConvert24 D1 database.

Usage:
  source .venv/bin/activate
  python scripts/scrape-kiro-credits.py

Requirements:
  - playwright (already installed in .venv)
  - Chrome must NOT be running (Playwright needs exclusive access to the profile)

First-time setup:
  1. Close Chrome completely
  2. Run this script — it will open Chrome with your profile
  3. If not logged in, log in to app.kiro.dev manually
  4. The script will wait for you, then scrape and save

Subsequent runs:
  - Your session cookie persists in the Chrome profile
  - Script runs headlessly (no browser window) after first successful login
"""

import json
import os
import re
import subprocess
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

# ─── Config ────────────────────────────────────────────────────────────────────
KIRO_URL = "https://app.kiro.dev/settings/account"
PROJECT_ROOT = Path(__file__).resolve().parent.parent
WRANGLER_CONFIG = PROJECT_ROOT / "wrangler.dev.jsonc"

# Chrome profile path (macOS default)
CHROME_USER_DATA = os.path.expanduser("~/Library/Application Support/Google/Chrome")
CHROME_PROFILE = "Default"  # Change if you use a different Chrome profile

# Persistent context directory for Playwright (separate from Chrome to avoid conflicts)
PLAYWRIGHT_STATE = PROJECT_ROOT / ".playwright-state"


def get_chrome_channel():
    """Detect installed Chrome channel."""
    if Path("/Applications/Google Chrome.app").exists():
        return "chrome"
    return "chromium"


def scrape_credits(headless: bool = False):
    """
    Launch browser, navigate to Kiro account page, scrape credit data.
    Returns dict with credit info or None on failure.
    """
    print(f"🔄 Launching browser ({'headless' if headless else 'headed'})...")

    with sync_playwright() as p:
        # Use persistent context to keep login session between runs
        state_dir = str(PLAYWRIGHT_STATE)
        os.makedirs(state_dir, exist_ok=True)

        browser = p.chromium.launch_persistent_context(
            user_data_dir=state_dir,
            headless=headless,
            channel=get_chrome_channel(),
            args=["--disable-blink-features=AutomationControlled"],
        )

        page = browser.pages[0] if browser.pages else browser.new_page()

        try:
            print(f"📡 Navigating to {KIRO_URL}...")
            page.goto(KIRO_URL, wait_until="networkidle", timeout=30000)

            # Check if we hit a login page
            current_url = page.url
            if "signin" in current_url or "login" in current_url or "auth" in current_url:
                if headless:
                    print("❌ Not logged in. Re-run without --headless to log in manually.")
                    browser.close()
                    return None
                else:
                    print("🔐 Login required. Please log in manually in the browser window...")
                    print("   (Waiting up to 120 seconds for you to complete login)")
                    try:
                        page.wait_for_url("**/settings/account**", timeout=120000)
                        print("✅ Login successful!")
                    except PlaywrightTimeout:
                        print("❌ Timeout waiting for login. Try again.")
                        browser.close()
                        return None

            # Wait for the page content to load
            print("⏳ Waiting for credits data to render...")
            page.wait_for_load_state("networkidle")

            # Give React/JS time to hydrate
            page.wait_for_timeout(3000)

            # Scrape the page content
            content = page.content()
            text_content = page.inner_text("body")

            print(f"📄 Page text length: {len(text_content)} chars")

            # Parse credits data from page text
            credits_data = parse_credits(text_content, content)

            if credits_data:
                print(f"✅ Scraped: {credits_data}")
            else:
                print("⚠️  Could not parse credits. Saving raw text for inspection.")
                credits_data = {
                    "plan": "unknown",
                    "credits_used": 0,
                    "credits_total": 0,
                    "credits_remaining": 0,
                    "percentage_used": 0,
                    "reset_date": None,
                    "raw_text": text_content[:2000],
                }

            browser.close()
            return credits_data

        except PlaywrightTimeout as e:
            print(f"❌ Timeout: {e}")
            browser.close()
            return None
        except Exception as e:
            print(f"❌ Error: {e}")
            browser.close()
            return None


def parse_credits(text: str, html: str) -> dict | None:
    """
    Parse credit usage from page text.
    Adapts to various formats Kiro might display.
    """
    result = {
        "plan": "unknown",
        "credits_used": 0,
        "credits_total": 0,
        "credits_remaining": 0,
        "percentage_used": 0.0,
        "reset_date": None,
        "raw_text": text[:2000],
    }

    # Try to find plan name
    plan_patterns = [
        r"(?:Plan|Tier|Subscription)[:\s]+([A-Za-z]+)",
        r"(Free|Pro|Enterprise|Business)\s+(?:Plan|Tier)",
        r"(?:Current plan|Your plan)[:\s]+([A-Za-z]+)",
    ]
    for pat in plan_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            result["plan"] = m.group(1).lower()
            break

    # Try to find credits/interactions used
    credit_patterns = [
        # "50 / 100 interactions" or "50/100"
        r"(\d[\d,]*)\s*/\s*(\d[\d,]*)\s*(?:interactions|credits|requests|uses)",
        # "Used 50 of 100"
        r"[Uu]sed\s+(\d[\d,]*)\s+(?:of|out of)\s+(\d[\d,]*)",
        # "50 interactions used" + "100 total"
        r"(\d[\d,]*)\s*(?:interactions|credits|requests)\s*used",
        # "Credits: 50/100"
        r"[Cc]redits?[:\s]+(\d[\d,]*)\s*/\s*(\d[\d,]*)",
        # Percentage: "50% used"
        r"(\d+(?:\.\d+)?)\s*%\s*(?:used|consumed)",
        # "X remaining"
        r"(\d[\d,]*)\s*(?:remaining|left)",
    ]

    for pat in credit_patterns:
        m = re.search(pat, text)
        if m:
            groups = m.groups()
            if len(groups) == 2:
                used = int(groups[0].replace(",", ""))
                total = int(groups[1].replace(",", ""))
                result["credits_used"] = used
                result["credits_total"] = total
                result["credits_remaining"] = total - used
                result["percentage_used"] = round((used / total) * 100, 1) if total > 0 else 0
                break
            elif "%" in pat:
                result["percentage_used"] = float(groups[0])
                break
            elif "remaining" in pat or "left" in pat:
                result["credits_remaining"] = int(groups[0].replace(",", ""))
                break
            else:
                result["credits_used"] = int(groups[0].replace(",", ""))
                break

    # Try to find reset date
    reset_patterns = [
        r"[Rr]esets?\s+(?:on\s+)?(\w+\s+\d{1,2}(?:,?\s+\d{4})?)",
        r"[Nn]ext\s+reset[:\s]+(\S+)",
        r"[Rr]enews?\s+(?:on\s+)?(\w+\s+\d{1,2}(?:,?\s+\d{4})?)",
    ]
    for pat in reset_patterns:
        m = re.search(pat, text)
        if m:
            result["reset_date"] = m.group(1)
            break

    # Only return parsed result if we found at least some credit info
    if result["credits_used"] > 0 or result["credits_total"] > 0 or result["percentage_used"] > 0:
        return result

    # Fallback: check for any numbers that might be credits
    # Look for progress bar percentages in HTML
    progress_match = re.search(r'(?:width|value)[:\s="]+(\d+(?:\.\d+)?)%', html)
    if progress_match:
        result["percentage_used"] = float(progress_match.group(1))
        return result

    return result  # Return with raw_text so we can inspect


def save_to_db(credits_data: dict):
    """Save credits data to xConvert24 D1 database via wrangler."""
    plan = credits_data.get("plan", "unknown")
    used = credits_data.get("credits_used", 0)
    total = credits_data.get("credits_total", 0)
    remaining = credits_data.get("credits_remaining", 0)
    pct = credits_data.get("percentage_used", 0)
    reset_date = credits_data.get("reset_date") or ""
    raw_text = credits_data.get("raw_text", "").replace("'", "''")[:2000]

    sql = (
        f"INSERT INTO kiro_credits (plan, credits_used, credits_total, credits_remaining, "
        f"percentage_used, reset_date, raw_text) VALUES "
        f"('{plan}', {used}, {total}, {remaining}, {pct}, "
        f"'{reset_date}', '{raw_text}');"
    )

    print(f"\n💾 Saving to D1 (dev)...")

    # Write to dev remote DB
    try:
        result = subprocess.run(
            [
                "npx", "wrangler", "d1", "execute", "BUGS_DB",
                "--remote", "--config", str(WRANGLER_CONFIG),
                "--command", sql,
            ],
            capture_output=True,
            text=True,
            cwd=str(PROJECT_ROOT),
            timeout=30,
        )
        if result.returncode == 0:
            print("✅ Saved to dev DB")
        else:
            print(f"⚠️  DB write warning: {result.stderr[:200]}")
    except Exception as e:
        print(f"❌ DB write failed: {e}")

    # Also try writing to local dev (via API if running)
    try:
        import urllib.request
        payload = json.dumps(credits_data).encode()
        req = urllib.request.Request(
            "http://localhost:4321/api/kiro-credits",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        urllib.request.urlopen(req, timeout=5)
        print("✅ Also posted to local dev API")
    except Exception:
        print("ℹ️  Local dev server not running (skipping local API write)")


def main():
    """Main entry point."""
    print("=" * 60)
    print("🤖 Kiro Credits Scraper")
    print("=" * 60)

    # Check if --headless flag is passed
    headless = "--headless" in sys.argv

    # First attempt
    credits_data = scrape_credits(headless=headless)

    if credits_data is None and headless:
        print("\n🔄 Retrying in headed mode for manual login...")
        credits_data = scrape_credits(headless=False)

    if credits_data:
        save_to_db(credits_data)
        print("\n✅ Done! Credit data saved.")
        print(f"   Plan: {credits_data.get('plan', 'unknown')}")
        print(f"   Used: {credits_data.get('credits_used', '?')}/{credits_data.get('credits_total', '?')}")
        print(f"   Remaining: {credits_data.get('credits_remaining', '?')}")
        print(f"   Usage: {credits_data.get('percentage_used', '?')}%")
        if credits_data.get("reset_date"):
            print(f"   Resets: {credits_data['reset_date']}")
    else:
        print("\n❌ Failed to scrape credits. Check browser login.")
        sys.exit(1)


if __name__ == "__main__":
    main()
