#!/usr/bin/env python3
"""
boost-weak-links.py — Add 1 inbound link to each of the 20 weakly-linked blog pages.
Each injection goes into the "Related Articles" aside of a relevant existing page.
"""

import os
import re
import sys

BLOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "pages", "blog")

# Mapping: slug to inject → (target file to inject INTO, link title)
INJECTIONS = [
    # "is-X" posts: inject into relevant category pages
    ("is-aa-a-scrabble-word", "rare-two-letter-scrabble-words.astro", "Is AA a Scrabble Word? — Volcanic lava in two letters"),
    ("is-jo-a-scrabble-word", "two-letter-words-with-j.astro", "Is JO a Scrabble Word? — The only two-letter J word"),
    ("is-ox-a-scrabble-word", "best-x-words-scrabble.astro", "Is OX a Scrabble Word? — 9-point two-letter X play"),
    ("is-xi-a-scrabble-word", "best-x-words-scrabble.astro", "Is XI a Scrabble Word? — Greek letter for X placement"),
    ("is-xu-a-scrabble-word", "best-x-words-scrabble.astro", "Is XU a Scrabble Word? — Vietnamese unit for X plays"),

    # Two-letter word guides with specific letters
    ("two-letter-words-with-j", "two-letter-words-with-k.astro", "Two-Letter Words With J — Essential J plays"),
    ("two-letter-words-with-k", "two-letter-words-with-j.astro", "Two-Letter Words With K — Essential K plays"),
    ("two-letter-words-with-v", "two-letter-words-with-k.astro", "Two-Letter Words With V — Essential V plays"),

    # 4-letter words with J
    ("4-letter-words-with-j", "words-starting-with-j.astro", "4-Letter Words With J — Short J words for tight spots"),

    # Strategy posts
    ("playing-with-a-lead", "endgame-strategy.astro", "Playing With a Lead — Protect your advantage in Scrabble"),
    ("scrabble-exchange-tiles-strategy", "rack-management-basics.astro", "Exchange Tiles Strategy — When to swap for better letters"),

    # Vocabulary/misc posts
    ("best-scrabble-words-with-blank", "highest-scoring-scrabble-words.astro", "Best Scrabble Words With a Blank — Maximize wild tiles"),
    ("scrabble-go-tips", "offensive-scrabble-strategy.astro", "Scrabble GO Tips — Digital Scrabble strategy guide"),
    ("scrabble-night-party-ideas", "scrabble-history-origins-great-depression.astro", "Scrabble Night Party Ideas — Host the perfect game night"),
    ("scrabble-word-lists-pdf", "two-letter-scrabble-words-complete-list.astro", "Scrabble Word Lists PDF — Printable study references"),
    ("scrabble-words-with-x-and-z", "best-x-words-scrabble.astro", "Words With X and Z — High-scoring rare letter combos"),

    # Landing/hub pages — inject into a post that's in that category
    ("fun-facts", "scrabble-history-origins-great-depression.astro", "Scrabble Fun Facts — Surprising trivia about the game"),
    ("prefix-guides", "best-two-letter-words-scrabble.astro", "Prefix Guides — Master word beginnings for Scrabble"),
    ("word-patterns", "best-two-letter-words-scrabble.astro", "Word Patterns — Common letter combinations to memorize"),

    # ZA duplicate slug
    ("za-scrabble-word", "two-letter-words-with-z.astro", "ZA in Scrabble — South African slang worth 11 points"),
]

LINK_TEMPLATE = '          <a href="/blog/{slug}/" class="flex items-center gap-3 p-3 rounded-lg border border-gray-800 hover:border-blue-700 hover:bg-blue-900/10 transition-all group">\n            <span class="text-blue-400 group-hover:translate-x-0.5 transition-transform">\u2192</span>\n            <span class="text-sm text-gray-300 group-hover:text-blue-400 transition-colors">{title}</span>\n          </a>'


def inject_into_related_aside(filepath, slug, title):
    """Inject a link into the Related Articles aside section."""
    full_path = os.path.join(BLOG_DIR, filepath)
    if not os.path.exists(full_path):
        print(f"  SKIP (not found): {filepath}")
        return False

    with open(full_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Check if already present
    if slug in content:
        print(f"  SKIP (already linked): {filepath}")
        return False

    # Find the Related Articles grid section
    pattern = r'(<!-- Related Articles -->.*?<div class="grid gap-3">)(.*?)(</div>\s*</aside>)'
    match = re.search(pattern, content, re.DOTALL)

    if not match:
        print(f"  SKIP (no Related Articles aside): {filepath}")
        return False

    link_html = LINK_TEMPLATE.format(slug=slug, title=title)
    new_content = content[:match.end(2)] + "\n" + link_html + content[match.end(2):]

    with open(full_path, "w", encoding="utf-8") as f:
        f.write(new_content)

    print(f"  INJECTED into {filepath}")
    return True


def main():
    print("=" * 60)
    print("Boost Weak Links — Adding 1 inbound link to each page")
    print("=" * 60)
    print()

    modified_files = set()
    success = 0
    skipped = 0

    for slug, target_file, title in INJECTIONS:
        print(f"  {slug} → {target_file}")
        if inject_into_related_aside(target_file, slug, title):
            modified_files.add(target_file)
            success += 1
        else:
            skipped += 1

    print()
    print("=" * 60)
    print(f"DONE. Injected: {success}, Skipped: {skipped}")
    print(f"Modified {len(modified_files)} file(s):")
    print("=" * 60)
    for f in sorted(modified_files):
        print(f"  src/pages/blog/{f}")
    print()

    return 0


if __name__ == "__main__":
    sys.exit(main())
