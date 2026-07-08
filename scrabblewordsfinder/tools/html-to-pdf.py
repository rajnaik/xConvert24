#!/usr/bin/env python3
"""Convert cv-rajeev-naik.html to PDF using Playwright."""
from playwright.sync_api import sync_playwright
import os

DIR = os.path.dirname(os.path.abspath(__file__))
HTML = os.path.join(DIR, 'cv-rajeev-naik.html')
PDF = os.path.join(DIR, 'cv-rajeev-naik.pdf')

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto(f'file://{HTML}')
    page.pdf(
        path=PDF,
        format='A4',
        print_background=True,
        margin={'top': '20px', 'bottom': '20px', 'left': '20px', 'right': '20px'}
    )
    browser.close()
    print(f'PDF created: {PDF}')
