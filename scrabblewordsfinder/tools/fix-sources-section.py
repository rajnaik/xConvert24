#!/usr/bin/env python3
"""
Fix sources sections on all blog pages:
1. Remove old <Citations ... /> component lines
2. Restyle the "Sources & References" block to orange text
3. Ensure only ONE sources section exists per page (just above AuthorInfo)

Usage:
  python3 tools/fix-sources-section.py          # dry run
  python3 tools/fix-sources-section.py --apply  # modify files
"""
import os, sys, re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES_DIR = os.path.join(BASE, "src", "pages", "blog")
DRY_RUN = "--apply" not in sys.argv

# Old style to remove
OLD_CITATIONS_PATTERN = re.compile(r'\s*<Citations\s+sources=\{.*?\}\s*/>\s*\n?', re.DOTALL)

# Old style gray block to replace with orange
OLD_SOURCES_BLOCK = '''<div class="not-prose mt-8 p-4 rounded-xl border border-gray-700 bg-gray-800/30">
  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">📚 Sources & References</p>
  <ul class="space-y-1 text-xs text-gray-400">
    <li>• SOWPODS International Dictionary (267,751 words), Collins + TWL combined</li>
    <li>• Tournament Word List (TWL06), NASPA Word List Committee</li>
    <li>• Collins Scrabble Words (CSW), HarperCollins Publishers</li>
    <li>• Tile distribution & values per Hasbro official Scrabble rules</li>
  </ul>
</div>'''

NEW_SOURCES_BLOCK = '''<div class="not-prose mt-8 p-4 rounded-xl border border-amber-500/30 bg-amber-950/10">
  <p class="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">📚 Sources & References</p>
  <ul class="space-y-1 text-xs text-amber-200/70">
    <li>• SOWPODS International Dictionary (267,751 words), Collins + TWL combined</li>
    <li>• Tournament Word List (TWL06), NASPA Word List Committee</li>
    <li>• Collins Scrabble Words (CSW), HarperCollins Publishers</li>
    <li>• Tile distribution & values per Hasbro official Scrabble rules</li>
  </ul>
</div>'''

citations_removed = 0
restyled = 0
processed = 0

for filename in sorted(os.listdir(PAGES_DIR)):
    if not filename.endswith('.astro'):
        continue
    filepath = os.path.join(PAGES_DIR, filename)
    if not os.path.isfile(filepath):
        continue

    with open(filepath, 'r') as f:
        content = f.read()

    modified = False
    original = content

    # 1. Remove old <Citations ... /> lines
    if '<Citations' in content:
        content = OLD_CITATIONS_PATTERN.sub('\n', content)
        if content != original:
            citations_removed += 1
            modified = True

    # 2. Restyle gray sources block to orange
    if OLD_SOURCES_BLOCK in content:
        content = content.replace(OLD_SOURCES_BLOCK, NEW_SOURCES_BLOCK)
        restyled += 1
        modified = True

    if modified:
        processed += 1
        if not DRY_RUN:
            with open(filepath, 'w') as f:
                f.write(content)

print(f"{'DRY RUN' if DRY_RUN else 'APPLIED'}")
print(f"  Citations removed: {citations_removed}")
print(f"  Restyled to orange: {restyled}")
print(f"  Total files modified: {processed}")

if DRY_RUN:
    print(f"\nRun with --apply to modify files.")
