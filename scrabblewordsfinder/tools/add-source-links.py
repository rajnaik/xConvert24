#!/usr/bin/env python3
"""
Add hyperlinks to the Sources & References section on all blog pages.

Usage:
  python3 tools/add-source-links.py          # dry run
  python3 tools/add-source-links.py --apply  # modify files
"""
import os, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES_DIR = os.path.join(BASE, "src", "pages", "blog")
DRY_RUN = "--apply" not in sys.argv

# Old → New replacements
REPLACEMENTS = [
    (
        '<li>• SOWPODS International Dictionary (267,751 words), Collins + TWL combined</li>',
        '<li>• <a href="https://www.collinsdictionary.com/scrabble/" target="_blank" rel="noopener" class="underline hover:text-amber-300">SOWPODS International Dictionary</a> (267,751 words), Collins + TWL combined</li>'
    ),
    (
        '<li>• Tournament Word List (TWL06), NASPA Word List Committee</li>',
        '<li>• <a href="https://www.scrabbleplayers.org/" target="_blank" rel="noopener" class="underline hover:text-amber-300">Tournament Word List (TWL06)</a>, NASPA Word List Committee</li>'
    ),
    (
        '<li>• Collins Scrabble Words (CSW), HarperCollins Publishers</li>',
        '<li>• <a href="https://www.collinsdictionary.com/scrabble/" target="_blank" rel="noopener" class="underline hover:text-amber-300">Collins Scrabble Words (CSW)</a>, HarperCollins Publishers</li>'
    ),
    (
        '<li>• Tile distribution & values per Hasbro official Scrabble rules</li>',
        '<li>• Tile distribution & values per <a href="https://scrabble.hasbro.com/en-us" target="_blank" rel="noopener" class="underline hover:text-amber-300">Hasbro official Scrabble rules</a></li>'
    ),
]

count = 0

for filename in sorted(os.listdir(PAGES_DIR)):
    if not filename.endswith('.astro'):
        continue
    filepath = os.path.join(PAGES_DIR, filename)
    if not os.path.isfile(filepath):
        continue

    with open(filepath, 'r') as f:
        content = f.read()

    if 'Sources & References' not in content:
        continue

    # Skip if already has links
    if 'collinsdictionary.com/scrabble' in content:
        continue

    modified = content
    for old, new in REPLACEMENTS:
        modified = modified.replace(old, new)

    if modified != content:
        count += 1
        if not DRY_RUN:
            with open(filepath, 'w') as f:
                f.write(modified)

print(f"{'DRY RUN' if DRY_RUN else 'APPLIED'}: {count} pages {'would get' if DRY_RUN else 'got'} hyperlinked sources")
if DRY_RUN:
    print("Run with --apply to modify files.")
