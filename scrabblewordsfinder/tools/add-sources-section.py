#!/usr/bin/env python3
"""
Add "Sources & References" section to all blog pages, just above <AuthorInfo.
Only adds if not already present.

Usage:
  python3 tools/add-sources-section.py          # dry run
  python3 tools/add-sources-section.py --apply  # modify files
"""
import os, sys, re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES_DIR = os.path.join(BASE, "src", "pages", "blog")
DRY_RUN = "--apply" not in sys.argv

SOURCES_BLOCK = '''
<div class="not-prose mt-8 p-4 rounded-xl border border-gray-700 bg-gray-800/30">
  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">📚 Sources & References</p>
  <ul class="space-y-1 text-xs text-gray-400">
    <li>• SOWPODS International Dictionary (267,751 words), Collins + TWL combined</li>
    <li>• Tournament Word List (TWL06), NASPA Word List Committee</li>
    <li>• Collins Scrabble Words (CSW), HarperCollins Publishers</li>
    <li>• Tile distribution & values per Hasbro official Scrabble rules</li>
  </ul>
</div>
'''

count = 0
skipped = 0

for filename in sorted(os.listdir(PAGES_DIR)):
    if not filename.endswith('.astro'):
        continue
    filepath = os.path.join(PAGES_DIR, filename)
    if not os.path.isfile(filepath):
        continue

    with open(filepath, 'r') as f:
        content = f.read()

    # Skip if already has sources
    if 'Sources &amp; References' in content or 'Sources & References' in content:
        skipped += 1
        continue

    # Find insertion point: just before <AuthorInfo
    m = re.search(r'\n(\s*)<AuthorInfo', content)
    if not m:
        continue

    insertion_point = m.start()
    modified = content[:insertion_point] + '\n' + SOURCES_BLOCK + content[insertion_point:]

    if not DRY_RUN:
        with open(filepath, 'w') as f:
            f.write(modified)

    count += 1

print(f"{'DRY RUN' if DRY_RUN else 'APPLIED'}: {count} pages {'would get' if DRY_RUN else 'got'} Sources & References")
print(f"Skipped (already has it): {skipped}")

if DRY_RUN:
    print(f"\nRun with --apply to modify files.")
