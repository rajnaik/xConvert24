#!/usr/bin/env python3
"""
inject-slugs.py — Inject inbound links for the 5 new "Is X a Scrabble word?" blog posts
into relevant existing blog pages.

New posts:
  - is-qi-a-scrabble-word
  - is-za-a-scrabble-word
  - is-ze-a-scrabble-word
  - is-qat-a-scrabble-word
  - is-ew-a-scrabble-word

Injection targets:
  1. Related Articles aside (appends a link card before </div></aside>)
  2. two-letter-words.astro main body (appends card blocks after existing "is-X" cards)
"""

import os
import re
import sys

BLOG_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "src", "pages", "blog"
)

# --- Configuration ---

# Each new slug and the pages it should be injected into
INJECTIONS = {
    "is-qi-a-scrabble-word": {
        "title": "Is QI a Scrabble Word?",
        "description": "Yes! QI is valid in both SOWPODS and TWL — the highest-scoring two-letter word at 11 points.",
        "targets_aside": [
            "two-letter-words-with-q.astro",
            "best-q-words-scrabble.astro",
        ],
        "targets_body_card": [
            "two-letter-words.astro",
        ],
    },
    "is-za-a-scrabble-word": {
        "title": "Is ZA a Scrabble Word?",
        "description": "Yes! ZA is valid — South African slang for pizza. A must-know two-letter Z word worth 11 points.",
        "targets_aside": [
            "two-letter-words-with-z.astro",
            "best-z-words-scrabble.astro",
        ],
        "targets_body_card": [
            "two-letter-words.astro",
        ],
    },
    "is-ze-a-scrabble-word": {
        "title": "Is ZE a Scrabble Word?",
        "description": "ZE is valid in SOWPODS but NOT in TWL — a gender-neutral pronoun added to Collins Scrabble Words.",
        "targets_aside": [
            "two-letter-words-with-z.astro",
            "rare-two-letter-scrabble-words.astro",
        ],
        "targets_body_card": [
            "two-letter-words.astro",
        ],
    },
    "is-qat-a-scrabble-word": {
        "title": "Is QAT a Scrabble Word?",
        "description": "Yes! QAT is valid — a plant whose leaves are chewed as a stimulant. Q without U for 12 points.",
        "targets_aside": [
            "three-letter-words-with-q.astro",
            "best-q-words-scrabble.astro",
        ],
        "targets_body_card": [],
    },
    "is-ew-a-scrabble-word": {
        "title": "Is EW a Scrabble Word?",
        "description": "EW is valid in TWL (added 2014) but NOT in SOWPODS — an exclamation of disgust worth 5 points.",
        "targets_aside": [
            "rare-two-letter-scrabble-words.astro",
            "two-letter-words-with-q.astro",  # cross-link variety
        ],
        "targets_body_card": [
            "two-letter-words.astro",
        ],
    },
}

# --- Templates ---

RELATED_ARTICLE_LINK = '''          <a href="/blog/{slug}/" class="flex items-center gap-3 p-3 rounded-lg border border-gray-800 hover:border-blue-700 hover:bg-blue-900/10 transition-all group">
            <span class="text-blue-400 group-hover:translate-x-0.5 transition-transform">\u2192</span>
            <span class="text-sm text-gray-300 group-hover:text-blue-400 transition-colors">{title}</span>
          </a>'''

BODY_CARD = '''
      <a href="/blog/{slug}/" class="block p-4 rounded-lg border border-gray-800 hover:border-blue-700 hover:bg-blue-900/10 transition-all group">
        <h2 class="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">{title}</h2>
        <p class="text-sm text-gray-400 mt-1">{description}</p>
      </a>'''


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
        print(f"  SKIP (already has link): {filepath}")
        return False

    # Find the closing </div> before </aside> in the Related Articles section
    # Pattern: look for the last </div> before </aside>
    pattern = r'(<!-- Related Articles -->.*?<div class="grid gap-3">)(.*?)(</div>\s*</aside>)'
    match = re.search(pattern, content, re.DOTALL)

    if not match:
        print(f"  SKIP (no Related Articles aside found): {filepath}")
        return False

    link_html = RELATED_ARTICLE_LINK.format(slug=slug, title=title)
    # Insert before the closing </div>
    new_content = content[:match.end(2)] + "\n" + link_html + content[match.end(2):]

    with open(full_path, "w", encoding="utf-8") as f:
        f.write(new_content)

    print(f"  INJECTED (Related Articles aside): {filepath}")
    return True


def inject_body_card(filepath, slug, title, description):
    """Inject a card block into the main body of a landing page (after existing is-X cards)."""
    full_path = os.path.join(BLOG_DIR, filepath)
    if not os.path.exists(full_path):
        print(f"  SKIP (not found): {filepath}")
        return False

    with open(full_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Check if already present
    if slug in content:
        print(f"  SKIP (already has card): {filepath}")
        return False

    # Find the last is-*-a-scrabble-word card block and insert after it
    # Pattern: find the last </a> that follows an is-*-a-scrabble-word href
    last_card_end = -1
    for m in re.finditer(r'<a href="/blog/is-\w+-a-scrabble-word/".*?</a>', content, re.DOTALL):
        last_card_end = m.end()

    if last_card_end == -1:
        # No existing is-X cards — find end of card section
        print(f"  SKIP (no existing is-X cards to append after): {filepath}")
        return False

    card_html = BODY_CARD.format(slug=slug, title=title, description=description)
    new_content = content[:last_card_end] + card_html + content[last_card_end:]

    with open(full_path, "w", encoding="utf-8") as f:
        f.write(new_content)

    print(f"  INJECTED (body card): {filepath}")
    return True


def main():
    print("=" * 60)
    print("Slug Link Injection Script")
    print("=" * 60)
    print()

    modified_files = set()

    for slug, config in INJECTIONS.items():
        print(f"\n--- {slug} ---")
        title = config["title"]
        description = config["description"]

        # Inject into Related Articles asides
        for target in config["targets_aside"]:
            if inject_into_related_aside(target, slug, title):
                modified_files.add(target)

        # Inject body cards into landing pages
        for target in config["targets_body_card"]:
            if inject_body_card(target, slug, title, description):
                modified_files.add(target)

    print("\n" + "=" * 60)
    print(f"DONE. Modified {len(modified_files)} file(s):")
    print("=" * 60)
    for f in sorted(modified_files):
        print(f"  src/pages/blog/{f}")
    print()

    return 0


if __name__ == "__main__":
    sys.exit(main())
